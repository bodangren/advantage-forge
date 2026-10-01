import { defineAsset, mixRgb, motion, noise, rgb, sdf } from '../src/index.js';

/**
 * Wood golem — Chibi Quest P1 forest enemy (catalog `enemies/construct/wood-golem`), about 1.06 m
 * to the crown tips, faces +Z. Target: docs/enemy-mockups/wood-golem_001.jpg (one front view).
 *
 * Base: assets/stone-golem.ts (the same stocky rig, knee bones, and seven-clip set; the boulders,
 *   runes, and mossy sage core are gone, and the head is far bigger, with a split-plank crown).
 * Role: a slow, heavy forest construct; at 128 px the two amber eye slits in their dark visor, the
 *   flower in the chest cavity, the split-plank crown, and the knotted root fists must read.
 * One idea: a bundle of driftwood planks gripped by living green vines, lit from inside by amber.
 * Proportions: crown tips 1.06, head top 0.97, brow 0.935, visor 0.866, jaw 0.765, shoulder pads 0.82
 *   top and 0.34 m out, core 0.6, pelvis 0.31, wrist coils 0.4, fists 0.22 to 0.42, ankle coils 0.11.
 * Shape language: square and blocky (plank staves, slab pads, squared feet) for a lumbering weight,
 *   with curling vine tendrils and a ragged crown for menace. The head is one rounded mask block:
 *   vertical planks wrap around it (shallow grooves), a brow plank and a jaw plank band it, and the
 *   crown of staves stands on top.
 * Palette (60/30/10): driftwood #5f4e3c with silvered grey #8d8478 and pale worn faces #c6b28c
 *   (dominant); moss, tendrils, and wrap vines #47641f / #5a7027 / #3f5a22 (secondary); amber
 *   (accent, 10%): eye slits #ffb020 at emissive 0.7, chest flower #ff8a1a at emissive 0.6. The visor
 *   band and the core cavity are dark #2a1c12 so the glow has a dark ground to read against.
 * Details: the eyes are 0.08 x 0.03 m slits set 0.055 m deep in the visor. The core sits in a round
 *   cavity (floor 0.03 m below the chest face) with a ring of radial planks; its six petals stand 0.02 m
 *   off the dark floor. The arm, knee, and ankle wraps are green vine coils with a few small leaves.
 * Bodies: bark (head, crown, chest staves, rim, shoulder pads, arms, legs, feet), rope (the vine wraps;
 *   the name is kept for the rig and clip files), moss, vine (four curling tendrils with leaves),
 *   core (cavity floor), sigil (petals), eyes.
 * Rig: the stone golem's chibi humanoid. Clips: idle, walk, run, attack (a two-fist ground slam),
 *   attack2 (a shoulder charge and a backhand swipe), roar, hit, death.
 */

const C = {
  bark: '#4a3823', // renders a rich mid-brown through the studio light
  barkPale: '#cdbb96',
  heart: '#7a4520',
  grey: '#8d8478', // silvered driftwood
  moss: '#3a5518',
  mossDark: '#2c4212',
  vine: '#46591f', // dark olive, not bright green
  glow: '#ffb020', // amber-yellow eye slits
  flower: '#ff8a1a', // the chest flower, a deeper orange than the eyes
  visor: '#2a1c12', // the dark recessed band the eyes sit in
  wrap: '#3f5a22', // vine green for the arm and leg wraps (#54792f rendered lime)
  glowDark: '#4a1405',
  seam: '#2a2119', // near-black gaps between planks
};

type V3 = readonly [number, number, number];
type Rgb = readonly [number, number, number];

const PALE = rgb(C.barkPale);
const HEART = rgb(C.heart);
const GREY = rgb(C.grey);
const SEAM = rgb(C.seam);
const EMBER = rgb('#7a3d08'); // the warm tint that light from the core spills onto the wood

const pair = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Joints: the stone golem's rig, kept as is so the two golems share a set. High, wide shoulders
// under the plank pads, arms hanging far out, a short wide stance.
const SHOULDER: V3 = [0.3, 0.68, 0];
const ELBOW: V3 = [0.4, 0.53, 0.03];
const WRIST: V3 = [0.45, 0.4, 0.06];
const HIP: V3 = [0.13, 0.3, 0];
const KNEE: V3 = [0.16, 0.19, 0.005]; // the knee: splits the leg (shin.L takes the weight below it)
const ANKLE: V3 = [0.18, 0.09, 0.01];
// The ends of the flat bottom of the left foot roots (y = 0): heel and toe.
const SOLE_HEEL: V3 = [0.18, 0, -0.1];
const SOLE_TOE: V3 = [0.18, 0, 0.15];
const HEAD_Y = 0.86;

/** Distance to the nearest seam of a banded pattern: 1 on a seam, 0 midway between two. */
const seamBands = (v: number, period: number, phase: number, width: number) => {
  const a = (v - phase) / period;
  const f = a - Math.floor(a);
  return Math.max(0, 1 - Math.min(f, 1 - f) / width);
};
/** The same, around the trunk axis: n vertical stave seams at `phase` turns. */
const seamRadial = (x: number, z: number, n: number, phase: number, width: number) => {
  const a = (Math.atan2(x, z) * n) / (Math.PI * 2) + phase;
  const f = a - Math.floor(a);
  return Math.max(0, 1 - Math.min(f, 1 - f) / width);
};
/** Signed distance to an axis-aligned box: negative inside. */
const sdBox = (x: number, y: number, z: number, cx: number, cy: number, cz: number, bx: number, by: number, bz: number) => {
  const qx = Math.abs(x - cx) - bx;
  const qy = Math.abs(y - cy) - by;
  const qz = Math.abs(z - cz) - bz;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, Math.max(qy, qz)), 0);
};

/**
 * Driftwood: broad plank-to-plank value shifts, lengthwise streaks, warm heart knots, silvered
 * weathering, and dark pits. The seams between the head billets and the trunk staves are painted
 * near-black; without them the head is one flat mid tone, which is what reads as clay.
 */
