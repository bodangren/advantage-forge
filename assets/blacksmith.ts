import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Blacksmith — Chibi Quest settlement NPC (catalog `npcs/settlement/blacksmith`), about 0.98 m
 * tall, faces +Z. Target: docs/npc-mockups/blacksmith_001.jpg (made with mmx; one front view).
 * Built on the rogue's head and skeleton with a much heavier upper body.
 *
 * Role: a town NPC (the smithy), seen in 3D and as a 128 px sprite; the beard, apron, and hammer
 *   must read.
 * One idea: a burly, grinning smith with a big black beard and a red bandana, all chest and
 *   forearms, in a long leather apron, his hammer resting on his shoulder.
 * Proportions: the rogue's head (center 0.675, eyes 0.635); shoulders 0.42 and 0.3 wide; belt
 *   0.27; the apron point at 0.08; boot tops 0.12; the hammer head behind the right shoulder.
 * Shape language: square and heavy (torso, apron, gloves, hammer head, boots), softened by the
 *   round beard, nose, and cheeks.
 * Palette (60/30/10): brown leather #7a4430 (apron, gloves, boots); grey shirt #6e7176 and dark
 *   trousers #4a4a4e; black beard #221c1a; a red bandana #c23a32 as the accent; brass #d0a040.
 * Value plan: the light face between the red bandana and the black beard is the focal point;
 *   the big brown apron is the dominant mass.
 * Bodies: skin, hair (hair, brows, beard, mustache), bandana, shirt, apron, leather (straps,
 *   belt), gloves, brass, trousers, boots, hammer-head, hammer-haft.
 * Rig: the rogue's skeleton plus `knot` (bandana tails); the hammer is rigid on `hand.R`.
 *   Clips: idle, walk, run, work (a hammering loop).
 */

const C = {
  skin: '#f0bf9c',
  blush: '#ec8f7c',
  eyeWhite: '#f6f1ea',
  irisRim: '#1e120a',
  iris: '#4a2a18',
  irisLow: '#7a4a24',
  pupil: '#110d0b',
  lid: '#1c130f',
  mouth: '#5a1e1a',
  teeth: '#fbf6ee',
  soot: '#5a5250',
  hair: '#221c1a',
  red: '#c23a32',
  redDark: '#8e2a24',
  shirt: '#6e7176',
  shirtDark: '#55585c',
  apron: '#7a4430',
  apronDark: '#5a3020',
  leather: '#6a3a26',
  glove: '#6e3e28',
  gloveDark: '#4e2a1a',
  brass: '#d0a040',
  trousers: '#4a4a4e',
  boot: '#6a3e26',
  sole: '#2e2420',
  iron: '#5a5e66',
  wood: '#8a5a36',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.1, 0.635] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Joints. Broad shoulders. The right forearm comes up in front to hold the hammer on the
// shoulder; the left arm hangs with the fist by the hip.
const SHOULDER: V3 = [0.17, 0.4, 0];
const ELBOW_R: V3 = [-0.27, 0.3, 0.03];
const WRIST_R: V3 = [-0.225, 0.375, 0.11];
const ELBOW_L: V3 = [0.265, 0.31, 0.0];
const WRIST_L: V3 = [0.27, 0.225, 0.05];
const HIP: V3 = [0.08, 0.195, 0];
const ANKLE: V3 = [0.11, 0.07, 0];

// The hammer: the grip in the right fist, the haft up and back over the shoulder.
const GRIP: V3 = add(WRIST_R, norm([WRIST_R[0] - ELBOW_R[0], WRIST_R[1] - ELBOW_R[1], WRIST_R[2] - ELBOW_R[2]]), 0.045);
const HAFT_DIR = norm([-0.1, 0.13, -0.2]);
const HAMMER_Z = (Math.asin(-HAFT_DIR[0]) * 180) / Math.PI;
const HAMMER_X = (Math.atan2(HAFT_DIR[2], HAFT_DIR[1]) * 180) / Math.PI;
const hammerPose = (s: sdf.Shape) => s.rotateZ(HAMMER_Z).rotateX(HAMMER_X).at(...GRIP);

