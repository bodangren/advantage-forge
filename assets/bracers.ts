import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather bracers (equipment/armor/bracers), tall cuffs that fit the avatar forearm.
 *
 * Role: hero gear and the `hands` piece of the chibi avatar. Reads at 128 px as two tall flared
 *   leather cuffs with wide steel rims, a hex panel, and a side strap with a buckle.
 * Size: each cuff is 0.148 m tall in the asset (0.074 m worn): from 0.01 m below the avatar wrist
 *   (it overlaps the fist top) to 0.06 m (0.03 m worn) below the elbow. The pair stands upright on
 *   y = 0, centered on the Y axis, the panels toward +Z.
 * Fit: the cuff is the avatar forearm cone (assets/avatar-base.ts, WRIST to ELBOW) at 2x, grown
 *   0.014 m at the wrist and 0.024 m at the elbow end (a slight flare).
 * Pose: the geometry is upright (axis +Y). `equip.origin` is the wrist point in the asset, and
 *   `equip.rotate` (computed from WRIST and ELBOW) turns the worn +Y axis onto the forearm axis.
 * One idea: a pair of tall honey-leather cuffs, ringed by wide steel rims with brass studs, with a
 *   large hexagonal leather panel and a buckled strap.
 * Shape language: round dominant (flared cuff, dome studs), square secondary (rims, hex, buckle).
 * Palette: leather #8a5a35 dominant, panel #9c5c3c, dark strap #5c3a22, steel #8d939a with
 *   highlight #c8ccd2, brass #d4a93a accent (studs = focal point).
 * Value plan: mid leather, light steel rims, darker panel and strap, brass the strongest contrast.
 * Materials (one body each): leather (0.65), panel (0.6), straps (0.7), steel rims and buckles
 *   (0.45, metal 0.7), brass studs (0.3, metal 1).
 * Rig/animation: none (static item).
 */

const LEATHER = rgb('#8a5a35');
const LEATHER_DARK = rgb('#5c3a22');
const LEATHER_LIGHT = rgb('#a57144');
const STEEL = rgb('#8d939a');
const STEEL_HI = rgb('#c8ccd2');
const STEEL_DARK = rgb('#5d636a');

type V3 = readonly [number, number, number];
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const FIT = 2;
const CX = 0.15;
const AXIS_LEN = Math.hypot(ELBOW[0] - WRIST[0], ELBOW[1] - WRIST[1], ELBOW[2] - WRIST[2]);
const AX_DEG = (Math.asin((ELBOW[2] - WRIST[2]) / AXIS_LEN) * 180) / Math.PI;
const AZ_DEG =
  (Math.asin(-(ELBOW[0] - WRIST[0]) / AXIS_LEN / Math.cos((AX_DEG * Math.PI) / 180)) * 180) / Math.PI;

/**
 * The socket turn, as degrees about X, then Y, then Z. The worn piece applies its inverse, which
 * must lay +Y on the forearm axis: Rx(AX) after Rz(AZ) is undone here as R = Rx(-AX) * Rz(-AZ).
 */
const SOCKET_TURN: V3 = (() => {
  const rad = Math.PI / 180;
  const [ca, sa] = [Math.cos(-AX_DEG * rad), Math.sin(-AX_DEG * rad)];
  const [cz, sz] = [Math.cos(-AZ_DEG * rad), Math.sin(-AZ_DEG * rad)];
  // R = Rx * Rz
  const r10 = ca * sz;
  const r00 = cz;
  const r20 = sa * sz;
  const r21 = sa * cz;
  const r22 = ca;
  return [
    Math.atan2(r21, r22) / rad,
    -Math.asin(r20) / rad,
    Math.atan2(r10, r00) / rad,
  ];
})();

const FLEN = AXIS_LEN * FIT; // forearm length in the asset
const Y0 = -0.01; // bottom of the cuff, relative to the wrist
const Y1 = FLEN - 0.06; // top of the cuff
const OY = -Y0; // wrist height in the asset, so the cuff stands on y = 0
/** The wrist point in the asset: the socket. */
const ORIGIN: V3 = [CX, OY, 0];
/** Local shape (wrist at the origin, axis +Y) to the standing pose. */
const lf = (s: sdf.Shape): sdf.Shape => s.at(CX, OY, 0);

const rForearm = (y: number) => 0.064 + (0.008 * y) / FLEN;
const rLeather = (y: number) => rForearm(y) + 0.014 + (0.01 * (y - Y0)) / (Y1 - Y0);
const PANEL_Y = 0.066;
const STRAP_Y = 0.066;
const RIM_H = 0.026;
const RIM_BOT_Y = Y0 + RIM_H / 2;
const RIM_TOP_Y = Y1 - RIM_H / 2;

