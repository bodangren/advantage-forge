/**
 * The Castle Defense simulation: a turn `Simulation` (`tick` returns []). Each wave is one
 * sentence of the story. The student builds the sentence word by word, then picks a build spot.
 * A wrong word costs one castle heart. Each build raises the tower by one level.
 * Attackers move along the path. Towers shoot the front attacker in range after each move.
 * A breach costs one heart. At 0 hearts the heroes rest and the hearts return.
 * No game over or timer occurs. The run ends after every sentence wave.
 *
 * Event order per command:
 *   start: waveAppeared, stepShown
 *   pick right: picked, scored, then stepShown or sentenceBuilt
 *   pick wrong: picked, attackerStrike, [rest], stepShown
 *   build: towerBuilt, then each waveStep followed by its attackerThrough and [rest] events,
 *          then waveCleared, then [waveAppeared, stepShown] or victory
 */
import { createRng, type Rng, type Simulation } from '../../../apk3d/sim/index.js';
import { attackersOf, choicesOf, shiftOf, type CastleDefenseInput } from './content.js';
import { type Attacker, type CastleDefenseCommand, type CastleDefenseEvent, type CastleDefenseState, type Spot, type ShotSummary, type Step } from './types.js';

/** Provisional layout. Phase 2 will align it with the selected scene. */
const PATH = [0, 1, 2, 3, 4, 5];
const RANGES = [[0, 1], [1, 2, 3, 4, 5], [0, 1, 2], [2, 3, 4], [3, 4, 5], [5]];

/** Every tuning number of the game. */
export const TUNING = {
  /** Sentences (waves) in a run, at most. */
  maxWaves: 6,
  /** Words on the card: 3, or 2 in Helper mode. */
  choices: 3,
  helperChoices: 2,
  /** Hearts of the castle. */
  hearts: 5,
  coins: 10,
  /** Extra coins per right word already in a row, up to `maxStreakBonus`. */
  streakCoins: 5,
  maxStreakBonus: 25,
  /** Coins for a finished tower. */
  towerCoins: 20,
} as const;

export interface CastleDefenseOptions {
  seed: number;
  helper: boolean;
}

export type CastleDefenseSimulation = Simulation<CastleDefenseState, CastleDefenseCommand, CastleDefenseEvent>;

