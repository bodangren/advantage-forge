import { HAND_FIT, defineAsset, noise, profile, rgb, mixRgb, sdf } from '../src/index.js';

/**
 * Design note
 * - Role: pickup / equipment item; seen small in hand and as an icon.
 * - Size: 0.3 m wide (X) x 0.22 m deep (Z) x 0.1 m thick (Y), lying flat on y = 0.
 *   The fore edge faces +Z; the spine sits at -Z.
 * - One idea: a fat, chunky tome whose gold corner caps and glowing teal rune read instantly.
 * - Shape language: square and sturdy (book) with round gold caps as accents.
 * - Palette: purple leather cover dominant, cream pages secondary, gold caps and clasp accent,
 *   teal emissive rune as the focal glow.
 * - Materials: leather (rough 0.62), pages (rough 0.9), gold (metal 1, rough 0.3),
 *   emissive rune on a dark base.
 * - Details: corner caps, front clasp, spine bands, page striations, leather grain in bump.
 * - No rig; a closed book resting on the ground.
 */

const W = 0.3; // width (X)
const D = 0.22; // depth (Z)
const H = 0.1; // total thickness (Y)

const leather = rgb('#6e48b8');
const leatherDark = rgb('#4a2f86');

export default defineAsset({
  name: 'spellbook',
  description: 'Thick closed spellbook with a purple leather cover, gold corner caps and clasp, a glowing rune, and cream page edges.',
  detail: 0.006,
  reference: 'docs/item-mockups/spellbook-mock.jpg',
  equip: { slot: 'offhand', fitScale: HAND_FIT, frame: 'body', origin: [0, 0.05, -0.08], rotate: [90, 0, 90] },

  build(k) {
    // ------------------------------------------------------------------ pages: cream block, inset from the cover
    const pageBox = sdf.box([W - 0.032, 0.068, D - 0.024], 0.004).at(0, 0.052, 0);
    const pages = pageBox.paintFn((x, y, z) => {
      const layer = 0.5 + 0.5 * noise.noise3(x * 10, y * 220, z * 10);
      const tone = 0.5 + 0.5 * noise.noise3(x * 40, y * 8, z * 40);
      return mixRgb(rgb('#efe6cf'), rgb('#d9cba6'), 0.12 + 0.2 * layer + 0.12 * tone);
    });
    k.body('pages', pages, {
      color: '#efe6cf',
      roughness: 0.9,
      bump: (x, y, z) => 0.0016 * Math.abs(Math.sin(y * 380 + noise.noise3(x * 30, 0, z * 30) * 2)),
    });

    // ------------------------------------------------------------------ cover: bottom board, top board, spine wrap
    const bottom = sdf.box([W, 0.016, D], 0.008).at(0, 0.01, 0);
    const top = sdf.box([W, 0.016, D], 0.008).at(0, H - 0.008, 0);
    const spine = sdf.box([W, 0.078, 0.018], 0.007).at(0, 0.052, -D / 2 + 0.008);
    const cover = sdf
      .smoothUnion(0.006, bottom, top, spine)
      .paintFn((x, y, z) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 55, y * 55, z * 55, 2);
        const wear = 0.5 + 0.5 * noise.noise3(x * 14, y * 14, z * 14);
        return mixRgb(leather, leatherDark, 0.1 + 0.28 * grain + 0.12 * wear);
      });
    k.body('cover', cover, {
      color: '#6e48b8',
      roughness: 0.62,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });

    // ------------------------------------------------------------------ gold: corner caps, clasp, spine bands
    const cap = sdf
      .box([0.06, 0.034, 0.06], 0.016)
      .at(W / 2 - 0.03, H - 0.004, D / 2 - 0.03)
      .mirror('x', 0)
      .mirror('z', 0);
    const claspPlate = sdf.box([0.07, 0.056, 0.016], 0.006).at(0, 0.052, D / 2 + 0.002);
    const claspKnob = sdf.sphere(0.014).at(0, 0.052, D / 2 + 0.015);
    const spineBand = sdf
      .box([0.024, 0.08, 0.016], 0.006)
      .at(0.082, 0.052, -D / 2 - 0.002)
      .mirror('x', 0);
    const gold = sdf
      .union(cap, claspPlate, claspKnob, spineBand)
      .paintFn((x, y, z) => mixRgb(rgb('#d4a93a'), rgb('#9c6d1c'), 0.25 + 0.2 * (0.5 + 0.5 * noise.noise3(x * 40, y * 40, z * 40))));
    k.body('gold', gold, { color: '#d4a93a', roughness: 0.3, metalness: 1 });

    // ------------------------------------------------------------------ rune: teal sigil on a dark base, emissive
    const ring = sdf.torus(0.042, 0.007);
    const diamond = sdf
      .extrude(profile.polygon([[0, 0.03], [0.022, 0], [0, -0.03], [-0.022, 0]]), 0.012, 0.003)
      .rotateX(-90);
    const rune = sdf
      .union(ring, diamond)
      .at(0, H - 0.002, 0.018)
      .paintFn((x, y, z) => mixRgb(rgb('#0b2630'), rgb('#123a46'), 0.5 + 0.5 * noise.noise3(x * 60, y * 60, z * 60)));
    k.body('rune', rune, {
      color: '#0b2630',
      roughness: 0.2,
      emissive: '#46d8e8',
      emissiveIntensity: 1.8,
    });
  },
});
