import { z } from 'zod';

export const FORGE_TEMPORAL_RENDER_ARTIFACTS_CONTRACT_ID =
  'forge-temporal-render-artifacts/v1' as const;
export const FORGE_TEMPORAL_RENDER_BATCH_ARTIFACTS_CONTRACT_ID =
  'forge-temporal-render-batch-artifacts/v1' as const;

const semanticId = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const revisionId = z.string().regex(/^revision\.[a-f0-9]{64}$/);
const morphologyRevisionId = z.string().regex(/^morphology\.[a-f0-9]{64}$/);
const rigSignature = z.string().regex(/^rig\.[a-f0-9]{64}$/);
const equipmentSignature = z.string().regex(/^equipment\.[a-f0-9]{64}$/);
const clipId = z.string().regex(/^clip\.[a-f0-9]{64}$/);
const framePlanId = z.string().regex(/^frame-plan\.[a-f0-9]{64}$/);
const deliveryId = z.string().regex(/^delivery\.[a-f0-9]{64}$/);
const direction = z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);
const DIRECTION_ORDER = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const pngFileName = z
  .string()
  .min(5)
  .max(240)
  .regex(/^[a-z0-9][a-z0-9._-]*\.png$/);
const glbFileName = z
  .string()
  .min(5)
  .max(240)
  .regex(/^[a-z0-9][a-z0-9._-]*\.glb$/);
const jsonFileName = z
  .string()
  .min(6)
  .max(240)
  .regex(/^[a-z0-9][a-z0-9._-]*\.json$/);

const temporalFrameSchema = z.strictObject({
  id: z.string().regex(/^frame\.[a-f0-9]{64}$/),
  sequence: z.number().int().nonnegative().max(2_047),
  direction,
  sampleTimeMs: z.number().int().nonnegative().max(60_000),
  fileName: pngFileName,
  byteLength: z
    .number()
    .int()
    .positive()
    .max(1024 * 1024),
  sha256,
  metrics: z.looseObject({
    groundAnchorDeviationPixels: z.number().finite().min(-1).max(1),
    clippedEdges: z.array(z.string()).max(4),
    framingEvidence: z.looseObject({
      topMarginPixels: z.number().finite().nullable(),
      centerDeviationPixels: z.number().finite().nullable(),
      worldUnitsPerPixel: z.number().finite().positive(),
    }),
  }),
});

const atlasRectSchema = z.strictObject({
  frameId: z.string().regex(/^frame\.[a-f0-9]{64}$/),
  x: z.number().int().nonnegative().max(16_383),
  y: z.number().int().nonnegative().max(16_383),
  width: z.literal(128),
  height: z.literal(128),
});

