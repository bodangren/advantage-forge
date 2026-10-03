#!/usr/bin/env node
// Island map designer. Grid 11 x 9 tiles of 2 m (22 x 18 m). Sand ring, grass hills, lagoon SW.
// Writes scenes/maps/island.ts and docs/map-mockups/island.md.
import { writeFileSync } from 'node:fs';
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const r2 = (a, b) => a + (b - a) * rnd();
const yawr = () => Math.round(r2(0, 359));
const cols = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
const rows = [-8, -6, -4, -2, 0, 2, 4, 6, 8];
const HY = 1.3;
const land = (x, z) => (x / 10.6) ** 2 + (z / 8.6) ** 2 <= 1.0;
const lagoon = (x, z) => (x >= -6 && x <= 0 && z >= 2 && z <= 4) || (x >= -8 && x <= -4 && z === 4);
const hill = (x, z) => (z >= -6 && z <= -4 && x >= -6 && x <= 4) || (z === -2 && x >= -6 && x <= 2) || (z === -6 && x === 6);
const H = (x, z) => (land(x, z) && !lagoon(x, z) && hill(x, z) ? HY : 0);
const glyph = [];
for (const z of rows) {
  let row = '';
  for (const x of cols) {
    if (lagoon(x, z) || !land(x, z)) { put('sea-water', x, z); row += '~'; }
    else if (H(x, z)) { put('grass-ground', x, z, { y: HY }); row += '^'; }
    else { put('desert-ground', x, z); row += '.'; }
  }
  glyph.push(row);
}
// rock-wall faces on every dropping edge (wall 2.6 m tall, top at the hill top)
const GAP = (x, z, t) => x === 0 && z === -2 && t === 's';
for (const z of rows) for (const x of cols) {
  if (!H(x, z)) continue;
  for (const [dx, dz, yaw, t] of [[0, 2, 0, 's'], [0, -2, 180, 'n'], [2, 0, 90, 'e'], [-2, 0, 270, 'w']]) {
    if (H(x + dx, z + dz) || GAP(x, z, t)) continue;
    put('rock-wall', x + dx / 2 + Math.sign(dx) * 0.4, z + dz / 2 + Math.sign(dz) * 0.4, { yaw, y: HY - 2.6 });
  }
}
// stair (two side-by-side, three flights of 0.43 rise) up the south face at x=0
for (const sx of [-0.5, 0.5]) for (let k = 0; k < 3; k++) put('stairs-stone', sx, -1 + 0.35 + (2 - k) * 0.69, { y: k * 0.43, scale: 0.43 });
// ---- hill: hut, palms, bushes, flowers
put('hut', -0.6, -5.4, { yaw: 10, y: HY });
for (const [x, z, s, y] of [[-3.8, -4.4, 1.15, 200], [-5.6, -5.6, 1.0, 30], [3.2, -5.4, 1.05, 140], [-5.8, -1.8, 0.95, 90], [1.8, -2.4, 0.9, 260], [6.0, -6.0, 1.0, 20]]) put('palm-tree', x, z, { yaw: y, scale: s, y: HY });
for (let i = 0; i < 16; i++) { const x = r2(-6.6, 4.6), z = r2(-6.8, -1.6); if (H(Math.round(x / 2) * 2, Math.round(z / 2) * 2) && !(Math.abs(x + 0.6) < 1.4 && Math.abs(z + 5.4) < 1.4) && !(Math.abs(x) < 1.4 && z > -2.6)) put(i % 3 ? 'bush' : 'wildflowers', x, z, { yaw: yawr(), scale: r2(0.7, 1.0), y: HY }); }
put('rock-cluster', 4.2, -6.6, { yaw: 40, y: HY }); put('boulder', -6.8, -3.4, { yaw: 70, y: HY, scale: 0.9 });
put('torch', 0.6, -3.2, { y: HY }); put('barrel', 1.4, -6.4, { y: HY, yaw: 20 }); put('crate', 2.2, -6.6, { y: HY, yaw: 50, scale: 0.8 });
put('villager', -1.8, -3.4, { yaw: 160, y: HY });
// ---- camp (east sand)
put('campfire', 4.4, 1.2, { scale: 1.3 });
put('fallen-log', 3.2, 2.0, { yaw: 100 });
put('fallen-log', 5.8, 1.6, { yaw: 20, scale: 0.8 });
put('tent', 3.4, -1.4, { yaw: 160, scale: 0.75 });
put('barrel', 6.2, 0.0, { yaw: 40 }); put('crate', 6.3, 0.8, { yaw: 25, scale: 0.8 }); put('sack', 5.4, -0.4, { yaw: 60 });
put('farmer', 5.0, 2.4, { yaw: 300 }); put('blacksmith', 3.0, 0.4, { yaw: 100 });
put('palm-tree', 7.8, 2.2, { yaw: 300, scale: 0.9 }); put('palm-tree', 6.8, 4.4, { yaw: 100, scale: 0.85 });
// ---- treasure (south-east sand)
put('chest', 1.8, 4.8, { yaw: 200, scale: 0.8 }); put('shell', 0.6, 4.4, { yaw: 40 }); put('signpost', 3.0, 4.6, { yaw: 160, scale: 0.8 });
put('villager', 0.8, 5.6, { yaw: 20 });
// ---- dock, rowboat, net, coral in the lagoon
put('dock', -3.0, 2.4, { yaw: 90, scale: 0.85 });
put('rowboat', -2.6, 3.7, { yaw: 100, y: -0.03, scale: 0.9 });
put('fishing-net', -1.2, 1.6, { yaw: 180 });
put('coral-reef-cluster', -5.4, 3.0, { y: -0.03, scale: 0.8 }); put('coral-reef-cluster', -6.8, 4.4, { y: -0.03, yaw: 90, scale: 0.7 });
put('coral-reef-cluster', -0.6, 4.4, { y: -0.03, yaw: 200, scale: 0.7 });
put('shipwreck-hull', 8.6, -0.03, 6.8, {}); places.pop(); put('shipwreck-hull', 8.2, 6.2, { y: -0.03, yaw: 120, scale: 0.55 });
put('lighthouse', -8.4, -3.4, { scale: 0.7 });
// ---- coast ring: palms, rocks, dunes, shallows coral
const inHill = (x, z) => H(Math.round(x / 2) * 2, Math.round(z / 2) * 2) > 0;
for (let i = 0; i < 90; i++) {
  const a = (i / 90) * Math.PI * 2 + r2(-0.02, 0.02);
  const j = r2(0.0, 0.05);
  const x = Math.cos(a) * 10.4 * (1 + j), z = Math.sin(a) * 8.4 * (1 + j);
  const xi = x * 0.9, zi = z * 0.9, k = i % 6;
  if (k === 0) put('boulder', x, z, { yaw: yawr(), scale: r2(0.8, 1.3), y: -0.03 });
  else if (k === 1) put('rock-cluster', x, z, { yaw: yawr(), scale: r2(0.7, 1.0), y: -0.03 });
  else if (k === 2 && land(xi, zi) && !inHill(xi, zi) && !lagoon(Math.round(xi / 2) * 2, Math.round(zi / 2) * 2)) put('palm-tree', xi, zi, { yaw: yawr(), scale: r2(0.8, 1.0) });
  else if (k === 3) put('coral-reef-cluster', x * 1.03, z * 1.03, { yaw: yawr(), scale: r2(0.45, 0.65), y: -0.03 });
  else if (k === 4) put('sand-dune', xi, zi, { yaw: yawr(), scale: r2(0.5, 0.7) });
  else put('river-rock', x, z, { yaw: yawr(), y: -0.03 });
}
for (let i = 0; i < 18; i++) { const a = r2(0, 6.283), rd = r2(0.5, 0.88); const x = Math.cos(a) * 10 * rd, z = Math.sin(a) * 8 * rd; if (land(x, z) && !inHill(x, z) && !lagoon(Math.round(x / 2) * 2, Math.round(z / 2) * 2) && Math.hypot(x - 4.4, z - 1.2) > 2) put(i % 3 ? 'sand-dune' : 'bush', x, z, { yaw: yawr(), scale: i % 3 ? r2(0.5, 0.8) : 0.7 }); }
for (let i = 0; i < 16; i++) { const a = r2(0, 6.283), rd = r2(0.5, 0.85); const x = Math.cos(a) * 9.6 * rd, z = Math.sin(a) * 7.6 * rd; if (land(x, z) && !inHill(x, z) && !lagoon(Math.round(x / 2) * 2, Math.round(z / 2) * 2)) put('wildflowers', x, z, { yaw: yawr() }); }
for (let i = 0; i < 12; i++) { const x = r2(-7, 8), z = r2(0.2, 6); if (land(x, z) && !lagoon(Math.round(x / 2) * 2, Math.round(z / 2) * 2) && !(x > -6.4 && x < 0.4 && z > 1.6 && z < 4.4)) put('shell', x, z, { yaw: yawr(), scale: 0.8 }); }
const ok = (p) => land(p.at[0], p.at[2]) || ['boulder', 'rock-cluster', 'river-rock', 'coral-reef-cluster', 'sea-water', 'rowboat', 'shipwreck-hull', 'lighthouse', 'rock-wall'].includes(p.asset);

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `    { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/island.ts', `// GENERATED by scripts/design-island.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/island.md', `# Island (generated)

GENERATED by scripts/design-island.mjs. 22 x 18 m (11 x 9 tiles). Sand (desert-ground) ring, grass hills (north and west),
raised grass hill (y=1.3) held by rock-wall faces with a stair, sand ring at y=0, SW lagoon with dock and rowboat, shipwreck east;
hut on the hill, campfire east, chest south-east. Coast hidden by palms, rocks, dunes and coral.

\`\`\`
${glyph.join('\n')}
\`\`\`

| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log(glyph.join('\n'), '\n', places.length, JSON.stringify(tally));
for (const p of places) if (!ok(p)) console.log('OUT', p.asset, p.at);
