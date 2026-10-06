/**
 * Read to Select Audio: a written Thai prompt and English answer choices that play as audio. The
 * host makes one controller per session (with its own clip, playback, and ducking ports) and passes
 * it as `answerAudio`; a game plays a choice, and submits it only after its clip played to the end.
 *
 * Source: packages/advantage-play-kit/src/audio/contracts.ts (the answer-choice parts) and
 * answer-choice-controller.ts (primary-parity-integration 6e890c307, with lane-g 677ade328: only a
 * completed play uses a replay). The monorepo owns both: send a change there first. The port maps
 * this file to a re-export of `@reading-advantage/advantage-play-kit`, and
 * tests/apk3d/answer-choice.test.ts is a copy of the monorepo controller test.
 */
import {
  MAX_LISTENING_SESSION_ITEMS,
  readToSelectAudioEvidenceSchema,
  readToSelectAudioSessionConfigSchema,
  type ReadToSelectAudioEvidence,
  type ReadToSelectAudioSessionConfig,
} from '../contracts/listening.js';

// ---------------------------------------------------------------- contracts

/** Stable failures exposed by shared listening playback. */
export type ListeningAudioFailureCode =
  | 'invalid-configuration'
  | 'invalid-item-position'
  | 'load-failed'
  | 'decode-failed'
  | 'playback-failed'
  | 'cancelled'
  | 'muted'
  | 'destroyed'
  | 'replay-limit'
  | 'scored-fallback-forbidden';

/** Structured failure raised by the shared listening controller. */
export class ListeningAudioControllerError extends Error {
  /**
   * Creates a structured listening audio failure.
   * @param code Stable machine-readable failure code.
   * @param message Safe failure description.
   * @param cause Original adapter failure when available.
   */
  constructor(
    public readonly code: ListeningAudioFailureCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ListeningAudioControllerError';
  }
}

/** Browser-safe URL reference for one indexed listening prompt. */
export interface ListeningAudioClipReference {
  /** Zero-based educational item position. */
  readonly itemPosition: number;
  /** Browser-safe prompt audio URL. */
  readonly url: string;
  /** Declared audio media type. */
  readonly mediaType: `audio/${string}`;
}

/** Provider-neutral preparation port for one prompt clip. */
export interface AudioClipPreparationPort<PreparedClip> {
  /**
   * Prepares one clip for playback.
   * @param reference Indexed URL clip reference.
   * @param signal Cancellation signal for stale or stopped work.
   * @returns Prepared provider-owned clip state.
   */
  prepare(
    reference: ListeningAudioClipReference,
    signal: AbortSignal,
  ): Promise<PreparedClip>;
  /**
   * Releases one prepared clip.
   * @param clip Provider-owned clip state.
   * @returns Nothing.
   */
  release(clip: PreparedClip): void;
}

/** Provider-neutral playback port for one prepared prompt. */
export interface AudioClipPlaybackPort<PreparedClip> {
  /**
   * Plays one prepared clip until completion or cancellation.
   * @param clip Prepared provider-owned clip state.
   * @param signal Cancellation signal for playback.
   * @returns A promise that resolves after playback ends.
   */
  play(clip: PreparedClip, signal: AbortSignal): Promise<void>;
}

/** Existing host audio adapter used during speech playback. */
export interface AudioDuckingPort {
  /**
   * Lowers background audio for speech.
   * @returns A callback that restores the prior audio state.
   */
  duck(): () => void;
}

/** Shared listening controller lifecycle state. */
export type ListeningAudioStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'destroyed';

/** Explicit failure information for the current prompt operation. */
export interface ListeningAudioFailure {
  /** Stable failure code. */
  readonly code: ListeningAudioFailureCode;
  /** Educational item position affected by the failure. */
  readonly itemPosition: number;
  /** Safe failure description. */
  readonly message: string;
}
/** Playback state for one question and answer clip pair. */
export interface AnswerChoicePlaybackSnapshot {
  /** Current Thai question position. */
  readonly questionPosition: number;
  /** English answer clip position. */
  readonly clipItemPosition: number;
  /** Latest playback lifecycle state for this pair. */
  readonly status: ListeningAudioStatus;
  /** Number of playback requests for this pair. */
  readonly playCount: number;
  /** Number of replay requests after the first request. */
  readonly replayCount: number;
  /** Whether a completed playback can be submitted. */
  readonly canConfirm: boolean;
  /** Whether the latest completed playback was submitted. */
  readonly submitted: boolean;
  /** Current failure when the latest request failed. */
  readonly failure?: Omit<ListeningAudioFailure, 'itemPosition'>;
}

