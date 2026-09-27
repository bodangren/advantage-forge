/**
 * The standalone host (GitHub Pages): one page, one 3D stage, one audio bus, and the flow
 * level → story → game → read → start screen → game → results → class quest. Games are 3D
 * cartridges mounted through the kit's three factory, exactly as the APK will mount them; this
 * host stands in for the app pages (see docs/apk-port.md).
 */
/// <reference types="vite/client" />
import { CARTRIDGE_3D_RUNTIME_API_VERSION, classBossDamage, starsOf, type RuntimeEdition3D, type StoryInput } from '../apk3d/contracts/index.js';
import { AudioBus, installAudioUnlock } from '../apk3d/audio/index.js';
import { checkDevice } from '../apk3d/device/gate.js';
import { createThreeGameFactory, type Composition3D, type MountedThreeGame, type ThreeCartridge } from '../apk3d/factory/index.js';
import { createI18n } from '../apk3d/i18n/catalog.js';
import { Stage3D } from '../apk3d/stage/index.js';
import { renderBoss } from './boss-screen.js';
import { renderBriefing } from './briefing.js';
import { simulateClassBoss } from './classBoss.js';
import { Content } from './content.js';
import { renderGate } from './gate-screen.js';
import { Lobby } from './lobby.js';
import * as persistence from './persistence.js';
import { Reader } from './reader.js';
import { gameById, GAME_STRINGS, type GameEntry } from './registry.js';
import { renderResults, type Run } from './results.js';
import { parseRoute, routeHash, Screens, type Route } from './router.js';
import { PRESETS, Selector, type SelectorChoice } from './selector.js';
import hostStrings from './strings.en.js';
import '../apk3d/hud/theme.css';
import './host.css';

const BASE = import.meta.env.BASE_URL;
const QC = new URLSearchParams(location.search).get('qc') === '1';
const randomSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0]! >>> 1;

// ---------------------------------------------------------------- page
const app = document.getElementById('app')!;
app.className = 'app';
app.innerHTML = `
  <canvas class="stage"></canvas>
  <div class="game-layer"></div>
  <div class="screen selector"></div>
  <div class="panel-screen briefing-screen"></div>
  <div class="panel-screen results"></div>
  <div class="panel-screen boss"></div>
  <div class="panel-screen gate-screen"></div>
  <div class="screen reader"></div>
  <div class="loading"><div class="logo"></div><div class="bar"><i></i></div><div data-loading></div></div>`;
const $ = <T extends HTMLElement>(sel: string): T => app.querySelector<T>(sel)!;
const el = {
  canvas: $<HTMLCanvasElement>('canvas.stage'),
  game: $('.game-layer'),
  selector: $('.selector'),
  briefing: $('.briefing-screen'),
  results: $('.results'),
  boss: $('.boss'),
  gate: $('.gate-screen'),
  reader: $('.reader'),
};

const diagnostics: unknown[] = [];
const i18n = createI18n([hostStrings, ...GAME_STRINGS], { onMissing: (key) => diagnostics.push({ level: 'warning', code: 'apk3d/i18n-missing-key', message: key }) });
const t = i18n.t;
$('.loading .logo').textContent = t('host.brand');
$('[data-loading]').textContent = t('host.loading');

const audio = new AudioBus();
installAudioUnlock(audio);
const stage = new Stage3D(el.canvas, { base: BASE });
const lobby = new Lobby(stage);
const content = new Content(BASE);
const factory = createThreeGameFactory({ base: BASE, gate: () => checkDevice() });
const screens = new Screens(() => audio.play('whoosh'));

const compactQuery = window.matchMedia('(orientation: portrait), (max-width: 699px)');
const composition = (): Composition3D => ({ profile: compactQuery.matches ? 'compact' : 'wide', safe: { x: 0, y: 0, width: innerWidth, height: innerHeight } });

// ---------------------------------------------------------------- state
const saved = persistence.load();
const savedHero = saved.hero ?? 'knight';
let choice: SelectorChoice = { level: saved.level ?? 'A0', story: saved.story ?? null, game: saved.game ?? null, helper: saved.helper ?? true, hero: savedHero, look: saved.looks[savedHero] ?? 'default' };
/** The look this run unlocked (shown on the results screen once). */
let unlockedNow: { hero: string; look: string } | null = null;
let story: StoryInput | null = null;
let entry: GameEntry | null = null;
let cartridge: ThreeCartridge | null = null;
let mounted: MountedThreeGame | null = null;
let lastRun: Run | null = null;
let route: Route = { name: 'select' };
/** Stories read in this visit: the student reads before playing. */
const read = new Set<string>();
let lookingBack = false;

