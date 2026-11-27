# Specification: Fill every empty shelf in the games and scene maps

## Overview

Daniel reported two empty shelves on 2026-10-28. The classroom shelf holds no books. The
Enchanted Library game shows only bookshelves without books.

One asset causes both. `assets/shelf.ts` builds a tavern bottle shelf with empty boards. The
games and the scene maps place that empty asset.

This track fills every shelf in the five games and the seven scene maps that place it. The fill
matches the place. A library holds books. A shop holds bottles and bread. A lab holds bottles
and vials. A forge holds crates and sacks. A bathhouse holds jars and baskets.

The track also repairs three related defects. Two items float above a cabinet. One candle stands
inside a cabinet.

## Owner request

Daniel, 2026-10-28, verbatim:

> Also, the classroom bookshelf has no books in it...

> The Enchanted Library game Also has only bookshelves with no books. I think that's Forge's
> responsibility, but then any game changes need to be propogated to Monorepo for use in Primary
> Advnatage.

## PM scope (2026-10-28 07:10 ICT)

- No shelf stays empty in a game or a scene.
- Shelves in libraries and classrooms hold books.
- Shelves in shops, labs, and kitchens hold things that fit the place, for example jars, bread,
  potions, or crates.
- The method is open: a filled shelf variant, props placed on the shelf, or a change of the asset.
- Look at a render of each changed game before the commit.
- Done when one status line goes to the PM. The line names the Forge commit, the changed games and
  scenes, and the render paths with SHA-256.
- The PM then hands the commit to the Monorepo session for its cartridge sync, as in monorepo
  `0c220e663`, synced from Forge `afc8b890`.
- No session writes in the monorepo.

## Facts found (2026-10-28)

### Cause

`assets/shelf.ts` builds a standing bottle shelf for behind the tavern bar. The asset is built
empty. Its boards sit at about y 0.45, 0.78, and 1.09. It is 1.3 m wide. Its back face sits at
z 0 and its front face at z 0.3.

Two filled alternatives already exist. `bookcase` is a walnut case with four rows of books and a
scroll rack. It holds no candle. It is 1.2 m wide and 2.02 m tall. `bookshelf` is a smaller case
with books and a lit candle on top.

Ready props exist: bottle, jar, vial, bread, crate, sack, pot, the potion assets, spellbook, and
tome.

### Done already (the one-off lane)

The classroom is filled. Commit `e4e5c593` replaced the centre `shelf` with `bookcase` at
[-1.2, 0, -3.68] in `scripts/design-classroom.mjs` and `scenes/maps/classroom.ts`.

The render is `out/chibi-sprouts/r1/week1/scenes/classroom-v2.png`. Its SHA-256 is
`793773567a595330809cf44550084033e7c6662c14544590975f76fb15d0dc98`. The image is 1920x1080 RGB.
The old `classroom.png` stays unchanged.

### Games with the empty shelf

Five 3D game views place the empty `shelf`:

| Game | File | Lines |
| --- | --- | --- |
| Enchanted Library | `src/games/enchanted-library/view/hall.ts` | 53-56 |
| Haunted Library | `src/games/haunted-library/view/library.ts` | 67 |
| Potion Rush | `src/games/potion-rush/view/shop.ts` | 109 |
| Alchemists' Synthesis | `src/games/alchemists-synthesis/view/lab.ts` | 69 |
| Rune Forge Chamber | `src/games/rune-forge-chamber/view/forge.ts` | 68-69 |

Each game lists its models in `manifest.ts` under `MODELS_3D`. A new asset in a view must join that
list and the game's model pack. The pack contract is `tests/apk3d/pack-bindings.test.ts`: every
named model must sit in a pack that the game manifest lists, and the game must stay inside its
byte budget.

No 2D (Phaser) view draws a shelf. The 2D Enchanted Library draws its back wall with shelves of
books in the background canvas (`src/games/enchanted-library/view2d/ground.ts`).

### Scene maps

An audit on 2026-10-28 used this rule: an item stands on a case when its x and z fall inside the
case footprint after yaw, and its y is above zero.

Seven maps place the `shelf` asset. Four of them are filled already: alchemy-lab, apothecary,
bakery, and general-store.

