import { defineAsset, motion, profile, sdf } from '../src/index.js';

/**
 * Vampire — Chibi Quest dungeon enemy (P1), 1.0 m tall, faces +Z. Built on the rogue base
 * (assets/rogue.ts): same skeleton, knee bones, face layout, and clip set; the hood, daggers,
 * pouches, and leather gear are gone.
 * Target: docs/enemy-mockups/vampire_001.jpg (one front view; side and back are designed here).
 *
 * Role: an enemy seen in 3D and as a 128 px sprite; the pale face, the red eyes, and the flared
 * collar must read.
 * One idea: a small worried noble in a huge black collar and cape; the collar wings and the
 *   A-shaped cape are the silhouette.
 * Shape language: round and soft (head, cheeks, cravat), with points for menace (widow's peak,
 *   collar tips, pointed ears, fangs, cape corners).
 * Palette: pale skin #f2ddd2; black coat and cape #1f1b22 with a red lining #7c1622; burgundy
 *   vest #6a2430 with gold buttons #d2a640; white cravat, cuffs #efe9df; black hair #1d1a1f.
 * Value plan: the pale face between the black hair and the black collar is the focal point;
 *   the white cravat and cuffs are the second contrast; the cape is the darkest large mass.
 * Rig: the rogue's chibi skeleton with a `cloak` bone for the cape. Clips idle, walk, run,
 *   attack (a cape swirl and a biting lunge), attack2 (a spinning cape swirl), hit, death,
 *   victory (a cape spread with a small hover).
 */

const C = {
  skin: '#f3d6c6',
  blush: '#efa6a0',
  eyeWhite: '#f6f1ea',
  irisRim: '#1a0a0e',
  iris: '#b01c2a',
  irisLow: '#e2463e',
  pupil: '#120c0e',
  lid: '#140e10',
  brow: '#221a1e',
  mouth: '#521820',
  teeth: '#f6f0e8',
  hair: '#1d1a1f',
  coat: '#1f1b22',
  vest: '#6a2430',
  lining: '#7c1622',
  shirt: '#efe9df',
  gold: '#d2a640',
  pants: '#27232b',
  boot: '#19171c',
  sole: '#0e0c10',
};

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
// A half space from an unnormalized normal: solid where dot(n, p) <= d.
const plane = (n: readonly [number, number, number], d: number) => sdf.halfSpace([n[0], n[1], n[2]], d / Math.hypot(n[0], n[1], n[2]));

