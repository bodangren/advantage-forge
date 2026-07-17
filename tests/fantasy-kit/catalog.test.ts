import { describe, expect, it } from 'vitest';
import { AssetDocumentSchema } from '../../src/contracts/index.js';
import { evaluateAssembly } from '../../src/assembly/index.js';
import {
  adventurerDocument,
  adventurerPoses,
  adventurerVariants,
  referenceDocuments,
  rusticManifest,
} from '../../src/fantasy-kit/index.js';

describe('rustic fantasy kit', () => {
  it('publishes complete semantic manifests', () => {
    expect(rusticManifest.length).toBeGreaterThanOrEqual(20);
    for (const entry of rusticManifest) {
      expect(entry.template.role).not.toHaveLength(0);
      expect(entry.template.materialSlots.length).toBeGreaterThan(0);
      expect(entry.intendedReferences.length).toBeGreaterThan(0);
      expect(Object.keys(entry.parameterBounds).length).toBeGreaterThan(0);
      for (const templatePort of entry.template.ports) {
        expect(templatePort.tags.length).toBeGreaterThan(0);
        expect(templatePort.accepts.length).toBeGreaterThan(0);
      }
    }
  });
  it('validates and builds every reference through shared contracts', () => {
    for (const document of Object.values(referenceDocuments)) {
      expect(AssetDocumentSchema.parse(document)).toEqual(document);
      const summary = evaluateAssembly(document.assembly, document.templates);
      expect(summary.parts.length).toBe(document.assembly.parts.length);
      expect(summary.triangleCount).toBeGreaterThan(0);
    }
  });
  it('builds four proportions, equipment states, and two rigid poses', () => {
    expect(adventurerVariants.map(({ id }) => id)).toEqual([
      'short',
      'tall',
      'broad',
      'slender',
      'equipped',
      'unequipped',
    ]);
    expect(adventurerPoses.map(({ id }) => id)).toEqual(['idle', 'action']);
    for (const variant of adventurerVariants)
      expect(
        evaluateAssembly(
          adventurerDocument.assembly,
          adventurerDocument.templates,
          { variant },
        ).triangleCount,
      ).toBeGreaterThan(0);
    for (const pose of adventurerPoses)
      expect(
        evaluateAssembly(
          adventurerDocument.assembly,
          adventurerDocument.templates,
          { pose },
        ).triangleCount,
      ).toBeGreaterThan(0);
  });
  it('contains no raw-mesh or executable escape hatch', () => {
    expect(JSON.stringify(referenceDocuments)).not.toMatch(
      /boolean|eval|script|rawMesh|vertices/i,
    );
  });
});
