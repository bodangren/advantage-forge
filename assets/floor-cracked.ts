import { defineAsset, mixRgb, noise, rgb, sdf, Sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

/**
 * Dungeon floor tile, cracked variant ("The Sunken Vault" set, dungeon-quest_002 style anchor).
 *
 * - Role: ground-layer modular tile for the dungeon map, seen top-down and as a 128 px sprite.
 * - Size: 2 x 2 m, 0.08 m thick; bottom at y = 0, walking surface flush at y = 0.08. Square
 *   tile edges so neighbours repeat without seams (grout lines always reach the edges).
 * - One idea: an otherwise tidy cool-slate slab floor broken by ONE jagged crack and a
 *   knocked-out corner chunk that exposes dark soil — the damage is the focal point.
 * - Shape language: square, chunky dungeon stone; the slab stays flat (no displacement through
 *   the tile), all grid/crack relief is paint + bump; only the corner break is real geometry.
 * - Palette: grout deep slate #2a3547, slabs #4a5d75 tinted per slab, worn pale tops #7a8ba0,
 *   crack near-black slate #1e2634, fresh break faces #6e8095, dark warm soil #2a2015,
 *   rubble mid slate with pale tops. Wet sheen = painted pale streaks on a matte stone base.
 * - Materials: one stone slab body, one soil body, one rubble body (3 chunky bits in the break).
 * - No rig, no animation.
 */

type Pt = readonly [number, number];

const GROUT_W = 0.042; // grout line width between slabs

const GROUT = rgb('#2a3547');
const GROUT_DEEP = rgb('#222b3a');
const SLAB_DARK = rgb('#3d4e64');
const SLAB_LIGHT = rgb('#556a82');
const WORN = rgb('#7a8ba0');
const EDGE_LIGHT = rgb('#7d90a6');
const DAMP = rgb('#3a4a5f');
const SHEEN = rgb('#8fa3b8');
const PATCH = rgb('#46576d');
const CRACK = rgb('#1e2634');
const SIDE = rgb('#273245');
const SIDE_DEEP = rgb('#1d2532');
const BREAK_PALE = rgb('#6e8095');
const BREAK_DEEP = rgb('#4a5b72');
const SOIL = rgb('#2a2015');
const SOIL_DEEP = rgb('#1d150d');
const SOIL_SPECK = rgb('#463524');
const CHIP_PALE = rgb('#8496ab');

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smoothstep = (a: number, b: number, t: number) => {
  const s = clamp01((t - a) / (b - a));
  return s * s * (3 - 2 * s);
};

// ---------------------------------------------------------------- slab grid
// Jittered 4 x 4 flagstone grid. Interior grid nodes wander a little; the tile edge nodes
// stay exact so the tile boundary is a perfect 2 m square for seamless placement.

const XS = [-1, -0.52, 0.14, 0.72, 1];
const ZS = [-1, -0.58, 0.08, 0.66, 1];

function node(i: number, j: number): Pt {
  const jx = i > 0 && i < 4 ? (noise.random(i * 7 + 3, 1, j * 5 + 2) - 0.5) * 0.09 : 0;
  const jz = j > 0 && j < 4 ? (noise.random(i * 3 + 8, 2, j * 11 + 5) - 0.5) * 0.09 : 0;
  return [XS[i]! + jx, ZS[j]! + jz];
}

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz;
  const t = l2 > 0 ? clamp01(((px - ax) * dx + (pz - az) * dz) / l2) : 0;
  return Math.hypot(ax + dx * t - px, az + dz * t - pz);
}

// Grout lines: interior boundary polylines only (the tile edges carry no grout).
const VLINE: Pt[][][] = []; // VLINE[i] = polyline segments of the vertical line at x index i
const HLINE: Pt[][][] = [];
for (let i = 1; i <= 3; i++) {
  const segs: Pt[][] = [];
  for (let j = 0; j < 4; j++) segs.push([node(i, j), node(i, j + 1)]);
  VLINE[i] = segs;
}
for (let j = 1; j <= 3; j++) {
  const segs: Pt[][] = [];
  for (let i = 0; i < 4; i++) segs.push([node(i, j), node(i + 1, j)]);
  HLINE[j] = segs;
}

function cellOf(x: number, z: number): [number, number] {
  let i = 0;
  let j = 0;
  for (let k = 1; k <= 3; k++) {
    if (x > XS[k]!) i = k;
    if (z > ZS[k]!) j = k;
  }
  return [i, j];
}

