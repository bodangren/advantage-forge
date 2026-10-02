#!/usr/bin/env node
// Cave map designer: 20 m x 16 m. Grid 10 cols x 8 rows of 2 m tiles.
// Cell (c,r) centre = ((c-4.5)*2, (r-3.5)*2). North is -Z, west is -X.
// Zones: west tunnel (r4-5, c0-3) -> north sand chamber with fire ring and
// rock wall; central pool; south-east campfire ledge; west mushroom ledge;
// east treasure nook with chest. Focal object: the pool with the fire ring.
import { writeFileSync } from 'node:fs';

const grid = [
  'ssssddddss', // r0
  'sddddddddd', // r1 (c9 = treasure nook)
  'sdddddddds', // r2
  'sdddd~~~dd', // r3
  'dddd~~~~~d', // r4 tunnel enters at c0
  'ssd~~~~~dd', // r5
  'sssd~~~ddd', // r6
  'sssdddddss', // r7
];
const tileOf = { s: 'stone-ground', d: 'dirt-ground', '~': 'sea-water' };
const cx = (c) => (c - 4.5) * 2;
const cz = (r) => (r - 3.5) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = Math.round(o.yaw);
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const jit = (a) => (rnd() - 0.5) * 2 * a;

// ground
grid.forEach((row, r) => [...row].forEach((ch, c) => put(tileOf[ch], cx(c), cz(r))));

// rock walls: boulders in stacked rows. Tunnel gap in west wall at z 0..2.
const wallBoulder = (x, z, layer, yawBase) => {
  const s = 1.5 + rnd() * 0.5 - layer * 0.15;
  put('boulder', x + jit(0.2), z + jit(0.2), { y: layer * 0.85, yaw: yawBase + jit(40), scale: +s.toFixed(2) });
};
const north = []; for (let x = -9.2; x <= 9.4; x += 1.6) north.push(x);
for (const x of north) for (let l = 0; l < 3; l++) {
  if (l === 2 && rnd() < 0.3) continue;
  wallBoulder(x, -7.7 + (l ? 0.2 : 0), l, 0);
}
const west = []; for (let z = -6.6; z <= 7; z += 1.6) west.push(z);
for (const z of west) {
  if (z > -0.5 && z < 2.6) continue; // tunnel mouth
  for (let l = 0; l < 3; l++) wallBoulder(-9.6 + (l ? 0.25 : 0), z, l, 90);
}
const east = []; for (let z = -6.6; z <= 3; z += 1.6) east.push(z);
for (const z of east) for (let l = 0; l < 2; l++) {
  if (z > -1.2 && z < 0.4) continue; // treasure nook opening
  wallBoulder(9.6 - (l ? 0.25 : 0), z, l, 90);
}
// tunnel mouth arch frame and winding tunnel walls (boulders flank the path)
put('cave-mouth', -8.6, 1.0, { yaw: 90, scale: 0.7 });
for (const [x, z] of [[-7.5, -0.3], [-5.5, -0.3], [-3.5, 0.7], [-7.5, 3.1], [-5.8, 2.9], [-3.9, 3.9]]) {
  put('boulder', x, z, { yaw: rnd() * 180, scale: 1.0 + rnd() * 0.3 });
}
put('rock-cluster', -8.2, 2.6, { yaw: 30 }); put('rock-cluster', -6.4, 0.5, { yaw: 120 });
// low front rim rocks (south edge stays open, like the mockup)
for (let x = -8.5; x <= 8.5; x += 2.1) put('rock-cluster', x + jit(0.3), 7.6, { yaw: rnd() * 360, scale: 0.9 + rnd() * 0.3 });
for (let x = -8; x <= 8; x += 2.8) if (x < -5 || x > 5) put('boulder', x + jit(0.3), 7.5, { yaw: rnd() * 360, scale: 0.7 });

