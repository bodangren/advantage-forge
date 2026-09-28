import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather bracers (equipment/armor/bracers).
 *
 * Role: hero gear, shown as a pair standing side by side. Reads at 128 px as
 *   two chunky tapered cuffs with dark iron bands and laced fronts.
 * Size: each bracer 0.21 m tall, 0.124 m wide at the elbow; the pair spans
 *   ~0.28 m, stands on y = 0, centered on the Y axis, fronts toward +Z.
 * One idea: a pair of honey-leather forearm cuffs, fat at the elbow and slim
 *   at the wrist, caged by iron bands and cross-laced up the front.
 * Shape language: round dominant (tapered round caps, dome studs), square
 *   secondary (steel plate, straight band edges).
 * Palette: leather #8a5a35 dominant, dark leather #5c3a22 secondary,
 *   iron #4a4f55 with highlight #a8acb1, steel edge #c8ccd2, gold #d4a93a
 *   accent (studs = focal point).
 * Value plan: mid leather body, dark lacing and shaded base, dark iron bands
 *   with a lit top edge; the gold studs carry the strongest contrast.
 * Materials: leather (rough 0.65), dark leather laces (rough 0.7),
 *   iron bands + steel plate (rough 0.5, metal 0.7), gold studs (rough 0.3,
 *   metal 1).
 * Detail: tapered cuffs, iron bands top and bottom, rimmed steel plate on
 *   the upper front, gold dome studs, dark lacing slit with three crossed
 *   lace X's per bracer.
 * Rig/animation: none (static item).
 */

const LEATHER = rgb('#8a5a35');
const LEATHER_DARK = rgb('#5c3a22');
const LEATHER_LIGHT = rgb('#a57144');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');

// Cuff dimensions (one bracer). The leather is a rounded cone: cap centers
// at CAP_Y0/CAP_Y1 with radii R0/R1, cut flat at y = 0 and y = TOP.
const R0 = 0.05; // wrist radius
const R1 = 0.062; // elbow radius
const CAP_Y0 = 0.032;
const CAP_Y1 = 0.178;
const TOP = 0.21;
const rLeather = (y: number) => {
  if (y < CAP_Y0) return Math.sqrt(Math.max(R0 * R0 - (y - CAP_Y0) ** 2, 0));
  if (y > CAP_Y1) return Math.sqrt(Math.max(R1 * R1 - (y - CAP_Y1) ** 2, 0));
  return R0 + ((R1 - R0) * (y - CAP_Y0)) / (CAP_Y1 - CAP_Y0);
};

// Band slabs.
const BAND_TOP_Y = 0.185;
const BAND_BOT_Y = 0.034;
// Front plate placement.
const PLATE_Y = 0.127;

// The left bracer axis; the right one is a hard mirror.
const CX = 0.08;

