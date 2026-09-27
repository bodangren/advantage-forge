/**
 * Chibi Quest: Monster Encounters. The flow: title, read the story, the quest in the Sunken Vault,
 * results, and the class boss. The game core (../core) decides everything; this file shows it.
 */
/// <reference types="vite/client" />
import { createQuest, DAMAGE_PER_CORRECT, parseStoryIndex, parseStoryPack, simulateClassBoss, type StoryIndexEntry } from '../core/index.js';
import type { Challenge, GameEvent, HeroId, Quest, QuestResults, Response, StoryPack } from '../core/types.js';
import { sound } from './audio.js';
import { HERO_LOOK, Hud } from './hud.js';
import { Reader } from './reader.js';
import { Stage } from './stage.js';
import './styles.css';

const BASE = import.meta.env.BASE_URL;
const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const randomSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0]!;

const PRESETS: Record<HeroId, string[]> = {
  knight: ['royal', 'champion', 'warden'],
  wizard: ['frost', 'mystic', 'sage'],
  cleric: ['templar', 'bishop', 'pilgrim'],
};

// ---------------------------------------------------------------- page
const app = document.getElementById('app')!;
app.className = 'app';
app.innerHTML = `
  <canvas class="stage"></canvas>
  <div class="screen title"></div>
  <div class="screen hud"></div>
  <div class="panel-screen results"></div>
  <div class="panel-screen boss"></div>
  <div class="screen reader"></div>
  <div class="loading"><div class="logo">Chibi Quest</div><div class="bar"><i></i></div><div>Opening the Sunken Vault…</div></div>
  <div class="fader"></div>`;
const $ = <T extends HTMLElement>(sel: string): T => app.querySelector<T>(sel)!;
const titleEl = $('.title');
const hudEl = $('.hud');
const readerEl = $('.reader');
const resultsEl = $('.results');
const bossEl = $('.boss');
const fader = $('.fader');

const stage = new Stage($('canvas.stage') as unknown as HTMLCanvasElement, BASE);
const portrait = window.matchMedia('(orientation: portrait), (max-width: 699px)');
const layout = (): void => {
  stage.setLayout(portrait.matches);
  stage.setFreeArea(hudEl?.classList.contains('on') ?? false);
};
portrait.addEventListener('change', layout);
layout();

type ScreenName = 'title' | 'reader' | 'battle' | 'results' | 'boss';
function show(name: ScreenName, overlayReader = false): void {
  stage.setFreeArea(name === 'battle' || name === 'results' || name === 'boss');
  titleEl.classList.toggle('on', name === 'title');
  hudEl.classList.toggle('on', name === 'battle' || overlayReader);
  readerEl.classList.toggle('on', name === 'reader' || overlayReader);
  resultsEl.classList.toggle('on', name === 'results');
  bossEl.classList.toggle('on', name === 'boss');
}

async function fade(during: () => void | Promise<void>): Promise<void> {
  fader.classList.add('on');
  await wait(460);
  await during();
  await wait(60);
  fader.classList.remove('on');
}

// ---------------------------------------------------------------- state
let stories: StoryIndexEntry[] = [];
let chosen = 0;
let helper = true;
let pack: StoryPack | null = null;
let inBattle = false;
const unlocked = loadUnlocked();

function loadUnlocked(): Partial<Record<HeroId, string>> {
  try {
    return JSON.parse(localStorage.getItem('chibi-quest-looks') ?? '{}') as Partial<Record<HeroId, string>>;
  } catch {
    return {};
  }
}
function saveUnlocked(): void {
  try {
    localStorage.setItem('chibi-quest-looks', JSON.stringify(unlocked));
  } catch {
    // Private windows may block storage; the look still applies for this visit.
  }
}

const reader = new Reader(readerEl, BASE, {
  start: () => void startQuest(),
  back: () => {
    if (inBattle) show('battle');
    else showTitle();
  },
});
const hud = new Hud(hudEl, stage, {
  story: (paragraph) => {
    if (!pack) return;
    reader.show(pack, 'lookback', paragraph);
    show('battle', true);
  },
  toggleMute: () => {
    sound.setMuted(!sound.muted);
    return sound.muted;
  },
});

// ---------------------------------------------------------------- title
function showTitle(): void {
  inBattle = false;
  stage.setStage(0, true);
  stage.setTitle(true);
  const cards = stories
    .map(
      (s, i) => `<button class="story-card ${i === chosen ? 'sel' : ''}" data-story="${i}">
        <img src="${BASE}stories/${s.id}/${s.cover}" alt="" />
        <div>${esc(s.title)}<br /><span class="pill">${esc(s.level)}</span></div>
      </button>`,
    )
    .join('');
  titleEl.innerHTML = `
    <div>
      <div class="logo">Chibi Quest</div>
      <div class="tag">Monster Encounters · read a story, then use its words to win!</div>
    </div>
    <div class="pick">
      <h2>Choose a story</h2>
      <div class="stories">${cards}</div>
      <div class="row">
        <label class="toggle"><input type="checkbox" data-helper ${helper ? 'checked' : ''} /> Helper mode (easier)</label>
      </div>
      <div class="row"><button class="btn gold" data-read>📖 Read the story</button></div>
      <div class="foot">A demo of Reading Advantage · Primary stories · no sign-in, nothing is saved</div>
    </div>`;
  show('title');
  sound.music('none');
}

