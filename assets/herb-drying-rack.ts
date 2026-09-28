import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Herb drying rack — village craft prop (catalog `props/craft-and-trade/herb-drying-rack`).
 *
 * Role: a hamlet drying rack. It must read at 128 px as wood poles plus hanging herbs.
 * Size: 1.0 m wide, 1.2 m tall, about 0.72 m deep. It stands on y = 0 and faces +Z.
 * One idea: fat upside-down herb bundles hang from three poles on a rounded A-frame.
 * Shape language: round wood and leaf tips; the A is the triangular secondary shape.
 * Palette: honey oak #b5814a (dominant), warm brown #8a5a35, pale cut #c9a06a,
 *   walnut feet #6b4226, leaf green #5cb85c, lavender #8a5aa8, straw knots #e0bb60,
 *   iron shoes #4a4f55. Light knots and purple tips are the accent.
 * Materials: wood 0.82, herb cloth-matte 0.84, tie cloth 0.88, worn iron 0.5 / 0.7.
 * Detail: two A-frames, three poles, seven tied bundles. Focal point: the front purple bundle.
 * Rig: none.
 */

const HONEY = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const GREEN = rgb('#5cb85c');
const GREEN_DARK = rgb('#2f7a38');
const GREEN_TIP = rgb('#9ed67a');
const GREEN_STEM = rgb('#4a6230');
const PURPLE = rgb('#8a5aa8');
const PURPLE_DARK = rgb('#5a3478');
const PURPLE_TIP = rgb('#d4b0e4');
const PURPLE_STEM = rgb('#4a2858');
const BURLAP = rgb('#c8a86b');
const STRAW = rgb('#e0bb60');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Foot and peak of each A. +X is the asset left. */
const FOOT_X = 0.44;
const PEAK_X = 0.32;
const FOOT_Z = 0.3;
const LEG_R = 0.044;
const FOOT_Y0 = 0.07;
const PEAK_Y = 1.1;

interface Pole {
  readonly y: number;
  readonly z: number;
  readonly r: number;
}

/** High pole sits back, mid pole sits forward, low pole sits back. Herbs can pass. */
const POLES: readonly Pole[] = [
  { y: 0.98, z: -0.04, r: 0.03 },
  { y: 0.68, z: 0.1, r: 0.027 },
  { y: 0.42, z: -0.06, r: 0.026 },
];

const legT = (y: number): number => clamp01((y - FOOT_Y0) / (PEAK_Y - FOOT_Y0));

/** Leg center X at height y. side is -1 (left) or +1 (right). */
const legX = (side: number, y: number): number => side * (FOOT_X + (PEAK_X - FOOT_X) * legT(y));

/** Leg center Z at height y. face is +1 (front, +Z) or -1 (back). */
const legZ = (face: number, y: number): number => face * FOOT_Z * (1 - legT(y));

/** One slanted leg, foot sunk into the shoe, top sunk into the peak cap. */
const leg = (side: number, face: number): Sdf =>
  sdf.capsule(
    [side * FOOT_X, FOOT_Y0, face * FOOT_Z],
    [side * PEAK_X, PEAK_Y, 0],
    LEG_R,
  );

/** Flat round shoe. The bottom face sits on y = 0. */
const shoe = (side: number, face: number): Sdf =>
  sdf.cylinder(0.06, 0.08, 0.016).at(side * FOOT_X, 0.04, face * FOOT_Z);

/** Short rung along Z that joins the front leg to the back leg and carries a pole. */
const rung = (side: number, y: number): Sdf => {
  const span = legZ(1, y) * 2 + 0.08;
  return sdf.cylinder(0.024, span, 0.01).rotateX(90).at(legX(side, y), y, 0);
};

/** Low stretcher so each A reads as a closed frame, not two loose sticks. */
const stretcher = (side: number): Sdf => {
  const y = 0.12;
  const span = legZ(1, y) * 2 + 0.06;
  return sdf.cylinder(0.022, span, 0.01).rotateX(90).at(legX(side, y), y, 0);
};

