/**
 * The story reader, the same for every game: the student reads first. Pictures and paragraphs,
 * story words to tap for their meaning, a translation per paragraph, and read-aloud. In look-back
 * mode (from a game) it opens at a paragraph over the paused game and returns to it.
 */
import type { StoryInput, Translate } from '../apk3d/contracts/index.js';
import { canSpeak, speak, stopSpeaking } from '../apk3d/audio/index.js';
import { esc } from '../apk3d/hud/index.js';

type Word = StoryInput['vocabulary'][number];

export interface ReaderHandlers {
  /** The end button in read mode (on to the game's start screen). */
  next(): void;
  /** Back: to the selector (read mode) or to the game (look-back mode). */
  back(): void;
  tap(): void;
  page(): void;
}

export class Reader {
  private story: StoryInput | null = null;
  private readonly gloss: HTMLElement;

  constructor(
    private readonly el: HTMLElement,
    private readonly t: Translate,
    private readonly file: (storyId: string, name: string) => string,
    private readonly on: ReaderHandlers,
  ) {
    this.gloss = document.createElement('div');
    this.gloss.className = 'gloss';
    this.gloss.setAttribute('role', 'dialog');
    document.body.append(this.gloss);
    this.el.addEventListener('click', (e) => this.click(e));
    this.gloss.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.close')) this.gloss.classList.remove('on');
      const say = target.closest<HTMLElement>('[data-say]');
      if (say) void speak(say.dataset.say ?? '', 0.75);
    });
  }

  /** Words of the story that are highlighted, longest first so "comes near" beats "near". */
  private matcher(words: readonly Word[]): RegExp | null {
    const list = [...words].sort((a, b) => b.term.length - a.term.length).map((w) => w.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return list.length ? new RegExp(`\\b(${list.join('|')})\\b`, 'gi') : null;
  }

  private markup(text: string, words: readonly Word[], re: RegExp | null): string {
    if (!re) return esc(text);
    let out = '';
    let last = 0;
    for (const m of text.matchAll(re)) {
      const word = words.find((w) => w.term.toLowerCase() === m[0].toLowerCase());
      out += esc(text.slice(last, m.index));
      out += word ? `<button class="vocab" data-word="${esc(word.id)}">${esc(m[0])}</button>` : esc(m[0]);
      last = (m.index ?? 0) + m[0].length;
    }
    return out + esc(text.slice(last));
  }

  /** `gameTitle` names the game on the end button in read mode. */
  show(story: StoryInput, mode: 'read' | 'lookback', gameTitle: string, paragraph?: number): void {
    const t = this.t;
    this.story = story;
    const re = this.matcher(story.vocabulary);
    const paras = story.paragraphs
      .map((p, i) => {
        const image = story.images[i];
        const img = image ? `<img src="${esc(this.file(story.id, image))}" alt="" loading="${i ? 'lazy' : 'eager'}" />` : '';
        const tr = p.translation ? `<div class="th" hidden>${esc(p.translation)}</div>` : '';
        const tools = [canSpeak ? `<button data-read="${i}">${esc(t('host.reader.readToMe'))}</button>` : '', p.translation ? `<button data-th="${i}">${esc(t('host.reader.thai'))}</button>` : ''].join('');
        return `<section class="para" data-p="${i}">${img}<p>${this.markup(p.text, story.vocabulary, re)}</p>${tr}<div class="tools">${tools}</div></section>`;
      })
      .join('');
    const end =
      mode === 'read'
        ? `<div class="end"><p>${esc(t('host.reader.finished'))}</p><button class="btn gold" data-next>${esc(t('host.reader.next', { game: gameTitle }))}</button></div>`
        : `<div class="end"><button class="btn" data-back>${esc(t('host.reader.backToGame'))}</button></div>`;
    this.el.innerHTML = `
      <div class="top">
        <button class="btn ghost" data-back aria-label="${esc(t('host.back'))}" style="padding:6px 12px;font-size:16px">←</button>
        <h1>${esc(story.title)}</h1>
        <span class="pill">${esc(story.level)}</span>
      </div>
      <div class="page">
        <div class="hint">${mode === 'read' ? t('host.reader.readHint') : esc(t('host.reader.lookHint'))}</div>
        ${paras}
        ${end}
      </div>`;
    this.gloss.classList.remove('on');
    if (paragraph !== undefined) {
      const target = this.el.querySelector<HTMLElement>(`[data-p="${paragraph}"]`);
      requestAnimationFrame(() => {
        target?.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
        this.el.scrollTop -= 60;
        target?.classList.add('flash');
      });
    } else this.el.scrollTop = 0;
  }

  hide(): void {
    stopSpeaking();
    this.gloss.classList.remove('on');
  }

  private click(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const story = this.story;
    if (!story) return;
    const vocab = target.closest<HTMLElement>('.vocab');
    if (vocab) {
      const w = story.vocabulary.find((x) => x.id === vocab.dataset.word);
      if (w) this.showGloss(w);
      this.on.tap();
      return;
    }
    const th = target.closest<HTMLElement>('[data-th]');
    if (th) {
      const box = this.el.querySelector<HTMLElement>(`[data-p="${th.dataset.th}"] .th`);
      if (box) box.hidden = !box.hidden;
      this.on.page();
      return;
    }
    const read = target.closest<HTMLElement>('[data-read]');
    if (read) {
      const p = story.paragraphs[Number(read.dataset.read)];
      if (p) void speak(p.text);
      return;
    }
    if (target.closest('[data-next]')) {
      this.hide();
      this.on.next();
      return;
    }
    if (target.closest('[data-back]')) {
      this.hide();
      this.on.back();
    }
  }

  private showGloss(w: Word): void {
    const t = this.t;
    this.gloss.innerHTML = `
      <button class="close" aria-label="${esc(t('host.reader.close'))}">✕</button>
      <div class="w">${esc(w.term)} ${canSpeak ? `<button class="btn soft" data-say="${esc(w.term)}" aria-label="${esc(t('host.reader.listen'))}" style="padding:4px 10px;font-size:16px">🔊</button>` : ''}</div>
      ${w.phonetic ? `<div class="ph">${esc(w.phonetic)}</div>` : ''}
      <div class="thm">${esc(w.translation)}</div>
      <div class="def">${esc(w.definition)}</div>`;
    this.gloss.classList.add('on');
  }
}
