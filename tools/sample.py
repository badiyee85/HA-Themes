#!/usr/bin/env python3
"""Print the colour at named points / a column profile of a screenshot."""
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); px = im.load()
h = lambda c: '#%02x%02x%02x' % c
for arg in sys.argv[2:]:
    if arg.startswith('col='):
        x = int(arg[4:]); prev = None
        for y in range(im.height):
            c = h(px[x, y])
            if c != prev: print(f'  x={x} y={y}: {c}'); prev = c
    elif arg.startswith('row='):
        y = int(arg[4:]); prev = None
        for x in range(im.width):
            c = h(px[x, y])
            if c != prev: print(f'  y={y} x={x}: {c}'); prev = c
    else:
        x, y = map(int, arg.split(','))
        print(f'{x},{y}: {h(px[x, y])}')
