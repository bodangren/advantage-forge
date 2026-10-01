import { addPart, defineAsset, mapTint, motion, noise, profile, sdf, THREE } from '../src/index.js';
import { clockworkSoldierHalberd } from './parts/clockwork-soldier-halberd.js';

/**
 * Clockwork soldier — Chibi Quest construct enemy: a brass wind-up knight about 0.8 m to the top
 * of its dome and 1.04 m to the halberd tip, faces +Z. Target:
 * docs/enemy-mockups/clockwork-soldier_001.jpg. Built on the animated armor's skeleton, gait, and
 * clip set (knee bones, a weapon hand), with the armor bodies replaced.
 *
 * Role: a dungeon guard seen in 3D and as a 128 px sprite; the boxy head with its glowing gear
 *   window and the halberd must read at once.
 * One idea: a huge riveted brass box for a head, one round window in it with gears and a glowing
 *   orange core, on a small body of spring-coil limbs, holding a halberd upright.
 * Shape language: square (head, forearms, shins, feet) with round accents (window, pauldrons,
 *   coils), and sharp accents for menace (halberd, bracer spikes, hook).
 * Palette (60/30/10): brass #b8924a (lit #d8b878, shade #8a6a30); steel and springs #6a6a70;
 *   the core glow #ff8a1a as the accent on dark gears #4a3a2a.
 * Value plan: the orange core in the dark window is the strongest contrast; the brass head is the
 *   large mid-light mass; the steel coils and the halberd are the dark note.
 * Bodies: head, gears, core, rivets, dome, finial, neck, chest, key, pelvis, pauldrons, bracers,
 *   springs, hands, shins, feet, halberd, halberd-trim.
 * Rig: the armor's skeleton; `cloak` is the wind-up key on the back, `plume` the finial on the
 *   dome, `weapon` the halberd on `hand.R`. Clips: idle, walk, run, attack (an overhead chop),
 *   hit, death, awaken (the wind-up: the key spins, the core lights, the helm lifts).
 */

const C = {
  brass: '#9a7a36',
  brassLit: '#c4a45a',
  brassShade: '#5a4420',
  steel: '#6a6a70',
  coil: '#5a5a60',
  steelDark: '#3c3c42',
  gear: '#4a3a2a',
  glow: '#ff8a1a',
  floor: '#1a1208',
  coreBase: '#4a1a04',
};

type V3 = readonly [number, number, number];
type Rgb = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const along = (p: V3, d: V3, s: number): V3 => [p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s];
/** Turns local +Y toward `d` (rotateZ, then rotateX) and moves the origin to `p`. */
const alignY = (s: sdf.Shape, d: V3, p: V3) => {
  const n = norm(d);
  return s
    .rotateZ((Math.asin(-n[0]) * 180) / Math.PI)
    .rotateX((Math.atan2(n[2], n[1]) * 180) / Math.PI)
    .at(...p);
};

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
/** Riveted panels on a box: a dark seam line 2.4 cm in from each edge of each face. */
const panelled = (cx: number, cy: number, cz: number, hx: number, hy: number, hz: number, wp: (x: number, y: number, z: number, base: Rgb) => Rgb, skip?: (x: number, y: number, z: number) => boolean) => (x: number, y: number, z: number, base: Rgb): Rgb => {
  const d = [hx - Math.abs(x - cx), hy - Math.abs(y - cy), hz - Math.abs(z - cz)].sort((a, b) => a - b) as [number, number, number];
  if (d[0] < 0.008 && ((Math.abs(d[1] - 0.024) < 0.0028 && d[2] > 0.02) || (Math.abs(d[2] - 0.024) < 0.0028 && d[1] > 0.02)) && !(skip && skip(x, y, z))) return scaleRgb(base, 0.32);
  return wp(x, y, z, base);
};
const dents = (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 45, y * 45, z * 45, 2);

