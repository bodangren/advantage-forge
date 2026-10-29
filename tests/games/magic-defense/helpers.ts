/**
 * Shared helpers of the Magic Defense tests: story fixtures, the bot run, and the held-missile
 * checks of the track test strategy
 * (measure/tracks/game_magic_defense_rebuild_20261029/test-strategy.md, sections 2 to 4).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import { parseStoryInput, type StoryInput } from '../../../src/apk3d/contracts/index.js';
import {
  createMagicDefense,
  type HeldMissile,
  type MagicDefenseEvent,
  type MagicDefenseSimulation,
  type MagicDefenseState,
} from '../../../src/games/magic-defense/core/index.js';
import { nextCommand } from '../../../src/games/magic-defense/qc/bot.js';

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

/** 13 words in waves of 5, 4, and 4: wave 1 has more words than castles. */
export const STORY = loadStory('pip-is-brave');
/** 5 words in one wave. */
export const SHORT_STORY = loadStory('the-school-garden');
/** 5 words in one wave: the last missiles of the wave leave free places (ASM-4). */
export const NEW_STUDENT = loadStory('the-new-student');

export const create = (seed = 7, helper = false, story: StoryInput = STORY): MagicDefenseSimulation =>
  createMagicDefense(story, { seed, helper });

export const ofType = <T extends MagicDefenseEvent['type']>(events: readonly MagicDefenseEvent[], type: T) =>
  events.filter((e): e is Extract<MagicDefenseEvent, { type: T }> => e.type === type);

export const types = (events: readonly MagicDefenseEvent[]) => events.map((e) => e.type);

/** The choice that carries the word of the card (H4 proves that the card is the active missile). */
export function rightChoice(sim: MagicDefenseSimulation): number {
  const round = sim.state.round!;
  return round.choices.find((c) => c.wordId === round.wordId)!.index;
}

/** A choice that is not the right one and not failed yet. */
export function wrongChoice(sim: MagicDefenseSimulation): number {
  const round = sim.state.round!;
  const choice = round.choices.find((c) => c.wordId !== round.wordId && !c.blocked);
  if (!choice) throw new Error('no wrong choice');
  return choice.index;
}

/** True when the card has a wrong choice that is not shut. */
export function hasWrong(sim: MagicDefenseSimulation): boolean {
  const round = sim.state.round;
  return !!round && round.choices.some((c) => c.wordId !== round.wordId && !c.blocked);
}

export const castRight = (sim: MagicDefenseSimulation): MagicDefenseEvent[] => sim.dispatch({ type: 'cast', choice: rightChoice(sim) });
export const castWrong = (sim: MagicDefenseSimulation): MagicDefenseEvent[] => sim.dispatch({ type: 'cast', choice: wrongChoice(sim) });

/** Plays the run to the end with the bot; returns every event. A run that does not end in `limit` steps throws. */
export function playToEnd(sim: MagicDefenseSimulation, limit = 400): MagicDefenseEvent[] {
  const events: MagicDefenseEvent[] = [...sim.dispatch({ type: 'start' })];
  for (let i = 0; sim.state.phase === 'playing'; i++) {
    if (i >= limit) throw new Error(`the run did not end in ${limit} steps`);
    const c = nextCommand(sim.state);
    if (!c) throw new Error(`the bot found no command at step ${i}`);
    events.push(...sim.dispatch(c));
  }
  return events;
}

// ---------------------------------------------------------------- held missiles

/**
 * The held missiles of the state (FR-1). The check fails with an assertion, not with a
 * TypeError, when the core has no list.
 */
export function missilesOf(sim: MagicDefenseSimulation): HeldMissile[] {
  const list = sim.state.missiles;
  expect(Array.isArray(list), 'state.missiles is the list of held missiles').toBe(true);
  return list;
}

/** The active held missile: the one that `state.activeMissileId` names (FR-3). */
export function active(sim: MagicDefenseSimulation): HeldMissile {
  const list = missilesOf(sim);
  const id = sim.state.activeMissileId;
  expect(typeof id, 'state.activeMissileId names the active missile').toBe('string');
  const missile = list.find((m) => m.id === id);
  expect(missile, `activeMissileId ${String(id)} names a held missile`).toBeDefined();
  return missile!;
}

/** A deep copy of the held missiles, sorted by castle. */
export const heldCopy = (sim: MagicDefenseSimulation): HeldMissile[] =>
  structuredClone(missilesOf(sim)).sort((a, b) => a.castle - b.castle);

