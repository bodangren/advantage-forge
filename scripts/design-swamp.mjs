#!/usr/bin/env node
// Swamp map designer (Castle Defense level 5): 11 x 9 tiles of 2 m = 22 m x 18 m.
// col 0..10 west->east, row 0..8 north->south. Cell (c,r) center: x=(c-5)*2, z=(r-4)*2.
// One marsh-ground family plus an S-shaped river; one boardwalk runs west edge -> east edge,
// crossing the river three times, with marsh land beside it for tower slots.
// Writes scenes/maps/swamp.ts and docs/map-mockups/swamp.md.
import { writeFileSync } from 'node:fs';

const COLS = 11, ROWS = 9;
const X = (c) => (c - 5) * 2;
const Z = (r) => (r - 4) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
let seed = 20261002;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const yawr = () => Math.round(rnd() * 360);

// --- river: S shape. Bend mouths at yaw 0 {N,E}; 90 {N,W}; 180 {S,W}; 270 {S,E}.
const RIVER = new Map();
for (let r = 4; r <= 8; r++) RIVER.set(`3,${r}`, ['river-straight', 0]);
RIVER.set('3,3', ['river-bend', 270]);
for (let c = 4; c <= 6; c++) RIVER.set(`${c},3`, ['river-straight', 90]);
RIVER.set('7,3', ['river-bend', 90]);
for (let r = 0; r <= 2; r++) RIVER.set(`7,${r}`, ['river-straight', 0]);

// --- boardwalk cells: [c, r, kind, dirs]; straight 'NS' or 'EW'; corners list two mouths
const WALK = [
  [0, 6, 'EW'], [1, 6, 'EW'], [2, 6, 'EW'], [3, 6, 'EW'], [4, 6, 'EW'], [5, 6, 'WN'],
  [5, 5, 'NS'], [5, 4, 'NS'], [5, 3, 'NS'], [5, 2, 'NS'], [5, 1, 'SE'],
  [6, 1, 'EW'], [7, 1, 'EW'], [8, 1, 'EW'], [9, 1, 'EW'], [10, 1, 'EW'],
];
const PATHKEY = new Set(WALK.map(([c, r]) => `${c},${r}`));
const dirv = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// --- ground
for (let c = 0; c < COLS; c++)
  for (let r = 0; r < ROWS; r++) {
    const rv = RIVER.get(`${c},${r}`);
    if (rv) put(rv[0], X(c), Z(r), { yaw: rv[1] });
    else put('marsh-ground', X(c), Z(r));
  }

// --- boardwalk (walkway length runs along Z at yaw 0; yaw 90 runs along X)
for (const [c, r, k] of WALK) {
  const x = X(c), z = Z(r);
  if (k === 'NS') put('walkway', x, z);
  else if (k === 'EW') put('walkway', x, z, { yaw: 90 });
  else {
    for (const d of k) {
      const [dx, dz] = dirv[d];
      put('walkway', x + dx * 0.46, z + dz * 0.46, { yaw: dx !== 0 ? 90 : 0 });
    }
  }
}
// landing docks at both ends of the boardwalk
put('dock', X(0) + 0.0, Z(6) + 0.0, { yaw: 90, y: 0 });
put('dock', X(10) + 0.0, Z(1) + 0.0, { yaw: 90, y: 0 });
// planks and a mooring stub where the walkway meets the banks
for (const [x, z, yaw] of [[X(3) - 1.15, Z(6) + 0.6, 20], [X(3) + 1.15, Z(6) - 0.6, 340], [X(5) + 0.7, Z(3) + 1.15, 80], [X(7) - 1.2, Z(1) + 0.55, 15]])
  put('plank', x, z, { yaw });

// --- water dressing
put('rowboat', X(4), Z(3) + 0.1, { yaw: 90, y: -0.06, scale: 1.0 }); // rotting rowboat in the river bend
put('rowboat', X(3) - 0.2, Z(8) - 0.2, { yaw: 12, y: -0.06, scale: 0.85 });
put('reeds', X(6) - 0.3, Z(3) + 0.1, { y: -0.05, yaw: 20 });
put('cattails', X(7) - 0.7, Z(0) + 0.3, { y: -0.05, yaw: 130 });
put('reeds', X(3) + 0.35, Z(7) + 0.2, { y: -0.05, yaw: 250 });