export default defineAsset({
  name: 'vampire',
  description: 'Chibi vampire noble with slicked black hair, red eyes, a flared black collar and red-lined cape, and a burgundy vest.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/vampire_001.jpg',
  // Color slots for individual vampires (the first option is the default look).
  variants: {
    eyes: { red: C.iris, amber: '#c27a1a', violet: '#7432a0' },
    hair: { black: C.hair, silver: '#8e8c94', auburn: '#5a2618' },
    clothing: { burgundy: C.vest, plum: '#4e2446', green: '#27402e' },
  },
  presets: {
    count: { eyes: 'red', hair: 'black', clothing: 'burgundy' },
    elder: { eyes: 'amber', hair: 'silver', clothing: 'plum' },
    fledgling: { eyes: 'violet', hair: 'auburn', clothing: 'green' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      vest: k.tint('clothing'),
      lining: k.tint('clothing', { color: C.lining, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const SHOULDER = [0.13, 0.385, 0] as const;
    const ELBOW = [0.18, 0.332, 0.012] as const;
    const WRIST = [0.205, 0.238, 0.03] as const;
    const HIP = [0.068, 0.195, 0] as const;
    const ANKLE = [0.098, 0.07, 0] as const;
    const KNEE = [0.083, 0.1325, 0] as const; // the knee: splits the leg (shin.L takes the weight below it)
    const HAND = [0.232, 0.172, 0.022] as const; // the hand's end, for the arm solver
    const mx = (p: readonly [number, number, number]) => [-p[0], p[1], p[2]] as const;
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
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

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.018, 0.015, 0.014]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
    // Big ears with a point that leans up and back.
    const ears = pair(
      sdf
        .smoothUnion(
          0.012,
          sdf.ellipsoid([0.03, 0.052, 0.034]),
          sdf.cone([0.002, 0.024, -0.004], [0.014, 0.078, -0.02], 0.021, 0.003),
        )
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-22)
        .rotateZ(-12)
        .at(0.205, 0.598, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    // Arms: short upper arm and forearm inside the coat sleeves, and a relaxed open hand.
    const arm = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.032).bone('forearm.L'),
    );
    const fingers = [0, 1, 2, 3].map((i) => {
      const z = 0.016 + i * 0.0135;
      const len = [0.034, 0.041, 0.039, 0.032][i]!;
      return sdf.capsule([0.212, 0.186, z], [0.205, 0.186 - len, z + 0.007], 0.0092);
    });
    const hand = sdf
      .smoothUnion(
        0.008,
        sdf.ellipsoid([0.027, 0.037, 0.037]).at(0.213, 0.203, 0.035), // palm, facing in
        ...fingers,
        sdf.cone([0.2, 0.212, 0.06], [0.192, 0.186, 0.075], 0.013, 0.009), // thumb, forward
      )
      .bone('hand.L');
    const arms = pair(sdf.smoothUnion(0.02, arm, hand));

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.045, 0.05, 0.07]), EYE[0], EYE[1] - 0.003));
    const iris = pair(at(sdf.ellipsoid([0.04, 0.045, 0.07]), EYE[0], EYE[1] - 0.004));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.034, 0.034, 0.07]), EYE[0], EYE[1] + 0.008));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    // Both highlights sit up and to the +X side: one light for the whole face.
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Worried brows: the inner ends are higher than the outer ends.
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.024, 58, 122), 0.3).rotateZ(-14).at(0.08, 0.63, 0.1));
    // An open frown: the corners droop; the upper teeth show, with two small fangs.
    const MOUTH_Y = 0.528;
    const mouth = sdf
      .extrude(
        profile.polygon(
          [
            [-0.045, -0.012],
            [-0.029, 0.006],
            [0, 0.013],
            [0.029, 0.006],
            [0.045, -0.012],
            [0.024, -0.01],
            [0, -0.012],
            [-0.024, -0.01],
          ],
          { smooth: true },
        ),
        0.3,
      )
      .at(0, MOUTH_Y, 0.1);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(MOUTH_Y + 0.0005)));
    const fangs = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [-0.0055, 0.002],
              [0.0055, 0.002],
              [0, -0.012],
            ],
            { smooth: false },
          ),
          0.3,
        )
        .at(0.017, MOUTH_Y, 0.1),
    ).intersect(mouth);
    const blush = pair(at(sdf.sphere(0.032), 0.135, 0.56));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(arms)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, C.mouth)
      .paintWhere(teeth, C.teeth)
      .paintWhere(fangs, C.teeth);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: slicked back with a widow's peak
    // A round cap over the skull and a swept-back pompadour that rises above the forehead.
    const cap = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.226, 0.238, 0.216]).at(0, 0.71, -0.02),
      sdf.ellipsoid([0.15, 0.075, 0.15]).rotateX(-12).at(0, 0.885, 0.04),
    );
    // The front hairline seen from the front: high at the temples, a V at the center; the sides
    // stay above the ears.
    const faceMask = sdf
      .extrude(
        profile.polygon(
          [
            [0, 0.806],
            [0.04, 0.846],
            [0.095, 0.856],
            [0.142, 0.836],
            [0.172, 0.79],
            [0.182, 0.72],
            [0.3, 0.6],
            [0.3, 0.3],
            [-0.3, 0.3],
            [-0.3, 0.6],
            [-0.182, 0.72],
            [-0.172, 0.79],
            [-0.142, 0.836],
            [-0.095, 0.856],
            [-0.04, 0.846],
          ],
          { smooth: false },
        ),
        0.4,
      )
      .at(0, 0, 0.225);
    // Combed ridges run from front to back (they fan out from below the head in the front view).
    const combed = (x: number, y: number) => Math.sin(Math.atan2(x, y - 0.5) * 30);
    const hair = cap
      .smoothSubtract(0.012, faceMask)
      .smoothIntersect(0.012, plane([0, -1, 0.35], -0.675)) // the lower edge: above the ears, down to the nape
      .displace(0.004, combed);
    k.body('hair', hair, { color: T.hair, roughness: 0.4, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ vest (burgundy front, black coat sides and back)
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
            [0.136, 0.215],
            [0.128, 0.198],
            [0, 0.198],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const vestPanel = sdf.box([0.23, 0.3, 0.3]).at(0, 0.34, 0.18);
    const shirtV = sdf
      .extrude(
        profile.polygon(
          [
            [-0.06, 0.49],
            [0.06, 0.49],
            [0, 0.365],
          ],
          { smooth: false },
        ),
        0.3,
      )
      .at(0, 0, 0.1);
    const vest = torso.paintWhere(vestPanel, T.vest, 0.004).paintWhere(shirtV, C.shirt, 0.003);
    k.body('vest', vest.bone('spine'), { color: C.coat, roughness: 0.7 });

    // ------------------------------------------------------------------ gold buttons on the vest
    const torsoZ = (x: number, y: number) => sdf.raycast(torso, [x, y, 1], [0, 0, -1])![2];
    const buttons = sdf.union(
      ...[0.31, 0.265].flatMap((y) => [0.052, -0.052].map((x) => sdf.sphere(0.0115).at(x, y, torsoZ(Math.abs(x), y) - 0.002))),
    );
    k.body('gold', buttons.bone('spine'), { color: C.gold, roughness: 0.32, metalness: 0.9 });

    // ------------------------------------------------------------------ white cravat: collar band, bow, and frilled jabot
    const frill = (y0: number, len: number, r0: number, r1: number, z: number) =>
      sdf
        .cone([0, 0, 0], [0, -len, 0], r0, r1)
        .scale([1, 1, 0.42])
        .displace(0.005, (x) => Math.sin(x * 150))
        .at(0, y0, z);
    const cravat = sdf.smoothUnion(
      0.008,
      sdf.cylinder(0.058, 0.034, 0.008).at(0, 0.452, -0.008), // the shirt collar around the neck
      sdf.ellipsoid([0.032, 0.026, 0.024]).at(0, 0.44, 0.06), // the knot
      pair(sdf.ellipsoid([0.042, 0.024, 0.02]).rotateZ(-15).at(0.04, 0.438, 0.055)), // bow loops
      frill(0.425, 0.05, 0.03, 0.062, 0.11),
      frill(0.385, 0.05, 0.036, 0.07, 0.118),
    );
    k.body('cravat', cravat, { color: C.shirt, roughness: 0.85, bone: 'chest' });

    // ------------------------------------------------------------------ coat sleeves and white cuffs
    const sleeves = pair(
      sdf.smoothUnion(
        0.012,
        sdf.cone([0.11, 0.405, 0], [0.18, 0.34, 0.012], 0.047, 0.043).bone('upperarm.L'),
        sdf.cone([0.18, 0.345, 0.012], [0.202, 0.255, 0.027], 0.042, 0.04).bone('forearm.L'),
      ),
    );
    k.body('sleeves', sleeves, { color: C.coat, roughness: 0.6 });
    const cuffs = pair(
      sdf
        .cone([0.201, 0.264, 0.026], [0.207, 0.236, 0.031], 0.041, 0.044)
        .round(0.003)
        .bone('forearm.L'),
    );
    k.body('cuffs', cuffs, { color: C.shirt, roughness: 0.85 });

    // ------------------------------------------------------------------ coat shoulders (a short black capelet)
    const mantleSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.482],
            [0.13, 0.458],
            [0.19, 0.412],
            [0.228, 0.35],
            [0.245, 0.292],
            [0.226, 0.288],
            [0.21, 0.343],
            [0.175, 0.4],
            [0.12, 0.44],
            [0.064, 0.462],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.82]);
    // Open in front up to the neck, so the vest and the cravat show.
    const frontGap = sdf
      .extrude(
        profile.polygon([
          [-0.075, 0.5],
          [0.075, 0.5],
          [0.16, 0.25],
          [-0.16, 0.25],
        ]),
        0.4,
      )
      .at(0, 0, 0.22);
    const mantle = mantleSolid.smoothSubtract(0.01, frontGap);
    // Skinned as on the rogue: the cap over each shoulder follows the upper arm.
    const capZone = sdf.ellipsoid([0.1, 0.13, 0.085]).at(0.26, 0.33, 0);
    const bandZone = sdf.ellipsoid([0.135, 0.165, 0.13]).at(0.26, 0.33, 0);
    const mantleSkin = sdf.union(
      mantle,
      pair(mantle.intersect(bandZone).bone('upperarm.L')),
      mantle.subtract(hard(capZone)).bone('chest'),
    );
    k.body('mantle', mantleSkin, { color: C.coat, roughness: 0.5 });

    // ------------------------------------------------------------------ the high collar: black outside, red inside
    // A thin flared wall around the neck (profile in the collar's own frame, the neck base at y = 0),
    // tilted so it stands higher behind the head, and open in front. The upper face is the lining.
    const collarLine: [number, number][] = [
      [0.075, 0],
      [0.12, 0.03],
      [0.2, 0.066],
      [0.27, 0.095],
      [0.3, 0.125],
    ];
    const T2 = 0.005;
    const collarWall = sdf
      .revolve(
        profile.polygon(
          [...collarLine.map(([u, v]) => [u, v - T2] as [number, number]), ...collarLine.map(([u, v]) => [u, v + T2] as [number, number]).reverse()],
          { smooth: false },
        ),
      )
      .round(0.004);
    const aboveLine = sdf.revolve(profile.polygon([[0, 0], ...collarLine, [0.45, 0.16], [0.45, 0.5], [0, 0.5]], { smooth: false }));
    const collarPose = (s: sdf.Shape) => s.scale([1, 1, 0.95]).rotateX(20).at(0, 0.432, -0.018);
    const collar = collarPose(collarWall.paintWhere(aboveLine, T.lining, 0.003))
      .intersect(sdf.halfSpace([0, 0, 1], 0.06))
      .subtract(sdf.cylinder(0.13, 0.5, 0).at(0, 0.5, 0.1));
    k.body('collar', collar, { color: C.coat, roughness: 0.45, bone: 'chest' });

    // ------------------------------------------------------------------ cape (behind, to the ground, red lining)
    // A cone of cloth open at the top and the hem. Both walls get the same fold displacement, so
    // the folds bend the cloth instead of eating through it. It wraps farther forward near the hem.
    const folds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 7) * Math.min(1, Math.max(0, (0.4 - y) / 0.3));
    const capeCone = (r0: number, r1: number, y0: number, y1: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, y0],
            [r0, y0],
            [r1, y1],
            [0, y1],
          ]),
        )
        .scale([1, 1, 0.85])
        .displace(0.013, folds)
        .at(0, 0, -0.03);
    const capeInner = capeCone(0.163, 0.308, 0.45, 0.005);
    const cape = capeCone(0.185, 0.33, 0.43, 0.025)
      .subtract(capeInner)
      .intersect(plane([0, 0.13, 1], -0.035 + 0.13 * 0.43)) // z <= -0.035 at the top, about +0.02 at the hem
      .paintWhere(capeInner.round(0.008), T.lining, 0.003);
    k.body('cape', cape.bone('cloak'), { color: C.coat, roughness: 0.45 });

    // ------------------------------------------------------------------ legs and boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.11, 0.004], 0.05).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.8 });

    // Boot built at the ankle's ground point, then turned out a little.
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.1, 0.02).at(0, 0.075, 0),
        sdf.ellipsoid([0.058, 0.055, 0.1]).at(0, 0.052, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf
      .union(bootFoot, sole.paint(C.sole))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.3 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach } = motion;
    const LEG = 0.19;
    const rad = Math.PI / 180;
    type V3 = readonly [number, number, number];

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
        'hand.L': { rotate: [-4 * bump(p, 1, 0.2), 0, 0] },
        'hand.R': { rotate: [-4 * bump(p, 1, 0.2), 0, 0] },
      }),
    });

    // The legs come from motion.gait, as on the rogue.
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number, flow: number) => ({
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
          // The cape trails behind and flutters twice per cycle, a little after the steps.
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 24, 3, 0.006, 8));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 44, 12, 0.03, 26));

    // ------------------------------------------------------------------ attack: a cape swirl, then a biting lunge
    // He coils back and turns to his right, the arms swing wide and the cape flares open; then he
    // unwinds and lunges forward with a step of the left foot, the hands reach forward like claws,
    // and the head snaps forward and tilts for the bite. The cape streams behind, then all returns.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const coil = keys(p, [[0, 0], [0.24, 1], [0.34, 1], [0.46, 0]] as const);
        const lunge = keys(p, [[0.3, 0], [0.46, 1], [0.66, 1], [0.92, 0]] as const);
        const swirl = keys(p, [[0, 0], [0.24, -26], [0.34, -30], [0.46, 8], [0.66, 5], [1, 0]] as const);
        const flare = keys(p, [[0, 0], [0.22, 0.6], [0.36, 1], [0.54, 1], [0.8, 0.3], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.24, -7], [0.34, -8], [0.46, 24], [0.66, 22], [1, 0]] as const);
        const bite = keys(p, [[0.42, 0], [0.5, 1], [0.56, 0.5], [0.62, 1], [0.78, 0]] as const);
        const legX = keys(p, [[0, 0], [0.24, 3], [0.34, 3], [0.46, -22], [0.66, -22], [1, 0]] as const);
        const stepZ = keys(p, [[0, 0], [0.24, -0.012], [0.34, -0.014], [0.46, 0.055], [0.66, 0.055], [1, 0]] as const);
        const drop = LEG * (1 - Math.cos(legX * rad));
        return {
          hips: { move: [0, -drop - 0.012 * coil, stepZ], rotate: [0, swirl, 0] },
          spine: { rotate: [0.5 * lean, 0, 0] },
          chest: { rotate: [0.5 * lean, 0.6 * swirl, 0] },
          neck: { rotate: [10 * bite, 0, 0] },
          head: { rotate: [-0.6 * lean - 6 * coil + 8 * bite, -0.8 * swirl, 16 * bite] },
          cloak: { rotate: [26 * flare, -14 * flare * coil, 0], scale: [1 + 0.22 * flare, 1, 1 + 0.12 * flare] },
          'upperarm.L': { rotate: [12 * coil - 72 * lunge, 0, 62 * coil + 16 * lunge] },
          'upperarm.R': { rotate: [12 * coil - 72 * lunge, 0, -62 * coil - 16 * lunge] },
          'forearm.L': { rotate: [-18 * coil - 34 * lunge, 0, 0] },
          'forearm.R': { rotate: [-18 * coil - 34 * lunge, 0, 0] },
          'hand.L': { rotate: [-25 * lunge, 0, 0] },
          'hand.R': { rotate: [-25 * lunge, 0, 0] },
          'leg.L': { rotate: [legX, 0, 0] },
          'leg.R': { rotate: [-legX, 0, 0] },
          'foot.L': { rotate: [-legX, 0, 0] },
          'foot.R': { rotate: [legX, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const whip = keys(p, [[0, 0], [0.2, 1], [0.4, 0.5], [0.6, -0.2], [0.82, 0]] as const, 'spline');
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(clamp01((p - 0.04) / 0.2)) + bump(clamp01((p - 0.58) / 0.32));
        const lag = keys(p, [[0, 0], [0.12, 0.3], [0.28, 1], [0.5, -0.45], [0.74, 0.15], [1, 0]] as const, 'spline');
        const back = 0.03 * step;
        const lean = Math.asin(back / LEG) / rad; // the left foot stays planted as the hips move back
        return {
          hips: { move: [0, -legDrop(LEG, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-3 * whip, 0, 0] },
          head: { rotate: [-7 * whip, -6 * whip, 4 * whip] },
          cloak: { rotate: [12 * lag, 0, 4 * lag] },
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
    // As on the rogue: the blow snaps him back, he slumps and wobbles, then tips back over his heels
    // and lands on his back; the collar and the cape hold the head up. The arms fall to his sides.
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    const turnX = (v: V3, deg: number): V3 => {
      const c = Math.cos(deg * rad);
      const s = Math.sin(deg * rad);
      return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
    };
    const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const lerp = (a: V3, b: V3, t: number): V3 => add(a, add(b, a, -1), t);
    const LIE = 78; // the hips' final tilt back, degrees
    const LIE_Y = 0.178; // the hips' height when he lies on his back
    const HEEL = 0.05; // the back of the boot, behind the ankle's ground point
    const FIST_Y = 0.03; // the hand center on the ground
    const BEND_NECK = 10;
    const BEND_HEAD = 12;
    const TURN = 22; // the head turns toward his left
    const HIPS0: V3 = [0, 0.2, 0];
    const END: V3 = [0, LIE_Y - 0.2, -HEEL - 0.2 * Math.sin(LIE * rad) + HEEL * Math.cos(LIE * rad)];
    const toWorld = (v: V3): V3 => add(add(HIPS0, END), turnX(add(v, HIPS0, -1), -LIE));
    const toBody = (w: V3): V3 => add(HIPS0, turnX(add(w, add(HIPS0, END), -1), LIE));
    const LEG_DOWN = Math.asin(clamp01((LIE_Y - 0.035) / 0.165)) / rad - (90 - LIE);
    type Weights = { hitB: number; sag: number; fly: number; land: number };
    const deathArm = (side: 1 | -1) => {
      const f = (v: V3): V3 => [v[0] * side, v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const chain = { root: f(SHOULDER), mid: f(ELBOW), end: f(HAND) };
      const shoulderW = toWorld(chain.root);
      const span = Math.sqrt(Math.max(0, 0.23 ** 2 - (shoulderW[1] - FIST_Y) ** 2));
      const out = norm([0.93 * side, 0, 0.37]);
      const fistEnd = toBody([shoulderW[0] + out[0] * span, FIST_Y, shoulderW[2] + out[2] * span]);
      return (w: Weights) => {
        const stand = add(add(add(chain.end, f([0.05, 0.05, 0.05]), w.hitB), [0, -0.03, 0.02], w.sag), f([0.08, 0.06, 0.03]), w.fly);
        const arm = reach(chain, lerp(stand, fistEnd, w.land), lerp(f([0.58, 0.6, -0.015]), f([0.6, 0.45, 0.1]), w.land));
        return {
          [`upperarm.${tag}`]: { rotate: arm.upper },
          [`forearm.${tag}`]: { rotate: arm.lower },
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
        const u = clamp01((p - 0.36) / 0.24); // the fall speeds up to the impact
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 4 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const settle = keys(p, [[0.56, 0], [0.8, 1]] as const);
        const flat = keys(p, [[0.4, 0], [0.62, 1]] as const);
        const crumple = keys(p, [[0.42, 0], [0.56, 1], [0.72, 1], [0.9, 0]] as const);
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
          neck: { rotate: [-6 * hitB + 5 * sag + BEND_NECK * land, 0, 0] },
          head: { rotate: [-10 * hitB + 8 * sag + BEND_HEAD * land, -8 * hitB + TURN * settle, 8 * wob] },
          cloak: {
            rotate: [10 * hitB - 8 * flat - 12 * crumple, 0, 5 * wob],
            scale: [1 + 0.12 * flat, 1 - 0.15 * crumple, 1 - 0.6 * flat],
          },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean + 10 * settle, 18 * settle, 0] },
          'foot.R': { rotate: [lean + 10 * settle, -18 * settle, 0] },
          ...deathL(w),
          ...deathR(w),
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a spinning cape swirl
    // He crouches and coils to his right, then spins one full turn to his left on the spot with a
    // small hop, both arms out wide at chest height; the cape lags and flares out with the spin.
    const spinArm = (side: 1 | -1) => {
      const m = (v: V3): V3 => [side === 1 ? -v[0] : v[0], v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const chain = { root: m(mx(SHOULDER)), mid: m(mx(ELBOW)), end: m(mx(WRIST)) };
      const rest = m([-0.58, 0.6, -0.015]);
      const coil = m([-0.62, 0.3, -0.14]);
      const wide = m([-0.55, 0.45, -0.05]);
      const out = m([-0.25, 0.355, 0.075]);
      const wristKeys: [number, V3][] = [
        [0, chain.end],
        [0.18, m([-0.21, 0.255, 0.005])],
        [0.24, m([-0.215, 0.26, 0])],
        [0.34, out],
        [0.64, out],
        [0.76, m([-0.21, 0.265, 0.025])],
        [1, chain.end],
      ];
      const poleKeys: [number, V3][] = [
        [0, rest],
        [0.18, coil],
        [0.24, coil],
        [0.34, wide],
        [0.64, wide],
        [0.76, coil],
        [1, rest],
      ];
      return (p: number) => {
        const a = reach(chain, keys(p, wristKeys), keys(p, poleKeys));
        return { [`upperarm.${tag}`]: { rotate: a.upper }, [`forearm.${tag}`]: { rotate: a.lower } };
      };
    };
    const spinR = spinArm(-1);
    const spinL = spinArm(1);
    k.animation('attack2', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const hipsY = keys(p, [[0, 0], [0.18, -20], [0.24, -20], [0.66, 360], [1, 360]] as const);
        const lead = keys(p, [[0, 0], [0.18, -22], [0.24, -22], [0.36, 22], [0.56, 16], [0.7, 0], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.18, 12], [0.28, 7], [0.45, 3], [0.68, 9], [0.78, 9], [1, 0]] as const);
        const legZ = keys(p, [[0, 0], [0.18, 13], [0.28, 9], [0.42, 3], [0.56, 3], [0.68, 13], [0.8, 13], [1, 0]] as const);
        const hop = 0.03 * keys(p, [[0.28, 0], [0.45, 1], [0.62, 0]] as const);
        const flare = keys(p, [[0.24, 0], [0.42, 1], [0.64, 1], [0.82, 0.15], [1, 0]] as const);
        const drop = LEG * (1 - Math.cos(legZ * rad));
        return {
          hips: { move: [0, hop - drop, 0], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 3, lead, 0] },
          head: { rotate: [-0.6 * lean, -0.6 * lead, 0] },
          cloak: { rotate: [0.4 * lean + 34 * flare, -12 * flare, 0], scale: [1 + 0.14 * flare, 1, 1 + 0.1 * flare] },
          'leg.L': { rotate: [0, 0, legZ] },
          'leg.R': { rotate: [0, 0, -legZ] },
          'foot.L': { rotate: [0, 0, -legZ] },
          'foot.R': { rotate: [0, 0, legZ] },
          ...spinR(p),
          ...spinL(p),
        };
      },
    });

    // ------------------------------------------------------------------ victory: a cape spread and a small hover
    // He spreads both arms wide and up, the cape flares open behind him, he leans back and laughs
    // (the head shakes a little), and he rises a few centimeters off the ground with the toes
    // pointed down. He holds the pose to the end.
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const c = keys(p, [[0, 0], [0.35, 1], [1, 1]] as const, 'spline');
        const rise = keys(p, [[0.15, 0], [0.55, 1], [1, 1]] as const, 'spline');
        const laugh = keys(p, [[0.35, 0], [0.45, 1], [0.9, 1], [1, 0.6]] as const);
        return {
          hips: { move: [0, 0.03 * rise, 0] },
          spine: { rotate: [-4 * c, 0, 0] },
          chest: { rotate: [-5 * c, 0, 0] },
          neck: { rotate: [-3 * c, 0, 0] },
          head: { rotate: [-9 * c + 3 * laugh * wave(p, 4), 0, 4 * laugh * wave(p, 3)] },
          cloak: { rotate: [20 * c + 3 * wave(p, 2), 0, 0], scale: [1 + 0.18 * c, 1, 1 + 0.12 * c] },
          'upperarm.L': { rotate: [-18 * c, 0, 68 * c] },
          'upperarm.R': { rotate: [-18 * c, 0, -68 * c] },
          'forearm.L': { rotate: [-28 * c, 0, 0] },
          'forearm.R': { rotate: [-28 * c, 0, 0] },
          'hand.L': { rotate: [-15 * c, 0, 0] },
          'hand.R': { rotate: [-15 * c, 0, 0] },
          'leg.L': { rotate: [-5 * rise, 0, 0] },
          'leg.R': { rotate: [8 * rise, 0, 0] },
          'foot.L': { rotate: [18 * rise, 0, 0] },
          'foot.R': { rotate: [22 * rise, 0, 0] },
        };
      },
    });
  },
});
