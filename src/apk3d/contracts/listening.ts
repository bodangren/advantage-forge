/**
 * The Read to Select Audio contracts a game and the demo host need: the session policy, the evidence
 * that the answer audio controller (src/apk3d/audio/answer-choice.ts) writes, and the result counts
 * that the evidence fixes.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------------------------
// Source: packages/game-contracts/src/listening.ts (primary-parity-integration 852619d5e), the parts
// that `readToSelectAudioEvidenceSchema` uses. The monorepo owns the shape: send a change there
// first. The port maps this file to a re-export of `@reading-advantage/game-contracts`.
// ---------------------------------------------------------------------------------------------

/** Maximum educational items in one current APK content response. */
export const MAX_LISTENING_SESSION_ITEMS = 50;

/** Maximum recorded question and clip pairs for four choices across 50 questions. */
export const MAX_ANSWER_AUDIO_EVIDENCE_PAIRS = MAX_LISTENING_SESSION_ITEMS * 4;

/** Explicit configuration for written Thai prompts with English audio answers. */
export const readToSelectAudioSessionConfigSchema = z
  .object({
    modality: z.literal('read-to-select-audio'),
    promptLocale: z.literal('th-TH'),
    answerLocale: z.literal('en-US'),
    promptField: z.literal('translation'),
    answerField: z.literal('term'),
    scored: z.boolean(),
  })
  .strict();

const itemPositionSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_LISTENING_SESSION_ITEMS - 1);

const answerAudioPlaybackResultSchema = z.enum(['completed', 'failed', 'cancelled']);

const answerAudioSelectionAttemptSchema = z
  .object({
    attemptIndex: z.number().int().min(0).max(MAX_ANSWER_AUDIO_EVIDENCE_PAIRS - 1),
    clipItemPosition: itemPositionSchema,
    playbackResult: answerAudioPlaybackResultSchema,
    submitted: z.boolean(),
    completedQuestion: z.boolean(),
  })
  .strict();

const answerAudioQuestionEvidenceSchema = z
  .object({
    questionPosition: itemPositionSchema,
    promptItemPosition: itemPositionSchema,
    selectionAttempts: z.array(answerAudioSelectionAttemptSchema).max(MAX_ANSWER_AUDIO_EVIDENCE_PAIRS),
  })
  .strict();

const answerAudioReplayCountSchema = z
  .object({
    questionPosition: itemPositionSchema,
    clipItemPosition: itemPositionSchema,
    count: z.number().int().min(1).max(MAX_LISTENING_SESSION_ITEMS),
  })
  .strict();

const answerAudioFailureSchema = z
  .object({
    questionPosition: itemPositionSchema,
    clipItemPosition: itemPositionSchema,
    code: z.enum(['load-failed', 'decode-failed', 'playback-failed']),
  })
  .strict();

function addQuestionClipPairIssues(
  values: readonly { questionPosition: number; clipItemPosition: number }[],
  itemCount: number,
  path: 'replayCounts' | 'audioFailures',
  context: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (value.questionPosition >= itemCount || value.clipItemPosition >= itemCount) {
      context.addIssue({
        code: 'custom',
        message: 'Question and clip positions must reference the current session',
        path: [path, index],
      });
    }
    const key = `${value.questionPosition}:${value.clipItemPosition}`;
    if (seen.has(key)) {
      context.addIssue({
        code: 'custom',
        message: 'Question and clip position pairs must be unique',
        path: [path, index],
      });
    }
    seen.add(key);
  });
}

