# Test strategy: Storytime Level 2 family-word pictures (19 words)

Track: `asset_storytime_l2_family_words_20261107`. Strategy base: `d77957f959056b5859137ae23207968518f76428`
(Gate S passed there: `measure/runs/asset_storytime_l2_family_words_20261107/spec-review-d77957f.json`).
Date: 2026-11-07. Role model: `claude-code/claude-sonnet-5-5#high` (the role table names Opus 5.5; the
substitution comes from `ra-quota pick strategy` and the log records it).

This file has full gates for Phase 1 and an outline with a checker evidence list for Phase 2, final
acceptance, and closeout. The form and the method come from the archived strategy
`measure/archive/asset_storytime_l2_cards_20261106/test-strategy.md`. Where the two files differ, this
file applies. `measure/anti-patterns.md` does not exist in this repository. The canonical catalog is
`~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md` (A2 to A7 and A9 to A11 are
live; A1 and A8 are retired). This file cites the catalog.

## 1. Risk classes and review applicability

| Part | Risk | Reason |
| --- | --- | --- |
| Phase 1 Task 1 (18 spec files and spec test) | medium | A wrong spec wastes paid calls (at most 0.54 USD) and gives a wrong picture. A forbidden word in a prompt breaks an owner rule. |
| Phase 1 Task 2 (judge flag `--family-words`) | low | The tool makes no provider call and writes one batch file. A wrong folder or try start gives wrong evidence, not wrong spend. The guard stays unchanged. |
| Phase 1 Task 3 (writer `deliverMuseColorSet`) | medium | The writer decides which bytes reach the handoff folder. It handles paths, copies, and overwrite rules. |
| Phase 1 as a whole | **medium** | The highest task class applies. No task is `high`: this track changes no guard and no key read. |
| Phase 2 (pictures, delivery) | medium | Capped paid calls (at most 0.54 USD, guard cap 1.60 USD) under the card guard that this track does not change. Output is model evidence. |
| Final acceptance, closeout | low | Read and record only. |

Review applicability for Phase 1:

| Gate | Applies | Reason |
| --- | --- | --- |
| Review A (correctness) | yes | New writer logic, a new flag, and 18 spec files against pinned tables. Review A reads the `.d.mts` change and the `deliverMuseColorSet` signature. |
| Review B (security) | yes, bounded | Scope: the path handling of the writer (folder part, symlinked folder, symlinked print, overwrite, write-after-check order) and the "no file written" exit of the `--cards` plus `--family-words` error. Review B also confirms that the guard file and `scripts/storytime-muse.mjs` have an empty diff. No key read and no provider call is in scope. |
| Review C (UX and API) | no | No UI. One new flag and one new export have tests and no outside consumer. Review A reads both. |
| Adversarial testing | yes, one bounded round | The failure mode is a silent wrong delivery or a forbidden word that a naive scan misses. Surfaces: the entry schema edges, the row id form, byte-equal copy, symlinks, a partial write, the whole-word scan (case, hyphen, plural, Unicode), and the flag parse (repeat, `=value`, order). Limit: 15 new tests in `tests/storytime-family-word-adversarial.test.ts`, Red-class data under `tests/`. |
| UX browser review | no | There is no page. Set `UX_REQUIRED=never`. |
| Phase acceptance | yes | Last role, on an immutable HEAD. |

Phase 2 uses the light lane: one maker (`measure-jr-green`) and one checker (`measure-phase-acceptance`).
It has no Red, no Reviews A, B, and C, no adversarial round, and no UX browser review. The final
acceptance and the closeout follow Phase 2.

## 2. Facts (checked 2026-11-07 at `d77957f9`)

| Fact | Value |
| --- | --- |
| HEAD | `d77957f959056b5859137ae23207968518f76428` on `master`. The strategy commit follows it. |
| Fixture | `tests/fixtures/storytime/pictures-v7.json`: SHA-256 `ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf`, 227 rows. The family row `l2-w04-card-family` is in it. The 18 new ids are not. |
| Family print | `out/storytime/l2/unit1/cards/muse/l2-w04-card-family-m1-color-print.png`: SHA-256 `ab6067eedf8de3efebb40509c6032f81f7ecee178b212eac8c3727d40a8bff62`. |
| Cost file | `out/storytime/l2/unit1/cards/muse/costs.tsv`: header line plus 74 call rows (75 lines). Header columns: `time row version kind inputs output size usage_cost note`. The card spend record says 74 calls and 0.74 USD. |
| Guard | `scripts/storytime-muse-guards.mjs` exports `CARD_RUN` (`startTime` `2026-11-06T00:00:00Z`, `capUsd` 1.6, `reportAtUsd` 0.8, `marginUsd` 0.01, `maxTries` 3, `outDir` `out/storytime/l2/unit1/cards/muse`) and `classifyOutDir(spec, unitRoot)`. It returns an object with `kind` `card`, `restart`, or `invalid`. |
| Muse tool | A `color` call writes `<id>-m<n>-color.png` and `<id>-m<n>-color-print.png`. The writer reads the print. The tool caps `--concurrency` at 4. |
| Judge batch | `parseArgs` throws `unknown option` for `--family-words` today. `buildBatch` takes `cards`, `specDir`, `root`. `judgeFile` goes under `<root>/out/storytime-review/judge/prod/`. The batch file goes to `docs/storytime/l2-unit1/judge/prod/<out>.json` (module constant, not under `root`). |
| Writer | `src/storytime/muse-delivery.ts` exports `writeMuseDelivery` and `deliverMuseCover`. `deliverMuseCover` uses `inspectColorPrint`, `readMuseFile`, `assembleManifest`, and `commitDelivery`. |
| `assembleManifest` | It builds one `<directory>/color` batch and one `<directory>/lineart` batch for each directory. The cover writer filters the `lineart` batches out. The batch kind value is `lineart`, not `line` (the specification text says "output kind `line`"; the real value is `lineart`). |
| `commitDelivery` | It accepts an existing file with identical bytes. The specification says the new writer refuses an existing delivered file. The new writer needs its own check before `commitDelivery`. |
| Reference files | All 11 reference files of the specification tables exist on this machine (checked). They sit in untracked `out/`. |
| Cast notes | `cast.json` Nan: two round buns with smooth red ring bands, orange T-shirt with a white star, red shorts, white sneakers. Pat: short messy black hair with a fringe, green T-shirt, brown cargo shorts, brown sandals. |
| Baseline tests | The 11 old files (PROJECT_TESTS of the card track) gave `Test Files  11 passed (11)` and `Tests  155 passed (155)` at `d77957f9` (about 104 s). |
| Baseline old five | `Tests  87 passed (87)` in 5 files (section 3.1). |
| Type check | `tsc errors total` 38 and `owned tsc errors` 0 at `d77957f9` (section 3.1). |
| Tools | `node_modules/.bin/vitest`, `tsc`, `tsx` exist. `sharp` is in the repository. `pnpm` is not used. Muse and judge steps are light and run without `heavy-run.sh`. |
| Known-red file | `tests/storytime-book-pictures.test.ts` (142 tests) stays red while the live list differs from its v4 pin. `src/storytime/book-pictures.ts` imports `muse-delivery.js` dynamically, so the writer change can reach that file. Section 4.4 sets the rule. |

## 3. Commands (Phase 1)

All heavy commands use `heavy-run.sh`. `HEAVY_MIN_AVAIL_MB=1500` follows the archive precedent on this 7.1 GB
machine. Exit code 75 or a `heavy-preflight` hold is neither pass nor failure: wait and run again with a long
timeout. Never run `pnpm`. Run one heavy command at a time.

RED_TEST_COMMAND (Red, and the mid-red gate):

