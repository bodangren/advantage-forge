import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Baker: a cheerful village baker NPC (catalog `npcs/settlement/baker`), about 1.0 m to the top of
 * the chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind (the
 * avatar base's skeleton, face, arms, and fists), dressed in `extra`. The kind's `hold` option is
 * not used, so the arms hang at the sides.
 *
 * Role: a town NPC in the Chibi Quest bakery, seen in 3D and as a 128 px sprite. The hat, the
 *   apron, the tray with two loaves, and the open smile must read.
 * One idea: a round, happy baker in a tall puffy white chef hat with a brown tuft, carrying a tray
 *   of bread at the waist.
 * Shape language: round and soft (puffed hat, round loaves, rounded tray and apron corners).
 * Palette: skin #f2c7a4; cream #f3ead6 (hat, cuffs, socks); shirt #8a5a3a; apron #e8dcc0 with
 *   #cdbb94 seams; trousers #4a3428; shoes #c89a6a; tray #9a6a3a; loaves #c88a3a, tops #e0a850.
 * Value plan: the cream hat frames the face (focal point); the brown shirt and the dark trousers
 *   ground the body; the cream apron and the loaves are the light masses.
 * Bodies: skin, hair (the tuft), hat, shirt, cuffs, apron, socks, trousers, shoes, tray, loaves.
 * Rig: the humanoid kind's skeleton and clips (idle, walk, run, attack, hit, rest, cheer, cast).
 *   The tray and the loaves are rigid on `chest`, so the tray stays level with the body.
 * Color slots: skin, hair, eyes, cloth (the shirt). Presets: default and tan.
 */

const CREAM = '#f3ead6';
const TRAY_Y = 0.235;
const ELBOW_T = 0.9;

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const along = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export default humanoidAsset({
  name: 'baker-f3',
  description: 'Chibi village baker NPC: a tall white chef hat with a brown tuft, a brown shirt, a cream apron, and a wooden tray of two loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    // The baker's brown shirt first (the default), then the avatar base's other cloth dyes.
    cloth: { brown: '#8a5a3a', sky: '#5f84ad', linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    default: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'brown' },
    tan: { skin: 'tan', hair: 'black', eyes: 'hazel', cloth: 'linen' },
  },
  hair: false,
  undershirt: false,
  pants: '#4a3428',
  shoes: '#c89a6a',

  // A wide open smile: the lower half of an ellipse with teeth on top and a tongue inside.
  paintSkin(skin, h) {
    const MOUTH_Y = 0.545;
    const open = sdf
      .extrude(profile.circle(0.05), 0.3)
      .scale([1, 0.6, 1])
      .at(0, MOUTH_Y, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y));
    const teeth = sdf.box([0.06, 0.012, 0.3], 0.002).at(0, MOUTH_Y - 0.004, 0.1).intersect(open);
    const tongue = sdf.extrude(profile.circle(0.02), 0.3).at(0, MOUTH_Y - 0.03, 0.1).intersect(open);
    const mouth = h.tint.mouth ?? '#a4503f';
    return skin.paintWhere(open, mouth).paintWhere(teeth, '#fbf6ee').paintWhere(tongue, '#d8706a');
  },

  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, ANKLE } = h.joints;

    // ------------------------------------------------------------------ chef hat: a band and a puffed top
    const band = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.79],
            [0.19, 0.79],
            [0.195, 0.82],
            [0.19, 0.86],
            [0, 0.86],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    const puff = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.19, 0.11, 0.18]).at(0, 0.9, -0.01),
      sdf.ellipsoid([0.13, 0.09, 0.13]).at(-0.09, 0.96, -0.03),
      sdf.ellipsoid([0.12, 0.085, 0.12]).at(0.1, 0.97, -0.05),
    );
    k.body('hat', sdf.smoothUnion(0.02, band, puff).bone('head'), { color: CREAM, roughness: 0.8, detail: 0.006 });

    // A brown tuft over the front of the band.
    const tuft = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.03, 0.026, 0.03]).at(-0.025, 0.862, 0.19),
      sdf.ellipsoid([0.032, 0.03, 0.03]).at(0.01, 0.872, 0.2),
      sdf.ellipsoid([0.026, 0.022, 0.026]).at(0.04, 0.855, 0.185),
    );
    k.body('hair', tuft.bone('head'), { color: k.tint('hair'), roughness: 0.6, detail: 0.006 });

    // ------------------------------------------------------------------ shirt with long sleeves and cream rolled cuffs
    const sleeve = sdf.smoothUnion(
      0.012,
      sdf.cone(SHOULDER, ELBOW, 0.047, 0.043).bone('upperarm.L'),
      sdf.cone(ELBOW, along(ELBOW, WRIST, ELBOW_T), 0.043, 0.038).bone('forearm.L'),
    );
    k.body('shirt', sdf.union(h.weighted(h.torso), pair(sleeve)), { color: h.tint.shirt ?? '#8a5a3a', roughness: 0.85, detail: 0.006 });

    const cuff = sdf.cone(along(ELBOW, WRIST, 0.8), along(ELBOW, WRIST, 0.93), 0.047, 0.046).round(0.006).bone('forearm.L');
    k.body('cuffs', pair(cuff), { color: CREAM, roughness: 0.8, detail: 0.006 });

    // ------------------------------------------------------------------ apron: a bib, a skirt panel to the knees, two straps
    const outline = profile.polygon(
      [
        [-0.085, 0.275],
        [0.085, 0.275],
        [0.075, 0.2],
        [0.115, 0.14],
        [0.13, 0.11],
        [-0.13, 0.11],
        [-0.115, 0.14],
        [-0.075, 0.2],
      ],
      { smooth: false },
    );
    const seam = sdf.box([0.3, 0.014, 0.2]).at(0, 0.125, 0.12);
    const bibSeam = sdf.box([0.2, 0.01, 0.2]).at(0, 0.266, 0.12);
    const panel = sdf.extrude(outline, 0.03, 0.008).round(0.004).at(0, 0, 0.12);
    // The straps run up and back over the shoulders, outside the loaves and behind the tray.
    const straps = pair(sdf.capsule([0.075, 0.27, 0.11], [0.13, 0.37, 0.05], 0.011));
    const apron = sdf
      .union(panel, straps)
      .paintWhere(seam, '#cdbb94')
      .paintWhere(bibSeam, '#cdbb94');
    k.body('apron', apron, { color: '#e8dcc0', roughness: 0.9, detail: 0.006 });

    // ------------------------------------------------------------------ cream socks above the shoes
    const sock = pair(sdf.cylinder(0.05, 0.022, 0.01).at(ANKLE[0], 0.095, 0).bone('shin.L'));
    k.body('socks', sock, { color: CREAM, roughness: 0.8, detail: 0.006 });

    // ------------------------------------------------------------------ the tray and the loaves (rigid on the chest)
    // The tray sits in front of the apron, with its ends at the fists, below the chin by 0.25 m.
    const tray = sdf.box([0.42, 0.018, 0.16], 0.007).at(0, TRAY_Y, 0.13);
    k.body('tray', tray, { color: '#9a6a3a', roughness: 0.6, detail: 0.006, bone: 'chest' });

    const loafA = sdf.ellipsoid([0.058, 0.042, 0.05]).at(-0.085, 0.282, 0.13);
    const loafB = sdf.ellipsoid([0.05, 0.036, 0.046]).at(0.09, 0.276, 0.15);
    const seeds = sdf.union(
      sdf.sphere(0.007).at(-0.1, 0.319, 0.12),
      sdf.sphere(0.007).at(-0.075, 0.318, 0.15),
      sdf.sphere(0.007).at(-0.115, 0.317, 0.14),
      sdf.sphere(0.007).at(-0.055, 0.312, 0.11),
      sdf.sphere(0.007).at(-0.085, 0.322, 0.13),
    );
    const loaves = sdf
      .union(loafA, loafB)
      .paintWhere(sdf.sphere(0.04).at(-0.085, 0.345, 0.13), '#e0a850')
      .paintWhere(sdf.sphere(0.034).at(0.09, 0.335, 0.15), '#e0a850')
      .paintWhere(seeds, CREAM);
    k.body('loaves', loaves, { color: '#c88a3a', roughness: 0.8, detail: 0.006, bone: 'chest' });
  },
});
