# Specification: Trial Hy4 Flash as the maker of simple 3D asset files

## Overview

Daniel ordered a small trial of OpenCode Hy4 Flash (`opencode/hy4-flash-free`) as the maker of 3D asset
files. Daniel said the model "is excellent at simple 3D models and such". The model is free for about
two weeks, until about 2026-11-30. It has 1M context and it reads images.

The trial uses 3 simple props. Each prop is made twice from one brief: once by the Hy4 arm and once by
the current maker arm. One blind judge with vision rates every result. When Hy4 wins or ties on 2 of 3
assets, Hy4 becomes the first maker route for simple assets until the free window ends. The current
route then becomes the fallback. Hero assets stay on the current route.

The track follows the PM light lane of 2026-11-03. It runs one maker role per arm per try round, one
checker after the phase, and then closeout. The metered spend is 0 USD.

## Owner order

Daniel, 2026-11-16 16:32 ICT, through the PM:

> OpenCode Hy4 Flash (opencode/hy4-flash-free, free for about 2 weeks, 1M context, multimodal)
> "Apparently it's excellent at simple 3D models and such". Order: a small trial of Hy4 Flash as the
> maker of 3D asset files (the TypeScript in assets/). One role at a time; Storytime picture work keeps
> its place (a Storytime order goes first; the trial waits between roles).

The order has 4 steps:

1. Pick 3 simple assets from the queue (props, not hero characters).
2. Make each one with Hy4 Flash and with the current maker route, from the same brief.
3. Judge them with the usual judge and checks (build, GLB, renders), blind to the route.
4. Log route, asset, pass/fail, tries and the reason in the plan.

When Hy4 wins or ties on 2 of 3, it becomes the first maker route for simple assets until the free
window ends (about 2026-11-30). The current route is then the fallback. Hero assets stay on the current
route.

## Context (read only)

- **The queue.** The Chibi Quest catalog holds 856 targets. Every catalog row except the 32 fx-geometry
  effects has a source in `assets/`. The effects wait for 4 owner questions in
  `asset_p3_fx_geometry_20260928`. The Riven Lands props wait for the Riven pack layout. No open
  simple prop row exists.
- **The towel follow-up.** The track `asset_filled_shelves_20261028` fills every shelf. Its plan line
  51 reads "Bathhouse | Keep `shelf`; put jars and baskets on the boards. No towel asset exists." Its
  plan line 78 reads "Bathhouse: jars and baskets. A towel asset is a follow-up and stays out of
  scope." The bathhouse shelf boards sit at y 0.45, 0.78, and 1.09. The shelf footprint is 1.3 m wide
  and 0.3 m deep.
- **The maker roles.** The role table of the repo routes asset work to `measure-jr-green`. The current
  route for its model is `minimax-cn-coding-plan/MiniMax-M3.1-Flash` (ra-quota pick, 2026-11-16). The
  role-table route `volcengine-agent-plan/glm-5.3-flash#high` is marked until 2026-11-22. The old
  `forge-sonnet` route sits on a Claude weekly hold at 92 percent.
- **The judge.** Kimi reviewed the environment kits (`bench/trials/*/reviews-kimi-*.json`). It has
  vision and it is a family other than Hy, MiniMax, and DeepSeek. The model is
  `kimi-code-plan-cn/kimi-for-coding#high`.
- **The reviewer brief.** `measure/tracks/asset_review_audit_20261005/reviewer-brief.md` holds the
  11-criterion form for characters. It gives the anchors and the caps.
- **The review card tool.** `scripts/review-cards.py` writes one PNG per asset. Row 1 holds the mockup
  panel and the 4 turnaround views. Row 2 holds the 128 px sprite preview and one motion strip when a
  strip exists. A static prop has no strip, and the tool accepts that.
- **The image tool.** The `create-image-mmx` skill runs the `mmx` CLI on the MiniMax Token Plan. The
  plan is a fixed-quota subscription. It is not a metered charge.

## Decisions

The PM order sets the trial rule. The author set default D1 to D10. The PM can change each default.

### D1 Assets

The queue holds no open simple prop row. The default assets are 3 new bathhouse props. They come from
the open towel follow-up of `asset_filled_shelves_20261028`:

| Asset | Role |
| --- | --- |
| `towel-stack` | A stack of folded towels for a bathhouse shelf board |
| `wash-basin` | A wooden wash basin for a bathhouse bench or the floor |
| `towel-rack` | A small wooden stand with towels hung on it |

