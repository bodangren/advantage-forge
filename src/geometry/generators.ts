import type {
  IndexedGeometry,
  ShapeDefinition,
  Vec2,
  Vec3,
} from '../contracts/index.js';

import {
  GeometryParameterError,
  add3,
  assertFiniteInRange,
  assertIntegerInRange,
  cross3,
  dot3,
  meshFromPolygons,
  normalize3,
  orientPolygonOutward,
  scale3,
  subtract3,
} from './mesh.js';

export const GEOMETRY_LIMITS = {
  minimumDimension: 0.001,
  maximumDimension: 1_000,
  minimumSegments: 3,
  maximumSegments: 128,
  maximumProfilePoints: 256,
  maximumPathPoints: 256,
} as const;

type ShapeByKind<Kind extends ShapeDefinition['kind']> = Extract<
  ShapeDefinition,
  { readonly kind: Kind }
>;

/** Compiles one closed, validated shape definition into engine-neutral indexed geometry. */
export function generateGeometry(shape: ShapeDefinition): IndexedGeometry {
  switch (shape.kind) {
    case 'box':
      return generateBox(shape);
    case 'beveledBox':
      return generateBeveledBox(shape);
    case 'wedge':
      return generateWedge(shape);
    case 'prism':
      return generatePrism(shape);
    case 'cylinder':
      return generateCylinder(shape);
    case 'cone':
      return generateCone(shape);
    case 'ellipsoid':
      return generateEllipsoid(shape);
    case 'capsule':
      return generateCapsule(shape);
    case 'extrudedProfile':
      return generateExtrudedProfile(shape);
    case 'lathedProfile':
      return generateLathedProfile(shape);
    case 'tubePath':
      return generateTubePath(shape);
    case 'flatCard':
      return generateFlatCard(shape);
  }
}

export function generateBox(shape: ShapeByKind<'box'>): IndexedGeometry {
  validateDimensions(shape);
  const vertices = cuboidVertices(shape.width, shape.height, shape.depth);
  return meshFromPolygons('box', vertices, cuboidPolygons(), {
    flatShading: true,
  });
}

export function generateBeveledBox(
  shape: ShapeByKind<'beveledBox'>,
): IndexedGeometry {
  validateDimensions(shape);
  assertFiniteInRange(
    shape.bevel,
    'bevel',
    GEOMETRY_LIMITS.minimumDimension,
    Math.min(shape.width, shape.height, shape.depth) / 2 - Number.EPSILON,
  );

  const half: Vec3 = [shape.width / 2, shape.height / 2, shape.depth / 2];
  const inset: Vec3 = half.map((value) => value - shape.bevel) as Vec3;
  const vertices: Vec3[] = [];
  const polygons: number[][] = [];
  const vertexIndex = (vertex: Vec3): number => {
    const index = vertices.length;
    vertices.push(vertex);
    return index;
  };
  const addFace = (face: readonly Vec3[]): void => {
    const indices = face.map(vertexIndex);
    polygons.push([...orientPolygonOutward(vertices, indices)]);
  };

  for (const axis of [0, 1, 2] as const) {
    const otherAxes = remainingAxes(axis);
    for (const sign of [-1, 1] as const) {
      const face: Vec3[] = [];
      for (const firstSign of [-1, 1] as const) {
        for (const secondSign of [-1, 1] as const) {
          const point: [number, number, number] = [0, 0, 0];
          point[axis] = sign * half[axis];
          point[otherAxes[0]] = firstSign * inset[otherAxes[0]];
          point[otherAxes[1]] = secondSign * inset[otherAxes[1]];
          face.push(point);
        }
      }
      addFace([
        face[0] ?? [0, 0, 0],
        face[1] ?? [0, 0, 0],
        face[3] ?? [0, 0, 0],
        face[2] ?? [0, 0, 0],
      ]);
    }
  }

  for (const edgeAxis of [0, 1, 2] as const) {
    const fixedAxes = remainingAxes(edgeAxis);
    for (const firstSign of [-1, 1] as const) {
      for (const secondSign of [-1, 1] as const) {
        const face: Vec3[] = [];
        for (const edgeSign of [-1, 1] as const) {
          const onFirst: [number, number, number] = [0, 0, 0];
          onFirst[edgeAxis] = edgeSign * inset[edgeAxis];
          onFirst[fixedAxes[0]] = firstSign * half[fixedAxes[0]];
          onFirst[fixedAxes[1]] = secondSign * inset[fixedAxes[1]];
          const onSecond: [number, number, number] = [...onFirst];
          onSecond[fixedAxes[0]] = firstSign * inset[fixedAxes[0]];
          onSecond[fixedAxes[1]] = secondSign * half[fixedAxes[1]];
          face.push(onFirst, onSecond);
        }
        addFace([
          face[0] ?? [0, 0, 0],
          face[1] ?? [0, 0, 0],
          face[3] ?? [0, 0, 0],
          face[2] ?? [0, 0, 0],
        ]);
      }
    }
  }

  for (const xSign of [-1, 1] as const) {
    for (const ySign of [-1, 1] as const) {
      for (const zSign of [-1, 1] as const) {
        addFace([
          [xSign * half[0], ySign * inset[1], zSign * inset[2]],
          [xSign * inset[0], ySign * half[1], zSign * inset[2]],
          [xSign * inset[0], ySign * inset[1], zSign * half[2]],
        ]);
      }
    }
  }

  return meshFromPolygons('beveledBox', vertices, polygons, {
    flatShading: true,
  });
}

