/**
 * T9 and T10: the view driver asks for a shade, plays the core events in order, and reports the
 * run once. It has no battle monster.
 *
 * The recording `Presentation` below is the Phase 1 contract for the driver (Green may add
 * methods; the test records each call to a method that it does not define):
 * - ask(wave), setCourage(value, max), setTwins(freed, total), setPlace(...), captured(),
 *   bolt(shade), shadeFaded(shade), shadeDived(shade), soulFreed(shade, points, firstTry),
 *   scatter(), rest(), sfx(name), victory(), settle().
 * - It has no `spawn`, `setMonsterHp`, `heroStrike`, `monsterHit`, `monsterDefeated`, or
 *   `monsterStrike`. A call to a method outside the contract goes to `missing`, and each test
 *   asserts that `missing` is empty.
 *
 * Assumption Q2: no view marks the captor before a right strike. The `ask` payload gives each
 * shade `id`, `term`, and `kind` only, and `captured()` gets no argument.
 */
import { describe, expect, it } from 'vitest';
import { TwinSoulPlayer, type Presentation } from '../../../src/games/paladins-twin-soul/view/driver.js';
import { TWIN_SOUL_EVENT_TYPES, type TwinSoulSimulation } from '../../../src/games/paladins-twin-soul/core/index.js';
import { nextStrike } from '../../../src/games/paladins-twin-soul/qc/bot.js';
import { SHORT_STORY, STORY, create, loose, wrongShade } from './helpers.js';

const MONSTER_METHODS = ['spawn', 'setMonsterHp', 'heroStrike', 'monsterHit', 'monsterDefeated', 'monsterStrike'];

interface AskShown {
  translation: string;
  shades: Record<string, unknown>[];
  retry: boolean;
}

/** A sim that records the type of every event the core gives to the driver. */
function recording(sim: TwinSoulSimulation, seen: Set<string>): TwinSoulSimulation {
  const dispatch = sim.dispatch.bind(sim);
  return {
    get state() {
      return sim.state;
    },
    dispatch(command) {
      const events = dispatch(command);
      for (const e of loose(events)) seen.add(e.type);
      return events;
    },
    tick: () => sim.tick(),
    snapshot: () => sim.snapshot(),
  };
}

/**
 * The harness. `wrongs` = the number of wrong strikes the student makes before the first right
 * strike (the first wave only).
 */
function harness(seed: number, wrongs = 0, story = SHORT_STORY) {
  const base = create(seed, false, story);
  const seen = new Set<string>();
  const sim = recording(base, seen);
  const log: string[] = [];
  const asked: AskShown[] = [];
  const capturedArgs: number[] = [];
  const missing: string[] = [];
  const done: unknown[] = [];
  let left = wrongs;
  const impl: Record<string, (...args: never[]) => unknown> = {
    async ask(wave: AskShown) {
      asked.push(wave);
      expect(wave.shades.every((s) => base.state.shades.some((x) => x.id === s.id && !x.fallen))).toBe(true);
      const wrong = left > 0 ? wrongShade(base) : null;
      if (wrong) left -= 1;
      const c = nextStrike(base.state);
      return wrong ?? (c?.type === 'strike' ? c.shade : '');
    },
    setCourage: (v: number) => log.push(`courage:${v}`),
    setTwins: (f: number, n: number) => log.push(`twins:${f}/${n}`),
    setPlace: () => log.push('place'),
    captured: (...args: never[]) => {
      capturedArgs.push(args.length);
      log.push('captured');
    },
    bolt: async (shade: string) => void log.push(`bolt:${shade}`),
    shadeFaded: async (shade: string) => void log.push(`faded:${shade}`),
    shadeDived: async (shade: string) => void log.push(`dived:${shade}`),
    soulFreed: async (_s: string, points: number, firstTry: boolean) => void log.push(`freed:${points}:${firstTry}`),
    scatter: async () => void log.push('scatter'),
    rest: async () => void log.push('rest'),
    sfx: () => undefined,
    victory: async () => void log.push('victory'),
    settle: async () => undefined,
  };
  const p = new Proxy(impl, {
    get(target, key) {
      if (typeof key !== 'string' || key === 'then') return undefined;
      if (key in target) return target[key];
      missing.push(key);
      return async () => undefined;
    },
  }) as unknown as Presentation;
  const player = new TwinSoulPlayer({
    sim,
    story: { id: story.id, level: story.level },
    seed,
    presentation: p,
    complete: (r, o, e) => done.push([r, o, e]),
    now: () => 0,
  });
  return { sim: base, seen, log, asked, capturedArgs, missing, done, player };
}

