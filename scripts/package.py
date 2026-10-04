"""Build a reproducible Chrome Web Store ZIP using an explicit runtime allowlist."""
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / "manifest.json").read_text())
files = ["manifest.json", "popup.html", "popup.css", "popup.js", "meet.js", "order.js"]
files += sorted(set(manifest["icons"].values()) | set(manifest["action"]["default_icon"].values()))
output = root / "dist" / f"meet-speaking-order-{manifest['version']}.zip"
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for name in files:
        info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        archive.writestr(info, (root / name).read_bytes())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert "manifest.json" in archive.namelist()
print(f"Created {output} ({output.stat().st_size:,} bytes; {len(files)} files)")
