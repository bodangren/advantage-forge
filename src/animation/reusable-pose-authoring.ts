import {
  ForgeDomainError,
  PoseLibrarySchema,
  ReusablePoseSchema,
  RigidRigProfileV2Schema,
  createPoseLibrary,
  parseDomainValue,
  validatePoseLibraryAgainstRig,
  type PoseLibrary,
  type RigidRigProfileV2,
} from '../contracts/index.js';

type ReusablePose = PoseLibrary['poses'][number];

export interface MirroredReusablePosePair {
  readonly source: ReusablePose;
  readonly mirror: ReusablePose;
}

export interface CompiledReusablePoseChannel {
  readonly jointId: string;
  readonly dofId: string;
  readonly valueDegrees: number;
  readonly source: 'authored' | 'rest';
}

export interface CompiledReusablePoseLibrary {
  readonly libraryId: string;
  readonly rigProfileId: string;
  readonly poses: readonly (Omit<ReusablePose, 'channels'> & {
    readonly channels: readonly CompiledReusablePoseChannel[];
  })[];
}

export async function compileReusablePoseLibrary(
  libraryValue: PoseLibrary,
  rigValue: RigidRigProfileV2,
): Promise<CompiledReusablePoseLibrary> {
  await validatePoseLibraryAgainstRig(libraryValue, rigValue);
  const library = parseDomainValue(
    PoseLibrarySchema,
    structuredClone(libraryValue),
    ['poseLibrary'],
  );
  const rig = parseDomainValue(
    RigidRigProfileV2Schema,
    structuredClone(rigValue),
    ['rig'],
  );
  const orderedJoints = hierarchyOrderedJoints(rig);
  return {
    libraryId: library.libraryId,
    rigProfileId: rig.profileId,
    poses: library.poses.map((pose) => {
      const authored = new Map(
        pose.channels.map((channel) => [
          `${channel.jointId}/${channel.dofId}`,
          channel.valueDegrees,
        ]),
      );
      return {
        ...structuredClone(pose),
        channels: orderedJoints.flatMap((joint) =>
          [...joint.dofs]
            .sort((left, right) => left.order - right.order)
            .map((dof) => {
              const key = `${joint.id}/${dof.id}`;
              const value = authored.get(key);
              return {
                jointId: joint.id,
                dofId: dof.id,
                valueDegrees: value ?? dof.restDegrees,
                source:
                  value === undefined
                    ? ('rest' as const)
                    : ('authored' as const),
              };
            }),
        ),
      };
    }),
  };
}

