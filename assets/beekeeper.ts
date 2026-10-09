import * as THREE from 'three';
import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';
import type { ArmJoints } from './parts/humanoid-kind.js';

/**
 * Beekeeper — Chibi Quest settlement NPC (catalog `npcs/settlement/beekeeper`), about 1.0 m to the
 * top of the hat, faces +Z. Target: docs/npc-mockups/beekeeper_001.jpg. Built on the humanoid kind.
 *
 * Role: the honey and wax seller at the farm and the meadow; seen in 3D and as a 128 px sprite. The
 *   wide cream hat with its net veil, the yellow gloves, and the raised honey pot must read.
 * One idea: a cheerful child in a huge cream sun hat and a baggy cream suit, holding up a clay honey
 *   pot with golden honey dripping over the rim.
 * Shape language: round and soft (hat, suit, pot), with the flat brim and the dipper as the hard forms.
 * Palette (60/30/10): cream #ece0c4 / #e8e0cc (hat, suit); brown #6b4226 (boots), #c8804a (pot);
 *   honey yellow #e0b040 (gloves) and #e8a020 (honey) as the accent; blond hair #d8b060.
 * Value plan: the light hat and suit frame the face; the dark boots and clay pot anchor the figure;
 *   the yellow gloves, the honey, and the bee are the accent.
 * Bodies: skin, hat, veil, hair, bee, suit, seams, gloves, boots, pot, honey, dipper.
 * Rig: the humanoid kind's skeleton and clips. The right arm holds out the pot in every clip (a posed
 *   arm); the pot, honey, and dipper are rigid on the grip bone `knife.R`.
 */

const C = {
  hat: '#ece0c4',
  hatBand: '#9a8260',
  veil: '#f6f1ea',
  seam: '#c8bea8',
  glove: '#e0b040',
  boot: '#6b4226',
  bootSole: '#3e2616',
  pot: '#c8804a',
  potDark: '#a8683a',
  honey: '#e8a020',
  dipper: '#9a6a3a',
  bee: '#e0b030',
  beeStripe: '#2a2428',
  beeWing: '#eef2f6',
};