/** Immutable state for Read to Select Audio UI. */
export interface AnswerChoiceAudioSnapshot {
  /** Current controller lifecycle state. */
  readonly status: ListeningAudioStatus;
  /** Current Thai question position. */
  readonly questionPosition?: number;
  /** Active English clip position. */
  readonly activeClipItemPosition?: number;
  /** Pair states for the current question. */
  readonly choices: readonly AnswerChoicePlaybackSnapshot[];
  /** Whether the host currently blocks answer audio. */
  readonly muted: boolean;
}

/** Submission recorded after one completed answer playback. */
export interface AnswerChoiceConfirmation {
  /** Current question position. */
  readonly questionPosition: number;
  /** Visible Thai prompt position. */
  readonly promptItemPosition: number;
  /** Submitted English clip position. */
  readonly clipItemPosition: number;
  /** Stable attempt position within this question. */
  readonly attemptIndex: number;
  /** Whether the submitted clip completes the question. */
  readonly completedQuestion: boolean;
}

/** Configuration for one Read to Select Audio controller. */
export interface AnswerChoiceAudioControllerOptions<PreparedClip> {
  /** Validated Read to Select Audio session policy. */
  readonly session: ReadToSelectAudioSessionConfig;
  /** Complete indexed English answer clip set. */
  readonly clips: readonly ListeningAudioClipReference[];
  /** Maximum preparation time in milliseconds. */
  readonly preparationTimeoutMs: number;
  /** Maximum playback time in milliseconds. */
  readonly playbackTimeoutMs?: number;
  /** Maximum replays for each question and clip pair. */
  readonly maxReplaysPerChoice?: number;
  /** Injected clip preparation port. */
  readonly preparation: AudioClipPreparationPort<PreparedClip>;
  /** Injected prepared-clip playback port. */
  readonly playback: AudioClipPlaybackPort<PreparedClip>;
  /** Existing host audio adapter used for background ducking. */
  readonly ducking: AudioDuckingPort;
}

/** Shared Read to Select Audio controller. */
export interface AnswerChoiceAudioController {
  /**
   * Selects the active Thai question and cancels stale playback.
   * @param questionPosition The active content position.
   * @param clipItemPositions The stable English choices for this question.
   * @returns The latest immutable controller state.
   */
  setQuestion(
    questionPosition: number,
    clipItemPositions?: readonly number[],
  ): AnswerChoiceAudioSnapshot;
  /**
   * Plays one English answer choice without submitting it.
   * @param questionPosition The active Thai question position.
   * @param clipItemPosition The English answer clip position.
   * @returns The state after playback completes or becomes stale.
   */
  playChoice(questionPosition: number, clipItemPosition: number): Promise<AnswerChoiceAudioSnapshot>;
  /**
   * Checks whether one completed pair can be submitted.
   * @param questionPosition The active Thai question position.
   * @param clipItemPosition The English answer clip position.
   * @returns Whether the latest completed playback is unsubmitted.
   */
  canConfirmChoice(questionPosition: number, clipItemPosition: number): boolean;
  /**
   * Records a deliberate submission after completed playback.
   * @param questionPosition The active Thai question position.
   * @param clipItemPosition The English answer clip position.
   * @returns The recorded submission identity and completion result.
   */
  confirmChoice(questionPosition: number, clipItemPosition: number): AnswerChoiceConfirmation;
  /**
   * Cancels active answer playback and records its cancelled result.
   * @returns Nothing.
   */
  cancel(): void;
  /**
   * Cancels active answer playback for a host pause.
   * @returns Nothing.
   */
  pause(): void;
  /**
   * Resets playback state and evidence for a replayed game.
   * @returns Nothing.
   */
  restart(): void;
  /**
   * Applies the host mute state and cancels active audio when muted.
   * @param muted Whether answer audio must remain silent.
   * @returns Nothing.
   */
  setMuted(muted: boolean): void;
  /**
   * Releases every owned clip and prevents later actions.
   * @returns Nothing.
   */
  destroy(): void;
  /**
   * Returns the latest immutable controller state.
   * @returns The current answer audio state.
   */
  getSnapshot(): AnswerChoiceAudioSnapshot;
  /**
   * Returns state for one question and clip pair.
   * @param questionPosition The active Thai question position.
   * @param clipItemPosition The English answer clip position.
   * @returns The current pair state.
   */
  getChoiceSnapshot(questionPosition: number, clipItemPosition: number): AnswerChoicePlaybackSnapshot;
  /**
   * Subscribes to playback state changes.
   * @param listener The observer called with immutable state.
   * @returns A callback that removes the observer.
   */
  subscribe(listener: (snapshot: AnswerChoiceAudioSnapshot) => void): () => void;
  /**
   * Returns validated Read to Select Audio evidence.
   * @returns The current session evidence.
   */
  getEvidence(): ReadToSelectAudioEvidence;
}

