import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Mason — Chibi Quest settlement NPC (catalog `npcs/settlement/mason`), about 1.0 m to the top of
 * the cap, faces +Z. Target: docs/npc-mockups/mason_001.jpg. Built on the humanoid kind.
 *
 * Role: a builder NPC (walls and houses), seen in 3D and as a 128 px sprite; the dusty flat cap,
 *   the gray apron over a light blue shirt, the steel trowel, and the stone block must read.
 * One idea: a strong, cheerful stonemason holding a gray block out on his left palm and a trowel
 *   in his right fist, his cap and cheeks dusted with stone dust.
 * Shape language: round and soft (cap, curls, boots), with the diamond trowel and the block as the hard forms.
 * Palette (60/30/10): shirt #7a9ac0, trousers #b09870, apron #8a8a90; cap #c8a878 with #d8c8a8 dust,
 *   boots #6a6870; hair #c8a060; accent: the steel trowel #a8acb4 and the stone block #9a9890.
 * Value plan: the pale cap and face are the focal point; the blue shirt frames the gray apron;
 *   the brown leather straps are the one warm dark.
 * Bodies: skin, hair, cap, shirt, cuffs, collar, apron, straps, pocket, trousers, boots, trowel, handle, block.
 * Rig: the humanoid kind's skeleton and clips. The left arm holds out in every clip. The trowel is
 *   rigid on `knife.R` and the block on `knife.L`.
 */

const C = {
  dust: '#e8e0d0',
  cap: '#c8a878',
  capDust: '#d8c8a8',
  apron: '#c2b08c',
  seam: '#9a8664',
  leather: '#6b4a32',
  buckle: '#b8bcc4',
  trousers: '#b09870',
  cuffBand: '#a08a62',
  boot: '#6a6870',
  sole: '#4a484e',
  steel: '#a8acb4',
  handle: '#8a5a35',
  stone: '#9a9890',
  stoneEdge: '#7a7870',
};

