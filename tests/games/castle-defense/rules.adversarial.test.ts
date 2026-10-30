/**
 * Adversarial rows of the Castle Defense rules core (Phase 1, role measure-adversarial-testing).
 * They attack rules that one existing row alone checks (the mutations ADV-A1 to ADV-A12 of the
 * adversarial runner), the two cases of test-strategy section 11 (a `covers` index outside the
 * path, and a wave whose attackers all start at the last step), hostile commands, and the replay.
 * Some rows set the live state of the simulation (`sim.state` is the real state object) to reach
 * a case the content never builds. Every loop has a step limit that throws.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '../../../src/apk3d/sim/index.js';
import {
  TUNING,
  attackersOf,
  createCastleDefense,
  evidenceItemsOf,
  evidenceOf,
  resultsOf,
  type CastleDefenseCommand,
  type CastleDefenseEvent,
  type CastleDefenseSimulation,
} from '../../../src/games/castle-defense/core/index.js';
import {
  SHORT_STORY,
  STORY,
  buildOn,
  buildSentence,
  create,
  narrowestSpot,
  ofType,
  pickRight,
  pickWrong,
  playToEnd,
  playWith,
  rightChoice,
  types,
} from './helpers.js';

const send = (sim: CastleDefenseSimulation, command: unknown): CastleDefenseEvent[] => sim.dispatch(command as CastleDefenseCommand);
const REJECT_PICK = [{ type: 'rejected', command: 'pick' }];
const REJECT_BUILD = [{ type: 'rejected', command: 'build' }];
const LOOP_LIMIT = 900;

/** Starts the run and builds the first sentence; the stage is `place`. */
function toPlace(sim: CastleDefenseSimulation): CastleDefenseSimulation {
  sim.dispatch({ type: 'start' });
  buildSentence(sim);
  expect(sim.state.stage).toBe('place');
  return sim;
}

/** Plays right words and builds until the stage is `place` of `wave`; the loop has a limit. */
function advanceToPlace(sim: CastleDefenseSimulation, wave: number, spotOf: (wave: number) => number): CastleDefenseSimulation {
  sim.dispatch({ type: 'start' });
  for (let i = 0; i < LOOP_LIMIT; i++) {
    if (sim.state.phase !== 'playing') throw new Error(`the run ended before wave ${wave}`);
    if (sim.state.stage === 'collect') {
      pickRight(sim);
      continue;
    }
    if (sim.state.wave >= wave) return sim;
    buildOn(sim, spotOf(sim.state.wave));
  }
  throw new Error(`advanceToPlace: wave ${wave} not reached after ${LOOP_LIMIT} commands`);
}

const shotsOf = (events: readonly CastleDefenseEvent[]) => ofType(events, 'waveStep').map((e) => e.shots);
const lastPathIndex = (sim: CastleDefenseSimulation): number => sim.state.path.length - 1;

// ---------------------------------------------------------------- hostile commands

