#!/usr/bin/env node
// Palace map designer: 28 m x 22 m grounds. Domed palace block at the north with two wings,
// fountain courtyard at the centre, hedge gardens at both sides, gate with guards at the south.
// Tile (c,r): x = -13 + 2c (c 0..13), z = -10 + 2r (r 0..10). North = -Z. Walls on grid lines.
// Writes scenes/maps/palace.ts and docs/map-mockups/palace.md.
import { writeFileSync, existsSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
// Wall run along X (z fixed) or Z (x fixed), pieces 2 m wide, skipping gap centres.
const runX = (asset, x0, x1, z, gaps = []) => { for (let x = x0 + 1; x < x1; x += 2) if (!gaps.includes(x)) put(asset, x, z); };
const runZ = (asset, z0, z1, x, gaps = []) => { for (let z = z0 + 1; z < z1; z += 2) if (!gaps.includes(z)) put(asset, x, z, { yaw: 90 }); };
const rect = (asset, x0, z0, x1, z1, gapsN = [], gapsS = [], gapsW = [], gapsE = []) => {
  runX(asset, x0, x1, z0, gapsN); runX(asset, x0, x1, z1, gapsS);
  runZ(asset, z0, z1, x0, gapsW); runZ(asset, z0, z1, x1, gapsE);
};

// ---- Floors -------------------------------------------------------------
const beds = [ // grass garden beds: [x0,z0,x1,z1]
  [-12, 1, -6, 5], [6, 1, 12, 5], [-12, 7, -6, 9], [6, 7, 12, 9],
];
const inBed = (x, z) => beds.some(([a, b, c, d]) => x > a && x < c && z > b && z < d);
const inWing = (x, z) => z < -3 && (x < -3 || x > 3);
for (let c = 0; c < 14; c++)
  for (let r = 0; r < 11; r++) {
    const x = -13 + 2 * c, z = -10 + 2 * r;
    let a = 'marble-floor';
    if (inBed(x, z)) a = 'grass-ground';
    else if (Math.abs(x) <= 3 && z >= -3 && z <= 3) a = 'cobble-floor'; // fountain court
    else if (Math.abs(x) <= 1 && z > 3) a = 'cobble-floor'; // approach road
    else if (inWing(x, z)) a = 'marble-floor';
    put(a, x, z);
  }

// ---- Palace: two wings, central domed block -----------------------------
// two-course continuous wing walls (second course at y=1.5), houses inside, pavilions
const course = (asset, x0, z0, x1, z1) => {
  for (const y of [0, 1.5]) {
    for (let x = x0 + 1; x < x1; x += 2) { put(asset, x, z0, { y }); put(asset, x, z1, { y }); }
    for (let z = z0 + 1; z < z1; z += 2) { put(asset, x0, z, { y, yaw: 90 }); put(asset, x1, z, { y, yaw: 90 }); }
  }
};
course('sandstone-wall', -13, -11, -3, -3);
course('sandstone-wall', 3, -11, 13, -3);
put('sandstone-house', -7, -8.6); put('sandstone-house', 7, -8.6);
put('dome-pavilion', 0, -7.6, { scale: 1.4 });
put('dome-pavilion', -11, -5, { scale: 1.0 }); put('dome-pavilion', 11, -5, { scale: 1.0 });
runX('sandstone-wall', -3, 3, -11, []);
runX('sandstone-wall', -3, 3, -3, [0]);
put('wall-gate', 0, -3.0, { scale: 0.6 });
for (const [x, z] of [[-13, -11], [-3, -11], [3, -11], [13, -11], [-13, -3], [-3, -3], [3, -3], [13, -3]]) put('column', x, z);
put('statue', -5, -4.8); put('statue', 5, -4.8);
for (const x of [-9, -5, 5, 9]) put('banner', x, -2.7);
put('lantern', -6, -2.5); put('lantern', 6, -2.5);

// ---- Fountain court -----------------------------------------------------
put('fountain', 0, 0, { scale: 1.6 });
for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; put('fountain', Math.cos(a) * 2.6, Math.sin(a) * 2.6, { scale: 0.3 }); }
for (const [x, z] of [[-3.6, -2.6], [3.6, -2.6], [-3.6, 2.6], [3.6, 2.6]]) put('lantern', x, z);
for (const [x, z] of [[-2.8, 0], [2.8, 0]]) put('statue', x, z, { yaw: x < 0 ? 90 : 270 });
for (const [x, z] of [[-4.5, -1.5], [4.5, -1.5], [-4.5, 1.5], [4.5, 1.5]]) put('bush', x, z, { scale: 0.8 });

// ---- Hedge gardens ------------------------------------------------------
for (const [x0, z0, x1, z1] of beds) {
  rect('hedge', x0, z0, x1, z1, [], [], [], []);
}
put('statue', -9, 5.9, { yaw: 180 }); put('statue', 9, 5.9, { yaw: 180 });


// ---- Approach road and gate ---------------------------------------------
for (const z of [5, 9]) { put('lantern', -1.6, z); put('lantern', 1.6, z); }

put('wall-gate', 0, 10.6, { yaw: 180, scale: 0.9 });
put('tower', -4, 10.3, { scale: 0.8 }); put('tower', 4, 10.3, { scale: 0.8 });
put('guard', -1.2, 9.2, { yaw: 180 }); put('guard', 1.2, 9.2, { yaw: 180 });
put('guard', -1.2, 5, { yaw: 180 }); put('guard', 1.2, 5, { yaw: 180 });
put('guard', -1, -2.1); put('guard', 1, -2.1);

// ---- Perimeter hedges W/E and corners -------------------------------------
for (const [x, z] of [[-13.5, -11], [13.5, -11]]) put('column', x, z);

// ---- Output --------------------------------------------------------------
const count = {};
for (const p of places) count[p.asset] = (count[p.asset] ?? 0) + 1;
const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
const fmt = (p) => `  { asset: '${p.asset}', at: [${p.at.map(num).join(', ')}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
writeFileSync('scenes/maps/palace.ts', `// GENERATED by scripts/design-palace.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
writeFileSync('docs/map-mockups/palace.md', `# Palace map (generated)

GENERATED by scripts/design-palace.mjs. 28 m x 22 m grounds, 14 x 11 tiles of 2 m.
Focal object: the fountain in the cobbled front court, framed by the domed block and two wings.
Zones: north palace (dome, towers, two walled wings), centre fountain court, side hedge gardens, south gate with guards.
Path: gate, lantern-lined cobble road, fountain court, palace door. Pieces: ${places.length}.

| asset | count |
|---|---|
${Object.entries(count).sort().map(([a, n]) => `| ${a} | ${n} |`).join('\n')}
`);
console.log(places.length, 'pieces');
console.log('missing:', [...new Set(places.map((p) => p.asset))].filter((a) => !existsSync(`out/${a}/${a}.glb`)).join(', ') || 'none');
