// Writes bench/sonnet/briefs/<name>.md for the P3 vehicle rows and, with --mockups,
// one mmx mockup per vehicle in docs/vehicle-mockups/<name>-mock.jpg.
//   node bench/sonnet/make-p3-vehicle-briefs.mjs [--mockups] [names...]
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = new URL('../../', import.meta.url).pathname;

const WOOD = 'Wood palette shared by every vehicle: honey oak #b5814a (dominant), warm brown #8a5a35 and walnut #6b4226 (secondary), pale cut wood #c9a06a on lit tops, worn iron #4a4f55 for fittings (roughness 0.5, metalness 0.8). Wood roughness 0.8, no metalness. Plank seams and grain go in `bump` (a function) and in `paintFn` noise, never in subtracted grooves.';

const CART = {
  base: 'assets/market-cart.ts (two-wheeled cart, 487 lines)',
  tris: 12000,
  size: 'about 1.4 m long (Z), 0.9 m wide (X), 1.0 m tall; stands on y = 0 on both wheels and the shaft tips; shafts toward +Z',
  recipe: `Copy the base with cp, keep its bed, side boards, two spoked wheels, axle and shafts, and change only what the description says (the cargo, the canopy, the fittings). ${WOOD}`,
};
const WAGON = {
  base: 'assets/wagon.ts (four-wheeled farm wagon, 433 lines, 15,000 triangles)',
  tris: 20000,
  size: 'about 2.6 m long (Z), 1.1 m wide (X), up to 1.8 m tall with a cover; four wheels on y = 0; drawbar shaft toward +Z',
  recipe: `Copy the base with cp, keep its plank bed, low sides, four spoked wheels, axles and drawbar, and change only what the description says (the cargo, the cover, the fittings). ${WOOD}`,
};
const BOAT = {
  base: 'none: build from the recipe',
  tris: 12000,
  size: 'as the description says; the keel rests on y = 0, the bow points toward +Z, centered on the Y axis',
  recipe: `Build the hull as one \`sdf.revolve\` or as a stretched ellipsoid cut by half-spaces: an ellipsoid [half width, 0.45 m, half length] at y 0.45, cut flat on top at the gunwale height (intersect halfSpace [0, 1, 0]) and hollowed with a smaller ellipsoid subtracted (walls 0.06 m thick), then cut flat on the bottom 0.05 m above the keel line so it rests on y = 0. Lift the bow with a second ellipsoid blended in. Add a keel strip (box 0.06 m wide along the bottom), a gunwale rail (torus-like: the hull shell's top edge rounded with .round(0.02)), thwart seats (boxes across the hull), and the parts the description names. Paint plank rows as horizontal bands two shades apart with paintFn; grain in bump. ${WOOD}`,
};
const SHIP = {
  base: 'none: build from the recipe',
  tris: 30000,
  size: 'as the description says; the keel rests on y = 0, the bow points toward +Z, centered on the Y axis; the mast is vertical',
  recipe: `Build the hull like a boat (a stretched ellipsoid hollowed to a 0.1 m wall, cut flat at the deck height, keel cut flat on y = 0), then add a flat deck body (a box that fills the hull opening), a raised stern castle (a box with a railing of small posts), a bowsprit (a cone forward and up from the bow), one or two masts (cylinders r 0.08 with a crossbar yard), a sail per mast (an extruded curved profile 0.05 m thick, bellied toward +Z with .bend or an offset ellipsoid cut to a rectangle), a rudder at the stern, and the parts the description names. Sails are pale cloth #efe6d2 (roughness 0.9); ropes are capsules r 0.02 (never thinner). Paint plank rows as horizontal bands; grain in bump. ${WOOD}`,
};
const AIR = {
  base: 'none: build from the recipe',
  tris: 30000,
  size: 'as the description says; the lowest part rests on y = 0, the front points toward +Z, centered on the Y axis',
  recipe: `Build the parts the description names as separate bodies per material (envelope or balloon cloth roughness 0.7, wicker or wood 0.8, brass fittings metalness 0.9 roughness 0.35, ropes as capsules r 0.02 or more). Big rounded volumes first, then the gondola or basket, then the fittings. ${WOOD}`,
};

