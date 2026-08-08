import { createHash } from 'node:crypto';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  canonicalPoseLibraryPayload,
  createPoseApprovalReceipt,
  createPoseLibrary,
} from '../../src/contracts/pose-library.js';
import { ForgeDomainError } from '../../src/contracts/domain-error.js';
import { createRigidRigProfileV2 } from '../../src/contracts/rigid-rig-v2.js';
import {
  FileRigPoseLibraryRepository,
  MemoryRigPoseLibraryRepository,
  PERSISTENCE_CURSOR_INTEGRITY_NOTICE,
  publishImmutableFile,
} from '../../src/services/rig-pose-library-repository.js';
import { validRigPayload } from '../contracts/rig-v2-fixture.js';

const hex = (character: string) => character.repeat(64);

async function rigWithRevision(character: string) {
  const payload = validRigPayload();
  payload.assetRevisionId = `revision.${hex(character)}`;
  return createRigidRigProfileV2(payload);
}

async function libraryForRig(
  rig: Awaited<ReturnType<typeof createRigidRigProfileV2>>,
  tag = 'idle',
) {
  return createPoseLibrary({
    contractId: 'forge-pose-library/v1',
    binding: {
      assetRevisionId: rig.assetRevisionId,
      morphologyRevisionId: rig.morphologyRevisionId,
      rigProfileId: rig.profileId,
      equipmentSignature: rig.equipmentSignature,
    },
    references: [
      {
        referenceId: 'reference.guard',
        sourceKind: 'built_in',
        sourceDigest: hex('a'),
        sourceArtifactDigest: hex('b'),
      },
    ],
    poses: [
      {
        semanticId: 'idle',
        referenceIds: ['reference.guard'],
        tags: [tag],
        channels: [],
        contacts: [],
        root: { policy: 'locked' },
        equipmentSlots: [],
        mirrorPolicy: 'asymmetric',
        asymmetryReason: 'Neutral authored pose is intentionally unpaired.',
        asymmetryReferenceIds: ['reference.guard'],
      },
    ],
  });
}

async function approvedLibraryForRig(
  rig: Awaited<ReturnType<typeof createRigidRigProfileV2>>,
) {
  const scope = {
    assetRevisionId: rig.assetRevisionId,
    morphologyRevisionId: rig.morphologyRevisionId,
    rigProfileId: rig.profileId,
    equipmentSignature: rig.equipmentSignature,
  };
  const approvalReceipt = await createPoseApprovalReceipt({
    referenceId: 'reference.guard.approved',
    sourceDigest: hex('a'),
    sourceArtifactDigest: hex('b'),
    authorityId: 'authority.kimi-webbridge',
    reviewerId: 'reviewer.kimi',
    decision: 'approved',
    scope,
    descriptorDigest: hex('c'),
    provenanceDigest: hex('d'),
    kimiEvidenceDigest: hex('e'),
    criteriaDigest: hex('f'),
    decidedAt: '2026-07-23T00:00:00.000Z',
    notes: 'Approved against the complete reference criteria.',
  });
  return createPoseLibrary({
    contractId: 'forge-pose-library/v1',
    binding: scope,
    references: [
      {
        referenceId: 'reference.guard.approved',
        sourceKind: 'generated_approved',
        sourceDigest: hex('a'),
        sourceArtifactDigest: hex('b'),
        approvalReceipt,
      },
    ],
    poses: [
      {
        semanticId: 'idle',
        referenceIds: ['reference.guard.approved'],
        tags: ['idle'],
        channels: [],
        contacts: [],
        root: { policy: 'locked' },
        equipmentSlots: [],
        mirrorPolicy: 'asymmetric',
        asymmetryReason: 'Neutral authored pose is intentionally unpaired.',
        asymmetryReferenceIds: ['reference.guard.approved'],
      },
    ],
  });
}

