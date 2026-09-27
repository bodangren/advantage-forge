import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — smithing hammer rack (props/craft-and-trade/hammer).
 *
 * Role: a workshop hammer rack; reads at 128 px as one stout walnut plank
 *   bearing a pair of iron-headed smithing hammers with handles hanging off
 *   the sides.
 * Size: rack ~0.45 × 0.32 × 0.18 m, sits on y = 0, faces +Z.
 * One idea: a chunky walnut plank raised on two stout walnut feet, with two
 *   iron-headed hammers side-by-side on top, their square striking faces
 *   toward the viewer and their handles extending outward over the plank's
 *   sides. Two small walnut pegs stick up at the front of the plank between
 *   the hammers, so the heads can't roll forward off the rack.
 * Shape language: square dominant (plank, feet, hammer head box, face plate),
 *   round secondary (rounded peen, pegs, slight handle taper).
 * Palette: iron #4a4f55 (head), walnut #6b4226 (handle, plank, pegs, feet),
 *   highlight #a8acb1 (iron top edge, strike face). 60/30/10.
 * Materials: worn iron (roughness 0.5, metalness 0.7), walnut wood
 *   (roughness 0.8).
 * Detail: primary plank + 2 feet + 2 pegs + 2 hammer heads + 2 handles;
 *   secondary rounded peen bulge + handle taper + raised face plate;
 *   tertiary iron top highlight + strike-face brightening + walnut grain in bump.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIGHT = rgb('#8a5c36');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Hammer dimensions (each hammer ~0.32 m long). The face is on +Z (visible from the
// front view); the handle is along X, perpendicular to the face-peen line.
const HEAD_T = 0.10;         // head thickness (along the handle axis, X) — matches HEAD_Y for a square face
const HEAD_Y = 0.10;         // head height — face is HEAD_T × HEAD_Y (a square striking surface)
const HEAD_W = 0.13;         // head length along the face-peen line (Z)
const HANDLE_R_HEAD = 0.025; // handle radius at the head end
const HANDLE_R_END = 0.019;  // handle radius at the free end (slight taper)
const HANDLE_LEN = 0.22;     // handle length; head + handle = 0.10 + 0.22 = 0.32
const HEAD_Z_OFF = 0.025;    // head center Z, head spans -0.04..+0.09 (face at +0.09, peen at -0.04)

// Rack dimensions
const PLANK_W = 0.45;
const PLANK_T = 0.04;
const PLANK_D = 0.18;
const PLANK_Y = 0.20;     // plank center y, spans 0.18..0.22

const FOOT_W = 0.05;
const FOOT_H = 0.18;      // feet hold the plank at y=0.18
const FOOT_D = 0.05;
const FOOT_X = 0.19;      // feet at the back corners
const FOOT_Z = -0.06;

const PEG_R = 0.011;
const PEG_H = 0.030;
const PEG_X = 0.06;       // pegs at the front of the plank, between the two hammers
const PEG_Z = 0.05;

const HAMMER_Y = 0.262;   // hammer handle center y (head center)
const HAMMER_X = 0.12;    // hammer X offset from origin (mirrored for L/R)

// Iron head paint: dark base, top highlight, bright strike face on the +Z end (front-facing).
const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  // Tarnish patches: gentle noise variation across the head.
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
  c = mixRgb(c, IRON_DEEP, 0.5 * tarnish);
  // Top highlight: lighter band along the top of each head.
  const top = clamp01((y - HAMMER_Y + 0.025) / 0.025);
  c = mixRgb(c, IRON_LIGHT, 0.2 * top);
  // Strike face: bright on the +Z end of each head (the square striking surface facing viewer).
  const faceMask = clamp01((z - (HEAD_Z_OFF + HEAD_W / 2 - 0.012)) / 0.012);
  c = mixRgb(c, IRON_LIGHT, 0.7 * faceMask);
  // Peen: slightly darker on the -Z end (the rounded peen bulge facing back).
  const peenMask = clamp01(((HEAD_Z_OFF - HEAD_W / 2 + 0.012) - z) / 0.02);
  c = mixRgb(c, IRON_DEEP, 0.4 * peenMask);
  // Bottom shadow
  const bottom = clamp01((HAMMER_Y - 0.025 - y) / 0.025);
  c = mixRgb(c, IRON_DEEP, 0.3 * bottom);
  return c;
};

