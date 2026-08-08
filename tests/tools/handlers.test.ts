import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { REFERENCE_FIVE_CLIP_ANIMATION_REQUEST } from '../../scripts/replay-public-mcp-reference-five-clip.js';
import {
  AssetInspectionConnectionSchema,
  AssetInspectionDataSchema,
  ForgeAuthoringReviewManifestSchema,
  NovelAssetIdentityRequestSchema,
  SemanticRevisionComparisonSchema,
  forgeAuthoringReviewManifestSha256,
  type AssetDocument,
  type ForgeAuthoringReviewManifest,
} from '../../src/contracts/index.js';
import {
  applySemanticPatch,
  contentRevisionId,
  type RevisionRecord,
  type RevisionRepository,
} from '../../src/document/index.js';
import { evaluateAssembly } from '../../src/assembly/index.js';
import {
  compileHumanoidMorphology,
  compileNovelComposition,
  initializeNovelAssetDocument,
  planNovelAssetBrief,
} from '../../src/fantasy-kit/index.js';
import { inspectHumanoidGeometryRegressions } from '../../src/fantasy-kit/reference-geometry/humanoid-geometry-regressions.js';
import {
  PUBLIC_TOOL_NAMES,
  createToolHandlers,
} from '../../src/tools/index.js';

class MemoryRevisions implements RevisionRepository {
  readonly currentRecords = new Map<string, RevisionRecord>();
  readonly records = new Map<string, RevisionRecord>();
  async save(
    document: Readonly<AssetDocument>,
    expected?: string,
  ): Promise<RevisionRecord> {
    const prior = this.currentRecords.get(document.id);
    if (expected !== undefined && prior?.revisionId !== expected)
      throw new Error('REVISION_CONFLICT');
    const record: RevisionRecord = {
      revisionId: contentRevisionId(document),
      assetId: document.id,
      ...(prior === undefined ? {} : { parentRevisionId: prior.revisionId }),
      createdAt: '2026-07-17T00:00:00.000Z',
      document,
    };
    this.currentRecords.set(document.id, record);
    this.records.set(`${document.id}:${record.revisionId}`, record);
    return record;
  }
  async get(
    assetId: string,
    revisionId: string,
  ): Promise<RevisionRecord | undefined> {
    return this.records.get(`${assetId}:${revisionId}`);
  }
  async getCurrent(assetId: string): Promise<RevisionRecord | undefined> {
    return this.currentRecords.get(assetId);
  }
}

async function authoringManifest(
  assetId: string,
  revisionId: string,
): Promise<ForgeAuthoringReviewManifest> {
  const hashes = ['1', '2', '3', '4', '5'].map((value) => value.repeat(64));
  const views = ['front', 'three-quarter', 'side', 'back'] as const;
  const manifest = ForgeAuthoringReviewManifestSchema.parse({
    contract_id: 'forge-authoring-review-manifest/v1',
    manifest_sha256: '0'.repeat(64),
    delivery_id: `delivery.${'0'.repeat(64)}`,
    source: { asset_id: assetId, revision_id: revisionId },
    profile: {
      id: 'forge.authoring.reference-comparison.v1',
      version: '1.0.0',
      projection: 'orthographic',
      camera: 'eye_level',
      width: 512,
      height: 512,
      elevation_degrees: 0,
      padding_pixels: 32,
      background: '#e8e8e8',
      lighting: 'neutral_three_point_v1',
      views: [
        { view: 'front', yaw_degrees: 0 },
        { view: 'three-quarter', yaw_degrees: 45 },
        { view: 'side', yaw_degrees: 90 },
        { view: 'back', yaw_degrees: 180 },
      ],
    },
    classification: 'authoring_only',
    admission: {
      review_only: true,
      interchange_admitted: false,
      pack_admitted: false,
    },
    artifacts: [
      ...views.map((view, index) => ({
        id: `view.${view}`,
        role: 'comparison_view',
        media_type: 'image/png',
        byte_length: 1,
        sha256: hashes[index],
        width: 512,
        height: 512,
        transparent: false,
        reference: `artifacts/authoring/${assetId}/${revisionId}/reference-comparison/${view}.png`,
        view,
      })),
      {
        id: 'review.contact-sheet',
        role: 'contact_sheet',
        media_type: 'image/png',
        byte_length: 1,
        sha256: hashes[4],
        width: 2048,
        height: 530,
        transparent: false,
        reference: `artifacts/authoring/${assetId}/${revisionId}/reference-comparison/contact-sheet.png`,
      },
    ],
  });
  manifest.manifest_sha256 = await forgeAuthoringReviewManifestSha256(manifest);
  manifest.delivery_id = `delivery.${manifest.manifest_sha256}`;
  return manifest;
}

