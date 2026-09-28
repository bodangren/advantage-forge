import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Cooking pot (props/food/cooking-pot), matched to docs/item-mockups/cooking-pot-mock.jpg.
 * Size: 0.5 m wide, 0.55 m tall with the handle up, on y = 0. One idea: a round-bellied black
 * iron pot on three short legs, a bail handle, full of orange stew with carrot, potato, and meat
 * chunks, and a wooden spoon leaning in it. Palette: iron #2f3236 / #4a4e54, stew #d8602a,
 * carrot #f08a2a, potato #e8c870, meat #8a4a2a, spoon #c9a06a.
 */

const IRON = rgb('#2f3236');
const IRON_HI = rgb('#4a4e54');
const STEW = rgb('#d8602a');
const STEW_DARK = rgb('#a8421a');
const STEW_Y = 0.325;

export default defineAsset({
  name: 'cooking-pot',
  description: 'A round black iron cooking pot on three legs with a bail handle, full of orange stew with chunks and a wooden spoon.',
  detail: 0.004,
  reference: 'docs/item-mockups/cooking-pot-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const shell = sdf.revolve(
      profile.polygon(
        [
          [0, 0.05],
          [0.12, 0.055],
          [0.2, 0.1],
          [0.225, 0.19],
          [0.205, 0.29],
          [0.19, 0.32],
          [0.205, 0.335],
          [0.2, 0.35],
          [0.175, 0.34],
          [0.18, 0.3],
          [0.2, 0.19],
          [0.18, 0.11],
          [0.1, 0.075],
          [0, 0.072],
        ],
        { smooth: true },
      ),
    );
    const legs = [0, 1, 2].map((i) => {
      const a = (i * 2 * Math.PI) / 3 + Math.PI / 2;
      return sdf.cone([Math.cos(a) * 0.12, 0.08, Math.sin(a) * 0.12], [Math.cos(a) * 0.14, 0.0, Math.sin(a) * 0.14], 0.03, 0.022);
    });
    const lugs = [1, -1].map((s) => sdf.torus(0.022, 0.008).rotateZ(90).at(s * 0.205, 0.31, 0));
    k.body(
      'pot',
      sdf.smoothUnion(0.02, shell, ...legs).union(...lugs).intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([1, 1, 1]).at(0, 0.3, 0)))
        .paintFn((x, y, z) => mixRgb(IRON, IRON_HI, 0.35 * (0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2)))),
      { color: '#2f3236', roughness: 0.55, metalness: 0.6 },
    );
    const bail = sdf
      .torus(0.205, 0.007)
      .rotateX(90)
      .scale([1, 1.1, 1])
      .at(0, 0.31, 0)
      .intersect(sdf.halfSpace([0, -1, 0], -0.31).intersect(sdf.box([1, 1, 1]).at(0, 0.6, 0)));
    k.body('bail', bail, { color: '#3d4148', roughness: 0.5, metalness: 0.7 });

    const stew = sdf
      .cylinder(0.185, 0.06, 0.01)
      .at(0, STEW_Y - 0.03, 0)
      .displace(0.006, (x, _y, z) => noise.fbm(x * 10, 0, z * 10, 2))
      .paintFn((x, _y, z) => mixRgb(STEW, STEW_DARK, 0.3 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 14, 0, z * 14, 2))));
    k.body('stew', stew, { color: '#d8602a', roughness: 0.35, metalness: 0 });
    const chunk = (x: number, z: number, s: number, ry: number) => sdf.box([s, s * 0.8, s], s * 0.3).rotate(20, ry, 15).at(x, STEW_Y + 0.004, z);
    const carrots = sdf.union(chunk(0.06, 0.05, 0.03, 10), chunk(-0.09, -0.04, 0.028, 40), chunk(0.02, -0.1, 0.026, 70), chunk(-0.03, 0.11, 0.026, 25));
    const potatoes = sdf.union(chunk(-0.06, 0.04, 0.036, 55), chunk(0.1, -0.05, 0.034, 5), chunk(0.0, 0.0, 0.032, 80));
    const meat = sdf.union(chunk(0.09, 0.08, 0.03, 35), chunk(-0.1, -0.1, 0.03, 60));
    k.body('carrots', carrots, { color: '#f08a2a', roughness: 0.5, metalness: 0 });
    k.body('potatoes', potatoes, { color: '#e8c870', roughness: 0.6, metalness: 0 });
    k.body('meat', meat, { color: '#8a4a2a', roughness: 0.6, metalness: 0 });
    const spoon = sdf.smoothUnion(
      0.008,
      sdf.capsule([-0.04, STEW_Y - 0.01, 0.02], [-0.2, 0.5, 0.1], 0.011),
      sdf.ellipsoid([0.035, 0.012, 0.028]).rotate(0, 30, -40).at(-0.03, STEW_Y - 0.005, 0.015),
    );
    k.body('spoon', spoon, { color: '#c9a06a', roughness: 0.65, metalness: 0 });
  },
});
