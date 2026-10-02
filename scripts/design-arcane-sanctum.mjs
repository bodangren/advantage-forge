#!/usr/bin/env node
// Arcane sanctum map designer. 12 m x 12 m cutaway hall, walls on the north and west sides.
// x,z in [-6,6]; north = -Z. Writes scenes/maps/arcane-sanctum.ts and docs/map-mockups/arcane-sanctum.md.
// Zones: ritual circle (centre, focal), portal stair (NE), library nook (W/NW), altar shrine (E).
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// Floors: 6x6 tiles. Outer ring stone-floor, inner 4x4 cobble-floor (a ritual dais).
for (let i = 0; i < 6; i++)
  for (let j = 0; j < 6; j++) {
    const x = -5 + 2 * i, z = -5 + 2 * j;
    const inner = i >= 1 && i <= 4 && j >= 1 && j <= 4;
    put(inner ? 'cobble-floor' : 'stone-floor', x, z);
  }

// Walls: north (z=-5.8) and west (x=-5.8). NW corner covers x,z in [-6,-4].
put('wall-corner', -5, -5, { yaw: 180 });
const north = [-3, -1, 1, 3, 5]; // slot centres
const west = [-3, -1, 1, 3, 5];
const northSpecial = { '-1': 'archway', '3': 'portal' };
const westSpecial = { '1': 'archway' };
for (const x of north) {
  const s = northSpecial[x];
  if (s === 'portal') put('portal', x, -5.8);
  else if (s) put(s, x, -5.8);
  else put('wall', x, -5.8);
}
for (const z of west) {
  const s = westSpecial[z];
  put(s ?? 'wall', -5.8, z, { yaw: 90 });
}
// Second course on solid slots, with gaps for a broken-ruin silhouette.
for (const x of [-3, 1, 5]) put('wall', x, -5.8, { y: 1.2 });
for (const z of [-3, 3]) put('wall', -5.8, z, { y: 1.2, yaw: 90 });
put('wall-corner', -5, -5, { y: 1.2, yaw: 180 });
// Broken low stubs on the south and east cutaway edges.
for (const x of [-4.2, 4.2]) put('wall', x, 5.8, { yaw: 0 });
for (const z of [-0.5, 4.2]) put('wall', 5.8, z, { yaw: 90 });
put('rubble', -2.4, 5.7); put('rubble', 2.2, 5.7, { yaw: 40 }); put('rubble', 5.7, 2, { yaw: 90 });
put('rubble', 5.7, -3.5, { yaw: 120 }); put('rubble', -5.5, 5.5, { yaw: 20 }); put('rubble', 5.5, 5.5, { yaw: 200 });
put('moss-tuft', 0, 5.8); put('moss-tuft', 4.8, 5.8); put('moss-tuft', -5.8, 4.5); put('moss-tuft', 5.8, -1.6);

// Focal: ritual circle, 4 rune glyphs, crystal focus.
put('ritual-circle', 0, 0.8, { scale: 2.2 });
put('crystal-focus', 0, 0.8, { scale: 2.4 });
for (const [x, z] of [[0, -2.5], [0, 4.1], [-3.3, 0.8], [3.3, 0.8]]) put('magic-rune', x, z, { scale: 1.1 });
for (const [x, z, y] of [[-1.7, -0.9, 20], [1.7, -0.9, -20], [-1.7, 2.5, 160], [1.7, 2.5, 200]]) put('rune-tablet', x, z, { yaw: y });

// Four guardian pillars on the dais corners.
put('column', -3.6, -3.4); put('column', 3.6, -3.4);
put('pillar', -3.8, 4.6); put('pillar', 3.8, 4.6);
for (const [x, z] of [[-3.6, -3.4], [3.6, -3.4]]) put('candle-cluster', x + 0.55, z + 0.5);
put('candle-cluster', -3.2, 4.2); put('candle-cluster', 3.2, 4.2);

// Portal stair (NE): stairs rise to the glowing portal.
put('stairs', 3, -4.6);
put('column', 1.2, -4.9); put('column', 4.8, -4.9);
put('crystal-cluster', 1.5, -3.4, { yaw: 30 }); put('crystal-cluster', 4.6, -3.2, { yaw: 300 });
put('torch-sconce', 1.0, -5.5); put('torch-sconce', 5.0, -5.5);
put('banner', 5.2, -2.2, { yaw: 270 });
put('candelabra', 4.7, -1.4);

