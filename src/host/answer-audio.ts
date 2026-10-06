/**
 * The demo's answer audio (`?audio=1`, F2): for a game that declares `read-to-select-audio`, a Read
 * to Select Audio controller whose clips are the story's words, spoken with the browser's English
 * voice. The apps use the prepared clips of the content route instead. With `?qc=1` a clip is a
 * silent half second, so the QC driver does not depend on the browser's speech.
 */
import { createAnswerChoiceAudioController, speak, stopSpeaking, type AnswerChoiceAudioController } from '../apk3d/audio/index.js';
import { MAX_LISTENING_SESSION_ITEMS, type Cartridge3DManifest, type StoryInput } from '../apk3d/contracts/index.js';

const params = new URLSearchParams(location.search);
const ON = params.get('audio') === '1';
const QC_CLIP_MS = 500;

/** True when this visit asks for answer audio and the game has the mode. */
export function wantsAnswerAudio(manifest: Cartridge3DManifest): boolean {
  return ON && (manifest.challenge?.modalities.includes('read-to-select-audio') ?? false);
}

/** A new controller for one run (the mount destroys it with the game). */
export function demoAnswerAudio(input: StoryInput): AnswerChoiceAudioController {
  const terms = input.vocabulary.slice(0, MAX_LISTENING_SESSION_ITEMS).map((v) => v.term);
  const qc = params.get('qc') === '1';
  return createAnswerChoiceAudioController<string>({
    session: {
      modality: 'read-to-select-audio',
      promptLocale: 'th-TH',
      answerLocale: 'en-US',
      promptField: 'translation',
      answerField: 'term',
      scored: false,
    },
    clips: terms.map((_, itemPosition) => ({ itemPosition, url: `speech:${itemPosition}`, mediaType: 'audio/speech' as const })),
    preparationTimeoutMs: 5_000,
    preparation: { prepare: async (reference) => terms[reference.itemPosition]!, release: () => undefined },
    playback: {
      play: (term, signal) => {
        if (qc) return new Promise((resolve) => setTimeout(resolve, QC_CLIP_MS));
        const stop = (): void => stopSpeaking();
        signal.addEventListener('abort', stop, { once: true });
        return speak(term).finally(() => signal.removeEventListener('abort', stop));
      },
    },
    // The demo's music is quiet under speech, so the demo does not duck it.
    ducking: { duck: () => () => undefined },
  });
}
