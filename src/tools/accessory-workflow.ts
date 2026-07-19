import {
  AccessoryValidationError,
  equipAccessory,
  evaluateAssembly,
  unequipAccessory,
  validateAccessoryLoadout,
} from '../assembly/index.js';
import {
  AccessoryDiscoveryDataSchema,
  AssetDocumentSchema,
  type AccessoryDiscoveryData,
  type AccessoryQuery,
  type AccessoryTaskOperation,
  type AssetDocument,
  type EquipmentSlot,
  type MaterialDefinition,
  type PartInstance,
  type PartTemplateDefinition,
} from '../contracts/index.js';
import { compareSemanticDocuments } from '../document/index.js';
import {
  RUSTIC_ACCESSORY_MATERIAL_IDS,
  rusticAccessoryCatalog,
  type AccessoryCatalogEntry,
} from '../fantasy-kit/index.js';

export class AccessoryWorkflowError extends Error {
  public constructor(
    public readonly code: 'NOT_FOUND' | 'INVALID_VALUE' | 'INVALID_ASSEMBLY',
    public readonly path: string,
    message: string,
    public readonly guidance: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'AccessoryWorkflowError';
  }
}

export interface AccessoryOperationPlan {
  readonly document: AssetDocument;
  readonly partId: string;
  readonly templateId?: string;
  readonly equipmentSlot?: EquipmentSlot;
  readonly materialId?: string;
  readonly addedIds: readonly string[];
  readonly removedIds: readonly string[];
  readonly connectionIds: readonly string[];
  readonly primaryAffectedIds: readonly string[];
}

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

function entryForTemplate(templateId: string): AccessoryCatalogEntry {
  const entry = rusticAccessoryCatalog.find(
    ({ template }) => template.id === templateId,
  );
  if (entry === undefined)
    throw new AccessoryWorkflowError(
      'NOT_FOUND',
      '$.operation.templateId',
      `Accessory template '${templateId}' was not found.`,
      'Call search_accessories and use a returned templateId.',
    );
  return entry;
}

function slotFor(
  part: PartInstance,
  template: PartTemplateDefinition,
): EquipmentSlot | undefined {
  return part.equipmentSlot ?? template.accessory?.slot;
}

function materialOptions(
  document: Readonly<AssetDocument>,
  entry: AccessoryCatalogEntry,
): readonly MaterialDefinition[] {
  const slotFamilies: Readonly<Record<string, readonly string[]>> = {
    metal: ['iron', 'bronze'],
    wood: ['wood'],
    cloth: ['cloth'],
    leather: ['leather'],
    bone: ['bone'],
    crystal: ['crystal'],
  };
  const allowed = new Set(
    entry.template.materialSlots.flatMap((slot) => slotFamilies[slot] ?? []),
  );
  const palette = new Set<string>(RUSTIC_ACCESSORY_MATERIAL_IDS);
  const values = document.materials.filter(
    (material) =>
      palette.has(material.id) &&
      (allowed.size === 0 || allowed.has(material.family)),
  );
  return values.some(({ id }) => id === entry.defaultMaterialId)
    ? values
    : [
        ...values,
        ...document.materials.filter(
          ({ id }) => id === entry.defaultMaterialId,
        ),
      ];
}

function selectedSlot(
  entry: AccessoryCatalogEntry,
  requested?: EquipmentSlot,
): EquipmentSlot {
  const metadata = entry.template.accessory!;
  const compatible = metadata.compatibleSlots ?? [metadata.slot];
  const slot = requested ?? metadata.slot;
  if (!compatible.includes(slot))
    throw new AccessoryWorkflowError(
      'INVALID_VALUE',
      '$.operation.equipmentSlot',
      `Accessory '${entry.template.id}' does not support slot '${slot}'.`,
      `Use one of: ${compatible.join(', ')}.`,
    );
  if (!entry.usage.placements.some((placement) => placement.slot === slot))
    throw new AccessoryWorkflowError(
      'INVALID_ASSEMBLY',
      '$.operation.equipmentSlot',
      `Accessory '${entry.template.id}' has no kit-owned placement for '${slot}'.`,
      'Select a slot returned by search_accessories; do not invent a transform.',
    );
  return slot;
}

function handednessForSlot(slot: EquipmentSlot): PartInstance['handedness'] {
  if (slot === 'main-hand') return 'right';
  if (slot === 'off-hand') return 'left';
  return 'neutral';
}

