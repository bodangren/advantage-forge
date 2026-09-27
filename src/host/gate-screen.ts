/**
 * The message for a device that cannot run a game: a plain explanation, the reason, and a way
 * back. No 2D fallback; the reader still works on the device.
 */
import type { Translate } from '../apk3d/contracts/index.js';
import { esc } from '../apk3d/hud/index.js';

/** Maps a gate reason ('software-gl') to its catalog key ('softwareGl'). */
const reasonKey = (reason: string | undefined): string => (reason ?? 'unknown').replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());

export function renderGate(el: HTMLElement, reason: string | undefined, t: Translate): void {
  const key = `host.gate.reason.${reasonKey(reason)}`;
  el.innerHTML = `
    <div class="panel gate">
      <div class="gate-icon" aria-hidden="true">📵</div>
      <h2>${esc(t('host.gate.title'))}</h2>
      <p>${esc(t('host.gate.body'))}</p>
      <p class="reason">${esc(t(key))}</p>
      <div class="actions"><button class="btn gold" data-back>${esc(t('host.back'))}</button></div>
    </div>`;
}
