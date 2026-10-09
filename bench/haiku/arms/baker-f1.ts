import { humanoidAsset } from './parts/humanoid-kind.js';
import { profile, rgb, sdf } from '../src/index.js';

/**
 * Baker (catalog `npcs/settlement/baker`), a cheerful village baker, about 1.0 m to the top of the
 * chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind (the avatar
 * base's skeleton, face, and clips) with no swept hair: a brown tuft peeks under the hat instead.
 *
 * Role: a town NPC, seen in 3D and as a 128 px sprite; the tall white hat, the cream apron, the open
 *   smile, and the tray of loaves must read.
 * One idea: a round, happy baker in a tall puffy white chef hat, carrying a tray of golden loaves
 *   at the waist.
 * Shape language: round and soft (hat puff, loaves, cheeks); a flat apron and tray for a sturdy look.
 * Palette: cream #f3ead6 (hat, cuffs, socks); shirt #8a5a3a; apron #e8dcc0 with #cdbb94 hem;
 *   trousers #4a3428; tan shoes #c89a6a; wood tray #9a6a3a; loaves #c88a3a with a #e0a850 top.
 * Value plan: the white hat frames the face (focal point); the brown shirt and dark trousers hold the
 *   body; the golden loaves are the accent.
 * Bodies: skin, hat, tuft, shirt, cuffs, apron, pants, socks, shoes, tray, loaves.
 * Rig: the humanoid skeleton. The tray and the loaves are rigid on `chest`: one body cannot bind two
 *   hands, so the fists sit under the tray ends. Clips: the humanoid set (idle, walk, run, attack,
 *   hit, rest, cheer, cast).
 */

const C = {
  hat: '#f3ead6',
  cuff: '#f3ead6',
  socks: '#f3ead6',
  apron: '#e8dcc0',
  apronSeam: '#cdbb94',
  pants: '#4a3428',
  shoe: '#c89a6a',
  wood: '#9a6a3a',
  mouth: '#7a2a26',
  shirt: '#8a5a3a',
  loaf: '#c88a3a',
  loafTop: '#e0a850',
  sesame: '#f3ead6',
  teeth: '#fbf6ee',
  tongue: '#d8706a',
};

type V3 = readonly [number, number, number];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const seeds = (x: number, y: number, z: number) => Math.sin(x * 160) * Math.sin(y * 160) * Math.sin(z * 160) > 0.9;

