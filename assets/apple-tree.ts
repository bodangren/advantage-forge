import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Sdf } from '../src/index.js';

/**
 * Apple tree — Chibi Quest nature prop (catalog `nature/trees/apple-tree`): about 2.6 m tall,
 * standing on y = 0 and facing +Z, sibling of oak-tree and pine-tree.
 *
 * Role: orchard tree for the hamlet; must read at 128 px as "round green blob on a brown
 *   trunk with red dots", plus fallen apples as the story touch.
 * One idea: a short lollipop crown so stuffed with red apples that a few dropped to the grass.
 * Shape language: round and chunky (friendly) with a gently bent sturdy trunk as secondary.
 * Palette: leaf #5cb85c, dark underside #3f9248, shadow #2c6e34, sunlit top #a8e28b,
 *          bark #8a5a35, walnut grooves #6b4226, honey flare #b5814a,
 *          apple red #d93a2b with #ff8a63 highlight — red is the small accent (60/30/10).
 * Materials: bark trunk (roughness 0.85), foliage crown (0.72), glossy apples (0.35),
 *   walnut stems (0.85), satin leaves (0.55).
 * Detail list: bent trunk with flared roots (primary), eight lobed clumps with per-clump
 *   lighting (primary), nine canopy apples + three fallen apples (secondary/focal),
 *   bark grooves and leaf bump (tertiary).
 * Rig/animation: none (static prop).
 */

const bark = rgb('#8a5a35');
const barkDark = rgb('#6b4226');
const barkDeep = rgb('#54301c');
const barkLight = rgb('#b5814a');
const leafDark = rgb('#3f9248');
const leafShadow = rgb('#2c6e34');
const leaf = rgb('#5cb85c');
const leafLight = rgb('#a8e28b');
const appleRed = rgb('#d93a2b');
const appleDark = rgb('#a3150e');
const appleHi = rgb('#ff8a63');
const stemC = '#54301c';

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

interface Clump {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly r: number;
}

// Round lollipop crown: one dominant mass, seven satellites, small ones on top.
const clumps: readonly Clump[] = [
  { x: 0.0, y: 1.88, z: 0.0, r: 0.68 }, // central ball
  { x: -0.48, y: 1.74, z: 0.08, r: 0.48 }, // left shoulder
  { x: 0.46, y: 1.76, z: -0.05, r: 0.48 }, // right shoulder
  { x: 0.05, y: 1.6, z: 0.45, r: 0.44 }, // front skirt
  { x: -0.04, y: 1.66, z: -0.43, r: 0.42 }, // back skirt
  { x: 0.22, y: 2.24, z: 0.08, r: 0.37 }, // top-right lobe
  { x: -0.22, y: 2.2, z: -0.05, r: 0.35 }, // top-left lobe
  { x: 0.0, y: 2.3, z: -0.13, r: 0.27 }, // crown tip
];

/** One leaf clump: a squashed main blob with a low ring of three smaller lobes (oak style). */
function clumpShape(c: Clump, i: number): Sdf {
  const main = sdf.ellipsoid([c.r * 1.05, c.r * 0.9, c.r * 1.02]).at(c.x, c.y, c.z);
  const lobes: Sdf[] = [];
  for (let j = 0; j < 3; j++) {
    const a = (j / 3) * Math.PI * 2 + noise.random(i, j, 1) * 1.7 + i * 0.9;
    const lr = c.r * (0.4 + 0.12 * noise.random(i, j, 7));
    lobes.push(
      sdf.ellipsoid([lr, lr * 0.82, lr]).at(
        c.x + Math.cos(a) * c.r * 0.86,
        c.y - c.r * 0.42 + (noise.random(i, j, 13) - 0.5) * c.r * 0.3,
        c.z + Math.sin(a) * c.r * 0.86,
      ),
    );
  }
  return sdf.smoothUnion(0.07, main, ...lobes);
}

