import { defineAsset, motion, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Swashbuckler: Chibi Quest hero (catalog `heroes/martial/swashbuckler`), 1.0 m to the top of the
 * hair, faces +Z, on the rogue base (skeleton with knees, face, sliding gait, variant tints).
 * Target: docs/hero-mockups/swashbuckler_001.jpg, with no beard (the young round hero face).
 *
 * Role: player hero, seen in 3D and as a 128 px sprite; the bandana, the open shirt with the dark
 *   vest, the teal sash, and the raised rapier must read small.
 * One idea: a cocky dashing pirate duelist: red bandana over a fan of thick dark locks, a raised
 *   rapier beside the head, a teal sash.
 * Shape language: round and soft (head, cheeks, fists, boots) with sharp accents (bandana tails,
 *   collar points, rapier, dagger).
 * Palette (60/30/10): cream shirt #f4ecd8 and brown leather/trousers/boots; dark vest #2e2a30 and
 *   dark hair #3a2418; accents red bandana #c93a32, teal sash #3fa0a0, brass and gold.
 * Bodies: skin, hair, bandana, shirt, vest, sash, leather, brass, gold, holster, pants, boots,
 *   a rapier and a dagger (rigid on `knife.R` and `knife.L`).
 * Rig: the chibi skeleton (the `cloak` bone stays unused). The right arm holds the rapier high
 *   (its rest pose is raised); the left hand holds the dagger low. Clips idle, walk, run, attack
 *   (rapier lunge), attack2 (dagger and rapier cross slash), hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#a8702f',
  pupil: '#141a18',
  lid: '#1c130f',
  mouth: '#a4503f',
  hair: '#3a2418',
  hairDark: '#241608',
  brow: '#2a1810',
  bandana: '#c93a32',
  bandanaFold: '#8a2420',
  gold: '#e0b040',
  shirt: '#f4ecd8',
  shirtFold: '#d8d0bc',
  vest: '#2e2a30',
  sash: '#3fa0a0',
  sashFold: '#2a7a7a',
  belt: '#6b4226',
  brass: '#c9a24a',
  holster: '#4e2d1c',
  pants: '#6b4a30',
  boot: '#5a3a24',
  cuff: '#7a5a44',
  sole: '#3a2518',
  blade: '#c8ccd0',
  grip: '#4a3022',
};

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Arm joints, left side (x > 0). The right arm is raised at rest: the fist holds the rapier high.
const ARMS = {
  L: { S: [0.13, 0.385, 0], E: [0.18, 0.332, 0.012], W: [0.205, 0.238, 0.03], G: [0.232, 0.172, 0.022] },
  R: { S: [0.13, 0.385, 0], E: [0.19, 0.352, 0.02], W: [0.225, 0.346, 0.095], G: [0.235, 0.332, 0.122] },
} as const;
// The grips: the turn of the held blade in the fist (degrees).
const GRIPS = {
  L: { lean: 26, back: -42, roll: 50 }, // the dagger points forward, up, and out
  R: { lean: 9, back: 0, roll: 0 }, // the rapier stands point up, leaning out a little
} as const;

