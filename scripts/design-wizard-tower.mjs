#!/usr/bin/env node
// Wizard tower room map designer. Chamber 10 m x 10 m: x -5..5, z -5..5.
// Walls on the north (z=-5), west (x=-5) and part of the east side; south and east are the cutaway.
// Zones: NW study (stairs up, scroll desk, west shelves), NE focal nook (crystal-ball desk),
// east observatory (window + telescope), ritual centre, SE storage, SW reading nook.
// Writes scenes/maps/wizard-tower.ts and docs/map-mockups/wizard-tower.md.
import { writeFileSync } from 'node:fs';

const places = [];
const put = (asset, x, z, o = {}) => {
  const p = { asset, at: [x, o.y ?? 0, z] };
  if (o.yaw) p.yaw = o.yaw;
  if (o.scale) p.scale = o.scale;
  places.push(p);
};

// Floor: 5 x 5 slabs of 2 m.
for (let c = 0; c < 5; c++) for (let r = 0; r < 5; r++) put('stone-floor', -4 + 2 * c, -4 + 2 * r);

// Walls (1.5 m tall, 2 m long). North faces +Z, west faces +X (yaw 90), east faces -X (yaw 270).
for (const x of [-2, 0, 2]) put('stone-wall', x, -5);
for (const z of [-4, -2, 0, 2, 4]) put('stone-wall', -5, z, { yaw: 90 });
for (const z of [-4, -2, 0]) put('stone-wall', 5, z, { yaw: 270 });
for (const x of [-4, 4]) put('stone-wall', x, -5);
// NW corner is the stair well: stairs rise toward -Z.
put('stairs-stone', -4.2, -3.8);
put('torch-sconce', -3.2, -4.7);

// Windows (blue-violet night glow) in front of the wall faces.
put('window', -2, -4.9, { y: 0.45 });
put('window', 4.9, -1, { y: 0.45, yaw: 270 });
put('window', -4.9, 0, { y: 0.45, yaw: 90 });
// Star-chart tapestries.
put('tapestry', 0, -4.9, { y: 0.1 });
put('tapestry', -4.9, -2.2, { y: 0.1, yaw: 90 });
put('tapestry', -4.9, 2.2, { y: 0.1, yaw: 90 });
put('tapestry', 4.9, 1.0, { y: 0.1, yaw: 270 });
put('wall-sconce', -1.0, -4.85, { y: 0.9 });
put('wall-sconce', 1.0, -4.85, { y: 0.9 });
put('wall-sconce', -4.85, -1.0, { y: 0.9, yaw: 90 });
put('wall-sconce', -4.85, 1.0, { y: 0.9, yaw: 90 });
put('wall-sconce', 4.85, -2.3, { y: 0.9, yaw: 270 });

// West shelves (library story).
[-2.7, -1.7, -0.7, 0.7, 1.7, 3.2].forEach((z, i) => {
  put('bookshelf', -4.7, z, { yaw: 90 });
  put(i % 2 ? 'tome' : 'spellbook', -4.7, z, { y: 1.5, yaw: 90 });
  if (i % 3 === 0) put('candle', -4.7, z + 0.25, { y: 1.5 });
});

// Focal nook (north-east): crystal-ball desk on a rug, purple glow.
put('rug', 2.5, -3.3, { scale: 1.7 });
put('desk', 2.5, -4.35, { scale: 1.5 });
put('orb', 2.5, -4.35, { y: 1.12, scale: 2.2 });
put('candelabra', 1.75, -4.35, { y: 1.12 });
put('grimoire', 3.2, -4.4, { y: 1.12, scale: 0.5, yaw: 20 });
put('scroll', 2.1, -4.0, { y: 1.12 });
put('magic-crystal', 3.95, -4.1, { scale: 1.5 });
put('magic-crystal', 1.0, -4.3);
put('crystal-cluster', 4.3, -2.7, { scale: 0.8 });
put('chair', 2.5, -3.3, { yaw: 180, scale: 1.2 });

// Scroll desk (north-west of centre).
put('rug', -1.2, -3.3, { scale: 1.4 });
put('desk', -1.0, -4.3, { scale: 1.5 });
put('scroll', -1.3, -4.25, { y: 1.12 });
put('scroll', -0.8, -4.2, { y: 1.12, yaw: 30 });
put('map', -0.6, -4.45, { y: 1.12 });
put('candle-cluster', -0.5, -4.25, { y: 1.12 });
put('vial', -1.5, -4.4, { y: 1.12 });
put('stool', -1.2, -3.2);

// Observatory (east): telescope, small table, lantern.
put('spyglass', 4.0, 0.2, { scale: 1.8, yaw: 270 });
put('round-table', 4.2, -1.0, { scale: 0.9 });
put('tome', 4.2, -1.0, { y: 0.55 });
put('stool', 3.4, -0.6);
put('rune-stone', 4.1, 2.0, { scale: 0.8 });
put('lantern', 4.5, 1.2);

