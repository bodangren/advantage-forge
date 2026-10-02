#!/usr/bin/env node
// Courthouse map designer: 14 m x 12 m courtroom (7 x 6 tiles of 2 m), north and west walls standing.
// x east (-7..7), z south (-6..6); north = judge bench. Writes scenes/maps/courthouse.ts and
// docs/map-mockups/courthouse.md.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const D = 0.3; // dais height (one tile slab)

// Floor: 7 x 6 wood tiles, the public aisle in the middle.
for (let c = 0; c < 7; c++) for (let r = 0; r < 6; r++) put('wood-floor', -6 + c * 2, -5 + r * 2);
// Dais: raised tiles under the bench.
for (const x of [-2, 0, 2]) put('wood-floor', x, -5, { y: D });
// Rugs: judge aisle and the well.
put('rug', 0, 3.2, { yaw: 90, scale: 2 });
put('rug', 0, -1.2, { scale: 1.8 });
put('rug', 0, -3.3, { y: D, scale: 1.7 });

// Walls: north (z=-6) and west (x=-7).
const north = ['plaster-wall', 'plaster-wall-window', 'plaster-wall', 'plaster-wall', 'plaster-wall', 'plaster-wall-window', 'plaster-wall'];
north.forEach((a, i) => put(a, -6 + i * 2, -6));
const west = ['plaster-wall', 'plaster-wall-window', 'plaster-wall', 'plaster-wall-window', 'plaster-wall', 'plaster-wall-door'];
west.forEach((a, i) => put(a, -7, -5 + i * 2, { yaw: 90 }));
// Low rail along the open south and east sides.
for (let i = 0; i < 7; i++) put('railing', -6 + i * 2, 6);
for (let i = 0; i < 6; i++) put('railing', 7, -5 + i * 2, { yaw: 90 });

// Corner columns, wall sconces, banners, curtains.
for (const [x, z] of [[-6.7, -5.7], [6.7, -5.7], [6.7, 5.7], [-6.7, 5.7]]) put('column', x, z);
for (const x of [-5, -3, -1, 1, 3, 5]) put('torch-sconce', x, -5.85);
for (const z of [-4, -2, 0, 2, 4]) put('torch-sconce', -6.85, z, { yaw: 90 });
for (const x of [-5.4, -2.9, 2.9, 5.4]) put('banner', x, -5.7);
for (const x of [-4, 4]) put('curtain', x, -5.85);
for (const z of [-2.3, 3.6]) put('banner', -6.7, z, { yaw: 90 });

// Judge bench on the dais, throne behind, clerk, scales statue, flanking pieces.
put('throne', 0, -5.5, { y: D });
for (const x of [-1.2, 0, 1.2]) put('desk', x, -4.4, { y: D, scale: 1.1 });
put('chair', -2.6, -5.2, { y: D });
put('chair', 2.6, -5.2, { y: D });
put('scroll', -1.2, -4.4, { y: D + 0.78 });
put('candle', 1.2, -4.4, { y: D + 0.78 });
put('column', 4.6, -3.8, { scale: 0.35 });
put('scales', 4.6, -3.8, { y: 0.77, scale: 1.8 });
put('statue', -4.6, -4.2);
put('bookshelf', -2.9, -5.6);
put('bookshelf', 2.9, -5.6);
for (const x of [-3.3, 3.3]) put('lantern', x, -3.6, { scale: 0.7 });

// Witness stand (east of the bench): lectern, rail, chair.
put('lectern', 5.3, -1.5, { yaw: 270 });
put('chair', 6.1, -1.5, { yaw: 270 });
for (const z of [-2.6, -0.4]) put('railing', 4.3, z - 0, { yaw: 90, scale: 0.6 });
put('stool', 5.3, -2.5);
put('scroll', 5.3, -1.5, { y: 1.0 });

// Jury box (west): two rows of benches facing east, rail in front.
for (const z of [-2.6, -1.0, 0.6]) {
  put('bench', -5.7, z, { yaw: 90 });
  put('bench', -4.9, z, { yaw: 90 });
}
for (const z of [-2.8, -1.4, 0, 1.4]) put('stool', -4.4, z);
for (const z of [-1.5, 0.3]) put('railing', -3.8, z, { yaw: 90 });
put('pot', -6.4, 1.6); put('pot', -6.4, -3.6);

// Counsel tables in the well, with chairs and papers.
for (const x of [-2.2, 2.2]) {
  put('table', x, -0.6);
  put('table', x + (x < 0 ? 0.95 : -0.95), -0.6);
  put('chair', x, 0.4, { yaw: 180 });
  put('chair', x + (x < 0 ? 0.95 : -0.95), 0.4, { yaw: 180 });
  put('scroll', x, -0.6, { y: 0.62 });
  put('candle', x + (x < 0 ? 0.95 : -0.95), -0.6, { y: 0.62 });
}
// Bar rail dividing the well from the public, gap on the aisle.
for (const x of [-4.8, -2.8, 2.8, 4.8]) put('railing', x, 1.5);
put('railing', -6.3, 1.5, { scale: 0.5 });
put('railing', 6.3, 1.5, { scale: 0.5 });
// Public benches: four rows each side of the aisle.
for (const z of [2.6, 3.7, 4.8]) {
  for (const x of [-1.75, -3.35, -4.95]) put('bench', x, z);
  for (const x of [1.75, 3.35, 4.95]) put('bench', x, z);
}
for (const z of [2.6, 3.7, 4.8]) { put('candle', -0.8, z); put('candle', 0.8, z); }
// Bailiffs and the door guard.
put('guard', 3.4, -2.2, { yaw: 200 });
put('guard', -2.7, -2.7, { yaw: 160 });
put('guard', -5.9, 4.6, { yaw: 90 });
// Edge dressing.
for (const [x, z] of [[6.4, 0.6], [6.4, 5], [-6.4, 5.4]]) put('pot', x, z);
put('bookcase', 6.55, 0.2, { yaw: 90 });
put('crate', 6.3, 3.3); put('barrel', 6.4, 4.4);
put('flag', -6.5, 2.9, { yaw: 90 });
put('brazier', 0, 5.5);
put('stool', -6.2, 3.2);

const fmt = (p) => {
  const [x, y, z] = p.at;
  const n = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
  const sc = p.scale === undefined ? '' : `, scale: ${Array.isArray(p.scale) ? `[${p.scale.join(', ')}]` : p.scale}`;
  return `  { asset: '${p.asset}', at: [${n(x)}, ${n(y)}, ${n(z)}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${sc} },`;
};
writeFileSync('scenes/maps/courthouse.ts', `// GENERATED by scripts/design-courthouse.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/courthouse.md', `# Courthouse map

14 m x 12 m courtroom, 7 x 6 wood tiles, north and west walls, low rails south and east.
Zones: judge dais (north), jury box (west) and witness stand (east), public gallery (south).
Focal object: the raised judge bench with throne and the scales of justice.

Pieces: ${places.length}

| asset | count |
| --- | --- |
${Object.entries(tally).sort().map(([a, c]) => `| ${a} | ${c} |`).join('\n')}
`);
console.log('pieces', places.length);
