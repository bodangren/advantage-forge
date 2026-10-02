#!/usr/bin/env node
// Cliff village map designer: terraced stone village on a rock face (P2 map).
// Grid: 12 x 10 tiles of 2 m. Cell (c,r) center: x = (c-5.5)*2, z = (r-4.5)*2. +X east, -Z north.
// Heights: lowland y=0; mid terrace top y=2.6; upper terrace top y=5.2 (one rock-wall = 2.6 m).
// Rock walls face outward from each raised cell edge. The river runs down col 9 on the mid terrace.
// Anchor: docs/map-mockups/cliff-village.jpg.
import { writeFileSync } from 'node:fs';

const X = (c) => (c - 5.5) * 2;
const Z = (r) => (r - 4.5) * 2;
const places = [];
const put = (asset, x, y, z, o = {}) => {
  const p = { asset, at: [x, y, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const MID = 2.6, UP = 5.2;
const isBlock = (c, r) => c >= 1 && c <= 10 && r >= 1 && r <= 6;
const isUpper = (c, r) => c >= 2 && c <= 5 && r >= 1 && r <= 3;
const H = (c, r) => (isUpper(c, r) ? UP : isBlock(c, r) ? MID : 0);
const isRiver = (c, r) => c === 9 && r >= 1 && r <= 6;
const isLowRiver = (c, r) => c === 9 && r >= 7;

// --- ground ----------------------------------------------------------------
for (let c = 0; c <= 11; c++)
  for (let r = 0; r <= 9; r++) {
    const h = H(c, r);
    if (isRiver(c, r)) put('river-straight', X(c), h, Z(r));
    else if (isLowRiver(c, r)) put('river-straight', X(c), 0, Z(r));
    else if (h === 0 && r === 8 && c >= 1 && c <= 8) put('footpath-straight', X(c), 0, Z(r), { yaw: 90 });
    else if (h === 0 && c === 3 && r === 7) put('footpath-straight', X(c), 0, Z(r));
    else if (h === MID && c >= 5 && c <= 8 && r >= 3 && r <= 5) put('stone-ground', X(c), h, Z(r)); // village plaza
    else put(h === 0 && r >= 7 ? 'meadow-ground' : h === 0 ? 'forest-ground' : 'grass-ground', X(c), h, Z(r));
  }

// --- cliff walls (outward from every edge that drops) ------------------------
const DIRS = [
  [0, 1, 0, 0.4, 1], // south: yaw 0
  [0, -1, 180, -0.4, -1],
  [1, 0, 90, 0.4, 1],
  [-1, 0, 270, -0.4, -1],
];
for (let c = 0; c <= 11; c++)
  for (let r = 0; r <= 9; r++) {
    const h = H(c, r);
    if (h === 0) continue;
    for (const [dc, dr, yaw, off] of DIRS) {
      const nh = H(c + dc, r + dr);
      if (nh >= h) continue;
      const edgeX = X(c) + dc, edgeZ = Z(r) + dr;
      for (let y = nh; y < h - 0.01; y += 2.6) {
        const wx = dc ? edgeX + off : X(c), wz = dr ? edgeZ + off : Z(r);
        // a river cell dropping south is the waterfall lip: still rock below it
        put('rock-wall', wx, y, wz, { yaw });
      }
    }
  }

// --- boulders at cliff feet and shoulders -------------------------------------
for (const [x, z, s] of [[-9.6, 7.4, 1.2], [-6, 7.2, 0.9], [-0.5, 7.3, 1.1], [3.6, 7.3, 0.8], [9.8, 7.4, 1.3], [10.9, 3, 1.0], [-10.9, 0, 1.2], [-10.8, 5, 0.9], [10.8, -4, 1.1], [4.8, 7.1, 0.7]])
  put(rnd() > 0.5 ? 'boulder' : 'rock-cluster', x, 0, z, { yaw: Math.floor(rnd() * 360), scale: s });

// --- upper terrace: the big house and the lookout ----------------------------
put('cottage', -4.6, UP, -5.4, { yaw: 0, scale: 1.1 });
put('cottage', -7.0, UP, -3.8, { yaw: 90, scale: 0.7 });
put('fence', -2.2, UP, -2.5, { yaw: 0 });
put('fence', -1.0, UP, -3.5, { yaw: 90 });
put('banner', -1.2, UP, -6.4, { yaw: 0 });
put('lantern', -6.0, UP, -2.3);
put('lantern', -2.6, UP, -4.2);
put('barrel', -7.2, UP, -6.8); put('barrel', -6.6, UP, -7.2); put('crate', -2.0, UP, -7.2);
put('rope-coil', -3.0, UP, -3.0, { yaw: 40 });
put('bush', -7.4, UP, -2.6, { yaw: 20, scale: 0.8 });
put('wildflowers', -3.8, UP, -3.3);
put('hay-bale', -7.2, UP, -5.0, { yaw: 30 });

// --- mid terrace east: village plaza ------------------------------------------
put('cottage', 3.2, MID, -0.2, { yaw: 0 });
put('well', 5.8, MID, 2.8, { yaw: 20 });
put('hut', -1.8, MID, 0.6, { yaw: 10 });
put('water-trough', 2.4, MID, 3.2, { yaw: 170 });
put('signpost', 0.6, MID, 3.4, { yaw: 200 });
put('barrel', 1.2, MID, -1.8); put('barrel', 1.8, MID, -2.2, { scale: 0.9 }); put('crate', 4.8, MID, -2.2, { yaw: 30 });
put('crate', 5.4, MID, -2.0, { yaw: 70, scale: 0.8 });
put('hay-bale', 5.2, MID, 0.3, { yaw: 40 });
put('banner', 0.2, MID, -0.6, { yaw: 20 });
put('banner', 7.0, MID, 3.6, { yaw: 180, scale: 0.8 });
put('lantern', 2.0, MID, 1.8); put('lantern', 6.2, MID, -0.8); put('lantern', -3.8, MID, 2.4);
put('clothesline', -4.0, MID, 3.4, { yaw: 0 });
put('rope-coil', 4.4, MID, 3.6, { yaw: 90 });
put('villager', 3.8, MID, 2.0, { yaw: 160 });
put('farmer', -0.4, MID, 2.4, { yaw: 100 });
// fence along the south cliff lip
for (const x of [-9.2, -7.2, -5.2, -3.2, -1.2, 0.8, 2.8, 4.8]) put('fence', x, MID, 3.8);
// bridge over the river and the east sliver
put('bridge', 7.0, MID, -3.4, { yaw: 0, scale: 0.9 });
put('hut', 9.2, MID, -0.8, { yaw: 270, scale: 0.75 });
put('torch', 9.2, MID, 2.2);
put('hay-bale', 9.2, MID, 3.0, { yaw: 70 });
put('rock-cluster', 9.2, MID, -5.4, { yaw: 120, scale: 0.9 });
// fence on the east lip beside the river
for (const z of [-6.6, -5.2]) put('fence', 6.0, MID, z, { yaw: 90, scale: 0.7 });
// mid terrace west: goat pasture
put('tower', -8.6, MID, 1.2, { yaw: 0, scale: 0.5 });
put('boulder', -9.0, MID, 3.4, { yaw: 80, scale: 0.8 });
put('rock-cluster', -6.5, MID, 2.8, { yaw: 200, scale: 0.8 });
put('stairs-stone', -4.0, MID, 0.0, { yaw: 270 });
for (const [x, z] of [[-6, 0.6], [-7.6, 3], [-3.6, 2.4], [-8.8, -0.8], [-1.0, 2.6]]) put('tall-grass', x, MID, z, { yaw: Math.floor(rnd() * 360) });
for (const [x, z] of [[-5.6, 3.4], [-0.4, 3.2], [4.0, 3.6], [8.4, 3.2], [8.6, -6.2]]) put('wildflowers', x, MID, z, { yaw: Math.floor(rnd() * 360) });
for (const [x, z] of [[-9.4, 3.6], [-9.4, -1.6], [8.9, 3.4], [-0.2, -2.0]]) put('bush', x, MID, z, { yaw: Math.floor(rnd() * 360), scale: 0.8 });
// mid terrace north strip behind the upper house
for (const x of [0.2, 2.4, 4.6]) put('bush', x, MID, -6.6, { yaw: Math.floor(rnd() * 360) });
put('pine-tree', 1.8, MID, -5.2, { scale: 0.5 }); put('pine-tree', 4.4, MID, -4.6, { scale: 0.45 });
put('pine-tree', -9.2, MID, -5.8, { scale: 0.5 });

// --- ladders up the cliff faces and a landing --------------------------------
// ladder from the mid terrace up to the upper house terrace (face of cols 2..5 south edge z=-2)
put('ladder', -3.6, MID + 0.6, -1.0 + 0.2, { yaw: 0 }); // leans on the upper wall face (wall spans z -2..-1.1)
put('ladder', -6.0, MID + 0.6, -1.1, { yaw: 0 });
// ladders from the lowland up the south cliff
put('ladder', -4.0, 0.6, 7.3 - 0.4 + 0.0, { yaw: 0 });
put('ladder', 2.0, 0.6, 7.3 - 0.4, { yaw: 0 });
put('stairs-stone', -4.0, 0, 7.2 - 0.2 - 1.0 + 1.8, { yaw: 180 });
put('rope-coil', -3.2, 0, 7.3);

// --- lowland: meadow, goat paths, lookout ------------------------------------
put('hut', 6.2, 0, 8.4, { yaw: 180, scale: 0.9 });
put('well', -8.0, 0, 8.4, { yaw: 40, scale: 0.8 });
put('fence', -6.2, 0, 9.4, { yaw: 0 }); put('fence', -4.4, 0, 9.4, { yaw: 0 }); put('fence', -2.6, 0, 9.4, { yaw: 0 });
put('signpost', 0.4, 0, 7.5, { yaw: 160 });
put('barrel', 3.8, 0, 7.8); put('crate', 4.4, 0, 8.0, { yaw: 50 }); put('lantern', 0.8, 0, 8.7);
put('banner', 8.4, 0, 8.3, { yaw: 180 });
put('villager', -2.0, 0, 8.6, { yaw: 90 });
for (let i = 0; i < 9; i++) put('tall-grass', -9.5 + i * 2.1 + rnd(), 0, 9.3 + (rnd() - 0.5) * 0.4, { yaw: Math.floor(rnd() * 360) });
for (const [x, z] of [[-7.6, 7.6], [-1.6, 7.5], [1.6, 9.2], [8.6, 7.8]]) put('wildflowers', x, 0, z, { yaw: Math.floor(rnd() * 360) });
for (const [x, z] of [[-10.6, 8.6], [10.6, 9.0], [-1.0, 9.6], [8.0, 9.6]]) put('bush', x, 0, z, { yaw: Math.floor(rnd() * 360), scale: 0.9 });
put('stepping-stone', 7.0, -0.06, 8.0); put('stepping-stone', 7.0, -0.06, 8.7);

// --- backdrop and flanks: pines on the lowland ring -------------------------
for (let c = 0; c <= 11; c++) {
  if (c >= 2 && c <= 9) {
    put('pine-tree', X(c) + (rnd() - 0.5), 0, -9.0 + rnd() * 0.5, { scale: 0.5 + rnd() * 0.25, yaw: Math.floor(rnd() * 360) });
    if (c % 2 === 0) put('pine-tree', X(c) + 1, 0, -9.9 + rnd() * 0.3, { scale: 0.7 + rnd() * 0.2, yaw: Math.floor(rnd() * 360) });
  }
}
for (let r = 0; r <= 9; r++) {
  if (r <= 6) {
    put('pine-tree', -11.2, 0, Z(r) + 0.3, { scale: 0.5 + rnd() * 0.2, yaw: Math.floor(rnd() * 360) });
    put('pine-tree', 11.2, 0, Z(r) - 0.3, { scale: 0.5 + rnd() * 0.2, yaw: Math.floor(rnd() * 360) });
  }
}
for (const [x, z] of [[-10.4, -9.4], [10.4, -9.4], [-10.8, 6.6]]) put('pine-tree', x, 0, z, { scale: 0.65, yaw: Math.floor(rnd() * 360) });
for (let i = 0; i < 8; i++) put(i % 3 ? 'bush' : 'tall-grass', -10.8 + (i % 2) * 21.6, 0, -8 + i * 2, { yaw: Math.floor(rnd() * 360), scale: 0.8 });

// --- checks and output ---------------------------------------------------------
const bad = places.filter((p) => Math.abs(p.at[0]) > 12 || Math.abs(p.at[2]) > 10);
if (bad.length) console.log('out of bounds:', bad.map((p) => p.asset + '@' + p.at.join(',')).join(' '));
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `    { asset: '${p.asset}', at: [${p.at.map(num).join(', ')}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/cliff-village.ts', `// GENERATED by scripts/design-cliff-village.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/cliff-village.md', `# Cliff village (generated)

GENERATED by \`scripts/design-cliff-village.mjs\`. 24 m x 20 m, 12 x 10 tiles of 2 m. Anchor: cliff-village.jpg.

Three levels: lowland y=0 (meadow, footpath, hut, well), mid terrace y=2.6 (plaza: cottage, well, trough, goat pasture, river in col 9 with a bridge), upper terrace y=5.2 (big cottage, lookout, banners).
Rock walls (2.6 m each) face every drop. Ladders and a stair climb the faces. Pines ring the lowland.
Missing: waterfall - a falling-water sheet for the river lip at the mid terrace south edge.

| component | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log('wrote', places.length, 'places', JSON.stringify(tally));
