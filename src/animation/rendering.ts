import {
  AssetDocumentSchema,
  RigidAnimationBundleSchema,
  type AssetDocument,
  type RigidAnimationBundle,
} from '../contracts/index.js';
import { sampleRigidClip, type SampledRigidPose } from './rigid-animation.js';

const SAMPLE_POSE_ID = 'animation.sample';

function yawQuaternion(degrees: number): [number, number, number, number] {
  const radians = (degrees * Math.PI) / 180;
  return [0, Math.sin(radians / 2), 0, Math.cos(radians / 2)];
}

/**
 * Produces an ephemeral render document for one exact temporal sample. The
 * immutable source revision is never mutated or saved as a new asset revision.
 */
export function applyRigidSampleToRenderDocument(
  documentInput: Readonly<AssetDocument>,
  bundleInput: RigidAnimationBundle,
  sample: SampledRigidPose,
): AssetDocument {
  const document = AssetDocumentSchema.parse(documentInput);
  const bundle = RigidAnimationBundleSchema.parse(bundleInput);
  const jointById = new Map(
    bundle.rig.joints.map((joint) => [joint.id, joint]),
  );
  const rootJoint = jointById.get(bundle.rig.rootJointId);
  if (rootJoint === undefined)
    throw new Error('Animation rig has no root joint.');
  const overrides = sample.channels.map((channel) => {
    const joint = jointById.get(channel.jointId);
    if (joint === undefined)
      throw new Error(
        `Sampled animation channel ${channel.jointId} is not in the rig.`,
      );
    return {
      partId: joint.partId,
      jointValueDegrees: channel.valueDegrees,
      ...(joint.id !== bundle.rig.rootJointId
        ? {}
        : {
            transform: {
              position: [...sample.rootMotion.offset] as [
                number,
                number,
                number,
              ],
              rotation: yawQuaternion(sample.rootMotion.yawDegrees),
              scale: [1, 1, 1] as [number, number, number],
            },
          }),
    };
  });
  const profile = document.renderProfiles[0];
  if (profile === undefined)
    throw new Error('Temporal rendering requires a declared render profile.');
  return AssetDocumentSchema.parse({
    ...document,
    poses: [
      ...document.poses.filter(({ id }) => id !== SAMPLE_POSE_ID),
      { id: SAMPLE_POSE_ID, overrides },
    ],
    activePoseId: SAMPLE_POSE_ID,
    renderProfiles: [
      {
        ...profile,
        widthPixels: 128,
        heightPixels: 128,
        directions: 8,
        transparent: true,
      },
    ],
  });
}

export function temporalRenderDocuments(
  document: Readonly<AssetDocument>,
  bundleInput: RigidAnimationBundle,
): readonly {
  readonly frameId: string;
  readonly clipId: string;
  readonly action: string;
  readonly framePlanId: string;
  readonly direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  readonly sampleTimeMs: number;
  readonly document: AssetDocument;
}[] {
  const bundle = RigidAnimationBundleSchema.parse(bundleInput);
  const actionOrder = new Map([
    ['idle', 0],
    ['walk_forward', 1],
    ['walk_right', 2],
    ['attack', 3],
    ['receive_damage', 4],
  ]);
  const directionOrder = new Map(
    ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((direction, index) => [
      direction,
      index,
    ]),
  );
  const clipById = new Map(bundle.clips.map((clip) => [clip.clipId, clip]));
  const pairs = bundle.framePlans
    .map((plan) => {
      const clip = clipById.get(plan.clipId);
      if (clip === undefined)
        throw new Error(
          `Temporal frame plan ${plan.framePlanId} has no matching clip.`,
        );
      return { clip, plan };
    })
    .sort(
      (left, right) =>
        (actionOrder.get(left.clip.action) ?? Number.MAX_SAFE_INTEGER) -
          (actionOrder.get(right.clip.action) ?? Number.MAX_SAFE_INTEGER) ||
        left.clip.action.localeCompare(right.clip.action) ||
        left.clip.clipId.localeCompare(right.clip.clipId) ||
        left.plan.framePlanId.localeCompare(right.plan.framePlanId),
    );
  return pairs.flatMap(({ clip, plan }) =>
    [...plan.frames]
      .sort(
        (left, right) =>
          (directionOrder.get(left.key.direction) ?? Number.MAX_SAFE_INTEGER) -
            (directionOrder.get(right.key.direction) ??
              Number.MAX_SAFE_INTEGER) ||
          left.key.sampleTimeMs - right.key.sampleTimeMs ||
          left.id.localeCompare(right.id),
      )
      .map((frame) => {
        const sample = sampleRigidClip(
          bundle.rig,
          bundle.poses,
          clip,
          frame.key.sampleTimeMs,
        );
        return {
          frameId: frame.id,
          clipId: clip.clipId,
          action: clip.action,
          framePlanId: plan.framePlanId,
          direction: frame.key.direction,
          sampleTimeMs: frame.key.sampleTimeMs,
          document: applyRigidSampleToRenderDocument(document, bundle, sample),
        };
      }),
  );
}

