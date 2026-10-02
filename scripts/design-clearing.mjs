#!/usr/bin/env node
// Forest clearing map designer: a sunny glade, 10 x 9 tiles of 2 m (20 m x 18 m), one ground family.
// Cell centers: x = -9..9 step 2, z = -8..8 step 2. +X east, -Z north.
// Zones: camp (campfire, log + stump seats, hunter) west; lean-to tent NW; stream with bridge and
// stepping stones along x = 5; flower patch with deer SW of the stream, mushrooms and boulders east.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const jit = (v, a) => v + (rnd() - 0.5) * 2 * a;

// --- ground ---
const PATH = new Set(['-1,6', '-1,4', '-1,2', '-3,0', '-3,-2', '-5,-2']);
for (let x = -9; x <= 9; x += 2)
  for (let z = -8; z <= 8; z += 2) {
    if (x === 5) { put('river-straight', x, z); if (z === 6) put('stepping-stone', x, z, { y: -0.06 }); }
    else if (PATH.has(`${x},${z}`)) put('dirt-ground', x, z);
    else put('forest-ground', x, z);
  }

// --- camp zone ---
put('campfire', -2.2, 0.6, { scale: 1.5 });
put('fallen-log', -4.1, 1.0, { yaw: 100 });
put('fallen-log', -2.0, -1.8, { yaw: 85, scale: 0.9 });
put('tree-stump', -0.4, 1.9, { yaw: 20 });
put('tree-stump', -3.6, 2.9, { yaw: 200, scale: 0.9 });
put('stump', -0.2, -0.8, { yaw: 120 });
put('hunter', -4.2, -0.2, { yaw: 140, scale: 1.6 });
put('log', -6.2, 0.2, { yaw: 70 });
put('log', -6.0, 0.9, { yaw: 80, scale: 0.9 });
for (const [x, z, a] of [[-1.2, 0.0, 30], [-3.3, 0.5, 70], [-2.1, 1.8, 150]]) put('rock-cluster', x * 1.0 - 0.0, z, { yaw: a, scale: 0.35 });

// --- hunters lean-to (NW) ---
put('tent', -6.4, -3.6, { yaw: 35, scale: 1.4 });
put('log', -4.6, -4.6, { yaw: 10 });
put('log', -4.5, -4.2, { yaw: 15, scale: 0.9 });
put('bush', -8.0, -2.0, { yaw: 40 });
put('fern', -7.8, -5.4, { yaw: 100 });
put('fern', -4.4, -3.0, { yaw: 60 });
put('boulder', -8.2, -4.6, { yaw: 30, scale: 0.8 });
put('campfire-out', -5.0, -1.8, { yaw: 40, scale: 1.1 });

put('barrel', -7.9, -2.6, { yaw: 20 });
put('crate', -5.0, -5.6, { yaw: 25 });
put('crate', -4.3, -5.5, { yaw: 70, scale: 0.8 });
put('firewood', -8.0, -3.4, { yaw: 80 });
put('glowing-mushroom', -0.9, 2.7, { yaw: 30 });
put('red-mushroom', -0.2, 2.6, { yaw: 60 });
put('mushroom-cluster', -4.4, 3.6, { yaw: 100 });
put('glowing-mushroom', -4.6, 2.3, { yaw: 10 });
put('red-mushroom', -0.8, -0.2, { yaw: 40 });
// --- stream ---
put('bridge', 5, -2.0, { yaw: 0 });
for (const z of [-7, -5, 0, 3, 4.6, 7.6]) put('reeds', 5.9, z, { yaw: jit(0, 160) + 160 });
for (const z of [-6.2, -3.8, 2, 5.4]) put('reeds', 4.2, z, { yaw: 40 + z * 20 });
put('rock-cluster', 3.9, -4.6, { yaw: 80, scale: 0.7 });
put('rock-cluster', 6.2, 1.2, { yaw: 200, scale: 0.7 });
put('boulder', 6.4, -5.2, { yaw: 120, scale: 0.7 });

// --- flower patch and deer (SW of the stream) ---
const FL = [[1.2,5.0],[2.2,4.2],[3.0,5.6],[0.8,6.4],[2.0,6.8],[3.2,3.0],[1.6,3.0],[0.0,5.2],[-0.8,6.8],[3.4,7.0]];
FL.forEach(([x, z], i) => put('wildflowers', x, z, { yaw: i * 47, scale: 1.1 }));
put('deer', 2.0, 5.4, { yaw: 215, scale: 1.7 });
put('deer', 7.4, 4.6, { yaw: 120, scale: 1.2 });
put('bush', 0.2, 4.0, { yaw: 100, scale: 0.8 });

