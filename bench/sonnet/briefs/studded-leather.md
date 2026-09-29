# studded-leather (equipment/armor/studded-leather) -> assets/studded-leather.ts

A studded leather vest standing as on an invisible torso, 0.6 m tall, 0.5 m wide: two brown leather front panels with a narrow open gap between them showing a darker lining, a stand-up collar, rows of round brass studs on the panels, small shoulder guard caps, and side laces. Stand the hem on y = 0, centered on Y, front toward +Z. No body, no head.

Mockup: bench/overnight/refs/p1-gear/studded-leather-mock.jpg (set `reference` to that path). Match its idea and colors: an open vest with two rows of big brass studs per panel.
Pattern file: assets/leather-armor.ts (a leather vest shell on an invisible torso). Read it first and copy its shell and stitch treatment.

Palette: leather #a0623a with lit #b8784a and dark #6b4226 at the edges and lining; studs brass #d4a93a (roughness 0.3, metalness 1); laces #5c3a22; stitch lines #3a2414. Leather roughness 0.65.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features (big studs). One body per material.

Construction recipe:
1. Shell: `sdf.revolve` of a profile: neck r 0.11 at y 0.6, chest r 0.24 at y 0.45, waist r 0.21 at y 0.2, hem r 0.24 at y 0; scale z by 0.7; `.shell(0.03)` is not needed, keep it solid; the lining is a second body: the same revolve scaled 0.97 in dark leather.
2. Front opening: subtract a wedge box 0.06 wide (x) through the front from the collar to the hem from the outer leather body only, so the dark lining shows in the gap; round the cut edges with a small `.round`.
3. Collar: a short stand-up band (a torus R 0.12, r 0.04 scaled y 1.4) at y 0.6, leather.
4. Studs: two vertical rows of 4 brass spheres (r 0.022) on each front panel (at x +-0.06 and +-0.16), proud of the leather by 0.012; a third row of 3 on each side panel.
5. Shoulder caps: two small rounded leather domes (ellipsoid 0.1 x 0.05 x 0.09) at x +-0.22, y 0.55; side laces: a zigzag of thin `sdf.chain` in dark leather down each side at x +-0.24 from y 0.45 to y 0.1.
6. Stitch lines: `paintWhere` dashed thin strips along the panel edges and the hem.

Limits: whole asset under 6,000 triangles; `detail` 0.005, `textureDensity: 2` on the leather. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/studded-leather.ts.
