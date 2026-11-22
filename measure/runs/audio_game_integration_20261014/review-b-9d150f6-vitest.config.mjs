// Probe-only vitest config for the Review B round 3 Phase 3 security probe.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['measure/runs/audio_game_integration_20261014/review-b-9d150f6-probe.test.ts'],
    environment: 'node',
    maxWorkers: 1,
  },
});
