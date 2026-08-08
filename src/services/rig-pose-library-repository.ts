import { createHash, randomUUID } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import {
  lstat,
  link,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rmdir,
  unlink,
} from 'node:fs/promises';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';

import {
  ForgeDomainError,
  PoseLibrarySchema,
  RigidRigProfileV2Schema,
  parseDomainValue,
  validatePoseLibraryAgainstRig,
  verifyPoseLibraryIdentity,
  verifyRigidRigProfileV2Identity,
  type PoseLibrary,
  type RigidRigProfileV2,
} from '../contracts/index.js';
import { deepFreeze } from '../document/index.js';

const StreamIdSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);
const RigIdSchema = z.string().regex(/^rig-v2\.[a-f0-9]{64}$/);
const LibraryIdSchema = z.string().regex(/^pose-library\.[a-f0-9]{64}$/);
const RecordDigestSchema = z.string().regex(/^[a-f0-9]{64}$/);
const KindSchema = z.enum(['rig', 'pose-library']);

export type RigPoseLibraryRepositoryErrorCode =
  | 'IDENTITY_MISMATCH'
  | 'BINDING_MISMATCH'
  | 'STALE_REVISION'
  | 'REVISION_NOT_FOUND'
  | 'INVALID_CURSOR'
  | 'INVALID_PAGE_LIMIT'
  | 'STORAGE_FAILURE';

export class RigPoseLibraryRepositoryError extends ForgeDomainError<RigPoseLibraryRepositoryErrorCode> {
  constructor(
    code: RigPoseLibraryRepositoryErrorCode,
    path: readonly (string | number)[],
    message: string,
    options?: ErrorOptions,
  ) {
    super(code, path, message, options);
    this.name = 'RigPoseLibraryRepositoryError';
  }
}

function repositoryError(
  code: RigPoseLibraryRepositoryErrorCode,
  path: readonly (string | number)[],
  message: string,
  cause?: unknown,
) {
  return new RigPoseLibraryRepositoryError(code, path, message, {
    ...(cause === undefined ? {} : { cause }),
  });
}

function storageBoundaryError(
  error: unknown,
  path: readonly (string | number)[],
  message: string,
): ForgeDomainError<string> {
  if (error instanceof ForgeDomainError)
    return error as ForgeDomainError<string>;
  return repositoryError('STORAGE_FAILURE', path, message, error);
}

function retainCleanupFailures(
  primary: ForgeDomainError<string> | undefined,
  failures: readonly unknown[],
  path: readonly (string | number)[],
  message: string,
): ForgeDomainError<string> | undefined {
  if (failures.length === 0) return primary;
  const retained =
    primary ?? repositoryError('STORAGE_FAILURE', path, message, failures[0]);
  for (const failure of primary === undefined ? failures.slice(1) : failures)
    retained.retainSuppressed(failure);
  return retained;
}

const RigRecordSchema = z.strictObject({
  kind: z.literal('rig'),
  streamId: StreamIdSchema,
  contentId: RigIdSchema,
  parentContentId: RigIdSchema.optional(),
  createdAt: z.iso.datetime(),
  value: RigidRigProfileV2Schema,
  recordDigest: RecordDigestSchema,
});
const PoseLibraryRecordSchema = z.strictObject({
  kind: z.literal('pose-library'),
  streamId: StreamIdSchema,
  contentId: LibraryIdSchema,
  parentContentId: LibraryIdSchema.optional(),
  createdAt: z.iso.datetime(),
  value: PoseLibrarySchema,
  recordDigest: RecordDigestSchema,
});

export type RigPersistenceRecord = z.infer<typeof RigRecordSchema>;
export type PoseLibraryPersistenceRecord = z.infer<
  typeof PoseLibraryRecordSchema
>;

export interface PersistenceListOptions {
  readonly limit?: number;
  readonly cursor?: string;
}

export interface PersistencePage<RecordValue> {
  readonly records: readonly RecordValue[];
  readonly nextCursor?: string;
}

