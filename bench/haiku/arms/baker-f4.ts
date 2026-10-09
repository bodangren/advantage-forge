import { profile, rgb, sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';
import type { HumanoidShape } from './parts/humanoid-kind.js';

/**
 * Baker (catalog `npcs/settlement/baker`), a cheerful village baker about 1.0 m to the top of the
 * chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind (the avatar
 * base's skeleton, head, and clips), dressed in `extra`; no two-hand `hold`.
 *
 * Role: a town NPC (the bakery stall), seen in 3D and as a 128 px sprite; the tall hat, the apron, the
 *   tray with two loaves, and the open smile must read.
 * One idea: a round, happy baker under a tall puffy white chef hat, carrying a flat tray of bread.
 * Proportions: the humanoid's (head center 0.675, eyes 0.628, shoulders 0.385, waist 0.25); the hat
 *   band at 0.79 to 0.88 and the hat top at 1.0; the tray at 0.22 in front of the apron.
 * Shape language: round and soft (hat puff, loaves, cheeks), with the square tray and apron.
 * Palette: skin #f2c7a4; hat, cuffs, and socks #f3ead6; hair #5a301d; shirt #8a5a3a; apron #e8dcc0
 *   with #cdbb94 seams; shorts #4a3428; shoes #c89a6a; tray #9a6a3a; loaves #c88a3a, top #e0a850.
 * Value plan: the white hat frames the light face (focal point); the brown shirt and the cream apron
 *   are the big masses; the golden loaves are the accent.
 * Bodies: skin, shirt, apron, cream (cuffs and socks), shorts, shoes, hat, hair (the tuft), tray, bread.
 * Rig: the humanoid skeleton and clips (idle, walk, run, attack, hit, rest, cheer, cast). The tray and
 *   the loaves are rigid on `chest`, so they turn with the arms; the tray stays level.
 */

type V3 = readonly [number, number, number];

const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const pair = (s: sdf.Shape) => s.mirror('x');

const TRAY_Y = 0.222; // the tray's center height (its top at 0.232)

const base = humanoidAsset({
  name: 'baker-f4',
  description: 'Chibi village baker NPC: a tall white chef hat, a brown shirt, a cream bib apron, and a tray of two loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    // The baker's brown shirt is the default; the avatar's cloth options follow it.
    cloth: { brown: '#8a5a3a', sky: '#5f84ad', linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    default: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'brown' },
    tan: { skin: 'tan', hair: 'black', eyes: 'hazel', cloth: 'linen' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: '#c89a6a',
  paintSkin(skin: sdf.Shape, h: HumanoidShape): sdf.Shape {
    // A wide open smile: the lower half of an ellipse, with the upper teeth and the tongue.
    const MOUTH_Y = 0.55;
    const mouthOpen = sdf
      .extrude(profile.circle(0.05), 0.3)
      .scale([1, 0.74, 1])
      .at(0, MOUTH_Y, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y));
    const teeth = sdf.box([0.04, 0.008, 0.3], 0.002).at(0, MOUTH_Y - 0.004, 0.1).intersect(mouthOpen);
    const tongue = sdf.extrude(profile.circle(0.02), 0.3).at(0, MOUTH_Y - 0.04, 0.1).intersect(mouthOpen);
    // Rosy cheeks, larger than the humanoid's default blush.
    const cheeks = pair(h.onFace(sdf.sphere(0.04), 0.14, 0.555));
    const blushColor = h.tint.blush ?? '#f09a86';
    const mouthColor = h.tint.mouth ?? '#a4503f';
    return skin
      .paintWhere(cheeks, blushColor, 0.03)
      .paintWhere(mouthOpen, mouthColor)
      .paintWhere(teeth, '#fbf6ee')
      .paintWhere(tongue, '#d8706a', 0.004);
  },
  extra(k: AssetContext, h: HumanoidShape) {
    const { SHOULDER, ELBOW, WRIST, HIP, KNEE, ANKLE } = h.joints;

    // ------------------------------------------------------------------ shirt: long sleeves in the cloth slot
    const sleeve = pair(
      sdf.smoothUnion(
        0.012,
        sdf.cone(SHOULDER, ELBOW, 0.05, 0.046).bone('upperarm.L'),
        sdf.cone(ELBOW, WRIST, 0.046, 0.041).bone('forearm.L'),
      ),
    );
    k.body('shirt', sdf.union(h.weighted(h.torso), sleeve), { color: h.tint.shirt ?? '#8a5a3a', roughness: 0.85 });

    // ------------------------------------------------------------------ apron: a cream bib with two straps, and a panel to the knees
    const bib = sdf
      .extrude(
        profile.polygon([
          [-0.09, 0.27],
          [0.09, 0.27],
          [0.085, 0.4],
          [0.05, 0.425],
          [-0.05, 0.425],
          [-0.085, 0.4],
        ]),
        0.03,
        0.008,
      )
      .at(0, 0, 0.12)
      .bone('chest');
    const panel = sdf
      .extrude(
        profile.polygon([
          [-0.1, 0.275],
          [0.1, 0.275],
          [0.13, 0.165],
          [-0.13, 0.165],
        ]),
        0.02,
        0.008,
      )
      .at(0, 0, 0.125)
      .bone('hips');
    const strap = pair(
      sdf.smoothUnion(
        0.006,
        sdf.capsule([0.075, 0.4, 0.115], [0.105, 0.44, 0.0], 0.011),
        sdf.capsule([0.105, 0.44, 0.0], [0.1, 0.43, -0.1], 0.011),
      ).bone('chest'),
    );
    const seam = sdf.box([0.4, 0.008, 0.06]).at(0, 0.272, 0.13);
    k.body('apron', sdf.union(bib, panel, strap).paintWhere(seam, '#cdbb94'), { color: '#e8dcc0', roughness: 0.9 });

    // ------------------------------------------------------------------ cream: the rolled cuffs and the socks
    const cuff = pair(sdf.cone(lerp(ELBOW, WRIST, 0.78), lerp(ELBOW, WRIST, 0.97), 0.05, 0.05).round(0.004).bone('forearm.L'));
    const sock = pair(sdf.cone(lerp(ANKLE, KNEE, 0.1), lerp(ANKLE, KNEE, 0.85), 0.046, 0.042).bone('shin.L'));
    k.body('cream', sdf.union(cuff, sock), { color: '#f3ead6', roughness: 0.85 });

    // ------------------------------------------------------------------ shorts: dark brown, ending above the socks
    const shorts = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule(HIP, lerp(HIP, KNEE, 0.25), 0.05).bone('leg.L')),
    );
    k.body('pants', shorts, { color: '#4a3428', roughness: 0.85 });

    // ------------------------------------------------------------------ hat: a band, a soft mushroom top, and a hair tuft
    const hatBand = sdf.cylinder(0.17, 0.07, 0.025).scale([1, 1, 0.92]).at(0, 0.83, 0);
    const hatPuff = sdf.ellipsoid([0.17, 0.12, 0.16]).at(0, 0.91, -0.01);
    const hatFlop = sdf.ellipsoid([0.13, 0.08, 0.12]).at(0.02, 0.98, -0.03);
    k.body('hat', sdf.smoothUnion(0.02, hatBand, hatPuff, hatFlop), { color: '#f3ead6', roughness: 0.85, bone: 'head' });
    const tuft = sdf.smoothUnion(
      0.01,
      sdf.ellipsoid([0.032, 0.026, 0.03]).at(-0.012, 0.8, 0.178),
      sdf.ellipsoid([0.03, 0.022, 0.028]).rotateZ(-22).at(0.016, 0.812, 0.182),
      sdf.sphere(0.02).at(0, 0.79, 0.19),
    );
    k.body('hair', tuft, { color: k.tint('hair'), roughness: 0.6, bone: 'head' });

    // ------------------------------------------------------------------ tray and loaves (rigid on the chest)
    const tray = sdf.box([0.5, 0.02, 0.24], 0.008).at(0, TRAY_Y, 0.14);
    k.body('tray', tray, { color: '#9a6a3a', roughness: 0.6, bone: 'chest' });
    const loafA = sdf.ellipsoid([0.085, 0.055, 0.075]).at(-0.11, 0.268, 0.14);
    const loafB = sdf.ellipsoid([0.085, 0.055, 0.075]).at(0.11, 0.268, 0.14);
    const loafTop = sdf.box([0.5, 0.06, 0.3]).at(0, 0.335, 0.14);
    const bread = sdf
      .union(loafA, loafB)
      .paintWhere(loafTop, '#e0a850', 0.012)
      .paintFn((x, y, z, b) => (y > 0.3 && x < -0.03 && Math.sin(x * 170) * Math.sin(z * 170) > 0.85 ? rgb('#f6ecd2') : b));
    k.body('bread', bread, { color: '#c88a3a', roughness: 0.8, bone: 'chest' });
  },
});

// The baker's torso, legs, and head are the humanoid's; the default detail is 0.006 for the large bodies.
export default { ...base, detail: 0.006 };
