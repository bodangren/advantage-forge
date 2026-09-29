# gnoll-hunter (enemies/humanoid/gnoll-hunter) -> assets/gnoll-hunter.ts

A hyena-headed archer about 1.05 m tall to the ear tips, faces +Z, on the orc archer base (assets/orc-archer.ts: the heavy rig with knee bones, a bow in the left hand and a draw clip; clips as in that file; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/gnoll-hunter_001.jpg (set `reference` to that path). Match its idea: a grey-brown hyena head with a dark snout, a black nose, a snarl with white fangs, angry yellow eyes, tall pointed ears, a shaggy grey mane down the neck and around the cheeks; a wolf-pelt hood draped over the head and shoulders with the pelt's ear flaps; a tan fur body with darker paws; a leather chest strap with a quiver of three arrows on the back; fur cuffs on the wrists and shins; a leather wrap belt with a loincloth; a recurve bow held in the left hand; bare clawed feet.

Palette: fur #a88a60 with shade #86683e (roughness 0.9), snout and paws #3a3430, mane #6a6258; pelt hood #8a8a80 with shade #5a5a54, fur in bump; teeth #efe8d8; eyes #ffd23a; leather #5a3a26; bow #7a4a2a with a #3a2a1a grip; arrows #6a4a2a with #8a8a92 heads; loincloth #4a3a2a.
Variants: fur (tan default, grey #9a9490, red-brown #9a5a34), pelt (grey default, white #e8e4dc, black #2a2a2e), leather (brown default, black #2a2622, red #7a2a22).

Construction recipe:
1. Copy assets/orc-archer.ts. Keep the rig, the bow, the quiver, and the clips. Replace the orc head with a hyena head: a skull ellipsoid 0.24 x 0.22 x 0.22, a long muzzle (a rounded box 0.12 x 0.1 x 0.14 pushed forward, dark), a black nose sphere, an open snarl cut by a subtracted box with a dark inner body and cone fangs, two eye spheres r 0.028 under a heavy brow, tall pointed ears (flattened cones 0.14 tall), a mane of 12 to 16 spiky cones around the cheeks and down the neck.
2. Pelt hood: a cap over the skull behind the ears (an ellipsoid 1.06x the skull cut at the face) that drapes to the shoulders (two flat flaps) with two pelt ear flaps on top; fur in bump.
3. Body: tan fur torso and limbs with dark paws (paintWhere), a leather chest strap (a thin diagonal box), fur cuffs (displaced tori) on both wrists and shins, a wrap belt with a loincloth, clawed feet.
4. Bow: keep the base bow in hand.L and the draw clip; make the bow a recurve (two curved limbs with tips bending forward) 0.9 m tall. `./forge check gnoll-hunter` must end with `result ok` and the ground check must be ok.
5. Sprites: the ears, the muzzle, the pelt hood, and the bow must read at 128 px.

Limits: under 70,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/gnoll-hunter.ts. Finish with one `./forge all gnoll-hunter`.
