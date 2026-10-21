/**
 * The monorepo sync workflow (track apk_monorepo_sync_workflow_20261020): the handoff rules of
 * scripts/monorepo-handoff.ts, the identical-rebuild rule of the pack release, and the heavy lock.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { modelPackJson, modelPackSchema, type ModelPack } from '../../src/apk3d/contracts/index.js';
import { PACK_VERSIONS } from '../../src/apk3d/contracts/model-pack.js';
import { identicalRebuild, packEntryFresh } from '../../scripts/apk-pack-models.js';
import { lockHolders } from '../../scripts/heavy-lock.js';
import {
  affectedGames,
  commitClass,
  handoffText,
  lastSync,
  packChanges3d,
  packsOf,
  parseTree,
  skinChange,
  spriteChanges,
  trackIds,
  type Handoff,
} from '../../scripts/monorepo-handoff.js';

const tree = (entries: Record<string, string>): Map<string, string> => new Map(Object.entries(entries));

describe('handoff rules', () => {
  it('finds the last sync in the port branch log', () => {
    const log = ['a1b2c3d\tfix(primary): unknown paths answer 404', '7d343fb95\tchore(game-cartridges-3d): sync from Forge d3624720 (track_id: x_20261003)', 'ce5a631\tchore(game-cartridges-3d): sync from Forge 84898702'].join('\n');
    expect(lastSync(log)).toEqual({ mono: '7d343fb95', forge: 'd3624720' });
    expect(lastSync('a1b2c3d\tfeat: no sync here')).toBeUndefined();
  });

  it('classes the commits by their subject', () => {
    expect(commitClass('fix(enchanted-library): the ghost spirits are larger')).toBe('fix');
    expect(commitClass('feat(games): Typing Duel')).toBe('feature');
    expect(commitClass('feat!: a breaking change')).toBe('feature');
    expect(commitClass('chore(apk): release packs from 74f60a2 (mounts 1.0.2)')).toBe('release');
    expect(commitClass('docs(measure): a plan')).toBe('other');
    expect(commitClass('a subject without a type')).toBe('other');
  });

  it('collects the track ids', () => {
    expect(trackIds(['Track game_xp_end_card_20261020.', 'measure/tracks/game_enchanted_library_20260928/plan.md', 'track_id: game_xp_end_card_20261020'])).toEqual([
      'game_enchanted_library_20260928',
      'game_xp_end_card_20261020',
    ]);
  });

  it('reads a git tree below a folder', () => {
    const ls = '100644 blob aaa\tdemo/public/packs/mounts/1.0.2/griffin.glb\n100644 blob bbb\tdemo/public/packsx/other.glb';
    expect([...parseTree(ls, 'demo/public/packs')]).toEqual([['mounts/1.0.2/griffin.glb', 'aaa']]);
  });

  it('sees a rebuild with the same bytes as the same model, under a new pack version', () => {
    const mono = tree({ 'mounts/1.0.1/pack.json': 'p1', 'mounts/1.0.1/griffin.glb': 'g', 'heroes/1.0.1/knight.glb': 'k', 'heroes/1.0.1/knight/royal.webp': 'r' });
    const forge = tree({ 'mounts/1.0.2/pack.json': 'p2', 'mounts/1.0.2/griffin.glb': 'g', 'heroes/1.0.1/knight.glb': 'k', 'heroes/1.0.1/knight/royal.webp': 'r' });
    expect(packChanges3d(mono, forge)).toEqual([{ id: 'mounts', from: '1.0.1', to: '1.0.2', models: [{ model: 'griffin', status: 'same' }] }]);
  });

  it('sees new, removed, and changed models and preset textures', () => {
    const mono = tree({ 'm/1.0.0/a.glb': '1', 'm/1.0.0/b.glb': '2', 'm/1.0.0/c.glb': '3', 'm/1.0.0/c/x.webp': '4' });
    const forge = tree({ 'm/1.1.0/a.glb': '1', 'm/1.1.0/c.glb': '3', 'm/1.1.0/c/x.webp': '5', 'm/1.1.0/d.glb': '6' });
    expect(packChanges3d(mono, forge)[0]!.models).toEqual([
      { model: 'a', status: 'same' },
      { model: 'b', status: 'removed' },
      { model: 'c', status: 'changed' },
      { model: 'd', status: 'new' },
    ]);
  });

  it('lists the changed 2D sheets, props, and backgrounds by model', () => {
    const mono = tree({ 'v1/pack.json': 'a', 'v1/sprites/griffin/fly.png': 'f', 'v1/props/apple.png': 'p', 'v1/backgrounds/labyrinth.png': 'b' });
    const forge = tree({ 'v1/pack.json': 'b', 'v1/sprites/griffin/fly.png': 'f', 'v1/sprites/ghost/idle.png': 'g', 'v1/props/apple.png': 'q', 'v1/backgrounds/labyrinth.png': 'b' });
    expect(spriteChanges(mono, forge)).toEqual([
      { model: 'apple', status: 'changed' },
      { model: 'ghost', status: 'new' },
    ]);
  });

  it('names the games of a changed model, a changed background, and changed game files', () => {
    const loads = { joust: { models: ['griffin'] }, hall: { models: ['ghost'], hero: true }, vault: { packs: ['vault'], models: [] } };
    const packs = { heroes: ['knight'], vault: ['chest'] };
    const games = affectedGames(['hall'], ['knight', 'chest', 'background:joust'], loads, packs);
    expect([...games]).toEqual([
      ['hall', ['game files', 'model knight']],
      ['joust', ['2D background']],
      ['vault', ['model chest']],
    ]);
  });

  it('reads the pack versions of a sync commit body', () => {
    expect(packsOf('subject\n\nPacks: dungeon-monsters 1.1.0, mounts 1.0.2.\nCopied by Forge.')).toBe('dungeon-monsters 1.1.0, mounts 1.0.2');
    expect(packsOf('Packs: no new version. Kit only: the rune labels fit.')).toBe('');
    expect(packsOf('no packs line')).toBe('');
  });

  it('writes a handoff that warns about a feature commit and names the target branch', () => {
    const h: Handoff = {
      forge: 'abc1234',
      date: '2026-10-20',
      branch: 'apk3d-games-port',
      target: 'primary-parity-integration',
      last: { mono: '7d343fb95', forge: 'd3624720' },
      forgeCommitOption: true,
      commits: [
        { sha: 'abc1234', subject: 'feat(games): a new game', cls: 'feature' },
        { sha: 'def5678', subject: 'fix(games): a fix', cls: 'fix' },
      ],
      kitFiles: [],
      gameFiles: new Map([['labyrinth', 2]]),
      forgeOnly: ['monster-encounters'],
      testFiles: 1,
      packs: [{ id: 'mounts', from: '1.0.1', to: '1.0.2', models: [{ model: 'griffin', status: 'same' }] }],
      sprites: { from: '1.2.0', to: '1.2.0', models: [] },
      games: new Map([['labyrinth', ['game files']]]),
      smoke: [],
      packUrls: ['packs/mounts/1.0.2/pack.json'],
      tracks: ['game_labyrinth_20260928'],
    };
    const text = handoffText(h);
    expect(text).toContain('**This range has 1 feature commit(s)** (abc1234)');
    expect(text).toContain('--commit --forge-commit abc1234');
    expect(text).toContain('Merge `apk3d-games-port` into `primary-parity-integration`.');
    expect(text).toContain('Same bytes: griffin.');
    expect(text).toContain('Not synced (Forge games that the monorepo package does not have): monster-encounters.');
    expect(text).toContain('`packs/mounts/1.0.2/pack.json`');
    expect(text).toContain('- 2D pack: no change.');
  });
});

describe('the RPG skin and the avatar pack in the handoff (track apk_skin_identical_rebuild_20261021)', () => {
  const skinJson = (version: string, files: string[]): string => JSON.stringify({ id: 'primary-rpg-skin', version, files: Object.fromEntries(files.map((f) => [f, {}])) });
  const app = { skin: skinJson('1.2.0', ['kit/heroes/knight.webp', 'kit/old.webp']), rpg: tree({ 'skin.json': 's1', 'kit/heroes/knight.webp': 'k1', 'kit/old.webp': 'o1' }), avatar: tree({ '1.1.0/pack.json': 'p1', '1.1.0/pieces/wand.glb': 'w1' }) };
  const base: Handoff = {
    forge: '5091f982',
    date: '2026-10-21',
    branch: 'apk3d-games-port',
    target: 'primary-parity-integration',
    last: { mono: '0c220e663', forge: 'afc8b890' },
    forgeCommitOption: false,
    commits: [],
    kitFiles: [],
    gameFiles: new Map(),
    forgeOnly: [],
    testFiles: 0,
    packs: [],
    sprites: { from: '1.2.0', to: '1.2.0', models: [] },
    games: new Map(),
    smoke: [],
    packUrls: [],
    tracks: [],
  };

  it('sees no change when the app has the Forge files', () => {
    const s = skinChange(app, { skin: skinJson('1.2.0', ['kit/heroes/knight.webp', 'kit/old.webp']), rpg: app.rpg, avatar: app.avatar, kit: '1.1.0' });
    expect(s).toMatchObject({ app: '1.2.0', forge: '1.2.0', write: 0, remove: 0, avatarApp: ['1.1.0'], avatarForge: ['1.1.0'], avatarWrite: 0 });
    const text = handoffText({ ...base, skin: s });
    expect(text).toContain('- RPG skin and avatar pack: no change (app skin 1.2.0, avatar pack 1.1.0 on `primary-parity-integration`).');
    expect(text).not.toContain('--skin <checkout>');
    expect(text).not.toContain('does not have it');
  });

  it('counts the files to write and remove, adds the skin sync step, and warns about a missing avatar pack version', () => {
    // The 01fa8cce case: a new avatar pack version and a kit that asks for it.
    const s = skinChange(app, {
      skin: skinJson('1.2.1', ['kit/heroes/knight.webp']),
      rpg: tree({ 'skin.json': 's2', 'kit/heroes/knight.webp': 'k2' }),
      avatar: tree({ '1.1.1/pack.json': 'p2', '1.1.1/pieces/wand.glb': 'w1' }),
      kit: '1.1.1',
    });
    expect(s).toMatchObject({ forge: '1.2.1', write: 2, remove: 1, avatarForge: ['1.1.1'], avatarWrite: 2, kitAvatar: '1.1.1' });
    const text = handoffText({ ...base, skin: s });
    expect(text).toContain('- RPG skin: app 1.2.0 -> Forge 1.2.1. Files to write: 2. Files to remove: 1.');
    expect(text).toContain('- Avatar pack: app 1.1.0 -> Forge 1.1.1. Files to write: 2.');
    expect(text).toContain('**The kit asks for avatar pack 1.1.1, and the app on `primary-parity-integration` does not have it.**');
    expect(text).toContain('4. The skin sync, from the Forge root into a checkout of `primary-parity-integration`');
    expect(text).toContain('6. Rebuild the app');
  });

  it('does not count a JSON file that has the same content in another format', () => {
    const forge = { skin: skinJson('1.2.0', ['kit/heroes/knight.webp', 'kit/old.webp']), rpg: app.rpg, avatar: tree({ '1.1.0/pack.json': 'p9', '1.1.0/pieces/wand.glb': 'w1' }), kit: '1.1.0' };
    expect(skinChange(app, forge).avatarWrite).toBe(1);
    expect(skinChange(app, forge, (path, a, b) => path === '1.1.0/pack.json' && a === 'p1' && b === 'p9').avatarWrite).toBe(0);
  });

  it('says when the target branch is missing', () => {
    expect(handoffText(base)).toContain('- RPG skin and avatar pack: not compared (no branch `primary-parity-integration` in the monorepo).');
  });
});

describe('a rebuild with the same bytes keeps the pack', () => {
  const root = (id: string): string => join(process.cwd(), 'demo', 'public', 'packs', id, PACK_VERSIONS[id]!);
  const pack: ModelPack = modelPackSchema.parse(JSON.parse(readFileSync(join(root('mounts'), 'pack.json'), 'utf8')));
  const griffin = pack.files.griffin!;
  const rebuilt = { ...griffin, provenance: { ...griffin.provenance, forgeCommit: 'abcdef12' } };

  it('keeps the old entry, so the manifest and the version do not change', () => {
    expect(identicalRebuild(griffin, rebuilt, () => true)).toBe(true);
    const kept = { ...pack, files: { ...pack.files, griffin: identicalRebuild(griffin, rebuilt, () => true) ? griffin : rebuilt } };
    expect(modelPackJson(kept)).toBe(modelPackJson(pack));
  });

  it('is not identical when a file differs or the entry differs', () => {
    expect(identicalRebuild(griffin, rebuilt, (f) => f !== griffin.path)).toBe(false);
    expect(identicalRebuild(griffin, { ...rebuilt, triangles: griffin.triangles + 1 }, () => true)).toBe(false);
    expect(identicalRebuild(griffin, { ...rebuilt, clips: [...griffin.clips, 'extra'] }, () => true)).toBe(false);
  });

  it('a checked source revision makes the old entry fresh, and only that revision', () => {
    expect(packEntryFresh('221be591', '221be59', undefined)).toBe(true);
    expect(packEntryFresh('221be591', 'abcdef12', undefined)).toBe(false);
    expect(packEntryFresh('221be591', 'abcdef12', { source: 'abcdef12', kept: '221be591' })).toBe(true);
    expect(packEntryFresh('221be591', '99999999', { source: 'abcdef12', kept: '221be591' })).toBe(false);
    expect(packEntryFresh('0a919a0', 'abcdef12', { source: 'abcdef12', kept: '221be591' })).toBe(false);
  });
});

describe('heavy lock', () => {
  it('reads the holders of a flock from /proc/locks and skips a waiting lock', () => {
    const locks = ['26: FLOCK  ADVISORY  WRITE 844401 08:02:1616806 0 EOF', '26: -> FLOCK  ADVISORY  WRITE 844500 08:02:1616806 0 EOF', '27: POSIX  ADVISORY  WRITE 900 08:02:1616806 0 EOF', '28: FLOCK  ADVISORY  WRITE 777 08:02:42 0 EOF'].join('\n');
    expect(lockHolders(locks, 1616806)).toEqual([844401]);
    expect(lockHolders(locks, 42)).toEqual([777]);
    expect(lockHolders(locks, 5)).toEqual([]);
  });
});
