import { defineAsset, sdf, profile, noise, rgb, mixRgb } from '../src/index.js';

// Design note:
// - Role: wall light prop for the dungeon kit. The warm focal point of a wall run. Reads at 128 px.
// - Size: stone stub 0.4 x 1.2 x 0.19 m, stands on y = 0, faces +Z. Flame tip at y = 1.07.
// - The one idea: one hot teardrop flame cradled in dark iron, glowing on cool slate stone.
// - Shape language: chunky rounded stone blocks (square dominant), a pointed iron plate (triangle
//   accent) and a wide ring rim that break the silhouette.
// - Palette: slate #2a3547 / #4a5d75 / #7a8ba0, iron #3d4047, wood #8a5a35, moss #3fae9a,
//   flame accent #ff9a3c at emissive intensity 2. Stone mid-dark, iron darkest, flame lightest.
// - Materials: stone (0.92 / 0), iron (0.5 / 0.75), wood (0.85 / 0), flame (emissive).
// - Details: stepped stone top, brick seams + moss paint, shield plate with rivets, arm + brace,
//   flared cup with ring rim, wooden handle, a tight warm glow pooled on the stub around the flame.
// - Rig/animation: none.

const SLATE_DARK = '#2a3547';
const SLATE_MID = '#4a5d75';
const SLATE_PALE = '#7a8ba0';
const MOSS = '#3fae9a';
const IRON = '#3d4047';
const WOOD = '#8a5a35';
const FLAME = '#ff9a3c';

// ---------------------------------------------------------------- helpers
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------- torch axis
// The torch leans away from the wall; every torch part shares this tilted axis.
const TILT = 11.2; // degrees about X
const AXIS_Y0 = 0.71;
const AXIS_Z0 = 0.2426;
const AXIS_SLOPE = 0.19737; // tan(TILT)
const axisZ = (y: number) => AXIS_Z0 + (y - AXIS_Y0) * AXIS_SLOPE;

const FLAME_Y = 0.9;
const FLAME_Z = axisZ(FLAME_Y);

// The light itself. `glow` is the falloff of the warm pool it paints on nearby surfaces.
// Warm light scales the stone colour instead of adding to it, so mortar lines stay dark
// inside the pool and the block pattern keeps its contrast next to the flame.
const LIGHT = [0, FLAME_Y + 0.03, FLAME_Z] as const;
const glow = (x: number, y: number, z: number) => {
  const d = Math.hypot(x - LIGHT[0], y - LIGHT[1], z - LIGHT[2]);
  const t = Math.max(0, 1 - (d - 0.13) / 0.3);
  return t * t;
};
const warmLight = (
  c: readonly [number, number, number],
  g: number,
  k: readonly [number, number, number],
) => [c[0] * (1 + k[0] * g), c[1] * (1 + k[1] * g), c[2] * (1 + k[2] * g)] as const;

// ---------------------------------------------------------------- brick pattern
const ROW = 0.15; // course height
const COL = 0.17; // block width
const BAND_Y = 0.055; // pattern offset so y = 0 and y = 1.2 fall mid-block

function brick(u: number, v: number) {
  const row = Math.floor(v / ROW);
  const odd = ((row % 2) + 2) % 2;
  const uu = u + odd * 0.5 * COL;
  const col = Math.floor(uu / COL);
  const mu = uu - col * COL;
  const mv = v - row * ROW;
  const dCol = Math.min(mu, COL - mu);
  const dRow = Math.min(mv, ROW - mv);
  return { d: Math.min(dCol, dRow), row, col, t: mv / ROW };
}

// Pick the horizontal coordinate that varies on the face we are standing on.
const faceU = (x: number, z: number) => (Math.abs(z) / 0.095 > Math.abs(x) / 0.2 ? x : z);

// ---------------------------------------------------------------- wall stub
// Three columns of different height give the stub a broken, stepped top silhouette.
const stub = sdf.smoothUnion(
  0.014,
  sdf.box([0.2, 1.2, 0.15], 0.024).at(-0.1, 0.604, 0.005), // tall left column
  sdf.box([0.135, 1.15, 0.16], 0.024).at(0.0575, 0.579, 0), // middle column
  sdf.box([0.09, 1.09, 0.17], 0.024).at(0.155, 0.549, -0.005), // low right column
  sdf.box([0.41, 0.16, 0.195], 0.024).at(0, 0.084, -0.0025), // proud footing course
);

