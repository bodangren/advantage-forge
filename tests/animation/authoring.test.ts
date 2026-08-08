import { describe, expect, it } from 'vitest';

import {
  compileReferenceFiveClipBatchAuthoringRequest,
  compileRigidAnimationAuthoringRequest,
  ReferenceFiveClipBatchAuthoringRequestSchema,
  type ReferenceFiveClipBatchAuthoringRequest,
} from '../../src/animation/authoring.js';
import { REFERENCE_FULL_BODY_FIVE_CLIP_ANIMATION_REQUEST } from '../../src/animation/reference-five-clip.js';
import { sampleRigidClip } from '../../src/animation/rigid-animation.js';
import {
  temporalAtlasLayout,
  temporalPoseSheetLayout,
  temporalRenderDocuments,
} from '../../src/animation/rendering.js';
import { contentRevisionId } from '../../src/document/index.js';
import { referenceDocuments } from '../../src/fantasy-kit/index.js';

const document = referenceDocuments.adventurer;
const revisionId = contentRevisionId(document);
const request = {
  rig: {
    id: 'rig.adventurer',
    rootJointId: 'root',
    joints: [
      {
        id: 'root',
        partId: 'torso',
        axis: 'y' as const,
        minimumDegrees: 0,
        maximumDegrees: 0,
        restDegrees: 0,
      },
      {
        id: 'shoulder.left',
        parentJointId: 'root',
        partId: 'upper-arm.left',
        axis: 'z' as const,
        minimumDegrees: -80,
        maximumDegrees: 80,
        restDegrees: 0,
        mirrorJointId: 'shoulder.right',
      },
      {
        id: 'shoulder.right',
        parentJointId: 'root',
        partId: 'upper-arm.right',
        axis: 'z' as const,
        minimumDegrees: -80,
        maximumDegrees: 80,
        restDegrees: 0,
        mirrorJointId: 'shoulder.left',
      },
    ],
  },
  poses: [
    {
      id: 'walk.left',
      channels: [
        { jointId: 'shoulder.left', valueDegrees: -20 },
        { jointId: 'shoulder.right', valueDegrees: 20 },
      ],
    },
    {
      id: 'walk.right',
      channels: [
        { jointId: 'shoulder.left', valueDegrees: 20 },
        { jointId: 'shoulder.right', valueDegrees: -20 },
      ],
    },
  ],
  clip: {
    action: 'walk',
    durationMs: 400,
    interpolation: 'linear' as const,
    rootAnchorPolicy: 'in_place' as const,
    loop: { mode: 'loop' as const, startMs: 0, endMs: 400 },
    keyframes: [
      { id: 'walk.start', timeMs: 0, poseId: 'walk.left' },
      { id: 'walk.end', timeMs: 400, poseId: 'walk.right' },
    ],
  },
  directions: ['S'] as 'S'[],
  framesPerSecond: 10,
  seed: 42,
};

function referenceBatch(): ReferenceFiveClipBatchAuthoringRequest {
  return structuredClone(REFERENCE_FULL_BODY_FIVE_CLIP_ANIMATION_REQUEST);
}

type MutableReferenceBatch = ReferenceFiveClipBatchAuthoringRequest;

function mutableReferenceBatch(): MutableReferenceBatch {
  return structuredClone(referenceBatch());
}