/** Distance to the nearest grout boundary of cell (i, j); large near the tile edges. */
function cellDist(x: number, z: number, i: number, j: number): number {
  let d = Infinity;
  const line = (segs: Pt[][] | undefined) => {
    if (!segs) return;
    for (const [[ax, az], [bx, bz]] of segs) d = Math.min(d, segDist(x, z, ax, az, bx, bz));
  };
  if (i > 0) line(VLINE[i]);
  if (i < 3) line(VLINE[i + 1]);
  if (j > 0) line(HLINE[j]);
  if (j < 3) line(HLINE[j + 1]);
  return d;
}

// One small square repair slab set into a big cell, like the loose flagstones in the reference.
const PATCH_C: Pt = [-0.28, -0.34];
const PATCH_H: Pt = [0.16, 0.13];
const PATCH_ROT = (8 * Math.PI) / 180;

function patchDist(x: number, z: number): number {
  const dx = x - PATCH_C[0];
  const dz = z - PATCH_C[1];
  const c = Math.cos(PATCH_ROT);
  const s = Math.sin(PATCH_ROT);
  const u = c * dx + s * dz;
  const v = -s * dx + c * dz;
  return Math.max(Math.abs(u) - PATCH_H[0], Math.abs(v) - PATCH_H[1]);
}

// ---------------------------------------------------------------- the crack
// One jagged crack from the broken corner across to the far edge, with two short branches.
// Painted and bumped only — never displaced through the tile.

const CRACK_MAIN: Pt[] = [
  [0.6, 0.76], [0.33, 0.55], [0.18, 0.66], [0.02, 0.5],
  [-0.16, 0.58], [-0.38, 0.42], [-0.62, 0.52], [-1.02, 0.34],
];
const CRACK_B1: Pt[] = [[0.02, 0.5], [0.1, 0.3], [-0.02, 0.1], [0.04, -0.1]];
const CRACK_B2: Pt[] = [[-0.38, 0.42], [-0.48, 0.22], [-0.42, 0.02]];

interface CrackSeg {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  hw: number; // half width, tapering away from the break
}

const CRACK_SEGS: CrackSeg[] = [];
for (let i = 0; i < CRACK_MAIN.length - 1; i++) {
  const [ax, az] = CRACK_MAIN[i]!;
  const [bx, bz] = CRACK_MAIN[i + 1]!;
  CRACK_SEGS.push({ ax, az, bx, bz, hw: 0.0145 - (0.008 * i) / (CRACK_MAIN.length - 2) });
}
for (let i = 0; i < CRACK_B1.length - 1; i++) {
  const [ax, az] = CRACK_B1[i]!;
  const [bx, bz] = CRACK_B1[i + 1]!;
  CRACK_SEGS.push({ ax, az, bx, bz, hw: 0.005 - 0.0015 * (i / (CRACK_B1.length - 2)) });
}
for (let i = 0; i < CRACK_B2.length - 1; i++) {
  const [ax, az] = CRACK_B2[i]!;
  const [bx, bz] = CRACK_B2[i + 1]!;
  CRACK_SEGS.push({ ax, az, bx, bz, hw: 0.0045 - 0.0015 * (i / (CRACK_B2.length - 2)) });
}

function crackMask(x: number, z: number): number {
  let s = Infinity;
  for (const g of CRACK_SEGS) s = Math.min(s, segDist(x, z, g.ax, g.az, g.bx, g.bz) - g.hw);
  return 1 - smoothstep(-0.003, 0.005, s);
}

// ------------------------------------------------------- the broken corner
// Convex jagged break line across the (+X, +Z) corner; the missing chunk is cut in 3D and the
// recess shows dark soil. The same planes, inset, bound the soil so it stays inside the hole.

const BREAK: Pt[] = [
  [0.62, 1.02], [0.56, 0.86], [0.64, 0.72], [0.78, 0.68], [0.9, 0.72], [1.02, 0.78],
];

interface Plane {
  nx: number;
  nz: number;
  off: number;
}

const BREAK_PLANES: Plane[] = BREAK.slice(0, -1).map(([ax, az], i) => {
  const [bx, bz] = BREAK[i + 1]!;
  const dx = bx - ax;
  const dz = bz - az;
  const l = Math.hypot(dx, dz);
  const nx = -dz / l; // left normal points into the hole (the break chain is convex)
  const nz = dx / l;
  return { nx, nz, off: nx * ax + nz * az };
});

