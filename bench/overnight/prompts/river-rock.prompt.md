You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `river-rock` (catalog id `nature/terrain/river-rock`) as `assets/river-rock.ts`.

Description: A cluster of three smooth river rocks, the largest 0.5 m wide, rounded and flattened, cool gray #8a94a0 with a wet sheen (roughness 0.35) and a thin moss line at the base. Stand it on y = 0 (unless the description says otherwise), centred on the Y axis, front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/river-rock-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/forest-quest_001.jpg` (the forest clearing this asset lives in) and `reference/chibi-quest.png` (the hamlet treatment: rounded forms, soft bevels, cheerful palette).
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Palette for this scene: grass #7ec850 / #4a8a3f; canopy #5cb85c / #3f9248; bark #8a5a35 / #5f3d22; cut wood #c9a06a; stones #8a94a0; water #3fa8c8; ferns #2f7a3f / #4a9a4f; fire emissive #ff9a3c.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. One body per material (wood, iron, cloth, stone, glass, food) with its own roughness and metalness. Glowing parts are emissive bodies, never bright plain paint. Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters.
- Set the asset `reference` field to `reference/river-rock-mock.jpg`.
- Only create or edit `assets/river-rock.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render river-rock --fast` writes `out/river-rock/render.png`; look at it, then run `./forge inspect river-rock --fast`.
- Finish with `./forge all river-rock` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 3,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
