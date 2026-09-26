# Review rubric and final report

## After every render

Read `out/<name>/render.png` and write down **the three largest problems, in order**. Fix
the first one before touching anything else. "Largest" means the one that most changes how the
asset reads from a distance: silhouette beats proportion beats color beats detail.

Useful views:

- `--views front,side,back`: silhouette and proportion.
- `--focus x,y,z,r`: faces, hands, joins, emblems, anything small.
- `./forge sprites <name> --fast`: readability at game size. Look at `sprites/preview.png`.
- `./forge animate <name> --fast`: motion strips in `anim/<clip>.png`.

## Rubric (score each 1 to 5)

| Criterion                 | 1                                              | 3                                              | 5                                                                  |
| ------------------------- | ---------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| Silhouette                | unreadable blob or box from some views         | readable from the front, weak from the side    | identifiable as a black cutout from every view; has a signature break |
| Proportion and appeal     | realistic or accidental proportions            | correct but timid                              | the defining trait is exaggerated; clear big/medium/small rhythm   |
| Shape language            | contradicts the brief (a "scary" all-round blob) | matches the brief in the main forms            | every form supports the character (friendly, sturdy, dangerous)    |
| Value and color           | flat or noisy; many competing colors           | coherent palette, weak focal contrast          | clear value plan, 60/30/10 palette, accent at the focal point      |
| Materials                 | everything looks like one material             | materials distinguishable                      | each material reads by value, hue, roughness, and metalness         |
| Detail hierarchy          | noise everywhere or no detail                  | details present but evenly spread              | detail concentrated at the focal point, calm rest areas            |
| Technical quality         | holes, pokes-through, floating parts, warnings | minor intersections or wasted triangles        | clean, no wasted triangles, no warnings, parts attached            |
| Game readiness            | wrong scale or orientation, no rig when needed | usable with fixes                              | real scale, on the ground, faces +Z, rig and clips if needed        |
| Readability at 128 px     | the key features vanish in sprites             | recognizable but the face or focal point is lost | the focal point and identity read in every direction             |
| Motion (if animated)      | feet slide or sink, parts detach, loops pop    | readable but stiff or too subtle               | weight, overlap, planted contacts, seamless loops, reads in sprites |

An asset is done when every criterion is 4 or more. If one is below 3, fix it before adding
anything new.

## Final checks

- [ ] `./forge all <name>` ran with no `warning:` lines.
- [ ] No body far over its share of triangles without visible detail to show for it (see `SKILL.md`).
- [ ] Stands on `y = 0`, faces +Z, real-world scale.
- [ ] Nothing pokes through anything, at rest and during every clip.
- [ ] `sprites/preview.png` reads in all directions.
- [ ] The design note at the top of the file matches what was built.

## Final report template

```
## <asset name>
<one or two sentences: what it is and the one idea it exaggerates>

- File: assets/<name>.ts
- Size: <w x h x d> m, <triangles> triangles, textures <size>
- Bodies: <list with materials>
- Rig: <bones, or none>; clips: <names and durations, or none>
- Outputs: out/<name>/render.png, sprites/preview.png, anim/<clip>.png
- Rubric: silhouette <n>, proportion <n>, shape <n>, color <n>, materials <n>, detail <n>,
  technical <n>, game-ready <n>, 128 px <n>, motion <n or n/a>
- Known limits: <anything not done or not good enough yet>
```
