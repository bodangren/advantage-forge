import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Moss tuft — dungeon ground dressing (catalog `dungeon/dressing/moss-tuft`).
 *
 * - Role: low dungeon-floor dressing; a soft patch that reads at 128 px, no rig.
 * - Size: mound ~0.4 m across, crown near y = 0.08, blades to ~0.19 m; on y = 0, facing +Z.
 * - One idea: a squat mossy cushion with four grassy tufts spraying low and outward.
 * - Shape language: round dominant (cushion, chunky blades); low flat secondary (flush profile).
 * - Palette: teal-green #3fae9a (tips, lit moss) mixed toward deep slate green #1e3d36
 *   (recesses, mound underside); pale tip accent #8fd8c2 kept small.
 * - Materials: matte moss (roughness 0.9), blades (roughness 0.85), no metal, no emissive.
 * - Detail: lumpy mound (big), 4 tuft clumps of 5-7 chunky blades (medium, focal),
 *   noise grain in paint + bump (small). Focal point: the tall center-front tuft.
 * - Rig: none.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const TEAL = rgb('#3fae9a');
const SLATE_DARK = rgb('#1e3d36');
const SLATE_MID = rgb('#27544a');
const TIP_LIGHT = rgb('#8fd8c2');

const RX = 0.2;
const RY = 0.07;
const RZ = 0.16;
const CY = 0.01;

/** Mound top height at (x, z). */
const moundTop = (x: number, z: number): number => {
  const q = 1 - (x / RX) ** 2 - (z / RZ) ** 2;
  return CY + RY * Math.sqrt(Math.max(0, q));
};

interface BladeSpec {
  /** Base position (embedded in the mound). */
  readonly base: readonly [number, number, number];
  /** Tip position. */
  readonly tip: readonly [number, number, number];
  /** Base radius. */
  readonly r: number;
}

/** One clump: chunky blades fan outward from a center, taller in the middle. */
const clump = (cx: number, cz: number, seed: number, scale: number): BladeSpec[] => {
  const n = 5;
  const out: BladeSpec[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((i * 360) / n + seed * 37) * (Math.PI / 180);
    const edge = i === 0 ? 0 : 1; // first blade stands upright in the middle
    const lean = edge === 0 ? 5 + noise.random(i, seed) * 6 : 20 + noise.random(i, seed + 9) * 22;
    const h = (edge === 0 ? 0.125 : 0.07 + noise.random(i, seed + 4) * 0.05) * scale;
    const baseY = moundTop(cx, cz) - 0.03;
    const leanR = (lean * Math.PI) / 180;
    const tip: [number, number, number] = [
      cx + (edge === 0 ? 0 : Math.sin(leanR) * h * Math.cos(a)),
      baseY + Math.cos(leanR) * h,
      cz + (edge === 0 ? 0 : Math.sin(leanR) * h * Math.sin(a)),
    ];
    out.push({ base: [cx, baseY, cz], tip, r: (edge === 0 ? 0.021 : 0.017) * scale });
  }
  return out;
};

const bladeShape = (b: BladeSpec): Sdf =>
  sdf.cone([b.base[0], b.base[1], b.base[2]], [b.tip[0], b.tip[1], b.tip[2]], b.r, 0.0018);

export default defineAsset({
  name: 'moss-tuft',
  description:
    'A low patch of dungeon moss: soft rounded teal-green mound with four grassy tuft clumps.',
  detail: 0.005,
  texture: { size: 1024 },

  build(k) {
    // --------------------------------------------------------------- mound
    // Squat cushion cut flat at y = 0, crown just under 0.08, lumpy silhouette.
    const mound = sdf
      .ellipsoid([RX, RY, RZ])
      .at(0, CY, 0)
      .displace(0.008, (x, y, z) => noise.fbm(x * 14, y * 14, z * 14, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        const t = clamp01(y * 9 + 0.2);
        const v = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
        // Deep slate recesses low and at the rim, teal only on the lit crown.
        let c = mixRgb(SLATE_DARK, SLATE_MID, clamp01(t * 0.8 + (v - 0.5) * 0.3));
        c = mixRgb(c, TEAL, clamp01((t - 0.45) * 1.6 + (v - 0.5) * 0.3));
        const rim = clamp01((Math.hypot(x / RX, z / RZ) - 0.72) / 0.28);
        c = mixRgb(c, SLATE_DARK, rim * 0.55);
        // Moss speckle: pale flecks where the crown catches light.
        const speck = noise.fbm(x * 46, y * 46 + 3, z * 46, 2);
        c = mixRgb(c, TIP_LIGHT, clamp01((speck - 0.42) * 3) * clamp01(t * 1.2) * 0.5);
        return c;
      });
    k.body('mound', mound, {
      color: '#27544a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 600,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // --------------------------------------------------------------- tufts
    // Four clumps: big front-center focal, two flanks, one low back.
    const specs: BladeSpec[] = [
      ...clump(0.0, 0.05, 3, 1.15),
      ...clump(-0.125, -0.01, 11, 0.95),
      ...clump(0.125, -0.02, 23, 0.95),
      ...clump(0.01, -0.1, 37, 0.8),
    ];
    const tufts = sdf
      .smoothUnion(
        0.008,
        ...specs.map((b) => bladeShape(b)),
      )
      .paintFn((x, y, z) => {
        const t = clamp01((y - 0.03) / 0.13);
        const v = 0.5 + 0.5 * noise.fbm(x * 22 + 7, y * 22, z * 22, 2);
        let c = mixRgb(SLATE_DARK, TEAL, clamp01(0.2 + t * 0.9 + (v - 0.5) * 0.35));
        c = mixRgb(c, TIP_LIGHT, clamp01((t - 0.62) / 0.38) * (0.35 + v * 0.3));
        return c;
      });
    k.body('tufts', tufts, {
      color: '#3fae9a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 1200,
      paintWeight: 2,
    });
  },
});
