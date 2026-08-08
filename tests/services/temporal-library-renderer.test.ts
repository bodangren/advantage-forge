import { describe, expect, it } from 'vitest';

import { createClipLibraryRenderRequest } from '../../src/contracts/clip-library-render-request.js';
import { createTemporalLibraryDelivery } from '../../src/contracts/temporal-library-delivery.js';
import {
  renderTemporalLibrary,
  type TemporalLibraryRenderDependencies,
  type TemporalLibraryRenderPlan,
} from '../../src/services/temporal-library-renderer.js';

const hex = (character: string) => character.repeat(64);
const firstFrameId = `frame.${hex('e')}`;
const secondFrameId = `frame.${hex('f')}`;

async function plan(): Promise<TemporalLibraryRenderPlan> {
  const request = await createClipLibraryRenderRequest({
    contractId: 'forge-clip-library-render-request/v1',
    assetId: 'guard.library',
    revisionId: `revision.${hex('1')}`,
    rigProfileId: `rig-v2.${hex('5')}`,
    poseLibraryId: `pose-library.${hex('7')}`,
    clipLibraryId: `clip-library.${hex('9')}`,
    renderProfile: {
      id: 'fantasy.sprite.orthographic.v1',
      version: '1.0.0',
    },
    seed: 42,
    directions: ['N'],
    requests: [
      {
        clipId: 'idle.loop',
        sampling: { mode: 'times', sampleTimesMs: [0, 500] },
      },
    ],
  });
  return {
    request,
    jobs: [
      {
        frameId: firstFrameId,
        clipId: 'idle.loop',
        sampleTimeMs: 0,
        direction: 'N',
      },
      {
        frameId: secondFrameId,
        clipId: 'idle.loop',
        sampleTimeMs: 500,
        direction: 'N',
      },
    ],
  };
}

async function publication(renderPlan: TemporalLibraryRenderPlan) {
  const delivery = await createTemporalLibraryDelivery({
    contractId: 'forge-temporal-library-delivery/v2',
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
      requestId: renderPlan.request.requestId,
      seed: 42,
      renderProfile: {
        id: 'fantasy.sprite.orthographic.v1',
        version: '1.0.0',
      },
      directions: ['N'],
    },
    admissions: { interchange: false, themePack: false, visualReview: false },
    clips: [
      {
        clipId: 'idle.loop',
        resultId: `clip-result.${hex('b')}`,
        framePlanId: `frame-plan.${hex('c')}`,
        durationMs: 500,
        playback: 'loop',
        interpolation: 'linear',
        rootAnchorPolicy: 'locked',
        loop: { startTimeMs: 0, endTimeMs: 500, seamPolicy: 'continuous' },
        keyframes: [
          { timeMs: 0, poseId: 'idle.a' },
          { timeMs: 500, poseId: 'idle.a' },
        ],
        continuityHooks: [],
        sampleTimesMs: [0, 500],
        frameIds: [firstFrameId, secondFrameId],
        sheetId: `sheet.${hex('d')}`,
      },
    ],
    frames: [
      {
        id: firstFrameId,
        sequence: 0,
        clipId: 'idle.loop',
        framePlanId: `frame-plan.${hex('c')}`,
        direction: 'N',
        sampleTimeMs: 0,
        terminal: false,
        fileName: 'frame-0000.png',
        byteLength: 1,
        sha256: hex('1'),
      },
      {
        id: secondFrameId,
        sequence: 1,
        clipId: 'idle.loop',
        framePlanId: `frame-plan.${hex('c')}`,
        direction: 'N',
        sampleTimeMs: 500,
        terminal: true,
        fileName: 'frame-0001.png',
        byteLength: 1,
        sha256: hex('2'),
      },
    ],
    sheets: [
      {
        id: `sheet.${hex('d')}`,
        clipId: 'idle.loop',
        fileName: 'idle-loop.png',
        byteLength: 2,
        sha256: hex('3'),
        width: 32,
        height: 16,
      },
    ],
    atlas: {
      id: `atlas.${hex('4')}`,
      fileName: 'atlas.png',
      metadataFileName: 'atlas.json',
      byteLength: 2,
      sha256: hex('5'),
      width: 32,
      height: 16,
      rects: [
        { frameId: firstFrameId, x: 0, y: 0, width: 16, height: 16 },
        { frameId: secondFrameId, x: 16, y: 0, width: 16, height: 16 },
      ],
    },
    bundle: {
      id: `bundle.${hex('6')}`,
      fileName: 'temporal-library.json',
      mediaType: 'application/json',
      byteLength: 3,
      sha256: hex('7'),
    },
    sourceGlb: {
      id: `glb.${hex('8')}`,
      fileName: 'source.glb',
      mediaType: 'model/gltf-binary',
      byteLength: 3,
      sha256: hex('9'),
    },
  });
  return {
    deliveryId: delivery.deliveryId,
    manifestBytes: new TextEncoder().encode(JSON.stringify(delivery)),
  };
}

