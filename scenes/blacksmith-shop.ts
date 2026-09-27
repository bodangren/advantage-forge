/**
 * Chibi Quest blacksmith shop: an 8 m x 6 m interior cutaway matched to
 * docs/blacksmith-mockups/blacksmith-quest_001.jpg. Two walls stand (north and west), the roof
 * is off, and the camera looks in from the south-east. Kit rules: docs/blacksmith-mockups/
 * construction.md. Pieces that are still being built are optional slots.
 *
 * Grid: 4 x 3 floor tiles of 2 m. +X is east, -Z is north. Yaw 0 faces south.
 */
import type { Place } from './chibi-quest.js';

const BENCH_TOP = 0.99;

export function blacksmithShopPlaces(): Place[] {
  const places: Place[] = [];
  const put = (asset: string, x: number, z: number, yaw = 0, y = 0, optional = false) => {
    const p: Place = { asset, at: [x, y, z] };
    if (yaw !== 0) p.yaw = yaw;
    if (optional) p.optional = true;
    places.push(p);
  };

  // Floor: cobblestone tiles.
  for (const x of [-3, -1, 1, 3]) for (const z of [-2, 0, 2]) put('stone-floor', x, z, 0, -0.08); // tile top at y = 0

  // North wall: stone behind the forge, half-timber toward the workbench.
  put('stone-wall', -3, -3.05);
  put('stone-wall', -1, -3.05);
  put('timber-wall', 1, -3.05);
  put('timber-wall', 3, -3.05);
  // West wall: stone.
  for (const z of [-2, 0, 2]) put('stone-wall', -4.05, z, 90);

  // The forge anchors the north-west corner; bellows beside it; fuel and ore in front.
  put('forge', -2.4, -2.45);
  put('bellows', -3.45, -1.9, 90, 0, true);
  put('coal', -1.35, -1.75, 20, 0, true);
  put('coal', -1.0, -1.45, 80, 0, true);
  put('iron-ore', -3.3, -0.7, 10, 0, true);
  put('iron-ore', -3.0, -0.35, 60, 0, true);

  // Focal mid-floor: the anvil with the smith behind it, the quench tub beside it.
  put('anvil', 0.1, -0.1);
  put('blacksmith', 0.1, -0.95);
  put('quench-tub', 1.2, 0.35, 0, 0, true);

  // Work wall: the bench with tools and the cash box, a wall sconce above.
  put('workbench', 1.9, -2.55);
  put('hammer', 1.5, -2.5, 30, BENCH_TOP, true);
  put('tongs', 2.2, -2.45, 100, BENCH_TOP, true);
  put('cash-box', 2.55, -2.6, 0, BENCH_TOP, true);
  put('wall-sconce', 0.0, -2.95, 0, 1.05, true);
  put('wall-sconce', 3.0, -2.95, 0, 1.05, true);

  // East side: grinding wheel, storage, rope.
  put('grinding-wheel', 3.2, -1.3, 270);
  put('barrel', 3.4, -2.55, 20);
  put('crate', 3.4, 0.6, 15);
  put('sack', 3.0, 1.2, 40);
  put('rope-coil', -3.4, 1.9, 30);
  put('rope-coil', -3.1, 2.35, 110);

  // Tools stand along the west wall.
  put('axe', -3.7, 0.7, 90, 0, true);
  put('pickaxe', -3.7, 1.1, 90, 0, true);
  put('shovel', -3.7, 1.45, 90, 0, true);

  // A customer waits for a sword.
  put('adventurer', 1.7, 1.9, 200);
  return places;
}