const VEHICLES = [
  { name: 'handcart', id: 'vehicles/land/handcart', kind: CART,
    desc: 'A handcart: a small two-wheeled cart pushed by hand: a shallow plank box 1.0 x 0.5 x 0.3 m on two spoked wheels r 0.32, two straight handles (capsules r 0.03) reaching back and up to 0.9 m at -Z (the pushing end), one prop leg at the front, and a load of three burlap sacks and one wooden crate.',
    mock: 'a cute chunky wooden handcart with two big spoked wheels, two long handles, loaded with burlap sacks and a crate' },
  { name: 'merchant-cart', id: 'vehicles/land/merchant-cart', kind: CART,
    desc: 'A merchant cart: a two-wheeled cart with a red-and-white striped canvas awning on four posts over the bed (awning 1.5 x 1.1 m, scalloped edge, 1.5 m high), and a display of goods: rolled cloth bolts in three colors (#c8302a, #2f6aa8, #e0bb60), a stack of three small crates, and a hanging lantern at the front post.',
    mock: 'a cute chunky wooden merchant cart with two big spoked wheels and a red and white striped canvas awning on posts, cloth bolts and crates on the bed' },
  { name: 'caravan-wagon', id: 'vehicles/land/caravan-wagon', kind: WAGON,
    desc: 'A caravan wagon: a four-wheeled wagon with a rounded wooden house on the bed: barrel-vaulted roof (a half cylinder along Z, r 0.6, painted deep green #2f7a4a with a gold trim line), plank walls painted red #b03a2a, a small door with a round window at the back (-Z), one round window on each side with a flower box, a short chimney pipe (iron) through the roof, and a driver bench at the front. Total about 2.6 m long, 2.0 m tall.',
    mock: 'a cute chunky wooden gypsy caravan wagon with four spoked wheels, a rounded green barrel roof, red plank walls, a small round window with a flower box, a little chimney' },
  { name: 'covered-wagon', id: 'vehicles/land/covered-wagon', kind: WAGON,
    desc: 'A covered wagon: a four-wheeled wagon with a pale canvas cover (#efe6d2) stretched over five hoops, the cover 1.9 m tall at the peak and open in a puckered oval at the back, a driver bench at the front, a water barrel strapped to one side, and a lantern hanging from the front hoop.',
    mock: 'a cute chunky wooden covered wagon with four spoked wheels and a pale canvas top over hoops, a water barrel strapped to the side' },
  { name: 'war-wagon', id: 'vehicles/land/war-wagon', kind: WAGON,
    desc: 'A war wagon: a four-wheeled wagon armored with dark iron plates (#4a4f55) on the sides, each plate with a row of rivet domes, a crenellated wooden wall on top with two arrow slits, iron spikes (cones 0.15 m) on the wheel hubs, a crossbow-like ballista on a pivot at the front, and a red pennant on a pole at the back.',
    mock: 'a cute chunky wooden war wagon with four spoked wheels, dark iron plates with rivets on the sides, a crenellated top wall, hub spikes and a small ballista' },
  { name: 'sleigh', id: 'vehicles/land/sleigh', kind: BOAT,
    desc: 'A sleigh: a red (#b03a2a) curved-front sled body 2.0 m long, 0.9 m wide, with a high curling front (a scroll: a tapered chain that curls up and back at +Z to 1.1 m), a padded bench seat (dark green cushion #2f5a3a with gold buttons) across the middle, gold trim lines painted along the sides, and two iron runners (capsules r 0.03 along Z, curled up at the front) that hold the body 0.15 m above y = 0, with two low cross struts. No wheels; the runners rest on y = 0.',
    mock: 'a cute chunky red wooden sleigh with a high curling front, gold trim, a green cushioned bench seat and two curved iron runners' },
  { name: 'rowboat', id: 'vehicles/water/rowboat', kind: BOAT,
    desc: 'A rowboat: 2.4 m long, 1.0 m wide, 0.6 m tall at the raised bow, oak planks with a white painted band along the gunwale, two thwart seats, two oars (capsules r 0.03, 1.8 m, blades as flattened ellipsoids) resting across the gunwales angled outward, a coiled rope in the bow, and a small iron ring at the bow tip.',
    mock: 'a cute chunky wooden rowboat with two oars resting across it, a coiled rope in the bow, a white band along the rim' },
  { name: 'fishing-boat', id: 'vehicles/water/fishing-boat', kind: BOAT,
    desc: 'A fishing boat: 3.2 m long, 1.3 m wide, a rounded hull painted blue (#2f6aa8) below a white band and oak above, a short mast (1.9 m) with a small furled sail wrapped on a boom, a net (a rounded box of thin painted cross lines, no thin geometry) heaped in the stern, two crates of silver fish, three round cork floats on the gunwale, and one lantern on the mast.',
    mock: 'a cute chunky wooden fishing boat with a blue painted hull and white band, a short mast with a furled sail, a heap of net and crates of fish in the stern' },
  { name: 'riverboat', id: 'vehicles/water/riverboat', kind: SHIP,
    desc: 'A riverboat: 4.5 m long, 1.6 m wide, a flat-bottomed wide hull with a low freeboard, a small cabin house amidships (a box 1.6 x 1.2 x 1.3 m with a shallow peaked roof painted red #b03a2a, one window per side, a door at the stern side), a paddle wheel at the stern (a cylinder with eight paddle boards, r 0.55, half submerged: cut flat at y = 0), a short smokestack (iron, 0.8 m) on the cabin roof, a long steering oar, and stacked cargo (three barrels, two crates) on the fore deck.',
    mock: 'a cute chunky wooden riverboat with a flat wide hull, a small red-roofed cabin, a stern paddle wheel, a short smokestack and barrels on the fore deck' },
  { name: 'longship', id: 'vehicles/water/longship', kind: SHIP,
    desc: 'A longship: 6.0 m long, 1.6 m wide, a low slim clinker hull (five overlapping plank bands painted with paintFn, each 0.06 m proud in bump) that curls up at both ends to 1.6 m, a carved dragon head (a stylized chunky head: a tapered chain neck, a rounded snout, two horns) at the bow and a curled tail at the stern, one central mast 3.6 m with a wide square sail (red and white vertical stripes, #c8302a and #efe6d2, bellied toward +Z), a yard, and a row of eight round shields (r 0.28, alternating red and yellow #e0bb60 with an iron boss) hung along each gunwale, plus six oars per side angled down into the water line (cut at y = 0).',
    mock: 'a cute chunky wooden viking longship with a curled dragon head prow, a striped square red and white sail, a row of round painted shields along the side' },
  { name: 'merchant-ship', id: 'vehicles/water/merchant-ship', kind: SHIP,
    desc: 'A merchant ship: 7.0 m long, 2.4 m wide, a deep round-bellied hull (cog style) with a raised stern castle and a small fore castle, one tall mast (5 m) with a big square cream sail (#efe6d2, a blue #2f6aa8 stripe band across the middle), a crow\'s nest basket near the top, a bowsprit, a rudder with a tiller, a row of six round porthole-like dark dots along each side, and a cargo of barrels and crates lashed on the main deck, plus one anchor (iron) hanging at the bow.',
    mock: 'a cute chunky wooden merchant sailing ship with a round-bellied hull, a raised stern castle, one tall mast with a big cream square sail with a blue stripe, a crow\'s nest, barrels on deck' },
  { name: 'pirate-ship', id: 'vehicles/water/pirate-ship', kind: SHIP,
    desc: 'A pirate ship: 8.0 m long, 2.6 m wide, a dark walnut hull (#4a3020) with a black band and gold trim line, a tall stern castle with three square windows painted amber, two masts (5.5 m and 4.5 m) each with a black sail (#2a2a2e) bearing a painted white skull-and-crossbones (a circle and two bars as a paint stencil) on the main sail, a crow\'s nest, a bowsprit with a small jib, a row of four cannon muzzles (short iron cylinders) poking from each side, a black flag on the main mast top, an anchor, and a carved figurehead (a stylized chunky mermaid or serpent) at the bow.',
    mock: 'a cute chunky wooden pirate ship with a dark hull and gold trim, two masts with black sails, a skull and crossbones on the main sail, cannons poking from the side, a tall stern castle with amber windows' },
  { name: 'balloon-basket', id: 'vehicles/air/balloon-basket', kind: AIR,
    desc: 'A hot-air balloon with a basket: a big striped balloon envelope (a sphere r 1.4 blended into a cone that narrows to r 0.5 at the bottom, total 3.4 m tall; eight vertical gores alternating red #c8302a and cream #efe6d2 by paintFn on the azimuth angle) whose bottom skirt sits 1.5 m above the basket; a wicker basket (a rounded box 1.0 x 0.8 x 0.9 m, tan #b07a48 with a woven cross-hatch in bump and a darker leather rim) resting on y = 0; four ropes (capsules r 0.025) from the basket corners to the balloon skirt; a small brass burner between them; two sandbags hanging from the basket rim. Total about 5.4 m tall.',
    mock: 'a cute chunky hot air balloon with red and cream stripes and a wicker basket, ropes and little sandbags, standing on the ground' },
  { name: 'flying-carpet', id: 'vehicles/air/flying-carpet', kind: AIR,
    desc: 'A flying carpet: a rippled rectangular carpet 2.2 m (Z) x 1.4 m (X), 0.06 m thick, hovering with its lowest ripple 0.25 m above y = 0 (a wave along Z: the front edge lifted up, two gentle waves), deep red #a8302a field with a gold #d4a93a border band and a painted central diamond medallion in teal #2f8a8a and gold, tassels (short capsules r 0.02) along the two short edges, and a soft teal magic glow: a flat disc (ellipsoid [1.0, 0.05, 1.3]) under the carpet at y 0.1, color #6ff0e8, emissive #6ff0e8 at intensity 0.5, opacity 0.5.',
    mock: 'a cute chunky magic flying carpet, deep red with gold border and a teal diamond medallion, rippling in the air with tassels, a soft teal glow beneath it' },
  { name: 'airship', id: 'vehicles/air/airship', kind: AIR,
    desc: 'An airship: a fat cigar-shaped envelope (an ellipsoid [1.3, 1.3, 3.2] with a slightly pointed bow, tan canvas #d8c39a with three darker seam bands painted around it and a brass nose cap), a wooden boat-shaped gondola (2.6 m long, 1.0 m wide, like a small ship hull with a cabin house and a railing of posts) hung 0.9 m below the envelope by six ropes (capsules r 0.03), two brass propeller pods (cylinders with two-blade propellers, blades 0.06 m thick) on struts at the stern, three tail fins (boxes 0.08 m thick) at the stern of the envelope, and two landing skids under the gondola resting on y = 0. Total about 7.0 m long, 5.0 m tall.',
    mock: 'a cute chunky fantasy airship with a fat tan canvas balloon, a wooden boat gondola hanging below on ropes, brass propellers and tail fins, resting on skids' },
];

