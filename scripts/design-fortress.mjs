#!/usr/bin/env node
// Fortress map designer: double-walled fortress, seen from the south. Writes
// scenes/maps/fortress.ts and docs/map-mockups/fortress.md from one data table.
// Grid: tiles 2 m, cols x=-11..11 (12), rows z=-9..9 (10). North = -Z.
// Outer wall x=+-8, north z=-8, low south parapet z=4. Inner wall z=-2. Moat row z=7.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// Ground
for (let x = -11; x <= 11; x += 2)
  for (let z = -9; z <= 9; z += 2) {
    if (z === 7) { put('river-straight', x, z, { yaw: 90 }); continue; }
    const inside = Math.abs(x) <= 7 && z >= -7 && z <= 3;
    const road = x === 1 && (z === 5 || z === 9);
    put(inside ? 'cobble-floor' : 'grass-ground', x, z);
  }
// Terrace for the keep: two stacked layers
for (let x = -5; x <= 5; x += 2) for (let z = -7; z <= -5; z += 2) put('stone-floor', x, z, { y: 0.3 });
for (let x = -3; x <= 3; x += 2) for (let z = -7; z <= -5; z += 2) put('stone-floor', x, z, { y: 0.6 });
// Keep: the tallest tower, flanked by two small towers
put('tower', 0, -6.2, { y: 0.6, scale: 0.95 });
put('tower', -4, -5.6, { y: 0.3, scale: 0.5 });
put('tower', 4, -5.6, { y: 0.3, scale: 0.5 });
put('stairs-stone', -1.8, -3.7, { yaw: 0, scale: 0.4 });
put('stairs-stone', 1.8, -3.7, { yaw: 0, scale: 0.4 });
put('stairs-stone', 0, -3.6, { scale: 0.5 });
put('flag', 0, -6.2, { y: 0.6 + 6.0 * 0.95, scale: 0.8 });
put('flag', -4, -5.6, { y: 0.3 + 3.0, scale: 0.6 });
put('flag', 4, -5.6, { y: 0.3 + 3.0, scale: 0.6 });
for (const x of [-2.6, 2.6]) put('brazier', x, -4.3, { y: 0.3 });
for (const x of [-1, 1]) put('guard', x, -3.2, { y: 0.15, yaw: 0 });

// Outer wall: north and sides, 2 m stone-wall segments (1.5 m high)
for (let x = -7; x <= 7; x += 2) put('stone-wall', x, -8);
for (let z = -7; z <= 3; z += 2) { put('stone-wall', -8, z, { yaw: 90 }); put('stone-wall', 8, z, { yaw: 90 }); }
// Inner wall with gate
for (const s of [-1, 1]) for (const x of [2, 4, 6]) put('stone-wall', s * x, -2);
for (const s of [-1, 1]) put('stone-wall', s * 7.5, -2, { scale: 0.5 });
put('wall-gate', 0, -2, { scale: 0.45 });
// Corner towers (outer)
for (const [x, z] of [[-8, -8], [8, -8], [-8, 4], [8, 4]]) { put('tower', x, z, { scale: 0.65 }); put('flag', x, z, { y: 6.0 * 0.65, scale: 0.7 }); }
// Gate towers and the front gate
put('wall-gate', 0, 4, { scale: 0.6 });
for (const s of [-1, 1]) { put('tower', s * 3.3, 4, { scale: 0.6 }); put('flag', s * 3.3, 4, { y: 3.6, scale: 0.6 }); }
// Low parapet on the south wall (0.75 m high)
for (const s of [-1, 1]) for (let x = 4.9; x <= 6.9; x += 1) put('stone-wall', s * x, 4, { scale: 0.5 });
for (const s of [-1, 1]) put('stone-wall', s * 7.4, 4, { scale: 0.5 });
// Bridge over the moat, road to the gate
put('bridge', 0, 7, { yaw: 90 });
put('cobble-road-straight', 0, 5, { yaw: 0 });
put('cobble-road-straight', 0, 9, { yaw: 0 });
for (const s of [-1, 1]) { put('torch', s * 1.4, 5.3); put('brazier', s * 1.6, 9.2); }

