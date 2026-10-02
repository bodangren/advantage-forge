#!/usr/bin/env node
// Apothecary map designer: a cosy herbalist shop, 10 m x 8 m wood floor, north and west walls standing.
// x in [-5,5] west->east, z in [-4,4] north->south. Writes scenes/maps/apothecary.ts and docs/map-mockups/apothecary.md.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, y, z, yaw = 0, scale) => {
  const p = { asset, at: [+x.toFixed(3), +y.toFixed(3), +z.toFixed(3)] };
  if (yaw) p.yaw = yaw;
  if (scale && scale !== 1) p.scale = scale;
  places.push(p);
};
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

// Floor: 5 x 4 tiles of wood-floor.
for (let c = 0; c < 5; c++) for (let r = 0; r < 4; r++) put('wood-floor', -4 + c * 2, 0, -3 + r * 2);

// North wall (z = -3.92), five pieces.
for (const x of [-4, -2, 0, 2, 4]) put('plaster-wall', x, 0, -3.92);
// West wall (x = -4.92), yaw 90 faces east; door near the south end.
for (const z of [-3, -1, 0.9]) put('plaster-wall', -4.92, 0, z, 90);
put('plaster-wall-door', -4.92, 0, 2.9, 90);

// Zone A: shopkeeper nook. Three shelves on the north wall loaded with jars, bottles, vials.
const SZ = -3.92 + 0.17; // shelf board centre depth
const BOARDS = [0.475, 0.805, 1.115];
const small = ['bottle', 'vial', 'bottle', 'jar', 'candle'];
for (const sx of [-4.0, -2.62, -1.24]) {
  put('shelf', sx, 0, -3.91);
  BOARDS.forEach((by, bi) => {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x = sx - 0.52 + (i + 0.5) * (1.04 / n);
      const a = small[Math.floor(rnd() * small.length)];
      if (a === 'jar') put('jar', x, by, SZ + (rnd() - 0.5) * 0.04, 0, 0.58);
      else put(a, x, by, SZ + (rnd() - 0.5) * 0.04, Math.floor(rnd() * 4) * 90);
    }
  });
}
// Counter in front of the shelves, healer behind it, tools on top.
put('counter', -2.6, 0, -2.0);
put('healer', -3.3, 0, -2.85, 0);
put('scales', -1.95, 0.75, -2.0);
put('mortar-pestle', -3.15, 0.75, -2.0, 20);
put('jar', -2.6, 0.75, -2.05, 0, 0.7);
put('jar', -2.35, 0.75, -1.95, 40, 0.6);
for (const [x, a] of [[-3.5, 'bottle'], [-3.35, 'vial'], [-2.85, 'bottle'], [-1.6, 'vial'], [-1.45, 'bottle']]) put(a, x, 0.75, -1.9 + rnd() * 0.1);
put('candle', -3.6, 0.75, -2.1);
put('healing-herb', -2.2, 0.75, -1.75, 30, 0.8);
put('herb-root', -2.05, 0.75, -1.7, 10, 0.8);
put('rug', -2.6, 0, -0.6);
put('stool', -3.2, 0.04, -1.2);
put('stool', -2.0, 0.04, -1.2);
put('stool', -2.6, 0.04, -0.2);

// Zone B: drying wall (north-east): cupboards, racks of herbs, baskets of cuttings.
put('cupboard', 0.0, 0, -3.65);
put('cupboard', 1.0, 0, -3.65);
put('cupboard', 0.5, 1.4, -3.65, 0, 0.001); // placeholder removed below
places.pop();
for (const [x, a] of [[-0.2, 'jar'], [0.3, 'bottle'], [0.6, 'jar'], [1.2, 'bottle']]) put(a, x, 1.4, -3.68, 0, a === 'jar' ? 0.5 : 1);
put('herb-drying-rack', 2.5, 0, -3.5);
put('herb-drying-rack', 3.65, 0, -3.5);
put('herb-drying-rack', 4.45, 0, -2.7, 90);
for (const [x, z] of [[2.0, -2.7], [3.2, -2.75], [3.95, -2.65]]) {
  put('basket', x, 0, z, Math.floor(rnd() * 4) * 90);
  put('healing-herb', x - 0.06, 0.26, z, 30, 0.9);
  put('healing-herb', x + 0.08, 0.26, z + 0.03, 150, 0.8);
  put('herb-root', x, 0.3, z - 0.07, 80, 0.8);
}
put('sack', 4.5, 0, -1.2, 20);
put('sack', 4.6, 0, -0.65, 70);
put('crate', 4.45, 0, -1.9, 0);
put('healing-herb', 4.45, 0.4, -1.9, 20, 1);
put('herb-root', 4.2, 0, -1.2, 80);

