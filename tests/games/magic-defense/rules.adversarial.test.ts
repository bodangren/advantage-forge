/**
 * The adversarial rows of the Magic Defense Phase 1 gate.
 *
 * The cases come from the track test strategy
 * (measure/tracks/game_magic_defense_rebuild_20261029/test-strategy.md, section 9):
 * one word in a run of three castles, two words with the same term, a run where every castle
 * falls twice, a storm at full mana with a fallen castle, and 200 rejected commands in a row.
 * The file also holds the hostile commands, the null command of the QC hook, and the
 * determinism rows (FR-8 and H17).
 *
 * Every row reads named values. No row matches a text pattern. Every loop has a limit that
 * throws, so a broken core fails the row instead of hanging the gate.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '../../../src/apk3d/sim/index.js';
import {
  TUNING,
  createMagicDefense,
  evidenceOf,
  type MagicDefenseCommand,
  type MagicDefenseEvent,
  type MagicDefenseSimulation,
} from '../../../src/games/magic-defense/core/index.js';
import {
  STORY,
  active,
  castRight,
  castWrong,
  create,
  expectHeld,
  expectThrown,
  hasWrong,
  heldCopy,
  missilesOf,
  ofType,
  playToEnd,
  rightChoice,
  types,
  wrongChoice,
} from './helpers.js';

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);

/**
 * The fixture of the fall rows. It puts the active missile above the given castle, with the
 * enemy of that lane, and gives that castle one heart. The state is plain data, and the rows of
 * today set `state.castles` and `state.mana` the same way. The rules under test are the ones
 * that run after the fixture: the hit, the fall, the place of the meaning, and the refill.
 */
const moveActiveTo = (sim: MagicDefenseSimulation, castle: number): void => {
  const s = sim.state;
  const missile = s.missiles.find((m) => m.id === s.activeMissileId)!;
  if (missile.castle !== castle) {
    const other = s.missiles.find((m) => m.castle === castle);
    if (other) other.castle = missile.castle;
    missile.castle = castle;
    for (const m of s.missiles) m.enemyId = s.enemies.find((e) => e.lane === m.castle)!.id;
  }
  s.round!.castle = missile.castle;
  s.round!.enemyId = missile.enemyId;
  s.castles[castle] = 1;
};

