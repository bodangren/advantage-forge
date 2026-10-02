#!/usr/bin/env node
// Floating city map designer: a rocky sky island (24 m x 20 m) with cottages, a tower, a windmill,
// a tethered balloon, rope bridges to two islets, glowing crystals. Writes scenes/maps/floating-city.ts
// and docs/map-mockups/floating-city.md. Grid 12 x 10 tiles of 2 m: x=(c-6.5)*2, z=(r-5.5)*2.
import { writeFileSync } from 'node:fs';

const X = (c) => (c - 6.5) * 2;
const Z = (r) => (r - 5.5) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
// seeded random for scatter
let s = 7;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);

// main island mask: wobbly ellipse
const main = new Set();
for (let c = 1; c <= 12; c++)
  for (let r = 1; r <= 10; r++) {
    const dx = (X(c) - 0.2) / 8.6, dz = (Z(r) + 0.2) / 7.6;
    const wob = 0.18 * Math.sin(c * 2.3 + r * 1.7) + 0.1 * Math.cos(c * 1.3 - r * 2.9);
    if (dx * dx + dz * dz < 1 + wob * 1.6 && Math.abs(X(c)) < 7.1) main.add(`${c},${r}`);
  }
const islets = [[-11, 1], [-11, 3], [11, 1], [11, 3]]; // tile centers (x,z)
const tiles = [];
for (const k of main) { const [c, r] = k.split(',').map(Number); tiles.push([X(c), Z(r), c, r]); }
// path: tiles on row 6 (z=1) from west to east, with a bend north to the tower
const pathCells = new Set(['1,6','2,6', '3,6', '4,6', '5,6', '6,6', '7,6', '8,6', '9,6', '10,6', '11,6', '5,5', '5,4', '5,3']);
const inMain = (x, z) => tiles.some((t) => Math.abs(t[0] - x) < 0.1 && Math.abs(t[1] - z) < 0.1);
for (const [x, z, c, r] of tiles) {
  const rim = !['1,0', '-1,0', '0,1', '0,-1'].every((d) => { const [a, b] = d.split(',').map(Number); return inMain(x + a * 2, z + b * 2); });
  const key = `${c},${r}`;
  let a = rim ? 'stone-ground' : 'grass-ground';
  if (pathCells.has(key) && main.has(key)) a = 'cobble-floor';
  put(a, x, z);
}
for (const [x, z] of islets) put('grass-ground', x, z);
// extra rim tile of stone on islets


// cliffs: rock walls hang under every open tile edge (top at y = -0.3)
const all = [...tiles.map((t) => [t[0], t[1]]), ...islets];
const has = (x, z) => all.some((t) => Math.abs(t[0] - x) < 0.1 && Math.abs(t[1] - z) < 0.1);
const covered = (x, z) => all.some((t) => Math.abs(t[0] - x) <= 1 && Math.abs(t[1] - z) <= 1);
for (const [x, z] of all) {
  const WY = -2.85;
  if (!has(x, z + 2)) put('rock-wall', x, z + 0.75, { y: WY, yaw: 0 });
  if (!has(x, z - 2)) put('rock-wall', x, z - 0.75, { y: WY, yaw: 180 });
  if (!has(x + 2, z)) put('rock-wall', x + 0.75, z, { y: WY, yaw: 90 });
  if (!has(x - 2, z)) put('rock-wall', x - 0.75, z, { y: WY, yaw: 270 });
}
// second, lower, narrower ring of walls under the main island for a layered underside
for (const [x, z] of tiles) {
  if (!has(x, z + 2)) put('boulder', x - 0.4, z + 0.5, { y: -3.4, scale: 1.6 });
  else if (!has(x + 2, z)) put('boulder', x + 0.5, z, { y: -3.4, scale: 1.6 });
}
// hanging crystals on the underside rim (glow under the island)
for (const [x, z] of tiles) if (!has(x, z + 2) && rnd() < 0.55) put('crystal-shard', x + 0.5, z + 1.2, { y: -2.6, scale: 2.2 });

// bridges (4.08 m long along X)
put('bridge', -8.6, 2.0);
put('bridge', 8.6, 2.0);
put('fence', -6.4, 3.1, { yaw: 0 });