export function generateWedge(shape: ShapeByKind<'wedge'>): IndexedGeometry {
  validateDimensions(shape);
  const halfWidth = shape.width / 2;
  const halfHeight = shape.height / 2;
  const halfDepth = shape.depth / 2;
  const vertices: readonly Vec3[] = [
    [-halfWidth, -halfHeight, -halfDepth],
    [halfWidth, -halfHeight, -halfDepth],
    [-halfWidth, halfHeight, -halfDepth],
    [halfWidth, halfHeight, -halfDepth],
    [-halfWidth, -halfHeight, halfDepth],
    [halfWidth, -halfHeight, halfDepth],
  ];
  const polygons = [
    [0, 1, 3, 2],
    [0, 4, 5, 1],
    [0, 2, 4],
    [1, 5, 3],
    [2, 3, 5, 4],
  ].map((polygon) => orientPolygonOutward(vertices, polygon));
  return meshFromPolygons('wedge', vertices, polygons, { flatShading: true });
}

export function generatePrism(shape: ShapeByKind<'prism'>): IndexedGeometry {
  validateRadiusHeightSegments(
    shape.radius,
    shape.height,
    shape.sides,
    'sides',
  );
  return generateRadialPrism('prism', shape.radius, shape.height, shape.sides);
}

export function generateCylinder(
  shape: ShapeByKind<'cylinder'>,
): IndexedGeometry {
  validateRadiusHeightSegments(
    shape.radius,
    shape.height,
    shape.radialSegments,
    'radialSegments',
  );
  return generateRadialPrism(
    'cylinder',
    shape.radius,
    shape.height,
    shape.radialSegments,
  );
}

export function generateCone(shape: ShapeByKind<'cone'>): IndexedGeometry {
  validateRadiusHeightSegments(
    shape.radius,
    shape.height,
    shape.radialSegments,
    'radialSegments',
  );
  const vertices: Vec3[] = [];
  const halfHeight = shape.height / 2;
  for (let segment = 0; segment < shape.radialSegments; segment += 1) {
    const angle = (segment / shape.radialSegments) * Math.PI * 2;
    vertices.push([
      shape.radius * Math.cos(angle),
      -halfHeight,
      shape.radius * Math.sin(angle),
    ]);
  }
  const apexIndex = vertices.push([0, halfHeight, 0]) - 1;
  const polygons: number[][] = [
    [
      ...Array.from({ length: shape.radialSegments }, (_, index) => index),
    ].reverse(),
  ];
  for (let segment = 0; segment < shape.radialSegments; segment += 1) {
    polygons.push([segment, (segment + 1) % shape.radialSegments, apexIndex]);
  }
  return meshFromPolygons(
    'cone',
    vertices,
    polygons.map((polygon) => [...polygon].reverse()),
  );
}

