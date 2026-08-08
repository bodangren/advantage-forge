import { describe, expect, it } from 'vitest';

import {
  TEMPORAL_LIBRARY_DELIVERY_CONTRACT_ID,
  createTemporalLibraryDelivery,
  verifyTemporalLibraryDeliveryIdentity,
  type TemporalLibraryDeliveryPayload,
} from '../../src/contracts/temporal-library-delivery.js';

const hex = (character: string) => character.repeat(64);

function payload(): TemporalLibraryDeliveryPayload {
  return {
    contractId: TEMPORAL_LIBRARY_DELIVERY_CONTRACT_ID,
    source: {
      assetId: 'guard.library',
      revisionId: `revision.${hex('1')}`,
      assemblySignature: `assembly.${hex('2')}`,
      morphologyRevisionId: `morphology.${hex('3')}`,
      equipmentSignature: `equipment.${hex('4')}`,
    },
    libraries: {
      rig: { id: `rig-v2.${hex('5')}`, recordDigest: hex('6') },
      pose: { id: `pose-library.${hex('7')}`, recordDigest: hex('8') },
      clip: { id: `clip-library.${hex('9')}`, recordDigest: hex('a') },
    },
    renderRequest: {
      requestId: `render-request.${hex('b')}`,
      seed: 42,
      renderProfile: {
        id: 'fantasy.sprite.orthographic.v1',
        version: '1.0.0',
      },
      directions: ['N'],
    },
    admissions: {
      interchange: false,
      themePack: false,
      visualReview: false,
    },
    clips: [
      {
        clipId: 'idle.loop',
        resultId: `clip-result.${hex('c')}`,
        framePlanId: `frame-plan.${hex('d')}`,
        durationMs: 500,
        playback: 'loop',
        interpolation: 'linear',
        rootAnchorPolicy: 'locked',
        loop: {
          startTimeMs: 0,
          endTimeMs: 500,
          seamPolicy: 'continuous',
        },
        keyframes: [
          { timeMs: 0, poseId: 'idle.a' },
          { timeMs: 500, poseId: 'idle.a' },
        ],
        continuityHooks: [],
        sampleTimesMs: [0, 250, 500],
        frameIds: [
          `frame.${hex('e')}`,
          `frame.${hex('f')}`,
          `frame.${hex('0')}`,
        ],
        sheetId: `sheet.${hex('1')}`,
      },
    ],
    frames: [
      {
        id: `frame.${hex('e')}`,
        sequence: 0,
        clipId: 'idle.loop',
        framePlanId: `frame-plan.${hex('d')}`,
        direction: 'N',
        sampleTimeMs: 0,
        terminal: false,
        fileName: 'frame-0000.png',
        byteLength: 101,
        sha256: hex('2'),
      },
      {
        id: `frame.${hex('f')}`,
        sequence: 1,
        clipId: 'idle.loop',
        framePlanId: `frame-plan.${hex('d')}`,
        direction: 'N',
        sampleTimeMs: 250,
        terminal: false,
        fileName: 'frame-0001.png',
        byteLength: 102,
        sha256: hex('3'),
      },
      {
        id: `frame.${hex('0')}`,
        sequence: 2,
        clipId: 'idle.loop',
        framePlanId: `frame-plan.${hex('d')}`,
        direction: 'N',
        sampleTimeMs: 500,
        terminal: true,
        fileName: 'frame-0002.png',
        byteLength: 103,
        sha256: hex('4'),
      },
    ],
    sheets: [
      {
        id: `sheet.${hex('1')}`,
        clipId: 'idle.loop',
        fileName: 'idle-loop.png',
        byteLength: 306,
        sha256: hex('5'),
        width: 48,
        height: 16,
      },
    ],
    atlas: {
      id: `atlas.${hex('6')}`,
      fileName: 'atlas.png',
      metadataFileName: 'atlas.json',
      byteLength: 306,
      sha256: hex('7'),
      width: 48,
      height: 16,
      rects: [
        { frameId: `frame.${hex('e')}`, x: 0, y: 0, width: 16, height: 16 },
        { frameId: `frame.${hex('f')}`, x: 16, y: 0, width: 16, height: 16 },
        { frameId: `frame.${hex('0')}`, x: 32, y: 0, width: 16, height: 16 },
      ],
    },
    bundle: {
      id: `bundle.${hex('8')}`,
      fileName: 'temporal-library.json',
      mediaType: 'application/json',
      byteLength: 500,
      sha256: hex('9'),
    },
    sourceGlb: {
      id: `glb.${hex('a')}`,
      fileName: 'source.glb',
      mediaType: 'model/gltf-binary',
      byteLength: 400,
      sha256: hex('b'),
    },
  };
}

