# Test strategy: Storytime Level 2 card pictures (31 cards)

Track: `asset_storytime_l2_cards_20261106`. Strategy base: `7af682db1d2b572d8cf46ed5cc58ec3aa244b6a4`
(Gate S passed there). Date: 2026-11-06. Role model: `claude-code/claude-sonnet-5-5#high` (PM rule
2026-11-05).

This file has full gates for Phase 1 and outline gates for Phase 2, final acceptance, and closeout.
The method comes from `measure/archive/asset_storytime_l2_unit1_pictures_20261025/test-strategy.md`
(sections 5.11 to 5.11.16: restart gates, known-red rule, carry-over rule). Where that file and
this file differ, this file applies. `measure/anti-patterns.md` does not exist in this repository.
The canonical catalog is `~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md`
(A2 to A11 are live; A1 and A8 are retired). This file cites the catalog.

## 1. Risk classes and review applicability

| Part | Risk | Reason |
| --- | --- | --- |
| Phase 1 Task 1 (fixture move) | low | Test data only. No product code. |
| Phase 1 Task 2 (card run guard) | **high** | The guard is the only control on paid provider calls. A fault gives overspend or a wrong cap. |
| Phase 1 Task 3 (31 spec files) | medium | A wrong spec wastes spend and gives a wrong picture. |
| Phase 1 as a whole | **high** | The highest task class applies. |
| Phase 2 (pictures, delivery) | medium | Capped paid calls (1.60 USD) under the Phase 1 guard. Output is model evidence. |
| Final acceptance, closeout | low | Read and record only. |

Review applicability for Phase 1:

| Gate | Applies | Reason |
| --- | --- | --- |
| Review A (correctness) | yes | New guard logic, new wiring in two scripts, 31 specs against a pinned list. |
| Review B (security) | yes | The guard controls paid calls and a key read. Attack surfaces: the mixed-call bypass, the cap arithmetic, and `--ids` used as a file name. |
| Review C (UX and API) | no | No UI. One new flag (`--cards`) and one constant (`CARD_RUN`) have tests and no outside consumer. Review A reads both. |
| Adversarial testing | yes, one bounded round | The failure mode is silent overspend. The surfaces are the cap boundary, the time formats, the `outDir` match, the mixed call, and the cost-row parse. |
| UX browser review | no | No UI. Set `UX_REQUIRED=never`. |
| Phase acceptance | yes | Last role, on an immutable HEAD. |

Phase 2 uses the light lane: one maker (`measure-jr-green`) and one checker (`measure-phase-acceptance`).
It has no Red, no Reviews A, B, and C, no adversarial round, and no UX browser review. The track
final acceptance and the closeout follow Phase 2.

## 2. Facts (checked 2026-11-06 at `7af682db`, read-only commands)

| Fact | Value |
| --- | --- |
| HEAD | `7af682db1d2b572d8cf46ed5cc58ec3aa244b6a4` on `master`. The strategy commit follows it. |
| Live Workbooks list | `/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json`: SHA-256 `ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf`, 227 rows, 31 rows with `use` `card`. |
| Shared `/tmp` fixture | `/tmp/opencode/wb-shadow/` exists today. `unshare -rm` fails here (`uid_map` denied), so no test can hide the folder. Task 1 proves the move by a static search (section 4.1, CF4). |
| New folders | `tests/fixtures/storytime/` and `docs/storytime/l2-unit1/cards/` do not exist. `tests/fixtures/` holds `stories`. |
| Guard module | `scripts/storytime-muse-guards.mjs` exports `runGuards(unitRoot, ctxs, cmd, opts)`. It scans every `<unitRoot>/*/muse/costs.tsv`, so a `cards/muse/costs.tsv` falls inside the restart scan. |
| Key read | `scripts/storytime-muse.mjs` `readKey()` reads `$HOME/Desktop/Workbooks/dashboard/.env.local`. A test that sets `HOME` to an empty folder makes a provider call impossible. |
| Judge batch | `scripts/storytime-judge-batch.mjs` `parseArgs` throws `unknown option` for `--cards` today. `buildBatch` takes `specDir`, `root`, and the try count from `RESTART_START`. |
| Test counts | `tests/storytime-muse-attempts.test.ts` 30 `it(` lines, `tests/storytime-judge-batch.test.ts` 8, `tests/storytime-stage-check.test.ts` 3. The seven PROJECT_TESTS files gave `Tests  105 passed (105)` at the last closeout. |
| Known-red file | `tests/storytime-book-pictures.test.ts`: 142 tests. It pins list v4 (`6d05dfc5…`), and the live list differs. The pin-set script (archive strategy, SHA-256 `f67cfa8f17d380cb7e6f7632612b8f56d5cba6793d642a90abf2b5c1fd4a3fe0`) names 13 pin-dependent tests. |
| Type check | Archive baseline: 38 errors in 13 files outside the owned prefixes, 0 owned. |
| Doctor | Baseline 11 errors, all in other tracks (plan, "Method and ownership"). |
| Tools | `node_modules/.bin/tsx` exists. `sharp` is in the repo. Muse and judge steps are light and run without `heavy-run.sh`. |

## 3. Commands (Phase 1)

All heavy commands use `heavy-run.sh`. `HEAVY_MIN_AVAIL_MB=1500` follows the archive precedent on this
7.1 GB machine. Exit code 75 or a `heavy-preflight` hold is neither pass nor failure: run again.
Never run `pnpm`. Run one heavy command at a time.

RED_TEST_COMMAND (Red, and the mid-red gate):

```sh
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-card-guards.test.ts tests/storytime-card-specs.test.ts tests/storytime-card-fixtures.test.ts --maxWorkers=1'
```

Expected: exit `1`. `Test Files  2 failed | 1 passed (3)`: the guards file and the specs file fail, the
fixtures file passes (section 4.1, CF). The output has no `Failed to load`, `SyntaxError`, or
`Cannot find module` line (a load error is a wrong-reason Red, A4). Every failing test fails on an
assertion line.

GREEN_TEST_COMMAND (Green once after the last code change, then every later gate):

```sh
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-card-guards.test.ts tests/storytime-card-specs.test.ts tests/storytime-card-fixtures.test.ts tests/storytime-muse-attempts.test.ts tests/storytime-judge-batch.test.ts tests/storytime-stage-check.test.ts --maxWorkers=1'
```

Expected: exit `0`, `Test Files  6 passed (6)`, `Tests  <N> passed (<N>)`. Parse `<N>` as a labeled
integer. No skipped test, no `-t` filter. The Green log quotes `N_new`, the test count of the three new
files, read from a run of those three files alone. The Green log also quotes `N_old`, the test count of
the three old files, read from a run of those three files alone. Then
`<N>` equals `N_new` plus `N_old`.

PROJECT_TESTS (acceptance, once; amended 2026-11-06 at `6d80fba0`): the six GREEN files plus
`tests/storytime-muse-delivery.test.ts`, `tests/storytime-picture-rows.test.ts`,
`tests/storytime-line-art-pass.test.ts`, `tests/storytime-muse-delivery-adversarial.test.ts`, and
`tests/storytime-card-adversarial.test.ts`. That is 11 files, in one wrapper, `--maxWorkers=1`:

