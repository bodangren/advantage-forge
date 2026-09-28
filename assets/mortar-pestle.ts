import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — stone mortar and pestle (props/craft-and-trade/mortar-pestle).
 *
 * Role: small alchemist/herbalist prop on a market or workshop table; must read
 *   at 128 px as "bowl + club + green stuff".
 * Size: mortar 0.2 m wide, 0.15 m tall, on a flat stone slab; total height
 *   ~0.31 m with the leaning pestle. Stands on y = 0, faces +Z.
 * One idea: a chunky clay-and-stone mortar with a thick rounded rim, a wooden
 *   club pestle leaning out of it, and fresh green herbs heaped inside.
 * Shape language: round dominant (rim ring, bowl, knobbed pestle, herb blobs),
 *   square secondary (flat slab base grounds it).
 * Palette: sage gray stone rim #9aa39a (light), warm clay body #b06a3c (mid,
 *   dominant), dark gray foot #5b5d63 (dark); honey oak pestle #b5814a with
 *   pale knob #c9a06a; herb green #4f8a3a with light tips #9cc45a (accent).
 * Materials: stone (roughness 0.92, metalness 0), wood (0.8, 0), leaves (0.7, 0).
 * Detail: primary mortar + rim + pestle; secondary herbs, slab, loose leaves,
 *   rock; tertiary stone speckle in bump only. Focal point: herb heap vs clay bowl.
 * Rig/animation: none (static prop).
 */

const STONE_LIGHT = rgb('#8f9a8e');
const STONE_MID = rgb('#8d8a82');
const STONE_DARK = rgb('#5b5d63');
const CLAY = rgb('#b06a3c');
const CLAY_DARK = rgb('#8a4f2c');
const OAK = rgb('#b5814a');
const OAK_DARK = rgb('#8a5a35');
const OAK_PALE = rgb('#c9a06a');
const LEAF = rgb('#4f8a3a');
const LEAF_LIGHT = rgb('#9cc45a');

