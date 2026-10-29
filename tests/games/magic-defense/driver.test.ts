/**
 * The view driver plays the core events in order and reports the run once.
 * Rows H14 and H15 come from the track test strategy
 * (measure/tracks/game_magic_defense_rebuild_20261029/test-strategy.md, section 4).
 */
import { describe, expect, it } from 'vitest';
import {
  MAGIC_DEFENSE_EVENT_TYPES,
  TUNING,
  wardOf,
  type HeldMissile,
  type MagicDefenseCommand,
  type MagicDefenseEvent,
  type MagicDefenseSimulation,
  type Round,
} from '../../../src/games/magic-defense/core/index.js';
import { MagicDefensePlayer, type EnemyShown, type Presentation } from '../../../src/games/magic-defense/view/driver.js';
import { SHORT_STORY, STORY, active, create, missilesOf, rightChoice } from './helpers.js';

/** Recorder calls that `showInput` and `play` make after every event; they do not count for one event. */
const AFTER_EVERY_EVENT = new Set(['setProgress', 'showRound', 'settle']);

function harness(seed: number, helper = false, story = SHORT_STORY) {
  const sim = create(seed, helper, story);
  const log: string[] = [];
  const calls: string[] = [];
  const thrown: { missile: HeldMissile; enemy: EnemyShown }[] = [];
  const done: unknown[] = [];
  let ask: { round: Round; cast: (choice: number) => void } | null = null;
  const p: Presentation = {
    setCastles: (c) => {
      calls.push('setCastles');
      log.push(`castles:${c.join(',')}`);
    },
    setMana: (v) => {
      calls.push('setMana');
      log.push(`mana:${v}`);
    },
    setProgress: (w, n, d, sz) => {
      calls.push('setProgress');
      log.push(`progress:${w}/${n}:${d}/${sz}`);
    },
    spawnWave: async (w, _n, enemies) => {
      calls.push('spawnWave');
      log.push(`spawn:${w}:${enemies.length}`);
    },
    throwMissile: async (missile: HeldMissile, enemy: EnemyShown) => {
      calls.push('throwMissile');
      thrown.push({ missile: structuredClone(missile), enemy: { ...enemy } });
      log.push(`throw:${missile.castle}:${enemy.id}`);
    },
    showRound: (round, cast) => {
      calls.push('showRound');
      ask = { round, cast };
    },
    hideRound: () => {
      calls.push('hideRound');
      ask = null;
    },
    markCast: async (_choice, correct) => {
      calls.push('markCast');
      log.push(`mark:${correct}`);
    },
    castSpell: async (_e, correct) => {
      calls.push('castSpell');
      log.push(`spell:${correct}`);
    },
    castleHit: async (_e, hero, castle, health) => {
      calls.push('castleHit');
      log.push(`hit:${hero}:${castle}:${health}`);
    },
    rest: async () => {
      calls.push('rest');
      log.push('rest');
    },
    storm: async () => {
      calls.push('storm');
      log.push('storm');
    },
    clearWave: async (enemies) => {
      calls.push('clearWave');
      log.push(`clear:${enemies.length}`);
    },
    cardPopup: (t) => {
      calls.push('cardPopup');
      log.push(`coins:${t}`);
    },
    sfx: () => {
      calls.push('sfx');
    },
    victory: async () => {
      calls.push('victory');
      log.push('victory');
    },
    settle: async () => {
      calls.push('settle');
    },
  };
  const player = new MagicDefensePlayer({ sim, story, seed, presentation: p, complete: (r, o, e) => done.push([r, o, e]), now: () => 0 });
  return { sim, log, calls, thrown, done, player, ask: () => ask };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

/**
 * The H14 command mix: a rejected tap now and then, the storm at full mana, wrong casts until the
 * first rest, and else the right word.
 */
function mixCommand(sim: MagicDefenseSimulation, step: number, rested: boolean): MagicDefenseCommand {
  const s = sim.state;
  if (!s.started) return { type: 'start' };
  if (step % 9 === 4) return { type: 'cast', choice: 99 };
  if (s.mana >= s.maxMana) return { type: 'storm' };
  const round = s.round!;
  const wrong = round.choices.find((c) => c.wordId !== round.wordId && !c.blocked);
  if (!rested && wrong) return { type: 'cast', choice: wrong.index };
  return { type: 'cast', choice: rightChoice(sim) };
}

/** Runs the mix to the victory; `each` gets the events of every command. A run that does not end throws. */
async function runMix(sim: MagicDefenseSimulation, each: (events: MagicDefenseEvent[]) => Promise<void> | void): Promise<void> {
  let rested = false;
  for (let step = 0; sim.state.phase === 'playing'; step++) {
    if (step >= 400) throw new Error('the mix did not end in 400 steps');
    const events = sim.dispatch(mixCommand(sim, step, rested));
    if (events.some((e) => e.type === 'rest')) rested = true;
    await each(events);
  }
}

describe('driver', () => {
  it.each([1, 2, 3])('H15 seed %i: the student taps through to victory; complete is called once; one thrown missile per word', async (seed) => {
    const h = harness(seed, seed === 2);
    await h.player.start();
    expect(h.log.some((l) => l.startsWith('spawn:'))).toBe(true);
    expect(h.ask()).not.toBeNull();
    for (let i = 0; i < 200 && !h.player.finished; i++) {
      const { round, cast } = h.ask()!;
      expect(round.wordId, 'the card shows the active missile').toBe(active(h.sim).wordId);
      cast(round.choices.find((c) => c.wordId === round.wordId)!.index);
      await settle();
    }
    expect(h.sim.state.phase).toBe('victory');
    expect(h.done).toHaveLength(1);
    expect(h.log.filter((l) => l === 'victory')).toHaveLength(1);
    expect(h.log.filter((l) => l === 'spell:true')).toHaveLength(SHORT_STORY.vocabulary.length);
    expect(h.log.filter((l) => l.startsWith('clear:'))).toHaveLength(h.sim.state.waveCount);
    expect(h.log.filter((l) => l.startsWith('spawn:'))).toHaveLength(h.sim.state.waveCount);
    expect(h.thrown, 'one throwMissile call per story word').toHaveLength(SHORT_STORY.vocabulary.length);
    expect(new Set(h.thrown.map((t) => t.missile.wordId))).toEqual(new Set(SHORT_STORY.vocabulary.map((v) => v.id)));
  });

  it('H15 (ASM-2, ASM-3): a wrong tap fizzles, the missile hits its castle, and the next card shows the same meaning with the shut word', async () => {
    const h = harness(5);
    await h.player.start();
    expect(h.thrown.length, 'start throws one missile per held place').toBe(missilesOf(h.sim).length);
    expect(h.thrown.length).toBeGreaterThan(0);
    const { round, cast } = h.ask()!;
    const hit = structuredClone(active(h.sim));
    expect(round.wordId).toBe(hit.wordId);
    const wrong = round.choices.find((c) => c.wordId !== round.wordId)!;
    cast(wrong.index);
    await settle();
    expect(h.log).toContain('mark:false');
    expect(h.log).toContain('spell:false');
    expect(h.log.filter((l) => l.startsWith('hit:'))).toEqual([`hit:${wardOf(hit.castle)}:${hit.castle}:${TUNING.castleHealth - 1}`]);
    expect(h.sim.state.castles.reduce((a, b) => a + b, 0)).toBe(h.sim.state.castles.length * h.sim.state.maxCastleHealth - 1);
    const again = h.ask()!;
    expect(again.round.wordId).toBe(round.wordId);
    expect(again.round.wordId).toBe(active(h.sim).wordId);
    expect(again.round.choices.find((c) => c.index === wrong.index)!.blocked).toBe(true);
  });

  it('H14 guard: MAGIC_DEFENSE_EVENT_TYPES lists missileThrown and equals the types of a full run with wrong casts and a storm', async () => {
    expect([...MAGIC_DEFENSE_EVENT_TYPES]).toContain('missileThrown');
    expect(new Set(MAGIC_DEFENSE_EVENT_TYPES).size, 'no type is listed twice').toBe(MAGIC_DEFENSE_EVENT_TYPES.length);
    const sim = create(1, true, STORY);
    const seen = new Set<string>();
    await runMix(sim, (events) => {
      for (const e of events) seen.add(e.type);
    });
    expect([...seen].sort()).toEqual([...MAGIC_DEFENSE_EVENT_TYPES].sort());
  });

  it('H14: every event type makes a recorder call; missileThrown calls throwMissile with the missile and its thrower', async () => {
    const h = harness(1, true, STORY);
    const perType = new Map<string, number[]>();
    const thrownEvents: HeldMissile[] = [];
    await runMix(h.sim, async (events) => {
      for (const ev of events) {
        const before = h.calls.filter((c) => !AFTER_EVERY_EVENT.has(c)).length;
        await h.player.play([ev]);
        const made = h.calls.filter((c) => !AFTER_EVERY_EVENT.has(c)).length - before;
        perType.set(ev.type, [...(perType.get(ev.type) ?? []), made]);
        if (ev.type === 'missileThrown') thrownEvents.push(ev.missile);
      }
    });
    expect(h.player.finished).toBe(true);
    expect(h.done).toHaveLength(1);
    // `rejected` shows nothing. `roundShown` is shown by `showInput` (showRound) after the events of a command.
    for (const type of MAGIC_DEFENSE_EVENT_TYPES) {
      if (type === 'rejected' || type === 'roundShown') continue;
      const made = perType.get(type) ?? [];
      expect(made.length, `the mix emits ${type}`).toBeGreaterThan(0);
      expect(made.every((n) => n > 0), `every ${type} event makes a recorder call`).toBe(true);
    }
    expect(thrownEvents.length, 'the run throws held missiles').toBeGreaterThan(0);
    expect(h.thrown, 'one throwMissile call per missileThrown event').toHaveLength(thrownEvents.length);
    h.thrown.forEach((t, i) => {
      expect(t.missile).toEqual(thrownEvents[i]);
      expect(t.enemy.id, 'the thrower is the enemy of the missile').toBe(t.missile.enemyId);
      expect(t.enemy.lane, 'the thrower stands in the lane of the castle').toBe(t.missile.castle);
    });
  });

  it('the storm button works only with full mana, then mends the castles', async () => {
    const h = harness(4);
    await h.player.start();
    await h.player.storm();
    expect(h.log).not.toContain('storm');
    for (let i = 0; i < 40 && h.sim.state.mana < h.sim.state.maxMana && !h.player.finished; i++) {
      const { round, cast } = h.ask()!;
      cast(round.choices.find((c) => c.wordId === round.wordId)!.index);
      await settle();
    }
    if (h.sim.state.mana >= h.sim.state.maxMana) {
      await h.player.storm();
      expect(h.log).toContain('storm');
      expect(h.sim.state.mana).toBe(0);
    }
  });

  it('ignores a tap after the end', async () => {
    const h = harness(3);
    await h.player.start();
    h.player.destroy();
    await h.player.cast(0);
    expect(h.sim.state.casts).toBe(0);
  });
});
