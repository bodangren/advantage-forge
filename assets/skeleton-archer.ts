import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Skeleton archer — Chibi Quest dungeon enemy, about 0.95 m to the top of its hood, faces +Z.
 * Target: docs/enemy-mockups/skeleton-archer_001.jpg (made with mmx, with the skeleton warrior
 * as the character reference; one front view). Built on the skeleton warrior's skull, eyes, and
 * rig, so the undead read as one family.
 *
 * Role: a ranged dungeon enemy, seen in 3D and as a 128 px sprite; the skull in the hood, the
 *   open ribcage, and the bow read.
 * One idea: a grinning skull with glowing eyes deep in a ragged green hood, over a bare ribcage
 *   crossed by a quiver strap, with a dark recurve bow in its bony hand.
 * Proportions: the knight's (head center 0.675, shoulders 0.385, hips 0.2); the ribcage from 0.29
 *   to 0.45, the loincloth hem at 0.13, the boot tops at 0.1.
 * Shape language: round and chunky (skull, hood, boots) with thin, knobby bones and ragged,
 *   pointed cloth edges for menace.
 * Palette (60/30/10): cream bone #efe2c4 and olive hood green #4f5a40; a near-black cloak
 *   #2c2b2e and leather browns (#6e4228, loincloth #6b4a33); red wraps and fletching #9a3024,
 *   brass #c8a050, and the glowing amber eyes #ffb03a as the accents.
 * Value plan: the light skull in the dark hood is the focal point; the light ribs over the dark
 *   chest cavity are the second; the dark cloak frames the light bones.
 * Bodies: bone, hand-bones, cavity, eyes, pupils, hood, mantle, cloak, leather, wraps, bracer,
 *   loincloth, brass, boots, quiver, arrows, bow, bowstring.
 * Rig: the skeleton warrior's; the bow is rigid on `hand.L`, the quiver on `chest`. Clips: idle,
 *   walk, run, attack (raise the bow, draw, loose).
 */

