/**
 * The turn simulation holds one missile above each standing castle while the wave has unheld words.
 * The core selects one active missile with the seeded RNG. A wrong spell takes one heart from its castle.
 * The same meaning stays active with the failed word shut. A fixed seeded castle order selects a place after a fall.
 *
 * The displaced word returns to the unheld words. The rest restores every castle after the last castle falls.
 * The storm restores every castle and fills free places. Neither operation changes the other held missiles.
 * There is no timer and no game over.
 *
 * Event order per command:
 *   start: waveAppeared, missileThrown x n, roundShown
 *   right: cast, scored, [waveCleared, [waveAppeared]], [missileThrown x n], roundShown or victory
 *   wrong: cast, castleHit, [rest], [missileThrown x n], roundShown
 *   storm: stormCast, [missileThrown x n], roundShown
 */
import { createRng, type Rng, type Simulation } from '../../../apk3d/sim/index.js';
import { distinctTerms, formationOf, roundOf, targetsOf, type MagicDefenseInput } from './content.js';
import type { HeldMissile, MagicDefenseCommand, MagicDefenseEvent, MagicDefenseState, Round, TargetWord, WaveEnemy } from './types.js';

/** Every tuning number of the game. */
export const TUNING = {
  /** Castles (and enemy casters): 3, or 2 in Helper mode. */
  castles: 3,
  helperCastles: 2,
  /** Spell words on the card: 3, or 2 in Helper mode. */
  choices: 3,
  helperChoices: 2,
  /** Words per wave (spread evenly over the waves of a run). */
  wordsPerWave: 5,
  castleHealth: 3,
  coins: 10,
  /** Extra coins per right spell already in a row, up to `maxStreakBonus`. */
  streakCoins: 5,
  maxStreakBonus: 25,
  /** Storm mana: +`manaPerSpell` for each right spell, a storm at `maxMana`. */
  manaPerSpell: 10,
  maxMana: 100,
} as const;

export interface MagicDefenseOptions {
  seed: number;
  helper: boolean;
}

export type MagicDefenseSimulation = Simulation<MagicDefenseState, MagicDefenseCommand, MagicDefenseEvent>;