// Walnut paint: grain, value variation, top sunlit, bottom shadowed.
const walnutPaint = (x: number, y: number, z: number) => {
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(x * 18, y * 5, z * 18, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.4 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 6 + 9, y * 6, z * 6, 2);
  c = mixRgb(c, WALNUT_LIGHT, 0.12 * patch);
  // Top sun-lit
  const top = clamp01((y - 0.05) / 0.15);
  c = mixRgb(c, WALNUT_LIGHT, 0.16 * top);
  // Bottom shadow (near y = 0)
  const low = clamp01((0.04 - y) / 0.06);
  c = mixRgb(c, WALNUT_DEEP, 0.5 * low);
  return c;
};

// Build one iron hammer head (local frame: head at origin, face on +Z, peen on -Z, eye on X).
// `sx` is the side sign: -1 places the hammer at -HAMMER_X with handle in -X direction,
// +1 places it at +HAMMER_X with handle in +X direction (mirrored).
const buildHead = (sx: number) => {
  // Main head body: a sharp-edged box.
  const body = sdf.box([HEAD_T, HEAD_Y, HEAD_W], 0.005).at(sx * HAMMER_X, HAMMER_Y, HEAD_Z_OFF);
  // Rounded peen bulge: an ellipsoid on the -Z end of the head that bulges outward,
  // giving the peen a clear rounded silhouette from any angle.
  const peen = sdf
    .ellipsoid([HEAD_T / 2 + 0.008, HEAD_Y / 2 + 0.005, 0.025])
    .at(sx * HAMMER_X, HAMMER_Y, HEAD_Z_OFF - HEAD_W / 2 + 0.005);
  // A raised face plate on the +Z end (the striking face) so the face reads as
  // a clean flat square from the front view. Painted bright to look like a polished
  // striking surface.
  const facePlate = sdf
    .box([HEAD_T - 0.008, HEAD_Y - 0.008, 0.008], 0.002)
    .at(sx * HAMMER_X, HAMMER_Y, HEAD_Z_OFF + HEAD_W / 2 + 0.004)
    .paint(IRON_LIGHT);
  // Combine: peen blends into the body, face plate sits proud on the front face.
  const head = sdf.smoothUnion(0.005, body, peen);
  return sdf.union(head, facePlate);
};

export default defineAsset({
  name: 'hammer',
  description:
    'Stout walnut hammer rack on two short walnut feet, bearing a pair of iron-headed smithing hammers with walnut handles, square faces toward the viewer and rounded peens toward the back, handles hanging off the sides.',
  detail: 0.005,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ----------------------------------------------------------- rack walnut body
    // Plank: the top board where the hammers rest.
    const plank = sdf.box([PLANK_W, PLANK_T, PLANK_D], 0.008).at(0, PLANK_Y, 0);
    // Feet: two short fat walnut blocks at the back corners, holding the plank up.
    const foot = (sx: number) =>
      sdf.box([FOOT_W, FOOT_H, FOOT_D], 0.005).at(sx * FOOT_X, FOOT_H / 2, FOOT_Z);
    // Pegs: two short cylinders sticking up from the plank top, between the hammers,
    // acting as stops so the heads can't roll forward off the rack.
    const peg = (sx: number) =>
      sdf
        .cylinder(PEG_R, PEG_H, 0.003)
        .at(sx * PEG_X, PLANK_Y + PLANK_T / 2 + PEG_H / 2, PEG_Z);
    // Handles: tapered cones going outward from each head's outer X face to the free end.
    // For sx=-1 (hammer L), handle extends in -X direction (to the left).
    // For sx=+1 (hammer R), handle extends in +X direction (to the right).
    const handle = (sx: number) =>
      sdf.cone(
        [sx * (HAMMER_X + HEAD_T / 2 - 0.012), HAMMER_Y, HEAD_Z_OFF],
        [sx * (HAMMER_X + HEAD_T / 2 + HANDLE_LEN), HAMMER_Y, HEAD_Z_OFF],
        HANDLE_R_HEAD,
        HANDLE_R_END,
      );

    const walnut = plank
      .union(foot(1), foot(-1))
      .union(peg(1), peg(-1))
      .union(handle(1), handle(-1))
      .paintFn(walnutPaint);

    k.body('walnut', walnut, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.001 * (noise.fbm(x * 24, y * 5, z * 24, 2) - 0.5),
      maxTriangles: 1800,
    });

    // ----------------------------------------------------------- iron hammer heads
    const headL = buildHead(-1).paintFn(ironPaint);
    const headR = headL.mirror('x', 0).paintFn(ironPaint);
    k.body(
      'iron',
      sdf.union(headL, headR),
      {
        color: '#4a4f55',
        roughness: 0.5,
        metalness: 0.7,
        detail: 0.0045,
        paintWeight: 2,
        bump: (x, y, z) => 0.0005 * noise.fbm(x * 40, y * 40, z * 40, 2),
        maxTriangles: 1800,
      },
    );
  },
});