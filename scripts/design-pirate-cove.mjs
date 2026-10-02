#!/usr/bin/env node
// Pirate cove map designer: 24 x 20 m sandy cove (12 x 10 tiles of 2 m).
// Writes scenes/maps/pirate-cove.ts and docs/map-mockups/pirate-cove.md.
// Anchor: docs/map-mockups/pirate-cove.jpg. North = -Z, east = +X.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};
const tally = {};

// Tiles: sand everywhere, sea-water inside the lagoon ellipse (south-west centre).
const LAG = { x: -3.4, z: 5.4, rx: 6.4, rz: 4.6 };
const rows = [];
for (let r = 0; r < 10; r++) {
  let line = '';
  for (let c = 0; c < 12; c++) {
    const x = (c - 5.5) * 2, z = (r - 4.5) * 2;
    const wob = 0.12 * Math.sin(c * 2.1 + r * 1.7);
    const d = ((x - LAG.x) / LAG.rx) ** 2 + ((z - LAG.z) / LAG.rz) ** 2;
    const water = d < 1 + wob;
    put(water ? 'sea-water' : 'desert-ground', x, z);
    line += water ? '~' : '.';
  }
  rows.push(line);
}

// Landmarks
put('pirate-ship', -7.6, -3.2, { yaw: 78, scale: 0.8 }); // beached ship, NW, bow to the west
put('cave-mouth', 6.8, -6.8, { yaw: 0, scale: 1.5 }); // NE cave
put('tent', -0.8, -3.6, { yaw: 15, scale: 1.1 }); // camp
put('flag', 1.2, -4.8, { yaw: 20 }); // skull flag by the camp
put('rowboat', -2.6, 5.0, { yaw: 70, scale: 1.2 }); // in the lagoon
put('longship', -9.6, 4.6, { yaw: 200, scale: 0.0001 }); // placeholder removed below
places.pop();

// Palms
for (const [x, z, s, yaw] of [[-3.2, -7.0, 1.0, 30], [-1.2, -7.4, 0.95, 200], [7.2, 0.6, 1.0, 90], [10.4, -1.4, 0.85, 10], [-10.6, -8.0, 0.9, 140], [10.6, 7.4, 0.9, 250]])
  put('palm-tree', x, z, { scale: s, yaw });

// Treasure: half-buried chests and a plank landing
put('treasure-chest', 5.2, 1.6, { y: -0.14, yaw: 200, scale: 1.1 });
put('treasure-chest', 8.0, 3.4, { y: -0.12, yaw: 150 });
put('treasure-chest', 3.2, -0.4, { y: -0.18, yaw: 40, scale: 0.9 });
put('plank', 7.0, 2.6, { yaw: 20 });
put('plank', 8.4, 2.8, { yaw: 100 });
put('plank', 7.6, 3.8, { yaw: 160 });
put('plank', 0.2, 0.6, { yaw: 100 });
put('plank', -4.4, -0.4, { yaw: 15 });
put('plank', 2.0, 1.6, { yaw: 75 });

// Rum barrels and crates
for (const [x, z, yaw] of [[1.8, -1.4, 0], [2.6, -2.0, 60], [2.2, -0.9, 120], [4.4, 3.8, 20]]) put('barrel', x, z, { yaw });
put('barrel', 9.2, 0.8, { yaw: 90, scale: 0.9 });
for (const [x, z, yaw] of [[-3.6, -3.4, 30], [-2.9, -2.6, 100], [-3.2, -3.0, 0], [9.4, 4.6, 70], [5.8, 5.6, 140]]) put('crate', x, z, { yaw });
put('crate', -3.2, -3.0, { y: 0.41, yaw: 45, scale: 0.8 }); // stacked on the centre crate