Empty shelves:

| Map | File | Lines | Count |
| --- | --- | --- | --- |
| Bathhouse | `scenes/maps/bathhouse.ts` | 96-99 | 4 |
| Warehouse | `scenes/maps/warehouse.ts` | 146, 147, 150 | 3 |

`scripts/design-bathhouse.mjs:43` promises a shelf of towels. No towel asset exists.

Related defects:

- `scenes/maps/inn.ts:154` — a bottle and a mug float between the boards against the back panel.
- `scenes/maps/school.ts` lines 52 and 66 — cabinet items float about 0.1 m above the cabinet top.
  Their y is 1.1 and the cabinet top runs from 0.99 to 1.05.
- `scenes/maps/archive.ts:174` — a candle stands inside the cabinet at line 79.

The maps are generated. Edit `scripts/design-<map>.mjs`, then run it.

### Measured supports

- The shelf boards sit at y 0.45, 0.78, and 1.09. The board thickness is 0.045. The board tops
  are 0.4725, 0.8025, and 1.1125.
- The shelf footprint is 1.3 m wide and 0.3 m deep. Its back face sits at the origin.
- The filled maps put an item on the first board at y 0.475 and about 0.15 m in front of the shelf
  origin. See `scenes/maps/apothecary.ts` and `scenes/maps/general-store.ts`.
- The alchemy lab puts a bottle and a vial on the top board at y 1.11. See
  `scenes/maps/alchemy-lab.ts` lines 90 to 95.
- The cabinet is 1.0 m wide, 0.98 m tall, and 0.45 m deep. See `assets/cabinet.ts`.

## Functional Requirements

1. **FR-1 Fill every game shelf.** Every `shelf` placement in the five game views holds at least
   one item. The items fit the place of the game.
2. **FR-2 Libraries hold books.** The Enchanted Library and the Haunted Library hold books on every
   shelf. No candle appears in a library or a classroom.
3. **FR-3 Shops, labs, and forges hold fitting items.** Potion Rush holds bottles, bread, and fruit.
   Alchemists' Synthesis holds bottles and vials. Rune Forge Chamber holds crates and sacks.
4. **FR-4 Fill every map shelf.** Every `shelf` placement in the seven maps holds at least one item.
   The bathhouse shelves hold jars and baskets. The warehouse shelves hold crates and sacks.
5. **FR-5 No floating item.** Every item that stands over a board, a top, or a case rests on a
   support. The inn bottle and mug rest on a board. The school jar and orb rest on the cabinet top.
6. **FR-6 The archive candle leaves the cabinet.** The candle at `scenes/maps/archive.ts:174` no
   longer stands inside the cabinet at line 79.
7. **FR-7 The falsifiable check.** One script or test lists every `shelf` placement in
   `scenes/maps/*.ts` and in the five game views with its item count. It fails on an empty shelf
   or a floating item. Red writes it first and records the failing run.
8. **FR-8 Register every new model.** A new asset in a game view joins the game's model list, the
   game's manifest, and the game's model pack. The pack binding test and the budget test pass.
9. **FR-9 Verification.** Render each changed game view and each changed map. Look at each render
   before the commit. Record each path with its SHA-256 in the track plan.

## Non-Functional Requirements

- The content is rated G. It shows books, jars, bread, bottles, crates, and sacks.
- No paid generation runs in this track.
- Every build, render, test, vite, or Chrome run uses one command:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.
- Exit code 75 means hold. Record `lock wait over 600 s` and stop the run.
- The machine has 7.1 GB of RAM. One heavy job runs at a time.

## Acceptance Criteria

- The check from FR-7 passes. It lists no empty shelf and no floating item.
- Each changed game view and each changed map has a render path and a SHA-256 in the track plan.
- Every render was looked at before the commit.
- The Forge pack release ran when a model pack changed.
- One status line went to the PM. It names the Forge commit, the changed games and scenes, and the
  render paths with SHA-256.

## Out of Scope

- A new towel asset. The default fills the bathhouse shelves with existing items such as jars and
  baskets. A towel asset goes on the follow-up list.
- The A-25 settings list and mockups.
- Any monorepo write. The monorepo session runs every write of the cartridge sync.
