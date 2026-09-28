/**
 * Monster Encounters in 2D (Phaser): the fallback for old phones and the renderer a player may
 * choose. The same core decides everything (../core); this view shows each event in order, as the
 * 3D view does (../view/game.ts), with the forge sprites of the `primary-chibi-2d` pack in the
 * vault hall baked from the 3D set, and asks the student on the Phaser challenge card (`Card2D`):
 * pick a meaning, fill a gap, answer a question, or tap the words of a sentence into order.
 * Nothing is timed. On a phone the battle is above the card; on a wide screen, beside it.
 */
import type * as Phaser from 'phaser';
import { practiceOf, preloadAssetBindings, toGameResults, type StoryGameEvidence, type StoryInput } from '../../../apk3d/contracts/index.js';
import { AudioBus, installAudioUnlock } from '../../../apk3d/audio/index.js';
import { SESSION_OPTIONS_DEFAULT, type Game2DContext } from '../../../apk3d/factory/index.js';
import { createI18n } from '../../../apk3d/i18n/catalog.js';
import { Actor2D, banner, Card2D, fitGameSize, popup, project, registerSheetAnimations, StatusBar2D, textureKeyOf, type CardAction, type Rect } from '../../../apk3d/view2d/index.js';
import { createMonsterEncounters, type Challenge, type EnemyKind, type EnemyState, type Feedback, type GameEvent, type HeroId, type QuestResults, type Response } from '../core/index.js';
import { ENEMY_CLIPS_2D, FILES_2D, HERO_CLIPS_2D } from '../manifest.js';
import strings from '../strings.en.js';
import { HALL } from '../view/hall.js';
import { BACKGROUND_FILE, PROJECTION } from './projection.gen.js';

const HEROES: HeroId[] = ['knight', 'wizard', 'cleric'];
const HERO_LOOK: Record<HeroId, { color: number; emoji: string }> = {
  knight: { color: 0xd9463b, emoji: '🛡️' },
  wizard: { color: 0x6a3fd1, emoji: '🔥' },
  cleric: { color: 0x2f7fd8, emoji: '✨' },
};
/** The dragon is smaller than in 3D (no perspective shrinks it here). */
const DRAGON_SCALE = 1.4;
/** A cool tint puts the day-lit forge sprites in the blue vault light. */
const VAULT_TINT = 0xdce4ff;
/** The fight's extent in meters: x, and the projected height v (the dragon's head to the party's feet). */
const FIGHT = { width: 5.6, vTop: 2.1, vBottom: -3.7 };

