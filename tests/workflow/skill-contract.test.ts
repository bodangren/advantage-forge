import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const skillRoot = new URL(
  '../../.agents/skills/fantasy-asset-workflow/',
  import.meta.url,
);
const readSkillFile = (path: string) =>
  readFile(new URL(path, skillRoot), 'utf8');

describe('fantasy asset workflow skill contract', () => {
  it('routes supported work through preflight, bounded revision, and review evidence', async () => {
    const skill = await readSkillFile('SKILL.md');

    for (const requiredStep of [
      'inspect_capabilities',
      'inspect_asset',
      'dryRun: true',
      'compare_revisions',
      'validate_asset',
      'render_preview',
      'export_asset',
    ]) {
      expect(skill).toContain(requiredStep);
    }

    for (const reference of [
      'references/current-capabilities.md',
      'references/visual-review.md',
      'references/evidence-report.md',
      'references/animation-handoff.md',
    ]) {
      expect(skill).toContain(reference);
      expect(await readSkillFile(reference)).not.toHaveLength(0);
    }
  });

  it('requires honest blocking and a stable evidence report', async () => {
    const [skill, report] = await Promise.all([
      readSkillFile('SKILL.md'),
      readSkillFile('references/evidence-report.md'),
    ]);

    expect(skill).toMatch(/stop before (any )?mutation/i);
    expect(skill).toMatch(/do not (?:read or\s+inspect|inspect) the source/i);
    expect(skill).toMatch(/actual 128x128/i);

    for (const heading of [
      'Goal and capability decision',
      'Revision lineage',
      'Mutation evidence',
      'Validation evidence',
      'Visual evidence',
      'Artifact evidence',
      'Limitations and verdict',
    ]) {
      expect(report).toContain(`## ${heading}`);
    }
  });
});
