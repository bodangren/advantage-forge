#!/usr/bin/env node
// Catacombs map: 8 x 7 cells of 2 m (16 x 14 m). Floor cells form narrow tunnels that meet at a
// small round hall; every edge between floor and rock gets a low wall facing the floor.
// Cell (c,r): x in [-8+2c, -6+2c], z in [-7+2r, -5+2r].
import { writeFileSync } from 'node:fs';

const rows = [
  // c0 c1 c2 c3 c4 c5 c6 c7
  '##.##.##', // placeholder, replaced below
];
const grid = [
  'FF.F.FFF', // r0 NW chamber, N tunnel row, NE chamber
  'FF.F.FFF', // r1
  'F..FF...', // r2 hall top
  'FFFFFFFF', // r3 west tunnel, hall, east tunnel
  '...FF..F', // r4
  'FF..F.FF', // r5
  'FFFFF.FF', // r6
];
// r0: c3,c4 tunnel row must be connected: fix specific cells
const g = grid.map((s) => s.split(''));
g[0][4] = 'F'; g[0][3] = 'F'; g[0][2] = '.';
g[1][4] = '.'; g[1][3] = 'F';
g[1][5] = 'F';
g[6][2] = 'F'; g[6][3] = 'F';
g[5][1] = 'F'; g[5][0] = 'F';
const NC = 8, NR = 7;
const isF = (c, r) => c >= 0 && c < NC && r >= 0 && r < NR && g[r][c] === 'F';
const cx = (c) => -7 + 2 * c, cz = (r) => -6 + 2 * r;

const places = [];
const used = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0.09, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const FLOOR_Y = 0.09;

let n = 0, cells = 0;
for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) if (isF(c, r)) {
  cells++;
  put((c * 3 + r * 5) % 4 === 0 ? 'floor-cracked' : 'floor', cx(c), cz(r), { y: 0 });
}

// walls
const walls = []; // {x,z,yaw}
for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) if (isF(c, r)) {
  if (!isF(c, r - 1)) walls.push({ x: cx(c), z: cz(r) - 1, yaw: 0 });
  if (!isF(c, r + 1)) walls.push({ x: cx(c), z: cz(r) + 1, yaw: 180 });
  if (!isF(c - 1, r)) walls.push({ x: cx(c) - 1, z: cz(r), yaw: 90 });
  if (!isF(c + 1, r)) walls.push({ x: cx(c) + 1, z: cz(r), yaw: 270 });
}
const dir = (yaw) => [Math.sin((yaw * Math.PI) / 180), Math.cos((yaw * Math.PI) / 180)];
const inward = (w, d) => { const [dx, dz] = dir(w.yaw); return [w.x + dx * d, w.z + dz * d]; };
const sorted = walls.sort((a, b) => a.z - b.z || a.x - b.x);
let alcoves = 0;
sorted.forEach((w, i) => {
  const alc = i % 2 === 1;
  put(alc ? 'wall-alcove' : 'wall', w.x, w.z, { y: 0, yaw: w.yaw });
  if (w.yaw === 0 || w.yaw === 90) put('wall', w.x, w.z, { y: 1.2, yaw: w.yaw }); // tall far walls
  if (alc) {
    const [px, pz] = inward(w, 0.4);
    put('bone-pile', px, pz, { yaw: w.yaw, scale: 1.5 });
    const [qx, qz] = inward(w, 0.75);
    put('candle-cluster', qx + dir(w.yaw)[1] * 0.45, qz - dir(w.yaw)[0] * 0.45, { yaw: w.yaw });
  } else if (i % 6 === 0) {
    const [px, pz] = inward(w, 0.3);
    put('torch-sconce', px, pz, { y: 0, yaw: w.yaw });
  } else if (i % 8 === 4) {
    const [px, pz] = inward(w, 0.5);
    put(i % 16 === 4 ? 'rubble' : 'chains', px, pz, { yaw: w.yaw });
  }
});

// arched tunnel mouths, gates one cell inside the tunnel
for (const [x, z, yaw, gx, gz] of [[-1, -3, 0, -1, -4], [-4, 0, 90, -6, 0], [4, 0, 270, 6, 0], [1, 3, 180, 1, 4]]) {
  put('archway', x, z, { y: 0, yaw });
  put('iron-door', gx, gz, { yaw });
}
// flames at every mouth
for (const [x, z] of [[-2.2, -2.5], [0.2, -2.5], [-3.5, -0.9], [-3.5, 0.9], [3.5, -0.9], [3.5, 0.9], [-0.2, 2.5], [2.2, 2.5]]) put('brazier', x, z);

