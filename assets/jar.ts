import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — clay storage jar (props/containers/jar).
 *
 * Role: dungeon storage prop (Sunken Vault) that must read at 128 px as "a covered pot".
 * Size: 0.45 m tall, 0.25 m wide at the belly, stands on y = 0, faces +Z.
 * One idea: a sweet, heavy-bellied terracotta jar whose whole top is capped by a
 *   soft cream cloth dome, cinched by twine, with two small ear handles.
 * Shape language: round dominant (belly, cloth dome, handles), square secondary
 *   (flat foot, straight painted band give it a grounded read).
 * Palette: terracotta #b86a44 (dominant, mid), cream cloth #e6dcc8 (secondary, light),
 *   dark band #5e2e18 (dark), twine #b5986a, light band line #d9b46a (small accent).
 * Materials: clay (roughness 0.85), cloth (roughness 0.9), twine (roughness 0.8).
 * Detail: primary belly + neck + lip + cloth dome; secondary handles, twine, knot;
 *   tertiary clay speckle and painted band. Focal point: cloth dome against belly.
 * Rig/animation: none (static prop).
 */

const CLAY_MID = rgb('#b86a44');
const CLAY_LIGHT = rgb('#d08a5f');
const CLAY_DARK = rgb('#6e3418');
const BAND_DARK = rgb('#5e2e18');
const BAND_LINE = rgb('#d9b46a');

const CLAY_R = 0.132; // belly radius (0.264 m wide)

export default defineAsset({
  name: 'jar',
  description:
    'Clay storage jar 0.45 m tall with a round belly, narrow neck, wide lip, two small handles, and a cloth cover tied with twine.',
  detail: 0.009,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/jar-mock.jpg',

  build(k) {
    // ------------------------------------------------------------------ clay body
    // Revolved pot: flat foot, heavy belly, tucked neck, wide flared lip.
    const clayProfile = profile.polygon(
      [
        [0.05, 0.002],
        [0.088, 0.003],
        [0.1, 0.022],
        [0.115, 0.055],
        [0.127, 0.1],
        [CLAY_R, 0.15],
        [0.129, 0.195],
        [0.117, 0.238],
        [0.092, 0.268],
        [0.066, 0.285],
        [0.062, 0.295],
        [0.076, 0.303],
        [0.09, 0.311],
        [0.092, 0.322],
        [0.076, 0.33],
        [0.045, 0.328],
        [0, 0.326],
      ],
      { smooth: true, samples: 16 },
    );
    const clayBody = sdf
      .revolve(clayProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Two small ear handles on the shoulder, mirrored across X.
    const handle = sdf
      .torus(0.032, 0.011)
      .rotateX(90)
      .scale([1, 1.1, 0.85])
      .at(0.1, 0.232, 0)
      .mirror('x', 0.006);

    const clayPaint = (x: number, y: number, z: number) => {
      // Warm clay gradient: shaded foot, sun-lit shoulder.
      const t = Math.min(1, Math.max(0, y / 0.32));
      let c = mixRgb(CLAY_DARK, CLAY_MID, 0.35 + 0.65 * t);
      c = mixRgb(c, CLAY_LIGHT, 0.22 * Math.max(0, (t - 0.4) / 0.6));
      // Big soft patches + fine clay speckle.
      const patch = 0.5 + 0.5 * noise.fbm(x * 7, y * 7, z * 7, 3);
      c = mixRgb(c, CLAY_MID, 0.3 * patch);
      const speck = 0.5 + 0.5 * noise.fbm(x * 60, y * 60, z * 60, 2);
      c = mixRgb(c, CLAY_DARK, 0.18 * Math.max(0, speck - 0.55));
      return c;
    };

    const clay = clayBody
      .smoothUnion(0.004, handle)
      .paintFn(clayPaint)
      // Painted band around the belly, with a thin light line above it.
      .paintWhere(sdf.box([1, 0.036, 1]).at(0, 0.163, 0), BAND_DARK)
      .paintWhere(sdf.box([1, 0.007, 1]).at(0, 0.19, 0), BAND_LINE)
      .paintWhere(sdf.box([1, 0.007, 1]).at(0, 0.136, 0), BAND_LINE);

    k.body('clay', clay, {
      color: '#b86a44',
      roughness: 0.85,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 1500,
    });

    // ------------------------------------------------------------------ cloth cover
    // Soft dome cap covering the mouth, gathered at the neck.
    const clothProfile = profile.polygon(
      [
        [0, 0.31],
        [0.07, 0.312],
        [0.095, 0.32],
        [0.109, 0.332],
        [0.115, 0.35],
        [0.114, 0.37],
        [0.105, 0.39],
        [0.088, 0.408],
        [0.062, 0.423],
        [0.032, 0.434],
        [0, 0.44],
      ],
      { smooth: true, samples: 16 },
    );
    const clothShape = sdf
      .revolve(clothProfile)
      .displace(0.005, (x, y, z) => noise.fbm(x * 22, y * 22, z * 22, 2));

    const clothPaint = (x: number, y: number, z: number) => {
      const t = Math.min(1, Math.max(0, (y - 0.31) / 0.13));
      let c = mixRgb(rgb('#c2b494'), rgb('#ece2cc'), 0.25 + 0.75 * t);
      const fold = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
      c = mixRgb(c, rgb('#a89878'), 0.3 * fold);
      return c;
    };

    k.body('cloth', clothShape.paintFn(clothPaint), {
      color: '#e6dcc8',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 45, y * 45, z * 45, 2),
      maxTriangles: 700,
    });

    // ------------------------------------------------------------------ twine
    // Cord cinching the cloth just above the lip, with a knot and two short tails.
    const cord = sdf.torus(0.104, 0.0085).at(0, 0.327, 0);
    const knot = sdf.sphere(0.015).at(0, 0.328, 0.104);
    const tail = sdf.chain(
      [
        [0.014, 0.318, 0.106, 0.0065],
        [0.03, 0.29, 0.108, 0.0055],
        [0.036, 0.263, 0.1, 0.0045],
      ],
      0.006,
    );
    const tail2 = sdf.chain(
      [
        [-0.014, 0.319, 0.106, 0.0065],
        [-0.031, 0.294, 0.106, 0.0055],
        [-0.04, 0.271, 0.096, 0.0045],
      ],
      0.006,
    );
    k.body('twine', sdf.union(cord, knot, tail, tail2), {
      color: '#b5986a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 350,
    });
  },
});
