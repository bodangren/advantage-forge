import { sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Baker — Chibi Quest settlement NPC (catalog `npcs/settlement/baker`), about 1.0 m to the top of
 * the chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind (the
 * avatar base's skeleton, head, and face), dressed in `extra`.
 *
 * Role: a cheerful village baker in the Chibi Quest town, seen in 3D and as a 128 px sprite; the
 *   tall white chef hat, the cream apron, the tray with two loaves, and the smile must read.
 * One idea: a round, happy baker in a tall puffy chef hat, a warm brown shirt with cream cuffs, and a
 *   cream apron, holding a flat wooden peel with two golden loaves.
 * Palette: skin #f2c7a4; hat, cuffs, and socks #f3ead6; hair #5a301d; shirt #8a5a3a; apron #e8dcc0;
 *   trousers #4a3428; shoes #c89a6a; tray #9a6a3a; loaves #c88a3a with a lighter #e0a850 loaf.
 * Bodies: skin, hair tuft, shirt, cuffs, apron, pants, socks, shoes, hat band, hat top, tray, loaves.
 * Color slots: skin, hair, eyes, cloth (the shirt). Presets: default and tan.
 * Rig: the humanoid kind's skeleton and clips (idle, walk, run, attack, hit, rest, cheer, cast). The
 *   hat and the hair tuft are rigid on `head`; the tray and loaves are rigid on `chest`.
 */
const C = {
  hatCream: '#f3ead6',
  apron: '#e8dcc0',
  apronSeam: '#cdbb94',
  tray: '#9a6a3a',
  loaf: '#c88a3a',
  loafTop: '#e0a850',
  sesame: '#f3ead6',
  socks: '#f3ead6',
  shoes: '#c89a6a',
  pants: '#4a3428',
  mouth: '#7a2a26',
};

const lerp = (a: readonly [number, number, number], b: readonly [number, number, number], t: number) =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as const;

export default humanoidAsset({
  name: 'baker-h2',
  description: 'The Chibi Quest village baker: a tall chef hat, a warm brown shirt, a cream apron, and a tray of loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { brown: '#8a5a3a', sky: '#5f84ad', linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    default: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'brown' },
    tan: { skin: 'tan', hair: 'black', eyes: 'hazel', cloth: 'linen' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: C.shoes,

  paintSkin(skin, h) {
    // A wide open smile: a dark mouth opening under the smile line.
    const mouth = h.onFace(sdf.ellipsoid([0.05, 0.016, 0.07]), 0, 0.548);
    return skin.paintWhere(mouth, C.mouth, 0.004);
  },

  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const hairColor = k.tint('hair');

    // Chef hat: a band on the head and a soft puffy top, rigid on the head.
    const band = sdf.cylinder(0.175, 0.07, 0.02).scale([1, 1, 0.92]).at(0, 0.815, 0);
    const puff = sdf.ellipsoid([0.19, 0.11, 0.18]).at(0, 0.925, -0.01);
    k.body('hat', sdf.smoothUnion(0.03, band, puff), { color: C.hatCream, roughness: 0.9, bone: 'head' });

    // Brown hair tuft at the front, under the band.
    const tuft = sdf
      .smoothUnion(0.012, sdf.ellipsoid([0.05, 0.03, 0.035]).at(0, 0.775, 0.17), sdf.ellipsoid([0.03, 0.025, 0.03]).at(0.03, 0.79, 0.175))
      .bone('head');
    k.body('tuft', tuft, { color: hairColor, roughness: 0.7, bone: 'head' });

    // Long-sleeved warm shirt: the torso and sleeves to the wrist.
    const sleeves = pair(
      sdf.smoothUnion(
        0.02,
        sdf.cone(SHOULDER, ELBOW, 0.05, 0.046).bone('upperarm.L'),
        sdf.cone(ELBOW, WRIST, 0.046, 0.042).bone('forearm.L'),
      ),
    );
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), sleeves);
    k.body('shirt', shirt, { color: h.tint.shirt, roughness: 0.85 });

    // Rolled cream cuffs at each wrist.
    const cuff = pair(sdf.cone(lerp(ELBOW, WRIST, 0.84), lerp(ELBOW, WRIST, 0.97), 0.05, 0.049).bone('forearm.L'));
    k.body('cuffs', cuff, { color: C.hatCream, roughness: 0.85 });

    // Cream bib apron with two straps and a skirt panel to the knees.
    const bib = sdf.box([0.15, 0.14, 0.03], 0.012).at(0, 0.34, 0.115);
    const skirt = sdf.box([0.19, 0.14, 0.03], 0.012).at(0, 0.2, 0.115);
    const straps = pair(sdf.capsule([0.06, 0.37, 0.11], [0.072, 0.43, 0.075], 0.009).bone('upperarm.L'));
    const apron = sdf.union(bib, skirt, straps);
    k.body('apron', apron.paint(C.apron), { color: C.apron, roughness: 0.9 });

    // Cream socks over the ankles.
    const socks = pair(sdf.cone([0.098, 0.075, 0], [0.096, 0.108, 0], 0.046, 0.046).bone('shin.L'));
    k.body('socks', socks, { color: C.socks, roughness: 0.9 });

    // A flat wooden peel (the tray), rigid on the chest, with two loaves.
    const tray = sdf.box([0.4, 0.025, 0.16], 0.008).at(0, 0.19, 0.2);
    k.body('tray', tray, { color: C.tray, roughness: 0.7, bone: 'chest' });

    const loafA = sdf.ellipsoid([0.075, 0.05, 0.068]).at(-0.085, 0.23, 0.2);
    const sesame = sdf.union(
      ...[
        [-0.1, 0.277, 0.2],
        [-0.075, 0.28, 0.215],
        [-0.07, 0.272, 0.185],
      ].map(([x, y, z]) => sdf.sphere(0.008).at(x, y, z)),
    );
    k.body('loaf-a', loafA.paint(C.loaf).paintWhere(sesame, C.sesame), { color: C.loaf, roughness: 0.8, bone: 'chest' });

    const loafB = sdf.ellipsoid([0.065, 0.045, 0.06]).at(0.085, 0.225, 0.19);
    k.body('loaf-b', loafB.paint(C.loafTop), { color: C.loaf, roughness: 0.8, bone: 'chest' });
  },
});
