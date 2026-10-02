#!/usr/bin/env node
// Marsh map designer: a light open reed marsh, 11 x 9 tiles of 2 m (22 x 18 m), no river.
// Cell (c,r) center: x = (c-6)*2, z = (r-5)*2. +X east, -Z north.
// Zones: reed beds + big pond with stepping stones (centre/south), plank landing with rowboat
// (north-west shore), hunters' raised hide (east), willows and crooked fence on the north edge.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = Math.round(((o.yaw % 360) + 360) % 360);
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ground: one family
for (let c = 1; c <= 11; c++) for (let r = 1; r <= 9; r++) put('marsh-ground', (c - 6) * 2, (r - 5) * 2);

// ponds [x, z, scale, yaw]
const PONDS = [[-1.5, 2.6, 1.8, 0], [4.8, 5.4, 1.0, 20], [-7.8, 3.8, 1.2, 160], [7.6, -5.8, 0.9, 70]];
for (const [x, z, s, yaw] of PONDS) put('pond', x, z, { scale: s, yaw });
// distance to pond edge (<0 inside, margin included); ponds are 2.5 x 1.95 at scale 1 (yaw 0)
const pondD = (x, z) => Math.min(...PONDS.map(([px, pz, s, yaw]) => {
  const a = (yaw * Math.PI) / 180, dx = x - px, dz = z - pz;
  const u = (dx * Math.cos(a) - dz * Math.sin(a)) / (1.3 * s), v = (dx * Math.sin(a) + dz * Math.cos(a)) / (1.05 * s);
  return (Math.hypot(u, v) - 1) * s;
}));

// obstacles for scatter [x, z, radius]
const BLOCK = [
  [7.4, -0.5, 3.4], // hide
  [-2.8, -0.2, 2.2], // landing
  [-6.2, -5.4, 1.6], // rowboat
  [-1.5, -6.6, 2.0], // willow
];
const free = (x, z, m = 0.4) => pondD(x, z) > m && BLOCK.every(([bx, bz, r]) => Math.hypot(x - bx, z - bz) > r) && Math.abs(x) < 10.2 && Math.abs(z) < 8.3;

// --- stepping-stone path: south-east entry, around the big pond's east side, up to the hide
const ROUTE = [[2.6, 8.0], [2.6, 0.5], [0.6, 0.5], [2.6, 0.5], [6.0, 0.5]];
const PATHPTS = [];
for (let i = 0; i < ROUTE.length - 1; i++) {
  const [x0, z0] = ROUTE[i], [x1, z1] = ROUTE[i + 1];
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.0));
  for (let k = 0; k < n; k++) PATHPTS.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n]);
}
for (const z of [8, 6, 4, 2, 0]) put('walkway', 2.6, z);
for (const x of [0.6, 4.0, 5.2]) put('walkway', x, 0.5, { yaw: 90 });
const nearPath = (x, z, m) => PATHPTS.some(([px, pz]) => Math.hypot(x - px, z - pz) < m);
// stepping stones across the small pond SE and the west pond
for (let i = 0; i < 5; i++) put('river-rock', 4.0 + i * 0.5, 5.9 - i * 0.3 + (i % 2) * 0.1, { yaw: i * 70, scale: 0.8 });
for (let i = 0; i < 5; i++) put('river-rock', -8.8 + i * 0.5, 3.2 + (i % 2) * 0.3, { yaw: i * 50, scale: 0.8 });

// --- landing: dock on the north shore of the big pond, boat beside it
put('dock', -1.5, 0.5, { yaw: 180 });
put('rowboat', -5.8, 1.6, { yaw: 100, scale: 1.4 });
put('plank', -3.6, -0.7, { yaw: 20 });
put('plank', -3.3, -0.4, { yaw: 75 });
put('barrel', -3.2, -1.8, { yaw: 40 });
put('crate', -0.2, -1.4, { yaw: 12 });
put('fishing-net', -0.6, -0.9, { yaw: 160 });
put('rowboat', -6.2, -5.4, { yaw: 80, scale: 1.4 }); // old beached hull on the north-west bank
put('plank', -5.2, -4.4, { yaw: 40 });

// --- hunters' raised hide, east
for (const [x, z] of [[6.4, -1.5], [8.4, -1.5], [6.4, 0.5], [8.4, 0.5]]) { put('wood-floor', x, z, { y: 0.3 }); put('wood-floor', x, z, { y: 0.6 }); }
put('hut', 7.4, -0.5, { y: 0.6, yaw: 0, scale: 1.1 });
put('ladder', 7.4, 1.6, { scale: 0.5 });
put('crate', 5.9, -2.2, { y: 0.6, yaw: 30 });
put('barrel', 9.0, -2.4, { y: 0.6 });
put('log', 8.8, -3.8, { yaw: 70 });
put('fallen-log', 6.0, 2.8, { yaw: 120 });
put('stump', 9.2, 2.2, { yaw: 40 });
put('boulder', 10.0, 0.0, { yaw: 120 });

