import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — iron gauntlets (equipment/armor/gauntlets), reworked as closed-fist avatar armor.
 *
 * Role: shop pickup and inventory icon, and the `hands` piece of the chibi avatar. It must read at
 *   128 px as a pair of armored fists, and it must fit the avatar base fists (closed, not open).
 * Size: a pair about 0.46 m wide, 0.30 m tall, 0.18 m deep. On y = 0, centered on the Y axis, fists
 *   toward +Z. Each gauntlet is the avatar left fist and forearm at 2x (the fit scale), grown by
 *   0.016 m (8 mm worn) into an iron shell. The wrist is the socket point.
 * One idea: two chunky iron fists, each with a flared bell cuff, stacked steel finger lames, a
 *   domed knuckle plate, and four brass studs.
 * Shape language: round dominant (fist, dome, bell); square secondary (lame steps, thumb plate).
 * Palette: iron #4a4f55, shadow #363a3f, highlight #a8acb1, steel #c8ccd2, brass #d4a93a studs
 *   (accent), leather #5c3a22 / #8a5a35 strap and cuff lining.
 * Value plan: dark iron shell, light steel plates on top, brass the strongest contrast.
 * Materials: iron (roughness 0.5, metalness 0.7), steel plates (0.4, 0.8), brass (0.3, 1),
 *   leather (0.65, 0).
 * Detail: bell cuff with a lip and a recessed mouth, strap with a brass buckle, three lames, thumb
 *   plate, knuckle dome with four studs. Surface wear in `bump`. No rig.
 *
 * Frames: the shapes are built in the avatar frame (wrist at WRIST), then `place` moves the wrist to
 * the origin, scales by 2, and puts it at [CX, OY, 0]. `equip.origin` is that wrist point.
 */

const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');
const STEEL = rgb('#c8ccd2');
const BRASS_HI = rgb('#f0d48a');
const LEATHER_HI = rgb('#8a5a35');

type V3 = readonly [number, number, number];

// The avatar left wrist and elbow (assets/avatar-base.ts).
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const FIT = 2;
const GROW = 0.008; // worn meters, 0.016 m in the asset
const CX = 0.15;
const OY = 0.178;

// The forearm axis (unit) from the wrist toward the elbow, as two turns of a +Y shape.
const AXIS_LEN = Math.hypot(ELBOW[0] - WRIST[0], ELBOW[1] - WRIST[1], ELBOW[2] - WRIST[2]);
const AXIS: V3 = [
  (ELBOW[0] - WRIST[0]) / AXIS_LEN,
  (ELBOW[1] - WRIST[1]) / AXIS_LEN,
  (ELBOW[2] - WRIST[2]) / AXIS_LEN,
];
const AX_DEG = (Math.asin(AXIS[2]) * 180) / Math.PI;
const AZ_DEG = (Math.asin(-AXIS[0] / Math.cos(Math.asin(AXIS[2]))) * 180) / Math.PI;

/** A shape built along +Y at the origin, laid on the forearm axis at the wrist. */
function onForearm(s: sdf.Shape): sdf.Shape {
  return s.rotateX(AX_DEG).rotateZ(AZ_DEG).at(WRIST[0], WRIST[1], WRIST[2]);
}

/** Avatar frame to the asset frame of the left piece. */
function place(s: sdf.Shape): sdf.Shape {
  return s.at(-WRIST[0], -WRIST[1], -WRIST[2]).scale(FIT).at(CX, OY, 0);
}

// Bell outer radius along the forearm axis (v = worn meters above the wrist).
const BELL: readonly (readonly [number, number])[] = [
  [-0.014, 0.037],
  [-0.004, 0.042],
  [0.012, 0.042],
  [0.028, 0.044],
  [0.04, 0.049],
  [0.05, 0.054],
];
const V_TOP = 0.054;
function bellRadius(v: number): number {
  const first = BELL[0];
  if (first === undefined || v <= first[0]) return first?.[1] ?? 0.04;
  for (let i = 1; i < BELL.length; i++) {
    const a = BELL[i - 1];
    const b = BELL[i];
    if (a === undefined || b === undefined) continue;
    if (v <= b[0]) return a[1] + ((b[1] - a[1]) * (v - a[0])) / (b[0] - a[0]);
  }
  return BELL[BELL.length - 1]?.[1] ?? 0.06;
}

/** A revolved ring of the bell outline between two heights, thickened by `out` and `inn`. */
function bellBand(v0: number, v1: number, out: number, inn: number): sdf.Shape {
  const pts: [number, number][] = [];
  const n = 4;
  for (let i = 0; i <= n; i++) {
    const v = v0 + ((v1 - v0) * i) / n;
    pts.push([bellRadius(v) + out, v]);
  }
  for (let i = n; i >= 0; i--) {
    const v = v0 + ((v1 - v0) * i) / n;
    pts.push([bellRadius(v) - inn, v]);
  }
  return onForearm(sdf.revolve(profile.polygon(pts)).round(0.002));
}

