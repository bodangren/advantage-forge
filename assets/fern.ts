import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Fern — forest dressing (catalog `forest/dressing/fern`): about 0.5 m tall, 0.7 m wide,
 * standing on y = 0 and facing +Z. No rig, no clips.
 *
 * - Role: forest-floor set dressing beside bushes and wildflowers; reads at the 128 px sprite size.
 * - One idea: seven slim arching fronds spring from one low crown, rise steep, bow over,
 *   and end in light green tips; painted chevron rows say "leaflets" without extra geometry.
 * - Shape language: round and soft (tapered tube fronds, domed crown); painted chevrons are
 *   the only crisp accent, so the plant stays friendly beside the hamlet set.
 * - Palette: deep green #2f7a3f body, lighter tips #4a9a4f, sunny ridge #7ec850 on the top
 *   of the outer fronds, dark chevron marks #1b4a26, shaded base #22572e, darkest crown #173f21.
 *   Value plan: dark crown and base, mid fronds, light tips.
 * - Materials: matte foliage — roughness 0.78 fronds, 0.85 crown, metalness 0.
 * - Detail: (1) mottled dome crown, (2) seven arching fronds, (3) two curled young shoots,
 *   (4) painted chevrons plus sunny ridge. Focal point: the light arching tips.
 * - Budget: detail values keep the raw mesh close to the caps (about 2,600 total triangles),
 *   so reduction stays gentle, the build prints no warning, and tips never break up.
 */

const DEG = Math.PI / 180;

type V3 = [number, number, number];
/** Spine control point: x, y, z, radius. */
type Sp = [number, number, number, number];

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

const DEEP = rgb('#2f7a3f'); // frond body deep green
const TIP = rgb('#4a9a4f'); // lighter frond tips
const LIGHT = rgb('#7ec850'); // sunny top ridge toward the tips
const MARK = rgb('#173f21'); // chevron leaflet marks
const SHADE = rgb('#22572e'); // shaded frond base
const DARK = rgb('#12351b'); // crown underside

const BASE: V3 = [0.055, 0.04, 0];

interface Frond {
  /** Direction in degrees: 0 = +Z (front), 90 = +X (asset left). */
  readonly az: number;
  /** Cubic Bezier controls of the spine in the local frame (base first, tip last). */
  readonly p1: V3;
  readonly p2: V3;
  readonly p3: V3;
  /** Radius at the crown end, meters. */
  readonly r0: number;
  /** Painted leaflet rows along the frond. */
  readonly marks: number;
}

const R1 = 0.023; // shared tip radius
const K = 0.016; // shared joint blend

/** Sample a cubic Bezier into a 11-point spine with a soft, near-linear taper. */
const spineOf = (f: Frond): Sp[] => {
  const out: Sp[] = [];
  for (let i = 0; i <= 10; i++) {
    const s = i / 10;
    const u = 1 - s;
    const b0 = u * u * u;
    const b1 = 3 * u * u * s;
    const b2 = 3 * u * s * s;
    const b3 = s * s * s;
    const x = b0 * BASE[0] + b1 * f.p1[0] + b2 * f.p2[0] + b3 * f.p3[0];
    const y = b0 * BASE[1] + b1 * f.p1[1] + b2 * f.p2[1] + b3 * f.p3[1];
    const z = b0 * BASE[2] + b1 * f.p1[2] + b2 * f.p2[2] + b3 * f.p3[2];
    const r = R1 + (f.r0 - R1) * Math.pow(1 - s, 1.2);
    out.push([x, y, z, r]);
  }
  return out;
};

/**
 * Seven mature fronds. The second control sits high and far out so the curve bows over and
 * the tip leaves at about -22 degrees — an arch, not a shepherd's crook. Shorter fronds spread
 * wider, so the dome silhouette keeps big, medium, and small steps.
 */
const FRONDS: readonly Frond[] = [
  { az: 8, p1: [0.18, 0.62, 0], p2: [0.24, 0.475, 0], p3: [0.33, 0.44, 0], r0: 0.032, marks: 8 },
  { az: 56, p1: [0.17, 0.65, 0], p2: [0.22, 0.49, 0], p3: [0.3, 0.455, 0], r0: 0.03, marks: 8 },
  { az: 105, p1: [0.19, 0.6, 0], p2: [0.26, 0.465, 0], p3: [0.345, 0.43, 0], r0: 0.034, marks: 9 },
  { az: 158, p1: [0.16, 0.67, 0], p2: [0.205, 0.5, 0], p3: [0.28, 0.465, 0], r0: 0.029, marks: 8 },
  { az: 208, p1: [0.19, 0.61, 0], p2: [0.255, 0.47, 0], p3: [0.34, 0.435, 0], r0: 0.033, marks: 9 },
  { az: 262, p1: [0.175, 0.635, 0], p2: [0.235, 0.48, 0], p3: [0.315, 0.445, 0], r0: 0.031, marks: 8 },
  { az: 316, p1: [0.19, 0.59, 0], p2: [0.26, 0.46, 0], p3: [0.35, 0.425, 0], r0: 0.034, marks: 9 },
  // two young shoots: short upright hooks that catch the light early
  { az: 133, p1: [0.07, 0.15, 0], p2: [0.11, 0.2, 0], p3: [0.15, 0.185, 0], r0: 0.023, marks: 4 },
  { az: 238, p1: [0.06, 0.12, 0], p2: [0.09, 0.16, 0], p3: [0.125, 0.145, 0], r0: 0.023, marks: 4 },
];

