import { sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Baker — Chibi Quest settlement NPC (catalog `npcs/settlement/baker`), about 1.0 m to the top of
 * the chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind (the
 * avatar base's face, skeleton, and clips) and dressed in `extra`.
 *
 * Role: a cheerful village baker in the Chibi Quest town. The tall white chef hat, the cream bib
 *   apron, and the tray of golden loaves must read at 128 px.
 * Palette: skin #f2c7a4; hat, cuffs, socks #f3ead6; hair #5a301d; shirt #8a5a3a (the cloth slot);
 *   apron #e8dcc0 with #cdbb94 seams; trousers #4a3428; shoes #c89a6a; tray #9a6a3a; loaves
 *   #c88a3a with a #e0a850 top.
 * Bodies (extra): hat band and puff, hair tuft, long sleeves, cream cuffs, apron, socks, tray, loaves.
 * Rig: the humanoid kind's skeleton and clips. The arms keep their rest pose (hanging), so the tray
 *   is rigid on `hips` in front of the apron, level in every clip.
 */
const CREAM = '#f3ead6';
const APRON = '#e8dcc0';
const APRON_SEAM = '#cdbb94';
const TRAY = '#9a6a3a';
const LOAF = '#c88a3a';
const LOAF_TOP = '#e0a850';

type V3 = readonly [number, number, number];

/** A point at fraction t from a to b. */
const along = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export default humanoidAsset({
  name: 'baker-h1',
  description: 'Chibi village baker NPC: a tall white chef hat, a warm brown shirt, a cream bib apron, and a tray of golden loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { cocoa: '#8a5a3a', linen: '#cdbb94', sky: '#5f84ad', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    baker: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'cocoa' },
    sunny: { skin: 'light', hair: 'auburn', eyes: 'green', cloth: 'linen' },
  },
  hair: false,
  pants: '#4a3428',
  shoes: '#c89a6a',
  extra(k, h) {
    const J = h.joints;

    // Chef hat: a cream band on the head, and a soft puffed top that leans back a little.
    const band = sdf.cylinder(0.215, 0.07, 0.025).at(0, 0.83, 0);
    const puff = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.2, 0.17, 0.18]).at(0, 0.95, -0.02),
      sdf.ellipsoid([0.16, 0.12, 0.15]).at(0.04, 1.02, -0.05),
    );
    k.body('hat', sdf.smoothUnion(0.03, band, puff), { color: CREAM, roughness: 0.7, detail: 0.006, bone: 'head' });

    // Brown hair tuft at the front, under the hat band.
    k.body('tuft', sdf.smoothUnion(0.02, sdf.ellipsoid([0.06, 0.035, 0.045]).at(-0.02, 0.79, 0.2), sdf.ellipsoid([0.04, 0.03, 0.035]).at(0.03, 0.8, 0.21)), { color: k.tint('hair'), roughness: 0.8, detail: 0.006, bone: 'head' });

    // Long sleeves in the shirt color, with cream rolled cuffs at the wrists.
    const sleeve = sdf.smoothUnion(
      0.02,
      sdf.cone(J.SHOULDER, J.ELBOW, 0.052, 0.048).bone('upperarm.L'),
      sdf.cone(J.ELBOW, J.WRIST, 0.047, 0.04).bone('forearm.L'),
    ).mirror('x');
    k.body('sleeves', sleeve, { color: k.tint('cloth'), roughness: 0.85, detail: 0.006 });
    const cuff = sdf.cone(along(J.ELBOW, J.WRIST, 0.8), J.WRIST, 0.045, 0.043).bone('forearm.L').mirror('x');
    k.body('cuffs', cuff, { color: CREAM, roughness: 0.8, detail: 0.006 });

    // Cream bib apron with two straps, and a skirt panel to the knees.
    const bib = sdf.box([0.13, 0.11, 0.02], 0.008).at(0, 0.31, 0.115);
    const skirt = sdf.box([0.25, 0.18, 0.025], 0.01).at(0, 0.16, 0.12);
    const straps = sdf.union(
      sdf.capsule([-0.06, 0.36, 0.1], [-0.096, 0.4, 0.085], 0.008),
      sdf.capsule([0.06, 0.36, 0.1], [0.096, 0.4, 0.085], 0.008),
    );
    const seam = sdf.box([0.26, 0.012, 0.03]).at(0, 0.075, 0.12);
    const apron = sdf.union(bib, skirt, straps).paintWhere(seam, APRON_SEAM, 0.002);
    k.body('apron', apron, { color: APRON, roughness: 0.85, detail: 0.006 });

    // Cream socks: the rolled cuffs over the trouser hems.
    const socks = sdf.cone([0.098, 0.115, 0], [0.098, 0.09, 0], 0.046, 0.044).bone('shin.L').mirror('x');
    k.body('socks', socks, { color: CREAM, roughness: 0.8, detail: 0.006 });

    // The tray and the loaves: rigid on the hips, in front of the apron at waist height.
    const trayShape = sdf.box([0.36, 0.02, 0.26], 0.008).at(0, 0.235, 0.2);
    k.body('tray', trayShape, { color: TRAY, roughness: 0.6, detail: 0.004, bone: 'hips' });
    const loaves = sdf.union(
      sdf.ellipsoid([0.085, 0.055, 0.075]).at(-0.08, 0.28, 0.2),
      sdf.ellipsoid([0.08, 0.05, 0.07]).at(0.07, 0.275, 0.2),
    );
    const loafTop = sdf.sphere(0.2).at(0, 0.27, 0.2).intersect(sdf.halfSpace([0, -1, 0], -0.27));
    k.body('loaves', loaves.paintWhere(loafTop, LOAF_TOP, 0.01), { color: LOAF, roughness: 0.75, detail: 0.004, bone: 'hips' });
  },
});
