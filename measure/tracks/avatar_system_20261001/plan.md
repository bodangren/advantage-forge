# Avatar system: base, equipment fit, pack, composer

Status: planned. The plan records execution state. The specification retains design detail.

## Phase 1: Documents

- [x] Task: Write the program plan (`docs/chibi-quest-progression.md`) and the specification
  (`docs/avatar-system.md`) with the owner decisions of 2026-10-01.

## Phase 2: The avatar base

- [ ] Task: Build `assets/avatar-base.ts` on the shared hero skeleton: full skin body, hair, underclothes, 4 tint slots, 4 hair styles as head pieces.
- [ ] Task: Add the clips the games use (idle, walk, run, attack, hit, rest, cheer, cast) and pass `forge check`.

## Phase 3: Equipment declaration and fit

- [ ] Task: Add the `equip` block to `defineAsset`, validate it against the fit contract, write it to GLB extras.
- [ ] Task: Extend `forge check` to equipment: fit bounds, skin intersection in the rest pose, weapon clearance on the base clips.
- [ ] Task: Rework the 10 non-compliant pieces (belt, iron-helmet, steel-helmet, chainmail, leather-armor, horned-helmet, cloth-hood, leather-cap, crown, circlet).
- [x] Task: Write `docs/avatar-catalog.tsv` (100 pieces: slot, tier, status) and the GP price formula (`src/apk3d/avatar/price.ts`, `scripts/avatar-price.ts`, `tests/apk3d/avatar-price.test.ts`).
- [ ] Task: Add `equip` blocks to every phase 1 piece.

## Phase 4: Pack and portraits

- [ ] Task: Add the reduced output pass (coarser `maxError`, 512 px atlas) as a second output of the same asset file.
- [ ] Task: Write `scripts/avatar-pack.ts` (catalog join, reduced GLBs, portrait layers).
- [ ] Task: Render portrait layers at the fixed camera and write the canvas composer.

## Phase 5: Composer and review

- [ ] Task: Write `src/apk3d/avatar/compose.ts` and the review page `avatar.html` with the 15 starter sets and random loadouts.
- [ ] Task: Review renders of the starter sets in idle, walk, and attack; record the evidence here.
- [ ] Task: Measure the pack size and the 30-avatar composite frame rate; record the evidence here.
