#!/usr/bin/env node
// General store map designer: 10 m x 8 m cutaway shop, north and west walls standing.
// x in [-5,5] west->east, z in [-4,4] north->south. Writes scenes/maps/general-store.ts and docs/map-mockups/general-store.md.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, y, z, yaw = 0, scale) => {
  const p = { asset, at: [+x.toFixed(3), +y.toFixed(3), +z.toFixed(3)] };
  if (yaw) p.yaw = yaw;
  if (scale && scale !== 1) p.scale = scale;
  places.push(p);
};
let seed = 11;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const R4 = () => Math.floor(rnd() * 4) * 90;

// Floor: 5 x 4 wood tiles; a stone patch in front of the counter.
for (let c = 0; c < 5; c++) for (let r = 0; r < 4; r++) {
  const stone = c >= 3 && r === 1;
  put(stone ? 'stone-floor' : 'wood-floor', -4 + c * 2, 0, -3 + r * 2);
}
// Walls: north z=-3.92, west x=-4.92 (door at the south end of the west wall).
for (const x of [-4, -2, 0, 2, 4]) put(x === 0 ? 'plaster-wall-window' : 'plaster-wall', x, 0, -3.92);
for (const z of [-3, -1, 1]) put('plaster-wall', -4.92, 0, z, 90);
put('plaster-wall-door', -4.92, 0, 3, 90);
// Window dressing.
put('curtain', -0.55, 0.1, -3.82, 0, 0.7);
put('curtain', 0.55, 0.1, -3.82, 0, 0.7);

const BOARDS = [0.475, 0.805, 1.115];
const goods = ['pot', 'bottle', 'sack', 'jar', 'bottle', 'pot', 'jar', 'bread', 'cheese'];
const sc = (a) => (a === 'jar' ? 0.5 : a === 'pot' ? 0.45 : a === 'sack' ? 0.45 : a === 'cheese' || a === 'bread' ? 0.7 : 1);
// North wall shelves (west half), loaded with pots, bottles, sacks.
for (const sx of [-4.0, -2.65, -1.3]) {
  put('shelf', sx, 0, -3.91);
  BOARDS.forEach((by) => {
    for (let i = 0; i < 5; i++) {
      const a = pick(goods);
      put(a, sx - 0.5 + (i + 0.5) * 0.2, by, -3.75 + (rnd() - 0.5) * 0.03, R4(), sc(a));
    }
  });
}
// West wall shelves.
for (const sz of [-2.3, -0.95]) {
  put('shelf', -4.74, 0, sz, 90);
  BOARDS.forEach((by) => {
    for (let i = 0; i < 5; i++) {
      const a = pick(goods);
      put(a, -4.58, by, sz - 0.5 + (i + 0.5) * 0.2, R4(), sc(a));
    }
  });
}
put('ladder', -3.4, 0, -3.45, 0); // leans against shelves behind
put('lantern', -0.1, 0, -3.5, 0, 0.9);

// Counter L: run along the north-east, return run toward the south, shopkeeper inside.
put('counter', 2.6, 0, -2.5);
put('counter', 4.4, 0, -2.5);
put('counter', 4.45, 0, -0.5, 90);
put('cupboard', 2.0, 0, -3.65);
put('cupboard', 3.0, 0, -3.65);
put('shopkeeper', 3.4, 0, -3.3, 0);
put('cash-box', 2.2, 0.75, -2.5);
put('scales', 3.1, 0.75, -2.5);
put('bread', 3.7, 0.75, -2.5, 20, 0.7);
put('cheese', 4.2, 0.75, -2.45, 0, 0.7);
put('fruit-basket', 4.45, 0.75, -0.6, 0, 0.8);
put('mug', 4.45, 0.75, -0.1);
put('awning', 2.6, 1.1, -2.9, 0);
put('awning', 4.4, 1.1, -2.9, 0);
put('rug', 3.4, 0, -1.2, 0, 1.4);
for (const x of [2.0, 3.0]) put(pick(['jar', 'bottle']), x, 1.4, -3.68, 0, 0.5);
put('lantern', 4.65, 0, -3.65, 0, 0.9);

