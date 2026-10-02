#!/usr/bin/env node
// Harbor map designer: 13 x 10 tiles of 2 m (26 m x 20 m). Land on the west, a quay along the
// south, a warehouse shore in the north; the bay (river-straight tiles) holds ships and piers.
// Cell (c,r): x = (c-6)*2, z = (r-4.5)*2. +X east, -Z north. Writes scenes/maps/harbor.ts and docs/map-mockups/harbor.md.
import { writeFileSync } from 'node:fs';

const X = (c) => (c - 6) * 2;
const Z = (r) => (r - 4.5) * 2;
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const isLand = (c, r) => c <= 2 || (r <= 1 && c <= 5) || (r >= 8 && c <= 8);
const glyph = Array.from({ length: 10 }, () => Array(13).fill('~'));
for (let c = 0; c <= 12; c++)
  for (let r = 0; r <= 9; r++) {
    if (!isLand(c, r)) { put('sea-water', X(c), Z(r)); continue; }
    glyph[r][c] = '.';
    const quay = (r === 9 && c >= 3) || (c === 2 && r >= 3 && r <= 7) || (r === 8 && c >= 3 && c <= 8) || (r === 1 && c >= 3 && c <= 5);
    put(quay ? 'cobble-floor' : 'desert-ground', X(c), Z(r));
    if (quay) glyph[r][c] = '#';
  }

// --- landmarks
put('farmhouse', -9.2, -6.4, { yaw: 0 }); // big warehouse, north-west
put('townhouse', -10.2, 0.6, { yaw: 90 }); // second warehouse, west shore
put('shop-stall', -4.6, -6.6, { yaw: 0 });
put('merchant-ship', 8.6, -2.2, { yaw: 90 }); // focal: tall ship, NE bay
put('fishing-boat', 4.2, -1.2, { yaw: 80 });
put('longship', 9.8, 2.2, { yaw: 100 }); // east berth
put('rowboat', 0.2, -1.6, { yaw: 25 });
put('rowboat', -2.4, 1.2, { yaw: 100 });

// --- piers and docks in the south-east bay (from the south quay northward)
put('pier', 0.0, 4.0, { yaw: 0 });
put('pier', 4.0, 4.0, { yaw: 0 });
put('dock', 2.0, 1.4, { yaw: 0 });
put('dock', 5.8, 1.2, { yaw: 90 });
put('pier', 7.2, 5.4, { yaw: 90 });
put('dock', -4.4, -1.2, { yaw: 90 });
put('dock', -1.6, -1.0, { yaw: 0 });

// --- dock props (stand on dock/pier decks or quay)
const deck = 0.55; // approximate dock deck height
put('crate', 2.2, 1.0, { y: deck, yaw: 20 });
put('barrel', 1.6, 1.8, { y: deck });
put('rope-coil', 5.8, 1.2, { y: deck });
put('sack', 8.0, 5.0, { y: deck, yaw: 40 });
put('crate', 6.4, 5.8, { y: deck, yaw: 80 });
put('barrel', -1.6, -1.4, { y: deck });
put('crate', -4.4, -1.0, { y: deck, yaw: 10 });

