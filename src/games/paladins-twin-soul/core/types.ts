/**
 * Paladin's Twin Soul rules core: state, commands, and events. The view reads the state after
 * every call and plays the events in order; every event carries ids and plain values, never
 * object references. There is no timer and no game over.
 */

/** The shade kinds share a balanced, seeded formation. */
export const SHADE_KINDS = ['specter', 'wraith', 'ghost'] as const;

export type ShadeKind = (typeof SHADE_KINDS)[number];

/** A target word of the run, with its evidence counters. */
export interface TargetWord {
  /** The story vocabulary id (the evidence `itemId`). */
  id: string;
  term: string;
  translation: string;
  /** Shades the student struck while this word was the target. */
  attempts: number;
  /** True when the first shade struck held this word's term. */
  correctFirstTry: boolean;
  /** True once the shade with this word's term was struck. */
  solved: boolean;
}

/** One shade of the formation. It carries the English term of `wordId`. */
export interface Shade {
  /** Unique within the run ("w2s3": wave 2, shade 3). */
  id: string;
  wordId: string;
  term: string;
  kind: ShadeKind;
  /** True after a wrong strike fades this shade. */
  fallen: boolean;
}

export interface TwinSoulState {
  phase: 'playing' | 'victory';
  helper: boolean;
  /** Every target word of the run, in target order. */
  targets: TargetWord[];
  /** Zero-based wave = index of the target word. */
  targetIndex: number;
  targetCount: number;
  /** The meaning to match now (the soul the captor holds); null after the last one. */
  target: { itemId: string; term: string; translation: string } | null;
  /** The shades of this wave, in formation order (row by row). Empty after the last wave. */
  shades: Shade[];
  courage: number;
  maxCourage: number;
  /** Souls freed so far: the twin soul grows with every freed word. */
  twins: number;
  /** Points of the run: a fixed number per freed soul. */
  score: number;
  /** Wrong shades struck during this run. */
  misses: number;
  started: boolean;
}

// ---------------------------------------------------------------- commands

export type TwinSoulCommand =
  /** Once, when the stage is ready: shows the first wave. */
  | { type: 'start' }
  /** Strike one shade of the formation. */
  | { type: 'strike'; shade: string };

// ---------------------------------------------------------------- events

export interface ShadeShown {
  id: string;
  wordId: string;
  term: string;
  kind: ShadeKind;
}

export type TwinSoulEvent =
  /** A new wave: the meaning to find and the shades that carry the terms. */
  | { type: 'waveShown'; itemId: string; translation: string; shades: ShadeShown[] }
  /** The captor shade seizes the twin soul of the target word. */
  | { type: 'captured'; shade: string }
  /** An accepted strike fires one bolt. */
  | { type: 'boltFired'; shade: string }
  /** A wrong shade fades for the rest of this wave. */
  | { type: 'shadeFaded'; shade: string; wordId: string }
  /** A standing shade dives and returns to its place. */
  | { type: 'shadeDived'; shade: string; courage: number }
  | { type: 'rest'; courage: number }
  /** The captor fell: the twin soul is free. `firstTry` = no wrong shade fell for this word. */
  | { type: 'soulFreed'; shade: string; itemId: string; firstTry: boolean; twins: number; points: number }
  /** The shades left in the formation scatter after the soul is free. */
  | { type: 'shadesScattered'; shades: string[] }
  /** Unknown shade, a fallen shade, or a command after the end: nothing happens. */
  | { type: 'strikeRejected'; shade: string }
  | { type: 'victory' };

export type TwinSoulEventType = TwinSoulEvent['type'];

/** Every event type the core emits; there is no game over. */
export const TWIN_SOUL_EVENT_TYPES: readonly TwinSoulEventType[] = [
  'waveShown',
  'captured',
  'boltFired',
  'shadeFaded',
  'shadeDived',
  'rest',
  'soulFreed',
  'shadesScattered',
  'strikeRejected',
  'victory',
];
