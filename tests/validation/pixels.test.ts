import { describe, expect, it } from 'vitest';

import {
  InvalidPixelBufferError,
  analyzeRgbaPixels,
} from '../../src/validation/index.js';

function pixelBuffer(
  width: number,
  height: number,
  occupied: readonly [number, number][],
) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of occupied) {
    const offset = (y * width + x) * 4;
    pixels[offset] = 100;
    pixels[offset + 1] = 120;
    pixels[offset + 2] = 80;
    pixels[offset + 3] = 255;
  }
  return pixels;
}

describe('RGBA pixel analysis', () => {
  it('reports occupied bounds, ground anchor, transparency, and feature runs', () => {
    const metrics = analyzeRgbaPixels(
      pixelBuffer(6, 6, [
        [2, 1],
        [2, 2],
        [3, 2],
        [2, 3],
        [3, 3],
        [2, 4],
      ]),
      6,
      6,
      { expectedGroundPixelY: 4 },
    );

    expect(metrics.occupiedBounds).toEqual({
      minX: 2,
      minY: 1,
      maxX: 3,
      maxY: 4,
      width: 2,
      height: 4,
    });
    expect(metrics.occupiedPixelCount).toBe(6);
    expect(metrics.transparentPixelCount).toBe(30);
    expect(metrics.occupiedRatio).toBeCloseTo(1 / 6);
    expect(metrics.groundAnchorDeviationPixels).toBe(0);
    expect(metrics.minimumHorizontalRunPixels).toBe(1);
    expect(metrics.minimumVerticalRunPixels).toBe(2);
    expect(metrics.representativeFeaturePixels).toBe(2);
    expect(metrics.clippedEdges).toEqual([]);
  });

  it('reports edge clipping in stable clockwise order', () => {
    const metrics = analyzeRgbaPixels(
      pixelBuffer(3, 3, [
        [0, 0],
        [2, 2],
      ]),
      3,
      3,
    );
    expect(metrics.clippedEdges).toEqual(['top', 'right', 'bottom', 'left']);
  });

  it('returns empty metrics for a fully transparent frame', () => {
    const metrics = analyzeRgbaPixels(pixelBuffer(2, 2, []), 2, 2);
    expect(metrics.occupiedBounds).toBeNull();
    expect(metrics.groundPixelY).toBeNull();
    expect(metrics.minimumHorizontalRunPixels).toBeNull();
    expect(metrics.minimumVerticalRunPixels).toBeNull();
    expect(metrics.representativeFeaturePixels).toBeNull();
  });

  it('rejects malformed buffers and anchors', () => {
    expect(() => analyzeRgbaPixels(new Uint8Array(3), 1, 1)).toThrow(
      InvalidPixelBufferError,
    );
    expect(() =>
      analyzeRgbaPixels(pixelBuffer(2, 2, []), 2, 2, {
        expectedGroundPixelY: 2,
      }),
    ).toThrow('expectedGroundPixelY must address a row inside the frame');
  });
});
