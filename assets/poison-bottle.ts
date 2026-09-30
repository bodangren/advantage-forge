import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

// Design note — poison-bottle (variant of health-potion):
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
  name: 'poison-bottle',
  description:
    'Squat glass flask with dark green liquid, black cork, cream skull label.',
  detail: 0.0035,
  reference: 'docs/item-mockups/poison-bottle-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // glass: ball + short neck + lip, true shell, open at the top
    const BY = 0.058;
    const glassSolid = sdf
      .smoothUnion(
        0.008,
        sdf.ellipsoid([0.064, 0.05, 0.058]).at(0, 0.05, 0),
        sdf.cylinder(0.014, 0.05).at(0, 0.125, 0),
      )
      .smoothUnion(0.004, sdf.torus(0.015, 0.0035).at(0, 0.149, 0))
      .subtract(sdf.cylinder(0.011, 0.03).at(0, 0.157, 0))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const glassShell = glassSolid;
    k.body('glass', glassShell, {
      color: '#1e4a14',
      roughness: 0.05,
      metalness: 0,
      opacity: 0.5,
      detail: 0.004,
      maxTriangles: 2000,
    });

    // liquid: two-thirds fill, flat top, glowing
    const liquid = sdf
      .ellipsoid([0.058, 0.044, 0.052])
      .at(0, 0.05, 0)
      .intersect(sdf.halfSpace([0, 1, 0], 0.066))
      .intersect(sdf.halfSpace([0, -1, 0], -0.003));
    k.body('liquid', liquid, {
      color: '#3fae2a',
      roughness: 0.25,
      metalness: 0,
      emissive: '#3fae2a',
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
      color: '#141414',
      roughness: 0.85,
      metalness: 0,
      detail: 0.003,
      maxTriangles: 350,
    });
    const label = sdf.extrude(profile.rect([0.05, 0.035], 0.008), 0.012).at(0, 0.052, 0.055);
    k.body('label', label, { color: '#efe2bc', roughness: 0.8, metalness: 0, detail: 0.0025, maxTriangles: 500 });
    const skull = sdf
      .smoothUnion(0.002, sdf.extrude(profile.circle(0.0105), 0.012).at(0, 0.058, 0.0585), sdf.extrude(profile.rect([0.012, 0.009], 0.002), 0.012).at(0, 0.045, 0.0585))
      .subtract(
        sdf.extrude(profile.rect([0.0045, 0.0045], 0.0008), 0.05).at(-0.0045, 0.0585, 0.06),
        sdf.extrude(profile.rect([0.0045, 0.0045], 0.0008), 0.05).at(0.0045, 0.0585, 0.06),
      );
    k.body('skull', skull, { color: '#101010', roughness: 0.7, metalness: 0, detail: 0.0025, maxTriangles: 500 });

  },
});
