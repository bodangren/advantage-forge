import { defineAsset, motion, profile, rgb, sdf } from '../src/index.js';

/**
 * Monk — Chibi Quest P1 hero, about 0.98 m tall, faces +Z. Base: assets/rogue.ts (face, skeleton,
 * knee bones, clip set). Target: docs/hero-mockups/monk_001.jpg (one front view; the mockup's
 * beard and adult face are left out on purpose: a young, round, beardless hero face).
 *
 * One idea: a shaved round head with a small top knot over a saffron wrap robe; empty open hands.
 * Silhouette: the big bald head with the knot on top, wide bell sleeves, a flared robe skirt to the
 *   knees, wide trousers, cloth leg wraps, sandals on bare feet.
 * Palette: orange robe #df6e1f and trousers; saffron-yellow trim, cuffs, and underskirt #ebb33a;
 *   brown sash #6b4430; grey-green cloth wraps #807b66; dark wooden beads #4a2d1d; skin #f2c7a4.
 * Bodies: skin (head, arms, open hands, bare feet), knot, robe (torso, skirt, underskirt, sleeves),
 *   trim, sash, beads, pants, wraps (forearms, hands, shins), sandals.
 * Rig: the rogue's chibi skeleton with knees, without the dagger and cape bones. The robe skirt's
 *   sides follow the legs, so a kick lifts the skirt instead of passing through it.
 * Clips: idle, walk, run, attack (a palm strike with a step), attack2 (a spinning kick), hit,
 *   death, victory (a one-hand salute and a bow).
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
  brow: '#3e2519',
  mouth: '#a4503f',
  knot: '#3a2418',
  robe: '#df6e1f',
  pants: '#cf611b',
  trim: '#ebb33a',
  inner: '#dc9c30',
  sash: '#6b4430',
  wrap: '#807b66',
  wrapDark: '#5f5b4a',
  sole: '#3a291e',
  strap: '#5b3b27',
  bead: '#4a2d1d',
};

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
type V3 = readonly [number, number, number];

export default defineAsset({
  name: 'monk',
  description: 'Chibi monk hero with a shaved head and top knot, a saffron wrap robe, a brown sash, wooden prayer beads, and cloth hand wraps; fights with open palms.',
  detail: 0.005,
  reference: 'docs/hero-mockups/monk_001.jpg',
  // Color slots for individual monks (the first option is the default look).
  variants: {
    eyes: { brown: C.iris, grey: '#66727a', green: '#4a7042' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    robe: { saffron: C.robe, maroon: '#7c2f2c', greyblue: '#5a6b7c' },
  },
  presets: {
    temple: { eyes: 'brown', skin: 'brown', robe: 'maroon' },
    mountain: { eyes: 'grey', skin: 'tan', robe: 'greyblue' },
    novice: { eyes: 'green', skin: 'fair', robe: 'saffron' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      robe: k.tint('robe'),
      pants: k.tint('robe', { color: C.pants, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const SHOULDER = [0.13, 0.385, 0] as const;
    const ELBOW = [0.18, 0.332, 0.012] as const;
    const WRIST = [0.205, 0.238, 0.03] as const;
    const HIP = [0.068, 0.195, 0] as const;
    const ANKLE = [0.098, 0.07, 0] as const;
    const KNEE = [0.083, 0.1325, 0] as const;
    const mx = (p: V3) => [-p[0], p[1], p[2]] as const;
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

    // ------------------------------------------------------------------ head and face (the rogue's face)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
    // Bigger ears than the rogue's: with no hood or hair they are part of the silhouette.
    const ears = pair(
      sdf
        .ellipsoid([0.034, 0.06, 0.04])
        .subtract(sdf.sphere(0.022).at(0.022, 0, 0.008))
        .rotateZ(-6)
        .rotateY(-16)
        .at(0.205, 0.618, -0.014)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    // Arms: the upper arm and the forearm hide in the sleeve and the wrap; the hands are open.
    const arm = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.03).bone('forearm.L'),
    );
    // The open hand in its own frame: the wrist at the origin, the fingers down (-Y), the palm
    // toward -X (the body), the thumb forward (+Z). HAND_TURN lines it up with the forearm.
    const HAND_TURN = { z: 15, x: -11 };
    const inHand = (s: sdf.Shape) => s.scale(1.22).rotateZ(HAND_TURN.z).rotateX(HAND_TURN.x).at(...WRIST);
    const palm = sdf.ellipsoid([0.018, 0.033, 0.03]).at(0, -0.032, 0.002);
    const fingers = sdf.union(
      ...(
        [
          [0.018, -0.078],
          [0.006, -0.084],
          [-0.006, -0.081],
          [-0.017, -0.073],
        ] as const
      ).map(([z, y]) => sdf.capsule([-0.001, -0.048, z * 0.9], [-0.007, y, z], 0.0088)),
    );
    const thumb = sdf.cone([-0.006, -0.02, 0.02], [-0.013, -0.05, 0.037], 0.0115, 0.0092);
    const hand = inHand(sdf.smoothUnion(0.008, palm, fingers, thumb)).bone('hand.L');
    const arms = pair(sdf.smoothUnion(0.014, arm, hand));

    // Bare feet in the foot's frame (the ankle's ground point); the big toe on the inside.
    const toes = sdf.union(
      ...(
        [
          [-0.021, 0.02, 0.104, 0.0135],
          [-0.001, 0.019, 0.109, 0.0105],
          [0.015, 0.018, 0.105, 0.0095],
          [0.028, 0.017, 0.097, 0.0088],
          [0.039, 0.016, 0.086, 0.008],
        ] as const
      ).map(([x, y, z, r]) => sdf.sphere(r).at(x, y, z)),
    );
    const footLocal = sdf
      .smoothUnion(
        0.025,
        sdf.capsule([0, 0.035, -0.005], [0, 0.09, -0.005], 0.034), // the ankle
        sdf.ellipsoid([0.045, 0.026, 0.075]).at(0.004, 0.03, 0.035),
      )
      .smoothUnion(0.008, toes)
      .intersect(sdf.halfSpace([0, -1, 0], -0.013)); // stands on the sole
    const footPose = (s: sdf.Shape) => s.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    const feet = pair(footPose(footLocal));

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.055, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.048, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.042, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] + 0.004));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.024, 58, 122), 0.3).at(0.1, 0.724 - 0.1, 0.1));
    const smile = sdf.extrude(profile.arc(0.07, 0.01, 241, 299), 0.3).at(0, 0.53 + 0.07, 0.1);
    const blush = pair(at(sdf.sphere(0.032), 0.135, 0.56));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(arms, feet)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(smile, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ top knot with a saffron tie
    const KNOT_Z = -0.02;
    const tie = sdf
      .torus(0.018, 0.012)
      .displace(0.0025, (x, _y, z) => Math.sin(Math.atan2(z, x) * 9))
      .at(0, 0.89, KNOT_Z);
    const knot = sdf
      .smoothUnion(
        0.012,
        sdf.ellipsoid([0.024, 0.028, 0.024]).at(0, 0.925, KNOT_Z),
        sdf.cone([0, 0.935, KNOT_Z], [0, 0.972, KNOT_Z - 0.004], 0.016, 0.003),
        sdf.cylinder(0.011, 0.04).at(0, 0.885, KNOT_Z),
      )
      .displace(0.0015, (x, y, z) => Math.sin(Math.atan2(z - KNOT_Z, x) * 7 + y * 140));
    k.body('knot', sdf.union(knot, tie.paint(C.trim)), { color: C.knot, roughness: 0.6, bone: 'head', detail: 0.0035 });

    // ------------------------------------------------------------------ robe: torso, skirt, underskirt, sleeves
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.128, 0.4],
            [0.134, 0.345],
            [0.13, 0.3],
            [0.136, 0.26],
            [0.148, 0.215],
            [0.166, 0.175],
            [0.178, 0.157],
            [0.172, 0.148],
            [0, 0.148],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    // The saffron underskirt shows as a band below the orange hem.
    const underskirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.23],
            [0.132, 0.23],
            [0.145, 0.175],
            [0.162, 0.138],
            [0.155, 0.127],
            [0, 0.127],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.78]);
    const robeShape = sdf.union(torso, underskirt);

    // The wrap: the wearer's left panel crosses over to the right hip. Its edge runs from the left
    // side of the neck (P0) down to the sash (P1); the under panel's edge is its mirror, seen only
    // above the crossing (the bottom of the V at y = 0.352).
    const cut = (pts: [number, number][]) => sdf.extrude(profile.polygon(pts), 0.3).at(0, 0, 0.1);
    const bandA: [number, number][] = [
      [0.0958, 0.509],
      [-0.055, 0.262],
      [-0.0362, 0.2505],
      [0.1146, 0.4975],
    ];
    const bandB = bandA.map(([x, y]) => [-x, y] as [number, number]);
    const vNeck = cut([
      [-0.0958, 0.509],
      [0.0958, 0.509],
      [0, 0.352],
    ]);

    // Wide bell sleeves in their own frame (the shoulder at the origin, the arm down -Y), open at
    // the end so the forearm comes out; a saffron cuff at the end.
    const SLEEVE_L = 0.115;
    const sleeveOuter = sdf.smoothUnion(0.01, sdf.sphere(0.047), sdf.cone([0, 0, 0], [0, -SLEEVE_L, 0], 0.047, 0.07));
    const sleeveHollow = sdf.cone([0, -0.045, 0], [0, -SLEEVE_L - 0.02, 0], 0.028, 0.06);
    const sleevePose = (s: sdf.Shape) => s.rotateZ(43).rotateX(-12).at(...SHOULDER);
    const sleeves = pair(sleevePose(sleeveOuter.subtract(sleeveHollow)).bone('upperarm.L'));
    const cuffs = pair(
      sleevePose(
        sleeveOuter
          .round(0.004)
          .intersect(sdf.box([0.3, 0.022, 0.3]).at(0, -SLEEVE_L + 0.009, 0))
          .subtract(sleeveHollow),
      ).bone('upperarm.L'),
    );

    // Skin weights: the upper robe follows the chest, the middle the spine, the skirt the hips, and
    // the skirt's sides the legs (a band where both blend). The tagged parts only set the weights.
    const legZone = sdf.ellipsoid([0.1, 0.085, 0.16]).at(0.12, 0.15, 0);
    const legCore = sdf.ellipsoid([0.06, 0.05, 0.12]).at(0.14, 0.14, 0);
    const robe = sdf
      .union(
        robeShape,
        robeShape.intersect(sdf.halfSpace([0, -1, 0], -0.36)).bone('chest'),
        robeShape.intersect(sdf.box([0.5, 0.18, 0.5]).at(0, 0.31, 0)).bone('spine'),
        robeShape.intersect(sdf.halfSpace([0, 1, 0], 0.25)).subtract(hard(legCore)).bone('hips'),
        pair(robeShape.intersect(legZone).bone('leg.L')),
        sleeves,
      )
      .paintWhere(vNeck, C.inner)
      .paintWhere(underskirt.round(0.004).subtract(torso.round(0.002)), C.trim, 0.002);
    k.body('robe', robe, { color: T.robe, roughness: 0.85 });

    // ------------------------------------------------------------------ trim: collar bands, collar ring, cuffs
    const shell = torso.round(0.0075).subtract(torso.round(-0.004));
    const bands = shell.intersect(sdf.union(cut(bandA), cut(bandB).intersect(sdf.halfSpace([0, -1, 0], -0.35))));
    const ring = shell
      .intersect(sdf.cylinder(0.098, 0.08).at(0, 0.47, -0.01))
      .subtract(sdf.cylinder(0.056, 0.2).at(0, 0.47, -0.01));
    k.body('trim', sdf.union(sdf.union(bands, ring).bone('chest'), cuffs), { color: C.trim, roughness: 0.8 });

    // ------------------------------------------------------------------ sash with a knot and two hanging ends
    const BELT_Y = 0.262;
    const frontZ = (s: sdf.Shape, x: number, y: number) => sdf.raycast(s, [x, y, 1], [0, 0, -1])![2];
    const sashBand = torso.round(0.011).smoothIntersect(0.006, sdf.box([0.5, 0.044, 0.5], 0.006).at(0, BELT_Y, 0));
    const KX = -0.028;
    const kz = frontZ(sashBand, KX, BELT_Y);
    const sashKnot = sdf.smoothUnion(
      0.006,
      sdf.ellipsoid([0.022, 0.02, 0.016]).at(KX, BELT_Y, kz + 0.004),
      sdf.ellipsoid([0.026, 0.013, 0.011]).rotateZ(-20).at(KX - 0.028, BELT_Y + 0.006, kz),
      sdf.ellipsoid([0.026, 0.013, 0.011]).rotateZ(20).at(KX + 0.028, BELT_Y + 0.006, kz),
    );
    const tail = (pts: [number, number, number][]) =>
      sdf.chain(
        pts.map(([x, y, r]) => [x, y, frontZ(robeShape, x, y) + r + 0.003, r] as [number, number, number, number]),
        0.01,
      );
    const tails = sdf.union(
      tail([
        [KX - 0.006, BELT_Y - 0.014, 0.012],
        [KX - 0.014, 0.21, 0.012],
        [KX - 0.02, 0.17, 0.011],
        [KX - 0.022, 0.138, 0.01],
      ]),
      tail([
        [KX + 0.008, BELT_Y - 0.014, 0.012],
        [KX + 0.018, 0.215, 0.0115],
        [KX + 0.026, 0.178, 0.0105],
      ]),
    );
    k.body('sash', sdf.union(sashBand.bone('spine'), sashKnot.bone('spine'), tails.bone('hips')), {
      color: C.sash,
      roughness: 0.8,
    });

    // ------------------------------------------------------------------ wooden prayer beads around the neck
    const beadBase = torso.round(0.0075);
    const BEADS = 30;
    const beads = sdf.union(
      ...Array.from({ length: BEADS }, (_, i) => {
        const a = (2 * Math.PI * i) / BEADS;
        const f = (1 + Math.cos(a)) / 2;
        const r = i === 0 ? 0.013 : 0.0085;
        const p = sdf.surfacePoint(beadBase, [0.08 * Math.sin(a), 0.462 - 0.1 * f * f, 0.07 * Math.cos(a) - 0.01], r);
        return sdf.sphere(r).at(p[0], p[1], p[2]);
      }),
    );
    k.body('beads', beads.bone('chest'), { color: C.bead, roughness: 0.45, detail: 0.0035 });

    // ------------------------------------------------------------------ wide trousers
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.1, 0.05, 0.08]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.cone([HIP[0], 0.2, 0], [0.094, 0.1, 0.004], 0.052, 0.057).bone('leg.L')),
    );
    k.body('pants', pants, { color: T.pants, roughness: 0.85 });

    // ------------------------------------------------------------------ cloth wraps: forearms, hands, shins
    const lerp3 = (a: V3, b: V3, t: number): [number, number, number] => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
    const forearmWrap = sdf.cone(lerp3(ELBOW, WRIST, 0.2), lerp3(ELBOW, WRIST, 1.03), 0.039, 0.034).round(0.003).bone('forearm.L');
    const handWrap = inHand(palm.round(0.0035).intersect(sdf.box([0.1, 0.03, 0.1]).at(0, -0.012, 0))).bone('hand.L');
    const shinWrap = sdf.cone([0.097, 0.108, 0.004], [0.098, 0.035, 0.004], 0.049, 0.041).round(0.003).bone('shin.L');
    const wrapDark = rgb(C.wrapDark);
    const wraps = pair(sdf.union(forearmWrap, handWrap, shinWrap)).paintFn((_x, y, z, base) =>
      Math.sin((y + 0.5 * z) * 330) > 0.8 ? wrapDark : base,
    );
    k.body('wraps', wraps, { color: C.wrap, roughness: 0.95 });

    // ------------------------------------------------------------------ sandals: a sole, an instep strap, a heel strap
    const sole = sdf
      .ellipsoid([0.056, 0.05, 0.098])
      .at(0.003, 0.008, 0.036)
      .intersect(sdf.box([0.3, 0.016, 0.4]).at(0, 0.008, 0));
    const footShell = footLocal.round(0.004).subtract(footLocal.round(-0.001));
    const straps = footShell.intersect(
      sdf.union(sdf.box([0.2, 0.06, 0.018]).at(0, 0.03, 0.062), sdf.box([0.2, 0.014, 0.06]).at(0, 0.028, -0.03)),
    );
    k.body('sandals', pair(footPose(sdf.union(sole.paint(C.sole), straps))), { color: C.strap, roughness: 0.7 });

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
    const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const lerp = (a: V3, b: V3, t: number): V3 => add(a, add(b, a, -1), t);
    // The left hand's rest directions as inHand turns them: the fingers and the palm's normal.
    const handDir = (v: V3) => turn(turn(v, 2, HAND_TURN.z), 0, HAND_TURN.x);

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [ANKLE[0], 0, -0.045],
          toe: [ANKLE[0], 0, 0.11],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 50, 12, 0.03));

    // One arm from a wrist target, an elbow pole, the fingers' direction, and the palm's normal, all
    // in the chest's rest frame. Keys are written for the right arm (x < 0); `m` mirrors them.
    const armRig = (side: 1 | -1) => {
      const m = (v: V3): V3 => [side === 1 ? -v[0] : v[0], v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const chain = { root: m(mx(SHOULDER)), mid: m(mx(ELBOW)), end: m(mx(WRIST)) };
      const rest = { dir: m(mx(handDir([0, -1, 0]))), up: m(mx(handDir([-1, 0, 0]))) };
      const solve = (wrist: V3, pole: V3, dir: V3, up: V3) => {
        const a = reach(chain, wrist, pole);
        const h = orient([a.upper, a.lower], rest, { dir: norm(dir), up: norm(up) });
        return {
          [`upperarm.${tag}`]: { rotate: a.upper },
          [`forearm.${tag}`]: { rotate: a.lower },
          [`hand.${tag}`]: { rotate: h },
        };
      };
      return { m, chain, rest, solve, pole: m([-0.58, 0.6, -0.015]), back: m([-0.6, 0.25, -0.3]) };
    };
    type Track = { wrist: [number, V3][]; pole: [number, V3][]; dir: [number, V3][]; up: [number, V3][] };
    const play = (a: ReturnType<typeof armRig>, t: Track, p: number) =>
      a.solve(keys(p, t.wrist), keys(p, t.pole), keys(p, t.dir), keys(p, t.up));

    // ------------------------------------------------------------------ attack: a palm strike with a step
    // He coils to his right with the right hand chambered at the hip, palm in, and the left hand up
    // in guard. Then the left foot steps in, the hips and the chest unwind, and the right palm drives
    // straight out from the shoulder, fingers up, the palm flat to the front; the left hand pulls back
    // to the hip. A short hold, then back to the stance. The palm stays below the chin.
    const aR = armRig(-1);
    const aL = armRig(1);
    const HIP_R: V3 = [-0.19, 0.27, -0.02];
    const STRIKE: V3 = [-0.118, 0.378, 0.17];
    const CHAMBER_POLE: V3 = [-0.35, -0.5, -0.8]; // the elbow down and back
    const FINGERS_UP: V3 = [0.05, 1, 0.12];
    const PALM_OUT: V3 = [-0.62, 0.05, 0.78]; // faces the front once the body has turned about 40 degrees
    const strikeR: Track = {
      wrist: [[0, aR.chain.end], [0.26, HIP_R], [0.34, [-0.19, 0.29, 0.01]], [0.44, STRIKE], [0.72, STRIKE], [1, aR.chain.end]],
      pole: [[0, aR.pole], [0.26, CHAMBER_POLE], [0.44, [-0.35, -0.9, 0.1]], [0.72, [-0.35, -0.9, 0.1]], [1, aR.pole]],
      dir: [[0, aR.rest.dir], [0.26, [0, 0.2, 1]], [0.36, [0, 0.5, 1]], [0.44, FINGERS_UP], [0.72, FINGERS_UP], [1, aR.rest.dir]],
      up: [[0, aR.rest.up], [0.26, [1, 0, 0]], [0.36, [0.3, 0, 1]], [0.44, PALM_OUT], [0.72, PALM_OUT], [1, aR.rest.up]],
    };
    const m = aL.m;
    const guardL: Track = {
      wrist: [[0, aL.chain.end], [0.26, m([-0.1, 0.33, 0.13])], [0.44, m(HIP_R)], [0.72, m(HIP_R)], [1, aL.chain.end]],
      pole: [[0, aL.pole], [0.26, m([-0.5, -0.6, 0.1])], [0.44, m(CHAMBER_POLE)], [0.72, m(CHAMBER_POLE)], [1, aL.pole]],
      dir: [[0, aL.rest.dir], [0.26, m([0.15, 1, 0.25])], [0.44, m([0, 0.2, 1])], [0.72, m([0, 0.2, 1])], [1, aL.rest.dir]],
      up: [[0, aL.rest.up], [0.26, m([0.6, 0, 0.8])], [0.44, m([1, 0, 0])], [0.72, m([1, 0, 0])], [1, aL.rest.up]],
    };
    k.animation('attack', {
      duration: 0.75,
      loop: false,
      pose: (_t, p) => {
        const hipsY = keys(p, [[0, 0], [0.26, -12], [0.44, 16], [0.72, 16], [1, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.26, -16], [0.42, 24], [0.72, 24], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.26, 3], [0.44, 13], [0.72, 13], [1, 0]] as const);
        const legX = keys(p, [[0, 0], [0.26, -4], [0.44, -22], [0.72, -22], [1, 0]] as const);
        const stepZ = keys(p, [[0, 0], [0.26, -0.008], [0.44, 0.04], [0.72, 0.04], [1, 0]] as const);
        const drop = LEG * (1 - Math.cos(legX * rad));
        return {
          hips: { move: [0, -drop, stepZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 3, chestY, 0] },
          head: { rotate: [-0.7 * lean, -0.8 * (hipsY + chestY), 0] },
          'leg.L': { rotate: [legX, 0, 0] },
          'leg.R': { rotate: [-legX, 0, 0] },
          'foot.L': { rotate: [-legX, 0, 0] },
          'foot.R': { rotate: [legX, 0, 0] },
          ...play(aR, strikeR, p),
          ...play(aL, guardL, p),
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a spinning kick
    // He crouches and coils to his right, hops, and spins one full turn to his left on the left
    // foot. The right knee comes up, the leg shoots out to the side at hip height and sweeps a
    // circle; the body leans away from the kick and the arms open for balance. The skirt's sides
    // follow the legs, so the kick lifts the skirt. He lands in the crouch and rises.
    k.animation('attack2', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const spin = keys(p, [[0, 0], [0.22, -25], [0.28, -25], [0.72, 360], [1, 360]] as const);
        const crouch = keys(p, [[0, 0], [0.22, 1], [0.3, 0.4], [0.38, 0], [0.66, 0], [0.76, 1], [0.86, 1], [1, 0]] as const);
        const kick = keys(p, [[0.3, 0], [0.42, 1], [0.6, 1], [0.7, 0]] as const);
        const chamber = keys(p, [[0.28, 0], [0.35, 1], [0.44, 0], [0.58, 0], [0.66, 1], [0.74, 0]] as const);
        const hop = 0.03 * keys(p, [[0.3, 0], [0.44, 1], [0.6, 1], [0.72, 0]] as const);
        const bend = 28 * crouch;
        const drop = 2 * 0.0625 * (1 - Math.cos(bend * rad));
        const bendR = bend * (1 - kick);
        return {
          hips: { move: [0, hop - drop, 0], rotate: [0, spin, 0] },
          spine: { rotate: [8 * crouch, 0, -14 * kick] },
          chest: { rotate: [4 * crouch, 0, -6 * kick] },
          head: { rotate: [-6 * crouch, 0, 16 * kick] },
          'leg.L': { rotate: [-bend, 0, 0] },
          'shin.L': { rotate: [2 * bend, 0, 0] },
          'foot.L': { rotate: [-bend, 0, 0] },
          'leg.R': { rotate: [-bendR - 12 * kick - 30 * chamber, 0, -84 * kick] },
          'shin.R': { rotate: [2 * bendR + 70 * chamber, 0, 0] },
          'foot.R': { rotate: [-bendR + 20 * kick, 0, 0] },
          'upperarm.L': { rotate: [-35 * crouch, 0, 45 * kick] },
          'forearm.L': { rotate: [-60 * crouch - 25 * kick, 0, 0] },
          'upperarm.R': { rotate: [-35 * crouch, 0, -45 * kick] },
          'forearm.R': { rotate: [-60 * crouch - 25 * kick, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const whip = keys(p, [[0, 0], [0.2, 1], [0.4, 0.5], [0.6, -0.2], [0.82, 0]] as const, 'spline');
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(clamp01((p - 0.04) / 0.2)) + bump(clamp01((p - 0.58) / 0.32));
        const back = 0.03 * step;
        const lean = Math.asin(back / LEG) / rad; // the left foot stays planted as the hips move back
        return {
          hips: { move: [0, -legDrop(LEG, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-4 * whip, 0, 0] },
          head: { rotate: [-10 * whip, -6 * whip, 4 * whip] },
          'upperarm.L': { rotate: [-12 * h, 0, 16 * h] },
          'forearm.L': { rotate: [-16 * h, 0, 0] },
          'upperarm.R': { rotate: [-8 * h, 0, -14 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'leg.R': { rotate: [lean + 8 * lift, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [-lean - 8 * lift, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The blow snaps him back; he slumps forward and wobbles over planted feet, then tips back over
    // his heels and lands on his back. The big round head props the body a little; the neck bends
    // forward and the head turns to the side. The arms fly out and fall to the ground at his sides.
    const LIE = 80; // the hips' final tilt back, degrees
    const LIE_Y = 0.125; // the hips' height when he lies on his back
    const HEEL = 0.045; // the back of the foot, behind the ankle's ground point
    const HAND_Y = 0.045; // the wrist's height on the ground
    const BEND_NECK = 6;
    const BEND_HEAD = 6;
    const TURN = 22;
    const HIPS0: V3 = [0, 0.2, 0];
    const END: V3 = [0, LIE_Y - 0.2, -HEEL - 0.2 * Math.sin(LIE * rad) + HEEL * Math.cos(LIE * rad)];
    const toWorld = (v: V3): V3 => add(add(HIPS0, END), turn(add(v, HIPS0, -1), 0, -LIE));
    const toBody = (w: V3): V3 => add(HIPS0, turn(add(w, add(HIPS0, END), -1), 0, LIE));
    const LEG_DOWN = Math.asin(clamp01((LIE_Y - 0.035) / 0.165)) / rad - (90 - LIE);
    type Weights = { hitB: number; sag: number; fly: number; land: number };
    const deathArm = (side: 1 | -1) => {
      const f = (v: V3): V3 => [v[0] * side, v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const chain = { root: f(SHOULDER), mid: f(ELBOW), end: f(WRIST) };
      const shoulderW = toWorld(chain.root);
      const span = Math.sqrt(Math.max(0, 0.165 ** 2 - (shoulderW[1] - HAND_Y) ** 2));
      const out = norm([0.93 * side, 0, 0.37]);
      const handEnd = toBody([shoulderW[0] + out[0] * span, HAND_Y, shoulderW[2] + out[2] * span]);
      return (w: Weights) => {
        const stand = add(add(add(chain.end, f([0.05, 0.05, 0.05]), w.hitB), [0, -0.03, 0.02], w.sag), f([0.08, 0.06, 0.03]), w.fly);
        const a = reach(chain, lerp(stand, handEnd, w.land), lerp(f([0.58, 0.6, -0.015]), f([0.6, 0.45, 0.1]), w.land));
        return { [`upperarm.${tag}`]: { rotate: a.upper }, [`forearm.${tag}`]: { rotate: a.lower } };
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
        const u = clamp01((p - 0.36) / 0.24); // the fall speeds up to the impact
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 4 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const settle = keys(p, [[0.56, 0], [0.8, 1]] as const);
        const back = 0.022 * hitB;
        const lean = Math.asin(back / LEG) / rad;
        const a = tilt * rad;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(LEG, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = LEG_DOWN * clamp01((tilt - LIE + 18) / 18);
        const w = { hitB, sag, fly, land };
        return {
          hips: { move: hipsMove, rotate: [-tilt, 0, 0] },
          spine: { rotate: [-8 * hitB + 6 * sag, 0, 4 * wob] },
          chest: { rotate: [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob] },
          neck: { rotate: [-8 * hitB + 5 * sag + BEND_NECK * land, 0, 0] },
          head: { rotate: [-14 * hitB + 8 * sag + BEND_HEAD * land, -8 * hitB + TURN * settle, 8 * wob] },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean + 10 * settle, 18 * settle, 0] },
          'foot.R': { rotate: [lean + 10 * settle, -18 * settle, 0] },
          ...deathL(w),
          ...deathR(w),
        };
      },
    });

    // ------------------------------------------------------------------ victory: a one-hand salute and a bow
    // The right hand rises in front of the chest, fingers up and the palm's edge to the front (the
    // monk's one-hand greeting); he bows from the waist, rises, and holds the salute. The fingertips
    // stay below the chin through the bow.
    const vR = armRig(-1);
    const SALUTE: V3 = [-0.055, 0.345, 0.14];
    const saluteR: Track = {
      wrist: [[0, vR.chain.end], [0.3, SALUTE], [1, SALUTE]],
      pole: [[0, vR.pole], [0.3, [-0.6, -0.7, 0.2]], [1, [-0.6, -0.7, 0.2]]],
      dir: [[0, vR.rest.dir], [0.3, [0, 1, 0.08]], [1, [0, 1, 0.08]]],
      up: [[0, vR.rest.up], [0.3, [1, 0, 0.1]], [1, [1, 0, 0.1]]],
    };
    k.animation('victory', {
      duration: 1.3,
      loop: false,
      pose: (_t, p) => {
        const up = keys(p, [[0.05, 0], [0.3, 1]] as const);
        const bow = keys(p, [[0.35, 0], [0.5, 1], [0.64, 1], [0.8, 0]] as const);
        return {
          hips: { move: [0, -0.004 * bow, -0.01 * bow] },
          spine: { rotate: [14 * bow, 0, 0] },
          chest: { rotate: [6 * bow, 0, 0] },
          head: { rotate: [3 * bow - 3 * up * (1 - bow), 0, 0] },
          'upperarm.L': { rotate: [8 * up, 0, -2 * up] },
          'forearm.L': { rotate: [-6 * up, 0, 0] },
          ...play(vR, saluteR, p),
        };
      },
    });
  },
});
