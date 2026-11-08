// Build the unit 2 element map, the row table, and the new element specs.
// Usage: node measure/runs/asset_storytime_l2_unit2_prep_20261108/build-maps.mjs
// Inputs are read only. It writes docs/storytime/l2-unit2/**.
// No network. No paid call.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const REPO = process.cwd();
const WB = '/home/daniebo/Desktop/Workbooks';
const OUT = join(REPO, 'docs/storytime/l2-unit2');
const pictures = JSON.parse(readFileSync(join(WB, 'content/storytime/drafts/l2/print/pictures-u2.json'), 'utf8'));
const cards = JSON.parse(readFileSync(join(WB, 'content/storytime/drafts/l2/print/card-pictures-u2.json'), 'utf8'));
const cast = JSON.parse(readFileSync(join(REPO, 'docs/storytime/l2-unit1/judge/cast.json'), 'utf8'));
const castByFile = new Map();
for (const c of cast.cast) castByFile.set(c.source, c);

// ---- element table -------------------------------------------------------
// source: forge | unit1 | new | text
const E = {};
function forge(id, asset, look, view = 'three-quarter.png') {
  E[id] = { id, kind: 'object', source: 'forge', path: `out/${asset}/views/${view}`, asset, look };
}
function unit1(id, kind, file, look, lineShapes) {
  E[id] = { id, kind, source: 'unit1', path: `out/storytime/l2/unit1/${file}`, look, lineShapes };
}
// The unit 1 element style sentences, word for word, from
// docs/storytime/l2-unit1/w07/muse-elements/set-tom-living-room-empty.json.
const ELEMENT_STYLE = `Make one element sheet picture. Style: a smooth, clean, bright, soft, round 3D render look for a children's book, with simple friendly shapes and even colors, no outlines, no scratches or stains.`;
function fresh(id, kind, week, look, lineShapes) {
  const sheet = `${id}-m1-color.png`;
  E[id] = {
    id, kind, source: 'new', week,
    path: `out/storytime/l2/unit2/w${String(week).padStart(2, '0')}/muse/elements/${sheet}`,
    spec: `docs/storytime/l2-unit2/w${String(week).padStart(2, '0')}/muse-elements/${id}.json`,
    look, lineShapes,
  };
}
function text(id, look) { E[id] = { id, kind: 'object', source: 'text', look }; }

// Forge renders (D5 a). Existing views only.
forge('dog', 'dog', 'ONE small friendly dog with short brown fur, floppy ears, and a red collar, three times (front, three-quarter, sitting)');
forge('cat', 'cat', 'ONE small gray cat with a round head, pointed ears, and a long curled tail, three times (front, three-quarter, sitting)');
forge('fish', 'fish', 'ONE small orange fish with a round body, a fan tail, and one round eye, three times (side, three-quarter, top)', 'side.png');
forge('bed', 'bed', 'ONE small child\'s bed with a wooden frame, a white pillow, and a blue blanket');
forge('hen', 'chicken', 'ONE small brown hen with a red comb, a red wattle, a small beak, and two orange legs, three times (side, three-quarter, front)');
forge('rooster', 'rooster', 'ONE rooster with a red comb, a brown body, and a long dark-green tail');
forge('horse', 'horse', 'ONE white horse with a long mane and a long tail, three times (side, three-quarter, front)');
forge('goat', 'goat', 'ONE small white goat with short horns and a small beard');
forge('pot', 'pot', 'ONE round clay flower pot with a wide rim, three times (front, three-quarter, top)');
forge('chair', 'chair', 'ONE small wooden chair with four legs and a low back');
forge('window', 'window', 'ONE window with white frames and a blue sky behind it');
forge('door', 'door', 'ONE green door with a round handle, closed');
forge('bread', 'bread', 'ONE slice of brown bread with a soft crust');
forge('bowl', 'bowl', 'ONE white bowl with a round body and a wide rim');
forge('barn', 'barn', 'ONE small red barn with a white door and a white trim');
forge('fence', 'fence', 'ONE low wooden fence with three rails and two posts');
forge('table', 'table', 'ONE low wooden table with a plain top and four legs');
forge('stool', 'stool', 'ONE small wooden stool with four legs');
forge('mug', 'mug', 'ONE mug with a round body and a handle');
forge('drum', 'drum', 'ONE toy drum with a red body, a white top, and two drumsticks');
forge('frog', 'frog', 'ONE small green frog with a round body and two big round eyes');
forge('bus', 'storytime-school-bus', 'ONE yellow school bus with black wheels and a row of windows');
forge('cup', 'storytime-child-cup', 'ONE small child\'s cup with two handles and a white body');
forge('low-table', 'storytime-low-table', 'ONE long low wooden table with a plain top and four short legs');
forge('green-door', 'storytime-green-door', 'ONE green door with a round handle, closed');
forge('book', 'storytime-picture-book', 'ONE open picture book with a plain cover and blank pages');
forge('bag', 'storytime-school-bag', 'ONE school bag with a flap, a handle, and two straps');
forge('crayons', 'storytime-crayon-box', 'ONE open box of crayons in several colors');
forge('sunhat', 'storytime-sun-hat', 'ONE big straw sun hat with a wide brim and a ribbon');
forge('blocks', 'storytime-block-box', 'ONE open wooden box with a few colored blocks');
forge('plate', 'plate', 'ONE round white plate with a plain rim');

