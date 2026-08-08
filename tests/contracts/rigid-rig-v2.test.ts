import { describe, expect, it } from 'vitest';

import {
  RIGID_RIG_V2_BUDGETS,
  RigidRigProfileV2PayloadSchema,
  createRigidRigProfileV2,
  verifyRigidRigProfileV2Identity,
} from '../../src/contracts/rigid-rig-v2.js';
import { validRigPayload } from './rig-v2-fixture.js';

describe('forge-rigid-rig-profile/v2', () => {
  it('derives one identity across input ordering and quaternion sign', async () => {
    const first = validRigPayload();
    const reordered = structuredClone(first);
    reordered.assemblyHierarchy.reverse();
    reordered.joints.reverse();
    reordered.joints[0]!.dofs.reverse();
    reordered.joints[0]!.pivot.rotation = [0, 0, 0, -1];

    expect((await createRigidRigProfileV2(first)).profileId).toBe(
      (await createRigidRigProfileV2(reordered)).profileId,
    );
  });

  it('keeps authored DOF evaluation order identity-significant', async () => {
    const first = validRigPayload();
    const changed = structuredClone(first);
    for (const joint of changed.joints.filter((candidate) =>
      candidate.id.startsWith('joint.arm.'),
    )) {
      joint.rotationOrder = 'YXZ';
      joint.dofs[0]!.order = 1;
      joint.dofs[1]!.order = 0;
    }

    expect((await createRigidRigProfileV2(first)).profileId).not.toBe(
      (await createRigidRigProfileV2(changed)).profileId,
    );
  });

  it('rejects alternate unused-axis suffixes for the same active DOFs', () => {
    const alternate = validRigPayload();
    alternate.joints[0]!.rotationOrder = 'YZX';
    expect(RigidRigProfileV2PayloadSchema.safeParse(alternate).success).toBe(
      false,
    );
  });

  it('rejects duplicate axes, order gaps, and non-normalized pivots', () => {
    const duplicateAxis = structuredClone(validRigPayload());
    duplicateAxis.joints[1]!.dofs[1]!.axis = 'x';
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(duplicateAxis).success,
    ).toBe(false);

    const orderGap = structuredClone(validRigPayload());
    orderGap.joints[1]!.dofs[1]!.order = 2;
    expect(RigidRigProfileV2PayloadSchema.safeParse(orderGap).success).toBe(
      false,
    );

    const badQuaternion = structuredClone(validRigPayload());
    badQuaternion.joints[0]!.pivot.rotation = [0, 0, 0, 0.5];
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(badQuaternion).success,
    ).toBe(false);

    const reversedLimits = structuredClone(validRigPayload());
    reversedLimits.joints[0]!.dofs[0]!.minimumDegrees = 30;
    reversedLimits.joints[0]!.dofs[0]!.maximumDegrees = -30;
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(reversedLimits).success,
    ).toBe(false);

    const restOutsideLimits = structuredClone(validRigPayload());
    restOutsideLimits.joints[0]!.dofs[0]!.restDegrees = 120;
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(restOutsideLimits).success,
    ).toBe(false);

    const incompleteDofMirror = structuredClone(validRigPayload());
    incompleteDofMirror.joints[1]!.dofs[0]!.mirrorSign = undefined;
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(incompleteDofMirror).success,
    ).toBe(false);

    const duplicateDofAddress = structuredClone(validRigPayload());
    duplicateDofAddress.joints[1]!.dofs[1]!.id = 'raise';
    duplicateDofAddress.joints[1]!.dofs[1]!.order = 0;
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(duplicateDofAddress).success,
    ).toBe(false);
  });

  it('rejects assembly cycles, root mismatches, and joint ancestry mismatches', () => {
    const cycle = structuredClone(validRigPayload());
    cycle.assemblyHierarchy[0]!.parentPartId = 'arm.left';
    expect(RigidRigProfileV2PayloadSchema.safeParse(cycle).success).toBe(false);

    const wrongRoot = structuredClone(validRigPayload());
    wrongRoot.rootPartId = 'arm.left';
    expect(RigidRigProfileV2PayloadSchema.safeParse(wrongRoot).success).toBe(
      false,
    );

    const wrongAncestry = structuredClone(validRigPayload());
    wrongAncestry.joints[1]!.parentJointId = 'joint.arm.right';
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(wrongAncestry).success,
    ).toBe(false);
  });

  it('rejects unknown, duplicate, and self-referential hierarchy members', () => {
    const unknownAssemblyParent = structuredClone(validRigPayload());
    unknownAssemblyParent.assemblyHierarchy[1]!.parentPartId = 'part.missing';
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(unknownAssemblyParent).success,
    ).toBe(false);

    const duplicatePart = structuredClone(validRigPayload());
    duplicatePart.assemblyHierarchy[2]!.partId = 'arm.left';
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(duplicatePart).success,
    ).toBe(false);

    const duplicateJoint = structuredClone(validRigPayload());
    duplicateJoint.joints[2]!.id = 'joint.arm.left';
    duplicateJoint.joints[2]!.partId = 'arm.left';
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(duplicateJoint).success,
    ).toBe(false);

    const unknownJointPart = structuredClone(validRigPayload());
    unknownJointPart.joints[1]!.partId = 'part.missing';
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(unknownJointPart).success,
    ).toBe(false);

    const selfParent = structuredClone(validRigPayload());
    selfParent.joints[1]!.parentJointId = 'joint.arm.left';
    expect(RigidRigProfileV2PayloadSchema.safeParse(selfParent).success).toBe(
      false,
    );

    const mirroredDofWithoutJoint = structuredClone(validRigPayload());
    Reflect.deleteProperty(mirroredDofWithoutJoint.joints[1]!, 'mirrorJointId');
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(mirroredDofWithoutJoint).success,
    ).toBe(false);

    const missingJointParent = structuredClone(validRigPayload());
    missingJointParent.joints[1]!.parentJointId = undefined;
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(missingJointParent).success,
    ).toBe(false);

    const unmirroredChannel = structuredClone(validRigPayload());
    for (const joint of unmirroredChannel.joints.slice(1)) {
      Reflect.set(joint, 'mirrorPolicy', 'asymmetric');
      Reflect.deleteProperty(joint, 'mirrorJointId');
      Reflect.set(
        joint,
        'asymmetryReason',
        'This joint is intentionally authored one-sided.',
      );
      for (const dof of joint.dofs) {
        dof.mirrorDofId = undefined;
        dof.mirrorSign = undefined;
      }
    }
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(unmirroredChannel).success,
    ).toBe(true);
  });

  it('enforces reciprocal joint and DOF mirrors', () => {
    const oneWayJoint = structuredClone(validRigPayload());
    Reflect.deleteProperty(oneWayJoint.joints[2]!, 'mirrorJointId');
    expect(RigidRigProfileV2PayloadSchema.safeParse(oneWayJoint).success).toBe(
      false,
    );

    const wrongDof = structuredClone(validRigPayload());
    wrongDof.joints[2]!.dofs[0]!.mirrorSign = -1;
    expect(RigidRigProfileV2PayloadSchema.safeParse(wrongDof).success).toBe(
      false,
    );

    const wrongPivot = structuredClone(validRigPayload());
    wrongPivot.joints[2]!.pivot.position[0] = 0.6;
    expect(RigidRigProfileV2PayloadSchema.safeParse(wrongPivot).success).toBe(
      false,
    );

    const equivalentQuaternionSign = structuredClone(validRigPayload());
    equivalentQuaternionSign.joints[2]!.pivot.rotation = [0, 0, 0, -1];
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(equivalentQuaternionSign)
        .success,
    ).toBe(true);

    const reflectedRotation = structuredClone(validRigPayload());
    const sine = Math.sin(Math.PI / 8);
    const cosine = Math.cos(Math.PI / 8);
    reflectedRotation.joints[1]!.pivot.rotation = [0, sine, 0, cosine];
    reflectedRotation.joints[2]!.pivot.rotation = [0, sine, 0, -cosine];
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(reflectedRotation).success,
    ).toBe(true);
    reflectedRotation.joints[2]!.pivot.rotation = [0, sine, 0, cosine];
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(reflectedRotation).success,
    ).toBe(false);

    const wrongLimit = structuredClone(validRigPayload());
    wrongLimit.joints[2]!.dofs[0]!.maximumDegrees = 100;
    expect(RigidRigProfileV2PayloadSchema.safeParse(wrongLimit).success).toBe(
      false,
    );
  });

  it('requires explicit joint mirror policy and reasoned asymmetric paired-part joints', () => {
    const missingPolicy = structuredClone(validRigPayload());
    Reflect.deleteProperty(missingPolicy.joints[0]!, 'mirrorPolicy');
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(missingPolicy).success,
    ).toBe(false);

    const asymmetric = structuredClone(validRigPayload());
    asymmetric.joints = asymmetric.joints.map((joint) => {
      if (joint.mirrorPolicy !== 'paired') return joint;
      const { mirrorJointId: _mirrorJointId, ...jointWithoutMirror } = joint;
      void _mirrorJointId;
      return {
        ...jointWithoutMirror,
        mirrorPolicy: 'asymmetric' as const,
        asymmetryReason:
          'This paired assembly limb has intentionally one-sided joint behavior.',
        dofs: joint.dofs.map((dof) => {
          const {
            mirrorDofId: _mirrorDofId,
            mirrorSign: _mirrorSign,
            ...dofWithoutMirror
          } = dof;
          void _mirrorDofId;
          void _mirrorSign;
          return dofWithoutMirror;
        }),
      };
    });
    expect(RigidRigProfileV2PayloadSchema.safeParse(asymmetric).success).toBe(
      true,
    );

    const missingReason = structuredClone(asymmetric);
    Reflect.deleteProperty(missingReason.joints[1]!, 'asymmetryReason');
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(missingReason).success,
    ).toBe(false);
  });

  it('requires explicit assembly mirror identity and mirror-consistent parent chains', () => {
    const missingPolicy = structuredClone(validRigPayload());
    Reflect.deleteProperty(missingPolicy.assemblyHierarchy[0]!, 'mirrorPolicy');
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(missingPolicy).success,
    ).toBe(false);

    const oneWay = structuredClone(validRigPayload());
    const oneWayPart = oneWay.assemblyHierarchy[1]!;
    if (oneWayPart.mirrorPolicy !== 'paired')
      throw new Error('Expected paired arm fixture.');
    oneWayPart.mirrorPartId = 'arm.left';
    expect(RigidRigProfileV2PayloadSchema.safeParse(oneWay).success).toBe(
      false,
    );

    const missingAsymmetryReason = structuredClone(validRigPayload());
    missingAsymmetryReason.assemblyHierarchy.push({
      partId: 'cape.anchor',
      parentPartId: 'body.root',
      mirrorPolicy: 'asymmetric',
      asymmetryReason: 'The cape has one authored anchor.',
    });
    Reflect.deleteProperty(
      missingAsymmetryReason.assemblyHierarchy.at(-1)!,
      'asymmetryReason',
    );
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(missingAsymmetryReason).success,
    ).toBe(false);

    const unjointedPair = structuredClone(validRigPayload());
    unjointedPair.assemblyHierarchy.push(
      {
        partId: 'hand.left',
        parentPartId: 'arm.left',
        mirrorPolicy: 'paired',
        mirrorPartId: 'hand.right',
      },
      {
        partId: 'hand.right',
        parentPartId: 'arm.right',
        mirrorPolicy: 'paired',
        mirrorPartId: 'hand.left',
      },
    );
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(unjointedPair).success,
    ).toBe(true);

    const wrongParentChain = structuredClone(unjointedPair);
    wrongParentChain.assemblyHierarchy.at(-1)!.parentPartId = 'body.root';
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(wrongParentChain).success,
    ).toBe(false);

    const centerUnderPairedParent = structuredClone(validRigPayload());
    centerUnderPairedParent.assemblyHierarchy.push({
      partId: 'badge.center',
      parentPartId: 'arm.left',
      mirrorPolicy: 'center',
    });
    expect(
      RigidRigProfileV2PayloadSchema.safeParse(centerUnderPairedParent).success,
    ).toBe(false);
  });

  it('rejects skipping the nearest controlled assembly ancestor', () => {
    const skipped = validRigPayload();
    skipped.assemblyHierarchy.push({
      partId: 'hand.left',
      parentPartId: 'arm.left',
      mirrorPolicy: 'asymmetric',
      asymmetryReason: 'The ancestry fixture includes only one hand.',
    });
    skipped.joints.push({
      id: 'joint.hand.left',
      partId: 'hand.left',
      parentJointId: 'joint.root',
      pivot: { position: [-0.7, 0.3, 0], rotation: [0, 0, 0, 1] },
      rotationOrder: 'XYZ',
      mirrorPolicy: 'asymmetric',
      asymmetryReason: 'The one-sided hand joint is intentionally asymmetric.',
      dofs: [
        {
          id: 'bend',
          axis: 'x',
          order: 0,
          minimumDegrees: -45,
          maximumDegrees: 45,
          restDegrees: 0,
        },
      ],
    });
    expect(RigidRigProfileV2PayloadSchema.safeParse(skipped).success).toBe(
      false,
    );
    skipped.joints.at(-1)!.parentJointId = 'joint.arm.left';
    expect(RigidRigProfileV2PayloadSchema.safeParse(skipped).success).toBe(
      true,
    );
  });

  it('accepts exact joint budgets and rejects budget plus one', async () => {
    const boundary = validRigPayload();
    const root = boundary.joints[0]!;
    boundary.joints = Array.from(
      { length: RIGID_RIG_V2_BUDGETS.maximumJoints },
      (_, index) =>
        index === 0
          ? root
          : {
              ...structuredClone(root),
              id: `joint.extra-${index}`,
              partId: `part.extra-${index}`,
              parentJointId: 'joint.root',
            },
    );
    boundary.assemblyHierarchy = [
      { partId: 'body.root', mirrorPolicy: 'center' },
      ...Array.from(
        { length: RIGID_RIG_V2_BUDGETS.maximumJoints - 1 },
        (_, index) => ({
          partId: `part.extra-${index + 1}`,
          parentPartId: 'body.root',
          mirrorPolicy: 'center' as const,
        }),
      ),
    ];
    expect(RigidRigProfileV2PayloadSchema.safeParse(boundary).success).toBe(
      true,
    );

    const over = structuredClone(boundary);
    over.joints.push({
      ...structuredClone(root),
      id: 'joint.over-budget',
      partId: 'part.over-budget',
      parentJointId: 'joint.root',
    });
    over.assemblyHierarchy.push({
      partId: 'part.over-budget',
      parentPartId: 'body.root',
      mirrorPolicy: 'center',
    });
    expect(RigidRigProfileV2PayloadSchema.safeParse(over).success).toBe(false);
    const overBudget = createRigidRigProfileV2(over);
    await expect(overBudget).rejects.toMatchObject({
      code: 'BUDGET_EXCEEDED',
      path: ['rig', 'joints'],
    });
    await expect(overBudget).rejects.toThrow(/array/i);
  });

  it('covers exact and plus-one assembly, depth, per-joint, and total DOF budgets', async () => {
    const assembly = validRigPayload();
    assembly.assemblyHierarchy.push(
      ...Array.from(
        {
          length:
            RIGID_RIG_V2_BUDGETS.maximumAssemblyParts -
            assembly.assemblyHierarchy.length,
        },
        (_, index) => ({
          partId: `decor.${index}`,
          parentPartId: 'body.root',
          mirrorPolicy: 'asymmetric' as const,
          asymmetryReason: 'Budget-only decoration has no bilateral pair.',
        }),
      ),
    );
    expect(RigidRigProfileV2PayloadSchema.safeParse(assembly).success).toBe(
      true,
    );
    assembly.assemblyHierarchy.push({
      partId: 'decor.over',
      parentPartId: 'body.root',
      mirrorPolicy: 'asymmetric',
      asymmetryReason: 'Budget-plus-one decoration has no bilateral pair.',
    });
    expect(RigidRigProfileV2PayloadSchema.safeParse(assembly).success).toBe(
      false,
    );

    const depth = validRigPayload();
    let parentPartId = 'body.root';
    for (
      let index = 1;
      index <= RIGID_RIG_V2_BUDGETS.maximumHierarchyDepth;
      index += 1
    ) {
      const partId = `chain.${index}`;
      depth.assemblyHierarchy.push({
        partId,
        parentPartId,
        mirrorPolicy: 'center',
      });
      parentPartId = partId;
    }
    expect(RigidRigProfileV2PayloadSchema.safeParse(depth).success).toBe(true);
    depth.assemblyHierarchy.push({
      partId: 'chain.over',
      parentPartId,
      mirrorPolicy: 'center',
    });
    const depthResult = RigidRigProfileV2PayloadSchema.safeParse(depth);
    expect(depthResult.success).toBe(false);
    if (depthResult.success)
      throw new Error('Expected depth budget rejection.');
    const depthIssue = depthResult.error.issues.find(
      (issue) =>
        issue.code === 'custom' &&
        issue.path.join('.') ===
          `assemblyHierarchy.${depth.assemblyHierarchy.length - 1}`,
    );
    expect(depthIssue?.code).toBe('custom');
    if (depthIssue?.code !== 'custom')
      throw new Error('Expected custom depth budget issue.');
    expect(depthIssue.params).toMatchObject({
      domainCode: 'BUDGET_EXCEEDED',
      budget: 'maximumHierarchyDepth',
      maximum: RIGID_RIG_V2_BUDGETS.maximumHierarchyDepth,
      actual: RIGID_RIG_V2_BUDGETS.maximumHierarchyDepth + 1,
    });
    await expect(createRigidRigProfileV2(depth)).rejects.toMatchObject({
      code: 'BUDGET_EXCEEDED',
      path: ['rig', 'assemblyHierarchy', depth.assemblyHierarchy.length - 1],
    });

    const threeDofs = [
      {
        id: 'axis.x',
        axis: 'x' as const,
        order: 0,
        minimumDegrees: -90,
        maximumDegrees: 90,
        restDegrees: 0,
      },
      {
        id: 'axis.y',
        axis: 'y' as const,
        order: 1,
        minimumDegrees: -90,
        maximumDegrees: 90,
        restDegrees: 0,
      },
      {
        id: 'axis.z',
        axis: 'z' as const,
        order: 2,
        minimumDegrees: -90,
        maximumDegrees: 90,
        restDegrees: 0,
      },
    ];
    const perJoint = validRigPayload();
    perJoint.joints[0]!.rotationOrder = 'XYZ';
    perJoint.joints[0]!.dofs = structuredClone(threeDofs);
    expect(RigidRigProfileV2PayloadSchema.safeParse(perJoint).success).toBe(
      true,
    );
    perJoint.joints[0]!.dofs.push({
      ...threeDofs[0]!,
      id: 'axis.over',
      order: 2,
    });
    expect(RigidRigProfileV2PayloadSchema.safeParse(perJoint).success).toBe(
      false,
    );

    const total = validRigPayload();
    total.assemblyHierarchy = [{ partId: 'body.root', mirrorPolicy: 'center' }];
    total.joints = Array.from(
      { length: RIGID_RIG_V2_BUDGETS.maximumJoints },
      (_, index) => {
        const root = index === 0;
        const partId = root ? 'body.root' : `part.total-${index}`;
        if (!root)
          total.assemblyHierarchy.push({
            partId,
            parentPartId: 'body.root',
            mirrorPolicy: 'center',
          });
        return {
          id: root ? 'joint.root' : `joint.total-${index}`,
          partId,
          ...(root ? {} : { parentJointId: 'joint.root' }),
          pivot: {
            position: [0, 0, 0] as [number, number, number],
            rotation: [0, 0, 0, 1] as [number, number, number, number],
          },
          rotationOrder: 'XYZ' as const,
          mirrorPolicy: 'center' as const,
          dofs: structuredClone(threeDofs),
        };
      },
    );
    expect(
      total.joints.reduce((count, joint) => count + joint.dofs.length, 0),
    ).toBe(RIGID_RIG_V2_BUDGETS.maximumDegreesOfFreedom);
    expect(RigidRigProfileV2PayloadSchema.safeParse(total).success).toBe(true);
    total.joints[0]!.dofs.push({
      ...threeDofs[0]!,
      id: 'axis.total-over',
      order: 2,
    });
    const totalResult = RigidRigProfileV2PayloadSchema.safeParse(total);
    expect(totalResult.success).toBe(false);
    if (totalResult.success) throw new Error('Expected total DOF rejection.');
    const totalIssue = totalResult.error.issues.find(
      (issue) => issue.code === 'custom' && issue.path.join('.') === 'joints',
    );
    expect(totalIssue?.code).toBe('custom');
    if (totalIssue?.code !== 'custom')
      throw new Error('Expected custom total DOF budget issue.');
    expect(totalIssue.params).toMatchObject({
      domainCode: 'BUDGET_EXCEEDED',
      budget: 'maximumDegreesOfFreedom',
      maximum: RIGID_RIG_V2_BUDGETS.maximumDegreesOfFreedom,
      actual: RIGID_RIG_V2_BUDGETS.maximumDegreesOfFreedom + 1,
    });
    await expect(createRigidRigProfileV2(total)).rejects.toMatchObject({
      code: 'BUDGET_EXCEEDED',
      path: ['rig', 'joints'],
    });
  });

  it('detects mutation of an immutable identified profile', async () => {
    const profile = await createRigidRigProfileV2(validRigPayload());
    expect(await verifyRigidRigProfileV2Identity(profile)).toBe(true);
    profile.joints[0]!.dofs[0]!.maximumDegrees = 80;
    expect(await verifyRigidRigProfileV2Identity(profile)).toBe(false);
  });
});
