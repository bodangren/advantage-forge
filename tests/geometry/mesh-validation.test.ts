import { describe, expect, it } from 'vitest';

import type { IndexedGeometry } from '../../src/contracts/index.js';
import {
  calculateBounds,
  calculateVertexNormals,
  validateIndexedGeometry,
} from '../../src/geometry/index.js';

describe('indexed geometry utilities', () => {
  it('calculates exact finite bounds and unit normals', () => {
    const positions = [0, 0, 0, 2, 0, 0, 0, 3, 0];
    expect(calculateBounds(positions)).toEqual({
      min: [0, 0, 0],
      max: [2, 3, 0],
    });
    expect(calculateVertexNormals(positions, [0, 1, 2])).toEqual([
      0, 0, 1, 0, 0, 1, 0, 0, 1,
    ]);
  });

  it('rejects missing and non-finite position data', () => {
    expect(() => calculateBounds([])).toThrow();
    expect(() => calculateBounds([0, 0, Number.NaN])).toThrow();
    expect(calculateVertexNormals([0, 0, 0], [0])).toEqual([0, 0, 0]);
  });

  it('reports malformed indices, triangles, normals, and bounds structurally', () => {
    const invalid: IndexedGeometry = {
      positions: [0, 0, 0, 1, 0, 0, 2, 0, 0],
      normals: [0, 0, 0, 0, 0, 0, 0, 0, Number.NaN],
      indices: [0, 1, 2, 0, 1, 99],
      bounds: { min: [-1, 0, 0], max: [2, 0, 0] },
      materialGroups: [
        { materialSlot: 'surface', indexStart: 0, indexCount: 6 },
      ],
      metadata: { generator: 'flatCard', triangleCount: 2 },
    };
    expect(validateIndexedGeometry(invalid).map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'NON_FINITE_NORMAL',
        'INVALID_INDEX',
        'DEGENERATE_TRIANGLE',
        'INVALID_NORMAL',
        'INVALID_BOUNDS',
      ]),
    );
  });
});
