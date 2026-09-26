import * as THREE from 'three';
import { rgb, type ColorInput } from './sdf/color.js';
import type { Sdf, Vec3 } from './sdf/core.js';
import type { MeshData, MeshOptions, MeshStats } from './sdf/mesher.js';
import { makeContext, bakeOptions } from './tasks.js';
import { dilate, type BakeResult } from './texture/bake.js';
import { encodePng } from './texture/png.js';
import { unwrap, type UvMesh } from './texture/unwrap.js';
import { openPool } from './workers.js';
import { buildRig, sampleAnimation, skinWeights, type AnimationDef, type SkeletonDef } from './rig.js';

export interface BodyOptions {
  /** Base color where no paint covers the surface. Default '#cccccc'. */
  readonly color?: ColorInput;
  /** 0 = mirror, 1 = matte. Default 0.6. */
  readonly roughness?: number;
  /** 0 = dielectric (skin, cloth, wood), 1 = metal. Default 0. */
  readonly metalness?: number;
  readonly emissive?: ColorInput;
  readonly emissiveIntensity?: number;
  /** Below 1 makes the body see-through (glass panes, mist, magic effects). Default 1. */
  readonly opacity?: number;
  /** Mesh cell size in meters for this body. Default: the asset's `detail`. */
  readonly detail?: number;
  /** Max surface deviation (m) allowed when reducing triangles. Default 12% of `detail`. */
  readonly maxError?: number;
  /** Hard triangle cap for this body. */
  readonly maxTriangles?: number;
  /** Opt-in: keep soft paint gradients and noise paint during triangle reduction. Try 1-4. */
  readonly paintWeight?: number;
  /** Faceted shading (one normal per triangle) for a deliberately chunky look. */
  readonly flat?: boolean;
  /**
   * Surface detail that goes only into the baked normal map (and not into the mesh): a function
   * returning an outward offset in meters, usually a few millimeters of noise. Use it for stone,
   * bark, wood grain, shingles, and cloth weave, so the mesh stays medium-poly.
   * Only visible in textured builds (not with --fast).
   */
  readonly bump?: (x: number, y: number, z: number) => number;
  /**
   * Bind the whole body rigidly to one skeleton bone (helmets, weapons, buckles). Without it, a
   * body in a rigged asset is skinned from the `.bone(name)` tags on its parts.
   */
  readonly bone?: string;
  /**
   * Relative share of the texture atlas: 2 gives this body twice the texels per meter (4x the
   * area). Raise it for faces and small painted detail; lower it for large plain surfaces.
   */
  readonly textureDensity?: number;
}

export interface GroupOptions {
  /** Pivot of the group in parent space. Children are authored in the group's local space. */
  readonly at?: Vec3;
  /** Euler rotation in degrees (X, then Y, then Z). */
  readonly rotate?: Vec3;
}

/** The authoring surface an asset's `build` function receives. */
export interface AssetContext {
  /** Mesh a signed distance shape into a named, smooth, vertex-colored body. */
  body(name: string, shape: Sdf, options?: BodyOptions): void;
  /** Add any three.js object (escape hatch for hand-built geometry). */
  add(name: string, object: THREE.Object3D): void;
  /**
   * A named node with its own pivot, for parts that will move (arms, doors, lids, heads).
   * Everything added inside the callback is a child of this node.
   */
  group(name: string, options: GroupOptions, fn: (k: AssetContext) => void): void;
  /**
   * Define the skeleton (joint positions in the rest pose, in world meters). Bodies are then
   * skinned: from `.bone(name)` tags on their parts, or rigidly with the `bone` body option.
   */
  skeleton(def: SkeletonDef): void;
  /** Add an animation clip. `pose(t, phase)` returns bone rotations and moves at time `t`. */
  animation(name: string, def: AnimationDef): void;
}

export interface AssetDefinition {
  readonly name: string;
  readonly description?: string;
  /** Default mesh cell size in meters. Default 0.006. */
  readonly detail?: number;
  /** Skin blend width in meters (how softly weights pass between bones). Default 0.015. */
  readonly skinBlend?: number;
  /** Optional reference image (repo-relative) used by `forge render --ref`. */
  readonly reference?: string;
  /**
   * Baked textures (UV atlas with base color, normal, and occlusion/roughness/metalness maps).
   * Default on at 1024 texels. `false` exports vertex colors only (faster).
   */
  readonly texture?: TextureOptions | false;
  build(k: AssetContext): void | Promise<void>;
}