describe('the cases of the strategy, section 9', () => {
  it('one word in a run of three castles: the free places stay free and the run ends in victory', () => {
    const sim = createMagicDefense([{ term: 'cat', translation: 'แมว' }], { seed: 3, helper: false });
    expect(sim.state.phase).toBe('playing');
    expect(sim.state.castles).toHaveLength(TUNING.castles);

    const events = sim.dispatch({ type: 'start' });
    expect(types(events)).toEqual(['waveAppeared', 'missileThrown', 'roundShown']);
    const list = missilesOf(sim);
    expect(list, 'one word holds one place').toHaveLength(1);
    expect(list.filter((m) => m.castle === list[0]!.castle)).toHaveLength(1);
    expect(sim.state.castles.filter((h) => h > 0)).toHaveLength(TUNING.castles);
    expect(sim.state.round!.wordId, 'the card is the card of the only missile').toBe(list[0]!.wordId);
    expect(sim.state.round!.choices, 'the card holds one word').toHaveLength(1);
    expectHeld(sim);

    const last = castRight(sim);
    expect(types(last)).toEqual(['cast', 'scored', 'waveCleared', 'victory']);
    expect(sim.state.phase).toBe('victory');
    expect(missilesOf(sim)).toEqual([]);
    expect(sim.state.round).toBeNull();
    expect(sim.state.activeMissileId).toBeNull();
    expect(sim.state.targets.every((t) => t.solved)).toBe(true);
  });

  it('two words with the same term: the card shows one word of each term and one cast solves one word', () => {
    const input = [
      { term: 'cat', translation: 'แมว' },
      { term: 'cat', translation: 'หนู' },
      { term: 'dog', translation: 'หมา' },
      { term: 'bird', translation: 'นก' },
    ];
    const sim = createMagicDefense(input, { seed: 5, helper: false });
    sim.dispatch({ type: 'start' });
    expect(sim.state.targets).toHaveLength(4);
    const cats = sim.state.targets.filter((t) => t.term.toLowerCase() === 'cat');
    expect(cats, 'the run holds two words with the same term').toHaveLength(2);

    const card = sim.state.round!;
    expect(new Set(card.choices.map((c) => c.term.toLowerCase())).size, 'the card shows no term twice').toBe(
      card.choices.length,
    );
    expect(
      card.choices.filter((c) => cats.some((t) => t.id === c.wordId)).length,
      'the card shows at most one word of the term',
    ).toBeLessThanOrEqual(1);
    expect(card.choices.filter((c) => c.wordId === card.wordId)).toHaveLength(1);

    castRight(sim);
    expect(sim.state.targets.find((t) => t.id === card.wordId)!.solved, 'the cast word is solved').toBe(true);
    for (const other of cats.filter((t) => t.id !== card.wordId)) {
      expect(other.solved, 'the other word of the term is not solved').toBe(false);
      expect(other.attempts, 'the other word of the term was never active').toBe(0);
    }
    expectHeld(sim);
  });

  it('every castle falls twice in one run', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const falls: number[] = [];
    let rests = 0;
    for (const castle of [0, 1, 2, 0, 1, 2]) {
      if (sim.state.phase !== 'playing') throw new Error('the run ended before every castle fell twice');
      // The card holds two wrong words. A right cast gives a fresh card when they are shut.
      if (!hasWrong(sim)) castRight(sim);
      moveActiveTo(sim, castle);
      const before = heldCopy(sim);
      const events = sim.dispatch({ type: 'cast', choice: wrongChoice(sim) });
      expect(ofType(events, 'castleHit'), `castle ${castle} takes the hit`).toHaveLength(1);
      expect(ofType(events, 'castleHit')[0]).toMatchObject({ castle, health: 0 });
      falls.push(castle);
      if (ofType(events, 'rest').length) {
        // Every castle fell at once. The team rests and the castles stand again.
        rests += 1;
        expect(sim.state.castles.every((h) => h === TUNING.castleHealth), 'the rest restores every castle').toBe(true);
      } else {
        expect(sim.state.castles[castle], `castle ${castle} falls`).toBe(0);
        expect(missilesOf(sim).some((m) => m.castle === castle), 'the fallen castle holds no missile').toBe(false);
      }
      expectThrown(before, events, sim);
      expectHeld(sim);
    }
    expect(falls).toEqual([0, 1, 2, 0, 1, 2]);
    for (const castle of [0, 1, 2]) {
      expect(falls.filter((c) => c === castle), `castle ${castle} fell twice`).toHaveLength(2);
    }
    expect(rests, 'the run rested when every castle fell').toBeGreaterThan(0);
  });

  it('a storm at full mana mends a fallen castle and keeps the other missiles and the shut words', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    castWrong(sim);
    const fallen = active(sim).castle;
    sim.state.castles[fallen] = 1;
    castWrong(sim);
    expect(sim.state.castles[fallen], 'the castle falls').toBe(0);
    expect(missilesOf(sim).some((m) => m.castle === fallen)).toBe(false);

    sim.state.mana = sim.state.maxMana;
    const before = heldCopy(sim);
    const activeId = sim.state.activeMissileId;
    const shut = sim.state.round!.choices.filter((c) => c.blocked).map((c) => c.index);
    expect(shut.length, 'the card holds shut words').toBeGreaterThan(0);

    const events = sim.dispatch({ type: 'storm' });
    expect(types(events)).toEqual(['stormCast', 'missileThrown', 'roundShown']);
    expect(sim.state.mana).toBe(0);
    expect(sim.state.castles.every((h) => h === TUNING.castleHealth)).toBe(true);
    expect(ofType(events, 'missileThrown').map((e) => e.missile.castle)).toEqual([fallen]);
    for (const m of before) expect(missilesOf(sim), `missile ${m.id} stays as it was`).toContainEqual(m);
    expect(sim.state.activeMissileId).toBe(activeId);
    expect(sim.state.round!.choices.filter((c) => c.blocked).map((c) => c.index)).toEqual(shut);
    expectThrown(before, events, sim);
    expectHeld(sim, { full: true });
  });

  it('200 rejected commands in a row change no state and grow no counter', () => {
    const sim = create(11);
    sim.dispatch({ type: 'start' });
    const before = sim.snapshot();
    const commands: MagicDefenseCommand[] = [
      { type: 'cast', choice: 99 },
      { type: 'cast', choice: -1 },
      { type: 'cast', choice: NaN },
      { type: 'cast' } as unknown as MagicDefenseCommand,
      { type: 'storm' },
      { type: 'start' },
    ];
    for (let i = 0; i < 200; i++) {
      const command = commands[i % commands.length]!;
      const events = sim.dispatch(command);
      expect(types(events), `command ${i} is rejected`).toEqual(['rejected']);
    }
    expect(sim.snapshot(), 'the state does not change').toEqual(before);
    expect(sim.state.casts).toBe(0);
    expect(sim.state.coins).toBe(0);
    expect(sim.state.mana).toBe(0);
    expect(sim.state.streak).toBe(0);
    expect(sim.state.bestStreak).toBe(0);
    expect(sim.state.targets.every((t) => t.attempts === 0 && !t.solved)).toBe(true);
    expect(sim.state.waveDone).toBe(0);
  });
});