/**
 * Upside-down bunch. Local origin is the tie. Fat leaves hang nearly straight
 * down, share a neck, and split only at the tips. A wide fan reads as a hand.
 */
const hangingBundle = (len: number): Sdf => {
  const neck = sdf.capsule([0, 0.012, 0], [0, -0.03, 0], 0.016);
  // leanZ, leanX, length scale, base radius. Small leans keep a tied bunch.
  const fans: Array<[number, number, number, number]> = [
    [0, 1, 1, 0.032],
    [-8, 6, 0.96, 0.028],
    [7, -5, 0.94, 0.028],
    [-4, -9, 0.84, 0.024],
    [5, 8, 0.86, 0.024],
    [2, -3, 0.76, 0.022],
  ];
  const leaves = fans.map(([leanZ, leanX, scale, w]) =>
    sdf
      .cone([0, -0.006, 0], [0, -len * scale, 0], w, 0.014)
      .scale([1, 1, 0.74])
      .rotateX(leanX)
      .rotateZ(leanZ),
  );
  return sdf.smoothUnion(0.018, neck, ...leaves);
};

interface Bundle {
  readonly pole: number;
  readonly x: number;
  readonly len: number;
  readonly lean: number;
  readonly tip: number;
  readonly spin: number;
  readonly purple: boolean;
}

/** Seven bundles. X positions stagger so each row shows through the row in front. */
const BUNDLES: readonly Bundle[] = [
  { pole: 0, x: -0.12, len: 0.36, lean: -6, tip: 4, spin: 10, purple: true },
  { pole: 0, x: 0.12, len: 0.32, lean: 7, tip: -3, spin: -18, purple: false },
  { pole: 1, x: -0.2, len: 0.38, lean: -5, tip: -8, spin: 16, purple: false },
  { pole: 1, x: 0.0, len: 0.44, lean: 2, tip: -10, spin: -4, purple: true },
  { pole: 1, x: 0.18, len: 0.34, lean: 8, tip: -6, spin: 24, purple: false },
  { pole: 2, x: -0.08, len: 0.3, lean: -4, tip: 3, spin: -20, purple: false },
  { pole: 2, x: 0.14, len: 0.28, lean: 5, tip: -3, spin: 8, purple: true },
];

const placeBundle = (b: Bundle): Sdf => {
  const pole = POLES[b.pole]!;
  return hangingBundle(b.len).rotateX(b.tip).rotateZ(b.lean).rotateY(b.spin).at(b.x, pole.y, pole.z);
};

/** Stem dark at the tie, leaf color through the mass, light tips. Local -Y is down. */
const herbPaint =
  (stem: ReturnType<typeof rgb>, mid: ReturnType<typeof rgb>, tip: ReturnType<typeof rgb>, dark: ReturnType<typeof rgb>) =>
  (x: number, y: number, z: number) => {
    const n = 0.5 + 0.5 * noise.fbm(x * 11, y * 7, z * 11, 2);
    const leaf = clamp01((-y - 0.02) / 0.05);
    const tips = clamp01((-y - 0.18) / 0.16);
    let c = mixRgb(stem, mid, leaf);
    c = mixRgb(c, tip, tips * (0.4 + 0.35 * n));
    c = mixRgb(c, dark, (1 - n) * 0.28 * (1 - tips));
    return c;
  };

/** Straw ring around the pole, with a knot under the front of the bundle. */
const tieAt = (b: Bundle): Sdf => {
  const pole = POLES[b.pole]!;
  const R = pole.r + 0.013;
  const band = sdf.torus(R, 0.013).rotateZ(90);
  const knot = sdf.sphere(0.026).at(0, -(R + 0.008), 0.014);
  return sdf.smoothUnion(0.007, band, knot).at(b.x, pole.y, pole.z);
};

