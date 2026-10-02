#!/usr/bin/env node
// Throne room map designer (14 m x 10 m cutaway hall). Hall axis runs north (-Z);
// walls stand on the north and west sides; the south and east sides are open cutaway.
// Writes scenes/maps/throne-room.ts and docs/map-mockups/throne-room.md.
// Mockup jpg for the map did not exist; layout follows the brief text.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// Floor: one family (stone-floor), 7 x 5 tiles. Three steps up to the dais:
// z=0 (top 0.15), z=-2 (top 0.3), z=-4 (top 0.6). Dais wings at |x|=4 top 0.3.
for (let x = -6; x <= 6; x += 2)
  for (let z = -4; z <= 4; z += 2) {
    const c = Math.abs(x) <= 2;
    if (z === -4 && c) put('stone-floor', x, z, { y: 0.3 });
    const y = z === -4 ? (c ? 0.6 : Math.abs(x) === 4 ? 0.3 : 0) : z === -2 && c ? 0.3 : z === 0 && c ? 0.15 : 0;
    put('stone-floor', x, z, { y });
  }

// Walls: north (z=-5) and west (x=-7), pillar hides the corner.
for (let x = -6; x <= 6; x += 2) put('wall', x, -5);
for (let z = -4; z <= 4; z += 2) put('wall', -7, z, { yaw: 90 });
put('pillar', -6.75, -4.75);

// Red carpet runner: five long rugs (scale 1.5 -> 2.4 m long x 1.5 m wide), one per level.
for (const [z, y] of [[3.8, 0.005], [2.2, 0.018], [0, 0.17], [-2, 0.305], [-3.9, 0.605]])
  put('rug', 0, z, { yaw: 90, scale: 1.5, y });

// Focal: throne on the raised dais, banners behind, curtain canopy.
put('throne', 0, -4.0, { y: 0.6, scale: 1.5 });
put('royal-seal', 0, -4.78, { y: 1.9, scale: 0.9 });
for (const s of [-1, 1]) {
  put('banner', s * 1.3, -4.6, { y: 0.6, scale: 1.0 });
  put('curtain', s * 2.1, -4.75, { scale: 0.7, y: 0.6 });
  put('curtain', s * 0.7, -4.75, { scale: 0.5, y: 0.6 });
  put('brazier', s * 2.6, -3.2, { y: 0.6 });
  put('candle-cluster', s * 1.3, -3.4, { y: 0.6 });
  put('candle-cluster', s * 2.4, -4.4, { y: 0.6 });
  put('guard', s * 1.7, -2.2, { y: 0.3, yaw: s * -20 });
  put('banner', s * 3.6, -3.6, { y: 0.3, scale: 0.9 });
}
put('statue', -4.4, -4.2, { y: 0.3, scale: 0.6 });

// Nave: column rows, braziers between columns, chandeliers, guards.
for (const z of [3.5, 1.5, -0.5])
  for (const s of [-1, 1]) {
    put('column', s * 3.2, z, { scale: 0.9 });
    put('candle-cluster', s * 3.7, z + 0.6);
  }
for (const z of [2.5, 0.5]) for (const s of [-1, 1]) put('brazier', s * 3.2, z);
for (const z of [3.2, 0.2, -2.0]) put('chandelier', 0, z, { y: 2.4, scale: 2.2 });
for (const s of [-1, 1]) {
  put('guard', s * 1.5, 3.4, { yaw: -s * 90 });
  put('guard', s * 1.5, 0.8, { y: 0.15, yaw: -s * 90 });
  put('knight', s * 2.4, 4.5);
}

