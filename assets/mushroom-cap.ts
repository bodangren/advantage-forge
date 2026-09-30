import { defineAsset, mixRgb, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note - mushroom cap (catalog `items/crafting/mushroom-cap`).
 * Role: crafting pickup, read at 128 px. Size: 0.18 m wide, 0.11 m tall, on y = 0, faces +Z.
 * One idea: a fat red dome with six white spots and a pale gill underside on a cream stub.
 * Palette: cap #d83a2a, spots #f4f0e6, gills #e8d3a4, stem #efe2c0. Materials: cap, stem.
 * Focal point: the spotted red dome.
 */
const RED = rgb('#d83a2a');
const SPOT = rgb('#f4f0e6');
const GILL = rgb('#e8d3a4');
const CY = 0.04;
const spots: [number, number][] = [[62, 0], [62, 72], [62, 144], [62, 216], [62, 288], [22, 36]];
const dirs = spots.map(([el, az]) => {
  const e = (el * Math.PI) / 180;
  const a = (az * Math.PI) / 180;
  return [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)];
});

const cap = sdf
  .sphere(0.09)
  .at(0, CY, 0)
  .intersect(sdf.halfSpace([0, -1, 0], -0.04))
  .round(0.004)
  .paintFn((x, y, z, _b): Rgb => {
    if (y < 0.046) return GILL;
    const l = Math.hypot(x, y - CY, z);
    let c = RED;
    for (const d of dirs) {
      const dist = Math.hypot(x / l - d[0], (y - CY) / l - d[1], z / l - d[2]);
      c = mixRgb(c, SPOT, Math.min(1, Math.max(0, (0.27 - dist) / 0.03)));
    }
    return c;
  });

export default defineAsset({
  name: 'mushroom-cap',
  detail: 0.0042,
  reference: 'docs/item-mockups/mushroom-cap-mock.jpg',
  texture: { size: 512 },
  build(k) {
    k.body('cap', cap, { color: RED, roughness: 0.55, metalness: 0 });
    k.body('stem', sdf.cylinder(0.034, 0.05, 0.008).at(0, 0.025, 0), { color: rgb('#efe2c0'), roughness: 0.8, metalness: 0 });
  },
});