// --- east bank: mushrooms, grass, boulders ---
put('mushroom-cluster', 7.0, -3.4, { yaw: 30 });
put('red-mushroom', 7.6, -3.0, { yaw: 80 });
put('red-mushroom', 6.8, -2.7, { yaw: 150, scale: 0.9 });
put('red-mushroom', -7.6, 3.4, { yaw: 10 });
put('red-mushroom', -7.2, 3.8, { yaw: 90, scale: 0.8 });
put('mushroom', 1.4, -4.8, { yaw: 50 });
put('boulder', 8.0, 1.8, { yaw: 40 });
put('rock-cluster', 7.4, 0.2, { yaw: 100, scale: 0.8 });
put('fallen-log', 7.8, -0.9, { yaw: 160, scale: 0.9 });
put('tree-stump', 6.8, 3.0, { yaw: 60, scale: 0.8 });

// --- scattered grass tufts along zone edges (not in open ground) ---
const TG = [[-8.4,1.0],[-8.4,5.0],[-6.0,4.6],[-5.2,6.4],[-2.6,5.4],[-0.2,7.2],[2.8,1.2],[3.0,-1.4],[0.8,-1.0],[1.2,-3.2],[3.6,-6.4],[-1.0,-6.4],[-3.6,-6.6],[6.6,-6.8],[8.2,-1.2],[8.4,5.4],[6.4,7.0],[7.8,3.8],[-8.4,-6.6],[-6.6,6.8]];
TG.forEach(([x, z], i) => put(i % 3 === 0 ? 'fern' : 'tall-grass', x, z, { yaw: i * 63 }));

// --- treeline ring (tall) ---
const T = ['oak-tree', 'pine-tree', 'birch-tree'];
let ti = 0;
const tree = (x, z, s = 1.2) => put(T[ti++ % 3], jit(x, 0.3), jit(z, 0.3), { yaw: Math.floor(rnd() * 360), scale: +(s * (0.9 + rnd() * 0.3)).toFixed(2) });
for (let x = -9; x <= 9; x += 2) {
  if (x !== 5) tree(x, -8.2, 0.95);
  if (x !== -1 && x !== 5) tree(x, 8.2, x >= -3 ? 0.55 : 0.95);
}
for (let z = -6; z <= 6; z += 2) {
  tree(-9.3, z, 0.95);
  tree(9.3, z, 0.95);
}
for (let x = -8; x <= 8; x += 4) if (x !== 4) tree(x, -6.5, 0.8);
for (let x = -8; x <= 8; x += 4) if (x < -4) tree(x, 6.6, 0.8);
tree(-9.0, -7.2, 0.9); tree(9.0, -7.2, 0.9); tree(-9.0, 7.2, 0.9); tree(9.0, 7.2, 0.55);
// inner edge dressing
for (const [x, z] of [[-8.6,-6.8],[-3,-7.2],[2.4,-7.0],[8.6,-6.0],[8.6,6.6],[-3.8,7.0],[3.0,7.4],[-8.6,6.6],[-8.8,-1.0],[8.8,-3.0]])
  put(rnd() < 0.5 ? 'bush' : 'bramble', x, z, { yaw: Math.floor(rnd() * 360) });

// --- emit ---
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/clearing.ts', `// GENERATED by scripts/design-clearing.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/clearing.md', `# Forest clearing (generated by scripts/design-clearing.mjs)

20 m x 18 m sunny glade: 10 x 9 forest-ground tiles (tile centers x -9..9, z -8..8), ${places.length} pieces.

## Layout
- Camp (west): campfire with two logs and three stump seats, a hunter, firewood logs.
- Lean-to (NW): tent, stacked logs, burned-out fire, boulder and ferns.
- Stream (x = 5, N-S): bridge at z -2, stepping stones over the tile at z 6, reeds on both banks.
- Flower patch (SW of stream): wildflowers around a deer; a second deer on the east bank.
- East bank: mushrooms, boulders, a fallen log. A dirt-ground path curves from the south entry past the campfire to the tent.
- Tall oak, pine and birch ring on all edges (no ancient oak, no well).

## Tally
${Object.entries(tally).sort().map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## Notes
Mockup docs/map-mockups/clearing.jpg was absent; the layout follows the brief text.
`);
console.log(places.length + ' pieces');
