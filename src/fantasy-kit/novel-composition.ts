import {
  NovelGrammarPlanningResultSchema,
  type AssetDocument,
  type NovelCompositionOperation,
  type NovelGrammarPlanningResult,
  type PartTemplateDefinition,
} from '../contracts/index.js';
import type { SemanticPatch } from '../document/index.js';

import { NOVEL_ASSET_ARCHETYPES } from './novel-identities.js';

const addSuggestion = (
  partId: string,
  templateId: string,
  role: string,
  materialId: string,
  parentPartId: string,
  parentPortId: string,
  childPortId: string,
) => ({
  operation: 'add_part' as const,
  partId,
  templateId,
  role,
  materialId,
  attachment: {
    connectionId: `connection.${partId}`,
    parentPartId,
    parentPortId,
    childPortId,
  },
});

const HUMANOID_REQUIRED_RECIPE = [
  addSuggestion(
    'head',
    'human.head',
    'anatomy.head',
    'skin.warm',
    'body.root',
    'neck',
    'neck.attach',
  ),
  addSuggestion(
    'pelvis',
    'human.pelvis',
    'anatomy.pelvis',
    'cloth.moss',
    'body.root',
    'hip',
    'torso.attach',
  ),
  ...(['left', 'right'] as const).flatMap((side) => [
    addSuggestion(
      `upper-arm.${side}`,
      'human.upper-arm',
      'anatomy.upper-arm',
      'cloth.moss',
      'body.root',
      `shoulder.${side}`,
      'shoulder.attach',
    ),
    addSuggestion(
      `forearm.${side}`,
      'human.forearm',
      'anatomy.forearm',
      'skin.warm',
      `upper-arm.${side}`,
      'elbow',
      'elbow.attach',
    ),
    addSuggestion(
      `hand.${side}`,
      'human.hand',
      'anatomy.hand',
      'skin.warm',
      `forearm.${side}`,
      'wrist',
      'wrist.attach',
    ),
    addSuggestion(
      `thigh.${side}`,
      'human.thigh',
      'anatomy.thigh',
      'cloth.moss',
      'pelvis',
      `leg.${side}`,
      'hip.attach',
    ),
    addSuggestion(
      `shin.${side}`,
      'human.shin',
      'anatomy.shin',
      'cloth.moss',
      `thigh.${side}`,
      'knee',
      'knee.attach',
    ),
    addSuggestion(
      `foot.${side}`,
      'human.foot',
      'anatomy.foot',
      'leather.dark',
      `shin.${side}`,
      'ankle',
      'ankle.attach',
    ),
  ]),
] as const;

