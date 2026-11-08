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
      return `is a 3D render of ${el.look}, on a gray or white background, perhaps with a ground shadow; ignore the background and the shadow, and draw the same object with the same shape and colors.`;
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
      cp = `Make one children's book picture. Do not use a reference picture: draw the object from these words. The object: ${words}. Draw it as a smooth, clean, bright, soft, round 3D render with a plain white background. The picture to make: a square picture of exactly ONE ${row.text}, large in the middle, filling most of the square, the whole object in view, seen from a three-quarter view, so that its shape reads clearly. Exactly one ${row.text}: no second one, no copies, and nothing else in the picture. The background is plain white and empty, with at most a very soft shadow under the object. The object has no eyes and no face. The page text is context only: do not draw any text. No text, no letters, no numbers, no logos. The picture is for young children and is rated G.`;
    } else if (form === 'person-card') {
      // R5: a person word uses the person form of the card rows.
      goal = `One picture of ${personName} that shows the word ${row.text}: ${row.text === 'dad' ? 'he stands' : 'she points at one ' + row.text}.`;
      const note = personNote ? ` Keep ${personName} exactly as in the picture: ${personNote}` : '';
      cp = `Compose one children's book picture from the element pictures. ${sentences.join(' ')} Keep the soft, round, bright 3D render look of the pictures, not a 2D drawing and no outlines. The character keeps the chibi proportions of a five-year-old child: a big head and a small body. The hands are small, clean hands with five clear short fingers and a thumb when open, never fists, and a hanging hand shows relaxed, separate short fingers. Rendering errors to NOT copy from the character pictures: a tiny dark tick mark or pale skin flap at the outer corner of an eye, and a faint pale crease on a forehead. Each eye ends in a smooth, rounded corner. Clean eye corners, no streak on the forehead, no marks on the face. The ears are smooth, with one clean rounded rim. Each piece of clothing is one even color with no pale patches, no pale blotches at the shoulders, and no stains. Do not change anyone's hair or clothes. The picture: ${personName} stands full body on a plain white background and ${row.text === 'dad' ? 'smiles' : 'points at one ' + row.text + ' with one hand'}. A square card picture on a plain pure white background: the full body stands at the middle of the square, the whole figure in view from head to feet, facing the camera, with a wide empty white margin on every side. Exactly one person: no other person, no animal, and nothing else in the picture. The shadow is soft or absent.${note} The page text is "${row.text}" and is context only: do not draw any text. No text, no letters, no numbers, no logos. The picture is for young children and is rated G.`;
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
  const spec = {
    id: row.id,
    text: row.text,
    goal,
    references: refs,
    colorPrompt: cp,
    linePrompt: lineCopyWithSetShapes(row),
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
