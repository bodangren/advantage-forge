import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — kite shield (equipment/armor/kite-shield).
 *
 * Role: smithy equipment icon and pickup. It must read at 128 px.
 * Size: 0.8 m tall, about 0.70 m wide, face toward +Z, point on y = 0.
 * One idea: a plump teardrop kite with a steel rim and a bold white chevron.
 * Shape language: round dominant (arched top, pointed base, raised rim, stud rivets).
 * Palette: blue field #2f6aa8 (dominant), steel rim #c8ccd2, white chevron #f2eadb.
 *   Iron #4a4f55 / #363a3f and highlight #a8acb1 shade the steel. Walnut strap #6b4226 / #54331d.
 * Materials: enamel field, steel plate and rim, enamel chevron, walnut leather strap.
 * Detail: domed plate, raised rim, studs, chevron, bowed strap. Focal point: the chevron.
 * Rig: none. Static item.
 */

const BLUE = '#2f6aa8';
const BLUE_LIGHT = '#6aa4d4';
const BLUE_DARK = '#143868';
const WHITE = '#f2eadb';
const STEEL = '#c8ccd2';
const STEEL_HI = '#a8acb1';
const IRON = '#4a4f55';
const IRON_DARK = '#363a3f';
const WALNUT = '#6b4226';
const WALNUT_DARK = '#54331d';

// Visual outline. The point is on y = 0. The top is a broad arch.
const kite = profile.polygon(
  [
    [0, 0],
    [0.05, 0.026],
    [0.105, 0.07],
    [0.17, 0.14],
    [0.235, 0.23],
    [0.29, 0.34],
    [0.33, 0.46],
    [0.348, 0.57],
    [0.342, 0.66],
    [0.305, 0.735],
    [0.235, 0.775],
    [0.14, 0.795],
    [0.05, 0.8],
    [0, 0.8],
    [-0.05, 0.8],
    [-0.14, 0.795],
    [-0.235, 0.775],
    [-0.305, 0.735],
    [-0.342, 0.66],
    [-0.348, 0.57],
    [-0.33, 0.46],
    [-0.29, 0.34],
    [-0.235, 0.23],
    [-0.17, 0.14],
    [-0.105, 0.07],
    [-0.05, 0.026],
  ],
  { smooth: true, samples: 4 },
);

const RIM = 0.038;
const fieldProfile = profile.offsetProfile(kite, -RIM);

const DOME_R = 2.8;
const DOME_PEAK = 0.038;
const dome = sdf.sphere(DOME_R).at(0, 0.44, DOME_PEAK - DOME_R);

const steelPaint = (x: number, y: number, z: number) => {
  const hi = Math.min(1, Math.max(0, (y - 0.2) / 0.55));
  const wear = 0.5 + 0.5 * noise.fbm(x * 6, y * 8, z * 5, 2);
  let c = rgb(STEEL);
  c = mixRgb(c, rgb(STEEL_HI), 0.48 * hi * (z > 0.008 ? 1 : 0.12));
  c = mixRgb(c, rgb(IRON), 0.4 * wear * (z < -0.004 ? 1 : 0.08));
  c = mixRgb(c, rgb(IRON_DARK), z < -0.018 ? 0.5 : 0);
  return c;
};

