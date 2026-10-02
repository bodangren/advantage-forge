#!/usr/bin/env node
// Forest village map designer: a woodland village among huge trees (26 m x 22 m).
// Grid: 13 x 11 tiles of 2 m. Tile (c,r) center x=(c-7)*2, z=(r-6)*2. +X east, -Z north.
// Zones: central fire + long table (east of fire), hut cluster on the north/west/east rim,
// drying racks + garden (south-west), lantern path from the south entry, huge tree ring.
import { writeFileSync } from 'node:fs';

const places = [];
const keep = []; // [x, z, r] keep-out circles for scatter
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = Math.round(((o.yaw % 360) + 360) % 360);
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const solid = (x, z, r) => keep.push([x, z, r]);
const free = (x, z, m = 0) => keep.every(([a, b, r]) => Math.hypot(x - a, z - b) > r + m);
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const faceYaw = (x, z, tx = 0, tz = 0) => (Math.atan2(tx - x, tz - z) * 180) / Math.PI;

// --- ground: forest-ground everywhere, footpath for the south entry ---
const PATH_Z = new Set([4, 6, 8, 10]);
for (let c = 1; c <= 13; c++)
  for (let r = 1; r <= 11; r++) {
    const x = (c - 7) * 2, z = (r - 6) * 2;
    if (c === 7 && PATH_Z.has(z)) put('footpath-straight', x, z);
    else put('forest-ground', x, z);
  }
solid(0, 7, 1.0); // path

// --- zone 1: central fire, log seats, long table ---
put('campfire', 0, -0.5, { scale: 1.6 }); solid(0, -0.5, 1.3);
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2 + 0.3;
  const x = Math.sin(a) * 2.3, z = -0.5 + Math.cos(a) * 2.0;
  if (i === 2 || i === 3) continue; // gap toward the table and entry
  put('bench', x, z, { yaw: faceYaw(x, z, 0, -0.5) + 180 }); solid(x, z, 0.9);
}
put('stump', -1.9, 1.7, { yaw: 40 }); solid(-1.9, 1.7, 0.4);
put('stump', 1.6, -3.0, { yaw: 200 }); solid(1.6, -3.0, 0.4);
// long table: 5 tables in a row along X at z=2.6, benches either side
for (let i = 0; i < 5; i++) { put('table', 3.4 + i * 1.0, 2.6); }
solid(5.4, 2.6, 3.4);
for (let i = 0; i < 3; i++) {
  put('bench', 3.9 + i * 1.5, 1.7, { yaw: 180 });
  put('bench', 3.9 + i * 1.5, 3.5, { yaw: 0 });
}
solid(5.4, 2.6, 3.3);
put('barrel', 8.3, 2.0); put('barrel', 8.3, 3.2, { scale: 0.9 }); solid(8.3, 2.6, 1.0);
put('lantern', 3.0, 1.2, { scale: 0.7 }); put('lantern', 7.8, 4.2, { scale: 0.7 });
put('villager', 2.6, -0.8, { yaw: 120 }); put('villager', 4.2, 4.3, { yaw: 180 }); put('villager', -1.2, 0.9, { yaw: 260 });

// --- zone 2: hut cluster on the rim, doors face the fire, walkways run to them ---
const HOUSES = [
  ['cabin', 0, -7.0, 1.0, 2.2], ['hut', -6.2, -6.0, 1.05, 1.8], ['cabin', 7.2, -5.6, 1.0, 2.2],
  ['hut', -9.0, -1.2, 1.05, 1.8], ['cabin', 9.2, 0.2, 1.0, 2.2], ['hut', -8.2, 4.0, 1.0, 1.8],
  ['cabin', 9.0, 5.6, 0.95, 2.2], ['hut', 3.8, -7.4, 0.9, 1.6], ['hut', -3.6, -7.6, 0.9, 1.6],
];
for (const [a, x, z, s, r] of HOUSES) {
  put(a, x, z, { yaw: faceYaw(x, z), scale: s }); solid(x, z, r * s + 0.3);
}
// walkways: [x, z, yawOfWalk] each 2 m long; yaw 0 runs along Z, 90 along X
const WALK = [];
for (const [, hx, hz] of HOUSES) {
  const yaw = faceYaw(hx, hz), dx = Math.sin((yaw * Math.PI) / 180), dz = Math.cos((yaw * Math.PI) / 180);
  for (let k = 0; k < 4; k++) {
    const wx = hx + dx * (2.4 + k * 2), wz = hz + dz * (2.4 + k * 2);
    if (Math.hypot(wx, wz + 0.5) < 3.6 || wz > 3) break;
    WALK.push([wx, wz, yaw]);
  }
}
for (const [x, z, y] of WALK) { put('walkway', x, z, { yaw: y }); solid(x, z, 1.1); }

// --- zone 3: drying racks, garden beds, baskets (south-west) ---
for (let i = 0; i < 4; i++) { put('herb-drying-rack', -8.6 + i * 1.5, 8.0, { yaw: 180 + (i % 2) * 6 }); solid(-8.6 + i * 1.5, 8.0, 0.9); }
for (let i = 0; i < 3; i++) { put('herb-drying-rack', -7.8 + i * 1.5, 6.2, { yaw: 0 }); solid(-7.8 + i * 1.5, 6.2, 0.9); }
put('garden-bed', -3.6, 7.0, { yaw: 90 }); put('garden-bed', -3.6, 9.0, { yaw: 90 });
put('garden-bed', -5.0, 7.0, { yaw: 90 }); put('garden-bed', -5.0, 9.0, { yaw: 90 });
solid(-4.3, 8.0, 2.4);
put('basket', -2.6, 5.4, { yaw: 30 }); solid(-2.6, 5.4, 0.4);
put('barrel', -10.2, 6.6); put('barrel', -10.4, 5.6, { scale: 0.9 }); solid(-10.3, 6.1, 0.9);
put('firewood', -10.4, 2.6, { yaw: 90 }); solid(-10.4, 2.6, 0.9);
put('firewood', 11.0, 3.2, { yaw: 80 }); solid(11, 3.2, 0.9);
put('log', 4.8, -5.2, { yaw: 20 }); solid(4.8, -5.2, 0.8);
put('fence', 7.2, 8.4, { yaw: 0 }); put('fence', 5.4, 8.4, { yaw: 0 }); solid(6.3, 8.4, 1.5);