export default humanoidAsset({
  name: 'beekeeper',
  description: 'A cheerful beekeeper in a wide hat with a net veil, a cream work suit, and yellow gloves, holding up a honey pot.',
  reference: 'docs/npc-mockups/beekeeper_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { blond: '#d8b060', brown: '#5a301d', black: '#231a17', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { cream: '#e8e0cc', sand: '#d8c090', blush: '#e2bcae', mist: '#bcc6c4' },
  },
  presets: {
    meadow: { skin: 'fair', hair: 'blond', eyes: 'brown', cloth: 'cream' },
    clover: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'sand' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // The right hand held out in front at chest height, the pot in the fist.
  pose: { R: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } },

  // Thin, high, arched brows over the kind's thick ones (a girl's face, like the mockup).
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.075, 0.008, 56, 124), 0.3).at(0.1, 0.652, 0.1).mirror('x');
    return skin.paintWhere(oldBrows, h.tint.skin!, 0.002).paintWhere(brows, h.tint.brow!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ hat: a round crown and a wide brim
    const hatPose = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y, 0);
    const hatSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.27],
            [0.09, 0.266],
            [0.165, 0.24],
            [0.208, 0.19],
            [0.222, 0.14],
            [0.226, 0.115],
            [0.29, 0.1],
            [0.345, 0.104],
            [0.372, 0.122],
            [0.376, 0.108],
            [0.35, 0.082],
            [0.29, 0.07],
            [0.2, 0.074],
            [0, 0.06],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.95]);
    const hatBand = sdf.box([1, 0.026, 1]).at(0, 0.138, 0);
    const hatLocal = hatSolid.paintWhere(hatBand, C.hatBand, 0.003);
    k.body('hat', hatPose(hatLocal).bone('head'), {
      color: C.hat,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60 + x * 20),
    });

    // The veil: soft tulle that hangs from the brim over the hair, in gentle folds, with a scalloped
    // hem. The front is open (pushed back).
    const veilOuter = sdf.revolve(
      profile.polygon(
        [
          [0, 0.12],
          [0.31, 0.12],
          [0.33, 0.09],
          [0.315, 0],
          [0.285, -0.07],
          [0.265, -0.14],
          [0, -0.14],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const veilInner = sdf.revolve(
      profile.polygon(
        [
          [0, 0.13],
          [0.298, 0.13],
          [0.318, 0.09],
          [0.303, 0],
          [0.273, -0.07],
          [0.253, -0.15],
          [0, -0.15],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const frontOpen = sdf.box([0.4, 0.7, 0.5], 0.06).at(0, 0, 0.3);
    const hem = sdf
      .box([0.9, 0.4, 0.9])
      .displace(0.02, (x, y, z) => Math.sin(Math.atan2(x, z) * 9) + 0.5 * Math.sin(Math.atan2(x, z) * 17))
      .at(0, -0.14 + 0.2, 0);
    const veil = veilOuter
      .subtract(veilInner)
      .subtract(frontOpen)
      .intersect(hem)
      .displace(0.007, (x, y, z) => Math.sin(Math.atan2(x, z) * 7 + y * 9) * Math.min(1, Math.max(0, 0.1 - y) * 8));
    k.body('veil', hatPose(veil).bone('head'), {
      color: C.veil,
      roughness: 0.95,
      opacity: 0.5,
      detail: 0.0055,
    });

    // The bee on the crown, on the viewer's left: a striped body, a head, and two wings, sunk into the crown.
    const crown = sdf.raycast(hatLocal, [-0.07, 0.6, 0.1], [0, -1, 0]) ?? [-0.07, 0.29, 0.1];
    const beeAt = (s: sdf.Shape) => s.rotateY(-35).rotateX(-10).at(crown[0], crown[1] + 0.012, crown[2]);
    const beeBody = sdf.smoothUnion(
      0.006,
      sdf.ellipsoid([0.034, 0.026, 0.026]),
      sdf.sphere(0.021).at(0.034, 0.002, 0),
    );
    const stripes = sdf.union(
      ...[-0.012, 0.008].map((x) => sdf.box([0.009, 0.2, 0.2]).at(x, 0, 0)),
    );
    const bee = beeAt(
      beeBody
        .paintWhere(stripes, C.beeStripe, 0.001)
        .paintWhere(sdf.sphere(0.024).at(0.036, 0.002, 0), C.beeStripe, 0.001)
        .paintWhere(sdf.box([0.012, 0.2, 0.2]).at(-0.034, 0, 0), C.beeStripe, 0.001),
    );
    k.body('bee', hatPose(bee).bone('head'), { color: C.bee, roughness: 0.55, detail: 0.003 });
    const wings = beeAt(
      sdf.union(
        sdf.ellipsoid([0.016, 0.006, 0.026]).rotateX(-30).at(0.0, 0.03, 0.016),
        sdf.ellipsoid([0.016, 0.006, 0.026]).rotateX(30).at(0.0, 0.03, -0.016),
      ),
    );
    k.body('wings', hatPose(wings).bone('head'), { color: C.beeWing, roughness: 0.4, opacity: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ hair: long and golden under the hat
    // A soft shell open at the face and over the ears, swept bangs, a lock in front of each ear, and
    // loose locks that hang down the back and below the veil.
    const hairColor = k.tint('hair');
    const shell = sdf.ellipsoid([0.226, 0.222, 0.212]).smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], 0.11));
    const faceCut = sdf.box([0.33, 0.6, 0.4], 0.05).at(0, 0.05 - 0.3, 0.27);
    const bob = shell.smoothSubtract(0.02, faceCut);
    const bang = (x0: number, s: number) =>
      sdf.chain(
        [
          [x0, 0.1, 0.172, 0.026],
          [x0 + 0.03 * s, 0.083, 0.19, 0.022],
          [x0 + 0.07 * s, 0.058, 0.18, 0.018],
          [x0 + 0.1 * s, 0.03, 0.16, 0.013],
        ],
        0.01,
      );
    const lockSide = (s: number) =>
      sdf.chain(
        [
          [0.168 * s, 0.04, 0.105, 0.024],
          [0.18 * s, -0.03, 0.1, 0.023],
          [0.186 * s, -0.1, 0.09, 0.021],
          [0.19 * s, -0.13, 0.095, 0.02],
          [0.182 * s, -0.16, 0.103, 0.015],
        ],
        0.012,
      );
    const back = sdf.ellipsoid([0.2, 0.12, 0.125]).at(0, -0.045, -0.065).smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0));
    const rad = (d: number) => (d * Math.PI) / 180;
    const locks = [-62, -40, -18, 4, 24, 46, 64].map((a, i) => {
      const R = 0.186;
      const sway = i % 2 === 0 ? 0.012 : -0.012;
      const at = (r: number, y: number, rw: number): [number, number, number, number] => [(r + sway * (y < -0.1 ? 1 : 0)) * Math.sin(rad(a)), y, -r * Math.cos(rad(a)), rw];
      return sdf.chain([at(R, -0.05, 0.034), at(R + 0.01, -0.09, 0.03), at(R + 0.012, -0.115, 0.024)], 0.012);
    });
    const hair = sdf.smoothUnion(0.015, bob, back, bang(-0.05, -1), bang(0.02, 1), bang(0.05, 1), lockSide(1), lockSide(-1), ...locks);
    k.body('hair', hatPose(hair).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.006 });

    // ------------------------------------------------------------------ the work suit: one baggy jumpsuit
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.049, 0.045).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.95), 0.045, 0.043).bone('forearm.L'),
      ),
    );
    // Baggy legs that run down over the boot tops; a deep seat closes the hem in every clip.
    const leg = sdf.smoothUnion(
      0.02,
      sdf.capsule(HIP, KNEE, 0.062).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.102, 0.002], 0.064, 0.07).bone('shin.L'),
      sdf.sphere(0.068).at(...KNEE).bone('shin.L'), // a knee ball: it keeps the leg closed at every bend
    );
    const pelvis = sdf.ellipsoid([0.134, 0.082, 0.1]).at(0, 0.178, 0).bone('hips');
    const zip = sdf.box([0.007, 0.5, 0.4]).at(0, 0.3, 0.2);
    const suit = sdf
      .smoothUnion(0.035, h.weighted(h.torso.round(0.011)), sleeve, pelvis, pair(leg))
      .paintWhere(zip, C.seam, 0.002)
      .paintWhere(h.band(0.2, 0.208).intersect(sdf.box([0.5, 1, 0.5])), C.seam, 0.002);
    k.body('suit', suit, {
      color: h.tint.shirt ?? '#e8e0cc',
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 30, y * 30, z * 30, 2),
    });

    // The neck band, the elastic cuffs, and the gathered leg hems, in the darker cream.
    const collar = sdf.torus(0.06, 0.019).at(0, 0.452, -0.012).bone('chest');
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.66), lerp(j.ELBOW, j.WRIST, 0.86), 0.046, 0.048).round(0.002).bone('forearm.L'));
    const hemBand = pair(sdf.torus(0.068, 0.011).at(ANKLE[0], 0.104, 0.002).bone('shin.L'));
    const zipPull = sdf.box([0.018, 0.03, 0.012], 0.004).at(0, 0.425, 0.092).bone('chest');
    k.body('seams', sdf.union(collar, cuff, hemBand, zipPull), { color: C.seam, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ yellow gloves: a flared cuff, a palm, finger bumps, a thumb
    // The glove follows the kind's fist: a point in the fist's rest frame turns with the posed forearm.
    const ELBOW0 = new THREE.Vector3(0.18, 0.332, 0.012);
    const WRIST0 = new THREE.Vector3(0.205, 0.238, 0.03);
    const fistFrame = (j: ArmJoints) => {
      const turn = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3().subVectors(WRIST0, ELBOW0).normalize(),
        new THREE.Vector3(j.WRIST[0] - j.ELBOW[0], j.WRIST[1] - j.ELBOW[1], j.WRIST[2] - j.ELBOW[2]).normalize(),
      );
      return (x: number, y: number, z: number): [number, number, number] => {
        const v = new THREE.Vector3(x - WRIST0.x, y - WRIST0.y, z - WRIST0.z).applyQuaternion(turn);
        return [j.WRIST[0] + v.x, j.WRIST[1] + v.y, j.WRIST[2] + v.z];
      };
    };
    const glove = h.perArm((j: ArmJoints) => {
      const fp = fistFrame(j);
      const palm = sdf.sphere(0.05).at(...fp(0.212, 0.202, 0.034));
      const knuckles = [0.17, 0.195, 0.22].map((y) => sdf.capsule(fp(0.198, y, 0.062), fp(0.2, y + 0.002, 0.072), 0.016));
      const thumb = sdf.cone(fp(0.226, 0.218, 0.052), fp(0.206, 0.205, 0.08), 0.024, 0.02);
      return sdf
        .smoothUnion(
          0.016,
          sdf.cone(lerp(j.ELBOW, j.WRIST, 0.68), j.WRIST, 0.052, 0.05).bone('forearm.L'),
          sdf.capsule(j.WRIST, fp(0.212, 0.202, 0.034), 0.046).bone('hand.L'),
          palm.bone('hand.L'),
          sdf.union(...knuckles).bone('hand.L'),
          thumb.bone('hand.L'),
        )
        .round(0.002);
    });
    k.body('gloves', glove, { color: C.glove, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ tall brown boots
    const shoe = sdf.smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.052).at(0, 0.052, -0.005));
    // The shaft follows the shin (not the ankle), so it never turns out of the suit leg when the foot flexes.
    const shaft = sdf.cylinder(0.055, 0.1, 0.014).at(0, 0.07, 0.0);
    const rim = sdf.torus(0.052, 0.009).at(0, 0.116, 0);
    const sole = shoe.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.016)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootAt = (b: sdf.Shape) => b.rotateY(12).at(ANKLE[0], 0, 0);
    const footPart = bootAt(sdf.union(shoe.intersect(sdf.halfSpace([0, -1, 0], 0)), sole.paint(C.bootSole))).bone('foot.L');
    const shaftPart = bootAt(sdf.smoothUnion(0.01, shaft, rim)).bone('shin.L');
    const boot = sdf.smoothUnion(0.02, footPart, shaftPart);
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the honey pot, lid, honey, and dipper
    // Held in the right fist (x < 0), above the grip: a plain round clay pot with a domed lid, honey
    // dripping from under the lid, and a wooden dipper that comes out of the lid.
    // The pot stands on the fist: its base sits just inside the top of the glove's palm.
    const fc = fistFrame(h.arms.R)(0.212, 0.202, 0.034);
    const potPose = (s: sdf.Shape) => s.scale(1.15).rotateZ(8).at(-fc[0] - 0.09, fc[1] + 0.012, fc[2] + 0.05);
    const potBody = sdf.revolve(
      profile.polygon(
        [
          [0, 0.0],
          [0.034, 0.0],
          [0.056, 0.02],
          [0.066, 0.06],
          [0.058, 0.1],
          [0.046, 0.12],
          [0, 0.123],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const lid = sdf.smoothUnion(
      0.008,
      sdf.ellipsoid([0.05, 0.026, 0.05]).at(0, 0.126, 0),
      sdf.torus(0.047, 0.01).at(0, 0.118, 0),
    );
    k.body('pot', potPose(sdf.smoothUnion(0.006, potBody, lid)).bone('knife.R'), {
      color: C.pot,
      roughness: 0.7,
      detail: 0.004,
      bump: (x, y, z) => 0.0015 * Math.sin(y * 120 + Math.sin(x * 40 + z * 40)),
    });

    const drip = (a: number, len: number, r: number) => {
      const out = 0.058 * Math.sin(a);
      const outZ = 0.058 * Math.cos(a);
      return sdf.chain(
        [
          [out * 0.9, 0.126, outZ * 0.9, r + 0.003],
          [out * 1.17, 0.112, outZ * 1.17, r],
          [out * 1.19, 0.112 - len, outZ * 1.19, r * 0.95],
        ],
        0.008,
      );
    };
    const honey = sdf.smoothUnion(0.012, drip(0.25, 0.05, 0.011), drip(-0.9, 0.04, 0.011), drip(2.6, 0.035, 0.01));
    k.body('honey', potPose(honey).bone('knife.R'), { color: C.honey, roughness: 0.2, detail: 0.004 });

    const stick = sdf.capsule([-0.012, 0.135, 0.004], [-0.042, 0.19, -0.012], 0.019);
    const knob = sdf.sphere(0.032).at(-0.046, 0.196, -0.013);
    k.body('dipper', potPose(sdf.smoothUnion(0.01, stick, knob)).bone('knife.R'), { color: C.dipper, roughness: 0.75, detail: 0.003 });
  },
});
