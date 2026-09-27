/** Public API of the Monster Encounters game core (renderer-free). */
export type * from './types.js';
export { createRng, hashString, type Rng } from './rng.js';
export {
  parseStoryPack,
  parseStoryIndex,
  storyPackSchema,
  storyIndexSchema,
  CEFR_LEVELS,
  type StoryIndexEntry,
} from './content.js';
export {
  createQuest,
  resolveKind,
  PARTY,
  MAX_COURAGE,
  REST_COURAGE,
  HERO_DAMAGE,
  XP,
  XP_REASON,
} from './quest.js';
export { simulateClassBoss, BOSS_NAME, BOSS_HP, CLASS_SIZE, DAMAGE_PER_CORRECT } from './classBoss.js';