```sh
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-family-word-specs.test.ts tests/storytime-family-word-judge.test.ts tests/storytime-family-word-delivery.test.ts --maxWorkers=1'
```

Expected: exit `1`, `Test Files  3 failed (3)`. Each file has tests that fail and tests that pass on arrival
(section 4.1 names them). The output has no `Failed to load`, `SyntaxError`, or `Cannot find module` line (a load
error is a wrong-reason Red, A4). Every failing test fails on an assertion line. The Red log quotes the labeled
line `Tests  <failed> failed | <passed> passed (<total>)`. The `<total>` is `N_new`.

GREEN_TEST_COMMAND (Green once after the last code change, then every later gate):

```sh
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-family-word-specs.test.ts tests/storytime-family-word-judge.test.ts tests/storytime-family-word-delivery.test.ts tests/storytime-judge-batch.test.ts tests/storytime-card-guards.test.ts tests/storytime-card-specs.test.ts tests/storytime-muse-delivery.test.ts tests/storytime-muse-delivery-adversarial.test.ts --maxWorkers=1'
```

Expected: exit `0`, `Test Files  8 passed (8)`, `Tests  <N> passed (<N>)`. No skipped test and no `-t` filter.
Parse `<N>` as a labeled integer. `N_new` is the `<total>` of the Red run. `N_old` is the labeled value in the
table below. Then `<N>` equals `N_new` plus `N_old`. If the adversarial round adds tests, the gate then wants the
new sum with its parts quoted.

N_old (the five regression files alone, measured at `d77957f9`): `Test Files  5 passed (5)` and `Tests  87 passed (87)`.
So `N_old` is 87 and `<N>` equals `N_new` plus 87.

PROJECT_TESTS (acceptance, once): the 11 files of the card-track PROJECT_TESTS plus the three new files. That is
14 files, in one wrapper, `--maxWorkers=1`:

```sh
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-family-word-specs.test.ts tests/storytime-family-word-judge.test.ts tests/storytime-family-word-delivery.test.ts tests/storytime-card-guards.test.ts tests/storytime-card-specs.test.ts tests/storytime-card-fixtures.test.ts tests/storytime-card-adversarial.test.ts tests/storytime-muse-attempts.test.ts tests/storytime-judge-batch.test.ts tests/storytime-stage-check.test.ts tests/storytime-muse-delivery.test.ts tests/storytime-picture-rows.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-muse-delivery-adversarial.test.ts --maxWorkers=1'
```

Expected: exit `0`, `Test Files  14 passed (14)`, `Tests  <155 + N_new> passed`. The number 155 is the measured total of the
11 old files at `d77957f9`. If the adversarial round adds `N_adv` tests, the sum is `155 + N_new + N_adv`
(add the file `tests/storytime-family-word-adversarial.test.ts` to the command, 15 files). Parse the numbers as labeled
integers and quote the parts.

TYPECHECK_COMMAND (Green once, checker once):

```sh
D=$(mktemp -d /tmp/opencode/p1-tsc.XXXXXX)
bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/tsc --noEmit' > "$D/tsc.log" 2>&1; echo "tsc exit: $?"
echo "tsc errors total: $(grep -cE 'error TS[0-9]+' "$D/tsc.log")"
echo "owned tsc errors: $(grep -E 'error TS[0-9]+' "$D/tsc.log" | grep -cE '^(src/storytime/|scripts/storytime-|tests/storytime-)')"
```

Gate: `owned tsc errors: 0`. The total is informational. Other tracks own the rest. Exit `2` with 0 owned errors
passes. The Red files may show owned errors until Green adds the declarations. The Red gate does not read the type
check. The new test files import with the namespace form and cast the loose parts, so a type choice by Green cannot
break them.

### 3.1 Baseline values measured for this strategy

The values below come from runs at `d77957f9` before the strategy commit. The strategy role ran them. The Green
log and the checker compare their values with these.

| Label | Value |
| --- | --- |
| `N_old` (five regression files, GREEN list) | 87 (`Tests  87 passed (87)`, `Test Files  5 passed (5)`, exit 0, 58 s) |
| `tsc errors total` at `d77957f9` | 38 (exit 2; informational) |
| `owned tsc errors` at `d77957f9` | 0 |
| `Tests` of the 11 old files | `155 passed (155)`, `Test Files  11 passed (11)`, exit 0, 104 s |

## 4. Phase 1: specs, judge flag, and delivery writer

### 4.1 Red scope: files, owners, and what each test proves

Red commits only paths under `tests/` and `measure/`. The mid-red gate fails on any other path. Red writes the three
test files in one round. The three tasks are independent: the judge test seeds its own spec files in a temp root, and
the delivery test seeds its own PNG files. No test file depends on another task.

| Path | Owner | Notes |
| --- | --- | --- |
| `tests/storytime-family-word-specs.test.ts`, `tests/storytime-family-word-judge.test.ts`, `tests/storytime-family-word-delivery.test.ts` | Red | Three new test files. |
| `docs/storytime/l2-unit1/family-words/<id>.json` (18 files) | Green | Not test data. Red does not write them. |
| `scripts/storytime-judge-batch.mjs` (flag), `scripts/storytime-judge-batch.d.mts` (types only) | Green | The specification omits the `.d.mts` from the owned paths. The orchestrator accepts it as a types-only Green file (deviation, default yes, as in the card track). |
| `src/storytime/muse-delivery.ts` (`deliverMuseColorSet` only) | Green | The functions `writeMuseDelivery` and `deliverMuseCover` stay unchanged. |

**Safety rules for every test (all three files).**

1. No test makes a provider call. A CLI test sets `env` to `{ PATH, HOME: <empty temp folder> }` only. The judge
   tool makes no provider call by design. The empty `HOME` removes any key read.
2. No test reads a real `out/**/costs.tsv` or a real Muse print. Tests use a temp root. Phase 2 spend cannot change a
   Phase 1 result (A10 time drift). The one exception is the reference-file existence check (FS5), an artifact test.
3. No test reads a path outside the repository, and no test writes in the repository. The path scanner builds its
   needles from pieces (`'Work' + 'books/'`), so the test file does not match its own search.
4. Import each module under test as a namespace (`import * as muse from '../src/storytime/muse-delivery.js'`) and
   read the export through a seam check (`expect(typeof muse.deliverMuseColorSet).toBe('function')`). A missing
   export then fails one assertion. A named import would fail the whole file at load (A4 wrong-reason Red).
5. Every scanner or validator in a test has a seeded-fault control and a good-input control: the same function
   runs on a bad input and must report the fault, and runs on a good input and must report none (A4: a checker
   that flags everything proves nothing). The control base is a synthetic good object that the test builds, not a
   real spec file, so the control also runs in Red.
6. A delivery test that expects a refusal also runs the same input with the one fault removed and expects success.
   This proves that the fault, and only the fault, caused the refusal.

**`tests/storytime-family-word-specs.test.ts`** (id prefix `FS`; reads only the repository; hand-typed expectations
copied from the specification tables, never derived from the spec files under test):

