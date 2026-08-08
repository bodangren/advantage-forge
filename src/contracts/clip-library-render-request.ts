import { z } from 'zod';

import {
  ForgeDomainError,
  schemaDomainError,
  type ForgeDomainErrorPath,
} from './domain-error.js';

export const CLIP_LIBRARY_RENDER_REQUEST_CONTRACT_ID =
  'forge-clip-library-render-request/v1' as const;

export const CLIP_LIBRARY_RENDER_REQUEST_LIMITS = Object.freeze({
  maximumRequests: 64,
  maximumSamplesPerRequest: 4_096,
  maximumFramesPerSecond: 60,
} as const);

const SemanticIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const AssetRevisionIdSchema = z.string().regex(/^revision\.[a-f0-9]{64}$/);
const RigProfileIdSchema = z.string().regex(/^rig-v2\.[a-f0-9]{64}$/);
const PoseLibraryIdSchema = z.string().regex(/^pose-library\.[a-f0-9]{64}$/);
const ClipLibraryIdSchema = z.string().regex(/^clip-library\.[a-f0-9]{64}$/);
const RenderRequestIdSchema = z
  .string()
  .regex(/^render-request\.[a-f0-9]{64}$/);
const DirectionSchema = z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);

const FpsSamplingSchema = z.strictObject({
  mode: z.literal('fps'),
  framesPerSecond: z
    .number()
    .int()
    .min(1)
    .max(CLIP_LIBRARY_RENDER_REQUEST_LIMITS.maximumFramesPerSecond),
});

const ExplicitSamplingSchema = z
  .strictObject({
    mode: z.literal('times'),
    sampleTimesMs: z
      .array(z.number().int().min(0).max(600_000))
      .min(1)
      .max(CLIP_LIBRARY_RENDER_REQUEST_LIMITS.maximumSamplesPerRequest),
  })
  .superRefine(({ sampleTimesMs }, context) => {
    if (
      sampleTimesMs.some(
        (value, index) => index > 0 && value <= sampleTimesMs[index - 1]!,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['sampleTimesMs'],
        message:
          'Explicit sample times must be unique and strictly increasing.',
        params: { domainCode: 'COMPATIBILITY_MISMATCH' },
      });
  });

export const ClipLibraryRenderSamplingSchema = z.discriminatedUnion('mode', [
  FpsSamplingSchema,
  ExplicitSamplingSchema,
]);

export const ClipLibraryRenderItemSchema = z.strictObject({
  clipId: SemanticIdSchema,
  sampling: ClipLibraryRenderSamplingSchema,
});

const ClipLibraryRenderRequestPayloadBaseSchema = z
  .strictObject({
    contractId: z.literal(CLIP_LIBRARY_RENDER_REQUEST_CONTRACT_ID),
    assetId: SemanticIdSchema,
    revisionId: AssetRevisionIdSchema,
    rigProfileId: RigProfileIdSchema,
    poseLibraryId: PoseLibraryIdSchema,
    clipLibraryId: ClipLibraryIdSchema,
    renderProfile: z.strictObject({
      id: z.literal('fantasy.sprite.orthographic.v1'),
      version: z.literal('1.0.0'),
    }),
    seed: z.number().int().min(0).max(2_147_483_647),
    directions: z.array(DirectionSchema).min(1).max(8),
    requests: z
      .array(ClipLibraryRenderItemSchema)
      .min(1)
      .max(CLIP_LIBRARY_RENDER_REQUEST_LIMITS.maximumRequests),
  })
  .superRefine(({ directions, requests }, context) => {
    const seenDirections = new Set<string>();
    for (const [index, direction] of directions.entries()) {
      if (seenDirections.has(direction))
        context.addIssue({
          code: 'custom',
          path: ['directions', index],
          message: 'Render directions must be unique.',
          params: { domainCode: 'COMPATIBILITY_MISMATCH' },
        });
      seenDirections.add(direction);
    }
    const seenClips = new Set<string>();
    for (const [index, request] of requests.entries()) {
      if (seenClips.has(request.clipId))
        context.addIssue({
          code: 'custom',
          path: ['requests', index, 'clipId'],
          message: 'A render request may address each clip at most once.',
          params: { domainCode: 'COMPATIBILITY_MISMATCH' },
        });
      seenClips.add(request.clipId);
    }
  });

export const ClipLibraryRenderRequestPayloadSchema =
  ClipLibraryRenderRequestPayloadBaseSchema;
export const ClipLibraryRenderRequestSchema =
  ClipLibraryRenderRequestPayloadBaseSchema.extend({
    requestId: RenderRequestIdSchema,
  });

export type ClipLibraryRenderRequestPayload = z.input<
  typeof ClipLibraryRenderRequestPayloadSchema
>;
export type ClipLibraryRenderRequest = z.infer<
  typeof ClipLibraryRenderRequestSchema
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
  path: ForgeDomainErrorPath = ['renderRequest'],
): z.infer<typeof ClipLibraryRenderRequestPayloadSchema> {
  const result = ClipLibraryRenderRequestPayloadSchema.safeParse(value);
  if (result.success) return result.data;
  if (result.error.issues.some(({ code }) => code === 'too_big'))
    throw schemaDomainError(result.error, path);
  const compatibility = result.error.issues.find(
    (issue) =>
      issue.code === 'custom' &&
      issue.params?.['domainCode'] === 'COMPATIBILITY_MISMATCH',
  );
  if (compatibility !== undefined)
    throw new ForgeDomainError(
      'COMPATIBILITY_MISMATCH',
      [
        ...path,
        ...compatibility.path.map((segment) =>
          typeof segment === 'symbol'
            ? (segment.description ?? String(segment))
            : segment,
        ),
      ],
      compatibility.message,
      { cause: result.error },
    );
  throw schemaDomainError(result.error, path);
}

export function canonicalClipLibraryRenderRequestPayload(
  value: ClipLibraryRenderRequestPayload,
): string {
  return canonicalValue(parsePayload(value));
}

export async function createClipLibraryRenderRequest(
  value: ClipLibraryRenderRequestPayload,
): Promise<ClipLibraryRenderRequest> {
  const payload = parsePayload(value);
  return ClipLibraryRenderRequestSchema.parse({
    ...payload,
    requestId: `render-request.${await sha256(canonicalValue(payload))}`,
  });
}

export async function verifyClipLibraryRenderRequestIdentity(
  value: ClipLibraryRenderRequest,
): Promise<boolean> {
  try {
    const parsed = ClipLibraryRenderRequestSchema.parse(structuredClone(value));
    const { requestId, ...payload } = parsed;
    return (
      requestId ===
      `render-request.${await sha256(canonicalValue(parsePayload(payload)))}`
    );
  } catch {
    return false;
  }
}
