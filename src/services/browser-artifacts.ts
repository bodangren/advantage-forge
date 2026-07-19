import { existsSync, realpathSync } from 'node:fs';
import { lstat, mkdir, writeFile } from 'node:fs/promises';
import { basename, join, relative, resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { AssetDocument } from '../contracts/index.js';
import type { ExportService, RenderService } from '../tools/index.js';

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
interface BrowserRenderArtifact {
  readonly frames: readonly {
    readonly direction: string;
    readonly dataUrl: string;
    readonly metrics: unknown;
  }[];
  readonly contactSheetDataUrl: string;
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

function assertLoopbackInspectorUrl(value: string): void {
  const url = new URL(value);
  const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);
  if (url.protocol !== 'http:' || !loopbackHosts.has(url.hostname))
    throw new Error('Inspector URL must use HTTP on a loopback host.');
  if (url.username !== '' || url.password !== '')
    throw new Error('Inspector URL must not contain credentials.');
}

function decodeDataUrl(dataUrl: string): Buffer {
  const marker = 'base64,';
  const index = dataUrl.indexOf(marker);
  if (index < 0) throw new Error('Expected a base64 PNG data URL.');
  return Buffer.from(dataUrl.slice(index + marker.length), 'base64');
}

export class LocalBrowserArtifactService
  implements RenderService, ExportService
{
  readonly #workspaceRoot: string;
  readonly #outputRoot: string;
  readonly #inspectorUrl: string;
  readonly #executablePath: string;
  readonly #pageRunner: PageRunner | undefined;

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
    this.#executablePath =
      options.executablePath ?? '/opt/google/chrome/chrome';
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
    await this.#prepareDirectory(directory);
    const artifacts = await this.#withPage(async (page) =>
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
    const frames: { direction: string; path: string; metrics: unknown }[] = [];
    for (const frame of artifacts.frames) {
      const path = resolve(directory, `${frame.direction.toLowerCase()}.png`);
      await assertNoSymlinkPath(this.#workspaceRoot, path);
      await writeFile(path, decodeDataUrl(frame.dataUrl));
      frames.push({ direction: frame.direction, path, metrics: frame.metrics });
    }
    const contactSheetPath = resolve(directory, 'contact-sheet.png');
    await assertNoSymlinkPath(this.#workspaceRoot, contactSheetPath);
    await writeFile(
      contactSheetPath,
      decodeDataUrl(artifacts.contactSheetDataUrl),
    );
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
    await assertNoSymlinkPath(this.#workspaceRoot, manifestPath);
    await writeFile(
      manifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );
    return { manifestPath, contactSheetPath, frames };
  }

  async export(
    document: Readonly<AssetDocument>,
    revisionId: string,
  ): Promise<unknown> {
    const directory = this.#revisionDirectory(document.id, revisionId);
    await this.#prepareDirectory(directory);
    const exported = await this.#withPage(async (page) =>
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
    const glbPath = resolve(directory, `${document.id}.glb`);
    await assertNoSymlinkPath(this.#workspaceRoot, glbPath);
    await writeFile(glbPath, Buffer.from(exported.bytes));
    const manifestPath = resolve(directory, 'glb-manifest.json');
    await assertNoSymlinkPath(this.#workspaceRoot, manifestPath);
    await writeFile(
      manifestPath,
      `${JSON.stringify({ assetId: document.id, revisionId, glbPath: basename(glbPath), ...(exported.manifest as object) }, null, 2)}\n`,
      'utf8',
    );
    return { glbPath, manifestPath, manifest: exported.manifest };
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
}
