import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { standardMaterialPropertyDeviation } from '../../src/export/index.js';

describe('GLB material parity', () => {
  it('compares every supported MeshStandard material property', () => {
    const source = new THREE.MeshStandardMaterial({
      color: '#76512f',
      emissive: '#241d45',
      roughness: 0.72,
      metalness: 0.66,
      opacity: 0.8,
      transparent: true,
      alphaTest: 0.2,
      side: THREE.DoubleSide,
    });
    expect(standardMaterialPropertyDeviation(source, source.clone())).toBe(0);

    const mutations: readonly ((
      material: THREE.MeshStandardMaterial,
    ) => void)[] = [
      (material) => material.color.set('#ffffff'),
      (material) => material.emissive.set('#ffffff'),
      (material) => {
        material.roughness = 0.1;
      },
      (material) => {
        material.metalness = 0.1;
      },
      (material) => {
        material.opacity = 0.1;
      },
      (material) => {
        material.alphaTest = 0.1;
      },
      (material) => {
        material.transparent = false;
      },
      (material) => {
        material.side = THREE.FrontSide;
      },
    ];
    for (const mutate of mutations) {
      const reload = source.clone();
      mutate(reload);
      expect(standardMaterialPropertyDeviation(source, reload)).toBeGreaterThan(
        1e-5,
      );
    }
    source.dispose();
  });
});
