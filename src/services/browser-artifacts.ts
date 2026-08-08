import { createHash } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, join, relative, resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import { z } from 'zod';
import {
  temporalAtlasLayout,
  temporalPoseSheetLayout,
  temporalRenderDocuments,
} from '../animation/index.js';
import {
  ForgeTemporalArtifactsManifestSchema,
  ForgeTemporalRenderBatchArtifactsManifestSchema,
  ForgeTemporalRenderArtifactsManifestSchema,
  FORGE_INTERCHANGE_MAX_CHUNK_BYTES,
  ForgeInterchangeArtifactChunkSchema,
  RigidAnimationBundleSchema,
  canonicalRigidAnimationValue,
  digestRigidAnimationValue,
  type AssetDocument,
  type Bounds,
  type ForgeTemporalArtifactsManifest,
  type RigidAnimationBundle,
} from '../contracts/index.js';
import { compileThreeScene, disposeCompiledScene } from '../scene/index.js';
import type {
  ExportService,
  InterchangeArtifactService,
  RenderService,
} from '../tools/index.js';
import { REFERENCE_COMPARISON_VIEWS } from '../render/index.js';
import { FileAuthoringReviewArtifactService } from './authoring-review-artifacts.js';
import {
  FileInterchangeArtifactService,
  validateInterchangeGlb,
  validateInterchangePng,
} from './interchange-artifacts.js';

type PageRunner = <Value>(
  callback: (page: Page) => Promise<Value>,
) => Promise<Value>;
interface BrowserArtifactServiceOptions {
  readonly workspaceRoot: string;
  readonly inspectorUrl?: string;
  readonly outputDirectory?: string;
  readonly executablePath?: string;
  readonly pageRunner?: PageRunner;
}
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const MAX_FRAME_BYTES = 1024 * 1024;
const MAX_CONTACT_SHEET_BYTES = 8 * 1024 * 1024;
const MAX_DATA_URL_CHARACTERS =
  'data:image/png;base64,'.length +
  Math.ceil((MAX_CONTACT_SHEET_BYTES * 4) / 3) +
  4;
const PngDataUrlSchema = z
  .string()
  .max(MAX_DATA_URL_CHARACTERS)
  .regex(
    /^data:image\/png;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  );
const BrowserRenderArtifactSchema = z
  .strictObject({
    frames: z
      .array(
        z.strictObject({
          direction: z.enum(DIRECTIONS),
          dataUrl: PngDataUrlSchema,
          metrics: z.unknown(),
        }),
      )
      .length(DIRECTIONS.length),
    contactSheetDataUrl: PngDataUrlSchema,
  })
  .superRefine((value, context) => {
    for (const [index, direction] of DIRECTIONS.entries())
      if (value.frames[index]?.direction !== direction)
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'direction'],
          message: `Render direction ${index} must be ${direction}.`,
        });
  });
type BrowserRenderArtifact = z.infer<typeof BrowserRenderArtifactSchema>;
const BrowserReferenceComparisonArtifactSchema = z
  .strictObject({
    frames: z
      .array(
        z.strictObject({
          view: z.enum(['front', 'three-quarter', 'side', 'back']),
          dataUrl: PngDataUrlSchema,
          metrics: z.unknown(),
        }),
      )
      .length(4),
    contactSheetDataUrl: PngDataUrlSchema,
  })
  .superRefine((value, context) => {
    for (const [index, expected] of REFERENCE_COMPARISON_VIEWS.entries())
      if (value.frames[index]?.view !== expected.view)
        context.addIssue({
          code: 'custom',
          path: ['frames', index, 'view'],
          message: `Reference comparison frame ${index} must be ${expected.view}.`,
        });
  });
type BrowserReferenceComparisonArtifact = z.infer<
  typeof BrowserReferenceComparisonArtifactSchema
>;
type BatchTemporalManifestInput = z.input<
  typeof ForgeTemporalRenderBatchArtifactsManifestSchema
>;
type TemporalManifestInput = z.input<
  typeof ForgeTemporalRenderArtifactsManifestSchema
>;
const BrowserTemporalFrameSchema = z.strictObject({
  direction: z.enum(DIRECTIONS),
  dataUrl: PngDataUrlSchema,
  metrics: z.looseObject({
    groundAnchorDeviationPixels: z.number().finite().min(-1).max(1),
    clippedEdges: z.array(z.string()).max(4),
    framingEvidence: z.looseObject({
      topMarginPixels: z.number().finite().nullable(),
      centerDeviationPixels: z.number().finite().nullable(),
      worldUnitsPerPixel: z.number().finite().positive(),
    }),
  }),
});
const BrowserExportArtifactSchema = z.strictObject({
  bytes: z
    .array(z.number().int().min(0).max(255))
    .min(12)
    .max(64 * 1024 * 1024),
  manifest: z
    .record(z.string(), z.unknown())
    .refine(
      (value) =>
        Object.keys(value).length <= 500 &&
        JSON.stringify(value).length <= 1024 * 1024,
      'Export metadata exceeds its structural cap.',
    ),
});
const SYSTEM_BROWSER_EXECUTABLES = [
  '/opt/google/chrome/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
] as const;

function resolveBrowserExecutablePath(configured?: string): string {
  if (configured !== undefined) {
    const resolved = resolve(configured);
    if (!existsSync(resolved))
      throw new Error(`Browser executable does not exist: ${resolved}`);
    return realpathSync(resolved);
  }
  const candidates = [chromium.executablePath(), ...SYSTEM_BROWSER_EXECUTABLES];
  const available = candidates.find((candidate) => existsSync(candidate));
  if (available === undefined)
    throw new Error(
      'No browser executable is available for Forge artifact rendering.',
    );
  return realpathSync(available);
}

