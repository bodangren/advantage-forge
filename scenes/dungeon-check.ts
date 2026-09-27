/**
 * Dungeon wall-plan check: the southwest quadrant of the Sunken Vault
 * (west cell block, central hall west half, gatehouse, flooded strip west,
 * sanctum south edge) assembled from the real GLBs to test how wall
 * segments, corners, portals, and junctions actually meet on the 2 m grid.
 *
 * +X is east, +Z is south. Tile (col,row) center: x = (col-6.5)*2,
 * z = (row-4.5)*2. E-W walls sit on row edges, N-S walls on column edges.
 */

import type { Place } from './chibi-quest.js';

const cx = (c: number) => (c - 6.5) * 2;
const cz = (r: number) => (r - 4.5) * 2;

export function dungeonCheckPlaces(): Place[] {
  const places: Place[] = [];

  // Floors: west cell + flooded strip west (c1-4, r4-8), hall + gatehouse
  // (c5-8, r4-8), sanctum frontage (c4-8, r3).
  for (let c = 1; c <= 4; c++) for (let r = 4; r <= 8; r++) places.push({ asset: 'floor', at: [cx(c), 0, cz(r)] });
  for (let c = 5; c <= 8; c++) for (let r = 3; r <= 8; r++) places.push({ asset: 'floor', at: [cx(c), 0, cz(r)] });
  for (let c = 4; c <= 4; c++) places.push({ asset: 'floor', at: [cx(c), 0, cz(3)] });

  // North wall line z=-4 (edge r3/r4), c1-8. Arch = hall-sanctum entrance at c6.
  // c1 is absent: the NW corner's east arm occupies that edge slot.
  for (let c = 1; c <= 8; c++)
    if (c !== 1 && c !== 6) places.push({ asset: 'wall', at: [cx(c), 0, -4] });
  places.push({ asset: 'arch', at: [cx(6), 0, -4] });

  // West outer wall x=-12, rows 4-7. Row 8 is the corner's north arm.
  for (let r = 4; r <= 7; r++) places.push({ asset: 'wall', at: [-12, 0, cz(r)], yaw: 90 });

  // Hall east wall x=+4, rows 4-5 (suggestion of the treasury boundary).
  for (let r = 4; r <= 5; r++) places.push({ asset: 'wall', at: [4, 0, cz(r)], yaw: 90 });

  // Hall west wall x=-4, rows 4-7. Door = hall-west cell entrance at r5.
  for (let r = 4; r <= 7; r++)
    places.push(
      r === 5
        ? { asset: 'door', at: [-4, 0, cz(r)], yaw: 90 }
        : { asset: 'wall', at: [-4, 0, cz(r)], yaw: 90 },
    );

  // North gatehouse wall z=+6 (edge r7/r8), c5-8. Door at c6 (gatehouse's
  // "north door" into the hall).
  for (let c = 5; c <= 8; c++)
    places.push(c === 6 ? { asset: 'door', at: [cx(c), 0, 6] } : { asset: 'wall', at: [cx(c), 0, 6] });

  // South outer wall z=+8, c2-6 (c1 and c8 are corner arms; c7 is the gate gap).
  for (let c = 2; c <= 6; c++) places.push({ asset: 'wall', at: [cx(c), 0, 8] });

  // Sanctum west outer wall x=-6, rows 2-3, plus a stub of its north wall
  // z=-8 (c5-6; c4 is the corner's east arm) to exercise a second outer corner.
  for (let r = 2; r <= 3; r++) places.push({ asset: 'wall', at: [-6, 0, cz(r)], yaw: 90 });
  for (let c = 5; c <= 6; c++) places.push({ asset: 'wall', at: [cx(c), 0, -8] });

  // Outer corners: SW of the west block, NW of the west cell, NE of the
  // gatehouse block, NW of the sanctum. Yaws verified against render.
  places.push({ asset: 'wall-corner', at: [-12, 0, 8], yaw: 270 });
  places.push({ asset: 'wall-corner', at: [-12, 0, -4], yaw: 180 });
  places.push({ asset: 'wall-corner', at: [4, 0, 8], yaw: 0 });
  places.push({ asset: 'wall-corner', at: [-6, 0, -8], yaw: 180 });

  // Hall pillars flanking the central axis, sconce on the hall west wall
  // (r1 sconce: provisional masonry, correct 1.2 m stub height).
  places.push({ asset: 'pillar', at: [-1.2, 0.09, 2] });
  places.push({ asset: 'pillar', at: [1.2, 0.09, 2] });
  places.push({ asset: 'torch-sconce', at: [-3.75, 0, 3], yaw: 90 });

  // Scale figures: one in the hall, one in the sanctum arch, one outside
  // the SW corner on bare ground.
  places.push({ asset: 'adventurer', at: [0, 0.09, 2.6] });
  places.push({ asset: 'skeleton', at: [-1, 0.09, -3], yaw: 180 });
  places.push({ asset: 'adventurer', at: [-13.4, 0, 9.6], yaw: 45 });

  return places;
}