/**
 * Paint one frond in world coordinates: shaded base, deep mid, light tip, sunny top ridge,
 * and chevron leaflet rows that sweep from the rachis toward the tip.
 */
const makePaint = (f: Frond) => {
  const beta = (f.az - 90) * DEG;
  const cb = Math.cos(beta);
  const sb = Math.sin(beta);
  const sp = spineOf(f);
  const last = sp.length - 1;
  return (x: number, y: number, z: number, _base: Rgb): Rgb => {
    // world -> frond local frame (inverse of rotateY)
    const lx = x * cb - z * sb;
    const lz = x * sb + z * cb;
    const ly = y;
    // nearest spine segment gives the parameter t along the frond
    let bi = 0;
    let bu = 0;
    let bd = Infinity;
    for (let i = 0; i < last; i++) {
      const a = sp[i]!;
      const b = sp[i + 1]!;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const dz = b[2] - a[2];
      const len2 = dx * dx + dy * dy + dz * dz;
      let u = ((lx - a[0]) * dx + (ly - a[1]) * dy + (lz - a[2]) * dz) / len2;
      u = u < 0 ? 0 : u > 1 ? 1 : u;
      const ex = lx - (a[0] + dx * u);
      const ey = ly - (a[1] + dy * u);
      const ez = lz - (a[2] + dz * u);
      const d2 = ex * ex + ey * ey + ez * ez;
      if (d2 < bd) {
        bd = d2;
        bi = i;
        bu = u;
      }
    }
    const a = sp[bi]!;
    const b = sp[bi + 1]!;
    const t = (bi + bu) / last;
    const r = Math.max(0.008, a[3] + (b[3] - a[3]) * bu);
    const px = a[0] + (b[0] - a[0]) * bu;
    const py = a[1] + (b[1] - a[1]) * bu;
    const pz = a[2] + (b[2] - a[2]) * bu;
    // in-plane perpendicular of the tangent: distance from the rachis across the blade
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl;
    const ny = tx / tl;
    const relX = lx - px;
    const relY = ly - py;
    const relZ = lz - pz;
    const across = Math.abs(relX * nx + relY * ny) / r;

    // value plan: dark shaded base, deep mid, light tip
    let col = mixRgb(DEEP, TIP, smoothstep(0.4, 1, t));
    col = mixRgb(col, SHADE, (1 - smoothstep(0.02, 0.3, t)) * 0.8);

    // sunny ridge: the part of the tube that faces up catches light toward the tips
    const dist = Math.sqrt(bd) || 1;
    const upFace = Math.max(0, relY / dist);
    col = mixRgb(col, LIGHT, upFace * upFace * smoothstep(0.35, 1, t) * 0.55);

    // chevron leaflet rows: lines bend toward the tip as they leave the rachis
    let ph = t * f.marks - across * 0.55;
    ph -= Math.floor(ph);
    let w = smoothstep(0, 0.1, ph) * (1 - smoothstep(0.46, 0.56, ph));
    w *= smoothstep(0.16, 0.3, t) * (1 - smoothstep(0.92, 0.995, t));
    col = mixRgb(col, MARK, w * 0.9);
    return col;
  };
};

/** Build one frond: tapered chain, softened into a round blade, posed by azimuth. */
const buildFrond = (f: Frond): Sdf =>
  sdf
    .chain(spineOf(f), K)
    .scale([1, 1, 0.8])
    .rotateY(f.az - 90)
    .paintFn(makePaint(f));

export default defineAsset({
  name: 'fern',
  description: 'A forest fern cluster: seven chunky arching fronds and two young shoots over a low green crown, with painted leaflet chevrons.',
  detail: 0.021,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- crown
    // A low mottled dome that hides every frond base, darkest at the ground line.
    const crown = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.12, 0.065, 0.12]).at(0, 0.035, 0),
        sdf.ellipsoid([0.08, 0.055, 0.08]).at(0.05, 0.04, 0.03),
        sdf.ellipsoid([0.07, 0.05, 0.07]).at(-0.045, 0.035, -0.03),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        const t = smoothstep(0, 0.08, y);
        const v = 0.5 + 0.5 * noise.fbm(x * 10, y * 10, z * 10, 2);
        let col = mixRgb(DARK, SHADE, t * (0.7 + 0.3 * v));
        col = mixRgb(col, DEEP, smoothstep(0.04, 0.1, y) * v * 0.55);
        return col;
      });
    k.body('crown', crown, {
      color: '#12351b',
      roughness: 0.85,
      detail: 0.022,
      paintWeight: 2,
      maxTriangles: 450,
    });

    // ------------------------------------------------------------- fronds
    k.body('fronds', sdf.smoothUnion(0.012, ...FRONDS.map(buildFrond)), {
      color: '#2f7a3f',
      roughness: 0.78,
      detail: 0.021,
      paintWeight: 2,
      maxTriangles: 2600,
    });
  },
});
