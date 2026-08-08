import { describe, expect, it } from 'vitest';

import {
  CLIP_LIBRARY_RENDER_REQUEST_CONTRACT_ID,
  CLIP_LIBRARY_RENDER_REQUEST_LIMITS,
  createClipLibraryRenderRequest,
  verifyClipLibraryRenderRequestIdentity,
  type ClipLibraryRenderRequestPayload,
} from '../../src/contracts/clip-library-render-request.js';

const hex = (character: string) => character.repeat(64);

function payload(): ClipLibraryRenderRequestPayload {
  return {
    contractId: CLIP_LIBRARY_RENDER_REQUEST_CONTRACT_ID,
    assetId: 'guard.library',
    revisionId: `revision.${hex('1')}`,
    rigProfileId: `rig-v2.${hex('2')}`,
    poseLibraryId: `pose-library.${hex('3')}`,
    clipLibraryId: `clip-library.${hex('4')}`,
    renderProfile: {
      id: 'fantasy.sprite.orthographic.v1',
      version: '1.0.0',
    },
    seed: 42,
    directions: ['N', 'E'],
    requests: [
      {
        clipId: 'idle.loop',
        sampling: { mode: 'fps', framesPerSecond: 8 },
      },
      {
        clipId: 'attack.once',
        sampling: { mode: 'times', sampleTimesMs: [0, 250, 500] },
      },
    ],
  };
}

describe('forge-clip-library-render-request/v1', () => {
  it('derives one immutable request identity and preserves authored batch order', async () => {
    const first = await createClipLibraryRenderRequest(payload());
    expect(first.requestId).toMatch(/^render-request\.[a-f0-9]{64}$/);
    expect(await verifyClipLibraryRenderRequestIdentity(first)).toBe(true);

    const reordered = payload();
    reordered.requests.reverse();
    expect(
      (await createClipLibraryRenderRequest(reordered)).requestId,
    ).not.toBe(first.requestId);

    const changedSeed = payload();
    changedSeed.seed = 43;
    expect(
      (await createClipLibraryRenderRequest(changedSeed)).requestId,
    ).not.toBe(first.requestId);
  });

  it('requires unique clips, directions, and strictly increasing explicit samples', async () => {
    const duplicateClip = payload();
    duplicateClip.requests[1]!.clipId = 'idle.loop';
    await expect(
      createClipLibraryRenderRequest(duplicateClip),
    ).rejects.toMatchObject({
      code: 'COMPATIBILITY_MISMATCH',
      path: ['renderRequest', 'requests', 1, 'clipId'],
    });

    const duplicateDirection = payload();
    duplicateDirection.directions = ['N', 'N'];
    await expect(
      createClipLibraryRenderRequest(duplicateDirection),
    ).rejects.toMatchObject({
      code: 'COMPATIBILITY_MISMATCH',
      path: ['renderRequest', 'directions', 1],
    });

    const unorderedTimes = payload();
    const sampling = unorderedTimes.requests[1]!.sampling;
    if (sampling.mode !== 'times') throw new Error('Fixture drift.');
    sampling.sampleTimesMs = [0, 500, 250];
    await expect(
      createClipLibraryRenderRequest(unorderedTimes),
    ).rejects.toMatchObject({
      code: 'COMPATIBILITY_MISMATCH',
      path: ['renderRequest', 'requests', 1, 'sampling', 'sampleTimesMs'],
    });
  });

  it('maps plus-one batch and sample counts to stable budget errors', async () => {
    const overRequests = payload();
    overRequests.requests = Array.from(
      { length: CLIP_LIBRARY_RENDER_REQUEST_LIMITS.maximumRequests + 1 },
      (_, index) => ({
        clipId: `clip.${index}`,
        sampling: { mode: 'fps' as const, framesPerSecond: 8 },
      }),
    );
    await expect(
      createClipLibraryRenderRequest(overRequests),
    ).rejects.toMatchObject({
      code: 'BUDGET_EXCEEDED',
      path: ['renderRequest', 'requests'],
    });

    const overSamples = payload();
    overSamples.requests[1]!.sampling = {
      mode: 'times',
      sampleTimesMs: Array.from(
        {
          length:
            CLIP_LIBRARY_RENDER_REQUEST_LIMITS.maximumSamplesPerRequest + 1,
        },
        (_, index) => index,
      ),
    };
    await expect(
      createClipLibraryRenderRequest(overSamples),
    ).rejects.toMatchObject({
      code: 'BUDGET_EXCEEDED',
      path: ['renderRequest', 'requests', 1, 'sampling', 'sampleTimesMs'],
    });
  });
});
