// Writes bench/sonnet/briefs/<name>.md for the P2 item rows (wave 1) and, with --mockups,
// one mmx mockup per item in docs/item-mockups/<name>-mock.jpg.
//   node bench/sonnet/make-p2-item-briefs.mjs [--mockups] [names...]
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = new URL('../../', import.meta.url).pathname;

const POTION = {
  base: 'assets/health-potion.ts',
  tris: 4000,
  size: '0.18 m tall, about 0.12 m wide at the belly, flat foot on y = 0, front toward +Z',
  recipe: `Copy the base with cp, keep its ball flask, solid glass body, lip, cork and twine construction, and change only what the description says: the liquid color, the fill level, the stopper, and one identifying mark. Liquid material rule (tested on the base): color = the glow color itself at full brightness (for example #2f6ee8 for a blue potion), emissive = the same color, emissiveIntensity 0.6, roughness 0.25. Never darken the base color: the 0.5 glass already darkens the liquid, and a darkened base reads as mud. A higher intensity than 0.6 washes the liquid out to a pastel. Keep the glass body exactly as the base has it: color #4a5a64, opacity 0.5, roughness 0.05. The sprite renderer drops every surface below opacity 0.5, so never lower the glass opacity. Look at the render after the color change: the liquid must read as a saturated color, not a pastel.`,
};
const KEY = {
  base: 'assets/key-iron.ts',
  tris: 3000,
  size: '0.24 m long, 0.09 m across the bow, lying flat on y = 0, bow toward -X, bit toward +X',
  recipe: `Copy the base with cp, keep its bow, shaft, collar and bit construction, and change only the material, the bow shape, and the bit teeth as the description says.`,
};
const COIN = {
  base: 'assets/gold-coin.ts',
  tris: 3000,
  size: '0.12 m across, 0.022 m thick, standing on its edge on y = 0, face toward +Z',
  recipe: `Copy the base with cp, keep the disc, rim and punched emblem construction, and change only the metal and the emblem as the description says.`,
};

