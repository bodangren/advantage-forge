import json

P = 'measure/runs/asset_storytime_l2u2_look1_20261111/acceptance-p1-26cec27.json'
d = json.load(open(P))
d['status'] = 'inconclusive'
d['summary'] = ('Probes 1-10 pass: scope, guard diff and probe, spec edit, spend (2 calls, 0.02 USD), '
                'judges and the void plus r2 remedy, line gate re-measure 22 px, hat-pip SHA-256 and D2 words, '
                'delivery and hand-off, folder-state of the 6 old folders unchanged, FR-11 no real claim, '
                'FR-12 clean. Items 11-12 (process findings, GREEN run, tsc) still open.')
d['evidence'] = [
    'HEAD is 26cec27810bdf3b4a280bd9d4656ac7c793e8f7c = audited_head_sha.',
    'F1 scope: the 9 non-run changed files are all inside the Owned paths of the spec.',
    'F2 guards diff vs 7b346f43 adds only U2_LOOK_TRY, U2_LOOK_CAP_MESSAGE, lookEntryFor, countLookRows, lookSpendOf, the runGuards rule, and the u2LookCapUsd strip; removed lines are 2 comment lines only.',
    'F3 probe-p1-guards.mjs with fixture cost files: the 4th look try is refused, spend 0.095 + 0.01 over the 0.10 cap is refused, the exact cap is allowed, an unlisted id keeps the normal rule (its own network-retry refusal), cliGuardOptions strips u2LookCapUsd, no split CARD_RUN literal.',
    'F4 tests LK1-LK15 inspected: fixture cost files in temp dirs, meaningful rules; LK13 pins the CARD_RUN SHA-256 1a274808... (the F1 fix).',
    'F5 spec edit: only goal, colorPrompt, linePrompt differ from 7b346f43; the D3 sentences are present; the banned phrases are absent.',
    'F6 spend: 2 paid rows at/after the cut across all 10 costs.tsv files (color m2 2026-11-11T00:23:46.646Z, line m2 2026-11-11T00:34:37.068Z), total 0.02 USD; spend-log.tsv matches.',
    'F7 judges: color t2 first judge fail (action c: no); second judge v6 pass but voided (it read the action prompt before v6 finished), its action check all yes kept; clean r2 v6 pass; line t3 v6 pass and action a-g all yes. The D6 rule gives a pass for m2 and line try 3; no kind has a 4th try.',
    'F8 line gate re-measure with inspectLineArtPng at class A 4000x3000: line print 22 px pass (sha256 675a7ef4...), despeckled 22 px pass (sha256 b265e5f7...).',
    'F9 hat-pip delivered files have the D2 SHA-256 values 6db86851... and 14746802...; the D2 words are in owner-look1.json, the hand-off README.md, and pm-report.md.',
    'F10 delivery: 4 PNGs plus manifest.json (sha256 0341b4f9...), 2 jobs, every candidate version and selectedVersion is 1, no lineWidthException, delivered SHA-256 values equal the Muse prints (t-shirt color 8e1baee1..., line 675a7ef4...).',
    'F11 hand-off: sha256sum -c MANIFEST.txt gives 8 OK and 0 FAILED (rc 0); MANIFEST.txt sha256 6ae4e14f...; 4 delivered PNGs have link count 2; contact-sheet.png 644x724 px = 2 rows per make-handoff-look1.mjs.',
    'F12 folder-state probe: all 6 old folders have the same file counts and state SHA-256 as folder-state-look1-before.txt; the before and after files are identical (sha256 2589812f...).',
    'F13 FR-11 grep: 13 regex hits, all false positives (the spec rule sentence, measure-phase-acceptance, "the PM writes the approved limit", the D2 quote). No real acceptance claim outside D2.',
    'F14 FR-12: no png/jpg in the diff, no frozen path in the diff, no existing test file changed.',
    'F15 costs.tsv sha256 before tests: b957c4773e2de9ca86bb7f69a4168c4590a1c35b90ca2ada39124b7f6074d7db.',
]
d['commands'] = [
    'git rev-parse HEAD',
    'git diff --stat 942fb436..26cec278',
    'git diff 7b346f43..26cec278 -- scripts/storytime-muse-guards.mjs scripts/storytime-muse-guards.d.mts docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-t-shirt.json',
    'node measure/runs/asset_storytime_l2u2_look1_20261111/probe-p1-guards.mjs',
    'python3 measure/runs/asset_storytime_l2u2_look1_20261111/probe-p1-spend.py',
    'python3 measure/runs/asset_storytime_l2u2_look1_20261111/probe-p1-files.py',
    'heavy-run.sh tsx probe-p1-line-gate.mjs',
    'python3 measure/runs/asset_storytime_l2u2_look1_20261111/probe-p1-state.py',
    'sha256sum -c MANIFEST.txt (in the look1 hand-off folder)',
    'sha256sum out/storytime/l2/unit2/w10/muse/costs.tsv',
]
d['changed_files'] = [
    'docs/storytime/l2-unit2/judge/prod/u2l1-color-t2.json',
    'docs/storytime/l2-unit2/judge/prod/u2l1-line-t3.json',
    'docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-t-shirt.json',
    'measure/tracks/asset_storytime_l2u2_look1_20261111/metadata.json',
    'measure/tracks/asset_storytime_l2u2_look1_20261111/plan.md',
    'scripts/storytime-muse-guards.d.mts',
    'scripts/storytime-muse-guards.mjs',
    'tests/storytime-u2-look1.test.ts',
    'measure/runs/asset_storytime_l2u2_look1_20261111/ (run artifacts)',
]
d['confidence'] = 'high'
open(P, 'w').write(json.dumps(d, indent=2) + '\n')
print('json updated')
