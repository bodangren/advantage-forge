import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Necromancer — Chibi Quest enemy (catalog `enemies/humanoid/necromancer`), a P1 dungeon enemy,
 * about 0.97 m to the curled tip of the hood, faces +Z. Target:
 * docs/enemy-mockups/necromancer_001.jpg (one front view). Built on the cultist (the rogue's
 * skeleton with knee bones and the enemy clip set), so the human enemies read as one set.
 *
 * Role: the caster of the vault; seen in 3D and as a 128 px sprite, the two big green eyes in a
 *   pale face and the green flame on the skull staff read first.
 * One idea: a small stern sorcerer in a big black hood, the robe open over a green under-robe,
 *   a skull staff with a green flame in the left hand (the viewer's right in the front view).
 * Proportions: the rogue's body (shoulders 0.385, belt 0.26); the hood is larger than a head
 *   (0.51 m wide, curled tip at 0.97); the robe reaches the ankles and pale feet show below it.
 * Shape language: soft and round (hood, robe, face), with sharp accents (the hood's tip, the
 *   slanted brows and eyes, the stars on the robe, the flame).
 * Palette (60/30/10): black robe #2b2d31, dark green under-robe #3e6448, pale grey skin; the green
 *   glow #7dff3c and the bone white #e6dcc2 are the accents.
 * Value plan: the dark hood frames the pale face; the brightest spots are the eyes and the flame.
 * Bodies: skin (face and hands), hair (hair and brows), eyes, pupils, robe (hood, robe, sleeves),
 *   under-robe, belt, trim (bone patches, clasp, buckle, shoulder skull), legs, shoes, staff-wood,
 *   staff-bone, staff-flame.
 * Rig: the rogue's skeleton; the staff is rigid on `staff` (a child of `hand.L`), the flame on
 *   `flame` (it flickers by scale). Clips: idle, walk, run, attack (raise the staff, cast
 *   forward), hit, death (the staff drops, the flame dies), taunt (the staff raised high).
 */

const C = {
  robe: '#2b2d31',
  robeDark: '#1c1d21',
  under: '#3e6448',
  shadow: '#0c0b0d',
  skin: '#bec2aa',
  eyeWhite: '#e9e8da',
  mouth: '#4a3a34',
  hair: '#4a3022',
  eye: '#7dff3c',
  eyeBase: '#1c3a10',
  pupil: '#0e1a0a',
  legs: '#2a2226',
  shoe: '#c4bca4',
  bone: '#e6dcc2',
  boneDark: '#3a2e26',
  belt: '#2a1e18',
  wood: '#5a3c2a',
  woodDark: '#3e281c',
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
const SKULL_Y = 0.4; // along the staff from the grip
const FLAME_Y = 0.465;
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

/** A cartoon skull at the origin, facing +Z, about 0.1 m wide at scale 1. */
const skullShape = (s: number) => {
  const holes = sdf.union(
    pair(sdf.ellipsoid([0.015, 0.014, 0.02]).at(0.021, -0.004, 0.05)),
    sdf.ellipsoid([0.006, 0.009, 0.02]).at(0, -0.024, 0.054),
  );
  const teeth = sdf.union(
    sdf.box([0.062, 0.003, 0.1]).at(0, -0.04, 0.05),
    ...[-0.016, -0.0055, 0.0055, 0.016].map((x) => sdf.box([0.0028, 0.022, 0.1]).at(x, -0.04, 0.05)),
  );
  return sdf
    .smoothUnion(
      0.012,
      sdf.ellipsoid([0.05, 0.046, 0.05]).at(0, 0.012, -0.004),
      sdf.box([0.07, 0.036, 0.05], 0.013).at(0, -0.016, 0.012),
      sdf.box([0.052, 0.022, 0.042], 0.008).at(0, -0.04, 0.014),
    )
    .subtract(holes)
    .paintWhere(holes.round(0.004), C.boneDark, 0.002)
    .paintWhere(teeth.intersect(sdf.halfSpace([0, 0, -1], -0.02)), C.boneDark, 0.001)
    .scale(s);
};

/** A four-point star outline (the bone patches on the robe). */
const star = (r: number) =>
  profile.polygon(
    Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4 + Math.PI / 2;
      const d = i % 2 === 0 ? r : r * 0.38;
      return [d * Math.cos(a), d * Math.sin(a)] as [number, number];
    }),
  );

