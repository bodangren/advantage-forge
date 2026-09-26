# Authoring assets in Fantasy Asset Forge

You make a 3D asset by writing a TypeScript file in `assets/`. The file describes the asset as
code: signed distance shapes (SDF), blended and painted, which Forge meshes into smooth
medium-poly bodies, unwraps into one UV atlas, bakes into textures (base color, normal, and
occlusion/roughness/metalness), optionally rigs and animates, and exports as GLB. Pixel-art
sprites are rendered from the GLB.

The asset file is the source of truth. There is no closed part catalog: if a shape can be
described with math, you can model it. Read and edit anything under `src/` when the tools need
to grow.

For the full creative process (art direction, category playbooks, review rubric), use the
`forge-assets` skill in `.claude/skills/forge-assets/`.

## The loop

1. Edit `assets/<name>.ts`.
2. Run `./forge render <name> --fast`. It builds the GLB with vertex colors (about 3x faster
   than with baked textures) and writes `out/<name>/render.png` (front, three-quarter, side,
   back, plus the reference image if the asset declares one).
3. **Look at `out/<name>/render.png` with the Read tool.** Compare silhouette first, then
   proportions, then color, then details. Write down the three largest differences. If you
   cannot view images, run `./forge inspect <name> --fast`: it reports visibility per part,
   silhouette, values, colors, and floating or buried parts as text.
4. Fix the largest difference first. Repeat.
5. When the shape is right, run `./forge all <name>` once for the final textured GLB, sprites,
   and every animation.

```bash
./forge render rogue --fast                           # shape iteration (vertex colors)
./forge render rogue --focus 0,0.62,0.15,0.12         # zoom every view on a sphere (x,y,z,radius)
./forge render rogue --views side,top                 # front, three-quarter, side, back, back-three-quarter, top
./forge animate rogue --fast --clip walk              # review strip out/<name>/anim/walk.png + walk.gif
./forge sprites rogue                                 # 8-direction 128 px sprites, sprites/preview.png
./forge sprites rogue --clip walk --dirs 4            # animated sheet: rows = directions, columns = frames
./forge all rogue                                     # final: textures, render, sprites, all clips
./forge inspect rogue --fast                          # the render as numbers: part visibility, silhouette, values, warnings
FORGE_DEBUG=1 ./forge build rogue                     # per-phase timings and reduction diagnostics
```

`./forge` runs the CLI directly with Node. `pnpm forge ...` also works but starts slower.
`pnpm dev` opens a viewer (orbit, wireframe, clip playback) that rebuilds on every save.

Outputs in `out/<name>/`: `<name>.glb`, `stats.json`, `render.png`, `views/`, `textures/`
(the atlas PNGs), `sprites/`, `anim/`.

## Conventions

- Units are meters. +Y is up. The asset faces **+Z** (the "front" view looks at +Z).
- Stand the asset on the ground plane `y = 0`, centered on the Y axis.
- A chibi character is about 1 m tall; a barrel about 0.9 m; a door about 2 m. Detail is in
  meters, so keep real-world-ish sizes.
- `+X` is the character's left. Build one side and `.mirror('x')` it. Name left bones `*.L`.

## API

```ts
import { defineAsset, sdf, profile, noise, motion, rgb, mixRgb } from '../src/index.js';

export default defineAsset({
  name: 'thing',
  detail: 0.005, // mesh cell size in meters (smaller = finer and slower)
  reference: 'reference-designs/.../image.jpg', // optional; shown above the views
  texture: { size: 1024 }, // or false for vertex colors only
  build(k) {
    k.body('name', shape, { color, roughness, metalness, detail, textureDensity, bone, flat });
    k.skeleton({ hips: { at: [0, 0.3, 0] }, 'leg.L': { parent: 'hips', at: [0.1, 0.3, 0] } });
    k.animation('walk', { duration: 0.9, pose: (t, phase) => ({ 'leg.L': { rotate: [-25, 0, 0] } }) });
    k.group('lid', { at: [x, y, z], rotate: [rx, ry, rz] }, (g) => g.body(...)); // static pivots (no skeleton)
    k.add('name', anyThreeObject); // escape hatch: hand-built three.js geometry
  },
});
```

