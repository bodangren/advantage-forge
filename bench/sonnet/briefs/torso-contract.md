# Chest armor torso contract (2026-09-29, v2: exactly 2x the chibi hero torso)

Every chest piece (equipment/armor/*) that stands as on an invisible torso shares one shell so it can later sit on the hero rig (rogue/knight base). The shell is the hero torso revolve from assets/knight.ts scaled by 2 and moved so the hem is on y = 0 (hero hem y 0.152). A uniform 0.5 scale plus a 0.152 m lift puts a piece back on the rig.

Revolve profile (radius, y), then `.scale([1, 1, 0.78])`:

| point | r | y |
|---|---|---|
| neck opening | 0.14 | 0.636 |
| shoulder | 0.21 | 0.576 |
| upper chest | 0.25 | 0.496 |
| chest | 0.26 | 0.376 |
| waist | 0.248 | 0.276 |
| lower | 0.26 | 0.196 |
| hip flare | 0.276 | 0.096 |
| hem | 0.28 | 0.026 |
| bottom | 0.264 | 0.0 |

Result: shell 0.56 m wide (x), 0.64 m tall, 0.44 m deep (z). Hem on y = 0, centered on Y, front toward +Z. Hero shoulder joints scale to (+-0.26, 0.47, 0); neck joint to (0, 0.56).
Pauldrons, collars, skirts, and belts may extend past the shell; the shell itself does not change.

Pieces: leather-armor (P0, keeps its stand), chainmail, scale-armor, studded-leather, plate-armor; cloth-robe and mantle only need the shoulder width (0.52 at y 0.58) and the neck opening.
