import { defineAsset, mixRgb, noise, profile, rgb, type Rgb, sdf } from '../src/index.js';

/**
 * Design note — standing torch (props/furniture/torch).
 *
 * Role: warm path light for the village edge, a camp marker, a dungeon prop. Reads at 128 px.
 * Size: ~1.59 m tall, ~0.45 m wide at the stone base; stands on y = 0, faces +Z.
 * One idea: a chunky walnut pole planted in earth and a ring of nine chunky stones, topped by a
 *   dark banded iron cup of pitch-soaked cloth and one teardrop flame with a yellow-to-red gradient. The flame is the focal
 *   point; everything else is silhouette and weight.
 * Shape language: round dominant (rounded stones, swollen wooden pole, banded iron cup,
 *   teardrop flame) with one pointed accent (the flame tip). Soft bevels everywhere.
 * Palette: dark walnut #6b4226 / #54331d (dominant), iron #4a4f55 (secondary, with shadow
 *   #363a3f and highlight #a8acb1), warm accent flame #ff6a00 tongues, #ffd23a core
 *   (emissive, focal point).
 * Materials: walnut wood (rough 0.82), iron banded cup (metalness 0.7, rough 0.5), pitch cloth
 *   (rough 0.7), earth (rough 0.92), stone (rough 0.9), emissive flame (rough 0.3).
 * Detail: primary pole + cup + flame; secondary three stones + earth mound + cloth wrap;
 *   tertiary wood grain, iron band shadows, firelight bounce on the cup.
 * Rig/animation: none (static prop).
 */

const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIGHT = rgb('#8a5a35');

const IRON = rgb('#3a3a3e');
const IRON_DARK = rgb('#2a2a2e');
const IRON_LIGHT = rgb('#a8acb1');

const EARTH = rgb('#6f5235');
const EARTH_DARK = rgb('#3e2d1c');
const EARTH_LIGHT = rgb('#92764e');

const STONE = rgb('#7d7d82');
const STONE_DARK = rgb('#3e3e44');
const STONE_LIGHT = rgb('#a3a3a8');

const PITCH = rgb('#2a1f17');
const PITCH_LIGHT = rgb('#5a3a26');

const FLAME = rgb('#ff9a3c');
const FLAME_HOT = rgb('#ffd66b');

const GLOW = rgb('#ffb257');

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

// ------------------------------------------------------------------ layout
// Lift everything so the lowest point sits exactly on y = 0.
const POLE_BASE_Y = 0.155; // the wood rises from the earth mound
const POLE_TOP_Y = 1.155; // top of the pole, just below the cup
const CUP_Y = 1.155; // base of the iron cup
const CUP_H = 0.14;
const CLOTH_Y = POLE_TOP_Y - 0.01; // cloth wrap just below the cup, on the pole top
const FLAME_Y = CUP_Y + CUP_H - 0.03; // flame base sits inside the cup opening

