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
wizard-staff, dragoon-lance, and captain-shield.

### Every phase 1 piece (2026-10-01)

138 assets have an `equip` block: every phase 1 row of `docs/avatar-catalog.tsv` except gloves and
gauntlets. 122 pass `forge check`. The 10 pieces of the audit above were resized to the contract
on 2026-09-29; on the avatar, circlet, crown, leather-cap, leather-armor (worn at 1x), and
cloth-hood pass and read well in the worn render. The catalog marks the passing pieces `ready`
and these 16 pieces `rework` (12 after the helmet and gauntlet fixes of 2026-10-02, and none after
the fit reworks of 2026-10-02 below):

| Piece | Finding on the avatar base |
| --- | --- |
| iron-helmet | The bowl reaches down to the chin, and the cheek guards cover the eyes. The brow band also makes a hidden ring inside the cavity (the shell of an open profile wraps its closing chord); worn, the ring is in the head. Fixed 2026-10-02 (`ready`): the cheek guards at 64 degrees, a short nasal, a cylinder cut on the band, and a crest. |
| horned-helmet | The same hidden ring in the cavity. The fit is otherwise good. Fixed 2026-10-02 (`ready`). |
| steel-helmet | It passes the check, but the face guard covers the eyes (render review). Fixed 2026-10-02 (`ready`): an open face below the brow band, as in the mock, and worn 2.7 cm higher. |
| belt | The shirt comes through the back of the belt (at the spine, up to 5.3 cm). |
| chainmail | The upper arms come through the shoulders (214 points). |
| plate-armor | The upper arms cut through the gold arm cuffs under the pauldrons (119 points). |
| bracers | Inside the forearm: the wrist radius at 1x is 0.025 m, and the base forearm is 0.032 m. |
| boots | Inside the shin and the foot: the shaft radius at 1x is 0.026 m. |
| greaves | Too tall: the tops go into the hips, and the shirt and the pants come through. |
| cape | The shirt comes through the cape, and the hem goes 3 cm below the ground. |
| cloak | It sits inside the body: the hips, the shirt, and the pants come through below the waist. |
| mantle | It sits inside the torso: only the hem trim shows. |
| guardian-shield | 0.70 m tall at fit scale 1: 14 cm below the ground at rest, and in the jaw in walk and run. It needs an avatar size. |
| enchanter-scroll | 0.64 m tall with the flame: 13 cm below the ground, and the sparks go into the head in run and cast. |
| gloves, gauntlets | No block: the base has fists, and the gauntlets model a right hand at +X (a pair keeps the +X half). They need a closed-fist shape. Gauntlets fixed 2026-10-02 (`ready`): a closed-fist pair, `hands` at fit scale 2; gloves remain. |

### Fit reworks (2026-10-02)

The 12 pieces of the table above that were still `rework` are now `ready`. Each piece ends `fit ok`
in `forge check`, and each review rating is 7.0 or more (the P1 bar). The briefs are
`bench/sonnet/briefs/<piece>-fit.md`. The log rows are in `bench/sonnet/log.tsv` (batch `avatar-fit`).

| Piece | Rating | Rework |
| --- | --- | --- |
| chainmail | 7.0 | Sleeves 37 degrees down and larger, so the upper arms stay inside; a wider and lower neck. |
| plate-armor | 7.3 | Taller and wider arm cuffs (radius 0.1, height 0.22); a wider neck hole. |
| belt | 7.0 | The band is the avatar torso at 2x; the ring is 10.5 cm up and the pouch is 1.8x, so the pouch hangs to the ground as in the mock. |
| boots | 7.0 | The foot, shaft, and cuff are built around the avatar foot and shin at 2x, grown 12 to 16 mm. |
| greaves | 7.0 | Built around the avatar shin and foot at 2x; the top stays below the shirt hem (worn y 0.15). |
| bracers | 7.0 | Built on the avatar forearm at 2x; an upright pair turned by `equip.rotate`; only the end rings are open. |
| gloves | 7.0 | The gauntlets recipe (the closed fist and forearm at 2x); the display stands the cuffs on the ground with the fists up (`equip.rotate`). |
| cape | 7.0 | One hollow bell (0.02 m) from a rolled collar; an arched front cut. Worn: a capelet over the chest and a long cape at the back. |
| cloak | 7.0 | A solid bell over the body with a cowl at the neck; a raised hood that only the display shows (`displayOnly`); the brooch below the chin. |
| mantle | 7.0 | A flared bell cape with a front slit; a fur collar that sits on the shoulders. |
| guardian-shield | 7.0 | Fit scale 2.2222 (0.31 m worn, as the captain shield); the origin is on the back plane. |
| enchanter-scroll | 7.0 | Fit scale 2.2222 and a 4 cm offset carry the scroll at the side. |

Rules that the reworks found:

- Build a worn piece from the avatar body that it covers: copy the avatar profile, scale it by the
  fit scale, and grow it outward (`round`). Do not scale an existing design until it fits.
- Keep the piece solid where it covers the body. The check counts avatar skin inside a closed hollow
  or bore of the piece as showing through (a full bore failed the bracers at 110 points). An
  opening on the outer surface (the arched front of the cape, the slit of the mantle) is allowed.
- A pair on a limb (bracers, gloves) stands upright in the display: turn it with `equip.rotate`,
  and the worn piece applies the inverse. Gloves with the cuff up read as clay pots in the sprites.
- A cloak shows its hood up only on the display: put the raised hood in `displayOnly` and give the
  worn piece a cowl.
- Place a clasp or brooch on the outer surface and below the chin. At the neck opening, the chibi
  head hides it.
- Stand the display on y = 0. When the model frame puts the hem above or below the ground, move
  every body and `equip.origin` by the same amount; the worn fit does not change. The mantle hung
  15 cm below the ground, the cape floated 11 cm above it, and plate-armor sank 5.2 cm.

The 4 hair styles stay `planned`. Three of them fail on the skin at the jaw, where the side locks
go into the cheeks as on the base hair. The capped hair task gives them their own slot rule.

Placement rules that the rollout found:

- Bows use the socket frame, the limbs forward and 20 degrees up. Held upright in the character
  frame, a longbow goes below the ground and into the head.
- The heavy crossbow, the whip, and the sling use the socket frame, so the attack clip sweeps them
  as it sweeps a sword.
- Books are carried at the side, the cover outward (`rotate: [0, -90, 0]`), 4 to 6 cm outside the
  fist. An orb and the crystal focus sit 3 to 4 cm outside and in front of the fist.
- The shield socket point is 2 cm farther outward and 2.6 cm lower than in the pilot, so the
  tower shield clears the jaw and the ground.

