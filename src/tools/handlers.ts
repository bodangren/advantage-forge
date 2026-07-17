import { z } from 'zod';

import {
  applyPose,
  applyVariant,
  evaluateAssembly,
} from '../assembly/index.js';
import {
  AssetInspectionDataSchema,
  ConnectionDefinitionSchema,
  InspectionSectionSchema,
  SemanticRevisionComparisonSchema,
  ToolResultEnvelopeSchema,
  type AssetDocument,
  type PageInfo,
  type ToolResultEnvelope,
  type ValidationErrorCode,
} from '../contracts/index.js';
import {
  applySemanticPatch,
  compareSemanticDocuments,
  parseAssetDocument,
  SemanticPatchSchema,
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
const revisionId = z.string().regex(/^revision\.[a-f0-9]{64}$/);
export const ListKitsInputSchema = z.strictObject({});
export const InspectTemplateInputSchema = z.strictObject({
  templateId: semanticId,
});
export const InspectAssetInputSchema = z.strictObject({
  assetId: semanticId,
  section: InspectionSectionSchema.default('overview'),
  offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().min(1).max(100).default(20),
});
export const CompareRevisionsInputSchema = z.strictObject({
  assetId: semanticId,
  baseRevisionId: revisionId,
  targetRevisionId: revisionId.optional(),
  offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().min(1).max(100).default(20),
});
export const CreateAssetInputSchema = z.strictObject({
  reference: z.enum(['adventurer', 'crate', 'tree', 'cottage']),
});
export const ApplyOperationsInputSchema = z.strictObject({
  assetId: semanticId,
  expectedRevisionId: revisionId,
  patch: SemanticPatchSchema,
  dryRun: z.boolean().default(false),
});
export const ConnectPartsInputSchema = z.strictObject({
  assetId: semanticId,
  expectedRevisionId: revisionId,
  connection: ConnectionDefinitionSchema,
  dryRun: z.boolean().default(false),
});
export const SetPoseInputSchema = z.strictObject({
  assetId: semanticId,
  expectedRevisionId: revisionId,
  poseId: semanticId,
  dryRun: z.boolean().default(false),
});
export const ValidateAssetInputSchema = z.strictObject({ assetId: semanticId });
export const RenderPreviewInputSchema = z.strictObject({ assetId: semanticId });
export const ExportAssetInputSchema = z.strictObject({ assetId: semanticId });

const RESPONSE_ITEM_LIMIT = 100;
const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

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
  code: ValidationErrorCode,
  message: string,
  path = '$',
  guidance = 'Inspect the tool schema and current revision before retrying.',
  details: { readonly actual?: unknown; readonly expected?: unknown } = {},
): ToolResultEnvelope =>
  ToolResultEnvelopeSchema.parse({
    ok: false,
    affectedIds: [],
    summary: message,
    issues: [
      {
        code,
        severity: 'error',
        path,
        message,
        guidance,
        actual: details.actual,
        expected: details.expected,
      },
    ],
  });
const invalid = (result: z.ZodSafeParseError<unknown>): ToolResultEnvelope => {
  const issue = result.error.issues[0];
  const unknownKey =
    issue?.code === 'unrecognized_keys' ? issue.keys[0] : undefined;
  const path = [...(issue?.path ?? []), ...(unknownKey ? [unknownKey] : [])]
    .map((segment) =>
      typeof segment === 'number' ? `[${segment}]` : `.${String(segment)}`,
    )
    .join('');
  return fail(
    issue?.code === 'unrecognized_keys' ? 'UNKNOWN_FIELD' : 'INVALID_VALUE',
    issue?.message ?? 'Invalid tool input.',
    `$${path}`,
    'Use only the fields and bounded semantic operations advertised by this tool schema.',
  );
};

const bounded = <Value>(values: readonly Value[]) => ({
  items: values.slice(0, RESPONSE_ITEM_LIMIT),
  total: values.length,
  truncated: values.length > RESPONSE_ITEM_LIMIT,
  limit: RESPONSE_ITEM_LIMIT,
});

function pageInfo(total: number, offset: number, limit: number): PageInfo {
  const nextOffset = offset + limit;
  const truncated = nextOffset < total;
  return {
    total,
    offset,
    limit,
    truncated,
    ...(truncated ? { nextOffset } : {}),
  };
}

