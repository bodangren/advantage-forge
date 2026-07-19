import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { AssetDocumentSchema } from '../../src/contracts/index.js';
import { evaluateAssembly } from '../../src/assembly/index.js';
import {
  KitTemplateManifestSchema,
  adventurerDocument,
  adventurerPoses,
  adventurerVariants,
  referenceDocuments,
  rusticManifest,
  rusticMaterials,
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

  it('runtime-validates exact bounds and intended reference mappings', () => {
    for (const entry of rusticManifest) {
      expect(KitTemplateManifestSchema.parse(entry)).toEqual(entry);
      for (const [minimum, maximum] of Object.values(entry.parameterBounds))
        expect(minimum).toBeLessThan(maximum);
    }
    expect(
      rusticManifest.find(({ template }) => template.id === 'prop.crate')
        ?.intendedReferences,
    ).toEqual(['crate']);
  });

  it('includes the bounded fantasy palette and connected non-humanoid assemblies', () => {
    expect(rusticMaterials.map(({ family }) => family)).toEqual(
      expect.arrayContaining(['bronze', 'bone', 'crystal']),
    );
    for (const reference of ['crate', 'tree', 'cottage'] as const) {
      const document = referenceDocuments[reference];
      expect(document.assembly.connections.length, reference).toBeGreaterThan(
        0,
      );
      expect(() =>
        evaluateAssembly(document.assembly, document.templates),
      ).not.toThrow();
    }
  });

  it('publishes schema-derived accessory grammar and template evidence', async () => {
    const generated = await readFile(
      new URL('../../measure/generated/kit-catalog.md', import.meta.url),
      'utf8',
    );
    expect(generated).toContain('## Accessory Grammar');
    expect(generated).toContain('head, main-hand, off-hand, body, back, waist');
    expect(generated).toContain(
      '| Accessory template | Role | Default slot | Compatible slots | Handedness | Attachment ports | Compatible anatomy | Compatible archetypes | Layer | Triangle budget | Required features |',
    );
    expect(generated).toContain(
      '| `equipment.sword` | weapon | main-hand | main-hand, off-hand | either | grip | rustic-human | adventurer, guard, warrior | carried:20 / max intersection 0.08 | 64 | `blade`: 8px area, 2px width (N, NE, E, SE, S, SW, W, NW) |',
    );
    for (const id of [
      'equipment.helmet.iron',
      'equipment.axe',
      'equipment.shield.kite',
      'equipment.armor.mail',
      'equipment.backpack',
      'equipment.scabbard',
    ])
      expect(generated).toContain(`| \`${id}\` |`);
  });
});