const HUMANOID_FEATURE_RECIPE = [
  addSuggestion(
    'tunic',
    'human.tunic-flared',
    'clothing.tunic-shell',
    'cloth.moss',
    'body.root',
    'clothing.tunic',
    'torso.attach',
  ),
  addSuggestion(
    'tunic.trim',
    'human.tunic-trim',
    'clothing.tunic-trim',
    'cloth.guard-trim',
    'body.root',
    'clothing.trim',
    'torso.attach',
  ),
  addSuggestion(
    'belt',
    'human.guard-belt',
    'clothing.belt',
    'leather.guard-brown',
    'body.root',
    'clothing.belt',
    'torso.attach',
  ),
  addSuggestion(
    'collar',
    'human.scarf-collar',
    'clothing.scarf-collar',
    'cloth.guard-trim',
    'body.root',
    'clothing.collar',
    'torso.attach',
  ),
  ...(['left', 'right'] as const).map((side) =>
    addSuggestion(
      `pouch.${side}`,
      'human.guard-pouch',
      'clothing.pouch',
      'leather.guard-brown',
      'body.root',
      `clothing.pouch.${side}`,
      'torso.attach',
    ),
  ),
  addSuggestion(
    'pouch.center',
    'human.guard-pouch',
    'clothing.pouch',
    'leather.guard-brown',
    'body.root',
    'clothing.pouch.center',
    'torso.attach',
  ),
  ...(['left', 'right'] as const).map((side) =>
    addSuggestion(
      `face.eye.${side}`,
      'human.face-eye',
      'feature.face-eye',
      'face.ink',
      'head',
      `face.eye.${side}`,
      'head.attach',
    ),
  ),
  addSuggestion(
    'face.mouth',
    'human.face-mouth',
    'feature.face-mouth',
    'mouth.soft',
    'head',
    'face.mouth',
    'head.attach',
  ),
  addSuggestion(
    'face.nose',
    'human.face-nose',
    'feature.face-nose',
    'skin.peach',
    'head',
    'face.nose',
    'head.attach',
  ),
  ...(['left', 'right'] as const).map((side) =>
    addSuggestion(
      `face.ear.${side}`,
      'human.face-ear',
      'feature.face-ear',
      'skin.peach',
      'head',
      `face.ear.${side}`,
      'head.attach',
    ),
  ),
  ...(['left', 'right'] as const).map((side) =>
    addSuggestion(
      `hair.side.${side}`,
      'human.hair-side',
      'feature.hair-side',
      'hair.chestnut',
      'head',
      `hair.side.${side}`,
      'head.attach',
    ),
  ),
  addSuggestion(
    'hair.back',
    'human.hair-back',
    'feature.hair-back',
    'hair.chestnut',
    'head',
    'hair.back',
    'head.attach',
  ),
  ...(['left', 'center', 'right'] as const).map((side) =>
    addSuggestion(
      `hair.fringe.${side}`,
      'human.hair-fringe',
      'feature.hair-fringe',
      'hair.chestnut',
      'head',
      `hair.fringe.${side}`,
      'head.attach',
    ),
  ),
  ...(['left', 'right'] as const).flatMap((side) => [
    addSuggestion(
      `sleeve.cuff.${side}`,
      'human.sleeve-cuff',
      'clothing.sleeve-cuff',
      'cloth.guard-trim',
      `upper-arm.${side}`,
      'sleeve.cuff',
      'arm.attach',
    ),
    addSuggestion(
      `boot.cuff.${side}`,
      'human.boot-cuff',
      'feature.boot-cuff',
      'leather.guard-brown',
      `shin.${side}`,
      'boot.cuff',
      'shin.attach',
    ),
    addSuggestion(
      `boot.toe.${side}`,
      'human.boot-toe',
      'feature.boot-toe',
      'leather.guard-brown',
      `foot.${side}`,
      'toe',
      'foot.attach',
    ),
    addSuggestion(
      `boot.sole.${side}`,
      'human.boot-sole',
      'feature.boot-sole',
      'leather.dark',
      `foot.${side}`,
      'sole',
      'foot.attach',
    ),
  ]),
] as const;

const GUARD_HELMET_RECIPE = [
  addSuggestion(
    'helmet.dome',
    'human.helmet-dome',
    'feature.helmet-dome',
    'iron.guard-grey',
    'head',
    'helmet.dome',
    'head.attach',
  ),
  addSuggestion(
    'helmet.emblem',
    'human.helmet-emblem',
    'feature.helmet-emblem',
    'iron.guard-highlight',
    'helmet.dome',
    'emblem.mount',
    'surface.attach',
  ),
  addSuggestion(
    'helmet.ridge',
    'human.helmet-ridge',
    'feature.helmet-ridge',
    'iron.guard-highlight',
    'helmet.dome',
    'ridge.mount',
    'surface.attach',
  ),
  ...(['left', 'right'] as const).map((position) =>
    addSuggestion(
      `helmet.stud.${position}`,
      'human.helmet-stud',
      'feature.helmet-stud',
      'iron.guard-highlight',
      'helmet.dome',
      `stud.${position}`,
      'surface.attach',
    ),
  ),
] as const;

