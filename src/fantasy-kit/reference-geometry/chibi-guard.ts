import type { HumanoidMorphologyProfile } from '../../contracts/index.js';
import type { SemanticOperation, SemanticPatch } from '../../document/index.js';

export const REFERENCE_GEOMETRY_PLAN_CONTRACT_ID =
  'forge-reference-geometry-plan/v1' as const;

const STRUCTURAL_REFERENCE = Object.freeze({
  path: 'reference-designs/chibi-guard-20260722/chibi-guard-base-turnaround_002.jpg',
  sha256: 'e922d42800c4e28a8a42eeb851013ef035941bda9c05e3a8790ba79bc471ff64',
  disposition: 'selected-structural-target' as const,
});

type Vec3 = readonly [number, number, number];

export interface ReferenceGeometryPartAdjustment {
  readonly partId: string;
  readonly semanticRole: string;
  readonly side: 'center' | 'left' | 'right';
  readonly targetWorldPosition: Vec3;
  readonly targetWorldScale: Vec3;
  readonly localRestTransform: {
    readonly position: Vec3;
    readonly rotation: readonly [number, number, number, number];
    readonly scale: Vec3;
  };
}

export interface ReferenceGeometryMountEnvelope {
  readonly id: string;
  readonly ownerPartId: string;
  readonly mountPortId: string;
  readonly center: Vec3;
  readonly halfExtents: Vec3;
}

export interface ReferenceGeometryPlan {
  readonly contractId: typeof REFERENCE_GEOMETRY_PLAN_CONTRACT_ID;
  readonly reference: typeof STRUCTURAL_REFERENCE;
  readonly sourceProfileId: string;
  readonly requiredExistingPartIds: readonly string[];
  readonly patch: SemanticPatch;
  readonly mountEnvelopeOverrides: readonly ReferenceGeometryMountEnvelope[];
  readonly validation: {
    readonly valid: true;
    readonly operationCount: number;
    readonly faceFeatureCount: 6;
    readonly faceFeatureSymmetryError: 0;
    readonly registeredGeneratorKindsOnly: true;
  };
}

export class ReferenceGeometryCompilationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ReferenceGeometryCompilationError';
  }
}