// Parade ground: banners on the inner wall, braziers, guards, knights, corner stores
for (const x of [-6.4, -4.4, -2.4, 2.4, 4.4, 6.4]) put('banner', x, -1.6);
for (const x of [-6, -3, 3, 6]) put('brazier', x, 2.4);
for (const x of [-1.6, 1.6]) put('guard', x, 3.0);
for (const x of [-3, -1, 1, 3]) { put('knight', x, -0.2); }
for (const x of [-2, 2]) { put('knight', x, 1.0); }
put('well', -6.3, 0.8, { scale: 0.7 });
put('barrel', 7.2, 2.6); put('barrel', 6.6, 3.0); put('crate', 7.3, 1.8); put('crate', 7.3, 1.2, { yaw: 20 }); put('sack', 6.4, 2.2);
put('barrel', -7.2, -0.8); put('crate', -7.2, 2.8); put('crate', -6.6, 3.1, { yaw: 30 }); put('hay-bale', 7.2, -0.8);
for (const [x, z] of [[-7.2, -7], [7.2, -7], [-7.2, -5.3], [7.2, -5.3]]) put('torch', x, z);
for (const x of [-6.5, 6.5]) put('banner', x, -7.4, { yaw: 0 });

// Siege camp outside, south of the moat and on the flanks
put('tent', -9.6, 9.0, { yaw: 160 }); put('tent', -6.4, 9.2, { yaw: 200 }); put('tent', 9.8, 9, { yaw: 20 });
put('campfire', -8.0, 9.2); put('campfire', 8.0, 9.0);
for (const x of [-4.8, -3.5, 3.5, 4.8]) put('fence', x, 9.4, { scale: 0.7 });
put('fence', -3, 5.6, { yaw: 90, scale: 0.7 }); put('fence', 3, 5.6, { yaw: 90, scale: 0.7 });
put('war-wagon', 6.2, 9.0, { yaw: 160, scale: 0.9 });
put('hay-bale', -10.4, 5.6); put('barrel', 10.5, 5.7); put('crate', 10.2, 6.4); put('sack', -9.6, 6.0);
put('spear', -2.4, 9.0, { yaw: 20 }); put('spear', 2.4, 9.2, { yaw: -15 });
for (const [x, z] of [[-10.6, -8.5], [10.6, -8.5], [-10.4, -3], [10.5, -2.5], [-10.5, 2], [10.6, 2.5], [-3, -9.4], [4.5, -9.4]]) put('boulder', x, z, { scale: 0.7 });
for (const [x, z] of [[-10.5, -6], [10.4, -5.5], [-10.6, 0], [10.3, 0.3], [-5.5, -9.5], [6.5, -9.5], [-11, 8], [11, 8]]) put('bush', x, z, { scale: 0.8 });
for (const [x, z] of [[-10.2, -4.5], [10.2, -4], [-10.3, 4.4], [10.2, 4.5], [-1.5, -9.4], [1.5, -9.4]]) put('wildflowers', x, z);
put('fallen-log', 10.2, -1.4, { yaw: 80 }); put('stump', -10.3, 1.2);
for (const s of [-1, 1]) for (const z of [-3, 0, 3]) put('torch', s * 8.8, z);

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `    { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/fortress.ts', `// GENERATED by scripts/design-fortress.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/fortress.md', `# Fortress map (generated)

24 m x 20 m. Day light. ${places.length} placements.

Layout: outer wall (x +-8, north z -8, low parapet on the south z 4) with four corner towers and two gate towers
around a wall-gate; moat row at z 7 with a bridge and a cobble road; cobble parade ground with banners on the
inner wall (z -2, gate at x 0); inner keep on a two-layer stone terrace with two small flank towers and stairs;
siege camp outside (tents, campfires, fence barricades, war-wagon as the catapult-like cart, hay and spears).

## Tally
${Object.entries(tally).sort().map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## Notes
No catapult or barricade asset exists; fence and war-wagon stand in.
`);
console.log(places.length, 'placements');
