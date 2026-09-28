import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — arrow (equipment/ranged-weapons/arrow).
 *
 * Role: a single arrow pickup / ammo item for the chibi heroes; it must read at
 *   128 px as a chunky steel point with a broad fan of fletching, not a needle.
 * Size: 0.7 m long, lying flat on y = 0 along X, point toward +X, centred on the
 *   Y axis. The shaft axis sits at y = 0.014 so the broadhead and nock rest low.
 * One idea: the fletching is the hero form — three broad, scalloped vanes that
 *   are a quarter of the length and far wider than the shaft, with white rear
 *   thirds, so the arrow reads as an icon at a glance.
 * Shape language: triangular dominant (point, barbs, feather fan) with soft
 *   rounded wood secondary.
 * Palette: honey oak #b5814a / warm brown #8a5a35 shaft, pale cut wood #c9a06a
 *   nock; iron #4a4f55 head with a steel edge #c8ccd2 highlight; fletching red
 *   #c8403a with white #f2eadb rear thirds; dark leather #5c3a22 binding;
 *   cream collar #efe4cc; gold #d4a93a ring.
 * Value plan: dark iron base and dark leather at the front, mid warm wood in the
 *   middle, light steel tip, cream collar, and white fletching backs.
 * Materials: wood (roughness 0.8), iron (0.5 / metalness 0.7), feather cloth
 *   (0.8), leather (0.65), gold (0.3 / metalness 1).
 * Rig/animation: none (static ammunition item).
 */

const WOOD = rgb('#b5814a');
const WOOD_BROWN = rgb('#8a5a35');
const WOOD_PALE = rgb('#c9a06a');
const IRON_DARK = rgb('#3f444a');
const STEEL = rgb('#c8ccd2');
const RED = '#c8403a';
const WHITE = '#f2eadb';
const LEATHER = '#5c3a22';
const GOLD = '#d4a93a';

const Y = 0.014; // shaft axis height
const R_SHAFT = 0.008;

// ---------------------------------------------------------------- fletching
// A broad leaf with a scalloped outer edge (three lobes), drawn in XY: x runs
// along the shaft, y is the distance out from the shaft axis.
const vaneProfile = profile.polygon(
  [
    [0.0, 0.0],
    [0.0, 0.014],
    [0.021, 0.037],
    [0.047, 0.058],
    [0.068, 0.035],
    [0.096, 0.058],
    [0.121, 0.035],
    [0.147, 0.053],
    [0.166, 0.03],
    [0.175, 0.0],
  ],
  { smooth: true, samples: 5 },
);

// The white rear third of the fletching: a paint box across all vanes at the
// nock end, so red stays dominant toward the head.
const whiteZone = sdf.box([0.08, 0.3, 0.3]).at(-0.32, Y, 0);

const FLETCH_X = -0.34;
const VANE_ANGLES = [-60, 0, 60];

export default defineAsset({
  name: 'arrow',
  description:
    'A single 0.7 m arrow lying flat: a wooden shaft with a pale nock, a chunky steel broadhead with barbs, a dark leather binding with a cream collar and a gold ring, and three broad red-and-white feathers.',
  detail: 0.003,
  reference: 'docs/item-mockups/arrow-mock.jpg',
  texture: { size: 512 },

  build(k) {
    // ------------------------------------------------------------------ shaft
    const shaft = sdf
      .smoothUnion(
        0.004,
        sdf.capsule([-0.34, Y, 0], [0.25, Y, 0], R_SHAFT),
        // A slightly flared nock at the far end.
        sdf.cylinder(0.011, 0.03, 0.004).rotateZ(90).at(-0.334, Y, 0),
      )
      .paintFn((x, y, z) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 120, z * 120, 3);
        let c = mixRgb(WOOD, WOOD_BROWN, 0.16 + 0.45 * grain);
        // Pale cut wood at the nock end.
        c = mixRgb(c, WOOD_PALE, Math.max(0, Math.min(1, (-0.3 - x) / 0.035)) * 0.8);
        return c;
      });
    k.body('shaft', shaft, {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.005,
      maxError: 0.0015,
      maxTriangles: 250,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 8, y * 220, z * 220, 2),
    });

    // ------------------------------------------------------------------ broadhead
    // A chunky socket that flares into a wide blade, tapers to a fine point,
    // with two rear-pointing barbs in the blade plane. Flattened in Y so the
    // head lies flat on the ground while it stays broad from above.
    const headCore = sdf.smoothUnion(
      0.006,
      sdf.cone([0.195, 0, 0], [0.248, 0, 0], 0.016, 0.048),
      sdf.cone([0.248, 0, 0], [0.351, 0, 0], 0.048, 0.002),
    );
    const barb = sdf
      .cone([0.295, 0, 0.03], [0.218, 0, 0.052], 0.016, 0.003)
      .mirror('z', 0);
    const head = sdf
      .union(headCore, barb)
      .scale([1, 0.46, 1])
      .at(0, Y, 0)
      .paintFn((x, y, z) => {
        const t = Math.max(0, Math.min(1, (x - 0.212) / 0.13));
        let c = mixRgb(IRON_DARK, STEEL, Math.pow(t, 1.1));
        c = mixRgb(c, rgb('#4a4f55'), 0.2 * (0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2)));
        return c;
      });
    k.body('head', head, {
      color: '#7d838c',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      maxError: 0.001,
      maxTriangles: 400,
    });

    // ------------------------------------------------------------------ collar, binding, ring
    // Dark leather wrap where the head meets the shaft, a cream collar ring at
    // its front edge, and a thin gold ring just behind it (the metal accent).
    const binding = sdf
      .cylinder(0.018, 0.032, 0.004)
      .rotateZ(90)
      .at(0.18, Y, 0)
      .paintFn((x, y, z) =>
        mixRgb(
          rgb(LEATHER),
          rgb('#3a2414'),
          0.3 + 0.3 * (0.5 + 0.5 * noise.fbm(x * 60, y * 60, z * 60, 2)),
        ),
      );
    k.body('binding', binding, {
      color: LEATHER,
      roughness: 0.65,
      metalness: 0,
      detail: 0.004,
      maxError: 0.002,
      maxTriangles: 150,
    });

    const collar = sdf.torus(0.019, 0.006).scale([1, 0.5, 1]).at(0.193, Y, 0);
    k.body('collar', collar, {
      color: '#efe4cc',
      roughness: 0.7,
      metalness: 0,
      detail: 0.004,
      maxError: 0.002,
      maxTriangles: 130,
    });

    const ring = sdf.torus(0.0125, 0.003).rotateY(90).at(0.15, Y, 0);
    k.body('ring', ring, {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxError: 0.002,
      maxTriangles: 120,
    });

    // ------------------------------------------------------------------ feathers
    const vane = (angle: number) =>
      sdf.extrude(vaneProfile, 0.02, 0.006).rotateX(angle).at(FLETCH_X, Y, 0);
    const feathers = sdf
      .union(...VANE_ANGLES.map(vane))
      .paintWhere(whiteZone, WHITE, 0.002);
    k.body('feathers', feathers, {
      color: RED,
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      maxError: 0.001,
      paintWeight: 1.5,
      maxTriangles: 850,
      bump: (x, y, z) => 0.0004 * Math.abs(noise.fbm(x * 40, y * 260, z * 260, 2)),
    });
  },
});
