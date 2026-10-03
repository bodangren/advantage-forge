#!/usr/bin/env node
// Crystal cave map designer: 16 m x 14 m (8 x 7 tiles of 2 m). Rock-boulder rim, cave mouth in the
// south-west, winding cobble path to a giant-crystal grotto in the north, glowing pool in the east.
// Writes scenes/maps/crystal-cave.ts and docs/map-mockups/crystal-cave.md.
import { writeFileSync } from 'node:fs';

const places = [];
const boxes = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const hit = (x0, x1, z0, z1) => boxes.some((b) => x0 < b[1] && x1 > b[0] && z0 < b[3] && z1 > b[2]);
const claim = (x, z, hx, hz) => boxes.push([x - hx, x + hx, z - hz, z + hz]);
const prop = (asset, x, z, hx, hz, yaw = 0, o = {}) => {
  if (Math.abs(x) + hx > 6.9 || Math.abs(z) + hz > 6.0) return false;
  if (hit(x - hx, x + hx, z - hz, z + hz)) return false;
  claim(x, z, hx, hz);
  put(asset, x, z, { yaw, ...o });
  return true;
};
let seed = 20261003;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];

// Floor 8 x 7 tiles. Winding path = cobble-floor; pool = 2x2 sea-water tiles at (3..5, 2..4).
const pathCells = ['-5,4', '-5,2', '-3,2', '-3,0', '-1,0', '-1,-2', '1,-2', '1,-4', '-1,-4'];
const pathSet = new Set(pathCells);
const poolSet = new Set(['3,2', '5,2', '3,4', '5,4']);
let cobbles = 0;
for (let c = 0; c < 8; c++)
  for (let r = 0; r < 7; r++) {
    const x = -7 + c * 2, z = -6 + r * 2, k = `${x},${z}`;
    if (pathSet.has(k)) { cobbles++; put('cobble-floor', x, z); }
    else if (poolSet.has(k)) put('sea-water', x, z);
    else put('stone-ground', x, z);
  }
for (const k of pathCells) { const [x, z] = k.split(',').map(Number); boxes.push([x - 0.75, x + 0.75, z - 0.75, z + 0.75]); }

// Rock-wall cavern: north, west and east walls; south edge open with low rocks.
let rim = 0;
const wall = (x, z, yaw = 0) => { put('rock-wall', x, z, { yaw }); rim++; };
for (let x = -7; x <= 7; x += 2) wall(x, -7.45);
for (let z = -6; z <= 6; z += 2) { wall(-8.45, z, 90); wall(8.45, z, 90); }
wall(-8.45, 8, 90); wall(8.45, 8, 90);
let i = 0;
for (let x = -7.4; x <= 7.5; x += 2.1) { put('rock-cluster', +x.toFixed(2), 7.2, { yaw: (i++ * 67) % 360, scale: +(0.8 + rnd() * 0.3).toFixed(2) }); rim++; }
for (const x of [-7.5, 7.5]) put('boulder', x, 7.6, { scale: 1.0 });
// cave mouth entry removed (it carried a green mat); path starts at the south-west opening.

// Stalactites hang from the back wall
for (const x of [-6.2, -3.6, -1.0, 2.0, 4.6, 6.6]) put('stalactite', x, -6.6, { yaw: 0 });
for (const z of [-4.5, -1.5, 1.5, 4.5]) { put('stalactite', -7.6, z, { yaw: 90 }); put('stalactite', 7.6, z, { yaw: 270 }); }

// Focal grotto: giant crystal clusters at several scales (glow = main light)
const big = [[0, -5.7, 1.5], [-4.8, -5.6, 1.2], [5.0, -5.5, 1.3], [-7.0, -2.2, 1.0], [7.0, -1.8, 1.1], [-7.0, 3.6, 0.9], [7.0, 5.6, 0.8], [-2.6, -6.0, 0.7], [2.6, -6.0, 0.8]];
big.forEach(([x, z, s], n) => { claim(x, z, 0.5 * s + 0.2, 0.4 * s + 0.2); put('giant-crystal', x, z, { yaw: (n * 83) % 360, scale: s }); });
const clu = [[-1.6, -4.6, 1.4], [1.6, -4.4, 1.2], [-3.4, -4.0, 1.0], [3.4, -3.8, 1.3], [-6.0, -4.4, 1.3], [6.2, -3.6, 1.1], [-5.8, 0.4, 1.2], [6.4, 0.2, 1.4],
  [-0.4, 2.6, 0.9], [2.0, 6.0, 1.2], [-3.2, 6.2, 1.0], [-5.6, 5.8, 1.1], [3.0, 0.4, 1.0], [6.4, 3.0, 0.9]];
