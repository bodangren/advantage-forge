import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

// Design note — antidote (items/consumables/antidote):
// A small flask (0.8 scale) with pale green liquid and a green leaf tag.
// Copy of the health-potion base; changes: liquid color, form, one mark.
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

const S = (s: any) => s.scale(0.8);

export default defineAsset({
  name: 'antidote',
  description:
    'Small chibi flask of pale green antidote, cork with flange, twine tie and a green leaf tag.',
  detail: 0.0035,
  reference: 'docs/item-mockups/antidote-mock.jpg',
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
    const glassShell = glassSolid;
    k.body('glass', S(glassShell), {
      color: '#3a6a30',
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
      .intersect(sdf.halfSpace([0, 1, 0], 0.072))
      .intersect(sdf.halfSpace([0, -1, 0], -0.003));
    k.body('liquid', S(liquid), {
      color: '#9fe08a',
      roughness: 0.25,
      metalness: 0,
      emissive: '#9fe08a',
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
      .paintFn((x, y, z, _base) => {
        let c = mixRgb(CORK, CORK_DARK, 0.35 + 0.5 * noise.fbm(x * 50, y * 18, z * 50, 2));
        const top = Math.max(0, Math.min(1, (y - 0.165) / 0.012));
        return mixRgb(c, CORK_LIGHT, top * 0.55);
      });
    k.body('cork', S(corkShape), {
      color: '#b08a5a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.003,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 60, y * 22, z * 60, 2),
      maxTriangles: 350,
    });

    // ------------------------------------------------------------- twine
    // Twine tie at the neck: three chunky wraps stacked as small tori around
    // the lip, plus a knot bead and a single visible bow loop on the +X side.
    // Wraps sit at the lip line, just below the cork flange, so the rope
    // appears to hold the cork in place.
    const twineY = 0.134;
    const wraps = sdf.union(
      sdf.torus(0.0165, 0.0025).at(0, twineY, 0),
      sdf.torus(0.0165, 0.0025).at(0, twineY + 0.0045, 0),
      sdf.torus(0.0165, 0.0025).at(0, twineY + 0.009, 0),
      sdf.sphere(0.0046).at(LIP_R + 0.005, twineY + 0.005, 0),
    );
    // Bow loop: ring in the XY plane (axis along Z), so the loop shows as
    // a full circle from the front view and reads clearly as a tied knot.
    const bowLoop = sdf
      .torus(0.01, 0.0026)
      .rotateX(90)
      .at(LIP_R + 0.005, twineY + 0.005, 0);
    // Short tail strands drooping down past the knot.
    const tail1 = sdf.capsule(
      [LIP_R + 0.005, twineY + 0.004, 0],
      [LIP_R + 0.012, twineY - 0.014, 0.004],
      0.0022,
    );
    const tail2 = sdf.capsule(
      [LIP_R + 0.005, twineY + 0.004, 0],
      [LIP_R + 0.014, twineY - 0.01, -0.005],
      0.0022,
    );
    const twine = sdf
      .smoothUnion(0.0014, wraps, bowLoop, tail1, tail2)
      .paintFn((x, y, z, _base) => {
        let c = mixRgb(TWINE, TWINE_DARK, 0.35 + 0.45 * noise.fbm(x * 80, y * 18, z * 80, 2));
        const a = Math.atan2(z, x);
        const stripe = 0.5 + 0.5 * Math.sin(a * 22 + y * 380);
        c = mixRgb(c, TWINE_DARK, stripe * 0.22);
        return c;
      });
    k.body('twine', S(twine), {
      color: '#c9a878',
      roughness: 0.9,
      metalness: 0,
      detail: 0.003,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 110, y * 25, z * 110, 2),
      maxTriangles: 1000,
    });

    // green leaf tag hanging from the knot, plus a wider cork flange
    const kx = LIP_R + 0.005;
    const leaf = sdf
      .ellipsoid([0.011, 0.016, 0.0032])
      .rotateZ(25)
      .at(kx + 0.016, 0.108, 0.004);
    const stem = sdf.capsule([kx, 0.139, 0], [kx + 0.012, 0.12, 0.003], 0.0022);
    k.body('leaf', S(sdf.smoothUnion(0.003, leaf, stem)), { color: '#5fc23a', roughness: 0.7, metalness: 0, detail: 0.003, maxTriangles: 500 });
    k.body('flange', S(sdf.cylinder(0.02, 0.006, 0.002).at(0, 0.168, 0)), { color: '#b08a5a', roughness: 0.85, metalness: 0, detail: 0.003, maxTriangles: 300 });
  },
});
