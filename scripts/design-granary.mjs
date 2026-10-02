#!/usr/bin/env node
// Granary map designer: 16 m x 12 m yard, raised grain barn on a stone plinth.
// Writes scenes/maps/granary.ts and docs/map-mockups/granary.md from one data table.
// Grid: 8 x 6 tiles of 2 m. +X east, -Z north.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
// deterministic jitter
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// --- ground: dirt yard, grass rim ---
for (let c = 0; c < 8; c++) for (let r = 0; r < 6; r++) {
  const x = (c - 3.5) * 2, z = (r - 2.5) * 2;
  const rim = c === 0 || c === 7 || r === 0 || r === 5;
  put(rim ? 'grass-ground' : 'dirt-ground', x, z);
}
// --- focal: barn on a two-layer stone plinth (the "stilts") ---
const BX = -2, BZ = -2.5;
for (const y of [0.3, 0.6]) for (const px of [-4, -2, 0]) for (const pz of [-3.5, -1.5]) put('stone-floor', px, pz, { y });
put('barn', BX, -2.5, { y: 0.6 });
// ramp: wooden steps up the east end of the plinth (3 abreast)
for (const dz of [-0.26, 0, 0.26]) put('stairs-wood', 1.35, -1.0 + dz * 1.6, { yaw: 90, scale: 0.24 });
// stone piers/under-barn shadow: barrels and crates beneath front edge
put('barrel', -5.4, -0.2, { yaw: 20 }); put('barrel', -4.7, -0.1, { yaw: 80 });
put('crate', -3.6, -0.15, { yaw: 5 }); put('crate', -3.55, -0.15, { y: 0.41, yaw: 25 });
// --- sacks and bales stacked at the barn front ---
const sackSpots = [[-1.2, 0.3], [-0.8, 0.45], [-0.5, 0.25], [-1.0, 0.35, 0.44], [-0.7, 0.4, 0.44], [-0.9, 0.38, 0.88]];
for (const [x, z, y] of sackSpots) put('sack', x, z, { y: y ?? 0, yaw: Math.round(rnd() * 360) });
// hay-bale pyramid west
for (const [x, z, y] of [[-6.3, -1.8, 0], [-6.3, -0.9, 0], [-6.3, -2.7, 0], [-6.3, -1.35, 0.87], [-6.3, -2.25, 0.87], [-6.3, -1.8, 1.73]]) put('hay-bale', x, z, { y, yaw: 90 });
for (const [x, z] of [[-5.5, 1.2], [-4.6, 1.0]]) put('hay-bale', x, z, { yaw: Math.round(rnd() * 40) });
put('hay-bale', -5.1, 1.1, { y: 0.87, yaw: 10 });
// stone grain store east (crates and boulder as a block)
put('crate', 5.6, -2.6, { yaw: 10, scale: 1.5 }); put('crate', 6.5, -2.3, { yaw: 350, scale: 1.4 });
put('crate', 5.9, -2.6, { y: 0.6, yaw: 30, scale: 1.4 }); put('boulder', 6.4, -3.6, { yaw: 40, scale: 0.7 });
put('barrel', 4.7, -3.8, { yaw: 120 }); put('barrel', 5.4, -4.2, { yaw: 10 });
// --- threshing floor: stone slabs + flail + sheaves + hand mill ---
for (const [x, z] of [[2, 1.5], [4, 1.5], [2, 3.5], [4, 3.5]]) put('stone-floor', x, z, { y: 0.02 });
put('flail', 2.8, 2.4, { yaw: 40 });
for (const [x, z] of [[2.3, 1.1], [3.2, 1.3], [3.8, 3.0], [2.2, 3.7], [4.6, 2.2]]) put('wheat-sheaf', x, z, { yaw: Math.round(rnd() * 360) });
put('grinding-wheel', 4.6, 3.8, { yaw: 200, scale: 1.2 });
put('sack', 5.2, 3.9, { yaw: 40 }); put('sack', 5.5, 3.6, { yaw: 120 });
// --- cart and wheelbarrow ---
put('handcart', -1.5, 3.4, { yaw: 25 }); put('hay-bale', -1.5, 3.1, { y: 0.35, yaw: 20, scale: 0.6 });
put('wheelbarrow', -3.8, 2.4, { yaw: 300 }); put('bucket', -3.0, 1.2); put('bucket', 0.6, 3.9);
put('water-trough', 0.6, -5.4 + 0.4, { yaw: 0, scale: 0.9 });
// --- footpath of stepping stones from the south to the barn ---
for (let i = 0; i < 9; i++) put('stepping-stone', 0.4 + Math.sin(i * 0.9) * 0.5, 5.4 - i * 0.62, { yaw: Math.round(rnd() * 360) });
// --- figure ---
put('farmer', 1.2, 0.8, { yaw: 200 });
// --- fences: south, west, east rims (gap at the path) ---
for (let i = 0; i < 8; i++) { const x = -7.2 + i * 1.93; if (Math.abs(x - 0.4) > 1.8) put('fence', x, 5.5); }
put('fence', 6.8, 5.5);
for (let i = 0; i < 6; i++) { put('fence', -7.6, 4.8 - i * 1.93, { yaw: 90 }); put('fence', 7.6, 4.8 - i * 1.93, { yaw: 90 }); }
// north fence (behind barn plinth only at the corners)
for (const x of [-7.2, -5.3, 4.6, 6.5]) put('fence', x, -5.7);
// --- trees at corners (golden oaks) ---
for (const [x, z, a, s] of [[-7, -5, 'apple-tree', 1], [7, -5, 'oak-tree', 1], [7.2, -3.3, 'apple-tree', 0.9], [-7.2, 5, 'oak-tree', 0.8], [7, 4.4, 'apple-tree', 0.8]].map(([x, z, a, s]) => [x, z, a, s])) put(a, x, z, { yaw: Math.round(rnd() * 360), scale: s });
// --- wheat edge rows & grass dressing ---
for (let i = 0; i < 8; i++) put('wheat-sheaf', -7 + i * 0.35, 3.6 + (i % 2) * 0.3, { yaw: Math.round(rnd() * 360), scale: 0.8 });
for (let i = 0; i < 6; i++) put('wheat-sheaf', 7 - (i % 2) * 0.4, 0.8 + i * 0.35, { yaw: Math.round(rnd() * 360), scale: 0.8 });
for (let i = 0; i < 22; i++) {
  const edge = i % 4, t = rnd();
  const x = edge < 2 ? -7.4 + t * 14.8 : (edge === 2 ? -7.3 : 7.3), z = edge === 0 ? -5.6 : edge === 1 ? 5.3 : -5 + t * 10;
  if (Math.abs(x - -2) < 3.4 && z < -0.3 && z > -5) continue;
  put(i % 3 === 0 ? 'wildflowers' : 'tall-grass', x, z, { yaw: Math.round(rnd() * 360) });
}
put('bush', -7.4, -2.8, { yaw: 40 }); put('bush', 7.4, 1.9, { yaw: 220 });
put('signpost', 1.4, 5.0, { yaw: 160 });

// --- emit ---
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${p.at.map(num).join(', ')}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/granary.ts', `// GENERATED by scripts/design-granary.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/granary.md', `# Granary map (generated)

GENERATED by \`scripts/design-granary.mjs\`. 16 m x 12 m yard (8 x 6 tiles of 2 m): dirt yard, grass rim.

## Layout
- Focal: the barn on a two-layer stone plinth (stilts stand-in), north-west of centre, wooden steps on its east end.
- West: hay-bale pyramid. East: crate and boulder grain store with barrels.
- South-east: threshing floor (stone slabs, flail, sheaves) with the hand mill (grinding wheel).
- South-west: handcart, wheelbarrow, buckets. A stepping-stone path runs from the south gate to the barn; the farmer stands on it.
- Rim: fences, golden trees, wheat sheaves, grass.

## Tally
| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}. Missing pieces: chicken (none exists), ramp (stairs-wood used).
`);
console.log('wrote', places.length, 'places');
