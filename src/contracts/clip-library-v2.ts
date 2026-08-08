import { z } from 'zod';

import {
  ForgeDomainError,
  schemaDomainError,
  type ForgeDomainErrorPath,
} from './domain-error.js';

export const CLIP_LIBRARY_CONTRACT_ID = 'forge-clip-library/v1' as const;

export const CLIP_LIBRARY_BUDGETS = Object.freeze({
  maximumClips: 64,
  maximumKeyframesPerClip: 1_024,
  maximumContinuityHooksPerClip: 256,
  maximumDurationMs: 600_000,
  maximumBatchRequests: 64,
  maximumSamplesPerClip: 4_096,
} as const);

const SemanticIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const AssetRevisionIdSchema = z.string().regex(/^revision\.[a-f0-9]{64}$/);
const MorphologyRevisionIdSchema = z
  .string()
  .regex(/^morphology\.[a-f0-9]{64}$/);
const RigProfileIdSchema = z.string().regex(/^rig-v2\.[a-f0-9]{64}$/);
const PoseLibraryIdSchema = z.string().regex(/^pose-library\.[a-f0-9]{64}$/);
const ClipLibraryIdSchema = z.string().regex(/^clip-library\.[a-f0-9]{64}$/);
const EquipmentSignatureSchema = z.string().regex(/^equipment\.[a-f0-9]{64}$/);

export const ClipLibraryBindingSchema = z.strictObject({
  assetRevisionId: AssetRevisionIdSchema,
  morphologyRevisionId: MorphologyRevisionIdSchema,
  rigProfileId: RigProfileIdSchema,
  poseLibraryId: PoseLibraryIdSchema,
  equipmentSignature: EquipmentSignatureSchema,
});

export const ClipKeyframeSchema = z.strictObject({
  timeMs: z.number().int().min(0).max(CLIP_LIBRARY_BUDGETS.maximumDurationMs),
  poseId: SemanticIdSchema,
});

export const ClipContinuityHookSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('mirror'),
    poseId: SemanticIdSchema,
    mirrorPoseId: SemanticIdSchema,
  }),
  z.strictObject({
    kind: z.literal('contact'),
    atTimeMs: z.number().int().min(1),
    contactId: SemanticIdSchema,
  }),
  z.strictObject({
    kind: z.literal('equipment'),
    atTimeMs: z.number().int().min(1),
    slotId: SemanticIdSchema,
  }),
]);

const LoopDeclarationSchema = z.discriminatedUnion('seamPolicy', [
  z.strictObject({
    startTimeMs: z.number().int().min(0),
    endTimeMs: z.number().int().min(1),
    seamPolicy: z.literal('continuous'),
  }),
  z.strictObject({
    startTimeMs: z.number().int().min(0),
    endTimeMs: z.number().int().min(1),
    seamPolicy: z.literal('intentional_jump'),
    discontinuityReason: z.string().min(1).max(1_000),
  }),
]);

const ClipDefinitionBaseSchema = z.strictObject({
  semanticId: SemanticIdSchema,
  durationMs: z
    .number()
    .int()
    .min(1)
    .max(CLIP_LIBRARY_BUDGETS.maximumDurationMs),
  playback: z.enum(['once', 'loop']),
  interpolation: z.enum(['linear', 'step']),
  rootAnchorPolicy: z.enum([
    'locked',
    'in_place',
    'authored_translation',
    'authored_translation_and_yaw',
  ]),
  keyframes: z
    .array(ClipKeyframeSchema)
    .min(1)
    .max(CLIP_LIBRARY_BUDGETS.maximumKeyframesPerClip),
  loop: LoopDeclarationSchema.optional(),
  continuityHooks: z
    .array(ClipContinuityHookSchema)
    .max(CLIP_LIBRARY_BUDGETS.maximumContinuityHooksPerClip),
});

type ClipDefinitionValue = z.infer<typeof ClipDefinitionBaseSchema>;

function compatibilityIssue(
  context: z.RefinementCtx,
  path: (string | number)[],
  message: string,
): void {
  context.addIssue({
    code: 'custom',
    path,
    message,
    params: { domainCode: 'COMPATIBILITY_MISMATCH' },
  });
}

