/**
 * Shared helpers of the Archer's Revenge tests: story fixtures, the aim contract of the rebuild
 * (strategy D1 to D12), the grid search, and the bot run.
 *
 * The aim contract is written here as types, because the core of Phase 1 Red does not export it
 * yet. Each test reaches the core through `import * as core` and `needAim`, so a missing export
 * fails one test with an assertion, not the whole file with a load error.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import { parseStoryInput, type StoryInput } from '../../../src/apk3d/contracts/index.js';
import * as core from '../../../src/games/archers-revenge/core/index.js';
import {
  createArchersRevenge,
  type ArchersRevengeCommand,
  type ArchersRevengeEvent,
  type ArchersRevengeSimulation,
} from '../../../src/games/archers-revenge/core/index.js';
import { nextCommand } from '../../../src/games/archers-revenge/qc/bot.js';

const STORIES_DIR = join(process.cwd(), 'tests', 'fixtures', 'stories');

export const STORY_IDS = [
  'pip-is-brave',
  'squeaky-the-small-mouse',
  'pip-and-the-red-car',
  'fun-day-at-the-beach',
  'pips-happy-night',
  'pip-sees-colors',
  'the-new-student',
  'the-school-garden',
];

export const loadStory = (id: string): StoryInput =>
  parseStoryInput(JSON.parse(readFileSync(join(STORIES_DIR, id, 'story.json'), 'utf8')), id);

export const STORY = loadStory('pip-is-brave');
export const SHORT_STORY = loadStory('the-school-garden');

export const create = (seed = 7, helper = false, story: StoryInput = STORY): ArchersRevengeSimulation =>
  createArchersRevenge(story, { seed, helper });

export const ofType = <T extends AnyEvent['type']>(events: readonly (AnyEvent | ArchersRevengeEvent)[], type: T) =>
  (events as readonly AnyEvent[]).filter((e): e is Extract<AnyEvent, { type: T }> => e.type === type);

export const types = (events: readonly { type: string }[]): string[] => events.map((e) => e.type);

// ---------------------------------------------------------------- the aim contract (D1 to D12)

/** D2: the grid. Angle in whole degrees, power in whole percent; both ends are valid. */
export const MIN_ANGLE = 0;
export const MAX_ANGLE = 80;
export const MIN_POWER = 10;
export const MAX_POWER = 100;
export const ANGLES = Array.from({ length: MAX_ANGLE - MIN_ANGLE + 1 }, (_, i) => MIN_ANGLE + i);
export const POWERS = Array.from({ length: MAX_POWER - MIN_POWER + 1 }, (_, i) => MIN_POWER + i);
/** 81 angles x 91 powers. */
export const GRID_SIZE = ANGLES.length * POWERS.length;

export type ContactKind = 'target' | 'shut' | 'tower' | 'ground' | 'edge';
export const CONTACT_KINDS: readonly ContactKind[] = ['target', 'shut', 'tower', 'ground', 'edge'];

export interface Point {
  x: number;
  y: number;
}

/** D7: an axis-aligned box in meters, `x0 < x1` and `y0 < y1`; +y is up. */
export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * D7: the scene layout. `targets[lane]` is the target box of a lane. A hill box counts as
 * `ground`, and so does every point with `y <= groundY`. A point with `x >= width` is `edge`.
 */
export interface Layout {
  lanes: number;
  width: number;
  groundY: number;
  hills: Box[];
  towers: Box[];
  targets: Box[];
}

/**
 * D8: the first contact of a path. `index` is the lane for `target` and `shut`, and the tower
 * index for `tower`. For `ground` and `edge` the tests do not read `index`.
 */
export interface Contact {
  kind: ContactKind;
  index: number;
  x: number;
  y: number;
}

/** D9: the points from the bow origin to the contact point (the last point), and the contact. */
export interface Shot {
  points: Point[];
  contact: Contact;
}

