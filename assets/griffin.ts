import { defineAsset, motion, noise, sdf } from '../src/index.js';

/**
 * Griffin — Chibi Quest monster (catalog `monsters/beast/griffin`), about 1.0 m to the crest and
 * 1.0 m across the raised wings, faces +Z. Target: docs/monster-mockups/griffin_001.jpg (made
 * with mmx; one front three-quarter view).
 *
 * Role: the mount of the griffin games (Gryphon Patrol, Griffin Sky-Joust, Griffin Riders
 *   Escape) and a sky beast elsewhere; seen mostly in flight, in 3D and as a 128 px sprite. The
 *   beak, the eyes, and the wings must read from the side and from behind.
 * One idea: a big round white eagle head with a hooked yellow beak and bold amber eyes, a white
 *   feather ruff, on a small tan lion body with yellow eagle feet, under two wings of dark brown
 *   coverts and cream flight feathers.
 * Shape language: round masses (head, body) with pointed feathers (crest, cheek tufts, ruff)
 *   and a sharp hooked beak and talons; brave rather than menacing.
 * Palette (60/30/10): tan coat #d9944f (darker legs, lighter belly); white plumage #f6f1e6 with
 *   cream shade; dark brown coverts and tail tuft #6b4430; cream flight feathers #f1dfa6; yellow
 *   beak, brows, and feet #efc341; amber eyes #e07a24 as the accent.
 * Value plan: the dark eye rings and pupils in the white head, under the yellow brows, are the
 *   strongest contrast (focal point); the white head and ruff are the biggest light mass; the
 *   dark coverts frame it from behind.
 * Bodies: coat (body, legs, feet, tail), plumage (head, crest, tufts, ruff, the eyes painted),
 *   beak, jawBeak, mouth, talons, tuft, wingArms, coverts, flight.
 * Rig: quadruped (as the dire wolf: hips, spine, neck, head, jaw, tail, legs with shins) plus
 *   `wing.L`/`wing.R`. Clips: idle, walk, run (trots), fly (a hover with full wing beats, the
 *   legs tucked), attack (a diving strike from the air, beak open, talons forward), hit (a jolt
 *   in the air), roar (a rear-up screech with the wings spread wide), death.
 */