Shapes (`sdf.*`), all centered at the origin unless defined by points:

| Shape                                    | Notes                                                              |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `sphere(r)`, `ellipsoid([rx, ry, rz])`   | heads, bellies, cheeks, blobs                                      |
| `box([w, h, d], radius?)`                | full dimensions; `radius` rounds edges                             |
| `cylinder(r, h, edgeRadius?)`            | upright along Y                                                    |
| `capsule(a, b, r)`, `cone(a, b, ra, rb)` | between two points; `cone` tapers (limbs, fingers, horns)          |
| `chain([[x, y, z, r], ...], k)`          | smooth chain of tapered segments (tails, roots, hair locks)        |
| `torus(R, r)`                            | ring in the XZ plane                                               |
| `revolve(profile)`                       | profile U = radius, V = height; helmets, pots, barrels, towers     |
| `extrude(profile, depth, radius?)`       | profile in XY, pushed along Z; emblems, blades, planks, face marks |
| `halfSpace(normal, offset)`              | solid where `dot(n, p) <= offset`; only for cutting (intersect it) |

Combining: `union`, `smoothUnion(k, ...)`, `subtract(base, ...cutters)`, `smoothSubtract(k, ...)`,
`intersect(a, b)`, `smoothIntersect(k, a, b)`. All are also methods: `a.smoothUnion(0.02, b)`.
Smooth blends are C2-continuous, so fillets never show a line in highlights.

Methods on every shape (each returns a new shape; transforms apply in world space, in call order):
`.at(x, y, z)`, `.rotate(xDeg, yDeg, zDeg)`, `.rotateX/Y/Z(deg)`, `.scale(s | [sx, sy, sz])`,
`.mirror('x', k?)` (adds the reflection, blended where the halves meet), `.round(r)` (inflate),
`.shell(thickness)`, `.displace(amplitude, fn)`, `.elongate(hx, hy, hz)`, `.bend(k)`,
`.paint(color)`, `.paintWhere(region, color, soft?)`, `.paintFn((x, y, z, base) => rgb)`,
`.bone(name)` (skin-weight tag).

2D profiles (`profile.*`): `polygon(points, { smooth })` (smooth = Catmull-Rom through the points),
`circle(r)`, `rect([w, h], radius)`, `arc(radius, width, fromDeg, toDeg)`, `offsetProfile(p, d)`.

Noise (`noise.*`): `noise3(x, y, z)`, `fbm(x, y, z, octaves)` in [-1, 1], `random(i, j, k)` in [0, 1).

Motion (`motion.*`): `wave(phase, cycles, offset)` in [-1, 1], `bump(phase, cycles, offset)` in
[0, 1], `mirrorPose(pose)` (L to R), `legDrop(legLength, degrees)` (keeps a planted foot down).

### Body options

| Option                          | Meaning                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| `color`                         | base color where no paint covers the surface                      |
| `roughness`, `metalness`        | PBR values (baked into the ORM map)                               |
| `detail`                        | mesh cell size for this body (0.004 faces, 0.008 big plain forms) |
| `textureDensity`                | share of the atlas; 2 for faces and small painted detail          |
| `bone`                          | rigid bind to one bone (helmets, weapons, buckles)                |
| `opacity`                       | below 1 for see-through parts (glass, mist, magic effects)        |
| `emissive`, `emissiveIntensity` | glowing parts (eyes, flames, runes)                               |
| `bump`                          | surface detail baked into the normal map only (stone, grain, fur) |
| `paintWeight`                   | keep soft paint gradients during reduction (vertex-color mode)    |
| `flat`                          | faceted shading for a deliberately chunky look                    |
| `maxError`, `maxTriangles`      | triangle reduction limits                                         |

