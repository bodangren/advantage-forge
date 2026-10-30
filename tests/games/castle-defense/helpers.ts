/** Shared helpers of the Castle Defense tests: story fixtures, the bot run, and the path and spot reads. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import { parseStoryInput, type StoryInput } from '../../../src/apk3d/contracts/index.js';
import {
  createCastleDefense,
  type CastleDefenseEvent,
  type CastleDefenseSimulation,
  type CastleDefenseState,
  SENTENCE_WORDS,
  type Spot,
} from '../../../src/games/castle-defense/core/index.js';
import { nextCommand } from '../../../src/games/castle-defense/qc/bot.js';

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

export const create = (seed = 7, helper = false, story: StoryInput = STORY): CastleDefenseSimulation =>
  createCastleDefense(story, { seed, helper });

export const ofType = <T extends CastleDefenseEvent['type']>(events: readonly CastleDefenseEvent[], type: T) =>
  events.filter((e): e is Extract<CastleDefenseEvent, { type: T }> => e.type === type);

export const types = (events: readonly CastleDefenseEvent[]) => events.map((e) => e.type);

/** The choice that carries the next word. */
export const rightChoice = (sim: CastleDefenseSimulation): number => sim.state.step!.choices.find((c) => c.right)!.index;

/** A choice that is not the right one and not failed yet. */
export function wrongChoice(sim: CastleDefenseSimulation): number {
  const choice = sim.state.step!.choices.find((c) => !c.right && !c.blocked);
  if (!choice) throw new Error('no wrong choice');
  return choice.index;
}

export const pickRight = (sim: CastleDefenseSimulation): CastleDefenseEvent[] => sim.dispatch({ type: 'pick', choice: rightChoice(sim) });
export const pickWrong = (sim: CastleDefenseSimulation): CastleDefenseEvent[] => sim.dispatch({ type: 'pick', choice: wrongChoice(sim) });

/** A sentence holds at most SENTENCE_WORDS.max words and one right pick adds one word; the margin is 4 picks. */
export const COLLECT_LIMIT = SENTENCE_WORDS.max + 4;

/** Builds the whole current sentence with right words; returns the events. */
export function buildSentence(sim: CastleDefenseSimulation): CastleDefenseEvent[] {
  const events: CastleDefenseEvent[] = [];
  let picks = 0;
  while (sim.state.stage === 'collect' && sim.state.phase === 'playing') {
    if (picks >= COLLECT_LIMIT) {
      throw new Error(`buildSentence: the sentence did not finish after ${COLLECT_LIMIT} picks; the stage stayed collect`);
    }
    events.push(...pickRight(sim));
    picks += 1;
  }
  return events;
}

/** Places the tower of the built sentence on `spot`. */
export const buildOn = (sim: CastleDefenseSimulation, spot: number): CastleDefenseEvent[] => sim.dispatch({ type: 'build', spot });

/** Plays the run to the end with the bot; returns every event. */
export function playToEnd(sim: CastleDefenseSimulation, limit = 600): CastleDefenseEvent[] {
  const events: CastleDefenseEvent[] = [...sim.dispatch({ type: 'start' })];
  for (let i = 0; i < limit && sim.state.phase === 'playing'; i++) {
    const c = nextCommand(sim.state);
    if (!c) throw new Error(`the bot found no command at step ${i}`);
    events.push(...sim.dispatch(c));
  }
  return events;
}

// ---------------------------------------------------------------- path and spots

/** The build spots of the state; the read asserts that the core holds them (a missing field fails here). */
export function spotsOf(state: CastleDefenseState): Spot[] {
  const spots = state.spots;
  expect(Array.isArray(spots), 'state.spots is a list').toBe(true);
  return spots;
}

/** The path steps of the state, from the gate (index 0) to the last step before the castle. */
export function pathOf(state: CastleDefenseState): readonly unknown[] {
  const path = state.path;
  expect(Array.isArray(path), 'state.path is a list').toBe(true);
  return path;
}

/** The spot with the most path steps in range, the lowest index on a tie (computed here, not by the bot). */
export function widestSpot(state: CastleDefenseState): number {
  const spots = spotsOf(state);
  expect(spots.length).toBeGreaterThan(0);
  return [...spots].sort((a, b) => b.covers.length - a.covers.length || a.spot - b.spot)[0]!.spot;
}

/** The spot with the fewest path steps in range, the lowest index on a tie. */
export function narrowestSpot(state: CastleDefenseState): number {
  const spots = spotsOf(state);
  expect(spots.length).toBeGreaterThan(0);
  return [...spots].sort((a, b) => a.covers.length - b.covers.length || a.spot - b.spot)[0]!.spot;
}

/** One `build` command: the state before, its events, and the state after. */
export interface BuildTrace {
  before: CastleDefenseState;
  out: CastleDefenseEvent[];
  after: CastleDefenseState;
}

export interface PlayOptions {
  /** Before each sentence is built, pick wrong words while the hearts are above this number. */
  lowerHeartsTo?: number;
  limit?: number;
}

/**
 * Plays a run with right words and places each tower on `chooseSpot(state)`. A rejected build
 * ends the run (the core does not know the spot), so the loop never hangs.
 */
export function playWith(
  sim: CastleDefenseSimulation,
  chooseSpot: (state: CastleDefenseState) => number,
  options: PlayOptions = {},
): { events: CastleDefenseEvent[]; builds: BuildTrace[] } {
  const events: CastleDefenseEvent[] = [...sim.dispatch({ type: 'start' })];
  const builds: BuildTrace[] = [];
  const limit = options.limit ?? 800;
  for (let i = 0; i < limit && sim.state.phase === 'playing'; i++) {
    if (sim.state.stage === 'collect') {
      const lower = options.lowerHeartsTo;
      const wrongLeft = sim.state.step?.choices.some((c) => !c.right && !c.blocked) ?? false;
      events.push(...(lower !== undefined && sim.state.hearts > lower && wrongLeft ? pickWrong(sim) : pickRight(sim)));
      continue;
    }
    const before = sim.snapshot();
    const out = buildOn(sim, chooseSpot(sim.state));
    events.push(...out);
    builds.push({ before, out, after: sim.snapshot() });
    if (out.some((e) => e.type === 'rejected')) break;
  }
  return { events, builds };
}
