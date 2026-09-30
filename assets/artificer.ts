import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Artificer — Chibi hero (catalog `heroes/magic/artificer`), about 1.0 m to the top of the cap,
 * faces +Z. Target: docs/hero-mockups/artificer_001.jpg (one front view; the beard is left out so the
 * face stays young, round, and beardless like every hero of the set). Built on the adventurer's
 * head, face, torso, and chibi skeleton with knee bones.
 *
 * Role: player hero for a tinkering game, seen in 3D and as a 128 px sprite; the brass gauntlet and
 *   the clockwork drone are the focal props, the goggled leather cap is the silhouette.
 * One idea: a focused young tinkerer in a leather flat cap with brass goggles, one huge brass
 *   gauntlet on the left arm and a brass clockwork drone held up in the right hand.
 * Proportions: cap top 1.0, goggles 0.87, brow of the cap 0.73, eyes 0.63, chin 0.48, shoulders
 *   0.385, belt 0.245, boot cuffs 0.12. The drone (body r 0.045) rides at chest height.
 * Shape language: round and soft (face, cap, boots, drone) with stubby hard brass plates as accents.
 * Palette (60/30/10): leather browns #8a5a35 / #5f3d22 (cap, vest), dark green trousers #3a4a30 and
 *   a green and cream striped shirt; brass #c9a24a (goggles, gauntlet, buckles, drone) is the accent
 *   and the drone lens #40c0e0 the one glow. Skin #f2c7a4, hair #3a2418.
 * Value plan: the dark hair fringe and heavy brows frame the light face; the bright brass at the cap,
 *   the left arm, and the drone holds the strongest contrast against the mid browns and greens.
 * Bodies: skin, hair, cap, goggle brass and glass, shirt, vest, vest buckles, trousers, belt,
 *   pouches, belt brass, wrench, gauntlet, boots, boot brass, drone brass and lens.
 * Rig: the adventurer's chibi skeleton without the bandana, pack, and lantern bones, plus `drone` on
 *   the right hand. Clips: idle, walk, run, attack (a gauntlet punch), attack2 (the drone flies out
 *   0.4 m and back), hit, death, victory (a jump with the drone held high).
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
  brow: '#2c1a10',
  mouth: '#7a2a2a',
  hair: '#3a2418',
  cap: '#8a5a35',
  seam: '#5f3d22',
  brass: '#c9a24a',
  brassDark: '#8a6a20',
  glass: '#6a7078',
  cream: '#ece0c4',
  stripe: '#5a7a3a',
  trousers: '#3a4a30',
  belt: '#4e2d1c',
  pouch: '#6b4226',
  wrench: '#8a9098',
  boot: '#4a2e1c',
  bootDark: '#3a2214',
  sole: '#2a1a10',
  lens: '#104050',
  lensGlow: '#40c0e0',
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

const DEG = Math.PI / 180;

// Joints: the adventurer's shoulders and legs. The left arm hangs with the big gauntlet; the right
// arm is bent up and forward, the fist under the drone.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW_R: V3 = [-0.245, 0.325, 0.05];
const WRIST_R: V3 = [-0.29, 0.372, 0.15];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)

// The left fist closes around a horizontal grip along X (a punching fist); the right fist closes
// around the drone's stem.
const GRIP_L = norm([1, 0.05, 0.1]);
const FIST_L = along(WRIST, norm(sub(WRIST, ELBOW)), 0.04);
const FIST_R = along(WRIST_R, norm(sub(WRIST_R, ELBOW_R)), 0.03);
const DRONE: V3 = add(FIST_R, [0, 0.092, 0.01]);

/** A fist closed around a grip through `g` along the unit axis `a`, entered from the wrist `w`. */
const fistAround = (g: V3, a: V3, w: V3, sz = 1) => {
  const toW = perp(sub(w, g), a);
  const side = cross(a, toW);
  const o = (u: number, v: number, s: number): V3 => add(add(add(g, scl(a, u)), scl(toW, v)), scl(side, s));
  return sdf.smoothUnion(
    0.012,
    sdf.capsule(o(0.012, 0.006, 0), o(-0.01, 0.006, 0), 0.034 * sz), // the palm around the grip
    sdf.capsule(o(0.016, -0.018, 0.004), o(-0.016, -0.018, 0.004), 0.02 * sz), // the finger roll
    sdf.cone(o(0.004, 0.012, 0.026), o(0.02, -0.004, 0.024), 0.015 * sz, 0.012 * sz), // the thumb over the grip
  );
};