// Unit 1 Muse element files (D5 b).
unit1('milk', 'object', 'w04/muse/elements/prop-milk-sheet-m1-color.png', 'ONE glass of white milk, three times (front, three-quarter, side)');
unit1('cake', 'object', 'w04/muse/elements/prop-cake-sheet-m1-color.png', 'ONE small pink cake with white icing, three times (front, three-quarter, side)');
unit1('duck', 'object', 'w02/muse/elements/prop-ducks-sheet-m1-color.png', 'ONE small yellow rubber duck, three times (front, three-quarter, side)');
unit1('white-horse', 'object', 'w06/muse/elements/prop-white-horse-sheet-m1-color.png', 'ONE white horse with a long mane, three times (side, three-quarter, front)');
unit1('sun', 'object', 'w02/muse/elements/prop-sun-sheet-m1-color.png', 'ONE bright yellow sun with short rays, three times (front, three-quarter, side)');
unit1('pen', 'object', 'w07/muse/elements/prop-pen-sheet-m1-color.png', 'ONE blue ballpoint pen, three times (front, three-quarter, side)');
unit1('socks', 'object', 'w05/muse/elements/prop-sock-sheet-m2-color.png', 'ONE pair of big white socks with red stripes, three times (front, three-quarter, side)');
unit1('pans', 'object', 'w03/muse/elements/prop-pans-sheet-m1-color.png', 'ONE baking pan with a flat base and a small rim, three times (front, three-quarter, side)');
unit1('kites', 'object', 'w02/muse/elements/prop-kites-sheet-m1-color.png', 'ONE red kite with a tail and a bow, three times (front, three-quarter, side)');
unit1('balls', 'object', 'w02/muse/elements/prop-balls-sheet-m1-color.png', 'ONE red ball with a smooth round surface, three times (front, three-quarter, side)');
unit1('doll', 'object', 'w04/muse/elements/prop-doll-pam-sheet-m1-color.png', 'the small rag doll Pam with yellow yarn hair and a red dress, three times (front, three-quarter, lying flat)');
unit1('pencil', 'object', 'w03/muse/elements/prop-pencil-sheet-m1-color.png', 'ONE yellow pencil with a pink eraser end, three times (front, three-quarter, side)');
unit1('silver-pot', 'object', 'w07/muse/elements/prop-silver-pot-sheet-m1-color.png', 'ONE big silver pot with a lid, three times (front, three-quarter, side)');
unit1('top', 'object', 'w07/muse/elements/prop-top-sheet-m2-color.png', 'ONE small red spinning top with a yellow stripe, three times (upright, tilted, on its side)');

// Unit 1 sets (D5 b), highest m<n>.
unit1('set-tom-living-room', 'set', 'w07/muse/elements/set-tom-living-room-empty-m1-color.png',
  'bright living room of Tom: warm cream walls, a light wooden floor, ONE green sofa with two cushions and four short wooden legs (a clear gap of floor under the sofa) at the left, ONE window with cream curtains in the middle of the back wall, ONE small plain brown rug on the floor under the window, ONE open wooden toy box with a few blocks and a yellow rubber duck at the right, ONE soft round blue mat on the floor in the middle, and ONE low wooden table with ONE big silver pot with a lid in the right foreground',
  'the floor line, the wall line, the window as one closed rectangle with each curtain as one closed shape, the sofa as one closed shape with each cushion and each leg as closed shapes, the brown rug and the blue mat as closed ovals, the toy box as one closed box shape with a few big closed toy shapes, the low table as one closed shape with its legs, and the pot as closed shapes: the body, the lid, the knob, and each handle');
unit1('set-nan-living-room', 'set', 'w04/muse/elements/set-nan-living-room-empty-m1-color.png',
  'empty cozy living room of Nan: warm cream walls, a light wooden floor, a blue sofa with one cushion and a folded blanket on its arm, a big round soft rug, a wooden toy box with a few toys at the right, and a small window at the left',
  'the floor line, the wall line, the window as one closed rectangle, the sofa as one closed shape with its cushion as one closed shape, the rug as one closed oval, and the toy box as one closed box shape with its lid');