const GUARD_HELD_EQUIPMENT_RECIPE = [
  addSuggestion(
    'spear',
    'equipment.spear',
    'equipment.spear',
    'iron.blued',
    'hand.right',
    'equipment',
    'grip',
  ),
  addSuggestion(
    'shield.kite',
    'equipment.shield.kite',
    'equipment.shield.kite',
    'iron.blued',
    'hand.left',
    'equipment',
    'grip',
  ),
] as const;

const BARREL_RECIPE = [
  addSuggestion(
    'band.low',
    'prop.crate-band',
    'prop.reinforcement',
    'iron.weathered',
    'container.body',
    'band.low',
    'crate.attach',
  ),
  addSuggestion(
    'band.high',
    'prop.crate-band',
    'prop.reinforcement',
    'iron.weathered',
    'container.body',
    'band.high',
    'crate.attach',
  ),
] as const;

const DEFAULT_MATERIAL_BY_SLOT: Readonly<Record<string, string>> = {
  body: 'cloth.moss',
  cloth: 'cloth.moss',
  eye: 'hair.chestnut',
  hair: 'hair.chestnut',
  handle: 'wood.oak',
  leather: 'leather.dark',
  metal: 'iron.weathered',
  skin: 'skin.warm',
  wood: 'wood.oak',
};

export class NovelCompositionError extends Error {
  public constructor(
    message: string,
    public readonly path: string,
    public readonly guidance: string,
  ) {
    super(message);
    this.name = 'NovelCompositionError';
  }
}

const unsupportedPlanning = (blockers: string[]): NovelGrammarPlanningResult =>
  NovelGrammarPlanningResultSchema.parse({
    supported: false,
    blockers,
    guidance:
      'Choose one advertised rustic humanoid or banded-container archetype and compose only registered templates through task-level operations.',
  });

export function planNovelAssetBrief(brief: string): NovelGrammarPlanningResult {
  const normalized = brief.toLowerCase();
  const blockers: string[] = [];
  if (/raw\s*mesh|vertices|topology|sculpt|generator/u.test(normalized))
    blockers.push('Raw mesh and new generator authoring are not supported.');
  if (/dragon|quadruped|wing|tentacle|creature/u.test(normalized))
    blockers.push(
      'The requested anatomy is outside the registered archetypes.',
    );
  if (
    /(?:^|\s)(?:\/|\.\/|\.\.\/)|\\|\.glb\b|source\s*(?:file|path)|filesystem|\bimport\b/u.test(
      normalized,
    )
  )
    blockers.push(
      'Filesystem, source, and imported-file workflows are not supported.',
    );
  if (/mario|zelda|pokemon|warcraft|disney/u.test(normalized))
    blockers.push('Distinctive franchise copying is not supported.');
  if (blockers.length > 0) return unsupportedPlanning(blockers);

  const archetypeId = /barrel|banded|container|crate/u.test(normalized)
    ? 'prop.banded-container.rustic'
    : /guard|humanoid|chibi|helmet|spear|shield/u.test(normalized)
      ? 'humanoid.biped.rustic'
      : undefined;
  if (archetypeId === undefined)
    return unsupportedPlanning([
      'The brief does not map to an advertised bounded archetype.',
    ]);
  const archetype = NOVEL_ASSET_ARCHETYPES.find(
    ({ id }) => id === archetypeId,
  )!;
  const templateIds = [...archetype.allowedTemplateIds];
  const suggestedOperations =
    archetypeId === 'prop.banded-container.rustic'
      ? BARREL_RECIPE
      : [
          ...HUMANOID_REQUIRED_RECIPE,
          ...HUMANOID_FEATURE_RECIPE,
          ...(/guard|helmet|sentry/u.test(normalized)
            ? GUARD_HELMET_RECIPE
            : []),
          ...(/spear|shield/u.test(normalized)
            ? GUARD_HELD_EQUIPMENT_RECIPE
            : []),
        ];
  return NovelGrammarPlanningResultSchema.parse({
    supported: true,
    archetypeId,
    compatibleTemplateIds: templateIds,
    compatibleMaterialIds:
      archetypeId === 'prop.banded-container.rustic'
        ? ['iron.weathered', 'wood.oak']
        : [
            'cloth.moss',
            'cloth.guard-teal',
            'cloth.guard-trim',
            'bronze.aged',
            'face.ink',
            'hair.chestnut',
            'iron.blued',
            'iron.guard-grey',
            'iron.guard-highlight',
            'iron.weathered',
            'leather.guard-brown',
            'leather.dark',
            'mouth.soft',
            'skin.peach',
            'skin.warm',
            'wood.dark',
            'wood.oak',
          ],
    suggestedOperations,
  });
}

