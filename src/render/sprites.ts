import * as THREE from 'three';
import type { Bounds } from '../contracts/index.js';
import { createOrthographicCamera } from './camera.js';
import { analyzeRgbaPixels, type PixelMetrics } from '../validation/index.js';
import {
  directionsForCount,
  type SpriteDirection,
  type SpriteRenderProfile,
} from './profile.js';

export interface FeatureWidthEvidence {
  readonly partId: string;
  readonly silhouetteWidthPixels: number | null;
  readonly minimumPixels: number;
  readonly passes: boolean;
}

export interface RequiredFeatureEvidence extends FeatureWidthEvidence {
  readonly featureId: string;
  readonly templateId: string;
  readonly minimumPixelArea: number;
  readonly isolatedPixelArea: number;
  readonly visiblePixelArea: number;
  readonly occlusionRatio: number;
  readonly maximumOcclusionRatio: number;
  readonly materialOklabDistance: number;
  readonly minimumOklabDistance: number;
}

export interface SpriteFrame {
  readonly direction: SpriteDirection;
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8ClampedArray;
  readonly metrics: PixelMetrics & {
    readonly requiredFeatureEvidence: readonly RequiredFeatureEvidence[];
    readonly framingEvidence: {
      readonly topMarginPixels: number | null;
      readonly centerDeviationPixels: number | null;
      readonly heightDeviationPixels: number;
      readonly worldUnitsPerPixel: number;
    };
  };
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

export function normalizeGroundRow(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  expectedGroundPixelY: number,
): Uint8ClampedArray {
  const measured = analyzeRgbaPixels(pixels, width, height, {
    alphaThreshold: 128,
  });
  if (measured.groundPixelY === null) return pixels;
  const offset = expectedGroundPixelY - measured.groundPixelY;
  if (offset === 0) return pixels;
  const aligned = new Uint8ClampedArray(pixels.length);
  const stride = width * 4;
  for (let sourceY = 0; sourceY < height; sourceY += 1) {
    const targetY = sourceY + offset;
    if (targetY < 0 || targetY >= height) {
      const sourceOffset = sourceY * stride;
      const discardsOccupiedPixel = Array.from(
        { length: width },
        (_, x) => pixels[sourceOffset + x * 4 + 3],
      ).some((alpha) => alpha !== 0);
      if (discardsOccupiedPixel) {
        throw new RangeError(
          'Ground-row normalization would discard occupied pixels.',
        );
      }
      continue;
    }
    aligned.set(
      pixels.subarray(sourceY * stride, (sourceY + 1) * stride),
      targetY * stride,
    );
  }
  return aligned;
}

export function requiredFeatureEvidenceFromPixels(
  partId: string,
  pixels: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  minimumPixels: number,
): FeatureWidthEvidence {
  const bounds = analyzeRgbaPixels(pixels, width, height, {
    alphaThreshold: 128,
  }).occupiedBounds;
  const silhouetteWidthPixels =
    bounds === null ? null : Math.min(bounds.width, bounds.height);
  return {
    partId,
    silhouetteWidthPixels,
    minimumPixels,
    passes:
      silhouetteWidthPixels !== null && silhouetteWidthPixels >= minimumPixels,
  };
}

function measureRequiredFeatures(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.OrthographicCamera,
  target: THREE.WebGLRenderTarget,
  profile: SpriteRenderProfile,
  direction: SpriteDirection,
  fullPixels: Uint8ClampedArray,
): readonly RequiredFeatureEvidence[] {
  const semanticMeshes: Array<
    THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>
  > = [];
  scene.traverse((node) => {
    if (
      node instanceof THREE.Mesh &&
      typeof node.userData['semanticId'] === 'string'
    )
      semanticMeshes.push(
        node as THREE.Mesh<
          THREE.BufferGeometry,
          THREE.Material | THREE.Material[]
        >,
      );
  });
  const originalVisibility = new Map(
    semanticMeshes.map((mesh) => [mesh, mesh.visible] as const),
  );
  const originalMaterials = new Map(
    semanticMeshes.map((mesh) => [mesh, mesh.material] as const),
  );
  const targetMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const occluderMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const readTarget = () => {
    renderer.setRenderTarget(target);
    renderer.clear(true, true, true);
    renderer.render(scene, camera);
    const raw = new Uint8Array(profile.widthPixels * profile.heightPixels * 4);
    renderer.readRenderTargetPixels(
      target,
      0,
      0,
      profile.widthPixels,
      profile.heightPixels,
      raw,
    );
    return targetMask(flipRows(raw, profile.widthPixels, profile.heightPixels));
  };
  try {
    return profile.requiredFeaturePartIds.flatMap((partId) => {
      const targetMesh = semanticMeshes.find(
        (mesh) => mesh.userData['semanticId'] === partId,
      );
      if (targetMesh === undefined)
        return [
          missingFeatureEvidence(
            partId,
            partId,
            'template.unknown',
            profile.minimumFeaturePixels,
          ),
        ];
      for (const mesh of semanticMeshes)
        mesh.material = mesh === targetMesh ? targetMaterial : occluderMaterial;
      for (const mesh of semanticMeshes)
        mesh.visible = originalVisibility.get(mesh) === true;
      const visibleMask = readTarget();
      for (const mesh of semanticMeshes)
        mesh.visible =
          originalVisibility.get(mesh) === true && mesh === targetMesh;
      const isolatedMask = readTarget();
      const visibleMetrics = analyzeRgbaPixels(
        visibleMask,
        profile.widthPixels,
        profile.heightPixels,
        { alphaThreshold: 128 },
      );
      const isolatedMetrics = analyzeRgbaPixels(
        isolatedMask,
        profile.widthPixels,
        profile.heightPixels,
        { alphaThreshold: 128 },
      );
      const accessoryFeatureValue: unknown = (
        targetMesh.userData as Record<string, unknown>
      )['accessoryFeatures'];
      const hasAccessoryFeatureContracts =
        Array.isArray(accessoryFeatureValue) &&
        accessoryFeatureValue.length > 0;
      const isolatedPixelArea = isolatedMetrics.occupiedPixelCount;
      const measuredVisiblePixelArea = visibleMetrics.occupiedPixelCount;
      const visiblePixelArea = hasAccessoryFeatureContracts
        ? measuredVisiblePixelArea
        : isolatedPixelArea;
      const occlusionRatio = !hasAccessoryFeatureContracts
        ? 0
        : isolatedPixelArea === 0
          ? 1
          : Math.max(
              0,
              Math.min(1, 1 - measuredVisiblePixelArea / isolatedPixelArea),
            );
      const templateId =
        typeof targetMesh.userData['templateId'] === 'string'
          ? targetMesh.userData['templateId']
          : 'template.unknown';
      const features = featureContracts(
        accessoryFeatureValue,
        partId,
        profile.minimumFeaturePixels,
      ).filter(({ intendedDirections }) =>
        intendedDirections.includes(direction),
      );
      const silhouetteMetrics = hasAccessoryFeatureContracts
        ? visibleMetrics
        : isolatedMetrics;
      const silhouetteWidthPixels =
        silhouetteMetrics.occupiedBounds === null
          ? null
          : Math.min(
              silhouetteMetrics.occupiedBounds.width,
              silhouetteMetrics.occupiedBounds.height,
            );
      const materialOklabDistance = hasAccessoryFeatureContracts
        ? visibleMaterialOklabDistance(
            fullPixels,
            visibleMask,
            profile.widthPixels,
            profile.heightPixels,
          )
        : 1;
      return features.map((feature) => ({
        featureId: feature.id,
        partId,
        templateId,
        silhouetteWidthPixels,
        minimumPixels: feature.minimumWidthPixels,
        minimumPixelArea: feature.minimumPixelArea,
        isolatedPixelArea,
        visiblePixelArea,
        occlusionRatio,
        maximumOcclusionRatio: feature.maximumOcclusionRatio,
        materialOklabDistance,
        minimumOklabDistance: feature.minimumOklabDistance,
        passes:
          silhouetteWidthPixels !== null &&
          silhouetteWidthPixels >= feature.minimumWidthPixels &&
          visiblePixelArea >= feature.minimumPixelArea &&
          occlusionRatio <= feature.maximumOcclusionRatio &&
          materialOklabDistance >= feature.minimumOklabDistance,
      }));
    });
  } finally {
    for (const [mesh, visible] of originalVisibility) mesh.visible = visible;
    for (const [mesh, material] of originalMaterials) mesh.material = material;
    targetMaterial.dispose();
    occluderMaterial.dispose();
  }
}

interface FeatureContract {
  readonly id: string;
  readonly intendedDirections: readonly string[];
  readonly minimumPixelArea: number;
  readonly minimumWidthPixels: number;
  readonly maximumOcclusionRatio: number;
  readonly minimumOklabDistance: number;
}

function featureContracts(
  value: unknown,
  partId: string,
  minimumPixels: number,
): readonly FeatureContract[] {
  if (!Array.isArray(value) || value.length === 0)
    return [
      {
        id: partId,
        intendedDirections: [...directionsForCount(8)],
        minimumPixelArea: minimumPixels * minimumPixels,
        minimumWidthPixels: minimumPixels,
        maximumOcclusionRatio: 1,
        minimumOklabDistance: 0,
      },
    ];
  return value.flatMap((candidate) => {
    if (typeof candidate !== 'object' || candidate === null) return [];
    const feature = candidate as Record<string, unknown>;
    if (
      typeof feature['id'] !== 'string' ||
      !Array.isArray(feature['intendedDirections']) ||
      typeof feature['minimumPixelArea'] !== 'number' ||
      typeof feature['minimumWidthPixels'] !== 'number' ||
      typeof feature['maximumOcclusionRatio'] !== 'number' ||
      typeof feature['minimumOklabDistance'] !== 'number'
    )
      return [];
    return [
      {
        id: feature['id'],
        intendedDirections: feature['intendedDirections'].filter(
          (direction): direction is string => typeof direction === 'string',
        ),
        minimumPixelArea: feature['minimumPixelArea'],
        minimumWidthPixels: feature['minimumWidthPixels'],
        maximumOcclusionRatio: feature['maximumOcclusionRatio'],
        minimumOklabDistance: feature['minimumOklabDistance'],
      },
    ];
  });
}

function missingFeatureEvidence(
  featureId: string,
  partId: string,
  templateId: string,
  minimumPixels: number,
): RequiredFeatureEvidence {
  return {
    featureId,
    partId,
    templateId,
    silhouetteWidthPixels: null,
    minimumPixels,
    minimumPixelArea: minimumPixels * minimumPixels,
    isolatedPixelArea: 0,
    visiblePixelArea: 0,
    occlusionRatio: 1,
    maximumOcclusionRatio: 0.8,
    materialOklabDistance: 0,
    minimumOklabDistance: 0.05,
    passes: false,
  };
}

function targetMask(pixels: Uint8ClampedArray): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(pixels.length);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (
      pixels[offset + 3]! >= 128 &&
      pixels[offset]! >= 128 &&
      pixels[offset + 1]! >= 128 &&
      pixels[offset + 2]! >= 128
    ) {
      mask[offset] = 255;
      mask[offset + 1] = 255;
      mask[offset + 2] = 255;
      mask[offset + 3] = 255;
    }
  }
  return mask;
}