export const ForgeTemporalRenderArtifactsManifestSchema = z
  .strictObject({
    contractId: z.literal(FORGE_TEMPORAL_RENDER_ARTIFACTS_CONTRACT_ID),
    assetId: semanticId,
    revisionId,
    morphologyRevisionId,
    rigSignature,
    equipmentSignature,
    clipId,
    action: semanticId,
    framePlanId,
    durationMs: z.number().int().positive().max(60_000),
    loop: z.discriminatedUnion('mode', [
      z.strictObject({ mode: z.literal('once') }),
      z.strictObject({
        mode: z.literal('loop'),
        startMs: z.number().int().nonnegative().max(60_000),
        endMs: z.number().int().positive().max(60_000),
      }),
    ]),
    interpolation: z.enum(['step', 'linear']),
    renderProfile: z.strictObject({
      id: z.literal('fantasy.sprite.orthographic.v1'),
      version: z.literal('1.0.0'),
    }),
    sourceGlb: z.strictObject({
      id: z.string().regex(/^glb\.[a-f0-9]{64}$/),
      classification: z.literal('source'),
      mediaType: z.literal('model/gltf-binary'),
      fileName: glbFileName,
      byteLength: z
        .number()
        .int()
        .positive()
        .max(64 * 1024 * 1024),
      sha256,
    }),
    frames: z.array(temporalFrameSchema).min(2).max(2_048),
    atlas: z.strictObject({
      id: semanticId,
      fileName: pngFileName,
      byteLength: z
        .number()
        .int()
        .positive()
        .max(8 * 1024 * 1024),
      sha256,
      width: z.number().int().positive().max(16_384),
      height: z.number().int().positive().max(16_384),
      columns: z.number().int().positive().max(128),
      rows: z.number().int().positive().max(128),
      rects: z.array(atlasRectSchema).min(2).max(2_048),
    }),
    deliveryId,
  })
  .superRefine((manifest, context) => {
    if (
      manifest.loop.mode === 'loop' &&
      (manifest.loop.startMs >= manifest.loop.endMs ||
        manifest.loop.endMs > manifest.durationMs)
    )
      context.addIssue({
        code: 'custom',
        path: ['loop'],
        message:
          'Temporal loop bounds must be ordered within the clip duration.',
      });
    const frameIds = new Set<string>();
    const keys = new Set<string>();
    const hashesByDirection = new Map<string, Set<string>>();
    const scaleByDirection = new Map<string, number>();
    for (const [index, frame] of manifest.frames.entries()) {
      if (frame.sequence !== index)
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'sequence'],
          message: 'Temporal frame sequences must be contiguous.',
        });
      if (frameIds.has(frame.id))
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'id'],
          message: 'Temporal frame identities must be unique.',
        });
      frameIds.add(frame.id);
      const key = `${frame.direction}:${frame.sampleTimeMs}`;
      if (keys.has(key))
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'sampleTimeMs'],
          message: 'Temporal direction/time keys must be unique.',
        });
      keys.add(key);
      const hashes =
        hashesByDirection.get(frame.direction) ?? new Set<string>();
      hashes.add(frame.sha256);
      hashesByDirection.set(frame.direction, hashes);
      const scale = scaleByDirection.get(frame.direction);
      if (
        scale !== undefined &&
        scale !== frame.metrics.framingEvidence.worldUnitsPerPixel
      )
        context.addIssue({
          code: 'custom',
          path: [
            'frames',
            index,
            'metrics',
            'framingEvidence',
            'worldUnitsPerPixel',
          ],
          message:
            'Temporal frames in one direction must use a locked camera scale.',
        });
      scaleByDirection.set(
        frame.direction,
        frame.metrics.framingEvidence.worldUnitsPerPixel,
      );
      if (frame.metrics.clippedEdges.length > 0)
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'metrics', 'clippedEdges'],
          message: 'Temporal source frames must not clip occupied pixels.',
        });
    }
    for (const [frameDirection, hashes] of hashesByDirection)
      if (hashes.size < 2)
        context.addIssue({
          code: 'custom',
          path: ['frames'],
          message: `Direction ${frameDirection} requires at least two distinct rendered frame hashes.`,
        });
    if (manifest.atlas.rects.length !== manifest.frames.length)
      context.addIssue({
        code: 'custom',
        path: ['atlas', 'rects'],
        message: 'Atlas rectangles must cover every temporal source frame.',
      });
    for (const [index, rect] of manifest.atlas.rects.entries()) {
      if (!frameIds.has(rect.frameId))
        context.addIssue({
          code: 'custom',
          path: ['atlas', 'rects', index, 'frameId'],
          message: 'Atlas rectangle references an unknown temporal frame.',
        });
      if (
        rect.x + rect.width > manifest.atlas.width ||
        rect.y + rect.height > manifest.atlas.height
      )
        context.addIssue({
          code: 'custom',
          path: ['atlas', 'rects', index],
          message: 'Atlas rectangle exceeds the declared atlas bounds.',
        });
    }
  });

export type ForgeTemporalRenderArtifactsManifest = z.infer<
  typeof ForgeTemporalRenderArtifactsManifestSchema
>;