export default defineAsset({
  name: 'kite-shield',
  description:
    'Kite shield with a domed blue field, a white chevron, a riveted steel rim, and a leather strap on the back.',
  detail: 0.006,
  reference: 'docs/item-mockups/kite-shield-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ steel plate
    const plate = sdf
      .extrude(profile.offsetProfile(kite, -0.008), 0.052, 0.01)
      .at(0, 0, -0.008)
      .paintFn(steelPaint);
    k.body('plate', plate, {
      color: STEEL,
      roughness: 0.46,
      metalness: 0.72,
      detail: 0.008,
      maxTriangles: 900,
    });

    // Raised rim band. A wide fillet on the inner cut keeps reduction from folding.
    const rim = sdf
      .extrude(kite, 0.028, 0.008)
      .at(0, 0, 0.028)
      .smoothSubtract(0.012, sdf.extrude(profile.offsetProfile(kite, -0.042), 0.09).at(0, 0, 0.028))
      .paintFn(steelPaint);
    k.body('rim', rim, {
      color: STEEL,
      roughness: 0.38,
      metalness: 0.8,
      detail: 0.007,
      maxTriangles: 1400,
    });

    // ------------------------------------------------------------------ blue enamel field
    const field = sdf
      .extrude(fieldProfile, 0.032, 0.006)
      .at(0, 0, 0.014)
      .intersect(dome)
      .paintFn((x, y, z) => {
        const up = Math.min(1, Math.max(0, (y - 0.12) / 0.62));
        const face = Math.min(1, Math.max(0, (z - 0.008) / 0.026));
        const edge = Math.min(1, Math.max(0, (fieldProfile.dist(x, y) + 0.026) / 0.026));
        let c = rgb(BLUE);
        c = mixRgb(c, rgb(BLUE_LIGHT), 0.62 * up * face * (1 - edge * 0.35));
        c = mixRgb(c, rgb(BLUE_DARK), 0.7 * edge + 0.42 * (1 - up));
        return c;
      });
    k.body('field', field, {
      color: BLUE,
      roughness: 0.5,
      metalness: 0.05,
      detail: 0.0065,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 1200,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 22, y * 22, z * 8, 2),
    });

    // ------------------------------------------------------------------ white chevron
    // A pointed band. The outer apex and the inner notch keep it a chevron, not a cross.
    const chevron = sdf.extrude(
      profile.polygon(
        [
          [0, 0.66],
          [0.21, 0.35],
          [0.162, 0.31],
          [0.048, 0.5],
          [0, 0.545],
          [-0.048, 0.5],
          [-0.162, 0.31],
          [-0.21, 0.35],
        ],
        { smooth: true, samples: 3 },
      ),
      0.028,
      0.008,
    ).at(0, 0, 0.036);
    k.body('chevron', chevron, {
      color: WHITE,
      roughness: 0.4,
      metalness: 0.02,
      detail: 0.005,
      textureDensity: 2,
      maxTriangles: 600,
    });

    // Studs sit on the rolled rim. Two darker pins hold the strap.
    const studSpots: ReadonlyArray<readonly [number, number]> = [
      [0, 0.768],
      [0.14, 0.75],
      [0.26, 0.66],
      [0.3, 0.53],
      [0.255, 0.36],
      [0.14, 0.18],
      [0.048, 0.055],
    ];
    const stud = (x: number, y: number) => sdf.sphere(0.015).scale([1, 1, 0.55]).at(x, y, 0.044);
    const studs = sdf.union(
      ...studSpots.flatMap(([x, y]) => (x === 0 ? [stud(0, y)] : [stud(x, y), stud(-x, y)])),
    );
    const pin = (x: number) => sdf.cylinder(0.02, 0.01, 0.003).rotateX(90).at(x, 0.4, -0.06);
    const pinStencil = pin(-0.092).round(0.004).union(pin(0.092).round(0.004));
    k.body('studs', sdf.union(studs, pin(-0.092), pin(0.092)).paintFn(steelPaint).paintWhere(pinStencil, IRON_DARK, 0.004), {
      color: STEEL,
      roughness: 0.4,
      metalness: 0.75,
      detail: 0.005,
      maxTriangles: 480,
    });

    // ------------------------------------------------------------------ leather strap on the back
    const strap = sdf
      .union(
        sdf.box([0.05, 0.044, 0.032], 0.008).at(-0.09, 0.4, -0.046),
        sdf.box([0.05, 0.044, 0.032], 0.008).at(0.09, 0.4, -0.046),
        sdf.box([0.2, 0.044, 0.016], 0.006).at(0, 0.4, -0.064),
      )
      .paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 14, y * 8, z * 14, 2);
        const edge = Math.min(1, Math.max(0, (Math.abs(y - 0.4) - 0.012) / 0.01));
        return mixRgb(rgb(WALNUT), rgb(WALNUT_DARK), 0.4 * n + 0.4 * edge);
      });
    k.body('strap', strap, {
      color: WALNUT,
      roughness: 0.66,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 380,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 28, y * 12, z * 28, 2),
    });
  },
});
