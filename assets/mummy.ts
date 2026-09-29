import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Mummy — Chibi Quest enemy (catalog `enemies/undead/mummy`), a P1 dungeon denizen of the Sunken
 * Vault, about 0.9 m tall, faces +Z. Target: docs/enemy-mockups/mummy_001.jpg (made with mmx; one
 * front view). Built on the zombie: the rogue's skeleton with knee bones and the zombie's clips.
 *
 * Role: a slow undead enemy, seen in 3D and as a 128 px sprite; the one glowing eye must read.
 * One idea: a small bundle of cream linen with a dark hole for a face and one glowing yellow eye.
 * Proportions: the zombie's (head center 0.675, shoulders 0.385, waist 0.25); the big wrapped
 *   head is almost half the height; stubby arms and thick, short legs with rolled cuffs.
 * Shape language: round and soft (cute), stepped bandage layers and loose frayed ends (spooky).
 * Palette (60/30/10): cream linen #e8dcc0 with darker wrap lines #c8b89a; the dark face; a faded
 *   blue-and-gold collar; the yellow eye #ffd23a as the accent.
 * Value plan: the glowing eye in the dark face hole is the strongest contrast (focal point); the
 *   collar under the chin is the second.
 * Bodies: wraps (everything in linen, one body), face, eye, collar.
 * Rig: the zombie's skeleton; clips: idle (a stiff sway), walk (a stiff shuffle with the arms
 *   straight out in front), run (a faster lurching shuffle), attack (a two-handed lunge-grab), hit
 *   (a late, floppy recoil), death (the knees give way and it crumples forward onto its face),
 *   rise (the spawn: it claws its way up through the floor and stands).
 */

const C = {
  wraps: '#e8dcc0',
  wrapMid: '#d8cbae',
  wrapLine: '#c8b89a',
  face: '#14110c',
  eye: '#ffd23a',
  eyeBase: '#3a2a05',
  gold: '#bf9f52',
  blue: '#4e7896',
  paleBlue: '#6f97ae',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.222, 0.208, 0.2] as const;
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const unit = (d: V3): V3 => {
  const l = Math.hypot(d[0], d[1], d[2]);
  return [d[0] / l, d[1] / l, d[2] / l];
};
const frac = (v: number) => v - Math.floor(v);

// Joints: the arms hang down (upper arm about 10 degrees off vertical, a slight bend at the
// elbow, the hands at the hips); the zombie's reaching pose lives only in the clips.
const SHOULDER: V3 = [0.165, 0.385, 0];
const ELBOW: V3 = [0.185, 0.282, 0.01];
const WRIST: V3 = [0.205, 0.19, 0.05];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)

/** A stubby wrapped mitt at the wrist `w` (no fingers, one thumb nub); `s` mirrors it. */
const mittAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.012,
    sdf.ellipsoid([0.034, 0.04, 0.033]).at(...o(0.002, -0.034, 0.02)),
    sdf.cone(o(0.024, -0.022, 0.022), o(0.038, -0.044, 0.046), 0.013, 0.01), // thumb
  );
};

/** A flat loose bandage end from `at` through the offsets `pts`, thin along Z, frayed into two tips. */
const ribbon = (at: V3, pts: V3[], w: number) => {
  const n = pts.length - 1;
  const strip = sdf.chain(
    pts.map((p, i) => [p[0], p[1], p[2], w * (1 - (0.3 * i) / n)] as [number, number, number, number]),
    0.006,
  );
  const tip = pts[n]!;
  const fork = sdf.union(
    sdf.cone(tip, [tip[0] + 0.009, tip[1] - 0.03, tip[2]], w * 0.45, w * 0.18),
    sdf.cone(tip, [tip[0] - 0.009, tip[1] - 0.022, tip[2]], w * 0.45, w * 0.18),
  );
  return sdf.union(strip, fork).scale([1, 1, 0.3]).at(...at);
};

