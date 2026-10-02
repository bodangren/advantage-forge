#!/usr/bin/env node
// Fortified city map designer: 28 x 24 m walled city, gate and barbican south, keep on a rise north,
// moat south and east. Writes scenes/maps/fortified-city.ts and docs/map-mockups/fortified-city.md.
// Coordinates: +X east, -Z north, yaw 0 faces south (+Z). Anchor: docs/map-mockups/fortified-city.jpg.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const rnd = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// --- ground: tiles x -16..16, z -14..14 (2 m). Moat row z=13 (south) and column x=15 (east).
const MOAT_Z = 13, MOAT_X = 15;
for (let x = -15; x <= 15; x += 2)
  for (let z = -9; z <= 13; z += 2) {
    if (z === MOAT_Z && x !== 15) { put('river-straight', x, z, { yaw: 90 }); continue; }
    if (x === MOAT_X) { put('river-straight', x, z); continue; }
    const inside = Math.abs(x) < 14 && Math.abs(z) < 10.5;
    let a = 'grass-ground';
    if (inside) {
      a = 'cobble-floor';
      if (Math.abs(x) < 1 && z > 1) a = 'cobble-road-straight'; // main road gate -> keep
      else if (x >= 5 && x <= 11 && z >= 1 && z <= 7) a = 'stone-floor'; // market square (east)
    }
    put(a, x, z);
  }
// bridge over the moat at the gate (bridge spans along X, so turn it to span Z)
put('bridge', 0, MOAT_Z, { yaw: 90, scale: 1.2 });

// --- curtain walls (4 m sections; faces outward, stair inside)
for (let x = -12; x <= 12; x += 4) {
  if (x === 0) put('wall-gate', 0, 10, { yaw: 0 });
  else put('city-wall', x, 10, { yaw: 0 });
  put('city-wall', x, -10, { yaw: 180 });
}
for (let z = -8; z <= 8; z += 4) {
  put('city-wall', 14, z, { yaw: 90 });
  put('city-wall', -14, z, { yaw: 270 });
}
// corner towers, barbican towers flanking the gate, mid-wall buttress towers
for (const [x, z] of [[-14, -10], [14, -10], [-14, 10], [14, 10]]) put('tower', x, z, { scale: 1.0 });
for (const x of [-3.2, 3.2]) put('tower', x, 11.0, { scale: 0.75 });
// barbican: forward wall stubs and banners at the gate
put('city-wall', -6, 12, { yaw: 0, scale: 0.5 });
put('city-wall', 6, 12, { yaw: 0, scale: 0.5 });
put('banner', -1.9, 11.2); put('banner', 1.9, 11.2);
put('lantern', -1.6, 9); put('lantern', 1.6, 9);
// archers on the ramparts (the stair walkway sits behind each wall)
for (const [x, z] of [[-10, 10], [10, 10], [-10, -10], [10, -10], [14, -4], [-14, 4]])
  put('guard', x, z, { y: 3.0, yaw: Math.abs(x) === 14 ? (x > 0 ? 90 : 270) : z > 0 ? 0 : 180, scale: 0.9 });

// --- keep on a rise (north centre)
for (let x = -3; x <= 3; x += 2) for (let z = -6; z <= 0; z += 2) put('stone-floor', x, z, { y: 0.3 });
for (let x = -1; x <= 1; x += 2) for (let z = -5; z <= -3; z += 2) put('stone-floor', x, z, { y: 0.6 });
put('tower', 0, -4, { y: 0.6, scale: 1.2 });
for (const [x, z] of [[-3, -6.3], [3, -6.3], [-3, -0.4], [3, -0.4]]) put('tower', x, z, { y: 0.3, scale: 0.5 });
for (const x of [-2, 2]) put('city-wall', x, -0.5, { y: 0.3, yaw: 0, scale: 0.5 });
put('city-wall', -3.4, -3.3, { y: 0.3, yaw: 270, scale: 0.5 });
put('city-wall', 3.4, -3.3, { y: 0.3, yaw: 90, scale: 0.5 });
put('stairs-stone', 0, 1.2, { yaw: 180, scale: 0.5 });
put('stairs-stone', -0.6, 1.2, { yaw: 180, scale: 0.5 });
put('stairs-stone', 0.6, 1.2, { yaw: 180, scale: 0.5 });
put('banner', -1.3, -1.2, { y: 0.3 }); put('banner', 1.3, -1.2, { y: 0.3 });
put('lantern', -0.8, 0.6, { y: 0.3 }); put('lantern', 0.8, 0.6, { y: 0.3 });
put('guard', -1.4, -0.2, { y: 0.3 }); put('guard', 1.4, -0.2, { y: 0.3 });

