import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Throwing axe (equipment/ranged-weapons/throwing-axe): chunky chibi axe, 0.55 m tall, standing on
 * its pommel on y = 0, facing +Z; the head lies in the XY plane with the blade toward +X.
 * Role: ranged-weapon icon, read at 128 px. One idea: a big bearded steel head with a bright edge
 * on a short thick leather-wrapped handle. Shape language: square and sturdy, beard hooks back.
 * Palette: steel #9aa0a8, edge #dde1e6, socket #6c737a, honey wood #a86a3a, wrap #5a3522.
 * Bodies: handle (wood + pommel), wrap (six rings), head (steel, edge painted), rivets.
 * No mockup.
 */

const STEEL = rgb('#9aa0a8');
const EDGE = rgb('#dde1e6');
const SOCKET = rgb('#6c737a');
const WOOD = rgb('#a86a3a');
const GRAIN = rgb('#7c4a26');
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export default defineAsset({
  name: 'throwing-axe',
  description: 'A chunky throwing axe standing on its pommel: a leather-wrapped handle and a big bearded steel head.',
  detail: 0.004,
  texture: { size: 512 },

  build(k) {
    const handle = sdf
      .capsule([0, 0.03, 0], [0, 0.48, 0], 0.03)
      .smoothUnion(0.01, sdf.sphere(0.038).at(0, 0.04, 0));
    k.body(
      'handle',
      handle.paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.15 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 90, y * 8, z * 90, 3)))),
      { color: '#a86a3a', roughness: 0.7, metalness: 0 },
    );
    const rings = [0, 1, 2, 3, 4, 5].map((i) => sdf.torus(0.033, 0.01).at(0, 0.08 + i * 0.028, 0));
    k.body('wrap', sdf.union(...rings), { color: '#5a3522', roughness: 0.8, metalness: 0 });

    const blade = sdf.extrude(
      profile.polygon(
        [
          [0.03, 0.5],
          [0.1, 0.52],
          [0.17, 0.53],
          [0.185, 0.45],
          [0.16, 0.36],
          [0.14, 0.3],
          [0.1, 0.33],
          [0.05, 0.36],
          [0.03, 0.39],
        ],
        { smooth: false },
      ),
      0.05,
      0.006,
    );
    const socket = sdf.box([0.09, 0.1, 0.06], 0.012).at(0, 0.44, 0);
    const poll = sdf.box([0.04, 0.06, 0.05], 0.008).at(-0.06, 0.44, 0);
    const head = sdf.smoothUnion(0.008, blade, socket, poll);
    k.body(
      'head',
      head.paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2);
        const base = mixRgb(STEEL, EDGE, 0.15 * n);
        const withEdge = mixRgb(base, EDGE, clamp((x - 0.15) / 0.01));
        return mixRgb(withEdge, SOCKET, x < 0.045 ? 1 : 0);
      }),
      { color: '#9aa0a8', roughness: 0.35, metalness: 0.85 },
    );
    k.body('rivets', sdf.union(sdf.sphere(0.012).at(0, 0.475, 0.03), sdf.sphere(0.012).at(0, 0.405, 0.03)), {
      color: '#3f4348',
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.003,
    });
  },
});
