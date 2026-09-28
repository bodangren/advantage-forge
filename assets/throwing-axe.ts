import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Throwing axe (equipment/ranged-weapons/throwing-axe): 0.4 m long, lying flat on y = 0, head at
 * +X. One idea: a short wooden handle with a leather wrap and a curved bearded steel head whose
 * beard hooks down toward the handle. Palette: steel #9aa0a8 / edge #d3d8de, handle #8a5a32 /
 * grain #5e3a1e, wrap #5a3522. No mockup: the mmx image showed a bearded man, not an axe.
 */

const STEEL = rgb('#9aa0a8');
const EDGE = rgb('#d3d8de');
const WOOD = rgb('#8a5a32');
const GRAIN = rgb('#5e3a1e');
const Y = 0.017; // handle axis height

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export default defineAsset({
  name: 'throwing-axe',
  description: 'A small throwing axe lying flat: a short wooden handle with a leather wrap and a curved bearded steel head.',
  detail: 0.0025,
  texture: { size: 512 },

  build(k) {
    const handle = sdf.smoothUnion(
      0.008,
      sdf.cone([-0.22, Y, 0], [0.13, Y, 0], 0.017, 0.014),
      sdf.ellipsoid([0.014, 0.017, 0.02]).at(-0.222, Y, 0),
    );
    k.body(
      'handle',
      handle.paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.15 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 8, y * 90, z * 90, 3)))),
      { color: '#8a5a32', roughness: 0.7, metalness: 0 },
    );
    k.body('wrap', sdf.cylinder(0.0195, 0.09, 0.004).rotateZ(90).at(-0.15, Y, 0), { color: '#5a3522', roughness: 0.75, metalness: 0 });

    // Head outline in the XZ plane (profile x = world x, profile y = -world z): the bit faces +Z,
    // the beard hooks back toward -X along the handle.
    const outline = profile.polygon(
      [
        [0.1, 0.03],
        [0.16, 0.03],
        [0.165, -0.01],
        [0.19, -0.05],
        [0.2, -0.1],
        [0.17, -0.125],
        [0.12, -0.13],
        [0.075, -0.11],
        [0.1, -0.075],
        [0.11, -0.03],
      ],
      { smooth: true },
    );
    const head = sdf
      .extrude(outline, 0.03, 0.003)
      .rotateX(-90)
      .at(0, Y, 0)
      .intersect(sdf.halfSpace([0, 1, 0.12], Y + 0.013))
      .intersect(sdf.halfSpace([0, -1, 0.12], -Y + 0.013));
    const eye = sdf.box([0.06, 0.036, 0.05], 0.008).at(0.13, Y, 0.0);
    k.body(
      'head',
      sdf.smoothUnion(0.006, head, eye).paintFn((x, _y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 50, 0, z * 50, 2);
        return mixRgb(mixRgb(STEEL, EDGE, 0.2 * n), EDGE, clamp((z - 0.09) / 0.012));
      }),
      { color: '#9aa0a8', roughness: 0.35, metalness: 0.85 },
    );
  },
});