| Id | Proves | Falsification condition |
| --- | --- | --- |
| FS1 | The list v7 fixture has SHA-256 `ba3956fc…8ddf`. A plain `expect`, also run in `beforeAll`. | One changed byte, or a soft assertion that lets later tests run. |
| FS2 | The fixture has 227 rows and holds `l2-w04-card-family`. None of the 18 hand-typed ids is a row. The set of 18 ids has no repeat, and each id matches `^l2-w0[1-7]-card-[a-z]+$`. | The fixture drifts, an id is a row, or the list has 17 or 19 ids. |
| FS3 | `docs/storytime/l2-unit1/family-words/` holds exactly the 18 files `<id>.json`: no extra file, no missing file, no `l2-w04-card-family.json`. The folder `docs/storytime/l2-unit1/cards/` still holds exactly 31 files, each named `l2-w0[1-7]-card-[a-z]+.json`, and none of the 18 ids is among them. The helper returns `[]` for a missing folder, so Red fails on the assertion. | A count-only check passes an extra file or a swapped name (A7), or a file lands in the cards folder. |
| FS4 | Per spec: the key set is exactly `id, text, pageText, use, goal, mustShow, deliverAs, references, colorPrompt, print, aspect, printSize, outDir`. `id` equals the file name. `text` and `pageText` equal the word. `use` is `card`. `deliverAs` equals `<id>-v1.png`. `aspect` is `1:1`. `printSize` is `[1500, 1500]`. `print` is `crop`. `outDir` equals both `guards.CARD_RUN.outDir` (namespace read) and the literal `out/storytime/l2/unit1/cards/muse`. `goal` and `colorPrompt` are non-empty. `mustShow` is a non-empty array of non-blank strings. No key `linePrompt`. | A field differs, an extra key such as `linePrompt` appears, or `CARD_RUN` changes. |
| FS5 | References equal a hand-typed map of 18 entries (set equality per id, section 6 of the specification). Each path is relative, has no `..`, resolves inside the repository, and exists. The failure text lists each missing path. This is an artifact test of local evidence: the files sit in untracked `out/` and exist on this machine only. | A wrong, absent, extra, or outside path. |
| FS6 | `guards.classifyOutDir(spec, <temp unit root>).kind` is `card` for each of the 18 specs. | An `outDir` that classifies as `restart` or `invalid`. |
| FS7 | Forbidden words. In every string of every spec (recursive over all fields, including `mustShow` items and `references`), the case-insensitive whole-word match of `skin`, `race`, `racial`, `ethnic`, `ethnicity`, `complexion` finds nothing. Seeded controls: `pale skin flap`, `Skin tone`, `ethnic`, and `skin-tone` are flagged. `trace`, `embrace`, `bracelet`, `grace`, and `racing` are not flagged. | A substring scan (A7) that flags `trace`, a scan that misses `Skin` or `skin-tone`, or a hit in a spec. |
| FS8 | Prompt phrases. Each `colorPrompt` holds `no text`, `no letters`, `pure white`, `rated G`, and `margin` (case-insensitive) and does not hold `plain light background`. A person prompt holds `Do not change anyone's hair or clothes` and `a tiny dark tick mark at the outer corner of an eye`, and does not hold `Do not change anyone's skin tone`. A body-part prompt holds `exactly one`; the friend prompt holds `exactly two`. | A missing phrase, a card-prompt sentence that names skin, or the list wording. |
| FS9 | Cast. Nan rows (eyes, nose, arms, feet) hold `orange T-shirt`, `red shorts`, and `eyelash`. Pat rows (ears, hands, legs) hold `green T-shirt`, `brown cargo shorts`, `no teddy bear`, and `no bag`. The friend prompt holds both sets. The hand-typed clothes words also appear in `docs/storytime/l2-unit1/judge/cast.json` (the `nan` and `pat` notes), which makes the test fail if the cast note and the expectation drift. | A wrong child, wrong clothes, or a cast note that no longer matches. |
| FS10 | Pointing and parts. Each body-part prompt (eyes, ears, nose, hands, arms, legs, feet) holds `index finger` and `curled`. The prompt holds the part word and its row keyword set (hand-typed: eyes `both eyes`, ears `both ears`, hands `palm` and `five clear short fingers`, arms `elbow`, feet `both shoes`, legs `both legs`). The `mustShow` phrases name the child and the part. | A pointing child without the pointing rule, or a part that no phrase names. |
| FS11 | Animals and objects. Each prompt holds its subject word. Dog: `not the puppy Pip`. Bird: `blue`. Frog: `green`. Duck and horse: `white`. Horse: `no fence` and `no meadow`. Ball and kite: `red-and-yellow`. Kite: `bows`. Drum: `two wooden sticks`. The rows with an `out/<asset>/views/` reference (cat, dog, fish, frog) hold `ignore the gray background`. | A subject keyword that the specification table names and that the prompt lacks. |
| FS12 | Checker controls. `checkSpec` runs on a synthetic good spec (built in the test) and returns no error. It then runs on 10 mutated clones (wrong `aspect`, wrong `outDir`, wrong `deliverAs`, missing reference, extra reference, blank `goal`, added `linePrompt`, injected `skin`, missing `no text`, swapped child clothes) and flags each one with a distinct error label. | A mutation that passes, or a good spec that is flagged. |
| FS13 | Path rule. The test source holds no `/home/`, no temp-folder path, and no Workbooks path (needles built from pieces), plus a seeded control. | A foreign path read. |

Pass on arrival (Red): FS1, FS2 (fixture and id-form parts), the cards-folder part of FS3, and FS12. They lock the
inputs and the checker. All other ids fail on an assertion in Red because the folder does not exist. Red quotes the
split.

**`tests/storytime-family-word-judge.test.ts`** (id prefix `FJ`; temp root only; the option key of the flag is not
pinned: the test passes the parsed object whole to `buildBatch`):

Fixture: a temp root with `docs/storytime/l2-unit1/family-words/l2-w05-card-eyes.json` (a seeded spec: `pageText`
`eyes`, `use` `card`, `mustShow` list, `outDir` `out/storytime/l2/unit1/cards/muse`), a second seeded spec with the
same id and a different `pageText` in `docs/storytime/l2-unit1/cards/`, a `costs.tsv` in
`<root>/out/storytime/l2/unit1/cards/muse/`, and 1500 x 1500 PNG files named `l2-w05-card-eyes-m<n>-color.png`.
Times derive from `guards.CARD_RUN.startTime` (plus one hour, minus one hour). The new test files hold no literal
copy of that time.

| Id | Proves | Falsification condition |
| --- | --- | --- |
| FJ1 | Parse. `parseArgs([...base, '--family-words'])` does not throw; `--bogus` still throws `unknown option`. Without the flag, the parse (undefined keys dropped) equals `{ ids, kind, tryNo, out }`. The parse with `--family-words` differs from the parse with `--cards`. | The flag throws, an old option breaks, or the two flags give the same object. |
| FJ2 | Spec folder. With the parsed flag and `root`, `buildBatch` reads the spec in `family-words/` and not the one in `cards/`: the entry `pageText` is the family-words value. The entry has the keys `judgeFile, id, kind, pageText, use, mustShow`. The judge copy exists under `<root>/out/storytime-review/judge/prod/` with a long side of 360 px (`longSideOf('card')`). | The flag selects the cards folder or the A-48 folder, or the entry shape changes. |
| FJ3 | Try start. A color row at `start − 1 h` (m1) and one at `start + 1 h` (m2) in the card `costs.tsv`: with the flag, try 1 is the m2 row (source `…-m2-color.png`) and try 2 fails with `holds 1 try`. A row at exactly `start` counts. A row with an offset form (`+07:00`) behaves the same. | The try count keeps `RESTART_START`, `>` replaces `>=`, or an offset is ignored. |
| FJ4 | Read only. The tool reads the card `costs.tsv` and writes no cost file: the SHA-256 of `costs.tsv` is equal before and after, and the set of new files under the temp root is exactly the judge copies. | A written or changed cost file. |
| FJ5 | Both flags. `parseArgs([...base, '--cards', '--family-words'])` and the reverse order throw an error whose message holds both `--cards` and `--family-words` and does not hold `unknown option`. The CLI (`node scripts/storytime-judge-batch.mjs … --cards --family-words --out fw-nowrite-test`, with `cwd` the repository and the safe `env`) exits `1`, prints both flags on stderr and no `unknown option`, and creates no file: the list of `docs/storytime/l2-unit1/judge/prod/` is equal before and after, and `fw-nowrite-test.json` is absent. | An exit other than `1`, the old unknown-option text (this makes the test red now for the right reason), or a written file. |
| FJ6 | No flag, no change. `buildBatch` with `cards` and with neither option behaves as before: `cards: true` still reads the cards folder from `CARD_RUN.startTime`. Without any option the A-48 folder applies: an id that has a spec only in the temp `family-words/` folder fails with the A-48 missing-spec message. | The cards or restart behavior changes. |
| FJ7 | `specDir` stays. With the flag and an explicit `specDir`, the spec comes from `specDir`. | The flag overrides an explicit `specDir`. |
| FJ8 | One owner. `scripts/storytime-judge-batch.mjs` imports `CARD_RUN` from `./storytime-muse-guards.mjs` and holds no literal of the card start time or the card `outDir` (the card guard test CG3 stays in the regression set and covers the same rule). | A second literal of the start time. |