function partFor(
  entry: AccessoryCatalogEntry,
  partId: string,
  slot: EquipmentSlot,
  materialId: string,
): PartInstance {
  const placement = entry.usage.placements.find(
    (candidate) => candidate.slot === slot,
  )!;
  return {
    id: partId,
    templateId: entry.template.id,
    handedness: handednessForSlot(slot),
    equipmentSlot: slot,
    transform: structuredClone(placement.transform),
    materialBindings: entry.template.materialSlots.map((materialSlot) => ({
      slot: materialSlot,
      materialId,
    })),
    visible: true,
  };
}

function materialFor(
  document: Readonly<AssetDocument>,
  entry: AccessoryCatalogEntry,
  requested?: string,
): string {
  const materialId = requested ?? entry.defaultMaterialId;
  if (!materialOptions(document, entry).some(({ id }) => id === materialId))
    throw new AccessoryWorkflowError(
      'INVALID_VALUE',
      '$.operation.materialId',
      `Material '${materialId}' is not available for '${entry.template.id}'.`,
      `Use one of: ${materialOptions(document, entry)
        .map(({ id }) => id)
        .join(', ')}.`,
    );
  return materialId;
}

function connectionFor(
  entry: AccessoryCatalogEntry,
  partId: string,
  connectionId: string,
  slot: EquipmentSlot,
) {
  const placement = entry.usage.placements.find(
    (candidate) => candidate.slot === slot,
  )!;
  return {
    id: connectionId,
    parentPartId: placement.parentPartId,
    parentPortId: placement.parentPortId,
    childPartId: partId,
    childPortId: entry.template.accessory!.attachmentPortIds[0]!,
    joint: { kind: 'fixed' as const },
  };
}

function ownerForSlot(
  document: Readonly<AssetDocument>,
  slot: EquipmentSlot,
  exceptPartId?: string,
): PartInstance | undefined {
  const templates = new Map(
    document.templates.map((template) => [template.id, template]),
  );
  return document.assembly.parts.find((part) => {
    if (part.id === exceptPartId) return false;
    const template = templates.get(part.templateId);
    return template !== undefined && slotFor(part, template) === slot;
  });
}

function contextFor(document: Readonly<AssetDocument>, archetypeId: string) {
  return {
    anatomyId: document.kitId,
    archetypeId,
    ...(document.activePoseId === undefined
      ? {}
      : { activePoseId: document.activePoseId }),
  };
}

function validateCandidate(
  document: AssetDocument,
  archetypeId: string,
): AssetDocument {
  const issues = validateAccessoryLoadout(
    document.assembly,
    document.templates,
    contextFor(document, archetypeId),
  );
  if (issues.length > 0) throw new AccessoryValidationError(issues);
  const variant = document.variants.find(
    ({ id }) => id === document.activeVariantId,
  );
  const pose = document.poses.find(({ id }) => id === document.activePoseId);
  evaluateAssembly(document.assembly, document.templates, {
    ...(variant === undefined ? {} : { variant }),
    ...(pose === undefined ? {} : { pose }),
  });
  return AssetDocumentSchema.parse(document);
}

function assertHumanAsset(document: Readonly<AssetDocument>): void {
  const requiredAnatomy = [
    'head',
    'hand.right',
    'hand.left',
    'torso',
    'pelvis',
  ];
  if (
    document.kitId !== 'rustic-human' ||
    requiredAnatomy.some(
      (partId) => !document.assembly.parts.some(({ id }) => id === partId),
    )
  )
    throw new AccessoryWorkflowError(
      'INVALID_ASSEMBLY',
      '$.assetId',
      `Asset '${document.id}' uses anatomy '${document.kitId}', not 'rustic-human'.`,
      'Accessory authoring currently supports only rustic-human assets.',
    );
}

function assertArchetype(
  entry: AccessoryCatalogEntry,
  archetypeId: string,
): void {
  if (!entry.template.accessory!.compatibleArchetypes.includes(archetypeId))
    throw new AccessoryWorkflowError(
      'INVALID_ASSEMBLY',
      '$.archetypeId',
      `Accessory '${entry.template.id}' does not support archetype '${archetypeId}'.`,
      `Use one of: ${entry.template.accessory!.compatibleArchetypes.join(', ')}.`,
    );
}

