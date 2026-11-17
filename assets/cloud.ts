import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Design note — the cloud (Chibi Sprouts props).
 *
 * Role: a song-video prop for week 3; must read at 128 px.
 * Size: 0.50 m wide, 0.26 m tall, 0.22 m deep; stands on y = 0 on its flat bottom.
 * One idea: one small white cloud, made of five soft lumps with a cool shaded underside.
 * Shape language: round lumps, flat on the ground, no face.
 * Palette: white #f7f7f2 (the cloud), cool grey-blue #d9dee6 (the lower third).
 * Materials: soft and matte (roughness 0.95).
 * Detail list: primary the five lumps; secondary the shaded underside; tertiary nothing else.
 * Rig/animation: none (static prop).
 */

const WHITE = rgb('#f7f7f2');
const SHADE = rgb('#d9dee6');

const SHADE_TOP = 0.085; // the shaded band reaches this high

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'cloud',
  description: 'One small white cloud with five soft lumps and a cool shaded underside, flat on the ground.',
  detail: 0.006,
  texture: { size: 512 },

  build(k) {
    // The five lumps, smooth-unioned into one cloud.
    let shape = sdf.sphere(0.12).at(0, 0.14, 0);
    shape = shape.smoothUnion(0.04, sdf.sphere(0.09).at(0.13, 0.11, 0));
    shape = shape.smoothUnion(0.04, sdf.sphere(0.09).at(-0.13, 0.11, 0));
    shape = shape.smoothUnion(0.04, sdf.sphere(0.07).at(0.21, 0.08, 0));
    shape = shape.smoothUnion(0.04, sdf.sphere(0.07).at(-0.21, 0.08, 0));

    // The flat bottom: the cloud rests on y = 0.
    const cloud = shape.intersect(sdf.halfSpace([0, -1, 0], 0)).at(0, -0.01, 0);

    // The paint: white on top, a cool grey-blue in the lower third.
    const paint = (_x: number, y: number, _z: number) =>
      mixRgb(WHITE, SHADE, clamp01((SHADE_TOP - y) / SHADE_TOP));

    k.body('cloud', cloud.paintFn(paint), {
      color: '#f7f7f2',
      roughness: 0.95,
      metalness: 0,
      textureDensity: 1.5,
    });
  },
});
