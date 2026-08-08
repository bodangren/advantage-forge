import { z } from 'zod';

import { parseDomainValue } from './domain-error.js';

export const RIGID_RIG_PROFILE_V2_CONTRACT_ID =
  'forge-rigid-rig-profile/v2' as const;

export const RIGID_RIG_V2_BUDGETS = Object.freeze({
  maximumAssemblyParts: 256,
  maximumJoints: 64,
  maximumDegreesOfFreedomPerJoint: 3,
  maximumDegreesOfFreedom: 192,
  maximumHierarchyDepth: 64,
} as const);

const SemanticIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const AssetRevisionIdSchema = z.string().regex(/^revision\.[a-f0-9]{64}$/);
const MorphologyRevisionIdSchema = z
  .string()
  .regex(/^morphology\.[a-f0-9]{64}$/);
const RigProfileIdSchema = z.string().regex(/^rig-v2\.[a-f0-9]{64}$/);
const EquipmentSignatureSchema = z.string().regex(/^equipment\.[a-f0-9]{64}$/);
const AssemblySignatureSchema = z.string().regex(/^assembly\.[a-f0-9]{64}$/);
const FiniteBoundedNumberSchema = z.number().finite().min(-100).max(100);
const Vec3Schema = z.tuple([
  FiniteBoundedNumberSchema,
  FiniteBoundedNumberSchema,
  FiniteBoundedNumberSchema,
]);
const QuaternionSchema = z
  .tuple([
    z.number().finite().min(-1).max(1),
    z.number().finite().min(-1).max(1),
    z.number().finite().min(-1).max(1),
    z.number().finite().min(-1).max(1),
  ])
  .refine(
    (value) =>
      Math.abs(Math.hypot(value[0], value[1], value[2], value[3]) - 1) <= 1e-6,
    'Pivot rotations must be normalized quaternions.',
  );

const RigidRigV2AssemblyPartBase = {
  partId: SemanticIdSchema,
  parentPartId: SemanticIdSchema.optional(),
} as const;

export const RigidRigV2AssemblyPartSchema = z.discriminatedUnion(
  'mirrorPolicy',
  [
    z.strictObject({
      ...RigidRigV2AssemblyPartBase,
      mirrorPolicy: z.literal('center'),
    }),
    z.strictObject({
      ...RigidRigV2AssemblyPartBase,
      mirrorPolicy: z.literal('paired'),
      mirrorPartId: SemanticIdSchema,
    }),
    z.strictObject({
      ...RigidRigV2AssemblyPartBase,
      mirrorPolicy: z.literal('asymmetric'),
      asymmetryReason: z.string().min(1).max(1_000),
    }),
  ],
);

export const RigidRigV2DofSchema = z
  .strictObject({
    id: SemanticIdSchema,
    axis: z.enum(['x', 'y', 'z']),
    order: z.number().int().min(0).max(2),
    minimumDegrees: z.number().finite().min(-180).max(180),
    maximumDegrees: z.number().finite().min(-180).max(180),
    restDegrees: z.number().finite().min(-180).max(180),
    mirrorDofId: SemanticIdSchema.optional(),
    mirrorSign: z.union([z.literal(-1), z.literal(1)]).optional(),
  })
  .superRefine((dof, context) => {
    if (dof.minimumDegrees > dof.maximumDegrees)
      context.addIssue({
        code: 'custom',
        path: ['maximumDegrees'],
        message: 'DOF maximum must not be less than its minimum.',
      });
    if (
      dof.restDegrees < dof.minimumDegrees ||
      dof.restDegrees > dof.maximumDegrees
    )
      context.addIssue({
        code: 'custom',
        path: ['restDegrees'],
        message: 'DOF rest value must remain inside its limits.',
      });
    if ((dof.mirrorDofId === undefined) !== (dof.mirrorSign === undefined))
      context.addIssue({
        code: 'custom',
        path: ['mirrorDofId'],
        message: 'Mirror DOF identity and sign must be declared together.',
      });
  });

