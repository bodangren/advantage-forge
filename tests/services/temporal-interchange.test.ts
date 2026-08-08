import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  ForgeInterchangeArtifactChunkSchema,
  ForgeTemporalRenderArtifactsManifestSchema,
} from '../../src/contracts/index.js';
import { LocalBrowserArtifactService } from '../../src/services/index.js';

const hashText = (character: string) => character.repeat(64);
const sha256 = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex');

describe('local temporal interchange registry', () => {
  it('discovers one immutable delivery and returns digest-bound artifact chunks', async () => {
    const workspaceRoot = await mkdtemp(
      join(tmpdir(), 'forge-temporal-registry-'),
    );
    const revisionId = `revision.${hashText('a')}`;
    const clipId = `clip.${hashText('b')}`;
    const framePlanId = `frame-plan.${hashText('c')}`;
    const deliveryId = `delivery.${hashText('d')}`;
    const directory = join(
      workspaceRoot,
      'artifacts/reference/guard.rustic',
      revisionId,
      'temporal',
      clipId,
      framePlanId,
    );
    await mkdir(directory, { recursive: true });
    const first = Buffer.alloc(100, 1);
    const second = Buffer.alloc(101, 2);
    const atlas = Buffer.concat([first, second]);
    const sourceGlb = Buffer.from('portable-source-glb');
    await writeFile(join(directory, '0000-s-0.png'), first);
    await writeFile(join(directory, '0001-s-250.png'), second);
    await writeFile(join(directory, 'atlas.png'), atlas);
    await writeFile(join(directory, 'guard.rustic.glb'), sourceGlb);
    const frame = (
      idCharacter: string,
      sequence: number,
      sampleTimeMs: number,
      fileName: string,
      bytes: Buffer,
    ) => ({
      id: `frame.${hashText(idCharacter)}`,
      sequence,
      direction: 'S' as const,
      sampleTimeMs,
      fileName,
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
      metrics: {
        groundAnchorDeviationPixels: 0,
        clippedEdges: [],
        framingEvidence: {
          topMarginPixels: 10,
          centerDeviationPixels: 0,
          worldUnitsPerPixel: 0.03,
        },
      },
    });
    const frames = [
      frame('1', 0, 0, '0000-s-0.png', first),
      frame('2', 1, 250, '0001-s-250.png', second),
    ];
    const manifest = ForgeTemporalRenderArtifactsManifestSchema.parse({
      contractId: 'forge-temporal-render-artifacts/v1',
      assetId: 'guard.rustic',
      revisionId,
      morphologyRevisionId: `morphology.${hashText('3')}`,
      rigSignature: `rig.${hashText('4')}`,
      equipmentSignature: `equipment.${hashText('5')}`,
      clipId,
      action: 'walk.forward',
      framePlanId,
      durationMs: 500,
      loop: { mode: 'loop', startMs: 0, endMs: 500 },
      interpolation: 'linear',
      renderProfile: {
        id: 'fantasy.sprite.orthographic.v1',
        version: '1.0.0',
      },
      sourceGlb: {
        id: `glb.${sha256(sourceGlb)}`,
        classification: 'source',
        mediaType: 'model/gltf-binary',
        fileName: 'guard.rustic.glb',
        byteLength: sourceGlb.byteLength,
        sha256: sha256(sourceGlb),
      },
      frames,
      atlas: {
        id: `atlas.${sha256(atlas)}`,
        fileName: 'atlas.png',
        byteLength: atlas.byteLength,
        sha256: sha256(atlas),
        width: 256,
        height: 128,
        columns: 2,
        rows: 1,
        rects: [
          { frameId: frames[0]!.id, x: 0, y: 0, width: 128, height: 128 },
          { frameId: frames[1]!.id, x: 128, y: 0, width: 128, height: 128 },
        ],
      },
      deliveryId,
    });
    await writeFile(
      join(directory, 'temporal-manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    await mkdir(
      join(
        workspaceRoot,
        'artifacts/reference/guard.rustic',
        revisionId,
        'temporal',
        `batch.${hashText('e')}`,
      ),
      { recursive: true },
    );
    const service = new LocalBrowserArtifactService({ workspaceRoot });
    await expect(
      service.getTemporalManifest({
        assetId: 'guard.rustic',
        revisionId,
        deliveryId,
      }),
    ).resolves.toEqual(manifest);
    const chunk = ForgeInterchangeArtifactChunkSchema.parse(
      await service.getTemporalArtifactChunk({
        assetId: 'guard.rustic',
        revisionId,
        deliveryId,
        artifactId: frames[0]!.id,
        offset: 10,
        length: 20,
      }),
    );
    expect(chunk).toMatchObject({
      delivery_id: deliveryId,
      artifact_id: frames[0]!.id,
      artifact_sha256: sha256(first),
      offset: 10,
      length: 20,
      total: first.byteLength,
    });
    expect(Buffer.from(chunk.bytes_base64, 'base64')).toEqual(
      first.subarray(10, 30),
    );
    const glbChunk = ForgeInterchangeArtifactChunkSchema.parse(
      await service.getTemporalArtifactChunk({
        assetId: 'guard.rustic',
        revisionId,
        deliveryId,
        artifactId: manifest.sourceGlb.id,
        offset: 0,
        length: sourceGlb.byteLength,
      }),
    );
    expect(glbChunk).toMatchObject({
      artifact_id: manifest.sourceGlb.id,
      artifact_sha256: sha256(sourceGlb),
      total: sourceGlb.byteLength,
    });
    expect(Buffer.from(glbChunk.bytes_base64, 'base64')).toEqual(sourceGlb);

    await writeFile(join(directory, '0000-s-0.png'), Buffer.alloc(100, 9));
    await expect(
      service.getTemporalArtifactChunk({
        assetId: 'guard.rustic',
        revisionId,
        deliveryId,
        artifactId: frames[0]!.id,
        offset: 0,
        length: 10,
      }),
    ).rejects.toThrow(/do not match/i);
  });
});
