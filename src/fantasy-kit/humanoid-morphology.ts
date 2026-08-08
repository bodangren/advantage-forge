import { z } from 'zod';

import {
  HumanoidMorphologyProfileSchema,
  type HumanoidMorphologyProfile,
} from '../contracts/index.js';
import { canonicalJson } from '../document/browser.js';

import {
  compileChibiGuardReferenceGeometry,
  type ReferenceGeometryPlan,
} from './reference-geometry/chibi-guard.js';

export const HUMANOID_MORPHOLOGY_PLAN_CONTRACT_ID =
  'forge-humanoid-morphology-plan/v1' as const;
export const REFERENCE_CHIBI_GUARD_MORPHOLOGY_PROFILE_ID =
  'morphology.reference-chibi-guard' as const;

type Vec3 = readonly [number, number, number];
type Side = 'center' | 'left' | 'right';

export const RUSTIC_HUMANOID_PART_MAP = Object.freeze({
  torso: 'torso',
  head: 'head',
  pelvis: 'pelvis',
  upperArmLeft: 'upper-arm.left',
  upperArmRight: 'upper-arm.right',
  forearmLeft: 'forearm.left',
  forearmRight: 'forearm.right',
  handLeft: 'hand.left',
  handRight: 'hand.right',
  thighLeft: 'thigh.left',
  thighRight: 'thigh.right',
  shinLeft: 'shin.left',
  shinRight: 'shin.right',
  footLeft: 'foot.left',
  footRight: 'foot.right',
} as const);

const RusticHumanoidPartMapSchema = z.strictObject({
  torso: z.enum(['torso', 'body.root']),
  head: z.literal(RUSTIC_HUMANOID_PART_MAP.head),
  pelvis: z.literal(RUSTIC_HUMANOID_PART_MAP.pelvis),
  upperArmLeft: z.literal(RUSTIC_HUMANOID_PART_MAP.upperArmLeft),
  upperArmRight: z.literal(RUSTIC_HUMANOID_PART_MAP.upperArmRight),
  forearmLeft: z.literal(RUSTIC_HUMANOID_PART_MAP.forearmLeft),
  forearmRight: z.literal(RUSTIC_HUMANOID_PART_MAP.forearmRight),
  handLeft: z.literal(RUSTIC_HUMANOID_PART_MAP.handLeft),
  handRight: z.literal(RUSTIC_HUMANOID_PART_MAP.handRight),
  thighLeft: z.literal(RUSTIC_HUMANOID_PART_MAP.thighLeft),
  thighRight: z.literal(RUSTIC_HUMANOID_PART_MAP.thighRight),
  shinLeft: z.literal(RUSTIC_HUMANOID_PART_MAP.shinLeft),
  shinRight: z.literal(RUSTIC_HUMANOID_PART_MAP.shinRight),
  footLeft: z.literal(RUSTIC_HUMANOID_PART_MAP.footLeft),
  footRight: z.literal(RUSTIC_HUMANOID_PART_MAP.footRight),
});

export type RusticHumanoidPartMap = z.infer<typeof RusticHumanoidPartMapSchema>;

export interface HumanoidMorphologyPartAdjustment {
  readonly partId: string;
  readonly semanticRole: string;
  readonly side: Side;
  readonly localRestTransform: {
    readonly position: Vec3;
    readonly rotation: readonly [0, 0, 0, 1];
    readonly scale: Vec3;
  };
  readonly targetWorldPosition: Vec3;
  readonly targetWorldScale: Vec3;
}

export interface HumanoidMorphologyAttachmentTarget {
  readonly id: string;
  readonly parentPartId: string;
  readonly childPartId: string;
  readonly parentPortId: string;
  readonly childPortId: string;
  readonly targetWorldPosition: Vec3;
}

export interface HumanoidMorphologyMountEnvelope {
  readonly id: string;
  readonly ownerPartId: string;
  readonly mountPortId: string;
  readonly center: Vec3;
  readonly halfExtents: Vec3;
}

