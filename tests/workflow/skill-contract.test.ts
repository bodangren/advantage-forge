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
      'search_accessories',
      'apply_accessory_operation',
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
      'references/public-call-ledger.md',
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
    expect(skill).toMatch(
      /when (the )?(public )?(mcp )?tools are unavailable/i,
    );

    const ledger = await readSkillFile('references/public-call-ledger.md');
    for (const requestField of [
      'create_asset({ reference: "crate" })',
      'expectedRevisionId',
      'dryRun: true',
      'baseRevisionId',
      'targetRevisionId',
      'search_accessories({',
      'apply_accessory_operation({',
    ]) {
      expect(ledger).toContain(requestField);
    }
    expect(ledger).toMatch(/never add `transform`/i);
    expect(skill).toMatch(/blade reads down from the hand/i);
    expect(skill).toMatch(/broad\s+face\s+is\s+upright\s+and\s+vertical/i);

    const animation = await readSkillFile('references/animation-handoff.md');
    for (const capabilityId of [
      'animation.rigid_pose',
      'animation.temporal',
      'output.sprite.directional',
      'output.sprite_atlas',
      'output.glb',
    ]) {
      expect(animation).toContain(capabilityId);
    }

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

  it('defines realistic evals with discriminating workflow assertions', async () => {
    const parsed = JSON.parse(await readSkillFile('evals/evals.json')) as {
      skill_name: string;
      evals: Array<{
        id: number;
        prompt: string;
        expectations: string[];
      }>;
    };

    expect(parsed.skill_name).toBe('fantasy-asset-workflow');
    expect(parsed.evals).toHaveLength(4);
    expect(parsed.evals.map(({ id }) => id)).toEqual([1, 2, 3, 4]);
    expect(parsed.evals.map(({ prompt }) => prompt).join('\n')).toMatch(
      /adventurer[\s\S]*crate[\s\S]*helmet[\s\S]*animation/i,
    );

    const expectations = parsed.evals.flatMap((evaluation) =>
      evaluation.expectations.map((expectation) => expectation.toLowerCase()),
    );
    for (const requiredEvidence of [
      'inspect_capabilities',
      'inspect_asset',
      'dryrun: true',
      'affectedids',
      'actual 128x128',
      'does not read source',
      'stops before mutation',
    ]) {
      expect(
        expectations.some((entry) => entry.includes(requiredEvidence)),
      ).toBe(true);
    }
  });
});
