import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Apothecary — Chibi Quest settlement NPC (catalog `npcs/settlement/apothecary`), about 1.0 m to the
 * top of the hair bun, faces +Z. Target: docs/npc-mockups/apothecary_001.jpg. Built on the humanoid
 * kind (assets/parts/humanoid-kind.ts), dressed in `extra`.
 *
 * Role: the potion shop NPC, seen in 3D and as a 128 px sprite; the round gold spectacles, the gray
 *   bun, and the two glowing bottles must read.
 * One idea: a kind old woman in a plum dress and a cream pocket apron who shows off two bright
 *   potions, a big teal one at the chest and a small green one held up high.
 * Shape language: round and soft (bun, spectacles, bottles, flared skirt) with the long flask neck
 *   as the one slim form.
 * Palette (60/30/10): plum #6a3a5a (dress), cream #e8dcc0 (apron), gray #b8b4c4 (hair); gold
 *   #c8a040 (spectacles), brown #5a3a24 (shoes), vials #b04a3a / #3a6ab0 / #c8a040; the glowing teal
 *   #2a9a8a and pale green potions are the accent.
 * Value plan: the dark plum frames the light apron; the gray hair and the gold rims frame the face;
 *   the glowing liquids are the brightest spots.
 * Bodies: skin, hair, bun, spectacles, dress, trim, apron, pockets, vials, shoes, bottle (glass, liquid,
 *   cork), flask (glass, liquid, cork), wisp.
 * Rig: the humanoid kind's skeleton and clips. Both arms hold a rest pose (`pose`); the bottle is
 *   rigid on `knife.R` and the flask on `knife.L`.
 */

const C = {
  hair: '#9a9a9f',
  gold: '#c8a040',
  apron: '#e8dcc0',
  seam: '#cdbb94',
  pocket: '#d8caa4',
  vial1: '#b04a3a',
  vial2: '#3a6ab0',
  vial3: '#c8a040',
  cap: '#f3ead6',
  capGreen: '#3f8a4c',
  brow: '#c0bec6',
  shoe: '#5a3a24',
  glass: '#c8e8e0',
  teal: '#2a9a8a',
  cork: '#9a6a3a',
  green: '#a8e8b8',
  greenGlow: '#c8f4d0',
  button: '#f3ead6',
};

type V3 = readonly [number, number, number];