unit1('set-playground', 'set', 'w02/muse/elements/set-playground-empty-m3-color.png',
  'empty sunny kindergarten playground: green grass, a low red climbing frame, a white line on the ground, and a blue sky',
  'the grass line, the sky line, the climbing frame as a few closed bar shapes, and the white ground line as one long closed shape');
unit1('set-book-corner', 'set', 'w06/muse/elements/set-book-corner-empty-m2-color.png',
  'empty book corner of the kindergarten classroom: warm cream walls, a low wooden shelf with a few big picture books, a soft round mat, and a small window',
  'the floor line, the wall line, the window as one closed rectangle, the shelf as one closed box shape with a few big closed book shapes, and the mat as one closed oval');

// New Muse element sheets (D5 c). The paid run makes them.
fresh('set-classroom-lunch-table', 'set', 9,
  'bright kindergarten classroom with a long low lunch table: warm cream walls, a light wooden floor, ONE long low wooden lunch table with a plain top and four short legs in the middle, ONE small wooden chair at each end of the table, ONE big window with cream curtains on the back wall, ONE low wooden shelf with a few white plates and cups at the right, and a clear empty floor around the table',
  'the floor line, the wall line, the window as one closed rectangle with each curtain as one closed shape, the lunch table as one closed shape with its legs, each chair as one closed shape, and the shelf as one closed shape with a few big closed plate and cup shapes');
fresh('set-classroom-dress-up-corner', 'set', 10,
  'dress-up corner of the kindergarten classroom: warm cream walls, a light wooden floor, ONE big open wooden dress-up box with a raised lid and a few folded clothes inside at the right, ONE long mirror with a plain wooden frame on the left wall, ONE low bench under the mirror, and a clear empty floor in the middle',
  'the floor line, the wall line, the dress-up box as one closed box shape with its lid as one closed shape and a few big folded clothes as closed shapes, the mirror as one closed rounded rectangle with its frame, and the bench as one closed shape with its legs');
fresh('set-tom-kitchen', 'set', 10,
  'bright kitchen of Tom: warm cream walls, a light tiled floor, ONE low wooden table with a plain top in the middle, ONE green door at the right, ONE soft round green mat on the floor by the door, and ONE low wooden counter with a few plain pans at the left',
  'the floor line, the wall line, the low table as one closed shape with its legs, the door as one closed rectangle with its frame, the green mat as one closed oval, and the counter as one closed shape with a few big closed pan shapes');
fresh('set-nan-bedroom', 'set', 11,
  'small cozy bedroom of Nan: warm cream walls, a light wooden floor, ONE small bed with a white pillow and a blue blanket at the right, ONE low wooden bedside table at the left of the bed, ONE small window with cream curtains on the back wall, and a soft round rug on the floor',
  'the floor line, the wall line, the bed as one closed shape with the pillow and the blanket as closed shapes, the bedside table as one closed shape with its legs, the window as one closed rectangle with each curtain as one closed shape, and the rug as one closed oval');
fresh('set-classroom-tables', 'set', 12,
  'bright kindergarten classroom with low tables: warm cream walls, a light wooden floor, THREE low wooden tables with plain tops in the middle, ONE small wooden chair at each table, ONE long wall with big plain animal pictures in frames on the back wall, and ONE low shelf with a few books at the right',
  'the floor line, the wall line, each low table as one closed shape with its legs, each chair as one closed shape, each wall picture as one closed rectangle with its frame, and the shelf as one closed shape with a few big closed book shapes');
fresh('set-farmyard', 'set', 12,
  'sunny farmyard of Grandma and Grandpa: green grass, a small red barn with a white door at the right, ONE low wooden fence along the back, ONE small straw mat on the ground at the left, and a blue sky',
  'the grass line, the sky line, the barn as one closed shape with its door, the fence as a few closed rail shapes, and the straw mat as one closed rectangle');
fresh('set-tom-garden', 'set', 13,
  'small sunny garden of Tom: green grass, ONE low wooden fence along the back, ONE row of red flowers along the fence, ONE small tree at the right, and a blue sky',
  'the grass line, the sky line, the fence as a few closed rail shapes, each flower as one closed round shape with a stem, and the tree as one closed crown shape with its trunk');
fresh('set-nan-front-garden', 'set', 14,
  'small front garden of Nan: green grass, ONE low white fence along the back, ONE small tree at the right, ONE narrow path of flat stones in the middle, and a blue sky',
  'the grass line, the sky line, the fence as a few closed rail shapes, the tree as one closed crown shape with its trunk, and each path stone as one closed oval');