describe('adversarial: hostile commands', () => {
  const BAD_CHOICES: [string, unknown][] = [
    ['undefined', undefined],
    ['null', null],
    ['a string that prints as an index', '0'],
    ['NaN', Number.NaN],
    ['a negative index', -1],
    ['an index past the end', 99],
    ['a fraction', 1.5],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['an array that prints as an index', [0]],
    ['an empty object', {}],
    ['true', true],
  ];

  it('H1 a bad pick gives one rejected event and leaves the state as it was', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    pickRight(sim);
    const before = sim.snapshot();
    for (const [name, choice] of BAD_CHOICES) {
      expect(send(sim, { type: 'pick', choice }), name).toEqual(REJECT_PICK);
      expect(sim.snapshot(), name).toEqual(before);
    }
    expect(send(sim, { type: 'pick' }), 'a pick with no choice field').toEqual(REJECT_PICK);
    expect(sim.snapshot()).toEqual(before);
  });

  it('H2 a build during the collect stage is rejected for every value and leaves the state as it was', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    pickRight(sim);
    expect(sim.state.stage).toBe('collect');
    const before = sim.snapshot();
    const spots: unknown[] = [0, 3, 5, -1, 6, 99, 1.5, Number.NaN, '0', null, undefined, [0]];
    for (const spot of spots) {
      expect(send(sim, { type: 'build', spot }), `spot ${String(spot)}`).toEqual(REJECT_BUILD);
      expect(sim.snapshot()).toEqual(before);
    }
    expect(send(sim, { type: 'build' }), 'a build with no spot field').toEqual(REJECT_BUILD);
    expect(sim.snapshot()).toEqual(before);
  });

  it('H3 in the place stage a bad spot, a pick, and a second start are rejected and change nothing', () => {
    const sim = toPlace(create(5));
    const before = sim.snapshot();
    const bad: unknown[] = [-1, 6, 99, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '0', '3', null, undefined, [0], {}, true];
    for (const spot of bad) {
      expect(send(sim, { type: 'build', spot }), `spot ${String(spot)}`).toEqual(REJECT_BUILD);
      expect(sim.snapshot()).toEqual(before);
    }
    expect(send(sim, { type: 'build' })).toEqual(REJECT_BUILD);
    for (const choice of [0, 1, 2, 99, Number.NaN]) {
      expect(send(sim, { type: 'pick', choice }), `pick ${choice} while placing`).toEqual(REJECT_PICK);
    }
    expect(send(sim, { type: 'start' })).toEqual([{ type: 'rejected', command: 'start' }]);
    expect(sim.snapshot()).toEqual(before);
    expect(types(buildOn(sim, 0))[0], 'a real build still works after the attack').toBe('towerBuilt');
  });

  it('H4 an unknown type or a missing type gives no event and leaves the state as it was', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    pickRight(sim);
    const before = sim.snapshot();
    const unknown: unknown[] = [
      {},
      { type: '' },
      { type: 'PICK', choice: 0 },
      { type: 'Build', spot: 0 },
      { type: 'tick' },
      { type: '__proto__' },
      { type: 'constructor' },
      { type: 'toString' },
      { type: 5 },
      { type: null },
      { type: ['pick'], choice: 0 },
      { choice: 0 },
      { spot: 0 },
    ];
    for (const command of unknown) {
      expect(send(sim, command), JSON.stringify(command)).toEqual([]);
      expect(sim.snapshot()).toEqual(before);
    }
  });

  it('H5 an extra field changes nothing, and a frozen command is accepted', () => {
    const plain = create(5);
    const extra = create(5);
    plain.dispatch({ type: 'start' });
    extra.dispatch({ type: 'start' });
    const a = plain.dispatch({ type: 'pick', choice: rightChoice(plain) });
    const b = send(extra, Object.freeze({ type: 'pick', choice: rightChoice(extra), hero: 'knight', extra: [1, 2], __proto__: { x: 1 } }));
    expect(b).toEqual(a);
    expect(extra.snapshot()).toEqual(plain.snapshot());
    buildSentence(plain);
    buildSentence(extra);
    const c = plain.dispatch({ type: 'build', spot: 3 });
    const d = send(extra, Object.freeze({ type: 'build', spot: 3, post: 2, volley: true }));
    expect(d).toEqual(c);
    expect(extra.snapshot()).toEqual(plain.snapshot());
  });

  it('H6 after the victory every command gives no event and the state does not change', () => {
    const sim = create(2, false, SHORT_STORY);
    playToEnd(sim);
    expect(sim.state.phase).toBe('victory');
    const before = sim.snapshot();
    const commands: unknown[] = [
      { type: 'start' },
      { type: 'pick', choice: 0 },
      { type: 'pick', choice: 99 },
      { type: 'build', spot: 0 },
      { type: 'build', spot: 99 },
      { type: 'build', spot: Number.NaN },
      { type: 'nope' },
      {},
    ];
    let sent = 0;
    for (const command of commands) {
      expect(send(sim, command), JSON.stringify(command)).toEqual([]);
      expect(sim.snapshot()).toEqual(before);
      sent += 1;
    }
    expect(sim.tick(16)).toEqual([]);
    expect(sim.snapshot()).toEqual(before);
    expect(sent).toBe(commands.length);
  });

  it('H7 200 rejected commands in a row give 200 rejections; the next real commands equal those of a clean twin', () => {
    const noisy = create(8);
    const clean = create(8);
    noisy.dispatch({ type: 'start' });
    clean.dispatch({ type: 'start' });
    pickRight(noisy);
    pickRight(clean);
    let rejections = 0;
    for (let i = 0; i < 200; i++) {
      const out = i % 2 === 0 ? send(noisy, { type: 'pick', choice: 99 + i }) : send(noisy, { type: 'build', spot: 0 });
      expect(out).toHaveLength(1);
      if (out[0]!.type === 'rejected') rejections += 1;
    }
    expect(rejections).toBe(200);
    expect(noisy.snapshot()).toEqual(clean.snapshot());
    // A wrong word draws from the random number generator (the struck attacker), so a draw in a
    // rejected command would show here.
    expect(pickWrong(noisy)).toEqual(pickWrong(clean));
    expect(buildSentence(noisy)).toEqual(buildSentence(clean));
    expect(buildOn(noisy, 2)).toEqual(buildOn(clean, 2));
    expect(noisy.snapshot()).toEqual(clean.snapshot());
  });

  it('H8 200 picks of a shut word give 200 rejections and no counter grows', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    pickWrong(sim);
    const shut = sim.state.step!.choices.find((c) => c.blocked)!;
    const before = sim.snapshot();
    let rejections = 0;
    for (let i = 0; i < 200; i++) {
      if (types(send(sim, { type: 'pick', choice: shut.index }))[0] === 'rejected') rejections += 1;
    }
    expect(rejections).toBe(200);
    expect(sim.snapshot()).toEqual(before);
    expect(sim.state.hearts).toBe(TUNING.hearts - 1);
    expect(sim.state.picks).toBe(1);
  });

  it('H9 a card that is too small still plays: one sentence of two words reaches the victory', () => {
    const sim = createCastleDefense([{ term: 'Go now', translation: '' }], { seed: 3, helper: false });
    expect(sim.state.waveCount).toBe(1);
    expect(sim.state.step!.choices.filter((c) => c.right)).toHaveLength(1);
    playToEnd(sim);
    expect(sim.state.phase).toBe('victory');
    const evidence = evidenceOf(sim.state, STORY, 3, 1);
    expect(evidence.items).toHaveLength(1);
    expect(evidence.items[0]).toMatchObject({ attempts: 1, correctFirstTry: true, solved: true });
  });
});

