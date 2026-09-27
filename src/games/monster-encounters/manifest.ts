/** The Monster Encounters cartridge manifest (section 2.1 of docs/apk3d-cartridge.md). */
import { APK3D_CAPABILITIES, CARTRIDGE_3D_RUNTIME_API_VERSION, validateCartridge3DManifest } from '../../apk3d/contracts/index.js';

export const manifest = validateCartridge3DManifest({
  id: 'monster-encounters',
  title: 'Monster Encounters',
  description: 'Turn-based battles in the Sunken Vault: every hero action needs an answer from the story.',
  runtimeApiVersion: CARTRIDGE_3D_RUNTIME_API_VERSION,
  renderer: 'three',
  inputMode: 'story',
  simulation: 'turn',
  orientation: 'any',
  levels: ['A0', 'A0+', 'A1'],
  needs: { vocabulary: 4, questions: 1 },
  requiredAssetBindings: [],
  requiredModelBindings: [],
  packs: ['heroes', 'sunken-vault', 'dungeon-monsters'],
  capabilities: [...APK3D_CAPABILITIES],
  device: {},
  budget: { firstLoadBytes: 4_000_000, totalBytes: 6_000_000 },
  briefingKey: 'monsterEncounters.briefing',
});
