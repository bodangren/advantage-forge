#!/usr/bin/env node
// Lake shore map designer. Grid 11 x 9 tiles of 2 m (22 x 18 m). Lake along the north edge.
// Writes scenes/maps/lake-shore.ts and docs/map-mockups/lake-shore.md.
import { writeFileSync } from 'node:fs';
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
// seeded rng
let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const r2 = (a, b) => a + (b - a) * rnd();
const yawr = () => Math.round(r2(0, 359));

const cols = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
const rows = [-8, -6, -4, -2, 0, 2, 4, 6, 8];
// water: rows -8,-6 all; row -4 water for x<=2
const isWater = (x, z) => x <= 4 && (z <= -6 || (z === -4 && x <= 2));
const PATHROW = -2;
const dirtZone = (x, z) => (x >= 0 && x <= 4 && z >= 0 && z <= 2); // camp clearing
const glyph = [];
for (const z of rows) {
  let row = '';
  for (const x of cols) {
    if (isWater(x, z)) { put('sea-water', x, z); row += '~'; }
    else if (z === PATHROW && x !== 10 + 99) {
      // path runs east-west along the shore, bends south at x=6 to the camp and cottage
      if (x === 6) { put('footpath-corner', x, z, { yaw: 180 }); row += '+'; }
      else if (x < 6) { put('footpath-straight', x, z, { yaw: 90 }); row += '='; }
      else { put('grass-ground', x, z); row += '.'; }
    } else if (x === 6 && z >= 0 && z <= 6) { put('footpath-straight', x, z, { yaw: 0 }); row += '='; }
    else if (dirtZone(x, z)) { put('dirt-ground', x, z); row += ','; }
    else { put('grass-ground', x, z); row += '.'; }
  }
  glyph.push(row);
}
// ---- lake: pier + boats
put('dock', -4, -4.5, { scale: 0.85 });
put('rowboat', -5.9, -5.0, { yaw: 100, y: -0.03 });
put('rowboat', -0.5, -6.6, { yaw: 55, y: -0.03, scale: 0.9 });
put('fishing-net', -3.2, -2.6, { yaw: 180 }); // drying net by the pier root
put('barrel', -2.9, -2.9, { yaw: 20 });
put('crate', -5.1, -2.7, { yaw: 15 });
put('crate', -5.2, -3.15, { yaw: 40, scale: 0.8 });
for (const [x, z] of [[-8.4, -5.2], [-2, -4.2], [1.6, -3.4], [-9.4, -3.4], [-7.6, -7.4], [2.2, -7.4]]) put('cattails', x, z, { yaw: yawr(), y: -0.03 });
for (const [x, z] of [[-1.2, -3.6], [0.6, -3.2], [-8.6, -3.4], [-6.8, -3.5], [-0.2, -3.5], [2.4, -3.1], [-9.8, -3.2], [-7.4, -3.2]]) put('reeds', x, z, { yaw: yawr(), y: -0.03 });
put('boulder', -8.6, -4.6, { yaw: 40, y: -0.05, scale: 0.9 });
put('boulder', 1.2, -4.8, { yaw: 120, y: -0.05, scale: 0.8 });
put('rock-cluster', -1.8, -4.3, { yaw: 60, y: -0.05 });
put('rock-cluster', 4.4, -3.0, { yaw: 200 });
// ---- cottage zone (NE)
put('cottage', 7.6, -4.6, { yaw: 200, scale: 1.0 });
put('barrel', 9.1, -3.1);
put('crate', 5.9, -2.8, { yaw: 20 });
put('bench', 8.6, -2.9, { yaw: 180 });
put('willow-tree', 5.2, -4.3, { yaw: 20, scale: 1.0 });
put('willow-tree', 9.6, -7.0, { yaw: 100, scale: 1.1 });
put('oak-tree', 6.4, -7.3, { yaw: 40, scale: 0.9 });
put('bush', 9.4, -5.6, { yaw: 30 });
put('bush', 6.0, -6.2, { yaw: 80, scale: 0.8 });
put('bush', 9.8, -1.0, { yaw: 160 });
// ---- camp zone (center)
put('campfire', 2.0, 1.0, { scale: 1.3 });
put('fallen-log', 0.6, 1.4, { yaw: 100 });
put('tree-stump', 3.5, 0.4, { yaw: 30, scale: 0.8 });
put('tree-stump', 3.2, 2.0, { yaw: 200, scale: 0.7 });
put('barrel', 0.3, 0.1, { yaw: 40 });
put('crate', 1.0, -0.5, { yaw: 25 });
put('tall-grass', 4.4, 1.0, { yaw: 30 });
put('rock-cluster', 2.6, 2.5, { yaw: 100 });
// ---- south meadow (fence, flowers, boulders)
for (let i = 0; i < 11; i++) put('fence', -10 + i * 1.9 + 1, 8.7, { yaw: 0 });
for (let i = 0; i < 5; i++) put('fence', 10.6, 5 + i * 1.9 - 0.5, { yaw: 90 });
put('boulder', -6.2, 3.4, { yaw: 30 });
put('boulder', -7.4, 3.8, { yaw: 100, scale: 0.7 });
put('boulder', -3.4, 6.2, { yaw: 200, scale: 1.1 });
put('boulder', 9.2, 6.6, { yaw: 70 });
put('rock-cluster', -8.8, 6.6, { yaw: 10 });
put('rock-cluster', 4.2, 7.0, { yaw: 150 });
put('tree-stump', -9.2, 1.2, { yaw: 40 });
for (let i = 0; i < 18; i++) put('wildflowers', r2(-9.6, 4), r2(-0.6, 7.6), { yaw: yawr() });
for (let i = 0; i < 16; i++) put('tall-grass', r2(-9.6, 9.6), r2(-0.8, 7.8), { yaw: yawr() });
// bushes + willows + oaks around edges
for (const [x, z] of [[-9.4, 8], [-5.6, 8.1], [-1.8, 7.9], [2, 8], [6, 8.1], [9.6, 8.2], [-10.2, 4.6], [-10.2, -1.2], [-9.2, -1], [-5, 0.2], [-2, 4.2], [7.8, 3.8]]) put('bush', x, z, { yaw: yawr(), scale: r2(0.8, 1.15) });
put('willow-tree', -9.0, -1.2, { yaw: 60, scale: 1.15 });
put('willow-tree', -1.6, -1.3 + 0.0, { yaw: 220, scale: 0.9 });
put('willow-tree', -7.6, 7.0, { yaw: 300 });
put('oak-tree', -9.6, 5.8, { yaw: 20, scale: 0.9 });
put('oak-tree', 9.4, 3.2, { yaw: 120, scale: 0.9 });
put('oak-tree', 5.2, 6.4, { yaw: 70, scale: 0.85 });
put('oak-tree', 0.4, 6.8, { yaw: 160, scale: 0.8 });
// ---- bank grass/reed tufts just inland of the path
for (let i = 0; i < 10; i++) put('reeds', -9.5 + i * 2, -1.0 + r2(-0.1, 0.5), { yaw: yawr(), scale: r2(0.8, 1.1) });
// figure for scale

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `    { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/lake-shore.ts', `// GENERATED by scripts/design-lake-shore.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/lake-shore.md', `# Lake shore (generated)

GENERATED by scripts/design-lake-shore.mjs. 22 x 18 m (11 x 9 tiles). Lake (sea-water, top y=-0.03) along the north edge;
a footpath along the shore bends south past a camp (dirt, campfire) to the fisherman cottage (NE). Dock and rowboats on the lake.

\`\`\`
${glyph.join('\n')}
\`\`\`

| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log(glyph.join('\n'), '\n', places.length, JSON.stringify(tally));
