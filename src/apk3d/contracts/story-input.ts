/**
 * StoryInput: one validated story as the games receive it (section 5 of docs/apk3d-cartridge.md).
 *
 * It is the old demo `StoryPack` with the vocabulary fields renamed so that a vocabulary item is
 * `VocabularyItem`-compatible (`word -> term`, `th -> translation`), and the same rename on
 * paragraphs and sentences (`answer -> text`). `fromStoryPack` converts the old shape; the
 * importer (scripts/apk3d-import.ts) writes the new one. Proposed for `game-contracts` at port
 * time as `story-input.ts`.
 */
import { z } from 'zod';
import type { Cartridge3DManifest } from './manifest.js';
import type { SentenceInput, VocabularyInput } from './apk.js';

// ---------------------------------------------------------------- CEFR level

/** CEFR level labels as shown to teachers. The `+` levels are half steps. */
export const CEFR_LEVELS = ['Pre-A1', 'A0', 'A0+', 'A1', 'A1+', 'A2', 'B1'] as const;

export const cefrLevelSchema = z.enum(CEFR_LEVELS);

export type CefrLevel = z.infer<typeof cefrLevelSchema>;

/**
 * The level from a workbook `cefr_level` value. The real values are "CEFR A0", "CEFR A0+", and
 * "A1": the optional "CEFR " prefix goes, the rest must be a `cefrLevelSchema` member.
 * @throws when the rest is not a known level.
 */
export function normalizeCefrLevel(raw: string): CefrLevel {
  const label = raw.trim().replace(/^cefr\s+/i, '');
  const result = cefrLevelSchema.safeParse(label);
  if (!result.success) throw new Error(`unknown CEFR level "${raw}"`);
  return result.data;
}

/** The level without its `+` half step: 'A0+' -> 'A0'. The selector chips use base levels. */
export function baseLevel(level: CefrLevel): CefrLevel {
  return level.endsWith('+') ? cefrLevelSchema.parse(level.slice(0, -1)) : level;
}

// ---------------------------------------------------------------- the story

const BLANK = '___';

const id = z.string().min(1);
const text = z.string().trim().min(1);
const paragraphIndex = z.number().int().nonnegative();

export const storyParagraphSchema = z
  .object({
    /** English paragraph text as the student reads it. */
    text,
    /** Translation of the paragraph (the reader's translation toggle). */
    translation: text.optional(),
  })
  .strict();

export const storyVocabularySchema = z
  .object({
    /** Stable id within the story, e.g. "w-brave". */
    id,
    /** The English word or phrase, in the case it has in the story ("comes near"). */
    term: text,
    /** Short meaning in the student's language (the workbook's thai_definition). */
    translation: text,
    /** Simple English definition. */
    definition: text,
    phonetic: text.optional(),
  })
  .strict();

export const storySentenceSchema = z
  .object({
    id,
    /** The correct sentence ("Pip is a brave puppy now."). */
    text,
    /** Its words (tokens) in the correct order; punctuation stays attached to its word. */
    words: z.array(text).min(2),
    translation: text.optional(),
    /** Zero-based paragraph the sentence comes from. */
    paragraph: paragraphIndex.optional(),
  })
  .strict()
  .refine((s) => s.words.join(' ') === s.text, { message: 'words do not join to text', path: ['words'] });

export const storyFillSchema = z
  .object({
    id,
    /** The sentence with exactly one blank written as "___" ("Pip is a ___."). */
    sentence: text,
    /** The word that fills the blank. */
    answer: text,
    paragraph: paragraphIndex.optional(),
  })
  .strict()
  .refine((f) => f.sentence.split(BLANK).length === 2, {
    message: `sentence needs exactly one "${BLANK}"`,
    path: ['sentence'],
  })
  .refine((f) => !/<[a-z/][^>]*>/i.test(f.sentence), {
    message: 'sentence contains HTML',
    path: ['sentence'],
  });

