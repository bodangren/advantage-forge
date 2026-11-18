# Test strategy: plan and accept civic scenes

Track: `asset_scenes_civic_20260928`. Scope: Phase 1 "Inventory" through Phase 4 "Records".
This strategy owns all four phases. It covers records and evidence only. It changes no product source.
Role base and baseline: `a4905853` (orchestrator brief). The phase base rule is in section 12.

## 1. Inputs and facts

- Read: `spec.md`, `plan.md`, `spec-review.md`, the round 2 JSON and log, `measure/index.md`,
  `measure/tracks.md`, `measure/workflow.md`, the anti-pattern catalog, and the orchestrator contracts.
- Gap: `measure/anti-patterns.md` does not exist in this repository. This strategy uses the canonical
  catalog `~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md`. A1 and A8 are
  retired there. Live classes are A2 to A7 and A9 to A11. Section 11 cites them.
- `graph.db` is absent. `build-graph` is available. This track edits no product symbol, so no graph
  query is needed. The round 2 review verified the glob in `src/scene/main.ts` line 18 and the
  `scripts/design-<slug>.mjs` writers.
- Fact: `docs/fantasy-world-scene-blueprints.tsv` has four columns: `scene_id`, `group`, `priority`,
  `status`. Thirty civic rows hold priority `P2` and status `mockup-needed`. Two civic rows are P0.
  This track touches only the 30 P2 rows.
- Fact: the slug is the `scene_id` suffix after `locations/civic/`. Each slug has one source in
  `scenes/maps/<slug>.ts`, one design note in `docs/map-mockups/<slug>.md`, one mockup JPG, and two
  shots `<slug>-3q.png` and `<slug>-top.png`.
- Fact: `scripts/shoot-map.mjs` renders shots from a vite server on port 5199. It reads
  `FORGE_SHOT_BASE`, `FORGE_SHOT_SIZE`, and a `<name>=<query>` argument per view.
- Fact: `docs/map-review.html` is generated from `bench/sonnet/log.tsv` by
  `scripts/map-review-page.mjs`. No tool reads the page. It is a view, not a record.
- Fact: the judge route is `ra-quota pick vision-review`. The default maker family is Anthropic Sonnet.
  The judge family must differ from the maker family. Self-rating is banned.
- Heavy command rule: shots, builds, vitest, and tsc run only through
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
  Exit 75 means wait and retry. Light `grep`, `awk`, `ls`, and `git` checks run directly.
- Do not run `./measure/generate.sh` in this track. Another session owns `measure/generated/*`.

## 2. State model and the stop rule

| State | Meaning | Set in |
| --- | --- | --- |
| `inventoried` | The row holds source, note, shots, MAPS rating, note, and maker family. No independent judge rating exists. | Phase 1 |
| `rated` | An independent judge rating and its note are copied into the row. | Phase 2 |
| `reworked` | A maker changed the source and fresh shots exist. | Phase 3 |
| `accepted` | A judge rating of at least 7.0 exists. The TSV status is `accepted`. | Phase 3 or 4 |
| `follow-up` | The rerate is below 7.0, a critical error blocks the map, or the source is absent. The TSV status is `follow-up`. | Phase 3 or 4 |
| `missing` | No source exists in `scenes/maps/`. The TSV status is `follow-up`. | Phase 1 |

Every gate reads the stop rule as one independent rating, one rework, and one rerate. The rating
sources count in this order: the recorded MAPS rating, the Phase 2 judge rating, and the Phase 3
rerate. Three ratings is the maximum. No gate starts a fourth rating. A rerate below 7.0 sets
`follow-up`. A row stays `inventoried` until a judge rates it. A MAPS rating from
`bench/sonnet/log.tsv` is not an independent judge rating.

F8 (round 2 Nit): `spec.md` "Rework rule" names a third rating and a fourth rating path. `plan.md`
Phase 3 caps a map at one rework and one rerate. The gates read the plan. F8 is a spec-wording item
for the orchestrator. This role does not edit `spec.md`. See section 13.

## 3. Risks and phase classification

| Phase | Risk | Reason |
| --- | --- | --- |
| Phase 1: Inventory | low | Documentation only. No source change and no TSV change. |
| Phase 2: Independent review | medium | Judge independence, labeled ratings, and four-batch coverage. |
| Phase 3: Rework | high | Rework writes scene sources and fresh shots. Family rule and stop rule apply. |
| Phase 4: Records | medium | The TSV is the acceptance record. IDs and the doctor gate apply. |

