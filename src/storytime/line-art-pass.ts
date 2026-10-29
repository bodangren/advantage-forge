import type * as THREE from 'three';

/**
 * Form-edge line-art pass over a live three.js scene. It renders the scene twice into render
 * targets with override materials — view-space normals (MeshNormalMaterial) and packed depth
 * (MeshDepthMaterial with RGBADepthPacking) — then thresholds normal discontinuities and relative
 * view-distance gaps between neighboring pixels into a 1-bit picture, top row first. Each packed
 * depth sample is converted to the distance from the camera before the comparison.
 *
 * Version 3 adds a third render with unlit copies of the scene materials (base color, texture,
 * and vertex colors, no light). Strong color gaps in it are painted detail edges: eyes, brows,
 * mouths, and shirt marks. The edges then grow to a stroke that scales with the output width.
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

/**
 * The technique ID of this pass. Version 3 added painted detail edges (an unlit color pass) and
 * a stroke that scales with the output resolution, so a 4000 px wide picture has outlines of about
 * 14 px (specification v1 asks for 12 px or more). Version 4 keeps the 14 px stroke on every print
 * size and compares paint over 4 px, so a thin painted line on a close face (a smile) stays.
 */
export const LINE_ART_PASS_TECHNIQUE = 'song-page-form-paint-edges-viewdepth-scaled-1bit-v4';

/** The stroke radius at a 4000 px wide output. A 2 px edge grows to 2 * 6 + 2 = 14 px. */
export const LINE_RADIUS_PX_AT_4000 = 6;

/** Print outputs are this wide or wider; their outlines never go below the 4000 px stroke. */
export const PRINT_MIN_WIDTH_PX = 1000;

/**
 * The stroke radius for one output width. The 12 px rule is absolute, so a print output (class C
 * is 1500 px wide) keeps at least the 4000 px radius and a wider output scales up. Small
 * diagnostic sizes scale down and keep the 2 px edge.
 */
export function lineRadiusFor(width: number): number {
  const scaled = Math.max(0, Math.round((LINE_RADIUS_PX_AT_4000 * width) / 4000));
  return width >= PRINT_MIN_WIDTH_PX ? Math.max(LINE_RADIUS_PX_AT_4000, scaled) : scaled;
}

/** Ink fragments smaller than this pixel count at a 4000 px wide output are noise, not lines. */
export const MIN_FRAGMENT_PX_AT_4000 = 40;

/**
 * Neighbor albedo colors with a bigger largest-channel gap (linear 0 to 1) are a painted edge:
 * eyes, brows, and a mouth on skin, or a star on a shirt. Soft paint noise stays below it.
 */
export const PAINT_EDGE_GAP = 0.2;

/** The paint comparison distance: 4 px on a print output, so a magnified soft paint edge counts. */
export function paintStepFor(width: number): number {
  return width >= PRINT_MIN_WIDTH_PX
    ? Math.max(4, Math.round((4 * width) / 4000))
    : Math.max(1, Math.round((2 * width) / 4000));
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
  const paintTarget = new three.WebGLRenderTarget(size.width, size.height);
  // The paint pass swaps each visible mesh material for an unlit copy; the finally block puts
  // every original material back and disposes every copy.
  const swapped: Array<{ mesh: THREE.Mesh; material: THREE.Mesh['material'] }> = [];
  const paintMaterials = new Map<THREE.Material, THREE.MeshBasicMaterial>();
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
    scene.overrideMaterial = null;
    const paintCopy = (material: THREE.Material): THREE.MeshBasicMaterial => {
      let copy = paintMaterials.get(material);
      if (!copy) {
        const source = material as THREE.MeshStandardMaterial;
        copy = new three.MeshBasicMaterial({
          map: source.map ?? null,
          vertexColors: source.vertexColors === true,
          transparent: source.transparent,
          opacity: source.opacity,
          alphaTest: source.alphaTest,
          side: source.side,
          depthWrite: source.depthWrite,
        });
        if (source.color) copy.color.copy(source.color);
        paintMaterials.set(material, copy);
      }
      return copy;
    };
    scene.traverseVisible((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      swapped.push({ mesh, material: mesh.material });
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(paintCopy) : paintCopy(mesh.material);
    });
    renderer.setRenderTarget(paintTarget);
    renderer.render(scene, camera);
    const paint = readPixels(renderer, paintTarget, size);
    const data = edgeData(normals, depths, paint, size, camera.near, camera.far);
    return {
      width: size.width,
      height: size.height,
      data: thicken(
        dropFragments(data, size, Math.round((MIN_FRAGMENT_PX_AT_4000 * size.width) / 4000)),
        size,
        lineRadiusFor(size.width),
      ),
    };
  } finally {
    for (let index = swapped.length - 1; index >= 0; index -= 1) {
      swapped[index]!.mesh.material = swapped[index]!.material;
    }
    for (const copy of paintMaterials.values()) copy.dispose();
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
    paintTarget.dispose();
  }
}

