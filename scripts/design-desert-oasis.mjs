#!/usr/bin/env node
// Desert oasis map designer (Castle Defense level). 12 x 10 tiles of 2 m = 24 m x 20 m.
// Cell (c,r) center: x = (c-6.5)*2, z = (r-5.5)*2. +X east, -Z north.
// Trail (dirt-ground): west edge r8 east to c8, north on c8 to r4, east on r4 to the east edge.
import { writeFileSync } from 'node:fs';
const X = (c) => (c - 6.5) * 2, Z = (r) => (r - 5.5) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const trail = new Set();
for (let c = 1; c <= 9; c++) for (const r of [8, 9]) trail.add(`${c},${r}`);
for (let r = 3; r <= 9; r++) for (const c of [8, 9]) trail.add(`${c},${r}`);
for (let c = 8; c <= 12; c++) for (const r of [3, 4]) trail.add(`${c},${r}`);
const glyph = Array.from({ length: 10 }, () => Array(12).fill('.'));
for (let r = 1; r <= 10; r++) for (let c = 1; c <= 12; c++) {
  const t = trail.has(`${c},${r}`);
  put(t ? 'dirt-ground' : 'desert-ground', X(c), Z(r));
  if (t) glyph[r - 1][c - 1] = '=';
}
// --- zone 1: palm-ringed pond (north-west), the focal object ---
const PX = -5.2, PZ = -2.6;
put('pond', PX, PZ, { scale: 2.7 });
put('palm-tree', PX + 4.6, PZ - 1.2, { yaw: 40, scale: 1.4 });
put('palm-tree', PX - 4.4, PZ - 0.5, { yaw: 130, scale: 0.9 });
put('palm-tree', PX - 1.0, PZ - 3.6, { yaw: 250, scale: 1.0 });
put('palm-tree', PX + 1.2, PZ + 3.6, { yaw: 310, scale: 0.9 });
for (const [dx, dz, y] of [[-3.5, 2.2, 10], [3.4, 2.4, 90], [-3.6, -2.2, 200], [0.2, -2.9, 40], [2.6, -2.6, 150], [-1.5, 3.0, 300]]) put(dx < 0 || dz < 0 ? 'reeds' : 'cattails', PX + dx, PZ + dz, { yaw: y });
put('cactus', PX - 3.2, PZ + 4.2, { yaw: 30, scale: 0.9 });
put('rock-cluster', PX + 4.6, PZ + 3.6, { yaw: 100, scale: 1.2 });
// --- zone 2: nomad tent camp (north-centre) ---
put('tent', 1.2, -7.2, { yaw: 160, scale: 1.3 });
put('tent', 4.4, -7.4, { yaw: 200, scale: 1.0 });
put('tent', -1.2, -8.0, { yaw: 120, scale: 0.9 });
put('awning', 2.6, -5.4, { yaw: 180, scale: 1.0 });
put('rug', 2.6, -4.3, { yaw: 0, scale: 1.2 });
put('campfire', 0.2, -5.3, { scale: 1.2 });
put('log', -0.9, -5.4, { yaw: 80 });
put('log', 1.2, -4.2, { yaw: 10 });
put('barrel', 4.6, -5.5, { yaw: 20 });
put('barrel', 5.3, -5.3, { yaw: 70 });
put('crate', 5.0, -4.7, { yaw: 10 });
put('crate', 5.0, -4.7, { yaw: 40, y: 0.4, scale: 0.8 });
put('sack', 3.8, -5.2, { yaw: 120 });
put('villager', 1.6, -3.6, { yaw: 200 });
put('villager', -0.2, -4.0, { yaw: 120 });
put('villager', 3.6, -4.0, { yaw: 180 });
// --- zone 3: rock arch of tall dunes and clusters (north-east) ---
put('sand-dune', 8.4, -7.6, { yaw: 100, scale: 1.5 });
put('sand-dune', 11.0, -6.6, { yaw: 80, scale: 1.5 });
put('sand-dune', 9.7, -9.0, { yaw: 180, scale: 1.4 });
put('rock-cluster', 9.8, -7.4, { yaw: 20, scale: 1.6 });
put('rock-cluster', 8.0, -5.9, { yaw: 60, scale: 1.3 });
put('cactus', 7.4, -9.0, { yaw: 40 });
put('cactus', 10.6, -5.2, { yaw: 160, scale: 1.1 });
// --- north ridge and flank dunes ---
const DUNES = [[-10.0, -8.4, 10, 1.4], [-7.0, -9.0, 170, 1.4], [-3.8, -9.0, 190, 1.4], [-1.0, -9.3, 175, 1.2], [6.5, -9.3, 185, 1.4],
  [-10.6, -4.5, 85, 1.5], [-10.6, -0.5, 100, 1.5], [-10.5, 3.2, 80, 1.2],
  [-10.0, 9.0, 20, 1.3], [-6.5, 9.0, 190, 1.2], [-2.5, 9.0, 175, 1.2], [1.5, 9.1, 195, 1.1],
  [10.9, 9.0, 160, 1.2], [6.0, 9.2, 185, 1.0], [11.0, 6.0, 270, 1.3], [11.0, 1.8, 262, 1.3],
  [-1.5, 1.5, 90, 0.6], [1.0, 3.6, 120, 0.6]];
