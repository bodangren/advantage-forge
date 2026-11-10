// Probe P1-C: the 9 retry spec edits (D2) and the cover spec (D5, D6).
// Usage: node measure/runs/asset_storytime_l2_retries_cover_20261110/probe-p1-specs.mjs
// It reads git blobs at 4c950a1d and 6ec8ef66, the cover spec in the working tree, the copied
// reference files under out/, and the brief folder (read only). No provider call.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const BRIEF = '/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-brief';

const show = (sha, p) => execFileSync('git', ['show', `${sha}:${p}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` :: ${String(detail).slice(0, 300)}`}`);
};

// D2: the 9 specs. Each file changes only its named prompt field, and the new value holds the
// D2 sentence (a replacement for hat-pip, an appended sentence for the other 8).
const HAT_PIP_SENTENCE =
  'Count the people: exactly seven children (Sam, May, Ben, Mia, Pat, Lily, and Nan), Teacher Kim, and Pip. Nan, in her orange T-shirt with the white star, is in full view. The seven children stand in one line, side by side, each in full view, from left to right: Sam, May, Ben, Mia, Pat, Lily, and Nan; Pip sits in the big open dress-up box in front of the line, and Teacher Kim stands once behind the line. Each child shows exactly once, with his or her own hair and own clothes from the pictures. Exactly the characters named here are in the picture, and no other person or animal.';
const CARD_SENTENCE =
  'Draw the object or the child large, filling most of the square, with few details. Every line is about one fiftieth of the picture width (2 percent) thick, never thinner. This line width replaces any other line width in this prompt.';
const specs = [
  ['docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-hat-pip.json', 'colorPrompt', HAT_PIP_SENTENCE, 'replace'],
  ['docs/storytime/l2-unit2/w09/muse/l2-w09-story-page-tom-can-see-the-mop.json', 'linePrompt', 'Dad has no glasses. His eyes are two simple dots. Keep the very thick lines.', 'append'],
  ['docs/storytime/l2-unit2/w09/muse/l2-w09-card-rice.json', 'linePrompt', 'The rice is many small separate closed ovals (grains) heaped in the bowl, with no big blobs.', 'append'],
  ['docs/storytime/l2-unit2/w12/muse/l2-w12-card-hippo.json', 'linePrompt', CARD_SENTENCE, 'append'],
  ['docs/storytime/l2-unit2/w12/muse/l2-w12-card-ruler.json', 'linePrompt', CARD_SENTENCE, 'append'],
  ['docs/storytime/l2-unit2/w13/muse/l2-w13-card-clap.json', 'linePrompt', CARD_SENTENCE, 'append'],
  ['docs/storytime/l2-unit2/w13/muse/l2-w13-card-throw.json', 'linePrompt', CARD_SENTENCE, 'append'],
  ['docs/storytime/l2-unit2/w14/muse/l2-w14-card-cold.json', 'linePrompt', CARD_SENTENCE, 'append'],
  ['docs/storytime/l2-unit2/w14/muse/l2-w14-card-windy.json', 'linePrompt', CARD_SENTENCE, 'append'],
];

for (const [file, field, sentence, mode] of specs) {
  const before = JSON.parse(show('4c950a1d', file));
  const after = JSON.parse(show('6ec8ef66', file));
  const changed = Object.keys(after).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  const onlyField = changed.length === 1 && changed[0] === field;
  const oldV = before[field];
  const newV = after[field];
  let sentenceOk = false;
  if (mode === 'replace') {
    // The old span from the count sentence to the next "no other person or animal." is gone and
    // the new value holds the D2 text.
    sentenceOk = newV.includes(sentence) && !newV.includes('Nan, with her two round buns, stands in front at the right, in full view.');
  } else {
    // The D2 text is added at the end, after a space separator.
    sentenceOk = newV === `${oldV} ${sentence}` && newV.endsWith(sentence);
  }
  check(`D2 ${path.basename(file)} only ${field} changed with the D2 text`, onlyField && sentenceOk, `changed=${JSON.stringify(changed)}`);
}

// D5: the cover spec.
const coverPath = 'docs/storytime/covers/teacher-front/l2-u1-cover-quest-teacher-front.json';
const cover = JSON.parse(readFileSync(path.join(ROOT, coverPath), 'utf8'));
check('D5 cover id and outDir', cover.id === 'l2-u1-cover-quest-teacher-front' && cover.outDir === 'out/storytime/covers/teacher-front/muse', `${cover.id} ${cover.outDir}`);
check('D5 cover color only', cover.linePrompt === undefined, `linePrompt=${cover.linePrompt}`);
check('D5 cover print fields', cover.print === 'crop' && cover.aspect === '3:4' && JSON.stringify(cover.printSize) === '[2480,3508]', `${cover.print} ${cover.aspect} ${JSON.stringify(cover.printSize)}`);

