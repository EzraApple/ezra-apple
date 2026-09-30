# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow", "fonttools", "brotli"]
# ///
"""Run `npm run build`, then `uv run scripts/generate_share_image.py`."""

from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path
import textwrap
from urllib.parse import urlparse

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent


class ShareMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.description = ""
        self.origin = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and attrs.get("property") == "og:description":
            self.description = attrs["content"]
        if tag == "meta" and attrs.get("property") == "og:url":
            self.origin = attrs["content"]


metadata = ShareMetadata()
metadata.feed((ROOT / "dist/client/index.html").read_text())
assert metadata.description and "__PROFILE_DESCRIPTION__" not in metadata.description

font_source = ROOT / "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2"
font = TTFont(font_source)
font.flavor = None
font_bytes = BytesIO()
font.save(font_bytes)

image = Image.new("RGB", (2400, 1260), "#1c1d1f")
draw = ImageDraw.Draw(image)


def text(position, value, size, color):
    face = ImageFont.truetype(BytesIO(font_bytes.getvalue()), size * 2)
    draw.text(tuple(coordinate * 2 for coordinate in position), value, font=face, fill=color, anchor="lt")


text((96, 182), "Ezra Apple", 72, "#e3e5e8")
for index, line in enumerate(textwrap.wrap(metadata.description, width=45, break_on_hyphens=False)):
    text((100, 302 + index * 43), line, 26, "#a3a7ad")
text((100, 518), urlparse(metadata.origin).netloc, 20, "#a3a7ad")
image.resize((1200, 630), Image.Resampling.LANCZOS).save(ROOT / "public/og.png")
