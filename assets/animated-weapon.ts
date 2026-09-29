import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Animated weapon — Chibi Quest dungeon enemy: a haunted longsword and shield with no body, about
 * 0.96 m from the ground mist to the pommel top, faces +Z. Target:
 * docs/enemy-mockups/animated-weapon_001.jpg (one front view). Built on the animated armor's
 * skeleton and clips (the same clip set); every armor body is gone, only bones stay.
 *
 * Role: a floating dungeon guardian, seen in 3D and as a 128 px sprite; the glowing rune line and
 *   the staring shield eye must read at once.
 * One idea: a big dark iron sword hangs point down over a bank of mist, a violet rune burning down
 *   its blade, a beaded magic coil wound round it, and a round bronze shield with a white eye
 *   floating beside it.
 * Shape language: hard and upright (the long blade), with round accents (pommel, coil, shield,
 *   mist puffs).
 * Palette (60/30/10): dark iron #4a4a52 with lit edges #6a6a74; bronze shield #b87a3a; pale lilac
 *   mist #d8cfe8; the violet rune #c060ff and the coil #9a4aa8 as the accent.
 * Value plan: the bright rune line on the dark blade is the strongest contrast; the white shield
 *   eye on bronze is the second.
 * Bodies: blade, rune, guard (with the pommel), grip, coil, shield, shield-fittings, eye, pupil,
 *   mist, wisps.
 * Rig: the animated armor's skeleton plus `mist` and two wisp bones. The sword, rune, and coil are
 *   rigid on `chest`, the shield on `hand.R`, the mist on `mist`. Clips: idle, walk, run, attack
 *   (a thrust, point forward), hit, death (the sword and shield fall flat), awaken.
 */

const C = {
  blade: '#4a4a52',
  bladeLit: '#6a6a74',
  bladeDark: '#3a3a42',
  rune: '#c060ff',
  grip: '#3a3a40',
  pommel: '#5a5a62',
  coil: '#9a4aa8',
  coilLit: '#c070d0',
  bronze: '#b87a3a',
  bronzeDark: '#8a5a28',
  rivet: '#6a4a2a',
  eye: '#f2f2f2',
  pupil: '#101014',
  mist: '#d8cfe8',
  wisp: '#b070ff',
};

type V3 = readonly [number, number, number];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

// The animated armor's joints (unused geometry-wise, the rig keeps them).
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.19, 0.33, 0.0];
const WRIST_L: V3 = [0.24, 0.29, 0.075];
const ELBOW_R: V3 = [-0.2, 0.33, 0.0];
const WRIST_R: V3 = [-0.215, 0.29, 0.1];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];

// The sword (on the chest bone): the pivot is the chest joint at y 0.33.
const TIP_Y = 0.18;
const BLADE_TOP = 0.735;
const HW = 0.046; // blade half-width
const HT = 0.016; // blade half-thickness
const GUARD_Y = 0.748;
const CHEST_Y = 0.33;
const D = -0.12; // the sword hangs lower: its tip (y 0.06) sits inside the mist