```sh
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-card-guards.test.ts tests/storytime-card-specs.test.ts tests/storytime-card-fixtures.test.ts tests/storytime-card-adversarial.test.ts tests/storytime-muse-attempts.test.ts tests/storytime-judge-batch.test.ts tests/storytime-stage-check.test.ts tests/storytime-muse-delivery.test.ts tests/storytime-picture-rows.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-muse-delivery-adversarial.test.ts --maxWorkers=1'
```

Expected at `6d80fba0`: exit `0`, `Test Files  11 passed (11)`, and `Tests  155 passed (155)`. The total is 105 (seven
old files) + 30 (`N_new` of the three card files: guards 15, specs 10, fixtures 5) + 20 (the adversarial
file, ADVC1 to ADVC20). Parse both numbers as labeled integers. A later commit that adds or removes a test
changes the total, and the gate then wants the new sum with its parts quoted. The number 105 is the total of
the seven old files at the last closeout.

TYPECHECK_COMMAND (Green once, checker once):

```sh
D=$(mktemp -d /tmp/opencode/p1-tsc.XXXXXX)
bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/tsc --noEmit' > "$D/tsc.log" 2>&1; echo "tsc exit: $?"
echo "tsc errors total: $(grep -cE 'error TS[0-9]+' "$D/tsc.log")"
echo "owned tsc errors: $(grep -E 'error TS[0-9]+' "$D/tsc.log" | grep -cE '^(src/storytime/|scripts/storytime-|tests/storytime-)')"
```

Gate: `owned tsc errors: 0`. The total is informational (archive value 38); other tracks own the rest.
Exit `2` with 0 owned errors passes. Red files may show owned errors until Green adds the type
declarations; the Red gate does not read the type check.

KNOWN_RED_COMMAND (checker, once, after PROJECT_TESTS; rule in section 4.4):

```sh
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1' > "$D/known-red.log" 2>&1; echo "known red exit: $?"
```

## 4. Phase 1: Card guard, card specs, and fixture

### 4.1 Red scope: files, owners, and what each test proves

Red commits only paths under `tests/` and `measure/`. The mid-red gate fails on any other path.

| Path | Owner | Notes |
| --- | --- | --- |
| `tests/storytime-card-guards.test.ts`, `tests/storytime-card-specs.test.ts`, `tests/storytime-card-fixtures.test.ts` | Red | Three new test files. |
| `tests/fixtures/storytime/pictures-v3.json`, `tests/fixtures/storytime/pictures-v7.json` | **Red** | Test data under `tests/`. Byte copies from pinned Workbooks commits (`078917f1`, `95043edc`). Nobody edits the bytes. The SHA-256 pins prove them. |
| The two fixture constants in `tests/storytime-book-pictures.test.ts` (`LIST_V3_SHADOW_FILE`) and `tests/storytime-stage-check.test.ts` (`V3_SHADOW_FILE`) | **Red** | Test-file edits. They point at the repository copy, resolved from the test file folder. |
| `scripts/storytime-muse-guards.mjs`, `.d.mts`, `scripts/storytime-muse.mjs`, `scripts/storytime-judge-batch.mjs`, `scripts/storytime-judge-batch.d.mts` | Green | Guard code and types. The spec owned-path list omits the judge-batch `.d.mts`. The orchestrator accepts it as a types-only Green file (deviation, default yes). |
| `docs/storytime/l2-unit1/cards/<id>.json` (31 files) | Green | Not test data. Red does not write them. |

Task 1 has no product code, so Task 1 finishes at Red. Green verifies it with GREEN_TEST_COMMAND and marks
Task 1 `[x]` with the Red commit SHA on the first line. Green changes no file under `tests/`.

Red writes a test first, runs it, and sees it fail before the fix. For Task 1 the "fix" is data and two
constant edits that Red itself makes. So Red keeps an order and quotes it in its log: (1) write
`storytime-card-fixtures.test.ts`; (2) run it with the fixtures absent and the constants unchanged, and
quote the labeled failure count `fixtures red before move: <n> failed`; (3) add the data and edit the
constants; (4) run it again and quote `fixtures after move: 0 failed`. The Red commit holds the end state.

**Safety rules for every test (apply to all three files).**

1. No test makes a provider call. A CLI test sets `env` to `{ PATH, HOME: <empty temp folder> }` only.
   `readKey()` then throws `no key`, so a missed refusal gives exit `1` and no network call.
2. No Phase 1 test reads a real `out/**/costs.tsv`. The guard tests use a temp unit root. Phase 2
   spend cannot change a Phase 1 result (A10 time drift).
3. No test reads a path outside the repository (FR-3). The two path scanners build their needles from
   pieces (`'wb' + '-shadow'`), so the test file does not match its own search.
4. Import the module under test as a namespace (`import * as guards from '../scripts/storytime-muse-guards.mjs'`)
   and read `guards.CARD_RUN`. A missing export then fails one assertion. A named import would fail the
   whole file at load (A4 wrong-reason Red).
5. Every scanner or validator in a test has a seeded-fault control: the same function runs on a bad
   input and must report the fault.

**`tests/storytime-card-guards.test.ts`** (id prefix `CG`; temp unit root `<tmp>/cards/muse/costs.tsv`,
`<tmp>/w01/muse/costs.tsv`, row format of `tests/storytime-muse-attempts.test.ts`):