// West wall: tapestries and windows. North wall: stained glass; east end holds a fireplace.
for (const x of [-5.2, -3.6, 3.6]) put('stained-glass-window', x, -4.8, { scale: 0.6 });
for (const x of [-4.4, 4.4]) put('torch-sconce', x, -4.8, { scale: 0.9 });
for (const x of [-2.9, 2.9]) put('tapestry', x, -4.8, { scale: 0.8, y: 0.2 });
for (const s of [-1, 1]) put('torch-sconce', s * 1.2, -4.8, { scale: 0.9 });
for (const z of [-2.5, 1.5]) put('window', -6.8, z, { yaw: 90, y: 0.15 });
for (const z of [-3.5, -0.5, 3.5]) put('torch-sconce', -6.8, z, { yaw: 90, scale: 0.9 });
for (const z of [-1.5, 0.5, 2.5, 4.3]) put('tapestry', -6.8, z, { yaw: 90, scale: 0.8, y: 0.2 });
put('fireplace', 5.9, -4.55, { scale: 1.0 });
put('candle-cluster', 4.9, -4.4);
put('brazier', 4.6, -3.0);

// East zone: banquet hall, one long table of three tables, a bench each side, goblets.
for (const z of [0.9, 1.85, 2.8]) {
  put('table', 5.3, z);
  put('goblet', 5.15, z - 0.15, { y: 0.6 });
  put('goblet', 5.45, z + 0.15, { y: 0.6 });
}
for (const z of [1.1, 2.6]) {
  put('bench', 4.5, z, { yaw: 90 });
  put('bench', 6.1, z, { yaw: 90 });
}
put('candle-cluster', 5.3, 1.4, { y: 0.6 });
put('candle-cluster', 5.3, 2.3, { y: 0.6 });
for (const z of [-3, 0, 3]) put('column', 6.8, z, { scale: 0.6 });

// West zone A: weapons and armor display on tables near the wall.
for (const z of [1.0, 3.2]) {
  put('table', -6.3, z, { yaw: 90 });
}
put('kite-shield', -6.3, 1.0, { y: 0.6, yaw: 90, scale: 0.8 });
put('round-shield', -6.3, 3.2, { y: 0.6, yaw: 90, scale: 0.6 });
put('long-sword', -5.6, 1.6, { scale: 0.9 });
put('long-sword', -5.6, 2.6, { scale: 0.9 });
put('spear', -5.7, 0.2);
put('spear', -5.7, 4.2);
put('iron-helmet', -6.3, 2.1, { y: 0.6, scale: 0.8 });
// West zone B: council table with map, scrolls and chairs.
put('round-table', -5.0, -1.9);
put('map', -5.0, -1.9, { y: 0.6 });
put('scroll', -4.8, -1.6, { y: 0.6 });
put('goblet', -5.3, -2.2, { y: 0.6 });
put('candle', -5.2, -1.5, { y: 0.6 });
put('chair', -5.0, -2.9, { yaw: 0 });
put('chair', -5.0, -0.9, { yaw: 180 });
put('chair', -6.0, -1.9, { yaw: 90 });
// South entry flank.
for (const s of [-1, 1]) put('column', s * 6.6, 4.6, { scale: 0.6 });

const fmt = (p) => {
  const n = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(3)));
  return `  { asset: '${p.asset}', at: [${n(p.at[0])}, ${n(p.at[1])}, ${n(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
};
writeFileSync('scenes/maps/throne-room.ts', `// GENERATED by scripts/design-throne-room.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/throne-room.md', `# Throne room map (generated)

GENERATED by \`scripts/design-throne-room.mjs\`. 14 m x 10 m hall (7 x 5 stone-floor tiles). No map mockup jpg existed; layout follows the brief.

Zones: south entry (braziers, guards), nave (pillar rows, banners, chandeliers, knights, carpet), dais (throne, curtains, statues, braziers, guards).
Walls stand on the north and west; south and east are the cutaway edge.

Total ${places.length} placements.

| asset | count |
|---|---|
${Object.entries(tally).map(([a, c]) => `| ${a} | ${c} |`).join('\n')}
`);
console.log(places.length, JSON.stringify(tally));
