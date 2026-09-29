import { defineAsset, mixRgb, motion, noise, rgb, sdf } from '../src/index.js';

/**
 * Iron golem — Chibi Quest P1 dungeon enemy, about 1.15 m tall, faces +Z.
 * Target: docs/enemy-mockups/iron-golem_001.jpg (one front view).
 *
 * Base: assets/stone-golem.ts (the same heavy rig with knee bones and the same clip set; every
 *   boulder is now a chamfered iron box and the moss is rust).
 * Role: a slow armored dungeon brute; at 128 px the glowing visor slit, the round furnace hatch,
 *   the huge box shoulders, and the fists must read.
 * One idea: a squat iron machine of chamfered boxes: a small angular head sunk between huge
 *   shoulder cubes, a wide glowing orange visor, and a riveted furnace hatch in the chest.
 * Shape language: square and angular; the round hatch and the fist balls are the only curves.
 * Proportions: head 0.87 to 1.05 (rust spike to 1.13), shoulder cubes 0.64 to 0.88 and 0.28 to 0.52
 *   out, chest 0.46 to 0.86, hatch 0.65, pelvis 0.30 to 0.46, legs 0.09 to 0.41, feet 0 to 0.1.
 * Palette: iron #3a3b3e with lit #55575c; rust #8a4a22 streaks (slot `rust`); glow #ff8a1a on a
 *   dark base (slot `glow`); the hatch glows a little redder.
 * Bodies: frame (dark joints and inner blocks), plates (iron boxes), head, rivets (rust: rivets,
 *   spike, hatch rim), visor, hatch. All are skinned by .bone tags.
 * Rig: the stone golem rig. Clips: idle, walk, run, attack (a two-fist slam), attack2 (a
 *   shoulder charge and a backhand swipe), roar, hit, death.
 */

const C = {
  iron: '#4a5058',
  lit: '#6a7078',
  under: '#363a40',
  frame: '#2c3036',
  rust: '#8a4a22',
  glow: '#ff7a10',
};

type V3 = readonly [number, number, number];

const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: high, wide shoulders, arms hanging far out, a short wide stance.
const SHOULDER: V3 = [0.3, 0.68, 0];
// The arms are bent in the rest pose: the upper arm turns 16 degrees outward at the shoulder,
// the forearm 30 degrees forward at the elbow. ELBOW and WRIST are the bent joint positions;
// ELBOW0 and WRIST0 are the straight positions the arm parts are first built at.
const ARM_OUT = 16;
const FORE_FWD = 30;
const ELBOW0: V3 = [0.4, 0.53, 0.03];
const WRIST0: V3 = [0.45, 0.4, 0.06];
const rotZAbout = (p: V3, c: V3, deg: number): V3 => {
  const a = (deg * Math.PI) / 180;
  const x = p[0] - c[0];
  const y = p[1] - c[1];
  return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a), p[2]];
};
const rotXAbout = (p: V3, c: V3, deg: number): V3 => {
  const a = (deg * Math.PI) / 180;
  const y = p[1] - c[1];
  const z = p[2] - c[2];
  return [p[0], c[1] + y * Math.cos(a) - z * Math.sin(a), c[2] + y * Math.sin(a) + z * Math.cos(a)];
};
/** A straight-arm point (or shape) moved to its place on the bent upper arm, or the bent forearm. */
const tArm = (p: V3): V3 => rotZAbout(p, SHOULDER, ARM_OUT);
const tFore = (p: V3): V3 => tArm(rotXAbout(p, ELBOW0, -FORE_FWD));
const armShape = (s: sdf.Shape) => s.at(-SHOULDER[0], -SHOULDER[1], -SHOULDER[2]).rotateZ(ARM_OUT).at(...SHOULDER);
const foreShape = (s: sdf.Shape) => armShape(s.at(-ELBOW0[0], -ELBOW0[1], -ELBOW0[2]).rotateX(-FORE_FWD).at(...ELBOW0));
const ELBOW: V3 = tArm(ELBOW0);
const WRIST: V3 = tFore(WRIST0);
const HIP: V3 = [0.13, 0.3, 0];
const KNEE: V3 = [0.16, 0.19, 0.005]; // the knee: splits the leg (shin.L takes the weight below it)
const ANKLE: V3 = [0.18, 0.09, 0.01];
// The ends of the flat bottom of the left foot block (y = 0): heel and toe.
const SOLE_HEEL: V3 = [0.18, 0, -0.1];
const SOLE_TOE: V3 = [0.18, 0, 0.15];