Pass on arrival (Red): the "without the flag" parts of FJ1 and FJ6, and FJ8. All other ids fail on an assertion.

**`tests/storytime-family-word-delivery.test.ts`** (id prefix `FD`; temp folders only; PNG fixtures made with `sharp`
and cached; seam check as the `coverSeam` of `tests/storytime-muse-delivery.test.ts`):

Fixture: a temp Muse folder with 1500 x 1500, 8-bit, 3-channel, sRGB PNG files, each with a distinct flat color so
the bytes differ. Muse names follow `l2-w0N-card-<word>-m<n>-color-print.png`. The approval list is
`{ version: 1, entries: [{ rowId, version, colorPrint, text, sourcePrompt, reviews?, notes? }] }`. Each entry has a
distinct `text` and `sourcePrompt`.

| Id | Proves | Falsification condition |
| --- | --- | --- |
| FD1 | Seam. `muse.deliverMuseColorSet` is a function. Lock: `muse.deliverMuseCover` and `muse.writeMuseDelivery` are still functions. | A missing export (Red fails here, on this one assertion line). |
| FD2 | Happy path with three entries (`l2-w01-card-friend`, `l2-w04-card-family`, `l2-w06-card-cat`). The delivery folder holds exactly `<id>-v1.png` for each id and `manifest.json`. Each copy is byte equal to its Muse print (SHA-256). The Muse originals still exist and are unchanged. The returned manifest equals `manifest.json` on disk. The file on disk is `JSON.stringify(manifest, null, 2)` plus a newline. | A missing, renamed, or changed copy, or a manifest that differs from the return value. |
| FD3 | Job values. For the friend row, the cat row, and the family row, the job fields `id, week, directory, bookKind, bookTitle, page, text, sourcePrompt, characters, sourcePackage, sourceSha256, slug, use, size` equal the table "Manifest job values" (`week` as a number; `directory` `w01`, `w06`, `w04`; `bookKind` `readalong`; `bookTitle` `''`; `page` 0; `characters` `[]`; `slug` equal to the id; `use` and `size` `small`). `text` and `sourcePrompt` equal the entry values, and they differ between the three rows. The candidate `file` and the job `selectedFile` are `<id>-v1.png`; `selectedSha256` and `fileSha256` equal the print SHA-256; `status` is `ready`; `structural.valid` is true with width and height 1500. | A job value of `cover` or `small` swapped, a hard-coded text, a text of another row, or a SHA-256 that differs from the file. |
| FD4 | Color only. The manifest has no batch with an `outputKind` other than `color` (the real kind name is `lineart`), no candidate with a `lineArt` key, and one `<directory>/color` batch for each distinct week, each with the right file list. | A `lineart` batch, or a batch that lists a file of another week. |
| FD5 | All 19 ids. A run with the 19 ids of the track, each with its own print, gives 19 jobs and five color batches (`w01`, `w04`, `w05`, `w06`, `w07`) with 1, 1, 7, 7, and 3 files. | A wrong week split or a lost row. |
| FD6 | Bad print. Each of these is refused, and the folder gets no file: 1400 x 1500, 1500 x 1400, 4000 x 3000, an RGBA PNG, a grayscale PNG, a 16-bit PNG (the fixture asserts `depth` is not `uchar` first), JPEG bytes in a `.png` name, and garbage bytes. The message holds the row id. The same entry with a good print succeeds (control). | A wrong print that passes, or a message without the row id. |
| FD7 | Duplicate row id (two entries, same `rowId`, two different prints) is refused. Nothing is written. Control: the same two entries with different ids succeed. | A duplicate that passes, or a partial write. |
| FD8 | Row id form. These are refused, with a valid print each time: `l2-w10-card-cat`, `l2-w00-card-cat`, `l2-w05-cat`, `l2-w05-card-`, `l2-cover-v1`, `../l2-w05-card-cat`, and `l2-w05-card-cat/x`. All 19 track ids are accepted (control). | A malformed id that passes, or a track id that fails. |
| FD9 | File name with a folder part. `colorPrint` values `sub/x.png`, `../x.png`, `/abs/x.png`, `.`, `..`, and the empty string are refused. Nothing is written. A plain name succeeds (control). | A path that escapes the Muse folder. |
| FD10 | Existing file. A delivery folder that already holds `<id>-v1.png` is refused in two cases: different bytes, and identical bytes. The pre-existing bytes stay unchanged, no `manifest.json` appears, and no other entry is written. | An overwrite, a silent skip of an identical file, or a partial write. |
| FD11 | Symlinked delivery folder. A delivery path that is a symlink to an empty folder is refused, and the link target stays empty. A real folder succeeds (control). A symlinked print file in the Muse folder is refused too. | A write through a link. |
| FD12 | All-or-nothing. Three entries where the third has a bad print: the delivery folder stays absent (when it was absent) or empty (when it existed). No first or second file is written. | A file of an earlier entry in the folder. |
| FD13 | Schema edges. Each of these is refused with nothing written: an empty `entries` list, `version` 2, an entry with a `linePrint` key, a missing `text`, a missing `sourcePrompt`, a missing `colorPrint`, and a Kimi review with verdict `fail`. A `notes` array and a Kimi pass review are accepted (control). | A malformed list that passes. |
| FD14 | Review wiring. An entry with a Kimi pass review gives `candidate.reviews.kimi` with `sourceText` equal to the entry `text` and `sourcePrompt` equal to the entry `sourcePrompt`. An entry without a review gives `reviews` equal to `{}`. | A review that reads the wrong source text, or a review that the entry lacks. |
| FD15 | Determinism. The same input in two fresh delivery folders gives byte-equal `manifest.json` files. | A value that depends on time or on the folder name. |

Pass on arrival (Red): the lock part of FD1 only. All other ids fail on the seam assertion. Red quotes the failure
text `deliverMuseColorSet` for them.

Decisions of this strategy that the orchestrator may veto (default yes): FD10 refuses an identical existing file
(the specification says "an existing delivered file" without a condition); FD13 refuses a missing `text` or
`sourcePrompt` (the specification says the caller fills both); FD8 pins the refused ids above and leaves upper-case
and dash-in-word ids open.

### 4.2 Green scope and gates

Green changes only: `docs/storytime/l2-unit1/family-words/*.json`, `scripts/storytime-judge-batch.mjs`,
`scripts/storytime-judge-batch.d.mts`, `src/storytime/muse-delivery.ts`, and the plan. Gates:

