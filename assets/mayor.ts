import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Mayor — Chibi Quest settlement NPC (catalog `npcs/settlement/mayor`), about 1.1 m to the top of
 * the top hat, faces +Z. Target: docs/npc-mockups/mayor_001.jpg. Built on the humanoid kind.
 *
 * Role: the town leader who gives quests, seen at the town hall in 3D and as a 128 px sprite; the
 *   tall hat, the gray mustache, the gold chain with its medallion, and the scroll must read.
 * One idea: a jolly, round mayor under a tall black top hat, in a long burgundy coat with a heavy
 *   gold chain of office and a rolled scroll in his left hand.
 * Shape language: round and soft (nose, mustache, chain beads), with the hat as the one tall hard form.
 * Palette (60/30/10): burgundy #7a2e3a (coat, hat band; the `cloth` slot) and near-black #2a2428 (hat,
 *   shoes) / gray #6a6870 (trousers), cream #f6f1ea (cravat), #dccfa8 (waistcoat) / gold #e0b040
 *   (chain, medallion, buttons) as the accent; hair and mustache silver #b8b4c4.
 * Value plan: the black hat over the light face is the focal point; the dark coat frames the pale
 *   waistcoat and cravat; the gold chain is the accent.
 * Bodies: skin (big nose, small grin), hat, hair, brows, mustache, coat, waistcoat, cravat, cuffs,
 *   chain, medallion, buttons, scroll.
 * Rig: the humanoid kind's skeleton and clips; the left arm is posed (fist at the chest) and keeps the pose
 *   in every clip. The scroll is rigid on `knife.L` (the left grip).
 */

