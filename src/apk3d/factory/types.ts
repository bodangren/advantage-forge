/**
 * The 3D cartridge boundary (section 2 of docs/apk3d-cartridge.md). A Phaser cartridge in the APK
 * has `createGameConfig`; a 3D cartridge has `createGame`, and the three factory gives it the kit
 * services: stage, HUD, audio, and strings. These types name kit classes, so they live in the
 * factory layer, not in `contracts`.
 */
import type {
  APKDiagnosticInput,
  APKSessionMode,
  Cartridge3DManifest,
  Catalog,
  GameBriefing,
  GameInput,
  GameResults,
  GameTerminalOutcome,
  LayoutRect,
  RuntimeEdition3D,
  ScopedI18n,
  StoryGameEvidence,
  StoryInput,
  SupportedResponsiveComposition,
} from '../contracts/index.js';
import type { AudioBus } from '../audio/bus.js';
import type { HudRoot } from '../hud/root.js';
import type { QualityTierId, Stage3D } from '../stage/stage.js';

/** The standalone host's layout; the APK passes a `SupportedResponsiveComposition`. */
export interface StandaloneComposition {
  profile: 'compact' | 'wide';
  /** The area inside the safe-area insets, in CSS pixels. */
  safe: LayoutRect;
}

export type Composition3D = SupportedResponsiveComposition | StandaloneComposition;

/**
 * Host controls a game may call from its own HUD. In the APK the host page draws its own mute
 * and story controls (and `APKHostAdapter.navigate` opens the story), so a game hides a button
 * when the service is absent.
 */
export interface HostServices {
  /** Opens the story over the game at a paragraph (look back); the host pauses the game meanwhile. */
  openStory?(paragraph?: number): void;
  /** Toggles the page sound; returns true when it is now muted. */
  toggleMute?(): boolean;
}

/** Choices the student made before the game (the APK maps Helper mode to difficulty 'easy'). */
export interface SessionOptions {
  helper: boolean;
  /** Hero id to the color preset the student unlocked (cosmetic; the APK reads it from the profile). */
  looks: Readonly<Record<string, string>>;
}

/** What a 3D game receives from the factory. */
export interface Game3DContext {
  stage: Stage3D;
  hud: HudRoot;
  audio: AudioBus;
  /** Strings scoped to the game's catalog key (`manifest.briefingKey`'s first segment). */
  i18n: ScopedI18n;
  input: GameInput | StoryInput;
  edition: RuntimeEdition3D;
  seed: number;
  sessionMode: APKSessionMode;
  composition: Composition3D;
  options: SessionOptions;
  host: HostServices;
  /** Once per mount; later calls become a `warning` diagnostic (the APK completion latch). */
  complete(result: GameResults, outcome: GameTerminalOutcome, evidence: StoryGameEvidence): void;
  diagnostic(event: APKDiagnosticInput): void;
}

export interface Game3DInstance {
  /** After the briefing's Start tap (audio is unlocked by then). */
  start(): void;
  pause(): void;
  resume(): void;
  resize(width: number, height: number): void;
  recompose(composition: Composition3D): void;
  captureResponsiveState(): unknown;
  restoreResponsiveState(state: unknown): void;
  setMuted(muted: boolean): void;
  destroy(): Promise<void>;
  /** Test hook: the QC driver and the tutorial driver use it; production hosts do not. */
  readonly test: { state(): unknown; dispatch(command: unknown): void; tick(steps: number): void };
}

export interface ThreeCartridge {
  manifest: Cartridge3DManifest;
  /** The game's English catalog (merged by the host). */
  strings: Catalog;
  /** The start screen, from the game's catalog scope (the APK briefing contract). */
  briefing(i18n: ScopedI18n, input: GameInput | StoryInput): GameBriefing;
  createGame(context: Game3DContext): Promise<Game3DInstance>;
}

// ---------------------------------------------------------------- the APK boundary

/**
 * The APK's `APKGameInstance` (advantage-play-kit/src/runtime/types.ts, monorepo fe6aedc2b),
 * with `start` added for the standalone host: the APK starts a game when it mounts it.
 */
export interface MountedThreeGame {
  pause(): void;
  resume(): void;
  resize(width: number, height: number): void;
  captureResponsiveState(): unknown;
  restoreResponsiveState(state: unknown): void;
  recompose(composition: Composition3D): void;
  setMuted(muted: boolean): void;
  destroy(): Promise<void>;
  start(): void;
  readonly instance: Game3DInstance;
  readonly stage: Stage3D;
}

/** The device check result the factory needs (the kit gate returns more). */
export interface GateVerdict {
  status: 'ok' | 'lite' | 'unsupported';
  reason?: string;
  tier: QualityTierId;
}

/**
 * The APK's `GameFactoryContext` for a 3D cartridge. `i18n` and `audio` are page services that
 * the standalone host passes; in the APK the factory makes them from the host's locale and mute.
 */
export interface ThreeFactoryContext {
  container: HTMLElement;
  /**
   * The page's stage, when the host keeps one renderer for the whole page (the standalone host
   * does: phones limit WebGL contexts). The factory then draws into it, clears it on destroy, and
   * never disposes it. Without it, the factory makes its own canvas in `container`.
   */
  stage?: Stage3D;
  cartridge: ThreeCartridge;
  input: GameInput | StoryInput;
  edition: RuntimeEdition3D;
  seed: number;
  sessionMode: APKSessionMode;
  composition: Composition3D;
  i18n: ScopedI18n;
  audio: AudioBus;
  options: SessionOptions;
  host: HostServices;
  complete(result: GameResults, outcome: GameTerminalOutcome, evidence: StoryGameEvidence): void;
  diagnostic(event: APKDiagnosticInput): void;
}