| Id | Proves | Falsification condition |
| --- | --- | --- |
| CG1 | `CARD_RUN` has exactly six keys with the values `2026-11-06T00:00:00Z`, `1.6`, `0.8`, `0.01`, `3`, `out/storytime/l2/unit1/cards/muse`. | A changed value, a missing key, or a seventh key. |
| CG2 | Restart config is unchanged: `RESTART_START`, `MAX_TRIES` 3, `SPEND_CAP_USD` 1.0, `REPORT_AT_USD` 0.5, `SPEND_MARGIN_USD` 0.01, `TRY_EXCEPTIONS` length 3 (nut only). Pass on arrival (lock). | A restart value changes. |
| CG3 | One owner. The ISO start literal and the `outDir` literal appear in `scripts/` and `tests/` only in `scripts/storytime-muse-guards.mjs` and the card test files. `scripts/storytime-muse.mjs` and `scripts/storytime-judge-batch.mjs` each import `CARD_RUN` from `./storytime-muse-guards.mjs` and hold no cap or report-point assignment of `1.6` or `0.8` (regex on `cap`/`report` names only, not on bare numbers). | A second literal, a missing import, or a seeded temp file with the literal that the scanner does not flag. |
| CG4 | Card cap. One cost row in `cards/muse/costs.tsv` at or after the start: 1.30 USD allows a card call (the restart cap would refuse it); 1.58 allows; 1.595 refuses with code 3; 1.60 refuses. Also 160 rows of 0.01 refuse. The test does **not** pin 159 rows of 0.01: float sums give `1.5900000000000012`, so an implementation may refuse that call early (safe side). | A cap read from the restart constants, or an allow at 160 rows. |
| CG5 | Card report point. Spend 0.60 gives `notice` false (the restart point 0.5 would give true). Spend 0.79 false. Spend 0.80 true. | The restart report point serves a card call, or the point sits at `>`. |
| CG6 | Card tries. 3 color rows for one id refuse a color call with code 3 and the id in the message. 2 rows allow. A cost-0 failed row does not count. A line call with `tries` 2 and 2 line rows refuses. Color rows do not block a line call. One id does not block another. | A fourth try passes, a failed row counts, or kinds mix. |
| CG7 | Time scope. A row at `2026-11-05T23:59:59Z` counts for neither spend nor tries. A row at exactly `2026-11-06T00:00:00Z` counts. The offset forms `2026-11-06T07:00:00+07:00` (counts) and `2026-11-06T06:59:59+07:00` (does not) behave the same. | `>` instead of `>=`, a string compare of times, or an offset ignored. |
| CG8 | File scope. A restart row of 5.00 USD in `w01/muse/costs.tsv` at a time after the start does not count in a card call. A row in `cards/muse/costs.tsv` counts. A row in `cards/muse/elements/costs.tsv` counts for spend. A row for the same id in another folder does not count for tries. | Card spend that reads the wide scan. |
| CG9 | A restart-only call still uses the restart cap: 1.20 USD in `w01/muse/costs.tsv` refuses a restart call although it is below the card cap. Pass on arrival (lock). | `CARD_RUN` serves a restart call. |
| CG10 | Mixed call at the CLI. `node scripts/storytime-muse.mjs color <card spec> <other spec>` exits `3` and prints nothing with `no key`. Also: other spec first; two card specs and one other; a spec with no `outDir` next to a card spec. The test hashes the real `cards/muse/costs.tsv` and `w01/muse/costs.tsv` (or notes absence) before and after: no change. Spec files are temp files with absolute paths. A card-only call at `runGuards` level is not refused as mixed (temp root). | Exit other than `3`, a `no key` line (the guard ran after the key read), a changed cost file, or a card-only call refused as mixed. |
| CG11 | Judge batch. (a) `parseArgs([...base, '--cards'])` does not throw, and `--bogus` still throws `unknown option`; without the flag, the parse (falsy keys dropped) equals `{ ids, kind, tryNo, out }`. (b) With the parsed options and `root: <tmp>`, `buildBatch` finds the real spec `l2-w04-card-mom` (Task 3 file); the same call without the flag fails with the A-48 missing-spec error. (c) A color row at `2026-11-05T12:00:00Z` (between the two start times) and one at `2026-11-06T01:00:00Z` in `<tmp>/out/storytime/l2/unit1/cards/muse/costs.tsv`: with the flag, try 1 is the 11-06 row and try 2 fails with `holds 1 try`. The test passes the parsed object whole, so the option name stays free. | The flag selects the A-48 folder, the try count keeps `RESTART_START`, or an old option breaks. |
| CG12 | The restart scan skips the `cards` child. Card cost rows (spend 0.60 USD) count in a card call and not in a restart call (restart spend 0.50). Result fields `run` (`restart` or `card`), `refused`, `spend`. | A card row that counts in restart spend, or a card call that misses its own rows. |
| CG13 | Output-path layout. `classifyOutDir` resolves each path. Invalid layouts are refused with code 3 and the `outDir` in the message, also at the CLI before the key read (`no key` absent). The resolved trailing-slash card path is a card call. A spec without `outDir` keeps the w01 default (restart). | A raw-string match, an invalid layout that passes, or a refusal after the key read. |
| CG14 | Pool projection. The guard reserves one margin (0.01 USD) for each call of the whole color pool or line pool (`--tries`). Card color pool with 1.50 USD spent: 10 specs refuse, 9 specs allow. Card line pool of 2 specs with `tries` 2: 1.56 USD allows, 1.57 refuses. Restart line pool of 2 specs with `tries` 2: 0.95 allows, 0.97 refuses; a restart pool of 10 specs at 0.99 refuses. A single card call keeps its old boundary (1.58 allows, 1.595 refuses). | A pool checked as one call, or a restart pool without the projection. |
| CG15 | Only the exact folder `cards/muse` is a card folder below `cards/`. Every other subfolder (including `cards/muse/elements`) classifies as `invalid` and a guarded call exits 3 with the folder in the message. The `w03/muse` and `w04/muse/elements` layouts stay `restart`. | A card subfolder that passes, or a restart layout that breaks. |

**`tests/storytime-card-specs.test.ts`** (id prefix `CS`; reads only the repository):

| Id | Proves | Falsification condition |
| --- | --- | --- |
| CS1 | `tests/fixtures/storytime/pictures-v7.json` has SHA-256 `ba3956fc…8ddf`. A plain `expect`, run first (also in `beforeAll`). | One changed byte, or a soft assertion that lets later tests run. |
| CS2 | The fixture has 227 rows. Exactly 31 rows have `use` `card`. Their ids equal a hand-typed list of 31 ids (week and word per the spec) in both directions. Labeled counts: 13 person cards, 3 prop cards with references (doll, train, teddy), 15 cards without references. | A fixture drift, or a count derived only from the fixture. |
| CS3 | `docs/storytime/l2-unit1/cards/` holds exactly the 31 files `<id>.json`. No extra file, no missing file. | A count-only check passes an extra file or a swapped name (A7). |
| CS4 | Per spec: `id`, `text` and `pageText` equal the row `text`; `use` `card`; `deliverAs` equals the row `fileName`; `printSize` equals `[1500, 1500]` and the row size; `aspect` `1:1`; `outDir` equals `CARD_RUN.outDir`; `print` is `crop` or `pad`; `goal`, `colorPrompt`, `linePrompt` are non-empty; `mustShow` is a non-empty array of non-blank strings. | A field differs from the row. |
| CS5 | Prompts: `colorPrompt` holds a no-text clause and the word `white`, and does not hold `plain light background`; `linePrompt` holds `pure white`. | The list wording leaks into the spec. |
| CS6 | References equal a hand-typed map of 31 entries copied from the spec table (set equality per card). Each path is relative, has no `..`, resolves inside the repository, and exists. The family card has six. | A wrong, absent, or outside path. This is an artifact test: the files sit in the untracked `out/` and exist on this machine only. The failure text lists each missing path. |
| CS7 | Decided differences: the three Nan cards say `bun` (not `bunch`); teddy says `brown`; car says `red`. | The prompt follows the list or the book against the decision. |
| CS8 | Existing code takes the fixture: `loadPictureList` on a temp copy of the v7 fixture gives 227 rows, and `planPictureRow` gives 1500 x 1500 plus the row file names for the 31 cards. This is the Phase 2 readiness check of the `deliver` path. | A row of list v7 that the delivery path refuses. |
| CS9 | Validator controls: `checkSpec` runs on 6 mutated clones (wrong `aspect`, wrong `outDir`, wrong `deliverAs`, missing reference, extra reference, blank `goal`) and flags each one. | A mutation that passes. |
| CS10 | Path rule: the test source holds no `/home/`, no temp-folder path, and no `Workbooks/` string (needles built from pieces), plus a seeded control. | A foreign path read. |

