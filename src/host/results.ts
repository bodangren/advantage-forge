/**
 * The results of a run, from the game's `GameResults` and evidence (never from game internals):
 * stars from first-try accuracy, the awarded XP (the apps' rule), the student's answers, the
 * items to practice, and the 3-star reward (a new hero look).
 */
import { firstTryAccuracy, starsOf, type GameResults, type StoryGameEvidence, type Translate } from '../apk3d/contracts/index.js';
import { esc } from '../apk3d/hud/index.js';

export const PRESETS: Record<string, string[]> = {
  knight: ['royal', 'champion', 'warden'],
  wizard: ['frost', 'mystic', 'sage'],
  cleric: ['templar', 'bishop', 'pilgrim'],
};

export interface Run {
  game: string;
  story: string;
  result: GameResults;
  evidence: StoryGameEvidence;
}

export function renderResults(el: HTMLElement, run: Run, looks: Readonly<Record<string, string>>, heroName: (hero: string) => string, t: Translate): void {
  const stars = starsOf(run.evidence);
  const pct = Math.round(firstTryAccuracy(run.evidence.items) * 100);
  const answers = run.evidence.items.map((i) => `<span class="chip ${i.correctFirstTry ? 'ok' : ''}">${esc(i.label)}</span>`).join('');
  const practice = run.evidence.practice.map((p) => `<span class="chip">${esc(p)}</span>`).join('');
  const reward =
    stars === 3
      ? `<div class="reward">${esc(t('host.results.rewardUnlocked'))}
          ${Object.keys(PRESETS)
            .map(
              (h) => `<div class="hero-name">${esc(heroName(h))}</div><div class="presets">${['default', ...PRESETS[h]!]
                .map((p) => `<button data-look="${h}:${p}" class="${(looks[h] ?? 'default') === p ? 'sel' : ''}">${esc(p === 'default' ? t('host.results.default') : p)}</button>`)
                .join('')}</div>`,
            )
            .join('')}</div>`
      : `<div class="reward">${esc(t('host.results.rewardHint'))}</div>`;
  el.innerHTML = `
    <div class="panel">
      <h2>${esc(t('host.results.title'))}</h2>
      <div class="stars" aria-label="${stars} / 3">${[1, 2, 3].map((n) => `<span class="${n <= stars ? 'lit' : ''}">★</span>`).join('')}</div>
      <div class="xp">${esc(t('host.results.xp', { xp: run.result.xp }))}<small>${esc(t('host.results.xpNote', { pct }))}</small></div>
      ${answers ? `<h3>${esc(t('host.results.storyWords'))}</h3><div class="chips">${answers}</div>` : ''}
      ${practice ? `<h3>${esc(t('host.results.practice'))}</h3><div class="chips">${practice}</div>` : ''}
      ${reward}
      <div class="actions">
        <button class="btn soft" data-again>${esc(t('host.results.again'))}</button>
        <button class="btn soft" data-other>${esc(t('host.results.other'))}</button>
      </div>
      <div class="actions"><button class="btn gold" data-class>${esc(t('host.results.classBoss'))}</button></div>
    </div>`;
}
