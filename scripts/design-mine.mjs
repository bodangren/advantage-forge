#!/usr/bin/env node
// Mine map designer: 16 x 14 m cavern, rail line, loaded cart, ore stockpile, lift.
// Grid: 8 x 7 tiles of 2 m inside a ring of stone floor that carries the rock backdrop.
// Cell center x = -7..7 step 2, z = -6..6 step 2. +X east, -Z north.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// Ground: one family (stone-ground), cavern plus one ring tile for the backdrop.
for (let x = -9; x <= 9; x += 2) for (let z = -8; z <= 8; z += 2) if (Math.abs(x) < 9 || z === -8) put('stone-ground', x, z);

// Walls: north, west, east stone-wall (faces +Z at yaw 0); south edge is a low boulder lip.
for (let x = -7; x <= 7; x += 2) put('stone-wall', x, -6.9);
for (let z = -6; z <= 6; z += 2) {
  put('stone-wall', -7.9, z, { yaw: 90 });
  put('stone-wall', 7.9, z, { yaw: 270 });
}
// Tunnel mouth in the north wall with timber supports.
put('wall-alcove', -2, -6.55); put('lantern', -3.7, -5.6, { scale: 0.7 });
put('timber-wall', -3.6, -6.0, { yaw: 90 }); put('timber-wall', -0.4, -6.0, { yaw: 90 });
put('rubble', -2.8, -5.0, { yaw: 30 }); put('coal', -1.4, -5.2, { yaw: 70, scale: 1.4 }); put('iron-ore', -2.2, -4.6, { scale: 1.8 });
// Dark continuous rock wall: second course on the inner walls, plus an outer scaled wall on the ring.
for (let x = -7; x <= 7; x += 2) put('stone-wall', x, -6.9, { y: 1.5 });
for (let z = -6; z <= 6; z += 2) { put('stone-wall', -7.9, z, { yaw: 90, y: 1.5 }); put('stone-wall', 7.9, z, { yaw: 270, y: 1.5 }); }
for (let x = -9; x <= 9; x += 3) put('stone-wall', x, -8.4, { scale: 1.5 });
// Tunnel mouths: alcoves with timber supports and a lantern each.
put('wall-alcove', -6, -6.55); put('timber-wall', -7.6, -6.0, { yaw: 90 }); put('timber-wall', -4.4, -6.0, { yaw: 90 }); put('lantern', -5.2, -5.4, { scale: 0.7 });
put('wall-alcove', -7.7, -1.5, { yaw: 90 }); put('timber-wall', -7.0, -3.1, { yaw: 0 }); put('timber-wall', -7.0, 0.1, { yaw: 0 }); put('lantern', -6.6, -1.5, { scale: 0.7 });
// Rubble heaps in front of the walls (south edge).
for (let x = -7; x <= 7; x += 3.5) put('rubble', x, 6.7, { yaw: x * 23, scale: 1.2 });
// Rail line: east-west run at z = 2, spur north to the tunnel at x = -2.
const rail = (x0, z0, dir, len) => {
  const horiz = dir === 'x';
  for (let i = 0; i < len; i++) {
    const a = i + 0.5;
    const x = horiz ? x0 + a : x0, z = horiz ? z0 : z0 - a;
    for (const s of [-0.3, 0.3]) put('beam', horiz ? x : x + s, horiz ? z + s : z, { scale: 0.5, yaw: horiz ? 0 : 90 });
    for (const t of [0.15, 0.65]) {
      const sx = horiz ? x0 + i + t : x0, sz = horiz ? z0 : z0 - i - t;
      put('beam', sx, sz, { scale: 0.4, yaw: horiz ? 90 : 0 });
    }
  }
};
rail(-7, 2, 'x', 14);
rail(-2, 1.7, 'z', 7);

// Focal: loaded cart on the main line, coal heaped inside, lift in the NE.
put('handcart', 1.2, 2, { yaw: 90, scale: 1.3 });
put('coal', 1.2, 1.9, { scale: 1.2 }); put('coal', 1.0, 2.15, { yaw: 80 }); put('coal', 1.45, 2.1, { yaw: 160 });
put('elevator-platform', 5.2, -5.3);
put('crate', 3.0, -5.9, { yaw: 10 }); put('crate', 3.0, -5.4, { yaw: 350, scale: 0.9 });
put('barrel', 7.0, -4.0, { yaw: 40, scale: 0.9 });
// Tool zone by the elevator: pick rack of standing tools against the east wall.
[[7.1, -1.8], [7.1, -1.4], [7.1, -1.0], [7.1, -0.6]].forEach(([x, z], i) =>
  put(i % 2 ? 'mining-pick' : 'pickaxe', x, z, { yaw: 270 }));