// ---------------------------------------------------------------- the controller

const MIN_TIMEOUT_MS = 100;
const MAX_PREPARATION_TIMEOUT_MS = 30_000;
const DEFAULT_PLAYBACK_TIMEOUT_MS = 30_000;
const MAX_PLAYBACK_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_REPLAYS_PER_CHOICE = 2;
const MAX_REPLAYS_PER_CHOICE = 5;
const MAX_CHOICES_PER_QUESTION = 8;

type PlaybackResult = 'completed' | 'failed' | 'cancelled';

type MutableAttempt = {
  attemptIndex: number;
  clipItemPosition: number;
  playbackResult: PlaybackResult;
  submitted: boolean;
  completedQuestion: boolean;
};

type MutableQuestion = {
  questionPosition: number;
  promptItemPosition: number;
  selectionAttempts: MutableAttempt[];
};

type PairState = {
  status: ListeningAudioStatus;
  playCount: number;
  replayCount: number;
  submitted: boolean;
  failure?: { code: ListeningAudioFailureCode; message: string };
};

type ActivePlayback = {
  questionPosition: number;
  clipItemPosition: number;
  attemptIndex: number;
  abort: AbortController;
  generation: number;
  replay: boolean;
};

const pairKey = (questionPosition: number, clipItemPosition: number): string =>
  `${questionPosition}:${clipItemPosition}`;

const controllerError = (
  error: unknown,
  code: ListeningAudioFailureCode,
  message: string,
): ListeningAudioControllerError => error instanceof ListeningAudioControllerError
  ? error
  : new ListeningAudioControllerError(code, message, error);

/**
 * Creates a shared controller for hidden English answer audio.
 * @param options Session, clips, playback ports, timeouts, and replay policy.
 * @returns A controller that requires completed playback before submission.
 * @throws When the session, clips, timeouts, or replay policy are invalid.
 */
