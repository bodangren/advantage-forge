# grimoire rework (equipment/magic-weapons/grimoire) -> assets/grimoire.ts

Rework the existing file in place. The book lies flat and thin, so the front view is a sliver and the sigil is a faint green smear. There is no mockup; the target is a chunky chibi spell book: a thick open tome propped up at 35 degrees on a small dark wood lectern block, with fat page stacks, a big raised glowing green sigil on the right page, iron corners, and a wide ribbon.

Stands on y = 0, faces +Z, 0.5 m wide, 0.42 m tall in total.

Construction recipe:
1. Lectern: a dark wood wedge (a rounded box [0.36, 0.12, 0.3] radius 0.02 cut with a halfSpace tilted 35 degrees so the top slopes toward +Z) in walnut #4a2c18. One body.
2. Book, built flat in a local frame then tilted 35 degrees and set on the lectern: two page stacks, each a rounded box [0.21, 0.06, 0.3] radius 0.012 in #f2e3c2 with page lines in bump (thin ridges along X), splayed 8 degrees each; a spine gap 0.02 m wide between them. Cover: a red leather slab [0.46, 0.02, 0.32] radius 0.008 under the pages in #7a1e22, with a raised spine band. One body for pages, one for the cover.
3. Sigil: a raised ring torus R 0.06 r 0.012 with a raised five-point star (five extruded bars) inside it, 0.01 m proud of the right page, color #5cf55c, emissive #5cf55c, emissiveIntensity 0.6, roughness 0.3. One body. Runes on the left page: six short raised bars in #8a2a1a.
4. Iron corners: four L-shaped corner caps (two small boxes each) in #4f545a, metalness 0.7, roughness 0.5. Ribbon: a wide band [0.03, 0.006, 0.36] hanging over the front edge of the right page, red #b83030.
5. Under 5,000 triangles.

Checks: `FORGE_WORKERS=2 ./forge render grimoire --fast`, look at out/grimoire/render.png; the front view must show a thick open book tilted toward the camera with a bright green sigil. At most two looks. Then `FORGE_WORKERS=2 ./forge all grimoire` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/grimoire.ts.