async function dependencies(events: string[], times = [10, 20, 30, 40]) {
  let nowIndex = 0;
  const published = await publication(await plan());
  const dependencies: TemporalLibraryRenderDependencies = {
    nowMilliseconds: () => times[nowIndex++] ?? times.at(-1)!,
    evaluate: async () => ({
      ok: true,
      successfulResults: [
        {
          clipId: 'idle.loop',
          resultId: `clip-result.${'2'.repeat(64)}`,
        },
      ],
      failedRequestIds: [],
    }),
    openWarmSession: async () => {
      events.push('session:open');
      return {
        setupBridge: async () => {
          events.push('session:bridge');
        },
        setupFraming: async () => {
          events.push('session:framing');
        },
        renderFrame: async (job) => {
          events.push(`session:frame:${job.frameId}`);
          return new Uint8Array([job.sampleTimeMs === 0 ? 1 : 2]);
        },
        exportSourceGlb: async () => {
          events.push('session:glb');
          return new Uint8Array([3]);
        },
        close: async () => {
          events.push('session:close');
        },
      };
    },
    openAtomicPublisher: async () => ({
      stageFrame: async (frameId) => {
        events.push(`publish:frame:${frameId}`);
      },
      stageSourceGlb: async () => {
        events.push('publish:glb');
      },
      stageBundle: async () => {
        events.push('publish:bundle');
      },
      stageManifest: async () => {
        events.push('publish:manifest:stage');
        return published;
      },
      commitManifest: async () => {
        events.push('publish:manifest:commit');
      },
      abort: async () => {
        events.push('publish:abort');
      },
    }),
  };
  return dependencies;
}