function brief(it) {
  const k = it.kind;
  return `# ${it.name} (${it.id}) -> assets/${it.name}.ts

${it.desc}

Size: ${k.size}. Chibi scale: a character is 1 m tall, a barrel 0.9 m; keep the vehicle's proportions chunky (wheels big, planks thick, nothing thinner than 0.04 m).
Mockup: docs/vehicle-mockups/${it.name}-mock.jpg (set \`reference\` to that path). Match its idea and colors, not every detail.
Base file: ${k.base}. Read it first. ${k.recipe}

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a full-brightness base color with emissiveIntensity 0.35 to 0.7. Glass and magic use opacity 0.5 or more. The \`bump\` body option is a function \`(x, y, z) => number\`.

Limits: whole asset under ${k.tris.toLocaleString('en')} triangles; \`detail\` 0.006 to 0.01 for the big forms, 0.004 for small fittings. No \`warning:\` lines. Set \`FORGE_WORKERS=2\` on every forge command. Iterate with \`./forge render ${it.name} --fast\` (at most three looks at out/${it.name}/render.png: silhouette first, then proportions, then color), then run \`./forge all ${it.name}\` once and confirm from its output that the textured build passed. Never commit. Only create or edit assets/${it.name}.ts. Report triangles, warnings, your self-score out of 10, and the three largest differences from the mockup.
`;
}