export interface HumanoidMorphologyPlan {
  readonly contractId: typeof HUMANOID_MORPHOLOGY_PLAN_CONTRACT_ID;
  readonly sourceProfile: HumanoidMorphologyProfile;
  readonly binding: {
    readonly kitId: 'rustic-human';
    readonly archetypeId: 'humanoid.biped.rustic';
    readonly styleProfile: {
      readonly id: 'cute_chibi_v1';
      readonly version: '1.0.0';
    };
  };
  readonly partAdjustments: readonly HumanoidMorphologyPartAdjustment[];
  readonly attachmentTargets: readonly HumanoidMorphologyAttachmentTarget[];
  readonly mountEnvelopes: readonly HumanoidMorphologyMountEnvelope[];
  readonly referenceGeometry: ReferenceGeometryPlan;
  readonly metrics: {
    readonly bounds: { readonly min: Vec3; readonly max: Vec3 };
    readonly width: number;
    readonly height: number;
    readonly depth: number;
    readonly headHeight: number;
    readonly headCount: number;
    readonly headCountTarget: number;
    readonly groundY: 0;
  };
  readonly budgets: {
    readonly maximumPartCount: 15;
    readonly maximumWidth: 2.5;
    readonly maximumHeight: 4;
    readonly maximumDepth: 2;
    readonly maximumHeadCountError: 0.75;
    readonly maximumLocalScale: 4;
  };
  readonly validation: {
    readonly valid: true;
    readonly partCount: 15;
    readonly attachmentCount: 14;
    readonly mountEnvelopeCount: 6;
    readonly symmetryError: number;
  };
}

interface PartDefinition {
  readonly key: keyof RusticHumanoidPartMap;
  readonly role: string;
  readonly side: Side;
  readonly halfExtents: Vec3;
  readonly parentKey?: keyof RusticHumanoidPartMap;
  readonly parentPortId?: string;
  readonly parentPort?: Vec3;
  readonly childPortId?: string;
  readonly childPort?: Vec3;
}

const PART_DEFINITIONS: readonly PartDefinition[] = [
  {
    key: 'torso',
    role: 'anatomy.torso',
    side: 'center',
    halfExtents: [0.26, 0.34, 0.14],
  },
  {
    key: 'head',
    role: 'anatomy.head',
    side: 'center',
    halfExtents: [0.19, 0.23, 0.18],
    parentKey: 'torso',
    parentPortId: 'neck',
    parentPort: [0, 0.39, 0],
    childPortId: 'neck.attach',
    childPort: [0, -0.22, 0],
  },
  {
    key: 'pelvis',
    role: 'anatomy.pelvis',
    side: 'center',
    halfExtents: [0.23, 0.15, 0.135],
    parentKey: 'torso',
    parentPortId: 'hip',
    parentPort: [0, -0.39, 0],
    childPortId: 'torso.attach',
    childPort: [0, 0.18, 0],
  },
  ...(['left', 'right'] as const).flatMap((side) => {
    const suffix = side === 'left' ? 'Left' : 'Right';
    const sign = side === 'left' ? -1 : 1;
    return [
      {
        key: `upperArm${suffix}`,
        role: 'anatomy.upper-arm',
        side,
        halfExtents: [0.095, 0.255, 0.095],
        parentKey: 'torso',
        parentPortId: `shoulder.${side}`,
        parentPort: [sign * 0.32, 0.24, 0],
        childPortId: 'shoulder.attach',
        childPort: [0, 0.25, 0],
      },
      {
        key: `forearm${suffix}`,
        role: 'anatomy.forearm',
        side,
        halfExtents: [0.082, 0.232, 0.082],
        parentKey: `upperArm${suffix}`,
        parentPortId: 'elbow',
        parentPort: [0, -0.25, 0],
        childPortId: 'elbow.attach',
        childPort: [0, 0.23, 0],
      },
      {
        key: `hand${suffix}`,
        role: 'anatomy.hand',
        side,
        halfExtents: [0.065, 0.1, 0.05],
        parentKey: `forearm${suffix}`,
        parentPortId: 'wrist',
        parentPort: [0, -0.23, 0],
        childPortId: 'wrist.attach',
        childPort: [0, 0.11, 0],
      },
      {
        key: `thigh${suffix}`,
        role: 'anatomy.thigh',
        side,
        halfExtents: [0.12, 0.33, 0.12],
        parentKey: 'pelvis',
        parentPortId: `leg.${side}`,
        parentPort: [sign * 0.15, -0.17, 0],
        childPortId: 'hip.attach',
        childPort: [0, 0.31, 0],
      },
      {
        key: `shin${suffix}`,
        role: 'anatomy.shin',
        side,
        halfExtents: [0.1, 0.3, 0.1],
        parentKey: `thigh${suffix}`,
        parentPortId: 'knee',
        parentPort: [0, -0.31, 0],
        childPortId: 'knee.attach',
        childPort: [0, 0.29, 0],
      },
      {
        key: `foot${suffix}`,
        role: 'anatomy.foot',
        side,
        halfExtents: [0.105, 0.085, 0.185],
        parentKey: `shin${suffix}`,
        parentPortId: 'ankle',
        parentPort: [0, -0.29, 0],
        childPortId: 'ankle.attach',
        childPort: [0, 0.09, -0.07],
      },
    ] as const satisfies readonly PartDefinition[];
  }),
] as const;