function checkedCandidate(
  before: Readonly<AssetDocument>,
  candidate: AssetDocument,
  archetypeId: string,
): AssetDocument {
  try {
    const validated = validateCandidate(candidate, archetypeId);
    if (compareSemanticDocuments(before, validated).changes.length === 0)
      throw new AccessoryWorkflowError(
        'INVALID_VALUE',
        '$.operation',
        'Accessory operation would not change the current asset.',
        'Inspect the current loadout and request a different state.',
      );
    return validated;
  } catch (error) {
    if (error instanceof AccessoryWorkflowError) throw error;
    if (error instanceof AccessoryValidationError) {
      const first = error.issues[0]!;
      throw new AccessoryWorkflowError(
        'INVALID_ASSEMBLY',
        '$.operation.equipmentSlot',
        first.message,
        first.guidance,
        { accessoryIssueCode: first.code, domainPath: first.path },
      );
    }
    throw new AccessoryWorkflowError(
      'INVALID_ASSEMBLY',
      '$.operation',
      error instanceof Error ? error.message : 'Accessory validation failed.',
      'Inspect the current loadout, compatible slots, and named ports before retrying.',
    );
  }
}

export function discoverAccessories(
  document: Readonly<AssetDocument>,
  revisionId: string,
  archetypeId: string,
  query: AccessoryQuery,
): AccessoryDiscoveryData {
  const templateById = new Map(
    document.templates.map((template) => [template.id, template]),
  );
  const matches = rusticAccessoryCatalog
    .filter((entry) => {
      const metadata = entry.template.accessory!;
      const options = materialOptions(document, entry);
      return (
        (query.roles === undefined || query.roles.includes(metadata.role)) &&
        (query.slots === undefined ||
          query.slots.some((slot) =>
            (metadata.compatibleSlots ?? [metadata.slot]).includes(slot),
          )) &&
        (query.handedness === undefined ||
          query.handedness.includes(metadata.handedness)) &&
        (query.compatibilityTags === undefined ||
          query.compatibilityTags.every((tag) =>
            metadata.compatibilityTags.includes(tag),
          )) &&
        (query.compatibleAnatomy === undefined ||
          query.compatibleAnatomy.every((id) =>
            metadata.compatibleAnatomy.includes(id),
          )) &&
        (query.compatibleArchetypes === undefined ||
          query.compatibleArchetypes.every((id) =>
            metadata.compatibleArchetypes.includes(id),
          )) &&
        (query.materialFamilies === undefined ||
          options.some(({ family }) =>
            query.materialFamilies!.includes(family),
          )) &&
        metadata.compatibleArchetypes.includes(archetypeId)
      );
    })
    .map((entry) => {
      const template = templateById.get(entry.template.id) ?? entry.template;
      const metadata = template.accessory!;
      const requestedSlot = query.slots?.find((slot) =>
        (metadata.compatibleSlots ?? [metadata.slot]).includes(slot),
      );
      const slot = requestedSlot ?? metadata.slot;
      const placement = entry.usage.placements.find(
        (candidate) => candidate.slot === slot,
      );
      const parent = document.assembly.parts.find(
        ({ id }) => id === placement?.parentPartId,
      );
      const parentTemplate =
        parent === undefined ? undefined : templateById.get(parent.templateId);
      const parentPort = parentTemplate?.ports.find(
        ({ id }) => id === placement?.parentPortId,
      );
      const issueCodes: string[] = [];
      if (!metadata.compatibleAnatomy.includes(document.kitId))
        issueCodes.push('ACCESSORY_ANATOMY_INCOMPATIBLE');
      if (placement === undefined) issueCodes.push('ACCESSORY_SLOT_INVALID');
      if (parent === undefined || parentPort === undefined)
        issueCodes.push('ACCESSORY_ATTACHMENT_PORT');
      const occupied = ownerForSlot(document, slot);
      if (occupied !== undefined) issueCodes.push('ACCESSORY_SLOT_OCCUPIED');
      const options = materialOptions(document, entry);
      return {
        templateId: template.id,
        role: metadata.role,
        defaultSlot: metadata.slot,
        compatibleSlots: metadata.compatibleSlots ?? [metadata.slot],
        handedness: metadata.handedness,
        compatibilityTags: metadata.compatibilityTags,
        compatibleAnatomy: metadata.compatibleAnatomy,
        compatibleArchetypes: metadata.compatibleArchetypes,
        parameterBounds: entry.parameterBounds,
        defaultMaterialId: entry.defaultMaterialId,
        materialOptions: options.map(({ id, family }) => ({ id, family })),
        attachmentTarget: {
          parentPartId:
            placement?.parentPartId ?? entry.attachmentTarget.parentPartId,
          parentPortId:
            placement?.parentPortId ?? entry.attachmentTarget.parentPortId,
        },
        attachmentPorts: template.ports.filter(({ id }) =>
          metadata.attachmentPortIds.includes(id),
        ),
        requiredFeatures: metadata.requiredFeatures,
        usage: entry.usage,
        compatibility: {
          eligible: issueCodes.every(
            (code) => code === 'ACCESSORY_SLOT_OCCUPIED',
          ),
          issueCodes,
          ...(occupied === undefined ? {} : { occupiedByPartId: occupied.id }),
          replacementRequired: occupied !== undefined,
        },
        exampleOperation:
          occupied === undefined
            ? {
                operation: 'equip' as const,
                templateId: template.id,
                equipmentSlot: slot,
                materialId: entry.defaultMaterialId,
              }
            : {
                operation: 'replace' as const,
                partId: occupied.id,
                templateId: template.id,
                equipmentSlot: slot,
                materialId: entry.defaultMaterialId,
              },
      };
    })
    .sort((left, right) => compareText(left.templateId, right.templateId));
  const page = {
    total: matches.length,
    offset: query.offset,
    limit: query.limit,
    truncated: query.offset + query.limit < matches.length,
    ...(query.offset + query.limit < matches.length
      ? { nextOffset: query.offset + query.limit }
      : {}),
  };
  return AccessoryDiscoveryDataSchema.parse({
    assetId: document.id,
    revisionId,
    archetypeId,
    query,
    page,
    items: matches.slice(query.offset, query.offset + query.limit),
  });
}

