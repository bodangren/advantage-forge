// Probe-only vitest config: runs the Review B Phase 3 security probe from measure/runs.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['measure/runs/audio_game_integration_20261014/review-b-13c7b85-probe.test.ts'],
    environment: 'node',
    maxWorkers: 1,
  },
});