/** Positive inside the missing chunk footprint, negative on the slab. */
function holeSign(x: number, z: number): number {
  let s = Infinity;
  for (const p of BREAK_PLANES) s = Math.min(s, p.nx * x + p.nz * z - p.off);
  return s;
}

function prism(pad: number, maxX: number, maxZ: number): Sdf {
  const region = sdf
    .box([maxX - 0.38, 0.5, maxZ - 0.48])
    .at((0.38 + maxX) / 2, 0.04, (0.48 + maxZ) / 2);
  return BREAK_PLANES.reduce(
    (acc, p) => sdf.intersect(acc, sdf.halfSpace([-p.nx, 0, -p.nz], -(p.off + pad))),
    region,
  );
}

// ---------------------------------------------------------------- painting

const groutMask = (d: number) => 1 - smoothstep(GROUT_W * 0.5 - 0.006, GROUT_W * 0.5 + 0.006, d);

function streak(
  x: number,
  z: number,
  cx: number,
  cz: number,
  rx: number,
  rz: number,
  rot: number,
): number {
  const dx = x - cx;
  const dz = z - cz;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const u = (c * dx + s * dz) / rx;
  const v = (-s * dx + c * dz) / rz;
  const q = u * u + v * v;
  return q < 1 ? (1 - q) * (1 - q) : 0;
}

function topColor(x: number, z: number): Rgb {
  const [i, j] = cellOf(x, z);
  let c = mixRgb(SLAB_DARK, SLAB_LIGHT, 0.18 + 0.64 * noise.random(i * 13 + 5, 7, j * 17 + 3));
  const dp = noise.fbm(x * 1.8 + 4, 0, z * 1.8 - 2, 2);
  if (dp > 0.22) c = mixRgb(c, DAMP, Math.min(0.45, (dp - 0.22) * 1.3));
  const w = noise.fbm(x * 4.5 - 3, 0, z * 4.5 + 7, 3);
  if (w > 0.28) c = mixRgb(c, WORN, Math.min(0.5, (w - 0.28) * 1.5));
  const d = cellDist(x, z, i, j);
  const band = 1 - smoothstep(GROUT_W * 0.5 + 0.006, GROUT_W * 0.5 + 0.026, d);
  c = mixRgb(c, EDGE_LIGHT, 0.22 * band);
  const dr = patchDist(x, z);
  if (dr < 0.03) {
    const pin = 1 - smoothstep(-0.002, 0.012, dr);
    if (pin > 0) {
      c = mixRgb(c, PATCH, 0.85 * pin);
      const pw = noise.fbm(x * 5.5 + 21, 0, z * 5.5 - 8, 2);
      if (pw > 0.2) c = mixRgb(c, WORN, Math.min(0.5, (pw - 0.2) * 1.5) * pin);
    }
    const pband = dr < 0 ? 1 - smoothstep(0.004, 0.02, -dr) : 0;
    c = mixRgb(c, EDGE_LIGHT, 0.25 * pband);
  }
  const sp = noise.fbm(x * 30 + 11, 0, z * 30 - 4, 2);
  if (sp > 0.42) c = mixRgb(c, SLAB_LIGHT, 0.2);
  const sheen = Math.max(
    streak(x, z, 0.42, -0.42, 0.36, 0.15, -0.2),
    streak(x, z, -0.55, 0.72, 0.3, 0.13, 0.26),
  );
  c = mixRgb(c, SHEEN, 0.16 * sheen);
  const g = Math.max(groutMask(d), dr < 0.02 ? groutMask(Math.abs(dr)) : 0);
  if (g > 0.002)
    c = mixRgb(
      c,
      mixRgb(GROUT, GROUT_DEEP, 0.35 + 0.65 * noise.random(Math.floor(x * 90 + 40), 3, Math.floor(z * 90 + 40))),
      g,
    );
  const cm = crackMask(x, z);
  if (cm > 0.002) c = mixRgb(c, CRACK, 0.95 * cm);
  return c;
}

function wallColor(x: number, y: number, z: number): Rgb {
  if (holeSign(x, z) > -0.015) {
    // freshly broken faces: paler stone, darker toward the bottom
    const n = noise.fbm(x * 18, y * 18, z * 18, 2) * 0.5 + 0.5;
    let c = mixRgb(BREAK_PALE, BREAK_DEEP, clamp01(1 - y / 0.08) * 0.55);
    return mixRgb(c, BREAK_DEEP, 0.25 * n);
  }
  const n = noise.fbm(x * 10, y * 10, z * 10, 2) * 0.5 + 0.5;
  return mixRgb(SIDE, SIDE_DEEP, 0.35 + 0.4 * n);
}