export default defineAsset({
  name: 'bracers',
  description:
    'A pair of tall flared honey-leather bracers: wide steel rims with brass studs, a large hexagonal leather panel, and a side strap with a small steel buckle. Worn on the avatar forearms.',
  detail: 0.004,
  reference: 'docs/item-mockups/bracers-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'hands', fitScale: FIT, origin: ORIGIN, rotate: SOCKET_TURN },

  build(k) {
    // The avatar forearm at 2x, shrunk 0.006 m, so the skin stays inside the wall: cut out of the cuff so the top and bottom are open.
    const bore = sdf.cone(
      [0, Y0 - 0.05, 0],
      [0, Y1 + 0.05, 0],
      rForearm(Y0 - 0.05) - 0.006,
      rForearm(Y1 + 0.05) - 0.006,
    );
    // Only the end rings are open: the middle stays solid so the avatar skin stays covered.
    const ends = sdf
      .union(
        sdf.box([0.4, 0.03, 0.4]).at(0, Y0 - 0.005, 0),
        sdf.box([0.4, 0.03, 0.4]).at(0, Y1 + 0.005, 0),
      );
    const hollow = bore.intersect(ends);
    const pair = (s: sdf.Shape) => lf(s).mirror('x', 0);

    // ------------------------------------------------------------------ leather cuff
    const cuff = sdf
      .cone([0, Y0 - 0.02, 0], [0, Y1 + 0.02, 0], rLeather(Y0 - 0.02), rLeather(Y1 + 0.02))
      .intersect(sdf.halfSpace([0, -1, 0], -Y0))
      .intersect(sdf.halfSpace([0, 1, 0], Y1))
      .subtract(hollow);
    const leatherPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 8 + 5, y * 8, z * 8, 2);
      if (Math.hypot(x, z) < rForearm(y) + 0.002) return rgb('#3a2414');
      let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.05 + 0.3 * patch);
      c = mixRgb(c, LEATHER_LIGHT, 0.3 * Math.max(0, (y - 0.08) / 0.06));
      return mixRgb(c, LEATHER_DARK, 0.3 * Math.max(0, (0.03 - y) / 0.04));
    };
    k.body('leather', pair(cuff.paintFn(leatherPaint)), {
      color: '#8a5a35',
      roughness: 0.65,
      metalness: 0,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 1200,
      bump: (x, y, z) =>
        0.0007 * noise.fbm(x * 35, y * 60, z * 35, 2) + 0.0004 * noise.fbm(x * 120, y * 120, z * 120, 2),
    });

    // ------------------------------------------------------------------ hex panel and strap
    const hex = profile.polygon(
      [0, 1, 2, 3, 4, 5].map((i): [number, number] => {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        return [0.043 * Math.cos(a), 0.047 * Math.sin(a)];
      }),
    );
    const panelCone = sdf.cone(
      [0, PANEL_Y - 0.05, 0],
      [0, PANEL_Y + 0.05, 0],
      rLeather(PANEL_Y - 0.05) + 0.007,
      rLeather(PANEL_Y + 0.05) + 0.007,
    );
    const panel = panelCone
      .intersect(sdf.extrude(hex, 0.4, 0.004).at(0, PANEL_Y, 0.2))
      .round(0.002);
    k.body('panel', pair(panel), {
      color: '#9c5c3c',
      roughness: 0.6,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    const strapRing = (() => {
      const rO = rLeather(STRAP_Y) + 0.005;
      const rI = rLeather(STRAP_Y) - 0.004;
      const h = 0.011;
      return sdf.revolve(
        profile.polygon([
          [rI, STRAP_Y - h],
          [rO, STRAP_Y - h],
          [rO, STRAP_Y + h],
          [rI, STRAP_Y + h],
        ]),
      );
    })();
    k.body('straps', pair(strapRing.round(0.002)), {
      color: '#5c3a22',
      roughness: 0.7,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 500,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });

    // ------------------------------------------------------------------ steel rims and buckle
    const rim = (yMid: number, extra: number) => {
      const rO = rLeather(yMid) + 0.008 + extra;
      const rI = rLeather(yMid) - 0.005;
      const yA = yMid - RIM_H / 2;
      const yB = yMid + RIM_H / 2;
      const c = 0.005;
      const d = c * (1 - Math.SQRT1_2);
      return sdf.revolve(
        profile.polygon([
          [rI, yA],
          [rO - c, yA],
          [rO - d, yA + d],
          [rO, yA + c],
          [rO, yB - c],
          [rO - d, yB - d],
          [rO - c, yB],
          [rI, yB],
        ]),
      );
    };
    const aBuckle = (82 * Math.PI) / 180;
    const rBuckle = rLeather(STRAP_Y) + 0.008;
    const buckle = sdf
      .box([0.02, 0.026, 0.007], 0.002)
      .rotateY(82)
      .at(rBuckle * Math.sin(aBuckle), STRAP_Y, rBuckle * Math.cos(aBuckle));
    const iron = sdf.union(rim(RIM_BOT_Y, 0), rim(RIM_TOP_Y, 0.004), buckle);
    const ironPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
      const wear = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
      let c = mixRgb(STEEL, STEEL_HI, 0.1 + 0.2 * wear);
      const t = y < 0.07 ? (y - Y0) / RIM_H : (y - (Y1 - RIM_H)) / RIM_H;
      c = mixRgb(c, STEEL_HI, 0.4 * Math.max(0, t - 0.7) / 0.3);
      return mixRgb(c, STEEL_DARK, 0.4 * Math.max(0, 0.3 - t) / 0.3);
    };
    k.body('iron', pair(iron.subtract(hollow).paintFn(ironPaint)), {
      color: '#8d939a',
      roughness: 0.45,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      maxError: 0.004,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // ------------------------------------------------------------------ brass studs
    const stud = (y: number, angleDeg: number, lift: number, r: number) => {
      const a = (angleDeg * Math.PI) / 180;
      const rr = rLeather(y) + lift;
      return sdf.sphere(r).at(rr * Math.sin(a), y, rr * Math.cos(a));
    };
    const studs = sdf.union(
      stud(PANEL_Y, 0, 0.0075, 0.0085),
      stud(RIM_BOT_Y, 0, 0.0115, 0.0075),
      stud(RIM_BOT_Y, 40, 0.0115, 0.0075),
      stud(RIM_BOT_Y, -40, 0.0115, 0.0075),
      stud(RIM_TOP_Y, 0, 0.0155, 0.0075),
      stud(RIM_TOP_Y, 40, 0.0155, 0.0075),
      stud(RIM_TOP_Y, -40, 0.0155, 0.0075),
    );
    k.body('studs', pair(studs), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 300,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 100, y * 100, z * 100, 2),
    });
  },
});