export async function createMirroredReusablePose(
  libraryValue: PoseLibrary,
  rigValue: RigidRigProfileV2,
  sourceSemanticId: string,
  mirrorSemanticId: string,
): Promise<MirroredReusablePosePair> {
  await validatePoseLibraryAgainstRig(libraryValue, rigValue);
  const library = parseDomainValue(
    PoseLibrarySchema,
    structuredClone(libraryValue),
    ['poseLibrary'],
  );
  const rig = parseDomainValue(
    RigidRigProfileV2Schema,
    structuredClone(rigValue),
    ['rig'],
  );
  const sourcePoseIndex = library.poses.findIndex(
    ({ semanticId }) => semanticId === sourceSemanticId,
  );
  const pose = library.poses[sourcePoseIndex];
  if (pose === undefined)
    throw new ForgeDomainError(
      'COMPATIBILITY_MISMATCH',
      ['poseLibrary', 'poses', sourceSemanticId],
      `Source pose ${sourceSemanticId} does not exist in the identified library.`,
    );
  if (
    mirrorSemanticId === sourceSemanticId ||
    library.poses.some(({ semanticId }) => semanticId === mirrorSemanticId)
  )
    throw new ForgeDomainError(
      'COMPATIBILITY_MISMATCH',
      ['poseLibrary', 'poses', mirrorSemanticId],
      `Mirror pose identity ${mirrorSemanticId} must be distinct and unused.`,
    );
  const poseWithoutAsymmetry = { ...pose };
  delete poseWithoutAsymmetry.asymmetryReason;
  delete poseWithoutAsymmetry.asymmetryReferenceIds;
  const joints = new Map(rig.joints.map((joint) => [joint.id, joint]));
  const mirroredParts = new Map<string, string>();
  for (const part of rig.assemblyHierarchy)
    if (part.mirrorPolicy === 'center')
      mirroredParts.set(part.partId, part.partId);
    else if (part.mirrorPolicy === 'paired')
      mirroredParts.set(part.partId, part.mirrorPartId);
  const channels = pose.channels.map((channel, channelIndex) => {
    const joint = joints.get(channel.jointId);
    const dof = joint?.dofs.find((candidate) => candidate.id === channel.dofId);
    if (
      joint?.mirrorPolicy !== 'paired' ||
      dof?.mirrorDofId === undefined ||
      dof.mirrorSign === undefined
    )
      throw new ForgeDomainError(
        'MIRROR_UNAVAILABLE',
        [
          'poseLibrary',
          'poses',
          sourcePoseIndex,
          'channels',
          channelIndex,
          'jointId',
        ],
        `MIRROR_UNAVAILABLE:${channel.jointId}/${channel.dofId}`,
      );
    return {
      jointId: joint.mirrorJointId,
      dofId: dof.mirrorDofId,
      valueDegrees: channel.valueDegrees * dof.mirrorSign,
    };
  });
  channels.sort(
    (left, right) =>
      left.jointId.localeCompare(right.jointId) ||
      left.dofId.localeCompare(right.dofId),
  );
  const source = parseDomainValue(
    ReusablePoseSchema,
    {
      ...poseWithoutAsymmetry,
      mirrorPolicy: 'symmetric',
      mirrorPoseId: mirrorSemanticId,
      mirrorPlane: 'YZ',
    },
    ['pair', 'source'],
  );
  const mirror = parseDomainValue(
    ReusablePoseSchema,
    {
      ...poseWithoutAsymmetry,
      semanticId: mirrorSemanticId,
      channels,
      contacts: pose.contacts.map((contact, contactIndex) => ({
        ...contact,
        partId: requireMirroredPart(mirroredParts, contact.partId, [
          'poseLibrary',
          'poses',
          sourcePoseIndex,
          'contacts',
          contactIndex,
          'partId',
        ]),
        ...(contact.normal === undefined
          ? {}
          : {
              normal: [
                -contact.normal[0],
                contact.normal[1],
                contact.normal[2],
              ],
            }),
      })),
      root: mirrorRoot(pose.root),
      equipmentSlots: pose.equipmentSlots.map((slot, slotIndex) => ({
        ...slot,
        partId: requireMirroredPart(mirroredParts, slot.partId, [
          'poseLibrary',
          'poses',
          sourcePoseIndex,
          'equipmentSlots',
          slotIndex,
          'partId',
        ]),
      })),
      mirrorPolicy: 'symmetric',
      mirrorPoseId: sourceSemanticId,
      mirrorPlane: 'YZ',
    },
    ['pair', 'mirror'],
  );
  const { libraryId: _libraryId, ...payload } = library;
  void _libraryId;
  const candidate = await createPoseLibrary({
    ...payload,
    poses: [
      ...library.poses.filter(
        ({ semanticId }) => semanticId !== sourceSemanticId,
      ),
      source,
      mirror,
    ],
  });
  await validatePoseLibraryAgainstRig(candidate, rig);
  return {
    source: structuredClone(
      candidate.poses.find(
        ({ semanticId }) => semanticId === sourceSemanticId,
      )!,
    ),
    mirror: structuredClone(
      candidate.poses.find(
        ({ semanticId }) => semanticId === mirrorSemanticId,
      )!,
    ),
  };
}

function requireMirroredPart(
  mirroredParts: ReadonlyMap<string, string>,
  partId: string,
  path: readonly (string | number)[],
): string {
  const mirroredPartId = mirroredParts.get(partId);
  if (mirroredPartId === undefined)
    throw new ForgeDomainError(
      'MIRROR_UNAVAILABLE',
      path,
      `PART_MIRROR_UNAVAILABLE:${partId}`,
    );
  return mirroredPartId;
}

function hierarchyOrderedJoints(rig: RigidRigProfileV2) {
  const result: RigidRigProfileV2['joints'][number][] = [];
  const children = new Map<string, RigidRigProfileV2['joints'][number][]>();
  for (const joint of rig.joints) {
    const key = joint.parentJointId ?? '';
    const entries = children.get(key) ?? [];
    entries.push(joint);
    children.set(key, entries);
  }
  const visit = (joint: RigidRigProfileV2['joints'][number]) => {
    result.push(joint);
    for (const child of [...(children.get(joint.id) ?? [])].sort(
      (left, right) => left.id.localeCompare(right.id),
    ))
      visit(child);
  };
  visit(rig.joints.find((joint) => joint.id === rig.rootJointId)!);
  return result;
}

function mirrorRoot(root: ReusablePose['root']): ReusablePose['root'] {
  switch (root.policy) {
    case 'locked':
      return root;
    case 'in_place':
      return { ...root, yawDegrees: -root.yawDegrees };
    case 'authored_translation':
      return {
        ...root,
        translation: [
          -root.translation[0],
          root.translation[1],
          root.translation[2],
        ],
      };
    case 'authored_translation_and_yaw':
      return {
        ...root,
        translation: [
          -root.translation[0],
          root.translation[1],
          root.translation[2],
        ],
        yawDegrees: -root.yawDegrees,
      };
  }
}
