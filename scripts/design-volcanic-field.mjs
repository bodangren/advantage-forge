#!/usr/bin/env node
// Volcanic field map designer. Grid 12 x 10 tiles of 2 m (24 x 20 m).
// Cell (c,r): x = (c-6.5)*2, z = (r-5.5)*2. +X east, -Z north.
// Lava: column c6 (N-S stream) and row r4 (W-E stream) crossing at (6,4); a stone
// island with the obsidian altar sits at the cross. Path: west edge along r7, bridge over c6, east edge.
import { writeFileSync } from 'node:fs';
const X = (c) => (c - 6.5) * 2, Z = (r) => (r - 5.5) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const isLava = (c, r) => (c === 6 && r !== 4 + 0 * 1) || (r === 4 && c !== 6);
const glyph = Array.from({ length: 10 }, () => Array(12).fill('.'));
const LAVA = new Set(['7,1','7,2','7,3','6,3','6,4','5,4','4,4','4,3','3,3','3,4','2,3','1,3','2,2','7,4','8,4','8,5','9,5','10,5','10,4','11,4','12,4','6,6','6,7','6,8','5,8','5,9','5,10','6,9']);
for (let c = 1; c <= 12; c++) for (let r = 1; r <= 10; r++) {
  if (LAVA.has(c + ',' + r)) { put('lava-ground', X(c), Z(r)); glyph[r - 1][c - 1] = '~'; }
  else put(c === 6 && r === 5 ? 'stone-ground' : 'ash-ground', X(c), Z(r));
}
// island tile (6,5) is stone; bridge over c6 at r7 (z=3)
put('bridge', X(6), Z(7), { yaw: 0 }); glyph[6][5] = '=';
put('altar', X(6), Z(5) - 0.2, { yaw: 0, scale: 1.2 }); put('brazier', X(6), Z(5) - 0.2, { y: 1.2, scale: 2.2 });
put('brazier', X(6) - 0.7, Z(5) + 0.5); put('brazier', X(6) + 0.7, Z(5) + 0.5);
// path markers (coal, bone) along r7
for (const c of [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]) glyph[6][c - 1] = '=';
// smoking cones (lava-rock + stalagmite + smoke)
const rocks = [[-8, -7, 1.5], [-5.5, -8, 1.2], [-9.5, -3.6, 1.3], [7.5, -7.8, 1.4], [10, -6, 1.2], [4, -3.8, 1.1], [-3.8, -4.6, 1.0], [9.5, 6, 1.2], [-9.5, 7.5, 1.1], [3, 8.2, 1.0], [-3, 8.5, 1.2], [6.5, 3.8, 0.9]];
rocks.forEach(([x, z, s], i) => put('lava-rock', x, z, { yaw: i * 47 % 360, scale: s }));
const stal = [[-7, -8.4], [-9.2, -5.5], [9.2, -8.5], [10.6, -3.4], [8.2, 8.6], [-7, 8.8], [-10.8, 2.6], [11, 9.2], [1.6, -8.6], [-1.8, -2.8], [2.4, -2.5]];
stal.forEach(([x, z], i) => put('stalagmite', x, z, { yaw: i * 71 % 360, scale: 0.8 + (i % 3) * 0.25 }));
// smoking cone piles: big lava-rock with stalagmite spires around
[[-8, -7], [8, -7.5], [-9.5, 6.5], [9, 7.5], [-3.5, -7.5]].forEach(([x, z], i) => { put('lava-rock', x, z, { yaw: i * 70, scale: 2.4 }); put('lava-rock', x + 1.1, z + 0.8, { yaw: i * 33, scale: 1.4 }); put('stalagmite', x - 0.5, z - 0.3, { yaw: i * 50, scale: 1.6 }); put('stalagmite', x + 0.3, z + 1.2, { yaw: i * 20, scale: 1.1 }); });
// charred trees
const trees = [[-10.6, -7.6, 0.55], [-3.2, -8.8, 0.5], [5.5, -8.8, 0.6], [11, -7.6, 0.5], [11, 2.4, 0.55], [-11, 5.5, 0.5], [-5.5, 8.9, 0.55], [5.5, 8.9, 0.5], [-8.5, 0.8, 0.45], [9, 0.8, 0.5], [3, 5.2, 0.4], [-3.4, 5.2, 0.45]];
trees.forEach(([x, z, s], i) => put('dead-tree', x, z, { yaw: i * 53 % 360, scale: s }));
// boulders / rock clusters
const bo = [[-6.2, -1.6], [-3.4, 1.3], [3.8, 0.7], [7.4, 1.6], [6.2, -2.2], [-8.4, 3.6], [8.2, 4.8], [-1.6, 9], [0.8, 6.6], [-10.2, -9], [10.6, 0.3], [-6.8, 5.1], [4.9, -6.2], [-4.6, -6.6], [1.5, -6]];
bo.forEach(([x, z], i) => put(i % 2 ? 'lava-rock' : 'rubble', x, z, { yaw: i * 67 % 360, scale: 0.6 + (i % 3) * 0.15 }));
// braziers (flame lights) on plateaus
[[-4.6, -2.8], [5.4, -4.4], [-6.4, 6.6], [7, 6.4], [-1.6, -7.2], [2.8, 1.8]].forEach(([x, z]) => put('brazier', x, z, { scale: 0.9 }));
// dressing: coal, rubble, bone, scale, little rocks
const dress = ['coal', 'rubble', 'coal', 'bone-pile', 'dragon-scale', 'coal', 'rubble', 'dragon-scale'];
let n = 0;
for (let i = 0; i < 70; i++) {
  const x = ((Math.sin(i * 12.9898) * 43758.5) % 1) * 11.4, z = ((Math.sin(i * 78.233 + 3) * 24634.6) % 1) * 9.4;
  const c = Math.round(x / 2 + 6.5), r = Math.round(z / 2 + 5.5);
  if (c < 1 || c > 12 || r < 1 || r > 10) continue;
  if ((c === 6) || (r === 4) || r === 7 || (Math.abs(x) < 1.4 && Math.abs(z) < 1.4)) continue; // lava, path, altar
  if (Math.abs(x - X(6)) < 1.3 && Math.abs(z - Z(5)) < 1.6) continue;
  put(dress[n++ % dress.length], x, z, { yaw: (i * 41) % 360, scale: 0.9 + (i % 3) * 0.2 });
}
// path-side dressing: coal lining the road
for (const x of [-9.4, -6.4, -3.4, 4.6, 7.6, 10.4]) { put('coal', x, 2.2, { yaw: x * 20 }); put('coal', x + 0.8, 4.2, { yaw: x * 33 }); }
for (const x of [-10, -5, 4.2, 9]) put('dragon-scale', x, 2.1, { yaw: x * 15 });
// extra tile-edge rocks
for (let i = 0; i < 24; i++) { const a = i / 24; const side = i % 4; const x = side < 2 ? -11.4 + a * 22.8 : (side === 2 ? -11.5 : 11.5), z = side < 2 ? (side ? 9.5 : -9.5) : -9 + a * 18;
  put(i % 2 ? 'rubble' : 'coal', x, z, { yaw: i * 29, scale: 0.8 }); }
console.log(glyph.map((r) => r.join(' ')).join('\n'));
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${Math.round(p.yaw)}` : ''}${p.scale ? `, scale: ${num(p.scale)}` : ''} },`;
writeFileSync('scenes/maps/volcanic-field.ts', `// GENERATED by scripts/design-volcanic-field.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {}; for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/volcanic-field.md', `# Volcanic field - map plan (generated)

GENERATED by scripts/design-volcanic-field.mjs. 12 x 10 tiles of 2 m (24 x 20 m); x = (c-6.5)*2, z = (r-5.5)*2.

\`\`\`
${glyph.map((r) => r.join(' ')).join('\n')}
\`\`\`

~ lava (lava-ground tiles), = path (west to east along row 7, bridge over the N-S stream), . ash plain (stone-ground).

Layout: two lava streams cross in the middle. The obsidian altar stands on the stone island south of the crossing,
flanked by braziers. The enemy path runs west edge to east edge and crosses the stream on the bridge.
Smoking lava-rock cones and stalagmites fill the north, charred dead trees ring the edge, coal and scales dress the path.

| component | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log('wrote', places.length, JSON.stringify(tally));
