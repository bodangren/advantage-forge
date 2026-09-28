import { defineAsset, mixRgb, noise, rgb, sdf, profile, type Rgb } from '../src/index.js';

/**
 * nature/terrain/sand-dune — a soft wind-blown sand dune for the Chibi Quest landscape.
 *
 * Role: background terrain prop the player walks past; must read at the 128 px sprite size.
 * Size: 2.5 m long (X), 1.7 m deep (Z), 0.8 m tall, flat base on y = 0, centred, facing +Z.
 * One idea: one smooth crescent mound of warm sand; the whole surface is shingled with soft
 *   wind-ripple ridges (the trait to exaggerate), tapering to a rounded crest off-centre at the back.
 * Shape language: round dominant (friendly), one low secondary lobe secondary (rhythm), no hard edges.
 * Palette: lit sand #f0dfae, mid sand #dcc089 (base), shaded sand #b99a63, ripple crevice #8f7446.
 * Materials: sand (roughness 0.95, metalness 0, grit + ripple relief in bump). One body.
 * Detail list: main mound + front apron (big), back secondary lobe and crest ridge (medium),
 *   ripple shingles (small), grit bump (smallest). Focal point: the lit crest and its ripple lines.
 * Rig/animation: none; it is static terrain.
 */

const sandLight = rgb('#f0dfae');
const sandMid = rgb('#dcc089');
const sandShade = rgb('#b8945c');
const sandDeep = rgb('#8a6d3f');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

// Ripple spacing and wander. Shared by displace, paint, and bump so relief and colour line up.
const RIPPLE_SPACING = 0.152;
const RIPPLE_AMP = 0.013;

/** Signed ripple height in [-1, 1]; bands wrap the mound roughly level, wandering with noise. */
const ripple = (x: number, y: number, z: number): number => {
  const wander = noise.fbm(x * 0.8, y * 0.45, z * 0.8, 2, 5) * 0.12;
  return Math.sin(((y + wander) * Math.PI * 2) / RIPPLE_SPACING + 0.5);
};

/** Ripples fade out at the foot of the dune so the ground contact stays a clean roll. */
const rippleShaped = (x: number, y: number, z: number): number =>
  ripple(x, y, z) * smoothstep(0.015, 0.075, y) * (1 - 0.35 * smoothstep(0.6, 0.8, y));

/** Broad, slow lumpiness so the dune is not a perfect solid of revolution. */
const lumps = (x: number, y: number, z: number): number =>
  noise.fbm(x * 1.5, y * 1.8, z * 1.5, 3, 17);

const sandPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const t = clamp01(y / 0.8);
  // Value plan: shaded low skirt -> mid flanks -> lit crest.
  let c = mixRgb(sandShade, sandMid, smoothstep(0.02, 0.4, t));
  c = mixRgb(c, sandLight, smoothstep(0.4, 0.95, t) * 0.85);
  // Ripple relief: valleys darker, ridge tops lighter, so the shingles read as bands.
  const r = rippleShaped(x, y, z);
  c = mixRgb(c, sandDeep, clamp01(-r) * 0.48 * smoothstep(0.0, 0.12, t));
  c = mixRgb(c, sandLight, clamp01(r) * 0.28);
  // Soft contact shadow where the skirt meets the ground.
  c = mixRgb(c, sandShade, clamp01((0.11 - y) / 0.11) * 0.45);
  // Soft warm/cool patches.
  const patch = lumps(x, y, z);
  c = mixRgb(c, sandShade, clamp01(-patch) * 0.22);
  c = mixRgb(c, sandLight, clamp01(patch) * 0.14);
  // Grit speckle.
  const grit = noise.fbm(x * 48, y * 48, z * 48, 2, 29);
  c = mixRgb(c, sandDeep, clamp01(grit) * 0.14);
  return c;
};

const sandBump = (x: number, y: number, z: number): number => {
  // Ripple shingles as soft relief, plus fine wind grit.
  const ripples = 0.004 * rippleShaped(x, y, z);
  const grit = 0.0016 * noise.fbm(x * 90, y * 90, z * 90, 3, 7);
  const drift = 0.0022 * noise.fbm(x * 6, y * 6, z * 6, 2, 3);
  return ripples + grit + drift;
};

export default defineAsset({
  name: 'sand-dune',
  description: 'Soft crescent sand dune, 2.5 m long and 0.8 m tall, with wind ripples on every flank.',
  detail: 0.02,
  reference: 'docs/item-mockups/sand-dune-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const ground = sdf.halfSpace([0, -1, 0], 0);

    // ------------------------------------------------------------------ blockout
    // A revolved dune profile: a flared foot that rolls to the ground, a long windward flank,
    // and a convex crest. Stretched along X so the dune is 2.5 m long and 1.7 m deep.
    const body = sdf.revolve(
      profile.polygon(
        [
          [0.99, 0.03],
          [0.95, 0.11],
          [0.86, 0.21],
          [0.73, 0.33],
          [0.57, 0.45],
          [0.4, 0.57],
          [0.23, 0.68],
          [0.08, 0.76],
          [0.0, 0.8],
          [0.0, 0.0],
        ],
        { smooth: true },
      ),
    );

    // Secondary low lobe at the back-right, for a big/medium/small rhythm and a broken outline.
    const lobe = sdf.ellipsoid([0.34, 0.26, 0.34]).at(0.6, 0.0, -0.42);

    // Crest pushed a touch toward the back, so the slip face is steeper than the windward slope.
    const crest = sdf.ellipsoid([0.42, 0.3, 0.44]).at(-0.05, 0.42, -0.12);

    let dune = body.smoothUnion(0.16, lobe).smoothUnion(0.24, crest).scale([1.18, 0.92, 0.8]);

    // ------------------------------------------------------------------ ripples and grain
    dune = dune
      .round(0.012)
      .displace(0.014, lumps)
      .displace(RIPPLE_AMP, rippleShaped, 1.5)
      .intersect(ground);

    k.body('sand', dune.paintFn(sandPaint), {
      color: sandMid,
      roughness: 0.95,
      metalness: 0,
      detail: 0.037,
      maxTriangles: 3200,
      textureDensity: 1.4,
      paintWeight: 1,
      bump: sandBump,
    });
  },
});
