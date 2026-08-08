import { describe, expect, it } from 'vitest';

import { ForgeTemporalRenderArtifactsManifestSchema } from '../../src/contracts/index.js';

const hash = (character: string) => character.repeat(64);
const fixture = () => ({
  contractId: 'forge-temporal-render-artifacts/v1' as const,
  assetId: 'guard.rustic',
  revisionId: `revision.${hash('a')}`,
  morphologyRevisionId: `morphology.${hash('b')}`,
  rigSignature: `rig.${hash('c')}`,
  equipmentSignature: `equipment.${hash('d')}`,
  clipId: `clip.${hash('e')}`,
  action: 'walk.forward',
  framePlanId: `frame-plan.${hash('f')}`,
  durationMs: 500,
  loop: { mode: 'loop' as const, startMs: 0, endMs: 500 },
  interpolation: 'linear' as const,
  renderProfile: {
    id: 'fantasy.sprite.orthographic.v1' as const,
    version: '1.0.0' as const,
  },
  sourceGlb: {
    id: `glb.${hash('0')}`,
    classification: 'source' as const,
    mediaType: 'model/gltf-binary' as const,
    fileName: 'guard.rustic.glb',
    byteLength: 1_024,
    sha256: hash('0'),
  },
  frames: [
    {
      id: `frame.${hash('1')}`,
      sequence: 0,
      direction: 'S' as const,
      sampleTimeMs: 0,
      fileName: '0000-s-0.png',
      byteLength: 100,
      sha256: hash('2'),
      metrics: {
        groundAnchorDeviationPixels: 0,
        clippedEdges: [] as Array<'top' | 'right' | 'bottom' | 'left'>,
        framingEvidence: {
          topMarginPixels: 10,
          centerDeviationPixels: 0,
          worldUnitsPerPixel: 0.03,
        },
      },
    },
    {
      id: `frame.${hash('3')}`,
      sequence: 1,
      direction: 'S' as const,
      sampleTimeMs: 250,
      fileName: '0001-s-250.png',
      byteLength: 101,
      sha256: hash('4'),
      metrics: {
        groundAnchorDeviationPixels: 0,
        clippedEdges: [] as Array<'top' | 'right' | 'bottom' | 'left'>,
        framingEvidence: {
          topMarginPixels: 10,
          centerDeviationPixels: 1,
          worldUnitsPerPixel: 0.03,
        },
      },
    },
  ],
  atlas: {
    id: `atlas.${hash('5')}`,
    fileName: 'atlas.png',
    byteLength: 201,
    sha256: hash('5'),
    width: 256,
    height: 128,
    columns: 2,
    rows: 1,
    rects: [
      {
        frameId: `frame.${hash('1')}`,
        x: 0,
        y: 0,
        width: 128 as const,
        height: 128 as const,
      },
      {
        frameId: `frame.${hash('3')}`,
        x: 128,
        y: 0,
        width: 128 as const,
        height: 128 as const,
      },
    ],
  },
  deliveryId: `delivery.${hash('6')}`,
});

describe('temporal public interchange manifest', () => {
  it('accepts distinct camera-locked source frames and a complete atlas map', () => {
    expect(
      ForgeTemporalRenderArtifactsManifestSchema.safeParse(fixture()).success,
    ).toBe(true);
  });

  it('rejects duplicate filler bytes, scale drift, clipping, traversal, and incomplete atlas maps', () => {
    const duplicate = fixture();
    duplicate.frames[1]!.sha256 = duplicate.frames[0]!.sha256;
    expect(
      ForgeTemporalRenderArtifactsManifestSchema.safeParse(duplicate).success,
    ).toBe(false);

    const scaleDrift = fixture();
    scaleDrift.frames[1]!.metrics.framingEvidence.worldUnitsPerPixel = 0.04;
    expect(
      ForgeTemporalRenderArtifactsManifestSchema.safeParse(scaleDrift).success,
    ).toBe(false);

    const clipped = fixture();
    clipped.frames[1]!.metrics.clippedEdges = ['right'];
    expect(
      ForgeTemporalRenderArtifactsManifestSchema.safeParse(clipped).success,
    ).toBe(false);

    const traversal = fixture();
    traversal.atlas.fileName = '../atlas.png';
    expect(
      ForgeTemporalRenderArtifactsManifestSchema.safeParse(traversal).success,
    ).toBe(false);

    const glbTraversal = fixture();
    glbTraversal.sourceGlb.fileName = '../guard.glb';
    expect(
      ForgeTemporalRenderArtifactsManifestSchema.safeParse(glbTraversal)
        .success,
    ).toBe(false);

    const incomplete = fixture();
    incomplete.atlas.rects.pop();
    expect(
      ForgeTemporalRenderArtifactsManifestSchema.safeParse(incomplete).success,
    ).toBe(false);
  });

  it('rejects invalid loop bounds', () => {
    const reversed = fixture();
    reversed.loop = { mode: 'loop', startMs: 500, endMs: 250 };
    expect(
      ForgeTemporalRenderArtifactsManifestSchema.safeParse(reversed).success,
    ).toBe(false);

    const beyondDuration = fixture();
    beyondDuration.loop = { mode: 'loop', startMs: 0, endMs: 1_001 };
    expect(
      ForgeTemporalRenderArtifactsManifestSchema.safeParse(beyondDuration)
        .success,
    ).toBe(false);
  });
});
