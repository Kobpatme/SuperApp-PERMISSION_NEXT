"""Compare the immutable baseline/current Core fixture screenshots exactly."""
from pathlib import Path
import json
from PIL import Image, ImageChops

root = Path("docs/quality/duct-rental").resolve()
results = []
for before in sorted(root.glob("core-*-before.png")):
    after = before.with_name(before.name.replace("-before.png", "-after.png"))
    first, second = Image.open(before).convert("RGB"), Image.open(after).convert("RGB")
    if first.size != second.size:
        results.append({"view": before.stem.removesuffix("-before"), "passed": False, "reason": "dimensions"})
        continue
    difference = ImageChops.difference(first, second)
    pixels = sum(1 for value in difference.getdata() if value != (0, 0, 0))
    results.append({"view": before.stem.removesuffix("-before"), "passed": pixels == 0, "changedPixels": pixels, "totalPixels": first.width * first.height, "bounds": difference.getbbox()})
report = {"baseline": "5f32a111", "maskedDynamicContent": [".updated-at", ".work-live-refresh time"], "pairs": results}
(root / "core-comparison.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps({"pairs": len(results), "passed": sum(item["passed"] for item in results), "differences": [item for item in results if not item["passed"]]}))
raise SystemExit(0 if len(results) >= 13 and all(item["passed"] for item in results) else 1)
