/**
 * The story reader: the student reads first. Pictures and paragraphs, story words to tap for their
 * Thai meaning, a Thai translation per paragraph, and read-aloud. In look-back mode (from the
 * battle) it opens at a paragraph and returns to the fight.
 */
import type { StoryPack, StoryWord } from '../core/types.js';
import { sound } from './audio.js';
import { canSpeak, speak, stopSpeaking } from './speech.js';

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export interface ReaderHandlers {
  /** "Start the quest" at the end of the story. */
  start(): void;
  /** Back: to the title (read mode) or to the battle (look-back mode). */
  back(): void;
}

export class Reader {
  private pack: StoryPack | null = null;
  private gloss: HTMLElement;

  constructor(private readonly el: HTMLElement, private readonly base: string, private readonly on: ReaderHandlers) {
    this.gloss = document.createElement('div');
    this.gloss.className = 'gloss';
    document.body.append(this.gloss);
    this.el.addEventListener('click', (e) => this.click(e));
    this.gloss.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('.close')) this.gloss.classList.remove('on');
      const say = t.closest<HTMLElement>('[data-say]');
      if (say) void speak(say.dataset.say ?? '', 0.75);
    });
  }

  /** Words of the story that are highlighted, longest first so "comes near" beats "near". */
  private matcher(words: StoryWord[]): RegExp | null {
    const list = [...words].sort((a, b) => b.word.length - a.word.length).map((w) => w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return list.length ? new RegExp(`\\b(${list.join('|')})\\b`, 'gi') : null;
  }

  private markup(text: string, words: StoryWord[], re: RegExp | null): string {
    if (!re) return esc(text);
    let out = '';
    let last = 0;
    for (const m of text.matchAll(re)) {
      const word = words.find((w) => w.word.toLowerCase() === m[0].toLowerCase());
      out += esc(text.slice(last, m.index));
      out += word ? `<button class="vocab" data-word="${esc(word.id)}">${esc(m[0])}</button>` : esc(m[0]);
      last = (m.index ?? 0) + m[0].length;
    }
    return out + esc(text.slice(last));
  }

  show(pack: StoryPack, mode: 'read' | 'lookback', paragraph?: number): void {
    this.pack = pack;
    const dir = `${this.base}stories/${pack.id}/`;
    const re = this.matcher(pack.vocabulary);
    const paras = pack.paragraphs
      .map((p, i) => {
        const img = pack.images[i] ? `<img src="${dir}${pack.images[i]}" alt="" loading="${i ? 'lazy' : 'eager'}" />` : '';
        const th = p.th ? `<div class="th" hidden>${esc(p.th)}</div>` : '';
        const tools = [
          canSpeak ? `<button data-read="${i}">🔊 Read to me</button>` : '',
          p.th ? `<button data-th="${i}">ไทย</button>` : '',
        ].join('');
        return `<section class="para" data-p="${i}">${img}<p>${this.markup(p.text, pack.vocabulary, re)}</p>${th}<div class="tools">${tools}</div></section>`;
      })
      .join('');
    const end =
      mode === 'read'
        ? `<div class="end"><p>You finished the story! Now use its words to help the heroes.</p><button class="btn gold" data-start>Start the quest ⚔️</button></div>`
        : `<div class="end"><button class="btn" data-back>Back to the battle</button></div>`;
    this.el.innerHTML = `
      <div class="top">
        <button class="btn ghost" data-back style="padding:6px 12px;font-size:16px">←</button>
        <h1>${esc(pack.title)}</h1>
        <span class="pill">${esc(pack.level)}</span>
      </div>
      <div class="page">
        <div class="hint">${mode === 'read' ? 'Read the story. Tap a <b>yellow word</b> to see what it means.' : 'Look for the answer in the story.'}</div>
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
    const t = e.target as HTMLElement;
    const pack = this.pack;
    if (!pack) return;
    const vocab = t.closest<HTMLElement>('.vocab');
    if (vocab) {
      const w = pack.vocabulary.find((x) => x.id === vocab.dataset.word);
      if (w) this.showGloss(w);
      sound.play('tap');
      return;
    }
    const th = t.closest<HTMLElement>('[data-th]');
    if (th) {
      const box = this.el.querySelector<HTMLElement>(`[data-p="${th.dataset.th}"] .th`);
      if (box) box.hidden = !box.hidden;
      sound.play('page');
      return;
    }
    const read = t.closest<HTMLElement>('[data-read]');
    if (read) {
      const p = pack.paragraphs[Number(read.dataset.read)];
      if (p) void speak(p.text);
      return;
    }
    if (t.closest('[data-start]')) {
      this.hide();
      this.on.start();
      return;
    }
    if (t.closest('[data-back]')) {
      this.hide();
      this.on.back();
    }
  }

  private showGloss(w: StoryWord): void {
    this.gloss.innerHTML = `
      <button class="close" aria-label="Close">✕</button>
      <div class="w">${esc(w.word)} ${canSpeak ? `<button class="btn ghost" data-say="${esc(w.word)}" style="padding:4px 10px;font-size:16px;color:var(--purple);background:#efe8fb">🔊</button>` : ''}</div>
      ${w.phonetic ? `<div class="ph">${esc(w.phonetic)}</div>` : ''}
      <div class="thm">${esc(w.th)}</div>
      <div class="def">${esc(w.definition)}</div>`;
    this.gloss.classList.add('on');
  }
}
