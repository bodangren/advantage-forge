import { z } from 'zod';

export const FORGE_ASSET_INTERCHANGE_CONTRACT_ID =
  'forge-asset-interchange-manifest/v1' as const;
export const FORGE_INTERCHANGE_MAX_CHUNK_BYTES = 32 * 1024;

const SemanticIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const RevisionIdSchema = z.string().regex(/^revision\.[a-f0-9]{64}$/);
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const Base64Schema = z
  .string()
  .min(4)
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);
const ProfileVersionSchema = z.literal('1.0.0');
const HttpSourceUrlSchema = z
  .string()
  .min(1)
  .max(2_048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        url.hostname.length > 0 &&
        url.username === '' &&
        url.password === ''
      );
    } catch {
      return false;
    }
  }, 'Source URL must be HTTP(S), include a hostname, and contain no credentials.');
const PortableReferenceSchema = z
  .string()
  .min(1)
  .max(500)
  .refine(
    (value) =>
      !value.startsWith('/') &&
      !value.includes('\\') &&
      !/^[a-z][a-z0-9+.-]*:/i.test(value) &&
      value
        .split('/')
        .every(
          (segment) => segment !== '' && segment !== '..' && segment !== '.',
        ),
    'Reference must be a portable opaque relative POSIX key without dot segments.',
  );

const StyleProfileReviewSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('not_required') }),
  z.strictObject({
    status: z.literal('recorded'),
    attestation: z.literal('original-project-owned-no-franchise-copy'),
    evidence_reference: PortableReferenceSchema,
  }),
]);

export const ForgeStyleProfileSchema = z
  .strictObject({
    id: z.enum(['cute_chibi_v1', 'heroic_stylized_v1']),
    version: ProfileVersionSchema,
    review: StyleProfileReviewSchema,
  })
  .superRefine((profile, context) => {
    if (
      profile.id === 'cute_chibi_v1' &&
      profile.review.status !== 'not_required'
    )
      context.addIssue({
        code: 'custom',
        path: ['review', 'status'],
        message: 'cute_chibi_v1 uses the default not_required review state.',
      });
    if (
      profile.id === 'heroic_stylized_v1' &&
      profile.review.status !== 'recorded'
    )
      context.addIssue({
        code: 'custom',
        path: ['review', 'status'],
        message:
          'heroic_stylized_v1 requires recorded originality and provenance evidence.',
      });
  });

export const ForgeRenderProfileSchema = z.strictObject({
  id: z.literal('fantasy.sprite.orthographic.v1'),
  version: ProfileVersionSchema,
});

export const ForgeInterchangeArtifactSchema = z.strictObject({
  id: SemanticIdSchema,
  classification: z.enum(['source', 'derived']),
  role: z.enum([
    'directional_frame',
    'glb',
    'contact_sheet',
    'sprite_atlas',
    'clip_metadata',
  ]),
  media_type: z.enum(['image/png', 'model/gltf-binary', 'application/json']),
  byte_length: z.number().int().positive(),
  sha256: Sha256Schema,
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  revision_id: RevisionIdSchema,
  reference: PortableReferenceSchema,
  direction: z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']).optional(),
  transparent: z.boolean().optional(),
});

export const ForgeInterchangeEvidenceSchema = z.strictObject({
  id: SemanticIdSchema,
  kind: SemanticIdSchema,
  reference: PortableReferenceSchema,
  sha256: Sha256Schema,
  byte_length: z.number().int().positive().optional(),
});

export const ForgeInterchangeProvenanceSchema = z
  .strictObject({
    source_kind: z.enum(['project_generated', 'third_party']),
    workflow_reference: PortableReferenceSchema,
    ownership: z.enum(['project_owned', 'licensed']),
    license_label: z.string().min(1).max(200),
    creator: z.string().min(1).max(200).optional(),
    source_url: HttpSourceUrlSchema.optional(),
  })
  .superRefine((provenance, context) => {
    if (
      provenance.source_kind === 'project_generated' &&
      provenance.ownership !== 'project_owned'
    )
      context.addIssue({
        code: 'custom',
        path: ['ownership'],
        message:
          'Project-generated artifacts require project_owned provenance.',
      });
  });

