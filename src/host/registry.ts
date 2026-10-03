/**
 * The games the selector shows. A playable game has its manifest (small, for the story rule) and
 * a lazy loader for its cartridge code, so each game downloads only when chosen. A game that is
 * not built yet shows as "coming soon".
 */
import { isCompatible, type Cartridge3DManifest, type StoryInput } from '../apk3d/contracts/index.js';
import type { Cartridge } from '../apk3d/factory/index.js';
import { manifest as monsterEncounters } from '../games/monster-encounters/manifest.js';
import monsterEncountersStrings from '../games/monster-encounters/strings.en.js';
import { manifest as rpgBattle } from '../games/rpg-battle/manifest.js';
import rpgBattleStrings from '../games/rpg-battle/strings.en.js';
import { manifest as paladinsTwinSoul } from '../games/paladins-twin-soul/manifest.js';
import paladinsTwinSoulStrings from '../games/paladins-twin-soul/strings.en.js';
import { manifest as villageGuardian } from '../games/village-guardian/manifest.js';
import villageGuardianStrings from '../games/village-guardian/strings.en.js';
import { manifest as archersRevenge } from '../games/archers-revenge/manifest.js';
import archersRevengeStrings from '../games/archers-revenge/strings.en.js';
import { manifest as astralMage } from '../games/astral-mage/manifest.js';
import astralMageStrings from '../games/astral-mage/strings.en.js';
import { manifest as spellweaversRun } from '../games/spellweavers-run/manifest.js';
import spellweaversRunStrings from '../games/spellweavers-run/strings.en.js';
import { manifest as hauntedLibrary } from '../games/haunted-library/manifest.js';
import hauntedLibraryStrings from '../games/haunted-library/strings.en.js';
import { manifest as shadowGateDungeon } from '../games/shadow-gate-dungeon/manifest.js';
import shadowGateDungeonStrings from '../games/shadow-gate-dungeon/strings.en.js';
import { manifest as realmCarver } from '../games/realm-carver/manifest.js';
import realmCarverStrings from '../games/realm-carver/strings.en.js';
import { manifest as alchemistsSynthesis } from '../games/alchemists-synthesis/manifest.js';
import alchemistsSynthesisStrings from '../games/alchemists-synthesis/strings.en.js';
import { manifest as enchantedLibrary } from '../games/enchanted-library/manifest.js';
import enchantedLibraryStrings from '../games/enchanted-library/strings.en.js';
import { manifest as gryphonPatrol } from '../games/gryphon-patrol/manifest.js';
import gryphonPatrolStrings from '../games/gryphon-patrol/strings.en.js';
import { manifest as magicDefense } from '../games/magic-defense/manifest.js';
import magicDefenseStrings from '../games/magic-defense/strings.en.js';
import { manifest as runeMatch } from '../games/rune-match/manifest.js';
import runeMatchStrings from '../games/rune-match/strings.en.js';
import { manifest as labyrinth } from '../games/labyrinth/manifest.js';
import labyrinthStrings from '../games/labyrinth/strings.en.js';
import { manifest as potionRush } from '../games/potion-rush/manifest.js';
import potionRushStrings from '../games/potion-rush/strings.en.js';
import { manifest as dragonFlight } from '../games/dragon-flight/manifest.js';
import dragonFlightStrings from '../games/dragon-flight/strings.en.js';
import { manifest as dungeonLiberator } from '../games/dungeon-liberator/manifest.js';
import dungeonLiberatorStrings from '../games/dungeon-liberator/strings.en.js';
import { manifest as devourerSlime } from '../games/devourer-slime/manifest.js';
import devourerSlimeStrings from '../games/devourer-slime/strings.en.js';
import { manifest as heroVsZombie } from '../games/hero-vs-zombie/manifest.js';
import heroVsZombieStrings from '../games/hero-vs-zombie/strings.en.js';

