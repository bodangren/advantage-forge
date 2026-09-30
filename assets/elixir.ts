import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

// Design note — elixir (variant of health-potion):
// - Role: small consumable pickup and inventory icon; reads at 128 px.
// - Size: 0.18 m tall total, ~0.12 m wide at the belly. Stands on y = 0, faces +Z.
// - The one idea: a chubby round-bottomed glass flask with a glowing red heart,
//   a chunky cork and a twine bow at the neck — instantly readable as "health".
// - Shape language: round dominant (sphere bulb, sphere cork cap, torus twine),
//   one small square second (cork shaft).
// - Palette: liquid red #e0344a (emissive, intensity 0.4) on dark wine base
//   per the emissive rule; cork #b08a5a; twine #c9a878. Glass shell is a faint
//   cool tint at opacity 0.35.
// - Materials: liquid (rough 0.2, emissive), glass shell (rough 0.1, opacity
//   0.35, metalness 0), cork (rough 0.85), twine (rough 0.9, slight fiber bump).
// - Detail: revolved glass body + lip; smaller revolved liquid capped at 2/3
//   fill by a flat plane; rounded cork; multi-wrap twine + bow on the +X side.
// - Rig/animation: none (static prop).
// - Tri budget: under 4 000 total.

const LIQUID_LIGHT = rgb('#f01830');
const LIQUID = rgb('#660812');
const LIQUID_DARK = rgb('#3a060c');
const LIQUID_GLOW = rgb('#ff3a52');
const GLASS_TINT = rgb('#c8dee2');
const GLASS_SHADE = rgb('#5e7a82');
const GLASS_HI = rgb('#ffffff');
const CORK = rgb('#b08a5a');
const CORK_DARK = rgb('#5e3e1e');
const CORK_LIGHT = rgb('#d3b585');
const TWINE = rgb('#c9a878');
const TWINE_DARK = rgb('#5e4a26');

const BELLY_R = 0.058; // outer glass belly radius
const NECK_R = 0.012; // outer neck radius
const LIP_R = 0.0145; // outer lip bulge radius
const FILL_Y = 0.075;
const BULB_TOP = 0.115;
const SHOULDER_Y = 0.13;
const NECK_Y0 = 0.137;
const NECK_Y1 = 0.148;
const LIP_Y = 0.154;
const GLASS_TOP_Y = 0.156; // top of the closed glass dome
// Cork: shaft starts inside the neck (so it pokes through the closed glass
// surface) and extends up to a wider flange and rounded crown.
const CORK_SHAFT_Y = 0.144;
const CORK_SHAFT_H = 0.026;
const CORK_FLANGE_Y = 0.171;
const CORK_CROWN_Y = 0.182;

export default defineAsset({
  name: 'elixir',
  description:
    'Fluted glass flask with golden liquid, gold cap with red gem, gold neck ring.',
  detail: 0.0035,
  reference: 'docs/item-mockups/elixir-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // glass: ball + short neck + lip, true shell, open at the top
    const BY = 0.058;
    const glassSolid = sdf
      .smoothUnion(
        0.008,
        sdf.sphere(0.058).at(0, BY, 0),
        sdf.cylinder(0.014, 0.05).at(0, 0.125, 0),
      )
      .smoothUnion(0.004, sdf.torus(0.015, 0.0035).at(0, 0.149, 0))
      .subtract(sdf.cylinder(0.011, 0.03).at(0, 0.157, 0))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const glassShell = glassSolid.displace(0.005, (x, y, z) => {
      const w = Math.max(0, Math.min(1, (0.118 - y) / 0.03));
      return -w * (0.5 + 0.5 * Math.cos(6 * Math.atan2(z, x)));
    });
    k.body('glass', glassShell, {
      color: '#6a5210',
      roughness: 0.05,
      metalness: 0,
      opacity: 0.5,
      detail: 0.004,
      maxTriangles: 2000,
    });

    // liquid: two-thirds fill, flat top, glowing
    const liquid = sdf
      .sphere(0.052)
      .at(0, BY, 0)
      .intersect(sdf.halfSpace([0, 1, 0], 0.084))
      .intersect(sdf.halfSpace([0, -1, 0], -0.003));
    k.body('liquid', liquid, {
      color: '#ffcf3a',
      roughness: 0.25,
      metalness: 0,
      emissive: '#ffcf3a',
      emissiveIntensity: 0.6,
      detail: 0.004,
      maxTriangles: 450,
    });

    // cork: shaft 0.012 m inside the neck, wider crown sphere
    const corkShape = sdf
      .smoothUnion(
        0.003,
        sdf.cylinder(0.014, 0.022, 0.003).at(0, 0.153, 0),
        sdf.ellipsoid([0.017, 0.011, 0.017]).at(0, 0.166, 0),
      )

    k.body('cork', corkShape, {
      color: '#e6b422',
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.003,
      maxTriangles: 350,
    });
    k.body('gem', sdf.ellipsoid([0.009, 0.0095, 0.009]).at(0, 0.1775, 0), {
      color: '#d81e1e',
      roughness: 0.1,
      metalness: 0.1,
      emissive: '#d81e1e',
      emissiveIntensity: 0.3,
      flat: true,
      detail: 0.003,
      maxTriangles: 300,
    });

    // gold neck ring
    const ring = sdf
      .smoothUnion(0.002, sdf.torus(0.0165, 0.0038).at(0, 0.138, 0), sdf.torus(0.0165, 0.0038).at(0, 0.146, 0))
      .smoothUnion(0.003, sdf.torus(0.006, 0.0018).rotateX(90).at(0.0265, 0.142, 0));
    k.body('ring', ring, {
      color: '#e6b422',
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.003,
      maxTriangles: 800,
    });
  },
});