export interface TextureOptions {
  /** Atlas width and height in texels. Default 1024. */
  readonly size?: number;
  /** Bake a normal map from the true surface. Default true. */
  readonly normal?: boolean;
  /** Bake ambient occlusion. Default true. */
  readonly ao?: boolean;
  /** Occlusion reach in meters. Default 3% of the asset's largest dimension. */
  readonly aoRadius?: number;
}

/** PNG images of the shared texture atlas, attached to `root.userData.forgeTextures`. */
export interface AtlasImages {
  readonly size: number;
  readonly baseColor: Uint8Array;
  readonly normal: Uint8Array;
  readonly orm: Uint8Array;
}

export function defineAsset(def: AssetDefinition): AssetDefinition {
  return def;
}

export interface MeshResult {
  readonly mesh: MeshData;
  readonly stats: MeshStats;
}

export interface BodyStats extends MeshStats {
  readonly name: string;
}

export interface BuildResult {
  readonly root: THREE.Group;
  readonly stats: {
    readonly name: string;
    readonly triangles: number;
    readonly bounds: { readonly min: Vec3; readonly max: Vec3; readonly size: Vec3 };
    readonly bodies: readonly BodyStats[];
    readonly texture: { readonly size: number; readonly milliseconds: number } | null;
    readonly bones: number;
    readonly animations: readonly { readonly name: string; readonly duration: number }[];
    readonly milliseconds: number;
  };
}

export interface PendingBody {
  readonly name: string;
  readonly shape: Sdf;
  readonly options: BodyOptions;
  readonly parent: THREE.Object3D;
}

/** Run an asset's build function and collect its bodies without meshing them. */
export interface Collected {
  readonly root: THREE.Group;
  readonly pending: PendingBody[];
  readonly skeleton: SkeletonDef | null;
  readonly animations: ReadonlyMap<string, AnimationDef>;
}

export async function collectBodies(def: AssetDefinition): Promise<Collected> {
  const root = new THREE.Group();
  root.name = def.name;
  const pending: PendingBody[] = [];
  const names = new Set<string>();
  const claim = (name: string) => {
    if (names.has(name)) throw new Error(`Duplicate part name '${name}'. Part names must be unique.`);
    names.add(name);
  };

  const context = (parent: THREE.Object3D): AssetContext => ({
    body(name, shape, options = {}) {
      claim(name);
      pending.push({ name, shape, options, parent });
    },
    add(name, object) {
      claim(name);
      object.name = name;
      parent.add(object);
    },
    group(name, options, fn) {
      claim(name);
      const g = new THREE.Group();
      g.name = name;
      if (options.at) g.position.set(...options.at);
      if (options.rotate)
        g.rotation.set(
          THREE.MathUtils.degToRad(options.rotate[0]),
          THREE.MathUtils.degToRad(options.rotate[1]),
          THREE.MathUtils.degToRad(options.rotate[2]),
        );
      parent.add(g);
      fn(context(g));
    },
    skeleton(s) {
      if (skeleton) throw new Error('skeleton() can only be called once.');
      skeleton = s;
    },
    animation(name, a) {
      if (animations.has(name)) throw new Error(`Duplicate animation '${name}'.`);
      animations.set(name, a);
    },
  });

  let skeleton: SkeletonDef | null = null;
  const animations = new Map<string, AnimationDef>();
  await def.build(context(root));
  if (animations.size > 0 && !skeleton)
    throw new Error('Animations need a skeleton: call k.skeleton({...}) first.');
  // Animation tracks address nodes by name, so bones and parts must never share a name.
  if (skeleton)
    for (const bone of Object.keys(skeleton))
      if (names.has(bone))
        throw new Error(
          `Bone '${bone}' has the same name as a part. Rename one (for example '${bone}-mesh').`,
        );
  return { root, pending, skeleton, animations };
}

