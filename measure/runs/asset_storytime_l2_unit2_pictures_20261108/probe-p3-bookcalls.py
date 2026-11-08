#!/usr/bin/env python3
"""P3 acceptance probe: book call counts and kind split, as the PM report claims."""
import csv
import glob
from collections import Counter

files = sorted(glob.glob('out/storytime/l2/unit2/w*/**/costs.tsv', recursive=True))
rows = []
for p in files:
    with open(p, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter='\t'):
            r = {(k or '').strip(): (v or '').strip() for k, v in r.items()}
            r['_file'] = p
            rows.append(r)

print('cost files:', len(files))
print('rows:', len(rows))
kinds = Counter(r['kind'] for r in rows)
print('kinds:', dict(kinds))
by_kind = {}
for r in rows:
    by_kind[r['kind']] = by_kind.get(r['kind'], 0.0) + float(r['usage_cost'])
print('spend by kind:', {k: round(v, 4) for k, v in by_kind.items()})
print('total:', round(sum(float(r['usage_cost']) for r in rows), 4))
print('zero-cost rows:', sum(1 for r in rows if float(r['usage_cost']) == 0))
print('highest call:', max(float(r['usage_cost']) for r in rows))
print('rows above 0.03:', [r['row'] for r in rows if float(r['usage_cost']) > 0.03])
print('files:', files)
