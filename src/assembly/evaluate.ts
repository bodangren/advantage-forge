import type {
  AssemblyDefinition,
  Bounds,
  ConnectionDefinition,
  PartInstance,
  PartTemplateDefinition,
  PoseDefinition,
  SceneSummary,
  ShapeDefinition,
  Transform,
  VariantDefinition,
} from '../contracts/index.js';
import { generateGeometry } from '../geometry/index.js';

import {
  IDENTITY_TRANSFORM,
  canonicalNumber,
  canonicalTransform,
  composeTransforms,
  invertTransform,
  mirrorTransform,
  multiplyQuaternions,
  quaternionFromAxisAngle,
  transformBounds,
  unionBounds,
} from './math.js';

export type AssemblyErrorCode =
  | 'DUPLICATE_PART_ID'
  | 'DUPLICATE_CONNECTION_ID'
  | 'MISSING_TEMPLATE'
  | 'MISSING_PART'
  | 'MISSING_PORT'
  | 'INCOMPATIBLE_PORTS'
  | 'OCCUPIED_PORT'
  | 'DUPLICATE_PARENT'
  | 'ASSEMBLY_CYCLE'
  | 'JOINT_LIMIT'
  | 'MISSING_OVERRIDE_PART';

export interface AssemblyIssue {
  readonly code: AssemblyErrorCode;
  readonly path: string;
  readonly message: string;
  readonly guidance: string;
}

export class AssemblyEvaluationError extends Error {
  public constructor(public readonly issues: readonly AssemblyIssue[]) {
    super(
      issues
        .map((issue) => `${issue.code} at ${issue.path}: ${issue.message}`)
        .join('; '),
    );
    this.name = 'AssemblyEvaluationError';
  }
}

export interface EvaluateAssemblyOptions {
  readonly variant?: VariantDefinition;
  readonly pose?: PoseDefinition;
}

/** Creates a stable part instance without mutating its reusable template. */
export function instantiatePart(
  template: PartTemplateDefinition,
  id: string,
  transform: Transform = IDENTITY_TRANSFORM,
): PartInstance {
  return {
    id,
    templateId: template.id,
    transform: canonicalTransform(transform),
    shape: template.shape,
    materialBindings: template.materialSlots.map((slot) => ({
      slot,
      materialId: slot,
    })),
    visible: true,
  };
}

