/**
 * The Potion Rush 3D cartridge manifest (section 2.1 of docs/apk3d-cartridge.md).
 *
 * `inputMode` is 'story': the host passes the whole `StoryInput`, and the evidence needs the
 * sentence ids, the paragraphs, the story id, and the level. The core also accepts the APK
 * `SentenceInput` (section 5.2 of the design), so the APK port can switch this to 'sentence'.
 */
import { APK3D_CAPABILITIES, CARTRIDGE_3D_RUNTIME_API_VERSION, validateCartridge3DManifest } from '../../apk3d/contracts/index.js';

export const manifest = validateCartridge3DManifest({
  id: 'potion-rush',
  title: 'Potion Rush',
  description: 'Brew every sentence the customers order: drag the words into the cauldrons in order, then serve.',
  runtimeApiVersion: CARTRIDGE_3D_RUNTIME_API_VERSION,
  renderers: ['three'],
  inputMode: 'story',
  simulation: 'realtime',
  orientation: 'portrait',
  levels: ['A0', 'A0+', 'A1'],
  needs: { sentences: 3 },
  requiredAssetBindings: [],
  requiredModelBindings: [],
  packs: ['heroes', 'potion-shop'],
  capabilities: [...APK3D_CAPABILITIES],
  device: {},
  budget: { firstLoadBytes: 4_000_000, totalBytes: 8_000_000 },
  briefingKey: 'potionRush.briefing',
});