describe('public rigid-animation authoring compiler', () => {
  it('derives deterministic bindings, distinct temporal frames, and render documents', async () => {
    const first = await compileRigidAnimationAuthoringRequest(
      document,
      revisionId,
      request,
    );
    const second = await compileRigidAnimationAuthoringRequest(
      document,
      revisionId,
      request,
    );
    expect(first).toEqual(second);
    expect(first.rig.morphologyRevisionId).toMatch(
      /^morphology\.[a-f0-9]{64}$/,
    );
    expect(first.rig.equipmentSignature).toMatch(/^equipment\.[a-f0-9]{64}$/);
    expect(first.rig.rigSignature).toMatch(/^rig\.[a-f0-9]{64}$/);
    expect(first.framePlans[0]?.frames).toHaveLength(4);

    const renderDocuments = temporalRenderDocuments(document, first);
    expect(renderDocuments).toHaveLength(4);
    expect(renderDocuments[0]?.document.activePoseId).toBe('animation.sample');
    expect(renderDocuments[0]?.document.renderProfiles[0]).toMatchObject({
      widthPixels: 128,
      heightPixels: 128,
      directions: 8,
      transparent: true,
    });
    expect(renderDocuments[0]?.document.poses.at(-1)).not.toEqual(
      renderDocuments[2]?.document.poses.at(-1),
    );
    expect(
      temporalAtlasLayout(renderDocuments.map(({ frameId }) => frameId)),
    ).toMatchObject({
      width: 512,
      height: 128,
      columns: 4,
      rows: 1,
    });
  });

  it('rejects invented parts, hinge-axis drift, and unknown pose references', async () => {
    await expect(
      compileRigidAnimationAuthoringRequest(document, revisionId, {
        ...request,
        rig: {
          ...request.rig,
          joints: [
            request.rig.joints[0]!,
            { ...request.rig.joints[1]!, partId: 'missing.arm' },
          ],
        },
      }),
    ).rejects.toThrow(/missing part/i);
    await expect(
      compileRigidAnimationAuthoringRequest(document, revisionId, {
        ...request,
        rig: {
          ...request.rig,
          joints: [
            request.rig.joints[0]!,
            { ...request.rig.joints[1]!, axis: 'x' as const },
          ],
        },
      }),
    ).rejects.toThrow(/hinge axis/i);
    await expect(
      compileRigidAnimationAuthoringRequest(document, revisionId, {
        ...request,
        clip: {
          ...request.clip,
          keyframes: [
            request.clip.keyframes[0]!,
            { ...request.clip.keyframes[1]!, poseId: 'walk.missing' },
          ],
        },
      }),
    ).rejects.toThrow(/unknown pose/i);
  });

  it('compiles the exact five clips with one deterministic binding and expands every render document', async () => {
    const first = await compileReferenceFiveClipBatchAuthoringRequest(
      document,
      revisionId,
      referenceBatch(),
    );
    const second = await compileReferenceFiveClipBatchAuthoringRequest(
      document,
      revisionId,
      referenceBatch(),
    );
    expect(first).toEqual(second);
    expect(first.clips.map(({ action }) => action)).toEqual([
      'idle',
      'walk_forward',
      'walk_right',
      'attack',
      'receive_damage',
    ]);
    expect(first.clips[3]!.keyframes.map(({ phase }) => phase)).toEqual([
      'neutral',
      'anticipation',
      'windup',
      'contact',
      'follow_through',
      'recovery',
      'terminal_hold',
    ]);
    expect(
      first.framePlans.map(
        ({ frames }) => new Set(frames.map(({ key }) => key.sampleTimeMs)).size,
      ),
    ).toEqual([4, 6, 6, 6, 4]);
    expect(
      first.clips.every(
        (clip) =>
          clip.rigSignature === first.rig.rigSignature &&
          clip.equipmentSignature === first.rig.equipmentSignature,
      ),
    ).toBe(true);
    const rendered = temporalRenderDocuments(document, first);
    expect(rendered).toHaveLength(26);
    expect(rendered[0]).toMatchObject({
      action: 'idle',
      clipId: first.clips[0]!.clipId,
      framePlanId: first.framePlans[0]!.framePlanId,
      direction: 'S',
      sampleTimeMs: 0,
    });
    expect(rendered.at(-1)?.action).toBe('receive_damage');
  });

  it('authors alternating full-body forward and side gait mechanics', async () => {
    const bundle = await compileReferenceFiveClipBatchAuthoringRequest(
      document,
      revisionId,
      referenceBatch(),
    );
    expect(bundle.rig.joints.map(({ id, partId }) => [id, partId])).toEqual([
      ['root', 'torso'],
      ['shoulder.left', 'upper-arm.left'],
      ['shoulder.right', 'upper-arm.right'],
      ['elbow.left', 'forearm.left'],
      ['elbow.right', 'forearm.right'],
      ['hip.left', 'thigh.left'],
      ['hip.right', 'thigh.right'],
      ['knee.left', 'shin.left'],
      ['knee.right', 'shin.right'],
    ]);

    for (const action of ['walk_forward', 'walk_right']) {
      const clip = bundle.clips.find(
        (candidate) => candidate.action === action,
      )!;
      const contactLeft = sampleRigidClip(bundle.rig, bundle.poses, clip, 0);
      const passingLeft = sampleRigidClip(bundle.rig, bundle.poses, clip, 250);
      const contactRight = sampleRigidClip(bundle.rig, bundle.poses, clip, 375);
      const passingRight = sampleRigidClip(bundle.rig, bundle.poses, clip, 625);
      const value = (
        sample: ReturnType<typeof sampleRigidClip>,
        jointId: string,
      ) =>
        sample.channels.find((channel) => channel.jointId === jointId)!
          .valueDegrees;
      const leftStride =
        value(contactLeft, 'hip.left') - value(contactLeft, 'hip.right');
      const rightStride =
        value(contactRight, 'hip.left') - value(contactRight, 'hip.right');
      expect(Math.abs(leftStride)).toBeGreaterThanOrEqual(45);
      expect(Math.abs(rightStride)).toBeGreaterThanOrEqual(45);
      expect(Math.sign(leftStride)).toBe(-Math.sign(rightStride));
      expect(
        Math.max(
          Math.abs(value(passingLeft, 'knee.left')),
          Math.abs(value(passingLeft, 'knee.right')),
        ),
      ).toBeGreaterThanOrEqual(35);
      expect(
        Math.max(
          Math.abs(value(passingRight, 'knee.left')),
          Math.abs(value(passingRight, 'knee.right')),
        ),
      ).toBeGreaterThanOrEqual(35);
    }
  });

  it('keeps right-walk on one three-quarter facing with strong E-view limb separation', async () => {
    const bundle = await compileReferenceFiveClipBatchAuthoringRequest(
      document,
      revisionId,
      referenceBatch(),
    );
    const walkRight = bundle.clips.find(
      ({ action }) => action === 'walk_right',
    )!;
    const samples = [0, 125, 250, 375, 500, 625].map((time) =>
      sampleRigidClip(bundle.rig, bundle.poses, walkRight, time),
    );
    expect(
      new Set(samples.map(({ rootMotion }) => rootMotion.yawDegrees)),
    ).toEqual(new Set([10]));
    const value = (
      sample: ReturnType<typeof sampleRigidClip>,
      jointId: string,
    ) =>
      sample.channels.find((channel) => channel.jointId === jointId)!
        .valueDegrees;
    for (const sample of [samples[0]!, samples[3]!])
      expect(
        Math.abs(value(sample, 'hip.left') - value(sample, 'hip.right')),
      ).toBeGreaterThanOrEqual(75);
    for (const sample of [samples[2]!, samples[5]!])
      expect(
        Math.max(
          Math.abs(value(sample, 'knee.left')),
          Math.abs(value(sample, 'knee.right')),
        ),
      ).toBeGreaterThanOrEqual(55);
    for (const jointId of ['shoulder.left', 'shoulder.right']) {
      const values = samples.map((sample) => value(sample, jointId));
      expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(20);
    }
  });

  it('preserves attack phases with anticipation, contact, follow-through, and a full-body lunge', async () => {
    const bundle = await compileReferenceFiveClipBatchAuthoringRequest(
      document,
      revisionId,
      referenceBatch(),
    );
    const attack = bundle.clips.find(({ action }) => action === 'attack')!;
    expect(attack.keyframes.map(({ phase }) => phase)).toEqual([
      'neutral',
      'anticipation',
      'windup',
      'contact',
      'follow_through',
      'recovery',
      'terminal_hold',
    ]);
    const anticipation = sampleRigidClip(bundle.rig, bundle.poses, attack, 125);
    const contact = sampleRigidClip(bundle.rig, bundle.poses, attack, 375);
    const followThrough = sampleRigidClip(
      bundle.rig,
      bundle.poses,
      attack,
      500,
    );
    const value = (
      sample: ReturnType<typeof sampleRigidClip>,
      jointId: string,
    ) =>
      sample.channels.find((channel) => channel.jointId === jointId)!
        .valueDegrees;
    expect(
      Math.abs(
        value(anticipation, 'shoulder.right') -
          value(contact, 'shoulder.right'),
      ),
    ).toBeGreaterThanOrEqual(65);
    expect(
      Math.abs(
        value(anticipation, 'elbow.right') -
          value(followThrough, 'elbow.right'),
      ),
    ).toBeGreaterThanOrEqual(60);
    expect(
      Math.abs(
        value(anticipation, 'hip.left') - value(followThrough, 'hip.left'),
      ),
    ).toBeGreaterThanOrEqual(30);
    expect(Math.hypot(...followThrough.rootMotion.offset)).toBeGreaterThan(
      0.12,
    );
  });

  it('authors root-and-limb damage recoil followed by recovery', async () => {
    const bundle = await compileReferenceFiveClipBatchAuthoringRequest(
      document,
      revisionId,
      referenceBatch(),
    );
    const damage = bundle.clips.find(
      ({ action }) => action === 'receive_damage',
    )!;
    const impact = sampleRigidClip(bundle.rig, bundle.poses, damage, 125);
    const recoil = sampleRigidClip(bundle.rig, bundle.poses, damage, 250);
    const recovery = sampleRigidClip(bundle.rig, bundle.poses, damage, 375);
    expect(Math.hypot(...recoil.rootMotion.offset)).toBeGreaterThanOrEqual(
      0.15,
    );
    expect(Math.hypot(...recovery.rootMotion.offset)).toBeLessThan(
      Math.hypot(...recoil.rootMotion.offset) * 0.6,
    );
    expect(
      Math.abs(
        recoil.channels.find(({ jointId }) => jointId === 'hip.left')!
          .valueDegrees -
          recovery.channels.find(({ jointId }) => jointId === 'hip.left')!
            .valueDegrees,
      ),
    ).toBeGreaterThanOrEqual(25);
    expect(
      new Set(
        [impact, recoil, recovery].map(
          ({ rootMotion }) => rootMotion.yawDegrees,
        ),
      ),
    ).toEqual(new Set([-2]));
    expect(Math.sign(impact.rootMotion.offset[0])).toBe(
      Math.sign(recoil.rootMotion.offset[0]),
    );
    expect(Math.sign(recovery.rootMotion.offset[0])).toBe(
      Math.sign(recoil.rootMotion.offset[0]),
    );
    expect(Math.hypot(...impact.rootMotion.offset)).toBeLessThan(
      Math.hypot(...recoil.rootMotion.offset),
    );
    expect(Math.hypot(...recovery.rootMotion.offset)).toBeLessThan(
      Math.hypot(...impact.rootMotion.offset),
    );
    expect(recoil.rootMotion.offset[0]).toBeLessThanOrEqual(-0.18);
    expect(recoil.rootMotion.offset[1]).toBeGreaterThanOrEqual(0.08);
  });

  it('applies full-body hinge channels and torso root motion to render documents', async () => {
    const bundle = await compileReferenceFiveClipBatchAuthoringRequest(
      document,
      revisionId,
      referenceBatch(),
    );
    const rendered = temporalRenderDocuments(document, bundle);
    const walkContact = rendered.find(
      ({ action, sampleTimeMs }) =>
        action === 'walk_forward' && sampleTimeMs === 0,
    )!;
    const walkOverrides = walkContact.document.poses.find(
      ({ id }) => id === 'animation.sample',
    )!.overrides;
    expect(walkOverrides.map(({ partId }) => partId)).toEqual([
      'torso',
      'upper-arm.left',
      'upper-arm.right',
      'forearm.left',
      'forearm.right',
      'thigh.left',
      'thigh.right',
      'shin.left',
      'shin.right',
    ]);
    expect(
      walkOverrides.find(({ partId }) => partId === 'thigh.left'),
    ).toMatchObject({ jointValueDegrees: -36 });

    const damageRecoil = rendered.find(
      ({ action, sampleTimeMs }) =>
        action === 'receive_damage' && sampleTimeMs === 250,
    )!;
    const rootOverride = damageRecoil.document.poses
      .find(({ id }) => id === 'animation.sample')!
      .overrides.find(({ partId }) => partId === 'torso')!;
    expect(rootOverride.transform?.position).toEqual([-0.24, 0.13, -0.02]);
    expect(rootOverride.transform?.rotation).not.toEqual([0, 0, 0, 1]);
  });

  it('keeps every captured action sample distinct and every joint inside its declared limits', async () => {
    const bundle = await compileReferenceFiveClipBatchAuthoringRequest(
      document,
      revisionId,
      referenceBatch(),
    );
    const limits = new Map(
      bundle.rig.joints.map((joint) => [
        joint.id,
        [joint.minimumDegrees, joint.maximumDegrees] as const,
      ]),
    );
    for (const [clipIndex, clip] of bundle.clips.entries()) {
      const sampleTimes = [
        ...new Set(
          bundle.framePlans[clipIndex]!.frames.map(
            ({ key }) => key.sampleTimeMs,
          ),
        ),
      ];
      const samples = sampleTimes.map((time) =>
        sampleRigidClip(bundle.rig, bundle.poses, clip, time),
      );
      expect(
        new Set(
          samples.map((sample) =>
            JSON.stringify({
              channels: sample.channels,
              rootMotion: sample.rootMotion,
            }),
          ),
        ).size,
      ).toBe(samples.length);
      for (const sample of samples)
        for (const channel of sample.channels) {
          const [minimum, maximum] = limits.get(channel.jointId)!;
          expect(channel.valueDegrees).toBeGreaterThanOrEqual(minimum);
          expect(channel.valueDegrees).toBeLessThanOrEqual(maximum);
        }
    }
  });

  it('canonicalizes batch directions before frame planning and rendering', async () => {
    const input = referenceBatch();
    input.clips[0].capture.directions = ['S', 'N'];
    const bundle = await compileReferenceFiveClipBatchAuthoringRequest(
      document,
      revisionId,
      input,
    );
    expect(
      temporalRenderDocuments(document, bundle)
        .filter(({ action }) => action === 'idle')
        .map(({ direction }) => direction),
    ).toEqual([
      ...Array.from({ length: 4 }, () => 'N' as const),
      ...Array.from({ length: 4 }, () => 'S' as const),
    ]);
    const idleFrames = temporalRenderDocuments(document, bundle).filter(
      ({ action }) => action === 'idle',
    );
    expect(temporalPoseSheetLayout(idleFrames)).toMatchObject({
      width: 512,
      height: 256,
      columns: 4,
      rows: 2,
    });
  }, 15_000);

  it('rejects wrong actions, phase order, loops, sample counts, duplicate pose content, and broken seams', async () => {
    const cases: [RegExp, (input: MutableReferenceBatch) => void][] = [
      [
        /action|literal/i,
        (input) => {
          input.clips[1].action = 'walk_right';
        },
      ],
      [
        /phase/i,
        (input) => {
          [
            input.clips[3].keyframes[1]!.phase,
            input.clips[3].keyframes[2]!.phase,
          ] = [
            input.clips[3].keyframes[2]!.phase,
            input.clips[3].keyframes[1]!.phase,
          ];
        },
      ],
      [
        /loop/i,
        (input) => {
          input.clips[3].loop = { mode: 'loop', startMs: 0, endMs: 750 };
        },
      ],
      [
        /4 temporal samples/i,
        (input) => {
          input.clips[0].capture.framesPerSecond = 6;
        },
      ],
      [
        /duplicate pose content/i,
        (input) => {
          input.poses[1]!.channels = structuredClone(input.poses[0]!.channels);
          input.poses[1]!.rootMotion = structuredClone(
            input.poses[0]!.rootMotion,
          );
        },
      ],
      [
        /loop seam/i,
        (input) => {
          input.clips[0].keyframes.at(-1)!.poseId = 'idle.inhale';
        },
      ],
    ];
    for (const [message, mutate] of cases) {
      const input = mutableReferenceBatch();
      mutate(input);
      await expect(
        compileReferenceFiveClipBatchAuthoringRequest(
          document,
          revisionId,
          input,
        ),
      ).rejects.toThrow(message);
    }
  });

  it('rejects arm-only rigs, unstable side facing, weak E-view separation, weak attacks, and unstable damage', () => {
    const cases: [RegExp, (input: MutableReferenceBatch) => void][] = [
      [
        /full-body joint knee\.left/i,
        (input) => {
          input.rig.joints = input.rig.joints.filter(
            ({ id }) => id !== 'knee.left',
          );
        },
      ],
      [
        /walk_forward requires visibly alternating/i,
        (input) => {
          for (const poseId of ['wf.contact-left', 'wf.contact-right']) {
            const pose = input.poses.find(({ id }) => id === poseId)!;
            for (const channel of pose.channels)
              if (
                channel.jointId === 'hip.left' ||
                channel.jointId === 'hip.right'
              )
                channel.valueDegrees = 0;
          }
        },
      ],
      [
        /stable small three-quarter facing yaw/i,
        (input) => {
          input.poses.find(({ id }) => id === 'wr.contact-left')!.rootMotion = {
            offset: [0, 0, -0.015],
            yawDegrees: -10,
          };
        },
      ],
      [
        /E-view silhouette-delta proxy/i,
        (input) => {
          for (const poseId of ['wr.contact-left', 'wr.contact-right']) {
            const pose = input.poses.find(({ id }) => id === poseId)!;
            for (const channel of pose.channels) {
              if (channel.jointId === 'hip.left') channel.valueDegrees = -30;
              if (channel.jointId === 'hip.right') channel.valueDegrees = 30;
            }
          }
        },
      ],
      [
        /attack requires full-body/i,
        (input) => {
          input.poses.find(
            ({ id }) => id === 'attack.follow-through',
          )!.rootMotion = { offset: [0, 0, 0], yawDegrees: 0 };
        },
      ],
      [
        /receive_damage requires whole-body root recoil/i,
        (input) => {
          input.poses.find(({ id }) => id === 'damage.recoil')!.rootMotion = {
            offset: [0, 0, 0],
            yawDegrees: 0,
          };
        },
      ],
      [
        /stable facing without yaw reversal/i,
        (input) => {
          input.poses.find(({ id }) => id === 'damage.recoil')!.rootMotion = {
            offset: [-0.24, 0.13, -0.02],
            yawDegrees: 2,
          };
        },
      ],
    ];
    for (const [message, mutate] of cases) {
      const input = mutableReferenceBatch();
      mutate(input);
      expect(() =>
        ReferenceFiveClipBatchAuthoringRequestSchema.parse(input),
      ).toThrow(message);
    }
  });
});