/** A big leather mitt: a round glove with a finger roll, centered on the point `c`. */
const mitt = (c: V3, s: 1 | -1) =>
  sdf.smoothUnion(
    0.02,
    sdf.ellipsoid([0.058, 0.06, 0.058]).at(...c),
    sdf.capsule([c[0] - 0.02 * s, c[1] - 0.03, c[2] + 0.035], [c[0] + 0.012 * s, c[1] - 0.03, c[2] + 0.04], 0.028),
    sdf.cone([c[0] + 0.04 * s, c[1] + 0.012, c[2] + 0.02], [c[0] + 0.02 * s, c[1] + 0.006, c[2] + 0.06], 0.024, 0.02), // thumb
  );

export default defineAsset({
  name: 'blacksmith',
  description: 'Chibi blacksmith NPC: a burly smith with a black beard, a red bandana, a long leather apron, big gloves, and a hammer on his shoulder.',
  detail: 0.005,
  reference: 'docs/npc-mockups/blacksmith_001.jpg',

  build(k) {
    const KNOT: V3 = [0, 0.74, -0.2];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [0.02, 0.64, -0.24] },
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

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.12, 0.06, 0.09]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    // A big round nose.
    const nose = sdf.ellipsoid([0.042, 0.036, 0.034]).at(0, 0.588, faceZ(0, 0.588) + 0.008).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.048, 0.034])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.615, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.064).bone('neck');
    // Thick arms: bare, muscular upper arms; the forearms go into the gloves.
    const armR = sdf.smoothUnion(
      0.025,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.064, 0.054).bone('upperarm.R'),
      sdf.ellipsoid([0.058, 0.07, 0.056]).at(...lerp(mx(SHOULDER), ELBOW_R, 0.5)).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.054, 0.046).bone('forearm.R'),
    );
    const armL = sdf.smoothUnion(
      0.025,
      sdf.cone(SHOULDER, ELBOW_L, 0.064, 0.054).bone('upperarm.L'),
      sdf.ellipsoid([0.058, 0.07, 0.056]).at(...lerp(SHOULDER, ELBOW_L, 0.5)).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.054, 0.046).bone('forearm.L'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.042, 0.046, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.035, 0.041, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.03, 0.036, 0.07]), EYE[0], EYE[1] - 0.005));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.018));
    const pupil = pair(at(sdf.ellipsoid([0.022, 0.025, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.042, 0.011, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.01), x + 0.013, EYE[1] + 0.016), at(sdf.sphere(0.005), x - 0.012, EYE[1] - 0.018)]),
    );
    // The grin: a dark mouth with a row of upper teeth, framed by the mustache and the beard.
    const MOUTH_Y = 0.535;
    const mouthShape = sdf
      .extrude(
        profile.polygon(
          [
            [-0.056, 0.0],
            [0.056, 0.0],
            [0.044, -0.022],
            [0, -0.032],
            [-0.044, -0.022],
          ],
          { smooth: true, samples: 4 },
        ),
        0.3,
      )
      .at(0, MOUTH_Y + 0.008, 0.1);
    const teeth = mouthShape.round(-0.004).intersect(sdf.halfSpace([0, -1, 0], -(MOUTH_Y - 0.004)));
    // Soot: a few smudges on the left cheek and the brow.
    const soot = sdf.union(sdf.sphere(0.022).at(0.14, 0.6, faceZ(0.14, 0.6)), sdf.sphere(0.014).at(-0.06, 0.72, faceZ(0.06, 0.72)));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.014, nose, ears)
      .union(armR, armL)
      .paintWhere(pair(at(sdf.sphere(0.03), 0.14, 0.585)), C.blush, 0.028)
      .paintWhere(soot, C.soot, 0.018)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.01)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(mouthShape, C.mouth)
      .paintWhere(teeth, C.teeth)
      .paintWhere(sdf.sphere(0.03).at(0, 0.588, faceZ(0, 0.588) + 0.04), '#f09c88', 0.02); // a rosy nose tip
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ bandana with a knot at the back
    const BAND_Y = 0.785;
    const skull = sdf.ellipsoid([HEAD[0], HEAD[1], HEAD[2]]).at(0, HEAD_Y, 0);
    const band = skull
      .round(0.026)
      .subtract(skull.round(0.004))
      .smoothIntersect(0.008, sdf.box([0.6, 0.095, 0.6], 0.012).rotateX(-10).at(0, BAND_Y, 0));
    const knotShape = sdf.ellipsoid([0.036, 0.03, 0.026]).at(...KNOT);
    const tail = (dx: number, dy: number) =>
      sdf.chain(
        [
          [KNOT[0], KNOT[1], KNOT[2], 0.02],
          [KNOT[0] + dx * 0.5, KNOT[1] + dy * 0.5, KNOT[2] - 0.03, 0.022],
          [KNOT[0] + dx, KNOT[1] + dy, KNOT[2] - 0.04, 0.01],
        ],
        0.008,
      );
    const bandana = sdf
      .smoothUnion(0.01, band.bone('head'), knotShape.bone('head'), sdf.union(tail(-0.05, -0.08), tail(0.05, -0.07)).bone('knot'))
      .paintWhere(sdf.halfSpace([0, -1, 0], -(BAND_Y + 0.035)), C.redDark, 0.012); // a darker upper fold
    k.body('bandana', bandana, { color: C.red, roughness: 0.85 });

    // ------------------------------------------------------------------ hair, brows, beard
    // Short hair: a cap at the sides and the back under the bandana, and a crop of ridges on top.
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.014, HEAD[1] + 0.016, HEAD[2] + 0.014])
      .at(0, HEAD_Y + 0.008, -0.012)
      .smoothSubtract(0.02, sdf.ellipsoid([0.25, 0.2, 0.2]).at(0, 0.6, 0.19))
      .smoothSubtract(0.01, pair(sdf.sphere(0.05).at(0.21, 0.61, -0.005)));
    // Close-cropped hair on top, in ridges running front to back.
    const crop = (x: number, y: number, _z: number) => (y > 0.8 ? Math.abs(Math.sin(x * 70)) : 0);
    const brow = (s: 1 | -1) => {
      const pt = (x: number, y: number, lift: number): V3 => [s * x, y, faceZ(x, y) + lift];
      const a = pt(0.045, 0.705, 0.004);
      const m = pt(0.1, 0.716, 0.008);
      const b = pt(0.15, 0.702, 0.002);
      return sdf.chain(
        [
          [a[0], a[1], a[2], 0.017],
          [m[0], m[1], m[2], 0.02],
          [b[0], b[1], b[2], 0.012],
        ],
        0.01,
      );
    };
    // A full beard from the sideburns down over the chest, open at the mouth; a thick mustache.
    const mouthZ = faceZ(0, MOUTH_Y);
    const beardMass = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([0.16, 0.09, 0.1]).at(0, 0.51, 0.07),
        sdf.ellipsoid([0.1, 0.06, 0.07]).at(0, 0.465, 0.12),
        pair(sdf.capsule([0.19, 0.66, 0.0], [0.165, 0.52, 0.06], 0.045)),
      )
      .smoothSubtract(0.03, sdf.ellipsoid([0.16, 0.075, 0.2]).at(0, 0.625, 0.12)) // keep the cheeks and eyes clear
      .smoothSubtract(0.012, sdf.ellipsoid([0.062, 0.03, 0.1]).at(0, MOUTH_Y - 0.004, mouthZ + 0.06)); // the mouth
    const mustache = pair(
      sdf.chain(
        [
          [0.0, 0.558, mouthZ + 0.03, 0.024],
          [0.05, 0.555, mouthZ + 0.022, 0.028],
          [0.095, 0.54, mouthZ + 0.002, 0.022],
          [0.115, 0.515, mouthZ - 0.014, 0.012],
        ],
        0.015,
      ),
    );
    const strands = (x: number, y: number, z: number) => Math.sin(x * 70 + Math.sin(y * 20) * 2) * 0.5 + Math.sin(Math.atan2(z, x) * 40) * 0.5;
    const beard = sdf.smoothUnion(0.02, beardMass, mustache).displace(0.003, strands);
    const hair = sdf.smoothUnion(0.015, cap.displace(0.005, crop), brow(1), brow(-1), beard).smoothSubtract(0.004, band.round(0.002));
    k.body('hair', hair.bone('head'), { color: C.hair, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ shirt: a wide barrel torso, short sleeves
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.48],
            [0.08, 0.475],
            [0.12, 0.45],
            [0.14, 0.41],
            [0.146, 0.35],
            [0.14, 0.3],
            [0.142, 0.25],
            [0.146, 0.2],
            [0.148, 0.17],
            [0.14, 0.158],
            [0, 0.158],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1.28, 1, 0.9]);
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(
          0.01,
          sdf.cone([s[0] * 0.8, 0.43, 0], lerp(s, e, 0.52), 0.08, 0.072),
          sdf.cone(lerp(s, e, 0.42), lerp(s, e, 0.58), 0.076, 0.076).round(0.004).paint(C.shirtDark), // hem roll
        )
        .bone(tag);
    k.body('shirt', sdf.union(torso.bone('spine'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')), {
      color: C.shirt,
      roughness: 0.85,
    });

    // ------------------------------------------------------------------ the leather apron
    // Around the torso, then on down past the hem in a gentle flare, cut to a bib with a V point.
    const apronBase = torso.smoothUnion(0.05, sdf.cone([0, 0.24, 0], [0, 0.08, 0.02], 0.15, 0.17).scale([1.25, 1, 0.9]));
    const apronOutline = profile.polygon(
      [
        [-0.125, 0.44],
        [0.125, 0.44],
        [0.13, 0.36],
        [0.165, 0.25],
        [0.155, 0.15],
        [0, 0.07],
        [-0.155, 0.15],
        [-0.165, 0.25],
        [-0.13, 0.36],
      ],
      { smooth: false },
    );
    const apron = apronBase
      .round(0.014)
      .subtract(apronBase.round(0.002))
      .smoothIntersect(0.005, sdf.extrude(apronOutline, 0.6, 0.012).at(0, 0, 0.3))
      .intersect(sdf.halfSpace([0, 0, -1], -0.02))
      .paintWhere(sdf.extrude(profile.offsetProfile(apronOutline, -0.012), 1).at(0, 0, 0.3).subtract(sdf.extrude(profile.offsetProfile(apronOutline, -0.02), 1.1).at(0, 0, 0.3)), C.apronDark, 0.002); // stitched edge
    k.body('apron', apron.bone('spine'), { color: C.apron, roughness: 0.6 });

    // ------------------------------------------------------------------ leather: straps, belt, a tool loop
    const strapShell = torso.round(0.017).subtract(torso.round(0.004));
    const strapCols = sdf.union(sdf.box([0.038, 1, 1], 0.006).at(0.112, 0, 0), sdf.box([0.038, 1, 1], 0.006).at(-0.112, 0, 0));
    const straps = strapShell
      .smoothIntersect(0.004, strapCols)
      .intersect(sdf.union(sdf.halfSpace([0, -1, 0], -0.425), sdf.halfSpace([0, 0, 1], -0.02).intersect(sdf.halfSpace([0, -1, 0], -0.28))));
    const beltY = 0.27;
    const belt = apronBase.round(0.022).smoothIntersect(0.006, sdf.box([0.8, 0.045, 0.8], 0.006).at(0, beltY, 0));
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    // A short leather loop hangs off the belt on the right hip.
    const loopAt = sdf.surfacePoint(belt, [-0.14, beltY, 0.18], 0);
    const loop = sdf.box([0.028, 0.08, 0.012], 0.006).rotateY(-40).at(loopAt[0] - 0.004, loopAt[1] - 0.04, loopAt[2] + 0.004);
    k.body('leather', sdf.union(straps.bone('chest'), belt.bone('spine'), loop.bone('spine')), { color: C.leather, roughness: 0.6 });

    // ------------------------------------------------------------------ gloves: big flared cuffs and mitts
    const glove = (e: V3, w: V3, fistC: V3, s: 1 | -1, side: 'L' | 'R') =>
      sdf
        .smoothUnion(
          0.015,
          sdf.cone(lerp(e, w, 0.2), lerp(e, w, 0.95), 0.074, 0.058).round(0.004).bone(`forearm.${side}`),
          mitt(fistC, s).bone(`hand.${side}`),
        )
        .paintWhere(sdf.sphere(0.07).at(...lerp(e, w, 0.2)).subtract(sdf.sphere(0.052).at(...lerp(e, w, 0.2))), C.gloveDark, 0.004);
    const fistL: V3 = [WRIST_L[0] + 0.004, WRIST_L[1] - 0.05, WRIST_L[2] + 0.006];
    const gloves = sdf.union(glove(ELBOW_L, WRIST_L, fistL, 1, 'L'), glove(ELBOW_R, WRIST_R, GRIP, -1, 'R'));
    k.body('gloves', gloves, { color: C.glove, roughness: 0.65 });

    // ------------------------------------------------------------------ brass: buckle and strap rings
    const buckle = sdf
      .union(sdf.box([0.064, 0.056, 0.014], 0.007).subtract(sdf.box([0.034, 0.028, 0.03], 0.005)), sdf.box([0.008, 0.032, 0.01], 0.003).at(0.002, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    const rings = hard(
      (() => {
        const p = sdf.surfacePoint(apron, [0.112, 0.418, 0.3], 0.004);
        return sdf.torus(0.016, 0.0055).rotateX(90).at(...p);
      })(),
    );
    k.body('brass', sdf.union(buckle.bone('spine'), rings.bone('chest')), { color: C.brass, roughness: 0.35, metalness: 0.85 });

    // ------------------------------------------------------------------ trousers and big boots
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.13, 0.055, 0.095]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [ANKLE[0], 0.11, 0.004], 0.058).bone('leg.L')),
    );
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(0.04, sdf.cylinder(0.066, 0.12, 0.02).at(0, 0.07, -0.005), sdf.ellipsoid([0.075, 0.062, 0.12]).at(0, 0.055, 0.04))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = bootFoot
      .union(bootFoot.round(0.006).intersect(sdf.halfSpace([0, 1, 0], 0.02)).intersect(sdf.halfSpace([0, -1, 0], 0)).paint(C.sole))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the hammer on the right shoulder
    // Local frame: the grip at the origin, the haft along +Y, the head's long axis along Z.
    const HEAD_AT = 0.3;
    const hammerHead = sdf
      .box([0.1, 0.1, 0.19], 0.02)
      .at(0, HEAD_AT, 0)
      .paintWhere(sdf.union(sdf.halfSpace([0, 0, -1], -0.085), sdf.halfSpace([0, 0, 1], -0.085)), '#7a7f88', 0.004); // bright striking faces
    k.body('hammer-head', hammerPose(hammerHead), {
      color: C.iron,
      roughness: 0.45,
      metalness: 0.8,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });
    k.body('hammer-haft', hammerPose(sdf.capsule([0, -0.09, 0], [0, HEAD_AT, 0], 0.018)), {
      color: C.wood,
      roughness: 0.75,
      detail: 0.004,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 30, y * 200, z * 30, 2),
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0] },
        chest: { rotate: [3 * wave(p), 0, 0], scale: [1 + 0.012 * bump(p), 1, 1 + 0.012 * bump(p)] },
        neck: { rotate: [-2 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        knot: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, -1.5 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    // A heavy walk: the weight shifts from side to side; the hammer arm stays on the shoulder.
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
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          knot: { rotate: [lean * 1.5 + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 4] as const },
          'upperarm.R': { rotate: [-armSwing * 0.15 * s, 0, 0] as const },
          'forearm.L': { rotate: [-armSwing * 0.4 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(1.0, 22, 20, 3, 0, 4));
    k.animation('run', stride(0.62, 34, 34, 10, 0.02, 3));

    // Work: lift the hammer off the shoulder, bring it down in front onto an unseen anvil, bounce.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    // Solved by targets (reach, orient) in the chest's rest frame, so the path stays clear of the
    // head: the hammer rises off the shoulder up and out beside the head on the right side, comes
    // forward, and lands on the anvil spot with the fist held out in front, the haft butt clear of
    // the belt. The head's long axis turns to point down at the blow, a striking face on the anvil.
    const { keys, reach, orient } = motion;
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const HAMMER_LONG: V3 = [0, -Math.sin((HAMMER_X * Math.PI) / 180), Math.cos((HAMMER_X * Math.PI) / 180)];
    const workWrist = [
      [0, WRIST_R],
      [0.18, [-0.27, 0.45, 0.11]],
      [0.38, [-0.31, 0.5, 0.08]], // the top: out beside the head
      [0.45, [-0.315, 0.505, 0.075]],
      [0.52, [-0.29, 0.45, 0.19]],
      [0.58, [-0.245, 0.41, 0.22]], // the blow, the fist out in front
      [0.63, [-0.245, 0.43, 0.22]], // the bounce
      [0.68, [-0.245, 0.41, 0.22]],
      [0.84, [-0.29, 0.47, 0.12]], // back up beside the head
      [1, WRIST_R],
    ] as const;
    const workHaft = [
      [0, HAFT_DIR],
      [0.18, norm([-0.45, 0.75, -0.48])],
      [0.38, norm([-0.42, 0.85, -0.3])],
      [0.45, norm([-0.42, 0.86, -0.28])],
      [0.52, norm([-0.4, 0.35, 0.85])],
      [0.58, norm([-0.38, -0.42, 0.82])],
      [0.63, norm([-0.38, -0.32, 0.87])],
      [0.68, norm([-0.38, -0.42, 0.82])],
      [0.84, norm([-0.45, 0.85, 0.1])],
      [1, HAFT_DIR],
    ] as const;
    const workLong = [
      [0, HAMMER_LONG],
      [0.38, [0.1, 0.1, 1]],
      [0.52, [0, -1, 0.4]],
      [0.58, [0, -1, 0]],
      [0.68, [0, -1, 0]],
      [0.84, [0, -0.1, 1]],
      [1, HAMMER_LONG],
    ] as const;
    k.animation('work', {
      duration: 0.9,
      pose: (_t, p) => {
        const lift = ease(0, 0.45, p) * (1 - ease(0.45, 0.58, p));
        const hit = ease(0.45, 0.58, p) * (1 - ease(0.68, 1, p));
        const arm = reach(ARM_R, keys(p, workWrist, 'spline'), [-0.6, 0.1, -0.1]);
        const hand = orient([arm.upper, arm.lower], { dir: HAFT_DIR, up: HAMMER_LONG }, { dir: norm(keys(p, workHaft, 'spline')), up: keys(p, workLong) });
        return {
          hips: { move: [0, -0.006 * hit, 0] },
          spine: { rotate: [-4 * lift + 8 * hit, 0, 0] },
          chest: { rotate: [0, 8 * lift - 4 * hit, 0] },
          head: { rotate: [6 * hit, 0, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: [-10 * hit, 0, 6 * hit] },
          'forearm.L': { rotate: [-30 * hit, 0, 0] },
        };
      },
    });
  },
});
