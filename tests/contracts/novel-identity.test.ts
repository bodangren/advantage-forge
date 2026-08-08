import { describe, expect, it } from 'vitest';

import { AssetDocumentSchema } from '../../src/contracts/index.js';
import { referenceDocuments } from '../../src/fantasy-kit/index.js';

const novelIdentity = {
  contractId: 'forge-novel-asset-identity/v1',
  origin: 'novel',
  family: 'humanoid',
  archetypeId: 'humanoid.biped.rustic',
  styleProfile: {
    id: 'cute_chibi_v1',
    version: '1.0.0',
    review: { status: 'not_required' },
  },
  renderProfile: {
    id: 'fantasy.sprite.orthographic.v1',
    version: '1.0.0',
  },
} as const;

describe('forge-novel-asset-identity/v1 contracts', () => {
  it('accepts closed novel-origin metadata on a canonical asset document', () => {
    const document = structuredClone(referenceDocuments.adventurer) as Record<
      string,
      unknown
    >;
    document['id'] = 'guard.moonwatch';
    document['name'] = 'Moonwatch Guard';
    document['novelIdentity'] = novelIdentity;

    expect(AssetDocumentSchema.safeParse(document)).toMatchObject({
      success: true,
      data: { novelIdentity },
    });
  });

  it('rejects unknown identity metadata and mismatched family/archetype pairs', () => {
    const document = structuredClone(referenceDocuments.crate) as Record<
      string,
      unknown
    >;
    document['id'] = 'barrel.ironbound';
    document['novelIdentity'] = {
      ...novelIdentity,
      family: 'standalone-prop',
      archetypeId: 'humanoid.biped.rustic',
      sourcePath: '/private/forge/source.ts',
    };

    const result = AssetDocumentSchema.safeParse(document);
    expect(result.success).toBe(false);
    if (result.success)
      throw new Error('Expected identity validation failure.');
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        code: 'unrecognized_keys',
        keys: ['sourcePath'],
        path: ['novelIdentity'],
      }),
    );

    delete (document['novelIdentity'] as Record<string, unknown>)['sourcePath'];
    const mismatch = AssetDocumentSchema.safeParse(document);
    expect(mismatch.success).toBe(false);
    if (mismatch.success) throw new Error('Expected archetype mismatch.');
    expect(mismatch.error.issues.map(({ path }) => path.join('.'))).toContain(
      'novelIdentity.archetypeId',
    );
  });
});