const RigidRigV2JointBase = {
  id: SemanticIdSchema,
  partId: SemanticIdSchema,
  parentJointId: SemanticIdSchema.optional(),
  pivot: z.strictObject({
    position: Vec3Schema,
    rotation: QuaternionSchema,
  }),
  rotationOrder: z.enum(['XYZ', 'XZY', 'YXZ', 'YZX', 'ZXY', 'ZYX']),
  dofs: z
    .array(RigidRigV2DofSchema)
    .min(1)
    .max(RIGID_RIG_V2_BUDGETS.maximumDegreesOfFreedomPerJoint),
} as const;

export const RigidRigV2JointSchema = z.discriminatedUnion('mirrorPolicy', [
  z.strictObject({
    ...RigidRigV2JointBase,
    mirrorPolicy: z.literal('center'),
  }),
  z.strictObject({
    ...RigidRigV2JointBase,
    mirrorPolicy: z.literal('paired'),
    mirrorJointId: SemanticIdSchema,
  }),
  z.strictObject({
    ...RigidRigV2JointBase,
    mirrorPolicy: z.literal('asymmetric'),
    asymmetryReason: z.string().min(1).max(1_000),
  }),
]);

const RigidRigProfileV2PayloadBaseSchema = z.strictObject({
  contractId: z.literal(RIGID_RIG_PROFILE_V2_CONTRACT_ID),
  assetRevisionId: AssetRevisionIdSchema,
  morphologyRevisionId: MorphologyRevisionIdSchema,
  equipmentSignature: EquipmentSignatureSchema,
  assemblySignature: AssemblySignatureSchema,
  rootPartId: SemanticIdSchema,
  rootJointId: SemanticIdSchema,
  assemblyHierarchy: z
    .array(RigidRigV2AssemblyPartSchema)
    .min(1)
    .max(RIGID_RIG_V2_BUDGETS.maximumAssemblyParts),
  joints: z
    .array(RigidRigV2JointSchema)
    .min(1)
    .max(RIGID_RIG_V2_BUDGETS.maximumJoints),
});

type RigidRigProfileV2PayloadValue = z.infer<
  typeof RigidRigProfileV2PayloadBaseSchema
>;

