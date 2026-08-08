import { createHash } from 'node:crypto';
import { z } from 'zod';

import {
  ReferenceFiveClipBatchAuthoringRequestSchema,
  RigidAnimationAuthoringRequestSchema,
  compileReferenceFiveClipBatchAuthoringRequest,
  compileRigidAnimationAuthoringRequest,
} from '../animation/index.js';
import {
  applyPose,
  applyVariant,
  evaluateAssembly,
} from '../assembly/index.js';
import {
  AccessoryOperationSummarySchema,
  AccessorySearchRequestSchema,
  AccessoryWorkflowRequestSchema,
  AssetInspectionDataSchema,
  ConnectionDefinitionSchema,
  FORGE_INTERCHANGE_MAX_CHUNK_BYTES,
  ForgeAuthoringReviewManifestSchema,
  ForgeInterchangeArtifactChunkSchema,
  ForgeTemporalArtifactsManifestSchema,
  HumanoidMorphologyProfileSchema,
  InspectionSectionSchema,
  NovelAssetIdentityRequestSchema,
  NovelCompositionOperationSchema,
  NovelGrammarBriefSchema,
  RestoreRevisionOperationSchema,
  SemanticRevisionComparisonSchema,
  ToolResultEnvelopeSchema,
  parseForgeAuthoringReviewManifest,
  parseForgeAssetInterchangeManifest,
  type AssetDocument,
  type ForgeAssetInterchangeManifest,
  type PageInfo,
  type RigidAnimationBundle,
  type ToolResultEnvelope,
  type ValidationErrorCode,
} from '../contracts/index.js';
import {
  applySemanticPatch,
  canonicalJson,
  compareSemanticDocuments,
  contentRevisionId,
  parseAssetDocument,
  SemanticPatchSchema,
  type RevisionRepository,
  type SemanticPatch,
} from '../document/index.js';
import {
  NOVEL_ASSET_ARCHETYPES,
  REFERENCE_CHIBI_GUARD_MORPHOLOGY_PROFILE_ID,
  RUSTIC_HUMANOID_PART_MAP,
  HumanoidMorphologyCompilationError,
  NovelCompositionError,
  compileNovelComposition,
  compileHumanoidMorphology,
  compareNovelRevisionState,
  initializeNovelAssetDocument,
  inspectNovelAssetCompleteness,
  planNovelAssetBrief,
  referenceDocuments,
  rusticAccessoryCatalog,
  rusticManifest,
} from '../fantasy-kit/index.js';

import {
  AccessoryWorkflowError,
  discoverAccessories,
  planAccessoryOperation,
} from './accessory-workflow.js';
import { CAPABILITY_FACTS, capabilityReport } from './capabilities.js';

export interface RenderService {
  render(
    document: Readonly<AssetDocument>,
    revisionId: string,
  ): Promise<unknown>;
  renderTemporal?(
    document: Readonly<AssetDocument>,
    revisionId: string,
    bundle: RigidAnimationBundle,
  ): Promise<unknown>;
  renderReferenceComparison?(
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
export interface InterchangeArtifactService {
  getManifest(request: {
    readonly assetId: string;
    readonly revisionId: string;
  }): Promise<unknown>;
  getArtifactChunk(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly artifactId: string;
    readonly recordKind?: 'artifact' | 'evidence';
    readonly offset: number;
    readonly length: number;
  }): Promise<unknown>;
  getTemporalManifest?(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
  }): Promise<unknown>;
  getTemporalArtifactChunk?(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
    readonly artifactId: string;
    readonly offset: number;
    readonly length: number;
  }): Promise<unknown>;
  getDeliveryManifest?(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
  }): Promise<unknown>;
  getDeliveryArtifactChunk?(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
    readonly artifactId: string;
    readonly recordKind: 'artifact' | 'evidence';
    readonly offset: number;
    readonly length: number;
  }): Promise<unknown>;
}
export interface ToolHandlerContext {
  readonly revisions: RevisionRepository;
  readonly renderService?: RenderService;
  readonly exportService?: ExportService;
  readonly interchangeService?: InterchangeArtifactService;
}

function reportTrustedServiceFailure(scope: string, error: unknown): void {
  const detail =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`[fantasy-asset-forge:${scope}] ${detail}\n`);
}

const semanticId = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const revisionId = z.string().regex(/^revision\.[a-f0-9]{64}$/);
export const ListKitsInputSchema = z.strictObject({
  brief: NovelGrammarBriefSchema.optional(),
});
export const InspectCapabilitiesInputSchema = z.strictObject({
  capabilityIds: z
    .array(semanticId)
    .max(32)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Capability IDs must be unique.',
    })
    .default([]),
});
export const InspectTemplateInputSchema = z.strictObject({
  templateId: semanticId,
});
export const SearchAccessoriesInputSchema = AccessorySearchRequestSchema;
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
  idOffset: z.number().int().nonnegative().default(0),
  idLimit: z.number().int().min(1).max(100).default(100),
});
export const CreateAssetInputSchema = z
  .strictObject({
    reference: z.enum(['adventurer', 'crate', 'tree', 'cottage']).optional(),
    identity: NovelAssetIdentityRequestSchema.optional(),
  })
  .superRefine((input, context) => {
    if ((input.reference === undefined) === (input.identity === undefined))
      context.addIssue({
        code: 'custom',
        path: [],
        message: 'Provide exactly one of reference or identity.',
      });
  });
export const ApplyOperationsInputSchema = z
  .strictObject({
    assetId: semanticId,
    expectedRevisionId: revisionId,
    patch: SemanticPatchSchema.optional(),
    composition: NovelCompositionOperationSchema.optional(),
    morphology: HumanoidMorphologyProfileSchema.optional(),
    restore: RestoreRevisionOperationSchema.optional(),
    confirmedPlanId: z
      .string()
      .regex(/^plan\.[a-f0-9]{64}$/)
      .optional(),
    dryRun: z.boolean().default(false),
    idOffset: z.number().int().nonnegative().default(0),
    idLimit: z.number().int().min(1).max(100).default(100),
  })
  .superRefine((input, context) => {
    if (
      [input.patch, input.composition, input.morphology, input.restore].filter(
        (operation) => operation !== undefined,
      ).length !== 1
    )
      context.addIssue({
        code: 'custom',
        path: [],
        message:
          'Provide exactly one of patch, composition, morphology, or restore.',
      });
  });
export const ApplyAccessoryOperationInputSchema =
  AccessoryWorkflowRequestSchema;
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
export const RenderPreviewInputSchema = z
  .strictObject({
    assetId: semanticId,
    revisionId,
    referenceComparison: z
      .strictObject({
        profileId: z.literal('forge.authoring.reference-comparison.v1'),
      })
      .optional(),
    animation: z
      .union([
        RigidAnimationAuthoringRequestSchema,
        ReferenceFiveClipBatchAuthoringRequestSchema,
      ])
      .optional(),
  })
  .refine(
    ({ animation, referenceComparison }) =>
      animation === undefined || referenceComparison === undefined,
    {
      path: ['referenceComparison'],
      message:
        'Animation and reference comparison rendering are mutually exclusive.',
    },
  );
