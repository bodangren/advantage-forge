#!/usr/bin/env node
// Cemetery map designer (P2): 18 x 16 m iron-fenced graveyard, open ground in daylight.
// Grid: 9 x 8 tiles of 2 m. col 1..9 west->east, row 1..8 north->south.
// Cell (c,r) center: x = (c-5)*2, z = (r-4.5)*2. +X east, -Z north.
// Anchor: docs/map-mockups/cemetery.jpg. Writes scenes/maps/cemetery.ts and docs/map-mockups/cemetery.md.
import { writeFileSync } from 'node:fs';

const X = (c) => (c - 5) * 2;
const Z = (r) => (r - 4.5) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// Winding gravel path (dirt-ground tiles): south gate (c7) -> west -> north -> east -> north to the chapels.
const PATH = new Map(['7,8','7,7','7,6','6,6','5,6','5,5','5,4','6,4','7,4','7,3','7,2'].map((k) => [k, ['dirt-ground', 0]]));
// Ground: stone-ground inside the fence, a thin forest-ground ring outside it.
for (let c = 0; c <= 10; c++)
  for (let r = 0; r <= 9; r++) {
    const inside = c >= 1 && c <= 9 && r >= 1 && r <= 8;
    const path = PATH.get(`${c},${r}`);
    if (path) put(path[0], X(c), Z(r), { yaw: path[1] });
    else put(inside ? 'stone-ground' : (c === 0 || c === 10 || r === 0 || r === 9) && (c === 0 || c === 10 || r === 0 || r === 9) ? 'dirt-ground' : 'stone-ground', X(c), Z(r));
  }

// Iron fence boundary. Pieces are 1.8 m apart; the south row is offset so a gate sits at x = 4.
const FX = [-8.6, -6.8, -5, -3.2, -1.4, 0.4, 2.2, 5.8, 7.6];
for (const x of FX) {
  put('fence', x, -8);
  if (x !== 2.2 && x !== 5.8) put('fence', x, 8); else put('fence', x === 2.2 ? 2.2 : 5.8, 8);
}
// gap in the south row between 2.2 and 5.8 (3.6 m) holds the gate; remove the pieces that would close it
// (they are kept: posts at 2.2+0.9 and 5.8-0.9 frame a 1.8 m opening at x = 3.1..4.9)
put('archway', 4, 8, { scale: 1.1 });
put('gate', 4, 7.8, { scale: 0.9 });
put('pillar', 2.95, 8, { scale: 1.3 }); put('pillar', 5.05, 8, { scale: 1.3 });
for (const x of [-7.7, -4.1, -0.5, 3.1, 6.7]) put('pillar', x, -8, { scale: 0.8 });
for (const x of [-7.7, -4.1, -0.5]) put('pillar', x, 8, { scale: 0.8 });
for (const [x, z] of [[-9, -8], [9, -8], [-9, 8], [9, 8]]) put('pillar', x, z, { scale: 1.0 });
for (const z of [-6.2, -2.6, 1.0, 4.6]) { put('pillar', -9, z, { scale: 0.8 }); put('pillar', 9, z, { scale: 0.8 }); }
for (let z = -7.1; z <= 7.3; z += 1.8) { put('fence', -9, z, { yaw: 90 }); put('fence', 9, z, { yaw: 90 }); }

// Focal: crypt chapel at the end of the path (north), plus a west chapel and a small east one.
put('crypt-chapel', 4, -5.9, { scale: 0.8 });
put('crypt-chapel', -3.6, -5.9, { scale: 0.8 });
// pale pieces balance the dark chapels
put('statue', 0.2, -6.4, { scale: 0.95 });
put('column', -1.9, -4.6, { scale: 0.8 }); put('column', 2.2, -4.6, { scale: 0.8 });
put('column', -5.9, -4.9, { scale: 0.7 }); put('column', 6.9, -4.9, { scale: 0.7 });
put('urn', -5.5, -3.9); put('urn', 6.3, -3.9); put('urn', -1.6, -3.7); put('urn', 2.3, -3.7);
put('statue', -6.4, 2.6, { yaw: 90, scale: 0.8 });
// Gravedigger shed east of the path, with tools.
put('shed', 7, 0.6, { yaw: 270 });
put('shovel', 5.9, 1.9, { yaw: 20 });
put('wheelbarrow', 7.2, 2.5, { yaw: 160 });
put('bone-pile', 5.9, -0.7, { yaw: 40 });

