# Equipment fit contract

Owner decision, 2026-09-29: every equipment piece must fit the basic chibi humanoid (the rogue and
knight base), so the same source can later dress a player avatar. A display piece is the fit
shape scaled up by one stated factor, with its anchor recorded, so the avatar system can apply
the inverse scale and the anchor offset. No equipment piece is a free-standing display shape.

## The hero base (1x, from assets/knight.ts and assets/rogue.ts)

Height about 1.0 m, standing on y = 0, facing +Z, +X is the character's left.

| Part | Measure (m) |
|---|---|
| Head | ellipsoid radii 0.205 x 0.2 x 0.19, center y 0.675 (crown y 0.875, chin y 0.475) |
| Eyes | x +-0.105, y 0.628 |
| Torso | revolve, hem y 0.152 to neck y 0.47; neck r 0.07, chest r 0.13 (y 0.34), waist r 0.124 (y 0.29), hip flare r 0.14 (y 0.165); z scale 0.78 |
| Shoulder joint | (+-0.13, 0.385, 0) |
| Elbow | (+-0.175, 0.335, 0); forearm to the wrist (+-0.2, 0.29, 0.085) |
| Hip joint | (+-0.068, 0.195, 0) |
| Knee | (+-0.083, 0.1325, 0); ankle (+-0.098, 0.07, 0) |
| Foot | heel (0.096, 0, -0.008) to toe (0.117, 0, 0.09) |

## Display scale and anchors

| Class | Display scale | Fit shape | Anchor on the rig |
|---|---|---|---|
| Chest armor (leather, chainmail, scale, studded, plate) | 2x | the torso revolve; hem on y = 0 | `chest`, lift 0.152 m after the 0.5 scale |
| Robes and mantles | 2x | shoulder width 0.52, neck opening r 0.14 at y 0.636 | `chest` |
| Helmets, hoods, caps, crowns, circlets | 1x (fit = display) | the head ellipsoid + 0.01 m clearance: inner radii 0.215 x 0.21 x 0.20; outer about 0.43 x 0.42 x 0.40 | `head` |
| Boots and greaves | 2x | shin from the knee (y 0.1325) to the foot; foot 0.1 m long | `shin.L` / `shin.R` |
| Gloves, gauntlets, bracers | 2x | forearm from the elbow to the wrist (0.09 m) | `forearm.L` / `forearm.R` |
| Belts | 2x | the waist ring r 0.124, z scale 0.78: 0.50 wide x 0.39 deep at 2x | `hips` |
| Weapons and shields | real-world size; hand fit 0.45x | the grip in the hand | `hand.L` / `hand.R` |

The chest contract numbers (the 2x torso profile) are in `bench/sonnet/briefs/torso-contract.md`.
Accessories (rings, amulets, pouches, lanterns) are shop icons at 4x to 6x with no body fit; the
necklace and amulet take the `neck` anchor later.

## Audit of the existing equipment (2026-09-29)

Measured from `out/<name>/stats.json` bounds against the hero base.

| Class | Compliant | Rework |
|---|---|---|
| Chest | plate-armor, scale-armor, studded-leather (contract v2); cloth-robe, mage-robe, cape, cloak, mantle at 2x | chainmail (depth 0.27, 1.2x: too flat); leather-armor (P0; shell 0.50 x 0.42 x 0.22: 1.8x / 1.3x / 1x) |
| Head | none at the 1x fit | iron-helmet (P0) and steel-helmet 0.9x (0.37 wide); horned-helmet 0.9x; cloth-hood 0.8x; leather-cap and crown 0.6x; circlet 0.5x |
| Arms | gauntlets, gloves, bracers (2x) | none |
| Legs | boots, greaves (2x) | none |
| Belt | none | belt (0.38 x 0.46: rotated 90 degrees; target 0.50 x 0.39) |
| Shoulders | shoulder-armor (2x) | none |
| Weapons, shields | all (real-world size family) | none |
| Accessories | out of scope | none |

Rework order: belt, iron-helmet, steel-helmet, chainmail, leather-armor, horned-helmet, cloth-hood,
leather-cap, crown, circlet.

## Fit on the avatar base (2026-10-01)

The audit above measures display bounds only. The `equip` block and the fit check
(`forge check <piece>`, sockets in [equipment-parts.md](equipment-parts.md#avatar-sockets-and-the-equip-block))
wear each piece on `avatar-base`. The first pilot found four pieces of the "compliant" rows that do
not fit:

| Piece | Finding on the avatar base |
| --- | --- |
| plate-armor | The upper arms cut through the gold arm cuffs under the pauldrons (skin shows through at 3.6% of the points). |
| bracers | Inside the forearm: the wrist radius at 1x is 0.025 m, and the base forearm is 0.032 m. |
| boots | Inside the shin and the foot: the shaft radius at 1x is 0.026 m. |
| cape | The shirt comes through the cape, the cape hangs in front of the legs, and the hem goes 3 cm below the ground. |

These pilot pieces pass: knight-helm, rogue-hood, shoulder-armor, fighter-sword, warrior-sword,
wizard-staff, dragoon-lance, and captain-shield. guardian-shield (a tower shield) touches the head
at rest; it needs its own `offset` and `rotate`, as the guardian holds it far out.

