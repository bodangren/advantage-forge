#!/usr/bin/env node
// Abandoned fort map (20 m x 18 m): broken curtain wall, leaning watchtower NW, empty barracks SE,
// rusted gate north, dry well yard in the middle. Writes scenes/maps/abandoned-fort.ts and
// docs/map-mockups/abandoned-fort.md. Ground tiles centered X=-9..9 (10 cols), Z=-8..8 (9 rows).
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
// deterministic jitter
let s = 7;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);

// --- ground: stone-ground ring, cobble core, grass-ground taking over in patches, wood-floor barracks
const inBarracks = (x, z) => [3, 5, 7].includes(x) && [2, 4, 6].includes(z);
const grassy = (x, z) => Math.sin(x * 0.55 + z * 0.3) + Math.cos(z * 0.5 - x * 0.35) > 0.9;
for (let x = -9; x <= 9; x += 2)
  for (let z = -8; z <= 8; z += 2) {
    let a = 'stone-ground';
    if (inBarracks(x, z)) a = 'wood-floor';
    else if (grassy(x, z)) a = 'grass-ground';
    else if ((Math.abs(x) <= 5 && z >= -4 && z <= 2) || (x === 3 && z <= -4)) a = 'cobble-floor';
    put(a, x, z);
  }

// --- perimeter: city-wall (scale 0.7 -> 2.8 m long, 2.1 m tall) standing, broken-wall (scale 1.4) ruins
const C = 'city-wall', B = 'broken-wall';
const S = 2.8, AX = [-8.4, -5.6, -2.8, 0, 2.8, 5.6, 8.4];
const wall = (a, x, z, yaw) => put(a, x, z, { yaw, scale: a === C ? 0.7 : 1.4 });
// north z=-8.2 (gate at x=2.8; broken east of it)
['C','C','B','G','GATE','B','G'].forEach((k, i) => {
  const x = AX[i];
  if (k === 'C') wall(C, x, -8.2, 180);
  if (k === 'B') wall(B, x, -8.2, i < 4 ? 180 : 0);
});
put('wall-gate', 2.8, -8.2, { scale: 0.75 });
put('rubble', 1.6, -6.6, { yaw: 30, scale: 1.5 }); // smashed gate debris
put('rubble', 4.2, -6.7, { yaw: 120, scale: 1.5 });
put('crate', 3.6, -6.2, { yaw: 40, scale: 0.7 }); // broken door beside the gate
// south z=8.2: collapsed middle
['C','C','B','G','G','B','C'].forEach((k, i) => {
  const x = AX[i];
  if (k === 'C') wall(C, x, 8.2, 0);
  if (k === 'B') wall(B, x, 8.2, i < 3 ? 0 : 180);
});
put('rubble', -1.4, 7.2, { yaw: 50, scale: 1.5 });
put('rubble', 0.2, 7.5, { yaw: 120, scale: 1.5 });
put('rubble', 1.8, 7.3, { yaw: 200, scale: 1.5 });
// west x=-9.2 and east x=9.2 (z step 2.8, between the corner pieces)
const AZ = [-5.6, -2.8, 0, 2.8, 5.6];
['C','C','G','B','C'].forEach((k, i) => {
  if (k === 'C') wall(C, -9.2, AZ[i], 270);
  if (k === 'B') wall(B, -9.2, AZ[i], 270);
});
put('rubble', -8.2, 0, { yaw: 80, scale: 1.5 });
['C','B','C','C','G'].forEach((k, i) => {
  if (k === 'C') wall(C, 9.2, AZ[i], 90);
  if (k === 'B') wall(B, 9.2, AZ[i], 90);
});
put('rubble', 8.2, 5.6, { yaw: 10, scale: 1.5 });

// --- corners: one block each
put('tower', -8.2, -7.4, { scale: 0.75, yaw: 20 }); // watchtower NW
put('rampart', 8.2, -7.4, { scale: 0.65, yaw: 180 }); // NE, merlons missing
put('rampart', -8.3, 7.4, { scale: 0.5, yaw: 90 }); // SW stub
put('ruin-column', 8.3, 7.4, { yaw: 220 }); // SE
// fallen column group
put('ruin-column', 5.6, 0.2, { yaw: 70 });
put('ruin-column', 6.6, -0.6, { yaw: 160 });
put('ruin-column', 6.2, 1.2, { yaw: 20, scale: 0.8 });
put('rubble', 5.4, -0.9, { yaw: 100, scale: 1.2 });

