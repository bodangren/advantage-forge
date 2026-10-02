import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseStoryIndex, parseStoryInput } from '../../src/apk3d/contracts/index.js';

const DIR = join(process.cwd(), 'demo', 'public', 'stories');
const index = parseStoryIndex(JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8')));
const THAI = /[฀-๿]/;

describe('the published demo stories (one extra article per level)', () => {
  it('lists four stories, one for each of Pre-A1, A0, A0+ and A1', () => {
    expect(index.map((s) => s.level)).toEqual(['Pre-A1', 'A0', 'A0+', 'A1']);
  });

  for (const entry of index) {
    describe(entry.id, () => {
      const story = parseStoryInput(JSON.parse(readFileSync(join(DIR, entry.id, 'story.json'), 'utf8')), entry.id);

      it('has a Thai translation for every paragraph and every word', () => {
        expect(story.paragraphs.every((p) => THAI.test(p.translation ?? ''))).toBe(true);
        expect(story.vocabulary.every((w) => THAI.test(w.translation))).toBe(true);
      });

      it('has recorded audio whose files exist and whose sentences follow the story', () => {
        const audio = story.audio!;
        expect(existsSync(join(DIR, entry.id, audio.article))).toBe(true);
        expect(existsSync(join(DIR, entry.id, audio.words!))).toBe(true);
        audio.sentences.forEach((s, i) => {
          expect(story.paragraphs[s.paragraph]!.text).toContain(s.text);
          if (i > 0) expect(s.start).toBeGreaterThanOrEqual(audio.sentences[i - 1]!.end);
        });
        for (const w of audio.wordTimes!) expect(w.end).toBeGreaterThan(w.start);
      });

      it('has its pictures', () => {
        for (const image of story.images) expect(existsSync(join(DIR, entry.id, image))).toBe(true);
      });
    });
  }
});
