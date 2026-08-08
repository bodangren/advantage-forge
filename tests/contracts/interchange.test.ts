import { describe, expect, it } from 'vitest';

import {
  ForgeAssetInterchangeManifestSchema,
  canonicalForgeAssetInterchangeManifest,
  forgeAssetInterchangeManifestSha256,
  parseForgeAssetInterchangeManifest,
  type ForgeAssetInterchangeManifest,
} from '../../src/contracts/index.js';

const REVISION =
  'revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const DIGEST =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const GOLDEN_MANIFEST_SHA256 =
  'f56c7a0c1fffe6555e35d8f47ca7ca418197e6f2c28328e30ac3c7d94fef2096';
const GOLDEN_CANONICAL = [
  '{"artifacts":[{"byte_length":128,"classification":"source","direction":"N","height":128,"id":"frame.n","media_type":"image/png","reference":"artifacts/adventurer/n.png","revision_id":"revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","role":"directional_frame","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","transparent":true,"width":128},{"byte_length":128,"classification":"source","direction":"NE","height":128,"id":"frame.ne","media_type":"image/png","reference":"artifacts/adventurer/ne.png","revision_id":"revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","role":"directional_frame","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","transparent":true,"width":128},{"byte_length":128,"classification":"source","direction":"E","height":128,"id":"frame.e","media_type":"image/png","reference":"artifacts/adventurer/e.png","revision_id":"revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","role":"directional_frame","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","transparent":true,"width":128},',
  '{"byte_length":128,"classification":"source","direction":"SE","height":128,"id":"frame.se","media_type":"image/png","reference":"artifacts/adventurer/se.png","revision_id":"revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","role":"directional_frame","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","transparent":true,"width":128},{"byte_length":128,"classification":"source","direction":"S","height":128,"id":"frame.s","media_type":"image/png","reference":"artifacts/adventurer/s.png","revision_id":"revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","role":"directional_frame","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","transparent":true,"width":128},{"byte_length":128,"classification":"source","direction":"SW","height":128,"id":"frame.sw","media_type":"image/png","reference":"artifacts/adventurer/sw.png","revision_id":"revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","role":"directional_frame","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","transparent":true,"width":128},',
  '{"byte_length":128,"classification":"source","direction":"W","height":128,"id":"frame.w","media_type":"image/png","reference":"artifacts/adventurer/w.png","revision_id":"revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","role":"directional_frame","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","transparent":true,"width":128},{"byte_length":128,"classification":"source","direction":"NW","height":128,"id":"frame.nw","media_type":"image/png","reference":"artifacts/adventurer/nw.png","revision_id":"revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","role":"directional_frame","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","transparent":true,"width":128},{"byte_length":512,"classification":"source","id":"model.glb","media_type":"model/gltf-binary","reference":"artifacts/adventurer/adventurer.rustic.glb","revision_id":"revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","role":"glb","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"},',
  '{"byte_length":256,"classification":"derived","height":128,"id":"review.contact-sheet","media_type":"image/png","reference":"artifacts/adventurer/contact-sheet.png","revision_id":"revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","role":"contact_sheet","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","transparent":false,"width":1024}],"contract_id":"forge-asset-interchange-manifest/v1","evidence":[{"id":"render.manifest","kind":"render_manifest","reference":"evidence/render-manifest.json","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"},{"id":"workflow.public-mcp","kind":"workflow","reference":"evidence/public-mcp-workflow.json","sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"}],"provenance":{"license_label":"project-owned","ownership":"project_owned","source_kind":"project_generated","workflow_reference":"evidence/public-mcp-workflow.json"},"render_profile":{"id":"fantasy.sprite.orthographic.v1","version":"1.0.0"},"source":{"asset_id":"adventurer.rustic","revision_id":"revision.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"},"style_profile":{"id":"cute_chibi_v1","review":{"status":"not_required"},"version":"1.0.0"}}',
].join('');

