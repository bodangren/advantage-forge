import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — wooden tavern mug (props/food/mug).
 *
 * Role: tableware prop in the tavern set, seen mostly at 128 px on tables and
 *   in a hero hand; must read as one stout wooden tankard with foam.
 * Size: 0.115 m tall with the foam, 0.091 m body diameter, stands on y = 0,
 *   faces +Z; chunky handle on +X (the drinker's left when raised).
 * One idea: a stout honey-oak tankard — thick staves pinched by one dark iron
 *   strap, crowned by a generous cream foam head that laps over the rim.
 * Shape language: round dominant (revolved body, O-handle, domed foam),
 *   square secondary (the iron strap band gives a sturdy midline).
 * Palette: honey oak #b5814a dominant, warm brown #8a5a35 stave shadows,
 *   light oak #c9a06a highlights; iron #4a4f55 band; foam #f5ead0 with pale
 *   bubbles; pale-ale #e2b45a meniscus where foam meets rim.
 * Materials: wood (roughness 0.8, metalness 0), worn iron (roughness 0.5,
 *   metalness 0.7), foam (roughness 0.9, metalness 0).
 * Detail: primary staved body + handle + foam dome; secondary iron strap with
 *   rivets; tertiary stave seams + grain in `bump`. Focal point: foam head.
 * Rig/animation: none (static tableware).
 */

const HONEY = rgb('#b5814a');
const SHADOW = rgb('#8a5a35');
const LIGHT = rgb('#c9a06a');
const IRON = '#4a4f55';
const FOAM = rgb('#f5ead0');
const FOAM_DARK = rgb('#e6d6b4');
const FOAM_LIGHT = rgb('#fff7e6');
const ALE = rgb('#e2b45a');

const STAVES = 8;
const BAND_Y = 0.052;

export default defineAsset({
  name: 'mug',
  description: 'Stout honey-oak tavern mug with staves, one dark iron strap, a chunky handle, and a cream ale-foam head with a drip.',
  detail: 0.006,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- wood body
    // Revolved stout cup: flat foot, gently swelling staves, rolled rim,
    // top closed under the foam. Cut at y = 0 for a perfect ground line.
    const bodyProfile = profile.polygon(
      [
        [0, 0.0035],
        [0.02, 0.0015],
        [0.032, 0.003],
        [0.038, 0.01],
        [0.0405, 0.028],
        [0.042, 0.052],
        [0.0435, 0.078],
        [0.0452, 0.09],
        [0.0455, 0.096],
        [0.044, 0.1],
        [0.038, 0.099],
        [0.025, 0.0965],
        [0, 0.0955],
      ],
      { smooth: true, samples: 12 },
    );
    const bodyShape = sdf
      .revolve(bodyProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Chunky rounded handle on +X: a smooth chain D-loop whose ends sink into
    // the wall, leaving one clear finger hole.
    const handle = sdf.chain(
      [
        [0.042, 0.072, 0, 0.011],
        [0.072, 0.072, 0, 0.0095],
        [0.082, 0.052, 0, 0.01],
        [0.072, 0.032, 0, 0.0095],
        [0.042, 0.032, 0, 0.011],
      ],
      0.009,
    );
    const woodShape = bodyShape.smoothUnion(0.006, handle);

    // Stave paint on the cup, plain grain on the handle, soft blend between.
    const woodPaint = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const u = ((a + Math.PI) / (Math.PI * 2)) * STAVES;
      const idx = Math.floor(u);
      const f = u - idx;
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
      const tint = noise.random(idx, 3, 5);
      const patch = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 12, z * 30, 2);
      let c = mixRgb(HONEY, SHADOW, 0.2 + 0.3 * tint);
      c = mixRgb(c, SHADOW, 0.32 * patch);
      c = mixRgb(c, LIGHT, 0.04 * grain);
      const t = Math.min(1, Math.max(0, y / 0.1));
      c = mixRgb(c, SHADOW, 0.32 * (1 - t) * (1 - t)); // shaded foot
      c = mixRgb(c, LIGHT, 0.06 * Math.max(0, (t - 0.6) / 0.4)); // lit shoulder
      c = mixRgb(c, SHADOW, 0.5 * edge); // seams
      const hg = 0.5 + 0.5 * noise.fbm(x * 35, y * 25, z * 35, 2);
      const hc = mixRgb(mixRgb(HONEY, LIGHT, 0.3 + 0.2 * hg), SHADOW, 0.12 * patch);
      const hr = Math.hypot(x, z);
      const w = Math.min(1, Math.max(0, (hr - 0.045) / 0.006));
      return mixRgb(c, hc, w);
    };
    const woodBump = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const u = ((a + Math.PI) / (Math.PI * 2)) * STAVES;
      const f = u - Math.floor(u);
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
      const grain = noise.fbm(x * 40, y * 10, z * 40, 2);
      const hr = Math.hypot(x, z);
      const w = Math.min(1, Math.max(0, (hr - 0.045) / 0.006));
      return (1 - w) * (-0.0012 * edge + 0.0012 * grain) + w * 0.001 * grain;
    };
    k.body('wood', woodShape.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.0075,
      paintWeight: 2,
      bump: woodBump,
      maxTriangles: 1100,
    });

    // ------------------------------------------------------------- iron band
    // Thin shell of the cup, cut to one strap around the middle + rivets.
    const shell = bodyShape.round(0.008).subtract(bodyShape.round(-0.0015));
    const band = shell.intersect(sdf.box([1.2, 0.02, 1.2], 0.006).at(0, BAND_Y, 0));
    const rivets: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      rivets.push(sdf.sphere(0.0055).at(Math.cos(a) * 0.0495, BAND_Y, Math.sin(a) * 0.0495));
    }
    k.body('band', sdf.union(band, ...rivets), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      maxTriangles: 350,
    });

    // ------------------------------------------------------------- foam head
    // Cream dome lapping over the rim, bumpy top, one drip running down the
    // front (+Z). A pale-ale meniscus tints the foam where it meets the wood.
    const foamBase = sdf
      .ellipsoid([0.046, 0.014, 0.046])
      .at(0, 0.105, 0)
      .smoothUnion(0.008, sdf.sphere(0.011).at(0.018, 0.113, 0.008))
      .smoothUnion(0.008, sdf.sphere(0.009).at(-0.02, 0.111, -0.01))
      .smoothUnion(0.007, sdf.sphere(0.008).at(-0.004, 0.115, 0.02))
      .smoothUnion(
        0.006,
        sdf.capsule([0.012, 0.104, 0.042], [0.013, 0.08, 0.0435], 0.0055),
      )
      .smoothUnion(0.005, sdf.sphere(0.006).at(0.013, 0.078, 0.0435));
    const foamPaint = (x: number, y: number, z: number) => {
      const bubble = 0.5 + 0.5 * noise.fbm(x * 65, y * 65, z * 65, 2);
      const shine = 0.5 + 0.5 * noise.fbm(x * 95 + 9, y * 95, z * 95, 2);
      let c = mixRgb(FOAM, FOAM_DARK, 0.55 * Math.pow(bubble, 3));
      c = mixRgb(c, FOAM_LIGHT, 0.5 * Math.pow(shine, 4));
      // Ale meniscus where the foam meets the rim.
      const men = Math.min(1, Math.max(0, (0.101 - y) / 0.008));
      c = mixRgb(c, ALE, 0.55 * men * men);
      return c;
    };
    k.body('foam', foamBase.paintFn(foamPaint), {
      color: '#f5ead0',
      roughness: 0.9,
      metalness: 0,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 450,
    });
  },
});
