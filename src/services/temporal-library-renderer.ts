import { z } from 'zod';

import {
  ClipLibraryRenderRequestSchema,
  verifyClipLibraryRenderRequestIdentity,
  type ClipLibraryRenderRequest,
} from '../contracts/clip-library-render-request.js';
import {
  TemporalLibraryDeliverySchema,
  verifyTemporalLibraryDeliveryIdentity,
} from '../contracts/temporal-library-delivery.js';

export interface TemporalLibraryFrameJob {
  readonly frameId: string;
  readonly clipId: string;
  readonly sampleTimeMs: number;
  readonly direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
}

export interface TemporalLibraryRenderPlan {
  readonly request: ClipLibraryRenderRequest;
  readonly jobs: readonly TemporalLibraryFrameJob[];
}

export interface TemporalLibraryEvaluation {
  readonly ok: boolean;
  readonly successfulResults: readonly {
    readonly clipId: string;
    readonly resultId: string;
  }[];
  readonly failedRequestIds: readonly string[];
}

export interface WarmTemporalLibrarySession {
  setupBridge(): Promise<void>;
  setupFraming(): Promise<void>;
  renderFrame(job: TemporalLibraryFrameJob): Promise<Uint8Array>;
  exportSourceGlb(): Promise<Uint8Array>;
  close(): Promise<void>;
}

export interface TemporalLibraryAtomicPublisher {
  stageFrame(frameId: string, bytes: Uint8Array): Promise<void>;
  stageSourceGlb(bytes: Uint8Array): Promise<void>;
  stageBundle(input: {
    readonly plan: TemporalLibraryRenderPlan;
    readonly frameBytes: readonly Uint8Array[];
    readonly sourceGlbBytes: Uint8Array;
  }): Promise<void>;
  stageManifest(input: {
    readonly requestId: string;
    readonly orderedFrameIds: readonly string[];
  }): Promise<{
    readonly deliveryId: string;
    readonly manifestBytes: Uint8Array;
  }>;
  commitManifest(): Promise<void>;
  abort(): Promise<void>;
}

export interface TemporalLibraryRenderDependencies {
  nowMilliseconds(): number;
  evaluate(plan: TemporalLibraryRenderPlan): Promise<TemporalLibraryEvaluation>;
  openWarmSession(): Promise<WarmTemporalLibrarySession>;
  openAtomicPublisher(
    requestId: string,
  ): Promise<TemporalLibraryAtomicPublisher>;
}

interface TemporalLibraryRenderTimings {
  readonly evaluationMilliseconds: number;
  readonly renderingMilliseconds: number;
  readonly publicationMilliseconds: number;
  readonly totalMilliseconds: number;
}

export type TemporalLibraryRenderResult =
  | {
      readonly status: 'partial';
      readonly complete: false;
      readonly successfulResultIds: readonly string[];
      readonly failedRequestIds: readonly string[];
    }
  | {
      readonly status: 'complete';
      readonly complete: true;
      readonly deliveryId: string;
      readonly manifestBytes: Uint8Array;
      readonly timings: TemporalLibraryRenderTimings;
    };

const TemporalLibraryRenderPlanSchema = z.strictObject({
  request: ClipLibraryRenderRequestSchema,
  jobs: z
    .array(
      z.strictObject({
        frameId: z.string().regex(/^frame\.[a-f0-9]{64}$/),
        clipId: z
          .string()
          .min(1)
          .max(160)
          .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/),
        sampleTimeMs: z.number().int().min(0).max(600_000),
        direction: z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']),
      }),
    )
    .min(1)
    .max(262_144),
});

