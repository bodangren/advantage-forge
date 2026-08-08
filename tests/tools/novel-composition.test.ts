import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { evaluateAssembly } from '../../src/assembly/index.js';
import {
  AssetDocumentSchema,
  NovelAddPartOperationSchema,
  NovelAssetArchetypeSchema,
  NovelGrammarPlanningResultSchema,
  type AssetDocument,
  type ToolResultEnvelope,
} from '../../src/contracts/index.js';
import {
  contentRevisionId,
  type RevisionRecord,
  type RevisionRepository,
  type RevisionSaveOptions,
} from '../../src/document/index.js';
import { createToolHandlers } from '../../src/tools/index.js';

class MemoryRevisions implements RevisionRepository {
  readonly current = new Map<string, RevisionRecord>();
  readonly records = new Map<string, RevisionRecord>();
  saveCount = 0;

  async save(
    document: Readonly<AssetDocument>,
    expected?: string,
    options: RevisionSaveOptions = {},
  ): Promise<RevisionRecord> {
    const prior = this.current.get(document.id);
    if (options.requireAbsent && prior !== undefined)
      throw new Error('ALREADY_EXISTS');
    if (expected !== undefined && prior?.revisionId !== expected)
      throw new Error('REVISION_CONFLICT');
    const record: RevisionRecord = {
      revisionId: contentRevisionId(document),
      assetId: document.id,
      ...(prior === undefined ? {} : { parentRevisionId: prior.revisionId }),
      createdAt: '2026-07-22T00:00:00.000Z',
      document,
    };
    this.saveCount += 1;
    this.current.set(document.id, record);
    this.records.set(`${document.id}:${record.revisionId}`, record);
    return record;
  }

  async get(assetId: string, revisionId: string) {
    return this.records.get(`${assetId}:${revisionId}`);
  }

  async getCurrent(assetId: string) {
    return this.current.get(assetId);
  }
}

const barrelIdentity = {
  identity: {
    assetId: 'barrel.ironbound',
    name: 'Ironbound Barrel',
    kitId: 'rustic-human',
    family: 'standalone-prop',
    archetypeId: 'prop.banded-container.rustic',
    seed: 101,
  },
} as const;

const guardIdentity = {
  identity: {
    assetId: 'guard.moonwatch',
    name: 'Moonwatch Guard',
    kitId: 'rustic-human',
    family: 'humanoid',
    archetypeId: 'humanoid.biped.rustic',
    seed: 4_096,
  },
} as const;

const add = (
  partId: string,
  templateId: string,
  role: string,
  parentPartId: string,
  parentPortId: string,
  childPortId: string,
) => ({
  operation: 'add_part',
  partId,
  templateId,
  role,
  attachment: {
    connectionId: `connection.${partId}`,
    parentPartId,
    parentPortId,
    childPortId,
  },
});

const guardParts = [
  add('head', 'human.head', 'anatomy.head', 'body.root', 'neck', 'neck.attach'),
  add(
    'pelvis',
    'human.pelvis',
    'anatomy.pelvis',
    'body.root',
    'hip',
    'torso.attach',
  ),
  add(
    'upper-arm.left',
    'human.upper-arm',
    'anatomy.upper-arm',
    'body.root',
    'shoulder.left',
    'shoulder.attach',
  ),
  add(
    'upper-arm.right',
    'human.upper-arm',
    'anatomy.upper-arm',
    'body.root',
    'shoulder.right',
    'shoulder.attach',
  ),
  add(
    'forearm.left',
    'human.forearm',
    'anatomy.forearm',
    'upper-arm.left',
    'elbow',
    'elbow.attach',
  ),
  add(
    'forearm.right',
    'human.forearm',
    'anatomy.forearm',
    'upper-arm.right',
    'elbow',
    'elbow.attach',
  ),
  add(
    'hand.left',
    'human.hand',
    'anatomy.hand',
    'forearm.left',
    'wrist',
    'wrist.attach',
  ),
  add(
    'hand.right',
    'human.hand',
    'anatomy.hand',
    'forearm.right',
    'wrist',
    'wrist.attach',
  ),
  add(
    'thigh.left',
    'human.thigh',
    'anatomy.thigh',
    'pelvis',
    'leg.left',
    'hip.attach',
  ),
  add(
    'thigh.right',
    'human.thigh',
    'anatomy.thigh',
    'pelvis',
    'leg.right',
    'hip.attach',
  ),
  add(
    'shin.left',
    'human.shin',
    'anatomy.shin',
    'thigh.left',
    'knee',
    'knee.attach',
  ),
  add(
    'shin.right',
    'human.shin',
    'anatomy.shin',
    'thigh.right',
    'knee',
    'knee.attach',
  ),
  add(
    'foot.left',
    'human.foot',
    'anatomy.foot',
    'shin.left',
    'ankle',
    'ankle.attach',
  ),
  add(
    'foot.right',
    'human.foot',
    'anatomy.foot',
    'shin.right',
    'ankle',
    'ankle.attach',
  ),
] as const;

