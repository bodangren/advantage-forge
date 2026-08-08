import { describe, expect, it } from 'vitest';
import {
  ForgeAuthoringReviewManifestSchema,
  forgeAuthoringReviewManifestSha256,
  parseForgeAuthoringReviewManifest,
  type ForgeAuthoringReviewManifest,
} from '../../src/contracts/index.js';

async function fixture(): Promise<ForgeAuthoringReviewManifest> {
  const views = ['front', 'three-quarter', 'side', 'back'] as const;
  const manifest = ForgeAuthoringReviewManifestSchema.parse({
    contract_id: 'forge-authoring-review-manifest/v1',
    manifest_sha256: '0'.repeat(64),
    delivery_id: `delivery.${'0'.repeat(64)}`,
    source: {
      asset_id: 'guard.review',
      revision_id: `revision.${'a'.repeat(64)}`,
    },
    profile: {
      id: 'forge.authoring.reference-comparison.v1',
      version: '1.0.0',
      projection: 'orthographic',
      camera: 'eye_level',
      width: 512,
      height: 512,
      elevation_degrees: 0,
      padding_pixels: 32,
      background: '#e8e8e8',
      lighting: 'neutral_three_point_v1',
      views: [
        { view: 'front', yaw_degrees: 0 },
        { view: 'three-quarter', yaw_degrees: 45 },
        { view: 'side', yaw_degrees: 90 },
        { view: 'back', yaw_degrees: 180 },
      ],
    },
    classification: 'authoring_only',
    admission: {
      review_only: true,
      interchange_admitted: false,
      pack_admitted: false,
    },
    artifacts: [
      ...views.map((view, index) => ({
        id: `view.${view}`,
        role: 'comparison_view',
        media_type: 'image/png',
        byte_length: 100 + index,
        sha256: String(index + 1).repeat(64),
        width: 512,
        height: 512,
        transparent: false,
        reference: `artifacts/authoring/guard.review/${view}.png`,
        view,
      })),
      {
        id: 'review.contact-sheet',
        role: 'contact_sheet',
        media_type: 'image/png',
        byte_length: 500,
        sha256: 'f'.repeat(64),
        width: 2048,
        height: 530,
        transparent: false,
        reference: 'artifacts/authoring/guard.review/contact-sheet.png',
      },
    ],
  });
  manifest.manifest_sha256 = await forgeAuthoringReviewManifestSha256(manifest);
  manifest.delivery_id = `delivery.${manifest.manifest_sha256}`;
  return manifest;
}

describe('authoring review manifest', () => {
  it('binds a review-only four-view profile without gameplay directions', async () => {
    const manifest = await fixture();
    await expect(parseForgeAuthoringReviewManifest(manifest)).resolves.toEqual(
      manifest,
    );
    expect(manifest.admission).toEqual({
      review_only: true,
      interchange_admitted: false,
      pack_admitted: false,
    });
    expect(
      manifest.artifacts.every((artifact) => !('direction' in artifact)),
    ).toBe(true);
  });

  it('rejects drifted view order, yaw, duplicate identity, and digest', async () => {
    const manifest = await fixture();
    expect(() =>
      ForgeAuthoringReviewManifestSchema.parse({
        ...manifest,
        profile: {
          ...manifest.profile,
          views: [
            manifest.profile.views[1],
            manifest.profile.views[0],
            manifest.profile.views[2],
            manifest.profile.views[3],
          ],
        },
      }),
    ).toThrow();
    expect(() =>
      ForgeAuthoringReviewManifestSchema.parse({
        ...manifest,
        profile: {
          ...manifest.profile,
          views: [
            { view: 'front', yaw_degrees: 1 },
            ...manifest.profile.views.slice(1),
          ],
        },
      }),
    ).toThrow();
    expect(() =>
      ForgeAuthoringReviewManifestSchema.parse({
        ...manifest,
        artifacts: manifest.artifacts.map((artifact, index) =>
          index === 1
            ? { ...artifact, id: manifest.artifacts[0]!.id }
            : artifact,
        ),
      }),
    ).toThrow(/unique/i);
    await expect(
      parseForgeAuthoringReviewManifest({
        ...manifest,
        manifest_sha256: 'f'.repeat(64),
      }),
    ).rejects.toThrow(/digest/i);
  });

  it.each([
    ['classification', (manifest: ForgeAuthoringReviewManifest) => ({ ...manifest, classification: 'source' })],
    ['review-only', (manifest: ForgeAuthoringReviewManifest) => ({ ...manifest,
      admission: { ...manifest.admission, review_only: false } })],
    ['interchange admission', (manifest: ForgeAuthoringReviewManifest) => ({ ...manifest,
      admission: { ...manifest.admission, interchange_admitted: true } })],
    ['pack admission', (manifest: ForgeAuthoringReviewManifest) => ({ ...manifest,
      admission: { ...manifest.admission, pack_admitted: true } })],
    ['transparent view', (manifest: ForgeAuthoringReviewManifest) => ({ ...manifest,
      artifacts: manifest.artifacts.map((artifact, index) =>
        index === 0 ? { ...artifact, transparent: true } : artifact) })],
    ['128px view', (manifest: ForgeAuthoringReviewManifest) => ({ ...manifest,
      artifacts: manifest.artifacts.map((artifact, index) =>
        index === 0 ? { ...artifact, width: 128, height: 128 } : artifact) })],
    ['wrong sheet size', (manifest: ForgeAuthoringReviewManifest) => ({ ...manifest,
      artifacts: manifest.artifacts.map((artifact, index) =>
        index === 4 ? { ...artifact, width: 512, height: 512 } : artifact) })],
    ['gameplay direction', (manifest: ForgeAuthoringReviewManifest) => ({ ...manifest,
      artifacts: manifest.artifacts.map((artifact, index) =>
        index === 0 ? { ...artifact, direction: 'N' } : artifact) })],
    ['duplicate reference', (manifest: ForgeAuthoringReviewManifest) => ({ ...manifest,
      artifacts: manifest.artifacts.map((artifact, index) =>
        index === 1 ? { ...artifact, reference: manifest.artifacts[0]!.reference } : artifact) })],
  ])('rejects the %s pack-safety boundary', async (_label, mutate) => {
    const manifest = await fixture();
    expect(() =>
      ForgeAuthoringReviewManifestSchema.parse(mutate(manifest)),
    ).toThrow();
  });
});
