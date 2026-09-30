import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Dark mage: Chibi Quest enemy (catalog `enemies/humanoid/dark-mage`), about 0.97 m to the peak of
 * the hood, faces +Z. Target: docs/enemy-mockups/dark-mage_001.jpg. Built on the necromancer
 * (the rogue's skeleton with knee bones and the enemy clip set).
 *
 * Role: a caster enemy; at 128 px the two violet eyes in the pale face under the hood, the
 *   silver column on the robe, and the glowing crystal on the staff read first.
 * One idea: a small stern bearded mage in a deep purple hood, a black mantle, a silver-trimmed
 *   robe, a twisted black staff with a floating purple crystal, and a purple orb in the other hand.
 *   The staff hand is `hand.L` (the viewer's right, as in the mockup); the orb is in `hand.R`.
 * Shape language: soft and round (hood, robe), sharp accents (the brows, the claw, the crystal).
 * Palette (60/30/10): purple #3a2a4a robe, black #1c1a20 mantle, violet #c060ff glow, silver trim.
 * Bodies: skin, hair (hair, brows, beard), eyes, robe (hood, robe, sleeves), mantle, under-robe (the
 *   silver column), trim (chevrons), belt, rope, chain, legs, shoes, staff, staff-flame (the
 *   crystal), orb.
 * Rig: the necromancer's; the staff is rigid on `staff`, the crystal on `flame`, the orb on
 *   `hand.R`. Clips: idle, walk, run, attack, hit, death, taunt.
 */

const C = {
  robe: '#3a2a4a',
  robeLit: '#4e3a62',
  robeDark: '#2a1e36',
  mantle: '#1c1a20',
  rim: '#1e1428',
  skin: '#e8d8d0',
  mouth: '#6a3038',
  hair: '#1c1a18',
  eye: '#c060ff',
  eyeBase: '#3a1050',
  halo: '#7a40a0',
  trim: '#b8bcc4',
  chain: '#a0a4aa',
  belt: '#1c1a20',
  staff: '#16141a',
  staffLit: '#2a2830',
  crystal: '#b060ff',
  legs: '#2a1e36',
  shoe: '#1c1a20',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Joints: both hands low at the sides and a little forward (symmetric arms).
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.19, 0.335, 0.02];
const WRIST_L: V3 = [0.218, 0.262, 0.07];
const ELBOW_R = mx(ELBOW_L);
const WRIST_R = mx(WRIST_L);
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const SOLE_HEEL: V3 = [0.093, 0, -0.024];
const SOLE_TOE: V3 = [0.108, 0, 0.08];
// The left fist's grip: the staff passes through it, the top leans out and a little back.
const GRIP: V3 = [WRIST_L[0] + 0.007, WRIST_L[1] - 0.045, WRIST_L[2] + 0.02];
const STAFF_TILT = { z: -14, x: -3 } as const;
/** A point on the staff's axis, `y` meters from the grip. */
const staffPoint = (y: number): V3 => {
  const v = new THREE.Vector3(0, y, 0)
    .applyAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(STAFF_TILT.z))
    .applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(STAFF_TILT.x));
  return [GRIP[0] + v.x, GRIP[1] + v.y, GRIP[2] + v.z];
};
const STAFF_D = norm(add(staffPoint(1), GRIP, -1));
const CLAW_Y = 0.5; // the staff's claw, along the staff from the grip
const FLAME_Y = 0.565; // the crystal's center
const FLAME_AT = staffPoint(FLAME_Y);
const UP: V3 = [0, 1, 0];
const FWD: V3 = [0, 0, 1];

