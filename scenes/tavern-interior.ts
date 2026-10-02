/**
 * Chibi Quest tavern: a 12 m x 8 m common-room cutaway matched to
 * docs/tavern-mockups/tavern-quest_001.jpg. Two walls stand (north and west), the roof is off,
 * and the camera looks in from the south-east. Kit rules: docs/tavern-mockups/construction.md.
 *
 * +X is east, -Z is north. Yaw 0 faces south. Wall tiles are 2 m long; wall-mounted pieces
 * (fireplace, shelves, sconces) have their backs at local z = 0 and stand on the wall's inner face.
 */
import type { Place } from './chibi-quest.js';

const NORTH = -3.92; // inner face of the north wall
const WEST = -5.92; // inner face of the west wall
const TABLE = 0.6; // table and round-table top
const BAR = 0.75; // counter top

export function tavernInteriorPlaces(): Place[] {
  const places: Place[] = [];
  const put = (asset: string, x: number, z: number, yaw = 0, y = 0, optional = false) => {
    const p: Place = { asset, at: [x, y, z] };
    if (yaw !== 0) p.yaw = yaw;
    if (optional) p.optional = true;
    places.push(p);
  };

  // Floor and walls.
  for (const x of [-5, -3, -1, 1, 3, 5]) for (const z of [-3, -1, 1, 3]) put('wood-floor', x, z); // tile top at y = 0 (a 0.3 m slab)
  for (const x of [-5, -3, -1, 1, 3, 5]) put(x === -1 || x === 1 ? 'plaster-wall-window' : 'plaster-wall', x, -4);
  for (const z of [-3, -1, 1, 3]) put(z === 1 ? 'plaster-wall-door' : 'plaster-wall', -6, z, 90);

  // Hearth corner: fireplace on the north wall, rug, and two chairs facing the fire.
  put('fireplace', -3.0, NORTH);
  put('rug', -3.0, -2.5);
  places.push({ asset: 'round-table', at: [-3.0, 0, -1.7], scale: 0.6 });
  put('mug', -3.1, -1.7, 30, 0.38);
  put('candle', -2.85, -1.6, 0, 0.38);
  put('stool', -3.8, -1.9);
  put('stool', -2.2, -1.9);
  put('bard', -2.2, -1.9, 200, 0, true);
  put('lute', -3.8, -2.3, 20, 0.0, true);
  put('wall-sconce', -4.6, NORTH, 0, 1.0);
  put('wall-sconce', -1.9, NORTH, 0, 1.0);

  // Bar: counters on the east side, shelves and barrels behind, the innkeeper serving.
  put('counter', 3.0, -1.6);
  put('counter', 5.0, -1.6);
  put('shelf', 3.0, NORTH);
  put('shelf', 5.0, NORTH);
  put('bottle', 2.7, NORTH + 0.18, 0, 0.98);
  put('bottle', 3.2, NORTH + 0.18, 0, 0.98);
  put('bottle', 4.8, NORTH + 0.18, 0, 0.48);
  put('mug', 5.2, NORTH + 0.18, 0, 0.48);
  put('barrel', 2.0, -3.3, 20);
  put('barrel', 2.0, -2.5, 60);
  put('barrel', 5.6, -3.4, 0);
  put('barrel', 5.6, -2.7, 40);
  put('bottle', 3.6, NORTH + 0.18, 0, 0.98);
  put('bottle', 3.9, NORTH + 0.18, 0, 0.98);
  put('bottle', 4.2, NORTH + 0.18, 0, 0.98);
  put('bottle', 3.0, NORTH + 0.18, 0, 0.48);
  put('bottle', 3.4, NORTH + 0.18, 0, 0.48);
  put('bottle', 4.2, NORTH + 0.18, 0, 0.48);
  put('mug', 4.5, NORTH + 0.18, 0, 0.48);
  put('mug', 5.0, NORTH + 0.18, 0, 0.98);
  put('tankard', 5.4, NORTH + 0.18, 0, 0.98);
  put('plate', 4.5, -1.5, 0, BAR);
  put('bread', 4.0, -1.7, 20, BAR);
  put('innkeeper', 4.0, -2.5, 0, 0, true);
  put('tankard', 2.6, -1.6, 20, BAR);
  put('mug', 3.4, -1.5, 80, BAR);
  put('goblet', 4.4, -1.6, 0, BAR);
  put('bottle', 5.4, -1.7, 0, BAR);
  for (const x of [2.5, 3.5, 4.5, 5.4]) put('stool', x, -0.8);
  put('adventurer', 3.0, -0.3, 180);

  // Feast table: two tables end to end, benches on both sides, the feast on top.
  put('table', -1.5, 1.2);
  put('table', -0.55, 1.2);
  put('bench', -1.0, 0.45);
  put('bench', -1.0, 1.95, 180);
  put('haunch', -1.05, 1.2, 10, TABLE);
  put('bread', -1.7, 1.35, 30, TABLE);
  put('cheese', -0.35, 1.3, 0, TABLE);
  put('loaf', -1.8, 0.95, 0, TABLE, true);
  put('meat', -0.6, 0.95, 60, TABLE, true);
  for (const [x, z] of [
    [-1.55, 0.9],
    [-0.95, 0.9],
    [-1.35, 1.5],
    [-0.7, 1.5],
  ] as const)
    put('plate', x, z, 0, TABLE);
  put('bowl', -0.2, 0.95, 0, TABLE);
  put('mug', -1.25, 0.82, 40, TABLE);
  put('mug', -0.45, 1.6, 200, TABLE);
  put('goblet', -1.95, 1.2, 0, TABLE);
  put('candelabra', -1.0, 1.55, 0, TABLE);
  put('chandelier', -1.0, 1.2, 0, 1.75);

  // Round tables with patrons.
  put('round-table', 2.4, 2.0);
  put('chair', 1.75, 2.0, 90);
  put('chair', 3.05, 2.0, 270);
  put('chair', 2.4, 2.65, 180);
  put('tankard', 2.3, 1.9, 0, TABLE);
  put('mug', 2.55, 2.15, 90, TABLE);
  put('candle', 2.4, 1.75, 0, TABLE);
  put('round-table', 4.8, 2.6, 30);
  put('stool', 4.1, 2.6);
  put('stool', 5.5, 2.4);
  put('meat', 4.75, 2.55, 20, TABLE, true);
  put('goblet', 5.0, 2.8, 0, TABLE);
  put('villager', 1.6, 3.0, 40, 0, true);
  put('shopkeeper', 5.5, 3.2, 230, 0, true);

  // South half: more round tables, each with seats, food, and drink; patrons seated and standing.
  put('round-table', -2.7, 3.1);
  put('stool', -3.4, 3.1);
  put('stool', -2.0, 3.1);
  put('stool', -2.7, 3.7);
  put('mug', -2.8, 3.0, 20, TABLE);
  put('plate', -2.5, 3.2, 0, TABLE);
  put('bread', -2.5, 3.2, 0, TABLE + 0.02);
  put('candle', -2.7, 3.0, 0, TABLE);
  put('farmer', -3.4, 3.1, 90, 0, true);
  put('round-table', 0.3, 3.0, 15);
  put('chair', -0.4, 3.0, 90);
  put('chair', 1.0, 3.0, 270);
  put('stool', 0.3, 3.7);
  put('tankard', 0.2, 2.9, 0, TABLE);
  put('mug', 0.45, 3.1, 120, TABLE);
  put('cheese', 0.3, 3.0, 0, TABLE);
  put('cleric', 0.3, 3.7, 180, 0, true);
  put('round-table', -4.3, 0.6, 50);
  put('stool', -4.3, -0.1);
  put('stool', -3.7, 0.9, 90);
  put('goblet', -4.3, 0.6, 0, TABLE);
  put('plate', -4.1, 0.75, 0, TABLE);
  put('candle', -4.5, 0.5, 0, TABLE);
  put('ranger', -4.3, -0.1, 0, 0, true);
  put('rogue', 3.9, 0.9, 200, 0, true);
  put('barrel', 5.6, 0.7, 10);
  put('barrel', 5.6, 1.4, 50);
  put('sack', 5.3, 0.3, 20);
  put('sack', 5.5, 3.9, 80);

  // West wall: bookshelf and cupboard, a tapestry, the storage corner.
  put('bookshelf', WEST + 0.17, -2.4, 90);
  put('tapestry', WEST, -0.6, 90, 0.35, true);
  put('cupboard', WEST + 0.23, 2.9, 90);
  put('crate', -4.9, 3.4, 15);
  put('crate', -4.3, 3.55, 70);
  put('sack', -4.8, 2.7, 30);

  // A writing desk under the east window.
  put('desk', 1.0, NORTH + 0.3);
  put('chair', 1.0, -2.95, 180);
  return places;
}
