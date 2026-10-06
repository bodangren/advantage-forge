# Remove the legacy games from the monorepo

## Purpose

Owner direction, 2026-10-06: "There should be no old games in the repo at all. Only our new games
which are already complete and using the new assets."

The new games are the 28 student games of the monorepo package `game-cartridges-3d`, ported from
Forge `src/games/` (the 23 legacy rewrites and five more). Monster Encounters stays out of the
student games (owner, 2026-10-04: a later teacher-led lesson game). On 2026-10-06 the apps still
run the legacy games of `@reading-advantage/game-cartridges` on the game catalog, the cartridge
route, the quest battle, the teacher challenge pages, the arcade, and the QC pages.

## Scope and ownership

| Part | Owner |
| --- | --- |
| Inventory of every legacy game use in the three apps and the packages | Monorepo |
| A plan that fits the cutover (2026-10-14 to 2026-10-20) | Monorepo, agreed with Forge |
| Features, manifest data, or id maps that the new games lack | Forge |
| The new routes, the removal of `game-cartridges` and of the legacy-only host code | Monorepo |
| Records, evidence, and the agreement | Forge (this track) |

Forge works only in this repository. The monorepo session makes every change and commit there.

Out of scope: Tutor Advantage (`../tutor-advantage`), which runs its own copies of the old games. The owner's developer moves it to the new games with Primary Advantage as the model (owner, 2026-10-06). So the Primary Advantage game pages must be a clear model to copy.

## Owner decisions

- 2026-10-06: the Echo Staff cannot be earned until the read-to-select-audio mode (F2) ships. No temporary rule (option 1). The Apprentice Wand and the Graveyard Staff move to the new Hero vs. Zombie (monorepo M2).
- 2026-10-06: Tutor Advantage is out of scope (see above).
- 2026-10-06: the monorepo plan is approved as proposed. Before the cutover, Primary Advantage runs only the new games; Reading Advantage and Advantage Games move after the cutover, and `game-cartridges` goes then.

## Requirements

1. No app in the monorepo runs or imports `@reading-advantage/game-cartridges`, and the package is
   gone.
2. Every student game page runs a new game, with the student's avatar (owner identity rule).
3. Class challenges, completions and XP, the RPG completion rewards, and the learning modes keep
   working with the new games. Changed game ids keep their history (for example
   `labyrinth-goblin-king` to `labyrinth`, `wizard-vs-zombie` to `hero-vs-zombie`).
4. Old links and bookmarks go to a new game or to the game catalog.

## Acceptance

- `git grep @reading-advantage/game-cartridges` on the integration branch finds nothing outside
  history.
- The monorepo tests and type checks pass, and a browser check plays one new game from each
  changed route.
- The monorepo session confirms the commits; this track records them.
