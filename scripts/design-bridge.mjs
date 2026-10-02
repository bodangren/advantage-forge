#!/usr/bin/env node
// Bridge crossing map: 13 x 9 tiles of 2 m (26 x 18 m). River runs N-S down column 0,
// a cobble road runs W-E on row 0 across the stone bridge. Writes scenes/maps/bridge.ts
// and docs/map-mockups/bridge.md.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// Tiles: columns -6..6, rows -4..4, centre = 2*index. Two river lanes (c 0 and 1) make a 4 m channel
// centred on x = 1; upstream (north) the single lane c=1 bends east at row -4.
for (let c = -6; c <= 6; c++)
  for (let r = -4; r <= 4; r++) {
    const x = c * 2, z = r * 2;
    if (c === 1 && r === -4) put('river-bend', x, z, { yaw: 270 });
    else if (r === -4 && c >= 2 && c <= 6) put('river-straight', x, z, { yaw: 90 });
    else if ((c === 0 && r >= -2) || (c === 1 && r >= -3)) put('river-straight', x, z);
    else if (r === 0) put('cobble-road-straight', x, z, { yaw: 90 });
    else put('grass-ground', x, z);
  }
// Diorama edge: cliff on the north rim, grassy hill rising on the south rim.
for (let c = -6; c <= 6; c++) {
  put('cliff-edge', c * 2, -10, { yaw: 0 });
  put('hill-slope', c * 2, 10, { yaw: 180 });
}

// Focal: a big stone-and-timber arch bridge spanning the 4 m channel, centred on x = 1.
put('bridge', 1, 0, { scale: 1.9 });
for (const [x, z] of [[-3.0, -1.9], [-3.0, 1.9], [5.0, -1.9], [5.0, 1.9]]) {
  put('stone-wall', x, z, { yaw: 90, scale: 0.7 });
  put('boulder', x + (x < 0 ? -0.9 : 0.9), z * 1.1, { yaw: x * 40 });
}
put('banner', -3.4, -2.8, { yaw: 0, scale: 0.9 });
put('banner', 5.4, 2.8, { yaw: 180, scale: 0.9 });
put('lantern', -2.6, -1.0);
put('lantern', -2.6, 1.0);
put('lantern', 4.6, -1.0);
put('lantern', 4.6, 1.0);

// Zone 1 (west bank): the toll hut with a barrier across the road.
put('hut', -6.4, -3.3, { yaw: 0, scale: 1.0 });
put('fence', -5.0, 0.0, { yaw: 90 });
put('guard', -5.8, 1.2, { yaw: 180 });
put('cash-box', -4.4, -1.8, { yaw: 0 });
put('notice-board', -3.6, 2.4, { yaw: 160 });
put('barrel', -7.3, -1.5);
put('crate', -8.0, -2.0, { yaw: 20 });
put('sack', -8.0, -1.0, { yaw: 60 });
put('hay-bale', -6.4, 4.2, { yaw: 10 });
put('barrel', -7.4, 4.0);
put('crate', -5.2, 4.6, { yaw: 70 });
put('lantern', -6.6, -0.9);

// Zone 2 (east bank): fishing spot.
put('stump', 5.8, 3.8, { yaw: 30 });
put('bucket', 5.1, 4.1);
put('fishing-net', 6.4, 4.6, { yaw: 200 });
put('log', 7.8, 3.9, { yaw: 80 });
put('rowboat', 0.5, 3.8, { y: -0.05, yaw: 0 });
put('rowboat', 1.8, -5.2, { y: -0.05, yaw: 200, scale: 0.9 });
put('signpost', 6.8, 1.3, { yaw: 200 });
put('fence', 7.0, -2.6, { yaw: 0 });
put('fence', 8.6, -2.6, { yaw: 0 });
put('guard-post', 8.4, -5.4, { yaw: 180, scale: 0.9 });
put('barrel', 6.6, -5.6);

