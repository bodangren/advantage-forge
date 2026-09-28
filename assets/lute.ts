import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Lute (equipment/tools/lute). A pickup that lies on its back.
 * Size: 0.46 m long, 0.29 m wide, 0.24 m tall. It rests on y = 0.
 * The neck points to +Z. The asset is centred on the Y axis.
 * One idea: a plump round honey-oak bowl, a gold sound-hole rose, and a peg head bent back.
 * Shape language: round bowl and pegs, one steep head that breaks the side line.
 * Palette: pale oak #d4b483, honey #b5814a, warm brown #8a5a35, walnut #6b4226,
 *   ivory strings #f6f1e4, gold #d4a93a. The rose is the accent.
 * Materials: oak (rough 0.84), walnut fittings (rough 0.7), strings (rough 0.52), gold (metal 1).
 * Detail: bowl, pale soundboard, neck, bent peg head, four pegs, frets, bridge, four strings.
 * No rig.
 */

const HONEY = rgb('#b5814a');
const WARM = rgb('#8a5a35');
const PALE = rgb('#d4b483');
const PALE_LIGHT = rgb('#e4cba0');
const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#4a2c18');
const BOWL = rgb('#6b4226');
const GOLD = rgb('#d4a93a');
const GOLD_DEEP = rgb('#a67c22');
const HOLE = rgb('#2a140c');
const FRET = rgb('#e4cba0');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Neck points to +Z. The peg head rises from the joint and bends back toward the player.
const BODY_Z = -0.1;
const JOINT_Y = 0.114;
const JOINT_Z = 0.2;
const BEND = -98;
const HOLE_Z = -0.07;
const BRIDGE_Z = -0.165;
const STRING_Y = 0.134;
const BOARD_TOP = 0.118;

const bendCos = Math.cos((BEND * Math.PI) / 180);
const bendSin = Math.sin((BEND * Math.PI) / 180);

/** Map a point in peg-head space (joint at the origin, head along +Z) into the world. */
const headPoint = (x: number, y: number, z: number): [number, number, number] => [
  x,
  JOINT_Y + bendCos * y - bendSin * z,
  JOINT_Z + bendSin * y + bendCos * z,
];

const headPose = <T extends { rotateX: (d: number) => T; at: (x: number, y: number, z: number) => T }>(s: T): T =>
  s.rotateX(BEND).at(0, JOINT_Y, JOINT_Z);

const woodPaint = (x: number, y: number, z: number) => {
  const grain = 0.5 + 0.5 * noise.fbm(x * 10, y * 6, z * 14, 3);
  const streak = 0.5 + 0.5 * noise.fbm(x * 26, y * 4, z * 5, 2);
  const hole = Math.hypot(x, z - HOLE_Z);
  if (hole < 0.027 && y < BOARD_TOP + 0.004 && y > 0.09) return mixRgb(HOLE, WALNUT_DEEP, 0.25);
  const fromBody = Math.hypot(x, z - BODY_Z);
  const onFace = y > 0.11 && y < 0.126 && fromBody < 0.134 && z < 0.04;
  if (onFace) {
    const rim = clamp01((fromBody - 0.1) / 0.03);
    return mixRgb(mixRgb(PALE_LIGHT, PALE, 0.25 + 0.4 * streak), WARM, rim * 0.4);
  }
  const under = clamp01((0.045 - y) / 0.045);
  const stave = 0.5 + 0.5 * Math.cos(Math.atan2(z - BODY_Z, x) * 12);
  let side = mixRgb(BOWL, WALNUT_DEEP, 0.15 + 0.4 * under + 0.14 * stave);
  side = mixRgb(side, WARM, 0.12 * grain);
  // Honey neck and peg head sit above the bowl.
  const neck = clamp01((y - 0.1) / 0.02) * clamp01((z + 0.02) / 0.06);
  return mixRgb(side, mixRgb(HONEY, PALE, 0.3 + 0.2 * grain), neck);
};

const fittingPaint = (x: number, y: number, z: number) => {
  // Pale fret bars sit above the dark fingerboard. Pegs are farther forward.
  if (y > 0.126 && y < 0.142 && z > 0.0 && z < 0.185 && Math.abs(x) < 0.022) return FRET;
  const n = 0.5 + 0.5 * noise.fbm(x * 16, y * 12, z * 16, 2);
  return mixRgb(WALNUT, WALNUT_DEEP, 0.25 + 0.3 * n);
};

