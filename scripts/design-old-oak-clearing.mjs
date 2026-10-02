#!/usr/bin/env node
// Old Oak Clearing map designer (forest sample map): derives every placement
// from one data table so counts are exact. Prints an ASCII map and the
// component tally, and writes scenes/old-oak-clearing.ts plus
// docs/forest-mockups/map.md from the same data.
//
// Grid: 10 x 8 tiles of 2 m. col 1..10 west->east, row 1..8 north->south.
// Cell (c,r) center: x = (c-5.5)*2, z = (r-4.5)*2. +X east, -Z north.
// Anchor: docs/forest-mockups/forest-quest_001.jpg (v3 mockup).

import { writeFileSync } from 'node:fs';

const X = (c) => (c - 5.5) * 2;
const Z = (r) => (r - 4.5) * 2;

// --- tile plan -------------------------------------------------------------
// Path S-route: south entry c7 -> west along r6 -> north on c5 -> east on r4
// -> north on c7 to the north exit. Corner tile mouths at yaw 0 are {N,E}
// (bend axis at the tile's NE corner, verified in assets/footpath-corner.ts);
// rotation.y maps yaw 90: {N,E}->{N,W}, 180: {S,W}, 270: {S,E}.
const PATH = new Map([
  ['7,8', ['footpath-straight', 0]],
  ['7,7', ['footpath-straight', 0]],
  ['7,6', ['footpath-corner', 180]], // S+W
  ['6,6', ['footpath-straight', 90]],
  ['5,6', ['footpath-corner', 0]], // N+E
  ['5,5', ['footpath-straight', 0]],
  ['5,4', ['footpath-corner', 270]], // S+E
  ['6,4', ['footpath-straight', 90]],
  ['7,4', ['footpath-corner', 90]], // N+W
  ['7,3', ['footpath-straight', 0]],
  ['7,2', ['footpath-straight', 0]],
  ['7,1', ['footpath-straight', 0]],
]);

const places = [];
const put = (asset, x, z, opts = {}) => {
  const p = { asset, at: [x, opts.y ?? 0, z] }; // ground tiles are 0.3 m slabs with their top at y = 0
  if (opts.yaw) p.yaw = opts.yaw;
  if (opts.scale) p.scale = opts.scale;
  places.push(p);
};

// Tiles: river column c1, path cells, forest-ground everywhere else. A ring of
// forest floor (c -1..0 west of the stream, c11, r0, r9) carries the treeline, so
// every trunk and canopy stands on the ground; the stream and the path run through it.
for (let c = -1; c <= 11; c++)
  for (let r = 0; r <= 9; r++) {
    if (c === 1) {
      put('river-straight', X(c), Z(r), { y: 0 }); // N-S stream along the west edge (channel runs along Z at yaw 0)
      continue;
    }
    const path = PATH.get(`${c},${r}`) ?? (c === 7 && (r === 0 || r === 9) ? ['footpath-straight', 0] : undefined);
    if (path) put(path[0], X(c), Z(r), { yaw: path[1], y: 0 });
    // The sunlit clearing: grass-ground inside an irregular blob around the oak and the trail,
    // shaded forest floor outside it. (A dirt-ground blob was tried on 2026-10-02: the dark 2 m
    // tiles read as tilled plots.)
    else {
      const dx = (X(c) + 1) / 6.2, dz = (Z(r) + 0.6) / 4.6;
      const wob = 0.22 * Math.sin(c * 2.7 + r * 1.3) + 0.12 * Math.cos(c * 1.1 - r * 3.1);
      put(dx * dx + dz * dz < 1 + wob ? 'grass-ground' : 'forest-ground', X(c), Z(r), { y: 0 });
    }
  }

// --- landmarks (v3 mockup anchors) -----------------------------------------
put('ancient-oak', -2.5, -3.5, { yaw: 20, scale: 1.3 }); // THE old tree, west-of-center north
put('boulder', -4.8, -0.6, { yaw: 40 }); // wild boulder west of the oak (replaces the hamlet well)
put('rock-cluster', -4.2, 0.3, { yaw: 120 });
put('fallen-log', -4.4, 5.7, { yaw: 80 }); // log seat by the campfire
put('tree-stump', -6.6, 5.5, { yaw: 20 }); // stump seat by the campfire
put('campfire', -5.6, 4.4, { scale: 1.6 }); // lit fire, SW clearing near the stream
put('campfire-out', 6.8, -5.4, { yaw: 140 }); // burned-out hunters' fire, NE corner
put('fallen-log', 1.2, -3.6, { yaw: 35 }); // mossy log between the path's north arms
put('tree-stump', 4.2, 4.8, { yaw: 300 }); // stump with mushrooms, SE clearing
put('dead-tree', 7.6, -0.8, { yaw: 250 }); // bare snag on the east treeline
put('signpost', 4.0, 6.2, { yaw: 200 }); // by the south path entry

