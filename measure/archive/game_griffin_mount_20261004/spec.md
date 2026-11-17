# The griffin replaces the tinted fire dragon in the griffin games

## Purpose

Three games show a griffin as the student's mount: Gryphon Patrol, Griffin Sky-Joust, and Griffin
Riders Escape. Until 2026-10-04 no griffin model existed, so each game loaded the fire dragon
(`dragon-fire`) and tinted it gold. The P2 monsters track built `assets/griffin.ts` (7.7, commit
d0c3d6b) with the clips the games play: fly (the idle loop), attack, hit, and roar, all in the air.

## Scope

- Forge games (`src/games/<game>/`): the 3D views load `griffin` without the tint, and the rider
  sits on the griffin's back; the 2D views bind `griffin.<clip>` sprite files; the manifests list
  the model and the files.
- Kit contract (`src/apk3d/contracts/model-pack.ts`): a pack holds the griffin, and the three
  `GAME_LOADS` rows name it.
- Outputs: the web-weight GLB (`scripts/demo-models.ts`), the model packs
  (`scripts/apk3d-models.ts`), the 2D sheets (`scripts/apk2d-sprites.ts griffin`) and the 2D pack
  (`scripts/apk2d-pack.ts`).
- Port: `port-kit.mjs`, `port-game.mjs` for the three games, and the pack files into
  `packages/game-cartridges-3d/assets/` on the monorepo branch `apk3d-games-port`.

Dragon Rider keeps the fire dragon: its rider rides a dragon.

## Acceptance criteria

- The three games show the griffin in 3D and in 2D; no game loads `dragon-fire` for the mount.
- The rider sits on the griffin's back in the fly loop, in 3D, at desktop and phone sizes.
- `pnpm test` and `pnpm typecheck` pass in Forge; the kit and the games tests pass in the monorepo.
- Each game stays inside its model budget (`scripts/apk3d-models.ts` reports no failure).
- `port-game.mjs --check` and `port-kit.mjs --check` show no difference after the port.

## Open decisions

None. Push and the pull request stay with the owner (the existing waiting list).