export default defineAsset({
  name: 'lute',
  description:
    'A honey-oak lute on its back, with a gold sound-hole rose, a bent peg head, frets, and four pale strings.',
  reference: 'docs/item-mockups/lute-mock.jpg',
  detail: 0.005,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ plump round bowl, pale cap, neck, bent head
    const bowl = sdf
      .revolve(
        profile.polygon(
          [
            [0.02, 0.0],
            [0.07, 0.006],
            [0.11, 0.022],
            [0.136, 0.048],
            [0.146, 0.074],
            [0.144, 0.096],
            [0.118, 0.104],
            [0.0, 0.104],
          ],
          { smooth: true, samples: 10 },
        ),
      )
      .at(0, 0, BODY_Z)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const board = sdf.cylinder(0.13, 0.016, 0.005).at(0, 0.11, BODY_Z);
    const hole = sdf.cylinder(0.024, 0.04, 0.001).at(0, 0.112, HOLE_Z);
    const boardCut = board.smoothSubtract(0.003, hole);

    const neck = sdf.box([0.042, 0.018, 0.2], 0.007).at(0, 0.112, 0.09);
    // A flat paddle, longer than the neck is thick, so the bend reads from the side.
    const pegbox = headPose(
      sdf.smoothUnion(
        0.007,
        sdf.box([0.048, 0.026, 0.118], 0.008).at(0, 0, 0.052),
        sdf.ellipsoid([0.028, 0.016, 0.022]).at(0, 0, 0.104),
      ),
    );

    const wood = bowl
      .smoothUnion(0.008, boardCut, neck)
      .smoothUnion(0.006, pegbox)
      .paintFn(woodPaint);

    k.body('wood', wood, {
      color: '#8a5a35',
      roughness: 0.84,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 1500,
      bump: (x, y, z) => {
        const grain = 0.001 * noise.fbm(x * 14, y * 8, z * 10, 3);
        if (y > 0.108) return grain * 0.6;
        const seam = Math.abs(Math.sin(Math.atan2(z - BODY_Z, x) * 6));
        return grain - (seam < 0.16 ? 0.0015 * (1 - seam / 0.16) : 0);
      },
    });

    // ------------------------------------------------------------------ fingerboard, pale frets, pegs, bridge
    const finger = sdf.box([0.028, 0.005, 0.16], 0.002).at(0, 0.123, 0.09);
    const fretZ = [0.02, 0.055, 0.09, 0.125, 0.158];
    const frets = sdf.union(
      ...fretZ.map((z) => sdf.box([0.04, 0.008, 0.007], 0.002).at(0, 0.129, z)),
    );
    const nut = sdf.box([0.036, 0.01, 0.009], 0.003).at(0, 0.128, 0.192);

    // Pegs angle toward the tip, so the knobs rise above the paddle in the side view.
    const peg = (z: number, side: number) =>
      sdf.smoothUnion(
        0.005,
        sdf.capsule([side * 0.008, 0, z], [side * 0.036, 0.006, z + 0.016], 0.0085),
        sdf.sphere(0.015).at(side * 0.044, 0.008, z + 0.022),
      );
    const pegs = headPose(sdf.union(peg(0.036, 1), peg(0.074, 1), peg(0.036, -1), peg(0.074, -1)));

    const bridge = sdf
      .smoothUnion(
        0.005,
        sdf.box([0.064, 0.02, 0.016], 0.005),
        sdf.sphere(0.011).at(-0.032, 0.002, 0),
        sdf.sphere(0.011).at(0.032, 0.002, 0),
      )
      .at(0, 0.128, BRIDGE_Z);

    k.body('walnut', sdf.union(finger, frets, nut, pegs, bridge).paintFn(fittingPaint), {
      color: '#6b4226',
      roughness: 0.7,
      metalness: 0,
      detail: 0.0038,
      maxTriangles: 900,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 20, y * 14, z * 20, 2),
    });

    // ------------------------------------------------------------------ four pale strings, spaced so they stay separate
    const nutX = [-0.018, -0.006, 0.006, 0.018];
    const bridgeX = [-0.028, -0.01, 0.01, 0.028];
    const pegZ = [0.074, 0.036, 0.036, 0.074];
    const pegSide = [-1, -1, 1, 1];
    const runs = nutX.map((nx, i) => {
      const side = pegSide[i]!;
      const fromNut = headPoint(nx, 0.014, 0.008);
      const toPeg = headPoint(side * 0.018, 0.006, pegZ[i]! + 0.01);
      return sdf.union(
        sdf.capsule([bridgeX[i]!, STRING_Y, BRIDGE_Z + 0.006], [nx, STRING_Y, 0.19], 0.0028),
        sdf.capsule(fromNut, toPeg, 0.0024),
      );
    });
    k.body('strings', sdf.union(...runs), {
      color: '#f6f1e4',
      roughness: 0.52,
      metalness: 0,
      detail: 0.0024,
      maxTriangles: 500,
    });

    // ------------------------------------------------------------------ gold rose around the sound hole
    const petal = (deg: number) =>
      sdf
        .ellipsoid([0.007, 0.005, 0.012])
        .at(0, 0.003, 0.038)
        .rotateY(deg);
    const rose = sdf
      .union(
        sdf.torus(0.03, 0.0055),
        sdf.torus(0.044, 0.0042),
        ...[0, 60, 120, 180, 240, 300].map(petal),
      )
      .at(0, BOARD_TOP + 0.004, HOLE_Z)
      .paintFn((_x, y) => mixRgb(GOLD_DEEP, GOLD, clamp01((y - BOARD_TOP) / 0.01)));
    k.body('rose', rose, {
      color: '#d4a93a',
      roughness: 0.32,
      metalness: 1,
      detail: 0.0032,
      maxTriangles: 560,
    });
  },
});
