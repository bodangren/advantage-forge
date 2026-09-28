import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — ruined stone column (architecture/structure/ruin-column).
 *
 * Role: forest-clearing landmark decor; must read as "broken column" at 128 px.
 * Size: 1.6 m tall with the moss cap, 0.62 m wide base, stands on y = 0, faces +Z.
 * One idea: a fluted column snapped off mid-shaft — a slanted jagged break crowned
 *   with a bright moss cap that drips over the rim, and its fallen drum at the foot.
 * Shape language: square dominant (base block, drum), round secondary (fluted
 *   shaft), organic accent (moss cap and drips).
 * Palette: stone mid #8a94a0 (dominant), light #b6bec6 (worn edges, sunlit top),
 *   dark #565e68 (flute valleys, crevices), damp #3f464e (ground contact);
 *   accent moss #7ec850 with dark #4a8a3f.
 * Materials: stone (roughness 0.9, metalness 0) for base/shaft/drum/rubble;
 *   moss (roughness 0.95, metalness 0) for the cap, drips, and ground crusts.
 *   Flutes in `displace`, grain in `bump`. No emissive.
 * Detail: primary base + snapped shaft + fallen drum; secondary jagged break bites,
 *   rubble chunks, moss cap + drips; tertiary stone grain and moss dusting in paint.
 *   Focal point: the moss-capped jagged break against the gray shaft.
 * Rig/animation: none (static architecture).
 */

const STONE = rgb('#8a94a0');
const STONE_LIGHT = rgb('#b6bec6');
const STONE_DARK = rgb('#565e68');
const STONE_DEEP = rgb('#3f464e');
const MOSS = rgb('#7ec850');
const MOSS_DARK = rgb('#4a8a3f');

const FLUTES = 12;
// 1 at the bottom of a flute valley, 0 at a ridge crest.
const fluteValley = (x: number, z: number) => {
  const a = Math.atan2(z, x);
  const u = ((a + Math.PI) / (Math.PI * 2)) * FLUTES;
  const f = u - Math.floor(u);
  return Math.pow(0.5 - 0.5 * Math.cos(Math.PI * 2 * f), 2);
};

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

const stoneBump = (amp: number) => (x: number, y: number, z: number) =>
  amp * noise.fbm(x * 26, y * 26, z * 26, 2, 4);

