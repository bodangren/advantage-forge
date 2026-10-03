/**
 * Every game's 3D edition binds every model its views name: the manifest lists the keys
 * (`requiredModelBindings`) and the packs (`packs`), and the host builds the edition from them.
 * A key no pack holds would fall back to the legacy `models/` path, so this test fails first.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { editionModelIndex, GAME_LOADS, modelEditionOf, MODEL_PACK_VERSION, modelPackSchema, unboundModelKeys, type ModelPack } from '../../src/apk3d/contracts/index.js';
import { manifest as devourerSlime } from '../../src/games/devourer-slime/manifest.js';
import { CLEARING_MODELS } from '../../src/games/devourer-slime/view/clearing.js';
import { manifest as dragonFlight } from '../../src/games/dragon-flight/manifest.js';
import { FLIGHT_MODELS } from '../../src/games/dragon-flight/view/land.js';
import { manifest as dungeonLiberator } from '../../src/games/dungeon-liberator/manifest.js';
import { ROOM_MODELS } from '../../src/games/dungeon-liberator/view/room.js';
import { manifest as heroVsZombie } from '../../src/games/hero-vs-zombie/manifest.js';
import { CHURCHYARD_MODELS } from '../../src/games/hero-vs-zombie/view/churchyard.js';
import { manifest as labyrinth } from '../../src/games/labyrinth/manifest.js';
import { MAZE_MODELS } from '../../src/games/labyrinth/view/maze.js';
import { manifest as monsterEncounters } from '../../src/games/monster-encounters/manifest.js';
import { manifest as paladinsTwinSoul } from '../../src/games/paladins-twin-soul/manifest.js';
import { manifest as rpgBattle } from '../../src/games/rpg-battle/manifest.js';
import { manifest as villageGuardian } from '../../src/games/village-guardian/manifest.js';
import { VILLAGE_MODELS } from '../../src/games/village-guardian/view/village.js';
import { manifest as runeMatch } from '../../src/games/rune-match/manifest.js';
import { manifest as archersRevenge } from '../../src/games/archers-revenge/manifest.js';
import { manifest as astralMage } from '../../src/games/astral-mage/manifest.js';
import { CIRCLE_MODELS } from '../../src/games/astral-mage/view/circle.js';
import { manifest as spellweaversRun } from '../../src/games/spellweavers-run/manifest.js';
import { RUN_MODELS } from '../../src/games/spellweavers-run/view/land.js';
import { manifest as hauntedLibrary } from '../../src/games/haunted-library/manifest.js';
import { LIBRARY_MODELS } from '../../src/games/haunted-library/view/library.js';
import { manifest as shadowGateDungeon } from '../../src/games/shadow-gate-dungeon/manifest.js';
import { DUNGEON_MODELS } from '../../src/games/shadow-gate-dungeon/view/dungeon.js';
import { manifest as realmCarver } from '../../src/games/realm-carver/manifest.js';
import { REALM_MODELS } from '../../src/games/realm-carver/view/realm.js';
import { manifest as alchemistsSynthesis } from '../../src/games/alchemists-synthesis/manifest.js';
import { LAB_MODELS } from '../../src/games/alchemists-synthesis/view/lab.js';
import { manifest as enchantedLibrary } from '../../src/games/enchanted-library/manifest.js';
import { HALL_MODELS } from '../../src/games/enchanted-library/view/hall.js';
import { manifest as gryphonPatrol } from '../../src/games/gryphon-patrol/manifest.js';
import { SKY_MODELS } from '../../src/games/gryphon-patrol/view/sky.js';
import { manifest as magicDefense } from '../../src/games/magic-defense/manifest.js';
import { manifest as griffinSkyJoust } from '../../src/games/griffin-sky-joust/manifest.js';
import { SCENE_MODELS } from '../../src/games/griffin-sky-joust/view/scene.js';
import { manifest as abyssalWell } from '../../src/games/abyssal-well/manifest.js';
import { WELL_MODELS } from '../../src/games/abyssal-well/view/well.js';
import { manifest as runeForgeChamber } from '../../src/games/rune-forge-chamber/manifest.js';
import { FORGE_MODELS } from '../../src/games/rune-forge-chamber/view/forge.js';
import { manifest as dragonRider } from '../../src/games/dragon-rider/manifest.js';
import { RIDER_MODELS } from '../../src/games/dragon-rider/view/land.js';
import { manifest as griffinRidersEscape } from '../../src/games/griffin-riders-escape/manifest.js';
import { ESCAPE_MODELS } from '../../src/games/griffin-riders-escape/view/land.js';
import { manifest as castleDefense } from '../../src/games/castle-defense/manifest.js';
import { manifest as sorcererZiggurat } from '../../src/games/sorcerer-ziggurat/manifest.js';
import { ZIGGURAT_MODELS } from '../../src/games/sorcerer-ziggurat/view/ziggurat.js';
import { manifest as stormCastleTower } from '../../src/games/storm-castle-tower/manifest.js';
import { TOWER_MODELS } from '../../src/games/storm-castle-tower/view/tower.js';
import { manifest as potionRush } from '../../src/games/potion-rush/manifest.js';
import { SHOP_MODELS } from '../../src/games/potion-rush/view/shop.js';
import { HEROES } from '../../src/games/shared/battle/stage2d.js';
import { vaultModels } from '../../src/games/shared/battle/stage3d.js';
import { LOBBY_PACKS } from '../../src/host/lobby.js';

const readPack = (id: string): ModelPack => modelPackSchema.parse(JSON.parse(readFileSync(join(process.cwd(), 'demo', 'public', 'packs', id, MODEL_PACK_VERSION, 'pack.json'), 'utf8')));
const packsOf = (ids: readonly string[]): Record<string, ModelPack> => Object.fromEntries(ids.map((id) => [id, readPack(id)]));

/** Each game: its manifest and every model its views name. */
const GAMES = {
  labyrinth: { manifest: labyrinth, named: MAZE_MODELS },
  'potion-rush': { manifest: potionRush, named: SHOP_MODELS },
  'dragon-flight': { manifest: dragonFlight, named: FLIGHT_MODELS },
  'dungeon-liberator': { manifest: dungeonLiberator, named: ROOM_MODELS },
  'devourer-slime': { manifest: devourerSlime, named: CLEARING_MODELS },
  'hero-vs-zombie': { manifest: heroVsZombie, named: CHURCHYARD_MODELS },
  'monster-encounters': { manifest: monsterEncounters, named: vaultModels() },
  'village-guardian': { manifest: villageGuardian, named: VILLAGE_MODELS },
  'rune-match': { manifest: runeMatch, named: vaultModels() },
  'archers-revenge': { manifest: archersRevenge, named: vaultModels() },
  'astral-mage': { manifest: astralMage, named: CIRCLE_MODELS },
  'spellweavers-run': { manifest: spellweaversRun, named: RUN_MODELS },
  'haunted-library': { manifest: hauntedLibrary, named: LIBRARY_MODELS },
  'shadow-gate-dungeon': { manifest: shadowGateDungeon, named: DUNGEON_MODELS },
  'realm-carver': { manifest: realmCarver, named: REALM_MODELS },
  'alchemists-synthesis': { manifest: alchemistsSynthesis, named: LAB_MODELS },
  'enchanted-library': { manifest: enchantedLibrary, named: HALL_MODELS },
  'gryphon-patrol': { manifest: gryphonPatrol, named: SKY_MODELS },
  'magic-defense': { manifest: magicDefense, named: vaultModels() },
  'griffin-sky-joust': { manifest: griffinSkyJoust, named: SCENE_MODELS },
  'abyssal-well': { manifest: abyssalWell, named: WELL_MODELS },
  'rune-forge-chamber': { manifest: runeForgeChamber, named: FORGE_MODELS },
  'dragon-rider': { manifest: dragonRider, named: RIDER_MODELS },
  'griffin-riders-escape': { manifest: griffinRidersEscape, named: ESCAPE_MODELS },
  'castle-defense': { manifest: castleDefense, named: vaultModels() },
  'sorcerer-ziggurat': { manifest: sorcererZiggurat, named: ZIGGURAT_MODELS },
  'storm-castle-tower': { manifest: stormCastleTower, named: TOWER_MODELS },
  'rpg-battle': { manifest: rpgBattle, named: vaultModels() },
  'paladins-twin-soul': { manifest: paladinsTwinSoul, named: vaultModels() },
} as const;