export interface GameEntry {
  id: string;
  icon: string;
  /** Tile colors (top, bottom). */
  tint: [string, string];
  /** Catalog keys of the card text. */
  titleKey: string;
  pitchKey: string;
  manifest?: Cartridge3DManifest;
  load?: () => Promise<Cartridge>;
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
    id: 'rune-match',
    icon: '🔮',
    tint: ['#a78bfa', '#4c1d95'],
    titleKey: 'runeMatch.title',
    pitchKey: 'runeMatch.pitch',
    manifest: runeMatch,
    load: () => import('../games/rune-match/index.js').then((m) => m.cartridge),
  },
  {
    id: 'labyrinth',
    icon: '🏰',
    tint: ['#f59e0b', '#78350f'],
    titleKey: 'labyrinth.title',
    pitchKey: 'labyrinth.pitch',
    manifest: labyrinth,
    load: () => import('../games/labyrinth/index.js').then((m) => m.cartridge),
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
  {
    id: 'hero-vs-zombie',
    icon: '🧟',
    tint: ['#64748b', '#1e293b'],
    titleKey: 'heroVsZombie.title',
    pitchKey: 'heroVsZombie.pitch',
    manifest: heroVsZombie,
    load: () => import('../games/hero-vs-zombie/index.js').then((m) => m.cartridge),
  },
  {
    id: 'rpg-battle',
    icon: '🗡️',
    tint: ['#ef4444', '#7f1d1d'],
    titleKey: 'rpgBattle.title',
    pitchKey: 'rpgBattle.pitch',
    manifest: rpgBattle,
    load: () => import('../games/rpg-battle/index.js').then((m) => m.cartridge),
  },
  {
    id: 'paladins-twin-soul',
    icon: '👻',
    tint: ['#f59e0b', '#7c2d12'],
    titleKey: 'paladinsTwinSoul.title',
    pitchKey: 'paladinsTwinSoul.pitch',
    manifest: paladinsTwinSoul,
    load: () => import('../games/paladins-twin-soul/index.js').then((m) => m.cartridge),
  },
  {
    id: 'village-guardian',
    icon: '🛡️',
    tint: ['#86efac', '#166534'],
    titleKey: 'villageGuardian.title',
    pitchKey: 'villageGuardian.pitch',
    manifest: villageGuardian,
    load: () => import('../games/village-guardian/index.js').then((m) => m.cartridge),
  },
  {
    id: 'archers-revenge',
    icon: '🏹',
    tint: ['#22c55e', '#14532d'],
    titleKey: 'archersRevenge.title',
    pitchKey: 'archersRevenge.pitch',
    manifest: archersRevenge,
    load: () => import('../games/archers-revenge/index.js').then((m) => m.cartridge),
  },
  {
    id: 'astral-mage',
    icon: '🔮',
    tint: ['#c4b5fd', '#4c1d95'],
    titleKey: 'astralMage.title',
    pitchKey: 'astralMage.pitch',
    manifest: astralMage,
    load: () => import('../games/astral-mage/index.js').then((m) => m.cartridge),
  },
  {
    id: 'spellweavers-run',
    icon: '🪄',
    tint: ['#a78bfa', '#4c1d95'],
    titleKey: 'spellweaversRun.title',
    pitchKey: 'spellweaversRun.pitch',
    manifest: spellweaversRun,
    load: () => import('../games/spellweavers-run/index.js').then((m) => m.cartridge),
  },
  {
    id: 'haunted-library',
    icon: '📚',
    tint: ['#4b3a73', '#1e1535'],
    titleKey: 'hauntedLibrary.title',
    pitchKey: 'hauntedLibrary.pitch',
    manifest: hauntedLibrary,
    load: () => import('../games/haunted-library/index.js').then((m) => m.cartridge),
  },
  {
    id: 'shadow-gate-dungeon',
    icon: '🔮',
    tint: ['#a78bfa', '#312e81'],
    titleKey: 'shadowGateDungeon.title',
    pitchKey: 'shadowGateDungeon.pitch',
    manifest: shadowGateDungeon,
    load: () => import('../games/shadow-gate-dungeon/index.js').then((m) => m.cartridge),
  },
  {
    id: 'realm-carver',
    icon: '🗺️',
    tint: ['#a78bfa', '#4c1d95'],
    titleKey: 'realmCarver.title',
    pitchKey: 'realmCarver.pitch',
    manifest: realmCarver,
    load: () => import('../games/realm-carver/index.js').then((m) => m.cartridge),
  },
  {
    id: 'alchemists-synthesis',
    icon: '🧪',
    tint: ['#ffb454', '#7c4a12'],
    titleKey: 'alchemistsSynthesis.title',
    pitchKey: 'alchemistsSynthesis.pitch',
    manifest: alchemistsSynthesis,
    load: () => import('../games/alchemists-synthesis/index.js').then((m) => m.cartridge),
  },
  {
    id: 'enchanted-library',
    icon: '📖',
    tint: ['#7c3aed', '#1e1535'],
    titleKey: 'enchantedLibrary.title',
    pitchKey: 'enchantedLibrary.pitch',
    manifest: enchantedLibrary,
    load: () => import('../games/enchanted-library/index.js').then((m) => m.cartridge),
  },
  {
    id: 'gryphon-patrol',
    icon: '🦅',
    tint: ['#f5b942', '#7c4a12'],
    titleKey: 'gryphonPatrol.title',
    pitchKey: 'gryphonPatrol.pitch',
    manifest: gryphonPatrol,
    load: () => import('../games/gryphon-patrol/index.js').then((m) => m.cartridge),
  },
  {
    id: 'magic-defense',
    icon: '🏰',
    tint: ['#a78bfa', '#312e81'],
    titleKey: 'magicDefense.title',
    pitchKey: 'magicDefense.pitch',
    manifest: magicDefense,
    load: () => import('../games/magic-defense/index.js').then((m) => m.cartridge),
  },
];

/** The English catalogs of every game (the host merges them with its own). */
export const GAME_STRINGS = [monsterEncountersStrings, runeMatchStrings, labyrinthStrings, potionRushStrings, dragonFlightStrings, dungeonLiberatorStrings, devourerSlimeStrings, heroVsZombieStrings, rpgBattleStrings, paladinsTwinSoulStrings, villageGuardianStrings, archersRevengeStrings, astralMageStrings, spellweaversRunStrings, hauntedLibraryStrings, shadowGateDungeonStrings, realmCarverStrings, alchemistsSynthesisStrings, enchantedLibraryStrings, gryphonPatrolStrings, magicDefenseStrings];

export const playable = (g: GameEntry): boolean => !!g.load && !!g.manifest;

/** A playable game fits a story when the story has the game's level and enough items. */
export function fits(g: GameEntry, story: StoryInput | null): boolean {
  if (!playable(g)) return false;
  return !story || isCompatible(g.manifest!, story);
}

export const gameById = (id: string): GameEntry | undefined => GAMES.find((g) => g.id === id);
