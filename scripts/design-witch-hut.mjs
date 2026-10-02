#!/usr/bin/env node
// Witch hut map designer: swampy clearing, 16 m x 14 m core inside a marsh-ground ring.
// Grid: 10 x 9 tiles of 2 m. Tile center x = (c-4.5)*2, z = (r-4)*2 (c 0..9, r 0..8).
// +X east, -Z north. Anchor: docs/map-mockups/witch-hut.jpg.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
// seeded random for edge dressing
let s = 7;
const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

// --- ground: marsh-ground everywhere, lantern path (cobble footpath) from the south edge to the hut door
const PATH = new Map([
  ['5,8', ['footpath-straight', 0]], ['5,7', ['footpath-straight', 0]], ['5,6', ['footpath-straight', 0]],
  ['5,5', ['footpath-corner', 180]], ['4,5', ['footpath-corner', 0]], ['4,4', ['footpath-straight', 0]],
  ['4,3', ['footpath-straight', 0]],
]);
// corner mouths at yaw 0 are {N,E}; yaw 180 = {S,W}. 5,5 joins south(5,6) and west(4,5); 4,5 joins east and north.
for (let c = 0; c <= 9; c++)
  for (let r = 0; r <= 8; r++) {
    const x = (c - 4.5) * 2, z = (r - 4) * 2;
    const pa = PATH.get(`${c},${r}`);
    if (pa) put(pa[0], x, z, { yaw: pa[1] });
    else put('forest-ground', x, z);
  }

// --- focal: the hut. Door faces +Z at the head of the path (path column x=-1, z -> -2).
const HUT = [-1, -5.0];
put('cabin', HUT[0], HUT[1], { scale: 1.3, yaw: 6 });
put('witch-broom', 1.5, -2.6, { yaw: 20 });
put('lantern', -3.0, -2.5);
put('herb-drying-rack', 2.6, -2.4);
put('herb-drying-rack', -3.8, -5.8, { yaw: 90 });
// cauldron yard (west): fire ring of rocks, cauldron, firewood, bucket, barrel, the witch
put('cauldron', -5.3, -1.6, { scale: 1.5 });
put('campfire', -4.0, -1.0, { scale: 1.4 });
put('campfire-out', -6.4, -0.6, { scale: 0.8 });
put('puddle', -6.0, 0.0, { scale: 0.8 });
put('table', -3.3, -3.6, { yaw: 10 });
put('witch-potion', -3.45, -3.6, { y: 0.6, scale: 0.7 });
put('bottle', -3.2, -3.5, { y: 0.6, scale: 0.7 });
put('vial', -3.3, -3.8, { y: 0.6, scale: 0.7 });
for (let i = 0; i < 5; i++) {
  const a = i * 1.2566 + 0.3;
  put('rock-cluster', -5.0 + Math.cos(a) * 0.95, -1.4 + Math.sin(a) * 0.95, { yaw: i * 70, scale: 0.55 });
}
put('firewood', -6.6, -2.8, { yaw: 30 });
put('bucket', -3.6, -0.6, { yaw: 100 });
put('barrel', -2.5, -3.9, { yaw: 20 });
put('witch', -3.6, 0.7, { yaw: 220 });
put('witch-broom', -6.5, -0.2, { yaw: 80 });
put('stump', -6.8, 0.9, { yaw: 0 });
put('log', -7.0, -4.4, { yaw: 70 });
// herb garden (east): beds in rows inside a fence, racks behind
put('garden-bed', 4.2, -0.6);
put('garden-bed', 4.2, 1.2);
put('garden-bed', 6.8, -0.6);
put('garden-bed', 6.8, 1.2);
put('herb-drying-rack', 3.2, -3.4, { yaw: 0 });
put('herb-drying-rack', 5.2, -3.4, { yaw: 0 });
put('herb-drying-rack', 7.0, -3.4, { yaw: 0 });
put('pumpkin', 5.5, 2.5, { yaw: 40 });
put('pumpkin', 6.3, 2.7, { yaw: 120, scale: 0.8 });
put('herb-root', 3.2, 2.0, { yaw: 10 });
put('wildflowers', 7.6, 2.0);
put('wildflowers', 3.1, -1.8, { yaw: 70 });
put('pumpkin', 7.4, 3.4, { yaw: 200 });
// garden fence: south side and east side, with gap near the path
for (const x of [3.0, 4.94, 6.88]) put('fence', x, 4.0, { yaw: 0 });
for (const z of [-2.0, 0.0, 2.0]) put('fence', 7.95, z, { yaw: 90 });
put('fence', 7.95, 3.94, { yaw: 90 });
// cage and bone corner (south-west)
put('cage', -6.2, 4.4, { yaw: 15 });
put('cage', -4.4, 5.4, { yaw: 340 });
put('bone-pile', -5.4, 3.4, { yaw: 40 });
put('bone-pile', -3.4, 3.9, { yaw: 200, scale: 1.2 });
put('bone-pile', -7.0, 5.9, { yaw: 120 });
put('dead-tree', -7.4, 3.2, { yaw: 60, scale: 0.9 });
put('red-mushroom', -2.6, 5.6, { yaw: 30 });
put('mushroom-cluster', -2.2, 5.1, { yaw: 100 });
put('mushroom-cluster', -4.0, 6.5, { yaw: 160 });
// lantern path: lanterns line the path in pairs
for (const [x, z] of [[2.7, 6.6], [-0.7, 6.6], [2.7, 3.8], [-0.7, 3.8], [-2.7, 0.8], [0.7, 0.8], [-2.7, -1.6], [0.7, -1.6]]) put('lantern', x, z, {});
// bog: pond, reeds, cattails, willows (south-east and north)
put('pond', 4.6, 6.0, { scale: 1.1 });
put('reeds', 3.0, 6.9, { yaw: 20 });
put('reeds', 6.2, 5.2, { yaw: 100 });
put('cattails', 6.4, 6.9, { yaw: 60 });
put('cattails', 2.6, 5.6, { yaw: 200 });
put('stepping-stone', 1.1, 7.0, { scale: 0.3 });
put('willow-tree', 7.4, 6.4, { yaw: 20, scale: 1.0 });
put('willow-tree', -7.2, -6.2, { yaw: 120, scale: 1.1 });
put('dead-tree', 3.0, -6.6, { yaw: 200 });
put('dead-tree', 7.2, -6.2, { yaw: 300, scale: 1.1 });
put('dead-tree', 3.8, 7.6, { yaw: 100, scale: 0.9 });
put('dead-tree', -2.0, -6.7, { yaw: 30, scale: 0.8 });
put('bush', 1.2, -6.8, { yaw: 40 });
put('fern', 2.0, -1.6, { yaw: 40 });
put('fern', -2.4, -2.0, { yaw: 120 });
put('fern', 0.4, -1.8, { yaw: 220 });
put('fern', 2.4, 4.4, { yaw: 300 });
put('wildflowers', -0.4, 1.4, { yaw: 30 });
put('red-mushroom', 1.8, -2.6, { yaw: 70 });
put('red-mushroom', -3.0, -5.2, { yaw: 10 });
// outer ring dressing (the 1 m rim of each side) — fence on the north and west rims, scattered reeds/ferns
for (let i = 0; i < 9; i++) put('fence', -7.7 + i * 1.94, -7.7, { yaw: 0 });
for (let i = 0; i < 3; i++) put('fence', -7.95, -5.8 + i * 1.94 + 2.5, { yaw: 90 });
const ring = ['fern', 'reeds', 'cattails', 'bush', 'tall-grass', 'mushroom-cluster'];
const near = (x, z) => places.some((p) => !p.asset.includes('ground') && !p.asset.startsWith('footpath') && Math.hypot(p.at[0] - x, p.at[2] - z) < 0.9)
  || (x > -4.6 && x < 2.6 && z > -7.4 && z < -1.8)
  || (Math.abs(x - 0) < 2.6 && z > -2.2 && z < 8) ;