### Rigging and animation

- `k.skeleton({...})`: bone name to `{ parent?, at, tail? }`, `at` = joint position in the rest
  pose (world meters). Exactly one root.
- Skin weights come from `.bone(name)` tags on the parts you build from: tag the upper arm cone,
  the forearm cone, the hand, the head. The distance from each vertex to each bone's tagged
  shapes decides the weights; fillets between tagged parts blend them. `.mirror('x')` renames
  `.L` tags to `.R` for the reflected half. Rigid parts use the body option `bone`.
- Untagged bodies in a rigged asset fall back to distance from bone segments.
- `k.animation(name, { duration, fps?, loop?, pose(t, phase) })` returns
  `{ bone: { rotate?: [x, y, z] degrees, move?: [x, y, z] meters, scale?: [x, y, z] } }`,
  relative to the rest pose.
  +X swings a hanging limb backward and tilts an upward bone forward; +Z swings a hanging limb
  toward +X; +Y twists counterclockwise seen from above.

## Recipes that work

- **Organic forms:** build from overlapping primitives with `smoothUnion(k, ...)`. `k` is the
  fillet size in meters: 0.01 for crisp joints, 0.03 to 0.06 for soft, sculpted flesh.
- **One body per material.** Skin, hair, cloth, metal, and leather are separate `k.body` calls
  with their own roughness and metalness. Bodies may overlap; hidden parts cost nothing visible.
- **Clothing that fits:** grow the body under it and cut a band:
  `torso.round(0.009).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5]).at(0, beltY, 0))`.
  The same trick makes hoops on a barrel and trims on a helmet.
- **Paint:** `paintWhere(region, color)` colors the surface inside a 3D stencil. The stencil must
  cross the surface. For face marks use an extruded 2D stroke that passes through the face:
  `sdf.extrude(profile.arc(0.048, 0.011, 222, 318), 0.3).at(0, mouthY, 0.15)`.
  Textures bake paint per texel with anti-aliased edges; give faces `textureDensity: 2`.
- **Decoration that follows a curved surface:** intersect a thin shell of the surface with an
  extruded outline: `dome.round(0.011).subtract(dome.round(-0.004)).intersect(sdf.extrude(outline, 0.3)...)`.
- **Hair under a hat:** a cap slightly larger than the skull, minus a face mask (displaced for a
  wavy fringe), intersected with the inside of the hat so it never pokes through.
- **Local frames:** write a helper like `const helmetPose = (s) => s.rotateX(-13).at(0, 0.73, 0)`
  and build the part at its own origin.
- **Surface texture:** `.displace(0.004, (x, y, z) => noise.fbm(x * 18, y * 6, z * 18, 3))` for wood,
  stone, bark. The normal map keeps this detail even after triangle reduction. Keep amplitude
  small on shiny metal; reflections exaggerate it.
- **Color variation:** `.paintFn(...)` with `noise` for wood grain, moss, stains.

## Performance

On a 2012 quad-core: a character builds in about 4 to 6 s with `--fast`, about 20 s with
textures (UV unwrap and bake); a render adds about 1 s; an animation strip about 1 to 3 s.

- Use `detail` per body: 0.004 to 0.005 for faces and hands, 0.006 to 0.008 for large simple forms.
- `halfSpace` must be intersected with a finite shape, or the body has no bounds.
- Noise and `paintFn` are evaluated at many points; keep them on the bodies that need them.
- `FORGE_WORKERS=n` sets the number of meshing and baking threads (default: half the cores).

## Checks before you call an asset done

- Silhouette and proportions match the reference in front, side, and back.
- Nothing pokes through anything (hair through hats, hands through cloth), also mid-animation.
- The face reads at 128 px: run `./forge sprites <name>` and look at `preview.png`.
- No `warning:` lines in the build output.
- `pnpm test` and `pnpm typecheck` pass if you changed `src/`.
