import hashlib, json, os, subprocess

def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

R = 'measure/runs/asset_storytime_l2u2_look1_20261111'
H = '/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-look1'

print('== item 5: hat-pip')
hp1 = 'out/storytime/l2/unit2/w10/muse/l2-w10-story-page-put-on-your-hat-pip-m3-color-print.png'
hp2 = 'out/storytime/l2/unit2/w10/muse/l2-w10-story-page-put-on-your-hat-pip-m3-line-print-2.png'
print('color:', sha(hp1))
print('line :', sha(hp2))
words = "Hat-pip image passes, but the w10 put on your t shirt image doesn't pass."
for f in [f'{R}/owner-look1.json', f'{H}/README.md', f'{R}/pm-report.md']:
    print('words in', f, ':', words in open(f).read())

print('== item 6: delivery')
d = 'out/storytime/l2/unit2/delivery-muse-v1-look1'
for f in sorted(os.listdir(d)):
    print(' ', f)
m = json.load(open(f'{d}/manifest.json'))
print('manifest sha:', sha(f'{d}/manifest.json'))
print('jobs:', [j.get('rowId') or j.get('id') for j in (m.get('jobs') or m.get('rows') or [])])
s = open(f'{d}/manifest.json').read()
print('lineWidthException present:', 'lineWidthException' in s)
print('selectedVersion values:', json.dumps(m)[:0] or [c.get('selectedVersion') for j in m.get('jobs', []) for c in [j]])
for f in sorted(os.listdir(d)):
    if f.endswith('.png'):
        print(f, sha(os.path.join(d, f)))

print('== item 7: hand-off')
r = subprocess.run(['sha256sum', '--quiet', '-c', 'MANIFEST.txt'], cwd=H, capture_output=True, text=True)
print('manifest check rc:', r.returncode, 'FAILED lines:', [l for l in r.stdout.splitlines() if 'FAILED' in l], r.stderr.strip()[:100])
ok = [l for l in (r.stdout + r.stderr).splitlines() if l.endswith(': OK')]
print('OK count:', len(ok))
print('MANIFEST.txt sha:', sha(f'{H}/MANIFEST.txt'))
for f in sorted(os.listdir(H)):
    p = os.path.join(H, f)
    if f.endswith('.png') and f != 'contact-sheet.png':
        st = os.lstat(p)
        print(f, 'links:', st.st_nlink)
