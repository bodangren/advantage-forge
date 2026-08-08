import {
  RIGID_RIG_PROFILE_V2_CONTRACT_ID,
  type RigidRigProfileV2Payload,
} from '../../src/contracts/rigid-rig-v2.js';

const hex = (character: string) => character.repeat(64);

export function validRigPayload(): RigidRigProfileV2Payload {
  return {
    contractId: RIGID_RIG_PROFILE_V2_CONTRACT_ID,
    assetRevisionId: `revision.${hex('1')}`,
    morphologyRevisionId: `morphology.${hex('2')}`,
    equipmentSignature: `equipment.${hex('3')}`,
    assemblySignature: `assembly.${hex('4')}`,
    rootPartId: 'body.root',
    rootJointId: 'joint.root',
    assemblyHierarchy: [
      { partId: 'body.root', mirrorPolicy: 'center' },
      {
        partId: 'arm.left',
        parentPartId: 'body.root',
        mirrorPolicy: 'paired',
        mirrorPartId: 'arm.right',
      },
      {
        partId: 'arm.right',
        parentPartId: 'body.root',
        mirrorPolicy: 'paired',
        mirrorPartId: 'arm.left',
      },
    ],
    joints: [
      {
        id: 'joint.root',
        partId: 'body.root',
        pivot: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
        rotationOrder: 'YXZ',
        mirrorPolicy: 'center',
        dofs: [
          {
            id: 'yaw',
            axis: 'y',
            order: 0,
            minimumDegrees: -90,
            maximumDegrees: 90,
            restDegrees: 0,
          },
        ],
      },
      {
        id: 'joint.arm.left',
        partId: 'arm.left',
        parentJointId: 'joint.root',
        pivot: { position: [-0.5, 0.6, 0], rotation: [0, 0, 0, 1] },
        rotationOrder: 'XYZ',
        mirrorJointId: 'joint.arm.right',
        mirrorPolicy: 'paired',
        dofs: [
          {
            id: 'raise',
            axis: 'x',
            order: 0,
            minimumDegrees: -120,
            maximumDegrees: 120,
            restDegrees: 0,
            mirrorDofId: 'raise',
            mirrorSign: 1,
          },
          {
            id: 'splay',
            axis: 'y',
            order: 1,
            minimumDegrees: -60,
            maximumDegrees: 60,
            restDegrees: 0,
            mirrorDofId: 'splay',
            mirrorSign: -1,
          },
        ],
      },
      {
        id: 'joint.arm.right',
        partId: 'arm.right',
        parentJointId: 'joint.root',
        pivot: { position: [0.5, 0.6, 0], rotation: [0, 0, 0, 1] },
        rotationOrder: 'XYZ',
        mirrorJointId: 'joint.arm.left',
        mirrorPolicy: 'paired',
        dofs: [
          {
            id: 'raise',
            axis: 'x',
            order: 0,
            minimumDegrees: -120,
            maximumDegrees: 120,
            restDegrees: 0,
            mirrorDofId: 'raise',
            mirrorSign: 1,
          },
          {
            id: 'splay',
            axis: 'y',
            order: 1,
            minimumDegrees: -60,
            maximumDegrees: 60,
            restDegrees: 0,
            mirrorDofId: 'splay',
            mirrorSign: -1,
          },
        ],
      },
    ],
  };
}
