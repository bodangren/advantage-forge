# Dungeon round: kimi-k2.8 review pass (PENDING — execute when all 26 trials finish)

## Trigger

All 26 run dirs under `bench/runs/dungeon-env-r1/<asset>/<model-slug>/meta.json` contain
`exit_code`. Check with:

```bash
pending=0
for d in bench/runs/dungeon-env-r1/*/; do
  for m in "$d"*/meta.json; do
    grep -q '"exit_code"' "$m" 2>/dev/null || { echo "PENDING: $d"; pending=1; }
  done
done
[ "$pending" -eq 0 ] && echo "ALL DONE"
```

## Reviewers (verified active on 2026-09-26)

- Reviewer A: `volcengine-agent-plan/kimi-k2.8-preview` — structure + light (14 assets)
- Reviewer B: `coding-plan/kimi-k2.8-preview` — props + dressing (12 assets)

Note: the models tool returned garbled display ids for both slugs (provider doubled, e.g.
`coding-plan/coding-plan/kimi-k2.8-preview`). Both are [active]. Before the batch, run one
smoke review with each slug in plain `provider/model` form and abort to the user if either
refuses to serve (the MiniMax-M3 lesson).

## Split

Reviewer A (stone + emissive lens): floor, floor-cracked, wall, wall-corner, wall-alcove,
arch, door, gate, stairs, pillar, rubble, torch-sconce, brazier, candle-cluster.
Reviewer B (prop + dressing lens): chains, bone-pile, sarcophagus, cell-bars, hanging-cage,
altar, cauldron, mushroom-cluster, crystal-cluster, moss-tuft, gold-pile, walkway.

## Method

Per asset, one review-only session in the repo root (`opencode run --model <slug>`), prompt:
read `bench/runs/dungeon-env-r1/<asset>/*/ws/out/<asset>/render.png` (final textured build)
plus `views/top.png`, compare against the style anchor `docs/dungeon-mockups/dungeon-quest_002.jpg`
and the palette contract in `docs/dungeon-mockups/README.md`, then write a verdict JSON to
`bench/trials/dungeon-env/reviews-kimi-<a|b>.json`:

`{ "<asset>": { "score": 0-10, "status": "pass|fix|drop", "notes": "..." } }`

Review only — no asset edits. No triangle/graf checks (I do those at graft).

## Fold

After both verdict files exist: merge into `bench/trials/dungeon-env/reviews.json` keeping my
graft verdicts as `graftScore` and kimi's as `kimiScore`; flag assets where the two disagree
by 2+ points for re-review or re-roll before grafting.