// --- barracks (empty, roofless): only a north and a west timber wall
for (const x of [3, 5, 7]) put('timber-wall', x, 1, { yaw: 0 });
for (const z of [2, 4]) put('timber-wall', 2, z, { yaw: 90 });
put('crate', 3.6, 2.8, { yaw: 20 });
put('crate', 4.4, 2.7, { yaw: 70 });
put('barrel', 7.6, 2.8);
put('bone-pile', 5.2, 5.8, { yaw: 30 });
put('crate', 7.2, 6.4, { yaw: 300 });

// --- left-behind items
put('wagon', -4.6, 4.8, { yaw: 35 }); // broken wagon
put('banner', -1.2, 5.0, { yaw: 80, scale: 0.8 });
put('vines', 4, 0.75, { scale: 0.9 });

// --- dry well yard
put('well', -2, 0.5, { scale: 0.9 });
put('rubble', -3.4, -0.4, { yaw: 60 });
put('bone-pile', -0.6, 1.8, { yaw: 120, scale: 0.8 });
put('crate', -4.8, 2.4, { yaw: 40 });
put('barrel', -5.6, 2.8);
put('crate', -5.0, 3.4, { yaw: 100, scale: 0.8 });
put('dead-tree', -6.8, -1.6, { yaw: 40, scale: 0.8 });

// --- gate story: rubble and fallen stones near the gate and breaks
put('rubble', 3.2, -6.4, { yaw: 10 });
put('rubble', 1.6, -6.9, { yaw: 100, scale: 0.9 });
put('rubble', -5, -6.6, { yaw: 200 });
put('rubble', -3.2, 6.8, { yaw: 130, scale: 1.1 });
put('rubble', 0.2, 7.2, { yaw: 20, scale: 1.3 });
put('rubble', 2.0, 7.0, { yaw: 250 });
put('rubble', -8.2, -1.4, { yaw: 300 });
put('rubble', -8.0, 0.4, { yaw: 30, scale: 1.1 });
put('rubble', 8.2, -3.8, { yaw: 160 });
put('rubble', 4.0, 7.0, { yaw: 70, scale: 0.8 });
put('banner', 1.0, -6.8, { yaw: 0, scale: 0.8 });

// --- vines/ivy climbing wall inner faces
put('vines', 0, -7.55, { scale: 1.2 });
put('ivy', -4.2, -7.55, { scale: 1.2 });
put('ivy', -6.8, -7.5);
put('vines', -8.55, -2.8, { yaw: 90, scale: 1.2 });
put('ivy', -8.55, 3, { yaw: 90 });
put('ivy', 8.55, -2.8, { yaw: 270, scale: 1.2 });
put('vines', 8.55, 2.8, { yaw: 270 });
put('ivy', -5.6, 7.55, { yaw: 180, scale: 1.2 });
put('vines', 6, 7.55, { yaw: 180 });
put('tall-grass', -0.5, -1.5); put('tall-grass', 3.4, -3.2, { yaw: 60 }); put('tall-grass', -4, -3.4, { yaw: 120 });
put('tall-grass', 1.6, 3.6, { yaw: 30 }); put('tall-grass', -6.6, 1.2); put('tall-grass', 0.6, 5.4, { yaw: 200 });

// --- overgrowth: bushes tucked at the inner wall feet
const BUSH = [[-7.4,-5.2],[-7.6,1.6],[-7.6,5.2],[7.4,-5.2],[7.6,-1.8],[7.6,3.6],[-6,7.3],[1.8,-7.3],[-1.4,-7.3],[6.6,-7.3],[-2.6,7.4],[8.2,6.2]];
BUSH.forEach(([x, z], i) => put('bush', x, z, { yaw: (i * 67) % 360, scale: 0.8 + (i % 3) * 0.2 }));

writeFileSync('scenes/maps/abandoned-fort.ts', `// GENERATED by scripts/design-abandoned-fort.mjs \u2014 edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] { return ${JSON.stringify(places, null, 1).replace(/\n\s*/g, ' ')}; }
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/abandoned-fort.md', `# Abandoned fort (generated)

20 m x 18 m. Stone-ground, cobble courtyard, wood-floor barracks (SE), leaning tower (NW), rampart ruin (NE),
rusted gate (north, x=3), dry well yard (centre-west), collapsed south wall. ${places.length} pieces.

Tally: ${Object.entries(tally).map(([k, v]) => k + ' ' + v).join(', ')}
`);
console.log(places.length, JSON.stringify(tally));
