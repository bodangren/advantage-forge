import { defineAsset, motion, profile, rgb, sdf } from '../src/index.js';

/**
 * Elementalist — Chibi Quest hero (catalog `heroes/magic/elementalist`), about 1.0 m to the top
 * of the hair, faces +Z. Target: docs/hero-mockups/elementalist_001.jpg. The mockup shows an old
 * bearded man; this elementalist is young and beardless (the rogue's round hero face).
 * Built on the mage's body, skeleton (without hat and cape bones), and clip set.
 *
 * One idea: a robe split down the middle, ice blue on his left (+X) and flame orange on his
 *   right (-X), with a spike of ice on the left palm and a ball of fire on the right palm.
 * Shape language: round and soft body; sharp cones (ice) and curling tongues (fire) as accents.
 * Palette (60/30/10): white hair #f0ece4, blue half #4a9ad8 and orange half #e8783a (equal
 *   halves), gold rings and seam #e0b040; brown boots and rope belt; fire and ice glow.
 * Value plan: the white hair and the two glowing hands are the lightest points; the robe halves
 *   are mid values; the boots and under-robe are the darkest.
 * Rig: the mage's skeleton (`skirt` below the belt, knee `shin` bones); `orb` (fire) under
 *   `hand.R` and `ice` under `hand.L`.
 *   Clips: idle, walk, run, attack (a fire throw), attack2 (an ice thrust), hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#3a2210',
  iris: '#b8742a',
  irisLow: '#e8a860',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#9a8c7a',
  mouth: '#a4503f',
  hair: '#f0ece4',
  hairGroove: '#c8c4bc',
  blue: '#4a9ad8',
  blueDark: '#2f6aa8',
  orange: '#e8783a',
  orangeDark: '#b84a1c',
  under: '#3c4658',
  gold: '#e0b040',
  rope: '#8a7a5a',
  ropeDark: '#6a5a3e',
  boot: '#5a3a24',
  sole: '#3a2418',
  iceBase: '#205070',
  ice: '#a0e0ff',
  fireBase: '#5a1a05',
  fire: '#ff8a2c',
  fireCore: '#ffe060',
  fireCoreBase: '#5a4a10',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. Both arms come forward and out, the palms open and up at chest height.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.215, 0.355, 0.02];
const WRIST_L: V3 = [0.292, 0.35, 0.1];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const ELBOW_R = mx(ELBOW_L);
const WRIST_R = mx(WRIST_L);
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

const rad = Math.PI / 180;
const rotY = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};

/** An open hand, palm up, pointing along +X (s = 1) or -X (s = -1) from the wrist at the origin. */
const openHand = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.012,
    sdf.ellipsoid([0.046, 0.02, 0.04]).at(0.04 * s, 0, 0.004),
    ...[-0.024, -0.008, 0.008, 0.024].map((z, i) =>
      sdf.capsule([0.07 * s, 0.002, z], [(0.098 - Math.abs(i - 1.5) * 0.006) * s, 0.016, z * 1.1], 0.0105),
    ),
    sdf.capsule([0.03 * s, 0.006, 0.036], [0.058 * s, 0.022, 0.052], 0.012),
  );
const YAW_L = -40;
const YAW_R = 40;
const handL = (sh: sdf.Shape) => sh.rotateY(YAW_L).at(...WRIST_L);
const handR = (sh: sdf.Shape) => sh.rotateY(YAW_R).at(...WRIST_R);
/** The center of each open palm, and the base of the ice and the fire above it. */
const PALM_L: V3 = add(WRIST_L, rotY([0.045, 0.02, 0.002], YAW_L));
const PALM_R: V3 = add(WRIST_R, rotY([-0.045, 0.02, 0.002], YAW_R));
const FLAME_H = 0.17;
const ORB: V3 = add(PALM_R, [0, 0.06, 0]);
const ICE_AT: V3 = add(PALM_L, [0, 0.05, 0]);

