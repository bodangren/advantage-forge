/**
 * Every model a game names resolves in the packs the game loads: a pack missing from a game's
 * list would fall back to the legacy `models/` path and break once that folder is gone.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildModelIndex, GAME_LOADS, MODEL_PACK_IDS, MODEL_PACK_VERSION, modelPackSchema } from '../../src/apk3d/contracts/index.js';
import { CLEARING_MODELS, CLEARING_PACKS } from '../../src/games/devourer-slime/view/clearing.js';
import { FLIGHT_MODELS, FLIGHT_PACKS } from '../../src/games/dragon-flight/view/land.js';
import { ROOM_MODELS, ROOM_PACKS } from '../../src/games/dungeon-liberator/view/room.js';
import { CHURCHYARD_MODELS, CHURCHYARD_PACKS } from '../../src/games/hero-vs-zombie/view/churchyard.js';
import { MAZE_MODELS, MAZE_PACKS } from '../../src/games/labyrinth/view/maze.js';
import { SHOP_MODELS, SHOP_PACKS } from '../../src/games/potion-rush/view/shop.js';
import { BATTLE_PACKS, vaultModels } from '../../src/games/shared/battle/stage3d.js';
import { HEROES } from '../../src/games/shared/battle/stage2d.js';
import { LOBBY_PACKS } from '../../src/host/lobby.js';

const read = (id: string) => modelPackSchema.parse(JSON.parse(readFileSync(join(process.cwd(), 'demo', 'public', 'packs', id, MODEL_PACK_VERSION, 'pack.json'), 'utf8')));
const all = Object.fromEntries(MODEL_PACK_IDS.map((id) => [id, read(id)]));
const indexOf = (ids: readonly string[]) => buildModelIndex(ids.map((id) => all[id]!));

/** Each game: the packs its view loads, and every model its view or core names. */
const GAMES: Record<string, { packs: readonly string[]; models: readonly string[] }> = {
  labyrinth: { packs: MAZE_PACKS, models: [...MAZE_MODELS, ...(GAME_LOADS.labyrinth!.models ?? [])] },
  'potion-rush': { packs: SHOP_PACKS, models: [...SHOP_MODELS, ...(GAME_LOADS['potion-rush']!.models ?? []), ...HEROES] },
  'dragon-flight': { packs: FLIGHT_PACKS, models: [...FLIGHT_MODELS, ...(GAME_LOADS['dragon-flight']!.models ?? [])] },
  'dungeon-liberator': { packs: ROOM_PACKS, models: [...ROOM_MODELS, ...(GAME_LOADS['dungeon-liberator']!.models ?? []), ...HEROES] },
  'devourer-slime': { packs: CLEARING_PACKS, models: [...CLEARING_MODELS, ...(GAME_LOADS['devourer-slime']!.models ?? [])] },
  'hero-vs-zombie': { packs: CHURCHYARD_PACKS, models: [...CHURCHYARD_MODELS, ...(GAME_LOADS['hero-vs-zombie']!.models ?? []), ...HEROES] },
  'monster-encounters': { packs: BATTLE_PACKS, models: [...vaultModels(), ...HEROES, ...(GAME_LOADS['monster-encounters']!.models ?? [])] },
  lobby: { packs: LOBBY_PACKS, models: [...HEROES, 'brazier'] },
};

describe('model pack bindings', () => {
  it.each(Object.entries(GAMES))('%s: every model resolves in its packs', (_game, { packs, models }) => {
    const index = indexOf(packs);
    const unresolved = [...new Set(models)].filter((name) => !index.path(name));
    expect(unresolved).toEqual([]);
  });
});
