# Equipment parts

Owner decisions of 2026-10-01 (track `asset_equipment_parts_20260930`): the equipment that a
character wears or holds becomes a shared part. One source gives the worn piece on the character
and a standalone item at the same size. Read [equipment-fit.md](equipment-fit.md) for the hero
base measurements.

## Files

| File | Content |
| --- | --- |
| `src/part.ts` | The types `Part`, `PartBody`, `PartTint`, and the helpers `addPart` and `mapTint`. |
| `assets/parts/<host>-<part>.ts` | The part module. It exports one function per part. The CLI does not list this folder as assets. |
| `assets/<host>-<part>.ts` | The standalone asset. It adds the part at rest on the ground. |
| `scripts/part-check.mjs` | The refactor check: mesh identity per body and the pixel difference. |

`<host>` is the character that first wore the part, for example `knight-helm`, `mage-wand`, and
`skeleton-knight-shield`. Existing catalog items (for example `iron-helmet`, `wand`, `kite-shield`)
keep their paths, names, and designs. A worn part becomes a new standalone asset next to them.
Owner decision, 2026-10-01: no part replaces a catalog item. Each part is also an avatar item in
`docs/avatar-catalog.tsv`. Players choose, and the shop sorts by popularity (`docs/avatar-system.md`).
A standalone can set a display option of its part (for example `fighterCap({ lining: true })`
fills the open frame); the host keeps the default, so the host mesh does not change. A standalone
can also show two parts together (`spear-warden-crest` shows the crest on `spear-warden-helm`).

## The part contract

1. A part function returns `{ name, bodies, regions?, sockets? }`. It does not call `k.body`.
2. Each body has the name that it had in the host. Games find nodes by name, so the names stay.
3. Each body has the host's material options without `bone`, plus a default `bone` (the bone that
   the host used).
4. The part has the exact worn size. A shop view scales it for display.
5. Each part has its own texture atlas when it builds as a standalone asset.
6. Colors: the function takes `tint: PartTint`. The part uses its own slot names. A host maps them
   with `mapTint(k, { partSlot: 'hostSlot' })` (unmapped names stay the same). The standalone asset
   declares `variants` with the part slot names and the host's options for that slot.
7. `regions` holds shapes that a host needs, for example `inside` (the space under a helm for
   hair). `sockets` holds points, for example a plume joint or a wand tip.
8. A part with no tint slot takes no `tint` argument.

## Local frames

| Class | Origin | Axes |
| --- | --- | --- |
| Head (helmets, hats, hoods) | the head center of the 1x hero base, (0, 0.675, 0) in the character frame | the character axes: +Y up, the face toward +Z |
| Hand-held (weapons, wands, tools) | the grip center in the fist | for new parts: the shaft along +Y, the business end up, the flat or the front toward +Z; an extracted part may keep the host's axes (see the recipe) |
| Shield | the center of the outline on the back plane (the handle) | the face toward +Z, the top toward +Y |
| Upright effect (a flame on a wand or a torch) | the center of the flame base | +Y up; the host keeps it upright |

The avatar sockets for each class (bone, offset, and rotation) come in phase 4 of the track.

## Extraction recipe (one character)

The rule: copy the shape code without changes, and wrap it with the inverse of the host's
placement. The host applies the placement again. The mesh stays the same, because the two
transforms cancel. Paint functions and noise still see the original coordinates.

1. Run `./forge render <host>` and `./forge sprites <host>`. Then run
   `node scripts/part-check.mjs save <host>`.
2. Find the bodies of the piece (`k.body` calls with `bone: 'head'`, `'hand.R'`, `'hand.L'`, a
   shield bone, and so on). Write down their names, options, and bones.
3. Create `assets/parts/<host>-<part>.ts`. Copy the constants, helpers, and shape code that the
   bodies use. Return the bodies in the host's order.
