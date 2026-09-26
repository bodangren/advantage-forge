/** Pure pixel operations for the sprite pass. They work on RGBA byte buffers, in Node or a browser. */

export interface Pixels {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

export type OutlineMode = 'none' | 'dark' | 'black';

/**
 * Box-filter a supersampled render down by `factor`, then make alpha binary (pixel art has no
 * partial transparency). A pixel is solid when at least `coverage` of its samples are solid.
 */
export function downsample(src: Pixels, factor: number, coverage = 0.5): Pixels {
  const w = Math.floor(src.width / factor);
  const h = Math.floor(src.height / factor);
  const out = new Uint8ClampedArray(w * h * 4);
  const n = factor * factor;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let sy = 0; sy < factor; sy++)
        for (let sx = 0; sx < factor; sx++) {
          const i = ((y * factor + sy) * src.width + (x * factor + sx)) * 4;
          const al = src.data[i + 3]! / 255;
          r += src.data[i]! * al;
          g += src.data[i + 1]! * al;
          b += src.data[i + 2]! * al;
          a += al;
        }
      const o = (y * w + x) * 4;
      if (a / n >= coverage) {
        out[o] = r / a;
        out[o + 1] = g / a;
        out[o + 2] = b / a;
        out[o + 3] = 255;
      }
    }
  return { width: w, height: h, data: out };
}

/** Build a shared palette of at most `count` colors from the solid pixels of all frames (median cut). */
export function buildPalette(frames: readonly Pixels[], count: number): number[][] {
  const colors: number[][] = [];
  for (const f of frames)
    for (let i = 0; i < f.data.length; i += 4)
      if (f.data[i + 3] === 255) colors.push([f.data[i]!, f.data[i + 1]!, f.data[i + 2]!]);
  if (colors.length === 0) return [];
  let boxes: number[][][] = [colors];
  while (boxes.length < count) {
    let bi = -1;
    let bestRange = 0;
    let axis = 0;
    boxes.forEach((bx, index) => {
      if (bx.length < 2) return;
      for (let c = 0; c < 3; c++) {
        let lo = 255,
          hi = 0;
        for (const p of bx) {
          lo = Math.min(lo, p[c]!);
          hi = Math.max(hi, p[c]!);
        }
        // Weight by population so large regions get more shades than tiny details.
        const range = (hi - lo) * Math.sqrt(bx.length);
        if (range > bestRange) {
          bestRange = range;
          bi = index;
          axis = c;
        }
      }
    });
    if (bi < 0) break;
    const bx = boxes[bi]!.sort((p, q) => p[axis]! - q[axis]!);
    const mid = bx.length >> 1;
    boxes = [...boxes.slice(0, bi), bx.slice(0, mid), bx.slice(mid), ...boxes.slice(bi + 1)];
  }
  return boxes.map((bx) => {
    const s = [0, 0, 0];
    for (const p of bx) for (let c = 0; c < 3; c++) s[c]! += p[c]!;
    return s.map((v) => Math.round(v / bx.length));
  });
}

export function applyPalette(src: Pixels, palette: readonly number[][]): Pixels {
  const out = new Uint8ClampedArray(src.data);
  const cache = new Map<number, number[]>();
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] !== 255) continue;
    const key = (out[i]! << 16) | (out[i + 1]! << 8) | out[i + 2]!;
    let best = cache.get(key);
    if (!best) {
      let bd = Infinity;
      for (const p of palette) {
        // Weighted RGB distance, closer to perceived difference than plain RGB.
        const dr = out[i]! - p[0]!,
          dg = out[i + 1]! - p[1]!,
          db = out[i + 2]! - p[2]!;
        const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
        if (d < bd) {
          bd = d;
          best = p;
        }
      }
      cache.set(key, best!);
    }
    out[i] = best![0]!;
    out[i + 1] = best![1]!;
    out[i + 2] = best![2]!;
  }
  return { width: src.width, height: src.height, data: out };
}

/** Draw a one-pixel outline around the solid shape. 'dark' uses a darkened neighbor color. */
export function outline(src: Pixels, mode: OutlineMode): Pixels {
  if (mode === 'none') return src;
  const { width: w, height: h, data } = src;
  const out = new Uint8ClampedArray(data);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (data[o + 3] === 255) continue;
      let n = -1;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const i = (ny * w + nx) * 4;
        if (data[i + 3] === 255) {
          n = i;
          break;
        }
      }
      if (n < 0) continue;
      if (mode === 'black') {
        out[o] = 24;
        out[o + 1] = 18;
        out[o + 2] = 28;
      } else {
        out[o] = data[n]! * 0.35;
        out[o + 1] = data[n + 1]! * 0.3;
        out[o + 2] = data[n + 2]! * 0.38;
      }
      out[o + 3] = 255;
    }
  return { width: w, height: h, data: out };
}

/** Bounding box of solid pixels, or null when the frame is empty. */
export function occupied(src: Pixels): { x: number; y: number; width: number; height: number } | null {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < src.height; y++)
    for (let x = 0; x < src.width; x++)
      if (src.data[(y * src.width + x) * 4 + 3] === 255) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  return x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}
