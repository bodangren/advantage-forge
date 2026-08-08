import { describe, expect, it } from 'vitest';

import {
  RUSTIC_HUMANOID_PART_MAP,
  canonicalHumanoidMorphologyPlan,
  compileHumanoidMorphology,
  digestHumanoidMorphologyPlan,
} from '../../src/fantasy-kit/humanoid-morphology.js';

const profile = (chibi = false) => ({
  contractId: 'forge-humanoid-morphology/v1' as const,
  profileId: chibi ? 'morphology.extreme-chibi' : 'morphology.neutral',
  kitId: 'rustic-human' as const,
  archetypeId: 'humanoid.biped.rustic' as const,
  styleProfile: { id: 'cute_chibi_v1' as const, version: '1.0.0' as const },
  seed: 42,
  proportions: {
    headScale: chibi ? 1 : 0,
    headWidth: chibi ? 1 : 0,
    headDepth: chibi ? 0.7 : 0,
    craniumRoundness: chibi ? 1 : 0,
    torsoLength: chibi ? -1 : 0,
    torsoWidth: chibi ? 1 : 0,
    torsoDepth: chibi ? 0.25 : 0,
    shoulderWidth: chibi ? 0.8 : 0,
    pelvisWidth: chibi ? 0.65 : 0,
    armLength: chibi ? -0.7 : 0,
    armThickness: chibi ? 0.7 : 0,
    legLength: chibi ? -1 : 0,
    legThickness: chibi ? 0.8 : 0,
    handScale: chibi ? 0.3 : 0,
    footScale: chibi ? 0.35 : 0,
    neckLength: chibi ? -1 : 0,
  },
  features: {
    hairStyle: 'short_rounded' as const,
    eyeStyle: 'round' as const,
    facialHairStyle: 'none' as const,
    clothingSilhouette: 'tunic' as const,
  },
});

const byPartId = (
  plan: ReturnType<typeof compileHumanoidMorphology>,
  partId: string,
) => plan.partAdjustments.find((adjustment) => adjustment.partId === partId)!;

describe('rustic humanoid morphology compiler', () => {
  it('compiles a closed, bounded, canonically ordered semantic plan', () => {
    const plan = compileHumanoidMorphology(profile());

    expect(plan.contractId).toBe('forge-humanoid-morphology-plan/v1');
    expect(plan.partAdjustments).toHaveLength(15);
    expect(plan.partAdjustments.map(({ partId }) => partId)).toEqual(
      [...plan.partAdjustments.map(({ partId }) => partId)].sort(),
    );
    expect(plan.validation).toEqual({
      valid: true,
      partCount: 15,
      attachmentCount: 14,
      mountEnvelopeCount: 6,
      symmetryError: 0,
    });
    expect(plan.metrics.bounds.min[1]).toBe(0);
    expect(plan.metrics.headCount).toBeCloseTo(plan.metrics.headCountTarget, 0);
  });

  it('materially lowers head-count and widens the silhouette for a chibi extreme', () => {
    const neutral = compileHumanoidMorphology(profile());
    const chibi = compileHumanoidMorphology(profile(true));

    expect(chibi.metrics.headCount).toBeLessThan(neutral.metrics.headCount - 1);
    expect(chibi.metrics.width).toBeGreaterThan(neutral.metrics.width * 1.2);
    expect(chibi.metrics.bounds.min[1]).toBe(0);
    expect(chibi.metrics.headCount).toBe(2.083194993);
    expect(
      Math.abs(chibi.metrics.headCount - chibi.metrics.headCountTarget),
    ).toBeLessThanOrEqual(chibi.budgets.maximumHeadCountError);
  });

  it('preserves bilateral scales, rest height, depth, and mirrored positions', () => {
    const plan = compileHumanoidMorphology(profile(true));

    for (const segment of [
      'upper-arm',
      'forearm',
      'hand',
      'thigh',
      'shin',
      'foot',
    ]) {
      const left = byPartId(plan, `${segment}.left`);
      const right = byPartId(plan, `${segment}.right`);
      expect(left.targetWorldScale).toEqual(right.targetWorldScale);
      expect(left.targetWorldPosition[0]).toBeCloseTo(
        -right.targetWorldPosition[0],
        8,
      );
      expect(left.targetWorldPosition[1]).toBe(right.targetWorldPosition[1]);
      expect(left.targetWorldPosition[2]).toBe(right.targetWorldPosition[2]);
    }
  });

  it('produces stable canonical bytes and a content digest', async () => {
    const first = compileHumanoidMorphology(profile(true));
    const second = compileHumanoidMorphology(structuredClone(profile(true)));

    expect(canonicalHumanoidMorphologyPlan(first)).toBe(
      canonicalHumanoidMorphologyPlan(second),
    );
    expect(await digestHumanoidMorphologyPlan(first)).toBe(
      await digestHumanoidMorphologyPlan(second),
    );
    expect(await digestHumanoidMorphologyPlan(first)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('binds the same bounded compiler to the registered novel body root alias', () => {
    const plan = compileHumanoidMorphology(profile(true), {
      ...RUSTIC_HUMANOID_PART_MAP,
      torso: 'body.root',
    });

    expect(byPartId(plan, 'body.root').semanticRole).toBe('anatomy.torso');
    expect(plan.attachmentTargets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          parentPartId: 'body.root',
          childPartId: 'head',
        }),
        expect.objectContaining({
          parentPartId: 'body.root',
          childPartId: 'pelvis',
        }),
      ]),
    );
    expect(plan.partAdjustments).toHaveLength(15);
    expect(plan.validation.valid).toBe(true);
  });

  it('rejects unsupported part maps and profiles', () => {
    expect(() =>
      compileHumanoidMorphology(profile(), {
        ...RUSTIC_HUMANOID_PART_MAP,
        head: 'skull',
      }),
    ).toThrow(/part map/i);

    expect(() =>
      compileHumanoidMorphology({
        ...profile(),
        styleProfile: { id: 'unregistered_style', version: '1.0.0' },
      }),
    ).toThrow(/profile/i);
  });
});
