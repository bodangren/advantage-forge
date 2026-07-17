import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

import type { AssetDocument } from '../contracts/index.js';
import {
  canonicalSerialize,
  contentRevisionId,
  deepFreeze,
  freezeDocument,
} from './canonical.js';
import { parseAssetDocumentJson } from './parse.js';

export interface RevisionRecord {
  readonly revisionId: string;
  readonly assetId: string;
  readonly parentRevisionId?: string;
  readonly createdAt: string;
  readonly document: Readonly<AssetDocument>;
}

export interface RevisionRepository {
  save(
    document: Readonly<AssetDocument>,
    expectedCurrentRevisionId?: string,
  ): Promise<RevisionRecord>;
  get(assetId: string, revisionId: string): Promise<RevisionRecord | undefined>;
  getCurrent(assetId: string): Promise<RevisionRecord | undefined>;
}

export interface FileRevisionRepositoryOptions {
  readonly workspaceRoot: string;
  readonly storageDirectory?: string;
  readonly now?: () => Date;
}

function inside(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

export class FileRevisionRepository implements RevisionRepository {
  readonly #workspaceRoot: string;
  readonly #storageRoot: string;
  readonly #now: () => Date;

  constructor(options: FileRevisionRepositoryOptions) {
    this.#workspaceRoot = resolve(options.workspaceRoot);
    this.#storageRoot = resolve(
      this.#workspaceRoot,
      options.storageDirectory ?? '.forge/revisions',
    );
    this.#now = options.now ?? (() => new Date());
    if (!inside(this.#workspaceRoot, this.#storageRoot))
      throw new Error(
        'Revision storage must remain inside the active workspace.',
      );
  }

  async save(
    document: Readonly<AssetDocument>,
    expectedCurrentRevisionId?: string,
  ): Promise<RevisionRecord> {
    const current = await this.getCurrent(document.id);
    if (
      expectedCurrentRevisionId !== undefined &&
      current?.revisionId !== expectedCurrentRevisionId
    )
      throw new Error('REVISION_CONFLICT');
    const revisionId = contentRevisionId(document);
    const record: RevisionRecord = {
      revisionId,
      assetId: document.id,
      ...(current ? { parentRevisionId: current.revisionId } : {}),
      createdAt: this.#now().toISOString(),
      document: freezeDocument(structuredClone(document)),
    };
    const revisionPath = this.#revisionPath(document.id, revisionId);
    await mkdir(dirname(revisionPath), { recursive: true });
    const canonicalDocument: unknown = JSON.parse(canonicalSerialize(document));
    try {
      await writeFile(
        revisionPath,
        `${JSON.stringify({ ...record, document: canonicalDocument }, null, 2)}\n`,
        { encoding: 'utf8', flag: 'wx' },
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    const currentPath = this.#currentPath(document.id);
    const temporaryPath = `${currentPath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, `${revisionId}\n`, 'utf8');
    await rename(temporaryPath, currentPath);
    return record;
  }

  async get(
    assetId: string,
    revisionId: string,
  ): Promise<RevisionRecord | undefined> {
    try {
      const stored = JSON.parse(
        await readFile(this.#revisionPath(assetId, revisionId), 'utf8'),
      ) as Record<string, unknown>;
      const parsed = parseAssetDocumentJson(JSON.stringify(stored['document']));
      if (!parsed.ok)
        throw new Error('Stored revision document failed validation.');
      return deepFreeze({
        revisionId: String(stored['revisionId']),
        assetId: String(stored['assetId']),
        ...(typeof stored['parentRevisionId'] === 'string'
          ? { parentRevisionId: stored['parentRevisionId'] }
          : {}),
        createdAt: String(stored['createdAt']),
        document: parsed.document,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
  }

  async getCurrent(assetId: string): Promise<RevisionRecord | undefined> {
    try {
      const revisionId = (
        await readFile(this.#currentPath(assetId), 'utf8')
      ).trim();
      return await this.get(assetId, revisionId);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
  }

  #assetDirectory(assetId: string): string {
    if (!/^[a-z][a-z0-9._-]*$/.test(assetId))
      throw new Error('INVALID_ASSET_ID');
    const directory = resolve(this.#storageRoot, assetId);
    if (!inside(this.#storageRoot, directory))
      throw new Error('Revision path escaped the active workspace.');
    return directory;
  }

  #revisionPath(assetId: string, revisionId: string): string {
    if (!/^revision\.[a-f0-9]{64}$/.test(revisionId))
      throw new Error('INVALID_REVISION_ID');
    return resolve(this.#assetDirectory(assetId), `${revisionId}.json`);
  }

  #currentPath(assetId: string): string {
    return resolve(this.#assetDirectory(assetId), 'current');
  }
}
