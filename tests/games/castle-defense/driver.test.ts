/** The view driver plays the core events in order and reports the run once (rows D1 to D4). */
import { describe, expect, it } from 'vitest';
import type { CastleDefenseEvent, Spot } from '../../../src/games/castle-defense/core/index.js';
import { CastleDefensePlayer, type Presentation, type StepShown } from '../../../src/games/castle-defense/view/driver.js';
import { SHORT_STORY, create, ofType } from './helpers.js';

type Ask =
  | { kind: 'step'; shown: StepShown; pick: (c: number) => void }
  | { kind: 'spots'; spots: readonly Spot[]; build: (spot: number) => void };

function harness(seed: number, helper = false) {
  const sim = create(seed, helper, SHORT_STORY);
  // Every core event of the run, in order, to compare with the presentation log.
  const events: CastleDefenseEvent[] = [];
  const dispatch = sim.dispatch.bind(sim);
  sim.dispatch = (command) => {
    const out = dispatch(command);
    events.push(...out);
    return out;
  };
  const log: string[] = [];
  const done: unknown[] = [];
  let ask: Ask | null = null;
  const recorder: Presentation = {
    setHearts: (h) => log.push(`hearts:${h}`),
    setProgress: (w, n, d, sz) => log.push(`progress:${w}/${n}:${d}/${sz}`),
    spawnWave: async (w, _n, a) => void log.push(`spawn:${w}:${a.length}`),
    showStep: (shown, pick) => {
      ask = { kind: 'step', shown, pick };
    },
    hideStep: () => {
      ask = null;
    },
    markPick: async (_c, correct) => void log.push(`mark:${correct}`),
    strike: async (a, hearts) => void log.push(`strike:${a.id}:${hearts}`),
    rest: async () => void log.push('rest'),
    showSpots: (spots, build) => {
      ask = { kind: 'spots', spots, build };
    },
    hideSpots: () => {
      ask = null;
    },
    towerBuilt: async (spot, level) => void log.push(`tower:${spot}:${level}`),
    waveStep: async (step, _attackers, shots) => {
      log.push(`step:${step}`);
      for (const s of shots) log.push(`shot:${s.spot}:${s.attacker.id}:${s.hits}`);
    },
    through: async (a, hearts) => void log.push(`through:${a.id}:${hearts}`),
    clearWave: async (a) => void log.push(`clear:${a.length}`),
    cardPopup: (t) => log.push(`coins:${t}`),
    sfx: () => undefined,
    victory: async () => void log.push('victory'),
    settle: async () => undefined,
  };
  // A method the recorder does not know is logged as `unknown:<name>` instead of a crash.
  const p = new Proxy(recorder, {
    get(target, key, receiver) {
      if (typeof key === 'string' && !(key in target)) {
        return () => {
          log.push(`unknown:${key}`);
          return Promise.resolve();
        };
      }
      return Reflect.get(target, key, receiver);
    },
  });
  const player = new CastleDefensePlayer({ sim, story: SHORT_STORY, seed, presentation: p, complete: (r, o, e) => done.push([r, o, e]), now: () => 0 });
  return { sim, events, log, done, player, ask: (): Ask | null => ask };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

/** Taps through the run: the right word on a card, `chooseSpot` on the spots. */
async function tapThrough(h: ReturnType<typeof harness>, chooseSpot: (spots: readonly Spot[], i: number) => number, limit = 400) {
  await h.player.start();
  for (let i = 0; i < limit && !h.player.finished; i++) {
    const a = h.ask();
    if (!a) break;
    if (a.kind === 'step') a.pick(a.shown.step.choices.find((c) => c.right)!.index);
    else a.build(chooseSpot(a.spots, i));
    await settle();
  }
}

const narrowest = (spots: readonly Spot[]): number => [...spots].sort((a, b) => a.covers.length - b.covers.length || a.spot - b.spot)[0]!.spot;

describe('driver', () => {
  it.each([1, 2, 3])('D1 seed %i: the student taps through to victory; complete is called once', async (seed) => {
    const h = harness(seed, seed === 2);
    await tapThrough(h, (spots, i) => spots[i % spots.length]!.spot);
    expect(h.log.some((l) => l.startsWith('spawn:'))).toBe(true);
    expect(h.sim.state.phase).toBe('victory');
    expect(h.done).toHaveLength(1);
    expect(h.log.filter((l) => l === 'victory')).toHaveLength(1);
    expect(h.log.filter((l) => l.startsWith('tower:'))).toHaveLength(h.sim.state.waveCount);
    expect(h.log.filter((l) => l.startsWith('clear:'))).toHaveLength(h.sim.state.waveCount);
    expect(h.log.filter((l) => l.startsWith('spawn:'))).toHaveLength(h.sim.state.waveCount);
    expect(h.log.filter((l) => l.startsWith('unknown:')), 'calls outside the Presentation').toEqual([]);
  });

  it('D2 the driver plays every wave step, every shot, and every breach', async () => {
    const h = harness(4);
    await tapThrough(h, narrowest);
    expect(h.sim.state.phase).toBe('victory');
    const steps = ofType(h.events, 'waveStep');
    const shots = steps.flatMap((e) => e.shots);
    const throughs = ofType(h.events, 'attackerThrough');
    expect(steps.length, 'waveStep events').toBeGreaterThan(0);
    expect(shots.length, 'shots').toBeGreaterThan(0);
    expect(throughs.length, 'attackerThrough events').toBeGreaterThan(0);
    expect(h.log.filter((l) => l.startsWith('step:'))).toHaveLength(steps.length);
    expect(h.log.filter((l) => l.startsWith('shot:'))).toEqual(shots.map((s) => `shot:${s.spot}:${s.enemyId}:${s.hits}`));
    expect(h.log.filter((l) => l.startsWith('through:'))).toEqual(throughs.map((t) => `through:${t.enemyId}:${t.hearts}`));
    expect(h.log.filter((l) => l.startsWith('unknown:')), 'calls outside the Presentation').toEqual([]);
  });

  it('D3 the spots come through showSpots; a tap on a spot builds on that spot', async () => {
    const h = harness(5);
    await h.player.start();
    for (let i = 0; i < 40 && h.ask()?.kind === 'step'; i++) {
      const a = h.ask() as Extract<Ask, { kind: 'step' }>;
      a.pick(a.shown.step.choices.find((c) => c.right)!.index);
      await settle();
    }
    const a = h.ask();
    expect(a?.kind, 'the input after a built sentence').toBe('spots');
    const ask = a as Extract<Ask, { kind: 'spots' }>;
    expect(ask.spots).toHaveLength(6);
    expect(ask.spots).toEqual(h.sim.state.spots);
    ask.build(3);
    await settle();
    expect(h.sim.state.spots.find((s) => s.spot === 3)!.level).toBe(1);
    expect(h.log).toContain('tower:3:1');
  });

  it('D4 a wrong word is marked, the hearts fall by 1, and the same step returns with a shut word', async () => {
    const h = harness(5);
    await h.player.start();
    const first = h.ask()! as Extract<Ask, { kind: 'step' }>;
    const wrong = first.shown.step.choices.find((c) => !c.right)!;
    first.pick(wrong.index);
    await settle();
    expect(h.log).toContain('mark:false');
    expect(h.log.some((l) => l.startsWith('strike:'))).toBe(true);
    expect(h.sim.state.hearts).toBe(h.sim.state.maxHearts - 1);
    const again = h.ask()! as Extract<Ask, { kind: 'step' }>;
    expect(again.shown.step.index).toBe(first.shown.step.index);
    expect(again.shown.step.choices.find((c) => c.index === wrong.index)!.blocked).toBe(true);
  });

  it('D4 ignores a tap after the end', async () => {
    const h = harness(3);
    await h.player.start();
    h.player.destroy();
    await h.player.pick(0);
    expect(h.sim.state.picks).toBe(0);
  });
});