/** A fist hanging from the wrist `w`; `s` mirrors it for the right hand. Its grip hole runs along Z. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(...o(0.007, -0.038, 0.004)),
    sdf.capsule(o(-0.009, -0.058, 0.03), o(-0.005, -0.038, 0.042), 0.017),
    sdf.cone(o(0.02, -0.023, 0.025), o(0.001, -0.033, 0.048), 0.016, 0.013),
  );
};

export default defineAsset({
  name: 'dark-mage',
  description:
    'Chibi dark mage dungeon enemy: a deep purple hood over a pale bearded face with glowing violet eyes, a black mantle, a long purple robe with a silver trim column and chevrons, a twisted black staff with a floating purple crystal, and a purple orb in the free hand.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/dark-mage_001.jpg',
  variants: {
    robe: { purple: C.robe, black: '#1e1c22', red: '#4a1e2a' },
    glow: { violet: C.eye, green: '#40e080', red: '#ff4040' },
    trim: { silver: C.trim, gold: '#c8a030', none: '#3a2a4a' },
  },
  presets: {
    shadowmage: { robe: 'purple', glow: 'violet', trim: 'silver' },
    gravewarden: { robe: 'black', glow: 'green', trim: 'gold' },
    bloodmage: { robe: 'red', glow: 'red', trim: 'none' },
  },

  build(k) {
    const T = {
      robe: k.tint('robe'),
      robeLit: k.tint('robe', { color: C.robeLit, follow: 1 }),
      robeDark: k.tint('robe', { color: C.robeDark, follow: 1 }),
      eye: k.tint('glow'),
      eyeBase: k.tint('glow', { color: C.eyeBase, follow: 1 }),
      halo: k.tint('glow', { color: C.halo, follow: 1 }),
      crystal: k.tint('glow', { color: C.crystal, follow: 1 }),
      trim: k.tint('trim'),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      staff: { parent: 'hand.L', at: GRIP },
      flame: { parent: 'staff', at: FLAME_AT },
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

    // ------------------------------------------------------------------ the hood and its opening
    // The peak leans forward over the brow; the front lip stops just above the brows.
    const hoodBase = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid([0.29, 0.255, 0.26]).at(0, 0.68, 0),
        sdf.cone([0, 0.74, -0.02], [0, 0.86, -0.01], 0.22, 0.09),
        sdf.chain(
          [
            [0, 0.84, -0.04, 0.085],
            [0, 0.895, -0.02, 0.05],
            [0, 0.925, 0.01, 0.03],
            [0, 0.935, 0.03, 0.02],
          ],
          0.012,
        ),
      );
    // Two soft drape folds each side: a groove that follows the surface, from the peak to the shoulders.
    const foldShell = hoodBase.round(0.02).subtract(hoodBase.round(-0.01));
    const folds = [58, 98].flatMap((deg) => [deg, -deg].map((a) => foldShell.intersect(sdf.box([0.014, 0.5, 0.6], 0.005).at(0, 0.76, 0.3).rotateY(a))));
    const hoodTop = sdf.smoothSubtract(0.02, hoodBase, ...folds).bone('head');
    // A center seam ridge from the peak to the front rim.
    const seam = hoodBase
      .round(0.005)
      .subtract(hoodBase.round(-0.003))
      .intersect(sdf.box([0.008, 0.5, 0.5], 0.003).at(0, 1.0, 0.16))
      .bone('head');
    const collar = sdf.ellipsoid([0.17, 0.07, 0.16]).at(0, 0.47, -0.02).bone('chest');
    const hoodSolid = sdf.smoothUnion(0.06, hoodTop, collar);
    const cavity = sdf.smoothUnion(0.04, sdf.ellipsoid([0.2, 0.165, 0.2]).at(0, 0.6, 0.1), sdf.cone([0, 0.5, 0.17], [0, 0.42, 0.2], 0.08, 0.012));
    const hood = hoodSolid.subtract(cavity);
    const seamCut = seam.subtract(cavity);

    // ------------------------------------------------------------------ the face: pale, stern, glowing violet eyes
    const faceBase = sdf.smoothUnion(0.04, sdf.ellipsoid([0.155, 0.14, 0.14]).at(0, 0.615, 0.05), sdf.ellipsoid([0.115, 0.07, 0.1]).at(0, 0.52, 0.08));
    const faceZ = (x: number, y: number) => sdf.raycast(faceBase, [x, y, 1], [0, 0, -1])![2];
    const face = faceBase.smoothUnion(0.008, sdf.sphere(0.013).at(0, 0.542, faceZ(0, 0.542) - 0.006)).bone('head');
    const EYE = [0.07, 0.59] as const;
    const lidN = norm([-0.4, 1, 0]);
    const lid = (lift: number) => sdf.halfSpace(lidN, dot(lidN, [EYE[0], EYE[1] + lift, 0]));
    const iris = sdf.ellipsoid([0.033, 0.024, 0.03]).at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) - 0.016).intersect(lid(0.012));
    k.body('eyes', pair(iris), { bone: 'head', color: T.eyeBase, emissive: T.eye, emissiveIntensity: 1.5, roughness: 0.3, detail: 0.003 });
    const halo = pair(sdf.ellipsoid([0.058, 0.04, 0.05]).at(EYE[0], EYE[1] - 0.004, faceZ(EYE[0], EYE[1]) - 0.01));
    const mouthSlot = sdf.ellipsoid([0.026, 0.006, 0.06]).at(0, 0.503, 0.19);

    // Hair: a widow's peak under the hood, thin angry brows, a full beard with a moustache.
    const hairCap = face.round(0.007).intersect(
      sdf.extrude(
        profile.polygon(
          [
            [-0.25, 0.95],
            [0.25, 0.95],
            [0.25, 0.7],
            [0.13, 0.712],
            [0.055, 0.69],
            [0, 0.652],
            [-0.055, 0.69],
            [-0.13, 0.712],
            [-0.25, 0.7],
          ],
          { smooth: true, samples: 3 },
        ),
        0.6,
      ),
    );
    const brows = pair(
      face.round(0.011).intersect(
        sdf.extrude(
          profile.polygon(
            [
              [0.022, 0.628],
              [0.07, 0.65],
              [0.112, 0.672],
              [0.142, 0.676],
              [0.14, 0.662],
              [0.106, 0.655],
              [0.066, 0.638],
              [0.03, 0.617],
            ],
            { smooth: true, samples: 3 },
          ),
          0.4,
        ).at(0, 0, 0.2),
      ),
    );
    const beardMain = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.135, 0.09, 0.13]).at(0, 0.485, 0.07).intersect(sdf.halfSpace([0, 1, 0], 0.535)),
        sdf.ellipsoid([0.075, 0.06, 0.07]).at(0, 0.44, 0.12),
        ...[1, -1].map((s) => sdf.capsule([0.118 * s, 0.6, 0.045], [0.108 * s, 0.5, 0.06], 0.02)),
      )
      .subtract(mouthSlot);
    const mzy = (x: number) => 0.527 + 0.012 * Math.abs(x) / 0.07 - 0.0;
    const moustache = sdf.chain(
      [-0.075, -0.04, 0, 0.04, 0.075].map((x) => [x, mzy(x) + (Math.abs(x) < 0.02 ? -0.004 : 0.004 * (Math.abs(x) > 0.06 ? -1 : 0)), faceZ(x, mzy(x)) + 0.004, 0.0135 - 0.002 * Math.abs(x) / 0.075] as [number, number, number, number]),
      0.008,
    );
    k.body('hair', sdf.union(hairCap, brows, beardMain, moustache), { bone: 'head', color: C.hair, roughness: 0.85, detail: 0.004, bump: (x, y, z) => 0.0012 * noise.fbm(x * 120, y * 120, z * 120, 2) });

    // ------------------------------------------------------------------ robe: hood, closed long robe, sleeves
    const HEM = 0.04;
    const robeShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.135, 0.29],
            [0.15, 0.22],
            [0.172, 0.15],
            [0.192, 0.09],
            [0.2, 0.055],
            [0.198, HEM],
            [0.185, HEM - 0.004],
            [0, HEM - 0.004],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    // A narrow slot down the front center holds the silver column.
    const slot = sdf.box([0.024, 0.5, 0.3], 0.004).at(0, 0.24, 0.2);
    const robeOuter = robeShape.subtract(slot).bone('spine');
    const sleeveOf = (s: V3, e: V3, w: V3, up: string, fore: string) =>
      sdf.smoothUnion(0.015, sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.05, 0.053).bone(up), sdf.cone(e, lerp(e, w, 0.72), 0.053, 0.056).bone(fore));
    const cuff = (e: V3, w: V3, fore: string) =>
      sdf
        .cone(lerp(e, w, 0.64), lerp(e, w, 0.8), 0.058, 0.061)
        .subtract(sdf.sphere(0.038).at(...lerp(e, w, 0.98)))
        .bone(fore);
    const sleeveL = sleeveOf(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L');
    const sleeveR = sleeveOf(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R');
    const robeAll = sdf.union(robeOuter, hood, sleeveL, sleeveR, cuff(ELBOW_L, WRIST_L, 'forearm.L'), cuff(ELBOW_R, WRIST_R, 'forearm.R'));
    const robe = robeAll
      .paintWhere(cavity.round(0.004), C.rim, 0.006)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.1), T.robeDark, 0.05)
      .paintWhere(sdf.ellipsoid([0.13, 0.1, 0.12]).at(0.04, 0.86, 0.06), T.robeLit, 0.08);
    k.body('robe', robe, { color: T.robe, roughness: 0.9, bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 30, z * 70, 2) });

    k.body('hood-seam', seamCut, { color: T.robeLit, roughness: 0.9, detail: 0.003 });

    // The silver column: raised a little, filling the slot.
    const column = robeShape.round(0.003).intersect(sdf.box([0.032, 0.42, 0.3]).at(0, 0.235, 0.16)).bone('spine');
    k.body('under-robe', column, { color: T.trim, roughness: 0.4, metalness: 0.7, detail: 0.003 });

    // Chevron lines branching from the column, painted in relief.
    const robeShell = robeOuter.round(0.004).subtract(robeOuter.round(-0.0015));
    const stroke = (y0: number, s: 1 | -1) => {
      const a: [number, number] = [0.012 * s, y0 - 0.014];
      const b: [number, number] = [0.076 * s, y0 + 0.03];
      const d = norm([b[0] - a[0], b[1] - a[1], 0]);
      const n: [number, number] = [-d[1] * 0.0045, d[0] * 0.0045];
      return profile.polygon([
        [a[0] + n[0], a[1] + n[1]],
        [b[0] + n[0] * 0.7, b[1] + n[1] * 0.7],
        [b[0] - n[0] * 0.7, b[1] - n[1] * 0.7],
        [a[0] - n[0], a[1] - n[1]],
      ]);
    };
    const chevrons = sdf.union(
      ...[0.32, 0.235, 0.15, 0.07].flatMap((y0) => [1, -1].map((s) => robeShell.intersect(sdf.extrude(stroke(y0, s as 1 | -1), 0.3).at(0, 0, 0.2)))),
    ).bone('spine');
    k.body('trim', chevrons, { color: T.trim, roughness: 0.4, metalness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ the black mantle: a collar and shoulder cape, open in front
    const mantleRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.11, 0.53],
            [0.15, 0.5],
            [0.185, 0.44],
            [0.205, 0.37],
            [0.22, 0.28],
            [0.235, 0.2],
            [0.255, 0.11],
            [0.267, 0.06],
            [0.253, 0.06],
            [0.241, 0.11],
            [0.221, 0.2],
            [0.206, 0.28],
            [0.191, 0.37],
            [0.171, 0.44],
            [0.136, 0.5],
            [0.11, 0.514],
          ],
          { smooth: false },
        ),
      )
      .scale([1, 1, 0.85]);
    const zig = (x0: number, x1: number, y: number, amp: number, n: number): [number, number][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y + (i % 2 === 0 ? -amp : amp)]);
      return pts;
    };
    const upperKeep = sdf.extrude(profile.polygon([[-0.4, 0.9], [0.4, 0.9], ...zig(0.4, -0.4, 0.385, 0.015, 14)]), 0.8);
    const backKeep = sdf
      .extrude(profile.polygon([[-0.4, 0.9], [0.4, 0.9], ...zig(0.4, -0.4, 0.085, 0.022, 16)]), 0.8)
      .intersect(sdf.halfSpace([0, 0, 1], 0.015));
    const frontSlot = sdf.extrude(profile.polygon([[-0.03, 0.6], [0.03, 0.6], [0.056, 0.33], [-0.056, 0.33]]), 0.5).at(0, 0, 0.25);
    const mantle = mantleRing.intersect(sdf.union(upperKeep, backKeep)).subtract(frontSlot).bone('chest');
    k.body('mantle', mantle, { color: C.mantle, roughness: 0.92, detail: 0.005, bump: (x, y, z) => 0.0012 * noise.fbm(x * 60, y * 40, z * 60, 2) });

    // ------------------------------------------------------------------ chain necklace with a pendant
    const chestShape = sdf.union(robeShape, mantle, hood);
    const necklace = (x: number) => 0.462 - 0.11 * (1 - (x / 0.112) ** 2);
    const chainAt = (x: number): [number, number, number] => {
      const y = necklace(x);
      const hit = sdf.raycast(chestShape, [x, y, 1], [0, 0, -1]);
      return [x, y, (hit ? hit[2] : 0.12) + 0.007];
    };
    const chainPts = Array.from({ length: 15 }, (_, i) => {
      const [x, y, z] = chainAt(-0.112 + (0.224 * i) / 14);
      return [x, y, z, 0.0045] as [number, number, number, number];
    });
    // Eight links along the front half, alternately face-on and edge-on.
    const links = Array.from({ length: 8 }, (_, i) => {
      const [x, y, z] = chainAt(-0.098 + (0.196 * i) / 7);
      const ring = sdf.torus(0.0105, 0.0038);
      return (i % 2 === 0 ? ring.rotateX(90) : ring.rotateZ(90)).at(x, y, z + 0.002);
    });
    const pz = chainAt(0)[2];
    const pendant = sdf.box([0.02, 0.025, 0.006], 0.003).at(0, necklace(0) - 0.022, pz + 0.003);
    k.body('chain', sdf.union(sdf.chain(chainPts, 0.004), ...links, pendant).bone('chest'), { color: C.chain, roughness: 0.35, metalness: 0.7, detail: 0.003 });
    k.body('gem', sdf.sphere(0.0065).at(0, necklace(0) - 0.022, pz + 0.008).bone('chest'), { color: T.eyeBase, emissive: T.eye, emissiveIntensity: 1.5, roughness: 0.2, detail: 0.0022 });

    // ------------------------------------------------------------------ the rope belt with two hanging tails
    const BELT_Y = 0.278;
    const rope = robeShape.round(0.005).intersect(sdf.box([0.5, 0.02, 0.5]).at(0, BELT_Y, 0));
    const tailAt = (x: number, y: number) => {
      const hit = sdf.raycast(robeShape, [x, y, 1], [0, 0, -1]);
      return (hit ? hit[2] : 0.12) + 0.004;
    };
    const tail = (x: number, len: number) =>
      sdf.union(
        sdf.chain(
          [0, 0.25, 0.55, 0.85, 1].map((t) => {
            const y = BELT_Y - 0.01 - len * t;
            const xx = x + 0.006 * Math.sin(t * 4);
            return [xx, y, tailAt(xx, y), 0.0085 - 0.001 * t] as [number, number, number, number];
          }),
          0.006,
        ),
        sdf.sphere(0.0125).at(x + 0.006 * Math.sin(4), BELT_Y - 0.01 - len, tailAt(x, BELT_Y - len)),
      );
    const ropeAll = sdf.union(rope, tail(-0.045, 0.1), tail(-0.062, 0.075)).bone('spine');
    k.body('belt', ropeAll, {
      color: C.belt,
      roughness: 0.8,
      detail: 0.0035,
      bump: (x, y, z) => 0.0016 * Math.sin(Math.atan2(x, z) * 55 + y * 260),
    });

    // ------------------------------------------------------------------ skin: face and hands; legs, shoes
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(WRIST_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAt(WRIST_R, -1).bone('hand.R'),
    );
    const skin = sdf
      .union(face, armL, armR)
      .paintWhere(halo, T.halo, 0.022)
      .paintWhere(mouthSlot.round(0.004), C.mouth, 0.002);
    k.body('skin', skin, { color: C.skin, roughness: 0.6, detail: 0.004, textureDensity: 2 });
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.205, 0).bone('hips'),
      pair(sdf.smoothUnion(0.01, sdf.capsule([HIP[0], 0.2, 0], KNEE, 0.045).bone('leg.L'), sdf.capsule(KNEE, [ANKLE[0], 0.06, 0], 0.04).bone('shin.L'))),
    );
    k.body('legs', legs, { color: C.legs, roughness: 0.85, detail: 0.007 });
    const shoe = sdf
      .smoothUnion(0.03, sdf.cylinder(0.046, 0.06, 0.015).at(0, 0.035, 0), sdf.ellipsoid([0.054, 0.044, 0.094]).at(0, 0.04, 0.04))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.4 });

    // ------------------------------------------------------------------ the twisted staff in the left hand
    // Local frame: the grip at the origin, the shaft along +Y.
    const staffPose = (s: sdf.Shape) => s.rotateZ(STAFF_TILT.z).rotateX(STAFF_TILT.x).at(...GRIP);
    const strand = (phase: number) =>
      sdf.chain(
        Array.from({ length: 33 }, (_, i) => {
          const y = -0.18 + (i * (CLAW_Y + 0.005 + 0.18)) / 32;
          const th = phase + (y * Math.PI * 2) / 0.13;
          const r = 0.0095 + 0.003 * Math.max(0, y / CLAW_Y);
          return [r * Math.cos(th), y, r * Math.sin(th), 0.0105 + 0.004 * Math.max(0, y / CLAW_Y)] as [number, number, number, number];
        }),
        0.004,
      );
    // Five knotted talons that curl up and inward around the crystal.
    const talon = (ang: number) => {
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      const P = (r: number, y: number, rad: number): [number, number, number, number] => [r * c, CLAW_Y + y, r * sn, rad];
      return sdf.chain([P(0.01, -0.005, 0.0105), P(0.036, 0.025, 0.0085), P(0.058, 0.066, 0.0065), P(0.053, 0.1, 0.0052), P(0.035, 0.122, 0.004)], 0.006);
    };
    const knots = [0.12, 0.3].map((y) => sdf.sphere(0.014).at(0, y, 0));
    const staffShape = sdf
      .smoothUnion(0.006, strand(0), strand(Math.PI).paint(C.staffLit), sdf.sphere(0.026).at(0, CLAW_Y - 0.008, 0), ...knots, ...[0, 1, 2, 3, 4].map((i) => talon((i * Math.PI * 2) / 5 + 0.3)))
      .union(sdf.cone([0, -0.195, 0], [0, -0.13, 0], 0.006, 0.0125));
    k.body('staff-shaft', staffPose(staffShape), { color: C.staff, roughness: 0.55, detail: 0.004, bone: 'staff' });
    // The crystal: an elongated double cone, floating in the claw.
    const crystalLocal = sdf
      .union(sdf.cone([0, -0.05, 0], [0, 0, 0], 0.003, 0.04), sdf.cone([0, 0, 0], [0, 0.075, 0], 0.04, 0.005))
      .scale([1, 1, 0.85])
      .rotateY(20)
      .at(0, FLAME_Y, 0);
    k.body('staff-flame', staffPose(crystalLocal), { bone: 'flame', color: T.eyeBase, emissive: T.crystal, emissiveIntensity: 1.5, opacity: 0.85, roughness: 0.15, detail: 0.003, flat: true });

    // The orb in the free hand, held out forward.
    const orbAt = add(WRIST_R, [-0.008, -0.022, 0.078]);
    const orb = sdf.sphere(0.036).displace(0.006, (x, y, z) => noise.fbm(x * 30 + 3.1, y * 30 + 1.7, z * 30 + 5.3, 3)).at(...orbAt);
    k.body('orb', orb, { bone: 'hand.R', color: T.eyeBase, emissive: T.crystal, emissiveIntensity: 1.5, opacity: 0.85, roughness: 0.15, detail: 0.003, flat: true });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, quat, follow, euler, mirrorPose } = motion;
    const LEG = 0.19;
    const DEG = Math.PI / 180;
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const POLE_REST: V3 = add(SHOULDER, add(ELBOW_L, SHOULDER, -1), 4);
    /** The flame's flicker; `boost` flares it up. */
    const flicker = (p: number, n: number, boost = 0) => ({
      scale: [1 + 0.08 * wave(p, n, 0.1) + 0.3 * boost, 1 + 0.18 * wave(p, n + 2) + 0.6 * boost, 1 + 0.08 * wave(p, n, 0.3) + 0.3 * boost] as const,
    });
    /** The staff's frame when its axis points along `d` (the skull turns with the shortest rotation). */
    const REST_FRAME = { dir: STAFF_D, up: FWD };
    const staffFrame = (d: V3) => {
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...STAFF_D), new THREE.Vector3(...norm(d)));
      const u = new THREE.Vector3(...FWD).applyQuaternion(q);
      return { dir: norm(d), up: [u.x, u.y, u.z] as V3 };
    };
    /** The hand rotation that keeps the staff at its rest direction under these arm rotations. */
    const upright = (upper: V3, lower: V3) => orient([upper, lower], REST_FRAME, REST_FRAME);
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    // The carry pose: every clip starts from arms bent forward. The orb hand is held out at chest
    // height, the staff hand is raised so the crystal stands beside the hood peak.
    const CARRY_L: V3 = [0.235, 0.35, 0.1];
    const CARRY_R: V3 = [-0.212, 0.385, 0.14];
    const carryL = reach(ARM_L, CARRY_L, POLE_REST);
    const carryR = reach(ARM_R, CARRY_R, mx(POLE_REST));
    const addV = (a: readonly number[], b: readonly number[]): V3 => [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
    const FIST_REST = { dir: [0, -1, 0] as V3, up: [0, 0, 1] as V3 };
    /** The orb fist: fingers forward, palm up. */
    const fist = (upper: V3, lower: V3): V3 => orient([upper, lower], FIST_REST, { dir: norm([0.1, 0.1, 1]), up: UP });
    const armsL = (dU: V3, dL: V3) => {
      const upper = addV(carryL.upper, dU);
      const lower = addV(carryL.lower, dL);
      return { 'upperarm.L': { rotate: upper }, 'forearm.L': { rotate: lower }, 'hand.L': { rotate: upright(upper, lower) } };
    };
    const armsR = (dU: V3, dL: V3, dH: V3 = [0, 0, 0]) => {
      const upper = addV(carryR.upper, dU);
      const lower = addV(carryR.lower, dL);
      return { 'upperarm.R': { rotate: upper }, 'forearm.R': { rotate: lower }, 'hand.R': { rotate: addV(fist(upper, lower), dH) } };
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [2 * wave(p, 1, 0.25), 4 * wave(p, 1, 0.4), -2 * bump(p)] },
        ...armsL([2 * wave(p, 1, 0.1), 0, 2 * bump(p)], [-2 * bump(p), 0, 0]),
        ...armsR([2 * wave(p, 1, 0.1), 0, -3 * bump(p)], [-4 * bump(p), 0, 0]),
        flame: flicker(p, 4),
      }),
    });

    // The legs come from motion.gait (see the bandit): the left heel strikes at p = 0.25, when the
    // left arm is back. Short shuffling steps under the robe; the staff arm swings little.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 5 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 10,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, 0] as const },
          ...armsL([armSwing * 0.1 * s, 0, 0], [-armSwing * 0.05, 0, 0]),
          ...armsR([-armSwing * 0.15 * s, 0, 0], [-armSwing * 0.05, 0, 0]),
          flame: flicker(p, 4),
        };
      },
    });
    k.animation('walk', stride(0.95, 0.09, 0.022, 0.62, 0.005, 22, 4));
    k.animation('run', stride(0.58, 0.14, 0.04, 0.4, 0.025, 40, 12));

    // ---------------------------------------------------------------- attack: raise the staff, cast forward
    // The staff rises up and out to the side (the skull stays outside the hood), the flame flares,
    // then the staff swings forward so the skull points at the target, and the free hand thrusts
    // forward with it. Wrist targets are in the chest's rest frame.
    k.animation('attack', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, CARRY_L],
            [0.28, [0.26, 0.465, 0.06]],
            [0.46, [0.265, 0.475, 0.03]],
            [0.58, [0.19, 0.4, 0.15]],
            [0.74, [0.19, 0.395, 0.15]],
            [0.88, [0.228, 0.3, 0.1]],
            [1, CARRY_L],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, STAFF_D],
            [0.28, norm([0.4, 1, -0.12])],
            [0.46, norm([0.4, 1, -0.28])],
            [0.58, norm([0.14, 0.55, 1])],
            [0.74, norm([0.14, 0.5, 1])],
            [0.88, norm([0.3, 1, 0.2])],
            [1, STAFF_D],
          ] as const,
        );
        const pole = keys(p, [[0, POLE_REST], [0.28, [0.6, 0.35, -0.2]], [0.46, [0.6, 0.35, -0.2]], [0.58, [0.55, 0.05, 0.3]], [0.74, [0.55, 0.05, 0.3]], [1, POLE_REST]] as const);
        const arm = reach(ARM_L, wrist, pole);
        const hand = orient([arm.upper, arm.lower], REST_FRAME, staffFrame(dir));
        const raise = ease(0.04, 0.3, p) * (1 - ease(0.48, 0.58, p));
        const cast = ease(0.48, 0.58, p) * (1 - ease(0.74, 1, p));
        const flash = keys(p, [[0.3, 0], [0.46, 0.5], [0.58, 1.4], [0.72, 0.6], [0.9, 0]] as const);
        return {
          hips: { move: [0, -legDrop(LEG, 12 * cast), 0.025 * cast - 0.01 * raise], rotate: [0, 6 * raise - 8 * cast, 0] },
          spine: { rotate: [-6 * raise + 8 * cast, 0, 0] },
          chest: { rotate: [-4 * raise + 5 * cast, 6 * raise - 6 * cast, -3 * raise] },
          head: { rotate: [4 * raise - 6 * cast, -6 * raise + 8 * cast, 0] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          ...armsR([10 * raise - 10 * cast, 0, -8 * raise - 6 * cast], [-10 * raise + 12 * cast, 0, 0], [0, 0, 0]),
          'leg.L': { rotate: [-18 * cast, 0, 0] },
          'leg.R': { rotate: [10 * cast, 0, 0] },
          'foot.L': { rotate: [14 * cast, 0, 0] },
          'foot.R': { rotate: [-6 * cast, 0, 0] },
          flame: flicker(p, 6, flash),
        };
      },
    });

    // Hit: a blow from the front; the head and the chest snap back, one foot steps back.
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const SHIN = 0.125;
    const HEEL = 0.06;
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        const base = mirrorPose({
            hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
            spine: { rotate: [-6 * h, 0, 0] },
            chest: { rotate: [-10 * h, 6 * h, 3 * h] },
            neck: { rotate: [-6 * h, 0, 0] },
            head: { rotate: [-16 * h, -6 * h, -5 * h] },
            'leg.L': { rotate: [-lean, 0, 0] },
            'foot.L': { rotate: [lean, 0, 0] },
            'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
            'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
            'upperarm.L': { rotate: [-8 * h, 0, 14 * h] },
            'forearm.L': { rotate: [-10 * h, 0, 0] },
            'upperarm.R': { rotate: [-6 * h, 0, -8 * h] },
            'forearm.R': { rotate: [-6 * h, 0, 0] },
        });
        const rot = (b: string) => (base as Record<string, { rotate?: readonly number[] }>)[b]?.rotate ?? [0, 0, 0];
        return {
          ...base,
          ...armsL(rot('upperarm.L') as V3, rot('forearm.L') as V3),
          ...armsR(rot('upperarm.R') as V3, rot('forearm.R') as V3),
          flame: flicker(p, 3, 0.3 * h),
        };
      },
    });

    // Death: a stagger, then a fall on the back as one piece; the staff hand opens and the staff
    // drops beside the body while its flame dies down. The body keeps its size.
    const LIE = 86;
    const LIE_Y = 0.13;
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0]];
    const HAND_CHAIN: readonly V3[] = [...TRUNK, SHOULDER, ELBOW_L, WRIST_L];
    const DROP_AT: V3 = [0.43, 0.036, -0.02];
    const DROP_TURN = quat(orient([], REST_FRAME, { dir: norm([0.2, 0.12, 1]), up: UP }));
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24);
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.12, 0], [0.3, 1]] as const);
        const fade = keys(p, [[0.3, 0], [0.9, 1]] as const);
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * clamp01((tilt - 70) / 16);
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const standR = add(add(add(CARRY_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.215, 0.26, -0.07], land), lerp(ELBOW_R, [-0.3, 0.3, -0.05], land));
        const standL = add(add(add(CARRY_L, [0.05, 0.04, 0.02], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.04], fly);
        const armL = reach(ARM_L, lerp(standL, [0.27, 0.34, -0.07], land), lerp(ELBOW_L, [0.35, 0.36, -0.1], land));
        const handL = upright(armL.upper, armL.lower);
        const handQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).multiply(quat(armL.upper)).multiply(quat(armL.lower)).multiply(quat(handL));
        const held = add(follow(HAND_CHAIN, [hipsR, spineR, chestR, armL.upper, armL.lower, handL], GRIP), hipsMove);
        const drop = keys(p, [[0.12, add(DROP_AT, [0, 0.2, 0])], [0.3, DROP_AT], [0.35, add(DROP_AT, [0, 0.02, 0])], [0.4, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = new THREE.Vector3(...add(lerp(held, drop, loose), held, -1)).applyQuaternion(inv);
        const f = 1 - 0.85 * fade;
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, 8 * hitB - 30 * land, -8 * wob] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: handL },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: fist(armR.upper, armR.lower).map((v) => v * (1 - land)) as unknown as V3 },
          staff: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          flame: { scale: [f, f, f] },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: the staff raised high
    // Played when the necromancer first sees the player. The staff rises out to the left, the
    // necromancer leans back, then nods three times while the flame flares. The free hand comes up
    // before the chest, palm forward.
    const RAISE_AT: V3 = [0.23, 0.49, 0.09];
    const POLE_RAISE: V3 = [0.6, 0.3, -0.1];
    const RAISE_DIR = norm([0.55, 1, 0.1]);
    k.animation('taunt', {
      duration: 2.4,
      loop: false,
      pose: (_t, p) => {
        const raise = keys(p, [[0, 0], [0.16, 1], [0.84, 1], [1, 0]] as const);
        const chant = raise * bump(p, 3);
        const sway = raise * wave(p, 1.5);
        const wrist = lerp(CARRY_L, add(RAISE_AT, [0, 0.015 * chant, 0]), raise);
        const arm = reach(ARM_L, wrist, lerp(POLE_REST, POLE_RAISE, raise));
        const hand = orient([arm.upper, arm.lower], REST_FRAME, staffFrame(lerp(STAFF_D, RAISE_DIR, raise)));
        return {
          spine: { rotate: [-3 * raise, 0, 2 * sway] },
          chest: { rotate: [-3 * raise + 5 * chant, -6 * raise, 2 * sway] },
          neck: { rotate: [-4 * raise + 4 * chant, 0, 0] },
          head: { rotate: [-8 * raise + 8 * chant, 4 * raise, 4 * sway] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          ...armsR([0, 0, -8 * raise], [-2 * raise - 3 * chant, 0, 0]),
          flame: flicker(p, 8, raise + 0.5 * chant),
        };
      },
    });
  },
});
