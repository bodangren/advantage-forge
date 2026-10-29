/** A Castle Defense run is a function of its seed: the same commands replay to the same snapshot (rows R1 to R4). */
import { describe, expect, it } from 'vitest';
import { createRecorder, createRng } from '../../../src/apk3d/sim/index.js';
import { createCastleDefense, type CastleDefenseEvent } from '../../../src/games/castle-defense/core/index.js';
import { nextCommand } from '../../../src/games/castle-defense/qc/bot.js';
import { STORY, buildOn, create, narrowestSpot, ofType, playWith, widestSpot, wrongChoice } from './helpers.js';

describe('replay', () => {
  it('same seed -> same waves and first step', () => {
    const a = create(42).snapshot();
    expect(create(42).snapshot()).toEqual(a);
    expect(create(43).snapshot().shift.map((s) => s.id)).not.toEqual(a.shift.map((s) => s.id));
  });

  it('R1 same seed + same commands -> same events and snapshot; right, wrong, rejected, and random spots mixed', () => {
    const run = (): { events: CastleDefenseEvent[]; snapshot: unknown } => {
      const sim = create(1234);
      const chaos = createRng(99);
      const events: CastleDefenseEvent[] = [...sim.dispatch({ type: 'start' }), ...sim.dispatch({ type: 'pick', choice: 99 })];
      for (let i = 0; i < 160 && sim.state.phase === 'playing'; i++) {
        const roll = chaos.next();
        if (sim.state.stage === 'place') {
          events.push(...(roll < 0.2 ? buildOn(sim, 99) : buildOn(sim, chaos.int(6))));
        } else if (roll < 0.6) {
          const c = nextCommand(sim.state);
          if (c) events.push(...sim.dispatch(c));
        } else if (roll < 0.85) {
          if (sim.state.step?.choices.some((c) => !c.right && !c.blocked)) events.push(...sim.dispatch({ type: 'pick', choice: wrongChoice(sim) }));
        } else {
          events.push(...sim.dispatch({ type: 'pick', choice: 99 }), ...buildOn(sim, 99));
        }
      }
      return { events, snapshot: sim.snapshot() };
    };
    const a = run();
    const b = run();
    expect(a.events).toEqual(b.events);
    expect(a.snapshot).toEqual(b.snapshot);
    expect(ofType(a.events, 'rejected').length, 'rejected events').toBeGreaterThan(0);
    expect(ofType(a.events, 'attackerStrike').length, 'attackerStrike events').toBeGreaterThan(0);
    expect(ofType(a.events, 'waveStep').length, 'waveStep events').toBeGreaterThan(0);
  });

  it('R2 the recorder replays the commands to the same snapshot', () => {
    const rec = createRecorder(77, create(77));
    rec.dispatch({ type: 'start' });
    for (let i = 0; i < 40 && rec.state.phase === 'playing'; i++) {
      const c = nextCommand(rec.state);
      if (c) rec.dispatch(c);
      if (i % 5 === 4 && rec.state.step) {
        const wrong = rec.state.step.choices.find((x) => !x.right && !x.blocked);
        if (wrong) rec.dispatch({ type: 'pick', choice: wrong.index });
      }
      rec.tick();
    }
    expect(rec.commands.length).toBeGreaterThan(10);
    const replayed = rec.replay((s) => createCastleDefense(STORY, { seed: s, helper: false }));
    expect(replayed).toEqual(rec.snapshot());
  });

  it('R3 the same seed with different spots gives different events', () => {
    const a = playWith(create(5), widestSpot);
    const b = playWith(create(5), narrowestSpot);
    expect(ofType(a.events, 'waveStep').length).toBeGreaterThan(0);
    expect(ofType(b.events, 'waveStep').length).toBeGreaterThan(0);
    expect(ofType(a.events, 'rejected')).toHaveLength(0);
    expect(ofType(b.events, 'rejected')).toHaveLength(0);
    expect(a.events).not.toEqual(b.events);
  });

  it('R4 snapshot() is a deep copy and tick() returns nothing', () => {
    const sim = create(1);
    expect(sim.tick()).toEqual([]);
    const snap = sim.snapshot();
    expect(snap).toEqual(sim.state);
    expect(snap).not.toBe(sim.state);
    snap.shift[0]!.cleared = true;
    expect(sim.state.shift[0]!.cleared).toBe(false);
  });
});