fresh('set-town-street-bridge', 'set', 15,
  'quiet street of a small town: a wide light-gray footpath, ONE low stone bridge over a calm blue river, a few plain houses with doors and windows along the street, ONE row of small green trees, and a blue sky',
  'the footpath line, the river line, the bridge as one closed arch shape with its rails, each house as one closed shape with its door and windows, and each tree as one closed crown shape with its trunk');

// Text-only simple objects (D5 d).
for (const [id, look] of Object.entries({
  'text-mop': 'ONE mop with a long wooden handle and a gray mop head',
  'text-mat': 'ONE soft round blue mat on the floor',
  'text-napkin': 'ONE white paper napkin',
  'text-spoon': 'ONE small metal spoon',
  'text-egg': 'ONE white boiled egg, peeled',
  'text-banana': 'ONE yellow banana',
  'text-rice': 'ONE mound of white rice',
  'text-juice': 'ONE glass of orange juice',
  'text-car': 'ONE small red car',
  'text-bike': 'ONE red bicycle with a front basket',
  'text-truck': 'ONE small blue truck',
  'text-train': 'ONE small green train',
  'text-boat': 'ONE small rowing boat',
  'text-plane': 'ONE small white airplane',
  'text-umbrella': 'ONE yellow umbrella, open',
  'text-blanket': 'ONE big soft blanket',
  'text-wool-hat': 'ONE small red wool hat',
  'text-scarf': 'ONE blue scarf',
  'text-fan': 'ONE small white electric fan with a round cage',
  'text-cloud': 'ONE big gray cloud',
  'text-rain': 'blue raindrops that fall from a gray cloud',
  'text-tree': 'ONE small tree with a round green crown',
  'text-flower': 'ONE red flower with a green stem',
  'text-tag': 'ONE small round gold tag',
  'text-gingerbread': 'ONE small tan gingerbread man with white icing eyes and an icing smile',
  'text-guitar': 'ONE wooden guitar with six strings',
  'text-envelope': 'ONE closed white paper envelope with a red heart sticker on the flap',
  'text-pad': 'ONE small notepad of plain yellow paper with a red top edge',
  'text-eraser': 'ONE small pink eraser',
  'text-ruler': 'ONE wooden ruler with plain line marks',
  'text-hippo': 'ONE gray hippo with a big round body and small ears',
  'text-dinosaur': 'ONE friendly green toy dinosaur with a long neck and a long tail',
  'text-helicopter': 'ONE small orange helicopter with a round window and long rotor blades',
  'text-mirror': 'ONE long mirror with a plain wooden frame',
  'text-dressup-box': 'ONE big open wooden dress-up box with a raised lid',
  'text-toy-box': 'ONE open wooden toy box with a few blocks',
  'text-armchair': 'ONE big soft armchair',
  'text-sofa': 'ONE blue sofa with one cushion',
  'text-pegs': 'ONE row of wooden coat pegs on the wall',
  'text-clothes': 'a few folded dress-up clothes',
})) text(id, look);

for (const [id, el] of Object.entries(E)) {
  if (/playground|farmyard|garden|street|park|meadow/.test(id)) el.outdoor = true;
}

// ---- set per book --------------------------------------------------------
// Scene key: w<nn>-<1 read-along | 2 decodable>.
const SET = {
  'w09-1': 'set-classroom-lunch-table',
  'w09-2': 'set-tom-living-room',
  'w10-1': 'set-classroom-dress-up-corner',
  'w10-2': 'set-tom-kitchen',
  'w11-1': 'set-nan-living-room',
  'w11-2': 'set-tom-living-room',
  'w12-1': 'set-classroom-tables',
  'w12-2': 'set-farmyard',
  'w13-1': 'set-playground',
  'w13-2': 'set-tom-garden',
  'w14-1': 'set-nan-front-garden',
  'w14-2': 'set-tom-living-room',
  'w15-1': 'set-town-street-bridge',
  'w15-2': 'set-tom-living-room',
};
// The decodable book starts at the row whose id contains the book marker.
const SECOND_BOOK = {
  9: 'dad-has-a-mop', 10: 'dad-has-a-pan', 11: 'tom-set-up-a-den', 12: 'dad-has-a-hat',
  13: 'tom-has-a-pot', 14: 'dad-is-hot', 15: 'pip-has-a-tag',
};
const ROOM_OVERRIDE = {
  'l2-w11-story-page-where-is-ben-under-the-bed': 'set-nan-bedroom',
  'l2-w11-story-page-where-is-mia-in-the-bed': 'set-nan-bedroom',
  'l2-w11-story-page-where-is-lily-on-the-chair': 'set-nan-living-room',
  'l2-w15-story-page-pip-got-his-tag': 'set-tom-living-room',
};

