import os

cut = '2026-11-10T23:44:00Z'
files = []
for base in ['out/storytime/l2/unit2', 'out/storytime/covers']:
    for dirpath, dirnames, filenames in os.walk(base):
        if dirpath.endswith('muse') and 'costs.tsv' in filenames:
            files.append(os.path.join(dirpath, 'costs.tsv'))
files = sorted(set(files))
print(len(files), 'cost files')
hits = []
for f in files:
    for line in open(f):
        parts = line.rstrip('\n').split('\t')
        if parts and parts[0] >= cut:
            hits.append((f, line.rstrip()))
for f, l in hits:
    print(f, '|', l)
print('rows at/after cut:', len(hits))
