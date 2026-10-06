/**
 * The student's "2D mode (older phones)" setting: one value per device that the game host and
 * every page with a 3D view read, so a student who picks 2D once gets 2D everywhere (owner,
 * 2026-10-06; track apk_pack_release_20261006).
 *
 * Format: browser storage of the app origin, key `RENDERER_SETTING_KEY`, a JSON object whose
 * `flat: true` means 2D. The Forge demo host has saved its choices in this object since
 * 2026-09-28, so the other fields of the object stay as they are. `?renderer=phaser` in the page
 * address forces 2D for one visit. The device gate still decides in `'auto'`: a page calls
 * `selectRenderer({ renderers: ['three', 'phaser'] }, checkDevice(...), readRendererSetting())`.
 *
 * Browser storage can be blocked (private windows) or absent (server rendering): every call is
 * safe to fail, and a failure counts as `'auto'`.
 */
import type { RendererSetting } from './select.js';

/** The storage key of the saved setting (the Chibi Quest host object). */
export const RENDERER_SETTING_KEY = 'chibi-quest';

/** Where the setting comes from: the page query string and the browser storage. */
export interface RendererSettingSource {
  search?: string;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
}

function browser(): Required<RendererSettingSource> {
  const w = typeof window === 'undefined' ? undefined : window;
  let storage: Storage | null = null;
  try {
    storage = w?.localStorage ?? null;
  } catch {
    storage = null;
  }
  return { search: w?.location?.search ?? '', storage };
}

/** The setting that a query string and a saved JSON text give. Pure. */
export function rendererSettingOf(search: string, saved: string | null): RendererSetting {
  if (new URLSearchParams(search).get('renderer') === 'phaser') return 'phaser';
  try {
    const value = JSON.parse(saved ?? '{}') as { flat?: unknown } | null;
    return value && typeof value === 'object' && value.flat === true ? 'phaser' : 'auto';
  } catch {
    return 'auto';
  }
}

/** Reads the setting from the page address and the browser storage (`'auto'` on the server). */
export function readRendererSetting(source: RendererSettingSource = browser()): RendererSetting {
  let saved: string | null = null;
  try {
    saved = source.storage?.getItem(RENDERER_SETTING_KEY) ?? null;
  } catch {
    saved = null;
  }
  return rendererSettingOf(source.search ?? '', saved);
}

/** Saves the setting (`'phaser'` = 2D mode) and keeps the other fields of the saved object. */
export function saveRendererSetting(setting: RendererSetting, source: RendererSettingSource = browser()): void {
  try {
    const storage = source.storage;
    if (!storage) return;
    const parsed = JSON.parse(storage.getItem(RENDERER_SETTING_KEY) ?? '{}') as unknown;
    const current = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
    storage.setItem(RENDERER_SETTING_KEY, JSON.stringify({ ...current, flat: setting === 'phaser' }));
  } catch {
    // The choice applies to this visit only.
  }
}