export default humanoidAsset({
  name: 'baker-f1',
  description:
    'Chibi village baker NPC: a tall puffy white chef hat with a brown tuft, a round happy face with an open smile, a brown shirt with cream cuffs, a cream bib apron, dark trousers, and a tray of golden loaves at the waist.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { brown: '#8a5a3a', sky: '#5f84ad', linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    default: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'brown' },
    rye: { skin: 'tan', hair: 'black', eyes: 'brown', cloth: 'moss' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: C.shoe,

  paintSkin(skin, h) {
    // A wide open smile: a half ellipse with the upper teeth and the tongue, over the thin kind smile.
    const MOUTH_Y = 0.552;
    const mouth = sdf
      .extrude(profile.circle(0.05), 0.3)
      .scale([1, 0.72, 1])
      .at(0, MOUTH_Y, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y));
    const teeth = sdf.box([0.07, 0.012, 0.3], 0.002).at(0, MOUTH_Y - 0.005, 0.1).intersect(mouth);
    const tongue = sdf.extrude(profile.circle(0.022), 0.3).at(0, MOUTH_Y - 0.04, 0.1).intersect(mouth);
    return skin.paintWhere(mouth, h.tint.mouth ?? C.mouth).paintWhere(teeth, C.teeth).paintWhere(tongue, C.tongue, 0.004);
  },

  extra(k, h) {
    const hairTint = k.tint('hair');

    // ------------------------------------------------------------------ the chef hat: a snug band and a puffed top
    const band = sdf
      .ellipsoid([0.2, 0.06, 0.19])
      .at(0, 0.805, 0)
      .subtract(sdf.ellipsoid([0.185, 0.06, 0.175]).at(0, 0.805, 0))
      .intersect(h.band(0.78, 0.83));
    const top = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.175, 0.125, 0.165]).at(0, 0.9, -0.012),
      sdf.ellipsoid([0.13, 0.08, 0.125]).at(-0.025, 0.95, -0.03),
    );
    k.body('hat', sdf.smoothUnion(0.012, band, top).bone('head'), { color: C.hat, roughness: 0.8 });

    // A little brown tuft at the front of the band, in the hair color.
    const front = (x: number, y: number) => sdf.raycast(band, [x, y, 1], [0, 0, -1])![2];
    const tuft = sdf
      .union(
        sdf.ellipsoid([0.03, 0.024, 0.026]).at(-0.02, 0.828, front(-0.02, 0.815) - 0.006),
        sdf.ellipsoid([0.026, 0.026, 0.024]).at(0.012, 0.842, front(0.012, 0.815) - 0.004),
        sdf.ellipsoid([0.024, 0.02, 0.022]).at(0.038, 0.822, front(0.038, 0.815) - 0.006),
      )
      .bone('head');
    k.body('tuft', tuft, { color: hairTint, roughness: 0.6 });

    // ------------------------------------------------------------------ long sleeves and cream rolled cuffs
    const SH = h.joints.SHOULDER;
    const EL = h.joints.ELBOW;
    const WR = h.joints.WRIST;
    const sleeve = sdf.smoothUnion(
      0.012,
      sdf.cone(SH, EL, 0.047, 0.043).bone('upperarm.L'),
      sdf.cone(EL, WR, 0.043, 0.04).bone('forearm.L'),
    );
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), sleeve, sleeve.mirror('x'));
    k.body('shirt', shirt, { color: h.tint.shirt ?? C.shirt, roughness: 0.85 });

    const cuffL = sdf.cone(lerp(EL, WR, 0.8), WR, 0.05, 0.046).round(0.006).bone('forearm.L');
    k.body('cuffs', sdf.union(cuffL, cuffL.mirror('x')), { color: C.cuff, roughness: 0.8 });

    // ------------------------------------------------------------------ the cream bib apron with two straps
    const outline = profile.polygon(
      [
        [-0.12, 0.135],
        [0.12, 0.135],
        [0.1, 0.25],
        [0.085, 0.28],
        [0.07, 0.4],
        [-0.07, 0.4],
        [-0.085, 0.28],
        [-0.1, 0.25],
      ],
      { smooth: false },
    );
    const panel = sdf.extrude(outline, 0.02, 0.008).at(0, 0, 0.122);
    const straps = sdf
      .union(
        sdf.capsule([0.06, 0.395, 0.118], [0.115, 0.43, 0.07], 0.011),
        sdf.capsule([0.115, 0.43, 0.07], [0.118, 0.44, -0.06], 0.011),
      )
      .bone('chest');
    const apron = sdf.union(h.weighted(panel), straps, straps.mirror('x'));
    k.body('apron', apron.paintFn((x, y, _z, base) => (y < 0.148 ? rgb(C.apronSeam) : base)), { color: C.apron, roughness: 0.9 });

    // ------------------------------------------------------------------ cream socks above the shoes
    const sock = sdf.cylinder(0.046, 0.034, 0.012).at(0.088, 0.112, 0).bone('shin.L');
    k.body('socks', sdf.union(sock, sock.mirror('x')), { color: C.socks, roughness: 0.85 });

    // ------------------------------------------------------------------ the tray and the loaves (rigid on the chest)
    // The board spans the fists at the waist: its ends sit under the fists, and it lies in front of the apron.
    const board = sdf.box([0.46, 0.022, 0.2], 0.008).at(0, 0.246, 0.1);
    k.body('tray', board, { color: C.wood, roughness: 0.6, bone: 'chest' });

    const loafA = sdf.ellipsoid([0.085, 0.06, 0.075]).at(-0.09, 0.296, 0.13);
    const loafB = sdf.ellipsoid([0.08, 0.055, 0.07]).at(0.09, 0.292, 0.14);
    const loaves = sdf.smoothUnion(0.01, loafA, loafB).paintFn((x, y, z, base) => {
      if (y > 0.33) return rgb(C.loafTop);
      if (x < 0 && y > 0.3 && seeds(x, y, z)) return rgb(C.sesame);
      return base;
    });
    k.body('loaves', loaves, { color: C.loaf, roughness: 0.8, bone: 'chest' });
  },
});
