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
| Helmets and hats | to set | the head ellipsoid | `head` |
| Boots and greaves | to set | shin from the knee to the foot | `shin.L` / `shin.R` |
| Gloves, bracers | to set | forearm from the elbow to the wrist | `forearm.L` / `forearm.R` |
| Belts | 2x | the waist ring r 0.124 | `hips` |
| Weapons and shields | 1x | the grip in the hand | `hand.L` / `hand.R` |

The chest contract numbers (the 2x torso profile) are in `bench/sonnet/briefs/torso-contract.md`.
Set the remaining "to set" scales before the first piece of that class is built, from the existing
P0 pieces (iron-helmet, boots) so the family stays consistent.
