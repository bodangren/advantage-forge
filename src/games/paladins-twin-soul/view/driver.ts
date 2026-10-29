/**
 * The Paladin's Twin Soul event player serves both views. The core decides every rule.
 * The driver asks for a shade, sends the strike, and plays each event through a `Presentation`.
 * Each view supplies its renderer. The tests supply a recorder. The driver imports neither three.js nor Phaser.
 */
import type { GameResults, StoryGameEvidence, StoryGameOutcome } from '../../../apk3d/contracts/index.js';
import {
  resultsOf,
  type ShadeKind,
  type TwinSoulEvent,
  type TwinSoulSimulation,
} from '../core/index.js';

export interface WaveShown {
  translation: string;
  /** The shades still standing, in formation order. */
  shades: { id: string; term: string; kind: ShadeKind }[];
  /** True after a wrong shade fell in this wave. */
  retry: boolean;
}

export type Sfx = 'reject' | 'freed' | 'hit' | 'defeat' | 'victory' | 'spawn';

/** What a renderer shows. Every method that animates returns a promise the driver awaits. */
export interface Presentation {
  /** Shows the card with the meaning and the shades; resolves with the id of the tapped shade. */
  ask(wave: WaveShown): Promise<string>;
  setCourage(value: number, max: number): void;
  setTwins(freed: number, total: number): void;
  setPlace(index: number, count: number): void;
  /** The captor shade seizes the twin soul (a floating note over the paladin). */
  captured(): void;
  /** A holy bolt travels to the struck shade. */
  bolt(shade: string): Promise<void>;
  /** A wrong shade fades (marked on the card). */
  shadeFaded(shade: string): Promise<void>;
  /** A standing shade dives and returns to its place. */
  shadeDived(shade: string): Promise<void>;
  /** The captor falls and the soul is free (marked on the card). */
  soulFreed(shade: string, points: number, firstTry: boolean): Promise<void>;
  /** The other shades scatter and the card goes. */
  scatter(): Promise<void>;
  rest(): Promise<void>;
  sfx(name: Sfx): void;
  victory(): Promise<void>;
  /** Resolves when every running stage animation is over. */
  settle(): Promise<void>;
}

export interface PlayerOptions {
  sim: TwinSoulSimulation;
  story: { id: string; level: StoryGameEvidence['level'] };
  seed: number;
  presentation: Presentation;
  /** Reports the run once to the host. */
  complete: (results: GameResults, outcome: StoryGameOutcome, evidence: StoryGameEvidence) => void;
  now?: () => number;
}

export class TwinSoulPlayer {
  private readonly sim: TwinSoulSimulation;
  private readonly p: Presentation;
  private waveNumber = 0;
  private done = false;
  private destroyed = false;
  private readonly startedAt: number;
  private readonly now: () => number;

  constructor(private readonly o: PlayerOptions) {
    this.sim = o.sim;
    this.p = o.presentation;
    this.now = o.now ?? (() => performance.now());
    this.startedAt = this.now();
  }

  get finished(): boolean {
    return this.done;
  }

  /** Plays the opening events, then asks for a shade until the last soul is free. */
  async start(): Promise<void> {
    const state = this.sim.state;
    this.p.setCourage(state.courage, state.maxCourage);
    this.p.setTwins(state.twins, state.targetCount);
    await this.play(this.sim.dispatch({ type: 'start' }));
    while (!this.done && !this.destroyed && this.sim.state.phase === 'playing') {
      const wave = this.sim.state;
      const id = await this.p.ask({
        translation: wave.target?.translation ?? '',
        shades: wave.shades.filter((s) => !s.fallen).map((s) => ({ id: s.id, term: s.term, kind: s.kind })),
        retry: wave.shades.some((s) => s.fallen),
      });
      if (this.destroyed) break;
      await this.play(this.sim.dispatch({ type: 'strike', shade: id }));
    }
  }

  destroy(): void {
    this.destroyed = true;
  }

  /** Plays events from any command (the tests and the QC hook). */
  async play(events: readonly TwinSoulEvent[]): Promise<void> {
    for (const ev of events) {
      if (this.destroyed) return;
      await this.show(ev);
    }
    await this.p.settle();
  }

  private async show(ev: TwinSoulEvent): Promise<void> {
    const state = this.sim.state;
    const p = this.p;
    switch (ev.type) {
      case 'waveShown':
        this.waveNumber += 1;
        p.setPlace(this.waveNumber, state.targetCount);
        break;
      case 'captured':
        p.captured();
        break;
      case 'boltFired':
        await p.bolt(ev.shade);
        break;
      case 'shadeFaded':
        p.sfx('reject');
        await p.shadeFaded(ev.shade);
        break;
      case 'strikeRejected':
        p.sfx('reject');
        break;
      case 'soulFreed':
        p.sfx('freed');
        p.setTwins(ev.twins, state.targetCount);
        await p.soulFreed(ev.shade, ev.points, ev.firstTry);
        break;
      case 'shadesScattered':
        await p.scatter();
        break;
      case 'shadeDived': {
        await p.shadeDived(ev.shade);
        p.setCourage(ev.courage, state.maxCourage);
        break;
      }
      case 'rest':
        p.setCourage(ev.courage, state.maxCourage);
        await p.rest();
        break;
      case 'victory':
        await p.settle();
        p.sfx('victory');
        await p.victory();
        this.finish();
        break;
    }
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    const { evidence, results, outcome } = resultsOf(this.sim.state, this.o.story, this.o.seed, this.now() - this.startedAt);
    this.o.complete(results, outcome, evidence);
  }
}
