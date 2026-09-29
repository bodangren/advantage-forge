# living-statue rework (enemies/construct/living-statue) -> assets/living-statue.ts

Rework the existing assets/living-statue.ts (a fresh agent; the file builds, 37,972 triangles, `./forge check` ok). Bar 8/10 (character). Two passes scored 7.3 and 7.7. Mockup: docs/enemy-mockups/living-statue_001.jpg (already the `reference`). Keep the rig, the clips, the sword, the shield rings, the mask, the eyes, and the carvings.

Fix these three differences, largest first. Judge them in out/living-statue/sprites/preview.png, where the statue now reads as one flat white blob:
1. Value contrast. Lower the marble base so shading has room: base #cfcbc2, up-facing #ece9e2, down-facing and crevices #8e8a80 (paintFn by surface direction, a wide gradient, not a hard step). Paint every recess and edge one step darker: the visor band #6a6660, the seams between the helm, the crown band, the pauldrons and the chest (thin paintWhere bands #a8a49a), the inside of the shield rings, the skirt grooves, and under the pauldrons. Make the cracks read: dark #7a766c crack lines (thin extruded noise strokes intersected with a shell of the surface, painted, not bump only) on the helm, chest, shield and skirt, like the mockup. Set roughness 0.55 so highlights separate the planes.
2. Helm. The dome is oversized and swallows the face. Make the helm a rounded cap that sits on the skull (sphere r 0.22, not larger than the head by more than 0.02) with the flat crown band (a torus scaled [1, 0.5, 1], 0.05 tall) at the brow and the laurel leaves ON the band, and let the mask show below it: the mask top edge at the eye line, the chin point 0.06 below the mouth line. The head must read as helm + visor + mask in three tones.
3. Pauldrons and boss. Give each pauldron an upturned flange (a torus segment on the outer edge) and a darker underside; raise the shield boss into a stacked drum (two cylinders r 0.06 and 0.04, 0.03 tall each) on the center dome.

Check every fix in out/living-statue/render.png and out/living-statue/sprites/preview.png. Report the three largest remaining differences.

Limits: under 60,000 triangles. No `warning:` lines. `./forge check living-statue` must end with `result ok` and the ground check must be ok. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only edit assets/living-statue.ts. Finish with one `./forge all living-statue`.
