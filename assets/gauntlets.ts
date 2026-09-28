import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — iron gauntlets (equipment/armor/gauntlets).
 *
 * Role: shop pickup and inventory icon for chibi heroes. Must read at 128 px as a pair.
 * Size: about 0.62 m wide, 0.20 m tall, 0.16 m deep. On y = 0, centered on the Y axis.
 * One idea: two chunky iron hands on their pinky edges, backs toward +Z — a flared
 *   bell cuff, steel finger lames, and brass knuckle studs facing the camera.
 * Shape language: round dominant (bell, domed lames, studs); square secondary (lame steps).
 * Palette: iron #4a4f55, shadow #363a3f, highlight #a8acb1, steel edge #c8ccd2,
 *   brass #d4a93a studs (accent), leather #5c3a22 / #8a5a35 strap and palm.
 * Materials: worn iron (roughness 0.5, metalness 0.7), brass (0.3, 1), leather (0.65, 0).
 * Detail: bell lip, two lames per finger, chunky thumb, four knuckle studs.
 *   Focal point: the brass studs. No rig.
 *
 * Local frame: +Y back, +Z fingers, +X thumb. place() lays the pinky edge on y = 0.
 */

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');
const STEEL = rgb('#c8ccd2');
const PLATE = rgb('#9aa0a6');
const BRASS_HI = rgb('#f0d48a');
const LEATHER_HI = rgb('#8a5a35');

const SPAN = 0.21;
const LIFT = 0.074;
const TOWARD = -14;

const FINGERS = [
  { x: 0.03, zTip: 0.136, w: 0.022 },
  { x: 0.004, zTip: 0.148, w: 0.024 },
  { x: -0.022, zTip: 0.132, w: 0.022 },
  { x: -0.046, zTip: 0.114, w: 0.02 },
] as const;

function place(s: sdf.Shape): sdf.Shape {
  // Back (+Y) faces +Z, fingers point outward, thumb points up, then a small yaw.
  return s.rotateY(90).rotateX(90).rotateY(TOWARD).at(SPAN, LIFT, 0).mirror('x', 0);
}

function finger(x: number, zTip: number, w: number): sdf.Shape {
  const z0 = 0.046;
  const len = zTip - z0;
  const root = sdf.box([w, 0.022, len * 0.52], 0.005).at(x, 0.05, z0 + len * 0.22);
  const tip = sdf.box([w * 0.82, 0.016, len * 0.48], 0.004).at(x, 0.036, z0 + len * 0.68);
  const cap = sdf.sphere(Math.max(0.009, w * 0.36)).at(x, 0.03, zTip - 0.002);
  return root.smoothUnion(0.004, tip, cap);
}

export default defineAsset({
  name: 'gauntlets',
  description:
    'A pair of iron gauntlets lying side by side: flared bell cuffs, segmented steel finger plates, a leather wrist strap, and brass rivets.',
  detail: 0.008,
  reference: 'docs/item-mockups/gauntlets-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Neck plus a lip ring. The ring is the flare; a soft blend keeps reduction stable.
    const neck = sdf.cone([0, 0.044, -0.09], [0, 0.04, -0.016], 0.046, 0.032).round(0.005);
    const lip = sdf.torus(0.06, 0.01).rotateX(90).at(0, 0.044, -0.088);
    const cuff = neck.smoothUnion(0.006, lip);
    const mouth = sdf.cylinder(0.042, 0.012, 0.002).rotateX(90).at(0, 0.044, -0.092);

    const palm = sdf.ellipsoid([0.05, 0.026, 0.044]).at(0, 0.034, 0.012);
    const backPlate = sdf.ellipsoid([0.042, 0.014, 0.034]).at(0, 0.048, 0.008);
    const fingers = sdf.union(...FINGERS.map((f) => finger(f.x, f.zTip, f.w)));
    const thumb = sdf
      .capsule([0.04, 0.044, 0.0], [0.078, 0.052, 0.022], 0.016)
      .smoothUnion(0.006, sdf.capsule([0.07, 0.05, 0.016], [0.108, 0.046, 0.042], 0.013));

    const ironLocal = cuff
      .smoothUnion(0.008, palm)
      .smoothUnion(0.006, backPlate)
      .smoothUnion(0.006, fingers)
      .smoothUnion(0.008, thumb);

    const plateStencil = sdf.union(
      ...FINGERS.map((f) => {
        const len = f.zTip - 0.046;
        return sdf.box([f.w + 0.008, 0.03, len * 0.9]).at(f.x, 0.046, 0.046 + len * 0.45);
      }),
    );
    const jointStencil = sdf.union(
      ...FINGERS.map((f) => {
        const len = f.zTip - 0.046;
        return sdf.box([f.w + 0.014, 0.032, 0.01]).at(f.x, 0.048, 0.046 + len * 0.46);
      }),
    );

    const ironPainted = ironLocal
      .paintFn((x, y, z, base) => {
        const back = Math.max(0, Math.min(1, (y - 0.032) / 0.028));
        const belly = Math.max(0, Math.min(1, (0.026 - y) / 0.026));
        const wear = 0.5 + 0.5 * noise.fbm(x * 14, y * 10, z * 14, 2);
        let c = mixRgb(base, IRON_HI, 0.28 * back);
        c = mixRgb(c, IRON_DARK, 0.3 * belly);
        c = mixRgb(c, IRON_DARK, 0.1 * wear * (1 - back * 0.5));
        return c;
      })
      .paintWhere(plateStencil, PLATE, 0.004)
      .paintWhere(jointStencil, IRON_DARK, 0.003)
      .paintWhere(sdf.torus(0.062, 0.008).rotateX(90).at(0, 0.044, -0.09), STEEL, 0.004)
      .paintWhere(mouth, IRON_DARK, 0.004);

    const lining = sdf.cylinder(0.036, 0.01, 0.003).rotateX(90).at(0, 0.044, -0.094);
    const strap = sdf.torus(0.038, 0.006).rotateX(90).at(0, 0.04, -0.006);
    const palmPad = sdf.ellipsoid([0.034, 0.01, 0.028]).at(0, 0.014, 0.014);
    const leatherLocal = sdf.union(lining, strap, palmPad).paintFn((x, y, z, base) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 24, y * 8, z * 24, 2);
      return mixRgb(base, LEATHER_HI, 0.32 * Math.max(0, Math.min(1, (y - 0.02) / 0.03)) + 0.1 * n);
    });

    const rivet = (p: [number, number, number], r: number) => {
      const at = sdf.surfacePoint(ironLocal, p, r * 0.4);
      return sdf.sphere(r).at(at[0], at[1], at[2]);
    };
    const brassLocal = sdf
      .union(
        ...FINGERS.map((f, i) => rivet([f.x, 0.09, 0.055], i === 1 ? 0.012 : 0.01)),
        rivet([0.082, 0.086, 0.024], 0.01),
        rivet([0, 0.1, -0.088], 0.008),
        rivet([0.05, 0.07, -0.086], 0.007),
      )
      .paintFn((x, y, z, base) => mixRgb(base, BRASS_HI, Math.max(0, Math.min(1, (y - 0.04) / 0.03)) * 0.5));

    k.body('iron', place(ironPainted), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      textureDensity: 1.3,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });

    k.body('leather', place(leatherLocal), {
      color: '#5c3a22',
      roughness: 0.65,
      metalness: 0,
      detail: 0.008,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 30, y * 10, z * 30, 2),
    });

    k.body('brass', place(brassLocal), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.006,
    });
  },
});
