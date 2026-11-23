import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts/mom-kim-sheet.mjs');
const REDESIGN_OUT = 'out/chibi-sprouts/redesign';

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'mom-kim-sheet-r2-'));
  for (const directory of [
    'scripts',
    'docs/sprout-mockups',
    'out/storytime-review/muse-cast',
    'out/sprout-mom-kim/views',
    REDESIGN_OUT,
  ]) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  copyFileSync(SCRIPT, join(root, 'scripts/mom-kim-sheet.mjs'));
  copyFileSync(join(ROOT, 'docs/sprout-mockups/mom.jpg'), join(root, 'docs/sprout-mockups/mom.jpg'));
  copyFileSync(
    join(ROOT, 'out/storytime-review/muse-cast/teacher-kim-sheet.png'),
    join(root, 'out/storytime-review/muse-cast/teacher-kim-sheet.png'),
  );
  for (const view of ['front-level', 'side-level']) {
    copyFileSync(
      join(ROOT, `out/sprout-mom-kim/views/${view}.png`),
      join(root, `out/sprout-mom-kim/views/${view}.png`),
    );
  }
  const measure = join(root, REDESIGN_OUT, 'measure.json');
  copyFileSync(join(ROOT, REDESIGN_OUT, 'measure.json'), measure);
  const newerThanRenders = Date.now() / 1000 + 1;
  utimesSync(measure, newerThanRenders, newerThanRenders);
  symlinkSync(join(ROOT, 'node_modules'), join(root, 'node_modules'), 'dir');
  return root;
}

function runScript(root: string) {
  return spawnSync(process.execPath, [join(root, 'scripts/mom-kim-sheet.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
}

describe('mom-kim sheet adversarial round 2', () => {
  it('rejects lit rows that disagree with the alpha masks before writing sheets', () => {
    const root = fixtureRoot();
    try {
      const measurePath = join(root, REDESIGN_OUT, 'measure.json');
      const measure = JSON.parse(readFileSync(measurePath, 'utf8'));
      measure.rows.lit['front-level'] = [0, 0];
      writeFileSync(measurePath, `${JSON.stringify(measure)}\n`);
      const newerThanRenders = Date.now() / 1000 + 1;
      utimesSync(measurePath, newerThanRenders, newerThanRenders);

      const result = runScript(root);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('rows.lit');
      expect(existsSync(join(root, REDESIGN_OUT, 'mom-kim-review.png'))).toBe(false);
      expect(existsSync(join(root, REDESIGN_OUT, 'mom-panel.png'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses an output PNG symlink without changing its target', () => {
    const root = fixtureRoot();
    try {
      const target = join(root, 'external-target.dat');
      const panel = join(root, REDESIGN_OUT, 'mom-panel.png');
      writeFileSync(target, 'preserve this file');
      symlinkSync(target, panel);

      const result = runScript(root);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('output');
      expect(readFileSync(target, 'utf8')).toBe('preserve this file');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
