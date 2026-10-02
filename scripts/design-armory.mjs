#!/usr/bin/env node
// Armory map designer: 12 m x 8 m interior cutaway weapons hall, north and west stone walls standing.
// Zones: weapon racks (NW: spear barrels, sword benches, hung shields), guard post (NE: door,
// guard desk, banners), armor stands (W: plate and chainmail on tables), smithy corner (SW:
// grinding wheel, anvil, workbench). A rug path runs from the door to the stairs in the south.
// Writes scenes/maps/armory.ts and docs/map-mockups/armory.md.
import { writeFileSync, existsSync } from 'node:fs';

const places = [];
const dropped = new Set();
const put = (asset, x, y, z, o = {}) => {
  if (!existsSync(`out/${asset}/${asset}.glb`)) { dropped.add(asset); return; }
  const p = { asset, at: [x, y, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// floor: one stone-floor family, 6 x 4 tiles
for (const x of [-5, -3, -1, 1, 3, 5]) for (const z of [-3, -1, 1, 3]) put('stone-floor', x, 0, z);

// walls: north (z) with the guard door at x = 3, west (x)
const NZ = -3.9, WX = -5.9;
for (const x of [-5, -3, -1, 1, 3, 5]) put(x === 3 ? 'plaster-wall-door' : 'stone-wall', x, 0, NZ);
for (const z of [-2.9, -0.9, 1.1, 3.1]) put('stone-wall', WX, 0, z, { yaw: 90 });
// merlons along the wall tops (y = 1.5)
for (const x of [-5.4, -3.4, -1.4, 0.6, 2.6, 4.6]) put('pillar', x, 1.5, NZ, { scale: 0.42 });
for (const z of [-2.9, -0.9, 1.1, 3.1]) put('pillar', WX, 1.5, z, { scale: 0.42 });
put('pillar', WX, 1.5, NZ, { scale: 0.5 });
put('pillar', 5.7, 1.5, NZ, { scale: 0.42 });

const FN = NZ + 0.09; // north wall inner face
const FW = WX + 0.09; // west wall inner face

// ZONE A: weapon racks along the north wall (NW)
for (const x of [-5.2, -4.5, -3.8]) {
  put('barrel', x, 0, -3.35, { scale: 0.75, yaw: x * 40 });
  put('spear', x, 0, -3.35, { yaw: x * 30 });
  put('spear', x + 0.08, 0, -3.3, { yaw: 20 });
}
for (const x of [-2.5, -1.0]) {
  put('workbench', x, 0, -3.4);
  for (const d of [-0.4, -0.1, 0.2, 0.45]) put('long-sword', x + d, 0.85, -3.45, { yaw: d * 60 });
}
// shields hung on the north wall above the racks
[[-5.0, 'kite-shield'], [-4.0, 'shield-maiden-shield'], [-3.0, 'kite-shield'], [-2.0, 'shield-maiden-shield'], [-1.0, 'kite-shield'], [0, 'shield-maiden-shield']]
  .forEach(([x, a]) => put(a, x, 0.65, FN + 0.05));
put('torch-sconce', -3.4, 0, FN + 0.02, { scale: 0.9 });
put('torch-sconce', -0.2, 0, FN + 0.02, { scale: 0.9 });
put('crate', -0.2, 0, -3.4, { yaw: 12, scale: 0.9 });
put('crate', 0.45, 0, -3.4, { yaw: -8, scale: 0.9 });
put('short-sword', 0.45, 0.4, -3.4, { yaw: 30 });

// ZONE B: guard post by the door (NE)
put('banner', 1.5, 0, -3.5);
put('banner', 4.6, 0, -3.5);
put('guard', 3.0, 0, -2.5);
put('desk', 5.0, 0, -2.4, { yaw: 270 });
put('chair', 4.15, 0, -2.4, { yaw: 90 });
put('scroll', 5.0, 0.75, -2.6, { yaw: 40 });
put('candle', 5.0, 0.75, -2.1);
put('barrel', 5.5, 0, -3.4, { scale: 0.8 });
put('crate', 5.4, 0, -1.2, { yaw: 20 });
put('tower-shield', 5.5, 0, -0.5, { yaw: 250 });
put('torch-sconce', 1.0, 0, FN + 0.02, { scale: 0.9 });
put('torch-sconce', 5.0, 0, FN + 0.02, { scale: 0.9 });

// ZONE C: armor stands along the west wall
const stands = [[-2.5, 'plate-armor'], [-1.0, 'chainmail'], [0.5, 'plate-armor'], [2.0, 'chainmail']];
for (const [z, a] of stands) {
  put('table', -5.3, 0, z, { yaw: 90 });
  put(a, -5.3, 0.6, z, { yaw: 90 });
}
put('table', -5.3, 0, 3.3, { yaw: 90 });
put('steel-helmet', -5.3, 0.6, 3.3, { yaw: 90 });
put('round-shield', FW + 0.05, 0.7, -1.7, { yaw: 90 });
put('kite-shield', FW + 0.05, 0.7, -0.2, { yaw: 90 });
put('round-shield', FW + 0.05, 0.7, 1.3, { yaw: 90 });
put('kite-shield', FW + 0.05, 0.7, 2.8, { yaw: 90 });
put('torch-sconce', FW + 0.02, 0, -3.0, { yaw: 90, scale: 0.9 });
put('torch-sconce', FW + 0.02, 0, 0.1, { yaw: 90, scale: 0.9 });
put('torch-sconce', FW + 0.02, 0, 3.4, { yaw: 90, scale: 0.9 });

// ZONE D: smithy corner (SW)
put('grinding-wheel', -3.3, 0, 3.2, { yaw: 160 });
put('anvil', -2.2, 0, 3.0, { yaw: 90 });
put('workbench', -0.8, 0, 3.4, { yaw: 180 });
put('hand-axe', -1.0, 0.85, 3.4, { yaw: 30 });
put('mace', -0.55, 0.85, 3.45, { yaw: -20 });
put('barrel', -4.2, 0, 3.4, { scale: 0.85 });
put('bucket', -3.9, 0, 2.6);
put('crate', -4.3, 0, 2.5, { yaw: 30, scale: 0.8 });
put('lantern', 0.4, 0, 3.5);

// ZONE E: stairs and edge dressing in the south and east
put('stairs-stone', 3.0, 0, 3.7, { yaw: 180 });
put('barrel', 5.4, 0, 3.4, { scale: 0.85 });
put('crate', 5.3, 0, 2.6, { yaw: 15 });
put('crate', 5.35, 0.41, 2.6, { yaw: 50, scale: 0.7 });
put('lantern', 5.4, 0, 1.8);

// path: rugs from the door south to the stairs
for (const z of [-1.4, 0.2, 1.8]) put('rug', 3.0, 0, z, { yaw: 90 });
put('rug', 0.8, 0, 0.6, { scale: 1.6 });
put('table', 0.8, 0, 0.6, { yaw: 90, scale: 1.2 });
put('long-sword', 0.55, 0.72, 0.3, { yaw: 20 });
put('long-sword', 0.75, 0.72, 0.6, { yaw: -15 });
put('short-sword', 1.0, 0.72, 0.9, { yaw: 40 });
put('steel-helmet', 0.95, 0.72, 0.3);
put('knight-helm', 0.6, 0.72, 0.95);
put('stool', -0.4, 0, 0.6);
put('stool', 2.0, 0, 0.6);
// east edge: spear and axe barrels, helmet crates
for (const z of [-0.2, 0.5, 1.2]) {
  put('barrel', 5.5, 0, z, { scale: 0.7, yaw: z * 50 });
  put('spear', 5.5, 0, z, { yaw: z * 30 });
  put('spear', 5.43, 0, z + 0.07, { yaw: 25 });
}
put('battle-axe', 4.7, 0.41, 1.9, { yaw: 30, scale: 0.8 });
put('crate', 4.7, 0, 1.9, { yaw: 10, scale: 0.9 });
put('steel-helmet', 5.2, 0.41, 2.6);
put('iron-helmet', 4.9, 0.41, 3.4);
put('crate', 4.9, 0, 3.4, { scale: 0.9 });
// south-west: second sword bench and crates
put('workbench', -5.0, 0, 3.55, { yaw: 180 });
for (const d of [-0.4, -0.1, 0.2, 0.45]) put('long-sword', -5.0 + d, 0.85, 3.55, { yaw: d * 60 });
put('crate', -1.6, 0, 2.4, { yaw: 8, scale: 0.9 });
put('sack', -1.2, 0, 2.5);
put('sack', 1.4, 0, 3.6);
put('barrel', 1.0, 0, 3.6, { scale: 0.8 });
put('crate', 2.0, 0, 3.7, { yaw: 14, scale: 0.9 });
put('bucket', -2.9, 0, 2.3);
put('lantern', -2.6, 0, -3.4);
put('lantern', 2.1, 0, -3.5);
put('guard', -1.3, 0, 1.2, { yaw: 270 });

writeFileSync('scenes/maps/armory.ts', `// GENERATED by scripts/design-armory.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map((p) => `  { asset: '${p.asset}', at: [${p.at.map((v) => +v.toFixed(2)).join(', ')}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/armory.md', `# Armory map (generated)

GENERATED by \`scripts/design-armory.mjs\`.

12 m x 8 m interior weapons hall on stone floor, north and west stone walls standing with merlons.
NW: spear barrels, sword benches, hung shields. NE: guard door, banners, guard desk.
W: plate and chainmail on tables, hung shields. SW: grinding wheel, anvil, workbench.
S: stairs and crates. A rug path runs from the door to the stairs.

| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log(`armory: ${places.length} places`, dropped.size ? `dropped (no glb): ${[...dropped].join(', ')}` : '');