export const ForgeAssetInterchangeManifestSchema = z
  .strictObject({
    contract_id: z.literal(FORGE_ASSET_INTERCHANGE_CONTRACT_ID),
    manifest_sha256: Sha256Schema,
    source: z.strictObject({
      asset_id: SemanticIdSchema,
      revision_id: RevisionIdSchema,
    }),
    style_profile: ForgeStyleProfileSchema,
    render_profile: ForgeRenderProfileSchema,
    provenance: ForgeInterchangeProvenanceSchema,
    artifacts: z.array(ForgeInterchangeArtifactSchema).min(2).max(1_000),
    evidence: z.array(ForgeInterchangeEvidenceSchema).min(1).max(1_000),
  })
  .superRefine((manifest, context) => {
    const artifactIds = new Set<string>();
    const artifactReferences = new Set<string>();
    const frameDirections = new Set<string>();
    let sourceFrameCount = 0;
    let sourceGlbCount = 0;

    for (const [index, artifact] of manifest.artifacts.entries()) {
      const path: PropertyKey[] = ['artifacts', index];
      if (artifact.revision_id !== manifest.source.revision_id)
        context.addIssue({
          code: 'custom',
          path: [...path, 'revision_id'],
          message: 'Artifact revision must equal the pinned source revision.',
        });
      if (artifactIds.has(artifact.id))
        context.addIssue({
          code: 'custom',
          path: [...path, 'id'],
          message: 'Artifact IDs must be unique.',
        });
      artifactIds.add(artifact.id);
      if (artifactReferences.has(artifact.reference))
        context.addIssue({
          code: 'custom',
          path: [...path, 'reference'],
          message: 'Artifact references must be unique.',
        });
      artifactReferences.add(artifact.reference);

      if (artifact.role === 'directional_frame') {
        sourceFrameCount += 1;
        if (
          artifact.classification !== 'source' ||
          artifact.media_type !== 'image/png' ||
          artifact.width !== 128 ||
          artifact.height !== 128 ||
          artifact.direction === undefined ||
          artifact.transparent !== true
        )
          context.addIssue({
            code: 'custom',
            path,
            message:
              'A directional_frame is a transparent source image/png with 128x128 dimensions and a direction.',
          });
        if (
          artifact.direction !== undefined &&
          frameDirections.has(artifact.direction)
        )
          context.addIssue({
            code: 'custom',
            path: [...path, 'direction'],
            message: 'Directional source frames must have unique directions.',
          });
        if (artifact.direction !== undefined)
          frameDirections.add(artifact.direction);
      } else if (artifact.role === 'glb') {
        sourceGlbCount += 1;
        if (
          artifact.classification !== 'source' ||
          artifact.media_type !== 'model/gltf-binary' ||
          artifact.width !== undefined ||
          artifact.height !== undefined ||
          artifact.direction !== undefined ||
          artifact.transparent !== undefined
        )
          context.addIssue({
            code: 'custom',
            path,
            message:
              'A glb is a source model/gltf-binary artifact without raster dimensions or direction.',
          });
      } else if (
        artifact.role === 'contact_sheet' ||
        artifact.role === 'sprite_atlas'
      ) {
        if (
          artifact.classification !== 'derived' ||
          artifact.media_type !== 'image/png' ||
          artifact.width === undefined ||
          artifact.height === undefined ||
          artifact.direction !== undefined ||
          artifact.transparent === undefined
        )
          context.addIssue({
            code: 'custom',
            path,
            message:
              'A contact_sheet or sprite_atlas is a derived image/png with dimensions, an explicit transparency declaration, and no direction.',
          });
      } else if (
        artifact.classification !== 'derived' ||
        artifact.media_type !== 'application/json' ||
        artifact.width !== undefined ||
        artifact.height !== undefined ||
        artifact.direction !== undefined ||
        artifact.transparent !== undefined
      )
        context.addIssue({
          code: 'custom',
          path,
          message:
            'clip_metadata is a derived application/json artifact without raster dimensions or direction.',
        });
    }

    const expectedDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    if (
      sourceFrameCount !== expectedDirections.length ||
      expectedDirections.some((direction) => !frameDirections.has(direction))
    )
      context.addIssue({
        code: 'custom',
        path: ['artifacts'],
        message:
          'A Forge asset manifest requires exactly eight unique independent source directions in N, NE, E, SE, S, SW, W, NW.',
      });
    if (sourceGlbCount === 0)
      context.addIssue({
        code: 'custom',
        path: ['artifacts'],
        message:
          'A Forge asset manifest requires at least one independent source GLB.',
      });

    const evidenceIds = new Set<string>();
    const evidenceReferences = new Set<string>();
    for (const [index, evidence] of manifest.evidence.entries()) {
      if (evidenceIds.has(evidence.id))
        context.addIssue({
          code: 'custom',
          path: ['evidence', index, 'id'],
          message: 'Evidence IDs must be unique.',
        });
      evidenceIds.add(evidence.id);
      if (evidenceReferences.has(evidence.reference))
        context.addIssue({
          code: 'custom',
          path: ['evidence', index, 'reference'],
          message: 'Evidence references must be unique.',
        });
      evidenceReferences.add(evidence.reference);
    }
    if (!evidenceReferences.has(manifest.provenance.workflow_reference))
      context.addIssue({
        code: 'custom',
        path: ['provenance', 'workflow_reference'],
        message:
          'Provenance workflow_reference must match a digest-pinned evidence reference.',
      });
    if (
      manifest.style_profile.review.status === 'recorded' &&
      !evidenceReferences.has(manifest.style_profile.review.evidence_reference)
    )
      context.addIssue({
        code: 'custom',
        path: ['style_profile', 'review', 'evidence_reference'],
        message:
          'Style review evidence_reference must match a digest-pinned evidence reference.',
      });
  });