function visibleMaterialOklabDistance(
  pixels: Uint8ClampedArray,
  target: Uint8ClampedArray,
  width: number,
  height: number,
): number {
  const targetColors: number[][] = [];
  const neighborColors: number[][] = [];
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (target[offset + 3]! < 128) continue;
      targetColors.push([
        pixels[offset]!,
        pixels[offset + 1]!,
        pixels[offset + 2]!,
      ]);
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const neighborOffset = (ny * width + nx) * 4;
        if (
          target[neighborOffset + 3]! < 128 &&
          pixels[neighborOffset + 3]! >= 128
        )
          neighborColors.push([
            pixels[neighborOffset]!,
            pixels[neighborOffset + 1]!,
            pixels[neighborOffset + 2]!,
          ]);
      }
    }
  if (targetColors.length === 0) return 0;
  if (neighborColors.length === 0) return 1;
  const targetLab = rgbToOklab(averageRgb(targetColors));
  const neighborLab = rgbToOklab(averageRgb(neighborColors));
  return Math.hypot(
    targetLab[0] - neighborLab[0],
    targetLab[1] - neighborLab[1],
    targetLab[2] - neighborLab[2],
  );
}

function averageRgb(colors: readonly number[][]): readonly number[] {
  const sum = colors.reduce(
    (total, color) => [
      total[0]! + color[0]!,
      total[1]! + color[1]!,
      total[2]! + color[2]!,
    ],
    [0, 0, 0],
  );
  return sum.map((channel) => channel / colors.length / 255);
}

