/**
 * Book still hook: publish the live song scene, camera, and renderer on `window.__bookStill` at
 * the end of every seek. The storytime book picture capture reads the hook for its line-art twin
 * pass. Pure TypeScript: no WebGL and no three.js import, so the unit tests run without a browser.
 *
 * `publishBookStill` records the camera state of the color still (position, look target, fov,
 * aspect, near, far) as a value copy, so a later camera change cannot alter the published state.
 */

export interface BookStillCameraState {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  aspect: number;
  near: number;
  far: number;
}

/** The camera surface the hook needs; a three.js PerspectiveCamera satisfies it. */
export interface BookStillCamera {
  position: { x: number; y: number; z: number };
  fov: number;
  aspect: number;
  near: number;
  far: number;
}

export interface BookStillPoint {
  x: number;
  y: number;
  z: number;
}

export interface BookStillParts {
  scene: unknown;
  camera: BookStillCamera;
  renderer: unknown;
  /** The look target of the current shot; `cameraState.target` copies it. */
  lookTarget: BookStillPoint;
  /** The page's three module namespace, for the in-page line-art pass. */
  three?: unknown;
}

interface BookStillHook {
  scene: unknown;
  camera: unknown;
  renderer: unknown;
  three?: unknown;
  cameraState: BookStillCameraState;
}

/** A value copy of the camera and look target at publish time. */
export function cameraStateOf(camera: BookStillCamera, lookTarget: BookStillPoint): BookStillCameraState {
  return {
    position: [camera.position.x, camera.position.y, camera.position.z],
    target: [lookTarget.x, lookTarget.y, lookTarget.z],
    fov: camera.fov,
    aspect: camera.aspect,
    near: camera.near,
    far: camera.far,
  };
}

export function publishBookStill(target: { __bookStill?: unknown }, parts: BookStillParts): void {
  (target as { __bookStill?: BookStillHook }).__bookStill = {
    scene: parts.scene,
    camera: parts.camera,
    renderer: parts.renderer,
    ...(parts.three === undefined ? {} : { three: parts.three }),
    cameraState: cameraStateOf(parts.camera, parts.lookTarget),
  };
}

export function clearBookStill(target: { __bookStill?: unknown }): void {
  delete (target as { __bookStill?: BookStillHook }).__bookStill;
}
