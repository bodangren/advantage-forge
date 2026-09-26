import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Orc warrior — Chibi Quest enemy (catalog `enemies/humanoid/orc-warrior`), about 1.05 m to the
 * top of its topknot, faces +Z. Target: docs/enemy-mockups/orc-warrior_001.jpg (made with mmx;
 * one front view).
 *
 * Role: a tough melee enemy, bigger than the goblins, seen in 3D and as a 128 px sprite; the
 *   tusks, the brow, and the spiked pauldron must read.
 * One idea: a stocky brute that is all shoulders and arms, with a heavy scowl, huge tusks, and a
 *   spiked iron pauldron, on short legs and big bare feet.
 * Proportions (from the mockup): topknot 1.05, hairline 0.84, eyes 0.68, tusk tips 0.66, beard
 *   point 0.46, shoulders 0.55, belt 0.33, loincloth hem 0.16, fists 0.24 at x 0.35.
 * Shape language: round and massive (shoulders, arms, fists, belly, head) with sharp accents for
 *   menace (tusks, pauldron spikes, axe, ear tips, torn loincloth).
 * Palette (60/30/10): green skin #7aa23e; brown leather #6e3f24 and fur #6a4a30; black hair and
 *   beard; red loincloth and hair band #b83a2e; iron #5a6068; yellow eyes #f2c230 as the accent.
 * Value plan: the yellow eyes under the black brows and the cream tusks are the strongest
 *   contrast (focal point); the dark pauldron and the red loincloth are the second masses.
 * Bodies: skin, hair (hair, beard, brows), tusks, iron (pauldron, buckle, axe head), spikes,
 *   leather (bracers, strap, belt), loincloth, fur, band, haft.
 * Rig: chibi humanoid with wide joints plus `knot` (the topknot tail); the axe is rigid on
 *   `hand.R`, the pauldron follows `upperarm.R`. Clips: idle, walk, run, attack (an overhead chop).
 */