const refs = cover.references;
const expectedRefs = [
  'out/storytime/covers/teacher-front/refs/style-student-front-final.jpg',
  'out/storytime/covers/teacher-front/refs/cast-teacher-kim.png',
  'out/storytime/covers/teacher-front/refs/cast-nan.png',
  'out/storytime/covers/teacher-front/refs/cast-sam.png',
  'out/storytime-review/judge/cast/teacher-kim.png',
  'out/storytime-review/judge/cast/nan.png',
  'out/storytime-review/judge/cast/sam.png',
];
check('D5 the 7 references in order', JSON.stringify(refs) === JSON.stringify(expectedRefs), JSON.stringify(refs));
check('D5 every reference exists', refs.every((r) => existsSync(path.join(ROOT, r))), refs.filter((r) => !existsSync(path.join(ROOT, r))).join(', '));

// No reference is a file of avoid/: no reference path points into avoid/, and no reference file
// has the SHA-256 of an avoid file.
const avoidDir = path.join(BRIEF, 'avoid');
const manifest = readFileSync(path.join(BRIEF, 'MANIFEST.txt'), 'utf8');
const manifestMap = new Map(manifest.trim().split('\n').map((l) => {
  const m = l.match(/^([0-9a-f]{64})\s+(\d+)\s+(.+)$/);
  return [m[3], { sha: m[1], size: Number(m[2]) }];
}));
const avoidShas = new Set([...manifestMap].filter(([p]) => p.startsWith('avoid/')).map(([, v]) => v.sha));
const noAvoidPath = refs.every((r) => !r.includes('/avoid/'));
const noAvoidHash = refs.every((r) => !avoidShas.has(sha256(path.join(ROOT, r))));
check('D5 no reference is an avoid file', noAvoidPath && noAvoidHash, `${noAvoidPath} ${noAvoidHash}`);

// The 4 copied references match the brief MANIFEST SHA-256 and byte size.
const copies = refs.slice(0, 4).map((r) => r.replace('out/storytime/covers/teacher-front/refs/', 'refs/'));
const copyOk = copies.every((rel) => {
  const want = manifestMap.get(rel);
  const got = refs.find((r) => r.endsWith(path.basename(rel)));
  const p = path.join(ROOT, got);
  return want && sha256(p) === want.sha && statSync(p).size === want.size;
});
check('D5 the 4 copied references match the brief MANIFEST', copyOk && copies.length === 4, copies.join(', '));

// The prompt of D5/D6: the brief sections word for word, the count, AF-1 to AF-4 as positive
// statements, the layout, and the never-list.
const brief = readFileSync(path.join(BRIEF, 'README.md'), 'utf8');
const prompt = cover.colorPrompt;
const briefStyle = brief.match(/The style is bright painted anime fantasy key art\..*?Not 3D\. Not a render\. Not clay\./s)[0].replace(/\n\n/g, ' ');
const briefScene = brief.match(/The scene is under a giant old tree\..*?for example a tree and a ball\./s)[0].replace(/\n\n/g, ' ');
const briefNever = brief.match(/The picture holds no letters, no words, and no numbers\..*?are cast marks, not flags: keep them\./s)[0].replace(/\n\n/g, ' ');
check('D5 prompt holds brief section 5 word for word', prompt.includes(briefStyle), 'style');
check('D5 prompt holds brief section 6 word for word', prompt.includes(briefScene), 'scene');
check('D5 prompt holds brief section 10 word for word', prompt.includes(briefNever), 'never list');
const castNotes = [...brief.matchAll(/`((?:Teacher Kim|Nan|Sam): [^`]+)`/g)].map((m) => m[1]);
check('D5 prompt holds the 3 cast notes word for word', castNotes.length === 3 && castNotes.every((n) => prompt.includes(n)), castNotes.length);
check(
  'D5 prompt names exactly three people, no Pip',
  prompt.includes('The picture shows exactly three people: Teacher Kim, Nan, and Sam. It shows no Pip. It shows no other person and no other animal.'),
  'count',
);
const af = [
  "Sam's red T-shirt shows exactly two white stripes across the chest and nothing else.",
  "Nan's orange T-shirt shows one white star and no letters.",
  'Nan wears the orange T-shirt with the white star, and Sam wears the red T-shirt with the two white stripes, and each child keeps his or her own clothes.',
  'Teacher Kim shows the open book to the children, looks at them, and smiles, and the open pages face Nan and Sam and not the viewer.',
];
check('D5/D6 prompt holds AF-1 to AF-4 as positive statements', af.every((s) => prompt.includes(s)), af.filter((s) => !prompt.includes(s)));
const layout = [
  'The top 30 percent of the height is sky and leaves only: calm, with no face, no hand, no book, and no key object.',
  'The faces, the hands, and the open book stay between 30 percent and 78 percent of the height.',
  'The bottom 22 percent holds only grass, flowers, and feet.',
];
check('D6 prompt holds the layout', layout.every((s) => prompt.includes(s)), layout.filter((s) => !prompt.includes(s)));

const failed = results.filter((x) => !x.ok);
console.log(`probe-p1-specs: ${results.length - failed.length}/${results.length} checks hold`);
process.exit(failed.length ? 1 : 0);
