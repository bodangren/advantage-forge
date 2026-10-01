# stone-golem rework (enemies/construct/stone-golem) -> assets/stone-golem.ts

Rework the existing file in place. P1 character. Reference: docs/enemy-mockups/stone-golem_001.jpg. Current score 7.0; the bar is 7.5.

The body reads (stacked stone plates, moss, the cyan core emblem). Three differences remain:
1. Head: now a small green ball with two eyes. Make a bigger square stone head (about 1.5 times the current size) with a heavy stone brow ridge and a visor-like cheek plate, sunk low between the shoulders as in the mock. The two cyan eyes glow under the brow (emissive).
2. Fists: now plain green spheres. Make rock fists: two or three stacked stone blocks with chamfered edges, with two green knuckle stones set into the front.
3. Chest: add moss-green muscle plates (two pectoral plates and three ab plates with dark seams) around the cyan core emblem, as in the mock. Keep the emblem.

Keep the scale (about 1.0 m tall) and the stacked-stone arms and legs.

Keep the skeleton, the knee split, every clip, the color slots, and the presets. Change only what this brief lists. The character bar is 7.5 of 10 (owner decision of 2026-10-02).

Checks: `FORGE_WORKERS=2 ./forge render stone-golem --fast`, then look at out/stone-golem/render.png and compare with the reference. At most 7 looks. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have. Then `FORGE_WORKERS=2 ./forge all stone-golem` once (it can wait for a build slot; give it a long timeout). Run `./forge check stone-golem`: it must end `result ok`. Look at out/stone-golem/sprites/preview.png once: the face must read at 128 px. No `warning:` lines. Run `node scripts/typecheck-asset.mjs stone-golem` and fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`. Update the design note at the top of the file. Never commit. Only edit assets/stone-golem.ts.
