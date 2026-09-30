import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const data = JSON.parse(readFileSync(new URL("content/resume.generated.json", root), "utf8"));
const hash = createHash("sha256").update(readFileSync(new URL("public/resume.pdf", root))).digest("hex");
if (data.pdfSha256 !== hash) {
  throw new Error("Resume PDF and structured content differ. Run: uv run scripts/sync_resume.py");
}