describe('rig and pose-library persistence', () => {
  it('deduplicates content and enforces optimistic current identity', async () => {
    const repository = new MemoryRigPoseLibraryRepository();
    const rig = await createRigidRigProfileV2(validRigPayload());
    const created = await repository.saveRig('guard.primary', rig, null);
    const duplicate = await repository.saveRig(
      'guard.primary',
      structuredClone(rig),
      rig.profileId,
    );
    expect(duplicate).toEqual(created);

    await expect(
      repository.saveRig('guard.primary', rig, `rig-v2.${hex('f')}`),
    ).rejects.toThrow('REVISION_CONFLICT');
    await expect(
      repository.saveRig('guard.primary', rig, null),
    ).rejects.toThrow('REVISION_CONFLICT');
  });

  it('selects existing in-memory rig and pose revisions with explicit CAS', async () => {
    const repository = new MemoryRigPoseLibraryRepository();
    const firstRig = await rigWithRevision('1');
    const secondRig = await rigWithRevision('2');
    await repository.saveRig('guard.primary', firstRig, null);
    await repository.saveRig('guard.primary', secondRig, firstRig.profileId);
    await expect(
      repository.selectCurrentRig(
        'guard.primary',
        firstRig.profileId,
        secondRig.profileId,
      ),
    ).resolves.toMatchObject({ contentId: firstRig.profileId });
    await expect(
      repository.selectCurrentRig('guard.primary', secondRig.profileId, null),
    ).rejects.toMatchObject({
      code: 'STALE_REVISION',
      path: ['current'],
      message: 'REVISION_CONFLICT',
    });
    await expect(
      repository.selectCurrentRig(
        'guard.primary',
        `rig-v2.${hex('f')}`,
        firstRig.profileId,
      ),
    ).rejects.toThrow('REVISION_NOT_FOUND');

    const firstLibrary = await libraryForRig(firstRig, 'first');
    const secondLibrary = await libraryForRig(firstRig, 'second');
    await repository.savePoseLibrary('guard.primary', firstLibrary, null);
    await repository.savePoseLibrary(
      'guard.primary',
      secondLibrary,
      firstLibrary.libraryId,
    );
    await expect(
      repository.selectCurrentPoseLibrary(
        'guard.primary',
        firstLibrary.libraryId,
        secondLibrary.libraryId,
      ),
    ).resolves.toMatchObject({ contentId: firstLibrary.libraryId });
    await expect(
      repository.selectCurrentPoseLibrary(
        'guard.primary',
        secondLibrary.libraryId,
        null,
      ),
    ).rejects.toThrow('REVISION_CONFLICT');
  });

  it('persists independent pose-library lineage and current selection', async () => {
    const repository = new MemoryRigPoseLibraryRepository();
    const rig = await createRigidRigProfileV2(validRigPayload());
    await repository.saveRig('guard.primary', rig, null);
    const first = await createPoseLibrary({
      contractId: 'forge-pose-library/v1',
      binding: {
        assetRevisionId: rig.assetRevisionId,
        morphologyRevisionId: rig.morphologyRevisionId,
        rigProfileId: rig.profileId,
        equipmentSignature: rig.equipmentSignature,
      },
      references: [
        {
          referenceId: 'reference.guard',
          sourceKind: 'built_in',
          sourceDigest: hex('a'),
          sourceArtifactDigest: hex('b'),
        },
      ],
      poses: [
        {
          semanticId: 'idle',
          referenceIds: ['reference.guard'],
          tags: ['idle'],
          channels: [],
          contacts: [],
          root: { policy: 'locked' },
          equipmentSlots: [],
          mirrorPolicy: 'asymmetric',
          asymmetryReason: 'Neutral authored pose is intentionally unpaired.',
          asymmetryReferenceIds: ['reference.guard'],
        },
      ],
    });
    const { libraryId: _firstLibraryId, ...firstPayload } = first;
    void _firstLibraryId;
    const second = await createPoseLibrary({
      ...firstPayload,
      poses: [{ ...first.poses[0]!, tags: ['idle', 'approved'] }],
    });

    const firstRecord = await repository.savePoseLibrary(
      'guard.primary',
      first,
      null,
    );
    const secondRecord = await repository.savePoseLibrary(
      'guard.primary',
      second,
      first.libraryId,
    );
    expect(secondRecord.parentContentId).toBe(firstRecord.contentId);
    expect(await repository.getCurrentPoseLibrary('guard.primary')).toEqual(
      secondRecord,
    );
    expect(
      (await repository.getPoseLibrary('guard.primary', first.libraryId))
        ?.value,
    ).toEqual(first);
  });

  it('binds opaque pagination tokens to kind and stream', async () => {
    const repository = new MemoryRigPoseLibraryRepository();
    const first = await createRigidRigProfileV2(validRigPayload());
    const secondPayload = validRigPayload();
    secondPayload.assetRevisionId = `revision.${hex('9')}`;
    const second = await createRigidRigProfileV2(secondPayload);
    await repository.saveRig('guard.primary', first, null);
    await repository.saveRig('guard.primary', second, first.profileId);

    const page = await repository.listRigs('guard.primary', { limit: 1 });
    expect(page.records).toHaveLength(1);
    expect(page.nextCursor).toBeDefined();
    const cursor = page.nextCursor;
    if (cursor === undefined) throw new Error('Expected pagination cursor.');
    expect(
      (
        await repository.listRigs('guard.primary', {
          limit: 1,
          cursor,
        })
      ).records,
    ).toHaveLength(1);
    await expect(
      repository.listRigs('different.stream', {
        limit: 1,
        cursor,
      }),
    ).rejects.toThrow('INVALID_CURSOR');
    await expect(
      repository.listPoseLibraries('guard.primary', { cursor }),
    ).rejects.toThrow('INVALID_CURSOR');
    await expect(
      repository.listRigs('guard.primary', { cursor: 'not-json' }),
    ).rejects.toMatchObject({
      code: 'INVALID_CURSOR',
      path: ['cursor'],
      message: 'INVALID_CURSOR',
    });
    await expect(
      repository.listRigs('guard.primary', { cursor: `${cursor}=` }),
    ).rejects.toThrow('INVALID_CURSOR');
    await expect(
      repository.listRigs('guard.primary', { cursor: 'a'.repeat(1_025) }),
    ).rejects.toThrow('INVALID_CURSOR');
    const tamperedPayload = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as { checksum: string };
    tamperedPayload.checksum = hex('0');
    await expect(
      repository.listRigs('guard.primary', {
        cursor: Buffer.from(JSON.stringify(tamperedPayload)).toString(
          'base64url',
        ),
      }),
    ).rejects.toThrow('INVALID_CURSOR');
    const wrongIdPayload = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as {
      version: 1;
      kind: 'rig';
      streamId: string;
      afterContentId: string;
      snapshotDigest: string;
      checksum: string;
    };
    wrongIdPayload.afterContentId = `pose-library.${hex('1')}`;
    const { checksum: _checksum, ...wrongIdUnsigned } = wrongIdPayload;
    void _checksum;
    wrongIdPayload.checksum = createHash('sha256')
      .update(`forge-rig-pose-cursor/v1\0${JSON.stringify(wrongIdUnsigned)}`)
      .digest('hex');
    await expect(
      repository.listRigs('guard.primary', {
        cursor: Buffer.from(JSON.stringify(wrongIdPayload)).toString(
          'base64url',
        ),
      }),
    ).rejects.toThrow('INVALID_CURSOR');
    expect(PERSISTENCE_CURSOR_INTEGRITY_NOTICE).toMatch(/non-security/i);

    const third = await rigWithRevision('8');
    await repository.saveRig('guard.primary', third, second.profileId);
    await expect(
      repository.listRigs('guard.primary', { cursor }),
    ).rejects.toThrow('INVALID_CURSOR');

    const boundary = await repository.listRigs('guard.primary', { limit: 2 });
    expect(boundary.records).toHaveLength(2);
    expect(boundary.nextCursor).toBeDefined();
    const boundaryCursor = boundary.nextCursor;
    if (boundaryCursor === undefined)
      throw new Error('Expected boundary pagination cursor.');
    expect(
      (
        await repository.listRigs('guard.primary', {
          limit: 2,
          cursor: boundaryCursor,
        })
      ).nextCursor,
    ).toBeUndefined();
  });

  it('rejects malformed identities, stale content identities, and invalid page limits', async () => {
    const repository = new MemoryRigPoseLibraryRepository();
    const rig = await rigWithRevision('1');
    const library = await libraryForRig(rig);
    const staleRig = structuredClone(rig);
    staleRig.profileId = `rig-v2.${hex('f')}`;
    const staleLibrary = structuredClone(library);
    staleLibrary.libraryId = `pose-library.${hex('f')}`;

    await expect(
      repository.saveRig('guard.primary', staleRig, null),
    ).rejects.toThrow('IDENTITY_MISMATCH');
    await expect(
      repository.savePoseLibrary('guard.primary', staleLibrary, null),
    ).rejects.toThrow('IDENTITY_MISMATCH');
    await expect(
      repository.getRig('../escape', rig.profileId),
    ).rejects.toThrow();
    await expect(
      repository.getRig('guard.primary', 'rig-v2.bad'),
    ).rejects.toThrow();
    await expect(
      repository.listRigs('guard.primary', { limit: 0 }),
    ).rejects.toThrow('INVALID_PAGE_LIMIT');
    await expect(
      repository.listRigs('guard.primary', { limit: 101 }),
    ).rejects.toThrow('INVALID_PAGE_LIMIT');
    await expect(
      repository.listRigs('guard.primary', { limit: 1.5 }),
    ).rejects.toThrow('INVALID_PAGE_LIMIT');
    await expect(
      repository.getCurrentRig('empty.stream'),
    ).resolves.toBeUndefined();
    await expect(
      repository.getCurrentPoseLibrary('empty.stream'),
    ).resolves.toBeUndefined();
    await expect(repository.listRigs('empty.stream')).resolves.toEqual({
      records: [],
    });
  });

  it('survives restart with content and current pointers intact', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-rig-pose-'));
    const first = new FileRigPoseLibraryRepository({ workspaceRoot });
    const rig = await createRigidRigProfileV2(validRigPayload());
    const saved = await first.saveRig('guard.primary', rig, null);

    const restarted = new FileRigPoseLibraryRepository({ workspaceRoot });
    expect(await restarted.getCurrentRig('guard.primary')).toEqual(saved);
    expect(await restarted.getRig('guard.primary', rig.profileId)).toEqual(
      saved,
    );
  });

  it('persists pose-library records through the file repository', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-pose-file-'));
    const repository = new FileRigPoseLibraryRepository({ workspaceRoot });
    const rig = await rigWithRevision('2');
    await repository.saveRig('guard.primary', rig, null);
    const first = await libraryForRig(rig, 'idle');
    const second = await libraryForRig(rig, 'approved');
    const firstRecord = await repository.savePoseLibrary(
      'guard.primary',
      first,
      null,
    );
    const secondRecord = await repository.savePoseLibrary(
      'guard.primary',
      second,
      first.libraryId,
    );
    expect(secondRecord.parentContentId).toBe(firstRecord.contentId);
    await expect(
      repository.getCurrentPoseLibrary('guard.primary'),
    ).resolves.toEqual(secondRecord);
    await expect(
      repository.listPoseLibraries('guard.primary', { limit: 1 }),
    ).resolves.toMatchObject({ records: [expect.any(Object)] });
    await expect(
      repository.getPoseLibrary('guard.primary', first.libraryId),
    ).resolves.toEqual(firstRecord);
  });

  it('rejects storage escapes, invalid lock budgets, and symlinks at every storage level', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-pose-paths-'));
    expect(
      () =>
        new FileRigPoseLibraryRepository({
          workspaceRoot,
          storageDirectory: '../outside',
        }),
    ).toThrow('STORAGE_PATH_ESCAPE');
    expect(
      () =>
        new FileRigPoseLibraryRepository({
          workspaceRoot,
          lockTimeoutMilliseconds: 0,
        }),
    ).toThrow('INVALID_LOCK_TIMEOUT');

    const rig = await rigWithRevision('3');
    for (const level of ['storage', 'kind', 'stream'] as const) {
      const root = await mkdtemp(join(tmpdir(), `forge-symlink-${level}-`));
      const outside = await mkdtemp(join(tmpdir(), 'forge-symlink-outside-'));
      const storage = join(root, '.forge', 'rig-pose-libraries');
      if (level === 'storage') {
        await mkdir(join(root, '.forge'), { recursive: true });
        await symlink(outside, storage);
      } else if (level === 'kind') {
        await mkdir(storage, { recursive: true });
        await symlink(outside, join(storage, 'rig'));
      } else {
        await mkdir(join(storage, 'rig'), { recursive: true });
        await symlink(outside, join(storage, 'rig', 'guard.primary'));
      }
      const repository = new FileRigPoseLibraryRepository({
        workspaceRoot: root,
      });
      await expect(
        repository.saveRig('guard.primary', rig, null),
      ).rejects.toThrow('SYMLINK_REJECTED');
    }

    const root = await mkdtemp(join(tmpdir(), 'forge-symlink-leaf-'));
    const repository = new FileRigPoseLibraryRepository({
      workspaceRoot: root,
    });
    await repository.saveRig('guard.primary', rig, null);
    const stream = join(
      root,
      '.forge',
      'rig-pose-libraries',
      'rig',
      'guard.primary',
    );
    const recordPath = join(stream, `${rig.profileId}.json`);
    const currentPath = join(stream, 'current');
    const outsideFile = join(root, 'outside.json');
    await writeFile(outsideFile, '{}\n');
    await unlink(recordPath);
    await symlink(outsideFile, recordPath);
    await expect(
      repository.getRig('guard.primary', rig.profileId),
    ).rejects.toThrow('SYMLINK_REJECTED');
    await unlink(recordPath);
    await writeFile(recordPath, '{}\n');
    await unlink(currentPath);
    await symlink(outsideFile, currentPath);
    await expect(repository.getCurrentRig('guard.primary')).rejects.toThrow(
      'SYMLINK_REJECTED',
    );
  });

  it('rejects immutable record corruption and malformed or stale current pointers after restart', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-corrupt-rig-'));
    const repository = new FileRigPoseLibraryRepository({ workspaceRoot });
    const rig = await rigWithRevision('4');
    await repository.saveRig('guard.primary', rig, null);
    const stream = join(
      workspaceRoot,
      '.forge',
      'rig-pose-libraries',
      'rig',
      'guard.primary',
    );
    const recordPath = join(stream, `${rig.profileId}.json`);
    const currentPath = join(stream, 'current');
    const raw = JSON.parse(await readFile(recordPath, 'utf8')) as {
      value: { equipmentSignature: string };
    };
    raw.value.equipmentSignature = `equipment.${hex('f')}`;
    await writeFile(recordPath, `${JSON.stringify(raw)}\n`);
    const restarted = new FileRigPoseLibraryRepository({ workspaceRoot });
    await expect(
      restarted.getRig('guard.primary', rig.profileId),
    ).rejects.toThrow('CORRUPT_IMMUTABLE_RECORD');

    await writeFile(currentPath, 'not-a-content-id\n');
    await expect(restarted.getCurrentRig('guard.primary')).rejects.toThrow();
    await writeFile(currentPath, `rig-v2.${hex('e')}\n`);
    await expect(restarted.getCurrentRig('guard.primary')).rejects.toThrow(
      'CORRUPT_CURRENT_POINTER',
    );
  });

  it('rejects pre-existing mismatched immutable bytes', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-immutable-rig-'));
    const rig = await rigWithRevision('5');
    const recordPath = join(
      workspaceRoot,
      '.forge',
      'rig-pose-libraries',
      'rig',
      'guard.primary',
      `${rig.profileId}.json`,
    );
    await mkdir(join(recordPath, '..'), { recursive: true });
    await writeFile(recordPath, '{"unexpected":true}\n');
    const repository = new FileRigPoseLibraryRepository({ workspaceRoot });
    await expect(
      repository.saveRig('guard.primary', rig, null),
    ).rejects.toThrow();
  });

  it('requires an identity-valid compatible rig in the same stream before pose publication', async () => {
    const rig = await rigWithRevision('a');
    const library = await libraryForRig(rig);
    const memory = new MemoryRigPoseLibraryRepository();
    await expect(
      memory.savePoseLibrary('guard.primary', library, null),
    ).rejects.toMatchObject({
      code: 'BINDING_MISMATCH',
      path: ['poseLibrary', 'binding', 'rigProfileId'],
      message: 'REFERENCED_RIG_NOT_FOUND',
    });
    await memory.saveRig('guard.primary', rig, null);

    const { libraryId: _libraryId, ...incompatiblePayload } =
      structuredClone(library);
    void _libraryId;
    incompatiblePayload.binding.assetRevisionId = `revision.${hex('b')}`;
    expect(library.binding.assetRevisionId).toBe(rig.assetRevisionId);
    const incompatible = await createPoseLibrary(incompatiblePayload);
    await expect(
      memory.savePoseLibrary('guard.primary', incompatible, null),
    ).rejects.toMatchObject({ code: 'BINDING_MISMATCH' });

    const stale = structuredClone(library);
    stale.poses[0]!.tags.push('stale');
    await expect(
      memory.savePoseLibrary('guard.primary', stale, null),
    ).rejects.toThrow('IDENTITY_MISMATCH');

    const fileRoot = await mkdtemp(join(tmpdir(), 'forge-pose-missing-rig-'));
    const file = new FileRigPoseLibraryRepository({ workspaceRoot: fileRoot });
    await expect(
      file.savePoseLibrary('guard.primary', library, null),
    ).rejects.toMatchObject({
      code: 'BINDING_MISMATCH',
      path: ['poseLibrary', 'binding', 'rigProfileId'],
      message: 'REFERENCED_RIG_NOT_FOUND',
    });
  });

  it('rejects a stale referenced rig before publishing a pose library', async () => {
    const workspaceRoot = await mkdtemp(
      join(tmpdir(), 'forge-stale-bound-rig-'),
    );
    const repository = new FileRigPoseLibraryRepository({ workspaceRoot });
    const rig = await rigWithRevision('3');
    const library = await libraryForRig(rig);
    await repository.saveRig('guard.primary', rig, null);
    const recordPath = join(
      workspaceRoot,
      '.forge',
      'rig-pose-libraries',
      'rig',
      'guard.primary',
      `${rig.profileId}.json`,
    );
    const record = JSON.parse(await readFile(recordPath, 'utf8')) as {
      recordDigest: string;
      value: { assemblySignature: string };
      [key: string]: unknown;
    };
    record.value.assemblySignature = `assembly.${hex('f')}`;
    const { recordDigest: _recordDigest, ...recordPayload } = record;
    void _recordDigest;
    record.recordDigest = createHash('sha256')
      .update(JSON.stringify(recordPayload))
      .digest('hex');
    await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`);

    await expect(
      repository.savePoseLibrary('guard.primary', library, null),
    ).rejects.toThrow('CORRUPT_IMMUTABLE_RECORD');
    await expect(
      repository.getCurrentPoseLibrary('guard.primary'),
    ).resolves.toBeUndefined();
  });

  it('rejects truncated, non-canonical, and digest-invalid immutable records', async () => {
    const rig = await rigWithRevision('b');
    for (const corruption of [
      'truncated',
      'non-canonical',
      'digest',
    ] as const) {
      const workspaceRoot = await mkdtemp(
        join(tmpdir(), `forge-record-${corruption}-`),
      );
      const repository = new FileRigPoseLibraryRepository({ workspaceRoot });
      await repository.saveRig('guard.primary', rig, null);
      const recordPath = join(
        workspaceRoot,
        '.forge',
        'rig-pose-libraries',
        'rig',
        'guard.primary',
        `${rig.profileId}.json`,
      );
      const original = await readFile(recordPath, 'utf8');
      if (corruption === 'truncated')
        await writeFile(recordPath, original.slice(0, 20));
      else if (corruption === 'non-canonical')
        await writeFile(recordPath, ` ${original}`);
      else {
        const record = JSON.parse(original) as { createdAt: string };
        record.createdAt = '2026-07-23T01:00:00.000Z';
        await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`);
      }
      await expect(
        repository.getRig('guard.primary', rig.profileId),
      ).rejects.toMatchObject({
        code: 'STORAGE_FAILURE',
        path: ['rig', 'guard.primary', rig.profileId],
      });
      if (corruption === 'truncated') {
        try {
          await repository.getRig('guard.primary', rig.profileId);
          throw new Error('Expected truncated record rejection.');
        } catch (error) {
          expect(error).toBeInstanceOf(ForgeDomainError);
          expect((error as Error).cause).toBeInstanceOf(SyntaxError);
        }
      }
    }
  });

  it('returns structured schema and identity failures at repository boundaries', async () => {
    const repository = new MemoryRigPoseLibraryRepository();
    const invalidStream = repository.getRig(
      'INVALID STREAM',
      `rig-v2.${hex('a')}`,
    );
    await expect(invalidStream).rejects.toMatchObject({
      code: 'SCHEMA_INVALID',
      path: ['streamId'],
    });
    await expect(invalidStream).rejects.toThrow(/string/i);

    const stale = await rigWithRevision('a');
    stale.rootJointId = 'joint.missing';
    await expect(
      repository.saveRig('guard.primary', stale, null),
    ).rejects.toMatchObject({
      code: 'IDENTITY_MISMATCH',
      path: ['rig', 'profileId'],
      message: 'IDENTITY_MISMATCH',
    });
  });

  it('rejects recomputed outer identities with stale nested approval receipts in both repositories', async () => {
    const rig = await rigWithRevision('b');
    const approved = await approvedLibraryForRig(rig);
    const stale = structuredClone(approved);
    stale.references[0]!.approvalReceipt!.notes =
      'Mutated after the immutable approval decision.';
    const { libraryId: _libraryId, ...payload } = stale;
    void _libraryId;
    stale.libraryId = `pose-library.${createHash('sha256')
      .update(canonicalPoseLibraryPayload(payload))
      .digest('hex')}`;

    const memory = new MemoryRigPoseLibraryRepository();
    await memory.saveRig('guard.primary', rig, null);
    await expect(
      memory.savePoseLibrary('guard.primary', stale, null),
    ).rejects.toMatchObject({
      code: 'IDENTITY_MISMATCH',
      path: ['poseLibrary', 'libraryId'],
      message: 'IDENTITY_MISMATCH',
    });

    const workspaceRoot = await mkdtemp(
      join(tmpdir(), 'forge-nested-approval-'),
    );
    const file = new FileRigPoseLibraryRepository({ workspaceRoot });
    await file.saveRig('guard.primary', rig, null);
    await expect(
      file.savePoseLibrary('guard.primary', stale, null),
    ).rejects.toMatchObject({
      code: 'IDENTITY_MISMATCH',
      path: ['poseLibrary', 'libraryId'],
      message: 'IDENTITY_MISMATCH',
    });
  });

  it('publishes no-replace immutable bytes and cleans stale same-directory temporaries', async () => {
    const directRoot = await mkdtemp(join(tmpdir(), 'forge-direct-publish-'));
    const directPath = join(directRoot, 'record.json');
    await expect(publishImmutableFile(directPath, 'same\n')).resolves.toBe(
      'created',
    );
    await expect(publishImmutableFile(directPath, 'same\n')).resolves.toBe(
      'exists',
    );
    await expect(
      publishImmutableFile(directPath, 'different\n'),
    ).rejects.toThrow('IMMUTABLE_BYTE_MISMATCH');
    expect(
      (await readdir(directRoot)).filter((name) => name.endsWith('.tmp')),
    ).toEqual([]);

    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-stale-temp-'));
    const rig = await rigWithRevision('c');
    const stream = join(
      workspaceRoot,
      '.forge',
      'rig-pose-libraries',
      'rig',
      'guard.primary',
    );
    await mkdir(stream, { recursive: true });
    const recordTemp = join(stream, `${rig.profileId}.json.stale.tmp`);
    const currentTemp = join(stream, 'current.stale.tmp');
    await writeFile(recordTemp, 'partial');
    await writeFile(currentTemp, 'partial');
    const repository = new FileRigPoseLibraryRepository({ workspaceRoot });
    await repository.saveRig('guard.primary', rig, null);
    await expect(access(recordTemp)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(access(currentTemp)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(
      (await readdir(stream)).filter((name) => name.endsWith('.tmp')),
    ).toEqual([]);
  });

  it('preserves a structured missing-parent publication error when cleanup also fails', async () => {
    const directRoot = await mkdtemp(
      join(tmpdir(), 'forge-missing-parent-publish-'),
    );
    const directPath = join(directRoot, 'missing', 'record.json');
    let caught: unknown;
    try {
      await publishImmutableFile(directPath, 'content\n');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ForgeDomainError);
    const domain = caught as ForgeDomainError;
    expect(domain).toMatchObject({
      code: 'STORAGE_FAILURE',
      path: ['immutableRecord'],
      message: 'IMMUTABLE_PUBLICATION_FAILED',
    });
    expect(domain.suppressed.length).toBeGreaterThan(0);
    expect(domain.suppressed[0]).toMatchObject({ code: 'ENOENT' });
    expect(
      JSON.stringify({
        code: domain.code,
        path: domain.path,
        message: domain.message,
      }),
    ).not.toContain(directRoot);
  });

  it('selects existing rig and pose revisions with explicit CAS across restart', async () => {
    const workspaceRoot = await mkdtemp(
      join(tmpdir(), 'forge-select-current-'),
    );
    const repository = new FileRigPoseLibraryRepository({ workspaceRoot });
    const firstRig = await rigWithRevision('d');
    const secondRig = await rigWithRevision('e');
    await repository.saveRig('guard.primary', firstRig, null);
    await repository.saveRig('guard.primary', secondRig, firstRig.profileId);
    await expect(
      repository.selectCurrentRig(
        'guard.primary',
        firstRig.profileId,
        secondRig.profileId,
      ),
    ).resolves.toMatchObject({ contentId: firstRig.profileId });
    await expect(
      repository.selectCurrentRig('guard.primary', secondRig.profileId, null),
    ).rejects.toThrow('REVISION_CONFLICT');

    const restarted = new FileRigPoseLibraryRepository({ workspaceRoot });
    await expect(
      restarted.getCurrentRig('guard.primary'),
    ).resolves.toMatchObject({
      contentId: firstRig.profileId,
    });
    await restarted.selectCurrentRig(
      'guard.primary',
      secondRig.profileId,
      firstRig.profileId,
    );
    await expect(
      restarted.selectCurrentRig(
        'guard.primary',
        `rig-v2.${hex('f')}`,
        secondRig.profileId,
      ),
    ).rejects.toThrow('REVISION_NOT_FOUND');

    const firstLibrary = await libraryForRig(firstRig, 'first');
    const secondLibrary = await libraryForRig(firstRig, 'second');
    await restarted.savePoseLibrary('guard.primary', firstLibrary, null);
    await restarted.savePoseLibrary(
      'guard.primary',
      secondLibrary,
      firstLibrary.libraryId,
    );
    await restarted.selectCurrentPoseLibrary(
      'guard.primary',
      firstLibrary.libraryId,
      secondLibrary.libraryId,
    );
    const restartedAgain = new FileRigPoseLibraryRepository({ workspaceRoot });
    await expect(
      restartedAgain.getCurrentPoseLibrary('guard.primary'),
    ).resolves.toMatchObject({ contentId: firstLibrary.libraryId });
  });

  it('serializes two-instance CAS races and times out on an unreleased lock', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'forge-race-rig-'));
    const firstRepository = new FileRigPoseLibraryRepository({ workspaceRoot });
    const secondRepository = new FileRigPoseLibraryRepository({
      workspaceRoot,
    });
    const firstRig = await rigWithRevision('6');
    const secondRig = await rigWithRevision('7');
    const outcomes = await Promise.allSettled([
      firstRepository.saveRig('guard.primary', firstRig, null),
      secondRepository.saveRig('guard.primary', secondRig, null),
    ]);
    expect(
      outcomes.filter(({ status }) => status === 'fulfilled'),
    ).toHaveLength(1);
    const rejected = outcomes.find(({ status }) => status === 'rejected');
    if (rejected?.status !== 'rejected')
      throw new Error('Expected one rejected CAS outcome.');
    const reason: unknown = rejected.reason;
    expect(reason).toBeInstanceOf(Error);
    if (!(reason instanceof Error))
      throw new Error('Expected an Error reason.');
    expect(reason.message).toBe('REVISION_CONFLICT');

    const lockedRoot = await mkdtemp(join(tmpdir(), 'forge-lock-rig-'));
    const lockPath = join(
      lockedRoot,
      '.forge',
      'rig-pose-libraries',
      'rig',
      'guard.primary.lock',
    );
    await mkdir(lockPath, { recursive: true });
    const lockedRepository = new FileRigPoseLibraryRepository({
      workspaceRoot: lockedRoot,
      lockTimeoutMilliseconds: 25,
    });
    await expect(
      lockedRepository.saveRig('guard.primary', firstRig, null),
    ).rejects.toThrow('LOCK_TIMEOUT');
  });
});
