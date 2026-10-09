import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Cook — Chibi Quest settlement NPC (catalog `npcs/settlement/cook`), about 1.0 m to the top of the
 * kerchief cap, faces +Z. Target: docs/npc-mockups/cook_001.jpg. Built on the humanoid kind.
 *
 * Role: a tavern and castle kitchen NPC who serves food; seen in 3D and as a 128 px sprite. The white
 *   cap, the red neckerchief, the copper soup pot, and the raised wooden spoon must read.
 * One idea: a round, happy cook all in white whose red neckerchief and copper pot are the warm accents.
 * Shape language: round and soft (puffed cap, curls, pot, buttons); the long apron is the one big plane.
 * Palette (60/30/10): white #f6f1ea with shadows #d8d0c4 (cap, jacket, apron); neckerchief #b03a3a;
 *   trousers #6a6870, shoes #2a2428; hair #6b3e22; copper pot #b8683a, handles #8a4a2a, soup #c88a3a.
 * Value plan: a white mass over a mid gray base; the red scarf is the focal point at the face; the
 *   copper pot is the second accent at the hip.
 * Bodies: skin, hair, cap, jacket, trim, buttons, scarf, apron, pot, handles, soup, ladle, steam, spoon.
 * Rig: the humanoid kind's skeleton and clips. The left arm keeps a raised pose (the spoon beside the
 *   head); the right arm hangs and carries the pot, rigid on `knife.R`.
 */

const C = {
  white: '#f6f1ea',
  shade: '#d8d0c4',
  hair: '#6b3e22',
  button: '#fbf6ee',
  scarfFold: '#8a2a2a',
  pot: '#b8683a',
  handle: '#8a4a2a',
  soup: '#c88a3a',
  ladle: '#9a6a3a',
  spoon: '#a8763e',
  food: '#d8b040',
  steam: '#fbf6ee',
  pants: '#85838a',
  shoes: '#2a2428',
  mouth: '#c04a4a',
};

// The raised left arm (left-side values; the kind mirrors the right arm when it is posed).
const LEFT_POSE = { elbow: [0.2, 0.345, 0.03], wrist: [0.238, 0.425, 0.09] } as const;
// The right arm carries the pot forward and low; the pose holds in every clip, so the pot never swings into the head.
const RIGHT_POSE = { elbow: [0.2, 0.3, 0.03], wrist: [0.235, 0.335, 0.12] } as const;
type V3 = readonly [number, number, number];