export default defineAsset({
  name: 'necromancer',
  description:
    'Chibi necromancer dungeon enemy: a black hooded robe open over a dark green under-robe, bone-white star patches and a skull shoulder pad, a pale stern face with big glowing green eyes, and a wooden staff topped with a skull and a green flame.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/necromancer_001.jpg',
  // Color slots: robe (the hood, robe, and sleeves), underrobe (the green panel), and eyes (the
  // glow of the eyes and the staff's flame).
  variants: {
    robe: { black: C.robe, plum: '#3e2238', navy: '#1e2742' },
    underrobe: { green: C.under, red: '#6b2a2a', teal: '#285a5a' },
    eyes: { green: C.eye, violet: '#b566ff', paleblue: '#9ad8ff' },
  },
  presets: {
    gravecaller: { robe: 'black', underrobe: 'green', eyes: 'green' },
    bloodbinder: { robe: 'plum', underrobe: 'red', eyes: 'violet' },
    frostwight: { robe: 'navy', underrobe: 'teal', eyes: 'paleblue' },
  },

  build(k) {
    const T = {
      robe: k.tint('robe'),
      robeDark: k.tint('robe', { color: C.robeDark, follow: 1 }),
      under: k.tint('underrobe'),
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

    // ------------------------------------------------------------------ the hood (robe body) and its opening
    const hoodTop = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid([0.255, 0.255, 0.24]).at(0, 0.69, -0.02),
        sdf.cone([0, 0.76, -0.04], [0, 0.9, -0.055], 0.17, 0.05),
        sdf.chain(
          [
            [0, 0.88, -0.05, 0.055],
            [0.004, 0.935, -0.06, 0.034],
            [0.014, 0.968, -0.04, 0.02],
            [0.03, 0.97, -0.01, 0.013],
          ],
          0.01,
        ),
      )
      .bone('head');
    const collar = sdf.ellipsoid([0.235, 0.09, 0.2]).at(0, 0.465, -0.01).bone('chest');
    const hoodSolid = sdf.smoothUnion(0.08, hoodTop, collar);
    // The face opening: an oval that narrows to a V at the neck.
    const cavity = sdf.smoothUnion(0.04, sdf.ellipsoid([0.2, 0.19, 0.2]).at(0, 0.615, 0.1), sdf.cone([0, 0.5, 0.17], [0, 0.42, 0.2], 0.08, 0.012));
    const hood = hoodSolid.subtract(cavity);

    // ------------------------------------------------------------------ the face: pale, stern, big glowing eyes
    const faceBase = sdf.smoothUnion(0.04, sdf.ellipsoid([0.155, 0.14, 0.14]).at(0, 0.615, 0.05), sdf.ellipsoid([0.115, 0.07, 0.1]).at(0, 0.52, 0.08));
    const faceZ = (x: number, y: number) => sdf.raycast(faceBase, [x, y, 1], [0, 0, -1])![2];
    const face = faceBase.smoothUnion(0.008, sdf.sphere(0.013).at(0, 0.542, faceZ(0, 0.542) - 0.006)).bone('head');
    const EYE = [0.078, 0.584] as const;
    // The upper edge of each eye slants down toward the nose: a glare.
    const lidN = norm([-0.35, 1, 0]);
    const lid = (lift: number) => sdf.halfSpace(lidN, dot(lidN, [EYE[0], EYE[1] + lift, 0]));
    const iris = sdf.ellipsoid([0.043, 0.047, 0.03]).at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) - 0.02).intersect(lid(0.03));
    k.body('eyes', pair(iris), { bone: 'head', color: T.eyeBase, emissive: T.eye, emissiveIntensity: 1.4, roughness: 0.3, detail: 0.003 });
    const eyeFront = sdf.raycast(iris, [EYE[0], EYE[1], 1], [0, 0, -1])![2];
    const pupils = pair(
      sdf.union(
        sdf.ellipsoid([0.017, 0.024, 0.012]).at(EYE[0] - 0.004, EYE[1] - 0.004, eyeFront - 0.008),
        sdf.sphere(0.008).at(EYE[0] + 0.015, EYE[1] + 0.012, eyeFront - 0.006).paint('#ffffff'),
      ),
    );
    k.body('pupils', pupils, { bone: 'head', color: C.pupil, roughness: 0.2, detail: 0.003 });
    const eyeWhite = pair(sdf.ellipsoid([0.053, 0.055, 0.08]).at(EYE[0] + 0.003, EYE[1], faceZ(EYE[0], EYE[1])).intersect(lid(0.038)));
    // A small frown: the arc bends down at both ends.
    const mouth = sdf.extrude(profile.arc(0.028, 0.0065, 38, 142), 0.3).at(0, 0.478, 0.1);

    // Hair: a widow's peak under the hood, and heavy brows that dip toward the nose.
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
              [0.028, 0.622],
              [0.07, 0.642],
              [0.112, 0.662],
              [0.142, 0.664],
              [0.138, 0.648],
              [0.104, 0.645],
              [0.066, 0.628],
              [0.034, 0.609],
            ],
            { smooth: true, samples: 3 },
          ),
          0.4,
        ).at(0, 0, 0.2),
      ),
    );
    k.body('hair', sdf.union(hairCap, brows), { bone: 'head', color: C.hair, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ robe: hood, open robe, sleeves
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
            [0.195, 0.09],
            [0.205, 0.066],
            [0.195, 0.058],
            [0, 0.058],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    // The robe is open in front from the collar down; the green under-robe fills the opening.
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.03, 0.44],
          [0.03, 0.44],
          [0.058, 0.26],
          [0.118, 0.0],
          [-0.118, 0.0],
          [-0.058, 0.26],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const robeOuter = robeShape.subtract(opening).bone('spine');
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
    const robe = robeAll.paintWhere(cavity.round(0.004), C.shadow, 0.006).paintWhere(sdf.halfSpace([0, 1, 0], 0.1), T.robeDark, 0.05);
    k.body('robe', robe, { color: T.robe, roughness: 0.9, bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 30, z * 70, 2) });

    const under = robeShape.round(-0.006).bone('spine');
    k.body('under-robe', under, { color: T.under, roughness: 0.9, detail: 0.006 });
    const BELT_Y = 0.262;
    k.body('belt', robeShape.round(-0.002).intersect(sdf.box([0.5, 0.016, 0.5]).at(0, BELT_Y, 0)).bone('spine'), { color: C.belt, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ bone trim: star patches, clasp, buckle, the shoulder skull
    const shellOf = (s: sdf.Shape) => s.round(0.004).subtract(s.round(-0.003));
    const patch = (shell: sdf.Shape, x: number, y: number, r: number, rot: number, tag: string) =>
      shell.intersect(sdf.extrude(star(r), 0.3).rotateZ(rot).at(x, y, 0.2)).bone(tag);
    const hoodShell = shellOf(hoodTop).subtract(cavity.round(0.006));
    const robeShell = shellOf(robeOuter);
    const sleeveShell = shellOf(sleeveR);
    const sleeveStar = add(lerp(ELBOW_R, WRIST_R, 0.5), [-0.022, 0, 0]);
    const claspZ = sdf.raycast(robeAll, [0, 0.405, 1], [0, 0, -1])![2];
    const clasp = sdf
      .smoothUnion(0.005, sdf.capsule([0, 0.43, 0], [0, 0.38, 0], 0.0075), ...[0.432, 0.378].flatMap((y) => [sdf.sphere(0.011).at(0.008, y, 0), sdf.sphere(0.011).at(-0.008, y, 0)]))
      .at(0, 0, claspZ - 0.002)
      .bone('chest');
    const buckleZ = sdf.raycast(under, [0, BELT_Y - 0.02, 1], [0, 0, -1])![2];
    const buckle = sdf
      .extrude(
        profile.polygon([
          [-0.026, 0.012],
          [0.026, 0.012],
          [0, -0.032],
        ]),
        0.012,
        0.003,
      )
      .at(0, BELT_Y, buckleZ + 0.002)
      .bone('spine');
    const shoulderSkull = skullShape(0.9).rotateX(-18).rotateY(-32).rotateZ(-20).at(-0.222, 0.44, 0.04).bone('chest');
    const trim = sdf.union(
      patch(hoodShell, 0.172, 0.75, 0.024, 12, 'head'),
      patch(hoodShell, -0.178, 0.73, 0.022, -18, 'head'),
      patch(robeShell, 0.122, 0.16, 0.022, 8, 'spine'),
      patch(robeShell, -0.118, 0.165, 0.021, -10, 'spine'),
      patch(sleeveShell, sleeveStar[0], sleeveStar[1], 0.028, 15, 'forearm.R'),
      clasp,
      buckle,
      shoulderSkull,
    );
    k.body('trim', trim, { color: C.bone, roughness: 0.6, detail: 0.003, textureDensity: 2 });

    // ------------------------------------------------------------------ skin: face and pale hands; legs, shoes
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
    const skin = sdf.union(face, armL, armR).paintWhere(eyeWhite, C.eyeWhite, 0.002).paintWhere(mouth, C.mouth, 0.002);
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
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.55 });

    // ------------------------------------------------------------------ the skull staff in the left hand
    // Local frame: the grip at the origin, the shaft along +Y, the skull facing +Z.
    const staffPose = (s: sdf.Shape) => s.rotateZ(STAFF_TILT.z).rotateX(STAFF_TILT.x).at(...GRIP);
    const woodDark = rgb(C.woodDark);
    const shaft = sdf
      .smoothUnion(0.012, sdf.cone([0, -0.155, 0], [0, SKULL_Y - 0.04, 0], 0.015, 0.019), sdf.sphere(0.022).at(0.002, 0.13, 0), sdf.sphere(0.02).at(-0.002, -0.06, 0.001))
      .displace(0.0015, (x, y, z) => noise.noise3(x * 90, y * 25, z * 90))
      .paintFn((x, y, z, base) => (noise.fbm(x * 160, y * 8, z * 160, 2) > 0.25 ? woodDark : base));
    k.body('staff-wood', staffPose(shaft), { color: C.wood, roughness: 0.75, detail: 0.004, bone: 'staff' });
    const staffBone = sdf.union(
      sdf.cylinder(0.03, 0.03, 0.009).at(0, SKULL_Y - 0.1, 0),
      sdf.torus(0.03, 0.007).at(0, SKULL_Y - 0.114, 0),
      sdf.torus(0.03, 0.007).at(0, SKULL_Y - 0.086, 0),
      skullShape(1.3).at(0, SKULL_Y, 0),
    );
    k.body('staff-bone', staffPose(staffBone), { color: C.bone, roughness: 0.6, detail: 0.003, bone: 'staff', textureDensity: 2 });
    // The flame: a round base on the skull's crown with three licking tongues and a wisp at the side.
    const flameLocal = sdf
      .smoothUnion(
        0.024,
        sdf.ellipsoid([0.046, 0.04, 0.042]).at(0, 0.025, 0),
        sdf.chain([[0, 0.05, 0, 0.032], [0.012, 0.1, -0.004, 0.02], [-0.004, 0.14, -0.006, 0.01], [0.012, 0.16, -0.006, 0.005]], 0.02),
        sdf.chain([[-0.026, 0.04, 0, 0.022], [-0.05, 0.085, 0, 0.012], [-0.045, 0.11, 0, 0.005]], 0.015),
        sdf.chain([[0.028, 0.04, 0, 0.02], [0.056, 0.08, 0.004, 0.011], [0.066, 0.1, 0.004, 0.005]], 0.015),
      )
      .union(sdf.chain([[0.07, -0.05, 0.0, 0.014], [0.09, -0.02, 0.0, 0.011], [0.094, 0.015, 0.0, 0.006], [0.084, 0.035, 0.0, 0.003]], 0.008))
      .at(0, FLAME_Y, 0);
    k.body('staff-flame', staffPose(flameLocal), { bone: 'flame', color: T.eyeBase, emissive: T.eye, emissiveIntensity: 1.6, roughness: 0.3, detail: 0.003 });

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

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [2 * wave(p, 1, 0.25), 4 * wave(p, 1, 0.4), -2 * bump(p)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-2 * bump(p), 0, 0] },
        'hand.L': { rotate: upright([2 * wave(p, 1, 0.1), 0, 2 * bump(p)], [-2 * bump(p), 0, 0]) },
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
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
          'upperarm.L': { rotate: [armSwing * 0.2 * s, 0, 3] as const },
          'hand.L': { rotate: upright([armSwing * 0.2 * s, 0, 3], [-armSwing * 0.2, 0, 0]) },
          'upperarm.R': { rotate: [-armSwing * 0.5 * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.2, 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.25, 0, 0] as const },
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
            [0, WRIST_L],
            [0.28, [0.235, 0.465, 0.06]],
            [0.46, [0.24, 0.475, 0.03]],
            [0.58, [0.19, 0.4, 0.15]],
            [0.74, [0.19, 0.395, 0.15]],
            [0.88, [0.228, 0.3, 0.1]],
            [1, WRIST_L],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, STAFF_D],
            [0.28, norm([0.32, 1, -0.12])],
            [0.46, norm([0.3, 1, -0.28])],
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
          'upperarm.R': { rotate: [10 * raise - 55 * cast, 0, -8 * raise - 6 * cast] },
          'forearm.R': { rotate: [-10 * raise - 25 * cast, 0, 0] },
          'hand.R': { rotate: [20 * cast, 0, 0] },
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
        return {
          ...mirrorPose({
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
          }),
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
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.215, 0.26, -0.07], land), lerp(ELBOW_R, [-0.3, 0.3, -0.05], land));
        const standL = add(add(add(WRIST_L, [0.05, 0.04, 0.02], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.04], fly);
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
    const POLE_RAISE: V3 = [0.55, 0.3, -0.1];
    const RAISE_DIR = norm([0.3, 1, 0.08]);
    k.animation('taunt', {
      duration: 2.4,
      loop: false,
      pose: (_t, p) => {
        const raise = keys(p, [[0, 0], [0.16, 1], [0.84, 1], [1, 0]] as const);
        const chant = raise * bump(p, 3);
        const sway = raise * wave(p, 1.5);
        const wrist = lerp(WRIST_L, add(RAISE_AT, [0, 0.015 * chant, 0]), raise);
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
          'upperarm.R': { rotate: [-24 * raise, 0, -4 * raise] },
          'forearm.R': { rotate: [-40 * raise - 6 * chant, 0, 0] },
          flame: flicker(p, 8, raise + 0.5 * chant),
        };
      },
    });
  },
});
