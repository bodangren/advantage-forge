import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Cleric — Chibi Quest hero (catalog `heroes/magic/cleric`), a dwarf battle-priest, about 0.92 m
 * to the hammer's spike, faces +Z. Target: docs/hero-mockups/cleric_001.png (cropped from
 * docs/character-mockups/chibi-quest-heroes.png). Built on the rogue's head and skeleton, with a
 * wider barrel body and broader shoulders, so he reads as a dwarf of the same hero set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the beard, hammer, and book must read.
 * One idea: a huge braided ginger beard over a stout, armored body, a big warhammer raised in one
 *   fist and a holy book held like a shield in the other.
 * Proportions: hammer spike 0.92, head 0.675 (eyes 0.63), beard to 0.34 with braids to 0.24,
 *   shoulders 0.4 (pauldrons out to +-0.26), belt 0.25, tabard hem 0.07.
 * Shape language: square and sturdy (barrel body, hammer head, book, boots), softened by the round
 *   beard and cheeks.
 * Palette (60/30/10): royal blue #3d63a8 and cream #ece2c8 cloth; ginger #c8622a beard; gold
 *   #e0b040 crosses and trims as the accent; satin steel #a9b0ba armor; brown leather #7a4a2c.
 * Value plan: the bright ginger beard frames the face (focal point); the cream tabard and gold
 *   cross are the second contrast; the dark book cover and hammer head frame the sides.
 * Bodies: skin, hair (hair, brows, beard), rings, tunic, tabard, sleeves, pauldrons, bracers,
 *   leather, gold, pants, boots, hammer-head, hammer-haft, hammer-gold, book, book-gold.
 * Rig: the rogue's chibi skeleton with wider shoulders plus `beard` for the braids; the hammer is
 *   rigid on the right hand, the book on the left forearm. Clips: idle, walk, run.
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
  mouth: '#9a4a3a',
  hair: '#c8622a',
  hairDark: '#9a4418',
  blue: '#3d63a8',
  blueDark: '#2c4a82',
  cream: '#ece2c8',
  gold: '#e0b040',
  steel: '#a9b0ba',
  steelDark: '#6f7680',
  iron: '#7c838c',
  sleeve: '#4a4450',
  leather: '#7a4a2c',
  leatherDark: '#503020',
  pants: '#4a3a30',
  boot: '#6e4226',
  sole: '#3c2618',
  cover: '#4a3326',
  pages: '#efe4c6',
  haft: '#5a3620',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.1, 0.636] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. Broad shoulders. The right forearm points forward and holds the hammer upright; the
// left forearm carries the book against the left hip.
const SHOULDER: V3 = [0.16, 0.39, 0];
const ELBOW_R: V3 = [-0.225, 0.34, -0.005];
const WRIST_R: V3 = [-0.245, 0.31, 0.09];
const ELBOW_L: V3 = [0.22, 0.335, 0.0];
const WRIST_L: V3 = [0.25, 0.29, 0.085];
const HIP: V3 = [0.075, 0.195, 0];
const ANKLE: V3 = [0.105, 0.07, 0];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const rad = Math.PI / 180;
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

