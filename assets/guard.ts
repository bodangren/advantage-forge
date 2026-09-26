import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Guard — Chibi Quest settlement NPC (catalog `npcs/settlement/guard`), about 0.96 m to the helmet
 * crest and 1.08 m to the spear tip, faces +Z. Target: docs/npc-mockups/guard_001.jpg (made with
 * mmx; one front view). Built on the rogue's head and skeleton, with the knight's mail and
 * pauldrons, so the town guard reads as a plainer cousin of the knight hero.
 *
 * Role: a town NPC (gates and patrols), seen in 3D and as a 128 px sprite; the helmet, the big
 *   mustache, the blue tabard, and the spear must read.
 * One idea: a friendly, mustached watchman in a round steel kettle helmet, a sky-blue tabard with
 *   a gold tower, and a tall spear with a teal pennant.
 * Proportions: the rogue's (head center 0.675, eyes 0.628, shoulders 0.385, belt 0.25); the
 *   helmet crest at 0.96, its brim at 0.78, the cheek guards to 0.55; the tabard hem at 0.15.
 * Shape language: round and sturdy (helmet dome, pauldrons, gauntlets, boots) with the straight
 *   spear and the pointed pennant as accents.
 * Palette (60/30/10): sky-blue tabard #6aa2c0 and satin steel #9aa0a8; gold #e0b040 trims and
 *   tower; a teal pennant #3e9aa0; brown hair and mustache #5a3422; brown leather.
 * Value plan: the light face framed by the dark steel helmet and the brown mustache is the focal
 *   point; the blue tabard with the gold tower is the second.
 * Bodies: skin, hair (hair, brows, mustache), helmet, mail, tabard, gold, pauldrons, gauntlets,
 *   belt, trousers, boots, spear-haft, spear-head, flag.
 * Rig: the rogue's skeleton plus `pennant`; the spear is rigid on `hand.R`. Clips: idle, walk,
 *   run, attack (a spear thrust), hit, death (falls on his back), salute (a villager greeting).
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c120c',
  iris: '#4a2c1a',
  irisLow: '#7a4a26',
  pupil: '#110d0b',
  lid: '#16100c',
  mouth: '#a4503f',
  hair: '#5a3422',
  hairDark: '#3e2216',
  steel: '#9aa0a8',
  steelDark: '#6e747c',
  mail: '#7a8088',
  blue: '#6aa2c0',
  blueDark: '#4e84a2',
  gold: '#e0b040',
  leather: '#6a432c',
  trousers: '#5e6a5a',
  boot: '#6e4228',
  cuff: '#5a341e',
  sole: '#3e2618',
  wood: '#6e4a30',
  pennant: '#3e9aa0',
  pennantDark: '#2e7a80',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.1, 0.63] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: the right hand holds the spear upright out in front of the right shoulder; the left
// arm hangs at the side.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.185, 0.33, 0.012];
const WRIST_L: V3 = [0.21, 0.24, 0.035];
const ELBOW_R: V3 = [-0.195, 0.335, 0.03];
const WRIST_R: V3 = [-0.225, 0.3, 0.09];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const GRIP: V3 = [WRIST_R[0] - 0.012, WRIST_R[1] - 0.038, WRIST_R[2] + 0.014];

/** A relaxed fist hanging from the wrist `w`. */
const fistAt = (w: V3) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.041, 0.046, 0.047]).at(w[0] + 0.007, w[1] - 0.04, w[2] + 0.004),
    sdf.capsule([w[0] - 0.009, w[1] - 0.061, w[2] + 0.032], [w[0] - 0.005, w[1] - 0.04, w[2] + 0.045], 0.018),
    sdf.cone([w[0] + 0.021, w[1] - 0.024, w[2] + 0.026], [w[0] + 0.001, w[1] - 0.035, w[2] + 0.05], 0.017, 0.0135),
  );
/** A fist wrapped around a vertical haft at `g`: the fingers curl around the front. */
const gripFist = (g: V3) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.039, 0.047, 0.039]).at(g[0] - 0.012, g[1], g[2] - 0.004),
    sdf.capsule([g[0] - 0.02, g[1] - 0.02, g[2] + 0.024], [g[0] + 0.019, g[1] - 0.02, g[2] + 0.024], 0.017),
    sdf.capsule([g[0] - 0.02, g[1] + 0.007, g[2] + 0.026], [g[0] + 0.019, g[1] + 0.007, g[2] + 0.026], 0.017),
    sdf.cone([g[0] - 0.028, g[1] + 0.022, g[2] + 0.01], [g[0] + 0.012, g[1] + 0.032, g[2] + 0.02], 0.015, 0.012), // thumb on top
  );

