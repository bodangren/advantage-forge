import { describe, expect, it } from 'vitest';

import { NovelAssetIdentityRequestSchema } from '../../../src/contracts/index.js';
import { applySemanticPatch } from '../../../src/document/index.js';
import { evaluateAssembly } from '../../../src/assembly/index.js';
import { compileHumanoidMorphology } from '../../../src/fantasy-kit/humanoid-morphology.js';
import {
  compileNovelComposition,
  planNovelAssetBrief,
} from '../../../src/fantasy-kit/novel-composition.js';
import { initializeNovelAssetDocument } from '../../../src/fantasy-kit/novel-identities.js';
import { inspectHumanoidGeometryRegressions } from '../../../src/fantasy-kit/reference-geometry/humanoid-geometry-regressions.js';

const morphology = {
  contractId: 'forge-humanoid-morphology/v1' as const,
  profileId: 'morphology.reference-chibi-guard',
  kitId: 'rustic-human' as const,
  archetypeId: 'humanoid.biped.rustic' as const,
  styleProfile: { id: 'cute_chibi_v1' as const, version: '1.0.0' as const },
  seed: 42,
  proportions: {
    headScale: 1,
    headWidth: 1,
    headDepth: 0.7,
    craniumRoundness: 1,
    torsoLength: -1,
    torsoWidth: 1,
    torsoDepth: 0.25,
    shoulderWidth: 0.8,
    pelvisWidth: 0.65,
    armLength: -0.7,
    armThickness: 0.7,
    legLength: -1,
    legThickness: 0.8,
    handScale: 0.3,
    footScale: 0.35,
    neckLength: -1,
  },
  features: {
    hairStyle: 'short_rounded' as const,
    eyeStyle: 'round' as const,
    facialHairStyle: 'none' as const,
    clothingSilhouette: 'light_armor' as const,
  },
  symmetry: { bilateral: true as const },
};

describe('humanoid visual geometry regressions', () => {
  it('enforces the bounded S14 proportion and connected-silhouette contract', () => {
    const identity = NovelAssetIdentityRequestSchema.parse({
      assetId: 'guard.reference-ready.s14-regression',
      name: 'S14 Geometry Regression Guard',
      kitId: 'rustic-human',
      family: 'humanoid',
      archetypeId: 'humanoid.biped.rustic',
      seed: 42,
    });
    let document = initializeNovelAssetDocument(identity);
    const planning = planNovelAssetBrief(
      'original round chibi rustic village sentry wearing a fitted iron helmet',
    );
    if (!planning.supported) throw new Error(planning.blockers.join('; '));
    for (const operation of planning.suggestedOperations) {
      const result = applySemanticPatch(
        document,
        compileNovelComposition(document, operation),
      );
      if (!result.ok) throw new Error(JSON.stringify(result.issues));
      document = result.document;
    }
    const morphologyPlan = compileHumanoidMorphology(morphology, {
      torso: 'body.root',
      head: 'head',
      pelvis: 'pelvis',
      upperArmLeft: 'upper-arm.left',
      upperArmRight: 'upper-arm.right',
      forearmLeft: 'forearm.left',
      forearmRight: 'forearm.right',
      handLeft: 'hand.left',
      handRight: 'hand.right',
      thighLeft: 'thigh.left',
      thighRight: 'thigh.right',
      shinLeft: 'shin.left',
      shinRight: 'shin.right',
      footLeft: 'foot.left',
      footRight: 'foot.right',
    });
    // The morphology head-count acceptance band is 2.05-3.55 heads around
    // this 2.8-head target. The visual 0.42-0.50 head-group ratio overlaps it
    // only in the intended approximately 2.05-2.38-head chibi region.
    expect(morphologyPlan.metrics.headCount).toBeGreaterThanOrEqual(2.05);
    expect(morphologyPlan.metrics.headCount).toBeLessThanOrEqual(3.55);
    const geometry = morphologyPlan.referenceGeometry;
    const morphologyOperations = [
      ...morphologyPlan.partAdjustments.map(
        ({ partId, localRestTransform }) => ({
          operation: 'setPartTransform' as const,
          partId,
          transform: {
            position: [...localRestTransform.position] as [number, number, number],
            rotation: [...localRestTransform.rotation] as [number, number, number, number],
            scale: [...localRestTransform.scale] as [number, number, number],
          },
        }),
      ),
      {
        operation: 'setHumanoidMorphologyProfile' as const,
        profile: morphologyPlan.sourceProfile,
      },
    ];
    const morphologyOnly = applySemanticPatch(document, {
      operations: morphologyOperations,
    });
    if (!morphologyOnly.ok)
      throw new Error(JSON.stringify(morphologyOnly.issues));
    const omittedReferenceRegression = inspectHumanoidGeometryRegressions(
      evaluateAssembly(
        morphologyOnly.document.assembly,
        morphologyOnly.document.templates,
      ),
    );
    expect(omittedReferenceRegression.valid).toBe(false);

    expect(
      morphologyOperations.length + geometry.patch.operations.length,
    ).toBe(85);
    const result = applySemanticPatch(document, {
      operations: [...morphologyOperations, ...geometry.patch.operations],
    });
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    document = result.document;

    const scene = evaluateAssembly(document.assembly, document.templates);
    const regression = inspectHumanoidGeometryRegressions(scene);
    expect(regression, JSON.stringify(regression, null, 2)).toMatchObject({
      valid: true,
      failures: [],
    });
    expect(regression.metrics.headGroupHeightRatio).toBeGreaterThanOrEqual(
      0.42,
    );
    expect(regression.metrics.headGroupHeightRatio).toBeLessThanOrEqual(0.5);
    expect(regression.metrics.headGroupHeightRatio).toBeCloseTo(
      0.4386781166658611,
      12,
    );
    expect(regression.metrics.sideToFrontWidthRatio).toBeGreaterThanOrEqual(
      0.6,
    );
    expect(regression.metrics.sideToFrontWidthRatio).toBeCloseTo(
      0.7284958763185367,
      12,
    );
    expect(regression.metrics.helmetStudCount).toBe(2);
  });
});