// ---------------------------------------------------------------- covers outside the path (strategy section 11)

describe('adversarial: a spot whose covers holds an index outside the path', () => {
  /** Plays wave 1 with the `covers` of every spot replaced; returns the events of the build on spot 0. */
  function buildWith(covers: number[], level = 0): { events: CastleDefenseEvent[]; sim: CastleDefenseSimulation } {
    const sim = toPlace(create(5));
    for (const s of sim.state.spots) {
      s.covers = [...covers];
      s.level = level;
    }
    return { events: buildOn(sim, 0), sim };
  }

  const invariants = (events: readonly CastleDefenseEvent[], sim: CastleDefenseSimulation, covers: readonly number[]) => {
    const steps = ofType(events, 'waveStep');
    expect(steps.length, 'waveStep events').toBeGreaterThan(0);
    expect(steps.length).toBeLessThanOrEqual(sim.state.path.length + 2 + 1);
    expect(types(events)[0]).toBe('towerBuilt');
    expect(ofType(events, 'waveCleared')).toHaveLength(1);
    expect(sim.state.hearts).toBeGreaterThan(0);
    expect(sim.state.hearts).toBeLessThanOrEqual(sim.state.maxHearts);
    expect(sim.state.phase).toBe('playing');
    for (const step of steps) {
      expect(step.shots.length, 'one tower, at most one shot per step').toBeLessThanOrEqual(1);
      for (const shot of step.shots) {
        expect(covers).toContain(shot.at);
        expect(Number.isFinite(shot.at)).toBe(true);
        expect(shot.hits).toBe(1);
        expect(shot.hitsLeft).toBeGreaterThanOrEqual(0);
      }
    }
  };

  it('C1 indexes below 0, past the end, NaN, and a fraction give no shot at those steps and the wave ends', () => {
    const covers = [99, Number.NaN, 7.5, 6, 100];
    const { events, sim } = buildWith(covers);
    invariants(events, sim, covers);
    expect(shotsOf(events).flat(), 'no covered index lies on the path').toEqual([]);
    expect(ofType(events, 'attackerThrough')).toHaveLength(2);
    expect(sim.state.hearts).toBe(TUNING.hearts - 2);
  });

  it('C2 an empty covers list and a covers list of one index outside the path both give no shot', () => {
    const empty = buildWith([]);
    const outside = buildWith([-5]);
    expect(shotsOf(empty.events).flat()).toEqual([]);
    expect(ofType(empty.events, 'attackerThrough')).toHaveLength(2);
    invariants(empty.events, empty.sim, []);
    // A queued attacker outside the gate sits at a negative index; the wave must still end.
    expect(types(outside.events)[0]).toBe('towerBuilt');
    expect(ofType(outside.events, 'waveCleared')).toHaveLength(1);
    expect(outside.sim.state.hearts).toBeGreaterThan(0);
  });

  it('C3 a duplicate index in covers gives the events of the list without the duplicate', () => {
    const once = buildWith([2]);
    const thrice = buildWith([2, 2, 2]);
    const mixed = buildWith([4, 2, 2, 3, 3]);
    const sorted = buildWith([2, 3, 4]);
    expect(shotsOf(once.events).flat().length, 'shots with covers [2]').toBeGreaterThan(0);
    expect(thrice.events).toEqual(once.events);
    expect(mixed.events, 'the order of covers does not matter').toEqual(sorted.events);
    invariants(thrice.events, thrice.sim, [2]);
  });

  it('C4 a covers list with NaN and valid indexes shoots only at the valid indexes', () => {
    const withNan = buildWith([Number.NaN, 2, 99, 3]);
    const valid = buildWith([2, 3]);
    expect(shotsOf(valid.events).flat().length).toBeGreaterThan(0);
    expect(withNan.events).toEqual(valid.events);
  });

  it('C5 a tower of level 3 on covers outside the path never gives a hit', () => {
    const { events, sim } = buildWith([42, -2.5, Number.NaN], 2);
    expect(sim.state.spots[0]!.level).toBe(3);
    expect(shotsOf(events).flat()).toEqual([]);
    expect(ofType(events, 'attackerThrough')).toHaveLength(2);
    expect(evidenceItemsOf(sim.state)[0]).toMatchObject({ attempts: 1, correctFirstTry: true, solved: true });
  });
});

