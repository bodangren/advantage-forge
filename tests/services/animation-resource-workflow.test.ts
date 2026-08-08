import { describe, expect, it, vi } from 'vitest';

import {
  createAnimationResourceWorkflow,
  type AnimationResourceStore,
  type AnimationResourceStoreSaveInput,
} from '../../src/services/animation-resource-workflow.js';
import { validRigPayload } from '../contracts/rig-v2-fixture.js';

const hex = (character: string) => character.repeat(64);

function rigAuthoring() {
  const value = validRigPayload();
  return {
    rootPartId: value.rootPartId,
    rootJointId: value.rootJointId,
    assemblyHierarchy: value.assemblyHierarchy,
    joints: value.joints,
  };
}

function saveMock() {
  return vi.fn(async (input: AnimationResourceStoreSaveInput) => ({
    kind: input.kind,
    contentId: input.contentId,
    recordDigest: hex('9'),
    binding: input.binding,
  }));
}

function binding() {
  return {
    assetRevisionId: `revision.${hex('1')}`,
    morphologyRevisionId: `morphology.${hex('2')}`,
    equipmentSignature: `equipment.${hex('3')}`,
    assemblySignature: `assembly.${hex('4')}`,
  };
}

describe('asset-revision-bound animation resource workflow', () => {
  it('loads the exact asset revision and derives binding inputs inside the service', async () => {
    const get = vi.fn(async () => ({
      assetId: 'guard.library',
      revisionId: `revision.${hex('1')}`,
      createdAt: '2026-07-23T00:00:00.000Z',
      document: { id: 'guard.library' },
    }));
    const save = saveMock();
    const store: AnimationResourceStore = {
      save,
      getCurrent: async () => undefined,
      getExact: async () => undefined,
      rollbackCurrent: async () => {},
    };
    const workflow = createAnimationResourceWorkflow({
      revisions: { get } as never,
      deriveBinding: async () => binding(),
      store,
    });

    const receipt = await workflow.mutate({
      animationLibrary: {
        resourceKind: 'rig',
        operation: 'create',
        assetId: 'guard.library',
        assetRevisionId: `revision.${hex('1')}`,
        streamId: 'guard.animation',
        expectedCurrentResourceId: null,
        dryRun: false,
        authoring: rigAuthoring(),
      },
    });

    expect(get).toHaveBeenCalledWith('guard.library', `revision.${hex('1')}`);
    expect(save).toHaveBeenCalledOnce();
    const saved = save.mock.calls[0]![0];
    expect(saved.kind).toBe('rig');
    expect(saved.expectedCurrentId).toBeNull();
    expect(saved.binding.assetRevisionId).toBe(`revision.${hex('1')}`);
    expect(saved.binding.morphologyRevisionId).toBe(`morphology.${hex('2')}`);
    expect(receipt).toMatchObject({
      contractId: 'forge-animation-resource-public/v1',
      resourceKind: 'rig',
      assetRevisionId: `revision.${hex('1')}`,
      dryRun: false,
      status: 'applied',
    });
    expect(JSON.stringify(receipt)).not.toContain('/home/');
  });

  it('rejects missing exact revisions before touching the resource store', async () => {
    const save = saveMock();
    const workflow = createAnimationResourceWorkflow({
      revisions: { get: vi.fn(async () => undefined) } as never,
      deriveBinding: vi.fn(),
      store: {
        save,
        getCurrent: async () => undefined,
        getExact: async () => undefined,
        rollbackCurrent: async () => {},
      },
    });
    await expect(
      workflow.mutate({
        animationLibrary: {
          resourceKind: 'rig',
          operation: 'create',
          assetId: 'guard.library',
          assetRevisionId: `revision.${hex('1')}`,
          streamId: 'guard.animation',
          expectedCurrentResourceId: null,
          dryRun: false,
          authoring: rigAuthoring(),
        },
      }),
    ).rejects.toMatchObject({
      code: 'REVISION_NOT_FOUND',
      path: ['animationLibrary', 'assetRevisionId'],
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('keeps dry-run validation side-effect free', async () => {
    const save = saveMock();
    const workflow = createAnimationResourceWorkflow({
      revisions: {
        get: vi.fn(async () => ({
          assetId: 'guard.library',
          revisionId: `revision.${hex('1')}`,
          document: { id: 'guard.library' },
        })),
      } as never,
      deriveBinding: async () => binding(),
      store: {
        save,
        getCurrent: async () => ({
          kind: 'rig',
          contentId: `rig-v2.${hex('5')}`,
          recordDigest: hex('6'),
          binding: binding(),
        }),
        getExact: async () => undefined,
        rollbackCurrent: async () => {},
      },
    });
    const receipt = await workflow.mutate({
      animationLibrary: {
        resourceKind: 'rig',
        operation: 'revise',
        assetId: 'guard.library',
        assetRevisionId: `revision.${hex('1')}`,
        streamId: 'guard.animation',
        expectedCurrentResourceId: `rig-v2.${hex('5')}`,
        dryRun: true,
        authoring: rigAuthoring(),
      },
    });
    expect(receipt).toMatchObject({ status: 'preview', dryRun: true });
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects stale dry-run CAS and cross-revision current selection', async () => {
    const save = saveMock();
    const selectCurrent = vi.fn();
    const base = {
      revisions: {
        get: vi.fn(async () => ({
          assetId: 'guard.library',
          revisionId: `revision.${hex('1')}`,
          document: { id: 'guard.library' },
        })),
      } as never,
      deriveBinding: async () => binding(),
    };
    const stale = createAnimationResourceWorkflow({
      ...base,
      store: {
        save,
        getCurrent: async () => undefined,
        getExact: async () => undefined,
        rollbackCurrent: async () => {},
      },
    });
    await expect(
      stale.mutate({
        animationLibrary: {
          resourceKind: 'rig',
          operation: 'revise',
          assetId: 'guard.library',
          assetRevisionId: `revision.${hex('1')}`,
          streamId: 'guard.animation',
          expectedCurrentResourceId: `rig-v2.${hex('5')}`,
          dryRun: true,
          authoring: rigAuthoring(),
        },
      }),
    ).rejects.toMatchObject({ code: 'STALE_REVISION' });

    const crossBound = createAnimationResourceWorkflow({
      ...base,
      store: {
        save,
        getCurrent: async () => undefined,
        getExact: async () => ({
          kind: 'rig',
          contentId: `rig-v2.${hex('7')}`,
          recordDigest: hex('8'),
          binding: { ...binding(), assetRevisionId: `revision.${hex('9')}` },
        }),
        selectCurrent,
        rollbackCurrent: async () => {},
      },
    });
    await expect(
      crossBound.mutate({
        animationLibrary: {
          resourceKind: 'rig',
          operation: 'select_current',
          assetId: 'guard.library',
          assetRevisionId: `revision.${hex('1')}`,
          streamId: 'guard.animation',
          expectedCurrentResourceId: null,
          targetResourceId: `rig-v2.${hex('7')}`,
          dryRun: false,
        },
      }),
    ).rejects.toMatchObject({ code: 'BINDING_MISMATCH' });
    expect(selectCurrent).not.toHaveBeenCalled();
  });

  it('rejects a persisted record that does not match the requested resource', async () => {
    const rollbackCurrent = vi.fn(async () => {});
    const save = vi.fn(async (input: AnimationResourceStoreSaveInput) => ({
      kind: input.kind,
      contentId: input.contentId,
      recordDigest: 'invalid',
      binding: input.binding,
    }));
    const workflow = createAnimationResourceWorkflow({
      revisions: {
        get: vi.fn(async () => ({
          assetId: 'guard.library',
          revisionId: `revision.${hex('1')}`,
          document: { id: 'guard.library' },
        })),
      } as never,
      deriveBinding: async () => binding(),
      store: {
        save,
        getCurrent: async () => undefined,
        getExact: async () => undefined,
        rollbackCurrent,
      },
    });
    await expect(
      workflow.mutate({
        animationLibrary: {
          resourceKind: 'rig',
          operation: 'create',
          assetId: 'guard.library',
          assetRevisionId: `revision.${hex('1')}`,
          streamId: 'guard.animation',
          expectedCurrentResourceId: null,
          dryRun: false,
          authoring: rigAuthoring(),
        },
      }),
    ).rejects.toMatchObject({ code: 'STORAGE_FAILURE' });
    expect(rollbackCurrent).toHaveBeenCalledOnce();
  });

  it('sanitizes revision repository failures before resource access', async () => {
    const save = saveMock();
    const workflow = createAnimationResourceWorkflow({
      revisions: {
        get: vi.fn(async () => {
          throw new Error('/home/private/revisions.json');
        }),
      } as never,
      deriveBinding: async () => binding(),
      store: {
        save,
        getCurrent: async () => undefined,
        getExact: async () => undefined,
        rollbackCurrent: async () => {},
      },
    });
    await expect(
      workflow.mutate({
        animationLibrary: {
          resourceKind: 'rig',
          operation: 'create',
          assetId: 'guard.library',
          assetRevisionId: `revision.${hex('1')}`,
          streamId: 'guard.animation',
          expectedCurrentResourceId: null,
          dryRun: false,
          authoring: rigAuthoring(),
        },
      }),
    ).rejects.toMatchObject({
      code: 'STORAGE_FAILURE',
      message: 'Animation resource storage failed.',
    });
    expect(save).not.toHaveBeenCalled();
  });
});