const ListKitsDataSchema = z.object({
  kits: z.array(
    z.object({
      id: z.string(),
      archetypes: z.array(NovelAssetArchetypeSchema),
    }),
  ),
  planning: NovelGrammarPlanningResultSchema.optional(),
});

function listKitsData(result: ToolResultEnvelope) {
  expect(result.ok).toBe(true);
  return ListKitsDataSchema.parse(result.data);
}

async function compose(
  handlers: ReturnType<typeof createToolHandlers>,
  revisions: MemoryRevisions,
  assetId: string,
  composition: unknown,
  dryRun = false,
) {
  const current = await revisions.getCurrent(assetId);
  if (current === undefined) throw new Error('Missing current revision.');
  return handlers.applyOperations({
    assetId,
    expectedRevisionId: current.revisionId,
    composition,
    dryRun,
  });
}

describe('novel identity public grammar composition', () => {
  it.each([
    ['novel identity', barrelIdentity],
    ['fixed reference', { reference: 'crate' }],
  ] as const)(
    'atomically translates a concurrent %s create loser without overwrite',
    async (_label, request) => {
      const revisions = new MemoryRevisions();
      const handlers = createToolHandlers({ revisions });
      const results = await Promise.all([
        handlers.createAsset(request),
        handlers.createAsset(request),
      ]);
      expect(results.filter(({ ok }) => ok)).toHaveLength(1);
      expect(results.filter(({ ok }) => !ok)).toMatchObject([
        { issues: [{ code: 'ALREADY_EXISTS' }] },
      ]);
      expect(revisions.current).toHaveLength(1);
    },
  );

  it('plans guard and barrel briefs from registered grammar and blocks unsupported briefs', async () => {
    const handlers = createToolHandlers({ revisions: new MemoryRevisions() });

    const discovery = listKitsData(await handlers.listKits({}));
    const archetypes = discovery.kits[0]?.archetypes ?? [];
    const humanoid = archetypes.find(({ family }) => family === 'humanoid');
    const head = humanoid?.requirements.find(
      ({ role }) => role === 'anatomy.head',
    );
    expect(head).toMatchObject({
      defaultTemplateId: 'human.head',
      defaultMaterialBindings: [{ slot: 'skin', materialId: 'skin.warm' }],
      requiredPortIds: ['neck.attach'],
    });
    const standaloneProp = archetypes.find(
      ({ family }) => family === 'standalone-prop',
    );
    const reinforcement = standaloneProp?.requirements.find(
      ({ role }) => role === 'prop.reinforcement',
    );
    expect(reinforcement).toMatchObject({
      defaultTemplateId: 'prop.crate-band',
      defaultMaterialBindings: [
        { slot: 'metal', materialId: 'iron.weathered' },
      ],
      requiredPortIds: ['crate.attach'],
    });

    const guardPlanning = listKitsData(
      await handlers.listKits({
        brief:
          'round chibi village guard with iron helmet, spear, and kite shield',
      }),
    ).planning;
    expect(guardPlanning?.supported).toBe(true);
    if (guardPlanning?.supported !== true)
      throw new Error('Expected supported guard planning.');
    expect(guardPlanning.archetypeId).toBe('humanoid.biped.rustic');
    for (const templateId of [
      'human.head',
      'equipment.helmet.iron',
      'equipment.spear',
      'equipment.shield.kite',
    ])
      expect(guardPlanning.compatibleTemplateIds).toContain(templateId);
    expect(
      guardPlanning.suggestedOperations.some(
        ({ operation }) => operation === 'add_part',
      ),
    ).toBe(true);

    const barrelPlanning = listKitsData(
      await handlers.listKits({ brief: 'iron-banded barrel' }),
    ).planning;
    expect(barrelPlanning?.supported).toBe(true);
    if (barrelPlanning?.supported !== true)
      throw new Error('Expected supported barrel planning.');
    expect(barrelPlanning.archetypeId).toBe('prop.banded-container.rustic');
    expect(barrelPlanning.compatibleTemplateIds).toEqual([
      'prop.crate',
      'prop.crate-band',
    ]);

    const unsupportedPlanning = listKitsData(
      await handlers.listKits({
        brief: 'import a dragon wing raw mesh from /tmp/model.glb',
      }),
    ).planning;
    expect(unsupportedPlanning?.supported).toBe(false);
    if (unsupportedPlanning?.supported !== false)
      throw new Error('Expected unsupported planning.');
    expect(unsupportedPlanning.blockers.join(' ')).toMatch(
      /anatomy|raw mesh|filesystem/i,
    );
  });

  it.each([
    [
      'guard',
      guardIdentity,
      'round chibi village guard with iron helmet, spear, and kite shield',
      ['human.torso'],
    ],
    ['barrel', barrelIdentity, 'iron-banded barrel', ['prop.crate']],
  ] as const)(
    'returns a directly executable deterministic %s recipe without the initialized root',
    async (_label, identity, brief, excludedTemplateIds) => {
      const revisions = new MemoryRevisions();
      const handlers = createToolHandlers({ revisions });
      expect(await handlers.createAsset(identity)).toMatchObject({ ok: true });
      const planning = listKitsData(
        await handlers.listKits({ brief }),
      ).planning;
      expect(planning?.supported).toBe(true);
      if (planning?.supported !== true)
        throw new Error('Expected an executable supported recipe.');
      const repeatedPlanning = listKitsData(
        await handlers.listKits({ brief }),
      ).planning;
      expect(repeatedPlanning).toEqual(planning);
      for (const excludedTemplateId of excludedTemplateIds)
        expect(
          planning.suggestedOperations.some(
            ({ templateId }) => templateId === excludedTemplateId,
          ),
        ).toBe(false);

      for (const suggestion of planning.suggestedOperations) {
        const executable = NovelAddPartOperationSchema.safeParse(suggestion);
        expect(executable.success).toBe(true);
        if (!executable.success)
          throw new Error('Planner suggestion was not directly executable.');
        expect(
          await compose(
            handlers,
            revisions,
            identity.identity.assetId,
            executable.data,
          ),
        ).toMatchObject({ ok: true });
      }
      expect(
        await handlers.validateAsset({ assetId: identity.identity.assetId }),
      ).toMatchObject({ ok: true, data: { validation: 'valid' } });
    },
    15_000,
  );

  it('bounds the complete advertised guard recipe at 2,500 triangles', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    await handlers.createAsset(guardIdentity);
    const planning = listKitsData(
      await handlers.listKits({
        brief:
          'round chibi village guard with iron helmet, spear, and kite shield',
      }),
    ).planning;
    if (planning?.supported !== true)
      throw new Error('Expected an executable supported recipe.');
    for (const suggestion of planning.suggestedOperations)
      expect(
        await compose(
          handlers,
          revisions,
          guardIdentity.identity.assetId,
          suggestion,
        ),
      ).toMatchObject({ ok: true });

    const complete = await revisions.getCurrent(guardIdentity.identity.assetId);
    if (complete === undefined) throw new Error('Expected complete guard.');
    expect(complete.document.triangleBudget).toBe(2_500);
    expect(
      evaluateAssembly(complete.document.assembly, complete.document.templates)
        .triangleCount,
    ).toBe(2_375);

    const before = revisions.saveCount;
    expect(
      await handlers.applyOperations({
        assetId: guardIdentity.identity.assetId,
        expectedRevisionId: complete.revisionId,
        patch: {
          operations: [
            {
              operation: 'setPartShapeParameters',
              partId: 'head',
              shape: {
                kind: 'ellipsoid',
                radiusX: 0.19,
                radiusY: 0.23,
                radiusZ: 0.18,
                widthSegments: 113,
                heightSegments: 2,
              },
            },
          ],
        },
      }),
    ).toMatchObject({
      ok: false,
      issues: [
        {
          code: 'TRIANGLE_BUDGET_EXCEEDED',
          actual: 2_501,
          expected: 'at most 2500',
        },
      ],
    });
    expect(revisions.saveCount).toBe(before);
  }, 15_000);

  it('dry-runs and applies deterministic barrel composition through closed patches', async () => {
    const firstRepo = new MemoryRevisions();
    const secondRepo = new MemoryRevisions();
    const first = createToolHandlers({ revisions: firstRepo });
    const second = createToolHandlers({ revisions: secondRepo });
    await first.createAsset(barrelIdentity);
    await second.createAsset(barrelIdentity);
    const lowBand = add(
      'band.low',
      'prop.crate-band',
      'prop.reinforcement',
      'container.body',
      'band.low',
      'crate.attach',
    );
    const highBand = add(
      'band.high',
      'prop.crate-band',
      'prop.reinforcement',
      'container.body',
      'band.high',
      'crate.attach',
    );

    const beforeDryRun = firstRepo.saveCount;
    expect(
      await compose(
        first,
        firstRepo,
        barrelIdentity.identity.assetId,
        lowBand,
        true,
      ),
    ).toMatchObject({
      ok: true,
      data: {
        dryRun: true,
        compiledPatch: {
          operations: [{ operation: 'addPart' }, { operation: 'connectParts' }],
        },
        completeness: { state: 'incomplete' },
      },
    });
    expect(firstRepo.saveCount).toBe(beforeDryRun);

    for (const operation of [lowBand, highBand]) {
      expect(
        await compose(
          first,
          firstRepo,
          barrelIdentity.identity.assetId,
          operation,
        ),
      ).toMatchObject({
        ok: true,
        data: {
          compiledPatch: {
            operations: [
              { operation: 'addPart' },
              { operation: 'connectParts' },
            ],
          },
        },
      });
      expect(
        await compose(
          second,
          secondRepo,
          barrelIdentity.identity.assetId,
          operation,
        ),
      ).toMatchObject({ ok: true });
    }

    const firstCurrent = await firstRepo.getCurrent(
      barrelIdentity.identity.assetId,
    );
    const secondCurrent = await secondRepo.getCurrent(
      barrelIdentity.identity.assetId,
    );
    expect(firstCurrent?.revisionId).toBe(secondCurrent?.revisionId);
    expect(firstCurrent?.document).toEqual(secondCurrent?.document);
    expect(
      await first.validateAsset({ assetId: barrelIdentity.identity.assetId }),
    ).toMatchObject({
      ok: true,
      data: { validation: 'valid' },
    });
  });

  it('completes the humanoid required-role graph without caller-authored transforms', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    await handlers.createAsset(guardIdentity);

    for (const operation of guardParts)
      expect(
        await compose(
          handlers,
          revisions,
          guardIdentity.identity.assetId,
          operation,
        ),
      ).toMatchObject({ ok: true });

    expect(
      await handlers.inspectAsset({ assetId: guardIdentity.identity.assetId }),
    ).toMatchObject({
      ok: true,
      data: {
        completeness: {
          state: 'complete',
          missingRequirements: [],
          unattachedPartIds: [],
        },
      },
    });
    expect(
      await handlers.validateAsset({ assetId: guardIdentity.identity.assetId }),
    ).toMatchObject({ ok: true, data: { validation: 'valid' } });
  });

  it('rejects raw transforms, unsupported roles/templates, and conflicting ports without mutation', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    await handlers.createAsset(barrelIdentity);
    const initial = await revisions.getCurrent(barrelIdentity.identity.assetId);
    const lowBand = add(
      'band.low',
      'prop.crate-band',
      'prop.reinforcement',
      'container.body',
      'band.low',
      'crate.attach',
    );

    for (const operation of [
      { ...lowBand, transform: { position: [99, 99, 99] } },
      { ...lowBand, role: 'anatomy.head' },
      { ...lowBand, templateId: 'human.head' },
      { ...lowBand, sourcePath: '/tmp/source.ts' },
    ])
      expect(
        await compose(
          handlers,
          revisions,
          barrelIdentity.identity.assetId,
          operation,
        ),
      ).toMatchObject({ ok: false });
    expect(
      (await revisions.getCurrent(barrelIdentity.identity.assetId))?.revisionId,
    ).toBe(initial?.revisionId);

    expect(
      await compose(
        handlers,
        revisions,
        barrelIdentity.identity.assetId,
        lowBand,
      ),
    ).toMatchObject({ ok: true });
    const afterLow = await revisions.getCurrent(
      barrelIdentity.identity.assetId,
    );
    const occupied = await compose(
      handlers,
      revisions,
      barrelIdentity.identity.assetId,
      {
        ...lowBand,
        partId: 'band.duplicate',
        attachment: {
          ...lowBand.attachment,
          connectionId: 'connection.band.duplicate',
        },
      },
    );
    expect(occupied.ok).toBe(false);
    expect(occupied.issues[0]?.code).toBe('INVALID_ASSEMBLY');
    expect(occupied.issues[0]?.message).toMatch(/occupied/i);
    expect(
      (await revisions.getCurrent(barrelIdentity.identity.assetId))?.revisionId,
    ).toBe(afterLow?.revisionId);
  });

  it('reports unattached semantic paths and rejects budget-breaking composition before save', async () => {
    const revisions = new MemoryRevisions();
    const handlers = createToolHandlers({ revisions });
    const created = await handlers.createAsset(guardIdentity);
    await handlers.applyOperations({
      assetId: guardIdentity.identity.assetId,
      expectedRevisionId: created.revisionId,
      patch: {
        operations: [
          {
            operation: 'addPart',
            part: {
              id: 'head.unattached',
              templateId: 'human.head',
              handedness: 'neutral',
              transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0, 1],
                scale: [1, 1, 1],
              },
              materialBindings: [{ slot: 'skin', materialId: 'skin.warm' }],
              visible: true,
            },
          },
        ],
      },
    });
    const incomplete = await handlers.validateAsset({
      assetId: guardIdentity.identity.assetId,
    });
    expect(incomplete.ok).toBe(false);
    expect(incomplete.issues[0]?.code).toBe('INCOMPLETE_ASSET');
    expect(incomplete.issues[0]?.path).toContain('head.unattached');
    expect(incomplete.issues[0]?.guidance).toMatch(/connect/i);

    const current = await revisions.getCurrent(guardIdentity.identity.assetId);
    if (current === undefined) throw new Error('Expected current guard.');
    const constrained = AssetDocumentSchema.parse({
      ...current.document,
      triangleBudget: 1,
    });
    const constrainedRevision = await revisions.save(
      constrained,
      current.revisionId,
    );
    const before = revisions.saveCount;
    expect(
      await handlers.applyOperations({
        assetId: guardIdentity.identity.assetId,
        expectedRevisionId: constrainedRevision.revisionId,
        composition: add(
          'pelvis',
          'human.pelvis',
          'anatomy.pelvis',
          'body.root',
          'hip',
          'torso.attach',
        ),
      }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: 'TRIANGLE_BUDGET_EXCEEDED' }],
    });
    expect(revisions.saveCount).toBe(before);
  });
});
