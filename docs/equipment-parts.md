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

The avatar sockets for each class are in "Avatar sockets and the equip block" below.

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

## Avatar sockets and the equip block

Track `avatar_system_20261001`, Phase 3 (2026-10-01). An equipment asset declares one `equip`
block. The forge validates the block when the asset builds and writes the resolved block to the
GLB root extras (`forgeEquip`) and to `stats.json`. The code is `src/equip.ts`.

```ts
equip: {
  slot: 'head',           // head, chest, shoulders, back, hands, waist, feet, mainhand, offhand
  hold: 'shield',         // offhand only: a shield on the hand; default 'grip' (in the fist)
  fitScale: 2,            // display size / worn size: 1 (hero parts), 2 (2x catalog armor), HAND_FIT (catalog weapons, 1 / 0.45)
  frame: 'body',          // hand slots: keep the character axes at the socket point (default 'socket')
  origin: [0, LIFT, 0],   // where the socket frame stands in the asset (display meters)
  rotate: [-20, 0, 0],    // how the socket frame is turned in the asset (degrees, X then Y then Z)
  offset: [0, 0.01, 0],   // a small shift in worn meters, in the socket frame
  hides: ['hair'],        // base bodies hidden while worn: hair (head), undershirt (chest), shoes (feet)
  displayOnly: ['stand'], // bodies that only the display shows
  twoHanded: true,        // mainhand only
},
```

For the standalone of a part, `origin` and `rotate` are the move and the turn of its rest pose:
`addPart(k, part, { pose: (s) => s.rotateX(-20).at(0, LIFT, 0) })` gives `origin: [0, LIFT, 0]`
and `rotate: [-20, 0, 0]`. A hand-held standalone that stands upright, with the business end up and
the flat toward +Z, needs only the height of its grip center: `origin: [0, GRIP_Y, 0]`.

Rules for held items:

- A shield has the center of its back plane at the origin and its face toward +Z.
- A bow uses the socket frame: the grip at the origin, the limbs along +Y. Held, the limbs point
  forward and 20 degrees up, and the bow plane is upright. A bow that curves toward +Z (the stave
  in the YZ plane) needs `rotate: [0, -90, 0]`.
- `frame: 'body'` keeps the character axes of the asset at the socket point. Use it for an item
  that the hand holds level and the clips must not tip: a crossbow, a book, an orb, a lantern, a
  sling. The socket turn does not apply; `rotate` still undoes the turn of the rest pose.
- A worn piece meshes at its display `detail` divided by the fit scale, but never finer than 3 mm
  or than 1/380 of its largest worn size. A tall catalog shield at `HAND_FIT` stays within the
  grid limit for this reason.

### Sockets

All points are in the character frame of the avatar base in the rest pose. Rest bones have no
rotation, so the socket axes are the character axes unless the table gives a turn.

| Socket | Slot | Bone | Socket point | Socket axes | Mirror |
| --- | --- | --- | --- | --- | --- |
| `head` | head | `head` | (0, 0.675, 0), the head center | character axes | none |
| `chest` | chest | `chest` | (0, 0.152, 0), the hem center of the torso | character axes | none |
| `shoulders` | shoulders | `upperarm.L` | (0.13, 0.385, 0), the left shoulder joint | character axes | a copy on `upperarm.R` |
| `back` | back | `cloak` | (0, 0.47, 0), the center of the torso neck opening | character axes | none |
| `hands` | hands | `forearm.L` | (0.205, 0.238, 0.03), the left wrist | character axes | the +X half, mirrored onto `forearm.R` |
| `waist` | waist | `hips` | (0, 0.29, 0), the center of the waist ring | character axes | none |
| `feet` | feet | `shin.L` | (0.098, 0.07, 0), the left ankle | character axes | the +X half, mirrored onto `shin.R` |
| `grip.R` | mainhand | `knife.R` | (-0.232, 0.172, 0.022), the grip center in the right fist | the business end (+Y) forward and 20 degrees up; the flat (+Z) outward | none |
| `grip.L` | offhand | `knife.L` | (0.232, 0.172, 0.022) | the mirror of `grip.R` | none |
| `shield` | offhand, `hold: 'shield'` | `hand.L` | (0.262, 0.25, 0.075), in front of and outside the left fist | the hero shield turn (Z -4, X 4, Y 38): the face forward and outward | none |

- The fit scales that the contract allows: head 1; chest, shoulders, back, hands, waist, and feet 2
  or 1; mainhand and offhand 1 or `HAND_FIT` (1 / 0.45).
- A pair (boots, gloves, bracers) shows both pieces. `origin` and `rotate` describe the piece at
  +X (the left one). The worn piece keeps the +X half of the asset (x >= 0 in the asset frame) on the
  left bone and its mirror on the right bone (`half: '+x'`, scale x negative in `forgeEquip`).
- The shield socket is on the hand bone, so that a clip can turn the shield with the wrist. The
  socket point is low and outside the fist: a 0.47 m shield (the tower shield at `HAND_FIT`) clears
  the ground by 1.5 cm and the jaw by 3 cm.

### Rigid and skinned parts

- Phase 1 is rigid. Every worn piece binds rigidly to its socket bone. A composer adds the piece
  under the bone with the bone-local transform in `forgeEquip.attach` (`position`, `quaternion`,
  `scale`) and hides the base bodies in `hides`.
- A skinned piece (robe, skirt, a cape that bends) comes later. It will take the skin weights of the
  base body under it, from the `.bone()` tags, in place of one bone.
- The base clips turn the wrists with `motion.orient`, so a held item keeps a safe direction: it
  keeps its rest direction in idle, walk, run, hit, rest, and the shield arm of the attack, sweeps
  flat in the attack, rises up and outward with its flat outward in cheer, and points ahead in
  cast. A held piece needs no clip of its own.

### Fit check

`./forge check <piece>` wears the piece on `avatar-base` in the rest pose (code: `src/equip-check.ts`):

| Rule | Fails when |
| --- | --- |
| Shows through | a base body (skin or clothes) is outside the piece's outer surface at more than 2% of the piece's points. Hair is reported only, until the capped hair styles exist. The report names the base bone and the mean point. |
| Gap | the piece is more than 2 cm from every base body (it floats) |
| Floor | the lowest worn point is more than 1 cm below the ground |
| Clips | a piece on an arm bone passes through the head in a base clip (the clip clearance check) |

The skin of the holding hand does not count for a grip, and the skin of the hand and the forearm
does not count for a shield. The 2% limit comes from renders of 2026-10-01: a hood edge in the
shirt collar, pauldrons over the sleeves, and the knight helm cheek guards in the jaw read well at
about 1.2%; the arm cuffs of the plate armor that the arms cut (3.6%) do not.

`./forge render avatar-base --wear <piece>,<piece> --fast` renders the base in the pieces (also
`animate`, `sprites`, and `all`). The outputs go to `out/avatar-base+<piece>+<piece>/`.