export default defineAsset({
  name: 'animated-weapon',
  description: 'Chibi animated weapon dungeon enemy: a floating dark iron sword point down with a glowing violet rune line and a beaded magic coil, a bronze shield with a staring eye, over a bank of lilac mist.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/animated-weapon_001.jpg',
  variants: {
    rune: { violet: C.rune, cyan: '#40e0ff', red: '#ff4040' },
    shield: { bronze: C.bronze, silver: '#b8bcc4', black: '#2a2a30' },
  },
  presets: {
    frostbrand: { rune: 'cyan', shield: 'silver' },
    emberedge: { rune: 'red', shield: 'black' },
  },

  build(k) {
    const SLOT = {
      rune: k.tint('rune'),
      coil: k.tint('rune', { color: C.coil, follow: 1 }),
      coilLit: k.tint('rune', { color: C.coilLit, follow: 1 }),
      wisp: k.tint('rune', { color: C.rune, follow: 1 }),
      glow: k.tint('rune', { color: C.wisp, follow: 1 }),
      shield: k.tint('shield'),
      shieldDark: k.tint('shield', { color: C.bronzeDark, follow: 1 }),
    };

    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, CHEST_Y, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
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
      // The mist and its two wisp bones: on the ground, under the sword.
      mist: { parent: 'hips', at: [0, 0, 0] },
      'wisp.L': { parent: 'mist', at: [0.09, 0.05, 0] },
      'wisp.R': { parent: 'mist', at: [-0.09, 0.05, 0] },
    });

    // ------------------------------------------------------------------ blade, rune, guard, grip, pommel
    const bladeShape = sdf
      .extrude(
        profile.polygon([
          [-HW, BLADE_TOP],
          [HW, BLADE_TOP],
          [HW, 0.28],
          [0.012, TIP_Y + 0.004],
          [-0.012, TIP_Y + 0.004],
          [-HW, 0.28],
        ]),
        HT * 2,
        0.006,
      )
      .paintWhere(sdf.box([0.4, 0.7, 0.4]).at(0, 0.45, 0).subtract(sdf.box([2 * (HW - 0.011), 2, 1])), C.bladeLit, 0.004)
      .paintWhere(sdf.box([0.034, 0.5, 0.4]).at(0, 0.485, 0), C.bladeDark, 0.004)
      .paintFn((x, y, z, b) => {
        const m = 1 + 0.1 * noise.fbm(x * 22, y * 22, z * 22, 2);
        return [b[0] * m, b[1] * m, b[2] * m];
      });
    k.body('blade', bladeShape.at(0, D, 0), { color: C.blade, roughness: 0.4, metalness: 0.7, bone: 'chest' });

    // The rune line: a thin emissive bar standing a little proud of both blade faces.
    const RUNE_Y = 0.485;
    const rune = sdf.union(...[1, -1].map((s) => sdf.box([0.014, 0.45, 0.008], 0.003).at(0, RUNE_Y, s * HT)));
    k.body('rune', rune.at(0, D, 0), { color: SLOT.rune, roughness: 0.3, emissive: SLOT.rune, emissiveIntensity: 2.2, detail: 0.004, bone: 'chest' });

    // The guard: a rounded bar with two upturned ends and a low boss, and the round pommel.
    const tip = (s: number) => sdf.capsule([s * 0.085, GUARD_Y + 0.002, 0], [s * 0.112, GUARD_Y + 0.034, 0], 0.017);
    const guard = sdf.smoothUnion(
      0.012,
      sdf.box([0.2, 0.03, 0.05], 0.011).at(0, GUARD_Y, 0),
      tip(1),
      tip(-1),
      sdf.ellipsoid([0.055, 0.026, 0.034]).at(0, GUARD_Y + 0.01, 0),
    );
    const pommel = sdf.sphere(0.035).at(0, 0.928, 0);
    k.body('guard', sdf.smoothUnion(0.006, guard, pommel).at(0, D, 0).paintFn((x, y, z, b) => {
      const m = 1 + 0.12 * noise.fbm(x * 40, y * 40, z * 40, 2);
      return [b[0] * m, b[1] * m, b[2] * m];
    }), { color: C.pommel, roughness: 0.45, metalness: 0.7, detail: 0.005, bone: 'chest' });

    // The grip: a ribbed cylinder (the ribs are baked into the normal map, and shaded in the paint).
    const ribs = (_x: number, y: number) => 0.004 * Math.max(0, Math.sin((y * Math.PI * 2) / 0.0165));
    const grip = sdf
      .cylinder(0.017, 0.14, 0.004)
      .at(0, 0.83, 0)
      .paintFn((_x, y, _z, b) => {
        const t = 0.5 + 0.5 * Math.sin((y * Math.PI * 2) / 0.0165);
        const m = 0.75 + 0.35 * t;
        return [b[0] * m, b[1] * m, b[2] * m];
      });
    k.body('grip', grip.at(0, D, 0), { color: C.grip, roughness: 0.8, detail: 0.005, bone: 'chest', bump: ribs });

    // ------------------------------------------------------------------ the magic coil: 15 beads in a tight spiral, two turns round the blade
    const N = 15;
    const spiral = (i: number): V3 => {
      const t = i / (N - 1);
      const a = Math.PI - t * Math.PI * 2 * 2;
      return [-0.068 * Math.cos(a), 0.595 - 0.235 * t, 0.045 * Math.sin(a)];
    };
    const beadPts = Array.from({ length: N }, (_, i) => spiral(i));
    const beads = beadPts.map((p) => sdf.ellipsoid([0.024, 0.021, 0.024]).at(...p));
    const strand = sdf.chain(beadPts.map((p) => [p[0], p[1], p[2], 0.013] as [number, number, number, number]), 0.004);
    const coil = sdf
      .smoothUnion(0.004, strand, ...beads)
      .paintWhere(sdf.halfSpace([0, 0, -1], 0.0), SLOT.coilLit, 0.01);
    k.body('coil', coil, { color: SLOT.coil, roughness: 0.5, emissive: SLOT.coil, emissiveIntensity: 0.5, detail: 0.005, bone: 'chest' });

    // ------------------------------------------------------------------ the shield (on the left hand bone)
    const shieldPose = (s: sdf.Shape) => s.rotateY(-14).at(-0.18, 0.52, 0.02);
    const plate = sdf.cylinder(0.108, 0.024, 0.01).rotateX(90);
    const dome = sdf.ellipsoid([0.07, 0.07, 0.026]).at(0, 0, 0.008);
    const rim = sdf.torus(0.099, 0.011).rotateX(90).at(0, 0, 0.004);
    const shieldBody = sdf.smoothUnion(0.008, plate, dome, rim);
    k.body('shield', shieldPose(shieldBody).paintFn((x, y, z, b) => {
      const m = 1 + 0.1 * noise.fbm(x * 30, y * 30, z * 30, 2);
      return [b[0] * m, b[1] * m, b[2] * m];
    }), { color: SLOT.shield, roughness: 0.4, metalness: 0.7, bone: 'hand.R' });
    // The eye socket ring and the three rivets.
    const rivet = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      return sdf.sphere(0.0115).at(0.086 * Math.cos(a), 0.086 * Math.sin(a), 0.014);
    };
    const fittings = sdf.union(sdf.torus(0.044, 0.0085).rotateX(90).at(0, 0, 0.03), rivet(90), rivet(210), rivet(330));
    k.body('shield-fittings', shieldPose(fittings), { color: C.rivet, roughness: 0.5, metalness: 0.6, detail: 0.004, bone: 'hand.R' });
    const eyeWhite = sdf.ellipsoid([0.042, 0.042, 0.014]).at(0, 0, 0.032);
    k.body('eye', shieldPose(eyeWhite), { color: C.eye, roughness: 0.25, detail: 0.004, bone: 'hand.R', textureDensity: 2 });
    const pupil = sdf.ellipsoid([0.021, 0.021, 0.012]).at(0, 0, 0.042);
    k.body('pupil', shieldPose(pupil), { color: C.pupil, roughness: 0.2, detail: 0.004, bone: 'hand.R', textureDensity: 2 });

    // ------------------------------------------------------------------ mist bank and violet wisps on the ground
    // Two layers of overlapping lumps (12 blobs), and a raised collar of two glowing blobs at the blade.
    const lumps: [number, number, number, number][] = [
      // x, z, r, center y (the lower layer, tops at about 0.13)
      [-0.28, 0.0, 0.07, 0.05],
      [-0.19, -0.07, 0.09, 0.06],
      [-0.18, 0.07, 0.08, 0.055],
      [-0.09, 0.02, 0.09, 0.06],
      [0.0, -0.07, 0.085, 0.055],
      [0.02, 0.08, 0.085, 0.055],
      [0.1, -0.02, 0.09, 0.06],
      [0.18, 0.07, 0.08, 0.055],
      [0.2, -0.07, 0.085, 0.06],
      [0.28, 0.0, 0.07, 0.05],
      // the upper layer
      [-0.14, 0.0, 0.065, 0.075],
      [0.14, 0.0, 0.065, 0.075],
    ];
    const mistBase = sdf
      .smoothUnion(0.03, ...lumps.map(([x, z, r, y]) => sdf.sphere(r).at(x, y, z)))
      .displace(0.008, (x, y, z) => noise.fbm(x * 26, y * 26, z * 26, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shade = (_x: number, y: number, _z: number, b: readonly [number, number, number]): [number, number, number] => {
      const m = 0.9 + 0.1 * Math.min(1, y / 0.1);
      return [b[0] * m, b[1] * m, b[2] * m];
    };
    k.body('mist-bank', mistBase.paintFn(shade), { color: C.mist, roughness: 0.95, opacity: 0.85, emissive: SLOT.glow, emissiveIntensity: 0.06, bone: 'mist' });
    // The collar: two lumps at the blade with a violet glow, top at y 0.165.
    const collar = sdf
      .smoothUnion(0.03, sdf.sphere(0.066).at(0.035, 0.1, 0.04), sdf.sphere(0.066).at(-0.035, 0.1, -0.04))
      .displace(0.006, (x, y, z) => noise.fbm(x * 26 + 4, y * 26, z * 26, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('mist-glow', collar.paintFn(shade), { color: C.mist, roughness: 0.95, opacity: 0.85, emissive: SLOT.glow, emissiveIntensity: 0.5, bone: 'mist' });

    // Three soft, flame-like wisps that rise beside the blade with a gentle S-bend, blended into a
    // glowing base so they read as rising glow.
    const wisp = (x: number, z: number, lean: number, h: number) =>
      sdf.chain(
        [
          [x, 0.1, z, 0.03],
          [x + lean, 0.1 + h * 0.35, z, 0.024],
          [x - lean * 0.6, 0.1 + h * 0.7, z, 0.015],
          [x + lean * 0.8, 0.1 + h, z, 0.008],
        ],
        0.012,
      );
    const wispBase = (x: number, z: number) => sdf.sphere(0.045).at(x, 0.095, z);
    const wispL = sdf.smoothUnion(0.04, wispBase(0.13, 0.03), wisp(0.13, 0.03, 0.03, 0.2), wispBase(-0.02, 0.085), wisp(-0.02, 0.085, -0.025, 0.15)).bone('wisp.L');
    const wispR = sdf.smoothUnion(0.04, wispBase(-0.13, 0.04), wisp(-0.13, 0.04, -0.03, 0.22)).bone('wisp.R');
    k.body('wisps', sdf.union(wispL, wispR), { color: SLOT.wisp, roughness: 0.6, opacity: 0.6, emissive: SLOT.wisp, emissiveIntensity: 1.2, detail: 0.005 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys } = motion;
    type Pose = Record<string, { move?: V3; rotate?: V3; scale?: V3 }>;
    const Z3: V3 = [0, 0, 0];
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const addV = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    // Flat on the ground: the chest turned 90 degrees (the point forward), lowered to the floor.
    const FLAT_Y = -(CHEST_Y - 0.035);
    const FLAT_Z = 0.12;

    // Idle: the sword bobs, the shield rocks, the mist breathes. The mist and wisps stay on the ground.
    const IDLE = 2.4;
    const idlePose = (p: number): Pose => ({
      chest: { move: [0, 0.02 * wave(p), 0], rotate: [2 * wave(p, 1, 0.25), 4 * wave(p, 1, 0.1), 2 * wave(p, 1, 0.4)] },
      'hand.R': { move: [0.006 * wave(p, 1, 0.5), 0.008 * wave(p, 1, 0.1), 0], rotate: [4 * wave(p, 1, 0.3), -8 * wave(p, 1, 0.55), -6 * wave(p, 1, 0.2)] },
      mist: { scale: [1 + 0.03 * wave(p, 1, 0.3), 1 + 0.06 * bump(p), 1 + 0.03 * wave(p, 1, 0.3)] },
      'wisp.L': { rotate: [6 * wave(p, 1, 0.1), 0, 8 * wave(p, 1, 0.35)] },
      'wisp.R': { rotate: [6 * wave(p, 1, 0.4), 0, -8 * wave(p, 1, 0.6)] },
    });
    k.animation('idle', { duration: IDLE, pose: (_t, p) => idlePose(p) });

    // Walk and run: the sword drifts with a stronger bob and a lean; the mist trails behind.
    const drift = (duration: number, bob: number, lean: number, trail: number, sway: number) => ({
      duration,
      pose: (_t: number, p: number): Pose => ({
        chest: { move: [0, bob * wave(p, 2, 0.25), 0.01 * wave(p, 2, 0.5)], rotate: [lean + 3 * wave(p, 2, 0.5), sway * wave(p), 4 * wave(p)] },
        'hand.R': { rotate: [8 * wave(p, 2, 0.1), 10 * wave(p, 1, 0.2), 8 * wave(p, 2, 0.4)] },
        mist: {
          move: [0.015 * wave(p), 0, -0.02 * wave(p, 2, 0.2)],
          rotate: [0, 10 * wave(p, 1, 0.3), 0],
          scale: [1 + 0.05 * wave(p, 2), 1 + 0.08 * bump(p, 2), 1 + 0.12 * bump(p, 2, 0.25)],
        },
        'wisp.L': { rotate: [-trail - 8 * wave(p, 2, 0.1), 0, 8 * wave(p, 2, 0.3)] },
        'wisp.R': { rotate: [-trail - 8 * wave(p, 2, 0.35), 0, -8 * wave(p, 2, 0.55)] },
      }),
    });
    k.animation('walk', drift(1.0, 0.03, 5, 22, 8));
    k.animation('run', drift(0.62, 0.04, 12, 38, 6));

    // Attack: a short pull back, then a thrust: the sword swings its point forward and down and
    // lunges, the shield keeps facing front, then both return.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0, 0.3, p) * (1 - ease(0.3, 0.42, p));
        const thrust = ease(0.3, 0.48, p) * (1 - ease(0.62, 1, p));
        return {
          chest: { move: [0, 0.02 * wind - 0.06 * thrust, -0.12 * wind + 0.32 * thrust], rotate: [25 * wind - 75 * thrust, 0, 0] },
          'upperarm.R': { rotate: [70 * thrust - 20 * wind, 0, 0] },
          mist: { scale: [1 + 0.1 * thrust, 1 + 0.15 * wind, 1 + 0.1 * thrust] },
          'wisp.L': { rotate: [-10 * wind - 30 * thrust, 0, 0] },
          'wisp.R': { rotate: [-10 * wind - 30 * thrust, 0, 0] },
        };
      },
    });

    // Hit: the blow jolts the sword back; the shield spins and the mist flinches.
    k.animation('hit', {
      duration: 0.42,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.15, 1], [0.4, 0.55], [1, 0]] as const);
        return {
          chest: { move: [0, 0.01 * r, -0.07 * r], rotate: [20 * r, 0, -8 * r] },
          'hand.R': { rotate: [10 * r, 20 * r, -14 * r] },
          mist: { scale: [1 + 0.15 * r, 1 - 0.12 * r, 1 + 0.15 * r] },
          'wisp.L': { rotate: [18 * r, 0, 25 * r] },
          'wisp.R': { rotate: [18 * r, 0, -25 * r] },
        };
      },
    });

    // Death: the sword shudders, rises a little, then drops point-forward and lies flat on the
    // ground with the shield beside it; the mist spreads and thins.
    k.animation('death', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const shudder = p > 0.06 && p < 0.3 ? wave((p - 0.06) / 0.24, 6) * Math.sin(((p - 0.06) / 0.24) * Math.PI) : 0;
        const rotX = keys(p, [[0, 0], [0.12, 6], [0.3, 4], [0.5, -95], [0.58, -87], [0.64, -91], [0.7, -90], [1, -90]] as const);
        const moveY = keys(p, [[0, 0], [0.12, 0.03], [0.3, 0.04], [0.5, FLAT_Y], [0.56, FLAT_Y + 0.02], [0.62, FLAT_Y], [1, FLAT_Y]] as const);
        const fall = ease(0.3, 0.55, p);
        const spread = ease(0.45, 0.8, p);
        return {
          chest: { move: [0.012 * shudder, moveY, FLAT_Z * fall], rotate: [rotX, 2 * shudder, 4 * shudder] },
          'upperarm.R': { move: [-0.05 * fall, 0, 0] },
          'hand.R': { rotate: [3 * shudder, 0, 0] },
          mist: { scale: [1 + 0.25 * spread, 1 - 0.3 * spread, 1 + 0.9 * spread] },
          'wisp.L': { rotate: [keys(p, [[0, 0], [0.5, 10], [0.8, -70], [1, -75]] as const), 0, 20 * spread] },
          'wisp.R': { rotate: [keys(p, [[0, 0], [0.5, 10], [0.8, -70], [1, -75]] as const), 0, -20 * spread] },
        };
      },
    });

    // Awaken: the sword and shield lie flat on the mist, tremble, then rise to the upright rest pose
    // (the last frame is the first frame of idle).
    const AWAKEN = 2.0;
    k.animation('awaken', {
      duration: AWAKEN,
      loop: false,
      pose: (t, p) => {
        const shake = p > 0.1 && p < 0.42 ? wave((p - 0.1) / 0.32, 7) * Math.sin(((p - 0.1) / 0.32) * Math.PI) : 0;
        // `f` is the share of the fall still to undo: 1 lying flat, 0 upright (a little overshoot).
        const f = keys(p, [[0, 1], [0.4, 1], [0.7, -0.05], [0.84, 0.03], [1, 0]] as const);
        const pose: Pose = {
          chest: { move: [0.008 * shake, FLAT_Y * f + 0.04 * bump(p, 1, 0.3) * ease(0.4, 0.6, p) * (1 - ease(0.7, 0.8, p)), FLAT_Z * f], rotate: [-90 * f, 3 * shake, 5 * shake] },
          'upperarm.R': { move: [-0.05 * Math.max(0, f), 0, 0] },
          mist: { scale: [1 + 0.25 * f + 0.02 * shake, 1 - 0.3 * f, 1 + 0.9 * f] },
          'wisp.L': { rotate: [-75 * f, 0, 20 * f] },
          'wisp.R': { rotate: [-75 * f, 0, -20 * f] },
        };
        // The idle drift fades in; at the last frame the pose is idle's first frame.
        const idle = idlePose((t - AWAKEN) / IDLE);
        const w = ease(0.75, 1, p);
        for (const [bone, v] of Object.entries(idle)) {
          const b = (pose[bone] ??= {});
          if (v.move) b.move = addV(b.move ?? Z3, v.move, w);
          if (v.rotate) b.rotate = addV(b.rotate ?? Z3, v.rotate, w);
          if (v.scale) b.scale = addV(b.scale ?? [1, 1, 1], addV(v.scale, [-1, -1, -1]), w);
        }
        return pose;
      },
    });
  },
});
