import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/building-parts/window — standalone cottage window with open shutters and flowers.
 *
 * Role: a building part for the Chibi Quest hamlet (batch anchor `chibi-quest.png`); reads at
 *   128 px as a silhouette, sibling of `plaster-wall-window`. Standalone: no wall around it.
 * Size: frame 0.8 m wide (X) x 0.9 m tall (Y) x 0.15 m deep (Z), stands on y = 0, faces +Z,
 *   centred on the Y axis. Flower box sits at the base, in front of the frame.
 * One idea: a warm honey-oak cottage window whose two sage shutters stand open like wings,
 *   with a splash of red flowers at its foot — the charming detail of the facade.
 * Shape language: square and sturdy (reliable building part) with soft bevels (friendly chibi).
 * Palette: honey oak #b5814a frame (dominant), pale cut wood #c9a06a cross + sill, warm brown
 *   #8a5a35 planter, sage green #5cb85c shutters/foliage, red #e0533d flowers (accent).
 * Value plan: mid-value wood frame, near-dark glass (focal contrast), light pale cross,
 *   small saturated red blooms as the strongest hue accent. 60/30/10.
 * Materials: wood frame (0.8), pale wood (0.8), painted shutter boards (0.75), glass
 *   (0.12, opacity 0.4, faint warm emissive), worn iron straps (0.5 / metal 0.7),
 *   planter wood (0.8), foliage (0.9), petals (0.6), flower centers (0.6).
 * Detail list: (1) proud frame + deep sill, (2) recessed 4-pane glass + pale muntin cross
 *   (focal), (3) two shutter leaves canted open with battens + iron strap hinges,
 *   (4) plank planter with foliage mound + 7 red blooms. No rig/animation (static part).
 */

// ------------------------------------------------------------------ palette (scene contract)
const HONEY = rgb('#b5814a'); // honey oak — frame
const PALE = rgb('#c9a06a'); // pale cut wood — muntin cross, sill
const WARM = rgb('#8a5a35'); // warm brown — planter
const WALNUT = rgb('#6b4226'); // dark walnut — grooves, grain
const SAGE = mixRgb(rgb('#5cb85c'), rgb('#f2eadb'), 0.22); // softened leaf green — shutters
const SAGE_LIGHT = mixRgb(SAGE, rgb('#f2eadb'), 0.35);
const SAGE_DARK = mixRgb(rgb('#5cb85c'), rgb('#2f5a2a'), 0.45);
const LEAF = rgb('#5cb85c'); // leaf green — foliage
const LEAF_LIGHT = mixRgb(LEAF, rgb('#9cc45a'), 0.5);
const LEAF_DARK = rgb('#3d7a35');
const RED = rgb('#e0533d'); // flower petals
const STRAW = rgb('#e0bb60'); // flower centers
const IRON = rgb('#4a4f55'); // worn iron
const GLASS_DARK = rgb('#241a12'); // dark base under the warm glow
const GLASS_GLOW = rgb('#d98a3a'); // faint lit-from-inside warmth

// ------------------------------------------------------------------ layout (meters)
const WIN_H = 0.9;
const CY = WIN_H / 2; // 0.45 — frame centre
const OPEN_W = 0.64; // window opening
const OPEN_H = 0.74;
const FRAME_FRONT = 0.075; // half of the 0.15 m frame depth
const SHUTTER_TILT = 30; // degrees the open leaves cant out from the window plane
const HINGE_X = 0.4; // hinge line: outer frame edge
const HINGE_Z = 0.085; // shutter panel centre plane, just proud of the frame front

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Smooth groove weight: 1 at a board edge, 0 at the board centre. */
const grooveAt = (f: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 3);

