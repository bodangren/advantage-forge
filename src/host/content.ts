/**
 * Story content for the host: the story index (with levels, for the selector) and the story
 * packs, each fetched once. In the APK the app serves the same `StoryInput` objects.
 */
import { parseStoryIndex, parseStoryInput, type StoryIndexEntry, type StoryInput } from '../apk3d/contracts/index.js';

export class Content {
  private index: Promise<StoryIndexEntry[]> | null = null;
  private readonly stories = new Map<string, Promise<StoryInput>>();

  constructor(private readonly base: string) {}

  list(): Promise<StoryIndexEntry[]> {
    this.index ??= fetch(`${this.base}stories/index.json`).then(async (r) => parseStoryIndex(await r.json()));
    return this.index;
  }

  story(id: string): Promise<StoryInput> {
    let p = this.stories.get(id);
    if (!p) {
      p = fetch(`${this.base}stories/${id}/story.json`).then(async (r) => parseStoryInput(await r.json(), id));
      p.catch(() => this.stories.delete(id));
      this.stories.set(id, p);
    }
    return p;
  }

  /** The URL of a file in a story's folder. */
  file(storyId: string, name: string): string {
    return `${this.base}stories/${storyId}/${name}`;
  }
}
