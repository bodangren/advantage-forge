import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Brass pocket compass (equipment/tools), 0.1 m wide, lying flat on y = 0, front toward +Z.
 * Role: a hero's trail tool, read as a pickup/icon at 128 px, so forms stay chunky.
 * One idea: a round brass case flipped open, its red needle jumping off a dark face.
 * Shape language: round dominant (friendly), one tilted disc (the lid) for silhouette.
 * Palette: gold brass #d4a93a dominant, dark walnut face #2b2118 secondary,
 *   red #c23b2e needle as the accent, cream #efe6d1 tail, pale glass #cfd8dd.
 * Materials: brass (metalness 1, roughness 0.32), dark dial paint, needle paint, glass (opacity).
 * Details: rolled lip, hinge knuckles, front latch, gold ticks + ring on the dial, pivot pin.
 * No rig; the lid is a static group pivoted open on the hinge line.
 * Triangle plan: chunky cells + maxTriangles caps; every body stays simple and thick.
 */

const R = 0.05; // case radius
const FACE_TOP = 0.0345; // dial top surface
const NEEDLE_Y = 0.0355; // needle mid-plane
const NEEDLE_ANGLE = -32; // needle yaw, red end toward north-ish

// Linear-space colors for paintFn blending (mixRgb takes triples, not hex strings).
const GOLD = rgb('#d4a93a');
const GOLD_LIGHT = rgb('#f0cd6a');
const GOLD_DARK = rgb('#8a6a20');
const DIAL_DARK = rgb('#3a2c1c');

export default defineAsset({
  name: 'compass',
  description: 'Brass pocket compass with an open lid, glass face, and a red-and-cream needle.',
  detail: 0.007,
  reference: 'docs/item-mockups/compass-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ brass case
    // Revolved body with a rolled lip at the top and a soft bottom bevel.
    const caseProfile = profile.polygon(
      [
        [0.0, 0.008],
        [0.037, 0.0],
        [0.046, 0.004],
        [R, 0.016],
        [R, 0.027],
        [0.047, 0.034],
        [0.043, 0.0355],
        [0.03, 0.0355],
      ],
      { smooth: true },
    );
    // Hinge knuckles at the back, a chunky latch at the front (+Z), the pivot pin.
    const fittings = sdf.union(
      sdf.cylinder(0.006, 0.016, 0.002).rotateZ(90).at(0.014, 0.033, -0.045),
      sdf.cylinder(0.006, 0.016, 0.002).rotateZ(90).at(-0.014, 0.033, -0.045),
      sdf.box([0.014, 0.012, 0.006], 0.002).at(0, 0.03, 0.048),
      sdf.sphere(0.0035).at(0, 0.037, 0),
    );
    k.body(
      'brass',
      sdf
        .revolve(caseProfile)
        .smoothUnion(0.0025, fittings)
        .paintFn((x, y, z, base) => {
          // Crown highlight on the lip; soft warm tarnish low on the case.
          let c = mixRgb(base, GOLD_LIGHT, 0.3 * Math.max(0, (y - 0.027) / 0.009));
          c = mixRgb(c, GOLD_DARK, 0.3 * Math.max(0, noise.fbm(x * 9, y * 9, z * 9, 2)) * (1 - y / 0.05));
          return c;
        }),
      { color: '#d4a93a', roughness: 0.32, metalness: 1, detail: 0.005, maxTriangles: 650 },
    );

    // ------------------------------------------------------------------ dial
    // Dark inset dial with a gold ring and sixteen gold ticks (majors at the cardinals).
    const face = sdf
      .cylinder(0.0425, 0.016, 0.0015)
      .at(0, FACE_TOP - 0.008, 0)
      .paintFn((x, y, z, base) => {
        const r = Math.hypot(x, z);
        // Gold ring hugging the rim of the dial.
        if (r > 0.0392 && r < 0.042) return GOLD;
        // Sixteen ticks; majors longer and wider at N/E/S/W.
        const a = Math.atan2(x, z);
        const seg = a / (Math.PI / 8);
        const angDist = Math.abs(seg - Math.round(seg)) * (Math.PI / 8);
        const major = Math.abs(Math.round(seg)) % 4 === 0;
        const inBand = major ? r > 0.023 && r < 0.037 : r > 0.03 && r < 0.037;
        if (inBand && angDist < (major ? 0.06 : 0.03)) return GOLD;
        // Slight mottling so the dial is not dead flat.
        return mixRgb(base, DIAL_DARK, 0.5 * Math.max(0, noise.fbm(x * 60, 0, z * 60, 2)));
      });
    k.body('face', face, {
      color: '#241a12',
      roughness: 0.55,
      metalness: 0.1,
      detail: 0.006,
      textureDensity: 2,
      maxTriangles: 450,
    });

    // ------------------------------------------------------------------ needle
    // Chunky diamond needle: red north half, cream tail with a small fork.
    const needleOutline = profile.polygon([
      [0, 0.03],
      [0.009, 0.003],
      [0.0045, -0.019],
      [0, -0.026],
      [-0.0045, -0.019],
      [-0.009, 0.003],
    ]);
    const redHalf = sdf.halfSpace([0, 0, -1], -0.0005); // z >= 0 (the red, north end)
    const needle = sdf
      .extrude(needleOutline, 0.004)
      .rotateX(90) // lie flat: profile plane becomes XZ, thickness along Y
      .rotateY(NEEDLE_ANGLE)
      .at(0, NEEDLE_Y, 0)
      .paintWhere(redHalf.rotateY(NEEDLE_ANGLE), '#c23b2e');
    k.body('needle', needle, {
      color: '#efe6d1',
      roughness: 0.4,
      metalness: 0.2,
      detail: 0.003,
      maxTriangles: 150,
    });

    // ------------------------------------------------------------------ glass
    // Pale crystal bubble sitting on the case lip, clearing the needle and pin.
    k.body('glass', sdf.ellipsoid([0.044, 0.006, 0.044]).at(0, 0.0475, 0), {
      color: '#cfd8dd',
      roughness: 0.08,
      metalness: 0,
      opacity: 0.14,
      detail: 0.009,
      maxTriangles: 280,
    });

    // ------------------------------------------------------------------ lid
    // Static group pivoted on the back hinge; the lid leans open about 40 deg past vertical.
    k.group('lid', { at: [0, 0.034, -0.044], rotate: [-150, 0, 0] }, (g) => {
      // Brass shell: back plate plus a rolled rim ring; the inner disc is recessed.
      const shell = sdf.union(
        sdf.cylinder(0.049, 0.009, 0.003).at(0, 0.004, 0.048),
        sdf.torus(0.045, 0.007).at(0, 0.001, 0.048),
      );
      g.body('lid-brass', shell, {
        color: '#d4a93a',
        roughness: 0.32,
        metalness: 1,
        detail: 0.005,
        maxTriangles: 380,
      });
      g.body('lid-inner', sdf.cylinder(0.045, 0.016, 0.001).at(0, -0.001, 0.048), {
        color: '#6b4226',
        roughness: 0.7,
        metalness: 0,
        detail: 0.008,
        maxTriangles: 200,
      });
    });
  },
});
