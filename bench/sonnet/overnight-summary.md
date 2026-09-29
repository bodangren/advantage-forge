# Overnight summary, 2026-09-29 (Sonnet 5.5 orchestration)

Bars: 7 ordinary, 7.5 P0 or game-pack rows, 8 characters. Every pass is in `bench/sonnet/log.tsv`; queue state in `bench/sonnet/state.tsv`; briefs in `bench/sonnet/briefs/`.

| Asset | Class | Tier(s) | Passes | Tokens | Score | Bar | Result |
|---|---|---|---|---|---|---|---|
| farmhouse | structure | medium | 3 | 55,739 | 7.5 | 7 | accepted |
| ivy | plant | low, medium | 3 | 80,592 | 7.5 | 7 | accepted |
| samurai | hero | high | 2 | 188,689 | 8.2 | 8 | accepted |
| mantle | armor | low, medium | 3 | 80,751 | 7.0 | 7 | accepted |
| cloth-robe | armor | low | 3 | 43,589 | 7.0 | 7 | accepted |
| yurt | structure | medium | 2 | 52,936 | 7.5 | 7 | accepted |
| greenhouse | structure | medium | 2 | 68,372 | 7.2 | 7 | accepted |
| cave-mouth | terrain | medium | 2 | 43,525 | 7.0 | 7 | accepted |
| pier | structure | medium | 1 | 46,021 | 7.0 | 7 | accepted |
| city-wall | structure | medium | 2 | 67,065 | 7.0 | 7 | accepted |
| rampart | structure | medium | 2 | 59,945 | 7.0 | 7 | accepted |
| greenhouse-dome | structure | medium | 1 | 38,863 | 7.3 | 7 | accepted |
| ancient-tree | plant | medium | 2 | 51,069 | 7.0 | 7 | accepted |
| roots | plant | medium | 4 | 68,164 | 7.0 | 7 | accepted |
| watermill | structure | medium | 2 | 63,626 | 7.3 | 7 | accepted |
| cliff-face | terrain | medium, high | 4 | 126,344 | 6.5 | 7 | skipped |
| townhouse | structure | medium | 1 | 49,637 | 7.3 | 7 | accepted |
| crypt-chapel | structure | medium | 1 | 48,362 | 7.3 | 7 | accepted |
| longhouse | structure | medium | 1 | 54,161 | 7.0 | 7 | accepted |
| scale-armor | armor | medium | 3 | 62,168 | 7.3 | 7 | accepted |
| studded-leather | armor | medium | 4 | 52,870 | 7.0 | 7 | accepted |
| vines | plant | medium | 1 | 43,535 | 7.2 | 7 | accepted |
| plate-armor | armor | medium | 2 | 67,780 | 7.5 | 7 | accepted |
| iron-helmet (fit) | armor-fit | medium | 1 | 32,941 | fit-ok | 7.5 | accepted |
| steel-helmet (fit) | armor-fit | medium | 1 | 35,654 | fit-ok | 7 | accepted |
| belt (fit) | armor-fit | medium | 1 | 36,200 | fit-ok | 7 | accepted |
| chainmail (fit) | armor-fit | medium | 1 | 41,269 | fit-ok | 7 | accepted |
| horned-helmet (fit) | armor-fit | medium | 1 | 33,791 | fit-ok | 7 | accepted |
| cloth-hood (fit) | armor-fit | medium | 1 | 34,823 | fit-ok | 7 | accepted |
| leather-cap (fit) | armor-fit | medium | 1 | 30,665 | fit-ok | 7 | accepted |
| leather-armor (fit) | armor-fit | medium | 1 | 47,209 | fit-ok | 7.5 | accepted |
| crown (fit) | armor-fit | medium | 1 | 34,440 | fit-ok | 7 | accepted |
| circlet (fit) | armor-fit | medium | 1 | 27,426 | fit-ok | 7 | accepted |
| goblin-king | enemy | high | 2 | 173,443 | 8.0 | 8 | accepted |
| orc-archer | enemy | high | 3 | 186,751 | 8.0 | 8 | accepted |
| ogre-brute | enemy | high | 3 | 241,959 | 7.8 | 8 | skipped |
| orc-shaman | enemy | high | 2 | 198,890 | 8.0 | 8 | accepted |
| wood-golem (rework) | enemy-rework | high | 3 | 120,760 | 7.5 | 8 | skipped |
| minotaur-guard (rework) | enemy-rework | high | 2 | 0 | - | 8 | skipped |
| mummy (rework) | enemy-rework | high | 2 | 75,483 | 8.0 | 8 | accepted |

Totals: 40 assets, 36 accepted, 4 skipped, 2,865,507 subagent tokens logged (including the 325,020 probe).

## Skipped

- cliff-face: fresh high agent reworked the grass only: cap a thick plank, ledge mats small, wedges plain; SKIPPED after 4 passes (medium 78789 + high 47555 = 126344); rock body usable; lesson: the textured build reduces the rock to 302 tris while --fast reports 5350, so maxError 0.04 hides facets
- ogre-brute: v3 same agent: v1 arm lengths restored, belly paint strengthened, 72346 tris, check ok; the hanging arm still reaches the hem and the shading is faint; 7.8 after three passes: SKIPPED (below the character bar); source left uncommitted, review entry added for the owner
- wood-golem (rework): rework pass 3: eyes proud with painted sockets, raised petal sigil core, 70148 tris; eyes still small flecks in the front sprites; 3.8 -> 7.5 after three passes (120760 tokens), below the bar; source untracked (other session), review entry updated
- minotaur-guard (rework): retry agent stalled again (149-byte log for 19 min); stopped; SKIPPED after two stalls; brief kept in bench/sonnet/briefs/minotaur-guard-rework.md

## Lessons

- The low tier reached 6.5 on both armor pieces at the first pass; armor went to the medium tier.
- A same-agent feedback pass costs 3K to 30K tokens; a fresh build 35K to 60K (statics) or 140K to 165K (characters). Feedback passes were the first retry every time and most assets passed on pass 2 or 3.
- Reduction fights (maxTriangles caps, subtracted grooves, displaced trunks) cost the most tool uses; grooves belong in bump, and a plain union of many boxes can refuse to reduce.
- The textured build reduces harder than --fast: cliff-face showed 5,350 rock triangles in --fast and 302 in the textured build at maxError 0.04.
- Queued SendMessage deliveries can be lost when the agent stops; send feedback after the completion notice and confirm "Resuming agent".
- The renderer lifts saturated greens about one step; compensate in the source palette.
- Owner rule (2026-09-29): every equipment piece fits the chibi humanoid base; contract in docs/equipment-fit.md and bench/sonnet/briefs/torso-contract.md.