export function createGameConfig(ctx: Game2DContext): Readonly<Record<string, unknown>> {
  if (Array.isArray(ctx.input)) throw new Error('Monster Encounters needs a story input.');
  const story = ctx.input as StoryInput;
  const i18n = ctx.i18n ?? createI18n([strings]).scope('monsterEncounters');
  const t = i18n.scope('hud').t;
  const options = ctx.options ?? SESSION_OPTIONS_DEFAULT;
  const edition = ctx.edition;
  const seed = ctx.seed ?? Date.now() >>> 1;
  const needed = FILES_2D.filter((id) => edition.bindings[id]);
  const [width, height] = fitGameSize();
  const audio = ctx.audio ?? new AudioBus();
  const unlock = ctx.audio ? null : installAudioUnlock(audio);
  let frame: ((time: number) => void) | null = null;

  function preload(this: Phaser.Scene): void {
    preloadAssetBindings(this.load, edition, needed, ctx.resolveUrl);
  }

  function create(this: Phaser.Scene): void {
    const scene = this;
    const { width: W, height: H } = scene.scale;
    const portrait = H > W;
    for (const id of needed) registerSheetAnimations(scene.anims, edition, id);
    const clips = (model: string, list: readonly string[]) => list.filter((c) => edition.bindings[`${model}.${c}`]);

    // ---------------------------------------------------------------- layout: the battle and the card
    const top = 66;
    // A phone: the battle on top and the card as a bottom sheet (it covers the near floor when tall).
    const battle: Rect = portrait ? { x: 0, y: top, width: W, height: H * 0.6 - top } : { x: 0, y: top, width: W * 0.56, height: H - top };
    const cardArea: Rect = portrait ? { x: 10, y: H * 0.5, width: W - 20, height: H * 0.5 - 10 } : { x: W * 0.56 + 6, y: top, width: W * 0.44 - 16, height: H - top - 8 };
    const ppm = PROJECTION.ppm;
    const pxPerM = Math.min(battle.width / FIGHT.width, battle.height / (FIGHT.vTop - FIGHT.vBottom));
    const S = pxPerM / ppm;
    const vMid = (FIGHT.vTop + FIGHT.vBottom) / 2;
    scene.cameras.main.setBackgroundColor('#0c1118');
    const world = scene.add.container(battle.x + battle.width / 2 + PROJECTION.uMin * ppm * S, battle.y + battle.height / 2 - (PROJECTION.vMax - vMid) * ppm * S).setScale(S);
    world.add(scene.add.image(0, 0, textureKeyOf(edition, BACKGROUND_FILE)).setOrigin(0, 0).setDepth(-1e9));
    /** Screen pixels of a world point. */
    const screenOf = (x: number, y: number, z: number) => {
      const p = project(PROJECTION, x, y, z);
      return { x: world.x + p.x * S, y: world.y + p.y * S };
    };

    // ---------------------------------------------------------------- the party and the monsters
    const actors = new Map<string, Actor2D>();
    const kinds = new Map<string, EnemyKind>();
    for (const id of HEROES) {
      const a = new Actor2D(scene, edition, id, PROJECTION, { dirs: 8, clips: clips(id, HERO_CLIPS_2D), stiffness: 20 }, world);
      const [x, , z] = HALL.party[id];
      a.placeAt(x, z);
      a.face(0, -1);
      a.tint(VAULT_TINT);
      actors.set(id, a);
    }
    const homeOf = (id: string): { x: number; z: number } => {
      const hero = HALL.party[id as HeroId];
      if (hero) return { x: hero[0], z: hero[2] };
      return spots.get(id) ?? { x: 0, z: 0 };
    };
    const spots = new Map<string, { x: number; z: number }>();
    const headOf = (id: string, lift = 1.4) => {
      const a = actors.get(id);
      return a ? screenOf(a.x, a.lift + lift * (a.sprite.scaleY || 1), a.z) : { x: W / 2, y: H / 2 };
    };

    // ---------------------------------------------------------------- HUD
    const status = new StatusBar2D(scene, t('place'));
    if (ctx.host?.toggleMute) {
      const icon = status.icon('🔊', () => icon.setText(ctx.host?.toggleMute?.() ? '🔇' : '🔊'));
    }
    if (ctx.host?.openStory) status.icon('📖', () => ctx.host?.openStory?.());
    let place = '';
    let hearts = '';
    const drawStatus = (): void => status.set(place, hearts);
    const setCourage = (value: number, max: number): void => {
      hearts = '❤'.repeat(value) + '♡'.repeat(Math.max(0, max - value));
      drawStatus();
    };
    const card = new Card2D(scene, () => cardArea, () => audio.play('tap'), portrait ? 'bottom' : 'top');
    /** What the card waits for (the QC driver reads it). */
    let awaiting: 'choice' | 'order' | 'feedback' | null = null;

    // Monster HP pips above their heads.
    const hp = new Map<string, { e: EnemyState; g: Phaser.GameObjects.Graphics }>();
    function setEnemies(enemies: EnemyState[]): void {
      for (const h of hp.values()) h.g.destroy();
      hp.clear();
      for (const e of enemies) {
        const g = scene.add.graphics().setDepth(16_000);
        hp.set(e.id, { e: { ...e }, g });
      }
      drawHp();
    }
    function updateEnemy(id: string, value: number, defeated = false): void {
      const h = hp.get(id);
      if (!h) return;
      h.e.hp = value;
      h.e.defeated = defeated || value <= 0;
      drawHp();
    }
    function drawHp(): void {
      for (const { e, g } of hp.values()) {
        g.clear();
        if (e.defeated) continue;
        const w = e.maxHp * 13;
        g.fillStyle(0x121a2c, 0.8).fillRoundedRect(-w / 2 - 6, -9, w + 12, 18, 9);
        for (let i = 0; i < e.maxHp; i++) {
          const x = -w / 2 + 6.5 + i * 13;
          if (i < e.hp) g.fillStyle(0xef4444, 1).fillCircle(x, 0, 5);
          else g.lineStyle(2, 0xef4444, 0.8).strokeCircle(x, 0, 4);
        }
      }
    }

    // ---------------------------------------------------------------- sound
    audio.defineSfx('whoosh', (s) => s.noise(0.2, 0.12, 1800));

    // ---------------------------------------------------------------- helpers
    let destroyed = false;
    const wait = (seconds: number): Promise<void> => new Promise((resolve) => scene.time.delayedCall(seconds * 1000, () => resolve()));
    const tween = (config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> =>
      new Promise((resolve) => scene.tweens.add({ ...config, onComplete: () => resolve() }));
    const smooth = (u: number): number => u * u * (3 - 2 * u);
    /** Moves an actor in a straight line over `ms` (a dash, a knock-back, a flight). */
    function glide(a: Actor2D, to: { x: number; z: number; lift?: number }, ms: number): Promise<void> {
      const from = { x: a.x, z: a.z, lift: a.lift };
      const u = { v: 0 };
      return tween({
        targets: u,
        v: 1,
        duration: ms,
        onUpdate: () => {
          const k = smooth(u.v);
          a.lift = from.lift + ((to.lift ?? from.lift) - from.lift) * k;
          a.placeAt(from.x + (to.x - from.x) * k, from.z + (to.z - from.z) * k);
        },
      });
    }
    function burst(x: number, y: number, color: number, n = 14): void {
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + Math.random() * 0.5;
        const d = 20 + Math.random() * 26;
        const dot = scene.add.circle(x, y, 3 + Math.random() * 3, color).setDepth(17_000);
        scene.tweens.add({ targets: dot, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.7 - 12, alpha: 0, scale: 0.3, duration: 550, ease: 'Cubic.Out', onComplete: () => dot.destroy() });
      }
    }
    /** A glowing bolt from one screen point to another; resolves on impact. */
    function bolt(from: { x: number; y: number }, to: { x: number; y: number }, color: number): Promise<void> {
      const ball = scene.add.circle(from.x, from.y, 9, color).setStrokeStyle(4, 0xffffff, 0.6).setDepth(17_500);
      return tween({ targets: ball, x: to.x, y: to.y, duration: 340, ease: 'Quad.In' }).then(() => {
        ball.destroy();
        burst(to.x, to.y, color, 10);
      });
    }

    // ---------------------------------------------------------------- the battle moves (as battle-stage.ts)
    async function spawn(enemies: EnemyState[]): Promise<void> {
      for (const [id, a] of actors) {
        if (HEROES.includes(id as HeroId)) continue;
        a.destroy();
        actors.delete(id);
      }
      spots.clear();
      kinds.clear();
      await Promise.all(
        enemies.map(async (e, i) => {
          const boss = e.kind === 'dragon-fire';
          const spot = boss ? HALL.boss : (HALL.enemies[i] ?? HALL.enemies[0]!);
          const at = { x: spot[0], z: spot[2] };
          spots.set(e.id, at);
          kinds.set(e.id, e.kind);
          const bat = e.kind === 'giant-bat';
          const a = new Actor2D(scene, edition, e.kind, PROJECTION, { dirs: boss ? 8 : 4, clips: clips(e.kind, ENEMY_CLIPS_2D[e.kind] ?? ['idle']), idle: bat ? 'fly' : 'idle', stiffness: 20 }, world);
          if (boss) a.sprite.setScale(DRAGON_SCALE);
          a.tint(VAULT_TINT);
          a.lift = bat ? 0.55 : 0;
          a.placeAt(at.x, at.z);
          a.face(0, 1);
          a.sprite.setAlpha(0);
          actors.set(e.id, a);
          await wait(i * 0.35);
          a.sprite.setAlpha(1);
          if (e.kind === 'skeleton') await a.play('rise');
          else if (e.kind === 'mimic') {
            await a.play('reveal', 0.8);
            scene.cameras.main.shake(300, 0.006);
          } else if (bat) {
            a.lift = 2.7;
            a.placeAt(at.x + (i ? 2.5 : -2.5), at.z - 1.5);
            await glide(a, { ...at, lift: 0.55 }, 1100);
            await a.play('screech');
          } else if (boss) {
            a.lift = 6;
            a.placeAt(at.x - 3, at.z - 4);
            a.loop('fly');
            await glide(a, { ...at, lift: 0 }, 2000);
            a.loop('idle');
            scene.cameras.main.shake(400, 0.008);
            await a.play('roar');
          }
        }),
      );
    }

    function heroAttack(hero: HeroId, target: string, move: 'attack' | 'attack2'): { hit: Promise<void>; done: Promise<void> } {
      const a = actors.get(hero);
      const foe = actors.get(target);
      if (!a || !foe) return { hit: Promise.resolve(), done: Promise.resolve() };
      const home = homeOf(hero);
      if (hero === 'knight') {
        // A short dash toward the target, the swing, and back.
        const dx = foe.x - home.x;
        const dz = foe.z - home.z;
        const len = Math.hypot(dx, dz) || 1;
        const dist = Math.max(0, len - 1.1);
        const dest = { x: home.x + (dx / len) * dist, z: home.z + (dz / len) * dist };
        const hit = (async () => {
          a.face(dx, dz);
          a.loop('run');
          await glide(a, dest, 280);
          a.loop('idle');
          const swing = a.play(move);
          await wait(a.clipSeconds(move) * 0.45);
          void swing.then(async () => {
            a.loop('run');
            await glide(a, home, 320);
            a.loop('idle');
            a.face(0, -1);
          });
        })();
        return { hit, done: hit.then(() => wait(0.7)) };
      }
      // Casters: the clip, then a bolt from the hero to the target.
      a.face(foe.x - a.x, foe.z - a.z);
      const cast = a.play(move);
      const hit = wait(a.clipSeconds(move) * (hero === 'cleric' ? 0.5 : 0.45)).then(() =>
        bolt(headOf(hero, 0.8), headOf(target, kinds.get(target) === 'dragon-fire' ? 1.6 : 0.6), hero === 'wizard' ? 0xff7a1a : 0xfff0a0),
      );
      return { hit, done: Promise.all([hit, cast]).then(() => a.face(0, -1)) };
    }

    async function enemyHit(id: string): Promise<void> {
      const a = actors.get(id);
      if (!a) return;
      a.flash(0xffffff, 140);
      const home = homeOf(id);
      void glide(a, { x: home.x, z: home.z - 0.18 }, 120).then(() => glide(a, home, 250));
      await a.play('hit');
    }

    async function enemyDefeated(id: string): Promise<void> {
      const a = actors.get(id);
      if (!a) return;
      await a.play('death', 1, true);
      await tween({ targets: a.sprite, scaleX: 0, scaleY: 0, alpha: 0, duration: 450 });
      a.sprite.setVisible(false);
    }

    async function heroMiss(hero: HeroId, target: string): Promise<void> {
      const a = actors.get(hero);
      const foe = actors.get(target);
      if (!a) return;
      const clip = hero === 'cleric' ? 'attack2' : 'attack';
      const cast = a.play(clip);
      if (foe) {
        const home = homeOf(target);
        void wait(a.clipSeconds(clip) * 0.45).then(() => glide(foe, { x: home.x + 0.45, z: home.z }, 150).then(() => glide(foe, home, 350)));
      }
      await cast;
    }

    async function enemyAttack(enemy: string, hero: HeroId): Promise<void> {
      const foe = actors.get(enemy);
      const a = actors.get(hero);
      const strike = foe?.play('attack') ?? Promise.resolve();
      await wait((foe?.clipSeconds('attack') ?? 0) * 0.55);
      a?.flash(0xff4040, 160);
      scene.cameras.main.shake(250, 0.005);
      await (a?.play('hit') ?? Promise.resolve());
      await strike;
    }

    function heal(hero: HeroId): void {
      const at = headOf(hero, 1.1);
      burst(at.x, at.y, 0x9dffb0, 16);
    }

    async function victory(): Promise<void> {
      await Promise.all(HEROES.map((h, i) => wait(i * 0.12).then(() => actors.get(h)?.play('victory', 1, true))));
    }

    // ---------------------------------------------------------------- the card
    const heroName = (hero: HeroId): string => i18n.t(`heroes.${hero}`);

    async function ask(hero: HeroId, c: Challenge): Promise<Response> {
      const look = HERO_LOOK[hero];
      card.begin();
      card.pill(`${look.emoji} ${t('turn', { name: heroName(hero) })}`, look.color, c.retry ? t('again') : '');
      if (c.kind === 'sentence') {
        card.line(t(`ask.${c.kind}`), 15, '#6a5a8a', { bold: false });
        awaiting = 'order';
        const tokenIds = await card.arrange(c.tokens, { empty: t('tray.empty'), clear: t('tray.clear'), check: t('tray.check') });
        awaiting = null;
        return { kind: 'order', tokenIds };
      }
      const long = c.prompt.length > 28;
      card.line(c.prompt.replace('___', '＿＿'), long ? 20 : 28);
      if ('hint' in c && c.hint) card.line(c.hint, 15, '#6a5a8a', { bold: false });
      card.line(t(`ask.${c.kind}`), 15, '#6a5a8a', { bold: false });
      awaiting = 'choice';
      const optionId = await card.choose(c.options);
      awaiting = null;
      return { kind: 'choice', optionId };
    }

    /**
     * Shows how the answer went. A right answer flashes green and moves on; a wrong one shows the
     * right answer and a kind explanation, and waits for "Continue" (or a look back at the story).
     */
    async function answer(f: Feedback, response: Response | null, challenge: Challenge | null): Promise<void> {
      if (challenge && challenge.kind !== 'sentence' && response?.kind === 'choice') card.markChoice(response.optionId, f.correct, f.correctText);
      if (f.correct) {
        audio.play('correct');
        await card.feedback(true, `<b>${t('right')}</b>`);
        await wait(0.75);
        card.hide();
        return;
      }
      audio.play('wrong');
      const canLook = f.paragraph !== undefined && !!ctx.host?.openStory;
      const actions: CardAction[] = [...(canLook ? [{ id: 'look', label: t('lookInStory'), soft: true }] : []), { id: 'go', label: t('continue') }];
      awaiting = 'feedback';
      let action = await card.feedback(false, `${t('wrong', { answer: f.correctText })}${f.explanation ? `\n${f.explanation}` : ''}`, actions);
      while (action === 'look') {
        // The story opens over the battle; the same feedback waits for "Continue" afterwards.
        ctx.host?.openStory?.(f.paragraph);
        action = await card.buttons(actions);
      }
      awaiting = null;
      card.hide();
    }

    // ---------------------------------------------------------------- the quest
    const quest = createMonsterEncounters(story, { seed, helper: options.helper });
    const startedAt = performance.now();
    let score = 0;

    const finish = (r: QuestResults): void => {
      const items = r.items.map((i) => {
        const source = [...story.sentences, ...story.fills, ...story.questions].find((x) => x.id === i.itemId);
        const paragraph = source && 'paragraph' in source ? source.paragraph : undefined;
        return { itemId: i.itemId, itemKind: i.kind, label: i.label, attempts: Math.max(1, i.attempts), correctFirstTry: i.correctFirstTry, solved: i.solved, ...(paragraph !== undefined ? { paragraph } : {}) };
      });
      const evidence: StoryGameEvidence = { schemaVersion: 1, kind: 'story-game', gameId: 'monster-encounters', storyId: story.id, level: story.level, seed, durationMs: Math.round(performance.now() - startedAt), items, practice: practiceOf(items) };
      ctx.complete(toGameResults(evidence, score), 'victory', evidence);
    };

    async function run(first: GameEvent[]): Promise<void> {
      const queue = [...first];
      let active: HeroId = 'knight';
      let challenge: Challenge | null = null;
      let response: Response | null = null;
      let pending: Promise<void> = Promise.resolve();
      const max = quest.state.maxCourage;
      setCourage(quest.state.courage, max);
      while (queue.length && !destroyed) {
        const ev = queue.shift()!;
        switch (ev.type) {
          case 'encounterStart': {
            await pending;
            const info = ev.encounter;
            const boss = info.enemies.some((e) => e.kind === 'dragon-fire');
            setEnemies([]);
            place = t('progress', { index: info.index + 1, count: info.count, name: info.name });
            setCourage(quest.state.courage, max);
            audio.music(boss ? 'boss' : 'battle');
            audio.play(boss ? 'roar' : 'spawn');
            await Promise.all([banner(scene, info.name, info.intro, 2.6), spawn(info.enemies)]);
            setEnemies(info.enemies);
            break;
          }
          case 'turn':
            await pending;
            active = ev.hero;
            challenge = ev.challenge;
            response = await ask(ev.hero, ev.challenge);
            queue.push(...quest.dispatch({ type: 'answer', response }));
            break;
          case 'answer':
            await answer(ev.feedback, response, challenge);
            break;
          case 'heroAttack': {
            audio.play('whoosh');
            const move = heroAttack(ev.hero, ev.target, ev.move);
            await move.hit;
            audio.play('hit');
            score += ev.damage;
            const at = headOf(ev.target);
            popup(scene, at.x, at.y, `-${ev.damage}`, '', 17_800);
            pending = move.done;
            break;
          }
          case 'enemyHit':
            updateEnemy(ev.enemy, ev.hp);
            await enemyHit(ev.enemy);
            break;
          case 'enemyDefeated':
            updateEnemy(ev.enemy, 0, true);
            audio.play('defeat');
            await enemyDefeated(ev.enemy);
            break;
          case 'heroMiss': {
            const at = headOf(ev.target);
            popup(scene, at.x, at.y, t('miss'), 'miss', 17_800);
            await heroMiss(ev.hero, ev.target);
            break;
          }
          case 'enemyAttack': {
            await enemyAttack(ev.enemy, active);
            setCourage(ev.courage, max);
            const at = headOf(active, 1.2);
            popup(scene, at.x, at.y, t('courageLost'), '', 17_800);
            break;
          }
          case 'heal': {
            heal(ev.hero);
            audio.play('heal');
            setCourage(ev.courage, max);
            const at = headOf(ev.hero, 1.3);
            popup(scene, at.x, at.y, t('courageGained'), 'good', 17_800);
            break;
          }
          case 'rest':
            setCourage(ev.courage, max);
            await banner(scene, t('rest.title'), t('rest.text'), 2.4);
            break;
          case 'xp':
            // XP is the apps' rule, computed once for the results; no running XP in play.
            break;
          case 'encounterCleared':
            await pending;
            await wait(0.3);
            break;
          case 'victory':
            await pending;
            card.hide();
            audio.music('calm');
            audio.play('victory');
            await Promise.all([victory(), banner(scene, t('victory.title'), t('victory.text'), 2.2)]);
            if (!destroyed) finish(ev.results);
            return;
        }
      }
    }

    // ---------------------------------------------------------------- frames
    let last = 0;
    frame = (time: number) => {
      const dt = Math.min(0.1, last ? (time - last) / 1000 : 0);
      last = time;
      for (const a of actors.values()) a.update(dt);
      for (const [id, { g }] of hp) {
        const kind = kinds.get(id);
        const at = headOf(id, kind === 'giant-bat' ? 1.0 : kind === 'dragon-fire' ? 1.55 : 1.3);
        g.setPosition(at.x, at.y);
      }
      world.sort('depth');
    };

    const hook = {
      state: () => quest.state,
      /** What the card waits for, and its tappable elements in game pixels. */
      card: () => ({ awaiting, targets: card.targets }),
      size: () => ({ width: W, height: H }),
      dispatch: (command: Parameters<typeof quest.dispatch>[0]) => void quest.dispatch(command),
      tick: () => undefined,
    };
    const qc = window as unknown as { __apk3dView2d?: typeof hook };
    qc.__apk3dView2d = hook;
    const cleanup = (): void => {
      destroyed = true;
      frame = null;
      card.hide();
      if (qc.__apk3dView2d === hook) delete qc.__apk3dView2d;
      unlock?.();
    };
    scene.events.once('shutdown', cleanup);
    scene.events.once('destroy', cleanup);

    drawStatus();
    void run(quest.dispatch({ type: 'start' }));
  }

  function update(this: Phaser.Scene, time: number): void {
    frame?.(time);
  }

  return {
    width,
    height,
    backgroundColor: '#0c1118',
    render: { antialias: true, roundPixels: false },
    scene: { key: 'monster-encounters', preload, create, update },
  };
}
