#!/usr/bin/env python3
"""Pretty-print a probe.json produced by tools/probes/parts.js."""
import json, sys
d = json.load(open(sys.argv[1]))
def show(x, ind=''):
    if x is None:
        print(ind + 'None'); return
    print(f"{ind}{x['tag']} slot={x.get('slot')} r={x['r']} bg={x['bg']} color={x['color']} font={x['font']} [{x['attrs']}]\n{ind}   cls={(x['cls'] or '')[:500]}")
for h in d.get('headers', []):
    print('### HEADER'); show(h['grand'], '  G '); show(h['parent'], '  P '); show(h['self'], '  S ')
    for t in h['tabs']: show(t, '    T ')
for k, v in d.items():
    if k == 'headers': continue
    print('###', k)
    for x in (v if isinstance(v, list) else [v]): show(x, '  ')
