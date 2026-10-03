#!/usr/bin/env node
// Quarry map designer: 11 x 9 tiles of 2 m (22 m x 18 m). Cell (c,r): x=(c-6)*2, z=(r-5)*2.
// Real stepped terraces held by rock-wall faces (2.6 m per course). Level 0 pit floor (dirt), level 1
// terrace top y=2.6 (north band r1-2, west band c1-2, east block c10-11 r3-6), level 2 top y=5.2 (NW corner
// c1-3 r1-2). Two stair ramps (stairs-stone scaled 0.87, three flights) climb to the north and west
// terraces; a ladder climbs to the upper shelf. The road leaves the pit to the east at row 7.
import { writeFileSync } from 'node:fs';

const X = (c) => (c - 6) * 2;
const Z = (r) => (r - 5) * 2;
const places = [];
const put = (asset, x, y, z, o = {}) => {
  const p = { asset, at: [x, y, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const MID = 2.6, UP = 5.2;
const level = (c, r) => {
  if (c <= 3 && r <= 2) return 2;
  if (r <= 2 || c <= 2 || (c >= 10 && r >= 3 && r <= 6)) return 1;
  return 0;
};
const H = (c, r) => (c < 1 || c > 11 || r < 1 || r > 9 ? null : level(c, r) === 2 ? UP : level(c, r) === 1 ? MID : 0);
const ROAD = new Set(['7,7', '8,7', '9,7', '10,7', '11,7']);
const GAPS = new Set(['7,2,s', '2,7,e']); // stair openings in the wall line

for (let c = 1; c <= 11; c++)
  for (let r = 1; r <= 9; r++) {
    const h = H(c, r);
    if (h === 0) {
      if (ROAD.has(`${c},${r}`)) put('dirt-road-straight', X(c), 0, Z(r), { yaw: 90 });
      else put(c <= 6 && r >= 8 ? 'stone-ground' : (c * 7 + r * 3) % 5 === 0 ? 'stone-ground' : 'dirt-ground', X(c), 0, Z(r));
    } else put('stone-ground', X(c), h, Z(r));
  }

// --- rock-wall faces on every dropping edge
const DIRS = [[0, 1, 0, 0.4, 's'], [0, -1, 180, -0.4, 'n'], [1, 0, 90, 0.4, 'e'], [-1, 0, 270, -0.4, 'w']];
for (let c = 1; c <= 11; c++)
  for (let r = 1; r <= 9; r++) {
    const h = H(c, r);
    if (!h) continue;
    for (const [dc, dr, yaw, off, tag] of DIRS) {
      const nh = H(c + dc, r + dr);
      if (nh === null || nh >= h || GAPS.has(`${c},${r},${tag}`)) continue;
      const wx = dc ? X(c) + dc + off : X(c), wz = dr ? Z(r) + dr + off : Z(r);
      for (let y = nh; y < h - 0.01; y += 2.6) put('rock-wall', wx, y, wz, { yaw });
    }
  }

// --- ramps: three stairs-stone flights scaled 0.87 (rise 0.87, run 1.39 each, 2.6 m total)
for (let k = 0; k < 3; k++) {
  put('stairs-stone', 2.0, k * 0.87, -4.3 + (2 - k) * 1.39, { scale: 0.87 }); // north, rises to -Z
  put('stairs-stone', -6.3 + (2 - k) * 1.4, k * 0.87, 4.0, { yaw: 90, scale: 0.87 }); // west, rises to -X
}
put('ladder', -4.6, MID, -6.0, { yaw: 90 });
put('ladder', -4.6, MID, -5.2, { yaw: 90 });

// --- derrick on the north terrace beside the ramp head
const DY = MID;
put('ladder', 4.1, DY, -7.1);
put('ladder', 6.3, DY, -7.1);
put('beam', 5.2, DY + 1.95, -7.1);
put('beam', 5.2, DY + 1.2, -7.1, { yaw: 90, scale: 0.4 });
put('rope-coil', 5.2, DY + 2.15, -7.1);
put('crate', 5.2, DY + 1.55, -7.1, { scale: 0.7 });
put('crate', 3.6, DY, -6.2, { yaw: 20 });
put('crate', 7.6, DY, -6.6, { yaw: 50 });
put('barrel', 8.0, DY, -7.2);
put('handcart', 0.6, DY, -6.8, { yaw: 80 });
put('lantern', 2.6, DY, -5.6);
put('torch', 0.0, DY, -5.4);

// --- upper shelf (NW corner)
for (const [a, x, z, yaw] of [['iron-ore', -9.0, -7.0, 30], ['copper-ore', -7.6, -5.6, 120], ['gold-ore', -9.2, -5.0, 200], ['iron-ore', -6.2, -7.4, 300]]) put(a, x, UP, z, { yaw });
put('pickaxe', -8.0, UP, -6.4, { yaw: 70 });
put('barrel', -5.2, UP, -7.4); put('sack', -4.8, UP, -6.4, { yaw: 40 });
put('rubble', -7.0, UP, -4.9, { yaw: 40, scale: 1.2 });

// --- west terrace: tool shed and tools
put('shed', -8.6, MID, 1.6, { yaw: 90 });
put('barrel', -9.2, MID, 4.8); put('barrel', -8.6, MID, 5.2);
put('crate', -9.0, MID, 7.0, { yaw: 30 });
put('shovel', -7.8, MID, 3.4, { yaw: 100 });
put('mining-pick', -7.8, MID, 6.2, { yaw: 160 });
put('sack', -9.4, MID, -1.4, { yaw: 40 });
put('wheelbarrow', -8.2, MID, -1.8, { yaw: 100 });
put('villager', -8.0, MID, 4.6, { yaw: 270 });
put('lantern', -7.6, MID, 0.2);

// --- east terrace: gate frame and stone
put('beam', 9.0, MID + 1.9, 0.0, { yaw: 90 });
put('ladder', 9.0, MID, -1.0, { yaw: 90 });
put('ladder', 9.0, MID, 1.0, { yaw: 90 });
put('rubble', 9.2, MID, 3.2, { yaw: 120, scale: 1.3 });
put('boulder', 9.4, MID, -3.0, { yaw: 50, scale: 1.1 });
put('crate', 9.2, MID, 5.2, { yaw: 10 });
put('farmer', 8.8, MID, -1.6, { yaw: 90 });

// --- cut blocks stacked on the pit floor
const stack = (x, z, n) => {
  for (let i = 0; i < n; i++) put('crate', x + i * 0.78, 0, z, { scale: 1.4 });
  for (let i = 0; i < n - 1; i++) put('crate', x + 0.39 + i * 0.78, 0.58, z, { scale: 1.4 });
};
stack(2.2, 0.4, 4);
stack(3.0, 2.0, 3);
stack(-2.0, 6.0, 3);
stack(0.0, -2.4, 3);
put('rubble', 5.8, 0, 0.4, { yaw: 30 });
put('rubble', -2.4, 0, -2.6, { yaw: 200 });
put('rubble', 5.6, 0, 3.8, { yaw: 120 });
put('handcart', -1.0, 0, 1.8, { yaw: 70 });
put('wheelbarrow', 1.6, 0, -1.0, { yaw: 120 });
put('wheelbarrow', 4.8, 0, 5.0, { yaw: 40 });
put('handcart', 5.4, 0, 6.2, { yaw: 90 });
put('wagon', 3.4, 0, 7.4, { yaw: 100 });
put('sack', 0.4, 0, 3.8, { yaw: 10 });
put('sack', 0.9, 0, 4.2, { yaw: 50 });
put('barrel', -3.0, 0, 3.4); put('barrel', -2.4, 0, 3.8);
put('pickaxe', -0.6, 0, 3.2, { yaw: 200 });
put('shovel', 1.6, 0, 2.2, { yaw: 40 });
put('hammer', 3.8, 0, -0.6, { yaw: 80 });
put('anvil', 6.4, 0, 1.4, { yaw: 20 });
put('campfire', -4.4, 0, 6.8);
put('villager', 1.2, 0, 0.4, { yaw: 160 });
put('blacksmith', 5.4, 0, 1.2, { yaw: 120 });
put('farmer', -1.0, 0, -0.8, { yaw: 230 });
put('villager', 4.4, 0, 3.0, { yaw: 270 });

// --- rim boulders, rubble, dead trees and edge dressing
const rim = [
  ['rubble', -5.4, 0, -3.5, 60, 1.4], ['rubble', 5.0, 0, -3.5, 200, 1.4], ['rubble', 7.0, 0, -3.2, 90, 1.3],
  ['rubble', -5.6, 0, 1.0, 250, 1.3], ['rubble', 7.2, 0, 7.8, 20, 1.5], ['rubble', -6.5, 0, 8.3, 330, 1.5],
  ['rubble', 9.3, 0, 7.8, 80, 1.4], ['rubble', 9.4, 0, 6.2, 140, 1.2], ['rubble', 0.4, 0, 8.4, 20, 1.4],
  ['boulder', 9.6, 0, 8.4, 60, 1.2], ['boulder', -9.4, 0, 8.4, 140, 1.1], ['boulder', 6.4, 0, -3.8, 30, 1.0],
  ['rock-cluster', -4.8, 0, 8.0, 300, 1.1], ['rock-cluster', 8.0, 0, 5.0, 40, 1.0],
  ['rubble', -2.0, MID, -7.4, 120, 1.4], ['boulder', 9.6, MID, -7.8, 10, 1.2], ['boulder', -9.6, MID, 8.0, 90, 1.1],
  ['rubble', 6.8, MID, -4.6, 30, 1.2], ['dead-tree', -9.4, MID, 2.8, 30, 0.8], ['dead-tree', 9.4, MID, 7.0, 200, 0.7],
  ['stump', 3.8, 0, 4.6, 0, 1], ['rubble', -9.6, UP, -7.8, 60, 1.5], ['boulder', -5.0, UP, -4.6, 140, 0.9],
  ['rubble', 1.0, MID, -7.8, 70, 1.3], ['rubble', 9.4, MID, 0.0, 300, 1.0],
];
for (const [a, x, y, z, yaw, s] of rim) put(a, x, y, z, { yaw, scale: s });

// --- map file, ASCII, doc
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/quarry.ts', `// GENERATED by scripts/design-quarry.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const ascii = Array.from({ length: 9 }, (_, i) => Array.from({ length: 11 }, (_, j) => (ROAD.has(`${j + 1},${i + 1}`) ? '=' : String(level(j + 1, i + 1)))).join(' ')).join('\n');
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/quarry.md', `# Quarry map plan (generated by scripts/design-quarry.mjs)

11 x 9 tiles of 2 m (22 m x 18 m). Cell (c,r) centre: x=(c-6)*2, z=(r-5)*2. Digits = terrace level (0 pit, 1 = 2.6 m, 2 = 5.2 m), = road.

\`\`\`
${ascii}
\`\`\`

Zones: stepped terraces (north and west) with a stair ramps (column 7 north, row 7 west) to a derrick; stacked cut blocks
and a cart yard on the pit floor; tool shed on the west terrace; the dirt road leaves east at row 8.
No mockup jpg existed; the layout follows the brief.

## Tally (${places.length} pieces)
${Object.entries(tally).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
console.log(ascii, '\n', places.length, 'pieces');
