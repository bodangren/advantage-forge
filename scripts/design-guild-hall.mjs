#!/usr/bin/env node
// Guild hall map designer (interior, 14 m x 10 m cutaway). Writes
// scenes/maps/guild-hall.ts and docs/map-mockups/guild-hall.md from one data set.
// x -7..7 (west->east), z -5..5 (north->south). North and west walls only (cutaway).
// Zones: quest board wall (N-W), clerk counter (W), map tables (centre-S),
// fireplace lounge (N-E), stair landing (E).
import { writeFileSync, existsSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// floor: 7 x 5 tiles of one family
for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) put('wood-floor', i * 2, j * 2);
// landing slab (top y=1.5) with its support walls
put('wood-floor', 6, 1.8, { y: 1.5 });
put('timber-wall', 5.05, 1.8, { yaw: 270 });
put('timber-wall', 6, 0.85, { yaw: 180 });
put('timber-wall', 6.95, 1.8, { yaw: 90 });
put('stairs-wood', 6.2, 3.8);
put('lantern', 5.3, 1.2, { y: 1.5, scale: 0.6 });
put('chest', 6.5, 1.2, { y: 1.5, scale: 0.9 });
put('barrel', 5.4, 2.4, { y: 1.5, scale: 0.7 });
put('banner', 6.7, 4.55);

// walls: north (z=-5) and west (x=-7)
for (let i = -3; i <= 3; i++) put('timber-wall', i * 2, -5);
for (let j = -2; j <= 2; j++) put('timber-wall', -7, j * 2 + 0, { yaw: 90 });

// --- quest board wall (north) ---
put('notice-board', -0.2, -4.55, { scale: 1.8 });
put('notice-board', -3.3, -4.6, { scale: 1.35 });
put('notice-board', 2.3, -4.6, { scale: 1.25 });
put('rug', -0.2, -3.2, { scale: 1.3 });
put('rug', -3.3, -3.5, { scale: 0.8 });
for (const [x, z, y] of [[-1.7, -3.0, 180], [0.9, -2.8, 165], [-0.6, -2.3, 190]]) put('adventurer', x, z, { yaw: y, scale: 0.9 });
put('quest-giver', -2.3, -3.1, { yaw: 160, scale: 0.9 });
for (const x of [-5.2, -1.8, 1.0, 3.0]) put('banner', x, -4.75);
for (const x of [-2.0, 1.6]) put('wall-sconce', x, -4.88, { y: 1.1 });
for (const x of [-1.6, 1.2]) put('lantern', x, -4.3, { scale: 0.7 });
for (const x of [-3.2, -1.4, 0.8, 2.6]) put('map', x, -4.78, { y: 0.9, scale: 1.5 });
put('crate', -6.2, -4.3); put('crate', -6.2, -4.3, { y: 0.41, scale: 0.8, yaw: 20 });
put('sack', -5.7, -4.4); put('sack', -5.5, -3.9, { yaw: 40 });

// --- clerk counter (west) ---
for (const z of [-3, -1, 1]) put('counter', -5.2, z, { yaw: 90 });
put('quest-giver', -6.1, -1.4, { yaw: 90 });
put('stool', -6.0, -0.2, { yaw: 90 });
put('cleric-book', -5.2, -3.0, { y: 0.75, yaw: 90 });
put('ancient-scroll', -5.2, -1.6, { y: 0.75, yaw: 90 });
put('coin-pile', -5.2, -0.6, { y: 0.75 });
put('candle', -5.25, 0.3, { y: 0.75 });
put('mug', -5.1, 1.2, { y: 0.75 });
put('tankard', -5.3, 1.7, { y: 0.75 });
put('coin-purse', -5.2, -2.2, { y: 0.75, yaw: 70 });
for (const z of [-4.4, -3.4, 0.4, 1.4]) put('bookshelf', -6.72, z, { yaw: 90 });
put('bookshelf', -6.72, 2.4, { yaw: 90 });
put('cabinet', -6.6, 3.6, { yaw: 90 });
put('chest', -6.4, 4.5, { yaw: 90 });
put('wall-sconce', -6.9, -2.0, { y: 1.1, yaw: 90 });
put('wall-sconce', -6.9, 1.9, { y: 1.1, yaw: 90 });
put('banner', -6.75, 3.0, { yaw: 90 });
put('rug', -3.9, -0.5, { yaw: 90, scale: 1.2 });
put('bench', -4.1, 3.3, { yaw: 90 });
put('coin-pile', -4.3, 3.3, { y: 0.4, scale: 0.6 });

