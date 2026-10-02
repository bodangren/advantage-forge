#!/usr/bin/env node
// Ruined City map designer: 14 x 12 tiles of 2 m (28 m x 24 m). Writes
// scenes/maps/ruined-city.ts and docs/map-mockups/ruined-city.md from one data table.
// Cell (c,r) center: x = (c-7.5)*2, z = (r-6.5)*2. +X east, -Z north.
import { writeFileSync } from 'node:fs';

const X = (c) => (c - 7.5) * 2;
const Z = (r) => (r - 6.5) * 2;
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const taken = []; // [x, z, radius] keep-out discs for scatter
const keep = (x, z, r) => taken.push([x, z, r]);
const free = (x, z, r = 0.5) => taken.every(([a, b, c]) => Math.hypot(x - a, z - b) > c + r);

// --- streets (cell sets) ---
const street = new Set();
for (let c = 2; c <= 13; c++) street.add(`${c},8`); // east-west street
for (let r = 2; r <= 12; r++) { street.add(`7,${r}`); street.add(`8,${r}`); } // avenue to the tower
for (let c = 3; c <= 6; c++) street.add(`${c},4`); // west lane to the cottage
for (let c = 9; c <= 12; c++) street.add(`${c},5`); // east lane
for (let c = 1; c <= 14; c++)
  for (let r = 1; r <= 12; r++) {
    const k = `${c},${r}`;
    const x = X(c), z = Z(r);
    if (street.has(k)) {
      // a few cracked or missing street slabs
      const h = (c * 7 + r * 13) % 11;
      if (h % 3 === 0) put('grass-ground', x, z);
      else if (h === 3 || h === 8) put('cobble-floor', x, z, { yaw: 90 * (h % 4) }), put('rubble', x + 0.4, z - 0.3, { yaw: h * 40 });
      else put('cobble-floor', x, z, { yaw: 90 * ((c + r) % 4) });
    } else put('grass-ground', x, z);
  }

// --- perimeter walls (north, west, east); south open ---
const wallKinds = ['stone-wall', 'wall', 'broken-wall', 'stone-wall', 'wall', 'broken-wall'];
const wallRow = (fn, n, skip = () => false) => {
  for (let i = 0; i < n; i++) {
    if (skip(i)) continue;
    const kind = wallKinds[(i * 5 + 1) % wallKinds.length];
    fn(i, kind);
  }
};
// north wall z = -11.75, x from -13 to 13 (tower at 0)
wallRow((i, kind) => put(kind, -13 + 2 * i, -11.7, { yaw: kind === 'broken-wall' ? 180 : 0 }), 14, (i) => Math.abs(-13 + 2 * i) < 2.2 || i === 0 || i === 13);
// west wall x = -13.7, z from -9 to 5
wallRow((i, kind) => put(kind, -13.7, -9.5 + 2 * i, { yaw: kind === 'broken-wall' ? 270 : 90 }), 8, (i) => i === 5);
// east wall x = 13.7
wallRow((i, kind) => put(kind, 13.7, -9.5 + 2 * i, { yaw: kind === 'broken-wall' ? 90 : 90 }), 8, (i) => i === 4);
put('wall-corner', -12.7, -10.7, { yaw: 0 });
put('wall-corner', 12.7, -10.7, { yaw: 90 });
put('tower', 0, -10.4, { scale: 0.95 });
keep(0, -10.4, 1.6);
for (const [x, z] of [[-13.7, 6], [13.7, 4.5]]) put('column', x, z, { scale: 0.8 }), keep(x, z, 0.5);
put('ruin-column', -13.2, 8.5); put('ruin-column', 13.0, 8.8, { yaw: 180 });

// --- zones ---
// West: ruined cottage with vines and steps