export const byCastle = (list: readonly HeldMissile[]): HeldMissile[] => [...list].sort((a, b) => a.castle - b.castle);

/** Castles with at least one heart. */
export const standingCount = (state: MagicDefenseState): number => state.castles.filter((h) => h > 0).length;

/** Words of the current wave that are not solved yet. */
export const unsolvedInWave = (state: MagicDefenseState): number =>
  state.targets.filter((t) => t.wave === state.wave && !t.solved).length;

/**
 * The held-missile rules after every command of a started run.
 * - FR-1: at most one missile per castle, only above standing castles, one missile per meaning.
 * - ASM-4: a held word is an unsolved word of the current wave.
 * - FR-3 and H4: one active missile; `round` is its card; the right word is on the card once and open.
 * - `full` (ASM-4): every standing castle holds a missile while the wave has a free word.
 * After the victory: no held missile, no active missile, and no card (H16).
 */
export function expectHeld(sim: MagicDefenseSimulation, opts: { full?: boolean } = {}): void {
  const s = sim.state;
  const list = missilesOf(sim);
  if (s.phase !== 'playing') {
    expect(list, 'no held missile after the victory').toEqual([]);
    expect(s.activeMissileId, 'no active missile after the victory').toBeNull();
    expect(s.round, 'no card after the victory').toBeNull();
    return;
  }
  expect(new Set(list.map((m) => m.id)).size, 'the missile ids are unique').toBe(list.length);
  expect(new Set(list.map((m) => m.castle)).size, 'FR-1: at most one missile per castle').toBe(list.length);
  expect(new Set(list.map((m) => m.wordId)).size, 'FR-1: one missile per meaning').toBe(list.length);
  for (const m of list) {
    expect(s.castles[m.castle], `FR-1: castle ${m.castle} under missile ${m.id} is standing`).toBeGreaterThan(0);
    const word = s.targets.find((t) => t.id === m.wordId);
    expect(word, `missile ${m.id} holds a word of the run`).toBeDefined();
    expect(word!.solved, `missile ${m.id} holds an unsolved word`).toBe(false);
    expect(word!.wave, 'ASM-4: a held word is a word of the current wave').toBe(s.wave);
    expect(m.prompt, 'the prompt is the Thai meaning of the word').toBe(word!.translation);
    expect(m.enemyId, 'the thrower is the enemy of the lane of the castle').toBe(s.enemies.find((e) => e.lane === m.castle)?.id);
  }
  expect(list.length, 'a started run holds at least one missile').toBeGreaterThan(0);
  expect(list.length, 'FR-1: no more missiles than standing castles').toBeLessThanOrEqual(standingCount(s));
  if (opts.full) {
    expect(list.length, 'ASM-4: every standing castle holds a missile while the wave has a free word').toBe(
      Math.min(standingCount(s), unsolvedInWave(s)),
    );
  }
  const a = active(sim);
  const round = s.round;
  expect(round, 'a playing run shows a card').not.toBeNull();
  expect(
    { wordId: round!.wordId, prompt: round!.prompt, castle: round!.castle, enemyId: round!.enemyId },
    'H4: the card is the card of the active missile',
  ).toEqual({ wordId: a.wordId, prompt: a.prompt, castle: a.castle, enemyId: a.enemyId });
  expect(round!.choices.filter((c) => c.wordId === a.wordId), 'the right word is on the card once').toHaveLength(1);
  expect(round!.choices.find((c) => c.wordId === a.wordId)!.blocked, 'the right word never shuts').toBe(false);
}

/**
 * Every held missile enters the state through one `missileThrown` event (strategy section 2): the
 * missiles of the state that were not held as they are before the command are exactly the
 * missiles of the `missileThrown` events of the command.
 */
export function expectThrown(before: readonly HeldMissile[], events: readonly MagicDefenseEvent[], sim: MagicDefenseSimulation): void {
  const key = (m: HeldMissile): string => JSON.stringify([m.id, m.wordId, m.prompt, m.castle, m.enemyId]);
  const old = new Set(before.map(key));
  const entered = missilesOf(sim).filter((m) => !old.has(key(m))).map(key).sort();
  const thrown = ofType(events, 'missileThrown').map((e) => key(e.missile)).sort();
  expect(thrown, 'one missileThrown event per missile that enters the state').toEqual(entered);
}
