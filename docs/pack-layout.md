# Pack layout: one Forge, several asset packs

Status: design for owner approval (track `repo_rename_advantage_forge_20261002`, phase 2). No path moves until the owner approves it.

## Why

The repository began as one asset tool with one look, Chibi Quest. It will also build Riven Lands. An asset pack is one visual
language (a skin) for the games. Chibi Quest targets primary students. Riven Lands targets secondary students (Reading Advantage,
grades 7 to 12). The hamlet mockups already use this idea: [one shared layout, two asset languages](./hamlet-mockups/README.md).
Each catalog component ID receives one Chibi Quest treatment and one Riven Lands treatment, with the same gameplay meaning.

## What is shared and what a pack owns

| Shared (one copy) | A pack owns (one copy per pack) |
| --- | --- |
| The SDF engine, mesher, baker, rigger, and `./forge` CLI (`src/`) | Asset sources (`assets/`) and equipment parts (`assets/parts/`) |
| The catalog IDs and scene blueprints (`docs/fantasy-world-*`) | Scene sources (`scenes/`) |
| The games, the host, and the APK shapes (`src/games/`, `src/host/`, `src/apk3d/`) | Reference designs and mockups |
| Review rubric and bars (7 and 7.5) | Review ratings (`character-reviews.json`) and the avatar catalog |
| Skeleton bone names, clip names, and equipment socket names | The base character, the equipment fit contract, and the color presets |
| Measure tracks, tools, and CI | The pack manifest, `pack.json` |

The shared skeleton is the key rule. If Riven Lands characters use the same bone, clip, and socket names, then the same clips,
the same games, and the same avatar composer work with both packs.

## Proposed layout

```
packs/
  chibi-quest/
    pack.json            id, audience, base character, fit contract, sprite pack id
    assets/              today's assets/ (moved in stage 2)
    scenes/
    reference-designs/
    mockups/
    fit.md               today's docs/equipment-fit.md
    reviews.json
  riven-lands/
    pack.json
    assets/
    scenes/
    reference-designs/
    mockups/
    fit.md               new: the Riven Lands base and fit contract
    reviews.json
out/<pack>/<asset>/      build output (today out/<asset>/)
```

The CLI takes a pack: `./forge render rogue --pack riven-lands`. The default pack is `chibi-quest`, so every existing command keeps
working. Catalog IDs stay the same in both packs. A source file has the same name in both packs (`cottage.ts`).

## Migration in two stages

1. **Stage 1: add, do not move.** `assets/` stays where it is and counts as the `chibi-quest` pack. Add `packs/riven-lands/` with its own
   `assets/`, `scenes/`, and `fit.md`. Add `--pack` to the CLI. No path that a caller depends on changes. This respects the AGENTS.md rule.
2. **Stage 2: move Chibi Quest.** After Riven Lands works, move `assets/` and `scenes/` to `packs/chibi-quest/`. Leave `assets` as a link
   or update every caller. This needs owner approval and a quiet repository (no other agent running).

I recommend stage 1 now. It gives the Riven Lands work a place at no risk to the 600 existing sources.

## Names at run time

- Sprite packs already carry a pack id (`primary-chibi-2d`). Riven Lands uses `secondary-riven-2d`.
- Model files in `demo/public/models/` need a pack folder (`models/<pack>/<name>.glb`) so two `cottage.glb` files do not collide.
  The host and each game pick the pack from the launch context. This touches every `loader.get(model(...))` call. Decide it in the
  game-platform track, not here.
- Provenance strings in the sprite pack, `fantasy-asset-forge/assets/x.ts`, become `advantage-forge/packs/<pack>/assets/x.ts`.

## Scope tables that gain a pack column

`measure/scope-map.tsv`, `docs/avatar-catalog.tsv`, and `docs/character-reviews.json` track one status per catalog ID today. Each
needs a pack key (or one file per pack) so the same ID has a Chibi Quest status and a Riven Lands status.

## Riven Lands brief

### What is already decided

- The audience is secondary students (grades 7 to 12). The pack skins the games that run in Reading Advantage.
- The shared layout and gameplay meaning stay the same as Chibi Quest. Only proportions and surface treatment differ.
- Architecture: tall, narrow gables, heavy stone footings, exposed timber braces, dark slate roofs, rugged ground, gnarled trees,
  and muted earth colors (`docs/hamlet-mockups/README.md`).
- Characters: avoid chibi proportions, gore, and realistic horror detail. Use soft, color-matched edges and smooth shading. The
  face, ears, and key gear must read at 128 pixels (`reference-designs/riven-goblin-warrior-20260925/README.md`).
- Goblin warrior palette: olive skin, dark earth cloth, brown leather, and bronze metal.
- Existing references: `docs/hamlet-mockups/riven-lands-v2.png` and the Riven Lands goblin warrior turnaround.

### What differs from Chibi Quest and needs a decision

| Topic | Chibi Quest today | Riven Lands decision needed |
| --- | --- | --- |
| Base character | The chibi humanoid, about 1.0 m, head about 0.2 m radius | Proportions (head to body ratio), height in meters, and one base design |
| Equipment fit | Every piece is a scaled fit of the chibi base (`docs/equipment-fit.md`) | The same rule with a new base, in `packs/riven-lands/fit.md`. A new contract table, same slots |
| Skeleton | Rigid slots, knee bones, shared clips | Keep the same bone, clip, and socket names. Confirm with the owner |
| Color variants | Presets of eyes, hair, skin, and clothing | Same slots. Muted palettes for the presets |
| Sprites | 128 px, 8 directions | Confirm the same size and view |
| First batch | Not applicable | Which assets first. Suggestion: the hamlet components and its cast, because the mockup and the component list exist |
| Avatars and GP | Primary Advantage first | Later. The avatar track targets Primary first |

### Suggested first steps after approval

1. Build the Riven Lands base character and write `packs/riven-lands/fit.md`.
2. Build the hamlet components in the Riven Lands treatment from `components.tsv` and assemble the scene.
3. Port the goblin warrior from its turnaround as the first rigged character.
4. Review with the same rubric and bar.

## Open questions for the owner

1. Approve stage 1 (add `packs/riven-lands`, keep `assets/` in place) now, and stage 2 later?
2. Riven Lands base character: proportions and height?
3. Do Riven Lands characters keep the same bone, clip, and socket names?
4. First batch: the hamlet and its cast?
5. Which game runs first in a Riven Lands skin?