describe('hostile commands', () => {
  it('an unknown command type gives no event and changes no state', () => {
    const sim = create(13);
    sim.dispatch({ type: 'start' });
    const before = sim.snapshot();
    const events = sim.dispatch({ type: 'nope' } as unknown as MagicDefenseCommand);
    expect(events, 'the core ignores an unknown command type').toEqual([]);
    expect(sim.snapshot()).toEqual(before);
  });

  it('a cast with a missing, wrong, or out-of-range choice gives a rejected event and changes no state', () => {
    const sim = create(13);
    sim.dispatch({ type: 'start' });
    const before = sim.snapshot();
    const hostile: MagicDefenseCommand[] = [
      { type: 'cast' } as unknown as MagicDefenseCommand,
      { type: 'cast', choice: '0' } as unknown as MagicDefenseCommand,
      { type: 'cast', choice: NaN },
      { type: 'cast', choice: Infinity },
      { type: 'cast', choice: -1 },
      { type: 'cast', choice: 99 },
      { type: 'cast', choice: 1.5 },
    ];
    for (const command of hostile) {
      const events = sim.dispatch(command);
      expect(types(events), `the command ${JSON.stringify(command)} is rejected`).toEqual(['rejected']);
      expect(sim.snapshot(), `the command ${JSON.stringify(command)} changes no state`).toEqual(before);
    }
    expect(sim.state.casts, 'no cast was counted').toBe(0);
  });

  it('an extra field on a cast gives the same result as the plain cast', () => {
    const sim = create(13);
    sim.dispatch({ type: 'start' });
    const plain = create(13);
    plain.dispatch({ type: 'start' });
    const choice = rightChoice(sim);
    const withExtra = sim.dispatch({ type: 'cast', choice, extra: 'x' } as unknown as MagicDefenseCommand);
    const without = plain.dispatch({ type: 'cast', choice });
    expect(withExtra, 'the extra field changes nothing').toEqual(without);
    expect(sim.snapshot()).toEqual(plain.snapshot());
  });

  it('a storm without full mana gives a rejected event and changes no state', () => {
    const sim = create(13);
    sim.dispatch({ type: 'start' });
    const before = sim.snapshot();
    expect(types(sim.dispatch({ type: 'storm' }))).toEqual(['rejected']);
    expect(sim.snapshot()).toEqual(before);
  });

  it('a cast after the run ended does nothing and changes no state', () => {
    const sim = create(2, false, STORY);
    playToEnd(sim);
    const before = sim.snapshot();
    expect(sim.dispatch({ type: 'cast', choice: 0 })).toEqual([]);
    expect(sim.dispatch({ type: 'storm' })).toEqual([]);
    expect(sim.dispatch({ type: 'start' })).toEqual([]);
    expect(sim.snapshot()).toEqual(before);
  });

  it('a null command throws a TypeError and changes no state', () => {
    // The QC hooks of the two views forward any value to `dispatch`. A null command is outside
    // the command type of the strategy, section 2, so this is not a Phase 1 defect. The row
    // records the behavior of today and proves that the state stays the same. Phase 2 puts a
    // browser surface and a QC script on the hook; a page error fails the QC gate, so Phase 2
    // may turn this throw into a rejected event. The row changes then.
    const sim = create(13);
    sim.dispatch({ type: 'start' });
    const before = sim.snapshot();
    expect(() => sim.dispatch(null as unknown as MagicDefenseCommand)).toThrow(TypeError);
    expect(sim.snapshot()).toEqual(before);
  });
});

