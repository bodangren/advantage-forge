import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — funerary stone urn (props/containers/urn).
 *
 * Role: dungeon landmark prop for the Sunken Vault; pairs with the sarcophagus.
 *   Reads at 128 px sprite; sits on the dungeon floor or a stone plinth.
 * Size: 0.50 m tall total (body 0.36 m, lid 0.14 m), 0.34 m diameter at the
 *   belly. Stands on y = 0, faces +Z.
 * One idea: a heavy round-bellied funerary stone vessel — chamfered foot, fat
 *   belly, narrow neck, flared lip — sealed by a chunky low domed lid with a
 *   knob. A recessed band around the belly carries six carved rune marks;
 *   faint moss creeps up from the shaded ground line.
 * Shape language: round dominant (revolved body, domed lid, round knob).
 *   One angular accent (the rune band breaks the silhouette with its groove).
 * Palette: dungeon stone cool gray #6f7680 (dominant), mid #58606c, dark
 *   #4b525c, shadow #373c44, pale worn #8a8f99, moss green #5f7f4d / dark #3f5a30.
 * Materials: one stone body per part (roughness 0.92, metalness 0).
 * Detail list: primary stone body (foot, belly, neck, lip); secondary lid
 *   (dome + knob); tertiary carved rune band recess + six rune glyphs;
 *   moss stain at the ground line; stone grain in bump.
 * Rig/animation: none (static prop).
 */

const STONE = rgb('#6f7680');
const STONE_MID = rgb('#58606c');
const STONE_DARK = rgb('#4b525c');
const STONE_SHADOW = rgb('#373c44');
const STONE_PALE = rgb('#8a8f99');
const MOSS = rgb('#5f7f4d');
const MOSS_DARK = rgb('#3f5a30');
const MOSS_LIGHT = rgb('#7a9b5a');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// Two reference heights in the body — kept here so paint and bump agree.
const BAND_Y = 0.155; // centre of the carved rune band
const BAND_HALF_H = 0.022; // half-height of the band recess

/** Cool gray stone: dark base, mid belly, pale worn shoulder/foot, low-freq patches, fine grain. */
const stonePaintFn =
  (y0: number, y1: number) =>
  (x: number, y: number, z: number): Rgb => {
    const t = clamp01((y - y0) / (y1 - y0));
    let c = mixRgb(STONE_DARK, STONE, 0.18 + 0.7 * t);
    c = mixRgb(c, STONE_MID, 0.32);
    const patch = noise.fbm(x * 4.5, y * 4.5, z * 4.5, 3);
    c = mixRgb(c, STONE_DARK, clamp01(-patch) * 0.32);
    c = mixRgb(c, STONE_MID, clamp01(patch - 0.2) * 0.18);
    const grain = noise.fbm(x * 36, y * 36, z * 36, 2);
    c = mixRgb(c, STONE_DARK, clamp01(grain) * 0.16);
    // Worn pale edges at the foot rim and the lip top.
    const wearFoot = smoothstep(0.03, 0.014, Math.abs(y - 0.018));
    const wearLip = smoothstep(0.016, 0.006, Math.abs(y - 0.355));
    c = mixRgb(c, STONE_PALE, Math.max(wearFoot, wearLip) * 0.45);
    return c;
  };

/** Soft stone grain plus a recessed groove for the carved rune band. */
const bandedStoneBump =
  (bands: readonly number[]) =>
  (x: number, y: number, z: number): number => {
    let v = 0.0018 * noise.fbm(x * 36, y * 36, z * 36, 2);
    for (const b of bands) {
      const d = (y - b) / 0.014;
      v -= 0.005 * Math.exp(-d * d);
    }
    return v;
  };

/**
 * Full surface paint for the stone body. Layers stone paint, a darker paint
 * inside the recessed band, and a moss stain biased to the shaded side at the
 * ground line.
 */
