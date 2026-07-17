import { describe, expect, it } from 'vitest';

import {
  normalizeGroundRow,
  requiredFeatureEvidenceFromPixels,
} from '../../src/render/index.js';

function pixelBuffer(
  width: number,
  height: number,
  occupied: readonly [number, number][],
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of occupied) pixels[(y * width + x) * 4 + 3] = 255;
  return pixels;
}

describe('sprite evidence and normalization', () => {
  it('moves ground contact only when the shift preserves every occupied pixel', () => {
    const aligned = normalizeGroundRow(pixelBuffer(3, 4, [[1, 2]]), 3, 4, 3);
    expect(aligned[(3 * 3 + 1) * 4 + 3]).toBe(255);
    expect(aligned[(2 * 3 + 1) * 4 + 3]).toBe(0);

    expect(() =>
      normalizeGroundRow(
        pixelBuffer(3, 4, [
          [1, 0],
          [1, 3],
        ]),
        3,
        4,
        1,
      ),
    ).toThrow('would discard occupied pixels');
  });

  it('reports threshold evidence for a named semantic feature mask', () => {
    const broad = requiredFeatureEvidenceFromPixels(
      'equipment.sword',
      pixelBuffer(7, 7, [
        [2, 1],
        [3, 1],
        [4, 1],
        [2, 2],
        [3, 2],
        [4, 2],
        [2, 3],
        [3, 3],
        [4, 3],
        [2, 4],
        [3, 4],
        [4, 4],
        [2, 5],
        [3, 5],
        [4, 5],
      ]),
      7,
      7,
      3,
    );
    expect(broad).toEqual({
      partId: 'equipment.sword',
      silhouetteWidthPixels: 3,
      minimumPixels: 3,
      passes: true,
    });
    expect(
      requiredFeatureEvidenceFromPixels(
        'equipment.sword',
        pixelBuffer(3, 4, [
          [1, 1],
          [1, 2],
        ]),
        3,
        4,
        3,
      ).passes,
    ).toBe(false);
  });
});
