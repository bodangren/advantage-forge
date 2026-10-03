#!/usr/bin/env node
// Underground city map designer. Grid 14 x 12 tiles of 2 m (28 m x 24 m).
// Cell (c,r) center: x = 2c-13, z = 2r-11. +X east, -Z north.
// Writes scenes/maps/underground-city.ts and docs/map-mockups/underground-city.md.
import { writeFileSync } from 'node:fs';

const places = [];
const tally = {};
const put = (asset, x, y, z, yaw = 0, scale) => {
  const p = { asset, at: [+x.toFixed(3), +y.toFixed(3), +z.toFixed(3)] };
  if (yaw) p.yaw = yaw;
  if (scale !== undefined) p.scale = scale;
  places.push(p);
  tally[asset] = (tally[asset] ?? 0) + 1;
};
const cx = (c) => 2 * c - 13;
const cz = (r) => 2 * r - 11;
const TER = 1.0; // terrace height: one stair flight (1 m rise)

// zone per cell: T terrace, M mid plaza level, F farm, W chasm water, N north-east water, L ledge
const zone = (c, r) => {
  if (r <= 3 && c >= 2 && c <= 11) return 'T';
  if (c <= 1 && r <= 8) return 'T';
  if (r <= 3 && c >= 12) return 'N';
  if (r >= 4 && r <= 8) return c >= 10 ? 'F' : 'M';
  if (r >= 9 && r <= 10 && c >= 2 && c <= 11) return 'W';
  return 'L';
}
const rows = [];
for (let r = 0; r < 12; r++) {
  let line = '';
  for (let c = 0; c < 14; c++) {
    const z = zone(c, r);
    line += z;
    const x = cx(c), zz = cz(r);
    if (z === 'T') put((c + r) % 3 === 0 ? 'cobble-floor' : 'stone-floor', x, TER, zz);
    else if (z === 'M') {
      const plaza = c >= 4 && c <= 9;
      put(plaza ? ((c + r) % 2 ? 'cobble-floor' : 'stone-floor') : 'stone-ground', x, 0, zz);
    } else if (z === 'F') put('dirt-floor', x, 0, zz);
    else if (z === 'W') put('sea-water', x, -0.15, zz);
    else if (z === 'N') put('sea-water', x, -0.15, zz);
    else put('stone-ground', x, 0, zz);
  }
  rows.push(line);
}

// Cavern walls: back (north), west, east. South stays open (cutaway view).
for (let i = 0; i < 14; i++) {
  const x = -13 + 2 * i;
  put('rock-wall', x, 0, -12.5);
  put('rock-wall', x + 1, 2.6, -12.5);
}
for (let i = 0; i < 12; i++) {
  const z = -11 + 2 * i;
  put('rock-wall', -14.5, 0, z, 90);

  put('rock-wall', 14.5, 0, z, -90);
}
// front rocks
for (const [x, z, s] of [[-12.5, 12.6, 1.6], [-8, 12.8, 1.2], [12.5, 12.6, 1.8], [9, 12.8, 1.2], [-13.4, 8.5, 1.4], [13.4, 8.8, 1.4]]) put('rock-cluster', x, 0, z, (x * 37) % 360, s);
for (const x of [-11, -1, 10.5]) put('stalagmite', x, 0, 11.4, x * 20, 0.8);

// Focal plaza: fountain, lanterns, statue
put('fountain', 0, 0, 2, 0, 1.25);
for (const [x, z] of [[-5.5, -1.5], [5.5, -1.5], [-5.5, 5.5], [5.5, 5.5], [-2.2, 5.6], [2.2, 5.6]]) put('lantern', x, 0, z, 0, 0.85);
put('statue', 4.6, 0, 2, -90, 0.8);
put('banner', -4.6, 0, 2.1, 90, 0.9);

// North terrace houses (back row) and tower
for (const x of [-7, -2.5, 2.5, 7]) {
  put('cottage', x, TER, -8, 0, 0.85);
  put('lantern', x + 1.5, TER, -6.3, 0, 0.7);
}
put('tower', 9.0, TER, -10.4, 0, 0.5);
put('tower', -9.2, TER, -10.6, 0, 0.45);
put('barrel', -4.7, TER, -6.6, 0, 0.8);
put('crate', -4.9, TER, -6.0, 20, 0.9);
put('crate', 4.7, TER, -6.2, 10, 0.9);
put('barrel', 4.9, TER, -6.9, 0, 0.8);

// West terrace houses facing the plaza
for (const z of [-9.5, -6, -2.5, 1, 4.5]) {
  put('cottage', -12.2, TER, z, 90, 0.8);
}