// --- willows and dead tree
put('willow-tree', -1.5, -6.6, { yaw: 20, scale: 1.4 });
put('willow-tree', 5.0, -6.8, { yaw: 160, scale: 0.8 });
put('willow-tree', -9.0, 6.6, { yaw: 300, scale: 1.2 });
put('willow-tree', 9.4, 6.2, { yaw: 80, scale: 1.0 });
put('dead-tree', -9.6, -1.0, { yaw: 250 });
put('dead-tree', 1.8, 7.6, { yaw: 90, scale: 0.9 });

// --- crooked fence: north edge and west edge
for (let i = 0; i < 11; i++) put('fence', -9.6 + i * 1.9 + (rnd() - 0.5) * 0.15, -8.6 + (rnd() - 0.5) * 0.25, { yaw: (rnd() - 0.5) * 14 });
for (let i = 0; i < 7; i++) put('fence', -10.6 + (rnd() - 0.5) * 0.2, -7.4 + i * 1.9, { yaw: 90 + (rnd() - 0.5) * 14 });
for (let i = 0; i < 2; i++) put('fence', 6.4 + i * 1.9, 8.7 + (rnd() - 0.5) * 0.2, { yaw: (rnd() - 0.5) * 12 });

// --- reed beds: [cx, cz, radius, n]
const BEDS = [[-5.0, 6.0, 1.4, 16], [-8.4, 0.6, 1.3, 13], [-1.2, 7.0, 1.3, 13], [7.4, 4.6, 1.3, 13], [9.0, -6.0, 1.2, 11], [-4.6, -3.4, 1.2, 11]];
for (const [cx, cz, R, n] of BEDS) {
  let placed = 0, tries = 0;
  while (placed < n && tries++ < 200) {
    const a = rnd() * 6.283, d = Math.sqrt(rnd()) * R, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    if (!free(x, z, 0.15) || nearPath(x, z, 0.8)) continue;
    const k = placed % 3;
    put(k === 1 ? 'cattails' : k === 2 ? 'tall-grass' : 'reeds', x, z, { yaw: rnd() * 360, scale: 0.9 + rnd() * 0.5 });
    placed++;
  }
}
// pond rims: cattails and reeds hugging every pond
for (const [px, pz, s, yaw] of [PONDS[0], PONDS[2]]) {
  const m = Math.round(5 + s * 3);
  for (let i = 0; i < m; i++) {
    const a = (i / m) * 6.283 + rnd() * 0.3, x = px + Math.cos(a) * 1.5 * s, z = pz + Math.sin(a) * 1.2 * s;
    if (!free(x, z, -0.05) || nearPath(x, z, 0.9) || Math.hypot(x + 1.5, z - 0.5) < 2.2) continue;
    put(i % 2 ? 'cattails' : 'reeds', x, z, { yaw: rnd() * 360, scale: 0.9 + rnd() * 0.3 });
  }
}
// edge dressing: bushes and boulders along the border, away from the path
const edge = [];
for (let x = -9.6; x <= 9.8; x += 2.6) edge.push([x, 7.7]);
for (let z = -6; z <= 6; z += 2.8) edge.push([-9.8, z], [9.9, z]);
edge.forEach(([x, z], i) => {
  x += (rnd() - 0.5) * 0.8; z += (rnd() - 0.5) * 0.6;
  if (!free(x, z, 0.3) || nearPath(x, z, 1.2)) return;
  put(i % 3 === 0 ? 'boulder' : 'bush', x, z, { yaw: rnd() * 360, scale: 0.8 + rnd() * 0.3 });
});

// --- ASCII + tally
const glyph = Array.from({ length: 9 }, () => Array(11).fill('.'));
const mark = (x, z, g) => { const c = Math.round(x / 2 + 6), r = Math.round(z / 2 + 5); if (c >= 1 && c <= 11 && r >= 1 && r <= 9) glyph[r - 1][c - 1] = g; };
for (const [x, z] of PATHPTS) mark(x, z, ':');
for (const [x, z] of PONDS) mark(x, z, '~');
mark(-1.5, 0.5, 'D'); mark(-4.6, 1.2, 'B'); mark(7.4, -0.5, 'H'); mark(-1.5, -6.6, 'W'); mark(5, -6.8, 'W');
console.log(glyph.map((r) => '  ' + r.join(' ')).join('\n'));

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `    { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${num(p.scale)}` : ''} },`;
writeFileSync('scenes/maps/marsh.ts', `// GENERATED by scripts/design-marsh.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/marsh.md', `# Marsh map plan (generated)

GENERATED by \`scripts/design-marsh.mjs\`. 11 x 9 tiles of 2 m (22 x 18 m), all marsh-ground. x = (c-6)*2, z = (r-5)*2.

\`\`\`
${glyph.map((r) => '  ' + r.join(' ')).join('\n')}
\`\`\`
~ pond  : stepping stones  D plank landing  B rowboat  H hunters' hide  W willow

## Zones
- Big pond with stepping-stone path from the south entry up the east shore to the hide.
- Plank landing (dock) on the pond's north shore with a rowboat, planks, barrel, net.
- Hunters' hide: round hut with ladder, crates, barrels, logs on the east side.
- Reed beds and cattail rims, willows and a crooked fence on the north and west edges.

## Tally
| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log('wrote', places.length, JSON.stringify(tally));