describe('temporal library renderer orchestration', () => {
  it('uses one warm lifecycle, orders frames, exports one GLB, and publishes manifest last', async () => {
    const events: string[] = [];
    const result = await renderTemporalLibrary(
      await plan(),
      await dependencies(events),
    );

    expect(result.status).toBe('complete');
    expect(events).toEqual([
      'session:open',
      'session:bridge',
      'session:framing',
      `session:frame:${firstFrameId}`,
      `publish:frame:${firstFrameId}`,
      `session:frame:${secondFrameId}`,
      `publish:frame:${secondFrameId}`,
      'session:glb',
      'publish:glb',
      'publish:bundle',
      'publish:manifest:stage',
      'session:close',
      'publish:manifest:commit',
    ]);
  });

  it('returns resumable partial identity sets without opening or publishing', async () => {
    const events: string[] = [];
    const deps = await dependencies(events);
    deps.evaluate = async () => ({
      ok: false,
      successfulResults: [
        {
          clipId: 'idle.loop',
          resultId: `clip-result.${'2'.repeat(64)}`,
        },
      ],
      failedRequestIds: ['attack.once'],
    });
    const result = await renderTemporalLibrary(await plan(), deps);
    expect(result).toMatchObject({
      status: 'partial',
      complete: false,
      successfulResultIds: [`clip-result.${'2'.repeat(64)}`],
      failedRequestIds: ['attack.once'],
    });
    expect(events).toEqual([]);
  });

  it('keeps runtime timings outside deterministic manifest publication', async () => {
    const firstEvents: string[] = [];
    const secondEvents: string[] = [];
    const first = await renderTemporalLibrary(
      await plan(),
      await dependencies(firstEvents, [1, 2, 3, 4]),
    );
    const second = await renderTemporalLibrary(
      await plan(),
      await dependencies(secondEvents, [100, 300, 800, 1_300]),
    );
    expect(first.status).toBe('complete');
    expect(second.status).toBe('complete');
    if (first.status !== 'complete' || second.status !== 'complete')
      throw new Error('Fixture drift.');
    expect(first.deliveryId).toBe(second.deliveryId);
    expect(first.manifestBytes).toEqual(second.manifestBytes);
    expect(first.timings).not.toEqual(second.timings);
  });

  it('rejects invalid or path-bearing manifest bytes before atomic commit', async () => {
    const events: string[] = [];
    const deps = await dependencies(events);
    const renderPlan = await plan();
    const publisher = await deps.openAtomicPublisher(
      renderPlan.request.requestId,
    );
    deps.openAtomicPublisher = async () => ({
      ...publisher,
      stageManifest: async () => ({
        deliveryId: '/home/private',
        manifestBytes: new TextEncoder().encode('"/home/private"'),
      }),
    });
    await expect(renderTemporalLibrary(renderPlan, deps)).rejects.toBeDefined();
    expect(events).not.toContain('publish:manifest:commit');
    expect(events).toContain('publish:abort');
  });

  it('rejects a valid manifest whose capture tuple differs from the render plan', async () => {
    const events: string[] = [];
    const deps = await dependencies(events);
    const baseline = await plan();
    const mismatchedPlan: TemporalLibraryRenderPlan = {
      ...baseline,
      jobs: baseline.jobs.map((job, index) =>
        index === 0
          ? {
              ...job,
              clipId: 'attack.once',
              sampleTimeMs: 123,
              direction: 'E' as const,
            }
          : job,
      ),
    };
    await expect(
      renderTemporalLibrary(mismatchedPlan, deps),
    ).rejects.toBeDefined();
    expect(events).not.toContain('publish:manifest:commit');
    expect(events).toContain('publish:abort');
  });

  it('rejects full-request provenance mismatch and incomplete evaluation', async () => {
    const events: string[] = [];
    const deps = await dependencies(events);
    const baseline = await plan();
    const { requestId: _requestId, ...requestPayload } = baseline.request;
    void _requestId;
    const changed: TemporalLibraryRenderPlan = {
      ...baseline,
      request: await createClipLibraryRenderRequest({
        ...requestPayload,
        seed: requestPayload.seed + 1,
      }),
    };
    await expect(renderTemporalLibrary(changed, deps)).rejects.toBeDefined();
    expect(events).not.toContain('publish:manifest:commit');

    const incompleteEvents: string[] = [];
    const incomplete = await dependencies(incompleteEvents);
    incomplete.evaluate = async () => ({
      ok: true,
      successfulResults: [],
      failedRequestIds: [],
    });
    await expect(
      renderTemporalLibrary(await plan(), incomplete),
    ).rejects.toBeDefined();
    expect(incompleteEvents).toEqual([]);
  });

  it('aborts staged artifacts when the warm session cannot close', async () => {
    const events: string[] = [];
    const deps = await dependencies(events);
    const open = deps.openWarmSession.bind(deps);
    deps.openWarmSession = async () => ({
      ...(await open()),
      close: async () => {
        events.push('session:close:failed');
        throw new Error('CLOSE_FAILED');
      },
    });
    await expect(
      renderTemporalLibrary(await plan(), deps),
    ).rejects.toBeDefined();
    expect(events).not.toContain('publish:manifest:commit');
    expect(events).toContain('publish:abort');
  });
});
