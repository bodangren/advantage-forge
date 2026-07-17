import type {
  Bounds,
  GeometryMaterialGroup,
  IndexedGeometry,
  ShapeDefinition,
  Vec3,
} from '../contracts/index.js';

const EPSILON = 1e-9;

export interface GeometryValidationIssue {
  readonly code:
    | 'NON_FINITE_POSITION'
    | 'NON_FINITE_NORMAL'
    | 'INVALID_INDEX'
    | 'DEGENERATE_TRIANGLE'
    | 'INVALID_NORMAL'
    | 'INVALID_BOUNDS';
  readonly path: string;
  readonly message: string;
}

export class GeometryParameterError extends RangeError {
  public readonly code = 'INVALID_GEOMETRY_PARAMETER';

  public constructor(
    public readonly path: string,
    public readonly expected: string,
    public readonly actual: unknown,
  ) {
    super(`${path} must be ${expected}; received ${String(actual)}`);
    this.name = 'GeometryParameterError';
  }
}

export function assertFiniteInRange(
  value: number,
  path: string,
  minimum: number,
  maximum: number,
): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new GeometryParameterError(
      path,
      `between ${minimum} and ${maximum}`,
      value,
    );
  }
}

export function assertIntegerInRange(
  value: number,
  path: string,
  minimum: number,
  maximum: number,
): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new GeometryParameterError(
      path,
      `an integer between ${minimum} and ${maximum}`,
      value,
    );
  }
}

export function calculateBounds(positions: readonly number[]): Bounds {
  if (positions.length === 0 || positions.length % 3 !== 0) {
    throw new GeometryParameterError(
      'positions',
      'a non-empty xyz array',
      positions.length,
    );
  }

  const minimum: [number, number, number] = [Infinity, Infinity, Infinity];
  const maximum: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < positions.length; index += 3) {
    for (const axis of [0, 1, 2] as const) {
      const value = positions[index + axis];
      if (value === undefined || !Number.isFinite(value)) {
        throw new GeometryParameterError(
          `positions[${index + axis}]`,
          'finite',
          value,
        );
      }
      minimum[axis] = Math.min(minimum[axis], value);
      maximum[axis] = Math.max(maximum[axis], value);
    }
  }

  return { min: minimum, max: maximum };
}

export function calculateVertexNormals(
  positions: readonly number[],
  indices: readonly number[],
): number[] {
  const normals = Array.from({ length: positions.length }, () => 0);

  for (let index = 0; index < indices.length; index += 3) {
    const ia = indices[index];
    const ib = indices[index + 1];
    const ic = indices[index + 2];
    if (ia === undefined || ib === undefined || ic === undefined) {
      continue;
    }

    const ax = positions[ia * 3] ?? 0;
    const ay = positions[ia * 3 + 1] ?? 0;
    const az = positions[ia * 3 + 2] ?? 0;
    const abx = (positions[ib * 3] ?? 0) - ax;
    const aby = (positions[ib * 3 + 1] ?? 0) - ay;
    const abz = (positions[ib * 3 + 2] ?? 0) - az;
    const acx = (positions[ic * 3] ?? 0) - ax;
    const acy = (positions[ic * 3 + 1] ?? 0) - ay;
    const acz = (positions[ic * 3 + 2] ?? 0) - az;
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    for (const vertexIndex of [ia, ib, ic]) {
      normals[vertexIndex * 3] = (normals[vertexIndex * 3] ?? 0) + nx;
      normals[vertexIndex * 3 + 1] = (normals[vertexIndex * 3 + 1] ?? 0) + ny;
      normals[vertexIndex * 3 + 2] = (normals[vertexIndex * 3 + 2] ?? 0) + nz;
    }
  }

  for (let index = 0; index < normals.length; index += 3) {
    const x = normals[index] ?? 0;
    const y = normals[index + 1] ?? 0;
    const z = normals[index + 2] ?? 0;
    const length = Math.hypot(x, y, z);
    if (length > EPSILON) {
      normals[index] = x / length;
      normals[index + 1] = y / length;
      normals[index + 2] = z / length;
    }
  }

  return normals;
}

