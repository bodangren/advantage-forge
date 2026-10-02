#!/usr/bin/env node
// Crypt map designer: 14 m x 12 m (7 x 6 tiles of 2 m), low walls, hall of sarcophagi,
// two side chapels in the north corners, iron gate entry in the south wall.
// Writes scenes/maps/crypt.ts and docs/map-mockups/crypt.md.
import { writeFileSync } from 'node:fs';

const FY = 0.08; // floor top
const places = [];
const boxes = []; // [x0,x1,z0,z1] occupied
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  places.push(p);
};
const hit = (x0, x1, z0, z1) => boxes.some((b) => x0 < b[1] && x1 > b[0] && z0 < b[3] && z1 > b[2]);
const claim = (x, z, hx, hz) => boxes.push([x - hx, x + hx, z - hz, z + hz]);
// Floor prop with a claimed footprint; returns false if blocked.
const prop = (asset, x, z, hx, hz, yaw = 0, y = FY) => {
  if (Math.abs(x) + hx > 6.5 || Math.abs(z) + hz > 5.5) return false;
  if (hit(x - hx, x + hx, z - hz, z + hz)) return false;
  claim(x, z, hx, hz);
  put(asset, x, z, { yaw, y });
  return true;
};
// deterministic rng
let seed = 20261002;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// Floors: 7 x 6
let cracked = 0;
for (let c = 0; c < 7; c++)
  for (let r = 0; r < 6; r++) {
    const cr = (c * 3 + r * 5) % 4 === 0;
    if (cr) cracked++;
    put(cr ? 'floor-cracked' : 'floor', -6 + c * 2, -5 + r * 2);
  }

// Walls. Corners: base arms W and N.
// The piece is centred on its 2 x 2 footprint (outer corner at +1,+1), so move it 0.9 m inward.
const corner = (x, z, yaw) => put('wall-corner', x - Math.sign(x) * 0.9, z - Math.sign(z) * 0.9, { yaw });
corner(-7, -6, 180); corner(7, -6, 90); corner(7, 6, 0); corner(-7, 6, 270);
const alc = new Set(['N:-4', 'N:0', 'N:4', 'S:-4', 'S:4', 'W:-3', 'W:1', 'E:-3', 'E:1']);
for (const x of [-4, -2, 0, 2, 4]) {
  put(alc.has('N:' + x) ? 'wall-alcove' : 'wall', x, -6, { yaw: 0 });
  if (x === 0) continue;
  if (Math.abs(x) === 2) put('wall', x, 6, { yaw: 180 });
  else put('wall-alcove', x, 6, { yaw: 180 });
}
put('iron-door', 0, 6, { yaw: 180 });
put('pillar', -0.85, 6, { y: 0 }); put('pillar', 0.85, 6, { y: 0 });
for (const z of [-3, -1, 1, 3]) {
  put(alc.has('W:' + z) ? 'wall-alcove' : 'wall', -7, z, { yaw: alc.has('W:' + z) ? 90 : 90 });
  put(alc.has('E:' + z) ? 'wall-alcove' : 'wall', 7, z, { yaw: alc.has('E:' + z) ? 270 : 90 });
}
// Chapel partitions (open doorway at z=-3 on the east/west side of the hall)
put('wall', -3, -5, { yaw: 90 }); put('wall', 3, -5, { yaw: 90 });
put('wall', -4, -2, { yaw: 0 }); put('wall', -6, -2, { yaw: 0 });
put('wall', 4, -2, { yaw: 0 }); put('wall', 6, -2, { yaw: 0 });
// wall bounds
boxes.push([-7.3, 7.3, -6.3, -5.55], [-7.3, 7.3, 5.55, 6.3], [-7.3, -6.55, -6.3, 6.3], [6.55, 7.3, -6.3, 6.3]);
boxes.push([-7, -2.6, -2.3, -1.7], [2.6, 7, -2.3, -1.7], [-3.3, -2.7, -6, -4], [2.7, 3.3, -6, -4]);
boxes.push([-3.3, -2.7, -2.4, -1.6], [2.7, 3.3, -2.4, -1.6]);
// aisle kept clear (gate to statue)
boxes.push([-0.9, 0.9, -3.4, 5.6]);

