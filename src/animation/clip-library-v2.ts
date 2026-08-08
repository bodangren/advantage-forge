import { z } from 'zod';

import {
  composeTransforms,
  multiplyQuaternions,
  quaternionFromAxisAngle,
  rotateVector,
} from '../assembly/index.js';
import {
  CLIP_LIBRARY_V2_BUDGETS as CLIP_LIBRARY_BUDGETS,
  ClipLibraryV2Schema as ClipLibrarySchema,
  ForgeDomainError,
  PoseLibrarySchema,
  RigidRigProfileV2Schema,
  validatePoseLibraryAgainstRig,
  verifyClipLibraryV2Identity as verifyClipLibraryIdentity,
  verifyPoseLibraryIdentity,
  verifyRigidRigProfileV2Identity,
  type ClipDefinitionV2 as ClipDefinition,
  type ClipLibraryV2 as ClipLibrary,
  type PoseLibrary,
  type RigidRigProfileV2,
} from '../contracts/index.js';

type Vec3 = [number, number, number];
type Quaternion = [number, number, number, number];
type Transform = {
  position: Vec3;
  rotation: Quaternion;
  scale: Vec3;
};
type ReusablePose = PoseLibrary['poses'][number];

const BatchRequestSchema = z.strictObject({
  clipId: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/),
  sampleTimesMs: z
    .array(z.number().int().min(0).max(CLIP_LIBRARY_BUDGETS.maximumDurationMs))
    .min(1)
    .max(CLIP_LIBRARY_BUDGETS.maximumSamplesPerClip)
    .refine((times) => new Set(times).size === times.length, {
      message: 'Sample times must be unique within a clip request.',
    }),
});

export interface ClipBatchRequest {
  readonly clipId: string;
  readonly sampleTimesMs: readonly number[];
}

export interface EvaluatedClipSample {
  readonly clipId: string;
  readonly sampleTimeMs: number;
  readonly activePoseId: string;
  readonly followingPoseId: string;
  readonly interpolationProgress: number;
  readonly dofs: readonly {
    readonly jointId: string;
    readonly dofId: string;
    readonly valueDegrees: number;
    readonly source: 'authored' | 'rest' | 'interpolated';
  }[];
  readonly root: ReusablePose['root'];
  readonly contacts: ReusablePose['contacts'];
  readonly equipmentSlots: ReusablePose['equipmentSlots'];
  readonly parts: readonly {
    readonly partId: string;
    readonly controllingJointId: string;
    readonly transform: Transform;
  }[];
}

export interface ClipBatchResult {
  readonly successes: readonly {
    readonly clipId: string;
    readonly resultId: string;
    readonly samples: readonly EvaluatedClipSample[];
  }[];
  readonly failures: readonly {
    readonly clipId?: string;
    readonly code: string;
    readonly path: readonly (string | number)[];
    readonly message: string;
  }[];
}

function fail(
  code: string,
  path: readonly (string | number)[],
  message: string,
): never {
  throw new ForgeDomainError(code, path, message);
}

function sameBinding(
  clips: ClipLibrary,
  rig: RigidRigProfileV2,
  poses: PoseLibrary,
): boolean {
  return (
    clips.binding.assetRevisionId === rig.assetRevisionId &&
    clips.binding.morphologyRevisionId === rig.morphologyRevisionId &&
    clips.binding.rigProfileId === rig.profileId &&
    clips.binding.poseLibraryId === poses.libraryId &&
    clips.binding.equipmentSignature === rig.equipmentSignature &&
    poses.binding.assetRevisionId === rig.assetRevisionId &&
    poses.binding.morphologyRevisionId === rig.morphologyRevisionId &&
    poses.binding.rigProfileId === rig.profileId &&
    poses.binding.equipmentSignature === rig.equipmentSignature
  );
}

function canonicalValue(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalValue(entry)).join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalValue(entry)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

