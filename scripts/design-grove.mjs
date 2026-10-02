#!/usr/bin/env node
// Sacred grove map designer: 10 x 9 tiles of 2 m (20 x 18 m), all forest-ground.
// Cell (c,r) center: x = (c-5.5)*2, z = (r-5)*2. +X east, -Z north.
// Zones: great tree (centre), offering altar (south of the tree), ring of rune-stones and obelisks,
// druid circle on the ring, glowing mushroom patches, crystal patches, fern and moss edge.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [+x.toFixed(2), o.y ?? 0, +z.toFixed(2)] };
  if (o.yaw) p.yaw = Math.round(((o.yaw % 360) + 360) % 360);
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const faceCentre = (x, z) => (Math.atan2(-x, -z) * 180) / Math.PI + 180; // yaw so +Z faces the centre

// ground
for (let c = 1; c <= 10; c++) for (let r = 1; r <= 9; r++) { const x = (c - 5.5) * 2, z = (r - 5) * 2; const d = (x / 6.6) ** 2 + ((z - 0.4) / 6.2) ** 2; put(d < 1 ? 'cobble-floor' : 'forest-ground', x, z); }

const TX = 0, TZ = -0.8;
// focal: the great tree
put('ancient-tree', TX, TZ, { yaw: 15, scale: 1.05 });
put('roots', TX + 1.6, TZ + 1.4, { yaw: 40 });
put('roots', TX - 1.7, TZ + 1.2, { yaw: 300 });
put('roots', TX + 0.2, TZ - 1.9, { yaw: 180 });

// altar zone south of the tree
put('altar', 0, 2.6, { yaw: 0, scale: 1.7 });
put('candle-cluster', -2.0, 2.7);
put('candle-cluster', 2.0, 2.7);
put('lantern', -1.6, 3.8);
put('lantern', 1.6, 3.8);
put('crystal-focus', 0, 4.5, { scale: 1.3 });
for (const [x, z] of [[-0.5, 5.4], [0.5, 6.0]]) put('stepping-stone', x, z, { yaw: rnd() * 360 });
for (const z of [6.7, 7.4, 8.1]) put('stepping-stone', (rnd() - 0.5) * 0.5, z, { yaw: rnd() * 360 });

// ring of standing stones (ellipse), gap at south for the approach
const RX = 6.0, RZ = 5.6;
const N = 16;
for (let i = 0; i < N; i++) {
  const a = (i / N) * Math.PI * 2;
  const x = Math.sin(a) * RX, z = -Math.cos(a) * RZ + 0.3;
  if (Math.abs(x) < 2.2 && z > 3) continue;
  const big = i % 4 === 0;
  put(big ? 'obelisk' : 'gravestone', x, z, { yaw: faceCentre(x, z), scale: big ? 1.2 : 1.7 });
}

// druid circle (west side) and shaman (east side)
put('druid', -4.2, 3.6, { scale: 1.6, yaw: 130 });
put('druid', -5.0, 1.0, { scale: 1.6, yaw: 100 });
put('druid', 4.4, 3.4, { scale: 1.6, yaw: 230 });
put('shaman', 5.0, 0.8, { scale: 1.6, yaw: 260 });


// crystal patches (NW and NE, inside the ring and beyond)
for (const [x, z, s] of [[-5.2, -4.6, 1.3], [-4.4, -3.8, 0.9], [-6.0, -3.6, 0.8]]) put('crystal-cluster', x, z, { yaw: rnd() * 360, scale: s * 2.2 });
put('giant-crystal', -5.6, -5.4, { yaw: 30, scale: 1.1 });
for (const [x, z, s] of [[5.4, -4.2, 1.3], [4.6, -3.4, 0.9], [6.2, -3.2, 0.8]]) put('crystal-cluster', x, z, { yaw: rnd() * 360, scale: s * 2.2 });
put('giant-crystal', 5.8, -5.2, { yaw: 200, scale: 1.0 });

// glowing mushroom patches (tight groups)
const patch = (cx, cz, n, rad) => {
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.28, d = rnd() * rad;
    put(i % 3 === 0 ? 'mushroom-cluster' : 'glowing-mushroom', cx + Math.cos(a) * d, cz + Math.sin(a) * d, { yaw: rnd() * 360, scale: 2.2 + rnd() * 0.8 });
  }
};
patch(-3.4, -0.6, 6, 0.9);
patch(3.4, -0.2, 6, 0.9);
patch(-2.0, 5.6, 4, 0.7);
patch(2.4, 5.8, 4, 0.7);
patch(0.2, -5.6, 5, 1.0);

