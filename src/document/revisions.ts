import { existsSync, realpathSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  readFile,
  rename,
  rmdir,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';

import { AssetDocumentSchema, type AssetDocument } from '../contracts/index.js';
import { canonicalSerialize, deepFreeze, freezeDocument } from './canonical.js';
import { contentRevisionId } from './revision-id.js';
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

export interface RevisionSaveOptions {
  readonly requireAbsent?: true;
}

export interface RevisionRepository {
  save(
    document: Readonly<AssetDocument>,
    expectedCurrentRevisionId?: string,
    options?: RevisionSaveOptions,
  ): Promise<RevisionRecord>;
  get(assetId: string, revisionId: string): Promise<RevisionRecord | undefined>;
  getCurrent(assetId: string): Promise<RevisionRecord | undefined>;
  restoreCurrent?(
    assetId: string,
    targetRevisionId: string,
    expectedCurrentRevisionId: string,
  ): Promise<RevisionRecord>;
}

export interface FileRevisionRepositoryOptions {
  readonly workspaceRoot: string;
  readonly storageDirectory?: string;
  readonly now?: () => Date;
  readonly lockTimeoutMilliseconds?: number;
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

const LOCK_RETRY_MILLISECONDS = 10;
const LOCK_TIMEOUT_MILLISECONDS = 10_000;
const LOCK_OWNER_INITIALIZATION_GRACE_MILLISECONDS = 5_000;

export class FileRevisionRepository implements RevisionRepository {
  readonly #workspaceRoot: string;
  readonly #storageRoot: string;
  readonly #now: () => Date;
  readonly #lockTimeoutMilliseconds: number;

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
    this.#lockTimeoutMilliseconds =
      options.lockTimeoutMilliseconds ?? LOCK_TIMEOUT_MILLISECONDS;
    if (
      !Number.isFinite(this.#lockTimeoutMilliseconds) ||
      this.#lockTimeoutMilliseconds < 1
    )
      throw new Error('Revision lock timeout must be a positive number.');
    if (!inside(this.#workspaceRoot, this.#storageRoot))
      throw new Error(
        'Revision storage must remain inside the active workspace.',
      );
  }

  async save(
    document: Readonly<AssetDocument>,
    expectedCurrentRevisionId?: string,
    options: RevisionSaveOptions = {},
  ): Promise<RevisionRecord> {
    if (options.requireAbsent && expectedCurrentRevisionId !== undefined)
      throw new Error('INVALID_CREATE_PRECONDITION');
    return this.#withAssetLock(document.id, async () => {
      const assetDirectory = this.#assetDirectory(document.id);
      let reservedNewIdentity = false;
      if (options.requireAbsent)
        try {
          await mkdir(assetDirectory);
          reservedNewIdentity = true;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'EEXIST')
            throw new Error('ALREADY_EXISTS', { cause: error });
          throw error;
        }
      const current = reservedNewIdentity
        ? undefined
        : await this.getCurrent(document.id);
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
      if (!reservedNewIdentity)
        await mkdir(dirname(revisionPath), { recursive: true });
      await assertNoSymlinkPath(this.#workspaceRoot, dirname(revisionPath));
      const canonicalDocument: unknown = JSON.parse(
        canonicalSerialize(document),
      );
      let storedRecord = record;
      try {
        await writeFile(
          revisionPath,
          `${JSON.stringify({ ...record, document: canonicalDocument }, null, 2)}\n`,
          { encoding: 'utf8', flag: 'wx' },
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        const existing = await this.get(document.id, revisionId);
        if (existing === undefined)
          throw new Error('Existing revision could not be loaded.', {
            cause: error,
          });
        storedRecord = existing;
      }
      await this.#writeCurrentPointer(document.id, revisionId);
      return storedRecord;
    });
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

  async restoreCurrent(
    assetId: string,
    targetRevisionId: string,
    expectedCurrentRevisionId: string,
  ): Promise<RevisionRecord> {
    return this.#withAssetLock(assetId, async () => {
      const current = await this.getCurrent(assetId);
      if (current?.revisionId !== expectedCurrentRevisionId)
        throw new Error('REVISION_CONFLICT');
      if (targetRevisionId === expectedCurrentRevisionId)
        throw new Error('NO_OP_RESTORE');
      const target = await this.get(assetId, targetRevisionId);
      if (target === undefined) throw new Error('NOT_FOUND');
      await this.#writeCurrentPointer(assetId, targetRevisionId);
      return target;
    });
  }

  async #withAssetLock<Value>(
    assetId: string,
    operation: () => Promise<Value>,
  ): Promise<Value> {
    this.#assetDirectory(assetId);
    await assertNoSymlinkPath(this.#workspaceRoot, this.#storageRoot);
    await mkdir(this.#storageRoot, { recursive: true });
    await assertNoSymlinkPath(this.#workspaceRoot, this.#storageRoot);
    const lockRoot = resolve(this.#storageRoot, '.locks');
    if (!inside(this.#storageRoot, lockRoot))
      throw new Error('Revision lock path escaped revision storage.');
    await mkdir(lockRoot, { recursive: true });
    await assertNoSymlinkPath(this.#workspaceRoot, lockRoot);
    const lockPath = resolve(lockRoot, `${assetId}.lock`);
    if (!inside(lockRoot, lockPath))
      throw new Error('Revision lock path escaped lock storage.');
    const startedAt = Date.now();
    const token = randomUUID();
    const ownerPath = join(lockPath, 'owner.json');
    while (true)
      try {
        await mkdir(lockPath);
        try {
          await writeFile(
            ownerPath,
            `${JSON.stringify({ pid: process.pid, token, acquiredAt: new Date().toISOString() })}\n`,
            { encoding: 'utf8', flag: 'wx' },
          );
        } catch (error) {
          await rmdir(lockPath);
          throw error;
        }
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        if (await this.#recoverStaleLock(lockPath)) continue;
        if (Date.now() - startedAt >= this.#lockTimeoutMilliseconds)
          throw new Error('REVISION_LOCK_TIMEOUT', { cause: error });
        await delay(LOCK_RETRY_MILLISECONDS);
      }
    const outcome = await operation().then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    await this.#assertLockDirectory(lockPath);
    await this.#assertRegularLockOwner(ownerPath);
    const owner = JSON.parse(await readFile(ownerPath, 'utf8')) as unknown;
    if (
      owner === null ||
      typeof owner !== 'object' ||
      !('token' in owner) ||
      owner.token !== token
    )
      throw new Error('REVISION_LOCK_OWNERSHIP_LOST');
    await unlink(ownerPath);
    await rmdir(lockPath);
    if (!outcome.ok) throw outcome.error;
    return outcome.value;
  }

  async #recoverStaleLock(lockPath: string): Promise<boolean> {
    try {
      await this.#assertLockDirectory(lockPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true;
      throw error;
    }
    const ownerPath = join(lockPath, 'owner.json');
    let stale: boolean;
    try {
      await this.#assertRegularLockOwner(ownerPath);
      const value = JSON.parse(await readFile(ownerPath, 'utf8')) as unknown;
      if (
        value !== null &&
        typeof value === 'object' &&
        'pid' in value &&
        typeof value.pid === 'number' &&
        Number.isSafeInteger(value.pid) &&
        value.pid > 0
      )
        stale = !this.#processIsAlive(value.pid);
      else stale = await this.#ownerlessLockIsRecoverable(lockPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        stale = await this.#ownerlessLockIsRecoverable(lockPath);
      else if (error instanceof SyntaxError)
        stale = await this.#ownerlessLockIsRecoverable(lockPath);
      else throw error;
    }
    if (!stale) return false;
    const quarantinePath = `${lockPath}.stale.${randomUUID()}`;
    try {
      await rename(lockPath, quarantinePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true;
      throw error;
    }
    await this.#assertLockDirectory(quarantinePath);
    const quarantineOwnerPath = join(quarantinePath, 'owner.json');
    try {
      await this.#assertRegularLockOwner(quarantineOwnerPath);
      await unlink(quarantineOwnerPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    await rmdir(quarantinePath);
    return true;
  }

  async #assertLockDirectory(lockPath: string): Promise<void> {
    const metadata = await lstat(lockPath);
    if (metadata.isSymbolicLink() || !metadata.isDirectory())
      throw new Error('REVISION_LOCK_PATH_INVALID');
  }

  async #assertRegularLockOwner(ownerPath: string): Promise<void> {
    const metadata = await lstat(ownerPath);
    if (metadata.isSymbolicLink() || !metadata.isFile())
      throw new Error('REVISION_LOCK_OWNER_INVALID');
  }

  async #ownerlessLockIsRecoverable(lockPath: string): Promise<boolean> {
    try {
      return (
        Date.now() - (await stat(lockPath)).mtimeMs >=
        LOCK_OWNER_INITIALIZATION_GRACE_MILLISECONDS
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true;
      throw error;
    }
  }

  #processIsAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return (error as NodeJS.ErrnoException).code !== 'ESRCH';
    }
  }

  async #writeCurrentPointer(
    assetId: string,
    revisionId: string,
  ): Promise<void> {
    const currentPath = this.#currentPath(assetId);
    await assertNoSymlinkPath(this.#workspaceRoot, currentPath);
    const temporaryPath = `${currentPath}.${process.pid}.${randomUUID()}.tmp`;
    await assertNoSymlinkPath(this.#workspaceRoot, temporaryPath);
    const outcome = await (async () => {
      await writeFile(temporaryPath, `${revisionId}\n`, {
        encoding: 'utf8',
        flag: 'wx',
      });
      await rename(temporaryPath, currentPath);
    })().then(
      () => ({ ok: true as const }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    try {
      await unlink(temporaryPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (!outcome.ok) throw outcome.error;
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