/** Nearest clump to a point, used so every blob lights itself: dark rim, bright top. */
function nearestClump(x: number, y: number, z: number): Clump {
  let best = clumps[0]!;
  let bestD = Infinity;
  for (const c of clumps) {
    const d = (x - c.x) ** 2 + (y - c.y) ** 2 + (z - c.z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export default defineAsset({
  name: 'apple-tree',
  description:
    'Stylized chibi apple tree, 2.6 m tall: bent trunk, round lobed crown dotted with red apples, three fallen apples at its feet.',
  detail: 0.02,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/apple-tree-mock.jpg',

  build(k) {
    // ------------------------------------------------------------------ bark
    // Sturdy trunk that leans toward +X mid-height and returns at the fork.
    const trunk = sdf.chain(
      [
        [0, -0.08, 0, 0.32],
        [0.05, 0.3, 0.02, 0.26],
        [0.12, 0.68, 0.05, 0.22],
        [0.1, 0.98, 0.03, 0.19],
        [0.02, 1.18, 0.0, 0.16],
      ],
      0.1,
    );
    const limbs = sdf.union(
      sdf.chain(
        [
          [0.05, 1.08, 0, 0.16],
          [-0.4, 1.44, 0.12, 0.11],
          [-0.56, 1.68, 0.16, 0.08],
        ],
        0.08,
      ),
      sdf.chain(
        [
          [0.05, 1.08, 0, 0.16],
          [0.46, 1.42, -0.08, 0.11],
          [0.62, 1.7, -0.12, 0.08],
        ],
        0.08,
      ),
      sdf.chain(
        [
          [0.05, 1.08, 0, 0.15],
          [0.02, 1.42, -0.4, 0.1],
          [0.05, 1.72, -0.52, 0.07],
        ],
        0.08,
      ),
      sdf.chain(
        [
          [0.05, 1.05, 0, 0.14],
          [0.14, 1.36, 0.38, 0.09],
          [0.2, 1.6, 0.48, 0.06],
        ],
        0.08,
      ),
    );
    const roots = sdf.union(
      ...Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + 0.5;
        const len = 0.46 + noise.random(i, 5, 2) * 0.14;
        return sdf.cone([0, 0.5, 0], [Math.cos(a) * len, 0.03, Math.sin(a) * len], 0.26, 0.09);
      }),
    );
    const ridges = (x: number, y: number, z: number): number => noise.fbm(x * 9, y * 2.6, z * 9, 3, 41);
    const wood = sdf
      .smoothUnion(0.09, trunk, limbs, roots)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .displace(0.008, (x, y, z) => noise.fbm(x * 5, y * 1.8, z * 5, 2, 31))
      .paintFn((x, y, z) => {
        const groove = Math.max(0, -ridges(x, y, z));
        const base = mixRgb(bark, barkDeep, Math.min(1, groove * 1.6));
        const flare = clamp01(1 - y / 0.55) * (0.4 + 0.45 * noise.fbm(x * 3, y * 3, z * 3, 2, 9));
        return mixRgb(base, barkLight, flare * 0.4);
      });
    k.body('trunk', wood, {
      color: '#8a5a35',
      roughness: 0.85,
      detail: 0.05,
      paintWeight: 2,
      bump: (x, y, z) => 0.005 * ridges(x, y, z),
    });

    // ------------------------------------------------------------------ crown
    const crown = sdf
      .smoothUnion(0.22, ...clumps.map(clumpShape))
      .displace(0.045, (x, y, z) => noise.fbm(x * 1.4, y * 1.4, z * 1.4, 2, 5))
      .paintFn((x, y, z) => {
        const c = nearestClump(x, y, z);
        // 0 under this clump, 1 at its top; a global gradient adds altitude light.
        const local = clamp01(((y - c.y) / c.r) * 0.6 + 0.45);
        const global = clamp01((y - 1.3) / 1.5);
        const patch = 0.5 + 0.5 * noise.fbm(x * 2.6, y * 2.6, z * 2.6, 2, 21);
        const wob = 0.08 * noise.fbm(x * 1.8, y * 1.8, z * 1.8, 2, 33);
        const band = smoothstep(0.28, 0.78, local + wob);
        const base = mixRgb(leafDark, leaf, band * (0.86 + 0.14 * patch));
        const under = smoothstep(0.3, 0.0, local);
        const shaded = mixRgb(base, leafShadow, under * 0.85);
        const top = smoothstep(0.6, 0.95, local);
        const lift = top * (0.45 + 0.55 * global) * (0.55 + 0.45 * patch);
        const lit = mixRgb(shaded, leafLight, lift);
        const n = noise.fbm(x * 1.3, y * 1.3, z * 1.3, 2, 7);
        return n >= 0 ? mixRgb(lit, leafLight, n * 0.12) : mixRgb(lit, leafShadow, -n * 0.14);
      });
    k.body('crown', crown, {
      color: '#5cb85c',
      roughness: 0.72,
      detail: 0.04,
      paintWeight: 3,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 15, y * 15, z * 15, 2, 3),
    });

    // ------------------------------------------------------------------ apples
    // Nine canopy apples probed onto the crown surface (embedded halfway), three fallen.
    const canopySpots: readonly (readonly [number, number, number])[] = [
      [-0.45, 1.7, 0.52],
      [0.46, 1.78, 0.46],
      [0.0, 1.64, 0.55],
      [-0.66, 1.86, 0.15],
      [0.64, 1.9, 0.05],
      [0.38, 2.1, -0.42],
      [-0.34, 2.26, -0.2],
      [0.22, 2.4, 0.16],
      [0.0, 2.0, 0.44],
    ];
    const appleParts: Sdf[] = [];
    const stemParts: Sdf[] = [];
    const leafParts: Sdf[] = [];
    const leafOutline = profile.polygon(
      [
        [0, 0],
        [0.014, 0.017],
        [0.038, 0.015],
        [0.062, 0],
        [0.038, -0.015],
        [0.014, -0.017],
      ],
      { smooth: true, samples: 8 },
    );
    const leafAt = (x: number, y: number, z: number, yawDeg: number, tiltDeg: number, s: number): Sdf =>
      sdf
        .extrude(leafOutline, 0.008, 0.003)
        .scale(s)
        .rotateX(-90)
        .rotateZ(tiltDeg)
        .rotateY(yawDeg)
        .at(x, y, z);

    for (let i = 0; i < canopySpots.length; i++) {
      const g = canopySpots[i]!;
      const p = sdf.surfacePoint(crown, [g[0], g[1], g[2]], 0.006);
      const r = 0.095 + noise.random(i, 3, 11) * 0.02;
      appleParts.push(sdf.sphere(r).scale([1, 0.92, 1]).at(p[0], p[1] + r * 0.15, p[2]));
      // Short stem and one small leaf at the apple top.
      const top: [number, number, number] = [
        p[0] + (noise.random(i, 1, 5) - 0.5) * 0.07,
        p[1] + r * 1.5,
        p[2] + (noise.random(i, 2, 5) - 0.5) * 0.07,
      ];
      stemParts.push(sdf.cone([p[0], p[1] + r * 0.7, p[2]], top, 0.016, 0.008));
      leafParts.push(
        leafAt(top[0], top[1] + 0.012, top[2], noise.random(i, 7, 9) * 360, 48 + noise.random(i, 8, 9) * 20, 1.25),
      );
    }
    // Three fallen apples resting on the grass, one with a leaf.
    const fallen: readonly (readonly [number, number, number, number])[] = [
      [0.5, 0.08, 0.42, 0.09],
      [-0.42, 0.085, 0.5, 0.095],
      [0.08, 0.075, 0.66, 0.085],
    ];
    for (let i = 0; i < fallen.length; i++) {
      const [fx, fy, fz, fr] = fallen[i]!;
      appleParts.push(sdf.sphere(fr).scale([1, 0.88, 1]).at(fx, fy, fz));
      stemParts.push(sdf.cone([fx, fy + fr * 0.5, fz], [fx + 0.025, fy + fr * 1.4, fz + 0.015], 0.014, 0.007));
      if (i !== 1) {
        leafParts.push(leafAt(fx + 0.03, fy + fr * 1.35, fz + 0.02, noise.random(i, 4, 3) * 360, 20, 1.1));
      }
    }
    const apples = sdf
      .union(...appleParts)
      .paintFn((x, y, z) => {
        // Warm highlight toward the light, deeper red at the bottom, like assets/apple.ts.
        const d = (x * 0.5 + y * 0.45 + z * 0.75) / 0.1;
        const hi = clamp01((d - 0.45) / 0.6);
        const shade = clamp01((0.35 - y) / 0.35);
        let c = mixRgb(appleRed, appleHi, hi * hi * 0.55);
        c = mixRgb(c, appleDark, shade * 0.5);
        return c;
      });
    k.body('apples', apples, {
      color: '#d93a2b',
      roughness: 0.35,
      metalness: 0,
      detail: 0.022,
      textureDensity: 2,
      paintWeight: 2,
    });
    k.body('stems', sdf.union(...stemParts), { color: stemC, roughness: 0.85, detail: 0.012 });
    k.body('apple-leaves', sdf.union(...leafParts), {
      color: '#4f9a3a',
      roughness: 0.55,
      metalness: 0,
      detail: 0.012,
    });
  },
});