1. GREEN_TEST_COMMAND: `Test Files  8 passed (8)`, `Tests  <N> passed (<N>)`, `N = N_new + N_old`.
2. `git diff --name-only <red_head>..HEAD -- tests` prints nothing (Green edits no test).
3. `git diff --name-only d77957f9..HEAD -- tests/storytime-judge-batch.test.ts tests/storytime-card-guards.test.ts tests/storytime-card-specs.test.ts tests/storytime-muse-delivery.test.ts tests/storytime-muse-delivery-adversarial.test.ts` prints nothing (the five regression files pass unchanged).
4. Frozen paths: `git diff --name-only d77957f9..HEAD -- scripts/storytime-muse-guards.mjs scripts/storytime-muse-guards.d.mts scripts/storytime-muse.mjs docs/storytime/l2-unit1/judge docs/storytime/l2-unit1/cards` prints nothing.
5. Writer additions only: `git diff -U0 d77957f9..HEAD -- src/storytime/muse-delivery.ts | grep -cE '^-[^-]'` gives the labeled value `muse-delivery removed lines: 0`. If Green must edit the import block, it adds a second `import` statement. A removed line is a report item for the orchestrator.
6. Judge exports stay: every `export` name of `git show d77957f9:scripts/storytime-judge-batch.mjs` is still exported.
7. One owner: `grep -rnF '2026-11-06T00:00:00Z' scripts tests` lists only `scripts/storytime-muse-guards.mjs` and the card test files. No new test file and no new script holds it.
8. TYPECHECK_COMMAND: `owned tsc errors: 0`.
9. Mutation self-check (section 4.5), quoted in the Green log.
10. The plan note for Task 1 records any prompt wording that differs from the card prompt of the same kind (the checker reads it).
11. Wording: `grep -rniE 'accepted|approved' docs/storytime/l2-unit1/family-words tests/storytime-family-word-*.test.ts measure/tracks/asset_storytime_l2_family_words_20261107` shows only the legal phrases (a quotation of the PM request, "the approved Storytime Muse path", and negations).

Closeout gate for Phase 1 (phase acceptance): gates 1 to 11 at the immutable HEAD, plus PROJECT_TESTS, the
known-red rule (section 4.4), and Review A, Review B, and the adversarial round with no open blocker.

### 4.3 Architecture guardrails and changed-contract risks

| Guardrail or risk | Rule |
| --- | --- |
| One decision point | `CARD_RUN` stays the only owner of the cap, start, tries, and folder. This track changes no guard value and no guard file (gate 4). The judge flag reads `CARD_RUN.startTime`. |
| Judge flag exclusivity | The error for `--cards` plus `--family-words` comes from `parseArgs`, before `buildBatch` and before any file write. The CLI exits `1`. `main` writes the batch file only after a successful `buildBatch`. |
| Judge `specDir` | The `specDir` option of `buildBatch` stays as it is and wins over the flag (FJ7). |
| Judge batch files | The tool writes `docs/storytime/l2-unit1/judge/prod/<out>.json` (a module constant, not under `root`). This folder sits inside the frozen judge folder. Phase 2 adds only new files named `fw-<round>-<kind>.json` there (deviation, default yes: additions only, no change or delete of an existing file). The frozen-kit gate uses `--diff-filter=MDRT`. See section 6. |
| Writer reuse | `deliverMuseColorSet` reuses `inspectColorPrint`, `readMuseFile`, `assembleManifest`, and the folder check of the cover writer. It filters the `lineart` batches like the cover. It does not edit those helpers. |
| Writer overwrite rule | `commitDelivery` accepts an identical existing file. The new writer must refuse it (FD10). The refusal check runs before any write. |
| Writer order | All checks run before the first write (FD12). The `wx` flag creates a file only when none exists. |
| Row id form | `^l2-w0[1-9]-card-<word>$`. The week number comes from the id. The directory is `w0N`. |
| Manifest directory | The batches follow the job `directory`. A multi-week set gives one color batch for each week (FD4, FD5). |
| Spec `references` | The 11 reference paths sit in untracked `out/`. FS5 is an artifact test. It cannot pass on a fresh clone. This is by design. |
| Types | `scripts/storytime-judge-batch.d.mts` accepts the new option. The new tests cast the parsed options. |
| Dependency on card specs | The cards folder keeps 31 files. The card spec test (regression) and FS3 both check this. |

### 4.4 Intentionally red aggregate suite: `tests/storytime-book-pictures.test.ts`

The file stays out of GREEN_TEST_COMMAND and PROJECT_TESTS. It stays red while the live Workbooks list differs from
the v4 pin in the file. This track does not change the file. `src/storytime/book-pictures.ts` loads
`muse-delivery.js` by dynamic import, so the writer change can in theory reach the file. The rule below protects
the file with one run at final acceptance only.

KNOWN_RED_COMMAND (final acceptance, once; the Phase 1 checker runs it too, because the writer change comes in Phase 1):

```sh
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1' > "$D/known-red.log" 2>&1; echo "known red exit: $?"
```

The result passes when all of these hold:

1. **Untouched file.** `git diff --name-only d77957f9..HEAD -- tests/storytime-book-pictures.test.ts src/storytime/book-pictures.ts` prints nothing.
2. The file runs whole and alone, with no `-t` filter. The `Tests` line sums to 142 (labeled `Tests  <failed> failed | <passed> passed (142)`). No skipped and no todo test.
3. The pin-set script, extracted from the archive strategy `measure/archive/asset_storytime_l2_unit1_pictures_20261025/test-strategy.md` (between the `pin-set.mjs begin` and `pin-set.mjs end` comment lines, without the fence lines), has SHA-256 `f67cfa8f17d380cb7e6f7632612b8f56d5cba6793d642a90abf2b5c1fd4a3fe0` (verified at `d77957f9`). It prints `tests in the file: 142` and the 13 names `T142,T143,T144,T145,T147,T148,T149,T150,T173,T174,T175,T176,T177`.
4. The live list SHA-256 (`sha256sum` of the Workbooks `content/storytime/l2/print/pictures.json`) differs from `6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58`. Then the exit is `1`.
5. Every failing test is in the named set (`known red failing tests outside the pin set: 0`). A `FAIL` line without a test id fails the gate.
6. All four drift sentinels `T142,T147,T173,T174` fail (`known red drift sentinels failing: 4 of 4`).
7. The T173 failure text does not contain `The version 3 shadow copy exists`.

Extraction and measurement commands are the ones of the card-track strategy, section 4.4, with the diff base
`d77957f9` (condition 1 is stricter here: zero changed lines). The carry-over rule applies to a Measure-only commit:
the measured results carry over when `git diff --name-only <measured>..HEAD` lists only files under `measure/`.

Falsification: a failing test outside the named set; a sentinel that passes while the list differs; a skip or a
filter; a total other than 142; a changed line in the file; a script SHA-256 that differs.

### 4.5 Mutation self-check (Green runs, the checker reruns)

Each mutation runs on a scratch copy, never in the shared tree. Make it with
`git archive HEAD scripts src tests docs/storytime/l2-unit1 package.json tsconfig.json vitest.config.ts | tar -x -C "$D/m"`,
a `node_modules` symlink, and an `out` symlink to the real `out/` (the spec test reads reference files there).
Apply one change, run only the named test file through `heavy-run.sh`, and quote the failing ids. The restored copy
must pass.