const batchTemporalFrameSchema = temporalFrameSchema.extend({
  clipId,
  action: semanticId,
  framePlanId,
});

const derivedImageSchema = z.strictObject({
  id: semanticId,
  classification: z.literal('derived'),
  role: z.enum(['pose_sheet', 'sprite_atlas']),
  mediaType: z.literal('image/png'),
  fileName: pngFileName,
  byteLength: z
    .number()
    .int()
    .positive()
    .max(8 * 1024 * 1024),
  sha256,
  width: z.number().int().positive().max(16_384),
  height: z.number().int().positive().max(16_384),
  columns: z.number().int().positive().max(128),
  rows: z.number().int().positive().max(128),
  rects: z.array(atlasRectSchema).min(2).max(2_048),
});

const batchClipSchema = (
  action: 'idle' | 'walk_forward' | 'walk_right' | 'attack' | 'receive_damage',
  samplesPerDirection: 4 | 6,
) =>
  z.strictObject({
    clipId,
    action: z.literal(action),
    framePlanId,
    durationMs: z.number().int().positive().max(60_000),
    loop: z.discriminatedUnion('mode', [
      z.strictObject({ mode: z.literal('once') }),
      z.strictObject({
        mode: z.literal('loop'),
        startMs: z.number().int().nonnegative().max(60_000),
        endMs: z.number().int().positive().max(60_000),
      }),
    ]),
    interpolation: z.enum(['step', 'linear']),
    directions: z
      .array(direction)
      .min(1)
      .max(8)
      .refine((values) => new Set(values).size === values.length, {
        message: 'Batch clip directions must be unique.',
      }),
    samplesPerDirection: z.literal(samplesPerDirection),
    frameIds: z
      .array(z.string().regex(/^frame\.[a-f0-9]{64}$/))
      .min(2)
      .max(2_048),
    poseSheetId: semanticId,
  });

