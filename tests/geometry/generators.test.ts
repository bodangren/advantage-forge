import { describe, expect, it } from 'vitest';

import {
  ShapeDefinitionSchema,
  type IndexedGeometry,
  type ShapeDefinition,
} from '../../src/contracts/index.js';
import {
  GEOMETRY_LIMITS,
  GeometryParameterError,
  generateGeometry,
  validateIndexedGeometry,
} from '../../src/geometry/index.js';

const representativeShapes: readonly ShapeDefinition[] = [
  { kind: 'box', width: 2, height: 3, depth: 4 },
  { kind: 'beveledBox', width: 2, height: 3, depth: 4, bevel: 0.2 },
  { kind: 'wedge', width: 2, height: 3, depth: 4 },
  { kind: 'prism', radius: 1, height: 2, sides: 6 },
  { kind: 'cylinder', radius: 1, height: 2, radialSegments: 16 },
  { kind: 'cone', radius: 1, height: 2, radialSegments: 16 },
  {
    kind: 'ellipsoid',
    radiusX: 1,
    radiusY: 1.5,
    radiusZ: 0.75,
    widthSegments: 16,
    heightSegments: 8,
  },
  {
    kind: 'capsule',
    radius: 0.5,
    cylinderHeight: 2,
    radialSegments: 16,
    capSegments: 6,
  },
  {
    kind: 'extrudedProfile',
    profile: [
      [-1, -1],
      [1, -1],
      [1.25, 0.5],
      [0, 1.5],
      [-1.25, 0.5],
    ],
    depth: 0.5,
  },
  {
    kind: 'lathedProfile',
    profile: [
      [0, -1],
      [0.75, -0.75],
      [1, 0],
      [0.5, 0.75],
      [0, 1],
    ],
    radialSegments: 16,
  },
  {
    kind: 'tubePath',
    path: [
      [0, -1, 0],
      [0, 0, 0],
      [0.5, 1, 0],
    ],
    radius: 0.2,
    radialSegments: 12,
  },
  { kind: 'flatCard', width: 2, height: 3 },
];

const minimumShapes: readonly ShapeDefinition[] = [
  { kind: 'box', width: 0.001, height: 0.001, depth: 0.001 },
  { kind: 'beveledBox', width: 0.01, height: 0.01, depth: 0.01, bevel: 0.001 },
  { kind: 'wedge', width: 0.001, height: 0.001, depth: 0.001 },
  { kind: 'prism', radius: 0.001, height: 0.001, sides: 3 },
  { kind: 'cylinder', radius: 0.001, height: 0.001, radialSegments: 3 },
  { kind: 'cone', radius: 0.001, height: 0.001, radialSegments: 3 },
  {
    kind: 'ellipsoid',
    radiusX: 0.001,
    radiusY: 0.001,
    radiusZ: 0.001,
    widthSegments: 3,
    heightSegments: 2,
  },
  {
    kind: 'capsule',
    radius: 0.001,
    cylinderHeight: 0.001,
    radialSegments: 3,
    capSegments: 2,
  },
  {
    kind: 'extrudedProfile',
    profile: [
      [0, 0],
      [0.01, 0],
      [0, 0.01],
    ],
    depth: 0.001,
  },
  {
    kind: 'lathedProfile',
    profile: [
      [0, -0.001],
      [0.001, 0],
      [0, 0.001],
    ],
    radialSegments: 3,
  },
  {
    kind: 'tubePath',
    path: [
      [0, 0, 0],
      [0, 0.01, 0],
    ],
    radius: 0.001,
    radialSegments: 3,
  },
  { kind: 'flatCard', width: 0.001, height: 0.001 },
];