// --- quay crates, barrels, nets, carts
const QUAY = [
  ['crate', -6.8, 3.6, 10], ['crate', -6.8, 4.2, 35], ['crate', -6.3, 3.9, 0, 0.9], ['barrel', -7.2, 5.4, 0], ['barrel', -6.5, 5.5, 0],
  ['barrel', -5.8, 5.6, 0], ['sack', -4.8, 6.8, 20], ['sack', -4.3, 7.2, 60], ['crate', -3.4, 7.3, 15], ['crate', -3.4, 7.9, 40],
  ['barrel', -2.4, 6.6, 0], ['barrel', -1.8, 6.9, 0], ['fishing-net', -0.2, 6.4, 5], ['rope-coil', 1.0, 6.5, 0], ['rope-coil', 3.2, 6.6, 70],
  ['crate', 5.0, 7.2, 0], ['crate', 5.5, 7.6, 30], ['barrel', 6.6, 6.5, 0], ['sack', 6.6, 7.5, 80], ['fishing-net', 2.2, 8.9, 0],
  ['barrel', 7.6, 8.8, 0], ['crate', 4.4, 8.9, 20], ['sack', 0.4, 8.7, 10], ['barrel', -1.0, 8.9, 0], ['crate', -5.8, 8.8, 25],
  ['sack', -7.0, 8.5, 70], ['rope-coil', -2.8, 8.6, 0],
  ['crate', -4.4, -3.6, 40], ['barrel', -3.8, -3.8, 0], ['sack', -3.2, -4.0, 20], ['fishing-net', -6.6, -3.0, 90], ['crate', -5.6, -1.8, 10],
  ['barrel', -6.8, -1.2, 0], ['rope-coil', -5.0, -3.0, 0], ['sack', -4.0, -1.8, 60], ['crate', -2.6, -5.6, 20], ['barrel', -1.8, -5.2, 0], ['crate', -1.2, -5.8, 50],
  ['sack', -6.6, 1.6, 30], ['crate', -6.2, 2.4, 70], ['barrel', -7.4, 2.4, 0], ['fishing-net', -7.4, -4.0, 90], ['rope-coil', -8.4, 4.0, 0],
  ['barrel', -10.6, 4.4, 0], ['crate', -10.6, 5.2, 20], ['sack', -9.4, 5.4, 40], ['barrel', -11.0, -3.0, 0], ['crate', -11.0, -2.2, 15],
];
for (const [a, x, z, yaw, s] of QUAY) put(a, x, z, { yaw, scale: s });
put('handcart', -8.0, 2.6, { yaw: 120 });
put('market-cart', -9.6, 7.4, { yaw: 20 });
put('handcart', -2.2, -4.2, { yaw: 70 });

// --- lanterns along the quay edge
for (const [x, z] of [[-7.6, 6.2], [-4.0, 5.4], [-0.4, 5.6], [3.2, 7.4], [8.0, 7.4], [-5.8, -2.4], [-8.2, -2.2], [-3.4, -7.2], [-11.4, 8.4], [-11.4, 0], [-11.4, -9]])
  put('lantern', x, z);

// --- workers
put('sailor', -5.6, 6.6, { yaw: 160 });
put('sailor', -7.6, 3.0, { yaw: 40 });
put('sailor', 2.0, 0.4, { yaw: 200, y: deck });
put('sailor', 8.4, 5.8, { yaw: 90, y: deck });
put('sailor', -3.4, -2.6, { yaw: 300 });
put('sailor', 0.4, 7.4, { yaw: 100 });

// --- edge dressing
const EDGE = [['sack', -11.4, -6.2], ['crate', -11.2, 7.2], ['barrel', 10.0, 7.8], ['barrel', 10.8, 8.6], ['crate', 9.8, 8.8]];
for (const [a, x, z] of EDGE) if (Math.abs(x) < 13) { /* skip off-land edge pieces */ }
put('hay-bale', -11.4, 6.0);
put('hay-bale', -11.4, 8.0);
put('water-trough', -9.2, -2.4, { yaw: 90 });
put('bench', -8.4, 6.2, { yaw: 180 });
put('bench', -6.6, -6.0, { yaw: 0 });
put('signpost', -3.2, 6.0, { yaw: 160 });
put('plank', -1.2, 7.8, { yaw: 30 });
put('plank', 4.6, 6.4, { yaw: 90 });
put('plank', -9.4, 4.6, { yaw: 10 });

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/harbor.ts', `// GENERATED by scripts/design-harbor.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/harbor.md', `# Harbor map (generated)

GENERATED by scripts/design-harbor.mjs. 13 x 10 tiles of 2 m (26 m x 20 m). Cell (c,r): x=(c-6)*2, z=(r-4.5)*2.

\`\`\`
${glyph.map((r) => '  ' + r.join(' ')).join('\n')}
\`\`\`
~ water  . sand  # cobble quay

## Layout
West shore: farmhouse and townhouse warehouses, carts, crates. A cobble quay runs along the south and the west
edge of the bay with lanterns and sailors. Two piers and docks reach into the bay from the south. The focal
object is the merchant ship in the north-east bay, with a longship, a fishing boat, and rowboats.

## Tally
| piece | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total: ${places.length}
`);
console.log('places', places.length, JSON.stringify(tally));
