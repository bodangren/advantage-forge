#!/usr/bin/env node
// Quarry map designer: 11 x 9 tiles of 2 m (22 m x 18 m). Cell (c,r): x=(c-6)*2, z=(r-5)*2.
// Terraces step up (0.3 m per level, stacked stone-ground) to the north and west; the pit floor is
// dirt. A corridor at column 7 holds the loading ramp. The road leaves the pit to the east at row 8.
import { writeFileSync } from 'node:fs';

const X = (c) => (c - 6) * 2;
const Z = (r) => (r - 5) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? lv(x, z) * 0.3, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const level = (c, r) => {
  if (r === 7 && c >= 7) return 0; // road band to the east edge
  const n = 0.6 * Math.sin(c * 2.3 + r * 1.7) + 0.5 * Math.cos(c * 1.1 - r * 2.9);
  const d = Math.hypot((c - 6.2) / 3.0, (r - 6.2) / 2.7);
  const wall = c <= 4 || r <= 3 ? 1.6 : 1.0; // west and north walls rise faster
  return Math.max(0, Math.min(3, Math.floor((d - 0.95) * 3 * wall + 0.6 + n * 0.5)));
};
const lv = (x, z) => level(Math.round(x / 2 + 6), Math.round(z / 2 + 5));
const ROAD = new Set(['7,7','8,7','9,7','10,7','11,7']);

for (let c = 1; c <= 11; c++)
  for (let r = 1; r <= 9; r++) {
    const L = level(c, r);
    if (L === 0) {
      if (!ROAD.has(`${c},${r}`) && ((c * 7 + r * 3) % 5 === 0)) { places.push({ asset: 'stone-ground', at: [X(c), 0, Z(r)] }); continue; }
      places.push({ asset: c <= 6 && r >= 8 ? 'stone-ground' : 'dirt-ground', at: [X(c), 0, Z(r)] });
    } else for (let k = 1; k <= L; k++) places.push({ asset: 'stone-ground', at: [X(c), k * 0.3, Z(r)] });
  }

// --- derrick on the north wall top
const DY = lv(-1.9, -7.9) * 0.3;
put('ladder', -3.0, -7.9, { y: DY });
put('ladder', -0.8, -7.9, { y: DY });
put('beam', -1.9, -7.9, { y: DY + 1.95 });
put('beam', -1.9, -7.9, { y: DY + 1.2, yaw: 90, scale: 0.4 });
put('rope-coil', -1.9, -7.9, { y: DY + 2.15 });
put('crate', -1.9, -7.9, { y: DY + 1.55, scale: 0.7 });
put('crate', 0.9, -7.6, { y: DY, yaw: 20 });

// --- cut blocks stacked on the pit floor (east-centre)
const stack = (x, z, n) => {
  for (let i = 0; i < n; i++) put('crate', x + i * 0.78, z, { y: 0, scale: 1.4 });
  for (let i = 0; i < n - 1; i++) put('crate', x + 0.39 + i * 0.78, z, { y: 0.58, scale: 1.4 });
};
stack(4.2, -1.0, 4);
stack(4.0, 0.6, 3);
stack(7.0, -2.2, 3);
put('rubble', 6.8, 0.4, { yaw: 30 });
put('rubble', 2.6, -2.6, { yaw: 200 });
put('rubble', 8.6, -0.8, { yaw: 120 });

// --- tool shed zone on the first west terrace (level 1)
put('shed', 8.8, 6.9, { yaw: 0 });
put('barrel', -4.2, 2.6);
put('barrel', -3.6, 2.5);
put('crate', -4.3, 6.3, { yaw: 30 });
put('shovel', -3.2, 5.6, { yaw: 100 });
put('pickaxe', -3.2, 3.2, { yaw: 70 });
put('mining-pick', -3.3, 6.4, { yaw: 160 });
put('sack', -3.0, 2.7, { yaw: 40 });

// --- cart and wheelbarrows at the ramp foot
put('handcart', 0.6, -2.6, { yaw: 70 });
put('wheelbarrow', 2.8, -0.3, { yaw: 120 });
put('wheelbarrow', 1.0, 1.4, { yaw: 40 });
put('sack', 2.4, -3.3, { yaw: 10 });
put('rubble', 0.2, -3.6, { yaw: 300 });

// --- workers
put('villager', 3.0, -3.4, { yaw: 160 });
put('farmer', 5.4, 2.2, { yaw: 230 });
put('blacksmith', 1.9, 2.3, { yaw: 120 });

