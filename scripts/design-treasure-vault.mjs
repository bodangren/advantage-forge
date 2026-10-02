#!/usr/bin/env node
// Treasure vault map designer. 12 m x 10 m low-walled stone vault.
// Zones: four corner hoards, the central relic pedestal inside a coin ring with
// a pressure-plate trap ring, the south trap corridor to the entry, and the
// heavy iron door in the north wall. Writes scenes/maps/treasure-vault.ts and
// docs/map-mockups/treasure-vault.md.
import { writeFileSync } from 'node:fs';

const out = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = Math.round(((o.yaw % 360) + 360) % 360);
  if (o.scale) p.scale = o.scale;
  out.push(p);
};
let seed = 20261002;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const faceYaw = (fx, fz, tx, tz) => (Math.atan2(tx - fx, tz - fz) * 180) / Math.PI; // yaw 0 faces +Z

// --- floor: one family, 6 x 5 tiles --------------------------------------
for (let x = -5; x <= 5; x += 2) for (let z = -4; z <= 4; z += 2) put('stone-floor', x, z);

// --- walls ----------------------------------------------------------------
const NORTH_DOOR = -1, SOUTH_DOOR = 1; // slot centers
for (const x of [-5, -3, -1, 1, 3, 5]) {
  if (x !== NORTH_DOOR) put('wall', x, -5, { yaw: 0 });
  if (x !== SOUTH_DOOR) put('wall', x, 5, { yaw: 180 });
}
for (const z of [-4, -2, 0, 2, 4]) {
  put('wall', -6, z, { yaw: 90 });
  put('wall', 6, z, { yaw: 270 });
}
put('iron-door', NORTH_DOOR, -5, { yaw: 0, scale: 1.6 }); // the heavy door
put('iron-door', SOUTH_DOOR, 5, { yaw: 180, scale: 1.6 }); // entry
// pillars at corners and door jambs
for (const [x, z] of [[-6, -5], [6, -5], [-6, 5], [6, 5]]) put('pillar', x, z, { scale: 1.0 });
for (const [x, z] of [[-6, 0], [6, 0], [-3, -5], [3, -5], [-3, 5], [4, 5]]) put('pillar', x, z, { scale: 0.85 });

// --- torches and braziers -------------------------------------------------
for (const x of [-4.4, -2.2, 1.6, 4.4]) put('torch-sconce', x, -4.72, { yaw: 0 });
for (const x of [-4.4, -2.0, 4.4]) put('torch-sconce', x, 4.72, { yaw: 180 });
for (const z of [-2, 2]) {
  put('torch-sconce', -5.72, z, { yaw: 90 });
  put('torch-sconce', 5.72, z, { yaw: 270 });
}
put('brazier', -2.6, -4.2, { scale: 1.3 });
put('brazier', 0.6, -4.2, { scale: 1.3 });

// --- central pedestal in a coin ring --------------------------------------
put('pillar', 0, 0, { scale: 1.4 });
put('relic-orb', 0, 0, { y: 2.0, scale: 4 });
const RING = 2.5;
const southDir = Math.atan2(SOUTH_DOOR, 5); // direction toward entry (from +z axis)
let ringCount = 0;
for (let a = 0; a < 360; a += 15) {
  const t = (a * Math.PI) / 180;
  const x = Math.sin(t) * RING, z = Math.cos(t) * RING;
  const dAng = Math.abs(Math.atan2(Math.sin(t - southDir), Math.cos(t - southDir)));
  if (dAng < 0.5) continue; // corridor mouth stays open
  put(ringCount % 3 === 2 ? 'gold-pile' : 'coin-pile', x, z, { yaw: a, scale: 1.4 });
  ringCount++;
}
// trap ring: three pressure plates close to the pedestal
for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5]]) put('pressure-plate', x, z, { scale: 0.8 });

// --- trap corridor south --------------------------------------------------
const cx = SOUTH_DOOR;
['spike-trap', 'pressure-plate', 'spike-trap', 'pressure-plate'].forEach((a, i) => put(a, cx, 3.9 - i * 1.05, { scale: 0.95 }));
put('statue', cx - 1.5, 4.1, { yaw: faceYaw(cx - 1.5, 4.1, cx, 2) , scale: 0.75 });
put('statue', cx + 1.5, 4.1, { yaw: faceYaw(cx + 1.5, 4.1, cx, 2), scale: 0.75 });

