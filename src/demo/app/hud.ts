/**
 * The battle overlay (HTML over the 3D stage): the place, the team's courage, each monster's HP,
 * banners, popups, and the challenge card. HTML text keeps Thai and English crisp and readable.
 * Nothing here is timed: the student answers and continues at their own pace.
 */
import type { Challenge, EncounterInfo, EnemyState, Feedback, HeroId, Response } from '../core/types.js';
import { sound } from './audio.js';
import type { Stage } from './stage.js';

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const hasThai = (s: string): boolean => /[฀-๿]/.test(s);
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export const HERO_LOOK: Record<HeroId, { name: string; color: string; emoji: string }> = {
  knight: { name: 'Knight', color: '#d9463b', emoji: '🛡️' },
  wizard: { name: 'Wizard', color: '#6a3fd1', emoji: '🔥' },
  cleric: { name: 'Cleric', color: '#2f7fd8', emoji: '✨' },
};

const ASK: Record<Challenge['kind'], string> = {
  word: 'What does this word mean?',
  fill: 'Which word goes in the gap?',
  sentence: 'Tap the words to make the sentence.',
  question: 'Answer the question about the story.',
};

export interface HudHandlers {
  /** Open the story (at a paragraph when given). */
  story(paragraph?: number): void;
  toggleMute(): boolean;
}

export class Hud {
  private readonly status: HTMLElement;
  private readonly card: HTMLElement;
  private readonly bannerEl: HTMLElement;
  private readonly hpEls = new Map<string, HTMLElement>();
  private enemies: EnemyState[] = [];
  private raf = 0;

  constructor(private readonly el: HTMLElement, private readonly stage: Stage, private readonly on: HudHandlers) {
    el.innerHTML = `
      <div class="status">
        <div class="place"><small>The Sunken Vault</small><span data-place></span></div>
        <div class="courage">Courage<b data-courage></b></div>
        <button class="book" data-story>📖 Story</button>
        <button class="book" data-mute aria-label="Sound">🔊</button>
      </div>
      <div class="banner"><h3></h3><p></p></div>
      <div class="card"></div>`;
    this.status = el.querySelector('.status')!;
    this.card = el.querySelector('.card')!;
    this.bannerEl = el.querySelector('.banner')!;
    el.querySelector('[data-story]')!.addEventListener('click', () => this.on.story());
    const mute = el.querySelector<HTMLButtonElement>('[data-mute]')!;
    mute.addEventListener('click', () => (mute.textContent = this.on.toggleMute() ? '🔇' : '🔊'));
  }

