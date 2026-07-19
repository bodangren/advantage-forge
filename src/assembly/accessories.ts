import type {
  AssemblyDefinition,
  ConnectionDefinition,
  EquipmentSlot,
  PartInstance,
  PartTemplateDefinition,
  Transform,
} from '../contracts/index.js';

import { transformBounds } from './math.js';
import { validateAssembly } from './evaluate.js';

export type AccessoryIssueCode =
  | 'ACCESSORY_TEMPLATE_MISSING'
  | 'ACCESSORY_SLOT_INVALID'
  | 'ACCESSORY_SLOT_OCCUPIED'
  | 'ACCESSORY_ANATOMY_INCOMPATIBLE'
  | 'ACCESSORY_ARCHETYPE_INCOMPATIBLE'
  | 'ACCESSORY_HANDEDNESS_CONFLICT'
  | 'ACCESSORY_POSE_INCOMPATIBLE'
  | 'ACCESSORY_HIDDEN'
  | 'ACCESSORY_ATTACHMENT_MISSING'
  | 'ACCESSORY_ATTACHMENT_PORT'
  | 'ACCESSORY_INTERSECTION_EXCEEDED'
  | 'ACCESSORY_PART_EXISTS'
  | 'ACCESSORY_CONNECTION_EXISTS'
  | 'ACCESSORY_ASSEMBLY_INVALID';

export interface AccessoryIssue {
  readonly code: AccessoryIssueCode;
  readonly path: string;
  readonly message: string;
  readonly guidance: string;
}

export interface AccessoryLoadoutContext {
  readonly anatomyId: string;
  readonly archetypeId: string;
  readonly activePoseId?: string;
}

export interface EquipAccessoryRequest {
  readonly part: PartInstance;
  readonly connection: ConnectionDefinition;
  readonly context: AccessoryLoadoutContext;
}

export class AccessoryValidationError extends Error {
  public constructor(public readonly issues: readonly AccessoryIssue[]) {
    super(
      issues
        .map((entry) => `${entry.code} at ${entry.path}: ${entry.message}`)
        .join('; '),
    );
    this.name = 'AccessoryValidationError';
  }
}

interface AccessoryState {
  readonly part: PartInstance;
  readonly template: PartTemplateDefinition;
  readonly slot: EquipmentSlot;
  readonly index: number;
}

const issue = (
  code: AccessoryIssueCode,
  path: string,
  message: string,
  guidance: string,
): AccessoryIssue => ({ code, path, message, guidance });

function equipmentSlot(
  part: PartInstance,
  template: PartTemplateDefinition,
): EquipmentSlot | undefined {
  return part.equipmentSlot ?? template.accessory?.slot;
}

function handednessMatches(
  expected: NonNullable<PartTemplateDefinition['accessory']>['handedness'],
  actual: PartInstance['handedness'],
): boolean {
  if (expected === 'either') return true;
  if (expected === 'two-handed') return actual === 'neutral';
  return (actual ?? 'neutral') === expected;
}

function volume(bounds: {
  min: readonly number[];
  max: readonly number[];
}): number {
  return bounds.min.reduce(
    (result, minimum, axis) =>
      result * Math.max(0, bounds.max[axis]! - minimum),
    1,
  );
}

function intersectionRatio(
  left: NonNullable<PartTemplateDefinition['accessory']>['bounds'],
  leftTransform: Transform,
  right: NonNullable<PartTemplateDefinition['accessory']>['bounds'],
  rightTransform: Transform,
): number {
  const a = transformBounds(left, leftTransform);
  const b = transformBounds(right, rightTransform);
  const overlap = {
    min: a.min.map((value, axis) => Math.max(value, b.min[axis]!)) as [
      number,
      number,
      number,
    ],
    max: a.max.map((value, axis) => Math.min(value, b.max[axis]!)) as [
      number,
      number,
      number,
    ],
  };
  const overlapVolume = volume(overlap);
  const smallerVolume = Math.min(volume(a), volume(b));
  return smallerVolume === 0 ? 0 : overlapVolume / smallerVolume;
}

