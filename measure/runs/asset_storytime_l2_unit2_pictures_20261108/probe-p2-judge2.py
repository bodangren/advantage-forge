#!/usr/bin/env python3
"""Phase 2 acceptance: map each approved print to the judge pass of the same call.

The line try number comes from the order of the line calls of a row in costs.tsv, because the
judge copy name `<row>-line-t<N>.png` counts line calls, while the print file name
`<row>-m<C>-line-print[-<L>].png` names the color attempt C and the same-color retry L.
"""
import json, glob, os, re, csv

ROOT = '/home/daniebo/Desktop/advantage-forge'
RUN = ROOT + '/measure/runs/asset_storytime_l2_unit2_pictures_20261108'

# 1. line/color call order per row from costs.tsv
order = {}   # (row, kind) -> {output file name: ordinal}
for f in sorted(glob.glob(ROOT + '/out/storytime/l2/unit2/w*/muse/costs.tsv')
               + glob.glob(ROOT + '/out/storytime/l2/unit2/w*/muse/elements/costs.tsv')):
    for r in csv.DictReader(open(f), delimiter='\t'):
        k = r['kind']
        n = order.setdefault((r['row'], k), [])
        n.append(r['output'])

# 2. judge passes per (row, kind, try)
passes, fails = {}, {}
for f in sorted(glob.glob(RUN + '/judge-u2-*.json')):
    d = json.load(open(f))
    for r in d.get('results', []):
        jf = r.get('judgeFile') or ''
        m = re.search(r'-color-t(\d+)\.png$', jf) or re.search(r'-line-t(\d+)\.png$', jf)
        kind = 'color' if '-color-t' in jf else 'line'
        if not m:
            continue
        key = (r['id'], kind, int(m.group(1)))
        tgt = passes if r.get('verdict') == 'pass' else fails
        tgt.setdefault(key, []).append(os.path.basename(f))

appr = json.load(open(RUN + '/approvals-u2.json'))['entries']
missing, matched = [], []
for e in appr:
    row = e['rowId']
    cm = re.search(r'-m(\d+)-color-print\.png$', e['colorPrint'])
    lm = re.search(r'-m(\d+)-line-print(?:-(\d+))?', e['linePrint'])
    c_out = f'{row}-m{cm.group(1)}-color.png'
    l_retry = lm.group(2) or ''
    l_out = f'{row}-m{lm.group(1)}-line{("-" + l_retry) if l_retry else ""}.png'
    co = order.get((row, 'color'), [])
    lo = order.get((row, 'line'), [])
    ct = co.index(c_out) + 1 if c_out in co else None
    lt = lo.index(l_out) + 1 if l_out in lo else None
    for kind, t in (('color', ct), ('line', lt)):
        if t is None:
            missing.append((kind, row, 'no costs.tsv row for ' + (c_out if kind == 'color' else l_out)))
        elif (row, kind, t) not in passes:
            missing.append((kind, row, f'try {t} has no pass judge (failed in {sorted(set(fails.get((row,kind,t),[]))) or "no judge entry"})'))
        else:
            matched.append((kind, row, t))

print('approval rows:', len(appr))
print('mapped prints:', len(matched))
print('MISSING PASS:', len(missing))
for x in missing:
    print('  ', x)
