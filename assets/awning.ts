import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — shop awning (architecture/building-parts/awning).
 *
 * Role: storefront dressing for the village map; reads at 128 px as a striped canopy.
 * Size: 2.0 m wide (x), sticks out 1.0 m from the wall at z = 0 toward +Z,
 *   back rail at y = 2.0, front edge at y = 1.45; poles stand on y = 0.
 * One idea: a cheerful red-and-cream striped cloth canopy with a scalloped front
 *   valance, held by two slanted wooden poles — the scallops are the read.
 * Shape language: square dominant (rails, sloped slab), round secondary (scallops,
 *   rounded pole feet, finials).
 * Palette: cloth coral red #d9534a dominant with cream #f2e6c8 stripes (the focal
 *   point), wood honey oak #b5814a / dark walnut #6b4226 frame, small iron #4a4f55
 *   collars as the accent.
 * Materials: cloth (roughness 0.88, metalness 0), wood (roughness 0.82, metalness 0),
 *   worn iron (roughness 0.5, metalness 0.7).
 * Detail: primary sloped cloth slab + 4 wood rails + 2 poles; secondary scallop row,
 *   pole feet, finials, iron collars; tertiary weave bump on cloth, grain bump on wood.
 * Rig/animation: none (static building part).
 */

const RED = rgb('#d9534a');
const RED_DARK = rgb('#a83a33');
const CREAM = rgb('#f2e6c8');
const CREAM_DARK = rgb('#cdbb97');
const OAK = rgb('#b5814a');
const OAK_LIGHT = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const IRON = '#4a4f55';

const W = 2.0; // cloth width
const BACK_Y = 2.0; // top back rail center height
const FRONT_Z = 1.0; // front edge
const FRONT_Y = 1.47; // front rail center height
const STRIPE = 0.4; // 5 stripes across 2.0 m

