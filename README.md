# Fantasy Asset Forge

Project status and planning: [Measure index](measure/index.md).

Code-first 3D game assets, with 2D pixel-art sprites rendered from the same model.

An LLM writes each asset as a TypeScript program, renders it, looks at the result, and revises
it. There is no Blender in the loop. A textured, rigged, animated GLB comes out of every build,
and the sprite pass renders that GLB into eight-direction pixel art, one sheet per animation
clip and one sprite set per color preset. You get a 3D asset and a 2.5D sprite character from
one source file.

**Play the demo:** [Chibi Quest: Monster Encounters](https://bodangren.github.io/fantasy-asset-forge/),
a reading game for grades 3 to 6 built from these assets. Read a short story, then use its words
and sentences to beat monsters in the Sunken Vault. See
[docs/demo-monster-encounters.md](docs/demo-monster-encounters.md).

![wizard turnaround: reference, front, three-quarter, side, back](docs/showcase/wizard-turnaround.jpg)

## Project goals and status

Since the rebuild of 26 September 2026 the repository has three connected goals. Measure tracks
own the plans and the status: start at the [Measure index](measure/index.md) and the
[generated status](measure/generated/status.md).

| Goal | What it means | Where it stands |
| --- | --- | --- |
| **Assets** | The full fantasy catalog as TypeScript sources: 856 catalog targets and 100 scene blueprints ([catalog](docs/fantasy-world-asset-catalog.md)). | About 600 sources in `assets/`. All P0 and all 32 P1 heroes are done, with color presets. Enemies, equipment, props, architecture, and nature are in review. Every equipment piece must fit the chibi humanoid ([fit contract](docs/equipment-fit.md)). |
| **Games** | Reading games for primary students. Each has one rules core, a three.js view, and a Phaser 2D view for older phones. | Six games run locally in 3D and 2D. The platform port into the monorepo is in progress, starting with Potion Rush. 23 legacy games wait for rewrites ([program](docs/apk-2d3d-program.md), [roadmap](measure/game-roadmap.md)). |
| **Player progression** | Students earn XP, turn it into GP, buy equipment for one avatar, and play as that avatar. In Guild Mode the class fights one weekly boss together. | Specified on 1 October 2026. Primary Advantage first, rigid equipment slots first, no real-time multiplayer. Phase 1 (avatar base, equipment fit, pack, composer) is planned in this repository ([plan](docs/chibi-quest-progression.md), [spec](docs/avatar-system.md)). |

The players' name for the product is **Chibi Quest**. A [45 second battle teaser](docs/guild-battle-teaser.md)
shows the 15 hero classes against 68 kinds of enemies.

The work also runs as a method. Sonnet agents build assets in tiers with review bars, and
[Forge Bench](bench/README.md) scores models on the same task. The rules learned are in
[measure/lessons-learned.md](measure/lessons-learned.md).

## Connected repositories

| Repository | Path | Relation |
| --- | --- | --- |
| Reading Advantage monorepo | `../reading-advantage-monorepo` | Owns the apps (Primary Advantage is `apps/primary-advantage`), the database, and the Advantage Play Kit (APK) game platform. Receives the game port and the avatar and Guild Mode backend. |
| Tutor Advantage | `../tutor-advantage` | A separate repository: three backend services and three apps (`tutor-pwa`, `student-liff`, `admin-console`). Chibi Quest is branded for it. |

- **Monorepo.** The demos here are standalone, but they keep the APK shapes: one mount function,
  content through a launch context, one `GameResults`, persistence through a host adapter. The
  monorepo already holds the XP log, game completions, class challenges, and three fixed
  cosmetics that the avatar work extends. This repository plans and records the port; the
  monorepo owns its own commits and deployment checks. See [docs/apk-port.md](docs/apk-port.md).
- **Tutor Advantage.** Its tutor app runs its own copies of the legacy games inside live
  lessons. It uses this repository only through the teaser's logo. Avatars, GP, and Guild Mode
  go to Primary Advantage first, and a later track decides how Tutor Advantage receives them.


## Showcase

Everything below was rendered by `./forge` from the code in `assets/`. Nothing was hand-painted
or retouched.

### Turnarounds

Each render sits under the concept reference it was modeled from.

![rogue turnaround: reference, front, three-quarter, side, back](docs/showcase/rogue-turnaround.jpg)

### 3D clips and their sprites

Each row is one clip. The left column is the textured GLB in the studio renderer; the right
column is the pixel-art sprite of the same frames.

| Character                                             |                                                 3D (GLB)                                                 |                                                    Sprite (128 px, SE)                                                     |
| ----------------------------------------------------- | :------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------: |
| **Wizard**<br>`attack2`: palm-flame cast              |       <img src="docs/showcase/wizard-attack2-3d.gif" width="240" alt="Wizard palm-flame cast, 3D">       |       <img src="docs/showcase/wizard-attack2-sprite.gif" width="240" alt="Wizard palm-flame cast, pixel-art sprite">       |
| **Rogue**<br>`attack`: reverse-grip twin-dagger combo | <img src="docs/showcase/rogue-attack-3d.gif" width="240" alt="Rogue reverse-grip twin-dagger combo, 3D"> | <img src="docs/showcase/rogue-attack-sprite.gif" width="240" alt="Rogue reverse-grip twin-dagger combo, pixel-art sprite"> |
| **Knight**<br>`attack2`: shield bash                  |         <img src="docs/showcase/knight-attack2-3d.gif" width="240" alt="Knight shield bash, 3D">         |         <img src="docs/showcase/knight-attack2-sprite.gif" width="240" alt="Knight shield bash, pixel-art sprite">         |
| **Druid**<br>`attack`: staff cast                     |           <img src="docs/showcase/druid-attack-3d.gif" width="240" alt="Druid staff cast, 3D">           |           <img src="docs/showcase/druid-attack-sprite.gif" width="240" alt="Druid staff cast, pixel-art sprite">           |
| **Orc warrior**<br>`roar`: roar                       |         <img src="docs/showcase/orc-warrior-roar-3d.gif" width="240" alt="Orc warrior roar, 3D">         |         <img src="docs/showcase/orc-warrior-roar-sprite.gif" width="240" alt="Orc warrior roar, pixel-art sprite">         |
| **Skeleton**<br>`death`: collapsing death             |     <img src="docs/showcase/skeleton-death-3d.gif" width="240" alt="Skeleton collapsing death, 3D">      |     <img src="docs/showcase/skeleton-death-sprite.gif" width="240" alt="Skeleton collapsing death, pixel-art sprite">      |
| **Dire wolf**<br>`howl`: howl                         |           <img src="docs/showcase/dire-wolf-howl-3d.gif" width="240" alt="Dire wolf howl, 3D">           |           <img src="docs/showcase/dire-wolf-howl-sprite.gif" width="240" alt="Dire wolf howl, pixel-art sprite">           |
| **Giant spider**<br>`attack`: rearing bite            |   <img src="docs/showcase/giant-spider-attack-3d.gif" width="240" alt="Giant spider rearing bite, 3D">   |   <img src="docs/showcase/giant-spider-attack-sprite.gif" width="240" alt="Giant spider rearing bite, pixel-art sprite">   |
| **Fire dragon**<br>`roar`: roar                       |         <img src="docs/showcase/dragon-fire-roar-3d.gif" width="240" alt="Fire dragon roar, 3D">         |         <img src="docs/showcase/dragon-fire-roar-sprite.gif" width="240" alt="Fire dragon roar, pixel-art sprite">         |
| **Slime**<br>`spit`: spit                             |               <img src="docs/showcase/slime-spit-3d.gif" width="240" alt="Slime spit, 3D">               |               <img src="docs/showcase/slime-spit-sprite.gif" width="240" alt="Slime spit, pixel-art sprite">               |

### Eight directions

Every clip is baked for all eight directions at a fixed pixel density and ground pivot, so
characters line up on a tile grid. This is the rogue's twin-dagger attack:

![rogue attack in eight directions](docs/showcase/rogue-attack-sprites-8dir.gif)

### Color variants

Characters declare color slots (eyes, hair, skin, clothing, or a creature's scales and horns)
and named presets. A textured build adds a tint mask and one recolored texture per preset to
the GLB, and `forge all` bakes a full sprite set per preset. See
[docs/color-variants.md](docs/color-variants.md).

**Wizard**: default, frost, mystic, sage

![Wizard color presets: default, frost, mystic, sage](docs/showcase/wizard-variants.jpg)

**Rogue**: default, noble, nomad, ranger (front)

![Rogue color presets: default, noble, nomad, ranger (front)](docs/showcase/rogue-variants.jpg)

**Knight**: default, champion, royal, warden

![Knight color presets: default, champion, royal, warden](docs/showcase/knight-variants.jpg)

**Druid**: default, autumn, grove, heath

![Druid color presets: default, autumn, grove, heath](docs/showcase/druid-variants.jpg)

**Orc warrior**: default, ashen, bloodfang, bog

![Orc warrior color presets: default, ashen, bloodfang, bog](docs/showcase/orc-warrior-variants.jpg)

**Skeleton**: default, barrow, dread, rustbone

![Skeleton color presets: default, barrow, dread, rustbone](docs/showcase/skeleton-variants.jpg)

**Dire wolf**: default, frost, shadow, timber

![Dire wolf color presets: default, frost, shadow, timber](docs/showcase/dire-wolf-variants.jpg)

**Giant spider**: default, cave, tomb, widow

![Giant spider color presets: default, cave, tomb, widow](docs/showcase/giant-spider-variants.jpg)

**Fire dragon**: default, copper, ember, magma

![Fire dragon color presets: default, copper, ember, magma](docs/showcase/dragon-fire-variants.jpg)

**Slime**: default, fire, ice, poison

![Slime color presets: default, fire, ice, poison](docs/showcase/slime-variants.jpg)

## Quick start

```bash
pnpm install
./forge render rogue --fast         # quick shape check: out/rogue/render.png
./forge all rogue                   # final: textured GLB, turnaround, sprites, every animation
pnpm dev                            # interactive viewer at http://127.0.0.1:5173 (orbit, clips, rebuild on save)
```

Assets live in `assets/*.ts`: heroes, NPCs, monsters, wildlife, props, vegetation, buildings,
and terrain tiles. Good starting points, one per category: `rogue` (character), `horned-boar`
(creature), `treasure-chest` and `barrel` (props), `oak-tree` (vegetation), `cottage`
(architecture), `knight-sword` (item).

- [AGENTS.md](AGENTS.md): the authoring loop and the API. Coding agents read it automatically.
- [.claude/skills/forge-assets](.claude/skills/forge-assets/SKILL.md): the asset-creation skill
  (process, art direction, category playbooks, rigging and animation, review rubric).
- [.claude/skills/forge-environments](.claude/skills/forge-environments/SKILL.md): building a
  whole environment kit (asset list, mockup, review, asset batch, sample map).
- [bench/](bench/README.md): Forge Bench, which measures how well models make assets with Forge.

## How it works

```
assets/rogue.ts ─build─▶ SDF bodies ─mesh─▶ medium-poly meshes ─unwrap─▶ UV atlas ─bake─▶ textures
  (code)                (closures)   surface nets,       xatlas          base color, normal,
                                     reduction           (one atlas)     AO/rough/metal, tint mask
                                                                          │
                     skeleton + bone tags ─▶ skin weights, clips ─────────┤
                                                                          ▼
                                                             out/rogue/rogue.glb
                                                               ├─▶ render.png (studio turnaround)
                                                               ├─▶ anim/ (3D review strips, GIFs)
                                                               ├─▶ sprites/ (8-direction pixel art per clip)
                                                               ├─▶ sprites/presets/ (the same per color preset)
                                                               └─▶ inspect.md (numbers for blind checks)
```

- **Modeling** (`src/sdf/`): shapes, cubic smooth booleans, transforms, 2D profiles (revolve,
  extrude, arcs), noise (gradient, fbm, Worley), paint stencils, bone tags, and surface probes
  (`raycast`, `surfacePoint`) for attaching details exactly.
- **Meshing** (`src/sdf/mesher.ts`): hierarchical narrow band, surface nets, vertices snapped to
  the true surface, normals from the field gradient, checked triangle reduction (meshoptimizer),
  parallel worker threads.
- **Textures** (`src/texture/`): one xatlas UV atlas for all bodies; every texel is projected
  onto the true surface and baked: anti-aliased paint, a tangent-space normal map encoded in the
  exact frame the shader uses (so bake-only `bump` detail and smooth curvature survive
  reduction), SDF ambient occlusion, per-body roughness and metalness, and a tint mask for
  color variants.
- **Rigging and animation** (`src/rig.ts`, `src/motion.ts`): skeletons from joint positions,
  skin weights from the distance to bone-tagged parts, clips written as `pose(t, phase)`
  functions with gait and planted-foot helpers, exported as glTF animations. Characters carry
  idle, walk, run, attack, hit, and death, plus their own extras (shield bash, roar, howl, spit,
  victory).
- **Export** (`src/gltf.ts`): GLB with named nodes, PBR materials, embedded PNG textures,
  tangents, skins, animations, and `KHR_materials_variants` for color presets.
- **Rendering** (`src/render/`): headless Chromium; image-based light, a camera-relative
  key/fill/rim rig, shadows; turnarounds, animation strips and GIFs, pixel-art sprites
  (supersampled, binary alpha, one pixel density per character, a fixed ground pivot, optional
  shared palette and outline), and an ID-buffer inspection.

## Commands

| Command                                                          | Output                                                                  |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `./forge build <asset>`                                          | `<asset>.glb`, `stats.json`, `textures/`                                |
| `./forge render <asset> [--fast] [--views …] [--focus x,y,z,r]`  | `render.png`, `views/`                                                  |
| `./forge render <asset> --preset <name>\|all`                    | `render.<preset>.png`, `views/presets/<preset>/`                        |
| `./forge inspect <asset>`                                        | `inspect.md`: visibility per part, silhouette, values, colors, warnings |
| `./forge animate <asset> [--clip walk]`                          | `anim/<clip>.png` strip and `.gif`                                      |
| `./forge sprites <asset> [--clip walk] [--dirs 8] [--colors 24]` | `sprites/` frames, sheet, preview, GIF                                  |
| `./forge check <asset>`                                          | clip clearance: held weapons never pass through the head                |
| `./forge all <asset>`                                            | everything above, including sprites for every clip and preset           |
| `pnpm dev`                                                       | viewer with orbit, wireframe, clip playback                             |
| `pnpm check`                                                     | typecheck and tests                                                     |

`--fast` skips UV unwrapping and baking (vertex colors, about 3x faster) for shape iteration.

## Scope

In: characters, creatures, props, vegetation, architecture, terrain tiles, and items in a
stylized chibi, medium-poly look (a full-quality hero is about 40k to 70k triangles), baked
textures, color variants, skeletal rigs, animation clips, GLB, and eight-direction pixel-art
sprites.

Not yet: image-texture projection (textures are baked from code, not painted from files), LODs
(a reduced avatar model is planned as a second output),
blend shapes, inverse kinematics, and engine-specific exporters.

## History

Version 0.1 tried to make LLM asset creation reliable by giving the LLM a closed catalog of parts
and patch operations. The LLM could only rearrange what already existed, and new shapes needed
product code changes. Its last commit is `5d03ddd`. This rebuild keeps the loop that
makes the Blender workflow succeed (the LLM writes geometry code and looks at the result) and
replaces only the runtime.

The rebuild began on 26 September 2026 and, with the Measure tracks that followed, changed the
goals of the repository. It grew from a modeling tool into an asset catalog, a game platform
kit, and now a player progression system. [Measure history](measure/history.md) maps the 615
rebuild commits to 11 tracks. Project management moved to Measure on 28 September 2026.