// Focal statue between the chapels, flanked by braziers.
prop('statue', 0, -4.6, 0.7, 0.7, 0);
prop('brazier', -1.5, -4.9, 0.35, 0.35); prop('brazier', 1.5, -4.9, 0.35, 0.35);
prop('candle-cluster', -0.8, -3.7, 0.2, 0.2); prop('candle-cluster', 0.8, -3.7, 0.2, 0.2);
// Hall sarcophagi: two rows of three along Z
for (const z of [-0.6, 1.8, 4.2]) {
  prop('sarcophagus', -1.9, z, 0.45, 1.0, 90);
  prop('sarcophagus', 1.9, z, 0.45, 1.0, 270);
}
// Pillars flanking the hall
for (const z of [-0.2, 2.6]) { prop('pillar', -3.6, z, 0.4, 0.4); prop('pillar', 3.6, z, 0.4, 0.4); }
// Chapels: sarcophagus + statue-urn altar and candles
prop('sarcophagus', -5.1, -4.2, 1.0, 0.45, 0); prop('sarcophagus', 5.1, -4.2, 1.0, 0.45, 0);
prop('statue', -5.9, -3.1, 0.6, 0.6, 90); prop('statue', 5.9, -3.1, 0.6, 0.6, 270);
prop('candle-cluster', -4.2, -3.2, 0.2, 0.2); prop('candle-cluster', 4.2, -3.2, 0.2, 0.2);
prop('candle-cluster', -4.2, -5.2, 0.2, 0.2); prop('candle-cluster', 4.2, -5.2, 0.2, 0.2);
prop('chains', -3.8, -5.2, 0.4, 0.35, 0); prop('chains', 3.8, -5.2, 0.4, 0.35, 0);
prop('urn', -6.0, -5.3, 0.2, 0.2); prop('urn', 6.0, -5.3, 0.2, 0.2);
prop('skeleton', -3.5, -3.3, 0.3, 0.3, 90); prop('skeleton', 3.5, -3.3, 0.3, 0.3, 270);

// Torches on walls (sconce faces +Z, 0.19 deep, wall faces at 5.8 / 6.8)
const sconces = [
  [-5, -5.7, 0], [-2, -5.7, 0], [2, -5.7, 0], [5, -5.7, 0],
  [-5, 5.7, 180], [-2.4, 5.7, 180], [2.4, 5.7, 180], [5, 5.7, 180],
  [-6.7, -0.2, 90], [-6.7, 2.2, 90], [-6.7, 4.2, 90],
  [6.7, -0.2, 270], [6.7, 2.2, 270], [6.7, 4.2, 270],
];
for (const [x, z, yaw] of sconces) put('torch-sconce', x, z, { yaw });

// Scatter dressing: graves along side walls, bones, urns, candles, webs, skulls.
const scatter = (asset, n, xr, zr, hx, hz, yawFn = () => 0) => {
  let done = 0, tries = 0;
  while (done < n && tries++ < 400) {
    const x = xr[0] + rnd() * (xr[1] - xr[0]);
    const z = zr[0] + rnd() * (zr[1] - zr[0]);
    if (prop(asset, +x.toFixed(2), +z.toFixed(2), hx, hz, yawFn())) done++;
  }
};
const side = [[-6.3, -4.2], [4.2, 6.3]];
const gy = () => [0, 0, 180][Math.floor(rnd() * 3)] + (rnd() < 0.3 ? 15 : 0);
for (const xr of side) {
  scatter('gravestone', 6, xr, [-1.5, 5.3], 0.3, 0.2, gy);
  scatter('bone-pile', 5, xr, [-1.5, 5.3], 0.3, 0.3, () => Math.floor(rnd() * 4) * 90);
  scatter('urn', 3, xr, [-1.5, 5.3], 0.2, 0.2);
  scatter('candle-cluster', 3, xr, [-1.5, 5.3], 0.17, 0.17);
  scatter('chains', 1, xr, [-1.5, 5.3], 0.4, 0.35);
}
scatter('bone-pile', 5, [-3.2, 3.2], [-1.5, 5.3], 0.3, 0.3, () => Math.floor(rnd() * 4) * 90);
scatter('skeleton', 3, [-4.4, 4.4], [-1.5, 5.3], 0.35, 0.35, () => Math.floor(rnd() * 360));
scatter('urn', 3, [-3.2, 3.2], [-1.5, 5.3], 0.2, 0.2);
scatter('candle-cluster', 6, [-3.2, 3.2], [-1.5, 5.3], 0.17, 0.17);
// Webs of ivy in the chapel corners, sparing
for (const [x, z] of [[-6.45, -5.45], [6.45, -5.45]]) put('ivy', x, z, { y: FY });

const sceneSrc = `// GENERATED by scripts/design-crypt.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${places.map((p) => {
  const n = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
  return `    { asset: '${p.asset}', at: [${n(p.at[0])}, ${n(p.at[1])}, ${n(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''} },`;
}).join('\n')}
  ];
}
`;
writeFileSync('scenes/maps/crypt.ts', sceneSrc);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/crypt.md', `# Crypt — map plan (generated)

GENERATED by \`scripts/design-crypt.mjs\`. 14 m x 12 m (7 x 6 tiles of 2 m), walls 1.2 m.

Zones: central hall (two rows of three sarcophagi, pillar pairs, aisle from the iron gate in the
south wall to the statue focal point in the north); two side chapels in the north corners
(sarcophagus, statue, candles, chains, open doorway to the hall); graveyard strips along the east
and west walls (gravestones, bone piles, urns, candles). Torch sconces on every wall.

## Tally (${places.length} placements)

${Object.entries(tally).sort().map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
console.log(`crypt: ${places.length} placements`, tally);