describe('T9 driver', () => {
  it('T9: plays a whole run, asks once per wave, completes once, and calls no monster method', async () => {
    const { sim, log, asked, missing, done, player } = harness(3);
    await player.start();
    for (const method of MONSTER_METHODS) expect(missing).not.toContain(method);
    expect(missing).toEqual([]);
    expect(player.finished).toBe(true);
    expect(sim.state.phase).toBe('victory');
    expect(asked).toHaveLength(sim.state.targetCount);
    expect(log.filter((l) => l === 'captured')).toHaveLength(sim.state.targetCount);
    expect(log.filter((l) => l.startsWith('bolt:'))).toHaveLength(sim.state.targetCount);
    expect(log.filter((l) => l.startsWith('freed:'))).toHaveLength(sim.state.targetCount);
    expect(log.at(-1)).toBe('victory');
    expect(done).toHaveLength(1);
    const [results, outcome, evidence] = done[0] as [{ score: number }, string, { items: unknown[] }];
    expect(outcome).toBe('victory');
    expect(evidence.items).toHaveLength(sim.state.targetCount);
    expect(results.score).toBe(sim.state.score);
  });

  it('T9: a wrong strike plays the bolt, the fade, the dive, and courage 4; the next ask has one shade less', async () => {
    const { log, asked, missing, player } = harness(4, 1);
    await player.start();
    expect(missing).toEqual([]);
    const bolt = log.findIndex((l) => l.startsWith('bolt:'));
    const faded = log.findIndex((l) => l.startsWith('faded:'));
    const dived = log.findIndex((l) => l.startsWith('dived:'));
    expect(bolt).toBeGreaterThanOrEqual(0);
    expect(faded).toBeGreaterThan(bolt);
    expect(dived).toBeGreaterThan(faded);
    expect(log.indexOf('courage:4')).toBeGreaterThan(dived);
    expect(log[bolt]!.slice('bolt:'.length)).toBe(log[faded]!.slice('faded:'.length));
    expect(asked[1]!.retry).toBe(true);
    expect(asked[1]!.shades.length).toBe(asked[0]!.shades.length - 1);
    expect(log.some((l) => l === 'freed:100:false')).toBe(true);
    expect(log).toContain('scatter');
    expect(log.at(-1)).toBe('victory');
  });

  it('T9: a mixed run plays every core event type except strikeRejected, rest included', async () => {
    // Five wrong strikes in the first wave of a six-shade story: courage reaches 0 and the team rests.
    const { seen, log, missing, player } = harness(5, 5, STORY);
    await player.start();
    expect(missing).toEqual([]);
    expect(seen.size).toBeGreaterThan(0);
    const expected = TWIN_SOUL_EVENT_TYPES.filter((t) => t !== 'strikeRejected');
    expect(expected.length).toBeGreaterThan(0);
    for (const type of expected) expect([...seen]).toContain(type);
    for (const entry of ['courage:4', 'courage:0', 'courage:3', 'rest', 'scatter', 'victory']) expect(log).toContain(entry);
    expect(log.filter((l) => l.startsWith('dived:'))).toHaveLength(5);
    expect(log.filter((l) => l.startsWith('faded:'))).toHaveLength(5);
  });

  it('T9 (kept row): stops asking after destroy', async () => {
    const { asked, player } = harness(5);
    player.destroy();
    await player.start();
    expect(asked).toHaveLength(0);
  });
});

describe('T10 no captor leak through the driver (assumption Q2)', () => {
  it.each([1, 2, 3])('T10 Q2 seed %i: each asked shade has id, term, and kind only; captured() has no argument', async (seed) => {
    const { asked, capturedArgs, missing, player } = harness(seed, 2, STORY);
    await player.start();
    expect(missing).toEqual([]);
    expect(asked.length).toBeGreaterThan(0);
    for (const wave of asked) {
      for (const shade of wave.shades) {
        expect(Object.keys(shade).sort()).toEqual(['id', 'kind', 'term']);
        expect(['specter', 'wraith', 'ghost']).toContain(shade.kind);
      }
    }
    expect(capturedArgs.length).toBeGreaterThan(0);
    expect(capturedArgs.every((n) => n === 0)).toBe(true);
  });
});
