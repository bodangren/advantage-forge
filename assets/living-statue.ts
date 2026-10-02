import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Living statue — Chibi Quest construct enemy (catalog `enemies/construct/living-statue`), 1.0 m to
 * the crown leaf, faces +Z. Target: docs/enemy-mockups/living-statue_001.jpg. Built on the knight's
 * skeleton, sword arm, shield arm, and clips (knee split included), so the rig and clips are proven.
 *
 * Role: an enemy seen in 3D and as a 128 px sprite; the crown band, the glowing visor slit, the
 *   round shield, and the sword must read small.
 * One idea: a marble knight statue come alive: one white stone with grey veins and cracks, a closed
 *   round helm with a laurel crown band, a wide slit and two pale blue eyes glowing in it.
 * Shape language: round and heavy (helm, pauldrons, boss), with a few carved sharp accents (leaves,
 *   the V collar, the sword).
 * Palette (one material family): marble #e4e2dc, lit #f4f2ee, shade #b8b6b0, veins #a8a6a0, eyes
 *   #bfe8f0 (emissive). Value plan: all one light value; the dark visor slit with its glow is the
 *   focal point; veins and cracks give the small contrast.
 * Bodies: head (helm, crown, neck), eyes, collar, cuirass, belt, pauldrons, sleeves, skirt,
 *   gauntlets, legs, cape, sword, shield.
 * Rig: the knight's skeleton (`plume` stays as an unused bone so the clips work unchanged).
 *   Clips: idle, walk, run, attack, attack2, hit, death, victory.
 */

const C = {
  marble: '#e4e0d8',
  lit: '#eeebe4',
  shade: '#56524c',
  vein: '#8a8e9a',
  eyes: '#bfe8f0',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.335, -0.005];
const WRIST_R: V3 = [-0.215, 0.3, 0.1];
const ELBOW_L: V3 = [0.175, 0.335, 0];
const WRIST_L: V3 = [0.2, 0.29, 0.085];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const HEEL: V3 = [0.096, 0, -0.008];
const TOE: V3 = [0.117, 0, 0.09];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const rad = Math.PI / 180;
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** A fist hanging from the wrist at the origin: palm, a finger roll at the front, a thumb. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.04, 0.045, 0.046]).at(0.007 * s, -0.04, 0.004),
    sdf.capsule([-0.009 * s, -0.061, 0.031], [-0.005 * s, -0.04, 0.044], 0.018),
    sdf.cone([0.021 * s, -0.024, 0.026], [0.001 * s, -0.035, 0.05], 0.017, 0.0135),
  );
const HAND_R = { pitch: -70, roll: -30 };
const HAND_L = { pitch: -62, roll: 26 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);

// A pointed leaf outline (X across, Y up): the crown's center leaf.
const leaf = profile.polygon(
  [
    [0, 0.05],
    [0.022, 0.018],
    [0.026, -0.012],
    [0.012, -0.038],
    [0, -0.046],
    [-0.012, -0.038],
    [-0.026, -0.012],
    [-0.022, 0.018],
  ],
  { smooth: true, samples: 5 },
);

