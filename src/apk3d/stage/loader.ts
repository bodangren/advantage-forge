/**
 * Loads web models (GLB with meshopt compression) and textures once per page: a second request
 * for the same file returns the same promise, so games that share a pack download it once.
 */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { MODEL_PACK_VERSION, buildModelIndex, modelPackRoot, modelPackSchema, type ModelIndex, type ModelPack } from '../contracts/index.js';

export type { GLTF };

export class ModelLoader {
  private readonly gltf = new GLTFLoader();
  private readonly models = new Map<string, Promise<GLTF>>();
  private readonly ready = new Map<string, GLTF>();
  private readonly textures = new Map<string, Promise<THREE.Texture>>();
  private readonly packs = new Map<string, Promise<ModelPack>>();
  private readonly loadedPacks = new Map<string, ModelPack>();
  private index: ModelIndex = buildModelIndex([]);

  /** `base` is the site root that relative paths start from (for example './'). */
  constructor(private readonly base: string) {
    this.gltf.setMeshoptDecoder(MeshoptDecoder);
  }

  /**
   * Loads the manifests of model packs (`packs/<id>/<version>/pack.json`), once each. Afterwards
   * `modelPath` and `presetPath` answer from them. A manifest that fails to load rejects: a game
   * that names a pack needs it.
   */
  async loadPacks(ids: readonly string[], version: string = MODEL_PACK_VERSION): Promise<void> {
    await Promise.all(
      ids.map((id) => {
        let p = this.packs.get(id);
        if (!p) {
          p = fetch(`${this.base}${modelPackRoot(id, version)}/pack.json`).then(async (res) => {
            if (!res.ok) throw new Error(`model pack "${id}": ${res.status} ${res.statusText}`);
            return modelPackSchema.parse(await res.json());
          });
          p.catch(() => this.packs.delete(id));
          this.packs.set(id, p);
        }
        return p.then((pack) => void this.loadedPacks.set(id, pack));
      }),
    );
    this.index = buildModelIndex(this.loadedPacks.values());
  }

  /** The path of a model: from a loaded pack, else the legacy `models/<name>.glb`. */
  modelPath(name: string): string {
    return this.index.path(name) ?? `models/${name}.glb`;
  }

  /** The path of a hero's preset texture: from a loaded pack, else the legacy `models/<hero>/<preset>.webp`. */
  presetPath(hero: string, preset: string): string {
    return this.index.preset(hero, preset) ?? `models/${hero}/${preset}.webp`;
  }

  /** Loads `path` (relative to the base), once. */
  load(path: string): Promise<GLTF> {
    let p = this.models.get(path);
    if (!p) {
      p = this.gltf.loadAsync(this.base + path).then((g) => {
        this.ready.set(path, g);
        return g;
      });
      // A failed load may be retried later.
      p.catch(() => this.models.delete(path));
      this.models.set(path, p);
    }
    return p;
  }

  /** The model if it has finished loading. */
  get(path: string): GLTF | undefined {
    return this.ready.get(path);
  }

  /**
   * Loads every path; `progress` gets 0 to 1. A missing file is skipped (it leaves a gap in a set,
   * not an error) and is listed in the result.
   */
  async preload(paths: readonly string[], progress: (p: number) => void = () => undefined): Promise<{ missing: string[] }> {
    const missing: string[] = [];
    let done = 0;
    await Promise.all(
      paths.map(async (path) => {
        try {
          await this.load(path);
        } catch {
          missing.push(path);
        }
        progress(++done / Math.max(1, paths.length));
      }),
    );
    return { missing };
  }

  /** Loads a color texture made for a glTF material (no vertical flip, sRGB). */
  texture(path: string): Promise<THREE.Texture> {
    let p = this.textures.get(path);
    if (!p) {
      p = new THREE.TextureLoader().loadAsync(this.base + path).then((tex) => {
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      });
      p.catch(() => this.textures.delete(path));
      this.textures.set(path, p);
    }
    return p;
  }

  /** Frees the GPU memory of every loaded model and texture. */
  dispose(): void {
    for (const g of this.ready.values()) disposeObject(g.scene);
    for (const p of this.textures.values()) void p.then((t) => t.dispose()).catch(() => undefined);
    this.models.clear();
    this.ready.clear();
    this.textures.clear();
    this.packs.clear();
    this.loadedPacks.clear();
    this.index = buildModelIndex([]);
  }
}

/** Frees the geometries, materials, and textures under `root`. */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    mesh.geometry?.dispose();
    const mats = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
    for (const m of mats) {
      for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose();
      m.dispose();
    }
  });
}