export function validateAssembly(
  assembly: AssemblyDefinition,
  templates: readonly PartTemplateDefinition[],
): readonly AssemblyIssue[] {
  const issues: AssemblyIssue[] = [];
  const templateById = uniqueMap(templates, (template) => template.id);
  const partById = new Map<string, PartInstance>();
  for (const [index, part] of assembly.parts.entries()) {
    if (partById.has(part.id)) {
      issues.push(
        issue(
          'DUPLICATE_PART_ID',
          `parts[${index}].id`,
          `Part ID '${part.id}' is repeated.`,
          'Use a stable unique semantic ID.',
        ),
      );
    } else {
      partById.set(part.id, part);
    }
    if (!templateById.has(part.templateId)) {
      issues.push(
        issue(
          'MISSING_TEMPLATE',
          `parts[${index}].templateId`,
          `Template '${part.templateId}' does not exist.`,
          'Select a registered template.',
        ),
      );
    }
  }

  const connectionIds = new Set<string>();
  const incomingChildren = new Set<string>();
  const occupiedPorts = new Map<string, number>();
  const edges = new Map<string, string[]>();
  for (const [index, connection] of assembly.connections.entries()) {
    const path = `connections[${index}]`;
    if (connectionIds.has(connection.id)) {
      issues.push(
        issue(
          'DUPLICATE_CONNECTION_ID',
          `${path}.id`,
          `Connection ID '${connection.id}' is repeated.`,
          'Use a stable unique connection ID.',
        ),
      );
    }
    connectionIds.add(connection.id);

    const parent = partById.get(connection.parentPartId);
    const child = partById.get(connection.childPartId);
    if (parent === undefined) {
      issues.push(
        issue(
          'MISSING_PART',
          `${path}.parentPartId`,
          `Parent part '${connection.parentPartId}' does not exist.`,
          'Connect an existing part.',
        ),
      );
    }
    if (child === undefined) {
      issues.push(
        issue(
          'MISSING_PART',
          `${path}.childPartId`,
          `Child part '${connection.childPartId}' does not exist.`,
          'Connect an existing part.',
        ),
      );
    }
    if (incomingChildren.has(connection.childPartId)) {
      issues.push(
        issue(
          'DUPLICATE_PARENT',
          `${path}.childPartId`,
          `Part '${connection.childPartId}' already has a parent.`,
          'Each part can have only one owning parent connection.',
        ),
      );
    }
    incomingChildren.add(connection.childPartId);

    if (parent === undefined || child === undefined) {
      continue;
    }
    const parentTemplate = templateById.get(parent.templateId);
    const childTemplate = templateById.get(child.templateId);
    const parentPort = parentTemplate?.ports.find(
      (port) => port.id === connection.parentPortId,
    );
    const childPort = childTemplate?.ports.find(
      (port) => port.id === connection.childPortId,
    );
    if (parentPort === undefined) {
      issues.push(
        issue(
          'MISSING_PORT',
          `${path}.parentPortId`,
          `Port '${connection.parentPortId}' does not exist on '${parent.id}'.`,
          'Inspect the parent template port catalog.',
        ),
      );
    }
    if (childPort === undefined) {
      issues.push(
        issue(
          'MISSING_PORT',
          `${path}.childPortId`,
          `Port '${connection.childPortId}' does not exist on '${child.id}'.`,
          'Inspect the child template port catalog.',
        ),
      );
    }
    if (parentPort === undefined || childPort === undefined) {
      continue;
    }
    if (!portsCompatible(parentPort, childPort)) {
      issues.push(
        issue(
          'INCOMPATIBLE_PORTS',
          path,
          `Ports '${parentPort.id}' and '${childPort.id}' have incompatible tags.`,
          'Choose ports whose accepted tags match in both directions.',
        ),
      );
    }
    for (const [partId, portId, cardinality, portPath] of [
      [
        parent.id,
        parentPort.id,
        parentPort.cardinality,
        `${path}.parentPortId`,
      ],
      [child.id, childPort.id, childPort.cardinality, `${path}.childPortId`],
    ] as const) {
      const key = `${partId}\u0000${portId}`;
      const count = (occupiedPorts.get(key) ?? 0) + 1;
      occupiedPorts.set(key, count);
      if (cardinality === 'single' && count > 1) {
        issues.push(
          issue(
            'OCCUPIED_PORT',
            portPath,
            `Single-cardinality port '${portId}' is already occupied.`,
            'Disconnect the existing child or use a multiple-cardinality port.',
          ),
        );
      }
    }
    edges.set(connection.parentPartId, [
      ...(edges.get(connection.parentPartId) ?? []),
      connection.childPartId,
    ]);
  }

  if (hasCycle([...partById.keys()], edges)) {
    issues.push(
      issue(
        'ASSEMBLY_CYCLE',
        'connections',
        'Parent-child connections contain a cycle.',
        'Keep the assembly ownership graph acyclic.',
      ),
    );
  }
  return issues;
}