export function meshOptions(def: AssetDefinition, body: PendingBody): MeshOptions {
  const o = body.options;
  return {
    label: body.name,
    cellSize: o.detail ?? def.detail ?? 0.006,
    baseColor: rgb(o.color ?? '#cccccc'),
    ...(o.maxError !== undefined ? { maxError: o.maxError } : {}),
    ...(o.maxTriangles !== undefined ? { maxTriangles: o.maxTriangles } : {}),
    ...(o.paintWeight !== undefined ? { attributeWeight: o.paintWeight } : {}),
  };
}

export interface BuildOptions {
  /**
   * Absolute path of the asset module. When given, bodies are meshed and baked in parallel worker
   * threads, each of which re-imports the module (shapes are closures and cannot be sent).
   */
  readonly source?: string;
  /** Override the asset's texture size; 0 disables textures (vertex colors only). */
  readonly textureSize?: number;
}

/** Run an asset's build function, mesh every body, and (by default) unwrap and bake textures. */
export async function buildAsset(def: AssetDefinition, options: BuildOptions = {}): Promise<BuildResult> {
  const t0 = performance.now();
  const { root, pending, skeleton, animations } = await collectBodies(def);
  const ctx = makeContext(def, root, pending);
  const rig = skeleton ? buildRig(skeleton) : null;
  if (rig) {
    for (const b of pending)
      if (b.parent !== root)
        throw new Error(
          `Body '${b.name}' is inside a group; in a rigged asset, use bones instead of groups.`,
        );
    root.add(rig.root);
    root.updateMatrixWorld(true);
  }
  const threeSkeleton = rig ? new THREE.Skeleton([...rig.bones]) : null;
  const size = options.textureSize ?? (def.texture === false ? 0 : (def.texture?.size ?? 1024));
  const pool = await openPool(ctx, options.source, pending.length);

  let meshed: MeshResult[];
  let uvMeshes: UvMesh[] | null = null;
  let images: AtlasImages | null = null;
  let textureMs = 0;
  try {
    meshed = (await pool.run(
      pending.map((_, index) => ({ kind: 'mesh' as const, index, paintSeams: size === 0 })),
    )) as MeshResult[];
    for (const [i, r] of meshed.entries())
      if (r.mesh.indices.length === 0)
        throw new Error(`Body '${pending[i]!.name}' produced no surface. Check its position and size.`);
    if (size > 0 && pending.length > 0) {
      const t1 = performance.now();
      uvMeshes = await unwrap(
        meshed.map((r) => r.mesh),
        size,
        Math.max(2, Math.round(size / 256)),
        pending.map((b) => b.options.textureDensity ?? 1),
      );
      const tUnwrap = performance.now();
      const extent = sceneExtent(meshed.map((r) => r.mesh));
      const bakes = (await pool.run(
        uvMeshes.map((mesh, index) => ({
          kind: 'bake' as const,
          index,
          mesh,
          options: bakeOptions(def, pending[index]!, size, extent * 0.03),
        })),
      )) as BakeResult[];
      const tBake = performance.now();
      images = composeAtlas(bakes, size);
      textureMs = Math.round(performance.now() - t1);
      if (process.env.FORGE_DEBUG)
        console.log(
          `  texture ${size}: unwrap ${Math.round(tUnwrap - t1)} bake ${Math.round(tBake - tUnwrap)} compose ${Math.round(performance.now() - tBake)} ms`,
        );
    }
  } finally {
    await pool.close();
  }

  const bodies: BodyStats[] = [];
  pending.forEach((body, i) => {
    const o = body.options;
    const { stats } = meshed[i]!;
    const mesh = uvMeshes ? uvMeshes[i]! : meshed[i]!.mesh;
    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(mesh.normals, 3));
    if (uvMeshes) {
      const uv = uvMeshes[i]!;
      geometry.setAttribute('uv', new THREE.BufferAttribute(uv.uvs, 2));
      geometry.setAttribute('tangent', new THREE.BufferAttribute(uv.tangents, 4));
    } else geometry.setAttribute('color', new THREE.BufferAttribute(mesh.colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
    if (o.flat === true) {
      geometry = geometry.toNonIndexed();
      geometry.computeVertexNormals();
    }
    const material = new THREE.MeshStandardMaterial({
      name: body.name,
      vertexColors: !uvMeshes,
      // With textures, roughness and metalness live in the ORM map.
      roughness: uvMeshes ? 1 : (o.roughness ?? 0.6),
      metalness: uvMeshes ? 1 : (o.metalness ?? 0),
      ...(o.opacity !== undefined && o.opacity < 1
        ? { transparent: true, opacity: o.opacity, depthWrite: false }
        : {}),
      ...(o.emissive !== undefined
        ? {
            emissive: new THREE.Color().setRGB(...rgb(o.emissive)),
            emissiveIntensity: o.emissiveIntensity ?? 1,
          }
        : {}),
    });
    let m: THREE.Mesh;
    if (rig && threeSkeleton) {
      const w = skinWeights(
        geometry.getAttribute('position').array as Float32Array,
        body.shape.tags,
        rig,
        { ...(o.bone !== undefined ? { bone: o.bone } : {}), blend: def.skinBlend ?? 0.015 },
        body.name,
      );
      geometry.setAttribute('skinIndex', new THREE.BufferAttribute(w.index, 4));
      geometry.setAttribute('skinWeight', new THREE.BufferAttribute(w.weight, 4));
      const sm = new THREE.SkinnedMesh(geometry, material);
      sm.bind(threeSkeleton, new THREE.Matrix4());
      m = sm;
    } else m = new THREE.Mesh(geometry, material);
    m.name = body.name;
    body.parent.add(m);
    bodies.push({ name: body.name, ...stats });
  });
  if (images) root.userData.forgeTextures = images;
  if (rig) root.animations = [...animations].map(([name, a]) => sampleAnimation(name, a, rig));

  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  let triangles = 0;
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      const g = o.geometry as THREE.BufferGeometry;
      triangles += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
    }
  });
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  return {
    root,
    stats: {
      name: def.name,
      triangles,
      bounds: {
        min: [r3(box.min.x), r3(box.min.y), r3(box.min.z)],
        max: [r3(box.max.x), r3(box.max.y), r3(box.max.z)],
        size: [r3(box.max.x - box.min.x), r3(box.max.y - box.min.y), r3(box.max.z - box.min.z)],
      },
      bodies,
      texture: images ? { size: images.size, milliseconds: textureMs } : null,
      bones: rig ? rig.bones.length : 0,
      animations: root.animations.map((c) => ({ name: c.name, duration: c.duration })),
      milliseconds: Math.round(performance.now() - t0),
    },
  };
}

