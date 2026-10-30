/**
 * The Magic Defense rules: waves, castles, held missiles, the storm, and the evidence.
 *
 * Rows H1 to H16 come from the track test strategy
 * (measure/tracks/game_magic_defense_rebuild_20261029/test-strategy.md, section 4).
 * These assumptions are in force (strategy section 3). The PM asks Daniel. A changed answer
 * changes only the rows with the tag.
 *   ASM-1: the core picks the active missile in a seeded order. The student does not choose.
 *   ASM-2: a wrong word costs one heart from the castle of the active missile, and from no other castle.
 *   ASM-3: after a wrong word the same meaning stays active, with its failed word shut.
 *   ASM-4: the waves stay. A free place above a castle takes the next unheld word of the current
 *          wave. The place stays free when the wave has no unheld word.
 */
import { describe, expect, it } from 'vitest';
import { storyGameEvidenceSchema } from '../../../src/apk3d/contracts/index.js';
import { createRng } from '../../../src/apk3d/sim/index.js';
import {
  MAGIC_DEFENSE_EVENT_TYPES,
  TUNING,
  createMagicDefense,
  evidenceOf,
  formationOf,
  resultsOf,
  roundOf,
  standingCastles,
  targetsOf,
  waveSizes,
  wordsOf,
  type MagicDefenseCommand,
  type MagicDefenseEvent,
  type MagicDefenseSimulation,
} from '../../../src/games/magic-defense/core/index.js';
import { nextCommand } from '../../../src/games/magic-defense/qc/bot.js';
import {
  NEW_STUDENT,
  SHORT_STORY,
  STORY,
  STORY_IDS,
  active,
  byCastle,
  castRight,
  castWrong,
  create,
  expectHeld,
  expectThrown,
  hasWrong,
  heldCopy,
  loadStory,
  missilesOf,
  ofType,
  playToEnd,
  rightChoice,
  types,
  unsolvedInWave,
  wrongChoice,
} from './helpers.js';

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);
const TEN_SEEDS = SEEDS.slice(0, 10);
const thrownTimes = (n: number): MagicDefenseEvent['type'][] => Array.from({ length: n }, () => 'missileThrown' as const);

/**
 * Casts the right word until the run ends. The limit bounds the row: a core that never ends the
 * run must fail the row with a message that names the row, not hang the gate.
 */
const castRightToEnd = (sim: MagicDefenseSimulation, limit: number, row: string): void => {
  let casts = 0;
  while (sim.state.phase === 'playing') {
    if (casts >= limit) throw new Error(`${row}: the run did not end after ${limit} right casts`);
    castRight(sim);
    casts += 1;
  }
};

describe('content', () => {
  it('targets every story word once, in a seeded order, in evenly sized waves', () => {
    const targets = targetsOf(STORY, createRng(3), TUNING.wordsPerWave);
    expect(targets).toHaveLength(STORY.vocabulary.length);
    expect(new Set(targets.map((t) => t.id)).size).toBe(STORY.vocabulary.length);
    for (const t of targets) {
      const w = STORY.vocabulary.find((v) => v.id === t.id)!;
      expect([t.term, t.translation]).toEqual([w.term, w.translation]);
      expect(t).toMatchObject({ attempts: 0, correctFirstTry: false, solved: false });
    }
    expect(targetsOf(STORY, createRng(3), 5).map((t) => t.id)).toEqual(targets.map((t) => t.id));
    expect(targetsOf(STORY, createRng(4), 5).map((t) => t.id)).not.toEqual(targets.map((t) => t.id));
  });

  it('waveSizes spreads the words evenly', () => {
    expect(waveSizes(11, 5)).toEqual([4, 4, 3]);
    expect(waveSizes(10, 5)).toEqual([5, 5]);
    expect(waveSizes(6, 5)).toEqual([3, 3]);
    expect(waveSizes(4, 5)).toEqual([4]);
    expect(waveSizes(0, 5)).toEqual([]);
  });

  it('accepts the APK VocabularyInput too', () => {
    const input = [{ term: 'cat', translation: 'แมว' }, { term: '', translation: 'x' }, { term: 'dog', translation: 'หมา' }, { term: 'fish', translation: 'ปลา' }];
    expect(wordsOf(input).map((w) => w.id)).toEqual(['w-1', 'w-3', 'w-4']);
    const sim = createMagicDefense(input, { seed: 1, helper: false });
    expect(sim.state.targetCount).toBe(3);
    playToEnd(sim);
    expect(sim.state.phase).toBe('victory');
  });

  it('a formation has one caster per castle, alternates the kinds, and has unique ids', () => {
    const a = formationOf(1, 3);
    expect(a.map((e) => e.lane)).toEqual([0, 1, 2]);
    expect(a.map((e) => e.kind)).toEqual(['mimic', 'skeleton', 'mimic']);
    expect(formationOf(2, 3).map((e) => e.kind)).toEqual(['skeleton', 'mimic', 'skeleton']);
    expect(new Set([...a, ...formationOf(2, 3)].map((e) => e.id)).size).toBe(6);
  });

  it('a round carries the right word once, distinct other words, and a standing castle', () => {
    const targets = targetsOf(STORY, createRng(2), 5);
    const enemies = formationOf(1, 3);
    const rng = createRng(9);
    for (const t of targets) {
      const round = roundOf(targets, t.id, enemies, [3, 0, 2], 3, rng);
      expect(round.prompt).toBe(t.translation);
      expect(round.choices).toHaveLength(3);
      expect(round.choices.filter((c) => c.wordId === t.id)).toHaveLength(1);
      expect(new Set(round.choices.map((c) => c.term.toLowerCase())).size).toBe(3);
      expect(round.choices.every((c) => !c.blocked)).toBe(true);
      expect(round.castle).not.toBe(1);
      expect(round.enemyId).toBe(enemies[round.castle]!.id);
    }
    expect(standingCastles([0, 0, 0])).toEqual([0, 1, 2]);
  });
});

