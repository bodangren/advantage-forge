import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Alchemist — Alchemist's Synthesis hero (catalog `heroes/magic/alchemist`), about 0.98 m to the top
 * of the goggles, faces +Z. Target: docs/hero-mockups/alchemist_001.jpg (one front view; the beard is
 * left out so the face stays young, round, and beardless like every hero of the set). Built on the
 * adventurer's head, face, and chibi skeleton with knee bones.
 *
 * Role: player hero for a potion-brewing game, seen in 3D and as a 128 px sprite; the flask is the
 *   focal prop, the copper hair and brass goggles are the silhouette.
 * One idea: a beaming young alchemist holding up a big glass flask of glowing teal liquid, brass
 *   goggles pushed up on a copper mop of pointed tufts.
 * Proportions: goggles 0.98, hair tufts 0.93, eyes 0.63, chin 0.48, shoulders 0.385, belt 0.245,
 *   apron hem 0.14, boots 0.13. The flask (bulb r 0.09) is held up at shoulder height out to his left, its round body facing +Z.
 * Shape language: round and soft (face, gloves, flask, boots) with pointed hair tufts as the accents.
 * Palette (60/30/10): tunic green #5a7a3a and leather browns #8a5a35 / #6b4226; copper hair #c8572a;
 *   brass goggles #c9a24a and the teal flask #40c8b8 as the accents. Skin #f2c7a4.
 * Value plan: the dark gloves, lenses, and boots frame mid greens and browns; the bright copper hair
 *   and the glowing teal flask hold the strongest contrast.
 * Bodies: skin, hair, goggle brass/lens/strap, shirt, collar, trousers, apron, leather, buckle,
 *   gloves, boots, bottle, flask glass/liquid/cork.
 * Rig: the adventurer's chibi skeleton without the bandana and lantern bones, plus `liquid` on the
 *   left hand; the flask is rigid on hand.L. Clips: idle, walk, run, attack (a flask toss), attack2
 *   (a shake and a splash), hit, death, victory (a jump with the flask held high).
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#b07a34',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#8a3a1c',
  mouth: '#7a2a2a',
  teeth: '#fbf5ee',
  tongue: '#e0706a',
  hair: '#c8572a',
  hairLight: '#e2743c',
  hairDark: '#8a3a1c',
  brass: '#c9a24a',
  lens: '#101418',
  strap: '#3a2a20',
  tunic: '#5a7a3a',
  tunicFold: '#3e5a28',
  trousers: '#6e7560',
  apron: '#7a4a28',
  apronEdge: '#5a3418',
  belt: '#6b4226',
  buckle: '#e0b040',
  glove: '#3a2a20',
  boot: '#4a2e1c',
  sole: '#2c1a10',
  glass: '#cfe6ea',
  liquid: '#40c8b8',
  liquidBase: '#105048',
  cork: '#c9a06a',
  bottle: '#60e080',
  bottleBase: '#184020',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => scl(a, 1 / Math.hypot(a[0], a[1], a[2]));
const along = (p: V3, d: V3, s: number): V3 => add(p, scl(d, s));
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** `b` without its component along the unit vector `a`, normalized. */
const perp = (b: V3, a: V3): V3 => norm(sub(b, scl(a, dot(a, b))));
/** Places a shape built in a local frame: local X, Y, Z go to `ex`, `ey`, `ez`; the origin to `p`. */
const frame = (s: sdf.Shape, ex: V3, ey: V3, ez: V3, p: V3) => s.transform([...ex, 0, ...ey, 0, ...ez, 0, ...p, 1]);

// Joints: the adventurer's shoulders and legs. The left arm is bent up and forward, the fist under
// the flask; the right forearm hangs a little forward in a loose fist.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.22, 0.37, 0.05];
const WRIST: V3 = [0.24, 0.435, 0.123];
const ELBOW_R: V3 = [-0.18, 0.332, 0.0];
const WRIST_R: V3 = [-0.2, 0.236, 0.025];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)

const FIST_L = along(WRIST, norm(sub(WRIST, ELBOW)), 0.03);
const FIST_R = along(WRIST_R, norm(sub(WRIST_R, ELBOW_R)), 0.04);
// The flask: the bulb center sits half a palm past the left fist, up and out, so the glove wraps its underside.
const FLASK: V3 = add(FIST_L, [0.04, 0.035, 0.07]);
const FLASK_R = 0.09;
const FILL = 0.006; // the fill line relative to the bulb center: 55 percent of the bulb's volume

/** A fist closed around a grip through `g` along the unit axis `a`, entered from the wrist `w`. */
const fistAround = (g: V3, a: V3, w: V3) => {
  const toW = perp(sub(w, g), a);
  const side = cross(a, toW);
  const o = (u: number, v: number, s: number): V3 => add(add(add(g, scl(a, u)), scl(toW, v)), scl(side, s));
  return sdf.smoothUnion(
    0.012,
    sdf.capsule(o(0.012, 0.006, 0), o(-0.01, 0.006, 0), 0.034), // the palm around the grip
    sdf.capsule(o(0.016, -0.018, 0.004), o(-0.016, -0.018, 0.004), 0.02), // the finger roll
    sdf.cone(o(0.004, 0.012, 0.026), o(0.02, -0.004, 0.024), 0.015, 0.012), // the thumb over the grip
  );
};