// root skirt: moss + ferns at the tree base and around stones
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * 6.28 + 0.3;
  put('moss', TX + Math.sin(a) * 2.6, TZ + Math.cos(a) * 2.4, { yaw: rnd() * 360, scale: 1.5 });
}

// edge dressing: ferns, moss, bushes, boulders inside the border, outside the ring
const edge = [];
for (let x = -9; x <= 9; x += 1.5) { edge.push([x, -8.3]); edge.push([x, 8.3]); }
for (let z = -7; z <= 7; z += 1.5) { edge.push([-9.3, z]); edge.push([9.3, z]); }
edge.forEach(([x, z], i) => {
  if (Math.abs(x) < 1.4 && z > 7) return; // approach stays open
  if (i % 2) return;
  const k = (i / 2) % 3;
  const a = k === 0 ? 'bush' : k === 1 ? 'moss' : 'fern';
  put(a, x + (rnd() - 0.5) * 0.4, z + (rnd() - 0.5) * 0.3, { yaw: rnd() * 360, scale: a === 'bush' ? 1.5 : a === 'boulder' ? 0.8 : a === 'moss' ? 1.6 : 1.7 });
});
// second fern row, inside
for (let x = -8; x <= 8; x += 4) { if (Math.abs(x) > 1.4) { put('fern', x + rnd() * 0.5, -7.2 + rnd() * 0.4, { yaw: rnd() * 360, scale: 1.8 }); put('fern', x + rnd() * 0.5, 7.0 + rnd() * 0.4, { yaw: rnd() * 360, scale: 1.8 }); } }
for (let z = -5.5; z <= 5.5; z += 4.4) { put('fern', -8.2, z, { yaw: rnd() * 360, scale: 1.8 }); put('fern', 8.2, z, { yaw: rnd() * 360, scale: 1.8 }); }
// corner trees
put('willow-tree', -8.2, -7.0, { yaw: 30, scale: 1.1 });
put('willow-tree', 8.2, -7.0, { yaw: 200, scale: 1.1 });
put('oak-tree', -8.4, 7.0, { yaw: 100, scale: 1.0 });
put('oak-tree', 8.4, 7.0, { yaw: 290, scale: 1.0 });
put('tree-stump', -3.0, 7.0, { yaw: 40 });
put('log', 3.2, 7.2, { yaw: 80 });

// ASCII map
const W = 40, H = 18;
const g = Array.from({ length: H }, () => Array(W).fill('.'));
const mark = (x, z, ch) => { const c = Math.round((x + 10) * 2), r = Math.round(z + 9); if (c >= 0 && c < W && r >= 0 && r < H) g[r][c] = ch; };
const key = { 'ancient-tree': 'T', altar: 'A', 'rune-stone': 's', obelisk: 'O', druid: 'd', shaman: 'd', 'crystal-cluster': 'c', 'giant-crystal': 'C', 'glowing-mushroom': 'm', 'mushroom-cluster': 'm', 'stepping-stone': '=' };
for (const p of places) if (key[p.asset]) mark(p.at[0], p.at[2], key[p.asset]);
const ascii = g.map((r) => '  ' + r.join('')).join('\n');
console.log(ascii);

const num = (v) => String(v);
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/grove.ts', `// GENERATED by scripts/design-grove.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/grove.md', `# Sacred grove: map plan (generated by scripts/design-grove.mjs)

20 m x 18 m, 10 x 9 forest-ground tiles. Cell (c,r) centre: x = (c-5.5)*2, z = (r-5)*2.

\`\`\`
${ascii}
\`\`\`

T great tree, A altar, s rune-stone, O obelisk, d druid/shaman, c/C crystals, m mushroom patches, = stepping-stone path.

## Layout

The ancient tree stands at the centre with roots and a moss skirt. South of it the offering altar
sits between candles and lanterns, with a stepping-stone path to the south edge. Rune-stones and
obelisks form an elliptical ring with a gap at the south. Druids and a shaman stand on the ring.
Crystal patches fill the north corners, glowing mushroom patches sit between tree and ring.
Ferns, moss, bushes, boulders, and four corner trees dress the edge.

## Tally

| asset | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log('wrote', places.length, 'places');