| Mutation | File to run | Must fail |
| --- | --- | --- |
| MJ1 the flag selects the cards folder | judge | FJ2 |
| MJ2 the flag keeps the A-48 folder | judge | FJ2 |
| MJ3 the flag keeps `RESTART_START` for tries | judge | FJ3 |
| MJ4 the flag accepts `--cards` together | judge | FJ5 |
| MJ5 the flag writes or changes a cost file | judge | FJ4 |
| MJ6 the flag overrides an explicit `specDir` | judge | FJ7 |
| MD1 skip the size check | delivery | FD6 |
| MD2 drop the alpha check | delivery | FD6 |
| MD3 drop the duplicate check | delivery | FD7 |
| MD4 drop the row id form check | delivery | FD8 |
| MD5 drop the plain file name check | delivery | FD9 |
| MD6 accept an existing identical file | delivery | FD10 |
| MD7 follow a symlinked delivery folder | delivery | FD11 |
| MD8 write each file before all checks end | delivery | FD12 |
| MD9 keep the `lineart` batches | delivery | FD4 |
| MD10 hard-code `text` or `sourcePrompt` | delivery | FD3 |
| MD11 set `use` or `size` to `cover` | delivery | FD3 |
| MS1 add the word `skin` to one prompt | specs | FS7 |
| MS2 add a `linePrompt` to one spec | specs | FS4 |
| MS3 set one `outDir` to a week folder | specs | FS4 and FS6 |
| MS4 swap Nan and Pat clothes in one prompt | specs | FS9 |
| MS5 add a 19th file to `family-words/` | specs | FS3 |
| MS6 remove one reference | specs | FS5 |

### 4.6 Artifact tests and live behavior

FS1 to FS13 are **artifact tests** of the 18 spec files and the inputs: they check bytes, files, and text. FS12
is a behavior test of the checker on synthetic data. FJ1 to FJ8 and FD1 to FD15 are **behavior tests** of pure
functions and of one CLI on temp data. None of them proves a picture or a provider call. The live behavior proof of
the track is Phase 2: the Muse calls, the judge records, `costs.tsv`, the delivery manifest, and `MANIFEST.txt`.
Phase 1 makes no provider call. Spend stays 0.00 USD.

### 4.7 Anti-pattern coverage, Phase 1

| Class | Defense in Phase 1 | Falsification condition |
| --- | --- | --- |
| A2 | Not applicable: no publish gate. The delivery is private and is model evidence. | none |
| A3 | Counts use labels: `Test Files`, `Tests`, `owned tsc errors:`, `muse-delivery removed lines:`, `known red failing tests:`. FS2, FS3, FD5 type their counts (18, 31, 19, and the file counts per batch). | A bare number satisfies a gate. |
| A4 | Red imports as a namespace and fails on a seam assertion, not on a load error. Every checker has a good-input control and a seeded-fault control that run in Red (FS7, FS12, FD6 to FD9, FD13). The refusal tests run a one-fault-removed twin. FJ5 and the CLI part of FS tests pin the new error text so that the old `unknown option` text cannot satisfy them. The pass-on-arrival sets are named, so a Red with zero passing tests is a finding. | A Red that fails on a load error, a refusal test that passes with the fault removed, a scanner that flags every input, or a lock without a mutation. |
| A5 | Plan notes and Green logs quote command, exit code, and labeled values. `N_new` and `N_old` tie to counts. The Red log and the Green log quote the same `N_new`. | A plan number differs from the log. |
| A6 | No text calls a judge pass or a delivery "accepted". The grep of gate 11 runs at every gate. | A claim in prose. |
| A7 | FS3 compares names, not only the count. FS7 matches whole words, with `trace` and `grace` as negative controls. FS4 pins the exact key set. FS5 compares a hand-typed map. | A swapped file name passes, a substring scan flags a legal word, or an extra key passes. |
| A9 | No test reads an archived track path. The archived strategy path is read only to extract `pin-set.mjs` (section 4.4). | A test reads an archived path. |
| A10 | No Phase 1 test reads a real `costs.tsv` or a Muse print. Times derive from `CARD_RUN.startTime`. Generated facts are not rebuilt in this track. | A Phase 1 result changes after Phase 2 spend. |
| A11 | The specification, the plan, and this file name the same constants, files, and counts. Closeout re-reads them (section 7). | A doc value differs from `CARD_RUN` or from the code. |

### 4.8 `phase_base_sha` capture point

The orchestrator captures `phase_base_sha` with `git rev-parse HEAD` **after** the strategy commit (message
`measure(storytime_l2_family_words): test strategy`) passes the strategy role-gate, and **before** Red starts. The
value is that commit or a later Measure-only commit. It is never `d77957f9`, which comes before this file. Gates
that name `d77957f9` as a diff base (gates 3, 4, 5, 6, and the known-red rule) stay valid: no gated file changes
between `d77957f9` and the strategy commit.

## 5. Phase 2: family-word pictures and delivery (outline)

Risk: medium. Roles: maker `measure-jr-green`, checker `measure-phase-acceptance`. No Red. The maker writes no
code and no test. Phase 2 starts only after Phase 1 acceptance.

Plan facts for the maker:

- Task 4 shell checks run first and the maker records three labeled lines in the role log: `list v7 sha256:`,
  `family png sha256:`, and `costs.tsv before: 74 call rows, 0.74 USD`. The maker also records
  `costs.tsv head sha256:` (SHA-256 of the first 75 lines) so that the checker proves the card rows stay unchanged.
  The maker records the time (UTC) of each line. No Muse call runs before these lines.
- Calibration: the two gate controls of `calibration-set.json` run through the frozen judge once. The result file is
  `measure/runs/asset_storytime_l2_family_words_20261107/calibration-record.json` in the form of the card
  `calibration-record.json`. Both verdicts are `fail`. A control that passes stops the track and reports to the PM.
- Muse: `node scripts/storytime-muse.mjs color docs/storytime/l2-unit1/family-words/<id>.json … --concurrency 4`.
  The family row gets no call.
- Judge batches: `node scripts/storytime-judge-batch.mjs --family-words --ids <ids> --kind color --try <n> --out fw-<round>-color`.
  The batch file goes to `docs/storytime/l2-unit1/judge/prod/` (new file, additions only).
- Delivery: a script in the run folder (`make-handoff.mjs` or `.mts`, no test) builds the approval list, calls
  `deliverMuseColorSet`, copies the files to the handoff folder, writes `MANIFEST.txt` and the contact sheet. The
  delivery uses the print of the first passing try. The family entry reads the card print.

**Record files** in `measure/runs/asset_storytime_l2_family_words_20261107/`:

| Record | File | Content |
| --- | --- | --- |
| Role log | `jr-green-<HEAD7>.log` | Precondition lines, operating-rule lines, report-point note, result block. |
| Calibration | `calibration-record.json` | Both controls with `verdict` `fail`, `model`, `status` `complete`, and a `time` field (UTC). |
| Judge result, main | `judge-fw-<round>-color.json` | One file for each batch. The form is the form of `judge-cards-*.json`. |
| Judge result, second | `judge-fw-<round>-color-<id>-second.json` | One file for each second judge on a fail. The judge sees the file alone. |
| Spend | `spend-record.txt` | Labeled lines: `calls:` (new calls), `track spend usd:`, `total usd:`, `total calls:`, `report point 0.80 reached: yes`, `total at report point:`, `projection:`. |
| Delivery | `delivery-record.txt` | Labeled lines: `delivered files:`, `failed rows:` (ids with best try), `manifest.json sha256:`, `MANIFEST.txt sha256:`. |
| PM report | `pm-report.md` | One status line, the handoff path, the delivered count, the track spend, the total, the call count, each failed row with its best try, the white-corner list, and the words "model evidence, not acceptance". |
| Checker | `acceptance-p2-<HEAD7>.json` and `.log` | Written by the checker. |

### 5.1 Operating rules for the maker

The checker verifies these from the maker log and from `$S/costs.tsv`. A rule that the log does not show is a
Phase 2 failure. The rules adapt the card-track rules a, b, c, e, and f to the smaller run (rule d, `--tries`, does
not apply: no line call).