export default defineAsset({
  name: 'alchemist',
  description:
    'Chibi alchemist hero with a copper mop of pointed tufts, brass goggles pushed up, a green tunic with a leather apron and bandolier, thick gloves, and a big flask of glowing teal liquid held up in the left hand.',
  detail: 0.006,
  reference: 'docs/hero-mockups/alchemist_001.jpg',
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { copper: C.hair, brown: '#6b3a20', black: '#231a17' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { green: C.tunic, blue: '#3f5f8a', rust: '#a0522d' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'copper', skin: 'fair', clothing: 'green' },
    blue: { eyes: 'blue', hair: 'brown', skin: 'fair', clothing: 'blue' },
    rust: { eyes: 'green', hair: 'black', skin: 'tan', clothing: 'rust' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairLight: k.tint('hair', { color: C.hairLight, follow: 1 }),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      tunic: k.tint('clothing'),
      tunicFold: k.tint('clothing', { color: C.tunicFold, follow: 1 }),
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
      liquid: { parent: 'hand.L', at: FLASK },
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

    // ------------------------------------------------------------------ head and face (the adventurer's)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.024, 0.02, 0.018]).at(0, 0.572, faceZ(0, 0.572) - 0.002).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.032, 0.05, 0.034])
        .subtract(sdf.sphere(0.02).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.612, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.032).bone('forearm.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.054, 0.058, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.044, 0.05, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.038, 0.044, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.025, 0.028, 0.07]), EYE[0], EYE[1] - 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.052, 0.009, 20, 160), 0.3).at(EYE[0], EYE[1] - 0.006, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.013), x + 0.016, EYE[1] + 0.018),
        at(sdf.sphere(0.0065), x - 0.015, EYE[1] - 0.022),
      ]),
    );
    // Thick, arched, eager brows, well below the bandana.
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.024, 60, 118), 0.3).at(0.102, 0.725 - 0.1, 0.1));
    // A big open grin with the upper teeth and a bit of tongue.
    const MOUTH: V3 = [0, 0.552, 0.1];
    const mouth = sdf
      .extrude(
        profile.polygon(
          [
            [-0.064, 0.006],
            [0.064, 0.006],
            [0.05, -0.02],
            [0.026, -0.04],
            [0, -0.046],
            [-0.026, -0.04],
            [-0.05, -0.02],
          ],
          { smooth: true, samples: 5 },
        ),
        0.3,
      )
      .at(...MOUTH);
    // Teeth and tongue sit inside a dark rim, so the grin reads as a mouth, not a white bar.
    const inner = mouth.round(-0.006);
    const teeth = inner.intersect(sdf.halfSpace([0, -1, 0], -(MOUTH[1] - 0.019)));
    const tongue = inner.intersect(sdf.sphere(0.03).at(0, MOUTH[1] - 0.046, 0.2).elongate(0.014, 0, 0.3));
    const blush = pair(at(sdf.sphere(0.038), 0.142, 0.562));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, '#4a1818')
      .paintWhere(inner, T.mouth, 0.002)
      .paintWhere(tongue, C.tongue, 0.004)
      .paintWhere(teeth, C.teeth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a copper mop of pointed tufts
    // A full volume split into locks by swirling grooves, ringed by twelve thick pointed tufts (a
    // fringe of three over the brow, pairs at the sides, the crown, and the back). The goggles ride
    // on the front of the crown, so the crown tufts stand behind them.
    const DEG = Math.PI / 180;
    const skull = sdf.ellipsoid([HEAD[0], HEAD[1], HEAD[2]]).at(0, HEAD_Y, 0);
    const faceMask = sdf.ellipsoid([0.235, 0.16, 0.22]).at(0, 0.61, 0.15);
    const volume = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid([HEAD[0] + 0.018, HEAD[1] + 0.018, HEAD[2] + 0.018]).at(0, HEAD_Y + 0.008, -0.01),
        sdf.ellipsoid([0.19, 0.07, 0.175]).rotateZ(6).at(-0.01, 0.835, -0.012),
      )
      .smoothSubtract(0.015, faceMask);
    const HC: V3 = [0, 0.7, -0.01];
    /** The point on the hair volume seen from the center in direction (polar `th` from the top, azimuth `ph` from the front toward his left), lifted along the ray. */
    const hs = (th: number, ph: number, lift = 0): V3 => {
      const d: V3 = [Math.sin(th * DEG) * Math.sin(ph * DEG), Math.cos(th * DEG), Math.sin(th * DEG) * Math.cos(ph * DEG)];
      const hit = sdf.raycast(volume, along(HC, d, 0.6), scl(d, -1))!;
      return along(hit, d, lift);
    };
    const up = (p: V3, dy: number): V3 => [p[0], p[1] + dy, p[2]];
    const SWIRL = 22;
    const grooveStarts = [-75, -45, -15, 15, 45, 75, 105, 135, 165, 195, 225, 255];
    const grooves = sdf.union(
      ...grooveStarts.map((g) =>
        sdf.chain(
          [
            [...hs(12, g, 0), 0.004],
            [...hs(28, g + SWIRL * 0.3, 0), 0.008],
            [...hs(46, g + SWIRL * 0.65, 0), 0.011],
            [...hs(68, g + SWIRL, 0), 0.012],
          ],
          0.004,
        ),
      ),
      // A few short grooves under the band at the back.
      ...[150, 180, 210].map((g) =>
        sdf.chain(
          [
            [...hs(104, g, 0), 0.008],
            [...hs(128, g + 4, 0), 0.01],
            [...hs(150, g + 6, 0), 0.006],
          ],
          0.004,
        ),
      ),
    );
    // A pointed tuft: a chain from inside the volume that swings out and ends in a sharp tip.
    const lock = (th: number, ph: number, dth: number, dph: number, lift: number, r: number, tipUp: number) =>
      sdf.chain(
        [
          [...hs(th, ph, -0.022), r],
          [...hs(th + dth * 0.5, ph + dph * 0.5, 0.012 + lift * 0.35), r * 0.78],
          [...up(hs(th + dth, ph + dph, lift), tipUp), 0.005],
        ],
        0.012,
      );
    const lockPair = (th: number, ph: number, dth: number, dph: number, lift: number, r: number, tipUp: number) => [
      lock(th, ph, dth, dph, lift, r, tipUp),
      lock(th, -ph, dth, -dph, lift, r, tipUp),
    ];
    const tufts = sdf.union(
      ...lockPair(58, 70, 14, 16, 0.04, 0.042, 0.0),
      ...lockPair(64, 108, 14, 14, 0.044, 0.044, -0.008),
      ...lockPair(70, 146, 14, 12, 0.042, 0.042, -0.01),
      ...lockPair(30, 150, 10, -14, 0.03, 0.04, 0.0),
      lock(64, 180, 16, 0, 0.04, 0.046, -0.015),
    );
    // The fringe: three points over the brow (on the skull's front, lifted).
    const bandFront = skull.round(0.02);
    const fr = (x: number, y: number, lift: number): V3 => {
      const h = sdf.raycast(bandFront, [x, y, 1], [0, 0, -1])!;
      return [h[0], h[1], h[2] + lift];
    };
    const fringeTuft = (x0: number, x1: number, y0: number, y1: number) =>
      sdf.chain(
        [
          [...fr(x0, 0.8, 0.0), 0.034],
          [...fr((x0 + x1) / 2, y0, 0.014), 0.026],
          [...fr(x1, y1, 0.008), 0.006],
        ],
        0.012,
      );
    const fringe = sdf.union(fringeTuft(0.02, 0.07, 0.775, 0.738), fringeTuft(-0.055, -0.105, 0.775, 0.735), fringeTuft(0.1, 0.15, 0.775, 0.74));
    const sideburns = pair(sdf.cone([0.192, 0.7, 0.04], [0.196, 0.61, 0.064], 0.026, 0.011));
    const hairShape = volume
      .smoothUnion(0.02, sideburns)
      .smoothUnion(0.025, tufts)
      .smoothSubtract(0.008, grooves.round(-0.003))
      .paintWhere(grooves.round(0.003), T.hairDark, 0.006)
      .smoothUnion(0.01, fringe);
    const hair = hairShape
      .paintFn((x, y, z, base) => {
        if (base[0] + base[1] + base[2] === 0) return base;
        const top = Math.min(1, Math.max(0, (y - 0.8) / 0.14)) * 0.7;
        const l = rgb(T.hairLight);
        return [base[0] + (l[0] - base[0]) * top, base[1] + (l[1] - base[1]) * top, base[2] + (l[2] - base[2]) * top];
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.0035, bone: 'head' });

    // ------------------------------------------------------------------ goggles pushed up on the hair
    // Two brass rings with black lenses on the crown's front, tilted back, joined by a bridge, with a
    // dark strap around the head.
    const GOG_X = 0.072;
    const GOG_Y = 0.815;
    const gogZ = sdf.raycast(volume, [GOG_X, GOG_Y, 1], [0, 0, -1])![2] + 0.016;
    // Tilted back 30 degrees (the lenses face forward and a little up), turned a little outward.
    const gogPose = (s: sdf.Shape) => s.rotateX(58).rotateY(10).at(GOG_X, GOG_Y, gogZ);
    const ringBrass = sdf.union(sdf.torus(0.058, 0.014), sdf.torus(0.062, 0.008).at(0, -0.012, 0));
    const lens = sdf.smoothUnion(0.006, sdf.cylinder(0.055, 0.02, 0.004).at(0, -0.002, 0), sdf.ellipsoid([0.054, 0.02, 0.054]).at(0, 0.004, 0));
    // The brass strap band, 0.02 wide, follows the finished hair shape (locks included) around the head.
    const strapBox = sdf.box([0.8, 0.02, 0.8], 0.006).rotateX(-6).at(0, 0.79, 0);
    const strapShell = hairShape.round(0.009).subtract(hairShape.round(-0.004)).smoothIntersect(0.004, strapBox);
    const bridge = sdf.capsule([-0.022, GOG_Y + 0.004, gogZ], [0.022, GOG_Y + 0.004, gogZ], 0.012);
    k.body('goggle-brass', sdf.union(hard(gogPose(ringBrass)), bridge).bone('head'), { color: C.brass, roughness: 0.4, metalness: 0.8, detail: 0.004 });
    k.body('goggle-lens', hard(gogPose(lens)).bone('head'), { color: C.lens, roughness: 0.15, metalness: 0.2, detail: 0.004 });
    k.body('goggle-strap', strapShell.bone('head'), { color: C.brass, roughness: 0.4, metalness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ tunic, collar, trousers
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
            [0.13, 0.25],
            [0.138, 0.21],
            [0.14, 0.196],
            [0.13, 0.186],
            [0, 0.186],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(
          0.012,
          sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 1.02), 0.048, 0.045),
          sdf.cone(lerp(s, e, 0.9), lerp(s, e, 1.12), 0.05, 0.05).round(0.004).paint(T.tunicFold), // rolled cuff
        )
        .bone(tag);
    const shirt = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, ELBOW, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'))
      // Soft fold streaks that run down and around the tunic.
      .paintFn((x, y, z, base) => {
        if (y > 0.2 && y < 0.44 && Math.sin(Math.atan2(z, x) * 7 + y * 26) > 0.92) return rgb(T.tunicFold);
        return base;
      });
    k.body('shirt', shirt, { color: T.tunic, roughness: 0.85 });
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.115, 0.004], 0.05).bone('leg.L')),
    );
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });
    const collarRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.05, 0.5],
            [0.09, 0.494],
            [0.124, 0.47],
            [0.134, 0.448],
            [0.112, 0.434],
            [0.08, 0.455],
            [0.05, 0.468],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    // The fold: a lower flap that lies open in a V on the chest.
    const collarFlap = torso
      .round(0.014)
      .subtract(torso.round(-0.002))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.1, 0.47],
              [0.1, 0.47],
              [0.05, 0.415],
              [0, 0.375],
              [-0.05, 0.415],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    const collar = sdf
      .smoothUnion(0.012, collarRing, collarFlap)
      .paintFn((x, y, z, base) => (y < 0.446 + Math.max(0, z) * 0.1 || Math.abs(x) < 0.003 ? rgb(T.tunicFold) : base));
    k.body('collar', collar.bone('chest'), { color: T.tunic, roughness: 0.85 });

    // ------------------------------------------------------------------ apron: bib and skirt panel over the tunic
    const apronBody = sdf.smoothUnion(0.03, torso, sdf.ellipsoid([0.125, 0.085, 0.106]).at(0, 0.17, 0));
    const apronShell = apronBody.round(0.008).subtract(apronBody.round(-0.003));
    const bibP = profile.rect([0.18, 0.16], 0.02);
    const skirtP = profile.polygon(
      [
        [-0.1, 0.262],
        [0.1, 0.262],
        [0.098, 0.18],
        [0.05, 0.14],
        [0, 0.126],
        [-0.05, 0.14],
        [-0.098, 0.18],
      ],
      { smooth: true, samples: 5 },
    );
    const bibZone = sdf.extrude(bibP, 0.4).at(0, 0.335, 0.2);
    const skirtZone = sdf.extrude(skirtP, 0.4).at(0, 0, 0.2);
    const bibInner = sdf.extrude(profile.offsetProfile(bibP, -0.009), 0.4).at(0, 0.335, 0.2);
    const skirtInner = sdf.extrude(profile.offsetProfile(skirtP, -0.009), 0.4).at(0, 0, 0.2);
    // Two stitched strokes (dashes) run down the bib's sides and the skirt's sides.
    const dashes = (x: number, y0: number, y1: number, n: number) =>
      Array.from({ length: n }, (_, i) => sdf.extrude(profile.rect([0.005, ((y1 - y0) / n) * 0.55], 0.002), 0.4).at(x, y0 + ((i + 0.5) * (y1 - y0)) / n, 0.2));
    const stitches = sdf.union(
      ...[-0.072, 0.072].flatMap((x) => dashes(x, 0.27, 0.4, 7)),
      ...[-0.082, 0.082].flatMap((x) => dashes(x, 0.155, 0.23, 4)),
    );
    const apron = sdf
      .union(apronShell.intersect(bibZone).bone('spine'), apronShell.intersect(skirtZone).bone('hips'))
      .paint(C.apronEdge)
      .paintWhere(sdf.union(bibInner, skirtInner), C.apron, 0.002)
      .paintWhere(stitches, C.apronEdge, 0.001);
    k.body('apron', apron, {
      color: C.apron,
      roughness: 0.85,
      detail: 0.004,
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // ------------------------------------------------------------------ leather: belt, bandolier, pouch, bracers; gold buckle
    const beltY = 0.245;
    const belt = torso.round(0.012).smoothIntersect(0.006, sdf.box([0.5, 0.044, 0.5], 0.006).at(0, beltY, 0));
    // The bandolier crosses from his left shoulder to his right hip.
    const bandolier = torso
      .round(0.011)
      .smoothIntersect(0.005, sdf.box([0.034, 0.64, 0.8], 0.006).rotateZ(-45).at(-0.01, 0.33, 0));
    const pouchAt = sdf.surfacePoint(belt, [-0.12, beltY - 0.02, 0.2], 0);
    const pouch = sdf
      .union(sdf.box([0.06, 0.068, 0.04], 0.014), sdf.box([0.066, 0.03, 0.046], 0.01).at(0, 0.024, 0.002).paint(C.apronEdge))
      .rotateY(-40)
      .at(pouchAt[0], pouchAt[1] - 0.03, pouchAt[2] + 0.006);
    const bracer = (e: V3, w: V3, tag: string) => sdf.cone(lerp(e, w, 0.18), lerp(e, w, 0.5), 0.045, 0.043).round(0.004).bone(tag);
    k.body(
      'leather',
      sdf.union(belt.bone('spine'), bandolier.paint('#57371f').bone('spine'), pouch.bone('spine'), bracer(ELBOW, WRIST, 'forearm.L'), bracer(ELBOW_R, WRIST_R, 'forearm.R')),
      { color: C.belt, roughness: 0.6 },
    );
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.066, 0.052, 0.014], 0.007).subtract(sdf.box([0.04, 0.03, 0.03], 0.006)), sdf.box([0.008, 0.034, 0.01], 0.003).at(0.004, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    // The lip ring of the flask and the bottle's neck ring are gold too.
    const flaskLip = sdf.torus(0.028, 0.007).at(FLASK[0], FLASK[1] + 0.124, FLASK[2]).bone('hand.L');
    // The small potion bottle hangs on the bandolier at his chest.
    const bx = 0.03;
    const by = 0.372;
    const bz = sdf.raycast(torso, [bx, by, 1], [0, 0, -1])![2] + 0.026;
    const bottleGlass = sdf.smoothUnion(0.008, sdf.capsule([bx, by - 0.015, bz], [bx, by + 0.012, bz], 0.02), sdf.cylinder(0.009, 0.016).at(bx, by + 0.03, bz));
    const bottleRing = sdf.torus(0.011, 0.004).at(bx, by + 0.026, bz).bone('chest');
    k.body('gold', sdf.union(buckle.bone('spine'), flaskLip, bottleRing), { color: C.buckle, roughness: 0.35, metalness: 0.8, detail: 0.004 });
    k.body('bottle', bottleGlass.bone('chest'), { color: C.bottleBase, roughness: 0.2, emissive: C.bottle, emissiveIntensity: 1.2, detail: 0.004 });
    const bottleCork = sdf.cylinder(0.011, 0.014, 0.004).at(bx, by + 0.045, bz);

    // ------------------------------------------------------------------ gloves (thick, dark) and boots
    const glovePair = (tag: string, e: V3, w: V3, fist: V3, axis: V3) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(e, w, 0.45), w, 0.041, 0.038).bone(tag === 'L' ? 'forearm.L' : 'forearm.R'),
        fistAround(fist, axis, w).bone(tag === 'L' ? 'hand.L' : 'hand.R'),
      );
    const gloves = sdf.union(
      glovePair('L', ELBOW, WRIST, FIST_L, norm([1, 0.1, -0.35])),
      glovePair('R', ELBOW_R, WRIST_R, FIST_R, norm([0, -0.25, 1])),
    );
    k.body('gloves', gloves, { color: C.glove, roughness: 0.7, detail: 0.004 });
    const shoeFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.05, 0.075, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shoe = shoeFoot
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    // The boot shaft with a folded cuff, rigid on the shin bone.
    const shaft = sdf
      .union(sdf.cylinder(0.058, 0.058, 0.014).at(ANKLE[0] - 0.004, 0.099, 0.002), sdf.torus(0.058, 0.011).at(ANKLE[0] - 0.004, 0.126, 0.002))
      .bone('shin.L');
    k.body('boots', pair(sdf.union(shoe, shaft)), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the flask in the left hand
    // Local frame: the bulb center at the origin, the neck up. A glass bulb with a neck, half full of
    // glowing teal liquid cut flat at the fill line, a cork in the neck.
    const flaskAt = (s: sdf.Shape) => s.at(FLASK[0], FLASK[1], FLASK[2]);
    const glassShape = sdf.smoothUnion(0.022, sdf.sphere(FLASK_R), sdf.cylinder(0.024, 0.06, 0.004).at(0, 0.1, 0));
    // A thin white highlight band around the neck and a soft glint on the bulb.
    const glass = glassShape
      .paintWhere(sdf.cylinder(0.06, 0.007).at(0, 0.106, 0), '#ffffff', 0.002)
      .paintWhere(sdf.sphere(0.014).at(-0.048, 0.05, 0.056), '#ffffff', 0.008);
    k.body('flask-glass', flaskAt(glass).bone('hand.L'), { color: C.glass, roughness: 0.1, opacity: 0.35, detail: 0.005 });
    const bubbles = sdf.union(
      ...[
        [0.022, 0, 0.018, 0.011],
        [-0.03, 0.002, -0.012, 0.009],
        [0.004, 0.003, -0.034, 0.008],
        [-0.012, 0.001, 0.036, 0.007],
        [0.04, -0.002, -0.02, 0.006],
      ].map(([x, y, z, r]) => sdf.sphere(r!).at(x!, FILL + y!, z!)),
    );
    const liquid = sdf.smoothUnion(0.006, sdf.sphere(FLASK_R - 0.006).intersect(sdf.halfSpace([0, 1, 0], FILL)), bubbles.intersect(sdf.sphere(FLASK_R - 0.006)));
    k.body('flask-liquid', flaskAt(liquid).bone('liquid'), { color: C.liquidBase, roughness: 0.25, emissive: C.liquid, emissiveIntensity: 0.6, detail: 0.004 });
    const cork = sdf.cylinder(0.03, 0.036, 0.01).at(0, 0.148, 0);
    k.body('cork', sdf.union(flaskAt(cork).bone('hand.L'), bottleCork.bone('chest')), { color: C.cork, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    type P = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;
    // An arm that reaches a wrist target; the rest target gives zero rotation, so a clip that starts and ends there loops cleanly.
    const armTo = (arm: typeof ARM_L, rest: V3, target: V3, pole: V3) => {
      const r = reach(arm, target, pole);
      const r0 = reach(arm, rest, pole);
      return { upper: sub(r.upper, r0.upper), lower: sub(r.lower, r0.lower) };
    };
    const POLE_L: V3 = [0.3, 0.1, -0.1];
    const POLE_R: V3 = [-0.5, 0.25, -0.35];
    const reachL = (t: V3) => armTo(ARM_L, WRIST, t, POLE_L);
    const reachR = (t: V3) => armTo(ARM_R, WRIST_R, t, POLE_R);

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        // The flask bobs a little and the liquid sloshes.
        'forearm.L': { rotate: [-4 * bump(p, 1, 0.2), 0, 0] },
        liquid: { scale: [1 + 0.02 * wave(p, 2), 1 + 0.03 * wave(p, 2, 0.25), 1 + 0.02 * wave(p, 2)] },
      }),
    });

    // The legs come from motion.gait: planted stance feet, a knee lift in the swing, heel strike
    // and toe-off. The heel and the toe are the ends of the boot's sole at y = 0.
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
          heel: [0.093, 0, -0.021],
          toe: [0.108, 0, 0.087],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The flask arm stays raised and only sways; the free arm swings.
          'upperarm.L': { rotate: [armSwing * 0.2 * s, 0, -8] as const },
          'forearm.L': { rotate: [-armSwing * 0.1 * Math.abs(s), 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -8] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.3 * Math.max(0, s), 0, 0] as const },
          liquid: { scale: [1 + 0.03 * wave(p, 2), 1 + 0.04 * wave(p, 2, 0.25), 1 + 0.03 * wave(p, 2)] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 50, 12, 0.03));

    // ---------------------------------------------------------------- attack: a flask toss
    // Wind-up: the chest turns and the flask hand swings back and down. Toss: the chest turns in and
    // the arm swings up and forward, the wrist snapping the flask over (it stays in the hand).
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const hand = keys(
          p,
          [
            [0, WRIST],
            [0.3, [0.29, 0.27, -0.02]],
            [0.42, [0.29, 0.27, -0.02]],
            [0.52, [0.32, 0.44, 0.12]],
            [0.62, [0.32, 0.44, 0.14]],
            [0.82, [0.27, 0.44, 0.12]],
            [1, WRIST],
          ] as const,
          'spline',
        );
        const arm = reachL(hand);
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.4, 0.5, p));
        const toss = ease(0.42, 0.54, p) * (1 - ease(0.66, 1, p));
        const hipsZ = -0.012 * wind + 0.03 * toss;
        const plant = (Math.asin(Math.max(-0.9, Math.min(0.9, hipsZ / 0.13))) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, Math.abs(plant)) - 0.008 * wind, hipsZ], rotate: [0, 10 * wind - 10 * toss, 0] },
          spine: { rotate: [-3 * wind + 5 * toss, 6 * wind - 4 * toss, 0] },
          chest: { rotate: [-4 * wind + 3 * toss, 22 * wind - 18 * toss, 0] },
          head: { rotate: [-3 * wind + 3 * toss, -30 * wind + 26 * toss, 0] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: [-8 * toss, 0, 0] },
          'upperarm.R': { rotate: [-25 * wind + 30 * toss, 0, -8 - 10 * wind] },
          'forearm.R': { rotate: [-20 * wind, 0, 0] },
          'leg.L': { rotate: [plant, 0, 0] },
          'leg.R': { rotate: [plant, 0, 0] },
          'foot.L': { rotate: [-plant, 0, 0] },
          'foot.R': { rotate: [-plant, 0, 0] },
          liquid: { scale: [1 + 0.05 * toss, 1 + 0.05 * toss, 1 + 0.05 * toss] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- attack2: a shake and a splash
    // He lifts the flask, shakes it hard (the liquid sloshes), then thrusts it out and the liquid
    // scales up in a splash before he lowers it.
    k.animation('attack2', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const raise = ease(0.04, 0.24, p) * (1 - ease(0.84, 1, p));
        const shake = ease(0.24, 0.32, p) * (1 - ease(0.56, 0.62, p));
        const thrust = ease(0.58, 0.66, p) * (1 - ease(0.8, 0.94, p));
        const held = lerp(WRIST, [0.31, 0.48, 0.13], raise);
        const target: V3 = [
          held[0] + 0.015 * shake * wave(p, 5),
          held[1] + 0.02 * shake * wave(p, 5, 0.25),
          held[2] + 0.02 * shake * wave(p, 5, 0.5) + 0.04 * thrust,
        ];
        const arm = reachL(target);
        const splash = ease(0.62, 0.7, p) * (1 - ease(0.72, 0.92, p));
        const sl = 1 + 0.08 * splash + 0.03 * shake * wave(p, 5);
        return {
          hips: { move: [0, -0.008 * shake * bump(p, 5), 0] },
          spine: { rotate: [3 * shake * wave(p, 5, 0.5) + 4 * thrust, 0, 0] },
          chest: { rotate: [-3 * shake + 2 * thrust, -6 * shake, 0] },
          head: { rotate: [-4 * thrust, 8 * shake * wave(p, 5, 0.25), 0] },
          'upperarm.L': { rotate: [arm.upper[0], arm.upper[1], arm.upper[2] - 8 * raise] },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: [12 * shake * wave(p, 5, 0.25) - 20 * thrust, 0, 8 * shake * wave(p, 5)] },
          'upperarm.R': { rotate: [-14 * raise + 8 * shake * wave(p, 5, 0.5), 0, -10 * raise] },
          'forearm.R': { rotate: [-18 * raise, 0, 0] },
          liquid: { scale: [sl, 1 + 0.12 * splash + 0.05 * shake * wave(p, 5, 0.25), sl] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- legs on the knees
    // A planted leg reaches from the hip through the knee to an ankle target in the hips' rest
    // frame (so it moves against the hips), and the foot takes the opposite turn: `pitch` > 0
    // points the toes down, < 0 lifts them. `yaw` is the hips' turn about Y; the foot then turns
    // back by it, so it keeps pointing to world +Z.
    const FLAT_FOOT = { dir: [0, 0, 1] as V3, up: [0, 1, 0] as V3 };
    const legTo = (side: 1 | -1, ankle: V3, pitch: number, yaw = 0) => {
      const m = (v: V3): V3 => (side > 0 ? v : mx(v));
      const a = (pitch * Math.PI) / 180;
      const c = Math.cos(-yaw * DEG), s = Math.sin(-yaw * DEG);
      const want = { dir: [Math.cos(a) * s, -Math.sin(a), Math.cos(a) * c] as V3, up: [Math.sin(a) * s, Math.cos(a), Math.sin(a) * c] as V3 };
      if (Math.hypot(ankle[0] - ANKLE[0], ankle[1] - ANKLE[1], ankle[2] - ANKLE[2]) < 1e-6) {
        return { leg: [0, 0, 0] as V3, shin: [0, 0, 0] as V3, foot: orient([], FLAT_FOOT, want) };
      }
      const { upper, lower } = reach({ root: m(HIP), mid: m(KNEE), end: m(ANKLE) }, m(ankle), m([KNEE[0], KNEE[1], 0.3]));
      return { leg: upper, shin: lower, foot: orient([upper, lower], FLAT_FOOT, want) };
    };
    // A world point into the hips' rest frame, for hips that move by `move` and turn by `yaw`
    // degrees about their vertical axis (x = z = 0).
    const intoHips = (w: V3, move: V3, yaw: number): V3 => {
      const c = Math.cos(-yaw * DEG), s = Math.sin(-yaw * DEG);
      const x = w[0] - move[0], z = w[2] - move[2];
      return [x * c + z * s, w[1] - move[1], -x * s + z * c];
    };

    // ---------------------------------------------------------------- hit: snap back from a blow
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.18, 1], [0.35, 0.85], [1, 0]] as const);
        const back = -0.022 * h;
        const lean = (Math.asin(back / 0.13) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, lean), back], rotate: [0, 6 * h, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, 8 * h, 4 * h] },
          head: { rotate: [-16 * h, -8 * h, -6 * h] },
          'leg.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean, 0, 0] },
          'foot.L': { rotate: [-lean, 0, 0] },
          'foot.R': { rotate: [-lean, 0, 0] },
          'upperarm.L': { rotate: [0, 0, -25 * h] },
          'upperarm.R': { rotate: [-24 * h, 0, -30 * h] },
          'forearm.L': { rotate: [0, 0, 0] },
          'forearm.R': { rotate: [-26 * h, 0, 0] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- death: stagger back, then fall face down
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.1, 1], [0.24, 0.3], [0.34, 0]] as const);
        const sag = keys(p, [[0.14, 0], [0.36, 1]] as const);
        // The fall: 0 standing, 1 on the ground; a small bounce at the impact.
        const fall = keys(p, [[0.3, 0], [0.62, 1.03], [0.7, 0.97], [0.78, 1]] as const, 'smooth');
        const f2 = fall * fall;
        return {
          hips: {
            move: [0, -0.016 * sag - 0.042 * fall, -0.02 * hitB + 0.13 * f2],
            rotate: [86 * f2, 8 * sag, 6 * fall],
          },
          spine: { rotate: [-10 * hitB + 8 * sag - 4 * fall, 0, 0] },
          chest: { rotate: [-10 * hitB + 6 * sag - 6 * fall, 0, 0] },
          neck: { rotate: [-12 * fall, 0, 0] },
          head: { rotate: [-16 * hitB + 10 * sag - 12 * fall, 20 * fall, 10 * sag - 4 * fall] },
          'leg.L': { rotate: [-6 * sag - 44 * fall, 0, 10 * fall] },
          'leg.R': { rotate: [4 * sag - 40 * fall, 0, -12 * fall] },
          'foot.L': { rotate: [30 * fall, 0, 0] },
          'foot.R': { rotate: [30 * fall, 0, 0] },
          // The arms flail out in the stagger, then lie out beside his body, well clear of the head.
          // The flask arm swings out wide so the flask lies on the ground beside him, not under him.
          'upperarm.L': { rotate: [10 * hitB + 10 * sag, 0, 30 * sag + 20 * fall] },
          'forearm.L': { rotate: [80 * sag, 0, 0] },
          'upperarm.R': { rotate: [-24 * hitB - 20 * sag * (1 - fall) - 30 * fall, 0, -30 * sag - 8 * fall] },
          'forearm.R': { rotate: [-20 * sag * (1 - fall) - 10 * fall, 0, 0] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- victory: a jump with the flask held high
    // An anticipation crouch on bent knees with the arms pulled down, a push-off that straightens
    // the legs, a jump of about 9 cm with the knees tucked and the toes pointing down, the flask
    // thrust up at the top, and a landing on both feet that the knees absorb with a small bounce.
    // The legs use legTo (above attack2): the soles stay flat on the floor.
    const JUMP = 0.09; // the hips' rise at the top of the jump
    const DROP = 0.045; // the depth of the anticipation crouch
    const [T_OFF, T_TOP, T_LAND] = [0.3, 0.41, 0.52];
    k.animation('victory', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        // The hips' height: the crouch, a push-off that speeds up, a parabola in the air, then the
        // landing dip and a smaller second dip.
        let h: number;
        if (p < 0.24) h = -DROP * ease(0, 0.2, p);
        else if (p < T_OFF) h = -DROP * (1 - ((p - 0.24) / (T_OFF - 0.24)) ** 2);
        else if (p < T_LAND) h = (4 * JUMP * (p - T_OFF) * (T_LAND - p)) / (T_LAND - T_OFF) ** 2;
        else if (p < 0.6) h = -0.034 * Math.sin(((Math.PI / 2) * (p - T_LAND)) / (0.6 - T_LAND));
        else h = -0.034 * keys(p, [[0.6, 1], [0.7, 0.12], [0.77, 0.28], [0.9, 0]] as const);
        const bend = Math.max(0, -h) / DROP; // 1 at the bottom of the crouch
        const air = Math.max(0, h) / JUMP; // 1 at the top of the jump
        const flight = p > T_OFF && p < T_LAND ? Math.sin((Math.PI * (p - T_OFF)) / (T_LAND - T_OFF)) : 0;
        // In the air the knees tuck (the ankles come up under the hips) and the toes point down,
        // but never lower than the floor.
        const tuck = 0.025 * flight;
        const pitch = Math.min(26, (Math.max(0, h) + tuck) / 0.0025);
        // The hips sit back a little over the heels when they drop.
        const back = -0.25 * Math.max(0, -h);
        const ankle: V3 = [ANKLE[0], ANKLE[1] - Math.min(0, h) + tuck, -back];
        const legL = legTo(1, ankle, pitch);
        const legR = legTo(-1, ankle, pitch);
        // The right fist pumps up and out; the flask hand rises overhead and out to the side.
        const pull = keys(p, [[0, 0], [0.2, 1], [0.25, 1], [0.31, 0]] as const);
        const raise = ease(0.26, T_TOP, p);
        const raiseL = ease(0.24, T_TOP, p) * (1 - ease(0.7, 0.95, p));
        const rArm = reachR(lerp(lerp(WRIST_R, [-0.21, 0.222, -0.012], pull), [-0.26, 0.47, 0.06], raise));
        const lArm = reachL(lerp(lerp(WRIST, [0.25, 0.36, 0.03], pull), [0.33, 0.5, 0.09], raiseL));
        return {
          hips: { move: [0, h, back] },
          spine: { rotate: [10 * bend - 4 * air - 6 * raise, 0, 0] },
          chest: { rotate: [6 * bend - 6 * raise, 8 * raise, 0] },
          head: { rotate: [-3 * bend - 12 * raise, 8 * raise, -6 * raise] },
          'leg.L': { rotate: legL.leg },
          'shin.L': { rotate: legL.shin },
          'foot.L': { rotate: legL.foot },
          'leg.R': { rotate: legR.leg },
          'shin.R': { rotate: legR.shin },
          'foot.R': { rotate: legR.foot },
          'upperarm.R': { rotate: rArm.upper },
          'forearm.R': { rotate: rArm.lower },
          'upperarm.L': { rotate: lArm.upper },
          'forearm.L': { rotate: lArm.lower },
        } as P;
      },
    });
  },
});
