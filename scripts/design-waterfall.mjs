#!/usr/bin/env node
// Waterfall glen map designer. Grid 11 x 9 tiles of 2 m (22 m x 18 m).
// Tile (c,r): x = -10 + 2c, z = -8 + 2r, c 0..10, r 0..8. Stream runs N-S at x = 0 (c5).
// Anchor: docs/map-mockups/waterfall.jpg. Writes scenes/maps/waterfall.ts and docs/map-mockups/waterfall.md.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
// deterministic pseudo-random
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const yawr = () => Math.round(rnd() * 360);

// --- tiles
for (let c = 0; c <= 10; c++)
  for (let r = 0; r <= 8; r++) {
    const x = -10 + 2 * c, z = -8 + 2 * r;
    if (c === 5) { put('river-straight', x, z); continue; }
    const edge = c === 0 || c === 10 || r === 0;
    const rocky = r <= 1 && Math.abs(x) <= 6;
    put(rocky || edge ? 'forest-ground' : 'grass-ground', x, z);
  }

// --- cliff: three faceted masses, a gap at x=0 where the falls drop
put('cliff-face', -3.3, -7.2, { yaw: 8, scale: 1.3 });
put('cliff-face', 3.3, -7.2, { yaw: -8, scale: 1.3 });
put('cliff-face', 0, -9.0, { scale: 1.4 });
put('cliff-face', -6.6, -6.6, { yaw: 25, scale: 1.1 });
put('cliff-face', 6.6, -6.6, { yaw: -25, scale: 1.1 });
put('cliff-face', -9.2, -6.0, { yaw: 40, scale: 0.9 });
put('cliff-face', 9.2, -6.0, { yaw: -40, scale: 0.9 });
put('boulder', -1.5, -5.4, { yaw: 30, scale: 1.1 });
put('boulder', 1.5, -5.5, { yaw: 200, scale: 1.0 });
put('river-rock', -1.3, -4.4, { yaw: 60, scale: 1.3 });
put('river-rock', 1.3, -4.3, { yaw: 250, scale: 1.3 });
put('moss', -2.0, -5.2, { yaw: 20, scale: 1.2 });
put('moss', 2.1, -5.1, { yaw: 150, scale: 1.2 });
put('fern', -3.5, -5.2, { yaw: 40, scale: 1.2 });
put('fern', 3.6, -5.3, { yaw: 300, scale: 1.2 });

// --- pool
put('pond', 0, -2.4, { scale: 2.1 });
put('pond', -0.5, 0.3, { yaw: 20, scale: 2.0 });
put('pond', 0.3, 2.0, { yaw: 340, scale: 1.3 });
const ring = [[-2.9,-2.9],[-3.0,-0.9],[-2.8,1.1],[-2.0,2.7],[2.9,-2.9],[3.0,-0.8],[2.8,1.3],[1.9,2.9],[-1.6,-4.0],[1.6,-4.0]];
ring.forEach(([x, z], i) => put(i % 3 === 0 ? 'boulder' : 'river-rock', x, z, { yaw: yawr(), scale: i % 3 === 0 ? 0.7 : 1.1 }));

// --- bridge over the outflow
put('bridge', 0, 4.8, { scale: 0.9 });
put('stepping-stone', 0, 7.0, { y: -0.05 , scale: 0.3});

// --- trees: willows left, birches right (bridge-side and cliff-side)
const TREES = [
  ['willow-tree', -6.5, -2.5, 1.0], ['willow-tree', -7.5, 3.0, 1.1], ['willow-tree', -4.5, 6.5, 0.9],
  ['willow-tree', -9.5, -1.0, 1.0], ['willow-tree', -3.8, -3.2, 0.8],
  ['birch-tree', 6.0, -2.8, 1.0], ['birch-tree', 7.8, 1.5, 1.1], ['birch-tree', 5.0, 6.8, 0.95],
  ['birch-tree', 9.4, -3.0, 1.0], ['birch-tree', 4.0, -3.4, 0.8], ['birch-tree', 9.0, 6.0, 1.1],
  ['willow-tree', -9.2, 7.2, 1.1],
];
for (const [a, x, z, s] of TREES) put(a, x, z, { yaw: yawr(), scale: s });

