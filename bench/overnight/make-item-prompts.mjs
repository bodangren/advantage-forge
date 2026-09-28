// Writes bench/overnight/prompts/<name>.prompt.md for the P0 props, equipment, and items, and
// (with --mockups) one mmx mockup per item in bench/overnight/refs/items/<name>-mock.jpg.
//   node bench/overnight/make-item-prompts.mjs [--mockups]
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const here = new URL('.', import.meta.url).pathname;
const IRON = 'iron #4a4f55, shadow #363a3f, highlight #a8acb1 (roughness 0.5, metalness 0.7)';
const WALNUT = 'dark walnut #6b4226 / #54331d';
const OAK = 'honey oak #b5814a, warm brown #8a5a35, pale cut wood #c9a06a';

export const ITEMS = [
  {
    name: 'wood-door', id: 'architecture/building-parts/wood-door', tris: 6000,
    desc: `A standalone wooden door with its frame: the building part that fills the 0.85 m x 1.2 m doorway of the 2 m plaster and timber wall tiles (see assets/plaster-wall-door.ts for the opening and palette). A chunky frame about 0.97 m wide, 1.28 m tall, 0.14 m deep in ${WALNUT}; inside it a closed door of vertical planks (${OAK}) with shallow plank grooves, two black iron strap hinges on the left, a ring handle on the right, and a Z brace on the back face. Stands on y = 0 with the front face toward +Z, centred on x = 0.`,
    mock: 'a single rectangular wooden cottage door in a thick dark brown wooden frame (no stone), vertical honey-colored planks, black iron strap hinges, iron ring handle',
  },
  {
    name: 'chest', id: 'props/containers/chest', tris: 6000,
    desc: `A plain wooden storage chest (not the gold treasure chest): about 0.7 m wide, 0.45 m deep, 0.45 m tall with a gently domed lid. Honey-oak planks (${OAK}) with ${WALNUT} edge battens, ${IRON} corner caps, two iron bands over the lid, and a hasp with a small padlock on the front. Stands on y = 0, front toward +Z.`,
    mock: 'a plain wooden storage chest with iron corner caps, two iron bands and a small padlock, slightly domed lid',
  },
  {
    name: 'torch', id: 'props/furniture/torch', tris: 4000,
    desc: `A standing torch for paths, camps, and village edges: a 1.3 m ${WALNUT} pole planted in a small mound of earth and three fist-sized stones at y = 0, an ${IRON.split(' (')[0]} cup at the top holding a pitch-soaked cloth wrap, and a bright flame. The flame is an emissive body (#ff9a3c core, #ffd66b tips, emissiveIntensity 2 to 3), shaped as a chunky teardrop with two or three licks. Never bake brightness into plain paint.`,
    mock: 'a standing wooden torch pole planted in a small mound of stones, iron cup on top with a bright orange flame',
  },
  {
    name: 'backpack', id: 'equipment/accessories/backpack', tris: 7000,
    desc: `An adventurer's backpack standing upright on its base: about 0.42 m wide, 0.5 m tall, 0.26 m deep. A rounded canvas body in burlap tan #c8a86b, a leather flap and trim in #8a5a35 with two buckled straps (iron buckles), a rolled red-brown blanket (#9a4a3a) strapped on top, a small side pouch, and two padded shoulder straps on the back (-Z). Front toward +Z.`,
    mock: 'a cute adventurer backpack, tan canvas body, brown leather flap with buckled straps, rolled red blanket strapped on top, side pouch',
  },
  {
    name: 'iron-helmet', id: 'equipment/armor/iron-helmet', tris: 6000,
    desc: `An iron helmet sized for a chibi hero's big head: about 0.36 m wide, 0.32 m tall, 0.38 m deep, resting on its rim at y = 0. A round dome skull cap (${IRON}), a raised brow band with rivets, a nasal guard, and two short cheek guards. Brighter worn highlights on the crown. Front toward +Z. Keep reflections calm: very small or no displacement on the metal.`,
    mock: 'an empty iron helmet by itself with no head and no face inside, round dome, riveted brow band, nasal guard, short cheek guards, resting on a table',
  },
  {
    name: 'leather-armor', id: 'equipment/armor/leather-armor', tris: 8000,
    desc: `A leather cuirass shown on a simple wooden armor stand, as in a shop: the stand is a ${WALNUT} T-post on a cross foot at y = 0, total height about 0.95 m. The armor is a chibi-proportioned vest about 0.5 m wide and 0.42 m tall: brown leather #8a5a35 with darker stitched panels #5c3a22, rounded shoulder pauldrons, two buckled side straps (iron buckles), and a belt. Front toward +Z.`,
    mock: 'a brown leather armor vest with shoulder pauldrons and buckled straps displayed on a wooden armor stand',
  },
  {
    name: 'round-shield', id: 'equipment/armor/round-shield', tris: 6000,
    desc: `A round wooden shield standing on its rim at y = 0, face toward +Z: 0.6 m diameter, 0.08 m thick. Radial honey-oak planks (${OAK}), a riveted iron rim band and a domed iron boss in the centre (${IRON}), a painted blue ring (#2f6aa8) between boss and rim, and a leather grip on the back.`,
    mock: 'a round wooden shield with an iron rim, a domed iron boss in the center and a painted blue ring',
  },
  {
    name: 'staff', id: 'equipment/magic-weapons/staff', tris: 6000,
    desc: `A wizard's staff standing upright on its foot at y = 0: 1.2 m tall. A gnarled ${WALNUT} shaft with a leather grip wrap at hand height and an iron ferrule at the foot; the top splits into three curling tines that cradle a glowing crystal orb about 0.12 m wide. The orb is an emissive body (#6ad0ff, emissiveIntensity 2) with a slightly see-through outer shell.`,
    mock: 'a gnarled wooden wizard staff with curled top holding a glowing blue crystal orb',
  },
  {
    name: 'long-sword', id: 'equipment/melee-weapons/long-sword', tris: 5000,
    desc: `A plain steel longsword, 1.0 m long, standing upright with the point up and the pommel at y = 0 (the same pose as assets/knight-sword.ts, which is the knight's fancy gold version; this one is the common shop sword). Steel blade #c8ccd2 with a fuller groove, a straight iron crossguard (${IRON}), a brown leather grip #6e4526 with wrap lines, and a round iron pommel. Flat side toward +Z.`,
    mock: 'a plain steel longsword with straight iron crossguard, brown leather grip and round pommel, standing upright',
  },
  {
    name: 'shortbow', id: 'equipment/ranged-weapons/shortbow', tris: 5000,
    desc: `A shortbow standing upright on its lower tip at y = 0: 0.9 m tall, the bow curving toward +Z. Two smoothly curved ${WALNUT} limbs with pale horn tips, a leather grip wrap in the middle (#8a5a35), and a thin, taut pale string (#e8dcc0) from tip to tip on the -Z side.`,
    mock: 'a simple wooden shortbow standing upright, one smooth D-shaped curve of dark wood, pale horn tips, leather grip wrap in the middle, one straight taut string',
  },
  {
    name: 'health-potion', id: 'items/consumables/health-potion', tris: 4000,
    desc: `A health potion: a round-bottomed glass flask 0.18 m tall on a flat base at y = 0, bright red liquid (#e0344a, faint emissive glow, intensity 0.4) filling two thirds of the bulb, a see-through glass shell (opacity about 0.35) around it, a cork stopper (#b08a5a), and a twine tie at the neck.`,
    mock: 'a round glass potion flask filled with glowing red liquid, cork stopper, twine tied at the neck',
  },
  {
    name: 'gold-coin', id: 'items/quest-and-treasure/gold-coin', tris: 3000,
    desc: `A single chunky gold coin standing on its edge at y = 0 with its face toward +Z: 0.12 m across, 0.022 m thick. Gold #f2c14e (metalness 1, roughness 0.3) with a raised rim and a simple raised five-point star on both faces. Very chunky and readable at 128 px.`,
    mock: 'a single chunky gold coin standing on its edge with a raised rim and a raised star emblem',
  },
  {
    name: 'key-iron', id: 'items/quest-and-treasure/key-iron', tris: 3000,
    desc: `An old iron key lying flat on the ground at y = 0: 0.24 m long, the round ring bow toward -X and the toothed bit toward +X. ${IRON}, a chunky round bow with a hole, a round shaft with two collars, and a two-tooth bit. Slightly oversized chunky forms so it reads at 128 px from above.`,
    mock: 'an old chunky iron key with a round ring bow, collared shaft and toothed bit, lying flat',
  },
];

