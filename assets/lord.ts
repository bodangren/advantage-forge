import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Lord — Chibi Quest court NPC (catalog `npcs/court-and-faction/lord`), about 1.0 m to the top of
 * the hair, faces +Z. Target: docs/npc-mockups/lord_001.jpg. Built on the humanoid kind.
 *
 * Role: the manor lord who gives estate quests, seen in the manor hall in 3D and as a 128 px
 *   sprite; the raised silver goblet, the curled mustache and beard, and the white ruff must read.
 * One idea: a proud, cheerful lord toasting with a big silver goblet, all black curls, mustache and
 *   pointed beard over a white ruff, a navy doublet, and a short burgundy fur-trimmed cape.
 * Shape language: round and soft (curls, ruff, nose, goblet cup), with the cape edge as the one wide form.
 * Palette (60/30/10): navy #2a3450 and burgundy #6a2a3a; black hair #231a17; ruff #f6f1ea; silver
 *   #c8ccd4 (buttons, buckle, goblet); fur #7a5a3a; gray trousers #4a4448; black boots #2a2428.
 * Value plan: the white ruff under the dark beard and the bright silver goblet are the accents on
 *   the dark blue body; the burgundy cape frames it.
 * Bodies: skin, ears, nose, brows, mustache, beard, hair, ruff, doublet, cuffs, belt, buckle, buttons,
 *   cape, fur, breeches, knit, boots, goblet.
 * Rig: the humanoid kind's skeleton and clips; both arms keep a held pose (the right arm raises the
 *   goblet, the left fist rests on the hip). The goblet is rigid on `knife.R`; the cape on `cloak`.
 */