/** Strict evidence for written Thai questions with English audio answer attempts. */
export const readToSelectAudioEvidenceSchema = z
  .object({
    schemaVersion: z.literal(1),
    declaredModality: z.literal('read-to-select-audio'),
    effectiveModality: z.literal('read-to-select-audio'),
    promptLocale: z.literal('th-TH'),
    answerLocale: z.literal('en-US'),
    promptField: z.literal('translation'),
    answerField: z.literal('term'),
    itemCount: z.number().int().min(1).max(MAX_LISTENING_SESSION_ITEMS),
    questions: z.array(answerAudioQuestionEvidenceSchema).max(MAX_LISTENING_SESSION_ITEMS),
    replayCounts: z.array(answerAudioReplayCountSchema).max(MAX_ANSWER_AUDIO_EVIDENCE_PAIRS),
    audioFailures: z.array(answerAudioFailureSchema).max(MAX_ANSWER_AUDIO_EVIDENCE_PAIRS),
  })
  .strict()
  .superRefine((evidence, context) => {
    const questionPositions = new Set<number>();
    let totalSelectionAttempts = 0;
    evidence.questions.forEach((question, questionIndex) => {
      if (question.questionPosition >= evidence.itemCount || question.promptItemPosition >= evidence.itemCount) {
        context.addIssue({
          code: 'custom',
          message: 'Question positions must reference the current session',
          path: ['questions', questionIndex],
        });
      }
      if (question.promptItemPosition !== question.questionPosition) {
        context.addIssue({
          code: 'custom',
          message: 'Prompt position must match the question position',
          path: ['questions', questionIndex, 'promptItemPosition'],
        });
      }
      if (questionPositions.has(question.questionPosition)) {
        context.addIssue({
          code: 'custom',
          message: 'Question positions must be unique',
          path: ['questions', questionIndex, 'questionPosition'],
        });
      }
      questionPositions.add(question.questionPosition);

      let questionCompleted = false;
      totalSelectionAttempts += question.selectionAttempts.length;
      question.selectionAttempts.forEach((attempt, attemptOffset) => {
        if (attempt.clipItemPosition >= evidence.itemCount) {
          context.addIssue({
            code: 'custom',
            message: 'Clip position must reference the current session',
            path: ['questions', questionIndex, 'selectionAttempts', attemptOffset, 'clipItemPosition'],
          });
        }
        if (attempt.attemptIndex !== attemptOffset) {
          context.addIssue({
            code: 'custom',
            message: 'Attempt indexes must follow playback order',
            path: ['questions', questionIndex, 'selectionAttempts', attemptOffset, 'attemptIndex'],
          });
        }
        if (questionCompleted) {
          context.addIssue({
            code: 'custom',
            message: 'A completed question cannot contain later attempts',
            path: ['questions', questionIndex, 'selectionAttempts', attemptOffset],
          });
        }
        if (attempt.submitted && attempt.playbackResult !== 'completed') {
          context.addIssue({
            code: 'custom',
            message: 'A submitted answer requires completed playback',
            path: ['questions', questionIndex, 'selectionAttempts', attemptOffset, 'submitted'],
          });
        }
        const completesQuestion = attempt.submitted
          && attempt.playbackResult === 'completed'
          && attempt.clipItemPosition === question.promptItemPosition;
        if (attempt.completedQuestion !== completesQuestion) {
          context.addIssue({
            code: 'custom',
            message: 'Question completion must identify the submitted matching clip',
            path: ['questions', questionIndex, 'selectionAttempts', attemptOffset, 'completedQuestion'],
          });
        }
        if (attempt.completedQuestion) questionCompleted = true;
      });
    });
    if (totalSelectionAttempts > MAX_ANSWER_AUDIO_EVIDENCE_PAIRS) {
      context.addIssue({
        code: 'custom',
        message: 'Selection attempt evidence exceeds the session limit',
        path: ['questions'],
      });
    }
    addQuestionClipPairIssues(evidence.replayCounts, evidence.itemCount, 'replayCounts', context);
    addQuestionClipPairIssues(evidence.audioFailures, evidence.itemCount, 'audioFailures', context);
  });

/** Configuration for written Thai prompts with English audio answers. */
export type ReadToSelectAudioSessionConfig = z.infer<typeof readToSelectAudioSessionConfigSchema>;

/** Evidence for written Thai questions with English audio answer attempts. */
export type ReadToSelectAudioEvidence = z.infer<typeof readToSelectAudioEvidenceSchema>;

/** Counts derived from validated answer-audio evidence. */
export type ReadToSelectAudioCompletionCounts = {
  readonly correctAnswers: number;
  readonly totalAttempts: number;
};

/**
 * Derives authoritative completion counts from valid answer-audio evidence.
 * @param evidence Untrusted learning evidence from completion metadata.
 * @returns Submitted and completed counts, or undefined for another modality or invalid evidence.
 */
export function getReadToSelectAudioCompletionCounts(
  evidence: unknown,
): ReadToSelectAudioCompletionCounts | undefined {
  const parsed = readToSelectAudioEvidenceSchema.safeParse(evidence);
  if (!parsed.success) return undefined;
  const attempts = parsed.data.questions.flatMap(({ selectionAttempts }) =>
    selectionAttempts).filter(({ submitted }) => submitted);
  return {
    correctAnswers: attempts.filter(({ completedQuestion }) => completedQuestion).length,
    totalAttempts: attempts.length,
  };
}
