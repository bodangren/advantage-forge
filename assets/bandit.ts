import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Bandit — Chibi Quest enemy (catalog `enemies/humanoid/bandit`), about 0.99 m to the top of his
 * hair, faces +Z. Target: docs/enemy-mockups/bandit_001.jpg (made with mmx; one front view).
 * Built on the rogue's head and skeleton (through the adventurer), so the human characters read
 * as one set.
 *
 * Role: the common human enemy, seen in 3D and as a 128 px sprite; the mask and the glare read.
 * One idea: a scowling young thug whose face is half hidden by a dark red mask, with wild hair,
 *   a stolen loot sack over one shoulder and a dark cutlass in the other hand.
 * Proportions: the rogue's (head center 0.675, eyes 0.628, chin 0.48, shoulders 0.385, belt
 *   0.25); the hair rises to 0.99; the loot sack hangs from the right shoulder to 0.2.
 * Shape language: round (head, sack, boots) with sharp accents for menace (hair spikes, the mask's
 *   V point, the brows, the curved blade).
 * Palette (60/30/10): dark grey-green shirt #4a4e44 with cream stripes, brown leather #7a4a2a,
 *   near-black trousers #2e2622; tan sack #c29a5a; a dark red mask #7a2a28 as the accent over
 *   the light face.
 * Value plan: the light eyes and forehead between the dark hair and the dark red mask are the
 *   focal point; the tan sack is the second light mass.
 * Bodies: skin, hair, mask, shirt, vest, trousers, leather (belt, pouch, wrist wrap), steel,
 *   boots, loot-sack, rope, cutlass, hilt.
 * Rig: the rogue's skeleton plus `knot` (the mask's tails) and `sack`; the cutlass is rigid on
 *   `cutlassbone`, a child of `hand.L` that the death clip moves (the cutlass drops) and the taunt
 *   tosses (one flip in the air).
 *   Clips: idle, walk, run, attack (a high diagonal slash), hit, death, taunt (beckon twice with
 *   the palm up, toss and catch the cutlass, point it at the player; plays when the bandit first
 *   sees the player).
 */

const C = {
  skin: '#f2c7a4',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c120c',
  iris: '#4a2c1a',
  irisLow: '#7a4a26',
  pupil: '#110d0b',
  lid: '#16100c',
  brow: '#1e1612',
  mark: '#5a2a22',
  hair: '#33241e',
  hairDark: '#221812',
  mask: '#7a2a28',
  maskDark: '#5a1e1c',
  shirt: '#4a4e44',
  stripe: '#e2d6b8',
  cuff: '#d8cba8',
  vest: '#7a4a2a',
  vestDark: '#5a341e',
  trousers: '#2e2622',
  roll: '#4a5044',
  leather: '#6a3e22',
  steel: '#9aa0a8',
  boot: '#6e4026',
  sole: '#3a2418',
  sack: '#c29a5a',
  sackDark: '#9a7440',
  rope: '#8a6a3a',
  blade: '#3a3c44',
  bladeEdge: '#8a8e96',
  grip: '#4a2e1e',
  brass: '#b8893a',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: the right arm hangs by the sack, the left hand holds the cutlass forward and low.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.18, 0.332, 0.012];
