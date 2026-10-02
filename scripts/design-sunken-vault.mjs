#!/usr/bin/env node
// Sunken Vault map designer: derives the wall plan from the zone cells so
// every count is exact. Prints an ASCII map and the component allocation,
// and writes the scene module scenes/sunken-vault.ts plus the doc
// docs/dungeon-mockups/map.md from the same data.
//
// Grid: col 1..12 west->east, row 1..8 north->south. Cell (c,r) spans
// x in [(c-7)*2,(c-6)*2], z in [(r-5)*2,(r-4)*2]. h slot = E-W wall on a
// horizontal grid line; v slot = N-S wall on a vertical grid line.
//
// Corner rule: at a grid vertex with 2-3 wall arms, a corner piece covers a
// perpendicular pair of plain-wall slots. Portal/alcove/bars/gap slots are
// never absorbed; a 4-arm crossing gets no corner.

import { writeFileSync } from 'node:fs';

const zones = {
  S: { c0: 4, c1: 9, r0: 1, r1: 3 }, // sanctum
  H: { c0: 5, c1: 8, r0: 4, r1: 7 }, // central hall
  W: { c0: 1, c1: 4, r0: 4, r1: 7 }, // west cell block
  E: { c0: 9, c1: 12, r0: 4, r1: 7 }, // east treasury
  G: { c0: 5, c1: 8, r0: 8, r1: 8 }, // gatehouse approach
  F: { c0: 1, c1: 4, r0: 8, r1: 8 }, // flooded strip west
  f: { c0: 9, c1: 12, r0: 8, r1: 8 }, // flooded strip east
};
const cellZone = (c, r) => {
  for (const [id, z] of Object.entries(zones)) if (c >= z.c0 && c <= z.c1 && r >= z.r0 && r <= z.r1) return id;
  return null;
};
const key = (o, line, b) => `${o}:${line}:${b}`;

// --- wall slots: every edge between cells of different zone ids ----------
const slots = new Map(); // key -> type
const addSlot = (o, line, b, type = 'wall') => slots.set(key(o, line, b), type);
for (let c = 1; c <= 12; c++)
  for (let r = 1; r <= 8; r++) {
    const z = cellZone(c, r);
    const x0 = (c - 7) * 2, z0 = (r - 5) * 2;
    if (cellZone(c, r - 1) !== z) addSlot('h', z0, x0); // north edge
    if (cellZone(c, r + 1) !== z) addSlot('h', z0 + 2, x0); // south edge
    if (cellZone(c - 1, r) !== z) addSlot('v', x0, z0); // west edge
    if (cellZone(c + 1, r) !== z) addSlot('v', x0 + 2, z0); // east edge
  }

// --- internal subdivision walls ------------------------------------------
const internal = [
  ['v', -8, -2, 'wall'], // cell block N-S line (c2/c3), r4
  ['v', -8, 0, 'bars'], //  r5: NW cell barred front
  ['v', -8, 2, 'bars'], //  r6: SW cell barred front
  ['v', -8, 4, 'wall'], //  r7
  ['h', 2, -12, 'wall'], // cell divider r5/r6, c1
  ['h', 2, -10, 'wall'], //  c2
  ['h', 4, 8, 'alcove'], // crypt north wall (r6/r7), c11
  ['h', 4, 10, 'door'], //  c12: crypt door
];
for (const [o, l, b, t] of internal) addSlot(o, l, b, t);

// --- portals and openings on boundary slots ------------------------------
const setType = (k, t) => {
  if (!slots.has(k)) throw new Error('opening on non-wall slot ' + k);
  slots.set(k, t);
};
setType(key('v', -4, 2), 'arch'); // hall->cell block, grand (r6)
setType(key('v', -4, -2), 'door'); // hall->cell block, guard door (r4)
setType(key('v', 4, 0), 'arch'); // hall->treasury (r5)
setType(key('h', -2, -2), 'arch'); // sanctum->hall W (c6)
setType(key('h', -2, 0), 'arch'); // sanctum->hall E (c7)
setType(key('h', 6, 0), 'door'); // gatehouse->hall (c7)
setType(key('h', 8, 0), 'gate'); // south entry (c7)
setType(key('h', -8, 4), 'gap'); // stairwell opening north outer (c9)
setType(key('h', -2, -4), 'alcove'); // sanctum S wall W of arch (c5)
setType(key('h', -2, 2), 'alcove'); // sanctum S wall E of arch (c8)
setType(key('v', 6, -6), 'alcove'); // sanctum E upper wall (r2)

