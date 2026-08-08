import {
  AssetDocumentSchema,
  NOVEL_ASSET_IDENTITY_CONTRACT_ID,
  NovelAssetArchetypeSchema,
  NovelAssetCompletenessSchema,
  type AssetDocument,
  type NovelAssetArchetype,
  type NovelAssetCompleteness,
  type NovelAssetIdentityRequest,
} from '../contracts/index.js';

import { rusticMaterials, rusticTemplates } from './catalog.js';

function registerArchetype(value: unknown): NovelAssetArchetype {
  const archetype = NovelAssetArchetypeSchema.parse(value);
  for (const requirement of archetype.requirements) {
    const template = rusticTemplates.find(
      ({ id }) => id === requirement.defaultTemplateId,
    );
    if (template?.role !== requirement.role)
      throw new Error(
        `Archetype ${archetype.id} default template ${requirement.defaultTemplateId} does not provide ${requirement.role}.`,
      );
    for (const portId of requirement.requiredPortIds)
      if (!template.ports.some(({ id }) => id === portId))
        throw new Error(
          `Archetype ${archetype.id} requires missing port ${template.id}.${portId}.`,
        );
    for (const binding of requirement.defaultMaterialBindings) {
      if (!template.materialSlots.includes(binding.slot))
        throw new Error(
          `Archetype ${archetype.id} requires missing material slot ${template.id}.${binding.slot}.`,
        );
      if (!rusticMaterials.some(({ id }) => id === binding.materialId))
        throw new Error(
          `Archetype ${archetype.id} requires missing material ${binding.materialId}.`,
        );
    }
  }
  return archetype;
}

const humanoid = registerArchetype({
  id: 'humanoid.biped.rustic',
  family: 'humanoid',
  name: 'Rustic Biped Humanoid',
  requirements: [
    {
      role: 'anatomy.torso',
      requiredCount: 1,
      defaultTemplateId: 'human.torso',
      defaultMaterialBindings: [{ slot: 'body', materialId: 'cloth.moss' }],
      requiredPortIds: ['neck', 'hip', 'shoulder.left', 'shoulder.right'],
    },
    {
      role: 'anatomy.head',
      requiredCount: 1,
      defaultTemplateId: 'human.head',
      defaultMaterialBindings: [{ slot: 'skin', materialId: 'skin.warm' }],
      requiredPortIds: ['neck.attach'],
    },
    {
      role: 'anatomy.pelvis',
      requiredCount: 1,
      defaultTemplateId: 'human.pelvis',
      defaultMaterialBindings: [{ slot: 'cloth', materialId: 'cloth.moss' }],
      requiredPortIds: ['torso.attach', 'leg.left', 'leg.right'],
    },
    {
      role: 'anatomy.upper-arm',
      requiredCount: 2,
      defaultTemplateId: 'human.upper-arm',
      defaultMaterialBindings: [{ slot: 'cloth', materialId: 'cloth.moss' }],
      requiredPortIds: ['shoulder.attach', 'elbow'],
    },
    {
      role: 'anatomy.forearm',
      requiredCount: 2,
      defaultTemplateId: 'human.forearm',
      defaultMaterialBindings: [{ slot: 'skin', materialId: 'skin.warm' }],
      requiredPortIds: ['elbow.attach', 'wrist'],
    },
    {
      role: 'anatomy.hand',
      requiredCount: 2,
      defaultTemplateId: 'human.hand',
      defaultMaterialBindings: [{ slot: 'skin', materialId: 'skin.warm' }],
      requiredPortIds: ['wrist.attach'],
    },
    {
      role: 'anatomy.thigh',
      requiredCount: 2,
      defaultTemplateId: 'human.thigh',
      defaultMaterialBindings: [{ slot: 'cloth', materialId: 'cloth.moss' }],
      requiredPortIds: ['hip.attach', 'knee'],
    },
    {
      role: 'anatomy.shin',
      requiredCount: 2,
      defaultTemplateId: 'human.shin',
      defaultMaterialBindings: [{ slot: 'cloth', materialId: 'cloth.moss' }],
      requiredPortIds: ['knee.attach', 'ankle'],
    },
    {
      role: 'anatomy.foot',
      requiredCount: 2,
      defaultTemplateId: 'human.foot',
      defaultMaterialBindings: [
        { slot: 'leather', materialId: 'leather.dark' },
      ],
      requiredPortIds: ['ankle.attach'],
    },
  ],
  allowedTemplateIds: [
    'human.torso',
    'human.head',
    'human.hair',
    'human.hair-back',
    'human.hair-side',
    'human.face-eye',
    'human.face-nose',
    'human.face-ear',
    'human.face-mouth',
    'human.helmet-crest',
    'human.hair-fringe',
    'human.helmet-dome',
    'human.helmet-emblem',
    'human.helmet-ridge',
    'human.helmet-stud',
    'human.pelvis',
    'human.upper-arm',
    'human.forearm',
    'human.hand',
    'human.thigh',
    'human.shin',
    'human.foot',
    'human.boot-toe',
    'human.boot-sole',
    'human.tunic',
    'human.tunic-flared',
    'human.tunic-trim',
    'human.scarf-collar',
    'human.sleeve-cuff',
    'human.guard-belt',
    'human.guard-pouch',
    'human.boot-cuff',
    'equipment.helmet.iron',
    'equipment.spear',
    'equipment.shield.kite',
  ],
});