// --- zone 4: lantern path from the south entry and around the plaza ---
for (const z of [3.2, 5.6, 8.0, 10.0]) {
  put('lantern', -1.35, z, { scale: 0.8 }); put('lantern', 1.35, z, { scale: 0.8 });
}
for (const [x, z] of [[-3.3, -3.9], [3.3, -4.2], [-5.6, 0.8], [5.2, -1.6], [-1.6, -5.6], [1.6, -5.6]]) put('lantern', x, z, { scale: 0.75 });

// --- huge tree ring: oaks and pines, big scale ---
const TREES = [];
const ring = (x0, z0, x1, z1, n) => { for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; TREES.push([x0 + (x1 - x0) * t + (rnd() - 0.5) * 0.9, z0 + (z1 - z0) * t + (rnd() - 0.5) * 0.9]); } };
ring(-12, -9.8, 12, -9.8, 8); ring(-12, 9.8, -2.6, 9.8, 3); ring(2.6, 9.8, 12, 9.8, 3);
ring(-12, -7, -12, 8, 5); ring(12, -7, 12, 8, 5);
TREES.forEach(([x, z], i) => {
  if (z > 8.8 && z < 10.5 && Math.abs(x) < 2.2) return;
  const oak = i % 2 === 0;
  put(oak ? 'oak-tree' : 'pine-tree', Math.max(-12, Math.min(12, x)), Math.max(-10, Math.min(10, z)), { yaw: Math.floor(rnd() * 360), scale: +(0.85 + rnd() * 0.35).toFixed(2) });
});
// two foreground trees at the corners for depth
put('pine-tree', 10.6, 9.0, { yaw: 40, scale: 1.1 }); put('oak-tree', -10.8, 9.2, { yaw: 120, scale: 1.2 });
solid(10.6, 9, 0.8); solid(-10.8, 9.2, 0.8);

// --- dressing: ferns, bushes, mushrooms, stumps scattered in free ground ---
const scatter = (asset, n, margin, scale, area) => {
  let k = 0, tries = 0;
  while (k < n && tries++ < 4000) {
    const x = area[0] + rnd() * (area[2] - area[0]), z = area[1] + rnd() * (area[3] - area[1]);
    if (!free(x, z, margin)) continue;
    put(asset, +x.toFixed(2), +z.toFixed(2), { yaw: Math.floor(rnd() * 360), scale: scale ? +(scale[0] + rnd() * (scale[1] - scale[0])).toFixed(2) : undefined });
    solid(x, z, margin + 0.2); k++;
  }
};
// ferns hug the hut walls and tree line
scatter('fern', 24, 0.35, [1.1, 1.5], [-11.5, -9, 11.5, 9.2]);
scatter('bush', 12, 0.6, [0.9, 1.2], [-11.5, -9.2, 11.5, 9.4]);
scatter('mushroom', 8, 0.4, [1.0, 1.4], [-11, -8.5, 11, 9]);
scatter('stump', 3, 0.6, [1, 1.3], [-11, -8.5, 11, 8]);
scatter('fern', 14, 0.3, [1.0, 1.4], [-11.8, -9.6, 11.8, 9.8]);

// --- ASCII map + tally ---
const glyph = Array.from({ length: 11 }, () => Array(13).fill('.'));
for (const z of PATH_Z) glyph[z / 2 + 5][6] = '=';
const mk = (x, z, g) => { const c = Math.round(x / 2 + 6), r = Math.round(z / 2 + 5); if (c >= 0 && c < 13 && r >= 0 && r < 11) glyph[r][c] = g; };
mk(0, -0.5, 'F'); mk(5.4, 2.6, 'T');
for (const [a, x, z] of HOUSES) mk(x, z, a === 'cabin' ? 'C' : 'H');
mk(-6, 7.5, 'R'); mk(-4.3, 8, 'G');
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/forest-village.ts', `// GENERATED by scripts/design-forest-village.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
writeFileSync('docs/map-mockups/forest-village.md', `# Forest village — map plan (generated)

GENERATED by \`scripts/design-forest-village.mjs\`. 13 x 11 tiles of 2 m (26 m x 22 m). Tile (c,r) center x=(c-7)*2, z=(r-6)*2.

\`\`\`
${glyph.map((r) => '  ' + r.join(' ')).join('\n')}
\`\`\`

F fire, T long table, C cabin, H round hut, R drying racks, G garden, = entry path.

## Layout
A woodland village in a ring of huge oaks and pines. The central fire has log benches; a five-table long table
stands east of it. Round huts and cabins sit on the rim, their doors face the fire, and plank walkways link them.
Drying racks and garden beds fill the south-west. Lanterns line the south entry path and the plaza.

## Tally
| component | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total placements: ${places.length}.
`);
console.log(glyph.map((r) => r.join(' ')).join('\n'));
console.log('wrote', places.length, JSON.stringify(tally));
