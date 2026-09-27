import { defineAsset, sdf, profile, noise, rgb, mixRgb } from '../src/index.js';

// Design note:
// - Role: ritual altar landmark for the dungeon kit; the sacred focal prop of a room. Reads at 128 px.
// - Size: 1.2 x 0.8 m footprint, stone 0.9 m tall on y = 0, faces +Z; flame tips reach ~1.05 m.
// - The one idea: a heavy stepped stone block with a glowing carved rune band cut into its front edge.
// - Shape language: square dominant (sturdy, sacred) with soft bevels; two candle flames break the
//   flat top silhouette and the recessed panel breaks the front face.
// - Palette: slate #2a3547 / #4a5d75 / #7a8ba0, rune + moss teal #3fae9a, warm flame #ff9a3c,
//   candle wood #8a5a35. Stone sits mid-dark; flames are the lightest, warmest points.
// - Materials: stone (0.92 / 0), rune inlay (emissive teal 0.4), wax/wood candle (0.7 / 0),
//   flame (emissive #ff9a3c at 2).
// - Details: four stepped tiers with brick seams and pale worn top edges, moss at the base, a
//   recessed front panel with five glyphs, two candles with wax puddles, warm glow on nearby stone.
// - Rig/animation: none.

const SLATE_DARK = '#2a3547';
const SLATE_MID = '#4a5d75';
const SLATE_PALE = '#7a8ba0';
const MOSS = '#3fae9a';
const RUNE = '#3fae9a';
const FLAME = '#ff9a3c';
const WOOD = '#8a5a35';

// ---------------------------------------------------------------- helpers
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Warm light multiplies the stone colour, so mortar lines stay dark inside the pool.
const warmLight = (
  c: readonly [number, number, number],
  g: number,
  k: readonly [number, number, number],
) => [c[0] * (1 + k[0] * g), c[1] * (1 + k[1] * g), c[2] * (1 + k[2] * g)] as const;

// ---------------------------------------------------------------- brick pattern
// Same block rhythm as torch-sconce: the kit shares its masonry.
const ROW = 0.15; // course height
const COL = 0.17; // block width
const BAND_Y = 0.17; // pattern offset: rows land mid-tier, one row edge meets the rune panel

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

// Horizontal coordinate on the face we stand on: pick the axis closer to its tier extent.
const tierExtents = (y: number): [number, number] =>
  y < 0.18 ? [0.54, 0.36] : y < 0.34 ? [0.47, 0.3] : y < 0.7 ? [0.42, 0.25] : [0.6, 0.4];
const faceU = (x: number, y: number, z: number) => {
  const [hx, hz] = tierExtents(y);
  return Math.abs(z) / hz > Math.abs(x) / hx ? x : z;
};

// ---------------------------------------------------------------- lights
// Two candle flames pool warm light over the slab top and front edge.
const CANDLE_X = 0.42;
const CANDLE_Z = 0.1;
const H_A = 0.055; // left candle height above the slab
const H_B = 0.04; // right candle, shorter for a lived-in asymmetry
const TOP_Y = 0.9;
const LIGHTS: readonly (readonly [number, number, number])[] = [
  [-CANDLE_X, TOP_Y + H_A + 0.045, CANDLE_Z],
  [CANDLE_X, TOP_Y + H_B + 0.045, CANDLE_Z],
];
const glow = (x: number, y: number, z: number) => {
  let s = 0;
  for (const l of LIGHTS) {
    const d = Math.hypot(x - l[0], y - l[1], z - l[2]);
    const t = Math.max(0, 1 - (d - 0.1) / 0.32);
    s += t * t;
  }
  return Math.min(1.05, s);
};

// Tier tops where the bevel catches light and the stone wears pale.
const TIER_TOPS = [0.18, 0.34, 0.9];