function manifestFixture(
  overrides: Partial<ForgeAssetInterchangeManifest> = {},
): ForgeAssetInterchangeManifest {
  return {
    contract_id: 'forge-asset-interchange-manifest/v1',
    manifest_sha256: DIGEST,
    source: {
      asset_id: 'adventurer.rustic',
      revision_id: REVISION,
    },
    style_profile: {
      id: 'cute_chibi_v1',
      version: '1.0.0',
      review: { status: 'not_required' },
    },
    render_profile: {
      id: 'fantasy.sprite.orthographic.v1',
      version: '1.0.0',
    },
    provenance: {
      source_kind: 'project_generated',
      workflow_reference: 'evidence/public-mcp-workflow.json',
      ownership: 'project_owned',
      license_label: 'project-owned',
    },
    artifacts: [
      ...DIRECTIONS.map((direction) => ({
        id: `frame.${direction.toLowerCase()}`,
        classification: 'source' as const,
        role: 'directional_frame' as const,
        media_type: 'image/png' as const,
        byte_length: 128,
        sha256: DIGEST,
        width: 128,
        height: 128,
        revision_id: REVISION,
        reference: `artifacts/adventurer/${direction.toLowerCase()}.png`,
        direction,
        transparent: true,
      })),
      {
        id: 'model.glb',
        classification: 'source',
        role: 'glb',
        media_type: 'model/gltf-binary',
        byte_length: 512,
        sha256: DIGEST,
        revision_id: REVISION,
        reference: 'artifacts/adventurer/adventurer.rustic.glb',
      },
      {
        id: 'review.contact-sheet',
        classification: 'derived',
        role: 'contact_sheet',
        media_type: 'image/png',
        byte_length: 256,
        sha256: DIGEST,
        width: 1024,
        height: 128,
        revision_id: REVISION,
        reference: 'artifacts/adventurer/contact-sheet.png',
        transparent: false,
      },
    ],
    evidence: [
      {
        id: 'render.manifest',
        kind: 'render_manifest',
        reference: 'evidence/render-manifest.json',
        sha256: DIGEST,
      },
      {
        id: 'workflow.public-mcp',
        kind: 'workflow',
        reference: 'evidence/public-mcp-workflow.json',
        sha256: DIGEST,
      },
    ],
    ...overrides,
  };
}

async function signedFixture(
  overrides: Partial<ForgeAssetInterchangeManifest> = {},
): Promise<ForgeAssetInterchangeManifest> {
  const manifest = manifestFixture(overrides);
  manifest.manifest_sha256 =
    await forgeAssetInterchangeManifestSha256(manifest);
  return manifest;
}

