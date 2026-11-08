#!/usr/bin/env python3
"""Phase 2 acceptance: delivery manifest and file checks."""
import json, os, struct, collections

ROOT = '/home/daniebo/Desktop/advantage-forge'
DEL = ROOT + '/out/storytime/l2/unit2/delivery-muse-v1'
RUN = ROOT + '/measure/runs/asset_storytime_l2_unit2_pictures_20261108'
m = json.load(open(DEL + '/manifest.json'))
jobs = m['jobs']


def png_hdr(p):
    with open(p, 'rb') as f:
        d = f.read(33)
    assert d[:8] == b'\x89PNG\r\n\x1a\n', 'bad magic ' + p
    w, h, bd, ct = struct.unpack('>IIBB', d[16:26])
    return w, h, bd, ct


bad = []
sizes = collections.Counter()
for j in jobs:
    for c in j['candidates']:
        files = [c['file']]
        if c.get('lineArt'):
            files.append(c['lineArt']['file'])
        for fn in files:
            p = os.path.join(DEL, fn)
            if not os.path.exists(p):
                bad.append(('missing', fn))
                continue
            w, h, bd, ct = png_hdr(p)
            sizes[(w, h, bd, ct)] += 1
            isline = '-line-' in fn
            if bd != 8:
                bad.append(('bitdepth', fn, bd))
            if isline and ct != 0:
                bad.append(('line not grayscale', fn, ct))
            if (not isline) and ct != 2:
                bad.append(('color not rgb', fn, ct))
print('checked', sum(sizes.values()), 'files')
print('sizes', sizes)
print('bad', len(bad))
for b in bad[:15]:
    print('  ', b)

appr = {e['rowId'] for e in json.load(open(RUN + '/approvals-u2.json'))['entries']}
inman = {j['id'] for j in jobs}
print('jobs', len(jobs), 'approved rows not in manifest:', sorted(appr - inman))
print('manifest rows not approved:', len(inman - appr))
# class sizes per job use
u = collections.Counter((j['use'], j['size']) for j in jobs)
print('use/size', u)
cls = collections.Counter()
for j in jobs:
    for c in j['candidates']:
        for fn in [c['file']] + ([c['lineArt']['file']] if c.get('lineArt') else []):
            w, h, bd, ct = png_hdr(os.path.join(DEL, fn))
            cls[(j['size'], fn.split('-')[-1].replace('.png', '') if '-line-' not in fn else 'line', w, h)] += 1
print('class x kind x size', cls)
