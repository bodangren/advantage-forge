/**
 * The games the selector shows. A playable game has its manifest (small, for the story rule) and
 * a lazy loader for its cartridge code, so each game downloads only when chosen. A game that is
 * not built yet shows as "coming soon".
 */
import { isCompatible, type Cartridge3DManifest, type StoryInput } from '../apk3d/contracts/index.js';
import type { ThreeCartridge } from '../apk3d/factory/index.js';
import { manifest as monsterEncounters } from '../games/monster-encounters/manifest.js';
import monsterEncountersStrings from '../games/monster-encounters/strings.en.js';
import { manifest as potionRush } from '../games/potion-rush/manifest.js';
import potionRushStrings from '../games/potion-rush/strings.en.js';
import { manifest as dragonFlight } from '../games/dragon-flight/manifest.js';
import dragonFlightStrings from '../games/dragon-flight/strings.en.js';
import { manifest as dungeonLiberator } from '../games/dungeon-liberator/manifest.js';
import dungeonLiberatorStrings from '../games/dungeon-liberator/strings.en.js';
import { manifest as devourerSlime } from '../games/devourer-slime/manifest.js';
import devourerSlimeStrings from '../games/devourer-slime/strings.en.js';

export interface GameEntry {
  id: string;
  icon: string;
  /** Tile colors (top, bottom). */
  tint: [string, string];
  /** Catalog keys of the card text. */
  titleKey: string;
  pitchKey: string;
  manifest?: Cartridge3DManifest;
  load?: () => Promise<ThreeCartridge>;
}

export const GAMES: GameEntry[] = [
  {
    id: 'monster-encounters',
    icon: '⚔️',
    tint: ['#8b5cf6', '#4c1d95'],
    titleKey: 'monsterEncounters.title',
    pitchKey: 'monsterEncounters.pitch',
    manifest: monsterEncounters,
    load: () => import('../games/monster-encounters/index.js').then((m) => m.cartridge),
  },
  {
    id: 'potion-rush',
    icon: '🧪',
    tint: ['#34d399', '#065f46'],
    titleKey: 'potionRush.title',
    pitchKey: 'potionRush.pitch',
    manifest: potionRush,
    load: () => import('../games/potion-rush/index.js').then((m) => m.cartridge),
  },
  {
    id: 'dragon-flight',
    icon: '🐉',
    tint: ['#fb923c', '#9a3412'],
    titleKey: 'dragonFlight.title',
    pitchKey: 'dragonFlight.pitch',
    manifest: dragonFlight,
    load: () => import('../games/dragon-flight/index.js').then((m) => m.cartridge),
  },
  {
    id: 'dungeon-liberator',
    icon: '🗝️',
    tint: ['#60a5fa', '#1e3a8a'],
    titleKey: 'dungeonLiberator.title',
    pitchKey: 'dungeonLiberator.pitch',
    manifest: dungeonLiberator,
    load: () => import('../games/dungeon-liberator/index.js').then((m) => m.cartridge),
  },
  {
    id: 'devourer-slime',
    icon: '🟢',
    tint: ['#a3e635', '#3f6212'],
    titleKey: 'devourerSlime.title',
    pitchKey: 'devourerSlime.pitch',
    manifest: devourerSlime,
    load: () => import('../games/devourer-slime/index.js').then((m) => m.cartridge),
  },
];

/** The English catalogs of every game (the host merges them with its own). */
export const GAME_STRINGS = [monsterEncountersStrings, potionRushStrings, dragonFlightStrings, dungeonLiberatorStrings, devourerSlimeStrings];

export const playable = (g: GameEntry): boolean => !!g.load && !!g.manifest;

/** A playable game fits a story when the story has the game's level and enough items. */
export function fits(g: GameEntry, story: StoryInput | null): boolean {
  if (!playable(g)) return false;
  return !story || isCompatible(g.manifest!, story);
}

export const gameById = (id: string): GameEntry | undefined => GAMES.find((g) => g.id === id);
