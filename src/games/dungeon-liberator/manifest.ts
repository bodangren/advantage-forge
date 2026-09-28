/**
 * The Dungeon Liberator 3D cartridge manifest (section 2.1 of docs/apk3d-cartridge.md).
 *
 * `inputMode` is 'story': the host passes the whole `StoryInput`, and the evidence needs the
 * sentence ids, the paragraphs, the story id, and the level. The core also accepts the APK
 * `SentenceInput`, so the APK port can switch this to 'sentence'.
 */
import { APK3D_CAPABILITIES, CARTRIDGE_3D_RUNTIME_API_VERSION, validateCartridge3DManifest } from '../../apk3d/contracts/index.js';

export const manifest = validateCartridge3DManifest({
  id: 'dungeon-liberator',
  title: 'Dungeon Liberator',
  description: 'Free the villagers of the Sunken Vault in the order of the sentence, then lead the line out through the gate.',
  runtimeApiVersion: CARTRIDGE_3D_RUNTIME_API_VERSION,
  renderers: ['three'],
  inputMode: 'story',
  simulation: 'realtime',
  orientation: 'any',
  levels: ['A0', 'A0+', 'A1'],
  needs: { sentences: 3 },
  requiredAssetBindings: [],
  requiredModelBindings: [],
  packs: ['heroes', 'vault'],
  capabilities: [...APK3D_CAPABILITIES],
  device: {},
  budget: { firstLoadBytes: 4_000_000, totalBytes: 8_000_000 },
  briefingKey: 'dungeonLiberator.briefing',
});
