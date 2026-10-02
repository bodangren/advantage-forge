#!/usr/bin/env node
// Beach map designer: 22 m x 18 m tropical beach. Writes scenes/maps/beach.ts and docs/map-mockups/beach.md.
// Grid 11 x 9 tiles of 2 m. Cell (c,r): x = (c-6)*2, z = (r-5)*2 (c 1..11, r 1..9). Sea lies east.
import { writeFileSync } from 'node:fs';

const X = (c) => (c - 6) * 2;
const Z = (r) => (r - 5) * 2;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [+x.toFixed(2), o.y ?? 0, +z.toFixed(2)] };
  if (o.yaw) p.yaw = Math.round(o.yaw);
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// shoreline curve: sea where x > shore(z); sand dune bulge in the north
const shore = (z) => 4.2 + 0.3 * z + 0.9 * Math.sin(z * 0.5);
const isSea = (x, z) => x > shore(z) + 0.8;
const seaTile = (x, z) => isSea(X(Math.round(x / 2 + 6)), Z(Math.round(z / 2 + 5)));
const sh = (z, off) => shore(z) - off; // x at `off` metres inland of the shoreline
let CS = 1; while (!isSea(X(CS), Z(6))) CS++;
const DOCKX = X(CS) - 0.1;
const BOARD = new Set([CS - 3, CS - 2, CS - 1].map((c) => `${c},6`)); // boardwalk row from the cottage to the pier
const grid = [];
for (let r = 1; r <= 9; r++) {
  let row = '';
  for (let c = 1; c <= 11; c++) {
    const x = X(c), z = Z(r);
    if (isSea(x, z)) { put('sea-water', x, z); row += '~'; }
    else if (BOARD.has(`${c},${r}`)) { put('wood-floor', x, z); row += '='; }
    else { put('desert-ground', x, z); row += '.'; }
  }
  grid.push(row);
}
const onSand = (x, z) => x > -10.6 && x < 10.6 && z > -8.6 && z < 8.6 && !seaTile(x, z);

// --- landmarks
put('hut', -2.2, -4.6, { yaw: 180 }); // big thatched hut, north, door facing south... faces the camp
put('cottage', -5.6, 1.4, { yaw: 160 }); // red-roof beach house, west
// palms: north-west treeline plus one by the hut
for (const [x, z, s] of [[-8.6, -3.4, 0.7], [-6.8, -4.6, 0.75], [-4.8, -6.6, 0.8], [-0.2, -6.8, 0.7], [-8.8, 4.8, 0.65], [sh(-6.4, 3), -6.4, 0.6], [-8.6, 0.2, 0.55]])
  put('palm-tree', x, z, { yaw: rnd() * 360, scale: s });
// pier stub + boardwalk
put('dock', DOCKX, Z(6), { yaw: 90 });
put('rope-coil', DOCKX - 1.6, Z(6) + 1.5, { yaw: 40 });
put('barrel', DOCKX - 2.4, Z(6) + 1.7, { yaw: 20 });
put('crate', DOCKX - 1.8, Z(6) + 2.2, { yaw: 70 });
put('crate', DOCKX - 2.5, Z(6) + 2.4, { yaw: 10, scale: 0.8 });
// camp: campfire, bench, logs, tent, sailor
put('campfire', -1.6, 0.6, { scale: 1.3 });
put('fallen-log', -2.9, 1.0, { yaw: 100, scale: 0.8 });
put('wood-log', -0.2, 1.4, { yaw: 30 });
put('wood-log', -1.4, 2.2, { yaw: 100 });
put('bench', -1.6, -1.2, { yaw: 0 });
put('tent', -4.5, -1.5, { yaw: 200, scale: 0.8 });
put('sailor', -0.6, 2.0, { yaw: 200 });
put('firewood', -3.7, 3.6, { yaw: 160 });
put('torch', -3.4, -0.6);
// boat pulled ashore + boat in the water
put('rowboat', sh(-2.4, 0.9), -2.4, { yaw: 100, y: 0 });
put('rowboat', shore(-1.2) + 3.4, -1.2, { yaw: 25, y: -0.03 });
put('rowboat', shore(-5) + 3.8, -5, { yaw: 160, y: -0.03, scale: 0.9 });
put('fishing-net', 1.0, 4.9, { yaw: 180 });
put('fishing-net', sh(-4.4, 1.2), -4.4, { yaw: 90, scale: 0.7 });
put('treasure-chest', -2.0, 6.0, { yaw: 160, scale: 0.7 });
// dunes, rocks, driftwood
put('sand-dune', -7.4, -7.4, { yaw: 10 });
put('sand-dune', sh(-7.3, 2.2), -7.3, { yaw: 350 });
put('sand-dune', -9.2, 7.3, { yaw: 190 });
put('sand-dune', 0.6, 7.6, { yaw: 180, scale: 0.8 });
put('boulder', -0.4, 4.9, { yaw: 120, scale: 0.7 });
put('rock-cluster', sh(3.8, 0.9), 3.8, { yaw: 20 });
put('rock-cluster', sh(-6.2, 1.0), -6.2, { yaw: 100 });
put('rock-cluster', -9.4, -1.8, { yaw: 60 });
put('boulder', shore(6.6) + 1.6, 6.6, { yaw: 40, y: -0.02, scale: 0.8 }); // rock at the water edge
put('fallen-log', sh(0.8, 1.0), 0.8, { yaw: 75, scale: 0.7 });
put('wood-log', sh(-0.4, 1.8), -0.4, { yaw: 120 });
put('wood-log', -6.4, 6.0, { yaw: 60 });
for (const [x, z] of [[-7.4, -0.6], [-6.4, 4.4], [-1.2, -3.2], [-3.8, 5.6]]) put('tall-grass', x, z, { yaw: rnd() * 360 });
for (const [x, z] of [[-9.2, -5.4], [-3.4, -7.6], [1.8, -7.6], [-9.4, 2.4], [-5.2, 7.4]]) put('bush', x, z, { yaw: rnd() * 360 });
put('signpost', 0.4, -3.6, { yaw: 200 });
put('flag', sh(5.6, 1.2), 5.6, { yaw: 0 });
put('coral', shore(5.2) + 2.0, 5.2, { yaw: 40, y: -0.03, scale: 0.8 });
put('coral', shore(2.0) + 3.5, 2.0, { yaw: 100, y: -0.03, scale: 0.7 });