export default defineAsset({
  name: 'guard',
  description: 'Chibi town guard NPC: a round steel kettle helmet, a big brown mustache, a sky-blue tabard with a gold tower, mail, steel gauntlets, and a spear with a teal pennant.',
  detail: 0.005,
  reference: 'docs/npc-mockups/guard_001.jpg',

  build(k) {
    const SPEAR_TOP = 0.8; // above the grip
    // A point on the haft `h` above the grip (the spear leans 3 degrees about Z).
    const onHaft = (h: number): V3 => [GRIP[0] - h * Math.sin((3 * Math.PI) / 180), GRIP[1] + h * Math.cos((3 * Math.PI) / 180), GRIP[2]];
    const PENNANT_AT = onHaft(SPEAR_TOP - 0.078); // the tie, just below the rings
    const pennantTail: V3 = [PENNANT_AT[0] - 0.04, PENNANT_AT[1] - 0.19, PENNANT_AT[2] - 0.015];
    // ------------------------------------------------------------------ skeleton
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
      pennant: { parent: 'hand.R', at: PENNANT_AT, tail: pennantTail },
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
    // A big round nose.
    const nose = sdf.ellipsoid([0.038, 0.032, 0.03]).at(0, 0.585, faceZ(0, 0.585) + 0.006).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.048, 0.034])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.61, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.046, 0.05, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.038, 0.044, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.032, 0.038, 0.07]), EYE[0], EYE[1] - 0.005));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.018));
    const pupil = pair(at(sdf.ellipsoid([0.024, 0.027, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.045, 0.011, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.011), x + 0.015, EYE[1] + 0.017), at(sdf.sphere(0.0055), x - 0.013, EYE[1] - 0.02)]),
    );
    const smile = sdf.extrude(profile.arc(0.05, 0.009, 245, 295), 0.3).at(0, 0.522 + 0.05, 0.1);
    const armL = sdf.smoothUnion(0.02, sdf.cone(SHOULDER, ELBOW_L, 0.042, 0.038).bone('upperarm.L'), sdf.cone(ELBOW_L, WRIST_L, 0.038, 0.034).bone('forearm.L'));
    const armR = sdf.smoothUnion(0.02, sdf.cone(mx(SHOULDER), ELBOW_R, 0.042, 0.038).bone('upperarm.R'), sdf.cone(ELBOW_R, WRIST_R, 0.038, 0.034).bone('forearm.R'));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.014, nose, ears)
      .union(armL, armR)
      .paintWhere(pair(at(sdf.sphere(0.03), 0.14, 0.575)), C.blush, 0.028)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.01)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(smile, C.mouth)
      .paintWhere(sdf.sphere(0.028).at(0, 0.585, faceZ(0, 0.585) + 0.04), '#f0a090', 0.02); // a rosy nose tip
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ the kettle helmet
    // A dome about 10 percent smaller than the skull-sized first helmet, so the brim sits higher and
    // more of the face shows. A second ellipsoid, close around the skull, carries the cheek and neck
    // guards below the brim, so the smaller dome never lets the head poke through.
    const helmOuter = sdf.smoothUnion(
      0.02,
      sdf.ellipsoid([0.209, 0.209, 0.2]).at(0, 0.745, -0.01),
      sdf.ellipsoid([0.231, 0.235, 0.217]).at(0, 0.7, -0.01),
    );
    const helmInner = helmOuter.round(-0.014);
    const BRIM_Y = 0.78;
    // The face window between the cheek guards, from the brim down.
    const faceWindow = sdf
      .extrude(
        profile.polygon(
          [
            [-0.17, BRIM_Y + 0.01],
            [0.17, BRIM_Y + 0.01],
            [0.175, 0.64],
            [0.15, 0.56],
            [0.12, 0.45],
            [-0.12, 0.45],
            [-0.15, 0.56],
            [-0.175, 0.64],
          ],
          { smooth: true, samples: 5 },
        ),
        0.5,
        0.01,
      )
      .at(0, 0, 0.26);
    const shellOf = (s: sdf.Shape, out: number, inn: number) => s.round(out).subtract(s.round(-inn));
    const dome = helmOuter.subtract(helmInner).intersect(sdf.halfSpace([0, -1, 0], -BRIM_Y));
    const guards = helmOuter
      .subtract(helmInner)
      .intersect(sdf.halfSpace([0, 1, 0], BRIM_Y))
      .intersect(sdf.halfSpace([0, -1, 0], -0.555))
      .smoothSubtract(0.008, faceWindow);
    // A rolled brim all around at brow level, and a raised crest from front to back.
    const brim = shellOf(helmOuter, 0.022, 0.004).smoothIntersect(0.006, sdf.box([0.8, 0.032, 0.8], 0.01).at(0, BRIM_Y, 0));
    const crest = shellOf(helmOuter, 0.016, 0.004)
      .smoothIntersect(0.006, sdf.box([0.034, 0.6, 0.8], 0.012).at(0, 0.96, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -(BRIM_Y + 0.02)));
    // Cheek-guard bottoms are rolled too.
    const guardEdge = shellOf(helmOuter, 0.01, 0.006).smoothIntersect(0.004, sdf.box([0.8, 0.024, 0.8], 0.008).at(0, 0.565, -0.05)).smoothSubtract(0.008, faceWindow);
    const helmet = sdf
      .smoothUnion(0.008, dome, guards, brim, crest, guardEdge)
      .paintWhere(helmInner.round(0.004), C.steelDark, 0.008);
    k.body('helmet', helmet.bone('head'), { color: C.steel, roughness: 0.38, metalness: 0.8 });

    // ------------------------------------------------------------------ hair, brows, and the mustache
    const insideHelm = helmInner.round(-0.003).union(faceWindow.intersect(helmOuter.round(-0.002)));
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.012, sdf.ellipsoid([0.24, 0.15, 0.23]).at(0, 0.6, 0.14));
    // A few thick locks fall from under the brim onto the forehead; sideburns in front of the ears.
    const lock = (x: number, len: number, lean: number, r: number) => {
      const top = sdf.surfacePoint(head, [x, BRIM_Y + 0.005, 0.4], 0.004);
      return sdf.cone(top, [top[0] + lean, top[1] - len, top[2] + 0.014], r, 0.006);
    };
    const locks = sdf.union(lock(-0.125, 0.045, -0.02, 0.024), lock(-0.055, 0.028, -0.01, 0.024), lock(0.025, 0.024, 0.008, 0.022), lock(0.11, 0.042, 0.02, 0.024));
    const sideburns = pair(sdf.cone([0.185, 0.72, 0.04], [0.19, 0.6, 0.075], 0.03, 0.014));
    const hairShape = sdf.smoothUnion(0.012, cap, locks, sideburns).intersect(insideHelm);
    const brows = pair(
      sdf.chain(
        [
          [0.045, 0.692, faceZ(0.045, 0.692) + 0.004, 0.014],
          [0.1, 0.704, faceZ(0.1, 0.704) + 0.006, 0.016],
          [0.148, 0.694, faceZ(0.148, 0.694) + 0.002, 0.01],
        ],
        0.008,
      ),
    );
    // A big handlebar mustache under the nose, curling up at the ends.
    const mZ = faceZ(0, 0.55);
    const mustache = pair(
      sdf.chain(
        [
          [0.0, 0.555, mZ + 0.028, 0.02],
          [0.04, 0.552, mZ + 0.024, 0.026],
          [0.085, 0.545, mZ + 0.008, 0.022],
          [0.12, 0.555, mZ - 0.012, 0.014],
          [0.135, 0.575, mZ - 0.022, 0.006],
        ],
        0.012,
      ),
    );
    const hairTone = rgb(C.hairDark);
    const hair = sdf
      .smoothUnion(0.01, hairShape, brows, mustache)
      .paintFn((x, y, z, base) => (Math.sin(x * 90 + y * 30) > 0.8 && y > 0.6 ? hairTone : base));
    k.body('hair', hair.bone('head'), { color: C.hair, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ mail, tabard, belt
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.126, 0.29],
            [0.132, 0.25],
            [0.14, 0.2],
            [0.142, 0.17],
            [0.134, 0.158],
            [0, 0.158],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const rings = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 30;
      const v = y * 190 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return 0.0012 * Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 1.05), 0.048, 0.044).bone(tag);
    k.body('mail', sdf.union(torso.bone('spine'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')), {
      color: C.mail,
      roughness: 0.55,
      metalness: 0.7,
      bump: rings,
    });
    // The tabard: a sleeveless blue shell over the mail, split at the sides below the belt into
    // a front and a back panel, with a gold hem and a gold V collar.
    const tabardBase = torso.smoothUnion(0.04, sdf.cone([0, 0.24, 0], [0, 0.13, 0.0], 0.14, 0.155).scale([1, 1, 0.82]));
    const sideSlits = pair(sdf.box([0.06, 0.14, 0.5], 0.01).at(0.15, 0.15, 0));
    const tabard = tabardBase
      .round(0.01)
      .subtract(tabardBase.round(0.001))
      .intersect(sdf.halfSpace([0, -1, 0], -0.135))
      .subtract(pair(sdf.ellipsoid([0.05, 0.06, 0.06]).at(0.13, 0.4, 0))) // arm holes
      .smoothSubtract(0.006, sideSlits.intersect(sdf.halfSpace([0, 1, 0], 0.235)))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.16), C.gold, 0.003)
      .paintWhere(
        sdf
          .extrude(
            profile.polygon([
              [-0.075, 0.475],
              [0.075, 0.475],
              [0, 0.405],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
        C.gold,
        0.003,
      );
    k.body('tabard', tabard.bone('spine'), { color: C.blue, roughness: 0.8 });
    // The gold tower on the chest: a raised emblem that follows the tabard's surface.
    const towerOutline = profile.polygon(
      [
        [-0.022, -0.04],
        [0.022, -0.04],
        [0.022, 0.01],
        [0.045, 0.01],
        [0.045, 0.028],
        [0.022, 0.028],
        [0.022, 0.035],
        [0.028, 0.035],
        [0.028, 0.05],
        [0.012, 0.05],
        [0.012, 0.042],
        [0.004, 0.042],
        [0.004, 0.05],
        [-0.004, 0.05],
        [-0.004, 0.042],
        [-0.012, 0.042],
        [-0.012, 0.05],
        [-0.028, 0.05],
        [-0.028, 0.035],
        [-0.022, 0.035],
        [-0.022, 0.028],
        [-0.045, 0.028],
        [-0.045, 0.01],
        [-0.022, 0.01],
      ],
      { smooth: false },
    );
    const emblem = tabardBase
      .round(0.016)
      .subtract(tabardBase.round(0.006))
      .smoothIntersect(0.003, sdf.extrude(towerOutline, 0.5, 0.004).at(0, 0.33, 0.25))
      .subtract(sdf.extrude(profile.rect([0.012, 0.022], 0.004), 0.6).at(0, 0.305, 0.25)); // the door
    const beltY = 0.25;
    const belt = tabardBase.round(0.018).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.leather, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.058, 0.048, 0.012], 0.006).subtract(sdf.box([0.032, 0.024, 0.03], 0.004)), sdf.box([0.008, 0.03, 0.01], 0.003).at(0.002, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    k.body('gold', sdf.union(emblem, buckle).bone('spine'), { color: C.gold, roughness: 0.32, metalness: 0.85 });

    // ------------------------------------------------------------------ pauldrons and gauntlets
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.085 * s, 0.056 * s, 0.084 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.014 * s))
        .round(0.003);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-28).at(0.15, 0.425, 0);
    const pauldrons = pair(pauldronPose(sdf.union(lame(1), lame(1.14).at(0, -0.03, 0))).bone('upperarm.L'));
    k.body('pauldrons', pauldrons, { color: C.steel, roughness: 0.38, metalness: 0.8 });
    const vambrace = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.1), lerp(e, w, 1.02), 0.042, 0.049).round(0.003);
    const gauntlets = sdf.union(
      sdf.smoothUnion(0.012, vambrace(ELBOW_L, WRIST_L).bone('forearm.L'), fistAt(WRIST_L).bone('hand.L')),
      sdf.smoothUnion(0.012, vambrace(ELBOW_R, WRIST_R).bone('forearm.R'), gripFist(GRIP).bone('hand.R')),
    );
    k.body('gauntlets', gauntlets, { color: C.steel, roughness: 0.4, metalness: 0.8 });

    // ------------------------------------------------------------------ trousers and boots
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.11, 0.004], 0.047).bone('leg.L')),
    );
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.05, 0.08, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = bootFoot
      .union(sdf.cylinder(0.057, 0.034, 0.012).at(0, 0.1, 0).paint(C.cuff))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the spear and its pennant
    // Local frame: the grip at the origin, the haft along +Y, the blade at the top.
    const spearPose = (s: sdf.Shape) => s.rotateZ(3).at(...GRIP);
    const haft = sdf.capsule([0, -GRIP[1] + 0.015, 0], [0, SPEAR_TOP, 0], 0.013);
    const blade = sdf.union(
      sdf
        .extrude(
          profile.polygon(
            [
              [0, 0.0],
              [0.022, 0.04],
              [0.02, 0.08],
              [0, 0.13],
              [-0.02, 0.08],
              [-0.022, 0.04],
            ],
            { smooth: true, samples: 3 },
          ),
          0.012,
          0.004,
        )
        .at(0, SPEAR_TOP + 0.02, 0),
      sdf.cylinder(0.02, 0.05, 0.006).at(0, SPEAR_TOP - 0.005, 0), // the socket
      sdf.torus(0.02, 0.006).at(0, SPEAR_TOP - 0.04, 0),
      sdf.torus(0.019, 0.006).at(0, SPEAR_TOP - 0.06, 0),
    );
    k.body('spear-haft', spearPose(haft), { color: C.wood, roughness: 0.7, detail: 0.004, bone: 'hand.R' });
    k.body('spear-head', spearPose(blade), { color: C.steel, roughness: 0.3, metalness: 0.85, detail: 0.0035, bone: 'hand.R' });
    // The pennant: a swallowtail flag tied to the haft just below the rings. At rest it hangs
    // down beside the haft, its tails turned a little back, with soft vertical folds.
    const flag = sdf
      .extrude(
        profile.polygon(
          [
            [0.0, 0.01],
            [-0.045, -0.006],
            [-0.082, -0.05],
            [-0.09, -0.125],
            [-0.074, -0.21],
            [-0.05, -0.165],
            [-0.024, -0.195],
            [-0.012, -0.105],
            [0.0, -0.035],
          ],
          { smooth: false },
        ),
        0.014,
        0.005,
      )
      .displace(0.005, (x, y) => Math.sin(x * 120 + y * 18))
      .paintWhere(sdf.halfSpace([0, 1, 0], -0.132).intersect(sdf.halfSpace([0, -1, 0], 0.148)), C.pennantDark, 0.003)
      .rotateY(-22)
      .at(...PENNANT_AT);
    k.body('flag', flag.bone('pennant'), { color: C.pennant, roughness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 8 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] }, // keeping watch
        pennant: { rotate: [0, 12 * wave(p, 2, 0.1), 5 * wave(p, 3, 0.3)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number, flap: number, carry = 0) => ({
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
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The pennant lifts back behind the haft and flutters.
          pennant: { rotate: [flap + 0.3 * flap * wave(p, 2, 0.2), 10 * wave(p, 3, 0.1), -0.25 * flap - 6 * wave(p, 2, 0.45)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          // The spear arm swings little; the hand keeps the spear upright. `carry` bends the forearm
          // up and lifts the spear with its tilt unchanged, so in the run the butt clears the ground.
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, -3] as const },
          'forearm.R': { rotate: [-carry, 0, 0] as const },
          'hand.R': { rotate: [armSwing * 0.25 * s + carry, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 26, 3, 0, 24));
    k.animation('run', stride(0.56, 40, 44, 12, 0.03, 48, 36));

    // A two-hand spear thrust, solved by targets in the world frame. The guard turns side-on to the
    // right, the left shoulder forward, the spear level at the belly: the rear (right) hand in front
    // of the right hip, the lead (left) hand on the haft a quarter meter ahead. The rear hand draws
    // the spear back 10 cm and the chest turns further. Then the front (left) foot steps in, the
    // hips drop, the body unwinds a little, and the rear hand drives the wrist straight along the
    // spear's own line toward a target in front at chest height. The lead hand guides: it holds the
    // haft, and the haft slides through it where the short chibi arm cannot follow (its shoulder
    // reaches forward up to 4.5 cm). The spear pulls back to the guard and returns to rest. The
    // pennant keeps its own world frame: it hangs down, trails back behind the spear head in the
    // drive, and swings forward when the spear stops.
    const { keys, reach, orient, follow, quat, euler } = motion;
    const DEG = Math.PI / 180;
    const O: V3 = [0, 0, 0];
    const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
    const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const unit = (a: V3): V3 => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
    const turn = (r: readonly V3[], v: V3): V3 => follow(r.map(() => O), r, v);
    const HIPS: V3 = [0, 0.2, 0];
    const SPINE: V3 = [0, 0.26, 0];
    const CHEST: V3 = [0, 0.33, 0];
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_CHAIN_R = [HIPS, SPINE, CHEST, mx(SHOULDER), ELBOW_R, WRIST_R] as const;
    const FIST_L: V3 = [WRIST_L[0] + 0.007, WRIST_L[1] - 0.04, WRIST_L[2] + 0.004]; // the left fist's center
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: FIST_L }; // to the fist; the hand stays in line
    const SPEAR_DIR: V3 = [-Math.sin(3 * DEG), Math.cos(3 * DEG), 0];
    const FINGERS: V3 = [0, 0, 1]; // the fingers and the blade's flat face forward at rest
    const PEN_DIR = unit(sub(pennantTail, PENNANT_AT));
    const PEN_FACE: V3 = [-Math.sin(22 * DEG), 0, Math.cos(22 * DEG)]; // the flag's face (rotateY(-22))
    const AIM = unit([0.12, 0.05, 1]); // toward a target in front at chest height
    const PALM = unit([0.5, -0.85, 0]); // the rear hand holds the level spear palm up
    const GUARD: V3 = [-0.22, 0.34, -0.1]; // the rear wrist in front of the right hip, side-on
    const DRAW = 0.13; // the target; the arm's reach limit makes the draw back about 0.10
    const POLE_R: V3 = [-0.54, 0.28, -0.12]; // the right elbow out, so the gauntlet clears the tabard
    const POLE_L: V3 = [0.6, 0.3, 0.5]; // the left elbow out and forward, clear of the chest
    const LEAD = 0.25; // the lead hand on the haft, ahead of the rear grip
    const FOLD = 0.17; // the lead fist stays this far from its shoulder, so the elbow never folds in
    const REACH_L = Math.hypot(...sub(ELBOW_L, SHOULDER)) + Math.hypot(...sub(FIST_L, ELBOW_L)) - 0.004;
    const PROTRACT = 0.045; // how far the left shoulder may reach forward
    const CHANNEL: V3 = [0, 0, 1]; // the grip channel through the left fist at rest
    const FOREARM_L = unit(sub(ELBOW_L, FIST_L)); // from the fist back to the elbow
    const HOLD = 0.28; // the guard is set
    const COIL = 0.4; // the draw back, held long enough to read
    const DRIVE = 0.47; // full extension
    const STAY = 0.58;
    const BACK = 0.74; // back in the guard
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        // The body: a side-on right turn in the guard, more in the coil, unwinding a little in the
        // drive (the short lead arm keeps the stance side-on); a forward lean in the drive.
        const yaw = keys(p, [[0, 0], [HOLD, -70], [COIL, -78], [DRIVE, -60], [STAY, -62], [BACK, -66], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [HOLD, -3], [COIL, -5], [DRIVE, 12], [STAY, 10], [BACK, -2], [1, 0]] as const);
        const hipZ = keys(p, [[0, 0], [HOLD, -0.008], [COIL, -0.012], [DRIVE, 0.065], [STAY, 0.065], [BACK, -0.008], [1, 0]] as const);
        // The feet: the rear foot slides back once and stays; the front foot steps in and back.
        const footL = keys(p, [[0, 0], [HOLD, 0.025], [COIL, 0.025], [DRIVE, 0.17], [0.6, 0.17], [BACK, 0.025], [1, 0]] as const);
        const footR = keys(p, [[0, 0], [HOLD, -0.04], [BACK, -0.04], [1, 0]] as const);
        const legL = (-Math.asin(Math.max(-1, Math.min(1, (footL - hipZ) / LEG))) / DEG) as number;
        const legR = (-Math.asin(Math.max(-1, Math.min(1, (footR - hipZ) / LEG))) / DEG) as number;
        const lift: V3 = [0, -Math.min(legDrop(LEG, legL), legDrop(LEG, legR)), hipZ];
        const rh: V3 = [0, 0.2 * yaw, 0];
        const rs: V3 = [0.5 * lean, 0.35 * yaw, 0];
        const rc: V3 = [0.5 * lean, 0.45 * yaw, 0];
        // World targets to the chest's rest frame (where reach works).
        const chestAt = add(lift, follow([HIPS, SPINE, CHEST], [rh, rs, rc], CHEST));
        const undo = euler(quat(rh).multiply(quat(rs)).multiply(quat(rc)).invert());
        const toChest = (w: V3): V3 => add(CHEST, turn([undo], sub(w, chestAt)));

        // The rear wrist: rest, the guard, the draw back, the drive along AIM, back.
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [HOLD, GUARD],
            [COIL, add(GUARD, mul(AIM, -DRAW))],
            [DRIVE, add(GUARD, mul(AIM, 0.16))],
            [STAY, add(GUARD, mul(AIM, 0.15))],
            [BACK, GUARD],
            [1, WRIST_R],
          ] as const,
        );
        const dir = unit(keys(p, [[0, SPEAR_DIR], [HOLD, AIM], [BACK, AIM], [1, SPEAR_DIR]] as const));
        const up = unit(keys(p, [[0, FINGERS], [HOLD, PALM], [BACK, PALM], [1, FINGERS]] as const));
        const pole = keys(p, [[0, ELBOW_R], [HOLD, POLE_R], [BACK, POLE_R], [1, ELBOW_R]] as const);
        // In the pull back, the rear wrist passes a little out to the right of the chest.
        const wide = mul([-0.035, 0, 0.01], keys(p, [[STAY, 0], [0.645, 1], [BACK, 0]] as const));
        const arm = reach(ARM_R, add(toChest(wrist), wide), pole);
        const chain = [rh, rs, rc, arm.upper, arm.lower];
        const hand = orient(chain, { dir: SPEAR_DIR, up: FINGERS }, { dir, up });

        // The lead hand: the point on the haft LEAD ahead of the rear grip. The haft slides through
        // the hand where that point is too near the shoulder (FOLD) or out of reach; past the reach
        // the hand takes the nearest point, and the shoulder reaches forward for the rest.
        const grip = add(lift, follow(ARM_CHAIN_R, [...chain, hand], GRIP));
        const shL = add(lift, follow([HIPS, SPINE, CHEST], [rh, rs, rc], SHOULDER));
        const q = sub(grip, shL);
        const b = dot(q, dir);
        const root = (r: number) => -b + Math.sqrt(Math.max(0, b * b - dot(q, q) + r * r)); // the far point at distance r
        const h = Math.min(Math.max(LEAD, root(FOLD)), root(REACH_L));
        const on = keys(p, [[0.04, 0], [HOLD, 1], [BACK, 1], [0.96, 0]] as const);
        const onHaftC = toChest(add(grip, mul(dir, h)));
        const toHaft = sub(onHaftC, SHOULDER);
        const shift = mul(unit(toHaft), on * Math.min(PROTRACT, Math.max(0, Math.hypot(...toHaft) - REACH_L)));
        // On the way to the haft and back, the fist first swings out and forward, clear of the belt
        // and the tabard, and then comes in to the haft.
        const fistTo = add(lerp(FIST_L, sub(onHaftC, shift), on * on), mul([0.03, 0.03, 0.1], Math.sin(Math.PI * on)));
        const armL = reach(ARM_L, fistTo, lerp(ELBOW_L, POLE_L, on));
        const chainL = [rh, rs, rc, armL.upper, armL.lower];
        // The haft runs through the fist; the fist stays in line with the forearm.
        const handL = orient(chainL, { dir: CHANNEL, up: FOREARM_L }, { dir: unit(lerp(turn(chainL, CHANNEL), dir, on)), up: turn(chainL, FOREARM_L) });

        // The pennant: it turns under the level haft, its tails down and its body behind the tie,
        // and trails back with the speed of the spear head.
        const flagYaw = keys(p, [[0, 0], [HOLD, -68], [BACK, -68], [1, 0]] as const);
        const trail = keys(
          p,
          [[0, 0], [0.12, 26], [HOLD, 4], [COIL, -8], [0.43, 38], [DRIVE, 30], [0.53, -16], [0.6, 8], [0.68, -20], [0.78, -4], [0.88, 12], [1, 0]] as const,
          'spline',
        );
        const hang = (v: V3) => turn([[trail, 0, 0], [0, flagYaw, 0]], v);
        const pennant = orient([...chain, hand], { dir: PEN_DIR, up: PEN_FACE }, { dir: hang(PEN_DIR), up: hang(PEN_FACE) });

        return {
          hips: { move: lift, rotate: rh },
          spine: { rotate: rs },
          chest: { rotate: rc },
          head: { rotate: [-0.6 * lean, -0.75 * yaw, 0] }, // the eyes stay on the target
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          pennant: { rotate: pennant },
          'upperarm.L': { rotate: armL.upper, move: shift },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: handL },
          'leg.L': { rotate: [legL, 0, 0] },
          'leg.R': { rotate: [legR, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'foot.R': { rotate: [-legR, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit, death, salute
    // Shared by the one-shot clips: joints, the chest's rest frame for a body pose (where `reach`
    // works), world points on a bone chain, and the pennant's world orientation.
    const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
    const toChestOf = (lift: V3, rh: V3, rs: V3, rc: V3) => {
      const at = add(lift, follow([HIPS, SPINE, CHEST], [rh, rs, rc], CHEST));
      const undo = euler(quat(rh).multiply(quat(rs)).multiply(quat(rc)).invert());
      return (w: V3): V3 => add(CHEST, turn([undo], sub(w, at)));
    };
    const worldOf = (lift: V3, joints: readonly V3[], rotations: readonly V3[], point: V3): V3 => add(lift, follow(joints, rotations, point));
    const flagTo = (parents: readonly V3[], dir: V3, up: V3) => orient(parents, { dir: PEN_DIR, up: PEN_FACE }, { dir, up });
    const swing = (trail: number) => (v: V3) => turn([[trail, 0, 0]], v);

    // Hit: a blow from the front snaps the head and the chest back; the right foot takes a small
    // step back, and all returns quickly. The hand keeps the spear near upright, tipped out to the
    // right, away from the helmet; the pennant hangs in the world frame and swings.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.8], [1, 0]] as const);
        const step = keys(p, [[0, 0], [0.1, 0], [0.3, 1], [0.6, 1], [1, 0]] as const);
        const hipZ = -0.022 * h - 0.012 * step;
        const footR = -0.05 * step;
        const legL = -Math.asin(clamp1(-hipZ / LEG)) / DEG;
        const legR = -Math.asin(clamp1((footR - hipZ) / LEG)) / DEG;
        const lift: V3 = [0, -Math.min(legDrop(LEG, legL), legDrop(LEG, legR)), hipZ];
        const rh: V3 = [0, 5 * h, 0];
        const rs: V3 = [-7 * h, 0, 0];
        const rc: V3 = [-9 * h, 6 * h, 3 * h];
        const upper: V3 = [-6 * h, 0, -10 * h];
        const lower: V3 = [-8 * h, 0, 0];
        const chain = [rh, rs, rc, upper, lower];
        const hand = orient(chain, { dir: SPEAR_DIR, up: FINGERS }, { dir: unit(add(SPEAR_DIR, [-0.12 * h, 0, 0.04 * h])), up: FINGERS });
        const hang = swing(keys(p, [[0, 0], [0.14, -22], [0.34, 14], [0.56, -8], [0.8, 3], [1, 0]] as const, 'spline'));
        return {
          hips: { move: lift, rotate: rh },
          spine: { rotate: rs },
          chest: { rotate: rc },
          neck: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-13 * h, -6 * h, -5 * h] },
          'upperarm.R': { rotate: upper },
          'forearm.R': { rotate: lower },
          'hand.R': { rotate: hand },
          pennant: { rotate: flagTo([...chain, hand], hang(PEN_DIR), hang(PEN_FACE)) },
          'upperarm.L': { rotate: [-16 * h, 0, 22 * h] },
          'forearm.L': { rotate: [-22 * h, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'leg.R': { rotate: [legR, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'foot.R': { rotate: [-legR, 0, 0] },
        };
      },
    });

    // Death: the blow snaps the head and the chest back, the guard staggers a step back and sags,
    // then falls on his back with a small bounce. The big helmet props the head, so the body ends
    // tilted 80 degrees with the helmet and the tabard on the ground. The spear falls back with him
    // and lies beside his right side, its head past the helmet; the pennant lies flat beside it.
    const TILT = 80;
    const DROP = 0.048; // the hips joint ends 0.152 above the ground
    const BACK_Z = -0.17;
    const endLift: V3 = [0, -DROP, BACK_Z];
    const shEndR = worldOf(endLift, [HIPS, SPINE, CHEST], [[-TILT, 0, 0], O, O], mx(SHOULDER));
    const shEndL = worldOf(endLift, [HIPS, SPINE, CHEST], [[-TILT, 0, 0], O, O], SHOULDER);
    const WRIST_END_R: V3 = [shEndR[0] - 0.1, 0.058, shEndR[2] + 0.02];
    const FIST_END_L: V3 = [shEndL[0] + 0.1, 0.05, shEndL[2] + 0.06];
    const SPEAR_LIE = unit([-0.12, (0.029 - (WRIST_END_R[1] + 0.014)) / 0.76, -1]); // the rings touch the ground
    const FLAG_LIE = unit([-1, -0.12, 0.25]);
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.2, 0.35], [0.3, 0]] as const);
        const sag = keys(p, [[0.08, 0], [0.32, 1]] as const);
        const stepR = keys(p, [[0.1, 0], [0.26, 1]] as const);
        const fall = keys(p, [[0.3, 0], [0.64, 1], [0.7, 0.955], [0.78, 1]] as const);
        const f2 = fall * fall;
        const stand = 1 - f2;
        const armFall = keys(p, [[0.4, 0], [0.72, 1]] as const); // the arm lowers
        const tip = keys(p, [[0.3, 0], [0.64, 1]] as const); // the spear tips back first, so its butt rises
        // Standing, the feet stay down (the right one steps back); lying, the end pose.
        const hipZ = -0.025 * hitB - 0.03 * sag;
        const stL = -Math.asin(clamp1(-hipZ / LEG)) / DEG;
        const stR = -Math.asin(clamp1((-0.06 * stepR - hipZ) / LEG)) / DEG;
        const drop = Math.min(legDrop(LEG, stL), legDrop(LEG, stR)) + 0.012 * sag;
        const lift: V3 = [0, -drop * stand - DROP * f2, hipZ * stand + BACK_Z * f2];
        const tilt = 4 * sag * stand - TILT * f2;
        const rh: V3 = [tilt, 6 * sag * stand, 0];
        const rs: V3 = [-8 * hitB + 6 * sag * stand, 0, 0];
        const rc: V3 = [-10 * hitB + 8 * sag * stand, 0, 3 * sag * stand];
        const toChest = toChestOf(lift, rh, rs, rc);

        // The spear arm lowers in the stagger and lies out on the ground at the end.
        const wristR = lerp(lerp(WRIST_R, [-0.25, 0.325, 0.06], sag), toChest(WRIST_END_R), armFall);
        const armR = reach(ARM_R, wristR, lerp(ELBOW_R, [-0.45, 0.33, -0.05], armFall));
        const chainR = [rh, rs, rc, armR.upper, armR.lower];
        const carry = turn([rh, rs, rc], unit(lerp(SPEAR_DIR, [-0.45, 0.85, 0.2], sag)));
        const dir = unit(lerp(carry, SPEAR_LIE, tip));
        const up = unit(lerp(turn([rh, rs, rc], FINGERS), [0, 1, 0], tip));
        const hand = orient(chainR, { dir: SPEAR_DIR, up: FINGERS }, { dir, up });
        // The pennant swings while the tie is high and lies flat once it nears the ground.
        const tie = worldOf(lift, ARM_CHAIN_R, [...chainR, hand], PENNANT_AT);
        const flat = Math.min(1, Math.max(0, (0.27 - tie[1]) / 0.2));
        const hang = swing((1 - flat) * keys(p, [[0, 0], [0.08, -18], [0.22, 12], [0.34, -6], [0.5, 22], [0.66, 0]] as const, 'spline'));
        const flagDir = unit(lerp(hang(PEN_DIR), FLAG_LIE, flat * flat * (3 - 2 * flat)));
        const flagUp = unit(lerp(hang(PEN_FACE), [0, 1, 0], flat * flat * (3 - 2 * flat)));
        // The free arm flies up in the blow, out in the stagger, and lies on the ground.
        const fistL = lerp(add(lerp(FIST_L, [0.27, 0.3, 0.1], sag), [0, 0.04 * hitB, 0.03 * hitB]), toChest(FIST_END_L), armFall);
        const armL = reach(ARM_L, fistL, lerp(ELBOW_L, [0.45, 0.33, -0.05], armFall));
        // A leg swings forward until its boot (heel or toe) clears the ground at the current hip height.
        const legWorld = (st: number, end: number) => {
          const foot = -st * stand + 10 * f2;
          let a = st * stand + end * f2;
          for (let i = 0; i < 90; i++) {
            const b = (a + foot) * DEG;
            const low = 0.195 + lift[1] - 0.125 * Math.cos(a * DEG) - 0.07 * Math.cos(b) - Math.max(-0.05 * Math.sin(b), 0.1 * Math.sin(b));
            if (low >= 0.004) break;
            a -= 1;
          }
          return a;
        };
        const legL = legWorld(stL, -62);
        const legR = legWorld(stR, -57);
        return {
          hips: { move: lift, rotate: rh },
          spine: { rotate: rs },
          chest: { rotate: rc },
          neck: { rotate: [-6 * hitB + 6 * sag * stand, 0, 0] },
          head: { rotate: [-14 * hitB + 10 * sag * stand - 16 * fall * stand, -26 * fall, 0] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          pennant: { rotate: flagTo([...chainR, hand], flagDir, flagUp) },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          // The legs lie forward along the ground, a little apart; the toes turn up.
          'leg.L': { rotate: [legL - tilt, 0, 7 * f2] },
          'leg.R': { rotate: [legR - tilt, 0, -7 * f2] },
          'foot.L': { rotate: [-stL * stand + 10 * f2, 0, 0] },
          'foot.R': { rotate: [-stR * stand + 10 * f2, 0, 0] },
        };
      },
    });

    // Salute: a fist to the heart. The guard stands straight, lifts the spear upright and plants it
    // beside his right side, and strikes the left fist to the left of his chest, over the heart,
    // with the elbow out. He holds it, gives a small nod, and returns to rest. The arm solves by
    // `reach` to a chest point it can reach; no bone scales.
    const HEART_X = 0.05;
    const HEART_Y = 0.35;
    const chestFront = sdf.raycast(sdf.union(tabardBase.round(0.01), emblem), [HEART_X, HEART_Y, 1], [0, 0, -1])![2];
    const HEART: V3 = [HEART_X, HEART_Y, chestFront + 0.052]; // the fist's center, its knuckles on the chest
    const ELBOW_OUT: V3 = [0.5, 0.46, -0.04]; // the pole: the elbow goes out to the side
    k.animation('salute', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => {
        const up = keys(p, [[0, 0], [0.16, 1], [0.84, 1], [1, 0]] as const);
        const hop = keys(p, [[0.06, 0], [0.15, 1], [0.22, 0]] as const);
        const thump = keys(p, [[0.2, 0], [0.23, 1], [0.32, 0]] as const);
        const raise = keys(p, [[0.18, 0], [0.4, 1], [0.76, 1], [0.95, 0]] as const);
        const strike = keys(p, [[0.36, 0], [0.4, 1], [0.5, 0]] as const); // the fist meets the chest
        const nod = keys(p, [[0.48, 0], [0.56, 1], [0.66, 0]] as const);
        const lift: V3 = [0, 0.004 * up - 0.004 * thump, 0];
        const rs: V3 = [-2 * up + 1.5 * strike, 0, 0];
        const rc: V3 = [-3 * up - 2.5 * strike, 0, 0];
        const toChest = toChestOf(lift, O, rs, rc);
        // The spear: upright, lifted a hand's width, and planted.
        const armR = reach(ARM_R, toChest(add(WRIST_R, [0.004 * up, 0.035 * hop, 0])), ELBOW_R);
        const chainR = [O, rs, rc, armR.upper, armR.lower];
        const hand = orient(chainR, { dir: SPEAR_DIR, up: FINGERS }, { dir: unit(lerp(SPEAR_DIR, [0, 1, 0], up)), up: FINGERS });
        const hang = swing(keys(p, [[0, 0], [0.15, 8], [0.24, -20], [0.36, 12], [0.5, -6], [0.66, 3], [1, 0]] as const, 'spline'));
        // The left fist: from its rest up and forward, clear of the tabard, to the heart. The target
        // is in the chest's rest frame, so the fist stays on the chest as the chest moves.
        const fist = add(lerp(FIST_L, HEART, raise), mul([0.02, 0, 0.05], Math.sin(Math.PI * raise)));
        const armL = reach(ARM_L, fist, lerp(ELBOW_L, ELBOW_OUT, raise));
        return {
          hips: { move: lift },
          spine: { rotate: rs },
          chest: { rotate: rc },
          head: { rotate: [-3 * up + 8 * nod, 0, 0] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          pennant: { rotate: flagTo([...chainR, hand], hang(PEN_DIR), hang(PEN_FACE)) },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          // Heels together.
          'leg.L': { rotate: [0, 0, -3 * up] },
          'leg.R': { rotate: [0, 0, 3 * up] },
          'foot.L': { rotate: [0, 0, 3 * up] },
          'foot.R': { rotate: [0, 0, -3 * up] },
        };
      },
    });
  },
});