| Risk | Effect | Level | Falsifier |
| --- | --- | --- | --- |
| An inventory row names a path that does not exist. | The judge rates nothing. | medium | P1-b fails on the missing path. |
| A MAPS rating is copied as an independent rating. | A row is accepted on a self-rating. | high | P1-c and P2-d fail. |
| The judge family matches the maker family. | The rating is not independent. | critical | P2-c and P3-c fail. |
| A rating is matched by any digit. | A date or stray digit passes as a score. | high | P2-b and P3-a fail on labeled parse. |
| Two reworks or two rerates run for one map. | The stop rule breaks. | high | P3-a and P3-d fail. |
| A reused old shot stands as a fresh shot. | A rework passes without a new render. | high | P3-b fails on mtime and SHA-256. |
| An accepted row holds a rating below 7.0. | The bar breaks. | critical | P3-e and P4-c fail. |
| A TSV edit changes an ID. | Downstream readers break. | high | P4-b fails on the diff. |
| `docs/map-review.html` is edited as a record. | Two records disagree. | medium | P4-e fails on the diff. |

## 4. Fixtures, mocks, and live-behavior proof

- Fixtures: the 30-slug list derived from the TSV; the inventory row schema; the batch JSON schema.
  A batch JSON holds one entry per map with its slug, rating, note, judge family, maker family, and
  shot paths. A batch log holds the route, the model id, and the date.
- Mocks: none. No product code changes. The MAPS rating is a labeled pre-existing record, not a judge.
  A maker rating or a self-rating cannot stand in for the independent judge.
- Live-behavior proof: a reworked map must have fresh shots rendered by `scripts/shoot-map.mjs` from
  its scene source while the vite server runs. File existence alone is not proof. A judge must rate
  the actual shot PNGs against the design note. A hand-edited PNG or a reused old shot fails P3-b on
  mtime and SHA-256. A rating is model evidence, not acceptance. The TSV status is acceptance.

## 5. Checks for each plan task

Red authors one structural checker per phase in `measure/runs/asset_scenes_civic_20260928/`.
A checker is a light shell script. Each check below states its falsification condition.

| Plan task | Check ids |
| --- | --- |
| P1 task 1: write the inventory | P1-a, P1-b, P1-c, P1-d |
| P1 task 2: mark a source-less row `missing` | P1-d |
| P2 task 1: send shots to an independent judge in batches | P2-a, P2-b, P2-c |
| P2 task 2: copy ratings and mark rows `rated` | P2-d |
| P3 task 1: rework each map below the bar and reshoot | P3-a, P3-b |
| P3 task 2: rerate each reworked map once | P3-c, P3-e |
| P3 task 3: apply the stop rule | P3-d |
| P4 task 1: update the TSV status column | P4-a, P4-b, P4-c, P4-d |
| P4 task 2: decide the `docs/map-review.html` note | P4-e |
| P4 task 3: run the doctor | P4-f |

### Phase 1: Inventory

Targeted Red command: `bash measure/runs/asset_scenes_civic_20260928/check-inventory.sh`.
Today it exits non-zero because `scenes/inventory.md` does not exist.

- P1-a: the file exists and holds exactly 30 data rows. The slug set equals the 30 civic P2 slugs
  read from the TSV. Falsifier: an empty or absent file, or a slug count other than 30.
- P1-b: each row names an existing source, design note, mockup JPG, and both shots. Falsifier: any
  named path is absent.
- P1-c: each row records the MAPS rating and note from `bench/sonnet/log.tsv`, an independent-judge
  field set to `no`, and the maker family. Falsifier: a row claims a judge rating in Phase 1.
- P1-d: each row holds state `inventoried`, or `missing` when its source is absent. Falsifier: an
  absent source without a `missing` label, or a `rated` label in Phase 1.

Green gate: the checker passes. The plan gate prints `30` for
`grep -c 'scenes/maps/' measure/tracks/asset_scenes_civic_20260928/scenes/inventory.md`, and the
four bathhouse source, note, and shot paths exist. The TSV is unchanged:
`git diff --exit-code -- docs/fantasy-world-scene-blueprints.tsv`.
Closeout gate: rerun the checker and the plan gate on the committed tree. The diff lists only Phase 1
owned paths.

### Phase 2: Independent review

Targeted Red command: `bash measure/runs/asset_scenes_civic_20260928/check-review.sh`.
Today it exits non-zero because no `vision-review-*.json` file exists.