describe('determinism', () => {
  it('the same seed and the same commands give the same events, the same snapshot, and the same evidence', () => {
    const run = (seed: number): { events: MagicDefenseEvent[]; snapshot: unknown; evidence: unknown } => {
      const sim = create(seed);
      const chaos = createRng(99);
      const events: MagicDefenseEvent[] = [...sim.dispatch({ type: 'start' })];
      for (let i = 0; i < 60 && sim.state.phase === 'playing'; i++) {
        const roll = chaos.next();
        if (roll < 0.5) {
          events.push(...sim.dispatch({ type: 'cast', choice: rightChoice(sim) }));
        } else if (roll < 0.8 && hasWrong(sim)) {
          events.push(...sim.dispatch({ type: 'cast', choice: wrongChoice(sim) }));
        } else {
          events.push(...sim.dispatch({ type: 'cast', choice: 99 }));
        }
      }
      return { events, snapshot: sim.snapshot(), evidence: evidenceOf(sim.state, STORY, seed, 0) };
    };
    const a = run(1234);
    const b = run(1234);
    expect(b.events, 'the same seed gives the same events').toEqual(a.events);
    expect(b.snapshot, 'the same seed gives the same snapshot').toEqual(a.snapshot);
    expect(b.evidence, 'the same seed gives the same evidence').toEqual(a.evidence);
    expect(run(4321).events, 'another seed gives another run').not.toEqual(a.events);
  });

  it('H17: the place of a fallen castle depends on the seed and the fallen castle, not on the number of casts', () => {
    // The seeded castle order is fixed. The place of a fallen castle must not move when the run
    // casts more words before the fall. Two runs of one seed with the same fallen castle must
    // give the same place, whether the fall comes first or after another cast.
    for (const seed of [1, 2, 3, 5, 8, 13]) {
      const place = (castsBefore: number): number => {
        const sim = create(seed);
        sim.dispatch({ type: 'start' });
        for (let i = 0; i < castsBefore; i++) castRight(sim);
        moveActiveTo(sim, 0);
        const events = sim.dispatch({ type: 'cast', choice: wrongChoice(sim) });
        expect(ofType(events, 'castleHit'), `seed ${seed}: castle 0 takes the hit`).toHaveLength(1);
        expect(ofType(events, 'castleHit')[0]).toMatchObject({ castle: 0, health: 0 });
        const now = active(sim);
        expect(now.castle, `seed ${seed}: the meaning moves to another castle`).not.toBe(0);
        return now.castle;
      };
      expect(place(1), `seed ${seed}: the place of the fallen castle does not move with the cast count`).toBe(place(0));
    }
  });

  it('a different seed gives a different castle order for the place of a fallen castle', () => {
    const orders = (items: number[]): number[][] =>
      items.length <= 1
        ? [items]
        : items.flatMap((item, i) => orders([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));

    const fall = (sim: MagicDefenseSimulation): { fallen: number; taken: number } => {
      const missile = structuredClone(active(sim));
      sim.state.castles[missile.castle] = 1;
      sim.dispatch({ type: 'cast', choice: wrongChoice(sim) });
      expect(sim.state.castles[missile.castle], 'the castle of the missile falls').toBe(0);
      const now = active(sim);
      expect(now.wordId, 'the meaning stays active').toBe(missile.wordId);
      expect(now.castle, 'the meaning takes another castle').not.toBe(missile.castle);
      return { fallen: missile.castle, taken: now.castle };
    };

    const castles = Array.from({ length: TUNING.castles }, (_, i) => i);
    /** The first order that explains the two falls of the seed. One order per seed. */
    const canonical = (seed: number): number[] => {
      const sim = create(seed);
      sim.dispatch({ type: 'start' });
      const obs = [fall(sim)];
      sim.state.mana = sim.state.maxMana;
      sim.dispatch({ type: 'storm' });
      obs.push(fall(sim));
      const fits = orders(castles).filter((order) => obs.every((o) => order.find((c) => c !== o.fallen) === o.taken));
      expect(fits.length, `seed ${seed} follows one fixed castle order`).toBeGreaterThan(0);
      return fits[0]!;
    };

    const list = SEEDS.map(canonical);
    expect(new Set(list.map((o) => o.join(','))).size, 'the castle order differs between seeds').toBeGreaterThan(1);
    expect(canonical(1), 'the same seed gives the same order').toEqual(canonical(1));
  });
});
