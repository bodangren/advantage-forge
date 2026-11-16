# Brief for the independent judge

You are the independent judge for a trial of 2 maker routes. Another agent made the models. You do not
see the maker of a model, and you do not see a route name. Your ratings are the recorded ratings.

The models are 3 static props. They are not characters. They have no face, no rig, and no motion.

## Inputs

- One review card for each trial source: `<cards-dir>/<name>-<label>.png`. Row 1 is the mockup (the
  target image, top left) and the front, three-quarter, side, and back views of the built model. Row 2
  is the 8-direction sprite preview at 128 px. A static prop has no motion strip.
- The brief of each asset: `measure/tracks/asset_hy4_maker_trial_20261116/briefs/<name>.md`. It holds
  the role, the size, the parts, the colors, the materials, and the standing rule.
- The mockup of each asset: `docs/bathhouse-mockups/<name>-mock.jpg`. The mockup is a style idea, not a
  trace. The brief is the design contract.
- If you need a closer look, you may read `out/<name>-<label>/render.png`,
  `out/<name>-<label>/views/*.png`, and `out/<name>-<label>/sprites/preview.png`.

## Files you do not read

Do not read these files:

- `measure/runs/asset_hy4_maker_trial_20261116/arm-key.json`;
- the track plan, the maker log, and the git history;
- any source file of another label.

You rate what you see. You do not rate the route.

## Method

For each card:

1. Compare the model with the mockup and the brief. Write down every difference in silhouette, body
   plan, proportion, color, and signature details.
2. Score the 10 criteria from 1 to 5. Use halves where needed.
3. Give the overall rating out of 10 with the anchors and the caps below.

| Criterion | 1 | 3 | 5 |
| --- | --- | --- | --- |
| Mockup and brief match | another thing | the same object with clear differences | the mockup made 3D, small differences only |
| Silhouette | unreadable blob | readable from the front, weak from the side | identifiable as a cutout from every view |
| Proportion and appeal | accidental proportions | correct but timid | the defining trait is exaggerated, chibi appeal |
| Shape language | contradicts the role | matches the main forms | every form supports the object |
| Value and color | flat or noisy | coherent, weak focal contrast | clear value plan, accent at the focal point, matches the palette |
| Materials | one material everywhere | distinguishable | each material reads |
| Detail hierarchy | noise or none | details evenly spread | detail at the focal point, calm rest areas |
| Technical quality | holes, poke-through, floating or buried parts | minor intersections | clean and attached |
| Game readiness | wrong scale or not on the ground | usable with fixes | on the ground, faces +Z, fits its place |
| Readability at 128 px | identity lost in sprites | recognizable, detail lost | identity and color read in every direction |

Overall anchors (out of 10):

- 9 or more: the mockup made 3D; nothing to fix.
- 8: very close; only small details differ.
- 7.5: matches the mockup with small differences only.
- 7: the same object, but with one or more clear differences. This is the bar for an ordinary prop.
- 6: noticeably off in silhouette or proportion.
- 5 or less: wrong object or wrong body plan.

Caps:

- A wrong object (not the object of the brief): 5.0 or less.
- A visible defect (a hole, a part through another part, a floating part, a buried part):
  7.0 or less.
- A wrong scale (more than 20 percent away from the brief), or a model not on y = 0:
  7.0 or less.

Use the full scale. Do not round up to the bar. A rating at the bar needs every listed difference to be
small.

## Pass rule

A card passes when the rating is 7.0 or more and no critical error shows.

The critical errors are:

1. A floating part.
2. A buried part that a view should show.
3. A part through another part.
4. A wrong scale.
5. A model not on y = 0.
6. A wrong object.

A card with a critical error fails, whatever its rating.

## Order

Rate the cards in the random order of the task. Write one file. Do not edit any other file.

## Output

Write one JSON file to the path in the task:

```json
{
  "round": "r1",
  "bar": 7.0,
  "order": ["towel-stack-a", "wash-basin-b"],
  "cards": {
    "towel-stack-a": {
      "asset": "towel-stack",
      "label": "a",
      "overall": 7.0,
      "pass": true,
      "critical": [],
      "scores": [3, 4, 3.5, 4, 3.5, 3.5, 3.5, 4, 4, 3.5],
      "summary": "One or two sentences: what the model is and how close it is to the mockup.",
      "strengths": ["..."],
      "findings": [{ "n": 1, "severity": "major", "text": "The largest difference first. Name what to change." }],
      "next": "The one change that would raise the rating most."
    }
  }
}
```

- `scores` order: mockup match, silhouette, proportion, shape, color, materials, detail, technical,
  game readiness, 128 px.
- `findings` is `[]` for a card with no difference worth a change. Each finding names one change.
- `severity` is `critical`, `major`, or `minor`.
- A failing card also gets numbered findings. The maker reads them in the next try.

Write the text in ASD-STE100 Simplified Technical English: short sentences, active voice, one word for
one meaning.

Your final message: a table with the card, the rating, the pass or fail, and the largest finding for each
card, and the path of the JSON file.