function isInside(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

async function assertNoSymlinkPath(
  root: string,
  candidate: string,
): Promise<void> {
  const relativePath = relative(root, candidate);
  if (
    relativePath.startsWith('..') ||
    resolve(root, relativePath) !== candidate
  )
    throw new Error('Artifact path escaped the active workspace.');
  let cursor = root;
  for (const segment of relativePath.split(sep).filter(Boolean)) {
    cursor = join(cursor, segment);
    try {
      if ((await lstat(cursor)).isSymbolicLink())
        throw new Error('Artifact output cannot traverse symbolic links.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
  }
}

async function writeImmutable(
  revisionDirectory: string,
  path: string,
  bytes: Uint8Array,
): Promise<void> {
  await assertNoSymlinkPath(revisionDirectory, path);
  try {
    await writeFile(path, bytes, { flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    if (!(await readFile(path)).equals(bytes))
      throw new Error('Immutable revision artifact already has other bytes.', {
        cause: error,
      });
  }
}

function assertLoopbackInspectorUrl(value: string): void {
  const url = new URL(value);
  const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);
  if (url.protocol !== 'http:' || !loopbackHosts.has(url.hostname))
    throw new Error('Inspector URL must use HTTP on a loopback host.');
  if (url.username !== '' || url.password !== '')
    throw new Error('Inspector URL must not contain credentials.');
}

function decodeDataUrl(dataUrl: string, maximumBytes: number): Buffer {
  const bytes = Buffer.from(
    dataUrl.slice('data:image/png;base64,'.length),
    'base64',
  );
  if (bytes.byteLength < 1 || bytes.byteLength > maximumBytes)
    throw new Error('Browser render payload exceeded its PNG byte limit.');
  return bytes;
}

export class LocalBrowserArtifactService
  implements RenderService, ExportService, InterchangeArtifactService
{
  readonly #workspaceRoot: string;
  readonly #outputRoot: string;
  readonly #inspectorUrl: string;
  readonly #executablePath: string;
  readonly #pageRunner: PageRunner | undefined;
  readonly #interchange: FileInterchangeArtifactService;
  readonly #authoringReviews: FileAuthoringReviewArtifactService;

  constructor(options: BrowserArtifactServiceOptions) {
    const resolvedWorkspaceRoot = resolve(options.workspaceRoot);
    this.#workspaceRoot = existsSync(resolvedWorkspaceRoot)
      ? realpathSync(resolvedWorkspaceRoot)
      : resolvedWorkspaceRoot;
    this.#outputRoot = resolve(
      this.#workspaceRoot,
      options.outputDirectory ?? 'artifacts/reference',
    );
    this.#inspectorUrl = options.inspectorUrl ?? 'http://127.0.0.1:4173';
    assertLoopbackInspectorUrl(this.#inspectorUrl);
    this.#pageRunner = options.pageRunner;
    this.#executablePath = resolveBrowserExecutablePath(options.executablePath);
    this.#interchange = new FileInterchangeArtifactService({
      workspaceRoot: this.#workspaceRoot,
      ...(options.outputDirectory === undefined
        ? {}
        : { outputDirectory: options.outputDirectory }),
    });
    this.#authoringReviews = new FileAuthoringReviewArtifactService({
      workspaceRoot: this.#workspaceRoot,
      ...(options.outputDirectory === undefined
        ? {}
        : { outputDirectory: `${options.outputDirectory}/authoring` }),
    });
    if (!isInside(this.#workspaceRoot, this.#outputRoot))
      throw new Error(
        'Artifact output must remain inside the active workspace.',
      );
  }

  async render(
    document: Readonly<AssetDocument>,
    revisionId: string,
  ): Promise<unknown> {
    const directory = this.#revisionDirectory(document.id, revisionId);
    await assertNoSymlinkPath(this.#workspaceRoot, directory);
    const received = await this.#withPage(async (page) =>
      page.evaluate(
        ({ asset, activeRevisionId }) => {
          const forge = (
            window as unknown as {
              fantasyAssetForge: {
                loadDocument: (
                  value: AssetDocument,
                  referenceName?: undefined,
                  revisionId?: string,
                ) => void;
                renderArtifacts: () => BrowserRenderArtifact;
              };
            }
          ).fantasyAssetForge;
          forge.loadDocument(asset, undefined, activeRevisionId);
          return forge.renderArtifacts();
        },
        { asset: document, activeRevisionId: revisionId },
      ),
    );
    const artifacts = BrowserRenderArtifactSchema.parse(received);
    const decodedFrames = artifacts.frames.map((frame) => ({
      ...frame,
      bytes: decodeDataUrl(frame.dataUrl, MAX_FRAME_BYTES),
    }));
    for (const frame of decodedFrames) validateInterchangePng(frame.bytes);
    const contactSheetBytes = decodeDataUrl(
      artifacts.contactSheetDataUrl,
      MAX_CONTACT_SHEET_BYTES,
    );
    await this.#prepareDirectory(directory);
    const frames: { direction: string; path: string; metrics: unknown }[] = [];
    for (const frame of decodedFrames) {
      const path = resolve(directory, `${frame.direction.toLowerCase()}.png`);
      await writeImmutable(directory, path, frame.bytes);
      frames.push({ direction: frame.direction, path, metrics: frame.metrics });
    }
    const contactSheetPath = resolve(directory, 'contact-sheet.png');
    await writeImmutable(directory, contactSheetPath, contactSheetBytes);
    const profile = document.renderProfiles[0];
    if (profile === undefined)
      throw new Error('Document does not declare a render profile.');
    const manifest = {
      assetId: document.id,
      revisionId,
      profile: profile.id,
      width: profile.widthPixels,
      height: profile.heightPixels,
      directions: profile.directions,
      elevationDegrees: profile.elevationDegrees,
      paddingPixels: profile.paddingPixels,
      minimumFeaturePixels: profile.minimumFeaturePixels,
      transparent: profile.transparent,
      frames: frames.map((frame) => ({
        ...frame,
        path: basename(frame.path),
      })),
      contactSheetPath: basename(contactSheetPath),
    };
    const manifestPath = resolve(directory, 'render-manifest.json');
    await writeImmutable(
      directory,
      manifestPath,
      Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
    );
    await this.#interchange.register(document, revisionId);
    return { manifestPath, contactSheetPath, frames };
  }

  async renderReferenceComparison(
    document: Readonly<AssetDocument>,
    revisionId: string,
  ): Promise<unknown> {
    const received = await this.#withPage(async (page) =>
      page.evaluate(
        ({ asset, activeRevisionId }) => {
          const forge = (
            window as unknown as {
              fantasyAssetForge: {
                loadDocument: (
                  value: AssetDocument,
                  referenceName?: undefined,
                  revisionId?: string,
                ) => void;
                renderReferenceComparisonArtifacts: () => BrowserReferenceComparisonArtifact;
              };
            }
          ).fantasyAssetForge;
          forge.loadDocument(asset, undefined, activeRevisionId);
          return forge.renderReferenceComparisonArtifacts();
        },
        { asset: document, activeRevisionId: revisionId },
      ),
    );
    const artifacts = BrowserReferenceComparisonArtifactSchema.parse(received);
    const manifest = await this.#authoringReviews.register(
      document,
      revisionId,
      artifacts.frames.map(({ view, dataUrl }) => ({
        view,
        bytes: decodeDataUrl(dataUrl, 4 * 1024 * 1024),
      })),
      decodeDataUrl(artifacts.contactSheetDataUrl, 16 * 1024 * 1024),
    );
    return {
      contractId: manifest.contract_id,
      deliveryId: manifest.delivery_id,
      manifestSha256: manifest.manifest_sha256,
      profileId: manifest.profile.id,
      classification: manifest.classification,
      admission: manifest.admission,
      artifactSha256s: manifest.artifacts.map(({ sha256 }) => sha256),
    };
  }

  async renderTemporal(
    document: Readonly<AssetDocument>,
    revisionId: string,
    bundleInput: RigidAnimationBundle,
  ): Promise<unknown> {
    const bundle = RigidAnimationBundleSchema.parse(bundleInput);
    if (bundle.rig.assetRevisionId !== revisionId)
      throw new Error('Temporal bundle is stale for the requested revision.');
    if (bundle.clips.length > 1)
      return this.#renderTemporalBatch(document, revisionId, bundle);
    const clip = bundle.clips[0]!;
    const plan = bundle.framePlans[0]!;
    const renderDocuments = temporalRenderDocuments(document, bundle);
    const framingBounds = renderDocuments.reduce<Bounds | undefined>(
      (combined, item) => {
        const compiled = compileThreeScene(item.document);
        try {
          const current = compiled.summary.bounds;
          return combined === undefined
            ? current
            : {
                min: [
                  Math.min(combined.min[0], current.min[0]),
                  Math.min(combined.min[1], current.min[1]),
                  Math.min(combined.min[2], current.min[2]),
                ],
                max: [
                  Math.max(combined.max[0], current.max[0]),
                  Math.max(combined.max[1], current.max[1]),
                  Math.max(combined.max[2], current.max[2]),
                ],
              };
        } finally {
          disposeCompiledScene(compiled);
        }
      },
      undefined,
    );
    if (framingBounds === undefined)
      throw new Error('Temporal rendering produced no framing bounds.');
    const layout = temporalAtlasLayout(
      renderDocuments.map(({ frameId }) => frameId),
    );
    const directory = this.#temporalDirectory(
      document.id,
      revisionId,
      clip.clipId,
      plan.framePlanId,
    );
    await this.#prepareDirectory(directory);

    const rendered = await this.#withPage(async (page) => {
      await page.evaluate(
        ({ width, height }) => {
          const atlas = globalThis.document.createElement('canvas');
          atlas.width = width;
          atlas.height = height;
          const context = atlas.getContext('2d');
          if (context === null)
            throw new Error('Temporal atlas canvas is unavailable.');
          context.clearRect(0, 0, width, height);
          Object.assign(window, { __forgeTemporalAtlas: atlas });
        },
        { width: layout.width, height: layout.height },
      );
      const frames: z.infer<typeof BrowserTemporalFrameSchema>[] = [];
      for (const [index, item] of renderDocuments.entries()) {
        const rect = layout.rects[index]!;
        const frame = await page.evaluate(
          async ({
            asset,
            activeRevisionId,
            direction,
            rect,
            framingBounds,
          }) => {
            const scopedWindow = window as unknown as {
              __forgeTemporalAtlas: HTMLCanvasElement;
              fantasyAssetForge: {
                loadDocument: (
                  value: AssetDocument,
                  referenceName?: undefined,
                  revisionId?: string,
                  framingBounds?: Bounds,
                ) => void;
                renderArtifacts: () => BrowserRenderArtifact;
              };
            };
            scopedWindow.fantasyAssetForge.loadDocument(
              asset,
              undefined,
              activeRevisionId,
              framingBounds,
            );
            const selected = scopedWindow.fantasyAssetForge
              .renderArtifacts()
              .frames.find((candidate) => candidate.direction === direction);
            if (selected === undefined)
              throw new Error(`Direction ${direction} was not rendered.`);
            const image = new Image();
            image.src = selected.dataUrl;
            await image.decode();
            const context = scopedWindow.__forgeTemporalAtlas.getContext('2d');
            if (context === null)
              throw new Error('Temporal atlas canvas is unavailable.');
            context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
            return selected;
          },
          {
            asset: item.document,
            activeRevisionId: revisionId,
            direction: item.direction,
            rect,
            framingBounds,
          },
        );
        frames.push(BrowserTemporalFrameSchema.parse(frame));
      }
      const atlasDataUrl = await page.evaluate(() => {
        const scopedWindow = window as unknown as {
          __forgeTemporalAtlas?: HTMLCanvasElement;
        };
        const atlas = scopedWindow.__forgeTemporalAtlas;
        if (atlas === undefined)
          throw new Error('Temporal atlas canvas was not initialized.');
        const dataUrl = atlas.toDataURL('image/png');
        delete scopedWindow.__forgeTemporalAtlas;
        return dataUrl;
      });
      const sourceGlb = await page.evaluate(
        async ({ asset, activeRevisionId }) => {
          const forge = (
            window as unknown as {
              fantasyAssetForge: {
                loadDocument: (
                  value: AssetDocument,
                  referenceName?: undefined,
                  revisionId?: string,
                ) => void;
                exportGlb: () => Promise<{
                  bytes: ArrayBuffer;
                  manifest: unknown;
                }>;
              };
            }
          ).fantasyAssetForge;
          forge.loadDocument(asset, undefined, activeRevisionId);
          const result = await forge.exportGlb();
          return {
            bytes: Array.from(new Uint8Array(result.bytes)),
            manifest: result.manifest,
          };
        },
        { asset: document, activeRevisionId: revisionId },
      );
      return { frames, atlasDataUrl, sourceGlb };
    });

    const frameRecords: TemporalManifestInput['frames'] = [];
    for (const [index, frame] of rendered.frames.entries()) {
      const source = renderDocuments[index]!;
      const bytes = decodeDataUrl(frame.dataUrl, MAX_FRAME_BYTES);
      validateInterchangePng(bytes);
      const fileName = `${String(index).padStart(4, '0')}-${source.direction.toLowerCase()}-${source.sampleTimeMs}.png`;
      const path = resolve(directory, fileName);
      await writeImmutable(directory, path, bytes);
      frameRecords.push({
        id: source.frameId,
        sequence: index,
        direction: source.direction,
        sampleTimeMs: source.sampleTimeMs,
        fileName,
        byteLength: bytes.byteLength,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        metrics: frame.metrics,
      });
    }
    const atlasBytes = decodeDataUrl(
      PngDataUrlSchema.parse(rendered.atlasDataUrl),
      MAX_CONTACT_SHEET_BYTES,
    );
    validateInterchangePng(atlasBytes, {
      width: layout.width,
      height: layout.height,
      maximumBytes: MAX_CONTACT_SHEET_BYTES,
    });
    const atlasPath = resolve(directory, 'atlas.png');
    await writeImmutable(directory, atlasPath, atlasBytes);
    const atlasSha256 = createHash('sha256').update(atlasBytes).digest('hex');
    const exportedGlb = BrowserExportArtifactSchema.parse(rendered.sourceGlb);
    const sourceGlbBytes = Buffer.from(exportedGlb.bytes);
    await validateInterchangeGlb(sourceGlbBytes);
    const sourceGlbFileName = `${document.id}.glb`;
    const sourceGlbPath = resolve(directory, sourceGlbFileName);
    await writeImmutable(directory, sourceGlbPath, sourceGlbBytes);
    const sourceGlbSha256 = createHash('sha256')
      .update(sourceGlbBytes)
      .digest('hex');
    const manifestWithoutIdentity = {
      contractId: 'forge-temporal-render-artifacts/v1',
      assetId: document.id,
      revisionId,
      morphologyRevisionId: bundle.rig.morphologyRevisionId,
      rigSignature: bundle.rig.rigSignature,
      equipmentSignature: bundle.rig.equipmentSignature,
      clipId: clip.clipId,
      action: clip.action,
      framePlanId: plan.framePlanId,
      durationMs: clip.durationMs,
      loop: clip.loop,
      interpolation: clip.interpolation,
      renderProfile: plan.renderProfile,
      sourceGlb: {
        id: `glb.${sourceGlbSha256}`,
        classification: 'source',
        mediaType: 'model/gltf-binary',
        fileName: sourceGlbFileName,
        byteLength: sourceGlbBytes.byteLength,
        sha256: sourceGlbSha256,
      },
      frames: frameRecords,
      atlas: {
        id: `atlas.${atlasSha256}`,
        fileName: basename(atlasPath),
        byteLength: atlasBytes.byteLength,
        sha256: atlasSha256,
        width: layout.width,
        height: layout.height,
        columns: layout.columns,
        rows: layout.rows,
        rects: layout.rects,
      },
    };
    const deliveryId = `delivery.${await digestRigidAnimationValue(
      manifestWithoutIdentity,
    )}`;
    const manifest = ForgeTemporalRenderArtifactsManifestSchema.parse({
      ...manifestWithoutIdentity,
      deliveryId,
    });
    const manifestBytes = Buffer.from(
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );
    const manifestPath = resolve(directory, 'temporal-manifest.json');
    await writeImmutable(directory, manifestPath, manifestBytes);
    return {
      deliveryId,
      manifestSha256: createHash('sha256').update(manifestBytes).digest('hex'),
      atlasSha256,
      sourceGlbSha256,
      frameSha256s: frameRecords.map(({ sha256 }) => sha256),
    };
  }

  async #renderTemporalBatch(
    document: Readonly<AssetDocument>,
    revisionId: string,
    bundle: RigidAnimationBundle,
  ): Promise<unknown> {
    const expectedActions = [
      'idle',
      'walk_forward',
      'walk_right',
      'attack',
      'receive_damage',
    ] as const;
    if (
      bundle.clips.length !== expectedActions.length ||
      bundle.framePlans.length !== expectedActions.length ||
      bundle.clips.some((clip, index) => clip.action !== expectedActions[index])
    )
      throw new Error(
        'Temporal batch rendering requires the exact five reference clips in canonical order.',
      );

    const renderDocuments = temporalRenderDocuments(document, bundle);
    const framingBounds = renderDocuments.reduce<Bounds | undefined>(
      (combined, item) => {
        const compiled = compileThreeScene(item.document);
        try {
          const current = compiled.summary.bounds;
          return combined === undefined
            ? current
            : {
                min: [
                  Math.min(combined.min[0], current.min[0]),
                  Math.min(combined.min[1], current.min[1]),
                  Math.min(combined.min[2], current.min[2]),
                ],
                max: [
                  Math.max(combined.max[0], current.max[0]),
                  Math.max(combined.max[1], current.max[1]),
                  Math.max(combined.max[2], current.max[2]),
                ],
              };
        } finally {
          disposeCompiledScene(compiled);
        }
      },
      undefined,
    );
    if (framingBounds === undefined)
      throw new Error('Temporal batch rendering produced no framing bounds.');

    const layout = temporalAtlasLayout(
      renderDocuments.map(({ frameId }) => frameId),
    );
    const clipGroups = bundle.clips.map((clip) => {
      const plan = bundle.framePlans.find(
        ({ clipId: candidateClipId }) => candidateClipId === clip.clipId,
      );
      if (plan === undefined)
        throw new Error(
          `Temporal batch clip ${clip.action} has no frame plan.`,
        );
      const items = renderDocuments.filter(
        ({ clipId }) => clipId === clip.clipId,
      );
      return {
        clip,
        plan,
        items,
        layout: temporalPoseSheetLayout(items),
      };
    });
    const batchDigest = await digestRigidAnimationValue({
      rig: bundle.rig,
      clips: bundle.clips,
      framePlans: bundle.framePlans,
    });
    const directory = this.#temporalBatchDirectory(
      document.id,
      revisionId,
      `batch.${batchDigest}`,
    );
    await this.#prepareDirectory(directory);

    const rendered = await this.#withPage(async (page) => {
      await page.evaluate(
        ({ width, height }) => {
          const atlas = globalThis.document.createElement('canvas');
          atlas.width = width;
          atlas.height = height;
          const context = atlas.getContext('2d');
          if (context === null)
            throw new Error('Temporal batch atlas canvas is unavailable.');
          context.clearRect(0, 0, width, height);
          Object.assign(window, { __forgeTemporalAtlas: atlas });
        },
        { width: layout.width, height: layout.height },
      );
      const frames: z.infer<typeof BrowserTemporalFrameSchema>[] = [];
      for (const [index, item] of renderDocuments.entries()) {
        const rect = layout.rects[index]!;
        const frame = await page.evaluate(
          async ({
            asset,
            activeRevisionId,
            direction,
            rect,
            framingBounds,
          }) => {
            const scopedWindow = window as unknown as {
              __forgeTemporalAtlas: HTMLCanvasElement;
              fantasyAssetForge: {
                loadDocument: (
                  value: AssetDocument,
                  referenceName?: undefined,
                  revisionId?: string,
                  framingBounds?: Bounds,
                ) => void;
                renderArtifacts: () => BrowserRenderArtifact;
              };
            };
            scopedWindow.fantasyAssetForge.loadDocument(
              asset,
              undefined,
              activeRevisionId,
              framingBounds,
            );
            const selected = scopedWindow.fantasyAssetForge
              .renderArtifacts()
              .frames.find((candidate) => candidate.direction === direction);
            if (selected === undefined)
              throw new Error(`Direction ${direction} was not rendered.`);
            const image = new Image();
            image.src = selected.dataUrl;
            await image.decode();
            const context = scopedWindow.__forgeTemporalAtlas.getContext('2d');
            if (context === null)
              throw new Error('Temporal batch atlas canvas is unavailable.');
            context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
            return selected;
          },
          {
            asset: item.document,
            activeRevisionId: revisionId,
            direction: item.direction,
            rect,
            framingBounds,
          },
        );
        frames.push(BrowserTemporalFrameSchema.parse(frame));
      }
      const images = await page.evaluate(
        (groups) => {
          const scopedWindow = window as unknown as {
            __forgeTemporalAtlas?: HTMLCanvasElement;
          };
          const atlas = scopedWindow.__forgeTemporalAtlas;
          if (atlas === undefined)
            throw new Error('Temporal batch atlas canvas was not initialized.');
          const poseSheets = groups.map((group) => {
            const canvas = globalThis.document.createElement('canvas');
            canvas.width = group.width;
            canvas.height = group.height;
            const context = canvas.getContext('2d');
            if (context === null)
              throw new Error('Temporal pose-sheet canvas is unavailable.');
            for (const mapping of group.mappings)
              context.drawImage(
                atlas,
                mapping.source.x,
                mapping.source.y,
                128,
                128,
                mapping.target.x,
                mapping.target.y,
                128,
                128,
              );
            return canvas.toDataURL('image/png');
          });
          const atlasDataUrl = atlas.toDataURL('image/png');
          delete scopedWindow.__forgeTemporalAtlas;
          return { atlasDataUrl, poseSheets };
        },
        clipGroups.map((group) => ({
          width: group.layout.width,
          height: group.layout.height,
          mappings: group.items.map((item, index) => ({
            source: layout.rects.find(
              ({ frameId }) => frameId === item.frameId,
            )!,
            target: group.layout.rects[index]!,
          })),
        })),
      );
      const sourceGlb = await page.evaluate(
        async ({ asset, activeRevisionId }) => {
          const forge = (
            window as unknown as {
              fantasyAssetForge: {
                loadDocument: (
                  value: AssetDocument,
                  referenceName?: undefined,
                  revisionId?: string,
                ) => void;
                exportGlb: () => Promise<{
                  bytes: ArrayBuffer;
                  manifest: unknown;
                }>;
              };
            }
          ).fantasyAssetForge;
          forge.loadDocument(asset, undefined, activeRevisionId);
          const result = await forge.exportGlb();
          return {
            bytes: Array.from(new Uint8Array(result.bytes)),
            manifest: result.manifest,
          };
        },
        { asset: document, activeRevisionId: revisionId },
      );
      return { frames, ...images, sourceGlb };
    });

    const frameRecords: BatchTemporalManifestInput['frames'] = [];
    for (const [index, frame] of rendered.frames.entries()) {
      const source = renderDocuments[index]!;
      const bytes = decodeDataUrl(frame.dataUrl, MAX_FRAME_BYTES);
      validateInterchangePng(bytes);
      const fileName = `${String(index).padStart(4, '0')}-${source.action}-${source.direction.toLowerCase()}-${source.sampleTimeMs}.png`;
      await writeImmutable(directory, resolve(directory, fileName), bytes);
      frameRecords.push({
        id: source.frameId,
        sequence: index,
        clipId: source.clipId,
        action: source.action,
        framePlanId: source.framePlanId,
        direction: source.direction,
        sampleTimeMs: source.sampleTimeMs,
        fileName,
        byteLength: bytes.byteLength,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        metrics: frame.metrics,
      });
    }

    const atlasBytes = decodeDataUrl(
      PngDataUrlSchema.parse(rendered.atlasDataUrl),
      MAX_CONTACT_SHEET_BYTES,
    );
    validateInterchangePng(atlasBytes, {
      width: layout.width,
      height: layout.height,
      maximumBytes: MAX_CONTACT_SHEET_BYTES,
    });
    const atlasFileName = 'atlas.png';
    await writeImmutable(
      directory,
      resolve(directory, atlasFileName),
      atlasBytes,
    );
    const atlasSha256 = createHash('sha256').update(atlasBytes).digest('hex');

    const poseSheets: BatchTemporalManifestInput['poseSheets'] = [];
    for (const [index, group] of clipGroups.entries()) {
      const bytes = decodeDataUrl(
        PngDataUrlSchema.parse(rendered.poseSheets[index]),
        MAX_CONTACT_SHEET_BYTES,
      );
      validateInterchangePng(bytes, {
        width: group.layout.width,
        height: group.layout.height,
        maximumBytes: MAX_CONTACT_SHEET_BYTES,
      });
      const fileName = `pose-sheet-${group.clip.action}.png`;
      await writeImmutable(directory, resolve(directory, fileName), bytes);
      const digest = createHash('sha256').update(bytes).digest('hex');
      poseSheets.push({
        id: `sheet.${digest}`,
        classification: 'derived' as const,
        role: 'pose_sheet' as const,
        mediaType: 'image/png' as const,
        fileName,
        byteLength: bytes.byteLength,
        sha256: digest,
        width: group.layout.width,
        height: group.layout.height,
        columns: group.layout.columns,
        rows: group.layout.rows,
        rects: group.layout.rects.map((rect) => ({ ...rect })),
      });
    }

    const exportedGlb = BrowserExportArtifactSchema.parse(rendered.sourceGlb);
    const sourceGlbBytes = Buffer.from(exportedGlb.bytes);
    await validateInterchangeGlb(sourceGlbBytes);
    const sourceGlbFileName = `${document.id}.glb`;
    await writeImmutable(
      directory,
      resolve(directory, sourceGlbFileName),
      sourceGlbBytes,
    );
    const sourceGlbSha256 = createHash('sha256')
      .update(sourceGlbBytes)
      .digest('hex');

    const bundleBytes = Buffer.from(
      canonicalRigidAnimationValue(bundle),
      'utf8',
    );
    const bundleFileName = 'animation-bundle.json';
    await writeImmutable(
      directory,
      resolve(directory, bundleFileName),
      bundleBytes,
    );
    const bundleSha256 = createHash('sha256').update(bundleBytes).digest('hex');
    const expectedSamples = [4, 6, 6, 6, 4] as const;
    const manifestWithoutIdentity = {
      contractId: 'forge-temporal-render-batch-artifacts/v1',
      authoringContractId: 'forge-reference-five-clip-authoring/v1',
      assetId: document.id,
      revisionId,
      morphologyRevisionId: bundle.rig.morphologyRevisionId,
      rigSignature: bundle.rig.rigSignature,
      equipmentSignature: bundle.rig.equipmentSignature,
      renderProfile: bundle.framePlans[0]!.renderProfile,
      sourceGlb: {
        id: `glb.${sourceGlbSha256}`,
        classification: 'source',
        mediaType: 'model/gltf-binary',
        fileName: sourceGlbFileName,
        byteLength: sourceGlbBytes.byteLength,
        sha256: sourceGlbSha256,
      },
      animationBundle: {
        id: `bundle.${bundleSha256}`,
        classification: 'source',
        mediaType: 'application/json',
        fileName: bundleFileName,
        byteLength: bundleBytes.byteLength,
        sha256: bundleSha256,
      },
      clips: clipGroups.map((group, index) => {
        return {
          clipId: group.clip.clipId,
          action: group.clip.action,
          framePlanId: group.plan.framePlanId,
          durationMs: group.clip.durationMs,
          loop: group.clip.loop,
          interpolation: group.clip.interpolation,
          directions: [
            ...new Set(group.items.map(({ direction: value }) => value)),
          ],
          samplesPerDirection: expectedSamples[index],
          frameIds: group.items.map(({ frameId }) => frameId),
          poseSheetId: poseSheets[index]!.id,
        };
      }),
      frames: frameRecords,
      poseSheets,
      atlas: {
        id: `atlas.${atlasSha256}`,
        classification: 'derived',
        role: 'sprite_atlas',
        mediaType: 'image/png',
        fileName: atlasFileName,
        byteLength: atlasBytes.byteLength,
        sha256: atlasSha256,
        width: layout.width,
        height: layout.height,
        columns: layout.columns,
        rows: layout.rows,
        rects: layout.rects,
      },
    };
    const deliveryId = `delivery.${await digestRigidAnimationValue(
      manifestWithoutIdentity,
    )}`;
    const manifest = ForgeTemporalRenderBatchArtifactsManifestSchema.parse({
      ...manifestWithoutIdentity,
      deliveryId,
    });
    const manifestBytes = Buffer.from(
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );
    await writeImmutable(
      directory,
      resolve(directory, 'temporal-manifest.json'),
      manifestBytes,
    );
    return {
      deliveryId,
      contractId: manifest.contractId,
      manifestSha256: createHash('sha256').update(manifestBytes).digest('hex'),
      sourceGlbSha256,
      animationBundleSha256: bundleSha256,
      atlasSha256,
      poseSheetSha256s: poseSheets.map(({ sha256 }) => sha256),
      frameSha256s: frameRecords.map(({ sha256 }) => sha256),
    };
  }

  async export(
    document: Readonly<AssetDocument>,
    revisionId: string,
  ): Promise<unknown> {
    const directory = this.#revisionDirectory(document.id, revisionId);
    await assertNoSymlinkPath(this.#workspaceRoot, directory);
    const received = await this.#withPage(async (page) =>
      page.evaluate(
        async ({ asset, activeRevisionId }) => {
          const forge = (
            window as unknown as {
              fantasyAssetForge: {
                loadDocument: (
                  value: AssetDocument,
                  referenceName?: undefined,
                  revisionId?: string,
                ) => void;
                exportGlb: () => Promise<{
                  bytes: ArrayBuffer;
                  manifest: unknown;
                }>;
              };
            }
          ).fantasyAssetForge;
          forge.loadDocument(asset, undefined, activeRevisionId);
          const result = await forge.exportGlb();
          return {
            bytes: Array.from(new Uint8Array(result.bytes)),
            manifest: result.manifest,
          };
        },
        { asset: document, activeRevisionId: revisionId },
      ),
    );
    const exported = BrowserExportArtifactSchema.parse(received);
    const glbBytes = Buffer.from(exported.bytes);
    await validateInterchangeGlb(glbBytes);
    await this.#prepareDirectory(directory);
    const glbPath = resolve(directory, `${document.id}.glb`);
    await writeImmutable(directory, glbPath, glbBytes);
    const manifestPath = resolve(directory, 'glb-manifest.json');
    await writeImmutable(
      directory,
      manifestPath,
      Buffer.from(
        `${JSON.stringify({ ...exported.manifest, assetId: document.id, revisionId, glbPath: basename(glbPath) }, null, 2)}\n`,
        'utf8',
      ),
    );
    await this.#interchange.register(document, revisionId);
    return { glbPath, manifestPath, manifest: exported.manifest };
  }

  async getManifest(request: {
    readonly assetId: string;
    readonly revisionId: string;
  }): Promise<unknown> {
    return this.#interchange.getManifest(request);
  }

  async getTemporalManifest(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
  }): Promise<unknown> {
    return (await this.#findTemporalManifest(request)).manifest;
  }

  async getTemporalArtifactChunk(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
    readonly artifactId: string;
    readonly offset: number;
    readonly length: number;
  }): Promise<unknown> {
    if (
      !Number.isInteger(request.offset) ||
      !Number.isInteger(request.length) ||
      request.offset < 0 ||
      request.length < 1 ||
      request.length > FORGE_INTERCHANGE_MAX_CHUNK_BYTES
    )
      throw new Error('Temporal artifact chunk range is invalid.');
    const { manifest, directory } = await this.#findTemporalManifest(request);
    const batchRecord =
      'poseSheets' in manifest
        ? (manifest.poseSheets.find(({ id }) => id === request.artifactId) ??
          (manifest.animationBundle.id === request.artifactId
            ? manifest.animationBundle
            : undefined))
        : undefined;
    const record =
      manifest.frames.find(({ id }) => id === request.artifactId) ??
      (manifest.atlas.id === request.artifactId
        ? manifest.atlas
        : manifest.sourceGlb.id === request.artifactId
          ? manifest.sourceGlb
          : batchRecord);
    if (record === undefined)
      throw new Error('Temporal artifact is not declared by this delivery.');
    if (request.offset + request.length > record.byteLength)
      throw new Error('Temporal artifact chunk exceeds the declared bytes.');
    const path = resolve(directory, record.fileName);
    if (!isInside(directory, path))
      throw new Error('Temporal artifact path escaped its delivery directory.');
    await assertNoSymlinkPath(directory, path);
    const bytes = await readFile(path);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (bytes.byteLength !== record.byteLength || sha256 !== record.sha256)
      throw new Error('Temporal artifact bytes do not match the manifest.');
    const chunk = bytes.subarray(
      request.offset,
      request.offset + request.length,
    );
    return ForgeInterchangeArtifactChunkSchema.parse({
      record_kind: 'artifact',
      asset_id: request.assetId,
      revision_id: request.revisionId,
      delivery_id: request.deliveryId,
      artifact_id: request.artifactId,
      artifact_sha256: record.sha256,
      chunk_sha256: createHash('sha256').update(chunk).digest('hex'),
      offset: request.offset,
      length: request.length,
      total: record.byteLength,
      bytes_base64: chunk.toString('base64'),
    });
  }

  async getArtifactChunk(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly artifactId: string;
    readonly recordKind?: 'artifact' | 'evidence';
    readonly offset: number;
    readonly length: number;
  }): Promise<unknown> {
    return this.#interchange.getArtifactChunk(request);
  }

  async getDeliveryManifest(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
  }): Promise<unknown> {
    const review = await this.#authoringReviews.findManifest(request);
    return review ?? this.getTemporalManifest(request);
  }

  async getDeliveryArtifactChunk(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
    readonly artifactId: string;
    readonly recordKind: 'artifact' | 'evidence';
    readonly offset: number;
    readonly length: number;
  }): Promise<unknown> {
    if ((await this.#authoringReviews.findManifest(request)) !== undefined) {
      if (request.recordKind !== 'evidence')
        throw new Error('Authoring review deliveries expose evidence only.');
      return this.#authoringReviews.getArtifactChunk(request);
    }
    if (request.recordKind !== 'artifact')
      throw new Error('Temporal deliveries expose artifacts only.');
    return this.getTemporalArtifactChunk(request);
  }

  async #withPage<Value>(
    callback: (page: Page) => Promise<Value>,
  ): Promise<Value> {
    if (this.#pageRunner !== undefined) return this.#pageRunner(callback);
    const browser = await chromium.launch({
      executablePath: this.#executablePath,
      headless: true,
    });
    try {
      const page = await browser.newPage({
        viewport: { width: 1400, height: 800 },
      });
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          await page.goto(this.#inspectorUrl, { waitUntil: 'networkidle' });
          break;
        } catch (error) {
          if (attempt === 1) throw error;
          await page.waitForTimeout(250);
        }
      }
      await page.waitForFunction(() => 'fantasyAssetForge' in window);
      return await callback(page);
    } finally {
      await browser.close();
    }
  }

  async #findTemporalManifest(request: {
    readonly assetId: string;
    readonly revisionId: string;
    readonly deliveryId: string;
  }): Promise<{
    readonly manifest: ForgeTemporalArtifactsManifest;
    readonly directory: string;
  }> {
    if (
      !/^[a-z][a-z0-9._-]*$/.test(request.assetId) ||
      !/^revision\.[a-f0-9]{64}$/.test(request.revisionId) ||
      !/^delivery\.[a-f0-9]{64}$/.test(request.deliveryId)
    )
      throw new Error('Invalid temporal delivery identity.');
    const root = resolve(
      this.#outputRoot,
      request.assetId,
      request.revisionId,
      'temporal',
    );
    if (!isInside(this.#outputRoot, root))
      throw new Error('Temporal registry path escaped the active workspace.');
    await assertNoSymlinkPath(this.#outputRoot, root);
    const temporalDirectories = (await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
      .sort((left, right) =>
        left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
      );
    if (temporalDirectories.length > 64)
      throw new Error('Temporal registry directory budget exceeded.');
    const matches: {
      manifest: ForgeTemporalArtifactsManifest;
      directory: string;
    }[] = [];
    const inspectManifest = async (directory: string): Promise<void> => {
      const manifestPath = resolve(directory, 'temporal-manifest.json');
      await assertNoSymlinkPath(root, manifestPath);
      if (!existsSync(manifestPath)) return;
      const bytes = await readFile(manifestPath);
      if (bytes.byteLength > 2 * 1024 * 1024)
        throw new Error('Temporal manifest exceeds its byte budget.');
      const manifest = ForgeTemporalArtifactsManifestSchema.parse(
        JSON.parse(bytes.toString('utf8')),
      );
      if (
        manifest.assetId === request.assetId &&
        manifest.revisionId === request.revisionId &&
        manifest.deliveryId === request.deliveryId
      )
        matches.push({ manifest, directory });
    };
    for (const clipDirectory of temporalDirectories) {
      if (/^batch\.[a-f0-9]{64}$/.test(clipDirectory.name)) {
        await inspectManifest(resolve(root, clipDirectory.name));
        continue;
      }
      if (!/^clip\.[a-f0-9]{64}$/.test(clipDirectory.name)) continue;
      const clipPath = resolve(root, clipDirectory.name);
      const planDirectories = (await readdir(clipPath, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
        .sort((left, right) =>
          left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
        );
      if (planDirectories.length > 64)
        throw new Error(
          'Temporal registry frame-plan directory budget exceeded.',
        );
      for (const planDirectory of planDirectories) {
        if (!/^frame-plan\.[a-f0-9]{64}$/.test(planDirectory.name)) continue;
        const directory = resolve(clipPath, planDirectory.name);
        await inspectManifest(directory);
      }
    }
    if (matches.length !== 1)
      throw new Error(
        matches.length === 0
          ? 'Temporal delivery was not found.'
          : 'Temporal delivery identity is duplicated.',
      );
    return matches[0]!;
  }

  async #prepareDirectory(directory: string): Promise<void> {
    await assertNoSymlinkPath(this.#workspaceRoot, directory);
    await mkdir(directory, { recursive: true });
    await assertNoSymlinkPath(this.#workspaceRoot, directory);
  }

  #revisionDirectory(assetId: string, revisionId: string): string {
    if (
      !/^[a-z][a-z0-9._-]*$/.test(assetId) ||
      !/^revision\.[a-f0-9]{64}$/.test(revisionId)
    )
      throw new Error('Invalid artifact identity.');
    const directory = resolve(this.#outputRoot, assetId, revisionId);
    if (!isInside(this.#outputRoot, directory))
      throw new Error('Artifact path escaped the active workspace.');
    return directory;
  }

  #temporalDirectory(
    assetId: string,
    revisionId: string,
    clipId: string,
    framePlanId: string,
  ): string {
    if (
      !/^[a-z][a-z0-9._-]*$/.test(assetId) ||
      !/^revision\.[a-f0-9]{64}$/.test(revisionId) ||
      !/^clip\.[a-f0-9]{64}$/.test(clipId) ||
      !/^frame-plan\.[a-f0-9]{64}$/.test(framePlanId)
    )
      throw new Error('Invalid temporal artifact identity.');
    const directory = resolve(
      this.#outputRoot,
      assetId,
      revisionId,
      'temporal',
      clipId,
      framePlanId,
    );
    if (!isInside(this.#outputRoot, directory))
      throw new Error('Temporal artifact path escaped the active workspace.');
    return directory;
  }

  #temporalBatchDirectory(
    assetId: string,
    revisionId: string,
    batchId: string,
  ): string {
    if (
      !/^[a-z][a-z0-9._-]*$/.test(assetId) ||
      !/^revision\.[a-f0-9]{64}$/.test(revisionId) ||
      !/^batch\.[a-f0-9]{64}$/.test(batchId)
    )
      throw new Error('Invalid temporal batch artifact identity.');
    const directory = resolve(
      this.#outputRoot,
      assetId,
      revisionId,
      'temporal',
      batchId,
    );
    if (!isInside(this.#outputRoot, directory))
      throw new Error(
        'Temporal batch artifact path escaped the active workspace.',
      );
    return directory;
  }
}
