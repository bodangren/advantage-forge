# Brief for the independent reviewer

You are the independent reviewer for a batch of Chibi Quest assets. Another agent built these
assets. You did not build them, and you do not see the builder's ratings. Your ratings are the
recorded ratings. The owner decided on 2026-10-05 that self-evaluation is not acceptable.

## Inputs

- One review card for each asset: `<cards-dir>/<name>.png`. Row 1 is the mockup (the target
  image, top left) and the front, three-quarter, side, and back views of the built model. Row 2
  is the 8-direction sprite preview at 128 px and one motion strip (named in the card title).
- The asset's role in the game (one line each, in the task).
- If you need a closer look, you may read `out/<name>/render.png`, `out/<name>/views/*.png`,
  `out/<name>/sprites/preview.png`, and `out/<name>/anim/<clip>.png`. Do not read the asset
  sources or `docs/character-reviews.json`.

## Method

For each asset:

1. Compare the model with the mockup. Write down every difference in silhouette, body plan,
   pose, proportion, face and expression, color, and signature details.
2. Score the 11 criteria from 1 to 5 (see the table). Use halves where needed.
3. Give the overall rating out of 10 with the anchors and the caps below.

| Criterion | 1 | 3 | 5 |
| --- | --- | --- | --- |
| Mockup match | another thing | the same animal or character with clear differences | the mockup made 3D, small differences only |
| Silhouette | unreadable blob | readable from the front, weak from the side | identifiable as a cutout from every view |
| Proportion and appeal | accidental proportions | correct but timid | the defining trait is exaggerated, chibi appeal |
| Shape language | contradicts the role | matches the main forms | every form supports the character |
| Value and color | flat or noisy | coherent, weak focal contrast | clear value plan, accent at the focal point, matches the mockup palette |
| Materials | one material everywhere | distinguishable | each material reads |
| Detail hierarchy | noise or none | details evenly spread | detail at the focal point, calm rest areas |
| Technical quality | holes, poke-through, floating parts | minor intersections | clean and attached |
| Game readiness | wrong scale or not on the ground | usable with fixes | on the ground, faces +Z, rig and clips |
| Readability at 128 px | identity lost in sprites | recognizable, face lost | identity and face read in every direction |
| Motion | parts detach, feet slide or sink | readable but stiff | weight, overlap, planted contacts |

Overall anchors (out of 10):

- 9 or more: the mockup made 3D; nothing to fix.
- 8: very close; only small details differ.
- 7.5: matches the mockup with small differences only. This is the character bar.
- 7: the same animal or character, but with one or more clear differences.
- 6: noticeably off in silhouette, pose, or face.
- 5 or less: wrong in body plan or identity.

Caps:

- A different body plan or pose from the mockup (for example, upright on two legs against four
  legs, wings spread against folded): 6.5 or less.
  Exception (owner decision of 2026-10-05): an animal whose mockup sits keeps a standing rest pose
  for its walk and has a `sit` clip. Its card shows the sit strip in row 2. Judge the pose from
  the sit strip, not from the standing views; the cap does not apply when the sit matches.
- A different face expression (for example, an open mouth with fangs against a closed smile):
  7.0 or less.
- A visible defect (a hole, a part through another part, a floating part): 7.0 or less.

Use the full scale. Do not round up to the bar. A rating at the bar needs every listed difference
to be small.

## Output

Write one JSON file to the path in the task, and nothing else. Do not edit any other file.

```json
{
  "<name>": {
    "overall": 7.0,
    "scores": [3, 4, 3.5, 4, 3.5, 3.5, 3.5, 4, 4, 3.5, 3.5],
    "summary": "One or two sentences: what the model is and how close it is to the mockup.",
    "strengths": ["..."],
    "issues": ["The largest difference first. Each issue names what to change."],
    "next": "The one change that would raise the rating most."
  }
}
```

The `scores` order: mockup match, silhouette, proportion, shape, color, materials, detail,
technical, game readiness, 128 px, motion. Write the text in ASD-STE100 Simplified Technical
English: short sentences, active voice, one word for one meaning.

Your final message: a table with the name, the overall rating, and the largest issue for each
asset, and the path of the JSON file.
