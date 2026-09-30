import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * dungeon/prop/sarcophagus — Chibi Quest dungeon prop (catalog `dungeon/prop/sarcophagus`).
 *
 * Role: dungeon landmark prop; must read at the 128 px sprite size as a stone coffin.
 * Size: about 1.9 m long (X), 0.7 m wide (Z), 0.82 m tall; stands on y = 0, faces +Z.
 * One idea: a heavy lid slid toward the foot and tipped up at the head, opening a dark slot.
 * Shape language: square/chunky dominant (sturdy stone), soft bevels everywhere.
 * Palette: slate shadow #2a3547, mid block #4a5d75, worn top #7a8ba0, interior #16202e,
 *   moss specks #3fae9a on the shaded head end, faint warm torch bounce #ff9a3c.
 * Materials: one stone body per part (roughness 0.9, grain bump). No light source here.
 * Detail list: tapered hollow box (big), two plinths (medium), bevelled stepped lid (medium),
 *   raised border moldings, two raised panels per long side, front skull crest, raised 0.015 m
 *   cross on the lid, chipped corners and one painted crack (small). Focal point: the lid cross.
 * Kit stone color matches assets/wall-corner.ts (#2a3547 / #4a5d75 / #7a8ba0).
 * Rig: none. No clips.
 */

const dark = rgb('#2a3547');
const mid = rgb('#4a5d75');
const pale = rgb('#7a8ba0');
const insideCol = rgb('#16202e');
const grooveCol = rgb('#1d2737');
const moss = rgb('#3fae9a');
const mossDark = rgb('#2e7f70');
const warm = rgb('#ff9a3c');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Coffin plan: wide shoulders at the head (-X), tapering to the feet (+X). Length 1.9, width 0.7. */
const plan = profile.polygon([
  [-0.95, -0.24],
  [-0.55, -0.35],
  [0.45, -0.3],
  [0.95, -0.17],
  [0.95, 0.17],
  [0.45, 0.3],
  [-0.55, 0.35],
  [-0.95, 0.24],
]);

// Vertical layout (meters).
const PLINTH_TOP = 0.13;
const BOX_Y0 = 0.11;
const BOX_Y1 = 0.59;

/** Stone color: dark at the base, mid body, pale worn top edges, weathering, moss, torch bounce. */
const stonePaint =
  (y0: number, y1: number, seed: number) =>
  (x: number, y: number, z: number): Rgb => {
    const t = clamp01((y - y0) / (y1 - y0));
    let c = mixRgb(dark, mid, clamp01(0.08 + t * 1.7));
    c = mixRgb(c, pale, clamp01((t - 0.9) / 0.1) * 0.65);
    const patch = noise.fbm(x * 3.2, y * 3.2, z * 3.2, 3, seed);
    c = mixRgb(c, dark, clamp01(-patch) * 0.4);
    c = mixRgb(c, pale, clamp01(patch - 0.2) * 0.14);
    const grain = noise.fbm(x * 48, y * 48, z * 48, 2, seed + 5);
    c = mixRgb(c, dark, clamp01(grain) * 0.2);
    // Moss specks collect on the shaded head end.
    const head = clamp01((-x - 0.42) / 0.33);
    const m = noise.fbm(x * 34, y * 34, z * 34, 3, seed + 9);
    c = mixRgb(c, mixRgb(mossDark, moss, clamp01(m)), clamp01((m - 0.6) * 2.5) * head * 0.85);
    // A faint warm pool from a nearby torch on the upper front faces.
    const warmAmt = 0.09 * clamp01((z - 0.02) / 0.25) * clamp01((t - 0.5) / 0.35);
    return mixRgb(c, warm, warmAmt);
  };

const stoneBump = (x: number, y: number, z: number): number =>
  0.0016 * noise.fbm(x * 34, y * 34, z * 34, 3, 21) +
  0.0005 * noise.noise3(x * 90, y * 90, z * 90, 7);

/** Grain plus a soft recessed line at each band height, so the painted lines shade as carved. */
const bandedBump =
  (bands: readonly number[]) =>
  (x: number, y: number, z: number): number => {
    let v = stoneBump(x, y, z);
    for (const b of bands) {
      const d = (y - b) / 0.013;
      v -= 0.006 * Math.exp(-d * d);
    }
    return v;
  };

export default defineAsset({
  name: 'sarcophagus',
  description:
    'Tapered stone sarcophagus on two plinths with a slid ajar lid, band lines, and a plus emblem.',
  detail: 0.02,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ plinths
    // Two low rounded base blocks; the box embeds 2 cm into their tops.
    const slice = (cx: number) => sdf.box([0.5, PLINTH_TOP, 0.76], 0.035).at(cx, PLINTH_TOP / 2, 0);
    k.body('plinth', sdf.union(slice(-0.56), slice(0.56)).paintFn(stonePaint(0, PLINTH_TOP, 4)), {
      color: '#3a4759',
      roughness: 0.92,
      metalness: 0,
      detail: 0.025,
      maxTriangles: 700,
      paintWeight: 2,
      bump: stoneBump,
    });

    // ------------------------------------------------------------------ coffin box
    const boxSolid = sdf
      .extrude(plan, BOX_Y1 - BOX_Y0, 0.05)
      .rotateX(-90)
      .at(0, (BOX_Y0 + BOX_Y1) / 2, 0);

    // Hollow interior: floor at 0.17, open above the rim.
    const cavity = sdf
      .extrude(profile.offsetProfile(plan, -0.06), 0.6, 0.03)
      .rotateX(-90)
      .at(0, 0.47, 0);

    // Two band lines: painted dark and cut into the normal map by bandedBump.
    const bands = [0.25, 0.44] as const;
    const bandStencil = (y: number) => sdf.box([3, 0.034, 3]).at(0, y, 0);

    // Raised border moldings (base and rim) and two raised panels on each long side.
    const molding = (y: number, h: number) =>
      sdf.extrude(profile.offsetProfile(plan, 0.018), h, 0.012).rotateX(-90).at(0, y, 0);
    const edgeZ = (x: number) => 0.35 - (0.05 * (x + 0.55)) / 1.0;
    const panel = (x: number, sgn: number) =>
      sdf
        .box([0.4, 0.22, 0.07], 0.012)
        .rotateY(sgn * 2.9)
        .at(x, 0.35, sgn * (edgeZ(x) - 0.02));
    const panels = sdf.union(
      ...[-0.42, 0.42].flatMap((x) => [panel(x, 1), panel(x, -1)]),
    );
    // Skull crest centered on the front (+Z) long side between the panels.
    const skullBase = sdf
      .ellipsoid([0.075, 0.085, 0.045])
      .at(0, 0.37, edgeZ(0) - 0.012)
      .smoothUnion(0.01, sdf.box([0.08, 0.05, 0.06], 0.012).at(0, 0.29, edgeZ(0) - 0.018));
    const skull = skullBase.subtract(
      sdf.sphere(0.02).at(-0.032, 0.38, edgeZ(0) + 0.03),
      sdf.sphere(0.02).at(0.032, 0.38, edgeZ(0) + 0.03),
      sdf.box([0.02, 0.03, 0.04], 0.005).at(0, 0.335, edgeZ(0) + 0.03),
    );
    const fittings = sdf.union(
      molding(0.15, 0.05),
      molding(0.55, 0.05),
      panels,
      skull,
    );

    const boxBody = boxSolid
      .union(fittings)
      .subtract(cavity)
      .paintFn(stonePaint(BOX_Y0, BOX_Y1, 11))
      .paintWhere(bandStencil(bands[0]), grooveCol, 0.005)
      .paintWhere(bandStencil(bands[1]), grooveCol, 0.005)
      // Deep shadow under the lifted head end of the lid, around the open mouth.
      .paintWhere(sdf.box([0.62, 0.1, 3]).at(-0.66, 0.565, 0), insideCol, 0.035)
      .paintWhere(cavity.round(0.012), insideCol, 0.012);
    k.body('coffin', boxBody, {
      color: '#4a5d75',
      roughness: 0.9,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 7000,
      paintWeight: 2,
      bump: bandedBump(bands),
    });

    // ------------------------------------------------------------------ lid
    // A heavy stepped slab: full-footprint base, raised plateau for the emblem.
    const lidSlab = sdf.extrude(plan, 0.1, 0.04).rotateX(-90);
    const lidPlateau = sdf
      .extrude(profile.offsetProfile(plan, -0.1), 0.1, 0.045)
      .rotateX(-90)
      .at(0, 0.07, 0);
    const lidSolid = lidSlab.smoothUnion(0.025, lidPlateau);
    const lidShape = () => lidSolid;

    // Raised plus (0.015 m proud of the plateau top at local y = 0.12), part of the lid body.
    const cross = sdf
      .union(
        sdf.box([0.46, 0.03, 0.12], 0.008).at(0, 0.12, 0),
        sdf.box([0.12, 0.03, 0.30], 0.008).at(0, 0.12, 0),
      )
      .at(-0.08, 0, 0);
    const emblem = cross;
    // Chipped corners.
    const chips = sdf.union(
      sdf.sphere(0.04).at(0.93, 0.05, 0.14),
      sdf.sphere(0.035).at(-0.93, 0.05, -0.2),
      sdf.sphere(0.03).at(-0.5, 0.05, 0.36),
    );
    const crack = sdf.box([0.3, 0.3, 0.008]).rotateY(35).at(0.45, 0.1, 0.12);

    // Slid toward the foot and tipped up at the head: contacts the rim near the foot,
    // opens a wedge gap plus a full open slot at the head end.
    const TILT = -2; // deg about Z
    const YAW = 1.5; // deg about Y
    const SLIDE_X = 0.15;
    const sinT = Math.sin((TILT * Math.PI) / 180);
    const LID_Y = BOX_Y1 - 0.003 - ((0.95 - SLIDE_X) * sinT - 0.05);

    const lidBody = lidShape()
      .subtract(chips)
      .union(cross)
      .paintFn(stonePaint(-0.05, 0.14, 17))
      .paintWhere(cross.round(0.004), pale, 0.006)
      .paintWhere(crack, grooveCol, 0.004)
      .rotate(0, YAW, TILT)
      .at(SLIDE_X, LID_Y, 0.012);
    k.body('lid', lidBody, {
      color: '#4a5d75',
      roughness: 0.9,
      metalness: 0,
      detail: 0.014,
      maxTriangles: 5000,
      paintWeight: 2,
      bump: stoneBump,
    });
  },
});
