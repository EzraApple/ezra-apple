# /// script
# requires-python = ">=3.11"
# dependencies = ["pypdf>=6,<7"]
# ///
"""Extract the approved one-page PDF, never the private resume source/research.

Usage: uv run scripts/sync_resume.py [path/to/approved/resume.pdf]
Requires Poppler's pdftotext. The parser deliberately supports the current layout
only and rejects unsupported sections instead of silently dropping content.
"""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlparse

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent


def parse_entries(lines, dated):
    entries = []
    for line in lines:
        if " | " in line and not line.startswith("•"):
            left, right = line.split(" | ", 1)
            if dated:
                role, dates = re.split(r"\s{2,}", right)
                entries.append(dict(organization=left, role=role, dates=dates, highlights=[]))
            else:
                entries.append(dict(name=left, description=right, highlights=[]))
        elif line.startswith("•"):
            entries[-1]["highlights"].append(line[1:].strip())
        else:
            entries[-1]["highlights"][-1] += " " + line
    if not entries or any(not entry["highlights"] for entry in entries):
        raise ValueError("Missing resume entries or highlights")
    return entries


def extract_resume(source):
    reader = PdfReader(source)
    if len(reader.pages) != 1:
        raise ValueError("Expected the approved one-page resume; review parser before changing layout")
    text = subprocess.check_output(["pdftotext", "-layout", str(source), "-"], text=True)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    headings = ["Education", "Experience", "Projects", "Skills"]
    indices = [lines.index(heading) for heading in headings]
    if indices != sorted(indices) or indices[0] != 3:
        raise ValueError("Unexpected resume headings/header; review extraction")
    sections = {name: lines[start + 1:end] for name, start, end in
                zip(headings, indices, indices[1:] + [len(lines)])}
    education_lines = sections["Education"]
    if len(education_lines) % 2:
        raise ValueError("Unexpected education layout")
    education = []
    for offset in range(0, len(education_lines), 2):
        institution, date = re.split(r"\s{2,}", education_lines[offset])
        education.append(dict(institution=institution, date=date, degree=education_lines[offset + 1]))
    skills = []
    for line in sections["Skills"]:
        category, items = line.split(": ", 1)
        skills.append(dict(category=category, items=items.split(", ")))
    # Contact links occupy the top annotation row; lower rows are employer/project links.
    annotations = [item.get_object() for item in reader.pages[0].get("/Annots", [])]
    urls = [item for item in annotations if item.get("/A", {}).get("/URI")]
    top = max(float(item["/Rect"][3]) for item in urls)
    links = []
    for item in urls:
        if abs(float(item["/Rect"][3]) - top) > 1:
            continue
        href = str(item["/A"]["/URI"])
        url = urlparse(href)
        if url.scheme not in ("https", "mailto"):
            raise ValueError("Unexpected contact URL scheme")
        label = {"github.com": "GitHub", "linkedin.com": "LinkedIn"}.get(url.netloc)
        links.append(dict(label=label or ("Email" if url.scheme == "mailto" else "Website"), href=href))
    if not links:
        raise ValueError("Missing resume contact links")
    emphasis = []
    def record_emphasis(value, _cm, _tm, font, _size):
        if font and "CMBX" in str(font.get("/BaseFont", "")):
            phrase = " ".join(value.split())
            if phrase and phrase not in emphasis:
                emphasis.append(phrase)
    reader.pages[0].extract_text(visitor_text=record_emphasis)
    return dict(name=lines[0], headline=lines[1], links=links, education=education,
                experience=parse_entries(sections["Experience"], True),
                projects=parse_entries(sections["Projects"], False), skills=skills,
                emphasis=emphasis, pdfSha256=hashlib.sha256(source.read_bytes()).hexdigest())


if __name__ == "__main__":
    source = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "public/resume.pdf"
    data = extract_resume(source)
    # Finish parsing before replacing either artifact. Builds verify the paired hash.
    (ROOT / "content/resume.generated.json").write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    destination = ROOT / "public/resume.pdf"
    if source != destination.resolve():
        destination.write_bytes(source.read_bytes())
    print(f"Synced {len(data['experience'])} roles, {len(data['projects'])} projects and {len(data['skills'])} skill groups from the approved PDF.")