**`tests/storytime-card-fixtures.test.ts`** (id prefix `CF`; Task 1):

| Id | Proves | Falsification condition |
| --- | --- | --- |
| CF1 | `pictures-v3.json` exists with SHA-256 `c3e23cfdace136c7ed602b3aefee83383241833537ba56f0257668eb1e2c686b`, equal to `LIST_V3_SHA256` read from the source text of `tests/storytime-book-pictures.test.ts`. | A changed byte or a changed pin. |
| CF2 | `pictures-v7.json` exists with the CS1 SHA-256. | A changed byte. |
| CF3 | The declaration line of `LIST_V3_SHADOW_FILE` (book-pictures test) and of `V3_SHADOW_FILE` (stage-check test) names `fixtures/storytime/pictures-v3.json` and names no `/tmp`. | A constant that still points outside the repository. |
| CF4 | A recursive text search of `tests/`, `scripts/`, and `src/` finds no `wb-shadow` (needle in pieces). Seeded control: a temp file with the needle is flagged. The same search with `grep -rn 'wb-shadow' tests scripts src` is an acceptance command. | One hit, or a scanner that skips the two test files. |
| CF5 | `git check-ignore -q` exits `1` for both fixtures (git does not ignore them). | A fixture that git ignores. |

**`tests/storytime-card-adversarial.test.ts`** (id prefix `ADVC`; 20 tests; Red-class test data written in the
adversarial round, commit `6d80fba0`). ADVC1 to ADVC20 attack the cap boundary (1.59, 1.60, 1.61; repeated line calls;
float sums), the time cell (missing, unparseable, offsets, milliseconds, no time column), the `outDir` spellings
and symlinks, the cost-file scan of every child folder, the mixed CLI call in every order, the live notice line,
the cost-row parse edges, the pool re-check boundary and its file-only read, the `--tries` values, and a wider
second-owner scan. Some tests pin known gaps as notes (RB-4, RB2-1, RB2-2), not as fixes. The file passes on
arrival at its commit and is part of PROJECT_TESTS.

Red history: Red rounds 3 and 4 ran `tests/storytime-card-guards.test.ts` alone as their RED_TEST_COMMAND, because
only the guards file held new Red tests in those rounds. The three-file RED_TEST_COMMAND of section 3 applied to
rounds 1 and 2.

Provenance (Red log, not a test): quote `git -C /home/daniebo/Desktop/Workbooks show 078917f1:content/storytime/l2/print/pictures.json | sha256sum`
and the same for `95043edc`. Both outputs equal the pins.

Task 1 "behaves as before with `/tmp` absent": the static search CF4 is the proof. The constants were the
only source of the `/tmp` path, so zero hits means zero reads. Nobody moves the shared `/tmp` folder. Red
runs `tests/storytime-stage-check.test.ts` once after the edit (heavy) and quotes `Tests  3 passed (3)`.

### 4.2 Green scope and gates

Green changes only: the five script files of section 4.1, the 31 spec files, and the plan. Gates:

1. GREEN_TEST_COMMAND: `Test Files  6 passed (6)`, `Tests  <N> passed (<N>)`.
2. `git diff --name-only <red_head>..HEAD -- tests` prints nothing (Green edits no test).
3. `git diff --name-only 7af682db..HEAD -- tests/storytime-muse-attempts.test.ts tests/storytime-judge-batch.test.ts` prints nothing (the plan says these pass unchanged).
4. `grep -rn 'wb-shadow' tests scripts src` prints nothing.
5. Single owner: `grep -rnF '2026-11-06T00:00:00Z' scripts tests` lists only `scripts/storytime-muse-guards.mjs` and the card test files.
6. TYPECHECK_COMMAND: `owned tsc errors: 0`.
7. Green plan note for Task 3 records the Nan, teddy, car, and any other prompt difference (the checker reads it).
8. Mutation self-check (section 4.5), quoted in the Green log.

Closeout gate for Phase 1 (phase acceptance): gates 1 to 8 at the immutable HEAD, plus PROJECT_TESTS, the
known-red rule, and Reviews A and B and the adversarial round with no open blocker.

### 4.3 Architecture guardrails and changed-contract risks

| Guardrail or risk | Rule |
| --- | --- |
| One decision point | `runGuards(unitRoot, ctxs, cmd, opts)` keeps its signature and decides for restart, card, and mixed calls. `scripts/storytime-muse.mjs` keeps calling it before `readKey()`. The mixed check runs before any cost scan, so it needs no `out/` folder. |
| Order in the CLI | The guard runs before `readKey()` and before any provider call. CG10 checks the absence of `no key` in the output. |
| Restart contract | The restart constants, the restart scan, and `TRY_EXCEPTIONS` stay byte-equal in meaning. `tests/storytime-muse-attempts.test.ts` passes unchanged. |
| Card scan scope | A card call reads only `cards/muse/costs.tsv` and `cards/muse/elements/costs.tsv`, rows at or after `CARD_RUN.startTime`. The elements file counts for spend. Whether it counts for tries is not pinned: no card element call is planned. |
| `outDir` match (amended: ADV-N2) | `classifyOutDir` compares **resolved** paths. Any spelling that resolves to `CARD_RUN.outDir` (trailing slash, `..` forms) is a card call. Every other path below the child `cards` is invalid. A path that is not `<unit root>/<child>/muse` or `<unit root>/<child>/muse/elements` is invalid. An invalid call exits `3` before the key read and before any cost scan. The restart scan skips the `cards` child, so card cost rows never count in restart spend (CG12). CG13, CG15, ADVC7, ADVC8, and ADVC9 pin this rule. |
| Notice line | The `notice:` line of `scripts/storytime-muse.mjs` must print the card report point for a card call, not `REPORT_AT_USD`. Review A reads this line. It has no test, because it prints only when the real spend passes the point. |
| Judge batch | Without `--cards`, `SPEC_DIR`, `RESTART_START`, and the output form stay unchanged. The batch file name for a card round is set with `--out` (Phase 2 uses `cards-<round>-<kind>`). |
| Types | `scripts/storytime-muse-guards.d.mts` declares `CARD_RUN`. `scripts/storytime-judge-batch.d.mts` accepts the new option. Tests cast the parsed options, so a type choice by Green cannot break them. |
| Reference files | The 13 reference paths sit in untracked `out/`. CS6 is an artifact test of the local evidence. It cannot pass on a fresh clone. This is by design (FR-3). |

### 4.4 Intentionally red aggregate suite: `tests/storytime-book-pictures.test.ts`

The file stays out of GREEN_TEST_COMMAND and PROJECT_TESTS. It stays red while the live list differs from
the v4 pin. Task 1 changes the file (one constant), so the byte-equal condition of archive 5.11.16 is
replaced. All other conditions of 5.11.16 stand. The live list is now `ba3956fc…` (v7), so the file stays red.

Known-red rule for this track. The KNOWN_RED_COMMAND result passes when all of these hold:

1. **Diff limit.** `git diff -U0 7af682db..HEAD -- tests/storytime-book-pictures.test.ts` has at most 6 changed lines
   (lines that match `^[+-][^+-]`), and every one matches `LIST_V3_SHADOW_FILE|wb-shadow|fixtures/storytime|dirname`.
   No `it(` line changes.
