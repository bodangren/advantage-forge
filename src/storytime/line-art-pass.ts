import type * as THREE from 'three';

/**
 * Form-edge line-art pass over a live three.js scene. It renders the scene twice into render
 * targets with override materials — view-space normals (MeshNormalMaterial) and packed depth
 * (MeshDepthMaterial with RGBADepthPacking) — then thresholds normal discontinuities and relative
 * view-distance gaps between neighboring pixels into a 1-bit picture, top row first. Each packed
 * depth sample is converted to the distance from the camera before the comparison.
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
/**
 * Neighbor view distances with a bigger relative gap are an occlusion or crease edge. The limit
 * is relative to the nearer distance: 4.0 m against 4.3 m (7.5 percent) is an edge, 4.0 m against
 * 4.02 m (0.5 percent) is not. This pass uses 2 percent.
 */
export const DEPTH_EDGE_RELATIVE_GAP = 0.02;

/** The view distance of a packed perspective depth sample between the camera near and far planes. */
export function viewDistance(depth: number, near: number, far: number): number {
  return (far * near) / (far - depth * (far - near));
}

/** Two neighbor view distances with a relative gap above the limit are a depth edge. */
export function isDepthEdge(distanceA: number, distanceB: number): boolean {
  const nearer = Math.min(Math.abs(distanceA), Math.abs(distanceB));
  if (nearer === 0) return distanceA !== distanceB;
  return Math.abs(distanceA - distanceB) / nearer > DEPTH_EDGE_RELATIVE_GAP;
}

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
    return {
      width: size.width,
      height: size.height,
      data: edgeData(normals, depths, size, camera.near, camera.far),
    };
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

/**
 * Inverse of three 0.185.1 `packDepthToRGBA`. The shader writes the most significant byte to R and
 * the smallest fraction to A, so the RGBA tuple is big-endian: R/256 + G/65536 + B/16777216 +
 * A/255/16777216. The alpha term is below 1.5e-8 and kept for exactness.
 */
export function unpackDepth(bytes: readonly [number, number, number, number]): number {
  return (
    bytes[0]! / 256 +
    bytes[1]! / 65536 +
    bytes[2]! / 16777216 +
    bytes[3]! / 255 / 16777216
  );
}

function edgeData(
  normals: Uint8Array,
  depths: Uint8Array,
  size: LineArtPassSize,
  near: number,
  far: number,
): Uint8Array {
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
  const depthBytes: [number, number, number, number] = [0, 0, 0, 0];
  const depthAt = (index: number): number => {
    const base = index * 4;
    depthBytes[0] = depths[base]!;
    depthBytes[1] = depths[base + 1]!;
    depthBytes[2] = depths[base + 2]!;
    depthBytes[3] = depths[base + 3]!;
    return unpackDepth(depthBytes);
  };
  const edgeBetween = (a: number, b: number): boolean => {
    if (isDepthEdge(viewDistance(depthAt(a), near, far), viewDistance(depthAt(b), near, far))) {
      return true;
    }
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
