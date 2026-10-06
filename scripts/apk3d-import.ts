/**
 * Workbook JSON to StoryInput packs (section 5 of docs/apk3d-cartridge.md).
 *
 *   node --import tsx scripts/apk3d-import.ts [--force] [--only <id>]
 *
 * Reads the chosen Primary workbook files (../Workbooks/primary/**, or $DEMO_WORKBOOKS), writes
 * demo/public/stories/<id>/story.json (validated with `storyInputSchema`), converts the article
 * images to WebP (img-1.webp, ...), and writes demo/public/stories/index.json as `storyIndexSchema`
 * rows. Re-runnable: images already on disk are kept unless --force is given.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import sharp from 'sharp';
import {
  normalizeCefrLevel,
  parseStoryInput,
  toStoryIndexEntry,
  type StoryFill,
  type StoryIndexEntry,
  type StoryInput,
  type StoryParagraph,
  type StoryQuestion,
  type StorySentence,
  type StoryVocabulary,
} from '../src/apk3d/contracts/story-input.js';

const ROOT = process.cwd();
const WORKBOOKS = process.env.DEMO_WORKBOOKS ?? resolve(ROOT, '..', 'Workbooks', 'primary');
// The workbook stories are test fixtures only: they are not published with the demo.
const OUT = join(ROOT, 'tests', 'fixtures', 'stories');
const FORCE = process.argv.includes('--force');
const ONLY = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : undefined;
const IMAGE_WIDTH = 1024;
const IMAGE_QUALITY = 80;

/** The stories of the demo: id and workbook file (relative to WORKBOOKS), in selector order. */
/**
 * A story's practice set, when only some words and sentences of the workbook should reach the
 * games (the games take the whole `vocabulary` and `sentences` lists). Words are workbook terms in
 * this order; sentences are article sentences with the workbook's Thai translation.
 */
interface PracticeSet {
  words: string[];
  sentences: { text: string; translation: string }[];
}

export const STORIES: { id: string; file: string; practice?: PracticeSet }[] = [
  // A0, Origins: images, Thai glosses, and translated paragraphs from the workbook generator.
  { id: 'pip-is-brave', file: 'origins-2-a0/12-Pip is Brave _workbook.json' },
  { id: 'squeaky-the-small-mouse', file: 'origins-3.1-a0/14-Squeaky, the Small Mouse _workbook.json' },
  { id: 'pip-and-the-red-car', file: 'origins-3.1-a0/07-Pip and the Red Car _workbook.json' },
  { id: 'fun-day-at-the-beach', file: 'origins-2-a0/04-Fun Day at the Beach _workbook.json' },
  { id: 'pips-happy-night', file: "origins-3.1-a0/02-Pip's Happy Night _workbook.json" },
  { id: 'pip-sees-colors', file: 'origins-3.1-a0/04-Pip Sees Colors _workbook.json' },
  // The Primary video series (owner, 2026-10-06, via the advantage-pr session): Origins 2 lesson 1
  // with the six words and three sentences of the game recordings.
  {
    id: 'pip-the-curious-puppy-feels',
    file: 'origins-2-a0/01-Pip the Curious Puppy Feels _workbook.json',
    practice: {
      words: ['puppy', 'blanket', 'soft', 'rough', 'smooth', 'yellow'],
      sentences: [
        { text: 'Pip sees a blue blanket.', translation: 'ปิ๊ปเห็นผ้าห่มสีฟ้า' },
        { text: 'Pip walks on the rug.', translation: 'ปิ๊ปเดินบนพรม' },
        { text: 'This ball is smooth.', translation: 'ลูกบอลนี้มันเรียบ' },
      ],
    },
  },
  // A1, Adventures: no images and no Thai in the workbook; glosses from THAI_GLOSSES (demo only).
  { id: 'the-new-student', file: 'adventures-1.0-a1/01-The_New_Student_workbook.json' },
  { id: 'the-school-garden', file: 'adventures-1.0-a1/02-The_School_Garden_workbook.json' },
];

/**
 * Thai meanings for stories whose workbook has none, keyed by story id and lowercase word. Written
 * by a model, not by the workbook generator: a Thai speaker reviews them before the APK port
 * (owner decision, section 13). A pack that uses them gets `source.translationsGenerated: true`
 * and its index row `reviewed: false`.
 */