export const ForgeTemporalRenderBatchArtifactsManifestSchema = z
  .strictObject({
    contractId: z.literal(FORGE_TEMPORAL_RENDER_BATCH_ARTIFACTS_CONTRACT_ID),
    authoringContractId: z.literal('forge-reference-five-clip-authoring/v1'),
    assetId: semanticId,
    revisionId,
    morphologyRevisionId,
    rigSignature,
    equipmentSignature,
    renderProfile: z.strictObject({
      id: z.literal('fantasy.sprite.orthographic.v1'),
      version: z.literal('1.0.0'),
    }),
    sourceGlb: z.strictObject({
      id: z.string().regex(/^glb\.[a-f0-9]{64}$/),
      classification: z.literal('source'),
      mediaType: z.literal('model/gltf-binary'),
      fileName: glbFileName,
      byteLength: z
        .number()
        .int()
        .positive()
        .max(64 * 1024 * 1024),
      sha256,
    }),
    animationBundle: z.strictObject({
      id: z.string().regex(/^bundle\.[a-f0-9]{64}$/),
      classification: z.literal('source'),
      mediaType: z.literal('application/json'),
      fileName: jsonFileName,
      byteLength: z
        .number()
        .int()
        .positive()
        .max(2 * 1024 * 1024),
      sha256,
    }),
    clips: z.tuple([
      batchClipSchema('idle', 4),
      batchClipSchema('walk_forward', 6),
      batchClipSchema('walk_right', 6),
      batchClipSchema('attack', 6),
      batchClipSchema('receive_damage', 4),
    ]),
    frames: z.array(batchTemporalFrameSchema).min(26).max(2_048),
    poseSheets: z.array(derivedImageSchema).length(5),
    atlas: derivedImageSchema,
    deliveryId,
  })
  .superRefine((manifest, context) => {
    if (manifest.atlas.role !== 'sprite_atlas')
      context.addIssue({
        code: 'custom',
        path: ['atlas', 'role'],
        message: 'The combined temporal batch image must be a sprite atlas.',
      });
    const frameIds = new Set<string>();
    const frameById = new Map<string, (typeof manifest.frames)[number]>();
    const keys = new Set<string>();
    const groups = new Map<string, (typeof manifest.frames)[number][]>();
    for (const [index, frame] of manifest.frames.entries()) {
      if (frame.sequence !== index)
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'sequence'],
          message: 'Batch frame sequences must be contiguous.',
        });
      if (frameIds.has(frame.id))
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'id'],
          message: 'Batch frame identities must be unique.',
        });
      frameIds.add(frame.id);
      frameById.set(frame.id, frame);
      const key = `${frame.clipId}:${frame.direction}:${frame.sampleTimeMs}`;
      if (keys.has(key))
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'sampleTimeMs'],
          message:
            'Batch clip, direction, and sample-time keys must be unique.',
        });
      keys.add(key);
      const groupKey = `${frame.clipId}:${frame.direction}`;
      const group = groups.get(groupKey) ?? [];
      group.push(frame);
      groups.set(groupKey, group);
      if (frame.metrics.clippedEdges.length > 0)
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'metrics', 'clippedEdges'],
          message:
            'Temporal batch source frames must not clip occupied pixels.',
        });
    }

    const sheetById = new Map(
      manifest.poseSheets.map((sheet) => [sheet.id, sheet]),
    );
    if (sheetById.size !== manifest.poseSheets.length)
      context.addIssue({
        code: 'custom',
        path: ['poseSheets'],
        message: 'Temporal batch pose-sheet identities must be unique.',
      });
    const clipIds = new Set<string>();
    const framePlanIds = new Set<string>();
    const expectedGlobalFrameIds: string[] = [];
    for (const [clipIndex, clip] of manifest.clips.entries()) {
      if (clipIds.has(clip.clipId))
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'clipId'],
          message: 'Temporal batch clip identities must be unique.',
        });
      clipIds.add(clip.clipId);
      if (framePlanIds.has(clip.framePlanId))
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'framePlanId'],
          message: 'Temporal batch frame-plan identities must be unique.',
        });
      framePlanIds.add(clip.framePlanId);
      const sortedDirections = [...clip.directions].sort(
        (left, right) =>
          DIRECTION_ORDER.indexOf(left) - DIRECTION_ORDER.indexOf(right),
      );
      if (
        clip.directions.some(
          (clipDirection, index) => clipDirection !== sortedDirections[index],
        )
      )
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'directions'],
          message: 'Batch clip directions must use canonical compass order.',
        });
      const clipFrames = manifest.frames.filter(
        (frame) => frame.clipId === clip.clipId,
      );
      if (
        clipFrames.some(
          (frame) =>
            frame.action !== clip.action ||
            frame.framePlanId !== clip.framePlanId,
        )
      )
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex],
          message:
            'Every batch frame must preserve its clip action and frame-plan identity.',
        });
      const directions = [
        ...new Set(clipFrames.map(({ direction }) => direction)),
      ];
      if (
        directions.length !== clip.directions.length ||
        directions.some((value, index) => value !== clip.directions[index])
      )
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'directions'],
          message:
            'Batch clip directions must exactly match its source frames.',
        });
      if (
        clipFrames.length !==
          clip.samplesPerDirection * clip.directions.length ||
        clip.frameIds.length !== clipFrames.length ||
        clip.frameIds.some((id, index) => id !== clipFrames[index]?.id)
      )
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'frameIds'],
          message:
            'Batch clip frame IDs must exactly cover every timed sample.',
        });
      for (const clipDirection of clip.directions) {
        const group = groups.get(`${clip.clipId}:${clipDirection}`) ?? [];
        expectedGlobalFrameIds.push(...group.map(({ id }) => id));
        if (
          group.length !== clip.samplesPerDirection ||
          new Set(group.map(({ sampleTimeMs }) => sampleTimeMs)).size !==
            clip.samplesPerDirection ||
          group.some(
            (frame, index) =>
              index > 0 && frame.sampleTimeMs <= group[index - 1]!.sampleTimeMs,
          ) ||
          new Set(group.map(({ sha256: digest }) => digest)).size !==
            clip.samplesPerDirection ||
          new Set(
            group.map(
              ({ metrics }) => metrics.framingEvidence.worldUnitsPerPixel,
            ),
          ).size !== 1
        )
          context.addIssue({
            code: 'custom',
            path: ['clips', clipIndex],
            message: `Clip ${clip.action} direction ${clipDirection} requires ${clip.samplesPerDirection} ordered, visually distinct timed frames at one locked camera scale.`,
          });
      }
      const sheet = sheetById.get(clip.poseSheetId);
      if (
        sheet === undefined ||
        sheet.role !== 'pose_sheet' ||
        sheet.columns !== clip.samplesPerDirection ||
        sheet.rows !== clip.directions.length ||
        sheet.width !== clip.samplesPerDirection * 128 ||
        sheet.height !== clip.directions.length * 128 ||
        sheet.rects.length !== clip.frameIds.length ||
        sheet.rects.some(
          (rect, index) =>
            rect.frameId !== clip.frameIds[index] ||
            rect.x !== (index % clip.samplesPerDirection) * 128 ||
            rect.y !== Math.floor(index / clip.samplesPerDirection) * 128,
        )
      )
        context.addIssue({
          code: 'custom',
          path: ['clips', clipIndex, 'poseSheetId'],
          message:
            'Each batch clip requires one exact ordered derived pose sheet.',
        });
    }

    if (
      expectedGlobalFrameIds.length !== manifest.frames.length ||
      expectedGlobalFrameIds.some(
        (id, index) => id !== manifest.frames[index]?.id,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['frames'],
        message:
          'Batch frames must use canonical action, direction, then ascending-time order.',
      });

    const knownClipIds = new Set(manifest.clips.map(({ clipId: id }) => id));
    for (const [index, frame] of manifest.frames.entries())
      if (!knownClipIds.has(frame.clipId))
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'clipId'],
          message: 'Batch frame references an unknown clip.',
        });
    if (
      manifest.atlas.columns !== Math.min(128, manifest.frames.length) ||
      manifest.atlas.rows !==
        Math.ceil(manifest.frames.length / manifest.atlas.columns) ||
      manifest.atlas.width !== manifest.atlas.columns * 128 ||
      manifest.atlas.height !== manifest.atlas.rows * 128 ||
      manifest.atlas.rects.length !== manifest.frames.length ||
      manifest.atlas.rects.some(
        (rect, index) =>
          rect.frameId !== manifest.frames[index]?.id ||
          rect.x !== (index % manifest.atlas.columns) * 128 ||
          rect.y !== Math.floor(index / manifest.atlas.columns) * 128,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['atlas', 'rects'],
        message:
          'Combined atlas rectangles must cover all batch frames in order.',
      });
    for (const [surfaceName, surface] of manifest.poseSheets.map(
      (sheet, index) => [`poseSheets.${index}`, sheet] as const,
    )) {
      if (
        surface.width !== surface.columns * 128 ||
        surface.height !== surface.rows * 128 ||
        surface.rects.some(
          (rect) =>
            !frameById.has(rect.frameId) ||
            rect.x + rect.width > surface.width ||
            rect.y + rect.height > surface.height,
        )
      )
        context.addIssue({
          code: 'custom',
          path: [surfaceName],
          message:
            'Temporal batch image layout is inconsistent or out of bounds.',
        });
    }
  });

export const ForgeTemporalArtifactsManifestSchema = z.union([
  ForgeTemporalRenderArtifactsManifestSchema,
  ForgeTemporalRenderBatchArtifactsManifestSchema,
]);

export type ForgeTemporalRenderBatchArtifactsManifest = z.infer<
  typeof ForgeTemporalRenderBatchArtifactsManifestSchema
>;
export type ForgeTemporalArtifactsManifest = z.infer<
  typeof ForgeTemporalArtifactsManifestSchema
>;
