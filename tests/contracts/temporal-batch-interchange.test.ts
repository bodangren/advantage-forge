import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  ForgeTemporalRenderBatchArtifactsManifestSchema,
  type ForgeTemporalRenderBatchArtifactsManifest,
} from '../../src/contracts/index.js';

const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const identity = (prefix: string, value: string) =>
  `${prefix}.${digest(value)}`;
const clipSpecs = [
  { action: 'idle', samples: 4, direction: 'S' },
  { action: 'walk_forward', samples: 6, direction: 'S' },
  { action: 'walk_right', samples: 6, direction: 'E' },
  { action: 'attack', samples: 6, direction: 'S' },
  { action: 'receive_damage', samples: 4, direction: 'S' },
] as const;

function fixture(): ForgeTemporalRenderBatchArtifactsManifest {
  const frames: Array<Record<string, unknown>> = [];
  const clips: Array<Record<string, unknown>> = [];
  const poseSheets: Array<Record<string, unknown>> = [];
  let sequence = 0;
  for (const spec of clipSpecs) {
    const clipId = identity('clip', spec.action);
    const framePlanId = identity('frame-plan', spec.action);
    const clipFrames = Array.from({ length: spec.samples }, (_, index) => ({
      id: identity('frame', `${spec.action}-${index}`),
      sequence: sequence++,
      clipId,
      action: spec.action,
      framePlanId,
      direction: spec.direction,
      sampleTimeMs: index * 125,
      fileName: `${spec.action}-${index}.png`,
      byteLength: 100 + index,
      sha256: digest(`pixels-${spec.action}-${index}`),
      metrics: {
        groundAnchorDeviationPixels: 0,
        clippedEdges: [],
        framingEvidence: {
          topMarginPixels: 8,
          centerDeviationPixels: 0,
          worldUnitsPerPixel: 0.03,
        },
      },
    }));
    frames.push(...clipFrames);
    const sheetDigest = digest(`sheet-${spec.action}`);
    poseSheets.push({
      id: `sheet.${sheetDigest}`,
      classification: 'derived',
      role: 'pose_sheet',
      mediaType: 'image/png',
      fileName: `pose-sheet-${spec.action}.png`,
      byteLength: 1_000 + spec.samples,
      sha256: sheetDigest,
      width: spec.samples * 128,
      height: 128,
      columns: spec.samples,
      rows: 1,
      rects: clipFrames.map((frame, index) => ({
        frameId: frame['id'],
        x: index * 128,
        y: 0,
        width: 128,
        height: 128,
      })),
    });
    clips.push({
      clipId,
      action: spec.action,
      framePlanId,
      durationMs: spec.samples * 125,
      loop:
        spec.action === 'idle' || spec.action.startsWith('walk_')
          ? { mode: 'loop', startMs: 0, endMs: spec.samples * 125 }
          : { mode: 'once' },
      interpolation: 'linear',
      directions: [spec.direction],
      samplesPerDirection: spec.samples,
      frameIds: clipFrames.map(({ id }) => id),
      poseSheetId: `sheet.${sheetDigest}`,
    });
  }
  const atlasDigest = digest('combined-atlas');
  return ForgeTemporalRenderBatchArtifactsManifestSchema.parse({
    contractId: 'forge-temporal-render-batch-artifacts/v1',
    authoringContractId: 'forge-reference-five-clip-authoring/v1',
    assetId: 'guard.reference',
    revisionId: identity('revision', 'guard'),
    morphologyRevisionId: identity('morphology', 'guard'),
    rigSignature: identity('rig', 'guard'),
    equipmentSignature: identity('equipment', 'guard'),
    renderProfile: {
      id: 'fantasy.sprite.orthographic.v1',
      version: '1.0.0',
    },
    sourceGlb: {
      id: identity('glb', 'guard'),
      classification: 'source',
      mediaType: 'model/gltf-binary',
      fileName: 'guard.reference.glb',
      byteLength: 60_320,
      sha256: digest('guard'),
    },
    animationBundle: {
      id: identity('bundle', 'five-clips'),
      classification: 'source',
      mediaType: 'application/json',
      fileName: 'animation-bundle.json',
      byteLength: 62_000,
      sha256: digest('five-clips'),
    },
    clips,
    frames,
    poseSheets,
    atlas: {
      id: `atlas.${atlasDigest}`,
      classification: 'derived',
      role: 'sprite_atlas',
      mediaType: 'image/png',
      fileName: 'atlas.png',
      byteLength: 20_000,
      sha256: atlasDigest,
      width: frames.length * 128,
      height: 128,
      columns: frames.length,
      rows: 1,
      rects: frames.map((frame, index) => ({
        frameId: frame['id'],
        x: index * 128,
        y: 0,
        width: 128,
        height: 128,
      })),
    },
    deliveryId: identity('delivery', 'five-clips'),
  });
}

describe('public temporal batch interchange contract', () => {
  it('accepts the exact ordered five-clip, 26-frame, five-sheet delivery', () => {
    const manifest = fixture();
    expect(manifest.clips.map(({ action }) => action)).toEqual(
      clipSpecs.map(({ action }) => action),
    );
    expect(manifest.frames).toHaveLength(26);
    expect(manifest.poseSheets).toHaveLength(5);
  });

  it('rejects filler frames that reuse any source-frame pixels', () => {
    const manifest = structuredClone(fixture());
    manifest.frames[1]!.sha256 = manifest.frames[0]!.sha256;
    expect(
      ForgeTemporalRenderBatchArtifactsManifestSchema.safeParse(manifest)
        .success,
    ).toBe(false);
  });

  it('rejects false clip bindings and noncanonical timed ordering', () => {
    const wrongAction = structuredClone(fixture());
    wrongAction.frames[0]!.action = 'walk_forward';
    expect(
      ForgeTemporalRenderBatchArtifactsManifestSchema.safeParse(wrongAction)
        .success,
    ).toBe(false);

    const reversed = structuredClone(fixture());
    reversed.frames[1]!.sampleTimeMs = 0;
    expect(
      ForgeTemporalRenderBatchArtifactsManifestSchema.safeParse(reversed)
        .success,
    ).toBe(false);
  });

  it('rejects duplicate clip identities and overlapping or false layouts', () => {
    const duplicateClip = structuredClone(fixture());
    duplicateClip.clips[1].clipId = duplicateClip.clips[0].clipId;
    expect(
      ForgeTemporalRenderBatchArtifactsManifestSchema.safeParse(duplicateClip)
        .success,
    ).toBe(false);

    const sheetOverlap = structuredClone(fixture());
    sheetOverlap.poseSheets[0]!.rects[1]!.x = 0;
    expect(
      ForgeTemporalRenderBatchArtifactsManifestSchema.safeParse(sheetOverlap)
        .success,
    ).toBe(false);

    const atlasOverlap = structuredClone(fixture());
    atlasOverlap.atlas.rects[1]!.x = 0;
    expect(
      ForgeTemporalRenderBatchArtifactsManifestSchema.safeParse(atlasOverlap)
        .success,
    ).toBe(false);
  });
});