describe('the run', () => {
  it('H1: start shows the first formation, one held missile per standing castle, and the first card, once', () => {
    for (const helper of [false, true]) {
      const castles = helper ? TUNING.helperCastles : TUNING.castles;
      const sim = create(5, helper);
      expect(types(sim.dispatch({ type: 'cast', choice: 0 }))).toEqual(['rejected']);
      expect(types(sim.dispatch({ type: 'storm' }))).toEqual(['rejected']);
      expect(sim.state.waveSize, 'pip-is-brave wave 1 has more words than castles').toBeGreaterThan(castles);
      const events = sim.dispatch({ type: 'start' });
      expect(types(events)).toEqual(['waveAppeared', ...thrownTimes(castles), 'roundShown']);
      expect(ofType(events, 'waveAppeared')[0]).toMatchObject({ wave: 1, waveCount: sim.state.waveCount });
      expect(ofType(events, 'waveAppeared')[0]!.enemies).toHaveLength(castles);
      const list = missilesOf(sim);
      expect(list).toHaveLength(castles);
      expect(list.map((m) => m.castle).sort()).toEqual(Array.from({ length: castles }, (_, i) => i));
      expect(byCastle(ofType(events, 'missileThrown').map((e) => e.missile))).toEqual(byCastle(list));
      expectHeld(sim, { full: true });
      expect(types(sim.dispatch({ type: 'start' }))).toEqual(['rejected']);
    }
  });

  it('H1 (ASM-4): in every story and mode, each standing castle holds at most one missile, and every free place is filled', () => {
    let runs = 0;
    for (const id of STORY_IDS) {
      for (const seed of [1, 2, 3]) {
        const sim = createMagicDefense(loadStory(id), { seed, helper: seed === 2 });
        let before = [] as ReturnType<typeof heldCopy>;
        const start = sim.dispatch({ type: 'start' });
        expectThrown(before, start, sim);
        expectHeld(sim, { full: true });
        for (let i = 0; sim.state.phase === 'playing'; i++) {
          if (i >= 400) throw new Error(`${id} seed ${seed}: the run did not end in 400 steps`);
          before = heldCopy(sim);
          const events = sim.dispatch(nextCommand(sim.state)!);
          expectThrown(before, events, sim);
          expectHeld(sim, { full: true });
        }
        runs += 1;
      }
    }
    expect(runs).toBe(STORY_IDS.length * 3);
  });

  it('Helper mode has 2 castles and 2 spell words', () => {
    const sim = create(5, true);
    expect(sim.state.enemies).toHaveLength(TUNING.helperCastles);
    expect(sim.state.castles).toHaveLength(TUNING.helperCastles);
    expect(sim.state.round!.choices).toHaveLength(TUNING.helperChoices);
  });

  it('H2: a held missile keeps its castle, meaning, word, and thrower until an answer', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    for (const m of missilesOf(sim)) expect(m.prompt).toBe(sim.state.targets.find((t) => t.id === m.wordId)!.translation);

    // Rejected commands change no missile.
    const rejected: MagicDefenseCommand[] = [{ type: 'cast', choice: 99 }, { type: 'start' }, { type: 'storm' }];
    for (const command of rejected) {
      const before = structuredClone(missilesOf(sim));
      const activeId = sim.state.activeMissileId;
      expect(types(sim.dispatch(command))).toEqual(['rejected']);
      expect(missilesOf(sim)).toEqual(before);
      expect(sim.state.activeMissileId).toBe(activeId);
    }

    // A right cast on the active missile keeps every other held missile as it is.
    let kept = 0;
    for (let i = 0; i < 6 && sim.state.phase === 'playing'; i++) {
      const hit = active(sim);
      const others = structuredClone(missilesOf(sim).filter((m) => m.id !== hit.id));
      castRight(sim);
      for (const o of others) expect(missilesOf(sim), `missile ${o.id} stays as it was`).toContainEqual(o);
      kept += others.length;
    }
    expect(kept, 'the row saw held missiles that were not answered').toBeGreaterThan(0);

    // The storm keeps every held missile.
    sim.state.mana = sim.state.maxMana;
    const before = structuredClone(missilesOf(sim));
    expect(types(sim.dispatch({ type: 'storm' }))[0]).toBe('stormCast');
    expect(missilesOf(sim)).toEqual(before);
  });

  it('H4 (ASM-1): exactly one held missile is active, and the card is the card of that missile', () => {
    for (const seed of TEN_SEEDS) {
      const sim = create(seed, seed % 2 === 0);
      const chaos = createRng(seed * 31);
      sim.dispatch({ type: 'start' });
      for (let i = 0; sim.state.phase === 'playing'; i++) {
        if (i >= 400) throw new Error(`seed ${seed}: the run did not end in 400 steps`);
        expect(missilesOf(sim).filter((m) => m.id === sim.state.activeMissileId)).toHaveLength(1);
        expectHeld(sim);
        if (chaos.next() < 0.3 && hasWrong(sim)) castWrong(sim);
        else castRight(sim);
      }
      expectHeld(sim);
    }
  });

  it('H5 (ASM-1): the core picks the active missile in a seeded order', () => {
    const order = (seed: number): { castles: number[]; notLowest: number } => {
      const sim = create(seed);
      sim.dispatch({ type: 'start' });
      const castles: number[] = [];
      let notLowest = 0;
      for (let i = 0; sim.state.phase === 'playing'; i++) {
        if (i >= 400) throw new Error(`seed ${seed}: the run did not end in 400 steps`);
        const a = active(sim);
        castles.push(a.castle);
        if (a.castle !== Math.min(...missilesOf(sim).map((m) => m.castle))) notLowest += 1;
        castRight(sim);
      }
      return { castles, notLowest };
    };
    const runs = SEEDS.map(order);
    SEEDS.forEach((seed, i) => expect(order(seed), `seed ${seed} replays the same order`).toEqual(runs[i]));
    expect(new Set(runs.map((r) => r.castles.join(','))).size, 'two seeds give different orders').toBeGreaterThanOrEqual(2);
    expect(runs.some((r) => r.notLowest > 0), 'the active missile is not always the lowest held castle').toBe(true);
  });

  it('H6 (ASM-4): a right cast breaks the active missile, and the next unheld word takes the free place above the same castle', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    expect(sim.state.waveSize, 'pip-is-brave wave 1 has more words than castles').toBe(5);
    for (let step = 0; step < 2; step++) {
      const hit = structuredClone(active(sim));
      const others = structuredClone(missilesOf(sim).filter((m) => m.id !== hit.id));
      const held = new Set(missilesOf(sim).map((m) => m.wordId));
      const next = sim.state.targets.find((t) => t.wave === sim.state.wave && !t.solved && !held.has(t.id));
      expect(next, 'the wave has an unheld word').toBeDefined();
      const { coins, streak, mana } = sim.state;

      const events = castRight(sim);
      expect(types(events)).toEqual(['cast', 'scored', 'missileThrown', 'roundShown']);
      expect(ofType(events, 'cast')[0]).toMatchObject({ correct: true, wordId: hit.wordId, castle: hit.castle, enemyId: hit.enemyId, streak: streak + 1 });
      expect(sim.state.coins - coins).toBe(TUNING.coins + Math.min(TUNING.maxStreakBonus, streak * TUNING.streakCoins));
      expect(sim.state.streak).toBe(streak + 1);
      expect(sim.state.mana).toBe(Math.min(TUNING.maxMana, mana + TUNING.manaPerSpell));

      const list = missilesOf(sim);
      expect(list.some((m) => m.id === hit.id || m.wordId === hit.wordId), 'the broken missile leaves the list').toBe(false);
      const placed = list.find((m) => m.castle === hit.castle);
      expect(placed, 'a missile takes the free place above the same castle').toBeDefined();
      expect(placed!.wordId, 'ASM-4: the next unheld word of the wave').toBe(next!.id);
      expect(placed!.prompt).toBe(next!.translation);
      expect(ofType(events, 'missileThrown').map((e) => e.missile)).toEqual([placed]);
      for (const o of others) expect(list).toContainEqual(o);
      expect(list).toHaveLength(TUNING.castles);
      expectHeld(sim, { full: true });
    }
  });

  it('a right spell scores coins that grow with the streak, fills the mana, and shows the next missile', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const first = sim.state.round!.wordId;
    const a = castRight(sim);
    expect(types(a).slice(0, 2)).toEqual(['cast', 'scored']);
    expect(ofType(a, 'cast')[0]).toMatchObject({ correct: true, streak: 1 });
    expect(ofType(a, 'scored')[0]).toMatchObject({ coins: TUNING.coins, mana: TUNING.manaPerSpell });
    expect(sim.state.targets.find((t) => t.id === first)).toMatchObject({ solved: true, attempts: 1, correctFirstTry: true });
    expect(sim.state.round!.wordId).not.toBe(first);
    expect(ofType(castRight(sim), 'scored')[0]!.coins).toBe(TUNING.coins + TUNING.streakCoins);
    for (let i = 0; i < 4 && sim.state.phase === 'playing'; i++) castRight(sim);
    expect(sim.state.bestStreak).toBeGreaterThan(2);
  });

  it('H7 (ASM-2): a wrong cast takes one heart from the castle of the active missile and from no other castle', () => {
    for (const seed of TEN_SEEDS) {
      const sim = create(seed);
      sim.dispatch({ type: 'start' });
      castRight(sim);
      const hit = structuredClone(active(sim));
      const before = [...sim.state.castles];
      const choice = wrongChoice(sim);
      const events = sim.dispatch({ type: 'cast', choice });
      expect(types(events)).toEqual(['cast', 'castleHit', 'roundShown']);
      expect(ofType(events, 'cast')[0]).toMatchObject({ correct: false, choice, castle: hit.castle, enemyId: hit.enemyId, streak: 0 });
      expect(ofType(events, 'castleHit')).toEqual([{ type: 'castleHit', castle: hit.castle, enemyId: hit.enemyId, health: before[hit.castle]! - 1 }]);
      expect(sim.state.castles[hit.castle]).toBe(before[hit.castle]! - 1);
      const others = (list: readonly number[]) => list.reduce((sum, h, i) => (i === hit.castle ? sum : sum + h), 0);
      expect(others(sim.state.castles), 'no other castle loses a heart').toBe(others(before));
      expect(sim.state.streak).toBe(0);
    }
  });

  it('H8 (ASM-3): after a wrong cast the same missile stays active with its failed word shut', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const hit = structuredClone(active(sim));
    const held = heldCopy(sim);
    const choice = wrongChoice(sim);
    const events = sim.dispatch({ type: 'cast', choice });
    expect(types(events)).toEqual(['cast', 'castleHit', 'roundShown']);
    expect(active(sim), 'the same missile stays above its standing castle').toEqual(hit);
    expect(heldCopy(sim), 'no held missile changes').toEqual(held);
    expect(sim.state.round!.choices.find((c) => c.index === choice)!.blocked).toBe(true);
    expect(types(sim.dispatch({ type: 'cast', choice }))).toEqual(['rejected']);
    expect(sim.state.targets.find((t) => t.id === hit.wordId)).toMatchObject({ attempts: 1, correctFirstTry: false, solved: false });
    expect(sim.state.streak).toBe(0);
    expectHeld(sim, { full: true });
    castRight(sim);
    expect(sim.state.targets.find((t) => t.id === hit.wordId)).toMatchObject({ attempts: 2, correctFirstTry: false, solved: true });
  });

  it('H8 (ASM-3): the right word never shuts, so every meaning can be broken', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const hit = structuredClone(active(sim));
    // The loop has a limit. A wrong word that never shuts must fail the row fast, not hang the gate.
    // The card carries TUNING.choices words. One is right; the rest are wrong.
    // Every wrong word shuts after one cast, so the correct core needs one cast per wrong word.
    // The limit is the count of the choices with a margin of one card.
    // A change of TUNING.choices must not fail the row falsely.
    const limit = sim.state.round!.choices.length * 2;
    let wrongCasts = 0;
    while (hasWrong(sim)) {
      if (wrongCasts >= limit) throw new Error(`the row did not shut every wrong word in ${limit} casts`);
      castWrong(sim);
      wrongCasts += 1;
    }
    expect(active(sim).wordId).toBe(hit.wordId);
    const round = sim.state.round!;
    expect(round.choices.filter((c) => c.blocked)).toHaveLength(round.choices.length - 1);
    expect(round.choices.find((c) => c.wordId === round.wordId)!.blocked).toBe(false);
    expect(types(sim.dispatch({ type: 'cast', choice: rightChoice(sim) }))).toContain('scored');
  });

  it('H8 (ASM-3): when the castle of the meaning falls, the meaning comes back above a standing castle with its shut word', () => {
    for (const seed of TEN_SEEDS) {
      const sim = create(seed);
      sim.dispatch({ type: 'start' });
      const hit = structuredClone(active(sim));
      sim.state.castles[hit.castle] = 1;
      const before = heldCopy(sim);
      const choice = wrongChoice(sim);
      const events = sim.dispatch({ type: 'cast', choice });
      expect(ofType(events, 'castleHit')).toEqual([{ type: 'castleHit', castle: hit.castle, enemyId: hit.enemyId, health: 0 }]);
      expect(ofType(events, 'rest')).toHaveLength(0);
      expect(sim.state.castles[hit.castle]).toBe(0);

      const now = active(sim);
      expect(now.wordId, 'the meaning stays active').toBe(hit.wordId);
      expect(now.prompt).toBe(hit.prompt);
      expect(now.castle, 'the meaning moves to another castle').not.toBe(hit.castle);
      expect(sim.state.castles[now.castle], 'the new castle is standing').toBeGreaterThan(0);
      expect(missilesOf(sim).some((m) => m.castle === hit.castle), 'the fallen castle holds no missile').toBe(false);
      expect(ofType(events, 'missileThrown').some((e) => e.missile.wordId === hit.wordId && e.missile.castle === now.castle)).toBe(true);
      expect(sim.state.round!.choices.find((c) => c.index === choice)!.blocked, 'the shut word stays shut').toBe(true);
      expect(types(sim.dispatch({ type: 'cast', choice }))).toEqual(['rejected']);
      expectThrown(before, events, sim);
      expectHeld(sim, { full: true });
    }
  });

  it('H17: the castle that takes the place of a fallen castle comes from a fixed seeded order', () => {
    /**
     * One fall of the active castle. The meaning takes the place of another castle. The displaced
     * word goes back to the unheld words.
     */
    const fall = (sim: MagicDefenseSimulation): { fallen: number; taken: number } => {
      const missile = structuredClone(active(sim));
      const standing = sim.state.castles.flatMap((h, i) => (h > 0 ? [i] : []));
      expect(
        byCastle(missilesOf(sim)).map((m) => m.castle),
        'every standing castle holds a missile before the fall',
      ).toEqual(standing);
      const before = heldCopy(sim);
      sim.state.castles[missile.castle] = 1;
      const events = sim.dispatch({ type: 'cast', choice: wrongChoice(sim) });
      expect(ofType(events, 'castleHit')).toHaveLength(1);
      expect(sim.state.castles[missile.castle], 'the castle of the missile falls').toBe(0);

      const now = active(sim);
      expect(now.wordId, 'the meaning stays active').toBe(missile.wordId);
      expect(now.prompt, 'the meaning keeps its Thai word').toBe(missile.prompt);
      expect(now.castle, 'the meaning takes the place of another castle').not.toBe(missile.castle);
      expect(sim.state.castles[now.castle], 'the castle that takes the place stands').toBeGreaterThan(0);
      expect(missilesOf(sim).some((m) => m.castle === missile.castle), 'the fallen castle holds no missile').toBe(false);

      const displaced = before.find((m) => m.castle === now.castle);
      expect(displaced, 'the castle that takes the place held a missile before the fall').toBeDefined();
      expect(
        missilesOf(sim).some((m) => m.wordId === displaced!.wordId),
        'the displaced word goes back to the unheld words',
      ).toBe(false);
      expect(sim.state.targets.find((t) => t.id === displaced!.wordId)).toMatchObject({ solved: false });
      expectHeld(sim, { full: true });
      return { fallen: missile.castle, taken: now.castle };
    };

    /** Two falls in one run. The storm between the falls gives three standing castles again. */
    const scenario = (seed: number): { fallen: number; taken: number }[] => {
      const sim = create(seed);
      sim.dispatch({ type: 'start' });
      const obs = [fall(sim)];
      sim.state.mana = sim.state.maxMana;
      expect(types(sim.dispatch({ type: 'storm' }))[0]).toBe('stormCast');
      obs.push(fall(sim));
      return obs;
    };

    /** Every order of the castles. */
    const orders = (items: number[]): number[][] =>
      items.length <= 1
        ? [items]
        : items.flatMap((item, i) => orders([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));

    const castles = Array.from({ length: TUNING.castles }, (_, i) => i);
    const perSeed = SEEDS.map((seed) => ({ seed, obs: scenario(seed), again: scenario(seed) }));
    const orderSets: string[] = [];
    const taken = new Map<number, Set<number>>();

    for (const { seed, obs, again } of perSeed) {
      expect(obs, `seed ${seed} made two falls`).toHaveLength(2);
      expect(again, `seed ${seed} takes the same place again`).toEqual(obs);
      const fits = orders(castles).filter((order) => obs.every((o) => order.find((c) => c !== o.fallen) === o.taken));
      expect(fits.length, `seed ${seed}: the falls follow one fixed castle order`).toBeGreaterThan(0);
      orderSets.push(JSON.stringify(fits));
      for (const o of obs) {
        const set = taken.get(o.fallen) ?? new Set<number>();
        set.add(o.taken);
        taken.set(o.fallen, set);
      }
    }

    expect(taken.size, 'the row saw a fall on every castle').toBe(TUNING.castles);
    const summary = [...taken].map(([castle, set]) => `${castle}->${[...set].sort().join('/')}`).join(' ');
    expect(
      [...taken.values()].filter((set) => set.size > 1).length,
      `the castle that takes the place depends on the seed (${summary})`,
    ).toBeGreaterThan(0);
    expect(new Set(orderSets).size, 'the castle order differs between seeds').toBeGreaterThan(1);
  });

  it('H9: a fallen castle holds no missile until the rest; the rest restores every castle and fills every free place', () => {
    const sim = create(5, true);
    sim.dispatch({ type: 'start' });
    let rests = 0;
    let fallen = 0;
    for (let i = 0; sim.state.phase === 'playing'; i++) {
      if (i >= 400) throw new Error('the run did not end in 400 steps');
      const before = heldCopy(sim);
      const events = hasWrong(sim) ? castWrong(sim) : castRight(sim);
      if (ofType(events, 'rest').length) {
        rests += 1;
        expect(ofType(events, 'rest')[0]!.castles).toEqual(sim.state.castles);
        expect(sim.state.castles.every((h) => h === TUNING.castleHealth)).toBe(true);
        expect(sim.state.phase).toBe('playing');
        expect(missilesOf(sim), 'every castle holds a missile again').toHaveLength(Math.min(TUNING.helperCastles, unsolvedInWave(sim.state)));
      }
      if (sim.state.castles.some((h) => h === 0)) fallen += 1;
      expectThrown(before, events, sim);
      expectHeld(sim, { full: true });
      expect(sim.state.castles.some((h) => h > 0)).toBe(true);
    }
    expect(rests, 'the run rested at least once').toBeGreaterThan(0);
    expect(fallen, 'the run saw a fallen castle before a rest').toBeGreaterThan(0);
  });

  it('H10: the storm needs full mana; it mends every castle and keeps the held missiles and the shut words', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    castWrong(sim);
    expect(types(sim.dispatch({ type: 'storm' }))).toEqual(['rejected']);
    sim.state.mana = sim.state.maxMana;
    const before = structuredClone(missilesOf(sim));
    const activeId = sim.state.activeMissileId;
    const shut = sim.state.round!.choices.filter((c) => c.blocked).map((c) => c.index);
    expect(shut).toHaveLength(1);
    const events = sim.dispatch({ type: 'storm' });
    expect(types(events)).toEqual(['stormCast', 'roundShown']);
    expect(sim.state.mana).toBe(0);
    expect(sim.state.castles.every((h) => h === TUNING.castleHealth)).toBe(true);
    expect(missilesOf(sim)).toEqual(before);
    expect(sim.state.activeMissileId).toBe(activeId);
    expect(sim.state.round!.choices.filter((c) => c.blocked).map((c) => c.index)).toEqual(shut);
    expect(ofType(events, 'roundShown')[0]!.round.choices.some((c) => c.blocked)).toBe(true);
  });

  it('H10 (ASM-4): a storm after a fall keeps the held missiles and fills the free place above the mended castle', () => {
    for (const seed of TEN_SEEDS) {
      const sim = create(seed);
      sim.dispatch({ type: 'start' });
      const fell = active(sim).castle;
      sim.state.castles[fell] = 1;
      castWrong(sim);
      expect(sim.state.castles[fell]).toBe(0);
      sim.state.mana = sim.state.maxMana;
      const before = heldCopy(sim);
      const activeId = sim.state.activeMissileId;
      const shut = sim.state.round!.choices.filter((c) => c.blocked).map((c) => c.index);
      const events = sim.dispatch({ type: 'storm' });
      expect(types(events)[0]).toBe('stormCast');
      expect(types(events).at(-1)).toBe('roundShown');
      expect(sim.state.castles.every((h) => h === TUNING.castleHealth)).toBe(true);
      for (const m of before) expect(missilesOf(sim), `missile ${m.id} stays as it was`).toContainEqual(m);
      expect(sim.state.activeMissileId).toBe(activeId);
      expect(sim.state.round!.choices.filter((c) => c.blocked).map((c) => c.index)).toEqual(shut);
      expect(ofType(events, 'missileThrown').map((e) => e.missile.castle)).toEqual([fell]);
      expectThrown(before, events, sim);
      expectHeld(sim, { full: true });
    }
  });

  it('the mana never passes its maximum', () => {
    // A correct run casts the right word once per word of the fixture.
    // The limit is that count with a margin of one more fixture of the same length.
    // A core that never ends the run fails the row fast instead of hanging the gate.
    const limit = STORY.vocabulary.length * 2;
    const sim = create(6, false, STORY);
    sim.dispatch({ type: 'start' });
    castRightToEnd(sim, limit, 'the mana never passes its maximum');
    expect(sim.state.mana).toBeLessThanOrEqual(sim.state.maxMana);
  });

  it('H6 (ASM-4): the formation falls when the words of the wave are done; the next wave marches in and throws one missile per castle', () => {
    const sim = create(6);
    sim.dispatch({ type: 'start' });
    const size = sim.state.waveSize;
    expect(sim.state.waveCount).toBeGreaterThan(1);
    const firstIds = sim.state.enemies.map((e) => e.id);
    let last: MagicDefenseEvent[] = [];
    for (let i = 0; i < size; i++) last = castRight(sim);
    const next = sim.state.waveSize;
    expect(next, 'pip-is-brave wave 2 has at least as many words as castles').toBeGreaterThanOrEqual(TUNING.castles);
    expect(types(last)).toEqual(['cast', 'scored', 'waveCleared', 'waveAppeared', ...thrownTimes(TUNING.castles), 'roundShown']);
    expect(ofType(last, 'waveCleared')[0]!.enemies.map((e) => e.id)).toEqual(firstIds);
    expect(sim.state.wave).toBe(2);
    expect(sim.state.waveDone).toBe(0);
    expect(sim.state.enemies.map((e) => e.id)).not.toEqual(firstIds);
    expect(byCastle(ofType(last, 'missileThrown').map((e) => e.missile))).toEqual(byCastle(missilesOf(sim)));
    expectHeld(sim, { full: true });
  });

  it.each(SEEDS)('H16 seed %i: the run ends only in victory with wrong casts on every third card; no missile, card, or active missile remains', (seed) => {
    const runs = [
      { story: SHORT_STORY, helper: seed % 2 === 0 },
      { story: NEW_STUDENT, helper: false },
    ];
    for (const { story, helper } of runs) {
      const sim = createMagicDefense(story, { seed, helper });
      const castles = helper ? TUNING.helperCastles : TUNING.castles;
      sim.dispatch({ type: 'start' });
      expectHeld(sim, { full: true });
      let card = 0;
      let free = 0;
      for (let i = 0; sim.state.phase === 'playing'; i++) {
        if (i >= 300) throw new Error(`seed ${seed}: the run did not end in 300 steps`);
        if (card % 3 === 2 && hasWrong(sim)) {
          const before = heldCopy(sim);
          expectThrown(before, castWrong(sim), sim);
          expectHeld(sim, { full: true });
        }
        const before = heldCopy(sim);
        expectThrown(before, castRight(sim), sim);
        card += 1;
        expect(['playing', 'victory']).toContain(sim.state.phase);
        expectHeld(sim, { full: true });
        if (sim.state.phase === 'playing' && missilesOf(sim).length < castles) free += 1;
      }
      expect(sim.state.phase).toBe('victory');
      expect(sim.state.targets.every((t) => t.solved)).toBe(true);
      expect(missilesOf(sim)).toEqual([]);
      expect(sim.state.round).toBeNull();
      expect(sim.state.activeMissileId).toBeNull();
      expect(sim.state.castles.some((h) => h > 0)).toBe(true);
      if (story === NEW_STUDENT) expect(free, 'ASM-4: the last missiles of a wave leave free places').toBeGreaterThan(0);
    }
  });

  it('commands after the victory do nothing', () => {
    const sim = create(2, false, SHORT_STORY);
    playToEnd(sim);
    expect(sim.dispatch({ type: 'cast', choice: 0 })).toEqual([]);
    expect(sim.dispatch({ type: 'start' })).toEqual([]);
    expect(sim.dispatch({ type: 'storm' })).toEqual([]);
  });

  it('only declared event types appear', () => {
    const events = playToEnd(create(4));
    expect(events.every((e) => MAGIC_DEFENSE_EVENT_TYPES.includes(e.type))).toBe(true);
  });

  it('an empty input is a won run', () => {
    const sim = createMagicDefense([], { seed: 1, helper: false });
    expect(sim.state.phase).toBe('victory');
    expect(sim.dispatch({ type: 'start' })).toEqual([]);
  });
});