for (const [x, z, yaw, s] of DUNES) put('sand-dune', x, z, { yaw, scale: s });
// --- trail edge breakers (small dunes and boulders on both sides) ---
for (const [x, z, y, s] of [[-7, 2.2, 10, 0.5], [-3, 2.3, 120, 0.6], [0.5, 2.1, 60, 0.5], [-5, 8.8, 200, 0.5], [-0.5, 8.7, 90, 0.5]]) put('sand-dune', x, z, { yaw: y, scale: s });
for (const [x, z, y, s] of [[-9, 2.4, 20, 0.7], [-2, 2.2, 80, 0.6], [2.2, 1.0, 140, 0.6], [2.2, -4.0, 30, 0.6], [6.6, 2.4, 100, 0.6], [6.4, 5.6, 200, 0.7], [7.0, -0.6, 10, 0.6], [-4, 8.9, 70, 0.6]]) put('boulder', x, z, { yaw: y, scale: s });
// --- zone 4: caravan wagon (south-east), signpost, cacti ---
put('caravan-wagon', 9.2, 6.8, { yaw: 270 });
put('signpost', -9.4, 1.6, { yaw: 90 });
put('cactus', 8.0, 1.4, { yaw: 10 });
put('cactus', 10.4, 3.4, { yaw: 200 });
put('rock-cluster', 6.8, 8.2, { yaw: 300, scale: 1.1 });
put('adventurer', -10.3, 6.0, { yaw: 90 });
const mark = (x, z, g) => { const c = Math.round(x / 2 + 6.5), r = Math.round(z / 2 + 5.5); if (c >= 1 && c <= 12 && r >= 1 && r <= 10) glyph[r - 1][c - 1] = g; };
mark(PX, PZ, 'O'); mark(1.2, -7.2, 'T'); mark(4.4, -7.4, 'T'); mark(9.7, -7.4, 'A'); mark(9.2, 6.8, 'W');
console.log(glyph.map((r) => '  ' + r.join(' ')).join('\n'));
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/desert-oasis.ts', `// GENERATED by scripts/design-desert-oasis.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/desert-oasis.md', `# Desert oasis map (generated)

GENERATED by \`scripts/design-desert-oasis.mjs\`. 12 x 10 tiles of 2 m (24 m x 20 m). Cell (c,r): x=(c-6.5)*2, z=(r-5.5)*2.

\`\`\`
${glyph.map((r) => '  ' + r.join(' ')).join('\n')}
\`\`\`

= dirt trail, O pond, T tent, Y yurt, A rock arch, W caravan wagon.

## Layout
Castle Defense trail enters at the west edge, runs east along the south, turns north at c8, and exits at the east edge. Open sand lies on both sides for tower slots. Zones: palm-ringed pond (west), nomad camp (north), rock arch (north-east), caravan wagon (south-east). Dunes frame the edges.

## Tally
${Object.entries(tally).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log('places', places.length, JSON.stringify(tally));
