import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Cleric — Chibi Quest hero (catalog `heroes/magic/cleric`), a dwarf battle-priest, about 0.97 m
 * to the hammer's spike, faces +Z. Target: docs/hero-mockups/cleric_001.png (cropped from
 * docs/character-mockups/chibi-quest-heroes.png). Built on the rogue's head and skeleton, with a
 * wider barrel body and broader shoulders, so he reads as a dwarf of the same hero set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the beard, hammer, and book must read.
 * One idea: a huge braided ginger mane and beard over a stout, armored body, a big warhammer held
 *   upright in one fist and a holy book held like a shield in the other.
 * Proportions: spike 0.97, hammer head 0.8, head 0.675 (eyes 0.632), hairline 0.79, beard to
 *   0.34 with braids to 0.25, shoulders 0.39 (pauldrons out to +-0.27), belt 0.25, tabard hem 0.07.
 * Shape language: square and sturdy (barrel body, octagonal hammer head, book, boots), softened by
 *   the round mane, beard, nose, and cheeks.
 * Palette (60/30/10): royal blue #3d63a8 and cream #ece2c8 cloth; ginger #c8622a hair; gold
 *   #e0b040 crosses and trims as the accent; satin steel #a9b0ba armor; brown leather #7a4a2c.
 * Value plan: the bright ginger mane frames the face (focal point); the cream tabard and gold
 *   cross are the second contrast; the dark book cover and hammer head frame the sides.
 * Bodies: skin, hair (mane, top braid, brows, beard), rings, tunic, tabard, collar, rerebraces,
 *   pauldrons, bracers, gloves, leather, gold, pants, boots, hammer-head, hammer-haft,
 *   hammer-gold, book, book-gold, holy-cross.
 * Rig: the rogue's chibi skeleton with wider shoulders, plus `beard` (braids) and `relic` (the
 *   glowing cross on the book, scaled up for the blessing). The hammer is rigid on the right
 *   hand, the book on the left hand. Clips: idle, walk, run, attack (an overhead hammer smash),
 *   attack2 (a blessing: the book rises and its cross flares), hit, death, victory.
 */

const C = {
  skin: '#f0bf9c',
  blush: '#ec8f7c',
  eyeWhite: '#f6f1ea',
  irisRim: '#1e120a',
  iris: '#5a3218',
  irisLow: '#8a5424',
  pupil: '#110d0b',
  lid: '#1c130f',
  lip: '#b85a48',
  mouth: '#5a2218',
  hair: '#c8622a',
  hairDark: '#96401a',
  hairLight: '#e07a3a',
  blue: '#3d63a8',
  blueDark: '#2c4a82',
  cream: '#ece2c8',
  creamDark: '#d6c8a6',
  gold: '#e0b040',
  steel: '#a9b0ba',
  steelDark: '#5f666f',
  iron: '#6f767f',
  leather: '#7a4a2c',
  leatherDark: '#4e2e1c',
  glove: '#6a3c22',
  pants: '#4a3a30',
  boot: '#7a4a28',
  sole: '#3c2618',
  cover: '#4a3326',
  pages: '#efe4c6',
  haft: '#5a3620',
  holy: '#ffd45a',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.1, 0.632] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. Broad shoulders. The right forearm points forward and holds the hammer upright; the
// left forearm carries the book against the left hip.
const SHOULDER: V3 = [0.16, 0.39, 0];
const ELBOW_R: V3 = [-0.236, 0.338, -0.004];
const WRIST_R: V3 = [-0.27, 0.322, 0.094];
const ELBOW_L: V3 = [0.22, 0.335, 0.0];
const WRIST_L: V3 = [0.25, 0.29, 0.085];
const HIP: V3 = [0.075, 0.195, 0];
const ANKLE: V3 = [0.105, 0.07, 0];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

const rad = Math.PI / 180;
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotY = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

/** A big fist hanging from the wrist at the origin; its grip hole runs along Z. */
const palmLocal = (s: 1 | -1) => sdf.ellipsoid([0.043, 0.048, 0.05]).at(0.008 * s, -0.042, 0.004);
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    palmLocal(s),
    sdf.capsule([-0.01 * s, -0.064, 0.034], [-0.006 * s, -0.042, 0.048], 0.019),
    sdf.cone([0.023 * s, -0.026, 0.028], [0.001 * s, -0.037, 0.054], 0.018, 0.014),
  );
/** A fingerless leather glove: the back of the hand and a flared cuff over the wrist. */
const gloveLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.012,
    palmLocal(s).round(0.005).smoothIntersect(0.006, sdf.halfSpace([-s, 0, 0], 0.006)).intersect(sdf.halfSpace([0, 1, 0], -0.012)),
    sdf.cone([0, 0.004, 0], [0, -0.03, 0], 0.046, 0.05),
  );
const HAND_R = { pitch: -84, roll: 17 };
const HAND_L = { pitch: -70, roll: 20 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);
const GRIP = handPoint(HAND_R, WRIST_R, [-0.008, -0.044, 0.004]);
const HAFT_AXIS = norm(rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll));

// The hammer: grip in the fist, a long leather-wrapped haft, a big octagonal head at 0.8.
const HAFT_DOWN = (GRIP[1] - 0.06) / HAFT_AXIS[1];
const HAFT_UP = (0.69 - GRIP[1]) / HAFT_AXIS[1];
const HEAD_T = HAFT_UP + 0.1; // the head's center, along the haft from the grip