function validateClip(clip: ClipDefinitionValue, context: z.RefinementCtx) {
  for (let index = 1; index < clip.keyframes.length; index += 1)
    if (clip.keyframes[index]!.timeMs <= clip.keyframes[index - 1]!.timeMs)
      compatibilityIssue(
        context,
        ['keyframes'],
        'Authored keyframes must remain in strict increasing evaluation order.',
      );
  if (clip.keyframes[0]?.timeMs !== 0)
    compatibilityIssue(
      context,
      ['keyframes', 0, 'timeMs'],
      'Every clip must author an initial sample at time zero.',
    );

  const terminalIndex = clip.keyframes.length - 1;
  if (clip.keyframes[terminalIndex]?.timeMs !== clip.durationMs)
    compatibilityIssue(
      context,
      ['keyframes', terminalIndex, 'timeMs'],
      'Every clip must include its explicit authored terminal sample.',
    );

  if (clip.playback === 'once' && clip.loop !== undefined)
    compatibilityIssue(
      context,
      ['loop'],
      'Once clips cannot declare a loop interval.',
    );
  if (clip.playback === 'loop' && clip.loop === undefined)
    compatibilityIssue(
      context,
      ['loop'],
      'Loop clips require an explicit half-open loop interval.',
    );
  if (clip.loop !== undefined) {
    if (
      clip.loop.startTimeMs >= clip.loop.endTimeMs ||
      clip.loop.endTimeMs > clip.durationMs
    )
      compatibilityIssue(
        context,
        ['loop', 'endTimeMs'],
        'Loop intervals must be non-empty, half-open, and inside the clip duration.',
      );
    for (const boundary of ['startTimeMs', 'endTimeMs'] as const)
      if (
        !clip.keyframes.some(({ timeMs }) => timeMs === clip.loop?.[boundary])
      )
        compatibilityIssue(
          context,
          ['loop', boundary],
          'Loop boundaries must reference authored keyframe samples.',
        );
  }

  const hookKeys = new Set<string>();
  const authoredPoseIds = new Set(clip.keyframes.map(({ poseId }) => poseId));
  for (const [hookIndex, hook] of clip.continuityHooks.entries()) {
    const key = canonicalJsonValue(hook);
    if (hookKeys.has(key))
      context.addIssue({
        code: 'custom',
        path: ['continuityHooks', hookIndex],
        message: 'Continuity hooks must be unique within a clip.',
      });
    hookKeys.add(key);
    if (hook.kind === 'mirror') {
      if (!authoredPoseIds.has(hook.poseId))
        compatibilityIssue(
          context,
          ['continuityHooks', hookIndex, 'poseId'],
          'Mirror continuity poses must occur in the owning clip keyframes.',
        );
      if (!authoredPoseIds.has(hook.mirrorPoseId))
        compatibilityIssue(
          context,
          ['continuityHooks', hookIndex, 'mirrorPoseId'],
          'Mirror continuity poses must occur in the owning clip keyframes.',
        );
    }
    if (
      hook.kind !== 'mirror' &&
      !clip.keyframes.some(({ timeMs }) => timeMs === hook.atTimeMs)
    )
      compatibilityIssue(
        context,
        ['continuityHooks', hookIndex, 'atTimeMs'],
        'Contact and equipment continuity hooks must target exact keyframe boundaries.',
      );
  }
}

export const ClipDefinitionSchema =
  ClipDefinitionBaseSchema.superRefine(validateClip);

const ClipLibraryPayloadBaseSchema = z.strictObject({
  contractId: z.literal(CLIP_LIBRARY_CONTRACT_ID),
  binding: ClipLibraryBindingSchema,
  clips: z
    .array(ClipDefinitionSchema)
    .min(1)
    .max(CLIP_LIBRARY_BUDGETS.maximumClips),
});

function validateLibrary(
  library: z.infer<typeof ClipLibraryPayloadBaseSchema>,
  context: z.RefinementCtx,
) {
  const ids = new Set<string>();
  for (const [index, clip] of library.clips.entries()) {
    if (ids.has(clip.semanticId))
      context.addIssue({
        code: 'custom',
        path: ['clips', index, 'semanticId'],
        message: 'Clip semantic IDs must be unique within a library.',
      });
    ids.add(clip.semanticId);
  }
}

export const ClipLibraryPayloadSchema =
  ClipLibraryPayloadBaseSchema.superRefine(validateLibrary);
export const ClipLibrarySchema = ClipLibraryPayloadBaseSchema.extend({
  libraryId: ClipLibraryIdSchema,
}).superRefine(validateLibrary);

export type ClipDefinition = z.infer<typeof ClipDefinitionSchema>;
export type ClipLibraryPayload = z.infer<typeof ClipLibraryPayloadSchema>;
export type ClipLibrary = z.infer<typeof ClipLibrarySchema>;

function canonicalJsonValue(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJsonValue(item)).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(
        ([key, child]) => `${JSON.stringify(key)}:${canonicalJsonValue(child)}`,
      )
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function hookOrder(
  left: z.infer<typeof ClipContinuityHookSchema>,
  right: z.infer<typeof ClipContinuityHookSchema>,
): number {
  return canonicalJsonValue(left).localeCompare(canonicalJsonValue(right));
}

function normalizeUnchecked(value: ClipLibraryPayload): ClipLibraryPayload {
  return {
    ...value,
    clips: [...value.clips]
      .sort((left, right) => left.semanticId.localeCompare(right.semanticId))
      .map((clip) => ({
        ...clip,
        keyframes: [...clip.keyframes],
        continuityHooks: [...clip.continuityHooks].sort(hookOrder),
      })),
  };
}

function domainParse(
  value: unknown,
  path: ForgeDomainErrorPath = ['clipLibrary'],
): ClipLibraryPayload {
  const result = ClipLibraryPayloadSchema.safeParse(value);
  if (result.success) return result.data;
  const budget = result.error.issues.some(
    (issue) =>
      issue.code === 'too_big' ||
      (issue.code === 'custom' &&
        issue.params?.['domainCode'] === 'BUDGET_EXCEEDED'),
  );
  if (budget) throw schemaDomainError(result.error, path);
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

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function canonicalClipLibraryPayload(value: ClipLibraryPayload): string {
  return canonicalJsonValue(normalizeUnchecked(domainParse(value)));
}

export async function createClipLibrary(
  value: ClipLibraryPayload,
): Promise<ClipLibrary> {
  const normalized = normalizeUnchecked(domainParse(value));
  const libraryId = `clip-library.${await sha256(
    canonicalJsonValue(normalized),
  )}`;
  const result = ClipLibrarySchema.safeParse({ ...normalized, libraryId });
  if (!result.success) throw schemaDomainError(result.error, ['clipLibrary']);
  return result.data;
}

export async function verifyClipLibraryIdentity(
  value: ClipLibrary,
): Promise<boolean> {
  try {
    const { libraryId, ...payload } = structuredClone(value);
    if (!ClipLibraryIdSchema.safeParse(libraryId).success) return false;
    const normalized = normalizeUnchecked(payload);
    if (
      libraryId !==
      `clip-library.${await sha256(canonicalJsonValue(normalized))}`
    )
      return false;
    return ClipLibrarySchema.safeParse(value).success;
  } catch {
    return false;
  }
}
