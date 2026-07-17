import { z } from 'zod';

import { evaluateAssembly } from '../assembly/index.js';
import {
  ConnectionDefinitionSchema,
  ToolResultEnvelopeSchema,
  type AssetDocument,
  type ToolResultEnvelope,
} from '../contracts/index.js';
import {
  applySemanticPatch,
  parseAssetDocument,
  type RevisionRepository,
  type SemanticPatch,
} from '../document/index.js';
import { referenceDocuments, rusticManifest } from '../fantasy-kit/index.js';

export interface RenderService {
  render(
    document: Readonly<AssetDocument>,
    revisionId: string,
  ): Promise<unknown>;
}
export interface ExportService {
  export(
    document: Readonly<AssetDocument>,
    revisionId: string,
  ): Promise<unknown>;
}
export interface ToolHandlerContext {
  readonly revisions: RevisionRepository;
  readonly renderService?: RenderService;
  readonly exportService?: ExportService;
}

const semanticId = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
export const ListKitsInputSchema = z.strictObject({});
export const InspectTemplateInputSchema = z.strictObject({
  templateId: semanticId,
});
export const InspectAssetInputSchema = z.strictObject({ assetId: semanticId });
export const CreateAssetInputSchema = z.strictObject({
  reference: z.enum(['adventurer', 'crate', 'tree', 'cottage']),
});
export const ApplyOperationsInputSchema = z.strictObject({
  assetId: semanticId,
  expectedRevisionId: z.string().startsWith('revision.'),
  patch: z.unknown(),
  dryRun: z.boolean().default(false),
});
export const ConnectPartsInputSchema = z.strictObject({
  assetId: semanticId,
  expectedRevisionId: z.string().startsWith('revision.'),
  connection: ConnectionDefinitionSchema,
  dryRun: z.boolean().default(false),
});
export const SetPoseInputSchema = z.strictObject({
  assetId: semanticId,
  expectedRevisionId: z.string().startsWith('revision.'),
  poseId: semanticId,
  dryRun: z.boolean().default(false),
});
export const ValidateAssetInputSchema = z.strictObject({ assetId: semanticId });
export const RenderPreviewInputSchema = z.strictObject({ assetId: semanticId });
export const ExportAssetInputSchema = z.strictObject({ assetId: semanticId });

const ok = (
  summary: string,
  data: unknown,
  revisionId?: string,
  affectedIds: string[] = [],
): ToolResultEnvelope =>
  ToolResultEnvelopeSchema.parse({
    ok: true,
    ...(revisionId === undefined ? {} : { revisionId }),
    affectedIds,
    summary,
    issues: [],
    data,
  });
const fail = (
  code: string,
  message: string,
  path = '$',
  guidance = 'Inspect the tool schema and current revision before retrying.',
): ToolResultEnvelope =>
  ToolResultEnvelopeSchema.parse({
    ok: false,
    affectedIds: [],
    summary: message,
    issues: [{ code, severity: 'error', path, message, guidance }],
  });
const invalid = (result: z.ZodSafeParseError<unknown>): ToolResultEnvelope =>
  fail(
    'INVALID_VALUE',
    result.error.issues[0]?.message ?? 'Invalid tool input.',
  );