// ---------------------------------------------------------------- attackers at the last step (strategy section 11)

describe('adversarial: a wave whose attackers all start at the last step', () => {
  it('L1 both soldiers breach on the first step; a tower on the last step gets no shot', () => {
    const sim = toPlace(create(5));
    const last = lastPathIndex(sim);
    for (const a of sim.state.attackers) a.at = last;
    const ids = sim.state.attackers.map((a) => a.id);
    const out = buildOn(sim, 5);
    expect(types(out)).toEqual(['towerBuilt', 'waveStep', 'attackerThrough', 'attackerThrough', 'waveCleared', 'waveAppeared', 'stepShown']);
    const step = ofType(out, 'waveStep');
    expect(step).toHaveLength(1);
    expect(step[0]!.step).toBe(1);
    expect(step[0]!.moves).toEqual(ids.map((enemyId) => ({ enemyId, at: last + 1 })));
    expect(step[0]!.shots, 'the towers shoot after the move, and the move passed the last step').toEqual([]);
    expect(ofType(out, 'attackerThrough').map((e) => [e.enemyId, e.hearts])).toEqual([
      [ids[0], TUNING.hearts - 1],
      [ids[1], TUNING.hearts - 2],
    ]);
    expect(sim.state.hearts).toBe(TUNING.hearts - 2);
    expect(sim.state.phase).toBe('playing');
    expect(sim.state.wave).toBe(2);
    expect(sim.state.attackers.map((a) => a.id)).toEqual(attackersOf(2).map((a) => a.id));
    expect(sim.state.shift[0]!.cleared).toBe(true);
    expect(evidenceItemsOf(sim.state)[0]).toMatchObject({ attempts: 1, correctFirstTry: true, solved: true });
  });

  it('L2 at 1 heart the first breach rests and the second breach lowers the new hearts', () => {
    const sim = toPlace(create(5));
    for (const a of sim.state.attackers) a.at = lastPathIndex(sim);
    sim.state.hearts = 1;
    const out = buildOn(sim, 2);
    expect(types(out)).toEqual(['towerBuilt', 'waveStep', 'attackerThrough', 'rest', 'attackerThrough', 'waveCleared', 'waveAppeared', 'stepShown']);
    expect(ofType(out, 'attackerThrough').map((e) => e.hearts)).toEqual([0, TUNING.hearts - 1]);
    expect(ofType(out, 'rest')).toEqual([{ type: 'rest', hearts: TUNING.hearts }]);
    expect(sim.state.hearts).toBe(TUNING.hearts - 1);
    expect(sim.state.phase).toBe('playing');
  });

  it('L3 three tanks at the last step with 2 hearts: through, through then rest, through', () => {
    const sim = advanceToPlace(create(5), 2, () => 0);
    expect(sim.state.attackers).toHaveLength(3);
    for (const a of sim.state.attackers) a.at = lastPathIndex(sim);
    sim.state.hearts = 2;
    const out = buildOn(sim, 1);
    expect(types(out).slice(0, 8)).toEqual([
      'towerBuilt',
      'waveStep',
      'attackerThrough',
      'attackerThrough',
      'rest',
      'attackerThrough',
      'waveCleared',
      'waveAppeared',
    ]);
    expect(ofType(out, 'attackerThrough').map((e) => e.hearts)).toEqual([1, 0, TUNING.hearts - 1]);
    expect(ofType(out, 'waveStep')).toHaveLength(1);
    expect(sim.state.hearts).toBe(TUNING.hearts - 1);
    expect(ofType(out, 'waveCleared')[0]!.attackers.filter((a) => a.hits > 0), 'no living attacker at waveCleared').toEqual([]);
  });

  it('L4 every wave of a run starts at the last step: one waveStep per build, exact breaches and rests, evidence stays', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const events: CastleDefenseEvent[] = [];
    for (let i = 0; i < LOOP_LIMIT && sim.state.phase === 'playing'; i++) {
      if (sim.state.stage === 'collect') {
        pickRight(sim);
        continue;
      }
      for (const a of sim.state.attackers) a.at = lastPathIndex(sim);
      events.push(...buildOn(sim, (sim.state.wave - 1) % 6));
    }
    expect(sim.state.phase, 'the run ends inside the step limit').toBe('victory');
    const waves = sim.state.waveCount;
    expect(waves).toBeGreaterThan(1);
    let hearts: number = TUNING.hearts;
    let breaches = 0;
    let rests = 0;
    for (let w = 1; w <= waves; w++) {
      for (let k = 0; k < attackersOf(w).length; k++) {
        breaches += 1;
        hearts -= 1;
        if (hearts === 0) {
          hearts = TUNING.hearts;
          rests += 1;
        }
      }
    }
    expect(ofType(events, 'waveStep')).toHaveLength(waves);
    expect(ofType(events, 'attackerThrough')).toHaveLength(breaches);
    expect(ofType(events, 'rest')).toHaveLength(rests);
    expect(rests, 'the run rests at least once').toBeGreaterThan(0);
    expect(sim.state.hearts).toBe(hearts);
    expect(shotsOf(events).flat(), 'no tower shoots a breached attacker').toEqual([]);
    expect(types(events).at(-1)).toBe('victory');
    expect(sim.state.attackers, 'no attacker stays after the victory').toEqual([]);
    expect(sim.state.step).toBeNull();
    const evidence = evidenceOf(sim.state, STORY, 5, 1);
    expect(evidence.items).toHaveLength(waves);
    for (const item of evidence.items) expect(item).toMatchObject({ attempts: 1, correctFirstTry: true, solved: true });
    expect(resultsOf(sim.state, STORY, 5, 1).results.score).toBe(sim.state.coins);
  });
});