// Every tap and key unlocks (or resumes) the sound, before the tapped control plays its effect.
for (const type of ['touchend', 'click', 'keydown'] as const) document.addEventListener(type, () => sound.unlock(), { capture: true, passive: true });

titleEl.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const card = t.closest<HTMLElement>('[data-story]');
  if (card) {
    chosen = Number(card.dataset.story);
    titleEl.querySelectorAll('.story-card').forEach((c, i) => c.classList.toggle('sel', i === chosen));
    sound.play('tap');
    return;
  }
  if (t.closest('[data-read]')) {
    sound.play('page');
    void openStory();
  }
});
titleEl.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.matches('[data-helper]')) helper = t.checked;
});

async function openStory(): Promise<void> {
  const entry = stories[chosen];
  if (!entry) return;
  const res = await fetch(`${BASE}stories/${entry.id}/story.json`);
  pack = parseStoryPack(await res.json());
  stage.setTitle(false);
  reader.show(pack, 'read');
  show('reader');
}

// ---------------------------------------------------------------- the quest
let quest: Quest | null = null;

async function startQuest(): Promise<void> {
  if (!pack) return;
  inBattle = true;
  quest = createQuest(pack, { seed: randomSeed(), helper });
  (window as unknown as { __demo: unknown }).__demo = { quest, pack };
  await fade(() => {
    show('battle');
    hud.start();
  });
  await run(quest.start());
}

async function run(first: GameEvent[]): Promise<void> {
  const q = quest!;
  const queue = [...first];
  let active: HeroId = 'knight';
  let challenge: Challenge | null = null;
  let response: Response | null = null;
  let pending: Promise<void> = Promise.resolve();
  const max = q.state.maxCourage;
  hud.setCourage(q.state.courage, max);
  while (queue.length) {
    const ev = queue.shift()!;
    switch (ev.type) {
      case 'encounterStart': {
        await pending;
        const info = ev.encounter;
        const boss = info.enemies.some((e) => e.kind === 'dragon-fire');
        hud.setEnemies([]);
        if (info.index > 0) await fade(() => stage.setStage(info.index, true));
        hud.setEncounter(info);
        hud.setCourage(q.state.courage, max);
        sound.music(boss ? 'boss' : 'battle');
        sound.play(boss ? 'roar' : 'spawn');
        const spawn = stage.spawn(info.enemies);
        await Promise.all([hud.banner(info.name, info.intro, 2600), spawn]);
        hud.setEnemies(info.enemies);
        break;
      }
      case 'turn':
        await pending;
        active = ev.hero;
        challenge = ev.challenge;
        response = await hud.ask(ev.hero, ev.challenge);
        queue.push(...q.answer(response));
        break;
      case 'answer':
        await hud.answer(ev.feedback, response, challenge);
        break;
      case 'heroAttack': {
        sound.play('whoosh');
        const move = stage.heroAttack(ev.hero, ev.target, ev.move);
        await move.hit;
        sound.play('hit');
        hud.popup(ev.target, `-${ev.damage}`);
        pending = move.done;
        break;
      }
      case 'enemyHit':
        hud.updateEnemy(ev.enemy, ev.hp);
        await stage.enemyHit(ev.enemy);
        break;
      case 'enemyDefeated':
        hud.updateEnemy(ev.enemy, 0, true);
        sound.play('defeat');
        await stage.enemyDefeated(ev.enemy);
        break;
      case 'heroMiss':
        hud.popup(ev.target, 'Miss!', 'miss');
        await stage.heroMiss(ev.hero, ev.target);
        break;
      case 'enemyAttack':
        await stage.enemyAttack(ev.enemy, active);
        hud.setCourage(ev.courage, max);
        hud.popup(active, '-1 ❤', '', 1.2);
        break;
      case 'heal':
        stage.heal(ev.hero);
        sound.play('heal');
        hud.setCourage(ev.courage, max);
        hud.popup(ev.hero, '+1 ❤', 'good', 1.3);
        break;
      case 'rest':
        hud.setCourage(ev.courage, max);
        await hud.banner('Take a deep breath', 'The heroes rest together and feel brave again.', 2400);
        break;
      case 'xp':
        hud.popup(active, `+${ev.amount} XP`, 'good', 1.7);
        break;
      case 'encounterCleared':
        await pending;
        await wait(300);
        break;
      case 'victory':
        await pending;
        hud.stop();
        sound.music('calm');
        sound.play('victory');
        await Promise.all([stage.victory(), hud.banner('Victory!', 'The Sunken Vault is safe.', 2200)]);
        showResults(ev.results);
        return;
    }
  }
}