const WRIST_R: V3 = [-0.205, 0.238, 0.03];
const ELBOW_L: V3 = [0.19, 0.335, 0.02];
const WRIST_L: V3 = [0.218, 0.262, 0.07];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];

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
  name: 'bandit',
  description: 'Chibi bandit enemy: wild dark hair, an angry glare over a dark red mask, a striped shirt and leather vest, a loot sack, and a cutlass.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/bandit_001.jpg',

  build(k) {
    const KNOT: V3 = [0, 0.6, -0.2];
    const SACK_TOP: V3 = [-0.14, 0.43, -0.08];
    const GRIP: V3 = [WRIST_L[0] + 0.007, WRIST_L[1] - 0.045, WRIST_L[2] + 0.02];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [0.02, 0.52, -0.25] },
      sack: { parent: 'chest', at: SACK_TOP, tail: [-0.18, 0.22, -0.12] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      cutlassbone: { parent: 'hand.L', at: GRIP },
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
    const nose = sdf.ellipsoid([0.022, 0.018, 0.017]).at(0, 0.57, faceZ(0, 0.57) - 0.002).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.048, 0.034])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.61, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
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

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.05, 0.052, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.046, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.04, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.022));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] - 0.002));
    // A heavy upper lid that cuts the top of each eye on a slant: a glare.
    const lid = pair(
      sdf
        .extrude(
          profile.polygon([
            [EYE[0] - 0.06, EYE[1] + 0.022],
            [EYE[0] + 0.06, EYE[1] + 0.046],
            [EYE[0] + 0.06, EYE[1] + 0.09],
            [EYE[0] - 0.06, EYE[1] + 0.09],
          ]),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    const lidLine = pair(sdf.extrude(profile.arc(0.05, 0.011, 20, 160), 0.3).at(EYE[0], EYE[1] - 0.006, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.011), x + 0.015, EYE[1] + 0.012), at(sdf.sphere(0.0055), x - 0.013, EYE[1] - 0.022)]),
    );
    // Thick angry brows: the inner ends dip toward the nose.
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.165, 0.708],
              [0.12, 0.718],
              [0.075, 0.7],
              [0.042, 0.674],
              [0.046, 0.658],
              [0.08, 0.678],
              [0.122, 0.694],
              [0.162, 0.694],
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    // Two small anger ticks on the forehead and a scar on the left cheek, above the mask.
    const tick = (x: number, y: number) => sdf.extrude(profile.rect([0.008, 0.024], 0.003), 0.3).rotateZ(-14).at(x, y, 0.1);
    const marks = sdf.union(
      tick(0.03, 0.735),
      tick(0.048, 0.738),
      sdf.extrude(profile.arc(0.02, 0.006, 110, 250), 0.3).at(0.16, 0.625, 0.1),
    );
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(shine, '#ffffff')
      .paintWhere(lid.intersect(eyeWhite.round(0.004)), C.skin)
      .paintWhere(lidLine.intersect(sdf.halfSpace([0, -1, 0], -(EYE[1] + 0.004))), C.lid)
      .paintWhere(brows, C.brow)
      .paintWhere(marks, C.mark, 0.002);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ mask: a bandana over the nose and mouth
    // A wide, soft blend over the nose, so the cloth drapes over it as a low ridge.
    const faceShape = sdf.smoothUnion(0.05, head, sdf.ellipsoid([0.03, 0.024, 0.024]).at(0, 0.57, faceZ(0, 0.57) - 0.006));
    const maskShell = faceShape.round(0.013).subtract(faceShape.round(-0.002));
    const maskFront = maskShell.intersect(
      sdf
        .extrude(
          profile.polygon([
            [-0.26, 0.606],
            [-0.08, 0.596],
            [0, 0.605],
            [0.08, 0.596],
            [0.26, 0.606],
            [0.26, 0.5],
            [0.07, 0.492],
            [0, 0.45],
            [-0.07, 0.492],
            [-0.26, 0.5],
          ]),
          0.4,
        )
        .at(0, 0, 0.2),
    );
    // Around the back of the head the bandana is a band, tied in a knot with two short tails.
    const maskBand = maskShell.smoothIntersect(0.005, sdf.box([0.6, 0.05, 0.4], 0.01).at(0, 0.595, -0.2));
    // The V point of the cloth hangs below the chin, in front of the neck.
    const chinZ = faceZ(0, 0.5);
    const maskPoint = sdf
      .extrude(
        profile.polygon([
          [-0.075, 0.52],
          [0.075, 0.52],
          [0, 0.43],
        ]),
        0.012,
        0.005,
      )
      .rotateX(-18)
      .at(0, 0, chinZ - 0.012);
    const knotShape = sdf.ellipsoid([0.034, 0.028, 0.024]).at(...KNOT);
    const tail = (dx: number, dy: number) =>
      sdf.chain(
        [
          [KNOT[0], KNOT[1], KNOT[2], 0.018],
          [KNOT[0] + dx * 0.5, KNOT[1] + dy * 0.5, KNOT[2] - 0.03, 0.022],
          [KNOT[0] + dx, KNOT[1] + dy, KNOT[2] - 0.04, 0.01],
        ],
        0.008,
      );
    const mask = sdf
      .smoothUnion(0.01, sdf.smoothUnion(0.012, maskFront, maskPoint, maskBand).bone('head'), knotShape.bone('head'), sdf.union(tail(-0.05, -0.08), tail(0.04, -0.09)).bone('knot'))
      .paintFn((x, y, z, base) => (z > 0 && Math.abs(Math.sin(x * 50 + y * 30)) < 0.07 && y < 0.58 ? rgb(C.maskDark) : base));
    k.body('mask', mask, { color: C.mask, roughness: 0.85 });

    // ------------------------------------------------------------------ hair: wild dark tufts
    const cap = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([HEAD[0] + 0.018, HEAD[1] + 0.02, HEAD[2] + 0.018]).at(0, HEAD_Y + 0.012, -0.01),
        sdf.ellipsoid([0.2, 0.08, 0.18]).at(0, 0.85, -0.01),
      )
      .smoothSubtract(0.015, sdf.ellipsoid([0.23, 0.14, 0.22]).at(0, 0.62, 0.15));
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts.map(([x, y, z, r]) => [x, y, z, r * 1.2] as [number, number, number, number]), 0.02);
    const tufts = sdf.smoothUnion(
      0.03,
      lock([
        [0.0, 0.86, 0.08, 0.05],
        [0.01, 0.95, 0.07, 0.036],
        [0.03, 0.99, 0.02, 0.012],
      ]),
      lock([
        [-0.08, 0.85, 0.07, 0.046],
        [-0.14, 0.92, 0.05, 0.032],
        [-0.2, 0.93, 0.02, 0.012],
      ]),
      lock([
        [0.08, 0.85, 0.07, 0.046],
        [0.15, 0.92, 0.04, 0.032],
        [0.22, 0.91, 0.0, 0.012],
      ]),
      lock([
        [-0.06, 0.88, -0.06, 0.048],
        [-0.1, 0.96, -0.1, 0.03],
        [-0.12, 0.97, -0.16, 0.012],
      ]),
      lock([
        [0.07, 0.87, -0.07, 0.048],
        [0.12, 0.94, -0.12, 0.03],
        [0.13, 0.95, -0.18, 0.012],
      ]),
      lock([
        [-0.16, 0.8, 0.02, 0.042],
        [-0.23, 0.8, 0.01, 0.028],
        [-0.27, 0.76, 0.0, 0.01],
      ]),
      lock([
        [0.16, 0.8, 0.0, 0.042],
        [0.23, 0.79, -0.01, 0.028],
        [0.27, 0.75, -0.02, 0.01],
      ]),
      // Locks over the forehead, down to just above the brows.
      lock([
        [-0.05, 0.84, 0.15, 0.036],
        [-0.08, 0.78, 0.19, 0.026],
        [-0.1, 0.74, 0.19, 0.01],
      ]),
      lock([
        [0.06, 0.84, 0.15, 0.032],
        [0.09, 0.79, 0.185, 0.022],
        [0.1, 0.755, 0.18, 0.009],
      ]),
    );
    const sideburns = pair(sdf.cone([0.19, 0.7, 0.03], [0.195, 0.62, 0.05], 0.028, 0.012));
    const hair = sdf
      .smoothUnion(0.02, cap, tufts, sideburns)
      .paintWhere(sdf.ellipsoid([0.2, 0.08, 0.2]).at(0, 0.7, -0.02), C.hairDark, 0.06);
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ shirt (striped), vest
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
    const stripe = rgb(C.stripe);
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(
          0.01,
          sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 0.62), 0.048, 0.046),
          sdf.cone(lerp(s, e, 0.52), lerp(s, e, 0.7), 0.051, 0.051).round(0.003).paint(C.cuff), // rolled cuff
        )
        .bone(tag);
    const shirt = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'))
      .paintFn((x, y, z, base) => (y < 0.43 && y > 0.27 && Math.abs(x) < 0.16 && Math.sin(y * 150) > 0.35 ? stripe : base));
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.85 });
    // The vest: a leather shell over the torso, open at the front in a wide V, to the waist.
    const vest = torso
      .round(0.012)
      .subtract(torso.round(0.001))
      .intersect(sdf.halfSpace([0, 1, 0], 0.44))
      .intersect(sdf.halfSpace([0, -1, 0], -0.215))
      .smoothSubtract(
        0.006,
        sdf
          .extrude(
            profile.polygon([
              [-0.035, 0.46],
              [0.035, 0.46],
              [0.07, 0.2],
              [-0.07, 0.2],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      )
      // Arm holes.
      .subtract(pair(sdf.ellipsoid([0.06, 0.07, 0.07]).at(0.13, 0.38, 0)))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.232), C.vestDark, 0.004);
    k.body('vest', vest.bone('chest'), { color: C.vest, roughness: 0.6 });

    // ------------------------------------------------------------------ trousers, boots
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(
        sdf
          .smoothUnion(
            0.01,
            sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.12, 0.004], 0.05),
            sdf.cylinder(0.057, 0.034, 0.012).at(0.096, 0.112, 0.004).paint(C.roll), // rolled cuff
          )
          .bone('leg.L'),
      ),
    );
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.052, 0.08, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootStraps = bootFoot
      .round(0.003)
      .smoothIntersect(0.003, sdf.union(sdf.box([0.2, 0.012, 0.2]).at(0, 0.075, 0), sdf.box([0.2, 0.012, 0.2]).rotateX(-25).at(0, 0.06, 0.07)));
    const boot = bootFoot
      .union(bootStraps.paint(C.sole))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ leather: belt, pouch, wrist wrap
    const beltY = 0.235;
    const belt = torso.round(0.014).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5], 0.006).at(0, beltY, 0));
    const pouchAt = sdf.surfacePoint(belt, [-0.12, beltY - 0.02, 0.15], 0);
    const pouch = sdf
      .union(sdf.box([0.052, 0.066, 0.034], 0.012), sdf.box([0.058, 0.028, 0.04], 0.01).at(0, 0.022, 0.002).paint(C.vestDark))
      .rotateY(-35)
      .at(pouchAt[0] - 0.01, pouchAt[1] - 0.03, pouchAt[2] + 0.006);
    const wrap = sdf.cone(lerp(ELBOW_R, WRIST_R, 0.72), lerp(ELBOW_R, WRIST_R, 1.0), 0.038, 0.037).round(0.003);
    k.body('leather', sdf.union(belt.bone('spine'), pouch.bone('spine'), wrap.bone('forearm.R')), { color: C.leather, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.052, 0.042, 0.012], 0.005).subtract(sdf.box([0.03, 0.022, 0.03], 0.004)), sdf.box([0.008, 0.028, 0.01], 0.003).at(0.002, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    k.body('steel', buckle.bone('spine'), { color: C.steel, roughness: 0.35, metalness: 0.85 });

    // ------------------------------------------------------------------ the loot sack over the right shoulder
    // A lumpy sack hanging behind the right arm, its neck bunched and tied near the shoulder.
    const sackBody = sdf
      .smoothUnion(
        0.04,
        sdf.ellipsoid([0.095, 0.12, 0.085]).at(-0.185, 0.3, -0.095),
        sdf.sphere(0.06).at(-0.2, 0.24, -0.06),
        sdf.cone([-0.17, 0.36, -0.09], [SACK_TOP[0], SACK_TOP[1], SACK_TOP[2]], 0.05, 0.022),
      )
      .displace(0.006, (x, y, z) => noise.fbm(x * 18, y * 18, z * 18, 2))
      .paintWhere(sdf.sphere(0.05).at(...SACK_TOP), C.sackDark, 0.02);
    k.body('loot-sack', sackBody.bone('sack'), {
      color: C.sack,
      roughness: 0.9,
      bump: (x, y, z) => 0.0007 * Math.sin((x + z) * 700) * Math.sin(y * 700),
    });
    // The rope that ties the neck runs over the shoulder to the front of the chest.
    const rope = sdf.chain(
      [
        [SACK_TOP[0], SACK_TOP[1] + 0.005, SACK_TOP[2], 0.009],
        [-0.13, 0.465, 0.0, 0.009],
        [-0.1, 0.43, 0.1, 0.009],
      ],
      0.006,
    );
    k.body('rope', sdf.union(rope, sdf.torus(0.024, 0.008).at(SACK_TOP[0], SACK_TOP[1] - 0.01, SACK_TOP[2])).bone('chest'), {
      color: C.rope,
      roughness: 0.9,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ the cutlass in the left hand
    // Local frame: the grip at the origin, the blade forward along +X with a curved edge below;
    // turned so that +X points forward, then tilted down and out.
    const bladeOutline = profile.polygon(
      [
        [0.03, 0.016],
        [0.14, 0.022],
        [0.23, 0.04],
        [0.3, 0.08],
        [0.275, 0.028],
        [0.21, -0.014],
        [0.12, -0.034],
        [0.03, -0.022],
      ],
      { smooth: true, samples: 4 },
    );
    const bladeLocal = sdf
      .extrude(bladeOutline, 0.012, 0.004)
      .paintWhere(sdf.extrude(profile.offsetProfile(bladeOutline, -0.008), 0.1).subtract(sdf.box([1, 0.02, 1]).at(0.3, -0.02, 0)), C.blade, 0.003);
    const hiltLocal = sdf.union(
      sdf.ellipsoid([0.012, 0.03, 0.026]).at(0.03, 0, 0).paint(C.brass), // guard
      sdf.capsule([-0.06, 0, 0], [0.025, 0, 0], 0.013), // grip
      sdf.sphere(0.017).at(-0.066, 0, 0).paint(C.brass), // pommel
    );
    const cutlassPose = (s: sdf.Shape) => s.rotateY(-90).rotateX(6).rotateY(66).at(...GRIP);
    k.body('cutlass', cutlassPose(bladeLocal), { color: C.bladeEdge, roughness: 0.4, metalness: 0.75, detail: 0.003, bone: 'cutlassbone' });
    k.body('hilt', cutlassPose(hiltLocal), { color: C.grip, roughness: 0.7, detail: 0.004, bone: 'cutlassbone' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // Shifty: the head glances from side to side.
        head: { rotate: [0, 12 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        knot: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        sack: { rotate: [2 * wave(p, 1, 0.3), 0, 2 * wave(p, 1, 0.2)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
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
          // The sack and the mask tails swing a little after the steps.
          knot: { rotate: [lean * 1.5 + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          sack: { rotate: [lean + 6 * wave(p, 2, 0.25), 0, 5 * wave(p, 1, 0.3)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.6 * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * 0.4 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.3, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 26, 3, 0));
    k.animation('run', stride(0.56, 40, 46, 12, 0.03));

    // Attack: a strong left-handed diagonal slash with the cutlass, solved by targets (the mirror of
    // the animated armor's cut). The wrist follows its keys (reach); the blade follows its own keys
    // (orient). The keys are in the chest's frame: the hips and the chest turn the whole arm.
    // Wind-up: the chest turns to the left, the weight goes back onto the left foot, and the cutlass
    // rises high over the left shoulder with the tip back behind the head, for a short hold.
    // Cut (about 0.12 s): the blade comes up over the shoulder and down across the front, from high
    // left to low right (high right to low left in the front view), as the right foot steps in and
    // the chest unwinds. Follow-through: the blade runs on past the right hip and slows, then
    // recovers to rest. edgeUp turns the flat so the curved edge leads the cut; the back of the
    // blade leads the lift and the recovery.
    const { keys, reach, orient, edgeUp } = motion;
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    // The cutlass's rest frame, from the turns in cutlassPose: the blade runs along local +X, and
    // the flat's normal is the extrude axis, local +Z.
    const cutlassTurn = (v: V3): V3 => {
      const w = new THREE.Vector3(...v)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-90))
        .applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(6))
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(66));
      return [w.x, w.y, w.z];
    };
    const BLADE_DIR = cutlassTurn([1, 0, 0]); // out to the left, forward, a little down
    const FLAT = cutlassTurn([0, 0, 1]); // forward and to the right
    // The flat's normal through the cut (up and to the right). edgeUp keeps its sign on this side,
    // so the edge leads the whole cut and never flips when the blade points straight forward.
    const CUT_FLAT = norm([-0.6, 0.75, 0]);
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const bladeKeys = [
      [0, BLADE_DIR],
      [0.12, norm([0.75, 0.62, 0.22])], // out to the left and rising
      [0.24, norm([0.3, 0.75, -0.6])], // up and back over the left shoulder
      [0.3, norm([0.28, 0.72, -0.64])], // the top: the tip back behind the head
      [0.39, norm([0.24, 0.7, -0.67])], // the hold, cocked a little further
      [0.44, norm([0.45, 0.88, 0.1])], // up over the shoulder
      [0.48, norm([0.58, 0.52, 0.62])], // high on the left, pointing forward and up
      [0.51, norm([-0.08, -0.1, 0.99])], // forward, below the chin, cutting down and across
      [0.54, norm([-0.58, -0.52, 0.62])], // low right, the end of the fast cut
      [0.62, norm([-0.68, -0.56, 0.47])], // on past the right hip, slowing
      [0.72, norm([-0.68, -0.58, 0.45])],
      [0.86, norm([0.35, 0.02, 0.94])], // the recovery lifts the tip forward, clear of the ground
      [1, BLADE_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_L],
            [0.12, [0.25, 0.36, 0.04]], // out to the left, rising
            [0.24, [0.245, 0.47, -0.045]],
            [0.3, [0.25, 0.48, -0.06]], // the top, high over the left shoulder
            [0.39, [0.25, 0.485, -0.065]], // the hold
            [0.44, [0.255, 0.475, 0.02]], // up over the shoulder
            [0.48, [0.2, 0.44, 0.11]], // high on the left, in front
            [0.51, [0.15, 0.385, 0.16]],
            [0.54, [0.12, 0.335, 0.165]], // low right, the end of the fast cut
            [0.62, [0.11, 0.32, 0.16]], // the follow-through slows
            [0.72, [0.115, 0.32, 0.16]],
            [0.86, [0.2, 0.3, 0.13]], // out and forward, so the pommel stays off the vest
            [1, WRIST_L],
          ] as const,
          'spline',
        );
        const dir = norm(bladeAt(p));
        // The flat turns from its rest side to the cut side in the lift, and back to rest at the
        // end, so the first and the last frame are the rest pose.
        const lead = ease(0.14, 0.3, p) * (1 - ease(0.74, 0.94, p));
        const cutUp = edgeUp(bladeAt, p, CUT_FLAT);
        const up = norm([FLAT[0] + (cutUp[0] - FLAT[0]) * lead, FLAT[1] + (cutUp[1] - FLAT[1]) * lead, FLAT[2] + (cutUp[2] - FLAT[2]) * lead]);
        // The elbow points out and down (its rest side), out, up, and back in the wind-up, then out
        // and forward through the cut, so the forearm stays clear of the head and the vest.
        const POLE_REST: V3 = [SHOULDER[0] + 4 * (ELBOW_L[0] - SHOULDER[0]), SHOULDER[1] + 4 * (ELBOW_L[1] - SHOULDER[1]), SHOULDER[2] + 4 * (ELBOW_L[2] - SHOULDER[2])];
        const pole = keys(p, [[0, POLE_REST], [0.24, [0.6, 0.35, -0.2]], [0.42, [0.6, 0.35, -0.15]], [0.5, [0.5, 0.05, 0.5]], [0.74, [0.45, -0.05, 0.5]], [1, POLE_REST]] as const);
        const arm = reach(ARM_L, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: BLADE_DIR, up: FLAT }, { dir, up });
        const wind = ease(0, 0.28, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.41, 0.54, p) * (1 - ease(0.72, 1, p));
        // The sack and the mask tails lag behind the turn of the body.
        const swing = ease(0.46, 0.64, p) * (1 - ease(0.74, 1, p));
        return {
          // Wind-up: the hips shift back and onto the left (back) foot. Cut: they drive forward.
          hips: { move: [0.012 * wind - 0.01 * cut, -legDrop(LEG, 16 * cut) - 0.006 * wind, 0.035 * cut - 0.012 * wind], rotate: [0, 8 * wind - 18 * cut, 0] },
          spine: { rotate: [-5 * wind + 10 * cut, -6 * cut, 0] },
          chest: { rotate: [-5 * wind + 5 * cut, 14 * wind - 16 * cut, 0] },
          head: { rotate: [-2 * wind + 4 * cut, -8 * wind + 16 * cut, 0] },
          knot: { rotate: [-6 * wind + 14 * swing, 0, 6 * wind - 10 * swing] },
          sack: { rotate: [-3 * wind + 8 * swing, 0, 6 * wind - 14 * swing] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          // The empty right arm reaches forward and out for balance, then pulls back to the sack.
          'upperarm.R': { rotate: [-18 * wind + 8 * cut, 0, -12 * wind] },
          'forearm.R': { rotate: [-14 * wind, 0, 0] },
          // The right (front) foot is light in the wind-up and steps in on the cut; the left leg
          // takes the weight, then pushes back.
          'leg.R': { rotate: [-6 * wind - 22 * cut, 0, 0] },
          'leg.L': { rotate: [-3 * wind + 12 * cut, 0, 0] },
          'foot.R': { rotate: [6 * wind + 16 * cut, 0, 0] },
          'foot.L': { rotate: [3 * wind - 8 * cut, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The head and the chest snap back and the hips give way: the left foot stays planted and the
    // right foot steps back, then all returns quickly. The cutlass stays in the hand. The sack and
    // the mask tails swing late.
    const { quat, follow, euler } = motion;
    const DEG = Math.PI / 180;
    const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.06; // the back of the boot, behind the ankle's ground point
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const flop = keys(p, [[0.08, 0], [0.3, 1], [0.5, -0.45], [0.68, 0.15], [0.85, 0]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, 3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, -6 * h, -5 * h] },
          knot: { rotate: [-16 * flop, 0, 8 * flop] },
          sack: { rotate: [-5 * flop, 0, -9 * flop] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          // The cutlass arm is flung out and up a little; the empty arm by the sack follows.
          'upperarm.L': { rotate: [-8 * h, 0, 14 * h] },
          'forearm.L': { rotate: [-10 * h, 0, 0] },
          'upperarm.R': { rotate: [-6 * h, 0, -8 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The blow snaps the chest back, the bandit slumps forward and wobbles, then tips back over his
    // heels as one piece and lands on his back. The chin tucks and the head rolls toward the
    // cutlass, so the back of the skull and the vest rest on the ground. The arms are solved by
    // targets in the chest's rest frame and lie out on the ground. The hand opens in the fall and
    // the cutlass bone carries the cutlass to lie flat beside the left hand. The sack slides off
    // the right shoulder and lands beside him, a moment after the body.
    const LIE = 86; // the hips' final tilt back, degrees
    const LIE_Y = 0.13; // the hips' height when the bandit lies on his back
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0]]; // hips, spine, chest pivots
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const HAND_CHAIN: readonly V3[] = [...TRUNK, SHOULDER, ELBOW_L, WRIST_L];
    const DROP_AT: V3 = [0.4, 0.028, -0.36]; // the grip on the ground, the point toward the feet
    const DROP_TURN = quat(orient([], { dir: BLADE_DIR, up: FLAT }, { dir: norm([0.35, -0.05, 1]), up: [0, 1, 0] }));
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24); // the fall speeds up to the impact
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const slide = keys(p, [[0.4, 0], [0.64, 1.08], [0.72, 0.97], [0.8, 1]] as const);
        // The stagger: the hips give way backward over planted feet.
        const back = 0.022 * hitB;
        const lean = plant(back);
        // The fall: a rigid tip over the back of the heels, until the hips reach their lying height.
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * clamp01((tilt - 70) / 16); // the legs come down once the hips hold
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        // The wrists: flung back by the blow, slumped, flung out in the fall, then out on the ground.
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.215, 0.26, -0.07], land), lerp(ELBOW_R, [-0.3, 0.3, -0.05], land));
        const standL = add(add(add(WRIST_L, [0.05, 0.04, 0.02], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.04], fly);
        const armL = reach(ARM_L, lerp(standL, [0.27, 0.34, -0.07], land), lerp(ELBOW_L, [0.35, 0.36, -0.1], land));
        // The cutlass: attached to the posed hand until the hand opens, then it drops to the ground.
        const handQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).multiply(quat(armL.upper)).multiply(quat(armL.lower));
        const held = add(follow(HAND_CHAIN, [hipsR, spineR, chestR, armL.upper, armL.lower, [0, 0, 0]], GRIP), hipsMove);
        const drop = keys(p, [[0.44, add(DROP_AT, [0, 0.12, 0])], [0.6, DROP_AT], [0.65, add(DROP_AT, [0, 0.02, 0])], [0.7, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = new THREE.Vector3(...add(lerp(held, drop, loose), held, -1)).applyQuaternion(inv);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB + 30 * land, 8 * wob] },
          // The mask tails swing out and lie on the ground beside the head.
          knot: { rotate: [-12 * hitB + 10 * fly, 0, 10 * wob - 90 * land] },
          sack: { move: [-0.03 * slide, 0, 0.045 * slide], rotate: [-6 * hitB + 8 * sag, 0, -8 * wob - 85 * slide] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          cutlassbone: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: beckon, toss, point
    // Played when the bandit first sees the player. He leans back with the head cocked and beckons
    // twice with the free right hand, the palm up: "come here". Then he tosses the cutlass up out
    // to his left; it turns one full flip (about 0.3 m up, 0.35 s) and drops back into his hand,
    // while his head tilts away from it and watches it. He points the blade straight at the player
    // at chest height for a beat (a short thrust: "you!"), and returns to rest.
    // The hand targets are in world space. Each frame converts them into the chest's rest frame
    // and blends them from the arm's rest; reach solves the arm, and orient turns the hand. In the
    // air the cutlass bone undoes the posed hand and carries the cutlass on its own path: up and a
    // little out, the tip up and back first. The flip turns fast after the throw and slows into
    // the catch, so the blade points down only near the top, above the hand that drops out of its
    // way.
    const chestFrame = (rots: readonly V3[], move: V3) => {
      const q = quat(rots[0]!).multiply(quat(rots[1]!)).multiply(quat(rots[2]!));
      const inv = q.clone().invert();
      const at = follow(TRUNK, rots, TRUNK[2]!);
      const c = TRUNK[2]!;
      return {
        q,
        inv,
        point: (w: V3): V3 => {
          const v = new THREE.Vector3(w[0] - at[0] - move[0], w[1] - at[1] - move[1], w[2] - at[2] - move[2]).applyQuaternion(inv);
          return [v.x + c[0], v.y + c[1], v.z + c[2]];
        },
      };
    };
    const turnV = (q: THREE.Quaternion, v: V3): V3 => {
      const w = new THREE.Vector3(...v).applyQuaternion(q);
      return [w.x, w.y, w.z];
    };
    const mix2 = (a: V3, ca: number, b: V3, cb: number): V3 => [a[0] * ca + b[0] * cb, a[1] * ca + b[1] * cb, a[2] * ca + b[2] * cb];
    const Q_ID = new THREE.Quaternion();
    // The right hand's rest frame: the wrist to the fist center, and the palm (the curled fingers)
    // forward.
    const AXIS_R = norm([-0.007, -0.038, 0.004]);
    const PALM_R: V3 = [0, 0, 1];
    const BECKON_AT: V3 = [-0.215, 0.35, 0.1]; // the right wrist out and forward, the forearm level
    const BECKON_F = norm([-0.5, 0.2, 1]); // the hand points forward and out, a little up
    const BECKON_U = norm(add([0, 1, 0], BECKON_F, -BECKON_F[1])); // the palm up
    const POLE_REST_R: V3 = add(mx(SHOULDER), add(ELBOW_R, mx(SHOULDER), -1), 4);
    const POLE_BECKON: V3 = [-0.4, 0.2, -0.06]; // the elbow down and out
    // The left hand: the cutlass straight ahead, the flat upright, the curved edge down.
    const Q_FWD = quat(orient([], { dir: BLADE_DIR, up: FLAT }, { dir: [0, 0, 1], up: [-1, 0, 0] }));
    const GRIP_OFF: V3 = add(GRIP, WRIST_L, -1);
    const TOSS_AT: V3 = [0.265, 0.325, 0.075]; // the grip out to the left and a little forward
    const RELEASE: V3 = add(TOSS_AT, [0, 0.02, 0.005]); // the flick lets go a little higher
    const POINT_AT: V3 = [0.15, 0.345, 0.17]; // the grip before the chest, the blade at the player
    const POLE_REST_L: V3 = add(SHOULDER, add(ELBOW_L, SHOULDER, -1), 4);
    const POLE_TOSS: V3 = [0.45, 0.2, -0.05];
    const POLE_AIM: V3 = [0.42, 0.15, 0.02];
    const FLY0 = 0.455; // the throw
    const FLY1 = FLY0 + 0.35 / 1.5; // the catch, 0.35 s later
    const FLIP_AXIS = new THREE.Vector3(-1, 0, 0); // the tip goes up and back first
    k.animation('taunt', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const beck = keys(p, [[0, 0], [0.08, 1], [0.35, 1], [0.44, 0]] as const);
        const curl = keys(p, [[0.08, 0], [0.15, 1], [0.22, 0], [0.29, 1], [0.36, 0]] as const);
        const cock = keys(p, [[0, 0], [0.08, 1], [0.36, 1], [0.45, 0]] as const);
        const ready = keys(p, [[0.33, 0], [0.41, 1], [0.9, 1], [1, 0]] as const);
        const look = keys(p, [[0.38, 0], [0.45, 1], [0.66, 1], [0.74, 0]] as const);
        const aim = keys(p, [[0.7, 0], [0.79, 1], [0.9, 1], [1, 0]] as const);
        // He leans back for the beckon; the chest turns the left shoulder forward for the point.
        const hipsR: V3 = [0, 0, 0];
        const spineR: V3 = [-4 * cock + 2 * aim, 0, 0];
        const chestR: V3 = [-4 * cock, 6 * cock - 12 * aim, 0];
        const frame = chestFrame([hipsR, spineR, chestR], [0, 0, 0]);
        // The right hand: forward with the palm up; it curls up toward him twice.
        const c = (10 + 75 * curl) * DEG;
        const beckonQ = quat(
          orient([], { dir: AXIS_R, up: PALM_R }, { dir: mix2(BECKON_F, Math.cos(c), BECKON_U, Math.sin(c)), up: mix2(BECKON_F, -Math.sin(c), BECKON_U, Math.cos(c)) }),
        );
        const turnR = Q_ID.clone().slerp(frame.inv.clone().multiply(beckonQ), beck);
        const wristR = lerp(WRIST_R, frame.point(add(BECKON_AT, [0, 0.012, -0.015], curl)), beck);
        const armR = reach(ARM_R, wristR, lerp(POLE_REST_R, frame.point(POLE_BECKON), beck));
        const handR = orient([armR.upper, armR.lower], { dir: AXIS_R, up: PALM_R }, { dir: turnV(turnR, AXIS_R), up: turnV(turnR, PALM_R) });
        // The left hand: the cutlass forward out to the left, the wind-up dip and the flick, the
        // drop out of the way, the catch and its give, then the point with a short thrust.
        const gripW = keys(p, [
          [0.41, TOSS_AT],
          [0.435, add(TOSS_AT, [0, -0.04, -0.01])],
          [FLY0, RELEASE],
          [0.565, add(TOSS_AT, [-0.03, -0.08, -0.01])],
          [FLY1, TOSS_AT],
          [FLY1 + 0.022, add(TOSS_AT, [0, -0.03, 0])],
          [0.74, TOSS_AT],
          [0.8, add(POINT_AT, [0, 0, 0.025])],
          [0.84, POINT_AT],
        ] as const);
        const turnL = Q_ID.clone().slerp(frame.inv.clone().multiply(Q_FWD), ready);
        const wristL = add(lerp(GRIP, frame.point(gripW), ready), turnV(turnL, GRIP_OFF), -1);
        const poleL = lerp(POLE_REST_L, frame.point(keys(p, [[0.74, POLE_TOSS], [0.8, POLE_AIM]] as const)), ready);
        const armL = reach(ARM_L, wristL, poleL);
        const handL = orient([armL.upper, armL.lower], { dir: BLADE_DIR, up: FLAT }, { dir: turnV(turnL, BLADE_DIR), up: turnV(turnL, FLAT) });
        // The flight: the grip rises about 0.3 m and a little out, and comes back into the hand.
        let cutMove: V3 = [0, 0, 0];
        let cutRot: V3 = [0, 0, 0];
        if (p > FLY0 && p < FLY1) {
          const u = (p - FLY0) / (FLY1 - FLY0);
          const at = add(lerp(RELEASE, TOSS_AT, u), [0.05, 0.3, 0], 4 * u * (1 - u));
          const flip = 2 * Math.PI * (0.25 * u + 0.75 * (1 - (1 - u) * (1 - u)));
          const handQ = frame.q.clone().multiply(quat(armL.upper)).multiply(quat(armL.lower)).multiply(quat(handL));
          const held = follow(HAND_CHAIN, [hipsR, spineR, chestR, armL.upper, armL.lower, handL], GRIP);
          const inv = handQ.clone().invert();
          const d = new THREE.Vector3(...add(at, held, -1)).applyQuaternion(inv);
          cutMove = [d.x, d.y, d.z];
          cutRot = euler(inv.multiply(new THREE.Quaternion().setFromAxisAngle(FLIP_AXIS, flip)).multiply(Q_FWD));
        }
        return {
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-3 * cock + 3 * aim, 0, 3 * cock + 4 * look] },
          // Cocky: the chin up and the head cocked to his right; then it tilts further away from
          // the flying cutlass and turns to watch it; for the point it faces the player.
          head: { rotate: [-6 * cock - 4 * look + 5 * aim, 8 * look + 10 * aim, 9 * cock + 12 * look] },
          knot: { rotate: [6 * cock + 6 * look, 0, -6 * look] },
          sack: { rotate: [3 * cock - 2 * aim, 0, 3 * aim] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: handL },
          cutlassbone: { move: cutMove, rotate: cutRot },
        };
      },
    });
  },
});