export function validateIndexedGeometry(
  geometry: IndexedGeometry,
): readonly GeometryValidationIssue[] {
  const issues: GeometryValidationIssue[] = [];
  const vertexCount = geometry.positions.length / 3;

  geometry.positions.forEach((value, index) => {
    if (!Number.isFinite(value)) {
      issues.push({
        code: 'NON_FINITE_POSITION',
        path: `positions[${index}]`,
        message: 'Position components must be finite.',
      });
    }
  });
  geometry.normals.forEach((value, index) => {
    if (!Number.isFinite(value)) {
      issues.push({
        code: 'NON_FINITE_NORMAL',
        path: `normals[${index}]`,
        message: 'Normal components must be finite.',
      });
    }
  });

  geometry.indices.forEach((value, index) => {
    if (!Number.isInteger(value) || value < 0 || value >= vertexCount) {
      issues.push({
        code: 'INVALID_INDEX',
        path: `indices[${index}]`,
        message: `Index must address one of ${vertexCount} vertices.`,
      });
    }
  });

  for (let index = 0; index < geometry.indices.length; index += 3) {
    const ia = geometry.indices[index];
    const ib = geometry.indices[index + 1];
    const ic = geometry.indices[index + 2];
    if (ia === undefined || ib === undefined || ic === undefined) {
      issues.push({
        code: 'INVALID_INDEX',
        path: `indices[${index}]`,
        message: 'Index length must be divisible by three.',
      });
      continue;
    }
    const a = readVec3(geometry.positions, ia);
    const b = readVec3(geometry.positions, ib);
    const c = readVec3(geometry.positions, ic);
    const cross = cross3(subtract3(b, a), subtract3(c, a));
    if (length3(cross) <= EPSILON) {
      issues.push({
        code: 'DEGENERATE_TRIANGLE',
        path: `indices[${index}]`,
        message: 'Triangle area must be non-zero.',
      });
    }
  }

  for (let index = 0; index < geometry.normals.length; index += 3) {
    const length = Math.hypot(
      geometry.normals[index] ?? 0,
      geometry.normals[index + 1] ?? 0,
      geometry.normals[index + 2] ?? 0,
    );
    if (Math.abs(length - 1) > 1e-6) {
      issues.push({
        code: 'INVALID_NORMAL',
        path: `normals[${index / 3}]`,
        message: 'Every referenced vertex normal must have unit length.',
      });
    }
  }

  const calculatedBounds = calculateBounds(geometry.positions);
  if (
    calculatedBounds.min.some(
      (value, index) => value !== geometry.bounds.min[index],
    ) ||
    calculatedBounds.max.some(
      (value, index) => value !== geometry.bounds.max[index],
    )
  ) {
    issues.push({
      code: 'INVALID_BOUNDS',
      path: 'bounds',
      message: 'Declared bounds must exactly match indexed positions.',
    });
  }

  return issues;
}

interface MeshOptions {
  readonly flatShading?: boolean;
  readonly materialSlot?: string;
}

export function meshFromPolygons(
  generator: ShapeDefinition['kind'],
  vertices: readonly Vec3[],
  polygons: readonly (readonly number[])[],
  options: MeshOptions = {},
): IndexedGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  if (options.flatShading === true) {
    for (const polygon of polygons) {
      const baseIndex = positions.length / 3;
      for (const vertexIndex of polygon) {
        const vertex = vertices[vertexIndex];
        if (vertex === undefined) {
          throw new GeometryParameterError(
            'polygons',
            'valid vertex indices',
            vertexIndex,
          );
        }
        positions.push(...vertex);
      }
      for (let offset = 1; offset < polygon.length - 1; offset += 1) {
        indices.push(baseIndex, baseIndex + offset, baseIndex + offset + 1);
      }
    }
  } else {
    for (const vertex of vertices) {
      positions.push(...vertex);
    }
    for (const polygon of polygons) {
      for (let offset = 1; offset < polygon.length - 1; offset += 1) {
        const first = polygon[0];
        const second = polygon[offset];
        const third = polygon[offset + 1];
        if (
          first === undefined ||
          second === undefined ||
          third === undefined
        ) {
          throw new GeometryParameterError(
            'polygons',
            'faces of at least three vertices',
            polygon,
          );
        }
        indices.push(first, second, third);
      }
    }
  }

  const normals = calculateVertexNormals(positions, indices);
  const materialGroups: GeometryMaterialGroup[] = [
    {
      materialSlot: options.materialSlot ?? 'surface',
      indexStart: 0,
      indexCount: indices.length,
    },
  ];

  return {
    positions,
    normals,
    indices,
    bounds: calculateBounds(positions),
    materialGroups,
    metadata: { generator, triangleCount: indices.length / 3 },
  };
}

export function orientPolygonOutward(
  vertices: readonly Vec3[],
  polygon: readonly number[],
): readonly number[] {
  if (polygon.length < 3) {
    throw new GeometryParameterError(
      'polygon',
      'at least three vertices',
      polygon.length,
    );
  }
  const a = vertices[polygon[0] ?? -1];
  const b = vertices[polygon[1] ?? -1];
  const c = vertices[polygon[2] ?? -1];
  if (a === undefined || b === undefined || c === undefined) {
    throw new GeometryParameterError(
      'polygon',
      'valid vertex indices',
      polygon,
    );
  }
  const normal = cross3(subtract3(b, a), subtract3(c, a));
  const center = polygon
    .reduce<Vec3>(
      (sum, index) => add3(sum, vertices[index] ?? [0, 0, 0]),
      [0, 0, 0],
    )
    .map((value) => value / polygon.length) as Vec3;
  return dot3(normal, center) < 0 ? [...polygon].reverse() : [...polygon];
}

export function add3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function subtract3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale3(value: Vec3, scale: number): Vec3 {
  return [value[0] * scale, value[1] * scale, value[2] * scale];
}

export function dot3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function length3(value: Vec3): number {
  return Math.hypot(...value);
}

export function normalize3(value: Vec3): Vec3 {
  const length = length3(value);
  if (length <= EPSILON) {
    throw new GeometryParameterError('vector', 'non-zero length', value);
  }
  return scale3(value, 1 / length);
}

function readVec3(values: readonly number[], index: number): Vec3 {
  return [
    values[index * 3] ?? 0,
    values[index * 3 + 1] ?? 0,
    values[index * 3 + 2] ?? 0,
  ];
}