const AuthoringReviewDeliveryReceiptSchema = z.strictObject({
  contractId: z.literal('forge-authoring-review-manifest/v1'),
  deliveryId: z.string().regex(/^delivery\.[a-f0-9]{64}$/),
  manifestSha256: z.string().regex(/^[a-f0-9]{64}$/),
  profileId: z.literal('forge.authoring.reference-comparison.v1'),
  classification: z.literal('authoring_only'),
  admission: z.strictObject({
    review_only: z.literal(true),
    interchange_admitted: z.literal(false),
    pack_admitted: z.literal(false),
  }),
  artifactSha256s: z.array(z.string().regex(/^[a-f0-9]{64}$/)).length(5),
});
export const ExportAssetInputSchema = z.strictObject({
  assetId: semanticId,
  revisionId,
});
export const GetInterchangeManifestInputSchema = z.strictObject({
  asset_id: semanticId,
  revision_id: revisionId,
  delivery_id: z
    .string()
    .regex(/^delivery\.[a-f0-9]{64}$/)
    .optional(),
});
export const GetInterchangeArtifactChunkInputSchema = z.strictObject({
  asset_id: semanticId,
  revision_id: revisionId,
  artifact_id: semanticId,
  delivery_id: z
    .string()
    .regex(/^delivery\.[a-f0-9]{64}$/)
    .optional(),
  record_kind: z.enum(['artifact', 'evidence']).default('artifact'),
  offset: z.number().int().nonnegative(),
  length: z.number().int().min(1).max(FORGE_INTERCHANGE_MAX_CHUNK_BYTES),
});

const RESPONSE_ITEM_LIMIT = 100;
const MUTATION_RESPONSE_BYTE_LIMIT = 64 * 1_024;
const BROAD_SEMANTIC_CHANGE_BYTES = 16 * 1_024;
const responseEncoder = new TextEncoder();
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

function mutationResponseFits(envelope: ToolResultEnvelope): boolean {
  const response = {
    content: [{ type: 'text', text: JSON.stringify(envelope) }],
    isError: !envelope.ok,
  };
  return (
    responseEncoder.encode(JSON.stringify(response)).byteLength <=
    MUTATION_RESPONSE_BYTE_LIMIT
  );
}

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

function revisionPlan(
  kind: 'patch' | 'composition' | 'morphology' | 'restore',
  baseRevisionId: string,
  targetRevisionId: string,
  comparison: ReturnType<typeof compareSemanticDocuments>,
  state: ReturnType<typeof compareNovelRevisionState>,
  broadOrDestructive: boolean,
  idOffset: number,
  idLimit: number,
) {
  const identity = {
    kind,
    baseRevisionId,
    targetRevisionId,
    affectedIds: comparison.affectedIds,
    preservedIds: comparison.preservedIds,
    changes: comparison.changes,
    ...state,
  };
  const planId = `plan.${createHash('sha256')
    .update(canonicalJson(identity))
    .digest('hex')}`;
  return {
    planId,
    kind,
    broadOrDestructive,
    requiresConfirmation: broadOrDestructive,
    baseRevisionId,
    targetRevisionId,
    affectedIds: comparison.affectedIds.slice(idOffset, idOffset + idLimit),
    affectedIdsPage: pageInfo(comparison.affectedIds.length, idOffset, idLimit),
    preservedIds: comparison.preservedIds.slice(idOffset, idOffset + idLimit),
    preservedIdsPage: pageInfo(
      comparison.preservedIds.length,
      idOffset,
      idLimit,
    ),
    changeCount: comparison.changes.length,
    changes: comparison.changes
      .slice(0, RESPONSE_ITEM_LIMIT)
      .map(({ path, kind, semanticId }) => ({
        path,
        kind,
        ...(semanticId === undefined ? {} : { semanticId }),
      })),
    ...state,
  };
}

