import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Adventurer — Chibi Quest hero (catalog `heroes/support/adventurer`), about 0.98 m to the top of
 * his hair, faces +Z. Target: docs/hero-mockups/adventurer_001.jpg (made with mmx from a written
 * brief; one front view). Built on the rogue's head and skeleton, so the heroes read as one set.
 *
 * Role: player hero (the starter), seen in 3D and as a 128 px sprite; the pack and the grin read.
 * One idea: a beaming boy under a huge travel pack — bedroll on top, lantern at the side — with
 *   a map in hand and a short sword at his hip, ready to go anywhere.
 * Proportions: hair tufts 0.98, bandana 0.76, eyes 0.63, chin 0.48, shoulders 0.385, belt 0.25,
 *   shirt tail 0.2, trouser cuffs 0.1. The pack rises to 0.62 behind the head, bedroll to 0.7.
 * Shape language: round and soft (face, pack, bedroll, shoes), with spiky hair tufts and a sword.
 * Palette (60/30/10): cream shirt #efe2c4 and brown leather #7a4a2c; grey-green trousers #6e7560;
 *   teal bandana and bedroll #4f9c8a as the accent pair, a red neckerchief #c8413a at the focal
 *   point under the face. Skin #f2c7a4, hair #6b3f24.
 * Value plan: the dark hair and the teal bandana frame the light face (focal point); the red
 *   neckerchief is the strongest color accent; the dark pack is the biggest mass behind him.
 * Bodies: skin, hair, bandana, scarf, shirt, trousers, leather, steel, pack, pack-flap, bedroll, lantern-frame,
 *   lantern-light, rope, map, shoes, sword.
 * Rig: the rogue's chibi skeleton plus `knot` (bandana tails) and `lantern`; the map is rigid on
 *   the right hand, the pack on the chest, the sword on the hips. Clips: idle, walk, run.
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
  hair: '#6b3f24',
  hairDark: '#4e2c18',
  teal: '#4f9c8a',
  tealDark: '#3a7a6a',
  red: '#c8413a',
  shirt: '#efe2c4',
  shirtShade: '#d8c8a4',
  trousers: '#6e7560',
  cuff: '#8a917a',
  leather: '#7a4a2c',
  leatherDark: '#503020',
  pack: '#7c4a2a',
  flap: '#9a6a3a',
  steel: '#b8bec6',
  brass: '#b8893a',
  glow: '#ffcc55',
  rope: '#cdb07a',
  map: '#efe0b8',
  mapInk: '#8a6a3a',
  shoe: '#7a4428',
  sole: '#42281a',
  scabbard: '#5a3a24',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints: the right hand hangs a little forward with the map, the left hangs relaxed.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW_R: V3 = [-0.18, 0.332, 0.02];
const WRIST_R: V3 = [-0.2, 0.24, 0.06];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

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
const GRIP_R: V3 = [WRIST_R[0] - 0.007, WRIST_R[1] - 0.04, WRIST_R[2] + 0.004];