describe('forge-temporal-library-delivery/v2', () => {
  it('derives and verifies one immutable delivery identity', async () => {
    const delivery = await createTemporalLibraryDelivery(payload());
    expect(delivery.deliveryId).toMatch(/^delivery\.[a-f0-9]{64}$/);
    expect(await verifyTemporalLibraryDeliveryIdentity(delivery)).toBe(true);

    delivery.frames[0]!.sha256 = hex('c');
    expect(await verifyTemporalLibraryDeliveryIdentity(delivery)).toBe(false);
  });

  it('requires exact clip, frame-plan, sheet, and atlas relationships', async () => {
    const mismatched = payload();
    mismatched.clips[0]!.frameIds = [mismatched.frames[0]!.id];
    await expect(
      createTemporalLibraryDelivery(mismatched),
    ).rejects.toMatchObject({
      code: 'COMPATIBILITY_MISMATCH',
      path: ['delivery', 'clips', 0, 'frameIds'],
    });

    const outOfBounds = payload();
    outOfBounds.atlas.rects[0]!.x = outOfBounds.atlas.width;
    await expect(
      createTemporalLibraryDelivery(outOfBounds),
    ).rejects.toMatchObject({
      code: 'COMPATIBILITY_MISMATCH',
      path: ['delivery', 'atlas', 'rects'],
    });
  });

  it('rejects orphan global frames and sheets', async () => {
    const orphanFrame = payload();
    orphanFrame.frames[0]!.clipId = 'orphan.clip';
    await expect(
      createTemporalLibraryDelivery(orphanFrame),
    ).rejects.toMatchObject({ code: 'COMPATIBILITY_MISMATCH' });

    const orphanSheet = payload();
    orphanSheet.sheets[0]!.clipId = 'orphan.clip';
    await expect(
      createTemporalLibraryDelivery(orphanSheet),
    ).rejects.toMatchObject({ code: 'COMPATIBILITY_MISMATCH' });
  });

  it('requires an exact ordered direction by sample capture plan', async () => {
    const mismatched = payload();
    mismatched.frames[1]!.sampleTimeMs = 300;
    await expect(
      createTemporalLibraryDelivery(mismatched),
    ).rejects.toMatchObject({
      code: 'COMPATIBILITY_MISMATCH',
      path: ['delivery', 'clips', 0, 'sampleTimesMs'],
    });

    const foreignDirection = payload();
    foreignDirection.frames[0]!.direction = 'E';
    await expect(
      createTemporalLibraryDelivery(foreignDirection),
    ).rejects.toMatchObject({
      code: 'COMPATIBILITY_MISMATCH',
      path: ['delivery', 'clips', 0, 'sampleTimesMs'],
    });
  });

  it('is unadmitted by contract and rejects non-portable artifact names', async () => {
    const admitted = payload();
    (admitted.admissions as { themePack: boolean }).themePack = true;
    await expect(createTemporalLibraryDelivery(admitted)).rejects.toMatchObject(
      {
        path: ['delivery', 'admissions', 'themePack'],
      },
    );

    const escaped = payload();
    escaped.frames[0]!.fileName = '../frame.png';
    await expect(createTemporalLibraryDelivery(escaped)).rejects.toMatchObject({
      path: ['delivery', 'frames', 0, 'fileName'],
    });
  });
});