// --- stream dressing --------------------------------------------------------
put('reeds', -7.7, -5.6, { yaw: 15 });
put('reeds', -7.8, -1.4, { yaw: 160 });
put('reeds', -7.7, 2.8, { yaw: 75 });
put('reeds', -7.8, 5.6, { yaw: 240 });
put('stepping-stone', -9, 2.5, { y: -0.06 }); // crossing at r6, stones just above the water
put('stepping-stone', -9, 3.05, { y: -0.06 });
put('stepping-stone', -9, 3.6, { y: -0.06 });
put('rock-cluster', -7.3, -3.0, { yaw: 80 }); // north stream bank

// --- floor dressing ---------------------------------------------------------
put('mushroom', -3.6, -5.0); // at the oak's skirt
put('mushroom', -7.6, -0.4, { yaw: 120 }); // stream bank
put('mushroom', 5.6, -5.8, { yaw: 70 }); // NE camp
put('rock-cluster', 1.8, 6.0, { yaw: 190 }); // south clearing
put('tall-grass', -3.2, 1.8);
put('tall-grass', -1.4, -5.4, { yaw: 90 });
put('tall-grass', 2.4, 2.2, { yaw: 45 });
put('tall-grass', 4.8, 0.6, { yaw: 210 });
put('tall-grass', -6.2, -4.2, { yaw: 130 });
put('tall-grass', 6.6, 3.4, { yaw: 300 });
put('tall-grass', 0.6, 5.4, { yaw: 20 });
put('tall-grass', -4.4, 6.2, { yaw: 250 });
put('fern', -4.6, -5.4, { yaw: 30 });
put('fern', -0.8, -2.2, { yaw: 170 });
put('fern', 3.6, -2.4, { yaw: 290 });
put('fern', 6.0, 5.2, { yaw: 110 });
put('fern', -6.2, 5.6, { yaw: 200 });
put('fern', 1.4, 6.6, { yaw: 340 });
put('bramble', -7.6, -6.6, { yaw: 10 }); // treeline thickets
put('bramble', 8.0, 6.4, { yaw: 190 });
put('bramble', 8.2, -4.2, { yaw: 100 });
put('bush', -6.0, -6.8, { yaw: 60 });
put('bush', 6.4, -6.6, { yaw: 150 });
put('bush', -6.6, 6.8, { yaw: 320 });
put('bush', 8.2, 1.8, { yaw: 230 });
put('bush', -2.8, 6.8, { yaw: 25 });
put('bush', 0.8, -6.8, { yaw: 275 });
put('wildflowers', -2.2, 3.4);
put('wildflowers', 4.4, 5.4, { yaw: 140 });
put('wildflowers', -5.6, 0.4, { yaw: 220 });

// --- treeline (clearing boundary on the outer ring + far bank) --------------
// [x, z, asset, yaw, scale]
const TREES = [
  // north row (gap at the path exit x=3)
  [-7, -7, 'pine-tree', 10, 0.9], [-5, -7, 'oak-tree', 80, 1.05], [-3, -7, 'pine-tree', 190, 0.8],
  [1, -7, 'oak-tree', 260, 0.95], [5, -7, 'pine-tree', 330, 1.1], [7, -7, 'oak-tree', 45, 0.85],
  [9, -7, 'pine-tree', 135, 1.0],
  // south row (gap at the path entry x=3)
  [-7, 7, 'oak-tree', 20, 0.95], [-5, 7, 'pine-tree', 110, 0.8], [-3, 7, 'oak-tree', 200, 1.1],
  [-1, 7, 'pine-tree', 285, 0.9], [1, 7, 'oak-tree', 350, 0.85], [5, 7, 'oak-tree', 70, 1.0],
  [7, 7, 'pine-tree', 160, 0.9], [9, 7, 'oak-tree', 240, 1.05],
  // west bank (east of the stream, between the reeds)
  [-7, -5, 'oak-tree', 55, 0.9], [-7, 3, 'pine-tree', 305, 0.85],
  // east band (gap at the dead-tree accent z=-1)
  [9, -5, 'pine-tree', 95, 1.0], [9, -3, 'oak-tree', 175, 0.9], [9, 1, 'pine-tree', 265, 0.85],
  [9, 3, 'oak-tree', 355, 1.0], [9, 5, 'pine-tree', 125, 0.95],
  // far bank west of the stream, for depth
  [-11, -4, 'oak-tree', 15, 1.1], [-11, 2, 'pine-tree', 215, 1.0], [-11, 6, 'oak-tree', 145, 0.9],
];
for (const [x, z, asset, yaw, scale] of TREES.filter(([x, z]) => !((x === 9 && [-3, 3, 5].includes(z)) || (x === 7 && z === 7) || (x === 9 && z === -7) || (x === 5 && z === 7)) && Math.hypot(x + 2.5, z + 3.5) > 5.8 && Math.hypot(x + 2.5, z + 3.5) > 5.5 && Math.hypot(x + 5.6, z - 4.4) > 3.8).map(([x, z, ...r]) => [Math.abs(x - 9) < 0.1 ? 10.2 : x, Math.abs(z) === 7 ? Math.sign(z) * 7.8 : z, ...r])) put(asset, x, z, { yaw, scale });