export const ITEMS = [
  // consumables, potions on the health-potion base
  { name: 'mana-potion', id: 'items/consumables/mana-potion', kind: POTION,
    desc: 'A mana potion: the same flask as the health potion, filled two thirds with bright blue liquid (#2f6ee8 glow on a dark navy base), a cork stopper, and a small silver star charm on the twine instead of a bow.',
    mock: 'a cute round-bottomed glass potion flask with glowing bright blue liquid, cork stopper, twine tie with a tiny silver star charm' },
  { name: 'stamina-potion', id: 'items/consumables/stamina-potion', kind: POTION,
    desc: 'A stamina potion: the flask filled two thirds with lime green liquid (#7ad83a glow on a dark moss base), a cork stopper, and a small yellow lightning-bolt tag hanging from the twine.',
    mock: 'a cute round-bottomed glass potion flask with glowing lime green liquid, cork stopper, twine tie with a small yellow lightning bolt tag' },
  { name: 'strength-potion', id: 'items/consumables/strength-potion', kind: POTION,
    desc: 'A strength potion: a slightly squatter flask (belly radius 0.066) filled two thirds with orange liquid (#ff7a1e glow on a dark rust base), a wide flat cork, and an iron band around the neck instead of twine.',
    mock: 'a cute squat round glass potion flask with glowing orange liquid, wide flat cork, iron band around the neck' },
  { name: 'speed-potion', id: 'items/consumables/speed-potion', kind: POTION,
    desc: 'A speed potion: a taller slimmer flask (belly radius 0.05, total height 0.2 m) filled two thirds with cyan liquid (#31d9e6 glow on a dark teal base), a cork stopper, and two small white feather shapes tied to the neck.',
    mock: 'a cute tall slim glass potion flask with glowing cyan liquid, cork stopper, two small white feathers tied at the neck' },
  { name: 'antidote', id: 'items/consumables/antidote', kind: POTION,
    desc: 'An antidote: a small flask (scale 0.8 of the base) filled two thirds with pale green liquid (#9fe08a glow on a dark green base), a cork stopper, and a green leaf tag on the twine.',
    mock: 'a small cute round glass vial with glowing pale green liquid, cork stopper, a green leaf tag on the twine' },
  { name: 'resistance-potion', id: 'items/consumables/resistance-potion', kind: POTION,
    desc: 'A resistance potion: the flask filled two thirds with violet liquid (#9a4de8 glow on a dark plum base), a cork stopper, and a small round iron shield emblem on the front of the belly (an extruded disc, 0.02 m across, iron #4a4f55).',
    mock: 'a cute round-bottomed glass potion flask with glowing violet liquid, cork stopper, a small round iron shield emblem on the front' },
  { name: 'invisibility-potion', id: 'items/consumables/invisibility-potion', kind: POTION,
    desc: 'An invisibility potion: the flask filled two thirds with a faint pearly liquid (#dfe9f5 at opacity 0.45, a weak white glow, intensity 0.6 on a pale gray base), a silver cap stopper instead of cork, and a faint wisp of mist (a thin translucent capsule, opacity 0.3) rising from the neck.',
    mock: 'a cute round-bottomed glass potion flask with nearly transparent pearly liquid, silver cap stopper, a faint wisp of mist rising from the neck' },
  { name: 'elixir', id: 'items/consumables/elixir', kind: POTION,
    desc: 'An elixir: a fancier flask with a fluted belly (six shallow vertical grooves made with a small displace), filled three quarters with golden liquid (#ffcf3a glow on a dark amber base), a gold cap stopper with a small red gem on top, and a gold neck ring instead of twine.',
    mock: 'an ornate cute glass elixir flask with fluted belly, glowing golden liquid, gold cap stopper with a small red gem, gold neck ring' },
  { name: 'poison-bottle', id: 'items/consumables/poison-bottle', kind: POTION,
    desc: 'A poison bottle: a flask with a wider squat belly, filled two thirds with dark green liquid (#3fae2a glow on a very dark green base), a black cork, and a small cream label on the front with a black skull mark (an extruded rounded rectangle 0.05 m by 0.035 m, with a dark circle and two small squares as the skull).',
    mock: 'a cute squat glass poison bottle with glowing dark green liquid, black cork, small cream label with a black skull mark' },
  // quest and treasure, keys on the key-iron base, coins on the gold-coin base
  { name: 'key-gold', id: 'items/quest-and-treasure/key-gold', kind: KEY,
    desc: 'A gold key: the same layout as the iron key in polished gold (#f2c14e, shadow #a06b1c, metalness 1, roughness 0.3), the bow shaped as a trefoil of three small rings, and a three-tooth bit.',
    mock: 'a chunky cute gold key with a trefoil bow of three rings and a three-tooth bit, lying flat' },
  { name: 'key-bronze', id: 'items/quest-and-treasure/key-bronze', kind: KEY,
    desc: 'A bronze key: the same layout as the iron key in bronze (#b5763a, shadow #7a4a1e, highlight #e0a86a, metalness 0.9, roughness 0.45), a plain round bow with a heart-shaped hole, and a single wide tooth.',
    mock: 'a chunky cute bronze key with a round bow with a heart-shaped hole and one wide tooth, lying flat' },
  { name: 'key-skeleton', id: 'items/quest-and-treasure/key-skeleton', kind: KEY,
    desc: 'A skeleton key: the same layout in bone white (#e8e0cc, shadow #a89e88, roughness 0.7, no metal), the bow shaped as a small skull (a sphere with two dark eye pits and a row of teeth), and a bit with four thin teeth.',
    mock: 'a cute bone white skeleton key whose bow is a small skull with dark eye pits, a bit with four thin teeth, lying flat' },
  { name: 'ancient-key', id: 'items/quest-and-treasure/ancient-key', kind: KEY,
    desc: 'An ancient key: a larger key (scale 1.25) in dark green-tinted bronze (#6e7a52, shadow #3f4a2e, highlight #a8b088, metalness 0.7, roughness 0.6), a square bow with a glowing teal rune slot in the middle (emissive #3fe0c0 on a dark base, intensity 1.5), and a bit of three uneven teeth.',
    mock: 'a large cute ancient key in dark green bronze with a square bow holding a glowing teal rune, uneven teeth, lying flat' },
  { name: 'silver-coin', id: 'items/quest-and-treasure/silver-coin', kind: COIN,
    desc: 'A silver coin: the same disc in silver (#d8dde3 dominant, shadow #7d858e, sparkle #ffffff, metalness 1, roughness 0.3) with a crescent moon punched through both faces instead of the star.',
    mock: 'a chunky cute silver coin with a raised rim and a crescent moon cut through the face, standing on its edge' },
  { name: 'copper-coin', id: 'items/quest-and-treasure/copper-coin', kind: COIN,
    desc: 'A copper coin: a slightly smaller disc (0.1 m across) in copper (#c8773a dominant, shadow #7c4420, sparkle #f0b07a, metalness 1, roughness 0.4) with a square hole through the middle and a raised ring of six dots around it.',
    mock: 'a chunky cute copper coin with a square hole in the middle and a ring of six raised dots, standing on its edge' },
  // food and containers on their own bases
  { name: 'bread-ration', id: 'items/consumables/bread-ration', base: 'assets/loaf.ts', tris: 3000,
    size: '0.2 m long, 0.09 m wide, 0.07 m tall, lying on y = 0 with its length along X',
    recipe: 'Copy the base with cp and rebuild the shape as described; keep its crust paint approach.',
    desc: 'A bread ration: a short oval crusty roll wrapped in a cream cloth (#e8dcc0) that leaves both ends of the bread showing, tied around the middle with a thin twine loop (#a88a5a). Crust #d99a48, light top #f0c070, underside #9a5a26. Matte bread and cloth (roughness 0.85).',
    mock: 'a cute small oval bread roll wrapped in a cream cloth with both crusty ends showing, tied with twine' },
  { name: 'waterskin', id: 'items/consumables/waterskin', base: 'assets/canteen.ts', tris: 4000,
    size: '0.2 m wide, 0.26 m tall, lying on its side on y = 0, spout toward +X, front toward +Z',
    recipe: 'Copy the base with cp for its leather material and strap; rebuild the body as described.',
    desc: 'A waterskin: a soft bulging leather bag shaped like a rounded teardrop (tan leather #b07a48, shadow #7a4e2a, roughness 0.8), a dark stitched seam along one edge, a short wooden spout with a cork at the narrow end, and a thin leather strap looped through two small rings.',
    mock: 'a cute plump tan leather waterskin bag with a dark stitched seam, a small wooden spout with a cork, a thin leather strap' },
  { name: 'coin-purse', id: 'items/quest-and-treasure/coin-purse', base: 'assets/belt-pouch.ts', tris: 4000,
    size: '0.16 m wide, 0.15 m tall, standing on y = 0, front toward +Z',
    recipe: 'Copy the base with cp for its leather material; rebuild the body as described.',
    desc: 'A coin purse: a plump round leather pouch (brown #8a5a35, shadow #5c3a22, roughness 0.8) gathered at the top by a drawstring, the gathered neck flaring into a short ruffle, a twine drawstring (#c9a878) with two knotted ends hanging down, and three gold coins (#f2c14e, metalness 1) spilling from the mouth.',
    mock: 'a cute plump brown leather coin purse gathered with a drawstring, three gold coins spilling from its open top' },
];

