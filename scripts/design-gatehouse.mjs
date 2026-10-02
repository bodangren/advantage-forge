#!/usr/bin/env node
// Castle gatehouse map (20 m x 14 m). Writes scenes/maps/gatehouse.ts and docs/map-mockups/gatehouse.md.
// Grid: 10 cols x 7 rows of 2 m. col c=1..10 -> x=(c-5.5)*2; row r=1..7 -> z=(r-4)*2.
// Rows: r1,r2 courtyard cobble (z -6,-4, wall on z=-4), r3 moat (z=-2), r4..r7 grass bank (z 0..6) with cobble road at x=0/2.
import { writeFileSync } from 'node:fs';
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const X = (c) => (c - 5.5) * 2, Z = (r) => (r - 4) * 2;
// everything on an even grid, x -10..10 (tiles span -11..11), walls stand on the outer ring
for (let x = -10; x <= 10; x += 2) {
  for (const z of [-6, -4]) put('cobble-floor', x, z);
  put('river-straight', x, -2, { yaw: 90 });
  for (const z of [0, 2, 4, 6]) {
    const paved = Math.abs(x) <= 2 || (z === 0 && Math.abs(x) <= 6);
    put(paved ? 'cobble-floor' : 'grass-ground', x, z);
  }
}
// castle
put('wall-gate', 0, -4);
for (const x of [-4, 4, -8, 8]) put('city-wall', x, -4);
put('tower', -3.3, -4.1, { yaw: 0 });
put('tower', 3.3, -4.1, { yaw: 0 });
put('rampart', -9.7, -4, { yaw: 0 });
put('rampart', 9.7, -4, { yaw: 0 });
// back wall and side walls
for (const x of [-8, -4, 0, 4, 8]) put('city-wall', x, -6.6, { yaw: 180 });
put('city-wall', -10.6, -5, { yaw: 270 });
put('city-wall', 10.6, -5, { yaw: 90 });
for (const z of [-1, 3]) put('city-wall', 10.6, z, { yaw: 90 });
// near (west and south) sides: low wall parapet so the camera sees in
for (const z of [-2, 0, 2, 4, 6]) put('wall', -10.6, z, { yaw: 90 });
for (const x of [-9, -7, -5, -3, 3, 5, 7, 9]) put('wall', x, 6.6);
put('wall', 10.6, 6, { yaw: 90 });
// drawbridge over the moat
put('bridge', 0, -1.55, { yaw: 90 });
// banners and flags at the gate
put('banner', -1.7, -2.9, { scale: 0.9 });
put('banner', 1.7, -2.9, { scale: 0.9 });
put('flag', -6, 0.6);
put('flag', 6, 0.6);
put('torch-sconce', -2.3, 0.8);
put('torch-sconce', 2.3, 0.8);
// guards at the bridge head, courtyard
put('guard', -1.3, 0.9, { yaw: 0 });
put('guard', 1.3, 0.9, { yaw: 0 });
put('guard', 1.2, -4.9, { yaw: 180 });
put('guard', -1.2, -4.9, { yaw: 180 });
put('knight', 0, -5.8, { yaw: 180, scale: 0.9 });
// guard post story (east bank)
put('guard-post', 5.5, 2.5, { yaw: 0 });
put('barrel', 4.3, 1.5);
put('guard-post', -5.5, 2.5, { yaw: 0 });
put('barrel', -4.2, 1.5, { yaw: 40 });
put('crate', -6.9, 1.8, { yaw: 10 });
put('guard', -4.2, 3.2, { yaw: 20 });
put('banner', -2.6, 4.4, { scale: 0.9 });
put('banner', 2.6, 4.4, { scale: 0.9 });
put('torch', -2.2, -2.7);
put('torch', 2.2, -2.7);
put('crate', 6.8, 1.6, { yaw: 20 });
put('hay-bale', 7.3, 3.5, { yaw: 60 });
put('signpost', 2.6, 3.4, { yaw: 160 });
// barracks yard (west courtyard)
put('barrel', -7.5, -6.1);
put('barrel', -6.6, -6.2, { scale: 0.9 });
put('crate', -8.3, -5.5, { yaw: 25 });
put('crate', -6.5, -5.0, { yaw: 70, scale: 0.8 });
put('tent', -5.9, -5.9, { yaw: 0, scale: 0.8 });
put('campfire', 6.3, -5.6);
put('hay-bale', 7.8, -5.9, { yaw: 30 });
put('lantern', -2.4, -5.3);
put('lantern', 2.4, -5.3);
// west bank dressing: orchard-less field edge
put('boulder', -6.4, 1.0, { yaw: 40 });
put('rock-cluster', -7.8, 2.4, { yaw: 120 });
put('wildflowers', -5, 3.6);
put('wildflowers', -3.2, 5, { yaw: 100 });
put('tall-grass', -7, 4.2);
put('tall-grass', -4.6, 5.6, { yaw: 90 });
put('tall-grass', 4.6, 5.4, { yaw: 40 });
put('wildflowers', 3.8, 4.5, { yaw: 200 });
// moat rocks (in and along the water)
for (const [x, z, y, s] of [[-5.5, -2, -0.05, 1], [-3.8, -1.6, -0.05, 0.8], [4.2, -2.2, -0.05, 0.9], [6.4, -1.9, -0.05, 1], [-7.9, -2.1, -0.05, 0.8], [8, -2, -0.05, 0.8]]) put('rock-cluster', x, z, { y, yaw: x * 20, scale: s });
for (const [x, z] of [[-9.2, 0.5], [-7.4, 0.6], [-5.2, 0.5], [-3.6, 0.7], [3.6, 0.7], [5.4, 0.5], [7.3, 0.6], [9.2, 0.5]]) put(x % 2 ? 'boulder' : 'rock-cluster', x, z, { yaw: x * 31, scale: 0.85 });
put('reeds', -8.8, -0.6, { yaw: 15 });
put('reeds', 8.6, -0.6, { yaw: 160 });
put('reeds', -2.8, -0.4, { yaw: 60 });
put('reeds', 2.8, -0.4, { yaw: 220 });
// bushes: edge dressing
for (const [x, z] of [[-9.2, 3.4], [-8.6, 1.6], [-6.8, 5.6], [-2.8, 5.6], [-1.6, 5.6], [1.6, 5.6], [2.8, 5.6], [6.8, 5.6], [9.2, 3.4], [9.0, 1.6], [-8.6, -6], [8.8, -3]]) put('bush', x, z, { yaw: x * 37, scale: 0.85 });