export default defineAsset({
  name: 'gauntlets',
  description:
    'A pair of closed-fist iron gauntlets: flared bell cuffs with leather straps, stacked steel finger lames, a steel thumb plate, and a domed knuckle plate with four brass studs. Worn on the avatar hands.',
  detail: 0.008,
  reference: 'docs/item-mockups/gauntlets-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'hands', fitScale: FIT, origin: [CX, OY, 0] },

  build(k) {
    // ------------------------------------------------------------------ the avatar fist
    const palm = sdf.ellipsoid([0.038, 0.043, 0.044]).at(0.212, 0.2, 0.034);
    const roll = sdf.capsule([0.196, 0.18, 0.06], [0.2, 0.2, 0.072], 0.017);
    const thumbCone = sdf.cone([0.225, 0.215, 0.055], [0.206, 0.205, 0.078], 0.016, 0.013);
    const fist = sdf.smoothUnion(0.018, palm, roll, thumbCone);

    // The bell cuff: a revolved outline with a lip, and a recessed mouth.
    const bellOutline: [number, number][] = [[0, -0.014]];
    for (const [v, r] of BELL) bellOutline.push([r, v]);
    bellOutline.push([0.056, V_TOP], [0.052, V_TOP + 0.003], [0.046, V_TOP], [0.041, V_TOP - 0.012], [0, V_TOP - 0.012]);
    const bell = onForearm(sdf.revolve(profile.polygon(bellOutline)).round(0.003));

    const shell = sdf.smoothUnion(0.012, fist.round(GROW), bell);

    // ------------------------------------------------------------------ steel plates
    const lameAt = (y: number) =>
      fist
        .round(GROW + 0.005)
        .intersect(sdf.box([0.2, 0.011, 0.2]).at(0.2, y, 0.05))
        .intersect(sdf.halfSpace([0, 0, -1], -0.03));
    const lames = sdf.union(lameAt(0.176), lameAt(0.19), lameAt(0.204));

    const thumbPlate = thumbCone.round(GROW + 0.004);

    const front = sdf.raycast(shell, [0.205, 0.192, 0.4], [0, 0, -1]) ?? [0.205, 0.192, 0.085];
    const domeCenter: V3 = [front[0] - 0.002, front[1] + 0.012, front[2] - 0.012];
    const dome = sdf.ellipsoid([0.03, 0.036, 0.02]).at(domeCenter[0], domeCenter[1], domeCenter[2]);
    const lip = bellBand(V_TOP - 0.008, V_TOP + 0.003, 0.003, 0.0);

    const steelWorn = sdf.union(lames, thumbPlate, dome, lip);

    // ------------------------------------------------------------------ brass studs and buckle
    const stud = (y: number): sdf.Shape => {
      const hit = sdf.raycast(sdf.union(shell, dome), [0.2, y, 0.4], [0, 0, -1]) ?? [0.2, y, 0.09];
      return sdf.sphere(0.0065).at(hit[0], hit[1], hit[2] + 0.001);
    };
    const studY = domeCenter[1];
    const studs = sdf.union(stud(studY - 0.022), stud(studY - 0.008), stud(studY + 0.008), stud(studY + 0.022));
    const strapV = 0.026;
    const buckleR = bellRadius(strapV) + 0.0065;
    const buckleAt = onForearm(sdf.box([0.02, 0.016, 0.006], 0.002).at(0.0, strapV, buckleR + 0.0015));
    const brassWorn = sdf.union(studs, buckleAt);

    // ------------------------------------------------------------------ leather
    const strap = bellBand(strapV - 0.007, strapV + 0.007, 0.0045, 0.004);
    const lining = onForearm(sdf.cylinder(0.04, 0.004, 0.001).at(0, V_TOP - 0.012, 0));
    const leatherWorn = sdf.union(strap, lining);

    // ------------------------------------------------------------------ bodies
    const ironPainted = place(shell).paintFn((x, y, z, base) => {
      const wear = 0.5 + 0.5 * noise.fbm(x * 14, y * 10, z * 14, 2);
      const up = Math.max(0, Math.min(1, (y - 0.1) / 0.2));
      let c = mixRgb(base, IRON_HI, 0.22 * up);
      c = mixRgb(c, IRON_DARK, 0.18 * wear);
      return c;
    });
    k.body('iron', ironPainted.mirror('x', 0), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      textureDensity: 1.3,
      paintWeight: 2,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });

    const steelPainted = place(steelWorn).paintFn((x, y, z, base) => {
      const scuff = 0.5 + 0.5 * noise.fbm(x * 22, y * 22, z * 22, 2);
      return mixRgb(mixRgb(base, STEEL, 0.15), IRON_HI, 0.25 * scuff);
    });
    k.body('steel', steelPainted.mirror('x', 0), {
      color: '#7d838a',
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    k.body(
      'leather',
      place(leatherWorn)
        .paintFn((x, y, z, base) => {
          const n = 0.5 + 0.5 * noise.fbm(x * 24, y * 8, z * 24, 2);
          return mixRgb(base, LEATHER_HI, 0.25 + 0.2 * n);
        })
        .mirror('x', 0),
      {
        color: '#5c3a22',
        roughness: 0.65,
        metalness: 0,
        detail: 0.005,
        bump: (x, y, z) => 0.0006 * noise.fbm(x * 30, y * 10, z * 30, 2),
      },
    );

    k.body(
      'brass',
      place(brassWorn)
        .paintFn((x, y, z, base) => mixRgb(base, BRASS_HI, Math.max(0, Math.min(1, (y - 0.1) / 0.2)) * 0.5))
        .mirror('x', 0),
      { color: '#d4a93a', roughness: 0.3, metalness: 1, detail: 0.004 },
    );
  },
});
