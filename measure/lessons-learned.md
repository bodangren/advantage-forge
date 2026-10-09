# Lessons learned

Keep this working memory within 50 lines. Evidence links retain the detailed history.

## Architecture and design

- One TypeScript source supplies models, clips, and sprites. Separate output presence from acceptance.
- One game core serves both renderers. A local game and a monorepo port require separate completion records. Forge holds the game and kit source: edit Forge, then copy with `port-game.mjs`. The next port deletes an edit made only in the monorepo copy. The server contracts and the app host stay with the monorepo.
- Stable catalog IDs define scope. Repeated filenames across families can make coverage ambiguous.
- Game-layer visibility, doors, and water behavior belong in game plans, not geometry assumptions.

## Recurring failures

- Shared staged files entered unrelated commits during overnight work. Commit explicitly selected paths.
- Some trial tools wrote outside their trial directory. Validate isolation before launching a batch.
- A successful build once produced an empty mesh, and trial sources introduced type errors and unsupported paint options. Validate mesh content, types, and visual output before acceptance.
- Provider quotas and access failures interrupted batches. Record retry conditions without assuming a historical reset remains valid.
- Concurrent dependency replacement interrupted builds. Coordinate dependency maintenance across sessions.
- A flat `k.add` plane over a tile top baked dark blocks in textured builds. Review the textured render, not only `--fast`.
- Glossy water (roughness below 0.5) turned white in some sprite directions. Use roughness 0.55 for water that the sprite camera sees.
- An agent ran `git stash` on the shared tree. Every brief forbids stash, reset, restore, and checkout outside the agent's own file.
- The browser QC at 1280 × 720 passed all 28 games, but the phone QC (390 × 844 and 844 × 390, touch) found covered labels, gate words off screen, and unreadable tiles. Run `qc/run.mjs --phone` and `--phone-landscape` before a game layout counts as checked.
- The answer audio controller notifies its listeners inside its own calls. A gate view that played a clip from a listener started nested plays, and each play cancelled the one before it. Unit tests passed, but the browser QC run gave more than 200 attempts per question, and the mount dropped the result. Deliver controller changes to a view in a microtask, and test a listener that plays.
- The forge tint mask is an image that no material uses. In the avatar pack, lossless WebP (no `exact`), a full `prune()`, and a lookup in `textures` each lost it. Keep it PNG, prune only nodes and meshes, read it from `images`, and check the packed GLB.

## Effective practices

- Build a shared material reference before producing a kit.
- Derive dimensions from measured character bounds before writing prompts, and derive map pieces from cell edges to prevent wall and corner count errors.
- Use fast renders for shape iteration and textured output for final review: run `forge all` last, because a later `--fast` build replaces the final GLB and views (`scripts/review-cards.py` warns). Use bump detail for fine texture when displacement adds unnecessary triangles.
- Keep heavy builds within the measured machine capacity.
- Prove a shape-code move with mesh identity per body (`scripts/part-check.mjs`), not a pixel score. Exact pose expressions keep meshes identical; rounded mounts and body splits re-mesh. A kind factory (17 kinds made 80 P2 monsters) takes only default-safe options; `scripts/mesh-same.mjs` proves the older assets identical. For an edit of a kind file, pass `--part assets/parts/<kind>.ts`: without it, both builds import the working kind and the check is empty (found 2026-10-05). Chibi arms are short: solve a held item's pose with `motion.follow`, and choose actions the arms can reach.
- Change the proportions of a kind with a space warp (`assets/parts/head-swell.ts`), not with new shapes: a warped context grows a head or shortens legs and a body, and paint and bone tags follow. Map the clips' ground probes and joints with the same point map (`headSwellPoint`, `stretchPoint`), or a lying or sitting pose sinks into the ground. A negative `displace` amplitude raises bumps; a positive one cuts them in. A reviewer can ask for opposite changes in two rounds (hawk eyes: larger and white, then smaller and dark): follow the mockup when a note disagrees with it.
- Simple props and mechanical edits pass on the Sonnet low tier for about 30K tokens each. Give every agent a triangle budget. For a character, six parallel Haiku 5.5 arms did not beat one `forge-sonnet-high` arm (best 6.3 against 6.5) and read 7 to 10 times more input tokens ([trial](../bench/haiku/results.md)). Compare models in the same agent setup, and fix a base defect that caps every arm before the trial.
- Build worn equipment from the avatar body it covers. Keep it solid there: skin in a closed bore counts as show-through. Check that the display stands on y = 0.

## Planning practices

- Start status discovery at the Measure index. Map existing plans and every catalog row to an owning track.
- Preserve historical delivery evidence without inventing past estimates, tests, or approvals.
- Update the plan, metadata, registry, debt, and lessons before closing a track.
- Keep generated facts separate from design intent and acceptance judgments.

## Evidence

- [Overnight production record](../bench/overnight/PLAN.md)
- [Dungeon fit and assembly review](../docs/dungeon-mockups/fit-check.md)
- [Forge art direction](../.agents/skills/forge-assets/SKILL.md)
- [Game program](../docs/apk-2d3d-program.md)
- [Verification baseline](./evidence/baseline-20260928.md)
