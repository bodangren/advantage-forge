# scale-armor (equipment/armor/scale-armor) -> assets/scale-armor.ts

A scale armor shirt standing as on an invisible torso, 0.7 m tall, 0.55 m wide: a rounded torso shell of overlapping metal scales in rows, a leather collar band at the neck opening, two short capped sleeves, a leather belt with a buckle at the hem, and a hem row of scales. Stand the hem on y = 0, centered on Y, front toward +Z. No body, no head.

Mockup: bench/overnight/refs/p1-gear/scale-armor-mock.jpg (set `reference` to that path). Match its idea: a chunky chibi cuirass with big grey pauldrons on a red-and-gold chest; for this asset the chest is scale rows in bronze-green instead of the red cloth, and the gold swirl trim stays as a hem-and-collar accent.
Pattern file: assets/leather-armor.ts (a cuirass shell on an invisible torso; copy its torso shell revolve and the belt), and assets/samurai.ts for the `paintWhere` stencil trick that paints dark scale rows onto a shell. Read leather-armor.ts first.

Palette: scale bronze-green #6f7f5a with lit #8c9c74 and dark rows #4a5a3c (roughness 0.5, metalness 0.6); pauldrons iron #7c828a / #5b6068 (roughness 0.5, metalness 0.7); collar and belt leather #8a5a35 / #5c3a22 (roughness 0.65); trim gold #d4a93a (roughness 0.3, metalness 1).
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Torso: `sdf.revolve` of a profile: neck opening r 0.12 at y 0.68, chest r 0.26 at y 0.5, waist r 0.24 at y 0.25, hem r 0.27 at y 0; scale z by 0.75. This is the scale body.
2. Scales: paint 7 horizontal rows of scallops with `paintWhere`: each row is a set of extruded half-discs (profile.arc or small cylinders along z) 0.07 wide, offset by half a scale on alternate rows, painted in the dark row color so the overlap reads; plus a soft `.displace` (0.004, cosine of y at 7 rows) so the rows catch light. Big scales only, about 8 across the front.
3. Pauldrons: two fat rounded domes (ellipsoids 0.17 x 0.12 x 0.15, cut flat underneath) at the shoulders (x +-0.27, y 0.6) in iron, each with a small rivet sphere; smoothUnion 0.01 onto the torso.
4. Collar: a leather torus (R 0.13, r 0.03) at the neck opening; belt: a leather band (torso shell cut by a 0.06 box at y 0.12) with a gold buckle box 0.08 x 0.06 in front.
5. Trim: a thin gold band at the hem (torus R 0.27, r 0.015 scaled z 0.75) and a gold diamond emblem 0.08 tall on the chest.

Limits: whole asset under 7,000 triangles; `detail` 0.005, `textureDensity: 2` on the scale body. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/scale-armor.ts.
