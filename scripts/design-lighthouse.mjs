#!/usr/bin/env node
// Lighthouse map designer: rocky headland, tower, keeper cottage, stair path, water and beach.
// Writes scenes/maps/lighthouse.ts and docs/map-mockups/lighthouse.md from one data table.
// Grid: 12 x 12 tiles of 2 m, tile (i,j) center x=(i-5.5)*2, z=(j-5.5)*2. Grass headland i,j 3..8.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const C = (i) => (i - 5.5) * 2;

// --- ground ---
for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
  const x = C(i), z = C(j);
  const inner = i >= 3 && i <= 8 && j >= 3 && j <= 8;
  if (inner) {
    put('grass-ground', x, z);
    continue;
  }
  const beach = i === 0 || i === 11 || j === 0 || j === 11 || (i + j < 6 && (i < 2 || j < 2)) || (i + j > 17 && (i > 9 || j > 9));
  if (beach) put('desert-ground', x, z);
  else put('sea-water', x, z);
}

// --- cliff ring (outward faces: south yaw 0, north 180, east 90, west 270) ---
const cliff = (x, z, yaw, s = 1) => put('cliff-face', x, z, { yaw, scale: s });
const S = 0.62, STEP = 2.1;
for (let k = -3; k <= 3; k++) {
  const t = k * STEP;
  if (!(t > -4.0 && t < -1.2)) cliff(t, 6.5, 0, S + 0.06 * (k & 1)); // south, gap for the stair
  cliff(t, -6.5, 180, S + 0.06 * (k & 1));
  cliff(6.5, t, 90, S + 0.06 * ((k + 1) & 1));
  cliff(-6.5, t, 270, S + 0.06 * ((k + 1) & 1));
}
// rock caps and shore rubble on the rim
const rim = [[-6.0, 5.8], [-4.2, 6.2], [-0.8, 6.0], [2.2, 6.2], [5.0, 6.0], [6.2, 5.0], [6.2, 2.0], [6.0, -1.8], [6.2, -5.0], [4.0, -6.0],
  [1.5, -6.0], [-1.6, -6.0], [-4.6, -6.0], [-6.2, -4.2], [-6.0, -1.0], [-6.2, 2.0], [-6.0, 5.0]];
rim.forEach(([x, z], k) => put(k % 3 ? 'boulder' : 'rock-cluster', x, z, { yaw: (k * 67) % 360, scale: k % 3 ? 0.6 + 0.1 * (k % 3) : 0.9, y: 0 }));
// stack rocks in the water at the foot of the cliffs
const sea = [[-8.2, 7.2], [-3.0, 8.0], [1.8, 8.2], [5.2, 8.0], [8.2, 6.0], [8.0, 1.0], [8.2, -3.5], [7.6, -7.8], [3.0, -8.2], [-2.5, -8.0], [-7.6, -7.2], [-8.2, -2.0], [-8.0, 3.0]];
sea.forEach(([x, z], k) => put(k % 2 ? 'boulder' : 'rock-cluster', x, z, { yaw: (k * 53) % 360, scale: k % 2 ? 1.1 : 1.5, y: -0.03 }));
['river-rock'].forEach(() => { [[-9.5, 5.4], [9.4, 4.0], [9.0, -5.6], [-9.4, -5.5], [0.5, 9.4], [-5.5, 9.3], [6.0, -9.2]].forEach(([x, z], k) => put('river-rock', x, z, { yaw: k * 80, scale: 1.4, y: -0.03 })); });

// --- focal: tower on its rock footing; cottage; path ---
put('lighthouse', 1.4, -3.4, { scale: 1.1 });
[[-0.4, -2.6], [3.2, -2.4], [3.4, -4.6], [-0.2, -4.8], [1.6, -5.4]].forEach(([x, z], k) => put('boulder', x, z, { yaw: k * 70, scale: 0.7 }));
put('cottage', -3.8, -3.4, { yaw: 15 });
put('stairs-stone', -2.6, 6.0);
const PATH = [['footpath-straight', -3, 4, 0], ['footpath-straight', -3, 2, 0], ['footpath-corner', -3, 0, 270],
  ['footpath-straight', -1, 0, 90], ['footpath-corner', 1, 0, 90], ['footpath-straight', 1, -2, 0]];
for (const [a, x, z, yaw] of PATH) put(a, x, z, { yaw, y: 0.02 });