const C = {
  bone: '#efe2c4',
  boneShade: '#c9b58e',
  socket: '#1a1614',
  eye: '#ffb03a',
  pupil: '#1a1010',
  cavity: '#1f1a1a',
  hood: '#48523c',
  hoodDark: '#373f2e',
  hoodInside: '#1e2218',
  cloak: '#2c2b2e',
  cloakInside: '#1c1b1e',
  leather: '#6e4228',
  leatherDark: '#4a2c1c',
  wrap: '#9a3024',
  wrapDark: '#6e2018',
  cloth: '#6b4a33',
  clothDark: '#4c3222',
  brass: '#c8a050',
  boot: '#4a3024',
  bootFur: '#7a5a3c',
  lace: '#2a1c14',
  sole: '#241a16',
  quiver: '#5e3820',
  quiverDark: '#3e2414',
  shaft: '#c8a878',
  fletchRed: '#b02a24',
  fletchBlack: '#2a262c',
  bow: '#3a2a24',
  bowGrip: '#a0342a',
  string: '#e8dcc0',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** Turns local +Y toward `d` (rotateZ, then rotateX) and moves the origin to `p`. */
const alignY = (s: sdf.Shape, d: V3, p: V3) => {
  const n = norm(d);
  return s
    .rotateZ((Math.asin(-n[0]) * 180) / Math.PI)
    .rotateX((Math.atan2(n[2], n[1]) * 180) / Math.PI)
    .at(...p);
};

// Joints. The right arm hangs open; the left forearm points forward and holds the bow upright.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.172, 0.295, -0.005];
const WRIST_R: V3 = [-0.192, 0.212, 0.03];
const ELBOW_L: V3 = [0.185, 0.305, 0.0];
const WRIST_L: V3 = [0.228, 0.29, 0.09];
const HIP: V3 = [0.068, 0.195, 0];
const KNEE: V3 = [0.09, 0.13, 0.01];
const ANKLE: V3 = [0.098, 0.07, 0];
const GRIP: V3 = [WRIST_L[0] + 0.012, WRIST_L[1] - 0.038, WRIST_L[2] + 0.014];

/** A bony hand wrapped around a vertical bow grip at `g`: a small palm and four curled finger bones. */
const boneGrip = (g: V3) =>
  sdf.smoothUnion(
    0.006,
    sdf.ellipsoid([0.03, 0.04, 0.03]).at(g[0] + 0.012, g[1], g[2] - 0.004),
    ...[0, 1, 2, 3].map((i) => {
      const y = g[1] + 0.024 - i * 0.017;
      return sdf.chain(
        [
          [g[0] + 0.022, y, g[2] + 0.01, 0.0095],
          [g[0] + 0.004, y - 0.002, g[2] + 0.026, 0.0088],
          [g[0] - 0.018, y - 0.004, g[2] + 0.014, 0.008],
        ],
        0.004,
      );
    }),
    sdf.chain(
      [
        [g[0] + 0.03, g[1] + 0.02, g[2] + 0.004, 0.01],
        [g[0] + 0.01, g[1] + 0.034, g[2] + 0.018, 0.0085],
      ],
      0.004,
    ),
  );

/**
 * A relaxed bony hand in a local frame: the wrist at the origin, the fingers down (-Y), the palm
 * toward +X (`s` = -1 mirrors it to -X), the thumb toward +Z. The finger bones are knobby at the joints and curl a little.
 */
const boneHangLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.006,
    sdf.ellipsoid([0.015, 0.016, 0.022]).at(0, -0.01, 0), // wrist bones
    sdf.ellipsoid([0.013, 0.028, 0.029]).at(0.002 * s, -0.036, 0.002), // palm
    ...[-0.021, -0.007, 0.007, 0.021].map((dz, i) => {
      const l = 1 - Math.abs(i - 1.4) * 0.07; // the middle finger is the longest
      return sdf.chain(
        [
          [0.001 * s, -0.058, dz, 0.0088],
          [0.004 * s, -0.058 - 0.018 * l, dz * 1.1, 0.0074],
          [0.008 * s, -0.058 - 0.032 * l, dz * 1.15, 0.0082],
          [0.016 * s, -0.058 - 0.046 * l, dz * 1.2, 0.0068],
        ],
        0.003,
      );
    }),
    sdf.chain(
      [
        [0.006 * s, -0.018, 0.022, 0.0095],
        [0.013 * s, -0.036, 0.036, 0.0082],
        [0.02 * s, -0.054, 0.04, 0.0072],
      ],
      0.003,
    ),
  );

/** A rib: a knobby bone chain around the chest at the height `y` (at the sternum), each side. */
const rib = (y: number, rx: number, rz: number, from: number) => {
  const pts = [from, 35, 60, 90, 120, 150, 172].map((deg): [number, number, number, number] => {
    const a = (deg * Math.PI) / 180;
    // The rib drops from the sternum to the side, then rises a little toward the spine.
    const drop = 0.034 * Math.sin(Math.min(a, Math.PI / 2)) - 0.012 * Math.max(0, Math.sin(a - Math.PI / 2));
    return [rx * Math.sin(a), y - drop, 0.004 + rz * Math.cos(a), deg === from ? 0.0098 : 0.0108];
  });
  return pair(sdf.chain(pts, 0.004));
};

