// Unit 2 Muse spec maker. No network. No paid call.
// Usage: node scripts/storytime-u2-specs.mjs <pictures-u2.json> <elements.json> <rows.json> <outRoot>
//
// The shared rule text of every prompt is copied word for word from named approved unit 1 specs:
//   story page: docs/storytime/l2-unit1/w07/muse/l2-w07-story-page-run-tom-run.json
//   cover:      docs/storytime/l2-unit1/w07/muse/l2-w07-cover-the-top.json
//   check-row:  docs/storytime/l2-unit1/w07/muse/l2-w07-check-row-bus.json
//   card:       docs/storytime/l2-unit1/cards/l2-w01-card-boy.json
// The cast picture sentence of each person comes from the unit 1 spec named in
// docs/storytime/l2-unit2/elements.json -> castSentences.
// Every person is described by hair and clothes only (D1). No skin color, tone, complexion,
// race, or ethnicity appears in a prompt. FR-4 removes the unit 1 clause "Do not change anyone's
// skin tone, hair, or clothes."; the copy keeps "Do not change anyone's hair or clothes." 
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const [picturesPath, elementsPath, rowsPath, outRoot] = process.argv.slice(2);
if (!picturesPath || !elementsPath || !rowsPath || !outRoot) {
  console.error('usage: node scripts/storytime-u2-specs.mjs <pictures-u2.json> <elements.json> <rows.json> <outRoot>');
  process.exit(2);
}
const REPO = process.cwd();
const read = (p) => JSON.parse(readFileSync(resolve(REPO, p), 'utf8'));
const pictures = read(picturesPath);
const elements = read(elementsPath);
const rowsDoc = read(rowsPath);
const E = elements.elements;
const outRootAbs = resolve(REPO, outRoot);

function block(file, kind) {
  const j = read(file);
  const cp = j.colorPrompt;
  const lp = j.linePrompt;
  if (kind === 'tail') {
    const markers = {
      'check-row': 'The background is plain white',
      card: 'A square card picture on a plain pure white background',
    };
    const f = /check-row/.test(file) ? 'check-row' : 'card';
    const i = cp.indexOf(markers[f]);
    if (i < 0) throw new Error(`tail block not found in ${file}`);
    return cp.slice(i);
  }
  if (kind === 'rule') {
    const from = cp.indexOf('Keep the soft, round, bright 3D render look');
    const to = cp.indexOf('The picture is for young children and is rated G.');
    if (from < 0 || to < 0) throw new Error(`rule block not found in ${file}`);
    return cp.slice(from, to + 'The picture is for young children and is rated G.'.length);
  }
  if (kind === 'count') {
    const s = 'Exactly the characters named here are in the picture, and no other person or animal. A character of the pictures that this description does not name must not appear. Every named character has a clear, whole, friendly face.';
    if (!cp.includes(s)) throw new Error(`count block not found in ${file}`);
    return s;
  }
  if (kind === 'line') return lp;
  throw new Error(kind);
}
const DONOR = {
  'story-page': 'docs/storytime/l2-unit1/w07/muse/l2-w07-story-page-run-tom-run.json',
  cover: 'docs/storytime/l2-unit1/w07/muse/l2-w07-cover-the-top.json',
  'check-row': 'docs/storytime/l2-unit1/w07/muse/l2-w07-check-row-bus.json',
  card: 'docs/storytime/l2-unit1/cards/l2-w01-card-boy.json',
  'd4-prompt': 'docs/storytime/l2-unit1/w07/muse/l2-w07-check-row-bus.json',
};
const RULE = {};
const COUNT = {};
const LINE = {};
const LINE_FACE = block('docs/storytime/l2-unit1/w07/muse/l2-w07-check-row-cat.json', 'line');
const LINE_PERSON = block('docs/storytime/l2-unit1/cards/l2-w01-card-girl.json', 'line');
for (const [use, file] of Object.entries(DONOR)) {
  if (use === 'check-row' || use === 'd4-prompt' || use === 'card') {
    RULE[use] = block(file, 'tail');
  } else {
    RULE[use] = block(file, 'rule');
    COUNT[use] = block(file, 'count');
  }
  LINE[use] = block(file, 'line');
}