export interface RigPoseLibraryRepository {
  saveRig(
    streamId: string,
    value: RigidRigProfileV2,
    expectedCurrentId: string | null,
  ): Promise<RigPersistenceRecord>;
  savePoseLibrary(
    streamId: string,
    value: PoseLibrary,
    expectedCurrentId: string | null,
  ): Promise<PoseLibraryPersistenceRecord>;
  getRig(
    streamId: string,
    contentId: string,
  ): Promise<RigPersistenceRecord | undefined>;
  getPoseLibrary(
    streamId: string,
    contentId: string,
  ): Promise<PoseLibraryPersistenceRecord | undefined>;
  getCurrentRig(streamId: string): Promise<RigPersistenceRecord | undefined>;
  getCurrentPoseLibrary(
    streamId: string,
  ): Promise<PoseLibraryPersistenceRecord | undefined>;
  selectCurrentRig(
    streamId: string,
    contentId: string,
    expectedCurrentId: string | null,
  ): Promise<RigPersistenceRecord>;
  selectCurrentPoseLibrary(
    streamId: string,
    contentId: string,
    expectedCurrentId: string | null,
  ): Promise<PoseLibraryPersistenceRecord>;
  listRigs(
    streamId: string,
    options?: PersistenceListOptions,
  ): Promise<PersistencePage<RigPersistenceRecord>>;
  listPoseLibraries(
    streamId: string,
    options?: PersistenceListOptions,
  ): Promise<PersistencePage<PoseLibraryPersistenceRecord>>;
}

const cursorPayloadSchema = z.strictObject({
  version: z.literal(1),
  kind: KindSchema,
  streamId: StreamIdSchema,
  afterContentId: z.string().min(1).max(96),
  snapshotDigest: z.string().regex(/^[a-f0-9]{64}$/),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
});

const MAX_CURSOR_LENGTH = 1_024;

/**
 * Cursor checksums detect accidental corruption only. They are unkeyed and do
 * not authenticate a cursor against a malicious caller.
 */
export const PERSISTENCE_CURSOR_INTEGRITY_NOTICE =
  'Cursor checksums are non-security corruption detectors, not authentication.' as const;

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function cursorChecksum(
  payload: Omit<z.infer<typeof cursorPayloadSchema>, 'checksum'>,
) {
  return digest(`forge-rig-pose-cursor/v1\0${JSON.stringify(payload)}`);
}

function encodeCursor(
  kind: 'rig' | 'pose-library',
  streamId: string,
  afterContentId: string,
  snapshotDigest: string,
): string {
  const payload = {
    version: 1 as const,
    kind,
    streamId,
    afterContentId,
    snapshotDigest,
  };
  return Buffer.from(
    JSON.stringify({ ...payload, checksum: cursorChecksum(payload) }),
  ).toString('base64url');
}

function decodeCursor(
  cursor: string,
  kind: 'rig' | 'pose-library',
  streamId: string,
  snapshotDigest: string,
): string {
  try {
    if (
      cursor.length < 1 ||
      cursor.length > MAX_CURSOR_LENGTH ||
      !/^[A-Za-z0-9_-]+$/.test(cursor)
    )
      throw repositoryError('INVALID_CURSOR', ['cursor'], 'INVALID_CURSOR');
    const decoded = Buffer.from(cursor, 'base64url');
    if (decoded.toString('base64url') !== cursor)
      throw repositoryError('INVALID_CURSOR', ['cursor'], 'INVALID_CURSOR');
    const parsed = parseDomainValue(
      cursorPayloadSchema,
      JSON.parse(decoded.toString('utf8')),
      ['cursor'],
    );
    const { checksum, ...payload } = parsed;
    if (
      parsed.kind !== kind ||
      parsed.streamId !== streamId ||
      parsed.snapshotDigest !== snapshotDigest ||
      checksum !== cursorChecksum(payload)
    )
      throw repositoryError('INVALID_CURSOR', ['cursor'], 'INVALID_CURSOR');
    const parsedContentId =
      kind === 'rig'
        ? RigIdSchema.safeParse(parsed.afterContentId)
        : LibraryIdSchema.safeParse(parsed.afterContentId);
    if (!parsedContentId.success)
      throw repositoryError('INVALID_CURSOR', ['cursor'], 'INVALID_CURSOR');
    return parsed.afterContentId;
  } catch (error) {
    if (
      error instanceof RigPoseLibraryRepositoryError &&
      error.code === 'INVALID_CURSOR'
    )
      throw error;
    throw repositoryError(
      'INVALID_CURSOR',
      ['cursor'],
      'INVALID_CURSOR',
      error,
    );
  }
}

function listPage<RecordValue extends { readonly contentId: string }>(
  kind: 'rig' | 'pose-library',
  streamId: string,
  records: readonly RecordValue[],
  options: PersistenceListOptions = {},
): PersistencePage<RecordValue> {
  const limit = options.limit ?? 50;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    throw repositoryError(
      'INVALID_PAGE_LIMIT',
      ['pagination', 'limit'],
      'INVALID_PAGE_LIMIT',
    );
  const sorted = [...records].sort((left, right) =>
    left.contentId.localeCompare(right.contentId),
  );
  const snapshotDigest = digest(
    sorted.map(({ contentId }) => contentId).join('\n'),
  );
  const after =
    options.cursor === undefined
      ? undefined
      : decodeCursor(options.cursor, kind, streamId, snapshotDigest);
  const start =
    after === undefined
      ? 0
      : sorted.findIndex(({ contentId }) => contentId === after) + 1;
  if (after !== undefined && start === 0)
    throw repositoryError('INVALID_CURSOR', ['cursor'], 'INVALID_CURSOR');
  const page = sorted.slice(start, start + limit);
  const hasMore = start + page.length < sorted.length;
  return {
    records: page,
    ...(hasMore
      ? {
          nextCursor: encodeCursor(
            kind,
            streamId,
            page.at(-1)!.contentId,
            snapshotDigest,
          ),
        }
      : {}),
  };
}