function poseChannels(
  rig: RigidRigProfileV2,
  pose: ReusablePose,
): Map<string, number> {
  const authored = new Map(
    pose.channels.map((channel) => [
      `${channel.jointId}/${channel.dofId}`,
      channel.valueDegrees,
    ]),
  );
  const result = new Map<string, number>();
  for (const joint of rig.joints)
    for (const dof of joint.dofs)
      result.set(
        `${joint.id}/${dof.id}`,
        authored.get(`${joint.id}/${dof.id}`) ?? dof.restDegrees,
      );
  return result;
}

function validateContinuityHooks(
  clip: ClipDefinition,
  clipIndex: number,
  posesById: ReadonlyMap<string, ReusablePose>,
): void {
  for (const [hookIndex, hook] of clip.continuityHooks.entries()) {
    if (hook.kind === 'mirror') {
      const pose = posesById.get(hook.poseId);
      const mirror = posesById.get(hook.mirrorPoseId);
      if (
        pose?.mirrorPolicy !== 'symmetric' ||
        pose.mirrorPoseId !== hook.mirrorPoseId ||
        mirror?.mirrorPoseId !== hook.poseId
      )
        fail(
          'MIRROR_CONTINUITY_MISMATCH',
          [
            'clipLibrary',
            'clips',
            clipIndex,
            'continuityHooks',
            hookIndex,
            'poseId',
          ],
          'Mirror continuity hooks require an identified reciprocal pose pair.',
        );
      continue;
    }
    const keyframeIndex = clip.keyframes.findIndex(
      ({ timeMs }) => timeMs === hook.atTimeMs,
    );
    const precedingPose = posesById.get(
      clip.keyframes[keyframeIndex - 1]!.poseId,
    )!;
    const activePose = posesById.get(clip.keyframes[keyframeIndex]!.poseId)!;
    if (hook.kind === 'contact') {
      const preceding = precedingPose.contacts.find(
        ({ id }) => id === hook.contactId,
      );
      const active = activePose.contacts.find(
        ({ id }) => id === hook.contactId,
      );
      if (
        preceding === undefined ||
        active === undefined ||
        canonicalValue(preceding) !== canonicalValue(active)
      )
        fail(
          'CONTACT_CONTINUITY_MISMATCH',
          [
            'clipLibrary',
            'clips',
            clipIndex,
            'continuityHooks',
            hookIndex,
            'contactId',
          ],
          'Contact continuity hooks require byte-equivalent boundary contacts.',
        );
    } else {
      const preceding = precedingPose.equipmentSlots.find(
        ({ slotId }) => slotId === hook.slotId,
      );
      const active = activePose.equipmentSlots.find(
        ({ slotId }) => slotId === hook.slotId,
      );
      if (
        preceding === undefined ||
        active === undefined ||
        canonicalValue(preceding) !== canonicalValue(active)
      )
        fail(
          'EQUIPMENT_CONTINUITY_MISMATCH',
          [
            'clipLibrary',
            'clips',
            clipIndex,
            'continuityHooks',
            hookIndex,
            'slotId',
          ],
          'Equipment continuity hooks require byte-equivalent boundary slots.',
        );
    }
  }
}

function validateContinuousSeam(
  clip: ClipDefinition,
  clipIndex: number,
  rig: RigidRigProfileV2,
  posesById: ReadonlyMap<string, ReusablePose>,
): void {
  if (clip.loop?.seamPolicy !== 'continuous') return;
  const start = posesById.get(
    clip.keyframes.find(({ timeMs }) => timeMs === clip.loop?.startTimeMs)!
      .poseId,
  )!;
  const end = posesById.get(
    clip.keyframes.find(({ timeMs }) => timeMs === clip.loop?.endTimeMs)!
      .poseId,
  )!;
  if (
    canonicalValue([...poseChannels(rig, start)].sort()) !==
      canonicalValue([...poseChannels(rig, end)].sort()) ||
    canonicalValue(start.root) !== canonicalValue(end.root) ||
    canonicalValue(start.contacts) !== canonicalValue(end.contacts) ||
    canonicalValue(start.equipmentSlots) !== canonicalValue(end.equipmentSlots)
  )
    fail(
      'LOOP_SEAM_MISMATCH',
      ['clipLibrary', 'clips', clipIndex, 'loop', 'seamPolicy'],
      'Continuous half-open loops require equivalent authored seam samples.',
    );
}