export default defineAsset({
  name: 'awning',
  description:
    'Red-and-cream striped shop awning with a scalloped front valance on a honey-oak frame and two slanted support poles.',
  detail: 0.009,
  reference: 'docs/item-mockups/awning-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- cloth slab
    // Sloped slab: profile in (slope, height), extruded across X, then rotated
    // so the slope runs from the wall (z = 0, high) to the front (z = 1.02, low).
    // rotateY(90) maps (x, y, 0) -> (0, y, -x), so build the slope toward -X.
    const slabProfile = profile.polygon(
      [
        [0.02, BACK_Y + 0.07],
        [-1.02, FRONT_Y + 0.06],
        [-1.02, FRONT_Y - 0.1],
        [0.02, BACK_Y - 0.09],
      ],
      { smooth: true, samples: 8 },
    );
    let cloth = sdf.extrude(slabProfile, W, 0.02).rotateY(90);

    // Scalloped valance: five rounded tabs hanging at the front edge, one per
    // stripe, squashed toward the wall so they read as hanging cloth, not balls.
    for (let i = 0; i < 5; i++) {
      const x = -0.8 + i * 0.4;
      cloth = cloth.smoothUnion(
        0.03,
        sdf
          .sphere(0.2)
          .scale([1, 1.12, 0.62])
          .at(x, FRONT_Y - 0.06, FRONT_Z - 0.02),
      );
    }

    const smoothStripe = (x: number) => {
      // Smooth red<->cream blend across each stripe boundary (no hard step,
      // so the texture bake stays clean on every face).
      const u = (x + W / 2) / (STRIPE * 2);
      const w = 0.5 + 0.5 * Math.cos(Math.PI * 2 * u);
      const s = Math.min(1, Math.max(0, (w - 0.42) / 0.16));
      return s; // 1 = red, 0 = cream
    };
    const clothPaint = (x: number, y: number, z: number) => {
      const isRed = smoothStripe(x) >= 0.5;
      let c = mixRgb(CREAM, RED, smoothStripe(x));
      // Shaded underside and darker shade toward the front droop.
      const shade = Math.min(1, Math.max(0, (1.52 - y) / 0.35));
      c = mixRgb(c, isRed ? RED_DARK : CREAM_DARK, 0.55 * shade);
      // Soft stripe-edge darkening and a touch of cloth variation.
      const f = ((x + W / 2) / STRIPE) % 1;
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 10);
      c = mixRgb(c, isRed ? RED_DARK : CREAM_DARK, 0.3 * edge);
      const wear = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
      c = mixRgb(c, isRed ? RED_DARK : CREAM_DARK, 0.08 * wear);
      return c;
    };
    k.body('cloth', cloth.paintFn(clothPaint), {
      color: '#d9534a',
      roughness: 0.88,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      textureDensity: 2,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 22, y * 22, z * 22, 2),
      maxTriangles: 1900,
    });

    // ------------------------------------------------------------- wood frame
    // Back rail against the wall, front rail under the valance, two side rails,
    // two slanted poles to the ground, round feet and front finials.
    const rails = [
      sdf.box([W + 0.06, 0.085, 0.085], 0.02).at(0, BACK_Y, 0.03), // wall rail
      sdf.box([W + 0.06, 0.075, 0.075], 0.018).at(0, FRONT_Y, FRONT_Z), // front rail
      // Side rails run along the slope on both edges.
      sdf.capsule([-0.985, BACK_Y - 0.02, 0.06], [-0.985, FRONT_Y, FRONT_Z - 0.02], 0.03),
      sdf.capsule([0.985, BACK_Y - 0.02, 0.06], [0.985, FRONT_Y, FRONT_Z - 0.02], 0.03),
    ];
    // Slanted poles: lean slightly outward toward the ground for a sturdy read.
    const poles = [
      sdf.capsule([-0.92, FRONT_Y - 0.02, FRONT_Z - 0.02], [-1.0, 0.05, FRONT_Z + 0.14], 0.038),
      sdf.capsule([0.92, FRONT_Y - 0.02, FRONT_Z - 0.02], [1.0, 0.05, FRONT_Z + 0.14], 0.038),
    ];
    const feetAndFinials = [
      sdf.sphere(0.055).scale([1, 0.55, 1]).at(-1.0, 0.03, FRONT_Z + 0.14),
      sdf.sphere(0.055).scale([1, 0.55, 1]).at(1.0, 0.03, FRONT_Z + 0.14),
      sdf.sphere(0.05).at(-1.05, FRONT_Y, FRONT_Z),
      sdf.sphere(0.05).at(1.05, FRONT_Y, FRONT_Z),
    ];
    const frame = sdf
      .smoothUnion(0.015, ...rails, ...poles, ...feetAndFinials)
      .intersect(sdf.halfSpace([0, -1, 0], 0.0));

    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 30, z * 8, 2);
      let c = mixRgb(OAK, OAK_LIGHT, 0.25 + 0.3 * grain);
      // Darker toward the ground and in grain streaks.
      c = mixRgb(c, WALNUT, 0.4 * Math.max(0, 1 - y / 0.5));
      c = mixRgb(c, WALNUT, 0.25 * Math.pow(0.5 + 0.5 * noise.fbm(x * 20, y * 6, z * 20, 2), 3));
      return c;
    };
    k.body('frame', frame.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 24, y * 8, z * 24, 2),
      maxTriangles: 1600,
    });

    // ------------------------------------------------------------- iron collars
    // Worn-iron collars hugging each pole mid-way down, tilted with the lean.
    const lean = (Math.atan2(0.16, FRONT_Y - 0.07) * 180) / Math.PI;
    const collars = sdf.union(
      sdf.torus(0.052, 0.014).rotateX(lean).at(-0.937, 1.15, FRONT_Z + 0.014),
      sdf.torus(0.052, 0.014).rotateX(lean).at(0.937, 1.15, FRONT_Z + 0.014),
    );
    k.body('collars', collars, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      maxTriangles: 400,
    });
  },
});