function assertStreamId(streamId: string): string {
  return parseDomainValue(StreamIdSchema, streamId, ['streamId']);
}

export class MemoryRigPoseLibraryRepository implements RigPoseLibraryRepository {
  readonly #rigs = new Map<string, Map<string, RigPersistenceRecord>>();
  readonly #poseLibraries = new Map<
    string,
    Map<string, PoseLibraryPersistenceRecord>
  >();
  readonly #currentRigs = new Map<string, string>();
  readonly #currentPoseLibraries = new Map<string, string>();
  readonly #now: () => Date;

  constructor(now: () => Date = () => new Date()) {
    this.#now = now;
  }

  async saveRig(
    streamId: string,
    value: RigidRigProfileV2,
    expectedCurrentId: string | null,
  ): Promise<RigPersistenceRecord> {
    const stream = assertStreamId(streamId);
    if (!(await verifyRigIdentity(value)))
      throw repositoryError(
        'IDENTITY_MISMATCH',
        ['rig', 'profileId'],
        'IDENTITY_MISMATCH',
      );
    const parsed = parseDomainValue(RigidRigProfileV2Schema, value, ['rig']);
    const records =
      this.#rigs.get(stream) ?? new Map<string, RigPersistenceRecord>();
    const currentId = this.#currentRigs.get(stream);
    assertExpectedCurrent(currentId, expectedCurrentId);
    const existing = records.get(parsed.profileId);
    if (existing !== undefined) return existing;
    const recordPayload = {
      kind: 'rig' as const,
      streamId: stream,
      contentId: parsed.profileId,
      ...(currentId === undefined ? {} : { parentContentId: currentId }),
      createdAt: this.#now().toISOString(),
      value: structuredClone(parsed),
    };
    const record = deepFreeze({
      ...recordPayload,
      recordDigest: digest(JSON.stringify(recordPayload)),
    });
    records.set(record.contentId, record);
    this.#rigs.set(stream, records);
    this.#currentRigs.set(stream, record.contentId);
    return record;
  }

  async savePoseLibrary(
    streamId: string,
    value: PoseLibrary,
    expectedCurrentId: string | null,
  ): Promise<PoseLibraryPersistenceRecord> {
    const stream = assertStreamId(streamId);
    if (!(await verifyLibraryIdentity(value)))
      throw repositoryError(
        'IDENTITY_MISMATCH',
        ['poseLibrary', 'libraryId'],
        'IDENTITY_MISMATCH',
      );
    const parsed = parseDomainValue(PoseLibrarySchema, value, ['poseLibrary']);
    const referencedRig = this.#rigs
      .get(stream)
      ?.get(parsed.binding.rigProfileId);
    if (referencedRig === undefined)
      throw repositoryError(
        'BINDING_MISMATCH',
        ['poseLibrary', 'binding', 'rigProfileId'],
        'REFERENCED_RIG_NOT_FOUND',
      );
    if (!(await verifyRigIdentity(referencedRig.value)))
      throw repositoryError(
        'STORAGE_FAILURE',
        ['rig', referencedRig.contentId],
        'CORRUPT_REFERENCED_RIG',
      );
    await validatePoseLibraryAgainstRig(parsed, referencedRig.value);
    const records =
      this.#poseLibraries.get(stream) ??
      new Map<string, PoseLibraryPersistenceRecord>();
    const currentId = this.#currentPoseLibraries.get(stream);
    assertExpectedCurrent(currentId, expectedCurrentId);
    const existing = records.get(parsed.libraryId);
    if (existing !== undefined) return existing;
    const recordPayload = {
      kind: 'pose-library' as const,
      streamId: stream,
      contentId: parsed.libraryId,
      ...(currentId === undefined ? {} : { parentContentId: currentId }),
      createdAt: this.#now().toISOString(),
      value: structuredClone(parsed),
    };
    const record = deepFreeze({
      ...recordPayload,
      recordDigest: digest(JSON.stringify(recordPayload)),
    });
    records.set(record.contentId, record);
    this.#poseLibraries.set(stream, records);
    this.#currentPoseLibraries.set(stream, record.contentId);
    return record;
  }

