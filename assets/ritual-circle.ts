import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — ritual circle, lit (props/world/ritual-circle).
 *
 * Role: a floor landmark in the Sunken Vault dungeon; must read at 128 px as a
 *   dark stone disc with a glowing purple pentagram and five candle flames.
 * Size: 2.0 m wide, 0.05 m slab, stones and candles rise above it;
 *   stands on y = 0, faces +Z (one candle vertex on the front axis).
 * One idea: a ring of chunky dark stones around a glowing purple pentagram,
 *   with five black candles burning small violet flames at the star points.
 * Shape language: round dominant (stones, slab, flames), triangular secondary
 *   (the pentagram star breaks the circular outline).
 * Palette: dungeon stone cool gray #6f7680 / dark #4b525c (dominant), dark
 *   painted stones #383d45, black wax #17131a, purple glow #b46cf5 on a dark
 *   #2a1540 base (accent, emissive).
 * Materials: stone slab (0.9), painted stones (0.85), wax (0.5), runes + flames
 *   (emissive 1.8 to 2.0, dark base color so the glow does not wash out).
 * Detail: slab worley cells, pentagram chords + pentagon outline + center gem,
 *   five candle stumps with wicks, teardrop flames. Focal: the glowing star.
 * Rig/animation: none (static prop).
 */

const STONE_MID = rgb('#6f7680');
const STONE_DARK = rgb('#4b525c');
const ROCK = rgb('#383d45');
const ROCK_DEEP = rgb('#2d323a');
const ROCK_PURPLE = rgb('#5b3d7a');
const WAX = '#17131a';
const WAX_TOP = rgb('#241d28');
const GLOW = '#b46cf5';
const GLOW_BASE = '#2a1540';

const SLAB_R = 1.0;
const STONE_R = 0.87; // ring of stones
const STAR_R = 0.72; // pentagram circumradius (candles sit on its points)
const N_CANDLES = 5;
const N_STONES = 10;
// Vertex i of the pentagon: angle from +Z so one point faces the viewer.
const vertexAt = (i: number, r: number, y: number): [number, number, number] => {
  const a = (i / N_CANDLES) * Math.PI * 2;
  return [Math.sin(a) * r, y, Math.cos(a) * r];
};