// --- landmarks
put('hut', X(1) - 0.2, Z(2) - 0.6, { yaw: 160, scale: 1.1 }); // swamp hut, NW
put('willow-tree', X(1) + 0.9, Z(1) - 0.4, { yaw: 30, scale: 1.3 }); // main focal willow
put('dead-tree', X(1) - 0.2, Z(7) + 0.4, { yaw: 220, scale: 1.1 }); // SW
put('willow-tree', X(5) - 0.4, Z(8) - 0.2, { yaw: 100, scale: 1.2 }); // S middle
put('dead-tree', X(5) + 0.3, Z(0) + 0.4, { yaw: 300, scale: 1.1 }); // N middle
put('willow-tree', X(9) + 0.4, Z(5) - 0.2, { yaw: 200, scale: 1.3 }); // SE big willow
put('dead-tree', X(9) - 0.4, Z(8) - 0.5, { yaw: 40, scale: 1.0 });
put('dead-tree', X(1) + 0.4, Z(4) - 0.7, { yaw: 120, scale: 0.95 });
put('willow-tree', X(8) - 0.4, Z(3) - 0.9, { yaw: 70, scale: 1.0 });
put('willow-tree', X(10) - 0.2, Z(7) + 0.3, { yaw: 330, scale: 1.1 });
put('dead-tree', X(7) + 0.3, Z(7) + 0.2, { yaw: 160, scale: 1.0 });
put('willow-tree', X(3) - 0.3, Z(0) + 0.3, { yaw: 255, scale: 1.0 });
put('dead-tree', X(10) - 0.2, Z(3) - 0.2, { yaw: 10, scale: 0.9 });