export interface AimCore {
  TUNING: {
    aim: { minAngle: number; maxAngle: number; minPower: number; maxPower: number };
    arc: { origin: Point; gravity: number; dt: number; maxSpeed: number; maxSteps: number };
    coins: number;
    streakCoins: number;
    maxStreakBonus: number;
    maxCourage: number;
    restCourage: number;
    lanes: number;
    helperLanes: number;
  };
  /** D4: sine per whole degree, 0 to 90, frozen number literals. */
  SIN_DEG: readonly number[];
  layoutOf(lanes: number): Layout;
  shotOf(layout: Layout, blockedLanes: readonly number[], angle: number, power: number): Shot;
  /** D9 and R11: the helper path. A shut target keeps its box, so the path needs no lane list. */
  pathOf(layout: Layout, angle: number, power: number): Point[];
}

/** D10: the new miss event. */
export interface MissedEvent {
  type: 'missed';
  angle: number;
  power: number;
  kind: Exclude<ContactKind, 'target'>;
  x: number;
  y: number;
}

/** D10: the `shot` event adds `angle` and `power`. */
export type ShotEvent = Extract<ArchersRevengeEvent, { type: 'shot' }> & { angle: number; power: number };

export type AnyEvent = Exclude<ArchersRevengeEvent, { type: 'shot' }> | ShotEvent | MissedEvent;

/** The core seen through the aim contract. */
export const AIM = core as unknown as AimCore;

/** Asserts that each named aim export exists, then returns the core as the aim contract. */
export function needAim(...names: (keyof AimCore)[]): AimCore {
  const exports = core as unknown as Record<string, unknown>;
  for (const name of names) expect(exports[name], `core export ${name}`).toBeDefined();
  return AIM;
}

/** Asserts that `TUNING.aim` and `TUNING.arc` exist (D2, D5). */
export function needTuning(): AimCore['TUNING'] {
  const tuning = (core as unknown as { TUNING: Partial<AimCore['TUNING']> }).TUNING;
  expect(tuning.aim, 'TUNING.aim').toBeDefined();
  expect(tuning.arc, 'TUNING.arc').toBeDefined();
  return AIM.TUNING;
}

/** D7: `state.layout`. */
export function layoutOfState(sim: ArchersRevengeSimulation): Layout {
  const layout = (sim.state as unknown as { layout?: Layout }).layout;
  expect(layout, 'state.layout').toBeDefined();
  return layout!;
}

export const blockedOf = (sim: ArchersRevengeSimulation): number[] =>
  (sim.state.round?.lanes ?? []).filter((l) => l.blocked).map((l) => l.lane);

/** D1: the aim command. The values are `unknown`, so the tests can send hostile values. */
export const fire = (sim: ArchersRevengeSimulation, angle: unknown, power: unknown): AnyEvent[] =>
  sim.dispatch({ type: 'fire', angle, power } as unknown as ArchersRevengeCommand) as AnyEvent[];

export interface Pair {
  angle: number;
  power: number;
}

// The contacts of the grid, per layout and lane list. Only the contact is kept (not the points).
const contactCache = new Map<string, Map<number, Contact>>();

/** The first contact of one grid pair, through the core shot function. */
export function contactOf(layout: Layout, blocked: readonly number[], angle: number, power: number): Contact {
  const key = `${JSON.stringify(layout)}|${[...blocked].sort((a, b) => a - b).join(',')}`;
  let table = contactCache.get(key);
  if (!table) contactCache.set(key, (table = new Map()));
  const at = angle * 1000 + power;
  let contact = table.get(at);
  if (!contact) {
    const c = needAim('shotOf').shotOf(layout, blocked, angle, power).contact;
    contact = { kind: c.kind, index: c.index, x: c.x, y: c.y };
    table.set(at, contact);
  }
  return contact;
}

/**
 * The first grid pair (angle ascending, then power ascending, the R13 order) whose first contact
 * matches. It uses the core shot function, not the bot, so a bot defect cannot hide a core defect.
 */
export function aimIn(layout: Layout, blocked: readonly number[], match: (c: Contact) => boolean): Pair | null {
  for (const angle of ANGLES) {
    for (const power of POWERS) {
      if (match(contactOf(layout, blocked, angle, power))) return { angle, power };
    }
  }
  return null;
}