// --- dressing: ferns, reeds, cattails, moss, mushrooms, flowers, logs, rocks
const FERN = [[-2.8,-0.8],[-3.2,2.0],[-4.5,0.5],[-2.6,4.2],[-3.4,5.8],[-5.8,-0.2],[-6.0,5.0],[-8.0,1.0],[-8.4,5.0],[-5.2,-4.6],[-7.8,-3.6],[-9.4,3.0],
  [2.8,-0.5],[3.4,2.4],[4.5,0.2],[2.9,4.5],[3.5,6.0],[6.0,3.5],[6.4,-0.8],[8.4,3.0],[8.0,6.4],[5.4,-4.8],[8.0,-4.2],[9.5,-0.5],[-1.2,6.4],[1.4,6.6],[-2.2,7.7],[2.4,7.8]];
FERN.forEach(([x, z]) => put('fern', x, z, { yaw: yawr(), scale: 0.9 + rnd() * 0.5 }));
const REED = [[-1.2,3.4],[1.2,3.2],[-1.3,6.2],[1.3,6.4],[-1.4,7.8],[1.4,8.0],[-3.4,-3.6],[3.5,-3.5],[-3.6,1.8],[3.6,0.4]];
REED.forEach(([x, z], i) => put(i % 2 ? 'cattails' : 'reeds', x, z, { yaw: yawr() }));
const MOSS = [[-3.8,-1.8],[3.9,-1.6],[-5.6,2.8],[5.8,2.6],[-2.2,2.8],[2.6,6.0],[-6.8,6.5],[7.0,5.0],[-8.6,-2.2],[8.2,-1.4],[-4.2,-5.8],[4.4,-5.9]];
MOSS.forEach(([x, z]) => put('moss', x, z, { yaw: yawr(), scale: 1 + rnd() * 0.4 }));
put('boulder', -5.2, 1.6, { yaw: 10, scale: 1.1 });
put('boulder', 5.4, 0.8, { yaw: 120, scale: 1.2 });
put('boulder', -7.5, -5.0, { yaw: 80, scale: 1.0 });
put('boulder', 7.6, -4.8, { yaw: 200, scale: 1.0 });
put('boulder', 3.8, 7.6, { yaw: 40, scale: 0.8 });
put('boulder', -3.6, 7.4, { yaw: 140, scale: 0.8 });
put('fallen-log', -4.4, 3.6, { yaw: 70 });
put('mushroom', -4.0, 3.0, { yaw: 30 });
put('mushroom', 4.6, 4.8, { yaw: 100 });
put('wildflowers', -3.0, 3.6);
put('wildflowers', 3.2, 3.8, { yaw: 90 });
put('wildflowers', 6.8, 6.6, { yaw: 200 });
put('wildflowers', -6.4, 0.8, { yaw: 40 });
put('tree-stump', 6.4, 4.4, { yaw: 60 });
put('bush', -9.4, 5.0, { yaw: 30 });
put('bush', 9.4, 1.0, { yaw: 200 });
put('bush', -8.8, -3.6, { yaw: 140 });
put('bush', 9.2, -5.0, { yaw: 300 });
put('bush', -6.0, 7.8, { yaw: 90 });
put('bush', 6.4, 7.8, { yaw: 250 });
put('rock-cluster', -8.2, 3.2, { yaw: 120 });
put('rock-cluster', 8.0, -0.6, { yaw: 30 });

// --- emit
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${num(p.scale)}` : ''} },`;
writeFileSync('scenes/maps/waterfall.ts', `// GENERATED by scripts/design-waterfall.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/waterfall.md', `# Waterfall glen (generated)

GENERATED by \`scripts/design-waterfall.mjs\`.

Grid 11 x 9 tiles of 2 m (22 m x 18 m). A cliff of faceted rock masses closes the north;
the stream (x = 0) drops from a gap in it into a pool of three ponds ringed by river rocks,
then flows south under a wooden bridge. Willows stand west, birches east; ferns, moss,
reeds and cattails dress the banks. Stepping stones sit in the pool.
No waterfall-sheet piece exists, so the falls read as the stream emerging from the gap.

| component | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log('wrote', places.length, JSON.stringify(tally));
