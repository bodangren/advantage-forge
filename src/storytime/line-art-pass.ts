import type * as THREE from 'three';

/**
 * Form-edge line-art pass over a live three.js scene. It renders the scene twice into render
 * targets with override materials — view-space normals (MeshNormalMaterial) and packed depth
 * (MeshDepthMaterial with RGBADepthPacking) — then thresholds depth and normal discontinuities
 * between neighboring pixels into a 1-bit picture, top row first.
 *
 * Both renders are depth-tested renders of the same scene, so a line behind a closer surface
 * never shows. A smooth surface has no interior discontinuity, so triangle edges never show.
 * The pass uses no wireframe material, no WireframeGeometry, and no line objects.
 *
 * `three` is the module namespace that owns the scene. The song page passes it through the
 * `window.__bookStill` hook (src/song/still-hook.ts); the unit tests pass their own namespace.
 * The module itself imports three.js as types only, so the page can load it through the dev
 * server and the tests can load it directly.
 */

export interface LineArtPassSize {
  width: number;
  height: number;
}

export interface LineArtPassResult {
  width: number;
  height: number;
  /** One byte of 0 (ink) or 255 (paper) per pixel, top row first. */
  data: Uint8Array;
}

/** Neighbor normals with a smaller dot are a form edge (about 30 degrees). */
const NORMAL_EDGE_DOT = 0.86;
/** Neighbor depths with a bigger gap are an occlusion or crease edge. */
const DEPTH_EDGE_DELTA = 0.02;

export function renderLineArtPass(
  three: typeof THREE,
  parts: { scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer },
  size: LineArtPassSize,
): LineArtPassResult {
  const { scene, camera, renderer } = parts;
  const savedAspect = camera.aspect;
  const savedProjection = [...camera.projectionMatrix.elements];
  const savedTarget = renderer.getRenderTarget();
  const savedSize = renderer.getSize(new three.Vector2());
  const savedClearColor = renderer.getClearColor(new three.Color());
  const savedClearAlpha = renderer.getClearAlpha();
  const savedBackground = scene.background;
  const savedOverride = scene.overrideMaterial;
  const normalMaterial = new three.MeshNormalMaterial();
  const depthMaterial = new three.MeshDepthMaterial({ depthPacking: three.RGBADepthPacking });
  const normalTarget = new three.WebGLRenderTarget(size.width, size.height);
  const depthTarget = new three.WebGLRenderTarget(size.width, size.height);
  try {
    scene.background = null;
    renderer.setClearColor(0x000000, 1);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height, false);
    renderer.setRenderTarget(normalTarget);
    scene.overrideMaterial = normalMaterial;
    renderer.render(scene, camera);
    const normals = readPixels(renderer, normalTarget, size);
    renderer.setRenderTarget(depthTarget);
    scene.overrideMaterial = depthMaterial;
    renderer.render(scene, camera);
    const depths = readPixels(renderer, depthTarget, size);
    return { width: size.width, height: size.height, data: edgeData(normals, depths, size) };
  } finally {
    for (let index = 0; index < savedProjection.length; index += 1) {
      camera.projectionMatrix.elements[index] = savedProjection[index]!;
    }
    camera.aspect = savedAspect;
    scene.overrideMaterial = savedOverride;
    scene.background = savedBackground;
    renderer.setClearColor(savedClearColor, savedClearAlpha);
    renderer.setSize(savedSize.x, savedSize.y, false);
    renderer.setRenderTarget(savedTarget);
    normalMaterial.dispose();
    depthMaterial.dispose();
    normalTarget.dispose();
    depthTarget.dispose();
  }
}

function readPixels(
  renderer: THREE.WebGLRenderer,
  target: THREE.WebGLRenderTarget,
  size: LineArtPassSize,
): Uint8Array {
  const pixels = new Uint8Array(size.width * size.height * 4);
  renderer.readRenderTargetPixels(target, 0, 0, size.width, size.height, pixels);
  return pixels;
}

/** Inverse of three's RGBADepthPacking (packDepthToRGBA with the 256/255 upscale). */
function unpackDepth(pixels: Uint8Array, index: number): number {
  const base = index * 4;
  return (
    pixels[base]! / 4294967296 +
    pixels[base + 1]! / 16777216 +
    pixels[base + 2]! / 65536 +
    pixels[base + 3]! / 256
  );
}

function edgeData(normals: Uint8Array, depths: Uint8Array, size: LineArtPassSize): Uint8Array {
  const { width, height } = size;
  const data = new Uint8Array(width * height).fill(255);
  const mark = (webglIndex: number) => {
    const x = webglIndex % width;
    const webglRow = Math.floor(webglIndex / width);
    data[(height - 1 - webglRow) * width + x] = 0;
  };
  const normalAt = (index: number): [number, number, number] => {
    const base = index * 4;
    return [
      (normals[base]! / 255) * 2 - 1,
      (normals[base + 1]! / 255) * 2 - 1,
      (normals[base + 2]! / 255) * 2 - 1,
    ];
  };
  const edgeBetween = (a: number, b: number): boolean => {
    if (Math.abs(unpackDepth(depths, a) - unpackDepth(depths, b)) > DEPTH_EDGE_DELTA) return true;
    const [ax, ay, az] = normalAt(a);
    const [bx, by, bz] = normalAt(b);
    const squaredLength = (ax * ax + ay * ay + az * az) * (bx * bx + by * by + bz * bz);
    const dot = (ax * bx + ay * by + az * bz) / Math.sqrt(squaredLength);
    return !Number.isFinite(dot) || dot < NORMAL_EDGE_DOT;
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (x + 1 < width && edgeBetween(index, index + 1)) {
        mark(index);
        mark(index + 1);
      }
      if (y + 1 < height && edgeBetween(index, index + width)) {
        mark(index);
        mark(index + width);
      }
    }
  }
  return data;
}
