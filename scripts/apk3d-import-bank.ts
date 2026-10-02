/**
 * Lesson packages (the "bank" articles) to StoryInput packs for the published demo.
 *
 *   node --import tsx scripts/apk3d-import-bank.ts [--force]
 *
 * Reads the chosen packages from ../Workbooks/content/primary (or $DEMO_PACKAGES), writes
 * demo/public/stories/<id>/story.json (validated with `storyInputSchema`), converts the pictures to
 * WebP (img-1.webp, ...), and writes demo/public/stories/index.json. The demo shows one extra
 * article per level (bank-1 to bank-4). These are not in the published workbooks.
 * The workbook stories stay in tests/fixtures/stories (scripts/apk3d-import.ts).
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import {
  parseStoryInput,
  toStoryIndexEntry,
  type CefrLevel,
  type StoryFill,
  type StoryIndexEntry,
  type StoryInput,
  type StoryQuestion,
} from '../src/apk3d/contracts/story-input.js';
import { extractSentences, findParagraph, slug, splitSentences, storyCase } from './apk3d-import.js';

const ROOT = process.cwd();
const PACKAGES = process.env.DEMO_PACKAGES ?? resolve(ROOT, '..', 'Workbooks', 'content', 'primary');
const OUT = join(ROOT, 'demo', 'public', 'stories');
const FORCE = process.argv.includes('--force');
const IMAGE_WIDTH = 1024;
const IMAGE_QUALITY = 80;
const MAX_FILLS = 8;

/** One extra article per level, in selector order (file relative to PACKAGES). */
export const BANK_STORIES: string[] = ['bank-1/b001', 'bank-2/b001', 'bank-3/b001', 'bank-4/b001'];

/** The package CEFR labels with a minus half step map to the demo's level labels. */
const LEVELS: Record<string, CefrLevel> = { 'A0-': 'Pre-A1', A0: 'A0', 'A0+': 'A0+', 'A1-': 'A1' };

