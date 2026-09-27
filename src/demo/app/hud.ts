/**
 * The battle overlay of Monster Encounters, built on the kit HUD (`src/apk3d/hud`): the place,
 * the team's courage, each monster's HP, banners, popups, and the challenge card. Nothing here is
 * timed: the student answers and continues at their own pace.
 */
import { arrange, choose, esc, feedback, HudRoot, markChoice, pips, type PopKind } from '../../apk3d/hud/index.js';
import type { Challenge, EncounterInfo, EnemyState, Feedback, HeroId, Response } from '../core/types.js';
import { sound } from './audio.js';
import type { Stage } from './stage.js';

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

const tap = (): void => sound.play('tap');

export class Hud {
  private readonly root: HudRoot;
  private readonly status: HTMLElement;
  private readonly hpEls = new Map<string, HTMLElement>();
  private enemies: EnemyState[] = [];

  constructor(el: HTMLElement, private readonly stage: Stage, private readonly on: HudHandlers) {
    el.innerHTML = `
      <div class="status">
        <div class="place"><small>The Sunken Vault</small><span data-place></span></div>
        <div class="courage">Courage<b data-courage></b></div>
        <button class="book" data-story>📖 Story</button>
        <button class="book" data-mute aria-label="Sound">🔊</button>
      </div>`;
    this.root = new HudRoot(el, stage.kit);
    this.status = el.querySelector('.status')!;
    el.querySelector('[data-story]')!.addEventListener('click', () => this.on.story());
    const mute = el.querySelector<HTMLButtonElement>('[data-mute]')!;
    mute.addEventListener('click', () => (mute.textContent = this.on.toggleMute() ? '🔇' : '🔊'));
  }

  /** HP pips follow the monsters on the stage frame, so nothing needs starting. */
  start(): void {}

  stop(): void {
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
    for (const el of this.hpEls.values()) this.root.unanchor(el);
    this.hpEls.clear();
    this.enemies = enemies.map((e) => ({ ...e }));
    for (const e of this.enemies) {
      const el = document.createElement('div');
      el.className = 'hp';
      this.hpEls.set(e.id, el);
      this.root.anchor(el, () => this.stage.screenOf(e.id, e.kind === 'giant-bat' ? 1.0 : 1.25));
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
    pips(el, e.hp, e.maxHp);
    el.style.display = e.defeated ? 'none' : '';
  }

  // ---------------------------------------------------------------- messages

  banner(title: string, text: string, ms = 2200): Promise<void> {
    return this.root.banner.show(title, text, ms / 1000);
  }

  popup(actorId: string, text: string, kind: PopKind = '', lift = 1.4): void {
    this.root.popup(this.stage.screenOf(actorId, lift), text, kind);
  }

  // ---------------------------------------------------------------- the challenge card

  hideCard(): void {
    this.root.card.hide();
  }

  /** Shows a challenge for a hero and resolves with the student's response. */
  async ask(hero: HeroId, c: Challenge): Promise<Response> {
    const look = HERO_LOOK[hero];
    const who = `<div class="who"><span class="pill" style="background:${look.color}">${look.emoji} ${look.name}'s turn</span>${c.retry ? '<span>Try this one again</span>' : ''}</div>`;
    const ask = `<div class="ask">${ASK[c.kind]}</div>`;
    const card = this.root.card;
    if (c.kind === 'sentence') {
      card.show(`${who}${ask}`);
      const tokenIds = await arrange(card, c.tokens, { empty: 'Tap the words in order', clear: 'Clear', check: 'Check ✓' }, tap);
      return { kind: 'order', tokenIds };
    }
    const long = c.prompt.length > 28;
    const prompt = `<div class="prompt ${long ? 'small' : ''}">${esc(c.prompt).replace('___', '<u>&nbsp;?&nbsp;&nbsp;</u>')}</div>`;
    const hint = 'hint' in c && c.hint ? `<div class="hint2">${esc(c.hint)}</div>` : '';
    card.show(`${who}${prompt}${hint}${ask}`);
    return { kind: 'choice', optionId: await choose(card, c.options, tap) };
  }

  /**
   * Shows how the answer went. A right answer flashes green and moves on; a wrong one shows the
   * right answer and a kind explanation, and waits for "Continue" (or a look back at the story).
   */
  async answer(f: Feedback, response: Response | null, challenge: Challenge | null): Promise<void> {
    const card = this.root.card;
    if (challenge && challenge.kind !== 'sentence' && response?.kind === 'choice') markChoice(card, response.optionId, f.correct, f.correctText);
    if (f.correct) {
      sound.play('correct');
      await feedback(card, true, '<b>Great! ✓</b>');
      await this.stage.kit.timeline.wait(0.75);
      this.hideCard();
      return;
    }
    sound.play('wrong');
    const actions = [...(f.paragraph !== undefined ? [{ id: 'look', label: '📖 Look in the story', soft: true }] : []), { id: 'go', label: 'Continue' }];
    const html = `Not quite. The answer is <b>${esc(f.correctText)}</b>${f.explanation ? `<br>${esc(f.explanation)}` : ''}`;
    for (;;) {
      const action = await feedback(card, false, html, actions);
      if (action === 'go') break;
      this.on.story(f.paragraph);
      // The story opens over the battle; the same feedback waits for "Continue" afterwards.
      card.el.lastElementChild?.remove();
    }
    this.hideCard();
  }
}