// Rows of gravestones (each row ends clear of chapels and the path).
const row = (x0, x1, z, step, yaw0 = 0, sc = 1) => {
  let i = 0;
  for (let x = x0; x <= x1 + 0.01; x += step, i++) put('gravestone', x, z, { yaw: yaw0 + [4, -6, 8, -3, 2][i % 5], scale: sc * [1, 0.9, 1.1, 1, 0.95][i % 5] });
};
row(-8.0, -5.8, -6.8, 1.1); // NW row, back
row(-8.0, -6.6, -4.4, 1.15); // NW row 2
row(-7.8, -1.0, -2.2, 1.15); // west row 3
row(-3.4, -1.4, 0.3, 1.0); // beside the west chapel
row(-4.8, -1.0, 5.0, 1.15); // SW row
row(-7.8, -1.0, 6.9, 1.15);
row(1.4, 2.6, -2.2, 1.2); // inside the S of the path
row(6.0, 8.0, 4.4, 1.0, 180); // SE
row(5.6, 8.0, 6.6, 1.2, 180);
row(0.6, 3.0, 1.6, 1.2);
row(6.4, 8.0, -2.4, 0.8);
row(6.8, 8.0, -4.0, 1.2, 180);
put('bench', -2.2, 3.0, { yaw: 0, scale: 0.9 });
for (const [x, z, y] of [[-8.2, -0.6, 0], [-2.2, 1.6, 20], [0.9, 5.4, 0], [1.6, 7.2, 0], [-8.2, 4.4, 0], [8.2, 7.2, 0]]) put('urn', x, z, { yaw: y });
// Lanterns on posts: gate flanks, east side, west side.
put('lantern', 1.9, 7.4); put('lantern', 6.1, 7.4);
put('lantern', 8.2, -1.8, { yaw: 270 }); put('lantern', -8.2, 5.4, { yaw: 90 });
put('lantern', -0.4, -1.8);
// Dead trees: one by the west gate side, one at the north, more beyond the fence.
put('dead-tree', -7.2, 5.9, { yaw: 30, scale: 1.4 });
put('dead-tree', 7.4, -6.6, { yaw: 200, scale: 1.5 });
put('dead-tree', -10.4, -3, { yaw: 100, scale: 1.2 });
put('dead-tree', 10.4, 3, { yaw: 300, scale: 1.2 });
put('dead-tree', 9.9, -6.5, { yaw: 60, scale: 1.1 });
put('willow-tree', -10.6, 5.5, { yaw: 120, scale: 0.9 });
put('willow-tree', 5.5, 9.9, { yaw: 40, scale: 0.8 });
put('willow-tree', -3, -9.9, { yaw: 220, scale: 0.9 });
// Wilted flowers and bushes at fence feet, edge dressing in the ring.
const FL = [[-8.2, -7.4], [-5.8, -7.4], [-2.2, -7.4], [2.8, -7.4], [-8.2, 2.2], [-8.2, 7.4], [-5.2, 7.4], [-2.6, 7.4], [-0.4, 7.4], [8.2, 3.2], [8.3, 5.4], [8.3, 7.4], [8.3, -6.8], [8.3, -0.6], [-1.2, 3.8], [1.2, -0.1], [3.1, -2.1]];
FL.forEach(([x, z], i) => put('wildflowers', x, z, { yaw: i * 47, scale: 0.8 }));
const OUT = [[-9.9, 8.4], [-6.5, 9.6], [-1.5, 9.8], [2, 9.9], [9.8, 9], [10, 0], [9.6, -9.6], [6, -9.9], [-9.9, -9.4], [-10, 1.2], [-10.2, 9.6], [10, 5.9]];
OUT.forEach(([x, z], i) => put(i % 2 ? 'bush' : 'bramble', x, z, { yaw: i * 71 }));
for (const [x, z] of [[-9.9, -6], [10.1, -2.8], [10, 7.6], [-4.5, 9.8]]) put('rock-cluster', x, z, { yaw: x * 13 });

for (const [x, z] of [[-6.6, -1.8], [-3.0, -1.8], [-6.6, 7.3], [-2.6, 5.5], [7.1, 5.0], [1.4, 2.0]]) put('candle-cluster', x, z, { scale: 0.8 });
for (const [x, z] of [[-5.9, -1.7], [-1.8, -1.7], [-4.2, 6.3], [-2.9, 4.6], [7.6, 6.3], [2.7, 2.1], [-7.0, -4.0]]) put('wildflowers', x, z, { scale: 0.55 });
for (const [x, z] of [[-3.8, -2.2], [-7.4, 6.4], [7.6, 7.0]]) put('bone-pile', x, z, { yaw: x * 9 });
const TG = [[-9.9, 4], [-10, -4.6], [9.9, 2], [10, -5], [-7, 9.9], [7.2, 9.9], [0.6, 9.9], [-9.9, 7], [9.9, 8], [-3.5, -9.9], [3, -9.9], [9.8, -8.6], [-9.8, -8.6]];
TG.forEach(([x, z], i) => put('tall-grass', x, z, { yaw: i * 53, scale: 1.1 }));
// ASCII map
const g = Array.from({ length: 8 }, () => Array(9).fill('.'));
for (const k of PATH.keys()) { const [c, r] = k.split(',').map(Number); g[r - 1][c - 1] = '='; }
const mark = (x, z, ch) => { const c = Math.round(x / 2 + 5), r = Math.round(z / 2 + 4.5); if (c >= 1 && c <= 9 && r >= 1 && r <= 8) g[r - 1][c - 1] = ch; };
mark(4, -5.9, 'C'); mark(-6.4, 2.6, 'c'); mark(7, 0.6, 'S'); mark(4, 8, 'G');
console.log(g.map((r) => '  ' + r.join(' ')).join('\n'));

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/cemetery.ts', `// GENERATED by scripts/design-cemetery.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/cemetery.md', `# Cemetery map plan (generated)

GENERATED by \`scripts/design-cemetery.mjs\`. 9 x 8 tiles of 2 m (18 x 16 m) of stone-ground inside an iron fence,
a thin forest-ground ring outside. Gravel path enters at the south gate (x = 4), winds west, north, east and ends at the crypt chapel.

\`\`\`
${g.map((r) => '  ' + r.join(' ')).join('\n')}
\`\`\`
= path, C crypt chapel (focal), c west chapel, S gravedigger shed, G gate.

Zones: gate and gravel path (south); gravestone rows (west and north-west); crypt chapels; gravedigger shed with tools (east).

## Tally
| component | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length} placements.
`);
console.log('wrote', places.length, 'places');
