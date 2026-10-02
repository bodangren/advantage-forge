#!/usr/bin/env node
// Alchemy laboratory map designer. 10 m x 8 m cutaway room (5 x 4 stone-floor tiles),
// north wall and west wall standing. Writes scenes/maps/alchemy-lab.ts and
// docs/map-mockups/alchemy-lab.md. North is -Z, east is +X; floor top is y = 0.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, yaw = 0, y = 0, scale) => {
  const p = { asset, at: [x, y, z] };
  if (yaw) p.yaw = yaw;
  if (scale) p.scale = scale;
  places.push(p);
};
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];

// Floor: x -5..5, z -4..4.
for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) put('stone-floor', -4 + i * 2, -3 + j * 2);

// Walls: corner at (-5,-4); north run x -3..5, west run z -2..4.
put('wall-corner', -5, -4, 180);
for (const x of [-2, 0, 2, 4]) put('stone-wall', x, -4, 0);
for (const z of [-1, 1, 3]) put('stone-wall', -5, z, 90);

const small = ['vial', 'bottle', 'vial', 'jar'];
const BENCH_Y = 0.85;

// North benches (face south) and west benches (face east).
const northBench = [-3.0, -1.8, -0.6];
const westBench = [-1.8, -0.6, 0.6];
for (const x of northBench) put('workbench', x, -3.6, 0);
for (const z of westBench) put('workbench', -4.6, z, 90);
// Bench tops: apparatus, flasks, mortar, loose vials.
put('alchemy-apparatus', -3.0, -3.6, 0, BENCH_Y);
put('mortar-pestle', -1.8, -3.55, 0, BENCH_Y);
put('distillation-flask', -2.2, -3.6, 0, BENCH_Y);
put('distillation-flask', -0.9, -3.6, 0, BENCH_Y);
put('alchemy-apparatus', -0.4, -3.6, 0, BENCH_Y);
put('distillation-flask', -4.6, -1.8, 90, BENCH_Y);
put('alchemy-apparatus', -4.6, -0.6, 90, BENCH_Y);
put('distillation-flask', -4.6, 0.3, 90, BENCH_Y);
put('mortar-pestle', -4.6, 0.9, 90, BENCH_Y);
for (let i = 0; i < 14; i++) {
  const north = i % 2 === 0;
  const t = rnd();
  if (north) put(pick(small), -3.5 + t * 3.2, -3.35 + rnd() * 0.1, 0, BENCH_Y);
  else put(pick(small), -4.45 + rnd() * 0.1, -2.2 + t * 3.2, 0, BENCH_Y);
}
// Under-bench jars and herbs on the floor.
for (const [x, z] of [[-3.4, -3.3], [-1.2, -3.3], [-4.3, -2.2], [-4.3, 1.2]]) put('jar', x, z, 0, 0);
for (let i = 0; i < 8; i++) put(pick(['vial', 'bottle', 'vial']), -3.5 + i * 0.45, -2.75 + rnd() * 0.1);

// Shelves with jars: north (x 0.8), west (z 2.9 facing east).
const boards = [0.47, 0.8, 1.11];
for (const y of boards) {
  for (let i = 0; i < 4; i++) put(pick(['jar', 'bottle', 'vial', 'jar']), 0.8 - 0.5 + i * 0.33, -3.77, 0, y);
  for (let i = 0; i < 3; i++) put(pick(['bottle', 'vial', 'jar']), -4.77, 2.3 + i * 0.33 + 0.1, 0, y);
}
put('shelf', 0.8, -3.94, 0);
put('shelf', -4.94, 2.95, 90);

// Fireplace and kiln on the north wall; fire corner.
put('fireplace', 2.5, -3.94, 0);
put('kiln', 4.15, -3.15, 0);
put('firewood', 3.6, -2.2, 20);
put('firewood', 4.4, -2.0, -30);
put('coal', 3.7, -1.7);
put('coal', 4.3, -1.5);
put('bucket', 2.2, -2.9);