// ASCII map
const rows = [];
for (let r = 0; r < 14; r++) rows.push(Array(20).fill('.'));
const mark = (x, z, g) => { const c = Math.floor(x + 10), r = Math.floor(z + 7); if (c >= 0 && c < 20 && r >= 0 && r < 14) rows[r][c] = g; };
for (let c = -10; c < 10; c++) mark(c + 0.5, -2, '~');
for (let c = -10; c < 10; c++) mark(c + 0.5, -4, '#');
for (let z = 0; z < 7; z++) mark(0, z, '=');
mark(0, -1.5, 'B'); mark(0, -4, 'G'); mark(-3.3, -4, 'T'); mark(3.3, -4, 'T'); mark(5.5, 2.5, 'P');
const art = rows.map((r) => '  ' + r.join('')).join('\n');
console.log(art);
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `    { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${num(p.yaw % 360)}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/gatehouse.ts', `// GENERATED by scripts/design-gatehouse.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/gatehouse.md', `# Gatehouse map (generated by scripts/design-gatehouse.mjs)

20 m x 14 m. Cobble courtyard north (z -7..-3), city wall with wall-gate and two towers on z=-4, moat (river-straight) on z=-2, drawbridge, grass bank south with a cobble road, guards, a guard post and barracks yard.

\`\`\`
${art}
\`\`\`
~ moat  # wall  G gate  T tower  B bridge  = road  P guard post

| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length} placements.
`);
console.log('wrote', places.length);