let tries = 0, n = 0;
while (n < 34 && tries++ < 600) {
  const x = -8.6 + rnd() * 17.2, z = -7.6 + rnd() * 15.2;
  const edge = Math.abs(x) > 7.0 || Math.abs(z) > 6.2;
  if (!edge || near(x, z)) continue;
  put(ring[n % ring.length], x, z, { yaw: Math.floor(rnd() * 360) });
  n++;
}
// scattered stones on the lantern path edge
for (const [x, z] of [[-0.4, 4.9], [2.4, 2.4], [-2.3, 2.3], [2.5, 5.1]]) put('rock-cluster', x, z, { scale: 0.4, yaw: x * 50 });

// --- tally + docs
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/witch-hut.ts', `// GENERATED by scripts/design-witch-hut.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
writeFileSync('docs/map-mockups/witch-hut.md', `# Witch hut map (generated)

GENERATED by \`scripts/design-witch-hut.mjs\`. 10 x 9 marsh-ground tiles of 2 m (20 x 18 m) around a 16 x 14 m clearing.

## Layout
- Focal: the hut at the north, door facing south at the head of a cobble lantern path that bends in from the south edge.
- West: cauldron yard (cauldron in a ring of stones, firewood, barrel, bucket, the witch, broom).
- East: fenced herb garden (4 beds, 3 drying racks, pumpkins).
- South-west: cage and bone corner with a dead tree and mushrooms.
- South-east: bog with pond, reeds, willow. Fence on north and west rims, dead trees at the edge.

## Tally (${places.length} pieces)
${Object.entries(tally).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
console.log(`witch-hut: ${places.length} pieces`);
console.log(Object.entries(tally).map(([k, v]) => `${k}:${v}`).join(' '));