/** The first grid pair for the state of `sim` whose first contact matches. */
export const aimAt = (sim: ArchersRevengeSimulation, match: (c: Contact) => boolean): Pair | null =>
  aimIn(layoutOfState(sim), blockedOf(sim), match);

/** The lane that carries the word of the prompt. */
export function rightLane(sim: ArchersRevengeSimulation): number {
  const round = sim.state.round!;
  return round.lanes.find((l) => l.wordId === round.wordId)!.lane;
}

/** A lane that is not the right one and not shot yet. */
export function wrongLane(sim: ArchersRevengeSimulation): number {
  const round = sim.state.round!;
  const lane = round.lanes.find((l) => l.wordId !== round.wordId && !l.blocked);
  if (!lane) throw new Error('no wrong lane');
  return lane.lane;
}

/** The first grid pair that hits the target of `lane` (open). */
export function pairFor(sim: ArchersRevengeSimulation, lane: number): Pair {
  const pair = aimAt(sim, (c) => c.kind === 'target' && c.index === lane);
  expect(pair, `a grid pair that hits the target of lane ${lane}`).not.toBeNull();
  return pair!;
}

/** The first grid pair whose first contact is a miss of this kind. */
export function missPair(sim: ArchersRevengeSimulation, kind: Exclude<ContactKind, 'target'>, lane?: number): Pair {
  const pair = aimAt(sim, (c) => c.kind === kind && (lane === undefined || c.index === lane));
  expect(pair, `a grid pair whose first contact is ${kind}`).not.toBeNull();
  return pair!;
}

export const shootLane = (sim: ArchersRevengeSimulation, lane: number): AnyEvent[] => {
  const { angle, power } = pairFor(sim, lane);
  return fire(sim, angle, power);
};
export const shootRight = (sim: ArchersRevengeSimulation): AnyEvent[] => shootLane(sim, rightLane(sim));
export const shootWrong = (sim: ArchersRevengeSimulation): AnyEvent[] => shootLane(sim, wrongLane(sim));
export const shootMiss = (sim: ArchersRevengeSimulation, kind: Exclude<ContactKind, 'target'>, lane?: number): AnyEvent[] => {
  const { angle, power } = missPair(sim, kind, lane);
  return fire(sim, angle, power);
};

/** Plays the run to the end with the bot; returns every event. */
export function playToEnd(sim: ArchersRevengeSimulation, limit = 400): AnyEvent[] {
  const events: AnyEvent[] = [...(sim.dispatch({ type: 'start' }) as AnyEvent[])];
  for (let i = 0; i < limit && sim.state.phase === 'playing'; i++) {
    const c = nextCommand(sim.state);
    if (!c) throw new Error(`the bot found no command at step ${i}`);
    events.push(...(sim.dispatch(c) as AnyEvent[]));
  }
  return events;
}

/** Twelve fixed pairs of the arc rows (R4, R5, R6, R11): the grid corners and inner points. */
export const FIXED_PAIRS: readonly Pair[] = [
  { angle: 0, power: 10 },
  { angle: 0, power: 100 },
  { angle: 80, power: 10 },
  { angle: 80, power: 100 },
  { angle: 45, power: 50 },
  { angle: 30, power: 70 },
  { angle: 15, power: 90 },
  { angle: 60, power: 40 },
  { angle: 10, power: 25 },
  { angle: 70, power: 85 },
  { angle: 5, power: 55 },
  { angle: 40, power: 100 },
];

/** The two layouts of D7: 3 lanes, and 2 lanes for Helper mode. */
export const LAYOUT_LANES = [3, 2] as const;

/** Every number of a value, in a fixed walk order (for the `Object.is` comparisons). */
export function numbersOf(value: unknown, out: number[] = []): number[] {
  if (typeof value === 'number') out.push(value);
  else if (Array.isArray(value)) for (const v of value) numbersOf(v, out);
  else if (value && typeof value === 'object') for (const k of Object.keys(value).sort()) numbersOf((value as Record<string, unknown>)[k], out);
  return out;
}

/** True when the two lists hold the same numbers by `Object.is`, in the same order. */
export function sameNumbers(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
}