const cards = (() => {
  try { return read('/home/daniebo/Desktop/Workbooks/content/storytime/drafts/l2/print/card-pictures-u2.json'); }
  catch { return []; }
})();
const cardList = Array.isArray(cards) ? cards : Object.values(cards).filter((c) => c && c.word);

function referencesFor(row) {
  const refs = [];
  for (const key of row.cast) {
    const person = elements.castPeople[key];
    if (!person) continue;
    refs.push(person.source);
    if (person.extraFace) refs.push(person.extraFace);
  }
  if (row.set && E[row.set]) refs.push(E[row.set].path);
  for (const id of row.props) {
    const el = E[id];
    if (el && el.source !== 'text') refs.push(el.path);
  }
  return refs;
}

function hasNoTextSentence(p) {
  return /no text, no letters, no numbers/i.test(p);
}

function sentenceFor(ref, row) {
  if (ref.endsWith('nan-ref-clean-face-crop.png')) {
    return 'is a close-up of Nan\'s face with the correct, clean eyes: copy her face and eyes from it exactly; each eye ends in a smooth, rounded outer corner with one short, thick, curved eyelash flick; there is no pale skin flap, no torn edge, and no separate small tick mark at any eye corner.';
  }
  const person = Object.entries(elements.castPeople).find(([, v]) => v.source === ref);
  if (person) {
    const s = elements.castSentences[person[0]];
    if (s) {
      const pick = s.group ? ` copy only ${person[0].replace(/-/g, ' ')} from it.` : '';
      return `shows ${s.sentence}${pick}`;
    }
    return `shows ${person[0].replace(/-/g, ' ')}, the approved unit 1 character sheet; copy only this person.`;
  }
  for (const [id, el] of Object.entries(E)) {
    if (el.path !== ref) continue;
    if (el.kind === 'set') return `is the empty ${el.look}; use it as the background and keep the same room.`;
    if (el.source === 'forge') {
      const one = el.look.replace(/,\s*(three|four) times?[^.;]*/i, '');
      const extra = el.id === 'pot' ? ' Draw the pot only, empty, without the plant.' : '';
      return `is a 3D render of ${one}, ONE view only, on a gray or white background, perhaps with a ground shadow; ignore the background and the shadow, and draw the same object with the same shape and colors.${extra}`;
    }
    if (el.source === 'new-prop') {
      return `shows ${el.look}, three views (front, three-quarter, side); draw exactly ONE such animal like it.`;
    }
    return `shows ${el.look}; draw the object exactly like it.`;
  }
  return null;
}

function setSentence(ref) {
  for (const el of Object.values(E)) {
    if (el.path !== ref || el.kind !== 'set') continue;
    const place = /playground|farmyard|garden|street|park|meadow/.test(el.id);
    let look = el.look.replace(/^empty\s+/i, '');
    let extra = '';
    if (el.id === 'set-tom-living-room') {
      // R2: the unit 1 set holds a low table with a silver pot. The row leaves it out.
      look = look.replace(/, and ONE low wooden table with ONE big silver pot with a lid in the right foreground/, '');
      extra = ' The set picture also shows a low wooden table with a big silver pot in the right foreground: leave out the table and the pot; that part of the floor is clear.';
    }
    const pre = el.source === 'new' ? 'is the new ' : 'is the ';
    return `${pre}${look}; use it as the background and keep the same ${place ? 'place' : 'room'}.${extra}`;
  }
  return null;
}

// Display name of a cast key, for "Keep <name> exactly as in the picture".
function displayName(key) {
  const raw = key.replace(/-/g, ' ');
  if (raw === 'nans dad') return "Nan's dad";
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
}