// ---- cast ----------------------------------------------------------------
const NAMES = [
  ['Teacher Kim', 'teacher-kim'], ['Nan', 'nan'], ['Sam', 'sam'], ['May', 'may'],
  ['Ben', 'ben'], ['Mia', 'mia'], ['Pat', 'pat'], ['Lily', 'lily'], ['Tom', 'tom'],
  ['Dad', 'dad'], ['Mom', 'mom'], ['Grandma', 'grandma'], ['Grandpa', 'grandpa'],
  ['Pip', 'pip'],
];
// A possessive place name is not a cast mention: "Tom's home", "Grandma and Grandpa's farm".
function withoutPossessives(prompt) {
  const names = NAMES.map(([n]) => n.replace(/ /g, '\\s')).join('|');
  return prompt
    .replace(new RegExp(`\\b(?:${names})(?: and (?:${names}))?'s\\b`, 'g'), 'the')
    .replace(new RegExp(`\\b(?:${names})'(?=\\s)`, 'g'), 'the');
}
function castOf(prompt) {
  const clean = withoutPossessives(prompt);
  const hits = [];
  for (const [name, key] of NAMES) {
    const re = new RegExp(`\\b${name.replace(/ /g, '\\s')}\\b`);
    if (re.test(clean)) hits.push({ name, key, at: clean.search(re) });
  }
  return hits.sort((a, b) => a.at - b.at).map(({ name, key }) => ({ name, key }));
}

// ---- props ---------------------------------------------------------------
const PROP = [
  [/\bmop\b/, 'text-mop'], [/\bmat\b/, 'text-mat'], [/\bnapkin\b/, 'text-napkin'],
  [/\bspoon\b/, 'text-spoon'], [/\bboiled eggs?\b|\beggs?\b/, 'text-egg'],
  [/\bbananas?\b/, 'text-banana'], [/\brice\b/, 'text-rice'], [/\bjuice\b/, 'text-juice'],
  [/\bmilk\b/, 'milk'], [/\bcake\b/, 'cake'], [/\bduck\b/, 'duck'], [/\bhorse\b/, 'white-horse'],
  [/\bsun\b/, 'sun'], [/\bpen\b/, 'pen'], [/\bsocks?\b/, 'socks'], [/\bpans?\b/, 'pans'],
  [/\bkites?\b/, 'kites'], [/\bballs?\b/, 'balls'], [/\bdoll\b/, 'doll'], [/\bpencils?\b/, 'pencil'],
  [/\bsilver pot\b/, 'silver-pot'], [/\btop\b/, 'top'], [/\bpot\b/, 'pot'],
  [/\bbowl\b/, 'bowl'], [/\bbread\b/, 'bread'], [/\bplate\b/, 'plate'], [/\bglass\b|\bcup\b/, 'cup'],
  [/\bbook\b/, 'book'], [/\bbag\b/, 'bag'], [/\bcrayons?\b/, 'crayons'], [/\beraser\b/, 'text-eraser'],
  [/\bruler\b/, 'text-ruler'], [/\bchair\b/, 'chair'], [/\bwindow\b/, 'window'], [/\bdoor\b/, 'green-door'],
  [/\bbed\b/, 'bed'], [/\bbarn\b/, 'barn'], [/\bfence\b/, 'fence'], [/\bhen\b/, 'hen'],
  [/\bhorse\b/, 'horse'], [/\bgoat\b/, 'goat'], [/\bbus\b/, 'bus'], [/\bcar\b/, 'text-car'],
  [/\bbike\b/, 'text-bike'], [/\btruck\b/, 'text-truck'], [/\btrain\b/, 'text-train'],
  [/\bboat\b/, 'text-boat'], [/\bplane\b/, 'text-plane'], [/\bumbrella\b/, 'text-umbrella'],
  [/\bblanket\b/, 'text-blanket'], [/\bwool hats?\b/, 'text-wool-hat'], [/\bscarf\b/, 'text-scarf'],
  [/\bfans?\b/, 'text-fan'], [/\bclouds?\b/, 'text-cloud'], [/\brain\b/, 'text-rain'],
  [/\btree\b/, 'text-tree'], [/\bflowers?\b/, 'text-flower'], [/\btag\b/, 'text-tag'],
  [/\bgingerbread man\b|\btan man\b/, 'text-gingerbread'], [/\bguitar\b/, 'text-guitar'],
  [/\benvelope\b/, 'text-envelope'], [/\bnotepad\b|\bpad\b/, 'text-pad'],
  [/\bhippo\b/, 'text-hippo'], [/\bdinosaur\b/, 'text-dinosaur'],
  [/\bhelicopter\b/, 'text-helicopter'], [/\bmirror\b/, 'text-mirror'],
  [/\bdress-up box\b/, 'text-dressup-box'], [/\btoy box\b/, 'text-toy-box'],
  [/\barmchair\b/, 'text-armchair'], [/\bsofa\b/, 'text-sofa'], [/\bcoat pegs?\b|\bpeg\b/, 'text-pegs'],
  [/\bhats?\b/, 'sunhat'], [/\bdrum\b/, 'drum'], [/\bfrog\b/, 'frog'], [/\bstool\b/, 'stool'],
  [/\bmug\b/, 'mug'], [/\btable\b/, 'low-table'], [/\bblocks?\b/, 'blocks'],
  [/\bcrayon box\b/, 'crayons'], [/\bschool bag\b/, 'bag'],
];
function propsOf(prompt, objectCounts) {
  const found = [];
  for (const [re, id] of PROP) {
    if (re.test(prompt)) found.push({ word: re.source, element: id });
  }
  for (const [word, n] of Object.entries(objectCounts || {})) {
    for (const [re, id] of PROP) if (new RegExp(`^${word}`).test(re.source.replace(/[\\^$*+?.()|[\]{}]/g, ''))) { /* noop */ }
    if (!found.some((f) => f.word === word) && E[`text-${word}`]) found.push({ word, element: `text-${word}` });
  }
  return found;
}

