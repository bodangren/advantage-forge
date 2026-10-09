import { sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Baker (catalog `npcs/settlement/baker`), about 1.0 m to the top of the chef hat, faces +Z.
 * Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind (the avatar base's skeleton and face).
 *
 * Role: a cheerful village baker in the Chibi Quest town, seen in 3D and as a 128 px sprite.
 * One idea: a round, happy baker in a tall puffy white chef hat, a cream apron, and a wooden tray of loaves.
 * Palette: skin #f2c7a4; hat, cuffs, socks #f3ead6; hair #5a301d; shirt #8a5a3a; apron #e8dcc0;
 *   trousers #4a3428; shoes #c89a6a; tray #9a6a3a; loaves #c88a3a with a top #e0a850.
 * Bodies: skin, hair (a tuft under the hat), undershirt, sleeve, cuff, pants, socks, shoes, chef-hat,
 *   apron, tray, loaves, loaf-top.
 * Rig: the humanoid skeleton. The hat and tuft are rigid on `head`; the tray and loaves are rigid on
 *   `spine`, so they stay level in every clip.
 * Color slots: skin, hair, eyes, cloth (the shirt). Presets: baker (default) and rosy.
 */
export default humanoidAsset({
  name: 'baker-h3',
  description: 'Chibi baker NPC: a tall white chef hat, a brown shirt with cream cuffs, a cream apron, and a tray of loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { brown: '#8a5a3a', sky: '#5f84ad', linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    baker: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'brown' },
    rosy: { skin: 'light', hair: 'auburn', eyes: 'green', cloth: 'rose' },
  },
  hair: false,
  pants: '#4a3428',
  shoes: '#c89a6a',
  extra(k, h) {
    const { ELBOW, WRIST, ANKLE } = h.joints;
    const lerp = (a: readonly [number, number, number], b: readonly [number, number, number], t: number) =>
      [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as const;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const cream = '#f3ead6';

    // Long sleeves: the forearm in the shirt color, with a rolled cream cuff at the wrist.
    k.body('sleeve', pair(sdf.cone(ELBOW, WRIST, 0.043, 0.039).bone('forearm.L')), { color: h.tint.shirt, roughness: 0.85, detail: 0.006 });
    k.body('cuff', pair(sdf.cone(lerp(ELBOW, WRIST, 0.8), WRIST, 0.047, 0.045).bone('forearm.L')), { color: cream, roughness: 0.8, detail: 0.006 });

    // Cream socks between the trouser hem and the shoe top.
    k.body('socks', pair(sdf.cone([ANKLE[0], 0.112, 0], [ANKLE[0], 0.088, 0], 0.046, 0.047).bone('shin.L')), { color: cream, roughness: 0.9, detail: 0.006 });

    // The chef hat: a cream band and a soft, puffy top, rigid on the head.
    const band = sdf.cylinder(0.165, 0.07, 0.02).at(0, 0.83, 0);
    const puff = sdf.ellipsoid([0.18, 0.1, 0.16]).rotateX(-8).at(0, 0.905, -0.01);
    const hat = band.smoothUnion(0.03, puff);
    k.body('chef-hat', hat, { color: cream, roughness: 0.8, bone: 'head', detail: 0.006 });

    // A brown hair tuft at the front, above the band.
    const tuft = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.05, 0.025, 0.035]).at(0, 0.862, 0.13),
      sdf.ellipsoid([0.03, 0.03, 0.03]).at(-0.02, 0.878, 0.14),
      sdf.ellipsoid([0.03, 0.03, 0.03]).at(0.025, 0.875, 0.15),
    );
    k.body('hair-tuft', tuft, { color: k.tint('hair'), roughness: 0.8, bone: 'head', detail: 0.005 });

    // The apron: a bib with two straps, and a skirt panel to the knees.
    const bib = sdf.box([0.19, 0.12, 0.018], 0.008).at(0, 0.31, 0.15);
    const skirt = sdf.box([0.25, 0.16, 0.02], 0.008).at(0, 0.2, 0.15);
    const strap = pair(sdf.capsule([0.06, 0.36, 0.145], [0.09, 0.375, 0.14], 0.006));
    const apron = sdf.smoothUnion(0.01, bib, skirt, strap);
    k.body('apron', apron, { color: '#e8dcc0', roughness: 0.85, detail: 0.006 });

    // The wooden tray, rigid on the spine, in front of the apron at waist height.
    const tray = sdf.box([0.44, 0.024, 0.2], 0.008).at(0, 0.235, 0.26);
    k.body('tray', tray, { color: '#9a6a3a', roughness: 0.7, bone: 'spine', detail: 0.006 });

    // Two golden loaves on the tray; the second has a lighter top.
    const loaves = sdf.smoothUnion(
      0.01,
      sdf.ellipsoid([0.075, 0.055, 0.07]).at(-0.1, 0.305, 0.26),
      sdf.ellipsoid([0.07, 0.05, 0.065]).at(0.1, 0.3, 0.25),
    );
    k.body('loaves', loaves, { color: '#c88a3a', roughness: 0.8, bone: 'spine', detail: 0.006 });
    k.body('loaf-top', sdf.ellipsoid([0.05, 0.02, 0.045]).at(0.1, 0.345, 0.25), { color: '#e0a850', roughness: 0.75, bone: 'spine', detail: 0.006 });
  },
});
