# Avatar system specification

> Measure owns execution status. Track: [avatar_system_20261001](../measure/tracks/avatar_system_20261001/).
> Program plan: [chibi-quest-progression.md](chibi-quest-progression.md). Fit contract:
> [equipment-fit.md](equipment-fit.md). Color slots: [color-variants.md](color-variants.md).

Status: specification, 2026-10-01. Owner decisions: docs in this repo; Primary Advantage only;
rigid slots first; no real-time multiplayer.

## 1. Purpose

A student owns one avatar: a chibi humanoid on the shared hero rig, dressed in equipment pieces
from the forge catalog. The avatar appears on the profile page, in the shop, in every game, and
on the teacher screen during a Guild Mode battle. The same equipment source files serve the
display catalog and the avatar.

## 2. The parts of the system

| Part | Repo | What it is |
| --- | --- | --- |
| The avatar base | this repo, `assets/avatar-base.ts` | The full chibi body with skin, hair, eyes, and underclothes |
| Equipment pieces | this repo, `assets/*.ts` (170 in the catalog: 100 catalog items, 66 hero parts, 4 hair styles) | Each piece declares its slot, anchor, and fit |
| The equipment manifest | this repo, `docs/avatar-catalog.tsv` + generated `catalog.json` | Slot, tier, price, hides, dyes per piece |
| The avatar pack | this repo, `out/packs/avatar/<version>/` | Reduced GLBs, portrait layers, the catalog |
| The composer | this repo, `src/apk3d/avatar/` | Builds the rigged 3D avatar or the portrait from a loadout |
| The ledger, shop, inventory, loadout | monorepo | Tables, domain functions, API, and the avatar page |

## 3. The avatar base

A new asset, `avatar-base`, on the shared hero skeleton. The skeleton is identical in every hero
file today (hips at `[0, 0.2, 0]`, head at `[0, 0.48, -0.01]`, knees with `split`), so the base
copies it without change.

Built 2026-10-01: `assets/avatar-base.ts`. The skeleton, the head, the face paint, the arms, and
the fists are the rogue's without change, so every hero part fits as on a hero. The torso is the
hero torso of the chest-armor contract. `knife.R` and `knife.L` are the grip points in the fists
(the mainhand and offhand anchors); `cloak` is the back anchor.

Bodies in the base:

| Body | Content | Hidden by |
| --- | --- | --- |
| `skin` | head, neck, torso, arms, hands, legs, feet: one full body, face painted as in the rogue | never |
| `hair` | the default hair style | a hair style piece (it replaces the hair) or a head piece with `hides: ['hair']`; other head pieces cap it or keep it full (section 4) |
| `undershirt` | a plain tunic over the torso, hem at y 0.152 | a chest piece |
| `pants` | plain trousers to the ankle | never in phase 1 |
| `shoes` | plain shoes | a feet piece |

Color slots (`variants`, up to four): `skin`, `hair`, `eyes`, `cloth` (the underclothes). The
options fit the role rule: natural skin tones, natural and fantasy hair, eye colors. The 15 hero
classes become **presets**: a tint preset plus a starter loadout. The base has four tint presets
today (sunny, forest, night, frost); the class presets come with the starter sets.