export default defineAsset({
  name: 'window',
  description:
    'Standalone cottage window, 0.8 x 0.9 m: honey-oak frame with a deep sill, four see-through glass panes behind a pale cross bar, two sage shutter leaves standing open on iron strap hinges, and a plank flower box with red blooms at its foot.',
  detail: 0.009,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/window-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- frame + sill (honey oak)
    // Rounded slab with the opening cut through; the cut's rounded edge softens the reveal.
    const opening = sdf.box([OPEN_W, OPEN_H, 0.5], 0.01).at(0, CY, 0);
    const frameBox = sdf.box([0.8, WIN_H, 0.15], 0.02).at(0, CY, 0).subtract(opening);
    // Chunky deep sill, proud of the frame on both faces.
    const sill = sdf.box([0.92, 0.07, 0.25], 0.015).at(0, 0.035, 0.02);
    const framePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const tint = noise.fbm(x * 2.4, y * 2.4, z * 2.4, 3, 7);
      let c = mixRgb(base, PALE, clamp01(tint) * 0.3);
      c = mixRgb(c, WARM, clamp01(-tint) * 0.32);
      // Grain streaks; reads as wood at arm's length without plank geometry.
      const grain = noise.fbm(x * 3.2, y * 26, z * 26, 2, 9);
      c = mixRgb(c, WALNUT, clamp01(-grain) * 0.16);
      c = mixRgb(c, PALE, clamp01(grain) * 0.1);
      return c;
    };
    k.body('frame', sdf.smoothUnion(0.01, frameBox, sill).paintFn(framePaint), {
      color: HONEY,
      roughness: 0.8,
      metalness: 0,
      detail: 0.009,
      maxError: 0.004,
      maxTriangles: 1600,
      paintWeight: 2,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 30, y * 30, z * 30, 2, 8),
    });

    // ---------------------------------------------------------------- pale muntin cross
    // The cross bar over the glass: pale cut wood, slightly recessed from the frame front.
    const muntinV = sdf.box([0.05, OPEN_H, 0.06], 0.008).at(0, CY, 0.03);
    const muntinH = sdf.box([OPEN_W, 0.05, 0.06], 0.008).at(0, CY, 0.03);
    k.body('muntin', sdf.union(muntinV, muntinH), {
      color: PALE,
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      maxError: 0.003,
      maxTriangles: 300,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 34, y * 34, z * 34, 2, 11),
    });

    // ---------------------------------------------------------------- four glass panes
    // See-through (opacity 0.4), dark base with a faint warm emissive: lit from inside.
    const pane = (sx: number, top: boolean): Sdf =>
      sdf
        .box([0.285, 0.335, 0.014], 0.004)
        .at(sx * 0.1675, top ? 0.6525 : 0.2475, -0.02);
    k.body(
      'glass',
      sdf.union(pane(-1, false), pane(1, false), pane(-1, true), pane(1, true)),
      {
        color: GLASS_DARK,
        roughness: 0.12,
        metalness: 0.1,
        opacity: 0.4,
        emissive: GLASS_GLOW,
        emissiveIntensity: 0.12,
        detail: 0.007,
        maxTriangles: 100,
      },
    );

    // ---------------------------------------------------------------- shutters, standing open
    // Two leaves hinged at the outer frame edge, canted toward the viewer like wings.
    const leaf = (side: 1 | -1): Sdf => {
      const swing = (s: Sdf): Sdf => s.rotateY(side * -SHUTTER_TILT).at(side * HINGE_X, CY, HINGE_Z);
      const panel = swing(sdf.box([0.36, 0.76, 0.035], 0.012).at(side * 0.18, 0, 0));
      const batten = (dy: number): Sdf =>
        swing(sdf.box([0.27, 0.085, 0.018], 0.007).at(side * 0.18, dy, 0.0265));
      return sdf.union(panel, batten(0.24), batten(-0.24));
    };
    const shutterPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const tint = noise.fbm(x * 7, y * 7, z * 7, 3, 4);
      let c = mixRgb(base, SAGE_LIGHT, clamp01(tint) * 0.28);
      c = mixRgb(c, SAGE_DARK, clamp01(-tint) * 0.22);
      return c;
    };
    k.body('shutters', sdf.union(leaf(1), leaf(-1)).paintFn(shutterPaint), {
      color: SAGE,
      roughness: 0.75,
      metalness: 0,
      detail: 0.009,
      maxError: 0.004,
      maxTriangles: 800,
      paintWeight: 2,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 26, y * 6, z * 26, 2, 12),
    });

    // ---------------------------------------------------------------- iron strap hinges
    // Straps lie on the leaf face near the hinge edge, with a small barrel knuckle.
    const rad = (SHUTTER_TILT * Math.PI) / 180;
    const strapZ = HINGE_Z + Math.sin(rad) * 0.1 + Math.cos(rad) * (0.0175 + 0.006);
    const knuckleZ = HINGE_Z + Math.cos(rad) * 0.0175;
    const hinge = (side: 1 | -1, hy: number): Sdf =>
      sdf
        .box([0.16, 0.036, 0.012], 0.005)
        .at(side * 0.1, 0, 0)
        .rotateY(side * -SHUTTER_TILT)
        .at(side * HINGE_X, hy, strapZ)
        .union(sdf.cylinder(0.014, 0.06, 0.004).at(side * HINGE_X, hy, knuckleZ));
    k.body('iron', sdf.union(hinge(1, 0.2), hinge(1, 0.7), hinge(-1, 0.2), hinge(-1, 0.7)), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.007,
      maxError: 0.003,
      maxTriangles: 260,
    });

    // ---------------------------------------------------------------- flower box (plank planter)
    const planter = sdf.box([0.74, 0.18, 0.26], 0.015).at(0, 0.09, 0.22);
    const planterPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const bi = Math.floor(y / 0.06);
      const f = y / 0.06 - bi;
      const tint = noise.random(bi, 5, 2);
      let c = mixRgb(base, HONEY, 0.25 * tint);
      c = mixRgb(c, WALNUT, 0.55 * grooveAt(f));
      const grain = noise.fbm(x * 26, y * 3, z * 26, 2, 6);
      c = mixRgb(c, WALNUT, clamp01(-grain) * 0.18);
      return c;
    };
    k.body('planter', planter.paintFn(planterPaint), {
      color: WARM,
      roughness: 0.8,
      metalness: 0,
      detail: 0.01,
      maxError: 0.004,
      maxTriangles: 500,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.002 * noise.fbm(x * 30, y * 30, z * 30, 2, 13) + 0.0012 * noise.noise3(x * 80, y * 80, z * 80, 5),
    });

    // ---------------------------------------------------------------- foliage + red flowers
    const foliage = sdf
      .ellipsoid([0.33, 0.115, 0.15])
      .displace(0.006, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 3, 3))
      .at(0, 0.215, 0.22);
    const leafPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const tint = noise.fbm(x * 10, y * 10, z * 10, 3, 8);
      let c = mixRgb(base, LEAF_LIGHT, clamp01(tint) * 0.3);
      c = mixRgb(c, LEAF_DARK, clamp01(-tint) * 0.35);
      return c;
    };
    k.body('foliage', foliage.paintFn(leafPaint), {
      color: LEAF,
      roughness: 0.9,
      metalness: 0,
      detail: 0.01,
      maxError: 0.004,
      maxTriangles: 600,
      paintWeight: 2,
    });

    const heads: [number, number, number][] = [
      [-0.25, 0.37, 0.28],
      [-0.14, 0.41, 0.3],
      [0.0, 0.38, 0.24],
      [0.14, 0.42, 0.31],
      [0.26, 0.36, 0.28],
      [0.05, 0.37, 0.36],
      [-0.05, 0.44, 0.29],
    ];
    k.body(
      'flowers',
      sdf.union(...heads.map(([x, y, z]) => sdf.sphere(0.04).at(x, y, z))),
      { color: RED, roughness: 0.6, metalness: 0, detail: 0.006, maxTriangles: 500 },
    );
    k.body(
      'flower-centers',
      sdf.union(...heads.map(([x, y, z]) => sdf.sphere(0.013).at(x, y + 0.018, z + 0.03))),
      { color: STRAW, roughness: 0.6, metalness: 0, detail: 0.005, maxTriangles: 200 },
    );
  },
});
