import { z } from 'zod';

import {
  ForgeDomainError,
  schemaDomainError,
  type ForgeDomainErrorPath,
} from './domain-error.js';

export const TEMPORAL_LIBRARY_DELIVERY_CONTRACT_ID =
  'forge-temporal-library-delivery/v2' as const;

const SemanticIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const DigestSchema = z.string().regex(/^[a-f0-9]{64}$/);
const namedDigest = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}\\.[a-f0-9]{64}$`));
const PortableFileNameSchema = z
  .string()
  .min(1)
  .max(240)
  .regex(/^(?!\.{1,2}$)(?!.*[\\/]).+$/)
  .refine(
    (value) => [...value].every((character) => character.charCodeAt(0) >= 32),
    'Artifact file names cannot contain control characters.',
  );
const DirectionSchema = z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);

const ArtifactSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*\.[a-f0-9]{64}$/),
  fileName: PortableFileNameSchema,
  byteLength: z.number().int().min(1),
  sha256: DigestSchema,
});

const ClipSchema = z.strictObject({
  clipId: SemanticIdSchema,
  resultId: namedDigest('clip-result'),
  framePlanId: namedDigest('frame-plan'),
  durationMs: z.number().int().min(1).max(600_000),
  playback: z.enum(['once', 'loop']),
  interpolation: z.enum(['linear', 'step']),
  rootAnchorPolicy: z.enum([
    'locked',
    'in_place',
    'authored_translation',
    'authored_translation_and_yaw',
  ]),
  loop: z
    .strictObject({
      startTimeMs: z.number().int().min(0),
      endTimeMs: z.number().int().min(1),
      seamPolicy: z.enum(['continuous', 'intentional_jump']),
      discontinuityReason: z.string().min(1).max(1_000).optional(),
    })
    .optional(),
  keyframes: z
    .array(
      z.strictObject({
        timeMs: z.number().int().min(0),
        poseId: SemanticIdSchema,
      }),
    )
    .min(1)
    .max(1_024),
  continuityHooks: z.array(z.unknown()).max(256),
  sampleTimesMs: z
    .array(z.number().int().min(0).max(600_000))
    .min(1)
    .max(4_096),
  frameIds: z.array(namedDigest('frame')).min(1).max(32_768),
  sheetId: namedDigest('sheet'),
});

const FrameSchema = z.strictObject({
  id: namedDigest('frame'),
  sequence: z.number().int().min(0),
  clipId: SemanticIdSchema,
  framePlanId: namedDigest('frame-plan'),
  direction: DirectionSchema,
  sampleTimeMs: z.number().int().min(0).max(600_000),
  terminal: z.boolean(),
  fileName: PortableFileNameSchema,
  byteLength: z.number().int().min(1),
  sha256: DigestSchema,
});

const TemporalLibraryDeliveryPayloadBaseSchema = z.strictObject({
  contractId: z.literal(TEMPORAL_LIBRARY_DELIVERY_CONTRACT_ID),
  source: z.strictObject({
    assetId: SemanticIdSchema,
    revisionId: namedDigest('revision'),
    assemblySignature: namedDigest('assembly'),
    morphologyRevisionId: namedDigest('morphology'),
    equipmentSignature: namedDigest('equipment'),
  }),
  libraries: z.strictObject({
    rig: z.strictObject({
      id: namedDigest('rig-v2'),
      recordDigest: DigestSchema,
    }),
    pose: z.strictObject({
      id: namedDigest('pose-library'),
      recordDigest: DigestSchema,
    }),
    clip: z.strictObject({
      id: namedDigest('clip-library'),
      recordDigest: DigestSchema,
    }),
  }),
  renderRequest: z.strictObject({
    requestId: namedDigest('render-request'),
    seed: z.number().int().min(0).max(2_147_483_647),
    renderProfile: z.strictObject({
      id: z.literal('fantasy.sprite.orthographic.v1'),
      version: z.literal('1.0.0'),
    }),
    directions: z.array(DirectionSchema).min(1).max(8),
  }),
  admissions: z.strictObject({
    interchange: z.literal(false),
    themePack: z.literal(false),
    visualReview: z.literal(false),
  }),
  clips: z.array(ClipSchema).min(1).max(64),
  frames: z.array(FrameSchema).min(1).max(262_144),
  sheets: z
    .array(
      ArtifactSchema.extend({
        id: namedDigest('sheet'),
        clipId: SemanticIdSchema,
        width: z.number().int().min(1),
        height: z.number().int().min(1),
      }),
    )
    .min(1)
    .max(64),
  atlas: ArtifactSchema.extend({
    id: namedDigest('atlas'),
    metadataFileName: PortableFileNameSchema,
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    rects: z
      .array(
        z.strictObject({
          frameId: namedDigest('frame'),
          x: z.number().int().min(0),
          y: z.number().int().min(0),
          width: z.number().int().min(1),
          height: z.number().int().min(1),
        }),
      )
      .min(1)
      .max(262_144),
  }),
  bundle: ArtifactSchema.extend({
    id: namedDigest('bundle'),
    mediaType: z.literal('application/json'),
  }),
  sourceGlb: ArtifactSchema.extend({
    id: namedDigest('glb'),
    mediaType: z.literal('model/gltf-binary'),
  }),
});

function compatibilityIssue(
  context: z.RefinementCtx,
  path: (string | number)[],
  message: string,
) {
  context.addIssue({
    code: 'custom',
    path,
    message,
    params: { domainCode: 'COMPATIBILITY_MISMATCH' },
  });
}

function unique(
  values: readonly string[],
  context: z.RefinementCtx,
  path: (string | number)[],
) {
  if (new Set(values).size !== values.length)
    compatibilityIssue(context, path, 'Identified entries must be unique.');
}

function validatePayload(
  value: z.infer<typeof TemporalLibraryDeliveryPayloadBaseSchema>,
  context: z.RefinementCtx,
) {
  unique(value.renderRequest.directions, context, [
    'renderRequest',
    'directions',
  ]);
  unique(
    value.clips.map(({ clipId }) => clipId),
    context,
    ['clips'],
  );
  unique(
    value.clips.map(({ resultId }) => resultId),
    context,
    ['clips'],
  );
  unique(
    value.clips.map(({ framePlanId }) => framePlanId),
    context,
    ['clips'],
  );
  unique(
    value.frames.map(({ id }) => id),
    context,
    ['frames'],
  );
  unique(
    value.sheets.map(({ id }) => id),
    context,
    ['sheets'],
  );

  for (const [index, frame] of value.frames.entries())
    if (frame.sequence !== index)
      compatibilityIssue(
        context,
        ['frames', index, 'sequence'],
        'Frame sequence must be contiguous and authored in delivery order.',
      );

  for (const [index, clip] of value.clips.entries()) {
    if (
      clip.sampleTimesMs.some(
        (sampleTimeMs, sampleIndex) =>
          sampleTimeMs > clip.durationMs ||
          (sampleIndex > 0 &&
            sampleTimeMs <= clip.sampleTimesMs[sampleIndex - 1]!),
      )
    )
      compatibilityIssue(
        context,
        ['clips', index, 'sampleTimesMs'],
        'Clip sample times must be unique, strictly increasing, and within duration.',
      );
    if (
      clip.keyframes.some(
        ({ timeMs }, keyframeIndex) =>
          timeMs > clip.durationMs ||
          (keyframeIndex > 0 &&
            timeMs <= clip.keyframes[keyframeIndex - 1]!.timeMs),
      ) ||
      clip.keyframes[0]?.timeMs !== 0 ||
      clip.keyframes.at(-1)?.timeMs !== clip.durationMs
    )
      compatibilityIssue(
        context,
        ['clips', index, 'keyframes'],
        'Clip keyframes must be strictly ordered from zero through the explicit terminal sample.',
      );
    if (
      (clip.playback === 'loop' && clip.loop === undefined) ||
      (clip.playback === 'once' && clip.loop !== undefined) ||
      (clip.loop !== undefined &&
        (clip.loop.startTimeMs >= clip.loop.endTimeMs ||
          clip.loop.endTimeMs > clip.durationMs))
    )
      compatibilityIssue(
        context,
        ['clips', index, 'loop'],
        'Loop declarations must agree with playback and remain half-open inside duration.',
      );
    const frames = value.frames.filter(({ clipId }) => clipId === clip.clipId);
    if (
      frames.length !== clip.frameIds.length ||
      frames.some(({ id }, frameIndex) => id !== clip.frameIds[frameIndex])
    )
      compatibilityIssue(
        context,
        ['clips', index, 'frameIds'],
        'Clip frame IDs must exactly match the ordered global frame slice.',
      );
    if (frames.some(({ framePlanId }) => framePlanId !== clip.framePlanId))
      compatibilityIssue(
        context,
        ['clips', index, 'framePlanId'],
        'Every clip frame must bind the owning frame-plan identity.',
      );
    const expectedCaptures = value.renderRequest.directions.flatMap(
      (direction) =>
        clip.sampleTimesMs.map((sampleTimeMs) => ({
          direction,
          sampleTimeMs,
          terminal: sampleTimeMs === clip.durationMs,
        })),
    );
    if (
      frames.length !== expectedCaptures.length ||
      frames.some((frame, frameIndex) => {
        const expected = expectedCaptures[frameIndex];
        return (
          expected === undefined ||
          frame.direction !== expected.direction ||
          frame.sampleTimeMs !== expected.sampleTimeMs ||
          frame.terminal !== expected.terminal
        );
      })
    )
      compatibilityIssue(
        context,
        ['clips', index, 'sampleTimesMs'],
        'Frames must exactly cover every requested direction and sample in canonical order.',
      );
    if (
      !value.sheets.some(
        ({ id, clipId }) => id === clip.sheetId && clipId === clip.clipId,
      )
    )
      compatibilityIssue(
        context,
        ['clips', index, 'sheetId'],
        'Every clip must bind one matching sheet.',
      );
    const terminal = new Set(
      frames
        .filter(({ terminal }) => terminal)
        .map(({ sampleTimeMs }) => sampleTimeMs),
    );
    if (!terminal.has(clip.durationMs))
      compatibilityIssue(
        context,
        ['clips', index, 'sampleTimesMs'],
        'Every clip render must preserve its explicit terminal sample.',
      );
  }

  const orderedClipFrameIds = value.clips.flatMap(({ frameIds }) => frameIds);
  if (
    orderedClipFrameIds.length !== value.frames.length ||
    orderedClipFrameIds.some(
      (frameId, index) => frameId !== value.frames[index]?.id,
    )
  )
    compatibilityIssue(
      context,
      ['frames'],
      'Global frames must be the exact ordered concatenation of clip frame slices.',
    );
  if (
    value.sheets.length !== value.clips.length ||
    value.sheets.some(
      (sheet, index) =>
        sheet.id !== value.clips[index]?.sheetId ||
        sheet.clipId !== value.clips[index]?.clipId,
    )
  )
    compatibilityIssue(
      context,
      ['sheets'],
      'Sheets must match clips exactly once in canonical clip order.',
    );

  const frameIds = value.frames.map(({ id }) => id);
  if (
    value.atlas.rects.length !== frameIds.length ||
    value.atlas.rects.some(({ frameId }, index) => frameId !== frameIds[index])
  )
    compatibilityIssue(
      context,
      ['atlas', 'rects'],
      'Atlas rectangles must exactly match ordered delivery frames.',
    );
  const firstRect = value.atlas.rects[0];
  if (
    firstRect === undefined ||
    value.atlas.rects.some(
      ({ x, y, width, height }) =>
        width !== firstRect.width ||
        height !== firstRect.height ||
        x % width !== 0 ||
        y % height !== 0 ||
        x + width > value.atlas.width ||
        y + height > value.atlas.height,
    ) ||
    new Set(value.atlas.rects.map(({ x, y }) => `${x}:${y}`)).size !==
      value.atlas.rects.length
  )
    compatibilityIssue(
      context,
      ['atlas', 'rects'],
      'Atlas rectangles must be uniform, grid-aligned, in bounds, and non-overlapping.',
    );

  const fileNames = [
    ...value.frames.map(({ fileName }) => fileName),
    ...value.sheets.map(({ fileName }) => fileName),
    value.atlas.fileName,
    value.atlas.metadataFileName,
    value.bundle.fileName,
    value.sourceGlb.fileName,
  ];
  if (new Set(fileNames).size !== fileNames.length)
    compatibilityIssue(
      context,
      ['frames'],
      'Every delivered artifact file name must be unique.',
    );
}

export const TemporalLibraryDeliveryPayloadSchema =
  TemporalLibraryDeliveryPayloadBaseSchema.superRefine(validatePayload);
export const TemporalLibraryDeliverySchema =
  TemporalLibraryDeliveryPayloadBaseSchema.extend({
    deliveryId: namedDigest('delivery'),
  }).superRefine(validatePayload);

export type TemporalLibraryDeliveryPayload = z.input<
  typeof TemporalLibraryDeliveryPayloadSchema
>;
export type TemporalLibraryDelivery = z.infer<
  typeof TemporalLibraryDeliverySchema
>;

function canonicalValue(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalValue(entry)).join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalValue(entry)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function parsePayload(
  value: unknown,
  path: ForgeDomainErrorPath = ['delivery'],
) {
  const result = TemporalLibraryDeliveryPayloadSchema.safeParse(value);
  if (result.success) return result.data;
  const compatibility = result.error.issues.find(
    (issue) =>
      issue.code === 'custom' &&
      issue.params?.['domainCode'] === 'COMPATIBILITY_MISMATCH',
  );
  if (compatibility !== undefined)
    throw new ForgeDomainError(
      'COMPATIBILITY_MISMATCH',
      [...path, ...compatibility.path] as ForgeDomainErrorPath,
      compatibility.message,
      { cause: result.error },
    );
  throw schemaDomainError(result.error, path);
}

export async function createTemporalLibraryDelivery(
  value: TemporalLibraryDeliveryPayload,
): Promise<TemporalLibraryDelivery> {
  const payload = parsePayload(value);
  return TemporalLibraryDeliverySchema.parse({
    ...payload,
    deliveryId: `delivery.${await sha256(canonicalValue(payload))}`,
  });
}

export async function verifyTemporalLibraryDeliveryIdentity(
  value: TemporalLibraryDelivery,
): Promise<boolean> {
  try {
    const parsed = TemporalLibraryDeliverySchema.parse(structuredClone(value));
    const { deliveryId, ...payload } = parsed;
    return (
      deliveryId ===
      `delivery.${await sha256(canonicalValue(parsePayload(payload)))}`
    );
  } catch {
    return false;
  }
}