const maximumShapes: readonly ShapeDefinition[] = [
  { kind: 'box', width: 1_000, height: 1_000, depth: 1_000 },
  { kind: 'beveledBox', width: 1_000, height: 1_000, depth: 1_000, bevel: 499 },
  { kind: 'wedge', width: 1_000, height: 1_000, depth: 1_000 },
  { kind: 'prism', radius: 1_000, height: 1_000, sides: 128 },
  { kind: 'cylinder', radius: 1_000, height: 1_000, radialSegments: 128 },
  { kind: 'cone', radius: 1_000, height: 1_000, radialSegments: 128 },
  {
    kind: 'ellipsoid',
    radiusX: 1_000,
    radiusY: 1_000,
    radiusZ: 1_000,
    widthSegments: 128,
    heightSegments: 128,
  },
  {
    kind: 'capsule',
    radius: 1_000,
    cylinderHeight: 1_000,
    radialSegments: 128,
    capSegments: 128,
  },
  {
    kind: 'extrudedProfile',
    profile: regularPolygon(256, 1_000),
    depth: 1_000,
  },
  {
    kind: 'lathedProfile',
    profile: Array.from(
      { length: 256 },
      (_, index) =>
        [
          index === 0 || index === 255
            ? 0
            : Math.sin((index / 255) * Math.PI) * 1_000,
          -1_000 + (index / 255) * 2_000,
        ] as const,
    ),
    radialSegments: 128,
  },
  {
    kind: 'tubePath',
    path: Array.from(
      { length: 256 },
      (_, index) => [0, -1_000 + index * 7.8, 0] as const,
    ),
    radius: 1,
    radialSegments: 128,
  },
  { kind: 'flatCard', width: 1_000, height: 1_000 },
];

describe.each([
  ['minimum', minimumShapes],
  ['representative', representativeShapes],
  ['maximum', maximumShapes],
] as const)('%s bounded generator cases', (_label, shapes) => {
  it.each(shapes.map((shape) => [shape.kind, shape] as const))(
    '%s returns valid deterministic indexed geometry',
    (_kind, shape) => {
      const parsed = ShapeDefinitionSchema.parse(shape);
      const first = generateGeometry(parsed);
      const second = generateGeometry(parsed);

      expect(first).toEqual(second);
      expect(validateIndexedGeometry(first)).toEqual([]);
      expect(first.positions.length).toBe(first.normals.length);
      expect(first.positions.length % 3).toBe(0);
      expect(first.indices.length % 3).toBe(0);
      expect(first.metadata.generator).toBe(shape.kind);
      expect(first.metadata.triangleCount).toBe(first.indices.length / 3);
      expect(first.materialGroups).toEqual([
        {
          materialSlot: 'surface',
          indexStart: 0,
          indexCount: first.indices.length,
        },
      ]);
    },
    20_000,
  );
});

describe('geometry topology', () => {
  it.each(representativeShapes.filter((shape) => shape.kind !== 'flatCard'))(
    '$kind has consistently outward closed-mesh winding',
    (shape) => {
      expect(signedVolume(generateGeometry(shape))).toBeGreaterThan(0);
    },
  );

  it('preserves exact documented box bounds', () => {
    expect(
      generateGeometry({ kind: 'box', width: 2, height: 4, depth: 6 }).bounds,
    ).toEqual({
      min: [-1, -2, -3],
      max: [1, 2, 3],
    });
  });

  it('does not call ambient randomness', () => {
    const originalRandom = Math.random;
    Math.random = () => {
      throw new Error('ambient randomness used');
    };
    try {
      for (const shape of representativeShapes) {
        expect(() => generateGeometry(shape)).not.toThrow();
      }
    } finally {
      Math.random = originalRandom;
    }
  });
});