/** A flame: a round base that rises into curling tongues. `h` is its height. */
const flame = (h: number) =>
  sdf.smoothUnion(
    h * 0.08,
    sdf.sphere(h * 0.3).at(0, h * 0.3, 0),
    sdf.chain(
      [
        [0, h * 0.35, 0, h * 0.28],
        [h * 0.05, h * 0.7, 0, h * 0.16],
        [-h * 0.04, h, 0, h * 0.03],
      ],
      h * 0.1,
    ),
    sdf.chain(
      [
        [h * 0.14, h * 0.4, 0.0, h * 0.13],
        [h * 0.34, h * 0.66, 0, h * 0.07],
        [h * 0.32, h * 0.9, 0, h * 0.018],
      ],
      h * 0.06,
    ),
    sdf.chain(
      [
        [-h * 0.15, h * 0.36, 0, h * 0.12],
        [-h * 0.34, h * 0.58, 0.02 * h, h * 0.06],
        [-h * 0.36, h * 0.8, 0, h * 0.016],
      ],
      h * 0.06,
    ),
    sdf.chain(
      [
        [0.02 * h, h * 0.36, h * 0.12, h * 0.1],
        [0.03 * h, h * 0.6, h * 0.24, h * 0.05],
        [0.02 * h, h * 0.76, h * 0.2, h * 0.014],
      ],
      h * 0.05,
    ),
  );

