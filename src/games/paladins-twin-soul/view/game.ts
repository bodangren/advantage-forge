/**
 * Paladin's Twin Soul as a 3D cartridge game: the core decides everything; the driver
 * (./driver.ts) plays each event in order on the shared battle stage and the HUD, and reports
 * the run once to the host (results, outcome, evidence).
 */
import type { PracticeInput } from '../../../apk3d/contracts/index.js';
import { roleHero } from '../../../apk3d/avatar/launch.js';
import type { Game3DContext, Game3DInstance } from '../../../apk3d/factory/index.js';
import { playerBody } from '../../../apk3d/stage/index.js';
import { BattleStage } from '../../shared/battle/stage3d.js';
import { createTwinSoul, type TwinSoulCommand, type TwinSoulInput } from '../core/index.js';
import { TwinSoulPlayer, type Presentation, type Sfx } from './driver.js';
import { TwinSoulHud } from './hud.js';

const PRESET_HEROES = ['knight', 'wizard', 'cleric'] as const;
const SFX: Record<Sfx, string> = { reject: 'wrong', freed: 'correct', hit: 'hit', defeat: 'defeat', victory: 'victory', spawn: 'spawn' };

export async function createGame(ctx: Game3DContext): Promise<Game3DInstance> {
  if (Array.isArray(ctx.input)) throw new Error('Paladin’s Twin Soul needs a practice input.');
  const story: PracticeInput = ctx.input;
  const stage = new BattleStage(ctx.stage);
  const hud = new TwinSoulHud(ctx.hud, stage, ctx.i18n, ctx.audio, ctx.host);
  const audio = ctx.audio;
  const portrait = (): boolean => ctx.composition.profile === 'compact';
  // The student's avatar takes the party place of its class's role; the other two stay heroes.
  const avatar = ctx.options.avatar;
  const place = avatar ? roleHero(avatar.classId) : null;
  await stage.load(() => undefined, avatar && place ? { place, body: playerBody(ctx.stage.loader, avatar, place, ctx.diagnostic) } : undefined);
  for (const hero of PRESET_HEROES) {
    if (hero === place) continue;
    const look = ctx.options.looks[hero];
    if (look && look !== 'default') void stage.setPreset(hero, look);
  }
  stage.setLayout(portrait());
  stage.setFreeArea(true);

  const sim = createTwinSoul(story as TwinSoulInput, { seed: ctx.seed, helper: ctx.options.helper });
  let player: TwinSoulPlayer | null = null;

  const presentation: Presentation = {
    ask: (wave) => hud.ask(wave),
    setCourage: (v, max) => hud.setCourage(v, max),
    setTwins: (freed, count) => hud.setTwins(freed, count),
    setPlace: (index, count) => hud.setPlace(index, count, ''),
    // Phase 2 adds the bolt and dive animations to the new scene.
    bolt: async () => {
      audio.play('whoosh');
    },
    captured: () => hud.popup('knight', hud.label('captured'), '', 1.6),
    shadeFaded: (shade) => hud.mark(shade, 'wrong', 0.7),
    shadeDived: async () => {
      hud.popup('knight', hud.label('courageLost'), '', 1.2);
    },
    async soulFreed(shade, _points, firstTry) {
      hud.popup('knight', hud.label(firstTry ? 'freedFirst' : 'freed'), 'good', 1.6);
      await hud.mark(shade, 'right', 0.8);
    },
    async scatter() {
      hud.hideCard();
    },
    rest: () => hud.banner('rest', '', '', 2.4),
    sfx: (name) => audio.play(SFX[name]),
    async victory() {
      audio.music('calm');
      await Promise.all([stage.victory(), hud.banner('victory', '', '', 2.2)]);
    },
    settle: async () => undefined,
  };

  player = new TwinSoulPlayer({ sim, story, seed: ctx.seed, presentation, complete: (r, o, e) => ctx.complete(r, o, e) });
  (window as unknown as { __apk3dGame?: unknown }).__apk3dGame = { sim, story };

  return {
    start: () => void player?.start(),
    pause: () => undefined,
    resume: () => undefined,
    resize: () => undefined,
    recompose: (c) => {
      stage.setLayout(c.profile === 'compact');
      stage.setFreeArea(true);
    },
    captureResponsiveState: () => null,
    restoreResponsiveState: () => undefined,
    setMuted: () => undefined,
    destroy: async () => {
      player?.destroy();
      hud.dispose();
      delete (window as unknown as { __apk3dGame?: unknown }).__apk3dGame;
    },
    test: {
      state: () => sim.state,
      dispatch: (command) => void sim.dispatch(command as TwinSoulCommand),
      tick: () => undefined,
    },
  };
}
