import { describe, expect, it } from 'vitest';

import { ReferenceCharacterDescriptorSchema } from '../../src/contracts/reference-character.js';

const SHA256 =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const OTHER_SHA256 =
  'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

const view = (
  direction: 'front' | 'left' | 'back',
  imageContentSha256 = SHA256,
) => ({
  direction,
  imageContentSha256,
  pixelSize: { width: 512, height: 512 },
  pose: 'neutral_standing' as const,
  camera: {
    projection: 'orthographic' as const,
    framing: 'full_body' as const,
    elevationDegrees: 0,
  },
  subjectBounds: { x: 0.2, y: 0.05, width: 0.6, height: 0.9 },
  landmarks: [
    { id: 'head.top', x: 0.5, y: 0.05, confidence: 0.98 },
    { id: 'head.chin', x: 0.5, y: 0.3, confidence: 0.95 },
    { id: 'foot.left', x: 0.42, y: 0.95, confidence: 0.94 },
    { id: 'foot.right', x: 0.58, y: 0.95, confidence: 0.94 },
  ],
});

const descriptorFixture = () => ({
  contractId: 'forge-reference-character/v1' as const,
  referenceId: 'reference.round-guard',
  referenceContentSha256: SHA256,
  provenance: {
    sourceKind: 'project_generated' as const,
    ownership: 'project_owned' as const,
    licenseLabel: 'project-owned',
    originalityAttestation: 'original-project-owned-no-franchise-copy' as const,
  },
  views: [view('front'), view('left', OTHER_SHA256), view('back')],
  ratios: {
    headToBodyHeight: 0.3,
    shoulderToBodyWidth: 0.65,
    pelvisToBodyWidth: 0.5,
    armToBodyHeight: 0.42,
    legToBodyHeight: 0.38,
  },
  palette: [
    { role: 'primary' as const, color: '#7a4f2a', weight: 0.65 },
    { role: 'accent' as const, color: '#d9c08c', weight: 0.35 },
  ],
  features: [
    {
      id: 'hair.short-rounded',
      category: 'hair' as const,
      presence: 'required' as const,
      importance: 0.8,
      confidence: 0.95,
    },
    {
      id: 'equipment.round-shield',
      category: 'equipment' as const,
      presence: 'required' as const,
      importance: 0.9,
      confidence: 0.9,
    },
  ],
  confidence: {
    overall: 0.9,
    geometry: 0.92,
    palette: 0.88,
    features: 0.9,
  },
  tolerances: {
    silhouetteIouMinimum: 0.82,
    landmarkErrorMaximum: 0.04,
    ratioErrorMaximum: 0.05,
    paletteDeltaMaximum: 8,
  },
});

describe('forge-reference-character/v1 contract', () => {
  it('accepts a closed, content-addressed multi-view descriptor', () => {
    expect(
      ReferenceCharacterDescriptorSchema.safeParse(descriptorFixture()),
    ).toMatchObject({
      success: true,
    });
  });

  it('rejects unknown fields and path or URL provenance locators', () => {
    const unknownTopLevel = {
      ...descriptorFixture(),
      sourcePath: '/private/reference.png',
    };
    expect(
      ReferenceCharacterDescriptorSchema.safeParse(unknownTopLevel).success,
    ).toBe(false);

    const unsafeProvenance = descriptorFixture() as Record<string, unknown>;
    unsafeProvenance['provenance'] = {
      ...(unsafeProvenance['provenance'] as Record<string, unknown>),
      sourceUrl: 'https://example.invalid/reference.png',
    };
    expect(
      ReferenceCharacterDescriptorSchema.safeParse(unsafeProvenance).success,
    ).toBe(false);
  });

  it('rejects unsafe or contradictory provenance', () => {
    const descriptor = descriptorFixture() as Record<string, unknown>;
    descriptor['provenance'] = {
      sourceKind: 'project_generated',
      ownership: 'licensed',
      licenseLabel: 'unknown',
      originalityAttestation: 'not-reviewed',
    };

    expect(
      ReferenceCharacterDescriptorSchema.safeParse(descriptor).success,
    ).toBe(false);
  });

  it('requires front, back, and at least one lateral structural view', () => {
    const descriptor = descriptorFixture();
    descriptor.views = [view('front'), view('back')];

    const result = ReferenceCharacterDescriptorSchema.safeParse(descriptor);
    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected structural view rejection.');
    expect(result.error.issues.map(({ path }) => path.join('.'))).toContain(
      'views',
    );
  });

  it.each([
    [
      'non-finite landmark',
      (value: ReturnType<typeof descriptorFixture>) => {
        value.views[0]!.landmarks[0]!.x = Number.NaN;
      },
    ],
    [
      'out-of-range ratio',
      (value: ReturnType<typeof descriptorFixture>) => {
        value.ratios.headToBodyHeight = 1.2;
      },
    ],
    [
      'out-of-range confidence',
      (value: ReturnType<typeof descriptorFixture>) => {
        value.confidence.overall = -0.1;
      },
    ],
    [
      'non-finite tolerance',
      (value: ReturnType<typeof descriptorFixture>) => {
        value.tolerances.ratioErrorMaximum = Number.POSITIVE_INFINITY;
      },
    ],
  ])('rejects %s', (_label, mutate) => {
    const descriptor = descriptorFixture();
    mutate(descriptor);
    expect(
      ReferenceCharacterDescriptorSchema.safeParse(descriptor).success,
    ).toBe(false);
  });
});
