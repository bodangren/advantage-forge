#!/usr/bin/env node
// Mountain city map designer: 14 x 12 tiles of 2 m (28 m x 24 m). Terraces at y 0 / 1.2 / 2.4
// held by rock-wall chains, stone stairs between them, a frozen plaza, peaks on the west and east.
// Cell (c,r) centre: x = (c-7.5)*2, z = (r-6.5)*2. +X east, -Z north.
import { writeFileSync } from 'node:fs';

const X = (c) => (c - 7.5) * 2;
const Z = (r) => (r - 6.5) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const LO = 1.2, HI = 2.4;
const STAIRS = [[5, 8], [10, 8], [5, 4], [11, 5]]; // stair cells; the flight climbs north
const isStair = (c, r) => STAIRS.some(([a, b]) => a === c && b === r);
const h = (c, r) => {
  if (c <= 3 || c === 14 || r >= 8) return 0;
  if (c >= 4 && c <= 6 && r <= 3) return HI;
  if (c >= 7 && c <= 8 && r <= 3) return LO;
  if (c >= 9 && c <= 13 && r <= 4) return HI;
  return LO;
};
const cellH = (c, r) => (isStair(c, r) ? h(c, r - 1) - (h(c, r - 1) - h(c, r)) : h(c, r));
const hh = (c, r) => (c < 1 || c > 14 || r < 1 || r > 12 ? -1 : isStair(c, r) ? (r === 8 ? 0 : LO) : h(c, r));
const ICE = (c, r) => c >= 4 && c <= 9 && r >= 9 && r <= 11;
const MOUNT = (c, r) => c <= 3 || c === 14 || r === 12;

// --- ground tiles
for (let c = 1; c <= 14; c++)
  for (let r = 1; r <= 12; r++) {
    const y = hh(c, r);
    const kind = ICE(c, r) ? 'ice-ground' : MOUNT(c, r) ? 'snow-ground' : (c + r * 3) % 7 === 0 && h(c, r) > 0 ? 'snow-ground' : 'stone-ground';
    put(kind, X(c), Z(r), { y });
  }

// --- terrace walls: on the higher cell, outer face on the shared edge
const DIRS = [[0, 1, 0, 1], [0, -1, 180, -1], [1, 0, 90, 0], [-1, 0, 270, 0]]; // dc,dr,yaw
let walls = 0;
for (let c = 1; c <= 14; c++)
  for (let r = 1; r <= 12; r++) {
    const a = hh(c, r);
    if (a <= 0) continue;
    for (const [dc, dr, yaw] of DIRS) {
      const b = hh(c + dc, r + dr);
      if (b < 0 && dr === -1) continue; // back edge, never seen
      if (b < 0 || a - b < 0.5) continue;
      if (dr === -1 && isStair(c, r - 1) && false) continue;
      // a flight reaches the north edge of its stair cell: no wall there
      if (isStair(c + dc, r + dr) && dr === 1 && false) continue;
      if (dr === 1 && isStair(c, r + 1) && false) continue;
      if (isStair(c + dc, r + dr) && dr === 1) continue; // stair cell lies south of this high cell
      const ex = X(c) + dc * 1, ez = Z(r) + dr * 1; // edge midpoint
      put('rock-wall', ex - dc * 0.5, ez - dr * 0.5, { y: a + 0.1 - 2.6, yaw });
      walls++;
    }
  }
// stairs
for (const [c, r] of STAIRS) put('stairs-stone', X(c), Z(r) - 0.2, { y: hh(c, r) });

// south rim of the plaza (low wall blocks)
for (let x = -6.6; x <= 12.7; x += 1.7) put('rock-wall', x, 11.4, { y: -1.7, scale: 0.85 });
put('rock-wall', 13.1, 10.8, { y: -1.7, scale: 0.7, yaw: 90 });
put('rock-wall', -7.4, 10.8, { y: -1.7, scale: 0.7, yaw: 90 });