// ---------------------------------------------------------------- results and reward
function showResults(r: QuestResults): void {
  inBattle = false;
  const stars = [1, 2, 3].map((n) => `<span class="${n <= r.stars ? 'lit' : ''}">★</span>`).join('');
  const practiced = r.items
    .filter((i) => i.kind === 'word')
    .map((i) => `<span class="chip ${i.correctFirstTry ? 'ok' : ''}">${esc(i.label)}</span>`)
    .join('');
  const practice = r.practice.map((p) => `<span class="chip">${esc(p)}</span>`).join('');
  const reward =
    r.stars === 3
      ? `<div class="reward">⭐ New look unlocked! Choose a hero's colors:
          ${(Object.keys(PRESETS) as HeroId[])
            .map(
              (h) => `<div style="margin-top:8px">${HERO_LOOK[h].name}</div><div class="presets">${['default', ...PRESETS[h]]
                .map((p) => `<button data-look="${h}:${p}" class="${(unlocked[h] ?? 'default') === p ? 'sel' : ''}">${p}</button>`)
                .join('')}</div>`,
            )
            .join('')}</div>`
      : `<div class="reward">Get 3 stars to unlock new hero colors!</div>`;
  resultsEl.innerHTML = `
    <div class="panel">
      <h2>Quest complete!</h2>
      <div class="stars">${stars}</div>
      <div class="xp">+${r.xp} XP<small>XP is for fun. Your stars show how many you knew on the first try: ${Math.round(r.firstTryAccuracy * 100)}%.</small></div>
      ${practiced ? `<h3>Story words</h3><div class="chips">${practiced}</div>` : ''}
      ${practice ? `<h3>Practice these again</h3><div class="chips">${practice}</div>` : ''}
      ${reward}
      <div class="actions">
        <button class="btn ghost" data-again style="color:var(--ink);background:#efe8fb">Play again</button>
        <button class="btn gold" data-class>Help your class ⚔️</button>
      </div>
    </div>`;
  show('results');
}

resultsEl.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const look = t.closest<HTMLElement>('[data-look]');
  if (look) {
    const [hero, preset] = look.dataset.look!.split(':') as [HeroId, string];
    unlocked[hero] = preset;
    saveUnlocked();
    void stage.setPreset(hero, preset === 'default' ? null : preset);
    look.parentElement!.querySelectorAll('button').forEach((b) => b.classList.toggle('sel', b === look));
    sound.play('heal');
    return;
  }
  if (t.closest('[data-again]')) void fade(() => showTitle());
  if (t.closest('[data-class]')) showBoss();
});

function showBoss(): void {
  const r = quest?.results();
  if (!r) return;
  const report = simulateClassBoss(randomSeed(), r.correctAnswers * DAMAGE_PER_CORRECT);
  const pct = (hp: number): string => `${Math.max(0, (hp / report.maxHp) * 100).toFixed(1)}%`;
  bossEl.innerHTML = `
    <div class="panel">
      <h2>Class quest</h2>
      <p style="text-align:center;margin:0">This week your class fights <b>${esc(report.bossName)}</b>.<br />Every student's correct answers help.</p>
      <div class="bossbar"><i style="width:${pct(report.hpBefore)}"></i><em>${report.hpBefore} / ${report.maxHp}</em></div>
      <p style="text-align:center;font-weight:700;margin:4px 0">Your answers: <span style="color:var(--red)">-${report.yourDamage}</span> HP</p>
      <p style="text-align:center;margin:4px 0">${report.played} of ${report.classSize} classmates have helped this week${report.defeated ? ' — and the dragon is defeated! 🎉' : '.'}</p>
      <h3 style="text-align:center">Recent helpers</h3>
      <div class="helpers">${report.helpers.map((h) => `<span class="${h.name === 'You' ? 'you' : ''}">${esc(h.name)}</span>`).join('')}</div>
      <div class="note">A demo with a pretend class. In the app, the whole class shares one boss, and every student can help. There is no ranking.</div>
      <div class="actions">
        <button class="btn gold" data-home>Read another story</button>
      </div>
    </div>`;
  show('boss');
  requestAnimationFrame(() =>
    setTimeout(() => {
      const bar = bossEl.querySelector<HTMLElement>('.bossbar i')!;
      bar.style.width = pct(report.hpAfter);
      bossEl.querySelector('.bossbar em')!.textContent = `${report.hpAfter} / ${report.maxHp}`;
      sound.play('hit');
    }, 500),
  );
}

bossEl.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-home]')) void fade(() => showTitle());
});

// ---------------------------------------------------------------- start
async function boot(): Promise<void> {
  const bar = app.querySelector<HTMLElement>('.loading .bar i')!;
  const [index] = await Promise.all([
    fetch(`${BASE}stories/index.json`).then(async (r) => parseStoryIndex(await r.json())),
    stage.load((p) => (bar.style.width = `${Math.round(p * 100)}%`)),
  ]);
  stories = index;
  for (const [hero, preset] of Object.entries(unlocked)) if (preset && preset !== 'default') void stage.setPreset(hero as HeroId, preset);
  showTitle();
  app.querySelector('.loading')?.remove();
  (window as unknown as { __demoReady: boolean }).__demoReady = true;
}

void boot();