export default humanoidAsset({
  name: 'mason',
  description: 'A strong, cheerful stonemason in a dusty cap and a gray apron, with a trowel in one hand and a stone block on the other palm.',
  reference: 'docs/npc-mockups/mason_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { caramel: '#b8803a', brown: '#5a301d', black: '#231a17', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { chalk: '#7f9ab0', sage: '#7f9a78', clay: '#b8745a', heather: '#8a78a8' },
  },
  presets: {
    sunny: { skin: 'tan', hair: 'brown', eyes: 'green', cloth: 'clay' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // The left hand is held up in front at shoulder height with the block above the fist.
  pose: { L: { elbow: [0.2, 0.335, 0.06], wrist: [0.245, 0.385, 0.14] } },

  // Light dust on the cheeks (paint) over the kind's blush, and a broad cheerful grin.
  paintSkin(skin, h) {
    const speck = (x: number, y: number) => h.onFace(sdf.ellipsoid([0.0055, 0.0055, 0.08]), x, y);
    const specks = sdf.union(speck(0.105, 0.56), speck(0.14, 0.558), speck(0.125, 0.532), speck(-0.105, 0.56), speck(-0.14, 0.558), speck(-0.125, 0.532));
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.075, 0.015, 55, 125), 0.3).at(0.1, 0.65, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(specks, '#a8704a', 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const GRIP_L = h.arms.L.GRIP;
    const GRIP_R = h.arms.R.GRIP;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ cap: a flat dome, a short bill, dust
    const capPose = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y, 0);
    const fit = sdf.ellipsoid([0.222, 0.212, 0.2]).intersect(sdf.halfSpace([0, -1, 0], -0.085));
    const puff = sdf.ellipsoid([0.238, 0.095, 0.236]).at(0, 0.125, -0.01);
    const seamBand = sdf.torus(0.205, 0.016).scale([1, 1, 0.95]).at(0, 0.092, 0);
        const capShape = sdf
      .smoothUnion(0.03, fit, puff, seamBand)
      .paintWhere(
        sdf.union(
          sdf.sphere(0.05).at(0.1, 0.17, 0.08),
          sdf.sphere(0.06).at(-0.09, 0.18, -0.06),
          sdf.sphere(0.045).at(0.0, 0.2, 0.0),
          sdf.sphere(0.04).at(-0.16, 0.1, 0.1),
          sdf.sphere(0.04).at(0.15, 0.1, -0.1),
          sdf.sphere(0.05).at(0, 0.1, -0.2),
        ),
        C.capDust,
        0.03,
      )
      .paintWhere(sdf.union(sdf.box([0.006, 0.5, 0.5]).at(0, 0.2, 0), sdf.box([0.5, 0.5, 0.006]).at(0, 0.2, 0.0), sdf.box([0.006, 0.5, 0.5]).at(0.09, 0.2, 0).rotateY(40), sdf.box([0.006, 0.5, 0.5]).at(-0.09, 0.2, 0).rotateY(-40)).intersect(sdf.halfSpace([0, -1, 0], -0.15)), '#a8885a', 0.002)
      .smoothUnion(0.01, sdf.sphere(0.017).at(0, 0.212, 0))
      .bone('head');
    k.body('cap', capPose(capShape), {
      color: C.cap,
      roughness: 0.92,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(x * 70 + z * 40) * Math.cos(y * 60),
    });

    // The bill: a wide, stiff peak in a darker khaki, tilted down over the forehead.
    const bill = sdf.box([0.23, 0.03, 0.17], 0.014).rotateX(12).at(0, 0.083, 0.225);
    k.body('bill', capPose(bill).bone('head'), { color: '#a88c5e', roughness: 0.9, detail: 0.004 });

    // The hair under the cap: a small cap that hugs the skull, a fringe of curled locks over the
    // forehead, locks at each temple, and a row of lobes at the nape (all separate shapes).
    const skullShell = sdf.ellipsoid([0.211, 0.204, 0.195]);
    // Clean round curls at the nape: two staggered rows, each curl a big ball with a small curl-tip ball.
    const nape = (a: number, y: number, r: number) => {
      const c = Math.cos((a * Math.PI) / 180);
      const sn = Math.sin((a * Math.PI) / 180);
      const at = (rr: number, yy: number): [number, number, number] => [rr * sn, yy, -(rr * 0.93) * c];
      const [x1, y1, z1] = at(0.186, y);
      const [x2, y2, z2] = at(0.2, y - r * 0.9);
      return sdf.smoothUnion(0.012, sdf.sphere(r).at(x1, y1, z1), sdf.sphere(r * 0.62).at(x2, y2, z2));
    };
    const tips = sdf.union(
      ...[-78, -52, -26, 0, 26, 52, 78].map((a) => nape(a, -0.052, 0.034)),
      ...[-65, -39, -13, 13, 39, 65].map((a) => nape(a, 0.016, 0.034)),
    );
    const back = skullShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.03)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const curl = (x0: number, s: number, y0: number, r: number) =>
      sdf.chain(
        [
          [x0, y0 + 0.012, 0.145, r],
          [x0 + 0.014 * s, y0 + 0.034, 0.17, r * 0.9],
          [x0 + 0.034 * s, y0 + 0.032, 0.186, r * 0.78],
          [x0 + 0.042 * s, y0 + 0.006, 0.184, r * 0.6],
        ],
        0.008,
      );
    const fringe = sdf.union(
      curl(-0.125, -1, 0.04, 0.022),
      curl(-0.085, 1, 0.056, 0.024),
      curl(-0.04, -1, 0.066, 0.024),
      curl(0.0, 1, 0.07, 0.024),
      curl(0.04, -1, 0.066, 0.024),
      curl(0.085, 1, 0.056, 0.024),
      curl(0.125, 1, 0.04, 0.022),
    );
    // Round curls at each temple, beside the face.
    const templeCurl = (y0: number, z: number, r: number) =>
      sdf.smoothUnion(0.01, sdf.sphere(r).at(0.186, y0, z), sdf.sphere(r * 0.65).at(0.2, y0 - r * 0.85, z - 0.006));
    const temples = pair(sdf.union(templeCurl(0.034, 0.06, 0.03), templeCurl(0.0, 0.03, 0.032), templeCurl(-0.002, -0.025, 0.032)));
    const hair = capPose(sdf.union(back, tips, fringe, temples)).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.004 });

    // A rounder nose and larger ears, in the skin tint (own bodies on the head bone).
    const skinTint = k.tint('skin');
    const noseZ = h.faceZ(0, 0.566);
    const noseTint = k.tint('skin', { color: '#e8998a', follow: 0.4 });
    k.body('nose', sdf.ellipsoid([0.034, 0.03, 0.032]).at(0, 0.56, noseZ + 0.002).bone('head'), { color: noseTint, roughness: 0.5, detail: 0.004 });
    const ear = sdf
      .ellipsoid([0.03, 0.054, 0.038])
      .subtract(sdf.sphere(0.02).at(0.018, 0, 0.008))
      .rotateY(-14)
      .at(0.208, 0.612, -0.012);
    k.body('ears', pair(ear).bone('head'), { color: skinTint, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ shirt: sleeves rolled above the forearm
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.01,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), lerp(SHOULDER, j.ELBOW, 0.8), 0.048, 0.045).bone('upperarm.L'),
        sdf.cone(lerp(SHOULDER, j.ELBOW, 0.66), lerp(SHOULDER, j.ELBOW, 0.97), 0.053, 0.053).round(0.004).bone('upperarm.L'), // the rolled cuff band
      ),
    );
    const shirt = sdf
      .smoothUnion(0.012, h.weighted(h.torso), sleeves)
      .paintWhere(sdf.box([0.018, 0.1, 0.6]).at(0, 0.405, 0.3), h.tint.trim!, 0.004);
    k.body('shirt', shirt, { color: h.tint.shirt ?? '#7f9ab0', roughness: 0.85 });
    // The open collar.
    const collar = sdf.torus(0.06, 0.019).at(0, 0.452, -0.012).bone('chest');
    k.body('collar', collar, { color: h.tint.trim ?? '#667f94', roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ gray canvas apron: bib, straps, skirt, pocket
    const zAt = (x: number, y: number) => sdf.raycast(h.torso.round(0.017), [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
    const shell = h.torso.round(0.012).subtract(h.torso.round(-0.003));
    const front = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.4], 0.01).at(0, (y0 + y1) / 2, 0.2);
    const bib = shell.intersect(front(0.082, 0.26, 0.405));
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.29],
            [0.138, 0.29],
            [0.15, 0.25],
            [0.158, 0.21],
            [0.17, 0.185],
            [0.176, 0.163],
            [0, 0.163],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    const skirtInner = skirtOuter.round(-0.012).at(0, 0.0, -0.002);
    const skirt = skirtOuter.subtract(skirtInner).intersect(sdf.box([0.27, 0.26, 0.4], 0.02).at(0, 0.2, 0.2));
    const apron = sdf
      .smoothUnion(0.008, h.weighted(bib), h.weighted(skirt))
      .paintWhere(h.band(0.163, 0.175), C.seam, 0.002);
    k.body('apron', apron, { color: C.apron, roughness: 0.92, detail: 0.005, bump: (x, y, z) => 0.0007 * Math.sin(x * 120 + z * 30) * Math.sin(y * 110 + x * 20) });

    // The front pocket: a patch with a seam line, on the skirt.
    const skirtFrontZ = sdf.raycast(skirtOuter, [0, 0.215, 1], [0, 0, -1])?.[2] ?? 0.13;
    const pocket = sdf.box([0.1, 0.065, 0.014], 0.006).at(0, 0.212, skirtFrontZ + 0.001).bone('hips');
    k.body('pocket', pocket, { color: '#cdbc98', roughness: 0.92, detail: 0.004 });

    // Leather straps over the shoulders and a belt around the waist, with a buckle.
    const strapShape = pair(
      h.torso
        .round(0.016)
        .intersect(sdf.box([0.03, 0.2, 0.6]).at(0.07, 0.385, 0))
        .intersect(sdf.halfSpace([0, -1, 0], -0.265)),
    ).bone('chest');
    const beltShape = h.torso.round(0.026).intersect(h.band(0.25, 0.288));
    k.body('straps', sdf.smoothUnion(0.006, strapShape, h.weighted(beltShape)), { color: C.leather, roughness: 0.7, detail: 0.004 });
    k.body('buckle', sdf.box([0.04, 0.032, 0.012], 0.005).at(0, 0.27, zAt(0, 0.27) + 0.014).bone('chest'), {
      color: C.buckle,
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ trousers cuffed above the boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.12, 0.002], 0.048, 0.046).bone('shin.L'),
      sdf.cylinder(0.054, 0.034, 0.012).at(ANKLE[0], 0.125, 0.002).bone('shin.L'),
    );
    const trousers = sdf
      .smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg))
      .paintWhere(pair(sdf.box([0.12, 0.006, 0.4]).at(ANKLE[0], 0.108, 0)), C.cuffBand, 0.002);
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.88, detail: 0.005 });

    // ------------------------------------------------------------------ gray boots
    const bootFoot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.046, 0.102]).at(0, 0.044, 0.04),
        sdf.cylinder(0.05, 0.065, 0.014).at(0, 0.062, -0.005),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = sdf.box([0.3, 0.02, 0.5]).at(0, 0.0, 0);
    const boot = bootFoot.paintWhere(sole, C.sole, 0.004).rotateY(10).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.75, bump: (x, y, z) => 0.002 * noise.fbm(x * 90, y * 90, z * 90, 2) });

    // ------------------------------------------------------------------ the trowel (right fist, rigid on knife.R)
    // Built at the right grip with its axis forward and 20 degrees up (the rest item direction): a
    // wooden handle in the fist, a cranked steel neck, and a diamond blade.
    const gR: [number, number, number] = [-GRIP_R[0], GRIP_R[1], GRIP_R[2]];
    const tool = (s: sdf.Shape) => s.rotateX(-20).at(gR[0], gR[1], gR[2]);
    const handle = tool(
      sdf.smoothUnion(
        0.008,
        sdf.capsule([0, 0, -0.05], [0, 0, 0.05], 0.019),
        sdf.sphere(0.022).at(0, 0, -0.05),
      ),
    ).bone('knife.R');
    k.body('handle', handle, { color: C.handle, roughness: 0.75, detail: 0.004 });
    // A short neck leaves the handle's front end and a large flat blade (0.13 m long, 0.08 m wide at
    // the heel, 0.012 m thick) continues the item axis, tipped down by DROOP degrees so that it clears
    // the head in every clip; its flat faces point outward.
    const DROOP = 25;
    const bladeProfile = profile.polygon(
      [
        [0.0, 0.0],
        [0.02, 0.04],
        [0.07, 0.034],
        [0.13, 0.0],
        [0.07, -0.034],
        [0.02, -0.04],
      ],
      { smooth: true, samples: 4 },
    );
    const bladeLocal = sdf.extrude(bladeProfile, 0.012, 0.004).rotateY(-90).at(0, 0, 0.075); // U along +Z, V up, depth along X
    const neckLocal = sdf.capsule([0, 0, 0.04], [0, 0, 0.082], 0.011);
    const droop = (s: sdf.Shape) => s.at(0, 0, -0.05).rotateX(DROOP).at(0, 0, 0.05);
    const trowel = tool(sdf.smoothUnion(0.006, droop(bladeLocal), droop(neckLocal))).bone('knife.R');
    k.body('trowel', trowel, { color: C.steel, roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ the stone block (left palm, rigid on knife.L)
    const BLOCK = { w: 0.16, h: 0.08, d: 0.1, yaw: -18 };
    const bc = { x: GRIP_L[0] + 0.01, y: GRIP_L[1] + 0.058, z: GRIP_L[2] + 0.015 };
    const box = sdf.box([BLOCK.w, BLOCK.h, BLOCK.d], 0.012);
    const inner = (axis: 0 | 1 | 2) => {
      const dims: [number, number, number] = [2, 2, 2];
      dims[axis] = [BLOCK.w, BLOCK.h, BLOCK.d][axis]! - 0.026;
      return sdf.box(dims);
    };
    const edges = sdf.union(
      box.subtract(inner(0), inner(1)),
      box.subtract(inner(0), inner(2)),
      box.subtract(inner(1), inner(2)),
    );
    const stone = box
      .paintWhere(edges, C.stoneEdge, 0.004)
      .rotateY(BLOCK.yaw)
      .at(bc.x, bc.y, bc.z)
      .bone('knife.L');
    k.body('block', stone, {
      color: C.stone,
      roughness: 0.95,
      detail: 0.004,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 90, y * 90, z * 90, 3),
    });
    void KNEE;
  },
});