// --- figures (scale) ---------------------------------------------------------
put('adventurer', 2.8, 6.4, { yaw: 180 }); // walking in from the south entry
put('druid', -6.4, 3.4, { yaw: 40 }); // tending the campfire, 1.3 m off so the fire shows

// --- ASCII map ---------------------------------------------------------------
const glyph = Array.from({ length: 8 }, () => Array(10).fill('.'));
for (let r = 1; r <= 8; r++) glyph[r - 1][0] = '~';
for (const [k, [asset]] of PATH) {
  const [c, r] = k.split(',').map(Number);
  glyph[r - 1][c - 1] = asset === 'footpath-corner' ? '+' : '=';
}
const mark = (x, z, g) => {
  const c = Math.round(x / 2 + 5.5), r = Math.round(z / 2 + 4.5);
  if (c >= 1 && c <= 10 && r >= 1 && r <= 8) glyph[r - 1][c - 1] = g;
};
mark(-2.5, -3.5, 'O'); // ancient oak
mark(-4.8, -0.6, 'B'); // boulder
mark(-5.6, 4.4, 'C'); // campfire
mark(6.8, -5.4, 'c'); // campfire-out
mark(1.2, -3.6, 'L'); // fallen log
mark(4.2, 4.8, 'T'); // stump
mark(7.6, -0.8, 'D'); // dead tree

console.log('=== Old Oak Clearing (10x8 tiles of 2 m) ===');
console.log(glyph.map((row) => '  ' + row.join(' ')).join('\n'));
console.log('\n~ stream  = path  + bend  . forest floor  O ancient oak  W well  C/c campfire lit/out');
console.log('L fallen log  T stump  D dead tree. Treeline (oaks/pines) rings the clearing.');

// --- emission ----------------------------------------------------------------
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => {
  const [x, y, z] = p.at;
  return `  { asset: '${p.asset}', at: [${num(x)}, ${num(y)}, ${num(z)}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
};
const sceneSrc = `// GENERATED by scripts/design-old-oak-clearing.mjs — edit the generator, not this file.
// The Old Oak Clearing: 10x8 tiles of 2 m inside a forest-floor ring (13x10 in all), the whole forest kit placed.
import type { Place } from './chibi-quest.js';

export function oldOakClearingPlaces(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`;
writeFileSync('scenes/old-oak-clearing.ts', sceneSrc);

const tally = {};
for (const p of places) if (!['adventurer', 'druid'].includes(p.asset)) tally[p.asset] = (tally[p.asset] ?? 0) + 1;

const doc = `# Old Oak Clearing — map plan (generated)

GENERATED by \`scripts/design-old-oak-clearing.mjs\` — edit the generator, not this file.

Forest sample map for the chibi set, realizing the v3 mockup
(\`forest-quest_001.jpg\`). 10 × 8 tiles of 2 m (20 m × 16 m) inside a ring of forest floor
that carries the treeline (two columns west of the stream, one on the other sides: 26 m × 20 m). Cell (c,r)
center: x = (c-5.5)·2, z = (r-4.5)·2; +X east, -Z north.

\`\`\`
${glyph.map((row) => '  ' + row.join(' ')).join('\n')}
\`\`\`

~ stream · = path · + bend · . forest floor · O ancient oak · W well ·
C campfire (lit) · c campfire (burned out) · L fallen log · T stump · D dead tree.

## Layout

A stream runs north-south along the west edge (reeds and stepping-stones on
it). The footpath enters at the south (c7), bends west along r6, north on c5,
east on r4, and exits north on c7 — an S-route that tours the clearing. The
ancient oak anchors the north-west of the path's north arm; the well, the lit
campfire, and the stream form the west side; a burned-out hunters' fire shows
the campfire's second state in the NE corner. Oaks and pines ring the
clearing; the dead tree stands out on the east treeline.

## Piece allocation (exact, from the data tables)

| component | count | where |
|-----------|-------|-------|
${Object.entries(tally)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `| ${k} | ${v} | |`)
  .join('\n')}

Total placed instances: ${places.length} (plus 2 figures).
`;
writeFileSync('docs/forest-mockups/map.md', doc);

console.log('\nwrote scenes/old-oak-clearing.ts (' + places.length + ' places) and docs/forest-mockups/map.md');
console.log('tally:', JSON.stringify(tally));