function rgbToOklab(rgb: readonly number[]): readonly [number, number, number] {
  const linear = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const l =
    0.4122214708 * linear[0]! +
    0.5363325363 * linear[1]! +
    0.0514459929 * linear[2]!;
  const m =
    0.2119034982 * linear[0]! +
    0.6806995451 * linear[1]! +
    0.1073969566 * linear[2]!;
  const s =
    0.0883024619 * linear[0]! +
    0.2817188376 * linear[1]! +
    0.6299787005 * linear[2]!;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  return [
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  ];
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
      const { camera, worldUnitsPerPixel } = createOrthographicCamera(
        bounds,
        profile,
        direction,
      );
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
      const expectedGroundPixelY =
        profile.heightPixels - profile.paddingPixels - 1;
      const rawPixels = flipRows(
        raw,
        profile.widthPixels,
        profile.heightPixels,
      );
      const pixels = normalizeGroundRow(
        rawPixels,
        profile.widthPixels,
        profile.heightPixels,
        expectedGroundPixelY,
      );
      const requiredFeatureEvidence = measureRequiredFeatures(
        renderer,
        scene,
        camera,
        target,
        profile,
        direction,
        rawPixels,
      );
      const pixelMetrics = analyzeRgbaPixels(
        pixels,
        profile.widthPixels,
        profile.heightPixels,
        {
          alphaThreshold: 128,
          expectedGroundPixelY,
        },
      );
      const metrics = {
        ...pixelMetrics,
        requiredFeatureEvidence,
        framingEvidence: {
          topMarginPixels: pixelMetrics.occupiedBounds?.minY ?? null,
          centerDeviationPixels:
            pixelMetrics.occupiedBounds === null
              ? null
              : Math.abs(
                  (pixelMetrics.occupiedBounds.minX +
                    pixelMetrics.occupiedBounds.maxX) /
                    2 -
                    (profile.widthPixels - 1) / 2,
                ),
          heightDeviationPixels: 0,
          worldUnitsPerPixel,
        },
      };
      frames.push({
        direction,
        width: profile.widthPixels,
        height: profile.heightPixels,
        pixels,
        metrics,
      });
    }
  } finally {
    renderer.setRenderTarget(priorTarget);
    renderer.setClearColor(priorColor, priorAlpha);
    scene.background = priorBackground;
    target.dispose();
  }
  const occupiedHeights = frames
    .flatMap(({ metrics }) =>
      metrics.occupiedBounds === null ? [] : [metrics.occupiedBounds.height],
    )
    .sort((left, right) => left - right);
  const referenceHeight =
    occupiedHeights[Math.floor(occupiedHeights.length / 2)] ?? 0;
  return frames.map((frame) => ({
    ...frame,
    metrics: {
      ...frame.metrics,
      framingEvidence: {
        ...frame.metrics.framingEvidence,
        heightDeviationPixels:
          frame.metrics.occupiedBounds === null
            ? profile.heightPixels
            : Math.abs(frame.metrics.occupiedBounds.height - referenceHeight),
      },
    },
  }));
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
