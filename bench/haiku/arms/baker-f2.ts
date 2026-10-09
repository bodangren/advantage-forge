import { humanoidAsset } from './parts/humanoid-kind.js';
import { noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Baker (catalog `npcs/settlement/baker`), a cheerful village baker about 1.0 m to the top of her
 * hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind (the avatar base's
 * head, face, skeleton, and clips), dressed in `extra`.
 *
 * Role: a town NPC in the Chibi Quest settlement, seen in 3D and as a 128 px sprite; the tall chef
 *   hat, the cream apron, the tray with the loaves, and the open smile must read.
 * One idea: a round, happy baker whose tall puffy white hat is the tallest thing on screen, with a
 *   tray of golden loaves held at the waist.
 * Shape language: round and soft (hat top, loaves, cheeks); square and sturdy for the apron and tray.
 * Palette: skin #f2c7a4; cream #f3ead6 (hat, cuffs, socks, apron); shirt #8a5a3a; trousers #4a3428;
 *   shoes #c89a6a; tray #9a6a3a; loaves #c88a3a with a lighter #e0a850 top; hair #5a301d.
 * Value plan: the white hat and apron are the two big light masses; the brown shirt and trousers
 *   hold the body; the dark hair frames the face (focal point).
 * Bodies: skin, hat, hair, shirt, cuffs, apron, trousers, socks, shoes, bread, tray.
 * Rig: the humanoid kind's skeleton; the tray is skinned to both fists, the hat and hair rigid on the
 *   head. Clips: the kind's idle, walk, run, attack, hit, rest, cheer, and cast.
 */
const CREAM = '#f3ead6';
const SHIRT = '#8a5a3a';
const PANTS = '#4a3428';
const SHOE = '#c89a6a';
const TRAY_WOOD = '#9a6a3a';
const LOAF = '#c88a3a';
const LOAF_TOP = '#e0a850';
const SESAME = '#f3ead6';
const APRON_SEAM = '#cdbb94';
const TEETH = '#fbf6ee';
const TONGUE = '#d8706a';

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const SLEEVE_TOP: V3 = [0.11, 0.405, 0];
const TRAY_Y = 0.245;
const TRAY_Z = 0.17;

export default humanoidAsset({
  name: 'baker-f2',
  description: 'Chibi village baker NPC: a tall puffy white chef hat with a brown hair tuft, a round happy face with a wide smile, a brown long-sleeved shirt, a cream bib apron, and a tray of two golden loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { sky: '#5f84ad', linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    default: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'sky' },
    flour: { skin: 'light', hair: 'silver', eyes: 'hazel', cloth: 'linen' },
  },
  hair: false, // the baker's own hair (a tuft and a cap under the hat) is built in `extra`
  undershirt: false, // the brown long-sleeved shirt is built in `extra`
  pants: false, // the short trousers are built in `extra`
  shoes: SHOE,

  // A wide open smile on the face: the lower half of a round mouth, with white teeth and a pink tongue.
  paintSkin(skin, h) {
    const MOUTH_Y = 0.55;
    const open = sdf
      .extrude(profile.circle(0.042), 0.3)
      .scale([1, 0.74, 1])
      .at(0, MOUTH_Y, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y));
    const teeth = sdf.box([0.028, 0.008, 0.3], 0.002).at(0, MOUTH_Y - 0.004, 0.1).intersect(open);
    const tongue = sdf.extrude(profile.circle(0.018), 0.3).at(0, MOUTH_Y - 0.043, 0.1).intersect(open);
    const mouth = h.tint.mouth ?? '#a4503f'; // the mouth shade of the skin slot (a default guards the lookup)
    return skin.paintWhere(open, mouth).paintWhere(teeth, TEETH).paintWhere(tongue, TONGUE, 0.004);
  },

  extra(k, h) {
    const { ELBOW, WRIST, HIP, KNEE, ANKLE } = h.joints;
    const hairColor = k.tint('hair');
    const shirtColor = k.tint('cloth', { color: SHIRT, follow: 1 });

    // ------------------------------------------------------------------ the chef hat: a band and a soft mushroom top
    const hatBand = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.775],
            [0.186, 0.775],
            [0.19, 0.79],
            [0.19, 0.84],
            [0.185, 0.852],
            [0, 0.852],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.92]);
    const hatTop = sdf.ellipsoid([0.2, 0.15, 0.19]).at(0, 0.9, -0.015);
    const hat = sdf.smoothUnion(0.02, hatBand, hatTop);
    k.body('hat', hat, { color: CREAM, roughness: 0.8, detail: 0.006, bone: 'head' });

    // ------------------------------------------------------------------ hair: a cap under the hat and a tuft at the front
    const cap = sdf
      .ellipsoid([0.219, 0.216, 0.204])
      .at(0, 0.685, -0.012)
      .smoothSubtract(0.015, sdf.ellipsoid([0.25, 0.17, 0.23]).at(0, 0.62, 0.15))
      .intersect(sdf.halfSpace([0, -1, 0], -0.745)); // hair only above the temples: the hat band covers it
    const tuft = sdf.union(
      sdf.ellipsoid([0.03, 0.022, 0.026]).rotateX(-20).at(-0.022, 0.84, 0.175),
      sdf.ellipsoid([0.028, 0.02, 0.024]).rotateX(-20).at(0.02, 0.848, 0.178),
      sdf.cone([0, 0.83, 0.16], [0.012, 0.87, 0.19], 0.018, 0.006),
    );
    k.body('hair', sdf.smoothUnion(0.012, cap, tuft).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ the brown long-sleeved shirt with cream cuffs and a cream collar band
    const sleeveUpper = sdf.cone(SLEEVE_TOP, ELBOW, 0.047, 0.043).bone('upperarm.L');
    const sleeveFore = sdf.cone(ELBOW, lerp(ELBOW, WRIST, 0.86), 0.043, 0.039).bone('forearm.L');
    const cuff = sdf.cone(lerp(ELBOW, WRIST, 0.84), lerp(ELBOW, WRIST, 0.98), 0.045, 0.044).round(0.004).bone('forearm.L');
    const shirt = sdf
      .smoothUnion(0.012, h.weighted(h.torso), pair(sdf.smoothUnion(0.012, sleeveUpper, sleeveFore)))
      .paintWhere(h.band(0.44, 0.458), CREAM, 0.002);
    k.body('shirt', shirt, { color: shirtColor, roughness: 0.85, detail: 0.006 });
    k.body('cuffs', pair(cuff), { color: CREAM, roughness: 0.85, detail: 0.006 });

    // ------------------------------------------------------------------ the cream bib apron: a sheet to the knees, two straps
    const bibOutline = profile.polygon(
      [
        [-0.07, 0.3],
        [0.07, 0.3],
        [0.1, 0.22],
        [0.122, 0.14],
        [0.06, 0.128],
        [0, 0.136],
        [-0.06, 0.128],
        [-0.122, 0.14],
        [-0.1, 0.22],
      ],
      { smooth: true },
    );
    const apronSheet = sdf.extrude(bibOutline, 0.02, 0.008).at(0, 0, 0.122);
    const apron = h
      .weighted(apronSheet)
      .paintWhere(h.band(0.266, 0.272), APRON_SEAM, 0.001); // a waistband seam
    const straps = pair(sdf.capsule([0.07, 0.296, 0.118], [0.088, 0.43, 0.062], 0.009).bone('chest'));
    k.body('apron', sdf.union(apron, straps), { color: CREAM, roughness: 0.9, detail: 0.006 });

    // ------------------------------------------------------------------ short dark trousers to the knee, cream socks to the shoes
    const legCut = sdf.halfSpace([0, -1, 0], -0.128); // the trouser hem at y 0.128
    const trouserLeg = sdf
      .smoothUnion(0.012, sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'), sdf.cone(KNEE, [ANKLE[0], 0.12, 0.002], 0.047, 0.043).bone('shin.L'))
      .intersect(legCut);
    const trousers = sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg));
    k.body('trousers', trousers, { color: PANTS, roughness: 0.85, detail: 0.006 });
    const sock = sdf.cone([KNEE[0] - 0.002, 0.134, 0], [ANKLE[0], 0.07, 0], 0.046, 0.041).round(0.004).bone('shin.L');
    k.body('socks', pair(sock), { color: CREAM, roughness: 0.85, detail: 0.006 });

    // ------------------------------------------------------------------ the tray (a flat board) and two loaves on it
    // The tray lies at the waist in front of the apron. Its left half is skinned to the left fist,
    // its right half to the right fist, so the tray moves with both hands.
    const board = sdf.box([0.42, 0.026, 0.2], 0.008).at(0, TRAY_Y, TRAY_Z);
    const tray = sdf.union(
      board.intersect(sdf.halfSpace([1, 0, 0], 0)).bone('hand.R'), // x <= 0: the right hand
      board.intersect(sdf.halfSpace([-1, 0, 0], 0)).bone('hand.L'), // x >= 0: the left hand
    );
    k.body(
      'tray',
      tray.paintFn((x, _y, z, base) => (Math.sin(z * 150 + 3 * noise.fbm(x * 12, 0, z * 12, 2)) > 0.8 ? rgb('#7e5230') : base)),
      { color: TRAY_WOOD, roughness: 0.7, detail: 0.006 },
    );
    const loafA = sdf.ellipsoid([0.075, 0.052, 0.068]).at(-0.065, 0.302, 0.165).bone('hand.R');
    const loafB = sdf.ellipsoid([0.068, 0.048, 0.062]).at(0.07, 0.298, 0.19).bone('hand.L');
    const bread = sdf.union(loafA, loafB).paintFn((x, y, z, base) => {
      if (y > 0.32 && x < 0 && Math.sin(x * 260) * Math.sin(z * 260) > 0.97) return rgb(SESAME); // sesame seeds
      if (y > 0.335) return rgb(LOAF_TOP);
      return base;
    });
    k.body('bread', bread, { color: LOAF, roughness: 0.8, detail: 0.006 });
  },
});
