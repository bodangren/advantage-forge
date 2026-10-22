# Specification: Chibi Sprouts, release 1 art

## Source and decisions

- Brief: Storytime track `storytime_advantage_program_20261021`, `forge-brief.md` v1 (monorepo
  `d70d52718` on `primary-parity-integration`), and the Storytime answers of 2026-10-22.
- Owner decisions (approval page, 2026-10-22 04:38 Bangkok, `~/Desktop/storytime-approval/`):
  S18 pass: Chibi Sprouts goes first in Forge, the cost is accepted (one character builder at a
  time, an independent reviewer for each batch), and the release 1 cast is 5. S19 pass: Workbooks
  makes the book covers; Forge supplies transparent renders of the cast and the scenes only.
- Workbooks renders and edits the song videos in a 2D compositor. Forge delivers assets only.
- Art is due 2026-11-15. Storytime Advantage releases on 2026-12-01.

## Changes after the start (2026-10-22, from Storytime)

These changes replace the items, the frame sequence format, and the order below where they differ.

- Delivery folder: `out/chibi-sprouts/r1/` in Forge. Workbooks reads it and copies what it uses.
  Forge never writes into the Workbooks repo.
- Render-only delivery (inventory section 0, decision with Daniel): the videos are cut-out
  animation by the Workbooks compositor. Forge delivers transparent PNG renders and no animation
  clips or frame sequences. Source: `forge-inventory.md` (monorepo `9255c2711`).
- Cast: the Pip-world cast drawn at age 5, with one design for each name in all weeks: Pip, Nan,
  Pat, May, Sam, Mia, Ben, Lily, Mom, Dad, Grandma, Grandpa, and Tom (about eight). Their looks are
  in the Workbooks cast sheet `~/Desktop/Workbooks/docs/content-plans/character-sheets/cast.json`
  (the sheet ages differ, but the songs draw the children at about five). One Sprout, the
  Adventurer, does the gestures in an inset. The inventory does not use the Wizard, the Druid, or
  the Knight.
- Pip follows the series bible: golden-brown fur, cream chest and muzzle, a cream forehead stripe,
  floppy ears with darker tips, and a red collar with a small round gold tag. The workbook story
  picture is not the reference.
- Gesture key frames: a moving gesture has 2 key frames, a hold has 1, and a whole-body gesture
  has 1. 20 gestures are in use (inventory section 3).
- Scenes and props: inventory sections 4 and 5 (30 props and animals, with the colour and state
  that each prompt fixes). Week 7 is provisional.
- No letters, words, or numbers in any render.
- Order: the owner asked for one test music video first, week 1 "Hello, I Am Pip", and then a look
  check before the rest. The week 1 set has about 20 renders:
  - Pip, front and three-quarter;
  - Nan, Pat, May, Sam, Mia, and Ben at age 5;
  - the Adventurer Sprout in six gestures: clap (apart, together), wave (left, right), nod (up,
    down), point to self, point forward, hands out, and one idle pose;
  - the classroom scene and a rug.
- Week 1 format (Workbooks compositor):
  1. Cast: one full-body PNG each, front or three-quarter, straight alpha, all at one scale (the
     children the same pixel height, Pip in proportion), at least 900 px tall, feet on the bottom
     edge or the foot point in the manifest.
  2. Gesture frames: one canvas size, feet at the same point, unmirrored.
  3. Classroom: 1920 x 1080, opaque, no people; the rug in it or as a separate PNG; the floor
     area for the feet at about y 700 to 850.
  4. A JSON manifest: cast name to file, gesture to frames, scene id to file.
- Cost note: S18 approved a cast of at most 8. The week 1 set has 8 characters (Pip, Nan, five
  classmates, the Adventurer). The full inventory has 13 and the Sprout. The owner must confirm
  the larger cast after the look check. The children are variants of one age-5 base (hair,
  clothes, colours), so each costs less than a full hero build.

## Art rules

