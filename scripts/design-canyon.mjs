#!/usr/bin/env node
// Canyon map designer (P2): 26 m x 18 m red-rock canyon, Castle Defense path from south to north.
// Grid 13 x 9 tiles of 2 m: col 0..12 west->east x=(c-6)*2, row 0..8 north->south z=(r-4)*2.
// Anchor: docs/map-mockups/canyon.jpg. Writes scenes/maps/canyon.ts and docs/map-mockups/canyon.md.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = Math.round(o.yaw) % 360;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// River: [x, z, asset, yaw]. Winds S -> bend west bank -> east -> north. Bend yaw: 0 {N,E}, 90 {N,W}, 180 {S,W}, 270 {S,E}.
const RIVER = new Map([
  ['-2,8', ['river-straight', 0]], ['-2,6', ['river-straight', 0]], ['-2,4', ['river-straight', 0]],
  ['-2,2', ['river-bend', 270]], ['0,2', ['river-bend', 90]],
  ['0,0', ['river-straight', 0]], ['0,-2', ['river-straight', 0]],
  ['0,-4', ['river-bend', 270]], ['2,-4', ['river-bend', 90]],
  ['2,-6', ['river-straight', 0]], ['2,-8', ['river-straight', 0]],
]);
// Dry-bed path (dirt): east bank south, bridge over (0,0), west bank north to the cave.
const PATH = new Set(['2,8', '2,6', '2,4', '2,2', '2,0', '-4,0', '-4,-2', '-4,-4', '-4,-6', '-4,-8', '4,0']);
// path along east bank crosses bridge at z=0 going west: cells 2,0 / bridge / -2,0 / -4,0
PATH.add('-2,0');
for (let c = 0; c <= 12; c++)
  for (let r = 0; r <= 8; r++) {
    const x = (c - 6) * 2, z = (r - 4) * 2, k = `${x},${z}`;
    if (RIVER.has(k)) { const [a, y] = RIVER.get(k); put(a, x, z, { yaw: y }); }
    else put(PATH.has(k) ? 'dirt-ground' : 'desert-ground', x, z);
  }

// --- cliff walls (red-rock stand-ins), back row taller, front row with jitter
const wall = (x, z, yaw, s) => put('cliff-face', x, z, { yaw: yaw + (rnd() - 0.5) * 16, scale: s });
// north wall: back row z=-8.2, front row z=-6.4 with gap for the cave at x=-8 (cell -4)
for (let x = -11.5; x <= 12; x += 4.4) wall(x, -8.3, 0, 1.9 + rnd() * 0.3);
for (let x = -11; x <= 12; x += 4.2) if (Math.abs(x + 8) > 2.6 && Math.abs(x - 5) > 99) wall(x, -6.6, 0, 1.35 + rnd() * 0.25);
// west wall
for (let z = -5; z <= 8; z += 4.2) wall(-12.3, z, 90, 1.9 + rnd() * 0.3);
for (let z = -3; z <= 8; z += 4.0) if (z < 2.5 || z > 4.5) wall(-10.4, z, 90, 1.3 + rnd() * 0.25);
// east wall (taller, with a second cave)
for (let z = -5; z <= 8; z += 4.2) wall(12.3, z, 270, 1.9 + rnd() * 0.3);
for (let z = -3; z <= 8; z += 4.0) if (Math.abs(z + 1) > 2.2) wall(10.4, z, 270, 1.3 + rnd() * 0.25);
// south corners: low outcrops flanking the entry
wall(-9.6, 8, 0, 1.2); wall(-11.4, 8.4, 0, 1.4); wall(9.5, 8, 0, 1.2); wall(11.4, 8.4, 0, 1.4);
// fill the hidden corners
wall(-11.5, -8.3, 45, 2.1); wall(11.5, -8.3, 315, 2.1);

// --- focal: cave mouth in the north wall, bridge over the dry river
put('cave-mouth', -8, -6.0, { scale: 1.2 });
put('cave-mouth', 9.3, -1, { yaw: 270, scale: 1.0 });
put('bridge', 0, 0, { yaw: 0 }); // spans x across the river tile (0,0)
put('signpost', 3.2, 6.6, { yaw: 200 });

