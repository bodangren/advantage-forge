#!/usr/bin/env node
// Watchtower map designer (P2). Writes scenes/maps/watchtower.ts and docs/map-mockups/watchtower.md.
// Tower at (0,-7) on a two-level rocky rise. Path enters from the south (x=0).
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const TX = 0, TZ = -7, L1 = 1.0, L2 = 2.0;
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const inL1 = (x, z) => x >= -5 && x <= 5 && z >= -9 && z <= -1;
const inL2 = (x, z) => x >= -3 && x <= 3 && z >= -9 && z <= -5;

// ground: lowland grass with a stone path, raised terraces held by rock-wall
const PATH = new Set(['1,1', '1,3', '1,5', '1,7', '1,9', '1,11', '-1,11', '3,1']);
for (let x = -11; x <= 11; x += 2)
  for (let z = -11; z <= 11; z += 2) {
    if (inL1(x, z)) {
      if (inL2(x, z)) put('stone-ground', x, z, { y: L2 });
      else put(Math.abs(x) <= 1 || z >= -3 ? 'stone-ground' : 'grass-ground', x, z, { y: L1 });
      continue;
    }
    put(PATH.has(`${x},${z}`) && x === 1 ? 'cobble-floor' : (x === 1 && z < 0) ? 'grass-ground' : 'grass-ground', x, z);
  }
// path tiles south of the stairs
for (const z of [1, 3, 5]) put('cobble-floor', 1, z);

// rock walls: level 1 (top y=1) and level 2 (top y=2); wall height 2.6, offset 0.4 outward
const wall = (x, z, yaw, top) => put('rock-wall', x, z, { y: top - 2.6, yaw });
for (const x of [-5, -3, -1.2, 1.2, 3, 5]) wall(x, 0.4, 0, L1); // south, gap for the stairs
for (const z of [-9, -7, -5, -3, -1]) { wall(-6.4, z, 270, L1); wall(6.4, z, 90, L1); }
for (const x of [-5, -3, 3, 5]) wall(x, -10.4, 180, L1);
for (const x of [-3, -1.2, 1.2, 3]) wall(x, -3.6, 0, L2);
for (const z of [-9, -7, -5]) { wall(-4.4, z, 270, L2); wall(4.4, z, 90, L2); }
for (const x of [-3, -1, 1, 3]) wall(x, -10.4, 180, L2);
put('stairs-stone', 0, 0.7, { y: 0 });
put('stairs-stone', 0, -3.3, { y: L1 });
// foot-of-cliff boulders
for (const [x, z] of [[-6.8, 1.0], [-7.2, -3], [-7.0, -7], [6.9, -2], [7.1, -6.5], [-3.9, 1.4], [3.9, 1.3], [5.6, 1.6], [-5.4, 1.4]])
  put(rnd() > 0.5 ? 'boulder' : 'rock-cluster', x, z, { yaw: Math.floor(rnd() * 360), scale: 0.7 + rnd() * 0.5 });

// level 2: tower and signal gear
put('tower', TX, TZ, { y: L2 });
put('brazier', 2.3, -5.2, { y: L2, scale: 1.2 });
put('brazier', -2.3, -5.2, { y: L2, scale: 1.2 });
put('horn', 2.0, -5.6, { y: L2, yaw: 30, scale: 1.4 });
put('ladder', -2.1, -7.2, { y: L2, yaw: 90, scale: 1.3 });
put('flag', 2.6, -8.6, { y: L2, scale: 1.2 });
put('lantern', 0.9, -4.6, { y: L2 });
put('lantern', -0.9, -4.6, { y: L2 });
put('guard', 1.3, -4.5, { y: L2, yaw: 170, scale: 1.6 });
for (const [x, z, yaw] of [[-3.3, -5.4, 80], [3.3, -9.2, 260], [-3.3, -9.2, 100]]) put('broken-wall', x, z, { y: L2, yaw, scale: 0.7 });
for (const [x, z] of [[-3.2, -7.6], [3.1, -6.6], [-1.6, -9.3], [1.8, -9.4]]) put('rock-cluster', x, z, { y: L2, yaw: Math.floor(rnd() * 360), scale: 0.6 });
put('banner', -3.4, -4.4, { y: L2, scale: 1.1 });
put('banner', 3.4, -4.4, { y: L2, scale: 1.1 });

// level 1: palisade ring on the rim, weapon racks, banners, guards
for (let x = -5.6; x <= 5.6; x += 1.2) { if (Math.abs(x) > 0.9) put('fence', x, -0.5, { y: L1, scale: 0.8 }); }
for (let z = -9.4; z <= -1.2; z += 1.2) { put('fence', -5.6, z, { y: L1, yaw: 90, scale: 0.8 }); put('fence', 5.6, z, { y: L1, yaw: 90, scale: 0.8 }); }
for (let z = -9.2; z <= -4.4; z += 1.2) { if (Math.abs(z + 7) > 0.1 || true) {} }
put('weapon-rack', -4.6, -2.4, { y: L1, yaw: 0, scale: 0.9 });
put('weapon-rack', 4.6, -2.4, { y: L1, yaw: 0, scale: 0.9 });
put('weapon-rack', -5.1, -6.5, { y: L1, yaw: 90, scale: 0.9 });
put('banner', -2.4, -1.2, { y: L1, scale: 1.2 });
put('banner', 2.4, -1.2, { y: L1, scale: 1.2 });
put('banner', -5.0, -9.2, { y: L1, scale: 1.1 });
put('banner', 5.0, -9.2, { y: L1, scale: 1.1 });
put('torch', -1.0, -1.4, { y: L1 });
put('torch', 1.0, -1.4, { y: L1 });
put('guard', -2.2, -2.4, { y: L1, yaw: 170, scale: 1.6 });
put('guard', 2.2, -2.4, { y: L1, yaw: 190, scale: 1.6 });
put('barrel', 4.6, -4.6, { y: L1, yaw: 20 });
put('barrel', 5.0, -5.4, { y: L1, yaw: 80 });
put('crate', 4.6, -6.4, { y: L1, yaw: 15 });
put('crate', 4.9, -8.0, { y: L1, yaw: 60, scale: 0.9 });
put('hay-bale', -4.8, -4.2, { y: L1, yaw: 30 });
put('barrel', -4.6, -8.6, { y: L1, yaw: 120 });
put('signpost', 2.4, 1.2, { yaw: 200 });

