#!/usr/bin/env node
// Tundra map designer (Castle Defense): 12 x 10 snow-ground tiles of 2 m (24 x 20 m).
// Cell (c,r): x = (c-6.5)*2, z = (r-5.5)*2. Path: west edge r7 -> north c4 -> east r4 -> south c8 -> east r7 -> east edge.
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
const S = 'dirt-ground', C = 'dirt-ground';
const PATH = new Map([
  ['1,7', [S, 90]], ['2,7', [S, 90]], ['3,7', [S, 90]], ['4,7', [C, 90]],
  ['4,6', [S, 0]], ['4,5', [S, 0]], ['4,4', [C, 270]],
  ['5,4', [S, 90]], ['6,4', [S, 90]], ['7,4', [S, 90]], ['8,4', [C, 180]],
  ['8,5', [S, 0]], ['8,6', [S, 0]], ['8,7', [C, 0]],
  ['9,7', [S, 90]], ['10,7', [S, 90]], ['11,7', [S, 90]], ['12,7', [S, 90]],
]);
for (let c = 1; c <= 12; c++)
  for (let r = 1; r <= 10; r++) {
    const p = PATH.get(`${c},${r}`);
    if (p) put(p[0], X(c), Z(r), { yaw: p[1] });
    else put('snow-ground', X(c), Z(r));
  }
// focal rock mass, north
put('boulder', -3.2, -7.6, { yaw: 20, scale: 2.4 });
put('boulder', -1.4, -8.0, { yaw: 100, scale: 2.0 });
put('boulder', -4.9, -7.9, { yaw: 210, scale: 1.7 });
put('boulder', -2.4, -6.3, { yaw: 60, scale: 1.2 });
put('rock-cluster', -0.2, -7.0, { yaw: 40, scale: 1.4 });
put('rock-cluster', -5.6, -6.2, { yaw: 160, scale: 1.3 });
put('ice-spire', -0.4, -8.3, { yaw: 30 });
put('ice-spire', 1.2, -7.6, { yaw: 120, scale: 0.8 });
put('snowbank', -3.4, -5.4, { yaw: 5 });
put('snowbank', -1.2, -5.8, { yaw: 350, scale: 0.8 });
// ice spire clearing with boulder ring, south middle
put('ice-spire', 0.6, 7.6, { yaw: 20, scale: 1.3 });
put('ice-spire', 1.6, 7.9, { yaw: 100, scale: 1.0 });
put('ice-spire', -0.2, 8.0, { yaw: 200, scale: 0.8 });
for (let i = 0; i < 8; i++) { const t = i / 8 * Math.PI * 2; put(i % 2 ? 'boulder' : 'rock-cluster', 0.8 + 2.3 * Math.cos(t), 7.8 + 1.5 * Math.sin(t), { yaw: i * 50, scale: i % 2 ? 0.8 : 1.2 }); }
// west woods (pine and dead trees)
const T = [
  ['pine-tree', 2.6, -9.0, 0.8], ['pine-tree', 4.2, -9.2, 0.7], ['pine-tree', 5.6, -8.8, 0.85],
  ['dead-tree', -10.6, -8.4, 0.95], ['dead-tree', -8.6, -9.0, 0.8], ['dead-tree', -10.8, -5.2, 1],
  ['dead-tree', -11, -2.4, 0.9], ['dead-tree', -8.8, -7.0, 0.9], ['dead-tree', -10.4, 0.6, 1.1],
  ['dead-tree', -7.2, 4.2, 0.9], ['dead-tree', -6.4, 8.8, 1], ['dead-tree', -9.6, 9.0, 0.9],
  ['dead-tree', -2.6, 9.0, 0.85], ['dead-tree', 8.0, -9.0, 0.85], ['dead-tree', 11, -8.4, 0.95],
  ['dead-tree', 10.4, -6.2, 0.9], ['dead-tree', 11, -3.6, 0.8], ['dead-tree', 6.2, 9.0, 1],
  ['dead-tree', 9.0, 9.0, 0.9], ['dead-tree', 11, 9.0, 1.0], ['dead-tree', 10.8, 4.0, 0.9],
  ['dead-tree', 6.6, -4.8, 0.8], ['dead-tree', -6.8, -1.2, 0.9],
];
T.forEach(([a, x, z, s], i) => put(a, x, z, { yaw: (i * 67) % 360, scale: s }));
// east plateau
put('boulder', 9.0, -1.2, { yaw: 40, scale: 1.3 });
put('boulder', 7.6, -1.8, { yaw: 120, scale: 0.8 });
put('rock-cluster', 10.2, 1.2, { yaw: 70, scale: 1.2 });
put('snowbank', 9.4, 1.8, { yaw: 100 });
put('snowbank', 6.4, -0.6, { yaw: 0, scale: 0.8 });
// edge banks and bits
[[-11.4, 8.4, 80], [-6.0, -9.4, 0], [4.4, -9.5, 190], [11.4, -1.2, 90], [11.4, 6.2, 90], [-11.4, -0.8, 90], [-4.2, 9.5, 0], [1.2, 9.6, 180]]
  .forEach(([x, z, yaw]) => put('snowbank', x, z, { yaw }));
