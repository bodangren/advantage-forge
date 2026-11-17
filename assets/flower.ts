import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Design note — the flower (Chibi Sprouts props).
 *
 * Role: a song-video prop for week 3; must read at 128 px.
 * Size: 0.45 m tall; stands on y = 0 on its base mound, faces +Z.
 * One idea: one big pink flower on a green stem, with two leaves and a yellow centre.
 * Shape language: round petals around a disc centre, a straight stem, flat leaf blades.
 * Palette: pink #f08cb4 (petals), deeper pink #d9669a (petal tips), yellow #f6c936 (centre),
 *   stem green #4f8f5a, leaf green #5fa364.
 * Materials: soft petals (roughness 0.7), a matte stem (roughness 0.8).
 * Detail list: primary the six petals; secondary the yellow centre and the two leaves; tertiary
 *   the deeper pink tips and the base mound.
 * Rig/animation: none (static prop).
 */

const DEG = Math.PI / 180;

const PINK = rgb('#f08cb4');
const DEEP = rgb('#d9669a');
const YELLOW = rgb('#f6c936');
const LEAF = rgb('#5fa364');

const HEAD_Y = 0.37; // the flower head's centre
const TILT = -10; // degrees; the head leans back
const PETALS = 6;
const PETAL_R = 0.045; // the petal centres sit this far from the head's centre

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'flower',
  description: 'One big pink flower on a green stem with two leaves, a yellow centre, and a small mound at its base.',
  detail: 0.0035,
  texture: { size: 1024 },

  build(k) {
    // The stem: a green capsule from the ground up into the head.
    const stem = sdf.capsule([0, 0.012, 0], [0, 0.355, 0], 0.012);

    // The leaves: flat blades on the stem, angled up 30 degrees.
    const leaf = (sign: number, y: number, roll: number) => {
      const dir: [number, number, number] = [sign * Math.cos(30 * DEG), Math.sin(30 * DEG), 0];
      const centre: [number, number, number] = [dir[0] * 0.03, y + dir[1] * 0.03, 0];
      const ang = Math.atan2(dir[1], dir[0]) / DEG;
      return sdf
        .ellipsoid([0.035, 0.006, 0.015])
        .rotateX(roll)
        .rotateZ(ang)
        .at(centre[0], centre[1], centre[2]);
    };
    // The rolls turn each blade's face up and forward, so the leaves read from the front.
    const leaves = leaf(-1, 0.12, 135).smoothUnion(0.006, leaf(1, 0.19, 55));

    // The base mound: a small green mound, flat on the ground, so the flower stands.
    const mound = sdf.sphere(0.04).at(0, 0.04, 0).intersect(sdf.halfSpace([0, -1, 0], 0));

    // The petals: six blades around the head's centre, in the head's plane.
    let petals = sdf.ellipsoid([0.03, 0.0225, 0.006]).at(PETAL_R, 0, 0);
    for (let i = 1; i < PETALS; i++) {
      const deg = (i * 360) / PETALS;
      const a = deg * DEG;
      petals = petals.smoothUnion(
        0.012,
        sdf
          .ellipsoid([0.03, 0.0225, 0.006])
          .rotateZ(deg)
          .at(Math.cos(a) * PETAL_R, Math.sin(a) * PETAL_R, 0),
      );
    }
    const head = petals.rotateX(TILT).at(0, HEAD_Y, 0);

    // The paint: pink petals with deeper pink tips.
    const petalPaint = (x: number, y: number, _z: number) => {
      const r = Math.hypot(x, y - HEAD_Y);
      return mixRgb(PINK, DEEP, clamp01((r - 0.045) / 0.025));
    };

    k.body('stem', stem, { color: '#4f8f5a', roughness: 0.8 });
    k.body('foliage', leaves.smoothUnion(0.01, mound), { color: '#5fa364', roughness: 0.8 });
    k.body('petals', head.paintFn(petalPaint), { color: '#f08cb4', roughness: 0.7, textureDensity: 2 });
    k.body('centre', sdf.sphere(0.03).at(0, HEAD_Y, 0), { color: '#f6c936', roughness: 0.7 });
  },
});
