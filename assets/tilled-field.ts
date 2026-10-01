import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Tilled field — a modular 2 m x 2 m soil tile, a 0.3 m slab: top at y = 0, packed soil sides down to y = -0.3.
 * Role: ground module for the chibi farm field; tiles edge-to-edge with the other
 * ground tiles, so the sides stay plain soil and every edge is straight.
 * The one idea: freshly tilled earth — neat parallel furrows raked one way, dark
 * rich soil, and a few lighter dry flecks catching the light.
 * Shape language: square and sturdy (a tile), softened only by a gentle soil ripple
 * that fades to zero near every edge so neighbors meet flush.
 * Palette (60/30/10): rich brown soil #5d3d23 dominant, lighter dry patches #7c5a34,
 * accent = small light flecks #b98f5a. Furrow lines only slightly darker than the
 * soil (#452c19 mixed 58%) — thin, subtle, matte (roughness 0.95, never shiny).
 * Materials: one matte soil body; furrow relief and grain live in the normal map,
 * the soil ripple in a masked displace, everything else is paint. No rig, no
 * animation. Budget: under 8k triangles.
 */

const TILE = 2; // exact grid size
const THICK = 0.08; // old top height; the design is shifted down so the walkable top is y = 0
const TOP = THICK;
const SPACING = 0.25; // furrow spacing
const FURROW_W = 0.026; // furrow half width (dip and paint)
const FURROW_DEPTH = 0.0035; // bump-only furrow depth

const soil = rgb('#5d3d23');
const soilLight = rgb('#7c5a34');
const soilDark = rgb('#472d18');
const furrowColor = rgb('#452c19');
const fleckA = rgb('#b98f5a');
const fleckB = rgb('#a67c4a');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Smooth 0 -> 1 ramp between a and b (for masks, never a hard jump). */
const ramp = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Distance from z to the nearest furrow line center (lines at z = -0.875 + 0.25k). */
const furrowDist = (z: number) => {
  const u = (((z + 0.875) % SPACING) + SPACING) % SPACING;
  return Math.min(u, SPACING - u);
};
/** 1 at a furrow center, smoothly to 0 at +/- FURROW_W. Continuous, no jumps. */
const furrowProfile = (z: number) => {
  const d = furrowDist(z);
  return d < FURROW_W ? 0.5 + 0.5 * Math.cos((Math.PI * d) / FURROW_W) : 0;
};

/** 0 on the side faces, the outer rim, and the bottom face; 1 on the open top face. */
const onTop = (x: number, y: number, z: number) =>
  clamp01((0.994 - Math.max(Math.abs(x), Math.abs(z))) * 150) * clamp01((y - 0.012) * 50);
/** Soil ripple mask: zero near every tile edge so neighbors stay flush. */
const rippleMask = (x: number, y: number, z: number) =>
  (1 - ramp(0.86, 0.96, Math.max(Math.abs(x), Math.abs(z)))) * ramp(TOP - 0.045, TOP - 0.008, y);

/** Small light soil flecks, scattered only across the top. */
const FLECKS = Array.from({ length: 12 }, (_, i) => ({
  x: (noise.random(i, 41, 7) - 0.5) * 1.7,
  z: (noise.random(i, 83, 19) - 0.5) * 1.7,
  r: 0.014 + 0.01 * noise.random(i, 5, 97),
  c: i % 2 === 0 ? fleckA : fleckB,
}));

const SLAB = 0.3;
const EDGE = 0.001;
const SOIL = rgb('#6a4428');
const STRATA = rgb('#4a2e1a');
const SPECK = rgb('#9a8a78');
/** Side color: a lip of the top color with a wavy edge, then packed soil with strata and pebbles. */
function sideColor(x: number, y: number, z: number, top: (x: number, z: number) => ReturnType<typeof rgb>) {
  const along = Math.abs(x) > Math.abs(z) ? z : x;
  const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
  if (y > -drip) return top(x, z);
  const depth = -y / SLAB;
  let c = mixRgb(SOIL, STRATA, 0.1 + depth * 0.6);
  // Broken strata and soft clumps, so the side reads as earth and not as planks.
  const strata = Math.sin((y + 0.03 * noise.fbm(along * 3, y * 3, 5.3, 2)) * 45);
  const breakUp = Math.max(0, Math.min(1, 0.5 + noise.fbm(along * 4, y * 12, 7.1, 2)));
  c = mixRgb(c, STRATA, Math.max(0, strata - 0.7) * 0.9 * breakUp);
  const clump = noise.fbm(along * 14, y * 14, 11.7, 2);
  c = mixRgb(c, clump > 0 ? STRATA : SPECK, Math.min(1, Math.abs(clump)) * 0.3);
  const n = noise.fbm(along * 9, y * 9, 3.1, 2);
  if (n > 0.45) c = mixRgb(c, SPECK, Math.min(1, (n - 0.45) * 6) * 0.8);
  return c;
}


export default defineAsset({
  name: 'tilled-field',
  description:
    'Modular 2 m tilled soil tile, a 0.3 m slab with its top at y = 0 and packed soil sides: dark rich brown earth, raised soil rows 0.25 m apart with dark furrows between them, light soil flecks, straight tile edges.',
  detail: 0.02,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ soil slab
    const clampE = (v: number) => Math.max(-0.98, Math.min(0.98, v));
    const topColor = (x: number, z: number) => topPaint(clampE(x), THICK, clampE(z));
    const slab = sdf.box([TILE + 2 * EDGE, SLAB + 2 * EDGE, TILE + 2 * EDGE]).at(0, -SLAB / 2, 0);
    const soilBody = slab
      // Gentle ripple on the open top only; edges and sides stay exactly straight.
      .displace(0.004, (x, y, z) => noise.fbm(x * 2.4, 7.3, z * 2.4, 2) * rippleMask(x, y + THICK, z))
      .paintFn((x, y0, z) => {
        if (y0 < -0.01) return sideColor(x, y0, z, topColor);
        return topPaint(x, y0 + THICK, z);
      });
    function topPaint(x: number, y: number, z: number) {
      {
        // Rich brown with broad dry patches and a little dark grain (top and sides).
        const patch = noise.fbm(x * 3.1, 1.7, z * 3.1, 2);
        const grain = noise.fbm(x * 16, y * 16, z * 16, 2);
        let c = mixRgb(soil, soilLight, 0.24 * clamp01(0.5 + 0.5 * patch));
        c = mixRgb(c, soilDark, 0.22 * clamp01(0.5 + 0.5 * grain));

        // Furrow lines: thin, subtle, matte — and only on the top face.
        const f = furrowProfile(z) * onTop(x, y, z);
        if (f > 0) {
          const strength = 0.85 + 0.15 * noise.noise3(x * 9, 3.7, 0);
          c = mixRgb(c, furrowColor, 0.58 * f * strength);
        }

        // Tiny lighter soil flecks, also top only.
        for (const fl of FLECKS) {
          const d = Math.hypot(x - fl.x, z - fl.z);
          if (d < fl.r) c = mixRgb(c, fl.c, 0.92 * ramp(fl.r, fl.r * 0.35, d) * onTop(x, y, z));
        }
        return c;
      }
    }
    k.body('soil', soilBody, {
      color: '#5d3d23',
      roughness: 0.95,
      paintWeight: 2,
      textureDensity: 2,
      bump: (x, y, z) => {
        if (y < -0.01) return 0;
        // Shallow furrow dip (top only) plus mild soil grain everywhere.
        const furrow = -FURROW_DEPTH * furrowProfile(z) * onTop(x, y + THICK, z);
        return furrow + 0.0014 * noise.fbm(x * 24, y * 24, z * 24, 2);
      },
    });

    // ------------------------------------------------------------ ridges
    // Raised soil rows between the furrows, 0.035 m above the walkable top. A ridge sits on
    // each tile edge (z = ±1), so two neighbours make one full ridge across the seam.
    const RIDGE_H = 0.035;
    const rows = [];
    for (let i = -4; i <= 4; i++) {
      const zc = i * SPACING;
      rows.push(sdf.ellipsoid([1.3, RIDGE_H, 0.12]).at(0, 0, zc));
    }
    const ridges = sdf
      .union(...rows)
      .intersect(sdf.box([TILE + 2 * EDGE, 0.2, TILE + 2 * EDGE]).at(0, 0, 0))
      .displace(0.004, (x, y, z) => noise.fbm(x * 7, y * 7, z * 7, 2, 13))
      .paintFn((x, y, z) => {
        const c = topPaint(Math.max(-0.98, Math.min(0.98, x)), THICK + 0.02, z);
        const crest = ramp(0.004, RIDGE_H, y);
        return mixRgb(mixRgb(c, furrowColor, 0.7 * (1 - crest)), soilLight, 0.2 * crest);
      });
    k.body('ridges', ridges, {
      color: '#5d3d23',
      roughness: 0.95,
      paintWeight: 2,
      detail: 0.015,
      maxTriangles: 6000,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 24, y * 24, z * 24, 2),
    });
  },
});
