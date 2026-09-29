# wight rework (enemies/undead/wight) -> assets/wight.ts

Rework the existing assets/wight.ts (a fresh agent; the file builds, 46,364 triangles, `./forge check` ok). Bar 8/10 (character). The last review gave 7.7. Mockup: docs/enemy-mockups/wight_001.jpg (already the `reference`).

Fix these three differences, largest first:
1. Hair volume. The back hair is a thick white curtain from the crown to the hips. In the side and back sprites the character reads as a white mop with a crown. Match the mockup: shoulder-length wavy locks. Cut the back curtain at y 0.40 (the shoulder line), keep it close to the skull (no more than 0.05 m thick), and split it into six to eight separate wavy locks (`sdf.chain`, r 0.035 to 0.015) with a `bump` for strands. The cape and armor must show below the hair in the back view. Keep the six face-framing locks in front and the domed hair top under the crown.
2. Eyes. Match the mockup: a large dark navy iris (#2c3560) that fills most of the eye, a thin pale sclera ring (#dcdde6) visible around it, a black pupil, two white glints (one large upper left, one small lower right). Replace the black disc with lavender center. Keep the brow ridges.
3. Armor detail. Add embossed leather straps and rust-brown bracers (#6a4a2a with rust spots) on both forearms like the mockup, and a row of three small buckles on the chest plate. Keep everything else.

Check every fix in out/wight/render.png and out/wight/sprites/preview.png. Report the three largest remaining differences.

Limits: under 60,000 triangles. No `warning:` lines. `./forge check wight` must end with `result ok`. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only edit assets/wight.ts. Finish with one `./forge all wight`.