export async function validateClipLibraryAgainstSources(
  clipsValue: ClipLibrary,
  rigValue: RigidRigProfileV2,
  posesValue: PoseLibrary,
): Promise<void> {
  if (!(await verifyRigidRigProfileV2Identity(rigValue)))
    fail(
      'RIG_IDENTITY_MISMATCH',
      ['rig', 'profileId'],
      'Rig content does not match its immutable identity.',
    );
  if (!(await verifyPoseLibraryIdentity(posesValue)))
    fail(
      'POSE_LIBRARY_IDENTITY_MISMATCH',
      ['poseLibrary', 'libraryId'],
      'Pose-library content does not match its immutable identity.',
    );
  if (!(await verifyClipLibraryIdentity(clipsValue)))
    fail(
      'CLIP_LIBRARY_IDENTITY_MISMATCH',
      ['clipLibrary', 'libraryId'],
      'Clip-library content does not match its immutable identity.',
    );
  const rig = RigidRigProfileV2Schema.parse(structuredClone(rigValue));
  const poses = PoseLibrarySchema.parse(structuredClone(posesValue));
  const clips = ClipLibrarySchema.parse(structuredClone(clipsValue));
  await validatePoseLibraryAgainstRig(poses, rig);
  if (!sameBinding(clips, rig, poses))
    fail(
      'BINDING_MISMATCH',
      ['clipLibrary', 'binding'],
      'Clip library must bind the exact rig and pose-library identities.',
    );

  const posesById = new Map(poses.poses.map((pose) => [pose.semanticId, pose]));
  for (const [clipIndex, clip] of clips.clips.entries()) {
    for (const [keyframeIndex, keyframe] of clip.keyframes.entries()) {
      const pose = posesById.get(keyframe.poseId);
      if (pose === undefined)
        fail(
          'POSE_NOT_FOUND',
          [
            'clipLibrary',
            'clips',
            clipIndex,
            'keyframes',
            keyframeIndex,
            'poseId',
          ],
          `Reusable pose ${keyframe.poseId} does not exist.`,
        );
      if (pose.root.policy !== clip.rootAnchorPolicy)
        fail(
          'ROOT_ANCHOR_MISMATCH',
          [
            'clipLibrary',
            'clips',
            clipIndex,
            'keyframes',
            keyframeIndex,
            'poseId',
          ],
          'Every referenced pose must use the clip root-anchor policy.',
        );
    }
    validateContinuityHooks(clip, clipIndex, posesById);
    validateContinuousSeam(clip, clipIndex, rig, posesById);
  }
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
  visit(rig.joints.find(({ id }) => id === rig.rootJointId)!);
  return result;
}

function interpolate(left: number, right: number, progress: number): number {
  return left + (right - left) * progress;
}

