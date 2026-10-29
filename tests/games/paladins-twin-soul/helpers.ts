/**
 * Shared helpers of the Paladin's Twin Soul tests: story fixtures, the bot run, and a mixed run.
 *
 * The chapel shooter rows read new event types (`boltFired`, `shadeFaded`, `shadeDived`) and the
 * new shade field `kind` by name. The helpers give the tests a loose event and shade shape, so
 * that a missing type or field fails an assertion at run time, not the type check.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseStoryInput, type StoryInput } from '../../../src/apk3d/contracts/index.js';
import { createTwinSoul, type TwinSoulSimulation, type TwinSoulState } from '../../../src/games/paladins-twin-soul/core/index.js';
import { nextStrike } from '../../../src/games/paladins-twin-soul/qc/bot.js';

const STORIES_DIR = join(process.cwd(), 'tests', 'fixtures', 'stories');

/** Every story of the demo, in selector order. */
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

/** 13 words: every wave has six shades (four in Helper mode). */
export const STORY = loadStory('pip-is-brave');
/** 5 words: every wave has five shades, so four wrong strikes leave only the captor. */
export const SHORT_STORY = loadStory('the-school-garden');

/** The shade kinds of the default contract (test-strategy section 5). */
export const KINDS = ['specter', 'wraith', 'ghost'];

/** A core event read by name. */
export type Ev = { type: string; [key: string]: any };

/** A shade of the state read by name (`kind` is new in the chapel shooter). */
export type LooseShade = { id: string; wordId: string; term: string; fallen: boolean; kind?: unknown };

export const create = (seed = 7, helper = false, story: StoryInput = STORY): TwinSoulSimulation =>
  createTwinSoul(story, { seed, helper });

export const loose = (events: readonly unknown[]): Ev[] => events as Ev[];

export const ofType = (events: readonly Ev[], type: string): Ev[] => events.filter((e) => e.type === type);

export const types = (events: readonly Ev[]): string[] => events.map((e) => e.type);

/** Sends one command and returns its events in the loose shape. */
export const send = (sim: TwinSoulSimulation, command: Parameters<TwinSoulSimulation['dispatch']>[0]): Ev[] =>
  loose(sim.dispatch(command));

export const strike = (sim: TwinSoulSimulation, shade: string): Ev[] => send(sim, { type: 'strike', shade });

/** The shades of the state in the loose shape. */
export const shadesNow = (sim: { state: TwinSoulState }): LooseShade[] => sim.state.shades as unknown as LooseShade[];

/** The captor shade of the current wave (the shade with the target's term). */
export function captorOf(sim: { state: TwinSoulState }): LooseShade {
  const id = sim.state.target?.itemId;
  const captor = shadesNow(sim).find((s) => s.wordId === id);
  if (!captor) throw new Error('no captor in this wave');
  return captor;
}

/** The id of a shade that is not the captor, or null when none is left. */
export function wrongShade(sim: { state: TwinSoulState }): string | null {
  const id = sim.state.target?.itemId;
  return sim.state.shades.find((s) => s.wordId !== id && !s.fallen)?.id ?? null;
}

/** Strikes a wrong shade and returns its events. */
export function wrongStrike(sim: TwinSoulSimulation): Ev[] {
  const shade = wrongShade(sim);
  if (!shade) throw new Error('no wrong shade left');
  return strike(sim, shade);
}

/** Plays the run to the end with the bot; returns every event. */
export function playToEnd(sim: TwinSoulSimulation, limit = 400): Ev[] {
  const events: Ev[] = [...send(sim, { type: 'start' })];
  for (let i = 0; i < limit && sim.state.phase === 'playing'; i++) {
    const c = nextStrike(sim.state);
    if (!c) throw new Error(`the bot found no captor at strike ${i}`);
    events.push(...send(sim, c));
  }
  return events;
}

/** One strike of a mixed run: the struck id, whether the core can accept it, and its events. */
export interface StrikeRecord {
  shade: string;
  /** False for an unknown shade or a faded shade: the core must reject it. */
  valid: boolean;
  events: Ev[];
}

/**
 * A mixed run: right strikes, wrong strikes, strikes on an unknown shade, and strikes on a faded
 * shade, in a fixed cycle of six (wrong, unknown, faded, wrong, wrong, captor). Every wave has
 * three wrong strikes, so the run also holds rests. Returns the start events, every strike, and
 * all events in order.
 */
export function mixedRun(sim: TwinSoulSimulation, limit = 400): { start: Ev[]; strikes: StrikeRecord[]; events: Ev[] } {
  const start = send(sim, { type: 'start' });
  const strikes: StrikeRecord[] = [];
  const events: Ev[] = [...start];
  const push = (shade: string, valid: boolean) => {
    const e = strike(sim, shade);
    strikes.push({ shade, valid, events: e });
    events.push(...e);
  };
  for (let i = 0; i < limit && sim.state.phase === 'playing'; i++) {
    const faded = sim.state.shades.find((s) => s.fallen)?.id;
    const wrong = wrongShade(sim);
    const step = i % 6;
    if (step === 1) push('nope', false);
    else if (step === 2 && faded) push(faded, false);
    else if (step !== 5 && wrong) push(wrong, true);
    else push(captorOf(sim).id, true);
  }
  return { start, strikes, events };
}
