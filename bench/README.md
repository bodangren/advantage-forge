# Forge Bench

Which models make good 3D game assets with Fantasy Asset Forge?

Each run gives one model one brief (for example "a frost wolf enemy, rigged, with idle and run").
The model works in an isolated copy of this repo with the normal tools (build, render, inspect,
animate) and must deliver `assets/<brief>.ts`. The harness then builds the final textured asset,
renders it, checks it technically, and has a vision model judge it against the brief.

The design follows the Lending Desk bench: same agent (`pi`), same provider (OpenCode Go), same
isolation (rootless Podman, only the candidate is writable), same arms, same calibration canary.

## Arms

| Arm | Name      | What the model gets                                                    |
| --- | --------- | ---------------------------------------------------------------------- |
| `a` | No Skills | the repo (with `AGENTS.md` and the example assets) and the task prompt |
| `b` | Skills    | the same, plus the `forge-assets` skill (`--skill`)                    |

Both arms run with `--no-context-files`; the prompt tells the model to read `AGENTS.md`, so the
only difference between arms is the skill.

## Briefs

`briefs/*.json`: one per task, across all categories — `goblin-merchant` (character, rigged),
`frost-wolf` and `bounce-slime` (creatures, rigged), `oil-lantern` and `dwarven-axe` (items),
`mushroom-ring` (vegetation), `watchtower` (architecture), `alchemy-table` (prop). None of them
overlaps an example asset the model can see. Each brief sets a height range, a triangle budget,
and whether a rig and which clips are required.

`briefs/calibration/*.json` point at the repo's own example assets with a minimum expected total.

## Scoring

```
total = gate ? 0.3 * tech + 0.7 * visual - 10 (if the file contract was broken) : 0
```

- **Gate**: `assets/<id>.ts` exists and `./forge all <id>` builds. A failure is a valid zero.
- **Tech (0-100)**, from the build and `forge inspect`: no warnings (10), height in range (15),
  standing on the ground (10), triangles in budget (10), no hidden parts (10), no floating parts
  (10), rig present if required (10), required clips (15, partial credit), non-empty sprites (10).
- **Visual (0-100)**: a vision judge (Claude via the `claude` CLI by default) scores the
  textured turnaround, the 128 px sprites, and the animation strips from 1 to 5 on brief
  fidelity (weight 2), silhouette (1.5), proportion and appeal (1.5), shape language, value and
  color, materials, detail hierarchy, technical cleanliness, readability at 128 px, and motion
  (rigged briefs). Three independent samples; the median per criterion counts. The judge works
  in an empty temporary directory, so no repo context reaches it.
- **File contract**: the model may only create or change `assets/<id>.ts` and
  `assets/_<id>-*.ts`. Anything else is recorded, ignored (only the allowed files are grafted
  onto a clean tree for grading), and costs 10 points.

A missing judge result makes a record invalid (`total: null`), never a partial score.

## Vision

The Forge loop is "write code, look at the render". `pi` only sends images to models whose
config declares image input, so each model is marked in `config/models.json`:

```bash
bench/probe-vision.sh kimi-k3     # shows the model a generated shape; prints "vision: yes/no"
```

Set `"vision": true` only after a probe passes. Other models run blind: their prompt tells them
to use `./forge inspect`, which reports visibility per part, silhouette, values, colors, and
floating or buried parts as text. The leaderboard shows the vision column, because sighted and
blind runs are not the same task.

## Running

One-time setup:

```bash
podman build -t localhost/forge-bench-agent:1 -f bench/Containerfile bench
echo "BENCH_ENV_FILE=$HOME/Desktop/lending-desk-bench/.env.local" > bench/.env.local   # holds OPENCODE_API_KEY
```

Runs:

```bash
bench/calibrate.sh                                   # canary: reference assets must reach expect_min
bench/run.sh opencode-go kimi-k3 b frost-wolf        # one run
MODELS="kimi-k3 glm-5.3" BRIEFS="frost-wolf oil-lantern" bench/batch.sh
bench/batch.sh                                       # everything in config/models.json x briefs x arms a b
node_modules/.bin/tsx bench/report.ts                # bench/site/leaderboard.md and bench/site/index.html
```

Useful environment: `BENCH_MINUTES` (default 45), `THINKING` (default high), `REPS`,
`JUDGE_SAMPLES` (default 3), `JUDGE_MODEL`, `JUDGE=0` (skip judging), `CANARY=0`,
`BENCH_VISION=0|1` (override the config), `BENCH_PI_MODELS` (a pi models.json).

Every run writes `bench/runs/<id>/`: `prompt.md`, `candidate/` (the model's workspace),
`transcript.jsonl`, `usage.json` (turns, tokens, renders, image reads), `grade/` (the clean
graft that was graded), `artifacts/` (build log, renders, sprites, animations, GLB),
`tech.json`, `judge.json`, `score.json`, `meta.json` (model, arm, vision, timings, harness and
skill digests).

## Cost

A run costs the model's tokens for up to `BENCH_MINUTES` of agent work plus three judge calls
with four or five images each. Keep an eye on the OpenCode Go limits ($12 per 5 hours, $30 per
week); a full batch (17 models x 8 briefs x 2 arms) is 272 runs and must be spread over weeks,
or trimmed with `MODELS` and `BRIEFS`.
