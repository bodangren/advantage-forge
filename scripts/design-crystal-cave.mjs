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

// Floor 8 x 7 tiles; winding path of cobble tiles, other tiles alternate stone-floor / stone-ground.
const pathCells = ['-5,4', '-5,2', '-3,2', '-3,0', '-1,0', '-1,-2', '1,-2', '1,-4', '-1,-4'];
const pathSet = new Set(pathCells);
let cobbles = 0;
for (let c = 0; c < 8; c++)
  for (let r = 0; r < 7; r++) {
    const x = -7 + c * 2, z = -6 + r * 2;
    const onPath = pathSet.has(`${x},${z}`);
    if (onPath) cobbles++;
    put('stone-ground', x, z);
  }
// path stays clear
for (const k of pathCells) { const [x, z] = k.split(',').map(Number); boxes.push([x - 0.75, x + 0.75, z - 0.75, z + 0.75]); }

// Wall ring: two courses of stone-wall (3 m) on the north and west; single low boulder row south and east.
let rim = 0;
for (let x = -7; x <= 7; x += 2) { put('stone-wall', x, -6.9); put('stone-wall', x, -6.9, { y: 1.5 }); rim += 2; }
for (let z = -5; z <= 5; z += 2) { put('stone-wall', -7.9, z, { yaw: 90 }); put('stone-wall', -7.9, z, { yaw: 90, y: 1.5 }); rim += 2; }
put('stone-wall', -7.9, 7, { yaw: 90 });
let i = 0;
const ring = (x, z, y0) => { put('boulder', +x.toFixed(2), z, { y: y0, yaw: (i++ * 67) % 360, scale: +(0.9 + rnd() * 0.3).toFixed(2) }); rim++; };
for (let x = -2.4; x <= 7.5; x += 1.2) ring(x, 6.95, 0);
for (let z = -6; z <= 6.4; z += 1.3) ring(7.6, z, 0);
for (let x = -7.4; x <= 7.5; x += 2.6) ring(x, -6.3, 0);
for (let z = -5.5; z <= 5.6; z += 2.6) ring(-7.2, z, 0);
// cave mouth in the south-west, sunk a little to hide its grass mat
put('cave-mouth', -5.5, 6.3, { yaw: 0, y: -0.12 });
claim(-5.5, 6.3, 2.2, 1.0);
put('boulder', -2.9, 6.6, { y: 0, yaw: 20 }); rim++;

// Stalactites tucked into the high back/side rim
const stalacs = [[-5.2, -6.7, 0], [-1.0, -6.7, 0], [3.2, -6.7, 0], [6.3, -6.7, 0], [-7.7, -3.2, 90], [-7.7, 1.2, 90]];
for (const [x, z, yaw] of stalacs) put('stalactite', x, z, { yaw });

// Focal grotto: giant crystals at the north end of the path
prop('giant-crystal', 0, -5.2, 1.0, 0.4, 0);
prop('giant-crystal', -4.6, -5.2, 0.8, 0.5, 40);
prop('giant-crystal', 5.0, -4.9, 0.8, 0.5, 300);
prop('rock-cluster', 0, -3.2, 0.6, 0.5, 0);
prop('stalagmite', -2.5, -5.2, 0.6, 0.5, 20); prop('stalagmite', 2.3, -5.4, 0.6, 0.5, 200);
prop('stalagmite', -6.0, -3.2, 0.6, 0.5, 90); prop('stalagmite', 6.2, 5.2, 0.6, 0.5, 120);
prop('crystal-cluster', -2.3, -3.6, 0.4, 0.4, 330); prop('crystal-cluster', 2.4, -3.4, 0.4, 0.4, 30);
prop('crystal-cluster', -4.4, 0.9, 0.4, 0.4, 70); prop('crystal-cluster', 6.2, -1.2, 0.4, 0.4, 250);
prop('crystal-cluster', -0.2, 3.4, 0.4, 0.4, 10);
for (const [x, z] of [[-6.6, -4.8], [-6.5, -1.8], [-6.6, 1.2], [-2.0, -5.9], [1.9, -5.9], [3.4, -5.9], [6.4, -5.2], [6.4, 6.0]])
  prop('crystal-cluster', x, z, 0.4, 0.4, Math.floor(rnd() * 360));
for (const [x, z] of [[-6.8, 3.4], [-1.2, -5.8], [4.2, -5.7], [6.7, -3.2], [2.0, 5.4]])
  prop('crystal-shard', x, z, 0.25, 0.25, Math.floor(rnd() * 360));
for (const [x, z] of [[-3.6, -4.2], [3.7, -4.4], [-1.6, -2.0], [2.9, -1.5], [-6.1, 2.4], [5.8, -3.2]])
  prop('crystal-shard', x, z, 0.25, 0.25, Math.floor(rnd() * 360));

// Pool in the east
prop('pond', 4.8, 3.3, 1.35, 1.1, 0);

prop('puddle', 2.4, 4.4, 0.5, 0.45, 20); prop('puddle', -1.8, 3.9, 0.5, 0.45, 100); prop('puddle', 6.2, 0.4, 0.5, 0.45, 200);
prop('crystal-cluster', 3.2, 1.9, 0.4, 0.4, 150);
prop('blue-mushroom', 6.2, 5.1, 0.3, 0.3, 40); prop('blue-mushroom', 3.2, 5.0, 0.3, 0.3, 190);

// Mushroom grove in the west (glowing mushrooms)
for (const [x, z] of [[-5.6, 1.6], [-6.2, 3.0], [-4.2, 4.6], [-3.9, -1.0], [-5.4, -3.4], [-3.0, 5.0], [-2.0, 0.3], [-6.1, 4.5]])
  prop(pick(['glowing-mushroom', 'glowing-mushroom', 'blue-mushroom']), x, z, 0.3, 0.3, Math.floor(rnd() * 360));
const scatter = (asset, n, xr, zr, hx, hz, scaleR) => {
  let done = 0, tries = 0;
  while (done < n && tries++ < 600) {
    const x = +(xr[0] + rnd() * (xr[1] - xr[0])).toFixed(2), z = +(zr[0] + rnd() * (zr[1] - zr[0])).toFixed(2);
    if (prop(asset, x, z, hx, hz, Math.floor(rnd() * 360))) done++;
  }
};
// Edge dressing hugging the rim (rim strip only, never open floor centre)
const strips = [[[-6.6, 6.6], [-5.6, -4.6]], [[-6.6, -5.4], [-4.6, 5.6]], [[5.6, 6.6], [-4.6, 5.6]], [[-1.6, 6.6], [4.7, 5.6]]];
for (const [xr, zr] of strips) {
  scatter('rock-cluster', 2, xr, zr, 0.55, 0.45);
  scatter('glowing-mushroom', 3, xr, zr, 0.3, 0.3);
  scatter('moss', 3, xr, zr, 0.4, 0.3);
  scatter('lichen', 2, xr, zr, 0.4, 0.3);
  scatter('stalagmite', 1, xr, zr, 0.6, 0.5);
}
scatter('moss', 2, [-3, 3], [2.5, 4.8], 0.4, 0.3);

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