// F1: the line prompt follows the kind of the word.
const FACE_WORDS = new Set(['dog', 'cat', 'fish', 'duck', 'elephant', 'horse', 'goat', 'doll', 'prop-hen-sheet']);
// The face rule depends on the word, with or without an element (F1).
const FACE_NAMES = new Set(['dog', 'cat', 'fish', 'duck', 'elephant', 'horse', 'goat', 'doll', 'hen']);
const faceText = (word) => `The ${word} has a friendly face with two eyes and a smiling mouth; draw them.`;
function objectLine(word) {
  return LINE['check-row'].replace(
    'The bus body, the wheels, and each window are separate closed shapes with thick outlines.',
    `Each part of the ${word} is a separate closed shape with a thick outline.`,
  );
}
// F8 (D4): each face word gets its own line feature sentence. The unit 1 cat sentence named ears
// for every animal, so a duck and a doll got ears. A word without an entry stops the maker, so no
// new face word can fall back to the cat ears by accident. Dog, cat, fish, and hen follow the same
// form: the feature of the animal, then what sits on the head.
const LINE_FEATURES = {
  dog: 'The dog has floppy ears and a short tail; draw the ears as two separate closed shapes on the sides of the head.',
  cat: 'The cat has pointed ears and a long tail; draw the ears as two separate closed shapes on top of the head.',
  fish: 'The fish has fins and a fan tail; draw nothing on top of the head, and draw each fin as one closed shape.',
  duck: 'The duck has a flat bill and folded wings; draw nothing on top of the head, and draw the bill as one closed shape.',
  hen: 'The hen has a small beak, a red comb, a red wattle, and folded wings; draw nothing on top of the head, and draw the comb and the wattle as separate closed shapes.',
  elephant: 'The elephant has big round ears and a long trunk; draw each ear as one closed shape and the trunk as one long closed shape.',
  horse: 'The horse has pointed ears and a mane; draw the ears as two separate closed shapes on top of the head, and the mane as one closed shape along the neck.',
  goat: 'The goat has pointed ears, small horns, and a small beard; draw the horns and the beard as separate closed shapes.',
  doll: 'The doll has hair and a dress; draw nothing on top of the head, and draw the hair as one closed shape.',
};
function faceLine(word) {
  const key = String(word).toLowerCase();
  const feature = LINE_FEATURES[key];
  if (!feature) throw new Error(`no line feature sentence for the face word ${word}`);
  return LINE_FACE
    .replace('The whole cat is one closed outline (no fur strands).', 'The whole animal is one closed outline (no fur strands).')
    .replace(' Draw no stripes at all.', '')
    .replace(' Draw the whiskers as three thick lines on each side.', '')
    .replace('The tail is one long curved closed shape that starts at the back of the cat, curls behind the body, and does not touch the head.', 'The tail is one closed shape.')
    .replace('The chest, the front legs, and the back legs are plain closed shapes with no stripe lines on the legs.', 'The legs and the body are plain closed shapes.')
    .replace(/The two ears are the only shapes on top of the head\./, feature);
}
function personLine(extra = '') {
  return LINE_PERSON
    .replace(' Nan keeps her painted eyelash mark in the line art: at the outer corner of each visible eye, draw ONE short thick solid stroke (as thick as the outline) that touches the eye outline; do not leave it out. The eyelash stroke is the only mark beside each eye.', '')
    .replace(' Each hair bun is one closed round shape with one closed band ring.', '')
    .replace(' Draw the white star on her T-shirt as one closed star shape.', '')
    .replace('Draw only the person:', `Each piece of the clothes is one closed shape; the collar and the cuffs are separate closed shapes.${extra} Draw only the person:`);
}
function lineFor(row) {
  if (row.sizeClass !== 'C') return lineCopyWithSetShapes(row);
  if (FACE_NAMES.has(String(row.text).toLowerCase())) return faceLine(row.text);
  if (row.form === 'person-card') return personLine();
  if (row.use === 'card' && row.cast.length) return personLine();
  if (row.form === 'body-part') {
    return personLine(' Draw the pointed foot as one closed shape with five rounded toe shapes.');
  }
  if (row.form === 'text-object') return objectLine(row.text);
  const word = String(row.text).toLowerCase();
  if (FACE_NAMES.has(word)) return faceLine(row.text);
  const el = (row.props || []).map((id) => E[id]).find(Boolean);
  if (el && FACE_WORDS.has(el.id)) return faceLine(row.text);
  return objectLine(row.text);
}

function lineCopyWithSetShapes(row) {
  const base = LINE[row.use] || LINE['story-page'];
  const setEl = row.set && E[row.set];
  if (!setEl || !setEl.lineShapes) return base;
  const m = base.match(/Simplify the background: draw only a few large, simple, closed shapes \(([^)]*)\)\./);
  if (!m) return base;
  return base.replace(m[0],
    `Simplify the background: draw only a few large, simple, closed shapes (${setEl.lineShapes}).`);
}