2. The file runs whole and alone, with no `-t` filter. The `Tests` line sums to 142. No skipped and no todo test.
3. `pin-set.mjs`, extracted from the archive strategy, has SHA-256 `f67cfa8f17d380cb7e6f7632612b8f56d5cba6793d642a90abf2b5c1fd4a3fe0`.
   It prints `tests in the file: 142` and the 13 names `T142,T143,T144,T145,T147,T148,T149,T150,T173,T174,T175,T176,T177`.
4. The live list SHA-256 differs from `6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58`. Then the exit is `1`.
   (If it equals the pin, the exit is `0` with 0 failures.)
5. Every failing test is in the named set (`known red failing tests outside the pin set: 0`). A `FAIL` line without a test id fails the gate.
6. All four drift sentinels `T142,T147,T173,T174` fail (`known red drift sentinels failing: 4 of 4`).
7. The T173 failure text does not contain `The version 3 shadow copy exists`. This shows that the repository copy loaded.

The rule needs no exact failure count. T176 now fails too (227 rows, not 196). That is inside the named set.
Extraction:

```sh
A=measure/archive/asset_storytime_l2_unit1_pictures_20261025/test-strategy.md
awk '/^<!-- pin-set.mjs end -->$/{f=0} f; /^<!-- pin-set.mjs begin -->$/{f=1}' "$A" | sed '1d;$d' > "$D/pin-set.mjs"
echo "pin set script sha256: $(sha256sum < "$D/pin-set.mjs" | cut -c1-64)"
node "$D/pin-set.mjs" tests/storytime-book-pictures.test.ts
echo "book-pictures changed lines: $(git diff -U0 7af682db..HEAD -- tests/storytime-book-pictures.test.ts | grep -E '^[+-][^+-]' | wc -l)"
echo "book-pictures changed lines outside the constant: $(git diff -U0 7af682db..HEAD -- tests/storytime-book-pictures.test.ts | grep -E '^[+-][^+-]' | grep -vcE 'LIST_V3_SHADOW_FILE|wb-shadow|fixtures/storytime|dirname')"
echo "live list sha256: $(sha256sum < /home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json | cut -c1-64)"
grep -E '^ *Tests  ' "$D/known-red.log"
grep -E '^ *FAIL  tests/storytime-book-pictures\.test\.ts > ' "$D/known-red.log" | grep -oE '> T[0-9]+[a-z]?:' | grep -oE 'T[0-9]+[a-z]?' | sort -u > "$D/failing.txt"
echo "known red failing tests: $(wc -l < "$D/failing.txt") $(paste -sd, "$D/failing.txt")"
echo "T173 shadow-missing text: $(grep -c 'The version 3 shadow copy exists' "$D/known-red.log")"
```

The same rule applies at every later gate, with the diff base `7af682db` unchanged. The carry-over rule of
archive 5.11.16 applies to a Measure-only commit: the measured results carry over when
`git diff --name-only <measured>..HEAD` lists only files under `measure/`.

Falsification: a failing test outside the named set; a sentinel that passes while the list differs; a skip
or a filter; a total other than 142; a changed line outside the constant; a script SHA-256 that differs;
a T173 text that shows the shadow file as missing.

### 4.5 Mutation self-check (Green runs, the checker reruns)

Each mutation runs on a scratch copy, never in the shared tree. Make it with `git archive HEAD scripts src tests
docs/storytime/l2-unit1 package.json tsconfig.json vitest.config.ts | tar -x -C "$D/m"` and a `node_modules`
symlink. Apply one change, run only `tests/storytime-card-guards.test.ts` through `heavy-run.sh`, and quote the
failing ids.

| Mutation | Must fail |
| --- | --- |
| M1 `CARD_RUN.capUsd` set to 1.0 | CG1 and CG4 |
| M2 remove the mixed-call refusal | CG10 |
| M3 card spend scans every folder | CG8 |
| M4 `--cards` keeps `RESTART_START` for the try count | CG11 |
| M5 `--cards` keeps the A-48 spec folder | CG11 |
| M6 the notice point reads `REPORT_AT_USD` | CG5 |
| M7 the start-time compare uses `>` | CG7 |
| MF1 remove the `cards` skip in the restart scan | CG12 and CG14 |
| MF2 restore the exact-string card match | CG13 |
| MF3 drop the pool projection | CG14 |
| MF4 classify `cards/muse/elements` as restart again | CG15 |

MF1 to MF3 ran in the Green log `jr-green-8a567fb.log` (scratch copy, guards file alone, 14 tests; the restored
copy passed 14 of 14). MF4 ran in `jr-green-5bdf307.log` (15 tests; the unmutated copy passed 15 of 15). Both logs
sit in `measure/runs/asset_storytime_l2_cards_20261106/`. The checker reruns M1 to M7 and MF1 to MF4.

### 4.6 Artifact tests and live behavior

CF1 to CF5, CS1 to CS10 (fixtures, spec files, reference files, source search) are **artifact tests**: they check
bytes, files, and text. CG1 to CG9 and CG11 to CG15 are **behavior tests** of pure functions on temp data. CG10, the CLI
parts of CG13 and CG15, and the CLI parts of ADVC13 and ADVC14 are behavior tests of the real CLI with the key removed.
ADVC1 to ADVC20 are behavior tests on temp data, plus one source scan (ADVC20). None of them proves a picture or a provider call. The live
behavior proof of the track is Phase 2: the Muse calls, the judge runs, and `costs.tsv`. Phase 1 makes no provider call. Spend stays 0.00 USD.

### 4.7 Anti-pattern coverage, Phase 1

| Class | Defense in Phase 1 | Falsification condition |
| --- | --- | --- |
| A2 | Not applicable: no publish gate. The delivery is private and is model evidence. | none |
| A3 | Counts use labels: `Test Files`, `Tests`, `owned tsc errors:`, `known red failing tests:`. CS2 types the counts 13, 3, 15, and 31 with labels. | A bare number satisfies a gate. |
| A4 | Red imports as a namespace (no load error). Red quotes the failure reasons. CF is shown red before the move. CG2, CG9, CG11a are named locks with a mutation. Scanners have seeded controls (CG3, CF4, CS9, CS10). The CLI test fails if `no key` shows. | A Red that fails on a load error, a control that passes, or a lock without a mutation. |
| A5 | Plan notes and Green logs quote command, exit code, and labeled values. `N_new` and `<M>` tie to counts. | A plan number differs from the log. |
| A6 | No text calls a judge pass or a delivery "accepted". FR-12 grep runs at every gate. The file name `approved.json` of the existing delivery writer is a code name and is not a claim. | A claim in prose. |
| A7 | CS3 compares names, not only the count. CG3 matches `cap`/`report` assignments, not bare `1.6` or `0.8`. Known-red set comes from the pin-set script, not from the failures. | A swapped file name passes, or a legal `1.6` elsewhere fails. |
| A9 | The archived strategy path is read only for `pin-set.mjs`. The track folder holds no test that reads an archived path. | A test reads an archived track path. |
| A10 | No Phase 1 test reads the real cost files. Generated facts are not rebuilt in this track (spec NFR). | A Phase 1 result changes after Phase 2 spend. |
| A11 | The spec, plan, and this file name the same constants and files. Closeout re-reads them (section 7). | A doc value differs from `CARD_RUN`. |