function validateRigPayload(
  rig: RigidRigProfileV2PayloadValue,
  context: z.RefinementCtx,
): void {
  const partsById = new Map<string, (typeof rig.assemblyHierarchy)[number]>();
  for (const [index, part] of rig.assemblyHierarchy.entries()) {
    if (partsById.has(part.partId))
      context.addIssue({
        code: 'custom',
        path: ['assemblyHierarchy', index, 'partId'],
        message: 'Assembly part IDs must be unique.',
      });
    partsById.set(part.partId, part);
  }

  const assemblyRoots = rig.assemblyHierarchy.filter(
    (part) => part.parentPartId === undefined,
  );
  if (assemblyRoots.length !== 1 || assemblyRoots[0]?.partId !== rig.rootPartId)
    context.addIssue({
      code: 'custom',
      path: ['rootPartId'],
      message: 'Assembly hierarchy must have exactly one declared root part.',
    });

  if (partsById.get(rig.rootPartId)?.mirrorPolicy !== 'center')
    context.addIssue({
      code: 'custom',
      path: ['rootPartId'],
      message: 'The assembly root must be mirror-invariant center geometry.',
    });

  for (const [index, part] of rig.assemblyHierarchy.entries()) {
    if (part.parentPartId !== undefined && !partsById.has(part.parentPartId))
      context.addIssue({
        code: 'custom',
        path: ['assemblyHierarchy', index, 'parentPartId'],
        message: 'Assembly parents must reference known parts.',
      });

    if (
      part.mirrorPolicy === 'center' &&
      part.parentPartId !== undefined &&
      partsById.get(part.parentPartId)?.mirrorPolicy !== 'center'
    )
      context.addIssue({
        code: 'custom',
        path: ['assemblyHierarchy', index, 'parentPartId'],
        message:
          'Center assembly parts require a mirror-invariant center parent chain.',
      });

    const visited = new Set<string>([part.partId]);
    let parentId = part.parentPartId;
    let depth = 0;
    while (parentId !== undefined) {
      depth += 1;
      if (visited.has(parentId)) {
        context.addIssue({
          code: 'custom',
          path: ['assemblyHierarchy', index, 'parentPartId'],
          message: 'Assembly hierarchy must be acyclic.',
        });
        break;
      }
      if (depth > RIGID_RIG_V2_BUDGETS.maximumHierarchyDepth) {
        context.addIssue({
          code: 'custom',
          path: ['assemblyHierarchy', index],
          message: 'Assembly hierarchy exceeds the supported depth budget.',
          params: {
            domainCode: 'BUDGET_EXCEEDED',
            budget: 'maximumHierarchyDepth',
            maximum: RIGID_RIG_V2_BUDGETS.maximumHierarchyDepth,
            actual: depth,
          },
        });
        break;
      }
      visited.add(parentId);
      parentId = partsById.get(parentId)?.parentPartId;
    }

    if (part.mirrorPolicy === 'paired') {
      const mirror = partsById.get(part.mirrorPartId);
      if (
        part.mirrorPartId === part.partId ||
        mirror?.mirrorPolicy !== 'paired' ||
        mirror.mirrorPartId !== part.partId
      )
        context.addIssue({
          code: 'custom',
          path: ['assemblyHierarchy', index, 'mirrorPartId'],
          message:
            'Paired assembly parts must be known, distinct, and reciprocal.',
        });
      else {
        const expectedMirrorParentId =
          part.parentPartId === undefined
            ? undefined
            : assemblyMirrorTarget(partsById.get(part.parentPartId));
        if (
          (part.parentPartId === undefined &&
            mirror.parentPartId !== undefined) ||
          (part.parentPartId !== undefined &&
            (expectedMirrorParentId === undefined ||
              mirror.parentPartId !== expectedMirrorParentId))
        )
          context.addIssue({
            code: 'custom',
            path: ['assemblyHierarchy', index, 'parentPartId'],
            message:
              'Paired assembly parts require mirror-consistent parent chains.',
          });
      }
    }
  }

  const jointsById = new Map<string, (typeof rig.joints)[number]>();
  const controlledPartIds = new Set<string>();
  let totalDofs = 0;
  for (const [jointIndex, joint] of rig.joints.entries()) {
    totalDofs += joint.dofs.length;
    if (jointsById.has(joint.id))
      context.addIssue({
        code: 'custom',
        path: ['joints', jointIndex, 'id'],
        message: 'Joint IDs must be unique.',
      });
    jointsById.set(joint.id, joint);
    if (controlledPartIds.has(joint.partId))
      context.addIssue({
        code: 'custom',
        path: ['joints', jointIndex, 'partId'],
        message: 'A rigid part may be controlled by only one joint.',
      });
    controlledPartIds.add(joint.partId);
    if (!partsById.has(joint.partId))
      context.addIssue({
        code: 'custom',
        path: ['joints', jointIndex, 'partId'],
        message: 'Every joint must control a part in the assembly hierarchy.',
      });

    const dofIds = new Set<string>();
    const axes = new Set<string>();
    const orders = new Set<number>();
    for (const [dofIndex, dof] of joint.dofs.entries()) {
      if (dofIds.has(dof.id))
        context.addIssue({
          code: 'custom',
          path: ['joints', jointIndex, 'dofs', dofIndex, 'id'],
          message: 'DOF IDs must be unique within a joint.',
        });
      if (axes.has(dof.axis))
        context.addIssue({
          code: 'custom',
          path: ['joints', jointIndex, 'dofs', dofIndex, 'axis'],
          message: 'A joint may expose each local axis at most once.',
        });
      if (orders.has(dof.order))
        context.addIssue({
          code: 'custom',
          path: ['joints', jointIndex, 'dofs', dofIndex, 'order'],
          message: 'DOF evaluation order must be unique within a joint.',
        });
      dofIds.add(dof.id);
      axes.add(dof.axis);
      orders.add(dof.order);
    }
    const orderedDofs = [...joint.dofs].sort(
      (left, right) => left.order - right.order,
    );
    if (
      orderedDofs.some((dof, index) => dof.order !== index) ||
      joint.rotationOrder !==
        canonicalRotationOrder(orderedDofs.map(({ axis }) => axis))
    )
      context.addIssue({
        code: 'custom',
        path: ['joints', jointIndex, 'dofs'],
        message:
          'DOF orders must be contiguous and match the declared rotation order.',
      });
  }

  if (totalDofs > RIGID_RIG_V2_BUDGETS.maximumDegreesOfFreedom)
    context.addIssue({
      code: 'custom',
      path: ['joints'],
      message: 'Rig exceeds the total degree-of-freedom budget.',
      params: {
        domainCode: 'BUDGET_EXCEEDED',
        budget: 'maximumDegreesOfFreedom',
        maximum: RIGID_RIG_V2_BUDGETS.maximumDegreesOfFreedom,
        actual: totalDofs,
      },
    });

  const rootJoint = jointsById.get(rig.rootJointId);
  if (
    rootJoint === undefined ||
    rootJoint.parentJointId !== undefined ||
    rootJoint.partId !== rig.rootPartId
  )
    context.addIssue({
      code: 'custom',
      path: ['rootJointId'],
      message:
        'Root joint must exist, have no parent, and control the root part.',
    });

  for (const [jointIndex, joint] of rig.joints.entries()) {
    if (joint.id !== rig.rootJointId) {
      const parent =
        joint.parentJointId === undefined
          ? undefined
          : jointsById.get(joint.parentJointId);
      if (parent === undefined)
        context.addIssue({
          code: 'custom',
          path: ['joints', jointIndex, 'parentJointId'],
          message: 'Every non-root joint requires a known parent joint.',
        });
      else {
        const controlledPartToJoint = new Map(
          rig.joints.map((candidate) => [candidate.partId, candidate.id]),
        );
        let assemblyParentId = partsById.get(joint.partId)?.parentPartId;
        let nearestControlledJointId: string | undefined;
        while (assemblyParentId !== undefined) {
          nearestControlledJointId =
            controlledPartToJoint.get(assemblyParentId);
          if (nearestControlledJointId !== undefined) break;
          assemblyParentId = partsById.get(assemblyParentId)?.parentPartId;
        }
        if (nearestControlledJointId !== parent.id)
          context.addIssue({
            code: 'custom',
            path: ['joints', jointIndex, 'parentJointId'],
            message:
              'Joint parent must be the nearest controlled assembly ancestor.',
          });
      }
    }

    if (joint.parentJointId === joint.id)
      context.addIssue({
        code: 'custom',
        path: ['joints', jointIndex, 'parentJointId'],
        message: 'A joint cannot parent itself.',
      });

    const visited = new Set<string>([joint.id]);
    let parentJointId = joint.parentJointId;
    while (parentJointId !== undefined) {
      if (visited.has(parentJointId)) {
        context.addIssue({
          code: 'custom',
          path: ['joints', jointIndex, 'parentJointId'],
          message: 'Joint hierarchy must be acyclic.',
        });
        break;
      }
      visited.add(parentJointId);
      parentJointId = jointsById.get(parentJointId)?.parentJointId;
    }

    const controlledPart = partsById.get(joint.partId);
    if (
      joint.mirrorPolicy === 'center' &&
      controlledPart?.mirrorPolicy !== 'center'
    )
      context.addIssue({
        code: 'custom',
        path: ['joints', jointIndex, 'mirrorPolicy'],
        message: 'Center joints may control only center assembly parts.',
      });
    if (
      controlledPart?.mirrorPolicy === 'paired' &&
      joint.mirrorPolicy === 'center'
    )
      context.addIssue({
        code: 'custom',
        path: ['joints', jointIndex, 'mirrorPolicy'],
        message:
          'Joints controlling paired parts must be reciprocal paired joints or explicitly reasoned asymmetric.',
      });
    if (
      controlledPart?.mirrorPolicy === 'asymmetric' &&
      joint.mirrorPolicy !== 'asymmetric'
    )
      context.addIssue({
        code: 'custom',
        path: ['joints', jointIndex, 'mirrorPolicy'],
        message: 'Asymmetric assembly parts require asymmetric joints.',
      });

    if (joint.mirrorPolicy === 'paired') {
      const mirror = jointsById.get(joint.mirrorJointId);
      if (
        mirror?.mirrorPolicy !== 'paired' ||
        mirror?.mirrorJointId !== joint.id ||
        joint.mirrorJointId === joint.id
      )
        context.addIssue({
          code: 'custom',
          path: ['joints', jointIndex, 'mirrorJointId'],
          message: 'Mirror joints must be known and reciprocal.',
        });
      else {
        const part = partsById.get(joint.partId);
        if (
          part?.mirrorPolicy !== 'paired' ||
          part.mirrorPartId !== mirror.partId
        )
          context.addIssue({
            code: 'custom',
            path: ['joints', jointIndex, 'mirrorJointId'],
            message:
              'Mirror joints must control the reciprocal paired assembly parts.',
          });
        const expectedPosition = reflectPositionAcrossYZ(joint.pivot.position);
        const expectedRotation = reflectQuaternionAcrossYZ(
          joint.pivot.rotation,
        );
        if (
          !tupleClose(mirror.pivot.position, expectedPosition) ||
          !tupleClose(
            canonicalQuaternion(mirror.pivot.rotation),
            canonicalQuaternion(expectedRotation),
          )
        )
          context.addIssue({
            code: 'custom',
            path: ['joints', jointIndex, 'pivot'],
            message: 'Mirror joint pivots must be exact YZ reflections.',
          });
        if (
          joint.dofs.length !== mirror.dofs.length ||
          joint.dofs.some((dof) => dof.mirrorDofId === undefined)
        )
          context.addIssue({
            code: 'custom',
            path: ['joints', jointIndex, 'dofs'],
            message: 'Paired mirror joints require a complete DOF mapping.',
          });
        for (const [dofIndex, dof] of joint.dofs.entries()) {
          if (dof.mirrorDofId === undefined) continue;
          const mirrorDof = mirror.dofs.find(
            (candidate) => candidate.id === dof.mirrorDofId,
          );
          if (
            mirrorDof?.mirrorDofId !== dof.id ||
            mirrorDof.mirrorSign !== dof.mirrorSign ||
            mirrorDof.axis !== dof.axis ||
            mirrorDof.order !== dof.order ||
            !mirroredDofValuesMatch(dof, mirrorDof)
          )
            context.addIssue({
              code: 'custom',
              path: ['joints', jointIndex, 'dofs', dofIndex, 'mirrorDofId'],
              message:
                'Mirror DOFs must be reciprocal with matching axis, order, signed limits, and rest.',
            });
        }
      }
    } else if (joint.dofs.some((dof) => dof.mirrorDofId !== undefined))
      context.addIssue({
        code: 'custom',
        path: ['joints', jointIndex, 'dofs'],
        message:
          'Center and asymmetric joints cannot declare paired DOF mappings.',
      });
  }
}