// Joints (the armor's shoulders, arms, and legs).
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.2, 0.33, 0.0];
const WRIST_R: V3 = [-0.215, 0.29, 0.1];
const ELBOW_L: V3 = [0.19, 0.33, 0.0];
const WRIST_L: V3 = [0.24, 0.29, 0.075];
// A wide stance: the feet are 0.26 m apart and the shins lean 8 degrees outward.
const HIP: V3 = [0.085, 0.195, 0];
const ANKLE: V3 = [0.13, 0.07, 0];
const KNEE: V3 = [0.121, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left foot (y = 0): heel and toe.
const HEEL: V3 = [0.13, 0, -0.013];
const TOE: V3 = [0.13, 0, 0.095];

// The halberd stands upright through the right fist; the pole runs from 0.235 below to 0.765
// above the fist center. The blade sticks out to the right (-X).
const FIST_R = along(WRIST_R, norm(sub(WRIST_R, ELBOW_R)), 0.045);
const FIST_L = along(WRIST_L, norm(sub(WRIST_L, ELBOW_L)), 0.045);
const halberdPose = (s: sdf.Shape) => s.at(...FIST_R);

// Head box.
const HEAD_C: V3 = [0, 0.63, 0];
const HEAD_H: V3 = [0.175, 0.14, 0.16]; // half sizes
const WINDOW: V3 = [0, 0.63, 0.16];

export default defineAsset({
  name: 'clockwork-soldier',
  description: 'Chibi clockwork soldier dungeon enemy: a brass wind-up knight with a huge riveted box head, a round window of gears with a glowing core, spring-coil limbs, and a halberd.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/clockwork-soldier_001.jpg',
  variants: {
    metal: { brass: C.brass, iron: '#5a5a60', copper: '#9a5a3a' },
    glow: { orange: C.glow, blue: '#3ac8ff', green: '#5aff6a' },
  },
  presets: {
    ironclad: { metal: 'iron', glow: 'blue' },
    verdigris: { metal: 'copper', glow: 'green' },
    ember: { metal: 'copper', glow: 'orange' },
  },

  build(k) {
    const SLOT = {
      brass: k.tint('metal'),
      brassLit: k.tint('metal', { color: C.brassLit, follow: 1 }),
      brassShade: k.tint('metal', { color: C.brassShade, follow: 1 }),
      glow: k.tint('glow'),
    };
    const PLUME_AT: V3 = [0, 0.8, -0.03];
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      plume: { parent: 'head', at: PLUME_AT, tail: [0, 0.88, -0.03] },
      // The wind-up key on the back: it spins about the Z axis through its pivot.
      cloak: { parent: 'chest', at: [0, 0.35, -0.12] },
      // The core glow on its own bone, so the hit and the death can pulse or put it out.
      glow: { parent: 'head', at: [WINDOW[0], WINDOW[1], 0.14] },
      weapon: { parent: 'hand.R', at: FIST_R },
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

    // Rivet positions (used for the rivets and for the oil streaks that drip below them).
    const HY = HEAD_C[1];
    const headRivetPts: V3[] = [];
    const frontXs = [-0.14, -0.1, -0.06, -0.02, 0.02, 0.06, 0.1, 0.14];
    for (const x of frontXs) {
      headRivetPts.push([x, HY + HEAD_H[1] - 0.024, HEAD_H[2] + 0.001]);
      headRivetPts.push([x, HY - HEAD_H[1] + 0.024, HEAD_H[2] + 0.001]);
    }
    for (const sx of [-1, 1]) for (const y of [0.55, 0.59, 0.67, 0.71]) headRivetPts.push([sx * 0.15, y, HEAD_H[2] + 0.001]);
    for (const z of [-0.11, -0.065, -0.02, 0.025, 0.07, 0.115]) {
      headRivetPts.push([-HEAD_H[0] - 0.001, HY + HEAD_H[1] - 0.024, z]);
      headRivetPts.push([-HEAD_H[0] - 0.001, HY - HEAD_H[1] + 0.024, z]);
    }
    for (const z of [-0.11, -0.055, 0.055, 0.11]) {
      headRivetPts.push([HEAD_H[0] + 0.001, HY + HEAD_H[1] - 0.024, z]);
      headRivetPts.push([HEAD_H[0] + 0.001, HY - HEAD_H[1] + 0.024, z]);
    }
    for (const x of [-0.14, -0.09, -0.045, 0.045, 0.09, 0.14]) {
      headRivetPts.push([x, HY + HEAD_H[1] + 0.001, HEAD_H[2] - 0.024]);
      headRivetPts.push([x, HY + HEAD_H[1] + 0.001, -HEAD_H[2] + 0.024]);
    }
    const CHEST_Z = 0.13;
    const chestShape = sdf.smoothUnion(0.03, sdf.box([0.3, 0.24, 0.22], 0.05).at(0, 0.355, 0), sdf.ellipsoid([0.12, 0.11, 0.08]).at(0, 0.375, 0.05));
    void CHEST_Z;
    const chestRivetPts: V3[] = [[-0.09, 0.42], [0.09, 0.42], [-0.11, 0.3], [0.11, 0.3], [0, 0.29]].map(([x, y]) => {
      const hit = sdf.raycast(chestShape.round(0.001), [x!, y!, 1], [0, 0, -1])!;
      return [hit[0], hit[1], hit[2]] as V3;
    });
    const pelvisBox = sdf.box([0.25, 0.05, 0.17], 0.024).at(0, 0.207, 0);
    const pelvisRivetPts: V3[] = [-0.07, 0.07].map((x) => {
      const hit = sdf.raycast(pelvisBox.round(0.001), [x, 0.207, 1], [0, 0, -1])!;
      return [hit[0], hit[1], hit[2]] as V3;
    });

    // ------------------------------------------------------------------ head: a riveted brass box with a round window
    const headBox = sdf.box([HEAD_H[0] * 2, HEAD_H[1] * 2, HEAD_H[2] * 2], 0.016).at(...HEAD_C);
    const recess = sdf.cylinder(0.076, 0.05).rotateX(90).at(WINDOW[0], WINDOW[1], WINDOW[2]);
    const ring = sdf.torus(0.083, 0.012).rotateX(90).at(WINDOW[0], WINDOW[1], WINDOW[2] + 0.002);
    // A round dial on the left side: a flange, a bezel, a needle, and a small brass knob (the dark
    // dial face is its own body, below).
    const DIAL_Y = 0.655;
    const DIAL_Z = -0.03;
    const dialX = HEAD_H[0];
    const dial = sdf.union(
      sdf.cylinder(0.058, 0.014, 0.005).rotateZ(90).at(dialX + 0.005, DIAL_Y, DIAL_Z),
      sdf.torus(0.05, 0.0065).rotateZ(90).at(dialX + 0.014, DIAL_Y, DIAL_Z),
      sdf.cylinder(0.016, 0.026, 0.005).rotateZ(90).at(dialX + 0.026, DIAL_Y, DIAL_Z),
      sdf.sphere(0.017).at(dialX + 0.04, DIAL_Y, DIAL_Z),
      sdf.box([0.006, 0.006, 0.036], 0.002).at(dialX + 0.0175, DIAL_Y + 0.016, DIAL_Z + 0.016).rotateX(0),
    );
    const dialFace = sdf.cylinder(0.046, 0.006, 0.002).rotateZ(90).at(dialX + 0.0115, DIAL_Y, DIAL_Z);
    const head = sdf
      .smoothUnion(0.005, headBox.subtract(recess), ring)
      .smoothUnion(0.006, dial)
      .paintFn(
        panelled(HEAD_C[0], HEAD_C[1], HEAD_C[2], HEAD_H[0], HEAD_H[1], HEAD_H[2], weathered({ cy: HEAD_C[1], hy: HEAD_H[1], rivets: headRivetPts }), (x, y, z) => (z > 0.1 && Math.hypot(x - WINDOW[0], y - WINDOW[1]) < 0.105) || (x > 0.15 && Math.hypot(y - DIAL_Y, z - DIAL_Z) < 0.07)),
      );
    k.body('head-box', head, { color: SLOT.brass, roughness: 0.6, metalness: 0.65, bone: 'head', detail: 0.004, textureDensity: 2, bump: dents });
    k.body('dial-face', dialFace, { color: C.floor, roughness: 0.8, bone: 'head', detail: 0.004 });

    // The window: a dark floor, four small brass gears around the center, a glowing core over
    // them, and a translucent halo so the glow blooms at 128 px.
    const FLOOR_Z = 0.139;
    k.body('window-floor', sdf.cylinder(0.073, 0.008, 0.002).rotateX(90).at(WINDOW[0], WINDOW[1], FLOOR_Z).bone('head'), { color: C.floor, roughness: 0.9, detail: 0.004 });
    const gear = (cx: number, cy: number, z: number, R: number, teeth: number, phase: number) => {
      const disc = sdf.cylinder(R, 0.008, 0.0015).rotateX(90).subtract(sdf.cylinder(R * 0.3, 0.04).rotateX(90));
      const tooth = sdf.box([R * 0.42, R * 0.44, 0.008], 0.0015);
      const ts = Array.from({ length: teeth }, (_, i) => tooth.at(R + R * 0.08, 0, 0).rotateZ(phase + (360 / teeth) * i));
      return sdf.union(disc, ...ts).at(cx, cy, z);
    };
    const GR = 0.048;
    const gears = sdf.union(
      ...[45, 135, 225, 315].map((a, i) => {
        const r = (a * Math.PI) / 180;
        return gear(WINDOW[0] + GR * Math.cos(r), WINDOW[1] + GR * Math.sin(r), 0.148 + 0.003 * (i % 2), 0.025, 6, 12 * i);
      }),
    );
    k.body('gears', gears.bone('head'), { color: SLOT.brass, roughness: 0.5, metalness: 0.7, flat: true, detail: 0.003, textureDensity: 2 });
    const core = sdf.sphere(0.04).at(WINDOW[0], WINDOW[1], 0.14);
    k.body('core', core, { color: C.coreBase, roughness: 0.2, emissive: SLOT.glow, emissiveIntensity: 2.4, bone: 'glow', detail: 0.0035, textureDensity: 2 });
    k.body('halo', sdf.sphere(0.06).at(WINDOW[0], WINDOW[1], 0.14), { color: SLOT.glow, roughness: 1, emissive: SLOT.glow, emissiveIntensity: 1.0, opacity: 0.35, bone: 'glow', detail: 0.005 });

    // The dome on top, and a spring finial on it (its own bone).
    const dome = sdf
      .ellipsoid([0.088, 0.055, 0.088])
      .at(0, 0.766, -0.03)
      .intersect(sdf.halfSpace([0, -1, 0], -0.762))
      .round(0.004);
    k.body('dome', dome.paintFn(weathered({ cy: 0.766, hy: 0.055, bias: 0.1 })), { color: SLOT.brass, roughness: 0.55, metalness: 0.65, bone: 'head', detail: 0.004 });
    const finial = sdf.smoothUnion(
      0.006,
      sdf.chain(
        [
          [0, 0.815, -0.03, 0.007],
          [0.004, 0.85, -0.03, 0.005],
          [0, 0.878, -0.03, 0.005],
        ],
        0.01,
      ),
      sdf.sphere(0.013).at(0, 0.886, -0.03),
    );
    k.body('finial', finial, { color: C.steel, roughness: 0.4, metalness: 0.7, bone: 'plume', detail: 0.0035 });

    // ------------------------------------------------------------------ torso: a rounded brass chest plate, a neck collar
    const chest = chestShape.paintFn(weathered({ cy: 0.355, hy: 0.12, rivets: chestRivetPts }));
    k.body('chest-plate', chest, { color: SLOT.brass, roughness: 0.6, metalness: 0.65, bone: 'chest', detail: 0.005, bump: dents });
    k.body('neck-collar', sdf.cylinder(0.07, 0.05, 0.01).at(0, 0.478, -0.005), { color: C.steelDark, roughness: 0.5, metalness: 0.7, bone: 'neck' });

    // The wind-up key on the back: a bar with two round lobes on a shaft.
    const key = sdf.union(
      sdf.cylinder(0.012, 0.07).rotateX(90).at(0, 0.35, -0.135),
      sdf.box([0.1, 0.03, 0.016], 0.006).at(0, 0.35, -0.17),
      ...[-1, 1].map((s) => sdf.cylinder(0.034, 0.016, 0.004).rotateX(90).subtract(sdf.cylinder(0.015, 0.05).rotateX(90)).at(s * 0.05, 0.35, -0.17)),
    );
    k.body('key', key.paintFn(weathered({ cy: 0.35, hy: 0.05, bias: 0.1 })), { color: SLOT.brass, roughness: 0.55, metalness: 0.65, bone: 'cloak', detail: 0.004 });

    // ------------------------------------------------------------------ pelvis plate and hip guards
    const guard = sdf.box([0.05, 0.06, 0.13], 0.016).rotateZ(-22).at(0.152, 0.2, 0);
    const pelvis = sdf.union(pelvisBox.bone('hips'), pair(guard.bone('hips'))).paintFn(weathered({ cy: 0.207, hy: 0.04, bias: -0.1, rivets: pelvisRivetPts }));
    k.body('pelvis', pelvis, { color: SLOT.brass, roughness: 0.6, metalness: 0.65, bump: dents });

    // ------------------------------------------------------------------ springs: waist, arms, thighs
    const coil = (a: V3, b: V3, R: number, r: number, n: number) => {
      const d = sub(b, a);
      const len = Math.hypot(d[0], d[1], d[2]);
      const rings = Array.from({ length: n }, (_, i) => sdf.torus(R, r).rotateX(8).at(0, len * (n === 1 ? 0 : i / (n - 1)), 0));
      const core = sdf.cylinder(R - r * 1.6, len + r).at(0, len / 2, 0);
      return alignY(sdf.union(core, ...rings), d, a);
    };
    const waist = sdf.union(
      sdf.torus(0.072, 0.012).at(0, 0.227, 0),
      sdf.torus(0.072, 0.012).at(0, 0.24, 0),
      sdf.cylinder(0.066, 0.05).at(0, 0.232, 0),
    );
    const armUp = (sh: V3, el: V3, tag: string) => coil(lerp(sh, el, 0.0), lerp(sh, el, 1.05), 0.028, 0.0075, 6).bone(tag);
    const thigh = coil([HIP[0], 0.192, 0], [0.1145, 0.138, 0], 0.035, 0.0065, 6).bone('leg.L');
    const springs = sdf.union(waist.bone('spine'), armUp(SHOULDER, ELBOW_L, 'upperarm.L'), armUp(mx(SHOULDER), ELBOW_R, 'upperarm.R'), pair(thigh));
    k.body('springs', springs, { color: C.coil, roughness: 0.4, metalness: 0.7, detail: 0.005, bump: dents });

    // ------------------------------------------------------------------ pauldrons: two round domes
    const dome1 = (s: number) => sdf.ellipsoid([0.074 * s, 0.05 * s, 0.078 * s]).intersect(sdf.halfSpace([0, -1, 0], 0.008 * s)).round(0.004);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-24).at(0.162, 0.432, 0);
    const pauldronLocal = sdf.union(dome1(1), dome1(1.12).at(0, -0.02, 0));
    k.body('pauldrons', pair(pauldronPose(pauldronLocal).bone('upperarm.L')).paintFn(weathered({ cy: 0.43, hy: 0.06, bias: 0.08 })), {
      color: SLOT.brass,
      roughness: 0.55,
      metalness: 0.65,
      bump: dents,
    });
    const pauldronRivets = pair(
      pauldronPose(
        sdf.union(
          ...[-60, 0, 60, 120, 180, 240].map((a) => {
            const r = (a * Math.PI) / 180;
            return sdf.sphere(0.007).at(0.075 * Math.sin(0.95) * Math.cos(r), 0.052 * Math.cos(0.95), 0.08 * Math.sin(0.95) * Math.sin(r));
          }),
        ),
      ).bone('upperarm.L'),
    );

    // ------------------------------------------------------------------ forearms (spiked bracers), hands, grapple, chain
    const bracer = (e: V3, w: V3, side: 1 | -1, tag: string) => {
      const d = sub(w, e);
      const len = Math.hypot(d[0], d[1], d[2]);
      const box = alignY(sdf.box([0.08, len * 1.05, 0.076], 0.018), d, lerp(e, w, 0.48));
      const p0 = lerp(e, w, 0.3);
      const spikeBase: V3 = [p0[0] + side * 0.03, p0[1] + 0.035, p0[2] - 0.02];
      const spike = sdf.cone(spikeBase, [spikeBase[0] + side * 0.035, spikeBase[1] + 0.085, spikeBase[2] - 0.035], 0.024, 0.004).round(0.002);
      // A band at the wrist end.
      const band = alignY(sdf.box([0.09, 0.02, 0.086], 0.01), d, lerp(e, w, 0.94));
      return sdf.union(box, spike, band).bone(tag);
    };
    const bracers = sdf.union(bracer(ELBOW_L, WRIST_L, 1, 'forearm.L'), bracer(ELBOW_R, WRIST_R, -1, 'forearm.R')).paintFn(weathered({ cy: 0.3, hy: 0.06, bias: -0.08 }));
    k.body('bracers', bracers, { color: SLOT.brass, roughness: 0.6, metalness: 0.65, bump: dents });

    // The right fist closes around the pole; the left fist grips a rod that ends in a hook.
    const fistR = sdf.smoothUnion(
      0.01,
      sdf.ellipsoid([0.036, 0.042, 0.038]).at(...FIST_R),
      sdf.capsule([FIST_R[0] - 0.026, FIST_R[1] + 0.016, FIST_R[2] + 0.03], [FIST_R[0] + 0.026, FIST_R[1] + 0.016, FIST_R[2] + 0.03], 0.013),
      sdf.capsule([FIST_R[0] - 0.026, FIST_R[1] - 0.012, FIST_R[2] + 0.03], [FIST_R[0] + 0.026, FIST_R[1] - 0.012, FIST_R[2] + 0.03], 0.013),
    );
    const fistL = sdf.smoothUnion(
      0.01,
      sdf.ellipsoid([0.036, 0.042, 0.038]).at(...FIST_L),
      sdf.capsule([FIST_L[0] - 0.026, FIST_L[1] + 0.016, FIST_L[2] + 0.03], [FIST_L[0] + 0.026, FIST_L[1] + 0.016, FIST_L[2] + 0.03], 0.013),
      sdf.capsule([FIST_L[0] - 0.026, FIST_L[1] - 0.012, FIST_L[2] + 0.03], [FIST_L[0] + 0.026, FIST_L[1] - 0.012, FIST_L[2] + 0.03], 0.013),
    );
    const RODTOP = FIST_L[1] + 0.15;
    const HOOK_R = 0.034;
    const hook = sdf.extrude(profile.arc(HOOK_R, 0.014, 10, 190), 0.018, 0.005).at(FIST_L[0] + HOOK_R, RODTOP, FIST_L[2]);
    const rod = sdf.capsule([FIST_L[0], FIST_L[1] - 0.05, FIST_L[2]], [FIST_L[0], RODTOP, FIST_L[2]], 0.009);
    const eye = sdf.torus(0.014, 0.004).rotateX(90).at(FIST_L[0], FIST_L[1] - 0.056, FIST_L[2] + 0.004);
    k.body('hands', sdf.union(fistR.bone('hand.R'), sdf.smoothUnion(0.008, fistL, rod, hook, eye).bone('hand.L')), {
      color: C.steelDark,
      roughness: 0.45,
      metalness: 0.7,
      detail: 0.004,
      bump: dents,
    });
    // The chain: alternating links hanging from the eye, curling toward the front.
    const links = Array.from({ length: 8 }, (_, i) => {
      const t = i / 7;
      const p: V3 = [FIST_L[0] + 0.012 * Math.sin(t * 3), FIST_L[1] - 0.072 - i * 0.017, FIST_L[2] + 0.004 + 0.02 * t * t];
      return (i % 2 === 0 ? sdf.torus(0.0105, 0.0034) : sdf.torus(0.0105, 0.0034).rotateX(90)).at(...p);
    });
    const weight = sdf.sphere(0.014).at(FIST_L[0] + 0.012, FIST_L[1] - 0.072 - 8 * 0.017, FIST_L[2] + 0.024);
    k.body('chain', sdf.union(...links, weight).bone('hand.L'), { color: C.steel, roughness: 0.4, metalness: 0.7, detail: 0.0028 });

    // ------------------------------------------------------------------ legs: box shins with a knee band, wedge feet
    // The shin leans 8 degrees outward toward the ankle (KNEE to ANKLE); the box is built upright
    // at the origin and aligned to the knee-to-ankle line.
    const shinDir = sub(KNEE, ANKLE);
    const shinAt = lerp(ANKLE, KNEE, 0.56);
    const shin = alignY(
      sdf.smoothUnion(
        0.008,
        sdf.box([0.09, 0.07, 0.09], 0.018),
        sdf.box([0.104, 0.026, 0.102], 0.012).at(0, 0.03, 0.003),
      ),
      shinDir,
      shinAt,
    ).bone('leg.L');
    const footProfile = profile.polygon([
      [-0.06, 0],
      [0.06, 0],
      [0.05, 0.076],
      [-0.05, 0.076],
    ]);
    const foot = sdf
      .extrude(footProfile, 0.15, 0.007)
      .at(0, 0, 0.045)
      .intersect(sdf.halfSpace([0, 0.884, 0.468], 0.0805))
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shins', pair(shin).paintFn(weathered({ cy: 0.105, hy: 0.045 })), { color: SLOT.brass, roughness: 0.6, metalness: 0.65, bump: dents });
    k.body('feet', pair(foot).paintFn(weathered({ cy: 0.04, hy: 0.04, bias: -0.1 })), { color: SLOT.brass, roughness: 0.6, metalness: 0.65, bump: dents });

    // ------------------------------------------------------------------ rivets (dark bolt heads)
    const rv = (p: V3, tag: string, r = 0.01) => sdf.sphere(r).at(...p).bone(tag);
    const headRivets = headRivetPts.map((p) => rv(p, 'head'));
    const chestRivets = chestRivetPts.map((p) => rv(p, 'chest', 0.0085));
    const pelvisRivets = pelvisRivetPts.map((p) => rv(p, 'hips', 0.0085));
    k.body('rivets', sdf.union(...headRivets, ...chestRivets, ...pelvisRivets, pauldronRivets), {
      color: C.steelDark,
      roughness: 0.4,
      metalness: 0.75,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ halberd (in the right fist)
    addPart(k, clockworkSoldierHalberd(mapTint(k)), { pose: halberdPose });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, quat, euler } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    /** Smoothstep between keys: rests at each key, so holds and quick moves read clearly. */
    const sm = (p: number, ks: readonly (readonly [number, number])[]) => {
      if (p <= ks[0]![0]) return ks[0]![1];
      for (let i = 1; i < ks.length; i++) {
        if (p <= ks[i]![0]) return ks[i - 1]![1] + (ks[i]![1] - ks[i - 1]![1]) * ease(ks[i - 1]![0], ks[i]![0], p);
      }
      return ks[ks.length - 1]![1];
    };

    // Idle: the key ticks back and forth, the head and hands drift a little.
    const IDLE = 2.6;
    const idlePose = (p: number): Record<string, { move?: V3; rotate?: V3 }> => ({
      hips: { move: [0, -0.003 * bump(p), 0] },
      chest: { rotate: [1.5 * wave(p), 0, 0] },
      head: { move: [0, 0.006 * wave(p, 1, 0.2), 0], rotate: [2 * wave(p, 1, 0.35), 4 * wave(p, 1, 0.1), 2 * wave(p, 2, 0.2)] },
      plume: { rotate: [8 * wave(p, 2, 0.4), 0, 8 * wave(p, 2, 0.3)] },
      cloak: { rotate: [0, 0, 28 * wave(p, 1, 0)] },
      'hand.L': { move: [0.004 * wave(p, 1, 0.5), 0.005 * wave(p, 1, 0.1), 0] },
      'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 1.5 * bump(p)] },
    });
    k.animation('idle', { duration: IDLE, pose: (_t, p) => idlePose(p) });

    // A stiff, clanking stride. The halberd stays upright: the hand cancels the arm swing.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, spins: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 8,
          heel: HEEL,
          toe: TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        const swing = -armSwing * 0.12 * s;
        const raise = lean > 5 ? 14 : 6;
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -6 * s, 0] as const },
          head: { move: [0, 0.006 * bump(p, 2, 0.35), 0] as const, rotate: [-lean + 2 * wave(p, 2, 0.35), 4 * s, 2 * wave(p, 1, 0.3)] as const },
          plume: { rotate: [10 * wave(p, 2, 0.2) - lean, 0, 8 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [0, 0, 360 * spins * p] as const },
          'upperarm.L': { rotate: [armSwing * 0.6 * s, 0, 4] as const },
          'forearm.L': { rotate: [-armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
          'upperarm.R': { rotate: [swing - raise, 0, -3] as const },
          'hand.R': { rotate: [-swing + raise, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(1.0, 0.09, 0.02, 0.64, 0.005, 24, 3, 1));
    k.animation('run', stride(0.62, 0.13, 0.035, 0.44, 0.02, 40, 9, 1));

    // Attack: an overhead chop. The arm lifts the halberd up and back (the blade turns to face
    // forward), then the arm comes down and the halberd swings through, the blade leading, to a
    // low forward hold. All the rotations about X add up: the arm angle `a` raises the fist, the
    // forearm `f` bends the elbow, and the hand takes the rest so the pole pitch is `th`.
    k.animation('attack', {
      duration: 0.95,
      loop: false,
      pose: (_t, p) => {
        const a = sm(p, [[0, 0], [0.32, 105], [0.42, 108], [0.54, 35], [0.68, 30], [1, 0]]);
        const f = sm(p, [[0, 0], [0.32, -20], [0.42, -22], [0.54, -5], [0.68, -5], [1, 0]]);
        const th = sm(p, [[0, 0], [0.32, -55], [0.42, -58], [0.54, 95], [0.68, 92], [1, 0]]);
        const twist = ease(0, 0.3, p) * (1 - ease(0.72, 0.96, p));
        const wind = ease(0, 0.32, p) * (1 - ease(0.42, 0.5, p));
        const cut = ease(0.43, 0.56, p) * (1 - ease(0.7, 1, p));
        return {
          hips: { move: [0, -legDrop(LEG, 14 * cut) - 0.006 * wind, 0.03 * cut - 0.01 * wind], rotate: [0, -6 * wind + 10 * cut, 0] },
          spine: { rotate: [-5 * wind + 9 * cut, 0, 0] },
          chest: { rotate: [-3 * wind + 6 * cut, -8 * wind + 12 * cut, 0] },
          head: { rotate: [-3 * wind + 5 * cut, 8 * wind - 10 * cut, 0] },
          plume: { rotate: [-14 * wind + 22 * cut, 0, 0] },
          cloak: { rotate: [0, 0, 300 * ease(0, 0.6, p)] },
          'upperarm.R': { rotate: [-a, 0, -14 * wind] },
          'forearm.R': { rotate: [f, 0, 0] },
          'hand.R': { rotate: [th + a - f, 0, 22 * wind] },
          weapon: { rotate: [0, -90 * twist, 0] },
          'upperarm.L': { rotate: [14 * wind - 12 * cut, 0, 8 * wind] },
          'leg.L': { rotate: [4 * wind - 20 * cut, 0, 0] },
          'leg.R': { rotate: [-4 * wind + 12 * cut, 0, 0] },
          'foot.L': { rotate: [12 * cut, 0, 0] },
        };
      },
    });

    // Hit: the blow rocks the heavy head back; the core flares.
    k.animation('hit', {
      duration: 0.42,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.15, 1], [0.36, 0.7], [1, 0]] as const);
        const pop = keys(p, [[0, 0], [0.12, 1], [0.34, 0], [0.44, 0.3], [0.56, 0], [1, 0]] as const);
        const back = -0.022 * r;
        const legL = (Math.atan2(back, 0.19) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 6 * r, 0] },
          spine: { rotate: [-7 * r, 0, 3 * r] },
          chest: { rotate: [-8 * r, 3 * r, 0] },
          head: { move: [0, 0.02 * pop, -0.012 * pop], rotate: [-14 * r, -3 * r, 2 * pop] },
          plume: { rotate: [30 * r, 0, -16 * r] },
          glow: { scale: [1 + 0.3 * r, 1 + 0.3 * r, 1] },
          cloak: { rotate: [0, 0, 80 * r] },
          'hand.R': { rotate: [-8 * r, 0, 16 * r] },
          'upperarm.L': { rotate: [12 * r, 0, 24 * r] },
          'forearm.L': { rotate: [-18 * r, 0, 0] },
          'upperarm.R': { rotate: [10 * r, 0, -14 * r] },
          'hand.L': { move: [0.008 * pop, 0.01 * pop, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] },
          'foot.R': { rotate: [-12 * r, 0, 0] },
        };
      },
    });

    // Death: the core flickers, the suit shudders, then it falls apart into a pile of brass: the
    // hips drop, the legs splay, the arms fall off to the sides, the head box tumbles off the
    // collar and lands upright on the ground in front, the halberd falls flat, and the glow dies.
    const SPINE_AT: V3 = [0, 0.26, 0];
    const CHEST_AT: V3 = [0, 0.33, 0];
    const NECK_AT: V3 = [0, 0.43, -0.01];
    const HEAD_AT: V3 = [0, 0.48, -0.01];
    const fk = (joints: readonly V3[], rots: readonly V3[], moves: readonly V3[], child: V3) => {
      const q = new THREE.Quaternion();
      const pos = new THREE.Vector3(joints[0]![0] + moves[0]![0], joints[0]![1] + moves[0]![1], joints[0]![2] + moves[0]![2]);
      for (let i = 0; i < joints.length; i++) {
        q.multiply(quat(rots[i]!));
        const next = i + 1 < joints.length ? joints[i + 1]! : child;
        const mv = i + 1 < joints.length ? moves[i + 1]! : ([0, 0, 0] as V3);
        pos.add(new THREE.Vector3(next[0] - joints[i]![0] + mv[0], next[1] - joints[i]![1] + mv[1], next[2] - joints[i]![2] + mv[2]).applyQuaternion(q));
      }
      return { at: [pos.x, pos.y, pos.z] as V3, q };
    };
    const release = (frame: { at: V3; q: THREE.Quaternion }, attached: THREE.Quaternion, want: V3, turn: THREE.Quaternion, loose: number, lift = 0) => {
      const inv = frame.q.clone().invert();
      const w: V3 = [
        frame.at[0] + (want[0] - frame.at[0]) * loose,
        frame.at[1] + lift * (1 - loose) + (want[1] - frame.at[1]) * loose,
        frame.at[2] + (want[2] - frame.at[2]) * loose,
      ];
      const d = new THREE.Vector3(w[0] - frame.at[0], w[1] - frame.at[1], w[2] - frame.at[2]).applyQuaternion(inv);
      return { move: [d.x, d.y, d.z] as V3, rotate: euler(inv.multiply(frame.q.clone().multiply(attached).slerp(turn, loose))) };
    };
    const HIPS_AT: V3 = [0, 0.2, 0];
    const Z3: V3 = [0, 0, 0];
    // The halberd lying flat on the ground at the right, pointing forward and a little outward.
    const HALBERD_DOWN = quat([0, -15, 0]).multiply(quat([90, 0, 0]));
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const shudder = p > 0.12 && p < 0.36 ? wave((p - 0.12) / 0.24, 5) * Math.sin(((p - 0.12) / 0.24) * Math.PI) : 0;
        const glow = keys(p, [[0, 1], [0.05, 0.35], [0.09, 1], [0.2, 0.9], [0.25, 0.25], [0.3, 0.85], [0.6, 0.7], [0.66, 0.2], [0.7, 0.55], [0.8, 0.02], [1, 0.02]] as const);
        const drop = keys(p, [[0, 0], [0.36, 0], [0.5, 1], [0.55, 0.9], [0.6, 1], [1, 1]] as const);
        const off = keys(p, [[0, 0], [0.4, 0], [0.56, 1], [1, 1]] as const);
        const hipsMove: V3 = [0, -0.135 * drop, -0.03 * drop];
        const hipsR: V3 = [-6 * drop, 12 * drop, 3 * drop + 2 * shudder];
        const spineR: V3 = [keys(p, [[0, 0], [0.1, -8], [0.36, -4], [0.52, 14], [0.6, 18], [1, 18]] as const) + 2 * shudder, 0, 0];
        const chestR: V3 = [keys(p, [[0, 0], [0.1, -6], [0.36, -3], [0.52, 12], [0.62, 16], [1, 16]] as const), 3 * shudder, -5 * drop];
        const neckR: V3 = [0, 0, 0];
        // The head box: on the collar until 0.4, then it falls off forward, hits the floor at 0.58,
        // bounces, and settles upright (its pivot is 1 cm under the box bottom).
        const loose = keys(p, [[0, 0], [0.4, 0], [0.58, 1], [1, 1]] as const);
        const frame = fk([HIPS_AT, SPINE_AT, CHEST_AT, NECK_AT], [hipsR, spineR, chestR, neckR], [hipsMove, Z3, Z3, Z3], HEAD_AT);
        const pop = keys(p, [[0, 0], [0.34, 0], [0.4, 0.05], [0.45, 0.06]] as const);
        const attached = quat([keys(p, [[0, 0], [0.1, -14], [0.36, -6], [0.45, 10]] as const), 0, 4 * shudder]);
        const land = keys(p, [[0.4, [0.0, 0.45, 0.06]], [0.5, [0.03, 0.3, 0.24]], [0.58, [0.05, 0.03, 0.34]], [0.64, [0.06, 0.09, 0.36]], [0.72, [0.07, 0.03, 0.38]], [1, [0.07, 0.03, 0.38]]] as const, 'spline');
        const turn = quat(keys(p, [[0.4, [10, 0, 0]], [0.5, [20, 10, -10]], [0.58, [-4, 18, 2]], [0.64, [-6, 22, 4]], [0.72, [-2, 26, 0]], [1, [-2, 27, 0]]] as const));
        const head = release(frame, attached, land, turn, loose, pop);
        // The halberd slips out of the fist as the arm drops and falls flat at the right.
        const armRMove: V3 = [-0.05 * off, -0.08 * off, -0.02 * off];
        const armRRot: V3 = [keys(p, [[0, 0], [0.1, 10], [0.4, 0], [0.56, 25], [1, 28]] as const), 0, keys(p, [[0, 0], [0.1, -18], [0.4, -8], [0.56, -70], [0.64, -62], [1, -66]] as const)];
        const foreRRot: V3 = [keys(p, [[0, 0], [0.5, 10], [1, 10]] as const), 0, 0];
        const handRRot: V3 = [0, 0, 0];
        const wFrame = fk([HIPS_AT, SPINE_AT, CHEST_AT, mx(SHOULDER), ELBOW_R, WRIST_R], [hipsR, spineR, chestR, armRRot, foreRRot, handRRot], [hipsMove, Z3, Z3, armRMove, Z3, Z3], FIST_R);
        const wLoose = keys(p, [[0, 0], [0.36, 0], [0.5, 1], [1, 1]] as const);
        const wLand = keys(p, [[0.36, [-0.3, 0.3, 0.12]], [0.5, [-0.32, 0.02, 0.14]], [0.55, [-0.32, 0.05, 0.15]], [0.6, [-0.33, 0.02, 0.15]], [1, [-0.33, 0.02, 0.15]]] as const);
        const weapon = release(wFrame, quat([0, 0, 0]), wLand, HALBERD_DOWN, wLoose);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          head,
          glow: { scale: [glow, glow, glow] },
          plume: { rotate: [keys(p, [[0, 0], [0.44, -20], [0.6, 30], [0.72, -10], [1, 0]] as const), 0, 0] },
          cloak: { rotate: [0, 0, keys(p, [[0, 0], [0.3, 200], [0.6, 280], [1, 300]] as const)] },
          'upperarm.L': { move: [0.05 * off, -0.08 * off, -0.02 * off], rotate: [keys(p, [[0, 0], [0.1, 12], [0.4, 0], [0.56, 20], [1, 24]] as const), 0, keys(p, [[0, 0], [0.1, 22], [0.4, 10], [0.56, 72], [0.64, 64], [1, 68]] as const)] },
          'forearm.L': { rotate: [keys(p, [[0, 0], [0.1, -20], [0.5, 10], [1, 12]] as const), 0, 0] },
          'hand.L': { rotate: [keys(p, [[0, 0], [0.5, 0], [0.7, 30], [1, 30]] as const), 0, 0] },
          'upperarm.R': { move: armRMove, rotate: armRRot },
          'forearm.R': { rotate: foreRRot },
          'hand.R': { rotate: handRRot },
          weapon,
          'leg.L': { rotate: [keys(p, [[0, 0], [0.36, 0], [0.54, -24], [1, -26]] as const), 0, keys(p, [[0, 0], [0.36, 0], [0.54, 70], [0.6, 64], [1, 66]] as const)] },
          'leg.R': { rotate: [keys(p, [[0, 0], [0.36, 0], [0.54, -14], [1, -16]] as const), 0, keys(p, [[0, 0], [0.36, 0], [0.54, -72], [0.6, -66], [1, -68]] as const)] },
          'foot.L': { rotate: [keys(p, [[0, 0], [0.4, 0], [0.56, 20], [1, 20]] as const), 0, keys(p, [[0, 0], [0.4, 0], [0.56, -40], [1, -40]] as const)] },
          'foot.R': { rotate: [keys(p, [[0, 0], [0.4, 0], [0.56, 12], [1, 12]] as const), 0, keys(p, [[0, 0], [0.4, 0], [0.56, 40], [1, 40]] as const)] },
        };
      },
    });

    // Awaken (the wind-up spawn clip): the soldier stands slumped, the head low and turned aside,
    // the eyes out. The key on the back spins fast (winding up), a rattle runs through the plates
    // (the head first), the core flares, then the head lifts and turns to the player, the body
    // straightens, and the idle drift starts (the last frame is the first frame of idle).
    const AWAKEN = 2.0;
    const addV = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const rattle = (p: number, a: number, b: number, cycles: number, offset = 0) => {
      if (p <= a || p >= b) return 0;
      const x = (p - a) / (b - a);
      return wave(x, cycles, offset) * Math.sin(x * Math.PI);
    };
    k.animation('awaken', {
      duration: AWAKEN,
      loop: false,
      pose: (t, p) => {
        const helmR = rattle(p, 0.12, 0.3, 4);
        const bodyR = rattle(p, 0.16, 0.34, 4, 0.25);
        const glow = keys(p, [[0, 0.001], [0.3, 0.001], [0.41, 1.3], [0.52, 1]] as const);
        const rise = ease(0.42, 0.64, p);
        const lift = ease(0.5, 0.84, p);
        const pose: Record<string, { move?: V3; rotate?: V3; scale?: V3 }> = {
          hips: { rotate: [0, 0, 1.2 * bodyR] },
          spine: { rotate: [5 * (1 - rise), 0, 0] },
          chest: { rotate: [5 * (1 - rise) + 2 * bodyR, 2.5 * bodyR, bodyR] },
          head: {
            move: [0, keys(p, [[0, -0.02], [0.42, -0.02], [0.58, 0.012], [0.72, 0]] as const) + 0.006 * helmR, keys(p, [[0, 0.008], [0.42, 0.008], [0.6, 0]] as const)],
            rotate: [
              keys(p, [[0, 9], [0.42, 9], [0.58, -5], [0.74, 0]] as const) + 4 * helmR,
              keys(p, [[0, -5], [0.46, -5], [0.66, 3], [0.78, 0]] as const),
              keys(p, [[0, 2], [0.42, 2], [0.6, 0]] as const) + 3 * helmR,
            ],
          },
          glow: { scale: [glow, glow, glow] },
          plume: { rotate: [keys(p, [[0, -8], [0.2, -8], [0.5, -4], [0.62, 10], [0.76, -4], [0.9, 0]] as const) + 7 * helmR, 0, 5 * rattle(p, 0.14, 0.32, 3, 0.1)] },
          cloak: { rotate: [0, 0, 1440 * ease(0.08, 0.72, p)] },
          'upperarm.R': { rotate: [-9 * (1 - lift) + 2 * bodyR, 0, -1.5 * bodyR] },
          'forearm.R': { rotate: [-6 * (1 - lift), 0, 0] },
          'hand.R': { rotate: [9 * (1 - lift), 0, 8 * (1 - lift)] },
          'upperarm.L': { rotate: [10 * (1 - lift) - 2 * bodyR, 0, 1.5 * bodyR] },
          'forearm.L': { rotate: [-8 * (1 - lift), 0, 0] },
          'hand.L': { move: [0.004 * bodyR, 0.003 * rattle(p, 0.18, 0.34, 5), 0], rotate: [6 * bodyR, 0, 0] },
        };
        const drift = idlePose((t - AWAKEN) / IDLE);
        const w = ease(0.7, 1, p);
        for (const [bone, v] of Object.entries(drift)) {
          const b = (pose[bone] ??= {});
          if (v.move) b.move = addV(b.move ?? Z3, v.move, w);
          if (v.rotate) b.rotate = addV(b.rotate ?? Z3, v.rotate, w);
        }
        return pose;
      },
    });
  },
});