const C = {
  hat: '#2a2428',
  vest: '#dccfa8',
  cream: '#f6f1ea',
  gold: '#e0b040',
  goldDark: '#a87c20',
  trousers: '#6a6870',
  shoe: '#2a2428',
  scroll: '#ece0c4',
  scrollIn: '#c9b78e',
  ribbon: '#b03a3a',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'mayor',
  description: 'A jolly, round town mayor in a tall black top hat and a long burgundy coat, with a gold chain of office and a rolled scroll.',
  reference: 'docs/npc-mockups/mayor_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { silver: '#a9a8a6', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { burgundy: '#7a2e3a', plum: '#5e3358', pine: '#2f5a45', navy: '#2f4468' },
  },
  presets: {
    default: { skin: 'fair', hair: 'silver', eyes: 'brown', cloth: 'burgundy' },
    festive: { skin: 'light', hair: 'brown', eyes: 'blue', cloth: 'pine' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: C.trousers,
  shoes: C.shoe,
  // The left arm holds the scroll upright at the chest; the right arm keeps the clip motion.
  pose: { L: { elbow: [0.2, 0.33, 0.0], wrist: [0.14, 0.32, 0.09] } },

  // A big round nose, thick brows painted over the kind's, and a small open grin under the mustache.
  paintSkin(skin, h) {
    const noseZ = h.faceZ(0, 0.572) + 0.012;
    const bigNose = sdf.smoothUnion(0.014, sdf.ellipsoid([0.052, 0.046, 0.054]).at(0, 0.573, noseZ + 0.002)).bone('head');
    const y = 0.497;
    const grin = profile.polygon(
      [
        [-0.064, 0.016],
        [-0.035, 0.005],
        [0, 0.0],
        [0.035, 0.005],
        [0.064, 0.016],
        [0.056, -0.006],
        [0.036, -0.02],
        [0.014, -0.028],
        [-0.014, -0.028],
        [-0.036, -0.02],
        [-0.056, -0.006],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.014))).intersect(sdf.box([0.15, 0.1, 1]).at(0, y, 0));
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 236, 304), 0.3).at(0, 0.6, 0.1);
    return skin
      .smoothUnion(0.01, bigNose)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(sdf.sphere(0.056).at(0, 0.573, noseZ + 0.016), h.tint.blush!, 0.02)
      .paintWhere(mouth, C.mouth)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y } = h.joints;
    const GRIP = h.arms.L.GRIP;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const cloth = h.tint.shirt!;

    // ------------------------------------------------------------------ top hat
    const hatPose = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y, 0);
    const crown = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.1],
            [0.172, 0.1],
            [0.168, 0.16],
            [0.162, 0.26],
            [0.166, 0.37],
            [0.172, 0.41],
            [0.158, 0.425],
            [0, 0.425],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.94]);
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.13, 0.098],
            [0.25, 0.104],
            [0.283, 0.124],
            [0.285, 0.14],
            [0.25, 0.136],
            [0.13, 0.136],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.94]);
    const bandSlab = sdf.box([1, 0.05, 1]).at(0, 0.175, 0);
    const hat = hatPose(sdf.smoothUnion(0.012, crown, brim).paintWhere(bandSlab.intersect(sdf.cylinder(0.2, 0.3).at(0, 0.175, 0)), cloth, 0.002)).bone('head');
    k.body('hat', hat, { color: C.hat, roughness: 0.7, detail: 0.004 });

    // Gray hair at the temples and the nape, below the brim.
    const nape = hatPose(
      sdf
        .ellipsoid([0.214, 0.208, 0.198])
        .smoothIntersect(0.025, sdf.halfSpace([0, -1, 0], 0.115))
        .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.025)),
    ).bone('head');
    const temple = pair(
      sdf.chain(
        [
          [0.17, 0.1, 0.1, 0.022],
          [0.192, 0.05, 0.062, 0.024],
          [0.2, -0.005, 0.04, 0.02],
          [0.198, -0.055, 0.045, 0.014],
        ],
        0.02,
      ),
    );
    const hair = sdf.smoothUnion(0.012, nape, hatPose(temple).bone('head'));
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // Thick arched brows and the mustache: their own bodies on the head bone.
    const fz = (x: number, y: number, lift: number): number => h.faceZ(x, y) + lift;
    const brow = pair(
      sdf.chain(
        [
          [0.05, 0.712, fz(0.05, 0.712, 0.006), 0.013],
          [0.092, 0.738, fz(0.092, 0.738, 0.004), 0.017],
          [0.135, 0.722, fz(0.135, 0.722, 0.0), 0.014],
          [0.158, 0.7, fz(0.158, 0.7, -0.004), 0.009],
        ],
        0.02,
      ),
    ).bone('head');
    k.body('brows', brow, { color: hairColor, roughness: 0.6, detail: 0.004, textureDensity: 2 });
    const must = pair(
      sdf.chain(
        [
          [0.004, 0.55, fz(0.004, 0.55, 0.012), 0.02],
          [0.04, 0.546, fz(0.04, 0.546, 0.012), 0.021],
          [0.08, 0.544, fz(0.08, 0.544, 0.01), 0.018],
          [0.114, 0.552, fz(0.114, 0.552, 0.007), 0.015],
          [0.142, 0.566, fz(0.142, 0.566, 0.004), 0.014],
          [0.158, 0.584, fz(0.158, 0.584, 0.002), 0.012],
          [0.15, 0.598, fz(0.15, 0.598, 0.002), 0.009],
        ],
        0.02,
      ),
    ).bone('head');
    k.body('mustache', must, { color: k.tint('hair', -0.1), roughness: 0.6, detail: 0.004, textureDensity: 2 });

    // Large ears: a skin shell over each kind ear, about 1.4 times its size.
    const ear = sdf
      .ellipsoid([0.037, 0.062, 0.045])
      .subtract(sdf.sphere(0.024).at(0.022, 0.0, 0.008))
      .rotateY(-12)
      .at(0.205, 0.612, -0.012)
      .bone('head');
    k.body('ears', ear.mirror('x', 0), { color: h.tint.skin!, roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ coat: torso, long tails, open front, sleeves
    const coatTorso = h.torso.round(0.014);
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.138, 0.3],
            [0.15, 0.24],
            [0.168, 0.19],
            [0.195, 0.14],
            [0.222, 0.09],
            [0, 0.09],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.32],
            [0.124, 0.32],
            [0.137, 0.24],
            [0.155, 0.19],
            [0.182, 0.14],
            [0.21, 0.085],
            [0, 0.07],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9]);
    const skirt = skirtOuter.subtract(skirtInner).bone('hips');
    // The open front: a wedge, narrow at the chest and wide at the hem.
    const wedge = sdf
      .extrude(
        profile.polygon([
          [-0.03, 0.48],
          [0.03, 0.48],
          [0.07, 0.3],
          [0.108, 0.08],
          [-0.108, 0.08],
          [-0.07, 0.3],
        ]),
        0.3,
      )
      .at(0, 0, 0.2);
    const collar = sdf
      .revolve(
        profile.polygon(
          [
            [0.066, 0.43],
            [0.1, 0.438],
            [0.13, 0.47],
            [0.164, 0.52],
            [0.186, 0.55],
            [0.196, 0.565],
            [0.184, 0.565],
            [0.174, 0.55],
            [0.148, 0.52],
            [0.118, 0.472],
            [0.085, 0.448],
            [0.066, 0.442],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.86])
      .subtract(sdf.box([0.6, 0.4, 0.3]).at(0, 0.5, 0.19))
      .bone('chest');
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.86), 0.043, 0.04).bone('forearm.L'),
      ),
    );
    const coatBody = sdf.smoothSubtract(0.01, sdf.smoothUnion(0.02, h.weighted(coatTorso), skirt), wedge);
    const coat = sdf.smoothUnion(0.012, coatBody, sleeves).smoothUnion(0.008, collar);
    k.body('coat', coat, { color: cloth, roughness: 0.85, detail: 0.005 });

    // The waistcoat in the opening, with a trouser waist painted below it.
    const vest = h.weighted(h.torso.round(0.006)).paintWhere(h.band(0.15, 0.218), C.trousers, 0.004);
    k.body('vest', vest, { color: C.vest, roughness: 0.85, detail: 0.005 });

    // Cuffs and the cravat.
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 1.0), 0.046, 0.047).round(0.002).bone('forearm.L'));
    const surf = (shape: sdf.Shape, x: number, y: number): number | null => {
      const hit = sdf.raycast(shape, [x, y, 1], [0, 0, -1]);
      return hit ? hit[2] : null;
    };
    const chestZ = surf(h.torso.round(0.006), 0, 0.42) ?? 0.09;
    const ruffle = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.036, 0.055, 0.02]).at(0, 0.405, chestZ + 0.008),
      sdf.ellipsoid([0.024, 0.04, 0.016]).rotateZ(-14).at(0.03, 0.428, chestZ + 0.002),
      sdf.ellipsoid([0.024, 0.04, 0.016]).rotateZ(14).at(-0.03, 0.428, chestZ + 0.002),
      sdf.torus(0.062, 0.017).scale([1, 1, 0.85]).at(0, 0.452, -0.008),
    ).bone('chest');
    k.body('cream', sdf.union(cuffs, ruffle), { color: C.cream, roughness: 0.9, detail: 0.004 });

    // Gold buttons along the opening, placed on the coat surface.
    const buttons = sdf.union(
      ...[0.385, 0.315, 0.245].flatMap((y) => {
        const x = 0.03 + (0.47 - y) * 0.2 + 0.028;
        return [x, -x].map((bx) => {
          const z = surf(coat, bx, y);
          return z === null ? sdf.sphere(0.0001).at(0, 5, 0) : sdf.sphere(0.012).at(bx, y, z - 0.002);
        });
      }),
    ).bone('chest');
    const vestButtons = sdf.union(
      ...[0.25, 0.21].map((y) => sdf.sphere(0.011).at(0, y, (surf(vest, 0, y) ?? 0.1) + 0.003)),
    ).bone('chest');
    k.body('buttons', sdf.union(buttons, vestButtons), { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ chain of office and medallion
    const front = sdf.union(coat, vest);
    const links: sdf.Shape[] = [];
    for (let i = -10; i <= 10; i++) {
      const u = i / 10;
      const x = 0.095 * u;
      const y = 0.33 + 0.12 * u * u;
      const z = surf(front, x, y);
      if (z !== null) links.push(sdf.sphere(0.0125).at(x, y, z + 0.004));
    }
    const mz = surf(vest, 0, 0.3) ?? 0.1;
    const medallion = sdf
      .union(
        sdf.cylinder(0.034, 0.012, 0.004),
        sdf.torus(0.027, 0.005).at(0, 0.008, 0),
        sdf.sphere(0.012).at(0, 0.01, 0),
      )
      .rotateX(90)
      .at(0, 0.304, mz + 0.01);
    k.body('chain', sdf.union(...links, medallion).bone('chest'), { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ scroll in the left hand
    // Upright in the left fist at the chest, the red ribbon above the hand, the top leaning in a little.
    const roll = sdf
      .cylinder(0.036, 0.2, 0.008)
      .subtract(sdf.cylinder(0.019, 0.02, 0.003).at(0, 0.1, 0))
      .subtract(sdf.cylinder(0.019, 0.02, 0.003).at(0, -0.1, 0))
      .paintWhere(sdf.cylinder(0.04, 0.02).at(0, 0.108, 0), C.scrollIn, 0.004)
      .paintWhere(sdf.cylinder(0.04, 0.02).at(0, -0.108, 0), C.scrollIn, 0.004);
    const ribbon = sdf
      .union(
        sdf.torus(0.037, 0.0065).at(0, 0.062, 0),
        sdf.ellipsoid([0.016, 0.008, 0.007]).rotateZ(25).at(0.034, 0.062, 0.02),
        sdf.ellipsoid([0.016, 0.008, 0.007]).rotateZ(-25).at(0.034, 0.075, 0.02),
        sdf.ellipsoid([0.007, 0.022, 0.005]).rotateZ(14).at(0.03, 0.04, 0.036),
      )
      .paint(C.ribbon);
    const scroll = sdf
      .union(roll, ribbon)
      .rotateZ(8)
      .at(GRIP[0] + 0.014, GRIP[1] - 0.005, GRIP[2] + 0.006);
    k.body('scroll', scroll, { color: C.scroll, roughness: 0.85, detail: 0.004, bone: 'knife.L' });
  },
});