export default defineAsset({
  name: 'altar',
  description:
    'Stone ritual altar: stepped plinths, thick slab, carved emissive rune band, and two candle flames.',
  reference: 'docs/dungeon-mockups/dungeon-quest_002.jpg',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- stone tiers
    const base = sdf.box([1.08, 0.18, 0.72], 0.03).at(0, 0.09, 0);
    const step2 = sdf.box([0.94, 0.16, 0.6], 0.03).at(0, 0.26, 0);
    const die = sdf.box([0.84, 0.36, 0.5], 0.03).at(0, 0.52, 0);
    const slab = sdf.box([1.2, 0.2, 0.8], 0.045).at(0, 0.8, 0);
    // The carved rune panel: a 45 mm deep recess cut into the slab front edge.
    const panel = sdf.box([1.02, 0.14, 0.1], 0.02).at(0, 0.8, 0.405);

    const stone = sdf
      .subtract(sdf.smoothUnion(0.018, base, step2, die, slab), panel)
      .paintFn((x, y, z) => {
        const b = brick(faceU(x, y, z), y + BAND_Y);
        const tint = noise.random(b.col, b.row, 3);
        let c = mixRgb(rgb(SLATE_DARK), rgb(SLATE_MID), 0.85 * tint);
        c = mixRgb(c, rgb('#1a2230'), 0.45 * (1 - b.t)); // shadowed block bottoms
        c = mixRgb(c, rgb(SLATE_PALE), 0.28 * b.t); // worn pale block tops
        c = mixRgb(c, rgb('#0e141f'), 0.92 * (1 - sstep(0.005, 0.015, b.d))); // mortar
        // Deep shadow inside the carved rune panel so the band reads cut, not printed.
        const inPanel =
          sstep(0.49, 0.44, Math.abs(x)) *
          sstep(0.07, 0.05, Math.abs(y - 0.8)) *
          sstep(0.34, 0.35, z);
        c = mixRgb(c, rgb('#141b26'), 0.6 * inPanel);
        // Pale worn edges where each tier top catches the light.
        const wear = Math.max(
          ...TIER_TOPS.map((top) => sstep(0.02, 0.002, Math.abs(y - top))),
        );
        c = mixRgb(c, rgb(SLATE_PALE), 0.58 * wear);
        // Damp moss at the base.
        const moss =
          sstep(0.25, 0.8, noise.fbm(x * 7, y * 6, z * 7, 2)) * (1 - sstep(0.0, 0.5, y));
        c = mixRgb(c, rgb(MOSS), 0.5 * moss);
        // Faint teal spill from the rune band onto the front edge.
        const rd = Math.hypot(x, (y - 0.8) * 1.4, z - 0.4);
        const rt = Math.max(0, 1 - (rd - 0.1) / 0.26);
        c = warmLight(c, rt * 0.4, [0.35, 1.5, 1.3]);
        // Soft warm candle glow over the top and front.
        return warmLight(c, glow(x, y, z) * 0.6, [6, 2.4, 0.3]);
      });
    k.body('stone', stone, {
      color: SLATE_MID,
      roughness: 0.92,
      metalness: 0,
      detail: 0.048,
      paintWeight: 2,
      bump: (x, y, z) => {
        const b = brick(faceU(x, y, z), y + BAND_Y);
        const groove = 1 - sstep(0.004, 0.016, b.d);
        return -0.01 * groove + noise.fbm(x * 26, y * 26, z * 26, 2) * 0.0016;
      },
    });

    // ---------------------------------------------------------------- rune glyphs
    type Seg = readonly [number, number, number, number];
    const GLYPHS: readonly (readonly Seg[])[] = [
      [
        [0, -0.043, 0, 0.043],
        [0, 0.005, -0.035, 0.043],
        [0, 0.005, 0.035, 0.043],
      ],
      [
        [-0.03, 0.043, 0.02, 0],
        [0.02, 0, -0.03, -0.043],
        [0.035, -0.03, 0.035, 0.03],
      ],
      [
        [0, 0.03, 0.032, 0],
        [0.032, 0, 0, -0.03],
        [0, -0.03, -0.032, 0],
        [-0.032, 0, 0, 0.03],
      ],
      [
        [-0.035, 0.043, 0.035, -0.043],
        [0.035, 0.043, -0.035, -0.043],
      ],
      [
        [0, -0.043, 0, 0.043],
        [0, -0.005, -0.035, -0.043],
        [0, -0.005, 0.035, -0.043],
      ],
    ];
    const RY = 0.8;
    const RZ = 0.363; // sunk into the 45 mm recess floor, well behind the front face
    const runes = sdf.union(
      ...GLYPHS.map((glyph, i) => {
        const gx = -0.4 + i * 0.2;
        return sdf.smoothUnion(
          0.008,
          ...glyph.map(([x1, y1, x2, y2]) =>
            sdf.capsule([gx + x1, RY + y1, RZ], [gx + x2, RY + y2, RZ], 0.017),
          ),
        );
      }),
    );
    k.body('runes', runes, {
      color: RUNE,
      roughness: 0.4,
      metalness: 0,
      detail: 0.016,
      textureDensity: 2,
      emissive: RUNE,
      emissiveIntensity: 0.4,
    });

    // ---------------------------------------------------------------- candles
    const candle = (x: number, h: number) =>
      sdf
        .smoothUnion(
          0.014,
          sdf.cylinder(0.052, 0.014, 0.007).at(x, TOP_Y + 0.007, CANDLE_Z), // wax puddle
          sdf.cone([x, TOP_Y, CANDLE_Z], [x, TOP_Y + h, CANDLE_Z], 0.034, 0.03),
        )
        .paintFn((_x, y) =>
          mixRgb(rgb('#5a3a20'), rgb('#c2a67a'), clamp01((y - TOP_Y) / (h * 0.9))),
        );
    k.body('candles', sdf.union(candle(-CANDLE_X, H_A), candle(CANDLE_X, H_B)), {
      color: WOOD,
      roughness: 0.7,
      metalness: 0,
      detail: 0.011,
      textureDensity: 2,
    });

    // ---------------------------------------------------------------- flames
    const flameProfile = profile.polygon(
      [
        [0, 0.102],
        [0.01, 0.077],
        [0.02, 0.053],
        [0.028, 0.033],
        [0.032, 0.013],
        [0.029, -0.006],
        [0.02, -0.02],
        [0, -0.023],
      ],
      { smooth: true, samples: 4 },
    );
    const yA = TOP_Y + H_A;
    const yB = TOP_Y + H_B;
    const flames = sdf
      .union(
        sdf.revolve(flameProfile).at(-CANDLE_X, yA - 0.015, CANDLE_Z),
        sdf.revolve(flameProfile).at(CANDLE_X, yB - 0.015, CANDLE_Z),
      )
      .paintFn((_x, y) => mixRgb(rgb('#d8721c'), rgb('#8a3208'), clamp01((y - 0.9) / 0.14)));
    k.body('flames', flames, {
      color: FLAME,
      roughness: 0.5,
      metalness: 0,
      detail: 0.009,
      textureDensity: 2,
      emissive: FLAME,
      emissiveIntensity: 2,
    });
  },
});
