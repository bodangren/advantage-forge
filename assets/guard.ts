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
 *   helmet crest at 0.96, its brim at 0.72, the cheek guards to 0.55; the tabard hem at 0.15.
 * Shape language: round and sturdy (helmet dome, pauldrons, gauntlets, boots) with the straight
 *   spear and the pointed pennant as accents.
 * Palette (60/30/10): sky-blue tabard #6aa2c0 and satin steel #9aa0a8; gold #e0b040 trims and
 *   tower; a teal pennant #3e9aa0; brown hair and mustache #5a3422; brown leather.
 * Value plan: the light face framed by the dark steel helmet and the brown mustache is the focal
 *   point; the blue tabard with the gold tower is the second.
 * Bodies: skin, hair (hair, brows, mustache), helmet, mail, tabard, gold, pauldrons, gauntlets,
 *   belt, trousers, boots, spear-haft, spear-head, flag.
 * Rig: the rogue's skeleton plus `pennant`; the spear is rigid on `hand.R`. Clips: idle, walk,
 *   run, attack (a spear thrust).
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
    const PENNANT_AT: V3 = [GRIP[0], GRIP[1] + SPEAR_TOP - 0.07, GRIP[2]];
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
      pennant: { parent: 'hand.R', at: PENNANT_AT, tail: [PENNANT_AT[0] - 0.14, PENNANT_AT[1] - 0.05, PENNANT_AT[2]] },
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
    const helmOuter = sdf.ellipsoid([0.232, 0.232, 0.222]).at(0, 0.725, -0.01);
    const helmInner = helmOuter.round(-0.014);
    const BRIM_Y = 0.752;
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
    // The pennant: a pointed flag tied below the head, blowing out to the right, rippling.
    const flag = sdf
      .extrude(
        profile.polygon(
          [
            [0, 0.0],
            [-0.14, -0.035],
            [-0.1, -0.06],
            [-0.15, -0.1],
            [0, -0.1],
          ],
          { smooth: false },
        ),
        0.016,
        0.006,
      )
      .displace(0.005, (x) => Math.sin(x * 45))
      .at(PENNANT_AT[0] - 0.012, PENNANT_AT[1] + 0.01, PENNANT_AT[2])
      .paintWhere(sdf.halfSpace([1, 0, 0], PENNANT_AT[0] - 0.1).intersect(sdf.halfSpace([-1, 0, 0], -(PENNANT_AT[0] - 0.115))), C.pennantDark, 0.003);
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

    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number, flap: number) => ({
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
          pennant: { rotate: [0, flap + 10 * wave(p, 2, 0.2), 6 * wave(p, 3, 0.1)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          // The spear arm swings little; the hand keeps the spear upright.
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, -3] as const },
          'hand.R': { rotate: [armSwing * 0.25 * s, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 26, 3, 0, 20));
    k.animation('run', stride(0.56, 40, 44, 12, 0.03, 40));

    // A thrust: pull back and lower the spear to level, drive it forward, and recover.
    // The X angles on the arm bones add up to the spear's tilt (about 90 degrees when level).
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const level = ease(0, 0.3, p) * (1 - ease(0.62, 1, p));
        const wind = ease(0.1, 0.32, p) * (1 - ease(0.32, 0.42, p));
        const hit = ease(0.32, 0.44, p) * (1 - ease(0.58, 0.9, p));
        return {
          hips: { move: [0, -legDrop(LEG, 18 * hit) - 0.006 * wind, 0.045 * hit - 0.015 * wind], rotate: [0, -12 * wind + 16 * hit, 0] },
          spine: { rotate: [-3 * wind + 10 * hit, 0, 0] },
          chest: { rotate: [0, -10 * wind + 12 * hit, 0] },
          'upperarm.R': { rotate: [-50 * level + 25 * wind - 35 * hit, 0, 0] },
          'forearm.R': { rotate: [-10 * level + 15 * wind - 25 * hit, 0, 0] },
          'hand.R': { rotate: [150 * level - 40 * wind + 25 * hit, 0, 0] },
          pennant: { rotate: [0, 30 * hit, 0] },
          'upperarm.L': { rotate: [-20 * level, 0, 10 * level] },
          'leg.R': { rotate: [-18 * hit, 0, 0] },
          'leg.L': { rotate: [12 * hit, 0, 0] },
          'foot.R': { rotate: [10 * hit, 0, 0] },
        };
      },
    });
  },
});