function slabColor(x: number, y: number, z: number): Rgb {
  if (y > 0.072) return topColor(x, z);
  if (y < 0.006) return SIDE_DEEP;
  return wallColor(x, y, z);
}

function slabBump(x: number, y: number, z: number): number {
  if (y <= 0.07) return 0.0004 * noise.fbm(x * 24, y * 24, z * 24, 2);
  const [i, j] = cellOf(x, z);
  const d = cellDist(x, z, i, j);
  const dr = patchDist(x, z);
  const g = Math.max(groutMask(d), dr < 0.02 ? groutMask(Math.abs(dr)) : 0);
  let b = 0.0015 * smoothstep(GROUT_W * 0.5, GROUT_W * 0.5 + 0.08, d); // each slab domes slightly
  b += 0.0011 * (1 - smoothstep(-0.05, -0.012, dr)); // patch dome
  b -= 0.003 * g; // grout groove
  b -= 0.0032 * crackMask(x, z); // crack groove
  b += 0.0007 * noise.fbm(x * 26, 3, z * 26, 2); // stone grain
  return b;
}

function soilColor(x: number, y: number, z: number): Rgb {
  const v = noise.fbm(x * 9, y * 9 + 3, z * 9, 3) * 0.5 + 0.5;
  let c = mixRgb(SOIL, SOIL_DEEP, 0.25 + 0.5 * v);
  const s = noise.fbm(x * 38 + 9, y * 38, z * 38, 2);
  if (s > 0.4) c = mixRgb(c, SOIL_SPECK, Math.min(0.6, (s - 0.4) * 2));
  return c;
}

function chipColor(x: number, y: number, z: number, base: Rgb): Rgb {
  const t = smoothstep(0, 1, clamp01((y - 0.042) / 0.045)); // pale worn tops
  let c = mixRgb(base, CHIP_PALE, t * 0.45);
  const r = noise.random(Math.floor(x * 80 + 50), 1, Math.floor(z * 80 + 50));
  return mixRgb(c, rgb('#3a4b60'), 0.3 * r);
}

// ---------------------------------------------------------------- asset

export default defineAsset({
  name: 'floor-cracked',
  description:
    'Cracked 2 m dungeon floor tile: cool gray slab grid with grout, one jagged crack, a broken corner over dark soil, three rubble bits.',
  detail: 0.01,
  reference: 'docs/dungeon-mockups/dungeon-quest_002.jpg',
  texture: { size: 1024 },

  build(k) {
    // Slab: flat 2 x 0.08 x 2 m, top flush at y = 0.08; the corner chunk is cut away in 3D.
    const slab = sdf.smoothSubtract(
      0.006,
      sdf.box([2, 0.08, 2]).at(0, 0.04, 0),
      prism(0, 1.06, 1.06),
    );
    k.body('slab', slab.paintFn(slabColor), {
      color: '#4a5d75',
      roughness: 0.88, // damp stone: matte base, wet sheen from painted streaks
      detail: 0.013,
      maxError: 0.0035,
      textureDensity: 2,
      bump: slabBump,
    });

    // Dark soil under the broken corner, 28 mm below the walking surface.
    const soil = sdf.intersect(
      prism(0.012, 0.995, 0.995),
      sdf.box([0.62, 0.052, 0.52]).at(0.69, 0.026, 0.74),
    );
    k.body('soil', soil.paintFn(soilColor), {
      color: '#2a2015',
      roughness: 0.95,
      detail: 0.012,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 30, y * 30, z * 30, 2),
    });

    // Three chunky rubble bits resting in the break, seated a few mm into the soil.
    const rubble = sdf.union(
      sdf
        .union(sdf.box([0.09, 0.05, 0.075], 0.012), sdf.box([0.055, 0.038, 0.05], 0.01).at(0.018, 0.012, -0.008))
        .rotateY(18)
        .at(0.76, 0.072, 0.84),
      sdf.box([0.055, 0.042, 0.05], 0.01).rotateY(-24).at(0.68, 0.066, 0.92),
      sdf.box([0.052, 0.036, 0.044], 0.009).rotateY(40).at(0.9, 0.064, 0.78),
    );
    k.body('rubble', rubble.paintFn(chipColor), {
      color: '#46586f',
      roughness: 0.82,
      detail: 0.006,
    });
  },
});