export default defineAsset({
  name: 'elementalist',
  description: 'Chibi young elementalist hero with white swept hair, a robe split ice blue and flame orange, a spike of ice in one hand and a ball of fire in the other.',
  detail: 0.006,
  reference: 'docs/hero-mockups/elementalist_001.jpg',
  // Color slots for individual elementalists (the first option is the default look). The orange
  // half, the gold, the rope, the boots, the fire, and the ice are not in a slot.
  variants: {
    eyes: { amber: C.iris, blue: '#2f6aa8', green: '#3d7a45' },
    hair: { white: C.hair, black: '#2a2426', auburn: '#7a3a22' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { blue: C.blue, violet: '#6a4a9e', green: '#2e7a3c' },
  },
  presets: {
    default: { eyes: 'amber', hair: 'white', skin: 'fair', clothing: 'blue' },
    violet: { eyes: 'blue', hair: 'black', skin: 'tan', clothing: 'violet' },
    green: { eyes: 'green', hair: 'auburn', skin: 'brown', clothing: 'green' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      groove: k.tint('hair', { color: C.hairGroove, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
      clothDark: k.tint('clothing', { color: C.blueDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      skirt: { parent: 'hips', at: [0, 0.25, 0], tail: [0, 0.1, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      ice: { parent: 'hand.L', at: ICE_AT },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      orb: { parent: 'hand.R', at: ORB },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.018, 0.014, 0.014]).at(0, 0.568, faceZ(0, 0.568) - 0.004).bone('head');
    // Small round human ears.
    const ears = pair(
      sdf
        .ellipsoid([0.027, 0.04, 0.03])
        .subtract(sdf.sphere(0.016).at(0.015, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      handR(openHand(-1)).bone('hand.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      handL(openHand(1)).bone('hand.L'),
    );

    // The hero face: big eyes, a serious brow (inner ends low), a small flat mouth.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.014, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    const brows = pair(
      sdf.extrude(profile.arc(0.1, 0.026, 60, 120), 0.3).rotateZ(8).at(0.1, 0.742 - 0.1, 0.1),
    );
    const mouth = sdf.extrude(profile.arc(0.16, 0.012, 246, 294), 0.3).at(0, 0.53 + 0.16, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.138, 0.562));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armR, armL)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair
    // Soft white waves: a cap 0.012 larger than the skull, 15 short curved locks laid over the
    // whole skull and swept back and toward +X (10 to 25 degrees of jitter), three fringe locks
    // over the brow, sideburns, and a short back. The top stays 0.04 m above the skull.
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.012, HEAD[2] + 0.012])
      .at(0, HEAD_Y, -0.006)
      .intersect(sdf.halfSpace([0, -1, 0], -0.63))
      .smoothSubtract(0.015, sdf.ellipsoid([0.23, 0.15, 0.22]).at(0, 0.625, 0.13));
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.012);
    const HC: V3 = [0, HEAD_Y, -0.006];
    const HR: V3 = [HEAD[0] + 0.02, HEAD[1] + 0.02, HEAD[2] + 0.02];
    // Pull a point onto the skull's shell (the cap's surface, where a lock lies).
    const onShell = (p: V3): V3 => {
      const q = [(p[0] - HC[0]) / HR[0], (p[1] - HC[1]) / HR[1], (p[2] - HC[2]) / HR[2]] as const;
      const l = Math.hypot(q[0], q[1], q[2]);
      return [HC[0] + (q[0] / l) * HR[0], HC[1] + (q[1] / l) * HR[1], HC[2] + (q[2] / l) * HR[2]];
    };
    const STARTS: [number, number][] = [
      [20, 62], [-25, 58], [60, 50], [-65, 48], [95, 45], [-100, 42], [135, 40], [-140, 38],
      [160, 55], [-170, 55], [45, 75], [-50, 78], [0, 84], [110, 68], [-120, 66],
    ];
    const waves = sdf.union(
      ...STARTS.map(([az, el], n) => {
        const a = az * rad;
        const e = el * rad;
        const p0 = onShell([HC[0] + HR[0] * Math.cos(e) * Math.sin(a), HC[1] + HR[1] * Math.sin(e), HC[2] + HR[2] * Math.cos(e) * Math.cos(a)]);
        // Back (-Z) and toward +X, turned by 10 to 25 degrees of jitter.
        const jitter = (n % 2 === 0 ? 1 : -1) * (10 + ((n * 7) % 16)) * rad;
        const d = norm([0.3 * Math.cos(jitter) + Math.sin(jitter), 0.05, -Math.cos(jitter)]);
        const p1 = onShell(add(p0, [d[0] * 0.032, d[1] * 0.032, d[2] * 0.032]));
        const d2 = norm(sub(add(p1, [d[0] * 0.03, d[1] * 0.03 + 0.008, d[2] * 0.03]), p0));
        const p2 = onShell(add(p1, [d2[0] * 0.032, d2[1] * 0.032, d2[2] * 0.032]));
        return lock([[...p0, 0.028], [...p1, 0.028], [...p2, 0.018]]);
      }),
    );
    const fringe = sdf.union(
      pair(lock([[0.11, 0.82, 0.15, 0.034], [0.07, 0.79, 0.19, 0.028], [0.025, 0.772, 0.2, 0.016]])),
      lock([[0.0, 0.83, 0.16, 0.034], [0.045, 0.795, 0.19, 0.028], [0.075, 0.775, 0.192, 0.016]]),
    );
    const trims = sdf.union(
      pair(lock([[0.17, 0.72, 0.09, 0.04], [0.2, 0.68, 0.05, 0.03], [0.205, 0.65, 0.03, 0.016]])),
      pair(lock([[0.1, 0.7, -0.16, 0.06], [0.12, 0.62, -0.16, 0.05], [0.1, 0.55, -0.13, 0.03]])),
      lock([[0.0, 0.7, -0.17, 0.08], [0.0, 0.6, -0.17, 0.07], [0.0, 0.52, -0.14, 0.04]]),
    );
    const hair = sdf
      .smoothUnion(0.012, cap, waves, fringe, trims)
      .paintFn((x, y, z, base) => (y < 0.6 ? rgb(T.groove) : base));
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.005, bone: 'head' });

    // ------------------------------------------------------------------ robe: split blue and orange
    const robeShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.126, 0.29],
            [0.134, 0.25],
            [0.158, 0.2],
            [0.186, 0.15],
            [0.21, 0.118],
            [0.2, 0.106],
            [0, 0.106],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 9) * Math.min(1, Math.max(0, (0.32 - y) / 0.14));
    const orange = rgb(C.orange);
    const orangeDark = rgb(C.orangeDark);
    const gold = rgb(C.gold);
    // The left half (+X) is the clothing slot; the right half is orange; a gold seam splits them.
    const splitPaint = (x: number, y: number, z: number, base: readonly [number, number, number]) => {
      if (Math.abs(x) < 0.006 && y > 0.1) return gold;
      const fold = folds(x, y, z) < -0.55;
      if (x < 0) return fold ? orangeDark : orange;
      return fold ? rgb(T.clothDark) : base;
    };
    const robe = robeShape.displace(0.006, folds).paintFn(splitPaint);
    const above = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, -1, 0], -y));
    const below = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, 1, 0], y));
    k.body('robe', sdf.union(above(robe, 0.25).bone('spine'), below(robe, 0.25).bone('skirt')), { color: T.cloth, roughness: 0.85 });
    // The dark under-robe shows below the hem, over the boot tops.
    const under = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.118, 0.3],
            [0.14, 0.21],
            [0.166, 0.15],
            [0.19, 0.09],
            [0.192, 0.078],
            [0.18, 0.07],
            [0, 0.07],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.8]);
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.1, 0.004], 0.045).bone('leg.L')),
    );
    k.body('tunic', sdf.union(above(under, 0.25).bone('spine'), below(under, 0.25).bone('skirt'), legs), { color: C.under, roughness: 0.85 });

    // A soft collar around the neck, split like the robe, dipping in front.
    const collar = sdf
      .smoothUnion(
        0.03,
        sdf.torus(0.1, 0.038).scale([1.2, 1, 1.05]).rotateX(12).at(0, 0.448, -0.008),
        sdf.ellipsoid([0.08, 0.05, 0.034]).at(0, 0.41, 0.09),
      )
      .subtract(sdf.cylinder(0.06, 0.2).at(0, 0.5, -0.01))
      .paintFn(splitPaint);
    k.body('collar', collar.bone('chest'), { color: T.cloth, roughness: 0.85 });

    // ------------------------------------------------------------------ wide sleeves (split the same way)
    const sleeve = (s: V3, e: V3, w: V3, tagU: string, tagF: string) => {
      const end = lerp(e, w, 0.92);
      const axis = norm(sub(w, e));
      return sdf
        .smoothUnion(
          0.02,
          sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.05, 0.056).bone(tagU),
          sdf.cone(e, end, 0.056, 0.088).bone(tagF),
        )
        .subtract(sdf.cone(lerp(e, w, 0.55), add(end, [axis[0] * 0.1, axis[1] * 0.1, axis[2] * 0.1]), 0.05, 0.078));
    };
    const sleeves = sdf
      .union(sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'))
      .paintFn(splitPaint);
    k.body('sleeves', sleeves, { color: T.cloth, roughness: 0.85 });

    // ------------------------------------------------------------------ rope belt
    const beltY = 0.262;
    const ropeAt = (y: number, r: number, tube: number) =>
      sdf
        .torus(r, tube)
        .scale([1, 1, 0.8])
        .at(0, y, 0)
        .displace(0.0035, (x, yy, z) => Math.sin(Math.atan2(z, x) * 26 + Math.atan2(yy - y, Math.hypot(x, z) - r) * 1));
    const knotZ = 0.134 * 0.8 + 0.012;
    const rope = sdf
      .smoothUnion(
        0.008,
        ropeAt(beltY - 0.012, 0.137, 0.017),
        ropeAt(beltY + 0.016, 0.135, 0.017),
        sdf.sphere(0.02).at(0.03, beltY, knotZ),
        sdf.capsule([0.03, beltY, knotZ], [0.036, beltY - 0.07, knotZ + 0.004], 0.012),
        sdf.capsule([0.03, beltY, knotZ], [0.052, beltY - 0.06, knotZ - 0.004], 0.011),
      )
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 26) < -0.7 ? rgb(C.ropeDark) : base));
    k.body('rope', rope.bone('spine'), { color: C.rope, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ gold shoulder rings
    const ringAt = (t: number) => {
      const c = lerp(SHOULDER, ELBOW_L, t);
      const d = norm(sub(ELBOW_L, SHOULDER));
      // Turn the ring's axis (Y) onto the upper-arm direction.
      const tiltZ = Math.atan2(d[0], d[1]) / rad;
      const tiltX = -Math.atan2(d[2], Math.hypot(d[0], d[1])) / rad;
      return sdf.torus(0.05, 0.012).rotateX(tiltX).rotateZ(-tiltZ).at(c[0], c[1] + 0.005, c[2]);
    };
    const pad = sdf.ellipsoid([0.055, 0.03, 0.055]).at(SHOULDER[0] + 0.03, 0.405, 0);
    k.body('rings', pair(sdf.union(ringAt(0.15), pad).bone('upperarm.L')), {
      color: C.gold,
      roughness: 0.4,
      metalness: 0.7,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ boots
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.085, 0.02).at(0, 0.065, 0),
        sdf.ellipsoid([0.058, 0.052, 0.1]).at(0, 0.05, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf
      .union(bootFoot, sdf.cylinder(0.058, 0.026, 0.01).at(0, 0.1, 0).paint(C.sole))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the fire (right palm)
    // An outer orange flame with curling tongues and an inner yellow core, just above the palm.
    const flameBase: V3 = add(PALM_R, [0, 0.008, 0]);
    k.body('fire', flame(FLAME_H).scale([1.5, 1, 1.5]).at(...flameBase), {
      color: '#6a2a00',
      roughness: 0.4,
      emissive: C.fire,
      emissiveIntensity: 1.6,
      opacity: 0.8,
      detail: 0.0035,
      bone: 'orb',
    });
    k.body('fire-core', flame(FLAME_H * 0.72).scale([1.4, 1, 1.4]).at(flameBase[0], flameBase[1] + 0.006, flameBase[2]), {
      color: '#7a5000',
      roughness: 0.4,
      emissive: C.fireCore,
      emissiveIntensity: 1.8,
      detail: 0.0035,
      bone: 'orb',
    });

    // ------------------------------------------------------------------ the ice (left palm)
    // One translucent flame-shaped mass with side tongues, a pale core, and two small crystal
    // spikes at the top.
    const iceBase: V3 = add(PALM_L, [0, 0.008, 0]);
    const ICE_H = 0.17;
    const iceTop = (dx: number, dz: number, h: number, r: number) => {
      const b: V3 = [iceBase[0] + dx, iceBase[1] + ICE_H * 0.86, iceBase[2] + dz];
      return sdf.cone(b, [b[0] + dx * 0.4, b[1] + h, b[2] + dz * 0.4], r, 0.003);
    };
    const iceShape = sdf.smoothUnion(
      0.012,
      flame(ICE_H).scale([1.35, 1, 1.35]).at(...iceBase),
      iceTop(0.005, 0, 0.055, 0.016),
      iceTop(-0.012, 0.006, 0.04, 0.013),
    );
    k.body('ice-spike', iceShape, {
      color: C.iceBase,
      roughness: 0.15,
      emissive: C.ice,
      emissiveIntensity: 0.8,
      opacity: 0.8,
      detail: 0.0035,
      bone: 'ice',
    });
    k.body('ice-core', flame(ICE_H * 0.6).scale([1.25, 1, 1.25]).at(iceBase[0], iceBase[1] + 0.006, iceBase[2]), {
      color: '#3a6a88',
      roughness: 0.2,
      emissive: '#e4f8ff',
      emissiveIntensity: 1.4,
      detail: 0.0035,
      bone: 'ice',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const flicker = (p: number) => ({
      orb: { scale: [1 + 0.06 * wave(p, 7), 1 + 0.1 * wave(p, 5, 0.2), 1 + 0.06 * wave(p, 7, 0.4)] as const },
      ice: { scale: [1, 1 + 0.02 * wave(p, 3), 1] as const },
    });

    // Posing by targets: the wrists follow keys in the chest's rest frame (reach); each hand turns
    // so its finger direction and its palm-up axis point where wanted (orient).
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const REST_L = { dir: rotY([1, 0, 0], YAW_L), up: [0, 1, 0] as V3 };
    const REST_R = { dir: rotY([-1, 0, 0], YAW_R), up: [0, 1, 0] as V3 };
    const poseL = (wrist: V3, dir: V3 = REST_L.dir, up: V3 = REST_L.up, pole: V3 = [0.5, 0.1, -0.3]) => {
      const a = reach(ARM_L, wrist, pole);
      const h = orient([a.upper, a.lower], REST_L, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: a.upper }, 'forearm.L': { rotate: a.lower }, 'hand.L': { rotate: h } };
    };
    const poseR = (wrist: V3, dir: V3 = REST_R.dir, up: V3 = REST_R.up, pole: V3 = [-0.5, 0.1, -0.3]) => {
      const a = reach(ARM_R, wrist, pole);
      const h = orient([a.upper, a.lower], REST_R, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: a.upper }, 'forearm.R': { rotate: a.lower }, 'hand.R': { rotate: h } };
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        ...flicker(p),
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        skirt: { rotate: [1.5 * wave(p, 1, 0.2), 0, 0] },
        ...poseL(add(WRIST_L, [0, 0.008 * wave(p, 1, 0.1), 0])),
        ...poseR(add(WRIST_R, [0, 0.008 * wave(p, 1, 0.6), 0])),
      }),
    });

    // Both hands are busy, so the arms swing little; the robe skirt carries the motion. The legs
    // come from motion.gait.
    const stride = (duration: number, step: number, lift: number, duty: number, hop: number, armSwing: number, lean: number, flow: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          heel: [0.094, 0, -0.015],
          toe: [0.111, 0, 0.093],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...flicker(p),
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          skirt: { rotate: [flow * 0.25 + 3 * wave(p, 2, 0.1), -9 * wave(p, 1, 0.12), 4 * wave(p, 1, 0.3)] as const },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          ...poseL(add(WRIST_L, [0, 0.006 * wave(p, 2), armSwing * 0.0007 * s])),
          ...poseR(add(WRIST_R, [0, 0.006 * wave(p, 2, 0.5), -armSwing * 0.0007 * s])),
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.6, 0.006, 28, 3, 6));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.4, 0.025, 50, 12, 22));

    // attack: a fire throw. The right hand draws back and up (the fire grows), holds, then
    // thrusts forward; the fire flies 0.35 m ahead, gutters out, and relights in the palm.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const gather = ease(0.02, 0.28, p) * (1 - ease(0.42, 0.5, p));
        const cast = ease(0.42, 0.52, p) * (1 - ease(0.7, 1, p));
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.28, [-0.37, 0.4, 0.02]],
            [0.4, [-0.37, 0.405, 0.01]],
            [0.46, [-0.4, 0.38, 0.16]],
            [0.5, [-0.37, 0.375, 0.26]],
            [0.64, [-0.34, 0.37, 0.26]],
            [0.84, [-0.3, 0.365, 0.12]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const size = keys(p, [[0, 1], [0.28, 1.0], [0.42, 1.0], [0.52, 1.0], [0.6, 1.0], [0.66, 0.05], [0.8, 0.05], [0.95, 1]] as const);
        const fly = ease(0.5, 0.62, p) * (1 - ease(0.66, 0.68, p));
        return {
          ...poseR(wrist),
          ...poseL(keys(p, [[0, WRIST_L], [0.3, [0.285, 0.335, 0.06]], [0.6, [0.29, 0.345, 0.1]], [1, WRIST_L]] as const)),
          orb: { scale: [size, size, size], move: [0, 0.03 * fly, 0.35 * fly] },
          ice: { scale: [1, 1, 1] },
          hips: {
            move: [0, -legDrop(LEG, 14 * cast) - 0.005 * cast, 0.025 * cast - 0.01 * gather],
            rotate: [0, -12 * gather + 4 * cast, 0],
          },
          skirt: { rotate: [-3 * gather + 6 * cast, 6 * gather - 6 * cast, 0] },
          spine: { rotate: [-5 * gather + 4 * cast, 0, 0] },
          chest: { rotate: [-3 * gather + 5 * cast, -8 * gather + 4 * cast, 0] },
          head: { rotate: [4 * gather - 2 * cast, 6 * gather - 10 * cast, 0] },
          'leg.L': { rotate: [2 * gather - 16 * cast, 0, 0] },
          'leg.R': { rotate: [-2 * gather + 10 * cast, 0, 0] },
          'foot.L': { rotate: [10 * cast, 0, 0] },
          'foot.R': { rotate: [-5 * cast, 0, 0] },
        };
      },
    });

    // attack2: an ice thrust. The left hand draws back, the palm turns so the ice points forward,
    // then the arm thrusts and the ice grows as it drives ahead; it settles back on the palm.
    k.animation('attack2', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.4, 0.48, p));
        const push = ease(0.4, 0.5, p) * (1 - ease(0.72, 1, p));
        const turn = ease(0.02, 0.36, p) * (1 - ease(0.72, 1, p));
        const wrist = keys(
          p,
          [
            [0, WRIST_L],
            [0.3, [0.33, 0.37, 0.03]],
            [0.4, [0.33, 0.375, 0.02]],
            [0.5, [0.23, 0.385, 0.22]],
            [0.7, [0.23, 0.38, 0.22]],
            [1, WRIST_L],
          ] as const,
          'spline',
        );
        const dir = lerp(REST_L.dir, norm([1, 0.1, 0.15]), turn);
        const up = lerp(REST_L.up, [0.05, 0.25, 1], turn);
        const grow = keys(p, [[0, 1], [0.3, 1.05], [0.42, 1.15], [0.5, 1.5], [0.7, 1.4], [1, 1]] as const);
        return {
          ...poseL(wrist, dir, up),
          ...poseR(keys(p, [[0, WRIST_R], [0.3, [-0.29, 0.335, 0.06]], [0.6, [-0.29, 0.345, 0.1]], [1, WRIST_R]] as const)),
          ...flicker(p),
          ice: { scale: [grow, grow, grow] },
          hips: {
            move: [0, -legDrop(LEG, 14 * push) - 0.004 * push, 0.025 * push - 0.01 * wind],
            rotate: [0, 8 * wind - 6 * push, 0],
          },
          skirt: { rotate: [-2 * wind + 5 * push, -4 * wind + 4 * push, 0] },
          spine: { rotate: [-4 * wind + 8 * push, 0, 0] },
          chest: { rotate: [-2 * wind + 4 * push, 8 * wind - 6 * push, 0] },
          head: { rotate: [2 * wind - 6 * push, -8 * wind + 6 * push, 0] },
          'leg.L': { rotate: [2 * wind - 16 * push, 0, 0] },
          'leg.R': { rotate: [-2 * wind + 10 * push, 0, 0] },
          'foot.L': { rotate: [10 * push, 0, 0] },
        };
      },
    });

    // hit: the head and chest snap back, a small step back, the hands tip out, the fire gutters.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = ease(0, 0.18, p) * (1 - ease(0.35, 1, p));
        const f = 1 - 0.35 * h;
        return {
          ...poseR(lerp(WRIST_R, [-0.31, 0.36, 0.04], h)),
          ...poseL(lerp(WRIST_L, [0.32, 0.36, 0.04], h)),
          orb: { scale: [f, f, f] },
          hips: { move: [0, -0.005 * h, -0.025 * h], rotate: [0, -6 * h, 0] },
          skirt: { rotate: [6 * h, 0, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, -6 * h, 3 * h] },
          head: { rotate: [-14 * h, 8 * h, -5 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger, then he falls flat on his back; the fire and the ice go out and the arms
    // drop to his sides. The hips drop below the floor on purpose: the build lifts the body until
    // it rests on the floor.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.16)));
        const out = 1 - 0.95 * ease(0.3, 0.6, p);
        const drop = ease(0.45, 0.72, p);
        const leg = 30 * bump(fall) + 6 * fall;
        const hipsMove: V3 = [0, -0.14 * drop + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall];
        const bend = [-76 * fall - 4 * stagger, -6 * stagger, -4 * stagger, -5 * fall, -16 * stagger - 14 * fall];
        const flop = ease(0.2, 0.66, p);
        return {
          ...poseR(lerp(WRIST_R, [-0.26, 0.34, -0.09], flop), REST_R.dir, lerp(REST_R.up, [0, 0.3, 1], flop), [-0.3, 0.2, -0.4]),
          ...poseL(lerp(WRIST_L, [0.26, 0.34, -0.09], flop), REST_L.dir, lerp(REST_L.up, [0, 0.3, 1], flop), [0.3, 0.2, -0.4]),
          orb: { scale: [out, out, out] },
          ice: { scale: [out, out, out] },
          hips: { move: hipsMove, rotate: [bend[0]!, 0, 0] },
          skirt: { rotate: [8 * stagger + leg - 20 * fall, 0, 0] },
          spine: { rotate: [bend[1]!, 0, 0] },
          chest: { rotate: [bend[2]!, 0, 0] },
          neck: { rotate: [bend[3]!, 0, 0] },
          head: { rotate: [bend[4]!, 0, 0] },
          'leg.L': { rotate: [6 * stagger + leg, 0, 4 * fall] },
          'leg.R': { rotate: [-6 * stagger + leg + 2 * fall, 0, -5 * fall] },
          'foot.L': { rotate: [-14 * fall, 0, 0] },
          'foot.R': { rotate: [-18 * fall, 0, 0] },
        };
      },
    });

    // victory (a hop): an anticipation crouch, a push-off, a hop of about 8 cm, and a landing that
    // the knees absorb. In the push-off both hands rise up and out and the fire and ice flare.
    const V_JUMP = 0.08;
    const V_DROP = 0.04;
    const [V_OFF, V_LAND] = [0.28, 0.48];
    const LEGS = { hip: HIP, knee: KNEE, ankle: ANKLE };
    k.animation('victory', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const pump = bump(Math.min(1, Math.max(0, (p - 0.52) / 0.4)), 2);
        let h: number;
        if (p < 0.2) h = -V_DROP * ease(0, 0.17, p);
        else if (p < V_OFF) h = -V_DROP * (1 - ((p - 0.2) / (V_OFF - 0.2)) ** 2);
        else if (p < V_LAND) h = (4 * V_JUMP * (p - V_OFF) * (V_LAND - p)) / (V_LAND - V_OFF) ** 2;
        else if (p < 0.56) h = -0.03 * Math.sin(((Math.PI / 2) * (p - V_LAND)) / (0.56 - V_LAND));
        else h = -0.03 * keys(p, [[0.56, 1], [0.66, 0.1], [0.72, 0.22], [0.84, 0]] as const);
        h -= 0.006 * pump;
        const bend = Math.max(0, -h) / V_DROP;
        const air = Math.max(0, h) / V_JUMP;
        const flight = p > V_OFF && p < V_LAND ? Math.sin((Math.PI * (p - V_OFF)) / (V_LAND - V_OFF)) : 0;
        const lift = Math.max(0, h) + 0.02 * flight;
        const pitch = Math.min(24, lift / 0.0022);
        const hips = { at: [0, 0.2, 0] as V3, move: [0, h, -0.2 * Math.max(0, -h)] as V3 };
        const legL = motion.legTo('L', LEGS, [ANKLE[0], ANKLE[1] + lift, 0], { hips, pitch });
        const legR = motion.legTo('R', LEGS, [-ANKLE[0], ANKLE[1] + lift, 0], { hips, pitch });
        const up = ease(0.18, 0.4, p);
        const f = 1 + 0.08 * up;
        return {
          ...poseR(add(lerp(WRIST_R, [-0.56, 0.44, 0.1], up), [0, 0.02 * pump, 0]), REST_R.dir, REST_R.up, [-0.5, 0.1, -0.3]),
          ...poseL(add(lerp(WRIST_L, [0.56, 0.44, 0.1], up), [0, 0.02 * pump, 0]), REST_L.dir, REST_L.up, [0.5, 0.1, -0.3]),
          orb: { scale: [f, f, f] },
          ice: { scale: [f, f, f] },
          hips: { move: hips.move },
          skirt: { rotate: [-7 * bend - 5 * air + 3 * pump, 0, 0] },
          spine: { rotate: [8 * bend - 3 * air - 5 * up, 0, 0] },
          chest: { rotate: [4 * bend - 4 * up - 3 * pump, 5 * up, 0] },
          head: { rotate: [-4 * bend - 8 * up, 2 * up, 0] },
          'leg.L': { rotate: legL.leg },
          'shin.L': { rotate: legL.shin },
          'foot.L': { rotate: legL.foot },
          'leg.R': { rotate: legR.leg },
          'shin.R': { rotate: legR.shin },
          'foot.R': { rotate: legR.foot },
        };
      },
    });
  },
});