function interpolateRoot(
  left: ReusablePose['root'],
  right: ReusablePose['root'],
  progress: number,
): ReusablePose['root'] {
  if (left.policy !== right.policy)
    fail(
      'ROOT_ANCHOR_MISMATCH',
      ['clipLibrary', 'rootAnchorPolicy'],
      'Root policies cannot change inside an evaluated interval.',
    );
  switch (left.policy) {
    case 'locked':
      return { policy: 'locked' };
    case 'in_place':
      return {
        policy: 'in_place',
        yawDegrees: interpolate(
          left.yawDegrees,
          (right as typeof left).yawDegrees,
          progress,
        ),
      };
    case 'authored_translation': {
      const target = right as typeof left;
      return {
        policy: 'authored_translation',
        translation: left.translation.map((value, index) =>
          interpolate(value, target.translation[index]!, progress),
        ) as Vec3,
      };
    }
    case 'authored_translation_and_yaw': {
      const target = right as typeof left;
      return {
        policy: 'authored_translation_and_yaw',
        translation: left.translation.map((value, index) =>
          interpolate(value, target.translation[index]!, progress),
        ) as Vec3,
        yawDegrees: interpolate(left.yawDegrees, target.yawDegrees, progress),
      };
    }
  }
}

function rootTransform(root: ReusablePose['root']): Transform {
  const translation: Vec3 =
    root.policy === 'authored_translation' ||
    root.policy === 'authored_translation_and_yaw'
      ? [...root.translation]
      : [0, 0, 0];
  const yaw =
    root.policy === 'in_place' || root.policy === 'authored_translation_and_yaw'
      ? root.yawDegrees
      : 0;
  return {
    position: translation,
    rotation: quaternionFromAxisAngle([0, 1, 0], yaw),
    scale: [1, 1, 1],
  };
}

function conjugate(value: Quaternion): Quaternion {
  return [-value[0], -value[1], -value[2], value[3]];
}

function jointPivotTransform(
  joint: RigidRigProfileV2['joints'][number],
  values: ReadonlyMap<string, number>,
): Transform {
  let authored: Quaternion = [0, 0, 0, 1];
  for (const dof of [...joint.dofs].sort(
    (left, right) => left.order - right.order,
  )) {
    const axis: Vec3 =
      dof.axis === 'x' ? [1, 0, 0] : dof.axis === 'y' ? [0, 1, 0] : [0, 0, 1];
    authored = multiplyQuaternions(
      authored,
      quaternionFromAxisAngle(axis, values.get(`${joint.id}/${dof.id}`)!),
    );
  }
  const oriented = multiplyQuaternions(
    multiplyQuaternions(joint.pivot.rotation, authored),
    conjugate(joint.pivot.rotation),
  );
  const rotatedPivot = rotateVector(oriented, joint.pivot.position);
  return {
    position: [
      joint.pivot.position[0] - rotatedPivot[0],
      joint.pivot.position[1] - rotatedPivot[1],
      joint.pivot.position[2] - rotatedPivot[2],
    ],
    rotation: oriented,
    scale: [1, 1, 1],
  };
}