- Chibi Sprouts is the kindergarten sibling of Chibi Quest: the same chibi style and the same
  world (home village and meadow). The sources stay in the Chibi Quest pack (`assets/`), because
  `packs/` (`docs/pack-layout.md`, stage 1) does not exist yet.
- No combat, no defeat state, no weapon, no enemy, no injury. Rated G.
- Each Sprout is the Chibi Quest hero at age 5. It keeps the hero's colours, hair, and one
  non-combat signature item, and it wears plain clothes from the humanoid kind (undershirt, pants,
  shoes). The adventurer has a lantern or a map and no sword, the wizard has the wizard hat, the
  druid has the leaf cap, and the knight has a crest tabard and no helmet. One colour preset for
  each Sprout. Faces are race-unmarked.
- Pip matches the Pip of the Primary workbook story "Pip the Curious Puppy Feels" (Origins 2,
  lesson 1): a tan puppy with a white face blaze and a red collar with a gold tag. The reference
  pictures are `tests/fixtures/stories/pip-the-curious-puppy-feels/img-{1,2,3}.webp`.

## Items

| Item | Ids | Deliverable |
| --- | --- | --- |
| Age-5 base | `sprout-base` | The humanoid kind at age-5 proportions (larger head, shorter limbs), with the same bone, clip, and socket names. |
| Cast (5) | `sprout-adventurer`, `sprout-wizard`, `sprout-druid`, `sprout-knight`, `sprout-pip` | GLB; transparent PNG renders front, three-quarter, side at 2048 px. |
| Gestures (24 + idle) | slugs of brief section 3 in table order (`clap` ... `bow`), plus `idle` | One 2 s loop each on the base skeleton, in each humanoid Sprout. A frame sequence for each Sprout and each gesture; one key frame PNG at 1024 px. |
| Pip clips (6) | `idle`, `wag`, `sit`, `run`, `jump`, `bark` | Frame sequences with the same rules. |
| Scenes (8) | village gate, apple orchard, paint barn, cottage porch, mirror pond, pet meadow, toy shed, class garden | One 1920 x 1080 background each, with no people. |
| Props | 19 reused after a fit check, 15 new (name tag, star, acorn, flower, paint pot with 4 colour presets, brush, easel, photo frame, scarf, fish bowl, pet bed, ball, toy box, doll, kite) | One transparent render each at 1024 px. Storytime cuts props after the lyric sheets. |
| Cover support | the cast and the scenes | Transparent renders only. No layout, no text. |

## Frame sequence format (Workbooks rules, confirmed 2026-10-22)

1. RGBA PNG with straight alpha and soft edges. The edges have no matte and no halo.
2. One 1024 x 1024 canvas for every frame of every Sprout and Pip, at one scale (pixels per
   meter), with the ground point at one fixed pixel. A delivery file gives `baseline_row` and
   `centre_col` as plain numbers. In hop, jump, and stretch-up, the feet leave the baseline.
3. 12 frames a second, 24 frames (2 s). A loop joins: frame 24 leads into frame 1. Gestures start
   and end in the idle stance.
4. Names: `<id>/<slug>/0001.png` to `0024.png`.

## Tool changes

- The sprite pass makes binary alpha today (`src/render/pixel.ts`, `downsample`). Add a soft-edge
  option with straight alpha, which keeps the binary default for game sprites.
- The sprite tool keeps one scale and one ground point only inside one asset. A placement step
  puts every frame on the shared canvas at a fixed pixels-per-meter value and writes the delivery
  file.

## Acceptance

- The base and each Sprout pass an independent review at the character bar (7.5), with clips
  checked for sinking feet and self-intersection.
- The skeleton contract test passes: the age-5 base exports the same bone, clip, and socket names
  as the chibi base. Existing assets on the humanoid kind build to the same meshes as before.
- Every frame sequence follows the format rules. A check script verifies the canvas size, the
  alpha, the baseline, the frame count, and the names.
- The delivery is complete by 2026-11-15.