const gameTitle = (g: GameEntry | null): string => (g ? t(g.titleKey) : '');
let lobbyShown = false;

/**
 * The standard edition. Packs and bindings arrive with task 13 (pack manifests); until then games
 * load their models by path.
 */
const EDITION: RuntimeEdition3D = { id: 'standard', title: 'Primary Chibi', runtimeApiVersion: CARTRIDGE_3D_RUNTIME_API_VERSION, packs: {}, bindings: {}, tuning: { speed: 1, intensity: 1 } };

// ---------------------------------------------------------------- screens
const selector = new Selector(
  el.selector,
  t,
  (s) => (s.cover ? content.file(s.id, s.cover) : null),
  {
    story: (id) => void content.story(id).then((s) => selector.setStory(s)),
    change: (c) => {
      choice = c;
      persistence.save({ level: c.level, story: c.story ?? undefined, game: c.game ?? undefined, helper: c.helper, hero: c.hero, looks: { ...persistence.load().looks, [c.hero]: c.look } });
    },
    hero: (hero, look) => {
      void lobby.setLooks({ ...persistence.load().looks, [hero]: look });
      lobby.focus(hero);
    },
    read: (c) => {
      choice = c;
      lobby.cheer(c.hero);
      void go({ name: 'read', story: c.story! });
    },
    tap: () => audio.play('tap'),
  },
  choice,
  () => persistence.load().unlocked,
);
selector.savedLooks = { ...saved.looks };

const reader = new Reader(el.reader, t, (id, name) => content.file(id, name), {
  next: () => {
    if (story && choice.game) void go({ name: 'play', game: choice.game, story: story.id });
  },
  back: () => {
    if (lookingBack) endLookBack();
    else void go({ name: 'select' });
  },
  tap: () => audio.play('tap'),
  page: () => audio.play('page'),
});

function endLookBack(): void {
  lookingBack = false;
  el.reader.classList.remove('on', 'over-game');
  mounted?.resume();
}

el.briefing.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('[data-back]')) void go({ name: 'read', story: story!.id });
  if (target.closest('[data-start]')) void startGame();
});

el.results.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('[data-again]') && lastRun) void go({ name: 'play', game: lastRun.game, story: lastRun.story });
  if (target.closest('[data-other]')) void go({ name: 'select' });
  if (target.closest('[data-class]')) void go({ name: 'boss' });
});

el.boss.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-home]')) void go({ name: 'select' });
});
el.gate.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-back]')) void go({ name: 'select' });
});

// ---------------------------------------------------------------- navigation
async function unmount(): Promise<void> {
  const m = mounted;
  mounted = null;
  el.game.classList.remove('on');
  if (m) await m.destroy();
}

/**
 * Frames the lobby heroes in the gap the selector leaves: between the logo and the panel on a
 * phone, left of the panel on a wide screen. Other screens cover the stage, so the whole screen.
 */
function frameLobby(): void {
  if (!compactQuery.matches) return lobby.frame(route.name === 'select' ? [0, 0, 0.5, 1] : [0, 0, 1, 1]);
  const brand = el.selector.querySelector('.brand')?.getBoundingClientRect();
  const sheet = el.selector.querySelector('.sheet')?.getBoundingClientRect();
  if (route.name !== 'select' || !brand || !sheet || sheet.top - brand.bottom < 80) return lobby.frame([0, 0, 1, 0.42]);
  lobby.frame([0, brand.bottom / innerHeight, 1, sheet.top / innerHeight], true);
}

function showLobby(): void {
  lobby.show({ ...persistence.load().looks, [choice.hero]: choice.look });
  lobby.focus(choice.hero);
  frameLobby();
  audio.music('none');
}