| Id | Rule | The checker verifies by | Falsification condition |
| --- | --- | --- | --- |
| a | The per-call re-check cannot see calls in flight. So the maker runs a pool with `--concurrency 4` at most while the recorded total in `$S/costs.tsv` is **below 1.40 USD**. At or above 1.40 USD the maker uses `--concurrency 1`. Reason: at most 4 calls are in flight at a worst-case 0.03 USD each (0.12 USD), and 1.40 + 0.12 is below 1.60. | The maker log names the total before each pool and its flags. | A pool at or above 1.40 USD with concurrency above 1. |
| b | After each pool the maker reads every new row of `$S/costs.tsv`. If any row costs more than 0.03 USD, the maker stops and reports. | The log lists the highest new row cost after each pool. The checker finds the highest cost in the file. | A row above 0.03 USD with no stop. |
| c | A refusal inside a pool exits `0`: the tool prints the message and returns. The maker reads the tool output for a `refused` line after each run. | The log quotes `refused lines: <n>` for each run. | A run that logs only an exit code. |
| e | Nobody edits `costs.tsv` by hand. The header keeps the `time` and `usage_cost` columns. | The checker sums `usage_cost` of the rows with a time at or after the start with a read-only script and compares with `spend-record.txt`. | A header without those columns, a sum that differs, or a changed card row (`head -n 75 | sha256sum` differs from the logged value). |
| f | Report point: at a total of 0.80 USD the maker records the total, the track spend, and the projection once, and continues. Cap: 1.60 USD. The maker stops only at the cap. | The checker reads the report-point lines in `spend-record.txt`. | A stop at 0.80 USD, or a missing record. |

The checker adds the labeled line `operating rules: pass|fail` to its log with one reason for each rule.

### 5.2 Checks the checker runs

`R` is the run folder, `D` the delivery folder `out/storytime/l2/unit1/family-words/delivery-muse-v1`, `H` the handoff
folder, `S` the Muse folder `out/storytime/l2/unit1/cards/muse`. Each check is read-only and writes one labeled line.

