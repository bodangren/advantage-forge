import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — stout glass bottle (props/containers/bottle).
 *
 * Role: shelf and table dressing in the chibi tavern; must read at 128 px.
 * Size: 0.22 m tall, 0.07 m max diameter at the belly, stands on y = 0, faces +Z.
 * One idea: a round-bellied little wine bottle — fat soft belly, pinched shoulder,
 *   narrow neck with a rolled lip and a dark cork pressed into the top.
 * Shape language: round dominant (revolved belly, rolled lip, domed cork),
 *   square secondary (straight paper label band on the lower belly).
 * Palette: deep wine glass #5a1a26 (dominant), cork #7a4f2a, paper label #e8d8a8
 *   with #5a4226 ink. Value plan: dark foot and shoulder, sun-lit belly streak.
 * Materials: glass (roughness 0.18, opacity 0.85, metalness 0), cork (roughness
 *   0.85), paper label (roughness 0.9). Focal point: pale label on the dark belly.
 * Detail: primary revolved glass body + rolled lip; secondary cork and label wrap;
 *   tertiary ink borders and stamp, glass highlight streak, cork grain in bump.
 * Rig/animation: none (static prop).
 */

const GLASS = rgb('#5a1a26'); // deep wine red
const GLASS_DARK = rgb('#380e16');
const GLASS_LIGHT = rgb('#a04a58');
const CORK = rgb('#7a4f2a');
const CORK_DARK = rgb('#5a3a1e');
const PAPER = rgb('#e8d8a8');
const PAPER_SHADE = rgb('#d9c48e');
const INK = '#5a4226';

const HI_DIR = 0.9; // highlight direction on the belly (rad, from +X toward +Z)

export default defineAsset({
  name: 'bottle',
  description:
    'Stout round-bellied wine bottle: deep red glass, rolled lip, dark cork, paper label with ink stamp.',
  detail: 0.005,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- glass body
    // Hollow-look revolved bottle: flat foot, fat belly, pinched shoulder,
    // straight neck, rolled lip. Profile U = radius, V = height; closes on the
    // axis so the top face is a shallow dome under the cork.
    const bodyProfile = profile.polygon(
      [
        [0.024, 0.0],
        [0.03, 0.004],
        [0.034, 0.02],
        [0.035, 0.055], // belly, 0.07 m wide
        [0.034, 0.085],
        [0.029, 0.11],
        [0.02, 0.135],
        [0.0135, 0.15],
        [0.0115, 0.16], // neck
        [0.0115, 0.178],
        [0.0132, 0.184], // lip bulge
        [0.0105, 0.189],
        [0, 0.192],
      ],
      { smooth: true, samples: 16 },
    );
    const bodyShape = sdf
      .revolve(bodyProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0)); // flat foot on y = 0
    const lip = sdf.torus(0.0118, 0.0038).at(0, 0.183, 0);
    const glass = bodyShape.smoothUnion(0.0035, lip);

    // Wine glass value plan: dark foot and neck, sun-lit streak on the belly.
    const glassPaint = (x: number, y: number, z: number) => {
      let c = GLASS;
      const t = Math.min(1, y / 0.14);
      c = mixRgb(c, GLASS_DARK, 0.5 * (1 - t) * (1 - t)); // heavy glass base
      c = mixRgb(c, GLASS_DARK, 0.25 * Math.max(0, (t - 0.75) / 0.25)); // shaded shoulder
      const a = Math.atan2(z, x);
      let d = Math.abs(a - HI_DIR);
      d = Math.min(d, Math.PI * 2 - d);
      const streak = Math.exp(-(d * d) / 0.16) * Math.sin(Math.PI * Math.min(1, t));
      c = mixRgb(c, GLASS_LIGHT, 0.5 * streak); // vertical highlight
      return c;
    };
    k.body('glass', glass.paintFn(glassPaint), {
      color: '#5a1a26',
      roughness: 0.18,
      metalness: 0,
      opacity: 0.85,
      detail: 0.005,
      paintWeight: 2,
      maxTriangles: 1700,
    });

    // ------------------------------------------------------------------ cork
    // Dark cork pressed into the neck: shaft inside the lip, rounded top proud.
    const corkShape = sdf
      .smoothUnion(
        0.004,
        sdf.cylinder(0.0092, 0.036, 0.0025).at(0, 0.195, 0),
        sdf.sphere(0.0088).at(0, 0.213, 0),
      )
      .paintFn((x, y, z) => {
        let c = mixRgb(CORK, CORK_DARK, 0.5 + 0.5 * noise.fbm(x * 40, y * 10, z * 40, 2));
        c = mixRgb(c, CORK_DARK, 0.4 * Math.max(0, (y - 0.21) / 0.012)); // darker top face
        return c;
      });
    k.body('cork', corkShape, {
      color: '#7a4f2a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 300,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 46, y * 12, z * 46, 2),
    });

    // ----------------------------------------------------------------- label
    // Paper wrap on the lower third: a chunky solid band revolved around the
    // belly, embedded 4 mm into the glass so it can never float. Soft paper
    // mottling only — crisp ink lives on the separate stamp body below.
    const LABEL_Y0 = 0.034;
    const LABEL_Y1 = 0.09;
    const labelProfile = profile.polygon(
      [
        // outer face up (glass surface + 3 mm paper)
        [0.0372, LABEL_Y0],
        [0.0377, 0.048],
        [0.038, 0.062],
        [0.0374, 0.078],
        [0.0354, LABEL_Y1],
        // inner face down (embedded 5 mm into the glass)
        [0.0274, LABEL_Y1],
        [0.0294, 0.078],
        [0.0300, 0.062],
        [0.0297, 0.048],
        [0.0292, LABEL_Y0],
      ],
      { smooth: true, samples: 16 },
    );
    const labelBand = sdf.revolve(labelProfile);
    k.body('label', labelBand.paintFn((x, y, z) => mixRgb(PAPER, PAPER_SHADE, 0.4 + 0.4 * noise.fbm(x * 24, y * 24, z * 24, 2))), {
      color: '#e8d8a8',
      roughness: 0.9,
      metalness: 0,
      detail: 0.004,
      paintWeight: 2,
      maxTriangles: 900,
    });

    // Round ink stamp pressed onto the paper front (+Z), like a printed seal.
    const stampShape = sdf
      .ellipsoid([0.0135, 0.011, 0.0028])
      .at(0, 0.062, 0.0378)
      .paintFn((x, y, z) => mixRgb(rgb(INK), rgb('#3a2a16'), 0.3 + 0.3 * noise.fbm(x * 30, y * 30, z * 30, 2)));
    k.body('stamp', stampShape, {
      color: INK,
      roughness: 0.85,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 200,
    });
  },
});