export default defineAsset({
  name: 'mummy',
  description: 'Chibi mummy enemy: wrapped head to toe in cream linen, a dark face hole with one glowing yellow eye, loose bandage ends, and a faded blue-and-gold collar.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/mummy_001.jpg',
  // Color slots for individual mummies (the first option is the default look). The wraps slot
  // covers the linen and its wrap lines; the eyes slot is the glow and the eye's dark base.
  variants: {
    wraps: { cream: C.wraps, sand: '#dcc79c', grey: '#cbc8bd', tea: '#bfa27a' },
    eyes: { yellow: C.eye, green: '#8fe04a', red: '#ff5a3c' },
  },
  presets: {
    desert: { wraps: 'sand', eyes: 'yellow' },
    crypt: { wraps: 'grey', eyes: 'green' },
    cursed: { wraps: 'tea', eyes: 'red' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      wraps: k.tint('wraps'),
      wrapMid: k.tint('wraps', { color: C.wrapMid, follow: 1 }),
      wrapLine: k.tint('wraps', { color: C.wrapLine, follow: 1 }),
      eye: k.tint('eyes'),
      eyeBase: k.tint('eyes', { color: C.eyeBase, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
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

    // ------------------------------------------------------------------ the bandage pattern
    // Band coordinate: bands run across the direction `n`, `period` meters apart, a little wavy.
    type Band = (x: number, y: number, z: number) => number;
    const along = (n: V3, period: number, phase = 0): Band => {
      const [nx, ny, nz] = unit(n);
      return (x, y, z) => (x * nx + y * ny + z * nz + 0.006 * noise.noise3(x * 14, y * 14, z * 14)) / period + phase;
    };
    // Each band rises slowly across its width and drops at its lower edge, under the next layer:
    // the surface steps like overlapping linen. The drop is painted with the dark wrap line, the
    // strip just below it (in the overlap's shadow) and old stains with the middle shade.
    const wrapped = (shape: sdf.Shape, u: Band, amp = 0.006) => {
      const layered = amp > 0
        ? shape.displace(amp, (x, y, z) => {
            const s = frac(u(x, y, z));
            return 0.5 - (s < 0.8 ? s / 0.8 : (1 - s) / 0.2);
          }, 1 + amp / 0.006)
        : shape;
      return layered.paintFn((x, y, z, base) => {
        const s = frac(u(x, y, z));
        if (s > 0.84 || s < 0.03) return rgb(T.wrapLine);
        if (s < 0.14 || noise.fbm(x * 9 + 3, y * 9, z * 9, 2) > 0.4) return rgb(T.wrapMid);
        return base;
      });
    };
    // A raised strap of linen over `base`: a slab (placed by `place`) through the grown surface,
    // with dark lines along both edges.
    const strap = (base: sdf.Shape, lift: number, w: number, place: (s: sdf.Shape) => sdf.Shape) => {
      const slab = place(sdf.box([0.9, w, 0.9], 0.003));
      return base
        .round(lift)
        .intersect(slab)
        .paintFn((x, y, z, b) => (slab.dist(x, y, z) > -0.006 ? rgb(T.wrapLine) : b));
    };

    // ------------------------------------------------------------------ head: wrapped, with a dark face hole
    const headSolid = sdf.smoothUnion(0.05, sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0), sdf.ellipsoid([0.15, 0.075, 0.125]).at(0, 0.54, 0.02));
    // The crown wraps tilt one way and the lower wraps the other; the seam is one more overlap.
    const crownU = along([-0.35, 1, 0.3], 0.042, 0.5);
    const lowU = along([0.22, 1, -0.12], 0.04);
    const headU: Band = (x, y, z) => (y > HEAD_Y + 0.07 - 0.15 * x - 0.05 * z ? crownU(x, y, z) : lowU(x, y, z));
    const FACE_Y = 0.645;
    const oval = Array.from({ length: 20 }, (_, i) => [0.17 * Math.cos((i / 20) * 2 * Math.PI), 0.103 * Math.sin((i / 20) * 2 * Math.PI)] as [number, number]);
    const faceCut = sdf.extrude(profile.polygon(oval, { smooth: true }), 0.3, 0.02).at(0, FACE_Y, 0.27);
    const head = sdf
      .union(
        wrapped(headSolid, headU),
        strap(headSolid, 0.012, 0.042, (s) => s.rotateX(-10).rotateZ(-9).at(0, 0.745, 0)), // over the brow
        strap(headSolid, 0.014, 0.05, (s) => s.rotateX(12).rotateZ(6).at(0, 0.56, 0)), // under the face
      )
      .smoothSubtract(0.012, faceCut)
      .bone('head');
    const neck = wrapped(sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05), along([0, 1, 0], 0.03)).bone('neck');

    // The face: a dark dome just under the wraps, seen through the hole.
    const faceBody = sdf.ellipsoid([HEAD[0] - 0.01, HEAD[1] - 0.01, HEAD[2] - 0.01]).at(0, HEAD_Y, 0);
    k.body('face', faceBody.intersect(faceCut.round(0.01)).bone('head'), { color: C.face, roughness: 0.35 });
    const faceZ = (x: number, y: number) => sdf.raycast(faceBody, [x, y, 1], [0, 0, -1])![2];
    // ONE big eye, a little to the right (-X): a dark base, so the yellow glow keeps its hue.
    const EYE: V3 = [-0.042, FACE_Y + 0.004, faceZ(0.042, FACE_Y) - 0.014];
    k.body('eye', sdf.sphere(0.028).at(...EYE).bone('head'), {
      color: T.eyeBase,
      emissive: T.eye,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      textureDensity: 2,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ torso, hips, straps
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.122, 0.4],
            [0.124, 0.34],
            [0.118, 0.29],
            [0.124, 0.25],
            [0.128, 0.22],
            [0.124, 0.208],
            [0, 0.208],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const hips = sdf.ellipsoid([0.12, 0.06, 0.09]).at(0, 0.205, 0);
    // Loose chest wraps: bands of different widths, each tilted a little differently, overlapping.
    const straps = sdf.union(
      strap(torso, 0.009, 0.058, (s) => s.rotateX(-3).rotateZ(34).at(0, 0.352, 0)),
      strap(torso, 0.013, 0.04, (s) => s.rotateX(4).rotateZ(-29).at(0, 0.342, 0)), // lies over the first
      strap(torso, 0.016, 0.03, (s) => s.rotateX(-2).rotateZ(21).at(0, 0.372, 0)),
      strap(torso, 0.01, 0.052, (s) => s.rotateX(3).rotateZ(7).at(0, 0.258, 0)), // the waist
      strap(torso, 0.014, 0.032, (s) => s.rotateX(-3).rotateZ(-10).at(0, 0.297, 0)),
    );

    // ------------------------------------------------------------------ arms: stubby, a rolled cuff, mitts
    const arm = (s: 1 | -1) => {
      const side = s > 0 ? 'L' : 'R';
      const sh = s > 0 ? SHOULDER : mx(SHOULDER);
      const el = s > 0 ? ELBOW : mx(ELBOW);
      const wr = s > 0 ? WRIST : mx(WRIST);
      const axis = unit([wr[0] - sh[0], wr[1] - sh[1], wr[2] - sh[2]]);
      return sdf.union(
        wrapped(
          sdf.smoothUnion(0.018, sdf.cone(sh, el, 0.047, 0.042).bone(`upperarm.${side}`), sdf.cone(el, wr, 0.042, 0.038).bone(`forearm.${side}`)),
          along(axis, 0.03),
        ),
        wrapped(sdf.cone(lerp(el, wr, 0.3), lerp(el, wr, 0.95), 0.052, 0.049).bone(`forearm.${side}`), along(axis, 0.026, 0.3), 0.005),
        wrapped(mittAt(wr, s).bone(`hand.${side}`), along([axis[0], axis[1] - 0.6, axis[2]], 0.022), 0.004),
      );
    };

    // ------------------------------------------------------------------ legs: thick, a rolled cuff, wrapped feet
    const leg = sdf.union(
      wrapped(sdf.cone([HIP[0], 0.2, 0], [0.097, 0.085, 0.004], 0.056, 0.05), along([0.1, 1, 0.12], 0.03)),
      wrapped(sdf.cylinder(0.06, 0.032, 0.014).at(0.097, 0.08, 0.004), along([0.05, 1, 0.1], 0.024, 0.4), 0.005),
    );
    const foot = wrapped(
      sdf
        .smoothUnion(
          0.012,
          sdf.box([0.086, 0.05, 0.155], 0.022).at(0, 0.025, 0.025),
          ...[-0.028, -0.009, 0.01, 0.028].map((x, i) => sdf.sphere(0.018 - Math.abs(i - 1.5) * 0.002).at(x, 0.024, 0.095 - Math.abs(x) * 0.4)),
        )
        .rotateY(12)
        .at(ANKLE[0], 0, 0),
      along([0.2, 0.35, 1], 0.028),
      0.004,
    );

    // ------------------------------------------------------------------ loose bandage ends
    const ends = sdf.union(
      ribbon([0.245, 0.25, 0.03], [[0, 0, 0], [0.012, -0.075, 0.01], [0.02, -0.15, 0.02]], 0.02).bone('forearm.L'), // from the left arm
      ribbon([0.105, 0.24, 0.075], [[0, 0, 0], [0.004, -0.075, 0.012], [0.008, -0.15, 0.02]], 0.018).bone('leg.L'), // from the waist, down the left thigh
    );

    const wraps = sdf.union(
      sdf.smoothUnion(
        0.025,
        wrapped(torso, along([0.2, 1, 0.05], 0.042)).bone('spine'),
        wrapped(hips, along([0, 1, 0.08], 0.034, 0.2)).bone('hips'),
        neck,
        leg.bone('leg.L').mirror('x'),
      ),
      straps.bone('spine'),
      head,
      foot.bone('foot.L').mirror('x'),
      arm(1),
      arm(-1),
      wrapped(ends, along([0, 1, 0.2], 0.03), 0),
    );
    k.body('wraps', wraps, {
      color: T.wraps,
      detail: 0.0056,
      roughness: 0.92,
      textureDensity: 1.4,
      // A fine linen grain in the normal map.
      bump: (x, y, z) => 0.0005 * noise.noise3(x * 170, y * 170, z * 170),
    });

    // ------------------------------------------------------------------ collar: faded blue and gold
    // A small V of three layered flat strips at the front of the neck, and a seam at the back.
    const front = sdf.halfSpace([0, 0, -1], -0.02).intersect(sdf.box([0.6, 0.6, 0.6]).at(0, 0.45, 0.3));
    const back = sdf.halfSpace([0, 0, 1], -0.02).intersect(sdf.box([0.6, 0.6, 0.6]).at(0, 0.45, -0.3));
    const vStrip = (vy: number, w: number, lift: number, deg: number, pal: (d: number) => ReturnType<typeof rgb>) => {
      const half = (s: 1 | -1) => sdf.box([0.11, w, 0.9], 0.003).at(0.055 * s, 0, 0).rotateZ(deg * s).at(0, vy, 0);
      const slab = sdf.union(half(1), half(-1));
      return torso.round(lift).intersect(slab).intersect(front).paintFn((x, y, z) => pal(slab.dist(x, y, z)));
    };
    const edge = (inner: ReturnType<typeof rgb>, rim: ReturnType<typeof rgb>) => (d: number) => (d > -0.006 ? rim : inner);
    const collar = sdf.union(
      vStrip(0.398, 0.024, 0.009, 32, edge(rgb(C.blue), rgb(C.gold))),
      vStrip(0.42, 0.024, 0.013, 32, edge(rgb(C.gold), rgb(C.blue))),
      vStrip(0.442, 0.022, 0.017, 32, edge(rgb(C.paleBlue), rgb(C.gold))),
      torso
        .round(0.012)
        .intersect(sdf.box([0.6, 0.026, 0.9], 0.003).rotateZ(4).at(0, 0.432, 0))
        .intersect(back)
        .paintFn((x, y, z) => (Math.abs(y - 0.432 - 0.07 * x) > 0.008 ? rgb(C.gold) : rgb(C.blue))),
    );
    k.body('collar', collar.bone('spine'), { color: C.gold, roughness: 0.5, metalness: 0.2, textureDensity: 1.5 });

    // ------------------------------------------------------------------ animation
    const { wave, bump } = motion;

    k.animation('idle', {
      duration: 3.0,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0], rotate: [0, 0, 3 * wave(p)] },
        spine: { rotate: [4, 0, -2 * wave(p)] },
        chest: { rotate: [2 * wave(p, 1, 0.2), 0, 0] },
        // The head lolls to one side and back.
        head: { rotate: [3 + 2 * wave(p, 1, 0.3), 4 * wave(p, 1, 0.1), 5 * wave(p, 1, 0.25)] },
        'upperarm.L': { rotate: [-3 + 2 * wave(p, 1, 0.15), 0, 2 + 1.5 * wave(p, 1, 0.4)] },
        'upperarm.R': { rotate: [-3 + 2 * wave(p, 1, 0.35), 0, -2 - 1.5 * wave(p, 1, 0.1)] },
        'forearm.L': { rotate: [-6 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-6 * bump(p, 1, 0.5), 0, 0] },
      }),
    });

    // A stiff shuffle (the zombie's shamble, retimed): both feet slide forward flat and low (two
    // gait calls with short strides, almost no lift, and no heel roll; `drag` pitches the right
    // foot toe down, 0 keeps it flat), the arms stay straight out in front, the head barely moves. The hips heave up on the side of the swing leg (the left at p = 0.06, the right at
    // 0.56) to haul it forward; both gait calls get this turn, so the planted feet do not slide.
    // Both calls share the phase, duty, sit, and bob, so their hips heights are the same.
    // Sole points measured on the sandal SDF at y = 0 (left foot).
    const SOLE_HEEL: V3 = [0.1225, 0, -0.056];
    const SOLE_TOE: V3 = [0.085, 0, 0.1145];
    const LEGS = { hip: HIP, knee: KNEE, ankle: ANKLE };
    const SHAMBLE_HIPS: V3 = [0, 0.2, 0];
    interface Shamble {
      strideL: number; liftL: number; rollL: number; strideR: number; liftR: number; drag: number; reach: number; turn: number;
      duty: number; sit: number; bob: number; lean: number; lurch: number;
    }
    const shamble = (duration: number, o: Shamble) => {
      const t = (o.drag * Math.PI) / 180;
      const low = (q: V3) => (q[1] - ANKLE[1]) * Math.cos(t) - (q[2] - ANKLE[2]) * Math.sin(t);
      const raise = -Math.min(low(SOLE_HEEL), low(SOLE_TOE)) - ANKLE[1];
      const dragHeel: V3 = [SOLE_HEEL[0], -raise, SOLE_HEEL[2]];
      const dragToe: V3 = [SOLE_TOE[0], -raise, SOLE_TOE[2]];
      return {
        duration,
        pose: (_t: number, p: number) => {
          const s = wave(p);
          const heave = wave(p, 1, 0.19); // +1 at p = 0.06 (left hip up), -1 at 0.56 (right hip up)
          const hipsTurn: V3 = [0, o.turn * s, o.lurch * heave];
          const shared = { duty: o.duty, sit: o.sit, bob: o.bob, hips: { at: SHAMBLE_HIPS, rotate: hipsTurn } };
          const step = motion.gait(p - 0.25, LEGS, { ...shared, stride: o.strideL, lift: o.liftL, roll: o.rollL, heel: SOLE_HEEL, toe: SOLE_TOE });
          const dragged = motion.gait(p - 0.25, LEGS, { ...shared, stride: o.strideR, lift: o.liftR, roll: 0, heel: dragHeel, toe: dragToe });
          const legR = dragged.pose['leg.R']!.rotate;
          const shinR = dragged.pose['shin.R']!.rotate;
          const footR = motion.orient([hipsTurn, legR, shinR], { dir: [0, 0, 1], up: [0, 1, 0] }, { dir: [0, -Math.sin(t), Math.cos(t)], up: [0, Math.cos(t), Math.sin(t)] });
          return {
            'leg.L': step.pose['leg.L']!,
            'shin.L': step.pose['shin.L']!,
            'foot.L': step.pose['foot.L']!,
            'leg.R': { rotate: legR },
            'shin.R': { rotate: shinR },
            'foot.R': { rotate: footR }, // dragged: the toe stays down on the floor
            hips: { move: [0, Math.min(step.hipsY, dragged.hipsY), 0] as const, rotate: hipsTurn },
            spine: { rotate: [o.lean, 0, -o.lurch * 0.6 * heave] as const },
            chest: { rotate: [wave(p, 2, 0.1), -0.7 * o.turn * s, 0] as const },
            head: { rotate: [-o.lean * 0.5 + 2 * wave(p, 2, 0.3), 3 * s, 4 * wave(p, 1, 0.25)] as const },
            // Both arms stay straight out in front, bobbing a little out of step with each other.
            'upperarm.L': { rotate: [-o.reach + 2 * wave(p, 2, 0.2), 0, 4 + 2 * s] as const },
            'upperarm.R': { rotate: [-o.reach + 2 * wave(p, 2, 0.45), 0, -4 + 2 * s] as const },
            'forearm.L': { rotate: [-4 - 2 * wave(p, 2, 0.3), 0, 0] as const },
            'forearm.R': { rotate: [-4 - 2 * wave(p, 2, 0.55), 0, 0] as const },
          };
        },
      };
    };
    k.animation('walk', shamble(1.2, { strideL: 0.07, liftL: 0.012, rollL: 0, strideR: 0.07, liftR: 0.01, drag: 0, duty: 0.62, sit: 0.004, bob: 0.004, lean: 4, lurch: 4, reach: 80, turn: 5 }));
    k.animation('run', shamble(0.75, { strideL: 0.1, liftL: 0.024, rollL: 4, strideR: 0.1, liftR: 0.02, drag: 0, duty: 0.55, sit: 0.01, bob: 0.007, lean: 12, lurch: 6, reach: 84, turn: 7 }));

    // ------------------------------------------------------------------ attack: a lunging two-hand grab
    // Wind-up: a slow, heavy sway back; the arms rise up and out at full length, the claws open
    // forward, and the head lolls back. Lunge: the left foot lurches 0.19 m forward, the hips drop,
    // and the body falls forward; both arms reach out full length at a target in front, then close
    // in. Grab: the hands clutch the target's shoulders and hold with a shake, pulling it in.
    // Recovery: a clumsy step back to rest. Solved by targets: the stiff legs (no knee) point at
    // ankle targets, and the hips take the height that the loaded feet allow, so a planted foot
    // never slides or sinks; a swinging leg that is too long for its target swings out to the side.
    // The wrists follow world targets, converted into the chest's rest frame for `reach`.
    {
      const { keys, reach, orient, quat, euler, follow } = motion;
      const HIPS_AT: V3 = [0, 0.2, 0];
      const SPINE_AT: V3 = [0, 0.26, 0];
      const CHEST_AT: V3 = [0, 0.33, 0];
      const LEG_LEN = Math.hypot(ANKLE[0] - HIP[0], ANKLE[1] - HIP[1]);
      const STEP = 0.19; // the left ankle's lunge, meters forward
      const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
      const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
      // The left hand's rest frame: the middle finger's direction from the wrist, and the back of the hand.
      const HAND_DIR: V3 = [-0.1, -0.8, 0.6];
      const HAND_UP: V3 = [0, 0.6, 0.8];
      const vec = (p: V3) => new THREE.Vector3(p[0], p[1], p[2]);
      const arr = (p: THREE.Vector3): V3 => [p.x, p.y, p.z];
      const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
      // Left-arm paths in world meters (the right arm mirrors them, a beat late).
      const wristPath = [
        [0, WRIST],
        [0.12, [0.33, 0.42, 0.02]],
        [0.3, [0.42, 0.8, -0.08]], // up and out, past full reach: the arm is straight
        [0.39, [0.36, 0.8, 0.2]],
        [0.46, [0.3, 0.62, 0.55]], // the long reach, wide and past full length: the arms are straight
        [0.52, [0.28, 0.6, 0.56]],
        [0.58, [0.12, 0.44, 0.34]], // closed in: the clutch at the target's shoulders
        [0.72, [0.12, 0.44, 0.32]],
        [0.86, [0.24, 0.31, 0.2]],
        [1, WRIST],
      ] as const;
      const polePath = [
        [0, ELBOW],
        [0.3, [0.45, 0.4, -0.12]], // the elbows out and back
        [0.46, [0.36, 0.26, 0.16]],
        [0.58, [0.4, 0.2, 0.12]],
        [0.72, [0.4, 0.2, 0.12]],
        [1, ELBOW],
      ] as const;
      const dirPath = [
        [0, HAND_DIR],
        [0.3, [0.35, 0.9, 0.05]], // claws up, palms forward
        [0.46, [-0.05, 0.25, 1]], // fingers straight out at the target
        [0.52, [-0.1, 0.2, 1]],
        [0.58, [-0.35, -0.45, 0.8]], // curled in and down: the clutch
        [0.72, [-0.35, -0.5, 0.78]],
        [0.86, [0, -0.7, 0.6]],
        [1, HAND_DIR],
      ] as const;
      const upPath = [
        [0, HAND_UP],
        [0.3, [0.1, 0.05, -1]],
        [0.46, [0.15, 1, -0.2]],
        [0.52, [0.15, 1, -0.2]],
        [0.58, [0.2, 0.85, 0.45]],
        [0.72, [0.2, 0.85, 0.45]],
        [0.86, [0, 0.65, 0.75]],
        [1, HAND_UP],
      ] as const;
      k.animation('attack', {
        duration: 1.1,
        loop: false,
        pose: (_t, p) => {
          // The hold (0.58 to 0.72, 0.15 s): a shake and two tugs that pull the target in.
          const hold = clamp01((p - 0.58) / 0.14);
          const env = Math.sin(Math.PI * hold);
          const shake = wave(hold, 2) * env;
          const tug = bump(hold, 2) * env;
          const shrug = 0.03 * keys(p, [[0, 0], [0.3, 1], [0.44, 0]] as const);

          // ---- trunk
          const hipsR: V3 = [
            keys(p, [[0, 0], [0.3, -4], [0.5, 8], [0.72, 7], [0.9, 1], [1, 0]] as const),
            keys(p, [[0, 0], [0.3, 4], [0.48, -8], [0.72, -8], [0.92, -1], [1, 0]] as const),
            // The hips roll up on the side of the swinging leg, so the foot clears the ground.
            keys(p, [[0, 0], [0.31, 0], [0.38, 5], [0.48, 0], [0.74, 0], [0.82, 5], [0.95, 0], [1, 0]] as const),
          ];
          const spineR: V3 = [keys(p, [[0, 0], [0.3, -8], [0.5, 13], [0.58, 10], [0.72, 10], [0.9, 2], [1, 0]] as const) - 3 * tug, 0, -0.7 * hipsR[2]];
          const chestR: V3 = [
            keys(p, [[0, 0], [0.3, -8], [0.5, 7], [0.72, 6], [1, 0]] as const) - 3 * tug,
            keys(p, [[0, 0], [0.3, -4], [0.48, 7], [0.72, 7], [1, 0]] as const) + 3 * shake,
            -0.4 * hipsR[2],
          ];
          const hipsZ = keys(p, [[0, 0], [0.3, -0.035], [0.48, STEP / 2], [0.72, STEP / 2], [0.95, 0], [1, 0]] as const);

          // ---- legs: the right foot stays planted; the left steps out and back
          const lift = keys(p, [[0, 0], [0.32, 0], [0.39, 0.035], [0.44, 0.028], [0.48, 0], [0.74, 0], [0.8, 0.03], [0.88, 0.024], [0.94, 0]] as const);
          const zL = keys(p, [[0, 0], [0.33, 0], [0.475, STEP], [0.74, STEP], [0.93, 0]] as const);
          const loadL = keys(p, [[0, 1], [0.31, 1], [0.35, 0], [0.47, 0], [0.49, 1], [0.72, 1], [0.76, 0], [0.93, 0], [0.96, 1]] as const);
          const hipsQ = quat(hipsR);
          const hipJoint = (s: 1 | -1) => vec([s * HIP[0], HIP[1], HIP[2]]).sub(vec(HIPS_AT)).applyQuaternion(hipsQ).add(vec(HIPS_AT)).add(vec([0, 0, hipsZ]));
          // The hips' move y at which a stiff leg from hip joint `h` just reaches the ankle target `a` ([y, z]).
          const need = (h: THREE.Vector3, s: 1 | -1, a: readonly [number, number]) => {
            const dx = s * ANKLE[0] - h.x;
            const dz = a[1] - h.z;
            return a[0] - h.y + Math.sqrt(Math.max(0, LEG_LEN ** 2 - dx * dx - dz * dz));
          };
          const aL = [ANKLE[1] + lift, zL] as const;
          const aR = [ANKLE[1], 0] as const;
          const hL = hipJoint(1);
          const hR = hipJoint(-1);
          const nR = need(hR, -1, aR);
          const hipsY = nR + loadL * Math.max(0, need(hL, 1, aL) - nR);
          hL.y += hipsY;
          hR.y += hipsY;
          // Leg and foot rotations that point the leg at its ankle target and keep the sole flat.
          const legTo = (h: THREE.Vector3, s: 1 | -1, a: readonly [number, number]) => {
            const dy = h.y - a[0];
            const dz = a[1] - h.z;
            const x = s * Math.max(ANKLE[0], s * h.x + Math.sqrt(Math.max(0, LEG_LEN ** 2 - dy * dy - dz * dz)));
            const rest = vec([s * (ANKLE[0] - HIP[0]), ANKLE[1] - HIP[1], 0]).normalize();
            const world = new THREE.Quaternion().setFromUnitVectors(rest, vec([x, a[0], a[1]]).sub(h).normalize());
            return { leg: euler(hipsQ.clone().invert().multiply(world)), foot: euler(world.clone().invert()) };
          };
          const legL = legTo(hL, 1, aL);
          const legR = legTo(hR, -1, aR);

          // ---- arms: world wrist targets in the chest's rest frame
          const hipsMove: V3 = [0, hipsY, hipsZ];
          const chestAt = vec(follow([HIPS_AT, SPINE_AT], [hipsR, spineR], CHEST_AT)).add(vec(hipsMove));
          const inv = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).invert();
          const toChest = (w: V3): V3 => arr(vec(w).sub(chestAt).applyQuaternion(inv).add(vec(CHEST_AT)));
          const dirToChest = (d: V3): V3 => arr(vec(d).applyQuaternion(inv));
          const lift3 = (w: V3): V3 => [w[0], w[1] - shrug, w[2]];
          const arm = (s: 1 | -1, q: number) => {
            const m = (w: V3): V3 => (s > 0 ? w : mx(w));
            const pull: V3 = [0, 0.008 * shake, -0.02 * tug];
            const w = keys(q, wristPath, 'spline');
            const wrist = toChest(m([w[0], w[1] + pull[1], w[2] + pull[2]]));
            const pole = m(keys(q, polePath));
            const ik = reach(s > 0 ? ARM_L : ARM_R, lift3(wrist), lift3(pole));
            const hand = orient(
              [ik.upper, ik.lower],
              { dir: m(HAND_DIR), up: m(HAND_UP) },
              { dir: dirToChest(m(keys(q, dirPath))), up: dirToChest(m(keys(q, upPath))) },
            );
            return { upper: ik.upper, lower: ik.lower, hand };
          };
          const L = arm(1, p);
          const R = arm(-1, p - 0.025 * Math.sin(Math.PI * p)); // the right arm lags a beat

          return {
            hips: { move: hipsMove, rotate: hipsR },
            spine: { rotate: spineR },
            chest: { rotate: chestR },
            // The head lolls back and to the side in the wind-up, looks up at the target in the lunge, and shakes in the hold.
            neck: { rotate: [keys(p, [[0, 0], [0.3, -8], [0.5, -8], [0.72, -7], [1, 0]] as const), 0, 0] },
            head: {
              rotate: [
                keys(p, [[0, 0], [0.06, 0], [0.32, -16], [0.42, -6], [0.5, -14], [0.72, -12], [0.88, 3], [1, 0]] as const) - 4 * tug,
                5 * shake,
                keys(p, [[0, 0], [0.32, 10], [0.46, -4], [0.72, -4], [1, 0]] as const),
              ],
            },
            'upperarm.L': { move: [0, shrug, 0], rotate: L.upper },
            'forearm.L': { rotate: L.lower },
            'hand.L': { rotate: L.hand },
            'upperarm.R': { move: [0, shrug, 0], rotate: R.upper },
            'forearm.R': { rotate: R.lower },
            'hand.R': { rotate: R.hand },
            'leg.L': { rotate: legL.leg },
            'foot.L': { rotate: legL.foot },
            'leg.R': { rotate: legR.leg },
            'foot.R': { rotate: legR.foot },
          };
        },
      });
    }

    // ------------------------------------------------------------------ hit: a late, floppy recoil
    // The chest rocks back first. The head follows late, lolls far back, flops forward past the
    // stance, and sways back. The arms fling up loosely a beat behind the chest and drop again.
    // The hips give way backward over planted feet (`SHIN` keeps the ankles on their rest spot).
    const { keys } = motion;
    const DEG = Math.PI / 180;
    const SHIN = 0.125; // hip joint to ankle joint
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    /** The leg angle (degrees, + = the hips in front of the ankle) for the hips `dz` meters ahead of it. */
    const legFor = (dz: number) => Math.asin(Math.max(-1, Math.min(1, dz / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.75], [0.6, -0.2], [0.82, 0.06], [1, 0]] as const);
        const loll = keys(p, [[0, 0], [0.07, 0], [0.3, 1], [0.48, 0.3], [0.66, -0.45], [0.85, 0.14], [1, 0]] as const);
        const flop = keys(p, [[0, 0], [0.1, 0], [0.3, 1], [0.52, -0.35], [0.72, 0.14], [0.9, -0.04], [1, 0]] as const);
        const roll = keys(p, [[0, 0], [0.12, 0], [0.34, 1], [0.58, -0.5], [0.8, 0.18], [1, 0]] as const);
        const leg = legFor(-0.022 * h);
        return {
          hips: { move: [0, -SHIN * (1 - Math.cos(leg * DEG)), -0.022 * h], rotate: [0, 4 * roll, 3 * roll] },
          spine: { rotate: [4 - 7 * h, 0, -4 * roll] },
          chest: { rotate: [-12 * h, 5 * h, 2 * roll] },
          neck: { rotate: [-10 * loll, 0, 0] },
          head: { rotate: [-24 * loll, 8 * roll, 14 * roll] },
          'upperarm.L': { rotate: [-30 * flop, 0, 16 * flop] },
          'upperarm.R': { rotate: [-24 * flop, 0, -19 * flop] },
          'forearm.L': { rotate: [-22 * flop, 0, 0] },
          'forearm.R': { rotate: [-16 * flop, 0, 0] },
          'hand.L': { rotate: [18 * flop, 0, 0] },
          'hand.R': { rotate: [14 * flop, 0, 0] },
          'leg.L': { rotate: [leg, 0, -3 * roll] },
          'leg.R': { rotate: [leg, 0, -3 * roll] },
          'foot.L': { rotate: [-leg, 0, 0] },
          'foot.R': { rotate: [-leg, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: the knees give way, a forward crumple
    // The blow lolls the head back and the mummy sways. Then the knees give way: the legs fold back
    // as the hips sink forward over the planted feet, and the trunk slumps. Then it topples forward,
    // faster and faster, onto its face; the legs lie flat behind it, soles up. The arms trail in the
    // fall, then flop onto the ground beside the head. At last the head rolls onto its cheek.
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.45], [0.3, 0]] as const);
        const loll = keys(p, [[0, 0], [0.04, 0], [0.15, 1], [0.26, 0.25], [0.34, -0.25], [0.42, 0]] as const);
        const sway = keys(p, [[0.06, 0], [0.18, 1], [0.3, -0.6], [0.42, 0]] as const);
        const buckle = keys(p, [[0.24, 0], [0.46, 1]] as const); // the knees give way
        const u = clamp01((p - 0.42) / 0.22);
        const topple = u * u; // the fall speeds up to the impact at 0.64
        const bounce = keys(p, [[0.64, 0], [0.69, 1], [0.76, 0]] as const);
        const trail = keys(p, [[0.44, 0], [0.6, 1], [0.66, 0]] as const); // the arms lag in the fall
        const land = keys(p, [[0.6, 0], [0.7, 1]] as const); // the arms flop onto the ground
        const whip = keys(p, [[0.46, 0], [0.6, 1], [0.68, -0.4], [0.76, 0]] as const);
        const roll = keys(p, [[0.72, 0], [0.9, 1]] as const); // the head rolls onto its cheek
        // The legs fold back over the planted ankles; the hips follow the hip joint's arc.
        const leg = legFor(-0.02 * hitB) + 45 * buckle + 45 * topple;
        const ankleY = 0.07 - 0.02 * topple;
        const hipsY = ankleY + SHIN * Math.cos(leg * DEG) + 0.005 + 0.012 * bounce;
        const hipsTilt = 16 * buckle + 44 * topple - 3 * bounce;
        const trunk = hipsTilt + 4 + 8 * buckle; // hips + spine + chest, for the limp arms
        return {
          hips: { move: [0, hipsY - 0.2, SHIN * Math.sin(leg * DEG)], rotate: [hipsTilt, 6 * buckle, 4 * sway] },
          spine: { rotate: [4 - 6 * hitB + 4 * buckle, 0, -4 * sway] },
          chest: { rotate: [-10 * hitB + 4 * buckle - 6 * whip, 4 * hitB, 3 * sway] },
          neck: { rotate: [-10 * loll - 8 * topple * (1 - land) - 6 * roll, 0, 0] },
          head: {
            rotate: [-24 * loll + 10 * buckle - 20 * topple * (1 - land) + 14 * whip - 12 * roll, 10 * sway + 62 * roll, 12 * sway + 14 * roll],
          },
          // Limp arms: they hang as the trunk slumps, trail up in the fall, and slap down out wide.
          'upperarm.L': { rotate: [-24 * hitB - 0.8 * trunk * (1 - land) + 70 * trail - 6 * land, 0, 20 * hitB + 36 * land] },
          'upperarm.R': { rotate: [-20 * hitB - 0.8 * trunk * (1 - land) + 60 * trail - 10 * land, 0, -18 * hitB - 30 * land] },
          'forearm.L': { rotate: [-14 * hitB - 10 * buckle + 10 * land, 0, 12 * land] },
          'forearm.R': { rotate: [-10 * hitB - 16 * buckle + 16 * land, 0, -8 * land] },
          'hand.L': { rotate: [10 * hitB + 20 * buckle - 10 * land, 0, 0] },
          'hand.R': { rotate: [10 * hitB + 24 * buckle - 16 * land, 0, 0] },
          'leg.L': { rotate: [leg - hipsTilt, 0, 4 * buckle - 4 * sway] },
          'leg.R': { rotate: [leg - hipsTilt, -8 * buckle, -6 * buckle - 4 * sway] },
          'foot.L': { rotate: [150 * topple - leg, 0, 0] }, // flat on the ground, then soles up
          'foot.R': { rotate: [140 * topple - leg, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ rise: it claws its way up out of a grave
    // The spawn clip. In the game the floor hides everything below y = 0, so this clip keeps the
    // body under the floor (`ground: false`, `dig: 1.0`). At the start the mummy is bent forward
    // in the grave, the hips about 0.5 m down: the short chibi arms cannot reach the floor from
    // deeper. Only the left hand breaks the surface. It bursts up and claws the air; the right hand
    // follows. Both hands slam down flat on the floor beside the hole and push, and the body comes
    // up in three jerks: the head and shoulders break through, lolling; the arms lock straight; the
    // hands let go and the mummy stands, its feet on the floor. Then a shudder and a groan (the
    // head rolls back and the chest lifts), and it settles into the rest pose. The wrists follow
    // world targets, converted into the chest's rest frame for `reach`, so the planted hands stay
    // flat on the floor while the body rises past them.
    {
      const { reach, orient, quat, follow } = motion;
      const HIPS_AT: V3 = [0, 0.2, 0];
      const SPINE_AT: V3 = [0, 0.26, 0];
      const CHEST_AT: V3 = [0, 0.33, 0];
      const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
      const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
      // The left hand's rest frame: the middle finger's direction from the wrist, and the back of the hand.
      const HAND_DIR: V3 = [-0.1, -0.8, 0.6];
      const HAND_UP: V3 = [0, 0.6, 0.8];
      const FLAT_Y = 0.041; // the wrist's height when the hand lies flat on the floor
      const PLANT: V3 = [0.25, FLAT_Y, 0.1]; // where the left hand pushes on the floor
      const vec = (p: V3) => new THREE.Vector3(p[0], p[1], p[2]);
      const arr = (p: THREE.Vector3): V3 => [p.x, p.y, p.z];
      const unit = (d: V3): V3 => arr(vec(d).normalize());
      /** A weighted sum of points or directions. */
      const blend = (...parts: (readonly [V3, number])[]): V3 =>
        parts.reduce<V3>((s, [v, w]) => [s[0] + v[0] * w, s[1] + v[1] * w, s[2] + v[2] * w], [0, 0, 0]);
      k.animation('rise', {
        duration: 2.0,
        loop: false,
        ground: false,
        dig: 1.0,
        pose: (t, p) => {
          // ---- the trunk: three jerky heaves (a fast pull up, then a stall or a sag back)
          const hy = keys(p, [[0, -0.5], [0.07, -0.45], [0.2, -0.43], [0.27, -0.39], [0.31, -0.39], [0.37, -0.27], [0.41, -0.29], [0.44, -0.29], [0.5, -0.17], [0.58, -0.18], [0.61, -0.18], [0.7, 0]] as const);
          const hz = keys(p, [[0, -0.16], [0.31, -0.14], [0.37, -0.1], [0.5, -0.06], [0.61, -0.06], [0.7, 0]] as const);
          const lean = keys(p, [[0, 85], [0.27, 82], [0.31, 82], [0.37, 64], [0.44, 63], [0.5, 40], [0.61, 38], [0.7, 4], [0.76, 0]] as const);
          // The strain in the push, the shudder after the stand, and the groan.
          const strain = keys(p, [[0.47, 0], [0.52, 1], [0.58, 1], [0.62, 0]] as const) * Math.sin(2 * Math.PI * 11 * t);
          const shud = keys(p, [[0.68, 0], [0.72, 1], [0.8, 0.5], [0.88, 0]] as const) * Math.sin(2 * Math.PI * 7 * t);
          const groan = keys(p, [[0.74, 0], [0.82, 1], [0.9, 1], [1, 0]] as const);
          // The head hangs in the grave, then lolls from side to side at each heave.
          const loll = keys(p, [[0, 0], [0.31, 0], [0.37, 1], [0.44, -0.7], [0.5, 0.8], [0.58, -0.4], [0.66, 0.5], [0.74, 0]] as const);
          const nod = keys(p, [[0, 1], [0.31, 1], [0.37, -0.6], [0.44, 0.5], [0.5, -0.5], [0.58, 0.3], [0.66, -0.3], [0.74, 0]] as const);

          const hipsR: V3 = [0.5 * lean, 2 * shud, 3 * shud];
          const spineR: V3 = [0.3 * lean + 2 * strain, 0, -2 * shud];
          const chestR: V3 = [0.2 * lean - 10 * groan, 3 * strain, 4 * shud];
          const hipsMove: V3 = [0, hy, hz];

          // ---- arms: world wrist targets in the chest's rest frame
          const chestAt = vec(follow([HIPS_AT, SPINE_AT], [hipsR, spineR], CHEST_AT)).add(vec(hipsMove));
          const chestQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR));
          const inv = chestQ.clone().invert();
          const toChest = (w: V3): V3 => arr(vec(w).sub(chestAt).applyQuaternion(inv).add(vec(CHEST_AT)));
          const fromChest = (c: V3): V3 => arr(vec(c).sub(vec(CHEST_AT)).applyQuaternion(chestQ).add(chestAt));
          const dirToChest = (d: V3): V3 => arr(vec(unit(d)).applyQuaternion(inv));
          const arm = (s: 1 | -1) => {
            const m = (w: V3): V3 => (s > 0 ? w : mx(w));
            const shoulder = fromChest(m(SHOULDER));
            // Three modes, blended: an arm straight up out of the ground, a hand flat on the floor,
            // and a free arm in the chest's frame (buried, then after the stand).
            const up = s > 0 ? keys(p, [[0, 1], [0.22, 1], [0.29, 0]] as const) : keys(p, [[0.09, 0], [0.16, 1], [0.23, 1], [0.3, 0]] as const);
            const flat = s > 0 ? keys(p, [[0.22, 0], [0.29, 1], [0.57, 1], [0.63, 0]] as const) : keys(p, [[0.23, 0], [0.3, 1], [0.58, 1], [0.64, 0]] as const);
            const free = 1 - up - flat;
            // The raised arm: bent at the start, it bursts up straight and claws the air.
            const claw = s > 0 ? bump(clamp01((p - 0.05) / 0.18), 3) : bump(clamp01((p - 0.15) / 0.08), 2);
            const len = s > 0 ? keys(p, [[0, 0.17], [0.05, 0.5]] as const) : 0.5;
            const upW = blend([shoulder, 1], [[s * (0.08 + 0.03 * wave(p, 3)), 1, 0.08], len]);
            const upDir = blend([[s * 0.1, 1, 0.15], 1 - claw], [[s * 0.1, 0.3, 1], claw]);
            const upBack = blend([[0, 0.15, -1], 1 - claw], [[0, 1, -0.3], claw]);
            // The planted hand: flat, the fingers out and forward, the claw tips down on the floor.
            // At the release the hand lifts straight up first, so the claw tips never scrape into the floor.
            const lift = s > 0 ? keys(p, [[0.56, 0], [0.6, 0.1]] as const) : keys(p, [[0.57, 0], [0.61, 0.1]] as const);
            const flatW = m([PLANT[0], PLANT[1] + lift, PLANT[2] + 0.003 * strain]);
            // The free arm: rest, spread out and up a little in the groan, trembling in the shudder.
            // Right after the release the hands stay up at the chest while the legs come out of the hole.
            const held = keys(p, [[0.5, 0], [0.55, 1], [0.66, 1], [0.74, 0]] as const);
            const freeW = m(blend([WRIST, 1 - 0.8 * groan], [[0.34, 0.36, 0.1], 0.8 * groan], [[0.012 * shud + 0.02 * held, 0.01 * shud + 0.12 * held, 0.02 * held], 1]));
            const target = blend([toChest(upW), up], [toChest(flatW), flat], [freeW, free]);
            const pole = blend(
              [toChest(blend([shoulder, 1], [[s * 0.3, -0.05, -0.2], 1])), up],
              [toChest(blend([shoulder, 1], [[s * 0.45, 0.08, -0.15], 1])), flat],
              [m([0.3, 0.33, 0.06]), free],
            );
            const ik = reach(s > 0 ? ARM_L : ARM_R, target, pole);
            const dir = blend([dirToChest(upDir), up], [dirToChest([s * 0.3, -0.22, 0.93]), flat], [unit(m(HAND_DIR)), free]);
            const back = blend([dirToChest(upBack), up], [dirToChest([0, 1, 0.24]), flat], [unit(m(HAND_UP)), free]);
            const hand = orient([ik.upper, ik.lower], { dir: m(HAND_DIR), up: m(HAND_UP) }, { dir, up: back });
            return { upper: ik.upper, lower: ik.lower, hand };
          };
          const L = arm(1);
          const R = arm(-1);

          // ---- legs: they hang straight down under the leaning hips and kick in the heaves; the
          // left leg steps up out of the hole in the last heave.
          const kick = keys(p, [[0.3, 0], [0.36, 1], [0.58, 1], [0.64, 0]] as const) * wave(p, 5);
          const step = keys(p, [[0.6, 0], [0.65, 1], [0.7, 0]] as const);
          const legX = -hipsR[0];
          return {
            hips: { move: hipsMove, rotate: hipsR },
            spine: { rotate: spineR },
            chest: { rotate: chestR },
            neck: { rotate: [10 * nod - 8 * groan, 0, 4 * loll] },
            head: { rotate: [14 * nod - 16 * groan + 3 * strain, 8 * loll + 10 * groan, 14 * loll + 14 * groan + 3 * shud] },
            'upperarm.L': { rotate: L.upper },
            'forearm.L': { rotate: L.lower },
            'hand.L': { rotate: L.hand },
            'upperarm.R': { rotate: R.upper },
            'forearm.R': { rotate: R.lower },
            'hand.R': { rotate: R.hand },
            'leg.L': { rotate: [legX + 14 * kick - 30 * step, 0, -hipsR[2]] },
            'leg.R': { rotate: [legX - 14 * kick, 0, -hipsR[2]] },
            'foot.L': { rotate: [20 * step, 0, 0] },
            'foot.R': { rotate: [0, 0, 0] },
          };
        },
      });
    }
  },
});
