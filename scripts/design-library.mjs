#!/usr/bin/env node
// Library hall map designer. Room 12 m (X) x 10 m (Z): x -6..6, z -5..5.
// Walls on the north (z=-5) and west (x=-6); south and east are the open cutaway.
// Writes scenes/maps/library.ts and docs/map-mockups/library.md.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// Floor: 6 x 5 tiles of 2 m.
for (let c = 0; c < 6; c++) for (let r = 0; r < 5; r++) put('stone-floor', -5 + 2 * c, -4 + 2 * r);

// Walls (1.5 m tall, 2 m long). North faces +Z, west faces +X (yaw 90).
for (let i = 0; i < 6; i++) put(i % 2 ? 'timber-wall' : 'plaster-wall', -5 + 2 * i, -5);
for (let i = 0; i < 5; i++) put(i % 2 ? 'timber-wall' : 'plaster-wall', -6, -4 + 2 * i, { yaw: 90 });

// North bookcases (1.2 m wide, 2.05 m tall), x from -4.7 to 4.9.
const north = [];
for (let i = 0; i < 9; i++) {
  const x = -4.7 + 1.2 * i;
  north.push(x);
  put('bookcase', x, -4.72);
}
// West bookcases, z from -3.7 to 2.3 (6), fireplace corner at the south end.
const west = [];
for (let i = 0; i < 6; i++) {
  const z = -3.7 + 1.2 * i;
  west.push(z);
  put('bookcase', -5.72, z, { yaw: 90 });
}
put('fireplace', -5.55, 4.0, { yaw: 90 }); // fireplace corner
put('candelabra', -5.1, 2.9, {});
put('chest', -3.6, 4.4, {});
put('barrel', -5.1, -0.3 + 0, { yaw: 0 }); // placeholder replaced below

// Remove the placeholder barrel; the ladder takes the west bay.
places.pop();
put('ladder', -5.15, -0.6, { yaw: 90 });

// Tops of bookcases: tomes and spellbooks.
north.forEach((x, i) => {
  put(i % 2 ? 'tome' : 'spellbook', x - 0.2, -4.72, { y: 2.05 });
  if (i % 3 === 0) put('tome', x + 0.25, -4.72, { y: 2.05 });
});
west.forEach((z, i) => {
  put(i % 2 ? 'spellbook' : 'tome', -5.72, z + 0.1, { y: 2.05, yaw: 90 });
  put('tome', -5.72, z - 0.3, { y: 2.05, yaw: 90 });
});

// Central rug and chandelier (focal light).
put('rug', 0.2, 0.2, { scale: 2.2 });
put('chandelier', 0.2, 0.2, { y: 2.7, scale: 1.6 });

// Three reading tables (desks) with chairs, books, candles.
const desks = [
  [-2.6, 2.7], // front-left
  [3.0, 2.7], // front-right
  [2.4, -2.3], // back-right
];
desks.forEach(([x, z], i) => {
  put('desk', x, z);
  put(i === 1 ? 'spellbook' : 'tome', x - 0.25, z, { y: 0.75 });
  put('spellbook', x + 0.1, z + 0.05, { y: 0.75 });
  put('scroll', x + 0.35, z - 0.05, { y: 0.75 });
  put('candle', x - 0.45, z - 0.15, { y: 0.75 });
  put('candle', x + 0.45, z + 0.15, { y: 0.75 });
  put('chair', x - 0.1, z + 0.75, { yaw: 180 });
  put('stool', x + 0.75, z + 0.45, { yaw: 30 });
});

// Lectern near the north shelves.
put('lectern', -2.2, -3.6, { yaw: 0 });
put('tome', -2.2, -3.6, { y: 1.0 });

// Focal globe-like object: orb on a stool, east side.
put('pillar', 4.9, 0.0);
put('orb', 4.9, 0.0, { y: 1.43, scale: 2.5 });
put('magic-crystal', 5.2, -3.6, { scale: 0.8 });

