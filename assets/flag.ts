import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — banner flag on a pole (catalog `props/world/flag`).
 *
 * Role: a cheerful landmark / town-standard prop for the chibi village set; readable at 128 px.
 * Size: 2.5 m pole with a gold finial; stone base 0.16 m tall; banner about 0.77 m wide and
 *   1.0 m tall. Stands on y = 0, the pole is on the Y axis, the banner hangs toward +X and
 *   faces +Z.
 * One idea: a bright blue banner rippling in soft cloth waves, carrying one bold yellow star
 *   as the focal point, on a honey-oak pole with a gold ball finial and a chunky stone base.
 * Shape language: round/soft dominant (domed stone, ball finial, rounded pole, wavy cloth
 *   hem), square secondary (the stepped base block).
 * Palette: flag blue #3f8fd6 dominant, deep blue #245a94 in the folds; honey oak #b5814a pole,
 *   warm brown #8a5a35, dark walnut #6b4226 grain; star #f2c93c accent; gold #d9a93a finial;
 *   warm stone #9a9083 base. Value plan: mid-dark cloth mass, mid wood, dark stone foot, and
 *   the bright yellow star + gold finial as the small high-contrast accent.
 * Materials: cloth (rough 0.88, metal 0), wood (rough 0.8), gold (rough 0.35, metal 0.85),
 *   stone (rough 0.9), star cloth (rough 0.78). Weave, grain, and stone speckle live in `bump`.
 * Detail: primary cloth sheet + pole + base + finial; secondary stepped base and star
 *   appliqué; tertiary weave, grain, and mottling in paint and bump. Focal point: the star.
 * Rig/animation: none (static prop).
 */

const WOOD = rgb('#b5814a');
const WOOD_MID = rgb('#8a5a35');
const WOOD_DEEP = rgb('#6b4226');
const WOOD_PALE = rgb('#c9a06a');
const BLUE = rgb('#4bb4e6');
const BLUE_DEEP = rgb('#1e5c96');
const BLUE_LIFT = rgb('#9bd8f5');
const STAR = rgb('#f7d24a');
const STAR_LIGHT = rgb('#ffe89a');
const STAR_DEEP = rgb('#b8860f');
const GOLD = '#d9a93a';
const GOLD_LIGHT = rgb('#f4d67e');
const GOLD_DEEP = rgb('#7d5813');
const STONE = '#7f7669';
const STONE_LIGHT = rgb('#bdb29c');
const STONE_DARK = rgb('#3b352c');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// ---------------------------------------------------------------- banner frame
// The banner hangs from the pole along +X. The cloth centreline ripples in Z as a sine of X;
// each panel is a flat facet tangent to that curve, so the union is a smooth corrugated sheet.
const X0 = 0.03;
const X1 = 0.86;
const W = X1 - X0;
const CLOTH_CY = 1.82;
const PANELS = 12;
const RIPPLE_A = 0.045;
const RIPPLE_L = 0.55;
const RIPPLE_PHASE = 0.486;

const phaseOf = (x: number) => (2 * Math.PI * (x - X0)) / RIPPLE_L + RIPPLE_PHASE;
const zOf = (x: number) => RIPPLE_A * Math.sin(phaseOf(x));
const slopeOf = (x: number) => RIPPLE_A * (2 * Math.PI / RIPPLE_L) * Math.cos(phaseOf(x));
/** Rotation that aligns a panel's +X with the ripple tangent (yaw about Y). */
const panelAngle = (x: number) => (-Math.atan(slopeOf(x)) * 180) / Math.PI;

/** Rippled cloth sheet of a given thickness and fold-blend, spanning the banner. */
const sheet = (thickness: number, k: number): Sdf => {
  const panels: Sdf[] = [];
  for (let i = 0; i < PANELS; i++) {
    const x = X0 + (W * i) / (PANELS - 1);
    panels.push(sdf.box([0.105, 1.5, thickness], 0.014).rotateY(panelAngle(x)).at(x, CLOTH_CY, zOf(x)));
  }
  return sdf.smoothUnion(k, ...panels);
};