export default defineAsset({
  name: 'skeleton-archer',
  description: 'Chibi skeleton archer dungeon enemy: a grinning skull with glowing eyes in a ragged green hood, a bare ribcage, a dark cloak, a quiver, and a recurve bow.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/skeleton-archer_001.jpg',

  build(k) {
    // ------------------------------------------------------------------ skeleton (rig)
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ skull (the skeleton warrior's)
    const cranium = sdf.ellipsoid([0.205, 0.2, 0.19]).at(0, HEAD_Y, -0.005);
    const skullSolid = sdf.smoothUnion(
      0.04,
      cranium,
      pair(sdf.sphere(0.08).at(0.112, 0.59, 0.08)), // cheekbones
      sdf.box([0.15, 0.085, 0.13], 0.035).at(0, 0.53, 0.075), // the teeth block, narrower than the cheeks
    );
    const faceZ = (x: number, y: number) => sdf.raycast(skullSolid, [x, y, 1], [0, 0, -1])![2];
    const EYE: V3 = [0.094, 0.628, 0];
    // Each socket's top edge is a straight slant that dips toward the nose: an angry glare.
    const slant = norm([-0.42, 1, 0]);
    const socketTop = sdf.halfSpace(slant, slant[0] * (EYE[0] - 0.05) + slant[1] * (EYE[1] + 0.012));
    const socketL = sdf
      .ellipsoid([0.06, 0.054, 0.07])
      .at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) + 0.004)
      .smoothIntersect(0.008, socketTop);
    const sockets = pair(socketL);
    const noseZ = faceZ(0, 0.568);
    const noseHole = pair(sdf.ellipsoid([0.013, 0.022, 0.03]).rotateZ(-24).at(0.011, 0.566, noseZ + 0.01));
    const browRidge = pair(
      sdf.capsule(
        [EYE[0] + 0.05, EYE[1] + 0.052, faceZ(EYE[0] + 0.05, EYE[1] + 0.052) - 0.012],
        [EYE[0] - 0.045, EYE[1] + 0.02, faceZ(EYE[0] - 0.045, EYE[1] + 0.02) - 0.01],
        0.016,
      ),
    );
    const skull = skullSolid.smoothUnion(0.02, browRidge).smoothSubtract(0.01, sockets).smoothSubtract(0.004, noseHole);
    const TEETH_Y = 0.535;
    const mouthLine = sdf.extrude(profile.rect([0.15, 0.009], 0.004), 0.4).at(0, TEETH_Y, 0.2);
    const gap = (x: number, y: number) => sdf.extrude(profile.rect([0.007, 0.03], 0.002), 0.4).at(x, y, 0.2);
    const gaps = sdf.union(
      ...[-0.054, -0.018, 0.018, 0.054].map((x) => gap(x, TEETH_Y + 0.018)),
      ...[-0.036, 0, 0.036].map((x) => gap(x, TEETH_Y - 0.017)),
    );
    const neckBones = sdf.union(
      ...[0.44, 0.47, 0.5].map((y) => sdf.cylinder(0.036, 0.022, 0.008).at(0, y, -0.015)),
      sdf.cylinder(0.026, 0.1, 0.006).at(0, 0.47, -0.015),
    );

    // ------------------------------------------------------------------ ribcage, sternum, and lumbar spine
    // Five ribs each side; the lowest is a short floating rib, so the cage ends in a V.
    const ribs = sdf.union(
      rib(0.448, 0.086, 0.07, 14),
      rib(0.414, 0.1, 0.078, 14),
      rib(0.38, 0.106, 0.08, 14),
      rib(0.346, 0.104, 0.078, 18),
      rib(0.312, 0.094, 0.07, 34),
    );
    const sternum = sdf
      .smoothUnion(
        0.01,
        sdf.box([0.032, 0.09, 0.016], 0.007),
        sdf.ellipsoid([0.011, 0.018, 0.008]).at(0, -0.05, 0.002), // the pointed lower tip
      )
      .rotateX(10)
      .at(0, 0.402, 0.078);
    const vertebra = (y: number) =>
      sdf.smoothUnion(
        0.006,
        sdf.cylinder(0.028, 0.017, 0.007).at(0, y, 0.004),
        pair(sdf.capsule([0.02, y, -0.01], [0.044, y - 0.004, -0.02], 0.008)), // side processes
      );
    const lumbar = sdf.union(vertebra(0.262), vertebra(0.286), vertebra(0.31));
    const chestBones = sdf.smoothUnion(0.006, ribs, sternum);

    // ------------------------------------------------------------------ arm and leg bones
    // Knobby ends make each long bone read as bone, even at sprite size.
    const longBone = (a: V3, b: V3, r: number, knobA: number, knobB: number) =>
      sdf.smoothUnion(0.012, sdf.capsule(a, b, r), sdf.sphere(knobA).at(...a), sdf.sphere(knobB).at(...b));
    // The forearm has two bones side by side (radius and ulna).
    const forearm = (e: V3, w: V3) => {
      const d = norm(sub(w, e));
      const side = norm([d[1], -d[0], 0]); // across the arm, in the view plane
      const o = (p: V3, s: number): V3 => [p[0] + side[0] * s, p[1] + side[1] * s, p[2] + side[2] * s];
      return sdf.smoothUnion(
        0.008,
        sdf.capsule(o(e, 0.009), o(w, 0.011), 0.0105),
        sdf.capsule(o(e, -0.009), o(w, -0.01), 0.0105),
        sdf.ellipsoid([0.02, 0.018, 0.02]).at(...e),
        sdf.ellipsoid([0.021, 0.014, 0.019]).at(...w),
      );
    };
    const armBones = sdf.union(
      longBone(SHOULDER, ELBOW_L, 0.0155, 0.027, 0.02).bone('upperarm.L'),
      forearm(ELBOW_L, WRIST_L).bone('forearm.L'),
      longBone(mx(SHOULDER), ELBOW_R, 0.0155, 0.027, 0.02).bone('upperarm.R'),
      forearm(ELBOW_R, WRIST_R).bone('forearm.R'),
    );
    const legL = sdf.smoothUnion(
      0.01,
      longBone([HIP[0], 0.2, 0], KNEE, 0.018, 0.028, 0.02),
      sdf.ellipsoid([0.03, 0.02, 0.026]).at(KNEE[0], KNEE[1] - 0.004, KNEE[2]), // knee end
      sdf.sphere(0.013).at(KNEE[0], KNEE[1], KNEE[2] + 0.024), // kneecap
      sdf.capsule(KNEE, ANKLE, 0.016),
    );
    const legBones = pair(legL.bone('leg.L'));

    const bone = sdf
      .union(
        skull.bone('head'),
        neckBones.bone('neck'),
        chestBones.bone('chest'),
        lumbar.bone('spine'),
        armBones,
        legBones,
      )
      .paintWhere(sockets.round(0.012), C.boneShade, 0.012)
      .paintWhere(sockets.round(0.002), C.socket, 0.004)
      .paintWhere(noseHole.round(0.003), C.socket, 0.003)
      .paintWhere(mouthLine, C.socket, 0.002)
      .paintWhere(gaps.intersect(sdf.box([0.15, 0.07, 0.4]).at(0, TEETH_Y, 0.2)), C.socket, 0.002)
      .paintFn((x, y, z, base) => {
        // Faint age stains.
        const n = noise.fbm(x * 22, y * 22, z * 22, 2);
        return n > 0.35 ? [base[0] * 0.93, base[1] * 0.9, base[2] * 0.84] : base;
      });
    k.body('bone', bone, { color: C.bone, roughness: 0.6, textureDensity: 2 });

    const handR = alignY(boneHangLocal(1), sub(ELBOW_R, WRIST_R), WRIST_R);
    k.body('hand-bones', sdf.union(handR.bone('hand.R'), boneGrip(GRIP).bone('hand.L')), {
      color: C.bone,
      roughness: 0.6,
      detail: 0.0035,
    });

    // The dark chest cavity behind the ribs.
    const cavity = sdf.smoothUnion(0.03, sdf.ellipsoid([0.09, 0.088, 0.066]).at(0, 0.37, 0.0), sdf.cylinder(0.04, 0.1, 0.015).at(0, 0.29, -0.04));
    k.body('cavity', cavity.bone('chest'), { color: C.cavity, roughness: 0.95 });

    // Glowing eyes deep in the sockets, with dark pupils and one highlight each.
    const eyeAt = (x: number): V3 => [x - Math.sign(x) * 0.004, EYE[1] - 0.01, faceZ(Math.abs(x), EYE[1]) - 0.04];
    const eyes = sdf.union(sdf.sphere(0.026).at(...eyeAt(EYE[0])), sdf.sphere(0.026).at(...eyeAt(-EYE[0])));
    k.body('eyes', eyes.bone('head'), { color: C.eye, roughness: 0.2, emissive: C.eye, emissiveIntensity: 1.4 });
    const pupils = sdf.union(
      ...[EYE[0], -EYE[0]].map((x) => {
        const e = eyeAt(x);
        const px = e[0] - Math.sign(x) * 0.006;
        return sdf
          .ellipsoid([0.011, 0.016, 0.008])
          .at(px, e[1] - 0.002, e[2] + 0.022)
          .paintWhere(sdf.sphere(0.0045).at(px + 0.005, e[1] + 0.007, e[2] + 0.029), '#ffffff', 0.002);
      }),
    );
    k.body('pupils', pupils.bone('head'), { color: C.pupil, roughness: 0.2, detail: 0.003 });

    // ------------------------------------------------------------------ hood (ragged green; the face shows through an oval window)
    const hoodOuter = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.23, 0.226, 0.22]).at(0, 0.694, -0.018),
      sdf.ellipsoid([0.238, 0.13, 0.22]).at(0, 0.575, -0.01), // wraps the cheeks and the jaw
      sdf.cone([0, 0.86, -0.07], [0, 0.915, -0.11], 0.07, 0.02), // a slack point that falls back
    );
    const hoodCavity = sdf.smoothUnion(0.02, skullSolid.round(0.014), sdf.ellipsoid([0.216, 0.21, 0.204]).at(0, 0.688, -0.01));
    const opening = sdf.ellipsoid([0.2, 0.145, 0.4]).at(0, 0.615, 0.3);
    const hoodRim = hoodOuter
      .round(0.014)
      .subtract(hoodCavity.round(-0.004))
      .intersect(opening.round(0.032))
      .subtract(opening);
    const weave = (x: number, y: number, z: number) => 0.0007 * noise.fbm(x * 120, y * 120, z * 120, 2);
    const hood = sdf
      .smoothUnion(0.012, hoodOuter.subtract(hoodCavity).smoothSubtract(0.02, opening), hoodRim)
      .intersect(sdf.halfSpace([0, -1, 0], -0.45))
      .paintWhere(hoodCavity.round(0.006), C.hoodInside, 0.012)
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 9, y * 9, z * 9, 3);
        return n > 0.25 ? [base[0] * 0.84, base[1] * 0.86, base[2] * 0.82] : base; // grime
      });
    k.body('hood', hood, { color: C.hood, roughness: 0.9, bone: 'head', bump: weave });

    // ------------------------------------------------------------------ mantle over the shoulders (ragged hem)
    const mantleSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.49],
            [0.13, 0.47],
            [0.19, 0.43],
            [0.216, 0.38],
            [0.224, 0.338],
            [0.206, 0.334],
            [0.196, 0.374],
            [0.17, 0.418],
            [0.12, 0.452],
            [0.066, 0.468],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.86]);
    // Irregular V cuts from below: each cutter passes through the middle and tears two dags.
    const tears = (count: number, yBase: number, seed: number) =>
      sdf.union(
        ...Array.from({ length: count }, (_, i) => {
          const a = (i * 180) / count + 7 + (noise.random(i, seed, 3) - 0.5) * 12;
          const w = 0.02 + noise.random(i, seed, 5) * 0.018;
          const h = 0.05 + noise.random(i, seed, 7) * 0.035;
          return sdf
            .extrude(
              profile.polygon([
                [-w, yBase - 0.03],
                [w, yBase - 0.03],
                [0, yBase + h],
              ]),
              0.7,
            )
            .rotateY(a);
        }),
      );
    // The front hangs open below the collar, so the ribs show.
    const chestWindow = sdf.ellipsoid([0.118, 0.14, 0.16]).at(0, 0.3, 0.17);
    const mantle = mantleSolid
      .subtract(tears(7, 0.334, 1))
      .smoothSubtract(0.012, chestWindow).paintWhere(sdf.halfSpace([0, 1, 0], 0.37), C.hoodDark, 0.03);
    k.body('mantle', mantle.bone('chest'), { color: C.hood, roughness: 0.9, bump: weave });

    // ------------------------------------------------------------------ cloak (behind; frames the bones)
    const cloakSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.1, 0.462],
            [0.16, 0.43],
            [0.19, 0.37],
            [0.2, 0.28],
            [0.21, 0.19],
            [0.216, 0.13],
            [0.204, 0.13],
            [0.198, 0.19],
            [0.188, 0.28],
            [0.178, 0.37],
            [0.148, 0.418],
            [0.09, 0.448],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.68]);
    const cloak = cloakSolid
      .intersect(sdf.halfSpace([0, 0, 1], -0.03))
      .subtract(tears(6, 0.13, 2))
      .paintWhere(cloakSolid.round(-0.006), C.cloakInside, 0.006);
    k.body('cloak', cloak.bone('chest'), { color: C.cloak, roughness: 0.9, bump: weave });

    // ------------------------------------------------------------------ loincloth: a hip wrap and torn flaps
    const wrapSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.258],
            [0.07, 0.256],
            [0.1, 0.246],
            [0.112, 0.225],
            [0.116, 0.195],
            [0.11, 0.175],
            [0, 0.172],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.82]);
    const flap = (front: boolean) =>
      sdf
        .extrude(
          profile.polygon([
            [0.004, 0.25],
            [0.078, 0.25],
            [0.086, 0.16],
            [0.078, 0.134],
            [0.07, 0.152],
            [0.061, 0.124],
            [0.052, 0.146],
            [0.042, 0.112],
            [0.032, 0.14],
            [0.022, 0.12],
            [0.013, 0.142],
            [0.004, 0.128],
          ]),
          0.012,
          0.004,
        )
        .rotateX(front ? -8 : 8)
        .at(0, 0, front ? 0.118 : -0.114);
    const flaps = pair(sdf.union(flap(true), flap(false)).bone('leg.L')).paintWhere(sdf.halfSpace([0, 1, 0], 0.15), C.clothDark, 0.025);
    k.body('loincloth', sdf.union(wrapSolid.bone('hips'), flaps), { color: C.cloth, roughness: 0.9, bump: weave });

    // ------------------------------------------------------------------ leather: belt and the quiver strap
    const beltY = 0.245;
    const belt = wrapSolid.round(0.01).smoothIntersect(0.005, sdf.box([0.5, 0.036, 0.5], 0.006).at(0, beltY, 0));
    // The strap lies on the ribs from the right shoulder down to the left side.
    const cageOuter = sdf.ellipsoid([0.118, 0.11, 0.092]).at(0, 0.378, 0.004);
    const strap = cageOuter
      .round(0.008)
      .subtract(cageOuter.round(-0.004))
      .smoothIntersect(0.004, sdf.box([0.7, 0.038, 0.7], 0.006).rotateZ(-40).at(0, 0.378, 0));
    k.body('leather', sdf.union(belt.bone('hips'), strap.bone('chest')), { color: C.leather, roughness: 0.6 });

    // ------------------------------------------------------------------ forearm wraps (right) and leather bracer (left)
    const dirR = norm(sub(WRIST_R, ELBOW_R));
    const wraps = sdf.union(
      alignY(sdf.cone([0, 0, 0], [0, 0.058, 0], 0.029, 0.027), dirR, lerp(ELBOW_R, WRIST_R, 0.38)),
      ...[0.42, 0.56, 0.7, 0.84, 0.97].map((t, i) =>
        alignY(
          sdf
            .torus(0.028, 0.0095)
            .rotateX(i % 2 ? 10 : -8)
            .paintWhere(sdf.halfSpace([0, -1, 0], 0.004), C.wrapDark, 0.006),
          dirR,
          lerp(ELBOW_R, WRIST_R, t),
        ),
      ),
    );
    k.body('wraps', wraps.bone('forearm.R'), { color: C.wrap, roughness: 0.85 });

    const dirL = norm(sub(WRIST_L, ELBOW_L));
    const bracerLocal = sdf
      .cone([0, 0, 0], [0, 0.085, 0], 0.034, 0.045)
      .round(0.003)
      .union(sdf.torus(0.045, 0.0065).at(0, 0.084, 0).paint(C.leatherDark))
      .paintWhere(
        sdf.union(...[0.02, 0.042, 0.064].map((y) => sdf.box([0.014, 0.006, 0.2], 0.002).rotateX(0).at(0, y, 0.1))),
        C.lace,
        0.002,
      );
    k.body('bracer', alignY(bracerLocal, dirL, lerp(ELBOW_L, WRIST_L, 0.2)).bone('forearm.L'), {
      color: C.leather,
      roughness: 0.6,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    // ------------------------------------------------------------------ brass: the belt disc and the strap ring
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const disc = sdf
      .union(sdf.cylinder(0.026, 0.01, 0.004), sdf.torus(0.016, 0.0035).at(0, 0.005, 0))
      .rotateX(90)
      .at(0, beltY, beltZ + 0.003);
    const ringAt = sdf.surfacePoint(strap, [-0.05, 0.43, 0.2], 0.002);
    const strapRing = sdf.torus(0.014, 0.0045).rotateX(90).rotateZ(-40).at(...ringAt);
    k.body('brass', sdf.union(disc.bone('hips'), strapRing.bone('chest')), { color: C.brass, roughness: 0.4, metalness: 0.75, detail: 0.0035 });

    // ------------------------------------------------------------------ boots (ankle boots with a fur cuff and laces)
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.052, 0.085, 0.018).at(0, 0.052, -0.006), sdf.ellipsoid([0.064, 0.052, 0.108]).at(0, 0.048, 0.04))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootSole = bootFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.016)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const fur = sdf.cylinder(0.06, 0.024, 0.011).at(0, 0.096, -0.006);
    const laces = sdf.union(...[0.062, 0.078].map((y) => sdf.capsule([-0.022, y, 0.058], [0.022, y + 0.006, 0.058], 0.0045)));
    const bootShape = sdf
      .union(bootFoot, bootSole.paint(C.sole), fur.paint(C.bootFur), laces.paint(C.lace))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(bootShape), {
      color: C.boot,
      roughness: 0.6,
      bump: (x, y, z) => (y > 0.083 ? 0.0016 * noise.fbm(x * 90, y * 160, z * 90, 2) : 0),
    });

    // ------------------------------------------------------------------ quiver and arrows (on the back)
    // Local frame: bottom of the quiver at the origin, the mouth up +Y; the mouth is at the right
    // shoulder, so the fletching shows over it from the front.
    const QUIVER_LEN = 0.25;
    const quiverPose = (s: sdf.Shape) => s.rotateX(-14).rotateZ(44).at(0.08, 0.2, -0.178);
    const tube = sdf.cone([0, 0, 0], [0, QUIVER_LEN, 0], 0.038, 0.048).round(0.004);
    const quiverShape = sdf
      .union(
        tube.subtract(sdf.cylinder(0.042, 0.1).at(0, QUIVER_LEN + 0.04, 0)),
        sdf.torus(0.048, 0.009).at(0, QUIVER_LEN - 0.006, 0).paint(C.quiverDark),
        sdf.cylinder(0.046, 0.026, 0.008).at(0, 0.12, 0).paint(C.quiverDark),
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.025), C.quiverDark);
    k.body('quiver', quiverPose(quiverShape).bone('chest'), {
      color: C.quiver,
      roughness: 0.6,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 140, y * 140, z * 140, 2),
    });
    const vane = sdf.extrude(
      profile.polygon([
        [0, -0.004],
        [0.019, 0.014],
        [0.018, 0.05],
        [0, 0.066],
        [-0.018, 0.05],
        [-0.019, 0.014],
      ]),
      0.008,
      0.003,
    );
    const fletching = sdf.union(vane, vane.rotateY(90));
    const arrowTips = [
      [-0.024, 0.012, 0.44],
      [0.004, 0.022, 0.47],
      [0.028, 0.006, 0.445],
      [-0.008, -0.018, 0.46],
      [0.018, -0.014, 0.43],
    ] as const;
    const arrows = sdf.union(
      ...arrowTips.map(([x, z, len], i) => {
        const top: V3 = [x * 2.6, len, z * 2.6];
        const base: V3 = [x * 0.6, 0.08, z * 0.6];
        const dir: V3 = [top[0] - base[0], top[1] - base[1], top[2] - base[2]];
        const tilt = (Math.atan2(Math.hypot(dir[0], dir[2]), dir[1]) * 180) / Math.PI;
        const yaw = (Math.atan2(dir[0], dir[2]) * 180) / Math.PI;
        const f = fletching
          .rotateY(i * 37)
          .rotateX(tilt)
          .rotateY(yaw)
          .at(...lerp(base, top, 0.83));
        return sdf.union(sdf.capsule(base, top, 0.006), f.paint(i % 2 ? C.fletchBlack : C.fletchRed));
      }),
    );
    k.body('arrows', quiverPose(arrows).bone('chest'), { color: C.shaft, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ recurve bow in the left hand (the goblin archer's)
    // Local frame: grip at the origin, limbs along Y, the back of the bow toward +Z, the string
    // behind it at -Z. Each limb bends back toward the string, then the tip curls forward.
    const limb = (len: number, sign: 1 | -1) =>
      sdf.chain(
        [
          [0, 0, 0, 0.019],
          [0, 0.22 * len * sign, -0.007, 0.0152],
          [0, 0.48 * len * sign, -0.03, 0.013],
          [0, 0.72 * len * sign, -0.056, 0.011],
          [0, 0.88 * len * sign, -0.066, 0.0096],
          [0, 0.97 * len * sign, -0.052, 0.0088],
          [0, 1.02 * len * sign, -0.026, 0.0082],
          [0, 1.03 * len * sign, 0.0, 0.0076],
          [0, 1.015 * len * sign, 0.02, 0.0072],
        ],
        0.01,
      );
    const UPPER = 0.31;
    const LOWER = 0.2;
    const bowLocal = sdf.union(limb(UPPER, 1), limb(LOWER, -1)).paintWhere(sdf.box([0.1, 0.085, 0.1]), C.bowGrip);
    const nockTop: V3 = [0, 0.9 * UPPER, -0.072];
    const nockBottom: V3 = [0, -0.9 * LOWER, -0.072];
    // The back of the bow faces out (+X), so the front view shows the whole curve.
    const bowPose = (s: sdf.Shape) => s.rotateY(100).rotateZ(-6).at(...GRIP);
    k.body('bow', bowPose(bowLocal), {
      color: C.bow,
      roughness: 0.55,
      detail: 0.004,
      bone: 'hand.L',
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 30, y * 200, z * 30, 2),
    });
    k.body('bowstring', bowPose(sdf.capsule(nockTop, nockBottom, 0.0035)), {
      color: C.string,
      roughness: 0.8,
      detail: 0.003,
      bone: 'hand.L',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // A slow, creaky head tilt.
        head: { rotate: [0, 6 * wave(p, 1, 0.25), 4 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'upperarm.R': { rotate: [3 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
        'hand.R': { rotate: [0, 0, 6 * wave(p, 1, 0.3)] },
      }),
    });

    // The bow arm swings less than the free arm and lifts out from the body (`lift`, degrees),
    // so the lower bow tip clears the ground and the boot while the hips drop at each step.
    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number, lift: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        return {
          hips: {
            move: [0, -legDrop(LEG, legSwing * s) + hop * bump(p, 2, 0.25), 0] as const,
            rotate: [0, 7 * s, 0] as const,
          },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          // The skull bobs a beat late, loose on its neck bones.
          head: { rotate: [-lean + 3 * wave(p, 2, 0.3), 5 * s, 2 * wave(p, 1, 0.2)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.35 * s, 0, lift] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.15, 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.4 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          // The loose hand flops a beat late.
          'hand.R': { rotate: [8 * wave(p, 1, 0.2), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 28, 3, 0, 8));
    k.animation('run', stride(0.56, 40, 50, 12, 0.03, 14));

    // A shot: turn side-on and raise the bow (aim), pull the right hand back to the jaw (draw),
    // hold, loose with a snap of the right hand and a kick of the bow, then settle back.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const aim = ease(0, 0.28, p) * (1 - ease(0.78, 1, p));
        const draw = ease(0.28, 0.55, p) * (1 - ease(0.64, 0.68, p));
        const loose = ease(0.64, 0.69, p) * (1 - ease(0.72, 1, p));
        return {
          hips: { move: [0, -0.006 * aim, 0], rotate: [0, -40 * aim, 0] },
          spine: { rotate: [0, -12 * aim, 0] },
          chest: { rotate: [-3 * aim - 4 * loose, -6 * aim, 0] },
          head: { rotate: [-4 * draw, 52 * aim, 0] },
          'upperarm.L': { rotate: [0, 0, 60 * aim + 6 * loose] },
          'forearm.L': { rotate: [12 * aim, 0, 0] },
          'hand.L': { rotate: [0, 0, -56 * aim - 10 * loose] },
          'upperarm.R': { rotate: [-78 * aim, 0, 30 * aim - 20 * draw - 18 * loose] },
          'forearm.R': { rotate: [-40 * aim - 55 * draw + 45 * loose, 0, 0] },
          'leg.L': { rotate: [-8 * aim, 0, 6 * aim] },
          'leg.R': { rotate: [8 * aim, 0, -4 * aim] },
        };
      },
    });
  },
});
