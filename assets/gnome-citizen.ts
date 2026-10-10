import * as THREE from 'three';
import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Gnome citizen — Chibi Quest fantasy-peoples NPC (catalog `npcs/fantasy-peoples/gnome-citizen`),
 * about 0.95 m to the tip of the pointed hat, faces +Z. Target: docs/npc-mockups/gnome-citizen_001.jpg.
 *
 * Role: a gnome tinkerer of the hill town (the workshop and the market), seen in 3D and as a 128 px
 *   sprite; the red hat with goggles, the white beard, the pink nose, and the brass gadget must read.
 * One idea: a tiny round gnome whose tall bent red hat, long white beard, and big pink nose are bigger
 *   than the rest of him, with a shiny brass gadget held up beside the head.
 * Shape language: round and soft (nose, beard, boots), with the pointed hat and the propeller as the spikes.
 * Palette (60/30/10): red hat #b03a30, white beard and hair #f0ece4, blue tunic #3a5a8a, brown belt, trousers,
 *   and boots (#6b4226, #6b4a2c, #7a4a2c); brass #c8a040 (goggles, buckle, gadget), steel wrench #a8acb4.
 * Built on the humanoid kind (rig, clips) at 0.8 size: everything below is in the kind's units. The
 *   right arm is posed (the gadget held up), the left hand holds the wrench and keeps the clip motion.
 */

// The right arm (left-side coordinates; the kind mirrors it): the forearm points forward at the shoulder
// height, the fist beside the head, so the gadget stands up clear of the head.
const POSE_R = { elbow: [0.26, 0.38, 0.03], wrist: [0.26, 0.42, 0.12] } as const;

const C = {
  hat: '#b03a30',
  nose: '#e8a090',
  hairWhite: '#f0ece4',
  goggle: '#c8a040',
  lens: '#8ab0c0',
  belt: '#6b4226',
  pants: '#6b4a2c',
  boot: '#7a4a2c',
  bootCuff: '#8e5e38',
  cuff: '#7a5a3a',
  brass: '#c8a040',
  brassDark: '#8a6a2a',
  steel: '#a8acb4',
  tunicHem: '#2e4a74',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

// The kind's rest pose of the left arm (humanoid-kind.ts): the item points forward and 20 degrees up.
const E0 = new THREE.Vector3(0.18, 0.332, 0.012);
const W0 = new THREE.Vector3(0.205, 0.238, 0.03);
const deg = 180 / Math.PI;
const unit = (a: THREE.Vector3, b: THREE.Vector3) => new THREE.Vector3().subVectors(b, a).normalize();

export default scaleAsset(
  humanoidAsset({
    name: 'gnome-citizen',
    description:
      'A tiny gnome tinkerer in a tall bent red hat with brass goggles, a long white beard, a big pink nose, a blue tunic with a tool belt, and curled brown boots, holding up a brass wind-up gadget and a steel wrench.',
    reference: 'docs/npc-mockups/gnome-citizen_001.jpg',
    variants: {
      skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
      hair: { white: C.hairWhite, silver: '#b8b4c4', auburn: '#8e3b1c', brown: '#5a301d', blond: '#c4974a' },
      eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
      cloth: { blue: '#3a5a8a', plum: '#6e4a7a', ochre: '#b0823a', moss: '#4f6a3a' },
    },
    presets: {
      tinker: { skin: 'tan', hair: 'silver', eyes: 'green', cloth: 'plum' },
    },
    hair: false,
    undershirt: false,
    pants: C.pants,
    shoes: false,
    lashes: false,
    pose: { R: POSE_R },

    // A delighted grin under the mustache, and thick arched brows pushed up under the hat.
    paintSkin(skin, h) {
      const y = 0.528;
      const grin = profile.polygon(
        [
          [-0.052, 0.013],
          [-0.028, 0.003],
          [0, 0.0],
          [0.028, 0.003],
          [0.052, 0.013],
          [0.043, -0.011],
          [0.021, -0.027],
          [0, -0.032],
          [-0.021, -0.027],
          [-0.043, -0.011],
        ],
        { smooth: true, samples: 6 },
      );
      const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
      const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.01))).intersect(sdf.box([0.056, 0.1, 1]).at(0, y, 0));
      const tongue = h.onFace(sdf.ellipsoid([0.022, 0.012, 0.08]), 0, y - 0.025);
      const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
      const brows = sdf.extrude(profile.arc(0.07, 0.017, 55, 125), 0.3).at(0.1, 0.65, 0.1).mirror('x');
      return skin
        .paintWhere(oldBrows, h.tint.skin!, 0.002)
        .paintWhere(brows, h.tint.brow!, 0.002)
        .paintWhere(mouth, C.mouth)
        .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
        .paintWhere(teeth, C.teeth, 0.002);
    },

    extra(k, h) {
      const { SHOULDER, ELBOW, WRIST, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
      const pair = (s: sdf.Shape) => s.mirror('x');
      const hairColor = k.tint('hair');
      const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
        a[0]! + (b[0]! - a[0]!) * t,
        a[1]! + (b[1]! - a[1]!) * t,
        a[2]! + (b[2]! - a[2]!) * t,
      ];

      // ------------------------------------------------------------------ the tall bent hat
      // A cone from a chain of spheres that leans back and bends over to the gnome's right (x < 0),
      // a rolled brim, a strap, and round goggles pushed up on the crown.
      const hatPose = (s: sdf.Shape) => s.rotateX(-8).at(0, HEAD_Y, 0);
      const cone = sdf
        .chain(
          [
            [0, 0.1, 0, 0.215],
            [0, 0.17, -0.005, 0.2],
            [0, 0.25, -0.015, 0.158],
            [-0.005, 0.33, -0.03, 0.115],
            [-0.02, 0.4, -0.05, 0.08],
            [-0.06, 0.455, -0.065, 0.052],
            [-0.115, 0.485, -0.065, 0.033],
            [-0.17, 0.485, -0.055, 0.02],
          ],
          0.03,
        )
        .scale([1, 1, 0.92])
        .intersect(sdf.halfSpace([0, -1, 0], -0.075));
      const brim = sdf.torus(0.205, 0.03).scale([1, 1, 0.92]).at(0, 0.088, 0);
      const hatLocal = sdf.smoothUnion(0.02, cone, brim);
      k.body('hat', hatPose(hatLocal).bone('head'), {
        color: C.hat,
        roughness: 0.9,
        detail: 0.005,
        bump: (x, y, z) => 0.003 * Math.sin(x * 70 + z * 30) * Math.cos(y * 60),
      });

      // The leather strap round the crown, and the goggles sitting on the front of it.
      const strap = hatLocal.round(0.007).intersect(sdf.box([1, 0.034, 1]).at(0, 0.15, 0));
      const surfZ = (x: number, y: number) => sdf.raycast(hatLocal, [x, y, 1], [0, 0, -1])![2];
      const gy = 0.21;
      const slope = Math.atan2(surfZ(0, gy - 0.03) - surfZ(0, gy + 0.03), 0.06) * deg;
      const goggleAt = (s: sdf.Shape, x: number, lift: number) => s.rotateX(90 - slope).at(x, gy, surfZ(x, gy) + lift);
      const ring = (x: number) => goggleAt(sdf.torus(0.062, 0.016), x, 0.012);
      const lens = (x: number) => goggleAt(sdf.cylinder(0.058, 0.02, 0.005), x, 0.008);
      const bridge = sdf.capsule([-0.04, gy, surfZ(0, gy) + 0.016], [0.04, gy, surfZ(0, gy) + 0.016], 0.011);
      const studs = [-1, 1].flatMap((s) =>
        [0.13, 0.17].map((x) => sdf.sphere(0.013).at(s * x, 0.15, surfZ(x, 0.15) + 0.005)),
      );
      k.body('hatstrap', hatPose(strap).bone('head'), { color: C.belt, roughness: 0.8, detail: 0.004 });
      k.body('goggles', hatPose(sdf.union(ring(0.072), ring(-0.072), bridge, ...studs)).bone('head'), {
        color: C.goggle,
        roughness: 0.35,
        metalness: 0.8,
        detail: 0.004,
      });
      k.body('lenses', hatPose(sdf.union(lens(0.072), lens(-0.072))).bone('head'), { color: C.lens, roughness: 0.15, detail: 0.004 });

      // ------------------------------------------------------------------ hair: a small cap and separate locks
      // Short white hair shows at the temples and the nape under the hat: locks over a cap that hugs the skull.
      const shell = sdf.ellipsoid([0.213, 0.208, 0.198]).at(0, HEAD_Y, 0);
      const cap = shell
        .smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], 0.745))
        .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.585))
        .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.02));
      const nape = [-0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15].map((x) =>
        sdf.chain(
          [
            [x, 0.66, -0.15 + Math.abs(x) * 0.25, 0.034],
            [x * 1.05, 0.59, -0.168 + Math.abs(x) * 0.3, 0.036],
            [x * 0.95, 0.53 + Math.abs(x) * 0.12, -0.14 + Math.abs(x) * 0.25, 0.024],
          ],
          0.01,
        ),
      );
      const temple = (s: number) =>
        [0, 1, 2].map((i) =>
          sdf.chain(
            [
              [s * (0.19 + i * 0.002), 0.75, 0.06 - i * 0.05, 0.034],
              [s * (0.205 + i * 0.001), 0.68, 0.045 - i * 0.045, 0.034],
              [s * (0.205 - i * 0.003), 0.61 - i * 0.012, 0.03 - i * 0.045, 0.024],
              [s * (0.2 - i * 0.006), 0.575 - i * 0.012, 0.02 - i * 0.045, 0.013],
            ],
            0.01,
          ),
        );
      k.body('hair', sdf.smoothUnion(0.012, cap, ...nape, ...temple(1), ...temple(-1)).bone('head'), {
        color: hairColor,
        roughness: 0.6,
        detail: 0.005,
      });

      // ------------------------------------------------------------------ ears, nose, mustache, and beard
      const earSkin = sdf.cone([0.198, 0.6, -0.005], [0.265, 0.7, -0.015], 0.034, 0.011).bone('head');
      k.body('ears', pair(earSkin), { color: h.tint.skin!, roughness: 0.55, detail: 0.004 });

      const noseZ = h.faceZ(0, 0.58);
      k.body('nose', sdf.ellipsoid([0.052, 0.046, 0.05]).at(0, 0.582, noseZ + 0.006).bone('head'), {
        color: C.nose,
        roughness: 0.45,
        detail: 0.004,
      });

      const face = (x: number, y: number, r: number): [number, number, number, number] => [x, y, h.faceZ(x, y) + 0.004, r];
      const stache = pair(
        sdf.chain([face(0.012, 0.559, 0.015), face(0.05, 0.553, 0.016), face(0.09, 0.559, 0.013), [0.12, 0.585, 0.135, 0.009]], 0.01),
      );
      // Beard locks: a fan from the jaw that falls in front of the chest and ends above the belt.
      const lock = (x: number): sdf.Shape => {
        const a = Math.abs(x);
        return sdf.chain(
          [
            [x, 0.5, 0.098, 0.03],
            [x * 1.02, 0.44, 0.15 - a * 0.35, 0.036],
            [x * 0.28, 0.38, 0.165 - a * 0.3, 0.028],
            [x * 0.2, 0.32 + a * 0.35, 0.162 - a * 0.3, 0.02],
            [x * 0.08, 0.285 + a * 0.55, 0.168, 0.011],
          ],
          0.01,
        );
      };
      const jaw = (s: number) =>
        sdf.chain(
          [
            [s * 0.175, 0.57, 0.04, 0.026],
            [s * 0.165, 0.51, 0.08, 0.03],
            [s * 0.135, 0.46, 0.125, 0.03],
          ],
          0.012,
        );
      // The upper beard (jaw, mustache) turns with the head; the long locks hang from the chest bone, so
      // the head's bow and the raised fists of the clips never drag the beard through each other.
      const beardTop = sdf
        .smoothUnion(
          0.012,
          ...[-0.115, 0, 0.115].map(lock),
          jaw(1),
          jaw(-1),
          sdf.ellipsoid([0.1, 0.07, 0.05]).at(0, 0.45, 0.115),
          stache,
        )
        .intersect(sdf.halfSpace([0, -1, 0], -0.43))
        .bone('head');
      const beardLow = sdf
        .smoothUnion(0.012, ...[-0.115, -0.077, -0.04, 0, 0.04, 0.077, 0.115].map(lock))
        .intersect(sdf.halfSpace([0, 1, 0], 0.47))
        .bone('chest');
      k.body('beard', beardTop, { color: hairColor, roughness: 0.65, detail: 0.005 });
      k.body('beardlow', beardLow, { color: hairColor, roughness: 0.65, detail: 0.005 });

      // ------------------------------------------------------------------ blue tunic with long sleeves
      const sleeves = h.perArm((j) =>
        sdf.smoothUnion(
          0.015,
          sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
          sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.043, 0.04).bone('forearm.L'),
        ),
      );
      const skirt = sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.3],
              [0.134, 0.3],
              [0.15, 0.26],
              [0.162, 0.21],
              [0.168, 0.168],
              [0, 0.168],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.82]);
      const tunic = sdf
        .smoothUnion(0.012, h.weighted(h.torso.round(0.006)), sleeves, h.weighted(skirt))
        .paintWhere(h.band(0.168, 0.182), C.tunicHem, 0.003);
      k.body('tunic', tunic, { color: h.tint.shirt!, roughness: 0.85 });

      // The brown cuffs.
      const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.8), lerp(j.ELBOW, j.WRIST, 1.02), 0.043, 0.044).round(0.002).bone('forearm.L'));
      k.body('cuffs', cuffs, { color: C.cuff, roughness: 0.8, detail: 0.004 });

      // ------------------------------------------------------------------ belt, buckle, and small tools
      const belt = h.weighted(h.torso.round(0.016).intersect(h.band(0.238, 0.266)));
      k.body('belt', belt, { color: C.belt, roughness: 0.75, detail: 0.004 });
      const bz = h.torso.round(0.016);
      const buckleZ = sdf.raycast(bz, [0, 0.252, 1], [0, 0, -1])![2];
      const buckle = sdf
        .box([0.056, 0.04, 0.014], 0.004)
        .subtract(sdf.box([0.036, 0.022, 0.1], 0.003))
        .at(0, 0.252, buckleZ + 0.002)
        .bone('spine');
      const pouch = (s: number) =>
        sdf
          .smoothUnion(
            0.006,
            sdf.box([0.045, 0.06, 0.036], 0.012).at(s * 0.095, 0.222, 0.082),
            sdf.capsule([s * 0.085, 0.24, 0.085], [s * 0.075, 0.31, 0.095], 0.011),
            sdf.capsule([s * 0.105, 0.24, 0.085], [s * 0.125, 0.3, 0.09], 0.011),
          )
          .bone('hips');
      k.body('pouches', sdf.union(pouch(1), pouch(-1)), { color: C.pants, roughness: 0.8, detail: 0.004 });
      k.body('buckle', buckle, { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.004 });

      // ------------------------------------------------------------------ boots with cuffs and curled toes
      const boot = sdf
        .smoothUnion(
          0.02,
          sdf.ellipsoid([0.058, 0.045, 0.09]).at(0, 0.045, 0.035).bone('foot.L'),
          sdf.sphere(0.052).at(0, 0.055, -0.005).bone('foot.L'),
          sdf.chain(
            [
              [0, 0.04, 0.09, 0.034],
              [0, 0.05, 0.135, 0.028],
              [0, 0.075, 0.163, 0.021],
              [0, 0.1, 0.162, 0.015],
            ],
            0.01,
          ).bone('foot.L'),
          sdf.cylinder(0.052, 0.08, 0.01).at(0, 0.065, 0).bone('shin.L'),
          sdf.torus(0.052, 0.013).at(0, 0.105, 0).bone('shin.L'),
        )
        .intersect(sdf.halfSpace([0, -1, 0], 0))
        .paintWhere(h.band(0.093, 0.12), C.bootCuff, 0.004)
        .rotateY(12)
        .at(ANKLE[0], 0, 0);
      k.body('boots', pair(boot), { color: C.boot, roughness: 0.65, detail: 0.004 });

      // ------------------------------------------------------------------ the gadget in the right fist
      // Rest pose of the posed arm: the kind turns the fist with the forearm, so the item axis is the
      // kind's "forward and 20 degrees up" turned the same way. The gadget stands on that axis.
      const turn = new THREE.Quaternion().setFromUnitVectors(
        unit(E0, W0),
        unit(new THREE.Vector3(...POSE_R.elbow), new THREE.Vector3(...POSE_R.wrist)),
      );
      const axisL = new THREE.Vector3(0, Math.sin(20 / deg), Math.cos(20 / deg)).applyQuaternion(turn);
      // The gadget leans out 1.1 of its length from the fist axis, so the propeller clears the head.
      const axisR = new THREE.Vector3(-axisL.x - 1.1, axisL.y, axisL.z).normalize();
      const euler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisR), 'ZYX');
      const gripR = h.arms.R.GRIP;
      const gadgetPose = (s: sdf.Shape) =>
        s
          .scale(1.4)
          .rotateX(euler.x * deg)
          .rotateY(euler.y * deg)
          .rotateZ(euler.z * deg)
          .at(-gripR[0], gripR[1], gripR[2]);
      // Built on +Y: the handle through the fist, a brass case with a face, a key at the side, a propeller on top.
      const blade = (a: number) => sdf.ellipsoid([0.052, 0.006, 0.017]).rotateX(14).rotateY(a).at(0, 0.128, 0);
      const gadget = sdf
        .smoothUnion(
          0.006,
          sdf.capsule([0, -0.05, 0], [0, 0.03, 0], 0.017),
          sdf.box([0.06, 0.062, 0.05], 0.014).at(0, 0.056, 0),
          sdf.capsule([0.03, 0.056, 0], [0.056, 0.056, 0], 0.007),
          sdf.cylinder(0.009, 0.04).at(0, 0.1, 0),
          sdf.sphere(0.015).at(0, 0.128, 0),
        )
        .union(sdf.torus(0.018, 0.007).rotateZ(90).at(0.066, 0.056, 0), blade(0), blade(90))
        .paintWhere(sdf.sphere(0.021).at(0, 0.056, 0.03), C.brassDark, 0.004)
        .paintWhere(sdf.box([0.1, 0.075, 0.1]).at(0, -0.04, 0), C.belt, 0.005);
      k.body('gadget', gadgetPose(gadget).bone('knife.R'), { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.004 });

      // ------------------------------------------------------------------ the wrench in the left fist
      const jaw2 = profile.polygon(
        [
          [-0.015, -0.045],
          [0.015, -0.045],
          [0.017, 0.055],
          [0.037, 0.072],
          [0.037, 0.13],
          [0.013, 0.13],
          [0.013, 0.098],
          [-0.013, 0.098],
          [-0.013, 0.13],
          [-0.037, 0.13],
          [-0.037, 0.072],
          [-0.017, 0.055],
        ],
        { smooth: false },
      );
      const wrench = sdf
        .extrude(jaw2, 0.026, 0.005)
        .rotateX(90)
        .rotateZ(90)
        .rotateX(-20)
        .at(...h.arms.L.GRIP);
      k.body('wrench', wrench.bone('knife.L'), { color: C.steel, roughness: 0.35, metalness: 0.8, detail: 0.004 });
    },
  }),
  0.8,
);