export function generateEllipsoid(
  shape: ShapeByKind<'ellipsoid'>,
): IndexedGeometry {
  for (const [path, value] of [
    ['radiusX', shape.radiusX],
    ['radiusY', shape.radiusY],
    ['radiusZ', shape.radiusZ],
  ] as const) {
    assertFiniteInRange(
      value,
      path,
      GEOMETRY_LIMITS.minimumDimension,
      GEOMETRY_LIMITS.maximumDimension,
    );
  }
  assertIntegerInRange(
    shape.widthSegments,
    'widthSegments',
    GEOMETRY_LIMITS.minimumSegments,
    GEOMETRY_LIMITS.maximumSegments,
  );
  assertIntegerInRange(
    shape.heightSegments,
    'heightSegments',
    2,
    GEOMETRY_LIMITS.maximumSegments,
  );

  const vertices: Vec3[] = [[0, -shape.radiusY, 0]];
  const polygons: number[][] = [];
  const ringStarts: number[] = [];
  for (let latitude = 1; latitude < shape.heightSegments; latitude += 1) {
    const phi = -Math.PI / 2 + (latitude / shape.heightSegments) * Math.PI;
    ringStarts.push(vertices.length);
    for (let longitude = 0; longitude < shape.widthSegments; longitude += 1) {
      const theta = (longitude / shape.widthSegments) * Math.PI * 2;
      vertices.push([
        shape.radiusX * Math.cos(phi) * Math.cos(theta),
        shape.radiusY * Math.sin(phi),
        shape.radiusZ * Math.cos(phi) * Math.sin(theta),
      ]);
    }
  }
  const topIndex = vertices.push([0, shape.radiusY, 0]) - 1;
  const firstRing = ringStarts[0] ?? 1;
  for (let segment = 0; segment < shape.widthSegments; segment += 1) {
    polygons.push([
      0,
      firstRing + ((segment + 1) % shape.widthSegments),
      firstRing + segment,
    ]);
  }
  for (let ring = 0; ring < ringStarts.length - 1; ring += 1) {
    const lower = ringStarts[ring] ?? 0;
    const upper = ringStarts[ring + 1] ?? 0;
    for (let segment = 0; segment < shape.widthSegments; segment += 1) {
      const next = (segment + 1) % shape.widthSegments;
      polygons.push([
        lower + segment,
        lower + next,
        upper + next,
        upper + segment,
      ]);
    }
  }
  const lastRing = ringStarts.at(-1) ?? 1;
  for (let segment = 0; segment < shape.widthSegments; segment += 1) {
    polygons.push([
      lastRing + segment,
      lastRing + ((segment + 1) % shape.widthSegments),
      topIndex,
    ]);
  }
  return meshFromPolygons(
    'ellipsoid',
    vertices,
    polygons.map((polygon) => [...polygon].reverse()),
  );
}