interface Pair {
  en: string;
  th: string;
}
export interface LessonPackage {
  meta: { book: string; number: number; title: string; cefrLevel: string; genre: string; raLevel: number };
  text: { paragraphs: string[] };
  glossary: { word: string; definition: string; thai: string; example: string }[];
  bank: { mcq: { id: string; question: string; options: string[]; answer: string; evidence: string }[] };
  thai: { paragraphs: Pair[][] };
  images: { position: string; file: string }[];
  audio?: {
    article?: string;
    sentences?: { text: string; startTime: number; endTime: number }[];
    words?: string;
    wordTimes?: { text: string; startTime: number; endTime: number }[];
  };
  approval: { thai: { status: string } };
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A sentence with its first `word` (or longer form of it) written as one blank, or null. */
function blankOut(sentence: string, word: string): StoryFill | null {
  const m = new RegExp(`\\b${escapeRegExp(word)}\\w*`, 'i').exec(sentence);
  if (!m) return null;
  const blanked = `${sentence.slice(0, m.index)}___${sentence.slice(m.index + m[0].length)}`;
  return blanked.split('___').length === 2 ? { id: '', sentence: blanked, answer: m[0] } : null;
}

const span = (s: { text: string; startTime: number; endTime: number }) => ({ text: s.text, start: s.startTime, end: s.endTime });

/** The read-aloud block: each sentence tied to its paragraph, in order; null when the package has none. */
function buildAudio(id: string, pkg: LessonPackage, paragraphTexts: readonly string[]) {
  const a = pkg.audio;
  if (!a?.article || !a.sentences?.length) return null;
  let paragraph = 0;
  let cursor = 0;
  const sentences = a.sentences.map((s) => {
    for (; paragraph < paragraphTexts.length; paragraph++, cursor = 0) {
      const at = paragraphTexts[paragraph]!.indexOf(s.text, cursor);
      if (at >= 0) {
        cursor = at + s.text.length;
        return { ...span(s), paragraph };
      }
    }
    throw new Error(`${id}: audio sentence "${s.text}" is not in the story text, in order`);
  });
  return {
    article: 'article.mp3',
    sentences,
    ...(a.words && a.wordTimes?.length ? { words: 'words.mp3', wordTimes: a.wordTimes.map(span) } : {}),
  };
}

/** A validated StoryInput from one lesson package; `imageCount` pictures are named img-N.webp. */
export function buildBankStory(id: string, file: string, pkg: LessonPackage, imageCount: number): StoryInput {
  const paragraphTexts = pkg.text.paragraphs.map((p) => p.trim());
  const story = paragraphTexts.join('\n');
  const paragraphs = paragraphTexts.map((text, i) => {
    const translation = (pkg.thai.paragraphs[i] ?? []).map((pair) => pair.th.trim()).join(' ');
    return translation ? { text, translation } : { text };
  });

  const vocabulary = pkg.glossary.map((g) => {
    const term = storyCase(g.word.trim(), story);
    return { id: `w-${slug(term)}`, term, translation: g.thai.trim(), definition: g.definition.trim() };
  });

  const thaiOf = new Map(pkg.thai.paragraphs.flat().map((pair) => [pair.en.trim(), pair.th.trim()]));
  const sentences = extractSentences(paragraphTexts, []).map((s) => {
    const translation = thaiOf.get(s.text);
    return translation ? { ...s, translation } : s;
  });

  const fills: StoryFill[] = [];
  for (const g of pkg.glossary) {
    if (fills.length >= MAX_FILLS) break;
    // A quotation cut at a sentence end leaves one quote mark; drop the unpaired mark.
    const raw = splitSentences(g.example.trim())[0];
    const sentence = raw && (raw.match(/["“”]/g) ?? []).length % 2 === 1 ? raw.replace(/["“”]/g, '') : raw;
    const fill = sentence ? blankOut(sentence, g.word.trim()) : null;
    if (!fill || fills.some((f) => f.sentence === fill.sentence)) continue;
    const paragraph = findParagraph(sentence!, paragraphTexts);
    fills.push({ ...fill, id: `f-${fills.length + 1}`, ...(paragraph === undefined ? {} : { paragraph }) });
  }

  const questions: StoryQuestion[] = pkg.bank.mcq.map((q, i) => {
    const answer = q.options.indexOf(q.answer);
    if (answer < 0) throw new Error(`${id}: question ${q.id} answer "${q.answer}" is not an option`);
    const paragraph = findParagraph(q.evidence.replace(/["“”]/g, ''), paragraphTexts);
    return {
      id: `q-${i + 1}`,
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      answer,
      ...(paragraph === undefined ? {} : { paragraph }),
    };
  });

  const audio = buildAudio(id, pkg, paragraphTexts);
  const level = LEVELS[pkg.meta.cefrLevel];
  if (!level) throw new Error(`${id}: no demo level for "${pkg.meta.cefrLevel}"`);
  return parseStoryInput(
    {
      schemaVersion: 1,
      id,
      title: pkg.meta.title.trim(),
      series: `Level ${pkg.meta.raLevel}`,
      lesson: pkg.meta.number,
      level,
      genre: pkg.meta.genre.trim(),
      paragraphs,
      images: Array.from({ length: imageCount }, (_, i) => `img-${i + 1}.webp`),
      vocabulary,
      sentences,
      fills,
      questions,
      ...(audio ? { audio } : {}),
      source: {
        file: `content/primary/${file}.json`,
        ...(pkg.approval.thai.status === 'approved' ? {} : { translationsGenerated: true }),
      },
    },
    `${id} story`,
  );
}

/** Hero first, then the inline pictures in order; only files that exist. */
function pictures(pkg: LessonPackage): string[] {
  const order = (position: string) => (position === 'hero' ? 0 : 1);
  return [...pkg.images]
    .sort((a, b) => order(a.position) - order(b.position) || a.position.localeCompare(b.position))
    .map((i) => join(PACKAGES, i.file))
    .filter((f) => existsSync(f));
}

async function main(): Promise<void> {
  if (!existsSync(PACKAGES)) throw new Error(`package folder not found: ${PACKAGES} (set DEMO_PACKAGES)`);
  const index: StoryIndexEntry[] = [];
  const keep = new Set<string>();
  for (const file of BANK_STORIES) {
    const path = join(PACKAGES, `${file}.json`);
    const pkg = JSON.parse(readFileSync(path, 'utf8')) as LessonPackage;
    const id = slug(pkg.meta.title.replace(/['’]/g, ''));
    keep.add(id);
    const dir = join(OUT, id);
    mkdirSync(dir, { recursive: true });
    console.log(`${id} <- ${path}`);
    const files = pictures(pkg);
    for (const [i, source] of files.entries()) {
      const target = join(dir, `img-${i + 1}.webp`);
      if (existsSync(target) && !FORCE) continue;
      await sharp(source).resize({ width: IMAGE_WIDTH, withoutEnlargement: true }).webp({ quality: IMAGE_QUALITY }).toFile(target);
      console.log(`  ${target.split('/').pop()}`);
    }
    for (const [name, source] of [['article.mp3', pkg.audio?.article], ['words.mp3', pkg.audio?.words]] as const) {
      const from = source ? join(PACKAGES, source) : '';
      if (from && existsSync(from)) copyFileSync(from, join(dir, name));
      else if (pkg.audio?.[name === 'article.mp3' ? 'article' : 'words']) throw new Error(`${id}: the package lists ${name}, but the file is missing`);
    }
    const built = buildBankStory(id, file, pkg, files.length);
    writeFileSync(join(dir, 'story.json'), JSON.stringify(built, null, 2) + '\n');
    console.log(
      `  story.json: ${built.level}, ${built.paragraphs.length} paragraphs, ${built.vocabulary.length} words, ` +
        `${built.sentences.length} sentences, ${built.fills.length} fills, ${built.questions.length} questions`,
    );
    index.push(toStoryIndexEntry(built));
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
