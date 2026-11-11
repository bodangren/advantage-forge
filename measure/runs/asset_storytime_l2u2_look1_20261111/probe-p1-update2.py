import json

P = 'measure/runs/asset_storytime_l2u2_look1_20261111/acceptance-p1-26cec27.json'
d = json.load(open(P))
d['status'] = 'pass'
d['summary'] = ('Phase 1 acceptance passes at 26cec278. All 10 acceptance criteria hold: scope is inside the '
                'Owned paths; the guard diff adds only the D4 exception and my fixture probe refuses a 4th try, '
                'an over-cap call, and keeps the normal rule for unlisted ids; the spec edit differs only in the '
                '3 D3 fields; the spend is 2 calls and 0.02 USD; the judge records and the void plus r2 remedy '
                'meet D6 and give a pass for m2 and line try 3; the line gate re-measures 22 px pass; hat-pip '
                'SHA-256 and D2 words hold; the delivery and the hand-off meet FR-7 and FR-8; the 6 old folders '
                'are unchanged; FR-11 and FR-12 are clean; the GREEN run gives 308 passed tests in 20 files; '
                'tsc gives 38 error lines in total and 0 in the storytime paths (heap OOM without the node '
                'heap flag, as the maker recorded).')
d['evidence'] = d['evidence'] + [
    'F16 GREEN run through heavy-run.sh: 20 test files passed, 308 tests passed, exit 0.',
    'F17 costs.tsv sha256 after tests: b957c4773e2de9ca86bb7f69a4168c4590a1c35b90ca2ada39124b7f6074d7db (unchanged).',
    'F18 tsc --noEmit -p . through heavy-run.sh: the plain run died with a JavaScript heap out of memory (exit 134), as the maker recorded. The run with NODE_OPTIONS=--max-old-space-size=2560 completed: 38 error lines in total (35 in assets/, 2 in tests/games/castle-defense/, 1 in tests/part.test.ts) and 0 error lines in src/storytime/, scripts/storytime-, and tests/storytime-. Matches the maker evidence of maker-t1.log.',
]
d['commands'] = d['commands'] + [
    'HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c ./node_modules/.bin/vitest run (the 20 GREEN files) --maxWorkers=1',
    'HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c ./node_modules/.bin/tsc --noEmit -p . (heap OOM, exit 134)',
    'HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c NODE_OPTIONS=--max-old-space-size=2560 ./node_modules/.bin/tsc --noEmit -p .',
]
d['nonblocking_findings'] = [
    'P1: the build session wrote 2 track files with a shell redirect against its brief; the content is correct. Process finding only.',
    'P2: the first build dispatch ran on the wrong agent and changed no file. Process finding only.',
    'P3: the second color judge read the action prompt before it finished v6; the orchestrator voided the v6 verdict and a clean r2 judge ran. The remedy is sound.',
    'P4: the maker split 2 card literals so the CG3 scan could not find them; the orchestrator routed this as F1 and the maker replaced it with a SHA-256 pin of CARD_RUN in LK13 before the guard commit b9e00eca. No split literal remains; I verified with a probe.',
    'P5: the maker model was MiniMax by ra-quota pick, a substitution for the role-table GLM route. The acceptance model is a different family per the lane rule.',
    'P6: the registry entry of measure/tracks.md is [ ] while metadata is in_progress; the closeout role moves the entry.',
]
d['blocking_findings'] = []
d['test_strategy_violations'] = []
d['live_contract_violations'] = []
d['prod_wiring_violations'] = []
d['route_parity_violations'] = []
d['retry_recommendation'] = 'none'
d['confidence'] = 'high'
open(P, 'w').write(json.dumps(d, indent=2) + '\n')
print('json finalized')