export default defineAsset({
  name: 'living-statue',
  texture: { size: 2048 },
  description: 'Animated marble knight statue with a laurel-crowned closed helm, glowing visor slit, round shield, and sword.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/living-statue_001.jpg',
  variants: {
    marble: { white: C.marble, black: '#3a3a40', green: '#6a8a7a' },
    veins: { grey: C.vein, slate: '#6a6a70', moss: '#3e5a4c' },
    eyes: { blue: C.eyes, gold: '#ffd23a', red: '#ff4a4a' },
  },
  presets: {
    alabaster: { marble: 'white', veins: 'grey', eyes: 'blue' },
    obsidian: { marble: 'black', veins: 'slate', eyes: 'gold' },
    verdigris: { marble: 'green', veins: 'moss', eyes: 'red' },
  },

  build(k) {
    const T = {
      marble: k.tint('marble'),
      lit: k.tint('marble', { color: '#eeebe4', follow: 1 }),
      side: k.tint('marble', { color: '#e4e0d8', follow: 1 }),
      up1: k.tint('marble', { color: '#dcd8ce', follow: 1 }),
      side1: k.tint('marble', { color: '#cdc8be', follow: 1 }),
      dark: k.tint('marble', { color: '#8e8a82', follow: 1 }),
      seam: k.tint('marble', { color: '#5e5a52', follow: 1 }),
      crack: k.tint('marble', { color: '#6a665e', follow: 1 }),
      band: k.tint('marble', { color: '#5e5a52', follow: 1 }),
      rec: k.tint('marble', { color: '#56524c', follow: 1 }),
      field: k.tint('marble', { color: '#cfcbc0', follow: 1 }),
      leafc: k.tint('marble', { color: '#c4c0b4', follow: 1 }),
      vein: k.tint('veins'),
      veinCool: k.tint('veins', { color: '#7a8090', follow: 1 }),
      veinWarm: k.tint('veins', { color: '#9a948a', follow: 1 }),
      vein2: k.tint('veins', { color: '#b8b4ae', follow: 1 }),
      eyes: k.tint('eyes'),
      eyeBase: k.tint('eyes', { color: '#103050', follow: 1 }),
    };
    // Marble by surface direction: up-facing light, sides mid, down-facing and crevices dark; `tone` 1
    // is one step darker (the parts that must separate). Thin grey veins and hairline cracks on top.
    const smooth01 = (a: number, b: number, v: number) => {
      const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    // Veined polished marble: a warm off-white base, grey-blue veins in two scales; `rot` turns the
    // vein field per body so the pieces read as separate blocks; `vein` picks the cool or warm tint.
    const paintMarble = (s: sdf.Shape, tone = 0, rim = false, rot = 0, veinC: string = T.vein) => {
      const P = tone ? { up: T.up1, side: T.side1, down: T.dark } : { up: T.lit, side: T.side, down: T.dark };
      const d = s.dist;
      const h = 0.004;
      const cr = Math.cos(rot * rad);
      const sr = Math.sin(rot * rad);
      return s.paintFn((x, y, z) => {
        const d0 = d(x, y, z);
        const gx = d(x + h, y, z) - d0;
        const gy = d(x, y + h, z) - d0;
        const gz = d(x, y, z + h) - d0;
        const ny = gy / (Math.hypot(gx, gy, gz) || 1);
        let c = mixRgb(rgb(P.down), rgb(P.side), smooth01(-0.7, 0.2, ny));
        c = mixRgb(c, rgb(P.up), smooth01(0.15, 0.95, ny));
        // rotated sample coordinates (turn about Y, lean about X by the same angle)
        const u = x * cr + z * sr;
        const w = -x * sr + z * cr;
        const yy = y * cr + w * sr * 0.5;
        // fbm rarely passes 0.35, so the veins are ridges (thin lines where the field crosses zero)
        // plus a soft cloud where it is high; the fine set is the same at 22x.
        const f1 = noise.fbm(u * 9 + 3, yy * 3, w * 9, 3);
        const v1 = Math.max(clamp01((0.09 - Math.abs(f1)) * 14), 0.6 * clamp01((f1 - 0.16) * 6));
        c = mixRgb(c, rgb(veinC), v1);
        const f2 = noise.fbm(u * 22 + 7, yy * 8, w * 22, 3);
        const v2 = Math.max(clamp01((0.05 - Math.abs(f2)) * 20), 0.5 * clamp01((f2 - 0.2) * 5));
        c = mixRgb(c, rgb(T.vein2), 0.5 * v2);
        if (rim) {
          const nz = gz / (Math.hypot(gx, gy, gz) || 1);
          c = mixRgb(c, rgb(T.rec), 0.6 * smooth01(0.35, 0.05, Math.abs(nz)));
        }
        return c;
      });
    };
    const stone = (
      name: string,
      shape: sdf.Shape,
      o: { detail?: number; bump?: (x: number, y: number, z: number) => number; bone?: string; tone?: number; rot?: number; veinC?: string; after?: (s: sdf.Shape) => sdf.Shape; flat?: boolean; maxTriangles?: number; rim?: boolean } = {},
    ) => {
      const painted = paintMarble(shape, o.tone ?? 0, o.rim ?? false, o.rot ?? 0, o.veinC ?? T.vein);
      k.body(name, o.after ? o.after(painted) : painted, {
        color: T.marble,
        roughness: 0.35,
        metalness: 0,
        bump: (x: number, y: number, z: number) => 0.0004 * noise.fbm(x * 90, y * 90, z * 90, 2) + (o.bump ? o.bump(x, y, z) : 0),
        ...(o.detail ? { detail: o.detail } : {}),
        ...(o.bone ? { bone: o.bone } : {}),
        ...(o.flat ? { flat: true } : {}),
        ...(o.maxTriangles ? { maxTriangles: o.maxTriangles } : {}),
      });
    };

    // A hand-placed crack: a thin polyline stroke (0.004 wide, mitered bends) in the XY plane, extruded
    // along +Z (z 0 to 0.3) so it crosses the front of the surface it sits on. Painted and grooved 3 mm.
    const stroke = (pts: [number, number][], w = 0.002) => {
      const at = (i: number): [number, number] => pts[Math.max(0, Math.min(pts.length - 1, i))] ?? [0, 0];
      const nrm = pts.map((_p, i): [number, number] => {
        const a = at(i - 1);
        const b = at(i + 1);
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const l = Math.hypot(dx, dy) || 1;
        return [-dy / l, dx / l];
      });
      const n = (i: number): [number, number] => nrm[i] ?? [0, 0];
      const left = pts.map((p, i): [number, number] => [p[0] + n(i)[0] * w, p[1] + n(i)[1] * w]);
      const right = pts.map((p, i): [number, number] => [p[0] - n(i)[0] * w, p[1] - n(i)[1] * w]).reverse();
      return sdf.extrude(profile.polygon([...left, ...right]), 0.3).at(0, 0, 0.15);
    };
    const grooveOf = (shapes: sdf.Shape[]) => {
      const u = sdf.union(...shapes);
      return (x: number, y: number, z: number) => {
        const d = u.dist(x, y, z);
        return d < 0.0005 ? -0.002 * smooth01(0.0005, -0.0015, d) : 0;
      };
    };

    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      plume: { parent: 'head', at: [0, 0.985, -0.012], tail: [-0.1, 1.15, -0.06] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ closed helm
    const HC = [0, 0.675, -0.01] as const;
    const skull = sdf.ellipsoid([0.22, 0.22, 0.22]).at(...HC);
    const faceBase = sdf.smoothUnion(
      0.05,
      skull,
      pair(sdf.sphere(0.1).at(0.086, 0.565, 0.05)), // round cheeks
      sdf.ellipsoid([0.115, 0.07, 0.092]).at(0, 0.525, 0.045), // chin
    );
    // The faceted V mask below the brim: two chamfer planes meet in a center ridge, a third plane
    // slopes the chin back, and a V outline (a chin point) trims the sides.
    const RIDGE_Z = 0.19;
    const vPrism = sdf.extrude(
      profile.polygon([
        [-0.23, 0.72],
        [0.23, 0.72],
        [0.205, 0.58],
        [0.16, 0.515],
        [0, 0.44],
        [-0.16, 0.515],
        [-0.205, 0.58],
      ]),
      1,
      0.006,
    );
    const wedge = sdf
      .halfSpace([0.5, 0, 0.866], 0.866 * RIDGE_Z)
      .intersect(sdf.halfSpace([-0.5, 0, 0.866], 0.866 * RIDGE_Z))
      .intersect(sdf.halfSpace([0, -0.42, 0.91], -0.42 * 0.6 + 0.91 * RIDGE_Z))
      .intersect(vPrism);
    const MASK_TOP = 0.665;
    const mask = faceBase.smoothIntersect(0.006, wedge).intersect(sdf.halfSpace([0, 1, 0], MASK_TOP));
    const faceZ = (x: number, y: number) => sdf.raycast(mask, [x, y, 1], [0, 0, -1])![2];
    // The crown band: a flat torus (0.05 tall) at the brow, six laurel leaves and the center leaf on it.
    const BAND_Y = 0.668;
    const BAND_TOP = BAND_Y + 0.025;
    const band = sdf.torus(0.188, 0.043).scale([1, 0.58, 1]).at(0, BAND_Y, HC[2]);
    // The cap: a rounded ellipsoid over the band, cut flat 0.10 m above the band; the crown stands on top.
    const CAP_TOP = BAND_Y + 0.11;
    const capHelm = sdf.ellipsoid([0.222, 0.26, 0.222]).at(HC[0], BAND_Y - 0.09, HC[2]);
    // A raised garland on the band: eight overlapping leaf ellipsoids (0.035 x 0.015 x 0.008) that follow
    // the band around the front half in a swag, alternating in tilt. `a` is the angle from +Z.
    const BAND_R = 0.188 + 0.043;
    const garlandLeaf = (a: number, i: number) => {
      const t = a / 60;
      const y = BAND_Y + 0.004 + 0.012 * t * t;
      return sdf
        .ellipsoid([0.035, 0.015, 0.008])
        .rotateZ((i % 2 ? 1 : -1) * 16 + Math.sign(a) * 10 * Math.abs(t))
        .at(0, y, BAND_R - 0.004)
        .rotateY(a)
        .at(0, 0, HC[2]);
    };
    const garlandAngles = [-59.5, -42.5, -25.5, -8.5, 8.5, 25.5, 42.5, 59.5];
    const garland = sdf.smoothUnion(0.006, ...garlandAngles.map((a, i) => garlandLeaf(a, i)));
    // The crown ring on the flat top: seven points and a taller center crest (front), four small spheres.
    const CROWN_Y = CAP_TOP + 0.004;
    const CROWN_R = 0.13;
    const ringPt = (a: number, y: number, r = CROWN_R): V3 => [r * Math.sin(a * rad), y, HC[2] + r * Math.cos(a * rad)];
    const crownRing = sdf.torus(CROWN_R, 0.012).at(0, CROWN_Y, HC[2]);
    const points = [45, 90, 135, 180, 225, 270, 315].map((a) =>
      sdf.cone(ringPt(a, CROWN_Y + 0.004), ringPt(a, CROWN_Y + 0.004 + 0.035), 0.012, 0.003),
    );
    const beads = [22.5, -22.5, 157.5, -157.5].map((a) => sdf.sphere(0.012).at(...ringPt(a, CROWN_Y + 0.006)));
    const crestProfile = profile.polygon(
      [
        [0, 0.062],
        [0.03, 0.032],
        [0.026, 0],
        [-0.026, 0],
        [-0.03, 0.032],
      ],
      { smooth: false },
    );
    const crestHole = sdf.extrude(
      profile.polygon([
        [0, 0.047],
        [0.011, 0.033],
        [0, 0.019],
        [-0.011, 0.033],
      ]),
      0.1,
    );
    const crest = sdf
      .extrude(crestProfile, 0.014, 0.004)
      .subtract(crestHole)
      .at(0, CROWN_Y - 0.004, HC[2] + CROWN_R);
    const crown = sdf.union(crownRing, ...points, ...beads, crest);
    const bandZ = sdf.raycast(band, [0, BAND_Y, 1], [0, 0, -1])![2];
    const ears = pair(sdf.ellipsoid([0.018, 0.028, 0.028]).at(0.226, 0.58, -0.012));
    // The dark recessed visor band under the brim, and two big glowing eyes set in it.
    const SLIT_Y = 0.603;
    const slit = mask
      .round(0.02)
      .subtract(mask.round(-0.05))
      .intersect(sdf.box([0.27, 0.076, 0.6], 0.024).at(0, SLIT_Y, 0.3));
    const cap = capHelm.intersect(sdf.halfSpace([0, -1, 0], -(BAND_Y + 0.01))).intersect(sdf.halfSpace([0, 1, 0], CAP_TOP));
    const dome = sdf.union(cap.smoothUnion(0.008, band).smoothUnion(0.006, garland), crown).bone('head');
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    // Two hand-placed cracks on the helm.
    const helmStrokes = [
      stroke([[0.125, 0.756], [0.1, 0.736], [0.118, 0.716], [0.09, 0.698]]),
      stroke([[-0.115, 0.76], [-0.088, 0.74], [-0.108, 0.72], [-0.076, 0.702]]),
    ];
    const helmCracks = sdf.union(...helmStrokes);
    const helmSeams = sdf.union(sdf.box([1, 0.009, 1]).at(0, 0.692, 0), sdf.box([1, 0.009, 1]).at(0, 0.646, 0));
    stone('helm', dome.union(neck), {
      detail: 0.0055,
      rot: 45,
      veinC: T.veinCool,
      bump: grooveOf(helmStrokes),
      after: (s) => s.paintWhere(helmSeams, T.rec).paintWhere(garland.round(0.002), T.leafc).paintWhere(helmCracks, T.crack),
    });
    const gemZ = sdf.raycast(band, [0, BAND_Y + 0.004, 1], [0, 0, -1])![2];
    k.body('gem', sdf.sphere(0.018).at(0, BAND_Y + 0.004, gemZ + 0.004).bone('head'), {
      color: '#6a8ab0',
      roughness: 0.3,
      metalness: 0,
      detail: 0.003,
      bone: 'head',
    });
    const maskBump = (x: number, y: number, z: number) =>
      z > 0.1 && y < 0.64 && Math.abs(x) < 0.008 ? 0.003 * (1 - Math.abs(x) / 0.008) : 0;
    stone('mask', mask.subtract(slit).union(ears).bone('head'), {
      detail: 0.0045,
      flat: true,
      rim: true,
      tone: 1,
      rot: 20,
      maxTriangles: 6500,
      bump: maskBump,
      after: (s) => s.paintWhere(slit.round(0.004), T.band),
    });
    const eyeAt = (x: number) => sdf.raycast(mask, [x, SLIT_Y, 1], [0, 0, -1])![2] - 0.04;
    const eyes = pair(sdf.ellipsoid([0.056, 0.032, 0.03]).rotateZ(10).at(0.071, SLIT_Y, eyeAt(0.071))).bone('head');
    k.body('eyes', eyes, { color: T.eyeBase, roughness: 0.3, emissive: T.eyes, emissiveIntensity: 1.4, detail: 0.003, bone: 'head' });

    // ------------------------------------------------------------------ pauldrons (two lames each) and carved edges
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.1 * s, 0.066 * s, 0.096 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.003);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-16).at(0.158, 0.432, 0);
    const pauldronLocal = sdf.union(lame(1), lame(1.14).at(0, -0.034, 0));
    const edge = (s: number, y: number) =>
      lame(s)
        .round(0.006)
        .smoothIntersect(0.004, sdf.box([0.4, 0.018, 0.4]).at(0, -0.009 * s, 0))
        .at(0, y, 0);
    // The upturned flange: a tilted torus, the segment on the outer edge (local +x) rising out of the lames.
    const flange = sdf
      .torus(0.104, 0.02)
      .rotateZ(50)
      .at(0, -0.005, 0)
      .intersect(sdf.halfSpace([-1, 0, 0], -0.05));
    const pauldrons = pair(pauldronPose(sdf.union(pauldronLocal, edge(1, 0), edge(1.14, -0.034), flange)).bone('upperarm.L'));
    const pauldronSeam = pair(pauldronPose(pauldronLocal.round(0.012)));
    const pauldronUnder = pair(pauldronPose(sdf.union(sdf.box([0.5, 0.014, 0.5]).at(0, -0.016, 0), sdf.box([0.5, 0.014, 0.5]).at(0, -0.05, 0))));
    // One chipped corner on the left pauldron: a subtracted sphere r 0.015 at the front lower rim.
    const chipP = rotZ([0.08, -0.014, 0.05], -16);
    const pauldronChip = sdf.sphere(0.015).at(chipP[0] + 0.158, chipP[1] + 0.432, chipP[2]);
    stone('pauldrons', pauldrons.subtract(pauldronChip), { rot: 35, veinC: T.veinWarm, detail: 0.007, maxTriangles: 5500, after: (s) => s.paintWhere(pauldronUnder, T.rec) });

    // ------------------------------------------------------------------ torso: cuirass, collar
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.124, 0.29],
            [0.13, 0.25],
            [0.138, 0.2],
            [0.14, 0.165],
            [0.132, 0.152],
            [0, 0.152],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const ridgeChest = sdf.capsule([0, 0.43, 0.105], [0, 0.29, 0.112], 0.014).scale([0.8, 1, 1]);
    const cuirass = torso
      .round(0.014)
      .smoothUnion(0.02, ridgeChest)
      .intersect(sdf.halfSpace([0, -1, 0], -0.248))
      .intersect(sdf.halfSpace([0, 1, 0], 0.47));
    // The V collar plate over the neckline.
    const collarRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.05, 0.502],
            [0.095, 0.496],
            [0.132, 0.472],
            [0.142, 0.446],
            [0.12, 0.432],
            [0.085, 0.452],
            [0.05, 0.468],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    const drape = cuirass
      .round(0.014)
      .subtract(cuirass.round(-0.002))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.105, 0.47],
              [0.105, 0.47],
              [0.02, 0.37],
              [0, 0.36],
              [-0.02, 0.37],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    // Belt with the round medallion.
    const beltY = 0.252;
    const belt = cuirass.round(0.008).smoothIntersect(0.005, sdf.box([0.5, 0.05, 0.5], 0.006).at(0, beltY, 0));
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const medallion = sdf
      .union(
        sdf.extrude(
          profile.polygon([
            [-0.034, 0.034],
            [0.034, 0.034],
            [0.034, -0.014],
            [0, -0.042],
            [-0.034, -0.014],
          ], { smooth: true, samples: 3 }),
          0.014,
          0.006,
        ),
        sdf.torus(0.019, 0.006).rotateX(90).at(0, 0.006, 0.01),
        sdf.sphere(0.012).at(0, 0.006, 0.012),
      )
      .at(0, beltY, beltZ + 0.002);
    const chestStroke = stroke([[-0.09, 0.43], [-0.07, 0.395], [-0.09, 0.365], [-0.068, 0.335]]);
    const collarSeam = sdf.torus(0.132, 0.004).scale([1, 1, 0.9]).at(0, 0.442, 0);
    stone(
      'body',
      sdf.union(
        cuirass.bone('chest'),
        sdf.smoothUnion(0.012, collarRing, drape).bone('chest'),
        belt.bone('spine'),
        medallion.bone('spine'),
      ),
      {
        veinC: T.veinWarm,
        rot: -25,
        after: (s) => s.paintWhere(pauldronSeam, T.seam).paintWhere(collarSeam, T.rec).paintWhere(chestStroke, T.crack),
        bump: grooveOf([chestStroke]),
        maxTriangles: 6500,
      },
    );

    // ------------------------------------------------------------------ skirt with carved scrolls
    const skirtShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.262],
            [0.13, 0.262],
            [0.15, 0.225],
            [0.172, 0.165],
            [0.184, 0.115],
            [0.176, 0.104],
            [0.15, 0.108],
            [0, 0.108],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.8])
      .round(0.006);
    // Scroll grooves: curled arcs cut a few millimeters into the skirt's front, painted darker.
    const skirtShell = skirtShape.round(0.012).subtract(skirtShape.round(-0.006));
    const scrollAt = (x: number, y: number, m: number) =>
      sdf.union(
        sdf.extrude(profile.arc(0.022 * m, 0.006, 20, 330), 0.3).at(x, y, 0.15),
        sdf.extrude(profile.arc(0.011 * m, 0.005, 170, 420), 0.3).at(x + 0.004 * m, y, 0.15),
        sdf.extrude(profile.arc(0.03 * m, 0.005, 300, 400), 0.3).at(x + 0.02 * m, y - 0.028 * m, 0.15),
      );
    const grooves = hard(sdf.union(scrollAt(0.098, 0.178, 1), scrollAt(0.1, 0.128, 0.75))).intersect(skirtShell);
    // The long center tab, with a notched hem and a raised medallion.
    const tab = sdf
      .extrude(
        profile.polygon([
          [-0.05, 0.245],
          [0.05, 0.245],
          [0.05, 0.1],
          [0.03, 0.085],
          [0, 0.095],
          [-0.03, 0.085],
          [-0.05, 0.1],
        ]),
        0.024,
        0.007,
      )
      .rotateX(-6)
      .at(0, 0, 0.142);
    const TAB_Y = 0.19;
    const tabZ = sdf.raycast(tab, [0, TAB_Y, 1], [0, 0, -1])![2];
    const tabMedallion = sdf.union(
      sdf.cylinder(0.026, 0.01, 0.004).rotateX(90).at(0, TAB_Y, tabZ),
      sdf.torus(0.019, 0.005).rotateX(90).at(0, TAB_Y, tabZ + 0.005),
      sdf.sphere(0.011).at(0, TAB_Y, tabZ + 0.006),
    );
    const skirtStroke = stroke([[-0.13, 0.24], [-0.115, 0.212], [-0.133, 0.185], [-0.118, 0.155]]);
    stone('skirt', sdf.union(skirtShape.subtract(grooves).bone('hips'), tab.bone('hips'), tabMedallion.bone('hips')), {
      detail: 0.005,
      tone: 1,
      rot: 60,
      veinC: T.veinWarm,
      maxTriangles: 7000,
      bump: grooveOf([skirtStroke]),
      after: (s) => s.paintWhere(grooves.round(0.002), T.rec).paintWhere(skirtStroke, T.crack),
    });

    // ------------------------------------------------------------------ sleeves with chainmail dimples, gauntlets
    const dimples = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 26;
      const v = y * 260 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return 0.004 * Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 1.12), 0.046, 0.043).bone(tag);
    stone('sleeves', sdf.union(sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')), { bump: dimples, tone: 1, rot: 15, veinC: T.veinWarm, maxTriangles: 2000 });
    const vambrace = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.15), lerp(e, w, 1.02), 0.041, 0.047).round(0.003);
    const cuff = (e: V3, w: V3) => sdf.torus(0.044, 0.009).rotateX(90).at(...lerp(e, w, 0.14));
    void cuff;
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1));
    const gauntlets = sdf.union(
      sdf.smoothUnion(0.012, vambrace(ELBOW_L, WRIST_L).bone('forearm.L'), fistL.bone('hand.L')),
      sdf.smoothUnion(0.012, vambrace(ELBOW_R, WRIST_R).bone('forearm.R'), fistR.bone('hand.R')),
    );
    stone('gauntlets', gauntlets, { rot: 50, veinC: T.veinWarm, maxTriangles: 2500 });

    // ------------------------------------------------------------------ cape behind
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.4 - y) / 0.26));
    const capeCone = (r0: number, r1: number, y0: number, y1: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, y0],
            [r0, y0],
            [r1, y1],
            [0, y1],
          ]),
        )
        .scale([1, 1, 0.85])
        .displace(0.012, folds);
    const cape = capeCone(0.19, 0.285, 0.44, 0.09)
      .subtract(capeCone(0.168, 0.263, 0.46, 0.07))
      .at(0, 0, -0.025)
      .intersect(sdf.halfSpace([0, 0, 1], -0.02));
    stone('cape', cape.bone('cloak'), { detail: 0.009, tone: 1, rot: 30, veinC: T.veinWarm, maxTriangles: 4000 });

    // ------------------------------------------------------------------ legs: leggings, knee cops, greaves, round-toed boots
    const leggings = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.05, 0.084]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L')),
    );
    const knee = sdf.ellipsoid([0.055, 0.032, 0.05]).at(0.095, 0.11, 0.022).bone('leg.L');
    const greave = sdf.cone([0.096, 0.098, 0.006], [0.098, 0.06, 0.004], 0.049, 0.052).bone('leg.L');
    const bootFoot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.052, 0.06, 0.02).at(0, 0.05, 0),
        sdf.ellipsoid([0.058, 0.05, 0.102]).at(0, 0.045, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeLine = sdf.box([0.2, 0.006, 0.2]).rotateX(-30).at(0, 0.075, 0.06);
    const boot = bootFoot
      .smoothSubtract(0.003, toeLine.intersect(sdf.halfSpace([0, 0, -1], -0.04)))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const greaveStroke = stroke([[0.108, 0.15], [0.092, 0.125], [0.108, 0.1], [0.094, 0.072]]);
    stone('legs', sdf.union(pair(sdf.union(sdf.smoothUnion(0.01, greave, knee), boot)), leggings), {
      detail: 0.007,
      rot: 40,
      veinC: T.veinWarm,
      maxTriangles: 5000,
      bump: grooveOf([greaveStroke]),
      after: (s) => s.paintWhere(greaveStroke, T.crack),
    });

    // ------------------------------------------------------------------ plain marble sword in the right hand
    const BLADE_W = 0.046;
    const BLADE_T = 0.016;
    const R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const lens = sdf.intersect(
      sdf.cylinder(R, 1).at(0, 0, R - BLADE_T / 2),
      sdf.cylinder(R, 1).at(0, 0, -(R - BLADE_T / 2)),
    );
    const bladeLocal = sdf
      .extrude(
        profile.polygon([
          [-BLADE_W / 2, -0.078],
          [BLADE_W / 2, -0.078],
          [BLADE_W / 2 - 0.003, -0.27],
          [0, -0.33],
          [-BLADE_W / 2 + 0.003, -0.27],
        ]),
        0.2,
      )
      .intersect(lens);
    const guardLocal = sdf
      .box([0.1, 0.02, 0.028], 0.009)
      .bend(5)
      .union(hard(sdf.sphere(0.015).at(0.052, -0.008, 0)))
      .at(0, -0.074, 0);
    const pommelLocal = sdf.smoothUnion(0.008, sdf.sphere(0.019).at(0, 0.052, 0), sdf.cone([0, 0.03, 0], [0, 0.045, 0], 0.013, 0.016));
    const gripLocal = sdf.cylinder(0.0145, 0.11, 0.004).at(0, -0.014, 0);
    const GRIP = handPoint(HAND_R, WRIST_R, [-0.007, -0.04, 0.004]);
    const swordPose = (s: sdf.Shape) => s.rotateX(-12).rotateZ(-44).at(...GRIP);
    stone('sword', swordPose(sdf.union(bladeLocal, guardLocal, pommelLocal, gripLocal)), { detail: 0.004, bone: 'hand.R', rot: 55, veinC: T.veinCool, maxTriangles: 2500 });

    // ------------------------------------------------------------------ big round shield on the left forearm
    // Local frame: the face toward +Z. A thick disc, a raised rim, a second ring, and a stacked boss.
    // The pose is the knight's, so the shield-arm clips keep working.
    const shieldPose = (s: sdf.Shape) => s.rotateZ(-4).rotateX(4).rotateY(38).at(0.236, 0.28, 0.092);
    const disc = sdf.cylinder(0.19, 0.026, 0.01).rotateX(90);
    const RINGS = [0.05, 0.09, 0.13];
    const ringsLocal = (r: number) => sdf.union(...RINGS.map((R) => sdf.torus(R, r).rotateX(90).at(0, 0, 0.013)), sdf.torus(0.172, r + 0.008).rotateX(90).at(0, 0, 0.013));
    // The stacked boss: a low dome, then two drums (r 0.06 and 0.04, 0.03 tall each) and a small cap.
    const boss = sdf.union(
      sdf.ellipsoid([0.075, 0.075, 0.035]).at(0, 0, 0.013),
      sdf.cylinder(0.06, 0.03, 0.008).rotateX(90).at(0, 0, 0.03),
      sdf.cylinder(0.04, 0.03, 0.008).rotateX(90).at(0, 0, 0.06),
      sdf.ellipsoid([0.028, 0.028, 0.014]).at(0, 0, 0.074),
    );
    const handle = sdf.capsule([-0.04, 0.0, -0.028], [0.04, 0.0, -0.028], 0.012);
    // One chipped corner on the rim: a subtracted sphere r 0.02.
    const chip = sdf.sphere(0.02).at(0.19 * Math.cos(52 * rad), 0.19 * Math.sin(52 * rad), 0.012);
    const shieldParts = shieldPose(sdf.union(disc, ringsLocal(0.012), boss).subtract(chip).at(0.05, -0.005, 0).union(handle));
    const shift = (s: sdf.Shape) => shieldPose(s.at(0.05, -0.005, 0));
    const field = shift(sdf.cylinder(0.16, 0.05).rotateX(90).at(0, 0, 0.02));
    const tops = shift(ringsLocal(0.015).intersect(sdf.halfSpace([0, 0, -1], -0.02)));
    const shieldCrack = shift(stroke([[0.1, 0.0], [0.12, 0.035], [0.102, 0.07], [0.122, 0.105]]));
    const shieldStrokes = [shieldCrack];
    // Recess paint: the grooves between the rings.
    const valleys = shift(sdf.union(...[0.07, 0.11, 0.151].map((R) => sdf.torus(R, 0.007).rotateX(90).at(0, 0, 0.012))));
    stone('shield', shieldParts, {
      bone: 'forearm.L',
      rot: 50,
      veinC: T.veinCool,
      detail: 0.006,
      maxTriangles: 6500,
      bump: grooveOf(shieldStrokes),
      after: (s) => s.paintWhere(field, T.field).paintWhere(tops, T.lit).paintWhere(valleys, T.rec).paintWhere(shieldCrack, T.crack),
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        plume: { rotate: [3 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
      }),
    });

    // The shield arm stays in front of the body; the sword arm swings a little.
    // shield: the [upper arm, forearm] X offsets that keep the shield's top edge clear of the cheek.
    // The legs come from motion.gait: planted stance sabatons, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `bob` the hips bob. The gait phase
    // runs a quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the right
    // arm is most forward. The hips' sway goes to gait, so the planted feet do not slide.
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      bob: number,
      armSwing: number,
      lean: number,
      flow: number,
      shield: readonly [number, number] = [0, 0],
    ) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 10,
          heel: HEEL,
          toe: TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, 0] as const },
          plume: { rotate: [flow * 0.5 + 5 * wave(p, 2, 0.2), 0, 4 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.15 * s + shield[0], 0, 3] as const },
          'forearm.L': { rotate: [shield[1], 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.2 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    // A knight in armor walks heavier: short steps, a low swing, long stances.
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.62, 0.005, 28, 3, 6, [4, 0]));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.42, 0.025, 50, 12, 22));

    // A diagonal slash, solved by targets (as the animated armor's attack). The wrist follows keys
    // in the chest's rest frame (reach); the blade follows its own keys; edgeUp turns the flat so
    // the edge leads. The arm is short and the helm is big, so the wind-up rises on the right side,
    // out beside the helm; the blade comes over the right shoulder, forward under the helm's rim,
    // and sweeps down across the front to the low left. The hips and chest turn, the left foot
    // steps, the hips drop, and the shield rises in front of the left side.
    const { keys, reach, orient, edgeUp } = motion;
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    const BLADE_DIR = rotZ(rotX([0, -1, 0], -12), -44); // the blade (local -Y) at rest, as swordPose
    const FLAT = rotZ(rotX([0, 0, 1], -12), -44); // the flat's normal (local +Z) at rest
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    // The rest elbow's bend direction, so the solved arm starts and ends on the rest pose.
    const POLE_REST = (() => {
      const s = mx(SHOULDER);
      const t = norm([WRIST_R[0] - s[0], WRIST_R[1] - s[1], WRIST_R[2] - s[2]]);
      const e: V3 = [ELBOW_R[0] - s[0], ELBOW_R[1] - s[1], ELBOW_R[2] - s[2]];
      const d = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
      const side = norm([e[0] - d * t[0], e[1] - d * t[1], e[2] - d * t[2]]);
      return add(s, [side[0] * 0.6, side[1] * 0.6, side[2] * 0.6]);
    })();
    const bladeKeys = [
      [0, BLADE_DIR],
      [0.14, norm([-0.92, 0.12, 0.3])], // out to the right, level
      [0.28, norm([-0.75, 0.55, -0.37])], // up and back over the right shoulder, out beside the helm
      [0.38, norm([-0.72, 0.58, -0.38])], // the hold at the top
      [0.44, norm([-0.6, 0.6, 0.5])], // over the shoulder: forward on the right, up and out
      [0.48, norm([-0.25, 0.15, 0.95])], // level, pointing forward, under the helm's rim
      [0.53, norm([0.55, -0.25, 0.8])], // across the front to the left
      [0.6, norm([0.8, -0.32, 0.5])], // low left
      [0.7, norm([0.78, -0.34, 0.5])], // the follow-through holds
      [0.86, norm([-0.3, -0.35, 0.89])], // back through the front, the tip clear of the floor
      [1, BLADE_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.265, 0.38, 0.06]],
            [0.28, [-0.275, 0.472, -0.035]],
            [0.38, [-0.278, 0.476, -0.04]],
            [0.44, [-0.27, 0.475, 0.065]],
            [0.48, [-0.19, 0.43, 0.155]],
            [0.53, [-0.15, 0.36, 0.175]],
            [0.6, [-0.15, 0.3, 0.163]],
            [0.7, [-0.15, 0.302, 0.162]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = norm(bladeAt(p));
        // The elbow points out and back in the wind-up, then out, down, and forward through the
        // cut, so the forearm stays in front of the breastplate.
        const pole = keys(p, [
          [0, POLE_REST],
          [0.14, [-0.6, 0.2, -0.2]],
          [0.4, [-0.6, 0.25, -0.15]],
          [0.48, [-0.5, 0.05, 0.4]],
          [0.75, [-0.5, 0.05, 0.4]],
          [1, POLE_REST],
        ] as const);
        const arm = reach(ARM_R, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: BLADE_DIR, up: FLAT }, { dir, up: edgeUp(bladeAt, p, FLAT) });
        const wind = ease(0, 0.3, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.42, 0.56, p) * (1 - ease(0.72, 1, p));
        const step = 24 * cut;
        const guard = ease(0, 0.2, p) * (1 - ease(0.75, 1, p));
        return {
          hips: { move: [0, -legDrop(LEG, step) - 0.004 * wind, 0.025 * cut - 0.01 * wind], rotate: [0, -10 * wind + 16 * cut, 0] },
          spine: { rotate: [-4 * wind + 7 * cut, 0, 0] },
          chest: { rotate: [-3 * wind + 4 * cut, -16 * wind + 20 * cut, 0] },
          // The head turns with the chest: the shield's top edge sits close under the left cheek.
          head: { rotate: [-2 * wind - 2 * cut, 3 * wind - 3 * cut, 0] },
          plume: { rotate: [6 * wind - 14 * cut, 0, -4 * wind + 6 * cut] },
          cloak: { rotate: [-3 * wind + 10 * cut, 0, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          // The shield stays up in front of the left side and comes a little forward, clear of the cheek.
          'upperarm.L': { rotate: [-30 * guard, 0, 0] },
          'forearm.L': { rotate: [35 * guard, 0, 0] },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
        };
      },
    });

    // hit: a blow from the front. The head and the chest snap back, the right foot steps back and
    // returns, the shield jolts down and out and comes back up; the plume and the cape lag.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(Math.min(1, Math.max(0, (p - 0.04) / 0.2))) + bump(Math.min(1, Math.max(0, (p - 0.58) / 0.32)));
        const jolt = keys(p, [[0, 0], [0.1, 1], [0.3, 0.15], [0.5, -0.2], [0.78, 0]] as const, 'spline');
        const lag = keys(p, [[0, 0], [0.12, 0.3], [0.26, 1], [0.48, -0.45], [0.72, 0.15], [1, 0]] as const, 'spline');
        const back = 0.03 * step;
        const plant = Math.asin(back / LEG) / rad; // the left foot stays planted as the hips move back
        return {
          hips: { move: [0, -legDrop(LEG, plant), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-12 * h, -6 * h, 3 * h] },
          plume: { rotate: [16 * lag, 0, 5 * lag] },
          cloak: { rotate: [9 * lag, 0, 0] },
          'upperarm.R': { rotate: [8 * h, 0, -10 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'upperarm.L': { rotate: [10 * jolt, 0, 10 * jolt] },
          'forearm.L': { rotate: [22 * jolt, 0, 0] },
          'leg.L': { rotate: [-plant, 0, 0] },
          'leg.R': { rotate: [plant + 8 * lift, 0, 0] },
          'foot.L': { rotate: [plant, 0, 0] },
          'foot.R': { rotate: [-plant - 8 * lift, 0, 0] },
        };
      },
    });

    // death: the blow snaps him back, he staggers a step, then topples onto his back. The big helm
    // and the cape hold the body up, so the hips stay high, the neck bends a little forward, and the
    // cape flattens under him (scale). The sword arm falls out to the right with the blade flat on
    // the ground; the shield arm falls to the left side and the shield lies face up over it.
    const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const rotY = (p: V3, d: number): V3 => {
      const c = Math.cos(d * rad);
      const s = Math.sin(d * rad);
      return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
    };
    const poleOf = (root: V3, mid: V3, end: V3) => {
      const t = norm(sub(end, root));
      const e = sub(mid, root);
      const d = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
      const side = norm([e[0] - d * t[0], e[1] - d * t[1], e[2] - d * t[2]]);
      return add(root, [side[0] * 0.6, side[1] * 0.6, side[2] * 0.6]);
    };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const POLE_REST_L = poleOf(SHOULDER, ELBOW_L, WRIST_L);
    const SHIELD_N = rotY(rotX(rotZ([0, 0, 1], -4), 4), 38); // the shield face's normal at rest
    const FOREARM_L = norm(sub(WRIST_L, ELBOW_L));
    const D = {
      tilt: 86, // the hips' final tilt back (90 = flat)
      drop: 0.045, // how far the hips come down
      back: 0.15, // how far the hips land behind the start
      neck: 9, // the neck and the head bend forward, so the helm clears the ground
      head: 12,
      cape: 8, // the cape swings toward the legs and flattens under him
      capeFlat: 0.4,
      leg: 34, // the legs lie back down to the ground
      wristR: [-0.27, 0.35, -0.1] as V3,
      bladeR: norm([-0.52, -0.85, -0.14]),
      wristL: [0.19, 0.235, 0.05] as V3,
      poleL: [0.5, 0.3, -0.3] as V3,
      shieldN: norm([0.25, -0.1, 0.96]),
    };
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.2, 0.4], [0.3, 0]] as const);
        const stag = keys(p, [[0.04, 0], [0.22, 1]] as const);
        const f = keys(p, [[0.26, 0], [0.68, 1]] as const);
        const g = f * f; // the fall starts slowly and ends fast
        const stand = 1 - g;
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.14)));
        const flat = keys(p, [[0.28, 0], [0.56, 1]] as const);
        // The cape bunches up and swings toward the legs as it meets the ground, then spreads.
        const crumple = keys(p, [[0.3, 0], [0.48, 1], [0.7, 1], [0.9, 0]] as const);
        const lag = keys(p, [[0, 0], [0.1, 0.8], [0.3, -0.3], [0.5, 0.6], [0.7, -1], [0.82, -0.6], [1, -0.7]] as const, 'spline');

        // The sword arm flies out in the blow and falls to the ground on the right; the blade
        // turns flat and points out toward the feet.
        const wristR = keys(p, [[0, WRIST_R], [0.1, [-0.27, 0.34, 0.08]], [0.36, [-0.28, 0.37, 0.03]], [0.74, D.wristR]] as const);
        const poleR = keys(p, [[0, POLE_REST], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.6, 0.4, -0.35]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(keys(p, [[0, BLADE_DIR], [0.1, norm([-0.75, -0.45, 0.48])], [0.4, norm([-0.75, -0.55, 0.36])], [0.74, D.bladeR]] as const));
        const flatUp = norm(keys(p, [[0, FLAT], [0.4, FLAT], [0.74, [0, 0, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: BLADE_DIR, up: FLAT }, { dir: blade, up: flatUp });

        // The shield arm flies out, then falls to his left side; the forearm turns the shield face up.
        const wristL = keys(p, [[0, WRIST_L], [0.1, [0.28, 0.3, 0.06]], [0.36, [0.27, 0.31, 0.03]], [0.76, D.wristL]] as const);
        const poleL = keys(p, [[0, POLE_REST_L], [0.2, [0.6, 0.3, -0.1]], [0.76, D.poleL]] as const);
        const armL = reach(ARM_L, wristL, poleL);
        const elbowL = motion.follow([SHOULDER], [armL.upper], ELBOW_L);
        const faceUp = norm(keys(p, [[0, SHIELD_N], [0.36, norm([0.9, 0, 0.44])], [0.76, D.shieldN]] as const));
        const forearmL = orient([armL.upper], { dir: FOREARM_L, up: SHIELD_N }, { dir: norm(sub(wristL, elbowL)), up: faceUp });

        const plant = Math.asin((0.03 * stag * stand) / LEG) / rad;
        // The soles stay flat on the ground while the legs trail the fall, then the toes turn up.
        const legL = -plant + D.leg * g * g;
        const sole = D.tilt * g - D.leg * g * g;
        const toes = keys(p, [[0.56, 0], [0.76, 1]] as const);
        return {
          hips: {
            move: [0, -legDrop(LEG, plant) * stand - D.drop * g + 0.014 * Math.sin(Math.PI * f) + 0.012 * land, -0.03 * stag - D.back * g],
            rotate: [-4 * hitB - 4 * stag * stand - D.tilt * g, 0, 0],
          },
          spine: { rotate: [-6 * hitB + 5 * stag * stand, 0, 0] },
          chest: { rotate: [-8 * hitB + 4 * stag * stand, 5 * hitB, 3 * stag * stand] },
          neck: { rotate: [-5 * hitB + D.neck * g, 0, 0] },
          head: { rotate: [-12 * hitB + D.head * g, 22 * g, 0] },
          plume: { rotate: [18 * lag - 22 * toes, 0, 6 * lag] },
          cloak: {
            rotate: [8 * hitB - D.cape * flat - 12 * crumple, 0, 0],
            scale: [1 + 0.1 * flat, 1 - 0.15 * crumple, 1 - (1 - D.capeFlat) * flat],
          },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: forearmL },
          // The right foot steps back in the stagger; the legs trail the fall and lie back down.
          'leg.L': { rotate: [legL, 0, 6 * g] },
          'leg.R': { rotate: [plant + 10 * stag * stand + (D.leg + 2) * g * g, 0, -6 * g] },
          'foot.L': { rotate: [plant + sole * (1 - toes) + 16 * toes, 0, 0] },
          'foot.R': { rotate: [-plant - 10 * stag * stand + sole * (1 - toes) + 16 * toes, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ shield arm by the shield's frame
    // The shield is rigid on the forearm, so the shield's pose sets the forearm: give the upper arm's
    // direction (chest rest frame) and the shield's turn (yaw about Y, tilt of the top forward, roll,
    // as in shieldPose). The elbow, the wrist, and the shield center follow; reach and orient solve
    // the arm. The rest values (upper arm at rest, 38, 4, -4) give the rest pose.
    const SHIELD_C: V3 = [0.236, 0.28, 0.092];
    const shieldLocal = (p: V3): V3 => rotZ(rotX(rotY(p, -38), -4), 4);
    const shieldTurn = (p: V3, yaw: number, tilt: number, roll: number): V3 => rotY(rotX(rotZ(p, roll), tilt), yaw);
    const ELBOW_IN_SHIELD = shieldLocal(sub(ELBOW_L, SHIELD_C));
    const WRIST_IN_SHIELD = shieldLocal(sub(WRIST_L, SHIELD_C));
    const UPPER_L = norm(sub(ELBOW_L, SHOULDER));
    const UPPER_LEN = Math.hypot(...sub(ELBOW_L, SHOULDER));
    const shieldArm = (u: V3, yaw: number, tilt: number, roll = -4) => {
      const d = norm(u);
      const elbow = add(SHOULDER, [d[0] * UPPER_LEN, d[1] * UPPER_LEN, d[2] * UPPER_LEN]);
      const center = sub(elbow, shieldTurn(ELBOW_IN_SHIELD, yaw, tilt, roll));
      const wrist = add(center, shieldTurn(WRIST_IN_SHIELD, yaw, tilt, roll));
      const arm = reach(ARM_L, wrist, elbow);
      const lower = orient([arm.upper], { dir: FOREARM_L, up: SHIELD_N }, { dir: norm(sub(wrist, elbow)), up: shieldTurn([0, 0, 1], yaw, tilt, roll) });
      return { upper: arm.upper, lower };
    };
    const blend = (a: V3, parts: readonly (readonly [V3, number])[]): V3 =>
      parts.reduce<V3>((acc, [v, w]) => add(acc, [(v[0] - a[0]) * w, (v[1] - a[1]) * w, (v[2] - a[2]) * w]), a);

    // attack2: a shield bash. Brace: the hips turn and the chest turns the left shoulder forward,
    // the weight goes back, the elbow draws back and the shield face turns to the front. Drive: the
    // left foot steps forward, the hips drop and move forward, and the shield punches straight
    // forward at chest height, the top tipped forward so the rim stays clear of the helm. The sword
    // stays ready at the right side. The plume and the cape lag and whip at the stop.
    const BASH = {
      braceU: [0.6, -0.7, -0.38] as V3, // the elbow draws back and out
      braceYaw: 36, // with the body's turn of -26, the face points nearly forward
      braceTilt: 8,
      driveU: [0.3, -0.1, 1] as V3, // the upper arm points forward, a little out (the forearm clears the cuirass)
      driveYaw: 14, // with the body's turn of -14, the face points straight forward
      driveTilt: 9,
      step: 26, // the lunge: the left foot lands 2 * LEG * sin(step) ahead
    };
    k.animation('attack2', {
      duration: 0.75,
      loop: false,
      pose: (_t, p) => {
        const brace = ease(0, 0.28, p) * (1 - ease(0.3, 0.44, p));
        const drive = ease(0.3, 0.46, p) * (1 - ease(0.62, 1, p));
        const ready = ease(0, 0.2, p) * (1 - ease(0.62, 1, p));
        const lead = ease(0.34, 0.48, p) * (1 - ease(0.64, 0.96, p)); // the left foot lags the hips a little, so it lifts
        const lag = keys(p, [[0, 0], [0.26, 0.35], [0.4, -0.2], [0.48, -1], [0.58, 0.85], [0.7, -0.35], [0.84, 0.15], [1, 0]] as const, 'spline');

        const u = blend(UPPER_L, [[BASH.braceU, brace], [BASH.driveU, drive]]);
        const yaw = 38 + (BASH.braceYaw - 38) * brace + (BASH.driveYaw - 38) * drive;
        const tilt = 4 + (BASH.braceTilt - 4) * brace + (BASH.driveTilt - 4) * drive;
        const armL = shieldArm(u, yaw, tilt);

        // The right foot stays planted; the left foot lands ahead.
        const reachZ = LEG * Math.sin(BASH.step * rad);
        const hipsZ = -0.015 * brace + reachZ * drive;
        const footL = 2 * reachZ * lead;
        const aR = Math.asin(hipsZ / LEG) / rad;
        const aL = -Math.asin((footL - hipsZ) / LEG) / rad;
        return {
          hips: { move: [0, -Math.max(legDrop(LEG, aL), legDrop(LEG, aR)), hipsZ], rotate: [0, -8 * brace - 4 * drive, 0] },
          spine: { rotate: [3 * brace + 8 * drive, 0, 0] },
          chest: { rotate: [2 * brace + 4 * drive, -18 * brace - 10 * drive, 0] },
          // The head keeps looking forward and lifts the chin a little behind the shield.
          neck: { rotate: [-3 * drive, 7 * brace + 4 * drive, 0] },
          head: { rotate: [2 * brace - 7 * drive, 14 * brace + 8 * drive, 0] },
          plume: { rotate: [14 * lag, 0, 3 * lag] },
          cloak: { rotate: [-10 * lag, 0, 0] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: [-6 * ready, 0, -6 * ready] },
          'forearm.R': { rotate: [-10 * ready, 0, 0] },
          'leg.L': { rotate: [aL, 0, 0] },
          'leg.R': { rotate: [aR, 0, 0] },
          'foot.L': { rotate: [-aL, 0, 0] },
          'foot.R': { rotate: [-aR, 0, 0] },
        };
      },
    });

    // victory: the sword goes out to the right and up, high beside the helm (the blade leans out,
    // clear of the helm and the plume, the flat to the front); the shield comes up at his left side;
    // the chest opens and tilts a little to the left. Then a proud nod, and he holds the pose with
    // the chin up. The plume and the cape sway.
    const WIN = {
      wrist: [-0.298, 0.458, 0.04] as V3,
      blade: norm([-0.22, 0.97, 0.1]),
      shieldU: [0.85, 0.25, 0.35] as V3, // the upper arm out and a little up: the shield rises about 7 cm
      shieldYaw: 48,
      shieldTilt: 0,
    };
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const r = ease(0, 0.3, p);
        const shield = ease(0.06, 0.34, p);
        const nod = keys(p, [[0.42, 0], [0.54, 1], [0.68, -0.4], [0.8, 0]] as const);
        const pride = ease(0.6, 0.8, p);
        const look = r * (1 - ease(0.42, 0.6, p));
        const lag = keys(p, [[0, 0], [0.14, -0.6], [0.3, 0.7], [0.42, -0.3], [0.56, -0.8], [0.7, 0.9], [0.84, -0.35], [1, 0.1]] as const, 'spline');
        const sway = keys(p, [[0, 0], [0.18, -0.5], [0.34, 0.6], [0.5, -0.3], [0.66, 0.45], [0.82, -0.15], [1, 0.05]] as const, 'spline');

        const wristR = keys(
          p,
          [
            [0, WRIST_R],
            [0.12, [-0.27, 0.37, 0.1]],
            [0.26, [-0.296, 0.462, 0.042]],
            [0.32, [-0.298, 0.466, 0.04]],
            [0.42, WIN.wrist],
          ] as const,
          'spline',
        );
        const poleR = keys(p, [[0, POLE_REST], [0.12, [-0.6, 0.1, -0.1]], [0.3, [-0.6, 0.15, -0.25]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(
          keys(p, [[0, BLADE_DIR], [0.12, norm([-0.85, 0.2, 0.48])], [0.26, norm([-0.26, 0.95, 0.14])], [0.32, norm([-0.18, 0.98, 0.1])], [0.42, WIN.blade]] as const, 'spline'),
        );
        const flatUp = norm(keys(p, [[0, FLAT], [0.12, [0, 1, 0.2]], [0.26, [0.1, 0.2, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: BLADE_DIR, up: FLAT }, { dir: blade, up: flatUp });

        const armL = shieldArm(blend(UPPER_L, [[WIN.shieldU, shield]]), 38 + (WIN.shieldYaw - 38) * shield, 4 + (WIN.shieldTilt - 4) * shield);
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0], rotate: [0, 0, 0] },
          spine: { rotate: [-4 * r, 0, -3 * r] },
          chest: { rotate: [-2 * r, 0, -6 * r] },
          // The head leans with the chest, away from the sword; the right ear disc stays clear of the hilt.
          neck: { rotate: [3 * nod, 0, 0] },
          head: { rotate: [-6 * look + 10 * nod - 5 * pride, -10 * look, 0] },
          plume: { rotate: [12 * lag, 0, 6 * sway] },
          cloak: { rotate: [8 * sway, 0, 4 * lag] },
          // The right shoulder lifts a little (a shrug), so the sword goes higher.
          'upperarm.R': { rotate: armR.upper, move: [0, 0.015 * r, 0] },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: [0, 0, stance] },
          'leg.R': { rotate: [0, 0, -stance] },
          'foot.L': { rotate: [0, 0, -stance] },
          'foot.R': { rotate: [0, 0, stance] },
        };
      },
    });
  },
});