const C = {
  ruff: '#f6f1ea',
  cuff: '#efe3c8',
  button: '#c8ccd4',
  cape: '#6a2a3a',
  fur: '#7a5a3a',
  pants: '#4a4448',
  knit: '#3a3638',
  boot: '#2a2428',
  belt: '#2e2426',
  panel: '#1e2640',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

// Left-side arm poses (the kind mirrors the right arm): the right hand raises the goblet, the left fist is on the hip.
const POSE_R = { elbow: [0.23, 0.34, 0.02], wrist: [0.315, 0.41, 0.07] } as const;
const POSE_L = { elbow: [0.2, 0.31, -0.03], wrist: [0.15, 0.25, 0.04] } as const;

export default humanoidAsset({
  name: 'lord',
  description: 'A cheerful, proud lord in a navy doublet, a white ruff, and a fur-trimmed burgundy cape, raising a silver goblet.',
  reference: 'docs/npc-mockups/lord_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', auburn: '#8e3b1c', silver: '#b8b4c4', blond: '#c4974a', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { navy: '#2a3450', wine: '#5a2a3c', pine: '#2a4a40', plum: '#45345a' },
  },
  presets: {
    manor: { skin: 'light', hair: 'black', eyes: 'brown', cloth: 'navy' },
    harvest: { skin: 'tan', hair: 'brown', eyes: 'green', cloth: 'pine' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  pose: { L: POSE_L, R: POSE_R },

  // A broad open smile under the mustache (round corners, one tooth band); the kind's brows are
  // painted out and replaced by thick black brow bodies.
  paintSkin(skin, h) {
    const y = 0.526;
    const grin = profile.polygon(
      [
        [-0.062, 0.02],
        [-0.032, 0.008],
        [0, 0.005],
        [0.032, 0.008],
        [0.062, 0.02],
        [0.053, -0.018],
        [0.027, -0.04],
        [0, -0.047],
        [-0.027, -0.04],
        [-0.053, -0.018],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.011))).intersect(sdf.box([0.072, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.03, 0.014, 0.08]), 0, y - 0.034);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const rad = Math.PI / 180;
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    type P4 = [number, number, number, number];
    const hairColor = k.tint('hair');
    const skinColor = h.tint.skin ?? '#e8b48e';
    const clothColor = h.tint.shirt ?? '#2a3450';
    // The face z at (x, y); below the chin the ray misses the head, so it falls back to the chin line.
    const fz = (x: number, y: number): number => {
      try {
        return h.faceZ(x, y);
      } catch {
        return h.faceZ(x * 0.8, 0.5) - 0.02;
      }
    };
    const onFace = (x: number, y: number, dz: number, r: number): P4 => [x, y, fz(Math.abs(x), y) + dz, r];

    // ------------------------------------------------------------------ face: ears, a big pink nose, thick arched brows
    const ear = sdf
      .ellipsoid([0.034, 0.052, 0.036])
      .subtract(sdf.sphere(0.02).at(0.016, 0, 0.007))
      .rotateY(-12)
      .at(0.208, 0.612, -0.01)
      .bone('head');
    k.body('ears', pair(ear), { color: skinColor, roughness: 0.55, detail: 0.004 });
    const noseY = 0.585;
    const nose = sdf.ellipsoid([0.034, 0.031, 0.034]).at(0, noseY, fz(0, noseY) + 0.014).bone('head');
    k.body('nose', nose, { color: k.tint('skin', { color: '#e89a86', follow: 1 }), roughness: 0.5, detail: 0.004 });

    const brow = sdf.chain([onFace(0.045, 0.752, 0.012, 0.014), onFace(0.085, 0.768, 0.014, 0.018), onFace(0.125, 0.768, 0.012, 0.017), onFace(0.16, 0.745, 0.008, 0.012)], 0.008);
    k.body('brows', pair(brow).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ the curled mustache and the pointed beard
    const must = sdf.chain(
      [
        onFace(0.004, 0.553, 0.016, 0.016),
        onFace(0.04, 0.547, 0.019, 0.017),
        onFace(0.078, 0.553, 0.017, 0.015),
        onFace(0.108, 0.572, 0.012, 0.012),
        onFace(0.118, 0.594, 0.01, 0.009),
      ],
      0.01,
    );
    k.body('mustache', pair(must).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.004 });

    const jaw = sdf.chain(
      [
        onFace(0.19, 0.6, 0.0, 0.014),
        onFace(0.181, 0.55, 0.004, 0.019),
        onFace(0.158, 0.5, 0.006, 0.024),
        onFace(0.115, 0.462, 0.008, 0.028),
        onFace(0.06, 0.442, 0.012, 0.03),
      ],
      0.01,
    );
    const chin = sdf.chain(
      [
        [0, 0.446, fz(0, 0.52) + 0.012, 0.034],
        [0, 0.424, fz(0, 0.52) + 0.012, 0.032],
        [0, 0.41, fz(0, 0.52) + 0.008, 0.022],
      ],
      0.01,
    );
    const beard = sdf.smoothUnion(0.012, pair(jaw), chin);
    k.body('beard', beard.bone('head'), {
      color: hairColor,
      roughness: 0.65,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * noise.fbm(x * 70, y * 45, z * 70, 2),
    });

    // ------------------------------------------------------------------ hair: a small cap, swept locks, side curls, wavy back locks
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const hairShell = sdf.ellipsoid([0.213, 0.209, 0.198]);
    const cap = hairShell
      .smoothIntersect(0.02, sdf.union(sdf.halfSpace([0, 0, 1], 0.035), sdf.halfSpace([0, -1, 0], -0.085)))
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.05));
    const temples = hairShell
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.03))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.1));
    // A lock along a meridian of the skull: azimuth `a` (0 = front), elevation from `e0` to `e1` degrees.
    const sweep = (a: number, e0: number, e1: number, r: number, lift = 1.1) => {
      const pts: P4[] = [];
      for (let i = 0; i < 5; i++) {
        const e = (e0 + ((e1 - e0) * i) / 4) * rad;
        const bump = 1 + 0.07 * Math.sin((i / 4) * Math.PI);
        pts.push([
          0.205 * lift * bump * Math.cos(e) * Math.sin(a * rad),
          0.2 * lift * bump * Math.sin(e),
          0.19 * lift * bump * Math.cos(e) * Math.cos(a * rad),
          r * (1 - 0.15 * (i / 4)),
        ]);
      }
      return sdf.chain(pts, 0.012);
    };
    const top = [-60, -40, -20, 0, 20, 40, 60].map((a) => sweep(a, 46, 118, 0.034, 1.06));
    // The big wave on the viewer's left: the fringe rolls up and out into a curl.
    const wave = sdf.chain(
      [
        [-0.1, 0.14, 0.15, 0.032],
        [-0.17, 0.165, 0.105, 0.036],
        [-0.21, 0.15, 0.06, 0.032],
        [-0.225, 0.1, 0.05, 0.026],
        [-0.215, 0.075, 0.07, 0.02],
      ],
      0.012,
    );
    const side = sdf.chain(
      [
        [0.192, 0.04, 0.05, 0.026],
        [0.207, -0.0, 0.012, 0.03],
        [0.212, -0.05, 0.0, 0.026],
      ],
      0.012,
    );
    const sideCurl = sdf.chain(
      [
        [0.205, -0.05, 0.0, 0.03],
        [0.248, -0.05, 0.01, 0.03],
        [0.262, -0.09, 0.03, 0.026],
        [0.238, -0.108, 0.04, 0.02],
      ],
      0.01,
    );
    const back = [110, 135, 160, 185, 210, 235, 258].map((deg, i) => {
      const wig = i % 2 === 0 ? 1 : -1;
      const at = (y: number, f: number, dx: number): P4 => {
        const s = Math.sqrt(Math.max(0.35, 1 - (y / 0.21) ** 2)) * f;
        return [0.208 * Math.sin(deg * rad) * s + dx, y, 0.195 * Math.cos(deg * rad) * s, 0.034];
      };
      const p = [at(0.07, 1.04, 0), at(0.01, 1.04, wig * 0.01), at(-0.04, 1.05, -wig * 0.01), at(-0.08, 1.06, wig * 0.01)];
      p[3]![3] = 0.026;
      return sdf.chain(p, 0.012);
    });
    const hair = sdf.smoothUnion(0.014, cap, temples, ...top, wave, pair(side), sideCurl, ...back);
    k.body('hair', headPose(hair).bone('head'), {
      color: hairColor,
      roughness: 0.55,
      detail: 0.0055,
    });

    // ------------------------------------------------------------------ the white ruff (a scalloped collar on the chest)
    const ruffRing = sdf.torus(0.105, 0.02).scale([1, 1, 0.9]).at(0, 0.452, -0.008);
    const lobes = sdf.union(
      ...Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return sdf.sphere(0.03).scale([1, 0.8, 1]).at(0.122 * Math.sin(a), 0.447, 0.122 * 0.9 * Math.cos(a) - 0.008);
      }),
    );
    k.body('ruff', sdf.smoothUnion(0.012, ruffRing, lobes).bone('chest'), {
      color: C.ruff,
      roughness: 0.9,
      detail: 0.0045,
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(x, z) * 32) * Math.cos(y * 60),
    });

    // ------------------------------------------------------------------ the doublet: a coat to the hips with a short flare, long sleeves, buttons
    const flare = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.235],
            [0.136, 0.235],
            [0.158, 0.2],
            [0.17, 0.165],
            [0.17, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.82]);
    const coat = sdf.smoothUnion(0.02, h.torso.round(0.012).smoothIntersect(0.01, h.band(0.15, 0.462)), flare);
    const sleeveOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) => {
      const upper = sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.052, 0.047).bone('upperarm.L');
      const fore = sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.88), 0.047, 0.044).bone('forearm.L');
      return sdf.smoothUnion(0.015, upper, fore);
    };
    const sleeves = h.perArm(sleeveOf);
    const panel = sdf.box([0.11, 0.3, 0.4]).at(0, 0.32, 0.25);
    const pipe = (x: number) => sdf.box([0.01, 0.3, 0.4]).at(x, 0.32, 0.25);
    const doublet = sdf
      .smoothUnion(0.012, h.weighted(coat), sleeves)
      .paintWhere(panel.intersect(h.band(0.255, 0.45)), C.panel, 0.004)
      .paintWhere(sdf.union(pipe(-0.056), pipe(0.056)).intersect(h.band(0.2, 0.45)), '#161c30', 0.002);
    k.body('doublet', doublet, {
      color: clothColor,
      roughness: 0.8,
      detail: 0.0045,
      bump: (x, y, z) => 0.002 * Math.sin(x * 90 + y * 60) * Math.cos(z * 80),
    });
    const cuffOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) =>
      sdf.cone(lerp(j.ELBOW, j.WRIST, 0.74), lerp(j.ELBOW, j.WRIST, 0.99), 0.049, 0.05).round(0.003).bone('forearm.L');
    k.body('cuffs', h.perArm(cuffOf), { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // The belt and its buckle.
    const beltShape = coat.round(0.007).intersect(h.band(0.222, 0.256));
    k.body('belt', h.weighted(beltShape), { color: C.belt, roughness: 0.6, detail: 0.004 });
    const beltZ = sdf.raycast(beltShape, [0, 0.239, 1], [0, 0, -1])?.[2] ?? 0.12;
    const buckle = sdf
      .box([0.07, 0.05, 0.02], 0.006)
      .subtract(sdf.box([0.038, 0.026, 0.1]))
      .at(0, 0.239, beltZ + 0.004);
    k.body('buckle', buckle, { color: C.button, roughness: 0.35, metalness: 0.8, detail: 0.003, bone: 'spine' });

    // Two columns of silver buttons on the chest.
    const buttons = sdf.union(
      ...[0.4, 0.347, 0.294].flatMap((y) =>
        [-0.066, 0.066].map((x) => {
          const z = sdf.raycast(coat, [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
          return sdf.sphere(0.0115).at(x, y, z + 0.002);
        }),
      ),
    );
    k.body('buttons', buttons, { color: C.button, roughness: 0.3, metalness: 0.8, detail: 0.003, bone: 'chest' });

    // ------------------------------------------------------------------ the burgundy cape with fur at the shoulders and the hem
    const capeOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.15, 0.46],
            [0.19, 0.4],
            [0.235, 0.3],
            [0.27, 0.2],
            [0.295, 0.14],
            [0.295, 0.135],
            [0, 0.135],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9])
      .at(0, 0, -0.05);
    const cape = capeOuter.subtract(capeOuter.round(-0.026)).smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], -0.015));
    k.body('cape', cape.bone('cloak'), {
      color: C.cape,
      roughness: 0.85,
      detail: 0.006,
      bump: (x, y, z) => 0.002 * Math.sin(x * 60 + y * 20) * Math.cos(z * 50),
    });
    const mantle = sdf.torus(0.145, 0.034).scale([1, 1, 0.9]).at(0, 0.425, -0.03).smoothIntersect(0.01, sdf.halfSpace([0, 0, 1], 0.03));
    const edgeShell = capeOuter.round(0.01).subtract(capeOuter.round(-0.032));
    const edgeFur = edgeShell.smoothIntersect(0.008, sdf.box([1, 0.34, 0.045]).at(0, 0.3, -0.027));
    const hemBand = edgeShell.smoothIntersect(0.008, sdf.box([1, 0.06, 0.2]).at(0, 0.165, -0.12));
    const hemFur = pair(sdf.ellipsoid([0.035, 0.05, 0.04]).at(0.285, 0.17, -0.03));
    const hemFur2 = pair(sdf.ellipsoid([0.03, 0.04, 0.035]).at(0.268, 0.22, -0.02));
    k.body('fur', sdf.smoothUnion(0.02, mantle, edgeFur, hemBand, hemFur, hemFur2).bone('cloak'), {
      color: C.fur,
      roughness: 0.95,
      detail: 0.005,
      bump: (x, y, z) => 0.005 * noise.fbm(x * 55, y * 55, z * 55, 2),
    });

    // ------------------------------------------------------------------ breeches, knit cuffs, and tall black boots
    const breechLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, [KNEE[0], 0.15, 0], 0.052).bone('leg.L'),
      sdf.cone([KNEE[0], 0.15, 0], [ANKLE[0], 0.125, 0], 0.05, 0.05).bone('shin.L'),
    );
    k.body('breeches', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(breechLeg)), {
      color: C.pants,
      roughness: 0.85,
    });
    const knit = sdf.cylinder(0.056, 0.036, 0.012).at(ANKLE[0], 0.125, 0.001).bone('shin.L');
    k.body('knit', pair(knit), {
      color: C.knit,
      roughness: 0.95,
      detail: 0.004,
      bump: (x, y, z) => 0.003 * Math.sin(y * 220) * Math.cos(Math.atan2(x, z) * 40),
    });
    const shaft = sdf.cone([ANKLE[0], 0.11, 0], [ANKLE[0], 0.03, 0.004], 0.055, 0.052).bone('shin.L');
    const toe = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.043, 0.105]).at(0, 0.042, 0.042), sdf.sphere(0.052).at(0, 0.052, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(sdf.smoothUnion(0.012, shaft, toe)), { color: C.boot, roughness: 0.4, detail: 0.004 });

    // ------------------------------------------------------------------ the silver goblet in the raised right fist
    const g = h.arms.R.GRIP;
    const gx = -g[0];
    const gy = g[1];
    const gz = g[2];
    const foot = sdf.cylinder(0.034, 0.012, 0.005).at(0, -0.05, 0);
    const stem = sdf.cylinder(0.0125, 0.082, 0.004).at(0, -0.01, 0);
    const node = sdf.sphere(0.02).scale([1, 0.7, 1]).at(0, 0.03, 0);
    const bowlOuter = sdf.revolve(
      profile.polygon(
        [
          [0, 0.022],
          [0.018, 0.026],
          [0.036, 0.042],
          [0.043, 0.06],
          [0.042, 0.078],
          [0, 0.078],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const bowl = bowlOuter.subtract(sdf.ellipsoid([0.034, 0.045, 0.034]).at(0, 0.066, 0));
    const goblet = sdf.smoothUnion(0.008, foot, stem, node, bowl).scale(1.3).at(gx + 0.022, gy + 0.015, gz);
    k.body('goblet', goblet, { color: C.button, roughness: 0.32, metalness: 0.8, detail: 0.003, bone: 'knife.R' });
  },
});
