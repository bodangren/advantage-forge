/**
 * The Dragon Flight 3D cartridge manifest (section 2.1 of docs/apk3d-cartridge.md).
 *
 * `inputMode` is 'story': the host passes the whole `StoryInput`, and the evidence needs the
 * vocabulary ids, the story id, and the level. The core also accepts the APK `VocabularyInput`
 * (section 6 of the design), so the APK port can switch this to 'vocabulary'.
 */
import { APK3D_CAPABILITIES, CARTRIDGE_3D_RUNTIME_API_VERSION, validateCartridge3DManifest } from '../../apk3d/contracts/index.js';

export const manifest = validateCartridge3DManifest({
  id: 'dragon-flight',
  title: 'Dragon Flight',
  description: 'Ride the fire dragon through the gate with the right meaning: every right gate adds a dragon to the flock for the boss.',
  runtimeApiVersion: CARTRIDGE_3D_RUNTIME_API_VERSION,
  renderers: ['three'],
  inputMode: 'story',
  simulation: 'realtime',
  orientation: 'any',
  levels: ['A0', 'A0+', 'A1'],
  needs: { vocabulary: 4 },
  requiredAssetBindings: [],
  requiredModelBindings: [],
  packs: ['heroes', 'flight'],
  capabilities: [...APK3D_CAPABILITIES],
  device: {},
  budget: { firstLoadBytes: 4_000_000, totalBytes: 8_000_000 },
  briefingKey: 'dragonFlight.briefing',
});