const bodyPaintFn = (x: number, y: number, z: number): Rgb => {
  let c = stonePaintFn(0, 0.36)(x, y, z);
  // Recessed band: darker, with a thin pale worn edge right at the groove.
  const bandDist = Math.abs(y - BAND_Y);
  const inBand = smoothstep(BAND_HALF_H + 0.004, BAND_HALF_H - 0.002, bandDist);
  c = mixRgb(c, STONE_SHADOW, inBand * 0.85);
  const bandEdge = smoothstep(0.012, 0.003, bandDist) * (1 - inBand);
  c = mixRgb(c, STONE_PALE, bandEdge * 0.35);
  // Dark shadow under the flared lip overhang on the side away from the light.
  const lipShadowY = smoothstep(0.34, 0.30, y) * smoothstep(0.30, 0.34, y);
  if (lipShadowY > 0) {
    const angle = Math.atan2(z, x);
    const back = smoothstep(-0.3, 0.5, Math.cos(angle));
    c = mixRgb(c, STONE_SHADOW, lipShadowY * 0.5 * back);
  }
  // Faint moss stain at the ground line, biased to the shaded back side and
  // creeping up the lower belly in patches. The brief calls for a faint stain,
  // not a uniform collar — keep the front mostly clean.
  if (y < 0.07) {
    const angle = Math.atan2(z, x);
    const back = smoothstep(-0.1, 0.6, Math.cos(angle)); // 1 at back, 0 at front
    const t = noise.fbm(x * 9, y * 6, z * 9, 2);
    const t2 = noise.fbm(x * 30, y * 30, z * 30, 2);
    let moss = mixRgb(MOSS_DARK, MOSS, t);
    moss = mixRgb(moss, MOSS_LIGHT, clamp01(t2) * 0.4);
    const height = smoothstep(0.07, 0.005, y);
    const patch = clamp01(noise.fbm(x * 14, y * 5, z * 14, 2) - 0.05);
    const amt = (y < 0.04 ? 0.55 : 0.45) * height * back * (y < 0.04 ? 1 : patch);
    c = mixRgb(c, moss, amt);
  }
  return c;
};

// Six rune centres, evenly spaced around the band, with a 10° offset so they
// sit on the visible front half rather than dead-on with the +Z axis.
const RUNE_ANGLES = [10, 70, 130, 190, 250, 310];
// Each rune is a small geometric mark — different shapes so the band reads as
// a string of distinct sigils rather than six copies of the same glyph.
type Seg = readonly [number, number, number, number];
const RUNE_SHAPES: readonly (readonly Seg[])[] = [
  // 0: I-beam (vertical + two short serifs)
  [
    [-0.008, -0.026, 0.008, -0.026],
    [0, -0.026, 0, 0.026],
    [-0.01, 0.026, 0.01, 0.026],
  ],
  // 1: chevron < pointing left
  [
    [-0.022, -0.018, 0.018, -0.004],
    [0.018, -0.004, -0.022, 0.018],
  ],
  // 2: diamond / four strokes to centre
  [
    [-0.022, 0, 0, 0.022],
    [0, 0.022, 0.022, 0],
    [0.022, 0, 0, -0.022],
    [0, -0.022, -0.022, 0],
  ],
  // 3: Y-shape (vertical + V at top)
  [
    [0, 0.026, 0, -0.026],
    [-0.02, 0.014, 0, -0.026],
    [0.02, 0.014, 0, -0.026],
  ],
  // 4: X-cross
  [
    [-0.02, -0.02, 0.02, 0.02],
    [-0.02, 0.02, 0.02, -0.02],
  ],
  // 5: triangle (upward)
  [
    [-0.022, -0.016, 0.022, -0.016],
    [0.022, -0.016, 0, 0.022],
    [0, 0.022, -0.022, -0.016],
  ],
];

/**
 * Build a single stencil shape that covers all six rune glyphs, used as a
 * paintWhere region to paint the carved marks onto the stone surface.
 */
