/** Red pin for track old_browser_builtins_20261122 (T1): the deep-copy helper contract.
 *
 * Case 1 builds the start snapshot of each of the 29 games through its own
 * `tests/games/<game>/helpers.ts` and records the observed value-type set first. It imports no
 * helper module, so it runs at HEAD before `src/apk3d/sim/copy.ts` exists. Cases 2 to 4 import
 * `../../src/apk3d/sim/copy.js` inside the case, so each fails inside the case while the module
 * is absent, with no collection, syntax, or file-scope import error.
 */
import { expect, it } from 'vitest';
import { createQuest } from '../../src/games/monster-encounters/core/quest.js';
import { makeStory } from '../games/monster-encounters/helpers.js';
import * as gAbyssalWell from '../games/abyssal-well/helpers.js';
import * as gAlchemistsSynthesis from '../games/alchemists-synthesis/helpers.js';
import * as gArchersRevenge from '../games/archers-revenge/helpers.js';
import * as gAstralMage from '../games/astral-mage/helpers.js';
import * as gCastleDefense from '../games/castle-defense/helpers.js';
import * as gDevourerSlime from '../games/devourer-slime/helpers.js';
import * as gDragonFlight from '../games/dragon-flight/helpers.js';
import * as gDragonRider from '../games/dragon-rider/helpers.js';
import * as gDungeonLiberator from '../games/dungeon-liberator/helpers.js';
import * as gEnchantedLibrary from '../games/enchanted-library/helpers.js';
import * as gGriffinRidersEscape from '../games/griffin-riders-escape/helpers.js';
import * as gGriffinSkyJoust from '../games/griffin-sky-joust/helpers.js';
import * as gGryphonPatrol from '../games/gryphon-patrol/helpers.js';
import * as gHauntedLibrary from '../games/haunted-library/helpers.js';
import * as gHeroVsZombie from '../games/hero-vs-zombie/helpers.js';
import * as gLabyrinth from '../games/labyrinth/helpers.js';
import * as gMagicDefense from '../games/magic-defense/helpers.js';
import * as gPaladinsTwinSoul from '../games/paladins-twin-soul/helpers.js';
import * as gPotionRush from '../games/potion-rush/helpers.js';
import * as gRealmCarver from '../games/realm-carver/helpers.js';
import * as gRpgBattle from '../games/rpg-battle/helpers.js';
import * as gRuneForgeChamber from '../games/rune-forge-chamber/helpers.js';
import * as gRuneMatch from '../games/rune-match/helpers.js';
import * as gShadowGateDungeon from '../games/shadow-gate-dungeon/helpers.js';
import * as gSorcererZiggurat from '../games/sorcerer-ziggurat/helpers.js';
import * as gSpellweaversRun from '../games/spellweavers-run/helpers.js';
import * as gStormCastleTower from '../games/storm-castle-tower/helpers.js';
import * as gVillageGuardian from '../games/village-guardian/helpers.js';

type Snapshot = { state: unknown };

