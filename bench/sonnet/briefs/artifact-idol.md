# artifact-idol (items/quest-and-treasure/artifact-idol) -> assets/artifact-idol.ts

An artifact idol: a squat gold statuette 0.28 m tall: a round belly body (ellipsoid), a round head with two big painted eyes and a wide painted mouth, stubby arms folded on the belly, on a square dark stone plinth 0.16 x 0.04 x 0.16; gold #d4a93a metalness 1 roughness 0.4 with #8a6a20 in the creases, one green gem (sphere r 0.02, #22c860 emissive 0.35) on the forehead.

Size: about 0.25 m tall or wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/artifact-idol-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch per the description. Documents stand propped at 70 degrees on a small wedge so the front view shows the face; relics are chunky with one glowing or gold focal part. Emissive parts use a full-brightness base color with emissiveIntensity 0.35 to 0.5. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render artifact-idol --fast`, then run `./forge all artifact-idol` once. Never commit. Only create or edit assets/artifact-idol.ts.