export const THAI_GLOSSES: Record<string, Record<string, string>> = {
  'the-new-student': {
    nervous: 'ประหม่า',
    classroom: 'ห้องเรียน',
    friendly: 'เป็นมิตร',
    introduce: 'แนะนำให้รู้จัก',
    welcome: 'ต้อนรับ',
  },
  'the-school-garden': {
    garden: 'สวน',
    seed: 'เมล็ด',
    soil: 'ดิน',
    water: 'น้ำ',
    harvest: 'เก็บเกี่ยว',
  },
};

// ---------------------------------------------------------------- workbook shape (loose)

export interface Workbook {
  lesson_number?: string;
  lesson_title: string;
  cefr_level: string;
  genre?: string;
  article_type?: string;
  vocabulary: { word: string; phonetic?: string; definition: string; thai_definition?: string }[];
  article_image_url?: string[];
  article_url?: string;
  article_paragraphs: { number?: number; text: string }[];
  comprehension_questions: { number?: number; question: string; options: string[] }[];
  mc_answers: { number?: number; letter: string; text?: string }[];
  vocab_fill?: { number?: number; sentence: string }[];
  vocab_fill_answer_string?: string;
  sentence_order_answers?: { number?: number; sentence: string }[];
  translation_paragraphs?: { label?: string; text: string }[];
}

// ---------------------------------------------------------------- normalizing helpers

/** "origins-3.1-a0" -> "Origins 3.1"; "adventures-1.0-a1" -> "Adventures 1.0". */
function parseSeries(folder: string): string {
  const m = /^([a-z]+)-([\d.]+)/i.exec(folder);
  if (!m) throw new Error(`cannot read the series from folder "${folder}"`);
  return `${m[1]![0]!.toUpperCase()}${m[1]!.slice(1)} ${m[2]}`;
}

/** "12-Pip is Brave _workbook.json" -> 12. */
function parseLessonFromFile(file: string): number {
  const m = /^(\d+)-/.exec(basename(file));
  if (!m) throw new Error(`cannot read the lesson number from "${file}"`);
  return Number(m[1]);
}

/** Strip HTML from a fill sentence and write its blank as "___". */
function cleanFill(sentence: string): string {
  return sentence
    .replace(/<span[^>]*class="blank"[^>]*>\s*<\/span>/gi, '___')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/_{3,}/g, '___')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "1-seeds, 2-soil" or "1. puppy, 2. dark" -> Map(number -> text). */
function parseAnswerString(raw: string): Map<number, string> {
  const out = new Map<number, string>();
  for (const part of raw.split(',')) {
    const m = /^\s*(\d+)\s*[-.:)]\s*(.+?)\s*$/.exec(part);
    if (!m) throw new Error(`cannot parse answer entry "${part}" in "${raw}"`);
    out.set(Number(m[1]), m[2]!);
  }
  return out;
}

/** "c" or "C" -> 2. */
function letterIndex(letter: string): number {
  const i = letter.trim().toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
  if (!(i >= 0 && i < 26)) throw new Error(`bad answer letter "${letter}"`);
  return i;
}

/** "C. Vegetables and flowers" -> "Vegetables and flowers". */
const stripOptionLetter = (option: string) => option.replace(/^[A-Da-d][.)]\s+/, '').trim();

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The case a word has in the story text: an exact whole-word match wins, else a match at the start
 * of a longer word ("Flower" -> "flowers" -> "flower"), else the word as given. When both cases
 * occur, the lowercase form wins (a capital usually only starts a sentence).
 */