export default defineAsset({
  name: 'torch-sconce',
  description: 'Wall-mounted iron torch sconce on a chunky dungeon stone stub.',
  reference: 'docs/dungeon-mockups/dungeon-quest_002.jpg',
  detail: 0.03,

  build(k) {
    // ---------------------------------------------------------------- stone
    const stone = stub.paintFn((x, y, z) => {
      const b = brick(faceU(x, z), y + BAND_Y);
      const tint = noise.random(b.col, b.row, 3);
      let c = mixRgb(rgb(SLATE_DARK), rgb(SLATE_MID), 0.9 * tint);
      c = mixRgb(c, rgb('#1a2230'), 0.45 * (1 - b.t)); // shadowed block bottoms
      c = mixRgb(c, rgb(SLATE_PALE), 0.32 * b.t); // worn pale block tops
      c = mixRgb(c, rgb('#0e141f'), 0.92 * (1 - sstep(0.005, 0.015, b.d))); // mortar
      const moss =
        sstep(0.25, 0.8, noise.fbm(x * 7, y * 6, z * 7, 2)) * (1 - sstep(0.0, 0.7, y));
      c = mixRgb(c, rgb(MOSS), 0.55 * moss); // damp moss at the base
      return warmLight(c, glow(x, y, z) * 0.65, [9, 3, 0.35]); // soft torch glow
    });
    k.body('stone', stone, {
      color: SLATE_MID,
      roughness: 0.92,
      metalness: 0,
      detail: 0.032,
      paintWeight: 2,
      bump: (x, y, z) => {
        const b = brick(faceU(x, z), y + BAND_Y);
        const groove = 1 - sstep(0.004, 0.016, b.d);
        return -0.009 * groove + noise.fbm(x * 26, y * 26, z * 26, 2) * 0.0016;
      },
    });

    // ---------------------------------------------------------------- iron
    const plate = sdf.extrude(
      profile.polygon(
        [
          [0, 0.118],
          [0.061, 0.09],
          [0.068, -0.05],
          [0, -0.135],
          [-0.068, -0.05],
          [-0.061, 0.09],
        ],
        { smooth: true, samples: 4 },
      ),
      0.04,
      0.01,
    );
    // Flared cup that the torch handle stands in.
    const cup = profile.polygon(
      [
        [0, 0],
        [0.046, 0],
        [0.05, 0.02],
        [0.056, 0.05],
        [0.061, 0.078],
        [0.064, 0.1],
        [0, 0.1],
      ],
      { smooth: true, samples: 4 },
    );

    const iron = sdf
      .smoothUnion(
        0.012,
        plate.at(0, 0.72, 0.085),
        sdf.cone([0, 0.635, 0.1], [0, 0.675, 0.21], 0.028, 0.023), // main arm
        sdf.cone([0, 0.815, 0.1], [0, 0.68, 0.195], 0.018, 0.016), // upper brace
        sdf.sphere(0.018).at(-0.04, 0.78, 0.1),
        sdf.sphere(0.018).at(0.04, 0.78, 0.1),
        sdf.sphere(0.018).at(0, 0.635, 0.1),
      )
      .union(sdf.revolve(cup).rotateX(TILT).at(0, 0.64, axisZ(0.64)))
      .union(sdf.torus(0.07, 0.019).rotateX(TILT).at(0, 0.738, axisZ(0.738))) // ring rim
      .paintFn((x, y, z, base) => warmLight(base, glow(x, y, z) * 0.4, [5, 1.8, 0.4]));
    k.body('iron', iron, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.75,
      detail: 0.016,
      paintWeight: 2,
    });

    // ---------------------------------------------------------------- wooden handle
    const handle = sdf
      .cone([0, 0.675, axisZ(0.675)], [0, 0.91, axisZ(0.91)], 0.026, 0.036)
      .paintFn((x, y, z) =>
        mixRgb(rgb('#6b4426'), rgb('#a06a3e'), noise.fbm(x * 26, y * 6, z * 26, 2) * 0.5 + 0.5),
      );
    k.body('handle', handle, {
      color: WOOD,
      roughness: 0.85,
      metalness: 0,
      detail: 0.018,
      bump: (x, y, z) => noise.fbm(x * 46, y * 9, z * 46, 2) * 0.0014,
    });

    // ---------------------------------------------------------------- flame
    const flameShape = sdf.revolve(
      profile.polygon(
        [
          [0, 0.185],
          [0.011, 0.145],
          [0.026, 0.105],
          [0.038, 0.068],
          [0.046, 0.032],
          [0.044, -0.002],
          [0.032, -0.026],
          [0, -0.036],
        ],
        { smooth: true, samples: 4 },
      ),
    )
      .rotateX(TILT)
      .at(0, FLAME_Y, FLAME_Z)
      .paintFn((_x, y) => {
        const t = clamp01((y - 0.865) / 0.21);
        return mixRgb(rgb('#d86a1e'), rgb('#93340a'), Math.pow(t, 0.9));
      });
    k.body('flame', flameShape, {
      color: '#4a1e08',
      roughness: 0.95,
      metalness: 0,
      emissive: FLAME,
      emissiveIntensity: 2,
      detail: 0.012,
    });
  },
});