describe('semantic domain tools', () => {
  it('advertises only the bounded public catalog', () => {
    expect(PUBLIC_TOOL_NAMES).toEqual([
      'list_kits',
      'inspect_capabilities',
      'inspect_template',
      'search_accessories',
      'inspect_asset',
      'compare_revisions',
      'create_asset',
      'apply_accessory_operation',
      'apply_operations',
      'connect_parts',
      'set_pose',
      'validate_asset',
      'get_interchange_manifest',
      'get_interchange_artifact_chunk',
      'render_preview',
      'export_asset',
    ]);
    expect(PUBLIC_TOOL_NAMES.join(' ')).not.toMatch(
      /shell|filesystem|network|mesh|blender|code/i,
    );
  });
  it('discovers kits and templates with no prior project context', async () => {
    const handlers = createToolHandlers({ revisions: new MemoryRevisions() });
    expect((await handlers.listKits({})).ok).toBe(true);
    const inspected = await handlers.inspectTemplate({
      templateId: 'human.torso',
    });
    expect(inspected.ok).toBe(true);
    expect(inspected.data).toMatchObject({
      role: 'anatomy.torso',
      generator: 'beveledBox',
    });
    expect(JSON.stringify(inspected.data)).not.toContain('positions');
  });

  it('dry-runs, confirms, and persists bounded humanoid morphology through public operations', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const created = await handlers.createAsset({ reference: 'adventurer' });
    const morphology = {
      contractId: 'forge-humanoid-morphology/v1' as const,
      profileId: 'morphology.round-guard',
      kitId: 'rustic-human' as const,
      archetypeId: 'humanoid.biped.rustic' as const,
      styleProfile: {
        id: 'cute_chibi_v1' as const,
        version: '1.0.0' as const,
      },
      seed: 7_222,
      proportions: {
        headScale: 0.85,
        headWidth: 0.4,
        headDepth: 0.25,
        craniumRoundness: 0.3,
        torsoLength: -0.45,
        torsoWidth: 0.2,
        torsoDepth: 0.05,
        shoulderWidth: 0.1,
        pelvisWidth: 0.15,
        armLength: -0.2,
        armThickness: 0.15,
        legLength: -0.55,
        legThickness: 0.2,
        handScale: 0.1,
        footScale: 0.25,
        neckLength: -0.4,
      },
      features: {
        hairStyle: 'short_rounded' as const,
        eyeStyle: 'round' as const,
        facialHairStyle: 'none' as const,
        clothingSilhouette: 'light_armor' as const,
      },
      symmetry: { bilateral: true as const },
    };
    const dryRun = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: created.revisionId,
      morphology,
      dryRun: true,
    });
    expect(dryRun).toMatchObject({
      ok: true,
      revisionId: created.revisionId,
      data: {
        dryRun: true,
        patchSummary: { operationCount: 16 },
        revisionPlan: {
          kind: 'morphology',
          broadOrDestructive: true,
          requiresConfirmation: true,
        },
        morphologyPlan: {
          contractId: 'forge-humanoid-morphology-plan/v1',
          validation: { valid: true, partCount: 15 },
        },
      },
    });
    const dryRunData = dryRun.data as {
      revisionPlan: { planId: string };
    };
    const unconfirmed = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: created.revisionId,
      morphology,
    });
    expect(unconfirmed).toMatchObject({
      ok: false,
      issues: [{ code: 'DRY_RUN_REQUIRED' }],
    });

    const applied = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: created.revisionId,
      morphology,
      confirmedPlanId: dryRunData.revisionPlan.planId,
    });
    expect(applied).toMatchObject({
      ok: true,
      data: {
        revisionPlan: { kind: 'morphology' },
        morphologyPlan: { sourceProfile: { profileId: morphology.profileId } },
      },
    });
    const current = await revisions.getCurrent('adventurer.rustic');
    expect(current?.document.morphologyProfile).toEqual(morphology);
    expect(
      current?.document.assembly.parts.find(({ id }) => id === 'head')
        ?.transform.scale,
    ).not.toEqual([1, 1, 1]);
    expect(
      current?.document.assembly.parts.find(({ id }) => id === 'head')?.shape,
    ).toBeUndefined();
  });

  it('atomically matches direct reference morphology compilation through the public handler', async () => {
    const revisions = new MemoryRevisions();
    const identity = NovelAssetIdentityRequestSchema.parse({
      assetId: 'guard.reference-handler-equivalence',
      name: 'Reference Handler Equivalence Guard',
      kitId: 'rustic-human',
      family: 'humanoid',
      archetypeId: 'humanoid.biped.rustic',
      seed: 42,
    });
    let document = initializeNovelAssetDocument(identity);
    const planning = planNovelAssetBrief(
      'original round chibi rustic village sentry wearing a fitted iron helmet',
    );
    if (!planning.supported) throw new Error(planning.blockers.join('; '));
    for (const composition of planning.suggestedOperations) {
      const result = applySemanticPatch(
        document,
        compileNovelComposition(document, composition),
      );
      if (!result.ok) throw new Error(JSON.stringify(result.issues));
      document = result.document;
    }
    const initial = await revisions.save(document);
    const morphology = {
      contractId: 'forge-humanoid-morphology/v1' as const,
      profileId: 'morphology.reference-chibi-guard',
      kitId: 'rustic-human' as const,
      archetypeId: 'humanoid.biped.rustic' as const,
      styleProfile: { id: 'cute_chibi_v1' as const, version: '1.0.0' as const },
      seed: 42,
      proportions: {
        headScale: 1,
        headWidth: 1,
        headDepth: 0.7,
        craniumRoundness: 1,
        torsoLength: -1,
        torsoWidth: 1,
        torsoDepth: 0.25,
        shoulderWidth: 0.8,
        pelvisWidth: 0.65,
        armLength: -0.7,
        armThickness: 0.7,
        legLength: -1,
        legThickness: 0.8,
        handScale: 0.3,
        footScale: 0.35,
        neckLength: -1,
      },
      features: {
        hairStyle: 'short_rounded' as const,
        eyeStyle: 'round' as const,
        facialHairStyle: 'none' as const,
        clothingSilhouette: 'light_armor' as const,
      },
      symmetry: { bilateral: true as const },
    };
    const morphologyPlan = compileHumanoidMorphology(morphology, {
      torso: 'body.root',
      head: 'head',
      pelvis: 'pelvis',
      upperArmLeft: 'upper-arm.left',
      upperArmRight: 'upper-arm.right',
      forearmLeft: 'forearm.left',
      forearmRight: 'forearm.right',
      handLeft: 'hand.left',
      handRight: 'hand.right',
      thighLeft: 'thigh.left',
      thighRight: 'thigh.right',
      shinLeft: 'shin.left',
      shinRight: 'shin.right',
      footLeft: 'foot.left',
      footRight: 'foot.right',
    });
    const directPatch = {
      operations: [
        ...morphologyPlan.partAdjustments.map(
          ({ partId, localRestTransform }) => ({
            operation: 'setPartTransform' as const,
            partId,
            transform: {
              position: [...localRestTransform.position] as [number, number, number],
              rotation: [...localRestTransform.rotation] as [number, number, number, number],
              scale: [...localRestTransform.scale] as [number, number, number],
            },
          }),
        ),
        {
          operation: 'setHumanoidMorphologyProfile' as const,
          profile: morphologyPlan.sourceProfile,
        },
        ...morphologyPlan.referenceGeometry.patch.operations,
      ],
    };
    expect(directPatch.operations).toHaveLength(85);
    const direct = applySemanticPatch(document, directPatch);
    if (!direct.ok) throw new Error(JSON.stringify(direct.issues));

    const handlers = createToolHandlers({ revisions });
    const dryRun = await handlers.applyOperations({
      assetId: identity.assetId,
      expectedRevisionId: initial.revisionId,
      morphology,
      dryRun: true,
    });
    expect(dryRun).toMatchObject({
      ok: true,
      data: { patchSummary: { operationCount: 85 } },
    });
    const planId = (dryRun.data as { revisionPlan: { planId: string } })
      .revisionPlan.planId;
    const applied = await handlers.applyOperations({
      assetId: identity.assetId,
      expectedRevisionId: initial.revisionId,
      morphology,
      confirmedPlanId: planId,
    });
    expect(applied.ok).toBe(true);
    const current = await revisions.getCurrent(identity.assetId);
    expect(current?.document).toEqual(direct.document);
    expect(
      inspectHumanoidGeometryRegressions(
        evaluateAssembly(current!.document.assembly, current!.document.templates),
      ),
    ).toMatchObject({ valid: true, failures: [] });
  });

  it('inspects exact current authoring state through bounded deterministic pages without mutation', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const created = await handlers.createAsset({ reference: 'adventurer' });
    const changed = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: created.revisionId,
      patch: {
        operations: [
          {
            operation: 'setPartShapeParameters',
            partId: 'torso',
            shape: {
              kind: 'beveledBox',
              width: 0.55,
              height: 0.72,
              depth: 0.28,
              bevel: 0.05,
            },
          },
          {
            operation: 'setPartTransform',
            partId: 'torso',
            transform: {
              position: [0.02, 1.25, 0],
              rotation: [0, 0, 0, 1],
              scale: [1.05, 1, 1],
            },
          },
          {
            operation: 'setMaterialBinding',
            partId: 'torso',
            slot: 'body',
            materialId: 'cloth.umber',
          },
          { operation: 'setPartVisibility', partId: 'shield', visible: false },
          { operation: 'setActiveVariant', variantId: 'unequipped' },
        ],
      },
    });
    const posed = await handlers.setPose({
      assetId: 'adventurer.rustic',
      expectedRevisionId: changed.revisionId,
      poseId: 'action',
    });
    expect(posed.ok).toBe(true);
    const recordCount = revisions.records.size;

    const inspected = await handlers.inspectAsset({
      assetId: 'adventurer.rustic',
      section: 'parts',
      offset: 0,
      limit: 100,
    });
    expect(inspected.ok).toBe(true);
    expect(inspected.revisionId).toBe(posed.revisionId);
    expect(inspected.data).toMatchObject({
      id: 'adventurer.rustic',
      unit: 'meter',
      activeVariantId: 'unequipped',
      activePoseId: 'action',
      section: 'parts',
      page: { offset: 0, limit: 100, truncated: false },
    });
    const inspection = inspected.data as {
      items: Array<{
        id: string;
        handedness: string;
        shapeSource: string;
        base: Record<string, unknown>;
        effective: Record<string, unknown>;
        ports: unknown[];
      }>;
    };
    expect(inspection.items.map(({ id }) => id)).toEqual(
      [...inspection.items.map(({ id }) => id)].sort(),
    );
    expect(inspection.items.find(({ id }) => id === 'torso')).toMatchObject({
      handedness: 'neutral',
      shapeSource: 'part',
      base: {
        shape: { kind: 'beveledBox', width: 0.55 },
        transform: {
          position: [0.02, 1.25, 0],
          scale: [1.05, 1, 1],
        },
        materialBindings: [{ slot: 'body', materialId: 'cloth.umber' }],
        visible: true,
      },
    });
    expect(
      inspection.items.find(({ id }) => id === 'upper-arm.left'),
    ).toMatchObject({
      handedness: 'left',
      effective: { jointValueDegrees: -48 },
    });
    expect(inspection.items.find(({ id }) => id === 'shield')).toMatchObject({
      handedness: 'neutral',
      base: { visible: false },
      effective: { visible: false },
    });
    expect(JSON.stringify(inspected.data)).not.toMatch(
      /positions|normals|indices/,
    );

    const connections = await handlers.inspectAsset({
      assetId: 'adventurer.rustic',
      section: 'connections',
      offset: 0,
      limit: 1,
    });
    const connectionData = AssetInspectionDataSchema.parse(connections.data);
    expect(connectionData).toMatchObject({
      section: 'connections',
      page: { offset: 0, limit: 1, truncated: true, nextOffset: 1 },
    });
    const connection = AssetInspectionConnectionSchema.parse(
      connectionData.items?.[0],
    );
    expect(connection.parentPartId).not.toBe('');
    expect(connection.parentPortId).not.toBe('');
    expect(connection.childPartId).not.toBe('');
    expect(connection.childPortId).not.toBe('');
    expect(connection.parentPort.frame.scale).toEqual([1, 1, 1]);
    expect(connection.childPort.frame.scale).toEqual([1, 1, 1]);
    expect(revisions.records.size).toBe(recordCount);

    const invalidPage = await handlers.inspectAsset({
      assetId: 'adventurer.rustic',
      section: 'parts',
      offset: 10_000,
      limit: 1,
    });
    expect(invalidPage).toMatchObject({
      ok: false,
      issues: [{ code: 'INVALID_VALUE', path: '$.offset' }],
    });
    const unknown = await handlers.inspectAsset({
      assetId: 'adventurer.rustic',
      section: 'parts',
      detailEverything: true,
    });
    expect(unknown).toMatchObject({
      ok: false,
      issues: [{ code: 'UNKNOWN_FIELD', path: '$.detailEverything' }],
    });
  });

  it('compares bounded field-level changes and preserved semantic IDs between revisions', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const created = await handlers.createAsset({ reference: 'adventurer' });
    const baseRecord = await revisions.getCurrent('adventurer.rustic');
    const preservedConnectionId =
      baseRecord!.document.assembly.connections[0]!.id;
    const changed = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: created.revisionId,
      patch: {
        operations: [
          { operation: 'setPartVisibility', partId: 'shield', visible: false },
          {
            operation: 'setPartShapeParameters',
            partId: 'torso',
            shape: {
              kind: 'beveledBox',
              width: 0.55,
              height: 0.72,
              depth: 0.28,
              bevel: 0.05,
            },
          },
        ],
      },
    });
    const beforeReads = revisions.records.size;
    const comparisonHandler = (
      handlers as typeof handlers & {
        compareRevisions(input: unknown): Promise<{
          ok: boolean;
          data?: unknown;
          issues: Array<{ code: string; path: string }>;
        }>;
      }
    ).compareRevisions;
    const comparison = await comparisonHandler({
      assetId: 'adventurer.rustic',
      baseRevisionId: created.revisionId,
      targetRevisionId: changed.revisionId,
      offset: 0,
      limit: 100,
    });
    expect(comparison.ok).toBe(true);
    const comparisonData = SemanticRevisionComparisonSchema.parse(
      comparison.data,
    );
    expect(comparisonData).toMatchObject({
      assetId: 'adventurer.rustic',
      baseRevisionId: created.revisionId,
      targetRevisionId: changed.revisionId,
      page: { offset: 0, limit: 100, truncated: false },
    });
    expect(comparisonData.affectedIds).toContain('shield');
    expect(comparisonData.affectedIds).toContain('torso');
    const preservedIds = [...comparisonData.preservedIds];
    let nextIdOffset = comparisonData.preservedIdsPage.nextOffset;
    while (nextIdOffset !== undefined) {
      const preservedPage = SemanticRevisionComparisonSchema.parse(
        (
          await comparisonHandler({
            assetId: 'adventurer.rustic',
            baseRevisionId: created.revisionId,
            targetRevisionId: changed.revisionId,
            offset: 0,
            limit: 100,
            idOffset: nextIdOffset,
            idLimit: 100,
          })
        ).data,
      );
      preservedIds.push(...preservedPage.preservedIds);
      nextIdOffset = preservedPage.preservedIdsPage.nextOffset;
    }
    expect(preservedIds).toContain('sword');
    expect(preservedIds).toContain(preservedConnectionId);
    expect(comparisonData.changes).toContainEqual({
      path: '$.assembly.parts[shield].visible',
      kind: 'changed',
      semanticId: 'shield',
      before: true,
      after: false,
    });
    expect(
      comparisonData.changes.find(
        ({ path }) => path === '$.assembly.parts[torso].shape',
      ),
    ).toMatchObject({
      path: '$.assembly.parts[torso].shape',
      kind: 'added',
      semanticId: 'torso',
    });
    expect(revisions.records.size).toBe(beforeReads);

    const missing = await comparisonHandler({
      assetId: 'adventurer.rustic',
      baseRevisionId: `revision.${'0'.repeat(64)}`,
      targetRevisionId: changed.revisionId,
    });
    expect(missing).toMatchObject({
      ok: false,
      issues: [{ code: 'NOT_FOUND', path: '$.baseRevisionId' }],
    });
  });
  it('creates, locally patches, validates, and rejects stale revisions without mutation', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const created = await handlers.createAsset({ reference: 'adventurer' });
    expect(created.ok).toBe(true);
    const firstRevision = created.revisionId!;
    const patched = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: firstRevision,
      dryRun: false,
      patch: {
        operations: [
          { operation: 'setPartVisibility', partId: 'shield', visible: false },
        ],
      },
    });
    expect(patched.ok).toBe(true);
    expect(patched.affectedIds).toEqual(['shield']);
    const current = await revisions.getCurrent('adventurer.rustic');
    expect(
      current?.document.assembly.parts.find(({ id }) => id === 'torso')
        ?.visible,
    ).toBe(true);
    const stale = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: firstRevision,
      dryRun: false,
      patch: {
        operations: [
          { operation: 'setPartVisibility', partId: 'sword', visible: false },
        ],
      },
    });
    expect(stale.ok).toBe(false);
    expect(stale.issues[0]?.code).toBe('REVISION_CONFLICT');
    expect(
      (await handlers.validateAsset({ assetId: 'adventurer.rustic' })).ok,
    ).toBe(true);
    const changed = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: current!.revisionId,
      dryRun: false,
      patch: {
        operations: [
          { operation: 'setActiveVariant', variantId: 'unequipped' },
          {
            operation: 'setPartShapeParameters',
            partId: 'torso',
            shape: {
              kind: 'beveledBox',
              width: 0.55,
              height: 0.72,
              depth: 0.28,
              bevel: 0.05,
            },
          },
          {
            operation: 'setMaterialBinding',
            partId: 'torso',
            slot: 'body',
            materialId: 'cloth.umber',
          },
        ],
      },
    });
    expect(changed.ok).toBe(true);
    expect(changed.affectedIds).toEqual(['torso', 'unequipped']);
    expect(changed.data).toMatchObject({
      patchSummary: { operationCount: 3 },
    });
    expect(
      (await revisions.getCurrent('adventurer.rustic'))?.document
        .activeVariantId,
    ).toBe('unequipped');
    const shaped = await revisions.getCurrent('adventurer.rustic');
    expect(
      shaped?.document.assembly.parts.find(({ id }) => id === 'torso')?.shape,
    ).toMatchObject({ kind: 'beveledBox', width: 0.55 });
    const noOp = await handlers.applyOperations({
      assetId: 'adventurer.rustic',
      expectedRevisionId: shaped!.revisionId,
      dryRun: false,
      patch: {
        operations: [
          {
            operation: 'setPartShapeParameters',
            partId: 'torso',
            shape: {
              kind: 'beveledBox',
              width: 0.55,
              height: 0.72,
              depth: 0.28,
              bevel: 0.05,
            },
          },
        ],
      },
    });
    expect(noOp.ok).toBe(false);
    expect(await revisions.getCurrent('adventurer.rustic')).toEqual(shaped);
  });

  it('returns stable paths for invalid and out-of-scope tool payloads without mutation', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const unknown = await handlers.listKits({ unexpected: true });
    expect(unknown.ok).toBe(false);
    expect(unknown.issues[0]).toMatchObject({
      code: 'UNKNOWN_FIELD',
      path: '$.unexpected',
    });
    const created = await handlers.createAsset({ reference: 'crate' });
    const before = await revisions.getCurrent('crate.rustic');
    const repeated = await handlers.createAsset({ reference: 'crate' });
    expect(repeated.ok).toBe(false);
    expect(repeated.issues[0]?.code).toBe('ALREADY_EXISTS');
    expect(await revisions.getCurrent('crate.rustic')).toEqual(before);
    const invalidConnection = await handlers.connectParts({
      assetId: 'crate.rustic',
      expectedRevisionId: created.revisionId,
      dryRun: false,
      connection: {
        id: 'invalid.connection',
        parentPartId: 'missing.parent',
        parentPortId: 'missing.port',
        childPartId: 'missing.child',
        childPortId: 'missing.port',
      },
    });
    expect(invalidConnection.ok).toBe(false);
    expect(invalidConnection.issues[0]).toMatchObject({
      code: 'INVALID_ASSEMBLY',
      path: '$.patch',
    });
    expect(await revisions.getCurrent('crate.rustic')).toEqual(before);
    const rejected = await handlers.applyOperations({
      assetId: 'crate.rustic',
      expectedRevisionId: created.revisionId,
      patch: { operations: [{ operation: 'runShell', command: 'true' }] },
    });
    expect(rejected.ok).toBe(false);
    expect(await revisions.getCurrent('crate.rustic')).toEqual(before);
  });
  it('reports and rejects assets over their explicit triangle budget', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    await handlers.createAsset({ reference: 'crate' });
    const current = await revisions.getCurrent('crate.rustic');
    await revisions.save(
      { ...current!.document, triangleBudget: 1 },
      current!.revisionId,
    );
    const result = await handlers.validateAsset({ assetId: 'crate.rustic' });
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({
      code: 'TRIANGLE_BUDGET_EXCEEDED',
      path: '$.triangleBudget',
      actual: 132,
      expected: 'at most 1',
    });
  });

  it('orchestrates render and export through narrow service ports', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({
      revisions,
      renderService: {
        render: async (_document, revisionId) => ({ revisionId, frames: 8 }),
      },
      exportService: {
        export: async (_document, revisionId) => ({
          revisionId,
          format: 'glb',
        }),
      },
    });
    const created = await handlers.createAsset({ reference: 'crate' });
    expect(
      (
        await handlers.renderPreview({
          assetId: 'crate.rustic',
          revisionId: created.revisionId,
        })
      ).data,
    ).toMatchObject({ state: 'rendered', revisionId: created.revisionId });
    expect(
      (
        await handlers.exportAsset({
          assetId: 'crate.rustic',
          revisionId: created.revisionId,
        })
      ).data,
    ).toMatchObject({ state: 'exported', revisionId: created.revisionId });
  });

  it('routes path-free authoring comparison receipts and enforces exclusive render input', async () => {
    const revisions = new MemoryRevisions();
    const digest = 'a'.repeat(64);
    const handlers = createToolHandlers({
      revisions,
      renderService: {
        render: async () => ({}),
        renderReferenceComparison: async () => ({
          contractId: 'forge-authoring-review-manifest/v1',
          deliveryId: `delivery.${digest}`,
          manifestSha256: digest,
          profileId: 'forge.authoring.reference-comparison.v1',
          classification: 'authoring_only',
          admission: {
            review_only: true,
            interchange_admitted: false,
            pack_admitted: false,
          },
          artifactSha256s: ['1', '2', '3', '4', '5'].map((value) =>
            value.repeat(64),
          ),
        }),
      },
    });
    const created = await handlers.createAsset({ reference: 'crate' });
    const request = {
      assetId: 'crate.rustic',
      revisionId: created.revisionId,
      referenceComparison: {
        profileId: 'forge.authoring.reference-comparison.v1',
      },
    } as const;
    const result = await handlers.renderPreview(request);
    expect(result).toMatchObject({
      ok: true,
      data: {
        state: 'authoring_review_rendered',
        delivery: {
          contractId: 'forge-authoring-review-manifest/v1',
          deliveryId: `delivery.${digest}`,
          classification: 'authoring_only',
          admission: {
            review_only: true,
            interchange_admitted: false,
            pack_admitted: false,
          },
        },
      },
    });
    expect(JSON.stringify(result)).not.toMatch(
      /\/(?:tmp|home)\/|[a-z]:\\\\|(?:manifest|contactSheet|frame)Path/i,
    );

    const unavailable = createToolHandlers({
      revisions,
      renderService: { render: async () => ({}) },
    });
    await expect(unavailable.renderPreview(request)).resolves.toMatchObject({
      ok: false,
      issues: [{ code: 'SERVICE_UNAVAILABLE', path: '$.referenceComparison' }],
    });
    await expect(
      handlers.renderPreview({
        ...request,
        animation: REFERENCE_FIVE_CLIP_ANIMATION_REQUEST,
      }),
    ).resolves.toMatchObject({
      ok: false,
      issues: [{ code: 'INVALID_VALUE', path: '$.referenceComparison' }],
    });
    expect(PUBLIC_TOOL_NAMES).toHaveLength(16);
  });

  it('routes authoring manifests and evidence-only chunks through existing delivery retrieval', async () => {
    const revisions = new MemoryRevisions();
    const created = await createToolHandlers({ revisions }).createAsset({
      reference: 'crate',
    });
    const manifest = await authoringManifest(
      'crate.rustic',
      created.revisionId!,
    );
    const bytes = Buffer.from([7]);
    const chunkSha256 = createHash('sha256').update(bytes).digest('hex');
    const handlers = createToolHandlers({
      revisions,
      interchangeService: {
        getManifest: async () => ({}),
        getArtifactChunk: async () => ({}),
        getDeliveryManifest: async () => manifest,
        getDeliveryArtifactChunk: async (request) => ({
          record_kind: 'evidence',
          asset_id: request.assetId,
          revision_id: request.revisionId,
          delivery_id: request.deliveryId,
          artifact_id: request.artifactId,
          artifact_sha256: manifest.artifacts[0]!.sha256,
          chunk_sha256: chunkSha256,
          offset: request.offset,
          length: request.length,
          total: 1,
          bytes_base64: bytes.toString('base64'),
        }),
      },
    });
    const base = {
      asset_id: 'crate.rustic',
      revision_id: created.revisionId,
      delivery_id: manifest.delivery_id,
    };
    await expect(handlers.getInterchangeManifest(base)).resolves.toMatchObject({
      ok: true,
      data: {
        classification: 'authoring_only',
        admission: { interchange_admitted: false, pack_admitted: false },
      },
    });
    await expect(
      handlers.getInterchangeArtifactChunk({
        ...base,
        artifact_id: 'view.front',
        record_kind: 'evidence',
        offset: 0,
        length: 1,
      }),
    ).resolves.toMatchObject({
      ok: true,
      data: {
        record_kind: 'evidence',
        artifact_id: 'view.front',
        bytes_base64: bytes.toString('base64'),
      },
    });
    await expect(
      handlers.getInterchangeArtifactChunk({
        ...base,
        artifact_id: 'view.front',
        record_kind: 'artifact',
        offset: 0,
        length: 1,
      }),
    ).resolves.toMatchObject({
      ok: false,
      issues: [{ code: 'INVALID_VALUE', path: '$.record_kind' }],
    });
  });

  it('compiles semantic animation input and renders distinct temporal frames through the existing public operation', async () => {
    const revisions = new MemoryRevisions();
    let receivedFrameCount = 0;
    const handlers = createToolHandlers({
      revisions,
      renderService: {
        render: async () => ({}),
        renderTemporal: async (_document, _revisionId, bundle) => {
          receivedFrameCount = bundle.framePlans[0]!.frames.length;
          return {
            deliveryId: `delivery.${'a'.repeat(64)}`,
            manifestSha256: 'b'.repeat(64),
          };
        },
      },
    });
    const created = await handlers.createAsset({ reference: 'adventurer' });
    const result = await handlers.renderPreview({
      assetId: 'adventurer.rustic',
      revisionId: created.revisionId,
      animation: {
        rig: {
          id: 'rig.adventurer',
          rootJointId: 'root',
          joints: [
            {
              id: 'root',
              partId: 'torso',
              axis: 'y',
              minimumDegrees: 0,
              maximumDegrees: 0,
              restDegrees: 0,
            },
            {
              id: 'shoulder.left',
              parentJointId: 'root',
              partId: 'upper-arm.left',
              axis: 'z',
              minimumDegrees: -80,
              maximumDegrees: 80,
              restDegrees: 0,
            },
          ],
        },
        poses: [
          {
            id: 'walk.left',
            channels: [{ jointId: 'shoulder.left', valueDegrees: -20 }],
          },
          {
            id: 'walk.right',
            channels: [{ jointId: 'shoulder.left', valueDegrees: 20 }],
          },
        ],
        clip: {
          action: 'walk',
          durationMs: 400,
          interpolation: 'linear',
          rootAnchorPolicy: 'in_place',
          loop: { mode: 'loop', startMs: 0, endMs: 400 },
          keyframes: [
            { id: 'walk.start', timeMs: 0, poseId: 'walk.left' },
            { id: 'walk.end', timeMs: 400, poseId: 'walk.right' },
          ],
        },
        directions: ['S'],
        framesPerSecond: 10,
        seed: 42,
      },
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        state: 'temporal_rendered',
        action: 'walk',
        frameCount: 4,
        delivery: {
          deliveryId: `delivery.${'a'.repeat(64)}`,
          manifestSha256: 'b'.repeat(64),
        },
      },
    });
    expect(receivedFrameCount).toBe(4);
    expect(PUBLIC_TOOL_NAMES).toHaveLength(16);
  });

  it('routes the exact five-clip batch through the existing public render operation', async () => {
    const revisions = new MemoryRevisions();
    const received: { actions: string[]; frameCounts: number[] }[] = [];
    const handlers = createToolHandlers({
      revisions,
      renderService: {
        render: async () => ({}),
        renderTemporal: async (_document, _revisionId, bundle) => {
          received.push({
            actions: bundle.clips.map(({ action }) => action),
            frameCounts: bundle.framePlans.map(({ frames }) => frames.length),
          });
          return {
            deliveryId: `delivery.${'d'.repeat(64)}`,
            contractId: 'forge-temporal-render-batch-artifacts/v1',
          };
        },
      },
    });
    const created = await handlers.createAsset({ reference: 'adventurer' });
    const result = await handlers.renderPreview({
      assetId: 'adventurer.rustic',
      revisionId: created.revisionId,
      animation: REFERENCE_FIVE_CLIP_ANIMATION_REQUEST,
    });
    expect(result).toMatchObject({
      ok: true,
      data: {
        state: 'temporal_batch_rendered',
        authoringContractId: 'forge-reference-five-clip-authoring/v1',
        frameCount: 26,
        clips: [
          { action: 'idle', frameCount: 4 },
          { action: 'walk_forward', frameCount: 6 },
          { action: 'walk_right', frameCount: 6 },
          { action: 'attack', frameCount: 6 },
          { action: 'receive_damage', frameCount: 4 },
        ],
      },
    });
    expect(received).toEqual([
      {
        actions: [
          'idle',
          'walk_forward',
          'walk_right',
          'attack',
          'receive_damage',
        ],
        frameCounts: [4, 6, 6, 6, 4],
      },
    ]);
    expect(PUBLIC_TOOL_NAMES).toHaveLength(16);
  });

  it('keeps temporal render failures generic publicly while recording trusted diagnostics', async () => {
    const revisions = new MemoryRevisions();
    const internalFailure = 'chromium target closed while rendering frame 17';
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    try {
      const handlers = createToolHandlers({
        revisions,
        renderService: {
          render: async () => ({}),
          renderTemporal: async () => {
            throw new Error(internalFailure);
          },
        },
      });
      const created = await handlers.createAsset({ reference: 'adventurer' });
      const result = await handlers.renderPreview({
        assetId: 'adventurer.rustic',
        revisionId: created.revisionId,
        animation: REFERENCE_FIVE_CLIP_ANIMATION_REQUEST,
      });

      expect(result).toMatchObject({
        ok: false,
        issues: [
          {
            code: 'REPOSITORY_ERROR',
            path: '$.animation',
            message:
              'Temporal rendering failed without publishing a complete frame and atlas delivery.',
          },
        ],
      });
      expect(JSON.stringify(result)).not.toContain(internalFailure);
      expect(
        stderr.mock.calls.map(([value]) => String(value)).join(''),
      ).toContain(
        `[fantasy-asset-forge:temporal-render] Error: ${internalFailure}`,
      );
    } finally {
      stderr.mockRestore();
    }
  });

  it('routes the temporal source GLB through the public manifest and bounded chunk branch', async () => {
    const hash = (character: string) => character.repeat(64);
    const revisionId = `revision.${hash('a')}`;
    const deliveryId = `delivery.${hash('b')}`;
    const glbId = `glb.${hash('c')}`;
    const bytes = Buffer.from([1, 2]);
    const chunkSha256 = createHash('sha256').update(bytes).digest('hex');
    const manifest = {
      contractId: 'forge-temporal-render-artifacts/v1',
      assetId: 'guard.rustic',
      revisionId,
      morphologyRevisionId: `morphology.${hash('d')}`,
      rigSignature: `rig.${hash('e')}`,
      equipmentSignature: `equipment.${hash('f')}`,
      clipId: `clip.${hash('1')}`,
      action: 'walk.forward',
      framePlanId: `frame-plan.${hash('2')}`,
      durationMs: 500,
      loop: { mode: 'loop', startMs: 0, endMs: 500 },
      interpolation: 'linear',
      renderProfile: {
        id: 'fantasy.sprite.orthographic.v1',
        version: '1.0.0',
      },
      sourceGlb: {
        id: glbId,
        classification: 'source',
        mediaType: 'model/gltf-binary',
        fileName: 'guard.rustic.glb',
        byteLength: bytes.byteLength,
        sha256: hash('c'),
      },
      frames: [0, 1].map((sequence) => ({
        id: `frame.${hash(sequence === 0 ? '3' : '4')}`,
        sequence,
        direction: 'S',
        sampleTimeMs: sequence * 250,
        fileName: `000${sequence}-s-${sequence * 250}.png`,
        byteLength: 10 + sequence,
        sha256: hash(sequence === 0 ? '5' : '6'),
        metrics: {
          groundAnchorDeviationPixels: 0,
          clippedEdges: [],
          framingEvidence: {
            topMarginPixels: 10,
            centerDeviationPixels: 0,
            worldUnitsPerPixel: 0.03,
          },
        },
      })),
      atlas: {
        id: `atlas.${hash('7')}`,
        fileName: 'atlas.png',
        byteLength: 20,
        sha256: hash('7'),
        width: 256,
        height: 128,
        columns: 2,
        rows: 1,
        rects: [
          {
            frameId: `frame.${hash('3')}`,
            x: 0,
            y: 0,
            width: 128,
            height: 128,
          },
          {
            frameId: `frame.${hash('4')}`,
            x: 128,
            y: 0,
            width: 128,
            height: 128,
          },
        ],
      },
      deliveryId,
    };
    const handlers = createToolHandlers({
      revisions: new MemoryRevisions(),
      interchangeService: {
        getManifest: async () => ({}),
        getArtifactChunk: async () => ({}),
        getTemporalManifest: async () => manifest,
        getTemporalArtifactChunk: async (request) => ({
          record_kind: 'artifact',
          asset_id: request.assetId,
          revision_id: request.revisionId,
          delivery_id: request.deliveryId,
          artifact_id: request.artifactId,
          artifact_sha256: hash('c'),
          chunk_sha256: chunkSha256,
          offset: request.offset,
          length: request.length,
          total: bytes.byteLength,
          bytes_base64: bytes.toString('base64'),
        }),
      },
    });

    const manifestResult = await handlers.getInterchangeManifest({
      asset_id: 'guard.rustic',
      revision_id: revisionId,
      delivery_id: deliveryId,
    });
    expect(manifestResult.ok).toBe(true);
    expect(manifestResult.affectedIds).toContain(glbId);

    const chunkResult = await handlers.getInterchangeArtifactChunk({
      asset_id: 'guard.rustic',
      revision_id: revisionId,
      delivery_id: deliveryId,
      artifact_id: glbId,
      record_kind: 'artifact',
      offset: 0,
      length: bytes.byteLength,
    });
    expect(chunkResult).toMatchObject({
      ok: true,
      data: {
        delivery_id: deliveryId,
        artifact_id: glbId,
        bytes_base64: bytes.toString('base64'),
      },
    });
  });
});
