#!/usr/bin/env python3
"""P3 acceptance probe: hand-off folder listings and hard links."""
import os
import re

APPDIR = '/home/daniebo/Desktop/handoff/storytime-l2u2-family-word-pictures'
BOOKDIR = '/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures'
DELIV = 'out/storytime/l2/unit2/family-words/delivery-muse-v1'


def listed(path):
    text = open(os.path.join(path, 'MANIFEST.txt'), encoding='utf-8').read().splitlines()
    lines = [ln for ln in text if re.match(r'^[0-9a-f]{64}  ', ln)]
    names = [ln[66:] for ln in lines]
    return lines, names, text


for label, path in [('app', APPDIR), ('book', BOOKDIR)]:
    lines, names, text = listed(path)
    print(f'=== {label}: {path}')
    on_disk = sorted(
        os.path.relpath(os.path.join(dp, f), path)
        for dp, _, fs in os.walk(path)
        for f in fs
    )
    print('  hash lines:', len(lines), 'distinct:', len(set(names)))
    print('  files on disk:', len(on_disk))
    missing = sorted(set(names) - set(on_disk))
    unlisted = sorted(set(on_disk) - set(names) - {'MANIFEST.txt'})
    print('  listed but absent:', len(missing), missing[:5])
    print('  on disk but unlisted:', len(unlisted), unlisted[:8])
    print('  non-hash lines:', [ln for ln in text if ln.strip() and not re.match(r'^[0-9a-f]{64}  ', ln)][:12])

# Hard links: app hand-off files must share an inode with the delivery file.
ino_bad = []
for f in sorted(os.listdir(APPDIR)):
    if not f.endswith('.png') or f.startswith('contact'):
        continue
    a = os.stat(os.path.join(APPDIR, f))
    d = os.stat(os.path.join(DELIV, f))
    if (a.st_dev, a.st_ino) != (d.st_dev, d.st_ino):
        ino_bad.append(f)
print('app hand-off PNG files not hard-linked to the delivery file:', len(ino_bad), ino_bad[:5])
print('app manifest.json byte-equal to the delivery manifest:',
      open(os.path.join(APPDIR, 'manifest.json'), 'rb').read() == open(os.path.join(DELIV, 'manifest.json'), 'rb').read())
