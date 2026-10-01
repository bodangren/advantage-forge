# wood-golem pass (enemies/construct/wood-golem) -> assets/wood-golem.ts

One more pass on the existing file (owner decision of 2026-10-02). The file is not committed; edit it in place. P1 character. Reference: docs/enemy-mockups/wood-golem_001.jpg. The contract is the "Batch 1: wood-golem" section of measure/tracks/asset_p1_enemies_20260928/plan.md. Last score 7.5 after three passes; the eyes still read as small pale flecks in the front sprites.

Changes, in this order:
1. Eyes: two glowing amber-yellow slits, each about 0.08 m wide and 0.03 m tall, emissive #ffb020 at intensity 1.5, set inside a dark recessed visor band (#2a1c12) across the face. They must read in the front sprites at 128 px.
2. Chest core: the core is a flat orange disc stuck on the chest. Set it into a dark round cavity (a recess 0.03 m deep with a plank rim), and make the flower glow (emissive #ff8a1a, intensity 1.2) with petals that stand out from the cavity floor.
3. Wraps: the arm and leg wraps are pale rope. The mock has green vines: make them vine green #54792f with a few small leaves, not rope.
4. Head: the head is a stack of flat slabs. Make it read as one rounded mask block whose planks curve around the head, under the existing crown of staves.

Keep the 1.14 m height, the stone golem rig, every clip, and the vines and moss.

Keep the skeleton, the knee split, every clip, the color slots, and the presets. Change only what this brief lists. The character bar is 7.5 of 10 (owner decision of 2026-10-02).

Checks: `FORGE_WORKERS=2 ./forge render wood-golem --fast`, then look at out/wood-golem/render.png and compare with the reference. At most 7 looks. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have. Then `FORGE_WORKERS=2 ./forge all wood-golem` once (it can wait for a build slot; give it a long timeout). Run `./forge check wood-golem`: it must end `result ok`. Look at out/wood-golem/sprites/preview.png once: the face must read at 128 px. No `warning:` lines. Run `node scripts/typecheck-asset.mjs wood-golem` and fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`. Update the design note at the top of the file. Never commit. Only edit assets/wood-golem.ts.
