#!/usr/bin/env python3
"""Pretty-print a probe.json produced by tools/probes/leftovers.js."""
import json
import sys

d = json.load(open(sys.argv[1]))
print("FONTS", d["fonts"])
for k in ("radius", "shadow", "blur", "translucent"):
    print("##", k, len(d[k]))
    for x in d[k]:
        print("  ", {kk: v for kk, v in x.items() if kk != "cls"}, "|", x["cls"][:90])
