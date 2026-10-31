#!/usr/bin/env python3
"""Side-by-side composite: reference/target.png | a run's screenshot.

Usage: tools/compare.py <run-label> [shot-name]   -> shots/run-<label>/compare-<shot>.png
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
label = sys.argv[1]
shot = sys.argv[2] if len(sys.argv) > 2 else "1-empty"
ref = Image.open(ROOT / "reference" / "winforms-target.png").convert("RGB")
mine = Image.open(ROOT / "shots" / f"run-{label}" / f"{shot}.png").convert("RGB")
h = max(ref.height, mine.height) + 24
out = Image.new("RGB", (ref.width + mine.width + 16, h), "#808080")
out.paste(ref, (0, 24))
out.paste(mine, (ref.width + 16, 24))
d = ImageDraw.Draw(out)
d.text((6, 6), "REFERENCE", fill="white")
d.text((ref.width + 22, 6), f"HERMES + WinForms theme ({label}/{shot})", fill="white")
path = ROOT / "shots" / f"run-{label}" / f"compare-{shot}.png"
out.save(path)
print(path)