// Rocks
for (const [a, x, z, yaw, s] of [
  ['boulder', -10.4, 0.8, 40, 1.5], ['boulder', -9.2, 2.2, 120, 1.1], ['rock-cluster', -10.6, 2.4, 80, 1.4], ['rock-cluster', -8.8, 0.2, 200, 1.2],
  ['boulder', 0.6, 8.6, 20, 1.0], ['boulder', 1.4, 7.6, 100, 1.4], ['rock-cluster', 2.6, 8.4, 160, 1.2],
  ['boulder', -0.3, -2.6, 200, 0.7], ['boulder', 10.6, 3.4, 300, 1.2], ['rock-cluster', 10.2, 4.8, 20, 1.3],
  ['boulder', 2.4, -7.2, 60, 1.4], ['rock-cluster', 3.0, -5.8, 130, 1.3], ['boulder', -11, -4.6, 250, 1.3],
  ['rock-cluster', -5.8, 8.8, 40, 1.4], ['rock-cluster', -6.6, 1.2, 100, 1.1], ['boulder', 11, -9, 20, 1.5], ['boulder', -11, 9, 220, 1.4],
  ['rock-cluster', 8.4, -3.4, 10, 1.2],
]) put(a, x, z, { yaw, scale: s });

// Camp and figures
put('campfire-out', 1.0, -1.6, { yaw: 30, scale: 1.2 });
put('pirate-captain', 3.6, 0.8, { yaw: 220 });
put('pirate', -1.4, -1.0, { yaw: 160 });
put('pirate', 6.0, -2.6, { yaw: 100 });

// Edge dressing: rocks and palms along edges
for (let i = 0; i < 9; i++) {
  const x = -10 + i * 2.6;
  put(i % 2 ? 'rock-cluster' : 'boulder', x, 9.4, { yaw: i * 47, scale: 0.9 + (i % 3) * 0.2 });
}
for (let i = 0; i < 6; i++) put(i % 2 ? 'boulder' : 'rock-cluster', 11.4, -7 + i * 2.8 + (i % 2), { yaw: i * 61, scale: 1.1 });
for (let i = 0; i < 4; i++) put(i % 2 ? 'rock-cluster' : 'boulder', -11.4, -8.5 + i * 1.5, { yaw: i * 33, scale: 1.2 });

// Extra scatter: barrels, crates, chests, planks, rocks to dress the sand
const rng = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const keep = (x, z) => {
  const d = ((x - LAG.x) / (LAG.rx + 0.8)) ** 2 + ((z - LAG.z) / (LAG.rz + 0.8)) ** 2;
  if (d < 1) return false;
  if (Math.hypot(x + 7.6, z + 3.2) < 4.2) return false; // ship
  if (Math.abs(x - 6.8) < 4.4 && z < -4.6) return false; // cave
  if (Math.hypot(x + 0.8, z + 3.6) < 2) return false; // tent
  return true;
};
let n = 0;
while (n < 110) {
  const x = (rng() - 0.5) * 22, z = (rng() - 0.5) * 18;
  if (!keep(x, z)) continue;
  const k = n % 5;
  const a = ['rock-cluster', 'plank', 'crate', 'rock-cluster', 'plank'][k];
  if (a === 'plank' || a === 'rock-cluster') put(a, x, z, { yaw: rng() * 360, scale: a === 'plank' ? 1 : 0.6 + rng() * 0.6 });
  else put(a, x, z, { yaw: rng() * 360, scale: 0.75 + rng() * 0.3 });
  n++;
}

// Output
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
const body = places.map((p) => `    ${JSON.stringify(p)},`).join('\n');
writeFileSync('scenes/maps/pirate-cove.ts', `// GENERATED by scripts/design-pirate-cove.mjs — edit the generator, not this file.\nimport type { Place } from '../chibi-quest.js';\nexport function places(): Place[] {\n  return [\n${body}\n  ];\n}\n`);
const tl = Object.entries(tally).sort().map(([a, c]) => `- ${a}: ${c}`).join('\n');
writeFileSync('docs/map-mockups/pirate-cove.md', `# Pirate cove map\n\nGenerator: scripts/design-pirate-cove.mjs. 24 x 20 m, 12 x 10 tiles (~ = sea-water, . = sand).\n\n\`\`\`\n${rows.join('\n')}\n\`\`\`\n\nZones: beached ship and camp (north-west), cave and treasure (north-east), lagoon with rowboat (south-west).\nSea uses sea-water tiles (top y=-0.03).\n\n## Tally (${places.length} pieces)\n${tl}\n`);
console.log(rows.join('\n'));
console.log(places.length, 'pieces');