const BUDGETS = Object.freeze({
  maximumPartCount: 15,
  maximumWidth: 2.5,
  maximumHeight: 4,
  maximumDepth: 2,
  maximumHeadCountError: 0.75,
  maximumLocalScale: 4,
} as const);

const round = (value: number): number => {
  const rounded = Math.round(value * 1_000_000_000) / 1_000_000_000;
  return Object.is(rounded, -0) ? 0 : rounded;
};
const vector = (x: number, y: number, z: number): Vec3 => [
  round(x),
  round(y),
  round(z),
];
const multiply = (left: Vec3, right: Vec3): Vec3 =>
  vector(left[0] * right[0], left[1] * right[1], left[2] * right[2]);
const divide = (left: Vec3, right: Vec3): Vec3 =>
  vector(left[0] / right[0], left[1] / right[1], left[2] / right[2]);
const add = (left: Vec3, right: Vec3): Vec3 =>
  vector(left[0] + right[0], left[1] + right[1], left[2] + right[2]);
const subtract = (left: Vec3, right: Vec3): Vec3 =>
  vector(left[0] - right[0], left[1] - right[1], left[2] - right[2]);

const scaleFactor = (
  control: number,
  negativeReduction: number,
  positiveExpansion: number,
): number =>
  round(
    control < 0
      ? 1 + control * negativeReduction
      : 1 + control * positiveExpansion,
  );

function worldScales(
  profile: HumanoidMorphologyProfile,
): Readonly<Record<keyof RusticHumanoidPartMap, Vec3>> {
  const p = profile.proportions;
  const head = scaleFactor(p.headScale, 0.25, 0.65);
  const headWidth = scaleFactor(p.headWidth, 0.2, 0.45);
  const headDepth = scaleFactor(p.headDepth, 0.2, 0.35);
  const roundness = scaleFactor(p.craniumRoundness, 0.1, 0.2);
  const torsoLength = scaleFactor(p.torsoLength, 0.55, 0.35);
  const torsoWidth = scaleFactor(p.torsoWidth, 0.3, 0.45);
  const torsoDepth = scaleFactor(p.torsoDepth, 0.25, 0.8);
  const pelvisWidth = scaleFactor(p.pelvisWidth, 0.25, 0.4);
  const armLength = scaleFactor(p.armLength, 0.65, 0.35);
  const armThickness = scaleFactor(p.armThickness, 0.3, 0.45);
  const legLength = scaleFactor(p.legLength, 0.72, 0.4);
  const legThickness = scaleFactor(p.legThickness, 0.3, 0.45);
  const hand = scaleFactor(p.handScale, 0.25, 0.35);
  const foot = scaleFactor(p.footScale, 0.25, 0.3);
  const pelvisY = torsoLength;

  return {
    torso: vector(torsoWidth, torsoLength, torsoDepth),
    head: vector(
      head * headWidth * roundness,
      head,
      head * headDepth * roundness,
    ),
    pelvis: vector(pelvisWidth, pelvisY, torsoDepth),
    upperArmLeft: vector(armThickness, armLength, armThickness),
    upperArmRight: vector(armThickness, armLength, armThickness),
    forearmLeft: vector(armThickness, armLength, armThickness),
    forearmRight: vector(armThickness, armLength, armThickness),
    handLeft: vector(hand * armLength, hand * armLength, hand * armLength),
    handRight: vector(hand * armLength, hand * armLength, hand * armLength),
    thighLeft: vector(legThickness, legLength, legThickness),
    thighRight: vector(legThickness, legLength, legThickness),
    shinLeft: vector(legThickness, legLength, legThickness),
    shinRight: vector(legThickness, legLength, legThickness),
    footLeft: vector(foot * legLength, foot * legLength, foot * legLength),
    footRight: vector(foot * legLength, foot * legLength, foot * legLength),
  };
}

