import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — carpenter hand saw (props/craft-and-trade/saw).
 *
 * Role: a workshop hand saw; reads at 128 px as a thin tapered steel blade with
 *   visible chunky teeth attached to a chunky closed honey-walnut D-handle.
 * Size: 0.6 m long (0.45 m blade + 0.15 m handle), lying flat on y = 0, blade
 *   extending in -X, handle on +X, teeth on +Z (the asset's "front").
 * One idea: a thin tapered steel blade tapering from wide at the handle to a
 *   narrow rounded tip, with prominent triangular teeth on the front edge,
 *   joined to a chunky closed-grip wooden handle with two visible iron rivets.
 * Shape language: square dominant (flat blade, chunky handle spine), triangular
 *   secondary (teeth, tapered tip).
 * Palette: steel blade #c8ccd2 (polished steel); walnut handle #6b4226 / deep
 *   #54331d; iron rivets #4a4f55. 60/30/10 — steel dominant, walnut secondary,
 *   iron rivets accent.
 * Materials: polished steel (roughness 0.3, metalness 1), walnut wood
 *   (roughness 0.8), worn iron (roughness 0.5, metalness 0.7).
 * Detail: primary tapered blade + closed handle; secondary chunky teeth + finger
 *   hole + three rivets; tertiary faint steel sheen variation and walnut grain
 *   in bump.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const STEEL = rgb('#c8ccd2');
const STEEL_DEEP = rgb('#8e959e');
const STEEL_LIGHT = rgb('#dde1e6');
const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIGHT = rgb('#8a5c36');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ---------------------------------------------------------------- dimensions
// Saw lies on y = 0, blade extends in -X, handle on +X, teeth on +Z.
const BLADE_LEN = 0.46;
const BLADE_WIDTH_HANDLE = 0.082;
const BLADE_WIDTH_TIP = 0.034;
const BLADE_THICKNESS = 0.006;
const N_TEETH = 9;
const TOOTH_HEIGHT = 0.018;

const HANDLE_LEN = 0.165;
const HANDLE_WIDTH = 0.115;
const HANDLE_THICKNESS = 0.038;

// ---------------------------------------------------------------- blade outline
// 2D profile in XY (profile X = world X length, profile Y = world Z width).
// Extruded in Z by BLADE_THICKNESS, then rotateX(90) so profile Y becomes
// world Z and extrusion Z becomes world Y; translate +BLADE_THICKNESS in Y so
// the bottom face sits on y = 0.
const buildBladeOutline = (): [number, number][] => {
  const pts: [number, number][] = [];

  // Handle end of blade, bottom edge
  pts.push([0, -BLADE_WIDTH_HANDLE / 2]);

  // Tapered bottom edge to the rounded tip
  pts.push([-BLADE_LEN + 0.018, -BLADE_WIDTH_TIP / 2 + 0.003]);
  pts.push([-BLADE_LEN + 0.005, -BLADE_WIDTH_TIP / 3]);
  pts.push([-BLADE_LEN, -BLADE_WIDTH_TIP / 3.5]);
  pts.push([-BLADE_LEN, BLADE_WIDTH_TIP / 3.5]);
  pts.push([-BLADE_LEN + 0.005, BLADE_WIDTH_TIP / 3]);
  pts.push([-BLADE_LEN + 0.018, BLADE_WIDTH_TIP / 2 - 0.003]);

  // Toothed top edge from tip back toward handle (profile Y is the blade's
  // world-Z extent, so positive Y is the +Z tooth edge).
  for (let i = 0; i < N_TEETH; i++) {
    const tPeak = (i + 0.5) / N_TEETH;
    const tNext = (i + 1) / N_TEETH;
    const xPeak = -BLADE_LEN + tPeak * BLADE_LEN;
    const xNext = -BLADE_LEN + tNext * BLADE_LEN;
    const zBasePeak =
      BLADE_WIDTH_TIP / 2 +
      ((BLADE_WIDTH_HANDLE - BLADE_WIDTH_TIP) / 2) * tPeak;
    const zBaseNext =
      BLADE_WIDTH_TIP / 2 +
      ((BLADE_WIDTH_HANDLE - BLADE_WIDTH_TIP) / 2) * tNext;

    pts.push([xPeak, zBasePeak + TOOTH_HEIGHT]);
    if (i < N_TEETH - 1) {
      pts.push([xNext, zBaseNext]);
    }
  }

  // Handle end of blade, top edge
  pts.push([0, BLADE_WIDTH_HANDLE / 2]);

  return pts;
};

const bladeProfile = profile.polygon(buildBladeOutline());
const bladeShape = sdf
  .extrude(bladeProfile, BLADE_THICKNESS, 0.0015)
  .rotateX(90)
  .at(0, BLADE_THICKNESS, 0);

// ---------------------------------------------------------------- handle
// Closed D-grip: two fat wooden lobes at +Z and -Z connected by a spine,
// with a clear finger hole through the middle (in Y). Sits flat on y = 0.
const HANDLE_Y = HANDLE_THICKNESS / 2;

const handleSpine = sdf
  .box([HANDLE_LEN, HANDLE_THICKNESS, HANDLE_WIDTH], 0.016)
  .at(HANDLE_LEN / 2, HANDLE_Y, 0);

// Lobes: flattened ellipsoids so they bulge in Z but stay within the handle
// thickness in Y. They sit on top of the spine with a visible bump.
const handleFrontLobe = sdf
  .ellipsoid([HANDLE_LEN * 0.42, 0.017, 0.036])
  .at(HANDLE_LEN / 2, HANDLE_Y, HANDLE_WIDTH / 2 + 0.018);
const handleBackLobe = sdf
  .ellipsoid([HANDLE_LEN * 0.42, 0.017, 0.036])
  .at(HANDLE_LEN / 2, HANDLE_Y, -HANDLE_WIDTH / 2 - 0.018);

// Union the spine with each lobe separately, then union the two halves so
// each lobe stays distinct instead of merging into one wide blob.
const handleWithFront = handleSpine.smoothUnion(0.012, handleFrontLobe);
const handleWithBack = handleSpine.smoothUnion(0.012, handleBackLobe);
const handleOuter = handleWithFront.union(handleWithBack);

// Finger hole through the middle — a clear slot in Y direction. Wide enough
// to be readable, narrow enough that the lobes stay connected via the spine.
const fingerHole = sdf
  .box([HANDLE_LEN * 0.62, HANDLE_THICKNESS * 2, HANDLE_WIDTH * 0.40], 0.018)
  .at(HANDLE_LEN / 2, HANDLE_Y, 0);

const handleShape = handleOuter.subtract(fingerHole);

// ---------------------------------------------------------------- rivets
// Three iron pin heads on top of the handle where the blade attaches — they
// sit just proud of the handle top so they read as metal dots from above.
const RIVET_TOP_Y = HANDLE_THICKNESS - 0.001;
const rivetShape = (xPos: number, zPos: number) =>
  sdf.sphere(0.0075).at(xPos, RIVET_TOP_Y, zPos);
const rivets = rivetShape(0.022, 0.032)
  .union(rivetShape(HANDLE_LEN / 2, 0.032))
  .union(rivetShape(HANDLE_LEN - 0.022, 0.032));

// ---------------------------------------------------------------- paint
// Steel blade: mostly polished steel, slightly darker near the handle where
// it's not the cutting edge, and a darker inner band along the teeth valley.
const steelPaint = (x: number, y: number, z: number) => {
  let c = STEEL;
  // Broad sheen variation.
  const sheen = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2);
  c = mixRgb(c, STEEL_DEEP, 0.22 * sheen);
  // Faint horizontal streaks (long axis of blade).
  const streak = 0.5 + 0.5 * noise.fbm(x * 60, y * 4, z * 60, 2);
  c = mixRgb(c, STEEL_LIGHT, 0.18 * streak);
  // Darker toward the handle (less polished near the rivets).
  const atHandle = clamp01((0.0 - x) / 0.05);
  c = mixRgb(c, STEEL_DEEP, 0.45 * atHandle);
  return c;
};