put('stump', -7.6, -3.2, { yaw: 30 });
put('log', -6.4, 1.2, { yaw: 80 });
put('stump', 5.6, 3.2, { yaw: 200 });
put('signpost', -9.0, 5.2, { yaw: 90 });
put('fence', -10.0, 8.2, { yaw: 0 });
put('fence', -8.2, 8.2, { yaw: 0 });
put('fence', 10.0, 5.2, { yaw: 0 });
put('fence', 11.2, 5.2, { yaw: 0 });
put('ice-spire', 6.6, 5.4, { yaw: 40, scale: 0.7 });
put('ice-spire', 7.8, 7.8, { yaw: 200, scale: 0.6 });

// edge ring: snowbanks and rock clusters on the outer tiles
for (let i = 0; i < 12; i++) { const x = X(i + 1); put('snowbank', x, -9.5, { yaw: 0 }); put('snowbank', x, 9.5, { yaw: 0, scale: 0.9 }); if (i % 3 === 1) { put('rock-cluster', x + 0.6, -9.0, { yaw: i * 40, scale: 1.3 }); put('rock-cluster', x - 0.5, 9.0, { yaw: i * 70, scale: 1.2 }); } }
for (let j = 0; j < 10; j++) { const z = Z(j + 1); if (j !== 6) put('snowbank', 11.6, z, { yaw: 90 }); put('snowbank', -11.6, z, { yaw: 90 }); if (j % 3 === 0) { put('rock-cluster', -11.0, z + 0.7, { yaw: j * 55, scale: 1.3 }); put('rock-cluster', 11.0, z - 0.7, { yaw: j * 33, scale: 1.3 }); } }
// path banks: snowbanks along both edges of the trampled path (straight cells only)
const CORNERS = new Set(['4,7', '4,4', '8,4', '8,7']);
for (const [k, [a, yaw]] of PATH) { if (CORNERS.has(k)) continue; const [c, r] = k.split(',').map(Number); if (c === 1 || c === 12) continue; const ns = yaw !== 90; for (const sd of [-1, 1]) put('snowbank', X(c) + (ns ? sd * 1.25 : 0), Z(r) + (ns ? 0 : sd * 1.25), { yaw: ns ? 90 : 0, scale: 0.9 }); }
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/tundra.ts', `// GENERATED by scripts/design-tundra.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/tundra.md', `# Tundra map plan (generated)

GENERATED by \`scripts/design-tundra.mjs\`. 12 x 10 snow-ground tiles of 2 m (24 x 20 m).

## Layout

The path of trampled snow enters at the west edge (row 7), climbs north on column 4, runs east on row 4,
drops south on column 8, and leaves at the east edge on row 7. Open snow lies on both sides for tower slots.
Focal object: a rock mass with ice spires in the north. A frozen pond lies south of the path. Pines and dead
trees ring the west, north-east and south-east edges.

## Tally

| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log(places.length, JSON.stringify(tally));