export function generateCapsule(
  shape: ShapeByKind<'capsule'>,
): IndexedGeometry {
  assertFiniteInRange(
    shape.radius,
    'radius',
    GEOMETRY_LIMITS.minimumDimension,
    GEOMETRY_LIMITS.maximumDimension,
  );
  assertFiniteInRange(
    shape.cylinderHeight,
    'cylinderHeight',
    GEOMETRY_LIMITS.minimumDimension,
    GEOMETRY_LIMITS.maximumDimension,
  );
  assertIntegerInRange(
    shape.radialSegments,
    'radialSegments',
    GEOMETRY_LIMITS.minimumSegments,
    GEOMETRY_LIMITS.maximumSegments,
  );
  assertIntegerInRange(
    shape.capSegments,
    'capSegments',
    2,
    GEOMETRY_LIMITS.maximumSegments,
  );

  const rings: Array<{ readonly y: number; readonly radius: number }> = [];
  for (let index = 1; index <= shape.capSegments; index += 1) {
    const angle = -Math.PI / 2 + (index / shape.capSegments) * (Math.PI / 2);
    rings.push({
      y: -shape.cylinderHeight / 2 + Math.sin(angle) * shape.radius,
      radius: Math.cos(angle) * shape.radius,
    });
  }
  rings.push({ y: shape.cylinderHeight / 2, radius: shape.radius });
  for (let index = 1; index < shape.capSegments; index += 1) {
    const angle = (index / shape.capSegments) * (Math.PI / 2);
    rings.push({
      y: shape.cylinderHeight / 2 + Math.sin(angle) * shape.radius,
      radius: Math.cos(angle) * shape.radius,
    });
  }

  return generateRingSolid(
    'capsule',
    [0, -shape.cylinderHeight / 2 - shape.radius, 0],
    [0, shape.cylinderHeight / 2 + shape.radius, 0],
    rings,
    shape.radialSegments,
  );
}

export function generateExtrudedProfile(
  shape: ShapeByKind<'extrudedProfile'>,
): IndexedGeometry {
  validateProfile(shape.profile, 3, true);
  assertFiniteInRange(
    shape.depth,
    'depth',
    GEOMETRY_LIMITS.minimumDimension,
    GEOMETRY_LIMITS.maximumDimension,
  );
  const profile =
    signedArea(shape.profile) < 0
      ? [...shape.profile].reverse()
      : [...shape.profile];
  const halfDepth = shape.depth / 2;
  const vertices: Vec3[] = [
    ...profile.map<Vec3>((point) => [point[0], point[1], -halfDepth]),
    ...profile.map<Vec3>((point) => [point[0], point[1], halfDepth]),
  ];
  const count = profile.length;
  const polygons: number[][] = [
    [...Array.from({ length: count }, (_, index) => index)].reverse(),
    Array.from({ length: count }, (_, index) => count + index),
  ];
  for (let index = 0; index < count; index += 1) {
    const next = (index + 1) % count;
    polygons.push([index, next, count + next, count + index]);
  }
  return meshFromPolygons('extrudedProfile', vertices, polygons, {
    flatShading: true,
  });
}

export function generateLathedProfile(
  shape: ShapeByKind<'lathedProfile'>,
): IndexedGeometry {
  validateProfile(shape.profile, 2, false);
  assertIntegerInRange(
    shape.radialSegments,
    'radialSegments',
    GEOMETRY_LIMITS.minimumSegments,
    GEOMETRY_LIMITS.maximumSegments,
  );
  for (let index = 0; index < shape.profile.length; index += 1) {
    const point = shape.profile[index];
    if (point === undefined) {
      continue;
    }
    assertFiniteInRange(
      point[0],
      `profile[${index}][0]`,
      0,
      GEOMETRY_LIMITS.maximumDimension,
    );
    if (index > 0 && point[1] <= (shape.profile[index - 1]?.[1] ?? -Infinity)) {
      throw new GeometryParameterError(
        `profile[${index}][1]`,
        'strictly increasing',
        point[1],
      );
    }
  }

  const vertices: Vec3[] = [];
  const rows: Array<{ readonly start: number; readonly radius: number }> = [];
  for (const [radius, y] of shape.profile) {
    const start = vertices.length;
    if (radius === 0) {
      vertices.push([0, y, 0]);
    } else {
      for (let segment = 0; segment < shape.radialSegments; segment += 1) {
        const angle = (segment / shape.radialSegments) * Math.PI * 2;
        vertices.push([radius * Math.cos(angle), y, radius * Math.sin(angle)]);
      }
    }
    rows.push({ start, radius });
  }

  const polygons: number[][] = [];
  for (let rowIndex = 0; rowIndex < rows.length - 1; rowIndex += 1) {
    const lower = rows[rowIndex];
    const upper = rows[rowIndex + 1];
    if (lower === undefined || upper === undefined) {
      continue;
    }
    for (let segment = 0; segment < shape.radialSegments; segment += 1) {
      const next = (segment + 1) % shape.radialSegments;
      if (lower.radius === 0 && upper.radius > 0) {
        polygons.push([lower.start, upper.start + segment, upper.start + next]);
      } else if (lower.radius > 0 && upper.radius === 0) {
        polygons.push([lower.start + segment, upper.start, lower.start + next]);
      } else if (lower.radius > 0 && upper.radius > 0) {
        polygons.push([
          lower.start + segment,
          upper.start + segment,
          upper.start + next,
          lower.start + next,
        ]);
      }
    }
  }
  return meshFromPolygons('lathedProfile', vertices, polygons);
}