// ---- strip the cast note tail and the "No letters" sentence --------------
function sceneOf(prompt) {
  let s = prompt.replace(/\s*No letters, words, or numbers anywhere\.?\s*$/i, '').trim();
  for (const [name] of NAMES) {
    const i = s.search(new RegExp(`(^|\\s)${name.replace(/ /g, '\\s')}:\\s`));
    if (i >= 0) s = s.slice(0, i).trim();
  }
  return s;
}

// ---- build rows ----------------------------------------------------------
const cardRows = Array.isArray(cards) ? cards : Object.values(cards);
const cardByKey = new Map();
for (const c of cardRows) {
  const r = pictures.find((p) => p.week === c.week && p.use === 'card' && p.id.endsWith(`-card-${String(c.word).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`));
  if (r) cardByKey.set(r.id, c);
}
const rows = [];
const secondStarted = new Set();
for (const p of pictures) {
  const marker = SECOND_BOOK[p.week];
  if (marker && p.id.includes(marker)) secondStarted.add(p.week);
  const weekBook = secondStarted.has(p.week) ? 2 : 1;
  let set = SET[`w${String(p.week).padStart(2, '0')}-${weekBook}`] || null;
  if (ROOM_OVERRIDE[p.id]) set = ROOM_OVERRIDE[p.id];
  if (p.use === 'check-row' || p.use === 'd4-prompt' || p.use === 'card') set = null;
  const card = cardByKey.get(p.id);
  const scene = card ? sceneOf(card.prompt) : sceneOf(p.prompt);
  const cast = castOf(p.prompt || scene);
  const props = card ? [] : propsOf(scene, p.objectCounts);
  // Drop a prop that the set already draws, and drop a duplicate.
  const setLook = set && E[set] ? E[set].look : '';
  const seen = new Set();
  const kept = [];
  for (const x of props) {
    if (seen.has(x.element)) continue;
    seen.add(x.element);
    const word = x.word.replace(/^\\b|\\b$|\[\^a-z0-9\]/g, '');
    const bare = (x.element.startsWith('text-') ? x.element.slice(5) : x.element).split('-')[0];
    if (setLook && (new RegExp(`\\b${bare}\\b`).test(setLook) || new RegExp(`\\b${word}\\b`).test(setLook))) continue;
    kept.push(x);
  }
  const refs = kept.filter((x) => E[x.element]?.source !== 'text').length;
  // Class C form (R4, R5, R6): a person form for a person word, a body-part form for a part,
  // a text-only object form when no reference picture exists, an object form otherwise.
  let form = p.sizeClass === 'C' ? (refs ? 'object' : 'text-object') : 'scene';
  if (p.use === 'card') form = 'card';
  const castKeys = cast.map((c) => c.key);
  const word = String(p.text).toLowerCase();
  if (p.use === 'check-row' && (word === 'dad' || word === 'girl' || word === 'foot')) {
    form = word === 'foot' ? 'body-part' : 'person-card';
    if (word === 'dad') { castKeys.length = 0; castKeys.push('dad'); }
    else { castKeys.length = 0; castKeys.push('nan'); }
  }
  rows.push({
    id: p.id, week: p.week, use: p.use, sizeClass: p.sizeClass, text: p.text,
    scene, cast: castKeys, set, props: kept.map((x) => x.element), form,
    textOnly: kept.filter((x) => E[x.element]?.source === 'text').map((x) => x.element),
    reuse: null,
  });
}

