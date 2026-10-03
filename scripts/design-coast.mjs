#!/usr/bin/env node
// Rocky coast map designer: 12 x 9 tiles of 2 m (24 m x 18 m), all desert-ground sand.
// Two scaled-up ponds form the sea bay on the south (river tiles always show grass banks).
// Focal: tower as lighthouse + cottage on the NE headland. Writes scenes/maps/coast.ts and
// docs/map-mockups/coast.md. Cell (c,r): x = (c-6.5)*2, z = (r-5)*2.
import { writeFileSync } from 'node:fs';

const X = (c) => (c - 6.5) * 2;
const Z = (r) => (r - 5) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
// sea: south rows with a wavy shore, plus a west bay
const isSeaCell = (c, r) => r >= 8 + (c >= 4 && c <= 8 ? 0 : 0) - (c <= 5 ? 1 : 0) - (c <= 3 ? 1 : 0) + (c >= 9 ? 0 : 0) && !(c >= 7 && c <= 9 && r === 7) || (c <= 2 && r >= 4) || (c === 3 && r >= 6 && r <= 9) || (c >= 11 && r >= 7) || (c === 12 && r >= 6);
const glyph = Array.from({ length: 9 }, () => Array(12).fill('.'));
const sea = new Set();
for (let c = 1; c <= 12; c++) for (let r = 1; r <= 9; r++) {
  if (isSeaCell(c, r)) { put('sea-water', X(c), Z(r)); sea.add(c + ',' + r); glyph[r - 1][c - 1] = '~'; }
  else put('desert-ground', X(c), Z(r));
}
// shoreline: dress every sand tile that touches sea
const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
let n = 0;
for (let c = 1; c <= 12; c++) for (let r = 1; r <= 9; r++) {
  if (sea.has(c + ',' + r)) continue;
  for (const [dc, dr] of dirs) if (sea.has((c + dc) + ',' + (r + dr))) {
    const ex = X(c) + dc * 0.55, ez = Z(r) + dr * 0.55;
    const t = dr ? 1 : 0; // along-edge axis
    for (const o of [-0.7, 0.7]) {
      const px = ex + (dr ? o : 0) + (rnd() - 0.5) * 0.3, pz = ez + (dc ? o : 0) + (rnd() - 0.5) * 0.3;
      if (n++ % 2) put('boulder', px + dc * 0.35, pz + dr * 0.35, { yaw: rnd() * 360, scale: +(0.7 + rnd() * 0.5).toFixed(2) });
      else put('sand-dune', px - dc * 0.2, pz - dr * 0.2, { yaw: rnd() * 360, scale: 0.6 });
    }
    put('shell', ex - dc * 0.4 + (dr ? 0.2 : 0), ez - dr * 0.4 + (dc ? 0.2 : 0), { yaw: rnd() * 360 });
  }
}
// --- pier into the west bay + rowboat
put('dock', -7.3, 3.0, { yaw: 90 });
put('dock', -9.3, 3.0, { yaw: 90 });
put('rowboat', -10.3, 4.9, { yaw: 80, y: -0.03 });
put('barrel', -6.0, 1.9, { yaw: 30 });
put('crate', -5.4, 2.5, { yaw: 15 });
put('crate', -6.4, 2.8, { yaw: 70, scale: 0.8 });
put('rope-coil', -6.9, 4.0, { yaw: 40 });
// --- headland: lighthouse, rock wall behind, rocks
put('lighthouse', 4.0, -4.2, { yaw: 200, scale: 0.75 });
put('cottage', 8.0, -3.0, { yaw: 250, scale: 0.65 });
put('rock-wall', 2.4, -7.4, { yaw: 0, scale: 0.9 });
put('rock-wall', 5.2, -7.6, { yaw: 0, scale: 0.9 });
put('rock-wall', 8.0, -7.6, { yaw: 0, scale: 0.9 });
put('rock-wall', 10.3, -6.4, { yaw: 90, scale: 0.9 });
put('boulder', 7.0, -5.6, { yaw: 120, scale: 1.3 });
put('boulder', 1.4, -5.8, { yaw: 30, scale: 1.2 });
put('tall-grass', 6.2, -3.2, { yaw: 40 });
put('tall-grass', 2.2, -2.4, { yaw: 200 });
// --- palms
for (const [x, z, s] of [[-7.4, -4.8, 1.2], [-5.6, -3.8, 1.0], [-9.0, -2.4, 1.0], [8.4, 0.6, 1.1], [6.4, 1.8, 0.9]]) put('palm-tree', x, z, { yaw: rnd() * 360, scale: s });
put('rock-cluster', -4.2, -6.4, { yaw: 80, scale: 1.4 });
put('rock-cluster', -9.8, -6.0, { yaw: 150, scale: 1.3 });
put('boulder', -10.8, -0.6, { yaw: 10, scale: 1.3 });
// --- rock stack east
put('boulder', 10.2, 1.8, { yaw: 20, scale: 2.0 });
put('boulder', 9.4, 3.4, { yaw: 100, scale: 1.7 });
put('boulder', 10.8, 0.2, { yaw: 250, scale: 1.7 });
put('rock-cluster', 9.0, 1.2, { yaw: 70, scale: 1.5 });
// --- sand mound and beach dressing
put('sand-dune', -0.6, -1.4, { yaw: 10, scale: 1.8 });
put('sand-dune', 1.8, -0.8, { yaw: 80, scale: 1.4 });
put('sand-dune', -2.8, -0.6, { yaw: 160, scale: 1.2 });
put('tall-grass', -0.6, 0.4, { yaw: 100 });
put('tall-grass', 1.6, 0.6, { yaw: 250 });
put('tall-grass', -5, -1, { yaw: 20 });
put('stump', -8.0, 0.2, { yaw: 200 });
put('campfire', -3.0, 1.2, { scale: 0.8 });
put('fishing-net', -1.4, 3.4, { yaw: 200 });
put('log', 0.4, 3.4, { yaw: 25 });
put('fallen-log', 3.4, 1.8, { yaw: 60, scale: 0.6 });
put('rowboat', 2.4, 4.4, { yaw: 5 });
put('shipwreck-hull', -1.0, 7.6, { yaw: 20, y: -0.03, scale: 0.7 });
put('coral-reef-cluster', 4.0, 7.2, { yaw: 40, y: -0.03 });
put('coral-reef-cluster', -4.4, 8.4, { yaw: 120, y: -0.03, scale: 0.8 });
put('coral', 8.4, 6.6, { yaw: 10, y: -0.03 });
put('river-rock', -4.4, 3.4, { yaw: 60, scale: 1.2 });
[[1.0, 2.2], [2.0, 3.0], [-0.4, 2.6], [3.0, 2.4], [0.2, 4.6]].forEach(([x, z], i) => put('shell', x, z, { yaw: i * 61 }));
mark_();
function mark_() {}
const mark = (x, z, g) => { const c = Math.round(x / 2 + 6.5), r = Math.round(z / 2 + 5); if (c >= 1 && c <= 12 && r >= 1 && r <= 9) glyph[r - 1][c - 1] = g; };
mark(-6, 5.8, '~'); mark(-8, 5.8, '~'); mark(-4, 5.8, '~'); mark(5, 5.8, '~'); mark(3, 5.8, '~'); mark(7, 5.8, '~');
mark(4.4, -4.6, 'L'); mark(-4.3, 4.7, 'P'); mark(1.8, 3.6, 'B'); mark(10, 2, 'R'); mark(-7.4, -4.8, 'T'); mark(-0.6, -1.2, 'M');
console.log(glyph.map((r) => '  ' + r.join(' ')).join('\n'));

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/coast.ts', `// GENERATED by scripts/design-coast.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/coast.md', `# Rocky coast map (generated)

GENERATED by \`scripts/design-coast.mjs\`. 12 x 9 sand tiles of 2 m (24 m x 18 m). x = (c-6.5)*2, z = (r-5)*2.

\`\`\`
${glyph.map((r) => '  ' + r.join(' ')).join('\n')}
\`\`\`
~ bay (pond scaled 4)  L lighthouse (tower x1.4) + cottage  P diagonal pier  B beached rowboat  R rock stack  T palms  M sand mound

## Layout
Sand beach; a two-lobe sea bay on the south built from scaled ponds (river tiles show grass banks).
Lighthouse and cottage on the north-east headland, palms north-west, sand mound centre, rock stack
east, a diagonal pier with a rowboat at its end in the west bay. Two shoreline groups of shells,
coral, driftwood and a net sit at the water line.

## Tally
| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log('wrote', places.length, 'places');
