/**
 * Workbook JSON to story packs for the Monster Encounters demo.
 *
 *   node --import tsx scripts/demo-import.ts [--force]
 *
 * Reads the chosen Primary workbook files (../Workbooks/primary/**, or $DEMO_WORKBOOKS), writes
 * demo/public/stories/<id>/story.json (validated with the zod schema in src/demo/core/content.ts),
 * converts the article images to WebP (img-1.webp, ...), and writes demo/public/stories/index.json.
 * Re-runnable: images already on disk are kept unless --force is given.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import sharp from 'sharp';
import { parseStoryPack, type StoryIndexEntry } from '../src/demo/core/content.js';
import type {
  CefrLevel,
  StoryFill,
  StoryPack,
  StoryParagraph,
  StoryQuestion,
  StorySentence,
  StoryWord,
} from '../src/demo/core/types.js';

const ROOT = process.cwd();
const WORKBOOKS = process.env.DEMO_WORKBOOKS ?? resolve(ROOT, '..', 'Workbooks', 'primary');
const OUT = join(ROOT, 'demo', 'public', 'stories');
const FORCE = process.argv.includes('--force');
const IMAGE_WIDTH = 1024;
const IMAGE_QUALITY = 80;

/** The stories of the demo: id and workbook file (relative to WORKBOOKS). */
const STORIES: { id: string; file: string }[] = [
  { id: 'pip-is-brave', file: 'origins-2-a0/12-Pip is Brave _workbook.json' },
  { id: 'squeaky-the-small-mouse', file: 'origins-3.1-a0/14-Squeaky, the Small Mouse _workbook.json' },
  { id: 'pip-and-the-red-car', file: 'origins-3.1-a0/07-Pip and the Red Car _workbook.json' },
];

/**
 * Thai meanings for stories whose workbook has none. Written by a model, not by the workbook
 * generator: a Thai speaker should review them. The pack's `source.thaiGlossesGenerated` is set.
 */
const THAI_GLOSSES: Record<string, Record<string, string>> = {};

// ---------------------------------------------------------------- workbook shape (loose)