function sceneExtent(meshes: readonly MeshData[]): number {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const m of meshes)
    for (let i = 0; i < m.positions.length; i++) {
      const a = i % 3;
      min[a] = Math.min(min[a]!, m.positions[i]!);
      max[a] = Math.max(max[a]!, m.positions[i]!);
    }
  return Math.max(max[0]! - min[0]!, max[1]! - min[1]!, max[2]! - min[2]!);
}

/** Paint every body's baked texels into the shared atlas, dilate the edges, and encode PNGs. */
function composeAtlas(bakes: readonly BakeResult[], size: number): AtlasImages {
  const n = size * size;
  const color = new Uint8Array(n * 3);
  const normal = new Uint8Array(n * 3);
  const orm = new Uint8Array(n * 3);
  const filled = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    normal.set([128, 128, 255], i * 3);
    orm.set([255, 255, 0], i * 3);
  }
  for (const b of bakes)
    for (let k = 0; k < b.texels.length; k++) {
      const id = b.texels[k]!;
      filled[id] = 1;
      color.set(b.color.subarray(k * 3, k * 3 + 3), id * 3);
      normal.set(b.normal.subarray(k * 3, k * 3 + 3), id * 3);
      orm.set(b.orm.subarray(k * 3, k * 3 + 3), id * 3);
    }
  const passes = Math.max(4, Math.round(size / 128));
  for (const image of [color, normal, orm]) dilate(image, filled, size, passes);
  return {
    size,
    baseColor: encodePng(size, size, 3, color),
    normal: encodePng(size, size, 3, normal),
    orm: encodePng(size, size, 3, orm),
  };
}
