import { createHash } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import {
  FORGE_AUTHORING_REVIEW_CONTRACT_ID,
  ForgeAuthoringReviewManifestSchema,
  ForgeInterchangeArtifactChunkSchema,
  forgeAuthoringReviewManifestSha256,
  parseForgeAuthoringReviewManifest,
  type AssetDocument,
  type ForgeAuthoringReviewManifest,
} from '../contracts/index.js';
import { contentRevisionId } from '../document/index.js';
import { REFERENCE_COMPARISON_VIEWS } from '../render/index.js';
import { validateInterchangePng } from './interchange-artifacts.js';

export interface AuthoringReviewFrameInput {
  readonly view: (typeof REFERENCE_COMPARISON_VIEWS)[number]['view'];
  readonly bytes: Buffer;
}

function inside(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}
async function noSymlink(root: string, candidate: string): Promise<void> {
  const path = relative(root, candidate);
  if (path.startsWith('..') || resolve(root, path) !== candidate)
    throw new Error('Authoring review path escaped its registry root.');
  let cursor = root;
  for (const segment of path.split(sep).filter(Boolean)) {
    cursor = resolve(cursor, segment);
    try {
      if ((await lstat(cursor)).isSymbolicLink())
        throw new Error('Authoring review paths cannot traverse symlinks.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
  }
}
async function writeImmutable(path: string, bytes: Uint8Array): Promise<void> {
  try {
    await writeFile(path, bytes, { flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    if (!(await readFile(path)).equals(bytes))
      throw new Error('Immutable authoring review already has other bytes.', {
        cause: error,
      });
  }
}
const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

export class FileAuthoringReviewArtifactService {
  readonly #workspaceRoot: string;
  readonly #outputRoot: string;

  constructor(options: {
    readonly workspaceRoot: string;
    readonly outputDirectory?: string;
  }) {
    const workspace = resolve(options.workspaceRoot);
    this.#workspaceRoot = existsSync(workspace)
      ? realpathSync(workspace)
      : workspace;
    this.#outputRoot = resolve(
      this.#workspaceRoot,
      options.outputDirectory ?? 'artifacts/authoring',
    );
    if (!inside(this.#workspaceRoot, this.#outputRoot))
      throw new Error('Authoring review output must remain in the workspace.');
  }

  async register(
    document: Readonly<AssetDocument>,
    revisionId: string,
    frames: readonly AuthoringReviewFrameInput[],
    contactSheetBytes: Buffer,
  ): Promise<ForgeAuthoringReviewManifest> {
    if (contentRevisionId(document) !== revisionId)
      throw new Error('Authoring review revision is stale.');
    if (
      frames.length !== 4 ||
      REFERENCE_COMPARISON_VIEWS.some(
        (expected, index) => frames[index]?.view !== expected.view,
      )
    )
      throw new Error('Authoring review views are incomplete or misordered.');
    const directory = this.#directory(document.id, revisionId);
    await noSymlink(this.#workspaceRoot, directory);
    await mkdir(directory, { recursive: true });
    const artifacts: ForgeAuthoringReviewManifest['artifacts'] = [];
    for (const [index, frame] of frames.entries()) {
      validateInterchangePng(frame.bytes, {
        width: 512,
        height: 512,
        maximumBytes: 4 * 1024 * 1024,
        alphaMode: 'opaque',
      });
      const view = REFERENCE_COMPARISON_VIEWS[index]!.view;
      const path = resolve(directory, `${view}.png`);
      await noSymlink(directory, path);
      await writeImmutable(path, frame.bytes);
      artifacts.push({
        id: `view.${view}`,
        role: 'comparison_view',
        media_type: 'image/png',
        byte_length: frame.bytes.byteLength,
        sha256: sha256(frame.bytes),
        width: 512,
        height: 512,
        transparent: false,
        reference: this.#reference(path),
        view,
      });
    }
    validateInterchangePng(contactSheetBytes, {
      width: 2048,
      height: 530,
      maximumBytes: 16 * 1024 * 1024,
      alphaMode: 'opaque',
    });
    const sheetPath = resolve(directory, 'contact-sheet.png');
    await noSymlink(directory, sheetPath);
    await writeImmutable(sheetPath, contactSheetBytes);
    artifacts.push({
      id: 'review.contact-sheet',
      role: 'contact_sheet',
      media_type: 'image/png',
      byte_length: contactSheetBytes.byteLength,
      sha256: sha256(contactSheetBytes),
      width: 2048,
      height: 530,
      transparent: false,
      reference: this.#reference(sheetPath),
    });
    const manifest = ForgeAuthoringReviewManifestSchema.parse({
      contract_id: FORGE_AUTHORING_REVIEW_CONTRACT_ID,
      manifest_sha256: '0'.repeat(64),
      delivery_id: `delivery.${'0'.repeat(64)}`,
      source: { asset_id: document.id, revision_id: revisionId },
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
      artifacts,
    });
    manifest.manifest_sha256 =
      await forgeAuthoringReviewManifestSha256(manifest);
    manifest.delivery_id = `delivery.${manifest.manifest_sha256}`;
    const manifestPath = resolve(directory, 'authoring-review-manifest.json');
    await noSymlink(directory, manifestPath);
    await writeImmutable(
      manifestPath,
      Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
    );
    return parseForgeAuthoringReviewManifest(manifest);
  }

  async findManifest(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
  }): Promise<ForgeAuthoringReviewManifest | undefined> {
    const path = resolve(
      this.#directory(request.assetId, request.revisionId),
      'authoring-review-manifest.json',
    );
    await noSymlink(this.#workspaceRoot, path);
    if (!existsSync(path)) return undefined;
    const manifest = await parseForgeAuthoringReviewManifest(
      JSON.parse(await readFile(path, 'utf8')),
    );
    if (
      manifest.source.asset_id !== request.assetId ||
      manifest.source.revision_id !== request.revisionId
    )
      throw new Error(
        'Authoring review source identity does not match its registry path.',
      );
    return manifest.delivery_id === request.deliveryId ? manifest : undefined;
  }
  async getManifest(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
  }): Promise<ForgeAuthoringReviewManifest> {
    const manifest = await this.findManifest(request);
    if (manifest === undefined)
      throw new Error('Authoring review delivery was not found.');
    return manifest;
  }
  async getArtifactChunk(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
    readonly artifactId: string;
    readonly offset: number;
    readonly length: number;
  }): Promise<unknown> {
    if (
      !Number.isInteger(request.offset) ||
      request.offset < 0 ||
      !Number.isInteger(request.length) ||
      request.length < 1 ||
      request.length > 32 * 1024
    )
      throw new Error(
        'Authoring review chunk request is outside its bounded integer range.',
      );
    const manifest = await this.getManifest(request);
    const artifact = manifest.artifacts.find(
      ({ id }) => id === request.artifactId,
    );
    if (artifact === undefined)
      throw new Error('Authoring review evidence was not found.');
    if (
      request.offset >= artifact.byte_length ||
      request.offset + request.length > artifact.byte_length
    )
      throw new Error('Authoring review chunk range is invalid.');
    const directory = this.#directory(request.assetId, request.revisionId);
    const path = resolve(this.#workspaceRoot, artifact.reference);
    if (!inside(directory, path))
      throw new Error('Authoring review evidence escaped its root.');
    await noSymlink(directory, path);
    const bytes = await readFile(path);
    if (
      bytes.byteLength !== artifact.byte_length ||
      sha256(bytes) !== artifact.sha256
    )
      throw new Error(
        'Authoring review evidence bytes do not match the manifest.',
      );
    const chunk = bytes.subarray(
      request.offset,
      request.offset + request.length,
    );
    return ForgeInterchangeArtifactChunkSchema.parse({
      record_kind: 'evidence',
      asset_id: request.assetId,
      revision_id: request.revisionId,
      delivery_id: request.deliveryId,
      artifact_id: artifact.id,
      artifact_sha256: artifact.sha256,
      chunk_sha256: sha256(chunk),
      offset: request.offset,
      length: request.length,
      total: artifact.byte_length,
      bytes_base64: chunk.toString('base64'),
    });
  }
  #directory(assetId: string, revisionId: string): string {
    if (
      !/^[a-z][a-z0-9._-]*$/.test(assetId) ||
      !/^revision\.[a-f0-9]{64}$/.test(revisionId)
    )
      throw new Error('Invalid authoring review identity.');
    const directory = resolve(
      this.#outputRoot,
      assetId,
      revisionId,
      'reference-comparison',
    );
    if (!inside(this.#outputRoot, directory))
      throw new Error('Authoring review path escaped the registry.');
    return directory;
  }
  #reference(path: string): string {
    return relative(this.#workspaceRoot, path).split(sep).join('/');
  }
}
