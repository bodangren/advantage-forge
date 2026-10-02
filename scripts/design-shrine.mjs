#!/usr/bin/env node
// Forest shrine map: 16 m clearing (8x8 tiles of 2 m) inside a one-tile forest ring (10x10).
// A raised stone platform (1.0 m, to match stairs-stone) holds the altar, crystal, braziers, arch.
// Writes scenes/maps/shrine.ts and docs/map-mockups/shrine.md.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const yawr = () => Math.round(rnd() * 360);

// --- ground: forest-ground only, 10x10 tiles ---
for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) put('forest-ground', -9 + i * 2, -9 + j * 2);
// --- footpath from the south edge to the stairs ---
for (const z of [1, 3, 5, 7, 9]) put('footpath-straight', 0, z);

// --- platform: 2x2 tiles, x -2..2, z -5..-1, top y = 1.0 ---
for (const x of [-1, 1]) for (const z of [-4, -2]) {
  put('stone-floor', x, z, { y: 1.0 });
  for (const y of [0.7, 0.4, 0.1]) put('stone-ground', x, z, { y });
}
put('stairs-stone', 0, -0.2);
// focal: altar, crystal offering, braziers, arch
put('altar', 0, -3.6, { y: 1.0 });
put('magic-crystal', 0, -3.6, { y: 1.9, scale: 0.8 });
put('brazier', -1.4, -2.2, { y: 1.0 });
put('brazier', 1.4, -2.2, { y: 1.0 });
put('statue', -1.4, -4.4, { y: 1.0, yaw: 20 });
put('statue', 1.4, -4.4, { y: 1.0, yaw: -20 });
put('archway', 0, -4.7, { y: 1.0, scale: 1.7 });
// stone lanterns flanking the path
put('lantern', -2.2, 1.8);
put('lantern', 2.2, 1.8);
put('signpost', 2.0, 5.6, { yaw: 200 });
put('bench', -2.4, 4.4, { yaw: 90 });

