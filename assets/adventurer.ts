import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Adventurer — Chibi Quest hero (catalog `heroes/support/adventurer`), about 0.97 m to the top of
 * his hair, faces +Z. Target: docs/hero-mockups/adventurer_001.jpg (made with mmx from a written
 * brief; one front view). Built on the rogue's head and skeleton, so the heroes read as one set.
 *
 * Role: player hero (the starter), seen in 3D and as a 128 px sprite; the pack and the grin read.
 * One idea: a beaming boy under a huge soft travel pack (bedroll on top, lantern at the side), a
 *   short sword in his right hand and a half-open map in his left, ready to go anywhere.
 * Proportions: hair tufts 0.96, bandana 0.76 to 0.84, eyes 0.63, chin 0.48, shoulders 0.385,
 *   belt 0.25, shirt tail 0.2, trouser cuffs 0.1. The pack rises to 0.58 behind the head.
 * Shape language: round and soft (face, pack, bedroll, shoes), with tousled pointed hair locks and
 *   the straight short sword as the sharp accents.
 * Palette (60/30/10): cream shirt #efe2c4 and brown leather #7a4a2c; grey-green trousers #6e7560;
 *   teal bandana and bedroll #4f9c8a as the accent pair, a red neckerchief #c8413a at the focal
 *   point under the face. Skin #f2c7a4, hair #84502c with dark grooves #4a2a16.
 * Value plan: the dark hair and the teal bandana frame the light face (focal point); the red
 *   neckerchief is the strongest color accent; the dark pack is the biggest mass behind him.
 * Bodies: skin, hair, bandana, scarf, shirt, trousers, leather, steel, rope, shoes, pack,
 *   pack-flap, bedroll, lantern-frame, lantern-light, map, sword, hilt (guard, pommel, grip).
 * Rig: the rogue's chibi skeleton plus `knot` (bandana tails) and `lantern`; the sword is rigid
 *   on the right hand, the map on the left hand, the pack on the chest. Clips: idle, walk, run,
 *   attack (a stepping diagonal slash), attack2 (a lunging thrust), hit, death (a face-down fall
 *   under the pack), victory (a hop with the sword raised).
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
  brow: '#5a3422',
  mouth: '#7a2a2a',
  teeth: '#fbf5ee',
  tongue: '#e0706a',
  hair: '#84502c',
  hairLight: '#a0683a',
  hairDark: '#4a2a16',
  teal: '#4f9c8a',
  tealDark: '#3a7a6a',
  red: '#c8413a',
  redDark: '#9a2e2a',
  shirt: '#efe2c4',
  shirtShade: '#d8c8a4',
  trousers: '#6e7560',
  cuff: '#8a917a',
  leather: '#7a4a2c',
  leatherDark: '#503020',
  pack: '#6e4026',
  packDark: '#4e2c1a',
  flap: '#a8743f',
  steel: '#b8bec6',
  steelDark: '#8a9098',
  iron: '#4a4a50',
  brass: '#b8893a',
  glow: '#ffcc55',
  rope: '#cdb07a',
  map: '#efe0b8',
  mapEdge: '#d8c08a',
  mapInk: '#7a5a34',
  mapRed: '#b8342c',
  shoe: '#7a4428',
  sole: '#42281a',
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

// Joints: the rogue's shoulders and legs. The right forearm hangs a little forward with the sword,
// the left hangs relaxed with the map.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW_R: V3 = [-0.18, 0.332, 0.0];
const WRIST_R: V3 = [-0.2, 0.236, 0.025];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];

// The short sword: the grip center sits in the right fist; at rest the blade points forward and
// down. Its frame: the tip direction, the flat's normal (toward his right), and the edge line.
const FIST_R = along(WRIST_R, norm(sub(WRIST_R, ELBOW_R)), 0.04);
const BLADE_DIR = norm([-0.1, -0.42, 0.9]);
const FLAT = perp([-1, 0, 0.1], BLADE_DIR);
const EDGE = cross(FLAT, BLADE_DIR);
const swordPose = (s: sdf.Shape) => frame(s, EDGE, scl(BLADE_DIR, -1), FLAT, FIST_R);

