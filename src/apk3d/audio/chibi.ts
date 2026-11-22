/**
 * The Chibi sound wiring (spec AC9). One helper sets the AudioBus file map and preloads the
 * events a game plays. A host with no sound base keeps every event on the synthesized recipe.
 */
import { hasOwn, type SoundFiles } from './bus.js';
import { CHIBI_EVENTS } from './chibi-events.gen.js';

/** The two AudioBus calls the helper makes; `AudioBus` satisfies it. */
export interface ChibiSoundBus {
  useSoundFiles(files: SoundFiles | null): void;
  preload(events: string[]): void;
}

/** The site base plus the rendered set folder, with one trailing slash before the files. */
export function chibiSoundFiles(soundBase: string): SoundFiles {
  return { base: `${soundBase}audio/chibi/`, events: CHIBI_EVENTS };
}

/** The game's mapped events in first-play order, with no duplicate. */
export function chibiPreload(events: readonly string[]): string[] {
  const seen = new Set<string>();
  const preload: string[] = [];
  for (const event of events) {
    if (!hasOwn(CHIBI_EVENTS, event)) continue;
    if (seen.has(event)) continue;
    seen.add(event);
    preload.push(event);
  }
  return preload;
}

/**
 * Sets the file map and preloads the game's mapped events. Returns false without a sound base,
 * so a host that supplies none keeps every event on the synthesized recipe.
 */
export function wireChibiSounds(
  audio: ChibiSoundBus,
  soundBase: string | undefined,
  gameEvents: readonly string[],
): boolean {
  if (!soundBase) return false;
  audio.useSoundFiles(chibiSoundFiles(soundBase));
  audio.preload(chibiPreload(gameEvents));
  return true;
}