function assemblyMirrorTarget(
  part: RigidRigProfileV2PayloadValue['assemblyHierarchy'][number] | undefined,
): string | undefined {
  if (part?.mirrorPolicy === 'center') return part.partId;
  if (part?.mirrorPolicy === 'paired') return part.mirrorPartId;
  return undefined;
}

function canonicalRotationOrder(axes: readonly ('x' | 'y' | 'z')[]): string {
  const suffix = (['x', 'y', 'z'] as const).filter(
    (axis) => !axes.includes(axis),
  );
  return [...axes, ...suffix].join('').toUpperCase();
}

function reflectPositionAcrossYZ(
  value: readonly [number, number, number],
): [number, number, number] {
  return [-value[0], value[1], value[2]];
}

function reflectQuaternionAcrossYZ(
  value: readonly [number, number, number, number],
): [number, number, number, number] {
  return [value[0], -value[1], -value[2], value[3]];
}

function tupleClose(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.every((value, index) => Math.abs(value - right[index]!) <= 1e-6);
}

function mirroredDofValuesMatch(
  source: z.infer<typeof RigidRigV2DofSchema>,
  mirror: z.infer<typeof RigidRigV2DofSchema>,
): boolean {
  const sign = source.mirrorSign!;
  return (
    mirror.minimumDegrees ===
      (sign === 1 ? source.minimumDegrees : -source.maximumDegrees) &&
    mirror.maximumDegrees ===
      (sign === 1 ? source.maximumDegrees : -source.minimumDegrees) &&
    mirror.restDegrees === source.restDegrees * sign
  );
}

