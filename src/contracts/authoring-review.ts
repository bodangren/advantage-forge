import { z } from 'zod';

export const FORGE_AUTHORING_REVIEW_CONTRACT_ID =
  'forge-authoring-review-manifest/v1' as const;
export const FORGE_REFERENCE_COMPARISON_PROFILE_ID =
  'forge.authoring.reference-comparison.v1' as const;

const SemanticIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const RevisionIdSchema = z.string().regex(/^revision\.[a-f0-9]{64}$/);
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
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
    'Reference must be a portable relative key without dot segments.',
  );

export const ForgeAuthoringReviewManifestSchema = z
  .strictObject({
    contract_id: z.literal(FORGE_AUTHORING_REVIEW_CONTRACT_ID),
    manifest_sha256: Sha256Schema,
    delivery_id: z.string().regex(/^delivery\.[a-f0-9]{64}$/),
    source: z.strictObject({
      asset_id: SemanticIdSchema,
      revision_id: RevisionIdSchema,
    }),
    profile: z.strictObject({
      id: z.literal(FORGE_REFERENCE_COMPARISON_PROFILE_ID),
      version: z.literal('1.0.0'),
      projection: z.literal('orthographic'),
      camera: z.literal('eye_level'),
      width: z.literal(512),
      height: z.literal(512),
      elevation_degrees: z.literal(0),
      padding_pixels: z.literal(32),
      background: z.literal('#e8e8e8'),
      lighting: z.literal('neutral_three_point_v1'),
      views: z.tuple([
        z.strictObject({ view: z.literal('front'), yaw_degrees: z.literal(0) }),
        z.strictObject({
          view: z.literal('three-quarter'),
          yaw_degrees: z.literal(45),
        }),
        z.strictObject({ view: z.literal('side'), yaw_degrees: z.literal(90) }),
        z.strictObject({
          view: z.literal('back'),
          yaw_degrees: z.literal(180),
        }),
      ]),
    }),
    classification: z.literal('authoring_only'),
    admission: z.strictObject({
      review_only: z.literal(true),
      interchange_admitted: z.literal(false),
      pack_admitted: z.literal(false),
    }),
    artifacts: z
      .array(
        z.strictObject({
          id: SemanticIdSchema,
          role: z.enum(['comparison_view', 'contact_sheet']),
          media_type: z.literal('image/png'),
          byte_length: z.number().int().positive(),
          sha256: Sha256Schema,
          width: z.number().int().positive(),
          height: z.number().int().positive(),
          transparent: z.literal(false),
          reference: PortableReferenceSchema,
          view: z.enum(['front', 'three-quarter', 'side', 'back']).optional(),
        }),
      )
      .length(5),
  })
  .superRefine((manifest, context) => {
    const expected = [
      ['view.front', 'front'],
      ['view.three-quarter', 'three-quarter'],
      ['view.side', 'side'],
      ['view.back', 'back'],
    ] as const;
    for (const [index, [id, view]] of expected.entries()) {
      const artifact = manifest.artifacts[index];
      if (
        artifact?.id !== id ||
        artifact.role !== 'comparison_view' ||
        artifact.view !== view ||
        artifact.width !== 512 ||
        artifact.height !== 512
      )
        context.addIssue({
          code: 'custom',
          path: ['artifacts', index],
          message: `Artifact ${index} must be the fixed ${view} view.`,
        });
    }
    const sheet = manifest.artifacts[4];
    if (
      sheet?.id !== 'review.contact-sheet' ||
      sheet.role !== 'contact_sheet' ||
      sheet.view !== undefined ||
      sheet.width !== 2048 ||
      sheet.height !== 530
    )
      context.addIssue({
        code: 'custom',
        path: ['artifacts', 4],
        message: 'Artifact 4 must be the fixed review contact sheet.',
      });
    const ids = new Set(manifest.artifacts.map(({ id }) => id));
    const references = new Set(
      manifest.artifacts.map(({ reference }) => reference),
    );
    if (ids.size !== manifest.artifacts.length)
      context.addIssue({
        code: 'custom',
        path: ['artifacts'],
        message: 'Artifact ids must be unique.',
      });
    if (references.size !== manifest.artifacts.length)
      context.addIssue({
        code: 'custom',
        path: ['artifacts'],
        message: 'Artifact references must be unique.',
      });
  });

export type ForgeAuthoringReviewManifest = z.infer<
  typeof ForgeAuthoringReviewManifestSchema
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

export function canonicalForgeAuthoringReviewManifest(
  input: ForgeAuthoringReviewManifest,
): string {
  return JSON.stringify(
    canonicalValue(
      Object.fromEntries(
        Object.entries(input).filter(
          ([key]) => key !== 'manifest_sha256' && key !== 'delivery_id',
        ),
      ),
    ),
  );
}

export async function forgeAuthoringReviewManifestSha256(
  input: ForgeAuthoringReviewManifest,
): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalForgeAuthoringReviewManifest(input)),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function parseForgeAuthoringReviewManifest(
  input: unknown,
): Promise<ForgeAuthoringReviewManifest> {
  const manifest = ForgeAuthoringReviewManifestSchema.parse(input);
  const expected = await forgeAuthoringReviewManifestSha256(manifest);
  if (
    manifest.manifest_sha256 !== expected ||
    manifest.delivery_id !== `delivery.${expected}`
  )
    throw new Error('Authoring review manifest digest identity is invalid.');
  return manifest;
}