### 4.8 `phase_base_sha` capture point

The orchestrator captures `phase_base_sha` with `git rev-parse HEAD` **after** the strategy commit
(message `measure(storytime_l2_cards): test strategy and Gate S closed`) passes the strategy role-gate,
and **before** Red starts. The value is that commit or a later Measure-only commit. It is never
`7af682db`, which comes before this file.

## 5. Phase 2: Card pictures and delivery (outline)

Risk: medium. Roles: maker `measure-jr-green`, checker `measure-phase-acceptance`. No Red. The maker writes
no code and no test. Starts only after Phase 1 acceptance.

Plan facts for the maker:

- Precondition (Task 5 step 1, shell): `sha256sum` of the live Workbooks list equals `ba3956fc…8ddf`. Record it in
  `precondition-workbooks-list.txt` before the first Muse call.
- Judge batches: `node scripts/storytime-judge-batch.mjs --cards --ids <ids> --kind color|line --try <n> --out cards-<round>-<kind>`.
  The batch file goes to `docs/storytime/l2-unit1/judge/prod/` (an allowed path for this track; deviation, default yes).
- Delivery writer: the existing `deliver` command of `scripts/storytime-book-pictures.ts` with an approval list in
  `out/storytime/l2/unit1/cards/muse/approved.json` (not in `docs/.../cards/`, so CS3 keeps 31 files). If the
  command refuses list v7 for a code reason, the maker stops and reports to the PM. The maker does not edit code in the light lane.

**Record files** in `measure/runs/asset_storytime_l2_cards_20261106/` (this settles Gate S finding F5):

| Record | File | Content |
| --- | --- | --- |
| Precondition | `precondition-workbooks-list.txt` | Labeled lines: `workbooks list sha256:`, `expected sha256:`, `match: yes`, `time:` (UTC). |
| Calibration | `calibration-record.json` | The judge result form of `judge-cal-*.json`: `group` `cards-calibration`, `model`, `judgePrompt`, `cast`, `status` `complete`, `results` for the two controls (`a-nose` v1 line, `nan-can-get-a-pan` m3 line try 1) with `verdict` `fail` each, `summary`, and a `time` field (UTC). |
| Judge result, main | `judge-cards-<round>.json` | One file per batch. `<round>` is the batch file stem (`cards-r1-color`). Same form as `judge-prod-*.json`. |
| Judge result, second | `judge-cards-<round>-second.json` | One file per second judge on a fail. The judge sees the file alone. |
| Spend | `spend-record.txt` | Labeled lines: `calls:`, `spend usd:`, `report point 0.80 reached: yes|no`, and when yes `spend at report point:` and `projection:`. |
| Delivery | `delivery-record.txt` | Labeled lines: `delivered files:`, `failed rows:` (ids with best try), `manifest.json sha256:`, `MANIFEST.txt sha256:`. |
| Drive | `drive-record.txt` | Labeled lines: `drive folder:`, `files uploaded:`, `md5 mismatches:`. The TSV stays at `out/storytime/l2/unit1/drive-backup-2026-11-06-cards.tsv`. |
| PM report | `pm-report.md` | Handoff path, spend, call count, each failed row with best try, the words "model evidence, not acceptance", and "Workbooks checks the cards". |
| Checker | `acceptance-p2-<HEAD7>.json` and `.log` | Written by the checker. Not committed by the checker. |

**Checks the checker runs** (read-only, light; one labeled line each; `R` is the run folder, `H` the handoff folder,
`C` is `out/storytime/l2/unit1/cards`, `S` is `$C/muse`):

| Id | Check | Pass condition | Falsification condition |
| --- | --- | --- | --- |
| P2-1 | Precondition record and a fresh `sha256sum` of the live list. | `match: yes`, fresh value equals `ba3956fc…`, record `time:` is before the first `$S/costs.tsv` row. | A later record time, or a changed list. |
| P2-2 | Calibration. `calibration-record.json`: both controls `verdict` `fail`; `time` is before the first judge result of a card; `git diff 7af682db..HEAD -- docs/storytime/l2-unit1/judge/judge-prompt.md docs/storytime/l2-unit1/judge/cast.json docs/storytime/l2-unit1/judge/calibration-set.json` prints nothing. | As stated. | A control that passes, a missing record, or a kit change. |
| P2-3 | Judge result for each delivered file. For each delivered `id` and `kind`, a `judge-cards-*.json` result has `verdict` `pass` for the delivered try. Every earlier try of that id and kind has a `fail` with a `judge-cards-*-second.json` fail. The delivered try is the first pass. | Count of delivered files with a pass = count of delivered files. | A file with no pass, a stand-alone fail, or a later try after the first pass. |
| P2-4 | Tries and order. Rows at or after `CARD_RUN.startTime` in `$S/costs.tsv` (and `$S/elements/costs.tsv`): at most 3 per id and kind. Each line row names a color input that is the delivered color. No line row for an id without a color pass. | Labeled `max tries per id and kind: <n>` with n at most 3. | A fourth try, or a line from a non-delivered color. |
| P2-5 | Spend. Sum of `usage_cost` for rows at or after the start. Count of rows. Compare with `spend-record.txt`. | Sum at most 1.60 and equals `spend usd:`; `calls:` equals the row count; every cost-0 failed row is listed. If the sum passed 0.80, the report-point lines exist. | A sum above 1.60, an unlogged call, or a missing report-point note. |
| P2-6 | Manifest. In `H`: `sha256sum -c` over the file lines of `MANIFEST.txt`. The delivery folder and `H` hold the same bytes (`sha256sum` lists equal). `manifest.json` lists the same files. | `OK` for every file line; file count = 62 − 2 × failed rows (a failed color row also drops its line file). | A `FAILED` line, a file not in the manifest, or a count mismatch. |
| P2-7 | Sizes and form. Each PNG is 1500 x 1500, 8-bit, no alpha. Line art: grayscale, only the values 0 and 255, white corners, no gray fill. Run `inspectPictureRow` and `inspectLineArtPng` of `src/storytime/book-pictures.ts` through `node_modules/.bin/tsx` in a temp script. Line width at least 12 px comes from `inspectLineArtPng`. | `files checked: <n>`, `problems: 0`. | One problem line. |
| P2-8 | Contact sheet. One PNG in `H` with all 31 cards, color and line, word labels. The checker opens it and names any card that shows a wrong person or a letter or number. | 31 labels, 62 tiles minus failed rows. | A missing card or a visible text. |
| P2-9 | Drive. The TSV has one row per uploaded file. `local_md5` equals `drive_md5` for every row. Recompute the local MD5 of 5 files at random. | `md5 mismatches: 0`; rows = files in the delivery folder plus `manifest.json`. | One mismatch. |
| P2-10 | Wording FR-12. `grep -rniE 'accepted|approved' <track folder> "$R" "$H"` and read each line. | Only lines that name the Muse path, a file name, or a negation. | A line that says a picture, a card, or a delivery is accepted or approved. `MANIFEST.txt` and `pm-report.md` hold "model evidence, not acceptance". |
| P2-11 | Read-only inputs. `git diff 7af682db..HEAD --name-only` stays inside the allowed set (section 6). No file in the Workbooks tree changed (`git -C Workbooks status --short` shows no new change under `content/storytime/l2/print/`). | As stated. | A foreign path. |
| P2-12 | The first 196 rows are untouched: each old delivery folder keeps the `manifest.json` SHA-256 pinned in archive 5.11.2 (table "Restart delivery folders"). | Every pinned value equals the measured value. | A changed manifest. |
| P2-13 | Secret scan of the run folder and the handoff folder: no `sk-`, `OPENROUTER`, or `Bearer` text. | No output. | Any hit. |