/** Evaluates an assembly into a deterministic, mesh-free semantic scene summary. */
export function evaluateAssembly(
  assembly: AssemblyDefinition,
  templates: readonly PartTemplateDefinition[],
  options: EvaluateAssemblyOptions = {},
): SceneSummary {
  let evaluatedAssembly = assembly;
  if (options.variant !== undefined) {
    evaluatedAssembly = applyVariant(evaluatedAssembly, options.variant);
  }
  if (options.pose !== undefined) {
    evaluatedAssembly = applyPose(evaluatedAssembly, options.pose);
  }

  const issues = validateAssembly(evaluatedAssembly, templates);
  if (issues.length > 0) {
    throw new AssemblyEvaluationError(issues);
  }
  const templateById = uniqueMap(templates, (template) => template.id);
  const partById = uniqueMap(evaluatedAssembly.parts, (part) => part.id);
  const connectionByChild = uniqueMap(
    evaluatedAssembly.connections,
    (connection) => connection.childPartId,
  );
  const worldByPart = new Map<string, Transform>();
  const resolving = new Set<string>();

  const resolveWorldTransform = (partId: string): Transform => {
    const cached = worldByPart.get(partId);
    if (cached !== undefined) {
      return cached;
    }
    if (resolving.has(partId)) {
      throw new AssemblyEvaluationError([
        issue(
          'ASSEMBLY_CYCLE',
          `parts.${partId}`,
          'A transform cycle was encountered.',
          'Remove the cyclic connection.',
        ),
      ]);
    }
    resolving.add(partId);
    const part = required(
      partById.get(partId),
      `Part '${partId}' disappeared after validation.`,
    );
    const connection = connectionByChild.get(partId);
    let worldTransform: Transform;
    if (connection === undefined) {
      worldTransform = canonicalTransform(part.transform);
    } else {
      const parent = required(
        partById.get(connection.parentPartId),
        'Validated parent missing.',
      );
      const parentTemplate = required(
        templateById.get(parent.templateId),
        'Validated template missing.',
      );
      const childTemplate = required(
        templateById.get(part.templateId),
        'Validated template missing.',
      );
      const parentPort = required(
        parentTemplate.ports.find(
          (port) => port.id === connection.parentPortId,
        ),
        'Validated parent port missing.',
      );
      const childPort = required(
        childTemplate.ports.find((port) => port.id === connection.childPortId),
        'Validated child port missing.',
      );
      const parentWorld = resolveWorldTransform(parent.id);
      let targetPort = composeTransforms(parentWorld, parentPort.frame);
      if (connection.joint?.kind === 'hinge') {
        const angle = part.jointValueDegrees ?? 0;
        const minimum = connection.joint.minDegrees ?? -180;
        const maximum = connection.joint.maxDegrees ?? 180;
        if (angle < minimum || angle > maximum) {
          throw new AssemblyEvaluationError([
            issue(
              'JOINT_LIMIT',
              `parts.${part.id}.jointValueDegrees`,
              `Joint angle ${angle} is outside ${minimum}..${maximum}.`,
              'Choose an angle inside the declared rigid-joint limits.',
            ),
          ]);
        }
        const rotation = quaternionFromAxisAngle(
          connection.joint.axis ?? [0, 0, 1],
          angle,
        );
        targetPort = {
          ...targetPort,
          rotation: multiplyQuaternions(targetPort.rotation, rotation),
        };
      }
      const aligned = composeTransforms(
        targetPort,
        invertTransform(childPort.frame),
      );
      worldTransform = composeTransforms(aligned, part.transform);
    }
    resolving.delete(partId);
    worldByPart.set(partId, worldTransform);
    return worldTransform;
  };

  const summaryParts = [...evaluatedAssembly.parts]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((part) => {
      const template = required(
        templateById.get(part.templateId),
        'Validated template missing.',
      );
      const shape = part.shape ?? template.shape;
      const geometry = generateGeometry(shape);
      const worldTransform = resolveWorldTransform(part.id);
      return {
        id: part.id,
        templateId: part.templateId,
        role: template.role,
        worldTransform,
        bounds: transformBounds(geometry.bounds, worldTransform),
        materialBindings: [...part.materialBindings].sort((a, b) =>
          a.slot.localeCompare(b.slot),
        ),
        triangleCount: geometry.metadata.triangleCount,
        visible: part.visible,
      };
    });
  const visibleParts = summaryParts.filter((part) => part.visible);
  const bounds = unionBounds(visibleParts.map((part) => part.bounds));
  return {
    id: evaluatedAssembly.id,
    parts: summaryParts,
    bounds,
    triangleCount: visibleParts.reduce(
      (sum, part) => sum + part.triangleCount,
      0,
    ),
  };
}