export const storyQuestionSchema = z
  .object({
    id,
    question: text,
    options: z.array(text).min(2),
    /** Index of the correct option in `options`. */
    answer: z.number().int().nonnegative(),
    /** Zero-based paragraph that best supports the answer (for "look again" feedback). */
    paragraph: paragraphIndex.optional(),
  })
  .strict()
  .refine((q) => q.answer < q.options.length, {
    message: 'answer index is outside options',
    path: ['answer'],
  })
  .refine((q) => new Set(q.options).size === q.options.length, {
    message: 'duplicate options',
    path: ['options'],
  });

export const storySourceSchema = z
  .object({
    /** Workbook file the story came from, relative to the workbooks root. */
    file: text,
    url: z.string().optional(),
    /** True when a model wrote the translations (a native speaker should review them). */
    translationsGenerated: z.boolean().optional(),
  })
  .strict();

const audioFile = z.string().regex(/^[a-z0-9-]+\.(mp3|ogg|m4a)$/);
const audioSpan = z.object({ text, start: z.number().nonnegative(), end: z.number().positive() }).strict();

/**
 * Recorded read-aloud: one file for the whole story (each sentence is a time span in it, in story
 * order) and one file with the glossary words (a time span for each). Files sit in the story folder.
 */
export const storyAudioSchema = z
  .object({
    article: audioFile,
    sentences: z.array(audioSpan.extend({ paragraph: paragraphIndex })).min(1),
    words: audioFile.optional(),
    wordTimes: z.array(audioSpan).optional(),
  })
  .strict()
  .refine((a) => a.sentences.every((s) => s.end > s.start), { message: 'a sentence ends before it starts', path: ['sentences'] });

const uniqueIds = (items: readonly { id: string }[]) => new Set(items.map((i) => i.id)).size === items.length;

export const storyInputSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^[a-z0-9-]+$/, 'id must be lowercase letters, digits, and dashes'),
    title: text,
    /** Series and lesson, e.g. "Origins 2", 12. */
    series: text,
    lesson: z.number().int().positive(),
    level: cefrLevelSchema,
    genre: text,
    paragraphs: z.array(storyParagraphSchema).min(1),
    /** Image paths relative to the story folder ("img-1.webp"). */
    images: z.array(z.string().regex(/^[a-z0-9-]+\.(webp|png|jpg)$/)),
    vocabulary: z.array(storyVocabularySchema),
    sentences: z.array(storySentenceSchema),
    fills: z.array(storyFillSchema),
    questions: z.array(storyQuestionSchema),
    source: storySourceSchema,
    audio: storyAudioSchema.optional(),
  })
  .strict()
  .superRefine((story, ctx) => {
    for (const key of ['vocabulary', 'sentences', 'fills', 'questions'] as const) {
      if (!uniqueIds(story[key])) ctx.addIssue({ code: 'custom', message: 'duplicate ids', path: [key] });
    }
    for (const key of ['sentences', 'fills', 'questions'] as const) {
      story[key].forEach((item, i) => {
        if (item.paragraph !== undefined && item.paragraph >= story.paragraphs.length) {
          ctx.addIssue({
            code: 'custom',
            message: 'paragraph index is outside paragraphs',
            path: [key, i, 'paragraph'],
          });
        }
      });
    }
    if (
      story.vocabulary.length + story.sentences.length + story.fills.length + story.questions.length ===
      0
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'a story needs at least one word, sentence, fill, or question',
      });
    }
  });

export type StoryInput = z.infer<typeof storyInputSchema>;
export type StoryAudio = z.infer<typeof storyAudioSchema>;
export type StoryParagraph = z.infer<typeof storyParagraphSchema>;
export type StoryVocabulary = z.infer<typeof storyVocabularySchema>;
export type StorySentence = z.infer<typeof storySentenceSchema>;
export type StoryFill = z.infer<typeof storyFillSchema>;
export type StoryQuestion = z.infer<typeof storyQuestionSchema>;

/** Validates a story; throws an Error with a readable list of problems when it is not one. */
export function parseStoryInput(json: unknown, label = 'story'): StoryInput {
  const result = storyInputSchema.safeParse(json);
  if (!result.success) throw new Error(`Invalid ${label}:\n${z.prettifyError(result.error)}`);
  return result.data;
}

