import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

// Design note — chibi health potion (items/consumables/health-potion):
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
  name: 'health-potion',
  description:
    'Chibi round-bottomed glass flask with glowing red liquid, chunky cork stopper, and twine tie at the neck.',
  detail: 0.0035,
  reference: 'docs/item-mockups/health-potion-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- glass shell
    // Revolved flask: flat foot at y = 0, spherical belly, pinched shoulder,
    // short chunky neck, slight outward lip. The top closes at GLASS_TOP_Y
    // so the cork can sit proudly above the lip without overlapping the
    // closed dome.
    const glassProfile = profile.polygon(
      [
        [0.018, 0.0],
        [0.032, 0.004],
        [0.05, 0.014],
        [BELLY_R, 0.045],
        [BELLY_R - 0.003, 0.072],
        [0.05, 0.094],
        [0.036, BULB_TOP],
        [0.022, SHOULDER_Y],
        [NECK_R, NECK_Y0],
        [NECK_R, NECK_Y1],
        [LIP_R, LIP_Y],
        [0.005, GLASS_TOP_Y - 0.002],
        [0, GLASS_TOP_Y],
      ],
      { smooth: true, samples: 14 },
    );
    const glassShell = sdf
      .revolve(glassProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z, _base) => {
        const yT = y / BULB_TOP;
        let c = mixRgb(GLASS_SHADE, GLASS_TINT, Math.min(1, yT * 1.5));
        const rim = Math.exp(-Math.pow((y - FILL_Y) * 30, 2));
        c = mixRgb(c, GLASS_HI, 0.45 * rim);
        const a = Math.atan2(z, x);
        const d = Math.abs(a - (-1.0));
        const w = Math.min(d, Math.PI * 2 - d);
        const streak = Math.exp(-(w * w) / 0.18) * Math.sin(Math.PI * Math.min(1, y / 0.13));
        c = mixRgb(c, GLASS_HI, 0.5 * streak);
        const m = noise.fbm(x * 35, y * 35, z * 35, 2) * 0.05;
        return mixRgb(c, GLASS_TINT, 0.5 + m);
      });
    k.body('glass', glassShell, {
      color: '#c8dee2',
      roughness: 0.08,
      metalness: 0,
      opacity: 0.35,
      detail: 0.0045,
      paintWeight: 2,
      maxTriangles: 1100,
    });

    // ------------------------------------------------------------- liquid
    const LIQUID_R = BELLY_R - 0.005;
    const liquidProfile = profile.polygon(
      [
        [0.0, 0.005],
        [0.022, 0.005],
        [0.042, 0.012],
        [LIQUID_R, 0.045],
        [LIQUID_R - 0.002, FILL_Y],
        [LIQUID_R - 0.012, FILL_Y - 0.001],
        [LIQUID_R - 0.022, FILL_Y - 0.002],
        [LIQUID_R - 0.03, FILL_Y - 0.003],
        [0.024, FILL_Y - 0.005],
        [0.01, FILL_Y - 0.006],
        [0, FILL_Y - 0.007],
      ],
      { smooth: true, samples: 12 },
    );
    const liquid = sdf
      .revolve(liquidProfile)
      .intersect(sdf.halfSpace([0, 1, 0], FILL_Y))
      .paintFn((x, y, z, _base) => {
        const fill = Math.max(0, Math.min(1, (y - 0.005) / (FILL_Y - 0.008)));
        let c = mixRgb(LIQUID, LIQUID_LIGHT, fill * 0.8);
        const a = Math.atan2(z, x);
        const w = Math.abs(a - (-2.4));
        const wd = Math.min(w, Math.PI * 2 - w);
        const shade = Math.exp(-(wd * wd) / 0.5);
        c = mixRgb(c, LIQUID_DARK, 0.45 * shade * (1 - fill * 0.4));
        return c;
      });
    k.body('liquid', liquid, {
      color: '#820a1c',
      roughness: 0.35,
      metalness: 0.1,
      emissive: LIQUID_GLOW,
      emissiveIntensity: 0.4,
      detail: 0.004,
      paintWeight: 2,
      maxTriangles: 1000,
    });

    // ------------------------------------------------------------- cork
    // Chunky cork stopper pressed into the neck. The shaft starts inside
    // the closed glass shell and pokes through the surface so the cork
    // appears attached; a wider flange and rounded crown sit above the lip.
    const corkShape = sdf
      .smoothUnion(
        0.0025,
        sdf.cylinder(NECK_R + 0.001, CORK_SHAFT_H, 0.0015).at(0, CORK_SHAFT_Y + CORK_SHAFT_H / 2, 0),
        sdf.cylinder(LIP_R + 0.001, 0.005, 0.002).at(0, CORK_FLANGE_Y, 0),
        sdf.sphere(0.0145).at(0, CORK_CROWN_Y, 0),
      )
      .paintFn((x, y, z, _base) => {
        let c = mixRgb(CORK, CORK_DARK, 0.35 + 0.5 * noise.fbm(x * 50, y * 18, z * 50, 2));
        const top = Math.max(0, Math.min(1, (y - 0.18) / 0.014));
        c = mixRgb(c, CORK_LIGHT, top * 0.55);
        const under = Math.max(0, Math.min(1, (0.166 - y) / 0.01));
        c = mixRgb(c, CORK_DARK, under * 0.6);
        return c;
      });
    k.body('cork', corkShape, {
      color: '#8a6a3a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.003,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 60, y * 22, z * 60, 2),
      maxTriangles: 500,
    });

    // ------------------------------------------------------------- twine
    // Twine tie at the neck: three chunky wraps stacked as small tori around
    // the lip, plus a knot bead and a single visible bow loop on the +X side.
    // Wraps sit at the lip line, just below the cork flange, so the rope
    // appears to hold the cork in place.
    const twineY = LIP_Y + 0.005;
    const wraps = sdf.union(
      sdf.torus(LIP_R + 0.0025, 0.0028).at(0, twineY, 0),
      sdf.torus(LIP_R + 0.0025, 0.0028).at(0, twineY + 0.0045, 0),
      sdf.torus(LIP_R + 0.0025, 0.0028).at(0, twineY + 0.009, 0),
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
    k.body('twine', twine, {
      color: '#a08050',
      roughness: 0.9,
      metalness: 0,
      detail: 0.003,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 110, y * 25, z * 110, 2),
      maxTriangles: 700,
    });
  },
});