function evaluateValidated(
  clips: ClipLibrary,
  rig: RigidRigProfileV2,
  poses: PoseLibrary,
  clipId: string,
  sampleTimeMs: number,
): EvaluatedClipSample {
  const clipIndex = clips.clips.findIndex(
    ({ semanticId }) => semanticId === clipId,
  );
  const clip = clips.clips[clipIndex];
  if (clip === undefined)
    fail(
      'CLIP_NOT_FOUND',
      ['clipLibrary', 'clips', clipId],
      `Clip ${clipId} does not exist.`,
    );
  if (
    !Number.isInteger(sampleTimeMs) ||
    sampleTimeMs < 0 ||
    sampleTimeMs > clip.durationMs
  )
    fail(
      'SAMPLE_TIME_OUT_OF_RANGE',
      ['sampleTimeMs'],
      'Sample time must be an integer inside the authored clip duration.',
    );

  const posesById = new Map(poses.poses.map((pose) => [pose.semanticId, pose]));
  let leftIndex = 0;
  for (let index = 1; index < clip.keyframes.length; index += 1) {
    if (clip.keyframes[index]!.timeMs > sampleTimeMs) break;
    leftIndex = index;
  }
  const rightIndex = Math.min(leftIndex + 1, clip.keyframes.length - 1);
  const leftFrame = clip.keyframes[leftIndex]!;
  const rightFrame = clip.keyframes[rightIndex]!;
  const leftPose = posesById.get(leftFrame.poseId)!;
  const rightPose = posesById.get(rightFrame.poseId)!;
  const interval = rightFrame.timeMs - leftFrame.timeMs;
  const progress =
    clip.interpolation === 'step' || interval === 0
      ? 0
      : (sampleTimeMs - leftFrame.timeMs) / interval;
  const leftChannels = poseChannels(rig, leftPose);
  const rightChannels = poseChannels(rig, rightPose);
  const leftAuthored = new Set(
    leftPose.channels.map(({ jointId, dofId }) => `${jointId}/${dofId}`),
  );
  const rightAuthored = new Set(
    rightPose.channels.map(({ jointId, dofId }) => `${jointId}/${dofId}`),
  );
  const dofs = hierarchyOrderedJoints(rig).flatMap((joint) =>
    [...joint.dofs]
      .sort((left, right) => left.order - right.order)
      .map((dof) => {
        const key = `${joint.id}/${dof.id}`;
        const leftValue = leftChannels.get(key)!;
        const rightValue = rightChannels.get(key)!;
        const valueDegrees = interpolate(leftValue, rightValue, progress);
        const source =
          !leftAuthored.has(key) && !rightAuthored.has(key)
            ? ('rest' as const)
            : leftFrame.poseId === rightFrame.poseId ||
                clip.interpolation === 'step'
              ? ('authored' as const)
              : ('interpolated' as const);
        return { jointId: joint.id, dofId: dof.id, valueDegrees, source };
      }),
  );
  const values = new Map(
    dofs.map(({ jointId, dofId, valueDegrees }) => [
      `${jointId}/${dofId}`,
      valueDegrees,
    ]),
  );
  const root =
    clip.interpolation === 'step'
      ? structuredClone(leftPose.root)
      : interpolateRoot(leftPose.root, rightPose.root, progress);
  const worldByJoint = new Map<string, Transform>();
  for (const joint of hierarchyOrderedJoints(rig)) {
    const parent =
      joint.parentJointId === undefined
        ? rootTransform(root)
        : worldByJoint.get(joint.parentJointId)!;
    worldByJoint.set(
      joint.id,
      composeTransforms(parent, jointPivotTransform(joint, values)),
    );
  }
  const jointByPart = new Map(
    rig.joints.map((joint) => [joint.partId, joint.id]),
  );
  const partsById = new Map(
    rig.assemblyHierarchy.map((part) => [part.partId, part]),
  );
  const controllingJoint = (partId: string): string => {
    const direct = jointByPart.get(partId);
    if (direct !== undefined) return direct;
    const parent = partsById.get(partId)?.parentPartId;
    if (parent === undefined)
      fail(
        'ASSEMBLY_BINDING_MISMATCH',
        ['rig', 'assemblyHierarchy', partId],
        'Every assembly part must resolve to a controlling joint ancestor.',
      );
    return controllingJoint(parent);
  };
  const parts = rig.assemblyHierarchy
    .map(({ partId }) => {
      const controllingJointId = controllingJoint(partId);
      return {
        partId,
        controllingJointId,
        transform: structuredClone(worldByJoint.get(controllingJointId)!),
      };
    })
    .sort((left, right) => left.partId.localeCompare(right.partId));

  return {
    clipId,
    sampleTimeMs,
    activePoseId: leftPose.semanticId,
    followingPoseId: rightPose.semanticId,
    interpolationProgress: progress,
    dofs,
    root,
    contacts: structuredClone(leftPose.contacts),
    equipmentSlots: structuredClone(leftPose.equipmentSlots),
    parts,
  };
}

export async function evaluateClipSample(
  clips: ClipLibrary,
  rig: RigidRigProfileV2,
  poses: PoseLibrary,
  clipId: string,
  sampleTimeMs: number,
): Promise<EvaluatedClipSample> {
  await validateClipLibraryAgainstSources(clips, rig, poses);
  return evaluateValidated(clips, rig, poses, clipId, sampleTimeMs);
}

