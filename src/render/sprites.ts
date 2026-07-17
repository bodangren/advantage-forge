import * as THREE from 'three';
import type { Bounds } from '../contracts/index.js';
import { createOrthographicCamera } from './camera.js';
import { analyzeRgbaPixels, type PixelMetrics } from '../validation/index.js';
import {
  directionsForCount,
  type SpriteDirection,
  type SpriteRenderProfile,
} from './profile.js';

export interface SpriteFrame {
  readonly direction: SpriteDirection;
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8ClampedArray;
  readonly metrics: PixelMetrics;
}

function flipRows(
  source: Uint8Array,
  width: number,
  height: number,
): Uint8ClampedArray {
  const target = new Uint8ClampedArray(source.length);
  const stride = width * 4;
  for (let row = 0; row < height; row += 1)
    target.set(
      source.subarray((height - row - 1) * stride, (height - row) * stride),
      row * stride,
    );
  return target;
}

export function renderDirectionalSprites(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  bounds: Bounds,
  profile: SpriteRenderProfile,
): readonly SpriteFrame[] {
  const target = new THREE.WebGLRenderTarget(
    profile.widthPixels,
    profile.heightPixels,
    {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: true,
      stencilBuffer: false,
    },
  );
  const priorTarget = renderer.getRenderTarget();
  const priorColor = renderer.getClearColor(new THREE.Color());
  const priorAlpha = renderer.getClearAlpha();
  const priorBackground = scene.background;
  scene.background = null;
  renderer.setClearColor(0x000000, 0);
  const frames: SpriteFrame[] = [];
  try {
    for (const direction of directionsForCount(profile.directions)) {
      const { camera } = createOrthographicCamera(bounds, profile, direction);
      renderer.setRenderTarget(target);
      renderer.clear(true, true, true);
      renderer.render(scene, camera);
      const raw = new Uint8Array(
        profile.widthPixels * profile.heightPixels * 4,
      );
      renderer.readRenderTargetPixels(
        target,
        0,
        0,
        profile.widthPixels,
        profile.heightPixels,
        raw,
      );
      const pixels = flipRows(raw, profile.widthPixels, profile.heightPixels);
      frames.push({
        direction,
        width: profile.widthPixels,
        height: profile.heightPixels,
        pixels,
        metrics: analyzeRgbaPixels(
          pixels,
          profile.widthPixels,
          profile.heightPixels,
          {
            expectedGroundPixelY:
              profile.heightPixels - profile.paddingPixels - 1,
          },
        ),
      });
    }
  } finally {
    renderer.setRenderTarget(priorTarget);
    renderer.setClearColor(priorColor, priorAlpha);
    scene.background = priorBackground;
    target.dispose();
  }
  return frames;
}

export function frameToCanvas(frame: SpriteFrame): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = frame.width;
  canvas.height = frame.height;
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('A 2D canvas context is required.');
  const image = new ImageData(frame.width, frame.height);
  image.data.set(frame.pixels);
  context.putImageData(image, 0, 0);
  return canvas;
}

export function createContactSheet(
  frames: readonly SpriteFrame[],
  columns = 4,
): HTMLCanvasElement {
  if (frames.length === 0) throw new Error('At least one frame is required.');
  const labelHeight = 18;
  const rows = Math.ceil(frames.length / columns);
  const canvas = document.createElement('canvas');
  canvas.width = frames[0]!.width * columns;
  canvas.height = (frames[0]!.height + labelHeight) * rows;
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('A 2D canvas context is required.');
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#171815';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = '11px ui-monospace, monospace';
  context.textBaseline = 'middle';
  for (const [index, frame] of frames.entries()) {
    const x = (index % columns) * frame.width;
    const y = Math.floor(index / columns) * (frame.height + labelHeight);
    context.drawImage(frameToCanvas(frame), x, y);
    context.fillStyle = '#f2efe6';
    context.fillText(
      frame.direction,
      x + 6,
      y + frame.height + labelHeight / 2,
    );
  }
  return canvas;
}