// --- map tables (centre-south) ---
const tables = [[-2.0, 1.6], [0.6, 3.1], [2.6, 1.3], [-2.2, 4.0]];
for (const [x, z] of tables) {
  put('rug', x, z, { scale: 1.5, yaw: 0 });
  put('round-table', x, z);
  put('map', x, z, { y: 0.6, scale: 1.8, yaw: x * 20 });
  put('candle', x + 0.35, z - 0.25, { y: 0.6 });
  for (let k = 0; k < 3; k++) {
    const a = (k * 120 + 40) * Math.PI / 180;
    put('stool', x + Math.sin(a) * 0.85, z + Math.cos(a) * 0.85, { yaw: k * 120 + 40 + 180 });
  }
}
put('explorer-map', -2.4, 1.4, { y: 0.62, scale: 1.4, yaw: 60 });
put('mug', 2.8, 1.5, { y: 0.6 });
put('mug', 0.8, 2.9, { y: 0.6 });
put('chandelier', -0.6, -0.6, { y: 2.6, scale: 1.5 });
put('chandelier', 3.4, 0.2, { y: 2.6, scale: 1.5 });
put('chandelier', -3.4, 0.2, { y: 2.6, scale: 1.5 });
put('adventurer', 0.4, 1.9, { yaw: 200, scale: 0.9 });
put('lantern', 4.2, 4.4, { scale: 0.7 });
put('lantern', -0.9, 4.5, { scale: 0.7 });

// --- fireplace lounge (north-east) ---
put('fireplace', 4.5, -4.94, { scale: 1.2 });
put('rug', 4.5, -2.9, { scale: 1.8 });
put('chair', 3.4, -2.5, { yaw: 150 });
put('chair', 5.6, -2.5, { yaw: 210 });
put('table', 4.5, -1.7, { scale: 0.6 });
put('mug', 4.5, -1.7, { y: 0.36 });
put('cleric-book', 4.8, -1.7, { y: 0.36, scale: 0.7 });
put('torch-sconce', 3.4, -4.88, { y: 1.1 });
put('torch-sconce', 5.6, -4.88, { y: 1.1 });
put('banner', 6.75, -4.75);
put('bookcase', 6.55, -3.4, { yaw: 270 });
put('barrel', 6.35, -2.2, { scale: 0.9 });
put('hay-bale', 6.4, -0.9, { yaw: 20 });
put('bedroll', 5.4, -1.0, { yaw: 100, scale: 0.9 });
put('candle-cluster', 3.6, -4.55);
put('shield-maiden-shield', 4.5, -4.88, { y: 1.45, scale: 0.9 });
put('wall-sconce', 2.0, -4.88, { y: 1.1 });

// --- edge dressing (west & south) ---
put('barrel', -6.5, 3.3, { scale: 0.9 }); put('barrel', -6.4, 4.2, { scale: 0.8 });
put('crate', -5.6, 4.6, { yaw: 15 }); put('crate', -5.0, 4.7, { yaw: -10 });
put('crate', -5.3, 4.65, { y: 0.41, scale: 0.8, yaw: 30 });
put('sack', -4.2, 4.6); put('sack', -3.8, 4.4, { yaw: 60 });
put('long-sword', 3.6, 4.4, { y: 0.45, yaw: 90 });
put('bench', 3.6, 4.4, { yaw: 0 });

const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
const body = places.map((p) => '    ' + JSON.stringify(p)).join(',\n');
writeFileSync('scenes/maps/guild-hall.ts', `// GENERATED by scripts/design-guild-hall.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${body},
  ];
}
`);
writeFileSync('docs/map-mockups/guild-hall.md', `# Guild hall map

14 m x 10 m cutaway (x -7..7, z -5..5), north and west timber walls, one wood-floor family.
Focal object: the 1.8x quest notice board on the north wall.

Zones: quest board wall (N), clerk counter with shelves (W), four round map tables (centre-south),
fireplace lounge (NE), stair landing to the rooms (E, landing top y 1.5).

Pieces: ${places.length}

| asset | count |
|-------|-------|
${Object.entries(tally).map(([a, n]) => `| ${a} | ${n} |`).join('\n')}
`);
console.log(places.length, 'places');
const miss = Object.keys(tally).filter((a) => !existsSync(`out/${a}/${a}.glb`));
console.log('missing glb:', miss.join(', ') || 'none');