describe('evidence', () => {
  it('one item per word with the attempts and the first-try flag; the score is the coins', () => {
    // A correct run casts the right word once per word of the fixture.
    // The limit is that count with a margin of one more fixture of the same length.
    // A core that never ends the run fails the row fast instead of hanging the gate.
    const limit = SHORT_STORY.vocabulary.length * 2;
    const sim = create(8, false, SHORT_STORY);
    sim.dispatch({ type: 'start' });
    const wrongWord = sim.state.round!.wordId;
    castWrong(sim);
    castRightToEnd(sim, limit, 'one item per word with the attempts and the first-try flag; the score is the coins');
    const evidence = evidenceOf(sim.state, SHORT_STORY, 8, 12_345);
    expect(storyGameEvidenceSchema.parse(evidence)).toEqual(evidence);
    expect(evidence.items).toHaveLength(SHORT_STORY.vocabulary.length);
    const missed = evidence.items.find((i) => i.itemId === wrongWord)!;
    expect(missed).toMatchObject({ attempts: 2, correctFirstTry: false, solved: true });
    expect(evidence.items.filter((i) => i.correctFirstTry)).toHaveLength(SHORT_STORY.vocabulary.length - 1);
    const { results, outcome } = resultsOf(sim.state, SHORT_STORY, 8, 12_345);
    expect(results.score).toBe(sim.state.coins);
    expect(results.correctAnswers).toBe(SHORT_STORY.vocabulary.length);
    expect(outcome).toBe('victory');
  });

  it('H11: the evidence counts the casts of a word only while it is active', () => {
    for (const seed of [3, 8, 13]) {
      const sim = create(seed, false, STORY);
      const chaos = createRng(seed + 500);
      sim.dispatch({ type: 'start' });
      const expected = new Map<string, { attempts: number; first: boolean | null }>();
      const wasActive = new Set<string>();
      let heldNotActive = 0;
      for (let i = 0; sim.state.phase === 'playing'; i++) {
        if (i >= 400) throw new Error(`seed ${seed}: the run did not end in 400 steps`);
        const a = active(sim);
        wasActive.add(a.wordId);
        for (const m of missilesOf(sim)) {
          if (wasActive.has(m.wordId)) continue;
          heldNotActive += 1;
          expect(sim.state.targets.find((t) => t.id === m.wordId)!.attempts, `held word ${m.wordId} was never active`).toBe(0);
        }
        const wrong = chaos.next() < 0.35 && hasWrong(sim);
        const e = expected.get(a.wordId) ?? { attempts: 0, first: null };
        e.attempts += 1;
        if (e.first === null) e.first = !wrong;
        expected.set(a.wordId, e);
        if (wrong) castWrong(sim);
        else castRight(sim);
      }
      expect(heldNotActive, 'the run saw held words that were not active').toBeGreaterThan(0);
      const evidence = evidenceOf(sim.state, STORY, seed, 1_000);
      expect(storyGameEvidenceSchema.parse(evidence)).toEqual(evidence);
      expect(evidence.items).toHaveLength(STORY.vocabulary.length);
      expect(new Set(evidence.items.map((i) => i.itemId))).toEqual(new Set(STORY.vocabulary.map((v) => v.id)));
      for (const item of evidence.items) {
        const e = expected.get(item.itemId)!;
        expect(item.itemKind).toBe('word');
        expect({ attempts: item.attempts, correctFirstTry: item.correctFirstTry, solved: item.solved }).toEqual({
          attempts: e.attempts,
          correctFirstTry: e.first,
          solved: true,
        });
      }
    }
  });
});
