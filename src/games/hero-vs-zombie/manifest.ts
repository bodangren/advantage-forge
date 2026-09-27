/**
 * The Hero vs. Zombie 3D cartridge manifest (section 2.1 of docs/apk3d-cartridge.md).
 *
 * `inputMode` is 'story': the host passes the whole `StoryInput`, and the evidence needs the
 * vocabulary ids, the story id, and the level. The core also accepts the APK `VocabularyInput`,
 * so the APK port can switch this to 'vocabulary'.
 */
import { APK3D_CAPABILITIES, CARTRIDGE_3D_RUNTIME_API_VERSION, validateCartridge3DManifest } from '../../apk3d/contracts/index.js';

export const manifest = validateCartridge3DManifest({
  id: 'hero-vs-zombie',
  title: 'Hero vs. Zombie',
  description: 'Run to the orb with the meaning of the story word, charge your Blast, and knock the churchyard zombies flat until dawn.',
  runtimeApiVersion: CARTRIDGE_3D_RUNTIME_API_VERSION,
  renderer: 'three',
  inputMode: 'story',
  simulation: 'realtime',
  orientation: 'any',
  levels: ['A0', 'A0+', 'A1'],
  needs: { vocabulary: 4 },
  requiredAssetBindings: [],
  requiredModelBindings: [],
  packs: ['heroes', 'churchyard'],
  capabilities: [...APK3D_CAPABILITIES],
  device: {},
  budget: { firstLoadBytes: 4_000_000, totalBytes: 8_000_000 },
  briefingKey: 'heroVsZombie.briefing',
});