Phase 2 closeout gate: P2-1 to P2-13 pass, `PROJECT_TESTS` still passes (carry-over allowed when only `measure/` files changed), and the plan marks Tasks 4 to 9 `[x]` with commit SHAs.

Anti-pattern coverage, Phase 2:

| Class | Defense | Falsification condition |
| --- | --- | --- |
| A4 | P2-3 and P2-6 compare a delivered count with a pass count. A run with 0 files cannot pass: P2-7 needs `files checked` above 0. | An empty delivery passes. |
| A5 | P2-5 and the PM report quote the same sums and counts as `costs.tsv`. | A report number differs from the rows. |
| A6 | P2-10 and the "model evidence, not acceptance" words. | A claim of acceptance. |
| A7 | P2-10 reads each line, so the legal phrase "approved Storytime Muse path" does not hide a real hit. | A real hit dropped by the filter. |
| A10 | P2-1 reads the live list again; P2-2 reads the kit diff again. | A result carried over a changed input. |

### 5.1 Operating rules for the maker (decided 2026-11-06 at `6d80fba0`)

The orchestrator decided these rules after Review B round 2 and the adversarial round. They replace a code fix for
RB2-1. The checker verifies them from the maker log and from `out/storytime/l2/unit1/cards/muse/costs.tsv`
(`$S/costs.tsv`). A rule that the log does not show is a Phase 2 failure.

| Id | Rule | The checker verifies by | Falsification condition |
| --- | --- | --- | --- |
| a (RB2-1) | The per-call re-check cannot see calls in flight: a call writes its cost row only after it ends. So the maker runs color and line pools with `--concurrency 4` at most while the recorded card spend is **below 1.20 USD**. At **or above 1.20 USD** the maker uses `--concurrency 1` and line calls with `--tries 1`. Reason: at most 12 calls are in flight (4 workers x 3 tries), at a worst-case 0.03 USD each. That is 0.36 USD, and 1.20 + 0.36 is below 1.60. | The maker log names the spend before each pool and the flags of each pool. For each pool that started at or above 1.20 USD, the flags show `--concurrency 1` and `--tries 1` (or no `--tries`). The row time order in `$S/costs.tsv` shows no overlap of calls after that point. | A pool at or above 1.20 USD with concurrency above 1 or `--tries` above 1. |
| b | After each pool the maker reads every new row of `$S/costs.tsv`. If any row costs more than 0.03 USD, the maker stops and reports to the orchestrator. | The maker log lists the highest row cost after each pool. The checker finds the highest cost in the file. | A row above 0.03 USD with no stop and no report. |
| c (RA2-5) | A refusal in the middle of a pool exits `0`: the tool prints the message and returns. The maker reads the tool output for a `refused` line after every run, not only the exit code. | The maker log quotes the output check (`refused lines: <n>`) for each run. | A run that logs only an exit code. |
| d (ADV-N4) | `--tries` takes only the integers `1`, `2`, or `3`. The maker never passes a fraction, zero, or a larger number. | The maker log shows the `--tries` value of each line run. | Any other value. |
| e (ADV-N6) | Nobody edits `costs.tsv` by hand. The header of `$S/costs.tsv` has a `time` column and a cost column (`usage_cost` or `cost_usd`). The spend total equals the sum of the cost column for rows at or after `2026-11-06T00:00:00Z`. | The checker reads the header, sums the column with a read-only script, and compares the sum with `spend-record.txt` and with P2-5. A header with no time or cost column gives every row 0 cost or drops it, so the check fails. | A header without those columns, a sum that differs, or a row that the file history cannot explain. |
| f | Report point: at 0.80 USD the maker records the spend and the projection in its log and in `spend-record.txt`, and continues. Cap: 1.60 USD. The maker stops only at the cap. | P2-5 reads the report-point lines. | A stop at 0.80 USD, or a missing record. |

The checker adds the labeled line `operating rules a to f: pass|fail` to its log, with one reason for each rule.

## 6. Allowed file set (Phase 1 gate, Phase 2 gate, final acceptance)

```text
^(measure/(tracks|runs)/asset_storytime_l2_cards_20261106/|measure/(tracks|status|tech-debt|lessons-learned)\.md$|measure/generated/|measure/archive/asset_storytime_l2_cards_20261106/|docs/storytime/l2-unit1/cards/l2-w0[1-7]-card-[a-z]+\.json$|docs/storytime/l2-unit1/judge/prod/cards-[a-z0-9-]+\.json$|scripts/storytime-(muse-guards\.mjs|muse-guards\.d\.mts|muse\.mjs|judge-batch\.mjs|judge-batch\.d\.mts)$|tests/storytime-card-(guards|specs|fixtures|adversarial)\.test\.ts$|tests/fixtures/storytime/pictures-v[37]\.json$|tests/storytime-(book-pictures|stage-check)\.test\.ts$)
```

Check: list the files of the commits since `7af682db` (`git log --no-merges --format=%H 7af682db..HEAD`, then
`git diff-tree --no-commit-id --name-only -r <sha>`). The orchestrator names its own commits for this track.
The count of own files outside the set must be 0. The checker names each commit of another agent and does not
fail on it, unless it touches a Storytime path of this track. Phase 1 uses the set without the
`docs/storytime/l2-unit1/judge/prod/` line: no such file exists before Phase 2.

## 7. Final acceptance and closeout (outline)

Final acceptance runs at an immutable HEAD after the Phase 2 gate. It makes no Muse call and no judge call. Order:

1. PROJECT_LINT (read-only; no linter exists in this repository, so it checks artifacts):
   `node measure/tools/doctor.mjs --structural-only --root .` prints no line that names this track;
   `grep -rn 'wb-shadow' tests scripts src` prints nothing; `grep -rnF '2026-11-06T00:00:00Z' scripts tests` lists
   only the guard module and the card tests; the allowed-set check of section 6; the FR-12 grep; the secret scan;
   the plan counts (`[x]` lines, no non-deferred open task); `git diff --name-only 7af682db..HEAD -- assets/fireball.ts out/fireball` prints nothing.
2. PROJECT_CHECKS: TYPECHECK_COMMAND (`owned tsc errors: 0`) and KNOWN_RED_COMMAND with the rule of 4.4.
3. PROJECT_TESTS: the 11 files of section 3. `Test Files  11 passed (11)`, `Tests  155 passed (155)` (or the new sum with its parts quoted).
4. Compare the plan, `metadata.json`, and `pm-report.md` quotes with `spend-record.txt`, `delivery-record.txt`,
   and `drive-record.txt` (A5). Name each difference.