// camp below (south-east)
put('campfire', 6.0, 5.2, { scale: 1.2 });
put('bench', 6.0, 6.9);
put('bench', 4.4, 5.2, { yaw: 90 });
put('bench', 7.6, 5.2, { yaw: 270 });
put('barrel', 8.2, 3.8, { yaw: 20 });
put('barrel', 8.9, 4.5, { yaw: 100 });
put('crate', 8.6, 7.2, { yaw: 15 });
put('hay-bale', 4.2, 7.8, { yaw: 30 });
put('tent', 6.8, 8.8, { yaw: 200 });
put('tent', 3.4, 9.2, { yaw: 160, scale: 0.9 });
put('guard', 4.9, 3.8, { yaw: 220, scale: 1.6 });
put('villager', 7.0, 6.0, { yaw: 150, scale: 1.6 });
put('horse', -2.2, 8.2, { yaw: 120, scale: 1.5 });
put('fence', -3.4, 7.2, { yaw: 90 }); put('fence', -3.4, 9.0, { yaw: 90 });
put('lantern', 2.6, 4.0);
put('lantern', 2.6, 8.0);

// west dressing: deer, logs, stumps, flowers, rocks
put('deer', -7.0, 5.8, { yaw: 60, scale: 1.5 });
put('fallen-log', -6.6, 8.0, { yaw: 70 });
put('tree-stump', -5.0, 6.4, { yaw: 20 });
put('stump', -8.2, 3.2, { yaw: 100 });
put('wildflowers', -5.6, 4.6); put('wildflowers', 9, 1); put('wildflowers', -8.6, 7); put('wildflowers', 3.5, 6.2);
put('torch', 5.0, 2.4);
for (let i = 0; i < 19; i++) {
  const x = -9.6 + rnd() * 19.2, z = -9.6 + rnd() * 19.2;
  if (x > -7.6 && x < 7.6 && z < 0.6 && z > -11.2) continue;
  if (x > 2.2 && x < 9.8 && z > 2.8 && z < 9.8) continue;
  if (Math.abs(x - 1) < 1.4 && z > 0) continue;
  put(i % 3 === 0 ? 'boulder' : i % 3 === 1 ? 'bush' : 'rock-cluster', x, z, { yaw: Math.floor(rnd() * 360), scale: 0.6 + rnd() * 0.4 });
}

// stone fence ring on the outer edge, gap at the south path and east camp
const fence = [];
for (let x = -10.1; x <= 10.2; x += 1.8) fence.push([x, -11.2, 0]);
for (let z = -9.4; z <= 8.2; z += 1.8) fence.push([-11.2, z, 90]);
for (let z = -9.4; z <= 1; z += 1.8) fence.push([11.2, z, 90]);
for (let x = -10.1; x <= -3.4; x += 1.8) fence.push([x, 11.2, 0]);
for (const [x, z, yaw] of fence) put('stone-wall', x, z, { yaw, scale: 0.8 });
for (const [x, z, a, s] of [[-10.2, -10.2, 'oak-tree', 0.8], [-8, -10.4, 'pine-tree', 0.7], [8, -10.4, 'pine-tree', 0.7], [10.2, -10, 'oak-tree', 0.75],
  [-10.2, 3, 'pine-tree', 0.7], [10.2, -3, 'oak-tree', 0.7], [10.2, 10, 'oak-tree', 0.7], [-10, 10, 'pine-tree', 0.7], [-8.4, -3, 'pine-tree', 0.7], [8.6, -6, 'pine-tree', 0.7]]) put(a, x, z, { yaw: (x * 53 + z * 17) % 360, scale: s });

// emit
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/watchtower.ts', `// GENERATED by scripts/design-watchtower.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/watchtower.md', `# Watchtower map (generated)

GENERATED by \`scripts/design-watchtower.mjs\`. 12x12 tiles of 2 m (24 m square), tower at (0, -3).

## Layout
Stone-ground pad (7x7 m) under the tower with two braziers, a horn and a ladder. A cobble path with lanterns
runs south to a signpost and a fence gate. Camp zone south-east: campfire, benches, barrels, crates, hay, tent,
guard, villager and horse. West zone: boulders, rocks, log, stumps and a deer. Stone wall ring on the north,
west, east and south-west edges; a few low trees and bushes at the rim.

## Tally
| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log('wrote', places.length, JSON.stringify(tally));