put('shovel', 7.1, -0.2, { yaw: 270 });
put('wheelbarrow', 5.3, -2.2, { yaw: 200 });
// Ore stockpile zone, SW: sacks, barrels, ore lumps.
put('barrel', -7.0, 4.4, { yaw: 30 }); put('barrel', -6.2, 4.9, { yaw: 120 }); put('barrel', -7.0, 5.5, { yaw: 200, scale: 0.9 });
put('crate', -4.8, 5.2, { yaw: 15 }); put('crate', -4.2, 5.4, { yaw: 345, scale: 0.9 }); put('sack', -5.4, 4.3); put('sack', -3.6, 4.7, { yaw: 90 }); put('sack', -3.8, 5.5, { yaw: 30 });
const ORES = ['iron-ore', 'gold-ore', 'copper-ore', 'silver-ore'];
for (let i = 0; i < 8; i++) put(ORES[i % 4], -6.3 + (i % 4) * 0.5, 3.4 - Math.floor(i / 4) * 0.45, { yaw: i * 50, scale: 1.8 });
put('coal', -5.0, 3.5, { scale: 1.5 }); put('coal', -4.5, 3.9, { yaw: 120, scale: 1.3 });
put('rubble', -3.0, 3.6, { yaw: 40 }); put('rubble', 3.5, 4.6, { yaw: 200 });
// Ore veins at the foot of the west and north walls.
['gold-ore', 'iron-ore', 'copper-ore', 'silver-ore', 'gold-ore', 'iron-ore'].forEach((a, i) =>
  put(a, -7.45, -4.8 + i * 1.5, { yaw: i * 60, scale: 3 }));
['silver-ore', 'copper-ore', 'gold-ore'].forEach((a, i) => put(a, 2.2 + i * 1.0, -6.45, { yaw: i * 80, scale: 3 }));
// Lights and wall sconces.
for (const [x, z] of [[-6.5, 0.6], [6.4, 3.4], [-0.4, -4.4], [4.0, -3.6], [6.6, 6.2]]) put('lantern', x, z, { scale: 0.7 });
for (const x of [-6, 2, 6]) put('torch-sconce', x, -6.75);
put('torch-sconce', -7.75, -1.0, { yaw: 90 }); put('torch-sconce', 7.75, 2.0, { yaw: 270 });
// Edge dressing: stalagmites and crystals in corners.
put('stalagmite', -7.2, -6.2); put('stalagmite', 7.0, 6.0, { yaw: 120 });
put('crystal-cluster', -7.0, 6.3, { yaw: 30 }); put('crystal-cluster', 7.0, -6.2, { yaw: 100 });
// Loading yard around the cart: ore piles, barrels, crates, miners.
const YARD = ['iron-ore', 'gold-ore', 'copper-ore', 'silver-ore'];
for (let i = 0; i < 8; i++) put(YARD[i % 4], 2.6 + (i % 4) * 0.45, 3.5 + Math.floor(i / 4) * 0.45, { yaw: i * 47, scale: 2 });
put('barrel', 4.8, 3.2, { yaw: 20 }); put('barrel', 5.5, 3.6, { yaw: 100, scale: 0.9 }); put('crate', 4.6, 4.2, { yaw: 350 }); put('crate', 5.2, 4.5, { yaw: 20, scale: 0.9 });
put('explorer', 2.4, 0.8, { yaw: 160 }); put('villager', -0.3, 3.6, { yaw: 40 });
put('lantern', 2.0, 4.6, { scale: 0.7 }); put('lantern', 0.2, 0.9, { scale: 0.7 });
put('gold-ore', -7.45, -3.4, { scale: 3 }); put('gold-ore', 7.45, 4.4, { scale: 3, yaw: 90 });
put('mining-pick', 2.9, 3.2, { yaw: 60 }); put('pickaxe', -0.4, 3.0, { yaw: 300 });

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${num(p.yaw % 360)}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/mine.ts', `// GENERATED by scripts/design-mine.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/mine.md', `# Mine map (generated by scripts/design-mine.mjs)

16 x 14 m cavern (8 x 7 stone-ground tiles) in a one-tile ring. Stone-wall on north, west, east with a cave mouth and timber supports in the north.
Rail line runs east-west at z=2 with a spur north to the tunnel; a coal-loaded handcart is the focal object.
Zones: SW ore stockpile (barrels, sacks, ore), NE lift and tool rack, wall ore veins.

| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log(places.length, JSON.stringify(tally));