const GAMES: Array<{ name: string; create: () => Snapshot }> = [
  { name: 'abyssal-well', create: gAbyssalWell.create },
  { name: 'alchemists-synthesis', create: gAlchemistsSynthesis.create },
  { name: 'archers-revenge', create: gArchersRevenge.create },
  { name: 'astral-mage', create: gAstralMage.create },
  { name: 'castle-defense', create: gCastleDefense.create },
  { name: 'devourer-slime', create: gDevourerSlime.create },
  { name: 'dragon-flight', create: gDragonFlight.create },
  { name: 'dragon-rider', create: gDragonRider.create },
  { name: 'dungeon-liberator', create: gDungeonLiberator.create },
  { name: 'enchanted-library', create: gEnchantedLibrary.create },
  { name: 'griffin-riders-escape', create: gGriffinRidersEscape.create },
  { name: 'griffin-sky-joust', create: gGriffinSkyJoust.create },
  { name: 'gryphon-patrol', create: gGryphonPatrol.create },
  { name: 'haunted-library', create: gHauntedLibrary.create },
  { name: 'hero-vs-zombie', create: gHeroVsZombie.create },
  { name: 'labyrinth', create: gLabyrinth.create },
  { name: 'magic-defense', create: gMagicDefense.create },
  { name: 'monster-encounters', create: () => createQuest(makeStory(), { seed: 7, helper: false }) },
  { name: 'paladins-twin-soul', create: gPaladinsTwinSoul.create },
  { name: 'potion-rush', create: gPotionRush.create },
  { name: 'realm-carver', create: gRealmCarver.create },
  { name: 'rpg-battle', create: gRpgBattle.create },
  { name: 'rune-forge-chamber', create: gRuneForgeChamber.create },
  { name: 'rune-match', create: gRuneMatch.create },
  { name: 'shadow-gate-dungeon', create: gShadowGateDungeon.create },
  { name: 'sorcerer-ziggurat', create: gSorcererZiggurat.create },
  { name: 'spellweavers-run', create: gSpellweaversRun.create },
  { name: 'storm-castle-tower', create: gStormCastleTower.create },
  { name: 'village-guardian', create: gVillageGuardian.create },
];

const ALLOWED = new Set(['plain-object', 'array', 'string', 'number', 'boolean', 'null', 'undefined']);

/** Every value kind reachable from the root. Anything else reports as `other:<tag>`. */
function kindsOf(value: unknown): Set<string> {
  const kinds = new Set<string>();
  const seen = new Set<object>();
  const visit = (node: unknown): void => {
    if (node === null) {
      kinds.add('null');
      return;
    }
    const type = typeof node;
    if (type !== 'object') {
      kinds.add(type);
      return;
    }
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) {
      kinds.add('array');
      for (const item of node) visit(item);
      return;
    }
    const proto = Object.getPrototypeOf(node);
    if (proto === Object.prototype || proto === null) {
      kinds.add('plain-object');
      for (const key of Object.keys(node)) visit((node as Record<string, unknown>)[key]);
      return;
    }
    kinds.add(`other:${Object.prototype.toString.call(node)}`);
  };
  visit(value);
  return kinds;
}

it('state types: every game snapshot holds only the allowed plain-data kinds', () => {
  expect(GAMES).toHaveLength(29);
  const failures: string[] = [];
  for (const game of GAMES) {
    const kinds = kindsOf(game.create().state);
    console.log(`state types ${game.name}: ${[...kinds].sort().join(', ')}`);
    const extra = [...kinds].filter((kind) => !ALLOWED.has(kind));
    if (extra.length > 0) failures.push(`${game.name}: unexpected kinds ${extra.sort().join(', ')}`);
  }
  expect(failures).toEqual([]);
});

it('equal values: a copied snapshot is toEqual its source, for each of the 29 games', async () => {
  const { deepCopy } = (await import('../../src/apk3d/sim/copy.js')) as unknown as {
    deepCopy: <T>(value: T) => T;
  };
  for (const game of GAMES) {
    const source = game.create().state;
    expect(deepCopy(source), game.name).toEqual(source);
  }
});

type Mutation = { path: Array<string | number>; kind: 'key' | 'push' };

function readPath(root: unknown, path: Array<string | number>): unknown {
  let node = root;
  for (const key of path) node = (node as Record<string | number, unknown>)[key as string];
  return node;
}