// Library nook (W/NW): bookcases, arch with dark opening, spell books.
put('bookcase', -3, -5.4); put('bookcase', -5.4, -3, { yaw: 90 }); put('bookcase', -5.4, 3.4, { yaw: 90 }); put('bookcase', -5.4, 5.2, { yaw: 90 });
put('torch-sconce', -2.4, -5.5); put('torch-sconce', 0.4, -5.5);
put('torch-sconce', -5.5, 2.4, { yaw: 90 }); put('torch-sconce', -5.5, 0, { yaw: 90 });
put('urn', -4.6, -0.2); put('urn', -4.7, 0.5); put('urn', -4.3, 1.9);
put('spellbook', -4.6, 1.9 + 0.6, { yaw: 30 }); put('mage-spellbook', -3.6, -4.7, { yaw: 25 });
put('mirror', -5.4, 1, { yaw: 90 });
put('banner', -1, -5.1); put('banner', -4.9, -1.6, { yaw: 90 });
put('chains', -5.5, 4.2, { yaw: 90 });
put('candelabra', -4.2, 3.8); put('candelabra', -4.2, -3.6);
put('rune-stone', -4.4, 0.4, { scale: 0.9 }); put('relic-orb', -4.4, -1.2);
put('mushroom-cluster', -5.2, 6 - 0.4);

// Altar shrine (E): altar, crystals and candles on the east edge.
put('altar', 4.9, 1.4, { yaw: 270, scale: 1.3 });
put('crystal-focus', 4.9, 1.4, { y: 1.17, scale: 1.4 });
put('crystal-cluster', 5.3, 0.1, { yaw: 250 }); put('crystal-cluster', 5.3, 2.8, { yaw: 100 });
put('candelabra', 4.2, 0.2); put('candelabra', 4.2, 2.6);
put('banner', 5.4, 4.2, { yaw: 270 });
put('relic-orb', 3.7, 1.4);
put('candle-cluster', 4.4, 3.4); put('candle-cluster', 4.4, -0.8);
put('brazier', 5.3, 5.3);

// Path of worn wedges leading from the south edge to the circle: small moss and rubble along wall bases.
for (const x of [-4.4, 4.4]) put('moss-tuft', x, -5.4);
for (const z of [-4.2, 4.6]) put('moss-tuft', -5.4, z);
put('mushroom-cluster', 2.0, -5.4); put('mushroom-cluster', -5.3, -5.2);
put('rubble', -3.9, -3.5, { yaw: 60 }); put('rubble', 1.0, -5.2); put('rubble', -5.3, 2.8, { yaw: 90 });
for (const [x, z] of [[-1.2, 3.9], [1.2, 3.9], [-2.7, -2.0], [2.7, -2.0], [-2.9, 3.3], [2.9, 3.3]]) put('candle-cluster', x, z);
for (const [x, z] of [[-2.3, 5.4], [2.3, 5.4], [-0.1, 5.5]]) put('moss-tuft', x, z);

// Extra dressing: violet-cyan crystals around the dais and rune stones at the circle rim.
for (const [x, z, y] of [[-3.0, -2.6, 40], [3.0, -2.6, 120], [-3.0, 4.4, 200], [3.0, 4.4, 300]]) put('crystal-cluster', x, z, { yaw: y });
for (const [x, z] of [[-2.2, 0.8], [2.2, 0.8], [0, -1.4], [0, 3.0]]) put('rune-stone', x, z, { scale: 0.8 });
put('moss-tuft', -3.5, -5.4); put('moss-tuft', 3.9, -5.4); put('urn', 5.3, -4.4); put('urn', -5.3, -4.4);

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${p.at.map(num).join(', ')}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/arcane-sanctum.ts', `// GENERATED by scripts/design-arcane-sanctum.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/arcane-sanctum.md', `# Arcane sanctum (generated by scripts/design-arcane-sanctum.mjs)

12 m x 12 m cutaway hall, x,z in [-6,6], north = -Z. Walls on the north and west sides, two courses (partial second course).
Floor: 6x6 tiles, outer ring stone-floor, inner 4x4 cobble-floor dais.

Zones: ritual circle at (0,0.8) with crystal focus and four runes (focal); portal stair NE (stairs + portal);
library nook W/NW (bookcases, archway, urns, books); altar shrine E (altar, crystal-focus, candelabra, banner).
Four guardian pillars on the dais corners. Path: south edge to the circle, then to the portal stairs.
Edge dressing: rubble, moss, mushrooms, broken low wall stubs on the south and east edges.

Total pieces: ${places.length}
Tally: ${JSON.stringify(tally)}
`);
console.log(places.length, 'places');