function targetForAttachment(
  definition: PartDefinition,
  parentPosition: Vec3,
  parentScale: Vec3,
  profile: HumanoidMorphologyProfile,
): Vec3 {
  const parentPort = definition.parentPort!;
  if (definition.key === 'upperArmLeft' || definition.key === 'upperArmRight') {
    const sign = definition.side === 'left' ? -1 : 1;
    const shoulderWidth = scaleFactor(
      profile.proportions.shoulderWidth,
      0.3,
      0.55,
    );
    return add(
      parentPosition,
      vector(sign * 0.32 * shoulderWidth, 0.24 * parentScale[1], 0),
    );
  }
  const base = add(parentPosition, multiply(parentScale, parentPort));
  if (definition.key !== 'head') return base;
  return add(base, vector(0, profile.proportions.neckLength * 0.06, 0));
}

interface MutablePlacement {
  readonly definition: PartDefinition;
  readonly partId: string;
  readonly worldScale: Vec3;
  worldPosition: Vec3;
  localPosition: Vec3;
  readonly localScale: Vec3;
  attachmentTarget?: Vec3;
}

function placeParts(
  profile: HumanoidMorphologyProfile,
  partMap: RusticHumanoidPartMap,
): MutablePlacement[] {
  const scales = worldScales(profile);
  const byKey = new Map<keyof RusticHumanoidPartMap, MutablePlacement>();
  const placements: MutablePlacement[] = [];

  for (const definition of PART_DEFINITIONS) {
    const worldScale = scales[definition.key];
    let placement: MutablePlacement;
    if (definition.parentKey === undefined) {
      placement = {
        definition,
        partId: partMap[definition.key],
        worldScale,
        worldPosition: [0, 0, 0],
        localPosition: [0, 0, 0],
        localScale: worldScale,
      };
    } else {
      const parent = byKey.get(definition.parentKey);
      if (parent === undefined)
        throw new HumanoidMorphologyCompilationError(
          `Internal part order does not place ${String(definition.parentKey)} before ${String(definition.key)}.`,
        );
      const attachmentTarget = targetForAttachment(
        definition,
        parent.worldPosition,
        parent.worldScale,
        profile,
      );
      const childPort = definition.childPort!;
      const worldPosition = subtract(
        attachmentTarget,
        multiply(worldScale, childPort),
      );
      const alignedPosition = subtract(
        add(
          parent.worldPosition,
          multiply(parent.worldScale, definition.parentPort!),
        ),
        multiply(parent.worldScale, childPort),
      );
      placement = {
        definition,
        partId: partMap[definition.key],
        worldScale,
        worldPosition,
        localPosition: divide(
          subtract(worldPosition, alignedPosition),
          parent.worldScale,
        ),
        localScale: divide(worldScale, parent.worldScale),
        attachmentTarget,
      };
    }
    placements.push(placement);
    byKey.set(definition.key, placement);
  }

  return placements;
}

function boundsFor(placements: readonly MutablePlacement[]) {
  let min: Vec3 = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  ];
  let max: Vec3 = [
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ];
  for (const placement of placements) {
    const extent = multiply(
      placement.definition.halfExtents,
      placement.worldScale,
    );
    min = vector(
      Math.min(min[0], placement.worldPosition[0] - extent[0]),
      Math.min(min[1], placement.worldPosition[1] - extent[1]),
      Math.min(min[2], placement.worldPosition[2] - extent[2]),
    );
    max = vector(
      Math.max(max[0], placement.worldPosition[0] + extent[0]),
      Math.max(max[1], placement.worldPosition[1] + extent[1]),
      Math.max(max[2], placement.worldPosition[2] + extent[2]),
    );
  }
  return { min, max };
}

function shiftToGround(placements: MutablePlacement[]): void {
  const shift = -boundsFor(placements).min[1];
  for (const placement of placements) {
    placement.worldPosition = add(placement.worldPosition, [0, shift, 0]);
    if (placement.attachmentTarget !== undefined)
      placement.attachmentTarget = add(placement.attachmentTarget, [
        0,
        shift,
        0,
      ]);
  }
  const root = placements.find(
    ({ definition }) => definition.parentKey === undefined,
  )!;
  root.localPosition = root.worldPosition;
}