/** Finds a nested container in the copy, marks it, and reports how it was marked. */
function mutateNested(copy: unknown): Mutation {
  const stack: Array<{ node: unknown; path: Array<string | number> }> = [{ node: copy, path: [] }];
  while (stack.length > 0) {
    const { node, path } = stack.pop()!;
    if (node !== null && typeof node === 'object') {
      if (path.length >= 1) {
        if (Array.isArray(node)) {
          node.push('__red_probe__');
          return { path, kind: 'push' };
        }
        (node as Record<string, unknown>).__red_probe__ = true;
        return { path, kind: 'key' };
      }
      for (const key of Object.keys(node)) {
        stack.push({ node: (node as Record<string, unknown>)[key], path: [...path, key] });
      }
    }
  }
  throw new Error('no nested object or array to mutate');
}

it('no shared reference: changing a nested copy value leaves the source unchanged', async () => {
  const { deepCopy } = (await import('../../src/apk3d/sim/copy.js')) as unknown as {
    deepCopy: <T>(value: T) => T;
  };
  for (const game of GAMES) {
    const source = game.create().state;
    const copy = deepCopy(source);
    const mutation = mutateNested(copy);
    const sourceNode = readPath(source, mutation.path);
    if (mutation.kind === 'key') {
      expect(
        (sourceNode as Record<string, unknown>).__red_probe__,
        `${game.name} source changed`,
      ).toBeUndefined();
    } else {
      expect((sourceNode as unknown[]).length, `${game.name} source changed`).toBe(
        (readPath(copy, mutation.path) as unknown[]).length - 1,
      );
    }
  }
});

it('type probe: maps, sets, dates, buffers and special numbers copy by value; uncopyables throw', async () => {
  const { deepCopy } = (await import('../../src/apk3d/sim/copy.js')) as unknown as {
    deepCopy: <T>(value: T) => T;
  };
  const buffer = new ArrayBuffer(8);
  new Uint8Array(buffer).set([1, 2, 3, 4, 5, 6, 7, 8]);
  const fixture = {
    map: new Map<string, unknown>([['a', { n: 1 }]]),
    set: new Set([1, 2, 3]),
    date: new Date('2026-01-02T03:04:05.000Z'),
    bytes: new Uint8Array([1, 2, 3]),
    buffer,
    undef: undefined as unknown as string,
    nan: NaN,
    inf: Infinity,
    ninf: -Infinity,
    negZero: -0,
  };
  const copy = deepCopy(fixture);
  expect(copy.map).not.toBe(fixture.map);
  expect([...copy.map.entries()]).toEqual([...fixture.map.entries()]);
  expect(copy.map.get('a')).not.toBe(fixture.map.get('a'));
  expect(copy.set).not.toBe(fixture.set);
  expect([...copy.set]).toEqual([1, 2, 3]);
  expect(copy.date).not.toBe(fixture.date);
  expect(copy.date.getTime()).toBe(fixture.date.getTime());
  expect(copy.bytes).not.toBe(fixture.bytes);
  expect(copy.bytes).toBeInstanceOf(Uint8Array);
  expect([...copy.bytes]).toEqual([1, 2, 3]);
  expect(copy.buffer).not.toBe(fixture.buffer);
  expect([...new Uint8Array(copy.buffer)]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  expect('undef' in copy).toBe(true);
  expect(copy.undef).toBeUndefined();
  expect(copy.nan).toBeNaN();
  expect(copy.inf).toBe(Infinity);
  expect(copy.ninf).toBe(-Infinity);
  expect(Object.is(copy.negZero, -0)).toBe(true);
  const again = deepCopy(fixture);
  expect(again.map).not.toBe(copy.map);
  expect(again.set).not.toBe(copy.set);
  expect(again.date).not.toBe(copy.date);
  expect(again.bytes).not.toBe(copy.bytes);
  expect(again.buffer).not.toBe(copy.buffer);
  const bad: Array<[string, unknown]> = [
    ['function', () => 1],
    ['symbol', Symbol('s')],
    ['WeakMap', new WeakMap()],
    ['WeakSet', new WeakSet()],
    ['promise', Promise.resolve(1)],
  ];
  for (const [name, value] of bad) {
    expect(() => deepCopy(value), name).toThrow(TypeError);
  }
});