export default defineAsset({
  name: 'swashbuckler',
  description: 'Chibi swashbuckler hero: red bandana, swept dark locks, open shirt, dark vest, teal sash, rapier and dagger.',
  detail: 0.006,
  reference: 'docs/hero-mockups/swashbuckler_001.jpg',
  variants: {
    eyes: { brown: C.iris, green: '#3d7a35', blue: '#2f6aa8' },
    hair: { brown: C.hair, black: '#231a17', auburn: '#8e3b1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { red: C.bandana, blue: '#2f58b8', green: '#2e7a3c' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', clothing: 'red' },
    blue: { eyes: 'blue', hair: 'black', skin: 'tan', clothing: 'blue' },
    green: { eyes: 'green', hair: 'auburn', skin: 'brown', clothing: 'green' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
      fold: k.tint('clothing', { color: C.bandanaFold, follow: 1 }),
    };
    const sx = (p: V3, side: 1 | -1): V3 => [p[0] * side, p[1], p[2]];
    const KNEE = [0.083, 0.1325, 0] as const;
    const HIP = [0.068, 0.195, 0] as const;
    const ANKLE = [0.098, 0.07, 0] as const;
    const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
      'upperarm.L': { parent: 'chest', at: ARMS.L.S },
      'forearm.L': { parent: 'upperarm.L', at: ARMS.L.E },
      'hand.L': { parent: 'forearm.L', at: ARMS.L.W },
      'upperarm.R': { parent: 'chest', at: sx(ARMS.R.S, -1) },
      'forearm.R': { parent: 'upperarm.R', at: sx(ARMS.R.E, -1) },
      'hand.R': { parent: 'forearm.R', at: sx(ARMS.R.W, -1) },
      'knife.L': { parent: 'hand.L', at: ARMS.L.G },
      'knife.R': { parent: 'hand.R', at: sx(ARMS.R.G, -1) },
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
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.044, 0.032])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    // Arms: built per side (the right arm is raised).
    const armOf = (side: 1 | -1) => {
      const tag = side === 1 ? 'L' : 'R';
      const a = ARMS[tag];
      const S = sx(a.S, side);
      const E = sx(a.E, side);
      const W = sx(a.W, side);
      return sdf.smoothUnion(
        0.02,
        sdf.cone(S, E, 0.04, 0.036).bone(`upperarm.${tag}`),
        sdf.cone(E, W, 0.036, 0.032).bone(`forearm.${tag}`),
      );
    };
    const fistL = sdf
      .smoothUnion(
        0.018,
        sdf.ellipsoid([0.038, 0.043, 0.044]).at(0.212, 0.2, 0.034),
        sdf.capsule([0.196, 0.18, 0.06], [0.2, 0.2, 0.072], 0.017),
        sdf.cone([0.225, 0.215, 0.055], [0.206, 0.205, 0.078], 0.016, 0.013),
      )
      .bone('hand.L');
    const GR = sx(ARMS.R.G, -1);
    const off = (p: V3, o: V3): V3 => [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
    const fistR = sdf
      .smoothUnion(
        0.018,
        sdf.ellipsoid([0.038, 0.044, 0.04]).at(...GR),
        sdf.capsule(off(GR, [0.015, -0.022, 0.024]), off(GR, [0.012, 0.004, 0.036]), 0.017), // finger roll
        sdf.cone(off(GR, [-0.013, 0.018, 0.02]), off(GR, [0.004, 0.008, 0.04]), 0.016, 0.012), // thumb
      )
      .bone('hand.R');
    const arms = sdf.union(sdf.smoothUnion(0.02, armOf(1), fistL), sdf.smoothUnion(0.02, armOf(-1), fistR));

    // Face paint.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.055, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.048, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.042, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] + 0.004));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const lash = pair(
      sdf
        .extrude(
          profile.polygon([
            [0, 0],
            [0.022, 0.016],
            [0.026, 0.01],
            [0.004, -0.008],
          ]),
          0.3,
        )
        .at(EYE[0] + 0.043, EYE[1] + 0.012, 0.1),
    );
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Heavy brows; the left one (+X) is raised for the cocky look.
    const browR = sdf.extrude(profile.arc(0.1, 0.03, 60, 120), 0.3).rotateZ(-7).at(-0.1, 0.618, 0.1);
    const browL = sdf.extrude(profile.arc(0.1, 0.03, 60, 120), 0.3).rotateZ(7).at(0.1, 0.634, 0.1);
    // The grin: one long arc, its left corner (+X) pulled up.
    const smile = sdf.extrude(profile.arc(0.07, 0.013, 236, 326), 0.3).at(0, 0.6, 0.1);
    const teeth = sdf.extrude(profile.arc(0.058, 0.009, 252, 300), 0.3).at(0, 0.6, 0.1);
    const blush = pair(at(sdf.sphere(0.032), 0.135, 0.56));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(arms)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lash, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(browR, T.brow)
      .paintWhere(browL, T.brow)
      .paintWhere(smile, T.mouth)
      .paintWhere(teeth, C.eyeWhite);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ bandana
    // A band around the brow, front higher than back, 0.022 thick over the hair.
    const skull = (grow: number) => sdf.ellipsoid([HEAD[0] + grow, HEAD[1] + grow, HEAD[2] + grow]).at(0, HEAD_Y, -0.005);
    const slab = sdf.box([0.7, 0.056, 0.7], 0.008).rotateX(-9).at(0, 0.768, 0);
    const bandShape = skull(0.024).intersect(slab);
    const bandSurface = (x: number, y: number) => sdf.raycast(bandShape, [x, y, 1], [0, 0, -1])![2];
    const KX = 0.065;
    const knot = sdf.ellipsoid([0.034, 0.03, 0.028]).at(KX, 0.752, -0.224);
    // Two tails, 0.09 long and 0.03 wide, 0.022 thick, hanging from the knot at the back left.
    const tail = (turn: number, len: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-0.015, 0],
            [0.015, 0],
            [0.019, -len],
            [0, -len + 0.02],
            [-0.019, -len - 0.004],
          ]),
          0.022,
          0.006,
        )
        .rotateX(10)
        .rotateZ(turn)
        .at(KX, 0.742, -0.234);
    const bandana = sdf
      .smoothUnion(0.01, bandShape, knot, tail(16, 0.09), tail(-12, 0.085))
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(x, z);
        const fold = Math.sin(a * 9 + y * 26) > 0.86 || (y > 0.772 && Math.sin(a * 5 - y * 40) > 0.93);
        return fold ? rgb(T.fold) : base;
      });
    k.body('bandana', bandana, { color: T.cloth, roughness: 0.85, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ hair: a cap and a fan of thick locks
    const faceMask = sdf.ellipsoid([0.25, 0.16, 0.23]).rotateZ(10).at(0.0, 0.62, 0.14);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.009, HEAD[1] + 0.009, HEAD[2] + 0.008])
      .at(0, HEAD_Y + 0.004, -0.012)
      .smoothSubtract(0.015, faceMask)
      .displace(0.006, (x, y, z) => Math.sin(Math.atan2(x, z + 0.05) * 11) * 0.5 + 0.5 * Math.sin(y * 70 + x * 30));
    const sweep: V3 = [-0.035, 0, -0.06]; // every lock is swept back and toward the right side
    const lockAt = (phi: number, rise: number) => {
      const s = Math.sin((phi * Math.PI) / 180);
      const c = Math.cos((phi * Math.PI) / 180);
      const f = 0.55 + 0.45 * Math.max(0, c); // the front locks are shorter
      const pts: [number, number, number, number][] = [
        [0.15 * s, 0.795, -0.012 + 0.135 * c, 0.037],
        [0.135 * s + sweep[0] * 0.3, 0.862 + 0.01 * rise, -0.03 + 0.11 * c + sweep[2] * 0.4, 0.036],
        [0.105 * s + sweep[0] * 0.9, 0.918 + 0.024 * rise * f, -0.07 + 0.075 * c + sweep[2] * 1.0, 0.03],
        [0.08 * s + sweep[0] * 1.4, 0.88 + 0.02 * rise * f, -0.1 + 0.05 * c + sweep[2] * 1.6, 0.013], // the tip sweeps back and down
      ];
      return sdf.chain(pts, 0.02);
    };
    const locks = sdf.smoothUnion(
      0.012,
      ...[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((phi, i) => lockAt(phi, 0.6 + 0.8 * ((i * 5) % 4) / 3)),
    );
    // The fringe curl over the bandana, hanging on the brow at the right side.
    // One big curl: from the crown down over the front of the bandana and hooking up on the brow.
    const cz = (x: number, y: number) => bandSurface(x, Math.max(0.775, y));
    const curl = sdf.chain(
      [
        [-0.005, 0.88, 0.1, 0.03],
        [-0.03, 0.835, cz(-0.03, 0.82) + 0.013, 0.03],
        [-0.06, 0.79, cz(-0.06, 0.79) + 0.014, 0.028],
        [-0.095, 0.755, cz(-0.095, 0.775) + 0.012, 0.025],
        [-0.092, 0.728, cz(-0.092, 0.775) + 0.004, 0.022],
        [-0.064, 0.72, cz(-0.064, 0.775) - 0.004, 0.016],
        [-0.042, 0.736, cz(-0.042, 0.775) - 0.004, 0.009],
      ],
      0.02,
    );
    const tufts = pair(sdf.cone([0.187, 0.7, 0.085], [0.2, 0.615, 0.1], 0.029, 0.01));
    const hairShape = sdf.smoothUnion(0.018, cap, locks, curl, tufts).subtract(bandShape.round(0.002).subtract(curl.round(0.003)));
    const hair = hairShape.paintFn((x, y, z, base) => {
      const a = Math.atan2(x, z + 0.05);
      return (y > 0.79 ? Math.cos(a * 11) < -0.55 : Math.sin(a * 11) < -0.6) ? rgb(T.hairDark) : base;
    });
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // The gold hoop on the left ear (+X), hanging from the lobe.
    const hoop = sdf.torus(0.016, 0.0048).rotateX(90).rotateZ(-8).at(0.213, 0.566, -0.004);
    k.body('earring', hoop, { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.0035, bone: 'head' });

    // ------------------------------------------------------------------ shirt, sleeves, collar
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
            [0.132, 0.25],
            [0.142, 0.2],
            [0.148, 0.174],
            [0.138, 0.162],
            [0, 0.162],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const vee = sdf
      .extrude(
        profile.polygon([
          [-0.05, 0.48],
          [0.05, 0.48],
          [0.01, 0.385],
          [-0.01, 0.385],
        ]),
        0.3,
      )
      .at(0, 0, 0.1);
    const shirtTorso = torso
      .paintWhere(vee, T.skin, 0.008)
      .paintFn((x, y, z, base) =>
        y < 0.27 && Math.cos(Math.atan2(x, z) * 13) > 0.92 ? rgb(C.shirtFold) : base,
      );
    // A rolled sleeve: the cone runs to a third of the forearm, with a thick cuff ring there.
    const ring = (center: V3, dir: V3, R: number, r: number) => {
      const l = Math.hypot(dir[0], dir[1], dir[2]);
      const d = [dir[0] / l, dir[1] / l, dir[2] / l];
      const ax = (Math.asin(d[2]!) * 180) / Math.PI;
      const az = (Math.atan2(-d[0]!, d[1]!) * 180) / Math.PI;
      return sdf.torus(R, r).rotateX(ax).rotateZ(az).at(...center);
    };
    const sleeveOf = (side: 1 | -1) => {
      const tag = side === 1 ? 'L' : 'R';
      const a = ARMS[tag];
      const S = sx(a.S, side);
      const E = sx(a.E, side);
      const W = sx(a.W, side);
      const M: V3 = [E[0] + (W[0] - E[0]) * 0.34, E[1] + (W[1] - E[1]) * 0.34, E[2] + (W[2] - E[2]) * 0.34];
      const dir: V3 = [W[0] - E[0], W[1] - E[1], W[2] - E[2]];
      const top: V3 = [0.11 * side, 0.405, 0];
      return sdf
        .union(
          sdf.smoothUnion(
            0.02,
            sdf.cone(top, E, 0.048, 0.043).bone(`upperarm.${tag}`),
            sdf.cone(E, M, 0.043, 0.041).bone(`forearm.${tag}`),
          ),
          ring(M, dir, 0.04, 0.013).bone(`forearm.${tag}`),
        )
        .paintFn((x, y, z, base) => (Math.sin(y * 70 + x * 20) > 0.93 ? rgb(C.shirtFold) : base));
    };
    const collar = sdf
      .revolve(
        profile.polygon(
          [
            [0.054, 0.436],
            [0.086, 0.43],
            [0.122, 0.462],
            [0.108, 0.508],
            [0.074, 0.494],
            [0.058, 0.474],
          ],
          { smooth: false },
        ),
      )
      .scale([1, 1, 0.88])
      .at(0, 0, -0.008)
      .subtract(
        sdf
          .extrude(
            profile.polygon([
              [-0.115, 0.53],
              [0.115, 0.53],
              [0, 0.36],
            ]),
            0.4,
          )
          .at(0, 0, 0.24),
      );
    k.body(
      'shirt',
      sdf.union(shirtTorso.bone('spine'), sleeveOf(1), sleeveOf(-1), collar.bone('chest')),
      { color: C.shirt, roughness: 0.9 },
    );

    // ------------------------------------------------------------------ vest (open in front), sash, belt
    const vestWedge = sdf
      .extrude(
        profile.polygon([
          [-0.1, 0.46],
          [0.1, 0.46],
          [0.045, 0.265],
          [-0.045, 0.265],
        ]),
        0.4,
      )
      .at(0, 0, 0.22);
    const vest = torso
      .round(0.014)
      .intersect(sdf.box([0.6, 0.15, 0.6], 0.01).at(0, 0.35, 0))
      .subtract(vestWedge)
      .subtract(
        // armholes
        pair(sdf.sphere(0.055).at(0.135, 0.36, 0)),
      );
    k.body('vest', vest.bone('spine'), { color: C.vest, roughness: 0.65 });

    // Leather lacing: two thin cords crossing the opening above the belt.
    const hw = (y: number) => 0.045 + ((y - 0.265) / 0.195) * 0.055; // half width of the vest opening
    const lz = (x: number, y: number) => sdf.raycast(torso, [x, y, 1], [0, 0, -1])![2] + 0.003;
    const cord = (y0: number, y1: number, dir: 1 | -1) => {
      const p0: [number, number, number, number] = [-dir * hw(y0), y0, lz(-dir * hw(y0) * 0.92, y0), 0.0048];
      const p1: [number, number, number, number] = [0, (y0 + y1) / 2, lz(0, (y0 + y1) / 2) + 0.003, 0.0048];
      const p2: [number, number, number, number] = [dir * hw(y1), y1, lz(dir * hw(y1) * 0.92, y1), 0.0048];
      return sdf.chain([p0, p1, p2], 0.004);
    };
    const lacing = sdf.union(cord(0.285, 0.35, 1), cord(0.285, 0.35, -1));
    k.body('lacing', lacing.bone('spine'), { color: C.belt, roughness: 0.6, detail: 0.0035 });

    const sashY = 0.212;
    const sash = torso
      .round(0.013)
      .smoothIntersect(0.006, sdf.box([0.5, 0.062, 0.5], 0.008).at(0, sashY, 0))
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(x, z) * 10 + y * 40) > 0.8 ? rgb(C.sashFold) : base));
    const tailStrip = sdf
      .extrude(
        profile.polygon([
          [-0.024, 0],
          [0.028, 0],
          [0.03, -0.13],
          [0.004, -0.108],
          [-0.03, -0.145],
        ]),
        0.02,
        0.007,
      )
      .rotateZ(-8)
      .rotateX(-6)
      .at(0.085, 0.205, 0.128)
      .paintFn((x, y, z, base) => (Math.sin((x + y) * 120) > 0.8 ? rgb(C.sashFold) : base));
    const sashKnot = sdf.ellipsoid([0.032, 0.03, 0.024]).at(0.085, 0.208, 0.108);
    k.body('sash', sdf.smoothUnion(0.01, sash, tailStrip.union(sashKnot)).bone('spine'), {
      color: C.sash,
      roughness: 0.85,
    });

    const beltY = 0.262;
    const belt = torso.round(0.011).smoothIntersect(0.006, sdf.box([0.5, 0.042, 0.5], 0.006).at(0, beltY, 0));
    const strap = torso
      .round(0.009)
      .smoothIntersect(0.005, sdf.box([0.6, 0.026, 0.6], 0.005).rotateZ(24).at(0.0, 0.225, 0));
    k.body('belt', sdf.union(belt.bone('spine'), strap.bone('spine')), { color: C.belt, roughness: 0.6 });

    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .box([0.058, 0.046, 0.014], 0.006)
      .subtract(sdf.box([0.034, 0.024, 0.04], 0.004))
      .union(sdf.box([0.006, 0.05, 0.01], 0.002).rotateZ(45))
      .union(sdf.box([0.006, 0.05, 0.01], 0.002).rotateZ(-45))
      .at(0, beltY, beltZ + 0.005);
    k.body('brass', buckle.bone('spine'), { color: C.brass, roughness: 0.32, metalness: 0.9, detail: 0.004 });

    // The holster box at the right hip (-X) with a small brass cap.
    const holster = sdf
      .box([0.058, 0.08, 0.05], 0.012)
      .rotateY(-38)
      .rotateZ(-6)
      .at(-0.14, 0.218, 0.062)
      .bone('spine');
    const holsterCap = sdf.cylinder(0.014, 0.012, 0.004).rotateZ(90).rotateY(-38).at(-0.164, 0.226, 0.092).bone('spine');
    k.body('holster', holster, { color: C.holster, roughness: 0.65 });
    k.body('holsterCap', holsterCap, { color: C.brass, roughness: 0.32, metalness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ bracers
    const bracerOf = (side: 1 | -1) => {
      const tag = side === 1 ? 'L' : 'R';
      const a = ARMS[tag];
      const E = sx(a.E, side);
      const W = sx(a.W, side);
      const at2 = (t: number): V3 => [E[0] + (W[0] - E[0]) * t, E[1] + (W[1] - E[1]) * t, E[2] + (W[2] - E[2]) * t];
      return sdf.cone(at2(0.52), at2(1.05), 0.041, 0.045).round(0.004).bone(`forearm.${tag}`);
    };
    k.body('leather', sdf.union(bracerOf(1), bracerOf(-1)), { color: C.belt, roughness: 0.6 });

    // ------------------------------------------------------------------ legs and tall boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.11, 0.004], 0.05).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });

    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.09, 0.02).at(0, 0.07, 0),
        sdf.ellipsoid([0.058, 0.055, 0.1]).at(0, 0.052, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const shaft = sdf.cylinder(0.054, 0.15, 0.02).at(0, 0.085, 0);
    const bootCuff = sdf.cylinder(0.066, 0.046, 0.016).at(0, 0.148, 0);
    const bootLower = sdf.union(bootFoot, sole.paint(C.sole)).bone('foot.L');
    const bootUpper = sdf.union(shaft.bone('shin.L'), bootCuff.paint(C.cuff).bone('shin.L'));
    const boot = sdf.smoothUnion(0.012, bootLower, bootUpper).rotateY(12).at(ANKLE[0], 0, 0);
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the rapier (right hand) and the dagger (left hand)
    // Local frame: origin at the grip center, the blade up (+Y), the flat facing +Z.
    // The sabre: a curved blade 0.34 long and 0.035 wide at the base, 0.01 thick. The curve bends the
    // tip toward the cutting edge (-X in the local frame, which points outward in the right hand).
    const BL0 = 0.046;
    const BLEN = 0.34;
    const sabreX = (t: number) => -0.042 * t * t; // the centerline
    const sabreHalf = (t: number) => 0.0175 * (1 - 0.55 * t) * (t > 0.92 ? Math.max(0.15, (1 - t) / 0.08) : 1);
    const sabrePts: [number, number][] = [];
    const steps = 10;
    for (let n = 0; n <= steps; n++) {
      const t = n / steps;
      sabrePts.push([sabreX(t) + sabreHalf(t), BL0 + BLEN * t]); // the spine side (+X)
    }
    for (let n = steps; n >= 0; n--) {
      const t = n / steps;
      sabrePts.push([sabreX(t) - sabreHalf(t), BL0 + BLEN * t]); // the edge side (-X)
    }
    const sabreBlade = sdf
      .extrude(profile.polygon(sabrePts, { smooth: false }), 0.01, 0.003)
      .paintFn((x, y, z, base) => {
        const t = Math.min(1, Math.max(0, (y - BL0) / BLEN));
        const h = sabreHalf(t);
        const u = x - sabreX(t);
        if (u < -h + 0.0048) return rgb('#f2f5f7'); // the bright edge line
        if (u > h - 0.0085) return rgb('#6f767e'); // the darker spine
        return base;
      });
    const guardOf = (w: number) => sdf.box([w, 0.011, 0.016], 0.005).at(0, 0.04, 0).paint(C.gold);
    const sabre = sdf.union(
      sabreBlade,
      guardOf(0.07),
      sdf.capsule([0, -0.032, 0], [0, 0.036, 0], 0.014).paintFn((x, y, z, base) => (Math.sin(y * 330) > 0.35 ? rgb('#2a1c14') : base)).paint(C.grip),
      sdf.sphere(0.0185).at(0, -0.05, 0).paint(C.gold),
    );
    // The dagger: 0.17 overall, the blade 0.024 wide, the same guard style.
    const dagger = sdf.union(
      sdf
        .extrude(
          profile.polygon(
            [
              [-0.012, 0],
              [0.012, 0],
              [0.0085, 0.085],
              [0, 0.115],
              [-0.0085, 0.085],
            ],
            { smooth: false },
          ),
          0.01,
          0.003,
        )
        .at(0, 0.04, 0)
        .paint(C.blade),
      guardOf(0.05),
      sdf.capsule([0, -0.026, 0], [0, 0.036, 0], 0.012).paint(C.grip),
      sdf.sphere(0.0145).at(0, -0.04, 0).paint(C.gold),
    );
    const inHand = (s: sdf.Shape, side: 1 | -1) => {
      const tag = side === 1 ? 'L' : 'R';
      const g = GRIPS[tag];
      return s
        .rotateY(g.roll * side)
        .rotateZ(-g.lean * side)
        .rotateX(-g.back)
        .at(...sx(ARMS[tag].G, side));
    };
    k.body('sabre', inHand(sabre, -1), { color: C.blade, roughness: 0.3, metalness: 0.9, detail: 0.003, bone: 'knife.R' });
    k.body('dagger', inHand(dagger, 1), { color: C.blade, roughness: 0.3, metalness: 0.9, detail: 0.003, bone: 'knife.L' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const rad = Math.PI / 180;
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    const turn = (v: V3, axis: 0 | 1 | 2, deg: number): V3 => {
      const c = Math.cos(deg * rad);
      const s = Math.sin(deg * rad);
      const [x, y, z] = v;
      if (axis === 0) return [x, y * c - z * s, y * s + z * c];
      if (axis === 1) return [x * c + z * s, y, -x * s + z * c];
      return [x * c - y * s, x * s + y * c, z];
    };
    const inHandDir = (v: V3, side: 1 | -1): V3 => {
      const g = GRIPS[side === 1 ? 'L' : 'R'];
      return turn(turn(turn(v, 1, g.roll * side), 2, -g.lean * side), 0, -g.back);
    };
    const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const lerp = (a: V3, b: V3, t: number): V3 => add(a, add(b, a, -1), t);

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-2 * bump(p), 0, 0] },
      }),
    });

    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(
          p - 0.25,
          { hip: HIP, knee: KNEE, ankle: ANKLE },
          {
            stride: step,
            lift,
            duty,
            bob: hop,
            roll: 10,
            heel: [ANKLE[0], 0, -0.045],
            toe: [ANKLE[0], 0, 0.11],
            hips: { at: [0, 0.2, 0], rotate: hipsTurn },
          },
        );
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The dagger arm swings; the rapier arm holds the guard and only bobs.
          'upperarm.L': { rotate: [armSwing * 0.7 * s, 0, 6] as const },
          'upperarm.R': { rotate: [armSwing * 0.1 * s, 0, -4] as const },
          'forearm.L': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.08, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 50, 12, 0.03));

    // ---- arm posing by targets, in the chest's rest frame
    const armRig = (side: 1 | -1) => {
      const tag = side === 1 ? 'L' : 'R';
      const a = ARMS[tag];
      const chain = { root: sx(a.S, side), mid: sx(a.E, side), end: sx(a.W, side) };
      const rest = { dir: inHandDir([0, 1, 0], side), up: inHandDir([0, 0, 1], side) };
      const solve = (wrist: V3, pole: V3, dir: V3, upIn: V3) => {
        const d = norm(dir);
        const dot = upIn[0] * d[0] + upIn[1] * d[1] + upIn[2] * d[2];
        let up = add(upIn, d, -dot);
        if (Math.hypot(...up) < 0.25) up = add(rest.up, d, -(rest.up[0] * d[0] + rest.up[1] * d[1] + rest.up[2] * d[2]));
        const arm = reach(chain, wrist, pole);
        const hand = orient([arm.upper, arm.lower], rest, { dir: d, up: norm(up) });
        const rots: V3[] = [arm.upper, arm.lower, hand];
        return {
          rots,
          bones: {
            [`upperarm.${tag}`]: { rotate: arm.upper },
            [`forearm.${tag}`]: { rotate: arm.lower },
            [`hand.${tag}`]: { rotate: hand },
          },
        };
      };
      return { chain, rest, solve, pole: chain.mid };
    };
    const rigR = armRig(-1);
    const rigL = armRig(1);
    type Track = { w: [number, V3][]; p: [number, V3][]; d: [number, V3][]; u: [number, V3][] };
    const play = (rig: ReturnType<typeof armRig>, tr: Track, p: number, mode: 'smooth' | 'spline' = 'smooth') =>
      rig.solve(keys(p, tr.w, mode), keys(p, tr.p), keys(p, tr.d), keys(p, tr.u));

    // The right (rapier) arm: rest wrist, rest blade, rest flat.
    const WR = rigR.chain.end;
    const WL = rigL.chain.end;
    const R0 = { w: WR, p: rigR.pole, d: rigR.rest.dir, u: rigR.rest.up };
    const L0 = { w: WL, p: rigL.pole, d: rigL.rest.dir, u: rigL.rest.up };
    const poleOutR: V3 = [-0.26, 0.26, -0.04];
    const poleOutL: V3 = [0.27, 0.22, -0.02];

    // ---- attack: a rapier lunge. Coil (rapier back, cocked), thrust forward, hold, recover.
    const lungeR: Track = {
      w: [[0, R0.w], [0.2, [-0.2, 0.375, 0.04]], [0.3, [-0.2, 0.375, 0.04]], [0.4, [-0.165, 0.365, 0.145]], [0.58, [-0.165, 0.365, 0.145]], [0.82, [-0.2, 0.35, 0.07]], [1, R0.w]],
      p: [[0, R0.p], [0.2, poleOutR], [0.58, poleOutR], [1, R0.p]],
      d: [[0, R0.d], [0.2, [-0.15, 0.95, 0.3]], [0.3, [-0.15, 0.95, 0.3]], [0.4, [-0.03, 0.1, 1]], [0.58, [-0.03, 0.1, 1]], [0.82, [-0.12, 0.9, 0.3]], [1, R0.d]],
      u: [[0, R0.u], [0.3, [0, -0.3, 0.95]], [0.4, [-1, 0, 0]], [0.58, [-1, 0, 0]], [0.82, [0, -0.3, 0.95]], [1, R0.u]],
    };
    const lungeL: Track = {
      w: [[0, L0.w], [0.2, [0.25, 0.3, -0.03]], [0.3, [0.25, 0.3, -0.03]], [0.4, [0.26, 0.3, -0.04]], [0.58, [0.26, 0.3, -0.04]], [0.82, [0.22, 0.26, 0]], [1, L0.w]],
      p: [[0, L0.p], [0.2, poleOutL], [0.58, poleOutL], [1, L0.p]],
      d: [[0, L0.d], [0.2, [0.6, 0.6, 0.4]], [0.58, [0.6, 0.6, 0.4]], [0.82, [0.5, 0.6, 0.6]], [1, L0.d]],
      u: [[0, L0.u], [1, L0.u]],
    };
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const hipsY = keys(p, [[0, 0], [0.2, -10], [0.3, -10], [0.4, 12], [0.58, 12], [0.82, 0], [1, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.2, -14], [0.3, -14], [0.4, 14], [0.58, 14], [0.82, 0], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.2, 6], [0.4, 8], [0.6, 7], [1, 0]] as const);
        // The lunge: the right leg steps forward, the left leg pushes back, the hips follow.
        const legX = keys(p, [[0, 0], [0.2, -6], [0.3, -8], [0.4, -19], [0.62, -19], [0.85, -4], [1, 0]] as const);
        const legZ = keys(p, [[0, 0], [0.3, 6], [0.4, 6], [0.62, 6], [1, 0]] as const);
        const stepZ = keys(p, [[0, 0], [0.3, -0.008], [0.4, 0.035], [0.62, 0.035], [1, 0]] as const);
        const drop = LEG * (1 - Math.cos(legX * rad) * Math.cos(legZ * rad));
        return {
          hips: { move: [0, -drop, stepZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 3, chestY, 0] },
          head: { rotate: [-0.6 * lean, -0.6 * (hipsY + chestY), 0] },
          'leg.R': { rotate: [legX, 0, -legZ] },
          'leg.L': { rotate: [-legX, 0, legZ] },
          'foot.R': { rotate: [-legX, 0, legZ] },
          'foot.L': { rotate: [legX, 0, -legZ] },
          ...play(rigR, lungeR, p).bones,
          ...play(rigL, lungeL, p).bones,
        };
      },
    });

    // ---- hit
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const whip = keys(p, [[0, 0], [0.2, 1], [0.4, 0.5], [0.6, -0.2], [0.82, 0]] as const, 'spline');
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(clamp01((p - 0.04) / 0.2)) + bump(clamp01((p - 0.58) / 0.32));
        const back = 0.03 * step;
        const lean = Math.asin(back / LEG) / rad;
        return {
          hips: { move: [0, -legDrop(LEG, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-4 * whip, 0, 0] },
          head: { rotate: [-10 * whip, -6 * whip, 4 * whip] },
          'upperarm.L': { rotate: [-12 * h, 0, 16 * h] },
          'forearm.L': { rotate: [-16 * h, 0, 0] },
          'upperarm.R': { rotate: [4 * h, 0, -10 * h] },
          'forearm.R': { rotate: [4 * h, 0, 0] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'leg.R': { rotate: [lean + 8 * lift, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [-lean - 8 * lift, 0, 0] },
        };
      },
    });

    // ---- death: a stagger, then a fall on the back; both weapons drop and lie on the floor
    const { follow, quat, euler } = motion;
    const LIE = 78;
    const LIE_Y = 0.178;
    const HEEL = 0.05;
    const FIST_Y = 0.03;
    const HIPS0: V3 = [0, 0.2, 0];
    const TRUNK: readonly V3[] = [HIPS0, [0, 0.26, 0], [0, 0.33, 0]];
    const END: V3 = [0, LIE_Y - 0.2, -HEEL - 0.2 * Math.sin(LIE * rad) + HEEL * Math.cos(LIE * rad)];
    const toWorld = (v: V3): V3 => add(add(HIPS0, END), turn(add(v, HIPS0, -1), 0, -LIE));
    const toBody = (w: V3): V3 => add(HIPS0, turn(add(w, add(HIPS0, END), -1), 0, LIE));
    const LEG_DOWN = Math.asin(clamp01((LIE_Y - 0.035) / 0.165)) / rad - (90 - LIE);
    type Weights = { hitB: number; sag: number; fly: number; land: number; loose: number };
    const deathArm = (side: 1 | -1) => {
      const f = (v: V3): V3 => [v[0] * side, v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const a = ARMS[tag];
      const chain = { root: sx(a.S, side), mid: sx(a.E, side), end: sx(a.G, side) };
      const joints: readonly V3[] = [...TRUNK, chain.root, chain.mid, sx(a.W, side)];
      const shoulderW = toWorld(chain.root);
      const span = Math.sqrt(Math.max(0, 0.2 ** 2 - (shoulderW[1] - FIST_Y) ** 2));
      const out = norm([0.93 * side, 0, 0.37]);
      const fistW: V3 = [shoulderW[0] + out[0] * span, FIST_Y, shoulderW[2] + out[2] * span];
      const fistEnd = toBody(fistW);
      const floorY = side === 1 ? 0.015 : 0.055;
      const knifeAt: V3 = [fistW[0] + 0.095 * side, floorY, fistW[2] + 0.05];
      const dropKeys: [number, V3][] = [
        [0.44, add(knifeAt, [0, 0.12, 0])],
        [0.6, knifeAt],
        [0.65, add(knifeAt, [0, 0.015, 0])],
        [0.7, knifeAt],
      ];
      const rest = { dir: inHandDir([0, 1, 0], side), up: inHandDir([0, 0, 1], side) };
      const dropTurn = quat(orient([], rest, { dir: norm([0.6 * side, 0, 0.8]), up: [0, 1, 0] }));
      return (p: number, trunk: readonly V3[], move: V3, w: Weights) => {
        const stand = add(add(add(chain.end, f([0.05, 0.05, 0.05]), w.hitB), [0, -0.03, 0.02], w.sag), f([0.08, 0.06, 0.03]), w.fly);
        const arm = reach(chain, lerp(stand, fistEnd, w.land), lerp(chain.mid, f([0.6, 0.45, 0.1]), w.land));
        const rots: V3[] = [...trunk, arm.upper, arm.lower, [0, 0, 0]];
        const handQ = rots.slice(0, 5).reduce((q, r) => q.multiply(quat(r)), new THREE.Quaternion());
        const inv = handQ.clone().invert();
        const held = add(follow(joints, rots, chain.end), move);
        const d = new THREE.Vector3(...add(lerp(held, keys(p, dropKeys), w.loose), held, -1)).applyQuaternion(inv);
        return {
          [`upperarm.${tag}`]: { rotate: arm.upper },
          [`forearm.${tag}`]: { rotate: arm.lower },
          [`knife.${tag}`]: { move: [d.x, d.y, d.z] as V3, rotate: euler(inv.clone().multiply(handQ.clone().slerp(dropTurn, w.loose))) },
        };
      };
    };
    const deathL = deathArm(1);
    const deathR = deathArm(-1);
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24);
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 4 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const settle = keys(p, [[0.56, 0], [0.8, 1]] as const);
        const back = 0.022 * hitB;
        const lean = Math.asin(back / LEG) / rad;
        const a = tilt * rad;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(LEG, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const legs = LEG_DOWN * clamp01((tilt - LIE + 18) / 18);
        const w = { hitB, sag, fly, land, loose };
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + 10 * land, 0, 0] },
          head: { rotate: [-14 * hitB + 8 * sag + 12 * land, -8 * hitB + 22 * settle, 8 * wob] },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean + 10 * settle, 18 * settle, 0] },
          'foot.R': { rotate: [lean + 10 * settle, -18 * settle, 0] },
          ...deathL(p, [hipsR, spineR, chestR], hipsMove, w),
          ...deathR(p, [hipsR, spineR, chestR], hipsMove, w),
        };
      },
    });

    // ---- attack2: a cross slash. She winds to her right (rapier cocked high, dagger low), then
    // unwinds and cuts both blades across the front into an X.
    const crossR: Track = {
      w: [[0, R0.w], [0.2, [-0.215, 0.44, 0.03]], [0.28, [-0.215, 0.44, 0.03]], [0.33, [-0.22, 0.4, 0.1]], [0.38, [-0.15, 0.39, 0.14]], [0.44, [-0.05, 0.335, 0.14]], [0.6, [-0.05, 0.335, 0.14]], [0.82, [-0.2, 0.36, 0.09]], [1, R0.w]],
      p: [[0, R0.p], [0.2, poleOutR], [0.6, poleOutR], [1, R0.p]],
      d: [[0, R0.d], [0.2, [-0.65, 0.7, -0.2]], [0.28, [-0.65, 0.7, -0.2]], [0.33, [-0.85, 0.25, 0.25]], [0.38, [-0.2, 0.25, 0.95]], [0.44, [0.85, 0.1, 0.52]], [0.6, [0.85, 0.1, 0.52]], [0.82, [-0.1, 0.9, 0.2]], [1, R0.d]],
      u: [[0, R0.u], [0.28, [0.3, 0.2, 0.9]], [0.36, [0, 1, 0.2]], [0.44, [0, 1, 0]], [0.6, [0, 1, 0]], [0.82, [0, -0.3, 0.95]], [1, R0.u]],
    };
    const crossL: Track = {
      w: [[0, L0.w], [0.2, [0.22, 0.26, 0.03]], [0.28, [0.22, 0.26, 0.03]], [0.36, [0.13, 0.29, 0.12]], [0.44, [0.07, 0.33, 0.165]], [0.6, [0.07, 0.33, 0.165]], [0.82, [0.21, 0.28, 0.05]], [1, L0.w]],
      p: [[0, L0.p], [0.2, poleOutL], [0.6, poleOutL], [1, L0.p]],
      d: [[0, L0.d], [0.2, [0.75, 0.4, 0.3]], [0.28, [0.75, 0.4, 0.3]], [0.36, [0.2, 0.4, 0.9]], [0.44, [-0.75, 0.3, 0.65]], [0.6, [-0.75, 0.3, 0.65]], [0.82, [0.6, 0.6, 0.4]], [1, L0.d]],
      u: [[0, L0.u], [0.28, L0.u], [0.44, [0, 1, 0]], [0.6, [0, 1, 0]], [0.82, L0.u], [1, L0.u]],
    };
    k.animation('attack2', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const hipsY = keys(p, [[0, 0], [0.2, -14], [0.28, -14], [0.44, 16], [0.6, 16], [0.82, 0], [1, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.2, -24], [0.28, -24], [0.44, 28], [0.6, 28], [0.82, 4], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.2, 9], [0.36, 5], [0.6, 8], [1, 0]] as const);
        const legZ = keys(p, [[0, 0], [0.2, 8], [0.6, 8], [1, 0]] as const);
        const hop = 0.02 * keys(p, [[0.28, 0], [0.4, 1], [0.54, 0]] as const);
        const drop = LEG * (1 - Math.cos(legZ * rad));
        return {
          hips: { move: [0, hop - drop, 0], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 3, chestY, 0] },
          head: { rotate: [-0.6 * lean, -0.6 * (hipsY + chestY), 0] },
          'leg.L': { rotate: [0, 0, legZ] },
          'leg.R': { rotate: [0, 0, -legZ] },
          'foot.L': { rotate: [0, 0, -legZ] },
          'foot.R': { rotate: [0, 0, legZ] },
          ...play(rigR, crossR, p).bones,
          ...play(rigL, crossL, p).bones,
        };
      },
    });

    // ---- victory: the rapier salutes point up, the dagger raised low, a sly tilt of the head
    const vicR: Track = {
      w: [[0, R0.w], [0.35, [-0.275, 0.4, 0.07]], [1, [-0.275, 0.4, 0.07]]],
      p: [[0, R0.p], [0.35, [-0.3, 0.3, -0.05]], [1, [-0.3, 0.3, -0.05]]],
      d: [[0, R0.d], [0.35, [-0.4, 1, 0.08]], [0.6, [-0.5, 1, 0.12]], [0.8, [-0.35, 1, 0.06]], [1, [-0.4, 1, 0.08]]],
      u: [[0, R0.u], [1, [0, 0.1, 1]]],
    };
    const vicL: Track = {
      w: [[0, L0.w], [0.4, [0.27, 0.36, 0.08]], [1, [0.27, 0.36, 0.08]]],
      p: [[0, L0.p], [0.4, [0.3, 0.25, -0.03]], [1, [0.3, 0.25, -0.03]]],
      d: [[0, L0.d], [0.4, [0.6, 0.7, 0.3]], [1, [0.6, 0.7, 0.3]]],
      u: [[0, L0.u], [1, L0.u]],
    };
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const c = keys(p, [[0.2, 0], [0.5, 1]] as const);
        const sly = keys(p, [[0.5, 0], [0.8, 1]] as const);
        const watch = keys(p, [[0.06, 0], [0.18, 1], [0.34, 1], [0.48, 0]] as const);
        return {
          hips: { rotate: [0, -8 * c, 0] },
          spine: { rotate: [-3 * c, 0, 0] },
          chest: { rotate: [-3 * c, 6 * c, 0] },
          neck: { rotate: [3 * sly, 0, 0] },
          head: { rotate: [-14 * watch + 4 * sly, -10 * watch - 8 * sly, 12 * sly] },
          'foot.L': { rotate: [0, 12 * c, 0] },
          ...play(rigR, vicR, p).bones,
          ...play(rigL, vicL, p).bones,
        };
      },
    });
  },
});