describe('3D editions', () => {
  it.each(Object.entries(GAMES))('%s: the manifest lists every model the game names', (game, { manifest, named }) => {
    const load = GAME_LOADS[game]!;
    const wanted = new Set([...named, ...(load.models ?? []), ...(load.hero ? HEROES : [])]);
    expect([...wanted].filter((n) => !manifest.requiredModelBindings.includes(n))).toEqual([]);
  });

  it.each(Object.entries(GAMES))('%s: the edition binds every required model from the listed packs', (_game, { manifest }) => {
    const edition = modelEditionOf(packsOf(manifest.packs), manifest.requiredModelBindings);
    expect(unboundModelKeys(edition, manifest.requiredModelBindings)).toEqual([]);
    expect(Object.keys(edition.packs).every((id) => manifest.packs.includes(id))).toBe(true);
    const index = editionModelIndex(edition);
    expect(manifest.requiredModelBindings.filter((k) => !index.path(k))).toEqual([]);
  });

  it('the lobby packs hold the heroes and the brazier', () => {
    const edition = modelEditionOf(packsOf(LOBBY_PACKS), [...HEROES, 'brazier']);
    expect(editionModelIndex(edition).path('brazier')).toMatch(/^packs\/sunken-vault\/1\.0\.0\/brazier\.glb$/);
  });
});
