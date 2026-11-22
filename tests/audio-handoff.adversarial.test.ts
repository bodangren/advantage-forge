import { cpSync, mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const SCRIPT = join(REPO_ROOT, 'scripts', 'audio-handoff.mjs');
const SOURCE = join(REPO_ROOT, 'sounds', 'chibi');
const DEMO = join(REPO_ROOT, 'demo', 'public', 'audio', 'chibi');

describe('audio hand-off adversarial cases', () => {
  it('rejects a matching inventory with an unsupported sound name', () => {
    const root = mkdtempSync(join(tmpdir(), 'audio-handoff-adversarial-'));
    try {
      const scriptDir = join(root, 'scripts');
      const sourceParent = join(root, 'sounds');
      const demoParent = join(root, 'demo', 'public', 'audio');
      mkdirSync(scriptDir, { recursive: true });
      mkdirSync(sourceParent, { recursive: true });
      mkdirSync(demoParent, { recursive: true });
      cpSync(SCRIPT, join(scriptDir, 'audio-handoff.mjs'));
      cpSync(SOURCE, join(sourceParent, 'chibi'), { recursive: true });
      cpSync(DEMO, join(demoParent, 'chibi'), { recursive: true });

      renameSync(join(root, 'sounds', 'chibi', 'tap.ogg'), join(root, 'sounds', 'chibi', 'tap-renamed.ogg'));
      renameSync(
        join(root, 'demo', 'public', 'audio', 'chibi', 'tap.ogg'),
        join(root, 'demo', 'public', 'audio', 'chibi', 'tap-renamed.ogg'),
      );

      const result = spawnSync(process.execPath, [join(scriptDir, 'audio-handoff.mjs')], {
        cwd: root,
        encoding: 'utf8',
      });
      expect(
        result.status,
        'the script must reject an unsupported filename even when source and demo inventories match',
      ).not.toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
