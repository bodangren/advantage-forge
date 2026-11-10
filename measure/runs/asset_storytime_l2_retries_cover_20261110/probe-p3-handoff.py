import subprocess, hashlib, json, os, glob, re

R = 'measure/runs/asset_storytime_l2_retries_cover_20261110'
out = {}

def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

# --- Item 6: the repair1 hand-off ---
H = '/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-repair1'
out['h_manifest_sha'] = sha(f'{H}/MANIFEST.txt')
r = subprocess.run(['sha256sum', '-c', 'MANIFEST.txt'], cwd=H, capture_output=True, text=True)
out['h_check_failed_lines'] = [l for l in r.stdout.splitlines() if 'FAILED' in l]
out['h_ok_count'] = sum(1 for l in r.stdout.splitlines() if l.endswith(': OK'))
out['h_exit'] = r.returncode
links = {}
for p in glob.glob(f'{H}/**/*.png', recursive=True):
    n = os.stat(p).st_nlink
    links[n] = links.get(n, 0) + 1
out['h_png_link_counts'] = links
out['h_png_count'] = sum(links.values())
readme = open(f'{H}/README.md').read()
out['h_readme_checks'] = {
    'repairs_9': len(re.findall(r'l2-w1\d-', readme)) > 0 and 'version' in readme.lower(),
    'has_model_evidence': 'model evidence, not acceptance' in readme,
    'has_hat_pip': 'hat-pip' in readme,
    'has_spend': '0.11' in readme,
    'has_cards': all(w in readme for w in ['hippo', 'ruler', 'clap', 'cold']),
}
out['h_readme_head'] = readme.splitlines()[:3]

# --- Item 7: the cover folder ---
C = '/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge'
out['c_readme_line1'] = open(f'{C}/README.md').readline().strip()
r = subprocess.run(['sha256sum', '-c', 'MANIFEST.txt'], cwd=C, capture_output=True, text=True)
out['c_ok_count'] = sum(1 for l in r.stdout.splitlines() if l.endswith(': OK'))
out['c_failed'] = [l for l in r.stdout.splitlines() if 'FAILED' in l]
out['c_manifest_sha'] = sha(f'{C}/MANIFEST.txt')
out['c_png_shas'] = sorted(sha(p) for p in glob.glob(f'{C}/*.png'))

# --- Item 8: the unchanged folders (FR-18) ---
r = subprocess.run(['python3', f'{R}/folder-state-p3e.py', '/tmp/opencode/l2rc-p3c/folder-state-p3c.txt'], capture_output=True, text=True)
out['folder_state_out'] = (r.stdout + r.stderr).strip()[-600:]
before = open(f'{R}/folder-state-p3e-before.txt').read()
after = open('/tmp/opencode/l2rc-p3c/folder-state-p3c.txt').read() if os.path.exists('/tmp/opencode/l2rc-p3c/folder-state-p3c.txt') else ''
out['folder_state_matches_before'] = before.strip() == after.strip()

# --- Item 9: FR-12 and FR-14 ---
diff_names = subprocess.run(['git', 'diff', '--name-only', '10af09151548070983d415d3b7c9afc22dd38f5d..37bb07915a0b903908035f175707c8a9a1f5a0de'], capture_output=True, text=True).stdout
fr12_hits = []
for f in diff_names.split():
    try:
        text = open(f, errors='ignore').read()
    except Exception:
        continue
    for m in re.finditer(r'(?i)(daniel|the pm|workbooks)[^\n]{0,80}(accepted|approval of|sign)', text):
        fr12_hits.append((f, m.group(0)[:100]))
out['fr12_hits_git'] = fr12_hits
for f in [f'{H}/README.md', f'{C}/README.md']:
    text = open(f).read()
    for m in re.finditer(r'(?i)(daniel|the pm|workbooks)[^\n]{0,80}(accepted|acceptance of the picture)', text):
        out.setdefault('fr12_hits_readme', []).append((f, m.group(0)[:100]))
out['fr12_note'] = 'model evidence, not acceptance disclaimers expected'
frozen = ['docs/storytime/l2-unit1', 'src/storytime/book-pictures.ts', 'scripts/storytime-judge.mjs']
out['fr14_frozen_changed'] = [f for f in frozen if f in diff_names]

open('/tmp/opencode/l2rc-p3c/probe2.json', 'w').write(json.dumps(out, indent=1))
print(json.dumps(out, indent=1)[:3000])
