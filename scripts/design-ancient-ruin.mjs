#!/usr/bin/env node
// Ancient ruin map: 10 x 9 tiles of 2 m in a one-tile forest-ground ring.
// Small broken stone plaza with a statue dais and a wide flight; three column clusters; one dark arch;
// moss, ferns, vines and bushes swallow every structure. Cell (c,r): x=(c-5.5)*2, z=(r-5)*2.
import { writeFileSync } from 'node:fs';
const X = (c) => (c - 5.5) * 2, Z = (r) => (r - 5) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
// ground: irregular small stone plaza, rest forest-ground
for (let c = 0; c <= 11; c++) for (let r = 0; r <= 10; r++) {
  const x = X(c), z = Z(r);
  const dx = x / 4.2, dz = (z - 0.6) / 3.6;
  const wob = 0.28 * Math.sin(c * 2.9 + r * 1.7) + 0.2 * Math.cos(c * 1.3 - r * 2.3);
  const inP = c >= 1 && c <= 10 && dx * dx + dz * dz < 1 + wob;
  put(inP ? 'stone-ground' : 'forest-ground', x, z);
}
// statue on a two-slab dais with one wide flight (3 stairs side by side, rise 0.6)
put('stone-ground', 0, -1, { y: 0.3 });
put('stone-ground', 0, -1, { y: 0.6 });
put('statue', 0, -1, { y: 0.6, scale: 0.8 });
for (const dx of [-0.72, 0, 0.72]) put('stairs-stone', dx, 0.48, { scale: 0.6 });
// the one dark arch, north-west, with a column beside it
put('arch', -5.0, -5.6, { scale: 1.4 });
put('column', -3.0, -5.6, { scale: 1.1 });
put('ivy', -3.0, -5.2, { scale: 1.1 });
put('vines', -6.8, -5.2, { yaw: 20, scale: 1.2 });
put('ivy', -5.0, -5.1, { scale: 1.2 });
// cluster A: north-east colonnade
for (const [a, x, z, y, s] of [['column', 4.6, -4.6, 0, 1.2], ['ruin-column', 5.9, -3.9, 40, 1], ['column', 6.8, -5.4, 0, 1.0], ['ruin-column', 4.4, -3.2, 120, 1], ['rubble', 5.6, -5.0, 60, 1], ['rubble', 6.6, -3.4, 200, 1]])
  put(a, x, z, { yaw: y, scale: s });
// cluster B: west fallen colonnade
for (const [a, x, z, y, s] of [['column', -6.8, 0.2, 0, 1.1], ['ruin-column', -6.2, 1.6, 70, 1], ['ruin-column', -7.6, 2.0, 190, 1], ['rubble', -6.9, 1.2, 20, 1], ['rubble', -5.8, -0.4, 140, 1], ['pillar', -7.8, -1.0, 0, 1.2]])
  put(a, x, z, { yaw: y, scale: s });
// cluster C: south-east stumps
for (const [a, x, z, y, s] of [['pillar', 5.6, 3.8, 0, 1.2], ['ruin-column', 6.8, 4.6, 80, 1], ['ruin-column', 4.8, 5.2, 200, 1], ['rubble', 6.0, 4.6, 30, 1], ['rubble', 5.2, 4.2, 250, 1], ['rubble', 7.2, 3.4, 110, 1]])
  put(a, x, z, { yaw: y, scale: s });