export default defineAsset({
  name: 'ruin-column',
  description:
    'Broken ruined stone column: square base, fluted shaft snapped off in a slanted jagged break with a dripping moss cap, a fallen fluted drum, and rubble chunks with mossy feet.',
  detail: 0.01,
  reference: 'docs/item-mockups/ruin-column-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Shared moss dusting: fbm-gated green creep for low, damp stone surfaces.
    const mossDust = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) => {
      const m = clamp01(
        clamp01((0.42 - y) / 0.42) * 0.7 +
          noise.fbm(x * 7 + 13, y * 7, z * 7, 3, 31) * 0.55 -
          0.28,
      );
      const shade = clamp01(0.5 + 0.5 * noise.fbm(x * 15, y * 15, z * 15, 2, 8));
      return mixRgb(base, mixRgb(MOSS_DARK, MOSS, shade), m * 0.8);
    };

    // ------------------------------------------------------------- base + plinth
    const baseBox = sdf.box([0.62, 0.24, 0.62], 0.035).at(0, 0.12, 0);
    const plinth = sdf.box([0.5, 0.09, 0.5], 0.03).at(0, 0.285, 0);
    const baseShape = baseBox.smoothUnion(0.025, plinth);
    const basePaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 4 + 3, y * 4, z * 4, 3, 5);
      const speck = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2, 9);
      let c = mixRgb(STONE, STONE_DARK, 0.45 * patch);
      c = mixRgb(c, STONE_LIGHT, 0.09 * speck);
      // Worn upper edges, damp dark near the floor.
      const e = Math.max(Math.abs(x) / 0.31, Math.abs(z) / 0.31, Math.abs(y - 0.14) / 0.16);
      const wear =
        clamp01((e - 0.68) / 0.3) *
        (0.4 + 0.6 * (0.5 + 0.5 * noise.fbm(x * 13 + 2, y * 13, z * 13, 2, 6)));
      c = mixRgb(c, STONE_LIGHT, 0.45 * wear);
      c = mixRgb(c, STONE_DEEP, 0.5 * Math.pow(clamp01(1 - y / 0.3), 2));
      return mossDust(x, y, z, c);
    };
    k.body('base', baseShape.paintFn(basePaint), {
      color: '#8a94a0',
      roughness: 0.9,
      metalness: 0,
      detail: 0.01,
      paintWeight: 2,
      bump: stoneBump(0.0022),
      maxTriangles: 900,
    });

    // ------------------------------------------------------- fluted shaft, snapped
    const shaftProfile = profile.polygon(
      [
        [0, 0.33],
        [0.18, 0.33],
        [0.186, 0.42],
        [0.179, 0.72],
        [0.169, 1.05],
        [0.159, 1.3],
        [0.156, 1.4],
        [0, 1.4],
      ],
      { smooth: true, samples: 14 },
    );
    // Flutes carved along the whole shaft; jagged noise only near the break.
    const jag = (x: number, y: number, z: number) => {
      const t = clamp01((y - 1.28) / 0.14);
      const n = noise.fbm(x * 16 + 7, y * 7, z * 16, 3, 21);
      return -0.011 * fluteValley(x, z) + t * t * 0.035 * n;
    };
    // Slanted snap: a tilted slab slices the top; bites chip the rim angular.
    const slice = sdf.box([0.7, 0.3, 0.7], 0.02).rotateZ(-16).rotateX(7).at(0.04, 1.66, 0);
    const bites = sdf.union(
      sdf.box([0.13, 0.12, 0.13], 0.012).rotateY(35).rotateZ(14).at(0.12, 1.5, 0.05),
      sdf.box([0.11, 0.1, 0.11], 0.012).rotateY(-50).rotateZ(-10).at(-0.09, 1.52, -0.1),
      sdf.box([0.09, 0.1, 0.09], 0.01).rotateY(15).rotateZ(8).at(0.05, 1.5, 0.13),
      sdf.box([0.08, 0.09, 0.08], 0.01).rotateY(70).rotateZ(-20).at(-0.13, 1.49, 0.02),
    );
    const shaftShape = sdf
      .revolve(shaftProfile)
      .displace(1, jag)
      .subtract(slice)
      .subtract(bites);
    const shaftPaint = (x: number, y: number, z: number) => {
      const g = fluteValley(x, z);
      const patch = 0.5 + 0.5 * noise.fbm(x * 4 + 5, y * 4, z * 4, 3, 12);
      let c = mixRgb(STONE, STONE_DARK, 0.42 * patch);
      c = mixRgb(c, STONE_DARK, 0.6 * g); // flute valleys catch shadow
      const t = clamp01((y - 0.33) / 1.1);
      c = mixRgb(c, STONE_LIGHT, 0.16 * t * t); // sunlit toward the break
      c = mixRgb(c, STONE_DEEP, 0.4 * Math.max(0, 1 - t * 2.4)); // damp foot
      // Raw broken stone: pale fresh fracture on the jagged top.
      c = mixRgb(c, STONE_LIGHT, 0.3 * clamp01((y - 1.28) / 0.15));
      return c;
    };
    k.body('shaft', shaftShape.paintFn(shaftPaint), {
      color: '#8a94a0',
      roughness: 0.9,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      bump: stoneBump(0.0016),
      maxTriangles: 2100,
    });

    // -------------------------------------------------- fallen drum + rubble chunks
    // Drum lies on its side, bitten end up; two half-sunk chunks tumbled nearby.
    const drum = sdf
      .cylinder(0.155, 0.34, 0.02)
      .subtract(
        sdf.box([0.13, 0.11, 0.13], 0.012).rotateY(40).rotateZ(18).at(0.07, 0.19, 0.02),
      )
      .rotateZ(90) // lay it down, axis along X
      .rotateY(-16)
      .at(0.52, 0.157, 0.18);
    const chunkA = sdf
      .box([0.17, 0.13, 0.15], 0.032)
      .rotateY(24)
      .rotateZ(6)
      .at(0.28, 0.05, 0.44);
    const chunkB = sdf
      .box([0.13, 0.11, 0.12], 0.028)
      .rotateY(-30)
      .rotateX(8)
      .at(0.72, 0.045, -0.1);
    // Ground cut plants every piece cleanly on y = 0.
    const fallenShape = sdf
      .smoothUnion(0.006, drum, chunkA, chunkB)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const fallenPaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 4 + 8, y * 4, z * 4, 3, 17);
      const speck = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2, 23);
      let c = mixRgb(STONE, STONE_DARK, 0.46 * patch);
      c = mixRgb(c, STONE_LIGHT, 0.09 * speck);
      c = mixRgb(c, STONE_LIGHT, 0.35 * clamp01((y - 0.14) / 0.16)); // sunlit tops
      c = mixRgb(c, STONE_DEEP, 0.5 * Math.pow(clamp01(1 - y / 0.16), 2)); // damp bottoms
      return mossDust(x, y, z, c);
    };
    k.body('fallen', fallenShape.paintFn(fallenPaint), {
      color: '#8a94a0',
      roughness: 0.9,
      metalness: 0,
      detail: 0.01,
      paintWeight: 2,
      bump: stoneBump(0.002),
      maxTriangles: 1200,
    });

    // ------------------------------------------------------------------------ moss
    // Lumpy cap over the break, three drips over the rim, two crusts at the base.
    const cap = sdf
      .ellipsoid([0.185, 0.06, 0.185])
      .displace(0.012, (x, y, z) => noise.fbm(x * 20 + 3, y * 20, z * 20, 2, 14))
      .rotateZ(-14)
      .at(0, 1.425, 0);
    const drips = sdf.union(
      sdf.ellipsoid([0.026, 0.055, 0.026]).at(0.13, 1.34, 0.06),
      sdf.ellipsoid([0.022, 0.05, 0.022]).at(-0.11, 1.35, 0.1),
      sdf.ellipsoid([0.024, 0.06, 0.024]).at(0.02, 1.32, -0.14),
      sdf.ellipsoid([0.024, 0.055, 0.024]).at(0.04, 1.33, 0.14),
    );
    const crusts = sdf.union(
      sdf
        .ellipsoid([0.12, 0.02, 0.09])
        .displace(0.005, (x, y, z) => noise.fbm(x * 24, y * 24, z * 24, 2, 27))
        .at(0.37, 0.018, 0.3),
      sdf
        .ellipsoid([0.1, 0.018, 0.08])
        .displace(0.005, (x, y, z) => noise.fbm(x * 24 + 5, y * 24, z * 24, 2, 33))
        .at(-0.3, 0.016, 0.24),
    );
    const mossShape = sdf.smoothUnion(0.012, cap, drips, crusts);
    const mossPaint = (x: number, y: number, z: number) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2, 19);
      let c = mixRgb(MOSS_DARK, MOSS, n);
      c = mixRgb(c, MOSS, 0.35 * clamp01((y - 1.38) / 0.12)); // bright crown
      return c;
    };
    k.body('moss', mossShape.paintFn(mossPaint), {
      color: '#7ec850',
      roughness: 0.95,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      maxTriangles: 700,
    });
  },
});
