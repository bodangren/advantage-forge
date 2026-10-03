/** ModelLoader.loadPacks: the manifests of the generated packs resolve model and preset paths. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModelLoader } from '../../src/apk3d/stage/loader.js';

const SITE = join(process.cwd(), 'demo', 'public');

function stubFetch(missing: readonly string[] = []): ReturnType<typeof vi.fn> {
  const fn = vi.fn(async (url: string) => {
    const rel = url.replace(/^site\//, '');
    if (missing.some((m) => rel.includes(m))) return new Response('no', { status: 404, statusText: 'Not Found' });
    return new Response(readFileSync(join(SITE, rel), 'utf8'), { status: 200 });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('ModelLoader packs', () => {
  it('falls back to the legacy path before any pack loads', () => {
    const loader = new ModelLoader('site/');
    expect(loader.modelPath('wall')).toBe('models/wall.glb');
    expect(loader.presetPath('knight', 'royal')).toBe('models/knight/royal.webp');
  });

  it('resolves models and presets from the loaded manifests, fetching each pack once', async () => {
    const fetchFn = stubFetch();
    const loader = new ModelLoader('site/');
    await loader.loadPacks(['sunken-vault', 'heroes']);
    await loader.loadPacks(['heroes']);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(loader.modelPath('wall')).toBe('packs/sunken-vault/1.0.0/wall.glb');
    expect(loader.modelPath('knight')).toBe('packs/heroes/1.0.0/knight.glb');
    expect(loader.presetPath('knight', 'champion')).toBe('packs/heroes/1.0.0/knight/champion.webp');
    expect(loader.modelPath('not-a-model')).toBe('models/not-a-model.glb');
  });

  it('rejects when a pack manifest is missing, and retries on the next call', async () => {
    stubFetch(['heroes']);
    const loader = new ModelLoader('site/');
    await expect(loader.loadPacks(['heroes'])).rejects.toThrow(/model pack "heroes": 404/);
    stubFetch();
    await expect(loader.loadPacks(['heroes'])).resolves.toBeUndefined();
  });
});