// light low walls in two spots
put('broken-wall', 1.8, -5.6, { yaw: 0 });
put('broken-wall', 0.4, 6.0, { yaw: 180, scale: 0.9 });
// tablets and rubble on the plaza
for (const [x, z, a] of [[-2.0, 2.2, 20], [-1.0, 3.0, 100], [2.2, 2.6, 250], [2.8, 1.2, 40]]) put('rune-tablet', x, z, { yaw: a });
put('rune-stone', 2.2, -1.2, { yaw: 200 });
put('rubble', -2.4, -1.4, { yaw: 30 });
put('rubble', 2.6, 3.6, { yaw: 200 });
put('adventurer', 0.4, 3.2, { yaw: 180 });
// trees through the ruin and the edge
const TREES = [
  [-8.6, -3.4, 0.8, 10], [-9.2, 4.6, 0.7, 120], [0.6, -7.4, 0.9, 200], [3.4, -7.8, 0.7, 40], [-1.8, -7.8, 0.7, 300],
  [-7.6, -8.0, 0.8, 90], [8.4, -7.6, 0.8, 150], [9.8, -1.8, 0.7, 250], [9.8, 2.4, 0.8, 20], [9.0, 7.6, 0.8, 70],
  [2.8, 8.4, 0.8, 260], [-2.6, 8.4, 0.7, 120], [-6.4, 8.2, 0.8, 30], [-4.4, -3.4, 0.7, 340], [7.6, 0.4, 0.6, 110],
  [-4.2, 5.6, 0.6, 60], [3.4, 6.6, 0.6, 200], [-9.6, 0.4, 0.8, 180],
];
for (const [x, z, s, a] of TREES) put('oak-tree', x, z, { scale: s, yaw: a });
// dense overgrowth around every structure and the plaza edge
const anchors = [[0, -1, 1.4, 9], [-5, -5.4, 2.0, 9], [5.8, -4.2, 2.0, 11], [-6.9, 1.0, 1.8, 11], [5.9, 4.3, 1.8, 11], [1.8, -5.6, 1.2, 5], [0.4, 6.0, 1.2, 5]];
const kinds = ['moss', 'fern', 'moss-tuft', 'bush', 'tall-grass', 'moss', 'fern'];
let n = 0;
for (const [ax, az, rad, cnt] of anchors) for (let i = 0; i < cnt; i++) {
  const a = i * 2.399 + ax, r = rad * (0.55 + 0.45 * ((i * 37) % 10) / 10);
  const x = ax + Math.cos(a) * r, z = az + Math.sin(a) * r * 0.9;
  if (Math.abs(x) > 9.4 || Math.abs(z) > 8.4) continue;
  if (places.some((p) => !/ground$/.test(p.asset) && !/^(moss|fern|moss-tuft|bush|tall-grass)$/.test(p.asset) && Math.hypot(p.at[0] - x, p.at[2] - z) < 0.55)) continue;
  put(kinds[n++ % kinds.length], x, z, { yaw: (n * 53) % 360 });
}
// plaza-edge ring of moss and tufts, edge dressing
for (let i = 0; i < 26; i++) {
  const a = i * 0.2417, x = Math.cos(a) * 4.4 * (1 + 0.1 * Math.sin(i * 3)), z = 0.6 + Math.sin(a) * 3.9 * (1 + 0.1 * Math.sin(i * 3));
  if (places.some((p) => !/ground$/.test(p.asset) && !/^(moss|fern|moss-tuft|bush|tall-grass)$/.test(p.asset) && Math.hypot(p.at[0] - x, p.at[2] - z) < 0.7)) continue;
  put(['moss', 'moss-tuft', 'fern', 'moss'][i % 4], x, z, { yaw: i * 41 % 360 });
}
const EDGE = [['boulder', -9.0, -6.6], ['boulder', 8.8, 6.8], ['boulder', 9.4, -4.4], ['boulder', -7.6, 7.2], ['bush', -9.0, 1.6], ['bush', 9.0, 4.4], ['bush', 7.4, -7.2], ['bush', -4.4, 7.4], ['bush', 6.2, 7.4], ['bush', -8.6, 6.6],
  ['fern', -8.0, 3.8], ['fern', 8.4, -1.4], ['fern', -3.6, 6.8], ['fern', 1.2, 7.4], ['fern', 8.2, 1.6], ['fern', -1.0, -6.8], ['fern', 3.4, -6.4], ['fern', -8.4, -5.6],
  ['tall-grass', 8.4, 6.2], ['tall-grass', -6.8, 6.0], ['tall-grass', 9.0, -6.0], ['mushroom', -6.6, 4.4], ['mushroom', 7.8, 2.8], ['wildflowers', -2.4, 6.6], ['wildflowers', 4.6, 6.8], ['wildflowers', 2.6, -6.8]];
EDGE.forEach(([a, x, z], i) => put(a, x, z, { yaw: (i * 67) % 360 }));

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/ancient-ruin.ts', `// GENERATED by scripts/design-ancient-ruin.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/ancient-ruin.md', `# Ancient ruin map (generated)

GENERATED by \`scripts/design-ancient-ruin.mjs\`. 10 x 9 tiles of 2 m inside a one-tile forest-ground ring.

Layout: a small irregular stone-ground plaza; a statue on a two-slab dais with a wide three-stair flight;
one dark arch in the north-west; three column-and-rubble clusters (north-east, west, south-east);
moss, ferns, bushes and vines around every structure; oaks and boulders on the edge.

Tally (${places.length} pieces):
${Object.entries(tally).sort().map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
console.log(places.length, 'pieces');