// --- corner detection -----------------------------------------------------
// arms: hW/hE along the line z=Z, vN/vS along x=X. Gap slots are not arms.
const cornerSlots = new Set();
const corners = []; // {X, Z, arms:[dir,dir], slots:[k,k]}
for (let X = -12; X <= 12; X += 2)
  for (let Z = -8; Z <= 8; Z += 2) {
    const arms = [];
    const add = (dir, k) => {
      if (slots.has(k) && slots.get(k) !== 'gap') arms.push({ dir, key: k, type: slots.get(k) });
    };
    add('hW', key('h', Z, X - 2));
    add('hE', key('h', Z, X));
    add('vN', key('v', X, Z - 2));
    add('vS', key('v', X, Z));
    if (arms.length < 2 || arms.length > 3) continue;
    // find a perpendicular pair of unclaimed plain-wall slots
    let pair = null;
    for (let i = 0; i < arms.length && !pair; i++)
      for (let j = i + 1; j < arms.length && !pair; j++) {
        const a = arms[i], b = arms[j];
        const perp = a.dir[0] !== b.dir[0];
        if (!perp || a.type !== 'wall' || b.type !== 'wall') continue;
        if (cornerSlots.has(a.key) || cornerSlots.has(b.key)) continue;
        pair = [a, b];
      }
    if (pair) {
      corners.push({ X, Z, arms: pair.map((p) => p.dir), slots: pair.map((p) => p.key) });
      cornerSlots.add(pair[0].key);
      cornerSlots.add(pair[1].key);
    }
  }

// --- counts ---------------------------------------------------------------
const straight = [...slots.entries()].filter(([k]) => !cornerSlots.has(k));
const byType = {};
for (const [, t] of straight) byType[t] = (byType[t] ?? 0) + 1;
const pieces = straight.filter(([, t]) => t !== 'gap').length + corners.length;

// --- ASCII map ------------------------------------------------------------
// Canvas: vertex (X,Z) at col (X+12)/2*3, row (Z+8)/2*2. Cells sit between.
const W = 37, H = 17;
const canvas = Array.from({ length: H }, () => Array(W).fill(' '));
const glyph = { wall: '#', alcove: 'A', arch: '^', door: 'D', gate: 'G', bars: 'B', gap: '~' };
for (const [k, t] of slots) {
  const [o, line, b] = k.split(':').map((s, i) => (i ? Number(s) : s));
  if (o === 'h') {
    const row = (line + 8) / 2 * 2, col = (b + 12) / 2 * 3;
    canvas[row][col + 1] = glyph[t];
    canvas[row][col + 2] = glyph[t];
  } else {
    const col = (line + 12) / 2 * 3, row = (b + 8) / 2 * 2;
    canvas[row + 1][col] = glyph[t];
  }
}
for (const c of corners) canvas[(c.Z + 8) / 2 * 2][(c.X + 12) / 2 * 3] = '+';
for (let c = 1; c <= 12; c++)
  for (let r = 1; r <= 8; r++) {
    const z = cellZone(c, r);
    if (z) canvas[(r - 1) * 2 + 1][(c - 1) * 3 + 1] = z === 'f' ? 'F' : z;
  }

console.log('=== Sunken Vault wall plan (12x8 tiles, 2 m each) ===');
console.log(canvas.map((r) => r.join('')).join('\n'));
console.log('\nglyphs: # wall  + corner piece  A alcove  ^ arch  D door  G gate  B bars  ~ stair gap');
console.log('zones: S sanctum  H hall  W cell block  E treasury  G gatehouse  F flooded');

const need = (n) => straight.filter(([, t]) => t === n).length;
console.log('\n=== counts ===');
console.log(`wall slots ${slots.size} | corners ${corners.length} | straight slots ${straight.length} | pieces ${pieces}`);
console.log(`wall ${need('wall')} | corner ${corners.length} | alcove ${need('alcove')} | arch ${need('arch')} | door ${need('door')} | gate ${need('gate')} | bars ${need('bars')} | gap ${need('gap')}`);
console.log('corners:', corners.map((c) => `(${c.X},${c.Z})[${c.arms}]`).join(' '));