5. Re-run P2-1, P2-5, P2-6, and P2-10 at the final HEAD. They are cheap and they catch late edits.

Closeout (role `closeout`): follows the closeout brief of the archive (explicit `git add` paths, the foreign-state check
of `measure/tracks.md`, `measure/generated/`, and other plans). It archives the track, updates the registry, runs
`./measure/generate.sh` and `./measure/doctor.sh` only when no foreign change sits in `measure/generated/`, commits
`measure/runs/asset_storytime_l2_cards_20261106/`, closes knowledge todo `7050174a`, and keeps the registry words
"delivered, awaiting Workbooks check". It does not write "accepted". Foreign generated facts stay out of the commit.

## 8. Residual risks and defaults

| Item | Default | Owner |
| --- | --- | --- |
| The spec omits `scripts/storytime-judge-batch.d.mts` and `docs/storytime/l2-unit1/judge/prod/` from the owned paths. Both are used by design. | Treat both as allowed (section 6). | Orchestrator |
| CS6 needs the untracked reference files in `out/`. | Keep. Fresh clones fail by design (FR-3). | Spec |
| The float sum can refuse the 160th call at 1.59 USD. | Accept (safe side). The test pins 158 rows and 160 rows only. | Strategy |
| `loadPictureList` or `deliver` may refuse list v7 in Phase 2. | CS8 checks the loader and the row plan before any spend. A refusal in Phase 2 is a stop and a PM report. | Phase 2 maker |
| The adversarial round may find the `outDir` variant, a negative cost row, or a bad time cell. | Route to Green with a bounded brief. A negative cost row is a trusted-file case and gets a note. | Orchestrator |
| RB2-1: calls in flight are not seen by the per-call re-check (Review B round 2, Major). | No code fix. Operating rule 5.1 a limits the in-flight spend (0.36 USD worst case below 1.20 USD). The test ADVC18 pins that the re-check reads the cost file only. | Phase 2 maker; checker verifies |
| RA2-5: a mid-pool refusal exits 0 (Review A round 2). | Note. Operating rule 5.1 c: the maker reads the output for a refusal line after every run. | Phase 2 maker |
| ADV-N3: `CostRow` in `scripts/storytime-muse-guards.d.mts` declares `version`, `inputs`, and `size` as required, and the parser never sets them. | Note. No current consumer reads those fields. A later track may mark them optional. | Next guard change |
| ADV-N4: `--tries` is not validated as an integer. | Note. Operating rule 5.1 d limits the maker to 1, 2, or 3. | Phase 2 maker |
| ADV-N5: CG3 scans two files with a narrow pattern. | Note. ADVC20 runs a wider scan of `scripts/` and `tests/` with a seeded control. The acceptance search of section 4.2 gate 5 is the final check. | Checker |
| ADV-N6: a `costs.tsv` header without a time or cost column hides rows (RB-4 extension). | Note. Operating rule 5.1 e: nobody edits the file by hand, and the checker reads the header and the sum. ADVC6 and ADVC16 pin the behavior. | Phase 2 checker |
| RA-2: CG4 and CG5 use a fallback literal for `CARD_RUN`, so each passes alone if `CARD_RUN` is removed (`review-a-128b6c1.json`). | Accepted Nit, no code change in this track (orchestrator decision, 2026-11-06). CG1 still fails in that case. | Next guard test change |
| RA-3: CG11 omits the try-2 refusal (`holds 1 try`) that the CG11 row of section 4.1 states (`review-a-128b6c1.json`). | Accepted Nit, no code change in this track (orchestrator decision, 2026-11-06). The try-1 source check still catches M4 and M5. | Next judge-batch test change |
| RA-4: the card-mode error of `readSpec` says `no A-48 spec` and CG11 pins that label (`review-a-128b6c1.json`). | Accepted Nit, no code change in this track (orchestrator decision, 2026-11-06). The label does not change a decision. | Next judge-batch change |
| RA-6: the train spec `l2-w07-card-train.json` adds the `mustShow` phrase `four small wheels`, which the list prompt does not hold (`review-a-128b6c1.json`). | Accepted Nit, no code change in this track (orchestrator decision, 2026-11-06). The phrase stays. The Green Task 3 note records it as a prompt difference. | Phase 2 maker (uses the spec as written) |
| RA3-2: the `not.toContain('no key')` assertion in CG13, CG14, and CG15 cannot fail, because the empty `HOME` gives an `ENOENT` message (`review-a-787e846.json`). | Accepted Nit, no code change in this track (orchestrator decision, 2026-11-06). The exit-3 and `outDir` assertions carry the claim that the guard refuses first. The A4 row of section 4.7 names the `no key` check as a defense; read it with this row. | Next guard test change |
| RB-4: a negative cost cell lowers the spend, and a time cell that does not parse drops its row (`review-b-128b6c1.json`). | Accepted Nit, no code change in this track (orchestrator decision, 2026-11-06). Operating rule 5.1 e (no hand edit, header and sum check) covers the Phase 2 run. | Next guard change |
| RB-5: the tool has no containment check on `spec.outDir` (partly closed by `classifyOutDir`), `spec.references`, or `import --color` and `--line` (`review-b-128b6c1.json`). | Accepted Nit, no code change in this track (orchestrator decision, 2026-11-06). The 31 in-repo specs are pinned by CS4, CS6, and CS9. The tool does not run untrusted specs. | Next muse tool change |
| RB-6: `readKey` accepts the misspelled name `OPERNROUTER_API_KEY` (`review-b-128b6c1.json`). | Accepted Nit, no code change in this track (orchestrator decision, 2026-11-06). The code is old and the risk is low. | Next muse tool change |
| RB2-2: a symlinked week folder escapes the restart scan (`review-b-787e846.json`). ADVC12 pins the behavior. | Accepted Nit, no code change in this track (orchestrator decision, 2026-11-06). A symlink under `out/` needs local access. | Next guard change |
| RB2-3: a paid call is not logged when file work throws, and a timed-out call logs cost 0 (`review-b-787e846.json`). | Accepted Nit, no code change in this track (orchestrator decision, 2026-11-06). Operating rule 5.1 b and the sum check of 5.1 e bound the effect in Phase 2. | Next muse tool change |
| RB2-4: on a case-insensitive file system, `Cards/muse` classifies as restart (`review-b-787e846.json`). | Accepted Nit, no code change in this track (orchestrator decision, 2026-11-06). This machine runs Linux, where it is a separate folder. | Next guard change |
| Phase acceptance F6: the checker did not rerun the mutation checks M1 to M7 and MF1 to MF4 (`phase-acceptance-895c65c.json`). The shell policy denied a scratch script. | Accepted by the orchestrator. The Green logs `jr-green-ad9cc58.log`, `jr-green-8a567fb.log`, and `jr-green-5bdf307.log` quote each mutation with its failing ids, and the unmutated copy passed after each set. | Orchestrator |
