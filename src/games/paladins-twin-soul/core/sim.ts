/**
 * The Paladin's Twin Soul simulation: a turn `Simulation` (`tick` returns []).
 *
 * Each wave shows a meaning and a formation of shades with English terms.
 * A wrong strike fades its shade. A standing shade dives and returns, and courage falls by one.
 * At zero courage the team rests and returns with three. A right strike frees the soul.
 * The other shades scatter, and the next word comes. No timer decides anything.
 *
 * Event order of one `strike`:
 *   wrong:  boltFired, shadeFaded, shadeDived, [rest]
 *   right:  boltFired, soulFreed, shadesScattered,
 *           then [waveShown, captured] or victory
 */
import { createRng, type Rng, type Simulation } from '../../../apk3d/sim/index.js';
import { shadesOf, targetsOf, type TwinSoulInput } from './content.js';
import type { TargetWord, TwinSoulCommand, TwinSoulEvent, TwinSoulState } from './types.js';

/** Every tuning number of the game. */
export const TUNING = {
  /** Decoy shades beside the captor: 5 (a formation of 6), 3 in Helper mode. */
  decoys: 5,
  helperDecoys: 3,
  /** Points per freed soul (the legacy game paid 100 per shade). */
  pointsPerSoul: 100,
  maxCourage: 5,
  restCourage: 3,
} as const;

export interface TwinSoulOptions {
  seed: number;
  helper: boolean;
}

export type TwinSoulSimulation = Simulation<TwinSoulState, TwinSoulCommand, TwinSoulEvent>;

export function createTwinSoul(input: TwinSoulInput, options: TwinSoulOptions): TwinSoulSimulation {
  const rng: Rng = createRng(options.seed);
  const targets = targetsOf(input, rng);
  const decoys = options.helper ? TUNING.helperDecoys : TUNING.decoys;
  const first = targets[0];

  const state: TwinSoulState = {
    phase: first ? 'playing' : 'victory',
    helper: options.helper,
    targets,
    targetIndex: 0,
    targetCount: targets.length,
    target: first ? { itemId: first.id, term: first.term, translation: first.translation } : null,
    shades: first ? shadesOf(targets, first.id, decoys, 1, rng) : [],
    courage: TUNING.maxCourage,
    maxCourage: TUNING.maxCourage,
    twins: 0,
    score: 0,
    misses: 0,
    started: false,
  };

  const currentTarget = (): TargetWord | null => state.targets[state.targetIndex] ?? null;

  const waveEvents = (): TwinSoulEvent[] => {
    const word = currentTarget();
    if (!word) return [];
    const captor = state.shades.find((s) => s.wordId === word.id)!;
    return [
      {
        type: 'waveShown',
        itemId: word.id,
        translation: word.translation,
        shades: state.shades.map((s) => ({ id: s.id, wordId: s.wordId, term: s.term, kind: s.kind })),
      },
      { type: 'captured', shade: captor.id },
    ];
  };

  const start = (): TwinSoulEvent[] => {
    if (state.started) return [];
    state.started = true;
    return waveEvents();
  };

  const dive = (events: TwinSoulEvent[]): void => {
    const standing = state.shades.filter((s) => !s.fallen);
    const diver = rng.pick(standing);
    state.courage = Math.max(0, state.courage - 1);
    events.push({ type: 'shadeDived', shade: diver.id, courage: state.courage });
    if (state.courage === 0) {
      state.courage = TUNING.restCourage;
      events.push({ type: 'rest', courage: state.courage });
    }
  };

  const strike = (shadeId: string): TwinSoulEvent[] => {
    const word = currentTarget();
    const shade = state.shades.find((s) => s.id === shadeId);
    if (!word || !shade || shade.fallen) return [{ type: 'strikeRejected', shade: shadeId }];
    const events: TwinSoulEvent[] = [{ type: 'boltFired', shade: shade.id }];
    word.attempts += 1;
    if (shade.wordId !== word.id) {
      if (word.attempts === 1) word.correctFirstTry = false;
      shade.fallen = true;
      state.misses += 1;
      events.push({ type: 'shadeFaded', shade: shade.id, wordId: shade.wordId });
      dive(events);
      return events;
    }
    if (word.attempts === 1) word.correctFirstTry = true;
    word.solved = true;
    state.twins += 1;
    state.score += TUNING.pointsPerSoul;
    events.push({
      type: 'soulFreed',
      shade: shade.id,
      itemId: word.id,
      firstTry: word.correctFirstTry,
      twins: state.twins,
      points: TUNING.pointsPerSoul,
    });
    events.push({ type: 'shadesScattered', shades: state.shades.filter((s) => s !== shade && !s.fallen).map((s) => s.id) });
    state.targetIndex += 1;
    const next = currentTarget();
    if (next) {
      state.target = { itemId: next.id, term: next.term, translation: next.translation };
      state.shades = shadesOf(state.targets, next.id, decoys, state.targetIndex + 1, rng);
      events.push(...waveEvents());
    } else {
      state.target = null;
      state.shades = [];
      state.phase = 'victory';
      events.push({ type: 'victory' });
    }
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
        case 'strike':
          return state.started ? strike(command.shade) : [];
        default:
          return [];
      }
    },
    tick: () => [],
    snapshot: () => structuredClone(state),
  };
}