- The 3 assets are not catalog rows. They add no catalog ID and no scene placement. Map placement stays
  out of scope. It is a follow-up of `asset_filled_shelves_20261028`.
- The bar is 7.0. These are ordinary props, not characters. The priority bar for P0 and for characters
  is 7.5.
- The rating is G. No asset shows a body, a weapon, or a violent act.

### D2 Same brief

Each asset has one brief at `measure/tracks/asset_hy4_maker_trial_20261116/briefs/<name>.md`. The brief
holds the role, the real size in meters, the parts, the colors, the materials, the standing rule (on
y = 0, facing +Z), and the checks.

Each asset has one mockup at `docs/bathhouse-mockups/<name>-mock.jpg`. The mockup comes from the `mmx`
CLI in the chibi picture-book style of the other Forge mockups. The asset names the path in its
`reference` field.

- Both arms get the same brief file and the same mockup file, byte for byte. The maker log records the
  SHA-256 of both files.
- An `mmx` call that fails twice for one asset gives that asset a text-only brief. The plan records the
  failure and the asset source leaves `reference` out.
- The `mmx` calls use the MiniMax Token Plan quota. They add no metered charge. The maker log records
  the quota percentage before and after each call.

### D3 Arms and blind labels

Each asset has 2 trial sources: `assets/<name>-a.ts` and `assets/<name>-b.ts`. The `name` field of a
source equals the file name.

- The author assigns the Hy4 arm to label `a` or label `b` for each asset at random. The tool is
  `python3 -c` with `random` and the seed 20261116. The assignment goes to
  `measure/runs/asset_hy4_maker_trial_20261116/arm-key.json`.
- The assignment for this run is: `towel-stack` a, `wash-basin` a, `towel-rack` b.
- The judge never reads `arm-key.json`, the plan, the maker log, or the git history. The judge sees the
  file names only.

### D4 Makers

| Arm | Role and model |
| --- | --- |
| Hy4 | `measure-jr-green` on `opencode/hy4-flash-free#high` |
| Current | `measure-jr-green` on `minimax-cn-coding-plan/MiniMax-M3.1-Flash` |

- One maker role runs for one arm per try round. That role covers every open asset of the arm. Roles run
  one at a time.
- A maker reads the skill, the brief, and the mockup. A maker never opens a file of the other label.
- Inside one try, the maker iterates with `./forge render <name> --fast` and looks at the render. The
  maker then runs `./forge all <name>` once, the mechanical check of D6, and `scripts/review-cards.py`
  for its card at `out/hy4-trial/cards/r<N>/`. The maker commits only its own paths.

### D5 Tries

A try is one maker pass. It ends in `forge all <name>`, one passing or failing card, and a judge rating.

- Each arm gets at most 3 tries per asset.
- Try 2 and try 3 get only the judge findings for that arm and that asset.

### D6 Pass

An arm passes an asset when the judge rating is 7.0 or more with no critical model error, and the
mechanical check passes.

The mechanical check is one shared script: `measure/runs/asset_hy4_maker_trial_20261116/mech-check.mjs`.
Its input is the asset name. It prints one JSON line and exits 0 or 1. It proves:

- `./forge all <name>` exits 0 and prints no `warning:` line.
- `out/<name>/<name>.glb` exists and holds more than 0 bytes.
- `out/<name>/stats.json` names more than 0 triangles.
- `out/<name>/render.png` exists.
- `out/<name>/sprites/preview.png` exists.
- `node scripts/typecheck-asset.mjs <name>` exits 0.
- The model bottom is within 5 mm of y = 0, from the `bounds.min[1]` value of `stats.json`.

Both arms use this one script. The author tests it once on the existing prop `bucket` and records the
output in `measure/runs/asset_hy4_maker_trial_20261116/mech-check-test.txt`.

### D7 Judge

One judge session runs per try round on `kimi-code-plan-cn/kimi-for-coding#high`. Kimi has vision. Its
family is not Hy, MiniMax, or DeepSeek.

- The judge brief is `measure/runs/asset_hy4_maker_trial_20261116/judge-brief.md`. It adapts
  `reviewer-brief.md` for static props. It has no face criterion and no motion criterion. The bar is
  7.0. It lists the critical errors: a floating part, a buried part, poke-through, a wrong scale, a
  model not on y = 0, and a wrong object.
- The judge rates every open card in a random order. It writes
  `measure/runs/asset_hy4_maker_trial_20261116/judge-r<N>.json`. The file is provisional first and
  final second.
- The judge gives each failing card numbered findings. A finding names what to change.
- A judge result is model evidence. It is not owner acceptance.

