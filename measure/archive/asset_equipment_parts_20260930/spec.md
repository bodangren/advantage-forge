# Reusable equipment parts

## Purpose

Make the equipment that a character wears or holds usable as a standalone catalog asset and as a swappable part on other characters. Keep every existing character unchanged.

## Verified findings

- Each `k.body('name', ...)` call becomes one mesh and one node in the exported GLB, named after the body. The file `out/mage/mage.glb` holds the meshes skin, glasses, hat, stars, hair, robe, tunic, cape, sleeves, leather, gold, boots, wand, glow, book, and book-gold, all in one skin.
- The file `assets/skeleton-knight.ts` has the separate bodies helmet, plume, breastplate, pauldrons, bracers, sword, hilt, grip, and kite-shield. Each body binds to a bone through the `bone` option or `.bone()` tags.
- A game can already show, hide, or grab a part by node name at runtime.
- A part is not yet a standalone asset. The shape code sits inside the character build function. It has the size and pose of that character, and its texture sits on the character atlas.
- Standalone files already exist for some parts (`assets/iron-helmet.ts`, `assets/kite-shield.ts`, `assets/wand.ts`, `assets/spellbook.ts`). They duplicate the shape code of the worn part. The pilot must compare them with the worn part before it replaces them.

## Route

Write one shared part module for each piece, for example under `assets/parts/`. The module exports a function that returns the SDF shape at its own origin and its material options. The character imports the function and poses it on a head or hand bone. The catalog asset imports the same function and stands it on the ground. One source gives two outputs, and the sizes match the fit contract by construction.

## Acceptance criteria

- The part-module contract is written and reviewed by the owner.
- The three pilot parts (knight helmet, mage wand and book, skeleton knight kite shield) each have one shared module.
- The pilot characters render and sprite pixel-identical to the baseline, or within the tolerance that the plan states.
- Color variants and presets of the pilot characters still build and bake.
- A tool writes per-part GLBs or a parts manifest from an existing character build. (Dropped 2026-10-01: each part has its own source and standalone GLB.)
- The avatar attachment convention lists the bone and the socket offset for each part class. (Moved 2026-10-01 to avatar_system_20261001, the `equip` block.)
- Builds contain no warnings. `pnpm test`, `pnpm typecheck`, and `./forge check` pass for changed files.

## Sources

- [AGENTS.md](../../../AGENTS.md)
- [docs/equipment-fit.md](../../../docs/equipment-fit.md)
- [bench/sonnet/briefs/torso-contract.md](../../../bench/sonnet/briefs/torso-contract.md)
- [docs/color-variants.md](../../../docs/color-variants.md)
- [src/gltf.ts](../../../src/gltf.ts)
- [src/pipeline.ts](../../../src/pipeline.ts)

## Open questions for the owner

1. Does a standalone shop item have the exact size of the worn item, or a display scale?
2. Does a shared part keep its own texture atlas, or does it bake onto the atlas of the host character?
3. Which tint slots does a part own? A helmet on a new body needs slot names that the body accepts.
4. May the refactor change existing pixels a little (for example mesh cell size), and what is the tolerance?
5. Do the existing standalone assets keep their paths and catalog IDs when they import the shared module?
6. Which format does the avatar system read: a parts manifest, per-part GLBs, or node names in one GLB?

## Owner answers (2026-10-01)

1. A standalone item has the exact size of the worn item. A shop view scales it for display.
2. Each part keeps its own texture atlas.
3. Each part owns fixed tint-slot names. A host maps its slots to them.
4. A small pixel difference is acceptable. The pilot states the tolerance and records the measured difference.
5. Existing standalone assets keep their paths and catalog IDs.
6. The avatar system reads per-part GLBs plus a `parts.json` manifest.

Execution (owner, 2026-10-01): the orchestrator does the three-part pilot and writes the recipe and a
pixel-difference check. Sonnet on the low tier then breaks out one character per agent; a Haiku
probe on two characters measures whether a cheaper model passes the same check.

## Scope control

Existing source, output, and script paths remain stable. The pilot changes three parts only. Other characters change in later tracks, after the owner accepts the pilot.