clu.forEach(([x, z, s], n) => { claim(x, z, 0.4 * s, 0.4 * s); put('crystal-cluster', x, z, { yaw: (n * 61) % 360, scale: s }); });
// small crystals scattered over the floor, hugging the pool and the path
for (let n = 0; n < 26; n++) {
  const x = +(-6.6 + rnd() * 13.2).toFixed(2), z = +(-5.6 + rnd() * 11).toFixed(2);
  const s = +(0.6 + rnd() * 0.5).toFixed(2);
  prop('crystal-shard', x, z, 0.25 * s, 0.25 * s, Math.floor(rnd() * 360), { scale: s });
}
// Pool rim: crystals and rocks around the water
for (const [x, z, s] of [[2.3, 1.0, 0.9], [6.2, 1.2, 1.0], [6.4, 4.6, 0.8], [2.1, 4.8, 0.8], [4.0, 5.4, 0.7]])
  prop('crystal-shard', x, z, 0.25, 0.25, Math.floor(rnd() * 360), { scale: s });
for (const [x, z] of [[2.0, 3.0], [4.0, 1.0], [5.9, 3.0], [4.6, 5.3]])
  prop('rock-cluster', x, z, 0.45, 0.4, Math.floor(rnd() * 360), { scale: 0.5 });

boxes.push([2.4, 5.8, 1.4, 4.8]); // pool
// Mushroom grove (glowing)
const mush = [[-5.6, 1.6], [-6.2, 3.0], [-4.2, 4.6], [-3.9, -1.0], [-5.4, -3.4], [-3.0, 5.0], [-2.0, 0.3], [-6.1, 4.5], [0.4, -2.8], [3.6, -2.0], [5.6, -4.2], [1.0, 4.2], [-1.0, 5.6]];
mush.forEach(([x, z], n) => prop(n % 3 === 2 ? 'mushroom' : 'glowing-mushroom', x, z, 0.3, 0.3, Math.floor(rnd() * 360), { scale: +(1.2 + rnd() * 1.2).toFixed(2) }));

const scatter = (asset, n, xr, zr, hx, hz, sr = [1, 1]) => {
  let done = 0, tries = 0;
  while (done < n && tries++ < 800) {
    const x = +(xr[0] + rnd() * (xr[1] - xr[0])).toFixed(2), z = +(zr[0] + rnd() * (zr[1] - zr[0])).toFixed(2);
    const s = +(sr[0] + rnd() * (sr[1] - sr[0])).toFixed(2);
    if (prop(asset, x, z, hx * s, hz * s, Math.floor(rnd() * 360), { scale: s })) done++;
  }
};
// Fill the floor: rubble, stalagmites, rocks, bones of moss
const all = [[-7, 7], [-6.2, 6.4]];
scatter('stalagmite', 14, ...all, 0.4, 0.4, [0.5, 1.1]);
scatter('rock-cluster', 14, ...all, 0.5, 0.4, [0.4, 0.8]);
scatter('boulder', 6, ...all, 0.5, 0.4, [0.3, 0.6]);
scatter('glowing-mushroom', 8, ...all, 0.25, 0.25, [0.8, 1.4]);
scatter('moss', 6, ...all, 0.4, 0.3);
scatter('lichen', 5, ...all, 0.4, 0.3);
scatter('stalagmite', 8, ...all, 0.4, 0.4, [0.3, 0.5]);

const sceneSrc = `// GENERATED by scripts/design-crystal-cave.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${places.map((p) => {
  const n = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
  return `    { asset: '${p.asset}', at: [${n(p.at[0])}, ${n(p.at[1])}, ${n(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
}).join('\n')}
  ];
}
`;
writeFileSync('scenes/maps/crystal-cave.ts', sceneSrc);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/crystal-cave.md', `# Crystal cave — map plan (generated)

GENERATED by \`scripts/design-crystal-cave.mjs\`. 16 m x 14 m (8 x 7 tiles of 2 m), two-course boulder rim.

Zones: cave mouth (south-west) where a ${cobbles}-tile cobble path starts; mushroom grove along the
west; glowing pool with puddles in the east; giant-crystal grotto at the north end of the path
(focal). Stalactites sit in the high rim, stalagmites and moss dress the rim edge.

## Tally (${places.length} placements)

${Object.entries(tally).sort().map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
console.log(`crystal-cave: ${places.length} placements`, tally);
