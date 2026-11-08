#!/usr/bin/env python3
"""P3 acceptance probe: ancestry of the plan SHAs, and the FR-12 grep."""
import subprocess

SHAS = ['262026e9', '5ae7e8f8', '19a0a8f4', 'b20c9ff9', 'd963fc83', 'e738d477',
        '2d3a2314', 'eef37a5e', '44bfc75f', 'b55248ea', '179365e9']


def git(*args):
    return subprocess.run(['git', *args], capture_output=True, text=True)


full = {}
for s in SHAS:
    r = git('rev-list', '--count', f'HEAD..{s}')
    ahead = r.stdout.strip()
    r2 = git('rev-list', '--count', f'{s}..HEAD')
    behind = r2.stdout.strip()
    subj = git('log', '--format=%s', '-1', s).stdout.strip()
    ok = ahead == '0' and behind != ''
    full[s] = (ok, ahead, behind, subj)
    print(f'{s} ancestor={ok} not-in-HEAD={ahead} commits-after={behind} | {subj[:70]}')

print('--- FR-12 grep ---')
paths = ['measure/tracks/asset_storytime_l2_unit2_pictures_20261108/plan.md',
         'measure/tracks/asset_storytime_l2_unit2_pictures_20261108/spec.md',
         'measure/runs/asset_storytime_l2_unit2_pictures_20261108/pm-report.md',
         'measure/runs/asset_storytime_l2_unit2_pictures_20261108/maker-p3.log']
r = subprocess.run(['grep', '-rniE', 'accepted|approved by|approval of', *paths],
                   capture_output=True, text=True)
for line in r.stdout.splitlines():
    print(line[:220])
print('hits:', len(r.stdout.splitlines()))
