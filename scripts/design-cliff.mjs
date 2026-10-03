#!/usr/bin/env node
// Cliff overlook map: 11 x 9 tiles of 2 m (22 m x 18 m) plateau at y=0, sheer cliff faces on
// the south, east and west sides, a sunken beach apron at y=-3. Col c 1..11 west->east:
// x=(c-6)*2; row r 1..9 north->south: z=(r-5)*2. Writes scenes/maps/cliff.ts + docs/map-mockups/cliff.md.
import { writeFileSync } from 'node:fs';
const X = (c) => (c - 6) * 2;
const Z = (r) => (r - 5) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  if (!/-(ground|bank|straight)$/.test(asset) && asset !== 'rock-wall' && asset !== 'cliff-face' && asset !== 'bridge' && asset !== 'waterfall-sheet' && asset !== 'stairs-stone' && inStream?.(x, z) && !o.y) return;
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
// path: west edge -> east along r7 -> north on c4 -> east along r4 -> north on c8 to the north edge
const PATH = new Map(['1,6','2,6','4,6','5,6','5,5','6,5','6,4','7,4','7,3','8,3','8,2'].map((k) => [k, ['dirt-ground', 0]]));
// stream: spring at (3,2), flows south down col 3 (x=-6) and falls over the south lip at (3,9)
const RIVER_C = 3, RIVER_R0 = 2;
const inStream = (x, z) => Math.abs(x - X(RIVER_C)) < 1.2 && z > Z(RIVER_R0) - 1.2;
for (let c = 1; c <= 11; c++) for (let r = 1; r <= 9; r++) {
  const p = PATH.get(`${c},${r}`);
  if (c === RIVER_C && r >= RIVER_R0) put(r === RIVER_R0 ? 'river-bank' : 'river-straight', X(c), Z(r));
  else if (p) put(p[0], X(c), Z(r), { yaw: p[1] });
  else {
    const stony = (c >= 9 && r <= 3 && c + (4 - r) > 9) || (c === 10 && r === 2);
    const key = `${c},${r}`;
    const WIDE = [].concat(['3,6', '5,5', '3,5', '5,6', '4,3', '5,3', '6,3', '7,3', '7,5', '9,4', '9,3', '2,6', '3,8', '2,8'].slice(0,0));
    const MEAD = ['6,6', '7,6', '8,7', '9,7', '2,3', '2,4', '10,6', '6,8', '10,8', '6,1', '5,1', '3,2', '10,5'];
    put(stony || WIDE.includes(key) ? 'dirt-ground' : MEAD.includes(key) ? 'meadow-ground' : 'grass-ground', X(c), Z(r));
  }
}
// sunken foot ground (y=-3) south, east, west of the plateau
for (let c = 0; c <= 12; c++) for (let r = 1; r <= 11; r++) {
  const inside = c >= 1 && c <= 11 && r >= 1 && r <= 9;
  if (inside || (Z(r) === 2 && c <= 0) || (r <= 3 && (c === 0 || c === 12) && false)) continue;
  if (r <= 9 && (c === 0 || c === 12) && r < 1) continue;
  put('desert-ground', X(c), Z(r), { y: -3 });
}
// cliff faces (3.06 m tall, 3.5 m wide) base at y=-3, crown just under the lip
const faceY = -3.1;
for (let i = 0; i < 11; i++) put('rock-wall', -10 + i * 2, 9.35, { y: -2.75 });
put('waterfall-sheet', -6, 9.85, { y: -3, scale: 1.15 });
for (let i = 0; i < 9; i++) put('cliff-face', 10.7, -8 + i * 2, { y: faceY, yaw: 90 + (i % 2) * 8 });
for (let i = 0; i < 9; i++) {
  const z = -8 + i * 2;
  if (z === 0 || z === 2 || z === 4) continue;
  put('cliff-face', -10.7, z, { y: faceY, yaw: 270 + (i % 2) * 8 });
}
put('cliff-face', -10.7, -0.5, { y: faceY, yaw: 270 });
put('cliff-face', -10.7, 4.5, { y: faceY, yaw: 278 });
// three flights of stairs down the west cliff (3 x 1 m rise), side walls close the drop
[[-11.8, -1], [-13.4, -2], [-15, -3]].forEach(([x, y]) => put('stairs-stone', x, 2, { y, yaw: 270 }));
for (const x of [-12, -14, -16]) { put('rock-wall', x, 1.0, { y: -3, yaw: 180 }); put('rock-wall', x, 3.0, { y: -3, yaw: 0 }); }
// foot path from the stairs to the map edge, with an exit signpost
for (const x of [-12, -14, -16, -18]) put('footpath-straight', x, 2, { y: -3, yaw: 90 });
for (const x of [-14, -16, -18]) for (const z of [0, 4]) put('desert-ground', x, z, { y: -3 });
put('signpost', -18.6, 0.9, { y: -3, yaw: 90 });
// stream bridge on the path, spring rocks
put('bridge', -6, 2 + 0.0, { yaw: 0, scale: 0.55 });
put('rock-cluster', -6.2, -5.4, { yaw: 40, scale: 0.7 });
for (let i = 0; i < 11; i++) put('cliff-face', -10 + i * 2, -9.2, { y: faceY, yaw: 180 });
// extra warm dressing
[[3.5,-4],[6.8,-3.6],[7.6,-7.2],[9.6,-5.4],[-1.4,4.6],[5.4,2.8],[-7,5.2],[8,5.6],[-5.5,-1.5],[1.2,-2.4]].forEach(([x,z],i)=>put('boulder',x,z,{yaw:i*43,scale:0.55+0.12*(i%3)}));
[[-2,2.6],[2.8,-0.8],[7,2.6],[-8,1.2],[4.6,6],[-0.6,-6.4],[8.8,-1.2],[-6.4,-4.8],[0.4,0.8],[6,-1],[-3.6,6.4],[-9.8,5.8]].forEach(([x,z],i)=>put('wildflowers',x,z,{yaw:i*29+10}));
// lip dressing: boulders and tufts at the south edge, the sheer drop
[[-8, 8.3], [-3.5, 8.5], [2, 8.2], [6.5, 8.6], [9.2, 8.2]].forEach(([x, z], i) => put('boulder', x, z, { yaw: i * 70, scale: 0.8 }));
// zone 1: viewpoint (west-south): bench + signpost facing the sea
put('bench', -8.4, 7.2, { yaw: 0 });
put('signpost', -9.8, 6.6, { yaw: 20 });
put('wildflowers', -4.8, 7.6, { yaw: 30 });
put('wildflowers', -9.6, 7.9, { yaw: 120 });
put('rock-cluster', -3.0, 7.9, { yaw: 60, scale: 0.8 });
// zone 2: lone tree on the north plateau, west of the path bend
put('oak-tree', -3.0, -5.2, { yaw: 30, scale: 1.3 });
put('boulder', -5.2, -3.4, { yaw: 40 });
put('boulder', -1.6, -3.0, { yaw: 100, scale: 0.7 });
put('rock-cluster', -7.6, -6.0, { yaw: 150 });
// zone 3: ruined watch post, north-east
put('broken-wall', 6.2, -6.0, { yaw: 200, scale: 1.1 });
put('broken-wall', 8.2, -4.8, { yaw: 110 });
put('broken-wall', 5.0, -4.4, { yaw: 20, scale: 0.8 });
put('ruin-column', 8.8, -6.8, { yaw: 0 });
put('ruin-column', 4.6, -7.0, { yaw: 60, scale: 0.8 });
put('ruin-column', 7.4, -2.6, { yaw: 120, scale: 0.7 });
put('rock-cluster', 9.2, -2.4, { yaw: 20, scale: 0.8 });
// edge dressing: flowers, bushes, tufts, ferns
const FL = [[-9, 2], [-7.4, 0.6], [-4.4, 2.4], [-1, 1.5], [1.6, 2.6], [3.6, 5.0], [6.2, 6.6], [9, 6.2], [9.4, 1.8], [2.4, -1.4], [-1.2, -7], [2, -7.6], [-9.2, -2.4], [10, -0.8]];
FL.forEach(([x, z], i) => put('wildflowers', x, z, { yaw: i * 47 }));
const BU = [[-10, -7.6], [-8.6, -7.8], [10, -7.8], [-10.2, 4.4], [10.2, 4.0], [0, -8.2], [4.2, -8.0], [-10, 0], [10.2, 0.4]];
BU.forEach(([x, z], i) => put('bush', x, z, { yaw: i * 61, scale: 0.9 }));
const TG = [[-6, 3], [-2.5, 5.6], [0.4, 6], [3.2, 7.2], [6.8, 4.8], [8.8, 3], [-8.6, 3], [-4, -1.2], [0.8, -4.4], [3.6, -3.2], [-6.6, -2], [1.6, 3.6], [-0.6, 3.2], [6.4, 1]];
TG.forEach(([x, z], i) => put('tall-grass', x, z, { yaw: i * 33 }));
const FE = [[-5.6, -7.6], [-2.2, -7.8], [1.2, -5.8], [9.6, 7.8], [-9.8, 8], [5.4, 0], [-3.4, 0.2], [10, 3.4]];
FE.forEach(([x, z], i) => put('fern', x, z, { yaw: i * 80 }));
// foot ground: boulders and bushes at the cliff base
[[-9, 11.6], [-5, 12], [-1.8, 11.7], [3, 12.2], [8, 11.8], [12.6, 6], [13, -2], [-12.8, 5], [-13, -4], [12.8, -8], [-3, -11.8], [4, -12]]
  .forEach(([x, z], i) => put(i % 3 === 2 ? 'rock-cluster' : 'boulder', x, z, { y: -3, yaw: i * 55, scale: i % 3 === 2 ? 0.8 : 0.9 }));
[[-7, 11.6], [5.4, 11.4], [12.4, 3], [-12.6, -1]].forEach(([x, z], i) => put('bush', x, z, { y: -3, yaw: i * 90 }));
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/cliff.ts', `// GENERATED by scripts/design-cliff.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/cliff.md', `# Cliff overlook (generated by scripts/design-cliff.mjs)

22 m x 18 m grass plateau (11 x 9 tiles, top y=0) ending in sheer cliff faces on the south, east and
west sides, over a sunken ground ring at y=-3. A worn path enters at the west edge, bends north, runs east
and exits north. Zones: viewpoint (bench, signpost, SW), lone oak (N-center), ruined watch post (NE).

${Object.entries(tally).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Total: ${places.length}. Stream: spring at the north end of col 3, bridge on the path, waterfall over the south lip. Entry: west stairs (3 flights) and a foot path to the map edge.
`);
console.log(places.length, 'pieces');
