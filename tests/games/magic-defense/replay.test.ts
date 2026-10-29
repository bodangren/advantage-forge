/**
 * An Magic Defense run is a function of its seed: the same commands replay to the same snapshot.
 * Rows H3 and H12 come from the track test strategy
 * (measure/tracks/game_magic_defense_rebuild_20261029/test-strategy.md, section 4).
 */
import { describe, expect, it } from 'vitest';
import { createRecorder, createRng } from '../../../src/apk3d/sim/index.js';
import { createMagicDefense, type MagicDefenseEvent } from '../../../src/games/magic-defense/core/index.js';
import { nextCommand } from '../../../src/games/magic-defense/qc/bot.js';
import { STORY, castRight, castWrong, create, hasWrong, missilesOf, ofType, wrongChoice } from './helpers.js';

describe('replay', () => {
  it('same seed -> same targets, waves, and first round', () => {
    const a = create(42).snapshot();
    expect(create(42).snapshot()).toEqual(a);
    const c = create(43).snapshot();
    expect(c.targets.map((t) => t.id)).not.toEqual(a.targets.map((t) => t.id));
  });

  it('H12: same seed + same commands -> same events and snapshot; right, wrong, rejected, and storm commands mixed', () => {
    const seed = 1234;
    const run = (): { events: MagicDefenseEvent[]; snapshot: unknown } => {
      const sim = create(seed);
      const chaos = createRng(99);
      const events: MagicDefenseEvent[] = [...sim.dispatch({ type: 'start' }), ...sim.dispatch({ type: 'cast', choice: 99 })];
      for (let i = 0; i < 120 && sim.state.phase === 'playing'; i++) {
        if (sim.state.mana >= sim.state.maxMana) {
          events.push(...sim.dispatch({ type: 'storm' }));
          continue;
        }
        const roll = chaos.next();
        if (roll < 0.55) {
          const c = nextCommand(sim.state);
          if (c) events.push(...sim.dispatch(c));
        } else if (roll < 0.8) {
          if (hasWrong(sim)) events.push(...sim.dispatch({ type: 'cast', choice: wrongChoice(sim) }));
        } else if (roll < 0.9) {
          events.push(...sim.dispatch({ type: 'storm' }));
        } else {
          events.push(...sim.dispatch({ type: 'cast', choice: 99 }));
        }
      }
      return { events, snapshot: sim.snapshot() };
    };
    const a = run();
    const b = run();
    expect(a.events).toEqual(b.events);
    expect(a.snapshot).toEqual(b.snapshot);
    expect(ofType(a.events, 'rejected').length, 'the mix has rejected commands').toBeGreaterThan(0);
    expect(ofType(a.events, 'castleHit').length, 'the mix has wrong casts').toBeGreaterThan(0);
    expect(ofType(a.events, 'stormCast').length, 'the mix has a storm').toBeGreaterThan(0);
    expect(ofType(a.events, 'missileThrown').length, 'the run throws held missiles').toBeGreaterThan(0);
  });

  it('the recorder replays the commands to the same snapshot', () => {
    const seed = 77;
    const rec = createRecorder(seed, create(seed));
    rec.dispatch({ type: 'start' });
    for (let i = 0; i < 30 && rec.state.phase === 'playing'; i++) {
      const c = nextCommand(rec.state);
      if (c) rec.dispatch(c);
      if (i % 5 === 4) {
        const round = rec.state.round!;
        const wrong = round.choices.find((c) => c.wordId !== round.wordId && !c.blocked);
        if (wrong) rec.dispatch({ type: 'cast', choice: wrong.index });
      }
      rec.tick();
    }
    expect(rec.commands.length).toBeGreaterThan(10);
    const replayed = rec.replay((s) => createMagicDefense(STORY, { seed: s, helper: false }));
    expect(replayed).toEqual(rec.snapshot());
  });

  it('H3: tick() changes nothing; 500 ticks return [], the snapshot stays equal, and no held missile leaves without a cast', () => {
    const sim = create(3);
    sim.dispatch({ type: 'start' });
    castWrong(sim);
    castRight(sim);
    const before = sim.snapshot();
    for (let i = 0; i < 500; i++) expect(sim.tick()).toEqual([]);
    expect(sim.snapshot()).toEqual(before);
    const held = missilesOf(sim).map((m) => m.id);
    expect(held.length, 'the run holds missiles while it ticks').toBeGreaterThan(0);
    expect(before.missiles.map((m) => m.id)).toEqual(held);
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