/** A gear facing +Z at the origin: a ring of radius `R` and thickness `r` with `n` teeth. */
const gear = (R: number, r: number, n: number) =>
  sdf.union(
    sdf.torus(R, r).rotateX(90),
    sdf.cylinder(R * 0.35, r * 1.6, r * 0.4).rotateX(90),
    ...Array.from({ length: n }, (_, i) =>
      sdf.box([r * 2.6, r * 2.2, r * 2], r * 0.4).at(R + r * 0.5, 0, 0).rotateZ((i * 360) / n),
    ),
  );
/** Places a shape built along +Y (its axis) with its origin at `p`, so the axis follows `dir`. */
const axisFrame = (s: sdf.Shape, p: V3, dir: V3) => {
  const ey = norm(dir);
  const ex = norm(cross(ey, [0, 0, 1]));
  return frame(s, ex, ey, cross(ex, ey), p);
};

export default defineAsset({
  name: 'artificer',
  description:
    'Chibi artificer hero in a brown leather flat cap with brass goggles, a striped shirt under a leather vest, a tool belt with a wrench, a big brass gauntlet on the left arm, and a brass clockwork drone held up in the right hand.',
  detail: 0.006,
  reference: 'docs/hero-mockups/artificer_001.jpg',
  variants: {
    eyes: { brown: C.iris, green: '#3d7a35', blue: '#2f6aa8' },
    hair: { brown: C.hair, black: '#231a17', auburn: '#8e3b1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { green: C.stripe, blue: '#3f5f8a', rust: '#a0522d' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', clothing: 'green' },
    blue: { eyes: 'blue', hair: 'black', skin: 'fair', clothing: 'blue' },
    rust: { eyes: 'green', hair: 'auburn', skin: 'tan', clothing: 'rust' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      stripe: k.tint('clothing'),
      trousers: k.tint('clothing', { color: C.trousers, follow: 1 }),
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
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      drone: { parent: 'hand.R', at: DRONE, tail: [DRONE[0], DRONE[1] + 0.06, DRONE[2]] },
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
      fistAround(FIST_L, GRIP_L, WRIST, 1.18).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAround(FIST_R, norm([0, 1, 0.05]), WRIST_R, 1.18).bone('hand.R'),
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
    // Heavy, level brows with the inner ends low (a focused look), under the cap's peak.
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.026, 60, 118), 0.3).rotateZ(9).at(0.105, 0.605, 0.1));
    // A small, closed, slightly pressed mouth.
    const mouth = sdf.extrude(profile.arc(0.05, 0.011, 240, 300), 0.3).at(0, 0.598, 0.1);
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
      .paintWhere(mouth, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ the leather flat cap, goggles on top
    const skull = sdf.ellipsoid([HEAD[0], HEAD[1], HEAD[2]]).at(0, HEAD_Y, 0);
    // The cap's lower edge: 0.73 at the brow, lower at the sides and the back (tilted 8 degrees).
    const capPlane = sdf.box([0.8, 0.5, 0.8]).rotateX(-8).at(0, 0.718 + 0.25, 0);
    // A puffier cap: the skull grown 8 percent in X and Z, with a taller crown.
    const capSkull = skull.scale([1.08, 1, 1.08]);
    const crown = sdf.ellipsoid([0.22, 0.09, 0.21]).at(0, 0.878, -0.006);
    const dome = capSkull.round(0.012).smoothUnion(0.04, crown).smoothIntersect(0.008, capPlane);
    // The leather band around the base, 0.03 tall, proud of the dome.
    const rimBand = capSkull
      .round(0.02)
      .subtract(capSkull.round(0.008))
      .smoothIntersect(0.006, sdf.box([0.8, 0.03, 0.8], 0.01).rotateX(-8).at(0, 0.734, 0));
    // The peak: wide, flat, 0.09 m forward, 0.02 thick, dark leather, tilted down 10 degrees.
    const peak = sdf.box([0.2, 0.02, 0.09], 0.009).rotateX(10).at(0, 0.748, 0.262);
    const seamCut = (deg: number) => sdf.box([0.009, 0.5, 0.7]).rotateY(deg).at(0, 0.7, 0);
    const cap = dome
      .smoothUnion(0.006, rimBand)
      .paintWhere(rimBand.round(0.002), C.seam, 0.004)
      .paintWhere(seamCut(0).intersect(sdf.halfSpace([0, -1, 0], -0.8)), C.seam, 0.003);
    k.body('cap', cap.bone('head'), {
      color: C.cap,
      roughness: 0.85,
      detail: 0.005,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 150, y * 150, z * 150, 2),
    });
    k.body('cap-peak', peak.paint(C.seam).bone('head'), { color: C.seam, roughness: 0.8, detail: 0.004 });
    // Four walnut seam ridges, 0.006 proud, from the crown down to the brim band.
    const ridgeShell = dome.round(0.006).subtract(dome.round(-0.002));
    const ridges = ridgeShell
      .intersect(sdf.union(seamCut(45), seamCut(-45)))
      .intersect(sdf.halfSpace([0, -1, 0], -0.76));
    k.body('cap-ridges', ridges.bone('head'), { color: '#6b4226', roughness: 0.8, detail: 0.004 });

    // Goggles on the crown's front, tilted back so the lenses face forward and up.
    const GOG_X = 0.07;
    const GOG_Y = 0.895;
    const gogZ = sdf.raycast(dome, [GOG_X, GOG_Y, 1], [0, 0, -1])![2] + 0.016;
    const gogPose = (s: sdf.Shape) => s.rotateX(52).rotateY(8).at(GOG_X, GOG_Y, gogZ);
    const ringBrass = sdf.union(sdf.torus(0.05, 0.013), sdf.torus(0.054, 0.008).at(0, -0.012, 0));
    const glass = sdf.smoothUnion(0.006, sdf.cylinder(0.048, 0.02, 0.004).at(0, -0.002, 0), sdf.ellipsoid([0.047, 0.02, 0.047]).at(0, 0.004, 0));
    const bridge = sdf.capsule([-0.02, GOG_Y + 0.005, gogZ], [0.02, GOG_Y + 0.005, gogZ], 0.011);
    k.body('goggle-brass', sdf.union(hard(gogPose(ringBrass)), bridge).bone('head'), { color: C.brass, roughness: 0.4, metalness: 0.8, detail: 0.004 });
    k.body('goggle-glass', hard(gogPose(glass)).bone('head'), { color: C.glass, roughness: 0.2, metalness: 0.2, detail: 0.004 });
    // The goggle strap: a dark leather band around the cap, with a brass buckle on each side.
    const strapBox = sdf.box([0.8, 0.022, 0.8], 0.006).rotateX(-8).at(0, 0.802, 0);
    const strap = dome.round(0.004).subtract(dome.round(-0.004)).smoothIntersect(0.004, strapBox);
    k.body('goggle-strap', strap.paint(C.seam).bone('head'), { color: C.seam, roughness: 0.8, detail: 0.004 });
    const sideZ = 0.0;
    const buckleAt = sdf.raycast(dome, [1, 0.802 + sideZ, 0], [-1, 0, 0])![0];
    const studAt = sdf.raycast(dome, [1, 0.725, 0], [-1, 0, 0])![0];
    k.body(
      'cap-buckle',
      sdf
        .union(
          hard(sdf.box([0.014, 0.034, 0.034], 0.005).subtract(sdf.box([0.03, 0.018, 0.02])).at(buckleAt + 0.002, 0.802, 0)),
          // Two brass studs on the brim band, at the sides.
          hard(sdf.sphere(0.011).at(studAt + 0.012, 0.725, 0.0)),
        )
        .bone('head'),
      { color: C.brass, roughness: 0.4, metalness: 0.8, detail: 0.003 },
    );

    // ------------------------------------------------------------------ hair: short, under the cap
    const faceMask = sdf.ellipsoid([0.235, 0.16, 0.22]).at(0, 0.61, 0.15);
    const volume = skull
      .round(0.007)
      .smoothSubtract(0.015, faceMask)
      .smoothIntersect(0.012, sdf.box([0.8, 0.5, 0.8], 0.02).at(0, 0.585 + 0.25, 0));
    const HC: V3 = [0, 0.7, -0.01];
    const hs = (th: number, ph: number, lift = 0): V3 => {
      const d: V3 = [Math.sin(th * DEG) * Math.sin(ph * DEG), Math.cos(th * DEG), Math.sin(th * DEG) * Math.cos(ph * DEG)];
      const hit = sdf.raycast(volume, along(HC, d, 0.6), scl(d, -1))!;
      return along(hit, d, lift);
    };
    const nape = sdf.union(
      ...[140, 165, 190, 215].map((ph, i) =>
        sdf.chain(
          [
            [...hs(92, ph + 10, -0.012), 0.03],
            [...hs(106, ph + 12, 0.004), 0.022],
            [...hs(120 - (i % 2) * 4, ph + 14, 0.014), 0.007],
          ],
          0.01,
        ),
      ),
    );
    const skullFront = skull.round(0.007);
    const zAt = (x: number, y: number) => sdf.raycast(skullFront, [x, y, 1], [0, 0, -1])![2];
    const fringe = sdf.union(
      ...[-0.135, -0.09, -0.045, 0.0, 0.045, 0.09, 0.135].map((x, i) =>
        sdf.chain(
          [
            [x * 0.92, 0.775, zAt(x * 0.92, 0.775) - 0.024, 0.027],
            [x, 0.748, zAt(x, 0.748) + 0.002, 0.0125],
            [x + (i % 2 ? 0.007 : -0.007), 0.716, zAt(x, 0.716) + 0.01, 0.0075],
          ],
          0.012,
        ),
      ),
    );
    const sideburns = pair(sdf.cone([0.192, 0.7, 0.04], [0.196, 0.61, 0.064], 0.026, 0.011));
    const hair = volume.smoothUnion(0.02, sideburns).smoothUnion(0.012, nape, fringe).subtract(capPlane);
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.0035, bone: 'head' });

    // ------------------------------------------------------------------ striped shirt, vest, trousers
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
    // Sleeves: cream, with a rolled green cuff.
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(
          0.012,
          sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 1.02), 0.048, 0.045).paint(C.cream),
          sdf.cone(lerp(s, e, 0.9), lerp(s, e, 1.12), 0.05, 0.05).round(0.004).paint(T.stripe),
        )
        .bone(tag);
    // Horizontal cream stripes on the green shirt; the chest reads as green and cream bands.
    const shirtTorso = torso.paintFn((_x, y, _z, base) => (y > 0.235 && Math.floor((y - 0.19) / 0.026) % 2 === 1 ? rgb(C.cream) : base));
    const shirt = sdf.union(shirtTorso.bone('spine'), sleeve(SHOULDER, ELBOW, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'));
    k.body('shirt', shirt, { color: T.stripe, roughness: 0.85 });
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.115, 0.004], 0.05).bone('leg.L')),
    );
    k.body('trousers', trousers, { color: T.trousers, roughness: 0.85 });

    // The leather vest: a shell over the torso, open at the front, with armholes and a stitched edge.
    const VEST_TOP = 0.44;
    const VEST_HEM = 0.232;
    const vestShell = torso.round(0.011).subtract(torso.round(-0.003));
    const vestBox = sdf.box([0.5, VEST_TOP - VEST_HEM, 0.5], 0.008).at(0, (VEST_TOP + VEST_HEM) / 2, 0);
    const vestOpening = sdf
      .extrude(
        profile.polygon([
          [-0.058, 0.48],
          [0.058, 0.48],
          [0.034, VEST_HEM - 0.01],
          [-0.034, VEST_HEM - 0.01],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const armhole = pair(sdf.capsule([0.1, 0.385, 0], [0.24, 0.385, 0], 0.064));
    const vestEdge = (y: number) => 0.034 + ((y - (VEST_HEM - 0.01)) / (0.48 - (VEST_HEM - 0.01))) * 0.024;
    const vest = vestShell
      .smoothIntersect(0.005, vestBox)
      .subtract(vestOpening)
      .subtract(armhole)
      .paintFn((x, y, z, base) => {
        const d = Math.abs(x) - vestEdge(y);
        const stitch = z > 0.03 && d > 0.004 && d < 0.011 && Math.sin(y * 330) > 0.15;
        const hem = y < VEST_HEM + 0.012 && y > VEST_HEM + 0.006 && Math.sin(x * 330) > 0.15;
        const ah = armhole.dist(x, y, z);
        const arm = ah > 0.004 && ah < 0.011 && Math.sin((y + Math.abs(z)) * 330) > 0.15;
        const collar = y < VEST_TOP - 0.005 && y > VEST_TOP - 0.012 && Math.sin((x + z) * 330) > 0.15;
        return stitch || hem || arm || collar ? rgb(C.seam) : base;
      });
    k.body('vest', vest.bone('spine'), { color: C.cap, roughness: 0.85, detail: 0.004, bump: (x, y, z) => 0.0005 * noise.fbm(x * 160, y * 160, z * 160, 2) });
    const vestFront = torso.round(0.011);
    const vestZ = (x: number, y: number) => sdf.raycast(vestFront, [x, y, 1], [0, 0, -1])![2];
    const vestBuckle = hard(
      sdf
        .box([0.032, 0.03, 0.012], 0.004)
        .subtract(sdf.box([0.018, 0.016, 0.03]))
        .rotateY(-12)
        .at(0.06, 0.365, vestZ(0.06, 0.365) + 0.004),
    );
    // The gear pendant at the collar.
    const PEND_Y = 0.428;
    const pendant = gear(0.02, 0.006, 8).at(0, PEND_Y, vestZ(0, PEND_Y) + 0.012);
    k.body('vest-brass', sdf.union(vestBuckle.bone('spine'), pendant.bone('chest')), { color: C.brass, roughness: 0.4, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ the tool belt
    const beltY = 0.245;
    const belt = torso.round(0.017).smoothIntersect(0.006, sdf.box([0.5, 0.052, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.belt, roughness: 0.6, detail: 0.004 });
    const yawOf = (p: V3) => (Math.atan2(p[0], p[2]) * 180) / Math.PI;
    const pouchOn = (want: V3) => {
      const p = sdf.surfacePoint(belt, want, 0);
      return sdf
        .union(sdf.box([0.058, 0.07, 0.038], 0.014), sdf.box([0.064, 0.03, 0.044], 0.01).at(0, 0.024, 0.002).paint(C.belt))
        .rotateY(yawOf(p))
        .at(p[0], p[1] - 0.034, p[2] + 0.004);
    };
    k.body('pouches', sdf.union(pouchOn([-0.13, beltY - 0.02, 0.1]), pouchOn([0.14, beltY - 0.02, -0.05])).bone('spine'), {
      color: C.pouch,
      roughness: 0.75,
      detail: 0.004,
    });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    k.body('belt-brass', gear(0.02, 0.0065, 8).at(0, beltY, beltZ + 0.006).bone('spine'), { color: C.brass, roughness: 0.4, metalness: 0.8, detail: 0.003 });
    // The wrench hangs at the left hip: a flat outline with an open jaw at the bottom.
    const wrenchLocal = sdf.union(
      sdf.extrude(profile.rect([0.02, 0.062], 0.007), 0.014).at(0, -0.036, 0),
      sdf.extrude(profile.arc(0.018, 0.014, -60, 240), 0.014).at(0, -0.078, 0),
      sdf.extrude(profile.circle(0.014), 0.014).at(0, -0.002, 0),
    );
    const wrenchAt = sdf.surfacePoint(belt, [0.1, beltY - 0.005, 0.2], 0.004);
    k.body('wrench', wrenchLocal.rotateX(10).rotateY(yawOf(wrenchAt)).at(wrenchAt[0], wrenchAt[1] - 0.004, wrenchAt[2]).bone('spine'), {
      color: C.wrench,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ boots with buckled cuffs
    const shoeFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.05, 0.075, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shaft = sdf.cylinder(0.058, 0.094, 0.018).at(0, 0.083, 0).bone('shin.L');
    const bootCuff = sdf.cylinder(0.066, 0.03, 0.012).at(0, 0.118, 0).paint(C.pouch).bone('shin.L');
    const boot = sdf
      .smoothUnion(0.018, shoeFoot.bone('foot.L'), shaft)
      .union(bootCuff)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(10)
      .at(ANKLE[0], 0, 0);
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });
    const bootBuckle = hard(
      sdf.box([0.016, 0.026, 0.038], 0.005).subtract(sdf.box([0.03, 0.014, 0.022])).at(ANKLE[0] + 0.066, 0.118, 0.012).bone('shin.L'),
    );
    k.body('boot-brass', bootBuckle, { color: C.brass, roughness: 0.4, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ the brass gauntlet on the left arm
    const fore = norm(sub(WRIST, ELBOW));
    // A core tube, three stacked plates (0.05 tall, 0.012 proud) from the wrist to the elbow, and
    // dark seam rings between them.
    const core = sdf.cone(lerp(ELBOW, WRIST, -0.06), lerp(ELBOW, WRIST, 1.04), 0.049, 0.05).round(0.004);
    const plateAt = (t: number, R: number) => axisFrame(sdf.cylinder(R, 0.05, 0.012), lerp(ELBOW, WRIST, t), fore);
    const plates = sdf.union(plateAt(0.17, 0.059), plateAt(0.5, 0.058), plateAt(0.85, 0.06));
    const gauntletTubes = sdf.union(core, plates).bone('forearm.L');
    const seamRings = sdf.union(
      ...[0.34, 0.67].map((t) => axisFrame(sdf.torus(0.058, 0.004), lerp(ELBOW, WRIST, t), fore).paint(C.brassDark)),
    );
    // Six rivet domes in two rows, on the front and outer side of the top and bottom plates.
    const rivets = sdf.union(
      ...[0.17, 0.85].flatMap((t) =>
        [70, 110, 150].map((deg) =>
          axisFrame(sdf.sphere(0.008).at(0.066 * Math.cos(deg * DEG), 0, 0.066 * Math.sin(deg * DEG)), lerp(ELBOW, WRIST, t), fore).paint(C.brassDark),
        ),
      ),
    );
    // The elbow cap: a half sphere (r 0.055) facing back and out, with a brass rim.
    const capDir = norm([0.55, 0.15, -0.8]);
    const capC = add(ELBOW, scl(capDir, 0.004));
    const elbowDome = sdf
      .sphere(0.055)
      .at(...capC)
      .intersect(sdf.halfSpace(scl(capDir, -1), -dot(capDir, capC)))
      .paint(C.brass);
    const elbowRim = axisFrame(sdf.torus(0.054, 0.0075), capC, capDir).paint(C.brassDark);
    const elbowCap = sdf.union(elbowDome, elbowRim).bone('forearm.L');
    const handShell = fistAround(FIST_L, GRIP_L, WRIST, 1.18)
      .round(0.006)
      .paintFn((x, y, _z, base) => (Math.abs(Math.sin(x * 150)) > 0.93 || y > FIST_L[1] + 0.04 ? rgb(C.brassDark) : base))
      .bone('hand.L');
    // Two knuckle ridges around the fist.
    const knuckles = sdf
      .union(
        ...[-0.012, 0.012].map((u) => axisFrame(sdf.torus(0.043, 0.0065), add(FIST_L, [u, 0.004, 0.004]), GRIP_L)),
      )
      .paint(C.brassDark)
      .bone('hand.L');
    const handGear = gear(0.017, 0.006, 8).paint(C.brassDark).at(FIST_L[0] + 0.004, FIST_L[1] + 0.004, FIST_L[2] + 0.046).bone('hand.L');
    const gauntlet = sdf
      .smoothUnion(0.006, gauntletTubes, handShell)
      .union(seamRings.bone('forearm.L'), rivets.bone('forearm.L'), elbowCap, knuckles, handGear);
    k.body('gauntlet', gauntlet, { color: C.brass, roughness: 0.4, metalness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ the clockwork drone in the right hand
    // Local frame: the body center at the origin, the lens toward +Z, the stem down (-Y).
    const droneBody = sdf
      .sphere(0.045)
      .paintFn((_x, y, _z, base) => (Math.abs(y) < 0.005 || Math.abs(y - 0.03) < 0.003 ? rgb(C.brassDark) : base));
    const wingStub = hard(sdf.box([0.07, 0.02, 0.05], 0.008).at(0.07, 0.004, 0));
    const wingRing = hard(sdf.torus(0.014, 0.005).at(0.098, 0.012, 0));
    const mast = sdf.capsule([0, 0.03, 0], [0, 0.066, 0], 0.009);
    const propRing = sdf.torus(0.056, 0.005).at(0, 0.068, 0);
    const blades = sdf.union(sdf.box([0.112, 0.004, 0.014], 0.002).at(0, 0.068, 0).rotateY(25), sdf.box([0.112, 0.004, 0.014], 0.002).at(0, 0.068, 0).rotateY(115));
    const stem = sdf.union(sdf.cylinder(0.011, 0.05, 0.003).at(0, -0.062, 0), sdf.sphere(0.016).at(0, -0.09, 0));
    const droneBrass = sdf.union(droneBody, wingStub, wingRing, mast, propRing, blades, stem).scale(1.4);
    k.body('drone-brass', droneBrass.at(...DRONE), { color: C.brass, roughness: 0.4, metalness: 0.8, detail: 0.004, bone: 'drone' });
    k.body('drone-lens', sdf.sphere(0.028).at(0, 0.006, 0.05).at(...DRONE), {
      color: C.lens,
      roughness: 0.2,
      emissive: C.lensGlow,
      emissiveIntensity: 1.2,
      detail: 0.003,
      bone: 'drone',
    });

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

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, 0] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        'forearm.R': { rotate: [2 * wave(p, 1, 0.3), 0, 0] },
        // The drone hovers a little above the fist and wobbles.
        drone: { rotate: [4 * wave(p, 2, 0.3), 0, 5 * wave(p, 2, 0.1)], move: [0, 0.004 * wave(p, 2, 0.25), 0] },
      }),
    });

    // The legs come from motion.gait: planted stance feet, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `lift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `hop` the hips bob.
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, { // left heel strike at 0.25, with the left arm back
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
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          // The drone arm stays raised and only sways a little.
          'upperarm.R': { rotate: [-armSwing * 0.1 * s, 0, 0] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [armSwing * 0.08 * s, 0, 0] as const },
          drone: { rotate: [3 + 4 * wave(p, 2, 0.2), 0, 5 * wave(p, 2, 0.1)] as const, move: [0, 0.005 * wave(p, 2, 0.3), 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 50, 12, 0.03));

    // ---------------------------------------------------------------- attack: a gauntlet punch
    // Wind-up: the left fist pulls back to the hip and the chest turns away. Strike: the chest turns
    // in, the right foot steps forward, and the gauntlet drives straight ahead at chest height.
    k.animation('attack', {
      duration: 0.75,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.36, 0.44, p));
        const cut = ease(0.4, 0.5, p) * (1 - ease(0.62, 0.95, p));
        const fist = keys(
          p,
          [
            [0, WRIST],
            [0.28, [0.21, 0.29, -0.07]],
            [0.36, [0.21, 0.29, -0.07]],
            [0.48, [0.12, 0.395, 0.165]],
            [0.6, [0.12, 0.395, 0.165]],
            [0.85, [0.19, 0.3, 0.06]],
            [1, WRIST],
          ] as const,
          'smooth',
        );
        const armL = reach(ARM_L, fist, [0.6, 0.2, -0.4]);
        const step = ease(0.4, 0.52, p) * (1 - ease(0.7, 0.98, p));
        const hipsZ = -0.01 * wind + 0.03 * cut;
        const plant = (Math.asin(Math.max(-0.9, Math.min(0.9, hipsZ / 0.13))) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, Math.max(Math.abs(plant), 20 * step)) - 0.006 * wind, hipsZ], rotate: [0, 8 * wind - 8 * cut, 0] },
          spine: { rotate: [-2 * wind + 6 * cut, 4 * wind - 4 * cut, 0] },
          chest: { rotate: [-3 * wind + 4 * cut, 8 * wind - 20 * cut, 0] },
          head: { rotate: [-3 * wind + 3 * cut, -12 * wind + 20 * cut, 0] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          // The drone hand stays up and steady; the drone hovers.
          'upperarm.R': { rotate: [3 * wind - 4 * cut, 0, 0] },
          drone: { rotate: [6 * cut, 0, 5 * wind] },
          'leg.L': { rotate: [plant, -8 * wind + 8 * cut, 0] },
          'leg.R': { rotate: [plant - 26 * step, -8 * wind + 8 * cut, 0] },
          'foot.L': { rotate: [-plant * 0.5, 0, 0] },
          'foot.R': { rotate: [20 * step - 20 * bump(Math.min(1, Math.max(0, (p - 0.4) / 0.14)) * 0.5), 0, 0] },
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

    // ---------------------------------------------------------------- attack2: the drone flies out and back
    // He winds the arm back, tosses forward, and the drone flies 0.4 m straight ahead (world +Z),
    // hovers, and returns to the fist. The bone `move` acts in the frame of the hand, so the world
    // offset is turned back through the arm chain (spine, chest, upper arm, forearm, hand).
    type M3 = readonly (readonly [number, number, number])[];
    const mul3 = (a: M3, b: M3): M3 => a.map((_, i) => [0, 1, 2].map((j) => a[i]![0]! * b[0]![j]! + a[i]![1]! * b[1]![j]! + a[i]![2]! * b[2]![j]!) as unknown as [number, number, number]);
    const eulerM = (r: V3): M3 => {
      const [a, b, c] = [r[0] * DEG, r[1] * DEG, r[2] * DEG];
      const [ca, sa, cb, sb, cc, sc] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b), Math.cos(c), Math.sin(c)];
      const rx: M3 = [[1, 0, 0], [0, ca, -sa], [0, sa, ca]];
      const ry: M3 = [[cb, 0, sb], [0, 1, 0], [-sb, 0, cb]];
      const rz: M3 = [[cc, -sc, 0], [sc, cc, 0], [0, 0, 1]];
      return mul3(mul3(rx, ry), rz);
    };
    const intoChain = (chain: readonly V3[], w: V3): V3 => {
      let m: M3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      for (const r of chain) m = mul3(m, eulerM(r));
      // local = transpose(total) * world
      return [0, 1, 2].map((j) => m[0]![j]! * w[0] + m[1]![j]! * w[1] + m[2]![j]! * w[2]) as unknown as V3;
    };
    k.animation('attack2', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => {
        const coil = ease(0.02, 0.24, p) * (1 - ease(0.28, 0.34, p));
        const toss = ease(0.28, 0.36, p) * (1 - ease(0.5, 0.78, p));
        const fly = keys(p, [[0, 0], [0.34, 0], [0.52, 1], [0.66, 1], [0.9, 0], [1, 0]] as const, 'smooth');
        const spine: V3 = [1.5 * coil - 3 * toss, 0, 0];
        const chest: V3 = [-3 * coil + 6 * toss, 0, 0];
        const upper: V3 = [6 * coil - 20 * toss, 0, 0];
        const lower: V3 = [-6 * coil + 32 * toss, 0, 0];
        const world: V3 = [0, 0.045 * Math.sin(Math.PI * fly) * 0.8, 0.4 * fly];
        const local = intoChain([spine, chest, upper, lower], world);
        const handL = keys(p, [[0, WRIST], [0.3, [0.2, 0.3, 0.09]], [0.5, [0.2, 0.3, 0.09]], [1, WRIST]] as const);
        const armL = reach(ARM_L, handL, [0.5, 0.3, -0.3]);
        return {
          spine: { rotate: spine },
          chest: { rotate: chest },
          head: { rotate: [-2 * toss, 0, 0] },
          'upperarm.R': { rotate: upper },
          'forearm.R': { rotate: lower },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          drone: { move: local, rotate: [0, 900 * fly, 0] },
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
          'leg.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean, 0, 0] },
          'foot.L': { rotate: [-lean, 0, 0] },
          'foot.R': { rotate: [-lean, 0, 0] },
          'upperarm.L': { rotate: [-20 * h, 0, 28 * h] },
          'upperarm.R': { rotate: [-4 * h, 0, 30 * h] },
          'forearm.L': { rotate: [-20 * h, 0, 0] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
          drone: { rotate: [-10 * h, 0, 10 * h] },
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
          // The legs straighten back along the ground, the feet turned out.
          'leg.L': { rotate: [-6 * sag - 44 * fall, 0, 10 * fall] },
          'leg.R': { rotate: [4 * sag - 40 * fall, 0, -12 * fall] },
          'foot.L': { rotate: [30 * fall, 0, 0] },
          'foot.R': { rotate: [30 * fall, 0, 0] },
          // The gauntlet arm flails, then lies beside his body. The drone arm swings out to his
          // right and folds back so the drone lies clear of the ground.
          'upperarm.L': { rotate: [-24 * hitB - 20 * sag * (1 - fall) - 30 * fall, 0, 30 * sag + 8 * fall] },
          'forearm.L': { rotate: [-20 * sag * (1 - fall) - 10 * fall, 0, 0] },
          'upperarm.R': { rotate: [-6 * hitB - 20 * sag * (1 - fall) - 20 * fall, 0, 60 * sag] },
          'forearm.R': { rotate: [-20 * sag * (1 - fall) - 100 * fall, 0, 0] },
          drone: { rotate: [-30 * hitB - 40 * fall, 0, 30 * fall] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- victory: a jump with the drone held high
    // An anticipation crouch on bent knees with the arms pulled down, a push-off that straightens
    // the legs, a jump of about 9 cm with the knees tucked and the toes pointing down, both fists up
    // at the top, and a landing on both feet that the knees absorb with a small bounce.
    const JUMP = 0.09; // the hips' rise at the top of the jump
    const DROP = 0.045; // the depth of the anticipation crouch
    const [T_OFF, T_TOP, T_LAND] = [0.3, 0.41, 0.52];
    const FIST_BACK: V3 = [0.215, 0.222, -0.035];
    const FIST_LIST: readonly (readonly [number, V3])[] = [[0, WRIST], [0.2, FIST_BACK], [0.25, FIST_BACK], [0.34, [0.21, 0.37, 0.1]], [0.46, [0.19, 0.33, 0.075]]];
    k.animation('victory', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        let h: number;
        if (p < 0.24) h = -DROP * ease(0, 0.2, p);
        else if (p < T_OFF) h = -DROP * (1 - ((p - 0.24) / (T_OFF - 0.24)) ** 2);
        else if (p < T_LAND) h = (4 * JUMP * (p - T_OFF) * (T_LAND - p)) / (T_LAND - T_OFF) ** 2;
        else if (p < 0.6) h = -0.034 * Math.sin(((Math.PI / 2) * (p - T_LAND)) / (0.6 - T_LAND));
        else h = -0.034 * keys(p, [[0.6, 1], [0.7, 0.12], [0.77, 0.28], [0.9, 0]] as const);
        const bend = Math.max(0, -h) / DROP; // 1 at the bottom of the crouch
        const air = Math.max(0, h) / JUMP; // 1 at the top of the jump
        const flight = p > T_OFF && p < T_LAND ? Math.sin((Math.PI * (p - T_OFF)) / (T_LAND - T_OFF)) : 0;
        const tuck = 0.025 * flight;
        const pitch = Math.min(26, (Math.max(0, h) + tuck) / 0.0025);
        const back = -0.25 * Math.max(0, -h);
        const ankle: V3 = [ANKLE[0], ANKLE[1] - Math.min(0, h) + tuck, -back];
        const legL = legTo(1, ankle, pitch);
        const legR = legTo(-1, ankle, pitch);
        // The drone fist pulls down in the crouch and rises out to his right at the top, well
        // clear of the head.
        const pull = keys(p, [[0, 0], [0.2, 1], [0.25, 1], [0.31, 0]] as const);
        const raise = ease(0.26, T_TOP, p);
        const wrist = lerp(lerp(WRIST_R, [-0.29, 0.32, 0.1], pull), [-0.32, 0.44, 0.13], raise);
        const arm = reach(ARM_R, wrist, [-0.6, 0.1, -0.3]);
        const armL = reach(ARM_L, keys(p, FIST_LIST), [0.3, 0.1, -0.25]);
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
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          drone: { rotate: [-10 * raise, 360 * ease(0.3, 0.6, p), 8 * raise] },
        } as P;
      },
    });
  },
});
