import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Pit trap (props/world/pit-trap), matched to docs/item-mockups/pit-trap-mock.jpg.
 * Role: floor hazard tile in a dungeon scene, seen from above at mid range. Size 2.0 x 2.0 m, tile 0.3 m thick
 * (top at y 0.3), stands on y = 0, front toward +Z. Everything stays on or above y = 0.
 * The one idea: a chunky raised flagstone tile with an open 1.2 m pit and tall iron spikes rising past the rim.
 * Shape language: square and heavy (tile), triangular (spikes). Palette: stone #7d746a, sides #5c554d,
 * grooves #3e3832, iron #4a4f55 with tips #a8acb1, bone #f0e2c4, walnut #8a5a35.
 * Materials: stone (tile, grooves, pebbles), iron spikes, bone, wood planks.
 * Detail: 4 x 4 flagstone grooves, hewn noise, nine spikes on sockets, skull and bones in a corner,
 * pebbles near the rim, two broken planks across a corner of the pit. Focal point: the spikes.
 * No rig, no animation.
 */

const STONE = rgb('#7d746a');
const STONE_DARK = rgb('#5c554d');
const GAP = rgb('#3e3832');
const TOP = 0.3;
const FLOOR = 0.04;
const HOLE = 1.2;
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const GROOVES = [-0.5, 0, 0.5];

export default defineAsset({
  name: 'pit-trap',
  description: 'A chunky flagstone tile with an open square pit, nine tall iron spikes, a skull and bones, pebbles, and broken planks.',
  detail: 0.01,
  reference: 'docs/item-mockups/pit-trap-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    let tile = sdf
      .box([2, TOP, 2], 0.04)
      .at(0, TOP / 2, 0)
      .subtract(sdf.box([HOLE, 0.4, HOLE]).at(0, 0.24, 0));
    for (const g of GROOVES) {
      tile = tile.subtract(sdf.box([0.03, 0.06, 2.2]).at(g, TOP, 0), sdf.box([2.2, 0.06, 0.03]).at(0, TOP, g));
    }
    tile = tile.displace(0.01, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 2));
    const pebbles = [
      [0.82, 0.7, 0.06, 0], [-0.78, 0.82, 0.05, 40], [0.86, -0.3, 0.045, 80], [-0.85, -0.6, 0.055, 10], [0.2, -0.85, 0.04, 60],
    ].map(([x, z, r, a]) => sdf.ellipsoid([r, r * 0.6, r * 0.85]).rotateY(a).at(x, TOP + r * 0.35, z));
    const stone = sdf.union(tile, ...pebbles).paintFn((x, y, z) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
      let c = mixRgb(STONE, STONE_DARK, 0.15 + 0.3 * n);
      if (y < TOP - 0.05 && Math.max(Math.abs(x), Math.abs(z)) > 0.62) c = mixRgb(c, STONE_DARK, 0.6);
      if (y > FLOOR + 0.05 && Math.max(Math.abs(x), Math.abs(z)) < 0.63) c = mixRgb(c, STONE_DARK, 0.5);
      if (y > TOP - 0.06) {
        const d = Math.min(...GROOVES.map((g) => Math.min(Math.abs(x - g), Math.abs(z - g))));
        c = mixRgb(c, GAP, 1 - clamp((d - 0.014) / 0.008));
      }
      if (y < FLOOR + 0.02 && Math.max(Math.abs(x), Math.abs(z)) < 0.6) c = mixRgb(c, GAP, 0.6);
      return c;
    });
    k.body('stone', stone, { color: '#7d746a', roughness: 0.9, metalness: 0, detail: 0.01, maxError: 0.008, bump: (x, y, z) => 0.002 * noise.fbm(x * 25, y * 25, z * 25, 2) });

    const spikes = [];
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const x = i * 0.38;
        const z = j * 0.38;
        spikes.push(sdf.cone([x, FLOOR, z], [x, 0.75, z], 0.07, 0.006));
        spikes.push(sdf.cylinder(0.09, 0.03, 0.008).at(x, FLOOR + 0.015, z));
      }
    k.body(
      'spikes',
      sdf.union(...spikes).paintFn((_x, y) => mixRgb(rgb('#4a4f55'), rgb('#a8acb1'), clamp((y - 0.5) / 0.12))),
      { color: '#4a4f55', roughness: 0.4, metalness: 0.75, detail: 0.006, maxError: 0.004 },
    );

    const SK = [-0.42, FLOOR + 0.1, 0.44] as const;
    const skull = sdf
      .sphere(0.1)
      .smoothUnion(0.02, sdf.box([0.08, 0.06, 0.08], 0.02).at(0, -0.08, 0.03))
      .at(...SK)
      .subtract(
        sdf.sphere(0.024).at(SK[0] - 0.038, SK[1] + 0.01, SK[2] + 0.085),
        sdf.sphere(0.024).at(SK[0] + 0.038, SK[1] + 0.01, SK[2] + 0.085),
      )
      .paintWhere(sdf.sphere(0.04).at(SK[0] - 0.038, SK[1] + 0.01, SK[2] + 0.1), rgb('#2a2622'))
      .paintWhere(sdf.sphere(0.04).at(SK[0] + 0.038, SK[1] + 0.01, SK[2] + 0.1), rgb('#2a2622'));
    const bones = sdf.union(
      sdf.capsule([-0.3, FLOOR + 0.03, 0.3], [-0.05, FLOOR + 0.03, 0.52], 0.028),
      sdf.capsule([-0.55, FLOOR + 0.03, 0.2], [-0.25, FLOOR + 0.03, 0.05], 0.026),
      sdf.sphere(0.04).at(-0.3, FLOOR + 0.04, 0.3),
      sdf.sphere(0.04).at(-0.05, FLOOR + 0.04, 0.52),
    );
    k.body('bones', sdf.union(skull, bones), { color: '#f0e2c4', roughness: 0.7, metalness: 0, detail: 0.006, maxError: 0.003 });

    const grain = (x: number, y: number, z: number) =>
      mixRgb(rgb('#8a5a35'), rgb('#5e3a1e'), 0.2 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 6, 3)));
    const planks = sdf.union(
      sdf.box([0.5, 0.04, 0.12], 0.008).rotateY(-40).at(0.52, TOP + 0.02, 0.55),
      sdf.box([0.32, 0.04, 0.12], 0.008).rotateY(-70).rotateZ(-12).at(0.62, TOP + 0.03, 0.2),
      sdf.box([0.16, 0.04, 0.12], 0.008).rotateY(-20).at(0.4, TOP + 0.02, 0.85),
    );
    k.body('planks', planks.paintFn(grain), { color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.006, maxError: 0.003 });
  },
});
