import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { Bounds } from '../../src/contracts/index.js';
import { createOrthographicCamera } from '../../src/render/camera.js';
import {
  REFERENCE_COMPARISON_LABELS,
  REFERENCE_COMPARISON_PROFILE,
  REFERENCE_COMPARISON_VIEWS,
  createNeutralReferenceComparisonScene,
  createReferenceComparisonCamera,
  orientNeutralReferenceComparisonLights,
} from '../../src/render/reference-comparison.js';

const bounds: Bounds = { min: [-1, 0, -0.5], max: [1, 3, 0.5] };

describe('authoring reference comparison profile', () => {
  it('freezes eye-level view order, yaws, size, and review labels', () => {
    expect(REFERENCE_COMPARISON_PROFILE).toMatchObject({
      id: 'forge.authoring.reference-comparison.v1',
      widthPixels: 512,
      heightPixels: 512,
      elevationDegrees: 0,
      directions: 4,
      paddingPixels: 32,
    });
    expect(REFERENCE_COMPARISON_VIEWS).toEqual([
      { view: 'front', direction: 'N', yawDegrees: 0 },
      { view: 'three-quarter', direction: 'NE', yawDegrees: 45 },
      { view: 'side', direction: 'E', yawDegrees: 90 },
      { view: 'back', direction: 'S', yawDegrees: 180 },
    ]);
    expect(REFERENCE_COMPARISON_LABELS).toEqual([
      'front',
      'three-quarter',
      'side',
      'back',
    ]);
    expect(REFERENCE_COMPARISON_LABELS).not.toEqual(
      expect.arrayContaining(['N', 'NE', 'E', 'S']),
    );
  });

  it('keeps scale, eye level, and camera-relative light vectors invariant', () => {
    const scene = createNeutralReferenceComparisonScene(new THREE.Group());
    const observations = REFERENCE_COMPARISON_VIEWS.map(({ direction }) => {
      const rig = createReferenceComparisonCamera(
        bounds,
        REFERENCE_COMPARISON_PROFILE,
        direction,
      );
      orientNeutralReferenceComparisonLights(scene, rig);
      const forward = rig.camera
        .getWorldDirection(new THREE.Vector3())
        .normalize();
      const right = new THREE.Vector3()
        .setFromMatrixColumn(rig.camera.matrixWorld, 0)
        .normalize();
      const up = new THREE.Vector3()
        .setFromMatrixColumn(rig.camera.matrixWorld, 1)
        .normalize();
      const components = (name: string) => {
        const offset = scene
          .getObjectByName(name)!
          .position.clone()
          .sub(rig.target);
        return [offset.dot(right), offset.dot(up), offset.dot(forward)].map(
          (value) => Number(value.toFixed(8)),
        );
      };
      return {
        worldUnitsPerPixel: rig.worldUnitsPerPixel,
        eyeLevelDelta: rig.camera.position.y - rig.target.y,
        key: components('reference-comparison.key'),
        fill: components('reference-comparison.fill'),
      };
    });
    expect(
      new Set(observations.map(({ worldUnitsPerPixel }) => worldUnitsPerPixel))
        .size,
    ).toBe(1);
    for (const observation of observations) {
      expect(observation.eyeLevelDelta).toBeCloseTo(0, 12);
      expect(observation.key).toEqual([4, 5, -6]);
      expect(observation.fill).toEqual([-4, 2, -3]);
    }
  });

  it('keeps every projected bound corner inside shared drawable framing', () => {
    const minimumNdc =
      -1 +
      (2 * REFERENCE_COMPARISON_PROFILE.paddingPixels) /
        REFERENCE_COMPARISON_PROFILE.widthPixels;
    const maximumNdc = -minimumNdc;
    const desiredGroundNdc =
      -1 +
      (2 * (REFERENCE_COMPARISON_PROFILE.paddingPixels + 0.5)) /
        REFERENCE_COMPARISON_PROFILE.heightPixels;
    const corners = [-1, 1].flatMap((x) =>
      [0, 3].flatMap((y) => [-0.5, 0.5].map((z) => new THREE.Vector3(x, y, z))),
    );
    const scales = new Set<number>();
    for (const { direction } of REFERENCE_COMPARISON_VIEWS) {
      const rig = createReferenceComparisonCamera(
        bounds,
        REFERENCE_COMPARISON_PROFILE,
        direction,
      );
      scales.add(rig.worldUnitsPerPixel);
      const projected = corners.map((corner) =>
        corner.clone().project(rig.camera),
      );
      for (const corner of projected) {
        expect(corner.x).toBeGreaterThanOrEqual(minimumNdc - 1e-10);
        expect(corner.x).toBeLessThanOrEqual(maximumNdc + 1e-10);
        expect(corner.y).toBeGreaterThanOrEqual(desiredGroundNdc - 1e-10);
        expect(corner.y).toBeLessThanOrEqual(maximumNdc + 1e-10);
      }
      const ground = projected.filter(
        (_corner, index) => Math.floor(index / 2) % 2 === 0,
      );
      expect(Math.min(...ground.map(({ y }) => y))).toBeCloseTo(
        desiredGroundNdc,
        10,
      );
      expect(rig.camera.position.y - rig.target.y).toBeCloseTo(0, 12);
    }
    expect(scales.size).toBe(1);
  });

  it('leaves the default gameplay-camera pixel span unchanged', () => {
    const rig = createOrthographicCamera(
      bounds,
      REFERENCE_COMPARISON_PROFILE,
      'N',
    );
    expect(rig.worldUnitsPerPixel).toBe(3 / (512 - 32 * 2));
  });
});