const grain = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const broad = 1 + 0.3 * noise.fbm(x * 4.2, y * 2.4, z * 4.2, 2); // plank to plank
  const fine = 1 + 0.15 * noise.fbm(x * 26, y * 5, z * 26, 2); // lengthwise streaks
  const streak: Rgb = [base[0] * broad * fine, base[1] * broad * fine, base[2] * broad * fine];
  const knot = Math.max(0, noise.fbm(x * 12, y * 8, z * 12, 2) - 0.22) * 1.0;
  const bleach = Math.max(0, noise.fbm(x * 6.5, y * 2.6, z * 6.5, 2)) * 0.52; // sun-worn faces
  const silver = Math.max(0, noise.fbm(x * 3.1 + 90, y * 2.2, z * 3.1, 2)) * 0.55; // grey weathering
  const pit = Math.min(1, Math.max(0, noise.fbm(x * 21 + 40, y * 13, z * 21, 2) - 0.38) * 2.6); // knot holes
  const sun = mixRgb(mixRgb(mixRgb(streak, HEART, Math.min(1, knot) * 0.9), GREY, silver), PALE, bleach);
  // Dark seams: horizontal billet joints on the head, vertical stave joints on the chest.
  const headSeam = seamRadial(x, z, 14, 0.5, 0.16) * (y > 0.735 && y < 0.96 && Math.abs(x) < 0.19 && Math.abs(z) < 0.17 ? 1 : 0);
  const staveSeam = seamRadial(x, z, 8, 0, 0.19) * (y > 0.47 && y < 0.735 && Math.hypot(x, z) < 0.2 ? 1 : 0);
  // Ground contact and the underside of every overhang sit in shadow.
  const low = Math.max(0, 1 - y / 0.3) * 0.3;
  const seam = Math.min(1, Math.max(headSeam, staveSeam) * 0.9 + low + pit * 0.5);
  let shaded: Rgb = mixRgb(sun, SEAM, Math.min(1, seam) * 0.95);
  // Ember spill: the burning core and the eye slits throw warm light onto the nearby wood. Without
  // it the glow reads as flat paint sitting on the surface; with it the glow has a source.
  const dEye = sdBox(x, y, z, 0, 0.866, 0.24, 0.145, 0.055, 0.11) + 0.02;
  const dCore = Math.hypot(x, y - 0.6, z - 0.14) - 0.12;
  const spill = Math.pow(Math.max(0, 1 - Math.min(dEye, dCore) / 0.055), 2);
  return mixRgb(shaded, EMBER, Math.min(1, spill * 0.65));
};

/** A weathered plank: a hand-hewn box with chunky warp and grain relief. Sharp edges: a 16 mm
 * bevel on a 44 mm plank rounds it into a clay coil, so the default bevel stays under 8 mm. */
const plank = (size: V3, seed: number, round = 0.008): sdf.Shape =>
  sdf
    .box(size, Math.min(round, (Math.min(size[0], size[1], size[2]) / 2) * 0.85))
    .displace(0.004, (x, y, z) =>
      noise.fbm(x * 8.5 + seed * 7.3, y * 8.5, z * 8.5, 3) + 0.4 * noise.fbm(x * 26 + seed * 3.1, y * 26, z * 26, 2),
    )
    .paintFn(grain);

/** A vine coil wrapped around the segment a→b: a closed ring of beads at radius r. */
const coil = (a: V3, b: V3, r: number, tube = 0.016, n = 10): sdf.Shape => {
  const axis = norm(sub(b, a));
  const seed: V3 = Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = norm(cross(axis, seed));
  const w = cross(axis, u);
  const mid = lerp(a, b, 0.5);
  const pts: [number, number, number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const p = add(mid, add(mul(u, Math.cos(t) * r), mul(w, Math.sin(t) * r)));
    pts.push([p[0], p[1], p[2], tube * (1 - 0.3 * Math.cos(t * 2))]);
  }
  return sdf.chain(pts, 0.008).paintFn((x, y, z, base) => {
    const twist = 1 + 0.16 * noise.fbm(x * 60, y * 60, z * 60, 2);
    const mottle = Math.max(0, noise.fbm(x * 22 + 5, y * 22, z * 22, 2) - 0.1) * 0.45;
    return [base[0] * twist * (1 - mottle), base[1] * twist * (1 - mottle * 0.6), base[2] * twist * (1 - mottle)];
  });
};

/** A small pointed leaf on a wrap: sits at angle `t` on the ring of `coil(a, b, r)` and points outward. */
const coilLeaf = (a: V3, b: V3, r: number, t: number, len = 0.036): sdf.Shape => {
  const axis = norm(sub(b, a));
  const seed: V3 = Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = norm(cross(axis, seed));
  const w = cross(axis, u);
  const out = add(mul(u, Math.cos(t)), mul(w, Math.sin(t)));
  // The leaf leans outward and a little along the axis, so it reads from the front.
  const dir = norm(add(mul(out, 1), mul(axis, 0.5)));
  const root = add(lerp(a, b, 0.5), mul(out, r + 0.006));
  const mid = add(root, mul(dir, len));
  const pitch = (Math.atan2(dir[1], Math.hypot(dir[0], dir[2])) * 180) / Math.PI;
  const yaw = (Math.atan2(-dir[2], dir[0]) * 180) / Math.PI;
  return sdf.ellipsoid([len, 0.0075, 0.0125]).rotateZ(pitch).rotateY(yaw).at(...mid);
};

/** A curling vine tendril growing out of the origin along +X, with two pointed leaves. */
const tendril = (len: number): sdf.Shape => {
  // The radius jitters along the chain: a perfectly even tube is what reads as plastic.
  const jit = (i: number) => 1 + (noise.random(i, 7, 3) - 0.5) * 0.55;
  const curl = sdf.chain(
    [
      [0, 0, 0, 0.014 * jit(0)],
      [len * 0.4, len * 0.3, 0, 0.011 * jit(1)],
      [len * 0.78, len * 0.46, 0.004, 0.008 * jit(2)],
      [len * 0.94, len * 0.3, 0.014, 0.006 * jit(3)],
      [len * 0.78, len * 0.12, 0.024, 0.005 * jit(4)],
      [len * 0.94, len * 0.04, 0.03, 0.0035 * jit(5)],
    ],
    0.01,
  );
  const leaf = (x: number, y: number, z: number, r: number, t: number) =>
    sdf.ellipsoid([r, r * 0.36, 0.006]).rotateZ(t).at(x, y, z);
  return sdf
    .union(
      curl,
      leaf(len * 0.42, len * 0.35, 0.012, 0.036, 42),
      leaf(len * 0.78, len * 0.52, 0.006, 0.027, 18),
    )
    .paintFn((x, y, z, base) => {
      const n = 1 + 0.3 * noise.fbm(x * 34, y * 34, z * 34, 2);
      const mottle = Math.max(0, noise.fbm(x * 18 + 7, y * 18, z * 18, 2) - 0.12) * 0.55;
      return [base[0] * n * (1 - mottle), base[1] * n * (1 - mottle * 0.65), base[2] * n * (1 - mottle * 0.9)];
    });
};