// --- hoards ---------------------------------------------------------------
const gems = ['gem-ruby', 'gem-emerald', 'gem-sapphire'];
function hoard(cxh, czh, rx, rz, chests, nPiles) {
  // big heap in the corner, smaller coin piles fanning out
  const sx = Math.sign(cxh), sz = Math.sign(czh);
  put('treasure-pile', cxh + sx * 0.25, czh + sz * 0.25, { yaw: rnd() * 360, scale: 2.2 });
  put('treasure-pile', cxh - sx * 0.4, czh + sz * 0.4, { yaw: rnd() * 360, scale: 1.7 });
  put('treasure-pile', cxh + sx * 0.35, czh - sz * 0.5, { yaw: rnd() * 360, scale: 1.6 });
  const placed = [];
  let tries = 0;
  while (placed.length < nPiles && tries++ < 400) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
    const x = cxh + Math.cos(a) * rx * r, z = czh + Math.sin(a) * rz * r;
    if (placed.some(([px, pz]) => Math.hypot(px - x, pz - z) < 0.5)) continue;
    if (Math.hypot(x - cxh, z - czh) < 0.7) continue;
    placed.push([x, z]);
    put(rnd() < 0.35 ? 'gold-pile' : 'coin-pile', x, z, { yaw: rnd() * 360, scale: 1.1 + rnd() * 0.5 });
  }
  chests.forEach(([asset, dx, dz]) => {
    const x = cxh + dx, z = czh + dz;
    put(asset, x, z, { yaw: faceYaw(x, z, 0, 0) + (rnd() - 0.5) * 30, scale: 1.3 });
  });
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2, r = 0.8 + rnd() * 0.5;
    put(gems[(i + Math.floor(rnd() * 3)) % 3], cxh + Math.cos(a) * r * 1.1, czh + Math.sin(a) * r * 0.9, { yaw: rnd() * 360, scale: 1.8 });
  }
}
hoard(-4.3, -3.0, 1.2, 1.2, [['locked-chest', 0.9, 1.0], ['treasure-chest', 1.3, -0.1]], 12);
hoard(4.3, -3.0, 1.2, 1.2, [['treasure-chest', -0.9, 1.0], ['chest', -1.2, -0.2]], 12);
hoard(-4.3, 2.9, 1.2, 1.3, [['locked-chest', 0.9, -1.0], ['chest', 1.2, 0.3]], 12);
hoard(4.3, 2.8, 1.2, 1.3, [['treasure-chest', -0.9, -1.0]], 10);

// --- output ---------------------------------------------------------------
const bounds = out.filter((p) => Math.abs(p.at[0]) > 6.2 || Math.abs(p.at[2]) > 5.2);
if (bounds.length) console.warn('out of bounds:', bounds.map((p) => p.asset + p.at));
const tally = {};
for (const p of out) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const lines = out.map((p) => `  { asset: '${p.asset}', at: [${p.at.map(num).join(', ')}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${num(p.scale)}` : ''} },`);
writeFileSync('scenes/maps/treasure-vault.ts', `// GENERATED by scripts/design-treasure-vault.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';

export function places(): Place[] {
  return [
${lines.join('\n')}
  ];
}
`);
writeFileSync('docs/map-mockups/treasure-vault.md', `# Treasure vault map

12 m x 10 m vault (x -6..6, z -5..5), 6 x 5 stone-floor tiles, 1.2 m wall ring, pillars at corners and door jambs.

Layout (north up):
- North wall: heavy iron door (slot x=-1) between braziers, torch sconces along the wall.
- Centre: pillar pedestal with relic-orb, ringed by ${ringCount} coin and gold piles, three pressure plates inside the ring.
- South: entry iron door (slot x=1), trap corridor of spike traps and pressure plates, two statues as guards.
- Corners: four hoards, each with big treasure heaps, coin and gold piles, chests and gems.

Total pieces: ${out.length}

| asset | count |
|---|---|
${Object.entries(tally).sort().map(([a, n]) => `| ${a} | ${n} |`).join('\n')}

Notes: walls overlap at corners and are covered by pillars. Self-score recorded in the report.
`);
console.log('pieces', out.length, tally);