// --- peaks (ice spires with rock feet)
const PEAKS = [
  [-12, -9, 3.4], [-10.5, -4.5, 3.0], [-12.2, -0.5, 3.6], [-9.6, 2.6, 2.8], [-12, 5, 3.3], [-9.5, 8.6, 2.5], 
  [12.6, -9.5, 3.2], [13, -4, 2.9], [12.8, 1.5, 3.4],  [-5, -11.2, 2.6], [1, -11.4, 2.2],
];
PEAKS.forEach(([x, z, s], i) => {
  const y = x > -8 && x < 12 && z < -10 ? (x < -2 ? HI : LO) : 0;
  put('ice-spire', x, z, { y, scale: s, yaw: i * 47 });
});
const FEET = [[-11.5, -6.5, 1.5, 20], [-11.8, -2, 1.7, 100], [-10.5, 1.2, 1.4, 200], [-11.6, 7.2, 1.6, 300], [-10.5, 4.2, 1.2, 40],
  [-11.5, -10.8, 1.5, 90], [12.2, -7, 1.6, 160], [12.4, -1.5, 1.6, 250], [12.4, 4, 1.5, 10], [12.2, 8.4, 1.4, 120], [-8.6, -6.2, 1.1, 330], [-8.8, 6.4, 1.2, 70]];
for (const [x, z, s, yaw] of FEET) put('boulder', x, z, { scale: s * 2, yaw });
for (const [x, z, s, yaw] of [[-10, -2.6, 1.3, 40], [-9.2, 0, 1.0, 150], [11.4, -4.6, 1.2, 80], [11.2, 2.8, 1.1, 210], [-10.6, 9.2, 1.0, 10], [11.8, 10, 1.1, 300]]) put('boulder', x, z, { scale: s, yaw });

// --- focal hall and temple (high east terrace, y 2.4)
put('sandstone-house', 6, -8.2, { y: HI, yaw: 0 });
put('tower', 10.8, -8.8, { y: HI, scale: 0.8 });
put('column', 3.6, -4.6, { y: HI, yaw: 0 }); put('column', 8.6, -4.6, { y: HI });
put('brazier', 4.6, -4.4, { y: HI }); put('brazier', 7.6, -4.4, { y: HI });
put('banner', 3.4, -6.2, { y: HI, yaw: 0 }); put('banner', 9.2, -5.6, { y: HI, yaw: 0 });
put('torch', 10.8, -4.6, { y: HI }); put('statue', 11.4, -5.4, { y: HI, yaw: 200, scale: 0.8 });
put('snowbank', 3.6, -10.4, { y: HI }); put('snowbank', 12.1, -6.2, { y: HI, yaw: 90 });
put('lantern', 5.1, -5.6, { y: HI }); put('lantern', 9.4, -4.5, { y: HI });

// --- NW platform (y 2.4): a lookout hut, flag
put('cottage', -5.4, -8.6, { y: HI, yaw: 20 });
put('flag', -3.2, -6.2, { y: HI, yaw: 0, scale: 1.3 });
put('barrel', -7.4, -6.6, { y: HI }); put('crate', -7.1, -7.4, { y: HI, yaw: 25 });
put('snowbank', -7.6, -10.4, { y: HI, yaw: 0 }); put('torch', -3.4, -4.9, { y: HI });

// --- forge yard (y 1.2) under the bridge
put('forge', 0, -6.7, { y: LO });
put('chimney', 0.9, -8.2, { y: LO }); // flue stack beside the hearth
put('smoke', 0, -6.7, { y: LO + 2.0, scale: 1.6 }); put('smoke', 0.1, -6.7, { y: LO + 2.8, scale: 1.3 });
put('smoke', 0.9, -8.2, { y: LO + 1.7, scale: 1.3 });
put('anvil', -1.0, -5.4, { y: LO, yaw: 30 }); put('bellows', 1.2, -5.5, { y: LO, yaw: 200 });
put('barrel', -1.5, -7.6, { y: LO }); put('crate', 1.6, -4.8, { y: LO, yaw: 10 });
put('torch', -1.6, -4.8, { y: LO }); put('banner', 1.5, -9.5, { y: LO, yaw: 0, scale: 0.9 });
put('bridge', 0, -10.4, { y: HI });