- P2-a: four batch JSON files and four batch logs exist. A batch holds about 8 maps. The union holds
  30 unique slugs, one rating each. Falsifier: a duplicate slug, an omitted slug, or fewer than four
  batches.
- P2-b: each rating is parsed from a labeled field and lies in `[0, 10]`. Falsifier: a date or stray
  digit satisfies a bound, or a rating is matched by `[0-9]+` alone.
- P2-c: each batch records a judge family outside the claude family. No batch uses the maker family.
  Falsifier: a batch used Anthropic Sonnet or another claude family.
- P2-d: the inventory holds 30 `rated` rows, each with the copied rating and note. Falsifier: a row
  stays `inventoried` after Phase 2.

Green gate: the checker passes. The plan gate `ls measure/runs/asset_scenes_civic_20260928/vision-review-*.json`
lists four files, and each JSON gives one rating per map.
Closeout gate: rerun the checker and the plan gate on the committed tree. Each batch log cites its
route and model id.

### Phase 3: Rework

Targeted Red command: `bash measure/runs/asset_scenes_civic_20260928/check-rework.sh`.
Today it exits non-zero because no rework record exists.

- P3-a: the set of maps rated below 7.0 or holding a critical error equals the set of reworked maps.
  Each has one rework record. Falsifier: a below-bar map has no rework, or a map has two reworks.
- P3-b: each reworked map has a fresh `<slug>-3q.png` and `<slug>-top.png`. Each shot has an mtime
  newer than the rework and a recorded SHA-256. The 3q camera elevation lies in `[45, 50]`.
  Falsifier: a reused old shot or a 3q camera outside the band.
- P3-c: each reworked map has exactly one rerate by a judge family different from the maker family.
  Falsifier: two rerate entries, a maker-family judge, or no rerate.
- P3-d: no map has a fourth rating. At most three ratings exist per slug. Falsifier: a fourth rating
  entry for any slug.
- P3-e: a rerate of at least 7.0 sets `accepted`. A rerate below 7.0 sets `follow-up`. No row holds
  `accepted` with a rating below 7.0. Falsifier: a 6.9 rating labelled `accepted`.

Green gate: the checker passes. The plan gate lists fresh shots for every reworked slug. For
bathhouse: `ls -l docs/map-mockups/bathhouse-3q.png docs/map-mockups/bathhouse-top.png`.
Closeout gate: rerun the checker on the committed tree. No source is duplicated. A generator rework
leaves the design note written by `scripts/design-<slug>.mjs`, and the record cites the note SHA-256.

### Phase 4: Records

Targeted Red command: `bash measure/runs/asset_scenes_civic_20260928/check-records.sh`.
Today it exits non-zero because the 30 civic P2 rows still read `mockup-needed`.

- P4-a: the 30 civic P2 rows hold `accepted` or `follow-up`. No such row reads `mockup-needed`.
  Falsifier: a stale status remains.
- P4-b: the TSV diff changes only the status column. Every `scene_id` is unchanged. Falsifier: any
  ID edit.
- P4-c: each `accepted` row has a judge rating of at least 7.0. Each `follow-up` row has a rating
  below 7.0, a critical error, or a `missing` source. Cross-check the inventory. Falsifier: an
  accepted row with no rating.
- P4-d: each TSV status change cites its commit in `plan.md`. Falsifier: a status change with no
  commit id.
- P4-e: `docs/map-review.html` is unchanged. Falsifier: a diff on that file without a PM decision
  naming it as the record.
- P4-f: `./measure/doctor.sh` exits 0.

Green gate: the checker passes and the doctor exits 0.
Closeout gate: rerun the checker and the doctor on the committed tree. Record the final SHA.

## 6. Gate commands

Red and Green checkers are light. Run them directly:
`bash measure/runs/asset_scenes_civic_20260928/check-<phase>.sh`.

Plan gates, light:

```bash
grep -c 'scenes/maps/' measure/tracks/asset_scenes_civic_20260928/scenes/inventory.md
ls scenes/maps/bathhouse.ts docs/map-mockups/bathhouse.md docs/map-mockups/bathhouse-3q.png docs/map-mockups/bathhouse-top.png
ls measure/runs/asset_scenes_civic_20260928/vision-review-*.json
ls -l docs/map-mockups/bathhouse-3q.png docs/map-mockups/bathhouse-top.png
git diff --exit-code -- docs/fantasy-world-scene-blueprints.tsv docs/map-review.html
./measure/doctor.sh
```