export function generateTubePath(
  shape: ShapeByKind<'tubePath'>,
): IndexedGeometry {
  if (
    shape.path.length < 2 ||
    shape.path.length > GEOMETRY_LIMITS.maximumPathPoints
  ) {
    throw new GeometryParameterError(
      'path',
      `between 2 and ${GEOMETRY_LIMITS.maximumPathPoints} points`,
      shape.path.length,
    );
  }
  assertFiniteInRange(
    shape.radius,
    'radius',
    GEOMETRY_LIMITS.minimumDimension,
    GEOMETRY_LIMITS.maximumDimension,
  );
  assertIntegerInRange(
    shape.radialSegments,
    'radialSegments',
    GEOMETRY_LIMITS.minimumSegments,
    GEOMETRY_LIMITS.maximumSegments,
  );
  shape.path.forEach((point, pointIndex) => {
    point.forEach((value, axis) =>
      assertFiniteInRange(
        value,
        `path[${pointIndex}][${axis}]`,
        -GEOMETRY_LIMITS.maximumDimension,
        GEOMETRY_LIMITS.maximumDimension,
      ),
    );
    if (
      pointIndex > 0 &&
      distance3(point, shape.path[pointIndex - 1] ?? point) <= 1e-9
    ) {
      throw new GeometryParameterError(
        `path[${pointIndex}]`,
        'different from the prior point',
        point,
      );
    }
  });

  const vertices: Vec3[] = [];
  const frames: Array<{ readonly normal: Vec3; readonly binormal: Vec3 }> = [];
  for (let index = 0; index < shape.path.length; index += 1) {
    const previous = shape.path[Math.max(0, index - 1)] ?? [0, 0, 0];
    const next = shape.path[Math.min(shape.path.length - 1, index + 1)] ?? [
      0, 0, 0,
    ];
    const tangent = normalize3(subtract3(next, previous));
    const reference: Vec3 =
      Math.abs(dot3(tangent, [0, 1, 0])) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let normal = normalize3(cross3(reference, tangent));
    const priorNormal = frames.at(-1)?.normal;
    if (priorNormal !== undefined && dot3(normal, priorNormal) < 0) {
      normal = scale3(normal, -1);
    }
    frames.push({ normal, binormal: normalize3(cross3(tangent, normal)) });
  }
  for (let pathIndex = 0; pathIndex < shape.path.length; pathIndex += 1) {
    const point = shape.path[pathIndex] ?? [0, 0, 0];
    const frame = frames[pathIndex];
    if (frame === undefined) {
      continue;
    }
    for (let segment = 0; segment < shape.radialSegments; segment += 1) {
      const angle = (segment / shape.radialSegments) * Math.PI * 2;
      vertices.push(
        add3(
          point,
          add3(
            scale3(frame.normal, Math.cos(angle) * shape.radius),
            scale3(frame.binormal, Math.sin(angle) * shape.radius),
          ),
        ),
      );
    }
  }
  const polygons: number[][] = [];
  for (let pathIndex = 0; pathIndex < shape.path.length - 1; pathIndex += 1) {
    const current = pathIndex * shape.radialSegments;
    const nextPath = (pathIndex + 1) * shape.radialSegments;
    for (let segment = 0; segment < shape.radialSegments; segment += 1) {
      const nextSegment = (segment + 1) % shape.radialSegments;
      polygons.push([
        current + segment,
        current + nextSegment,
        nextPath + nextSegment,
        nextPath + segment,
      ]);
    }
  }
  polygons.push(
    [
      ...Array.from({ length: shape.radialSegments }, (_, index) => index),
    ].reverse(),
  );
  const lastRing = (shape.path.length - 1) * shape.radialSegments;
  polygons.push(
    Array.from(
      { length: shape.radialSegments },
      (_, index) => lastRing + index,
    ),
  );
  return meshFromPolygons('tubePath', vertices, polygons);
}