export function validateAccessoryLoadout(
  assembly: AssemblyDefinition,
  templates: readonly PartTemplateDefinition[],
  context: AccessoryLoadoutContext,
): readonly AccessoryIssue[] {
  const issues: AccessoryIssue[] = [];
  const templateById = new Map(
    templates.map((template) => [template.id, template]),
  );
  const accessoryStates: AccessoryState[] = [];
  const slotOwners = new Map<EquipmentSlot, AccessoryState>();

  for (const [index, part] of assembly.parts.entries()) {
    const template = templateById.get(part.templateId);
    if (template === undefined) {
      issues.push(
        issue(
          'ACCESSORY_TEMPLATE_MISSING',
          `parts[${index}].templateId`,
          `Template '${part.templateId}' is not registered.`,
          'Select a registered accessory template before equipping it.',
        ),
      );
      continue;
    }
    const metadata = template.accessory;
    if (metadata === undefined) continue;
    const slot = equipmentSlot(part, template);
    if (
      slot === undefined ||
      !(metadata.compatibleSlots ?? [metadata.slot]).includes(slot)
    ) {
      issues.push(
        issue(
          'ACCESSORY_SLOT_INVALID',
          `parts[${index}].equipmentSlot`,
          `Slot '${slot ?? 'missing'}' is not supported by '${template.id}'.`,
          `Use one of: ${(metadata.compatibleSlots ?? [metadata.slot]).join(', ')}.`,
        ),
      );
      continue;
    }
    const state = { part, template, slot, index };
    accessoryStates.push(state);
    const owner = slotOwners.get(slot);
    if (owner === undefined) slotOwners.set(slot, state);
    else
      issues.push(
        issue(
          'ACCESSORY_SLOT_OCCUPIED',
          `parts[${index}].equipmentSlot`,
          `Slot '${slot}' is already owned by '${owner.part.id}'.`,
          `Unequip or replace '${owner.part.id}' before equipping '${part.id}'.`,
        ),
      );

    if (!metadata.compatibleAnatomy.includes(context.anatomyId))
      issues.push(
        issue(
          'ACCESSORY_ANATOMY_INCOMPATIBLE',
          `parts[${index}].templateId`,
          `Accessory '${template.id}' does not support anatomy '${context.anatomyId}'.`,
          `Use compatible anatomy: ${metadata.compatibleAnatomy.join(', ')}.`,
        ),
      );
    if (!metadata.compatibleArchetypes.includes(context.archetypeId))
      issues.push(
        issue(
          'ACCESSORY_ARCHETYPE_INCOMPATIBLE',
          `parts[${index}].templateId`,
          `Accessory '${template.id}' does not support archetype '${context.archetypeId}'.`,
          `Use a compatible archetype: ${metadata.compatibleArchetypes.join(', ')}.`,
        ),
      );
    if (!handednessMatches(metadata.handedness, part.handedness))
      issues.push(
        issue(
          'ACCESSORY_HANDEDNESS_CONFLICT',
          `parts[${index}].handedness`,
          `Handedness '${part.handedness ?? 'neutral'}' conflicts with '${metadata.handedness}'.`,
          'Select a compatible handedness or a hand-swappable template.',
        ),
      );
    if (
      context.activePoseId !== undefined &&
      !metadata.allowedPoseIds.includes(context.activePoseId)
    )
      issues.push(
        issue(
          'ACCESSORY_POSE_INCOMPATIBLE',
          `parts[${index}].templateId`,
          `Pose '${context.activePoseId}' is not declared for '${template.id}'.`,
          `Use an allowed pose: ${metadata.allowedPoseIds.join(', ')}.`,
        ),
      );
    if (!part.visible)
      issues.push(
        issue(
          'ACCESSORY_HIDDEN',
          `parts[${index}].visible`,
          `Accessory '${part.id}' is hidden and cannot satisfy its readability contract.`,
          'Make the equipped accessory visible or remove it from the loadout.',
        ),
      );

    const attachments = assembly.connections.filter(
      ({ childPartId }) => childPartId === part.id,
    );
    if (attachments.length === 0)
      issues.push(
        issue(
          'ACCESSORY_ATTACHMENT_MISSING',
          `parts[${index}]`,
          `Accessory '${part.id}' has no owning attachment connection.`,
          `Connect one of its declared ports: ${metadata.attachmentPortIds.join(', ')}.`,
        ),
      );
    for (const connection of attachments)
      if (!metadata.attachmentPortIds.includes(connection.childPortId))
        issues.push(
          issue(
            'ACCESSORY_ATTACHMENT_PORT',
            `connections[${connection.id}].childPortId`,
            `Port '${connection.childPortId}' is not an accessory attachment port for '${template.id}'.`,
            `Use one of: ${metadata.attachmentPortIds.join(', ')}.`,
          ),
        );
  }

  for (const [leftIndex, left] of accessoryStates.entries())
    for (const right of accessoryStates.slice(leftIndex + 1)) {
      if (
        left.template.accessory?.layer.kind === 'carried' ||
        right.template.accessory?.layer.kind === 'carried'
      )
        continue;
      const ratio = intersectionRatio(
        left.template.accessory!.bounds,
        left.part.transform,
        right.template.accessory!.bounds,
        right.part.transform,
      );
      const maximum = Math.min(
        left.template.accessory!.layer.maximumIntersectionRatio,
        right.template.accessory!.layer.maximumIntersectionRatio,
      );
      if (ratio > maximum)
        issues.push(
          issue(
            'ACCESSORY_INTERSECTION_EXCEEDED',
            `parts[${right.index}].transform`,
            `Rigid accessories '${left.part.id}' and '${right.part.id}' intersect by ${ratio.toFixed(3)}, above ${maximum.toFixed(3)}.`,
            'Adjust bounded transforms, layers, or compatible equipment; cloth simulation is not available.',
          ),
        );
    }

  return issues;
}

