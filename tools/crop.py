#!/usr/bin/env python3
"""tools/crop.py <png> x y w h [scale] -> <png>.crop-x-y.png (nearest-neighbour zoom)."""
import sys
from PIL import Image
src, x, y, w, h = sys.argv[1], *map(int, sys.argv[2:6])
s = int(sys.argv[6]) if len(sys.argv) > 6 else 2
im = Image.open(src).convert('RGB').crop((x, y, x + w, y + h))
im = im.resize((w * s, h * s), Image.NEAREST)
out = f"{src[:-4]}.crop-{x}-{y}.png"; im.save(out); print(out)