async function go(next: Route, push = true): Promise<void> {
  const from = route.name;
  // The student reads before playing; results and the class quest need a finished run.
  if (next.name === 'play' && !read.has(next.story)) next = { name: 'read', story: next.story };
  if ((next.name === 'results' || next.name === 'boss') && !lastRun) next = { name: 'select' };
  route = next;
  if (push && location.hash !== routeHash(next)) history.pushState(null, '', routeHash(next));
  if (next.name !== 'play' || mounted) await unmount();
  if (next.name !== 'play') {
    if (!lobbyShown) {
      showLobby();
      lobbyShown = true;
    }
  }
  switch (next.name) {
    case 'select':
      await screens.show(el.selector, from, 'select');
      frameLobby();
      break;
    case 'read': {
      story = await content.story(next.story);
      entry = gameById(choice.game ?? '') ?? null;
      read.add(story.id);
      reader.show(story, 'read', gameTitle(entry));
      stage.setFreeArea(null);
      await screens.show(el.reader, from, 'read');
      break;
    }
    case 'play': {
      story = await content.story(next.story);
      entry = gameById(next.game) ?? null;
      if (!entry?.load) return go({ name: 'select' });
      cartridge = await entry.load();
      renderBriefing(el.briefing, cartridge.briefing(i18n.scope(cartridge.manifest.briefingKey.split('.')[0]!), story), story, cartridge.manifest, entry.icon, t);
      await screens.show(el.briefing, from, 'play');
      break;
    }
    case 'results':
      renderResults(el.results, lastRun!, unlockedNow, (persistence.load().unlocked[choice.hero] ?? []).length >= (PRESETS[choice.hero] ?? []).length, (h) => t(`host.heroes.${h}`), t);
      if (unlockedNow) {
        audio.play('heal');
        unlockedNow = null;
      }
      lobby.cheer();
      await screens.show(el.results, from, 'results');
      break;
    case 'boss': {
      const report = simulateClassBoss(randomSeed(), classBossDamage(lastRun!.result));
      const play = renderBoss(el.boss, report, t);
      await screens.show(el.boss, from, 'boss');
      setTimeout(() => {
        play();
        audio.play('hit');
      }, 500);
      break;
    }
  }
}

async function startGame(): Promise<void> {
  if (!story || !cartridge || !entry) return;
  const verdict = checkDevice({ requirements: cartridge.manifest.device });
  if (verdict.status === 'unsupported') {
    renderGate(el.gate, verdict.reason, t);
    await screens.show(el.gate, 'play', 'results');
    return;
  }
  screens.hideAll();
  lobbyShown = false;
  el.game.classList.add('on');
  const run = { game: entry.id, story: story.id };
  mounted = await factory({
    container: el.game,
    stage,
    cartridge,
    input: story,
    edition: EDITION,
    seed: randomSeed(),
    sessionMode: 'playing',
    composition: composition(),
    i18n: i18n.scope(cartridge.manifest.briefingKey.split('.')[0]!),
    audio,
    options: { helper: choice.helper, hero: choice.hero, looks: { ...persistence.load().looks, [choice.hero]: choice.look } },
    host: {
      openStory: (paragraph) => {
        if (!story) return;
        mounted?.pause();
        lookingBack = true;
        reader.show(story, 'lookback', gameTitle(entry), paragraph);
        el.reader.classList.add('on', 'over-game');
      },
      toggleMute: () => {
        audio.setMuted(!audio.muted);
        mounted?.setMuted(audio.muted);
        return audio.muted;
      },
    },
    complete: (result, _outcome, evidence) => {
      lastRun = { ...run, result, evidence };
      // 3 stars unlock the chosen hero's next look, and the hero wears it at once.
      if (starsOf(evidence) === 3) {
        const data = persistence.load();
        const open = data.unlocked[choice.hero] ?? [];
        const next = (PRESETS[choice.hero] ?? []).find((p) => !open.includes(p));
        if (next) {
          persistence.save({ unlocked: { ...data.unlocked, [choice.hero]: [...open, next] }, looks: { ...data.looks, [choice.hero]: next } });
          choice = { ...choice, look: next };
          selector.savedLooks[choice.hero] = next;
          unlockedNow = { hero: choice.hero, look: next };
        }
      }
      void go({ name: 'results' });
    },
    diagnostic: (d) => diagnostics.push(d),
  });
  mounted.start();
}

window.addEventListener('popstate', () => {
  if (lookingBack) return endLookBack();
  void go(parseRoute(location.hash), false);
});
window.addEventListener('resize', () => {
  if (!mounted) frameLobby();
});
compactQuery.addEventListener('change', () => {
  mounted?.recompose(composition());
  if (!mounted) frameLobby();
});

// ---------------------------------------------------------------- boot
async function boot(): Promise<void> {
  const bar = app.querySelector<HTMLElement>('.loading .bar i')!;
  const [stories] = await Promise.all([content.list(), lobby.load((p) => (bar.style.width = `${Math.round(p * 100)}%`))]);
  selector.setStories(stories);
  const first = parseRoute(location.hash);
  await go(first.name === 'play' || first.name === 'read' ? first : { name: 'select' }, false);
  app.querySelector('.loading')?.remove();
  const qc = window as unknown as Record<string, unknown>;
  qc.__apk3d = { go, route: () => route, game: () => mounted?.instance.test, story: () => story, diagnostics };
  qc.__apk3dReady = true;
}

void boot();
if (QC) document.documentElement.dataset.qc = '1';
