/**
 * An Archer's Revenge run is a function of its seed: the same commands replay to the same
 * snapshot, and the same angle and power give the same path. Row ids R6 and R14 refer to the
 * track test strategy, section 4.
 */
import { describe, expect, it, vi } from 'vitest';
import { createRecorder, createRng } from '../../../src/apk3d/sim/index.js';
import { createArchersRevenge } from '../../../src/games/archers-revenge/core/index.js';
import { nextCommand } from '../../../src/games/archers-revenge/qc/bot.js';
import {
  FIXED_PAIRS,
  LAYOUT_LANES,
  STORY,
  blockedOf,
  create,
  fire,
  missPair,
  needAim,
  numbersOf,
  ofType,
  pairFor,
  sameNumbers,
  wrongLane,
  type AimCore,
  type AnyEvent,
} from './helpers.js';

/** The numbers and the contact kinds of the fixed pairs, for both layouts, open and with lane 0 shut. */
function shotsOf(A: AimCore): { numbers: number[]; kinds: string[] } {
  const numbers: number[] = [];
  const kinds: string[] = [];
  for (const lanes of LAYOUT_LANES) {
    const layout = A.layoutOf(lanes);
    for (const blocked of [[], [0]]) {
      for (const { angle, power } of FIXED_PAIRS) {
        const shot = A.shotOf(layout, blocked, angle, power);
        numbersOf(shot, numbers);
        kinds.push(shot.contact.kind);
      }
    }
  }
  return { numbers, kinds };
}

describe('replay', () => {
  it('same seed -> same targets, waves, and first round', () => {
    const a = create(42).snapshot();
    expect(create(42).snapshot()).toEqual(a);
    const c = create(43).snapshot();
    expect(c.targets.map((t) => t.id)).not.toEqual(a.targets.map((t) => t.id));
  });

  it('R6: the same pair gives the same path and contact, in one import and in two fresh imports', async () => {
    const A = needAim('layoutOf', 'shotOf');
    const here = shotsOf(A);
    expect(sameNumbers(shotsOf(A).numbers, here.numbers)).toBe(true);
    const fresh: { numbers: number[]; kinds: string[] }[] = [];
    for (let k = 0; k < 2; k++) {
      vi.resetModules();
      const m = (await import('../../../src/games/archers-revenge/core/index.js')) as unknown as AimCore;
      fresh.push(shotsOf(m));
    }
    expect(here.numbers.length).toBeGreaterThan(FIXED_PAIRS.length * 8);
    expect(sameNumbers(fresh[0]!.numbers, fresh[1]!.numbers)).toBe(true);
    expect(sameNumbers(fresh[0]!.numbers, here.numbers)).toBe(true);
    expect(fresh[0]!.kinds).toEqual(fresh[1]!.kinds);
    expect(fresh[0]!.kinds).toEqual(here.kinds);
    expect(here.numbers.filter((v) => !Number.isFinite(v))).toEqual([]);
    expect(here.numbers.filter((v) => Object.is(v, -0))).toHaveLength(0);
  });

  it('R14: same seed + same commands -> same events and snapshot; right, wrong, miss, shut, and rejected mixed', () => {
    const seed = 1234;
    const run = () => {
      const sim = create(seed);
      const chaos = createRng(99);
      const chunks: AnyEvent[][] = [];
      const stamps: string[] = [];
      const send = (events: readonly AnyEvent[]): void => {
        chunks.push([...events]);
        stamps.push(JSON.stringify(events));
      };
      send(sim.dispatch({ type: 'start' }) as AnyEvent[]);
      send(fire(sim, 81, 50));
      send(fire(sim, 45.5, 50));
      // A fixed opening: a wrong hit, then a shut miss on that lane. The chaos part follows.
      const shutLane = wrongLane(sim);
      const opening = pairFor(sim, shutLane);
      send(fire(sim, opening.angle, opening.power));
      const again = missPair(sim, 'shut', shutLane);
      send(fire(sim, again.angle, again.power));
      for (let i = 0; i < 80 && sim.state.phase === 'playing'; i++) {
        const roll = chaos.next();
        const round = sim.state.round!;
        if (roll < 0.45) {
          const c = nextCommand(sim.state);
          if (c) send(sim.dispatch(c) as AnyEvent[]);
        } else if (roll < 0.65) {
          if (round.lanes.some((l) => l.wordId !== round.wordId && !l.blocked)) {
            const p = pairFor(sim, wrongLane(sim));
            send(fire(sim, p.angle, p.power));
          }
        } else if (roll < 0.8) {
          const p = missPair(sim, 'ground');
          send(fire(sim, p.angle, p.power));
        } else if (roll < 0.9) {
          const shut = blockedOf(sim)[0];
          if (shut !== undefined) {
            const p = missPair(sim, 'shut', shut);
            send(fire(sim, p.angle, p.power));
          }
        } else {
          send(i % 2 === 0 ? fire(sim, -1, 50) : fire(sim, 30, 50.5));
        }
      }
      return { chunks, stamps, events: chunks.flat(), snapshot: sim.snapshot() };
    };
    const a = run();
    const b = run();
    expect(a.events).toEqual(b.events);
    expect(a.snapshot).toEqual(b.snapshot);
    expect(ofType(a.events, 'missed').length).toBeGreaterThan(0);
    expect(ofType(a.events, 'missed').some((e) => e.kind === 'shut')).toBe(true);
    expect(ofType(a.events, 'missed').some((e) => e.kind === 'ground')).toBe(true);
    expect(ofType(a.events, 'rejected').length).toBeGreaterThan(0);
    expect(ofType(a.events, 'enemyStrike').length).toBeGreaterThan(0);
    // No event holds a reference to the state: the events at the end equal the events at emission.
    expect(a.chunks.map((c) => JSON.stringify(c))).toEqual(a.stamps);
    expect(structuredClone(a.events)).toStrictEqual(a.events);
    expect(JSON.parse(JSON.stringify(a.events))).toStrictEqual(a.events);
  });

  it('R14: the recorder replays aimed shots and misses to the same snapshot', () => {
    const seed = 77;
    const rec = createRecorder(seed, create(seed));
    rec.dispatch({ type: 'start' });
    let misses = 0;
    for (let i = 0; i < 30 && rec.state.phase === 'playing'; i++) {
      const c = nextCommand(rec.state);
      if (c) rec.dispatch(c);
      if (rec.state.phase !== 'playing') break;
      if (i % 5 === 4) {
        const round = rec.state.round!;
        if (round.lanes.some((l) => l.wordId !== round.wordId && !l.blocked)) {
          const p = pairFor(rec, wrongLane(rec));
          fire(rec, p.angle, p.power);
        }
      }
      if (i % 4 === 1) {
        const p = missPair(rec, 'ground');
        const events = fire(rec, p.angle, p.power);
        misses += ofType(events, 'missed').length;
      }
      rec.tick();
    }
    expect(misses).toBeGreaterThan(0);
    expect(rec.commands.length).toBeGreaterThan(10);
    const replayed = rec.replay((s) => createArchersRevenge(STORY, { seed: s, helper: false }));
    expect(replayed).toEqual(rec.snapshot());
  });

  it('snapshot() is a deep copy and tick() returns nothing', () => {
    const sim = create(1);
    expect(sim.tick()).toEqual([]);
    const snap = sim.snapshot();
    expect(snap).toEqual(sim.state);
    expect(snap).not.toBe(sim.state);
    snap.targets[0]!.solved = true;
    expect(sim.state.targets[0]!.solved).toBe(false);
  });
});