function requireNovelArchetype(document: Readonly<AssetDocument>) {
  if (document.novelIdentity === undefined)
    throw new NovelCompositionError(
      'Task-level composition is available only for novel identities.',
      '$.assetId',
      'Initialize a novel identity or use the existing closed patch workflow for committed references.',
    );
  return NOVEL_ASSET_ARCHETYPES.find(
    ({ id }) => id === document.novelIdentity!.archetypeId,
  )!;
}

function requireTemplate(
  document: Readonly<AssetDocument>,
  templateId: string,
): PartTemplateDefinition {
  const template = document.templates.find(({ id }) => id === templateId);
  if (template === undefined)
    throw new NovelCompositionError(
      `Template ${templateId} is not registered by the active kit.`,
      '$.composition.templateId',
      'Choose a compatible template advertised by list_kits or inspect_template.',
    );
  return template;
}

export function compileNovelComposition(
  document: Readonly<AssetDocument>,
  operation: NovelCompositionOperation,
): SemanticPatch {
  const archetype = requireNovelArchetype(document);
  if (operation.operation === 'connect_parts')
    return {
      operations: [
        {
          operation: 'connectParts',
          connection: {
            id: operation.connectionId,
            parentPartId: operation.parentPartId,
            parentPortId: operation.parentPortId,
            childPartId: operation.childPartId,
            childPortId: operation.childPortId,
          },
        },
      ],
    };

  const template = requireTemplate(document, operation.templateId);
  if (!archetype.allowedTemplateIds.includes(operation.templateId))
    throw new NovelCompositionError(
      `Template ${operation.templateId} is not allowed by ${archetype.id}.`,
      '$.composition.templateId',
      'Choose one of the archetype compatibleTemplateIds advertised by list_kits.',
    );
  if (template.role !== operation.role)
    throw new NovelCompositionError(
      `Template ${template.id} has role ${template.role}, not ${operation.role}.`,
      '$.composition.role',
      `Use target role ${template.role} for this registered template.`,
    );
  if (document.assembly.parts.some(({ id }) => id === operation.partId))
    throw new NovelCompositionError(
      `Part ${operation.partId} already exists.`,
      '$.composition.partId',
      'Choose a new stable semantic part ID.',
    );
  if (
    operation.materialId !== undefined &&
    !document.materials.some(({ id }) => id === operation.materialId)
  )
    throw new NovelCompositionError(
      `Material ${operation.materialId} is not registered by the active kit.`,
      '$.composition.materialId',
      'Choose a compatible registered material advertised by the grammar.',
    );
  const materialBindings = template.materialSlots.map((slot) => ({
    slot,
    materialId:
      operation.materialId ?? DEFAULT_MATERIAL_BY_SLOT[slot] ?? 'cloth.moss',
  }));
  return {
    operations: [
      {
        operation: 'addPart',
        part: {
          id: operation.partId,
          templateId: template.id,
          handedness: operation.partId.endsWith('.left')
            ? 'left'
            : operation.partId.endsWith('.right')
              ? 'right'
              : 'neutral',
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0, 1],
            scale: [1, 1, 1],
          },
          materialBindings,
          visible: true,
        },
      },
      {
        operation: 'connectParts',
        connection: {
          id: operation.attachment.connectionId,
          parentPartId: operation.attachment.parentPartId,
          parentPortId: operation.attachment.parentPortId,
          childPartId: operation.partId,
          childPortId: operation.attachment.childPortId,
        },
      },
    ],
  };
}
