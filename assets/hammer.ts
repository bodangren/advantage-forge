import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Smith's cross-peen hammer (props/blacksmith/hammer), lying on its side on y = 0 so it sits on
 * the workbench of the blacksmith scene. Size: 0.36 m long, head 0.13 m across.
 * One idea: a dark forged head with a bright striking face and a wedge peen, on an ash handle
 * with a leather-wrapped grip. Palette: iron #4f545a / edge #6e747b, face #c9ced4,
 * handle #b0804a / grain #86582e, grip #5a3522. Materials: iron (0.45, metal 0.8), wood (0.7).
 */

const IRON = rgb('#4f545a');
const IRON_EDGE = rgb('#6e747b');
const FACE = rgb('#c9ced4');
const WOOD = rgb('#b0804a');
const GRAIN = rgb('#86582e');

const AXIS_Y = 0.022; // handle axis height
const HEAD_X = 0.145; // head center along the handle
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const ground = (s: ReturnType<typeof sdf.sphere>) =>
  s.intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([1, 0.4, 1]).at(0, 0.2, 0)));

export default defineAsset({
  name: 'hammer',
  description: "A blacksmith's cross-peen hammer lying on its side: dark forged head, bright striking face, wrapped ash handle.",
  detail: 0.003,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 512 },

  build(k) {
    // Handle along X, slightly swelling toward the butt.
    const handle = sdf.smoothUnion(
      0.01,
      sdf.cone([-0.2, AXIS_Y - 0.002, 0], [HEAD_X + 0.01, AXIS_Y, 0], 0.0165, 0.0125),
      sdf.ellipsoid([0.012, 0.018, 0.019]).at(-0.2, AXIS_Y - 0.002, 0),
    );
    k.body(
      'handle',
      ground(handle).paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.15 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 8, y * 70, z * 70, 3)))),
      { color: '#b0804a', roughness: 0.7, metalness: 0 },
    );
    const grip = sdf.cone([-0.19, AXIS_Y - 0.002, 0], [-0.1, AXIS_Y - 0.001, 0], 0.0195, 0.0175);
    k.body('grip', ground(grip), { color: '#5a3522', roughness: 0.75, metalness: 0 });

    // Head across the handle (along Z): a square body, a round striking face on +Z,
    // and a wedge peen on -Z.
    const body = sdf.box([0.042, 0.042, 0.075], 0.006).at(HEAD_X, AXIS_Y + 0.001, 0.005);
    const face = sdf.cylinder(0.026, 0.03, 0.005).rotateX(90).at(HEAD_X, AXIS_Y + 0.001, 0.05);
    const peen = sdf
      .box([0.04, 0.042, 0.06], 0.004)
      .at(HEAD_X, AXIS_Y + 0.001, -0.055)
      .intersect(sdf.halfSpace([0, 1, -0.45], AXIS_Y + 0.001 + 0.021 + 0.45 * 0.03))
      .intersect(sdf.halfSpace([0, -1, -0.45], -(AXIS_Y + 0.001) + 0.021 + 0.45 * 0.03));
    const head = sdf.smoothUnion(0.005, body, face).smoothUnion(0.004, peen);
    k.body(
      'head',
      ground(head).paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 60, y * 60, z * 60, 2);
        const c = mixRgb(IRON, IRON_EDGE, 0.3 * n);
        return mixRgb(c, FACE, clamp((z - 0.058) / 0.006));
      }),
      { color: '#4f545a', roughness: 0.45, metalness: 0.8, paintWeight: 2 },
    );
  },
});