const C = {
  coat: '#d9944f',
  coatDark: '#b8733a',
  coatLight: '#ecc28a',
  plumage: '#f6f1e6',
  plumageShade: '#e6dccb',
  covert: '#6b4430',
  flight: '#f1dfa6',
  scale: '#efc341',
  scaleDark: '#d9a52c',
  talon: '#4e3424',
  eye: '#e07a24',
  eyeRim: '#4a2a18',
  pupil: '#141012',
  mouth: '#4a2420',
  tongue: '#c0606a',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

// Joints (rest pose). Short, thick legs under a compact body; the head is half the height.
const SHOULDER: V3 = [0.1, 0.3, 0.1];
const FKNEE: V3 = [0.105, 0.15, 0.12];
const HIP: V3 = [0.1, 0.3, -0.22];
const BKNEE: V3 = [0.105, 0.15, -0.24];
const HEAD_C: V3 = [0, 0.7, 0.18];
const JAW_AT: V3 = [0, 0.6, 0.33];
const WING_ROOT: V3 = [0.08, 0.47, -0.05];
const HIPS_AT: V3 = [0, 0.31, -0.2];
const SPINE_AT: V3 = [0, 0.33, 0.02];

export default defineAsset({
  name: 'griffin',
  description: 'Chibi griffin monster: a big white eagle head with a hooked yellow beak and amber eyes, a white feather ruff, a tan lion body on yellow eagle feet, and wings of dark brown and cream feathers; quadruped rig with wings.',
  detail: 0.005,
  reference: 'docs/monster-mockups/griffin_001.jpg',
  // Color slots for individual griffins (the first option is the default look).
  variants: {
    coat: { tan: C.coat, golden: '#e0ab4c', ash: '#a39282' },
    plumage: { white: C.plumage, cream: '#efe2c4', silver: '#d9dde0' },
    wings: { brown: C.covert, chestnut: '#8a4a2c', slate: '#4e5560' },
    eyes: { amber: C.eye, gold: '#e8b830', sky: '#6aa8d8' },
  },
  presets: {
    golden: { coat: 'golden', plumage: 'cream', wings: 'chestnut', eyes: 'gold' },
    storm: { coat: 'ash', plumage: 'silver', wings: 'slate', eyes: 'sky' },
  },

  build(k) {
    const T = {
      coat: k.tint('coat'),
      coatDark: k.tint('coat', { color: C.coatDark, follow: 1 }),
      coatLight: k.tint('coat', { color: C.coatLight, follow: 1 }),
      plumage: k.tint('plumage'),
      plumageShade: k.tint('plumage', { color: C.plumageShade, follow: 1 }),
      covert: k.tint('wings'),
      eye: k.tint('eyes'),
    };
    k.skeleton({
      hips: { at: HIPS_AT },
      spine: { parent: 'hips', at: SPINE_AT },
      neck: { parent: 'spine', at: [0, 0.42, 0.1] },
      head: { parent: 'neck', at: [0, 0.54, 0.15] },
      jaw: { parent: 'head', at: JAW_AT, tail: [0, 0.58, 0.42] },
      tail: { parent: 'hips', at: [0, 0.33, -0.33], tail: [0.05, 0.52, -0.56] },
      'wing.L': { parent: 'spine', at: WING_ROOT, tail: [0.42, 0.78, -0.2] },
      'wing.R': { parent: 'spine', at: mx(WING_ROOT), tail: [-0.42, 0.78, -0.2] },
      'fleg.L': { parent: 'spine', at: SHOULDER },
      'fshin.L': { parent: 'fleg.L', at: FKNEE },
      'fleg.R': { parent: 'spine', at: mx(SHOULDER) },
      'fshin.R': { parent: 'fleg.R', at: mx(FKNEE) },
      'bleg.L': { parent: 'hips', at: HIP },
      'bshin.L': { parent: 'bleg.L', at: BKNEE },
      'bleg.R': { parent: 'hips', at: mx(HIP) },
      'bshin.R': { parent: 'bleg.R', at: mx(BKNEE) },
    });

    // ------------------------------------------------------------------ body, legs, feet, tail
    const chest = sdf.ellipsoid([0.15, 0.15, 0.17]).at(0, 0.34, 0.04);
    const rump = sdf.ellipsoid([0.135, 0.135, 0.15]).at(0, 0.32, -0.2);
    const neck = sdf.ellipsoid([0.115, 0.13, 0.1]).at(0, 0.47, 0.1);
    const leg = (hip: V3, knee: V3, upper: string, lower: string) =>
      sdf.smoothUnion(
        0.03,
        sdf.cone(hip, knee, 0.088, 0.06).bone(upper),
        sdf.cone(knee, [knee[0], 0.05, knee[2] + 0.01], 0.054, 0.048).bone(lower),
      );
    const legs = sdf.union(pair(leg(SHOULDER, FKNEE, 'fleg.L', 'fshin.L')), pair(leg(HIP, BKNEE, 'bleg.L', 'bshin.L')));
    // Eagle feet: three thick toes forward and one back, each ending in a dark talon.
    const TOES: readonly (readonly [dx: number, dz: number])[] = [[-0.045, 0.075], [0, 0.095], [0.045, 0.075], [0, -0.06]];
    const toeTip = (kn: V3, [dx, dz]: readonly [number, number]): V3 => [kn[0] + dx * 1.3, 0.028, kn[2] + 0.015 + dz];
    const foot = (kn: V3, bone: string) =>
      sdf
        .smoothUnion(
          0.02,
          sdf.ellipsoid([0.062, 0.042, 0.06]).at(kn[0], 0.04, kn[2] + 0.015),
          ...TOES.map((t) => sdf.cone([kn[0] + t[0] * 0.5, 0.03, kn[2] + 0.015 + t[1] * 0.3], toeTip(kn, t), 0.03, 0.024)),
        )
        .intersect(sdf.halfSpace([0, -1, 0], 0))
        .bone(bone);
    const feet = sdf.union(pair(foot(FKNEE, 'fshin.L')), pair(foot(BKNEE, 'bshin.L')));
    const TAIL_END: V3 = [0.05, 0.53, -0.56];
    const tail = sdf.chain(
      [
        [0, 0.33, -0.32, 0.034],
        [0.015, 0.37, -0.44, 0.03],
        [0.035, 0.45, -0.53, 0.026],
        [TAIL_END[0], TAIL_END[1], TAIL_END[2], 0.022],
      ],
      0.02,
    );
    const trunk = sdf.smoothUnion(0.07, chest.bone('spine'), rump.bone('hips'), neck.bone('neck'));
    const coat = trunk
      .smoothUnion(0.03, legs)
      .smoothUnion(0.02, feet)
      .smoothUnion(0.02, tail.bone('tail'))
      // The lighter belly, the darker back, the yellow scaly shins and feet.
      .paintWhere(sdf.ellipsoid([0.12, 0.1, 0.24]).at(0, 0.2, -0.06), T.coatLight, 0.04)
      .paintWhere(sdf.ellipsoid([0.2, 0.08, 0.36]).at(0, 0.5, -0.08), T.coatDark, 0.06)
      .paintWhere(sdf.box([1, 0.32, 1]).at(0, 0, 0), C.scale, 0.012);
    k.body('coat', coat, {
      color: T.coat,
      roughness: 0.8,
      textureDensity: 1.5,
      bump: (x, y, z) => (y > 0.16 ? 0.0007 * noise.fbm(x * 70, y * 30, z * 70, 2) : 0.0012 * Math.max(0, Math.cos(y * 2 * Math.PI * 32))),
    });

    // ------------------------------------------------------------------ head: white plumage
    const skull = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.2, 0.19, 0.18]).at(...HEAD_C),
      pair(sdf.sphere(0.08).at(0.1, 0.62, 0.24)), // cheeks under the eyes
    );
    const faceHit = (x: number, y: number) => sdf.raycast(skull, [x, y, 2], [0, 0, -1])!;
    const topHit = (x: number, z: number) => sdf.raycast(skull, [x, 2, z], [0, -1, 0])!;
    // A crest of swept-back feathers, flattened side to side, tallest in the middle.
    const crest = sdf.smoothUnion(
      0.02,
      ...[
        [0, 0.2, 0.17, 0.065],
        [0.05, 0.16, 0.14, 0.055],
        [-0.05, 0.16, 0.14, 0.055],
        [0.1, 0.1, 0.1, 0.05],
        [-0.1, 0.1, 0.1, 0.05],
        [0, 0.08, 0.13, 0.055],
      ].map(([x, z, len, r]) => {
        const root = topHit(x!, z!);
        return sdf
          .chain(
            [
              [root[0], root[1] - 0.03, root[2], r!],
              [root[0] * 1.3, root[1] + len! * 0.6, root[2] - len! * 0.35, r! * 0.55],
              [root[0] * 1.6, root[1] + len! * 0.9, root[2] - len!, 0.016],
            ],
            0.01,
          )
          .scale([0.75, 1, 1]);
      }),
    );
    // Pointed cheek tufts, swept back, two on each side.
    const tuft = (from: V3, to: V3, r: number) => sdf.cone(from, to, r, 0.005).scale([1, 1, 0.6]);
    const cheekTufts = pair(
      sdf.smoothUnion(0.02, tuft([0.15, 0.72, 0.12], [0.22, 0.75, -0.03], 0.06), tuft([0.14, 0.63, 0.13], [0.21, 0.58, -0.01], 0.055)),
    );
    // The ruff: rounded feathers around the front of the neck, longest at the chest.
    const ruffRow = (n: number, y: number, spread: number, reach: number, lenMax: number, r: number) =>
      Array.from({ length: n }, (_, i) => {
        const u = (i - (n - 1) / 2) / ((n - 1) / 2);
        const a = u * spread * (Math.PI / 180);
        const len = lenMax * (1 - 0.3 * Math.abs(u));
        const from: V3 = [Math.sin(a) * 0.11, y, 0.13 + Math.cos(a) * 0.07];
        const to: V3 = [Math.sin(a) * (0.13 + len * 0.5), y - len, 0.16 + Math.cos(a) * reach];
        return sdf.cone(from, to, r, 0.016);
      });
    const ruff = sdf.smoothUnion(
      0.025,
      sdf.ellipsoid([0.12, 0.1, 0.08]).at(0, 0.44, 0.15),
      ...ruffRow(9, 0.5, 100, 0.14, 0.15, 0.05),
      ...ruffRow(6, 0.41, 60, 0.15, 0.13, 0.045),
    );
    // The eyes, painted on the head where a ray from the front meets it.
    const EYE_X = 0.088;
    const eL = faceHit(EYE_X, 0.705);
    const disc = (r: number, dx = 0, dy = 0) => pair(sdf.cylinder(r, 1).rotateX(90).at(eL[0] + dx, eL[1] + dy, 0));
    const front = sdf.halfSpace([0, 0, -1], -0.2);
    const plumage = sdf
      .union(skull.bone('head'), crest.bone('head'), cheekTufts.bone('head'), ruff.bone('neck'))
      .paintWhere(sdf.ellipsoid([0.16, 0.08, 0.14]).at(0, 0.36, 0.14), T.plumageShade, 0.04)
      .paintWhere(disc(0.05).intersect(front), C.eyeRim, 0.002)
      .paintWhere(disc(0.042).intersect(front), T.eye, 0.002)
      .paintWhere(disc(0.02, -0.004, -0.002).intersect(front), C.pupil, 0.002)
      .paintWhere(pair(sdf.sphere(0.01).at(eL[0] + 0.014, eL[1] + 0.016, eL[2])), '#ffffff', 0.002);
    k.body('plumage', plumage, {
      color: T.plumage,
      roughness: 0.85,
      textureDensity: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });

    // ------------------------------------------------------------------ beak and brows
    const upperBeak = sdf.smoothUnion(
      0.02,
      sdf.ellipsoid([0.095, 0.07, 0.08]).at(0, 0.645, 0.34),
      sdf.chain(
        [
          [0, 0.66, 0.37, 0.062],
          [0, 0.648, 0.45, 0.044],
          [0, 0.6, 0.495, 0.025],
          [0, 0.545, 0.485, 0.008],
        ],
        0.015,
      ),
    );
    const nostril = pair(sdf.sphere(0.011).at(0.027, 0.69, 0.41));
    const browAt = (x: number, y: number): V3 => {
      const h = faceHit(x, y);
      return [h[0], h[1], h[2] - 0.006];
    };
    const brows = pair(
      sdf.chain(
        [
          [...browAt(0.035, 0.705), 0.02],
          [...browAt(0.075, 0.755), 0.022],
          [...browAt(0.12, 0.765), 0.018],
          [...browAt(0.15, 0.75), 0.012],
        ],
        0.012,
      ),
    );
    k.body('beak', sdf.union(upperBeak.subtract(nostril), brows).bone('head'), { color: C.scale, roughness: 0.4, textureDensity: 1.5 });
    const lowerBeak = sdf.ellipsoid([0.062, 0.028, 0.068]).at(0, 0.583, 0.395);
    k.body('jawBeak', lowerBeak, { color: C.scaleDark, roughness: 0.4, bone: 'jaw' });
    k.body('mouth', sdf.ellipsoid([0.06, 0.026, 0.06]).at(0, 0.6, 0.36).bone('head'), { color: C.mouth, roughness: 0.6 });

    // ------------------------------------------------------------------ talons and the tail tuft
    const talons = sdf.union(
      ...[FKNEE, BKNEE].flatMap((kn, j) =>
        TOES.map((t) => {
          const tip = toeTip(kn, t);
          const out = t[1] > 0 ? 1 : -1;
          return sdf
            .ellipsoid([0.03, 0.028, 0.036])
            .at(tip[0], 0.026, tip[2] + out * 0.022)
            .intersect(sdf.halfSpace([0, -1, 0], 0))
            .bone(j === 0 ? 'fshin.L' : 'bshin.L');
        }),
      ),
    );
    k.body('talons', pair(talons), { color: C.talon, roughness: 0.35 });
    const tailTuft = sdf.smoothUnion(
      0.02,
      sdf.ellipsoid([0.07, 0.08, 0.085]).at(TAIL_END[0], TAIL_END[1] + 0.02, TAIL_END[2] - 0.04),
      ...[
        [0.02, 0.12, -0.1],
        [0.01, 0.05, -0.16],
        [0.02, -0.03, -0.15],
        [0.03, -0.08, -0.08],
      ].map(([dx, dy, dz]) => sdf.cone([TAIL_END[0], TAIL_END[1] + 0.02, TAIL_END[2] - 0.04], [TAIL_END[0] + dx!, TAIL_END[1] + dy!, TAIL_END[2] + dz!], 0.05, 0.01)),
    );
    k.body('tuft', tailTuft.bone('tail'), { color: T.covert, roughness: 0.85 });

    // ------------------------------------------------------------------ wings
    // Local frame: the root at the origin, the wing spread along +X, the feathers in the XY plane.
    // The arm runs out and up to the wrist and the tip; dark coverts hang from it, longer cream
    // flight feathers fan out behind them from the arm and the wrist.
    const WRIST: readonly [number, number] = [0.29, 0.27];
    const ELBOW: readonly [number, number] = [0.14, 0.11];
    const armAt = (u: number): [number, number] =>
      u < 0.5 ? [ELBOW[0] * u * 2, ELBOW[1] * u * 2] : [ELBOW[0] + (WRIST[0] - ELBOW[0]) * (u - 0.5) * 2, ELBOW[1] + (WRIST[1] - ELBOW[1]) * (u - 0.5) * 2];
    const feather = (x: number, y: number, dirDeg: number, len: number, w: number, z: number, thick = 0.01) => {
      const a = (dirDeg * Math.PI) / 180;
      return sdf
        .ellipsoid([w, len / 2, thick])
        .rotateZ(dirDeg - 90)
        .at(x + (Math.cos(a) * len) / 2, y + (Math.sin(a) * len) / 2, z);
    };
    const arm = sdf.chain(
      [
        [0, 0, 0, 0.05],
        [ELBOW[0], ELBOW[1], 0, 0.038],
        [WRIST[0], WRIST[1], 0, 0.03],
        [WRIST[0] + 0.04, WRIST[1] + 0.05, 0, 0.018],
      ],
      0.02,
    );
    // Two rows of dark coverts along the arm, the lower row longer.
    const coverts = sdf.smoothUnion(
      0.012,
      ...[0.15, 0.35, 0.55, 0.75, 0.95].map((u, i) => {
        const [x, y] = armAt(u);
        return feather(x, y - 0.01, -78 + i * 7, 0.16 + i * 0.012, 0.05, 0, 0.02);
      }),
      ...[0.25, 0.5, 0.75, 1].map((u, i) => {
        const [x, y] = armAt(u);
        return feather(x, y, -60 + i * 8, 0.09, 0.045, 0, 0.021);
      }),
    );
    // Cream flight feathers: secondaries under the coverts, primaries fanned out from the wrist.
    const flight = sdf.smoothUnion(
      0.008,
      ...[0.2, 0.45, 0.7, 0.92].map((u, i) => {
        const [x, y] = armAt(u);
        return feather(x, y - 0.02, -82 + i * 8, 0.2 + i * 0.03, 0.055, -0.004);
      }),
      ...[48, 22, -4, -30, -56].map((d, i) => feather(WRIST[0] - 0.01, WRIST[1] - 0.01, d, 0.27 - Math.abs(i - 1.5) * 0.025, 0.058, -0.006)),
    );
    const wingPose = (s: sdf.Shape) => s.scale(1.12).rotateY(14).at(...WING_ROOT);
    k.body('wingArms', pair(wingPose(arm).bone('wing.L')), { color: T.coat, roughness: 0.8 });
    k.body('coverts', pair(wingPose(coverts).bone('wing.L')), { color: T.covert, roughness: 0.85 });
    k.body('flight', pair(wingPose(flight).bone('wing.L')), { color: C.flight, roughness: 0.85 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys } = motion;
    type Rot = readonly [number, number, number];
    type Pose = Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }>;
    type Track = readonly (readonly [number, number])[];

    // Ground contact, as on the dire wolf. The feet and the talons are rigid on the shins.
    // `footSole` lists rest points on the bottom of a foot: the round pad and each talon.
    // motion.plant then sets the hips height so the lowest of them rests on the ground.
    const footSole = (kn: V3): V3[] => {
      const pts: V3[] = [];
      const c: V3 = [kn[0], 0.04, kn[2] + 0.015];
      for (const th of [20, 45, 70, 90])
        for (let ph = 0; ph < 360; ph += 30) {
          const s = Math.sin((th * Math.PI) / 180);
          const a = (ph * Math.PI) / 180;
          pts.push([c[0] + 0.062 * s * Math.cos(a), Math.max(0, c[1] - 0.042 * Math.cos((th * Math.PI) / 180)), c[2] + 0.06 * s * Math.sin(a)]);
        }
      for (const t of TOES) {
        const tip = toeTip(kn, t);
        const out = t[1] > 0 ? 1 : -1;
        const cz = tip[2] + out * 0.022;
        pts.push([tip[0], 0, cz], [tip[0], 0.006, cz + out * 0.025], [tip[0], 0.026, cz + out * 0.036]);
      }
      return pts;
    };
    const LEGS = [
      { bones: ['hips', 'spine', 'fleg.L', 'fshin.L'], joints: [HIPS_AT, SPINE_AT, SHOULDER, FKNEE], sole: footSole(FKNEE) },
      { bones: ['hips', 'spine', 'fleg.R', 'fshin.R'], joints: [HIPS_AT, SPINE_AT, mx(SHOULDER), mx(FKNEE)], sole: footSole(mx(FKNEE)) },
      { bones: ['hips', 'bleg.L', 'bshin.L'], joints: [HIPS_AT, HIP, BKNEE], sole: footSole(BKNEE) },
      { bones: ['hips', 'bleg.R', 'bshin.R'], joints: [HIPS_AT, mx(HIP), mx(BKNEE)], sole: footSole(mx(BKNEE)) },
    ];
    const chains = (pose: Pose, legs: readonly (typeof LEGS)[number][] = LEGS) =>
      legs.map((l) => ({ joints: l.joints, rotations: l.bones.map((b) => pose[b]?.rotate ?? ([0, 0, 0] as const)), sole: l.sole }));
    // The hips lift for the pose, and then each planted foot ([index in LEGS, weight]) that
    // floats tips its toes down until the talons touch the ground (the push-off of a step).
    const planted = (pose: Pose, settle: readonly (readonly [leg: number, weight: number])[] = []) => {
      const y = motion.plant(chains(pose));
      for (const [i, weight] of settle) {
        const l = LEGS[i]!;
        const shin = l.bones[l.bones.length - 1]!;
        const r = pose[shin]?.rotate ?? ([0, 0, 0] as const);
        const floats = (w: number) => {
          pose[shin] = { rotate: [r[0] + w, r[1], r[2]] };
          return y - motion.plant(chains(pose, [l])) > 0.001;
        };
        let lo = 0;
        if (floats(0)) {
          let hi = 30;
          for (let n = 0; n < 12; n++) {
            const mid = (lo + hi) / 2;
            if (floats(mid)) lo = mid;
            else hi = mid;
          }
        }
        pose[shin] = { rotate: [r[0] + lo * weight, r[1], r[2]] };
      }
      return y;
    };

    // The trot of the dire wolf: diagonal pairs move together, a planted foot stays flat while
    // its leg pushes back, and a swinging leg lifts the knee (`fold`) and tips the toes up
    // (`toe`). The bias sets each knee straight under its shoulder or hip. The wings stay raised
    // and bob a little with each step.
    type Swing = readonly [fold: number, toe: number];
    const gait = (duration: number, swing: number, front: Swing, hind: Swing, hop: number, headDip: number, tailUp: number, wingBob: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const a = wave(p);
        const pitch = 2 * wave(p, 2);
        const leg = (s: 1 | -1, isFront: boolean) => {
          const lift = Math.max(0, s * wave(p, 1, 0.25));
          const [fold, toe] = isFront ? front : hind;
          const upper = (isFront ? 7.6 : -7.6) - s * swing * a - fold * lift;
          const lower = -upper - (isFront ? pitch : 0) - toe * lift;
          return { upper: { rotate: [upper, 0, 0] as Rot }, lower: { rotate: [lower, 0, 0] as Rot }, lift };
        };
        const legs = [leg(1, true), leg(-1, true), leg(-1, false), leg(1, false)];
        const bob = wingBob * wave(p, 2, 0.1);
        const pose: Pose = {
          hips: { rotate: [0, 0, 3 * a] },
          spine: { rotate: [pitch, 0, -3 * a] },
          neck: { rotate: [headDip, 0, 0] },
          head: { rotate: [-headDip - 4 * wave(p, 2, 0.25), 4 * a, 0] },
          tail: { rotate: [tailUp + 8 * wave(p, 2, 0.1), 18 * wave(p, 1, 0.2), 0] },
          'wing.L': { rotate: [0, 0, bob] },
          'wing.R': { rotate: [0, 0, -bob] },
        };
        legs.forEach((l, i) => {
          pose[LEGS[i]!.bones.at(-2)!] = l.upper;
          pose[LEGS[i]!.bones.at(-1)!] = l.lower;
        });
        const settle = legs.map((l, i) => [i, Math.max(0, 1 - l.lift / 0.4)] as const).filter(([, w]) => w > 0);
        pose.hips = { ...pose.hips, move: [0, planted(pose, settle) + hop * bump(p, 2) ** 2, 0] };
        return pose;
      },
    });
    k.animation('walk', gait(0.6, 24, [34, 10], [40, 22], 0, 0, 0, 3));
    k.animation('run', gait(0.36, 36, [50, 14], [54, 26], 0.008, 8, 12, 8));
    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        spine: { move: [0, 0.004 * bump(p, 2), 0] },
        neck: { rotate: [3 * bump(p), 5 * wave(p, 1, 0.2), 0] },
        head: { rotate: [-3 * wave(p, 2, 0.1), 6 * wave(p, 1, 0.45), 3 * wave(p)] },
        tail: { rotate: [4 * wave(p, 1, 0.3), 20 * wave(p, 2), 0] },
        'wing.L': { rotate: [0, -3 * bump(p, 2), 3 * bump(p, 2)] },
        'wing.R': { rotate: [0, 3 * bump(p, 2), -3 * bump(p, 2)] },
      }),
    });

    // In the air the wing turns about its arm, so the flight feathers trail back flat instead of
    // hanging in the frontal plane of the rest pose; the front face (the underside) turns down.
    // `phi` is the arm's angle above the horizontal (world); motion.orient solves the turn under
    // the posed hips and spine. `open` (0 to 1) blends back toward the frontal rest plane, turned
    // `openZ` degrees up, so a spread wing shows its face (a roar, a flare, a wind-up).
    const WING_ARM = Math.hypot(WRIST[0], WRIST[1]);
    const REST_DIR: V3 = [(WRIST[0] / WING_ARM) * Math.cos((14 * Math.PI) / 180), WRIST[1] / WING_ARM, -(WRIST[0] / WING_ARM) * Math.sin((14 * Math.PI) / 180)];
    const REST_UP: V3 = [Math.sin((14 * Math.PI) / 180), 0, Math.cos((14 * Math.PI) / 180)];
    const flightWing = (parents: readonly Rot[], phi: number, sweep: number, open = 0, openZ = 0): [Rot, Rot] => {
      const r = (phi * Math.PI) / 180;
      const turn = motion.orient(parents as [number, number, number][], { dir: REST_DIR, up: REST_UP }, {
        dir: [Math.cos(r), Math.sin(r), -sweep],
        up: [Math.sin(r), -Math.cos(r), 0],
      });
      const q = open <= 0 ? turn : motion.euler(motion.quat(turn).slerp(motion.quat([0, 0, openZ]), open));
      return [q, [q[0], -q[1], -q[2]]];
    };

    // Flight: lifted 0.4 m and tilted forward, the wings beat through a full stroke, the body
    // rises on each downstroke, the front legs tuck under the chest, the hind legs trail, and the
    // tail trails and sways. The airborne clips (attack, hit, roar) are this pose with changes, so
    // they blend with the fly loop in the games, where the griffin is a mount.
    const FLY_Y = 0.4;
    interface Air {
      pitch?: number; // hips pitch added to the flight tilt (+ = nose down)
      lift?: number;
      z?: number;
      spine?: number;
      head?: number; // the head's world pitch (+ = beak down)
      shake?: number;
      jaw?: number; // 0 closed, 1 wide open
      spread?: number; // the wings held high
      amp?: number; // the wing-beat amplitude
      reach?: number; // 0 = talons tucked, 1 = talons forward
      tail?: number;
    }
    const air = (p: number, cycles: number, o: Air = {}): Pose => {
      const amp = o.amp ?? 1;
      const beat = amp * wave(p, cycles); // +1 at the top of the upstroke
      const rise = amp * wave(p, cycles, 0.25); // the body lags the wings by a quarter beat
      const pitch = 10 + (o.pitch ?? 0);
      const spine = o.spine ?? 0;
      const neck = -6;
      const reach = o.reach ?? 0;
      const hips: Rot = [pitch, 0, 0];
      const spread = o.spread ?? 0;
      const [wl, wr] = flightWing([hips, [spine, 0, 0]], 8 + 38 * beat + 34 * spread, 0.12, 0.8 * Math.max(0, spread), 12 + 30 * beat);
      const pose: Pose = {
        hips: { move: [0, FLY_Y + 0.03 * rise + (o.lift ?? 0), o.z ?? 0], rotate: hips },
        spine: { rotate: [spine, 0, 0] },
        neck: { rotate: [neck, 0, 0] },
        head: { rotate: [(o.head ?? 0) - pitch - spine - neck - 2 * rise, o.shake ?? 0, 0] },
        jaw: { rotate: [32 * (o.jaw ?? 0), 0, 0] },
        tail: { rotate: [-22 + (o.tail ?? 0) + 6 * wave(p, cycles, 0.4), 8 * wave(p, cycles, 0.3), 0] },
        'wing.L': { rotate: wl },
        'wing.R': { rotate: wr },
      };
      for (const side of ['L', 'R']) {
        pose[`fleg.${side}`] = { rotate: [-40 - 45 * reach + 4 * rise, 0, 0] };
        pose[`fshin.${side}`] = { rotate: [80 - 70 * reach, 0, 0] };
        pose[`bleg.${side}`] = { rotate: [40 - 4 * rise, 0, 0] };
        pose[`bshin.${side}`] = { rotate: [30, 0, 0] };
      }
      return pose;
    };
    k.animation('fly', { duration: 0.6, pose: (_t, p) => air(p, 1) });

    // The attack: a dive from the hover. It rears back and up with the wings held high and the
    // beak opening, then lunges forward and down with a hard downstroke, the talons thrown
    // forward and the beak snapping shut at the end of the lunge, and climbs back to the hover.
    const ATTACK: Record<string, Track> = {
      pitch: [[0, 0], [0.25, -22], [0.32, -24], [0.45, 22], [0.55, 18], [0.8, 0], [1, 0]],
      z: [[0, 0], [0.25, -0.05], [0.32, -0.05], [0.45, 0.14], [0.6, 0.12], [0.85, 0], [1, 0]],
      lift: [[0, 0], [0.25, 0.06], [0.32, 0.06], [0.45, -0.05], [0.6, -0.03], [0.85, 0], [1, 0]],
      reach: [[0, 0], [0.25, 0.6], [0.32, 0.7], [0.42, 1], [0.55, 1], [0.8, 0], [1, 0]],
      head: [[0, 0], [0.25, -14], [0.32, -16], [0.45, 18], [0.55, 10], [0.8, 0], [1, 0]],
      jaw: [[0, 0], [0.25, 0.6], [0.38, 1], [0.45, 0], [1, 0]],
      spread: [[0, 0], [0.25, 1], [0.32, 1], [0.42, -0.4], [0.55, 0], [1, 0]],
      amp: [[0, 1], [0.2, 0.2], [0.32, 0.2], [0.4, 1.2], [0.6, 1], [1, 1]],
      tail: [[0, 0], [0.25, 18], [0.32, 18], [0.45, -14], [0.6, -8], [0.85, 0], [1, 0]],
    };
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const v = (n: string) => keys(p, ATTACK[n]!);
        return air(p, 2, { pitch: v('pitch'), z: v('z'), lift: v('lift'), reach: v('reach'), head: v('head'), jaw: v('jaw'), spread: v('spread'), amp: v('amp'), tail: v('tail') });
      },
    });

    // A hit in the air: a jolt back and up, the head thrown back with a cry, the wings flared
    // high for a moment, the tail whipped down; then a quick return to the hover.
    k.animation('hit', {
      duration: 0.5,
      loop: false,
      pose: (_t, p) => {
        const s = keys(p, [[0, 0], [0.16, 1], [0.36, 0.8], [1, 0]]);
        const flare = keys(p, [[0, 0], [0.14, 1], [0.4, 0.4], [1, 0]]);
        return air(p, 1, { pitch: -18 * s, z: -0.06 * s, lift: 0.03 * s, head: -22 * s, shake: 8 * s * wave(p, 3), jaw: 0.7 * s, spread: 0.8 * flare, amp: 1 - 0.6 * flare, tail: -20 * s, reach: 0.3 * s });
      },
    });

    // A roar (a screech) in the air: it rears up with the talons forward and the wings high and
    // slow, throws the head up, then thrusts it forward with the beak wide and holds the screech
    // with a shake; then it settles back into the hover.
    const ROAR: Record<string, Track> = {
      rear: [[0, 0], [0.2, 1], [0.8, 1], [0.95, 0], [1, 0]],
      head: [[0, 0], [0.18, -30], [0.3, -12], [0.76, -12], [0.92, 0], [1, 0]],
      jaw: [[0, 0], [0.2, 0.3], [0.3, 1], [0.76, 1], [0.86, 0], [1, 0]],
      shake: [[0, 0], [0.3, 0], [0.34, 1], [0.72, 1], [0.78, 0], [1, 0]],
      amp: [[0, 1], [0.2, 0.45], [0.8, 0.45], [1, 1]],
    };
    k.animation('roar', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const v = (n: string) => keys(p, ROAR[n]!);
        const rear = v('rear');
        return air(p, 2, { pitch: -30 * rear, lift: 0.05 * rear, spine: -6 * rear, head: v('head'), shake: 6 * v('shake') * wave(p, 14), jaw: v('jaw'), spread: rear, amp: v('amp'), reach: 0.6 * rear, tail: 14 * rear });
      },
    });

    // Death, from standing: a cry with the head thrown back and the wings flared, then the legs
    // splay and give way and the body drops onto its belly, the wings fall open flat on the
    // ground, the neck sinks and the head comes to rest on its cheek, and the tail goes limp.
    // The hips height keeps the feet on or above the ground (motion.plant); the belly stops it.
    k.animation('death', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const cry = keys(p, [[0, 0], [0.1, 1], [0.24, 1], [0.34, 0]]);
        const give = keys(p, [[0.22, 0], [0.5, 1]]);
        const drop = keys(p, [[0.26, 0], [0.5, 1], [0.56, 0.94], [0.62, 1]]);
        const slump = keys(p, [[0.4, 0], [0.7, 1]]);
        const wings = keys(p, [[0.3, 0], [0.62, 1], [0.68, 0.95], [0.74, 1]]);
        const out = 72 * give;
        const hips: Rot = [-6 * cry + 4 * drop, 0, 0];
        const pose: Pose = {
          hips: { rotate: hips },
          spine: { rotate: [-6 * cry, 0, 0] },
          neck: { rotate: [-16 * cry + 62 * slump, 0, 8 * slump] },
          head: { rotate: [-26 * cry - 40 * slump, 0, 34 * slump] },
          jaw: { rotate: [30 * cry, 0, 0] },
          tail: { rotate: [-30 * give, 16 * slump, 0] },
          'fleg.L': { rotate: [-10 * give, 0, out] },
          'fshin.L': { rotate: [10 * give, 0, -22 * give] },
          'fleg.R': { rotate: [-10 * give, 0, -out] },
          'fshin.R': { rotate: [10 * give, 0, 22 * give] },
          'bleg.L': { rotate: [10 * give, 0, out] },
          'bshin.L': { rotate: [-10 * give, 0, -22 * give] },
          'bleg.R': { rotate: [10 * give, 0, -out] },
          'bshin.R': { rotate: [-10 * give, 0, 22 * give] },
        };
        const [wl, wr] = flightWing([hips, [-6 * cry, 0, 0]], -14, 0.2, 1 - wings, 22 * cry);
        pose['wing.L'] = { rotate: wl };
        pose['wing.R'] = { rotate: wr };
        const belly = -0.165 * drop;
        pose.hips = { ...pose.hips, move: [0, Math.max(belly, motion.plant(chains(pose))), -0.02 * cry] };
        return pose;
      },
    });
  },
});