const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const list = names.length ? VEHICLES.filter((it) => names.includes(it.name)) : VEHICLES;
mkdirSync(`${root}bench/sonnet/briefs`, { recursive: true });
for (const it of list) writeFileSync(`${root}bench/sonnet/briefs/${it.name}.md`, brief(it));
console.log(`wrote ${list.length} briefs`);

if (process.argv.includes('--mockups')) {
  mkdirSync(`${root}docs/vehicle-mockups`, { recursive: true });
  for (const it of list) {
    const out = `${root}docs/vehicle-mockups/${it.name}-mock.jpg`;
    if (existsSync(out)) continue;
    const p = `Cute chunky stylized 3D game asset for a chibi fantasy RPG: ${it.mock}. Single object centered, three-quarter view, plain light gray studio background, soft studio lighting, rounded soft bevels, cheerful saturated colors, matte clay toy look, no text, no people.`;
    try {
      execFileSync('mmx', ['image', 'generate', '--prompt', p, '--aspect-ratio', '1:1', '--out', out, '--quiet'], { stdio: 'inherit', timeout: 180000 });
      console.log(`mockup ${it.name}: ${existsSync(out) ? 'ok' : 'MISSING'}`);
    } catch (e) {
      console.log(`mockup ${it.name}: FAILED ${String(e.message).slice(0, 120)}`);
    }
  }
}