export function createMagicDefense(input: MagicDefenseInput, options: MagicDefenseOptions): MagicDefenseSimulation {
  const rng: Rng = createRng(options.seed);
  const targets = targetsOf(input, rng, TUNING.wordsPerWave);
  const castleCount = options.helper ? TUNING.helperCastles : TUNING.castles;
  const choiceCount = Math.max(1, Math.min(options.helper ? TUNING.helperChoices : TUNING.choices, distinctTerms(targets)));
  const waveCount = targets.reduce((n, t) => Math.max(n, t.wave), 0);
  const sizeOf = (wave: number): number => targets.filter((t) => t.wave === wave).length;
  const full = (): number[] => Array.from({ length: castleCount }, () => TUNING.castleHealth);
  const castleOrder = rng.shuffle(Array.from({ length: castleCount }, (_, i) => i));
  const cards = new Map<string, Round>();
  let missileCount = 0;

  const state: MagicDefenseState = {
    phase: targets.length > 0 ? 'playing' : 'victory',
    helper: options.helper,
    targets,
    targetCount: targets.length,
    wave: 1,
    waveCount,
    waveSize: sizeOf(1),
    waveDone: 0,
    enemies: targets.length > 0 ? formationOf(1, castleCount) : [],
    castles: full(),
    maxCastleHealth: TUNING.castleHealth,
    missiles: [],
    activeMissileId: null,
    round: null,
    coins: 0,
    mana: 0,
    maxMana: TUNING.maxMana,
    streak: 0,
    bestStreak: 0,
    casts: 0,
    started: false,
  };

  const unheldWord = (): TargetWord | undefined => state.targets.find((t) =>
    t.wave === state.wave && !t.solved && !state.missiles.some((m) => m.wordId === t.id));

  const throwMissile = (word: TargetWord, castle: number, events: MagicDefenseEvent[]): HeldMissile => {
    const missile: HeldMissile = {
      id: `m-${++missileCount}`,
      wordId: word.id,
      prompt: word.translation,
      castle,
      enemyId: state.enemies.find((e) => e.lane === castle)!.id,
    };
    state.missiles.push(missile);
    events.push({ type: 'missileThrown', missile: { ...missile } });
    return missile;
  };

  const fillPlaces = (events: MagicDefenseEvent[]): void => {
    for (let castle = 0; castle < castleCount; castle++) {
      if (state.castles[castle]! <= 0 || state.missiles.some((m) => m.castle === castle)) continue;
      const word = unheldWord();
      if (word) throwMissile(word, castle, events);
    }
  };

  const activate = (missile: HeldMissile): void => {
    state.activeMissileId = missile.id;
    let card = cards.get(missile.wordId);
    if (!card) {
      card = roundOf(state.targets, missile.wordId, state.enemies, state.castles, choiceCount, rng);
      cards.set(missile.wordId, card);
    }
    card.castle = missile.castle;
    card.enemyId = missile.enemyId;
    state.round = card;
  };
  const pickActive = (): void => activate(rng.pick(state.missiles));

  // Prepare the initial card for callers before start. Start publishes every initial throw.
  const opening: MagicDefenseEvent[] = [];
  fillPlaces(opening);
  if (state.missiles.length) pickActive();

  const copyEnemies = (): WaveEnemy[] => state.enemies.map((e) => ({ ...e }));
  const showRound = (): MagicDefenseEvent => ({ type: 'roundShown', round: structuredClone(state.round as Round) });

  const start = (): MagicDefenseEvent[] => {
    if (state.started) return [{ type: 'rejected', command: 'start' }];
    state.started = true;
    if (!state.round) return [];
    return [{ type: 'waveAppeared', wave: state.wave, waveCount: state.waveCount, enemies: copyEnemies() }, ...opening, showRound()];
  };

  const cast = (index: number): MagicDefenseEvent[] => {
    const round = state.round;
    const choice = round?.choices.find((c) => c.index === index);
    if (!state.started || !round || !choice || choice.blocked) return [{ type: 'rejected', command: 'cast' }];
    const word = state.targets.find((t) => t.id === round.wordId)!;
    const correct = choice.wordId === word.id;
    const events: MagicDefenseEvent[] = [];
    state.casts += 1;
    word.attempts += 1;
    if (word.attempts === 1) word.correctFirstTry = correct;
    const base = { type: 'cast', choice: choice.index, wordId: choice.wordId, correct, castle: round.castle, enemyId: round.enemyId, correctText: word.term } as const;

    if (!correct) {
      choice.blocked = true;
      state.streak = 0;
      events.push({ ...base, streak: 0 });
      state.castles[round.castle] = Math.max(0, state.castles[round.castle]! - 1);
      events.push({ type: 'castleHit', castle: round.castle, enemyId: round.enemyId, health: state.castles[round.castle]! });
      if (state.castles[round.castle] === 0) {
        state.missiles = state.missiles.filter((m) => m.id !== state.activeMissileId);
        if (state.castles.every((h) => h === 0)) {
          state.castles = full();
          events.push({ type: 'rest', castles: [...state.castles] });
        }
        const standing = castleOrder.filter((castle) => state.castles[castle]! > 0);
        const castle = standing.find((lane) => !state.missiles.some((m) => m.castle === lane)) ?? standing[0]!;
        state.missiles = state.missiles.filter((m) => m.castle !== castle);
        activate(throwMissile(word, castle, events));
        fillPlaces(events);
      }
      events.push(showRound());
      return events;
    }

    word.solved = true;
    cards.delete(word.id);
    state.missiles = state.missiles.filter((m) => m.id !== state.activeMissileId);
    events.push({ ...base, streak: state.streak + 1 });
    const coins = TUNING.coins + Math.min(TUNING.maxStreakBonus, state.streak * TUNING.streakCoins);
    state.coins += coins;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.mana = Math.min(TUNING.maxMana, state.mana + TUNING.manaPerSpell);
    state.waveDone += 1;
    events.push({ type: 'scored', coins, mana: state.mana });

    if (state.waveDone >= state.waveSize) {
      events.push({ type: 'waveCleared', wave: state.wave, enemies: copyEnemies() });
      if (state.wave >= state.waveCount) {
        state.phase = 'victory';
        state.round = null;
        state.activeMissileId = null;
        state.enemies = [];
        events.push({ type: 'victory' });
        return events;
      }
      state.wave += 1;
      state.waveSize = sizeOf(state.wave);
      state.waveDone = 0;
      state.enemies = formationOf(state.wave, castleCount);
      events.push({ type: 'waveAppeared', wave: state.wave, waveCount: state.waveCount, enemies: copyEnemies() });
    }
    fillPlaces(events);
    pickActive();
    events.push(showRound());
    return events;
  };

  const storm = (): MagicDefenseEvent[] => {
    if (!state.started || !state.round || state.mana < TUNING.maxMana) return [{ type: 'rejected', command: 'storm' }];
    state.mana = 0;
    state.castles = full();
    const events: MagicDefenseEvent[] = [{ type: 'stormCast', castles: [...state.castles] }];
    fillPlaces(events);
    events.push(showRound());
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
        case 'cast':
          return cast(command.choice);
        case 'storm':
          return storm();
        default:
          return [];
      }
    },
    tick: () => [],
    snapshot: () => structuredClone(state),
  };
}
