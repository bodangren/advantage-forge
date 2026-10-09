import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Carpenter — Chibi Quest settlement NPC (catalog `npcs/settlement/carpenter`), about 1.0 m to the
 * top of the hair, faces +Z. Target: docs/npc-mockups/carpenter_001.jpg. Built on the humanoid kind.
 *
 * Role: a village NPC who builds and repairs, seen in 3D and as a 128 px sprite; the red bandana, the
 *   blue shirt over tan bib trousers, the tool belt, and the hand saw must read.
 * One idea: a cheerful young craftsman: a red bandana under a swept brown quiff, and a saw in his fist.
 * Shape language: round and soft (hair, boots, pouch) with the long saw blade as the one hard form.
 * Palette (60/30/10): shirt #3f6a9a and tan trousers #c8a878 (patches #a8885a); brown leather #6b4226
 *   (belt, straps, pouch, boots #5a3a24); hair #5a301d; accent bandana #b03a3a; yellow pencil and ruler #e0b040.
 * Value plan: the red bandana against the dark hair frames the face; the blue shirt and tan trousers
 *   are the mid values; the pale steel blade is the lightest form.
 * Bodies: skin, hair, bandana, pencil, shirt, collar, trousers, belt, pouch, hammer, ruler, boots, saw, sawgrip.
 * Rig: the humanoid kind's skeleton and clips. The saw is rigid on `knife.L` (the left fist's grip).
 */

const C = {
  hair: '#5a301d',
  bandana: '#b03a3a',
  pencil: '#e0b040',
  pencilTip: '#3a2a20',
  trousers: '#c8a878',
  patch: '#a8885a',
  belt: '#6b4226',
  buckle: '#b8bcc4',
  hammerHead: '#6a6e78',
  hammerHandle: '#8a5a35',
  ruler: '#e0b040',
  rulerMark: '#5a3a24',
  boot: '#5a3a24',
  blade: '#c8ccd4',
  sawGrip: '#9a6a3a',
};

// The saw: its direction relative to the fist's grip axis (forward): up 42 and out 10 degrees.
const SAW_TILT = { up: 42, out: 10 };