function brief(it) {
  const k = it.kind ?? it;
  return `# ${it.name} (${it.id}) -> assets/${it.name}.ts

${it.desc}

Size: ${k.size}.
Mockup: docs/item-mockups/${it.name}-mock.jpg (set \`reference\` to that path). Match its idea and colors, not every detail.
Base file: ${k.base}. Read it first. ${k.recipe}

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under ${k.tris.toLocaleString('en')} triangles; \`detail\` 0.0035 to 0.005. No \`warning:\` lines. Set \`FORGE_WORKERS=2\` on every forge command. Iterate with \`./forge render ${it.name} --fast\`, then run \`./forge all ${it.name}\` once. Never commit. Only create or edit assets/${it.name}.ts.
`;
}

const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const list = names.length ? ITEMS.filter((it) => names.includes(it.name)) : ITEMS;
mkdirSync(`${root}bench/sonnet/briefs`, { recursive: true });
for (const it of list) writeFileSync(`${root}bench/sonnet/briefs/${it.name}.md`, brief(it));
console.log(`wrote ${list.length} briefs`);

if (process.argv.includes('--mockups')) {
  mkdirSync(`${root}docs/item-mockups`, { recursive: true });
  for (const it of list) {
    const out = `${root}docs/item-mockups/${it.name}-mock.jpg`;
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
