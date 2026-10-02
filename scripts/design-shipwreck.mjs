#!/usr/bin/env node
// Shipwreck map designer: 11 x 9 tiles of 2 m (22 m x 18 m). Sea in the south-west,
// sandy beach elsewhere, a broken pirate ship beached at the waterline.
// Cell (c,r) center: x = (c-5)*2, z = (r-4)*2 for c 0..10, r 0..8. +X east, -Z north.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = Math.round(o.yaw);
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const isWater = (x, z) => x - z < -5.5 + 1.1 * Math.sin(x * 0.7) + 0.8 * Math.cos(z * 1.1);
const ok = (x, z, m = 1) => Math.abs(x) <= 10 - m && Math.abs(z) <= 8 - m;
const inWater = (x, z) => isWater(x, z);
const SHIP = [-1.8, -2.6];

const glyph = [];
for (let r = 0; r < 9; r++) {
  const row = [];
  for (let c = 0; c < 11; c++) {
    const x = (c - 5) * 2, z = (r - 4) * 2;
    const w = isWater(x, z);
    put(w ? 'sea-water' : 'desert-ground', x, z);
    row.push(w ? '~' : '.');
  }
  glyph.push(row);
}

// Focal: the beached ship, listing and half buried in the sand.
put('pirate-ship', SHIP[0], SHIP[1], { yaw: 125, y: -0.45, scale: 1 });
put('rowboat', -5.6, 2.3, { yaw: 60, y: -0.12 }); // washed up in the surf
put('rowboat', -7.2, 4.8, { yaw: 200, y: -0.02, scale: 0.8 });

// Story A: cargo spilled from the hull, east of the ship.
put('chest', 6.6, -1.4, { yaw: 215 });
put('treasure-chest', 6.8, -1.2, { yaw: 215, scale: 0.01 });
put('crate', 2.6, 0.6, { yaw: 20 }); put('crate', 3.2, 1.2, { yaw: 70 }); put('crate', 2.9, -0.2, { yaw: 100, scale: 0.9 });
put('barrel', 3.9, 0.2, { yaw: 0 }); put('barrel', 1.2, 2.2, { yaw: 40 }); put('barrel', 0.2, 1.4, { yaw: 120, scale: 0.9 });
put('sack', 2.2, 1.9, { yaw: 30 }); put('sack', 4.4, 1.5, { yaw: 160 }); put('sack', -0.6, 2.9, { yaw: 300 });
put('rope-coil', 1.0, 0.2, { yaw: 80 }); put('rope-coil', 4.8, -0.6, { yaw: 200 });
put('fishing-net', 0.6, 3.6, { yaw: 40 });
put('bottle', 5.1, 2.4, { yaw: 50 }); put('bottle', -3.2, 3.8, { yaw: 120 });

// Story B: the castaway camp and driftwood pile, north-east.
put('sailor', 4.2, -3.6, { yaw: 200 });
put('campfire', 3.0, -3.8, { scale: 1.1 });
put('log', 2.9, -2.6, { yaw: 95 }); put('log', 5.2, -4.4, { yaw: 20 });
put('treasure-map', 4.8, -2.8, { yaw: 30, scale: 0.8 });
put('bone-pile', -6.0, -4.2, { yaw: 60 });

// Planks and driftwood scattered along the tide line and around the hull.
for (let i = 0; i < 22; i++) {
  const a = rnd() * 6.28, d = 3 + rnd() * 4;
  const x = SHIP[0] + Math.cos(a) * d * 1.3, z = SHIP[1] + Math.sin(a) * d * 0.9;
  if (ok(x, z) && !inWater(x, z)) put(rnd() > 0.35 ? 'plank' : 'log', x, z, { yaw: rnd() * 360, scale: 0.8 + rnd() * 0.4 });
}
// Rocks: boulders and clusters on the east and north.
for (const [x, z, s] of [[7.4, -3.8, 1.0], [6.0, -6.4, 0.8], [-4.2, -6.6, 1.1], [8.6, 3.2, 0.9], [8.4, 6.2, 1.2], [-8.6, -2.0, 1.0], [0.4, -6.4, 0.7], [-8.6, -5.8, 1.0]])
  put('boulder', x, z, { yaw: rnd() * 360, scale: s });