const buildRuneStencil = (bodyRadiusAtBand: number): sdf.Sdf => {
  const runeBodies: sdf.Sdf[] = [];
  for (let i = 0; i < RUNE_ANGLES.length; i++) {
    const a = (RUNE_ANGLES[i]! * Math.PI) / 180;
    const cx = Math.cos(a);
    const cz = Math.sin(a);
    const glyph = sdf.smoothUnion(
      0.003,
      ...RUNE_SHAPES[i]!.map(([x1, y1, x2, y2]) =>
        sdf.capsule([x1, BAND_Y + y1, 0], [x2, BAND_Y + y2, 0], 0.006),
      ),
    );
    runeBodies.push(glyph.rotateY(-((a * 180) / Math.PI) - 90).at(cx * bodyRadiusAtBand, 0, cz * bodyRadiusAtBand));
  }
  return sdf.union(...runeBodies);
};

export default defineAsset({
  name: 'urn',
  description:
    'Funerary stone urn: round belly, narrow neck, flared lip, domed lid with knob, carved rune band, moss stain.',
  detail: 0.008,
  reference: 'docs/item-mockups/urn-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // --------------------------------------------------------- stone body profile
    // Open outer silhouette from the central axis at the bottom, around the
    // outside, back to the axis at the top. Revolve closes on the axis.
    const bodyProfile = profile.polygon(
      [
        [0,     0.000],
        [0.108, 0.000],
        [0.118, 0.012],
        [0.122, 0.024],
        [0.126, 0.045],
        [0.140, 0.080],
        [0.158, 0.115],
        [0.165, 0.150], // belly max radius
        [0.160, 0.185],
        [0.135, 0.220],
        [0.100, 0.250],
        [0.085, 0.272],
        [0.078, 0.292], // neck
        [0.078, 0.320], // neck top (lid rests here)
        [0.095, 0.332],
        [0.115, 0.345], // flared lip
        [0.120, 0.356],
        [0,     0.358],
      ],
      { smooth: true, samples: 18 },
    );
    const bodyShape = sdf
      .revolve(bodyProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Body radius at the band (between y=0.115 r=0.158 and y=0.150 r=0.165):
    // linear interp at y=0.155 gives r ≈ 0.164.
    const bodyR = 0.164;
    // The "carved" band reads through paint only — a darker stripe with a thin
    // pale worn edge — keeping the body as a single clean solid. The rune
    // glyphs are painted onto the body via a stencil so they read as carved
    // marks without protruding past the silhouette.
    // Runestones are painted LIGHTER than the dark band so they read as carved
    // marks cut through the dark stain to the pale stone beneath.
    const runeStencil = buildRuneStencil(bodyR);
    const stone = bodyShape
      .paintFn(bodyPaintFn)
      .paintWhere(runeStencil, STONE_PALE, 0.001);

    k.body('stone', stone, {
      color: '#6f7680',
      roughness: 0.92,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      maxTriangles: 1700,
      bump: bandedStoneBump([BAND_Y]),
    });

    // ------------------------------------------------------ lid
    // Chunky low dome: stays wide at the rim, curves quickly to a low peak.
    // A small stepped collar sits between the dome and the knob.
    const LID_Y = 0.355;
    const lidProfile = profile.polygon(
      [
        [0,     0.000],
        [0.118, 0.000],
        [0.118, 0.012],
        [0.116, 0.022],
        [0.110, 0.034],
        [0.098, 0.046],
        [0.080, 0.058],
        [0.055, 0.070],
        [0.030, 0.080],
        [0.010, 0.088],
        [0,     0.092],
      ],
      { smooth: true, samples: 14 },
    );
    const lidDome = sdf.revolve(lidProfile).at(0, LID_Y, 0);

    // A thin collar where the dome meets the knob — the silhouette break.
    const collar = sdf.cylinder(0.030, 0.010, 0.004).at(0, LID_Y + 0.094, 0);

    // Knob: chunky sphere base + thinner sphere on top, blended.
    const knobBase = sdf.sphere(0.022).at(0, LID_Y + 0.108, 0);
    const knobTop = sdf.sphere(0.013).at(0, LID_Y + 0.124, 0);
    const knob = sdf.smoothUnion(0.006, knobBase, knobTop);

    const lid = sdf
      .smoothUnion(0.008, lidDome, collar, knob)
      .paintFn(stonePaintFn(LID_Y, LID_Y + 0.14));

    k.body('lid', lid, {
      color: '#6f7680',
      roughness: 0.92,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 36, y * 36, z * 36, 2),
    });
  },
});