export const RigidRigProfileV2PayloadSchema =
  RigidRigProfileV2PayloadBaseSchema.superRefine(validateRigPayload);

export const RigidRigProfileV2Schema =
  RigidRigProfileV2PayloadBaseSchema.extend({
    profileId: RigProfileIdSchema,
  }).superRefine(validateRigPayload);

export type RigidRigProfileV2Payload = z.infer<
  typeof RigidRigProfileV2PayloadSchema
>;
export type RigidRigProfileV2 = z.infer<typeof RigidRigProfileV2Schema>;

function canonicalJsonValue(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJsonValue(item)).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(
        ([key, child]) => `${JSON.stringify(key)}:${canonicalJsonValue(child)}`,
      )
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function normalizeRigidRigProfileV2Payload(
  value: RigidRigProfileV2Payload,
): RigidRigProfileV2Payload {
  const parsed = parseDomainValue(RigidRigProfileV2PayloadSchema, value, [
    'rig',
  ]);
  return normalizeRigidRigProfileV2PayloadUnchecked(parsed);
}

function normalizeRigidRigProfileV2PayloadUnchecked(
  parsed: RigidRigProfileV2Payload,
): RigidRigProfileV2Payload {
  return {
    ...parsed,
    assemblyHierarchy: [...parsed.assemblyHierarchy].sort((left, right) =>
      left.partId.localeCompare(right.partId),
    ),
    joints: [...parsed.joints]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((joint) => ({
        ...joint,
        pivot: {
          ...joint.pivot,
          rotation: canonicalQuaternion(joint.pivot.rotation),
        },
        dofs: [...joint.dofs].sort(
          (left, right) =>
            left.order - right.order || left.id.localeCompare(right.id),
        ),
      })),
  };
}