export interface TemporalAtlasLayout {
  readonly width: number;
  readonly height: number;
  readonly columns: number;
  readonly rows: number;
  readonly rects: readonly {
    readonly frameId: string;
    readonly x: number;
    readonly y: number;
    readonly width: 128;
    readonly height: 128;
  }[];
}

const TEMPORAL_DIRECTION_ORDER = [
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
] as const;

/** Lays out one clip as direction rows and ascending temporal columns. */
export function temporalPoseSheetLayout(
  frames: readonly {
    readonly frameId: string;
    readonly direction: (typeof TEMPORAL_DIRECTION_ORDER)[number];
    readonly sampleTimeMs: number;
  }[],
): TemporalAtlasLayout {
  if (frames.length < 2 || frames.length > 2_048)
    throw new RangeError(
      'A temporal pose sheet requires 2..2048 source frames.',
    );
  if (new Set(frames.map(({ frameId }) => frameId)).size !== frames.length)
    throw new Error('Temporal pose-sheet frame IDs must be unique.');
  const directions = TEMPORAL_DIRECTION_ORDER.filter((direction) =>
    frames.some((frame) => frame.direction === direction),
  );
  const grouped = directions.map((direction) =>
    frames
      .filter((frame) => frame.direction === direction)
      .sort(
        (left, right) =>
          left.sampleTimeMs - right.sampleTimeMs ||
          left.frameId.localeCompare(right.frameId),
      ),
  );
  const columns = grouped[0]?.length ?? 0;
  if (
    columns < 2 ||
    grouped.some(
      (group) =>
        group.length !== columns ||
        new Set(group.map(({ sampleTimeMs }) => sampleTimeMs)).size !== columns,
    )
  )
    throw new Error(
      'Every pose-sheet direction requires the same distinct sample-time columns.',
    );
  const ordered = grouped.flat();
  return {
    width: columns * 128,
    height: directions.length * 128,
    columns,
    rows: directions.length,
    rects: ordered.map(({ frameId }, index) => ({
      frameId,
      x: (index % columns) * 128,
      y: Math.floor(index / columns) * 128,
      width: 128,
      height: 128,
    })),
  };
}

export function temporalAtlasLayout(
  frameIds: readonly string[],
): TemporalAtlasLayout {
  if (frameIds.length < 2 || frameIds.length > 2_048)
    throw new RangeError('A temporal atlas requires 2..2048 source frames.');
  if (new Set(frameIds).size !== frameIds.length)
    throw new Error('Temporal atlas frame IDs must be unique.');
  const columns = Math.min(128, frameIds.length);
  const rows = Math.ceil(frameIds.length / columns);
  return {
    width: columns * 128,
    height: rows * 128,
    columns,
    rows,
    rects: frameIds.map((frameId, index) => ({
      frameId,
      x: (index % columns) * 128,
      y: Math.floor(index / columns) * 128,
      width: 128,
      height: 128,
    })),
  };
}