// ---------------------------------------------------------------------------
// Placement emission: one Place list for the viewer, one table for the doc.
// ---------------------------------------------------------------------------
const FLOOR_Y = 0.09; // top of a floor tile
const places = [];
const put = (asset, x, z, opts = {}) => {
  const p = { asset, at: [x, opts.y ?? 0, z] };
  if (opts.yaw) p.yaw = opts.yaw;
  places.push(p);
};

// Floors: every zone cell except the stairs cell (c9,r1). Every 4th is cracked.
const isZone = (c, r) => cellZone(c, r) !== null;
let crackedCount = 0;
for (let c = 1; c <= 12; c++)
  for (let r = 1; r <= 8; r++) {
    if (!isZone(c, r) || (c === 9 && r === 1)) continue;
    const cracked = (c + 2 * r) % 4 === 0;
    if (cracked) crackedCount++;
    put(cracked ? 'floor-cracked' : 'floor', (c - 6.5) * 2, (r - 4.5) * 2);
  }
// Approach run outside the gate: c6-c8, rows 9-10 (z 8..12).
for (const c of [6, 7, 8])
  for (const r of [9, 10]) {
    const cracked = (c + r) % 3 === 0;
    if (cracked) crackedCount++;
    put(cracked ? 'floor-cracked' : 'floor', (c - 6.5) * 2, (r - 4.5) * 2);
  }
const floorCount = 77 + 6 - crackedCount;

// Stairs replace the (c9,r1) floor and rise out through the north wall gap.
put('stairs', 5, -7, { yaw: 180 });

// Straight wall pieces.
const alcoveYaw = { 'h:-2:-4': 180, 'h:-2:2': 180, 'v:6:-6': 270, 'h:4:8': 0 }; // niche faces the room
const assetOf = { wall: 'wall', alcove: 'wall-alcove', arch: 'arch', door: 'door', gate: 'gate', bars: 'cell-bars' };
for (const [k, t] of straight) {
  if (t === 'gap') continue;
  const [o, line, b] = k.split(':').map((s, i) => (i ? Number(s) : s));
  const x = o === 'h' ? b + 1 : line;
  const z = o === 'h' ? line : b + 1;
  const yaw = alcoveYaw[k] ?? (o === 'v' ? 90 : 0);
  put(assetOf[t], x, z, { yaw });
}

// Corners: base piece (yaw 0) has arms pointing W (-X) and N (-Z).
const cornerYaw = { 'hW,vN': 0, 'hW,vS': 90, 'hE,vS': 180, 'hE,vN': 270 };
for (const c of corners) {
  const yaw = cornerYaw[c.arms.join(',')];
  if (yaw === undefined) throw new Error('no yaw for arms ' + c.arms);
  put('wall-corner', c.X, c.Z, { yaw });
}