// Produce corner (south-west): open barrels, crates, baskets, sacks.
put('barrel', -4.3, 0, 1.0, 0);
put('barrel', -4.3, 0, 1.9, 60);
put('barrel', -3.45, 0, 1.45, 0);
for (const [x, z, a] of [[-4.3, 1.0, 'apple'], [-4.3, 1.9, 'cabbage'], [-3.45, 1.45, 'pumpkin']]) for (const [dx, dz] of [[-0.1, -0.1], [0.12, -0.05], [0, 0.14]]) put(a, x + dx, 0.88, z + dz, R4(), a === 'apple' ? 0.8 : 0.6);
put('basket', -4.5, 0, 2.9, 90);
put('apple', -4.5, 0.3, 2.9, 0, 0.8);
put('basket', -3.8, 0, 3.4, 20);
put('cabbage', -3.8, 0.3, 3.4, 0, 0.7);
put('basket', -2.9, 0, 3.5, 0);
put('pumpkin', -2.9, 0.3, 3.5, 0, 0.7);
put('sack', -4.5, 0, 3.7, 20);
put('sack', -3.2, 0, 2.6, 70);
put('sack', -2.5, 0, 2.9, 20);
put('crate', -2.4, 0, 3.7, 0);
put('crate', -1.7, 0, 3.7, 10);
put('apple', -1.7, 0.41, 3.7, 0, 0.8);
put('fruit-basket', -4.7, 0, 0.0, 90);

// Tools corner (south-east): workbench with tools, rope heap, buckets, barrel.
put('workbench', 3.8, 0, 3.4, 0);
put('shovel', 3.4, 0.9, 3.4, 90);
put('pickaxe', 3.8, 0.9, 3.4, 90);
put('axe', 4.2, 0.9, 3.4, 90);
put('rope-coil', 2.4, 0, 3.6, 20);
put('rope-coil', 2.4, 0.12, 3.6, 100);
put('rope-coil', 2.0, 0, 3.4, 60);
put('bucket', 4.6, 0, 2.2, 0);
put('bucket', 4.5, 0, 2.7, 90);
put('barrel', 4.6, 0, 1.3, 0);
put('crate', 1.4, 0, 3.7, 0);
put('crate', 1.4, 0.41, 3.7, 30);
put('sack', 0.9, 0, 3.6, 70);

// Centre: display table on a rug, crate stack with a barrel.
put('rug', -0.4, 0, 0.0, 0, 1.4);
put('table', -0.4, 0.04, 0.0);
put('fruit-basket', -0.65, 0.64, -0.05, 0, 0.8);
put('bread', -0.2, 0.64, 0.2, 20, 0.7);
put('cheese', -0.15, 0.64, -0.15, 0, 0.7);
put('stool', -1.4, 0, 0.0);
put('stool', 0.6, 0, 0.0);
put('crate', 1.2, 0, 1.2, 15);
put('crate', 1.25, 0.41, 1.2, 40);
put('pumpkin', 1.25, 0.82, 1.2, 0, 0.8);
put('barrel', 1.9, 0, 1.4, 0);
put('apple', 1.8, 0.88, 1.35, 0, 0.8);
put('apple', 2.0, 0.88, 1.45, 0, 0.8);

const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;

const src = `// GENERATED by scripts/design-general-store.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return ${JSON.stringify(places, null, 2).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'")};
}
`;
writeFileSync('scenes/maps/general-store.ts', src);
const doc = `# General store - map plan (generated)

GENERATED by \`scripts/design-general-store.mjs\`. 10 m x 8 m (5 x 4 tiles), north and west walls standing, east and south open.
x -5..5 west to east, z -4..4 north to south.

Zones
- Shelf walls (north and west): five shelves of pots, bottles, sacks; ladder; window with curtains.
- L counter (north-east): cash box, scales, shopkeeper, awning, red rug on a stone patch.
- Produce corner (south-west): open barrels, baskets, sacks, crates.
- Tools corner (south-east): workbench with tools, rope heap, buckets.
- Centre: display table on a rug, crate stack and barrel.

Pieces: ${places.length}
Tally: ${JSON.stringify(tally)}
`;
writeFileSync('docs/map-mockups/general-store.md', doc);
console.log(places.length);
