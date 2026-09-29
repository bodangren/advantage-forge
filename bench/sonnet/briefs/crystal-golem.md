# crystal-golem (enemies/construct/crystal-golem) -> assets/crystal-golem.ts

A faceted crystal construct about 1.15 m tall to the top spike, faces +Z, on the stone golem base (assets/stone-golem.ts: the heavy golem rig with knee bones; clips idle, walk, run, attack, attack2, roar, hit, death; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/crystal-golem_001.jpg (set `reference` to that path). Match its idea: a body made of pale violet-blue crystal shards: a jagged crown of tall spikes on the head, a visor-like face plate with a glowing cyan eye slit, huge shoulder clusters of spikes, thick angular arms ending in fist clusters of shards, a faceted chest with a glowing cyan core diamond, a pointed pelvis spike, short faceted legs with spike knees and flat shard feet; a soft glow and a few sparkle points.

Palette: crystal #b8b0f0 with lit #d8d4ff and shade #8a80d0 (roughness 0.25, metalness 0.1, opacity 0.95; `flat: true` on the shard bodies for a faceted look); eye slit and core #4fe8ff emissive 2.0; sparkles: four small white emissive spheres r 0.012 near the shoulders and crown.
Variants: crystal (violet default, emerald #8ad8b0, amber #f0c070), glow (cyan default, magenta #ff5ae0, white #ffffff).

Construction recipe:
1. Copy assets/stone-golem.ts. Keep the rig and the clips. Replace every boulder with unions of sharp shards: each shard is a `sdf.cone` or a scaled `sdf.box` with `.rotate` on random angles, no smoothUnion (plain union keeps facets), and every shard body uses `flat: true`. Head: a faceted box 0.22 with a crown of 9 to 12 tall cones (0.1 to 0.22 long) pointing up and out; a horizontal eye slit (a subtracted box 0.16 x 0.03 with an emissive bar behind it). Shoulders: clusters of 8 to 10 cones each. Arms: faceted boxes with fist clusters of 6 shards. Chest: a faceted box 0.42 x 0.36 x 0.3 with a diamond core (an octahedron: two cones tip to tip, emissive) sunk into the front. Pelvis spike, faceted legs, shard feet flat on y 0.
2. Keep the triangle count under control: shards need no bump; use `detail` 0.007 on the body shards and `maxError` if the count passes the limit.
3. Clips: keep the base clips; attack a two-fist slam, attack2 a wide backhand. No held items. The ground check must be ok (the spikes must not dip below y 0 in any clip).
4. Sprites: the spiky crown, the shoulder clusters, the eye slit, and the core must read at 128 px.

Limits: under 60,000 triangles. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/crystal-golem.ts. Finish with one `./forge all crystal-golem`.
