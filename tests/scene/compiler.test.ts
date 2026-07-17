import { describe, expect, it } from 'vitest';
import {
  adventurerDocument,
  referenceDocuments,
} from '../../src/fantasy-kit/index.js';
import {
  MVP_RENDER_PROFILE,
  createOrthographicCamera,
} from '../../src/render/index.js';
import {
  compileThreeScene,
  disposeCompiledScene,
} from '../../src/scene/index.js';

describe('Three.js scene adapter', () => {
  it('compiles every reference to named meshes with semantic evidence', () => {
    for (const document of Object.values(referenceDocuments)) {
      const compiled = compileThreeScene(document);
      expect(compiled.group.name).toBe(document.id);
      expect(compiled.group.children.length).toBe(
        document.assembly.parts.length,
      );
      expect(compiled.group.children.every(({ name }) => name.length > 0)).toBe(
        true,
      );
      expect(compiled.summary.triangleCount).toBeGreaterThan(0);
      expect(compiled.bounds.isEmpty()).toBe(false);
      expect(compiled.group.children[0]?.userData).toHaveProperty('role');
      disposeCompiledScene(compiled);
    }
  });
  it('excludes invisible variant parts from compiled bounds', () => {
    const compiled = compileThreeScene({
      ...adventurerDocument,
      activeVariantId: 'unequipped',
    });
    expect(compiled.group.getObjectByName('sword')?.visible).toBe(false);
    expect(compiled.bounds.min.toArray()).toEqual(compiled.summary.bounds.min);
    expect(compiled.bounds.max.toArray()).toEqual(compiled.summary.bounds.max);
    disposeCompiledScene(compiled);
  });

  it('creates deterministic orthographic framing for all direction counts', () => {
    const compiled = compileThreeScene(adventurerDocument);
    const first = createOrthographicCamera(
      compiled.summary.bounds,
      MVP_RENDER_PROFILE,
      'S',
    );
    const second = createOrthographicCamera(
      compiled.summary.bounds,
      MVP_RENDER_PROFILE,
      'S',
    );
    expect(first.camera.position.toArray()).toEqual(
      second.camera.position.toArray(),
    );
    expect(first.camera.isOrthographicCamera).toBe(true);
    expect(first.worldUnitsPerPixel).toBeGreaterThan(0);
    disposeCompiledScene(compiled);
  });
});
