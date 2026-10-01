import { profile, sdf, type Part } from '../../src/index.js';

/**
 * Ranger recurve bow (part of `assets/ranger.ts`; standalone `assets/ranger-bow.ts`).
 *
 * A dark wood longbow bow with a leather grip and a cream string in two halves that meet at the
 * nocking point. `rangerArrow` is a second part: the shot arrow, in the quiver frame.
 * Class: hand-held. Local frame: the origin is the grip in the left fist, the axes are the
 * character axes (the bow is turned by BOW_YAW and BOW_TILT inside the part); the host moves it by GRIP.
 * Bodies: bow (bone `bowgrip`), bowstring (`string.top`), bowstring-low (`string.bot`);
 * nocked-arrow (bone `arrow`).
 * Tint slots: none.
 */

const C = {
  bow: '#5e3620',
  string: '#e6d8b0',
  grip: '#8a5a36',
  shaft: '#b98c55',
  fletch: '#9c9a94',
  arrowhead: '#8a8e94',
};

type V3 = [number, number, number];
const DEG = Math.PI / 180;
const rotYv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) + v[2] * Math.sin(d * DEG), v[1], -v[0] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotZv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) - v[1] * Math.sin(d * DEG), v[0] * Math.sin(d * DEG) + v[1] * Math.cos(d * DEG), v[2]];

export const UPPER = 0.33;
export const LOWER = 0.21;
export const BOW_TILT = -8;
const WRIST_L: V3 = [0.268, 0.31, 0.04];
/** The grip in the ranger's frame; the host moves the part by this. */
export const GRIP: V3 = [WRIST_L[0] + 0.008, WRIST_L[1] - 0.044, WRIST_L[2] + 0.004];
const bowDir = (d: V3) => rotZv(rotYv(d, 100), BOW_TILT);
const NOCK_TOP = bowDir([0, 0.9 * UPPER, -0.072]);
const NOCK_BOT = bowDir([0, -0.9 * LOWER, -0.072]);
const NOCK_MID = bowDir([0, 0.035, -0.072]);

export function rangerBow(): Part {
  const limb = (len: number, sign: 1 | -1) =>
    sdf.chain(
      [
        [0, 0, 0, 0.017],
        [0, 0.22 * len * sign, -0.007, 0.0135],
        [0, 0.48 * len * sign, -0.03, 0.0115],
        [0, 0.72 * len * sign, -0.056, 0.0098],
        [0, 0.88 * len * sign, -0.066, 0.0086],
        [0, 0.97 * len * sign, -0.052, 0.0078],
        [0, 1.02 * len * sign, -0.026, 0.0072],
        [0, 1.03 * len * sign, 0.0, 0.0068],
        [0, 1.015 * len * sign, 0.02, 0.0064],
      ],
      0.01,
    );
  const bowLocal = sdf.union(limb(UPPER, 1), limb(LOWER, -1)).paintWhere(sdf.box([0.1, 0.07, 0.1]), C.grip);
  const bowTurn = (s: sdf.Shape) => s.rotateY(100).rotateZ(BOW_TILT);
  const stringLook = { color: C.string, roughness: 0.8, detail: 0.003 };
  return {
    name: 'ranger-bow',
    bodies: [
      { name: 'bow', shape: bowTurn(bowLocal), options: { color: C.bow, roughness: 0.55, detail: 0.004 }, bone: 'bowgrip' },
      { name: 'bowstring', shape: sdf.capsule(NOCK_TOP, NOCK_MID, 0.0035), options: stringLook, bone: 'string.top' },
      { name: 'bowstring-low', shape: sdf.capsule(NOCK_BOT, NOCK_MID, 0.0035), options: stringLook, bone: 'string.bot' },
    ],
  };
}

/** The shot arrow, in the quiver frame (the host applies the quiver pose). */
export function rangerArrow(): Part {
  const vane = sdf.extrude(
    profile.polygon([
      [0, -0.004],
      [0.017, 0.012],
      [0.016, 0.046],
      [0, 0.062],
      [-0.016, 0.046],
      [-0.017, 0.012],
    ]),
    0.008,
    0.003,
  );
  const fletching = sdf.union(vane, vane.rotateY(90));
  const shotArrow = sdf.union(
    sdf.capsule([0, 0.2, 0], [0, 0.43, 0], 0.0055),
    sdf.cone([0, 0.205, 0], [0, 0.165, 0], 0.012, 0.002).paint(C.arrowhead),
    fletching.at(0, 0.358, 0).paint(C.fletch),
  );
  return {
    name: 'ranger-arrow',
    bodies: [{ name: 'nocked-arrow', shape: shotArrow, options: { color: C.shaft, roughness: 0.7, detail: 0.0035 }, bone: 'arrow' }],
  };
}
