#!/usr/bin/env node
// Orc camp map designer (P2 map): 20 x 18 m war camp on dirt-ground, stone-ground under the warlord seat.
// Tiles 10 x 9 of 2 m (x -10..10, z -9..9). Spiked palisade (wood-wall + pikes), south gate.
// Writes scenes/maps/orc-camp.ts and docs/map-mockups/orc-camp.md.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [+x.toFixed(2), o.y ?? 0, +z.toFixed(2)] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// ground: dirt everywhere, stone under the warlord platform (x 4..10, z -9..-3)
for (let i = 0; i < 10; i++)
  for (let j = 0; j < 9; j++) {
    const x = -9 + i * 2, z = -8 + j * 2;
    put(x >= 5 && z <= -4 ? 'stone-ground' : 'dirt-ground', x, z);
  }

// palisade: wood-wall + pike spikes at every joint. Gate gap at x -2..2 on the south.
const WX = 9.8, WZ = 8.8;
for (let x = -9; x <= 9; x += 2) put('wood-wall', x, -WZ, { yaw: 180 });
for (const x of [-9, -7, -5, -3, 3, 5, 7, 9]) put('wood-wall', x, WZ, { yaw: 0 });
for (let z = -7; z <= 7; z += 2) { put('wood-wall', WX, z, { yaw: 270 }); put('wood-wall', -WX, z, { yaw: 90 }); }
for (let x = -10; x <= 10; x += 2) { put('pike', x, -WZ - 0.1, { scale: 1.1 }); if (Math.abs(x) >= 4) put('pike', x, WZ + 0.1, { scale: 1.1 }); }
for (let z = -8; z <= 8; z += 2) { put('pike', WX + 0.1, z, { scale: 1.1 }); put('pike', -WX - 0.1, z, { scale: 1.1 }); }
// gate: tall pike pairs, banners, skull piles, torches
for (const s of [-1, 1]) {
  put('pike', s * 2.3, WZ, { scale: 1.5 }); put('pike', s * 3.0, WZ, { scale: 1.3 });
  put('banner', s * 2.6, 7.4, { yaw: s > 0 ? 20 : -20, scale: 1.3 });
  put('bone-pile', s * 2.0, 8.2, { scale: 1.6, yaw: s * 40 });
  put('torch', s * 1.7, 7.0);
}

// zone 1: central bonfire and spit
put('watchfire', 0, 0.5, { scale: 2.2 });
for (const [x, z, y] of [[-1.7, 0.5, 0], [1.7, 0.5, 180]]) put('pike', x, z, { scale: 0.75 });
for (const [x, z, a] of [[-2.4, 1.9, 20], [2.5, 2.0, 160], [-2.2, -1.4, 80], [2.4, -1.5, 250]]) put('rock-cluster', x, z, { yaw: a, scale: 0.8 });
put('tree-stump', -1.4, 2.2, { scale: 1.3 }); put('tree-stump', 1.4, 2.4, { scale: 1.3, yaw: 90 });
put('fallen-log', 0, 2.8, { yaw: 90 });
put('orc-shaman', -1.8, -1.3, { yaw: 140 });
put('orc-warrior', 2.4, 0.9, { yaw: 250 });
put('orc-warrior', -2.6, 1.0, { yaw: 100 });
put('bone-pile', 0.9, -1.5, { scale: 1.5, yaw: 30 });
put('barrel', 3.1, -0.4); put('barrel', 3.5, 0.2, { scale: 0.9 });

// zone 2: warlord seat on the stone platform (NE)
put('throne', 7.2, -7.0, { scale: 1.4 });
put('orc-warlord', 7.2, -5.2, { yaw: 180 });
for (const s of [-1, 1]) { put('banner', 7.2 + s * 2.2, -7.6, { scale: 1.5, yaw: s * -10 }); put('brazier', 7.2 + s * 1.6, -5.6, { scale: 1.3 }); }
put('banner', 4.6, -6.0, { scale: 1.5, yaw: 15 });
put('bone-pile', 5.3, -4.4, { scale: 1.6, yaw: 70 }); put('bone-pile', 9.0, -4.3, { scale: 1.5, yaw: 200 });
put('hide', 8.8, -6.0, { scale: 2.5, yaw: 30 });
put('orc-warrior', 5.3, -5.4, { yaw: 160 }); put('orc-warrior', 9.0, -5.4, { yaw: 200 });
put('torch', 9.0, -8.0); put('torch', 4.4, -8.0);