export function planAccessoryOperation(
  document: Readonly<AssetDocument>,
  archetypeId: string,
  operation: AccessoryTaskOperation,
): AccessoryOperationPlan {
  assertHumanAsset(document);
  const before = structuredClone(document) as AssetDocument;
  let candidate = structuredClone(document) as AssetDocument;
  let partId: string;
  let templateId: string | undefined;
  let equipmentSlot: EquipmentSlot | undefined;
  let materialId: string | undefined;
  let addedIds: string[] = [];
  let removedIds: string[] = [];
  let connectionIds: string[] = [];

  if (operation.operation === 'equip') {
    const entry = entryForTemplate(operation.templateId);
    equipmentSlot = selectedSlot(entry, operation.equipmentSlot);
    const occupied = ownerForSlot(candidate, equipmentSlot);
    if (occupied !== undefined)
      throw new AccessoryWorkflowError(
        'INVALID_ASSEMBLY',
        '$.operation.equipmentSlot',
        `Slot '${equipmentSlot}' is already occupied by '${occupied.id}'.`,
        `Use replace with partId '${occupied.id}' or unequip it first.`,
        { occupiedByPartId: occupied.id, equipmentSlot },
      );
    assertArchetype(entry, archetypeId);
    materialId = materialFor(candidate, entry, operation.materialId);
    partId = `accessory.${equipmentSlot}`;
    const connectionId = `connection.${equipmentSlot}`;
    templateId = entry.template.id;
    try {
      candidate.assembly = equipAccessory(
        candidate.assembly,
        candidate.templates,
        {
          part: partFor(entry, partId, equipmentSlot, materialId),
          connection: connectionFor(entry, partId, connectionId, equipmentSlot),
          context: contextFor(candidate, archetypeId),
        },
      );
    } catch (error) {
      if (error instanceof AccessoryValidationError) {
        const first = error.issues[0]!;
        throw new AccessoryWorkflowError(
          'INVALID_ASSEMBLY',
          '$.operation.equipmentSlot',
          first.message,
          first.guidance,
          { accessoryIssueCode: first.code, domainPath: first.path },
        );
      }
      throw error;
    }
    addedIds = [partId, connectionId];
    connectionIds = [connectionId];
  } else if (operation.operation === 'replace') {
    const index = candidate.assembly.parts.findIndex(
      ({ id }) => id === operation.partId,
    );
    if (index < 0)
      throw new AccessoryWorkflowError(
        'NOT_FOUND',
        '$.operation.partId',
        `Accessory part '${operation.partId}' was not found.`,
        'Inspect the current parts section and select an equipped accessory.',
      );
    const currentPart = candidate.assembly.parts[index]!;
    const currentTemplate = candidate.templates.find(
      ({ id }) => id === currentPart.templateId,
    );
    if (currentTemplate?.accessory === undefined)
      throw new AccessoryWorkflowError(
        'INVALID_VALUE',
        '$.operation.partId',
        `Part '${operation.partId}' is not an accessory.`,
        'Select a part whose inspected template includes accessory metadata.',
      );
    const entry = entryForTemplate(operation.templateId);
    assertArchetype(entry, archetypeId);
    equipmentSlot = selectedSlot(
      entry,
      operation.equipmentSlot ?? slotFor(currentPart, currentTemplate),
    );
    const occupied = ownerForSlot(candidate, equipmentSlot, currentPart.id);
    if (occupied !== undefined)
      throw new AccessoryWorkflowError(
        'INVALID_ASSEMBLY',
        '$.operation.equipmentSlot',
        `Slot '${equipmentSlot}' is already occupied by '${occupied.id}'.`,
        `Unequip '${occupied.id}' before replacing '${currentPart.id}'.`,
      );
    materialId = materialFor(candidate, entry, operation.materialId);
    partId = currentPart.id;
    templateId = entry.template.id;
    const owning = candidate.assembly.connections.filter(
      ({ childPartId }) => childPartId === partId,
    );
    if (owning.length !== 1)
      throw new AccessoryWorkflowError(
        'INVALID_ASSEMBLY',
        '$.operation.partId',
        `Accessory '${partId}' must have exactly one owning connection.`,
        'Repair the current assembly ports before replacing the accessory.',
      );
    const connectionId = owning[0]!.id;
    const baseAssembly = unequipAccessory(candidate.assembly, partId);
    candidate.assembly = equipAccessory(baseAssembly, candidate.templates, {
      part: partFor(entry, partId, equipmentSlot, materialId),
      connection: connectionFor(entry, partId, connectionId, equipmentSlot),
      context: contextFor(candidate, archetypeId),
    });
    connectionIds = [connectionId];
  } else if (operation.operation === 'recolor') {
    const index = candidate.assembly.parts.findIndex(
      ({ id }) => id === operation.partId,
    );
    const part = candidate.assembly.parts[index];
    if (part === undefined)
      throw new AccessoryWorkflowError(
        'NOT_FOUND',
        '$.operation.partId',
        `Accessory part '${operation.partId}' was not found.`,
        'Inspect the current loadout before recoloring.',
      );
    const entry = entryForTemplate(part.templateId);
    assertArchetype(entry, archetypeId);
    materialId = materialFor(candidate, entry, operation.materialId);
    if (
      part.materialBindings.every(
        (binding) => binding.materialId === materialId,
      )
    )
      throw new AccessoryWorkflowError(
        'INVALID_VALUE',
        '$.operation.materialId',
        `Accessory '${part.id}' already uses '${materialId}'.`,
        'Select a different compatible material.',
      );
    candidate.assembly.parts[index] = {
      ...part,
      materialBindings: part.materialBindings.map((binding) => ({
        ...binding,
        materialId: materialId!,
      })),
    };
    partId = part.id;
    templateId = part.templateId;
    equipmentSlot = slotFor(part, entry.template);
  } else if (operation.operation === 'unequip') {
    const part = candidate.assembly.parts.find(
      ({ id }) => id === operation.partId,
    );
    if (part === undefined)
      throw new AccessoryWorkflowError(
        'NOT_FOUND',
        '$.operation.partId',
        `Accessory part '${operation.partId}' was not found.`,
        'Inspect the current loadout before unequipping.',
      );
    const entry = entryForTemplate(part.templateId);
    assertArchetype(entry, archetypeId);
    partId = part.id;
    templateId = part.templateId;
    equipmentSlot = slotFor(part, entry.template);
    connectionIds = candidate.assembly.connections
      .filter(
        ({ parentPartId, childPartId }) =>
          parentPartId === partId || childPartId === partId,
      )
      .map(({ id }) => id)
      .sort(compareText);
    candidate.assembly = unequipAccessory(candidate.assembly, partId);
    candidate.variants = candidate.variants.map((variant) => ({
      ...variant,
      overrides: variant.overrides.filter(
        (override) => override.partId !== partId,
      ),
    }));
    candidate.poses = candidate.poses.map((pose) => ({
      ...pose,
      overrides: pose.overrides.filter(
        (override) => override.partId !== partId,
      ),
    }));
    removedIds = [partId, ...connectionIds];
  } else {
    const part = candidate.assembly.parts.find(
      ({ id }) => id === operation.partId,
    );
    if (part === undefined)
      throw new AccessoryWorkflowError(
        'NOT_FOUND',
        '$.operation.partId',
        `Accessory part '${operation.partId}' was not found.`,
        'Inspect the current hand slots before swapping.',
      );
    const entry = entryForTemplate(part.templateId);
    assertArchetype(entry, archetypeId);
    const fromSlot = slotFor(part, entry.template);
    if (fromSlot !== 'main-hand' && fromSlot !== 'off-hand')
      throw new AccessoryWorkflowError(
        'INVALID_VALUE',
        '$.operation.partId',
        `Accessory '${part.id}' is not equipped in a hand slot.`,
        'Swap hand applies only to main-hand and off-hand accessories.',
      );
    equipmentSlot =
      operation.toSlot ?? (fromSlot === 'main-hand' ? 'off-hand' : 'main-hand');
    if (equipmentSlot === fromSlot)
      throw new AccessoryWorkflowError(
        'INVALID_VALUE',
        '$.operation.toSlot',
        `Accessory '${part.id}' is already in '${equipmentSlot}'.`,
        'Select the opposite empty hand slot.',
      );
    selectedSlot(entry, equipmentSlot);
    const occupied = ownerForSlot(candidate, equipmentSlot, part.id);
    if (occupied !== undefined)
      throw new AccessoryWorkflowError(
        'INVALID_ASSEMBLY',
        '$.operation.toSlot',
        `Hand slot '${equipmentSlot}' is occupied by '${occupied.id}'.`,
        `Unequip '${occupied.id}' first; swapHand does not exchange two occupied hands.`,
      );
    const owningIndex = candidate.assembly.connections.findIndex(
      ({ childPartId }) => childPartId === part.id,
    );
    if (owningIndex < 0)
      throw new AccessoryWorkflowError(
        'INVALID_ASSEMBLY',
        '$.operation.partId',
        `Accessory '${part.id}' has no owning connection.`,
        'Repair its named attachment before swapping hands.',
      );
    const partIndex = candidate.assembly.parts.findIndex(
      ({ id }) => id === part.id,
    );
    const currentMaterial = part.materialBindings[0]!.materialId;
    candidate.assembly.parts[partIndex] = partFor(
      entry,
      part.id,
      equipmentSlot,
      currentMaterial,
    );
    const connectionId = candidate.assembly.connections[owningIndex]!.id;
    candidate.assembly.connections[owningIndex] = connectionFor(
      entry,
      part.id,
      connectionId,
      equipmentSlot,
    );
    partId = part.id;
    templateId = part.templateId;
    materialId = currentMaterial;
    connectionIds = [connectionId];
  }

  const includeInRenderEvidence = operation.operation !== 'unequip';
  candidate.renderProfiles = candidate.renderProfiles.map((profile) => {
    const withoutPart = profile.requiredFeaturePartIds.filter(
      (candidatePartId) => candidatePartId !== partId,
    );
    return {
      ...profile,
      requiredFeaturePartIds: includeInRenderEvidence
        ? [...withoutPart, partId!]
        : withoutPart,
    };
  });

  candidate = checkedCandidate(before, candidate, archetypeId);
  const diff = compareSemanticDocuments(before, candidate);
  const primaryAffectedIds = [
    partId!,
    ...connectionIds,
    ...diff.affectedIds.filter(
      (id) => id !== partId && !connectionIds.includes(id),
    ),
  ];
  return {
    document: candidate,
    partId: partId!,
    ...(templateId === undefined ? {} : { templateId }),
    ...(equipmentSlot === undefined ? {} : { equipmentSlot }),
    ...(materialId === undefined ? {} : { materialId }),
    addedIds,
    removedIds,
    connectionIds,
    primaryAffectedIds,
  };
}