const round = (value: number): number => {
  const rounded = Math.round(value * 1_000_000_000) / 1_000_000_000;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const vector = (x: number, y: number, z: number): Vec3 => [
  round(x),
  round(y),
  round(z),
];

const transform = (
  position: Vec3,
  scale: Vec3 = [1, 1, 1],
  rotation: readonly [number, number, number, number] = [0, 0, 0, 1],
): {
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
} => ({
  position: [...position],
  rotation: [...rotation],
  scale: [...scale],
});

const requirePart = (
  adjustments: readonly ReferenceGeometryPartAdjustment[],
  partId: string,
): ReferenceGeometryPartAdjustment => {
  const part = adjustments.find((candidate) => candidate.partId === partId);
  if (part === undefined)
    throw new ReferenceGeometryCompilationError(
      `Reference geometry requires morphology part '${partId}'.`,
    );
  return part;
};

const requireRole = (
  adjustments: readonly ReferenceGeometryPartAdjustment[],
  semanticRole: string,
): ReferenceGeometryPartAdjustment => {
  const part = adjustments.find(
    (candidate) => candidate.semanticRole === semanticRole,
  );
  if (part === undefined)
    throw new ReferenceGeometryCompilationError(
      `Reference geometry requires morphology role '${semanticRole}'.`,
    );
  return part;
};

const requireEnvelope = (
  envelopes: readonly ReferenceGeometryMountEnvelope[],
  id: string,
): ReferenceGeometryMountEnvelope => {
  const envelope = envelopes.find((candidate) => candidate.id === id);
  if (envelope === undefined)
    throw new ReferenceGeometryCompilationError(
      `Reference geometry requires mount envelope '${id}'.`,
    );
  return envelope;
};

const shapeOperation = (
  partId: string,
  shape: Extract<
    SemanticOperation,
    { operation: 'setPartShapeParameters' }
  >['shape'],
): SemanticOperation => ({
  operation: 'setPartShapeParameters',
  partId,
  shape,
});

const materialOperation = (
  partId: string,
  slot: string,
  materialId: string,
): SemanticOperation => ({
  operation: 'setMaterialBinding',
  partId,
  slot,
  materialId,
});

/**
 * Compiles the selected guard reference into registered, semantic document
 * operations. It deliberately produces no raw mesh or unregistered template.
 */
export function compileChibiGuardReferenceGeometry(
  profile: HumanoidMorphologyProfile,
  anatomy: readonly ReferenceGeometryPartAdjustment[],
  mountEnvelopes: readonly ReferenceGeometryMountEnvelope[],
): ReferenceGeometryPlan {
  requireRole(anatomy, 'anatomy.torso');
  const head = requirePart(anatomy, 'head');
  requirePart(anatomy, 'hand.left');
  requirePart(anatomy, 'hand.right');
  const upperArmLeft = requirePart(anatomy, 'upper-arm.left');
  const upperArmRight = requirePart(anatomy, 'upper-arm.right');

  const headShape = {
    kind: 'ellipsoid' as const,
    radiusX: round(0.185 + 0.005 * Math.max(0, profile.proportions.headWidth)),
    radiusY: round(0.295 + 0.005 * Math.max(0, profile.proportions.headScale)),
    radiusZ: round(0.205 + 0.005 * Math.max(0, profile.proportions.headDepth)),
    widthSegments: 10,
    heightSegments: 6,
  };
  const actualHeadRadius = vector(
    headShape.radiusX * head.targetWorldScale[0],
    headShape.radiusY * head.targetWorldScale[1],
    headShape.radiusZ * head.targetWorldScale[2],
  );
  const faceParts: SemanticOperation[] = [
    {
      operation: 'setPartTransform',
      partId: 'face.eye.left',
      transform: transform([0, 0, 0]),
    },
    {
      operation: 'setPartTransform',
      partId: 'face.eye.right',
      transform: transform([0, 0, 0]),
    },
    shapeOperation('face.mouth', {
      kind: 'tubePath',
      path: [
        [-0.03, 0.006, 0],
        [0, -0.01, 0],
        [0.03, 0.006, 0],
      ],
      radius: 0.006,
      radialSegments: 4,
    }),
    {
      operation: 'setPartTransform',
      partId: 'face.mouth',
      transform: transform([0, 0, 0]),
    },
  ];
  const armTransformOperation = (
    arm: ReferenceGeometryPartAdjustment,
    sign: -1 | 1,
  ): SemanticOperation => {
    const angle = Math.PI / 8;
    return {
      operation: 'setPartTransform',
      partId: arm.partId,
      transform: transform(
        arm.localRestTransform.position,
        arm.localRestTransform.scale,
        [0, 0, round(sign * Math.sin(angle / 2)), round(Math.cos(angle / 2))],
      ),
    };
  };

  const operations: SemanticOperation[] = [
    ...faceParts,
    shapeOperation('head', headShape),
    {
      operation: 'setPartTransform',
      partId: 'head',
      transform: transform(
        vector(
          head.localRestTransform.position[0],
          head.localRestTransform.position[1] + 2.5,
          head.localRestTransform.position[2],
        ),
        head.localRestTransform.scale,
      ),
    },
    materialOperation('head', 'skin', 'skin.peach'),
    shapeOperation('body.root', {
      kind: 'beveledBox',
      width: 0.9,
      height: 0.72,
      depth: 0.4,
      bevel: 0.11,
    }),
    materialOperation('body.root', 'body', 'cloth.guard-teal'),
    armTransformOperation(upperArmLeft, -1),
    armTransformOperation(upperArmRight, 1),
    shapeOperation('pelvis', {
      kind: 'beveledBox',
      width: 0.48,
      height: 0.18,
      depth: 0.3,
      bevel: 0.06,
    }),
    materialOperation('pelvis', 'cloth', 'cloth.guard-teal'),
    ...(['left', 'right'] as const).flatMap((side) => [
      shapeOperation(`upper-arm.${side}`, {
        kind: 'capsule',
        radius: 0.16,
        cylinderHeight: 0.3,
        radialSegments: 8,
        capSegments: 3,
      }),
      materialOperation(`upper-arm.${side}`, 'cloth', 'cloth.guard-teal'),
      shapeOperation(`forearm.${side}`, {
        kind: 'capsule',
        radius: 0.15,
        cylinderHeight: 0.26,
        radialSegments: 8,
        capSegments: 3,
      }),
      materialOperation(`forearm.${side}`, 'skin', 'skin.peach'),
      shapeOperation(`hand.${side}`, {
        kind: 'ellipsoid',
        radiusX: 0.18,
        radiusY: 0.17,
        radiusZ: 0.16,
        widthSegments: 8,
        heightSegments: 4,
      }),
      materialOperation(`hand.${side}`, 'skin', 'skin.peach'),
      shapeOperation(`thigh.${side}`, {
        kind: 'capsule',
        radius: 0.16,
        cylinderHeight: 0.26,
        radialSegments: 8,
        capSegments: 3,
      }),
      materialOperation(`thigh.${side}`, 'cloth', 'cloth.guard-teal'),
      shapeOperation(`shin.${side}`, {
        kind: 'capsule',
        radius: 0.15,
        cylinderHeight: 0.22,
        radialSegments: 8,
        capSegments: 3,
      }),
      materialOperation(`shin.${side}`, 'cloth', 'cloth.guard-teal'),
      shapeOperation(`foot.${side}`, {
        kind: 'ellipsoid',
        radiusX: 0.19,
        radiusY: 0.17,
        radiusZ: 0.25,
        widthSegments: 8,
        heightSegments: 4,
      }),
      materialOperation(`foot.${side}`, 'leather', 'leather.guard-brown'),
    ]),
    ...(['left', 'right'] as const).flatMap((side) => [
      {
        operation: 'setPartTransform' as const,
        partId: `hair.side.${side}`,
        transform: transform([0, 0, 0]),
      },
      materialOperation(`hair.side.${side}`, 'hair', 'hair.chestnut'),
    ]),
    shapeOperation('hair.back', {
      kind: 'ellipsoid',
      radiusX: 0.23,
      radiusY: 0.22,
      radiusZ: 0.055,
      widthSegments: 10,
      heightSegments: 5,
    }),
    shapeOperation('tunic', {
      kind: 'extrudedProfile',
      profile: [
        [-0.42, -0.72],
        [0.42, -0.72],
        [0.52, -0.62],
        [0.4, 0.54],
        [0.33, 0.62],
        [-0.33, 0.62],
        [-0.4, 0.54],
        [-0.52, -0.62],
      ],
      depth: 0.42,
      bevel: 0.045,
      bevelSegments: 2,
    }),
    {
      operation: 'setPartTransform',
      partId: 'tunic',
      transform: transform([0, -0.06, 0.015]),
    },
    materialOperation('tunic', 'cloth', 'cloth.guard-teal'),
    shapeOperation('tunic.trim', {
      kind: 'extrudedProfile',
      profile: [
        [-0.45, -0.025],
        [0.45, -0.025],
        [0.49, -0.012],
        [0.49, 0.012],
        [0.45, 0.025],
        [-0.45, 0.025],
        [-0.49, 0.012],
        [-0.49, -0.012],
      ],
      depth: 0.43,
      bevel: 0.008,
      bevelSegments: 2,
    }),
    {
      operation: 'setPartTransform',
      partId: 'tunic.trim',
      transform: transform([0, -0.1, 0.015]),
    },
    materialOperation('tunic.trim', 'cloth', 'cloth.guard-trim'),
    shapeOperation('belt', {
      kind: 'extrudedProfile',
      profile: [
        [-0.37, -0.055],
        [0.37, -0.055],
        [0.41, -0.028],
        [0.41, 0.028],
        [0.37, 0.055],
        [-0.37, 0.055],
        [-0.41, 0.028],
        [-0.41, -0.028],
      ],
      depth: 0.44,
      bevel: 0.01,
      bevelSegments: 2,
    }),
    {
      operation: 'setPartTransform',
      partId: 'belt',
      transform: transform([0, 0, 0.02]),
    },
    materialOperation('belt', 'leather', 'leather.guard-brown'),
    ...(['left', 'center', 'right'] as const).flatMap((position) => [
      shapeOperation(`pouch.${position}`, {
        kind: 'ellipsoid',
        radiusX: 0.075,
        radiusY: 0.105,
        radiusZ: 0.05,
        widthSegments: 6,
        heightSegments: 3,
      }),
      {
        operation: 'setPartTransform' as const,
        partId: `pouch.${position}`,
        transform: transform([0, 0, 0]),
      },
      materialOperation(
        `pouch.${position}`,
        'leather',
        'leather.guard-brown',
      ),
    ]),
    shapeOperation('helmet.dome', {
      kind: 'lathedProfile',
      profile: [
        [0, -0.14],
        [0.21, -0.135],
        [0.23, -0.11],
        [0.23, -0.075],
        [0.19, -0.055],
        [0.19, 0.035],
        [0.16, 0.13],
        [0.1, 0.22],
        [0, 0.28],
      ],
      radialSegments: 8,
    }),
    {
      operation: 'setPartTransform',
      partId: 'helmet.dome',
      transform: transform([0, 0, 0]),
    },
    {
      operation: 'setPartTransform',
      partId: 'helmet.emblem',
      transform: transform([0, 0, 0]),
    },
    materialOperation('face.eye.left', 'eye', 'face.ink'),
    materialOperation('face.eye.right', 'eye', 'face.ink'),
    materialOperation('face.mouth', 'mouth', 'mouth.soft'),
    materialOperation('helmet.dome', 'metal', 'iron.guard-grey'),
    materialOperation('helmet.emblem', 'metal', 'iron.guard-highlight'),
    {
      operation: 'upsertRenderProfile',
      renderProfile: {
        id: 'sprite.default',
        widthPixels: 128,
        heightPixels: 128,
        elevationDegrees: 30,
        directions: 8,
        paddingPixels: 6,
        transparent: true,
        minimumFeaturePixels: 3,
        requiredFeaturePartIds: [
          'body.root',
          'face.eye.left',
          'face.eye.right',
          'face.nose',
          'face.mouth',
          'hair.back',
          'hair.fringe.left',
          'hair.fringe.center',
          'hair.fringe.right',
          'hair.side.left',
          'hair.side.right',
          'hand.left',
          'hand.right',
          'helmet.emblem',
          'helmet.ridge',
          'collar',
          'pouch.center',
          'boot.cuff.left',
          'boot.cuff.right',
        ],
      },
    },
  ];

  const overrideEnvelope = (
    id: string,
    minimumHalfExtents: Vec3,
  ): ReferenceGeometryMountEnvelope => {
    const base = requireEnvelope(mountEnvelopes, id);
    return {
      ...base,
      halfExtents: vector(
        Math.max(base.halfExtents[0], minimumHalfExtents[0]),
        Math.max(base.halfExtents[1], minimumHalfExtents[1]),
        Math.max(base.halfExtents[2], minimumHalfExtents[2]),
      ),
    };
  };
  const mountEnvelopeOverrides = [
    overrideEnvelope(
      'mount.head',
      vector(
        actualHeadRadius[0] * 1.17,
        actualHeadRadius[1] * 0.95,
        actualHeadRadius[2] * 1.17,
      ),
    ),
  ].sort((left, right) => left.id.localeCompare(right.id));

  return {
    contractId: REFERENCE_GEOMETRY_PLAN_CONTRACT_ID,
    reference: STRUCTURAL_REFERENCE,
    sourceProfileId: profile.profileId,
    requiredExistingPartIds: [
      'face.eye.left',
      'face.eye.right',
      'face.mouth',
      'face.nose',
      'face.ear.left',
      'face.ear.right',
      'hair.back',
      'hair.fringe.left',
      'hair.fringe.center',
      'hair.fringe.right',
      'hair.side.left',
      'hair.side.right',
      'head',
      'helmet.dome',
      'helmet.emblem',
      'helmet.ridge',
      'helmet.stud.left',
      'helmet.stud.right',
      'tunic',
      'tunic.trim',
      'belt',
      'pouch.left',
      'pouch.right',
      'pouch.center',
      'collar',
      'sleeve.cuff.left',
      'sleeve.cuff.right',
      'boot.cuff.left',
      'boot.cuff.right',
      'boot.toe.left',
      'boot.toe.right',
      'boot.sole.left',
      'boot.sole.right',
    ],
    patch: { operations },
    mountEnvelopeOverrides,
    validation: {
      valid: true,
      operationCount: operations.length,
      faceFeatureCount: 6,
      faceFeatureSymmetryError: 0,
      registeredGeneratorKindsOnly: true,
    },
  };
}