Hair styles are pieces in their own slot, `hair`, with `hides: ['hair']` and no cost (slot base
price 0). They stay under a hat or a helmet (section 4, "Hair under head pieces"). The base ships with 4:
`swept` (the default, the rogue's fringe), `short`, `long`, and `ponytail`, from
`assets/parts/avatar-hair.ts`. Each style is also a standalone `assets/avatar-hair-<style>.ts`
and a catalog row with the price override 0.

Clips: the base carries every clip the games use (idle, walk, run, attack, hit, rest, cheer,
cast). Equipment pieces carry no clips.

## 4. Slots (rigid first)

Each slot takes one piece. A piece attaches to one bone with the inverse of its display scale.
The socket points and axes of each slot are in [equipment-parts.md](equipment-parts.md#avatar-sockets-and-the-equip-block).

| Slot | Anchor bone | Display scale | Phase 1 pieces (compliant by bounds) | Rework first |
| --- | --- | --- | --- | --- |
| `hair` | `head` | 1x | the 4 hair styles (free) | |
| `head` | `head` | 1x | none | iron-helmet, steel-helmet, horned-helmet, cloth-hood, leather-cap, crown, circlet |
| `chest` | `chest` | 2x, lift 0.152 after the 0.5 scale | plate-armor (fails on the avatar: arm cuffs), scale-armor, studded-leather | chainmail, leather-armor |
| `shoulders` | `upperarm.L`, `upperarm.R` (one pauldron, mirrored) | 2x | shoulder-armor | |
| `back` | `cloak` | 2x | cape (fails on the avatar), cloak, mantle (rigid to the cloak bone in phase 1) | |
| `hands` | `forearm.L`, `forearm.R` (a pair; the left piece, mirrored) | 2x | gauntlets, gloves, bracers (fails on the avatar: too thin) | |
| `waist` | `hips` | 2x | none | belt |
| `feet` | `shin.L`, `shin.R` (a pair; the left piece, mirrored) | 2x | boots (fails on the avatar: too thin), greaves | |
| `mainhand` | `knife.R` (the grip bone) | real size, hand fit 0.45x | all melee, magic, and ranged weapons | |
| `offhand` | `knife.L`; a shield on `hand.L` | real size, hand fit 0.45x | buckler, round-shield, kite-shield, tower-shield, tome, orb, lantern-handheld | |

Changes of 2026-10-01 (Phase 3): pauldrons attach to the upper arms (on the chest, a raised arm
goes through them); a shield attaches to the hand bone (a clip turns it with the wrist). The fit
check found four "compliant" pieces that do not fit the avatar (see `equipment-fit.md`).

Hair under head pieces (2026-10-04): hair styles moved from the `head` slot to a `hair` slot, so a
student keeps the chosen style under a hat. A head piece hides the hair (`hides: ['hair']`), caps it
(the default), or keeps it full (`fullHair: true`: circlet, crown, swashbuckler-bandana). The
capped form is a thin cap above a cap line from the brow to the nape and the style's low locks
below it; the composer shows the form that `forgeEquip.hair` names. Rules and the cap line:
[equipment-parts.md](equipment-parts.md#hair-under-head-pieces). Fit check of the 22 head pieces
that kept the hair (hair points over the piece): the 19 capped pieces went from 3,506 points to
295, and 10 of them to 0. Most of the rest are on inner surfaces: the back of wizard-hat (189) and
gladiator-helmet (40), and the cheek straps of the two spear-warden pieces (27 each). The renders
of wizard-hat, gladiator-helmet, knight-helm, spear-warden-helm, and leather-cap show no hair
through the piece. The 3 open pieces keep the full hair (17, 17, and 178 points, under the band or
the fringe).

Later phases: `robe` (cloth-robe, mage-robe: skinned to spine, chest, and legs), `skirt`,
`accessory` (necklace, amulet, pendant: the `neck` anchor), `tool` (a back-mounted lute, quiver).

Two-handed weapons (greatsword, great-axe, maul, halberd, pike, longbow, heavy-crossbow, staff)
fill both hand slots.

Hero parts (`<host>-<piece>`, see [equipment-parts.md](equipment-parts.md)) come from heroes on the
shared skeleton and the base head. They have the worn size, so they attach at 1x in every slot.
The shop view scales a hero part for display. The 17 head parts fit the base head with no rework.

## 5. The equipment declaration

Every equipment asset gains one `equip` block in `defineAsset` (built 2026-10-01: `src/equip.ts`).
The forge validates it against the fit contract at build time (slot, hold, fit scale, hides,
two-handed, display-only bodies) and writes the resolved block to the GLB root extras
(`forgeEquip`) and `stats.json`. The pack catalog takes it from there.

```ts
export default defineAsset({
  name: 'knight-helm',
  // ...
  equip: {
    slot: 'head',
    fitScale: 1,              // display size / fit size (default 1)
    origin: [0, -RIM_Y, 0],   // where the socket frame stands in the asset (the rest pose move)
    rotate: [0, 0, 0],        // how the socket frame is turned in the asset (the rest pose turn)
    hides: ['hair'],          // base bodies hidden while equipped
    twoHanded: false,         // weapons only
  },
});
```

The forge resolves the block into one bone-local transform for each bone (`attach`: bone,
position, quaternion, scale, and `half` for one piece of a pair). The composer only adds the piece
under the bone with that transform. The authoring rules and the socket table are in
[equipment-parts.md](equipment-parts.md#avatar-sockets-and-the-equip-block).

Fit checks (`forge check <name>` for an asset with an `equip` block, worn on `avatar-base`):

- No base skin or clothes show through the piece at more than 2% of its points (rest pose). This
  replaces the first plan of "fit bounds within 5%": display bounds include pauldrons, plumes, and
  brims, so a bounds rule fails good pieces and passes pieces that sit inside the body.
- The piece is no more than 2 cm from the base (no floating) and no more than 1 cm below the ground.
- A piece on an arm bone (weapons, shields, hand and shoulder pieces) never passes through the head
  in any base clip (the clip clearance check on the worn base). The base clips aim held items with
  the wrists, so every held piece uses the same clips.

## 6. The catalog

`docs/avatar-catalog.tsv` is the catalog table: hand-set `id, slot, tier, two_handed, status, override`,
and computed `triangles, rating, price` (see "GP price"). Dyes and class presets join later. `scripts/avatar-pack.ts` joins it with the `equip` blocks and the build outputs into
`catalog.json` with a `catalogVersion`. The monorepo stores item ids as text and the catalog
version on each loadout row. A piece with `status != ready` is not in the pack.

Owner decision, 2026-10-01: the catalog keeps every variant. No piece replaces another piece.
Players choose what they like, and the shop sorts by popularity (see "Shop order"). Every id is
unique. The 65 hero parts are rows next to the 100 catalog items. A hero part takes the slot,
tier, and two-handed value of the catalog item of the same kind and size (for example
`warrior-sword` is a greatsword: tier 3, two-handed). Headwear without a catalog kind uses the
material: cloth and leather are tier 1, and metal is tier 2.

Status values: `ready` (the `equip` block passes `forge check` on the avatar base and the worn
render reads well), `planned` (phase 1, needs its `equip` block or a check change), `later` (a
later-phase slot), `rework` (a fix before `ready`: the fit, or a shape defect in the display), and
`excluded`. On 2026-10-01, 120 pieces are `ready` and 16 are `rework` (the list and the reasons are
in [equipment-fit.md](equipment-fit.md#fit-on-the-avatar-base-2026-10-01)). The 4 hair styles stay
`planned` until the capped hair styles give them their own slot rule. The
9 hero parts with shape defects were fixed on 2026-10-01 and are `planned`: the three shields
show steel on the back, the fighter cap has a padded lining (`fighterCap({ lining: true })`, the
fighter keeps his hair), the bandana is a ring, the dragoon helm has smooth cheek guards, the
crest stands on the new `spear-warden-helm` part, the potion cork sits in the neck, and the whip
lies flat.

`archer-bow` and `ranger-bow` have the same shape in two colors. Both stay as separate items.

### GP price

The price comes from a formula, so a new piece needs a slot and a tier and nothing else.

```text
price = round5( slotBase x (1 + triangleBonus + ratingBonus) x tierMultiplier )
```

| Input | Source | Value |
| --- | --- | --- |
| `slotBase` | the slot | hair 0, hands 20, waist 20, feet 20, shoulders 30, back 30, accessory 30, tool 30, head 40, offhand 40, chest 50, robe 50, mainhand 50 |
| `triangleBonus` | `out/<id>/stats.json` | under 2,500: +0%; to 5,000: +10%; to 8,000: +20%; above: +30% (the cap) |
| `ratingBonus` | latest `review_score` in `bench/sonnet/log.tsv` | under 7 or unrated: +0%; 7 to 7.9: +10%; 8 or more: +20% |
| `tierMultiplier` | the `tier` column of the catalog, set by hand | tier 1: 1; tier 2: 2; tier 3: 4 |

- Tier also gates the level: tier 1 opens at level 1, tier 2 at level 5, tier 3 at level 10.
- The triangle count is a capped proxy for how rich the piece looks. It cannot raise a price by
  more than 30%, so a heavy display piece (shoulder-armor, 18,914 triangles) does not cost
  more than its tier allows.
- A missing rating is never a penalty. A piece reviewed under 7 is not in the catalog.
- The P0 or P1 priority and the source character are not inputs. The priority records build
  order, not quality or rarity. Equipment does not record a source character.
- The `override` column of `docs/avatar-catalog.tsv` replaces a computed price for one piece.
- `node --import tsx scripts/avatar-price.ts` fills `triangles`, `rating`, and `price`. With
  `--check` it exits 1 when the table is out of date. The code is `src/apk3d/avatar/price.ts`.
- Result on the 164 priced pieces (the 4 hair styles are free by override): tier 1 costs 20 to 70 GP, tier 2 costs 50 to 130 GP, and tier 3
  costs 175 to 280 GP. The slot bases and the tier list are placeholders until the median weekly
  GP per active Primary student is measured (see `chibi-quest-progression.md`).

Dyes are the piece's color presets (`presets` in the asset, baked as KHR material variants). A
dye is a separate purchase: `<id>:<preset>`.

Starter sets: one per hero class (15). A preset lists the tint preset and one piece per slot from
tier 1. A new student picks a class and receives its starter set for free.

### Shop order

The shop shows every piece that the student's level opens. The default order is popularity: the
number of `purchase` rows in `avatar_inventory` for the item in the last 30 days, over all
schools. The count needs no new table. A filter by slot narrows the list. Items with the same
count sort in a fixed random order for each student (the user id is the seed). The catalog sets
no order and no "best" pick.

At go-live every item is new and has zero purchases. So the first order is the random order of
each student. A fixed order (for example by tier or price) puts the same items first for every
student, and those items then become popular because of their position. The popularity order
takes over when purchases come in.

## 7. The avatar pack

`out/packs/avatar/<version>/` (the APK model pack format, section 7 of `apk3d-cartridge.md`):

| File | Content | Budget |
| --- | --- | --- |
| `catalog.json` | the joined catalog | |
| `base/avatar-base.glb` | the base with clips, the tint mask, and the slot table | under 2 MB |
| `pieces/<id>.glb` | the reduced piece (a second output pass: coarser `maxError`, 512 px atlas, KTX2) | under 400 KB |
| `portraits/base/<preset>.png`, `portraits/<id>.png` | portrait layers, see section 9 | under 40 KB each |

The reduced pass comes from the same asset file, never from an edited copy. The full-quality
GLBs stay the display catalog.

## 8. The 3D composer

`src/apk3d/avatar/compose.ts`:

```ts
composeAvatar(pack, loadout: { tints, pieces: Record<Slot, ItemRef> }): AvatarObject
```

1. Load the base GLB once per page; clone the skeleton per avatar.
2. Apply the tint preset through the tint mask (the existing recolor path).
3. For each piece: load the reduced GLB (cached by id), select the dye variant, scale by
   `1 / fitScale`, attach to the anchor bone with `offset` and `rotate`. A mirrored slot attaches
   the reflected copy to the `.R` bone.
4. Hide base bodies named in `hides`.
5. Return the object with the base's `AnimationMixer`. Rigid pieces follow their bones.

The teacher composite loads one base and up to 30 loadouts. Pieces are shared by id, so a class
of 30 with 6 slots loads at most the distinct pieces used, not 180 files.

## 9. Portrait layers

A portrait is a 512 x 512 PNG with alpha. The forge renders the base and every piece at one fixed
camera (front three-quarter, the sprite elevation) in the base's `idle` pose at frame 0. Every
render uses the same canvas frame, so layers align by drawing in slot order.

Draw order: `back`, `feet`, base `skin` + `pants` + `shoes`, `undershirt`, `chest`, `waist`,
`shoulders`, `hands`, `hair`, `head`, `offhand`, `mainhand`. `hides` removes a layer.

The client composes the portrait on a canvas from the loadout. This serves the phone HUD, the
dashboard, the profile page, the shop, and the class list. A base portrait exists per tint preset
(hair style is a head piece, so hair is a layer).

Known limit: a layer order fixed per slot is right for one camera. A piece that needs a different
order (a hood over hair and under a crown) uses two layers: `<id>.png` and `<id>.over.png`.

## 10. Data model (monorepo, Primary Advantage)

All tables are tenant-owned (`schoolId, userId`) like `studentRpgProfiles`. The existing emblem
tables stay untouched.

| Table | Columns | Rules |
| --- | --- | --- |
| `gp_ledger` | id, schoolId, userId, delta, reason (`xp`, `purchase`, `battle`, `welcome`, `admin`), sourceKey, createdAt | unique (schoolId, userId, sourceKey); balance = sum(delta); a purchase row is negative |
| `avatar_inventory` | id, schoolId, userId, itemId (text), dye (text, null), source (`starter`, `purchase`, `reward`), catalogVersion, acquiredAt | unique (schoolId, userId, itemId, dye) |
| `avatar_loadout` | schoolId, userId, slot, itemId, dye, updatedAt | primary key (schoolId, userId, slot); FK to the inventory row |
| `avatar_profile` | schoolId, userId, classPreset, tints jsonb, catalogVersion, updatedAt | primary key (schoolId, userId) |

Domain functions (in `packages/domain`): `grantGpForXp` (called inside the XP transaction),
`purchaseAvatarItem` (one transaction: check balance, insert inventory, insert the negative ledger
row), `setLoadout` (validates ownership, slot, and two-handed rules), `getAvatarState`
(browser-safe). Contracts in `packages/game-contracts/src/avatar.ts` (zod, strict).

API (Primary Advantage): `GET /api/v1/avatar`, `POST /api/v1/avatar/loadout`,
`POST /api/v1/avatar/purchase`, `GET /api/v1/avatar/catalog`, and for teachers
`GET /api/v1/classroom/:id/avatars`, `POST /api/v1/classroom/:id/avatars/:userId/reset`.

## 11. The avatar in games

The launch context gains `avatar: { catalogVersion, tints, pieces }`. A 3D game calls
`composeAvatar` for the player. A 2D game uses the portrait until layered sprites exist. A game
never fetches the avatar itself; the host passes it. Games that show a fixed hero today switch to
the avatar as their default and keep the fixed hero as the fallback when no avatar is set.

## 12. Acceptance criteria

- `avatar-base` builds with no warnings, has all listed clips, and passes `forge check`.
- Every phase 1 piece has an `equip` block, passes the fit check, and appears in the pack.
- The 10 fit-rework pieces meet the fit contract (the audit table in `equipment-fit.md` shows them
  compliant).
- `composeAvatar` shows the 15 starter sets with no piece intersecting the skin in idle, walk,
  and attack. Reviewed by renders.
- The portrait of each starter set composes from layers and matches the 3D render.
- The avatar pack is under 25 MB in total and the base under 2 MB.
- A teacher composite page with 30 random loadouts runs at 30 fps on a 2020 laptop.
- Monorepo: `pnpm test` and `pnpm typecheck` pass; the ledger, purchase, and loadout functions have
  tests for double-spend and ownership.

## 13. Work plan

Phase 1 (this repo, the track above):

1. `avatar-base`: body, tints, hair styles, clips, portrait camera.
2. The `equip` block in `defineAsset`, validation, GLB extras, `forge check` for equipment.
3. Fit rework: belt, iron-helmet, steel-helmet, chainmail, leather-armor, horned-helmet, cloth-hood,
   leather-cap, crown, circlet.
4. `equip` blocks on every phase 1 piece; `docs/avatar-catalog.tsv`.
5. The reduced output pass and `scripts/avatar-pack.ts`.
6. Portrait layers and the canvas composer.
7. `composeAvatar` and a review page (`avatar.html`) with the 15 starter sets and random loadouts.

Phase 2 (monorepo): tables, domain functions, API, the avatar page, the shop (popularity order), GP grants.

Phase 3: the avatar in Monster Encounters, then the other games. Phase 4: Guild Mode.

## 14. Open questions

- Whether hair styles need their own slot so a hood can hide hair but a crown keeps it. The
  `hides` list per piece covers this; confirm with the first crown render.
  Fit test 2026-10-01 (the base head and the `swept` hair under four hero head parts): the rogue
  hood fits; the knight helm and the dragoon helm show small spots of hair at the brim; the swept
  fringe comes through the front of the wizard hat. Answered 2026-10-04: hair styles have their own
  slot, `hair`, and each style has a capped form (section 4, "Hair under head pieces").
- Whether weapons need a `sheathed` attachment on the back for idle and walk.
- Whether the reduced pass uses KTX2 in the APK today. If not, 512 px PNG atlases first.
- Items added after go-live start with zero purchases and sort after the items that students
  bought. Decide after go-live whether they need a "new" shelf.
