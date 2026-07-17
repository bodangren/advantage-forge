import { describe, expect, it } from 'vitest';
import type { PortDefinition } from '../../src/contracts/index.js';

import {
  migrateAssetDocumentToCurrent,
  parseAssetDocument,
  parseAssetDocumentJson,
} from '../../src/document/index.js';
import { assetFixture } from './fixture.js';

describe('asset document parsing', () => {
  it('returns a deeply immutable valid document', () => {
    const result = parseAssetDocument(assetFixture());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.isFrozen(result.document)).toBe(true);
    expect(Object.isFrozen(result.document.assembly.parts)).toBe(true);
    expect(result.document.schemaVersion).toBe('1.0.0');
  });

  it.each([
    [
      'unknown field',
      (value: Record<string, unknown>) => {
        value['surprise'] = true;
      },
      'UNKNOWN_FIELD',
      '$.surprise',
    ],
    [
      'invalid unit',
      (value: Record<string, unknown>) => {
        value['unit'] = 'centimeter';
      },
      'INVALID_UNIT',
      '$.unit',
    ],
    [
      'invalid version',
      (value: Record<string, unknown>) => {
        value['schemaVersion'] = '2.0.0';
      },
      'UNSUPPORTED_VERSION',
      '$.schemaVersion',
    ],
  ])('rejects %s with a stable issue', (_label, mutate, code, path) => {
    const input = structuredClone(assetFixture()) as unknown as Record<
      string,
      unknown
    >;
    mutate(input);
    const result = parseAssetDocument(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({ code, path, severity: 'error' });
    expect(result.issues[0]?.guidance).toBeTruthy();
    expect(result.issues[0]).toHaveProperty('actual');
    expect(result.issues[0]).toHaveProperty('expected');
  });

  it('rejects unsupported shape kinds and non-finite values', () => {
    const kindInput = structuredClone(assetFixture()) as unknown as {
      templates: { shape: { kind: string } }[];
    };
    kindInput.templates[0]!.shape.kind = 'rawMesh';
    const kindResult = parseAssetDocument(kindInput);
    expect(kindResult.ok).toBe(false);

    const numberInput = structuredClone(assetFixture());
    numberInput.templates[0]!.shape = {
      kind: 'box',
      width: Number.POSITIVE_INFINITY,
      height: 1,
      depth: 1,
    };
    const numberResult = parseAssetDocument(numberInput);
    expect(numberResult.ok).toBe(false);
    if (!numberResult.ok)
      expect(
        numberResult.issues.some(({ code }) => code === 'NON_FINITE_VALUE'),
      ).toBe(true);
  });

  it('rejects render profiles with no drawable area or unknown required features', () => {
    const impossiblePadding = assetFixture();
    impossiblePadding.renderProfiles[0]!.widthPixels = 16;
    impossiblePadding.renderProfiles[0]!.heightPixels = 16;
    impossiblePadding.renderProfiles[0]!.paddingPixels = 8;
    const paddingResult = parseAssetDocument(impossiblePadding);
    expect(paddingResult.ok).toBe(false);
    if (!paddingResult.ok)
      expect(paddingResult.issues[0]?.path).toBe(
        '$.renderProfiles[0].paddingPixels',
      );

    const missingFeature = assetFixture();
    missingFeature.renderProfiles[0]!.requiredFeaturePartIds = ['part.missing'];
    const featureResult = parseAssetDocument(missingFeature);
    expect(featureResult.ok).toBe(false);
    if (!featureResult.ok)
      expect(featureResult.issues[0]?.path).toBe(
        '$.renderProfiles[0].requiredFeaturePartIds[0]',
      );
  });

  it('rejects duplicate semantic IDs', () => {
    const input = structuredClone(assetFixture());
    input.assembly.parts[1]!.id = input.assembly.parts[0]!.id;
    input.renderProfiles[0]!.requiredFeaturePartIds = [
      input.assembly.parts[0]!.id,
    ];
    const result = parseAssetDocument(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.code).toBe('DUPLICATE_ID');
  });

  it('scopes port IDs to their template while rejecting duplicates within one template', () => {
    const sharedPort: PortDefinition = {
      id: 'equipment.attach',
      frame: {
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0, 1] as [number, number, number, number],
        scale: [1, 1, 1] as [number, number, number],
      },
      tags: ['equipment.mount'],
      accepts: ['equipment.mount'],
      cardinality: 'single' as const,
    };
    const crossTemplate = assetFixture();
    crossTemplate.templates[0]!.ports = [structuredClone(sharedPort)];
    crossTemplate.templates[1]!.ports = [structuredClone(sharedPort)];
    expect(parseAssetDocument(crossTemplate).ok).toBe(true);

    const withinTemplate = assetFixture();
    withinTemplate.templates[0]!.ports = [
      structuredClone(sharedPort),
      structuredClone(sharedPort),
    ];
    const result = parseAssetDocument(withinTemplate);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.issues[0]).toMatchObject({
        code: 'DUPLICATE_ID',
        path: '$.templates[0].ports[1].id',
      });
  });

  it('returns a structured issue for invalid JSON text', () => {
    const result = parseAssetDocumentJson('{invalid');
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.issues[0]).toMatchObject({
        code: 'INVALID_VALUE',
        path: '$',
      });
  });

  it('rejects missing template, material, and slot references structurally', () => {
    const cases = [
      {
        mutate: (input: ReturnType<typeof assetFixture>) => {
          input.assembly.parts[0]!.templateId = 'template.missing';
        },
        code: 'UNKNOWN_REFERENCE',
        path: '$.assembly.parts[0].templateId',
      },
      {
        mutate: (input: ReturnType<typeof assetFixture>) => {
          input.assembly.parts[0]!.materialBindings[0]!.materialId =
            'material.missing';
        },
        code: 'UNKNOWN_REFERENCE',
        path: '$.assembly.parts[0].materialBindings[0].materialId',
      },
      {
        mutate: (input: ReturnType<typeof assetFixture>) => {
          input.assembly.parts[0]!.materialBindings[0]!.slot = 'slot.missing';
        },
        code: 'INVALID_MATERIAL_SLOT',
        path: '$.assembly.parts[0].materialBindings[0].slot',
      },
    ] as const;
    for (const entry of cases) {
      const input = assetFixture();
      entry.mutate(input);
      const result = parseAssetDocument(input);
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ code: entry.code, path: entry.path }),
          ]),
        );
    }
  });

  it('migrates only explicitly supported schema versions without guessing', () => {
    const current = assetFixture();
    const supported = migrateAssetDocumentToCurrent(current);
    expect(supported.ok).toBe(true);

    const future = { ...current, schemaVersion: '2.0.0' };
    const unsupported = migrateAssetDocumentToCurrent(future);
    expect(unsupported.ok).toBe(false);
    if (!unsupported.ok)
      expect(unsupported.issues[0]).toMatchObject({
        code: 'UNSUPPORTED_VERSION',
        path: '$.schemaVersion',
        actual: '2.0.0',
        expected: '1.0.0',
      });
    expect(future.schemaVersion).toBe('2.0.0');
  });
});
