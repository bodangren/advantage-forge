#!/usr/bin/env node
// Bakery map designer: a cosy village bakery, 8 m x 6 m floor, north and west walls standing.
// x in [-4,4] west->east, z in [-3,3] north->south. Writes scenes/maps/bakery.ts and docs/map-mockups/bakery.md.
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
const r90 = () => Math.floor(rnd() * 4) * 90;

// Floor: 4 x 3 tiles of wood; a stone hearth patch in front of the oven.
for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) {
  const hearth = r === 0 && (c === 1 || c === 2);
  put(hearth ? 'stone-floor' : 'wood-floor', -3 + c * 2, 0, -2 + r * 2);
}

// North wall (z = -2.92): window at the west end, brick behind the oven, plain at the east.
put('plaster-wall-window', -3, 0, -2.92);
for (const x of [-1, 1]) put('brick-wall', x, 0, -2.92);
put('plaster-wall', 3, 0, -2.92);
// West wall: plain, window above the counter, door at the south end.
put('plaster-wall', -3.92, 0, -2, 90);
put('plaster-wall-window', -3.92, 0, 0, 90);
put('plaster-wall-door', -3.92, 0, 2, 90);

// Zone A: oven mass (focal). Kiln sunk into the wall, fireplace fire in front, firewood, baker.
put('fireplace', -1.5, 0, -2.78, 0, 1.15);
put('kiln', 1.15, 0, -2.45, 0, 1.4);
put('firewood', -0.25, 0, -2.6, 90, 0.85);
put('firewood', 2.45, 0, -2.45, 0, 0.7);
put('innkeeper', -0.3, 0, -1.55, 0);
put('cooking-pot', -2.2, 0, -1.8, 20);
put('bucket', 0.8, 0, -1.55);
put('bread', -1.3, 0, -1.55, 0);
put('wall-sconce', -2.45, 1.0, -2.8);
put('curtain', -3.0, 0, -2.75, 0, 0.8);
put('basket', 2.1, 0, -1.6, 0);
put('loaf', 2.1, 0.28, -1.6, 30);

// Zone B: shop counter on the west wall under two awnings; loaves and bread on top.
for (const z of [-1.2, 0.8]) put('counter', -3.45, 0, z, 90);
for (const z of [-1.2, 0.8]) put('awning', -3.9, 0, z, 90);
for (const [z, a] of [[-2.0, 'loaf'], [-1.65, 'bread'], [-1.3, 'loaf'], [-0.95, 'bread'], [-0.6, 'loaf'], [-0.2, 'bread'], [0.2, 'loaf'], [0.55, 'bread'], [0.9, 'loaf'], [1.25, 'bread']]) {
  put(a, -3.45 + (rnd() - 0.5) * 0.08, 0.75, z, a === 'bread' ? 90 : r90());
}
put('candle', -3.3, 0.75, 1.5);
put('basket', -3.6, 0.75, 1.6);
put('wicker-basket', -3.0, 0, 1.75, 40);
put('loaf', -3.0, 0.3, 1.75, 30);
put('stool', -3.6, 0, 2.5);
put('rug', -2.9, 0, 2.0, 90, 0.8);
put('lantern', -3.55, 0, 2.7, 0, 0.8);

// Zone C: big kneading table (focal group) with two stools and a herb rack beside it.
put('table', 0.3, 0, 0.5, 0, 1.45);
const T = 0.6 * 1.45;
put('plate', 0.0, T, 0.45, 0, 1.2);
put('bowl', 0.45, T, 0.35, 0, 1.2);
put('loaf', 0.15, T, 0.8, 30, 1.2);
put('bread', 0.55, T, 0.7, 20, 1.2);
put('bread', -0.1, T, 0.15, 0, 1.2);
put('candle', 0.7, T, 0.15);
put('stool', -0.7, 0, 0.5, 90, 1.2);
put('stool', 1.3, 0, 0.5, 270, 1.2);
put('stool', 0.3, 0, 1.4, 0, 1.2);
put('herb-drying-rack', 2.35, 0, 0.45);