The vite server starts as a background process. Record its PID and stop it after the shots.
Every shot call runs through the heavy gate. Exit 75 means wait and retry the whole call:

```bash
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'FORGE_SHOT_BASE=http://127.0.0.1:5199/hamlet.html node scripts/shoot-map.mjs docs/map-mockups "bathhouse-3q=scene=bathhouse&clean&az=35&el=47&dist=16&tx=0&tz=0" "bathhouse-top=scene=bathhouse&clean&az=0&el=86&dist=14&tx=0&tz=0"'
```

Set `dist` from the room size of each map. Keep the 3q camera at 45 to 50 degrees.
If a checker uses vitest or tsc, wrap that call through `heavy-run.sh` with `--maxWorkers=1`.
This track adds no product code, so vitest and tsc are not phase gates.

## 7. Architecture guardrails and changed-contract risks

- Keep every source path, note path, shot path, and catalog ID stable. Do not add a second map source
  for an existing slug.
- `src/scene/main.ts` loads `scenes/maps/*.ts` through `import.meta.glob`. A rework edits the same
  module. P3-a and P4-b guard against a duplicate module or a renamed ID.
- `scripts/design-<slug>.mjs` writes the source and the design note together. After a generator
  rework, rate against the note that the generator wrote. P3-b records the note SHA-256.
- The TSV status values `accepted` and `follow-up` break no validator. The doctor checks `scene_id`
  coverage in `measure/scope-map.tsv`. IDs stay unchanged, so coverage holds.
- `docs/map-review.html` is a view. P4-e keeps it out of the record unless the PM names it.
- Changed-contract risk: a new status value or a reworked note changes what downstream readers see.
  P2-d, P3-e, P4-b, and P4-c tie each record to a rated source.

## 8. Intentionally-red aggregate-suite handling

- This track changes no product source. Aggregate vitest and tsc results are baseline debt. They are
  not phase gates.
- A targeted Red checker is red before its artifacts exist. That is the expected Red state. Record
  it. Do not edit product source to turn it green.
- If an aggregate suite is red from known baseline failures, keep it red. List those failures in the
  phase acceptance handoff. Do not claim a pass and do not stop a phase on that suite.
- The phase gate is the targeted checker plus the plan Gate block. The doctor is the Phase 4 gate.

## 9. Artifact tests versus live behavior tests

- Artifact tests: inventory rows, batch JSON and logs, shot file presence, TSV status, commit
  citations, and git diffs. They prove that records exist and agree. They do not prove visual quality.
- Live behavior proof: the independent judge reads the actual shot PNGs against the design note.
  Rework shots are rendered from the scene source by `scripts/shoot-map.mjs`. A look at each shot in a
  browser or image viewer is a manual check.
- A checker that passes without a judge rating and a human look at the images does not close Phase 2
  or Phase 3.

## 10. Review gate applicability

| Gate | Applies | Scope and reason |
| --- | --- | --- |
| Review A (spec and plan) | Yes | `spec.md`, `plan.md`, the inventory and batch schemas, the stop-rule reading, F8, and the owned diff. |
| Review B (security) | No | No product code, no repository network call, no secret, no login, and no write outside owned paths. Applies only if a rework adds a script that reads environment secrets or writes outside owned paths. |
| Review C (UX and API; record contract) | Yes, record contract only | The TSV status vocabulary, the inventory state vocabulary, the batch JSON schema, and the run artifact names. No product UX change. Visual quality belongs to the judge and browser review. |
| Adversarial testing | Yes | The falsifiers in sections 3, 5, and 11, plus family mismatch, duplicate rating, ID mutation, and a self-rating counted as independent. |
| UX browser review | Yes, visual only | Look at the 30 three-quarter and top shots and at every fresh rework shot. No input or flow change. `docs/map-review.html` is a view, not a record. |

## 11. Anti-pattern coverage by phase

`measure/anti-patterns.md` does not exist. This section uses the canonical catalog
`~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md`. A1 and A8 are retired.
A2 (consent-blind publish gate) does not apply: no consent artifact or publish transition exists in
this track. The independent-judge gate is the explicit rating gate.

### Phase 1 defense

