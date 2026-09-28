/**
 * The Devourer Slime 3D cartridge manifest (section 2.1 of docs/apk3d-cartridge.md).
 *
 * `inputMode` is 'story': the host passes the whole `StoryInput`, and the evidence needs the
 * sentence ids, the paragraphs, the story id, and the level. The core also accepts the APK
 * `SentenceInput`, so the APK port can switch this to 'sentence'.
 */
import { APK3D_CAPABILITIES, CARTRIDGE_3D_RUNTIME_API_VERSION, validateCartridge3DManifest } from '../../apk3d/contracts/index.js';

export const manifest = validateCartridge3DManifest({
  id: 'devourer-slime',
  title: 'Devourer Slime',
  description: 'Eat the word bubbles of each sentence in order; grow with every right word and swallow the guards.',
  runtimeApiVersion: CARTRIDGE_3D_RUNTIME_API_VERSION,
  renderers: ['three'],
  inputMode: 'story',
  simulation: 'realtime',
  orientation: 'any',
  levels: ['A0', 'A0+', 'A1'],
  needs: { sentences: 3 },
  requiredAssetBindings: [],
  requiredModelBindings: [],
  packs: ['clearing'],
  capabilities: [...APK3D_CAPABILITIES],
  device: {},
  budget: { firstLoadBytes: 4_000_000, totalBytes: 8_000_000 },
  briefingKey: 'devourerSlime.briefing',
});
