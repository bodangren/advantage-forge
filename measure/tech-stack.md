# Technology stack

The migration preserves the existing stack and source layout.

| Technology | Purpose | Reason |
| --- | --- | --- |
| TypeScript and Node.js | Asset definitions, CLI, games, and tools | One language connects authoring and runtime code. |
| SDF geometry | Source modeling | Authors can describe new shapes without a closed part catalog. |
| three.js | GLB scenes and 3D views | The same models serve review and games. |
| Phaser | 2D game views | The fallback uses the APK renderer contract. |
| xatlas and meshoptimizer | UV layout and geometry reduction | Generated models need textures and practical geometry. |
| Zod | Runtime contracts | Inputs and cartridge data need validation. |
| Vite | Local views and builds | Existing tools use its development server and bundling. |
| Vitest and Playwright | Rules tests and browser checks | Both deterministic behavior and real input need evidence. |
| pnpm | Dependency management | The repository declares its package manager in package.json. |

Exact versions remain in [package.json](../package.json) and the lockfile.
The migration adds no runtime dependencies.

## Boundaries

Forge authoring code stays in `src/`, with asset definitions in `assets/` and scene definitions in `scenes/`.
The game kit stays in `src/apk3d/`. Cartridges stay in `src/games/`, and the standalone host stays in `src/host/`.
The existing import tests enforce game and kit boundaries.
One documented exception imports the vault scene until the model-pack track removes it.

## Architecture tooling

Measure reuses the existing boundary test instead of installing a second boundary framework.
The generator inventories current files without moving them.
Graph-aware mode remains disabled. A later track can enable it when the graph tool and maintenance policy exist.
