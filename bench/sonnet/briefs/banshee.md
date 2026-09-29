# banshee (enemies/undead/banshee) -> assets/banshee.ts

A wailing floating ghost woman about 1.1 m tall from the hem wisps to the hair tips, faces +Z, on the ghost base (assets/ghost.ts: a floating rig with a hover `move` in the clips, feet on y = 0 in the rest pose; clips idle, walk, attack, hit, death, taunt; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/banshee_001.jpg (set `reference` to that path). Match its idea: a gaunt pale grey-green head with hollow eye sockets that hold glowing cyan eyes and a wide open screaming mouth with a dark red throat; very long white hair that streams upward and outward in about eight thick wavy locks; a ragged wrapped collar; thin long arms raised with long clawed fingers (two arms, not four); a long tattered grey-green gown that trails into three or four curling mist wisps at the hem; faint cyan glow streaks on the gown.

Palette: skin and gown #8fa39a with shade #6b7f76 (roughness 0.8); hair #efeae0; eyes cyan #4ff0ff emissive 1.8 on #103030 sockets; mouth throat #5a1a22; wisps #b8cfc6 with opacity 0.75 and a cyan #7fe8ff emissive tint at the tips.
Variants: glow (cyan default, green #6fff8a, violet #c07fff), gown (grey-green default, pale blue #9fb4c8, bone #d8d0c0), hair (white default, black #202028, red #8a3a2e).

Construction recipe:
1. Copy assets/ghost.ts. Keep the hover rig and the clips. Replace the egg head with a gaunt skull-like head (ellipsoid 0.2 x 0.24 x 0.2 with sunken cheeks by smoothSubtract, deep eye sockets, an open mouth cut by a subtracted ellipsoid with a dark red inner body).
2. Hair: eight `sdf.chain` locks from the scalp, sweeping up and out to y 1.1 and x +-0.35, r 0.04 to 0.012, smoothUnion 0.02; `bump` for strands. Tag them to the head bone.
3. Body: the gown is a revolve profile from the collar (r 0.1 at y 0.62) to a wide hem (r 0.3 at y 0.15), then three to four curling wisps (`sdf.chain`, tapering) that reach y 0 so the asset stands on the ground plane; wisps get opacity 0.75. A wrapped collar as two stacked tori. Two thin arms (cones) raised to shoulder height with five long claw fingers (cones) each; add `arm.L`/`arm.R` bones if the base lacks them.
4. Clips: idle sways and hovers; attack is a scream lunge (head forward, arms wide, jaw opens by a `scale` on a jaw bone or a mouth body); death sinks and fades (scale down). No held items.
5. Sprites: the hair spread, the glowing eyes, the open mouth, and the wisps must read at 128 px.

Limits: under 60,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/banshee.ts. Finish with one `./forge all banshee`.
