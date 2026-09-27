/**
 * The class quest: the student's correct answers from any game damage this week's class boss.
 * The class here is an example (simulated); in the app the whole class shares one boss. There is
 * no ranking: the screen shows recent helpers in no order of merit.
 */
import type { Translate } from '../apk3d/contracts/index.js';
import { esc } from '../apk3d/hud/index.js';
import type { ClassBossReport } from './classBoss.js';

export function renderBoss(el: HTMLElement, report: ClassBossReport, t: Translate): () => void {
  const pct = (hp: number): string => `${Math.max(0, (hp / report.maxHp) * 100).toFixed(1)}%`;
  const params = { played: report.played, size: report.classSize };
  el.innerHTML = `
    <div class="panel">
      <h2>${esc(t('host.boss.title'))}</h2>
      <p class="center">${t('host.boss.intro', { boss: esc(report.bossName) })}</p>
      <div class="bossbar"><i style="width:${pct(report.hpBefore)}"></i><em>${report.hpBefore} / ${report.maxHp}</em></div>
      <p class="center strong">${t('host.boss.yourDamage', { damage: report.yourDamage })}</p>
      <p class="center">${esc(t(report.defeated ? 'host.boss.defeated' : 'host.boss.played', params))}</p>
      <h3 class="center">${esc(t('host.boss.helpers'))}</h3>
      <div class="helpers">${report.helpers.map((h) => `<span class="${h.name === 'You' ? 'you' : ''}">${esc(h.name === 'You' ? t('host.boss.you') : h.name)}</span>`).join('')}</div>
      <div class="note">${esc(t('host.boss.note'))}</div>
      <div class="actions"><button class="btn gold" data-home>${esc(t('host.boss.home'))}</button></div>
    </div>`;
  /** Plays the damage: the bar drops to the new HP. */
  return () => {
    const bar = el.querySelector<HTMLElement>('.bossbar i');
    const label = el.querySelector('.bossbar em');
    if (bar) bar.style.width = pct(report.hpAfter);
    if (label) label.textContent = `${report.hpAfter} / ${report.maxHp}`;
  };
}
