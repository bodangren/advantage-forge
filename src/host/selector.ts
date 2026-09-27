/**
 * The front screen: choose a level (A0, A1, A2), a story, and a game, on one screen over the 3D
 * lobby. Levels with no stories show "Coming soon"; games that do not fit the story are hidden;
 * games that are not built yet show "Coming soon". The student always reads before playing.
 */
import { baseLevel, type StoryIndexEntry, type StoryInput, type Translate } from '../apk3d/contracts/index.js';
import { esc } from '../apk3d/hud/index.js';
import { fits, GAMES, playable, type GameEntry } from './registry.js';

const LEVELS = ['A0', 'A1', 'A2'] as const;

export interface SelectorChoice {
  level: string;
  story: string | null;
  game: string | null;
  helper: boolean;
}

export interface SelectorHandlers {
  /** A story was chosen: the host loads it (for the game rule) and calls `setStory`. */
  story(id: string): void;
  /** Any choice changed (for saving and for the lobby). */
  change(choice: SelectorChoice): void;
  read(choice: SelectorChoice): void;
  tap(): void;
}

export class Selector {
  private choice: SelectorChoice;
  private stories: StoryIndexEntry[] = [];
  private loaded: StoryInput | null = null;

  constructor(
    private readonly el: HTMLElement,
    private readonly t: Translate,
    private readonly coverUrl: (entry: StoryIndexEntry) => string | null,
    private readonly on: SelectorHandlers,
    initial: Partial<SelectorChoice>,
  ) {
    this.choice = { level: initial.level ?? 'A0', story: initial.story ?? null, game: initial.game ?? null, helper: initial.helper ?? true };
    el.addEventListener('click', (e) => this.click(e));
    el.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.matches('[data-helper]')) {
        this.choice.helper = input.checked;
        this.on.change({ ...this.choice });
      }
    });
  }

  setStories(stories: StoryIndexEntry[]): void {
    this.stories = stories;
    if (!this.levelHasStories(this.choice.level)) this.choice.level = LEVELS.find((l) => this.levelHasStories(l)) ?? 'A0';
    const inLevel = this.storiesInLevel();
    if (!inLevel.some((s) => s.id === this.choice.story)) this.choice.story = inLevel[0]?.id ?? null;
    this.render();
    if (this.choice.story) this.on.story(this.choice.story);
  }

  /** The chosen story's pack, loaded: the game strip now shows only games that fit it. */
  setStory(story: StoryInput): void {
    if (story.id !== this.choice.story) return;
    this.loaded = story;
    const game = this.choice.game ? GAMES.find((g) => g.id === this.choice.game) : undefined;
    if (!game || !fits(game, story)) this.choice.game = GAMES.find((g) => fits(g, story))?.id ?? null;
    this.renderGames();
    this.renderAction();
    this.on.change({ ...this.choice });
  }

  private levelHasStories(level: string): boolean {
    return this.stories.some((s) => baseLevel(s.level) === level);
  }

  private storiesInLevel(): StoryIndexEntry[] {
    return this.stories.filter((s) => baseLevel(s.level) === this.choice.level);
  }

  private render(): void {
    const t = this.t;
    this.el.innerHTML = `
      <header class="brand">
        <div class="logo">${esc(t('host.brand'))}</div>
        <div class="tag">${esc(t('host.tagline'))}</div>
      </header>
      <div class="sheet">
        <div class="levels" role="radiogroup" aria-label="${esc(t('host.selector.level'))}">
          <span class="label">${esc(t('host.selector.level'))}</span>
          ${LEVELS.map((l) => {
            const has = this.levelHasStories(l);
            return `<button class="lvl ${l === this.choice.level ? 'on' : ''}" data-level="${l}" role="radio" aria-checked="${l === this.choice.level}" ${has ? '' : 'disabled'}>${l}${has ? '' : `<small>${esc(t('host.selector.comingSoon'))}</small>`}</button>`;
          }).join('')}
        </div>
        <h2>${esc(t('host.selector.story'))}</h2>
        <div class="strip stories" data-stories></div>
        <h2>${esc(t('host.selector.game'))}</h2>
        <div class="strip games" data-games></div>
        <div class="row"><label class="toggle"><input type="checkbox" data-helper ${this.choice.helper ? 'checked' : ''} /> ${esc(t('host.selector.helper'))}</label></div>
        <button class="btn gold wide" data-read>${esc(t('host.selector.read'))}</button>
        <div class="foot">${esc(t('host.selector.foot'))}</div>
      </div>`;
    this.renderStories();
    this.renderGames();
    this.renderAction();
  }

  private renderStories(): void {
    const box = this.el.querySelector<HTMLElement>('[data-stories]');
    if (!box) return;
    box.innerHTML = this.storiesInLevel()
      .map((s) => {
        const url = this.coverUrl(s);
        const cover = url ? `<img src="${esc(url)}" alt="" loading="lazy" />` : `<div class="plain-cover" aria-hidden="true">📖<b>${esc(s.title.slice(0, 1))}</b></div>`;
        return `<button class="story-card ${s.id === this.choice.story ? 'sel' : ''}" data-story="${esc(s.id)}">${cover}<div>${esc(s.title)}<br /><span class="pill">${esc(s.level)}</span></div></button>`;
      })
      .join('');
    box.querySelector('.sel')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  private renderGames(): void {
    const box = this.el.querySelector<HTMLElement>('[data-games]');
    if (!box) return;
    const t = this.t;
    const story = this.loaded?.id === this.choice.story ? this.loaded : null;
    const shown = GAMES.filter((g) => !playable(g) || fits(g, story));
    box.innerHTML = shown.length
      ? shown
          .map((g: GameEntry) => {
            const ready = playable(g);
            return `<button class="game-card ${g.id === this.choice.game ? 'sel' : ''} ${ready ? '' : 'soon'}" data-game="${esc(g.id)}" ${ready ? '' : 'aria-disabled="true"'}>
              <span class="tile" style="background:linear-gradient(160deg, ${g.tint[0]}, ${g.tint[1]})">${g.icon}</span>
              <b>${esc(t(g.titleKey))}</b>
              <small>${esc(ready ? t(g.pitchKey) : t('host.games.comingSoon'))}</small>
            </button>`;
          })
          .join('')
      : `<p class="empty">${esc(t('host.selector.noGame'))}</p>`;
  }

  private renderAction(): void {
    const read = this.el.querySelector<HTMLButtonElement>('[data-read]');
    if (read) read.disabled = !this.choice.story || !this.choice.game;
  }

  private click(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    const level = t.closest<HTMLButtonElement>('[data-level]');
    if (level && !level.disabled) {
      this.choice.level = level.dataset.level!;
      this.choice.story = this.storiesInLevel()[0]?.id ?? null;
      this.loaded = null;
      this.on.tap();
      this.render();
      if (this.choice.story) this.on.story(this.choice.story);
      this.on.change({ ...this.choice });
      return;
    }
    const story = t.closest<HTMLElement>('[data-story]');
    if (story) {
      this.choice.story = story.dataset.story!;
      this.on.tap();
      this.el.querySelectorAll('.story-card').forEach((c) => c.classList.toggle('sel', c === story));
      this.on.story(this.choice.story);
      this.renderAction();
      return;
    }
    const game = t.closest<HTMLElement>('[data-game]');
    if (game) {
      if (game.classList.contains('soon')) {
        game.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 220 });
        return;
      }
      this.choice.game = game.dataset.game!;
      this.on.tap();
      this.el.querySelectorAll('.game-card').forEach((c) => c.classList.toggle('sel', c === game));
      this.renderAction();
      this.on.change({ ...this.choice });
      return;
    }
    if (t.closest('[data-read]') && this.choice.story && this.choice.game) this.on.read({ ...this.choice });
  }
}
