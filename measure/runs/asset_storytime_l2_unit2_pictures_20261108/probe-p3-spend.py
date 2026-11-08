#!/usr/bin/env python3
"""P3 acceptance probe: app and book spend from costs.tsv files."""
import csv, glob, os, sys
from datetime import datetime, timezone

START = datetime(2026, 11, 8, 13, 39, 0, tzinfo=timezone.utc)
APP = 'out/storytime/l2/unit2/family-words/muse/costs.tsv'


def parse_time(s):
    s = s.strip()
    if s.endswith('Z'):
        s = s[:-1] + '+00:00'
    return datetime.fromisoformat(s)


def rows_of(path):
    out = []
    with open(path, newline='', encoding='utf-8') as f:
        rd = csv.DictReader(f, delimiter='\t')
        for r in rd:
            r = { (k or '').strip(): (v or '').strip() for k, v in r.items() }
            out.append(r)
    return out


print('app costs file exists:', os.path.exists(APP))
app_rows = rows_of(APP) if os.path.exists(APP) else []
print('app rows total:', len(app_rows))
print('app header:', list(app_rows[0].keys()) if app_rows else '-')

costkey = None
for k in (app_rows[0].keys() if app_rows else []):
    if 'cost' in k.lower() and 'usd' in k.lower() or k.lower() in ('usage_cost', 'cost'):
        costkey = k
        break
print('cost column:', costkey)

app_since = []
for r in app_rows:
    t = parse_time(r['time'])
    if t >= START:
        app_since.append((r, float(r[costkey])))
app_sum = sum(c for _, c in app_since)
print('app rows since start:', len(app_since))
print('app spend USD: %.6f' % app_sum)
print('app spend == 0.18:', abs(app_sum - 0.18) < 5e-9)
print('app spend <= 0.29:', app_sum <= 0.29 + 1e-12)
over = [(r.get('row') or r.get('id'), c) for r, c in app_since if c > 0.03 + 1e-12]
print('app rows above 0.03:', len(over), over[:5])
print('app highest row cost: %.6f' % max((c for _, c in app_since), default=0.0))
times = sorted(r['time'] for r, _ in app_since)
print('app row time range:', times[0] if times else '-', '..', times[-1] if times else '-')
# distinct ids count
ids = sorted({r.get('row') or r.get('id') for r, _ in app_since})
print('app distinct ids:', len(ids))

# book total: every costs.tsv under out/storytime/l2/unit2/w*
book_files = sorted(glob.glob('out/storytime/l2/unit2/w*/costs.tsv') + glob.glob('out/storytime/l2/unit2/w*/**/costs.tsv', recursive=True))
book_files = sorted(set(book_files))
print('book cost files:', len(book_files))
book_sum = 0.0
for p in book_files:
    bk = None
    for r in rows_of(p)[:1]:
        for k in r:
            if k.lower() in ('usage_cost', 'cost'):
                bk = k
    if bk is None:
        print('  no cost col in', p)
        continue
    s = sum(float(r[bk]) for r in rows_of(p))
    book_sum += s
print('book spend USD: %.6f' % book_sum)
print('book spend == 4.32:', abs(book_sum - 4.32) < 5e-9)

# app total rows of every file under family-words (any costs.tsv)
fw_all = sorted(glob.glob('out/storytime/l2/unit2/family-words/**/costs.tsv', recursive=True))
print('family-words cost files:', fw_all)
fw_sum = 0.0
for p in fw_all:
    rows = rows_of(p)
    bk = 'usage_cost' if rows and 'usage_cost' in rows[0] else ('cost' if rows and 'cost' in rows[0] else None)
    if bk is None:
        continue
    tot = sum(float(r[bk]) for r in rows)
    since = sum(float(r[bk]) for r in rows if parse_time(r['time']) >= START)
    print('  %s rows=%d total=%.4f since=%.4f' % (p, len(rows), tot, since))
    fw_sum += tot
print('family-words spend (all rows, all files): %.6f' % fw_sum)