export function generateFlatCard(
  shape: ShapeByKind<'flatCard'>,
): IndexedGeometry {
  assertFiniteInRange(
    shape.width,
    'width',
    GEOMETRY_LIMITS.minimumDimension,
    GEOMETRY_LIMITS.maximumDimension,
  );
  assertFiniteInRange(
    shape.height,
    'height',
    GEOMETRY_LIMITS.minimumDimension,
    GEOMETRY_LIMITS.maximumDimension,
  );
  const halfWidth = shape.width / 2;
  const halfHeight = shape.height / 2;
  return meshFromPolygons(
    'flatCard',
    [
      [-halfWidth, -halfHeight, 0],
      [halfWidth, -halfHeight, 0],
      [halfWidth, halfHeight, 0],
      [-halfWidth, halfHeight, 0],
    ],
    [[0, 1, 2, 3]],
    { flatShading: true },
  );
}

function generateRadialPrism(
  kind: 'prism' | 'cylinder',
  radius: number,
  height: number,
  segments: number,
): IndexedGeometry {
  const halfHeight = height / 2;
  const vertices: Vec3[] = [];
  for (const y of [-halfHeight, halfHeight]) {
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      vertices.push([radius * Math.cos(angle), y, radius * Math.sin(angle)]);
    }
  }
  const polygons: number[][] = [
    [...Array.from({ length: segments }, (_, index) => index)].reverse(),
    Array.from({ length: segments }, (_, index) => segments + index),
  ];
  for (let segment = 0; segment < segments; segment += 1) {
    const next = (segment + 1) % segments;
    polygons.push([segment, next, segments + next, segments + segment]);
  }
  return meshFromPolygons(
    kind,
    vertices,
    polygons.map((polygon) => [...polygon].reverse()),
    {
      flatShading: kind === 'prism',
    },
  );
}

function generateRingSolid(
  kind: 'capsule',
  bottom: Vec3,
  top: Vec3,
  rings: readonly { readonly y: number; readonly radius: number }[],
  segments: number,
): IndexedGeometry {
  const vertices: Vec3[] = [bottom];
  const ringStarts: number[] = [];
  for (const ring of rings) {
    ringStarts.push(vertices.length);
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      vertices.push([
        ring.radius * Math.cos(angle),
        ring.y,
        ring.radius * Math.sin(angle),
      ]);
    }
  }
  const topIndex = vertices.push(top) - 1;
  const polygons: number[][] = [];
  const first = ringStarts[0] ?? 1;
  for (let segment = 0; segment < segments; segment += 1) {
    polygons.push([0, first + ((segment + 1) % segments), first + segment]);
  }
  for (let ringIndex = 0; ringIndex < ringStarts.length - 1; ringIndex += 1) {
    const lower = ringStarts[ringIndex] ?? 0;
    const upper = ringStarts[ringIndex + 1] ?? 0;
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      polygons.push([
        lower + segment,
        lower + next,
        upper + next,
        upper + segment,
      ]);
    }
  }
  const last = ringStarts.at(-1) ?? 1;
  for (let segment = 0; segment < segments; segment += 1) {
    polygons.push([
      last + segment,
      last + ((segment + 1) % segments),
      topIndex,
    ]);
  }
  return meshFromPolygons(
    kind,
    vertices,
    polygons.map((polygon) => [...polygon].reverse()),
  );
}