export default defineAsset({
  name: 'bracers',
  description:
    'A pair of chunky honey-leather bracers standing side by side: tapered cuffs with rounded rims, iron bands at both ends, a rimmed steel plate on the front, gold dome studs, and dark cross-lacing.',
  detail: 0.004,
  reference: 'docs/item-mockups/bracers-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ leather cuffs
    // One cuff: a tapered cone with rounded caps, cut flat at the ground and
    // just below the top rim. Wider at the top (elbow), slim at the wrist.
    const cuffOne = sdf
      .cone([CX, CAP_Y0, 0], [CX, CAP_Y1, 0], R0, R1)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .intersect(sdf.halfSpace([0, 1, 0], TOP));
    const cuffs = cuffOne.mirror('x', 0);

    // Painted lacing slit: a dark vertical strip on the front of each cuff,
    // behind the lace crosses.
    const slit = sdf
      .extrude(profile.rect([0.018, 0.05], 0.007), 0.4)
      .at(CX, 0.073, 0.2)
      .mirror('x', 0);

    const leatherPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 8 + 5, y * 8, z * 8, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 45, y * 75, z * 45, 2);
      let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.05 + 0.3 * patch);
      c = mixRgb(c, LEATHER_DARK, 0.06 + 0.22 * grain);
      // Sun-lit top shoulder, shaded base.
      c = mixRgb(c, LEATHER_LIGHT, 0.5 * Math.max(0, (y - 0.13) / 0.08));
      c = mixRgb(c, LEATHER_DARK, 0.55 * Math.max(0, (0.06 - y) / 0.06));
      // Darker "inside" ring on the top face, above the iron band.
      if (y > 0.203) c = mixRgb(c, LEATHER_DARK, 0.6);
      return c;
    };

    k.body('leather', cuffs.paintFn(leatherPaint).paintWhere(slit, '#4a2c18', 0.004), {
      color: '#8a5a35',
      roughness: 0.65,
      metalness: 0,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 850,
      bump: (x, y, z) =>
        0.0007 * noise.fbm(x * 35, y * 60, z * 35, 2) +
        0.0004 * noise.fbm(x * 120, y * 120, z * 120, 2),
    });

    // ------------------------------------------------------------------ iron bands
    // Revolved strap profiles: a rounded-rect cross-section ring around each
    // cuff (a straight ring approximates the 3 mm taper change over the
    // band height). Inner wall buried in the leather, outer wall proud, all
    // edges softly rounded by the hand-built corner arcs. Reduction by error
    // (no triangle cap) keeps the smooth surface from folding.
    const band = (yMid: number) => {
      const rO = rLeather(yMid) + 0.007;
      const rI = rLeather(yMid) - 0.004;
      const yA = yMid - 0.01;
      const yB = yMid + 0.01;
      // Rounded-rect strap cross-section as a hand-rounded polyline (no
      // spline overshoot): corner radius 4 mm.
      const c = 0.004;
      const k = c * Math.SQRT1_2;
      return sdf
        .revolve(
          profile.polygon([
            [rI, yA + c],
            [rI + c - k, yA + c - k],
            [rI + c, yA],
            [rO - c, yA],
            [rO - c + k, yA + c - k],
            [rO, yA + c],
            [rO, yB - c],
            [rO - c + k, yB - c + k],
            [rO - c, yB],
            [rI + c, yB],
            [rI + c - k, yB - c + k],
            [rI, yB - c],
          ]),
        )
        .at(CX, 0, 0);
    };
    const bands = sdf
      .union(band(BAND_TOP_Y), band(BAND_BOT_Y))
      .mirror('x', 0);

    const bandPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
      const wear = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
      let c = mixRgb(IRON, IRON_HI, 0.08 + 0.12 * wear);
      // Lit top edge, dark lower belly of the nearest band.
      const inTop = y > BAND_TOP_Y - 0.01 && y < BAND_TOP_Y + 0.01;
      const t = inTop
        ? (y - (BAND_TOP_Y - 0.01)) / 0.02
        : (y - (BAND_BOT_Y - 0.01)) / 0.02;
      c = mixRgb(c, IRON_HI, 0.4 * Math.max(0, t - 0.75) / 0.25);
      c = mixRgb(c, IRON_DARK, 0.5 * Math.max(0, (0.6 - t) / 0.6));
      return c;
    };

    k.body('iron', bands.paintFn(bandPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.009,
      paintWeight: 2,
      maxError: 0.005,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // ------------------------------------------------------------------ steel plate
    // A rounded-cone patch that tracks the cuff taper exactly (cap centers
    // at the stencil edges with radii from the taper), intersected with a
    // rounded-rect stencil pushed through the front. Bright frame painted
    // near its edge.
    const plateOutline = profile.rect([0.068, 0.054], 0.017);
    const plateY0 = PLATE_Y - 0.027;
    const plateY1 = PLATE_Y + 0.027;
    const plateCone = sdf.cone(
      [CX, plateY0, 0],
      [CX, plateY1, 0],
      rLeather(plateY0) + 0.0035,
      rLeather(plateY1) + 0.0035,
    );
    const plateStencil = sdf.extrude(plateOutline, 0.4).at(CX, PLATE_Y, 0.2);
    const plate = plateCone.intersect(plateStencil).mirror('x', 0);

    const rimFrame = sdf
      .extrude(profile.offsetProfile(plateOutline, 0.007), 0.4)
      .at(CX, PLATE_Y, 0.2)
      .subtract(sdf.extrude(profile.offsetProfile(plateOutline, -0.007), 0.4).at(CX, PLATE_Y, 0.2))
      .mirror('x', 0);

    const platePaint = (x: number, y: number, z: number): readonly [number, number, number] => {
      let c = mixRgb(IRON, IRON_HI, 0.3 + 0.25 * Math.max(0, (y - 0.11) / 0.05));
      c = mixRgb(c, IRON_DARK, 0.35 * Math.max(0, (0.115 - y) / 0.05));
      return c;
    };

    k.body('plate', plate.paintFn(platePaint).paintWhere(rimFrame, '#c8ccd2', 0.004), {
      color: '#5a6066',
      roughness: 0.45,
      metalness: 0.7,
      detail: 0.0035,
      paintWeight: 1,
      maxTriangles: 550,
    });

    // ------------------------------------------------------------------ laces
    // Three crossed X's of dark leather cord. The cord follows the round
    // front of the cuff: z from the circle at that height.
    const laceZ = (dx: number, y: number) =>
      Math.sqrt(Math.max(rLeather(y) * rLeather(y) - dx * dx, 1e-6)) + 0.003;
    const lace = (ax: number, ay: number, bx: number, by: number) =>
      sdf.capsule([CX + ax, ay, laceZ(ax, ay)], [CX + bx, by, laceZ(bx, by)], 0.005);
    const W = 0.012;
    const H = 0.012;
    const rows = [0.053, 0.069, 0.085];
    let laces = lace(-W, rows[0], W, rows[0] + H).union(lace(W, rows[0], -W, rows[0] + H));
    for (let i = 1; i < rows.length; i++) {
      laces = laces
        .union(lace(-W, rows[i], W, rows[i] + H))
        .union(lace(W, rows[i], -W, rows[i] + H));
    }
    k.body('laces', laces.mirror('x', 0), {
      color: '#4a2c18',
      roughness: 0.7,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 220,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 80, y * 80, z * 80, 2),
    });

    // ------------------------------------------------------------------ gold studs
    // Dome studs: one on each plate, three on each band (front + two sides).
    const stud = (cx: number, y: number, angleDeg: number, lift: number, r: number) => {
      const a = (angleDeg * Math.PI) / 180;
      const rr = rLeather(y) + lift;
      return sdf.sphere(r).at(cx + rr * Math.sin(a), y, rr * Math.cos(a) + 0.0012);
    };
    const studs = sdf
      .union(
        // Plate center stud.
        sdf.sphere(0.006).at(CX, PLATE_Y, rLeather(PLATE_Y) + 0.0042),
        // Top band: front and two side studs.
        stud(CX, BAND_TOP_Y, 0, 0.0065, 0.0055),
        stud(CX, BAND_TOP_Y, 42, 0.0065, 0.0055),
        stud(CX, BAND_TOP_Y, -42, 0.0065, 0.0055),
        // Bottom band: front and two side studs.
        stud(CX, BAND_BOT_Y, 0, 0.0065, 0.0055),
        stud(CX, BAND_BOT_Y, 42, 0.0065, 0.0055),
        stud(CX, BAND_BOT_Y, -42, 0.0065, 0.0055),
      )
      .mirror('x', 0);
    k.body('studs', studs, {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 250,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 100, y * 100, z * 100, 2),
    });
  },
});