// Fixed dressing and props (design list — the doc table mirrors this).
const props = [
  // pillars: hall pair flanking the axis, treasury colonnade of four
  ['pillar', -1.2, 2], ['pillar', 1.2, 2],
  ['pillar', 5, 1], ['pillar', 7, 1], ['pillar', 5, 3], ['pillar', 7, 3],
  // sanctum focal point
  ['altar', 1, -7], ['candle-cluster', 1.7, -6.8],
  // torch sconces: hall side walls, gatehouse and sanctum end walls
  ['torch-sconce', -3.7, 1, 90], ['torch-sconce', -3.7, 5, 90],
  ['torch-sconce', 3.7, -1, 270], ['torch-sconce', 3.7, 5, 270],
  ['torch-sconce', -1, 7.7, 180], ['torch-sconce', 3, 7.7, 180],
  ['torch-sconce', -3, -7.7, 0], ['torch-sconce', 3, -7.7, 0],
  // braziers flank the gate outside, on bare ground
  ['brazier', -1, 9.2], ['brazier', 3, 9.2],
  // hall centerpiece
  ['hanging-cage', 0, 2],
  // crypt
  ['sarcophagus', 6, 7], ['candle-cluster', 4.6, 7],
  // treasury
  ['cauldron', 11, -1], ['gold-pile', 5, -1], ['gold-pile', 11, 1],
  ['rubble', 11.3, 3.4], ['moss-tuft', 9, 3.5], ['chains', 5.7, 3.5],
  // cell block
  ['bone-pile', -11, 0.6], ['bone-pile', -10.5, 5], ['bone-pile', -7.4, -1],
  ['chains', -7, 0.6], ['candle-cluster', -5, 5.4], ['rubble', -5.3, -1.4],
  ['gold-pile', -5, 1], ['crystal-cluster', -11.3, 5.6],
  // hall + gatehouse dressing
  ['chains', 0.5, 7.3], ['chains', -1.9, 2.6], ['rubble', -5.4, -3.2],
  ['moss-tuft', -3.6, -1.6], ['moss-tuft', 3.6, 5.6], ['moss-tuft', -3, 7.5],
  ['crystal-cluster', -3.4, 4.6], ['crystal-cluster', 3, 7],
  // sanctum dressing
  ['moss-tuft', -5, -7], ['moss-tuft', 5, -3],
  ['crystal-cluster', -5.4, -4.6], ['crystal-cluster', 3.4, -6.6],
  // flooded strips
  ['mushroom-cluster', -11, 7], ['mushroom-cluster', -7, 7.6],
  ['mushroom-cluster', 7, 7], ['mushroom-cluster', 11, 7.5],
  // story dressing: cells (chains, bones), treasury (gold, chests), sanctum (altar, candles)
  ['chains', -11, -1.6], ['bone-pile', -11.2, 2.6], ['bone-pile', -9.2, 5.6], ['barrel', -5.2, 3.4],
  ['crate', -5.2, 4.6], ['candle-cluster', -4.8, -2.6],
  ['treasure-chest', 11.2, 5, 270], ['treasure-chest', 6.2, 5, 90], ['gold-pile', 8.2, -0.6], ['gold-pile', 6.4, 1.6],
  ['gold-pile', 11.2, -2.4], ['crate', 9.4, 5.2], ['barrel', 11.4, 2.2], ['candle-cluster', 9.4, -2.6],
  ['candle-cluster', 3.6, -7], ['candle-cluster', -0.8, -7], ['candle-cluster', 0, -3.4], ['bone-pile', -3, -4.8],
  ['mushroom-cluster', 4, -3.6], ['crystal-cluster', 1.6, -4.4],
  ['walkway', -9, 7], ['moss-tuft', -11.4, 3], ['moss-tuft', -9, -1.5],
];
for (const [asset, x, z, yaw = 0, y = FLOOR_Y] of props) put(asset, x, z, { yaw, y });

// Scale figures.
put('adventurer', -0.6, 3.4, { y: FLOOR_Y });
put('skeleton', -9.4, -1.2, { yaw: 120, y: FLOOR_Y });
put('adventurer', 1, 10.6, { yaw: 180, y: FLOOR_Y });

// ---------------------------------------------------------------------------
const fmt = (p) => {
  const [x, y, z] = p.at;
  const num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
  return `  { asset: '${p.asset}', at: [${num(x)}, ${num(y)}, ${num(z)}]${p.yaw ? `, yaw: ${p.yaw}` : ''} },`;
};
const sceneSrc = `// GENERATED by scripts/design-sunken-vault.mjs — edit the generator, not this file.
// The complete Sunken Vault: 12x8 tiles of 2 m, all 26 kit pieces placed.
import type { Place } from './chibi-quest.js';

export function sunkenVaultPlaces(): Place[] {
  return [
${places.map(fmt).join('\n')}
  ];
}
`;
writeFileSync('scenes/sunken-vault.ts', sceneSrc);

// Component tally for the doc and components.tsv.
const tally = {};
for (const p of places) if (!['adventurer', 'skeleton'].includes(p.asset)) tally[p.asset] = (tally[p.asset] ?? 0) + 1;

