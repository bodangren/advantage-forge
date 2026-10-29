/**
 * T8: a Paladin's Twin Soul run is a function of its seed. The same commands replay to the same
 * events and the same snapshot. The chaos run holds wrong strikes, so the dive draws (assumption
 * Q1) and the shade kinds (assumption Q3) enter the replay.
 */
import { describe, expect, it } from 'vitest';
import { createRecorder, createRng } from '../../../src/apk3d/sim/index.js';
import { createTwinSoul, type TwinSoulSimulation } from '../../../src/games/paladins-twin-soul/core/index.js';
import { nextStrike } from '../../../src/games/paladins-twin-soul/qc/bot.js';
import { STORY, create, ofType, send, shadesNow, wrongShade, type Ev } from './helpers.js';

/** A mixed run: right strikes, wrong strikes, and strikes on a missing shade, from one chaos seed. */
function chaosRun(sim: TwinSoulSimulation, chaosSeed: number): Ev[] {
  const chaos = createRng(chaosSeed);
  const events: Ev[] = [...send(sim, { type: 'start' })];
  for (let i = 0; i < 80 && sim.state.phase === 'playing'; i++) {
    const roll = chaos.next();
    if (roll < 0.6) {
      const c = nextStrike(sim.state);
      if (c) events.push(...send(sim, c));
    } else if (roll < 0.9) {
      const w = wrongShade(sim);
      if (w) events.push(...send(sim, { type: 'strike', shade: w }));
    } else {
      events.push(...send(sim, { type: 'strike', shade: 'missing' }));
    }
    sim.tick();
  }
  return events;
}

describe('T8 replay', () => {
  it('T8 (kept row): same seed -> same targets and formation; another seed differs', () => {
    expect(create(42).snapshot()).toEqual(create(42).snapshot());
    const a = create(42).snapshot();
    const c = create(43).snapshot();
    expect(c.targets.map((t) => t.id)).not.toEqual(a.targets.map((t) => t.id));
  });

  it('T8 Q3: the same seed gives the same shade kinds', () => {
    const a = shadesNow(create(42)).map((s) => s.kind);
    expect(a.every((k) => typeof k === 'string')).toBe(true);
    expect(shadesNow(create(42)).map((s) => s.kind)).toEqual(a);
  });

  it.each([5, 6, 7])('T8 Q1 chaos seed %i: same seed + same commands -> the same events, dives included', (chaosSeed) => {
    const a = chaosRun(create(7), chaosSeed);
    const b = chaosRun(create(7), chaosSeed);
    // The run must hold dives and bolts, so the dive draws enter the comparison.
    expect(ofType(a, 'shadeDived').length).toBeGreaterThan(0);
    expect(ofType(a, 'boltFired').length).toBeGreaterThan(0);
    expect(b).toEqual(a);
    expect(ofType(b, 'shadeDived').map((e) => e.shade)).toEqual(ofType(a, 'shadeDived').map((e) => e.shade));
  });

  it('T8 Q1: a recorded run with dives replays to the same snapshot', () => {
    const seed = 1234;
    const rec = createRecorder(seed, create(seed));
    const events = chaosRun(rec, 7);
    expect(rec.commands.length).toBeGreaterThan(10);
    expect(rec.state.targetIndex).toBeGreaterThan(3);
    expect(rec.commands.some((c) => c.command.type === 'strike' && c.command.shade === 'missing')).toBe(true);
    expect(ofType(events, 'shadeDived').length).toBeGreaterThan(0);
    const replayed = rec.replay((s) => createTwinSoul(STORY, { seed: s, helper: false }));
    expect(replayed).toEqual(rec.snapshot());
  });

  it('T8 (kept row): snapshot() is a deep copy and tick() returns nothing', () => {
    const sim = create(1);
    expect(sim.tick()).toEqual([]);
    const snap = sim.snapshot();
    expect(snap).toEqual(sim.state);
    snap.shades[0]!.fallen = true;
    expect(sim.state.shades[0]!.fallen).toBe(false);
  });
});