export default humanoidAsset({
  name: 'carpenter',
  description: 'A young village carpenter in a red bandana and a blue work shirt, with a tool belt and a hand saw.',
  reference: 'docs/npc-mockups/carpenter_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { denim: '#3f6a9a', rust: '#a8583a', moss: '#55703f', plum: '#7a4a6a' },
  },
  presets: {
    sunny: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'moss' },
  },
  hair: false,
  lashes: false,
  // The left arm holds the saw up and forward: the elbow bent, the forearm angled forward and down.
  pose: { L: { elbow: [0.178, 0.318, 0.03], wrist: [0.2, 0.24, 0.1] } },
  undershirt: false,
  pants: false,
  shoes: false,

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const GRIP = h.arms.L.GRIP;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    // ------------------------------------------------------------------ hair and bandana
    const hairColor = k.tint('hair');
    const crownShell = sdf.ellipsoid([0.226, 0.22, 0.21]);
    const skullShell = sdf.ellipsoid([0.214, 0.208, 0.198]);
    const crown = crownShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.112));
    const tips = sdf.union(
      ...[-70, -45, -22, 0, 22, 45, 70].map((a) => sdf.sphere(0.026).at(0.18 * Math.sin((a * Math.PI) / 180), -0.06, -0.167 * Math.cos((a * Math.PI) / 180))),
    );
    const back = skullShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.055)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const sideburn = pair(
      sdf.chain(
        [
          [0.186, 0.1, 0.045, 0.03],
          [0.19, 0.03, 0.05, 0.027],
          [0.192, -0.03, 0.045, 0.02],
        ],
        0.015,
      ),
    );
    // The swept quiff over the forehead, and a spiky tuft at the back on the viewer's left.
    // Three thick, full locks swept to the viewer's right; they curl over the bandana and join the cap at the root.
    const curl = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.035);
    const locks = sdf.smoothUnion(
      0.03,
      curl([[-0.08, 0.16, 0.06, 0.075], [0.0, 0.235, 0.08, 0.068], [0.09, 0.245, 0.09, 0.058], [0.16, 0.205, 0.09, 0.046], [0.195, 0.145, 0.075, 0.033]]), // the big front lock, curling over the bandana
      curl([[-0.1, 0.16, -0.02, 0.065], [-0.04, 0.235, 0.0, 0.06], [0.05, 0.255, 0.0, 0.05], [0.14, 0.22, -0.02, 0.038]]), // the middle lock
      curl([[-0.12, 0.13, 0.13, 0.05], [-0.05, 0.195, 0.155, 0.055], [0.03, 0.205, 0.165, 0.048], [0.09, 0.165, 0.17, 0.032]]), // the fringe over the forehead
    );
    const hair = headPose(sdf.smoothUnion(0.03, crown, back, tips, sideburn, locks)).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // The bandana: a band around the forehead, a knot at the back, and two tails on the viewer's left.
    const bandShell = sdf.ellipsoid([0.223, 0.217, 0.207]);
    const band = bandShell.intersect(sdf.box([0.6, 0.052, 0.6]).at(0, 0.098, 0));
    const knot = sdf.sphere(0.034).at(-0.197, 0.075, -0.1);
    // Two flat tails hang down the side of the head behind the ear, on the viewer's left.
    const tail = (rot: number, len: number, z: number) =>
      sdf
        .box([0.014, len, 0.058], 0.005)
        .at(0, -len / 2, 0)
        .rotateZ(rot)
        .at(-0.205, 0.07, z);
    const bandana = headPose(sdf.smoothUnion(0.012, band, knot, tail(8, 0.21, -0.1), tail(-8, 0.16, -0.115))).bone('head');
    k.body('bandana', bandana, { color: C.bandana, roughness: 0.85, detail: 0.004 });

    // The pencil behind the right ear (on the viewer's left), pointing forward and up.
    const pencil = headPose(sdf.capsule([-0.232, 0.0, -0.045], [-0.224, 0.07, 0.07], 0.0125)).bone('head');
    const pencilTip = headPose(sdf.cone([-0.225, 0.067, 0.065], [-0.223, 0.083, 0.103], 0.0125, 0.003)).bone('head');
    k.body('pencil', pencil, { color: C.pencil, roughness: 0.6, detail: 0.003 });
    k.body('pencilTip', pencilTip, { color: C.pencilTip, roughness: 0.7, detail: 0.003 });

    // Large ears: a shell 1.4x the kind's ear over each one, in the skin tint.
    const ears = pair(
      sdf
        .ellipsoid([0.0364, 0.0616, 0.0448])
        .subtract(sdf.sphere(0.024).at(0.022, 0, 0.008))
        .rotateY(-12)
        .at(0.205, 0.61, -0.01)
        .bone('head'),
    );
    k.body('ears', ears, { color: h.tint.skin ?? '#f2c7a4', roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ shirt: sleeves rolled to the elbow
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.01,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), lerp(SHOULDER, j.ELBOW, 0.88), 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(lerp(SHOULDER, j.ELBOW, 0.8), lerp(j.ELBOW, j.WRIST, 0.12), 0.052, 0.05).round(0.004).bone('upperarm.L'), // the rolled cuff
      ),
    );
    const collar = sdf.torus(0.06, 0.019).at(0, 0.452, -0.012).bone('chest');
    const shirtShape = sdf
      .smoothUnion(0.012, h.weighted(h.torso), sleeves)
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.435).intersect(sdf.box([0.02, 0.2, 0.6]).at(0, 0.45, 0.3)), h.tint.trim!, 0.004);
    k.body('shirt', shirtShape, { color: h.tint.shirt ?? '#3f6a9a', roughness: 0.85 });
    k.body('collar', collar, { color: h.tint.trim ?? '#46658a', roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ bib trousers with knee patches
    const grown = h.torso.round(0.009);
    const frontOf = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.4], 0.01).at(0, (y0 + y1) / 2, 0.2);
    const waist = grown.intersect(h.band(0.15, 0.32));
    const bib = grown.subtract(h.torso.round(-0.002)).intersect(frontOf(0.082, 0.28, 0.4));
    const bibSolid = grown.intersect(frontOf(0.082, 0.28, 0.4));
    const topUp = sdf.smoothUnion(0.008, h.weighted(waist), h.weighted(bibSolid));
    void bib;
    const strapShape = pair(
      h.torso
        .round(0.014)
        .intersect(sdf.box([0.032, 0.17, 0.6]).at(0.075, 0.395, 0))
        .bone('chest'),
    );
    k.body('straps', strapShape, { color: C.belt, roughness: 0.7, detail: 0.004 });

    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.1, 0.002], 0.048, 0.045).bone('shin.L'),
      sdf.cylinder(0.053, 0.032, 0.012).at(ANKLE[0], 0.113, 0.002).bone('shin.L'), // the rolled cuff over the boot
    );
    const patches = pair(sdf.sphere(0.034).scale([1.1, 1, 0.8]).at(KNEE[0], KNEE[1], 0.047));
    const trousers = sdf
      .smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg), topUp)
      .paintWhere(patches, C.patch, 0.004);
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85, detail: 0.005 });

    // ------------------------------------------------------------------ tool belt: belt, buckle, pouch, hammer, ruler
    const beltRing = h.torso.round(0.017).intersect(h.band(0.232, 0.266));
    const zAt = (x: number, y: number) => sdf.raycast(h.torso.round(0.017), [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
    const pouchZ = zAt(-0.1, 0.19);
    const pouch = sdf
      .smoothUnion(
        0.008,
        sdf.box([0.056, 0.075, 0.036], 0.014).at(-0.108, 0.185, pouchZ + 0.008),
        sdf.box([0.06, 0.025, 0.04], 0.012).at(-0.108, 0.218, pouchZ + 0.008), // the flap
      )
      .bone('hips');
    const hammerZ = zAt(-0.052, 0.22) + 0.012;
    const loop = sdf.box([0.026, 0.05, 0.022], 0.008).at(-0.052, 0.225, hammerZ - 0.002);
    k.body('belt', sdf.smoothUnion(0.006, h.weighted(beltRing), pouch, loop.bone('hips')).paintWhere(sdf.box([0.034, 0.1, 0.4]).at(0.03, 0.25, 0.2), C.buckle, 0.003), {
      color: C.belt,
      roughness: 0.7,
      detail: 0.004,
    });
    k.body('buckle', sdf.box([0.036, 0.03, 0.012], 0.005).at(0.03, 0.249, zAt(0.03, 0.249) + 0.003).bone('hips'), {
      color: C.buckle,
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.003,
    });
    const hammer = sdf
      .smoothUnion(
        0.004,
        sdf.capsule([-0.052, 0.19, hammerZ], [-0.052, 0.285, hammerZ], 0.011),
      )
      .bone('hips');
    const hammerHead = sdf.box([0.056, 0.03, 0.03], 0.008).at(-0.052, 0.292, hammerZ).bone('hips');
    k.body('hammer', hammer, { color: C.hammerHandle, roughness: 0.75, detail: 0.003 });
    k.body('hammerHead', hammerHead, { color: C.hammerHead, roughness: 0.4, metalness: 0.8, detail: 0.003 });
    const rulerZ = zAt(-0.012, 0.2) + 0.012;
    const ruler = sdf
      .box([0.026, 0.1, 0.012], 0.004)
      .paintWhere(sdf.box([0.1, 0.006, 0.1]).at(0, 0.02, 0), C.rulerMark, 0.001)
      .paintWhere(sdf.box([0.1, 0.006, 0.1]).at(0, -0.02, 0), C.rulerMark, 0.001)
      .paintWhere(sdf.box([0.1, 0.006, 0.1]).at(0, 0.0, 0), C.rulerMark, 0.001)
      .at(-0.012, 0.2, rulerZ)
      .bone('hips');
    k.body('ruler', ruler, { color: C.ruler, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ boots
    const bootFoot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.056, 0.044, 0.1]).at(0, 0.042, 0.04),
        sdf.cylinder(0.05, 0.085, 0.014).at(0, 0.075, 0),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const heel = sdf.box([0.1, 0.02, 0.07], 0.006).at(0, 0.01, -0.02);
    const boot = sdf.union(bootFoot, heel.paint('#3a2418')).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ hand saw (rigid on knife.L)
    // Built at the fist's grip with its axis forward, then turned down and out. The blade is a long
    // trapezoid with teeth along the lower edge; its flat faces outward.
    const len = 0.32;
    const teeth: [number, number][] = [];
    const nT = 52; // a fine regular row: valleys on the edge line, tips 8 mm below it
    for (let i = 0; i <= nT; i++) {
      const t = 0.03 + (len - 0.03) * (i / nT);
      const edge = -0.055 + (0.035 / len) * t; // the lower edge rises toward the tip
      teeth.push([t, i % 2 === 0 ? edge : edge - 0.008]);
    }
    const bladeProfile = profile.polygon(
      [
        [0.02, 0.055],
        [len, 0.02],
        ...teeth.reverse(),
        [0.02, -0.055],
      ],
    );
    const turn = (s: sdf.Shape) => s.rotateX(-SAW_TILT.up).rotateY(SAW_TILT.out).at(GRIP[0], GRIP[1], GRIP[2]);
    const blade = turn(sdf.extrude(bladeProfile, 0.03).rotateY(-90).at(0, 0, 0)).bone('knife.L');
    k.body('saw', blade, { color: C.blade, roughness: 0.35, metalness: 0.8, detail: 0.002, maxError: 0.0004 });
    const grip = turn(
      sdf.smoothUnion(
        0.012,
        sdf.capsule([0, 0, -0.065], [0, 0, 0.03], 0.019),
        sdf.box([0.034, 0.09, 0.03], 0.01).at(0, 0, 0.03),
      ),
    ).bone('knife.L');
    k.body('sawgrip', grip, { color: C.sawGrip, roughness: 0.75, detail: 0.004 });
    void KNEE;
  },
});