export function createToolHandlers(context: ToolHandlerContext) {
  const current = async (assetId: string) =>
    context.revisions.getCurrent(assetId);
  const incompleteFailure = (
    document: Readonly<AssetDocument>,
    path: string,
  ): ToolResultEnvelope | undefined => {
    const completeness = inspectNovelAssetCompleteness(document);
    if (completeness?.state !== 'incomplete') return undefined;
    const unattachedPartId = completeness.unattachedPartIds[0];
    const missingRole = completeness.missingRequirements[0]?.role;
    return fail(
      'INCOMPLETE_ASSET',
      unattachedPartId === undefined
        ? `Asset ${document.id} is missing required archetype role ${missingRole}.`
        : `Asset ${document.id} contains unattached part ${unattachedPartId}.`,
      unattachedPartId === undefined
        ? missingRole === undefined
          ? path
          : `$.assembly.requirements.${missingRole}`
        : `$.assembly.parts.${unattachedPartId}`,
      unattachedPartId === undefined
        ? 'Add a compatible registered template for the reported role, attach it through compatible named ports, and retry.'
        : 'Connect the reported part through compatible named ports before validation, export, or interchange publication.',
      { actual: completeness },
    );
  };
  const interchangeManifest = async (
    assetId: string,
    pinnedRevisionId: string,
  ): Promise<
    | { readonly manifest: ForgeAssetInterchangeManifest }
    | { readonly failure: ToolResultEnvelope }
  > => {
    const revision = await context.revisions.get(assetId, pinnedRevisionId);
    if (revision === undefined)
      return {
        failure: fail(
          'NOT_FOUND',
          `Revision ${pinnedRevisionId} was not found for ${assetId}.`,
          '$.revision_id',
          'Use an exact immutable revision returned by a Forge authoring operation.',
        ),
      };
    const incomplete = incompleteFailure(revision.document, '$.revision_id');
    if (incomplete !== undefined) return { failure: incomplete };
    if (context.interchangeService === undefined)
      return {
        failure: fail(
          'SERVICE_UNAVAILABLE',
          'Immutable interchange artifact retrieval is not configured.',
          '$.revision_id',
          'Render and export this exact revision through a configured Forge interchange registry before retrying.',
        ),
      };
    try {
      const manifest = await parseForgeAssetInterchangeManifest(
        await context.interchangeService.getManifest({
          assetId,
          revisionId: pinnedRevisionId,
        }),
      );
      if (
        manifest.source.asset_id !== assetId ||
        manifest.source.revision_id !== pinnedRevisionId
      )
        return {
          failure: fail(
            'REPOSITORY_ERROR',
            'Interchange registry returned a manifest for another immutable source.',
            '$.manifest.source',
            'Rebuild the registry record from the exact requested asset revision.',
            {
              actual: manifest.source,
              expected: { asset_id: assetId, revision_id: pinnedRevisionId },
            },
          ),
        };
      return { manifest };
    } catch (error) {
      return {
        failure: fail(
          'REPOSITORY_ERROR',
          error instanceof Error
            ? error.message
            : 'Interchange manifest retrieval failed.',
          '$.manifest',
          'Reject this registry record and rebuild it from content-verified immutable artifacts.',
        ),
      };
    }
  };
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
          archetypes: NOVEL_ASSET_ARCHETYPES,
        },
      ],
      ...(parsed.data.brief === undefined
        ? {}
        : { planning: planNovelAssetBrief(parsed.data.brief) }),
    });
  };
  const inspectCapabilities = async (
    input: unknown,
  ): Promise<ToolResultEnvelope> => {
    const parsed = InspectCapabilitiesInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const available = new Set(CAPABILITY_FACTS.map(({ id }) => id));
    const unknownIndex = parsed.data.capabilityIds.findIndex(
      (id) => !available.has(id),
    );
    if (unknownIndex >= 0)
      return fail(
        'NOT_FOUND',
        `Capability ${parsed.data.capabilityIds[unknownIndex]} is not declared.`,
        `$.capabilityIds[${unknownIndex}]`,
        'Call inspect_capabilities without filters to discover the complete bounded capability ID list.',
      );
    const report = capabilityReport(parsed.data.capabilityIds);
    return ok(
      report.filtered
        ? `Reported ${report.facts.length} requested capability fact(s).`
        : `Reported all ${report.facts.length} current capability fact(s).`,
      report,
    );
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
    const accessoryEntry = rusticAccessoryCatalog.find(
      (entry) => entry.template.id === template.id,
    );
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
      ...(accessoryEntry === undefined
        ? {}
        : {
            accessory: {
              ...template.accessory,
              parameterBounds: accessoryEntry.parameterBounds,
              defaultMaterialId: accessoryEntry.defaultMaterialId,
              intendedLoadouts: accessoryEntry.intendedLoadouts,
              attachmentTarget: accessoryEntry.attachmentTarget,
              usage: accessoryEntry.usage,
            },
          }),
      example: { templateId: template.id, partId: `${template.role}.example` },
    });
  };
  const searchAccessories = async (
    input: unknown,
  ): Promise<ToolResultEnvelope> => {
    const parsed = SearchAccessoriesInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const revision = await current(parsed.data.assetId);
    if (revision === undefined)
      return fail(
        'NOT_FOUND',
        `Asset ${parsed.data.assetId} was not found.`,
        '$.assetId',
      );
    const data = discoverAccessories(
      revision.document,
      revision.revisionId,
      parsed.data.archetypeId,
      parsed.data.query,
    );
    if (data.page.total > 0 && data.page.offset >= data.page.total)
      return fail(
        'INVALID_VALUE',
        `Offset ${data.page.offset} is outside the ${data.page.total}-accessory result.`,
        '$.query.offset',
        'Use offset 0 or nextOffset from the previous page.',
      );
    return ok(
      `Discovered ${data.items.length} of ${data.page.total} compatible accessory candidate(s).`,
      data,
      revision.revisionId,
    );
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
      origin:
        document.novelIdentity === undefined
          ? {
              kind: 'reference' as const,
              reference: Object.entries(referenceDocuments).find(
                ([, reference]) => reference.id === document.id,
              )?.[0],
            }
          : {
              kind: 'novel' as const,
              family: document.novelIdentity.family,
              archetypeId: document.novelIdentity.archetypeId,
              styleProfile: document.novelIdentity.styleProfile,
              renderProfile: document.novelIdentity.renderProfile,
            },
      lineage: {
        currentRevisionId: revision.revisionId,
        ...(revision.parentRevisionId === undefined
          ? {}
          : { parentRevisionId: revision.parentRevisionId }),
      },
      ...(document.novelIdentity === undefined
        ? {}
        : { completeness: inspectNovelAssetCompleteness(document) }),
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
            ...(part.equipmentSlot === undefined
              ? {}
              : { equipmentSlot: part.equipmentSlot }),
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
    const state = compareNovelRevisionState(base.document, target.document);
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
      affectedIds: comparison.affectedIds.slice(
        parsed.data.idOffset,
        parsed.data.idOffset + parsed.data.idLimit,
      ),
      affectedIdsPage: pageInfo(
        comparison.affectedIds.length,
        parsed.data.idOffset,
        parsed.data.idLimit,
      ),
      preservedIds: comparison.preservedIds.slice(
        parsed.data.idOffset,
        parsed.data.idOffset + parsed.data.idLimit,
      ),
      preservedIdsPage: pageInfo(
        comparison.preservedIds.length,
        parsed.data.idOffset,
        parsed.data.idLimit,
      ),
      ...state,
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
    if (parsed.data.identity !== undefined) {
      const identity = parsed.data.identity;
      const committedReferenceIds = new Set(
        Object.values(referenceDocuments).map(({ id }) => id),
      );
      if (committedReferenceIds.has(identity.assetId))
        return fail(
          'INVALID_VALUE',
          `Asset ID ${identity.assetId} belongs to a committed reference.`,
          '$.identity.assetId',
          'Choose a new semantic ID that does not shadow a committed reference identity.',
        );
      if ((await current(identity.assetId)) !== undefined)
        return fail(
          'ALREADY_EXISTS',
          `Asset ${identity.assetId} already exists.`,
          '$.identity.assetId',
          'Inspect and revise the current identity instead of reinitializing it.',
        );
      const document = initializeNovelAssetDocument(identity);
      try {
        evaluateDocument(document);
      } catch (error) {
        return fail(
          'INVALID_ASSEMBLY',
          error instanceof Error
            ? error.message
            : 'Novel identity initialization failed.',
          '$.identity',
        );
      }
      let revision: Awaited<ReturnType<RevisionRepository['save']>>;
      try {
        revision = await context.revisions.save(document, undefined, {
          requireAbsent: true,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'ALREADY_EXISTS')
          return fail(
            'ALREADY_EXISTS',
            `Asset ${document.id} already exists.`,
            '$.identity.assetId',
            'Inspect and revise the winning current identity instead of reinitializing it.',
          );
        return fail(
          'REPOSITORY_ERROR',
          error instanceof Error ? error.message : 'Revision save failed.',
          '$.identity.assetId',
        );
      }
      const completeness = inspectNovelAssetCompleteness(document)!;
      return ok(
        `Initialized incomplete novel identity ${document.id}.`,
        {
          assetId: document.id,
          validation: 'incomplete',
          identity: document.novelIdentity,
          completeness,
        },
        revision.revisionId,
        [document.id],
      );
    }
    const reference = parsed.data.reference!;
    const document = structuredClone(referenceDocuments[reference]);
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
    let revision: Awaited<ReturnType<RevisionRepository['save']>>;
    try {
      revision = await context.revisions.save(validated.document, undefined, {
        requireAbsent: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'ALREADY_EXISTS')
        return fail(
          'ALREADY_EXISTS',
          `Asset ${document.id} already exists.`,
          '$.reference',
          'Inspect and revise the winning current asset instead of resetting it.',
        );
      return fail(
        'REPOSITORY_ERROR',
        error instanceof Error ? error.message : 'Revision save failed.',
        '$.reference',
      );
    }
    return ok(
      `Created ${document.id} from the ${reference} reference.`,
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
    if (parsed.data.restore !== undefined) {
      const target = await context.revisions.get(
        parsed.data.assetId,
        parsed.data.restore.revisionId,
      );
      if (target === undefined)
        return fail(
          'NOT_FOUND',
          `Revision ${parsed.data.restore.revisionId} was not found for ${parsed.data.assetId}.`,
          '$.restore.revisionId',
          'Compare an existing immutable revision before requesting restoration.',
        );
      const comparison = compareSemanticDocuments(
        revision.document,
        target.document,
      );
      if (comparison.changes.length === 0)
        return fail(
          'PATCH_REJECTED',
          'The requested revision is already current.',
          '$.restore.revisionId',
          'Choose a different immutable revision or continue from the current revision.',
        );
      let scene: ReturnType<typeof evaluateDocument>;
      try {
        scene = evaluateDocument(target.document);
      } catch (error) {
        return fail(
          'INVALID_ASSEMBLY',
          error instanceof Error
            ? error.message
            : 'Restored assembly validation failed.',
          '$.restore.revisionId',
          'Restore only an immutable revision whose assembly remains valid.',
        );
      }
      const completeness = inspectNovelAssetCompleteness(target.document);
      if (completeness?.state === 'incomplete')
        return fail(
          'INCOMPLETE_ASSET',
          `Revision ${target.revisionId} is incomplete and cannot become current through restoration.`,
          '$.restore.revisionId',
          'Complete the required roles and attachments in a new revision before restoring it.',
          { actual: completeness, expected: 'complete' },
        );
      if (scene.triangleCount > target.document.triangleBudget)
        return fail(
          'TRIANGLE_BUDGET_EXCEEDED',
          `Restored revision would use ${scene.triangleCount} triangles, exceeding the ${target.document.triangleBudget}-triangle budget.`,
          '$.restore.revisionId',
          'Choose a prior revision that validates within its declared triangle budget.',
          {
            actual: scene.triangleCount,
            expected: `at most ${target.document.triangleBudget}`,
          },
        );
      const state = compareNovelRevisionState(
        revision.document,
        target.document,
      );
      const plan = revisionPlan(
        'restore',
        revision.revisionId,
        target.revisionId,
        comparison,
        state,
        true,
        parsed.data.idOffset,
        parsed.data.idLimit,
      );
      if (parsed.data.dryRun)
        return ok(
          'Restoration dry run succeeded; no revision or current pointer was written.',
          {
            validation: 'valid',
            dryRun: true,
            revisionPlan: plan,
            restoration: {
              previousCurrentRevisionId: revision.revisionId,
              restoredRevisionId: target.revisionId,
            },
          },
          revision.revisionId,
          [...plan.affectedIds],
        );
      if (parsed.data.confirmedPlanId === undefined)
        return fail(
          'DRY_RUN_REQUIRED',
          'Restoration requires confirmation of its deterministic dry-run plan.',
          '$.confirmedPlanId',
          'Dry-run this exact restoration request, then resubmit it with the returned planId.',
          { expected: plan.planId },
        );
      if (parsed.data.confirmedPlanId !== plan.planId)
        return fail(
          'INVALID_VALUE',
          'The confirmed plan does not match the current restoration plan.',
          '$.confirmedPlanId',
          'Repeat the dry run against the current revision and confirm its exact planId.',
          { actual: parsed.data.confirmedPlanId, expected: plan.planId },
        );
      if (context.revisions.restoreCurrent === undefined)
        return fail(
          'SERVICE_UNAVAILABLE',
          'The configured revision repository cannot restore a current pointer.',
          '$.restore',
          'Configure a revision repository with atomic current-pointer restoration.',
        );
      const prospective = ok(
        `Restored current state to immutable revision ${target.revisionId}.`,
        {
          validation: 'valid',
          revisionPlan: plan,
          restoration: {
            previousCurrentRevisionId: revision.revisionId,
            restoredRevisionId: target.revisionId,
          },
        },
        target.revisionId,
        [...plan.affectedIds],
      );
      if (!mutationResponseFits(prospective))
        return fail(
          'RESPONSE_TOO_LARGE',
          'The prospective restoration response exceeds the MCP response budget; the current pointer was not changed.',
          '$.idLimit',
          'Request a smaller semantic ID page or restore between revisions with a narrower reviewed difference.',
          {
            expected: `at most ${MUTATION_RESPONSE_BYTE_LIMIT} serialized bytes`,
          },
        );
      try {
        const restored = await context.revisions.restoreCurrent(
          parsed.data.assetId,
          target.revisionId,
          revision.revisionId,
        );
        return ok(
          `Restored current state to immutable revision ${restored.revisionId}.`,
          {
            validation: 'valid',
            revisionPlan: plan,
            restoration: {
              previousCurrentRevisionId: revision.revisionId,
              restoredRevisionId: restored.revisionId,
            },
          },
          restored.revisionId,
          [...plan.affectedIds],
        );
      } catch (error) {
        if (error instanceof Error && error.message === 'REVISION_CONFLICT')
          return fail(
            'REVISION_CONFLICT',
            'The current revision changed while restoration was being applied.',
            '$.expectedRevisionId',
            'Inspect the current revision and repeat the restoration dry run.',
          );
        return fail(
          'REPOSITORY_ERROR',
          error instanceof Error ? error.message : 'Restoration failed.',
          '$.restore',
        );
      }
    }
    let patch: SemanticPatch;
    let morphologyPlan:
      ReturnType<typeof compileHumanoidMorphology> | undefined;
    if (parsed.data.morphology !== undefined) {
      const existingPartIds = new Set(
        revision.document.assembly.parts.map(({ id }) => id),
      );
      const partMap = existingPartIds.has(RUSTIC_HUMANOID_PART_MAP.torso)
        ? RUSTIC_HUMANOID_PART_MAP
        : existingPartIds.has('body.root')
          ? { ...RUSTIC_HUMANOID_PART_MAP, torso: 'body.root' as const }
          : RUSTIC_HUMANOID_PART_MAP;
      try {
        morphologyPlan = compileHumanoidMorphology(
          parsed.data.morphology,
          partMap,
        );
      } catch (error) {
        if (error instanceof HumanoidMorphologyCompilationError)
          return fail(
            'INVALID_VALUE',
            error.message,
            '$.morphology',
            'Use only the bounded rustic-human morphology profile advertised by the contract.',
          );
        throw error;
      }
      const missingPartIds = morphologyPlan.partAdjustments
        .map(({ partId }) => partId)
        .filter((partId) => !existingPartIds.has(partId));
      if (revision.document.kitId !== morphologyPlan.binding.kitId)
        return fail(
          'INVALID_VALUE',
          'Morphology profile kit does not match the asset kit.',
          '$.morphology.kitId',
          'Apply rustic-human morphology only to a rustic-human asset.',
          {
            actual: revision.document.kitId,
            expected: morphologyPlan.binding.kitId,
          },
        );
      if (missingPartIds.length > 0)
        return fail(
          'INVALID_ASSEMBLY',
          'Asset is missing anatomy required by the registered humanoid morphology compiler.',
          '$.morphology',
          'Complete the rustic humanoid anatomy before applying morphology.',
          {
            actual: missingPartIds,
            expected: 'all 15 registered anatomy parts',
          },
        );
      patch = {
        operations: [
          ...morphologyPlan.partAdjustments.map(
            ({ partId, localRestTransform }) => ({
              operation: 'setPartTransform' as const,
              partId,
              transform: {
                position: [...localRestTransform.position] as [
                  number,
                  number,
                  number,
                ],
                rotation: [...localRestTransform.rotation] as [
                  number,
                  number,
                  number,
                  number,
                ],
                scale: [...localRestTransform.scale] as [
                  number,
                  number,
                  number,
                ],
              },
            }),
          ),
          {
            operation: 'setHumanoidMorphologyProfile',
            profile: morphologyPlan.sourceProfile,
          },
          ...(morphologyPlan.sourceProfile.profileId ===
          REFERENCE_CHIBI_GUARD_MORPHOLOGY_PROFILE_ID
            ? morphologyPlan.referenceGeometry.patch.operations
            : []),
        ],
      };
    } else if (parsed.data.composition === undefined)
      patch = parsed.data.patch!;
    else
      try {
        patch = compileNovelComposition(
          revision.document,
          parsed.data.composition,
        );
      } catch (error) {
        if (error instanceof NovelCompositionError)
          return fail(
            'INVALID_VALUE',
            error.message,
            error.path,
            error.guidance,
          );
        throw error;
      }
    const operationPath =
      parsed.data.morphology !== undefined
        ? '$.morphology'
        : parsed.data.composition === undefined
          ? '$.patch'
          : '$.composition';
    const patched = applySemanticPatch(revision.document, patch);
    if (!patched.ok)
      return {
        ok: false,
        affectedIds: [],
        summary: 'Semantic operations were rejected without mutation.',
        issues: [...patched.issues],
      };
    let scene: ReturnType<typeof evaluateDocument>;
    try {
      scene = evaluateDocument(patched.document);
    } catch (error) {
      return fail(
        'INVALID_ASSEMBLY',
        error instanceof Error ? error.message : 'Assembly validation failed.',
        operationPath,
        'Correct the proposed connections, ports, variants, or pose values before retrying.',
      );
    }
    if (scene.triangleCount > patched.document.triangleBudget)
      return fail(
        'TRIANGLE_BUDGET_EXCEEDED',
        `Operation would use ${scene.triangleCount} triangles, exceeding the ${patched.document.triangleBudget}-triangle budget.`,
        operationPath,
        'Choose a simpler registered template or remove another part before retrying.',
        {
          actual: scene.triangleCount,
          expected: `at most ${patched.document.triangleBudget}`,
        },
      );
    const comparison = compareSemanticDocuments(
      revision.document,
      patched.document,
    );
    if (comparison.changes.length === 0)
      return fail(
        'PATCH_REJECTED',
        'The proposed semantic operation makes no change.',
        operationPath,
        'Inspect the current revision and submit only operations that change semantic state.',
      );
    const completeness = inspectNovelAssetCompleteness(patched.document);
    const priorCompleteness = inspectNovelAssetCompleteness(revision.document);
    if (
      priorCompleteness?.state === 'complete' &&
      completeness?.state === 'incomplete'
    )
      return fail(
        'INCOMPLETE_ASSET',
        'The operation would regress a complete novel identity to an incomplete state.',
        operationPath,
        'Keep every required role attached, or submit a complete replacement plan in one atomic patch.',
        { actual: completeness, expected: 'complete' },
      );
    const state = compareNovelRevisionState(
      revision.document,
      patched.document,
    );
    const broadOrDestructive =
      parsed.data.morphology !== undefined ||
      (revision.document.novelIdentity !== undefined &&
        (patch.operations.length >= 10 ||
          comparison.affectedIds.length >= 25 ||
          comparison.changes.length >= 25 ||
          comparison.changes.some(({ kind }) => kind === 'removed') ||
          canonicalJson(comparison.changes).length >=
            BROAD_SEMANTIC_CHANGE_BYTES ||
          patch.operations.some(
            ({ operation }) =>
              operation === 'removePart' || operation === 'disconnectParts',
          )));
    const planKind =
      parsed.data.morphology !== undefined
        ? 'morphology'
        : parsed.data.composition === undefined
          ? 'patch'
          : 'composition';
    const plan = revisionPlan(
      planKind,
      revision.revisionId,
      contentRevisionId(patched.document),
      comparison,
      state,
      broadOrDestructive,
      parsed.data.idOffset,
      parsed.data.idLimit,
    );
    const operationData =
      parsed.data.morphology !== undefined
        ? { compiledPatch: patch, morphologyPlan, completeness }
        : parsed.data.composition === undefined
          ? {}
          : { compiledPatch: patch, completeness };
    if (parsed.data.dryRun)
      return ok(
        'Dry run succeeded; no revision was written.',
        {
          validation:
            completeness?.state === 'incomplete' ? 'incomplete' : 'valid',
          dryRun: true,
          patchSummary: {
            operationCount: patch.operations.length,
          },
          revisionPlan: plan,
          ...operationData,
        },
        revision.revisionId,
        [...plan.affectedIds],
      );
    if (broadOrDestructive && parsed.data.confirmedPlanId === undefined)
      return fail(
        'DRY_RUN_REQUIRED',
        'Broad or destructive novel-identity work requires confirmation of its deterministic dry-run plan.',
        '$.confirmedPlanId',
        'Dry-run this exact operation, then resubmit it with the returned planId.',
        { expected: plan.planId },
      );
    if (
      parsed.data.confirmedPlanId !== undefined &&
      parsed.data.confirmedPlanId !== plan.planId
    )
      return fail(
        'INVALID_VALUE',
        'The confirmed plan does not match the current semantic plan.',
        '$.confirmedPlanId',
        'Repeat the dry run against the current revision and confirm its exact planId.',
        { actual: parsed.data.confirmedPlanId, expected: plan.planId },
      );
    const prospectiveData = {
      validation: completeness?.state === 'incomplete' ? 'incomplete' : 'valid',
      parentRevisionId: revision.revisionId,
      patchSummary: { operationCount: patch.operations.length },
      revisionPlan: plan,
      ...operationData,
    };
    const prospective = ok(
      `Applied ${comparison.affectedIds.length} localized semantic change(s).`,
      prospectiveData,
      plan.targetRevisionId,
      [...plan.affectedIds],
    );
    if (!mutationResponseFits(prospective))
      return fail(
        'RESPONSE_TOO_LARGE',
        'The prospective success response exceeds the MCP response budget; no revision was written.',
        '$.idLimit',
        'Request a smaller semantic ID page or split the operation into narrower reviewed changes.',
        {
          expected: `at most ${MUTATION_RESPONSE_BYTE_LIMIT} serialized bytes`,
        },
      );
    let saved: Awaited<ReturnType<RevisionRepository['save']>>;
    try {
      saved = await context.revisions.save(
        patched.document,
        revision.revisionId,
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'REVISION_CONFLICT')
        return fail(
          'REVISION_CONFLICT',
          'The asset changed while the semantic operation was being saved.',
          '$.expectedRevisionId',
          'Inspect the new current revision and repeat the dry run or localized operation.',
        );
      return fail(
        'REPOSITORY_ERROR',
        error instanceof Error ? error.message : 'Revision save failed.',
        '$.assetId',
        'Retry after the revision repository becomes available.',
      );
    }
    return ok(
      `Applied ${comparison.affectedIds.length} localized semantic change(s).`,
      {
        validation:
          completeness?.state === 'incomplete' ? 'incomplete' : 'valid',
        ...(saved.parentRevisionId === undefined
          ? {}
          : { parentRevisionId: saved.parentRevisionId }),
        patchSummary: {
          operationCount: patch.operations.length,
        },
        revisionPlan: plan,
        ...operationData,
      },
      saved.revisionId,
      [...plan.affectedIds],
    );
  };
  const applyAccessoryOperation = async (
    input: unknown,
  ): Promise<ToolResultEnvelope> => {
    const parsed = ApplyAccessoryOperationInputSchema.safeParse(input);
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
        'Inspect the current asset and replay the accessory operation against its current revision.',
      );
    let planned: ReturnType<typeof planAccessoryOperation>;
    try {
      planned = planAccessoryOperation(
        revision.document,
        parsed.data.archetypeId,
        parsed.data.operation,
      );
    } catch (error) {
      if (error instanceof AccessoryWorkflowError)
        return fail(
          error.code,
          error.message,
          error.path,
          error.guidance,
          error.detail === undefined ? {} : { actual: error.detail },
        );
      return fail(
        'INVALID_ASSEMBLY',
        error instanceof Error
          ? error.message
          : 'Accessory operation validation failed.',
        '$.operation',
      );
    }
    const comparison = compareSemanticDocuments(
      revision.document,
      planned.document,
    );
    const summary = AccessoryOperationSummarySchema.parse({
      operation: parsed.data.operation.operation,
      dryRun: parsed.data.dryRun,
      parentRevisionId: revision.revisionId,
      partId: planned.partId,
      ...(planned.templateId === undefined
        ? {}
        : { templateId: planned.templateId }),
      ...(planned.equipmentSlot === undefined
        ? {}
        : { equipmentSlot: planned.equipmentSlot }),
      ...(planned.materialId === undefined
        ? {}
        : { materialId: planned.materialId }),
      validation: 'valid',
      affectedIds: planned.primaryAffectedIds,
      addedIds: planned.addedIds,
      removedIds: planned.removedIds,
      connectionIds: planned.connectionIds,
      changePreview: {
        total: comparison.changes.length,
        truncated: comparison.changes.length > 20,
        items: comparison.changes.slice(0, 20),
      },
    });
    if (parsed.data.dryRun)
      return ok(
        'Accessory dry run succeeded; no revision was written.',
        summary,
        revision.revisionId,
        [...summary.affectedIds],
      );
    try {
      const saved = await context.revisions.save(
        planned.document,
        revision.revisionId,
      );
      return ok(
        `Applied accessory ${parsed.data.operation.operation} operation.`,
        summary,
        saved.revisionId,
        [...summary.affectedIds],
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'REVISION_CONFLICT')
        return fail(
          'REVISION_CONFLICT',
          'The asset changed while the accessory operation was being saved.',
          '$.expectedRevisionId',
          'Inspect the new current revision and replay the same task-level operation.',
        );
      return fail(
        'REPOSITORY_ERROR',
        error instanceof Error ? error.message : 'Revision save failed.',
        '$.assetId',
      );
    }
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
    const incomplete = incompleteFailure(revision.document, '$.assetId');
    if (incomplete !== undefined) return incomplete;
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
  const getInterchangeManifest = async (
    input: unknown,
  ): Promise<ToolResultEnvelope> => {
    const parsed = GetInterchangeManifestInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    if (parsed.data.delivery_id !== undefined) {
      const service = context.interchangeService;
      if (
        service?.getDeliveryManifest === undefined &&
        service?.getTemporalManifest === undefined
      )
        return fail(
          'SERVICE_UNAVAILABLE',
          'Immutable delivery retrieval is not configured.',
          '$.delivery_id',
        );
      try {
        const request = {
          assetId: parsed.data.asset_id,
          revisionId: parsed.data.revision_id,
          deliveryId: parsed.data.delivery_id,
        };
        const value =
          service.getDeliveryManifest === undefined
            ? await service.getTemporalManifest!(request)
            : await service.getDeliveryManifest(request);
        if (ForgeAuthoringReviewManifestSchema.safeParse(value).success) {
          const review = await parseForgeAuthoringReviewManifest(value);
          if (
            review.source.asset_id !== parsed.data.asset_id ||
            review.source.revision_id !== parsed.data.revision_id ||
            review.delivery_id !== parsed.data.delivery_id
          )
            return fail(
              'REPOSITORY_ERROR',
              'Authoring review registry returned another immutable delivery.',
              '$.delivery_id',
            );
          return ok(
            'Retrieved deterministic authoring-only comparison evidence; interchange and pack admission remain false.',
            review,
            parsed.data.revision_id,
            review.artifacts.map(({ id }) => id),
          );
        }
        const manifest = ForgeTemporalArtifactsManifestSchema.parse(value);
        if (
          manifest.assetId !== parsed.data.asset_id ||
          manifest.revisionId !== parsed.data.revision_id ||
          manifest.deliveryId !== parsed.data.delivery_id
        )
          return fail(
            'REPOSITORY_ERROR',
            'Temporal registry returned a manifest for another immutable delivery.',
            '$.delivery_id',
          );
        return ok(
          'Retrieved a canonical temporal manifest for the exact immutable delivery.',
          manifest,
          parsed.data.revision_id,
          [
            ...manifest.frames.map(({ id }) => id),
            manifest.atlas.id,
            manifest.sourceGlb.id,
            ...('poseSheets' in manifest
              ? [
                  ...manifest.poseSheets.map(({ id }) => id),
                  manifest.animationBundle.id,
                ]
              : []),
          ],
        );
      } catch (error) {
        return fail(
          'REPOSITORY_ERROR',
          error instanceof Error
            ? error.message
            : 'Temporal manifest retrieval failed.',
          '$.delivery_id',
          'Reject this delivery and rebuild it from complete content-verified temporal artifacts.',
        );
      }
    }
    const resolved = await interchangeManifest(
      parsed.data.asset_id,
      parsed.data.revision_id,
    );
    if ('failure' in resolved) return resolved.failure;
    return ok(
      'Retrieved a canonical manifest for the exact immutable revision.',
      resolved.manifest,
      parsed.data.revision_id,
      resolved.manifest.artifacts.map(({ id }) => id),
    );
  };
  const getInterchangeArtifactChunk = async (
    input: unknown,
  ): Promise<ToolResultEnvelope> => {
    const parsed = GetInterchangeArtifactChunkInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    if (parsed.data.delivery_id !== undefined) {
      if (
        context.interchangeService?.getDeliveryManifest !== undefined &&
        context.interchangeService.getDeliveryArtifactChunk !== undefined
      ) {
        try {
          const value = await context.interchangeService.getDeliveryManifest({
            assetId: parsed.data.asset_id,
            revisionId: parsed.data.revision_id,
            deliveryId: parsed.data.delivery_id,
          });
          if (ForgeAuthoringReviewManifestSchema.safeParse(value).success) {
            const review = await parseForgeAuthoringReviewManifest(value);
            if (parsed.data.record_kind !== 'evidence')
              return fail(
                'INVALID_VALUE',
                'Authoring review deliveries expose evidence records only.',
                '$.record_kind',
              );
            const record = review.artifacts.find(
              ({ id }) => id === parsed.data.artifact_id,
            );
            if (record === undefined)
              return fail(
                'NOT_FOUND',
                `Authoring review evidence ${parsed.data.artifact_id} is not declared.`,
                '$.artifact_id',
              );
            if (
              parsed.data.offset >= record.byte_length ||
              parsed.data.offset + parsed.data.length > record.byte_length
            )
              return fail(
                'INVALID_VALUE',
                'Requested byte range is outside the authoring review evidence.',
                '$.offset',
              );
            const chunk = ForgeInterchangeArtifactChunkSchema.parse(
              await context.interchangeService.getDeliveryArtifactChunk({
                assetId: parsed.data.asset_id,
                revisionId: parsed.data.revision_id,
                deliveryId: parsed.data.delivery_id,
                artifactId: parsed.data.artifact_id,
                recordKind: parsed.data.record_kind,
                offset: parsed.data.offset,
                length: parsed.data.length,
              }),
            );
            const bytes = Buffer.from(chunk.bytes_base64, 'base64');
            const chunkSha256 = createHash('sha256')
              .update(bytes)
              .digest('hex');
            if (
              chunk.record_kind !== 'evidence' ||
              chunk.delivery_id !== parsed.data.delivery_id ||
              chunk.asset_id !== parsed.data.asset_id ||
              chunk.revision_id !== parsed.data.revision_id ||
              chunk.artifact_id !== parsed.data.artifact_id ||
              chunk.artifact_sha256 !== record.sha256 ||
              chunk.chunk_sha256 !== chunkSha256 ||
              chunk.offset !== parsed.data.offset ||
              chunk.length !== parsed.data.length ||
              chunk.total !== record.byte_length ||
              bytes.byteLength !== parsed.data.length
            )
              return fail(
                'REPOSITORY_ERROR',
                'Authoring review registry returned bytes with mismatched immutable bindings.',
                '$.chunk',
              );
            return ok(
              'Retrieved a bounded digest-bound authoring review evidence chunk.',
              chunk,
              parsed.data.revision_id,
              [parsed.data.artifact_id],
            );
          }
        } catch (error) {
          return fail(
            'REPOSITORY_ERROR',
            error instanceof Error
              ? error.message
              : 'Authoring review delivery retrieval failed.',
            '$.chunk',
          );
        }
      }
      if (parsed.data.record_kind !== 'artifact')
        return fail(
          'INVALID_VALUE',
          'Temporal deliveries expose artifact records only.',
          '$.record_kind',
        );
      if (
        context.interchangeService?.getTemporalManifest === undefined ||
        context.interchangeService.getTemporalArtifactChunk === undefined
      )
        return fail(
          'SERVICE_UNAVAILABLE',
          'Temporal interchange retrieval is not configured.',
          '$.delivery_id',
        );
      try {
        const manifest = ForgeTemporalArtifactsManifestSchema.parse(
          await context.interchangeService.getTemporalManifest({
            assetId: parsed.data.asset_id,
            revisionId: parsed.data.revision_id,
            deliveryId: parsed.data.delivery_id,
          }),
        );
        const batchRecord =
          'poseSheets' in manifest
            ? (manifest.poseSheets.find(
                ({ id }) => id === parsed.data.artifact_id,
              ) ??
              (manifest.animationBundle.id === parsed.data.artifact_id
                ? manifest.animationBundle
                : undefined))
            : undefined;
        const record =
          manifest.frames.find(({ id }) => id === parsed.data.artifact_id) ??
          (manifest.atlas.id === parsed.data.artifact_id
            ? manifest.atlas
            : manifest.sourceGlb.id === parsed.data.artifact_id
              ? manifest.sourceGlb
              : batchRecord);
        if (record === undefined)
          return fail(
            'NOT_FOUND',
            `Temporal artifact ${parsed.data.artifact_id} is not declared by the delivery.`,
            '$.artifact_id',
          );
        if (
          parsed.data.offset >= record.byteLength ||
          parsed.data.offset + parsed.data.length > record.byteLength
        )
          return fail(
            'INVALID_VALUE',
            'Requested byte range is outside the temporal artifact.',
            '$.offset',
            'Use a positive chunk fully contained by the declared byteLength.',
            {
              actual: {
                offset: parsed.data.offset,
                length: parsed.data.length,
              },
              expected: { total: record.byteLength },
            },
          );
        const chunk = ForgeInterchangeArtifactChunkSchema.parse(
          await context.interchangeService.getTemporalArtifactChunk({
            assetId: parsed.data.asset_id,
            revisionId: parsed.data.revision_id,
            deliveryId: parsed.data.delivery_id,
            artifactId: parsed.data.artifact_id,
            offset: parsed.data.offset,
            length: parsed.data.length,
          }),
        );
        const bytes = Buffer.from(chunk.bytes_base64, 'base64');
        const chunkSha256 = createHash('sha256').update(bytes).digest('hex');
        if (
          chunk.delivery_id !== parsed.data.delivery_id ||
          chunk.asset_id !== parsed.data.asset_id ||
          chunk.revision_id !== parsed.data.revision_id ||
          chunk.artifact_id !== parsed.data.artifact_id ||
          chunk.artifact_sha256 !== record.sha256 ||
          chunk.chunk_sha256 !== chunkSha256 ||
          chunk.offset !== parsed.data.offset ||
          chunk.length !== parsed.data.length ||
          chunk.total !== record.byteLength ||
          bytes.byteLength !== parsed.data.length
        )
          return fail(
            'REPOSITORY_ERROR',
            'Temporal registry returned bytes with mismatched immutable bindings.',
            '$.chunk',
          );
        return ok(
          'Retrieved a bounded digest-bound chunk from the immutable temporal artifact.',
          chunk,
          parsed.data.revision_id,
          [parsed.data.artifact_id],
        );
      } catch (error) {
        return fail(
          'REPOSITORY_ERROR',
          error instanceof Error
            ? error.message
            : 'Temporal artifact retrieval failed.',
          '$.chunk',
          'Reject the response and rebuild the temporal delivery from verified bytes.',
        );
      }
    }
    const resolved = await interchangeManifest(
      parsed.data.asset_id,
      parsed.data.revision_id,
    );
    if ('failure' in resolved) return resolved.failure;
    const artifact =
      parsed.data.record_kind === 'artifact'
        ? resolved.manifest.artifacts.find(
            ({ id }) => id === parsed.data.artifact_id,
          )
        : undefined;
    const evidence =
      parsed.data.record_kind === 'evidence'
        ? resolved.manifest.evidence.find(
            ({ id }) => id === parsed.data.artifact_id,
          )
        : undefined;
    const record = artifact ?? evidence;
    if (record === undefined)
      return fail(
        'NOT_FOUND',
        `${parsed.data.record_kind} record ${parsed.data.artifact_id} is not declared by the pinned manifest.`,
        '$.artifact_id',
      );
    if (
      artifact !== undefined &&
      (artifact.classification !== 'source' ||
        (artifact.role !== 'directional_frame' && artifact.role !== 'glb'))
    )
      return fail(
        'INVALID_VALUE',
        `Artifact ${artifact.id} is fixture-only derived output.`,
        '$.artifact_id',
        'Retrieve only live source directional_frame PNG or GLB records.',
      );
    const byteLength =
      artifact?.byte_length ??
      (evidence !== undefined && 'byte_length' in evidence
        ? evidence.byte_length
        : undefined);
    if (byteLength === undefined)
      return fail(
        'INVALID_VALUE',
        `Evidence ${record.id} does not declare a retrievable byte length.`,
        '$.artifact_id',
        'Use a live registered evidence record with byte_length.',
      );
    if (
      parsed.data.offset >= byteLength ||
      parsed.data.offset + parsed.data.length > byteLength
    )
      return fail(
        'INVALID_VALUE',
        'Requested byte range is outside the immutable artifact.',
        '$.offset',
        'Use a positive chunk fully contained by the manifest byte_length.',
        {
          actual: {
            offset: parsed.data.offset,
            length: parsed.data.length,
          },
          expected: { total: byteLength },
        },
      );
    try {
      const chunk = ForgeInterchangeArtifactChunkSchema.parse(
        await context.interchangeService!.getArtifactChunk({
          assetId: parsed.data.asset_id,
          revisionId: parsed.data.revision_id,
          artifactId: parsed.data.artifact_id,
          recordKind: parsed.data.record_kind,
          offset: parsed.data.offset,
          length: parsed.data.length,
        }),
      );
      const actualBytes = Buffer.from(chunk.bytes_base64, 'base64').byteLength;
      const actualChunkSha256 = createHash('sha256')
        .update(Buffer.from(chunk.bytes_base64, 'base64'))
        .digest('hex');
      const expected = {
        record_kind: parsed.data.record_kind,
        asset_id: parsed.data.asset_id,
        revision_id: parsed.data.revision_id,
        artifact_id: parsed.data.artifact_id,
        artifact_sha256: record.sha256,
        offset: parsed.data.offset,
        length: parsed.data.length,
        total: byteLength,
      };
      const matches =
        chunk.record_kind === expected.record_kind &&
        chunk.asset_id === expected.asset_id &&
        chunk.revision_id === expected.revision_id &&
        chunk.artifact_id === expected.artifact_id &&
        chunk.artifact_sha256 === expected.artifact_sha256 &&
        chunk.chunk_sha256 === actualChunkSha256 &&
        chunk.offset === expected.offset &&
        chunk.length === expected.length &&
        chunk.total === expected.total &&
        actualBytes === expected.length;
      if (!matches)
        return fail(
          'REPOSITORY_ERROR',
          'Interchange registry returned bytes with mismatched immutable bindings.',
          '$.chunk',
          'Reject the response and rebuild the registry record from verified bytes.',
          { actual: { ...chunk, decoded_byte_length: actualBytes }, expected },
        );
      return ok(
        'Retrieved a bounded digest-bound chunk from the immutable artifact.',
        chunk,
        parsed.data.revision_id,
        [parsed.data.artifact_id],
      );
    } catch (error) {
      return fail(
        'REPOSITORY_ERROR',
        error instanceof Error
          ? error.message
          : 'Interchange artifact retrieval failed.',
        '$.chunk',
        'Reject the response and rebuild the registry record from verified bytes.',
      );
    }
  };
  const renderPreview = async (input: unknown): Promise<ToolResultEnvelope> => {
    const parsed = RenderPreviewInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const revision = await context.revisions.get(
      parsed.data.assetId,
      parsed.data.revisionId,
    );
    if (revision === undefined)
      return fail(
        'NOT_FOUND',
        `Revision ${parsed.data.revisionId} was not found for ${parsed.data.assetId}.`,
        '$.revisionId',
      );
    if (context.renderService === undefined)
      return fail('SERVICE_UNAVAILABLE', 'Rendering is not configured.');
    if (parsed.data.referenceComparison !== undefined) {
      if (context.renderService.renderReferenceComparison === undefined)
        return fail(
          'SERVICE_UNAVAILABLE',
          'Authoring reference comparison rendering is not configured.',
          '$.referenceComparison',
        );
      try {
        const delivery = AuthoringReviewDeliveryReceiptSchema.parse(
          await context.renderService.renderReferenceComparison(
            revision.document,
            revision.revisionId,
          ),
        );
        return ok(
          'Rendered deterministic eye-level authoring review evidence; interchange and pack admission remain false.',
          {
            assetId: parsed.data.assetId,
            revisionId: revision.revisionId,
            state: 'authoring_review_rendered',
            delivery,
          },
          revision.revisionId,
          ['forge.authoring.reference-comparison.v1'],
        );
      } catch (error) {
        reportTrustedServiceFailure('reference-comparison-render', error);
        return fail(
          'REPOSITORY_ERROR',
          'Reference comparison rendering failed without publishing a complete immutable review delivery.',
          '$.referenceComparison',
        );
      }
    }
    if (parsed.data.animation !== undefined) {
      if (context.renderService.renderTemporal === undefined)
        return fail(
          'SERVICE_UNAVAILABLE',
          'Temporal rendering is not configured.',
          '$.animation',
          'Configure a Forge render service that supports temporal frame and atlas delivery.',
        );
      let bundle: RigidAnimationBundle;
      try {
        bundle =
          'contractId' in parsed.data.animation
            ? await compileReferenceFiveClipBatchAuthoringRequest(
                revision.document,
                revision.revisionId,
                parsed.data.animation,
              )
            : await compileRigidAnimationAuthoringRequest(
                revision.document,
                revision.revisionId,
                parsed.data.animation,
              );
      } catch (error) {
        return fail(
          'INVALID_VALUE',
          error instanceof Error
            ? error.message
            : 'Rigid animation authoring failed.',
          '$.animation',
          'Use declared hinge parts, bounded poses, valid temporal keyframes, and distinct frame samples.',
        );
      }
      try {
        const delivery = await context.renderService.renderTemporal(
          revision.document,
          revision.revisionId,
          bundle,
        );
        const plans = bundle.framePlans;
        const clips = bundle.clips;
        const plan = plans[0]!;
        const clip = clips[0]!;
        const batch = clips.length > 1;
        return ok(
          batch
            ? 'Rendered the exact five reference clips as distinct timed samples for the immutable revision.'
            : 'Rendered distinct temporal samples for the exact immutable revision.',
          batch
            ? {
                assetId: parsed.data.assetId,
                revisionId: revision.revisionId,
                state: 'temporal_batch_rendered',
                authoringContractId: 'forge-reference-five-clip-authoring/v1',
                rigSignature: bundle.rig.rigSignature,
                equipmentSignature: bundle.rig.equipmentSignature,
                morphologyRevisionId: bundle.rig.morphologyRevisionId,
                clips: clips.map((currentClip, index) => ({
                  clipId: currentClip.clipId,
                  action: currentClip.action,
                  framePlanId: plans[index]!.framePlanId,
                  frameCount: plans[index]!.frames.length,
                })),
                frameCount: plans.reduce(
                  (total, currentPlan) => total + currentPlan.frames.length,
                  0,
                ),
                delivery,
              }
            : {
                assetId: parsed.data.assetId,
                revisionId: revision.revisionId,
                state: 'temporal_rendered',
                rigSignature: bundle.rig.rigSignature,
                equipmentSignature: bundle.rig.equipmentSignature,
                morphologyRevisionId: bundle.rig.morphologyRevisionId,
                clipId: clip.clipId,
                action: clip.action,
                framePlanId: plan.framePlanId,
                frameCount: plan.frames.length,
                delivery,
              },
          revision.revisionId,
          [
            bundle.rig.rigId,
            ...clips.map(({ clipId }) => clipId),
            ...plans.map(({ framePlanId }) => framePlanId),
          ],
        );
      } catch (error) {
        reportTrustedServiceFailure('temporal-render', error);
        return fail(
          'REPOSITORY_ERROR',
          'Temporal rendering failed without publishing a complete frame and atlas delivery.',
          '$.animation',
          'Inspect trusted Forge service logs, reject partial artifacts, and retry the same immutable animation request.',
        );
      }
    }
    try {
      await context.renderService.render(
        revision.document,
        revision.revisionId,
      );
      return ok(
        'Rendered the exact immutable revision; retrieve portable bytes through the interchange tools.',
        {
          assetId: parsed.data.assetId,
          revisionId: revision.revisionId,
          state: 'rendered',
        },
        revision.revisionId,
      );
    } catch (error) {
      reportTrustedServiceFailure('static-render', error);
      return fail(
        'REPOSITORY_ERROR',
        'Rendering failed without publishing a public artifact response.',
        '$.revisionId',
        'Inspect trusted Forge service logs, correct the producer or immutable-registration failure, and retry the same revision.',
      );
    }
  };
  const exportAsset = async (input: unknown): Promise<ToolResultEnvelope> => {
    const parsed = ExportAssetInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed);
    const revision = await context.revisions.get(
      parsed.data.assetId,
      parsed.data.revisionId,
    );
    if (revision === undefined)
      return fail(
        'NOT_FOUND',
        `Revision ${parsed.data.revisionId} was not found for ${parsed.data.assetId}.`,
        '$.revisionId',
      );
    const incomplete = incompleteFailure(revision.document, '$.revisionId');
    if (incomplete !== undefined) return incomplete;
    if (context.exportService === undefined)
      return fail('SERVICE_UNAVAILABLE', 'GLB export is not configured.');
    try {
      await context.exportService.export(
        revision.document,
        revision.revisionId,
      );
      return ok(
        'Exported the exact immutable revision; retrieve portable bytes through the interchange tools.',
        {
          assetId: parsed.data.assetId,
          revisionId: revision.revisionId,
          state: 'exported',
        },
        revision.revisionId,
      );
    } catch {
      return fail(
        'REPOSITORY_ERROR',
        'GLB export failed without publishing a public artifact response.',
        '$.revisionId',
        'Inspect trusted Forge service logs, correct the producer or immutable-registration failure, and retry the same revision.',
      );
    }
  };
  return {
    listKits,
    inspectCapabilities,
    inspectTemplate,
    searchAccessories,
    inspectAsset,
    compareRevisions,
    createAsset,
    applyAccessoryOperation,
    applyOperations,
    connectParts,
    setPose,
    validateAsset,
    getInterchangeManifest,
    getInterchangeArtifactChunk,
    renderPreview,
    exportAsset,
  };
}

export type ToolHandlers = ReturnType<typeof createToolHandlers>;