  async getRig(streamId: string, contentId: string) {
    const stream = assertStreamId(streamId);
    const id = parseDomainValue(RigIdSchema, contentId, ['contentId']);
    return this.#rigs.get(stream)?.get(id);
  }
  async getPoseLibrary(streamId: string, contentId: string) {
    const stream = assertStreamId(streamId);
    const id = parseDomainValue(LibraryIdSchema, contentId, ['contentId']);
    return this.#poseLibraries.get(stream)?.get(id);
  }
  async getCurrentRig(streamId: string) {
    const stream = assertStreamId(streamId);
    const id = this.#currentRigs.get(stream);
    return id === undefined ? undefined : this.#rigs.get(stream)?.get(id);
  }
  async getCurrentPoseLibrary(streamId: string) {
    const stream = assertStreamId(streamId);
    const id = this.#currentPoseLibraries.get(stream);
    return id === undefined
      ? undefined
      : this.#poseLibraries.get(stream)?.get(id);
  }
  async selectCurrentRig(
    streamId: string,
    contentId: string,
    expectedCurrentId: string | null,
  ) {
    const stream = assertStreamId(streamId);
    const id = parseDomainValue(RigIdSchema, contentId, ['contentId']);
    const record = this.#rigs.get(stream)?.get(id);
    if (record === undefined)
      throw repositoryError(
        'REVISION_NOT_FOUND',
        ['rig', id],
        'REVISION_NOT_FOUND',
      );
    assertExpectedCurrent(this.#currentRigs.get(stream), expectedCurrentId);
    this.#currentRigs.set(stream, id);
    return record;
  }
  async selectCurrentPoseLibrary(
    streamId: string,
    contentId: string,
    expectedCurrentId: string | null,
  ) {
    const stream = assertStreamId(streamId);
    const id = parseDomainValue(LibraryIdSchema, contentId, ['contentId']);
    const record = this.#poseLibraries.get(stream)?.get(id);
    if (record === undefined)
      throw repositoryError(
        'REVISION_NOT_FOUND',
        ['poseLibrary', id],
        'REVISION_NOT_FOUND',
      );
    assertExpectedCurrent(
      this.#currentPoseLibraries.get(stream),
      expectedCurrentId,
    );
    this.#currentPoseLibraries.set(stream, id);
    return record;
  }
  async listRigs(streamId: string, options: PersistenceListOptions = {}) {
    const stream = assertStreamId(streamId);
    return listPage(
      'rig',
      stream,
      [...(this.#rigs.get(stream)?.values() ?? [])],
      options,
    );
  }
  async listPoseLibraries(
    streamId: string,
    options: PersistenceListOptions = {},
  ) {
    const stream = assertStreamId(streamId);
    return listPage(
      'pose-library',
      stream,
      [...(this.#poseLibraries.get(stream)?.values() ?? [])],
      options,
    );
  }
}

function assertExpectedCurrent(
  currentId: string | undefined,
  expectedCurrentId: string | null,
): void {
  if (
    (expectedCurrentId === null && currentId !== undefined) ||
    (expectedCurrentId !== null && currentId !== expectedCurrentId)
  )
    throw repositoryError('STALE_REVISION', ['current'], 'REVISION_CONFLICT');
}

async function verifyRigIdentity(value: RigidRigProfileV2): Promise<boolean> {
  return verifyRigidRigProfileV2Identity(value);
}
async function verifyLibraryIdentity(value: PoseLibrary): Promise<boolean> {
  return verifyPoseLibraryIdentity(value);
}

export interface FileRigPoseLibraryRepositoryOptions {
  readonly workspaceRoot: string;
  readonly storageDirectory?: string;
  readonly now?: () => Date;
  readonly lockTimeoutMilliseconds?: number;
}

const LOCK_RETRY_MS = 10;
const DEFAULT_LOCK_TIMEOUT_MS = 10_000;

export class FileRigPoseLibraryRepository implements RigPoseLibraryRepository {
  readonly #workspaceRoot: string;
  readonly #storageRoot: string;
  readonly #now: () => Date;
  readonly #lockTimeoutMs: number;

  constructor(options: FileRigPoseLibraryRepositoryOptions) {
    const workspace = resolve(options.workspaceRoot);
    this.#workspaceRoot = existsSync(workspace)
      ? realpathSync(workspace)
      : workspace;
    this.#storageRoot = resolve(
      this.#workspaceRoot,
      options.storageDirectory ?? '.forge/rig-pose-libraries',
    );
    if (!inside(this.#workspaceRoot, this.#storageRoot))
      throw repositoryError(
        'STORAGE_FAILURE',
        ['storageDirectory'],
        'STORAGE_PATH_ESCAPE',
      );
    this.#now = options.now ?? (() => new Date());
    this.#lockTimeoutMs =
      options.lockTimeoutMilliseconds ?? DEFAULT_LOCK_TIMEOUT_MS;
    if (!Number.isFinite(this.#lockTimeoutMs) || this.#lockTimeoutMs < 1)
      throw repositoryError(
        'STORAGE_FAILURE',
        ['lockTimeoutMilliseconds'],
        'INVALID_LOCK_TIMEOUT',
      );
  }

  async saveRig(
    streamId: string,
    value: RigidRigProfileV2,
    expectedCurrentId: string | null,
  ) {
    return this.#save('rig', streamId, value, expectedCurrentId);
  }
  async savePoseLibrary(
    streamId: string,
    value: PoseLibrary,
    expectedCurrentId: string | null,
  ) {
    const stream = assertStreamId(streamId);
    if (!(await verifyLibraryIdentity(value)))
      throw repositoryError(
        'IDENTITY_MISMATCH',
        ['poseLibrary', 'libraryId'],
        'IDENTITY_MISMATCH',
      );
    const parsed = parseDomainValue(PoseLibrarySchema, value, ['poseLibrary']);
    const referencedRig = await this.getRig(
      stream,
      parsed.binding.rigProfileId,
    );
    if (referencedRig === undefined)
      throw repositoryError(
        'BINDING_MISMATCH',
        ['poseLibrary', 'binding', 'rigProfileId'],
        'REFERENCED_RIG_NOT_FOUND',
      );
    if (!(await verifyRigIdentity(referencedRig.value)))
      throw repositoryError(
        'STORAGE_FAILURE',
        ['rig', referencedRig.contentId],
        'CORRUPT_REFERENCED_RIG',
      );
    await validatePoseLibraryAgainstRig(parsed, referencedRig.value);
    return this.#save('pose-library', stream, parsed, expectedCurrentId);
  }

  async #save(
    kind: 'rig',
    streamId: string,
    value: RigidRigProfileV2,
    expectedCurrentId: string | null,
  ): Promise<RigPersistenceRecord>;
  async #save(
    kind: 'pose-library',
    streamId: string,
    value: PoseLibrary,
    expectedCurrentId: string | null,
  ): Promise<PoseLibraryPersistenceRecord>;
  async #save(
    kind: 'rig' | 'pose-library',
    streamId: string,
    value: RigidRigProfileV2 | PoseLibrary,
    expectedCurrentId: string | null,
  ): Promise<RigPersistenceRecord | PoseLibraryPersistenceRecord> {
    const stream = assertStreamId(streamId);
    const validIdentity =
      kind === 'rig'
        ? await verifyRigIdentity(value as RigidRigProfileV2)
        : await verifyLibraryIdentity(value as PoseLibrary);
    if (!validIdentity)
      throw repositoryError(
        'IDENTITY_MISMATCH',
        [kind, 'contentId'],
        'IDENTITY_MISMATCH',
      );
    const parsed =
      kind === 'rig'
        ? parseDomainValue(RigidRigProfileV2Schema, value, ['rig'])
        : parseDomainValue(PoseLibrarySchema, value, ['poseLibrary']);
    return this.#withLock(kind, stream, async () => {
      const current = await this.#getCurrentId(kind, stream);
      assertExpectedCurrent(current, expectedCurrentId);
      const contentId =
        kind === 'rig'
          ? (parsed as RigidRigProfileV2).profileId
          : (parsed as PoseLibrary).libraryId;
      const existing = await this.#get(kind, stream, contentId);
      if (existing !== undefined) return existing;
      const recordPayload = {
        kind,
        streamId: stream,
        contentId,
        ...(current === undefined ? {} : { parentContentId: current }),
        createdAt: this.#now().toISOString(),
        value: parsed,
      };
      const record = {
        ...recordPayload,
        recordDigest: digest(JSON.stringify(recordPayload)),
      } as RigPersistenceRecord | PoseLibraryPersistenceRecord;
      const recordPath = this.#recordPath(kind, stream, contentId);
      await mkdir(dirname(recordPath), { recursive: true });
      await assertNoSymlinkPath(this.#workspaceRoot, dirname(recordPath));
      await cleanupStaleTemporaryFiles(recordPath);
      const recordBytes = `${JSON.stringify(record, null, 2)}\n`;
      const publication = await publishImmutableFile(recordPath, recordBytes);
      if (publication === 'exists') {
        const existingBytes = await readFile(recordPath, 'utf8');
        if (existingBytes !== recordBytes)
          throw repositoryError(
            'STORAGE_FAILURE',
            [kind, stream, contentId],
            'IMMUTABLE_BYTE_MISMATCH',
          );
        const concurrent = await this.#get(kind, stream, contentId);
        if (concurrent === undefined)
          throw repositoryError(
            'STORAGE_FAILURE',
            [kind, stream, contentId],
            'CORRUPT_IMMUTABLE_RECORD',
          );
        return concurrent;
      }
      await this.#writeCurrent(kind, stream, contentId);
      return deepFreeze(structuredClone(record));
    });
  }

  async getRig(streamId: string, contentId: string) {
    return (await this.#get(
      'rig',
      assertStreamId(streamId),
      parseDomainValue(RigIdSchema, contentId, ['contentId']),
    )) as RigPersistenceRecord | undefined;
  }
  async getPoseLibrary(streamId: string, contentId: string) {
    return (await this.#get(
      'pose-library',
      assertStreamId(streamId),
      parseDomainValue(LibraryIdSchema, contentId, ['contentId']),
    )) as PoseLibraryPersistenceRecord | undefined;
  }
  async getCurrentRig(streamId: string) {
    const stream = assertStreamId(streamId);
    const id = await this.#getCurrentId('rig', stream);
    return id === undefined ? undefined : this.getRig(stream, id);
  }
  async getCurrentPoseLibrary(streamId: string) {
    const stream = assertStreamId(streamId);
    const id = await this.#getCurrentId('pose-library', stream);
    return id === undefined ? undefined : this.getPoseLibrary(stream, id);
  }
  async selectCurrentRig(
    streamId: string,
    contentId: string,
    expectedCurrentId: string | null,
  ) {
    const stream = assertStreamId(streamId);
    const id = parseDomainValue(RigIdSchema, contentId, ['contentId']);
    return this.#withLock('rig', stream, async () => {
      const record = (await this.#get('rig', stream, id)) as
        RigPersistenceRecord | undefined;
      if (record === undefined)
        throw repositoryError(
          'REVISION_NOT_FOUND',
          ['rig', id],
          'REVISION_NOT_FOUND',
        );
      assertExpectedCurrent(
        await this.#getCurrentId('rig', stream),
        expectedCurrentId,
      );
      await this.#writeCurrent('rig', stream, id);
      return record;
    });
  }
  async selectCurrentPoseLibrary(
    streamId: string,
    contentId: string,
    expectedCurrentId: string | null,
  ) {
    const stream = assertStreamId(streamId);
    const id = parseDomainValue(LibraryIdSchema, contentId, ['contentId']);
    return this.#withLock('pose-library', stream, async () => {
      const record = (await this.#get('pose-library', stream, id)) as
        PoseLibraryPersistenceRecord | undefined;
      if (record === undefined)
        throw repositoryError(
          'REVISION_NOT_FOUND',
          ['poseLibrary', id],
          'REVISION_NOT_FOUND',
        );
      assertExpectedCurrent(
        await this.#getCurrentId('pose-library', stream),
        expectedCurrentId,
      );
      await this.#writeCurrent('pose-library', stream, id);
      return record;
    });
  }
  async listRigs(streamId: string, options: PersistenceListOptions = {}) {
    const stream = assertStreamId(streamId);
    return listPage(
      'rig',
      stream,
      (await this.#list('rig', stream)) as RigPersistenceRecord[],
      options,
    );
  }
  async listPoseLibraries(
    streamId: string,
    options: PersistenceListOptions = {},
  ) {
    const stream = assertStreamId(streamId);
    return listPage(
      'pose-library',
      stream,
      (await this.#list(
        'pose-library',
        stream,
      )) as PoseLibraryPersistenceRecord[],
      options,
    );
  }