  start(): void {
    const tick = (): void => {
      this.place();
      this.raf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(this.raf);
    tick();
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.hideCard();
  }

  setEncounter(info: EncounterInfo): void {
    this.status.querySelector('[data-place]')!.textContent = `${info.index + 1}/${info.count} · ${info.name}`;
  }

  setCourage(value: number, max: number): void {
    this.status.querySelector('[data-courage]')!.textContent = '❤'.repeat(value) + '♡'.repeat(Math.max(0, max - value));
  }

  // ---------------------------------------------------------------- monster HP

  setEnemies(enemies: EnemyState[]): void {
    for (const el of this.hpEls.values()) el.remove();
    this.hpEls.clear();
    this.enemies = enemies.map((e) => ({ ...e }));
    for (const e of this.enemies) {
      const el = document.createElement('div');
      el.className = 'hp';
      this.el.append(el);
      this.hpEls.set(e.id, el);
      this.drawHp(e);
    }
  }

  updateEnemy(id: string, hp: number, defeated = false): void {
    const e = this.enemies.find((x) => x.id === id);
    if (!e) return;
    e.hp = hp;
    e.defeated = defeated || hp <= 0;
    this.drawHp(e);
  }

  private drawHp(e: EnemyState): void {
    const el = this.hpEls.get(e.id);
    if (!el) return;
    el.innerHTML = Array.from({ length: e.maxHp }, (_, i) => `<i class="${i < e.hp ? '' : 'off'}"></i>`).join('');
    el.style.display = e.defeated ? 'none' : '';
  }

  private place(): void {
    for (const e of this.enemies) {
      const el = this.hpEls.get(e.id);
      if (!el || e.defeated) continue;
      const p = this.stage.screenOf(e.id, e.kind === 'giant-bat' ? 1.0 : 1.25);
      el.style.visibility = p.visible ? 'visible' : 'hidden';
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
    }
  }

  // ---------------------------------------------------------------- messages

  async banner(title: string, text: string, ms = 2200): Promise<void> {
    this.bannerEl.querySelector('h3')!.textContent = title;
    this.bannerEl.querySelector('p')!.textContent = text;
    this.bannerEl.classList.add('on');
    await wait(ms);
    this.bannerEl.classList.remove('on');
    await wait(350);
  }

  popup(actorId: string, text: string, kind: '' | 'miss' | 'good' = '', lift = 1.4): void {
    const p = this.stage.screenOf(actorId, lift);
    if (!p.visible) return;
    const el = document.createElement('div');
    el.className = `pop ${kind}`;
    el.textContent = text;
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    this.el.append(el);
    setTimeout(() => el.remove(), 1000);
  }

  // ---------------------------------------------------------------- the challenge card

  hideCard(): void {
    this.card.classList.remove('on');
  }

  /** Shows a challenge for a hero and resolves with the student's response. */
  ask(hero: HeroId, c: Challenge): Promise<Response> {
    const look = HERO_LOOK[hero];
    const who = `<div class="who"><span class="pill" style="background:${look.color}">${look.emoji} ${look.name}'s turn</span>${c.retry ? '<span>Try this one again</span>' : ''}</div>`;
    const long = c.prompt.length > 28;
    const prompt = `<div class="prompt ${long ? 'small' : ''}">${esc(c.prompt).replace('___', '<u>&nbsp;?&nbsp;&nbsp;</u>')}</div>`;
    const hint = 'hint' in c && c.hint ? `<div class="hint2">${esc(c.hint)}</div>` : '';
    const ask = `<div class="ask">${ASK[c.kind]}</div>`;
    return new Promise((resolve) => {
      if (c.kind === 'sentence') {
        this.card.innerHTML = `${who}${ask}<div class="tray"></div><div class="tokens">${c.tokens
          .map((t) => `<button class="tok" data-tok="${esc(t.id)}">${esc(t.text)}</button>`)
          .join('')}</div><div class="actions"><button class="btn ghost" data-clear style="color:var(--ink);background:#efe8fb">Clear</button><button class="btn green" data-check disabled>Check ✓</button></div>`;
        const tray = this.card.querySelector<HTMLElement>('.tray')!;
        const check = this.card.querySelector<HTMLButtonElement>('[data-check]')!;
        const chosen: string[] = [];
        const redraw = (): void => {
          tray.innerHTML = chosen.map((id) => `<button class="tok" data-back="${esc(id)}">${esc(c.tokens.find((t) => t.id === id)!.text)}</button>`).join('');
          this.card.querySelectorAll<HTMLElement>('.tokens .tok').forEach((b) => b.classList.toggle('used', chosen.includes(b.dataset.tok!)));
          check.disabled = chosen.length !== c.tokens.length;
        };
        this.card.onclick = (e) => {
          const t = e.target as HTMLElement;
          const add = t.closest<HTMLElement>('[data-tok]');
          const back = t.closest<HTMLElement>('[data-back]');
          if (add && !chosen.includes(add.dataset.tok!)) chosen.push(add.dataset.tok!);
          else if (back) chosen.splice(chosen.indexOf(back.dataset.back!), 1);
          else if (t.closest('[data-clear]')) chosen.length = 0;
          else if (t.closest('[data-check]') && chosen.length === c.tokens.length) {
            this.card.onclick = null;
            sound.play('tap');
            resolve({ kind: 'order', tokenIds: [...chosen] });
            return;
          } else return;
          sound.play('tap');
          redraw();
        };
        redraw();
      } else {
        const thai = c.options.some((o) => hasThai(o.text));
        const one = c.options.some((o) => o.text.length > 18);
        this.card.innerHTML = `${who}${prompt}${hint}${ask}<div class="options ${one ? 'one' : ''}">${c.options
          .map((o) => `<button class="opt ${thai ? 'th' : ''}" data-opt="${esc(o.id)}">${esc(o.text)}</button>`)
          .join('')}</div>`;
        this.card.onclick = (e) => {
          const b = (e.target as HTMLElement).closest<HTMLElement>('[data-opt]');
          if (!b) return;
          this.card.onclick = null;
          b.classList.add('picked');
          sound.play('tap');
          resolve({ kind: 'choice', optionId: b.dataset.opt! });
        };
      }
      this.card.scrollTop = 0;
      this.card.classList.add('on');
    });
  }

  /**
   * Shows how the answer went. A right answer flashes green and moves on; a wrong one shows the
   * right answer and a kind explanation, and waits for "Continue" (or a look back at the story).
   */
  async answer(f: Feedback, response: Response | null, challenge: Challenge | null): Promise<void> {
    if (challenge && challenge.kind !== 'sentence' && response?.kind === 'choice') {
      const picked = this.card.querySelector<HTMLElement>(`[data-opt="${CSS.escape(response.optionId)}"]`);
      picked?.classList.add(f.correct ? 'right' : 'wrong');
      if (!f.correct)
        this.card.querySelectorAll<HTMLElement>('[data-opt]').forEach((b) => {
          if (b.textContent === f.correctText) b.classList.add('right');
        });
    }
    if (f.correct) {
      sound.play('correct');
      const box = document.createElement('div');
      box.className = 'feedback good';
      box.innerHTML = `<b>Great! ✓</b>`;
      this.card.append(box);
      box.scrollIntoView({ block: 'nearest' });
      await wait(750);
      this.hideCard();
      return;
    }
    sound.play('wrong');
    const look = f.paragraph !== undefined ? `<button class="btn ghost" data-look style="color:var(--ink);background:#efe8fb">📖 Look in the story</button>` : '';
    const box = document.createElement('div');
    box.className = 'feedback bad';
    box.innerHTML = `Not quite. The answer is <b>${esc(f.correctText)}</b>${f.explanation ? `<br>${esc(f.explanation)}` : ''}<div class="actions">${look}<button class="btn" data-go>Continue</button></div>`;
    this.card.append(box);
    box.scrollIntoView({ block: 'nearest' });
    await new Promise<void>((resolve) => {
      this.card.onclick = (e) => {
        const t = e.target as HTMLElement;
        if (t.closest('[data-look]')) this.on.story(f.paragraph);
        if (t.closest('[data-go]')) {
          this.card.onclick = null;
          resolve();
        }
      };
    });
    this.hideCard();
  }
}