export default defineAsset({
  name: 'adventurer',
  description: 'Chibi adventurer hero with a teal bandana, a huge travel pack with a bedroll and lantern, a map, and a short sword.',
  detail: 0.005,
  reference: 'docs/hero-mockups/adventurer_001.jpg',

  build(k) {
    const KNOT: V3 = [0.02, 0.77, -0.19];
    const HOOK: V3 = [0.235, 0.46, -0.21];
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
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.032).bone('forearm.L'),
      fistAt(WRIST, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAt(WRIST_R, -1).bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Thick, raised, eager brows.
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.022, 58, 118), 0.3).at(0.1, 0.728 - 0.1, 0.1));
    // A big open grin with the upper teeth and a bit of tongue.
    const MOUTH: V3 = [0, 0.55, 0.1];
    const mouth = sdf
      .extrude(
        profile.polygon(
          [
            [-0.05, 0.0],
            [0.05, 0.0],
            [0.038, -0.02],
            [0.018, -0.033],
            [0, -0.036],
            [-0.018, -0.033],
            [-0.038, -0.02],
          ],
          { smooth: true, samples: 5 },
        ),
        0.3,
      )
      .at(...MOUTH);
    // Teeth and tongue sit inside a dark rim, so the grin reads as a mouth, not a white bar.
    const inner = mouth.round(-0.0055);
    const teeth = inner.intersect(sdf.halfSpace([0, -1, 0], -(MOUTH[1] - 0.013)));
    const tongue = inner.intersect(sdf.sphere(0.026).at(0, MOUTH[1] - 0.04, 0.2).elongate(0.012, 0, 0.3));
    const blush = pair(at(sdf.sphere(0.036), 0.14, 0.562));
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

    // ------------------------------------------------------------------ bandana with a knot and two tails
    const BAND_Y = 0.765;
    const skull = sdf.ellipsoid([HEAD[0], HEAD[1], HEAD[2]]).at(0, HEAD_Y, 0);
    const band = skull
      .round(0.024)
      .subtract(skull.round(0.004))
      .smoothIntersect(0.008, sdf.box([0.6, 0.06, 0.6], 0.01).rotateX(-12).at(0, BAND_Y, 0));
    const tails = sdf.union(
      sdf.chain(
        [
          [KNOT[0], KNOT[1], KNOT[2], 0.022],
          [KNOT[0] - 0.02, KNOT[1] - 0.05, KNOT[2] - 0.035, 0.018],
          [KNOT[0] - 0.05, KNOT[1] - 0.1, KNOT[2] - 0.05, 0.012],
        ],
        0.01,
      ),
      sdf.chain(
        [
          [KNOT[0], KNOT[1], KNOT[2], 0.022],
          [KNOT[0] + 0.035, KNOT[1] - 0.04, KNOT[2] - 0.035, 0.018],
          [KNOT[0] + 0.07, KNOT[1] - 0.085, KNOT[2] - 0.045, 0.012],
        ],
        0.01,
      ),
    ).scale([1, 1, 1]);
    const knot = sdf.ellipsoid([0.035, 0.028, 0.026]).at(...KNOT);
    const bandana = sdf
      .smoothUnion(0.01, band.bone('head'), knot.bone('head'), tails.bone('knot'))
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 30 + y * 80) > 0.85 ? rgb(C.tealDark) : base));
    k.body('bandana', bandana, { color: C.teal, roughness: 0.85 });

    // ------------------------------------------------------------------ hair: messy spiky tufts above the bandana
    // A full mop: a big volume on top, swept up and over to his right (-X), with a few thick locks
    // blended into it so only their rounded ends break the outline.
    const cap = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([HEAD[0] + 0.016, HEAD[1] + 0.016, HEAD[2] + 0.016]).at(0, HEAD_Y + 0.01, -0.01),
        sdf.ellipsoid([0.2, 0.075, 0.18]).rotateZ(10).at(-0.02, 0.85, -0.01),
      )
      .smoothSubtract(0.015, sdf.ellipsoid([0.235, 0.16, 0.22]).at(0, 0.61, 0.15));
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.025);
    const tufts = sdf.smoothUnion(
      0.035,
      lock([
        [0.08, 0.85, 0.09, 0.05],
        [0.0, 0.92, 0.09, 0.045],
        [-0.09, 0.93, 0.07, 0.034],
        [-0.15, 0.89, 0.06, 0.02],
      ]),
      lock([
        [0.1, 0.87, -0.04, 0.05],
        [0.03, 0.95, -0.04, 0.044],
        [-0.06, 0.96, -0.05, 0.032],
        [-0.12, 0.92, -0.05, 0.018],
      ]),
      lock([
        [0.08, 0.83, -0.13, 0.048],
        [0.0, 0.90, -0.14, 0.04],
        [-0.09, 0.89, -0.13, 0.028],
        [-0.14, 0.84, -0.12, 0.016],
      ]),
      lock([
        [-0.1, 0.84, 0.03, 0.044],
        [-0.18, 0.85, 0.03, 0.034],
        [-0.22, 0.80, 0.04, 0.02],
      ]),
      lock([
        [0.15, 0.81, 0.06, 0.034],
        [0.19, 0.85, 0.04, 0.026],
        [0.2, 0.81, 0.01, 0.014],
      ]),
      // Two locks fall over the bandana onto the forehead.
      lock([
        [0.04, 0.85, 0.15, 0.03],
        [0.0, 0.8, 0.2, 0.026],
        [-0.04, 0.745, 0.205, 0.014],
      ]),
      lock([
        [-0.06, 0.84, 0.14, 0.026],
        [-0.1, 0.78, 0.185, 0.02],
        [-0.12, 0.74, 0.18, 0.01],
      ]),
    );
    const sideburns = pair(sdf.cone([0.19, 0.7, 0.03], [0.195, 0.6, 0.06], 0.028, 0.012));
    const hair = sdf
      .smoothUnion(0.02, cap, tufts, sideburns)
      .smoothSubtract(0.004, band.round(0.001))
      .paintFn((x, y, z, base) => (Math.sin(x * 60 + z * 25 - y * 30) > 0.82 ? rgb(C.hairDark) : base));
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

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
      sdf.smoothUnion(
        0.012,
        sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 1.02), 0.048, 0.045),
        sdf.cone(lerp(s, e, 0.9), lerp(s, e, 1.12), 0.05, 0.05).round(0.004).paint(C.shirtShade), // rolled cuff
      ).bone(tag);
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
            [0.122, 0.47],
            [0.13, 0.448],
            [0.11, 0.436],
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
              [-0.085, 0.47],
              [0.085, 0.47],
              [0.012, 0.37],
              [0, 0.355],
              [-0.012, 0.37],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    k.body('scarf', sdf.smoothUnion(0.012, scarfRing, scarfTip).bone('chest'), { color: C.red, roughness: 0.8 });

    // ------------------------------------------------------------------ leather: pack straps, belt, pouch, scabbard
    const strap = (s: 1 | -1) =>
      torso
        .round(0.01)
        .smoothIntersect(0.005, sdf.box([0.034, 0.5, 0.7], 0.006).rotateZ(s * 8).at(s * 0.072, 0.35, 0))
        .intersect(sdf.halfSpace([0, -1, 0], -0.27));
    const beltY = 0.245;
    const belt = torso.round(0.012).smoothIntersect(0.006, sdf.box([0.5, 0.042, 0.5], 0.006).at(0, beltY, 0));
    const pouchAt = sdf.surfacePoint(belt, [-0.11, beltY - 0.02, 0.2], 0);
    const pouch = sdf
      .union(sdf.box([0.05, 0.058, 0.032], 0.012), sdf.box([0.056, 0.026, 0.038], 0.01).at(0, 0.02, 0.002).paint(C.leatherDark))
      .rotateY(-40)
      .at(pouchAt[0], pouchAt[1] - 0.026, pouchAt[2] + 0.006);
    k.body('leather', sdf.union(strap(1), strap(-1), belt, pouch).bone('spine'), { color: C.leather, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.058, 0.046, 0.014], 0.006).subtract(sdf.box([0.036, 0.026, 0.03], 0.006)), sdf.box([0.008, 0.03, 0.01], 0.003).at(0.004, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    const strapBuckles = hard(sdf.box([0.034, 0.028, 0.01], 0.004).subtract(sdf.box([0.02, 0.014, 0.03])).at(0.078, 0.36, 0.106));
    k.body('steel', sdf.union(buckle, strapBuckles).bone('spine'), { color: C.steel, roughness: 0.35, metalness: 0.85 });

    // A coil of rope hangs from the belt on the left hip.
    const ropeAt = sdf.surfacePoint(belt, [0.1, beltY - 0.03, 0.22], 0.01);
    const coil = sdf.union(
      ...[0, 1, 2].map((i) => sdf.torus(0.038 - i * 0.002, 0.007).rotateX(80).rotateY(-35).at(ropeAt[0] + 0.012, ropeAt[1] - 0.045 - i * 0.006, ropeAt[2] + i * 0.003)),
    );
    k.body('rope', coil.bone('spine'), {
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

    // ------------------------------------------------------------------ the travel pack, bedroll, and lantern
    // Local frame: the pack's back face center at the origin, the pack extending toward -Z.
    const packPose = (s: sdf.Shape) => s.rotateX(-4).at(0, 0.38, -0.125);
    const packBody = sdf.box([0.33, 0.33, 0.17], 0.055).at(0, 0, -0.085);
    const flap = packBody
      .round(0.01)
      .subtract(packBody.round(-0.01))
      .smoothIntersect(0.006, sdf.box([0.45, 0.17, 0.4], 0.01).at(0, 0.11, -0.085));
    const packStrapsV = hard(packBody.round(0.006).smoothIntersect(0.004, sdf.box([0.03, 0.4, 0.4], 0.006).at(0.085, 0, -0.085)));
    const sidePocket = hard(sdf.box([0.05, 0.12, 0.1], 0.025).at(0.17, -0.07, -0.085));
    const pack = sdf.smoothUnion(0.012, packBody, sidePocket);
    // The flap and the straps are a separate body: close, painted surfaces in one body crease.
    k.body('pack-flap', packPose(sdf.union(flap, packStrapsV.paint(C.leatherDark))).bone('chest'), {
      color: C.flap,
      roughness: 0.65,
    });
    k.body('pack', packPose(pack).bone('chest'), {
      color: C.pack,
      roughness: 0.65,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 120, y * 120, z * 120, 2),
    });
    // The bedroll lies across the top of the pack, tied with two straps.
    const roll = sdf.capsule([-0.22, 0.2, -0.095], [0.22, 0.2, -0.095], 0.062).rotateZ(-8);
    const rollTies = hard(sdf.cylinder(0.068, 0.02, 0.006).rotateZ(90).at(0.11, 0.2, -0.095).rotateZ(-8));
    const bedroll = roll
      .union(rollTies.paint(C.leatherDark))
      .paintFn((x, y, z, base) => (Math.abs(x) > 0.19 && Math.sin(Math.atan2(z + 0.095, y - 0.2) * 3 + Math.hypot(y - 0.2, z + 0.095) * 180) > 0.4 ? rgb(C.tealDark) : base));
    k.body('bedroll', packPose(bedroll).bone('chest'), { color: C.teal, roughness: 0.85 });
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

    // ------------------------------------------------------------------ the map in the right hand
    // A rolled parchment gripped in the fist, a little unrolled at the bottom end.
    const mapAxis: V3 = [-0.12, -0.72, 0.68];
    const mapTop = add(GRIP_R, [-mapAxis[0] * 0.05, -mapAxis[1] * 0.05, -mapAxis[2] * 0.05]);
    const mapEnd = add(GRIP_R, [mapAxis[0] * 0.16, mapAxis[1] * 0.16, mapAxis[2] * 0.16]);
    const scroll = sdf
      .capsule(mapTop, mapEnd, 0.022)
      .union(sdf.sphere(0.021).scale([1, 1, 0.3]).rotateX(-45).at(...mapEnd).paint(C.mapInk))
      .paintFn((x, y, z, base) => (Math.sin((x - GRIP_R[0]) * 200 + (z - GRIP_R[2]) * 40) > 0.9 ? rgb(C.mapInk) : base));
    k.body('map', scroll.bone('hand.R'), { color: C.map, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ the short sword in its scabbard, left hip
    // Local frame: the guard at the origin, the grip up, the scabbard down; hung at a slant.
    const swordLocal = sdf.union(
      sdf.capsule([0, 0.005, 0], [0, 0.07, 0], 0.012).paint(C.leatherDark),
      sdf.sphere(0.018).at(0, 0.082, 0).paint(C.steel),
      sdf.box([0.07, 0.014, 0.022], 0.006).paint(C.steel),
      sdf
        .extrude(
          profile.polygon([
            [-0.02, -0.006],
            [0.02, -0.006],
            [0.017, -0.19],
            [0, -0.22],
            [-0.017, -0.19],
          ]),
          0.02,
          0.007,
        )
        .paint(C.scabbard),
      sdf.cone([0, -0.19, 0], [0, -0.215, 0], 0.017, 0.006).paint(C.steel),
    );
    const swordAt = sdf.surfacePoint(belt, [0.16, beltY, 0.02], 0.02);
    const sword = swordLocal.rotateY(80).rotateZ(28).at(swordAt[0] + 0.01, swordAt[1] - 0.005, swordAt[2]);
    k.body('sword', sword.bone('hips'), { color: C.scabbard, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

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
          'upperarm.R': { rotate: [-armSwing * 0.7 * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 28, 3, 0));
    k.animation('run', stride(0.56, 40, 50, 12, 0.03));
  },
});