const specs = [];
const list = [];
for (const row of rowsDoc.rows) {
  const p = pictures.find((x) => x.id === row.id);
  if (!p) throw new Error(`row not in pictures: ${row.id}`);
  const refs = referencesFor(row);
  const sentences = [];
  let n = 0;
  for (const ref of refs) {
    n += 1;
    const s = setSentence(ref) || sentenceFor(ref, row);
    if (!s) throw new Error(`no picture sentence for ${ref} (row ${row.id})`);
    sentences.push(`Picture ${n} ${s}`);
  }
  const textOnly = row.props.map((id) => E[id]).filter((el) => el && el.source === 'text');
  let scene = row.scene;
  if (textOnly.length) {
    scene += ` Simple objects with no reference picture: ${textOnly.map((el) => el.look).join('; ')}.`;
  }
  if (p.objectCounts && Object.keys(p.objectCounts).length) {
    const counts = Object.entries(p.objectCounts).map(([w, c]) => `exactly ${c === 1 ? 'ONE' : c} ${w}`).join(', ');
    scene += ` The object counts: ${counts}.`;
  }
  const isC = row.sizeClass === 'C';
  const isCard = row.use === 'card';
  const cardText = isCard ? (cardList.find((c) => c.week === row.week && row.id.endsWith(`-card-${String(c.word).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)) || {}).prompt : null;
  const donorFile = DONOR[row.use] || DONOR['story-page'];
  let cp;
  let goal = row.scene;
  if (isC) {
    const form = row.form || 'object';
    const person = row.cast[0];
    const personName = person ? displayName(person) : null;
    const personNote = person && elements.castPeople[person] ? elements.castPeople[person].note : '';
    if (form === 'text-object') {
      // R4: no reference picture. Describe the object in words and never say "picture 1".
      const words = textOnly.map((el) => el.look).join('; ') || `ONE ${row.text}`;
      goal = `One picture of ${words.replace(/^ONE /, 'one ')}.`;
      cp = `Make one children's book picture. Do not use a reference picture: draw the object from these words. The object: ${words}. Draw it as a smooth, clean, bright, soft, round 3D render with a plain white background. The picture to make: a square picture of exactly ONE ${row.text}, large in the middle, filling most of the square, the whole object in view, seen from a three-quarter view, so that its shape reads clearly. Exactly one ${row.text}: no second one, no copies, and nothing else in the picture. ${FACE_NAMES.has(String(row.text).toLowerCase()) ? faceText(String(row.text).toLowerCase()) : 'The object has no eyes and no face.'} The background is plain white and empty, with at most a very soft shadow under the object. The page text is context only: do not draw any text. No text, no letters, no numbers, no logos. The picture is for young children and is rated G.`;
    } else if (form === 'person-card') {
      // R9: an adult keeps the adult proportions of the picture; a child keeps the chibi sentence.
      const ADULT = ['dad', 'mom', 'grandma', 'grandpa', 'teacher-kim', 'nans-dad'];
      const isAdult = ADULT.includes(person);
      const pronoun = ['mom', 'grandma', 'teacher-kim'].includes(person) ? 'her' : 'his';
      const proportionLine = isAdult
        ? `${personName} keeps the adult proportions of ${pronoun} picture (about one and a half times as tall as a five-year-old child).`
        : 'The character keeps the chibi proportions of a five-year-old child: a big head and a small body.';
      // R5: a person word uses the person form of the card rows.
      goal = `One picture of ${personName} that shows the word ${row.text}: ${row.text === 'dad' ? 'he stands' : 'she points at one ' + row.text}.`;
      const note = personNote ? ` Keep ${personName} exactly as in the picture: ${personNote}` : '';
      cp = `Compose one children's book picture from the element pictures. ${sentences.join(' ')} Keep the soft, round, bright 3D render look of the pictures, not a 2D drawing and no outlines. ${proportionLine} The hands are small, clean hands with five clear short fingers and a thumb when open, never fists, and a hanging hand shows relaxed, separate short fingers. Rendering errors to NOT copy from the character pictures: a tiny dark tick mark or pale skin flap at the outer corner of an eye, and a faint pale crease on a forehead. Each eye ends in a smooth, rounded corner. Clean eye corners, no streak on the forehead, no marks on the face. The ears are smooth, with one clean rounded rim. Each piece of clothing is one even color with no pale patches, no pale blotches at the shoulders, and no stains. Do not change anyone's hair or clothes. The picture: ${personName} stands full body on a plain white background and ${row.text === 'dad' ? 'smiles' : 'points at one ' + row.text + ' with one hand'}. A square card picture on a plain pure white background: the full body stands at the middle of the square, the whole figure in view from head to feet, facing the camera, with a wide empty white margin on every side. Exactly one person: no other person, no animal, and nothing else in the picture. The shadow is soft or absent.${note} The page text is "${row.text}" and is context only: do not draw any text. No text, no letters, no numbers, no logos. The picture is for young children and is rated G.`;
    } else if (form === 'body-part') {
      // R5: a body-part word uses the body-part form of the family-words spec.
      goal = `One picture of ${personName} that shows the word ${row.text}: she points at one ${row.text}.`;
      const note = personNote ? ` Keep ${personName} exactly as in the picture: ${personNote}` : '';
      cp = `Compose one children's book picture from the element pictures. ${sentences.join(' ')} Keep the soft, round, bright 3D render look of the pictures, not a 2D drawing and no outlines. The character keeps her chibi proportions: a big head and a small body. The hands are small, clean hands with five clear short fingers and a thumb when open, never fists. Rendering errors to NOT copy from the character pictures: a tiny dark tick mark at the outer corner of an eye, and a faint pale crease on a forehead. Each eye ends in a smooth, rounded corner; ${personName} keeps one short, thick, curved eyelash flick at each outer eye corner. Clean eye corners, no streak on the forehead, no marks on the face. The ears are smooth, with one clean rounded rim. Each piece of clothing is one even color with no pale patches and no stains. Do not change anyone's hair or clothes. The picture: ${personName} sits on a plain white background, one leg out, and points at ONE ${row.text} with one hand. A square picture of one person on a plain pure white background: the whole figure in view, facing the camera, with a wide empty white margin on every side. Exactly one person and exactly one ${row.text}: no second one and nothing else in the picture.${note} The page text is "${row.text}" and is context only: do not draw any text. No text, no letters, no numbers, no logos. The picture is for young children and is rated G.`;
    } else if (isCard && cardText) {
      // R6: the keep line names the cast person, never the card word.
      const keep = person
        ? ` Keep ${personName} exactly as in the picture: ${personNote}`
        : '';
      cp = `Compose one children's book picture from the element pictures. ${sentences.join(' ')} The picture: ${cardText}${keep} The background is plain white and empty, with at most a very soft shadow under the object. The page text is "${row.text}" and is context only: do not draw any text. No text, no letters, no numbers, no logos. The picture is for young children and is rated G.`;
      goal = cardText;
    } else {
      const head = `Compose one children's book picture from the element picture${refs.length === 1 ? '' : 's'}.`;
      cp = [head, ...sentences].join(' ');
      cp += ` Draw the same object with the same shape, the same colors, and the same proportions as in picture 1, as a smooth, clean, bright, soft, round 3D render with a plain white background. The picture to make: a square picture of exactly ONE ${row.text}, large in the middle, filling most of the square, the whole object in view, seen from a three-quarter view, so that its shape reads clearly. Exactly one ${row.text}: no second one, no copies, and nothing else in the picture. ${RULE[row.use] || RULE['check-row']}`;
      if (FACE_NAMES.has(String(row.text).toLowerCase())) {
        cp = cp.replace('The object has no eyes and no face.', faceText(String(row.text).toLowerCase()));
      }
      goal = `One picture of exactly one ${row.text}.`;
    }
  } else {
    const head = row.use === 'cover'
      ? "Compose one children's book cover picture from the element pictures."
      : "Compose one children's book picture from the element pictures.";
    const castLine = row.cast.length
      ? ` Keep each character exactly as in the pictures: ${row.cast.map((k) => (elements.castPeople[k] ? elements.castPeople[k].note : k)).join('; ')}.`
      : '';
    const sceneText = row.use === 'cover'
      ? `${scene} A cover picture: a wide shot at a low camera height in the room; the top 30 percent is calm sky or wall for the title.`
      : `${scene} A wide shot at a low camera height in the room.`;
    cp = [head, ...sentences].join(' ');
    cp += ` ${RULE[row.use]}${castLine} The picture: ${sceneText} ${COUNT[row.use]} The page text is "${row.text}" and is context only: do not draw any text.`;
  }
  cp = cp.replace("Do not change anyone's skin tone, hair, or clothes.", "Do not change anyone's hair or clothes.");
  const outdoor = row.set && /playground|farmyard|garden|street/.test(String(row.set));
  if (!row.cast.includes('mom')) {
    cp = cp.replace('Mom keeps the adult proportions of her picture (about one and a half times as tall as a five-year-old child); ', '');
  }
  if (!row.cast.includes('tom')) {
    cp = cp.replace('; Tom, who is eight, is a little taller than a five-year-old child and has the same chibi proportions', '');
  }
  if (outdoor) cp = cp.split('in the room').join('in the place');
  const spec = {
    id: row.id,
    text: row.text,
    goal,
    references: refs,
    colorPrompt: cp,
    linePrompt: lineFor(row),
    print: 'crop',
    aspect: isC ? '1:1' : '4:3',
    ...(isC ? { printSize: [1500, 1500] } : {}),
    outDir: `out/storytime/l2/unit2/w${String(row.week).padStart(2, '0')}/muse`,
    sizeClass: row.sizeClass,
    use: row.use,
    set: row.set,
    props: row.props,
    reuse: row.reuse,
    donorFiles: {
      rule: donorFile,
      line: DONOR[row.use] || DONOR['story-page'],
      cast: row.cast.map((k) => (elements.castSentences[k] ? elements.castSentences[k].donor : null)).filter(Boolean),
      scene: 'pictures-u2.json (Workbooks row prompt)',
    },
  };
  const file = join(REPO, 'docs/storytime/l2-unit2', `w${String(row.week).padStart(2, '0')}`, 'muse', `${row.id}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(spec, null, 2) + '\n');
  specs.push({ spec, file });
  list.push({
    id: row.id, week: row.week, use: row.use, sizeClass: row.sizeClass,
    size: isC ? '1500x1500' : '4000x3000', text: row.text,
    elements: refs.join(' '), reuse: row.reuse ? `${row.reuse.kind}:${row.reuse.source}` : '',
    mode: row.reuse ? 'reuse' : 'new', colorPrompt: cp,
  });
}

// ---- prompt lists --------------------------------------------------------
mkdirSync(outRootAbs, { recursive: true });
const tsvHead = ['row_id', 'week', 'use', 'class', 'pixels', 'text', 'element_sources', 'reuse_source', 'new_or_reuse', 'color_prompt'];
writeFileSync(join(outRootAbs, 'prompt-list.tsv'),
  [tsvHead.join('\t'), ...list.map((r) => [r.id, r.week, r.use, r.sizeClass, r.size, r.text,
    r.elements, r.reuse, r.mode, r.colorPrompt.replace(/\t/g, ' ')].join('\t'))].join('\n') + '\n');
const md = [
  '# Unit 2 picture prompt list (draft, not a "Go")',
  '',
  `Rows: ${list.length}. New rows: ${list.filter((r) => r.mode === 'new').length}.`,
  `Reuse rows (D3, same word and same use): ${list.filter((r) => r.mode === 'reuse').length}.`,
  'Cost estimate: 0.080 USD for each new row, 0.01 USD for each new element sheet, 0 for a reuse row.',
  '',
  '| Row | Week | Use | Class | Pixels | Text | Mode | Reuse source |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...list.map((r) => `| \`${r.id}\` | ${r.week} | ${r.use} | ${r.sizeClass} | ${r.size} | ${r.text} | ${r.mode} | ${r.reuse || ''} |`),
  '',
];
writeFileSync(join(outRootAbs, 'prompt-list.md'), md.join('\n'));

const missing = [];
for (const { spec } of specs) {
  for (const r of spec.references) if (!existsSync(resolve(REPO, r))) missing.push(`${spec.id} -> ${r}`);
}
console.log(JSON.stringify({ specs: specs.length, missingRefs: missing.length, outRoot }, null, 1));
if (missing.length) console.error(missing.slice(0, 20).join('\n'));
