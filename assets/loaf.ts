import { defineAsset, sdf, noise, rgb, mixRgb } from '../src/index.js';

// Design note — round crusty bread loaf (props/food/loaf).
// - Role: cozy chibi hamlet prop on a tavern table; must read at 128 px
//   as a plump round golden loaf.
// - Size: 0.25 m wide and 0.14 m tall, sits on y = 0, centered on Y, faces
//   +Z. No board (a bare loaf on a tabletop).
// - One idea: a plump round crusty loaf with three diagonal baked slash
//   marks across the upper dome — the focal feature.
// - Shape language: round dominant (plump squat dome).
// - Palette: golden crust #d9a860 (60), baked slash top #a8702a (slash
//   ridges + warm crown), warm sunlit top highlight #f0c878, dark
//   under-crust #6b4226 (foot/shaded crevices).
// - Materials: bread matte (roughness 0.78); no metal.
// - Detail: dome body with paint bands + grainy bump (primary), three
//   parallel diagonal slashes on the upper dome painted darker with a
//   slight bump groove (secondary). Focal point: the three slash marks.
// - Rig/animation: none (static prop).

const CRUST = rgb('#d9a860');
const CRUST_LIGHT = rgb('#f0c878');
const BAKE = rgb('#b87231');
const BAKE_DARK = rgb('#7a4a1a');
const UNDERSIDE = rgb('#6b4226');

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Three slash marks laid across the upper dome. Each slash is a thin band
// running along a 45-degree diagonal in XZ. The slash field is computed in
// the local frame (along-bar d, perp n):
//
//   d = (-x + z) / sqrt(2)    n = (x + z) / sqrt(2)
//
// so the bar axis points from (-1, _, +1)/sqrt(2) to (+1, _, -1)/sqrt(2).
const INV_SQRT2 = 1 / Math.SQRT2;
const SLASH_HALF_LEN = 0.085; // half-length of each bar (along d)
const SLASH_RADIUS = 0.017; // perpendicular radius (across the bar)
const SLASHES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0.1, 0.07], // front slash, well forward of the dome's equator
  [0, 0.122, 0.0], // middle slash (highest, on the dome crown)
  [0, 0.1, -0.07], // back slash
];

// Returns positive distance to the closest slash axis (capped by
// SLASH_RADIUS inside the band, the actual perpendicular offset outside).
function slashOffset(x: number, y: number, z: number) {
  const d = (-x + z) * INV_SQRT2;
  const n = (x + z) * INV_SQRT2;
  let best = Infinity;
  for (const [mx, my, mz] of SLASHES) {
    const md = (-mx + mz) * INV_SQRT2;
    const mn = (mx + mz) * INV_SQRT2;
    const along = Math.abs(d - md);
    const perp = Math.abs(n - mn);
    const dy = y - my;
    // Distance to the band rectangle in the local frame: along the bar to
    // the nearest cap, then 2D perpendicular distance.
    const alongC = Math.max(0, along - SLASH_HALF_LEN);
    const perpC = Math.max(0, perp - SLASH_RADIUS);
    const dyC = Math.max(0, Math.abs(dy) - SLASH_RADIUS * 0.7);
    const dist = Math.hypot(alongC, perpC, dyC);
    // Signed: negative when inside the capsule's bounding slab.
    const slab = Math.max(
      along - SLASH_HALF_LEN,
      perp - SLASH_RADIUS,
      Math.abs(dy) - SLASH_RADIUS * 0.7,
    );
    const signed = dist === 0 ? -Math.min(SLASH_RADIUS, perp, Math.abs(dy)) + 1e-9 : dist + slab * 0.0;
    if (signed < best) best = signed;
  }
  return best;
}

export default defineAsset({
  name: 'loaf',
  description: 'A round crusty bread loaf with three baked slash marks across the top.',
  detail: 0.006,
  reference: 'docs/item-mockups/loaf-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ loaf body
    // Plump squat dome, flat foot where it meets the table. Mild displace
    // for an organic, hand-shaped surface (kept small so the form stays
    // readable).
    const loafShape = sdf
      .ellipsoid([0.125, 0.07, 0.125])
      .at(0, 0.07, 0)
      .displace(0.0028, (x, y, z) => noise.fbm(x * 16, y * 12, z * 16, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const loafPaint = (x: number, y: number, z: number) => {
      // Light-top / dark-foot value plan, with the dome crown catching the
      // most light.
      const t = y / 0.14;
      let c = mixRgb(UNDERSIDE, CRUST, smoothstep(0.06, 0.32, t));
      c = mixRgb(c, CRUST_LIGHT, smoothstep(0.55, 1, t) * 0.55);

      // A subtle baked rim where the dome meets the table.
      const rim = 1 - Math.abs(t - 0.18) / 0.18;
      c = mixRgb(c, BAKE_DARK, clamp01(rim) * 0.22);

      // Faint bake speckles on the upper dome.
      if (t > 0.35) {
        const n = noise.fbm(x * 90, y * 60, z * 90, 2);
        c = mixRgb(c, BAKE, smoothstep(0.42, 0.78, n) * 0.3);
      }

      // Three baked slash marks across the upper dome. Each slash is mostly a
      // darker baked orange band with a darker crease along its centerline.
      const d = slashOffset(x, y, z);
      const inside = smoothstep(SLASH_RADIUS * 1.05, SLASH_RADIUS * 0.4, d);
      if (inside > 0) {
        // Radial position inside the slash cross-section (0 = center, 1 = edge).
        const radial = clamp01(d / SLASH_RADIUS);
        const center = 1 - smoothstep(0, 0.45, radial);
        const edge = smoothstep(0.85, 1, radial);
        // Saturated bake band as the main slash color, with a darker
        // crease along the very centerline for the baked-crust feel.
        let slashC = BAKE;
        slashC = mixRgb(slashC, BAKE_DARK, center * 0.6);
        // Tiny blend into crust at the very edge so the slash doesn't cut
        // off abruptly into the dome.
        slashC = mixRgb(slashC, CRUST, edge * 0.1);
        c = mixRgb(c, slashC, inside);
      }

      return c;
    };

    const loafBump = (x: number, y: number, z: number) => {
      // Faint dome grain.
      let b = 0.0014 * noise.fbm(x * 32, y * 18, z * 32, 2);
      // Slash groove: each slash is a clear indented channel (~3 mm).
      const d = slashOffset(x, y, z);
      const groove = -(1 - smoothstep(SLASH_RADIUS * 0.4, SLASH_RADIUS * 1.0, d)) * 0.0032;
      b += groove;
      return b;
    };

    k.body('loaf', loafShape.paintFn(loafPaint), {
      color: '#d9a860',
      roughness: 0.78,
      metalness: 0,
      detail: 0.005,
      textureDensity: 2,
      paintWeight: 2,
      bump: loafBump,
      maxTriangles: 1900,
    });
  },
});