// focal zone: north sand chamber with a fire ring of rocks and a campfire
const ring = 0.62;
for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; put('rock-cluster', Math.cos(a) * ring + 1.5, Math.sin(a) * ring - 3.4, { yaw: i * 45, scale: 0.35 }); }
put('campfire', 1.5, -3.4);
// bones and a pair of seats near the fire
put('bone-pile', 3.4, -4.2, { yaw: 30 }); put('bone-pile', -0.6, -2.6, { yaw: 200, scale: 0.8 });
put('monster-bone', 0.0, -4.8, { yaw: 70 });
put('bone-pile', 7.2, 3.8, { yaw: 120, scale: 0.7 });
put('boulder', 3.4, -2.2, { yaw: 40, scale: 0.35 });
// south-east ledge campfire (lit): second camp by the pool
put('campfire', 4.4, 5.2, { scale: 0.9 });
put('bone-pile', 5.4, 5.8, { yaw: 300, scale: 0.6 });
put('lantern', 6.4, 5.0, { scale: 0.7 });
// treasure nook (east)
put('chest', 8.2, -0.4, { yaw: 270 });
put('crystal-cluster', 8.4, -1.5, { yaw: 20, scale: 1.3 }); put('crystal-cluster', 8.5, 0.8, { yaw: 100, scale: 1.0 });
put('bone-pile', 7.4, -1.2, { yaw: 250, scale: 0.6 });
put('torch-sconce', 9.2, -2.0, { yaw: 270 });
// glowing mushrooms: back (north), west ledge, south-east and pool edge
const mush = [[-1.0, -5.9, 3], [-0.4, -5.6, 2], [-0.1, -5.2, 2.2], [-7.4, 3.5, 2.6], [-6.9, 4.1, 2], [-7.7, 4.2, 1.8],
  [6.3, -2.2, 2.4], [6.0, -1.8, 1.8], [-3.0, -3.8, 2], [-2.4, -4.4, 1.6], [0.2, 4.6, 1.8], [-1.8, 6.0, 2.2], [5.0, 3.0, 1.6]];
mush.forEach(([x, z, s], i) => put(i % 2 ? 'mushroom' : 'glowing-mushroom', x, z, { yaw: i * 47, scale: s }));
// stalagmites: big ones against the walls, small clusters around the pool
for (const [x, z, s] of [[-8.2, -6.2, 1.3], [-6.0, -6.4, 0.9], [-2.8, -6.6, 1.2], [3.0, -6.6, 1.0], [6.4, -6.2, 1.3], [8.4, -5.0, 0.9],
  [-8.6, 5.6, 1.0], [-7.2, 6.5, 0.7], [8.2, 6.2, 1.1], [-3.5, 6.6, 0.6], [2.0, 6.5, 0.7], [7.6, 3.0, 0.8],
  [-2.6, 1.2, 0.55], [-3.0, 2.6, 0.5], [3.8, 0.4, 0.5], [4.1, 2.8, 0.55], [1.0, 5.0, 0.4]]) put('stalagmite', x, z, { yaw: rnd() * 360, scale: s });
// stepping stones across the pool narrow
for (const [x, z] of [[-1.7, 3.8], [-0.3, 4.2], [1.1, 3.6]]) put('stepping-stone', x, z, { y: -0.03, yaw: rnd() * 360, scale: 0.6 });
// scattered pebbles and rock dressing
for (let i = 0; i < 14; i++) {
  const x = -8.5 + rnd() * 17, z = -5.8 + rnd() * 11;
  const c = Math.floor(x / 2 + 5), r = Math.floor(z / 2 + 4);
  if (grid[r]?.[c] === '~') continue;
  put('river-rock', x, z, { yaw: rnd() * 360, scale: 0.45 + rnd() * 0.3 });
}
// torches along the tunnel and chamber
put('torch-sconce', -9.2, -0.2, { yaw: 90 });
put('torch-sconce', -9.2, 3.4, { yaw: 90 });
put('lantern', -6.0, 1.7, { scale: 0.6 });
put('torch-sconce', -4.0, -6.9, { yaw: 0 }); put('torch-sconce', 5.0, -6.9, { yaw: 0 });

const num = (n) => +n.toFixed(2);
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/cave.ts', `// GENERATED by scripts/design-cave.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/cave.md', `# Cave map (20 m x 16 m)

Generated by scripts/design-cave.mjs. Grid 10 x 8 tiles of 2 m.

\`\`\`
${grid.join('\n')}
\`\`\`
s = stone, d = dirt/sand, ~ = pool.

Zones: west winding tunnel (cave-mouth, boulders, lantern) into the north sand chamber with the fire ring (focal);
central pool with stepping stones; south-east ledge camp; east treasure nook (chest, crystals).
Boulder walls on north, west, east; the south edge stays open.

Total placements: ${places.length}

${Object.entries(tally).sort().map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
console.log('places', places.length);