describe('forge-asset-interchange-manifest/v1', () => {
  it('parses a canonical digest-pinned portable source delivery', async () => {
    const manifest = await signedFixture();

    await expect(parseForgeAssetInterchangeManifest(manifest)).resolves.toEqual(
      manifest,
    );
    expect(canonicalForgeAssetInterchangeManifest(manifest)).toBe(
      canonicalForgeAssetInterchangeManifest({
        ...manifest,
        source: {
          revision_id: manifest.source.revision_id,
          asset_id: manifest.source.asset_id,
        },
      }),
    );
    expect(canonicalForgeAssetInterchangeManifest(manifest)).toBe(
      GOLDEN_CANONICAL,
    );
    expect(manifest.manifest_sha256).toBe(GOLDEN_MANIFEST_SHA256);
  });

  it('rejects unknown fields and a digest mismatch', async () => {
    expect(
      ForgeAssetInterchangeManifestSchema.safeParse({
        ...manifestFixture(),
        internal_handler: 'src/tools/handlers.ts',
      }).success,
    ).toBe(false);

    const mismatched = await signedFixture();
    mismatched.manifest_sha256 = DIGEST;
    await expect(
      parseForgeAssetInterchangeManifest(mismatched),
    ).rejects.toThrow(/manifest_sha256/i);
  });

  it.each([
    '/tmp/asset.png',
    '../asset.png',
    'artifacts/../asset.png',
    String.raw`C:\\assets\\asset.png`,
    'https://example.com/asset.png',
  ])('rejects nonportable reference %s', (reference) => {
    const manifest = manifestFixture();
    manifest.artifacts[0] = { ...manifest.artifacts[0]!, reference };
    expect(
      ForgeAssetInterchangeManifestSchema.safeParse(manifest).success,
    ).toBe(false);
  });

  it('requires exactly eight source directions and a GLB at the pinned revision', () => {
    const withoutGlb = manifestFixture({
      artifacts: manifestFixture().artifacts.filter(
        ({ role }) => role !== 'glb',
      ),
    });
    expect(
      ForgeAssetInterchangeManifestSchema.safeParse(withoutGlb).success,
    ).toBe(false);

    const missingDirection = manifestFixture({
      artifacts: manifestFixture().artifacts.filter(
        (artifact) => artifact.direction !== 'NW',
      ),
    });
    expect(
      ForgeAssetInterchangeManifestSchema.safeParse(missingDirection).success,
    ).toBe(false);

    const stale = manifestFixture();
    stale.artifacts[0] = {
      ...stale.artifacts[0]!,
      revision_id:
        'revision.abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    };
    expect(ForgeAssetInterchangeManifestSchema.safeParse(stale).success).toBe(
      false,
    );
  });

  it('requires closed manifest-bound provenance and evidence', () => {
    expect(
      ForgeAssetInterchangeManifestSchema.safeParse({
        ...manifestFixture(),
        provenance: {
          source_kind: 'project_generated',
          workflow_reference: 'evidence/public-mcp-workflow.json',
          ownership: 'licensed',
          license_label: 'unknown',
        },
      }).success,
    ).toBe(false);
    expect(
      ForgeAssetInterchangeManifestSchema.safeParse({
        ...manifestFixture(),
        evidence: manifestFixture().evidence.filter(
          ({ reference }) => reference !== 'evidence/public-mcp-workflow.json',
        ),
      }).success,
    ).toBe(false);
  });

  it.each([
    'ftp://example.com/source',
    'https://user:pass@example.com/source',
    'https://',
    `https://example.com/${'a'.repeat(2_030)}`,
  ])('rejects invalid provenance source_url %s', (source_url) => {
    expect(
      ForgeAssetInterchangeManifestSchema.safeParse({
        ...manifestFixture(),
        provenance: {
          ...manifestFixture().provenance,
          source_url,
        },
      }).success,
    ).toBe(false);
  });

  it('accepts a bounded credential-free HTTP(S) provenance source_url', () => {
    expect(
      ForgeAssetInterchangeManifestSchema.safeParse({
        ...manifestFixture(),
        provenance: {
          ...manifestFixture().provenance,
          source_url: 'https://example.com/source',
        },
      }).success,
    ).toBe(true);
  });

  it('requires executable PNG transparency declarations', () => {
    const opaqueFrame = manifestFixture();
    opaqueFrame.artifacts[0] = {
      ...opaqueFrame.artifacts[0]!,
      transparent: false,
    };
    expect(
      ForgeAssetInterchangeManifestSchema.safeParse(opaqueFrame).success,
    ).toBe(false);

    const undeclaredDerived = manifestFixture();
    const contactIndex = undeclaredDerived.artifacts.findIndex(
      ({ role }) => role === 'contact_sheet',
    );
    const withoutTransparency = {
      ...undeclaredDerived.artifacts[contactIndex]!,
    };
    delete withoutTransparency.transparent;
    undeclaredDerived.artifacts[contactIndex] = withoutTransparency;
    expect(
      ForgeAssetInterchangeManifestSchema.safeParse(undeclaredDerived).success,
    ).toBe(false);

    const rasterFlagOnGlb = manifestFixture();
    const glbIndex = rasterFlagOnGlb.artifacts.findIndex(
      ({ role }) => role === 'glb',
    );
    rasterFlagOnGlb.artifacts[glbIndex] = {
      ...rasterFlagOnGlb.artifacts[glbIndex]!,
      transparent: false,
    };
    expect(
      ForgeAssetInterchangeManifestSchema.safeParse(rasterFlagOnGlb).success,
    ).toBe(false);
  });

  it.each([
    ['directional_frame', 'derived', 'image/png'],
    ['glb', 'derived', 'model/gltf-binary'],
    ['contact_sheet', 'source', 'image/png'],
    ['sprite_atlas', 'source', 'image/png'],
    ['clip_metadata', 'source', 'application/json'],
  ] as const)(
    'rejects invalid %s classification',
    (role, classification, media_type) => {
      const manifest = manifestFixture();
      manifest.artifacts[0] = {
        ...manifest.artifacts[0]!,
        role,
        classification,
        media_type,
      };
      expect(
        ForgeAssetInterchangeManifestSchema.safeParse(manifest).success,
      ).toBe(false);
    },
  );

  it('keeps style and implemented render profiles distinct', () => {
    const heroic = manifestFixture({
      style_profile: {
        id: 'heroic_stylized_v1',
        version: '1.0.0',
        review: {
          status: 'recorded',
          attestation: 'original-project-owned-no-franchise-copy',
          evidence_reference: 'evidence/originality-review.json',
        },
      },
      evidence: [
        ...manifestFixture().evidence,
        {
          id: 'style.originality',
          kind: 'originality_review',
          reference: 'evidence/originality-review.json',
          sha256: DIGEST,
        },
      ],
    });
    expect(ForgeAssetInterchangeManifestSchema.safeParse(heroic).success).toBe(
      true,
    );

    heroic.evidence = heroic.evidence.filter(
      ({ reference }) => reference !== 'evidence/originality-review.json',
    );
    expect(ForgeAssetInterchangeManifestSchema.safeParse(heroic).success).toBe(
      false,
    );
    heroic.evidence = manifestFixture().evidence;
    heroic.style_profile.review = { status: 'not_required' };
    expect(ForgeAssetInterchangeManifestSchema.safeParse(heroic).success).toBe(
      false,
    );

    expect(
      ForgeAssetInterchangeManifestSchema.safeParse({
        ...manifestFixture(),
        render_profile: {
          id: 'cute_chibi_v1',
          version: '1.0.0',
        },
      }).success,
    ).toBe(false);
  });

  it.each(['style_profile', 'render_profile'] as const)(
    'rejects unsupported %s version negotiation',
    (profile) => {
      expect(
        ForgeAssetInterchangeManifestSchema.safeParse({
          ...manifestFixture(),
          [profile]: {
            ...manifestFixture()[profile],
            version: '9.0.0',
          },
        }).success,
      ).toBe(false);
    },
  );
});