// The book: upright, cover toward +Z, spine on the -X edge, turned out a little.
const BOOK_TURN = { y: 28, z: -6 };
const BOOK_AT: V3 = [0.3, 0.29, 0.12];
const bookDir = (p: V3) => rotZ(rotY(p, BOOK_TURN.y), BOOK_TURN.z);
const RELIC_AT = add(BOOK_AT, bookDir([0.005, 0, 0.044]));

export default defineAsset({
  name: 'cleric',
  description: 'Chibi dwarf cleric hero with a braided ginger mane and beard, a cross-marked warhammer, and a holy book.',
  detail: 0.005,
  reference: 'docs/hero-mockups/cleric_001.png',

  build(k) {
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      beard: { parent: 'head', at: [0, 0.4, 0.14], tail: [0, 0.24, 0.17] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      relic: { parent: 'hand.L', at: RELIC_AT },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face
    // A little squarer and heavier in the jaw than the young heroes: a mature dwarf face.
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.1, 0.575, 0.07)),
        sdf.ellipsoid([0.13, 0.06, 0.09]).at(0, 0.53, 0.056),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    // A big round dwarf nose with a bulb at the tip.
    const noseZ = faceZ(0, 0.585);
    const nose = sdf
      .smoothUnion(0.02, sdf.ellipsoid([0.048, 0.042, 0.038]).at(0, 0.582, noseZ + 0.012), sdf.ellipsoid([0.022, 0.03, 0.02]).at(0, 0.618, noseZ + 0.002))
      .bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.034, 0.054, 0.036])
        .subtract(sdf.sphere(0.021).at(0.02, 0, 0.01))
        .rotateY(-22)
        .at(0.212, 0.62, -0.002)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.056).bone('neck');

    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.046, 0.04).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.04, 0.035).bone('forearm.R'),
      handPose(HAND_R, WRIST_R)(fistLocal(-1)).bone('hand.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.046, 0.04).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.04, 0.035).bone('forearm.L'),
      handPose(HAND_L, WRIST_L)(fistLocal(1)).bone('hand.L'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.045, 0.049, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.038, 0.044, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.032, 0.038, 0.07]), EYE[0], EYE[1] - 0.005));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.018));
    const pupil = pair(at(sdf.ellipsoid([0.023, 0.026, 0.07]), EYE[0], EYE[1] + 0.002));
    // Heavy upper lids: a thick dark line over the top of each eye.
    const lid = pair(sdf.extrude(profile.arc(0.046, 0.012, 32, 148), 0.3).at(EYE[0], EYE[1] - 0.005, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.011), x + 0.015, EYE[1] + 0.017),
        at(sdf.sphere(0.0055), x - 0.013, EYE[1] - 0.02),
      ]),
    );
    const blush = pair(at(sdf.sphere(0.034), 0.148, 0.58));
    // A small smile in the beard: a lower lip under the mustache with a dark line on top.
    const lipZ = faceZ(0, 0.508);
    const lips = sdf.ellipsoid([0.034, 0.016, 0.03]).at(0, 0.506, lipZ + 0.028).bone('head');
    const smile = sdf.extrude(profile.arc(0.05, 0.008, 240, 300), 0.3).at(0, 0.517 + 0.05, 0.1);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.014, nose, ears)
      .union(armR, armL, lips)
      .paintWhere(blush, C.blush, 0.028)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.01)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(sdf.ellipsoid([0.04, 0.02, 0.04]).at(0, 0.5, lipZ + 0.03), C.lip, 0.006)
      .paintWhere(smile, C.mouth, 0.002)
      .paintWhere(sdf.sphere(0.034).at(0, 0.585, noseZ + 0.05), '#f09c88', 0.022); // a rosy nose tip
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair: mane, top braid, brows, beard
    // The mane: a cap over the skull that comes down to a hairline just above the brows, puffs
    // out over the temples, and runs down behind the ears into the beard.
    const cap = sdf
      .smoothUnion(
        0.04,
        sdf.ellipsoid([HEAD[0] + 0.02, HEAD[1] + 0.022, HEAD[2] + 0.024]).at(0, HEAD_Y + 0.008, -0.014),
        pair(sdf.ellipsoid([0.06, 0.09, 0.11]).at(0.19, 0.735, -0.03)),
        sdf.ellipsoid([0.2, 0.16, 0.1]).at(0, 0.6, -0.14),
      )
      .smoothSubtract(0.022, sdf.ellipsoid([0.2, 0.2, 0.19]).at(0, 0.585, 0.2).displace(0.006, (x) => Math.cos(x * 34)))
      .smoothSubtract(0.012, pair(sdf.ellipsoid([0.05, 0.062, 0.05]).at(0.232, 0.622, 0.004)));
    // Thick locks combed straight back from the hairline.
    const lockAngle = (x: number, y: number, z: number) => Math.atan2(x, Math.max(0.03, y - 0.48)) * 12 + z * 5;
    const locks = (x: number, y: number, z: number) => Math.abs(Math.sin(lockAngle(x, y, z)));
    // The top braid: a herringbone of lobes from the hairline over the crown to the nape.
    const BRAID_C: V3 = [0, HEAD_Y + 0.008, -0.014];
    const braidTop = sdf.smoothUnion(
      0.005,
      ...Array.from({ length: 13 }, (_, i) => {
        const th = 48 - i * 13.5; // degrees from +Y toward +Z
        const r = 0.027 + 0.008 * Math.sin(Math.min(1, i / 3) * Math.PI * 0.5);
        const p: V3 = [0, BRAID_C[1] + 0.232 * Math.cos(th * rad), BRAID_C[2] + 0.224 * Math.sin(th * rad)];
        return sdf
          .union(
            sdf.ellipsoid([r * 0.95, r * 0.85, r * 1.55]).rotateY(38).at(-r * 0.7, 0, 0),
            sdf.ellipsoid([r * 0.95, r * 0.85, r * 1.55]).rotateY(-38).at(r * 0.7, 0, 0),
          )
          .rotateX(th) // local +Y to the outward normal, local +Z along the path
          .at(...p);
      }),
    );
    // Bushy brows: thick arched rolls, the inner ends a little lower (determined), the outer ends
    // curling down.
    const brow = (s: 1 | -1) => {
      const pt = (x: number, y: number, lift: number): V3 => [s * x, y, faceZ(x, y) + lift];
      const a = pt(0.036, 0.716, 0.008);
      const m = pt(0.092, 0.738, 0.012);
      const b = pt(0.148, 0.73, 0.006);
      const c = pt(0.176, 0.708, 0.0);
      return sdf.chain(
        [
          [a[0], a[1], a[2], 0.02],
          [m[0], m[1], m[2], 0.023],
          [b[0], b[1], b[2], 0.018],
          [c[0], c[1], c[2], 0.01],
        ],
        0.012,
      );
    };
    // The beard: sideburns into a big full beard over the chest, a thick mustache under the nose
    // whose ends sweep out past the cheeks.
    const mouthZ = faceZ(0, 0.54);
    const beardMass = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([0.19, 0.135, 0.12]).at(0, 0.47, 0.08),
        sdf.ellipsoid([0.14, 0.1, 0.09]).at(0, 0.395, 0.13),
        pair(sdf.capsule([0.19, 0.66, -0.01], [0.165, 0.5, 0.06], 0.046)),
      )
      .smoothSubtract(0.03, sdf.ellipsoid([0.165, 0.08, 0.2]).at(0, 0.622, 0.12)) // keep cheeks and eyes clear
      .smoothSubtract(0.01, sdf.ellipsoid([0.045, 0.024, 0.04]).at(0, 0.508, lipZ + 0.04)); // room for the lip
    const mustache = pair(
      sdf.chain(
        [
          [0.0, 0.545, mouthZ + 0.034, 0.026],
          [0.05, 0.54, mouthZ + 0.028, 0.032],
          [0.105, 0.522, mouthZ + 0.006, 0.028],
          [0.15, 0.5, mouthZ - 0.018, 0.02],
          [0.18, 0.51, mouthZ - 0.03, 0.012],
        ],
        0.015,
      ),
    );
    const strands = (x: number, y: number, z: number) => Math.sin(x * 70 + Math.sin(y * 20) * 2) * 0.5 + Math.sin(Math.atan2(z, x) * 40) * 0.5;
    const beard = sdf.smoothUnion(0.02, beardMass, mustache).displace(0.003, strands);
    // Three braids hang from the beard, each bound with a ring and ending in a tuft; they swing
    // on the beard bone.
    const braid = (x: number, top: number, bottom: number, z: number, w: number) => {
      const n = 4;
      const lobes = Array.from({ length: n }, (_, i) => {
        const y = top - ((top - bottom) * (i + 0.5)) / n;
        return sdf.ellipsoid([w - i * 0.002, 0.022, w - 0.002 - i * 0.002]).at(x + (i % 2 ? 0.005 : -0.005), y, z);
      });
      const tuft = sdf.smoothUnion(
        0.01,
        sdf.ellipsoid([w * 0.85, 0.03, w * 0.8]).at(x, bottom - 0.03, z + 0.004),
        sdf.cone([x, bottom - 0.04, z + 0.004], [x, bottom - 0.072, z + 0.01], w * 0.7, 0.004),
      );
      return sdf.smoothUnion(0.01, ...lobes, sdf.cone([x, bottom + 0.01, z], [x, bottom - 0.012, z + 0.002], w * 0.7, w * 0.5), tuft);
    };
    const braids = sdf.union(braid(0, 0.35, 0.29, 0.172, 0.026), hard(braid(0.105, 0.42, 0.35, 0.14, 0.024)));
    const hair = sdf
      .smoothUnion(
        0.015,
        cap.displace(0.004, locks).bone('head'),
        brow(1).bone('head'),
        brow(-1).bone('head'),
        beard.bone('head'),
        braids.bone('beard'),
      )
      .smoothUnion(0.007, braidTop.bone('head'))
      .paintFn((x, y, z, base) => {
        // Cap: dark grooves between the swept-back locks. Beard: dark strands hanging down.
        const onCap = y > 0.6 && z < 0.12 && Math.abs(x) < 0.26;
        const g = onCap ? Math.cos(lockAngle(x, y, z)) : Math.sin(x * 110 + Math.sin(y * 20) * 2);
        if (g > 0.975 && onCap) return rgb(C.hairDark);
        if (!onCap && g > 0.92) return rgb(C.hairDark);
        return base;
      });
    k.body('hair', hair, { color: C.hair, roughness: 0.65, detail: 0.004 });
    const ring = (x: number, y: number, z: number) => sdf.torus(0.027, 0.009).at(x, y, z);
    k.body('rings', sdf.union(ring(0, 0.3, 0.172), hard(ring(0.105, 0.365, 0.14))).bone('beard'), {
      color: C.gold,
      roughness: 0.3,
      metalness: 0.9,
    });

    // ------------------------------------------------------------------ body: tunic and tabard
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.48],
            [0.08, 0.475],
            [0.12, 0.45],
            [0.14, 0.41],
            [0.146, 0.34],
            [0.142, 0.29],
            [0.15, 0.24],
            [0.164, 0.19],
            [0.174, 0.162],
            [0.164, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1.22, 1, 0.88]);
    const tunic = torso.paintWhere(sdf.halfSpace([0, 1, 0], 0.176), C.gold);
    k.body('tunic', tunic.bone('spine'), { color: C.blue, roughness: 0.8 });

    // The tabard: cream panels down the front and the back, over the tunic and hanging below it,
    // each with a blue shield and a gold cross near the hem, edged in gold.
    const shieldP = profile.polygon(
      [
        [-0.042, 0.04],
        [0.042, 0.04],
        [0.04, -0.01],
        [0, -0.05],
        [-0.04, -0.01],
      ],
      { smooth: true, samples: 3 },
    );
    const crossP = (w: number, h: number, t: number) =>
      sdf.union(sdf.extrude(profile.rect([t, h], t * 0.3), 0.4), sdf.extrude(profile.rect([w, t], t * 0.3), 0.4).at(0, h * 0.18, 0));
    const drapeShell = (z: number) => {
      const d = sdf.cone([0, 0.46, z], [0, 0.066, z], 0.172, 0.2);
      return d.round(0.008).subtract(d.round(-0.008));
    };
    const tabardPanel = (w: number, z: number, emblemY: number) => {
      const panel = sdf.extrude(profile.rect([w, 0.4], 0.02), 0.4).at(0, 0.265, z);
      return drapeShell(z > 0 ? -0.03 : 0.035)
        .smoothIntersect(0.004, panel)
        .paintWhere(panel.round(-0.012).subtract(panel.round(-0.022)).union(panel.subtract(panel.round(-0.008))), C.gold, 0.002)
        .paintWhere(sdf.extrude(shieldP, 0.4).at(0, emblemY, z), C.blue, 0.002)
        .paintWhere(crossP(0.05, 0.07, 0.014).at(0, emblemY - 0.002, z), C.gold, 0.002);
    };
    const tabard = sdf.union(tabardPanel(0.18, 0.2, 0.13), tabardPanel(0.2, -0.2, 0.22));
    k.body('tabard', tabard.bone('spine'), { color: C.cream, roughness: 0.8 });

    // A stiff cream collar stands up behind the neck, between the pauldrons and the mane.
    const collarRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.13, 0.415],
            [0.2, 0.43],
            [0.23, 0.5],
            [0.215, 0.506],
            [0.184, 0.446],
            [0.12, 0.432],
          ],
          { smooth: true, samples: 4 },
        ),
      )
      .scale([1, 1, 0.8])
      .at(0, 0, -0.02);
    const collar = collarRing
      .intersect(sdf.halfSpace([0, 0, 1], 0.03))
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.482), C.gold, 0.002);
    k.body('collar', collar, { color: C.cream, roughness: 0.8, bone: 'chest' });

    // ------------------------------------------------------------------ rerebraces, pauldrons, bracers, gloves
    const rerebrace = sdf.union(
      sdf.cone([0.13, 0.41, 0], lerp(SHOULDER, ELBOW_L, 1.02), 0.053, 0.047).bone('upperarm.L'),
      sdf.cone([-0.13, 0.41, 0], lerp(mx(SHOULDER), ELBOW_R, 1.02), 0.053, 0.047).bone('upperarm.R'),
      sdf.sphere(0.045).at(...ELBOW_L).bone('forearm.L'),
      sdf.sphere(0.045).at(...ELBOW_R).bone('forearm.R'),
    );
    k.body('rerebraces', rerebrace, { color: C.steelDark, roughness: 0.45, metalness: 0.75 });
    // Each pauldron: one big round dome with a heavy gold rim, a smaller lame under it.
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.108 * s, 0.074 * s, 0.104 * s])
        .smoothIntersect(0.006, sdf.halfSpace([0, -1, 0], 0.014 * s))
        .round(0.003);
    const pauldronPose = (s: sdf.Shape) => s.scale(1.12).rotateZ(-24).at(0.195, 0.445, 0);
    const pauldronLocal = sdf.union(lame(1), lame(0.9).at(0.008, -0.04, 0));
    k.body('pauldrons', pair(pauldronPose(pauldronLocal).bone('upperarm.L')), { color: C.steel, roughness: 0.4, metalness: 0.8 });
    const rim = (s: number) =>
      lame(s)
        .round(0.007)
        .subtract(lame(s).round(-0.004))
        .intersect(sdf.box([0.5, 0.026, 0.5]).at(0, -0.014 * s + 0.012, 0));
    const stud = sdf.sphere(0.014).at(0.02, 0.078, 0.0);
    const pauldronGold = pair(pauldronPose(sdf.union(rim(1), rim(0.9).at(0.008, -0.04, 0), stud)).bone('upperarm.L'));
    const bracer = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.28), lerp(e, w, 1.0), 0.043, 0.049).round(0.003);
    k.body('bracers', sdf.union(bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(ELBOW_R, WRIST_R).bone('forearm.R')), {
      color: C.leather,
      roughness: 0.62,
    });
    const gloves = sdf.union(handPose(HAND_R, WRIST_R)(gloveLocal(-1)).bone('hand.R'), handPose(HAND_L, WRIST_L)(gloveLocal(1)).bone('hand.L'));
    k.body('gloves', gloves, { color: C.glove, roughness: 0.6 });

    // ------------------------------------------------------------------ belt, pouches, and gold trims
    const beltY = 0.25;
    const belt = torso.round(0.02).smoothIntersect(0.006, sdf.box([0.6, 0.05, 0.6], 0.006).at(0, beltY, 0));
    const pouch = (x: number) => {
      const p = sdf.surfacePoint(belt, [x, beltY - 0.02, 0.3], 0);
      return sdf
        .union(sdf.box([0.058, 0.066, 0.036], 0.012), sdf.box([0.064, 0.028, 0.042], 0.01).at(0, 0.024, 0.002).paint(C.leatherDark))
        .rotateY((Math.atan2(p[0], p[2]) * 180) / Math.PI)
        .at(p[0], p[1] - 0.026, p[2] + 0.008);
    };
    k.body('leather', sdf.union(belt, pouch(0.145), pouch(-0.145)).bone('spine'), { color: C.leather, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.074, 0.062, 0.014], 0.006).subtract(sdf.box([0.046, 0.034, 0.04], 0.004)), sdf.box([0.01, 0.038, 0.012], 0.003).at(0.006, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    const bracerRings = sdf.union(
      ...[
        [ELBOW_L, WRIST_L, 'forearm.L'],
        [ELBOW_R, WRIST_R, 'forearm.R'],
      ].flatMap(([e, w, b]) => [
        sdf.cone(lerp(e as V3, w as V3, 0.92), lerp(e as V3, w as V3, 1.02), 0.053, 0.054).bone(b as string),
        sdf.cone(lerp(e as V3, w as V3, 0.26), lerp(e as V3, w as V3, 0.36), 0.048, 0.049).bone(b as string),
      ]),
    );
    k.body('gold', sdf.union(buckle.bone('spine'), pauldronGold, bracerRings), { color: C.gold, roughness: 0.3, metalness: 0.9 });

    // ------------------------------------------------------------------ legs and boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.13, 0.05, 0.09]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.1, 0.1, 0.004], 0.054).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });
    // Big round dwarf boots: a wide toe, a folded cuff, a strap with a steel buckle, a dark sole.
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.064, 0.1, 0.02).at(0, 0.07, 0), sdf.ellipsoid([0.075, 0.062, 0.122]).at(0, 0.052, 0.052))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const cuff = sdf.cylinder(0.071, 0.03, 0.012).at(0, 0.104, 0);
    const strap = bootFoot.round(0.004).smoothIntersect(0.004, sdf.box([0.2, 0.024, 0.2], 0.006).rotateX(-18).at(0, 0.074, 0.05));
    const bootBuckle = sdf.box([0.034, 0.03, 0.012], 0.004).subtract(sdf.box([0.018, 0.016, 0.04])).rotateX(-18).at(0, 0.078, 0.128);
    const boot = sdf
      .union(
        bootFoot.paintWhere(sdf.halfSpace([0, 1, 0], 0.018), C.sole),
        cuff.paintWhere(sdf.halfSpace([0, 1, 0], 0.094), C.leatherDark),
        strap.paint(C.leatherDark),
        bootBuckle.paint(C.steel),
      )
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.55 });

    // ------------------------------------------------------------------ the warhammer (right hand)
    const haftAt = (t: number): V3 => add(GRIP, [HAFT_AXIS[0] * t, HAFT_AXIS[1] * t, HAFT_AXIS[2] * t]);
    const haft = sdf
      .capsule(haftAt(-HAFT_DOWN), haftAt(HAFT_UP), 0.018)
      .paintFn((x, y, z, base) => (Math.sin(y * 150 + Math.atan2(z - GRIP[2], x - GRIP[0]) * 2) > 0.55 ? rgb(C.leatherDark) : base));
    k.body('hammer-haft', haft, { color: C.haft, roughness: 0.75, bone: 'hand.R' });
    // Head: a big octagonal block with a cross on the front and back, a beveled striking block on
    // each end, riveted, a steel socket under it and a gold spike on top.
    const headCenter = haftAt(HEAD_T);
    const octo = (r: number, len: number, bevel: number) =>
      sdf.intersect(sdf.box([len, r * 2, r * 2], bevel), sdf.box([len, r * 2, r * 2], bevel).rotateX(45));
    const endBlock = (sx: number) =>
      sdf.intersect(octo(0.086, 0.09, 0.008), sdf.box([0.09, 0.3, 0.3]).at(0, 0, 0)).at(sx * 0.13, 0, 0);
    const hammerLocal = sdf.union(octo(0.095, 0.18, 0.008), endBlock(1), endBlock(-1));
    const rivetsLocal = sdf.union(
      ...[-1, 1].flatMap((sx) =>
        [-1, 1].flatMap((sy) =>
          [-1, 1].flatMap((sz) => [
            sdf.sphere(0.009).at(sx * 0.13 + sx * 0.02, sy * 0.05, sz * 0.078),
            sdf.sphere(0.009).at(sx * 0.064, sy * 0.064, sz * 0.09),
          ]),
        ),
      ),
    );
    const socket = sdf.smoothUnion(
      0.006,
      sdf.cylinder(0.03, 0.07, 0.008).at(0, -0.12, 0),
      sdf.cylinder(0.036, 0.018, 0.006).at(0, -0.094, 0),
      sdf.cylinder(0.034, 0.014, 0.005).at(0, -0.148, 0),
    );
    const headPose = (s: sdf.Shape) => s.at(...headCenter);
    k.body('hammer-head', headPose(sdf.union(hammerLocal, rivetsLocal, socket)), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.75,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 60, y * 60, z * 60, 3),
    });
    const faceCross = (z: number) => crossP(0.1, 0.13, 0.028).scale([1, 1, 0.04]).at(0, -0.008, z);
    const spike = sdf.smoothUnion(
      0.01,
      sdf.cylinder(0.04, 0.02, 0.006).at(0, 0.1, 0),
      sdf.cone([0, 0.1, 0], [0, 0.17, 0], 0.036, 0.004),
    );
    const pommel = sdf.smoothUnion(0.008, sdf.cylinder(0.026, 0.022, 0.005).at(...haftAt(-HAFT_DOWN + 0.012)), sdf.sphere(0.03).at(...haftAt(-HAFT_DOWN - 0.02)));
    const gripRing = sdf.cylinder(0.023, 0.016, 0.004).at(...haftAt(-0.07));
    k.body('hammer-gold', sdf.union(headPose(sdf.union(faceCross(0.094), faceCross(-0.094), spike)), pommel, gripRing), {
      color: C.gold,
      roughness: 0.3,
      metalness: 0.9,
      bone: 'hand.R',
    });

    // ------------------------------------------------------------------ the holy book (left hand)
    const bookPose = (s: sdf.Shape) => s.rotateY(BOOK_TURN.y).rotateZ(BOOK_TURN.z).at(...BOOK_AT);
    const coverShape = sdf.box([0.2, 0.26, 0.078], 0.012);
    const pagesCut = sdf.box([0.21, 0.24, 0.056]).at(0.012, 0, 0);
    const bookLocal = sdf
      .union(coverShape.subtract(pagesCut), sdf.box([0.192, 0.24, 0.056], 0.004).at(0.004, 0, 0).paint(C.pages))
      .paintFn((x, y, z, base) => (Math.abs(z) < 0.027 && x > 0.085 && Math.sin(y * 900) > 0.6 ? [base[0] * 0.85, base[1] * 0.85, base[2] * 0.85] : base));
    k.body('book', bookPose(bookLocal), { color: C.cover, roughness: 0.7, bone: 'hand.L' });
    const corner = (sx: number, sy: number) =>
      sdf.box([0.036, 0.036, 0.082], 0.006).subtract(sdf.box([0.042, 0.042, 0.058]).at(-sx * 0.012, -sy * 0.012, 0)).at(sx * 0.09, sy * 0.12, 0);
    const bookGold = sdf.union(
      corner(1, 1),
      corner(1, -1),
      corner(-1, 1),
      corner(-1, -1),
      sdf.box([0.022, 0.25, 0.082], 0.006).at(-0.098, 0, 0), // spine band
      sdf.box([0.13, 0.016, 0.006], 0.003).at(0.02, 0.1, 0.04), // two cover bands
      sdf.box([0.13, 0.016, 0.006], 0.003).at(0.02, -0.1, 0.04),
    );
    k.body('book-gold', bookPose(bookGold), { color: C.gold, roughness: 0.3, metalness: 0.9, bone: 'hand.L' });
    // The cross on the cover glows a little; the blessing scales it up out of the book.
    k.body('holy-cross', bookPose(crossP(0.09, 0.14, 0.026).scale([1, 1, 0.024]).at(0.005, 0.0, 0.04)).bone('relic'), {
      color: C.gold,
      roughness: 0.3,
      metalness: 0.6,
      emissive: C.holy,
      emissiveIntensity: 0.45,
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        beard: { rotate: [3 * wave(p, 1, 0.35), 0, 2 * wave(p, 1, 0.2)] },
        'forearm.R': { rotate: [-3 * bump(p), 0, 0] },
      }),
    });

    // A short, heavy stride: small leg swing, body roll, the braids bounce on each step.
    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        return {
          hips: {
            move: [0, -legDrop(LEG, legSwing * s) + hop * bump(p, 2, 0.25), 0] as const,
            rotate: [0, 6 * s, 4 * s] as const,
          },
          spine: { rotate: [lean, 0, -2 * s] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, -2 * s] as const },
          beard: { rotate: [5 * wave(p, 2, 0.2) + lean, 0, 5 * s] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.2 * s, 0, 2] as const },
          'upperarm.R': { rotate: [-armSwing * 0.35 * s, 0, -3] as const },
        };
      },
    });
    k.animation('walk', stride(0.95, 24, 26, 3, 0));
    k.animation('run', stride(0.6, 36, 44, 10, 0.03));

    // Posing by targets: the wrist follows keys in the chest's rest frame (reach), and the hand
    // turns so the haft points along its own keys (orient). HAMMER.up is the normal of the cross
    // face; in a swing it turns sideways, so the striking end of the head leads.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const HAMMER = { dir: HAFT_AXIS, up: [0, 0, 1] as V3 };
    const BOOK = { dir: norm(bookDir([0, 1, 0])), up: norm(bookDir([0, 0, 1])) };
    const hammerPose = (wrist: V3, dir: V3, up: V3, pole: V3 = [-0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], HAMMER, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    const bookPoseAt = (wrist: V3, dir: V3, up: V3, pole: V3 = [0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_L, wrist, pole);
      const hand = orient([arm.upper, arm.lower], BOOK, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower }, 'hand.L': { rotate: hand } };
    };

    // attack: an overhead smash. The hammer rises up and back over the right shoulder, its head
    // lagging behind; a short hold at the top; then the body drives it over and down in front on
    // the right side, the knees drop, the spine bends, the head of the hammer hits the ground and
    // bounces a little; a slow recovery back to rest.
    k.animation('attack', {
      duration: 1.15,
      loop: false,
      pose: (_t, p) => {
        // The strike keeps its speed through the keys (spline) and stops dead at the impact;
        // the bounce and the recovery ease in and out (smooth).
        const HIT = 0.58;
        const wristKeys = [
          [0, WRIST_R],
          [0.14, [-0.29, 0.41, 0.05]],
          [0.3, [-0.272, 0.53, -0.04]],
          [0.42, [-0.262, 0.54, -0.055]],
          [0.49, [-0.268, 0.52, 0.06]],
          [0.54, [-0.268, 0.43, 0.15]],
          [HIT, [-0.262, 0.35, 0.16]],
        ] as const;
        const wristAfter = [
          [HIT, [-0.262, 0.35, 0.16]],
          [0.66, [-0.26, 0.37, 0.15]],
          [1, WRIST_R],
        ] as const;
        const dirKeys = [
          [0, HAFT_AXIS],
          [0.14, norm([-0.32, 0.92, -0.22])],
          [0.3, norm([-0.2, 0.8, -0.58])],
          [0.42, norm([-0.12, 0.66, -0.74])],
          [0.49, norm([-0.06, 0.98, 0.1])],
          [0.54, norm([0, 0.8, 0.6])],
          [HIT, norm([0, 0.44, 0.9])],
        ] as const;
        const dirAfter = [
          [HIT, norm([0, 0.44, 0.9])],
          [0.66, norm([0, 0.52, 0.85])],
          [1, HAFT_AXIS],
        ] as const;
        const wrist = p < HIT ? keys(p, wristKeys, 'spline') : keys(p, wristAfter);
        const dir = p < HIT ? keys(p, dirKeys, 'spline') : keys(p, dirAfter);
        const up = keys(
          p,
          [
            [0, [0, 0, 1]],
            [0.2, [-1, 0, 0.1]],
            [0.84, [-1, 0, 0.1]],
            [1, [0, 0, 1]],
          ] as const,
        );
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.44, 0.54, p));
        const smash = ease(0.46, 0.58, p) * (1 - ease(0.7, 1, p));
        const jolt = bump(Math.min(1, Math.max(0, (p - 0.57) / 0.1)));
        return {
          ...hammerPose(wrist, dir, up),
          hips: {
            move: [0, -legDrop(LEG, 22 * smash) - 0.016 * smash - 0.004 * wind, 0.035 * smash - 0.015 * wind],
            rotate: [0, -10 * wind + 8 * smash, 0],
          },
          spine: { rotate: [-7 * wind + 18 * smash, 0, 0] },
          chest: { rotate: [-5 * wind + 10 * smash + 3 * jolt, -16 * wind + 12 * smash, 0] },
          head: { rotate: [8 * wind - 14 * smash, 12 * wind - 10 * smash, 0] },
          beard: { rotate: [-8 * wind + 6 * smash - 12 * jolt, 0, 0] },
          // The book arm swings out and back for balance, then braces forward.
          ...bookPoseAt(
            keys(p, [[0, WRIST_L], [0.3, [0.28, 0.32, 0.02]], [0.5, [0.28, 0.32, 0.02]], [0.6, [0.24, 0.3, 0.13]], [1, WRIST_L]] as const),
            BOOK.dir,
            BOOK.up,
          ),
          'leg.L': { rotate: [2 * wind - 26 * smash, 0, 0] },
          'leg.R': { rotate: [-2 * wind + 18 * smash, 0, 0] },
          'foot.L': { rotate: [18 * smash, 0, 0] },
          'foot.R': { rotate: [-10 * smash, 0, 0] },
        };
      },
    });

    // attack2: a blessing. The dwarf plants the hammer, turns his left side forward, and holds
    // the holy book out at shoulder height beside him (clear of the beard), the cover toward the
    // target; the cross on the cover flares out of the book, big and bright, pulses, and settles.
    k.animation('attack2', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const lift = ease(0.04, 0.32, p) * (1 - ease(0.8, 1, p));
        const flare = ease(0.36, 0.46, p) * (1 - ease(0.64, 0.82, p));
        const pulse = 0.14 * bump(Math.min(1, Math.max(0, (p - 0.44) / 0.2)), 2);
        const wrist = keys(p, [[0, WRIST_L], [0.32, [0.305, 0.45, 0.09]], [0.8, [0.305, 0.46, 0.09]], [1, WRIST_L]] as const);
        // The cover turns to face forward, a little up and out; the book stands upright.
        const want = {
          dir: norm(lerp(BOOK.dir, norm([0.05, 1, -0.2]), lift)),
          up: norm(lerp(BOOK.up, norm([0.3, 0.25, 1]), lift)),
        };
        const s = 1 + 1.7 * flare + pulse;
        return {
          ...bookPoseAt(wrist, want.dir, want.up, [0.6, 0.1, -0.3]),
          relic: { scale: [s, s, s], move: [0.02 * flare, 0.02 * flare, 0.08 * flare] },
          ...hammerPose(
            keys(p, [[0, WRIST_R], [0.3, [-0.28, 0.3, 0.1]], [0.8, [-0.28, 0.3, 0.1]], [1, WRIST_R]] as const),
            lerp(HAFT_AXIS, norm([-0.32, 0.95, 0.05]), lift),
            [0, 0, 1],
          ),
          hips: { move: [0, -0.008 * lift, -0.006 * lift], rotate: [0, -6 * lift, 0] },
          spine: { rotate: [-4 * lift, 0, 0] },
          chest: { rotate: [-3 * lift - 3 * flare, -12 * lift, 2 * lift] },
          head: { rotate: [-5 * lift, 10 * lift, 2 * lift] },
          beard: { rotate: [-3 * lift + 6 * flare, 0, 0] },
          'leg.L': { rotate: [-8 * lift, 0, 0] },
          'leg.R': { rotate: [5 * lift, 0, 0] },
          'foot.L': { rotate: [6 * lift, 0, 0] },
        };
      },
    });

    // hit: the head and chest snap back from a blow, a small step back, a quick return. The
    // hammer swings out to the side, away from the head.
    k.animation('hit', {
      duration: 0.42,
      loop: false,
      pose: (_t, p) => {
        const h = ease(0, 0.18, p) * (1 - ease(0.35, 1, p));
        return {
          hips: { move: [0, -0.006 * h, -0.025 * h], rotate: [0, 6 * h, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, -3 * h] },
          head: { rotate: [-14 * h, -8 * h, 4 * h] },
          beard: { rotate: [10 * h, 0, 4 * h] },
          ...hammerPose(lerp(WRIST_R, [-0.3, 0.34, 0.05], h), lerp(HAFT_AXIS, norm([-0.5, 0.85, -0.1]), h), [0, 0, 1]),
          'upperarm.L': { rotate: [-6 * h, 0, 16 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death: a stagger back, the knees give, and he falls flat on his back. Both arms fling out
    // to the sides as he lands; the hammer ends on the ground beside his right shoulder, pointing
    // away from his head, the book beside his left.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.16)));
        const fling = ease(0.2, 0.62, p);
        // The hammer tips forward out of his grip and comes down along his right side.
        const hammerArm = hammerPose(
          keys(p, [[0, WRIST_R], [0.3, [-0.29, 0.34, 0.1]], [0.66, [-0.33, 0.4, -0.02]]] as const),
          keys(
            p,
            [
              [0, HAFT_AXIS],
              [0.3, norm([-0.3, 0.75, 0.6])],
              [0.5, norm([-0.2, -0.2, 0.96])],
              [0.66, norm([-0.1, -1, -0.02])],
            ] as const,
          ),
          keys(p, [[0, [0, 0, 1]], [0.3, [-1, 0, 0]], [0.66, [-1, 0, 0]]] as const),
          [-0.3, 0.2, -0.4],
        );
        const bookArm = bookPoseAt(
          lerp(WRIST_L, [0.33, 0.4, 0.0], fling),
          norm(lerp(BOOK.dir, norm([0.7, 0.7, 0]), fling)),
          norm(lerp(BOOK.up, [0, 0, 1], fling)),
          [0.3, 0.2, -0.4],
        );
        return {
          ...hammerArm,
          ...bookArm,
          hips: {
            move: [0, -0.034 * fall * fall + 0.02 * bump(fall) + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall],
            rotate: [-86 * fall - 4 * stagger, 0, 0],
          },
          spine: { rotate: [-6 * stagger + 2 * fall, 0, 0] },
          chest: { rotate: [-4 * stagger, 0, 0] },
          neck: { rotate: [4 * fall, 0, 0] },
          head: { rotate: [-16 * stagger + 6 * fall, 18 * fall, 0] },
          beard: { rotate: [12 * stagger - 30 * fall + 8 * land, 0, 0] },
          // The legs lag the fall (they stay under him), then lie out along the ground.
          'leg.L': { rotate: [6 * stagger + 16 * bump(fall) + 22 * fall, 0, 5 * fall] },
          'leg.R': { rotate: [-6 * stagger + 18 * bump(fall) + 24 * fall, 0, -6 * fall] },
          'foot.L': { rotate: [-12 * fall, 0, 0] },
          'foot.R': { rotate: [-16 * fall, 0, 0] },
        };
      },
    });

    // victory: he thrusts the hammer up beside his head (out on the right, never over it), hops,
    // and holds the book to his side; two pumps of the fist.
    k.animation('victory', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const up = ease(0.02, 0.24, p);
        const pump = bump(Math.min(1, Math.max(0, (p - 0.24) / 0.5)), 2);
        const hop = bump(Math.min(1, Math.max(0, (p - 0.2) / 0.22)));
        const wrist: V3 = [-0.31 - 0.03 * pump, 0.5 + 0.03 * pump, 0.05 + 0.03 * pump];
        return {
          ...hammerPose(lerp(WRIST_R, wrist, up), lerp(HAFT_AXIS, norm([-0.3, 1, 0.16 - 0.1 * pump]), up), [0, 0, 1]),
          ...bookPoseAt(lerp(WRIST_L, [0.255, 0.32, 0.11], up), BOOK.dir, BOOK.up),
          hips: { move: [0, 0.04 * hop - 0.006 * pump, 0] },
          spine: { rotate: [-5 * up, 0, 0] },
          chest: { rotate: [-4 * up - 3 * pump, -6 * up, 0] },
          head: { rotate: [-10 * up, -8 * up, -4 * up] },
          beard: { rotate: [-10 * hop + 4 * pump, 0, 0] },
          'leg.L': { rotate: [-10 * hop, 0, 0] },
          'leg.R': { rotate: [8 * hop, 0, 0] },
          'foot.L': { rotate: [14 * hop, 0, 0] },
          'foot.R': { rotate: [10 * hop, 0, 0] },
        };
      },
    });
  },
});