// ---------------------------------------------------------------- rules that one existing row checks

describe('adversarial: rules with one checker in the existing suite', () => {
  it('R1 (front target) a tower shoots the attacker with the highest at, one shot a step, and it ignores the rear', () => {
    const sim = toPlace(create(5));
    const [a0, a1] = sim.state.attackers;
    a0!.at = 2;
    a1!.at = 3;
    const out = buildOn(sim, 3); // spot 3 covers [2, 3, 4]
    const shots = shotsOf(out);
    expect(shots).toHaveLength(4);
    expect(shots[0]).toEqual([{ spot: 3, enemyId: a1!.id, at: 4, hits: 1, hitsLeft: 1, fell: false }]);
    expect(shots[1]).toEqual([{ spot: 3, enemyId: a0!.id, at: 4, hits: 1, hitsLeft: 1, fell: false }]);
    expect(shots[2]).toEqual([]);
    expect(shots[3]).toEqual([]);
    expect(ofType(out, 'attackerThrough').map((e) => [e.enemyId, e.hearts])).toEqual([
      [a1!.id, TUNING.hearts - 1],
      [a0!.id, TUNING.hearts - 2],
    ]);
  });

  it('R2 (hits) a level-3 tower gives min(3, hitsLeft) hits and no hit above hitsLeft; hitsLeft never goes below 0', () => {
    const sim = toPlace(create(5));
    const [a0, a1] = sim.state.attackers;
    a0!.at = 2;
    a1!.at = 1;
    sim.state.spots[4]!.level = 2; // the build makes it level 3; spot 4 covers [3, 4, 5]
    const out = buildOn(sim, 4);
    expect(ofType(out, 'towerBuilt')[0]).toMatchObject({ spot: 4, level: 3 });
    const shots = shotsOf(out);
    expect(shots).toHaveLength(2);
    expect(shots[0]).toEqual([{ spot: 4, enemyId: a0!.id, at: 3, hits: 2, hitsLeft: 0, fell: true }]);
    expect(shots[1]).toEqual([{ spot: 4, enemyId: a1!.id, at: 3, hits: 2, hitsLeft: 0, fell: true }]);
    expect(ofType(out, 'attackerThrough')).toEqual([]);
    expect(sim.state.hearts).toBe(TUNING.hearts);
  });

  it('R3 (spot order) the shots of one step rise by spot, and two towers share a step', () => {
    const sim = create(11);
    const pattern = [4, 1, 3, 2, 5, 0];
    const { builds } = playWith(sim, (s) => pattern[(s.wave - 1) % pattern.length]!);
    let busy = 0;
    let steps = 0;
    for (const b of builds) {
      for (const shots of shotsOf(b.out)) {
        steps += 1;
        const spots = shots.map((s) => s.spot);
        expect(spots).toEqual([...spots].sort((x, y) => x - y));
        expect(new Set(spots).size, 'one shot a tower on one step').toBe(spots.length);
        if (spots.length >= 2) busy += 1;
      }
    }
    expect(steps).toBeGreaterThan(0);
    expect(busy, 'steps with two or more shots').toBeGreaterThan(0);
  });

  it('R4 (streak coins) the coins of a right word are 10 plus 5 a word in the streak, capped at 35, over a whole run', () => {
    const sim = create(5);
    const { events } = playWith(sim, narrowestSpot);
    const coins = ofType(events, 'scored').map((e) => e.coins);
    expect(coins.length).toBeGreaterThan(TUNING.maxStreakBonus / TUNING.streakCoins + 2);
    coins.forEach((c, k) => expect(c, `word ${k}`).toBe(TUNING.coins + Math.min(TUNING.maxStreakBonus, TUNING.streakCoins * k)));
    expect(Math.max(...coins)).toBe(TUNING.coins + TUNING.maxStreakBonus);
    expect(sim.state.streak).toBe(coins.length);
    expect(sim.state.bestStreak).toBe(coins.length);
  });

  it('R5 (streak reset) a wrong word resets the streak, the next right word scores 10, and bestStreak keeps the high', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    pickRight(sim);
    pickRight(sim);
    expect(sim.state.streak).toBe(2);
    pickWrong(sim);
    expect(sim.state.streak).toBe(0);
    expect(sim.state.bestStreak).toBe(2);
    const out = pickRight(sim);
    expect(ofType(out, 'scored')[0]!.coins).toBe(TUNING.coins);
    expect(ofType(out, 'picked')[0]).toMatchObject({ correct: true, streak: 1 });
    expect(sim.state.streak).toBe(1);
    expect(sim.state.bestStreak).toBe(2);
  });

  it('R6 (counters) coins, picks, and towersBuilt equal the sums of the events; rejected commands add nothing', () => {
    for (const lower of [undefined, 3] as const) {
      const sim = create(6);
      const { events } = playWith(sim, narrowestSpot, lower === undefined ? {} : { lowerHeartsTo: lower });
      expect(sim.state.phase).toBe('victory');
      const picked = ofType(events, 'picked').length;
      const towers = ofType(events, 'towerBuilt');
      const scored = ofType(events, 'scored').reduce((sum, e) => sum + e.coins, 0);
      expect(picked).toBeGreaterThan(0);
      expect(towers).toHaveLength(sim.state.waveCount);
      if (lower !== undefined) expect(ofType(events, 'attackerStrike').length, 'wrong words in the run').toBeGreaterThan(0);
      expect(sim.state.picks).toBe(picked);
      expect(sim.state.towersBuilt).toBe(towers.length);
      expect(sim.state.coins).toBe(scored + towers.reduce((sum, e) => sum + e.coins, 0));
      expect(resultsOf(sim.state, STORY, 6, 1).results.score).toBe(sim.state.coins);
    }
  });

  it('R8 (victory) after kills in the last wave no attacker and no step stay in the state', () => {
    const sim = create(2);
    const events = playToEnd(sim);
    expect(sim.state.phase).toBe('victory');
    const last = ofType(events, 'waveCleared').at(-1)!;
    expect(last.attackers.some((a) => a.hits === 0), 'the last wave had a fallen attacker').toBe(true);
    expect(types(events).slice(-2)).toEqual(['waveCleared', 'victory']);
    expect(sim.state.attackers).toEqual([]);
    expect(sim.state.step).toBeNull();
  });

  it('R7 (rest on a wrong word) 5 wrong words from 5 hearts rest once; the strike hearts read 4, 3, 2, 1, 0; the state reads 5', () => {
    const sim = create(6);
    sim.dispatch({ type: 'start' });
    const strikes: number[] = [];
    let rests = 0;
    for (let i = 0; i < 40 && strikes.length < TUNING.hearts; i++) {
      if (!sim.state.step?.choices.some((c) => !c.right && !c.blocked)) {
        pickRight(sim);
        continue;
      }
      const out = pickWrong(sim);
      strikes.push(...ofType(out, 'attackerStrike').map((e) => e.hearts));
      rests += ofType(out, 'rest').length;
      if (sim.state.stage !== 'collect') break;
    }
    expect(strikes).toEqual([4, 3, 2, 1, 0]);
    expect(rests).toBe(1);
    expect(sim.state.hearts).toBe(TUNING.hearts);
    expect(sim.state.phase).toBe('playing');
  });
});

