# plate-armor (equipment/armor/plate-armor) -> assets/plate-armor.ts

A steel breastplate standing as on an invisible torso, 0.6 m tall, 0.6 m wide: a rounded grey chest plate with a vertical center ridge and a gold diamond boss, two rounded pauldrons with gold edge trim and a gold rivet, short arm cuffs with gold rings, a gold-trimmed neck opening, a faulds skirt of three overlapping plates with a gold diamond, and a dark leather belt line. Stand the hem on y = 0, centered on Y, front toward +Z. No body, no head.

Mockup: bench/overnight/refs/p1-gear/plate-armor-mock.jpg (set `reference` to that path). Match its idea and colors closely: matte grey steel with fat gold piping.
Pattern file: assets/leather-armor.ts (a cuirass shell on an invisible torso; copy the torso shell revolve) and assets/samurai.ts for pauldron shapes. Read leather-armor.ts first.

Palette: steel #8d9096 with lit #a8acb1 and dark #5f6369 (roughness 0.45, metalness 0.75); gold #d4a93a (roughness 0.3, metalness 1); belt leather #5c3a22 (roughness 0.65).
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Chest plate: `sdf.revolve` of a profile: neck r 0.13 at y 0.6, chest r 0.27 at y 0.45, waist r 0.23 at y 0.22, ending at y 0.2; scale z by 0.75; a vertical ridge: a thin rounded box 0.03 x 0.25 x 0.05 on the front center at y 0.45, smoothUnion 0.01; two small gold sphere rivets at x +-0.12, y 0.32, and a gold diamond boss (a rotated rounded box 0.08) at y 0.36.
2. Neck trim: a fat gold torus (R 0.14, r 0.025, scale z 0.75) at y 0.6.
3. Pauldrons: two domed ellipsoids (0.18 x 0.13 x 0.16), cut flat underneath, at x +-0.3, y 0.55, with a gold rim: a torus (R 0.15, r 0.02) tilted to sit along the dome's outer edge, and a gold rivet sphere on top; each pauldron has a short cuff below it: a steel cylinder r 0.1, 0.1 tall at y 0.42 with a gold ring torus at its bottom edge.
4. Faulds: three stacked steel bands (torus sections or revolve rings) from y 0.2 down to y 0, each wider than the one above (r 0.25, 0.27, 0.29, scale z 0.75, 0.08 tall), the lowest with a gold rim and a gold diamond in front; a dark leather belt band 0.05 tall at y 0.2 between the chest and the faulds.

Limits: whole asset under 7,000 triangles; `detail` 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/plate-armor.ts.
