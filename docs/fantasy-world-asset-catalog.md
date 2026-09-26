# Fantasy world production catalog

This plan has two lists. The [asset catalog](./fantasy-world-asset-catalog.tsv) has 856 buildable 3D targets. The [scene blueprint list](./fantasy-world-scene-blueprints.tsv) has 100 places that need map mockups. A place such as a hamlet is an assembly of assets, not one asset.

## Source and scope

The plan draws on the APK's exact 75-file pack contract and its standard asset library. APK covers actors, tiles, props, items, effects, interface art, backgrounds, audio, and fonts. Fantasy Asset Forge builds 3D models, animations, and derived pixel sprites. This map plan does not assume automatic map parsing, audio, interface art, or complete autotile sheets.

## Asset list

Each asset row has a stable `id`, a `family`, a `group`, a `priority`, and a `kind`. The ID uses `family/group/name`. One row names one reusable source model or geometry effect. Variants stay under the source ID.

| Family | Buildable targets | Examples |
|---|---:|---|
| Heroes | 51 | Knight, wizard, archer |
| NPCs | 114 | Farmer, shopkeeper, ferryman |
| Enemies | 69 | Bandit, skeleton, stone golem |
| Monsters | 84 | Slime, griffin, dragon |
| Wildlife | 63 | Deer, raven, warhorse |
| Architecture | 100 | Cottage, door, road section, river bend |
| Nature | 47 | Oak tree, bramble, boulder |
| Props | 121 | Chest, table, anvil |
| Equipment | 100 | Sword, staff, helmet |
| Items | 59 | Potion, iron ore, ancient key |
| Vehicles | 15 | Wagon, longship, airship |
| Effects geometry | 33 | Slash arc, fireball, mist |
| **Total** | **856** | |

The architecture family includes 29 new landscape parts. These parts cover ground, roads, paths, fields, water edges, cliffs, and slopes. They give map blueprints reusable pieces to request.

## Scene blueprint list

A blueprint row names a place to design. It is not a forge build command. The list covers 13 settlements, 32 civic places, 34 adventure sites, and 21 wilderness scenes. The hamlet now has [paired mockups](./hamlet-mockups/README.md). The other rows have `mockup-needed` status.

| Scene type | Examples |
|---|---|
| Settlement | Hamlet, village, port city, underground city |
| Civic place | Tavern, market square, library, castle |
| Adventure site | Dungeon, crypt, wizard tower, treasure vault |
| Wilderness scene | Forest, marsh, mountain pass, oasis |

## Map-to-assets workflow

1. Make a labeled map mockup for one scene.
2. Mark the map scale, north direction, paths, boundaries, and entrances.
3. Label each visible structure, terrain part, plant group, and prop cluster.
4. Match each label to an existing asset ID.
5. Add a new asset ID only when the catalog lacks a required component.
6. Record the quantity, position, rotation, and variant for each instance.
7. Build missing components in the forge.
8. Assemble the scene from the generated GLBs or sprites.
9. Compare the assembled scene with the mockup.

The map is a design input. A future parser could assist with steps 3 through 6. The current forge does not parse mockup maps automatically.

### Example: hamlet map

A hamlet mockup might show eight cottages, one well, a small market, a road, a stream, and tree clusters. Its build list could be:

| Component asset | Example quantity | Use |
|---|---:|---|
| `architecture/structure/cottage` | 8 | Reuse with roof and wall variants. |
| `architecture/structure/well` | 1 | Place at the central crossing. |
| `architecture/structure/shop-stall` | 2 | Form the market. |
| `architecture/structure/barn` | 1 | Serve the farm edge. |
| `architecture/building-parts/fence` | 12 | Bound yards and fields. |
| `architecture/landscape-parts/dirt-road-straight` | 16 | Form road runs. |
| `architecture/landscape-parts/dirt-road-corner` | 4 | Turn the road. |
| `architecture/landscape-parts/river-straight` | 6 | Form the stream. |
| `architecture/landscape-parts/river-bend` | 2 | Turn the stream. |
| `nature/trees/oak-tree` | 9 | Form tree clusters. |
| `props/world/signpost` | 2 | Mark routes. |
| `props/containers/barrel` | 6 | Dress the market and yards. |

These quantities illustrate the method. The mockup determines the final quantities and positions. A component appears once in the asset catalog, even when a scene uses it many times.

## Production rules

Build and review the named 3D source before deriving sprites. Check front, side, back, and three-quarter silhouettes. Record scale, pivot, bounds, materials, and intended use. Add collision and interaction points when a game needs them.

Use variants only when they improve recognition or gameplay. Useful axes include culture, material, equipment tier, damage, biome, season, and magical state. Keep the source ID stable. Do not generate every combination.

Keep gameplay roles separate from visual sources. One shopkeeper role can use different characters and props. One source model can serve several game roles.

## Companion backlog

APK also needs tile contracts, interface art, portraits, layered backgrounds, audio, music, and fonts. These need separate production plans. The forge supports actor animation, and source models can supply renders for several other outputs.