export function planClipSampleTimes(
  clip: ClipDefinition,
  framesPerSecond: number,
): number[] {
  if (
    !Number.isInteger(framesPerSecond) ||
    framesPerSecond < 1 ||
    framesPerSecond > 60
  )
    fail(
      'SCHEMA_INVALID',
      ['framesPerSecond'],
      'Frames per second must be an integer from 1 through 60.',
    );
  const intervals = Math.max(
    1,
    Math.ceil((clip.durationMs * framesPerSecond) / 1_000),
  );
  if (intervals + 1 > CLIP_LIBRARY_BUDGETS.maximumSamplesPerClip)
    fail(
      'BUDGET_EXCEEDED',
      ['sampleTimesMs'],
      'Planned clip samples exceed the supported per-clip budget.',
    );
  return Array.from({ length: intervals + 1 }, (_, index) =>
    Math.floor((index * clip.durationMs) / intervals),
  ).filter((time, index, times) => index === 0 || time !== times[index - 1]);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function evaluateClipBatch(
  clips: ClipLibrary,
  rig: RigidRigProfileV2,
  poses: PoseLibrary,
  requestValues: readonly ClipBatchRequest[],
): Promise<ClipBatchResult> {
  await validateClipLibraryAgainstSources(clips, rig, poses);
  if (
    requestValues.length < 1 ||
    requestValues.length > CLIP_LIBRARY_BUDGETS.maximumBatchRequests
  )
    fail(
      'BUDGET_EXCEEDED',
      ['requests'],
      'Clip batch request count exceeds the supported budget.',
    );
  const successes: ClipBatchResult['successes'][number][] = [];
  const failures: ClipBatchResult['failures'][number][] = [];
  for (const [requestIndex, requestValue] of requestValues.entries()) {
    const parsed = BatchRequestSchema.safeParse(requestValue);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const clipId =
        typeof requestValue === 'object' &&
        requestValue !== null &&
        'clipId' in requestValue &&
        typeof requestValue.clipId === 'string'
          ? requestValue.clipId
          : undefined;
      failures.push({
        ...(clipId === undefined ? {} : { clipId }),
        code: issue?.code === 'too_big' ? 'BUDGET_EXCEEDED' : 'SCHEMA_INVALID',
        path: [
          'requests',
          requestIndex,
          ...(issue?.path ?? []).map((segment) =>
            typeof segment === 'symbol'
              ? (segment.description ?? String(segment))
              : segment,
          ),
        ],
        message: issue?.message ?? 'Invalid clip batch request.',
      });
      continue;
    }
    if (
      !clips.clips.some(({ semanticId }) => semanticId === parsed.data.clipId)
    ) {
      failures.push({
        clipId: parsed.data.clipId,
        code: 'CLIP_NOT_FOUND',
        path: ['requests', requestIndex, 'clipId'],
        message: `Clip ${parsed.data.clipId} does not exist.`,
      });
      continue;
    }
    try {
      const times = [...parsed.data.sampleTimesMs].sort(
        (left, right) => left - right,
      );
      const samples = times.map((time) =>
        evaluateValidated(clips, rig, poses, parsed.data.clipId, time),
      );
      successes.push({
        clipId: parsed.data.clipId,
        resultId: `clip-result.${await sha256(
          canonicalValue({
            clipLibraryId: clips.libraryId,
            clipId: parsed.data.clipId,
            sampleTimesMs: times,
            samples,
          }),
        )}`,
        samples,
      });
    } catch (error) {
      if (error instanceof ForgeDomainError)
        failures.push({
          clipId: parsed.data.clipId,
          code: String(error.code),
          path: ['requests', requestIndex, ...error.path],
          message: error.message,
        });
      else throw error;
    }
  }
  return { successes, failures };
}