export function equipAccessory(
  assembly: AssemblyDefinition,
  templates: readonly PartTemplateDefinition[],
  request: EquipAccessoryRequest,
): AssemblyDefinition {
  const issues: AccessoryIssue[] = [];
  if (assembly.parts.some(({ id }) => id === request.part.id))
    issues.push(
      issue(
        'ACCESSORY_PART_EXISTS',
        'part.id',
        `Part '${request.part.id}' already exists.`,
        'Use replace semantics or choose a new stable part ID.',
      ),
    );
  if (assembly.connections.some(({ id }) => id === request.connection.id))
    issues.push(
      issue(
        'ACCESSORY_CONNECTION_EXISTS',
        'connection.id',
        `Connection '${request.connection.id}' already exists.`,
        'Use replace semantics or choose a new stable connection ID.',
      ),
    );
  if (issues.length > 0) throw new AccessoryValidationError(issues);

  const candidate: AssemblyDefinition = {
    ...assembly,
    parts: [...assembly.parts, request.part],
    connections: [...assembly.connections, request.connection],
  };
  const validation = validateAccessoryLoadout(
    candidate,
    templates,
    request.context,
  );
  const assemblyIssues = validateAssembly(candidate, templates).map((entry) =>
    issue(
      'ACCESSORY_ASSEMBLY_INVALID',
      entry.path,
      entry.message,
      entry.guidance,
    ),
  );
  if (validation.length > 0 || assemblyIssues.length > 0)
    throw new AccessoryValidationError([...validation, ...assemblyIssues]);
  return candidate;
}

export function unequipAccessory(
  assembly: AssemblyDefinition,
  partId: string,
): AssemblyDefinition {
  if (!assembly.parts.some(({ id }) => id === partId))
    throw new AccessoryValidationError([
      issue(
        'ACCESSORY_TEMPLATE_MISSING',
        'partId',
        `Part '${partId}' is not present in the assembly.`,
        'Inspect the current loadout and select an equipped accessory ID.',
      ),
    ]);
  return {
    ...assembly,
    parts: assembly.parts.filter(({ id }) => id !== partId),
    connections: assembly.connections.filter(
      ({ parentPartId, childPartId }) =>
        parentPartId !== partId && childPartId !== partId,
    ),
  };
}