| Id | Check | Pass condition | Falsification condition |
| --- | --- | --- | --- |
| P2-1 | Preconditions. The role log has the four precondition lines with a time before the first new row of `$S/costs.tsv`. A fresh `sha256sum` of the fixture and of the family print equal the pins. `head -n 75 $S/costs.tsv | sha256sum` equals the logged value. The card spend record `measure/runs/asset_storytime_l2_cards_20261106/spend-record.txt` says `calls: 74` and `spend usd: 0.74`. | All equal. | A later record time, a changed input, or a changed card row. |
| P2-2 | Calibration. `calibration-record.json` has both controls with `verdict` `fail`, and its `time` is before the first judge result of a new picture. `git diff --name-only --diff-filter=MDRT d77957f9..HEAD -- docs/storytime/l2-unit1/judge` prints nothing. | As stated. | A control that passes, a missing record, or a changed kit file. |
| P2-3 | Judge result and print link for each delivered new row. A **delivered try** is the first try of its id with a judge pass: a main `pass`, or a main `fail` that the matching second-judge file does not confirm. Every earlier try has a confirmed fail. The delivered print has the `m<n>` of that try's row in `$S/costs.tsv` (try k is the k-th color row of the id at or after the start). The family row has the `pass` of `judge-cards-cards-r1-color.json` for `l2-w04-card-family` try 1. | Count of delivered new rows with a pass = count of delivered new rows. | A file with no pass, a stand-alone fail, a print whose `m<n>` is not the passing try, a later try after the first pass, or an earlier try with no confirmed fail. |
| P2-4 | Tries and order. Rows of `$S/costs.tsv` after the first 74: only the 18 new ids, only kind `color`, at most 3 for each id, none for `l2-w04-card-family`. | Labeled `max tries per id: <n>` with n at most 3. | A fourth try, a line row, a row of another id, or a family call. |
| P2-5 | Spend. The sum of `usage_cost` of the rows of the 18 new ids is the track spend. The sum of the file is the total. | Track spend at most 0.86 and equal to `spend-record.txt`. Total at most 1.60 and equal to 0.74 plus track spend (compare to two decimals). `total calls` equals 74 plus the new row count. Each cost-0 failed row is listed. If the total passed 0.80, the report-point lines exist. | A sum above the limit, an unlogged call, or a missing report-point note. |
| P2-6 | Manifest and bytes. In `H`: `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -` gives `OK` for every file line. `D` and `H` hold the same PNG bytes. `manifest.json` in `D` and in `H` is the same file and lists the same PNG files, one color batch for each week and no `lineart` batch. The family file SHA-256 is `ab6067ee…` in the manifest and equals the card print. | `OK` for every line. File count = delivered rows (19 minus failed rows). | A `FAILED` line, a file not in the manifest, a count mismatch, or a `lineart` batch. |
| P2-7 | Sizes and form. Each PNG in `H` is 1500 x 1500, 8-bit, 3 channels, sRGB, no alpha (read with `sharp` metadata in a temp script). The class C corner result (a corner value below 250) is a **report item**, not a gate. | `files checked: <n>` with n above 0 and equal to the delivered count, `gate problems: 0`. The labeled list `color files below 250: <n>` names each file with its lowest corner value, and `pm-report.md` and `MANIFEST.txt` name the same files and values. | A size, depth, channel, or alpha problem, an empty check set, or a corner file that the report or `MANIFEST.txt` does not name. |
| P2-8 | Contact sheet. One PNG in `H`, named `storytime-l2-family-word-pictures-contact-sheet.png`, with one tile and one word label for each delivered row, four tiles in a row, color only. The checker opens the sheet and the full-size person rows (friend, eyes, ears, nose, hands, arms, legs, feet). | Tile count = delivered count. Each person row shows the child that the specification table names (Nan has two buns and an orange T-shirt; Pat has short black hair and a green T-shirt). The friend picture shows exactly two children and each body-part picture shows exactly one. The dog is not the puppy Pip. No letter or number is visible. | A missing tile, a wrong child, a second person in a body-part picture, a visible text, or a pointing hand that covers the named part. The checker names other defects as notes (Daniel's bar of 2026-11-01). |
| P2-9 | Wording FR-12. `grep -rniE 'accepted|approved' <track folder> "$R" "$H"` and read each line. | Only lines that quote the PM request, name "the approved Storytime Muse path", name a file, or negate. | A line that says a picture or the delivery is accepted or approved. `MANIFEST.txt` and `pm-report.md` hold "model evidence, not acceptance". |
| P2-10 | Forbidden words. `grep -niwE 'skin|race|racial|ethnic|ethnicity|complexion'` over the 18 spec files, the `fw-*.json` batch files, and the maker role log. The judge result files are outside this scan: they hold free model notes. | No output. | A hit. |
| P2-11 | Frozen paths and read-only inputs. `git diff --name-only d77957f9..HEAD -- scripts/storytime-muse-guards.mjs scripts/storytime-muse-guards.d.mts scripts/storytime-muse.mjs docs/storytime/l2-unit1/cards assets/fireball.ts out/fireball` prints nothing. The `--diff-filter=MDRT` kit check of P2-2 prints nothing. `git status --short` of the Workbooks tree shows no change under `content/storytime/l2/print/`. | As stated. | A foreign path. |
| P2-12 | Allowed file set (section 6). Every file of the track commits is inside the set. | Count of own files outside the set = 0. | A file outside the set. |
| P2-13 | No picture in git. `git diff --name-only --diff-filter=A d77957f9..HEAD | grep -ciE '\.(png|jpe?g)$'` gives `0`. | `0`. | A PNG or JPG in git. |
| P2-14 | Card delivery untouched. `sha256sum out/storytime/l2/unit1/cards/delivery-muse-v1/manifest.json` equals `65699fb55d7e106194b6aca9c49fa30afaa2271472a592e84f25ecb9587c1fe2`. The folder `docs/storytime/l2-unit1/cards/` still holds 31 files. | Equal. | A changed card manifest. |
| P2-15 | Secret scan of `R` and `H`: no `sk-`, `OPENROUTER`, or `Bearer` text. | No output. | A hit. |
| P2-16 | PM report. `pm-report.md` holds one status line with the handoff path, the delivered count, the track spend, and each failed row; the total, the call count, the white-corner list; the statement that Daniel sees the pictures in his 11-16 check; and "Facts changed: none" unless a row failed. Its numbers equal `spend-record.txt` and `delivery-record.txt` (A5). | All present and equal. | A number that differs, or a claim of acceptance. |
| P2-17 | Maker script scope. The script stays in `R`, writes only to `D`, `H`, and `R`, and holds no key text. The checker reads it once. | As stated. | A write elsewhere. |

Phase 2 closeout gate: P2-1 to P2-17 pass and the operating rules pass. `PROJECT_TESTS` still passes (carry-over
allowed when only files under `measure/` and `docs/storytime/l2-unit1/judge/prod/fw-*.json` changed since the
measured commit). The plan marks Tasks 4 to 7 `[x]` with commit SHAs.

Anti-pattern coverage, Phase 2:

| Class | Defense | Falsification condition |
| --- | --- | --- |
| A4 | P2-3, P2-6, and P2-7 compare a delivered count with a pass count, and P2-7 needs `files checked` above 0. A run with 0 files cannot pass. | An empty delivery passes. |
| A5 | P2-5 and P2-16 quote the same sums and counts as `costs.tsv`. | A report number differs from the rows. |
| A6 | P2-9 and the words "model evidence, not acceptance". | A claim of acceptance. |
| A7 | P2-9 reads each line, so the legal phrase "approved Storytime Muse path" does not hide a real hit. P2-10 uses whole-word matching. | A real hit dropped by the filter, or a substring hit. |
| A10 | P2-1 and P2-2 read the inputs and the kit again at the checker time. | A result carried over a changed input. |

## 6. Allowed file set (Phase 1 gate, Phase 2 gate, final acceptance)

Phase 1 set:

```text
^(measure/(tracks|runs)/asset_storytime_l2_family_words_20261107/|measure/(tracks|status|tech-debt|lessons-learned)\.md$|measure/generated/|docs/storytime/l2-unit1/family-words/l2-w0[1-7]-card-[a-z]+\.json$|scripts/storytime-judge-batch\.(mjs|d\.mts)$|src/storytime/muse-delivery\.ts$|tests/storytime-family-word-(specs|judge|delivery|adversarial)\.test\.ts$)
```

Phase 2, final acceptance, and closeout add two entries (deviation, default yes: additions only):

```text
|docs/storytime/l2-unit1/judge/prod/fw-[a-z0-9-]+\.json$|measure/archive/asset_storytime_l2_family_words_20261107/
```

Check: list the files of the commits since `d77957f9` (`git log --no-merges --format=%H d77957f9..HEAD`, then
`git diff-tree --no-commit-id --name-only -r <sha>`). The orchestrator names its own commits for this track. The
count of own files outside the set must be 0. The checker names each commit of another agent and does not fail on
it, unless it touches a Storytime path of this track. The frozen judge kit check uses `--diff-filter=MDRT`, so the
new `fw-*.json` batch files (status `A`) do not count as a kit change.

## 7. Final acceptance and closeout (outline)

Final acceptance runs at an immutable HEAD after the Phase 2 gate. It makes no Muse call and no judge call. Order:

1. PROJECT_LINT (read-only; no linter exists in this repository, so it checks artifacts):
   - `node measure/tools/doctor.mjs --structural-only --root .` prints no line that names this track;
   - `grep -rnF '2026-11-06T00:00:00Z' scripts tests` lists only the guard module and the card test files;
   - the allowed-set check of section 6;
   - the FR-12 grep (P2-9) and the forbidden-word scan (P2-10);
   - the secret scan (P2-15);
   - the plan counts (`[x]` lines, no non-deferred open task);
   - `git diff --name-only d77957f9..HEAD -- assets/fireball.ts out/fireball scripts/storytime-muse-guards.mjs scripts/storytime-muse.mjs docs/storytime/l2-unit1/cards` prints nothing;
   - `git diff --name-only --diff-filter=MDRT d77957f9..HEAD -- docs/storytime/l2-unit1/judge` prints nothing.
2. PROJECT_CHECKS: TYPECHECK_COMMAND (`owned tsc errors: 0`) and KNOWN_RED_COMMAND with the rule of section 4.4.
3. PROJECT_TESTS: the 14 files of section 3 (15 with the adversarial file). `Test Files  14 passed (14)`, and the
   `Tests` sum with its parts quoted.
4. Compare the plan, `metadata.json`, and `pm-report.md` quotes with `spend-record.txt` and `delivery-record.txt`
   (A5). Name each difference.
5. Re-run P2-1, P2-5, P2-6, and P2-9 at the final HEAD. They are cheap and they catch late edits.

Closeout (role `closeout`) follows the closeout brief of the archive: explicit `git add` paths, the foreign-state
check of `measure/tracks.md`, `measure/generated/`, and other plans. It archives the track, updates the registry,
runs `./measure/generate.sh` and `./measure/doctor.sh` only when no foreign change sits in `measure/generated/`,
and commits `measure/runs/asset_storytime_l2_family_words_20261107/`. The registry words stay "delivered, awaiting
Daniel's 11-16 check". It does not write "accepted". Foreign generated facts stay out of the commit.

## 8. Residual risks and defaults

| Item | Default | Owner |
| --- | --- | --- |
| The specification says the judge folder is frozen, and the batch tool writes `docs/storytime/l2-unit1/judge/prod/<out>.json` there. | Treat new `fw-*.json` files as allowed additions. The frozen check uses `--diff-filter=MDRT`. The orchestrator confirms. | Orchestrator |
| The specification omits `scripts/storytime-judge-batch.d.mts` from the owned paths. | Treat it as an allowed types-only file (section 6). | Orchestrator |
| The specification text says "no batch of the output kind `line`". The real value is `lineart`. | FD4 checks that every batch has the kind `color`. Both names are covered. | Strategy |
| FS5 needs 11 untracked reference files in `out/`. | Keep. A fresh clone fails by design. | Specification |
| FD10, FD13, and FD8 pin three decisions that the specification leaves open (section 4.1). | Default yes. The orchestrator may veto before Red starts. | Orchestrator |
| The forbidden-word scan covers the specs, the batch files, and the maker log. The judge result files hold free model notes. | Keep the scope. The rule protects prompts. | Strategy |
| The model judge can pass a picture with the wrong child at card size. | P2-8 makes a wrong child or a second person a blocking finding. | Checker |
| The Muse call can fail with cost 0 and does not count as a try. | P2-5 lists each cost-0 row. | Maker; checker verifies |
| `loadPictureList` and `deliver` of `book-pictures.ts` are not used by this track. | The new writer needs no list row. A change in `book-pictures.ts` is out of scope (P2-11 and section 4.4). | Specification |
| The known-red suite can in theory feel the writer change through a dynamic import. | Run KNOWN_RED_COMMAND once at the Phase 1 acceptance and once at final acceptance. | Checker |

## 9. Baseline measurements (strategy role, `d77957f9`)

The strategy role measured these values before the commit. The section is the source for `N_old` and the type-check
baseline.

| Label | Value |
| --- | --- |
| `N_old` | 87 (five files: judge-batch, card-guards, card-specs, muse-delivery, muse-delivery-adversarial) |
| `Tests` of the 11 old files | 155 |
| `tsc errors total` | 38 (all outside the owned prefixes; informational) |
| `owned tsc errors` | 0 |