function mountEnvelopes(
  placements: readonly MutablePlacement[],
): HumanoidMorphologyMountEnvelope[] {
  const byKey = new Map(
    placements.map((placement) => [placement.definition.key, placement]),
  );
  const mount = (
    id: string,
    key: keyof RusticHumanoidPartMap,
    mountPortId: string,
    port: Vec3,
    envelopeScale: Vec3,
  ): HumanoidMorphologyMountEnvelope => {
    const owner = byKey.get(key)!;
    return {
      id,
      ownerPartId: owner.partId,
      mountPortId,
      center: add(owner.worldPosition, multiply(owner.worldScale, port)),
      halfExtents: vector(
        Math.max(0.03, envelopeScale[0] * owner.worldScale[0]),
        Math.max(0.03, envelopeScale[1] * owner.worldScale[1]),
        Math.max(0.03, envelopeScale[2] * owner.worldScale[2]),
      ),
    };
  };

  return [
    mount(
      'mount.body',
      'torso',
      'equipment.body',
      [0, 0, 0.17],
      [0.26, 0.28, 0.08],
    ),
    mount(
      'mount.back',
      'torso',
      'equipment.back',
      [0, 0, -0.17],
      [0.26, 0.28, 0.08],
    ),
    mount(
      'mount.head',
      'head',
      'equipment.head',
      [0, 0.16, 0],
      [0.22, 0.12, 0.21],
    ),
    mount(
      'mount.waist',
      'pelvis',
      'equipment.waist',
      [0, 0, 0.16],
      [0.22, 0.12, 0.08],
    ),
    mount(
      'mount.hand.left',
      'handLeft',
      'equipment',
      [0, -0.04, 0.09],
      [0.08, 0.12, 0.1],
    ),
    mount(
      'mount.hand.right',
      'handRight',
      'equipment',
      [0, -0.04, 0.09],
      [0.08, 0.12, 0.1],
    ),
  ].sort((left, right) => left.id.localeCompare(right.id));
}

function symmetryError(placements: readonly MutablePlacement[]): number {
  const byId = new Map(
    placements.map((placement) => [placement.partId, placement]),
  );
  let error = 0;
  for (const segment of [
    'upper-arm',
    'forearm',
    'hand',
    'thigh',
    'shin',
    'foot',
  ]) {
    const left = byId.get(`${segment}.left`)!;
    const right = byId.get(`${segment}.right`)!;
    error = Math.max(
      error,
      Math.abs(left.worldPosition[0] + right.worldPosition[0]),
      Math.abs(left.worldPosition[1] - right.worldPosition[1]),
      Math.abs(left.worldPosition[2] - right.worldPosition[2]),
      ...left.worldScale.map((value, axis) =>
        Math.abs(value - right.worldScale[axis]!),
      ),
    );
  }
  return round(error);
}

function assertWithinBudgets(
  placements: readonly MutablePlacement[],
  bounds: { readonly min: Vec3; readonly max: Vec3 },
  headCount: number,
  headCountTarget: number,
  symmetry: number,
): void {
  const dimensions = subtract(bounds.max, bounds.min);
  const maximumLocalScale = Math.max(
    ...placements.flatMap(({ localScale }) => [...localScale]),
  );
  const maximumLocalScalePart = placements.find(({ localScale }) =>
    localScale.includes(maximumLocalScale),
  )?.partId;
  if (
    placements.length !== BUDGETS.maximumPartCount ||
    dimensions[0] > BUDGETS.maximumWidth ||
    dimensions[1] > BUDGETS.maximumHeight ||
    dimensions[2] > BUDGETS.maximumDepth ||
    dimensions.some(
      (dimension) => !Number.isFinite(dimension) || dimension <= 0,
    ) ||
    Math.abs(headCount - headCountTarget) > BUDGETS.maximumHeadCountError ||
    maximumLocalScale > BUDGETS.maximumLocalScale ||
    symmetry !== 0
  )
    throw new HumanoidMorphologyCompilationError(
      `Compiled morphology exceeds its geometry, head-count, scale, or symmetry budget: parts=${placements.length}/${BUDGETS.maximumPartCount}; dimensions=${dimensions.join(',')}/${BUDGETS.maximumWidth},${BUDGETS.maximumHeight},${BUDGETS.maximumDepth}; headCount=${headCount}/${headCountTarget}; maximumLocalScale=${maximumLocalScale}/${BUDGETS.maximumLocalScale} (${maximumLocalScalePart ?? 'unknown'}); symmetry=${symmetry}.`,
    );
}

export class HumanoidMorphologyCompilationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'HumanoidMorphologyCompilationError';
  }
}