// Stair streets (assumed to rise toward the terrace)
// each flight rises toward the terrace edge and its top is flush with the terrace floor
const STAIR_X = [-5, 5], STAIR_Z = [-1, 3];
for (const x of STAIR_X) put('stairs-stone', x, 0, -3.2, 0, 1.0); // north terrace edge z=-4
for (const z of STAIR_Z) put('stairs-stone', -9.2, 0, z, 90, 1.0); // west terrace edge x=-10
// retaining walls under the terrace edges (1.5 m wall, 0.5 m sunk in the ground)
for (let x = -9; x <= 9; x += 2) if (!STAIR_X.includes(x)) put('stone-wall', x, -0.5, -3.95, 0, 1.0);
for (let z = -3; z <= 5; z += 2) if (!STAIR_Z.includes(z)) put('stone-wall', -9.95, -0.5, z, 90, 1.0);
for (const x of [-13, -11]) put('stone-wall', x, -0.5, 6.05, 0, 1.0);
for (let z = -11; z <= -5; z += 2) put('stone-wall', 10.05, -0.5, z, 90, 1.0);

// Bridge over the south chasm
put('bridge', 0, 0, 8, 90, 1.0);
put('lantern', -1.6, 0, 6.3, 0, 0.8);
put('lantern', 1.6, 0, 6.3, 0, 0.8);

// Mid-west market yard (x -10..-6)
for (const [a, x, z, y] of [['barrel', -7.4, -2.6, 0], ['barrel', -6.8, -2.2, 0], ['crate', -7.6, 0.2, 15], ['crate', -7.0, 0.5, 40], ['barrel', -7.3, 4.2, 0], ['crate', -8.2, 5.2, 70], ['banner', -6.6, 2.4, 90]]) put(a, x, 0, z, y, 0.85);
put('lantern', -7.5, 0, 2.2, 0, 0.8);

// Mushroom farm (east)
for (let i = 0; i < 4; i++)
  for (let j = 0; j < 3; j++) {
    const x = 7.3 + i * 1.5 + ((j % 2) * 0.4), z = -2.5 + j * 2.8;
    put('mushroom', x, 0, z, (i * 53 + j * 31) % 360, 3 + ((i + j) % 3) * 0.6);
  }
put('barrel', 13.3, 0, -3.2, 0, 0.8);
put('crate', 13.2, 0, 5.2, 30, 0.9);
put('lantern', 6.7, 0, -3.2, 0, 0.8);
put('lantern', 6.7, 0, 5.4, 0, 0.8);

// Glowing crystals: chasm edge, NE pool, corners
for (const [x, z, s, y] of [[-8, 7.1, 0.35, 0], [-4, 6.2, 0.3, 0], [4, 6.2, 0.3, 0], [8, 7.1, 0.4, 0], [-9.5, 9.5, 0.45, 0], [9.5, 9.6, 0.5, 0], [4.5, 9.7, 0.3, 0], [-5, 10, 0.3, 0],
  [11, -10.5, 0.55, 0], [13, -8, 0.5, 0], [11.5, -5, 0.35, 0], [13, -11, 0.7, 0], [-13, -12, 0.6, TER], [-13, 7, 0.5, 0], [13, 10.5, 0.6, 0], [0, -11, 0.7, TER], [-12.5, 9.5, 0.5, 0]])
  put('giant-crystal', x, y, z, (x * 17) % 360, s);


// Wall torch sconces
for (const x of [-10, -5, 0, 5, 10]) put('torch-sconce', x, 1.4, -12.0, 0);
for (const z of [-7, -1, 5]) put('torch-sconce', -14.0, 1.4, z, 90);

// Moss
for (const [x, z, y] of [[6, -10.7, TER], [-6.5, 7, 0], [6.5, 7.4, 0], [-11.5, 11.5, 0], [11, 11.3, 0], [12.8, 3.5, 0]]) put('moss-tuft', x, y, z, x * 13, 1.6);

// stay under the 320 piece cap: no moss tufts, every second crystal
for (let i = places.length - 1, g = 0, k = 0; i >= 0; i--) {
  if ((places[i].asset === 'crate' && k++ % 2) || places[i].asset === 'moss-tuft' || places[i].asset === 'bush' || (places[i].asset === 'giant-crystal' && g++ % 2)) { tally[places[i].asset]--; places.splice(i, 1); }
}
const text = `// GENERATED by scripts/design-underground-city.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] { return ${JSON.stringify(places)}; }
`;
writeFileSync('scenes/maps/underground-city.ts', text);
const doc = `# Underground city map (28 m x 24 m)

GENERATED by \`scripts/design-underground-city.mjs\`. Grid 14 x 12 tiles of 2 m. Cell (c,r) center: x = 2c-13, z = 2r-11.

\`\`\`
${rows.join('\n')}
\`\`\`

T terrace (0.3 m, houses) - M plaza level - F mushroom farm - W chasm water - N north-east pool - L south ledge.

## Layout
Focal object: the fountain in the central plaza. A north terrace and a west terrace carry cottages and towers,
reached by stair streets. A bridge crosses the south chasm. The east side is a mushroom farm. Rock walls close
the north, west, and east edges; the south edge is open for the cutaway view. Lanterns, wall sconces, and glowing
crystals give the light.

## Tally
${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Total: ${places.length}
`;
writeFileSync('docs/map-mockups/underground-city.md', doc);
console.log(places.length, JSON.stringify(tally));