4. Use the case that matches the host code:
   - **Built in a local frame with a pose function** (`swordPose(bladeLocal)`, `bookPose(book)`):
     return the local shapes. The host keeps its pose function: `addPart(k, part, { pose: swordPose })`.
   - **Built in the character frame with no rotation** (a helm around the head): define
     `MOUNT` (for example the head center, rounded to 1/1024 m when it is not a short decimal) and
     return `s.at(-MOUNT)`. The host uses `{ pose: (s) => s.at(...MOUNT) }`.
   - **Built in the character frame along a tilted axis** (a wand or a hammer made with
     `along(t)`): prefer a translation only. Round the grip to 1/1024 m
     (`MOUNT = GRIP.map((v) => Math.round(v * 1024) / 1024)`), return `s.at(-MOUNT)`, and let the host
     use `{ pose: (s) => s.at(...MOUNT) }`. A translation by a multiple of 1/1024 m is exact in
     floating point, so the mesh stays the same. The part keeps the host's axes; the standalone
     asset turns it upright with `holdPose(GRIP, AXIS).local` (from `assets/parts/mage-wand.ts`).
     Example: `assets/parts/cleric-hammer.ts`. A rotation round trip (`holdPose` in the host, as on
     the mage wand) can re-mesh the body: it passed on the wand (0.29%) and failed on the cleric
     hammer (up to 2.8%).
   - **Painted after the pose** (`pose(s).paintFn(...)`, or a single combined `.at(x, y + d, z)`):
     the paint and the translation see the character frame, so a local shape with a host pose is not
     exact. Wrap the painted shape with a rounded-mount translation, or let the part function take
     the pose or the point as an argument and build the host expression inside
     (`assets/parts/witch-broom.ts`, `assets/parts/witch-potion.ts`).
   - **A value the host measures on its own body** (a face depth from `sdf.raycast`): the part takes
     it as a parameter, with the host's value as the default for the standalone
     (`assets/parts/apprentice-glasses.ts`). A frozen number does not follow a later face change.
   - Place a local-frame part with the exact expression that the old code used: if the host wrote
     `flame.at(...FLAME_AT)`, the host pose is `(s) => s.at(...FLAME_AT)`, not a rounded mount. A
     rounded mount moves the body by up to 0.5 mm and re-meshes it (the warlock flame: 1,437 to
     1,558 vertices).
5. A body that must stay upright when the piece turns (a flame), or that a clip moves on its own
   bone (the cleric's holy cross on `relic`), is a second part in the same module. The host places
   it where it was; the standalone adds it too, so the item looks complete.
6. A host body that mixes part shapes and other shapes (rivets and a belt buckle in one body)
   splits in two. The part gets a new body name `<part>-<name>` (for example `shield-studs`).
   Record the split in the track. The rest of the split body re-meshes, because its bounds and
   its sample grid move: the enchanter `gold` body (circlet, trims, cuffs) lost the staff knob and
   changed up to 1.08% of a view, only on the gold trims and a few edges. The orchestrator accepts
   such a change after a diff image.
7. Replace the host code with `addPart(k, part(...), { pose })`. Keep the host's own constants
   that its skeleton and clips use. Remove the host code that only the moved bodies used:
   `tsc --noEmit --noUnusedLocals` must print nothing for the host and its parts.
8. Write `assets/<host>-<part>.ts`: `addPart(k, part(...), { pose: rest, bones: null })`. The rest
   pose stands the piece on y = 0, the front toward +Z. Use the host's `detail` and `reference`,
   `texture: { size: 512 }`, and a design note with the size.
9. Run `./forge render <host>` and `./forge sprites <host>`. Then run
   `node scripts/part-check.mjs compare <host>`. It must end with `result PASS`.
10. Run `./forge render <host>-<part> --fast` and look at the render once.

## Tolerance

`part-check.mjs` passes when every baseline body still exists and each image has 0.5% changed
pixels or less (a channel differs by more than 16 of 255). It also lists each body whose vertices
moved more than 0.001 mm.

A translation round trip (`s.at(-MOUNT)` in the part, `s.at(...MOUNT)` in the host) gives the
same mesh. A rotation round trip (`holdPose`) can change a few vertices of that body, because the
floating-point error changes the mesher's samples. The image check catches a visible change.

A part that groups bodies that the host built apart (a cap and its leaves, added in two places)
changes the body order. The meshes stay identical, but the texture atlas moves, so the views can
change up to about 0.4% (druid 0.23%, dragoon 0.375%). That is within the tolerance.

## Pilot results (2026-10-01)

| Character | Parts | Meshes identical | Largest image change | Clip check |
| --- | --- | --- | --- | --- |
| knight | knight-helm (helm, helm-gold, feathers) | 23 of 23 | 0.000% | ok |
| mage | mage-wand (wand), mage-wand-flame (glow), mage-spellbook (book, book-gold) | 15 of 16 (the wand: 533 to 509 vertices) | 0.291% (front view) | ok |
| skeleton-knight | skeleton-knight-shield (kite-shield, shield-studs) | 19 of 20 (`studs` is now the buckle only) | 0.356% (front view) | ok |

The sprite sheets changed 0.006% or less. The four standalone assets (`knight-helm`, `mage-wand`,
`mage-spellbook`, `skeleton-knight-shield`) build with textures and sprites and no warnings.
The existing items `iron-helmet`, `wand`, `spellbook`, and `kite-shield` have other designs, so
they stay unchanged.