/**
 * A chamfered iron box at the origin: every edge cut by `c` (the top edges by `cTop`), the
 * corners rounded a little.
 */
const plate = (size: V3, c = 0.02, cTop = c, r = 0.008): sdf.Shape => {
  const h = size.map((v) => v / 2);
  let s: sdf.Shape = sdf.box(size, r);
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]] as const) {
    for (const sa of [-1, 1]) {
      for (const sb of [-1, 1]) {
        const cut = (a === 1 && sa > 0) || (b === 1 && sb > 0) ? cTop : c;
        const n: [number, number, number] = [0, 0, 0];
        n[a] = sa / Math.SQRT2;
        n[b] = sb / Math.SQRT2;
        s = s.intersect(sdf.halfSpace(n, (h[a]! + h[b]! - cut) / Math.SQRT2));
      }
    }
  }
  return s;
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'iron-golem',
  description: 'Chibi iron golem: a squat construct of chamfered iron boxes with rust streaks and rivets, a small angular head with a glowing orange visor and a rust spike sunk between huge shoulder cubes, a riveted furnace hatch in the chest, box legs with vents, and huge fists.',
  detail: 0.007,
  reference: 'docs/enemy-mockups/iron-golem_001.jpg',
  // Color slots for individual golems (the first option is the default look).
  variants: {
    glow: { orange: C.glow, blue: '#3a9aff', green: '#5aff6a' },
    rust: { rust: C.rust, verdigris: '#4a8a6a', clean: C.lit },
  },
  presets: {
    frost: { glow: 'blue', rust: 'clean' },
    toxic: { glow: 'green', rust: 'verdigris' },
    aged: { glow: 'orange', rust: 'verdigris' },
  },

  build(k) {
    const T = {
      glow: k.tint('glow'),
      glowDark: k.tint('glow', -0.8),
      core: k.tint('glow', { color: '#ffb020', follow: 1 }),
      boss: k.tint('rust', { color: '#7a4a2a', follow: 1 }),
      hatch: k.tint('glow', { color: '#ff6a10', follow: 1 }),
      rust: k.tint('rust'),
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


    // ------------------------------------------------------------------ rivet positions (world, left side and centre)
    const LX = 0.16; // leg centre
    const HATCH: V3 = [0, 0.65, 0.17];
    const chestPts: V3[] = [
      [-0.21, 0.83, 0.17], [0.21, 0.83, 0.17], [-0.21, 0.49, 0.17], [0.21, 0.49, 0.17],
      [-0.21, 0.66, 0.17], [0.21, 0.66, 0.17], [-0.11, 0.83, 0.17], [0.11, 0.83, 0.17],
      // six rivets on the hatch ring
      ...[30, 90, 150, 210, 270, 330].map((a): V3 => [Math.cos((a * Math.PI) / 180) * 0.09, HATCH[1] + Math.sin((a * Math.PI) / 180) * 0.09, 0.19]),
    ];
    const HY = 0.975; // head centre
    const VISOR_Y = HY - 0.005;
    const headPts: V3[] = [[-0.1, VISOR_Y + 0.055, 0.152], [0.1, VISOR_Y + 0.055, 0.152]];
    const hipsPts: V3[] = [[-0.11, 0.43, 0.12], [0.11, 0.43, 0.12], [0, 0.4, 0.176]];
    const row = (n: number, x0: number, x1: number, y: number, z: number): V3[] =>
      Array.from({ length: n }, (_, i) => [x0 + ((x1 - x0) * i) / (n - 1), y, z] as V3);
    const upperPts = [...row(3, 0.31, 0.49, 0.88, 0.14), [0.28, 0.68, 0.14], [0.52, 0.68, 0.14]].map((p) => tArm(p as V3));
    const forePts = [...row(3, 0.36, 0.52, 0.44, 0.13), [0.37, 0.24, 0.13], [0.52, 0.24, 0.13]].map((p) => tFore(p as V3));
    const legPts: V3[] = [[0.09, 0.4, 0.121], [0.23, 0.4, 0.121]];
    const shinPts: V3[] = [[0.09, 0.12, 0.116], [0.23, 0.12, 0.116]];
    const footPts: V3[] = [[0.11, 0.1, -0.05], [0.23, 0.1, -0.05]];
    const sidePts: V3[] = [...upperPts, ...forePts, ...legPts, ...shinPts, ...footPts];
    const allRivets: V3[] = [...chestPts, ...headPts, ...hipsPts, ...sidePts, ...sidePts.map(mx)];

    // Iron value: a lit top, dark undersides, rust streaks under every rivet, rust along the chamfer
    // edges, and long rust runs and chips. `dark` (0 to 1) deepens the frame blocks.
    const ironPaint = (s: sdf.Shape, dark: number) =>
      s.paintFn((x, y, z, base) => {
        const e = 0.006;
        const d0 = s.dist(x, y, z);
        const gx = s.dist(x + e, y, z) - d0;
        const gy = s.dist(x, y + e, z) - d0;
        const gz = s.dist(x, y, z + e) - d0;
        const gl = Math.hypot(gx, gy, gz) || 1;
        const ny = gy / gl;
        const edge = 1 - Math.max(Math.abs(gx), Math.abs(gy), Math.abs(gz)) / gl; // 0 on a flat face, 0.3 on a chamfer
        const wobble = noise.fbm(x * 30, y * 30, z * 30, 2);
        let c = mixRgb(base, rgb(C.lit), 0.9 * smooth(0.15, 0.8, ny) * (0.8 + 0.4 * (wobble + 0.5)));
        c = mixRgb(c, rgb(C.under), 0.9 * smooth(0.1, 0.6, -ny));
        if (dark > 0) c = mixRgb(c, rgb('#1c1f24'), 0.4 * dark);
        // rust: long streaks and chips, edges, and runs below each rivet
        const streak = smooth(0.14, 0.42, noise.fbm(x * 15 + 3, y * 3.2, z * 15, 3));
        const chip = smooth(0.3, 0.52, noise.fbm(x * 38, y * 38 + 9, z * 38, 2));
        const edgeRust = smooth(0.12, 0.3, edge) * smooth(-0.15, 0.25, wobble + 0.15 * noise.fbm(x * 9, y * 9, z * 9, 2));
        let run = 0;
        const w = 0.006 + 0.005 * (wobble + 0.5);
        for (const r of allRivets) {
          const dy = r[1] - y;
          if (dy < -0.01 || dy > 0.1) continue;
          if (Math.abs(x - r[0]) > w || Math.abs(z - r[2]) > 0.07) continue;
          const len = 0.05 + 0.05 * (noise.noise3(r[0] * 40, r[1] * 40, r[2] * 40) * 0.5 + 0.5);
          run = Math.max(run, 1 - Math.max(0, dy) / len);
        }
        const amt = Math.min(1, 0.55 * streak + 0.7 * chip + 0.6 * edgeRust + 1.0 * Math.max(0, run)) * (1 - 0.4 * dark);
        return mixRgb(c, rgb(T.rust), amt);
      });
    const ironBump = (x: number, y: number, z: number) => 0.0018 * noise.fbm(x * 60, y * 60, z * 60, 2);
    const IRON = { color: C.iron, roughness: 0.7, metalness: 0.5, bump: ironBump };

    // ------------------------------------------------------------------ head: an angular iron block with a brow ledge
    const skull = plate([0.26, 0.22, 0.24], 0.03, 0.045).at(0, HY, 0);
    const recess = sdf.box([0.176, 0.061, 0.06], 0.004).at(0, VISOR_Y, 0.12); // the visor pocket, floor at z 0.09
    const brow = plate([0.27, 0.035, 0.05], 0.01, 0.012).at(0, VISOR_Y + 0.055, 0.127);
    const bolts = hard(sdf.cylinder(0.03, 0.05, 0.008).rotateZ(90).at(0.14, HY + 0.005, 0));
    const headShape = skull.subtract(recess).union(brow, bolts).bone('head');
    k.body('skull', ironPaint(headShape, 0), { ...IRON, detail: 0.005, textureDensity: 1.5 });

    // ------------------------------------------------------------------ frame: the dark inner blocks and joints
    const frameShape = sdf.union(
      sdf.box([0.13, 0.09, 0.13], 0.01).at(0, 0.88, -0.01).bone('neck'),
      sdf.box([0.23, 0.12, 0.19], 0.012).at(0, 0.45, 0).bone('spine'),
      plate([0.27, 0.15, 0.22], 0.02, 0.02).at(0, 0.385, 0).bone('hips'),
      hard(sdf.capsule([0.18, 0.73, 0], [0.34, 0.73, 0], 0.065).bone('upperarm.L')),
      hard(armShape(plate([0.2, 0.26, 0.2], 0.02).at(...ELBOW0)).bone('upperarm.L')),
      hard(sdf.sphere(0.085).at(...ELBOW).bone('forearm.L')),
      hard(foreShape(sdf.capsule([0.43, 0.42, 0.01], [0.46, 0.2, 0.05], 0.06)).bone('forearm.L')),
      hard(sdf.cylinder(0.05, 0.13, 0.01).at(LX, 0.215, 0).bone('shin.L')),
    );
    k.body('frame', ironPaint(frameShape, 1), { ...IRON, color: C.frame });

    // ------------------------------------------------------------------ plates: the iron boxes
    const chestP = plate([0.5, 0.4, 0.34], 0.022, 0.03).at(0, 0.66, 0).bone('chest');
    const collar = plate([0.44, 0.055, 0.32], 0.014).at(0, 0.858, 0).bone('chest');
    const backP = plate([0.32, 0.26, 0.1], 0.02).at(0, 0.66, -0.2).bone('chest');
    const codpiece = plate([0.15, 0.17, 0.09], 0.02, 0.015).at(0, 0.335, 0.13).bone('hips');
    const ring = sdf.torus(0.09, 0.02).rotateX(90).at(HATCH[0], HATCH[1], HATCH[2] + 0.002).bone('chest');
    const shoulder = armShape(plate([0.28, 0.28, 0.28], 0.035, 0.07).at(0.4, 0.77, 0)).bone('upperarm.L');
    const shoulderNub = armShape(plate([0.07, 0.07, 0.07], 0.012, 0.02).at(0.5, 0.92, -0.04)).bone('upperarm.L');
    const gauntlet = foreShape(plate([0.24, 0.28, 0.24], 0.03, 0.05).at(0.44, 0.33, 0.01)).bone('forearm.L');
    const disc = foreShape(sdf.cylinder(0.105, 0.035, 0.008).rotateZ(90).at(0.578, 0.36, 0.0)).bone('forearm.L');
    // The fist: a chamfered cube with four knuckle spheres in front.
    const FC: V3 = [0.45, 0.16, 0.03];
    const fistCube = plate([0.12, 0.12, 0.12], 0.02, 0.02).at(...FC);
    const knuckles = [-0.032, 0.032].flatMap((dx) => [-0.028, 0.028].map((dy) => sdf.sphere(0.035).at(FC[0] + dx, FC[1] + dy, FC[2] + 0.062)));
    const fist = foreShape(fistCube.smoothUnion(0.012, ...knuckles)).bone('hand.L');
    const thigh = plate([0.22, 0.22, 0.23], 0.02, 0.025)
      .subtract(sdf.box([0.12, 0.065, 0.05], 0.004).at(0, -0.015, 0.115))
      .at(LX, 0.3, 0.005)
      .bone('leg.L');
    const shin = plate([0.21, 0.14, 0.22], 0.02, 0.015).at(LX, 0.155, 0.005).bone('shin.L');
    const foot = plate([0.24, 0.1, 0.26], 0.018, 0.02).at(0.17, 0.05, 0.0).bone('foot.L');
    const toes = sdf
      .union(...[-0.08, 0, 0.08].map((dx) => plate([0.065, 0.075, 0.09], 0.012, 0.014).at(0.17 + dx, 0.0375, 0.155)))
      .bone('foot.L');
    const platesShape = sdf.union(chestP, collar, backP, codpiece, ring, hard(sdf.union(shoulder, shoulderNub, gauntlet, disc, fist, thigh, shin, foot, toes)));
    k.body('plates', ironPaint(platesShape, 0), IRON);

    // ------------------------------------------------------------------ rivets and the spike (rust)
    const rivets = (points: readonly V3[], bone: string) =>
      sdf.union(...points.map((p) => sdf.sphere(0.013).at(p[0], p[1], p[2]))).bone(bone);
    const spike = sdf.cone([0, 1.07, 0], [0, 1.16, 0], 0.034, 0.006).smoothUnion(0.01, sdf.sphere(0.036).at(0, 1.085, 0)).bone('head');
    const rustParts = sdf.union(
      rivets(chestPts, 'chest'),
      rivets(headPts, 'head'),
      spike,
      rivets(hipsPts, 'hips'),
      hard(
        sdf.union(
          rivets(upperPts, 'upperarm.L'),
          rivets(forePts, 'forearm.L'),
          rivets(legPts, 'leg.L'),
          rivets(shinPts, 'shin.L'),
          rivets(footPts, 'foot.L'),
        ),
      ),
    );
    k.body('rivets', rustParts, { color: T.rust, roughness: 0.75, metalness: 0.3, detail: 0.005 });

    // ------------------------------------------------------------------ the visor: a dark frame, an orange strip, a bright core
    const visorFrame = sdf.box([0.176, 0.061, 0.012], 0.004).at(0, VISOR_Y, 0.096).bone('head');
    k.body('visorFrame', visorFrame, { color: '#1a1410', roughness: 0.8, metalness: 0.3, detail: 0.004 });
    const visorEdge = sdf.box([0.16, 0.045, 0.014], 0.004).at(0, VISOR_Y, 0.103).bone('head');
    k.body('visorEdge', visorEdge, { color: T.glow, emissive: T.glow, emissiveIntensity: 1.6, roughness: 0.3, detail: 0.004 });
    const visorCore = sdf.box([0.125, 0.022, 0.008], 0.003).at(0, VISOR_Y, 0.111).bone('head');
    k.body('visorCore', visorCore, { color: T.core, emissive: T.core, emissiveIntensity: 2.0, roughness: 0.3, detail: 0.004 });

    // ------------------------------------------------------------------ the furnace hatch: a rust-brown boss with a glowing slot
    const boss = sdf.ellipsoid([0.076, 0.076, 0.026]).at(HATCH[0], HATCH[1], HATCH[2] + 0.002).bone('chest');
    k.body('boss', boss, { color: T.boss, roughness: 0.8, metalness: 0.3, bump: ironBump, detail: 0.005 });
    const slot = sdf.box([0.05, 0.014, 0.014], 0.004).at(HATCH[0], HATCH[1], HATCH[2] + 0.026).bone('chest');
    k.body('furnace', slot, { color: T.hatch, emissive: T.hatch, emissiveIntensity: 1.5, roughness: 0.4, detail: 0.004 });

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
    // Both fists swing up and back over the head while the golem rises and leans back; then the
    // trunk folds forward, the knees bend, and both fists drive down into the floor in front of
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
    // Plan: the golem sinks into a wide stance (the left foot steps back) and turns the right
    // boulder shoulder at the target; two heavy steps carry it forward into the ram, a short hold
    // with a shake. Then the body unwinds and the right fist swings backhand across the front and
    // out to the right. Two steps back to rest. A planted foot keeps its world position.
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

    // ------------------------------------------------------------------ roar: both fists raised, the stones tremble
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