for (const [x, z] of [[7.8, -1.4], [5.8, 5.6], [-1.6, 6.4], [-6.4, -1.6], [2.2, -6.2]]) put('rock-cluster', x, z, { yaw: rnd() * 360 });
// Palms: east and north edges, leaning toward the chest.
for (const [x, z, s] of [[8.2, -1.0, 0.9], [8.9, -2.4, 0.7], [-9.0, -4.4, 0.9], [-2.2, -7.2, 0.8], [7.6, 6.4, 0.85], [9.2, 1.0, 0.8], [2.0, -7.4, 0.9]])
  put('palm-tree', x, z, { yaw: rnd() * 360, scale: s });
// Dunes along the back.
for (const [x, z] of [[-6.6, -7.0], [5.6, -7.2], [9.0, -5.4], [-9.2, -0.2], [9.2, 4.2], [4.4, 6.8], [-0.2, 7.2]]) put('sand-dune', x, z, { yaw: rnd() * 360 });
// Shells and bottles on the sand and in the shallows.
for (let i = 0; i < 46; i++) {
  const x = (rnd() - 0.5) * 19.2, z = (rnd() - 0.5) * 15.2;
  const d = x - z + 5.5;
  if (d > -3 && d < 6 && ok(x, z, 0.5)) put('shell', x, z, { yaw: rnd() * 360, scale: 0.5 + rnd() * 0.5, y: inWater(x, z) ? -0.03 : 0 });
}
// Sea: coral heads, shells and a few stones out in the water.
for (const [x, z] of [[-8.6, 1.8], [-7.4, 6.2], [-9.2, 5.0], [-5.0, 6.8], [-8.0, 3.0]]) if (inWater(x, z)) put('coral', x, z, { yaw: rnd() * 360, y: -0.03, scale: 0.9 });
put('boulder', -9.0, 7.0, { y: -0.03, scale: 0.7 }); put('boulder', -6.4, 7.2, { y: -0.03, scale: 0.6, yaw: 90 });
// Grass tufts and reeds at the back and east.
for (let i = 0; i < 34; i++) {
  const x = (rnd() - 0.5) * 19, z = (rnd() - 0.5) * 15;
  if (ok(x, z, 0.8) && !inWater(x, z) && x - z > -1 && Math.hypot(x - SHIP[0], (z - SHIP[1]) * 0.8) > 4.4) put(rnd() > 0.5 ? 'tall-grass' : 'reeds', x, z, { yaw: rnd() * 360 });
}
// Edge: flags marking the safe route, a lantern at camp.
put('flag', -3.6, 0.2, { yaw: 20 }); put('flag', 7.8, 4.6, { yaw: 200 });
put('lantern', 3.5, -2.9); put('bush', 8.6, -6.2, { yaw: 70 }); put('bush', -9.2, -6.8, { yaw: 10 });
put('fern', 7.2, 0.6); put('fern', -7.6, -3.6); put('bush', 9.0, 6.6);

const idx = places.findIndex((p) => p.asset === 'treasure-chest');
places.splice(idx, 1); // chest only; treasure-chest scale hack removed

// De-sink check: keep only pieces inside the 22 x 18 map.
const out = places.filter((p) => Math.abs(p.at[0]) <= 11 && Math.abs(p.at[2]) <= 9);
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/shipwreck.ts', `// GENERATED by scripts/design-shipwreck.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${out.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of out) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/shipwreck.md', `# Shipwreck map (generated by scripts/design-shipwreck.mjs)

22 m x 18 m: 11 x 9 tiles of 2 m. Sea (sea-water) in the south-west, desert-ground beach elsewhere.

\`\`\`
${glyph.map((r) => '  ' + r.join(' ')).join('\n')}
\`\`\`

Focal object: pirate-ship beached at the waterline (half buried). Zones: cargo spill (east of the hull,
chest, crates, barrels), castaway camp (north-east), surf and coral (south-west). Palms and rocks edge the map.
Notes: missing crab and driftwood pieces; planks and logs stand in for driftwood.

| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${out.length}
`);
console.log('wrote', out.length, JSON.stringify(tally));
