#!/usr/bin/env python3
"""Phase 2 acceptance: hand-off folder check (hash lines, coverage, equality with delivery)."""
import hashlib, os, glob, sys

HO = '/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures'
DEL = '/home/daniebo/Desktop/advantage-forge/out/storytime/l2/unit2/delivery-muse-v1'

ok = failed = 0
badlines = []
checked = set()
for line in open(HO + '/MANIFEST.txt'):
    line = line.rstrip('\n')
    if not line.strip():
        continue
    parts = line.split(None, 1)
    if len(parts) != 2:
        badlines.append(('malformed', line))
        continue
    h, name = parts[0].lower(), parts[1].strip()
    p = os.path.join(HO, name.lstrip('*'))
    if not os.path.exists(p):
        failed += 1
        badlines.append(('missing', name))
        continue
    d = hashlib.sha256(open(p, 'rb').read()).hexdigest()
    if d != h:
        failed += 1
        badlines.append(('hash', name))
    else:
        ok += 1
    checked.add(os.path.normpath(name))
print('MANIFEST.txt lines OK:', ok, 'FAILED:', failed)
for b in badlines[:10]:
    print('  ', b)

allfiles = set()
for root, dirs, files in os.walk(HO):
    for f in files:
        rel = os.path.relpath(os.path.join(root, f), HO)
        allfiles.add(rel)
print('files in hand-off:', len(allfiles))
print('not listed in MANIFEST.txt:', sorted(allfiles - checked))

# delivered PNG equality
dpng = set(os.path.relpath(p, DEL) for p in glob.glob(DEL + '/*.png'))
hdel = set(os.path.relpath(p, HO) for p in glob.glob(HO + '/*.png'))
print('delivery PNGs:', len(dpng), 'hand-off root PNGs:', len(hdel))
mismatch = []
for f in sorted(dpng):
    a = os.path.join(DEL, f)
    b = os.path.join(HO, f)
    if not os.path.exists(b):
        mismatch.append(('absent', f))
    elif hashlib.sha256(open(a, 'rb').read()).hexdigest() != hashlib.sha256(open(b, 'rb').read()).hexdigest():
        mismatch.append(('hash', f))
print('delivered files not equal in hand-off:', len(mismatch), mismatch[:5])
print('extra hand-off root PNGs (not in delivery):', sorted(hdel - dpng))