// Ritual centre: circle, floating candle rings, the wizard and a staff.
put('ritual-circle', 0, 0.8, { scale: 1.6 });
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2;
  put('candle', Math.cos(a) * 2.0, Math.sin(a) * 2.0 + 0.8, { y: 1.1 + 0.25 * (i % 3) });
}
for (let i = 0; i < 5; i++) {
  const a = (i / 5) * Math.PI * 2 + 0.3;
  put('candle', Math.cos(a) * 1.0, Math.sin(a) * 1.0 + 0.8, { y: 1.8 + 0.2 * (i % 2) });
}
put('wizard', 0, 0.8, { yaw: 180 });

// Storage corner (south-east).
put('cauldron', 3.7, 3.4, { scale: 1.2 });
put('barrel', 4.5, 4.2);
put('barrel', 3.8, 4.5, { scale: 0.85 });
put('sack', 4.5, 2.8);
put('sack', 2.8, 4.5, { yaw: 40 });
put('crate', 2.2, 4.4);
put('mana-potion', 2.2, 4.4, { y: 0.45 });
put('health-potion', 2.1, 4.4, { y: 0.45 });
// South-west reading nook and south edge.
put('chest', -3.4, 4.3, { yaw: 180, scale: 1.1 });
put('crate', -4.4, 4.2);
put('jar', -4.4, 4.2, { y: 0.55 });
put('distillation-flask', -3.1, 4.4, { y: 0.45 });
put('urn', -2.0, 4.5);
put('column', -1.0, 4.6, { scale: 0.7 });
put('column', 1.0, 4.6, { scale: 0.7 });
put('bench', -3.4, 2.8, { yaw: 90 });
put('candelabra', -4.2, 3.6);

// Edge dressing: low front wall (0.6 scale) on the open south and east sides, gap at the entrance.
for (let i = 0; i < 8; i++) {
  const x = -4.2 + 1.2 * i;
  if (Math.abs(x) < 1) continue;
  put('stone-wall', x, 5.1, { scale: 0.6 });
}
for (const z of [2.0, 3.2, 4.4]) put('stone-wall', 5.1, z, { yaw: 270, scale: 0.6 });
for (const [x, z] of [[-4.3, 4.9], [-0.5, 4.9], [3.2, 4.9], [4.9, 3.4], [4.9, 2.6]]) put('moss-tuft', x, z);
put('mushroom-cluster', 4.6, 4.7);
put('glowing-mushroom', 4.7, 4.2);

// Extra story: reading table, rune ring, floor candles, scattered books at the desks.
put('round-table', -2.2, 2.7);
put('spellbook', -2.3, 2.7, { y: 0.6 });
put('candle-cluster', -2.0, 2.6, { y: 0.6 });
put('stool', -1.5, 3.3);
put('mage-wand', -2.2, 2.9, { y: 0.6 });
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2 + 0.5;
  put('rune-stone', Math.cos(a) * 2.5, Math.sin(a) * 2.5 + 0.8, { scale: 0.5 });
}
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2 + 0.2;
  put('candle-cluster', Math.cos(a) * 3.1, Math.sin(a) * 3.1 + 0.8);
}
put('tome', 0.6, -2.9);
put('tome', 0.75, -2.85, { y: 0.08, yaw: 30 });
put('spellbook', -2.8, -3.9, { yaw: 70 });
put('scroll', -2.4, -3.0, { yaw: 20 });
put('scroll', 3.6, -3.1, { yaw: 80 });
put('mana-potion', 4.3, -1.0, { y: 0.55 });
put('magic-rune', 0, 0.8, { scale: 0.001 }); places.pop();
put('banner', 3.4, -4.9, { y: 0.2 });
put('glowing-mushroom', -4.4, 4.7);
put('blue-mushroom', -3.9, -2.2);
put('lantern', 3.5, 1.9);
put('sack', -3.9, -2.9);
put('urn', 4.5, -3.6);

const fmt = (p) => {
  const [x, y, z] = p.at;
  const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
  return `  { asset: '${p.asset}', at: [${num(x)}, ${num(y)}, ${num(z)}]${p.yaw ? `, yaw: ${p.yaw}` : ''}${p.scale ? `, scale: ${p.scale}` : ''} },`;
};
writeFileSync('scenes/maps/wizard-tower.ts', `// GENERATED by scripts/design-wizard-tower.mjs — edit the generator, not this file.
import type { Place } from '../chibi-quest.js';
export function places(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`);
const tally = {};
for (const p of places) tally[p.asset] = (tally[p.asset] ?? 0) + 1;
writeFileSync('docs/map-mockups/wizard-tower.md', `# Wizard tower — map plan (generated)

GENERATED by scripts/design-wizard-tower.mjs. Chamber 10 m x 10 m (x -5..5, z -5..5), ${places.length} pieces.

Zones: NE focal nook (crystal-ball desk, orb, magic crystals); NW study (stairs up, scroll desk,
west bookshelves, star tapestries); east observatory (telescope, window); centre ritual circle with
floating candles and the wizard; SE storage (cauldron, barrels, potions); SW reading nook.
Path: open south edge to the ritual circle to either desk. North and west walls are full, the east
wall covers z -3..1, south and east edges are the cutaway with a rubble ring.

Tally: ${JSON.stringify(tally)}
`);
console.log(places.length, 'places');
