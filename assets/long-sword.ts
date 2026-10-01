import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Long sword (common shop version), about 1.0 m, standing on its round pommel with the blade up
 * (+Y); the flat of the blade faces +Z. Plain steel lens-section blade with a fuller groove, a
 * straight iron crossguard with ball ends, a brown leather wrap grip, and a round iron pommel.
 *
 * Role: shop-stock melee weapon / pickup icon; reads as a bold vertical silhouette at 128 px.
 * Size: 1.0 m tall, grip centre near y = 0.11, on y = 0, centred on the Y axis.
 * One idea: a clean, chunky vertical steel blade with a heavy ball-guard, no ornament.
 * Shape language: round (balls, pommel, soft bevels) over a long straight square-ish blade.
 * Palette: steel #c8ccd2 (light, dominant), iron #4a4f55 with #363a3f shadow and #a8acb1
 *   highlight, leather #6e4526 (warm mid accent at the grip).
 * Materials: steel (metalness 1, rough 0.26), iron (0.7 / 0.5), leather (0 / 0.72).
 * Detail: blade + fuller (focal), ball guard, wrapped grip, round pommel.
 * Rig/animation: none; a static item.
 */

const IRON = '#4a4f55';
const IRON_SHADOW = '#363a3f';
const IRON_HILITE = '#a8acb1';
const STEEL = '#c8ccd2';
const STEEL_FULLER = '#aab0b7';
const LEATHER = '#6e4526';

const TOTAL = 1.0;
const POMMEL_Y = 0.036;
const GRIP_BOT = 0.068;
const GRIP_TOP = 0.163;
const GUARD_Y = 0.18;
const GUARD_HALF = 0.096;
const BLADE_BASE = GUARD_Y;
const BLADE_LEN = TOTAL - BLADE_BASE;
const BLADE_W = 0.064;
const BLADE_T = 0.015;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'long-sword',
  description: 'Plain steel longsword with an iron crossguard and a leather-wrapped grip.',
  reference: 'docs/item-mockups/long-sword-mock.jpg',
  detail: 0.004,
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.115, 0] },

  build(k) {
    // ------------------------------------------------------------------ blade
    // Outline: straight edges that run up, then taper into a spear-like point.
    const outline = profile.polygon([
      [-BLADE_W / 2, 0],
      [BLADE_W / 2, 0],
      [(BLADE_W / 2) * 0.93, BLADE_LEN * 0.74],
      [0, BLADE_LEN],
      [(-BLADE_W / 2) * 0.93, BLADE_LEN * 0.74],
    ]);
    // Lens cross-section: the overlap of two big upright cylinders.
    const R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const lens = sdf.intersect(
      sdf.cylinder(R, BLADE_LEN * 1.6).at(0, BLADE_LEN / 2, R - BLADE_T / 2),
      sdf.cylinder(R, BLADE_LEN * 1.6).at(0, BLADE_LEN / 2, -(R - BLADE_T / 2)),
    );
    // A shallow fuller groove down the middle of both faces.
    const fuller = sdf
      .capsule([0, 0.035, 0], [0, BLADE_LEN * 0.66, 0], 0.008)
      .scale([1, 1, 0.35])
      .at(0, 0, BLADE_T / 2 + 0.001)
      .mirror('z', 0);
    const blade = sdf
      .extrude(outline, 0.2, 0.0015)
      .intersect(lens)
      .smoothSubtract(0.0025, fuller)
      .at(0, BLADE_BASE, 0)
      .paintWhere(
        sdf.extrude(profile.rect([0.018, BLADE_LEN * 1.4]), 0.2).at(0, BLADE_BASE, 0),
        STEEL_FULLER,
        0.003,
      );
    k.body('blade', blade, {
      color: STEEL,
      roughness: 0.26,
      metalness: 1,
      detail: 0.0025,
      bump: (x, y, z) => 0.00025 * noise.fbm(x * 400, y * 24, z * 400, 2), // brushed steel
    });

    // ------------------------------------------------------------------ iron guard and pommel
    const cIron = rgb(IRON);
    const cShadow = rgb(IRON_SHADOW);
    const cHilite = rgb(IRON_HILITE);
    // A vertical three-stop gradient: shadow at the bottom through base to highlight on top.
    const ironShade = (centerY: number, half: number) => (x: number, y: number, z: number) => {
      const t = clamp01((y - (centerY - half)) / (2 * half));
      return t < 0.5 ? mixRgb(cShadow, cIron, t * 2) : mixRgb(cIron, cHilite, (t - 0.5) * 2);
    };

    const guard = sdf
      .union(
        sdf.capsule([-GUARD_HALF, GUARD_Y, 0], [GUARD_HALF, GUARD_Y, 0], 0.014),
        sdf.sphere(0.023).at(GUARD_HALF + 0.01, GUARD_Y, 0).mirror('x', 0),
        sdf.ellipsoid([0.03, 0.036, 0.036]).at(0, GUARD_Y, 0),
      )
      .paintFn(ironShade(GUARD_Y, 0.019));

    const pommel = sdf
      .ellipsoid([0.037, 0.036, 0.037])
      .at(0, POMMEL_Y, 0)
      .paintFn(ironShade(POMMEL_Y, 0.037));

    k.body('iron', sdf.union(guard, pommel), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 60, y * 60, z * 60, 2), // worn cast iron
    });

    // ------------------------------------------------------------------ leather grip
    const core = sdf
      .cylinder(0.018, GRIP_TOP - GRIP_BOT, 0.006)
      .at(0, (GRIP_BOT + GRIP_TOP) / 2, 0);
    // Wrap coils: raised rings around the core so the grip reads at sprite size.
    const ringYs = [0.082, 0.0995, 0.117, 0.1345, 0.152];
    const wraps = ringYs.map((y) => sdf.torus(0.019, 0.0045).at(0, y, 0));
    const grip = sdf.smoothUnion(0.002, core, ...wraps);
    k.body('grip', grip, {
      color: LEATHER,
      roughness: 0.72,
      metalness: 0,
      detail: 0.0035,
      bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(Math.atan2(z, x) + y * 170)),
    });
  },
});