// ---------------------------------------------------------------- the story index

/** One row of demo/public/stories/index.json: enough for the selector without loading a pack. */
export const storyIndexEntrySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: text,
    level: cefrLevelSchema,
    series: text,
    lesson: z.number().int().positive(),
    /** Cover image path relative to the story folder; absent when the story has no images. */
    cover: z.string().optional(),
    /** False while generated translations wait for a native speaker's review (owner decision). */
    reviewed: z.boolean(),
  })
  .strict();

export const storyIndexSchema = z
  .array(storyIndexEntrySchema)
  .refine(uniqueIds, { message: 'duplicate story ids' });

export type StoryIndexEntry = z.infer<typeof storyIndexEntrySchema>;

export function parseStoryIndex(json: unknown): StoryIndexEntry[] {
  const result = storyIndexSchema.safeParse(json);
  if (!result.success) throw new Error(`Invalid story index:\n${z.prettifyError(result.error)}`);
  return result.data;
}

/** The index row for a story. `cover` is its first image. */
export function toStoryIndexEntry(story: StoryInput): StoryIndexEntry {
  const cover = story.images[0];
  return {
    id: story.id,
    title: story.title,
    level: story.level,
    series: story.series,
    lesson: story.lesson,
    ...(cover === undefined ? {} : { cover }),
    reviewed: story.source.translationsGenerated !== true,
  };
}

// ---------------------------------------------------------------- derived inputs (section 5.2)

/** The story's vocabulary in the APK `VocabularyInput` shape (vocabulary-mode games). */
export function toVocabularyInput(story: StoryInput): VocabularyInput {
  return story.vocabulary.map(({ term, translation }) => ({ term, translation }));
}

/** The story's sentences in the APK `SentenceInput` shape; the words come from `term.split(' ')`. */
export function toSentenceInput(story: StoryInput): SentenceInput {
  return story.sentences.map((s) => ({ term: s.text, translation: s.translation ?? '' }));
}

// ---------------------------------------------------------------- compatibility (section 5.4)

/** True when the game supports the story's level and the story has enough items for it. */
export function isCompatible(
  manifest: Pick<Cartridge3DManifest, 'levels' | 'needs'>,
  story: StoryInput,
): boolean {
  return (
    manifest.levels.includes(story.level) &&
    story.vocabulary.length >= manifest.needs.vocabulary &&
    story.sentences.length >= manifest.needs.sentences &&
    story.fills.length >= manifest.needs.fills &&
    story.questions.length >= manifest.needs.questions
  );
}

// ---------------------------------------------------------------- the practice input

/**
 * PracticeInput: what a practice game reads. In Primary Advantage the items are the student's
 * saved flashcards (the ids are the record ids); in the demo they are a story's items. Every
 * `StoryInput` is a valid `PracticeInput`, so a game typed on it plays both.
 */
export const practiceWordSchema = storyVocabularySchema.extend({ definition: text.optional() }).strict();

export const practiceSentenceSchema = storySentenceSchema;

export const practiceInputSchema = z
  .object({
    schemaVersion: z.literal(1),
    /** The story id, or the name of the saved-item set ("saved"). */
    id,
    level: cefrLevelSchema,
    vocabulary: z.array(practiceWordSchema),
    sentences: z.array(practiceSentenceSchema),
  })
  .strict()
  .superRefine((input, ctx) => {
    for (const key of ['vocabulary', 'sentences'] as const) {
      if (!uniqueIds(input[key])) ctx.addIssue({ code: 'custom', message: 'duplicate ids', path: [key] });
    }
  });

export type PracticeInput = z.infer<typeof practiceInputSchema>;
export type PracticeWord = z.infer<typeof practiceWordSchema>;
export type PracticeSentence = z.infer<typeof practiceSentenceSchema>;