// West wall: bookshelves of recipes, then the door.
put('bookshelf', -4.74, 0, -0.1, 90);
put('bookshelf', -4.74, 0, 0.95, 90);
put('lantern', -4.7, 0, 1.9, 0, 0.9);
put('barrel', -4.55, 0, 3.55);
put('basket', -4.55, 0, 2.85, 90);
// door zone is left clear

// Zone C: tasting table on a rug (centre), stools around it.
put('rug', 0.2, 0, 0.9);
put('table', 0.2, 0.04, 0.9);
put('stool', -0.7, 0, 0.95, 90);
put('stool', 1.1, 0, 0.9, 270);
put('stool', 0.2, 0, 1.8);
put('bottle', -0.05, 0.64, 0.85);
put('vial', 0.12, 0.64, 1.0);
put('mortar-pestle', 0.45, 0.64, 0.75, 10, 0.8);
put('candle', 0.3, 0.64, 1.1);
put('jar', 0.55, 0.64, 1.05, 0, 0.5);

// Zone D: brewing corner (south-east): cauldron, barrels, big mortar, herb tubs.
put('cauldron', 3.1, 0, 2.2, 200);
put('barrel', 4.5, 0, 3.4);
put('barrel', 4.5, 0, 2.55);
put('barrel', 3.75, 0, 3.55);
put('sack', 2.7, 0, 3.5, 330);
put('crate', 4.4, 0, 1.45, 10);
put('jar', 4.4, 0.4, 1.45, 0, 0.6);
put('bottle', 4.55, 0.92, 2.55);
put('vial', 4.4, 0.92, 2.5);
put('basket', 2.0, 0, 3.55, 20);
put('healing-herb', 1.95, 0.3, 3.55, 80, 0.9);
put('herb-root', 2.1, 0.3, 3.5, 20, 0.8);
put('mortar-pestle', -2.6, 0, 3.4, 40, 2.2);
put('healing-herb', -3.3, 0, 3.7, 0, 1);
put('healing-herb', -3.1, 0, 3.8, 90, 1);
put('healing-herb', -3.2, 0, 3.55, 200, 1);
put('herb-root', -1.5, 0, 3.75, 40);
put('healing-herb', -1.3, 0, 3.8, 120);
put('healing-herb', -1.15, 0, 3.7, 20);
for (const x of [1.6, 1.8]) put('herb-root', x, 0, 3.8, x * 90);
put('healing-herb', 3.0, 0, 3.8, 10);
put('healing-herb', 3.2, 0, 3.7, 130);

const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;

const src = `// GENERATED by scripts/design-apothecary.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return ${JSON.stringify(places, null, 2).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'")};
}
`;
writeFileSync('scenes/maps/apothecary.ts', src);
const doc = `# Apothecary - map plan (generated)

GENERATED by \`scripts/design-apothecary.mjs\`. 10 m x 8 m wood floor (5 x 4 tiles), north and west walls standing, east and south open.
x -5..5 west to east, z -4..4 north to south.

Zones
- Shopkeeper nook (north-west): three loaded shelves, counter with scales and mortar, healer behind it.
- Drying wall (north-east): cupboards, three herb-drying racks, baskets of cuttings, sacks.
- Tasting table (centre): table on a rug with stools.
- Brewing corner (south-east): cauldron, barrels, crates. Door in the west wall; big mortar and herbs along the south edge.

Pieces: ${places.length}
Tally: ${JSON.stringify(tally)}
`;
writeFileSync('docs/map-mockups/apothecary.md', doc);
console.log(places.length, JSON.stringify(tally));