function cuboidVertices(
  width: number,
  height: number,
  depth: number,
): readonly Vec3[] {
  const x = width / 2;
  const y = height / 2;
  const z = depth / 2;
  return [
    [-x, -y, -z],
    [x, -y, -z],
    [x, y, -z],
    [-x, y, -z],
    [-x, -y, z],
    [x, -y, z],
    [x, y, z],
    [-x, y, z],
  ];
}

function cuboidPolygons(): readonly (readonly number[])[] {
  return [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 4, 7, 3],
    [1, 2, 6, 5],
    [0, 1, 5, 4],
    [3, 7, 6, 2],
  ];
}

function validateDimensions(shape: {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}): void {
  for (const [path, value] of [
    ['width', shape.width],
    ['height', shape.height],
    ['depth', shape.depth],
  ] as const) {
    assertFiniteInRange(
      value,
      path,
      GEOMETRY_LIMITS.minimumDimension,
      GEOMETRY_LIMITS.maximumDimension,
    );
  }
}

function validateRadiusHeightSegments(
  radius: number,
  height: number,
  segments: number,
  segmentPath: string,
): void {
  assertFiniteInRange(
    radius,
    'radius',
    GEOMETRY_LIMITS.minimumDimension,
    GEOMETRY_LIMITS.maximumDimension,
  );
  assertFiniteInRange(
    height,
    'height',
    GEOMETRY_LIMITS.minimumDimension,
    GEOMETRY_LIMITS.maximumDimension,
  );
  assertIntegerInRange(
    segments,
    segmentPath,
    GEOMETRY_LIMITS.minimumSegments,
    GEOMETRY_LIMITS.maximumSegments,
  );
}

function validateProfile(
  profile: readonly Vec2[],
  minimumPoints: number,
  requireConvex: boolean,
): void {
  if (
    profile.length < minimumPoints ||
    profile.length > GEOMETRY_LIMITS.maximumProfilePoints
  ) {
    throw new GeometryParameterError(
      'profile',
      `between ${minimumPoints} and ${GEOMETRY_LIMITS.maximumProfilePoints} points`,
      profile.length,
    );
  }
  profile.forEach((point, pointIndex) =>
    point.forEach((value, axis) =>
      assertFiniteInRange(
        value,
        `profile[${pointIndex}][${axis}]`,
        -GEOMETRY_LIMITS.maximumDimension,
        GEOMETRY_LIMITS.maximumDimension,
      ),
    ),
  );
  if (Math.abs(signedArea(profile)) <= 1e-9 && minimumPoints >= 3) {
    throw new GeometryParameterError('profile', 'a non-zero area', profile);
  }
  if (requireConvex && !isConvex(profile)) {
    throw new GeometryParameterError(
      'profile',
      'a convex non-self-intersecting polygon',
      profile,
    );
  }
}

function signedArea(profile: readonly Vec2[]): number {
  let area = 0;
  for (let index = 0; index < profile.length; index += 1) {
    const current = profile[index] ?? [0, 0];
    const next = profile[(index + 1) % profile.length] ?? [0, 0];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function isConvex(profile: readonly Vec2[]): boolean {
  let sign = 0;
  for (let index = 0; index < profile.length; index += 1) {
    const a = profile[index] ?? [0, 0];
    const b = profile[(index + 1) % profile.length] ?? [0, 0];
    const c = profile[(index + 2) % profile.length] ?? [0, 0];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) <= 1e-9) {
      continue;
    }
    const nextSign = Math.sign(cross);
    if (sign !== 0 && nextSign !== sign) {
      return false;
    }
    sign = nextSign;
  }
  return sign !== 0;
}

function distance3(a: Vec3, b: Vec3): number {
  return Math.hypot(...subtract3(a, b));
}

function remainingAxes(axis: 0 | 1 | 2): readonly [0 | 1 | 2, 0 | 1 | 2] {
  switch (axis) {
    case 0:
      return [1, 2];
    case 1:
      return [0, 2];
    case 2:
      return [0, 1];
  }
}