// --- cherry trees flank the platform, pine ring around the edge ---
put('cherry-tree', -4.6, -3.8, { yaw: 30, scale: 1.3 });
put('cherry-tree', 4.6, -4.2, { yaw: 200, scale: 1.3 });
put('cherry-tree', -6.4, 2.0, { yaw: 100, scale: 1.1 });
put('cherry-tree', 6.4, 1.2, { yaw: 300, scale: 1.1 });
for (let k = 0; k < 28; k++) {
  const a = (k / 28) * Math.PI * 2;
  const r = 9.2 + rnd() * 0.8;
  const x = Math.cos(a) * r * 1.0, z = Math.sin(a) * r * 1.0;
  const cx = Math.max(-9.6, Math.min(9.6, x)), cz = Math.max(-9.6, Math.min(9.6, z));
  if (Math.abs(cx) < 1.6 && cz > 0) continue; // keep the path entry open
  put(k % 5 === 4 ? 'cherry-tree' : 'pine-tree', cx, cz, { yaw: yawr(), scale: 0.85 + rnd() * 0.3 });
}
// --- boulders (mossy) and rocks clustered at the treeline and platform sides ---
const BOULDERS = [[-6.0, -5.6, 1.4], [-7.2, -4.6, 0.9], [5.8, -6.2, 1.2], [6.8, -5.0, 0.8], [-7.0, 5.4, 1.1], [7.2, 5.8, 1.2], [-3.4, -6.8, 0.8], [3.4, -6.6, 0.9], [7.6, -1.0, 0.9], [-7.6, -0.6, 1.0]];
for (const [x, z, s] of BOULDERS) put('boulder', x, z, { yaw: yawr(), scale: s });
const ROCKS = [[-4.0, 0.8], [4.2, 0.4], [-5.4, 6.2], [5.2, 6.8], [-2.6, -6.4], [2.8, 7.4], [-6.8, 3.6], [6.8, 3.2], [-4.4, 3.4], [4.4, 3.8]];
for (const [x, z] of ROCKS) put('rock-cluster', x, z, { yaw: yawr(), scale: 0.6 + rnd() * 0.3 });
// --- ferns, moss, grass clumps along the edges and path sides ---
const FERN = [[-3.6, 3.0], [3.4, 2.6], [-4.8, 1.4], [5.0, -1.6], [-5.2, -1.0], [-3.2, -5.6], [3.8, -6.0], [-6.4, 6.4], [6.6, 6.6], [-1.8, 6.6], [2.2, 6.4], [-6.6, -2.6], [6.6, -2.8], [-2.8, 7.8], [3.0, 8.0], [-8.0, 1.0], [8.0, -0.4], [-7.8, -6.6], [7.8, -7.4], [0, 8.0]];
for (const [x, z] of FERN) put('fern', x, z, { yaw: yawr() });
const MOSS = [[-1.9, 0.2], [1.9, 0.6], [-3.0, -1.2], [3.2, -2.0], [-1.6, 3.4], [1.6, 4.0], [-5.8, 4.0], [5.8, 4.6], [-4.0, 7.0], [4.2, 8.2], [-5.2, -3.0], [5.4, -3.4]];
for (const [x, z] of MOSS) put('moss-tuft', x, z, { yaw: yawr(), scale: 1.2 });
const TALL = [[-2.6, 2.4], [2.8, 3.2], [-6.0, 0.4], [6.2, -0.4], [-4.6, 5.0], [4.8, 5.2], [-3.8, -3.0], [3.8, -2.0], [-1.8, 8.2], [1.8, 8.4]];
for (const [x, z] of TALL) put('tall-grass', x, z, { yaw: yawr() });
for (const [x, z] of [[-3.0, 5.8], [3.2, 4.6], [-5.6, -0.4], [5.6, 2.2], [-4.4, -1.8], [4.6, -5.2]]) put('wildflowers', x, z, { yaw: yawr() });
for (const [x, z] of [[-6.0, -1.6], [6.0, -2.2], [-2.6, 6.0], [-7.6, 2.2], [7.6, 2.0], [-4.8, -5.0], [4.9, 8.0], [-6.8, 8.0]]) put('bush', x, z, { yaw: yawr(), scale: 0.9 });

// --- ASCII + emission ---
const glyph = Array.from({ length: 10 }, () => Array(10).fill('.'));
const mark = (x, z, g) => { const c = Math.round((x + 9) / 2), r = Math.round((z + 9) / 2); if (glyph[r]?.[c] !== undefined) glyph[r][c] = g; };
for (const z of [1, 3, 5, 7, 9]) mark(0, z, '=');
for (const x of [-1, 1]) for (const z of [-4, -2]) mark(x, z, 'P');
mark(-4.6, -3.8, 'C'); mark(4.6, -4.2, 'C'); mark(-2.2, 1.8, 'L'); mark(2.2, 1.8, 'L');
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${num(p.scale)}` : ''} },`;
writeFileSync('scenes/maps/shrine.ts', `// GENERATED by scripts/design-shrine.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/shrine.md', `# Forest shrine map (generated)

GENERATED by \`scripts/design-shrine.mjs\`. 10x10 forest-ground tiles (16 m clearing plus a one-tile ring). +X east, -Z north.

\`\`\`
${glyph.map((r) => '  ' + r.join(' ')).join('\n')}
\`\`\`
P platform (4 m square, top 1.0 m, stacked stone-ground under stone-floor), = footpath, C cherry tree, L lantern.

## Layout
Footpath runs north from the south edge to stairs-stone. The platform holds the altar with a magic-crystal offering,
two braziers, two statues and a timber-style archway. Cherry trees flank it; a pine and cherry ring, boulders,
ferns and moss close the edge.

## Tally (${places.length} pieces)
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
console.log(places.length, 'places', JSON.stringify(tally));