/**
 * Removes ink fragments (8-connected) with fewer than `minPixels` pixels: isolated specks of
 * texture noise and grazing-angle depth noise. Real outlines are much longer than the limit.
 */
export function dropFragments(data: Uint8Array, size: LineArtPassSize, minPixels: number): Uint8Array {
  if (minPixels <= 1) return data;
  const { width, height } = size;
  const seen = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  const component: number[] = [];
  for (let start = 0; start < data.length; start += 1) {
    if (data[start] !== 0 || seen[start]) continue;
    component.length = 0;
    let top = 0;
    stack[top++] = start;
    seen[start] = 1;
    while (top > 0) {
      const index = stack[--top]!;
      component.push(index);
      const x = index % width;
      const y = (index - x) / width;
      for (let dy = -1; dy <= 1; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const next = ny * width + nx;
          if (data[next] === 0 && !seen[next]) {
            seen[next] = 1;
            stack[top++] = next;
          }
        }
      }
    }
    if (component.length < minPixels) for (const index of component) data[index] = 255;
  }
  return data;
}

/**
 * Grows each ink pixel to a square of side 2 * radius + 1 (a separable box dilation). The
 * result stays one byte of 0 or 255 per pixel; closed edges stay closed and small gaps close.
 */
export function thicken(data: Uint8Array, size: LineArtPassSize, radius: number): Uint8Array {
  if (radius <= 0) return data;
  const { width, height } = size;
  const rows = new Uint8Array(width * height).fill(255);
  for (let y = 0; y < height; y += 1) {
    const base = y * width;
    let ink = 0;
    for (let x = 0; x < Math.min(radius, width); x += 1) if (data[base + x] === 0) ink += 1;
    for (let x = 0; x < width; x += 1) {
      const enter = x + radius;
      const leave = x - radius - 1;
      if (enter < width && data[base + enter] === 0) ink += 1;
      if (leave >= 0 && data[base + leave] === 0) ink -= 1;
      if (ink > 0) rows[base + x] = 0;
    }
  }
  const out = new Uint8Array(width * height).fill(255);
  for (let x = 0; x < width; x += 1) {
    let ink = 0;
    for (let y = 0; y < Math.min(radius, height); y += 1) if (rows[y * width + x] === 0) ink += 1;
    for (let y = 0; y < height; y += 1) {
      const enter = y + radius;
      const leave = y - radius - 1;
      if (enter < height && rows[enter * width + x] === 0) ink += 1;
      if (leave >= 0 && rows[leave * width + x] === 0) ink -= 1;
      if (ink > 0) out[y * width + x] = 0;
    }
  }
  return out;
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
  paint: Uint8Array,
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
  // A baked paint edge is soft over a few output pixels, so the paint pass compares pixels
  // `step` apart.
  const step = paintStepFor(width);
  const paintEdgeBetween = (a: number, b: number): boolean => {
    const ab = a * 4;
    const bb = b * 4;
    const gap = Math.max(
      Math.abs(paint[ab]! - paint[bb]!),
      Math.abs(paint[ab + 1]! - paint[bb + 1]!),
      Math.abs(paint[ab + 2]! - paint[bb + 2]!),
    );
    return gap / 255 > PAINT_EDGE_GAP;
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
      if (x + step < width && paintEdgeBetween(index, index + step)) mark(index);
      if (y + step < height && paintEdgeBetween(index, index + step * width)) mark(index);
    }
  }
  return data;
}
