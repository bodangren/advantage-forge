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
});