// ---------------------------------------------------------------- determinism

describe('adversarial: determinism', () => {
  /** Plays a mixed run; `noisy` adds rejected commands and ticks before each real command. */
  function drive(seed: number, noisy: boolean): { events: CastleDefenseEvent[]; snapshot: unknown; rejections: number } {
    const sim = create(seed);
    const chaos = createRng(77);
    const events: CastleDefenseEvent[] = [...sim.dispatch({ type: 'start' })];
    let rejections = 0;
    const noise = (stage: string): void => {
      const junk: unknown[] =
        stage === 'collect'
          ? [{ type: 'pick', choice: 99 }, { type: 'build', spot: 0 }, { type: 'pick', choice: Number.NaN }, { type: 'start' }]
          : [{ type: 'pick', choice: 0 }, { type: 'build', spot: 99 }, { type: 'build', spot: '0' }, { type: 'start' }];
      for (const command of junk) rejections += send(sim, command).filter((e) => e.type === 'rejected').length;
      expect(send(sim, { type: 'nope' })).toEqual([]);
      expect(sim.tick(16)).toEqual([]);
    };
    for (let i = 0; i < LOOP_LIMIT && sim.state.phase === 'playing'; i++) {
      if (noisy) noise(sim.state.stage);
      if (sim.state.stage === 'place') {
        events.push(...buildOn(sim, chaos.int(6)));
        continue;
      }
      const wrongLeft = sim.state.step!.choices.some((c) => !c.right && !c.blocked);
      events.push(...(chaos.next() < 0.3 && wrongLeft ? pickWrong(sim) : pickRight(sim)));
    }
    if (sim.state.phase === 'playing') throw new Error('drive: the run did not end');
    return { events, snapshot: sim.snapshot(), rejections };
  }

  it('D1 rejected commands, unknown commands, and ticks draw no random number: a noisy run equals a clean run', () => {
    for (const seed of [1, 2, 3]) {
      const clean = drive(seed, false);
      const noisy = drive(seed, true);
      expect(clean.events.length).toBeGreaterThan(50);
      expect(ofType(clean.events, 'attackerStrike').length, 'wrong words in the run').toBeGreaterThan(0);
      expect(noisy.rejections).toBeGreaterThan(50);
      expect(noisy.events).toEqual(clean.events);
      expect(noisy.snapshot).toEqual(clean.snapshot);
    }
  });

  it('D2 the same seed and commands give the same events, snapshot, and evidence three times', () => {
    const runs = [0, 1, 2].map(() => {
      const sim = create(9);
      const { events } = playWith(sim, (s) => (s.wave * 5) % 6, { lowerHeartsTo: 3 });
      return { events, snapshot: sim.snapshot(), evidence: evidenceOf(sim.state, STORY, 9, 1000) };
    });
    expect(runs[0]!.events.length).toBeGreaterThan(50);
    expect(runs[0]!.evidence.items.length).toBeGreaterThan(0);
    expect(runs[1]).toEqual(runs[0]);
    expect(runs[2]).toEqual(runs[0]);
  });

  it('D3 a different seed changes the sentence order and the cards, and no rule number', () => {
    const orders = new Set<string>();
    const first = create(1).state.shift.map((s) => s.id).join();
    let differing = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const sim = create(seed);
      const order = sim.state.shift.map((s) => s.id).join();
      orders.add(order);
      if (order !== first) differing += 1;
      const events = playToEnd(sim);
      expect(sim.state.phase).toBe('victory');
      expect(ofType(events, 'waveAppeared').map((e) => e.attackers.length)).toEqual(
        Array.from({ length: sim.state.waveCount }, (_, w) => attackersOf(w + 1).length),
      );
      const coins = ofType(events, 'scored').map((e) => e.coins);
      coins.forEach((c, k) => expect(c).toBe(TUNING.coins + Math.min(TUNING.maxStreakBonus, TUNING.streakCoins * k)));
      expect(sim.state.waveCount).toBe(TUNING.maxWaves);
      expect(sim.state.hearts).toBeLessThanOrEqual(TUNING.hearts);
      expect(sim.state.spots.map((s) => s.covers)).toEqual(create(1).state.spots.map((s) => s.covers));
    }
    expect(differing, 'seeds with another sentence order than seed 1').toBeGreaterThanOrEqual(5);
    expect(orders.size).toBeGreaterThanOrEqual(5);
  });
});