const standaloneProp = registerArchetype({
  id: 'prop.banded-container.rustic',
  family: 'standalone-prop',
  name: 'Rustic Banded Container',
  requirements: [
    {
      role: 'prop.container',
      requiredCount: 1,
      defaultTemplateId: 'prop.crate',
      defaultMaterialBindings: [{ slot: 'wood', materialId: 'wood.oak' }],
      requiredPortIds: ['band.low', 'band.high'],
    },
    {
      role: 'prop.reinforcement',
      requiredCount: 2,
      defaultTemplateId: 'prop.crate-band',
      defaultMaterialBindings: [
        { slot: 'metal', materialId: 'iron.weathered' },
      ],
      requiredPortIds: ['crate.attach'],
    },
  ],
  allowedTemplateIds: ['prop.crate', 'prop.crate-band'],
});

export const NOVEL_ASSET_ARCHETYPES: readonly NovelAssetArchetype[] =
  Object.freeze([humanoid, standaloneProp]);

function archetypeFor(
  document: Pick<AssetDocument, 'novelIdentity'>,
): NovelAssetArchetype | undefined {
  const archetypeId = document.novelIdentity?.archetypeId;
  return NOVEL_ASSET_ARCHETYPES.find(({ id }) => id === archetypeId);
}

export function inspectNovelAssetCompleteness(
  document: Readonly<AssetDocument>,
): NovelAssetCompleteness | undefined {
  const archetype = archetypeFor(document);
  if (archetype === undefined) return undefined;
  const templateById = new Map(
    document.templates.map((template) => [template.id, template]),
  );
  const counts = new Map<string, number>();
  for (const part of document.assembly.parts) {
    const role = templateById.get(part.templateId)?.role;
    if (role !== undefined) counts.set(role, (counts.get(role) ?? 0) + 1);
  }
  const presentRoles = [...counts]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([role, presentCount]) => ({ role, presentCount }));
  const missingRequirements = archetype.requirements
    .map(({ role, requiredCount }) => ({
      role,
      requiredCount,
      presentCount: counts.get(role) ?? 0,
    }))
    .filter(({ presentCount, requiredCount }) => presentCount < requiredCount);
  const connectedChildren = new Set(
    document.assembly.connections.map(({ childPartId }) => childPartId),
  );
  const rootRole = archetype.requirements[0]?.role;
  const rootPartId = document.assembly.parts
    .filter(
      ({ templateId }) =>
        rootRole !== undefined &&
        templateById.get(templateId)?.role === rootRole,
    )
    .map(({ id }) => id)
    .sort()[0];
  const unattachedPartIds = document.assembly.parts
    .map(({ id }) => id)
    .filter((id) => id !== rootPartId && !connectedChildren.has(id))
    .sort();
  return NovelAssetCompletenessSchema.parse({
    state:
      missingRequirements.length === 0 && unattachedPartIds.length === 0
        ? 'complete'
        : 'incomplete',
    presentRoles,
    missingRequirements,
    unattachedPartIds,
  });
}

export function initializeNovelAssetDocument(
  identity: NovelAssetIdentityRequest,
): AssetDocument {
  const humanoidIdentity = identity.family === 'humanoid';
  const rootTemplateId = humanoidIdentity ? 'human.torso' : 'prop.crate';
  const rootPartId = humanoidIdentity ? 'body.root' : 'container.body';
  return AssetDocumentSchema.parse({
    schemaVersion: '1.0.0',
    id: identity.assetId,
    name: identity.name,
    unit: 'meter',
    seed: identity.seed,
    kitId: identity.kitId,
    triangleBudget: humanoidIdentity ? 2_500 : 2_000,
    materials: [...rusticMaterials],
    templates: [...rusticTemplates],
    assembly: {
      id: 'identity.assembly',
      parts: [
        {
          id: rootPartId,
          templateId: rootTemplateId,
          handedness: 'neutral',
          transform: {
            position: humanoidIdentity ? [0, 1.42, 0] : [0, 0.38, 0],
            rotation: [0, 0, 0, 1],
            scale: [1, 1, 1],
          },
          materialBindings: [
            humanoidIdentity
              ? { slot: 'body', materialId: 'cloth.moss' }
              : { slot: 'wood', materialId: 'wood.oak' },
          ],
          visible: true,
        },
      ],
      connections: [],
    },
    variants: [],
    poses: [],
    renderProfiles: [
      {
        id: 'sprite.default',
        widthPixels: 128,
        heightPixels: 128,
        elevationDegrees: 30,
        directions: 8,
        paddingPixels: 6,
        transparent: true,
        minimumFeaturePixels: 3,
        requiredFeaturePartIds: [rootPartId],
      },
    ],
    novelIdentity: {
      contractId: NOVEL_ASSET_IDENTITY_CONTRACT_ID,
      origin: 'novel',
      family: identity.family,
      archetypeId: identity.archetypeId,
      styleProfile: identity.styleProfile,
      renderProfile: identity.renderProfile,
    },
  });
}
