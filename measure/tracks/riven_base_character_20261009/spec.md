# Riven Lands base character and fit contract

## Purpose

Build the Riven Lands humanoid base, the equipment fit contract, and the porting recipe that every rigged
Riven Lands family uses. The base is the counterpart of the chibi humanoid kind
(`assets/parts/humanoid-kind.ts`, `assets/avatar-base.ts`) and of `docs/equipment-fit.md`.

## Owner decisions (2026-10-09)

- Scope order: the game set first, then the rest of the catalog by family.
- Base figure: about 1.6 m tall and 5 heads tall. Not chibi.
- Skeleton: the same bone, clip, and socket names as Chibi Quest. Only joint positions and proportions change.
- Track split: foundation tracks plus one production track per catalog family.
- Build work starts after the Primary Advantage cutover is complete. Track creation and planning may start now.

## Art direction

Riven Lands is the asset pack for secondary students (grades 7 to 12) in Reading Advantage. It keeps the
gameplay meaning, the map positions, the pivots, and the interaction points of Chibi Quest. Only the
proportions and the surface treatment change (`docs/pack-layout.md`, `docs/hamlet-mockups/README.md`).

- Architecture: tall, narrow gables, heavy stone footings, exposed timber braces, dark slate roofs, rugged ground, gnarled trees, and muted earth colors.
- Characters: no chibi proportions, no gore, and no realistic horror detail. Soft, color-matched edges and smooth shading. The face, the ears, and the key gear read at 128 pixels.
- Palette example (goblin warrior): olive skin, dark earth cloth, brown leather, and bronze metal.
- Content: rated G (owner, 2026-10-04).
- References: `docs/hamlet-mockups/riven-lands-v2.png` and `reference-designs/riven-goblin-warrior-20260925/`.

## Functional requirements

- FR-1: `packs/riven-lands/parts/humanoid-kind.ts` builds a humanoid about 1.6 m tall and 5 heads tall (head radius about 0.16 m), standing on y = 0, facing +Z, +X the character's left. It takes the same kind options as the chibi humanoid kind (head, hair, skin, outfit, color slots) so the Chibi Quest hero and NPC sources port by a change of the import and the dress.
- FR-2: `packs/riven-lands/assets/avatar-base.ts` is the pack's avatar base. It has the same bone names (including the knee split bones), the same clip names, and the same equipment socket names as `assets/avatar-base.ts`. Only joint positions and proportions change.
- FR-3: Every shared clip plays on the base (`./forge animate avatar-base --pack riven-lands --clip <name>` for each clip). Clip timing may change for the taller figure; clip names and loop flags stay.
- FR-4: `packs/riven-lands/fit.md` records the base measures (head, eyes, torso revolve, shoulder, elbow, wrist, hip, knee, ankle, foot) and the display scale and anchor table for every equipment class, in the format of `docs/equipment-fit.md`.
- FR-5: The base has the same color slots as the chibi base (eyes, hair, skin, outfit) with muted presets that fit the Riven Lands palette (owner rule: options stay in the default's saturation family).
- FR-6: Sprites render at 128 px in 8 directions and the face reads in `sprites/preview.png`.
- FR-7: A porting recipe in `packs/riven-lands/PORTING.md` states how a Chibi Quest source becomes a Riven Lands source: import the Riven kind, apply the proportion warp (`assets/parts/head-swell.ts` style space warp when a kind is shared), re-dress with the muted palette, and check with `scripts/part-check.mjs --pack riven-lands`. It names what transfers unchanged (clips, bone tags, sockets) and what needs a new build.
- FR-8: Two style proofs reach the character bar of 7.5 in an independent review: the knight (a hero on the base) and the goblin warrior (from its turnaround, a wiry hunched adult that still shares the skeleton).

## Non-functional requirements

- The base builds in the same time class as the chibi base (`--fast` under 10 s on the 2012 quad-core).
- No change to `assets/avatar-base.ts`, `assets/parts/humanoid-kind.ts`, or `docs/equipment-fit.md`.

## Acceptance criteria

- `./forge check <piece> --pack riven-lands` wears a Riven Lands piece on the Riven Lands base and ends with `result ok`.
- `./forge animate avatar-base --pack riven-lands --clip walk` and every other shared clip show no sinking feet and no self-intersection (clip clearance from `./forge check`).
- The avatar composer (`src/apk3d/avatar/`) dresses the Riven Lands base from a Riven Lands avatar pack with no code change beyond the pack id. If a code change is needed, this track records it and the game skin track owns it.
- The independent review rates the base, the knight, and the goblin warrior at 7.5 or higher.

## Out of scope

- The other heroes, enemies, and NPCs. Their family tracks own them.
- The avatar pack build and its release (riven_game_skin_20261009).
- Guild Mode, GP prices, and the shop for Reading Advantage. A later progression track owns them.
