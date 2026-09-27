/**
 * The HTML overlay over the 3D stage. HTML keeps text crisp in every script (Thai, Chinese) and
 * accessible. The root holds labels that follow 3D positions (updated on the stage's frame, so
 * they stop when the stage pauses), floating popups, a banner, and the challenge card.
 */
import type { Stage3D } from '../stage/stage.js';
import type { ScreenPoint } from './dom.js';
import { Banner, Card } from './widgets.js';
import './hud.css';

export type PopKind = '' | 'miss' | 'good';

export class HudRoot {
  readonly banner: Banner;
  readonly card: Card;
  private readonly anchors = new Map<HTMLElement, () => ScreenPoint>();
  private readonly stopFrame: () => void;

  constructor(readonly el: HTMLElement, private readonly stage: Stage3D) {
    el.classList.add('apk3d-hud');
    this.banner = new Banner(el, stage.timeline);
    this.card = new Card(el);
    this.stopFrame = stage.onFrame(() => this.place());
  }

  /** Keeps `el` at a moving screen point (a health bar over a monster, a word over an item). */
  anchor(el: HTMLElement, where: () => ScreenPoint): HTMLElement {
    if (!el.parentElement) this.el.append(el);
    el.classList.add('anchored');
    this.anchors.set(el, where);
    this.placeOne(el, where);
    return el;
  }

  unanchor(el: HTMLElement, remove = true): void {
    this.anchors.delete(el);
    if (remove) el.remove();
  }

  /** A short floating text at a screen point ("-1", "+10 XP", "Miss!"). */
  popup(at: ScreenPoint, text: string, kind: PopKind = ''): void {
    if (!at.visible) return;
    const el = document.createElement('div');
    el.className = `pop ${kind}`;
    el.textContent = text;
    el.style.left = `${at.x}px`;
    el.style.top = `${at.y}px`;
    this.el.append(el);
    void this.stage.timeline.wait(1).then(() => el.remove());
  }

  dispose(): void {
    this.stopFrame();
    for (const el of this.anchors.keys()) el.remove();
    this.anchors.clear();
    this.el.classList.remove('apk3d-hud');
  }

  private place(): void {
    for (const [el, where] of this.anchors) this.placeOne(el, where);
  }

  private placeOne(el: HTMLElement, where: () => ScreenPoint): void {
    const p = where();
    el.style.visibility = p.visible ? '' : 'hidden';
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
  }
}