// ---------------------------------------------------------------- banner outline
const topY = (x: number) => 2.3 + 0.035 * Math.sin(((x - X0) / W) * Math.PI * 2 * 0.9 + 1.4);
const botY = (x: number) => 1.33 + 0.058 * Math.sin(((x - X0) / W) * Math.PI * 2 * 1.45 + 2.2);

function bannerOutline() {
  const pts: [number, number][] = [];
  const topN = 22;
  for (let i = 0; i <= topN; i++) {
    const x = X0 + (W * i) / topN;
    pts.push([x, topY(x)]);
  }
  // Right edge, gently scalloped inward.
  const yTop = topY(X1);
  const yBot = botY(X1);
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    pts.push([X1 - 0.062 * Math.sin(Math.PI * t), yTop + (yBot - yTop) * t]);
  }
  // Bottom edge, wavy, right to left.
  const botN = 34;
  for (let i = 0; i <= botN; i++) {
    const x = X1 - (W * i) / botN;
    pts.push([x, botY(x)]);
  }
  // Left edge, straight back to the top.
  pts.push([X0, (botY(X0) + topY(X0)) / 2]);
  return profile.polygon(pts);
}

/** Five-pointed star outline (point up) centred on (cx, cy). */
function starOutline(cx: number, cy: number, outer: number, inner: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return profile.polygon(pts);
}

