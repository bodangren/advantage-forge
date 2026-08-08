import { describe, expect, it } from 'vitest';

import {
  CLIP_LIBRARY_BUDGETS,
  ClipLibraryPayloadSchema,
  createClipLibrary,
  verifyClipLibraryIdentity,
  type ClipLibraryPayload,
} from '../../src/contracts/clip-library-v2.js';

const hex = (character: string) => character.repeat(64);

function payload(): ClipLibraryPayload {
  return {
    contractId: 'forge-clip-library/v1',
    binding: {
      assetRevisionId: `revision.${hex('1')}`,
      morphologyRevisionId: `morphology.${hex('2')}`,
      rigProfileId: `rig-v2.${hex('3')}`,
      poseLibraryId: `pose-library.${hex('4')}`,
      equipmentSignature: `equipment.${hex('5')}`,
    },
    clips: [
      {
        semanticId: 'idle.loop',
        durationMs: 1_000,
        playback: 'loop',
        interpolation: 'step',
        rootAnchorPolicy: 'locked',
        keyframes: [
          { timeMs: 0, poseId: 'idle.start' },
          { timeMs: 500, poseId: 'idle.accent' },
          { timeMs: 1_000, poseId: 'idle.start' },
        ],
        loop: {
          startTimeMs: 0,
          endTimeMs: 1_000,
          seamPolicy: 'continuous',
        },
        continuityHooks: [
          {
            kind: 'contact',
            atTimeMs: 500,
            contactId: 'foot.plant',
          },
          {
            kind: 'equipment',
            atTimeMs: 500,
            slotId: 'weapon.hand',
          },
        ],
      },
      {
        semanticId: 'wave.once',
        durationMs: 800,
        playback: 'once',
        interpolation: 'linear',
        rootAnchorPolicy: 'in_place',
        keyframes: [
          { timeMs: 0, poseId: 'wave.start' },
          { timeMs: 400, poseId: 'wave.peak' },
          { timeMs: 800, poseId: 'wave.end' },
        ],
        continuityHooks: [
          {
            kind: 'mirror',
            poseId: 'wave.start',
            mirrorPoseId: 'wave.end',
          },
        ],
      },
    ],
  };
}

describe('forge-clip-library/v1', () => {
  it('normalizes unordered clip and continuity-hook arrays without normalizing authored keyframes', async () => {
    const first = payload();
    const reordered = structuredClone(first);
    reordered.clips.reverse();
    reordered.clips
      .find(({ semanticId }) => semanticId === 'idle.loop')!
      .continuityHooks.reverse();

    const firstLibrary = await createClipLibrary(first);
    const reorderedLibrary = await createClipLibrary(reordered);
    expect(reorderedLibrary.libraryId).toBe(firstLibrary.libraryId);
    expect(await verifyClipLibraryIdentity(firstLibrary)).toBe(true);

    const authoredChange = structuredClone(first);
    authoredChange.clips[1]!.keyframes[1]!.poseId = 'wave.recovery';
    expect((await createClipLibrary(authoredChange)).libraryId).not.toBe(
      firstLibrary.libraryId,
    );

    const invalidOrder = structuredClone(first);
    invalidOrder.clips[1]!.keyframes.reverse();
    await expect(createClipLibrary(invalidOrder)).rejects.toMatchObject({
      code: 'COMPATIBILITY_MISMATCH',
      path: ['clipLibrary', 'clips', 1, 'keyframes'],
    });
  });

  it('requires once terminals and explicit valid half-open loop declarations', async () => {
    const missingTerminal = payload();
    missingTerminal.clips[1]!.keyframes.at(-1)!.timeMs = 799;
    await expect(createClipLibrary(missingTerminal)).rejects.toMatchObject({
      code: 'COMPATIBILITY_MISMATCH',
      path: ['clipLibrary', 'clips', 1, 'keyframes', 2, 'timeMs'],
    });

    const invalidLoop = payload();
    invalidLoop.clips[0]!.loop!.endTimeMs = 0;
    await expect(createClipLibrary(invalidLoop)).rejects.toMatchObject({
      code: 'COMPATIBILITY_MISMATCH',
      path: ['clipLibrary', 'clips', 0, 'loop', 'endTimeMs'],
    });
  });

  it('maps clip and keyframe budget overflow to stable structured errors', async () => {
    const overClips = payload();
    overClips.clips = Array.from(
      { length: CLIP_LIBRARY_BUDGETS.maximumClips + 1 },
      (_, index) => ({
        ...structuredClone(overClips.clips[1]!),
        semanticId: `once.${index}`,
      }),
    );
    await expect(createClipLibrary(overClips)).rejects.toMatchObject({
      code: 'BUDGET_EXCEEDED',
      path: ['clipLibrary', 'clips'],
    });

    const schemaResult = ClipLibraryPayloadSchema.safeParse(overClips);
    expect(schemaResult.success).toBe(false);

    const atKeyframeLimit = payload();
    atKeyframeLimit.clips = [
      {
        ...structuredClone(atKeyframeLimit.clips[1]!),
        semanticId: 'budget.exact',
        durationMs: CLIP_LIBRARY_BUDGETS.maximumKeyframesPerClip - 1,
        keyframes: Array.from(
          { length: CLIP_LIBRARY_BUDGETS.maximumKeyframesPerClip },
          (_, index) => ({ timeMs: index, poseId: `budget.pose.${index}` }),
        ),
        continuityHooks: [],
      },
    ];
    await expect(createClipLibrary(atKeyframeLimit)).resolves.toMatchObject({
      clips: [{ semanticId: 'budget.exact' }],
    });

    const overKeyframes = structuredClone(atKeyframeLimit);
    overKeyframes.clips[0]!.durationMs =
      CLIP_LIBRARY_BUDGETS.maximumKeyframesPerClip;
    overKeyframes.clips[0]!.keyframes.push({
      timeMs: CLIP_LIBRARY_BUDGETS.maximumKeyframesPerClip,
      poseId: 'budget.pose.overflow',
    });
    await expect(createClipLibrary(overKeyframes)).rejects.toMatchObject({
      code: 'BUDGET_EXCEEDED',
      path: ['clipLibrary', 'clips', 0, 'keyframes'],
    });

    const overBudgetAndMissingTerminal = structuredClone(overKeyframes);
    overBudgetAndMissingTerminal.clips[0]!.keyframes.at(-1)!.timeMs =
      CLIP_LIBRARY_BUDGETS.maximumKeyframesPerClip - 1;
    await expect(
      createClipLibrary(overBudgetAndMissingTerminal),
    ).rejects.toMatchObject({
      code: 'BUDGET_EXCEEDED',
      path: ['clipLibrary', 'clips', 0, 'keyframes'],
    });
  });
});