export default defineAsset({
  name: 'wood-golem',
  description:
    'Chibi wood golem: a bundle of driftwood planks with a split-plank crown, glowing amber eye slits, a hollow chest with a burning amber core, curling vines, moss clumps, rope lashings, and knotted root fists.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/wood-golem_001.jpg',
  // Color slots for individual golems (the first option is the default look).
  variants: {
    bark: { driftwood: C.bark, bogwood: '#4e4a3a', heartwood: '#8a5a35' },
    glow: { amber: C.glow, moss: '#8ef05a', frost: '#7fd8ff' },
  },
  presets: {
    swamp: { bark: 'bogwood', glow: 'moss' },
    ember: { bark: 'heartwood', glow: 'amber' },
    winter: { bark: 'driftwood', glow: 'frost' },
  },

  build(k) {
    // The slot colors (see variants). The pale plank faces, the rope, the moss, and the vines keep
    // their own hue and follow the bark slot partly, so a bogwood golem keeps its rope and moss.
    const T = {
      bark: k.tint('bark'),
      pale: k.tint('bark', { color: C.barkPale, follow: 0.35 }),
      heart: k.tint('bark', { color: C.heart, follow: 0.5 }),
      dark: k.tint('bark', -0.6),
      moss: k.tint('bark', { color: C.moss, follow: 0.15 }),
      mossDark: k.tint('bark', { color: C.mossDark, follow: 0.15 }),
      vine: k.tint('bark', { color: C.vine, follow: 0.15 }),
      wrap: k.tint('bark', { color: C.wrap, follow: 0.15 }),
      glow: k.tint('glow'),
      glowDark: k.tint('glow', -0.72),
      glowPale: k.tint('glow', 0.55),
      glowMid: k.tint('glow', { color: C.flower, follow: 0.3 }),
      ink: k.tint('bark', -0.85), // near-black for the recesses behind the glow
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.3, 0] },
      spine: { parent: 'hips', at: [0, 0.4, 0] },
      chest: { parent: 'spine', at: [0, 0.54, 0] },
      neck: { parent: 'chest', at: [0, 0.72, -0.02] },
      head: { parent: 'neck', at: [0, 0.79, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    const barkBump = (x: number, y: number, z: number) =>
      0.0075 * noise.fbm(x * 16, y * 3.2, z * 16, 3) + 0.0032 * noise.fbm(x * 52, y * 9, z * 52, 2);

    // ------------------------------------------------------------------ head: one rounded mask block
    // The head is the dominant mass: nearly as wide as the shoulders, and 0.73 to 0.97 m tall. It is
    // one rounded block whose vertical planks wrap around it (shallow radial grooves), with a brow
    // plank and a jaw plank as horizontal bands, under the split crown of staves.
    const skull = sdf
      .smoothUnion(0.03, sdf.box([0.335, 0.235, 0.285], 0.1).at(0, 0.848, 0), sdf.ellipsoid([0.172, 0.13, 0.15]).at(0, 0.848, 0))
      .displace(0.003, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 2));
    // The split crown: seven upright planks fanning out, the signature silhouette break. These are
    // the tallest forms on the asset, so the head reads as the top of the silhouette in every view.
    const crown = sdf.union(
      ...(
        [
          // x, height above the crown base, width, tilt (z), lean (x, negative = back), z offset
          [0.0, 0.22, 0.07, 0, -6, -0.05],
          [0.07, 0.17, 0.06, 14, -8, -0.02],
          [-0.075, 0.19, 0.065, -16, 6, 0.0],
          [0.128, 0.11, 0.09, 28, 0, 0.01],
          [-0.125, 0.08, 0.09, -30, 5, -0.01],
          [-0.03, 0.14, 0.05, 22, 10, 0.03],
          [0.035, 0.13, 0.055, -22, -10, 0.035],
        ] as [number, number, number, number, number, number][]
      ).map(([x, h, w, tilt, lean, zo], i) =>
        plank([w, h, 0.07], 40 + i, 0.006)
          .rotateX(lean)
          .rotateZ(tilt)
          .at(x, 0.945 + h / 2, -0.012 + zo),
      ),
    );
    // A heavy brow plank over the visor, and a jaw plank below it, both hugging the block.
    const brow = plank([0.29, 0.05, 0.08], 60, 0.02).rotateX(-12).at(0, 0.935, 0.098);
    const jaw = plank([0.23, 0.046, 0.088], 61, 0.02).rotateX(8).at(0, 0.765, 0.09);
    const EYE: V3 = [0.069, 0.866, 0];
    const headMass = sdf.smoothUnion(0.014, skull, crown, brow, jaw);
    // Vertical plank grooves all around the head, only in the outer 9 mm of the surface.
    const headJoints = sdf.union(
      ...Array.from({ length: 14 }, (_, i) =>
        sdf
          .box([0.014, 0.34, 0.12], 0.004)
          .at(0, 0, 0.145)
          .rotateY(((i + 0.5) / 14) * 360)
          .at(0, 0.85, 0),
      ),
    );
    const head0 = headMass.subtract(headJoints.subtract(headMass.round(-0.014)));
    // The visor: a dark recessed band across the face, 0.055 m deep, with a narrow groove below it.
    const slot = sdf.box([0.27, 0.066, 0.3]).at(0, 0.866, 0.245);
    const mouth = sdf.box([0.2, 0.02, 0.3]).at(0, 0.797, 0.27);
    const head = head0.smoothSubtract(0.006, slot).subtract(mouth).bone('head');
    const neck = sdf.capsule([0, 0.65, -0.02], [0, 0.79, -0.02], 0.088).bone('neck');

    // ------------------------------------------------------------------ trunk: a bundle of upright staves
    const stave = (i: number, n: number, rx: number, rz: number, y: number, h: number, seed: number) => {
      const a = ((i / n) * Math.PI * 2 + 0.25) as number;
      return plank([0.082, h, 0.07], seed, 0.014).rotateY(a).at(Math.sin(a) * rx, y, Math.cos(a) * rz);
    };
    // A small blend keeps the stave grooves as shadow lines instead of melting the chest into a
    // single smooth barrel.
    const chest = sdf.smoothUnion(0.012, ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => stave(i, 8, 0.125, 0.082, 0.6, 0.235, i + 3)));
    const belly = sdf.ellipsoid([0.152, 0.115, 0.112]).at(0, 0.46, 0.01);
    const pelvis = sdf.ellipsoid([0.158, 0.095, 0.118]).at(0, 0.325, 0.005);
    const traps = pair(sdf.sphere(0.092).at(0.145, 0.685, -0.03));
    const CORE: V3 = [0, 0.6, 0.12];
    // The core cavity: a round pocket with a flat floor at z = FLOOR_Z (about 0.03 m below the chest
    // face), ringed by a lip of radial planks so it reads as set into the wood.
    const FLOOR_Z = 0.088;
    const hollow = sdf.cylinder(0.118, 0.26, 0.012).rotateX(90).scale([1.14, 1, 1]).at(CORE[0], CORE[1], FLOOR_Z + 0.13);
    const rim = sdf
      .ellipsoid([0.168, 0.15, 0.06])
      .at(CORE[0], CORE[1], 0.1)
      .subtract(sdf.ellipsoid([0.122, 0.108, 0.2]).at(CORE[0], CORE[1], 0.12))
      .displace(0.003, (x, y, z) => noise.fbm(x * 14, y * 14, z * 14, 2))
      .paintFn((x, y, z, base) => {
        const seamR = seamRadial(x - CORE[0], y - CORE[1], 11, 0.2, 0.12);
        return mixRgb(grain(x, y, z, base), SEAM, seamR * 0.8);
      });
    const trunk = sdf
      .smoothUnion(0.05, chest.bone('chest'), belly.bone('spine'), pelvis.bone('hips'), traps.bone('chest'))
      .union(rim.bone('chest'))
      .smoothSubtract(0.008, hollow); // the cavity for the core
    // A few cross planks strapped over the staves, low on the belly.
    const strapL = plank([0.07, 0.055, 0.05], 70).rotateY(0.6).at(0.125, 0.5, 0.06);
    const strapR = plank([0.07, 0.055, 0.05], 71).rotateY(-0.6).at(-0.125, 0.5, 0.06);
    const straps = sdf.union(strapL, strapR);

    // ------------------------------------------------------------------ shoulder pads: big angled planks
    // Rounded, sloped pads that follow the shoulder instead of flaring past the head. The mockup's
    // silhouette is wide because of the arms and fists, not because of flat horizontal slabs.
    const padL = sdf.union(
      plank([0.25, 0.105, 0.26], 21, 0.024).rotateZ(-30).at(0.295, 0.715, -0.015),
      plank([0.215, 0.065, 0.215], 22, 0.02).rotateZ(-22).at(0.275, 0.782, -0.02),
      plank([0.11, 0.15, 0.2], 23, 0.022).rotateZ(-36).at(0.385, 0.685, 0.0),
    );
    const pads = pair(padL);

    // ------------------------------------------------------------------ arms: branch cones and knotted root fists
    const KNUCKLE: V3 = [0.435, 0.265, 0.175];
    // Plank seams along the arm segments: thin rounded boxes 0.012 deep, three per segment.
    const seamsOn = (a: V3, b: V3, r: number, angles: number[]) => {
      const d = norm(sub(b, a));
      const len = Math.hypot(...sub(b, a));
      const tilt = (Math.asin(d[2]) * 180) / Math.PI;
      const twist = (Math.atan2(-d[0], d[1]) * 180) / Math.PI;
      const mid = lerp(a, b, 0.5);
      return sdf.union(
        ...angles.map((ang) =>
          sdf
            .box([0.012, len * 0.88, 0.024], 0.004)
            .at(0, 0, r)
            .rotateY(ang)
            .rotateX(tilt)
            .rotateZ(twist)
            .at(...mid),
        ),
      );
    };
    const armSeams = pair(
      sdf.union(
        seamsOn(SHOULDER, ELBOW, 0.084, [-62, 8, 70]),
        seamsOn(ELBOW, WRIST, 0.076, [-58, 12, 66]),
      ),
    );
    const armAt = (s: 1 | -1) => {
      const f = (p: V3): V3 => (s > 0 ? p : mx(p));
      const side = s > 0 ? 'L' : 'R';
      return sdf.smoothUnion(
        0.022,
        sdf.cone(f(SHOULDER), f(ELBOW), 0.088, 0.08).bone(`upperarm.${side}`),
        sdf.sphere(0.075).at(...f(lerp(SHOULDER, ELBOW, 0.78))).bone(`upperarm.${side}`), // an elbow knot
        sdf.cone(f(ELBOW), f(WRIST), 0.078, 0.072).bone(`forearm.${side}`),
        sdf.cone(f([KNUCKLE[0] - 0.07, KNUCKLE[1] + 0.035, KNUCKLE[2] - 0.035]), f(KNUCKLE), 0.026, 0.062).bone(`hand.${side}`),
        sdf.sphere(0.08).at(...f(KNUCKLE)).bone(`hand.${side}`),
        sdf.sphere(0.052).at(...f([KNUCKLE[0] + 0.06, KNUCKLE[1] - 0.05, KNUCKLE[2] + 0.03])).bone(`hand.${side}`),
        sdf.sphere(0.046).at(...f([KNUCKLE[0] + 0.012, KNUCKLE[1] + 0.065, KNUCKLE[2] + 0.045])).bone(`hand.${side}`),
        // one knot bump on the outer forearm, so the arm reads as lashed staves
        sdf.sphere(0.036).at(...f(add(lerp(ELBOW, WRIST, 0.4), [0.06, 0.005, -0.03]))).bone(`forearm.${side}`),
        // root spikes knuckle the fist so it reads as knotted wood, not a boxing glove
        sdf.cone(f([KNUCKLE[0] + 0.02, KNUCKLE[1] - 0.02, KNUCKLE[2] + 0.05]), f([KNUCKLE[0] + 0.035, KNUCKLE[1] - 0.075, KNUCKLE[2] + 0.075]), 0.02, 0.006).bone(`hand.${side}`),
        sdf.cone(f([KNUCKLE[0] - 0.03, KNUCKLE[1] - 0.01, KNUCKLE[2] + 0.055]), f([KNUCKLE[0] - 0.045, KNUCKLE[1] - 0.06, KNUCKLE[2] + 0.08]), 0.018, 0.005).bone(`hand.${side}`),
      );
    };

    // ------------------------------------------------------------------ legs: stump shanks and splayed root feet
    const legAt = (s: 1 | -1) => {
      const f = (p: V3): V3 => (s > 0 ? p : mx(p));
      const side = s > 0 ? 'L' : 'R';
      const A = f(ANKLE);
      // Three-knuckle root clumps at the toe and the heel.
      const knuckles = [-0.045, 0, 0.045].flatMap((dx, i) => [
        sdf.sphere(0.034 - Math.abs(dx) * 0.2).at(A[0] + dx * s, 0.036, 0.15 + (i === 1 ? 0.018 : 0)).bone(`foot.${side}`),
        sdf.sphere(0.03 - Math.abs(dx) * 0.2).at(A[0] + dx * s * 1.1, 0.034, -0.125 - (i === 1 ? 0.015 : 0)).bone(`foot.${side}`),
      ]);
      const roots = sdf
        .union(
          sdf.cone([A[0] - 0.025, 0.085, -0.095], [A[0] + 0.02, 0.04, 0.15], 0.075, 0.045).bone(`foot.${side}`),
          sdf.cone([A[0] + 0.025, 0.08, -0.02], [A[0] + 0.16, 0.04, 0.005], 0.065, 0.038).bone(`foot.${side}`),
          sdf.cone([A[0] - 0.005, 0.08, 0.02], [A[0] - 0.02, 0.04, -0.14], 0.068, 0.038).bone(`foot.${side}`),
          sdf.cone([A[0], 0.075, 0.03], [A[0] + 0.005, 0.04, 0.17], 0.055, 0.032).bone(`foot.${side}`),
          // two short toes dig in so the foot reads as roots, not a flipper
          sdf.cone([A[0] + 0.03, 0.05, 0.05], [A[0] + 0.05, 0.008, 0.11], 0.026, 0.008).bone(`foot.${side}`),
          sdf.cone([A[0] - 0.035, 0.05, 0.04], [A[0] - 0.06, 0.008, 0.09], 0.024, 0.008).bone(`foot.${side}`),
        )
        .smoothUnion(0.012, ...knuckles)
        .intersect(sdf.halfSpace([0, -1, 0], 0.055));
      // Vertical root grooves: thin rounded boxes, 0.02 deep, around the front and sides of the shin.
      const grooves = sdf.union(
        ...[-75, -38, 0, 38, 75].map((deg) =>
          sdf
            .box([0.022, 0.15, 0.04], 0.008)
            .at(0, 0, 0.1)
            .rotateY(deg)
            .at(f(KNEE)[0] - s * 0.005, 0.2, 0.0),
        ),
      );
      const limb = sdf.smoothUnion(
        0.02,
        sdf.cone(f(HIP), f(KNEE), 0.115, 0.104).bone(`leg.${side}`),
        sdf.cone(f(KNEE), f(ANKLE), 0.102, 0.094).bone(`shin.${side}`),
      );
      return limb.subtract(grooves).union(roots);
    };

    // Dark socket: a flat painted patch on the slot floor (z = 0.09), not carved.
    const sockets = pair(sdf.box([0.11, 0.045, 0.06], 0.014).rotateZ(-12).at(EYE[0], EYE[1], 0.075));
    // ------------------------------------------------------------------ the bark body
    const bark = sdf
      .smoothUnion(0.02, head, neck)
      .smoothUnion(0.025, trunk)
      .union(pads.bone('chest'), straps.bone('spine'))
      .union(armAt(1), armAt(-1))
      .smoothUnion(0.02, legAt(1), legAt(-1))
      .subtract(armSeams)
      .paintFn(grain)
      .paintWhere(straps.round(0.004), T.heart, 0.004)
      .paintWhere(slot.round(0.004), C.visor, 0.004) // the visor band reads dark behind the glow
      .paintWhere(sockets.round(0.003), C.visor, 0.003)
      .paintWhere(armSeams.round(0.004), C.seam, 0.003) // dark plank seams on the arms
      .paintWhere(mouth.round(0.003), T.ink, 0.004)
      .paintWhere(hollow.round(0.004), C.visor, 0.005); // the core cavity reads as a dark recess
    k.body('bark', bark, { color: T.bark, roughness: 0.9, textureDensity: 1.5, bump: barkBump, maxTriangles: 41000 });

    // ------------------------------------------------------------------ vine wraps: wrist, ankle, and neck coils
    // Living vine, not hemp: green coils with a few small leaves standing off them.
    const ropeL = sdf.union(
      coil(lerp(ELBOW, WRIST, 0.58), WRIST, 0.092, 0.018),
      coil(lerp(ELBOW, WRIST, 0.82), lerp(ELBOW, WRIST, 0.68), 0.09, 0.016),
      coil([ANKLE[0], 0.115, ANKLE[2]], [ANKLE[0], 0.162, ANKLE[2]], 0.102, 0.018),
      coilLeaf(lerp(ELBOW, WRIST, 0.58), WRIST, 0.092, 1.2),
      coilLeaf(lerp(ELBOW, WRIST, 0.82), lerp(ELBOW, WRIST, 0.68), 0.09, 3.9, 0.03),
      coilLeaf([ANKLE[0], 0.115, ANKLE[2]], [ANKLE[0], 0.162, ANKLE[2]], 0.102, 0.5),
    );
    // Two vine wraps just below each knee, matching the shin radius.
    const kneeWraps = sdf.union(
      ...[0.205, 0.178].map((y, i) =>
        sdf
          .torus(0.104 - i * 0.002, 0.02)
          .rotateX(i ? 3 : -3)
          .at(KNEE[0] + (0.02 * (0.19 - y)) / 0.1, y, KNEE[2] - 0.004)
          .paintFn((x, yy, z, base) => {
            const n = 1 + 0.18 * Math.sin(Math.atan2(x - KNEE[0], z) * 28 + yy * 90);
            return [base[0] * n, base[1] * n, base[2] * n];
          }),
      ),
    );
    const ropeNeck = coil([0, 0.678, -0.02], [0, 0.734, -0.02], 0.1, 0.018);
    const ropeBump = (x: number, y: number, z: number) =>
      0.0035 * noise.fbm(x * 120, y * 40, z * 120, 2) + 0.0025 * Math.sin((x + z) * 150 + y * 110);
    k.body('rope', sdf.union(pair(ropeL), pair(kneeWraps), ropeNeck), { color: T.wrap, roughness: 0.92, detail: 0.004, bump: ropeBump, maxTriangles: 9500 });

    // ------------------------------------------------------------------ moss clumps on the tops
    // Clumps with a lumpy, speckled surface: a smooth sphere reads as plastic at 128 px. The
    // displacement is kept low-frequency on purpose; a fine one triples the triangle count.
    const clump = (at: V3, r: number, seed: number) =>
      sdf
        .sphere(r)
        .scale([1, 0.58, 1])
        .displace(r * 0.3, (x, y, z) => noise.fbm(x * 16 + seed * 9.1, y * 16, z * 16, 2))
        .at(...at);
    const mossNoise = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const n = 1 + 0.34 * noise.fbm(x * 40, y * 40, z * 40, 2);
      const shade = Math.max(0, noise.fbm(x * 15, y * 15, z * 15, 2) - 0.05) * 0.7;
      const c: Rgb = [base[0] * n, base[1] * n, base[2] * n];
      return [c[0] * (1 - shade), c[1] * (1 - shade * 0.8), c[2] * (1 - shade * 0.6)];
    };
    const mossL = sdf
      .smoothUnion(
        0.01,
        clump([0.1, 0.955, 0.035], 0.07, 1),
        clump([0.285, 0.79, -0.03], 0.075, 2),
        clump([0.375, 0.735, 0.05], 0.058, 3),
        clump([0.25, 0.655, -0.085], 0.062, 4),
        clump([ELBOW[0] + 0.015, ELBOW[1] + 0.04, ELBOW[2]], 0.055, 5),
        clump([0.155, 0.29, 0.07], 0.068, 6),
        clump([KNUCKLE[0] - 0.01, KNUCKLE[1] + 0.06, KNUCKLE[2] - 0.02], 0.05, 7),
      )
      .displace(0.008, (x, y, z) => noise.fbm(x * 30 + 3, y * 30, z * 30, 2))
      .paintFn(mossNoise)
      .paintWhere(sdf.box([2, 0.012, 2]).at(0, 0.74, 0).union(sdf.box([0.012, 2, 2]).at(-0.3, 0.8, 0)), T.mossDark, 0.02); // shaded undersides
    // `bump` returns a scalar height in meters; a colour function here would poison the field.
    const mossBump = (x: number, y: number, z: number) => 0.0022 * noise.fbm(x * 55, y * 55, z * 55, 2);
    k.body('moss', pair(mossL), { color: T.moss, roughness: 1.0, detail: 0.006, bump: mossBump, maxTriangles: 8000 });

    // ------------------------------------------------------------------ vines: four curling tendrils with leaves
    const vinesL = sdf
      .union(tendril(0.19).rotateZ(28).at(0.1, 0.95, -0.04).bone('head'))
      .union(tendril(0.26).rotateZ(-16).at(0.3, 0.715, -0.07).bone('chest'))
      .union(tendril(0.15).rotateZ(38).at(0.44, 0.45, 0.0).bone('forearm.L'))
      .union(tendril(0.13).rotateZ(48).at(0.16, 0.3, -0.09).bone('hips'));
    const vineBump = (x: number, y: number, z: number) => 0.0012 * noise.fbm(x * 70, y * 70, z * 70, 2);
    const vineOver = tendril(0.22).rotateZ(24).rotateY(-58).at(0.24, 0.8, -0.06).bone('chest');
    k.body('vine', sdf.union(pair(vinesL), vineOver), { color: T.vine, roughness: 0.92, detail: 0.004, bump: vineBump, maxTriangles: 9000 });

    // ------------------------------------------------------------------ core: a six-petal amber flower in the hollow
    // Petals stop short of the center so the gaps read: a flower silhouette, not a blob. The paint
    // burns hot yellow at the heart and deep orange at the petal tips, like coals.
    // A dark ember floor sits at the bottom of the cavity; six raised petals stand 0.022 m off it and
    // glow orange, so the flower reads as light in a dark pocket.
    const discZ = FLOOR_Z + 0.008;
    const coreDisc = sdf.ellipsoid([0.108, 0.094, 0.012]).at(CORE[0], CORE[1], discZ).paintFn((x, y, z) => {
      const rn = Math.hypot(x - CORE[0], y - CORE[1]) / 0.1;
      const n = 1 + 0.12 * noise.fbm(x * 50, y * 50, z * 50, 2);
      const c = mixRgb(rgb(C.visor), rgb(T.glowDark), 0.4 + 0.5 * Math.max(0, 1 - rn));
      return [c[0] * n, c[1] * n, c[2] * n];
    });
    k.body('core', coreDisc, { color: C.visor, emissive: T.glowDark, emissiveIntensity: 0.2, roughness: 0.8, bone: 'chest', detail: 0.004, textureDensity: 2, maxTriangles: 1500 });
    // Six flattened petals radial around the core center, a hot heart in the middle.
    const petal = (i: number) => {
      const a = (i * Math.PI) / 3 + 0.26;
      return sdf
        .ellipsoid([0.044, 0.02, 0.017])
        .rotateZ((a * 180) / Math.PI)
        .at(CORE[0] + Math.cos(a) * 0.052, CORE[1] + Math.sin(a) * 0.052, discZ + 0.018);
    };
    const petals = sdf
      .smoothUnion(0.004, ...[0, 1, 2, 3, 4, 5].map(petal), sdf.sphere(0.02).at(CORE[0], CORE[1], discZ + 0.02))
      .paintFn((x, y) => {
        const rn = Math.hypot(x - CORE[0], y - CORE[1]) / 0.105;
        return mixRgb(rgb(T.glowMid), rgb(T.glow), Math.max(0, 1 - rn * 1.4));
      });
    k.body('sigil', petals, { color: T.glowMid, emissive: T.glowMid, emissiveIntensity: 0.6, roughness: 0.8, bone: 'chest', detail: 0.004, textureDensity: 2, maxTriangles: 2500 });

    // ------------------------------------------------------------------ eyes: two amber slits in the recess
    // A low emissive intensity keeps the amber saturated; a high one blows out to pale peach.
    // The ellipsoids sit on the slot floor (z = 0.05), recessed below the face so a dark wood
    // frame surrounds the glow instead of two eggs stuck on the surface. The paint runs from deep
    // orange at the rim to hot yellow at the center: that radial ramp is what reads as light.
    const EYE_Z = 0.08; // the visor floor is at z = 0.09: the eye front (z = 0.105) stands 0.015 proud
    const eyeBox = sdf.box([0.08, 0.03, 0.05], 0.013).rotateZ(-12).at(EYE[0], EYE[1], EYE_Z);
    const eyeOne = eyeBox.paintFn((x, y) => {
      // Amber at the rim to a lighter amber-yellow at the center; never toward white.
      const rn = Math.hypot((x - EYE[0]) / 0.04, (y - EYE[1]) / 0.015);
      const hot = Math.pow(Math.max(0, 1 - Math.min(1, rn)), 0.9);
      return mixRgb(rgb(T.glow), rgb(T.glowPale), hot * 0.35);
    });
    const eyes = pair(eyeOne);
    k.body('eyes', eyes, { color: T.glow, emissive: T.glow, emissiveIntensity: 0.7, roughness: 0.3, bone: 'head', detail: 0.004, maxTriangles: 1500 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys } = motion;
    const LEG = HIP[1] - ANKLE[1];
    const DEG = Math.PI / 180;
    const deg = (r: number) => r / DEG;
    // A damped shake after `at`, with `n` swings in `len` of the clip.
    const shake = (p: number, at: number, len: number, n: number) =>
      p < at ? 0 : Math.exp((-(p - at) / len) * 3) * Math.sin(((p - at) / len) * Math.PI * n);

    k.animation('idle', {
      duration: 2.8,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0] },
        chest: { rotate: [2 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 10 * wave(p, 1, 0.25), 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-4 * bump(p, 1, 0.3), 0, 0] },
      }),
    });

    // A heavy, rolling walk: the weight shifts from side to side at each step, the fists swing.
    // The legs come from motion.gait (planted stance feet, a knee lift in the swing, heel strike and
    // toe-off); the gait phase runs a quarter cycle behind the clip.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, sway: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 5 * s, sway * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 8,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.3, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 4] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -4] as const },
          'forearm.L': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(1.1, 0.12, 0.03, 0.62, 0.01, 16, 4, 4));
    k.animation('run', stride(0.7, 0.17, 0.05, 0.45, 0.025, 28, 10, 3));

    // ------------------------------------------------------------------ attack: a two-fist ground slam
    // Both root fists swing up and back over the head while the golem rises and leans back; then
    // the trunk folds forward, the knees bend, and both fists drive down into the floor in front of
    // the feet (outside them). An impact shake, a hold, and a slow recovery.
    k.animation('attack', {
      duration: 1.3,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.52, 0.2, 5);
        const armX = keys(p, [[0, 0], [0.3, -150], [0.4, -158], [0.5, -70], [0.53, -64], [0.74, -64], [1, 0]] as const, 'smooth');
        const foreX = keys(p, [[0, 0], [0.3, -50], [0.4, -58], [0.5, -8], [0.74, -8], [1, 0]] as const, 'smooth');
        const handX = keys(p, [[0, 0], [0.3, -15], [0.4, -15], [0.5, 12], [0.74, 12], [1, 0]] as const, 'smooth');
        const spineX = keys(p, [[0, 0], [0.3, -6], [0.4, -8], [0.5, 20], [0.53, 22], [0.74, 20], [1, 0]] as const, 'smooth');
        const chestX = keys(p, [[0, 0], [0.3, -10], [0.4, -12], [0.5, 26], [0.53, 28], [0.74, 25], [1, 0]] as const, 'smooth') + 2 * sh;
        const c = keys(p, [[0, 0], [0.16, 0.35], [0.32, 0.05], [0.42, 0], [0.52, 1], [0.74, 0.95], [1, 0]] as const, 'smooth');
        return {
          hips: { move: [0, -0.05 * c - 0.004 * sh, -0.02 * c] },
          spine: { rotate: [spineX, 0, 0] },
          chest: { rotate: [chestX, 0, 0] },
          head: { rotate: [-(spineX + chestX) * 0.55 - 3 * sh, 0, 0] },
          'upperarm.L': { rotate: [armX, 0, 0] },
          'upperarm.R': { rotate: [armX, 0, 0] },
          'forearm.L': { rotate: [foreX, 0, 0] },
          'forearm.R': { rotate: [foreX, 0, 0] },
          'hand.L': { rotate: [handX, 0, 0] },
          'hand.R': { rotate: [handX, 0, 0] },
          'leg.L': { rotate: [-45 * c, 0, 0] },
          'shin.L': { rotate: [80 * c, 0, 0] },
          'foot.L': { rotate: [-35 * c, 0, 0] },
          'leg.R': { rotate: [-45 * c, 0, 0] },
          'shin.R': { rotate: [80 * c, 0, 0] },
          'foot.R': { rotate: [-35 * c, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a shoulder charge, then a backhand swipe
    // Plan: the golem sinks into a wide stance (the left foot steps back) and turns the right plank
    // shoulder at the target; two heavy steps carry it forward into the ram, a short hold with a
    // shake. Then the body unwinds and the right fist swings backhand across the front and out to
    // the right. Two steps back to rest. A planted foot keeps its world position.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    type Step = readonly [number, number, number, number]; // phase start, phase end, from z, to z
    const footAt = (steps: readonly Step[], p: number) => {
      let z = 0;
      let lift = 0;
      for (const [a, b, from, to] of steps) {
        if (p >= a) z = from + (to - from) * ease(a, b, p);
        if (p > a && p < b) lift = 0.03 * Math.sin(((p - a) / (b - a)) * Math.PI);
      }
      return { z, lift };
    };
    const legTo = (footZ: number, hipsZ: number, hipsY: number, side: 1 | -1) => {
      const hipZ = hipsZ - side * HIP[0] * Math.sin(hipsY * DEG);
      const a = Math.asin(Math.max(-0.95, Math.min(0.95, (hipZ - footZ) / LEG)));
      return { rot: deg(a), drop: LEG * (1 - Math.cos(a)) };
    };
    const STEPS_L: readonly Step[] = [[0.02, 0.13, 0, -0.18], [0.16, 0.26, -0.18, 0.1], [0.85, 0.95, 0.1, 0]];
    const STEPS_R: readonly Step[] = [[0.26, 0.36, 0, 0.24], [0.72, 0.83, 0.24, 0]];

    k.animation('attack2', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.36, 0.1, 5);
        const hipsY = keys(p, [[0, 0], [0.15, 14], [0.45, 14], [0.48, 15], [0.66, -10], [0.72, -10], [0.9, 0]] as const);
        const spineY = keys(p, [[0, 0], [0.15, 12], [0.45, 12], [0.48, 13], [0.66, -10], [0.72, -10], [0.92, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.15, 18], [0.36, 20], [0.45, 20], [0.48, 24], [0.66, -16], [0.72, -16], [0.95, 0]] as const);
        const turn = hipsY + spineY + chestY;
        const lean = keys(p, [[0, 0], [0.15, 12], [0.26, 13], [0.36, 18], [0.45, 16], [0.48, 12], [0.66, 6], [0.72, 6], [0.95, 0]] as const);
        const dip = keys(p, [[0, 0], [0.15, -4], [0.36, -8], [0.45, -7], [0.6, 0]] as const); // the ramming shoulder drops
        const fL = footAt(STEPS_L, p);
        const fR = footAt(STEPS_R, p);
        const hipsZ = (fL.z + fR.z) / 2 + keys(p, [[0, 0], [0.3, 0], [0.36, 0.02], [0.45, 0.015], [0.6, 0.02], [0.72, 0]] as const);
        const legL = legTo(fL.z, hipsZ, hipsY, 1);
        const legR = legTo(fR.z, hipsZ, hipsY, -1);
        // The right fist: tucked in front of the belly in the charge, cocked across, then a
        // backhand swing out to the right at chest height.
        const rX = keys(p, [[0, 0], [0.15, -35], [0.45, -35], [0.49, -50], [0.58, -80], [0.66, -72], [0.72, -60], [0.9, -20], [1, 0]] as const, 'smooth');
        const rZ = keys(p, [[0, 0], [0.15, 12], [0.45, 12], [0.49, 28], [0.58, -10], [0.66, -45], [0.72, -45], [0.9, -10], [1, 0]] as const, 'smooth');
        const rFore = keys(p, [[0, 0], [0.15, -55], [0.45, -55], [0.49, -60], [0.58, -15], [0.66, -10], [0.72, -10], [0.9, -20], [1, 0]] as const, 'smooth');
        // The off arm braces forward, pulls back to drive the charge, and swings out in the swipe.
        const lX = keys(p, [[0, 0], [0.15, -30], [0.3, 15], [0.45, 15], [0.6, -20], [0.72, -20], [1, 0]] as const, 'smooth');
        const lZ = keys(p, [[0, 0], [0.15, 8], [0.45, 8], [0.6, 22], [0.72, 22], [1, 0]] as const, 'smooth');
        const h = hipsY * DEG;
        return {
          hips: { move: [0, -Math.min(legL.drop + fL.lift, legR.drop + fR.lift), hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean * Math.cos(h), spineY, lean * Math.sin(h)] },
          chest: { rotate: [3 * sh, chestY, dip + 2 * sh] },
          head: { rotate: [-lean * 0.6 - 3 * sh, -turn * 0.5, 0] },
          'upperarm.R': { rotate: [rX, 0, rZ] },
          'forearm.R': { rotate: [rFore, 0, 0] },
          'upperarm.L': { rotate: [lX, 0, lZ] },
          'forearm.L': { rotate: [-20 * ease(0, 0.15, p) * (1 - ease(0.8, 1, p)), 0, 0] },
          'leg.L': { rotate: [legL.rot, -hipsY, 0], move: [0, fL.lift, 0] },
          'leg.R': { rotate: [legR.rot, -hipsY, 0], move: [0, fR.lift, 0] },
          'foot.L': { rotate: [-legL.rot, 0, 0] },
          'foot.R': { rotate: [-legR.rot, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ roar: both fists raised, the planks tremble
    k.animation('roar', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
        const lift = Math.max(0, rise);
        const crouch = Math.max(0, -rise);
        // Seven quick trembles while it roars (odd, so the strip does not freeze on them).
        const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
        return {
          hips: { move: [0, -0.025 * crouch - 0.003 * Math.abs(tremble), 0] },
          spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
          chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0] },
          neck: { rotate: [6 * crouch - 6 * lift, 0, 0] },
          head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
          'upperarm.L': { rotate: [-25 * lift + 10 * crouch, 0, 65 * lift] },
          'upperarm.R': { rotate: [-25 * lift + 10 * crouch, 0, -65 * lift] },
          'forearm.L': { rotate: [-55 * lift - 20 * crouch, 0, 0] },
          'forearm.R': { rotate: [-55 * lift - 20 * crouch, 0, 0] },
          'leg.L': { rotate: [0, 0, 4 * lift] },
          'leg.R': { rotate: [0, 0, -4 * lift] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: snap back from a blow, a step back, recover
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.16, 1], [0.38, 0.8], [1, 0]] as const);
        const back = -0.025 * r;
        const legL = deg(Math.atan2(back, LEG));
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 5 * r, 0] },
          spine: { rotate: [-8 * r, 0, 3 * r] },
          chest: { rotate: [-9 * r, 7 * r, 0] },
          neck: { rotate: [-5 * r, 0, 0] },
          head: { rotate: [-14 * r, -9 * r, 6 * r] },
          'upperarm.L': { rotate: [12 * r, 0, 24 * r] },
          'forearm.L': { rotate: [-22 * r, 0, 0] },
          'upperarm.R': { rotate: [10 * r, 0, -18 * r] },
          'forearm.R': { rotate: [-12 * r, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] }, // a small step back
          'foot.R': { rotate: [-12 * r, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: stagger back, topple, lie on the back
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const fall = keys(p, [[0, 0], [0.2, -8], [0.4, 3], [0.54, -40], [0.66, -88], [0.72, -84], [0.8, -88], [1, -88]] as const);
        const hipsY = keys(p, [[0, 0], [0.4, 0], [0.54, -0.01], [0.66, -0.1], [0.72, -0.085], [0.8, -0.1], [1, -0.1]] as const);
        const hipsZ = keys(p, [[0, 0], [0.2, -0.035], [0.4, -0.02], [0.66, -0.13], [1, -0.13]] as const);
        const legs = keys(p, [[0, 0], [0.2, 4], [0.4, -3], [0.54, 36], [0.66, 50], [1, 50]] as const);
        const stepR = keys(p, [[0, 0], [0.2, 14], [0.4, 4], [0.54, 0], [1, 0]] as const);
        const spill = keys(p, [[0, 0], [0.54, 0], [0.62, 1], [1, 1]] as const);
        return {
          hips: { move: [0, hipsY, hipsZ], rotate: [fall, keys(p, [[0, 0], [0.2, 8], [0.66, -6], [1, -6]] as const), 0] },
          spine: { rotate: [keys(p, [[0, 0], [0.2, -10], [0.4, 8], [0.56, 6], [0.66, -4], [1, 0]] as const), 0, 0] },
          chest: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 6], [0.66, -2], [1, 0]] as const), keys(p, [[0, 0], [0.2, 10], [0.5, -6], [1, 0]] as const), 0] },
          neck: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 8], [0.6, 16], [0.7, -6], [0.8, 0], [1, 0]] as const), 0, 0] },
          head: { rotate: [keys(p, [[0, 0], [0.2, -14], [0.4, 10], [0.6, 14], [0.7, -10], [0.8, 0], [1, 0]] as const), keys(p, [[0, 0], [0.7, 0], [0.9, 28], [1, 28]] as const), 0] },
          'upperarm.L': { rotate: [keys(p, [[0, 0], [0.2, 12], [0.4, -8], [0.58, -55], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, 28], [0.4, 12], [0.58, 40], [0.7, 60], [1, 62]] as const)] },
          'forearm.L': { rotate: [keys(p, [[0, 0], [0.2, -30], [0.58, -20], [0.7, -6], [1, -8]] as const), 0, 0] },
          'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 10], [0.4, -6], [0.58, -45], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, -22], [0.4, -10], [0.58, -35], [0.7, -58], [1, -60]] as const)] },
          'forearm.R': { rotate: [keys(p, [[0, 0], [0.2, -20], [0.58, -15], [0.7, 0], [1, 0]] as const), 0, 0] },
          'leg.L': { rotate: [legs + keys(p, [[0, 0], [0.2, -6], [0.4, 0]] as const), 0, 6 * spill] },
          'leg.R': { rotate: [legs + stepR, 0, -8 * spill] },
          'foot.L': { rotate: [-keys(p, [[0, 0], [0.4, 0], [0.66, 12], [1, 12]] as const), 0, 0] },
          'foot.R': { rotate: [-stepR * 0.8, 0, 0] },
        };
      },
    });
  },
});