// zone 3: longhouse (N), hide tents and yurt (W)
put('longhouse', -3.0, -6.2, { scale: 1.0 });
put('barrel', -7.4, -5.2); put('crate', -7.2, -4.5, { yaw: 20 });
put('bone-pile', -0.5, -4.2, { scale: 1.5 });
put('banner', 1.6, -4.6, { scale: 1.4, yaw: 10 });
put('tent', -7.4, -1.8, { yaw: 90, scale: 1.7 });
put('tent', -7.4, 1.2, { yaw: 90, scale: 1.7 });
put('yurt', -6.5, 5.0, { yaw: 40, scale: 0.95 });
put('hide', -5.2, -0.3, { scale: 2.2, yaw: 60 });
put('hanging-cage', -4.2, 3.0);
put('cage', -2.9, 6.3, { yaw: 25 });
put('campfire-out', -5.2, 1.9, { scale: 1.5 });
put('orc-warrior', -4.8, -2.0, { yaw: 270 });

// zone 4: weapon and drum yard (SE)
put('drum', 5.8, 3.2, { scale: 4.5, yaw: 20 });
put('orc-warrior', 4.6, 4.4, { yaw: 40 });
put('anvil', 8.0, 2.0, { yaw: 270, scale: 1.4 });
put('crate', 8.3, 3.0, { yaw: 100 }); put('crate', 8.4, 3.6, { yaw: 40, scale: 0.9 });
put('barrel', 8.4, 6.2); put('barrel', 7.5, 6.6, { scale: 0.9 });
put('great-axe', 8.1, 4.6, { yaw: 70 }); put('axe', 6.9, 5.8, { yaw: 120 }); put('spear', 6.0, 6.5, { yaw: 80 });
for (const [x, z] of [[7.6, 0.2], [8.4, 0.9], [8.9, -0.4]]) put('pike', x, z, { scale: 0.9, yaw: 0 });
put('round-shield', 6.4, 1.4, { yaw: 20 }); put('round-shield', 7.0, 1.0, { yaw: 60 });
put('rock-cluster', 4.4, 6.4, { yaw: 100 });
put('bone-pile', 3.4, 5.4, { scale: 1.4, yaw: 150 });

// edge dressing: dead trees, boulders, bones
for (const [x, z, a] of [[-9.0, -8.0, 10], [-9.0, 8.0, 80], [9.0, 8.0, 200], [-9.0, 3.4, 130], [9.2, -2.4, 300], [0.6, -8.2, 250], [-9.0, -4.0, 40], [9.2, 0.8, 170]]) put('dead-tree', x, z, { yaw: a, scale: 0.95 });
for (const [x, z, a] of [[-8.7, -6.8, 20], [3.6, -8.2, 200], [-1.5, 8.1, 90], [9.0, 7.0, 330], [-8.8, 6.2, 70]]) put('boulder', x, z, { yaw: a });
for (const [x, z, a] of [[-6.0, 8.0, 100], [5.6, 8.0, 250], [-9.2, 0.0, 40], [9.2, -8.0, 140], [-3.2, 4.8, 300], [2.8, 7.2, 20]]) put('bone-pile', x, z, { yaw: a, scale: 1.3 });
// path markers: torches along the gate-to-fire road
put('torch', -1.0, 5.0); put('torch', 1.0, 5.0); put('torch', -1.0, 3.2); put('torch', 1.0, 3.6);
put('banner', -4.0, 8.0, { scale: 1.2 }); put('banner', 4.0, 8.0, { scale: 1.2 });
put('banner', -9.2, 4.6, { yaw: 90, scale: 1.3 }); put('banner', 9.2, 4.6, { yaw: 270, scale: 1.3 });

const fmt = (p) => `  { asset: '${p.asset}', at: [${p.at[0]}, ${p.at[1]}, ${p.at[2]}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/orc-camp.ts', `// GENERATED by scripts/design-orc-camp.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/orc-camp.md', `# Orc camp (generated)

GENERATED by scripts/design-orc-camp.mjs.

20 x 18 m war camp on 10 x 9 dirt-ground tiles; stone-ground under the warlord platform (NE).
Spiked palisade (wood-wall plus pikes) with a south gate, banners, torches and skull piles.
Zones: central bonfire (focal); warlord throne on stone with braziers and banners (NE); longhouse (N);
hide tents, yurt and cages (W); drum, anvil and weapon yard (SE). Dead trees and boulders dress the edges.

| asset | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length} placements.
`);
console.log(places.length);
