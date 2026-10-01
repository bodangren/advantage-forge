# wraith rework (enemies/undead/wraith) -> assets/wraith.ts

Rework the existing file in place. P1 character. Reference: docs/enemy-mockups/wraith_001.jpg. The current wraith is close to the mock (7.0). Four differences remain:
1. Face void: it is a glossy black ball with white highlights. Make it matte: roughness 1, metalness 0, color #050608, so no highlight shows. Keep the two cyan eyes, emissive.
2. Lantern: add the blue flame of the mock: a flame shape (two or three tapering curled tongues, `sdf.chain`) rising about 0.08 m above the lantern top, emissive #4ab0ff at intensity 1.2. Give the lantern glass a cyan glow.
3. Cloak at the shoulders: the cloak now flares into a round ring, like a jellyfish rim. Replace the ring with a draped cowl: soft vertical folds from the hood down over the shoulders, and a knotted tie at the neck whose two ends hang down 0.1 m (the mock has a cloth tie, not a cord loop).
4. Hood: in the side view the hood is tall and boxy. Make it rounder, with a soft peak at the back of the head.

Keep the floating rig, the clips, the skeletal claw hand, and the trailing tendrils.

Keep the skeleton, the knee split, every clip, the color slots, and the presets. Change only what this brief lists. The character bar is 7.5 of 10 (owner decision of 2026-10-02).

Checks: `FORGE_WORKERS=2 ./forge render wraith --fast`, then look at out/wraith/render.png and compare with the reference. At most 7 looks. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have. Then `FORGE_WORKERS=2 ./forge all wraith` once (it can wait for a build slot; give it a long timeout). Run `./forge check wraith`: it must end `result ok`. Look at out/wraith/sprites/preview.png once: the face must read at 128 px. No `warning:` lines. Run `node scripts/typecheck-asset.mjs wraith` and fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`. Update the design note at the top of the file. Never commit. Only edit assets/wraith.ts.