const zoneRows = [
  ['S', 'sanctum', 'c4-9, r1-3', 'altar, stairs to the surface, 2 crystal clusters'],
  ['H', 'central hall', 'c5-8, r4-7', 'twin pillars, hanging cage, 4 sconces'],
  ['W', 'cell block', 'c1-4, r4-7', '2 barred cells (NW, SW) + guard corridor'],
  ['E', 'treasury', 'c9-12, r4-7', 'pillar colonnade, crypt row (c11-12, r7)'],
  ['G', 'gatehouse', 'c5-8, r8', 'gate in, door to the hall'],
  ['F', 'flooded strip W', 'c1-4, r8', 'water, mushrooms, walkway jetty'],
  ['F', 'flooded strip E', 'c9-12, r8', 'water, mushrooms'],
];
const doc = `# Sunken Vault — map plan (generated)

GENERATED by \`scripts/design-sunken-vault.mjs\` — edit the generator, not this file.

The mockup images set the visual language only; this is the coherent-but-similar
realization. 12 × 8 tiles of 2 m (24 m × 16 m). Tile (c,r) spans
x in [(c-7)·2,(c-6)·2], z in [(r-5)·2,(r-4)·2]; walls sit on tile edges.

\`\`\`
${canvas.map((r) => r.join('')).join('\n')}
\`\`\`

Glyphs: \`#\` wall · \`+\` corner piece · \`A\` alcove · \`^\` arch · \`D\` door ·
\`G\` gate · \`B\` cell bars · \`~\` stair gap (stairs rise out through it).

## Zones

| id | zone | cells | contents |
|----|------|-------|----------|
${zoneRows.map((r) => `| ${r.join(' | ')} |`).join('\n')}

Deviations from the README zone table: the cell block is two barred cells plus a
guard corridor (not six cells); the treasury gains a walled crypt row entered
through a door; the flooded strip is split by the gatehouse.

## Route

South gate (G) → gatehouse → door → central hall. West: grand arch + guard door
into the cell block. East: arch into the treasury, crypt door behind the
colonnade. North: twin arches up into the sanctum, altar on the axis, stairs
out through the breach at c9. Fog of war handles concealment; walls are 1.2 m
so the three-quarter camera never loses a character.

## Piece allocation (exact, from the slot plan)

${slots.size} wall slots on the grid; ${corners.length} corners each cover 2 slots,
leaving ${straight.length} straight slots, one of them the stair gap.
Total wall-system pieces: ${pieces}.

| component | count | where |
|-----------|-------|-------|
| wall | ${tally.wall} | all remaining straight slots |
| wall-corner | ${tally['wall-corner']} | every convex bend and 3-arm T (wall-wall arms) |
| wall-alcove | ${tally['wall-alcove']} | sanctum S wall ×2, sanctum E wall, crypt N wall |
| arch | ${tally.arch} | hall↔cell block, hall↔treasury, hall→sanctum ×2 |
| door | ${tally.door} | gatehouse→hall, hall→cell block guard door, treasury→crypt |
| gate | ${tally.gate} | south entry (c7) |
| cell-bars | ${tally['cell-bars']} | barred fronts of the two cells |
| floor | ${floorCount} | every zone tile except the stairs tile and cracked tiles |
| floor-cracked | ${crackedCount} | every 4th tile ((c+2r) mod 4 = 0) |
| stairs | ${tally.stairs} | c9 r1, rising out through the north breach |
| pillar | ${tally.pillar} | hall pair (±1.2, z=2), treasury colonnade ×4 |
| torch-sconce | ${tally['torch-sconce']} | hall ×4, gatehouse ×2, sanctum ×2 |
| brazier | ${tally.brazier} | flanking the gate outside |
| hanging-cage | ${tally['hanging-cage']} | hall center, between the pillars |
| sarcophagus | ${tally.sarcophagus} | crypt (c11-12, r7) |
| altar | ${tally.altar} | sanctum axis (c7, r1) |
| candle-cluster | ${tally['candle-cluster']} | altar, crypt, cell-block guard post |
| cauldron | ${tally.cauldron} | treasury NE |
| gold-pile | ${tally['gold-pile']} | treasury ×2, cell-block guard post |
| chains | ${tally.chains} | bars frontage, gate, hall pillar, treasury pillar |
| bone-pile | ${tally['bone-pile']} | both cells, guard corridor |
| rubble | ${tally.rubble} | sanctum SW, treasury E, guard corridor |
| crystal-cluster | ${tally['crystal-cluster']} | sanctum ×2, hall SW, gatehouse E, SW cell |
| mushroom-cluster | ${tally['mushroom-cluster']} | flooded strips ×4 |
| moss-tuft | ${tally['moss-tuft']} | scattered wall bases ×8 |
| walkway | ${tally.walkway} | jetty into the west flooded strip (c2, r8) |

Reconciliation with the old open problem (fit-check.md): the designed map
replaces the hand-counted zone union. Wall plan derives from cell edges, so
slots, corners, and pieces reconcile by construction: ${pieces} wall-system
pieces, 77 floor tiles, ${places.length} total placed instances.
`;
writeFileSync('docs/dungeon-mockups/map.md', doc);

console.log('\nwrote scenes/sunken-vault.ts (' + places.length + ' places) and docs/dungeon-mockups/map.md');
console.log('tally:', JSON.stringify(tally));
