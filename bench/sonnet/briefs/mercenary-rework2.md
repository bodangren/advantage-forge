# mercenary rework 2 (enemies/humanoid/mercenary) -> assets/mercenary.ts

Rework the existing assets/mercenary.ts (a fresh agent; the file builds, 44,420 triangles, `./forge check` ok). Bar 8/10 (character). Three passes scored 7.5, 7.7, and 7.6; the owner asked for one more pass. Mockup: docs/enemy-mockups/mercenary_001.jpg (already the `reference`). Keep the rig, the clips, the variants, the wide torso, the breastplate with the ridge and the dents, the small riveted pauldrons, the blue collar band, the short blue sleeves with the red cuffs, the bare thick forearms, the red sash, the belt, the split skirt with the tail, the wide sword, the scar.

Fix these three things, largest first:

1. Hair. The hair is a flat black cap with tiny spikes. Restore the wild swept fringe of the mockup: a hair cap 1.04x the skull cut at the brow, plus eight to ten tapered spikes (cones r 0.02 at the base to 0.004 at the tip, 0.07 to 0.09 long) that sweep up and back from the crown and the temples, tilted 30 to 45 degrees back, blended k 0.012, with two shorter spikes falling forward over the forehead beside the scar. The silhouette in the side view must show spikes rising above the crown, not a beanie.

2. Emblem and plate. Enlarge the lion emblem to 0.06 m and raise it 0.006 m so it reads at 128 px; brighten the plate one more step at the lit side (#c8cace lit, #9a9ca2 base). Drop the beard 0.01 m and narrow its top so the plate's upper edge and the blue collar band show between the beard and the pauldrons in the front view.

3. Face. Thicken the brows to 0.018 m tilted 20 degrees down toward the nose, enlarge the nose sphere to r 0.02, and keep the frown. Add rosy cheek paint only if the base already has it.

Check every fix in out/mercenary/render.png and out/mercenary/sprites/preview.png. Report the three largest remaining differences.

Limits: under 65,000 triangles. No `warning:` lines. `./forge check mercenary` must end with `result ok` and the ground line must be ok. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only edit assets/mercenary.ts. Finish with one `./forge all mercenary`.
