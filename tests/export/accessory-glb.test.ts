import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { exportSceneToGlb } from '../../src/export/index.js';
import { adventurerDocument } from '../../src/fantasy-kit/index.js';
import {
  compileThreeScene,
  disposeCompiledScene,
} from '../../src/scene/index.js';

interface TransformEvidence {
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number, number];
  readonly scale: readonly [number, number, number];
}

interface SemanticNodeEvidence {
  readonly semanticId: string;
  readonly source: {
    readonly materialNames: readonly string[];
    readonly worldTransform: TransformEvidence;
    readonly bounds: {
      readonly min: readonly [number, number, number];
      readonly max: readonly [number, number, number];
    };
  };
  readonly reload: {
    readonly materialNames: readonly string[];
    readonly worldTransform: TransformEvidence;
    readonly bounds: {
      readonly min: readonly [number, number, number];
      readonly max: readonly [number, number, number];
    };
  };
  readonly materialNamesMatch: boolean;
  readonly maximumTransformDeviation: number;
  readonly maximumBoundsDeviation: number;
}

class NodeFileReader {
  result: string | ArrayBuffer | null = null;
  onloadend: (() => void) | null = null;

  readAsArrayBuffer(blob: Blob): void {
    void blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }

  readAsDataURL(blob: Blob): void {
    void blob.arrayBuffer().then((result) => {
      this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;
      this.onloadend?.();
    });
  }
}

const originalFileReader = globalThis.FileReader;

beforeAll(() => {
  Object.defineProperty(globalThis, 'FileReader', {
    configurable: true,
    value: NodeFileReader,
  });
});

afterAll(() => {
  Object.defineProperty(globalThis, 'FileReader', {
    configurable: true,
    value: originalFileReader,
  });
});

describe('accessory GLB semantic reload evidence', () => {
  it('ties every exported accessory node to source/reload materials, transforms, and bounds', async () => {
    const compiled = compileThreeScene(adventurerDocument);
    try {
      const { manifest } = await exportSceneToGlb(compiled.group);
      const semanticNodes = (
        manifest as unknown as {
          readonly semanticNodes?: readonly SemanticNodeEvidence[];
        }
      ).semanticNodes;

      expect(
        semanticNodes,
        'GLB manifest must expose per-semantic-node source/reload evidence',
      ).toBeInstanceOf(Array);
      if (semanticNodes === undefined) return;

      for (const semanticId of ['sword', 'shield']) {
        const node = semanticNodes.find(
          (candidate) => candidate.semanticId === semanticId,
        );
        expect(node, semanticId).toBeDefined();
        expect(node?.source.materialNames.length, semanticId).toBeGreaterThan(
          0,
        );
        expect(node?.reload.materialNames, semanticId).toEqual(
          node?.source.materialNames,
        );
        expect(node?.materialNamesMatch, semanticId).toBe(true);
        expect(node?.reload.worldTransform, semanticId).toEqual(
          node?.source.worldTransform,
        );
        expect(node?.maximumTransformDeviation, semanticId).toBeLessThanOrEqual(
          manifest.transformTolerance,
        );
        expect(node?.reload.bounds, semanticId).toEqual(node?.source.bounds);
        expect(node?.maximumBoundsDeviation, semanticId).toBeLessThanOrEqual(
          manifest.bounds.tolerance,
        );
      }
    } finally {
      disposeCompiledScene(compiled);
    }
  });

  it('excludes invisible accessory nodes and their bounds from reload evidence', async () => {
    const compiled = compileThreeScene({
      ...adventurerDocument,
      activeVariantId: 'unequipped',
    });
    try {
      const { manifest } = await exportSceneToGlb(compiled.group);
      expect(
        manifest.semanticNodes.map(({ semanticId }) => semanticId),
      ).not.toEqual(expect.arrayContaining(['sword', 'shield']));
      const root = manifest.semanticNodes.find(
        ({ semanticId }) => semanticId === adventurerDocument.id,
      );
      expect(root).toBeDefined();
      expect(root?.maximumBoundsDeviation).toBeLessThanOrEqual(
        manifest.bounds.tolerance,
      );
    } finally {
      disposeCompiledScene(compiled);
    }
  });
});