const SLAB_H = 0.035;
const MY = SLAB_H; // mortar base height

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'mortar-pestle',
  description:
    'Chunky clay-and-stone mortar with a thick rim, a leaning honey-oak pestle, and fresh green herbs inside, on a flat stone slab.',
  detail: 0.007,
  reference: 'docs/item-mockups/mortar-pestle-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- slab + rock
    // Flat rounded slab grounds the prop; a small rock chunk breaks the outline.
    const slab = sdf.box([0.3, SLAB_H, 0.26], 0.016).at(0, SLAB_H / 2, 0);
    const rock = sdf
      .box([0.1, 0.06, 0.075], 0.02)
      .rotateY(24)
      .at(0.17, 0.032, 0.1)
      .displace(0.003, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2));
    const baseStone = sdf.union(slab, rock);
    k.body(
      'slab',
      baseStone.paintFn((x, y, z) => {
        let c = mixRgb(STONE_MID, STONE_LIGHT, 0.25 + 0.25 * noise.fbm(x * 8, y * 8, z * 8, 2));
        c = mixRgb(c, STONE_DARK, 0.4 * (1 - smooth(0.015, 0.045, y)));
        return c;
      }),
      {
        color: '#8d8a82',
        roughness: 0.92,
        metalness: 0,
        detail: 0.009,
        maxTriangles: 350,
        bump: (x, y, z) => 0.0012 * noise.fbm(x * 34, y * 34, z * 34, 2),
      },
    );

    // ------------------------------------------------------------------ mortar
    // Outer revolve: tucked foot, gently bulged clay body, thick rounded rim.
    const outerProfile = profile.polygon(
      [
        [0.05, 0.0],
        [0.068, 0.004],
        [0.086, 0.024],
        [0.097, 0.055],
        [0.1, 0.095],
        [0.108, 0.116],
        [0.106, 0.135],
        [0.096, 0.148],
        [0.088, 0.15],
        [0, 0.151],
      ],
      { smooth: true, samples: 12 },
    );
    // Inner cutter: bowl floor at 0.055, opening radius 0.084.
    const innerProfile = profile.polygon(
      [
        [0, 0.152],
        [0.084, 0.148],
        [0.086, 0.1],
        [0.074, 0.064],
        [0, 0.056],
      ],
      { smooth: true, samples: 12 },
    );
    const mortarShape = sdf
      .revolve(outerProfile)
      .subtract(sdf.revolve(innerProfile))
      .at(0, MY, 0);

    k.body(
      'mortar',
      mortarShape.paintFn((x, y, z) => {
        // Value plan: dark foot, warm clay body, light sage rim band.
        let c = CLAY;
        c = mixRgb(c, CLAY_DARK, 0.35 * noise.fbm(x * 7, y * 7, z * 7, 2));
        c = mixRgb(c, STONE_LIGHT, 0.92 * smooth(0.108, 0.128, y));
        c = mixRgb(c, STONE_DARK, 0.78 * (1 - smooth(0.02, 0.05, y)));
        // Fine stone speckle over everything.
        const speck = 0.5 + 0.5 * noise.fbm(x * 46, y * 46, z * 46, 2);
        c = mixRgb(c, STONE_LIGHT, 0.1 * speck);
        return c;
      }),
      {
        color: '#b06a3c',
        roughness: 0.9,
        metalness: 0,
        detail: 0.006,
        paintWeight: 2,
        maxTriangles: 700,
        bump: (x, y, z) =>
          0.0014 * noise.fbm(x * 40, y * 40, z * 40, 3) -
          0.0008 * Math.max(0, noise.fbm(x * 60, y * 60, z * 60, 2)),
      },
    );

    // ----------------------------------------------------------------- pestle
    // Club-shaped wooden pestle built along +Y, then leaned toward +X / +Z so it
    // rises out of the bowl: grinding head in the herbs, knobbed grip on top.
    const club = sdf.chain(
      [
        [0, 0.012, 0, 0.03],
        [0, 0.05, 0, 0.025],
        [0, 0.13, 0, 0.02],
        [0, 0.165, 0, 0.024],
        [0, 0.2, 0, 0.031],
      ],
      0.012,
    );
    const knob = sdf.sphere(0.033).at(0, 0.215, 0);
    const pestleShape = sdf
      .smoothUnion(0.014, club, knob)
      .rotateZ(-24)
      .rotateX(14)
      .at(-0.005, 0.062 + MY, 0.0);

    k.body(
      'pestle',
      pestleShape.paintFn((x, y, z, base) => {
        // Dark worn grinding end, pale handled knob, honey oak between.
        let c = base;
        c = mixRgb(c, OAK_DARK, 0.65 * (1 - smooth(0.06, 0.11, y)));
        c = mixRgb(c, OAK_PALE, 0.55 * smooth(0.24, 0.3, y));
        c = mixRgb(c, OAK_PALE, 0.14 * (0.5 + 0.5 * noise.fbm(x * 24, y * 6, z * 24, 2)));
        return c;
      }),
      {
        color: '#b5814a',
        roughness: 0.8,
        metalness: 0,
        detail: 0.005,
        maxTriangles: 520,
        bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 8, z * 30, 2),
      },
    );

    // ------------------------------------------------------------------ herbs
    // Heap of small leaf blobs inside the bowl, lighter on top; a few loose
    // leaves spilled on the slab tell a small story.
    const leafAt = (x: number, y: number, z: number, rx: number, ry: number, s = 1) =>
      sdf
        .ellipsoid([0.024 * s, 0.011 * s, 0.017 * s])
        .rotateX(rx)
        .rotateY(ry)
        .at(x, y, z);

    const floorY = 0.056 + MY;
    const herbs = sdf.union(
      // Heap inside the bowl, mounded well above the rim so it reads from every view.
      leafAt(0.032, floorY + 0.03, 0.012, 10, 30, 1.4),
      leafAt(-0.026, floorY + 0.038, 0.032, -14, 110, 1.3),
      leafAt(0.002, floorY + 0.045, -0.034, 16, 200, 1.35),
      leafAt(0.042, floorY + 0.06, -0.012, -20, 300, 1.2),
      leafAt(-0.032, floorY + 0.066, -0.024, 22, 250, 1.1),
      leafAt(0.012, floorY + 0.082, 0.022, -12, 80, 1.1),
      // A couple of leaves resting on the rim, visible from the front.
      leafAt(0.088, MY + 0.152, 0.035, 24, 60, 1.0),
      leafAt(-0.082, MY + 0.152, 0.025, -20, 140, 0.9),
      // Spill of leaves on the ground in front of the slab.
      leafAt(0.1, 0.009, 0.155, 0, 40, 1.4),
      leafAt(0.15, 0.008, 0.125, 0, 150, 1.3),
      leafAt(0.065, 0.007, 0.19, 0, 260, 1.2),
      leafAt(0.125, 0.013, 0.175, 0, 320, 1.2),
    );

    k.body(
      'herbs',
      herbs.paintFn((x, y, z) => {
        let c = LEAF;
        c = mixRgb(c, LEAF_LIGHT, 0.55 * smooth(0.1, 0.16, y) + 0.2 * noise.fbm(x * 30, y * 30, z * 30, 2));
        c = mixRgb(c, rgb('#2f5a2a'), 0.35 * (1 - smooth(0.05, 0.1, y)));
        return c;
      }),
      {
        color: '#4f8a3a',
        roughness: 0.7,
        metalness: 0,
        detail: 0.005,
        maxTriangles: 360,
      },
    );
  },
});
