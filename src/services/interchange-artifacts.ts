import { createHash } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { access, lstat, readFile, writeFile } from 'node:fs/promises';
import { basename, join, relative, resolve, sep } from 'node:path';
import { inflateSync } from 'node:zlib';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { z } from 'zod';

import {
  ForgeInterchangeArtifactChunkSchema,
  forgeAssetInterchangeManifestSha256,
  parseForgeAssetInterchangeManifest,
  type AssetDocument,
  type ForgeAssetInterchangeManifest,
} from '../contracts/index.js';
import { contentRevisionId } from '../document/index.js';
import { MVP_RENDER_PROFILE } from '../render/index.js';
import type { InterchangeArtifactService } from '../tools/index.js';

const DirectionSchema = z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);
const DIRECTIONS = DirectionSchema.options;
const LocalNameSchema = z
  .string()
  .min(1)
  .refine((value) => basename(value) === value && !value.includes('\\'));
const RenderManifestSchema = z
  .object({
    assetId: z.string(),
    revisionId: z.string(),
    profile: z.string(),
    width: z.number().int(),
    height: z.number().int(),
    directions: z.number().int(),
    elevationDegrees: z.number(),
    paddingPixels: z.number().int(),
    minimumFeaturePixels: z.number().int(),
    transparent: z.boolean(),
    frames: z.array(
      z
        .object({ direction: DirectionSchema, path: LocalNameSchema })
        .passthrough(),
    ),
  })
  .passthrough();
const GlbManifestSchema = z
  .object({
    assetId: z.string(),
    revisionId: z.string(),
    glbPath: LocalNameSchema,
  })
  .passthrough();

export interface FileInterchangeArtifactServiceOptions {
  readonly workspaceRoot: string;
  readonly outputDirectory?: string;
}