export function storyCase(word: string, story: string): string {
  const forms = (re: RegExp, len: number) => [...story.matchAll(re)].map((m) => m[0].slice(0, len));
  const whole = forms(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi'), word.length);
  const found = whole.length ? whole : forms(new RegExp(`\\b${escapeRegExp(word)}\\w*`, 'gi'), word.length);
  if (found.length === 0) return word;
  if (found.includes(word)) return word;
  const lowerForm = word.toLowerCase();
  if (found.includes(lowerForm)) return lowerForm;
  const counts = new Map<string, number>();
  for (const f of found) counts.set(f, (counts.get(f) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

const STOP_WORDS = new Set(
  'a an the is are was were to of in on at and or it this that what where how who do does did has have they we you he she her his our their with for very not there here be'.split(
    ' ',
  ),
);

const contentWords = (text: string): string[] => [
  ...new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s']/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w)),
  ),
];

/**
 * The paragraph that clearly contains `needle`: a verbatim match, else the best content-word
 * overlap when it beats every other paragraph. Undefined when unsure.
 */
export function findParagraph(needle: string, paragraphs: readonly string[]): number | undefined {
  const lower = needle.toLowerCase();
  const verbatim = paragraphs.findIndex((p) => p.toLowerCase().includes(lower));
  if (verbatim >= 0) return verbatim;
  const words = contentWords(needle);
  if (words.length === 0) return undefined;
  const scores = paragraphs.map((p) => {
    const bag = new Set(contentWords(p));
    return words.filter((w) => bag.has(w) || [...bag].some((b) => b.startsWith(w) || w.startsWith(b))).length;
  });
  const best = Math.max(...scores);
  if (best === 0 || scores.filter((s) => s === best).length > 1) return undefined;
  return scores.indexOf(best);
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const withParagraph = <T extends object>(base: T, paragraph: number | undefined) =>
  paragraph === undefined ? base : { ...base, paragraph };

// ---------------------------------------------------------------- sentences from the paragraphs

/** Sentence length window (words) for sentences taken from the paragraphs. */
const EXTRACT_MIN_WORDS = 3;
const EXTRACT_MAX_WORDS = 8;
/** Cap on `story.sentences` (workbook sentences first). */
const MAX_SENTENCES = 12;

/** A quotation mark or bracket; an apostrophe between letters ("Mia's") is not one. */
const QUOTE_OR_BRACKET = /["“”‘()[\]{}]|(?<!\p{L})[’']|[’'](?!\p{L})/u;

/** The sentences of one paragraph: runs that end with . ! or ?, whitespace normalized. */
export function splitSentences(paragraph: string): string[] {
  return [...paragraph.matchAll(/[^.!?]+[.!?]+/g)].map((m) => m[0].trim().replace(/\s+/g, ' ')).filter(Boolean);
}

/**
 * Sentence-order items taken from the paragraphs (Potion Rush needs 6 to 10 orders per shift;
 * the workbook gives 2). Sentences of 3 to 8 words without quotation marks or brackets, unique
 * (case-insensitive) against `existing` and each other, ids continuing after `existing`, with the
 * paragraph index and no translation (the Thai paragraphs cannot be aligned by sentence).
 */
export function extractSentences(paragraphTexts: readonly string[], existing: readonly StorySentence[]): StorySentence[] {
  const seen = new Set(existing.map((s) => s.text.toLowerCase()));
  const candidates = paragraphTexts.map((text, paragraph) =>
    splitSentences(text).flatMap((sentence, position) => {
      const words = sentence.split(' ');
      if (words.length < EXTRACT_MIN_WORDS || words.length > EXTRACT_MAX_WORDS) return [];
      if (QUOTE_OR_BRACKET.test(sentence)) return [];
      const key = sentence.toLowerCase();
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ paragraph, position, text: sentence, words }];
    }),
  );
  // Round-robin over the paragraphs, so the cap keeps sentences from the whole story.
  const picked: (typeof candidates)[number] = [];
  const room = Math.max(0, MAX_SENTENCES - existing.length);
  for (let i = 0; picked.length < room && candidates.some((c) => i < c.length); i++) {
    for (const c of candidates) {
      const next = c[i];
      if (next && picked.length < room) picked.push(next);
    }
  }
  picked.sort((a, b) => a.paragraph - b.paragraph || a.position - b.position);
  return picked.map(({ paragraph, text, words }, i) => ({
    id: `s-${existing.length + i + 1}`,
    text,
    words,
    paragraph,
  }));
}

// ---------------------------------------------------------------- building a story

/** A validated StoryInput from one workbook; `imageCount` images are named img-N.webp. */
export function buildStory(id: string, file: string, wb: Workbook, imageCount: number): StoryInput {
  const paragraphTexts = wb.article_paragraphs.map((p) => p.text.trim());
  const story = paragraphTexts.join('\n');
  const lessonFromFile = parseLessonFromFile(file);
  const lessonFromField = Number(/(\d+)/.exec(wb.lesson_number ?? '')?.[1]);
  if (lessonFromField && lessonFromField !== lessonFromFile) {
    console.warn(
      `  note: ${id}: lesson_number says ${lessonFromField}, file name says ${lessonFromFile}; using the file name`,
    );
  }

  // Paragraphs and their translations ("Paragraph N" labels, else by position).
  const translations = new Map<number, string>();
  (wb.translation_paragraphs ?? []).forEach((t, i) => {
    const n = Number(/(\d+)/.exec(t.label ?? '')?.[1] ?? i + 1);
    translations.set(n - 1, t.text.trim());
  });
  const paragraphs: StoryParagraph[] = paragraphTexts.map((text, i) => {
    const translation = translations.get(i);
    return translation ? { text, translation } : { text };
  });

  // Vocabulary: the term in its story case, with a meaning from the workbook or the gloss table.
  let translationsGenerated = false;
  const vocabulary: StoryVocabulary[] = wb.vocabulary.map((v) => {
    const term = storyCase(v.word.trim(), story);
    let translation = v.thai_definition?.trim();
    if (!translation) {
      translation = THAI_GLOSSES[id]?.[v.word.trim().toLowerCase()];
      if (!translation) throw new Error(`${id}: no Thai meaning for "${v.word}" (add one to THAI_GLOSSES)`);
      translationsGenerated = true;
    }
    const phonetic = v.phonetic?.trim();
    return {
      id: `w-${slug(term)}`,
      term,
      translation,
      definition: v.definition.trim(),
      ...(phonetic ? { phonetic } : {}),
    };
  });

  // Questions: options without letter prefixes; the answer from the mc letter (either case).
  const answersByNumber = new Map(wb.mc_answers.map((a, i) => [a.number ?? i + 1, a]));
  const questions: StoryQuestion[] = wb.comprehension_questions.map((q, i) => {
    const n = q.number ?? i + 1;
    const mc = answersByNumber.get(n);
    if (!mc) throw new Error(`${id}: question ${n} has no mc answer`);
    const options = q.options.map(stripOptionLetter);
    const answer = letterIndex(mc.letter);
    if (answer >= options.length)
      throw new Error(`${id}: question ${n} answer "${mc.letter}" is outside its options`);
    if (mc.text && stripOptionLetter(mc.text).toLowerCase() !== options[answer]!.toLowerCase()) {
      console.warn(
        `  note: ${id}: question ${n}: answer text "${mc.text}" differs from option ${mc.letter} "${options[answer]}"`,
      );
    }
    const paragraph = findParagraph(`${q.question} ${options[answer]}`, paragraphTexts);
    return withParagraph({ id: `q-${n}`, question: q.question.trim(), options, answer }, paragraph);
  });

  // Sentences: tokens split at spaces, punctuation attached.
  const workbookSentences: StorySentence[] = (wb.sentence_order_answers ?? []).map((s, i) => {
    const text = s.sentence.trim().replace(/\s+/g, ' ');
    const paragraph = findParagraph(text, paragraphTexts);
    return withParagraph({ id: `s-${s.number ?? i + 1}`, text, words: text.split(' ') }, paragraph);
  });
  const sentences = [...workbookSentences, ...extractSentences(paragraphTexts, workbookSentences)];

  // Fills: HTML stripped, answers from the answer string in either format, in story case.
  const fillAnswers = wb.vocab_fill_answer_string
    ? parseAnswerString(wb.vocab_fill_answer_string)
    : new Map<number, string>();
  const fills: StoryFill[] = (wb.vocab_fill ?? []).map((f, i) => {
    const n = f.number ?? i + 1;
    const raw = fillAnswers.get(n);
    if (!raw) throw new Error(`${id}: fill ${n} has no answer in "${wb.vocab_fill_answer_string}"`);
    const sentence = cleanFill(f.sentence);
    const answer = storyCase(raw, story);
    const paragraph = findParagraph(sentence.replace('___', answer), paragraphTexts);
    return withParagraph({ id: `f-${n}`, sentence, answer }, paragraph);
  });

  const url = wb.article_url?.trim();
  return parseStoryInput(
    {
      schemaVersion: 1,
      id,
      title: wb.lesson_title.trim(),
      series: parseSeries(file.split('/')[0]!),
      lesson: lessonFromFile,
      level: normalizeCefrLevel(wb.cefr_level),
      genre: (wb.genre ?? wb.article_type ?? 'Story').trim(),
      paragraphs,
      images: Array.from({ length: imageCount }, (_, i) => `img-${i + 1}.webp`),
      vocabulary,
      sentences,
      fills,
      questions,
      source: {
        file: `primary/${file}`,
        ...(url ? { url } : {}),
        ...(translationsGenerated ? { translationsGenerated } : {}),
      },
    },
    `${id} story`,
  );
}

// ---------------------------------------------------------------- images

/** Downloads `url` once and writes it as WebP; keeps an existing file unless --force. */
async function importImage(url: string, target: string): Promise<void> {
  if (existsSync(target) && !FORCE) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image download failed: ${url} (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await sharp(buffer)
    .resize({ width: IMAGE_WIDTH, withoutEnlargement: true })
    .webp({ quality: IMAGE_QUALITY })
    .toFile(target);
}

// ---------------------------------------------------------------- practice sets

/** Keeps only the practice words and sentences of a story, in the practice order. */
function withPractice(story: StoryInput, practice: PracticeSet): StoryInput {
  const vocabulary = practice.words.map((word) => {
    const v = story.vocabulary.find((x) => x.term.toLowerCase() === word.toLowerCase());
    if (!v) throw new Error(`${story.id}: practice word "${word}" is not in the workbook vocabulary`);
    return v;
  });
  // Built from the article, not from the extracted list: the extractor keeps only a capped sample.
  const sentences: StorySentence[] = practice.sentences.map(({ text, translation }, i) => {
    const paragraph = story.paragraphs.findIndex((p) => p.text.includes(text));
    if (paragraph < 0) throw new Error(`${story.id}: practice sentence "${text}" is not in the article`);
    return { id: `s-${i + 1}`, text, words: text.split(' '), translation, paragraph };
  });
  return parseStoryInput({ ...story, vocabulary, sentences }, `${story.id} story`);
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  if (!existsSync(WORKBOOKS)) throw new Error(`workbook folder not found: ${WORKBOOKS} (set DEMO_WORKBOOKS)`);
  const index: StoryIndexEntry[] = [];
  for (const { id, file, practice } of STORIES) {
    const path = join(WORKBOOKS, file);
    const wb = JSON.parse(readFileSync(path, 'utf8')) as Workbook;
    const dir = join(OUT, id);
    const urls = [...new Set(wb.article_image_url ?? [])];
    if (ONLY && ONLY !== id) {
      // Not chosen: keep its current pack in the index.
      index.push(toStoryIndexEntry(parseStoryInput(JSON.parse(readFileSync(join(dir, 'story.json'), 'utf8')), id)));
      continue;
    }
    console.log(`${id} <- ${path}`);
    mkdirSync(dir, { recursive: true });
    for (const [i, url] of urls.entries()) {
      const target = join(dir, `img-${i + 1}.webp`);
      await importImage(url, target);
      console.log(`  ${basename(target)}`);
    }
    if (urls.length === 0) console.warn(`  note: ${id}: the workbook has no article images (plain cover)`);

    const story = practice ? withPractice(buildStory(id, file, wb, urls.length), practice) : buildStory(id, file, wb, urls.length);
    writeFileSync(join(dir, 'story.json'), JSON.stringify(story, null, 2) + '\n');
    console.log(
      `  story.json: ${story.level}, ${story.paragraphs.length} paragraphs, ${story.vocabulary.length} words, ` +
        `${story.sentences.length} sentences, ${story.fills.length} fills, ${story.questions.length} questions` +
        (story.source.translationsGenerated ? ' (generated translations, unreviewed)' : ''),
    );
    index.push(toStoryIndexEntry(story));
  }
  writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');
  console.log(`index.json: ${index.length} stories`);
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(import.meta.filename);
if (isMain) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
