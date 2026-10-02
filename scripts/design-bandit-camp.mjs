#!/usr/bin/env node
// Bandit camp map designer: 18 x 16 m roadside clearing (dirt ground, one family) inside a
// pine ring. An E-W dirt road along z=5 crosses the map; a barricade blocks it at x=5.
// Zones: camp fire + tents (NW), loot wagons (NE), lookout (W), road barricade (SE).
// Writes scenes/maps/bandit-camp.ts and docs/map-mockups/bandit-camp.md.
import { writeFileSync, existsSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// Ground: 11 x 10 slabs of 2 m (x -10..10, z -9..9); the road runs along z = 5.
for (let c = 0; c <= 10; c++)
  for (let r = 0; r <= 9; r++) {
    const x = (c - 5) * 2, z = (r - 4.5) * 2;
    if (r === 7) put('dirt-road-straight', x, z, { yaw: 90 });
    else put('dirt-ground', x, z);
  }

// Zone 1: camp fire, log seats, tents (NW)
put('tent', -6.5, -5.6, { yaw: 5 });
put('tent', -3.2, -6.0, { yaw: 0, scale: 1.45 }); // captain's big tent
put('tent', 0.2, -5.6, { yaw: -5 });
put('banner', -1.5, -4.4, { yaw: 0 });
put('bandit-captain', -3.2, -3.6, { yaw: 0 });
put('bedroll', -6.0, -3.5, { yaw: 90 });
put('bedroll', -7.3, -3.5, { yaw: 90 });
put('bedroll', 0.0, -3.6, { yaw: 80 });
put('bedroll', 1.3, -3.7, { yaw: 100 });
put('campfire', -2.2, -0.6, { scale: 1.3 });
put('log', -2.2, -2.2, { yaw: 0 });
put('log', -3.9, -0.6, { yaw: 90 });
put('log', -2.2, 1.0, { yaw: 180 });
put('log', -0.5, -0.6, { yaw: 90 });
put('bandit', -3.2, -1.7, { yaw: 160 });
put('bandit', -1.2, 0.5, { yaw: 300 });
put('bandit-archer', -4.5, 0.4, { yaw: 70 });
put('table', -6.6, -1.2, { yaw: 20 });
put('stool', -7.5, -0.6); put('stool', -5.7, -0.2, { yaw: 40 });
put('sack', -6.6, -1.2, { y: 0.6 });
put('barrel', -8.0, -2.2); put('barrel', -7.4, -2.6);
put('torch', -4.8, -4.4); put('torch', 1.9, -4.5);

// Zone 2: loot wagons (NE)
put('covered-wagon', 5.4, -5.4, { yaw: 90 });
put('caravan-wagon', 5.6, -2.4, { yaw: 95 });
put('wagon', 8.0, -1.4, { yaw: 8 });
put('handcart', 2.9, -2.2, { yaw: 60 });
for (const [x, z, y] of [[3.0, -5.9, 0], [3.0, -5.3, 0], [3.6, -5.6, 0], [3.3, -5.6, 0.41], [8.2, -5.0, 0], [8.2, -4.3, 0], [7.6, -4.7, 0], [7.8, -4.6, 0.41]])
  put('crate', x, z, { y, yaw: (x * 37 + z * 11) % 40 });
for (const [x, z] of [[8.3, -6.6], [7.6, -6.9], [3.0, -3.4], [3.7, -3.1], [8.4, -2.7]]) put('barrel', x, z);
put('treasure-chest', 4.4, -0.4, { yaw: 200 });
put('locked-chest', 7.0, 0.2, { yaw: 150 });
put('chest', 3.5, 0.2, { yaw: 30 });
for (const [x, z] of [[4.7, -0.2], [7.3, -3.3], [2.4, -3.0], [8.5, -3.6], [5.9, 0.4]]) put('sack', x, z, { yaw: x * 40 });
put('bandit', 6.2, -0.8, { yaw: 200 });
put('brazier', 2.4, -0.6);

// Zone 3: lookout post (W) over the road entry
put('guard-post', -7.4, 2.4, { yaw: 90 });
put('bandit-archer', -6.0, 1.8, { yaw: 90 });
put('torch', -8.4, 3.6); put('torch', -6.2, 3.6);
put('fence', -8.7, 0.6, { yaw: 90 }); put('fence', -8.7, -1.3, { yaw: 90 });
put('barrel', -5.2, 3.2);

// Zone 4: road barricade (SE, across the road at x = 5)
put('fence', 5.0, 4.1, { yaw: 90 }); put('fence', 5.0, 5.9, { yaw: 90 });
put('fence', 5.0, 3.0, { yaw: 90 }); put('fence', 5.0, 7.0, { yaw: 90 });
put('crate', 4.2, 3.7, { yaw: 15 }); put('crate', 4.2, 6.4, { yaw: -10 });
put('crate', 4.2, 6.9, { yaw: 10 }); put('barrel', 4.1, 4.2); put('barrel', 4.2, 5.6);
put('spike-trap', 6.8, 4.6); put('spike-trap', 6.8, 5.6);
put('bandit', 3.6, 4.4, { yaw: 90 }); put('bandit-archer', 3.5, 5.7, { yaw: 90 });
put('brazier', 3.2, 3.3);
put('torch', 4.5, 2.6);
put('wagon', 0.5, 5.0, { yaw: 90 }); // loaded wagon waiting on the camp side of the road
put('crate', 1.4, 5.0, { y: 0.0, yaw: 90 });
put('sack', -1.2, 5.4); put('sack', -1.6, 4.7, { yaw: 50 });

// Edge dressing
for (const [a, x, z, yaw, s] of [
  ['boulder', -8.6, -6.6, 30, 1.2], ['boulder', 8.6, 1.9, 200, 1.1], ['boulder', -2.0, 7.4, 100, 1.0], ['boulder', 8.8, 7.0, 10, 1.3],
  ['rock-cluster', 6.5, 7.4, 20, 1], ['rock-cluster', -8.5, 6.4, 120, 1], ['rock-cluster', 9, -7.8, 60, 1],
  ['bush', -8.7, 5.9, 0, 1], ['bush', -6.0, 7.4, 40, 1], ['bush', 1.6, 7.6, 90, 1], ['bush', 8.7, 3.6, 0, 1],
  ['bush', 0.3, -7.6, 0, 1], ['bush', 5.5, -7.7, 70, 1], ['bush', -8.6, -4.6, 200, 1], ['bush', 3.6, 7.5, 5, 0.9],
  ['tall-grass', -8.8, 1.8, 0, 1], ['tall-grass', 8.6, -3.8, 30, 1], ['tall-grass', -4.2, 7.3, 10, 1], ['tall-grass', 7.6, 7.5, 80, 1],
  ['tall-grass', 2.2, -7.4, 90, 1], ['tall-grass', -5.6, -7.6, 150, 1], ['tall-grass', 8.8, 5.0, 40, 1], ['tall-grass', -9, 4.2, 0, 1],
  ['tree-stump', -4.7, 6.3, 10, 1], ['tree-stump', 1.3, -7.2, 100, 1], ['dead-tree', 9.2, 1.0, 120, 1],
]) put(a, x, z, { yaw, scale: s });

// Pine ring (road gaps at z = 5 on both sides)
const T = [];
for (let x = -9; x <= 9; x += 3) { T.push([x + ((x * 7) % 2) * 0.4, -8.7]); T.push([x + 0.5, 8.9]); }
for (let z = -6; z <= 8; z += 3) { if (Math.abs(z - 5) < 2.4) continue; T.push([-10.2, z]); T.push([10.2, z]); }
T.push([-10.5, 8.2], [10.5, -8.2], [10.5, 8.2], [-10.5, -8.2]);
T.forEach(([x, z], i) => put('pine-tree', x, z, { yaw: (i * 67) % 360, scale: 0.85 + ((i * 13) % 5) * 0.06 }));

// Check assets exist
const miss = [...new Set(places.map((p) => p.asset))].filter((a) => !existsSync(`out/${a}/${a}.glb`));
if (miss.length) console.log('MISSING:', miss.join(', '));

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/bandit-camp.ts', `// GENERATED by scripts/design-bandit-camp.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/bandit-camp.md', `# Bandit camp map (generated)

GENERATED by \`scripts/design-bandit-camp.mjs\`.

18 x 16 m roadside clearing on dirt ground inside a pine ring. A dirt road runs east-west along z = 5.

- NW: captain's tent, two tents, camp fire with four log seats, bedrolls, bandits, table.
- NE: loot wagons, stacked crates, chests, barrels and sacks.
- W: lookout guard-post with archer and torches over the road entry.
- SE: road barricade (fences, crates, spike traps, guards, brazier).

## Tally (${places.length} placements)

${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
console.log('wrote', places.length, 'places');