describe('geometry parameter rejection', () => {
  it.each([
    [{ kind: 'box', width: 0, height: 1, depth: 1 }, 'width'],
    [
      { kind: 'cylinder', radius: 1, height: 1, radialSegments: 2 },
      'radialSegments',
    ],
    [
      {
        kind: 'ellipsoid',
        radiusX: 1,
        radiusY: Number.NaN,
        radiusZ: 1,
        widthSegments: 8,
        heightSegments: 4,
      },
      'radiusY',
    ],
    [
      {
        kind: 'capsule',
        radius: 1,
        cylinderHeight: 1,
        radialSegments: 8,
        capSegments: 1,
      },
      'capSegments',
    ],
    [
      {
        kind: 'extrudedProfile',
        profile: [
          [0, 0],
          [1, 0],
          [0.5, 0.5],
          [1, 1],
          [0, 1],
        ],
        depth: 1,
      },
      'profile',
    ],
    [
      {
        kind: 'lathedProfile',
        profile: [
          [1, 1],
          [1, 0],
        ],
        radialSegments: 8,
      },
      'profile[1][1]',
    ],
    [
      {
        kind: 'tubePath',
        path: [
          [0, 0, 0],
          [0, 0, 0],
        ],
        radius: 1,
        radialSegments: 8,
      },
      'path[1]',
    ],
    [
      { kind: 'beveledBox', width: 1, height: 1, depth: 1, bevel: 0.5 },
      'bevel',
    ],
    [{ kind: 'wedge', width: 1, height: Infinity, depth: 1 }, 'height'],
    [{ kind: 'prism', radius: 1, height: 1, sides: 3.5 }, 'sides'],
    [{ kind: 'cone', radius: -1, height: 1, radialSegments: 8 }, 'radius'],
    [
      {
        kind: 'ellipsoid',
        radiusX: 1,
        radiusY: 1,
        radiusZ: 1,
        widthSegments: 8,
        heightSegments: 1,
      },
      'heightSegments',
    ],
    [
      {
        kind: 'extrudedProfile',
        profile: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        depth: 1,
      },
      'profile',
    ],
    [
      {
        kind: 'lathedProfile',
        profile: [
          [-1, 0],
          [1, 1],
        ],
        radialSegments: 8,
      },
      'profile[0][0]',
    ],
    [
      { kind: 'tubePath', path: [[0, 0, 0]], radius: 1, radialSegments: 8 },
      'path',
    ],
    [{ kind: 'flatCard', width: 1, height: 0 }, 'height'],
  ] as const)('rejects invalid %j at %s', (shape, path) => {
    expect(() => generateGeometry(shape as ShapeDefinition)).toThrowError(
      GeometryParameterError,
    );
    try {
      generateGeometry(shape as ShapeDefinition);
    } catch (error: unknown) {
      expect(error).toMatchObject({ code: 'INVALID_GEOMETRY_PARAMETER', path });
    }
  });

  it('normalizes clockwise convex extrusion profiles deterministically', () => {
    const geometry = generateGeometry({
      kind: 'extrudedProfile',
      profile: [
        [0, 1],
        [1, 0],
        [0, 0],
      ],
      depth: 1,
    });
    expect(validateIndexedGeometry(geometry)).toEqual([]);
    expect(signedVolume(geometry)).toBeGreaterThan(0);
  });

  it('publishes the bounded surface rather than an open-ended mesh API', () => {
    expect(GEOMETRY_LIMITS).toEqual({
      minimumDimension: 0.001,
      maximumDimension: 1_000,
      minimumSegments: 3,
      maximumSegments: 128,
      maximumProfilePoints: 256,
      maximumPathPoints: 256,
    });
  });
});

function regularPolygon(count: number, radius: number): [number, number][] {
  return Array.from({ length: count }, (_, index): [number, number] => {
    const angle = (index / count) * Math.PI * 2;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
}

function signedVolume(geometry: IndexedGeometry): number {
  let volume = 0;
  for (let index = 0; index < geometry.indices.length; index += 3) {
    const a = pointAt(geometry, geometry.indices[index] ?? 0);
    const b = pointAt(geometry, geometry.indices[index + 1] ?? 0);
    const c = pointAt(geometry, geometry.indices[index + 2] ?? 0);
    volume +=
      (a[0] * (b[1] * c[2] - b[2] * c[1]) -
        a[1] * (b[0] * c[2] - b[2] * c[0]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
      6;
  }
  return volume;
}

function pointAt(
  geometry: IndexedGeometry,
  index: number,
): readonly [number, number, number] {
  return [
    geometry.positions[index * 3] ?? 0,
    geometry.positions[index * 3 + 1] ?? 0,
    geometry.positions[index * 3 + 2] ?? 0,
  ];
}