// River dressing: reeds and cattails on both banks, rock groups in the water.
for (const [x, z, a, yaw] of [
  [-1.3, -4.0, 'reeds', 10], [3.3, -5.6, 'cattails', 80], [-1.3, 5.2, 'cattails', 150],
  [3.3, 6.2, 'reeds', 40], [-1.3, 2.4, 'reeds', 120], [3.3, -2.2, 'reeds', 200],
  [-1.3, -2.6, 'cattails', 20], [3.3, 2.4, 'cattails', 300], [-1.3, 7.4, 'reeds', 70], [3.3, 7.4, 'cattails', 250],
]) put(a, x, z, { yaw });
put('river-rock', 0.2, 5.4, { y: -0.1 });
put('river-rock', 1.8, -2.8, { y: -0.1, yaw: 40 });
put('river-rock', 1.2, -6.1, { y: -0.1, yaw: 120 });
put('boulder', 0.4, -3.6, { y: -0.12, scale: 0.6, yaw: 30 });
put('rock-cluster', 2.2, 6.6, { y: -0.12, scale: 0.7 });

// Trees and edge dressing.
const TREES = [
  [-10, -6.5, 'oak-tree', 20, 1.0], [-7.5, -6.8, 'oak-tree', 90, 0.9], [-4.5, -6.5, 'willow-tree', 150, 1.0],
  [-2.8, -4.2, 'willow-tree', 40, 0.9], [4.0, -6.8, 'oak-tree', 200, 1.1], [8.5, -6.8, 'oak-tree', 310, 1.0],
  [10.5, -3.0, 'oak-tree', 60, 1.0], [10.5, 1.0, 'oak-tree', 120, 0.95], [10.2, 5.0, 'oak-tree', 250, 1.05],
  [-10.5, -2.4, 'oak-tree', 330, 1.1], [-10.2, 4.0, 'oak-tree', 140, 0.95], [-8.5, 6.8, 'oak-tree', 15, 1.0],
  [7.5, 6.8, 'oak-tree', 190, 1.0],
  [-8.6, -2.4, 'oak-tree', 75, 0.85], [8.6, 2.4, 'willow-tree', 220, 0.8],
];
for (const [x, z, a, yaw, scale] of TREES) put(a, x, z, { yaw, scale: +(scale * 0.7).toFixed(2) });
const EDGE = [
  [-9.2, -5.2, 'bush'], [-6.0, -5.6, 'bush'], [-8.2, 2.2, 'bush'], [-9.5, 6.0, 'bush'], [-5.8, 6.4, 'bush'],
  [4.6, 6.0, 'bush'], [5.4, 6.0, 'bush'], [8.4, 3.0, 'bush'], [9.2, -4.8, 'bush'], [7.4, -2.2, 'bush'], [4.6, -6.0, 'bush'],
  [-7.6, 1.8, 'boulder'], [-2.3, -5.5, 'boulder'], [8.0, 5.0, 'rock-cluster'], [4.2, 5.6, 'rock-cluster'], [9.6, -2.2, 'boulder'], [-9.6, -3.4, 'rock-cluster'],
  [-4.2, 5.6, 'wildflowers'], [4.2, 2.6, 'wildflowers'], [-8.4, -0.6, 'wildflowers'], [6.8, 1.2, 'wildflowers'], [8.6, 7.6, 'wildflowers'],
  [4.4, -3.8, 'tall-grass'], [-1.8, 4.2, 'tall-grass'], [-7.6, 5.0, 'tall-grass'], [5.4, -6.6, 'tall-grass'],
];
EDGE.forEach(([x, z, a], i) => put(a, x, z, { yaw: (i * 67) % 360 }));

// Figures
put('adventurer', -7.4, 0.4, { yaw: 90 });

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/bridge.ts', `// GENERATED by scripts/design-bridge.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/bridge.md', `# Bridge crossing - map plan (generated)

GENERATED by \`scripts/design-bridge.mjs\`.

13 x 9 tiles of 2 m (26 x 18 m). River down column 0 (river-straight), cobble road along row 0 over the bridge.
West bank: toll guard post, crates, barrels, signpost, hay. East bank: fishing spot (stump, bucket, net, log), hut, fence.
Rowboats on the river, reeds and cattails along both banks, oak and willow ring.

| component | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log('wrote', places.length, 'places');