export default defineAsset({
  name: 'flag',
  description:
    'Blue banner with a yellow star on a honey-oak pole: rippling cloth, gold ball finial, and a stepped stone base.',
  detail: 0.008,
  reference: 'docs/item-mockups/flag-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const STAR_CX = 0.44;
    const STAR_CY = 1.78;

    // ------------------------------------------------------------------ cloth
    // Corrugated sheet trimmed by the wavy banner outline, then bevelled all round.
    const outline = sdf.extrude(bannerOutline(), 0.6, 0.02);
    const clothPaint = (x: number, y: number, z: number): Rgb => {
      const fold = Math.sin(phaseOf(x)); // +1 crest, -1 valley
      let c = BLUE;
      c = mixRgb(c, BLUE_DEEP, 0.6 * clamp01(-fold));
      c = mixRgb(c, BLUE_LIFT, 0.5 * clamp01(fold));
      // Shade into the pole at the hoist and toward the hem.
      c = mixRgb(c, BLUE_DEEP, 0.42 * clamp01((0.16 - x) / 0.16));
      const t = clamp01((y - 1.32) / 1.0);
      c = mixRgb(c, BLUE_DEEP, 0.32 * (1 - t) * (1 - t));
      c = mixRgb(c, BLUE_LIFT, 0.25 * clamp01((y - 2.05) / 0.25));
      const n = noise.fbm(x * 26, y * 26, z * 26, 2);
      c = mixRgb(c, BLUE_DEEP, clamp01(n) * 0.12);
      c = mixRgb(c, BLUE_LIFT, clamp01(-n) * 0.1);
      return c;
    };
    k.body('cloth', sdf.intersect(sheet(0.05, 0.03), outline).round(0.006).paintFn(clothPaint), {
      color: '#3f8fd6',
      roughness: 0.88,
      metalness: 0,
      detail: 0.008,
      maxError: 0.004,
      maxTriangles: 1000,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0016 * noise.fbm(x * 18, y * 3.5, z * 18, 2) + 0.0006 * noise.fbm(x * 120, y * 120, z * 120, 2),
    });

    // ------------------------------------------------------------------ star
    // A thicker cut of the same rippled sheet inside the star outline: a sewn-on appliqué
    // that follows every fold and sits a little proud of the cloth.
    const starStencil = sdf.extrude(starOutline(STAR_CX, STAR_CY, 0.14, 0.058), 0.6, 0.01);
    const starPaint = (x: number, y: number, z: number): Rgb => {
      let c = STAR;
      c = mixRgb(c, STAR_DEEP, 0.65 * clamp01((1.72 - y) / 0.16));
      c = mixRgb(c, STAR_LIGHT, 0.55 * clamp01((y - 1.84) / 0.14));
      const n = noise.fbm(x * 30, y * 30, z * 30, 2);
      c = mixRgb(c, STAR_DEEP, clamp01(n) * 0.16);
      c = mixRgb(c, STAR_LIGHT, clamp01(-n) * 0.2);
      return c;
    };
    k.body('star', sdf.intersect(sheet(0.084, 0.03), starStencil).round(0.006).paintFn(starPaint), {
      color: '#f2c93c',
      roughness: 0.78,
      metalness: 0,
      detail: 0.007,
      maxError: 0.004,
      maxTriangles: 300,
      paintWeight: 2,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 22, y * 22, z * 22, 2),
    });

    // ------------------------------------------------------------------ pole
    const pole = sdf.chain([
      [0, 0.06, 0, 0.047],
      [0, 2.42, 0, 0.027],
    ]);
    const polePaint = (x: number, y: number, z: number): Rgb => {
      let c = WOOD;
      const grain = noise.fbm(x * 7, y * 60, z * 7, 2);
      c = mixRgb(c, WOOD_MID, 0.35 * clamp01(grain));
      c = mixRgb(c, WOOD_PALE, 0.3 * clamp01(-grain));
      // A darker weathered band low on the shaft.
      c = mixRgb(c, WOOD_DEEP, 0.5 * clamp01((0.35 - y) / 0.35));
      return c;
    };
    k.body('pole', pole.paintFn(polePaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.006,
      maxError: 0.004,
      maxTriangles: 450,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 9, y * 70, z * 9, 2) + 0.0006 * noise.fbm(x * 30, y * 8, z * 30, 2),
    });

    // ------------------------------------------------------------------ finial
    // Gold ball on a short collar; the pole tips into it.
    const collar = sdf.cylinder(0.038, 0.05, 0.012).at(0, 2.42, 0);
    const ball = sdf.sphere(0.06).at(0, 2.485, 0);
    k.body('finial', sdf.smoothUnion(0.01, collar, ball).paintFn((x, y, z) => {
      let c = rgb(GOLD);
      c = mixRgb(c, GOLD_DEEP, 0.65 * clamp01((2.46 - y) / 0.06));
      c = mixRgb(c, GOLD_LIGHT, 0.5 * clamp01((y - 2.5) / 0.05));
      const n = noise.fbm(x * 40, y * 40, z * 40, 2);
      c = mixRgb(c, GOLD_DEEP, clamp01(n) * 0.16);
      return c;
    }), {
      color: GOLD,
      roughness: 0.35,
      metalness: 0.85,
      detail: 0.004,
      maxError: 0.003,
      maxTriangles: 300,
    });

    // ------------------------------------------------------------------ stone base
    // Two rounded steps: a wide low foot and a narrower top block the pole rises from.
    const ground = sdf.halfSpace([0, -1, 0], 0);
    const foot = sdf.box([0.36, 0.075, 0.36], 0.024).at(0, 0.0375, 0);
    const top = sdf.box([0.27, 0.1, 0.27], 0.028).at(0, 0.11, 0);
    const baseShape = sdf
      .smoothUnion(0.02, foot, top)
      .intersect(ground)
      .paintFn((x, y, z, base: Rgb) => {
        let c = mixRgb(base, STONE_LIGHT, 0.3 * clamp01((0.16 - y) / 0.16));
        const mottle = noise.fbm(x * 6, y * 6, z * 6, 3);
        c = mixRgb(c, STONE_DARK, clamp01(-mottle) * 0.7);
        c = mixRgb(c, STONE_LIGHT, clamp01(mottle - 0.15) * 0.3);
        // Dark seating groove between the two steps and deep contact shade at the ground.
        c = mixRgb(c, STONE_DARK, 0.55 * clamp01((0.018 - Math.abs(y - 0.075)) / 0.018));
        c = mixRgb(c, STONE_DARK, 0.7 * clamp01((0.03 - y) / 0.03));
        return c;
      });
    k.body('base', baseShape, {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.009,
      maxError: 0.004,
      maxTriangles: 360,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0022 * noise.fbm(x * 30, y * 30, z * 30, 3) + 0.0008 * noise.noise3(x * 80, y * 80, z * 80),
    });
  },
});