// Zone D: flour storage (north-east shelf and south-east corner).
const BOARDS = [0.475, 0.805, 1.115];
const goods = ['loaf', 'bread', 'basket', 'loaf', 'wicker-basket', 'bread'];
put('shelf', 3.3, 0, -2.78);
const SZ = -2.78 + 0.17;
BOARDS.forEach((by) => {
  for (let i = 0; i < 4; i++) {
    const a = goods[Math.floor(rnd() * goods.length)];
    const sc = a === 'basket' || a === 'wicker-basket' ? 0.55 : 1.3;
    put(a, 3.3 - 0.45 + (i + 0.5) * 0.225, by, SZ, a === 'bread' ? 90 : r90(), sc);
  }
});
for (const [x, z] of [[3.5, 0.0], [3.55, -0.7], [3.5, 1.2], [2.9, 2.55], [3.5, 2.6]]) put('sack', x, 0, z, Math.floor(rnd() * 360));
put('sack', 3.55, 0.4, 0.0, 40, 0.9);
put('sack', 3.5, 0.4, 1.2, 140, 0.9);
put('barrel', 3.55, 0, 1.95);
put('barrel', 2.35, 0, 2.6);
put('crate', 1.6, 0, 2.6, 10);
put('loaf', 1.6, 0.44, 2.6, 40);
put('wicker-basket', 0.5, 0, 2.7);
put('basket', -0.6, 0, 2.7, 20);
put('barrel', -1.3, 0, 2.65);
put('lantern', 3.0, 0, 1.6, 0, 0.8);
put('crate', -2.0, 0, 1.3, 20);
put('loaf', -2.0, 0.44, 1.3, 70);

// Extra dressing: second shelf and cupboard on the north wall gap, goods on the hearth and floor edge.
for (const [x, z] of [[3.55, -1.4], [3.5, -2.1]]) { put('sack', x, 0, z, Math.floor(rnd() * 360)); put('sack', x, 0.4, z, 90, 0.9); }
for (const [x, z, a] of [[1.7, -0.8, 'basket'], [2.4, -1.0, 'wicker-basket'], [2.9, 0.9, 'basket'], [-2.3, 2.6, 'wicker-basket'], [-1.0, 1.4, 'basket']]) {
  put(a, x, 0, z, r90());
  put(rnd() < 0.5 ? 'loaf' : 'bread', x, 0.27, z, r90(), 0.8);
}
put('bucket', 2.0, 0, 2.2);
put('bucket', -2.4, 0, -0.3);
put('workbench', -1.9, 0, 0.5, 90);
for (const [x, z, a] of [[-1.9, 0.2, 'loaf'], [-1.9, 0.5, 'bread'], [-1.9, 0.8, 'loaf']]) put(a, x, 0.85, z, r90());
put('bowl', -2.0, 0.85, 0.05);
put('stool', -1.2, 0, 0.5, 90);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;

const src = `// GENERATED by scripts/design-bakery.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return ${JSON.stringify(places, null, 2).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'")};
}
`;
writeFileSync('scenes/maps/bakery.ts', src);
const doc = `# Bakery - map plan (generated)

GENERATED by \`scripts/design-bakery.mjs\`. 8 m x 6 m floor (4 x 3 tiles), north and west walls standing, east and south open.
x -4..4 west to east, z -3..3 north to south.

Zones
- Oven wall (north): kiln scaled 1.4 sunk in a brick wall, fireplace with fire, stone hearth, firewood, baker, window with curtain.
- Shop counter (west): two counters under two awnings, loaves and bread, window above, door and red rug at the south-west.
- Kneading table (centre, focal): big table with plate, bowl, loaf and bread, three stools, herb-drying rack.
- Storage (north-east shelf, south-east corner): loaded shelf, sacks, barrels, crates.

Pieces: ${places.length}
Tally: ${JSON.stringify(tally)}
`;
writeFileSync('docs/map-mockups/bakery.md', doc);
console.log(places.length);