put('stairs-stone', -7.3, -0.3, { yaw: 90 }); keep(-7.3, -0.3, 0.8);
put('vines', -10.7, 0.9, { yaw: 90 }); put('ivy', -10.7, -1.4, { yaw: 90 });
// East: ruined cottage
put('cottage', 9.4, 1.2, { yaw: 270 }); keep(9.4, 1.2, 2);
put('stairs-stone', 7.3, 1.2, { yaw: 270 }); keep(7.3, 1.2, 0.8);
put('ivy', 10.7, 2.4, { yaw: 270 }); put('vines', 10.7, -0.2, { yaw: 270 });
// Plaza: dry fountain south, toppled statue
put('fountain', 0, 7.4, { scale: 1.1 }); keep(0, 7.4, 1.8);
put('statue', -2.6, 3.2, { yaw: 30, scale: 0.9 }); keep(-2.6, 3.2, 0.9);
put('rubble', -2.0, 4.6, { yaw: 60, scale: 1.2 }); put('rubble', -3.3, 2.4, { yaw: 120 });
// Collapsed house by the north wall (west), broken walls
const HOUSES = [[-10.5,-8.5,0,1],[-5,-8.5,0,1.1],[5.5,-8.5,180,0.95],[10.5,-8.5,0,1.1],[-9.5,-0.3,90,1],[-10,5.5,90,1.2],[10,6,270,1],[-6,9.5,0,0.9],[6,9.5,180,1.1]];
for (const [x, z, yaw, sc] of HOUSES) { put('ruined-house', x, z, { yaw, scale: sc }); keep(x, z, 2.6 * sc); }
put('broken-wall', -2.6, -6.8, { yaw: 0 }); put('broken-wall', 2.8, -6.2, { yaw: 180 }); keep(-2.6,-6.8,1); keep(2.8,-6.2,1);
// North-west and north-east rubble yards
put('bone-pile', 4.5, -3.2, { yaw: 40 }); put('barrel', -4.6, -2.4); put('barrel', -4.0, -2.8, { yaw: 40 });
put('barrel', 12, 10); put('barrel', 3.5, 9.5, { yaw: 70 });
for (const [x, z] of [[4.5, -3.2], [-4.6, -2.4], [-4, -2.8], [12, 10], [3.5, 9.5]]) keep(x, z, 0.5);

// --- scatter dressing ---
const scatter = (asset, n, xr, zr, o = {}) => {
  let tries = 0;
  while (n > 0 && tries++ < 4000) {
    const x = xr[0] + rnd() * (xr[1] - xr[0]);
    const z = zr[0] + rnd() * (zr[1] - zr[0]);
    const onStreet = street.has(`${Math.floor(x / 2 + 7.5) + 1},${Math.floor(z / 2 + 6.5) + 1}`);
    if (o.offStreet && onStreet) continue;
    if (!free(x, z, o.r ?? 0.5)) continue;
    put(asset, x, z, { yaw: Math.floor(rnd() * 360), scale: o.scale ? o.scale[0] + rnd() * (o.scale[1] - o.scale[0]) : undefined });
    keep(x, z, (o.r ?? 0.5) * 0.7);
    n--;
  }
};
scatter('rubble', 30, [-12.5, 12.5], [-10.2, 10.8], { scale: [0.8, 1.5], r: 0.6 });
scatter('rock-cluster', 22, [-12.5, 12.5], [-10.2, 10.8], { offStreet: true, scale: [0.6, 1.1], r: 0.6 });
scatter('bush', 5, [-12.5, 12.5], [-10, 10.8], { offStreet: true, r: 0.7, scale: [0.6, 1.0] });
scatter('tall-grass', 0, [-12.5, 12.5], [-10, 10.8], { offStreet: true, r: 0.4 });
scatter('moss-tuft', 0, [-12.5, 12.5], [-10, 10.8], { r: 0.3 });
scatter('bone-pile', 3, [-12, 12], [-9, 10], { offStreet: true, r: 0.5 });
scatter('dead-tree', 3, [-12, 12], [-9, 9], { offStreet: true, r: 1.0, scale: [0.7, 0.9] });
scatter('vines', 12, [-12, 12], [-10, 10], { offStreet: true, r: 0.5, scale: [0.6, 0.8] });

// --- tally ---
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;

const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${num(p.at[0])}, ${num(p.at[1])}, ${num(p.at[2])}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${num(p.scale)}` : ''} },`;
writeFileSync('scenes/maps/ruined-city.ts', `// GENERATED by scripts/design-ruined-city.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
writeFileSync('docs/map-mockups/ruined-city.md', `# Ruined city - map plan (generated)

GENERATED by \`scripts/design-ruined-city.mjs\`. 14 x 12 tiles of 2 m (28 m x 24 m); +X east, -Z north.

## Layout
Walls ring the north, west, and east edges (south open). The surviving tower stands at the north center on a cobble avenue.
An east-west street crosses the map; two lanes lead to ruined cottages (west and east). A dry fountain sits in the south
plaza, a statue stands by the street, and rubble, rocks, bushes, vines, and bones cover the grass.

## Tally
| asset | count |
|---|---|
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Total placements: ${places.length}.
`);
console.log(places.length, JSON.stringify(tally));