  async #list(kind: 'rig' | 'pose-library', streamId: string) {
    const directory = this.#streamDirectory(kind, streamId);
    try {
      await assertNoSymlinkPath(this.#workspaceRoot, directory);
      const names = await readdir(directory);
      const ids = names
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.slice(0, -5));
      return (
        await Promise.all(ids.map((id) => this.#get(kind, streamId, id)))
      ).filter((record) => record !== undefined);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      if (error instanceof ForgeDomainError) throw error;
      throw repositoryError(
        'STORAGE_FAILURE',
        [kind, streamId],
        'STORAGE_LIST_FAILED',
        error,
      );
    }
  }

  async #get(
    kind: 'rig' | 'pose-library',
    streamId: string,
    contentId: string,
  ) {
    try {
      const path = this.#recordPath(kind, streamId, contentId);
      await assertNoSymlinkPath(this.#workspaceRoot, path);
      const bytes = await readFile(path, 'utf8');
      const raw = JSON.parse(bytes) as unknown;
      const record =
        kind === 'rig'
          ? parseDomainValue(RigRecordSchema, raw, [kind, streamId, contentId])
          : parseDomainValue(PoseLibraryRecordSchema, raw, [
              kind,
              streamId,
              contentId,
            ]);
      if (bytes !== `${JSON.stringify(record, null, 2)}\n`)
        throw repositoryError(
          'STORAGE_FAILURE',
          [kind, streamId, contentId],
          'CORRUPT_IMMUTABLE_RECORD',
        );
      const { recordDigest, ...recordPayload } = record;
      if (recordDigest !== digest(JSON.stringify(recordPayload)))
        throw repositoryError(
          'STORAGE_FAILURE',
          [kind, streamId, contentId],
          'CORRUPT_IMMUTABLE_RECORD',
        );
      if (record.streamId !== streamId || record.contentId !== contentId)
        throw repositoryError(
          'STORAGE_FAILURE',
          [kind, streamId, contentId],
          'CORRUPT_IMMUTABLE_RECORD',
        );
      const identityValid =
        kind === 'rig'
          ? await verifyRigIdentity(record.value as RigidRigProfileV2)
          : await verifyLibraryIdentity(record.value as PoseLibrary);
      if (!identityValid)
        throw repositoryError(
          'STORAGE_FAILURE',
          [kind, streamId, contentId, 'value'],
          'CORRUPT_IMMUTABLE_RECORD',
        );
      return deepFreeze(record);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      if (error instanceof RigPoseLibraryRepositoryError) throw error;
      throw repositoryError(
        'STORAGE_FAILURE',
        [kind, streamId, contentId],
        'CORRUPT_IMMUTABLE_RECORD',
        error,
      );
    }
  }

  async #getCurrentId(kind: 'rig' | 'pose-library', streamId: string) {
    try {
      const path = this.#currentPath(kind, streamId);
      await assertNoSymlinkPath(this.#workspaceRoot, path);
      const id = (await readFile(path, 'utf8')).trim();
      const parsed =
        kind === 'rig'
          ? parseDomainValue(RigIdSchema, id, [kind, streamId, 'current'])
          : parseDomainValue(LibraryIdSchema, id, [kind, streamId, 'current']);
      if ((await this.#get(kind, streamId, parsed)) === undefined)
        throw repositoryError(
          'STORAGE_FAILURE',
          [kind, streamId, 'current'],
          'CORRUPT_CURRENT_POINTER',
        );
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      if (error instanceof RigPoseLibraryRepositoryError) throw error;
      throw repositoryError(
        'STORAGE_FAILURE',
        [kind, streamId, 'current'],
        'CORRUPT_CURRENT_POINTER',
        error,
      );
    }
  }

  async #writeCurrent(
    kind: 'rig' | 'pose-library',
    streamId: string,
    contentId: string,
  ) {
    const current = this.#currentPath(kind, streamId);
    await mkdir(dirname(current), { recursive: true });
    await assertNoSymlinkPath(this.#workspaceRoot, dirname(current));
    await cleanupStaleTemporaryFiles(current);
    const temporary = `${current}.${randomUUID()}.tmp`;
    let handle: Awaited<ReturnType<typeof open>> | undefined;
    let primary: ForgeDomainError<string> | undefined;
    try {
      handle = await open(temporary, 'wx', 0o600);
      await handle.writeFile(`${contentId}\n`, { encoding: 'utf8' });
      await handle.sync();
      await handle.close();
      handle = undefined;
      await rename(temporary, current);
      await syncDirectory(dirname(current));
    } catch (error) {
      primary = storageBoundaryError(
        error,
        [kind, streamId, 'current'],
        'CURRENT_POINTER_WRITE_FAILED',
      );
    }
    const cleanupFailures: unknown[] = [];
    if (handle !== undefined)
      try {
        await handle.close();
      } catch (error) {
        cleanupFailures.push(error);
      }
    try {
      await unlink(temporary);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        cleanupFailures.push(error);
    }
    try {
      await syncDirectory(dirname(current));
    } catch (error) {
      cleanupFailures.push(error);
    }
    primary = retainCleanupFailures(
      primary,
      cleanupFailures,
      [kind, streamId, 'current'],
      'CURRENT_POINTER_CLEANUP_FAILED',
    );
    if (primary !== undefined) throw primary;
  }

  async #withLock<Value>(
    kind: 'rig' | 'pose-library',
    streamId: string,
    operation: () => Promise<Value>,
  ): Promise<Value> {
    const lock = `${this.#streamDirectory(kind, streamId)}.lock`;
    await mkdir(dirname(lock), { recursive: true });
    await assertNoSymlinkPath(this.#workspaceRoot, dirname(lock));
    const deadline = Date.now() + this.#lockTimeoutMs;
    while (true) {
      try {
        await mkdir(lock);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
          throw repositoryError(
            'STORAGE_FAILURE',
            [kind, streamId, 'lock'],
            'LOCK_ACQUISITION_FAILED',
            error,
          );
        if (Date.now() >= deadline)
          throw repositoryError(
            'STORAGE_FAILURE',
            [kind, streamId, 'lock'],
            'LOCK_TIMEOUT',
            error,
          );
        await delay(LOCK_RETRY_MS);
      }
    }
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ForgeDomainError) throw error;
      throw repositoryError(
        'STORAGE_FAILURE',
        [kind, streamId],
        'STORAGE_OPERATION_FAILED',
        error,
      );
    } finally {
      await rmdir(lock).catch(() => undefined);
    }
  }

  #streamDirectory(kind: 'rig' | 'pose-library', streamId: string) {
    return resolve(this.#storageRoot, kind, assertStreamId(streamId));
  }
  #recordPath(
    kind: 'rig' | 'pose-library',
    streamId: string,
    contentId: string,
  ) {
    const id =
      kind === 'rig'
        ? parseDomainValue(RigIdSchema, contentId, ['contentId'])
        : parseDomainValue(LibraryIdSchema, contentId, ['contentId']);
    const path = resolve(this.#streamDirectory(kind, streamId), `${id}.json`);
    if (!inside(this.#storageRoot, path))
      throw repositoryError(
        'STORAGE_FAILURE',
        [kind, streamId, contentId],
        'STORAGE_PATH_ESCAPE',
      );
    return path;
  }
  #currentPath(kind: 'rig' | 'pose-library', streamId: string) {
    return resolve(this.#streamDirectory(kind, streamId), 'current');
  }
}

function inside(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

/** @internal Exported for crash-safety conformance probes, not package API. */
export async function publishImmutableFile(
  finalPath: string,
  bytes: string,
): Promise<'created' | 'exists'> {
  const directory = dirname(finalPath);
  const temporary = `${finalPath}.${randomUUID()}.tmp`;
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  let result: 'created' | 'exists' | undefined;
  let primary: ForgeDomainError<string> | undefined;
  try {
    handle = await open(temporary, 'wx', 0o600);
    await handle.writeFile(bytes, { encoding: 'utf8' });
    await handle.sync();
    await handle.close();
    handle = undefined;
    try {
      await link(temporary, finalPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        if ((await readFile(finalPath, 'utf8')) !== bytes)
          throw repositoryError(
            'STORAGE_FAILURE',
            ['immutableRecord'],
            'IMMUTABLE_BYTE_MISMATCH',
            error,
          );
        result = 'exists';
      } else {
        throw error;
      }
    }
    if (result === undefined) {
      await syncDirectory(directory);
      result = 'created';
    }
  } catch (error) {
    primary = storageBoundaryError(
      error,
      ['immutableRecord'],
      'IMMUTABLE_PUBLICATION_FAILED',
    );
  }
  const cleanupFailures: unknown[] = [];
  if (handle !== undefined)
    try {
      await handle.close();
    } catch (error) {
      cleanupFailures.push(error);
    }
  try {
    await unlink(temporary);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
      cleanupFailures.push(error);
  }
  try {
    await syncDirectory(directory);
  } catch (error) {
    cleanupFailures.push(error);
  }
  primary = retainCleanupFailures(
    primary,
    cleanupFailures,
    ['immutableRecord'],
    'IMMUTABLE_CLEANUP_FAILED',
  );
  if (primary !== undefined) throw primary;
  return result!;
}

async function syncDirectory(directory: string): Promise<void> {
  const handle = await open(directory, 'r');
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

const MAX_STALE_TEMPORARY_FILES = 100;

async function cleanupStaleTemporaryFiles(finalPath: string): Promise<void> {
  const directory = dirname(finalPath);
  const prefix = `${basename(finalPath)}.`;
  const names = (await readdir(directory)).filter(
    (name) => name.startsWith(prefix) && name.endsWith('.tmp'),
  );
  if (names.length > MAX_STALE_TEMPORARY_FILES)
    throw repositoryError(
      'STORAGE_FAILURE',
      ['immutableRecord'],
      'STALE_TEMPORARY_FILE_LIMIT_EXCEEDED',
    );
  for (const name of names) await unlink(join(directory, name));
  if (names.length > 0) await syncDirectory(directory);
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
    throw repositoryError(
      'STORAGE_FAILURE',
      ['storagePath'],
      'STORAGE_PATH_ESCAPE',
    );
  let cursor = root;
  for (const segment of relativePath.split(sep).filter(Boolean)) {
    cursor = join(cursor, segment);
    try {
      if ((await lstat(cursor)).isSymbolicLink())
        throw repositoryError(
          'STORAGE_FAILURE',
          ['storagePath'],
          'SYMLINK_REJECTED',
        );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
  }
}
