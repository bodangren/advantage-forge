import { existsSync, realpathSync } from 'node:fs';
import { lstat, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { z } from 'zod';

import { AssetDocumentSchema, type AssetDocument } from '../contracts/index.js';
import {
  canonicalSerialize,
  contentRevisionId,
  deepFreeze,
  freezeDocument,
} from './canonical.js';
import { parseAssetDocumentJson } from './parse.js';

export const RevisionRecordSchema = z
  .object({
    revisionId: z.string().regex(/^revision\.[a-f0-9]{64}$/),
    assetId: z.string().regex(/^[a-z][a-z0-9._-]*$/),
    parentRevisionId: z
      .string()
      .regex(/^revision\.[a-f0-9]{64}$/)
      .optional(),
    createdAt: z.iso.datetime(),
    document: AssetDocumentSchema,
  })
  .strict();
export type RevisionRecord = z.infer<typeof RevisionRecordSchema>;

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

async function assertNoSymlinkPath(
  root: string,
  candidate: string,
): Promise<void> {
  const relativePath = relative(root, candidate);
  if (
    relativePath.startsWith('..') ||
    resolve(root, relativePath) !== candidate
  )
    throw new Error('Revision path escaped the active workspace.');
  let cursor = root;
  for (const segment of relativePath.split(sep).filter(Boolean)) {
    cursor = join(cursor, segment);
    try {
      if ((await lstat(cursor)).isSymbolicLink())
        throw new Error('Revision storage cannot traverse symbolic links.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
  }
}

export class FileRevisionRepository implements RevisionRepository {
  readonly #workspaceRoot: string;
  readonly #storageRoot: string;
  readonly #now: () => Date;

  constructor(options: FileRevisionRepositoryOptions) {
    const resolvedWorkspaceRoot = resolve(options.workspaceRoot);
    this.#workspaceRoot = existsSync(resolvedWorkspaceRoot)
      ? realpathSync(resolvedWorkspaceRoot)
      : resolvedWorkspaceRoot;
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
    await assertNoSymlinkPath(this.#workspaceRoot, dirname(revisionPath));
    await mkdir(dirname(revisionPath), { recursive: true });
    await assertNoSymlinkPath(this.#workspaceRoot, dirname(revisionPath));
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
    await assertNoSymlinkPath(this.#workspaceRoot, currentPath);
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
      const revisionPath = this.#revisionPath(assetId, revisionId);
      await assertNoSymlinkPath(this.#workspaceRoot, revisionPath);
      const stored = JSON.parse(
        await readFile(revisionPath, 'utf8'),
      ) as unknown;
      const metadata = RevisionRecordSchema.safeParse(stored);
      if (!metadata.success)
        throw new Error('Stored revision metadata failed validation.');
      if (
        metadata.data.assetId !== assetId ||
        metadata.data.revisionId !== revisionId
      )
        throw new Error('Stored revision identity failed validation.');
      const parsed = parseAssetDocumentJson(
        JSON.stringify(metadata.data.document),
      );
      if (!parsed.ok)
        throw new Error('Stored revision document failed validation.');
      if (contentRevisionId(parsed.document) !== revisionId)
        throw new Error('Stored revision content hash failed validation.');
      return deepFreeze({
        revisionId: metadata.data.revisionId,
        assetId: metadata.data.assetId,
        ...(metadata.data.parentRevisionId !== undefined
          ? { parentRevisionId: metadata.data.parentRevisionId }
          : {}),
        createdAt: metadata.data.createdAt,
        document: parsed.document,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
  }

  async getCurrent(assetId: string): Promise<RevisionRecord | undefined> {
    try {
      const currentPath = this.#currentPath(assetId);
      await assertNoSymlinkPath(this.#workspaceRoot, currentPath);
      const revisionId = (await readFile(currentPath, 'utf8')).trim();
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