export function createAnswerChoiceAudioController<PreparedClip>(
  options: AnswerChoiceAudioControllerOptions<PreparedClip>,
): AnswerChoiceAudioController {
  const session = readToSelectAudioSessionConfigSchema.parse(options.session);
  const playbackTimeoutMs = options.playbackTimeoutMs ?? DEFAULT_PLAYBACK_TIMEOUT_MS;
  const maxReplays = options.maxReplaysPerChoice ?? DEFAULT_MAX_REPLAYS_PER_CHOICE;
  if (!Number.isInteger(options.preparationTimeoutMs)
    || options.preparationTimeoutMs < MIN_TIMEOUT_MS
    || options.preparationTimeoutMs > MAX_PREPARATION_TIMEOUT_MS) {
    throw new ListeningAudioControllerError(
      'invalid-configuration',
      'Answer audio preparation timeout must be from 100 through 30000 milliseconds',
    );
  }
  if (!Number.isInteger(playbackTimeoutMs)
    || playbackTimeoutMs < MIN_TIMEOUT_MS
    || playbackTimeoutMs > MAX_PLAYBACK_TIMEOUT_MS) {
    throw new ListeningAudioControllerError(
      'invalid-configuration',
      'Answer audio playback timeout must be from 100 through 120000 milliseconds',
    );
  }
  if (!Number.isInteger(maxReplays) || maxReplays < 0 || maxReplays > MAX_REPLAYS_PER_CHOICE) {
    throw new ListeningAudioControllerError(
      'invalid-configuration',
      'Answer audio replay limit must be from zero through five',
    );
  }
  if (options.clips.length < 1 || options.clips.length > MAX_LISTENING_SESSION_ITEMS) {
    throw new ListeningAudioControllerError(
      'invalid-configuration',
      'Answer audio clips must contain from one through 50 items',
    );
  }

  const references = new Map<number, ListeningAudioClipReference>();
  for (const reference of options.clips) {
    if (!Number.isInteger(reference.itemPosition)
      || reference.itemPosition < 0
      || reference.itemPosition >= options.clips.length
      || references.has(reference.itemPosition)
      || !reference.url.trim()
      || !reference.mediaType.startsWith('audio/')) {
      throw new ListeningAudioControllerError(
        'invalid-configuration',
        'Answer audio clips must cover unique session item positions',
      );
    }
    references.set(reference.itemPosition, Object.freeze({ ...reference }));
  }
  if (references.size !== options.clips.length) {
    throw new ListeningAudioControllerError(
      'invalid-configuration',
      'Answer audio clips must cover every session item position',
    );
  }

  const prepared = new Map<number, PreparedClip>();
  const pairStates = new Map<string, PairState>();
  const questions = new Map<number, MutableQuestion>();
  const failures = new Map<string, 'load-failed' | 'decode-failed' | 'playback-failed'>();
  const listeners = new Set<(snapshot: AnswerChoiceAudioSnapshot) => void>();
  let activeQuestionPosition: number | undefined;
  let activePlayback: ActivePlayback | undefined;
  let restoreDucking: (() => void) | undefined;
  let generation = 0;
  let muted = false;
  let destroyed = false;
  let status: ListeningAudioStatus = 'idle';

  const assertActive = (): void => {
    if (destroyed) throw new ListeningAudioControllerError('destroyed', 'Answer audio is destroyed');
  };

  const referenceAt = (position: number): ListeningAudioClipReference => {
    assertActive();
    const reference = references.get(position);
    if (!reference) {
      throw new ListeningAudioControllerError(
        'invalid-item-position',
        'Answer audio position is outside this session',
      );
    }
    return reference;
  };

  const questionAt = (questionPosition: number): MutableQuestion => {
    referenceAt(questionPosition);
    let question = questions.get(questionPosition);
    if (!question) {
      question = { questionPosition, promptItemPosition: questionPosition, selectionAttempts: [] };
      questions.set(questionPosition, question);
    }
    return question;
  };

  const stateAt = (questionPosition: number, clipItemPosition: number): PairState => {
    const key = pairKey(questionPosition, clipItemPosition);
    let pair = pairStates.get(key);
    if (!pair) {
      pair = { status: 'idle', playCount: 0, replayCount: 0, submitted: false };
      pairStates.set(key, pair);
    }
    return pair;
  };

  // Only a completed play uses the replay budget, so a cancelled or failed play never locks a choice.
  const heard = (questionPosition: number, clipItemPosition: number): boolean =>
    questions.get(questionPosition)?.selectionAttempts.some((attempt) => (
      attempt.clipItemPosition === clipItemPosition && attempt.playbackResult === 'completed'
    )) ?? false;

  const canConfirm = (questionPosition: number, clipItemPosition: number): boolean => {
    if (destroyed || activeQuestionPosition !== questionPosition) return false;
    const pair = pairStates.get(pairKey(questionPosition, clipItemPosition));
    if (!pair || pair.status !== 'completed' || pair.submitted) return false;
    const attempts = questions.get(questionPosition)?.selectionAttempts ?? [];
    const attempt = [...attempts].reverse().find((candidate) => (
      candidate.clipItemPosition === clipItemPosition
      && candidate.playbackResult === 'completed'
    ));
    return attempt !== undefined && !attempt.submitted;
  };

  const choiceSnapshot = (
    questionPosition: number,
    clipItemPosition: number,
  ): AnswerChoicePlaybackSnapshot => {
    const pair = stateAt(questionPosition, clipItemPosition);
    return Object.freeze({
      questionPosition,
      clipItemPosition,
      status: pair.status,
      playCount: pair.playCount,
      replayCount: pair.replayCount,
      canConfirm: canConfirm(questionPosition, clipItemPosition),
      submitted: pair.submitted,
      ...(pair.failure ? { failure: Object.freeze({ ...pair.failure }) } : {}),
    });
  };

  const snapshot = (): AnswerChoiceAudioSnapshot => Object.freeze({
    status,
    ...(activeQuestionPosition === undefined ? {} : { questionPosition: activeQuestionPosition }),
    ...(activePlayback === undefined ? {} : { activeClipItemPosition: activePlayback.clipItemPosition }),
    choices: activeQuestionPosition === undefined
      ? Object.freeze([])
      : Object.freeze([...pairStates.keys()]
        .map((key) => key.split(':').map(Number))
        .filter(([question]) => question === activeQuestionPosition)
        .sort((left, right) => left[1]! - right[1]!)
        .map(([, clip]) => choiceSnapshot(activeQuestionPosition!, clip!))),
    muted,
  });

  const emit = (): AnswerChoiceAudioSnapshot => {
    const next = snapshot();
    for (const listener of listeners) {
      try {
        listener(next);
      } catch {
        // UI observers cannot interrupt playback or evidence updates.
      }
    }
    return next;
  };

  const restoreBackground = (): void => {
    const restore = restoreDucking;
    restoreDucking = undefined;
    restore?.();
  };

  const appendAttempt = (
    questionPosition: number,
    clipItemPosition: number,
    attemptIndex: number,
    playbackResult: PlaybackResult,
  ): MutableAttempt => {
    const attempt = {
      attemptIndex,
      clipItemPosition,
      playbackResult,
      submitted: false,
      completedQuestion: false,
    };
    questionAt(questionPosition).selectionAttempts.push(attempt);
    return attempt;
  };

  const cancelActive = (emitChange: boolean): void => {
    const active = activePlayback;
    if (!active) return;
    generation += 1;
    active.abort.abort();
    activePlayback = undefined;
    restoreBackground();
    appendAttempt(
      active.questionPosition,
      active.clipItemPosition,
      active.attemptIndex,
      'cancelled',
    );
    const pair = stateAt(active.questionPosition, active.clipItemPosition);
    if (active.replay) pair.replayCount -= 1;
    pair.status = 'cancelled';
    pair.submitted = false;
    delete pair.failure;
    status = 'cancelled';
    if (emitChange) emit();
  };

  const withTimeout = async <Value>(
    operation: Promise<Value>,
    abort: AbortController,
    timeoutMs: number,
    failureCode: 'load-failed' | 'playback-failed',
    message: string,
  ): Promise<Value> => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    try {
      return await Promise.race([
        operation,
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(() => {
            timedOut = true;
            abort.abort();
            reject(new ListeningAudioControllerError(failureCode, message));
          }, timeoutMs);
        }),
      ]);
    } catch (error) {
      if (timedOut) throw new ListeningAudioControllerError(failureCode, message, error);
      throw error;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  };

  const prepare = async (
    reference: ListeningAudioClipReference,
    abort: AbortController,
  ): Promise<PreparedClip> => {
    const existing = prepared.get(reference.itemPosition);
    if (existing) return existing;
    const preparation = options.preparation.prepare(reference, abort.signal).then((clip) => {
      if (!abort.signal.aborted) return clip;
      options.preparation.release(clip);
      throw new ListeningAudioControllerError('cancelled', 'Answer audio preparation was cancelled');
    });
    const clip = await withTimeout(
      preparation,
      abort,
      options.preparationTimeoutMs,
      'load-failed',
      'Answer audio preparation timed out',
    );
    if (abort.signal.aborted) {
      options.preparation.release(clip);
      throw new ListeningAudioControllerError('cancelled', 'Answer audio preparation was cancelled');
    }
    prepared.set(reference.itemPosition, clip);
    return clip;
  };

  const setQuestion = (
    questionPosition: number,
    clipItemPositions: readonly number[] = [],
  ): AnswerChoiceAudioSnapshot => {
    referenceAt(questionPosition);
    if (clipItemPositions.length > MAX_CHOICES_PER_QUESTION
      || new Set(clipItemPositions).size !== clipItemPositions.length) {
      throw new ListeningAudioControllerError(
        'invalid-configuration',
        'Answer audio choices must contain at most eight unique positions',
      );
    }
    for (const clipItemPosition of clipItemPositions) referenceAt(clipItemPosition);
    if (activeQuestionPosition !== questionPosition) {
      cancelActive(false);
      activeQuestionPosition = questionPosition;
      status = 'idle';
    }
    questionAt(questionPosition);
    for (const clipItemPosition of clipItemPositions) stateAt(questionPosition, clipItemPosition);
    return emit();
  };

  const playChoice = async (
    questionPosition: number,
    clipItemPosition: number,
  ): Promise<AnswerChoiceAudioSnapshot> => {
    const reference = referenceAt(clipItemPosition);
    setQuestion(questionPosition);
    if (muted) throw new ListeningAudioControllerError('muted', 'Answer audio is muted');
    if (questionAt(questionPosition).selectionAttempts.some((attempt) => attempt.completedQuestion)) {
      throw new ListeningAudioControllerError(
        'invalid-configuration',
        'A completed answer audio question cannot accept another attempt',
      );
    }
    const pair = stateAt(questionPosition, clipItemPosition);
    const replay = heard(questionPosition, clipItemPosition);
    if (replay && pair.replayCount >= maxReplays) {
      throw new ListeningAudioControllerError('replay-limit', 'Answer audio replay limit was reached');
    }
    cancelActive(false);
    const question = questionAt(questionPosition);
    const attemptIndex = question.selectionAttempts.length;
    const abort = new AbortController();
    const operationGeneration = ++generation;
    activePlayback = { questionPosition, clipItemPosition, attemptIndex, abort, generation: operationGeneration, replay };
    pair.replayCount += replay ? 1 : 0;
    pair.playCount += 1;
    pair.status = prepared.has(clipItemPosition) ? 'ready' : 'loading';
    pair.submitted = false;
    delete pair.failure;
    status = pair.status;
    emit();
    try {
      const clip = await prepare(reference, abort);
      if (destroyed || operationGeneration !== generation || abort.signal.aborted) return snapshot();
      pair.status = 'ready';
      status = 'ready';
      emit();
      pair.status = 'playing';
      status = 'playing';
      emit();
      restoreDucking = options.ducking.duck();
      await withTimeout(
        options.playback.play(clip, abort.signal),
        abort,
        playbackTimeoutMs,
        'playback-failed',
        'Answer audio playback timed out',
      );
      if (destroyed || operationGeneration !== generation || abort.signal.aborted) return snapshot();
      activePlayback = undefined;
      restoreBackground();
      appendAttempt(questionPosition, clipItemPosition, attemptIndex, 'completed');
      pair.status = 'completed';
      status = 'completed';
      return emit();
    } catch (error) {
      restoreBackground();
      if (destroyed || operationGeneration !== generation || abort.signal.aborted) return snapshot();
      activePlayback = undefined;
      const failure = controllerError(error, 'playback-failed', 'Answer audio playback failed');
      const failureCode = failure.code === 'load-failed' || failure.code === 'decode-failed'
        ? failure.code
        : 'playback-failed';
      failures.set(pairKey(questionPosition, clipItemPosition), failureCode);
      appendAttempt(questionPosition, clipItemPosition, attemptIndex, 'failed');
      if (replay) pair.replayCount -= 1;
      pair.status = 'failed';
      pair.failure = { code: failureCode, message: failure.message };
      status = 'failed';
      emit();
      throw failure;
    }
  };

  return Object.freeze({
    setQuestion,
    playChoice,
    canConfirmChoice(questionPosition: number, clipItemPosition: number): boolean {
      referenceAt(questionPosition);
      referenceAt(clipItemPosition);
      return canConfirm(questionPosition, clipItemPosition);
    },
    confirmChoice(questionPosition: number, clipItemPosition: number): AnswerChoiceConfirmation {
      referenceAt(questionPosition);
      referenceAt(clipItemPosition);
      if (!canConfirm(questionPosition, clipItemPosition)) {
        throw new ListeningAudioControllerError(
          'invalid-configuration',
          'Answer choice requires completed unsubmitted playback',
        );
      }
      const attempts = questionAt(questionPosition).selectionAttempts;
      const attempt = [...attempts].reverse().find((candidate) => (
        candidate.clipItemPosition === clipItemPosition
        && candidate.playbackResult === 'completed'
        && !candidate.submitted
      ));
      if (!attempt) throw new ListeningAudioControllerError('invalid-configuration', 'Answer attempt is unavailable');
      attempt.submitted = true;
      attempt.completedQuestion = clipItemPosition === questionPosition;
      const pair = stateAt(questionPosition, clipItemPosition);
      pair.submitted = true;
      emit();
      return Object.freeze({
        questionPosition,
        promptItemPosition: questionPosition,
        clipItemPosition,
        attemptIndex: attempt.attemptIndex,
        completedQuestion: attempt.completedQuestion,
      });
    },
    cancel(): void {
      assertActive();
      cancelActive(true);
    },
    pause(): void {
      assertActive();
      cancelActive(true);
    },
    restart(): void {
      assertActive();
      cancelActive(false);
      for (const clip of prepared.values()) options.preparation.release(clip);
      prepared.clear();
      pairStates.clear();
      questions.clear();
      failures.clear();
      activeQuestionPosition = undefined;
      status = 'idle';
      emit();
    },
    setMuted(nextMuted: boolean): void {
      assertActive();
      muted = nextMuted;
      if (muted) cancelActive(false);
      emit();
    },
    destroy(): void {
      if (destroyed) return;
      cancelActive(false);
      for (const clip of prepared.values()) options.preparation.release(clip);
      prepared.clear();
      destroyed = true;
      status = 'destroyed';
      emit();
      listeners.clear();
    },
    getSnapshot: snapshot,
    getChoiceSnapshot(questionPosition: number, clipItemPosition: number): AnswerChoicePlaybackSnapshot {
      referenceAt(questionPosition);
      referenceAt(clipItemPosition);
      return choiceSnapshot(questionPosition, clipItemPosition);
    },
    subscribe(listener: (next: AnswerChoiceAudioSnapshot) => void): () => void {
      assertActive();
      listeners.add(listener);
      try {
        listener(snapshot());
      } catch {
        // UI observers cannot interrupt controller ownership.
      }
      return () => listeners.delete(listener);
    },
    getEvidence(): ReadToSelectAudioEvidence {
      assertActive();
      const evidence = {
        schemaVersion: 1 as const,
        declaredModality: 'read-to-select-audio' as const,
        effectiveModality: 'read-to-select-audio' as const,
        promptLocale: session.promptLocale,
        answerLocale: session.answerLocale,
        promptField: session.promptField,
        answerField: session.answerField,
        itemCount: references.size,
        questions: [...questions.values()]
          .filter((question) => question.selectionAttempts.length > 0)
          .sort((left, right) => left.questionPosition - right.questionPosition)
          .map((question) => ({
            questionPosition: question.questionPosition,
            promptItemPosition: question.promptItemPosition,
            selectionAttempts: question.selectionAttempts.map((attempt) => ({ ...attempt })),
          })),
        replayCounts: [...pairStates.entries()]
          .filter(([, pair]) => pair.replayCount > 0)
          .map(([key, pair]) => {
            const [questionPosition, clipItemPosition] = key.split(':').map(Number) as [number, number];
            return { questionPosition, clipItemPosition, count: pair.replayCount };
          })
          .sort((left, right) => left.questionPosition - right.questionPosition
            || left.clipItemPosition - right.clipItemPosition),
        audioFailures: [...failures.entries()]
          .map(([key, code]) => {
            const [questionPosition, clipItemPosition] = key.split(':').map(Number) as [number, number];
            return { questionPosition, clipItemPosition, code };
          })
          .sort((left, right) => left.questionPosition - right.questionPosition
            || left.clipItemPosition - right.clipItemPosition),
      };
      return readToSelectAudioEvidenceSchema.parse(evidence);
    },
  });
}
