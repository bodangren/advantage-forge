import { sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';
import type { HumanoidShape } from './parts/humanoid-kind.js';

/**
 * Baker — Chibi Quest village NPC (catalog `npcs/settlement/baker`), about 1.0 m to the top of the
 * chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind (the
 * avatar base's skeleton, head, and face), dressed in `extra`.
 *
 * Role: a cheerful village baker seen in the town, in 3D and as a 128 px sprite; the tall white
 *   chef hat, the cream apron, the round smile, and the tray with two loaves must read.
 * One idea: a round, happy baker in a tall puffy chef hat, carrying a flat wooden tray of bread.
 * Shape language: soft and round (hat puff, cheeks, loaves), with the flat tray and the apron
 *   as the square accents.
 * Palette: skin #f2c7a4; hat, cuffs, and socks #f3ead6; hair #5a301d; shirt #8a5a3a; apron
 *   #e8dcc0; trousers #4a3428; shoes #c89a6a; tray #9a6a3a; loaves #c88a3a and #e0a850.
 * Value plan: the cream hat and apron are the two light masses; the brown shirt holds the body;
 *   the dark trousers ground it; the golden loaves are the warm accent.
 * Bodies: skin, undershirt (cloth slot), sleeves, cuffs, pants, shoes, socks, hat, hat band,
 *   hair tuft, apron, bib straps, tray, two loaves.
 * Color slots: skin, hair, eyes, cloth (the shirt). Presets: default plus forest.
 * Rig: the humanoid skeleton. The tray is skinned to both hands by tags (left half to hand.L,
 *   right half to hand.R), so it follows both hands. Clips: idle, walk, run, attack, hit, rest,
 *   cheer, cast.
 */

const C = {
  hat: '#f3ead6',
  cuff: '#f3ead6',
  sock: '#f3ead6',
  apron: '#e8dcc0',
  pants: '#4a3428',
  shoe: '#c89a6a',
  tray: '#9a6a3a',
  loafA: '#c88a3a',
  loafB: '#e0a850',
};

export default humanoidAsset({
  name: 'baker-h6',
  description: 'Chibi village baker NPC: a tall white chef hat, a brown shirt, a cream apron, and a wooden tray with two loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { brown: '#8a5a3a', sky: '#5f84ad', linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    default: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'brown' },
    forest: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'moss' },
  },
  hair: false,
  pants: C.pants,
  shoes: C.shoe,

  extra(k: AssetContext, h: HumanoidShape) {
    const T = {
      hair: k.tint('hair'),
      cloth: k.tint('cloth'),
    };
    const { ELBOW, WRIST } = h.joints;
    type V3 = [number, number, number];
    const lerp = (a: readonly number[], b: readonly number[], t: number): V3 => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as V3;

    // ------------------------------------------------------------------ chef hat
    // A cream band that sits on the head, and a soft puffed top above it.
    const band = sdf.cylinder(0.17, 0.07, 0.02).at(0, 0.835, 0).bone('head');
    const puff = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.17, 0.12, 0.16]).at(0, 0.93, 0),
        sdf.ellipsoid([0.13, 0.07, 0.12]).at(0.02, 1.03, -0.01),
      )
      .bone('head');
    k.body('hat', sdf.smoothUnion(0.02, band, puff), { color: C.hat, roughness: 0.8, detail: 0.006 });

    // A small brown hair tuft at the front, under the band's edge.
    const tuft = sdf
      .smoothUnion(0.01, sdf.ellipsoid([0.045, 0.03, 0.03]).at(0, 0.84, 0.165), sdf.ellipsoid([0.025, 0.02, 0.02]).at(0.03, 0.855, 0.165))
      .bone('head');
    k.body('tuft', tuft, { color: T.hair, roughness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ long sleeves and cream cuffs
    // The brown shirt goes down to the wrist. The cream cuff rolls over the lower forearm.
    const sleeve = sdf
      .smoothUnion(
        0.012,
        sdf.cone(ELBOW, WRIST, 0.042, 0.04).bone('forearm.L'),
        sdf.ellipsoid([0.046, 0.046, 0.046]).at(ELBOW[0], ELBOW[1], ELBOW[2]).bone('upperarm.L'),
      )
      .mirror('x');
    k.body('sleeve', sleeve, { color: T.cloth, roughness: 0.85, detail: 0.006 });

    const cuffL = sdf.cone(lerp(ELBOW, WRIST, 0.8), lerp(ELBOW, WRIST, 0.95), 0.044, 0.043).round(0.004).bone('forearm.L');
    k.body('cuff', cuffL.mirror('x'), { color: C.cuff, roughness: 0.8, detail: 0.005 });

    // ------------------------------------------------------------------ apron
    // A cream bib with two straps over the shoulders, and a cream skirt panel to the knees.
    const bib = sdf.box([0.2, 0.13, 0.02], 0.01).at(0, 0.37, 0.15).bone('chest');
    const skirt = sdf.box([0.25, 0.2, 0.03], 0.01).at(0, 0.2, 0.125).bone('hips');
    const straps = sdf
      .smoothUnion(
        0.0,
        sdf.capsule([0.08, 0.43, 0.15], [0.12, 0.47, 0.09], 0.012),
        sdf.capsule([0.08, 0.43, 0.15], [0.1, 0.44, 0.15], 0.012),
      )
      .mirror('x')
      .bone('chest');
    k.body('apron', sdf.smoothUnion(0.01, bib, skirt), { color: C.apron, roughness: 0.9, detail: 0.006 });
    k.body('strap', straps, { color: C.apron, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ socks
    const sock = sdf.cone([0.098, 0.075, 0], [0.098, 0.115, 0], 0.05, 0.049).bone('shin.L');
    k.body('sock', sock.mirror('x'), { color: C.sock, roughness: 0.85, detail: 0.005 });

    // ------------------------------------------------------------------ the tray and two loaves
    // The tray is one flat slab in front of the apron, rigid on the chest, so no arm swing carries it
    // into the head.
    const tray = sdf.box([0.4, 0.022, 0.2], 0.008).at(0, 0.27, 0.2);
    k.body('tray', tray, { color: C.tray, roughness: 0.6, detail: 0.005, bone: 'chest' });

    const loafA = sdf.ellipsoid([0.075, 0.05, 0.07]).at(-0.07, 0.323, 0.2);
    const loafB = sdf.ellipsoid([0.075, 0.05, 0.07]).at(0.07, 0.323, 0.2);
    k.body('loafA', loafA, { color: C.loafA, roughness: 0.7, detail: 0.006, bone: 'chest' });
    k.body('loafB', loafB, { color: C.loafB, roughness: 0.6, detail: 0.006, bone: 'chest' });
  },
});
