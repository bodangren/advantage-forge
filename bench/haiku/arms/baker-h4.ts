import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Baker — Chibi Quest settlement NPC (catalog `npcs/settlement/baker`), about 1.0 m to the top of
 * the chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind (the
 * avatar base's skeleton and face) with a tall puffy white chef hat, a warm brown long-sleeved
 * shirt, a cream bib apron, dark trousers, cream socks, and a flat wooden tray of two loaves.
 *
 * Role: a cheerful village baker in the Chibi Quest town, seen in 3D and as a 128 px sprite. The
 *   hat, the apron, the tray with loaves, and the smile must read at 128 px.
 * One idea: a round, happy baker who holds a warm tray of bread at the waist.
 * Palette: skin #f2c7a4; hat, cuffs, and socks #f3ead6; hair #5a301d; shirt #8a5a3a; apron #e8dcc0
 *   with #cdbb94 seams; trousers #4a3428; shoes #c89a6a; tray #9a6a3a; loaves #c88a3a, top #e0a850.
 * Color slots: skin, hair (the tuft), eyes, cloth (the shirt). Presets: default and miller.
 * Rig: the humanoid kind's skeleton. The tray and the loaves are rigid on `chest`, so they stay
 *   level with the torso in every clip and far below the face. Clips: idle, walk, run, attack, hit,
 *   rest, cheer, cast (from the kind).
 */
const CREAM = '#f3ead6';
const APRON = '#e8dcc0';
const SEAM = '#cdbb94';
const LOAF = '#c88a3a';
const LOAF_TOP = '#e0a850';
const TRAY = '#9a6a3a';
const TRAY_Y = 0.228;
const TRAY_Z = 0.13;

const pair = (s: sdf.Shape) => s.mirror('x');
const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export default humanoidAsset({
  name: 'baker-h4',
  description: 'Chibi baker NPC: a tall white chef hat with a brown hair tuft, a brown shirt, a cream bib apron, and a tray of two loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  hair: false,
  undershirt: false,
  pants: '#4a3428',
  shoes: '#c89a6a',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { brown: '#8a5a3a', sky: '#5f84ad', linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    default: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'brown' },
    miller: { skin: 'tan', hair: 'black', eyes: 'green', cloth: 'linen' },
  },

  // The wide open smile: an open lower half-disc with teeth on top and a tongue, painted on the face.
  paintSkin(skin) {
    const MOUTH_Y = 0.55;
    const mouth = sdf
      .extrude(profile.circle(0.042), 0.3)
      .scale([1, 0.74, 1])
      .at(0, MOUTH_Y, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y));
    const teeth = sdf.box([0.034, 0.007, 0.3], 0.002).at(0, MOUTH_Y - 0.004, 0.1).intersect(mouth);
    const tongue = sdf.extrude(profile.circle(0.018), 0.3).at(0, MOUTH_Y - 0.042, 0.1).intersect(mouth);
    return skin
      .paintWhere(mouth, '#7a2a26')
      .paintWhere(teeth, '#fbf6ee')
      .paintWhere(tongue, '#d8706a', 0.004);
  },

  extra(k, h) {
    const { ELBOW, WRIST, ANKLE } = h.joints;

    // The chef hat: a band that hugs the skull top, a soft puffed top, and a brown tuft at the front.
    const hat = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.215, 0.07, 0.205]).at(0, 0.85, -0.005),
        sdf.ellipsoid([0.19, 0.115, 0.18]).rotateX(-6).at(0, 0.935, -0.02),
      );
    k.body('hat', hat.bone('head'), { color: CREAM, roughness: 0.8, detail: 0.006 });
    const tuft = sdf.chain(
      [
        [0.0, 0.88, 0.19, 0.035],
        [-0.012, 0.92, 0.2, 0.03],
        [0.012, 0.945, 0.19, 0.024],
      ],
      0.012,
    );
    k.body('tuft', tuft.bone('head'), { color: k.tint('hair'), roughness: 0.6, detail: 0.006 });

    // The brown shirt with long sleeves (the cloth slot) and cream rolled cuffs.
    const sleeves = pair(
      sdf.smoothUnion(
        0.012,
        sdf.cone(h.joints.SHOULDER, ELBOW, 0.046, 0.042).bone('upperarm.L'),
        sdf.cone(ELBOW, WRIST, 0.042, 0.038).bone('forearm.L'),
      ),
    );
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), sleeves);
    k.body('shirt', shirt, { color: h.tint.shirt, roughness: 0.85, detail: 0.006 });
    const cuff = pair(sdf.cone(lerp(ELBOW, WRIST, 0.74), lerp(ELBOW, WRIST, 0.97), 0.044, 0.043).bone('forearm.L'));
    k.body('cuffs', cuff, { color: CREAM, roughness: 0.85, detail: 0.006 });

    // The cream bib apron to the knees, two straps over the shoulders, and a darker hem seam.
    const apronPanel = sdf.box([0.22, 0.27, 0.016], 0.006).at(0, 0.265, 0.1);
    const straps = pair(sdf.capsule([0.085, 0.39, 0.1], [0.12, 0.43, -0.02], 0.011));
    const apron = sdf.smoothUnion(0.01, apronPanel, straps).paintWhere(sdf.box([0.25, 0.01, 0.03]).at(0, 0.136, 0.115), SEAM);
    k.body('apron', apron, { color: APRON, roughness: 0.9, detail: 0.006 });

    // Cream socks above the shoes.
    const socks = pair(sdf.cylinder(0.046, 0.05, 0.012).at(ANKLE[0], 0.1, 0).bone('shin.L'));
    k.body('socks', socks, { color: CREAM, roughness: 0.85, detail: 0.006 });

    // The flat wooden tray with two loaves, rigid on the chest and held at the fists' level.
    const tray = sdf.box([0.44, 0.022, 0.2], 0.006).at(0, TRAY_Y, TRAY_Z);
    k.body('tray', tray, { color: TRAY, roughness: 0.6, detail: 0.006, bone: 'chest' });

    const loafA = sdf.ellipsoid([0.075, 0.06, 0.07]).at(-0.085, 0.28, 0.14);
    const loafB = sdf.ellipsoid([0.062, 0.05, 0.06]).at(0.09, 0.275, 0.12);
    const seeds = sdf.union(
      sdf.sphere(0.008).at(-0.1, 0.335, 0.15),
      sdf.sphere(0.008).at(-0.07, 0.338, 0.165),
      sdf.sphere(0.008).at(-0.075, 0.332, 0.12),
      sdf.sphere(0.008).at(-0.105, 0.33, 0.125),
    );
    const topA = loafA.intersect(sdf.halfSpace([0, -1, 0], -0.31));
    const topB = loafB.intersect(sdf.halfSpace([0, -1, 0], -0.305));
    const loafABody = loafA.paintWhere(topA, LOAF_TOP).paintWhere(seeds, '#f6efe0');
    k.body('loafA', loafABody, { color: LOAF, roughness: 0.8, detail: 0.006, bone: 'chest' });
    k.body('loafB', loafB.paintWhere(topB, LOAF_TOP), { color: LOAF, roughness: 0.8, detail: 0.006, bone: 'chest' });
  },
});