export default defineAsset({
  name: 'torch',
  description:
    'A standing torch: a chunky walnut pole planted in three stones and an earth mound, with a banded iron cup of pitch-soaked cloth and a chunky teardrop flame on top.',
  detail: 0.012,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/torch-mock.jpg',

  build(k) {
    // ======================================================================
    // STONES (9 chunky faceted stones around the foot) — bottoms rest at y = 0
    // ======================================================================
    // x, z, half-w, half-h, half-d, rotY, rotZ, layer (0 ground, 1 mid, 2 top)
    const stonesData: [number, number, number, number, number, number, number, number][] = [
      [0.16, 0.03, 0.07, 0.055, 0.06, 20, 6, 0],
      [0.1, 0.13, 0.065, 0.05, 0.06, -30, -5, 0],
      [-0.03, 0.16, 0.07, 0.055, 0.055, 15, 8, 0],
      [-0.14, 0.09, 0.065, 0.055, 0.06, 50, -7, 0],
      [-0.17, -0.05, 0.06, 0.05, 0.058, -15, 5, 0],
      [-0.08, -0.15, 0.07, 0.055, 0.055, 35, -6, 0],
      [0.05, -0.15, 0.065, 0.05, 0.06, -40, 7, 0],
      [0.15, -0.1, 0.06, 0.05, 0.055, 10, -4, 0],
      [0.07, 0.07, 0.06, 0.055, 0.055, -20, 8, 1],
      [-0.06, 0.07, 0.06, 0.055, 0.055, 40, -8, 1],
      [-0.03, -0.08, 0.06, 0.055, 0.055, 10, 6, 1],
      [0.08, -0.04, 0.055, 0.055, 0.05, 25, -6, 1],
      [0.0, 0.0, 0.05, 0.06, 0.05, 30, 10, 2],
    ];
    const stones = stonesData.map(([x, z0, hw, hh0, hd, ry, rz, layer]) => {
      const z = z0 * 0.92;
      const xs = x * 0.92;
      const hh = hh0 * 1.3;
      const y = hh - 0.004 + layer * 0.085;
      return sdf.box([hw * 2, hh * 2, hd * 2], 0.03).rotate(0, ry, rz).at(xs, y, z);
    });
    const stoneShape = sdf.union(...stones).paintFn((x, y, z, base): Rgb => {
      const h = noise.random(Math.round(x * 12), Math.round(z * 12), 3);
      const tone = h < 0.33 ? rgb('#9a9290') : h < 0.66 ? rgb('#a88f88') : rgb('#7f7a78');
      let c = mixRgb(STONE_DARK, tone, 0.75 + 0.2 * clamp01(y / 0.05));
      c = mixRgb(c, STONE_LIGHT, clamp01((y - 0.05) / 0.12) * 0.45);
      const n = noise.fbm(x * 14, y * 14, z * 14, 3);
      c = mixRgb(c, STONE_DARK, clamp01(-n) * 0.3);
      const g = clamp01(1 - Math.hypot(x, z) / 0.22) * clamp01(y / 0.1);
      return mixRgb(c, GLOW, 0.15 * g);
    });
    k.body('stones', stoneShape, {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 2200,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 40, y * 40, z * 40, 3),
    });

    // ======================================================================
    // EARTH MOUND (a low swell of dirt the pole is planted in) — bottom rests at y = 0
    // ======================================================================
    const mound = sdf
      .cylinder(0.155, 0.07, 0.04)
      .at(0, 0.035, 0)
      .smoothUnion(0.014, sdf.ellipsoid([0.14, 0.06, 0.14]).at(0, 0.05, 0))
      .displace(0.005, (x, y, z) => noise.fbm(x * 22, y * 22, z * 22, 2))
      .paintFn((x, y, z, base): Rgb => {
        const r = Math.hypot(x, z);
        let c = mixRgb(EARTH_DARK, base, clamp01(0.3 + r / 0.2));
        c = mixRgb(c, EARTH_LIGHT, clamp01((y - 0.025) / 0.045) * 0.55);
        const n = noise.fbm(x * 18, y * 18, z * 18, 3);
        c = mixRgb(c, EARTH_DARK, clamp01(-n) * 0.28);
        c = mixRgb(c, EARTH_LIGHT, clamp01(n) * 0.18);
        return c;
      });
    k.body('earth', mound, {
      color: EARTH,
      roughness: 0.92,
      metalness: 0,
      detail: 0.013,
      maxTriangles: 350,
      paintWeight: 2,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 36, y * 36, z * 36, 3),
    });

    // ======================================================================
    // WOODEN POLE (chunky hand-hewn walnut with bulges and grain)
    // ======================================================================
    // Stacked ellipsoid segments with varying radii give the pole a chunky, hand-hewn
    // silhouette — like the reference's organic wooden pole rather than a turned dowel.
    // Larger smoothUnion blends merge the bumps into one continuous swelling.
    const poleLen = POLE_TOP_Y - POLE_BASE_Y;
    const polePts: Array<[number, number, number, number]> = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      polePts.push([
        0.014 * Math.sin(t * 7.0 + 0.5) * (1 - t * 0.5),
        POLE_BASE_Y + t * poleLen,
        0.012 * Math.cos(t * 5.3),
        0.045 - 0.01 * t + 0.003 * Math.sin(t * 17 + 1),
      ]);
    }
    const poleShape = sdf
      .chain(polePts, 0.02)
      .smoothUnion(0.02, sdf.sphere(0.06).at(0.004, POLE_BASE_Y + poleLen * 0.25, 0), sdf.sphere(0.052).at(-0.01, POLE_BASE_Y + poleLen * 0.55, 0.008), sdf.sphere(0.048).at(0.008, POLE_BASE_Y + poleLen * 0.8, -0.006))
      .displace(0.004, (x, y, z) => noise.fbm(x * 14, y * 4, z * 14, 2))
      .paintFn((x, y, z, base): Rgb => {
        const t = clamp01((y - POLE_BASE_Y) / poleLen);
        let c = mixRgb(WALNUT_DEEP, base, 0.55 + 0.4 * t);
        c = mixRgb(c, WALNUT_LIGHT, 0.2 * t);
        const grain = noise.fbm(x * 32, y * 4, z * 32, 3);
        c = mixRgb(c, WALNUT_DEEP, clamp01(-grain) * 0.25);
        c = mixRgb(c, WALNUT_LIGHT, clamp01(grain) * 0.15);
        const glow = clamp01(1 - (CUP_Y + CUP_H - y) / 0.4) * clamp01((y - (CUP_Y - 0.05)) / 0.05);
        return mixRgb(c, GLOW, 0.18 * glow);
      });
    k.body('pole', poleShape, {
      color: WALNUT,
      roughness: 0.82,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 1200,
      paintWeight: 3,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 40, y * 5, z * 40, 3),
    });

    // ======================================================================
    // PITCH-SOAKED CLOTH WRAP (sits between the pole top and the cup)
    // ======================================================================
    // A thick, slightly bulged cylinder of dark pitch-soaked fabric that fills the cup's
    // bottom and wraps the top of the pole. Soft bevels, dark with a hint of warm sheen.
    const cloth = sdf
      .cylinder(0.062, 0.05, 0.018)
      .at(0, CLOTH_Y + 0.022, 0)
      .smoothUnion(0.006, sdf.ellipsoid([0.058, 0.025, 0.058]).at(0, CLOTH_Y + 0.024, 0))
      .displace(0.004, (x, y, z) => noise.fbm(x * 26, y * 14, z * 26, 2))
      .paintFn((x, y, z, base): Rgb => {
        // dark pitch soaked into the cloth; a faint warm sheen on top
        const top = clamp01((y - CLOTH_Y) / 0.04);
        let c = mixRgb(base, PITCH, 0.5);
        c = mixRgb(c, PITCH_LIGHT, 0.25 * top);
        // warm bounce from the flame above
        const warm = clamp01(1 - (CUP_Y + CUP_H - y) / 0.1) * clamp01((y - (CUP_Y - 0.04)) / 0.04);
        c = mixRgb(c, GLOW, 0.25 * warm);
        return c;
      });
    k.body('cloth', cloth, {
      color: PITCH,
      roughness: 0.7,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 250,
      paintWeight: 2,
    });

    // ======================================================================
    // IRON CUP (banded brazier cup holding the pitch and cloth)
    // ======================================================================
    // Profile: narrow bottom, three bulged band rings, flared top lip. Revolved around Y.
    const cupProfile = profile.polygon(
      [
        [0, 0.0],
        [0.07, 0.0],
        [0.078, 0.014],
        [0.074, 0.024],
        [0.088, 0.034], // band 1 lower
        [0.072, 0.046],
        [0.092, 0.056], // band 1 upper
        [0.08, 0.068],
        [0.096, 0.078], // band 2 lower
        [0.084, 0.09],
        [0.1, 0.1], // band 2 upper
        [0.092, 0.11],
        [0.108, 0.12], // flared lip
        [0.094, 0.134],
        [0, 0.134],
      ],
      { smooth: true, samples: 8 },
    );
    const cupOuter = sdf.revolve(cupProfile).scale([0.8, 1, 0.8]).at(0, CUP_Y, 0);
    // Hollow out the inside so the cup has visible thickness.
    const cupInnerProfile = profile.polygon(
      [
        [0, 0.01],
        [0.05, 0.01],
        [0.062, 0.024],
        [0.066, 0.044],
        [0.07, 0.064],
        [0.074, 0.084],
        [0.078, 0.104],
        [0.082, 0.122],
        [0, 0.122],
      ],
      { smooth: true, samples: 8 },
    );
    const cupInner = sdf.revolve(cupInnerProfile).scale([0.8, 1, 0.8]).at(0, CUP_Y, 0);
    const cupShape = cupOuter.subtract(cupInner).paintFn((x, y, z, base): Rgb => {
      // band shadows: dark between the bulged rings; highlight on the tops
      // band centers in local cup frame (y measured from CUP_Y)
      const ly = y - CUP_Y;
      const bands = [0.032, 0.054, 0.076, 0.098, 0.118];
      let band = 0;
      let bandDist = Infinity;
      for (const b of bands) {
        const d = Math.abs(ly - b);
        if (d < bandDist) {
          bandDist = d;
          band = b;
        }
      }
      const bandT = clamp01(bandDist / 0.007);
      // on a band: highlight; between bands: shadow
      const onBand = 1 - bandT;
      let c = mixRgb(IRON_DARK, base, 0.7 + 0.3 * bandT);
      c = mixRgb(c, rgb('#5a5a60'), 0.95 * onBand);
      // micro-noise so the iron does not look like plastic
      const n = noise.fbm(x * 22, y * 22, z * 22, 3);
      c = mixRgb(c, IRON_DARK, clamp01(-n) * 0.18);
      c = mixRgb(c, IRON_LIGHT, clamp01(n) * 0.08);
      // warm bounce from the flame above, strongest at the lip
      const warm = clamp01((ly - 0.06) / 0.06) * 0.4;
      c = mixRgb(c, GLOW, warm);
      return c;
    });
    k.body('cup', cupShape, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxTriangles: 1700,
      paintWeight: 3,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ======================================================================
    // FLAME (chunky teardrop with two licks that merge into the main belly)
    // ======================================================================
    // Main belly + smaller upper tip, plus two side licks that lean outward and start
    // INSIDE the main belly so they read as one continuous flame, not detached blobs.
    // Dark base color (per the emissive rule) so the orange glow reads saturated.
    const flameBaseY = FLAME_Y;
    const fy = flameBaseY;
    // [baseX, baseZ, lean x, lean z, height, base radius, twist]
    const tongues: ReadonlyArray<readonly number[]> = [
      [0, 0, 0.0, 0.0, 0.3, 0.05, 0.5],
      [-0.04, 0.01, -0.05, 0.0, 0.2, 0.038, -0.6],
      [0.04, -0.01, 0.055, 0.01, 0.23, 0.038, 0.8],
      [0.01, 0.04, 0.0, 0.05, 0.16, 0.032, 0.4],
      [-0.01, -0.04, 0.02, -0.05, 0.19, 0.034, -0.3],
    ];
    const body = sdf.chain(
      [
        [0, fy + 0.04, 0, 0.058],
        [0, fy + 0.12, 0, 0.072],
        [0.005, fy + 0.2, 0.003, 0.058],
        [0.012, fy + 0.27, 0.005, 0.03],
        [0.02, fy + 0.31, 0.005, 0.008],
      ],
      0.04,
    );
    const lobe = (x0: number, z0: number, dx: number, dz: number, h: number, r: number) =>
      sdf.chain(
        [
          [x0, fy + 0.14, z0, r],
          [x0 + dx * 0.5, fy + 0.14 + h * 0.5, z0 + dz * 0.5, r * 0.75],
          [x0 + dx, fy + 0.14 + h, z0 + dz, r * 0.2],
        ],
        0.02,
      );
    const flameShape = body
      .smoothUnion(
        0.03,
        lobe(-0.06, 0, -0.03, 0.01, 0.18, 0.04),
        lobe(0.06, 0, 0.05, -0.01, 0.15, 0.04),
        lobe(0.01, 0.06, -0.02, 0.04, 0.12, 0.035),
        lobe(-0.01, -0.06, 0.03, -0.04, 0.14, 0.035),
      )
      .paintFn((x, y, z, _b): Rgb => {
        // One hot gradient: yellow at the base and the axis, orange in the belly, red-orange tips.
        const t = clamp01((y - fy) / 0.32 + Math.hypot(x, z) * 2.5);
        if (t < 0.3) return mixRgb(rgb('#ffd23a'), rgb('#ffa010'), t / 0.3);
        if (t < 0.7) return mixRgb(rgb('#ffa010'), rgb('#ff6a00'), (t - 0.3) / 0.4);
        return mixRgb(rgb('#ff6a00'), rgb('#e8400a'), (t - 0.7) / 0.3);
      });
    // Matte surface: a glossy highlight on the emissive orange washed the flame to salmon.
    k.body('flame', flameShape, {
      color: '#ff8a10',
      roughness: 0.95,
      metalness: 0,
      emissive: '#ff5a00',
      emissiveIntensity: 0.25,
      detail: 0.005,
      maxTriangles: 1500,
      paintWeight: 3,
    });
  },
});