| Id | Defense | Falsifier |
| --- | --- | --- |
| A3 digit-only count | P1-a parses a labeled row count of 30 from the inventory and the TSV. | A date or stray digit satisfies the count. |
| A4 vacuous pass | P1-a requires exactly 30 rows and at least one. | An empty inventory passes. |
| A5 false claim | The plan quotes the `grep -c` result and the labeled row count. | A claim disagrees with the quoted output. |
| A7 over-broad filter | The slug set comes from all 30 civic P2 TSV rows. No filtered subset is used. | A slug is skipped by a filter. |
| A9 archived paths | Checkers name the live track directory, not an archive directory. | A checker names `measure/archive/asset_scenes_civic_20260928`. |
| A11 doc drift | Inventory paths and slugs agree with the TSV and the spec Paths table. | A document names a path the inventory lacks. |

### Phase 2 defense

| Id | Defense | Falsifier |
| --- | --- | --- |
| A3 digit-only count | P2-b parses the labeled `rating` field and checks `[0, 10]`. | A date or stray digit passes as a score. |
| A4 vacuous pass | P2-a requires four non-empty batches and 30 unique ratings. | Empty batches or zero ratings pass. |
| A5 false claim | The plan quotes the labeled batch count and the rating count. | A claim disagrees with the batch files. |
| A6 registry overstatement | The civic registry entry stays `[~]`. No `rated` claim precedes P2-d. | The registry claims completion before the checker passes. |
| A7 over-broad filter | P2-a compares the batch slug set with the full TSV slug set. | A batch filter drops a map. |
| A11 doc drift | The judge family rule in `spec.md` and each batch field name the same rule. | A batch names a family that the doc excludes. |

### Phase 3 defense

| Id | Defense | Falsifier |
| --- | --- | --- |
| A3 digit-only count | P3-a and P3-e parse labeled rerate values and compare them with 7.0. | A stray digit satisfies the bar. |
| A4 vacuous pass | P3-a requires the below-bar set to match the rework set. A vacuous "no rework needed" result fails when a below-bar map exists. | An empty rework list passes while a map is below the bar. |
| A5 false claim | The plan quotes the shot paths, SHA-256 values, and rerate counts. | A claim disagrees with the files. |
| A6 registry overstatement | No `accepted` claim appears before P3-e and the TSV update. | A completion claim precedes the rating. |
| A7 over-broad filter | P3-b loops over the full rework set derived from ratings. | A filter drops a reworked map from the shot check. |
| A11 doc drift | The checker reads the plan cap of one rework and one rerate. F8 is a spec-wording item in section 13. | The checker allows a fourth rating while the plan caps at one rerate. |

### Phase 4 defense

| Id | Defense | Falsifier |
| --- | --- | --- |
| A3 digit-only count | P4-a parses 30 labeled status values and counts `accepted` and `follow-up`. | A stray digit satisfies the status count. |
| A4 vacuous pass | P4-a requires 30 status changes and at least one. | An unchanged TSV passes. |
| A5 false claim | P4-c cross-checks the TSV against the inventory and the plan record. | A plan claim disagrees with the TSV. |
| A6 registry overstatement | The registry reaches `[x]` only after P4-f and the closeout gate. | A registry claim precedes the doctor. |
| A7 over-broad filter | P4-a iterates the 30 civic P2 rows from the TSV, not a name list. | A status row is skipped. |
| A9 archived paths | Checkers name the live track directory. | A checker names an archive directory. |
| A10 generated-facts drift | This track runs no `generate.sh`. Track commits leave `measure/generated/*` untouched. P4-f runs the doctor. | A generated fact differs from the plan after closeout. |
| A11 doc drift | Spec, plan, inventory, batch JSON, and TSV name the same slugs, bar, and stop-rule reading. F8 stays an open wording item. | A document names a value that another record lacks. |

## 12. Phase base capture point

The orchestrator captures the immutable `phase_base_sha` at one point: immediately after the commit
that adds this strategy file, the round 2 run files, and the strategy result log, and before Red
writes the first checker. The value is the output of `git rev-parse HEAD` on that commit. This file
writes no SHA. A SHA that predates that commit is not the phase base. If the strategy is refreshed
before a later phase, capture a new `phase_base_sha` after the refresh commit.

## 13. Orchestrator handoff items

- F8: a spec-wording item only. The gates read the plan as one rework and one rerate. The
  orchestrator decides whether to fix the wording in `spec.md`. This role does not edit `spec.md`.
- Pick the judge with `ra-quota pick vision-review` and exclude the claude family while the maker
  family is Anthropic Sonnet. Use four batches of about eight maps.
- Stage only the four paths named in the strategy commit. Foreign dirty work is present in the tree.
- Do not run `./measure/generate.sh`. Another session owns `measure/generated/*`.