export default defineAsset({
  name: 'herb-drying-rack',
  description:
    'A honey-oak A-frame herb rack, 1.0 m wide and 1.2 m tall, with three poles and upside-down bundles of green and purple herbs.',
  detail: 0.012,
  reference: 'docs/item-mockups/herb-drying-rack-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const sides = [-1, 1];
    const faces = [-1, 1];

    const legs = sides.flatMap((side) => faces.map((face) => leg(side, face)));
    const shoes = sides.flatMap((side) => faces.map((face) => shoe(side, face)));
    const caps = sides.map((side) => sdf.sphere(0.064).at(side * PEAK_X, 1.14, 0));
    const rungs = sides.flatMap((side) => POLES.map((p) => rung(side, p.y)));
    const stretchers = sides.map((side) => stretcher(side));

    const poles = POLES.map((p) => {
      const half = Math.abs(legX(1, p.y)) + 0.06;
      return sdf.cylinder(p.r, half * 2, 0.012).rotateZ(90).at(0, p.y, p.z);
    });

    const frame = sdf.smoothUnion(0.028, ...legs, ...shoes, ...caps, ...stretchers);
    const braced = sdf.smoothUnion(0.016, frame, ...rungs);
    const wood = sdf.smoothUnion(0.012, braced, ...poles).paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 4.5, y * 3, z * 4.5, 3);
      let c = mixRgb(HONEY, BROWN, 0.22 + 0.4 * grain);
      c = mixRgb(c, WALNUT, clamp01((0.14 - y) / 0.14) * 0.72);
      c = mixRgb(c, PALE, clamp01((Math.abs(x) - 0.34) / 0.1) * 0.55);
      c = mixRgb(c, PALE, clamp01((y - 0.96) / 0.2) * 0.28);
      return c;
    });

    k.body('wood', wood, {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.02,
      maxError: 0.008,
      maxTriangles: 1500,
      paintWeight: 2,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 20, y * 7, z * 20, 2),
    });

    // Iron shoes on the four feet. Solid collars, not thin rings, so they read at sprite size.
    const bands = sides.flatMap((side) =>
      faces.map((face) =>
        sdf.cylinder(0.066, 0.034, 0.01).at(side * FOOT_X, 0.05, face * FOOT_Z),
      ),
    );
    k.body('iron', sdf.union(...bands).paintFn((x, y, z) => {
      const up = clamp01((y - 0.04) / 0.04);
      const n = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
      return mixRgb(IRON_DARK, mixRgb(IRON, IRON_HI, up * 0.6), 0.22 + 0.18 * n);
    }), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.016,
      maxTriangles: 320,
    });

    let ties = sdf.union(...BUNDLES.map(tieAt)).paint(BURLAP);
    for (const b of BUNDLES) {
      const pole = POLES[b.pole]!;
      ties = ties.paintWhere(
        sdf.sphere(0.032).at(b.x, pole.y - (pole.r + 0.018), pole.z + 0.012),
        STRAW,
        0.01,
      );
    }
    k.body('ties', ties, {
      color: '#c8a86b',
      roughness: 0.88,
      metalness: 0,
      detail: 0.014,
      maxTriangles: 560,
      paintWeight: 2,
    });

    const greenPaint = herbPaint(GREEN_STEM, GREEN, GREEN_TIP, GREEN_DARK);
    const purplePaint = herbPaint(PURPLE_STEM, PURPLE, PURPLE_TIP, PURPLE_DARK);
    const greens = BUNDLES.filter((b) => !b.purple).map((b) => placeBundle(b).paintFn(greenPaint));
    const purples = BUNDLES.filter((b) => b.purple).map((b) => placeBundle(b).paintFn(purplePaint));

    k.body('herbs-green', sdf.union(...greens), {
      color: '#5cb85c',
      roughness: 0.84,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 1200,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 22, y * 10, z * 22, 2),
    });
    k.body('herbs-purple', sdf.union(...purples), {
      color: '#8a5aa8',
      roughness: 0.82,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 900,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 22, y * 10, z * 22, 2),
    });
  },
});
