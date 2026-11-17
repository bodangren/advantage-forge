# Brief: storytime-cat

Track: asset_chibi_sprouts_r1_20261022, Phase 5, props task, group 3 rework 2.
Date of the brief: 2026-11-18. The brief came from the PM order of 2026-11-18, after the fit check
in `measure/runs/asset_chibi_sprouts_r1_20261022/maker-p5-group3-fit.log` and the open question in
`maker-p5-group3-rw1.log`.
No track file held the brief before this file.

## The brief as given to the maker (2026-11-18)

Item 1 of group 3 rework 2: "assets/storytime-cat.ts (name 'storytime-cat'), a new file. Book:
'cat: gray; W6 sits on a wooden fence, mouth wide open; in meadow'."

- Build it like `assets/cat.ts` (the cat kind), with the fur default grey `#9a9a9e` as the FIRST
  option of `fur` (so no recolour is needed), markings white `#fff6ec`, eyes amber `#d89a20`; no
  presets.
- Mouth wide open (singing). Path A if the wolf kind that the cat kind wraps already has an
  open-mouth option, or a jaw bone with a clip that opens the mouth. Path B only if A is not
  possible: add an opt-in `openMouth?: boolean` option (default off) to
  `assets/parts/cat-kind.ts`, and keep every other user of the kind unchanged.
- Sitting on a fence: if the cat has a `sit` clip, name it in the brief; do not add a clip.

## Path taken: B

Path A is not possible for the ordered look:

- The wolf kind has no open-mouth rest option. Its option is the wide `smile` grin or the tiny
  `smileArc` line; the cat kind uses the tiny line.
- The wolf kind has a jaw bone and two clips that open it (`howl`, `attack`). Neither is an
  opt-in clip that holds the mouth open at rest. No clip named `sing` exists, and the camera work
  needs one pose per frame: a clip cannot run together with `sit`, so the cat could not both sit
  on the fence and sing.
- The order says "do not add a clip", so Path A had no form left.

Path B is taken: `openMouth?: boolean` on the cat kind, default off. It adds one body, a shell of
the head surface 2 mm above the cream muzzle, cut to the oval and painted `#4a2224` with the
tongue `#e88a9a` on its lower third. The shell covers the tiny closed smile line. The rest of the
kind is untouched: `smileArc` and the jaw cut stay as they were.

The kind invariant is proven: after the change, `mech-check cat` and `mech-check familiar-cat`
rebuilt both, and each GLB is byte-identical to the baseline of this round (cat
`e9e7c6db…3930ebb`, familiar-cat `a5e4a19e…b6e00eba`; triangles and bounds equal too).

## Common rules for the prop set

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Use one body per material. The first
prop batch asked for under 8,000 triangles (see Known differences).

## Sources

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a grey cat, week 6 | Inventory section 5, `forge-inventory.md` at 9255c2711: W6 "sits on a wooden fence, mouth wide open; in meadow" |
| Fur | grey `#9a9a9e`, the first `fur` option | Book line "gray"; the hex is the cat kind's grey slot (PM default, checked against the book: no colour value exists in the book) |
| Markings | white `#fff6ec` for the muzzle, chest, and paws | PM default; the fit check names white where the `grey` preset painted cyan and teal. The fit check's cat row is the Red contract |
| Eyes | amber `#d89a20` | PM default; the cat kind's amber slot |
| Stripes | the cat kind's tabby stripes, in darker grey `#6e6e74` | PM default; the book fixes grey and no stripe colour, so the bands stay grey instead of the source rust `#b85a20` |
| Mouth | the open oval, 0.22 x 0.16 of the 0.2 m head radius, colour `#4a2224`, tongue `#e88a9a` | Book line W6 "mouth wide open"; the size, colour, and tongue are PM defaults from the order (Path B) |
| Nose, ear insides | pink `#e88a8a` / `#f0a8a8`, unchanged from the kind | PM default |
| Shape, size, clips | `assets/cat.ts` and the cat kind at 0.6 of the wolf | The PM order: build it like the cat |
| Sit | the `sit` clip of the kind (the stage uses it) | Book line W6 "sits on a wooden fence"; the order names the existing clip |
| Look | one fixed grey look; no presets | The book gives one colour; the order keeps the presets out |

## The built asset

- File `assets/storytime-cat.ts`; the cat kind of `assets/parts/cat-kind.ts` (the wolf kind at 0.6
  scale). The same body options as `assets/cat.ts`: `headScale 1.4`, `muzzleWidth 0.75`,
  `lashes: true`, `sit: true`.
- Slots: `fur` grey first (then orange, brown, cream), `markings` white first, `eyes` amber first.
  No presets, so the default look needs no recolour.
- `openMouth: true`: the wide open mouth at rest, visible in the front and three-quarter cutouts.
- The rest pose stands. The `sit` clip holds the sitting pose on the haunches for the fence.
- Size 0.344 x 0.557 x 0.544 m, lowest point y = -0.003 m as the source cat. Faces +Z.
- 28,138 triangles in the textured build (41,080 with vertex colours only), 1024 x 1024 atlas,
  GLB 3,935,876 bytes. Clips: walk, run, sit, idle, attack, hit, death, howl.
- Cutout: `out/chibi-sprouts/r1/props/storytime-cat/{front,three-quarter}.png` at 1024 px/m; the
  front is 1024x1024, soft 2080, edge 1811, worstDrop 88 %, rows 433..1011, cols 330..693. Card:
  `out/prop-cards/storytime-cat.png`.

## Known differences

- The reference image is the orange tabby `docs/wildlife-mockups/cat_001.jpg` of the source cat.
  The body plan is the same; the colour differs on purpose, because the book fixes grey.
- The open mouth is small: 26 x 19 mm after the 0.6 scale, the ordered 0.22 x 0.16 of the head
  radius. In the front cutout it reads as a dark oval with the pink tongue; it does not reach the
  cheeks.
- The mouth is one body rigid on the `head` bone. The jaw keeps its own geometry and clips, so in
  `howl` and `attack` the jaw opens below the painted mouth.
- 28,138 triangles, not under the 8,000 of the first prop batch. The count comes from the cat body
  plan (the source cat holds 27,556), and the order copies the cat.
- The stripes stay in the order's "build it like cat.ts" sense, but in darker grey (see Sources).
