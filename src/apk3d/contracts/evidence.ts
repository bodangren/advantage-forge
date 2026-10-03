/**
 * StoryGameEvidence: what a story game reports per item (section 6.3 of docs/apk3d-cartridge.md).
 * Proposed as a member of the game-contracts `learningEvidenceSchema` union at port time. The host
 * derives stars and the practice list from `items` (see results.ts); the APK receives the same
 * object in `APKHostAdapter.complete(result, outcome, evidence)`.
 */
import { z } from 'zod';
import { cefrLevelSchema } from './story-input.js';

export const storyItemKindSchema = z.enum(['word', 'sentence', 'fill', 'question']);

export type StoryItemKind = z.infer<typeof storyItemKindSchema>;

export const storyGameEvidenceItemSchema = z
  .object({
    /** The input item id (a story item id, or a flashcard record id). */
    itemId: z.string().min(1),
    itemKind: storyItemKindSchema,
    /** Short label for the results list ("brave", "Pip is a brave puppy now."). */
    label: z.string().min(1),
    /** Responses to this item, right and wrong. */
    attempts: z.number().int().min(1),
    correctFirstTry: z.boolean(),
    /** Answered correctly at some point in the run. */
    solved: z.boolean(),
    /** Zero-based paragraph to look at again, when known. */
    paragraph: z.number().int().min(0).optional(),
  })
  .strict()
  .refine((item) => !item.correctFirstTry || item.solved, {
    message: 'an item correct on the first try is solved',
    path: ['solved'],
  });

export const storyGameEvidenceSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('story-game'),
    gameId: z.string().min(1),
    /** The input id: the story id, or the saved-item set ("saved"). */
    inputId: z.string().min(1),
    level: cefrLevelSchema,
    seed: z.number().int(),
    durationMs: z.number().int().min(0),
    items: z.array(storyGameEvidenceItemSchema).max(200),
    /** Labels of items answered wrong at least once, for "practice these". */
    practice: z.array(z.string()).max(200),
  })
  .strict();

export type StoryGameEvidence = z.infer<typeof storyGameEvidenceSchema>;
export type StoryGameEvidenceItem = z.infer<typeof storyGameEvidenceItemSchema>;

/** The practice list from the items: labels of items not correct on the first try, in order. */
export function practiceOf(items: readonly StoryGameEvidenceItem[]): string[] {
  return items.filter((item) => !item.correctFirstTry).map((item) => item.label);
}