// Walnut paint: grain along the X axis (along the handle's long axis),
// warmer where the light hits, darker in crevices.
const walnutPaint = (x: number, y: number, z: number) => {
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 4, z * 30, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.35 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 7 + 5, y * 7, z * 7, 2);
  c = mixRgb(c, WALNUT_LIGHT, 0.14 * patch);
  const top = clamp01((y - 0.008) / 0.018);
  c = mixRgb(c, WALNUT_LIGHT, 0.18 * top);
  return c;
};

export default defineAsset({
  name: 'saw',
  description:
    'Carpenter hand saw, 0.6 m: a tapered polished steel blade with chunky triangular teeth on the cutting edge, attached by three iron rivets to a closed honey-walnut D-handle.',
  detail: 0.005,
  reference: 'docs/item-mockups/saw-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    k.body('blade', bladeShape.paintFn(steelPaint), {
      color: '#c8ccd2',
      roughness: 0.3,
      metalness: 1,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 60, y * 30, z * 60, 2),
      maxTriangles: 1200,
    });

    k.body('handle', handleShape.paintFn(walnutPaint), {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.001 * (noise.fbm(x * 24, y * 5, z * 24, 2) - 0.5),
      maxTriangles: 1500,
    });

    k.body('rivets', rivets.paint(IRON), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0035,
      maxTriangles: 250,
    });
  },
});