// --- zones
// SW: wagon wreck camp
put('wagon', -7.2, 3.2, { yaw: 60 });
put('crate', -5.6, 2.2, { yaw: 20 }); put('crate', -5.2, 3.0, { yaw: 70, scale: 0.8 });
put('barrel', -8.6, 1.6, { yaw: 0 }); put('barrel', -8.9, 2.4, { yaw: 40 });
put('bone-pile', -5.2, 5.4, { yaw: 120 });
put('dead-tree', -9.0, 5.6, { yaw: 210 });
put('bandit', -6.0, 0.6, { yaw: 200, scale: 1.6 });
put('rock-cluster', -4.8, 6.8, { yaw: 50, scale: 1.4 });
put('boulder', -10, 3.2, { yaw: 80 });
// SE: dry flats
put('dead-tree', 6.4, 4.4, { yaw: 100 });
put('dead-tree', 8.8, 6.6, { yaw: 300 });
put('cactus', 6.2, 7.2); put('cactus', 8.2, 2.6, { yaw: 90 }); put('cactus', 4.8, 2.4, { scale: 0.9 });
put('boulder', 5.6, 5.8, { yaw: 20 }); put('boulder', 9.0, 4.4, { yaw: 140, scale: 1.2 });
put('rock-cluster', 7.4, 1.6, { yaw: 200 }); put('rock-cluster', 4.2, 4.4, { yaw: 300 });
// N: bridge and cave approach
put('adventurer', 2.4, 7.0, { yaw: 180, scale: 1.6 });
put('ranger', 4.6, -3.0, { yaw: 220, scale: 1.6 });
put('boulder', -2.2, -3.4, { yaw: 60 }); put('rock-cluster', -2.6, -5.4, { yaw: 10 });
put('rock-cluster', 5.4, -5.6, { yaw: 120, scale: 1.3 }); put('boulder', 7, -4.2, { yaw: 70 });
put('dead-tree', -6.4, -3.2, { yaw: 40 });
put('cactus', 6.8, -2.6); put('cactus', -7, -1.2, { scale: 0.8 });
put('torch', -5.8, -5.2, { yaw: 0 });
put('bone-pile', -2.4, -6.4, { yaw: 40 });
// west and south fill
put('dead-tree', -8.2, 6.8, { yaw: 30 }); put('cactus', -6.4, 6.4, { scale: 1.1 }); put('cactus', -9.4, 4.6);
put('rock-cluster', -0.8, 6.2, { yaw: 100, scale: 1.3 }); put('cactus', 0.6, 4.4); put('boulder', -0.6, 3.6, { yaw: 200 });
put('rock-cluster', -7.6, -0.6, { yaw: 160 }); put('bone-pile', 6.4, -0.8, { yaw: 300 });
put('boulder', 1.8, -2.4, { yaw: 30, scale: 0.9 }); put('rock-cluster', -3.2, 2.8, { yaw: 250 });
put('dead-tree', 3.4, -6.6, { yaw: 150 }); put('cactus', -4.6, -2.6, { scale: 0.9 });
// cliff-foot rubble (edge dressing)
const foot = [];
for (let x = -10; x <= 10; x += 3.4) foot.push([x, -4.9]);
for (let z = -4; z <= 7; z += 3.3) { foot.push([-9.6, z]); foot.push([9.6, z]); }
for (const [x, z] of foot) {
  const nearPath = Math.abs(x + 8) < 2 && z < -4;
  if (nearPath || places.some((p) => Math.hypot(p.at[0] - x, p.at[2] - z) < 1.6 && p.asset !== 'desert-ground' && p.asset !== 'dirt-ground' && !p.asset.startsWith('river') && p.asset !== 'cliff-face')) continue;
  put(rnd() > 0.5 ? 'boulder' : 'rock-cluster', x + rnd() - 0.5, z + rnd() - 0.5, { yaw: rnd() * 360, scale: 0.9 + rnd() * 0.5 });
}

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${num(p.scale)}` : ''} },`;
writeFileSync('scenes/maps/canyon.ts', `// GENERATED by scripts/design-canyon.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/canyon.md', `# Canyon map (generated by scripts/design-canyon.mjs)

26 m x 18 m (13 x 9 tiles). Cell centre x=(c-6)*2, z=(r-4)*2. Castle Defense path: enters south at x=2 on the
east bank, crosses the bridge at (0,0), runs north on the west bank to the cave mouth in the north wall.
A river winds S -> W bend -> E -> N. Red-rock stand-ins: cliff-face rows on the north, west and east edges.

Zones: SW wagon-wreck camp (bandit, crates, bones); SE dry flats (cacti, dead trees, boulders); N cave approach.
Focal object: the bridge; second focal: the cave mouth.

## Tally (${places.length})
${Object.entries(tally).map(([a, n]) => `- ${a}: ${n}`).join('\n')}
`);
console.log(places.length, 'pieces');
