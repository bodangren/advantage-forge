#!/usr/bin/env python3
"""PNG header facts of the app family-word files (no image decode)."""
import glob
import os
import struct

D = 'out/storytime/l2/unit2/family-words'


def info(p):
    with open(p, 'rb') as f:
        head = f.read(33)
    if head[:8] != b'\x89PNG\r\n\x1a\n':
        return ('not-png',)
    w, h, bd, ct = struct.unpack('>IIBB', head[16:26])
    return (w, h, bd, ct, os.path.getsize(p))


print('ct 6 = RGBA, 2 = RGB, 0 = gray, 4 = gray+alpha, 3 = palette')
for i in ['l2-w09-family-egg', 'l2-w13-family-jump']:
    for name, p in [
        ('color', f'{D}/muse/{i}-m1-color.png'),
        ('print', f'{D}/muse/{i}-m1-color-print.png'),
        ('judge', f'out/storytime-review/judge/prod-u2/{i}-color-t1.png'),
        ('deliv', f'{D}/delivery-muse-v1/{i}-v1.png'),
    ]:
        print(name, i, info(p))

print('--- every print/delivery/judge header ---')
bad = []
for p in sorted(glob.glob(f'{D}/muse/*-m1-color-print.png')):
    w, h, bd, ct, sz = info(p)
    if (w, h, bd, ct) != (1500, 1500, 8, 2):
        bad.append((p, w, h, bd, ct))
print('prints not 1500x1500 8-bit RGB:', bad)
bad = []
for p in sorted(glob.glob(f'{D}/delivery-muse-v1/*-v1.png')):
    w, h, bd, ct, sz = info(p)
    if (w, h, bd, ct) != (1500, 1500, 8, 2):
        bad.append((os.path.basename(p), w, h, bd, ct))
print('delivery files not 1500x1500 8-bit RGB:', bad)
sides = {}
for p in sorted(glob.glob('out/storytime-review/judge/prod-u2/*-color-t1.png')):
    w, h, bd, ct, sz = info(p)
    sides[os.path.basename(p)] = (w, h)
print('judge color-t1 copies:', len(sides), 'sides:', set(sides.values()))
print('judge ids missing a delivery file:',
      [k for k in sides if not os.path.exists(f'{D}/delivery-muse-v1/{k.replace("-color-t1.png","-v1.png")}')])
