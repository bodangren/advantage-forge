import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { AssetDocument } from '../contracts/index.js';
import type { ExportService, RenderService } from '../tools/index.js';

interface BrowserArtifactServiceOptions {
  readonly workspaceRoot: string;
  readonly inspectorUrl?: string;
  readonly outputDirectory?: string;
  readonly executablePath?: string;
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

  constructor(options: BrowserArtifactServiceOptions) {
    this.#workspaceRoot = resolve(options.workspaceRoot);
    this.#outputRoot = resolve(
      this.#workspaceRoot,
      options.outputDirectory ?? 'artifacts/reference',
    );
    this.#inspectorUrl = options.inspectorUrl ?? 'http://127.0.0.1:4173';
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
    await mkdir(directory, { recursive: true });
    const artifacts = await this.#withPage(async (page) =>
      page.evaluate((asset) => {
        const forge = (
          window as unknown as {
            fantasyAssetForge: {
              loadDocument: (value: AssetDocument) => void;
              renderArtifacts: () => BrowserRenderArtifact;
            };
          }
        ).fantasyAssetForge;
        forge.loadDocument(asset);
        return forge.renderArtifacts();
      }, document),
    );
    const frames: { direction: string; path: string; metrics: unknown }[] = [];
    for (const frame of artifacts.frames) {
      const path = resolve(directory, `${frame.direction.toLowerCase()}.png`);
      await writeFile(path, decodeDataUrl(frame.dataUrl));
      frames.push({ direction: frame.direction, path, metrics: frame.metrics });
    }
    const contactSheetPath = resolve(directory, 'contact-sheet.png');
    await writeFile(
      contactSheetPath,
      decodeDataUrl(artifacts.contactSheetDataUrl),
    );
    const manifest = {
      assetId: document.id,
      revisionId,
      profile: 'fantasy.sprite.orthographic.v1',
      width: 128,
      height: 128,
      transparent: true,
      frames,
      contactSheetPath,
    };
    const manifestPath = resolve(directory, 'render-manifest.json');
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
    await mkdir(directory, { recursive: true });
    const exported = await this.#withPage(async (page) =>
      page.evaluate(async (asset) => {
        const forge = (
          window as unknown as {
            fantasyAssetForge: {
              loadDocument: (value: AssetDocument) => void;
              exportGlb: () => Promise<{
                bytes: ArrayBuffer;
                manifest: unknown;
              }>;
            };
          }
        ).fantasyAssetForge;
        forge.loadDocument(asset);
        const result = await forge.exportGlb();
        return {
          bytes: Array.from(new Uint8Array(result.bytes)),
          manifest: result.manifest,
        };
      }, document),
    );
    const glbPath = resolve(directory, `${document.id}.glb`);
    await writeFile(glbPath, Buffer.from(exported.bytes));
    const manifestPath = resolve(directory, 'glb-manifest.json');
    await writeFile(
      manifestPath,
      `${JSON.stringify({ assetId: document.id, revisionId, glbPath, ...(exported.manifest as object) }, null, 2)}\n`,
      'utf8',
    );
    return { glbPath, manifestPath, manifest: exported.manifest };
  }

  async #withPage<Value>(
    callback: (page: Page) => Promise<Value>,
  ): Promise<Value> {
    const browser = await chromium.launch({
      executablePath: this.#executablePath,
      headless: true,
    });
    try {
      const page = await browser.newPage({
        viewport: { width: 1400, height: 800 },
      });
      await page.goto(this.#inspectorUrl, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => 'fantasyAssetForge' in window);
      return await callback(page);
    } finally {
      await browser.close();
    }
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