function canonicalQuaternion(
  value: [number, number, number, number],
): [number, number, number, number] {
  const firstNonZero = value.find((component) => component !== 0);
  return firstNonZero !== undefined && firstNonZero < 0
    ? (value.map((component) => -component) as [number, number, number, number])
    : [...value];
}

export function canonicalRigidRigProfileV2Payload(
  value: RigidRigProfileV2Payload,
): string {
  return canonicalJsonValue(normalizeRigidRigProfileV2Payload(value));
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function createRigidRigProfileV2(
  value: RigidRigProfileV2Payload,
): Promise<RigidRigProfileV2> {
  const normalized = normalizeRigidRigProfileV2Payload(value);
  const profileId = `rig-v2.${await sha256(canonicalJsonValue(normalized))}`;
  return parseDomainValue(
    RigidRigProfileV2Schema,
    { ...normalized, profileId },
    ['rig'],
  );
}

export async function verifyRigidRigProfileV2Identity(
  value: RigidRigProfileV2,
): Promise<boolean> {
  try {
    const { profileId, ...payload } = structuredClone(value);
    if (!RigProfileIdSchema.safeParse(profileId).success) return false;
    const normalized = normalizeRigidRigProfileV2PayloadUnchecked(payload);
    return (
      profileId === `rig-v2.${await sha256(canonicalJsonValue(normalized))}`
    );
  } catch {
    return false;
  }
}

export const RigidRigV2DigestSchema = Sha256Schema;
