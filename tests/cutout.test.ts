import { describe, expect, it } from 'vitest';
import { resolveStraight, readStrips, singBodyVisible, SING_BODY_NAMES } from '../src/render/cutout.js';
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

describe('cut-out readback', () => {
  it('reads every row once, in strips no taller than the limit, top to bottom', () => {
    const width = 4;
    const height = 10;
    const strips: number[][] = [];
    const out = readStrips(
      width,
      height,
      (_x, y, w, rows, dst) => {
        strips.push([y, rows]);
        for (let r = 0; r < rows; r++) for (let i = 0; i < w * 4; i++) dst[r * w * 4 + i] = (y + r) & 255;
      },
      4,
    );
    expect(strips).toEqual([
      [0, 4],
      [4, 4],
      [8, 2],
    ]);
    for (let y = 0; y < height; y++) expect(Array.from(out.subarray(y * width * 4, y * width * 4 + 2))).toEqual([y, y]);
  });

  it('keeps the row that one whole-buffer read loses', () => {
    const width = 2;
    const height = 6;
    const lost = 3;
    // The driver bug: one read of the whole buffer returns row 3 empty; a short read keeps it.
    const read = (_x: number, y: number, w: number, rows: number, dst: Uint8Array) => {
      const whole = rows === height;
      for (let r = 0; r < rows; r++)
        for (let i = 0; i < w * 4; i++) dst[r * w * 4 + i] = whole && y + r === lost ? 0 : 255;
    };
    const big = new Uint8Array(width * height * 4);
    read(0, 0, width, height, big);
    expect(big[lost * width * 4 + 3]).toBe(0);
    const out = readStrips(width, height, read, 2);
    for (let y = 0; y < height; y++) expect(out[y * width * 4 + 3]).toBe(255);
  });
});

describe('singing-face bodies in cut-outs', () => {
  it('names the eyelids and the open mouth', () => {
    expect([...SING_BODY_NAMES].sort()).toEqual(['eyelid-skin', 'mouth-open']);
  });

  it('hides both bodies only when hideSing is set', () => {
    for (const name of SING_BODY_NAMES) {
      expect(singBodyVisible(name, true)).toBe(false);
      expect(singBodyVisible(name, false)).toBe(true);
    }
  });

  it('keeps every other body visible when hideSing is set', () => {
    for (const name of ['hair', 'skin', 'shirt', 'shoe.L']) expect(singBodyVisible(name, true)).toBe(true);
  });
});
