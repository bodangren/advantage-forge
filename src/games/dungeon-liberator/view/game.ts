/**
 * Dungeon Liberator 3D as a cartridge game. The core (../core) moves everyone in fixed steps;
 * this view builds the vault room, walks the hero, the villagers, and the skeletons to the core's
 * positions, keeps every word readable (tags pinned to the screen edge when off screen), and
 * animates the events. It never decides a rule.
 */
import * as THREE from 'three';
import { toGameResults, type StoryInput } from '../../../apk3d/contracts/index.js';
import type { Game3DContext, Game3DInstance } from '../../../apk3d/factory/index.js';
import { attachJoystick, esc, sentenceBar } from '../../../apk3d/hud/index.js';
import { createFixedStepLoop, type LoopClock } from '../../../apk3d/sim/index.js';
import { Actor, burst, FollowRig, Walker } from '../../../apk3d/stage/index.js';
import { createDungeonLiberator, evidenceOf, KNIGHT_START, scoreOf, type DungeonLiberatorCommand, type DungeonLiberatorEvent, type DungeonLiberatorState } from '../core/index.js';
import { nextSteer } from '../qc/bot.js';
import { buildRoom, model, ROOM_MODELS } from './room.js';

export async function createGame(ctx: Game3DContext): Promise<Game3DInstance> {
  const story = ctx.input as StoryInput;
  const stage = ctx.stage;
  const t = ctx.i18n.scope('hud').t;
  const audio = ctx.audio;
  const hud = ctx.hud;
  const heroId = ctx.options.hero || 'knight';
  await stage.loader.preload([...ROOM_MODELS, heroId].map(model));
  const room = buildRoom(stage);
  const sim = createDungeonLiberator(story, { seed: ctx.seed, helper: ctx.options.helper });
  const startedAt = performance.now();

  // ---------------------------------------------------------------- the hero
  const heroGltf = stage.loader.get(model(heroId))!;
  const hero = new Walker(stage.addActor(new Actor(heroId, heroGltf, stage.timeline)), 'run');
  hero.actor.placeAt(KNIGHT_START.x, 0, KNIGHT_START.z, 180);
  const look = ctx.options.looks[heroId];
  if (look && look !== 'default') void stage.loader.texture(`models/${heroId}/${look}.webp`).then((tex) => hero.actor.setMap(tex)).catch(() => undefined);

  // ---------------------------------------------------------------- camera
  const target = new THREE.Vector3();
  const compact = (): boolean => ctx.composition.profile === 'compact';
  const rig = (): FollowRig => new FollowRig(() => target, compact() ? [0, 7.6, 6.4] : [0, 7.4, 7.8], [0, 0, -1.2], compact() ? 60 : 48, 5);
  stage.setRig(rig());
  stage.pose.pos.set(0, 8, 10);

  // ---------------------------------------------------------------- HUD
  const status = document.createElement('div');
  status.className = 'status';
  status.innerHTML = `
    <div class="place"><small>${esc(t('place'))}</small><span data-room></span></div>
    ${ctx.host.openStory ? `<button class="book" data-story>${esc(t('story'))}</button>` : ''}
    ${ctx.host.toggleMute ? `<button class="book" data-mute aria-label="Sound">🔊</button>` : ''}`;
  hud.el.prepend(status);
  status.querySelector('[data-story]')?.addEventListener('click', () => ctx.host.openStory?.());
  const mute = status.querySelector<HTMLButtonElement>('[data-mute]');
  mute?.addEventListener('click', () => (mute.textContent = ctx.host.toggleMute?.() ? '🔇' : '🔊'));
  const bar = document.createElement('div');
  bar.className = 'sentence-bar';
  hud.el.append(bar);
  const roomEl = status.querySelector<HTMLElement>('[data-room]')!;
  const joystick = attachJoystick(hud.el, { hint: t('move'), change: (x, y) => loop.dispatch({ type: 'steer', x, z: y }) });

  audio.defineMood('vault', { bpm: 92, chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]], busy: false, drum: true });
  audio.defineSfx('join', (s) => [784, 988, 1319].forEach((f, i) => s.tone(f, 0.22, 'triangle', 0.14, i * 0.06)));
  audio.defineSfx('eek', (s) => s.tone(1200, 0.25, 'square', 0.06, 0, 1.5));
  audio.defineSfx('clank', (s) => {
    s.noise(0.3, 0.2, 1500);
    s.tone(180, 0.35, 'square', 0.08, 0, 0.7);
  });

  // ---------------------------------------------------------------- villagers and skeletons
  const villagers = new Map<string, { walker: Walker; tag: HTMLElement }>();
  const skeletons = new Map<string, Walker>();

  function clearRoom(): void {
    for (const v of villagers.values()) {
      hud.unanchor(v.tag);
      stage.removeActor(v.walker.actor);
    }
    villagers.clear();
    for (const s of skeletons.values()) stage.removeActor(s.actor);
    skeletons.clear();
  }

  function startRoom(ev: Extract<DungeonLiberatorEvent, { type: 'roomStarted' }>): void {
    clearRoom();
    for (const v of ev.villagers) {
      const g = stage.loader.get(model(v.kind)) ?? stage.loader.get(model('villager'))!;
      const actor = stage.addActor(new Actor(v.kind, g, stage.timeline, { phase: Math.random() }));
      actor.placeAt(v.x, 0, v.z, 0);
      const tag = document.createElement('div');
      tag.className = 'arena-tag';
      tag.textContent = v.word;
      hud.anchor(tag, () => stage.screenOf(actor, 1.25), { pin: true });
      villagers.set(v.id, { walker: new Walker(actor), tag });
    }
    for (const s of ev.skeletons) {
      const actor = stage.addActor(new Actor('skeleton', stage.loader.get(model('skeleton'))!, stage.timeline, { phase: Math.random() }));
      actor.placeAt(s.x, 0, s.z, 0);
      actor.hold('rise');
      void actor.play('rise');
      skeletons.set(s.id, new Walker(actor, 'walk', 10));
    }
    if (room.portcullis) room.portcullis.position.y = 0;
    room.glow.intensity = 0;
    drawBar();
  }

  function drawBar(): void {
    const s = sim.state;
    const sentence = s.shift[s.room];
    if (sentence) sentenceBar(bar, sentence.words, s.next, s.helper);
    for (const v of s.villagers) {
      const view = villagers.get(v.id);
      if (!view) continue;
      view.tag.classList.toggle('done', v.following);
      view.tag.classList.toggle('next', s.helper && v.index === s.next);
    }
    roomEl.textContent = t('room', { room: Math.min(s.room + 1, s.rooms), rooms: s.rooms });
  }

  // ---------------------------------------------------------------- events
  let finished = false;
  const at = (id: string): { x: number; y: number; visible: boolean } => {
    const v = villagers.get(id);
    return v ? stage.screenOf(v.walker.actor, 1.5) : { x: 0, y: 0, visible: false };
  };

  function handle(ev: DungeonLiberatorEvent): void {
    switch (ev.type) {
      case 'roomStarted':
        startRoom(ev);
        break;
      case 'villagerFreed': {
        const v = villagers.get(ev.id);
        if (v) v.walker.play(v.walker.actor.has('wave') ? 'wave' : 'salute');
        hud.popup(at(ev.id), t('freed'), 'good');
        audio.play('join');
        break;
      }
      case 'villagerRefused': {
        const v = villagers.get(ev.id);
        if (v) v.walker.play('talk');
        hud.popup(at(ev.id), t('notYet'), 'miss');
        audio.play('wrong');
        break;
      }
      case 'lineScattered':
        for (const id of ev.ids) hud.popup(at(id), t('scared'), 'miss');
        audio.play('eek');
        break;
      case 'knightBumped': {
        hero.play('hit');
        stage.shake(0.06, 0.3);
        const s = skeletons.get(ev.skeletonId);
        if (s) s.play('attack');
        audio.play('hit');
        break;
      }
      case 'gateOpened': {
        audio.play('clank');
        audio.play('correct');
        const p = room.portcullis;
        if (p) void stage.timeline.tween(1.0, (u) => (p.position.y = u * 1.6));
        void stage.timeline.tween(1.0, (u) => (room.glow.intensity = u * 10));
        void burst(stage, new THREE.Vector3(0, 1, -4.6), 0x9dffb0, 18, 1.2);
        void hud.banner.show(t('gate'), '', 1.6);
        break;
      }
      case 'roomCleared':
        audio.play('victory');
        break;
      case 'shiftComplete':
        void finish();
        break;
    }
    drawBar();
  }

  async function finish(): Promise<void> {
    if (finished) return;
    finished = true;
    loop.stop();
    joystick.dispose();
    audio.music('calm');
    audio.play('victory');
    hero.play('victory');
    await hud.banner.show(t('done.title'), t('done.text'), 2.2);
    const evidence = evidenceOf(sim.state, story, ctx.seed, Math.round(performance.now() - startedAt));
    ctx.complete(toGameResults(evidence, scoreOf(sim.state)), 'victory', evidence);
  }

  // ---------------------------------------------------------------- the loop, on the stage's frames
  let stageMs = 0;
  let nextFrame: (() => void) | null = null;
  const clock: LoopClock = { now: () => stageMs, requestFrame: (cb) => ((nextFrame = cb), 1), cancelFrame: () => (nextFrame = null) };
  const loop = createFixedStepLoop<DungeonLiberatorState, DungeonLiberatorCommand, DungeonLiberatorEvent>(sim, { render: (events) => events.forEach(handle) }, clock);

  stage.onFrame((dt) => {
    stageMs += dt * 1000;
    const cb = nextFrame;
    nextFrame = null;
    cb?.();
    const s = sim.state;
    hero.update(dt, s.knight.x, s.knight.z);
    target.set(s.knight.x * 0.6, 0, s.knight.z);
    for (const v of s.villagers) villagers.get(v.id)?.walker.update(dt, v.x, v.z);
    for (const k of s.skeletons) skeletons.get(k.id)?.update(dt, k.x, k.z);
  });

  return {
    start: () => {
      audio.music('vault');
      loop.start();
    },
    pause: () => undefined,
    resume: () => loop.reset(),
    resize: () => undefined,
    recompose: () => stage.setRig(rig()),
    captureResponsiveState: () => null,
    restoreResponsiveState: () => undefined,
    setMuted: () => undefined,
    destroy: async () => {
      finished = true;
      loop.stop();
      joystick.dispose();
      clearRoom();
      status.remove();
      bar.remove();
    },
    test: {
      state: () => sim.state,
      dispatch: (command) => loop.dispatch(command as DungeonLiberatorCommand),
      tick: (steps) => {
        for (let i = 0; i < steps; i++) sim.tick().forEach(handle);
      },
      auto: () => {
        const command = nextSteer(sim.state);
        if (command) loop.dispatch(command);
        return !!command;
      },
    },
  };
}