// focal landmarks
put('tower', 0.2, -4.2, { yaw: 0 });
put('banner', 1.8, -3.0, { yaw: 0 });
put('windmill', 5.0, -2.4, { yaw: 340 });
put('cottage', -1.8, 3.2, { yaw: 0 });
put('cottage', 3.2, 3.6, { yaw: 350 });
put('cottage', -3.0, -1.6, { yaw: 20 });
put('balloon-basket', -6.0, -4.0, { yaw: 0, scale: 0.9 });
put('giant-crystal', 2.2, -0.2, { yaw: 30 });
put('statue', 0.2, -0.9, { yaw: 0, scale: 0.8 });
put('lantern', -0.8, 1.0); put('lantern', 1.2, 1.0);
put('lantern', -7.2, 1.0); put('lantern', 7.4, 1.0);
put('lantern', -11, 0.4); put('lantern', 11, 1.4);
// islet dressing
put('tree-stump', -11, 3.4, { yaw: 40 }); put('bush', -11.6, 0.8, { yaw: 120 }); put('wildflowers', -10.6, 1.4);
put('rock-cluster', 11.2, 3.8, { yaw: 60 }); put('bush', 10.8, 1.6, { yaw: 220 }); put('crystal-cluster', 11.6, 4.6, { scale: 2 });
put('crystal-cluster', -12.2, 3.8, { scale: 2 });

// scatter dressing on grass/stone tiles away from landmarks
const keep = [[0.2, -4.2, 3.2], [5.0, -2.4, 2.6], [-1.8, 3.2, 2.4], [3.2, 3.6, 2.4], [-3.0, -1.6, 2.2], [-6.0, -4.0, 2.4], [2.2, -0.2, 1.8], [0.2, -0.9, 1.4]];
const pathNear = (x, z) => Math.abs(z - 1.0) < 1.5 || (Math.abs(x - -1) < 1.3 && z < 1.5 && z > -5);
const kinds = [['bush', 0.55, 0.9], ['boulder', 0.5, 0.6], ['rock-cluster', 0.9, 1], ['wildflowers', 0.9, 1], ['crystal-cluster', 1.8, 1], ['crystal-shard', 1.6, 1], ['oak-tree', 0.5, 0.6]];
let n = 0;
for (let i = 0; i < 4000 && n < 110; i++) {
  const [tx, tz] = tiles[Math.floor(rnd() * tiles.length)];
  const x = tx + (rnd() - 0.5) * 1.8, z = tz + (rnd() - 0.5) * 1.8;
  if (keep.some(([a, b, r]) => Math.hypot(x - a, z - b) < r) || pathNear(x, z)) continue;
  if (!['0,1', '0,-1', '1,0', '-1,0', '1,1', '-1,-1', '1,-1', '-1,1'].every((d) => { const [a, b] = d.split(',').map(Number); return covered(x + a * 0.5, z + b * 0.5); })) continue;
  const k = kinds[Math.floor(rnd() * kinds.length)];
  if (k[0] === 'oak-tree' && (Math.hypot(x, z) < 4 || rnd() < 0.5)) continue;
  put(k[0], x, z, { yaw: Math.floor(rnd() * 360), scale: k[1] });
  n++;
}
// fences along the garden by the cottage
for (const dx of [-3.0, -1.0]) put('fence', -1.8 + dx + 1.0, 4.9, { yaw: 0 });

const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${p.at.map(num).join(', ')}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/floating-city.ts', `// GENERATED by scripts/design-floating-city.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
writeFileSync('docs/map-mockups/floating-city.md', `# Floating city (generated)

GENERATED by \`scripts/design-floating-city.mjs\`. 12 x 10 tiles of 2 m (24 m x 20 m), x=(c-6.5)*2, z=(r-5.5)*2.

A rocky sky island: stone rim, grass top, a cobble road west to east over two rope bridges to two islets.
Focal object: the tower on the north hill, with the windmill east, three cottages, and the tethered balloon west.
Rock walls hang under every open tile edge (the cliff). Crystals glow under the rim and on the islets.
Missing: cloud (no cloud piece exists), rope-bridge (bridge used).

| component | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total placements: ${places.length}.
`);
console.log(places.length, JSON.stringify(tally));
