/**
 * Story pack validation. The story files on disk are `StoryInput` packs written by
 * scripts/apk3d-import.ts; `toStoryPack` converts one into the `StoryPack` shape this core still
 * reads (until the core moves to src/games/monster-encounters, task 11 of docs/apk3d-cartridge.md).
 */
import { z } from 'zod';
import type { StoryInput } from '../../apk3d/contracts/story-input.js';
import type { CefrLevel, StoryPack } from './types.js';

/** The old `StoryPack` shape from a `StoryInput` (`term -> word`, `translation -> th`, `text -> answer`). */
export function toStoryPack(story: StoryInput): StoryPack {
  const { translationsGenerated, ...source } = story.source;
  return parseStoryPack(
    {
      id: story.id,
      title: story.title,
      series: story.series,
      lesson: story.lesson,
      level: story.level,
      genre: story.genre,
      paragraphs: story.paragraphs.map(({ text, translation }) => (translation ? { text, th: translation } : { text })),
      images: story.images,
      vocabulary: story.vocabulary.map(({ term, translation, ...rest }) => ({ ...rest, word: term, th: translation })),
      questions: story.questions,
      sentences: story.sentences.map(({ text, translation: _translation, ...rest }) => ({ ...rest, answer: text })),
      fills: story.fills,
      source: { ...source, ...(translationsGenerated ? { thaiGlossesGenerated: true } : {}) },
    },
    `${story.id} story pack`,
  );
}

export const CEFR_LEVELS = [
  'Pre-A1',
  'A0',
  'A0+',
  'A1',
  'A1+',
  'A2',
  'B1',
] as const satisfies readonly CefrLevel[];

const BLANK = '___';

const id = z.string().min(1);
const text = z.string().trim().min(1);

const paragraphSchema = z.object({
  text,
  th: text.optional(),
});

const wordSchema = z.object({
  id,
  word: text,
  th: text,
  definition: text,
  phonetic: text.optional(),
});

const questionSchema = z
  .object({
    id,
    question: text,
    options: z.array(text).min(2),
    answer: z.int().nonnegative(),
    paragraph: z.int().nonnegative().optional(),
  })
  .refine((q) => q.answer < q.options.length, {
    message: 'answer index is outside options',
    path: ['answer'],
  })
  .refine((q) => new Set(q.options).size === q.options.length, {
    message: 'duplicate options',
    path: ['options'],
  });

const sentenceSchema = z
  .object({
    id,
    answer: text,
    words: z.array(text).min(1),
    paragraph: z.int().nonnegative().optional(),
  })
  .refine((s) => s.words.join(' ') === s.answer, { message: 'words do not join to answer', path: ['words'] });

const fillSchema = z
  .object({
    id,
    sentence: text,
    answer: text,
    paragraph: z.int().nonnegative().optional(),
  })
  .refine((f) => f.sentence.split(BLANK).length === 2, {
    message: `sentence needs exactly one "${BLANK}"`,
    path: ['sentence'],
  })
  .refine((f) => !/<[a-z/][^>]*>/i.test(f.sentence), {
    message: 'sentence contains HTML',
    path: ['sentence'],
  });

const uniqueIds = (items: readonly { id: string }[]) => new Set(items.map((i) => i.id)).size === items.length;

export const storyPackSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'id must be lowercase letters, digits, and dashes'),
    title: text,
    series: text,
    lesson: z.int().positive(),
    level: z.enum(CEFR_LEVELS),
    genre: text,
    paragraphs: z.array(paragraphSchema).min(1),
    images: z.array(z.string().regex(/^[a-z0-9-]+\.(webp|png|jpg)$/)),
    vocabulary: z.array(wordSchema),
    questions: z.array(questionSchema),
    sentences: z.array(sentenceSchema),
    fills: z.array(fillSchema),
    source: z.object({
      file: text,
      url: z.string().optional(),
      thaiGlossesGenerated: z.boolean().optional(),
    }),
  })
  .superRefine((pack, ctx) => {
    for (const key of ['vocabulary', 'questions', 'sentences', 'fills'] as const) {
      if (!uniqueIds(pack[key])) ctx.addIssue({ code: 'custom', message: 'duplicate ids', path: [key] });
    }
    for (const key of ['questions', 'sentences', 'fills'] as const) {
      pack[key].forEach((item, i) => {
        if (item.paragraph !== undefined && item.paragraph >= pack.paragraphs.length) {
          ctx.addIssue({
            code: 'custom',
            message: 'paragraph index is outside paragraphs',
            path: [key, i, 'paragraph'],
          });
        }
      });
    }
    if (pack.vocabulary.length + pack.questions.length + pack.sentences.length + pack.fills.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'a story needs at least one word, question, sentence, or fill',
      });
    }
  });

/** Validates a story pack; throws an Error with a readable list of problems when it is not one. */
export function parseStoryPack(json: unknown, label = 'story pack'): StoryPack {
  const result = storyPackSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid ${label}:\n${z.prettifyError(result.error)}`);
  }
  return result.data as StoryPack;
}

/** One row of demo/public/stories/index.json. */
export interface StoryIndexEntry {
  id: string;
  title: string;
  level: CefrLevel;
  series: string;
  lesson: number;
  /** Cover image path relative to the story folder; absent when the story has no images. */
  cover?: string;
}

export const storyIndexSchema = z.array(
  z.object({
    id: z.string().min(1),
    title: text,
    level: z.enum(CEFR_LEVELS),
    series: text,
    lesson: z.int().positive(),
    cover: z.string().optional(),
  }),
);

export function parseStoryIndex(json: unknown): StoryIndexEntry[] {
  const result = storyIndexSchema.safeParse(json);
  if (!result.success) throw new Error(`Invalid story index:\n${z.prettifyError(result.error)}`);
  return result.data as StoryIndexEntry[];
}