async function validatePublication(
  publication: {
    readonly deliveryId: string;
    readonly manifestBytes: Uint8Array;
  },
  plan: TemporalLibraryRenderPlan,
) {
  let decoded: unknown;
  try {
    decoded = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(
        publication.manifestBytes,
      ),
    ) as unknown;
  } catch (error) {
    throw new Error(
      'Temporal-library manifest bytes are not valid UTF-8 JSON.',
      {
        cause: error,
      },
    );
  }
  const manifest = TemporalLibraryDeliverySchema.parse(decoded);
  if (
    manifest.deliveryId !== publication.deliveryId ||
    !(await verifyTemporalLibraryDeliveryIdentity(manifest)) ||
    manifest.renderRequest.requestId !== plan.request.requestId ||
    manifest.source.assetId !== plan.request.assetId ||
    manifest.source.revisionId !== plan.request.revisionId ||
    manifest.libraries.rig.id !== plan.request.rigProfileId ||
    manifest.libraries.pose.id !== plan.request.poseLibraryId ||
    manifest.libraries.clip.id !== plan.request.clipLibraryId ||
    manifest.renderRequest.seed !== plan.request.seed ||
    manifest.renderRequest.renderProfile.id !== plan.request.renderProfile.id ||
    manifest.renderRequest.renderProfile.version !==
      plan.request.renderProfile.version ||
    manifest.renderRequest.directions.length !==
      plan.request.directions.length ||
    manifest.renderRequest.directions.some(
      (direction, index) => direction !== plan.request.directions[index],
    ) ||
    manifest.frames.length !== plan.jobs.length ||
    manifest.frames.some((frame, index) => {
      const job = plan.jobs[index];
      return (
        job === undefined ||
        frame.id !== job.frameId ||
        frame.clipId !== job.clipId ||
        frame.sampleTimeMs !== job.sampleTimeMs ||
        frame.direction !== job.direction
      );
    })
  )
    throw new Error(
      'Temporal-library publication identity does not match its render plan.',
    );
  return publication;
}

export async function renderTemporalLibrary(
  plan: TemporalLibraryRenderPlan,
  dependencies: TemporalLibraryRenderDependencies,
): Promise<TemporalLibraryRenderResult> {
  const parsedPlan = TemporalLibraryRenderPlanSchema.parse(
    structuredClone(plan),
  );
  if (!(await verifyClipLibraryRenderRequestIdentity(parsedPlan.request)))
    throw new Error('Clip-library render request identity is stale.');
  const startedAt = dependencies.nowMilliseconds();
  const evaluation = await dependencies.evaluate(parsedPlan);
  const evaluatedAt = dependencies.nowMilliseconds();
  if (!evaluation.ok || evaluation.failedRequestIds.length > 0)
    return {
      status: 'partial',
      complete: false,
      successfulResultIds: evaluation.successfulResults.map(
        ({ resultId }) => resultId,
      ),
      failedRequestIds: [...evaluation.failedRequestIds],
    };

  const requestedClipIds = new Set(
    parsedPlan.request.requests.map(({ clipId }) => clipId),
  );
  if (
    evaluation.successfulResults.length !== requestedClipIds.size ||
    new Set(evaluation.successfulResults.map(({ clipId }) => clipId)).size !==
      requestedClipIds.size ||
    evaluation.successfulResults.some(
      ({ clipId }) => !requestedClipIds.has(clipId),
    )
  )
    throw new Error(
      'Complete evaluation must identify exactly one result per requested clip.',
    );
  const publisher = await dependencies.openAtomicPublisher(
    parsedPlan.request.requestId,
  );
  let session: WarmTemporalLibrarySession | undefined;
  try {
    session = await dependencies.openWarmSession();
    await session.setupBridge();
    await session.setupFraming();
    const frameBytes: Uint8Array[] = [];
    for (const job of parsedPlan.jobs) {
      const bytes = await session.renderFrame(job);
      frameBytes.push(bytes);
      await publisher.stageFrame(job.frameId, bytes);
    }
    const sourceGlbBytes = await session.exportSourceGlb();
    await publisher.stageSourceGlb(sourceGlbBytes);
    await publisher.stageBundle({
      plan: parsedPlan,
      frameBytes,
      sourceGlbBytes,
    });
    const publication = await validatePublication(
      await publisher.stageManifest({
        requestId: parsedPlan.request.requestId,
        orderedFrameIds: parsedPlan.jobs.map(({ frameId }) => frameId),
      }),
      parsedPlan,
    );
    const closingSession = session;
    session = undefined;
    await closingSession.close();
    const renderedAt = dependencies.nowMilliseconds();
    const completedAt = dependencies.nowMilliseconds();
    await publisher.commitManifest();
    return {
      status: 'complete',
      complete: true,
      ...publication,
      timings: {
        evaluationMilliseconds: evaluatedAt - startedAt,
        renderingMilliseconds: renderedAt - evaluatedAt,
        publicationMilliseconds: completedAt - renderedAt,
        totalMilliseconds: completedAt - startedAt,
      },
    };
  } catch (error) {
    const cleanupFailures: unknown[] = [];
    if (session !== undefined)
      try {
        await session.close();
      } catch (cleanupError) {
        cleanupFailures.push(cleanupError);
      }
    try {
      await publisher.abort();
    } catch (cleanupError) {
      cleanupFailures.push(cleanupError);
    }
    if (cleanupFailures.length > 0)
      throw new AggregateError(
        [error, ...cleanupFailures],
        'Temporal-library rendering and cleanup failed.',
        { cause: error },
      );
    throw error;
  }
}