export function createCastleDefense(input: CastleDefenseInput, options: CastleDefenseOptions): CastleDefenseSimulation {
  const rng: Rng = createRng(options.seed);
  const shift = shiftOf(input, rng, TUNING.maxWaves);
  const choiceCount = options.helper ? TUNING.helperChoices : TUNING.choices;
  const spots: Spot[] = RANGES.map((covers, spot) => ({ spot, covers: [...covers], level: 0 }));

  const state: CastleDefenseState = {
    phase: shift.length > 0 ? 'playing' : 'victory',
    helper: options.helper,
    shift,
    wave: 1,
    waveCount: shift.length,
    stage: 'collect',
    built: [],
    step: null,
    attackers: shift.length > 0 ? attackersOf(1) : [],
    path: [...PATH],
    spots,
    hearts: TUNING.hearts,
    maxHearts: TUNING.hearts,
    coins: 0,
    streak: 0,
    bestStreak: 0,
    picks: 0,
    towersBuilt: 0,
    started: false,
  };

  const sentence = () => state.shift[state.wave - 1]!;
  const stepAt = (index: number): Step => ({ index, choices: choicesOf(state.shift, state.wave - 1, index, choiceCount, rng) });
  if (shift.length > 0) state.step = stepAt(0);

  const copyAttackers = (): Attacker[] => state.attackers.map((a) => ({ ...a }));
  const copySpots = (): Spot[] => state.spots.map((s) => ({ ...s, covers: [...s.covers] }));
  const showStep = (): CastleDefenseEvent => ({ type: 'stepShown', step: structuredClone(state.step as Step), built: [...state.built] });
  const living = (): Attacker[] => state.attackers.filter((a) => a.hits > 0);

  const start = (): CastleDefenseEvent[] => {
    if (state.started) return [{ type: 'rejected', command: 'start' }];
    state.started = true;
    if (!state.step) return [];
    return [{ type: 'waveAppeared', wave: state.wave, waveCount: state.waveCount, sentenceId: sentence().id, attackers: copyAttackers() }, showStep()];
  };

  const pick = (index: number): CastleDefenseEvent[] => {
    const step = state.step;
    const choice = step?.choices.find((c) => c.index === index);
    if (!state.started || state.stage !== 'collect' || !step || !choice || choice.blocked) return [{ type: 'rejected', command: 'pick' }];
    const current = sentence();
    const events: CastleDefenseEvent[] = [];
    state.picks += 1;
    current.started = true;

    if (!choice.right) {
      choice.blocked = true;
      current.wrongs += 1;
      state.streak = 0;
      events.push({ type: 'picked', choice: index, word: choice.word, correct: false, index: step.index, streak: 0 });
      const attacker = rng.pick(living());
      state.hearts = Math.max(0, state.hearts - 1);
      events.push({ type: 'attackerStrike', enemyId: attacker.id, hearts: state.hearts });
      if (state.hearts === 0) {
        state.hearts = state.maxHearts;
        events.push({ type: 'rest', hearts: state.hearts });
      }
      events.push(showStep());
      return events;
    }

    state.built.push(current.words[step.index]!);
    events.push({ type: 'picked', choice: index, word: choice.word, correct: true, index: step.index, streak: state.streak + 1 });
    const coins = TUNING.coins + Math.min(TUNING.maxStreakBonus, state.streak * TUNING.streakCoins);
    state.coins += coins;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    events.push({ type: 'scored', coins });
    if (state.built.length >= current.words.length) {
      state.stage = 'place';
      state.step = null;
      events.push({ type: 'sentenceBuilt', wave: state.wave, spots: copySpots() });
      return events;
    }
    state.step = stepAt(state.built.length);
    events.push(showStep());
    return events;
  };

  const build = (spot: number): CastleDefenseEvent[] => {
    const slot = state.spots.find((s) => s.spot === spot);
    if (!state.started || state.stage !== 'place' || !slot) return [{ type: 'rejected', command: 'build' }];
    const events: CastleDefenseEvent[] = [];
    slot.level += 1;
    state.towersBuilt += 1;
    state.coins += TUNING.towerCoins;
    events.push({ type: 'towerBuilt', spot: slot.spot, level: slot.level, coins: TUNING.towerCoins });

    // Negative positions queue attackers outside the gate, one step apart.
    const onPath = (): Attacker[] => living().filter((a) => a.at < state.path.length);
    const stepLimit = state.path.length + state.attackers.length + 1;
    for (let step = 1; onPath().length > 0; step++) {
      if (step > stepLimit) throw new Error('Castle Defense wave exceeded its step bound');
      const moving = onPath();
      for (const attacker of moving) attacker.at += 1;
      const moves = moving.map((a) => ({ enemyId: a.id, at: a.at }));
      const shots: ShotSummary[] = [];
      for (const tower of [...state.spots].filter((s) => s.level > 0).sort((a, b) => a.spot - b.spot)) {
        const target = onPath().filter((a) => tower.covers.includes(a.at)).sort((a, b) => b.at - a.at)[0];
        if (!target) continue;
        const hits = Math.min(tower.level, target.hits);
        target.hits -= hits;
        shots.push({ spot: tower.spot, enemyId: target.id, at: target.at, hits, hitsLeft: target.hits, fell: target.hits === 0 });
      }
      events.push({ type: 'waveStep', step, moves, shots });
      for (const attacker of moving.filter((a) => a.at === state.path.length)) {
        state.attackers = state.attackers.filter((a) => a.id !== attacker.id);
        state.hearts -= 1;
        events.push({ type: 'attackerThrough', enemyId: attacker.id, hearts: state.hearts });
        if (state.hearts === 0) {
          state.hearts = state.maxHearts;
          events.push({ type: 'rest', hearts: state.hearts });
        }
      }
    }
    sentence().cleared = true;
    events.push({ type: 'waveCleared', wave: state.wave, attackers: copyAttackers() });

    if (state.wave >= state.waveCount) {
      state.phase = 'victory';
      state.attackers = [];
      state.step = null;
      events.push({ type: 'victory' });
      return events;
    }
    state.wave += 1;
    state.stage = 'collect';
    state.built = [];
    state.attackers = attackersOf(state.wave);
    state.step = stepAt(0);
    events.push({ type: 'waveAppeared', wave: state.wave, waveCount: state.waveCount, sentenceId: sentence().id, attackers: copyAttackers() }, showStep());
    return events;
  };

  return {
    get state() {
      return state;
    },
    dispatch(command) {
      if (state.phase !== 'playing') return [];
      switch (command.type) {
        case 'start':
          return start();
        case 'pick':
          return pick(command.choice);
        case 'build':
          return build(command.spot);
        default:
          return [];
      }
    },
    tick: () => [],
    snapshot: () => structuredClone(state),
  };
}
