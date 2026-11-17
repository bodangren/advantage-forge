# Brief: storytime-bird

Track: asset_chibi_sprouts_r1_20261022, Phase 5, props task, group 3 rework 1.
Date of the brief: 2026-11-18. The brief came from the PM order of 2026-11-18, after the fit check
in `measure/runs/asset_chibi_sprouts_r1_20261022/maker-p5-group3-fit.log`.
No track file held the brief before this file.

## The brief as given to the maker (2026-11-18)

Item 1 of group 3 rework 1: "assets/storytime-bird.ts (name 'storytime-bird'), a new file. Book:
'bird: blue in both weeks (one render; W2 four in a row on a branch; W6 one, beak open)'."

Copy `assets/messenger-bird.ts` exactly (the same kind, options, size, and clips). Change only:

- the body, back, and wing colours go to blue `#3f6fa8`, with the shade `#2f5584` where the source
  uses its darker body shade;
- the belly and breast go to light blue `#a9c8e8`;
- the beak and the feet stay as in the source, and the eyes are unchanged;
- the bird kind option `beakOpen` is 18 (an open happy beak at rest);
- the message item (the collar, the message tube, the rolled letter, and the red wax seal) is gone:
  a plain songbird;
- the variants and presets stay out (one fixed look), unless the kind requires them.

Do not change `assets/messenger-bird.ts` or `assets/parts/`.

## Common rules for the prop set

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Use one body per material. The first
prop batch asked for under 8,000 triangles (see Known differences).

## Sources

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a blue bird, weeks 2 and 6 | Inventory section 5, `forge-inventory.md` at 9255c2711: W2 "four in a row on a branch", W6 "one, beak open" |
| Colour | blue `#3f6fa8` body, back, and wings | Book line "blue in both weeks". The exact hex is a PM default, checked against the book: no colour value exists in the book |
| Shade | darker blue `#2f5584` wing tips | PM default, check against the book. The source uses the darker `flight` colour `#a87444` on the wing tips |
| Colour | light blue `#a9c8e8` belly and breast | PM default, check against the book. The source belly is `#f8eabc` |
| Beak | open at rest | Book line W6 "one, beak open". The kind option `beakOpen` (degrees) is the tool for it |
| Beak colour | grey `#7a7680`, unchanged from the source | PM default, check against the book |
| Feet | pink `#e88a8a`, unchanged from the source | PM default, check against the book |
| Eyes | dark bead `#2a1a12`, unchanged from the source | PM default, check against the book |
| Shape, size, clips | `assets/messenger-bird.ts` at 0.4 of the bird kind | The PM order of 2026-11-18: the source bird is the body plan for the songbird |
| Props | no collar, tube, letter, or seal | The book asks for a bird, not a carrier bird; the PM order removes the message |
| Look | one fixed blue look | The book gives one colour for both weeks; the PM order keeps the presets out |

## The built asset

- File `assets/storytime-bird.ts`; the bird kind of `assets/parts/bird-kind.ts` at 0.4 of its size,
  the same body, options, clips, and scale as `assets/messenger-bird.ts`.
- Colours: body, back, head, wings, and tail `#3f6fa8`; belly and breast `#a9c8e8`; wing tips
  `#2f5584`; grey beak `#7a7680` in both halves; pink feet `#e88a8a` and the dark talon colour
  `#6a5050` unchanged; dark bead eyes `#2a1a12`.
- `beakOpen: 18`; the lower beak turns down about the jaw joint by 18 degrees and stays there at
  rest and in every clip that does not move the jaw.
- Slots: one option each for `body`, `head`, `wings`, and `eyes`. No presets. The kind requires the
  four slots, so they stay with one option each; nothing else varies.
- The collar, buckle, tube, letter, and seal are gone; `extra` is not used.
- Size 0.199 x 0.27 x 0.23 m, stands on y = 0, faces +Z, three-quarter read 0.543 x 0.82 of the
  frame. 12,258 triangles in the textured build (12,871 with vertex colours only).
- Clips: idle, walk, fly, attack, hit, death, as the source.

## Known differences

- The rosy cheek patches of the source stay, in `#f0a0a0`. The PM order changes the body, back,
  wing, and belly colours and leaves the rest; the book says "blue" and says nothing about cheeks.
  The two patches are paint on the head, not geometry.
- The reference image stays from the source (`docs/wildlife-mockups/messenger-bird_001.jpg`). It
  shows the same body plan in cream with the message tube; the colour of this asset differs from it
  on purpose, because the book fixes blue.
- The open beak is small: the upper and lower beak together are 1.5 % of the front silhouette at
  1024 px/m. In the side and three-quarter views the gap between the halves reads; in the front
  view the lower half sits behind the upper one.
- 12,258 triangles, not under the 8,000 of the first prop batch. The count comes from the source
  body plan, which holds 19,250 triangles at the same scale; the PM order copies the options and
  does not set a triangle budget.