// Focal cauldron on a campfire, center of the room.
put('campfire', 0.6, 0.6);
put('cauldron', 0.6, 0.6, 20, 0, 1.15);
put('firewood', 1.3, 0.9, 70);
put('coal', -0.1, 0.7);
put('stool', -0.8, 1.2);
put('candle-cluster', -0.7, 0.2);
put('rug', 0.6, 2.4);

// East zone: herb drying racks, table with mortar, stools, storage.
put('herb-drying-rack', 3.6, 0.4, 0);
put('herb-drying-rack', 4.5, 1.3, 270);
put('herb-drying-rack', 2.6, 0.4, 0);
put('table', 3.2, 2.6);
put('mortar-pestle', 3.1, 2.55, 0, 0.6);
put('vial', 3.4, 2.7, 0, 0.6);
put('bottle', 3.35, 2.4, 0, 0.6);
put('stool', 2.3, 2.7);
put('stool', 4.1, 3.0);
put('barrel', 4.5, 3.4);
put('barrel', 4.5, 2.5);
put('crate', 4.4, -0.8);
put('sack', 4.6, -0.3);
put('chest', 1.2, 3.5);
put('bucket', -1.0, 3.4);
put('witch-broom', -3.3, 0.9, 80);

// Big display flasks at the front corners, like the mockup.
put('distillation-flask', -3.9, 3.1, 0, 0, 2.2);
put('distillation-flask', 2.0, -0.6, 0, 0, 2.0);
put('distillation-flask', -2.4, 1.8, 0, 0, 1.4);
put('jar', 0.2, 3.5, 0, 0, 1.5);

// Herbs, mushrooms, moss, scattered.
const herbs = ['healing-herb', 'herb-root', 'mushroom-cluster', 'moss-tuft', 'healing-herb'];
for (let i = 0; i < 24; i++) {
  const x = -4.3 + rnd() * 8.6, z = -3.0 + rnd() * 6.6;
  if (Math.abs(x - 0.6) < 0.8 && Math.abs(z - 0.6) < 0.8) continue;
  put(pick(herbs), +x.toFixed(2), +z.toFixed(2), Math.floor(rnd() * 360));
}
for (let i = 0; i < 8; i++) put('moss-tuft', -4.7 + rnd() * 0.3, -3.8 + i * 0.9);
for (let i = 0; i < 4; i++) put(pick(['coal', 'rubble', 'candle']), +(-4 + rnd() * 8.4).toFixed(2), +(2.6 + rnd() * 1.2).toFixed(2));
put('mushroom-cluster', 4.6, 3.9);
put('scroll', -3.2, 2.4, 40);
put('spellbook', -2.9, -3.55, 0, BENCH_Y);
put('candle', -1.5, -3.4, 0, BENCH_Y);
put('candle', -4.45, -1.2, 0, BENCH_Y);

const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
const num = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(2)));
const line = (p) => `  { asset: '${p.asset}', at: [${p.at.map(num).join(', ')}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/alchemy-lab.ts',
`// GENERATED by scripts/design-alchemy-lab.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${places.map(line).join('\n')}
  ];
}
`);
writeFileSync('docs/map-mockups/alchemy-lab.md',
`# Alchemy laboratory

10 m x 8 m cutaway room: 5 x 4 stone-floor tiles, stone walls on the north and west edges.
Focal object: cauldron on a campfire at (0.6, 0.6). Zones: the bench row (L-shaped, north and west
walls, apparatus, flasks, mortar); the fire corner (fireplace, kiln, firewood); the herb corner
(drying racks, table with mortar, stools, storage). Large display flasks stand at the front
corners as in the mockup. Path: open floor from the south-east edge to the cauldron.

Total placements: ${places.length}

| asset | count |
|-------|-------|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([a, n]) => `| ${a} | ${n} |`).join('\n')}
`);
console.log('wrote', places.length, 'places');
