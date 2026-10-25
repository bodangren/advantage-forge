import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

const forbidden = vi.hoisted(() => () => { throw new Error('Forbidden real operation'); });
vi.mock('node:child_process', () => ({ spawn: forbidden, spawnSync: forbidden, exec: forbidden,
  execSync: forbidden, execFile: forbidden, execFileSync: forbidden, fork: forbidden }));
vi.mock('playwright', () => ({ chromium: { launch: forbidden } }));
vi.mock('vite', () => ({ createServer: forbidden }));

type Resource = { dispose(): void; addEventListener(type: string, listener: () => void): void };
type Observation = { wireframe: boolean; wireGeometry: boolean; unsafeLine: boolean };

// This fake supplies renderer operations, not an edge technique. It creates no WebGL context.
function fixture(throwOnRender = false) {
  const owned: { resource: Resource; disposed: number }[] = [];
  const constructors = new Map<PropertyKey, unknown>();
  const three = new Proxy(THREE, {
    get(namespace, key) {
      const value: unknown = Reflect.get(namespace, key);
      if (typeof key !== 'string' || typeof value !== 'function'
        || !(key.endsWith('Material') || key.endsWith('RenderTarget'))) return value;
      if (!constructors.has(key)) constructors.set(key, new Proxy(value, {
        construct(ctor, args) {
          const resource = Reflect.construct(ctor, args) as Resource;
          const record = { resource, disposed: 0 };
          resource.addEventListener('dispose', () => { record.disposed++; });
          owned.push(record);
          return resource;
        },
      }));
      return constructors.get(key);
    },
  });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#234567');
  const previousOverride = new THREE.MeshBasicMaterial({ color: '#777777' });
  scene.overrideMaterial = previousOverride;
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 80, 40), new THREE.MeshStandardMaterial());
  const box = new THREE.Mesh(new THREE.BoxGeometry(), [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial()]);
  box.position.z = -2;
  box.visible = false;
  scene.add(sphere, box);
  const camera = new THREE.PerspectiveCamera(39, 1.7, 0.3, 100);
  camera.position.set(0, 0, 5);
  camera.updateProjectionMatrix();
  // A non-default matrix exposes a restore that merely recalculates the projection.
  camera.projectionMatrix.elements[8] = 0.125;
  const size = new THREE.Vector2(31, 23);
  let ratio = 1.5;
  let target: THREE.WebGLRenderTarget | null = new THREE.WebGLRenderTarget(3, 2);
  const clearColor = new THREE.Color('#abcdef');
  let clearAlpha = 0.4;
  const observations: Observation[] = [];
  const observe = (renderScene: THREE.Scene) => {
    const observation = { wireframe: false, wireGeometry: false, unsafeLine: false };
    const inspectMaterial = (material: THREE.Material | null | undefined, line = false) => {
      if (!material) return;
      if ((material as THREE.MeshBasicMaterial).wireframe === true) observation.wireframe = true;
      if (line && material.depthTest !== true) observation.unsafeLine = true;
    };
    inspectMaterial(renderScene.overrideMaterial);
    renderScene.traverseVisible((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry?.type === 'WireframeGeometry') observation.wireGeometry = true;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) inspectMaterial(material, Boolean((object as THREE.Line).isLine));
    });
    observations.push(observation);
  };
  const renderer = {
    autoClear: true,
    getSize: (out: THREE.Vector2) => out.copy(size),
    getDrawingBufferSize: (out: THREE.Vector2) => out.copy(size).multiplyScalar(ratio).floor(),
    setSize: (width: number, height: number) => { size.set(width, height); },
    getPixelRatio: () => ratio,
    setPixelRatio: (value: number) => { ratio = value; },
    getRenderTarget: () => target,
    setRenderTarget: (value: THREE.WebGLRenderTarget | null) => { target = value; },
    getClearColor: (out: THREE.Color) => out.copy(clearColor),
    getClearAlpha: () => clearAlpha,
    setClearColor: (color: THREE.ColorRepresentation, alpha?: number) => {
      clearColor.set(color); if (alpha !== undefined) clearAlpha = alpha;
    },
    setClearAlpha: (alpha: number) => { clearAlpha = alpha; },
    clear: vi.fn(), clearDepth: vi.fn(),
    render: vi.fn((renderScene: THREE.Scene, _camera: THREE.Camera) => {
      observe(renderScene);
      if (throwOnRender) throw new Error('Test render failure');
    }),
    readRenderTargetPixels: (_target: unknown, _x: number, _y: number, width: number, height: number, pixels: Uint8Array) => {
      pixels.fill(255);
      // The final stored WebGL row is dark. The returned top row must be dark.
      for (let x = 0; x < width; x++) {
        const offset = ((height - 1) * width + x) * 4;
        pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0;
      }
    },
  };
  const objects: { object: THREE.Object3D; visible: boolean; material: unknown }[] = [];
  scene.traverse((object) => objects.push({ object, visible: object.visible, material: (object as THREE.Mesh).material }));
  const snapshot = () => ({
    aspect: camera.aspect, projection: [...camera.projectionMatrix.elements], size: size.toArray(), ratio,
    target, clear: clearColor.getHex(), clearAlpha, background: scene.background, override: scene.overrideMaterial,
    children: [...scene.children],
  });
  return { three, parts: { scene, camera, renderer: renderer as unknown as THREE.WebGLRenderer },
    renderer, scene, camera, owned, observations, objects, snapshot };
}

