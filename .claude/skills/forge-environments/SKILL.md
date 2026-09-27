---
name: forge-environments
description: Build a complete environment for the chibi game world with Fantasy Asset Forge — forest, tavern, blacksmith-shop, village, dungeon, hamlet, or any future biome or place. Use this skill for ANY request to create, plan, or complete an environment, biome, scene kit, or sample map (for example "build the forest environment", "do the tavern next", "complete all P0 environments", "make a sample map for the swamp"), even when the user does not name this skill. It encodes the mandatory five-step pipeline: catalog-derived asset list first, mockup second, evaluation third, subagent asset batch fourth, sample map fifth. Never derive an asset list from a mockup.
---

# Building an environment with Fantasy Asset Forge

An environment ships as: a catalog-derived component list, a style-anchor mockup, a set of
subagent-built assets reviewed and grafted into `assets/`, and an assembled sample map scene.
The chibi-set roster is six environments: hamlet (the quality standard), dungeon, forest,
tavern, blacksmith-shop, village.

**The pipeline order is mandatory.** Deriving the asset list from a mockup image is the
known failure mode: the mockup omits catalog assets and the kit ships incomplete.

## Step 1: the list (always first)

1. Read the scene blueprint in `docs/fantasy-world-scene-blueprints.tsv` for the environment.
2. Query `docs/fantasy-world-asset-catalog.tsv` for every row in the environment's biome:
   filter `family`/`group` columns (for example a forest takes `nature/*` temperate rows plus
   its `architecture/landscape-parts` ground and path tiles; a blacksmith-shop takes
   `props/craft-and-trade/*` plus containers). Exclude rows for other biomes (cactus, snowbank).
3. Mark which rows already exist in `assets/` (reuse) and which are new (build).
4. Ask the user for state variants the scene needs (example: campfire lit and burned out).
   Add each variant as its own asset row.
5. Write `docs/<env>-mockups/components.tsv` with columns `asset_id`, `instances`, `placement`.

## Step 2: the mockup (from the list, never before it)

1. Write the image prompt so every new asset on the list appears in the scene.
2. Generate with `mmx image generate --aspect-ratio 4:3 --out-dir docs/<env>-mockups
   --out-prefix <env>-quest --prompt "..."`. Retry on network error code 6.
3. Style anchors for the prompt: chunky rounded forms, soft bevels, orthographic
   three-quarter game map, the environment's palette contract.

## Step 3: evaluate the mockup

1. View the image. Check every list asset is visible or deliberately off-frame.
2. Check the palette and forms match the environment's treatment of Chibi Quest.
3. Regenerate with a corrected prompt if either check fails. Do not start step 4 on a
   mockup that misses list assets.

## Step 4: the asset batch (subagents build, reviewers verify)

1. Scaffold `bench/trials/<env>-env/`: `queue.tsv` (asset, model, prompt path), one
   `prompts/<asset>.prompt.md` per asset, `mockups/` (the evaluated anchor plus
   `docs/hamlet-mockups/chibi-quest.png` for cross-environment consistency).
2. Assign models from `bench/trials/chibi-env/ranking.json`: deepseek-flash for hero and
   emissive-focal assets, glm-5.3-flash for grounded props, mimo-v2.6-flash and
   muse-spark-1.3-contributor for dressing. MiniMax-M3 refuses to serve; never assign it.
3. Run `bench/trials/<env>-env/scheduler.sh bench/runs/<env>-env-r1 6` detached.
4. When the queue drains, review every render yourself. Then run the kimi dual review:
   two subagents, `volcengine-agent-plan/kimi-k2.8-preview` and
   `coding-plan/kimi-k2.8-preview`, split by asset count, verdicts to
   `reviews-kimi-a.json` / `reviews-kimi-b.json`.
5. Fold verdicts into `bench/trials/<env>-env/reviews.json` (primary + kimi + agreement).
   A 2-point-or-larger disagreement is a flag: re-examine, fix, or re-roll before grafting.
6. Fix flagged assets yourself when the fix is bounded (palette, density, one body).
7. Graft: copy each `assets/<name>.ts` into the repo and run `./forge all <name>`.
   Accept only exit 0 and zero `warning:` lines. Trial `reference:` fields must point at
   `docs/<env>-mockups/...` paths, not trial-workspace paths.
8. Regenerate `bench/runs/<env>-env-r1/viewer.html` with
   `bench/trials/<env>-env/make-viewer.mjs` so the user has the dashboard.

## Step 5: the sample map (after the assets, not before)

1. Design the map as data: `scripts/design-<map>.mjs` is the single source of truth and
   emits `scenes/<name>.ts` plus `docs/<env>-mockups/map.md`. Never edit the generated
   scene by hand.
2. Wire `?scene=<name>` in `src/scene/main.ts`.
3. Shoot review renders with a playwright script (GPU flags:
   `--use-angle=gl --enable-gpu --ignore-gpu-blocklist --enable-unsafe-swiftshader`,
   screenshots to `/tmp/opencode`).
4. Review the renders against the mockup: silhouette zones first, then portals and paths,
   then prop dressing. Fix the largest difference first and re-shoot.
5. Update `docs/<env>-mockups/components.tsv` counts to the exact map allocation.

## Standards

- The hamlet is the quality bar: every asset grafted, zero build warnings, the sample map
  rendered and reviewed, the map doc written.
- `./forge check <name>` applies to rigged characters, not environment kits.
- `pnpm typecheck` is not authoritative; use `node_modules/.bin/tsc --noEmit`. New asset
  files must be tsc-clean (the pre-existing `assets/dirt-road-t-junction.ts` errors are
  not ours; leave that file alone).