// --- groups: dressing clustered at an anchor, never loose in open ground
const group = (x, z, items) => {
  for (const [a, dx, dz, o] of items) put(a, x + dx, z + dz, { yaw: yawr(), ...(o ?? {}) });
};
// bank reeds / cattails along river tiles (on the land tile beside each channel)
const bankReeds = [];
for (const [k] of RIVER) {
  const [c, r] = k.split(',').map(Number);
  for (const [dc, dr] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nc = c + dc, nr = r + dr;
    if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
    if (RIVER.has(`${nc},${nr}`) || PATHKEY.has(`${nc},${nr}`)) continue;
    bankReeds.push([nc, nr, dc, dr]);
  }
}
let n = 0;
for (const [nc, nr, dc, dr] of bankReeds) {
  const x = X(nc) - dc * 0.45 + (dr !== 0 ? (rnd() - 0.5) * 1.0 : 0);
  const z = Z(nr) - dr * 0.45 + (dc !== 0 ? (rnd() - 0.5) * 1.0 : 0);
  put(n++ % 3 === 0 ? 'cattails' : 'reeds', x, z, { yaw: yawr() });
}
// mushroom + moss groups at the trees and landmarks
group(X(1) + 0.9, Z(1) - 0.4, [['moss', -0.9, 0.7], ['red-mushroom', 0.8, 0.8], ['mushroom-cluster', -0.5, -0.9]]);
group(X(1) - 0.2, Z(2) - 0.6, [['moss', 1.5, 0.3], ['reeds', -1.4, 0.8], ['red-mushroom', 1.4, 1.2]]);
group(X(1) - 0.2, Z(7) + 0.4, [['mushroom-cluster', 0.9, -0.7], ['moss', -0.8, -0.9], ['reeds', 1.0, 0.7]]);
group(X(5) - 0.4, Z(8) - 0.2, [['moss', 0.9, -0.5], ['red-mushroom', -1.0, -0.6], ['cattails', 0.0, -1.3]]);
group(X(5) + 0.3, Z(0) + 0.4, [['mushroom-cluster', -0.9, 0.6], ['moss', 1.0, 0.5], ['reeds', 0.1, 1.2]]);
group(X(9) + 0.4, Z(5) - 0.2, [['moss', -1.0, 0.6], ['red-mushroom', 1.1, 0.7], ['mushroom-cluster', 0.4, -1.1], ['reeds', -1.3, -0.5]]);
group(X(9) - 0.4, Z(8) - 0.5, [['moss', 0.9, -0.5], ['red-mushroom', -0.9, -0.4]]);
group(X(1) + 0.4, Z(4) - 0.7, [['moss', 0.8, 0.6], ['mushroom-cluster', -0.7, 0.5]]);
group(X(8) - 0.4, Z(3) - 0.9, [['red-mushroom', 0.8, 0.5], ['moss', -0.9, 0.3], ['reeds', 0.3, 1.0]]);
group(X(10) - 0.2, Z(7) + 0.3, [['moss', -0.8, -0.6], ['mushroom-cluster', 0.0, -1.0]]);
group(X(7) + 0.3, Z(7) + 0.2, [['red-mushroom', -0.8, 0.4], ['moss', 0.8, -0.5], ['cattails', -0.2, 1.0]]);
group(X(3) - 0.3, Z(0) + 0.3, [['moss', 0.9, 0.5], ['red-mushroom', -0.8, 0.7], ['reeds', 0.2, 1.1]]);
// ponds on land beside the boardwalk (tower-free marsh pools) with reeds
for (const [x, z, yaw] of [[X(8), Z(6), 20], [X(1), Z(5) + 0.3, 90], [X(8) + 0.2, Z(4) - 0.3, 160]]) {
  put('pond', x, z, { yaw });
  put('reeds', x + 1.4, z + 0.3, { yaw: yawr() });
  put('cattails', x - 1.4, z - 0.4, { yaw: yawr() });
}
// vines hanging at the hut and the first willow
put('vines', X(1) + 0.2, Z(2) + 0.2, { yaw: 180, scale: 0.9 });
// edge dressing: reed fringe along the outer edge on land tiles
for (const [x, z] of [[X(0) - 0.7, Z(1)], [X(0) - 0.7, Z(3)], [X(2), Z(8) + 0.7], [X(4), Z(8) + 0.7], [X(8), Z(8) + 0.7], [X(10) + 0.7, Z(5)], [X(10) + 0.7, Z(2) + 0.5], [X(6), Z(0) - 0.7], [X(8), Z(0) - 0.7], [X(2), Z(0) - 0.7]])
  put(rnd() < 0.5 ? 'reeds' : 'cattails', x, z, { yaw: yawr() });

// --- ASCII map
const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
for (const [k] of RIVER) { const [c, r] = k.split(',').map(Number); g[r][c] = '~'; }
for (const [c, r, kk] of WALK) g[r][c] = kk.length === 2 && kk !== 'EW' && kk !== 'NS' ? '+' : '=';
console.log(g.map((r) => r.join(' ')).join('\n'));
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
console.log(places.length, 'pieces');

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/swamp.ts', `// GENERATED by scripts/design-swamp.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
writeFileSync('docs/map-mockups/swamp.md', `# Swamp — map plan (generated)

GENERATED by \`scripts/design-swamp.mjs\`. 11 x 9 tiles of 2 m (22 m x 18 m). Castle Defense level 5.
Cell (c,r) center: x=(c-5)*2, z=(r-4)*2.

\`\`\`
${g.map((r) => r.join(' ')).join('\n')}
\`\`\`
~ river (S shape)  = boardwalk  + boardwalk corner  . marsh-ground (tower slots beside the path)

The boardwalk runs from the west edge (row 6) to the east edge (row 1) and crosses the river three times.
Zones: NW willow and stilt hut; middle islands with dead trees and ponds; SE willow grove.

Pieces: ${places.length}

${Object.entries(tally).sort().map(([a, v]) => `- ${a}: ${v}`).join('\n')}

Notes: hut stands on the ground (no stilts model). Score vs mockup: 7.0 (self-assessed after shots).
`);