/** A big fist hanging from the wrist at the origin; its grip hole runs along Z. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.043, 0.048, 0.05]).at(0.008 * s, -0.042, 0.004),
    sdf.capsule([-0.01 * s, -0.064, 0.034], [-0.006 * s, -0.042, 0.048], 0.019),
    sdf.cone([0.023 * s, -0.026, 0.028], [0.001 * s, -0.037, 0.054], 0.018, 0.014),
  );
const HAND_R = { pitch: -84, roll: 2 };
const HAND_L = { pitch: -70, roll: 20 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);
const GRIP = handPoint(HAND_R, WRIST_R, [-0.008, -0.044, 0.004]);
const HAFT_AXIS = rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll);

export default defineAsset({
  name: 'cleric',
  description: 'Chibi dwarf cleric hero with a braided ginger beard, a cross-marked warhammer, and a holy book.',
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
    // A big round dwarf nose.
    const nose = sdf.ellipsoid([0.038, 0.034, 0.032]).at(0, 0.588, faceZ(0, 0.588) + 0.008).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.048, 0.034])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.615, -0.005)
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
    const eyeWhite = pair(at(sdf.ellipsoid([0.046, 0.05, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.038, 0.044, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.032, 0.038, 0.07]), EYE[0], EYE[1] - 0.005));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.018));
    const pupil = pair(at(sdf.ellipsoid([0.024, 0.027, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.045, 0.011, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.011), x + 0.015, EYE[1] + 0.017),
        at(sdf.sphere(0.0055), x - 0.013, EYE[1] - 0.02),
      ]),
    );
    const blush = pair(at(sdf.sphere(0.032), 0.14, 0.585));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.014, nose, ears)
      .union(armR, armL)
      .paintWhere(blush, C.blush, 0.028)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.01)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(sdf.sphere(0.03).at(0, 0.588, faceZ(0, 0.588) + 0.04), '#f09c88', 0.02); // a rosy nose tip
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair, brows, beard
    // Hair combed straight back from a high forehead, in thick ridges.
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.018, HEAD[1] + 0.02, HEAD[2] + 0.02])
      .at(0, HEAD_Y + 0.01, -0.012)
      .smoothSubtract(0.025, sdf.ellipsoid([0.25, 0.24, 0.2]).at(0, 0.61, 0.19))
      .smoothSubtract(0.01, pair(sdf.sphere(0.05).at(0.21, 0.61, -0.005)));
    const ridges = (x: number, _y: number, _z: number) => Math.abs(Math.sin(x * 70));
    // Bushy brows: short thick rolls that stand off the face.
    const brow = (s: 1 | -1) => {
      const pt = (x: number, y: number, lift: number): V3 => [s * x, y, faceZ(x, y) + lift];
      const a = pt(0.045, 0.728, 0.004);
      const m = pt(0.1, 0.738, 0.008);
      const b = pt(0.152, 0.728, 0.002);
      return sdf.chain(
        [
          [a[0], a[1], a[2], 0.016],
          [m[0], m[1], m[2], 0.018],
          [b[0], b[1], b[2], 0.01],
        ],
        0.01,
      );
    };
    // The beard: sideburns into a big full beard over the chest, a thick mustache under the nose.
    const mouthZ = faceZ(0, 0.54);
    const beardMass = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([0.18, 0.13, 0.12]).at(0, 0.47, 0.08),
        sdf.ellipsoid([0.13, 0.1, 0.09]).at(0, 0.4, 0.13),
        pair(sdf.capsule([0.185, 0.64, 0.0], [0.16, 0.5, 0.06], 0.045)),
      )
      .smoothSubtract(0.03, sdf.ellipsoid([0.16, 0.08, 0.2]).at(0, 0.62, 0.12)); // keep cheeks and eyes clear
    const mustache = pair(
      sdf.chain(
        [
          [0.0, 0.542, mouthZ + 0.03, 0.026],
          [0.05, 0.536, mouthZ + 0.024, 0.03],
          [0.1, 0.52, mouthZ + 0.004, 0.025],
          [0.13, 0.49, mouthZ - 0.015, 0.014],
        ],
        0.015,
      ),
    );
    const strands = (x: number, y: number, z: number) => Math.sin(x * 70 + Math.sin(y * 20) * 2) * 0.5 + Math.sin(Math.atan2(z, x) * 40) * 0.5;
    const beard = sdf.smoothUnion(0.02, beardMass, mustache).displace(0.003, strands);
    // Three braids hang from the beard, each bound with a ring; they swing on the beard bone.
    const braid = (x: number, top: number, bottom: number, z: number) => {
      const n = 4;
      const lobes = Array.from({ length: n }, (_, i) => {
        const y = top - ((top - bottom) * (i + 0.5)) / n;
        return sdf.ellipsoid([0.024 - i * 0.002, 0.022, 0.022 - i * 0.002]).at(x + (i % 2 ? 0.005 : -0.005), y, z);
      });
      return sdf.smoothUnion(0.01, ...lobes, sdf.cone([x, bottom + 0.01, z], [x, bottom - 0.03, z + 0.004], 0.018, 0.004));
    };
    const braids = sdf.union(braid(0, 0.35, 0.25, 0.175), hard(braid(0.1, 0.4, 0.32, 0.14)));
    const hair = sdf
      .smoothUnion(0.015, cap.displace(0.004, ridges).bone('head'), brow(1).bone('head'), brow(-1).bone('head'), beard.bone('head'), braids.bone('beard'))
      .paintFn((x, y, z, base) => (Math.sin(x * 110 + Math.sin(y * 20) * 2) > 0.88 ? rgb(C.hairDark) : base));
    k.body('hair', hair, { color: C.hair, roughness: 0.65, detail: 0.004 });
    const ring = (x: number, y: number, z: number) => sdf.torus(0.026, 0.008).at(x, y, z);
    k.body('rings', sdf.union(ring(0, 0.3, 0.175), hard(ring(0.1, 0.36, 0.14))).bone('beard'), {
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
            [0.162, 0.18],
            [0.172, 0.14],
            [0.162, 0.128],
            [0, 0.128],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1.22, 1, 0.88]);
    const tunic = torso.paintWhere(sdf.halfSpace([0, 1, 0], 0.15), C.gold);
    k.body('tunic', tunic.bone('spine'), { color: C.blue, roughness: 0.8 });

    // The tabard: a cream panel down the front, over the tunic and hanging below it, with a blue
    // shield and a gold cross near the hem, edged in gold.
    const panel = sdf.extrude(profile.rect([0.15, 0.4], 0.02), 0.4).at(0, 0.265, 0.2);
    // One smooth, gently flared cone in front of the body: it hangs from the belt over the tunic.
    const drape = sdf.cone([0, 0.46, -0.03], [0, 0.066, -0.03], 0.172, 0.2);
    const tabardShell = drape.round(0.008).subtract(drape.round(-0.008));
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
    const tabard = tabardShell
      .smoothIntersect(0.004, panel)
      .paintWhere(panel.round(-0.012).subtract(panel.round(-0.02)).union(panel.subtract(panel.round(-0.008))), C.gold, 0.002)
      .paintWhere(sdf.extrude(shieldP, 0.4).at(0, 0.13, 0.2), C.blue, 0.002)
      .paintWhere(crossP(0.05, 0.07, 0.014).at(0, 0.128, 0.2), C.gold, 0.002);
    k.body('tabard', tabard.bone('spine'), { color: C.cream, roughness: 0.8 });

    // ------------------------------------------------------------------ sleeves, pauldrons, bracers
    const sleeves = sdf.union(
      sdf.cone([0.13, 0.41, 0], lerp(SHOULDER, ELBOW_L, 1.05), 0.052, 0.046).bone('upperarm.L'),
      sdf.cone([-0.13, 0.41, 0], lerp(mx(SHOULDER), ELBOW_R, 1.05), 0.052, 0.046).bone('upperarm.R'),
    );
    k.body('sleeves', sleeves, { color: C.sleeve, roughness: 0.85 });
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.105 * s, 0.07 * s, 0.1 * s])
        .smoothIntersect(0.006, sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.003);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-24).at(0.185, 0.44, 0);
    const pauldronLocal = sdf.union(lame(1), lame(1.13).at(0, -0.034, 0));
    k.body('pauldrons', pair(pauldronPose(pauldronLocal).bone('upperarm.L')), { color: C.steel, roughness: 0.42, metalness: 0.8 });
    const edge = (s: number, y: number) =>
      lame(s)
        .round(0.003)
        .smoothIntersect(0.004, sdf.box([0.5, 0.016, 0.5]).at(0, -0.009 * s, 0))
        .at(0, y, 0);
    const pauldronTrim = pair(pauldronPose(sdf.union(edge(1, 0), edge(1.13, -0.034))).bone('upperarm.L'));
    const bracer = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.2), lerp(e, w, 1.02), 0.044, 0.05).round(0.003);
    k.body('bracers', sdf.union(bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(ELBOW_R, WRIST_R).bone('forearm.R')), {
      color: C.steel,
      roughness: 0.42,
      metalness: 0.8,
    });

    // ------------------------------------------------------------------ belt, pouches, and gold trims
    const beltY = 0.25;
    const belt = torso.round(0.02).smoothIntersect(0.006, sdf.box([0.6, 0.05, 0.6], 0.006).at(0, beltY, 0));
    const pouch = (x: number) => {
      const p = sdf.surfacePoint(belt, [x, beltY - 0.02, 0.3], 0);
      return sdf
        .union(sdf.box([0.056, 0.062, 0.034], 0.012), sdf.box([0.062, 0.026, 0.04], 0.01).at(0, 0.022, 0.002).paint(C.leatherDark))
        .rotateY((Math.atan2(p[0], p[2]) * 180) / Math.PI)
        .at(p[0], p[1] - 0.026, p[2] + 0.008);
    };
    k.body('leather', sdf.union(belt, pouch(0.14), pouch(-0.14)).bone('spine'), { color: C.leather, roughness: 0.6 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.07, 0.058, 0.014], 0.006).subtract(sdf.box([0.044, 0.032, 0.04], 0.004)), sdf.box([0.01, 0.036, 0.012], 0.003).at(0.006, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    const bracerRings = sdf.union(
      sdf.cone(lerp(ELBOW_L, WRIST_L, 0.94), lerp(ELBOW_L, WRIST_L, 1.04), 0.054, 0.055).bone('forearm.L'),
      sdf.cone(lerp(ELBOW_R, WRIST_R, 0.94), lerp(ELBOW_R, WRIST_R, 1.04), 0.054, 0.055).bone('forearm.R'),
    );
    k.body('gold', sdf.union(buckle.bone('spine'), pauldronTrim, bracerRings), { color: C.gold, roughness: 0.3, metalness: 0.9 });

    // ------------------------------------------------------------------ legs and boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.13, 0.05, 0.09]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.1, 0.1, 0.004], 0.052).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.058, 0.09, 0.02).at(0, 0.065, 0), sdf.ellipsoid([0.066, 0.056, 0.11]).at(0, 0.05, 0.05))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeCap = bootFoot.round(0.003).smoothIntersect(0.006, sdf.box([0.2, 0.2, 0.036], 0.01).at(0, 0.05, 0.158));
    const strap = bootFoot.round(0.004).smoothIntersect(0.004, sdf.box([0.2, 0.024, 0.2], 0.006).at(0, 0.09, 0));
    const boot = sdf
      .union(bootFoot.paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole), toeCap.paint(C.steelDark), strap.paint(C.leatherDark))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the warhammer (right hand)
    const HAFT_DOWN = (GRIP[1] - 0.05) / HAFT_AXIS[1];
    const HAFT_UP = (0.64 - GRIP[1]) / HAFT_AXIS[1];
    const haftAt = (t: number): V3 => add(GRIP, [HAFT_AXIS[0] * t, HAFT_AXIS[1] * t, HAFT_AXIS[2] * t]);
    const haft = sdf
      .capsule(haftAt(-HAFT_DOWN), haftAt(HAFT_UP), 0.017)
      .paintFn((x, y, z, base) => (Math.sin(y * 150 + Math.atan2(z - GRIP[2], x - GRIP[0]) * 2) > 0.55 ? rgb(C.leatherDark) : base));
    k.body('hammer-haft', haft, { color: C.haft, roughness: 0.75, bone: 'hand.R' });
    // Head: an octagonal block with two larger faces, riveted, a cross on the front, gold spike.
    const headCenter = haftAt(HAFT_UP + 0.07);
    const octo = (r: number, len: number) =>
      sdf.intersect(sdf.box([len, r * 2, r * 2], 0.006), sdf.box([len, r * 2, r * 2], 0.006).rotateX(45));
    const hammerHead = sdf
      .union(octo(0.07, 0.13), octo(0.078, 0.05).at(0.09, 0, 0), octo(0.078, 0.05).at(-0.09, 0, 0))
      .at(...headCenter);
    const rivets = sdf.union(
      ...[-1, 1].flatMap((sx) =>
        [-1, 1].flatMap((sy) => [
          sdf.sphere(0.008).at(headCenter[0] + sx * 0.09, headCenter[1] + sy * 0.045, headCenter[2] + 0.07),
          sdf.sphere(0.008).at(headCenter[0] + sx * 0.035, headCenter[1] + sy * 0.05, headCenter[2] + 0.064),
        ]),
      ),
    );
    k.body('hammer-head', sdf.union(hammerHead, rivets), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.75,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 60, y * 60, z * 60, 3),
    });
    const hammerCross = crossP(0.08, 0.1, 0.022).scale([1, 1, 0.05]).at(headCenter[0], headCenter[1] - 0.006, headCenter[2] + 0.07);
    const spike = sdf.cone([0, 0, 0], [0, 0.05, 0], 0.03, 0.004).at(headCenter[0], headCenter[1] + 0.068, headCenter[2]);
    const collar = sdf.cylinder(0.026, 0.03, 0.006).at(...haftAt(HAFT_UP - 0.005));
    const pommel = sdf.smoothUnion(0.008, sdf.cylinder(0.024, 0.02, 0.005).at(...haftAt(-HAFT_DOWN + 0.01)), sdf.sphere(0.026).at(...haftAt(-HAFT_DOWN - 0.018)));
    k.body('hammer-gold', sdf.union(hammerCross, spike, collar, pommel), { color: C.gold, roughness: 0.3, metalness: 0.9, bone: 'hand.R' });

    // ------------------------------------------------------------------ the holy book (left forearm)
    // Local frame: the book stands upright, cover toward +Z, spine on the -X edge.
    const bookPose = (s: sdf.Shape) => s.rotateY(28).rotateZ(-6).at(0.3, 0.28, 0.12);
    const coverShape = sdf.box([0.19, 0.25, 0.07], 0.012);
    const pagesCut = sdf.box([0.2, 0.232, 0.05]).at(0.012, 0, 0);
    const bookLocal = sdf
      .union(coverShape.subtract(pagesCut), sdf.box([0.182, 0.232, 0.05], 0.004).at(0.004, 0, 0).paint(C.pages))
      .paintFn((x, y, z, base) => (Math.abs(z) < 0.024 && x > 0.08 && Math.sin(y * 900) > 0.6 ? [base[0] * 0.85, base[1] * 0.85, base[2] * 0.85] : base));
    k.body('book', bookPose(bookLocal), { color: C.cover, roughness: 0.7, bone: 'forearm.L' });
    const corner = (sx: number, sy: number) =>
      sdf.box([0.034, 0.034, 0.074], 0.006).subtract(sdf.box([0.04, 0.04, 0.05]).at(-sx * 0.012, -sy * 0.012, 0)).at(sx * 0.085, sy * 0.115, 0);
    const bookGold = sdf.union(
      corner(1, 1),
      corner(1, -1),
      corner(-1, 1),
      corner(-1, -1),
      crossP(0.085, 0.13, 0.024).scale([1, 1, 0.02]).at(0.005, 0.0, 0.036),
      sdf.box([0.02, 0.24, 0.074], 0.006).at(-0.094, 0, 0), // spine band
    );
    k.body('book-gold', bookPose(bookGold), { color: C.gold, roughness: 0.3, metalness: 0.9, bone: 'forearm.L' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

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
  },
});
