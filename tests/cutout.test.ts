import { describe, expect, it } from 'vitest';
import { resolveStraight } from '../src/render/cutout.js';
import { encodePngRgba } from '../src/png.js';

/** A supersampled buffer (premultiplied RGBA, ss x ss samples for each output pixel). */
function buffer(width: number, height: number, ss: number, sample: (x: number, y: number) => [number, number, number, number]): Uint8Array {
  const out = new Uint8Array(width * ss * height * ss * 4);
  for (let y = 0; y < height * ss; y++)
    for (let x = 0; x < width * ss; x++) out.set(sample(x, y), (y * width * ss + x) * 4);
  return out;
}

describe('cut-out alpha path', () => {
  it('makes a soft edge: half the samples covered gives half alpha', () => {
    // 2x1 output pixels, 2x2 samples each. Pixel 0 is fully covered; pixel 1 covers its left column.
    const src = buffer(2, 1, 2, (x) => (x < 3 ? [200, 100, 50, 255] : [0, 0, 0, 0]));
    const out = resolveStraight(src, 2, 1, 2);
    expect(Array.from(out.subarray(0, 4))).toEqual([200, 100, 50, 255]);
    expect(out[7]).toBe(128);
  });

  it('takes the edge colour from covered samples only (no darkening)', () => {
    // One quarter of the samples are covered by bright yellow; the rest are empty (0, 0, 0, 0).
    const src = buffer(1, 1, 2, (x, y) => (x === 0 && y === 0 ? [255, 255, 0, 255] : [0, 0, 0, 0]));
    const out = resolveStraight(src, 1, 1, 2);
    expect(Array.from(out)).toEqual([255, 255, 0, 64]);
  });

  it('keeps empty pixels fully transparent and flips WebGL rows', () => {
    // Bottom-up source: the first source row is the bottom output row.
    const src = buffer(1, 2, 1, (_x, y) => (y === 0 ? [10, 20, 30, 255] : [0, 0, 0, 0]));
    const out = resolveStraight(src, 1, 2, 1, true);
    expect(Array.from(out.subarray(0, 4))).toEqual([0, 0, 0, 0]);
    expect(Array.from(out.subarray(4, 8))).toEqual([10, 20, 30, 255]);
  });

  it('encodes a PNG with RGBA colour type', () => {
    const png = encodePngRgba(1, 1, new Uint8Array([1, 2, 3, 4]));
    expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
    expect(png[25]).toBe(6);
  });
});
