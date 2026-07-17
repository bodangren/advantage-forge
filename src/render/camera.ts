import * as THREE from 'three';
import type { Bounds } from '../contracts/index.js';
import {
  yawRadiansForDirection,
  type SpriteDirection,
  type SpriteRenderProfile,
} from './profile.js';

export interface CameraRig {
  readonly camera: THREE.OrthographicCamera;
  readonly target: THREE.Vector3;
  readonly worldUnitsPerPixel: number;
}

export function createOrthographicCamera(
  bounds: Bounds,
  profile: SpriteRenderProfile,
  direction: SpriteDirection,
): CameraRig {
  const min = new THREE.Vector3(...bounds.min);
  const max = new THREE.Vector3(...bounds.max);
  const size = max.clone().sub(min);
  const center = min.clone().add(max).multiplyScalar(0.5);
  const drawableWidth = profile.widthPixels - profile.paddingPixels * 2;
  const drawableHeight = profile.heightPixels - profile.paddingPixels * 2;
  const elevation = THREE.MathUtils.degToRad(profile.elevationDegrees);
  const horizontalDiagonal = Math.hypot(size.x, size.z);
  const projectedHeight =
    size.y * Math.cos(elevation) + horizontalDiagonal * Math.sin(elevation);
  const worldUnitsPerPixel = Math.max(
    horizontalDiagonal / drawableWidth,
    projectedHeight / drawableHeight,
  );
  const halfWidth = Math.max(
    0.01,
    (worldUnitsPerPixel * profile.widthPixels) / 2,
  );
  const halfHeight = Math.max(
    0.01,
    (worldUnitsPerPixel * profile.heightPixels) / 2,
  );
  const camera = new THREE.OrthographicCamera(
    -halfWidth,
    halfWidth,
    halfHeight,
    -halfHeight,
    0.01,
    100,
  );
  const yaw = yawRadiansForDirection(direction);
  const distance = Math.max(size.length() * 2.5, 5);
  const target = center.clone();
  camera.position.set(
    center.x + Math.sin(yaw) * Math.cos(elevation) * distance,
    center.y + Math.sin(elevation) * distance,
    center.z + Math.cos(yaw) * Math.cos(elevation) * distance,
  );
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const lowestGroundNdc = Math.min(
    ...[
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(min.x, min.y, max.z),
      new THREE.Vector3(max.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, max.z),
    ].map((corner) => corner.project(camera).y),
  );
  const desiredGroundNdc =
    -1 + (2 * (profile.paddingPixels + 0.5)) / profile.heightPixels;
  const shiftWorld = (lowestGroundNdc - desiredGroundNdc) * halfHeight;
  const screenUp = new THREE.Vector3()
    .setFromMatrixColumn(camera.matrixWorld, 1)
    .normalize();
  camera.position.addScaledVector(screenUp, shiftWorld);
  target.addScaledVector(screenUp, shiftWorld);
  camera.lookAt(target);
  camera.updateMatrixWorld(true);
  return { camera, target, worldUnitsPerPixel };
}