function prompt(it) {
  return `You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset \`${it.name}\` (catalog id \`${it.id}\`) as \`assets/${it.name}.ts\`.

Description: ${it.desc}

Style anchors. Reference images are in \`reference/\`:
- \`reference/${it.name}-mock.jpg\`: a concept mockup of this asset. Match its idea and colors, not every detail.
- \`reference/chibi-quest-heroes.png\`: the heroes of the same game. Gear must look like it belongs to them.
- \`reference/chibi-quest.png\`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at \`.claude/skills/forge-assets/SKILL.md\`, with \`references/props.md\` and \`references/materials-and-color.md\`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset \`reference\` field to \`reference/${it.name}-mock.jpg\`.
- Only create or edit \`assets/${it.name}.ts\`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: \`./forge render ${it.name} --fast\` writes \`out/${it.name}/render.png\`; look at it, then run \`./forge inspect ${it.name} --fast\`.
- Finish with \`./forge all ${it.name}\` and make sure the build prints no \`warning:\` lines.
- Keep the whole asset under ${it.tris.toLocaleString('en')} triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
`;
}

mkdirSync(`${here}prompts`, { recursive: true });
for (const it of ITEMS) writeFileSync(`${here}prompts/${it.name}.prompt.md`, prompt(it));
console.log(`wrote ${ITEMS.length} prompts`);

if (process.argv.includes('--mockups')) {
  for (const it of ITEMS) {
    const out = `${here}refs/items/${it.name}-mock.jpg`;
    if (existsSync(out)) continue;
    const p = `Cute chunky stylized 3D game asset for a chibi fantasy RPG: ${it.mock}. Single object centered, three-quarter view, plain light gray studio background, soft studio lighting, rounded soft bevels, cheerful saturated colors, matte clay toy look, no text, no people.`;
    try {
      execFileSync('mmx', ['image', 'generate', '--prompt', p, '--aspect-ratio', '1:1', '--out', out, '--quiet'], { stdio: 'inherit', timeout: 180000 });
      console.log(`mockup ${it.name}: ${existsSync(out) ? 'ok' : 'MISSING'}`);
    } catch (e) {
      console.log(`mockup ${it.name}: FAILED ${e.message.slice(0, 120)}`);
    }
  }
}