// --- road end

put('barrel', 6.0, 7.6);
put('handcart', 6.6, 4.1, { yaw: 90 });
put('wheelbarrow', 9.0, 3.9, { yaw: 270 });
put('crate', 4.6, 7.4, { yaw: 50 });

for (let c = 1; c <= 11; c++) for (let r = 1; r <= 9; r++) if (level(c, r) > 0 && (c * 5 + r * 11) % 4 === 0) put((c + r) % 3 ? 'rubble' : 'boulder', X(c) + ((c * 3) % 5 - 2) * 0.3, Z(r) + ((r * 7) % 5 - 2) * 0.3, { yaw: c * 47 + r * 31, scale: 1.3 });
// --- ore nodes and rocks on the terraces, boulders on the rim
put('iron-ore', -7.6, -5.2, { yaw: 30 });
put('copper-ore', -8.6, -2.4, { yaw: 120 });
put('gold-ore', -9.0, -7.2, { yaw: 200 });
put('iron-ore', -6.2, -7.6, { yaw: 300 });
const rim = [
  ['rubble', -9.2, -4.8, 20, 1.2], ['rubble', -7.2, -6.8, 80, 1.4], ['rubble', 4.6, -8.2, 150, 1.3],
  ['rubble', 7.5, -7.9, 40, 1.5], ['rubble', 9.2, -6.2, 230, 1.2], ['rubble', -9.0, 0.8, 300, 1.1],
  ['rubble', -9.2, 6.6, 190, 1.0], ['rubble', 9.4, -3.2, 110, 1.0], ['rubble', 9.4, 3.2, 10, 0.9],
  ['rubble', -5.4, -8.2, 60, 1.6], ['rubble', 2.4, -8.3, 200, 1.6], ['rubble', -8.2, 3.0, 250, 1.5],
  ['rubble', 9.2, 0.4, 90, 1.5], ['rubble', -1.0, 8.4, 20, 1.5], ['rubble', 2.6, 8.4, 140, 1.5],
  ['rubble', -7.0, 8.2, 330, 1.5], ['rubble', 0.4, -5.6, 260, 1.2], ['rubble', 6.6, 8.3, 30, 1.4],
  ['rubble', 9.3, 8.2, 80, 1.4], ['boulder', 9.4, -8.4, 60, 1.2], ['boulder', -9.4, -8.4, 140, 1.1],
  ['dead-tree', -8.6, 3.6, 30, 0.8], ['dead-tree', 8.4, -7.4, 200, 0.8], ['stump', 3.8, 3.8, 0, 1],
];
for (const [a, x, z, yaw, s] of rim) put(a, x, z, { yaw, scale: s });
stack(6.2, 2.4, 4);
stack(7.2, 4.0, 3);
stack(-1.0, 4.6, 3);
put('villager', 6.6, 0.8, { yaw: 270 });
put('villager', 8.2, 2.4, { yaw: 90 });
put('wheelbarrow', 5.4, -3.8, { yaw: 300 });
put('handcart', -0.6, 0.8, { yaw: 330 });
put('barrel', 4.2, 4.6);
put('barrel', 4.8, 5.0);
put('sack', 1.2, 5.6);
put('sack', 1.6, 6.0, { yaw: 50 });
put('shovel', 5.6, 5.8, { yaw: 40 });
put('pickaxe', 2.0, 3.8, { yaw: 200 });
put('lantern', -2.0, 2.6, { y: 0.3 });

// --- map file, ASCII, doc
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/quarry.ts', `// GENERATED by scripts/design-quarry.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const ascii = Array.from({ length: 9 }, (_, i) => Array.from({ length: 11 }, (_, j) => (ROAD.has(`${j + 1},${i + 1}`) ? '=' : String(level(j + 1, i + 1)))).join(' ')).join('\n');
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/quarry.md', `# Quarry map plan (generated by scripts/design-quarry.mjs)

11 x 9 tiles of 2 m (22 m x 18 m). Cell (c,r) centre: x=(c-6)*2, z=(r-5)*2. Digits = terrace level (0.3 m each), = road.

\`\`\`
${ascii}
\`\`\`

Zones: stepped terraces (north and west) with a stair ramp in column 7 up to a crane frame; stacked cut blocks
and a cart yard on the pit floor; tool shed on the west terrace; the dirt road leaves east at row 8.
No mockup jpg existed; the layout follows the brief.

## Tally (${places.length} pieces)
${Object.entries(tally).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
console.log(ascii, '\n', places.length, 'pieces');
