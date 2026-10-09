import { profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Baker (catalog `npcs/settlement/baker`), a cheerful village baker about 1.0 m to the top of the
 * chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind (the avatar
 * base's skeleton, head, face, and clips), dressed in `extra`; no hold option (the arms hang).
 *
 * Role: a town NPC (the bakery), seen in 3D and as a 128 px sprite; the tall hat, the cream apron,
 *   the tray with two loaves, and the wide smile must read.
 * One idea: a round, happy baker whose tall puffy white hat and open smile lead the eye down to a
 *   tray of golden loaves held at the waist.
 * Proportions: the kind's (head center 0.675, eyes 0.628, shoulders 0.385, belt 0.25); the hat band at
 *   0.73 to 0.815 and the puff to 0.99; the apron from 0.13 (knee) to 0.4; the tray at 0.225.
 * Shape language: round and soft (puff, cheeks, loaves), with the flat tray and apron as the square
 *   counterpoint.
 * Palette: skin #f2c7a4; hat, cuffs, and socks cream #f3ead6; hair #5a301d; shirt brown #8a5a3a;
 *   apron #e8dcc0; trousers #4a3428; shoes #c89a6a; tray #9a6a3a; loaves #c88a3a with a top #e0a850.
 * Value plan: the white hat and the cream apron are the two light masses around the dark trousers and
 *   the brown shirt; the golden loaves carry the warm accent at the waist.
 * Bodies: skin, hat (rigid on the head), hair tuft, shirt, cuffs, socks, trousers, shoes, apron, tray,
 *   loaves.
 * Rig: the humanoid kind's skeleton. The hat and the tuft follow the head; the apron follows the spine;
 *   the tray and the loaves follow the chest, with the fists tucked under the tray ends.
 * Variant slots: skin, hair, eyes, cloth (the shirt). Presets: default and rye.
 */

const C = {
  hat: '#f3ead6',
  apron: '#e8dcc0',
  tray: '#9a6a3a',
  loaf: '#c88a3a',
  loafTop: '#e0a850',
  sesame: '#f3ead6',
  cream: '#f3ead6',
  teeth: '#fbf6ee',
  tongue: '#d8706a',
  mouth: '#a4503f',
  trousers: '#4a3428',
  shoes: '#c89a6a',
};

type V3 = readonly [number, number, number];

const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const pair = (s: sdf.Shape) => s.mirror('x');

// The tray: a flat board across the waist, at the height of the fists (the fists tuck under its ends).
const TRAY_Y = 0.225;
const TRAY_Z = 0.13;

// The apron: a flat bib with two straps, and a skirt panel to the knees, outside the apron's own shell.
const apronOutline = profile.polygon(
  [
    [-0.078, 0.4],
    [0.078, 0.4],
    [0.105, 0.31],
    [0.12, 0.25],
    [0.135, 0.19],
    [0.145, 0.13],
    [-0.145, 0.13],
    [-0.135, 0.19],
    [-0.12, 0.25],
    [-0.105, 0.31],
  ],
  { smooth: false },
);

export default humanoidAsset({
  name: 'baker-f6',
  description: 'Chibi baker NPC: a tall puffy white chef hat with a brown hair tuft, a round happy face with a wide smile, a brown shirt with cream cuffs, a cream apron, and a tray of two golden loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { brown: '#8a5a3a', linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    rye: { skin: 'tan', hair: 'black', eyes: 'brown', cloth: 'slate' },
  },
  hair: false,
  undershirt: false,
  pants: C.trousers,
  shoes: C.shoes,
  paintSkin(skin, h) {
    // A wide open smile: the lower half of an ellipse, with the upper teeth and the tongue.
    const MOUTH_Y = 0.55;
    const open = sdf
      .extrude(profile.circle(0.044), 0.3)
      .scale([1, 0.8, 1])
      .at(0, MOUTH_Y, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y));
    const teeth = sdf.box([0.034, 0.01, 0.3], 0.002).at(0, MOUTH_Y - 0.003, 0.1).intersect(open);
    const tongue = sdf.extrude(profile.circle(0.02), 0.3).at(0, MOUTH_Y - 0.03, 0.1).intersect(open);
    return skin.paintWhere(open, h.tint.mouth ?? C.mouth).paintWhere(teeth, C.teeth).paintWhere(tongue, C.tongue, 0.004);
  },
  extra(k, h) {
    const { SHOULDER: SH, ELBOW: EL, WRIST: WR, ANKLE } = h.joints;

    // ------------------------------------------------------------------ chef hat: a band and a soft puff (rigid on the head)
    const hatBand = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.73],
            [0.205, 0.73],
            [0.215, 0.75],
            [0.215, 0.8],
            [0.205, 0.815],
            [0, 0.815],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    const puff = sdf.smoothUnion(
      0.035,
      sdf.ellipsoid([0.16, 0.13, 0.15]).at(0, 0.87, 0),
      sdf.sphere(0.1).at(0.06, 0.92, 0.03),
      sdf.sphere(0.095).at(-0.07, 0.9, -0.02),
      sdf.sphere(0.09).at(0.01, 0.93, -0.06),
    );
    k.body('hat', sdf.smoothUnion(0.01, hatBand, puff), { color: C.hat, roughness: 0.8, detail: 0.006, bone: 'head' });

    // The brown hair tuft at the front, curling out over the band.
    const tuft = sdf.smoothUnion(
      0.012,
      sdf.chain(
        [
          [-0.01, 0.8, 0.19, 0.03],
          [0.0, 0.835, 0.2, 0.034],
          [0.03, 0.865, 0.19, 0.02],
        ],
        0.02,
      ),
      sdf.ellipsoid([0.034, 0.02, 0.03]).at(-0.02, 0.81, 0.2),
    );
    k.body('hair', tuft, { color: k.tint('hair'), roughness: 0.6, detail: 0.006, bone: 'head' });

    // ------------------------------------------------------------------ shirt: brown, long sleeves, cream cuffs
    const sleeveUpper = sdf.cone(SH, EL, 0.047, 0.043).bone('upperarm.L');
    const sleeveFore = sdf.cone(EL, lerp(EL, WR, 0.84), 0.044, 0.041).bone('forearm.L');
    const cuff = sdf
      .cone(lerp(EL, WR, 0.84), lerp(EL, WR, 0.97), 0.047, 0.045)
      .round(0.004)
      .bone('forearm.L');
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), pair(sdf.smoothUnion(0.02, sleeveUpper, sleeveFore)));
    k.body('shirt', shirt, { color: k.tint('cloth'), roughness: 0.85 });
    k.body('cuffs', pair(cuff), { color: C.cream, roughness: 0.85 });

    // Cream socks at the shoe tops.
    const sock = sdf.cylinder(0.05, 0.04, 0.012).at(ANKLE[0], 0.115, 0).bone('shin.L');
    k.body('socks', pair(sock), { color: C.cream, roughness: 0.9 });

    // ------------------------------------------------------------------ apron: a bib with straps and a skirt panel (rigid on the spine)
    const panel = sdf.extrude(apronOutline, 0.022, 0.007).at(0, 0, 0.12);
    const strap = pair(sdf.capsule([0.07, 0.4, 0.1], [0.095, 0.44, 0.03], 0.011));
    k.body('apron', sdf.union(panel, strap), { color: C.apron, roughness: 0.9, bone: 'spine' });

    // ------------------------------------------------------------------ tray and loaves (rigid on the chest)
    const board = sdf.box([0.56, 0.02, 0.2], 0.008).at(0, TRAY_Y, TRAY_Z);
    const lip = sdf.box([0.56, 0.035, 0.02], 0.006).at(0, TRAY_Y, TRAY_Z + 0.1);
    const grain = (x: number, _y: number, z: number, base: readonly [number, number, number]): readonly [number, number, number] =>
      Math.sin(z * 150 + 0.8 * Math.sin(x * 12)) > 0.85 ? [base[0] * 0.85, base[1] * 0.82, base[2] * 0.78] : base;
    k.body('tray', sdf.union(board, lip).paintFn(grain), { color: C.tray, roughness: 0.7, detail: 0.006, bone: 'chest' });

    const loafA = sdf.ellipsoid([0.068, 0.05, 0.064]).at(-0.12, 0.285, 0.2);
    const loafB = sdf.ellipsoid([0.06, 0.046, 0.058]).at(0.11, 0.28, 0.2);
    const loaves = sdf.union(loafA, loafB).paintFn((x, y, z, base) => {
      if (y > 0.3 && x < 0 && Math.sin(x * 190) * Math.sin(z * 190) > 0.93) return rgb(C.sesame); // sesame seeds
      if (y > 0.315) return rgb(C.loafTop); // the lighter top crust
      return base;
    });
    k.body('loaves', loaves, { color: C.loaf, roughness: 0.8, detail: 0.005, bone: 'chest' });
  },
});
