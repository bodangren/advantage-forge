import * as THREE from 'three';
import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Glassblower — Chibi Quest settlement NPC (catalog `npcs/settlement/glassblower`), about 0.95 m to
 * the top of the hair and 1.0 m to the top of the goggles, faces +Z. Target:
 * docs/npc-mockups/glassblower_001.jpg. Built on the humanoid kind.
 *
 * Role: the craft NPC at the glass workshop (bottles and lenses); seen in 3D and as a 128 px sprite.
 *   The brass goggles on the hair, the glowing orange bubble, and the brown apron must read.
 * One idea: a bright young craftswoman whose wild auburn hair carries big brass goggles, with a
 *   glowing orange bubble on a blowpipe in one fist and a blue glass vase in the other.
 * Shape language: round and soft (hair curls, bubble, vase, boots), with the straight apron panel
 *   and the thin blowpipe as the hard forms.
 * Palette (60/30/10): leather browns #6b4226 (apron) / #5a3a24 (gloves) / #3a2a20 (boots), teal
 *   #2f7a7a shirt, auburn #8e3b1c hair; accents brass #c8a040 and the glowing #ff9a30 bubble.
 * Value plan: the dark leather frames the light skin and the bright teal; the bubble is the lightest
 *   and most saturated point.
 * Bodies: skin, hair, goggles, lenses, shirt, cuffs, gloves, apron, belt, buckles, trousers, boots,
 *   blowpipe, bubble, vase.
 * Rig: the humanoid kind's skeleton and clips, both arms in held poses. The pipe and the bubble are
 *   rigid on `knife.R`, the vase is rigid on `knife.L`.
 */

const C = {
  apron: '#6b4226',
  belt: '#4e2f1b',
  glove: '#5a3a24',
  pants: '#3a3438',
  boot: '#3a2a20',
  brass: '#c8a040',
  lens: '#8ac8d8',
  strap: '#4a3322',
  pipe: '#8a8e98',
  bubble: '#ff9a30',
  vase: '#3f9a9c',
};

type V3 = readonly [number, number, number];
// The hanging rest pose of the left arm (the kind's constants): the arm turns from it to its pose.
const ELBOW0: V3 = [0.18, 0.332, 0.012];
const WRIST0: V3 = [0.205, 0.238, 0.03];
const FIST0: V3 = [0.212, 0.2, 0.034]; // the center of the kind's fist
const ITEM_DIR0: V3 = [0, Math.sin((20 * Math.PI) / 180), Math.cos((20 * Math.PI) / 180)];

