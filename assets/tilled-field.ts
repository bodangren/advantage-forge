import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Tilled field — a modular 2 m x 2 m soil tile, 0.08 m thick, top at y = 0.08.
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
const THICK = 0.08; // slab thickness, top face at y = 0.08
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

export default defineAsset({
  name: 'tilled-field',
  description:
    'Modular 2 m tilled soil tile: dark rich brown earth, thin subtle furrow lines 0.25 m apart, light soil flecks, straight tile edges.',
  detail: 0.02,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ soil slab
    const slab = sdf.box([TILE, THICK, TILE], 0.004).at(0, THICK / 2, 0);
    const soilBody = slab
      // Gentle ripple on the open top only; edges and sides stay exactly straight.
      .displace(0.004, (x, y, z) => noise.fbm(x * 2.4, 7.3, z * 2.4, 2) * rippleMask(x, y, z))
      .paintFn((x, y, z, base) => {
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
      });
    k.body('soil', soilBody, {
      color: '#5d3d23',
      roughness: 0.95,
      paintWeight: 2,
      textureDensity: 2,
      bump: (x, y, z) => {
        // Shallow furrow dip (top only) plus mild soil grain everywhere.
        const furrow = -FURROW_DEPTH * furrowProfile(z) * onTop(x, y, z);
        return furrow + 0.0014 * noise.fbm(x * 24, y * 24, z * 24, 2);
      },
    });

    // ------------------------------------------------------------ done
  },
});
