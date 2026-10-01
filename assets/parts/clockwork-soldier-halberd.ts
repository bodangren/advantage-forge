import { noise, profile, sdf, type Part, type PartTint } from '../../src/index.js';

/**
 * Clockwork soldier halberd (part of `assets/clockwork-soldier.ts`; standalone
 * `assets/clockwork-soldier-halberd.ts`).
 *
 * A steel pole with a spike, a crescent axe blade with a brass-lit edge, and brass collars.
 * Class: hand-held. Local frame: the origin is the fist center, the pole along +Y from -0.235 to
 * 0.765, the blade toward -X, its flat in the XY plane.
 * Bodies: halberd, halberd-trim (bone `weapon`).
 * Tint slot: `metal` (the collars) and the lit blade edge (`metal`, color #c4a45a).
 */

const C = { steel: '#6a6a70', brassLit: '#c4a45a' };
type V3 = readonly [number, number, number];
type Rgb = readonly [number, number, number];
const clamp1 = (c: Rgb): Rgb => [Math.min(1, c[0]), Math.min(1, c[1]), Math.min(1, c[2])];
const scaleRgb = (c: Rgb, m: number): Rgb => clamp1([c[0] * m, c[1] * m, c[2] * m]);
const mixRgbA = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t, a[2] * (1 - t) + b[2] * t];
/**
 * Weathered brass. The surface direction is read from the height on the part (top-light 1.27,
 * undersides 0.58 of the base, the mockup's #c4a45a and #5a4420 against #9a7a36), then pitting
 * (#6a5228 is 0.69 of the base), broad oil stains, and dark oil streaks dripping below each rivet
 * of `rivets` (#4a3a20 is 0.48 of the base). Multiplying the base keeps the metal slot's recolor.
 */
const weathered = (o: { cy: number; hy: number; bias?: number; rivets?: readonly V3[] }) => (x: number, y: number, z: number, base: Rgb): Rgb => {
  const u = Math.max(-1, Math.min(1, (y - o.cy) / o.hy));
  let m = (u >= 0 ? 1 + 0.27 * u : 1 + 0.42 * u) * (1 + (o.bias ?? 0));
  const pit = noise.fbm(x * 95, y * 95, z * 95, 2);
  const stain = noise.fbm(x * 7 + 3.1, y * 7, z * 7 - 2.2, 2);
  if (pit > 0.58) m *= 0.69;
  else if (stain > 0.28) m *= 0.8;
  if (o.rivets) {
    for (const r of o.rivets) {
      const len = 0.03 + 0.03 * noise.random(Math.round(r[0] * 1000), Math.round(r[1] * 1000), Math.round(r[2] * 1000));
      const drop = r[1] - y;
      if (drop > 0 && drop < len && Math.hypot(x - r[0], z - r[2]) < 0.004 + 0.0015 * noise.noise3(x * 300, y * 60, z * 300)) {
        m *= 1 - 0.52 * (1 - drop / len);
        break;
      }
    }
  }
  return scaleRgb(base, m);
};
const brassPaint = weathered({ cy: 0.4, hy: 0.4 });
const dents = (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 45, y * 45, z * 45, 2);

export function clockworkSoldierHalberd(tint: PartTint): Part {
  const SLOT = {
    brass: tint('metal'),
    brassLit: tint('metal', { color: C.brassLit, follow: 1 }),
  };
    const pole = sdf.cylinder(0.0155, 0.72, 0.004).at(0, 0.125, 0); // -0.235 to 0.485
    const shaftUp = sdf.cylinder(0.0155, 0.26, 0.004).at(0, 0.49, 0); // to 0.62
    const spike = sdf.cone([0, 0.6, 0], [0, 0.765, 0], 0.026, 0.003).round(0.002);
    const butt = sdf.cone([0, -0.235, 0], [0, -0.26, 0], 0.014, 0.004).round(0.002);
    const BY = 0.47; // blade center height
    const bladeD = profile.polygon(
      [
        [0.0, BY + 0.14],
        [-0.07, BY + 0.135],
        [-0.15, BY + 0.1],
        [-0.208, BY + 0.03],
        [-0.208, BY - 0.03],
        [-0.15, BY - 0.1],
        [-0.07, BY - 0.135],
        [0.0, BY - 0.14],
      ],
      { smooth: true, samples: 5 },
    );
    const bladeShape = sdf
      .extrude(bladeD, 0.02, 0.004)
      .subtract(sdf.cylinder(0.13, 0.1).rotateX(90).at(0.09, BY, 0))
      .paintWhere(sdf.box([0.05, 0.4, 0.2]).at(-0.208, BY, 0), SLOT.brassLit, 0.006)
      .paintFn((x, y, z, base) => scaleRgb(base, noise.fbm(x * 40, y * 40, z * 40, 2) > 0.45 ? 1.25 : 1));
    const bladeMount = sdf.box([0.05, 0.3, 0.032], 0.01).at(-0.005, BY, 0);
    const halberdShape = sdf.union(pole, shaftUp, spike, butt, bladeShape, bladeMount);
    const halberdOpt = {
      color: C.steel,
      roughness: 0.42,
      metalness: 0.7,
      detail: 0.004,
      bump: dents,
    };
    const collars = sdf.union(
      ...[0.325, 0.6].map((y) => sdf.cylinder(0.022, 0.02, 0.006).at(0, y, 0)),
      sdf.cylinder(0.02, 0.05, 0.006).at(0, 0.11, 0),
      sdf.cylinder(0.021, 0.03, 0.006).at(0, -0.17, 0),
    );
    
  return {
    name: 'clockwork-soldier-halberd',
    bodies: [
      { name: 'halberd', shape: halberdShape, options: halberdOpt, bone: 'weapon' },
      { name: 'halberd-trim', shape: collars.paintFn(brassPaint), options: { color: SLOT.brass, roughness: 0.4, metalness: 0.8, detail: 0.004 }, bone: 'weapon' },
    ],
  };
}
