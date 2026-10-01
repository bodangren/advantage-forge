import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Hand axe (equipment/weapons/hand-axe), matched to docs/item-mockups/hand-axe-mock.jpg.
 * Size: 0.47 m tall, standing on its handle butt with the head up, blade toward +X.
 * One idea: a short wooden haft with orange leather wraps under a grey iron head whose bit
 * flares into a bright steel crescent. Palette: haft #7a4a2a / grain #5a3520, wraps #d9823a,
 * iron #6e747b, steel #d3d8de. Materials: wood (0.75), leather (0.7), iron/steel (0.4, 0.75).
 */

const WOOD = rgb('#7a4a2a');
const GRAIN = rgb('#5a3520');
const IRON = rgb('#6e747b');
const IRON_DARK = rgb('#4f545a');
const STEEL = rgb('#d3d8de');

const HEAD_Y = 0.405;
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export default defineAsset({
  name: 'hand-axe',
  description: 'A hand axe with a wooden haft, orange leather wraps, and a grey iron head with a flared bright steel bit.',
  detail: 0.003,
  reference: 'docs/item-mockups/hand-axe-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.19, 0] },

  build(k) {
    const haft = sdf.smoothUnion(
      0.01,
      sdf.cone([0, 0.02, 0], [0, 0.455, 0], 0.019, 0.015),
      sdf.ellipsoid([0.024, 0.02, 0.024]).at(0, 0.02, 0),
    );
    k.body(
      'haft',
      haft
        .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([0.2, 1, 0.2]).at(0, 0.4, 0)))
        .paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.2 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 60, y * 8, z * 60, 3)))),
      { color: '#7a4a2a', roughness: 0.75, metalness: 0 },
    );

    const wraps = sdf.union(
      ...[0.15, 0.19, 0.23].map((y) => {
        const r = 0.019 - (y / 0.455) * 0.004;
        return sdf.cylinder(r + 0.004, 0.022, 0.004).at(0, y, 0);
      }),
    );
    k.body('wraps', wraps, { color: '#d9823a', roughness: 0.7, metalness: 0 });

    // Head: an eye around the haft, a short poll behind, and a blade that flares into a crescent
    // bit. The blade tapers in thickness toward the edge.
    const eye = sdf.box([0.058, 0.078, 0.044], 0.012).at(0, HEAD_Y, 0);
    const poll = sdf.box([0.034, 0.052, 0.04], 0.01).at(-0.038, HEAD_Y, 0);
    const bladeOutline = profile.polygon(
      [
        [0.02, HEAD_Y + 0.03],
        [0.06, HEAD_Y + 0.035],
        [0.1, HEAD_Y + 0.065],
        [0.122, HEAD_Y + 0.055],
        [0.132, HEAD_Y + 0.02],
        [0.132, HEAD_Y - 0.02],
        [0.122, HEAD_Y - 0.06],
        [0.1, HEAD_Y - 0.075],
        [0.06, HEAD_Y - 0.04],
        [0.02, HEAD_Y - 0.032],
      ],
      { smooth: true },
    );
    const blade = sdf
      .extrude(bladeOutline, 0.04, 0.003)
      .intersect(sdf.halfSpace([0.14, 0, 1], 0.0145))
      .intersect(sdf.halfSpace([0.14, 0, -1], 0.0145));
    const head = sdf.smoothUnion(0.008, eye, poll).smoothUnion(0.01, blade);
    k.body(
      'head',
      head.paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 50, y * 50, z * 50, 2);
        const c = mixRgb(IRON, IRON_DARK, 0.35 * n);
        return mixRgb(c, STEEL, clamp((x - 0.092) / 0.012));
      }),
      { color: '#6e747b', roughness: 0.4, metalness: 0.75, paintWeight: 2 },
    );
  },
});