// hall focal: well ring with candles and urns
put('altar', 0, 0);
for (let k = 0; k < 8; k++) {
  const t = ((22.5 + 45 * k) * Math.PI) / 180;
  put('pillar', 1.8 * Math.sin(t), 1.8 * Math.cos(t));
}
for (const [x, z] of [[-1.5, -2.4], [1.5, -2.4], [-1.5, 2.4], [1.5, 2.4]]) put('bone-pile', x, z, { scale: 1.5 });
for (const [x, z] of [[0.8, 0.8], [-0.8, 0.8], [0.8, -0.8], [-0.8, -0.8], [0, 1.0], [0, -1.0]]) put('candle-cluster', x, z);
// NW chamber: crypt of one
put('sarcophagus', -6, -5.5);
put('candle-cluster', -7.3, -4.2); put('candle-cluster', -4.9, -4.2);
put('gravestone', -7.2, -6.2); put('cell-bars', -7, -3, { yaw: 0 }); put('chains', -7.5, -6.5); put('chains', -4.6, -5, { yaw: 270 }); put('chains', -7.6, -3.6, { yaw: 90 }); put('skeleton', -5.8, -3.6, { yaw: 20 });
put('urn', -7.4, 0.7);
// NE chamber: two sarcophagi
put('sarcophagus', 4.4, -5.6); put('sarcophagus', 6.9, -4.2, { yaw: 90 });
put('candle-cluster', 5.6, -4.3); put('candle-cluster', 3.2, -4.4); put('gravestone', 7.2, -6.3);
put('urn', 2.8, -6.2); put('bone-pile', 6.2, -6.2);
// N tunnel
put('skeleton', -1, -5.7, { yaw: 180 }); put('bone-pile', -0.4, -6.2); put('rubble', 1, -6.2);
// E tunnel and SE chamber
put('rubble', 5.2, 0.6); put('bone-pile', 6.9, 0.6);
put('sarcophagus', 5.4, 5.9); put('candle-cluster', 7.2, 4.0); put('candle-cluster', 4.6, 4.2);
put('skeleton', 7, 5.8, { yaw: 270 }); put('gravestone', 6.2, 3.8);
put('chains', 7.4, 2.2, { yaw: 270 });
// SW chamber ossuary and S tunnel
put('bone-pile', -7, 4.0); put('bone-pile', -5.2, 4.2); put('bone-pile', -7, 6.2); put('bone-pile', -4.9, 6.3);
put('skeleton', -6, 5.1, { yaw: 90 }); put('urn', -7.4, 5.0); put('candle-cluster', -5.8, 4.2);
put('rubble', -2.5, 5.9); put('bone-pile', -1, 6.2); put('candle-cluster', 0.6, 6.2);
put('stairs-stone', -2.2, 1.0, { yaw: 90, y: 0 }); places.pop();
// W tunnel
put('bone-pile', -5.2, 0.6); put('skeleton', -6.5, 0.2, { yaw: 90 });

const fmt = (p) => {
  const [x, y, z] = p.at;
  const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
  return `  { asset: '${p.asset}', at: [${num(x)}, ${num(y)}, ${num(z)}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
};
writeFileSync('scenes/maps/catacombs.ts', `// GENERATED by scripts/design-catacombs.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
const ascii = g.map((s) => s.join('').replace(/\./g, '#')).join('\n');
writeFileSync('docs/map-mockups/catacombs.md', `# Catacombs map

Generated by scripts/design-catacombs.mjs. 16 m x 14 m, 8 x 7 cells of 2 m. F = floor.

\`\`\`
${ascii}
\`\`\`

Zones: round hall with altar at centre; four tunnels with iron gates; NW crypt, NE twin-sarcophagus
chamber, SE tomb, SW ossuary. Skull niches (wall-alcove) with bone piles and candles line the tunnels.

Pieces: ${places.length}
${Object.entries(tally).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
console.log(ascii, '\ncells', cells, 'walls', walls.length, 'pieces', places.length);
