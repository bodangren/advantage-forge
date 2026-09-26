/**
 * Deterministic 3D gradient noise in about [-1, 1]. Same input, same output, on every machine.
 * Use it with `Sdf.displace` for organic surface variation and with `Sdf.paintFn` for color variation.
 */
export function noise3(x: number, y: number, z: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);
  const x0 = lerp(grad(xi, yi, zi, xf, yf, zf, seed), grad(xi + 1, yi, zi, xf - 1, yf, zf, seed), u);
  const x1 = lerp(
    grad(xi, yi + 1, zi, xf, yf - 1, zf, seed),
    grad(xi + 1, yi + 1, zi, xf - 1, yf - 1, zf, seed),
    u,
  );
  const x2 = lerp(
    grad(xi, yi, zi + 1, xf, yf, zf - 1, seed),
    grad(xi + 1, yi, zi + 1, xf - 1, yf, zf - 1, seed),
    u,
  );
  const x3 = lerp(
    grad(xi, yi + 1, zi + 1, xf, yf - 1, zf - 1, seed),
    grad(xi + 1, yi + 1, zi + 1, xf - 1, yf - 1, zf - 1, seed),
    u,
  );
  return Math.max(-1, Math.min(1, lerp(lerp(x0, x1, v), lerp(x2, x3, v), w)));
}

/** Fractal noise: `octaves` layers of `noise3`, each at double frequency and half amplitude. */
export function fbm(x: number, y: number, z: number, octaves = 4, seed = 0): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise3(x * freq, y * freq, z * freq, seed + i * 31);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** Deterministic pseudo-random number in [0, 1) from integer inputs. */
export function random(a: number, b = 0, c = 0, seed = 0): number {
  return (hash(a, b, c, seed) >>> 0) / 4294967296;
}

/** Dot product of a pseudo-random corner gradient with the offset (dx, dy, dz). */
function grad(ix: number, iy: number, iz: number, dx: number, dy: number, dz: number, seed: number): number {
  const h = hash(ix, iy, iz, seed) & 15;
  const a = h < 8 ? dx : dy;
  const b = h < 4 ? dy : h === 12 || h === 14 ? dx : dz;
  return ((h & 1) === 0 ? a : -a) + ((h & 2) === 0 ? b : -b);
}

function hash(x: number, y: number, z: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return h;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Cellular (Worley) noise: distances to the nearest and second-nearest random feature point, and a
 * stable id for the nearest cell. `f2 - f1` is small near cell borders, which makes mortar lines
 * between stones, gaps between cobbles, scale edges, and cracked earth.
 */
export function worley(x: number, y: number, z: number, seed = 0): { f1: number; f2: number; id: number } {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  let f1 = Infinity;
  let f2 = Infinity;
  let id = 0;
  for (let dz = -1; dz <= 1; dz++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const cx = xi + dx;
        const cy = yi + dy;
        const cz = zi + dz;
        const px = cx + random(cx, cy, cz, seed);
        const py = cy + random(cx, cy, cz, seed + 1);
        const pz = cz + random(cx, cy, cz, seed + 2);
        const d = Math.hypot(x - px, y - py, z - pz);
        if (d < f1) {
          f2 = f1;
          f1 = d;
          id = hash(cx, cy, cz, seed + 3) >>> 0;
        } else if (d < f2) f2 = d;
      }
  return { f1, f2, id };
}