// Freestanding bookshelves (1.5 m) forming an island row on the east edge.
for (const z of [2.0, 3.3]) put('bookshelf', 5.5, z, { yaw: 90 });
put('bookshelf', 0.2, 4.55, { yaw: 0 }); // south edge low shelf

// Floor dressing: tome stacks, candles at edges, crates, barrels, bench.
const stacks = [];
stacks.forEach(([x, z], i) => {
  const n = 3 + (i % 2);
  for (let k = 0; k < n; k++) put(k % 2 ? 'spellbook' : 'tome', x + (k % 2) * 0.02, z, { y: 0.08 * k, yaw: (k * 23 + i * 40) % 360 });
});
const candlesFloor = [[-3.8, 4.7], [-1.0, 4.7], [1.7, 4.7], [4.1, 4.7], [5.6, 4.7], [5.0, 2.0], [5.6, -1.6], [-4.6, 1.0], [5.0, 3.3]];
candlesFloor.forEach(([x, z]) => put('candle', x, z));
put('candelabra', 4.2, 3.9);
put('candelabra', -3.4, -3.2);
put('crate', -5.0, 5 - 0.4 - 0.2 - 0.9, { yaw: 90 });
put('barrel', 5.4, -3.9);
put('barrel', 4.7, -4.3);
put('bench', 0.6, -3.4, { yaw: 0 });
put('stool', -3.8, 0.3, { yaw: 20 });
put('stool', 2.1, 0.8, { yaw: 90 });
// Candles on bookcase tops and desks fill remaining accent spots.
north.forEach((x, i) => { if (i % 2 === 0) put('candle', x + 0.45, -4.72, { y: 2.05 }); });
west.forEach((z, i) => { if (i % 2 === 1) put('candle', -5.72, z + 0.45, { y: 2.05 }); });

// South half: second reading nook, SW bookcases, potted plants.
put('desk', -0.2, 4.0, { yaw: 180 });
put('spellbook', -0.3, 4.0, { y: 0.75, yaw: 180 });
put('candle', 0.25, 4.0, { y: 0.75 });
put('chair', -0.2, 3.3, { yaw: 0 });
put('candelabra', -1.2, 4.3);
for (let i = 0; i < 3; i++) put('bookshelf', -3.4 + 1.1 * i, 4.7, { yaw: 0 });
for (const [x, z] of [[-4.6, 4.5], [4.6, 4.3], [-1.3, -3.9]]) {
  put('pot', x, z);
  put('fern', x, z, { y: 0.3, scale: 0.8 });
}
// Bounds check.
const bad = places.filter((p) => Math.abs(p.at[0]) > 6.0 || Math.abs(p.at[2]) > 5.0).filter((p) => !['wood-floor', 'plaster-wall', 'timber-wall'].includes(p.asset));
if (bad.length) console.warn('OUT OF BOUNDS', JSON.stringify(bad));

const fmt = (p) => {
  const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
  return `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
};
writeFileSync('scenes/maps/library.ts', `// GENERATED by scripts/design-library.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/library.md', `# Library hall — map plan (generated)

GENERATED by \`scripts/design-library.mjs\`. Room 12 m x 10 m (x -6..6, z -5..5), walls north and west, roof off.

## Layout
- North wall: 9 bookcases. West wall: 6 bookcases, ladder bay, fireplace corner (SW).
- Centre: rug under a chandelier. Three reading desks (front-left, front-right, back-right) with chairs, books, candles.
- Focal object: orb (scaled 3x) on a stool, east side, with a magic-crystal behind. Lectern by the north shelves.
- Edge dressing: tome stacks, floor candles, barrels, crates, chests, bench, east bookshelf row.

## Tally (${places.length} placements)
${Object.entries(tally).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## Notes
No globe asset exists; the orb stands in. No plant asset exists for the mockup's potted plants.
`);
console.log('wrote', places.length, 'places', JSON.stringify(tally));
