import subprocess, glob, hashlib, json
out = {}
out['changed'] = subprocess.run(['git','diff','--name-only','10af09151548070983d415d3b7c9afc22dd38f5d..37bb07915a0b903908035f175707c8a9a1f5a0de'],capture_output=True,text=True).stdout.strip().split('\n')
rows_after = []
for f in glob.glob('out/storytime/l2/unit2/w*/muse/costs.tsv') + glob.glob('out/storytime/covers/teacher-front/muse/costs.tsv'):
    for line in open(f):
        if line[:20] > '2026-11-10T12:30:00' and line.strip():
            rows_after.append((f, line.strip()))
out['costs_rows_after'] = rows_after
out['cover_costs_sha'] = hashlib.sha256(open('out/storytime/covers/teacher-front/muse/costs.tsv','rb').read()).hexdigest()
sl = open('measure/runs/asset_storytime_l2_retries_cover_20261110/spend-log.tsv').read()
out['spend_log'] = sl.strip().split('\n')
png = subprocess.run(['git','diff','--name-only','10af09151548070983d415d3b7c9afc22dd38f5d..37bb07915a0b903908035f175707c8a9a1f5a0de','--','*.png','*.jpg','*.jpeg'],capture_output=True,text=True).stdout.strip()
out['png_in_git'] = png
open('/tmp/opencode/l2rc-p3c/probe1.json','w').write(json.dumps(out,indent=1))
print('changed_count', len(out['changed']))
print('costs_rows_after', rows_after)
print('cover_costs_sha', out['cover_costs_sha'])
print('spend_log', out['spend_log'])
print('png_in_git', repr(png))
