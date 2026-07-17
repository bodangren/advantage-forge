import { describe, expect, it } from 'vitest';

import {
  applySemanticPatch,
  canonicalJson,
  validateSemanticPatch,
} from '../../src/document/index.js';
import { assetFixture } from './fixture.js';

describe('semantic document patches', () => {
  it('changes only the addressed part and preserves the input revision', () => {
    const document = assetFixture();
    const untouchedBefore = canonicalJson(document.assembly.parts[1]);
    const result = applySemanticPatch(document, {
      operations: [
        {
          operation: 'setPartTransform',
          partId: 'part.torso',
          transform: {
            position: [0, 0.9, 0],
            rotation: [0, 0, 0, 1],
            scale: [1, 1, 1],
          },
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.document.assembly.parts.find(({ id }) => id === 'part.torso')
        ?.transform.position[1],
    ).toBe(0.9);
    expect(
      canonicalJson(
        result.document.assembly.parts.find(({ id }) => id === 'part.head'),
      ),
    ).toBe(untouchedBefore);
    expect(document.assembly.parts[0]?.transform.position[1]).toBe(0.8);
    expect(result.affectedIds).toEqual(['part.torso']);
  });

  it('rejects unknown operations, missing targets, and connected removal', () => {
    expect(
      applySemanticPatch(assetFixture(), {
        operations: [{ operation: 'setVertex', id: 1 }],
      }).ok,
    ).toBe(false);
    expect(
      applySemanticPatch(assetFixture(), {
        operations: [{ operation: 'removePart', partId: 'part.missing' }],
      }).ok,
    ).toBe(false);
    expect(
      applySemanticPatch(assetFixture(), {
        operations: [
          {
            operation: 'setPartVisibility',
            partId: 'part.missing',
            visible: false,
          },
        ],
      }).ok,
    ).toBe(false);
    expect(
      applySemanticPatch(assetFixture(), {
        operations: [
          { operation: 'disconnectParts', connectionId: 'connection.missing' },
        ],
      }).ok,
    ).toBe(false);
  });

  it('edits one part shape locally and rejects no-op or generator changes', () => {
    const document = assetFixture();
    const templateBefore = JSON.stringify(document.templates);
    const siblingBefore = JSON.stringify(document.assembly.parts[1]);
    const changed = applySemanticPatch(document, {
      operations: [
        {
          operation: 'setPartShapeParameters',
          partId: 'part.torso',
          shape: { kind: 'box', width: 0.6, height: 0.7, depth: 0.3 },
        },
      ],
    });
    expect(changed.ok).toBe(true);
    if (!changed.ok) return;
    expect(
      changed.document.assembly.parts.find(({ id }) => id === 'part.torso')
        ?.shape,
    ).toEqual({ kind: 'box', width: 0.6, height: 0.7, depth: 0.3 });
    expect(JSON.stringify(changed.document.templates)).toBe(templateBefore);
    expect(JSON.stringify(changed.document.assembly.parts[1])).toBe(
      siblingBefore,
    );
    expect(document.assembly.parts[0]?.shape).toBeUndefined();
    expect(changed.affectedIds).toEqual(['part.torso']);

    const noOp = applySemanticPatch(document, {
      operations: [
        {
          operation: 'setPartShapeParameters',
          partId: 'part.torso',
          shape: { kind: 'box', width: 0.5, height: 0.7, depth: 0.3 },
        },
      ],
    });
    expect(noOp.ok).toBe(false);
    expect(document.assembly.parts[0]?.shape).toBeUndefined();
    expect(
      applySemanticPatch(document, {
        operations: [
          {
            operation: 'setPartShapeParameters',
            partId: 'part.torso',
            shape: {
              kind: 'ellipsoid',
              radiusX: 0.2,
              radiusY: 0.2,
              radiusZ: 0.2,
              widthSegments: 8,
              heightSegments: 6,
            },
          },
        ],
      }).ok,
    ).toBe(false);
    expect(
      validateSemanticPatch({
        operations: [
          {
            operation: 'setPartShapeParameters',
            partId: 'part.torso',
            shape: { kind: 'box', width: 0.6, height: 0.7, depth: 0.3 },
            rawMesh: [],
          },
        ],
      }),
    ).toBe(false);
  });

  it('upserts named poses without replacing unrelated values', () => {
    const result = applySemanticPatch(assetFixture(), {
      operations: [
        {
          operation: 'upsertPose',
          pose: {
            id: 'pose.wave',
            overrides: [{ partId: 'part.head', jointValueDegrees: 10 }],
          },
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.document.poses[0]?.id).toBe('pose.wave');
  });

  it('supports the bounded assembly operation catalog', () => {
    const addedPart = {
      id: 'part.extra',
      templateId: 'template.head',
      transform: {
        position: [1, 1, 0] as [number, number, number],
        rotation: [0, 0, 0, 1] as [number, number, number, number],
        scale: [1, 1, 1] as [number, number, number],
      },
      materialBindings: [{ slot: 'surface', materialId: 'material.cloth' }],
      visible: true,
    };
    const connection = {
      id: 'connection.extra',
      parentPartId: 'part.torso',
      parentPortId: 'port.parent',
      childPartId: 'part.extra',
      childPortId: 'port.child',
    };
    const result = applySemanticPatch(assetFixture(), {
      operations: [
        { operation: 'addPart', part: addedPart },
        {
          operation: 'setPartVisibility',
          partId: 'part.extra',
          visible: false,
        },
        { operation: 'connectParts', connection },
        { operation: 'disconnectParts', connectionId: 'connection.extra' },
        { operation: 'removePart', partId: 'part.extra' },
        {
          operation: 'upsertVariant',
          variant: {
            id: 'variant.broad',
            overrides: [{ partId: 'part.torso', visible: true }],
          },
        },
        {
          operation: 'setActiveVariant',
          variantId: 'variant.broad',
        },
        {
          operation: 'setMaterialBinding',
          partId: 'part.torso',
          slot: 'surface',
          materialId: 'material.cloth',
        },
        {
          operation: 'upsertRenderProfile',
          renderProfile: {
            id: 'render.preview',
            widthPixels: 128,
            heightPixels: 128,
            elevationDegrees: 35,
            directions: 4,
            paddingPixels: 4,
            transparent: true,
            minimumFeaturePixels: 3,
            requiredFeaturePartIds: ['part.head'],
          },
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.variants[0]?.id).toBe('variant.broad');
    expect(result.document.activeVariantId).toBe('variant.broad');
    expect(
      result.document.renderProfiles.some(({ id }) => id === 'render.preview'),
    ).toBe(true);
    expect(
      result.document.assembly.parts.some(({ id }) => id === 'part.extra'),
    ).toBe(false);
    expect(
      validateSemanticPatch({
        operations: [{ operation: 'removePart', partId: 'part.extra' }],
      }),
    ).toBe(true);
    expect(validateSemanticPatch({ operations: [] })).toBe(false);
  });

  it('rejects duplicate additions, connections, connected removal, and invalid resulting documents', () => {
    const duplicatePart = structuredClone(assetFixture().assembly.parts[0]!);
    expect(
      applySemanticPatch(assetFixture(), {
        operations: [{ operation: 'addPart', part: duplicatePart }],
      }).ok,
    ).toBe(false);
    const connection = {
      id: 'connection.one',
      parentPartId: 'part.torso',
      parentPortId: 'port.parent',
      childPartId: 'part.head',
      childPortId: 'port.child',
    };
    const connected = applySemanticPatch(assetFixture(), {
      operations: [{ operation: 'connectParts', connection }],
    });
    expect(connected.ok).toBe(true);
    if (!connected.ok) return;
    expect(
      applySemanticPatch(connected.document, {
        operations: [{ operation: 'connectParts', connection }],
      }).ok,
    ).toBe(false);
    expect(
      applySemanticPatch(connected.document, {
        operations: [{ operation: 'removePart', partId: 'part.head' }],
      }).ok,
    ).toBe(false);
    const invalidResult = applySemanticPatch(assetFixture(), {
      operations: [
        {
          operation: 'addPart',
          part: { ...duplicatePart, id: 'template.torso' },
        },
      ],
    });
    expect(invalidResult.ok).toBe(false);
  });

  it('rejects unknown variants, material slots, and materials without mutation', () => {
    for (const operation of [
      { operation: 'setActiveVariant', variantId: 'variant.missing' },
      {
        operation: 'setMaterialBinding',
        partId: 'part.torso',
        slot: 'slot.missing',
        materialId: 'material.cloth',
      },
      {
        operation: 'setMaterialBinding',
        partId: 'part.torso',
        slot: 'surface',
        materialId: 'material.missing',
      },
      {
        operation: 'setMaterialBinding',
        partId: 'part.missing',
        slot: 'surface',
        materialId: 'material.cloth',
      },
    ] as const) {
      const document = assetFixture();
      const before = canonicalJson(document);
      const result = applySemanticPatch(document, { operations: [operation] });
      expect(result.ok).toBe(false);
      expect(canonicalJson(document)).toBe(before);
    }
  });

  it('replaces existing named definitions', () => {
    const withPose = applySemanticPatch(assetFixture(), {
      operations: [
        { operation: 'upsertPose', pose: { id: 'pose.wave', overrides: [] } },
      ],
    });
    if (!withPose.ok) throw new Error('pose fixture failed');
    const replaced = applySemanticPatch(withPose.document, {
      operations: [
        {
          operation: 'upsertPose',
          pose: {
            id: 'pose.wave',
            overrides: [{ partId: 'part.head', jointValueDegrees: 20 }],
          },
        },
        {
          operation: 'upsertRenderProfile',
          renderProfile: {
            ...withPose.document.renderProfiles[0]!,
            paddingPixels: 10,
          },
        },
      ],
    });
    expect(replaced.ok).toBe(true);
    if (replaced.ok) {
      expect(replaced.document.poses).toHaveLength(1);
      expect(replaced.document.renderProfiles).toHaveLength(1);
      expect(replaced.document.renderProfiles[0]?.paddingPixels).toBe(10);
    }
  });
});
