import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const PROBE_PARENT = join(REPO_ROOT, 'measure', 'runs', 'audio_game_integration_20261014');

describe('audio hand-off adversarial round 2', () => {
  it.skip('TD-48: zero-byte sound accepted; no shipped source is empty; fix = reject size 0', () => {
    mkdirSync(PROBE_PARENT, { recursive: true });
    const root = mkdtempSync(join(PROBE_PARENT, '.audio-handoff-zero-pair-'));
    try {
      const scriptDir = join(root, 'scripts');
      const sourceDir = join(root, 'sounds', 'chibi');
      const demoDir = join(root, 'demo', 'public', 'audio', 'chibi');
      mkdirSync(scriptDir, { recursive: true });
      cpSync(join(REPO_ROOT, 'scripts', 'audio-handoff.mjs'), join(scriptDir, 'audio-handoff.mjs'));
      cpSync(join(REPO_ROOT, 'sounds', 'chibi'), sourceDir, { recursive: true });
      cpSync(join(REPO_ROOT, 'demo', 'public', 'audio', 'chibi'), demoDir, { recursive: true });
      writeFileSync(join(sourceDir, 'tap.ogg'), '');
      writeFileSync(join(demoDir, 'tap.ogg'), '');

      const result = spawnSync(process.execPath, [join(scriptDir, 'audio-handoff.mjs')], {
        cwd: root,
        encoding: 'utf8',
      });
      expect(
        result.status,
        'the script must reject an empty sound even when source and demo bytes match',
      ).not.toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
