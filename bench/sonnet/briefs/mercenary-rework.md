# mercenary rework (enemies/humanoid/mercenary) -> assets/mercenary.ts

Rework the existing assets/mercenary.ts (a fresh agent; the file builds, 47,480 triangles, `./forge check` ok). Bar 8/10 (character). Two passes scored 7.5 and 7.7. Mockup: docs/enemy-mockups/mercenary_001.jpg (already the `reference`). Keep the rig, the clips, the variants, the spiky hair, the brows and eyes, the scar, the wide sword, the red sash, the belt, the wide torso, the bare forearms, the skirt with its tail.

The chest must become the centerpiece, as in the mockup: a big bright steel breastplate framed by modest pauldrons and a short beard. Fix these four things, largest first:

1. Pauldrons. They are oversized domes that swallow the chest. Shrink each to a rounded cap r 0.055 that sits on the shoulder point, with one rivet r 0.008 on top. They must not reach inward past the collar bone: the breastplate must show a clear 0.16 m wide face between them in the front view.
2. Breastplate. Make it the largest bright shape on the body: a rounded shell from the collar bone (y about 0.45) to the belt, 0.2 m wide at the chest, with a raised center ridge, a rounded lower edge that overlaps the sash, two small dents, and the lion emblem 0.05 m on the character's right chest. Lift its color one step (#9a9ca2 base with #c8cace lit, metalness 0.8, roughness 0.4) so it reads as polished steel next to the dark beard. Show a blue gambeson band 0.03 m tall above the plate at the neck line and short blue sleeves with a red cuff band (a torus 0.015 tall, #a83a30) at each upper arm end, as in the mockup.
3. Beard. Shorten it: the beard ends 0.02 m below the chin, not on the chest. It is a rounded bib 0.16 wide, 0.06 tall, 0.06 deep, plus cheek strips, with the mouth (a small frown stroke) and the nose bare. Keep the strand grooves in bump.
4. Hair and arms. Tighten the hair into a tuft: shorten the spikes to 0.05 m and cluster them on the crown, swept back, with a short undercut cap. Thicken the bare forearms to r 0.05 at the elbow and r 0.042 at the wrist with big fists r 0.045; the wrist bracer band stays thin.

Check every fix in out/mercenary/render.png and out/mercenary/sprites/preview.png: the front sprite must show hair, face, beard, plate, sash, skirt, and sword as separate readable shapes. Report the three largest remaining differences.

Limits: under 65,000 triangles. No `warning:` lines. `./forge check mercenary` must end with `result ok` and the ground line must be ok. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only edit assets/mercenary.ts. Finish with one `./forge all mercenary`.