// --- west district: townhouses in two rows with an alley
const houses = [[-10.5, 6.2, 0], [-7, 6.2, 0], [-10.5, -1.2, 180], [-7, -1.2, 180], [-10.5, -6.2, 0], [-7, -6.2, 0]];
// every house keeps clear of the road (x within 1.2) and the keep rise (x -3.5..3.5, z -7..1)
for (const [x, z, yaw] of houses) put('townhouse', x, z, { yaw, scale: 0.62 });
put('well', -8.5, 2.6, { scale: 0.8 });
put('barrel', -9.8, 4.2); put('crate', -6.4, 3.8); put('barrel', -6.0, 4.2); put('lantern', -9.5, 2.6);
put('lantern', -4.2, 3.6);

// --- east: market square with tents, fountain, and a few houses behind
for (const [x, z, yaw] of [[6.5, 2.4, 180], [9.5, 2.4, 180], [12, 5, 90]]) put('market-tent', x, z, { yaw, scale: 0.95 });
put('fountain', 8.2, 5.0, { scale: 0.8 });
put('merchant-cart', 6.2, 6.4, { yaw: 30, scale: 0.9 });
put('crate', 10.8, 3.2); put('barrel', 10.8, 3.9); put('sack', 5.2, 3.2); put('sack', 11.2, 7.2);
put('lantern', 5.2, 5.8); put('lantern', 10.8, 6.0);
for (const [x, z, yaw] of [[7, -6.2, 0], [10.5, -6.2, 0], [7, -1.2, 180], [10.5, -1.2, 180]])
  put('townhouse', x, z, { yaw, scale: 0.62 });
put('lantern', 4.6, -3.4); put('lantern', -4.6, -3.4);
put('barrel', 12.6, -3.2); put('crate', 7.6, -3.4); put('crate', 7.9, -3.0, { y: 0 });

// --- gate yard guards and road lanterns
put('guard', -1.0, 7.5, { yaw: 180 }); put('guard', 1.0, 7.5, { yaw: 180 });
for (const z of [5]) { put('lantern', -1.3, z); put('lantern', 1.3, z); }


// --- outside: trees and bushes on the grass ring, rocks, sandy verge; avoid moat tiles
const ring = [];
for (let z = -9; z <= 9; z += 4) { ring.push([-15, z]); }
ring.forEach(([x, z], i) => {
  put(rnd(i) > 0.5 ? 'oak-tree' : 'bush', x + (rnd(i + 9) - 0.5) * 1.2, z + (rnd(i + 3) - 0.5) * 1.2, { yaw: rnd(i) * 360, scale: 0.7 + rnd(i + 5) * 0.4 });
});
// archers' crates on the walls and barrels near the towers
put('barrel', -12.4, 8.4); put('crate', -12.4, -8.4); put('barrel', 12.4, -8.4); put('crate', 12.4, 8.4);
put('barrel', 12.6, 8.9);

// --- write
const nonGround = places;
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
const src = `// GENERATED by scripts/design-fortified-city.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] { return ${JSON.stringify(places)}; }
`;
writeFileSync('scenes/maps/fortified-city.ts', src);
writeFileSync('docs/map-mockups/fortified-city.md', `# Fortified city map

28 m x 24 m walled city (generated by scripts/design-fortified-city.mjs). Gate and barbican on the south wall,
keep on a two-step stone rise in the north centre, west townhouse district, east market square, moat on the south
and east sides crossed by a bridge at the gate. Day lighting.

Placements: ${places.length}

Tally:
${Object.entries(tally).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
console.log(places.length, JSON.stringify(tally));