// --- mid terrace (y 1.2): market, well, banners, guards
put('market-tent', -8, 0.3, { y: LO, yaw: 10 }); put('market-tent', 10.4, 0, { y: LO, yaw: 180 });
put('well', -3, -1.3, { y: LO }); put('banner', -5.4, -1.8, { y: LO, yaw: 0 }); put('banner', -0.6, -1.2, { y: LO, yaw: 0 });
put('brazier', 4.4, -1.6, { y: LO }); put('brazier', 8.4, -1.6, { y: LO });
put('lantern', 6.4, -1.8, { y: LO }); put('lantern', -6.6, 1.8, { y: LO });
put('barrel', -6.5, 2.6, { y: LO }); put('barrel', -6.0, 3.2, { y: LO }); put('crate', 3.4, 1.8, { y: LO, yaw: 40 });
put('crate', 3.9, 2.4, { y: LO, yaw: 15 }); put('anvil', 7, 3.2, { y: LO, yaw: 280 });
put('snowbank', 1.4, 2.6, { y: LO });
put('guard', 11.2, -1.8, { y: LO, yaw: 180 });
put('signpost', -4.6, 3.4, { y: LO, yaw: 20 });
put('pine-tree', -6.8, -1.5, { y: LO, scale: 0.9 }); put('pine-tree', 12.1, 2.7, { y: LO, scale: 0.8 });

// --- frozen plaza (y 0)
put('statue', 1.5, 5.4, { yaw: 160, scale: 0.9 });
put('torch', -2.6, 5.0); put('torch', 4.6, 5.0); put('brazier', 6.8, 6.8); put('brazier', -5.6, 6.8);
put('banner', -7.4, 8.2, { yaw: 0 }); put('banner', 11.6, 7.6, { yaw: 0 });
put('boulder', -8, 8, { scale: 1.1 }); put('snowbank', -3, 10.2);
put('crate', 11.8, 5.8, { yaw: 30 }); put('barrel', 12.2, 6.4); put('barrel', 11.6, 6.9);
put('pine-tree', -10, 11, { scale: 1.0 }); put('pine-tree', 11.5, 11, { scale: 0.9 });
put('pine-tree', -10.4, 5.4, { scale: 1.1 }); put('pine-tree', 12.5, 0, { scale: 1.0, y: 0 });
put('guard', 3.2, 8, { yaw: 180 }); put('adventurer', 0, 8.2, { yaw: 0 });


// --- output
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `    { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${num(p.scale)}` : ''} },`;
writeFileSync('scenes/maps/mountain-city.ts', `// GENERATED by scripts/design-mountain-city.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/mountain-city.md', `# Mountain city - map plan (generated)

GENERATED by \`scripts/design-mountain-city.mjs\`. 14 x 12 tiles of 2 m (28 m x 24 m); cell (c,r) centre x=(c-7.5)*2, z=(r-6.5)*2.

## Layout

- South: frozen plaza (ice-ground) at y 0, statue, braziers, low rock-wall rim.
- Middle: terrace at y 1.2 with market tents, well, banners; reached by stone stairs at c5 and c10.
- West top (y 2.4): lookout cottage and flag. Centre-north (y 1.2): forge yard with smoke under a bridge.
- East top (y 2.4): sandstone hall and tower temple, reached by a flight at c11.
- Rock-wall chains hold every terrace edge. Ice spires and cliff feet ring the west and east.

## Tally (${places.length} placements)

| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}
`);
console.log('wrote', places.length, 'places;', walls, 'terrace walls');
console.log(JSON.stringify(tally));