// --- cottage yard and coast dressing ---
put('fence', -6.0, -0.8, { yaw: 90, scale: 0.9 }); put('fence', -5.0, -0.6, { yaw: 5, scale: 0.9 });
put('fence', -2.6, -0.8, { yaw: 0, scale: 0.9 });
put('lantern', -1.8, -1.1, { scale: 0.8 }); put('lantern', -3.9, 2.9, { scale: 0.8 });
put('signpost', -1.2, 4.4, { yaw: 160, scale: 0.9 });
put('barrel', -5.9, -2.4, { yaw: 20 }); put('barrel', -5.5, -1.6, { yaw: 100, scale: 0.9 });
put('crate', -5.3, -2.3, { yaw: 30 }); put('crate', -4.8, -1.4, { yaw: 70, scale: 0.85 });
put('rope-coil', -2.2, -1.6, { yaw: 40 });
put('fishing-net', -4.6, -5.4, { yaw: 180 });
put('bench', 3.8, -0.8, { yaw: 270 });
put('well', 4.6, 3.4, { scale: 0.8 });
put('hay-bale', -5.2, 3.6, { yaw: 30, scale: 0.7 });
put('rowboat', -8.4, 4.6, { yaw: 20, y: -0.02 });
put('dock', -8.6, -3.6, { yaw: 270 });
put('rowboat', 8.2, -1.0, { yaw: 100, y: -0.02, scale: 0.8 });

const G = [];
for (let k = 0; k < 40; k++) {
  const a = k * 2.399, r = 1.2 + ((k * 37) % 40) / 10; // golden-angle scatter
  const x = Math.cos(a) * r * 1.2, z = Math.sin(a) * r * 1.2;
  if (Math.abs(x) > 5.2 || Math.abs(z) > 5.2) continue;
  if (Math.hypot(x - 1.4, z + 3.4) < 2.6 || Math.hypot(x + 3.8, z + 3.4) < 2.3) continue;
  if (Math.abs(x + 3) < 1.1 && z > -0.8 && z < 5) continue; // stair path
  if (Math.abs(z) < 1.1 && x > -3.8 && x < 1.9) continue; // east-west path
  if (Math.abs(x - 1) < 1.1 && z < 0.5 && z > -2.6) continue;
  G.push([x, z, ['tall-grass', 'wildflowers', 'bush', 'tall-grass', 'wildflowers'][k % 5], (k * 41) % 360]);
}
for (const [x, z, a, yaw] of G) put(a, x, z, { yaw });
[[-5.4, 4.4], [5.2, 5.0], [5.4, -3.6], [4.8, 2.0]].forEach(([x, z], k) => put('bush', x, z, { yaw: k * 90, scale: 1.1 }));
// tufts on the beach
for (let k = 0; k < 14; k++) {
  const a = k * 0.45;
  const x = 10.2 * Math.cos(a * 2.2) , z = 10.2 * Math.sin(a * 2.2);
  const on = places.find((p) => p.asset === 'desert-ground' && Math.abs(p.at[0] - x) < 1 && Math.abs(p.at[2] - z) < 1);
  if (on) put(k % 2 ? 'reeds' : 'rock-cluster', x, z, { yaw: k * 50, scale: k % 2 ? 1 : 0.9 });
}

// --- emit ---
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${p.at.map(num).join(', ')}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${num(p.scale)}` : ''} },`;
writeFileSync('scenes/maps/lighthouse.ts', `// GENERATED by scripts/design-lighthouse.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] { return [
${places.map(fmt).join('\n')}
]; }
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/lighthouse.md', `# Lighthouse map (generated)

GENERATED by \`scripts/design-lighthouse.mjs\`. Mockup: \`lighthouse.jpg\`.

12 x 12 tiles of 2 m (24 m). A 12 m grass headland (tiles 3..8) is ringed by cliff-face rock, boulders and rock
clusters. Water tiles (sea-water) surround it with a desert-ground beach in the outer ring. The tower
stands on a boulder footing in the north-east, the keeper cottage in the north-west with a fenced yard.
A stone stair climbs from the south shore, then a footpath runs north, east, and north to the tower door.
A rowboat floats west; a second boat and a dock sit on the sides. The striped lighthouse is the focal tower;


## Tally

| asset | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length} placements.
`);
console.log(places.length, JSON.stringify(tally));
