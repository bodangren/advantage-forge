import { describe, expect, it } from 'vitest';

import { HumanoidMorphologyProfileSchema } from '../../src/contracts/humanoid-morphology.js';

const profileFixture = () => ({
  contractId: 'forge-humanoid-morphology/v1' as const,
  profileId: 'morphology.round-guard',
  kitId: 'rustic-human' as const,
  archetypeId: 'humanoid.biped.rustic' as const,
  styleProfile: { id: 'cute_chibi_v1' as const, version: '1.0.0' as const },
  seed: 42,
  proportions: {
    headScale: 0.8,
    headWidth: 0.65,
    headDepth: 0.35,
    craniumRoundness: 0.9,
    torsoLength: -0.55,
    torsoWidth: 0.4,
    torsoDepth: 0.15,
    shoulderWidth: 0.25,
    pelvisWidth: 0.2,
    armLength: -0.3,
    armThickness: 0.35,
    legLength: -0.7,
    legThickness: 0.45,
    handScale: 0.3,
    footScale: 0.25,
    neckLength: -0.5,
  },
  features: {
    hairStyle: 'short_rounded' as const,
    eyeStyle: 'round' as const,
    facialHairStyle: 'none' as const,
    clothingSilhouette: 'tunic' as const,
  },
});

describe('forge-humanoid-morphology/v1 contract', () => {
  it('accepts bounded semantic morphology and defaults bilateral symmetry', () => {
    const result = HumanoidMorphologyProfileSchema.safeParse(profileFixture());
    expect(result).toMatchObject({
      success: true,
      data: { symmetry: { bilateral: true } },
    });
  });

  it('rejects unknown fields and unsupported raw geometry or transforms', () => {
    for (const unsupported of [
      { rawMesh: { vertices: [[0, 0, 0]] } },
      { shape: { kind: 'ellipsoid', radiusX: 3 } },
      { transform: { scale: [2, 2, 2] } },
      { sourcePath: '/private/model.glb' },
      { sourceUrl: 'https://example.invalid/model.glb' },
    ]) {
      expect(
        HumanoidMorphologyProfileSchema.safeParse({
          ...profileFixture(),
          ...unsupported,
        }).success,
      ).toBe(false);
    }
  });

  it.each([
    ['non-finite proportion', Number.NaN],
    ['positive overflow', 1.001],
    ['negative overflow', -1.001],
    ['infinite proportion', Number.POSITIVE_INFINITY],
  ])('rejects %s', (_label, headScale) => {
    const profile = profileFixture();
    profile.proportions.headScale = headScale;
    expect(HumanoidMorphologyProfileSchema.safeParse(profile).success).toBe(
      false,
    );
  });

  it('rejects unsupported kit, archetype, style, feature values, and asymmetric overrides', () => {
    const invalidValues = [
      { kitId: 'raw-kit' },
      { archetypeId: 'humanoid.mesh.custom' },
      { styleProfile: { id: 'unregistered_style', version: '1.0.0' } },
      { features: { ...profileFixture().features, eyeStyle: 'texture-map' } },
      { symmetry: { bilateral: false } },
    ];

    for (const invalid of invalidValues) {
      expect(
        HumanoidMorphologyProfileSchema.safeParse({
          ...profileFixture(),
          ...invalid,
        }).success,
      ).toBe(false);
    }
  });
});