// ---- D3 reuse: same word, same use ---------------------------------------
import { execFileSync } from 'node:child_process';
const unit1Check = new Map();
try {
  const files = execFileSync('bash', ['-lc',
    "ls -d out/storytime/l2/unit1/w0*/delivery-muse-v*/ 2>/dev/null | sort -V | tail -40"], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  for (const dir of files) {
    const list = execFileSync('bash', ['-lc', `ls ${dir} | grep 'check-row' || true`], { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean);
    for (const f of list) {
      const word = (f.match(/check-row-([a-z0-9-]+?)-(?:v\d+)?\.png$/i) || [])[1];
      if (word) unit1Check.set(word.toLowerCase(), `${dir}${f}`);
    }
  }
} catch { /* no delivery folders */ }
const seenU2 = new Map();
for (const r of rows) {
  if (r.use !== 'check-row') continue;
  const word = String(r.text).toLowerCase();
  if (unit1Check.has(word)) r.reuse = { word, source: unit1Check.get(word), kind: 'unit1-delivery' };
  else if (seenU2.has(word)) r.reuse = { word, source: seenU2.get(word), kind: 'unit2-earlier-row' };
  else seenU2.set(word, `docs/storytime/l2-unit2/w${String(r.week).padStart(2, '0')}/muse/${r.id}.json`);
}

// ---- cast picture sentences from the newest unit 1 specs ----------------
const unit1Specs = [];
try {
  const files = execFileSync('bash', ['-lc',
    "ls docs/storytime/l2-unit1/w0*/muse/*.json docs/storytime/l2-unit1/cards/*.json 2>/dev/null"], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  for (const f of files) {
    try {
      const j = JSON.parse(readFileSync(join(REPO, f), 'utf8'));
      if (!Array.isArray(j.references) || !j.colorPrompt) continue;
      unit1Specs.push({ file: f, week: Number((f.match(/w(\d\d)/) || [])[1] || 0), j });
    } catch { /* skip */ }
  }
} catch { /* none */ }
function segments(cp) {
  const re = /Picture (\d+) (?:shows|is) /g;
  const at = [];
  let m;
  while ((m = re.exec(cp))) at.push({ n: Number(m[1]), i: m.index });
  const out = {};
  for (let k = 0; k < at.length; k++) {
    const end = k + 1 < at.length ? at[k + 1].i : cp.length;
    out[at[k].n] = cp.slice(at[k].i, end).trim();
  }
  return out;
}
function cleanSentence(s) {
  const cut = [' Keep the soft', ' Keep the character', ' The character keeps', ' Draw the same',
    ' Use it as the background', ' The picture:', ' The picture to make', ' Each picture'].reduce((acc, m) => {
    const i = s.indexOf(m);
    return i >= 0 && i < acc ? i : acc;
  }, s.length);
  return s.slice(0, cut)
    .replace('a pending cast sheet: a proposal for Daniel, not yet approved; ', '')
    .replace(/\(; /, '(').replace(/\s+/g, ' ').trim();
}
const castSentences = {};
for (const c of cast.cast) {
  // A usable sentence names the person, not a group of characters.
  const signature = c.note.replace(/^[^:]+:\s*/, '').split(/[,;]/)[0].trim();
  const usable = (s) => {
    const idx = s.j.references.indexOf(c.source);
    if (idx < 0) return null;
    const seg = segments(s.j.colorPrompt)[idx + 1];
    if (!seg) return null;
    if (/left to right|Copy each person exactly/.test(seg)) return null;
    if (!new RegExp(`\\b${c.name.replace(/[-]/g, ' ').split(' ')[0]}\\b`, 'i').test(seg)
      && !seg.includes(signature)) return null;
    return seg;
  };
  const candidates = unit1Specs
    .filter((s) => s.j.references.includes(c.source))
    .sort((a, b) => b.week - a.week || b.file.localeCompare(a.file));
  let chosen = null;
  var ranked = [];
  for (const s of candidates) {
    const seg = usable(s);
    if (!seg) continue;
    const score = seg.includes(signature) ? 2 : 1;
    ranked.push({ s, seg, score });
  }
  ranked.sort((a, b) => b.score - a.score || a.seg.length - b.seg.length);
  if (ranked.length) {
    const { s, seg } = ranked[0];
    chosen = { sentence: cleanSentence(seg).replace(/^Picture \d+ (?:shows|is) /, ''),
      donor: s.file, picture: s.j.references.indexOf(c.source) + 1 };
  }
  if (chosen) castSentences[c.name] = chosen;
  else {
    // Fallback: the unit 1 group sheet names this person. Keep the sentence as unit 1 used it.
    for (const s of candidates) {
      const idx = s.j.references.indexOf(c.source);
      if (idx < 0) continue;
      const seg = segments(s.j.colorPrompt)[idx + 1];
      if (!seg || !seg.includes(c.name)) continue;
      castSentences[c.name] = { sentence: cleanSentence(seg).replace(/^Picture \d+ (?:shows|is) /, ''),
        donor: s.file, picture: idx + 1, group: true, pick: c.name };
      break;
    }
  }
}
// Nan also names the face crop, as in unit 1.
castSentences.nan = castSentences.nan || {};

// ---- write elements.json -------------------------------------------------
const elements = {
  track: 'asset_storytime_l2_unit2_prep_20261108',
  note: 'Element map for the 229 unit 2 rows. Order of sources (D5): forge, unit1, new, text.',
  readOnlyInputs: {
    pictures: '63d415000eca9d6be1a6ad533c12ff81e127cd2c76ffac339697f91b99f754ec',
    brief: 'c1bbb491a35f10b60bea5f43d30d09d5ac3daab39924c2996b25ba1a98b4ef83',
    cast: 'docs/storytime/l2-unit1/judge/cast.json',
  },
  elementSourceOrder: ['forge', 'unit1', 'new', 'text'],
  elements: E,
  sets: SET,
  secondBookMarker: SECOND_BOOK,
  castPeople: Object.fromEntries(cast.cast.map((c) => [c.name, {
    source: c.source, note: c.note, extraFace: c.name === 'nan'
      ? 'out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-face-crop.png' : null,
  }])),
  castSentences,
};
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'elements.json'), JSON.stringify(elements, null, 2) + '\n');

// ---- write rows.json -----------------------------------------------------
const rowsDoc = {
  track: elements.track,
  count: rows.length,
  source: 'pictures-u2.json',
  rows,
};
writeFileSync(join(OUT, 'rows.json'), JSON.stringify(rowsDoc, null, 2) + '\n');

// ---- write the new element specs (D5 c) ---------------------------------
// Style sentences copied word for word from docs/storytime/l2-unit1/w07/muse-elements/set-tom-living-room-empty.json.
const donor = JSON.parse(readFileSync(
  join(REPO, 'docs/storytime/l2-unit1/w07/muse-elements/set-tom-living-room-empty.json'), 'utf8'));
let nSheets = 0;
for (const el of Object.values(E)) {
  if (el.source !== 'new') continue;
  const spec = {
    id: el.id,
    text: '',
    goal: `One empty ${el.look.split(':')[0]} for the unit 2 picture composites.`,
    references: [],
    colorPrompt: `${ELEMENT_STYLE} The picture shows the ${el.outdoor ? 'EMPTY place' : 'EMPTY room'}${el.outdoor ? '' : ''}, with nobody and no animal in it: ${el.look}. The picture is one calm wide scene, camera at a low child eye level. Exactly one clear shape for each object that the text names. No sun, no people, no animals, no extra furniture. Rated G for young children. No text, no letters, no numbers, no labels, no logos, no symbols. No people and no animals unless named.${el.outdoor ? ' The place is empty.' : ''}`,
    linePrompt: `Picture 1 is a 3D-rendered children's book background. Convert picture 1 to line art for a student book: thick, even black lines (about three times a normal outline), simple closed shapes that a 5-year-old can color, on pure white. No shading, no gray, no texture lines, no text. Simplify the background: draw only a few large, simple, closed shapes (${el.lineShapes}). No wood grain lines, no floor plank lines, no wall texture, no hatching, no tick marks, no small details. Every outline is one closed line that never runs into a background line; no loose line ends anywhere. Use few background shapes.`,
    print: 'crop',
    aspect: '4:3',
    outDir: `out/storytime/l2/unit2/w${String(el.week).padStart(2, '0')}/muse/elements`,
    styleDonor: 'docs/storytime/l2-unit1/w07/muse-elements/set-tom-living-room-empty.json',
    status: 'draft for the paid run; not generated',
  };
  const file = join(REPO, el.spec);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(spec, null, 2) + '\n');
  nSheets++;
}
console.log(JSON.stringify({ rows: rows.length, elements: Object.keys(E).length, newSheets: nSheets, castSentences: Object.keys(castSentences), reuse: rows.filter((r) => r.reuse).length }, null, 1));
