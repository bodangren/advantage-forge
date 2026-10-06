/** The shared "2D mode (older phones)" setting: one value for the game host and the pages. */
import { describe, expect, it } from 'vitest';
import { RENDERER_SETTING_KEY, pageView, readRendererSetting, rendererSettingOf, saveRendererSetting, selectRenderer } from '../../src/apk3d/factory/index.js';

function memory(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
}

describe('renderer setting', () => {
  it('keeps the key and the field that the Forge host and the RPG pages already save', () => {
    expect(RENDERER_SETTING_KEY).toBe('chibi-quest');
    expect(rendererSettingOf('', JSON.stringify({ flat: true, hero: 'knight' }))).toBe('phaser');
    expect(rendererSettingOf('', JSON.stringify({ flat: false }))).toBe('auto');
  });

  it('forces 2D for one visit with ?renderer=phaser', () => {
    expect(rendererSettingOf('?renderer=phaser', null)).toBe('phaser');
    expect(rendererSettingOf('?renderer=three', JSON.stringify({ flat: true }))).toBe('phaser');
  });

  it('counts missing, broken, or blocked storage as auto', () => {
    expect(rendererSettingOf('', null)).toBe('auto');
    expect(rendererSettingOf('', '{not json')).toBe('auto');
    expect(rendererSettingOf('', 'null')).toBe('auto');
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readRendererSetting({ search: '', storage: blocked })).toBe('auto');
    expect(() => saveRendererSetting('phaser', { storage: blocked })).not.toThrow();
    expect(readRendererSetting({ search: '', storage: null })).toBe('auto');
  });

  it('saves the choice and keeps the other saved fields', () => {
    const storage = memory({ [RENDERER_SETTING_KEY]: JSON.stringify({ hero: 'ranger', looks: { ranger: 'dusk' } }) });
    saveRendererSetting('phaser', { storage });
    expect(JSON.parse(storage.data[RENDERER_SETTING_KEY]!)).toEqual({ hero: 'ranger', looks: { ranger: 'dusk' }, flat: true });
    expect(readRendererSetting({ search: '', storage })).toBe('phaser');
    saveRendererSetting('auto', { storage });
    expect(readRendererSetting({ search: '', storage })).toBe('auto');
  });

  it('gives a page with both views the same choice as a game', () => {
    const both = { renderers: ['three', 'phaser'] as const };
    expect(selectRenderer({ renderers: [...both.renderers] }, { status: 'ok' }, 'phaser')?.renderer).toBe('phaser');
    expect(selectRenderer({ renderers: [...both.renderers] }, { status: 'ok' }, 'auto')?.renderer).toBe('three');
    expect(selectRenderer({ renderers: [...both.renderers] }, { status: 'unsupported' }, 'auto')?.renderer).toBe('phaser');
  });

  it('gives a page view: 2D when forced or without WebGL2', () => {
    expect(pageView(true, 'auto')).toBe('3d');
    expect(pageView(true, 'phaser')).toBe('2d');
    expect(pageView(false, 'auto')).toBe('2d');
  });
});
