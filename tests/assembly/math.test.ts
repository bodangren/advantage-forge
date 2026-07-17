import { describe, expect, it } from 'vitest';

import type { Transform } from '../../src/contracts/index.js';

import {
  composeTransforms,
  invertTransform,
  mirrorTransform,
  quaternionFromAxisAngle,
  rotateVector,
  transformBounds,
  unionBounds,
} from '../../src/assembly/index.js';

describe('assembly transform math', () => {
  it('composes and inverts uniform rigid transforms predictably', () => {
    const transform: Transform = {
      position: [2, 3, 4],
      rotation: quaternionFromAxisAngle([0, 1, 0], 90),
      scale: [2, 2, 2],
    };
    expect(composeTransforms(transform, invertTransform(transform))).toEqual({
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1],
    });
    expect(
      rotateVector(quaternionFromAxisAngle([0, 1, 0], 90), [1, 0, 0]),
    ).toEqual([0, 0, -1]);
  });

  it('mirrors transforms without introducing negative scale', () => {
    const mirrored = mirrorTransform(
      {
        position: [-2, 1, 0],
        rotation: quaternionFromAxisAngle([0, 0, 1], 30),
        scale: [1, 2, 1],
      },
      'x',
    );
    expect(mirrored.position).toEqual([2, 1, 0]);
    expect(mirrored.scale).toEqual([1, 2, 1]);
    expect(mirrored.rotation[2]).toBeLessThan(0);
  });

  it('rejects degenerate transform math and supports empty bounds unions', () => {
    expect(unionBounds([])).toEqual({ min: [0, 0, 0], max: [0, 0, 0] });
    expect(() =>
      invertTransform({
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        scale: [0, 1, 1],
      }),
    ).toThrow();
    expect(() => quaternionFromAxisAngle([0, 0, 0], 20)).toThrow();
    expect(() =>
      composeTransforms(
        { position: [0, 0, 0], rotation: [0, 0, 0, 0], scale: [1, 1, 1] },
        { position: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
      ),
    ).toThrow();
  });

  it('transforms all eight bounds corners', () => {
    expect(
      transformBounds(
        { min: [-1, -2, -0.5], max: [1, 2, 0.5] },
        {
          position: [3, 0, 0],
          rotation: quaternionFromAxisAngle([0, 1, 0], 90),
          scale: [1, 1, 1],
        },
      ),
    ).toEqual({ min: [2.5, -2, -1], max: [3.5, 2, 1] });
  });
});
