import { defineAsset, mixRgb, noise, profile, rgb, type Rgb, sdf } from '../src/index.js';

/**
 * Design note — standing torch (props/furniture/torch).
 *
 * Role: warm path light for the village edge, a camp marker, a dungeon prop. Reads at 128 px.
 * Size: ~1.3 m tall, ~0.32 m wide at the stone base; stands on y = 0, faces +Z.
 * One idea: a chunky walnut pole planted in earth and three fist-sized stones, topped by a
 *   banded iron cup of pitch-soaked cloth and a chunky teardrop flame. The flame is the focal
 *   point; everything else is silhouette and weight.
 * Shape language: round dominant (rounded stones, swollen wooden pole, banded iron cup,
 *   teardrop flame) with one pointed accent (the flame tip). Soft bevels everywhere.
 * Palette: dark walnut #6b4226 / #54331d (dominant), iron #4a4f55 (secondary, with shadow
 *   #363a3f and highlight #a8acb1), warm accent flame #ff9a3c core, #ffd66b tips
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

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
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
const FLAME_Y = CUP_Y + CUP_H - 0.015; // flame base sits inside the cup opening

export default defineAsset({
  name: 'torch',
  description:
    'A standing torch: a chunky walnut pole planted in three stones and an earth mound, with a banded iron cup of pitch-soaked cloth and a chunky teardrop flame on top.',
  detail: 0.012,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/torch-mock.jpg',

  build(k) {
    // ======================================================================
    // STONES (three fist-sized stones around the base) — bottom rests at y = 0
    // ======================================================================
    // Big chunky stones, half buried, framing the pole. Reference has 4-5 stones; three
    // large ones reads cleaner at 128 px than many small pebbles.
    const stonesData: ReadonlyArray<readonly [number, number, number, number, number, number]> =
      [
        [0.155, 0.07, 0.04, 0.085, 0.07, 8], // x, yCenter, z, rx, ry, rotDeg
        [-0.12, 0.06, 0.115, 0.075, 0.06, 28],
        [-0.07, 0.055, -0.14, 0.07, 0.055, -22],
        [0.045, 0.05, -0.145, 0.065, 0.05, -45],
      ];
    const stones: ReturnType<typeof sdf.sphere>[] = stonesData.map(
      ([x, y, z, rx, ry, deg]) => {
        const rz = rx * 1.1;
        const lump = sdf.ellipsoid([rx, ry, rz]);
        const shoulder = sdf.ellipsoid([rx * 0.55, ry * 0.55, rz * 0.55]).at(
          (noise.random(x * 100, 5) - 0.5) * rx * 0.5,
          ry * 0.35,
          (noise.random(z * 100, 6) - 0.5) * rz * 0.5,
        );
        return lump
          .smoothUnion(0.018, shoulder)
          .rotate(0, deg, (noise.random(x * 100, 8) - 0.5) * 14)
          .at(x, y, z);
      },
    );
    const stoneShape = sdf
      .union(...stones)
      .paintFn((x, y, z, base): Rgb => {
        let c = mixRgb(STONE_DARK, base, clamp01(y / 0.08) * 0.65);
        c = mixRgb(c, STONE_LIGHT, clamp01((y - 0.025) / 0.06) * 0.3);
        const n = noise.fbm(x * 12, y * 12, z * 12, 3);
        c = mixRgb(c, STONE_DARK, clamp01(-n) * 0.32);
        c = mixRgb(c, STONE_LIGHT, clamp01(n) * 0.14);
        // small warm bounce near the pole where the torch light would catch
        const g = clamp01(1 - Math.hypot(x, z) / 0.25) * clamp01((y - 0.0) / 0.08);
        c = mixRgb(c, GLOW, 0.2 * g);
        return c;
      });
    k.body('stones', stoneShape, {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.013,
      maxTriangles: 850,
      paintWeight: 2,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 32, y * 32, z * 32, 3),
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
    const segments: ReturnType<typeof sdf.sphere>[] = [];
    const segCount = 5;
    for (let i = 0; i < segCount; i++) {
      const t = i / (segCount - 1);
      const y = POLE_BASE_Y + t * poleLen;
      // chunkier at the base, slimmer near the top, with bumps that swell in and out
      const rxz =
        0.052 - 0.012 * t + 0.006 * Math.sin(t * Math.PI * 2.4) + 0.004 * Math.sin(t * 5.1 + 0.7);
      const ry = (poleLen / (segCount - 1)) * 0.7;
      // small asymmetry so the pole feels hand-carved, not lathe-turned
      const dx = 0.006 * Math.sin(i * 1.3 + 0.4);
      const dz = 0.006 * Math.cos(i * 1.7);
      segments.push(sdf.ellipsoid([rxz, ry, rxz * 0.94]).at(dx, y, dz));
    }
    // one prominent knuckle bulge near the lower third for hand-hewn character
    segments.push(sdf.sphere(0.06).at(0.006, POLE_BASE_Y + poleLen * 0.32, -0.004));
    const poleShape = sdf
      .smoothUnion(0.02, ...segments)
      .displace(0.005, (x, y, z) => noise.fbm(x * 14, y * 4, z * 14, 2))
      .paintFn((x, y, z, base): Rgb => {
        // warm wood gradient: darker at the base, slightly warmer mid-way up
        const t = clamp01((y - POLE_BASE_Y) / poleLen);
        let c = mixRgb(WALNUT_DEEP, base, 0.55 + 0.4 * t);
        c = mixRgb(c, WALNUT_LIGHT, 0.18 * t);
        // vertical grain stripes via stretched noise
        const grain = noise.fbm(x * 32, y * 4, z * 32, 3);
        c = mixRgb(c, WALNUT_DEEP, clamp01(-grain) * 0.22);
        c = mixRgb(c, WALNUT_LIGHT, clamp01(grain) * 0.14);
        // dark vertical cracks between grain bands
        const crack = Math.abs(Math.sin((x + z * 0.6) * 80 + y * 6));
        c = mixRgb(c, WALNUT_DEEP, clamp01(1 - crack) * 0.18);
        // a subtle warm bounce from the flame near the top of the pole
        const glow = clamp01(1 - (CUP_Y + CUP_H - y) / 0.4) * clamp01((y - (CUP_Y - 0.05)) / 0.05);
        c = mixRgb(c, GLOW, 0.18 * glow);
        return c;
      });
    k.body('pole', poleShape, {
      color: WALNUT,
      roughness: 0.82,
      metalness: 0,
      detail: 0.011,
      maxTriangles: 700,
      paintWeight: 3,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 28, y * 6, z * 28, 3),
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
    const cupOuter = sdf.revolve(cupProfile).at(0, CUP_Y, 0);
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
    const cupInner = sdf.revolve(cupInnerProfile).at(0, CUP_Y, 0);
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
      c = mixRgb(c, IRON_LIGHT, 0.5 * onBand);
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
      detail: 0.012,
      maxTriangles: 1300,
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
    const mainFlame = sdf.smoothUnion(
      0.018,
      sdf.sphere(0.085).at(0, flameBaseY + 0.055, 0),
      sdf.sphere(0.06).at(0, flameBaseY + 0.115, 0),
      sdf.sphere(0.034).at(0, flameBaseY + 0.16, 0),
      sdf.sphere(0.018).at(0, flameBaseY + 0.195, 0),
    );
    // Left lick: chain starting inside the belly, sweeping up and outward.
    const lickL = sdf.chain(
      [
        [-0.035, flameBaseY + 0.085, 0.005, 0.032],
        [-0.065, flameBaseY + 0.125, 0.0, 0.02],
        [-0.08, flameBaseY + 0.165, -0.005, 0.011],
        [-0.085, flameBaseY + 0.195, 0.0, 0.005],
      ],
      0.013,
    );
    // Right lick: chain starting inside the belly, sweeping up and outward.
    const lickR = sdf.chain(
      [
        [0.04, flameBaseY + 0.075, -0.005, 0.03],
        [0.07, flameBaseY + 0.115, 0.005, 0.019],
        [0.085, flameBaseY + 0.155, 0.0, 0.01],
        [0.082, flameBaseY + 0.185, -0.005, 0.004],
      ],
      0.013,
    );
    const flameShape = mainFlame
      .smoothUnion(0.014, lickL, lickR)
      .paintFn((_x, y, _z, _base): Rgb => {
        // hot core near the base, bright tips near the top
        const t = clamp01((y - flameBaseY) / 0.21);
        return mixRgb(FLAME_HOT, FLAME, t);
      });
    k.body('flame', flameShape, {
      // Dark base color per the emissive rule so studio light does not wash the glow.
      color: '#4a1405',
      roughness: 0.3,
      metalness: 0,
      emissive: '#ff9a3c',
      emissiveIntensity: 2.4,
      detail: 0.006,
      maxTriangles: 420,
      paintWeight: 3,
    });
  },
});