/** Compiles one registered profile into a bounded, mesh-free semantic plan. */
export function compileHumanoidMorphology(
  profileInput: unknown,
  partMapInput: unknown = RUSTIC_HUMANOID_PART_MAP,
): HumanoidMorphologyPlan {
  const profileResult = HumanoidMorphologyProfileSchema.safeParse(profileInput);
  if (!profileResult.success)
    throw new HumanoidMorphologyCompilationError(
      `Unsupported humanoid morphology profile: ${profileResult.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`).join('; ')}`,
    );
  const partMapResult = RusticHumanoidPartMapSchema.safeParse(partMapInput);
  if (!partMapResult.success)
    throw new HumanoidMorphologyCompilationError(
      `Unsupported rustic humanoid part map: ${partMapResult.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`).join('; ')}`,
    );

  const profile = profileResult.data;
  const partMap = partMapResult.data;
  const placements = placeParts(profile, partMap);
  shiftToGround(placements);
  const bounds = boundsFor(placements);
  const dimensions = subtract(bounds.max, bounds.min);
  const head = placements.find(({ definition }) => definition.key === 'head')!;
  const headHeight = round(
    head.definition.halfExtents[1] * 2 * head.worldScale[1],
  );
  const headCount = round(dimensions[1] / headHeight);
  const headCountTarget = round(
    Math.min(
      7.5,
      Math.max(
        2.75,
        6 -
          1.7 * profile.proportions.headScale +
          0.7 * profile.proportions.torsoLength +
          0.8 * profile.proportions.legLength,
      ),
    ),
  );
  const symmetry = symmetryError(placements);
  assertWithinBudgets(placements, bounds, headCount, headCountTarget, symmetry);

  const partAdjustments = placements
    .map((placement): HumanoidMorphologyPartAdjustment => ({
      partId: placement.partId,
      semanticRole: placement.definition.role,
      side: placement.definition.side,
      localRestTransform: {
        position: placement.localPosition,
        rotation: [0, 0, 0, 1],
        scale: placement.localScale,
      },
      targetWorldPosition: placement.worldPosition,
      targetWorldScale: placement.worldScale,
    }))
    .sort((left, right) => left.partId.localeCompare(right.partId));
  const attachmentTargets = placements
    .filter(
      (placement): placement is MutablePlacement & { attachmentTarget: Vec3 } =>
        placement.attachmentTarget !== undefined,
    )
    .map((placement): HumanoidMorphologyAttachmentTarget => ({
      id: `attachment.${placement.partId}`,
      parentPartId: partMap[placement.definition.parentKey!],
      childPartId: placement.partId,
      parentPortId: placement.definition.parentPortId!,
      childPortId: placement.definition.childPortId!,
      targetWorldPosition: placement.attachmentTarget,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const baseMountEnvelopes = mountEnvelopes(placements);
  const referenceGeometry = compileChibiGuardReferenceGeometry(
    profile,
    partAdjustments,
    baseMountEnvelopes,
  );
  const envelopeOverrides = new Map(
    referenceGeometry.mountEnvelopeOverrides.map((envelope) => [
      envelope.id,
      envelope,
    ]),
  );
  const adaptedMountEnvelopes = baseMountEnvelopes.map(
    (envelope): HumanoidMorphologyMountEnvelope =>
      envelopeOverrides.get(envelope.id) ?? envelope,
  );

  return {
    contractId: HUMANOID_MORPHOLOGY_PLAN_CONTRACT_ID,
    sourceProfile: profile,
    binding: {
      kitId: profile.kitId,
      archetypeId: profile.archetypeId,
      styleProfile: profile.styleProfile,
    },
    partAdjustments,
    attachmentTargets,
    mountEnvelopes: adaptedMountEnvelopes,
    referenceGeometry,
    metrics: {
      bounds,
      width: dimensions[0],
      height: dimensions[1],
      depth: dimensions[2],
      headHeight,
      headCount,
      headCountTarget,
      groundY: 0,
    },
    budgets: BUDGETS,
    validation: {
      valid: true,
      partCount: 15,
      attachmentCount: 14,
      mountEnvelopeCount: 6,
      symmetryError: symmetry,
    },
  };
}

/** Canonical bytes used to bind a morphology plan without relying on key order. */
export function canonicalHumanoidMorphologyPlan(
  plan: HumanoidMorphologyPlan,
): string {
  return canonicalJson(plan);
}

/** Browser-safe SHA-256 of the canonical semantic plan. */
export async function digestHumanoidMorphologyPlan(
  plan: HumanoidMorphologyPlan,
): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalHumanoidMorphologyPlan(plan));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