export default defineAsset({
  name: 'ritual-circle',
  description:
    'A 2 m ritual circle on the floor: dark painted stones around a glowing purple pentagram, with five black candles burning small violet flames.',
  detail: 0.008,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/ritual-circle-mock.jpg',

  build(k) {
    // ------------------------------------------------------------------ stone slab
    // 2 m disc, 0.05 m thick, flat on y = 0. Cool gray dungeon stone with worley
    // cells and a darker worn rim where the stones sit.
    const slab = sdf.cylinder(SLAB_R, 0.05, 0.015).at(0, 0.025, 0);
    const slabPaint = (x: number, y: number, z: number) => {
      const { f1, f2, id } = noise.worley(x * 4.2, y * 4.2, z * 4.2, 5);
      const tint = noise.random(id, 3, 1);
      const patch = 0.5 + 0.5 * noise.fbm(x * 3, y * 3, z * 3, 2);
      let c = mixRgb(STONE_MID, STONE_DARK, 0.6 + 0.35 * tint);
      c = mixRgb(c, STONE_MID, 0.08 * patch);
      // Dark mortar seams between cells.
      c = mixRgb(c, STONE_DARK, 0.65 * Math.max(0, 1 - (f2 - f1) * 11));
      // Worn dark rim near the edge, slight sun-catch on top.
      const r = Math.hypot(x, z);
      c = mixRgb(c, STONE_DARK, 0.4 * Math.max(0, (r - 0.86) / 0.14));
      const top = Math.max(0, Math.min(1, (y - 0.03) / 0.02));
      c = mixRgb(c, STONE_MID, 0.08 * top);
      return c;
    };
    k.body('slab', slab.paintFn(slabPaint), {
      color: '#5b616b',
      roughness: 0.9,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 600,
      maxError: 0.02,
      paintWeight: 1,
      bump: (x, y, z) => {
        const { f1, f2 } = noise.worley(x * 4.2, y * 4.2, z * 4.2, 5);
        return -0.002 * Math.max(0, 1 - (f2 - f1) * 11) + 0.0012 * noise.fbm(x * 18, y * 6, z * 18, 2);
      },
    });

    // ------------------------------------------------------------------ stone ring
    // Ten chunky rounded stones, dark painted, slightly varied size and seat,
    // set between the candle points so a candle always has a stone each side.
    const stones: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < N_STONES; i++) {
      const a = ((i + 0.5) / N_STONES) * Math.PI * 2; // offset 36° from candles
      const jr = STONE_R + (noise.random(i, 1, 0) - 0.5) * 0.05;
      const s = 0.92 + noise.random(i, 2, 0) * 0.22;
      stones.push(
        sdf
          .ellipsoid([0.115 * s, 0.075 * s, 0.14 * s])
          .rotateY((a * 180) / Math.PI + 90)
          .at(Math.sin(a) * jr, 0.075 * s - 0.002, Math.cos(a) * jr),
      );
    }
    const ring = sdf.union(...stones);
    const rockPaint = (x: number, y: number, z: number) => {
      const a = Math.atan2(x, z); // -pi..pi, 0 at +Z
      const idx = Math.floor(((a + Math.PI) / (Math.PI * 2)) * N_STONES);
      const tint = noise.random(idx, 5, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
      let c = mixRgb(ROCK, ROCK_DEEP, 0.3 + 0.4 * tint);
      c = mixRgb(c, ROCK, 0.25 * patch);
      // Faint purple stain washed onto the inner faces from the runes.
      const r = Math.hypot(x, z);
      const stain = Math.max(0, Math.min(1, (0.98 - r) / 0.22)) * (0.4 + 0.6 * tint);
      c = mixRgb(c, ROCK_PURPLE, 0.35 * stain);
      // Lighter crown where light catches the top of each stone.
      c = mixRgb(c, rgb('#4a505a'), 0.3 * Math.max(0, Math.min(1, (y - 0.07) / 0.06)));
      return c;
    };
    k.body('stones', ring.paintFn(rockPaint), {
      color: '#383d45',
      roughness: 0.85,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 1000,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 22, y * 14, z * 22, 2),
    });

    // ------------------------------------------------------------------ glowing runes
    // Pentagram chords between every second vertex, the pentagon outline between
    // adjacent vertices, and a center gem. Dark purple base, violet emissive.
    const R = STAR_R;
    const yLine = 0.056;
    const lines: ReturnType<typeof sdf.capsule>[] = [];
    for (let i = 0; i < N_CANDLES; i++) {
      lines.push(sdf.capsule(vertexAt(i, R, yLine), vertexAt((i + 2) % N_CANDLES, R, yLine), 0.02));
      lines.push(sdf.capsule(vertexAt(i, R, yLine), vertexAt((i + 1) % N_CANDLES, R, yLine), 0.014));
    }
    const gem = sdf.sphere(0.055).scale([1, 0.42, 1]).at(0, yLine, 0);
    k.body('runes', sdf.union(...lines, gem), {
      color: GLOW_BASE,
      roughness: 0.4,
      metalness: 0,
      emissive: GLOW,
      emissiveIntensity: 1.8,
      detail: 0.004,
      maxTriangles: 700,
    });

    // ------------------------------------------------------------------ black candles
    // Five chunky candle stumps on the star points with melted tops and wicks.
    const candles: ReturnType<typeof sdf.cylinder>[] = [];
    for (let i = 0; i < N_CANDLES; i++) {
      const [cx, , cz] = vertexAt(i, R, 0);
      const c = sdf
        .smoothUnion(
          0.012,
          sdf.cylinder(0.048, 0.15, 0.012).at(cx, 0.125, cz),
          sdf.sphere(0.048).scale([1, 0.45, 1]).at(cx, 0.2, cz),
          sdf.cylinder(0.007, 0.03).at(cx, 0.215, cz),
        )
        .paintFn((x, yy, z) => {
          const melt = Math.max(0, Math.min(1, (yy - 0.16) / 0.05));
          return mixRgb(rgb(WAX), WAX_TOP, 0.6 * melt);
        });
      candles.push(c);
    }
    k.body('candles', sdf.union(...candles), {
      color: WAX,
      roughness: 0.5,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 600,
    });

    // ------------------------------------------------------------------ violet flames
    // Small teardrop flames: round belly + smaller tip, all emissive violet.
    const flames: ReturnType<typeof sdf.sphere>[] = [];
    for (let i = 0; i < N_CANDLES; i++) {
      const [cx, , cz] = vertexAt(i, R, 0);
      flames.push(
        sdf.smoothUnion(
          0.009,
          sdf.sphere(0.03).at(cx, 0.25, cz),
          sdf.sphere(0.013).at(cx, 0.29, cz),
        ),
      );
    }
    k.body('flames', sdf.union(...flames), {
      color: GLOW_BASE,
      roughness: 0.2,
      metalness: 0,
      emissive: GLOW,
      emissiveIntensity: 2.2,
      detail: 0.004,
      maxTriangles: 300,
    });
  },
});
