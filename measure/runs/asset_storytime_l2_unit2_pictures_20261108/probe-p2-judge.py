#!/usr/bin/env python3
"""Map every approved print to a judge pass. Phase 2 acceptance probe."""
import json, glob, os, re, sys

RUN = '/home/daniebo/Desktop/advantage-forge/measure/runs/asset_storytime_l2_unit2_pictures_20261108'
OUT = '/home/daniebo/Desktop/advantage-forge/out'

passes = {}   # (row, kind, try) -> [judge files]
entries = []
for f in sorted(glob.glob(RUN + '/judge-u2-*.json')):
    d = json.load(open(f))
    for r in d.get('results', []):
        jf = r.get('judgeFile')
        m = re.search(r'-color-t(\d+)\.png$', jf or '')
        kind = 'color'
        if not m:
            m = re.search(r'-line-t(\d+)\.png$', jf or '')
            kind = 'line'
        try_no = int(m.group(1)) if m else None
        if try_no is None:
            entries.append(('UNPARSED', f, jf))
            continue
        key = (r['id'], kind, try_no)
        if r.get('verdict') == 'pass':
            passes.setdefault(key, []).append(os.path.basename(f))
        entries.append((r.get('verdict'), f, r['id'], kind, try_no))

appr = json.load(open(RUN + '/approvals-u2.json'))['entries']
missing = []
desp = []
for e in appr:
    row = e['rowId']
    cm = re.search(r'-m(\d+)-color-print\.png$', e['colorPrint'])
    cv = int(cm.group(1))
    lm = re.search(r'-line-print-(\d+)?', e['linePrint'])
    tstr = re.search(r'-line-print-(\d+)', e['linePrint'])
    lt = int(tstr.group(1)) if tstr else 1
    if '-despeckled' in e['linePrint']:
        desp.append((row, lt))
    if (row, 'color', cv) not in passes:
        missing.append(('color', row, cv))
    if (row, 'line', lt) not in passes:
        missing.append(('line', row, lt))

print('approval rows:', len(appr))
print('judge entries parsed:', len(entries), 'unparsed:', sum(1 for x in entries if x[0] == 'UNPARSED'))
print('pass keys:', len(passes))
print('MISSING PASS:', len(missing))
for x in missing:
    print('  ', x)
print('despeckled rows:', desp)
# per-file model/prompt check
bad = []
for f in sorted(glob.glob(RUN + '/judge-u2-*.json')):
    d = json.load(open(f))
    if d.get('model') != 'claude-code/claude-sonnet-5-5#high':
        bad.append((f, d.get('model')))
    if 'judge-prompt.md v6' not in d.get('judgePrompt', ''):
        bad.append((f, d.get('judgePrompt')))
    if d.get('status') != 'complete':
        bad.append((f, 'status ' + str(d.get('status'))))
print('judge files with wrong model/prompt/status:', bad)
print('judge file count:', len(glob.glob(RUN + '/judge-u2-*.json')))