export function createToolHandlers(context: ToolHandlerContext) {
  const current = async (assetId: string) =>
    context.revisions.getCurrent(assetId);
  const listKits = async (input: unknown): Promise<ToolResultEnvelope> => {
    const parsed = ListKitsInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    return ok('One bounded rustic fantasy kit is available.', {
      kits: [
        {
          id: 'rustic-human',
          style: 'low-poly rustic fantasy RPG',
          references: Object.keys(referenceDocuments),
          templateCount: rusticManifest.length,
        },
      ],
    });
  };
  const inspectTemplate = async (
    input: unknown,
  ): Promise<ToolResultEnvelope> => {
    const parsed = InspectTemplateInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const manifest = rusticManifest.find(
      ({ template }) => template.id === parsed.data.templateId,
    );
    if (manifest === undefined)
      return fail(
        'NOT_FOUND',
        `Template ${parsed.data.templateId} was not found.`,
        '$.templateId',
      );
    const { template, parameterBounds, intendedReferences } = manifest;
    return ok(`Template ${template.id} is ready for semantic assembly.`, {
      id: template.id,
      role: template.role,
      generator: template.shape.kind,
      parameters: template.shape,
      parameterBounds,
      materialSlots: template.materialSlots,
      ports: template.ports.map(({ id, tags, accepts, cardinality }) => ({
        id,
        tags,
        accepts,
        cardinality,
      })),
      intendedReferences,
      example: { templateId: template.id, partId: `${template.role}.example` },
    });
  };
  const inspectAsset = async (input: unknown): Promise<ToolResultEnvelope> => {
    const parsed = InspectAssetInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const revision = await current(parsed.data.assetId);
    if (revision === undefined)
      return fail(
        'NOT_FOUND',
        `Asset ${parsed.data.assetId} has no current revision.`,
        '$.assetId',
      );
    return ok(
      `Inspected ${revision.document.id}.`,
      {
        id: revision.document.id,
        name: revision.document.name,
        kitId: revision.document.kitId,
        partIds: revision.document.assembly.parts.map(({ id }) => id),
        connectionIds: revision.document.assembly.connections.map(
          ({ id }) => id,
        ),
        variants: revision.document.variants.map(({ id }) => id),
        poses: revision.document.poses.map(({ id }) => id),
        activeVariantId: revision.document.activeVariantId,
        activePoseId: revision.document.activePoseId,
      },
      revision.revisionId,
    );
  };
  const createAsset = async (input: unknown): Promise<ToolResultEnvelope> => {
    const parsed = CreateAssetInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const document = structuredClone(referenceDocuments[parsed.data.reference]);
    const validated = parseAssetDocument(document);
    if (!validated.ok)
      return {
        ok: false,
        affectedIds: [],
        summary: 'Reference document failed validation.',
        issues: [...validated.issues],
      };
    const revision = await context.revisions.save(validated.document);
    return ok(
      `Created ${document.id} from the ${parsed.data.reference} reference.`,
      { assetId: document.id, validation: 'valid' },
      revision.revisionId,
      [document.id],
    );
  };
  const applyOperations = async (
    input: unknown,
  ): Promise<ToolResultEnvelope> => {
    const parsed = ApplyOperationsInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const revision = await current(parsed.data.assetId);
    if (revision === undefined)
      return fail(
        'NOT_FOUND',
        `Asset ${parsed.data.assetId} was not found.`,
        '$.assetId',
      );
    if (revision.revisionId !== parsed.data.expectedRevisionId)
      return fail(
        'REVISION_CONFLICT',
        'The expected revision is stale.',
        '$.expectedRevisionId',
        'Inspect the current asset and reapply the localized operation.',
      );
    const patched = applySemanticPatch(revision.document, parsed.data.patch);
    if (!patched.ok)
      return {
        ok: false,
        affectedIds: [],
        summary: 'Semantic operations were rejected without mutation.',
        issues: [...patched.issues],
      };
    if (parsed.data.dryRun)
      return ok(
        'Dry run succeeded; no revision was written.',
        { validation: 'valid', dryRun: true },
        revision.revisionId,
        [...patched.affectedIds],
      );
    const saved = await context.revisions.save(
      patched.document,
      revision.revisionId,
    );
    return ok(
      `Applied ${patched.affectedIds.length} localized semantic change(s).`,
      { validation: 'valid', parentRevisionId: revision.revisionId },
      saved.revisionId,
      [...patched.affectedIds],
    );
  };
  const connectParts = async (input: unknown): Promise<ToolResultEnvelope> => {
    const parsed = ConnectPartsInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    return applyOperations({
      assetId: parsed.data.assetId,
      expectedRevisionId: parsed.data.expectedRevisionId,
      dryRun: parsed.data.dryRun,
      patch: {
        operations: [
          { operation: 'connectParts', connection: parsed.data.connection },
        ],
      } satisfies SemanticPatch,
    });
  };
  const setPose = async (input: unknown): Promise<ToolResultEnvelope> => {
    const parsed = SetPoseInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const revision = await current(parsed.data.assetId);
    if (revision === undefined)
      return fail(
        'NOT_FOUND',
        `Asset ${parsed.data.assetId} was not found.`,
        '$.assetId',
      );
    if (revision.revisionId !== parsed.data.expectedRevisionId)
      return fail(
        'REVISION_CONFLICT',
        'The expected revision is stale.',
        '$.expectedRevisionId',
      );
    if (!revision.document.poses.some(({ id }) => id === parsed.data.poseId))
      return fail(
        'NOT_FOUND',
        `Pose ${parsed.data.poseId} is not declared.`,
        '$.poseId',
      );
    if (parsed.data.dryRun)
      return ok(
        'Pose dry run succeeded; no revision was written.',
        { poseId: parsed.data.poseId, dryRun: true },
        revision.revisionId,
        [parsed.data.poseId],
      );
    const next = structuredClone(revision.document) as AssetDocument;
    next.activePoseId = parsed.data.poseId;
    const saved = await context.revisions.save(next, revision.revisionId);
    return ok(
      `Selected pose ${parsed.data.poseId}.`,
      { poseId: parsed.data.poseId },
      saved.revisionId,
      [parsed.data.poseId],
    );
  };
  const validateAsset = async (input: unknown): Promise<ToolResultEnvelope> => {
    const parsed = ValidateAssetInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const revision = await current(parsed.data.assetId);
    if (revision === undefined)
      return fail(
        'NOT_FOUND',
        `Asset ${parsed.data.assetId} was not found.`,
        '$.assetId',
      );
    const variant = revision.document.variants.find(
      ({ id }) => id === revision.document.activeVariantId,
    );
    const pose = revision.document.poses.find(
      ({ id }) => id === revision.document.activePoseId,
    );
    try {
      const scene = evaluateAssembly(
        revision.document.assembly,
        revision.document.templates,
        {
          ...(variant === undefined ? {} : { variant }),
          ...(pose === undefined ? {} : { pose }),
        },
      );
      return ok(
        'Document and assembly validation passed.',
        { validation: 'valid', scene },
        revision.revisionId,
      );
    } catch (error) {
      return fail(
        'INVALID_ASSEMBLY',
        error instanceof Error ? error.message : 'Assembly validation failed.',
      );
    }
  };
  const renderPreview = async (input: unknown): Promise<ToolResultEnvelope> => {
    const parsed = RenderPreviewInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const revision = await current(parsed.data.assetId);
    if (revision === undefined)
      return fail(
        'NOT_FOUND',
        `Asset ${parsed.data.assetId} was not found.`,
        '$.assetId',
      );
    if (context.renderService === undefined)
      return fail('SERVICE_UNAVAILABLE', 'Rendering is not configured.');
    return ok(
      'Rendered the current canonical revision.',
      await context.renderService.render(
        revision.document,
        revision.revisionId,
      ),
      revision.revisionId,
    );
  };
  const exportAsset = async (input: unknown): Promise<ToolResultEnvelope> => {
    const parsed = ExportAssetInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const revision = await current(parsed.data.assetId);
    if (revision === undefined)
      return fail(
        'NOT_FOUND',
        `Asset ${parsed.data.assetId} was not found.`,
        '$.assetId',
      );
    if (context.exportService === undefined)
      return fail('SERVICE_UNAVAILABLE', 'GLB export is not configured.');
    return ok(
      'Exported the current canonical revision.',
      await context.exportService.export(
        revision.document,
        revision.revisionId,
      ),
      revision.revisionId,
    );
  };
  return {
    listKits,
    inspectTemplate,
    inspectAsset,
    createAsset,
    applyOperations,
    connectParts,
    setPose,
    validateAsset,
    renderPreview,
    exportAsset,
  };
}

export type ToolHandlers = ReturnType<typeof createToolHandlers>;