interface Workbook {
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

/** "CEFR A0" -> "A0". */
function parseLevel(raw: string): CefrLevel {
  const level = raw.replace(/^CEFR\s*/i, '').trim();
  const known: CefrLevel[] = ['Pre-A1', 'A0', 'A0+', 'A1', 'A1+', 'A2', 'B1'];
  const found = known.find((k) => k.toLowerCase() === level.toLowerCase());
  if (!found) throw new Error(`unknown CEFR level "${raw}"`);
  return found;
}

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
function storyCase(word: string, story: string): string {
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

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'to',
  'of',
  'in',
  'on',
  'at',
  'and',
  'or',
  'it',
  'this',
  'that',
  'what',
  'where',
  'how',
  'who',
  'do',
  'does',
  'did',
  'has',
  'have',
  'they',
  'we',
  'you',
  'he',
  'she',
  'her',
  'his',
  'our',
  'their',
  'with',
  'for',
  'very',
  'not',
  'there',
  'here',
  'be',
]);

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
function findParagraph(needle: string, paragraphs: readonly string[]): number | undefined {
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

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// ---------------------------------------------------------------- building a pack

function buildPack(id: string, file: string, wb: Workbook, imageCount: number): StoryPack {
  const paragraphTexts = wb.article_paragraphs.map((p) => p.text.trim());
  const story = paragraphTexts.join('\n');
  const lessonFromFile = parseLessonFromFile(file);
  const lessonFromField = Number(/(\d+)/.exec(wb.lesson_number ?? '')?.[1]);
  if (lessonFromField && lessonFromField !== lessonFromFile) {
    console.warn(
      `  note: ${id}: lesson_number says ${lessonFromField}, file name says ${lessonFromFile}; using the file name`,
    );
  }

  // Paragraphs and their Thai translations ("Paragraph N" labels, else by position).
  const translations = new Map<number, string>();
  (wb.translation_paragraphs ?? []).forEach((t, i) => {
    const n = Number(/(\d+)/.exec(t.label ?? '')?.[1] ?? i + 1);
    translations.set(n - 1, t.text.trim());
  });
  const paragraphs: StoryParagraph[] = paragraphTexts.map((text, i) => {
    const th = translations.get(i);
    return th ? { text, th } : { text };
  });

  // Vocabulary: the word in its story case, with a Thai meaning from the workbook or the gloss table.
  let thaiGlossesGenerated = false;
  const vocabulary: StoryWord[] = wb.vocabulary.map((v) => {
    const word = storyCase(v.word.trim(), story);
    let th = v.thai_definition?.trim();
    if (!th) {
      th = THAI_GLOSSES[id]?.[v.word.trim().toLowerCase()];
      if (!th) throw new Error(`${id}: no Thai meaning for "${v.word}" (add one to THAI_GLOSSES)`);
      thaiGlossesGenerated = true;
    }
    const phonetic = v.phonetic?.trim();
    return {
      id: `w-${slug(word)}`,
      word,
      th,
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
    return {
      id: `q-${n}`,
      question: q.question.trim(),
      options,
      answer,
      ...(paragraph !== undefined ? { paragraph } : {}),
    };
  });

  // Sentences: tokens split at spaces, punctuation attached.
  const sentences: StorySentence[] = (wb.sentence_order_answers ?? []).map((s, i) => {
    const answer = s.sentence.trim().replace(/\s+/g, ' ');
    const paragraph = findParagraph(answer, paragraphTexts);
    return {
      id: `s-${s.number ?? i + 1}`,
      answer,
      words: answer.split(' '),
      ...(paragraph !== undefined ? { paragraph } : {}),
    };
  });

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
    return { id: `f-${n}`, sentence, answer, ...(paragraph !== undefined ? { paragraph } : {}) };
  });

  const url = wb.article_url?.trim();
  return {
    id,
    title: wb.lesson_title.trim(),
    series: parseSeries(file.split('/')[0]!),
    lesson: lessonFromFile,
    level: parseLevel(wb.cefr_level),
    genre: (wb.genre ?? wb.article_type ?? 'Story').trim(),
    paragraphs,
    images: Array.from({ length: imageCount }, (_, i) => `img-${i + 1}.webp`),
    vocabulary,
    questions,
    sentences,
    fills,
    source: {
      file: `primary/${file}`,
      ...(url ? { url } : {}),
      ...(thaiGlossesGenerated ? { thaiGlossesGenerated } : {}),
    },
  };
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

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  if (!existsSync(WORKBOOKS)) throw new Error(`workbook folder not found: ${WORKBOOKS} (set DEMO_WORKBOOKS)`);
  const index: StoryIndexEntry[] = [];
  for (const { id, file } of STORIES) {
    const path = join(WORKBOOKS, file);
    console.log(`${id} <- ${path}`);
    const wb = JSON.parse(readFileSync(path, 'utf8')) as Workbook;
    const dir = join(OUT, id);
    mkdirSync(dir, { recursive: true });

    const urls = [...new Set(wb.article_image_url ?? [])];
    for (const [i, url] of urls.entries()) {
      const target = join(dir, `img-${i + 1}.webp`);
      await importImage(url, target);
      console.log(`  ${basename(target)}`);
    }
    if (urls.length === 0) console.warn(`  note: ${id}: the workbook has no article images`);

    const pack = parseStoryPack(buildPack(id, file, wb, urls.length), `${id} story pack`);
    writeFileSync(join(dir, 'story.json'), JSON.stringify(pack, null, 2) + '\n');
    console.log(
      `  story.json: ${pack.paragraphs.length} paragraphs, ${pack.vocabulary.length} words, ${pack.questions.length} questions, ` +
        `${pack.sentences.length} sentences, ${pack.fills.length} fills`,
    );
    index.push({
      id,
      title: pack.title,
      level: pack.level,
      series: pack.series,
      lesson: pack.lesson,
      ...(pack.images[0] ? { cover: pack.images[0] } : {}),
    });
  }
  writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');
  console.log(`index.json: ${index.length} stories`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