export function parsePracticeInput(json: unknown, label = 'practice input'): PracticeInput {
  const result = practiceInputSchema.safeParse(json);
  if (!result.success) throw new Error(`Invalid ${label}:\n${z.prettifyError(result.error)}`);
  return result.data;
}

/** The practice part of a story: its id, level, words, and sentences. */
export function toPracticeInput(story: StoryInput): PracticeInput {
  return { schemaVersion: 1, id: story.id, level: story.level, vocabulary: story.vocabulary, sentences: story.sentences };
}

/**
 * The items a game still needs from the input: 0 and 0 when it can play. A locked game shows
 * these numbers ("save 2 more sentences").
 */
export function missingFor(
  manifest: Pick<Cartridge3DManifest, 'needs'>,
  input: Pick<PracticeInput, 'vocabulary' | 'sentences'>,
): { vocabulary: number; sentences: number } {
  return {
    vocabulary: Math.max(0, manifest.needs.vocabulary - input.vocabulary.length),
    sentences: Math.max(0, manifest.needs.sentences - input.sentences.length),
  };
}

// ---------------------------------------------------------------- migration from the demo StoryPack

/** The old demo `StoryPack` shape (src/demo/core/types.ts) as JSON; unknown keys are dropped. */
const legacyStoryPackSchema = z.object({
  id: z.string(),
  title: z.string(),
  series: z.string(),
  lesson: z.number(),
  level: z.string(),
  genre: z.string(),
  paragraphs: z.array(z.object({ text: z.string(), th: z.string().optional() })),
  images: z.array(z.string()),
  vocabulary: z.array(
    z.object({
      id: z.string(),
      word: z.string(),
      th: z.string(),
      definition: z.string(),
      phonetic: z.string().optional(),
    }),
  ),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()),
      answer: z.number(),
      paragraph: z.number().optional(),
    }),
  ),
  sentences: z.array(
    z.object({
      id: z.string(),
      answer: z.string(),
      words: z.array(z.string()),
      paragraph: z.number().optional(),
    }),
  ),
  fills: z.array(
    z.object({ id: z.string(), sentence: z.string(), answer: z.string(), paragraph: z.number().optional() }),
  ),
  source: z.object({
    file: z.string(),
    url: z.string().optional(),
    thaiGlossesGenerated: z.boolean().optional(),
  }),
});

export type LegacyStoryPack = z.infer<typeof legacyStoryPackSchema>;

const withOptional = <T extends object, K extends string, V>(base: T, key: K, value: V | undefined) =>
  value === undefined ? base : { ...base, [key]: value };

/**
 * Converts an old demo story pack (`word`/`th`/`answer` fields) into a validated `StoryInput`.
 * The migration script uses it once; the games never see the old shape.
 */
export function fromStoryPack(json: unknown, label = 'story pack'): StoryInput {
  const pack = legacyStoryPackSchema.parse(json);
  const { thaiGlossesGenerated, ...source } = pack.source;
  return parseStoryInput(
    {
      schemaVersion: 1,
      id: pack.id,
      title: pack.title,
      series: pack.series,
      lesson: pack.lesson,
      level: normalizeCefrLevel(pack.level),
      genre: pack.genre,
      paragraphs: pack.paragraphs.map(({ text, th }) => withOptional({ text }, 'translation', th)),
      images: pack.images,
      vocabulary: pack.vocabulary.map(({ id, word, th, definition, phonetic }) =>
        withOptional({ id, term: word, translation: th, definition }, 'phonetic', phonetic),
      ),
      sentences: pack.sentences.map(({ id, answer, words, paragraph }) =>
        withOptional({ id, text: answer, words }, 'paragraph', paragraph),
      ),
      fills: pack.fills.map(({ id, sentence, answer, paragraph }) =>
        withOptional({ id, sentence, answer }, 'paragraph', paragraph),
      ),
      questions: pack.questions.map(({ id, question, options, answer, paragraph }) =>
        withOptional({ id, question, options, answer }, 'paragraph', paragraph),
      ),
      source: withOptional(source, 'translationsGenerated', thaiGlossesGenerated),
    },
    label,
  );
}