const C = {
  skin: '#667f2c',
  skinDark: '#4c6220',
  eye: '#f2c230',
  pupil: '#141010',
  lid: '#2a3a18',
  mouth: '#2a1a14',
  hair: '#1e1a18',
  tusk: '#f1e6c8',
  iron: '#5a6068',
  ironLight: '#8a9098',
  leather: '#6e3f24',
  leatherDark: '#4a2a18',
  red: '#b83a2e',
  redDark: '#842a22',
  fur: '#6a4a30',
  furDark: '#4a3220',
  wood: '#7a4a2a',
  band: '#d03a30',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: wide shoulders, arms hanging out from the body, a wide stance.
const SHOULDER: V3 = [0.22, 0.52, 0];
const ELBOW: V3 = [0.31, 0.4, 0.02];
const WRIST: V3 = [0.345, 0.3, 0.05];
const HIP: V3 = [0.1, 0.25, 0];
const ANKLE: V3 = [0.155, 0.075, 0];
const HEAD_Y = 0.72;

/** A big fist hanging from the wrist `w`; `s` mirrors it for the right hand. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.022,
    sdf.ellipsoid([0.066, 0.068, 0.07]).at(...o(0.006, -0.06, 0.006)),
    sdf.capsule(o(-0.016, -0.092, 0.05), o(-0.01, -0.058, 0.07), 0.028), // curled fingers
    sdf.cone(o(0.036, -0.036, 0.042), o(0.004, -0.05, 0.08), 0.027, 0.021), // thumb
  );
};

export default defineAsset({
  name: 'orc-warrior',
  description: 'Chibi orc warrior enemy: huge shoulders, big tusks, a black topknot and beard, a spiked iron pauldron, leather bracers, and a hand axe.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/orc-warrior_001.jpg',

  build(k) {
    const KNOT: V3 = [0, 0.978, -0.04];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.26, 0] },
      spine: { parent: 'hips', at: [0, 0.34, 0] },
      chest: { parent: 'spine', at: [0, 0.44, 0] },
      neck: { parent: 'chest', at: [0, 0.54, -0.01] },
      head: { parent: 'neck', at: [0, 0.58, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [0.06, 0.97, -0.1] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      'leg.L': { parent: 'hips', at: HIP },
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head
    const head = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([0.19, 0.2, 0.18]).at(0, HEAD_Y, -0.01),
        sdf.ellipsoid([0.178, 0.09, 0.14]).at(0, 0.58, 0.05), // the wide underbite jaw
        pair(sdf.sphere(0.078).at(0.108, 0.645, 0.078)), // cheeks
        sdf.ellipsoid([0.16, 0.038, 0.065]).at(0, 0.748, 0.12), // a heavy brow shelf
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.046, 0.032, 0.032]).at(0, 0.655, faceZ(0, 0.655) - 0.008).bone('head');
    // Pointed ears, swept out and up.
    const ears = pair(
      sdf
        .cone([0.15, 0.7, -0.01], [0.245, 0.765, -0.045], 0.05, 0.008)
        .smoothSubtract(0.006, sdf.cone([0.16, 0.705, 0.012], [0.235, 0.76, -0.02], 0.028, 0.004))
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.5, -0.01], [0, 0.62, -0.01], 0.095).bone('neck');

    // ------------------------------------------------------------------ torso, arms, legs
    const trunk = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0).bone('chest'),
      sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02).bone('spine'),
      pair(sdf.sphere(0.1).at(0.155, 0.545, -0.02).bone('chest')), // traps
      pair(sdf.ellipsoid([0.088, 0.062, 0.05]).at(0.076, 0.48, 0.1).bone('chest')), // pecs
    );
    const armAt = (s: 1 | -1) => {
      const sh: V3 = s > 0 ? SHOULDER : mx(SHOULDER);
      const el: V3 = s > 0 ? ELBOW : mx(ELBOW);
      const wr: V3 = s > 0 ? WRIST : mx(WRIST);
      const side = s > 0 ? 'L' : 'R';
      return sdf.smoothUnion(
        0.03,
        sdf.cone(sh, el, 0.09, 0.075).bone(`upperarm.${side}`),
        sdf.ellipsoid([0.07, 0.08, 0.068]).at(...lerp(sh, el, 0.5)).bone(`upperarm.${side}`), // biceps
        sdf.cone(el, wr, 0.075, 0.068).bone(`forearm.${side}`),
        fistAt(wr, s).bone(`hand.${side}`),
      );
    };
    const legs = pair(sdf.capsule([HIP[0], 0.26, 0], [ANKLE[0], 0.1, 0.01], 0.078).bone('leg.L'));
    // Big bare feet with four round toes.
    const footLocal = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.078, 0.052, 0.11]).at(0, 0.045, 0.035),
        ...[-0.045, -0.015, 0.015, 0.045].map((x, i) => sdf.sphere(0.024 - i * 0.001).at(x, 0.03, 0.135 - Math.abs(x) * 0.3)),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const feet = pair(footLocal.rotateY(14).at(ANKLE[0], 0, 0).bone('foot.L'));

    // ------------------------------------------------------------------ face paint
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const EYE: V3 = [0.074, 0.69, 0];
    const eyeBall = pair(at(sdf.ellipsoid([0.044, 0.038, 0.07]), EYE[0], EYE[1]));
    const pupil = pair(at(sdf.ellipsoid([0.019, 0.023, 0.07]), EYE[0] - 0.008, EYE[1] - 0.004));
    // The upper lid cuts across each eye on a slant, low at the inner end: a scowl.
    const lidL = sdf
      .extrude(
        profile.polygon([
          [EYE[0] - 0.06, EYE[1] + 0.014],
          [EYE[0] + 0.06, EYE[1] + 0.04],
          [EYE[0] + 0.06, EYE[1] + 0.08],
          [EYE[0] - 0.06, EYE[1] + 0.08],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const lids = pair(lidL);
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.008), x - 0.002, EYE[1] + 0.004)),
    );
    const MOUTH_Y = 0.604;
    // A scowling upper lip over the underbite: a shallow downturned line.
    const mouth = sdf.extrude(profile.arc(0.24, 0.009, 72, 108), 0.4).at(0, MOUTH_Y - 0.24, 0.2);
    const nostrils = pair(sdf.sphere(0.009).at(0.02, 0.64, faceZ(0, 0.64) + 0.012));
    const skin = sdf
      .smoothUnion(0.04, head, neck)
      .smoothUnion(0.015, nose, ears)
      .smoothUnion(0.05, trunk)
      .union(armAt(1), armAt(-1))
      .smoothUnion(0.03, legs)
      .union(feet)
      .paintWhere(eyeBall, C.eye, 0.002)
      .paintWhere(pupil, C.pupil, 0.002)
      .paintWhere(shine, '#ffffff', 0.002)
      .paintWhere(lids.intersect(eyeBall.round(0.006)), C.lid, 0.002)
      .paintWhere(mouth, C.mouth, 0.003)
      .paintWhere(nostrils, C.mouth, 0.004)
      .paintWhere(pair(sdf.extrude(profile.rect([0.006, 0.08], 0.003), 0.4).rotateZ(-8).at(0.055, 0.35, 0.2)), C.skinDark, 0.01); // belly lines
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair, beard, brows (black)
    // Slicked-back hair: a cap over the skull behind a hairline that is high in front.
    const hairCap = sdf
      .ellipsoid([0.196, 0.206, 0.188])
      .at(0, HEAD_Y + 0.006, -0.014)
      .smoothIntersect(0.02, sdf.halfSpace([0, -0.94, 0.34], -0.735))
      .smoothSubtract(0.01, sdf.ellipsoid([0.2, 0.1, 0.2]).at(0, 0.66, 0.1));
    const bun = sdf.smoothUnion(
      0.02,
      sdf.sphere(0.052).at(KNOT[0], KNOT[1], KNOT[2]),
      sdf.cone([0, 0.915, -0.03], [KNOT[0], KNOT[1], KNOT[2]], 0.04, 0.036),
    );
    const tail = sdf.chain(
      [
        [KNOT[0] + 0.02, KNOT[1] + 0.02, KNOT[2] - 0.03, 0.03],
        [KNOT[0] + 0.06, KNOT[1] + 0.03, KNOT[2] - 0.07, 0.022],
        [KNOT[0] + 0.1, KNOT[1] + 0.0, KNOT[2] - 0.09, 0.01],
      ],
      0.01,
    );
    // A wide beard under the mouth that ends in a blunt point.
    const jawFront = faceZ(0, 0.55);
    const beard = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.1, 0.038, 0.045]).at(0, 0.535, jawFront - 0.035),
      sdf.cone([0, 0.525, jawFront - 0.035], [0, 0.45, jawFront - 0.015], 0.062, 0.018),
    );
    // Thick brows over the eyes; the inner ends dip toward the nose.
    const browAt = (x: number, y: number): V3 => [x, y, faceZ(Math.abs(x), y) - 0.006];
    const brows = pair(
      sdf.chain(
        [
          [...browAt(EYE[0] + 0.06, EYE[1] + 0.062), 0.017],
          [...browAt(EYE[0] + 0.008, EYE[1] + 0.046), 0.021],
          [...browAt(EYE[0] - 0.048, EYE[1] + 0.024), 0.018],
        ],
        0.008,
      ),
    );
    const hairGrooves = rgb('#3a3430');
    const hair = sdf
      .union(sdf.smoothUnion(0.015, hairCap, bun).bone('head'), tail.bone('knot'), beard.bone('head'), brows.bone('head'))
      // Combed-back strands: lines that fan out from the topknot when seen from above.
      .paintFn((x, y, z, base) => (y > 0.76 && Math.sin(Math.atan2(x, z - KNOT[2]) * 16) > 0.6 ? hairGrooves : base));
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.004 });
    // The red band that ties the topknot.
    k.body('band', sdf.torus(0.042, 0.012).at(0, 0.935, -0.033).bone('head'), { color: C.band, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ tusks
    const tusks = pair(
      sdf.chain(
        [
          [0.07, 0.57, jawFront - 0.02, 0.034],
          [0.088, 0.612, jawFront + 0.006, 0.031],
          [0.104, 0.652, jawFront + 0.006, 0.021],
          [0.106, 0.68, jawFront - 0.01, 0.008],
        ],
        0.01,
      ),
    );
    k.body('tusks', tusks.bone('head'), { color: C.tusk, roughness: 0.35 });

    // ------------------------------------------------------------------ leather: bracers, chest strap, belt
    const bracer = (e: V3, w: V3) =>
      sdf
        .cone(lerp(e, w, 0.12), lerp(e, w, 1.0), 0.088, 0.094)
        .round(0.004)
        .paintWhere(sdf.box([0.3, 0.012, 0.3]).at(...lerp(e, w, 0.55)), C.leatherDark, 0.004);
    const bracers = sdf.union(bracer(ELBOW, WRIST).bone('forearm.L'), bracer(mx(ELBOW), mx(WRIST)).bone('forearm.R'));
    const trunkShape = sdf.smoothUnion(0.06, sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0), sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02));
    // The strap runs from the right shoulder, under the pauldron, down to the left hip.
    const strap = trunkShape.round(0.012).smoothIntersect(0.006, sdf.box([0.8, 0.05, 0.8], 0.006).rotateZ(-32).at(0, 0.44, 0));
    const beltY = 0.33;
    const belt = trunkShape.round(0.016).smoothIntersect(0.006, sdf.box([0.6, 0.06, 0.6], 0.008).at(0, beltY, 0));
    k.body('leather', sdf.union(bracers, strap.bone('chest'), belt.bone('spine')), { color: C.leather, roughness: 0.6 });

    // ------------------------------------------------------------------ iron: pauldron, buckle, strap rivets, axe head
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.12 * s, 0.075 * s, 0.11 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.004);
    const pauldronPose = (s: sdf.Shape) => s.scale(1.18).rotateZ(28).at(-0.25, 0.575, -0.005);
    const pauldronLocal = sdf.union(lame(1), lame(1.12).at(0, -0.04, 0));
    const pauldron = pauldronPose(pauldronLocal);
    // Spikes on the upper lame, in its local frame: rooted on the dome, along the dome's normal.
    const [RA, RB, RC] = [0.12, 0.075, 0.11];
    const spikesLocal = sdf.union(
      ...[
        [-0.055, 0.0],
        [0.0, 0.0],
        [0.055, 0.0],
        [-0.03, -0.05],
        [0.03, -0.05],
      ].map(([x, z]) => {
        const y = RB * Math.sqrt(Math.max(0, 1 - (x! / RA) ** 2 - (z! / RC) ** 2));
        const nx = x! / RA ** 2;
        const ny = y / RB ** 2;
        const nz = z! / RC ** 2;
        const l = Math.hypot(nx, ny, nz);
        const d: V3 = [nx / l, ny / l, nz / l];
        return sdf.cone([x! - d[0] * 0.01, y - d[1] * 0.01, z! - d[2] * 0.01], [x! + d[0] * 0.075, y + d[1] * 0.075, z! + d[2] * 0.075], 0.021, 0.003);
      }),
    );
    const spikes = pauldronPose(spikesLocal);
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.cylinder(0.05, 0.016, 0.006).rotateX(90),
        sdf.sphere(0.022).scale([1, 1, 0.6]).at(0, 0, 0.01),
        ...[0, 90, 180, 270].map((a) => sdf.sphere(0.008).at(0.035 * Math.cos((a * Math.PI) / 180 + 0.785), 0.035 * Math.sin((a * Math.PI) / 180 + 0.785), 0.009)),
      )
      .at(0, beltY, beltZ + 0.006);
    const strapRivets = sdf.union(
      ...[0.2, 0.45, 0.7].map((t) => {
        const p = sdf.surfacePoint(strap, [-0.16 + t * 0.32, 0.54 - t * 0.2, 0.3], 0.002);
        return sdf.sphere(0.009).at(...p);
      }),
    );

    // The axe: local frame with the grip at the origin, the haft down (-Y), the blade out to -X.
    const axeHead = sdf
      .extrude(
        profile.polygon(
          [
            [0.012, -0.15],
            [-0.05, -0.13],
            [-0.11, -0.1],
            [-0.14, -0.17],
            [-0.12, -0.26],
            [-0.05, -0.25],
            [0.012, -0.235],
          ],
          { smooth: true, samples: 4 },
        ),
        0.024,
        0.007,
      )
      .union(sdf.cone([0.01, -0.192, 0], [0.075, -0.19, 0], 0.02, 0.004)) // back spike
      .paintWhere(sdf.cylinder(0.1, 0.4).rotateX(90).at(-0.02, -0.19, 0).subtract(sdf.cylinder(0.088, 0.5).rotateX(90).at(-0.02, -0.19, 0)), C.ironLight, 0.004);
    const GRIP: V3 = [-WRIST[0] - 0.006, WRIST[1] - 0.064, WRIST[2] + 0.02];
    const axePose = (s: sdf.Shape) => s.scale(1.14).rotateZ(-12).rotateX(-40).at(...GRIP);
    k.body(
      'iron',
      sdf.union(pauldron.bone('upperarm.R'), buckle.bone('spine'), strapRivets.bone('chest'), axePose(axeHead).bone('hand.R')),
      { color: C.iron, roughness: 0.5, metalness: 0.75, bump: (x, y, z) => 0.0008 * noise.fbm(x * 60, y * 60, z * 60, 2) },
    );
    k.body('spikes', spikes.bone('upperarm.R'), { color: C.iron, roughness: 0.4, metalness: 0.8, detail: 0.004 });
    k.body('haft', axePose(sdf.cylinder(0.019, 0.3, 0.006).at(0, -0.09, 0)).bone('hand.R'), {
      color: C.wood,
      roughness: 0.75,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 30, y * 200, z * 30, 2),
    });

    // ------------------------------------------------------------------ loincloth and fur shin wraps
    const flap = (front: boolean) =>
      sdf
        .extrude(
          profile.polygon([
            [0.004, 0.33],
            [0.1, 0.33],
            [0.11, 0.17],
            [0.085, 0.19],
            [0.06, 0.15],
            [0.035, 0.185],
            [0.004, 0.16],
          ]),
          0.018,
          0.006,
        )
        .rotateX(front ? -10 : 10)
        .at(0, 0, front ? 0.15 : -0.14);
    const loincloth = pair(sdf.union(flap(true), flap(false)).bone('leg.L')).paintWhere(sdf.halfSpace([0, 1, 0], 0.2), C.redDark, 0.02);
    k.body('loincloth', loincloth, { color: C.red, roughness: 0.85 });
    const furWrap = pair(
      sdf
        .cylinder(0.092, 0.07, 0.03)
        .at(ANKLE[0] - 0.004, 0.13, 0.008)
        .displace(0.008, (x, y, z) => noise.fbm(x * 60, y * 25, z * 60, 2))
        .bone('leg.L'),
    );
    k.body('fur', furWrap.paintFn((x, y, z, base) => (noise.fbm(x * 90, y * 40, z * 90, 2) > 0.2 ? rgb(C.furDark) : base)), {
      color: C.fur,
      roughness: 0.95,
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0] },
        chest: { rotate: [3 * wave(p), 0, 0], scale: [1 + 0.015 * bump(p), 1, 1 + 0.015 * bump(p)] },
        neck: { rotate: [-2 * wave(p), 0, 0] },
        head: { rotate: [0, 6 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        knot: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 4 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -4 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    // A heavy, rolling walk: the weight shifts from side to side at each step.
    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number, sway: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        return {
          hips: {
            move: [0, -legDrop(LEG, legSwing * s) + hop * bump(p, 2, 0.25), 0] as const,
            rotate: [0, 6 * s, sway * s] as const,
          },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          knot: { rotate: [lean + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 4] as const },
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -4] as const },
          'forearm.L': { rotate: [-armSwing * 0.4 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(1.0, 22, 20, 4, 0, 4));
    k.animation('run', stride(0.6, 34, 36, 12, 0.025, 3));

    // An overhead chop with the axe: wind up high behind the shoulder, chop down and forward.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0, 0.38, p) * (1 - ease(0.38, 0.5, p));
        const hit = ease(0.38, 0.5, p) * (1 - ease(0.64, 1, p));
        return {
          hips: { move: [0, -legDrop(LEG, 14 * hit) - 0.008 * wind, 0.035 * hit - 0.012 * wind], rotate: [0, -12 * wind + 12 * hit, 0] },
          spine: { rotate: [-8 * wind + 14 * hit, 0, 0] },
          chest: { rotate: [0, -18 * wind + 18 * hit, 0] },
          head: { rotate: [-6 * wind + 8 * hit, 10 * wind - 10 * hit, 0] },
          knot: { rotate: [-10 * wind + 16 * hit, 0, 0] },
          'upperarm.R': { rotate: [-150 * wind + 10 * hit, 0, -10 * wind + 6 * hit] },
          'forearm.R': { rotate: [-35 * wind - 10 * hit, 0, 0] },
          'hand.R': { rotate: [-30 * wind + 40 * hit, 0, 0] },
          'upperarm.L': { rotate: [-12 * wind + 20 * hit, 0, 10 * hit] },
          'leg.R': { rotate: [-16 * hit, 0, 0] },
          'leg.L': { rotate: [12 * hit, 0, 0] },
          'foot.R': { rotate: [10 * hit, 0, 0] },
          'foot.L': { rotate: [-6 * hit, 0, 0] },
        };
      },
    });
  },
});