export default humanoidAsset({
  name: 'cook',
  description: 'A round, happy cook in a white kerchief cap and jacket with a red neckerchief, carrying a steaming soup pot and a wooden spoon.',
  reference: 'docs/npc-mockups/cook_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { madder: '#b03a3a', ochre: '#c08a2e', plum: '#7a3f5e', teal: '#3f6f78' },
  },
  presets: {
    sunny: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'ochre' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: C.pants,
  shoes: C.shoes,
  pose: { L: LEFT_POSE, R: RIGHT_POSE },

  // A happy face: a bigger, redder smile and softly arched brows over the kind's defaults.
  paintSkin(skin, h) {
    const smile = sdf.extrude(profile.arc(0.07, 0.014, 238, 302), 0.3).at(0, 0.53 + 0.07, 0.1);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.075, 0.014, 58, 122), 0.3).at(0.1, 0.645, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(smile, C.mouth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): V3 => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ cap, tied at the back
    const capPose = (s: sdf.Shape) => s.rotateX(-7).at(0, HEAD_Y, 0);
    const dome = sdf
      .ellipsoid([0.222, 0.225, 0.212])
      .at(0, 0.035, 0)
      .intersect(sdf.halfSpace([0, -1, 0.325], -0.045));
    const puff = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.15, 0.09, 0.15]).at(0, 0.2, -0.03),
      sdf.sphere(0.08).at(-0.08, 0.215, -0.01),
      sdf.sphere(0.07).at(0.08, 0.215, -0.03),
      sdf.sphere(0.07).at(0, 0.215, -0.09),
    );
    const knot = sdf.smoothUnion(
      0.012,
      sdf.sphere(0.03).at(0, 0.115, -0.215),
      sdf.chain([[0.01, 0.115, -0.225, 0.017], [0.07, 0.085, -0.25, 0.017], [0.1, 0.045, -0.255, 0.014]], 0.01),
      sdf.chain([[-0.01, 0.115, -0.225, 0.017], [-0.05, 0.075, -0.255, 0.017], [-0.07, 0.025, -0.262, 0.014]], 0.01),
    );
    const cap = capPose(sdf.smoothUnion(0.035, dome, puff, knot)).bone('head');
    k.body('cap', cap, { color: C.white, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 55 + z * 40) * Math.cos(y * 45) });

    // ------------------------------------------------------------------ brown curls: a front roll, temples, and nape
    const surfZ = (x: number, y: number) => 0.19 * Math.sqrt(Math.max(0.05, 1 - (x / 0.205) ** 2 - (y / 0.2) ** 2));
    const rollPts = Array.from({ length: 11 }, (_, i) => {
      const th = ((-1 + (2 * i) / 10) * 82 * Math.PI) / 180;
      const x = 0.2 * Math.sin(th);
      const y = 0.095 * Math.cos(th) - 0.005 + 0.012 * Math.sin(th * 5);
      return [x, y, surfZ(x, y) + 0.008, 0.03] as [number, number, number, number];
    });
    const roll = sdf.chain(rollPts, 0.02);
    // Wavy locks that fall past the ears: a zigzag chain that ends in a curl.
    const lock = (s: number, x0: number, z0: number, y0: number, len: number, phase: number) =>
      sdf.chain(
        Array.from({ length: 6 }, (_, i) => {
          const t = i / 5;
          return [s * (x0 + 0.014 * Math.sin(phase + t * 9) - 0.012 * t * t), y0 - len * t, z0 + 0.014 * Math.cos(phase + t * 9), 0.03 - 0.008 * t] as [number, number, number, number];
        }),
        0.012,
      );
    const sideCurl = (s: number) =>
      sdf.smoothUnion(0.015, lock(s, 0.19, 0.05, 0.02, 0.2, 0), lock(s, 0.2, -0.02, -0.02, 0.2, 2), lock(s, 0.17, -0.1, -0.02, 0.17, 4));
    const hairShell = sdf.ellipsoid([0.214, 0.208, 0.198]);
    const tips = sdf.union(
      ...[-72, -54, -36, -18, 0, 18, 36, 54, 72].flatMap((a, i) => {
        const sx = 0.18 * Math.sin((a * Math.PI) / 180);
        const sz = -0.167 * Math.cos((a * Math.PI) / 180);
        return [
          sdf.sphere(0.03).at(sx, -0.085 - 0.012 * (i % 2), sz),
          sdf.sphere(0.026 - 0.002 * (i % 2)).at(sx * 0.96 + 0.01 * (i % 2 ? 1 : -1), -0.15 - 0.02 * (i % 2), sz * 0.95),
        ];
      }),
    );
    const back = hairShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.1)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const hairBack = capPose(sdf.smoothUnion(0.02, back, tips, roll, sideCurl(1), sideCurl(-1))).bone('head');
    k.body('hair', hairBack, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ jacket: double-breasted, long sleeves, cuffs
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.049, 0.045).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.045, 0.041).bone('forearm.L'),
      ),
    );
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 1.0), 0.046, 0.047).round(0.002).bone('forearm.L'));
    const jacket = sdf
      .smoothUnion(0.012, h.weighted(h.torso.round(0.011)), sleeves)
      .paintWhere(sdf.box([0.006, 0.3, 0.6]).at(0.008, 0.33, 0), C.shade, 0.002)
      .paintWhere(sdf.box([0.006, 0.3, 0.6]).at(-0.095, 0.33, 0).rotateZ(0), C.shade, 0.002)
      .paintWhere(h.band(0.155, 0.168), C.shade, 0.002);
    k.body('jacket', jacket, { color: C.white, roughness: 0.88, detail: 0.005 });
    k.body('trim', cuffs, { color: C.shade, roughness: 0.9, detail: 0.004 });

    // Two rows of white buttons, set on the torso surface with probes.
    const buttonAt = (x: number, y: number) => {
      const hit = sdf.raycast(h.torso.round(0.011), [x, y, 0.6], [0, 0, -1]);
      return sdf.ellipsoid([0.0175, 0.0175, 0.011]).at(x, y, (hit ? hit[2] : 0.1) + 0.001);
    };
    const buttons = sdf.union(...[0.405, 0.34].flatMap((y) => [-0.052, 0.052].map((x) => buttonAt(x, y))));
    k.body('buttons', buttons.bone('chest'), { color: C.button, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ red neckerchief: a collar, a knot, and two ends
    const collar = sdf.torus(0.063, 0.02).at(0, 0.452, -0.012).bone('chest');
    const tieShell = h.torso.round(0.022).subtract(h.torso.round(0.005));
    // A kerchief: a V panel on the chest, a knot at the throat, and two loose ends of different lengths.
    const poly = (pts: [number, number][]) => sdf.extrude(profile.polygon(pts), 0.3).at(0, 0, 0.15);
    const panel = poly([[-0.092, 0.462], [0.092, 0.462], [0.012, 0.372]]);
    const tail = (pts: [number, number][]) => poly(pts);
    const tails = sdf.union(
      tail([[0.01, 0.44], [0.045, 0.447], [0.108, 0.39], [0.082, 0.366]]),
      tail([[-0.01, 0.44], [-0.04, 0.45], [-0.086, 0.368], [-0.112, 0.388]]),
    );
    const ends = tieShell.intersect(sdf.union(panel, tails)).intersect(sdf.halfSpace([0, 0, -1], -0.01)).bone('chest');
    const tieKnot = sdf.ellipsoid([0.03, 0.026, 0.024]).at(0, 0.442, (sdf.raycast(h.torso.round(0.011), [0, 0.442, 0.6], [0, 0, -1])?.[2] ?? 0.1) + 0.008).bone('chest');
    const scarf = sdf.smoothUnion(0.012, collar, ends, tieKnot);
    k.body('scarf', scarf, { color: h.tint.shirt!, roughness: 0.82, detail: 0.004 });

    // ------------------------------------------------------------------ long apron: a flared skirt panel and a waist band
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.138, 0.3],
            [0.15, 0.26],
            [0.16, 0.22],
            [0.172, 0.185],
            [0.18, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.31],
            [0.124, 0.31],
            [0.136, 0.26],
            [0.146, 0.22],
            [0.158, 0.185],
            [0.166, 0.14],
            [0, 0.14],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const skirt = skirtOuter.subtract(skirtInner).intersect(sdf.box([0.31, 0.25, 0.4], 0.02).at(0, 0.2, 0.2));
    const waist = h.torso.round(0.017).subtract(h.torso.round(0.005)).intersect(h.band(0.268, 0.304));
    const apron = sdf
      .smoothUnion(0.008, h.weighted(skirt), h.weighted(waist))
      .paintWhere(h.band(0.268, 0.304), C.shade, 0.002)
      .paintWhere(h.band(0.15, 0.162), C.shade, 0.002);
    k.body('apron', apron, { color: C.white, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ the soup pot, hung from the right fist
    const [gx, gy, gz] = h.arms.R.GRIP;
    const fist: V3 = [-gx, gy, gz];
    const P = { x: fist[0], y: fist[1] - 0.157, z: fist[2] }; // the pot's base center
    const potProfile = (inset: number, lift: number) =>
      profile.polygon(
        [
          [0, lift],
          [0.05 - inset, lift],
          [0.082 - inset, 0.03],
          [0.09 - inset, 0.07],
          [0.082 - inset, 0.105],
          [0.088 - inset * 0.4, 0.125],
          [0, 0.125],
        ],
        { smooth: true, samples: 6 },
      );
    const potOuter = sdf.revolve(potProfile(0, 0)).at(P.x, P.y, P.z);
    const pot = potOuter.subtract(sdf.cylinder(0.078, 0.1).at(P.x, P.y + 0.125, P.z)).bone('knife.R');
    k.body('pot', pot, { color: C.pot, roughness: 0.4, metalness: 0.6, detail: 0.004 });

    const bail = sdf.chain(
      [
        [P.x + 0.088, P.y + 0.1, P.z, 0.014],
        [P.x + 0.055, P.y + 0.15, P.z, 0.015],
        [P.x, P.y + 0.165, P.z, 0.015],
        [P.x - 0.055, P.y + 0.15, P.z, 0.015],
        [P.x - 0.088, P.y + 0.1, P.z, 0.014],
      ],
      0.01,
    );
    const lugs = sdf.union(sdf.sphere(0.02).at(P.x + 0.088, P.y + 0.1, P.z), sdf.sphere(0.02).at(P.x - 0.088, P.y + 0.1, P.z));
    k.body('handles', sdf.smoothUnion(0.01, bail, lugs).bone('knife.R'), { color: C.handle, roughness: 0.55, metalness: 0.3, detail: 0.004 });

    const soup = sdf.cylinder(0.078, 0.03, 0.012).at(P.x, P.y + 0.1, P.z);
    k.body('soup', soup.bone('knife.R'), { color: C.soup, roughness: 0.35, detail: 0.004 });

    // A ladle leans out of the pot to the back and the outside: a handle, a hooked tip, and a bowl in the soup.
    const ladle = sdf.smoothUnion(
      0.012,
      sdf.chain([[P.x - 0.02, P.y + 0.1, P.z - 0.03, 0.017], [P.x - 0.07, P.y + 0.18, P.z - 0.05, 0.016], [P.x - 0.12, P.y + 0.26, P.z - 0.055, 0.016]], 0.01),
      sdf.sphere(0.024).at(P.x - 0.12, P.y + 0.265, P.z - 0.055),
      sdf.sphere(0.04).at(P.x - 0.015, P.y + 0.095, P.z - 0.03),
    );
    k.body('ladle', ladle.bone('knife.R'), { color: C.ladle, roughness: 0.7, detail: 0.004 });

    const steamCurl = sdf.chain(
      [
        [P.x + 0.03, P.y + 0.16, P.z + 0.03, 0.011],
        [P.x + 0.005, P.y + 0.2, P.z + 0.035, 0.01],
        [P.x + 0.035, P.y + 0.24, P.z + 0.04, 0.009],
        [P.x + 0.01, P.y + 0.28, P.z + 0.04, 0.007],
      ],
      0.01,
    );
    k.body('steam', steamCurl.bone('knife.R'), { color: C.steam, roughness: 0.9, opacity: 0.5, detail: 0.003 });

    // ------------------------------------------------------------------ the wooden spoon, raised in the left fist
    // Built along the held-item axis of the rest pose, then turned with the raised hand.
    const g = h.arms.L.GRIP;
    const spoonPose = (s: sdf.Shape) => s.rotateX(8).rotateZ(-16).at(g[0], g[1], g[2]);
    const spoon = sdf.smoothUnion(
      0.012,
      sdf.capsule([0, -0.06, 0], [0, 0.12, 0], 0.017),
      sdf.ellipsoid([0.028, 0.044, 0.016]).at(0, 0.15, 0),
    );
    const food = sdf.ellipsoid([0.026, 0.036, 0.02]).at(0, 0.15, 0.014);
    k.body('spoon', spoonPose(spoon).bone('knife.L'), { color: C.spoon, roughness: 0.75, detail: 0.004 });
    k.body('food', spoonPose(food).bone('knife.L'), { color: C.food, roughness: 0.6, detail: 0.004 });
  },
});