### D8 Win rule per asset

1. A pass beats a fail.
2. When both arms pass, fewer tries wins.
3. With the same tries, a rating higher by 0.5 or more wins.
4. Otherwise the asset is a tie. Two fails are also a tie, and the plan says so.

Hy4 takes the first maker route for simple assets when it wins or ties on 2 of 3 assets.

### D9 Close

For each asset, the author promotes the better passing arm to `assets/<name>.ts`. The `name` field
becomes `<name>`. The author runs `forge all <name>` and deletes both trial sources and their
`out/<name>-a` and `out/<name>-b` folders.

- On a tie, the higher rating wins first, and arm `a` wins second.
- An asset with no passing arm gets no promotion.
- The plan then holds the results table: route, asset, pass or fail, tries, rating per try, and the
  reason. The plan also holds the route result.
- One lesson goes to `measure/lessons-learned.md`.

### D10 Load

Every `forge`, `tsc`, `vitest`, or Chrome command runs as one heavy job:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'
```

- Exit 75 means a lock wait. The runner waits and retries.
- A browser install, a render, and a capture also run only through `heavy-run.sh` (PM load rule,
  2026-11-16). The Playwright build 1234 sits in `~/.cache/ms-playwright` and no arm starts a new
  `playwright install`.
- The machine has 7.1 GiB. One heavy job runs at a time.

## Functional Requirements

- **FR-1 Track files.** The track holds `spec.md`, `plan.md`, and `metadata.json` with `"lane": "light"`.
  The track folder holds 3 briefs. `measure/runs/asset_hy4_maker_trial_20261116/` holds `arm-key.json`,
  `judge-brief.md`, `mech-check.mjs`, `mech-check-test.txt`, and the judge files. The registry
  `measure/tracks.md` holds one entry for the track.
- **FR-2 Mockups.** Each asset has one mockup at `docs/bathhouse-mockups/<name>-mock.jpg`. The file is a
  JPG image of one prop. The maker log records each prompt and the quota use. A failed `mmx` run twice
  for one asset gives a text-only brief, and the plan records it.
- **FR-3 Same brief.** For each asset, the 2 trial sources name one `reference` path. The brief and the
  mockup have one SHA-256 each, and the maker log records both.
- **FR-4 Arm key.** `arm-key.json` holds the seed 20261116, the command, the asset order, and the label
  for the Hy4 arm. The judge files hold no label-to-route map.
- **FR-5 Trial sources.** Each asset has `assets/<name>-a.ts` and `assets/<name>-b.ts`. The `name`
  field of each source equals its file name. A source of one label holds no text from the other label.
- **FR-6 Mechanical check.** `mech-check.mjs` meets D6. Its test on `bucket` gives `"ok": true` and
  exit 0. A trial card exists at `out/hy4-trial/cards/r<N>/<name>-<label>.png`.
- **FR-7 Judge.** Each try round has one judge JSON file with one entry per open card. Each entry holds
  the label, the asset, the rating out of 10, the pass or fail, and numbered findings when it fails. No
  entry holds a route name.
- **FR-8 Result.** The plan holds the results table of D9 and the route result. The route result names
  the first maker route for simple assets after the trial, or the reason that the current route keeps
  first place. `measure/lessons-learned.md` holds one new lesson.
- **FR-9 Promotion.** A promoted source is `assets/<name>.ts` with the `name` field `<name>`. Its
  `forge all` run exits 0 with no `warning:` line. The trial sources and the `out/<name>-a` and
  `out/<name>-b` folders are gone.

## Non-Functional Requirements

- All prose follows ASD-STE100.
- The metered spend is 0 USD. No metered model and no paid API call runs.
- One role runs at a time. Roles run in the order of the plan.
- Every heavy command goes through `heavy-run.sh` (D10).
- Other agents share the git index. Each commit holds explicit paths only.
- No PNG or JPG enters git, except the 3 mockups under `docs/bathhouse-mockups/` and the track does not
  commit them twice.
- The author stages `measure/tracks.md` through a blob, because the file holds a foreign hunk. The
  author does not run `./measure/generate.sh`, because `measure/generated/` holds foreign changes.
- Scratch goes only under `/tmp/opencode/hy4trial/`.

## Owned paths

- `measure/tracks/asset_hy4_maker_trial_20261116/`
- `measure/runs/asset_hy4_maker_trial_20261116/`
- `docs/bathhouse-mockups/`
- `assets/towel-stack-a.ts`, `assets/towel-stack-b.ts`
- `assets/wash-basin-a.ts`, `assets/wash-basin-b.ts`
- `assets/towel-rack-a.ts`, `assets/towel-rack-b.ts`
- `assets/towel-stack.ts`, `assets/wash-basin.ts`, `assets/towel-rack.ts` (promotion only)
- `out/towel-stack-a/`, `out/towel-stack-b/`, and the same for the other 2 assets (not in git)
- `out/hy4-trial/` (not in git)
- `measure/tracks.md` (the registry entry and the closeout)
- `measure/lessons-learned.md` (one lesson)

## Frozen paths

No task changes these paths:

- every other file under `assets/`, and every catalog row of `docs/fantasy-world-asset-catalog.md`;
- `scenes/maps/**` and `scripts/design-bathhouse.mjs`;
- `src/**`, `scripts/review-cards.py`, and `scripts/typecheck-asset.mjs`;
- `measure/tracks/asset_review_audit_20261005/reviewer-brief.md`;
- `measure/generated/**`, and `measure/status.md`;
- every other track plan.

## Acceptance Criteria

1. FR-1 holds: the 3 track files, 3 briefs, 4 run files, and one registry entry exist.
2. FR-2 and FR-3 hold: the 3 mockups exist, and both arms name the same brief and the same mockup.
3. FR-4 holds: `arm-key.json` names the seed, the command, and the label of the Hy4 arm.
4. FR-5 holds: 6 trial sources exist, and each `name` field equals its file name.
5. FR-6 holds: the `bucket` test of `mech-check.mjs` gives `"ok": true` and exit 0, and every try has a
   card.
6. FR-7 holds: each judge file names the label, the rating, the pass or fail, and the findings.
7. FR-8 holds: the plan holds the results table and the route result, and the lesson exists.
8. FR-9 holds: every promoted asset builds clean, and the trial files are gone.
9. The checker greps the metered spend and finds 0 USD. No PNG or JPG is in git except the 3 mockups.
10. `./measure/doctor.sh` names no finding of this track, apart from the entries of the closeout.

## Human gate

Daniel ordered the trial. Daniel owns the result of the route decision. The author writes the route
result as a recommendation from the judge evidence. The PM reads the plan and the route result. A pass
or fail of a card is model evidence. It is not owner acceptance.

## Out of Scope

- Hero characters, creatures, and equipment.
- Map placement of the 3 props, and the catalog rows of the Chibi Quest pack.
- The 4 owner questions of `asset_p3_fx_geometry_20260928`.
- Any change to the maker roles, the model routes, or the judge models.
- Any metered spend, any image tool other than `mmx`, and any paid API call.
- Any change to `src/`, the asset tool, or the review card tool.

## Risks

| Risk | Control |
| --- | --- |
| Hy4 cannot edit a TypeScript file or cannot run `forge`. | Try 1 records the failure. At most 3 tries run. A fail card stays a fail. |
| The judge reads the plan or the arm key and learns the routes. | D3 and FR-7. The judge gets a card folder and the brief only. |
| The two arms get different briefs. | One file per asset. The maker log records the SHA-256 of the brief and the mockup. |
| A trial source overwrites a catalog source. | Each trial source has a `-a` or `-b` suffix. Promotion is the only write to `assets/<name>.ts`. |
| The free window closes before the trial ends. | The trial takes one day. The window ends about 2026-11-30. |
| A heavy job runs beside another heavy job. | D10. One heavy job at a time. |
| A foreign hunk of `measure/tracks.md` enters a commit. | The author stages the entry through a blob and checks the staged diff. |
| The mockup makes the props look unlike the catalog style. | The prompt uses the chibi picture-book style of `docs/item-mockups/`. |

## Open questions answered by default

1. **Which assets?** The 3 bathhouse props of D1. No catalog row is open. The author records this as a
   default.
2. **How many tries per arm?** At most 3. A pass on try 1 stops the arm for that asset (D5).
3. **Which label gets Hy4?** The random draw of D3 with the seed 20261116.
4. **What does the judge see?** The cards of one try round, the briefs, and the mockups. Not the plan,
   the arm key, the maker log, or the git history (D3, D7).
5. **What happens on two fails?** The asset is a tie and gets no promotion (D8, D9).
6. **Which arm wins a tie on rating?** The higher rating, then arm `a` (D9).
7. **Does the trial change the role table?** No. The 3 maker roles stay as they are. The route result
   records the recommendation for simple assets only.
8. **What is the price of the mockups?** 0 USD metered. The `mmx` calls use the MiniMax Token Plan
   quota, which is a subscription (D2).
