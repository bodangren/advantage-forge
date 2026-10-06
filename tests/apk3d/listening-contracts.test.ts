/**
 * The Read to Select Audio contracts: a copy of the "Read to Select Audio contracts" cases of the
 * monorepo test (game-contracts src/__tests__/listening.test.ts, primary-parity-integration 852619d5e)
 * on the Forge copy. The cases that need schemas Forge does not copy (the learning evidence union, the
 * completion input) check the same rule through `getReadToSelectAudioCompletionCounts`.
 */
import { describe, expect, it } from 'vitest';

import {
  MAX_ANSWER_AUDIO_EVIDENCE_PAIRS,
  getReadToSelectAudioCompletionCounts,
  readToSelectAudioEvidenceSchema,
  readToSelectAudioSessionConfigSchema,
} from '../../src/apk3d/contracts/index.js';

const answerAudioSession = {
  modality: 'read-to-select-audio',
  promptLocale: 'th-TH',
  answerLocale: 'en-US',
  promptField: 'translation',
  answerField: 'term',
  scored: true,
} as const;

const answerAudioEvidence = {
  schemaVersion: 1,
  declaredModality: 'read-to-select-audio',
  effectiveModality: 'read-to-select-audio',
  promptLocale: 'th-TH',
  answerLocale: 'en-US',
  promptField: 'translation',
  answerField: 'term',
  itemCount: 3,
  questions: [{
    questionPosition: 0,
    promptItemPosition: 0,
    selectionAttempts: [
      {
        attemptIndex: 0,
        clipItemPosition: 1,
        playbackResult: 'completed',
        submitted: true,
        completedQuestion: false,
      },
      {
        attemptIndex: 1,
        clipItemPosition: 0,
        playbackResult: 'completed',
        submitted: true,
        completedQuestion: true,
      },
    ],
  }],
  replayCounts: [{ questionPosition: 0, clipItemPosition: 1, count: 1 }],
  audioFailures: [{ questionPosition: 0, clipItemPosition: 2, code: 'playback-failed' }],
} as const;

describe('Read to Select Audio contracts', () => {
  it('accepts the fixed Thai prompt and English answer configuration', () => {
    expect(readToSelectAudioSessionConfigSchema.parse(answerAudioSession)).toEqual(answerAudioSession);
  });

  it('records ordered wrong and correct submissions for one question', () => {
    expect(readToSelectAudioEvidenceSchema.parse(answerAudioEvidence)).toEqual(answerAudioEvidence);
  });

  it.each([
    ['duplicate question', {
      ...answerAudioEvidence,
      questions: [answerAudioEvidence.questions[0], answerAudioEvidence.questions[0]],
    }],
    ['mismatched prompt position', {
      ...answerAudioEvidence,
      questions: [{ ...answerAudioEvidence.questions[0], promptItemPosition: 1 }],
    }],
    ['duplicate attempt index', {
      ...answerAudioEvidence,
      questions: [{
        ...answerAudioEvidence.questions[0],
        selectionAttempts: [
          answerAudioEvidence.questions[0].selectionAttempts[0],
          { ...answerAudioEvidence.questions[0].selectionAttempts[1], attemptIndex: 0 },
        ],
      }],
    }],
    ['out-of-range clip', {
      ...answerAudioEvidence,
      questions: [{
        ...answerAudioEvidence.questions[0],
        selectionAttempts: [{
          ...answerAudioEvidence.questions[0].selectionAttempts[0], clipItemPosition: 3,
        }],
      }],
    }],
    ['submitted failed playback', {
      ...answerAudioEvidence,
      questions: [{
        ...answerAudioEvidence.questions[0],
        selectionAttempts: [{
          ...answerAudioEvidence.questions[0].selectionAttempts[0], playbackResult: 'failed',
        }],
      }],
    }],
    ['false matching completion', {
      ...answerAudioEvidence,
      questions: [{
        ...answerAudioEvidence.questions[0],
        selectionAttempts: [{
          ...answerAudioEvidence.questions[0].selectionAttempts[1], completedQuestion: false,
        }],
      }],
    }],
    ['duplicate replay pair', {
      ...answerAudioEvidence,
      replayCounts: [
        answerAudioEvidence.replayCounts[0],
        { ...answerAudioEvidence.replayCounts[0], count: 2 },
      ],
    }],
    ['out-of-range failure pair', {
      ...answerAudioEvidence,
      audioFailures: [{ ...answerAudioEvidence.audioFailures[0], questionPosition: 3 }],
    }],
    ['attempt after question completion', {
      ...answerAudioEvidence,
      questions: [{
        ...answerAudioEvidence.questions[0],
        selectionAttempts: [
          { ...answerAudioEvidence.questions[0].selectionAttempts[1], attemptIndex: 0 },
          { ...answerAudioEvidence.questions[0].selectionAttempts[0], attemptIndex: 1 },
        ],
      }],
    }],
  ])('rejects %s', (_label, candidate) => {
    expect(readToSelectAudioEvidenceSchema.safeParse(candidate).success).toBe(false);
  });

  it('accepts 200 distinct question and clip replay pairs', () => {
    const replayCounts = Array.from(
      { length: MAX_ANSWER_AUDIO_EVIDENCE_PAIRS },
      (_, index) => ({
        questionPosition: Math.floor(index / 4),
        clipItemPosition: index % 4,
        count: 1,
      }),
    );
    expect(readToSelectAudioEvidenceSchema.safeParse({
      ...answerAudioEvidence,
      itemCount: 50,
      replayCounts,
      audioFailures: [],
    }).success).toBe(true);
  });

  it('rejects more than 200 selection attempts across question records', () => {
    const questions = Array.from({ length: 5 }, (_, questionPosition) => ({
      questionPosition,
      promptItemPosition: questionPosition,
      selectionAttempts: Array.from({ length: 41 }, (_unused, attemptIndex) => ({
        attemptIndex,
        clipItemPosition: (questionPosition + 1) % 5,
        playbackResult: 'completed' as const,
        submitted: false,
        completedQuestion: false,
      })),
    }));
    expect(readToSelectAudioEvidenceSchema.safeParse({
      ...answerAudioEvidence,
      itemCount: 5,
      questions,
      replayCounts: [],
      audioFailures: [],
    }).success).toBe(false);
  });

  it('checks answer counts against submitted and completed evidence', () => {
    expect(getReadToSelectAudioCompletionCounts(answerAudioEvidence)).toEqual({ correctAnswers: 1, totalAttempts: 2 });
    expect(getReadToSelectAudioCompletionCounts({ ...answerAudioEvidence, itemCount: 0 })).toBeUndefined();
  });
});