export default humanoidAsset({
  name: 'glassblower',
  description: 'A bright young glassblower with goggles on her auburn hair and a leather apron, holding a blowpipe with a glowing bubble and a blue glass vase.',
  reference: 'docs/npc-mockups/glassblower_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { auburn: '#b8501c', brown: '#5a301d', black: '#231a17', blond: '#c4974a', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { teal: '#2f7a7a', amber: '#b8802f', plum: '#6a3f52', indigo: '#3f4f80' },
  },
  presets: {
    furnace: { skin: 'tan', hair: 'brown', eyes: 'green', cloth: 'amber' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // Both fists up and out, as in the mockup: the right one holds the pipe, the left one the vase.
  pose: {
    R: { elbow: [0.19, 0.37, 0.05], wrist: [0.235, 0.39, 0.15] },
    L: { elbow: [0.2, 0.355, 0.04], wrist: [0.245, 0.37, 0.14] },
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    // The turn that takes the hanging forearm to a posed one (the kind turns the fist by it).
    const turnOf = (j: { ELBOW: V3; WRIST: V3 }) =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(WRIST0[0] - ELBOW0[0], WRIST0[1] - ELBOW0[1], WRIST0[2] - ELBOW0[2]).normalize(),
        new THREE.Vector3(j.WRIST[0] - j.ELBOW[0], j.WRIST[1] - j.ELBOW[1], j.WRIST[2] - j.ELBOW[2]).normalize(),
      );
    const posedPoint = (j: { ELBOW: V3; WRIST: V3 }, p: V3): [number, number, number] => {
      const v = new THREE.Vector3(p[0] - WRIST0[0], p[1] - WRIST0[1], p[2] - WRIST0[2]).applyQuaternion(turnOf(j));
      return [j.WRIST[0] + v.x, j.WRIST[1] + v.y, j.WRIST[2] + v.z];
    };
    const posedDir = (j: { ELBOW: V3; WRIST: V3 }): [number, number, number] => {
      const v = new THREE.Vector3(...ITEM_DIR0).applyQuaternion(turnOf(j));
      return [v.x, v.y, v.z];
    };

    // ------------------------------------------------------------------ hair: short wavy auburn, chain locks
    const hairColor = k.tint('hair');
    const cap = sdf.ellipsoid([0.218, 0.212, 0.2]);
    const crown = cap.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.075));
    const back = cap.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.07)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const tips = sdf.union(
      ...[-72, -48, -24, 0, 24, 48, 72].map((a) => sdf.sphere(0.026).at(0.185 * Math.sin((a * Math.PI) / 180), -0.075, -0.17 * Math.cos((a * Math.PI) / 180))),
    );
    const temples = cap
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.02))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.1));
    // The fringe: wavy locks over the forehead, swept from the parting on the right to the left.
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.012);
    const fringe = [
      lock([[-0.09, 0.15, 0.12, 0.026], [-0.06, 0.11, 0.17, 0.024], [-0.02, 0.085, 0.192, 0.02], [0.03, 0.072, 0.196, 0.015]]),
      lock([[-0.02, 0.17, 0.115, 0.026], [0.02, 0.125, 0.17, 0.024], [0.06, 0.09, 0.19, 0.02], [0.1, 0.07, 0.178, 0.014]]),
      lock([[0.07, 0.165, 0.1, 0.026], [0.11, 0.125, 0.14, 0.022], [0.15, 0.09, 0.14, 0.018], [0.17, 0.05, 0.12, 0.013]]),
      lock([[-0.14, 0.12, 0.08, 0.025], [-0.16, 0.08, 0.11, 0.021], [-0.175, 0.04, 0.11, 0.016], [-0.17, 0.0, 0.1, 0.012]]),
    ];
    // Curls that stick out at the crown and the nape.
    const curls = [
      lock([[0.13, 0.12, 0.0, 0.034], [0.18, 0.13, -0.02, 0.028], [0.215, 0.1, -0.03, 0.022], [0.215, 0.06, -0.03, 0.016]]),
      lock([[-0.13, 0.12, -0.01, 0.034], [-0.18, 0.13, -0.03, 0.028], [-0.215, 0.1, -0.04, 0.022], [-0.215, 0.06, -0.04, 0.016]]),
      lock([[0.0, 0.18, -0.06, 0.034], [0.05, 0.2, -0.06, 0.026], [0.09, 0.185, -0.05, 0.018]]),
      lock([[-0.09, 0.18, 0.04, 0.03], [-0.13, 0.19, 0.02, 0.024], [-0.16, 0.165, 0.0, 0.016]]),
      lock([[0.1, -0.05, -0.15, 0.026], [0.14, -0.1, -0.13, 0.02], [0.145, -0.135, -0.1, 0.013]]),
      lock([[-0.1, -0.05, -0.15, 0.026], [-0.14, -0.1, -0.13, 0.02], [-0.145, -0.135, -0.1, 0.013]]),
    ];
    const locks = headPose(sdf.union(...fringe, ...curls));
    const hair = headPose(sdf.smoothUnion(0.015, crown, back, tips, temples, ...fringe, ...curls))
      .paintWhere(locks, k.tint('hair', { color: '#e8782c', follow: 1 }), 0.01)
      .bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ goggles: brass rings, lenses, and a strap
    // A point on the hair cap at x and at an elevation angle in the YZ plane, with its up normal.
    const onCap = (x: number, elev: number, lift: number) => {
      const s = Math.sqrt(1 - (x / 0.218) ** 2);
      const e = (elev * Math.PI) / 180;
      return [x, 0.212 * s * Math.sin(e) + lift * Math.sin(e), 0.2 * s * Math.cos(e) + lift * Math.cos(e)] as const;
    };
    const ELEV = 62;
    const ringAt = (s: sdf.Shape, x: number) => {
      const p = onCap(x, ELEV, 0.026);
      return headPose(s.rotateX(90 - ELEV).rotateZ(x > 0 ? -7 : 7).at(...p));
    };
    const ringShape = sdf.smoothUnion(0.005, sdf.torus(0.062, 0.015), sdf.torus(0.062, 0.012).at(0, -0.016, 0), sdf.torus(0.07, 0.009).at(0, 0.006, 0));
    const lensShape = sdf.cylinder(0.062, 0.014, 0.004);
    const frame = sdf.union(ringAt(ringShape, 0.088), ringAt(ringShape, -0.088));
    const bridge = headPose(sdf.capsule([-0.03, 0.215, 0.135], [0.03, 0.215, 0.135], 0.012));
    const strap = headPose(
      sdf.torus(0.186, 0.011).scale([1, 1, 0.99]).rotateX(-14).at(0, 0.11, -0.002).intersect(sdf.box([0.5, 0.5, 0.2], 0.02).at(0, 0.1, 0.07)),
    ).bone('head');
    k.body('goggles', sdf.smoothUnion(0.008, frame, bridge).bone('head'), { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.003 });
    k.body('strap', strap, { color: C.strap, roughness: 0.8, detail: 0.004 });
    k.body('lenses', sdf.union(ringAt(lensShape, 0.088), ringAt(lensShape, -0.088)).bone('head'), {
      color: C.lens,
      roughness: 0.1,
      opacity: 0.6,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ shirt: sleeves rolled to the elbow
    const sleeve = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), lerp(j.ELBOW, j.WRIST, 0.05), 0.047, 0.045).bone('upperarm.L'));
    k.body('shirt', sdf.smoothUnion(0.012, h.weighted(h.torso), sleeve), { color: h.tint.shirt ?? '#2f7a7a', roughness: 0.85 });
    // The rolled cuff at the elbow, the pointed collar, and a gauntlet glove up the forearm.
    const rollCuff = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, 0.84), lerp(j.ELBOW, j.WRIST, 0.2), 0.05, 0.05).round(0.004).bone('forearm.L'));
    const collar = sdf.torus(0.062, 0.018).at(0, 0.452, -0.01).bone('chest');
    const collarFlap = pair(sdf.ellipsoid([0.04, 0.012, 0.03]).rotateZ(-20).rotateX(-15).at(0.05, 0.452, 0.045)).bone('chest');
    k.body('cuffs', sdf.union(rollCuff, collar, collarFlap), { color: k.tint('cloth', { color: '#b4cfc9', follow: 0.4 }), roughness: 0.9, detail: 0.004 });

    const glove = h.perArm((j) => {
      const fist = posedPoint(j, FIST0);
      const gauntlet = sdf.cone(lerp(j.ELBOW, j.WRIST, 0.34), lerp(j.ELBOW, j.WRIST, 1.0), 0.05, 0.043).round(0.003).bone('forearm.L');
      const palm = sdf.smoothUnion(0.02, sdf.sphere(0.064).at(...fist), sdf.sphere(0.045).at(...lerp(j.WRIST, fist, 0.4))).bone('hand.L');
      return sdf.smoothUnion(0.012, gauntlet, palm);
    });
    k.body('gloves', glove, { color: C.glove, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ apron: bib, straps, belt, skirt to the knee
    const shell = h.torso.round(0.012).subtract(h.torso.round(-0.003));
    const front = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.4], 0.01).at(0, (y0 + y1) / 2, 0.2);
    const bib = shell.intersect(front(0.08, 0.27, 0.43));
    const strap2 = shell
      .intersect(sdf.box([0.034, 0.5, 0.6]).at(0.07, 0.4, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.3))
      .intersect(sdf.halfSpace([0, 1, 0], 0.505))
      .bone('chest');
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.29],
            [0.138, 0.29],
            [0.152, 0.25],
            [0.162, 0.21],
            [0.176, 0.17],
            [0.19, 0.14],
            [0, 0.14],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.124, 0.3],
            [0.138, 0.25],
            [0.148, 0.21],
            [0.162, 0.17],
            [0.176, 0.13],
            [0, 0.13],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const skirt = skirtOuter.subtract(skirtInner).intersect(sdf.box([0.27, 0.17, 0.4], 0.02).at(0, 0.22, 0.2));
    const apron = sdf.smoothUnion(0.008, h.weighted(bib), pair(strap2), h.weighted(skirt));
    k.body('apron', apron, { color: C.apron, roughness: 0.7, detail: 0.005, bump: (x, y, z) => 0.0015 * Math.sin(x * 90 + y * 70) * Math.cos(z * 80 + x * 30) });
    const beltRing = h.torso.round(0.02).subtract(h.torso.round(0.003)).intersect(h.band(0.255, 0.292));
    k.body('belt', h.weighted(beltRing), { color: C.belt, roughness: 0.6, detail: 0.004 });
    const buckleZ = sdf.raycast(h.torso.round(0.012), [0.07, 0.425, 1], [0, 0, -1])![2];
    const buckle = pair(sdf.box([0.024, 0.018, 0.012], 0.004).at(0.07, 0.425, buckleZ + 0.003)).bone('chest');
    const beltBuckle = sdf.box([0.034, 0.03, 0.012], 0.005).at(0, 0.273, sdf.raycast(h.torso.round(0.02), [0, 0.273, 1], [0, 0, -1])![2] + 0.002).bone('spine');
    k.body('buckles', sdf.union(buckle, beltBuckle), { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ trousers and boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.12, 0.002], 0.048, 0.046).bone('shin.L'),
    );
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), { color: C.pants, roughness: 0.85 });
    const shoe = sdf.smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.052).at(0, 0.052, -0.005));
    const shaft = sdf.cylinder(0.054, 0.09, 0.014).at(0, 0.075, 0);
    const rim = sdf.torus(0.052, 0.01).at(0, 0.12, 0);
    const boot = sdf.smoothUnion(0.02, shoe, shaft, rim).intersect(sdf.halfSpace([0, -1, 0], 0)).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ blowpipe and bubble (right fist, x < 0)
    const gr = h.arms.R.GRIP;
    const dr = posedDir(h.arms.R);
    const grip: V3 = [-gr[0], gr[1], gr[2]];
    // The pipe leans out and a little forward, as in the mockup (the fist grip axis points up).
    void dr;
    const dir: V3 = [-0.42, 0.9, 0.1];
    const along = (t: number): [number, number, number] => [grip[0] + dir[0] * t, grip[1] + dir[1] * t, grip[2] + dir[2] * t];
    const PIPE = { back: 0.1, front: 0.35 }; // 0.45 m in all
    const pipe = sdf.smoothUnion(
      0.006,
      sdf.capsule(along(-PIPE.back), along(PIPE.front), 0.015),
      sdf.sphere(0.02).at(...along(-PIPE.back)), // the mouthpiece end
      sdf.torus(0.017, 0.007).rotateX(90).at(...along(0.18)), // a heat ring
    );
    // The hose: from the mouthpiece it drops behind the arm and curves in toward the apron.
    const hose = sdf.chain(
      [
        [...along(-PIPE.back), 0.012],
        [grip[0] - 0.01, grip[1] - 0.07, grip[2] - 0.05, 0.012],
        [grip[0] + 0.01, grip[1] - 0.15, grip[2] - 0.05, 0.012],
        [grip[0] + 0.06, grip[1] - 0.2, grip[2] - 0.02, 0.012],
        [grip[0] + 0.11, grip[1] - 0.2, grip[2] + 0.03, 0.012],
      ],
      0.01,
    );
    k.body('blowpipe', sdf.smoothUnion(0.008, pipe, hose).bone('knife.R'), { color: C.pipe, roughness: 0.35, metalness: 0.8, detail: 0.003 });
    const bubble = sdf.smoothUnion(0.012, sdf.sphere(0.035).at(...along(PIPE.front + 0.03)), sdf.cone(along(PIPE.front - 0.01), along(PIPE.front + 0.02), 0.02, 0.03));
    k.body('bubble', bubble.bone('knife.R'), { color: C.bubble, roughness: 0.15, emissive: C.bubble, emissiveIntensity: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ vase (left fist, x > 0)
    const gl = h.arms.L.GRIP;
    const vaseProfile = profile.polygon(
      [
        [0, 0],
        [0.02, 0.0],
        [0.026, 0.012],
        [0.03, 0.04],
        [0.026, 0.065],
        [0.0165, 0.082],
        [0.016, 0.092],
        [0.021, 0.1],
        [0.016, 0.102],
        [0, 0.102],
      ],
      { smooth: true, samples: 6 },
    );
    const vase = sdf.revolve(vaseProfile).scale(1.5).at(gl[0], gl[1] - 0.01, gl[2]);
    k.body('vase', vase.bone('knife.L'), { color: C.vase, roughness: 0.12, opacity: 0.7, detail: 0.003 });
  },
});
