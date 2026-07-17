import type {
  Bounds,
  Quaternion,
  Transform,
  Vec3,
} from '../contracts/index.js';

const EPSILON = 1e-12;

export const IDENTITY_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
};

export function composeTransforms(
  parent: Transform,
  child: Transform,
): Transform {
  const scaledPosition: Vec3 = [
    child.position[0] * parent.scale[0],
    child.position[1] * parent.scale[1],
    child.position[2] * parent.scale[2],
  ];
  const rotatedPosition = rotateVector(parent.rotation, scaledPosition);
  return canonicalTransform({
    position: [
      parent.position[0] + rotatedPosition[0],
      parent.position[1] + rotatedPosition[1],
      parent.position[2] + rotatedPosition[2],
    ],
    rotation: multiplyQuaternions(parent.rotation, child.rotation),
    scale: [
      parent.scale[0] * child.scale[0],
      parent.scale[1] * child.scale[1],
      parent.scale[2] * child.scale[2],
    ],
  });
}

export function invertTransform(transform: Transform): Transform {
  const inverseRotation = conjugateQuaternion(
    normalizeQuaternion(transform.rotation),
  );
  const inverseScale: Vec3 = transform.scale.map((value) => {
    if (Math.abs(value) <= EPSILON) {
      throw new RangeError('Transform scale components must be non-zero.');
    }
    return 1 / value;
  }) as Vec3;
  const rotatedPosition = rotateVector(inverseRotation, [
    -transform.position[0],
    -transform.position[1],
    -transform.position[2],
  ]);
  return canonicalTransform({
    position: [
      rotatedPosition[0] * inverseScale[0],
      rotatedPosition[1] * inverseScale[1],
      rotatedPosition[2] * inverseScale[2],
    ],
    rotation: inverseRotation,
    scale: inverseScale,
  });
}

export function multiplyQuaternions(a: Quaternion, b: Quaternion): Quaternion {
  return normalizeQuaternion([
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ]);
}

export function quaternionFromAxisAngle(
  axis: Vec3,
  degrees: number,
): Quaternion {
  const axisLength = Math.hypot(...axis);
  if (!Number.isFinite(degrees) || axisLength <= EPSILON) {
    throw new RangeError(
      'Axis-angle rotations require a finite angle and non-zero axis.',
    );
  }
  const halfAngle = (degrees * Math.PI) / 360;
  const scale = Math.sin(halfAngle) / axisLength;
  return normalizeQuaternion([
    axis[0] * scale,
    axis[1] * scale,
    axis[2] * scale,
    Math.cos(halfAngle),
  ]);
}

export function rotateVector(rotation: Quaternion, vector: Vec3): Vec3 {
  const [x, y, z, w] = normalizeQuaternion(rotation);
  const tx = 2 * (y * vector[2] - z * vector[1]);
  const ty = 2 * (z * vector[0] - x * vector[2]);
  const tz = 2 * (x * vector[1] - y * vector[0]);
  return [
    canonicalNumber(vector[0] + w * tx + (y * tz - z * ty)),
    canonicalNumber(vector[1] + w * ty + (z * tx - x * tz)),
    canonicalNumber(vector[2] + w * tz + (x * ty - y * tx)),
  ];
}

export function mirrorTransform(
  transform: Transform,
  axis: 'x' | 'y' | 'z',
): Transform {
  const position: [number, number, number] = [...transform.position];
  switch (axis) {
    case 'x':
      position[0] *= -1;
      break;
    case 'y':
      position[1] *= -1;
      break;
    case 'z':
      position[2] *= -1;
      break;
  }
  const [x, y, z, w] = transform.rotation;
  const rotationByAxis: Record<'x' | 'y' | 'z', Quaternion> = {
    x: [x, -y, -z, w],
    y: [-x, y, -z, w],
    z: [-x, -y, z, w],
  };
  return canonicalTransform({
    ...transform,
    position,
    rotation: rotationByAxis[axis],
  });
}

export function transformBounds(bounds: Bounds, transform: Transform): Bounds {
  const corners: Vec3[] = [];
  for (const x of [bounds.min[0], bounds.max[0]]) {
    for (const y of [bounds.min[1], bounds.max[1]]) {
      for (const z of [bounds.min[2], bounds.max[2]]) {
        const rotated = rotateVector(transform.rotation, [
          x * transform.scale[0],
          y * transform.scale[1],
          z * transform.scale[2],
        ]);
        corners.push([
          transform.position[0] + rotated[0],
          transform.position[1] + rotated[1],
          transform.position[2] + rotated[2],
        ]);
      }
    }
  }
  return unionBounds(corners.map((corner) => ({ min: corner, max: corner })));
}

export function unionBounds(bounds: readonly Bounds[]): Bounds {
  if (bounds.length === 0) {
    return { min: [0, 0, 0], max: [0, 0, 0] };
  }
  const minimum: [number, number, number] = [Infinity, Infinity, Infinity];
  const maximum: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const bound of bounds) {
    for (const axis of [0, 1, 2] as const) {
      minimum[axis] = Math.min(minimum[axis], bound.min[axis]);
      maximum[axis] = Math.max(maximum[axis], bound.max[axis]);
    }
  }
  return {
    min: minimum.map(canonicalNumber) as Vec3,
    max: maximum.map(canonicalNumber) as Vec3,
  };
}

export function canonicalTransform(transform: Transform): Transform {
  return {
    position: transform.position.map(canonicalNumber) as Vec3,
    rotation: normalizeQuaternion(transform.rotation).map(
      canonicalNumber,
    ) as Quaternion,
    scale: transform.scale.map(canonicalNumber) as Vec3,
  };
}

export function canonicalNumber(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      'Compiled transforms must contain only finite numbers.',
    );
  }
  const rounded = Number(value.toFixed(12));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function normalizeQuaternion(rotation: Quaternion): Quaternion {
  const length = Math.hypot(...rotation);
  if (!Number.isFinite(length) || length <= EPSILON) {
    throw new RangeError('Quaternion must be finite and non-zero.');
  }
  const normalized = rotation.map((value) => value / length) as Quaternion;
  // q and -q represent the same orientation; canonicalize to one stable representation.
  return normalized[3] < 0
    ? (normalized.map((value) => -value) as Quaternion)
    : normalized;
}

function conjugateQuaternion(rotation: Quaternion): Quaternion {
  return [-rotation[0], -rotation[1], -rotation[2], rotation[3]];
}