function inside(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

async function noSymlink(root: string, candidate: string): Promise<void> {
  const local = relative(root, candidate);
  if (local.startsWith('..') || resolve(root, local) !== candidate)
    throw new Error('Interchange path escaped the active workspace.');
  let cursor = root;
  for (const segment of local.split(sep).filter(Boolean)) {
    cursor = join(cursor, segment);
    try {
      if ((await lstat(cursor)).isSymbolicLink())
        throw new Error('Interchange path cannot traverse a symbolic link.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
  }
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function paeth(left: number, above: number, upperLeft: number): number {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance)
    return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

export function validateInterchangePng(
  bytes: Buffer,
  expected: {
    readonly width: number;
    readonly height: number;
    readonly maximumBytes: number;
    readonly alphaMode?: 'transparent' | 'opaque';
  } = { width: 128, height: 128, maximumBytes: 1024 * 1024 },
): void {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (
    bytes.byteLength < 26 ||
    bytes.byteLength > expected.maximumBytes ||
    !bytes.subarray(0, 8).equals(signature) ||
    bytes.readUInt32BE(8) !== 13 ||
    bytes.toString('ascii', 12, 16) !== 'IHDR'
  )
    throw new Error('Interchange PNG signature or IHDR is invalid.');
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  if (
    width !== expected.width ||
    height !== expected.height ||
    bitDepth !== 8 ||
    (colorType !== 4 && colorType !== 6) ||
    bytes[26] !== 0 ||
    bytes[27] !== 0 ||
    bytes[28] !== 0
  )
    throw new Error(
      `Interchange PNG must be non-interlaced ${expected.width}x${expected.height} 8-bit grayscale-alpha or RGBA.`,
    );
  const idat: Buffer[] = [];
  let offset = 8;
  let sawIhdr = false;
  let sawIend = false;
  while (offset + 12 <= bytes.byteLength) {
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > bytes.byteLength) throw new Error('PNG chunk is truncated.');
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const crcInput = bytes.subarray(offset + 4, offset + 8 + length);
    if (bytes.readUInt32BE(offset + 8 + length) !== crc32(crcInput))
      throw new Error(`PNG ${type} chunk CRC is invalid.`);
    if (type === 'IHDR') {
      if (sawIhdr || offset !== 8 || length !== 13)
        throw new Error('PNG IHDR placement is invalid.');
      sawIhdr = true;
    } else if (type === 'IDAT')
      idat.push(bytes.subarray(offset + 8, offset + 8 + length));
    else if (type === 'IEND') {
      if (length !== 0) throw new Error('PNG IEND must be empty.');
      sawIend = true;
      offset = end;
      break;
    }
    offset = end;
  }
  if (!sawIhdr || idat.length === 0 || !sawIend || offset !== bytes.byteLength)
    throw new Error('PNG requires valid IHDR, IDAT, and terminal IEND chunks.');
  const bytesPerPixel = colorType === 6 ? 4 : 2;
  const rowBytes = width * bytesPerPixel;
  const expectedInflatedBytes = (rowBytes + 1) * height;
  const inflated = inflateSync(Buffer.concat(idat), {
    maxOutputLength: expectedInflatedBytes,
  });
  if (inflated.byteLength !== expectedInflatedBytes)
    throw new Error('PNG decoded byte length is invalid.');
  let prior = Buffer.alloc(rowBytes);
  let hasTransparentPixel = false;
  for (let row = 0; row < height; row += 1) {
    const sourceOffset = row * (rowBytes + 1);
    const filter = inflated[sourceOffset];
    if (filter === undefined || filter > 4)
      throw new Error('PNG scanline filter is invalid.');
    const decoded = Buffer.allocUnsafe(rowBytes);
    for (let column = 0; column < rowBytes; column += 1) {
      const encoded = inflated[sourceOffset + 1 + column]!;
      const left =
        column >= bytesPerPixel ? decoded[column - bytesPerPixel]! : 0;
      const above = prior[column]!;
      const upperLeft =
        column >= bytesPerPixel ? prior[column - bytesPerPixel]! : 0;
      const predictor =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? above
              : filter === 3
                ? Math.floor((left + above) / 2)
                : paeth(left, above, upperLeft);
      decoded[column] = (encoded + predictor) & 0xff;
    }
    for (
      let alpha = bytesPerPixel - 1;
      alpha < rowBytes;
      alpha += bytesPerPixel
    )
      if (decoded[alpha]! < 255) hasTransparentPixel = true;
    prior = decoded;
  }
  const alphaMode = expected.alphaMode ?? 'transparent';
  if (alphaMode === 'transparent' && !hasTransparentPixel)
    throw new Error('PNG must contain at least one non-opaque alpha pixel.');
  if (alphaMode === 'opaque' && hasTransparentPixel)
    throw new Error('PNG authoring evidence must be fully opaque.');
}

export async function validateInterchangeGlb(bytes: Buffer): Promise<void> {
  if (
    bytes.byteLength < 12 ||
    bytes.byteLength > 64 * 1024 * 1024 ||
    bytes.toString('ascii', 0, 4) !== 'glTF' ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.byteLength
  )
    throw new Error(
      'Interchange GLB header, version, or byte length is invalid.',
    );
  let offset = 12;
  let json: unknown;
  while (offset + 8 <= bytes.byteLength) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + length;
    if (length % 4 !== 0 || end > bytes.byteLength)
      throw new Error('Interchange GLB chunk table is invalid.');
    if (offset === 12 && type !== 0x4e4f534a)
      throw new Error('Interchange GLB first chunk must be JSON.');
    if (type === 0x4e4f534a) {
      if (json !== undefined)
        throw new Error('Interchange GLB has duplicate JSON chunks.');
      json = JSON.parse(bytes.toString('utf8', offset + 8, end).trim());
    }
    offset = end;
  }
  if (
    offset !== bytes.byteLength ||
    typeof json !== 'object' ||
    json === null ||
    !('asset' in json) ||
    typeof json.asset !== 'object' ||
    json.asset === null ||
    !('version' in json.asset) ||
    json.asset.version !== '2.0'
  )
    throw new Error('Interchange GLB JSON asset metadata is invalid.');
  await new GLTFLoader().parseAsync(Uint8Array.from(bytes).buffer, '');
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function writeImmutable(path: string, bytes: Uint8Array): Promise<void> {
  try {
    await writeFile(path, bytes, { flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const current = await readFile(path);
    if (!current.equals(bytes))
      throw new Error('Immutable interchange record already has other bytes.', {
        cause: error,
      });
  }
}

export class FileInterchangeArtifactService implements InterchangeArtifactService {
  readonly #workspaceRoot: string;
  readonly #outputRoot: string;

  constructor(options: FileInterchangeArtifactServiceOptions) {
    const root = resolve(options.workspaceRoot);
    this.#workspaceRoot = existsSync(root) ? realpathSync(root) : root;
    this.#outputRoot = resolve(
      this.#workspaceRoot,
      options.outputDirectory ?? 'artifacts/reference',
    );
    if (!inside(this.#workspaceRoot, this.#outputRoot))
      throw new Error(
        'Interchange output must remain inside the active workspace.',
      );
  }

  async register(
    document: Readonly<AssetDocument>,
    revisionId: string,
  ): Promise<boolean> {
    if (contentRevisionId(document) !== revisionId)
      throw new Error('Interchange registration revision is stale.');
    const directory = this.#revisionDirectory(document.id, revisionId);
    const renderPath = resolve(directory, 'render-manifest.json');
    const glbPath = resolve(directory, 'glb-manifest.json');
    await noSymlink(this.#workspaceRoot, directory);
    if (!(await exists(renderPath)) || !(await exists(glbPath))) return false;
    await noSymlink(directory, renderPath);
    await noSymlink(directory, glbPath);
    const render = RenderManifestSchema.parse(
      JSON.parse(await readFile(renderPath, 'utf8')),
    );
    const glb = GlbManifestSchema.parse(
      JSON.parse(await readFile(glbPath, 'utf8')),
    );
    if (
      render.assetId !== document.id ||
      render.revisionId !== revisionId ||
      glb.assetId !== document.id ||
      glb.revisionId !== revisionId
    )
      throw new Error('Artifact manifests do not match the exact revision.');
    const authoredProfile = document.renderProfiles.find(
      ({ id }) => id === render.profile,
    );
    const knownProfileId =
      render.profile === MVP_RENDER_PROFILE.id ||
      render.profile === 'sprite.default';
    const exactExternalParameters =
      render.width === MVP_RENDER_PROFILE.widthPixels &&
      render.height === MVP_RENDER_PROFILE.heightPixels &&
      render.directions === MVP_RENDER_PROFILE.directions &&
      render.elevationDegrees === MVP_RENDER_PROFILE.elevationDegrees &&
      render.paddingPixels === MVP_RENDER_PROFILE.paddingPixels &&
      render.minimumFeaturePixels === MVP_RENDER_PROFILE.minimumFeaturePixels &&
      render.transparent === MVP_RENDER_PROFILE.transparent;
    const exactAuthoredParameters =
      authoredProfile !== undefined &&
      authoredProfile.widthPixels === render.width &&
      authoredProfile.heightPixels === render.height &&
      authoredProfile.directions === render.directions &&
      authoredProfile.elevationDegrees === render.elevationDegrees &&
      authoredProfile.paddingPixels === render.paddingPixels &&
      authoredProfile.minimumFeaturePixels === render.minimumFeaturePixels &&
      authoredProfile.transparent === render.transparent;
    if (!knownProfileId || !exactExternalParameters || !exactAuthoredParameters)
      throw new Error(
        'Render profile does not map exactly to fantasy.sprite.orthographic.v1.',
      );
    if (
      render.frames.length !== DIRECTIONS.length ||
      DIRECTIONS.some(
        (direction) =>
          render.frames.filter((frame) => frame.direction === direction)
            .length !== 1,
      )
    )
      throw new Error('Render manifest is incomplete for interchange.');

    const artifacts: ForgeAssetInterchangeManifest['artifacts'] = [];
    for (const direction of DIRECTIONS) {
      const frame = render.frames.find((item) => item.direction === direction)!;
      const path = resolve(directory, frame.path);
      await noSymlink(directory, path);
      const bytes = await readFile(path);
      validateInterchangePng(bytes);
      artifacts.push({
        id: `frame.${direction.toLowerCase()}`,
        classification: 'source',
        role: 'directional_frame',
        media_type: 'image/png',
        byte_length: bytes.byteLength,
        sha256: sha256(bytes),
        width: 128,
        height: 128,
        revision_id: revisionId,
        reference: this.#reference(path),
        direction,
        transparent: true,
      });
    }
    const sourceGlbPath = resolve(directory, glb.glbPath);
    await noSymlink(directory, sourceGlbPath);
    const glbBytes = await readFile(sourceGlbPath);
    await validateInterchangeGlb(glbBytes);
    artifacts.push({
      id: 'model.glb',
      classification: 'source',
      role: 'glb',
      media_type: 'model/gltf-binary',
      byte_length: glbBytes.byteLength,
      sha256: sha256(glbBytes),
      revision_id: revisionId,
      reference: this.#reference(sourceGlbPath),
    });

    const workflowPath = resolve(directory, 'public-mcp-workflow.json');
    await noSymlink(directory, workflowPath);
    const workflowBytes = Buffer.from(
      `${JSON.stringify({
        contract_id: 'forge-public-mcp-workflow-evidence/v1',
        asset_id: document.id,
        revision_id: revisionId,
        source_operations: ['render_preview', 'export_asset'],
        retrieval_operations: [
          'get_interchange_manifest',
          'get_interchange_artifact_chunk',
        ],
      })}\n`,
      'utf8',
    );
    await writeImmutable(workflowPath, workflowBytes);
    const workflowReference = this.#reference(workflowPath);
    const evidence: ForgeAssetInterchangeManifest['evidence'] = [
      {
        id: 'workflow.public-mcp',
        kind: 'workflow',
        reference: workflowReference,
        sha256: sha256(workflowBytes),
        byte_length: workflowBytes.byteLength,
      },
    ];
    let styleProfile: ForgeAssetInterchangeManifest['style_profile'] = {
      id: 'cute_chibi_v1',
      version: '1.0.0',
      review: { status: 'not_required' },
    };
    if (document.novelIdentity !== undefined) {
      if (
        document.novelIdentity.renderProfile.id !==
          'fantasy.sprite.orthographic.v1' ||
        document.novelIdentity.renderProfile.version !== '1.0.0'
      )
        throw new Error(
          'Novel identity render profile does not match the rendered interchange profile.',
        );
      styleProfile = document.novelIdentity.styleProfile;
      if (styleProfile.review.status === 'recorded') {
        const declaredEvidenceReference =
          styleProfile.review.evidence_reference;
        const originalityPath = resolve(directory, 'originality-review.json');
        await noSymlink(directory, originalityPath);
        const originalityBytes = Buffer.from(
          `${JSON.stringify({
            contract_id: 'forge-style-originality-review/v1',
            asset_id: document.id,
            revision_id: revisionId,
            style_profile: {
              id: styleProfile.id,
              version: styleProfile.version,
              attestation: styleProfile.review.attestation,
              declared_evidence_reference: declaredEvidenceReference,
            },
          })}\n`,
          'utf8',
        );
        await writeImmutable(originalityPath, originalityBytes);
        const originalityReference = this.#reference(originalityPath);
        styleProfile = {
          ...styleProfile,
          review: {
            ...styleProfile.review,
            evidence_reference: originalityReference,
          },
        };
        evidence.push({
          id: 'style.originality',
          kind: 'originality_review',
          reference: originalityReference,
          sha256: sha256(originalityBytes),
          byte_length: originalityBytes.byteLength,
        });
      }
    }
    const manifest: ForgeAssetInterchangeManifest = {
      contract_id: 'forge-asset-interchange-manifest/v1',
      manifest_sha256: '0'.repeat(64),
      source: { asset_id: document.id, revision_id: revisionId },
      style_profile: styleProfile,
      render_profile: {
        id: 'fantasy.sprite.orthographic.v1',
        version: '1.0.0',
      },
      provenance: {
        source_kind: 'project_generated',
        workflow_reference: workflowReference,
        ownership: 'project_owned',
        license_label: 'project-owned',
      },
      artifacts,
      evidence,
    };
    manifest.manifest_sha256 =
      await forgeAssetInterchangeManifestSha256(manifest);
    const indexPath = resolve(directory, 'interchange-manifest.json');
    await noSymlink(directory, indexPath);
    await writeImmutable(
      indexPath,
      Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
    );
    await this.getManifest({ assetId: document.id, revisionId });
    return true;
  }

  async getManifest(request: {
    readonly assetId: string;
    readonly revisionId: string;
  }): Promise<ForgeAssetInterchangeManifest> {
    const directory = this.#revisionDirectory(
      request.assetId,
      request.revisionId,
    );
    await noSymlink(this.#workspaceRoot, directory);
    const indexPath = resolve(directory, 'interchange-manifest.json');
    await noSymlink(directory, indexPath);
    const manifest = await parseForgeAssetInterchangeManifest(
      JSON.parse(await readFile(indexPath, 'utf8')),
    );
    if (
      manifest.source.asset_id !== request.assetId ||
      manifest.source.revision_id !== request.revisionId
    )
      throw new Error('Stored interchange manifest identity mismatch.');
    for (const record of [...manifest.artifacts, ...manifest.evidence]) {
      const path = this.#pathForReference(record.reference, directory);
      await noSymlink(directory, path);
      if (sha256(await readFile(path)) !== record.sha256)
        throw new Error(`Interchange digest mismatch for ${record.id}.`);
    }
    return manifest;
  }

  async getArtifactChunk(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly artifactId: string;
    readonly recordKind?: 'artifact' | 'evidence';
    readonly offset: number;
    readonly length: number;
  }) {
    const manifest = await this.getManifest(request);
    const recordKind = request.recordKind ?? 'artifact';
    const artifact =
      recordKind === 'artifact'
        ? manifest.artifacts.find(({ id }) => id === request.artifactId)
        : undefined;
    const evidence =
      recordKind === 'evidence'
        ? manifest.evidence.find(({ id }) => id === request.artifactId)
        : undefined;
    const record = artifact ?? evidence;
    if (record === undefined)
      throw new Error('Record is not allowlisted by the immutable manifest.');
    const total = artifact?.byte_length ?? evidence?.byte_length;
    if (total === undefined)
      throw new Error('Evidence record does not declare byte_length.');
    if (
      request.offset < 0 ||
      request.length < 1 ||
      request.offset + request.length > total
    )
      throw new Error('Artifact chunk range is invalid.');
    const directory = this.#revisionDirectory(
      request.assetId,
      request.revisionId,
    );
    const path = this.#pathForReference(record.reference, directory);
    await noSymlink(directory, path);
    const bytes = await readFile(path);
    if (bytes.byteLength !== total || sha256(bytes) !== record.sha256)
      throw new Error(`Interchange digest mismatch for ${record.id}.`);
    const chunkBytes = bytes.subarray(
      request.offset,
      request.offset + request.length,
    );
    return ForgeInterchangeArtifactChunkSchema.parse({
      record_kind: recordKind,
      asset_id: request.assetId,
      revision_id: request.revisionId,
      artifact_id: record.id,
      artifact_sha256: record.sha256,
      chunk_sha256: sha256(chunkBytes),
      offset: request.offset,
      length: request.length,
      total: bytes.byteLength,
      bytes_base64: chunkBytes.toString('base64'),
    });
  }

  #reference(path: string): string {
    const value = relative(this.#workspaceRoot, path).split(sep).join('/');
    if (value.startsWith('../') || value === '..')
      throw new Error('Interchange reference escaped the active workspace.');
    return value;
  }

  #pathForReference(reference: string, revisionDirectory: string): string {
    if (
      reference.includes('\\') ||
      reference.split('/').some((part) => part === '..')
    )
      throw new Error('Interchange reference is not portable.');
    const path = resolve(this.#workspaceRoot, reference);
    if (!inside(revisionDirectory, path))
      throw new Error('Interchange reference escaped the revision directory.');
    return path;
  }

  #revisionDirectory(assetId: string, revisionId: string): string {
    if (
      !/^[a-z][a-z0-9._-]*$/.test(assetId) ||
      !/^revision\.[a-f0-9]{64}$/.test(revisionId)
    )
      throw new Error('Invalid interchange identity.');
    const directory = resolve(this.#outputRoot, assetId, revisionId);
    if (!inside(this.#outputRoot, directory))
      throw new Error('Interchange path escaped the artifact root.');
    return directory;
  }
}