export default humanoidAsset({
  name: 'apothecary',
  description: 'A kind old apothecary woman in a plum dress and a pocketed apron, holding up two glowing potion bottles.',
  reference: 'docs/npc-mockups/apothecary_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { silver: '#9a9a9f', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { mauve: '#80506c', berry: '#8a4f60', indigo: '#55557a', pine: '#4a6a5e' },
  },
  presets: {
    plum: { skin: 'fair', hair: 'silver', eyes: 'brown', cloth: 'mauve' },
    garden: { skin: 'tan', hair: 'silver', eyes: 'green', cloth: 'pine' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: C.shoe,
  pose: {
    R: { elbow: [0.18, 0.345, 0.05], wrist: [0.21, 0.385, 0.16] },
    L: { elbow: [0.2, 0.345, 0.03], wrist: [0.255, 0.42, 0.09] },
  },

  // Old skin: the kind's brows are painted out (bushy brows are their own body), and soft laugh and
  // forehead lines in a darker skin tone.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.034, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const line = '#c48e6c';
    const laugh = sdf.extrude(profile.arc(0.08, 0.0045, -32, 32), 0.3).at(0, 0.545, 0.1).mirror('x', 0);
    const forehead = sdf.extrude(profile.arc(0.3, 0.004, 76, 104), 0.3).at(0, 0.438, 0.1);
    const forehead2 = sdf.extrude(profile.arc(0.3, 0.004, 76, 104), 0.3).at(0, 0.424, 0.1);
    const feet = sdf.extrude(profile.arc(0.06, 0.004, -20, 20), 0.3).at(0.1, 0.628, 0.1).mirror('x', 0);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(laugh, line, 0.002)
      .paintWhere(forehead, line, 0.002)
      .paintWhere(forehead2, line, 0.002)
      .paintWhere(feet, line, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y, EYE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ hair: a soft cap, temple locks, a bun
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    const hairColor = k.tint('hair');
    const shell = sdf.ellipsoid([0.215, 0.21, 0.199]);
    // The face mask (head-local): its top is the hairline over the forehead, its sides the temples.
    const faceMask = sdf.ellipsoid([0.14, 0.13, 0.13]).at(0, -0.045, 0.19);
    const cap = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.07)).smoothSubtract(0.012, faceMask);
    const lock = (s: 1 | -1) =>
      sdf.chain(
        [
          [0.15 * s, 0.07, 0.12, 0.03],
          [0.172 * s, 0.01, 0.1, 0.028],
          [0.183 * s, -0.04, 0.07, 0.025],
          [0.18 * s, -0.075, 0.02, 0.02],
        ],
        0.02,
      );
    const bun = sdf.smoothUnion(
      0.025,
      sdf.ellipsoid([0.075, 0.058, 0.068]).at(0, 0.215, -0.09),
      sdf.sphere(0.042).at(0.042, 0.245, -0.092),
      sdf.sphere(0.042).at(-0.042, 0.245, -0.09),
      sdf.sphere(0.04).at(0, 0.262, -0.078),
      sdf.sphere(0.038).at(0, 0.235, -0.13),
    );
    const hairShade = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) => mixRgb(base, rgb('#303034'), 0.3 * (0.5 + 0.5 * Math.sin(x * 110 + y * 70 + Math.sin(z * 45 + x * 20) * 2.5)));
    const strands = (x: number, y: number, z: number) => 0.003 * Math.sin(x * 110 + y * 70 + Math.sin(z * 45 + x * 20) * 2.5);
    const hairShape = sdf.smoothUnion(0.02, cap, pair(lock(1)), bun);
    k.body('hair', headPose(hairShape.paintFn(hairShade)), { color: hairColor, roughness: 0.65, detail: 0.005, bump: strands });

    // ------------------------------------------------------------------ big round nose and bushy gray brows
    const noseZ = h.faceZ(0, 0.566);
    k.body('nose', sdf.sphere(0.03).at(0, 0.562, noseZ + 0.008).bone('head'), { color: k.tint('skin'), roughness: 0.55, detail: 0.004, textureDensity: 2 });
    const browLine = (s: 1 | -1) => {
      const pts: [number, number, number, number][] = [
        [0.052, 0.708, 0, 0.012],
        [0.085, 0.717, 0, 0.0145],
        [0.12, 0.714, 0, 0.0145],
        [0.152, 0.7, 0, 0.012],
        [0.17, 0.686, 0, 0.0085],
      ];
      return sdf.chain(pts.map(([x, y, , r]) => [x * s, y, h.faceZ(x, y) + 0.004, r] as [number, number, number, number]), 0.01);
    };
    const browStrands = (x: number, y: number, z: number) => 0.003 * Math.sin(x * 160 + y * 120 + z * 40);
    k.body('brows', sdf.union(browLine(1), browLine(-1)).bone('head'), { color: k.tint('hair', -0.1), roughness: 0.7, detail: 0.004, bump: browStrands });

    // ------------------------------------------------------------------ round gold spectacles
    const zAt = (x: number, y: number) => h.faceZ(x, y);
    const ringAt = (s: 1 | -1) =>
      sdf
        .torus(0.057, 0.0065)
        .rotateX(90)
        .rotateY(26 * s)
        .at(EYE[0] * s, EYE[1] + 0.002, zAt(EYE[0], EYE[1]) + 0.008);
    const bridge = sdf.capsule([-0.05, EYE[1] + 0.012, zAt(0.03, EYE[1]) + 0.01], [0.05, EYE[1] + 0.012, zAt(0.03, EYE[1]) + 0.01], 0.0055);
    const arms = pair(sdf.capsule([0.158, EYE[1] + 0.008, zAt(0.158, EYE[1]) + 0.004], [0.195, EYE[1] + 0.01, 0.06], 0.0055));
    k.body('spectacles', sdf.union(ringAt(1), ringAt(-1), bridge, arms).bone('head'), {
      color: C.gold,
      roughness: 0.3,
      metalness: 0.85,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ dress: bodice, flared skirt, long sleeves
    const clothShade = k.tint('cloth', -0.18);
    const skirtAt = (d: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.31],
              [0.134 + d, 0.31],
              [0.15 + d, 0.26],
              [0.185 + d, 0.21],
              [0.215 + d, 0.17],
              [0.225 + d, 0.15],
              [0, 0.15],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.82]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.32],
            [0.118, 0.32],
            [0.134, 0.26],
            [0.169, 0.21],
            [0.199, 0.17],
            [0.208, 0.12],
            [0, 0.12],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const skirt = skirtAt(0).subtract(skirtInner);
    const bodice = h.torso.round(0.011).intersect(sdf.halfSpace([0, 1, 0], 0.455));
    const collar = sdf.torus(0.062, 0.018).at(0, 0.45, -0.012).bone('chest');
    const sleeve = (j: { ELBOW: V3; WRIST: V3 }) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.92), 0.043, 0.04).bone('forearm.L'),
      );
    const dress = sdf
      .smoothUnion(0.012, h.weighted(sdf.smoothUnion(0.02, bodice, skirt)), h.perArm(sleeve), collar)
      .paintWhere(h.band(0.256, 0.272), clothShade, 0.003)
      .paintWhere(h.band(0.15, 0.165), clothShade, 0.003);
    k.body('dress', dress, { color: h.tint.shirt!, roughness: 0.85 });

    // The cuffs: darker bands at the wrists, and cream buttons at the collar.
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 0.98), 0.0445, 0.0435).round(0.002).bone('forearm.L'));
    const buttonZ = (y: number) => sdf.raycast(bodice, [0, y, 1], [0, 0, -1])![2];
    const buttons = sdf.union(...[0.43, 0.405, 0.38].map((y) => sdf.sphere(0.0105).at(0, y, buttonZ(y) + 0.002))).bone('chest');
    k.body('trim', cuffs, { color: clothShade, roughness: 0.85, detail: 0.004 });
    k.body('buttons', buttons, { color: C.button, roughness: 0.5, detail: 0.003 });

    // ------------------------------------------------------------------ cream apron with three pockets
    const torsoShell = h.torso.round(0.02).subtract(h.torso.round(0.008));
    const front = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.4], 0.012).at(0, (y0 + y1) / 2, 0.2);
    const bib = torsoShell.intersect(front(0.082, 0.27, 0.425));
    const strap = torsoShell
      .intersect(sdf.box([0.034, 0.5, 0.6]).at(0.07, 0.4, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.3))
      .intersect(sdf.halfSpace([0, 1, 0], 0.5))
      .bone('chest');
    const panelShell = skirtAt(0.012).subtract(skirtAt(0.0));
    const panel = panelShell.intersect(sdf.box([0.25, 0.12, 0.4], 0.02).at(0, 0.245, 0.2));
    const apron = sdf
      .smoothUnion(0.008, h.weighted(bib), pair(strap), h.weighted(panel))
      .paintWhere(h.band(0.27, 0.282), C.seam, 0.002)
      .paintWhere(h.band(0.185, 0.198), C.seam, 0.002);
    k.body('apron', apron, { color: C.apron, roughness: 0.9, detail: 0.005 });

    const apronFront = skirtAt(0.012);
    const pocketY = 0.228;
    const pocketX = [-0.065, 0.065];
    const pocketZ = pocketX.map((x) => sdf.raycast(apronFront, [x, pocketY, 1], [0, 0, -1])![2]);
    const pockets = sdf.union(...pocketX.map((x, i) => sdf.box([0.066, 0.056, 0.02], 0.01).at(x, pocketY, pocketZ[i]! - 0.002)));
    k.body('pockets', h.weighted(pockets), { color: C.pocket, roughness: 0.9, detail: 0.004 });

    const vial = (i: number, color: string, tilt: number) => {
      const z = pocketZ[i]! + 0.002;
      const x = pocketX[i]!;
      const glass = sdf.cylinder(0.0115, 0.06, 0.004).at(0, 0.035, 0).paint(color);
      const cap = sdf.cylinder(0.0135, 0.018, 0.004).at(0, 0.074, 0).paint(C.capGreen);
      return sdf.union(glass, cap).rotateZ(tilt).at(x, pocketY, z);
    };
    k.body('vials', h.weighted(sdf.union(vial(0, C.vial1, 6), vial(1, C.vial2, -6))), {
      color: C.vial2,
      roughness: 0.25,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ the potion bottle (right hand, x < 0)
    const gR = h.arms.R.GRIP;
    const bottleAt: V3 = [-gR[0], gR[1] + 0.072, gR[2] + 0.012];
    const bottleOuter = sdf.smoothUnion(0.012, sdf.sphere(0.05), sdf.cylinder(0.02, 0.06, 0.004).at(0, 0.06, 0));
    const bottleInner = bottleOuter.round(-0.007);
    const bottleGlass = bottleOuter.subtract(bottleInner);
    const bottleLiquid = bottleInner.round(-0.0005).intersect(sdf.halfSpace([0, 1, 0], 0.012));
    const cork = sdf.cylinder(0.0165, 0.034, 0.005).at(0, 0.098, 0);
    const inR = (s: sdf.Shape) => s.scale(1.3).at(...bottleAt).bone('knife.R');
    k.body('bottle-glass', inR(bottleGlass), { color: C.glass, roughness: 0.1, opacity: 0.6, detail: 0.0035 });
    k.body('bottle-liquid', inR(bottleLiquid), { color: C.teal, roughness: 0.2, emissive: C.teal, emissiveIntensity: 0.6, detail: 0.004 });
    k.body('bottle-cork', inR(cork), { color: C.cork, roughness: 0.85, detail: 0.003 });
    const collarRing = sdf.cylinder(0.0225, 0.01, 0.004).at(0, 0.082, 0);
    k.body('bottle-ring', inR(collarRing), { color: C.gold, roughness: 0.3, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ the small flask (left hand, x > 0)
    const gL = h.arms.L.GRIP;
    const flaskAt: V3 = [gL[0], gL[1] + 0.034, gL[2] + 0.006];
    const flaskOuter = sdf.smoothUnion(0.008, sdf.sphere(0.03), sdf.cylinder(0.0125, 0.075, 0.003).at(0, 0.05, 0));
    const flaskInner = flaskOuter.round(-0.005);
    const flaskGlass = flaskOuter.subtract(flaskInner);
    const flaskLiquid = flaskInner.round(-0.0005).intersect(sdf.halfSpace([0, 1, 0], 0.012));
    const flaskCork = sdf.cylinder(0.0115, 0.022, 0.004).at(0, 0.095, 0);
    const inL = (s: sdf.Shape) => s.at(...flaskAt).bone('knife.L');
    k.body('flask-glass', inL(flaskGlass), { color: C.glass, roughness: 0.1, opacity: 0.6, detail: 0.0028 });
    k.body('flask-liquid', inL(flaskLiquid), { color: C.green, roughness: 0.2, emissive: C.greenGlow, emissiveIntensity: 0.7, detail: 0.003 });
    k.body('flask-cork', inL(flaskCork), { color: C.cork, roughness: 0.85, detail: 0.003 });
    // A little curl of pale green glow above the flask.
    const wisp = sdf.chain(
      [
        [0, 0.108, 0, 0.012],
        [0.008, 0.13, 0, 0.011],
        [0.02, 0.15, 0, 0.0095],
        [0.02, 0.17, 0, 0.0085],
        [0.006, 0.18, 0, 0.0075],
        [-0.006, 0.172, 0, 0.0065],
        [-0.004, 0.16, 0, 0.0055],
      ],
      0.014,
    );
    k.body('wisp', inL(wisp), { color: C.greenGlow, roughness: 0.4, emissive: C.greenGlow, emissiveIntensity: 0.6, opacity: 0.85, detail: 0.003 });
  },
});