describe('Line-art scene pass', () => {
  it('T46: success and render failure restore state and dispose each created resource', async () => {
    // Falsification: one changed state survives, or one created resource lacks disposal.
    const { renderLineArtPass } = await import('../src/storytime/line-art-pass.js');
    for (const throws of [false, true]) {
      const f = fixture(throws);
      const before = f.snapshot();
      const run = Promise.resolve().then(() => renderLineArtPass(f.three, f.parts, { width: 8, height: 6 }));
      if (throws) await expect(run).rejects.toThrow('Test render failure'); else await run;
      expect(f.renderer.render).toHaveBeenCalled();
      expect(f.snapshot()).toEqual(before);
      expect(f.scene.background).toBe(before.background);
      expect(f.scene.overrideMaterial).toBe(before.override);
      expect(f.renderer.getRenderTarget()).toBe(before.target);
      for (const saved of f.objects) {
        expect(saved.object.visible).toBe(saved.visible);
        expect((saved.object as THREE.Mesh).material).toBe(saved.material);
      }
      expect(f.owned.length, 'The pass creates tracked resources.').toBeGreaterThan(0);
      for (const record of f.owned) expect(record.disposed, record.resource.constructor.name).toBeGreaterThan(0);
    }
  });

  it('T47: every render excludes wireframe geometry and materials and uses depth-tested lines', async () => {
    // Falsification: wireframe:true on a pass material or a line without depth testing passes.
    const { renderLineArtPass } = await import('../src/storytime/line-art-pass.js');
    const f = fixture();
    await renderLineArtPass(f.three, f.parts, { width: 8, height: 6 });
    expect(f.observations.length, 'At least one scene pass runs.').toBeGreaterThan(0);
    for (const observation of f.observations) expect(observation).toEqual({
      wireframe: false, wireGeometry: false, unsafeLine: false,
    });
    for (const { resource } of f.owned) {
      if ((resource as THREE.Material).isMaterial) expect((resource as THREE.MeshBasicMaterial).wireframe).not.toBe(true);
    }
  });

  it('T48: requested dimensions and binary bytes have the top row first', async () => {
    // Falsification: a wrong size, grey byte, missing byte, or reversed row passes.
    const { renderLineArtPass } = await import('../src/storytime/line-art-pass.js');
    const f = fixture();
    const result = await renderLineArtPass(f.three, f.parts, { width: 8, height: 6 });
    expect(result).toMatchObject({ width: 8, height: 6 });
    expect(result.data).toHaveLength(48);
    expect(Array.from(result.data).every((value) => value === 0 || value === 255)).toBe(true);
    expect(Array.from(result.data.slice(0, 8))).toEqual(Array(8).fill(0));
    expect(Array.from(result.data.slice(-8))).toEqual(Array(8).fill(255));
  });

  it('T70: view distance and relative depth gaps produce same-normal border ink', async () => {
    // Falsification: packed-depth gaps replace relative distance, a small gap makes ink, or a depth border has no ink.
    const pass = await import('../src/storytime/line-art-pass.js');
    const { viewDistance, isDepthEdge } = pass as typeof pass & {
      viewDistance(depth: number, near: number, far: number): number;
      isDepthEdge(distanceA: number, distanceB: number): boolean;
    };
    expect(viewDistance, 'The viewDistance seam exists.').toBeTypeOf('function');
    expect(isDepthEdge, 'The isDepthEdge seam exists.').toBeTypeOf('function');
    const near = 0.2, far = 120;
    // This independent perspective equation does not use the product conversion.
    const depth = (z: number) => far * (z - near) / (z * (far - near));
    for (const z of [0.5, 4, 40]) {
      expect(Math.abs(viewDistance(depth(z), near, far) - z) / z).toBeLessThanOrEqual(0.001);
    }
    for (const [a, b] of [[4, 4.3], [40, 43]]) {
      expect(isDepthEdge(a!, b!)).toBe(true); expect(isDepthEdge(b!, a!)).toBe(true);
    }
    for (const [a, b] of [[4, 4.02], [40, 40.2], [4, 4]]) {
      expect(isDepthEdge(a!, b!)).toBe(false); expect(isDepthEdge(b!, a!)).toBe(false);
    }
    // The mock bytes follow the real three 0.185.1 packDepthToRGBA
    // (node_modules/three/src/renderers/shaders/ShaderChunk/packing.glsl.js, lines 10-30).
    // R holds the most significant byte, A the smallest fraction. The mock stays independent of
    // the product unpacker.
    const packed = (value: number) => {
      const scaled = value * 16777216; // PackFactors.a
      const integer = Math.floor(scaled);
      return [Math.floor(integer / 65536), Math.floor(integer / 256) % 256, integer % 256,
        Math.round((scaled - integer) * 255)];
    };
    for (const [left, right, edge] of [[4, 4.3, true], [40, 43, true], [4, 4.02, false], [40, 40.2, false]] as const) {
      const f = fixture();
      f.camera.near = near; f.camera.far = far; f.camera.updateProjectionMatrix();
      f.renderer.readRenderTargetPixels = (_target, _x, _y, width, height, pixels) => {
        const depthPass = f.scene.overrideMaterial?.type === 'MeshDepthMaterial';
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const bytes = depthPass ? packed(depth(x < width / 2 ? left : right)) : [128, 128, 255, 255];
          pixels.set(bytes, (y * width + x) * 4);
        }
      };
      const result = pass.renderLineArtPass(f.three, f.parts, { width: 12, height: 10 });
      for (let y = 0; y < 10; y++) {
        const border = [...result.data.slice(y * 12 + 4, y * 12 + 8)];
        expect(border.includes(0), `Depth border at ${left}/${right}, row ${y}`).toBe(edge);
      }
      expect([...result.data.slice(0, 4)]).toEqual([255, 255, 255, 255]);
    }
  });

  it('T76: the depth bytes of three 0.185.1 decode to the packed view distance', async () => {
    // Falsification: a little-endian decode, a byte order swap, or a missing seam passes this test.
    const pass = await import('../src/storytime/line-art-pass.js');
    const { viewDistance, isDepthEdge, unpackDepth } = pass as typeof pass & {
      viewDistance(depth: number, near: number, far: number): number;
      isDepthEdge(distanceA: number, distanceB: number): boolean;
      unpackDepth(bytes: [number, number, number, number]): number;
    };
    expect(unpackDepth, 'The unpackDepth seam exists.').toBeTypeOf('function');
    expect(viewDistance, 'The viewDistance seam exists.').toBeTypeOf('function');
    expect(isDepthEdge, 'The isDepthEdge seam exists.').toBeTypeOf('function');

    // Port of three 0.185.1 packDepthToRGBA
    // (node_modules/three/src/renderers/shaders/ShaderChunk/packing.glsl.js, lines 10-30).
    // GLSL modf(x, i) sets i to the truncated part and returns the fraction.
    // The shader writes a float color, and a Uint8 read-back stores round(clamp(value, 0, 1) * 255).
    const modf = (x: number) => {
      const integer = Math.trunc(x);
      return { fraction: x - integer, integer };
    };
    const packUpscale = 256 / 255;
    const inv255 = 1 / 255;
    const shiftRight8 = 1 / 256;
    const packFactorsA = 256 * 256 * 256;
    const toByte = (channel: number) => Math.round(Math.min(Math.max(channel, 0), 1) * 255);
    const packDepthToRgba = (value: number): [number, number, number, number] => {
      if (value <= 0) return [0, 0, 0, 0];
      if (value >= 1) return [255, 255, 255, 255];
      const af = modf(value * packFactorsA);
      const bf = modf(af.integer * shiftRight8);
      const gf = modf(bf.integer * shiftRight8);
      return [
        toByte(gf.integer * inv255),
        toByte(gf.fraction * packUpscale),
        toByte(bf.fraction * packUpscale),
        toByte(af.fraction),
      ];
    };

    // The round trip proves that the product decode inverts the three.js pack.
    for (const value of [0.1, 0.25, 0.5, 0.75, 0.97695392370224, 0.999]) {
      const packed = packDepthToRgba(value);
      expect(Math.abs(unpackDepth(packed) - value), `Depth ${value} from ${packed.join(',')}`)
        .toBeLessThanOrEqual(1e-6);
    }

    // Real GPU bytes from the smoke diagnostic run. The values are copied from
    // out/storytime/l2/unit1/smoke/diag-2026-10-25T23-00-20-478Z/diag.json.
    // The fixture camera near and far are 0.1 m and 50 m.
    // The near plane probe at pixel [230, 128] reads [250, 25, 167, 0] and the far plane probe at
    // pixel [252, 128] reads [250, 140, 49, 0]. The same file records 4.0000 m and 4.3000 m.
    const near = 0.1, far = 50;
    const nearPlaneBytes: [number, number, number, number] = [250, 25, 167, 0];
    const farPlaneBytes: [number, number, number, number] = [250, 140, 49, 0];
    const nearPlaneDistance = viewDistance(unpackDepth(nearPlaneBytes), near, far);
    const farPlaneDistance = viewDistance(unpackDepth(farPlaneBytes), near, far);
    expect(Math.abs(nearPlaneDistance - 4.0), 'The near plane byte set gives 4.0 m.')
      .toBeLessThanOrEqual(0.01);
    expect(Math.abs(farPlaneDistance - 4.3), 'The far plane byte set gives 4.3 m.')
      .toBeLessThanOrEqual(0.01);
    expect(isDepthEdge(nearPlaneDistance, farPlaneDistance), 'The two planes are a depth edge.')
      .toBe(true);
    expect(isDepthEdge(farPlaneDistance, nearPlaneDistance), 'The two planes are a depth edge.')
      .toBe(true);
  });
});