export type ForgeAssetInterchangeManifest = z.infer<
  typeof ForgeAssetInterchangeManifestSchema
>;

export const ForgeInterchangeArtifactChunkSchema = z
  .strictObject({
    record_kind: z.enum(['artifact', 'evidence']).default('artifact'),
    asset_id: SemanticIdSchema,
    revision_id: RevisionIdSchema,
    delivery_id: z
      .string()
      .regex(/^delivery\.[a-f0-9]{64}$/)
      .optional(),
    artifact_id: SemanticIdSchema,
    artifact_sha256: Sha256Schema,
    chunk_sha256: Sha256Schema,
    offset: z.number().int().nonnegative(),
    length: z.number().int().min(1).max(FORGE_INTERCHANGE_MAX_CHUNK_BYTES),
    total: z.number().int().positive(),
    bytes_base64: Base64Schema,
  })
  .superRefine((chunk, context) => {
    if (chunk.offset + chunk.length > chunk.total)
      context.addIssue({
        code: 'custom',
        path: ['length'],
        message: 'Chunk range must be contained by total artifact bytes.',
      });
  });

export type ForgeInterchangeArtifactChunk = z.infer<
  typeof ForgeInterchangeArtifactChunkSchema
>;

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => [key, canonicalValue(entry)]),
  );
}

/**
 * Returns the exact compact UTF-8 JSON projection signed by manifest_sha256.
 * Object keys are recursively sorted, array order is preserved, and only the
 * top-level manifest_sha256 field is excluded.
 */
export function canonicalForgeAssetInterchangeManifest(
  input: ForgeAssetInterchangeManifest,
): string {
  const signed = Object.fromEntries(
    Object.entries(input).filter(([key]) => key !== 'manifest_sha256'),
  );
  return JSON.stringify(canonicalValue(signed));
}

/** Computes the lowercase SHA-256 of the canonical signed manifest projection. */
export async function forgeAssetInterchangeManifestSha256(
  input: ForgeAssetInterchangeManifest,
): Promise<string> {
  const bytes = new TextEncoder().encode(
    canonicalForgeAssetInterchangeManifest(input),
  );
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

/** Parses the closed schema and rejects a manifest whose canonical digest drifts. */
export async function parseForgeAssetInterchangeManifest(
  input: unknown,
): Promise<ForgeAssetInterchangeManifest> {
  const manifest = ForgeAssetInterchangeManifestSchema.parse(input);
  const expected = await forgeAssetInterchangeManifestSha256(manifest);
  if (manifest.manifest_sha256 !== expected)
    throw new Error(
      `manifest_sha256 mismatch: expected ${expected}, received ${manifest.manifest_sha256}`,
    );
  return manifest;
}