export function applyVariant(
  assembly: AssemblyDefinition,
  variant: VariantDefinition,
): AssemblyDefinition {
  const partIds = new Set(assembly.parts.map((part) => part.id));
  const unknown = variant.overrides.filter(
    (override) => !partIds.has(override.partId),
  );
  if (unknown.length > 0) {
    throw new AssemblyEvaluationError(
      unknown.map((override, index) =>
        issue(
          'MISSING_OVERRIDE_PART',
          `variant.overrides[${index}].partId`,
          `Part '${override.partId}' does not exist.`,
          'Override an existing stable part ID.',
        ),
      ),
    );
  }
  const overrideByPart = uniqueMap(
    variant.overrides,
    (override) => override.partId,
  );
  return {
    ...assembly,
    parts: assembly.parts.map((part) => {
      const override = overrideByPart.get(part.id);
      if (override === undefined) {
        return part;
      }
      return {
        ...part,
        ...(override.shape === undefined ? {} : { shape: override.shape }),
        ...(override.transform === undefined
          ? {}
          : { transform: override.transform }),
        ...(override.materialBindings === undefined
          ? {}
          : { materialBindings: override.materialBindings }),
        ...(override.visible === undefined
          ? {}
          : { visible: override.visible }),
      };
    }),
  };
}

export function applyPose(
  assembly: AssemblyDefinition,
  pose: PoseDefinition,
): AssemblyDefinition {
  const partIds = new Set(assembly.parts.map((part) => part.id));
  const unknown = pose.overrides.filter(
    (override) => !partIds.has(override.partId),
  );
  if (unknown.length > 0) {
    throw new AssemblyEvaluationError(
      unknown.map((override, index) =>
        issue(
          'MISSING_OVERRIDE_PART',
          `pose.overrides[${index}].partId`,
          `Part '${override.partId}' does not exist.`,
          'Pose an existing stable part ID.',
        ),
      ),
    );
  }
  const overrideByPart = uniqueMap(
    pose.overrides,
    (override) => override.partId,
  );
  return {
    ...assembly,
    parts: assembly.parts.map((part) => {
      const override = overrideByPart.get(part.id);
      if (override === undefined) {
        return part;
      }
      return {
        ...part,
        ...(override.transform === undefined
          ? {}
          : {
              transform: composeTransforms(part.transform, override.transform),
            }),
        ...(override.jointValueDegrees === undefined
          ? {}
          : { jointValueDegrees: canonicalNumber(override.jointValueDegrees) }),
      };
    }),
  };
}

/** Mirrors selected part transforms without changing stable IDs or unrelated part objects. */
export function mirrorSubassembly(
  assembly: AssemblyDefinition,
  partIds: readonly string[],
  axis: 'x' | 'y' | 'z',
): AssemblyDefinition {
  const selected = new Set(partIds);
  const missing = partIds.filter(
    (partId) => !assembly.parts.some((part) => part.id === partId),
  );
  if (missing.length > 0) {
    throw new AssemblyEvaluationError(
      missing.map((partId, index) =>
        issue(
          'MISSING_OVERRIDE_PART',
          `partIds[${index}]`,
          `Part '${partId}' does not exist.`,
          'Mirror existing stable part IDs.',
        ),
      ),
    );
  }
  return {
    ...assembly,
    parts: assembly.parts.map((part) =>
      selected.has(part.id)
        ? { ...part, transform: mirrorTransform(part.transform, axis) }
        : part,
    ),
  };
}

function portsCompatible(
  parent: PartTemplateDefinition['ports'][number],
  child: PartTemplateDefinition['ports'][number],
): boolean {
  return (
    parent.accepts.some((tag) => child.tags.includes(tag)) &&
    child.accepts.some((tag) => parent.tags.includes(tag))
  );
}

function hasCycle(
  nodes: readonly string[],
  edges: ReadonlyMap<string, readonly string[]>,
): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: string): boolean => {
    if (visiting.has(node)) {
      return true;
    }
    if (visited.has(node)) {
      return false;
    }
    visiting.add(node);
    for (const child of edges.get(node) ?? []) {
      if (visit(child)) {
        return true;
      }
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return nodes.some(visit);
}

function uniqueMap<Value>(
  values: readonly Value[],
  key: (value: Value) => string,
): Map<string, Value> {
  return new Map(values.map((value) => [key(value), value]));
}

function issue(
  code: AssemblyErrorCode,
  path: string,
  message: string,
  guidance: string,
): AssemblyIssue {
  return { code, path, message, guidance };
}

function required<Value>(value: Value | undefined, message: string): Value {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

export type { Bounds, ConnectionDefinition, ShapeDefinition };
