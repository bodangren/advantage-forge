import * as THREE from 'three';
import {
  FORGE_REFERENCE_COMPARISON_PROFILE_ID,
  type Bounds,
} from '../contracts/index.js';
import type { SpriteDirection, SpriteRenderProfile } from './profile.js';
import { yawRadiansForDirection } from './profile.js';
import type { CameraRig } from './camera.js';
import {
  frameToCanvas,
  renderDirectionalSprites,
  type SpriteFrame,
} from './sprites.js';

export const REFERENCE_COMPARISON_VIEWS = [
  { view: 'front', direction: 'N', yawDegrees: 0 },
  { view: 'three-quarter', direction: 'NE', yawDegrees: 45 },
  { view: 'side', direction: 'E', yawDegrees: 90 },
  { view: 'back', direction: 'S', yawDegrees: 180 },
] as const satisfies readonly {
  readonly view: 'front' | 'three-quarter' | 'side' | 'back';
  readonly direction: SpriteDirection;
  readonly yawDegrees: number;
}[];

export const REFERENCE_COMPARISON_PROFILE: SpriteRenderProfile = Object.freeze({
  id: FORGE_REFERENCE_COMPARISON_PROFILE_ID,
  widthPixels: 512,
  heightPixels: 512,
  elevationDegrees: 0,
  directions: 4,
  paddingPixels: 32,
  transparent: true,
  minimumFeaturePixels: 8,
  requiredFeaturePartIds: [],
});
export const REFERENCE_COMPARISON_LABELS = REFERENCE_COMPARISON_VIEWS.map(
  ({ view }) => view,
);

const REFERENCE_LABEL_GLYPHS: Readonly<Record<string, readonly string[]>> = {
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  a: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  b: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  c: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  d: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  e: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  f: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  h: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  i: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  k: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  n: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  o: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  r: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  s: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  t: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  u: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
};

function drawReferenceLabel(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
): void {
  const glyphAdvance = 6;
  context.fillStyle = '#f2efe6';
  for (const [glyphIndex, character] of [...label].entries()) {
    const glyph = REFERENCE_LABEL_GLYPHS[character];
    if (glyph === undefined)
      throw new Error(`Unsupported reference-comparison label: ${label}`);
    for (const [rowIndex, row] of glyph.entries()) {
      for (const [columnIndex, bit] of [...row].entries()) {
        if (bit === '1')
          context.fillRect(
            x + glyphIndex * glyphAdvance + columnIndex,
            y + rowIndex,
            1,
            1,
          );
      }
    }
  }
}

export function createReferenceComparisonCamera(
  bounds: Bounds,
  profile: SpriteRenderProfile,
  direction: SpriteDirection,
): CameraRig {
  const min = new THREE.Vector3(...bounds.min);
  const max = new THREE.Vector3(...bounds.max);
  const size = max.clone().sub(min);
  const center = min.clone().add(max).multiplyScalar(0.5);
  const worldUnitsPerPixel = Math.max(
    Math.hypot(size.x, size.z) /
      (profile.widthPixels - profile.paddingPixels * 2 - 1),
    size.y / (profile.heightPixels - profile.paddingPixels * 2 - 1),
  );
  const halfWidth = (worldUnitsPerPixel * profile.widthPixels) / 2;
  const halfHeight = (worldUnitsPerPixel * profile.heightPixels) / 2;
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
    center.x + Math.sin(yaw) * distance,
    center.y,
    center.z + Math.cos(yaw) * distance,
  );
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const groundCorners = [
    new THREE.Vector3(min.x, min.y, min.z),
    new THREE.Vector3(min.x, min.y, max.z),
    new THREE.Vector3(max.x, min.y, min.z),
    new THREE.Vector3(max.x, min.y, max.z),
  ];
  const lowestGroundNdc = Math.min(
    ...groundCorners.map((corner) => corner.project(camera).y),
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

function compositeOnNeutralBackground(
  pixels: Uint8ClampedArray,
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(pixels.length);
  const background = 0xe8;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const alpha = pixels[offset + 3]! / 255;
    for (let channel = 0; channel < 3; channel += 1)
      result[offset + channel] = Math.round(
        pixels[offset + channel]! * alpha + background * (1 - alpha),
      );
    result[offset + 3] = 255;
  }
  return result;
}

export function createNeutralReferenceComparisonScene(
  source: THREE.Group,
): THREE.Scene {
  const scene = new THREE.Scene();
  scene.add(source.clone(true));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.name = 'reference-comparison.key';
  key.target.name = 'reference-comparison.key-target';
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xffffff, 1.1);
  fill.name = 'reference-comparison.fill';
  fill.target.name = 'reference-comparison.fill-target';
  scene.add(fill, fill.target);
  return scene;
}

export function orientNeutralReferenceComparisonLights(
  scene: THREE.Scene,
  rig: CameraRig,
): void {
  const key = scene.getObjectByName(
    'reference-comparison.key',
  ) as THREE.DirectionalLight;
  const fill = scene.getObjectByName(
    'reference-comparison.fill',
  ) as THREE.DirectionalLight;
  const forward = rig.camera.getWorldDirection(new THREE.Vector3()).normalize();
  const right = new THREE.Vector3()
    .setFromMatrixColumn(rig.camera.matrixWorld, 0)
    .normalize();
  const up = new THREE.Vector3()
    .setFromMatrixColumn(rig.camera.matrixWorld, 1)
    .normalize();
  key.target.position.copy(rig.target);
  fill.target.position.copy(rig.target);
  key.position
    .copy(rig.target)
    .addScaledVector(right, 4)
    .addScaledVector(up, 5)
    .addScaledVector(forward, -6);
  fill.position
    .copy(rig.target)
    .addScaledVector(right, -4)
    .addScaledVector(up, 2)
    .addScaledVector(forward, -3);
  key.updateMatrixWorld(true);
  key.target.updateMatrixWorld(true);
  fill.updateMatrixWorld(true);
  fill.target.updateMatrixWorld(true);
}

export function renderReferenceComparisonFrames(
  renderer: THREE.WebGLRenderer,
  source: THREE.Group,
  bounds: Bounds,
): readonly SpriteFrame[] {
  const frames = renderDirectionalSprites(
    renderer,
    createNeutralReferenceComparisonScene(source),
    bounds,
    REFERENCE_COMPARISON_PROFILE,
    REFERENCE_COMPARISON_VIEWS.map(({ direction }) => direction),
    (scene, rig) => orientNeutralReferenceComparisonLights(scene, rig),
    createReferenceComparisonCamera,
  );
  return frames.map((frame) => ({
    ...frame,
    pixels: compositeOnNeutralBackground(frame.pixels),
  }));
}

export function createReferenceComparisonContactSheet(
  frames: readonly SpriteFrame[],
): HTMLCanvasElement {
  const labelHeight = 18;
  const columns = 4;
  if (frames.length !== REFERENCE_COMPARISON_LABELS.length)
    throw new Error(
      'Reference-comparison frames must match the fixed view set.',
    );
  const canvas = document.createElement('canvas');
  canvas.width = frames[0]!.width * columns;
  canvas.height = frames[0]!.height + labelHeight;
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('A 2D canvas context is required.');
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#171815';
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (const [index, frame] of frames.entries()) {
    const x = index * frame.width;
    context.drawImage(frameToCanvas(frame), x, 0);
    drawReferenceLabel(
      context,
      REFERENCE_COMPARISON_LABELS[index]!,
      x + 6,
      frame.height + 5,
    );
  }
  return canvas;
}