// The map: a scroll held by its top roll in the left fist, the sheet hanging down, tilted up and
// out so it faces the viewer. Its frame: the roll axis, the sheet's down direction, its face.
const FIST_L = along(WRIST, norm(sub(WRIST, ELBOW)), 0.04);
const MAP_ROLL = norm([1, 0.05, -0.28]);
const MAP_FACE = perp([0.25, 0.45, 1], MAP_ROLL);
const MAP_UP = cross(MAP_FACE, MAP_ROLL);
const mapPose = (s: sdf.Shape) => frame(s, MAP_ROLL, MAP_UP, MAP_FACE, FIST_L);

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
  name: 'adventurer',
  description:
    'Chibi adventurer hero with tousled hair under a teal bandana, a huge soft travel pack with a bedroll and lantern, a half-open map, and a short sword.',
  detail: 0.005,
  reference: 'docs/hero-mockups/adventurer_001.jpg',

  build(k) {
    const KNOT: V3 = [0.02, 0.765, -0.2];

    // ------------------------------------------------------------------ the travel pack (built first: the lantern hook sits on it)
    // Local frame: the pack's front face (against his back) at the origin, the pack toward -Z.
    const packPose = (s: sdf.Shape) => s.rotateX(-4).at(0, 0.38, -0.118);
    // A soft, full rucksack: a rounded box with a bulging belly at the back and bottom.
    const sack = sdf.smoothUnion(
      0.06,
      sdf.box([0.31, 0.32, 0.1], 0.05).at(0, 0.0, -0.06),
      sdf.ellipsoid([0.17, 0.17, 0.11]).at(0, -0.035, -0.095),
      sdf.ellipsoid([0.14, 0.1, 0.08]).at(0, 0.1, -0.08),
    );
    const pocket = hard(sdf.ellipsoid([0.04, 0.085, 0.075]).at(0.165, -0.07, -0.085));
    const pack = sdf.smoothUnion(0.02, sack, pocket);
    // The lighter top flap: a shell over the top that hangs down the back with rounded corners.
    const flapRegion = sdf.box([0.34, 0.3, 0.28], 0.06).at(0, 0.12, -0.08);
    const flap = sack.round(0.012).subtract(sack.round(-0.004)).smoothIntersect(0.006, flapRegion);
    const flapStrap = sack
      .round(0.02)
      .subtract(sack.round(-0.004))
      .smoothIntersect(0.004, sdf.box([0.034, 0.34, 0.5], 0.008).at(0, 0.05, -0.1))
      .intersect(sdf.halfSpace([0, 0, 1], -0.03));
    const packHit = (x: number, y: number) => sdf.raycast(sack, [x, y, -1], [0, 0, 1])!;
    const flapBuckleAt = packHit(0, -0.075);
    const flapBuckle = sdf
      .box([0.046, 0.04, 0.014], 0.006)
      .subtract(sdf.box([0.028, 0.022, 0.04], 0.004))
      .at(flapBuckleAt[0], flapBuckleAt[1], flapBuckleAt[2] - 0.016);
    // The bedroll across the top, its left end a little higher, tied with two rope bands.
    const ROLL_Y = 0.2;
    const roll = sdf.capsule([-0.2, ROLL_Y, -0.085], [0.2, ROLL_Y, -0.085], 0.068);
    const rollTies = sdf.union(
      ...[-0.1, 0.1].map((x) => sdf.torus(0.07, 0.008).rotateZ(90).at(x, ROLL_Y, -0.085)),
    );
    const rollPose = (s: sdf.Shape) => s.rotateZ(7);
    // Where the lantern hangs: a ring on the pack's left side.
    const sideAt = sdf.raycast(pack, [1, 0.08, -0.1], [-1, 0, 0])!;
    const hookLocal: V3 = [sideAt[0] + 0.022, sideAt[1], sideAt[2]];
    const cos4 = Math.cos((-4 * Math.PI) / 180);
    const sin4 = Math.sin((-4 * Math.PI) / 180);
    const HOOK: V3 = [hookLocal[0], hookLocal[1] * cos4 - hookLocal[2] * sin4 + 0.38, hookLocal[1] * sin4 + hookLocal[2] * cos4 - 0.118];

    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [0.03, 0.66, -0.23] },
      lantern: { parent: 'chest', at: HOOK, tail: [HOOK[0], HOOK[1] - 0.12, HOOK[2]] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
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
      fistAround(FIST_L, MAP_ROLL, WRIST).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAround(FIST_R, BLADE_DIR, WRIST_R).bone('hand.R'),
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
            [-0.058, 0.004],
            [0.058, 0.004],
            [0.046, -0.02],
            [0.024, -0.037],
            [0, -0.042],
            [-0.024, -0.037],
            [-0.046, -0.02],
          ],
          { smooth: true, samples: 5 },
        ),
        0.3,
      )
      .at(...MOUTH);
    // Teeth and tongue sit inside a dark rim, so the grin reads as a mouth, not a white bar.
    const inner = mouth.round(-0.006);
    const teeth = inner.intersect(sdf.halfSpace([0, -1, 0], -(MOUTH[1] - 0.012)));
    const tongue = inner.intersect(sdf.sphere(0.03).at(0, MOUTH[1] - 0.046, 0.2).elongate(0.014, 0, 0.3));
    const blush = pair(at(sdf.sphere(0.038), 0.142, 0.562));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue, C.tongue, 0.004)
      .paintWhere(teeth, C.teeth);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ bandana: a wide, soft band with a knot and two tails
    const skull = sdf.ellipsoid([HEAD[0], HEAD[1], HEAD[2]]).at(0, HEAD_Y, 0);
    const bandBox = sdf.box([0.6, 0.074, 0.6], 0.012).rotateX(-8).at(0, 0.782, 0);
    const band = skull.round(0.028).subtract(skull.round(0.004)).smoothIntersect(0.01, bandBox);
    const tail = (dx: number, dz: number) =>
      sdf.chain(
        [
          [KNOT[0], KNOT[1], KNOT[2], 0.024],
          [KNOT[0] + dx * 0.45, KNOT[1] - 0.05, KNOT[2] - 0.03 + dz * 0.4, 0.02],
          [KNOT[0] + dx, KNOT[1] - 0.105, KNOT[2] - 0.04 + dz, 0.013],
        ],
        0.01,
      );
    const tails = sdf.union(tail(-0.05, -0.01), tail(0.075, -0.01));
    const knot = sdf.ellipsoid([0.038, 0.03, 0.028]).at(...KNOT);
    const bandana = sdf
      .smoothUnion(0.01, band.bone('head'), knot.bone('head'), tails.bone('knot'))
      // A darker lower rim and one soft fold line around the middle of the band.
      .paintFn((_x, y, z, base) => {
        const v = y - 0.782 - z * 0.139;
        return v < -0.026 || Math.abs(v - 0.008) < 0.0025 ? rgb(C.tealDark) : base;
      });
    k.body('bandana', bandana, { color: C.teal, roughness: 0.85 });

    // ------------------------------------------------------------------ hair: a tousled mop of separate locks
    // A full volume, swept up on top, split into broad locks by grooves that run out from the crown
    // with a swirl; the lock ends flick out past the bandana at the sides and the back, short tufts
    // stand up on top, and a big lock falls over the bandana onto the forehead.
    const DEG = Math.PI / 180;
    const faceMask = sdf.ellipsoid([0.235, 0.16, 0.22]).at(0, 0.61, 0.15);
    const volume = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid([HEAD[0] + 0.018, HEAD[1] + 0.018, HEAD[2] + 0.018]).at(0, HEAD_Y + 0.008, -0.01),
        sdf.ellipsoid([0.19, 0.085, 0.175]).rotateZ(6).at(-0.01, 0.852, -0.012),
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
    // Lock ends that flick out past the volume, at the sides and the back (the front is under the band).
    const flicks = sdf.union(
      ...grooveStarts
        .map((g) => g + 15 + SWIRL)
        .filter((ph) => ((ph % 360) + 360) % 360 > 55 && ((ph % 360) + 360) % 360 < 305)
        .map((ph, i) =>
          sdf.chain(
            [
              [...hs(44, ph - 8, -0.02), 0.032],
              [...hs(58, ph - 2, 0.006), 0.026],
              [...up(hs(64, ph + 4, 0.034 + (i % 2) * 0.01), 0.012), 0.008],
            ],
            0.01,
          ),
        ),
    );
    // Short tufts that stand up on top.
    const tufts = sdf.union(
      ...[
        [70, 0.034],
        [190, 0.03],
        [310, 0.036],
        [250, 0.026],
      ].map(([ph, h]) =>
        sdf.chain(
          [
            [...hs(6, ph!, -0.024), 0.04],
            [...up(hs(18, ph! + 12, 0.008), h! * 0.5), 0.026],
            [...up(hs(28, ph! + 24, 0.03), h!), 0.007],
          ],
          0.012,
        ),
      ),
    );
    // The fringe: points over the band's front (on its outer surface, lifted).
    const bandFront = skull.round(0.03);
    const fr = (x: number, y: number, lift: number): V3 => {
      const h = sdf.raycast(bandFront, [x, y, 1], [0, 0, -1])!;
      return [h[0], h[1], h[2] + lift];
    };
    const fringe = sdf.union(
      sdf.chain(
        [
          [...hs(24, 2, -0.014), 0.04],
          [...hs(38, 6, 0.004), 0.038],
          [...fr(0.03, 0.81, 0.02), 0.03],
          [...fr(0.052, 0.772, 0.014), 0.018],
          [...fr(0.075, 0.748, 0.008), 0.007],
        ],
        0.012,
      ),
      sdf.chain(
        [
          [...hs(26, -28, -0.014), 0.032],
          [...hs(40, -32, 0.004), 0.03],
          [...fr(-0.09, 0.805, 0.016), 0.022],
          [...fr(-0.118, 0.778, 0.008), 0.007],
        ],
        0.012,
      ),
    );
    // Short points at the nape, under the band.
    const nape = sdf.union(
      ...[160, 185, 210].map((ph, i) =>
        sdf.chain(
          [
            [...hs(126, ph + 12, -0.012), 0.028],
            [...hs(142, ph + 14, 0.004), 0.02],
            [...hs(156 - (i % 2) * 6, ph + 18, 0.016), 0.006],
          ],
          0.01,
        ),
      ),
    );
    const sideburns = pair(sdf.cone([0.192, 0.7, 0.04], [0.196, 0.61, 0.064], 0.026, 0.011));
    const hair = volume
      .smoothUnion(0.02, sideburns)
      .smoothSubtract(0.004, band.round(0.001))
      .smoothUnion(0.012, flicks, tufts, nape)
      .smoothSubtract(0.005, grooves)
      .paintWhere(grooves.round(0.003), C.hairDark, 0.006)
      .smoothUnion(0.01, fringe)
      // Lighter on top, where the light falls.
      .paintFn((x, y, z, base) => {
        const top = Math.min(1, Math.max(0, (y - 0.8) / 0.14)) * 0.7;
        const l = rgb(C.hairLight);
        return [base[0] + (l[0] - base[0]) * top, base[1] + (l[1] - base[1]) * top, base[2] + (l[2] - base[2]) * top];
      });
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.0035, bone: 'head' });

    // ------------------------------------------------------------------ shirt, trousers, neckerchief
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
          sdf.cone(lerp(s, e, 0.9), lerp(s, e, 1.12), 0.05, 0.05).round(0.004).paint(C.shirtShade), // rolled cuff
        )
        .bone(tag);
    const shirt = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, ELBOW, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'))
      .paintWhere(sdf.extrude(profile.rect([0.006, 0.2], 0.002), 0.4).at(0.0, 0.33, 0.2), C.shirtShade, 0.002);
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.85 });
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(
        sdf
          .smoothUnion(
            0.01,
            sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.115, 0.004], 0.05),
            sdf.cylinder(0.056, 0.032, 0.012).at(0.096, 0.108, 0.004).paint(C.cuff), // rolled-up cuff
          )
          .bone('leg.L'),
      ),
    );
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });
    const scarfRing = sdf
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
    const scarfTip = torso
      .round(0.012)
      .subtract(torso.round(-0.002))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.09, 0.47],
              [0.09, 0.47],
              [0.014, 0.36],
              [0, 0.345],
              [-0.014, 0.36],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    const scarf = sdf
      .smoothUnion(0.012, scarfRing, scarfTip)
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 11 + y * 50) > 0.8 ? rgb(C.redDark) : base));
    k.body('scarf', scarf.bone('chest'), { color: C.red, roughness: 0.8 });

    // ------------------------------------------------------------------ leather: pack straps, belt, pouch
    const strap = (s: 1 | -1) =>
      torso
        .round(0.01)
        .smoothIntersect(0.005, sdf.box([0.036, 0.5, 0.7], 0.006).rotateZ(s * 8).at(s * 0.072, 0.35, 0))
        .intersect(sdf.halfSpace([0, -1, 0], -0.27));
    const beltY = 0.245;
    const belt = torso.round(0.012).smoothIntersect(0.006, sdf.box([0.5, 0.044, 0.5], 0.006).at(0, beltY, 0));
    const pouchAt = sdf.surfacePoint(belt, [-0.11, beltY - 0.02, 0.2], 0);
    const pouch = sdf
      .union(sdf.box([0.056, 0.064, 0.036], 0.014), sdf.box([0.062, 0.028, 0.042], 0.01).at(0, 0.022, 0.002).paint(C.leatherDark))
      .rotateY(-40)
      .at(pouchAt[0], pouchAt[1] - 0.028, pouchAt[2] + 0.006);
    k.body('leather', sdf.union(strap(1), strap(-1), belt, pouch).bone('spine'), { color: C.leather, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.062, 0.05, 0.014], 0.007).subtract(sdf.box([0.038, 0.028, 0.03], 0.006)), sdf.box([0.008, 0.032, 0.01], 0.003).at(0.004, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    const strapBuckles = hard(sdf.box([0.036, 0.03, 0.01], 0.004).subtract(sdf.box([0.022, 0.015, 0.03])).at(0.078, 0.36, 0.106));
    k.body('steel', sdf.union(buckle.bone('spine'), strapBuckles.bone('spine'), packPose(flapBuckle).bone('chest')), {
      color: C.steel,
      roughness: 0.35,
      metalness: 0.85,
    });

    // A coil of rope hangs from the belt on the left hip.
    const ropeAt = sdf.surfacePoint(belt, [0.1, beltY - 0.03, 0.22], 0.01);
    const coil = sdf.union(
      ...[0, 1, 2].map((i) => sdf.torus(0.038 - i * 0.002, 0.0075).rotateX(80).rotateY(-35).at(ropeAt[0] + 0.012, ropeAt[1] - 0.045 - i * 0.006, ropeAt[2] + i * 0.003)),
    );
    k.body('rope', sdf.union(coil.bone('spine'), packPose(rollPose(rollTies)).bone('chest')), {
      color: C.rope,
      roughness: 0.9,
      detail: 0.004,
      bump: (x, y, z) => 0.001 * Math.sin((x + y + z) * 500),
    });

    // ------------------------------------------------------------------ shoes
    const shoeFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.05, 0.075, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shoe = shoeFoot
      .union(shoeFoot.round(0.003).smoothIntersect(0.004, sdf.box([0.2, 0.018, 0.2], 0.004).at(0, 0.068, 0)).paint(C.leatherDark))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.6 });

    // ------------------------------------------------------------------ pack bodies, bedroll, lantern
    k.body('pack-flap', packPose(sdf.union(flap, flapStrap.paint(C.leatherDark))).bone('chest'), {
      color: C.flap,
      roughness: 0.65,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 140, y * 140, z * 140, 2),
    });
    k.body('pack', packPose(pack).bone('chest'), {
      color: C.pack,
      roughness: 0.65,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 120, y * 120, z * 120, 2),
    });
    const bedroll = roll.paintFn((x, y, z, base) => {
      const r = Math.hypot(y - ROLL_Y, z + 0.085);
      // The rolled blanket's spiral shows on both ends; a darker stripe runs along it.
      if (Math.abs(x) > 0.2) return Math.sin(Math.atan2(z + 0.085, y - ROLL_Y) + r * 190) > 0.75 ? rgb(C.tealDark) : base;
      return Math.abs(Math.sin(Math.atan2(z + 0.085, y - ROLL_Y) * 1.5 + x * 3)) > 0.93 ? rgb(C.tealDark) : base;
    });
    k.body('bedroll', packPose(rollPose(bedroll)).bone('chest'), { color: C.teal, roughness: 0.85 });
    // A brass lantern hangs from a ring on the pack's left side and swings on its own bone.
    const LANTERN: V3 = [HOOK[0], HOOK[1] - 0.085, HOOK[2]];
    const lanternFrame = sdf
      .union(
        sdf.cylinder(0.03, 0.012, 0.004).at(0, 0.028, 0),
        sdf.cone([0, 0.032, 0], [0, 0.048, 0], 0.024, 0.01),
        sdf.cylinder(0.032, 0.012, 0.004).at(0, -0.034, 0),
        ...[0, 90, 180, 270].map((a) => sdf.capsule([0.026, -0.028, 0], [0.026, 0.024, 0], 0.004).rotateY(a + 45)),
        sdf.torus(0.02, 0.004).rotateX(90).at(0, 0.068, 0),
      )
      .at(...LANTERN);
    k.body('lantern-frame', lanternFrame.bone('lantern'), { color: C.brass, roughness: 0.35, metalness: 0.8 });
    k.body('lantern-light', sdf.cylinder(0.024, 0.056, 0.01).at(...LANTERN).bone('lantern'), {
      color: C.glow,
      roughness: 0.3,
      emissive: C.glow,
      emissiveIntensity: 0.8,
    });

    // ------------------------------------------------------------------ the map in the left hand
    // Local frame: the top roll along X through the fist, the sheet hanging down (-Y), its face +Z.
    const MAP_W = 0.1;
    const MAP_H = 0.105;
    const MAP_X = 0.022; // the sheet hangs a little outward of the fist
    const sheet = sdf.box([MAP_W, MAP_H, 0.005], 0.0022).at(MAP_X, -MAP_H / 2 - 0.004, 0.006);
    const topRoll = sdf.capsule([MAP_X - MAP_W / 2 - 0.004, 0, 0], [MAP_X + MAP_W / 2 + 0.004, 0, 0], 0.013);
    const lowRoll = sdf.capsule([MAP_X - MAP_W / 2, -MAP_H - 0.004, 0.014], [MAP_X + MAP_W / 2, -MAP_H - 0.004, 0.014], 0.011);
    // The ink on the sheet's face, painted: a coast line, a dotted trail, and a red X. The stencils
    // are pushed through the sheet along its normal.
    const ink = (s: sdf.Shape) => s.at(MAP_X, -MAP_H / 2 - 0.004, 0.006);
    const coast = sdf.extrude(profile.arc(0.05, 0.006, 200, 300), 0.03).at(0.012, 0.03, 0);
    const trail = sdf.union(
      ...Array.from({ length: 6 }, (_, i) => {
        const t = i / 5;
        return sdf.cylinder(0.005, 0.03).rotateX(90).at(-0.032 + t * 0.052, 0.028 - t * 0.05 + 0.012 * Math.sin(t * 5), 0);
      }),
    );
    const cross2 = sdf
      .union(sdf.box([0.028, 0.0075, 0.03], 0.001).rotateZ(45), sdf.box([0.028, 0.0075, 0.03], 0.001).rotateZ(-45))
      .at(0.026, -0.03, 0);
    const mapShape = sdf
      .union(sheet, topRoll, lowRoll.paint(C.mapEdge))
      .paintWhere(ink(sdf.union(coast, trail)), C.mapInk, 0.001)
      .paintWhere(ink(cross2), C.mapRed, 0.001);
    k.body('map', mapPose(mapShape), {
      bone: 'hand.L',
      color: C.map,
      roughness: 0.85,
      detail: 0.003,
      textureDensity: 2,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 200, y * 200, z * 200, 2),
    });

    // ------------------------------------------------------------------ the short sword in the right fist
    // Local frame: the grip center at the origin, the pommel up (+Y), the blade down (-Y), the
    // blade's width along X and its flat facing +Z.
    const bladeLocal = sdf
      .extrude(
        profile.polygon([
          [-0.025, -0.048],
          [0.025, -0.048],
          [0.023, -0.226],
          [0.0, -0.272],
          [-0.023, -0.226],
        ]),
        0.013,
        0.0035,
      )
      .paintWhere(sdf.box([0.008, 0.15, 0.1], 0.003).at(0, -0.12, 0), C.steelDark, 0.003);
    k.body('sword', swordPose(bladeLocal), { color: C.steel, roughness: 0.3, metalness: 0.9, detail: 0.003, bone: 'hand.R' });
    const guard = sdf.union(
      sdf.box([0.1, 0.018, 0.03], 0.008).at(0, -0.042, 0),
      hard(sdf.sphere(0.013).at(0.052, -0.038, 0)),
    );
    const pommel = sdf.sphere(0.021).at(0, 0.082, 0);
    // The leather-wrapped grip shows only between the fist and the pommel, so it is painted into
    // the hilt body.
    const grip = sdf
      .cylinder(0.0125, 0.108, 0.004)
      .at(0, 0.019, 0)
      .paint(C.leather)
      .paintFn((x, y, z, base) => (Math.sin(y * 330 + Math.atan2(z, x)) > 0.5 ? rgb(C.leatherDark) : base));
    k.body('hilt', swordPose(sdf.union(guard, pommel, grip)), { color: C.iron, roughness: 0.45, metalness: 0.7, detail: 0.0035, bone: 'hand.R' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, edgeUp } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const BLADE = { dir: BLADE_DIR, up: FLAT };
    const MAP = { dir: MAP_ROLL, up: MAP_FACE };
    type P = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        knot: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        lantern: { rotate: [3 * wave(p, 1, 0.35), 0, 4 * wave(p, 1, 0.2)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        // The sword tip bobs a little, as if he is eager to use it.
        'hand.R': { rotate: [-4 * bump(p, 1, 0.2), 0, 0] },
      }),
    });

    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        return {
          hips: {
            move: [0, -legDrop(LEG, legSwing * s) + hop * bump(p, 2, 0.25), 0] as const,
            rotate: [0, 7 * s, 0] as const,
          },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The bandana tails stream back and the lantern swings, both a little after the steps.
          knot: { rotate: [lean * 1.5 + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          lantern: { rotate: [lean * 1.5 + 10 * wave(p, 2, 0.2), 0, 8 * wave(p, 1, 0.3)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          // The sword arm swings less and holds the blade up a little, clear of the ground.
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -8] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.3 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 28, 3, 0));
    k.animation('run', stride(0.56, 40, 50, 12, 0.03));

    // ---------------------------------------------------------------- attack: a stepping diagonal slash
    // The wrist and the blade follow keys in the chest's rest frame. Wind-up: the blade rises up
    // and back over his right shoulder while the chest turns away and the map hand reaches toward
    // the foe (hold). Strike: the hips and chest turn in, the right foot steps forward, and the
    // blade cuts down and across the space in front of him to his low left, edge first.
    const slashBlade = [
      [0, BLADE_DIR],
      [0.14, norm([-0.6, 0.25, 0.75])], // out to the right and rising
      [0.28, norm([-0.6, 0.7, -0.38])], // up, out, and back over the right shoulder
      [0.38, norm([-0.55, 0.72, -0.42])], // the hold at the top, clear of the head
      [0.45, norm([-0.05, 0.85, 0.5])], // over the shoulder toward the front
      [0.5, norm([0.4, 0.3, 0.87])], // forward and a little up, across the front
      [0.56, norm([0.75, -0.35, 0.55])], // down to the left
      [0.64, norm([0.62, -0.58, 0.53])], // follow-through, low left and still forward
      [1, BLADE_DIR],
    ] as const;
    const slashAt = (p: number) => keys(p, slashBlade, 'spline');
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.23, 0.34, 0.07]],
            [0.28, [-0.25, 0.475, -0.03]],
            [0.38, [-0.245, 0.485, -0.04]],
            [0.45, [-0.18, 0.47, 0.1]],
            [0.5, [-0.12, 0.41, 0.16]],
            [0.56, [-0.09, 0.33, 0.16]],
            [0.64, [-0.12, 0.335, 0.165]],
            [0.82, [-0.2, 0.29, 0.12]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = norm(slashAt(p));
        const arm = reach(ARM_R, wrist, [-0.5, 0.25, -0.35]);
        const hand = orient([arm.upper, arm.lower], BLADE, { dir, up: edgeUp(slashAt, p, FLAT) });
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.42, 0.54, p) * (1 - ease(0.66, 1, p));
        // The off hand reaches toward the foe in the wind-up and swings back through the cut.
        const handL = keys(p, [
          [0, WRIST],
          [0.3, [0.17, 0.33, 0.13]],
          [0.42, [0.17, 0.33, 0.13]],
          [0.55, [0.23, 0.28, -0.07]],
          [0.7, [0.23, 0.28, -0.06]],
          [1, WRIST],
        ] as const);
        const armL = reach(ARM_L, handL, [0.5, 0.3, -0.3]);
        // The right foot steps forward in the cut; the left foot stays planted.
        const step = ease(0.4, 0.52, p) * (1 - ease(0.7, 0.98, p));
        const hipsZ = -0.012 * wind + 0.03 * cut;
        const plant = (Math.asin(Math.max(-0.9, Math.min(0.9, hipsZ / 0.13))) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, Math.max(Math.abs(plant), 20 * step)) - 0.008 * wind, hipsZ], rotate: [0, -10 * wind + 10 * cut, 0] },
          spine: { rotate: [-3 * wind + 5 * cut, -6 * wind + 4 * cut, 0] },
          chest: { rotate: [-4 * wind + 3 * cut, -22 * wind + 18 * cut, 0] },
          head: { rotate: [-3 * wind + 3 * cut, 30 * wind - 26 * cut, 0] },
          knot: { rotate: [10 * cut - 6 * wind, 0, 14 * wind - 10 * cut] },
          lantern: { rotate: [8 * cut, 0, -10 * wind + 12 * cut] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: [0, 0, -15 * wind] },
          'leg.L': { rotate: [plant, 12 * wind - 14 * cut, 0] },
          'leg.R': { rotate: [plant - 26 * step, 12 * wind - 14 * cut, 0] },
          'foot.L': { rotate: [-plant * 0.5, 0, 0] },
          'foot.R': { rotate: [20 * step - 20 * bump(Math.min(1, Math.max(0, (p - 0.4) / 0.14)) * 0.5), 0, 0] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- attack2: a lunging thrust
    // Draw the sword back to the right hip with the point forward (hold, coiled), then drive the
    // point straight ahead along one line as the right foot lunges forward and the chest turns in.
    // The flat stays level, the point leads. Then pull back and recover.
    // The point must fly straight at the foe in the world, so undo the lunge's chest turn (32 deg
    // about Y) and lean (16 deg about X) to get the direction in the chest's rest frame.
    const toChest = (v: V3, yaw: number, pitch: number): V3 => {
      const cy = Math.cos(-yaw * DEG), sy = Math.sin(-yaw * DEG);
      const a: V3 = [v[0] * cy + v[2] * sy, v[1], -v[0] * sy + v[2] * cy];
      const cp = Math.cos(-pitch * DEG), sp = Math.sin(-pitch * DEG);
      return [a[0], a[1] * cp - a[2] * sp, a[1] * sp + a[2] * cp];
    };
    const THRUST_DIR = norm(toChest([0.05, 0.02, 1], 32, 16));
    const LEVEL = perp([0, 1, 0], THRUST_DIR);
    k.animation('attack2', {
      duration: 0.75,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(p, [
          [0, WRIST_R],
          [0.3, [-0.22, 0.29, -0.07]],
          [0.4, [-0.22, 0.295, -0.075]],
          [0.5, [-0.11, 0.33, 0.155]],
          [0.62, [-0.11, 0.33, 0.16]],
          [1, WRIST_R],
        ] as const, 'smooth');
        const dir = norm(
          keys(p, [
            [0, BLADE_DIR],
            [0.3, THRUST_DIR],
            [0.62, THRUST_DIR],
            [1, BLADE_DIR],
          ] as const),
        );
        const up = norm(keys(p, [[0, FLAT], [0.3, LEVEL], [0.62, LEVEL], [1, FLAT]] as const));
        const arm = reach(ARM_R, wrist, [-0.6, -0.1, -0.3]);
        const hand = orient([arm.upper, arm.lower], BLADE, { dir, up });
        const coil = ease(0.02, 0.32, p) * (1 - ease(0.4, 0.5, p));
        const lunge = ease(0.4, 0.5, p) * (1 - ease(0.64, 1, p));
        const handL = keys(p, [
          [0, WRIST],
          [0.3, [0.17, 0.33, 0.12]],
          [0.42, [0.17, 0.33, 0.12]],
          [0.52, [0.25, 0.3, -0.04]],
          [0.64, [0.25, 0.3, -0.04]],
          [1, WRIST],
        ] as const);
        const armL = reach(ARM_L, handL, [0.5, 0.3, -0.3]);
        const hipsZ = -0.015 * coil + 0.05 * lunge;
        const back = (Math.asin(Math.max(-0.9, Math.min(0.9, hipsZ / 0.13))) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, Math.max(Math.abs(back), 30 * lunge)) - 0.012 * coil, hipsZ], rotate: [0, -14 * coil + 10 * lunge, 0] },
          spine: { rotate: [2 * coil + 12 * lunge, -6 * coil + 6 * lunge, 0] },
          chest: { rotate: [-2 * coil + 4 * lunge, -18 * coil + 16 * lunge, 0] },
          head: { rotate: [-2 * coil - 10 * lunge, 28 * coil - 20 * lunge, 0] },
          knot: { rotate: [14 * lunge, 0, 8 * coil] },
          lantern: { rotate: [16 * lunge, 0, -6 * coil] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: [back + 10 * lunge, 10 * coil, 0] },
          'leg.R': { rotate: [back - 36 * lunge, 10 * coil, 0] },
          'foot.L': { rotate: [-back * 0.5 - 8 * lunge, 0, 0] },
          'foot.R': { rotate: [28 * lunge, 0, 0] },
        } as P;
      },
    });

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
          knot: { rotate: [-12 * h, 0, 10 * h] },
          lantern: { rotate: [-14 * h, 0, 8 * h] },
          'leg.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean, 0, 0] },
          'foot.L': { rotate: [-lean, 0, 0] },
          'foot.R': { rotate: [-lean, 0, 0] },
          'upperarm.L': { rotate: [-20 * h, 0, 28 * h] },
          'upperarm.R': { rotate: [-24 * h, 0, -30 * h] },
          'forearm.L': { rotate: [-20 * h, 0, 0] },
          'forearm.R': { rotate: [-26 * h, 0, 0] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- death: stagger back, then fall face down under the pack
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.1, 1], [0.24, 0.3], [0.34, 0]] as const);
        const sag = keys(p, [[0.14, 0], [0.36, 1]] as const);
        // The fall: 0 standing, 1 on the ground; a small bounce at the impact.
        const fall = keys(p, [[0.3, 0], [0.62, 1.03], [0.7, 0.97], [0.78, 1]] as const, 'smooth');
        const f2 = fall * fall;
        // On the ground the chest frame is turned about 86 deg forward: the blade then points
        // along his body toward the feet (chest -Y) with its flat facing the sky (chest -Z).
        const upperR: V3 = [-24 * hitB - 20 * sag * (1 - fall) - 30 * fall, 0, -30 * sag - 8 * fall];
        const lowerR: V3 = [-20 * sag * (1 - fall) - 10 * fall, 0, 0];
        const handR = orient([upperR, lowerR], BLADE, {
          dir: norm(lerp(lerp(BLADE_DIR, [0, -0.2, 1], 0.6 * sag), [-0.25, -1, 0.1], fall)),
          up: norm(lerp(FLAT, [0, 0.1, -1], fall)),
        });
        return {
          hips: {
            move: [0, -0.016 * sag - 0.042 * fall, -0.02 * hitB + 0.13 * f2],
            rotate: [86 * f2, 8 * sag, 6 * fall],
          },
          spine: { rotate: [-10 * hitB + 8 * sag - 4 * fall, 0, 0] },
          chest: { rotate: [-10 * hitB + 6 * sag - 6 * fall, 0, 0] },
          neck: { rotate: [-12 * fall, 0, 0] },
          head: { rotate: [-16 * hitB + 10 * sag - 12 * fall, 20 * fall, 10 * sag - 4 * fall] },
          knot: { rotate: [-20 * hitB + 30 * fall, 0, 20 * fall] },
          lantern: { rotate: [-10 * hitB - 60 * fall, 0, 20 * fall] },
          // The legs straighten back along the ground, the feet turned out.
          'leg.L': { rotate: [-6 * sag - 44 * fall, 0, 10 * fall] },
          'leg.R': { rotate: [4 * sag - 40 * fall, 0, -12 * fall] },
          'foot.L': { rotate: [30 * fall, 0, 0] },
          'foot.R': { rotate: [30 * fall, 0, 0] },
          // The arms flail out in the stagger, then lie out beside his body, well clear of the
          // head; the sword stays in the hand and lies flat beside his hip.
          'upperarm.L': { rotate: [-24 * hitB - 20 * sag * (1 - fall) - 30 * fall, 0, 30 * sag + 8 * fall] },
          'upperarm.R': { rotate: upperR },
          'forearm.L': { rotate: [-20 * sag * (1 - fall) - 10 * fall, 0, 0] },
          'forearm.R': { rotate: lowerR },
          'hand.R': { rotate: handR },
        } as P;
      },
    });

    // ---------------------------------------------------------------- victory: a hop with the sword thrust up
    k.animation('victory', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const crouch = keys(p, [[0, 0], [0.18, 1], [0.26, 0], [0.42, 0], [0.5, 0.7], [0.6, 0]] as const);
        const air = keys(p, [[0.22, 0], [0.33, 1], [0.45, 0]] as const);
        const raise = ease(0.2, 0.34, p);
        // The fist rises out to his right side (never in front of the face), the blade up and out.
        const wrist = lerp(WRIST_R, [-0.285, 0.47, 0.07], raise);
        const dir = norm(lerp(BLADE_DIR, [-0.45, 0.87, 0.18], raise));
        const arm = reach(ARM_R, wrist, [-0.6, 0.1, -0.3]);
        // The flat faces out to his right, so the guard runs front to back, not toward his cheek.
        const hand = orient([arm.upper, arm.lower], BLADE, { dir, up: norm(lerp(FLAT, [-1, 0.4, 0], raise)) });
        // The left fist (with the map) pumps down to his hip in triumph.
        const fist = lerp(WRIST, [0.19, 0.33, 0.075], ease(0.3, 0.45, p));
        const armL = reach(ARM_L, fist, [0.3, 0.1, -0.25]);
        const bob = 0.006 * bump(Math.min(1, Math.max(0, (p - 0.6) / 0.4)), 2);
        return {
          hips: { move: [0, -0.03 * crouch + 0.09 * air - bob, 0] },
          spine: { rotate: [8 * crouch - 6 * raise, 0, 0] },
          chest: { rotate: [6 * crouch - 6 * raise, 8 * raise, 0] },
          head: { rotate: [4 * crouch - 12 * raise, 8 * raise, -6 * raise] },
          knot: { rotate: [-20 * air + 6 * wave(p, 3), 0, 8 * wave(p, 2, 0.1)] },
          lantern: { rotate: [-18 * air + 8 * wave(p, 2), 0, 6 * wave(p, 2, 0.3)] },
          'leg.L': { rotate: [18 * crouch - 26 * air, 0, 0] },
          'leg.R': { rotate: [18 * crouch - 10 * air, 0, 0] },
          'foot.L': { rotate: [-18 * crouch + 30 * air, 0, 0] },
          'foot.R': { rotate: [-18 * crouch + 20 * air, 0, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
        } as P;
      },
    });
  },
});
