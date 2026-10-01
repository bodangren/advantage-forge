# Runtime entrypoints

This report lists source entrypoints. It does not define URL routes.

## Host applications

- APK host: [`src/host/main.ts`](../../src/host/main.ts)
- Asset viewer: [`src/viewer/main.ts`](../../src/viewer/main.ts)
- Scene viewer: [`src/scene/main.ts`](../../src/scene/main.ts)
- Showcase: [`src/showcase/main.ts`](../../src/showcase/main.ts)

## Game cartridges

- devourer-slime: [`src/games/devourer-slime/index.ts`](../../src/games/devourer-slime/index.ts), [`src/games/devourer-slime/manifest.ts`](../../src/games/devourer-slime/manifest.ts); registered by the host.
- dragon-flight: [`src/games/dragon-flight/index.ts`](../../src/games/dragon-flight/index.ts), [`src/games/dragon-flight/manifest.ts`](../../src/games/dragon-flight/manifest.ts); registered by the host.
- dungeon-liberator: [`src/games/dungeon-liberator/index.ts`](../../src/games/dungeon-liberator/index.ts), [`src/games/dungeon-liberator/manifest.ts`](../../src/games/dungeon-liberator/manifest.ts); registered by the host.
- hero-vs-zombie: [`src/games/hero-vs-zombie/index.ts`](../../src/games/hero-vs-zombie/index.ts), [`src/games/hero-vs-zombie/manifest.ts`](../../src/games/hero-vs-zombie/manifest.ts); registered by the host.
- labyrinth: no cartridge entrypoint; not registered by the host.
- monster-encounters: [`src/games/monster-encounters/index.ts`](../../src/games/monster-encounters/index.ts), [`src/games/monster-encounters/manifest.ts`](../../src/games/monster-encounters/manifest.ts); registered by the host.
- potion-rush: [`src/games/potion-rush/index.ts`](../../src/games/potion-rush/index.ts), [`src/games/potion-rush/manifest.ts`](../../src/games/potion-rush/manifest.ts); registered by the host.
- rune-match: no cartridge entrypoint; not registered by the host.
