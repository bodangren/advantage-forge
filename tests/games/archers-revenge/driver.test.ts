/**
 * The view driver plays the core events in order and reports the run once. Row id R15 refers to
 * the track test strategy, section 4 (D10, D12): the `Presentation.showRound` callback is
 * `fire(angle, power)`, and the driver shows every event type except `roundShown` and `rejected`.
 */
import { describe, expect, it } from 'vitest';
import { ARCHERS_REVENGE_EVENT_TYPES, type ArchersRevengeEvent, type Round } from '../../../src/games/archers-revenge/core/index.js';
import { ArchersRevengePlayer, type Presentation } from '../../../src/games/archers-revenge/view/driver.js';
import {
  SHORT_STORY,
  blockedOf,
  create,
  fire,
  missPair,
  needAim,
  pairFor,
  rightLane,
  wrongLane,
  type AnyEvent,
  type Pair,
} from './helpers.js';

type Fire = (angle: number, power: number) => void;

/** Calls that `play` and `showInput` make after every event list, whatever the events are. */
const FRAME_CALLS = new Set(['settle', 'setProgress', 'showRound']);

/**
 * A recorder `Presentation`: every method logs its name and resolves at once. `showRound` keeps
 * the round and the fire callback. A Proxy answers the methods that Green adds for new events.
 */
function harness(seed: number, helper = false) {
  const sim = create(seed, helper, SHORT_STORY);
  const calls: string[] = [];
  const done: unknown[] = [];
  let ask: { round: Round; fire: Fire } | null = null;
  const p = new Proxy({} as Record<string, unknown>, {
    get(_t, name) {
      if (typeof name !== 'string' || name === 'then') return undefined;
      return (...args: unknown[]) => {
        calls.push(name);
        if (name === 'showRound') ask = { round: args[0] as Round, fire: args[1] as Fire };
        if (name === 'hideRound') ask = null;
        return Promise.resolve();
      };
    },
  }) as unknown as Presentation;
  const player = new ArchersRevengePlayer({ sim, story: SHORT_STORY, seed, presentation: p, complete: (r, o, e) => done.push([r, o, e]), now: () => 0 });
  return { sim, calls, done, player, ask: () => ask };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('driver', () => {
  it.each([1, 2, 3])('R15: seed %i: the student fires (angle, power) through to victory; complete is called once', async (seed) => {
    needAim('shotOf');
    const h = harness(seed, seed === 2);
    await h.player.start();
    expect(h.calls).toContain('spawnWave');
    expect(h.ask()).not.toBeNull();
    for (let i = 0; i < 200 && !h.player.finished; i++) {
      const { fire: shoot } = h.ask()!;
      const pair: Pair = pairFor(h.sim, rightLane(h.sim));
      const shots = h.sim.state.shots;
      shoot(pair.angle, pair.power);
      await settle();
      expect(h.sim.state.shots).toBe(shots + 1);
    }
    expect(h.sim.state.phase).toBe('victory');
    expect(h.done).toHaveLength(1);
    expect(h.calls.filter((c) => c === 'victory')).toHaveLength(1);
    expect(h.sim.state.targets.every((t) => t.attempts === 1 && t.correctFirstTry)).toBe(true);
  });

  it('R15: every event type of a run with right, wrong, miss, shut, rest, and rejected makes a presentation call; the silent list is roundShown and rejected', async () => {
    needAim('shotOf');
    expect(ARCHERS_REVENGE_EVENT_TYPES).toContain('missed');
    const h = harness(4);
    const callsPer = new Map<string, number[]>();
    const play = async (events: readonly AnyEvent[]): Promise<void> => {
      for (const ev of events) {
        const before = h.calls.length;
        await h.player.play([ev as ArchersRevengeEvent]);
        const made = h.calls.slice(before).filter((c) => !FRAME_CALLS.has(c)).length;
        callsPer.set(ev.type, [...(callsPer.get(ev.type) ?? []), made]);
      }
    };
    await play(h.sim.dispatch({ type: 'start' }) as AnyEvent[]);
    await play(fire(h.sim, 81, 50));
    const ground = missPair(h.sim, 'ground');
    await play(fire(h.sim, ground.angle, ground.power));
    const lane = wrongLane(h.sim);
    const wrong = pairFor(h.sim, lane);
    await play(fire(h.sim, wrong.angle, wrong.power));
    const shut = missPair(h.sim, 'shut', lane);
    await play(fire(h.sim, shut.angle, shut.power));
    for (let i = 0; i < 100 && h.sim.state.phase === 'playing'; i++) {
      const round = h.sim.state.round!;
      const rested = callsPer.has('rest');
      const canMiss = !rested && round.lanes.some((l) => l.wordId !== round.wordId && !l.blocked);
      const pair = canMiss ? pairFor(h.sim, wrongLane(h.sim)) : pairFor(h.sim, rightLane(h.sim));
      await play(fire(h.sim, pair.angle, pair.power));
    }
    expect(h.sim.state.phase).toBe('victory');
    expect(blockedOf(h.sim)).toEqual([]);
    const seen = [...callsPer.keys()].sort();
    expect(seen).toEqual([...ARCHERS_REVENGE_EVENT_TYPES].sort());
    const silent = seen.filter((t) => callsPer.get(t)!.every((n) => n === 0));
    expect(silent).toEqual(['rejected', 'roundShown']);
    for (const t of seen.filter((s) => !silent.includes(s))) {
      expect(callsPer.get(t)!.every((n) => n > 0), `every ${t} event makes a call`).toBe(true);
    }
    expect(h.done).toHaveLength(1);
  });

  it('R15: a second fire while the driver is busy changes nothing', async () => {
    needAim('shotOf');
    const h = harness(5);
    await h.player.start();
    const { fire: shoot } = h.ask()!;
    const pair = pairFor(h.sim, rightLane(h.sim));
    const before = h.sim.state.shots;
    shoot(pair.angle, pair.power);
    shoot(pair.angle, pair.power);
    await settle();
    expect(h.sim.state.shots).toBe(before + 1);
  });

  it('R15: a wrong arrow is shot, the enemy strikes, courage drops, and the same prompt returns with a shut lane', async () => {
    needAim('shotOf');
    const h = harness(5);
    await h.player.start();
    const before = h.sim.state.courage;
    const { round, fire: shoot } = h.ask()!;
    const lane = wrongLane(h.sim);
    const pair = pairFor(h.sim, lane);
    shoot(pair.angle, pair.power);
    await settle();
    expect(h.calls).toContain('markShot');
    expect(h.calls).toContain('shoot');
    expect(h.calls).toContain('enemyStrike');
    expect(h.sim.state.courage).toBe(before - 1);
    const again = h.ask()!;
    expect(again.round.wordId).toBe(round.wordId);
    expect(again.round.lanes.find((l) => l.lane === lane)!.blocked).toBe(true);
  });

  it('ignores a shot after the end', async () => {
    const h = harness(3);
    await h.player.start();
    h.player.destroy();
    await (h.player as unknown as { fire(angle: number, power: number): Promise<void> }).fire(45, 50);
    expect(h.sim.state.shots).toBe(0);
  });
});
