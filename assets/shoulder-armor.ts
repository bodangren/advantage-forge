import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Steel pauldron (equipment/armor/shoulder-armor), matched to docs/item-mockups/shoulder-armor-mock.jpg.
 * Size: 0.32 m wide, 0.2 m tall, resting on y = 0 as if on a shoulder, the lames stepping out toward
 * +X. One idea: a domed shoulder cap over three overlapping curved steel lames, each with a rolled
 * rim and brass rivets, held by a leather strap with a buckle. Palette: steel #9aa0a8 / #6e747b,
 * rims #c9ccd0, rivets #d4a93a, strap #5a3522.
 */

const STEEL = rgb('#9aa0a8');
const DARK = rgb('#6e747b');

/** One curved plate: a shell of an ellipsoid, cut to a band between y0 and y1. */
const lame = (r: [number, number, number], cx: number, cy: number, y0: number, y1: number) => {
  const outer = sdf.ellipsoid(r).at(cx, cy, 0);
  const inner = sdf.ellipsoid([r[0] - 0.012, r[1] - 0.012, r[2] - 0.012]).at(cx, cy, 0);
  return outer.subtract(inner).intersect(sdf.box([1, y1 - y0, 1]).at(0, (y0 + y1) / 2, 0)).intersect(sdf.halfSpace([-1, 0, 0], 0.05));
};

export default defineAsset({
  name: 'shoulder-armor',
  description: 'A steel pauldron: a domed shoulder cap over three overlapping curved lames with rolled rims, brass rivets, and a leather strap.',
  detail: 0.003,
  reference: 'docs/item-mockups/shoulder-armor-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const cap = lame([0.13, 0.11, 0.12], 0.0, 0.08, 0.1, 0.2);
    const l1 = lame([0.15, 0.12, 0.13], 0.02, 0.08, 0.065, 0.115);
    const l2 = lame([0.165, 0.13, 0.14], 0.04, 0.075, 0.03, 0.08);
    const l3 = lame([0.18, 0.14, 0.15], 0.06, 0.07, 0.0, 0.045);
    const plates = sdf.union(cap, l1, l2, l3).paintFn((x, y, z) => mixRgb(STEEL, DARK, 0.2 + 0.35 * (0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2))));
    k.body('plates', plates, { color: '#9aa0a8', roughness: 0.35, metalness: 0.85, bump: (x, y, z) => 0.0005 * noise.fbm(x * 60, y * 60, z * 60, 2) });

    // Rolled rims on the lower edge of each plate.
    const rim = (r: [number, number, number], cx: number, cy: number, y: number) =>
      sdf.ellipsoid([r[0] + 0.004, r[1] + 0.004, r[2] + 0.004]).at(cx, cy, 0)
        .subtract(sdf.ellipsoid([r[0] - 0.012, r[1] - 0.012, r[2] - 0.012]).at(cx, cy, 0))
        .intersect(sdf.box([1, 0.012, 1], 0.004).at(0, y, 0))
        .intersect(sdf.halfSpace([-1, 0, 0], 0.05));
    const rims = sdf.union(rim([0.13, 0.11, 0.12], 0, 0.08, 0.106), rim([0.15, 0.12, 0.13], 0.02, 0.08, 0.071), rim([0.165, 0.13, 0.14], 0.04, 0.075, 0.036), rim([0.18, 0.14, 0.15], 0.06, 0.07, 0.006));
    k.body('rims', rims, { color: '#c9ccd0', roughness: 0.3, metalness: 0.9 });

    const rivets = [];
    for (const [rx, cx, cy, y] of [[0.13, 0, 0.08, 0.13], [0.15, 0.02, 0.08, 0.09], [0.165, 0.04, 0.075, 0.055], [0.18, 0.06, 0.07, 0.02]] as const) {
      for (const a of [-0.6, 0, 0.6]) {
        const ry = (y - cy) / (rx * 0.85);
        const ringR = rx * Math.sqrt(Math.max(0, 1 - ry * ry));
        rivets.push(sdf.sphere(0.008).at(cx + Math.cos(a) * ringR, y, Math.sin(a) * ringR * 0.9));
      }
    }
    k.body('rivets', sdf.union(...rivets), { color: '#d4a93a', roughness: 0.3, metalness: 1 });
    const strap = sdf.union(sdf.box([0.03, 0.012, 0.3], 0.004).at(-0.06, 0.006, 0), sdf.box([0.04, 0.016, 0.04], 0.004).at(-0.06, 0.012, 0.1));
    k.body('strap', strap, { color: '#5a3522', roughness: 0.7, metalness: 0 });
  },
});