function evaluateDocument(document: Readonly<AssetDocument>) {
  const variant = document.variants.find(
    ({ id }) => id === document.activeVariantId,
  );
  const pose = document.poses.find(({ id }) => id === document.activePoseId);
  return evaluateAssembly(document.assembly, document.templates, {
    ...(variant === undefined ? {} : { variant }),
    ...(pose === undefined ? {} : { pose }),
  });
}

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
    const document = revision.document;
    const counts = {
      parts: document.assembly.parts.length,
      connections: document.assembly.connections.length,
      variants: document.variants.length,
      poses: document.poses.length,
      renderProfiles: document.renderProfiles.length,
    };
    const common = {
      id: document.id,
      name: document.name,
      kitId: document.kitId,
      unit: document.unit,
      seed: document.seed,
      triangleBudget: document.triangleBudget,
      activeVariantId: document.activeVariantId,
      activePoseId: document.activePoseId,
      section: parsed.data.section,
      counts,
    };
    if (parsed.data.section === 'overview')
      return ok(
        `Inspected current state for ${document.id}; request a section for complete bounded items.`,
        AssetInspectionDataSchema.parse(common),
        revision.revisionId,
      );

    const templateById = new Map(
      document.templates.map((template) => [template.id, template]),
    );
    let effectiveAssembly = document.assembly;
    const activeVariant = document.variants.find(
      ({ id }) => id === document.activeVariantId,
    );
    if (activeVariant !== undefined)
      effectiveAssembly = applyVariant(effectiveAssembly, activeVariant);
    const activePose = document.poses.find(
      ({ id }) => id === document.activePoseId,
    );
    if (activePose !== undefined)
      effectiveAssembly = applyPose(effectiveAssembly, activePose);
    const effectiveById = new Map(
      effectiveAssembly.parts.map((part) => [part.id, part]),
    );
    const sceneById = new Map(
      evaluateAssembly(effectiveAssembly, document.templates).parts.map(
        (part) => [part.id, part],
      ),
    );
    const portFor = (partId: string, portId: string) => {
      const part = document.assembly.parts.find(({ id }) => id === partId);
      const port =
        part === undefined
          ? undefined
          : templateById
              .get(part.templateId)
              ?.ports.find(({ id }) => id === portId);
      if (port === undefined)
        throw new Error(`Port ${partId}.${portId} was not found.`);
      return port;
    };
    const sections = {
      parts: document.assembly.parts
        .map((part) => {
          const template = templateById.get(part.templateId);
          const effective = effectiveById.get(part.id);
          const scene = sceneById.get(part.id);
          if (
            template === undefined ||
            effective === undefined ||
            scene === undefined
          )
            throw new Error(
              `Part ${part.id} could not be resolved for inspection.`,
            );
          return {
            id: part.id,
            templateId: part.templateId,
            role: template.role,
            handedness: part.handedness ?? 'neutral',
            shapeSource: part.shape === undefined ? 'template' : 'part',
            base: {
              shape: part.shape ?? template.shape,
              transform: part.transform,
              materialBindings: [...part.materialBindings].sort((left, right) =>
                compareText(left.slot, right.slot),
              ),
              visible: part.visible,
              ...(part.jointValueDegrees === undefined
                ? {}
                : { jointValueDegrees: part.jointValueDegrees }),
            },
            effective: {
              shape: effective.shape ?? template.shape,
              transform: effective.transform,
              worldTransform: scene.worldTransform,
              materialBindings: [...effective.materialBindings].sort(
                (left, right) => compareText(left.slot, right.slot),
              ),
              visible: effective.visible,
              ...(effective.jointValueDegrees === undefined
                ? {}
                : { jointValueDegrees: effective.jointValueDegrees }),
            },
            ports: [...template.ports].sort((left, right) =>
              compareText(left.id, right.id),
            ),
          };
        })
        .sort((left, right) => compareText(left.id, right.id)),
      connections: document.assembly.connections
        .map((connection) => ({
          ...connection,
          parentPort: portFor(connection.parentPartId, connection.parentPortId),
          childPort: portFor(connection.childPartId, connection.childPortId),
        }))
        .sort((left, right) => compareText(left.id, right.id)),
      variants: [...document.variants].sort((left, right) =>
        compareText(left.id, right.id),
      ),
      poses: [...document.poses].sort((left, right) =>
        compareText(left.id, right.id),
      ),
      renderProfiles: [...document.renderProfiles].sort((left, right) =>
        compareText(left.id, right.id),
      ),
    } as const;
    const values = sections[parsed.data.section];
    if (values.length > 0 && parsed.data.offset >= values.length)
      return fail(
        'INVALID_VALUE',
        `Offset ${parsed.data.offset} is outside the ${values.length}-item ${parsed.data.section} section.`,
        '$.offset',
        'Use offset 0 or the nextOffset returned by the previous page.',
        { actual: parsed.data.offset, expected: `0..${values.length - 1}` },
      );
    const page = pageInfo(values.length, parsed.data.offset, parsed.data.limit);
    const items = values.slice(
      parsed.data.offset,
      parsed.data.offset + parsed.data.limit,
    );
    return ok(
      `Inspected ${items.length} of ${values.length} ${parsed.data.section} for ${document.id}.`,
      AssetInspectionDataSchema.parse({ ...common, page, items }),
      revision.revisionId,
    );
  };
  const compareRevisions = async (
    input: unknown,
  ): Promise<ToolResultEnvelope> => {
    const parsed = CompareRevisionsInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const target =
      parsed.data.targetRevisionId === undefined
        ? await current(parsed.data.assetId)
        : await context.revisions.get(
            parsed.data.assetId,
            parsed.data.targetRevisionId,
          );
    if (target === undefined)
      return fail(
        'NOT_FOUND',
        parsed.data.targetRevisionId === undefined
          ? `Asset ${parsed.data.assetId} has no current revision.`
          : `Target revision ${parsed.data.targetRevisionId} was not found for ${parsed.data.assetId}.`,
        parsed.data.targetRevisionId === undefined
          ? '$.assetId'
          : '$.targetRevisionId',
      );
    const base = await context.revisions.get(
      parsed.data.assetId,
      parsed.data.baseRevisionId,
    );
    if (base === undefined)
      return fail(
        'NOT_FOUND',
        `Base revision ${parsed.data.baseRevisionId} was not found for ${parsed.data.assetId}.`,
        '$.baseRevisionId',
      );
    const comparison = compareSemanticDocuments(base.document, target.document);
    if (
      comparison.changes.length > 0 &&
      parsed.data.offset >= comparison.changes.length
    )
      return fail(
        'INVALID_VALUE',
        `Offset ${parsed.data.offset} is outside the ${comparison.changes.length}-change comparison.`,
        '$.offset',
        'Use offset 0 or the nextOffset returned by the previous comparison page.',
        {
          actual: parsed.data.offset,
          expected: `0..${comparison.changes.length - 1}`,
        },
      );
    const page = pageInfo(
      comparison.changes.length,
      parsed.data.offset,
      parsed.data.limit,
    );
    const data = SemanticRevisionComparisonSchema.parse({
      assetId: parsed.data.assetId,
      baseRevisionId: base.revisionId,
      targetRevisionId: target.revisionId,
      affectedIds: comparison.affectedIds,
      preservedIds: comparison.preservedIds,
      page,
      changes: comparison.changes.slice(
        parsed.data.offset,
        parsed.data.offset + parsed.data.limit,
      ),
    });
    return ok(
      `Compared ${data.page.total} field-level change(s) between two immutable revisions.`,
      data,
      target.revisionId,
      [...data.affectedIds],
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
    if ((await current(document.id)) !== undefined)
      return fail(
        'ALREADY_EXISTS',
        `Asset ${document.id} already exists.`,
        '$.reference',
        'Inspect and revise the current asset instead of resetting it.',
      );
    try {
      evaluateDocument(validated.document);
    } catch (error) {
      return fail(
        'INVALID_ASSEMBLY',
        error instanceof Error ? error.message : 'Assembly validation failed.',
      );
    }
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
    try {
      evaluateDocument(patched.document);
    } catch (error) {
      return fail(
        'INVALID_ASSEMBLY',
        error instanceof Error ? error.message : 'Assembly validation failed.',
        '$.patch',
        'Correct the proposed connections, ports, variants, or pose values before retrying.',
      );
    }
    if (parsed.data.dryRun)
      return ok(
        'Dry run succeeded; no revision was written.',
        {
          validation: 'valid',
          dryRun: true,
          patchSummary: {
            operationCount: parsed.data.patch.operations.length,
            affectedIds: [...patched.affectedIds],
          },
        },
        revision.revisionId,
        [...patched.affectedIds],
      );
    const saved = await context.revisions.save(
      patched.document,
      revision.revisionId,
    );
    return ok(
      `Applied ${patched.affectedIds.length} localized semantic change(s).`,
      {
        validation: 'valid',
        parentRevisionId: revision.revisionId,
        patchSummary: {
          operationCount: parsed.data.patch.operations.length,
          affectedIds: [...patched.affectedIds],
        },
      },
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
    const next = structuredClone(revision.document);
    next.activePoseId = parsed.data.poseId;
    try {
      evaluateDocument(next);
    } catch (error) {
      return fail(
        'INVALID_ASSEMBLY',
        error instanceof Error ? error.message : 'Pose validation failed.',
        '$.poseId',
      );
    }
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
    try {
      const scene = evaluateDocument(revision.document);
      if (scene.triangleCount > revision.document.triangleBudget)
        return fail(
          'TRIANGLE_BUDGET_EXCEEDED',
          `Asset uses ${scene.triangleCount} triangles, exceeding its ${revision.document.triangleBudget}-triangle budget.`,
          '$.triangleBudget',
          'Reduce primitive segments, simplify part geometry, or raise the explicit asset budget before validation.',
          {
            actual: scene.triangleCount,
            expected: `at most ${revision.document.triangleBudget}`,
          },
        );
      return ok(
        'Document and assembly validation passed.',
        {
          validation: 'valid',
          scene: {
            id: scene.id,
            bounds: scene.bounds,
            triangleCount: scene.triangleCount,
            triangleBudget: revision.document.triangleBudget,
            remainingTriangleBudget:
              revision.document.triangleBudget - scene.triangleCount,
            parts: bounded(
              scene.parts.map(({ id, templateId, role, bounds, visible }) => ({
                id,
                templateId,
                role,
                bounds,
                visible,
              })),
            ),
          },
        },
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
    compareRevisions,
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