// --- south fill: second camp, hut, boat, driftwood, palm groups
put('hut', -6.2, 6.0, { yaw: 30, scale: 0.9 });
put('campfire', -1.0, 6.2, { scale: 1.2 });
put('wood-log', -2.2, 6.9, { yaw: 80 });
put('wood-log', 0.2, 7.0, { yaw: 100 });
put('bench', -1.0, 7.6, { yaw: 180 });
put('rowboat', sh(6.4, 3.2), 6.4, { yaw: 80 });
put('fallen-log', -3.5, 4.4, { yaw: 120, scale: 0.7 });
put('fallen-log', 2.4, 7.8, { yaw: 60, scale: 0.6 });
for (const [x, z, s2] of [[-9.0, 7.2, 0.7], [-8.0, 8.0, 0.6], [-9.6, 5.8, 0.6], [3.6, 7.6, 0.65], [4.6, 6.6, 0.55], [-3.8, 8.2, 0.6]])
  put('palm-tree', x, z, { yaw: rnd() * 360, scale: s2 });
// hide the stepped shoreline: rocks, dunes and shell rows on every step corner
const edge = (r) => { let c = 1; while (c <= 11 && !isSea(X(c), Z(r))) c++; return X(c) - 1; };
for (let r = 1; r <= 9; r++) {
  const e = edge(r), z = Z(r);
  const next = r < 9 ? edge(r + 1) : e;
  if (next !== e) { // step corner at z + 1
    const zc = z + 1, xc = Math.min(e, next) - 0.3;
    if (r % 2) put('rock-cluster', xc - 0.2, zc - 0.3, { yaw: rnd() * 360, scale: 0.8 });
    else put('sand-dune', xc - 0.8, zc - 0.6, { yaw: rnd() * 360, scale: 0.55 });
  }
  if (Math.abs(z - Z(6)) > 1.6) for (let k = 0; k < 3; k++) put('shell', e - 0.35 - rnd() * 0.3, z - 0.7 + k * 0.7 + rnd() * 0.2, { yaw: rnd() * 360, scale: +(0.9 + rnd() * 0.5).toFixed(2) });
}
// shell clusters (a few groups instead of an even scatter)
const taken = places.filter((p) => p.asset !== 'desert-ground' && p.asset !== 'sea-water');
for (const [cx, cz] of [[-6.5, -1.5], [-1.5, -5.0], [1.0, 1.2], [-4.2, 3.0], [0.8, 4.4], [-8.0, 2.6], [2.8, -2.4], [-3.0, -3.4]]) {
  for (let k = 0; k < 4; k++) {
    const x = cx + (rnd() - 0.5) * 1.2, z = cz + (rnd() - 0.5) * 1.2;
    if (!onSand(x, z) || taken.some((p) => Math.hypot(p.at[0] - x, p.at[2] - z) < 0.7)) continue;
    put('shell', x, z, { yaw: rnd() * 360, scale: +(0.9 + rnd() * 0.6).toFixed(2) });
  }
}

const src = `// GENERATED by scripts/design-beach.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return ${JSON.stringify(places, null, 0).replace(/\},\{/g, '},\n    {').replace(/^\[/, '[\n    ').replace(/\]$/, '\n  ]')};
}
`;
writeFileSync('scenes/maps/beach.ts', src);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/beach.md', `# Beach map

22 m x 18 m (11 x 9 tiles). Sand (desert-ground) west, sea-water east behind a curved shoreline.
Focal object: the thatched hut and campfire camp. Zones: camp (centre), pier and boardwalk (east), palm treeline (north-west).
Path: wood-floor boardwalk from the cottage to the dock.

\`\`\`
${grid.join('\n')}
\`\`\`

Pieces: ${places.length}

${Object.entries(tally).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Notes: no starfish asset exists; shells stand in. Score and remaining differences are in the build report.
`);
console.log(grid.join('\n'));
console.log(places.length, JSON.stringify(tally));

for (const p of places) if (!['sea-water','desert-ground','wood-floor','rowboat','coral','boulder'].includes(p.asset) && seaTile(p.at[0], p.at[2]) && p.asset!=='dock') console.log('IN SEA', p.asset, p.at);
