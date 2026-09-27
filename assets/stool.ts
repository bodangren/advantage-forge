import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — round tavern stool (props/furniture/stool).
 *
 * Role: background seat prop for the tavern set; at 128 px it must read as a disc on legs.
 * Size: 0.38 m seat diameter, 0.45 m tall, stands on y = 0, faces +Z.
 * One idea: a thick honey-oak disc perched on three splayed round legs, tied low by a ring.
 * Shape language: round dominant (disc, round legs, ring), soft bevels everywhere.
 * Palette: seat honey oak #b5814a (light), legs warm brown #8a5a35 (dark),
 *   pale cut wood #c9a06a on the worn rim and scuffed feet (accent).
 * Materials: wood, roughness 0.8, metalness 0; grain lives in `bump`.
 * Detail: primary disc + 3 splayed legs + ring stretcher; secondary bevel and edge wear;
 *   tertiary grain. Focal point: the pale worn rim of the seat.
 * Rig/animation: none (static prop).
 */

const HONEY = rgb('#b5814a'); // seat, honey oak
const WARM = rgb('#8a5a35'); // legs and stretcher, warm brown
const PALE = rgb('#c9a06a'); // pale cut wood, edge wear
const DARK = rgb('#5c3a1f'); // shaded grain, a dark shade of the same family

const SEAT_R = 0.19; // 0.38 m diameter
const SEAT_TOP = 0.45;
const SEAT_BOTTOM = 0.385;

const LEG_TOP_Y = 0.4; // axis point inside the seat
const LEG_TOP_R = 0.1; // axis radius under the seat
const LEG_FOOT_R = 0.172; // axis radius at the floor (the splay)
const LEG_TOP_RAD = 0.03; // leg thickness at the top
const LEG_BOT_RAD = 0.021; // leg thickness at the foot
const LEG_ANGLES = [90, 210, 330]; // one leg toward +Z, two splayed behind

const RING_Y = 0.14; // low stretcher
const RING_TUBE = 0.016;

/** Radius of a leg axis at height y (linear from seat to floor). */
const legAxisR = (y: number) =>
  LEG_TOP_R + (LEG_FOOT_R - LEG_TOP_R) * ((LEG_TOP_Y - y) / (LEG_TOP_Y + 0.01));
const RING_R = legAxisR(RING_Y);

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'stool',
  description: 'Round tavern stool: thick honey-oak seat on three splayed legs with a low ring stretcher.',
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  detail: 0.007,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ seat
    // Revolved disc: flat underside, rounded rim, gently crowned top (soft bevel).
    const seatProfile = profile.polygon(
      [
        [0, SEAT_BOTTOM + 0.003],
        [0.09, SEAT_BOTTOM + 0.002],
        [0.146, SEAT_BOTTOM + 0.006],
        [0.177, SEAT_BOTTOM + 0.018],
        [SEAT_R, 0.411],
        [SEAT_R - 0.003, 0.424],
        [0.183, 0.432],
        [0.168, 0.4395],
        [0.14, 0.4435],
        [0.095, 0.4447],
        [0.05, SEAT_TOP - 0.005],
        [0, SEAT_TOP - 0.005],
      ],
      { smooth: true, samples: 16 },
    );
    // Grain runs across the disc (plank direction X), with pale worn rim and shaded underside.
    const seatPaint = (x: number, y: number, z: number) => {
      const r = Math.hypot(x, z);
      const streak = 0.5 + 0.5 * noise.fbm(x * 5, z * 44, y * 8, 3);
      let c = mixRgb(HONEY, PALE, 0.2 * streak);
      c = mixRgb(c, DARK, 0.14 * (1 - streak));
      // Shaded underside and lower rim, so the seat reads light over dark.
      c = mixRgb(c, DARK, 0.55 * smoothstep(0.418, 0.396, y));
      // Pale cut wood where the top edge has been rubbed raw; patchy, strongest on the bevel.
      const patch = 0.55 + 0.45 * noise.fbm(x * 16, y * 16, z * 16, 2);
      c = mixRgb(c, PALE, 0.85 * smoothstep(0.176, 0.19, r) * patch * smoothstep(0.408, 0.422, y));
      return c;
    };
    k.body('seat', sdf.revolve(seatProfile).paintFn(seatPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 2000,
      bump: (x, y, z) => {
        const streak = 0.5 + 0.5 * noise.fbm(x * 5, z * 44, y * 8, 3);
        return -0.0015 * streak + 0.0005 * noise.fbm(x * 70, y * 70, z * 70, 2);
      },
    });

    // ------------------------------------------------------------------ legs
    // Three round legs, thicker at the top, splayed out to the floor.
    const legAt = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      const cx = Math.cos(a);
      const cz = Math.sin(a);
      return sdf.cone(
        [cx * LEG_TOP_R, LEG_TOP_Y, cz * LEG_TOP_R],
        [cx * LEG_FOOT_R, 0, cz * LEG_FOOT_R],
        LEG_TOP_RAD,
        LEG_BOT_RAD,
      );
    };
    const legShape = sdf
      .union(...LEG_ANGLES.map(legAt))
      // Flat feet on the ground plane.
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const legPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 34, y * 5, z * 34, 2);
      let c = mixRgb(WARM, DARK, 0.12 + 0.16 * grain);
      // Scuffed pale feet where the stool gets kicked around.
      const scuff = 0.5 + 0.5 * noise.fbm(x * 24, y * 40, z * 24, 2);
      c = mixRgb(c, PALE, 0.35 * smoothstep(0.03, 0.0, y) * scuff);
      // Darker in the shade right under the seat.
      c = mixRgb(c, DARK, 0.3 * smoothstep(0.34, 0.4, y));
      return c;
    };
    k.body('legs', legShape.paintFn(legPaint), {
      color: '#8a5a35',
      roughness: 0.8,
      metalness: 0,
      detail: 0.007,
      paintWeight: 2,
      maxTriangles: 1300,
      bump: (x, y, z) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 34, y * 5, z * 34, 2);
        return -0.0012 * grain + 0.0004 * noise.fbm(x * 60, y * 60, z * 60, 2);
      },
    });

    // ------------------------------------------------------------- stretcher
    // Low ring that runs straight through the three legs and joins them.
    const ring = sdf.torus(RING_R, RING_TUBE).at(0, RING_Y, 0);
    k.body(
      'stretcher',
      ring.paintFn((x, y, z) => {
        // The ring sits in the seat's shadow: the darkest wood on the stool.
        const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        return mixRgb(WARM, DARK, 0.3 + 0.14 * grain);
      }),
      {
        color: '#8a5a35',
        roughness: 0.82,
        metalness: 0,
        detail: 0.008,
        paintWeight: 2,
        maxTriangles: 600,
      },
    );
  },
});
