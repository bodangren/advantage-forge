import * as THREE from 'three';
import { followRef, rgb, setMaskSlot, setSlotColors, tintRef, type ColorInput } from './sdf/color.js';
import type { Sdf, Vec3 } from './sdf/core.js';
import type { MeshData, MeshOptions, MeshStats } from './sdf/mesher.js';
import { makeContext, bakeOptions } from './tasks.js';
import { dilate, type BakeResult } from './texture/bake.js';
import { encodePng } from './texture/png.js';
import { unwrap, type UvMesh } from './texture/unwrap.js';
import { openPool } from './workers.js';
import { groundClip } from './grounding.js';
import { buildRig, sampleAnimation, skinWeights, type AnimationDef, type SkeletonDef } from './rig.js';
import { checkPresets, recolor, slotTable, type Slot, type VariantPresets, type VariantSlots } from './variants.js';
import { resolveEquip, validateEquip, wornAs, type EquipDeclaration, type ResolvedEquip } from './equip.js';

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
  /**
   * A recolorable color: the slot's default color (from the asset's `variants`), darkened
   * (shade < 0) or lightened (shade > 0) by |shade|. Use it wherever a color goes (body color,
   * paint, emissive); the build bakes a tint mask for the slot, so a game can recolor it.
   */
  tint(slot: string, shade?: number): string;
  /**
   * A fixed color that partly follows a slot: exactly `color` in the default look, with `follow`
   * (0 to 1) of the slot's recoloring (a blush or lips that darken with a darker skin).
   */
  tint(slot: string, partial: { readonly color: string; readonly follow: number }): string;
  /**
   * Set only while the asset is worn on (or is) an avatar base with equipment (`wearAsset`):
   * `capHair` is true when a worn head piece keeps the hair, so a hair body builds its capped form;
   * `tuckHair` is true when that piece covers the nape or the cheeks: the tucked form, the cap only.
   */
  readonly worn?: { readonly capHair: boolean; readonly tuckHair?: boolean };
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
  /**
   * Color slots for individual characters (at most 4): slot to { option: color }, the first
   * option being the default, e.g. { eyes: { brown: '#6b4226', blue: '#3a6fb0', green: '#4a8a3a' } }.
   * Colors join a slot through `k.tint(slot)`. A textured build adds a tint mask (one channel per
   * slot) and the slot table to the GLB, so a game can pick any combination.
   */
  readonly variants?: VariantSlots;
  /** Named slot combinations, baked as ready textures (glTF material variants) and sprite sets. */
  readonly presets?: VariantPresets;
  /**
   * An equipment piece for the avatar: its slot, the point and turn that put it on the slot's
   * socket, and its fit scale (src/equip.ts, docs/avatar-system.md). Validated at build time and
   * written to the GLB root extras (`forgeEquip`) and stats.json.
   */
  readonly equip?: EquipDeclaration;
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
  /** RGBA: one channel per color slot (see AssetDefinition.variants). */
  readonly tintMask?: Uint8Array;
  /** The base color atlas recolored with each preset. */
  readonly presets?: Readonly<Record<string, Uint8Array>>;
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
    readonly equip?: ResolvedEquip;
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

/**
 * Run the asset's build function and collect its bodies. With `maskSlot`, colors of that slot are
 * white and all others black (for baking the slot's tint mask).
 */
export async function collectBodies(def: AssetDefinition, options: { maskSlot?: string } = {}): Promise<Collected> {
  const slots = slotTable(def.variants);
  checkPresets(slots, def.presets);
  setSlotColors(new Map(slots.map((s) => [s.name, s.options[s.default]!])));
  setMaskSlot(options.maskSlot ?? null);
  try {
    return await collect(def, slots);
  } finally {
    setMaskSlot(null);
  }
}

async function collect(def: AssetDefinition, slots: readonly Slot[]): Promise<Collected> {
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
    tint(slot: string, arg: number | { readonly color: string; readonly follow: number } = 0) {
      if (!slots.some((s) => s.name === slot))
        throw new Error(`k.tint('${slot}'): no such color slot. Slots: ${slots.map((s) => s.name).join(', ') || '(none: add variants)'}.`);
      return typeof arg === 'number' ? tintRef(slot, arg) : followRef(slot, arg.color, arg.follow);
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
  /**
   * `def` is the asset at `source` wearing these equipment pieces (`wearAsset`): the worker threads
   * import each piece module too and dress the base the same way.
   */
  readonly wear?: readonly { readonly name: string; readonly source: string }[];
  /** Build the asset in this worn state (`k.worn`; `wornAs`): `capHair` gives the capped hair. */
  readonly worn?: NonNullable<AssetContext['worn']>;
  /**
   * Multiply every body's triangle reduction error (the default is 0.12 of its cell size): the
   * reduced output pass of the avatar pack uses `REDUCED_ERROR_SCALE`.
   */
  readonly errorScale?: number;
}

/** The reduced output pass (`forge build <name> --reduced`): reduction error and atlas size. */
export const REDUCED_ERROR_SCALE = 4;
export const REDUCED_TEXTURE_SIZE = 512;

/** Run an asset's build function, mesh every body, and (by default) unwrap and bake textures. */
export async function buildAsset(asset: AssetDefinition, options: BuildOptions = {}): Promise<BuildResult> {
  const t0 = performance.now();
  const def = options.worn ? wornAs(asset, options.worn) : asset;
  const { root, pending, skeleton, animations } = await collectBodies(def);
  if (def.equip) {
    if (skeleton) throw new Error('An equipment piece (equip) has no skeleton: the avatar base moves it.');
    validateEquip(def.equip, pending.map((b) => b.name));
  }
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
  const pool = await openPool(ctx, options.source, pending.length, options.wear, options.worn);

  let meshed: MeshResult[];
  let uvMeshes: UvMesh[] | null = null;
  let images: AtlasImages | null = null;
  let textureMs = 0;
  try {
    meshed = (await pool.run(
      pending.map((_, index) => ({ kind: 'mesh' as const, index, paintSeams: size === 0, ...(options.errorScale ? { errorScale: options.errorScale } : {}) })),
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
      // Color slots: each bake also gives one color layer per slot, with that slot's colors white
      // and all others black; together they give the tint mask (one channel per slot).
      const slots = slotTable(def.variants);
      const bakes = (await pool.run(
        uvMeshes.map((mesh, index) => ({
          kind: 'bake' as const,
          index,
          mesh,
          options: bakeOptions(def, pending[index]!, size, extent * 0.03),
          slots: slots.map((s) => s.name),
        })),
      )) as BakeResult[];
      const tBake = performance.now();
      images = composeAtlas(
        bakes,
        size,
        slots.length > 0 ? { slots, presets: def.presets ?? {} } : undefined,
      );
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
    // A glowing part in a color slot (glowing eyes): the game sets the emissive color too.
    if (typeof o.emissive === 'string' && o.emissive.startsWith('tint:')) material.userData.forgeEmissiveTint = o.emissive.split(':')[1];
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
  const equip = def.equip ? resolveEquip(def.equip) : null;
  if (equip) root.userData.forgeEquip = equip;
  const table = slotTable(def.variants);
  if (table.length > 0) {
    const r5 = (v: number) => Math.round(v * 1e5) / 1e5;
    // The slot table for a game: each slot's mask channel, its default, and the option colors
    // (linear); the multiplier for an option is option / default, per channel.
    root.userData.forgeVariants = {
      slots: Object.fromEntries(
        table.map((s) => [
          s.name,
          { channel: 'RGBA'[s.channel], default: s.default, options: Object.fromEntries(Object.entries(s.options).map(([k, c]) => [k, c.map(r5)])) },
        ]),
      ),
      presets: def.presets ?? {},
      mask: images?.tintMask ? 'tintMask' : null,
    };
  }
  if (rig) {
    // Held items (on a hand or forearm bone, or below one) do not count for the ground: an axe
    // that hits the floor is fixed in its clip, not by lifting the body.
    const names = Object.keys(rig.def);
    const below = (b: string): string[] => [b, ...names.filter((n) => rig.def[n]!.parent === b).flatMap(below)];
    const head = new Set(rig.def.head ? below('head') : []);
    const held = new Set(names.filter((n) => /^(hand|forearm)\.(L|R)$/.test(n)).flatMap(below).filter((n) => !head.has(n)));
    const heldBodies = new Set(
      pending
        .filter((b) =>
          b.options.bone !== undefined ? held.has(b.options.bone) : b.shape.tags.length > 0 && b.shape.tags.every((t) => held.has(t.bone)),
        )
        .map((b) => b.name),
    );
    root.animations = [...animations].map(([name, a]) => {
      const clip = sampleAnimation(name, a, rig);
      return a.ground === false ? clip : groundClip(root, clip, rig, heldBodies);
    });
  }

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
      ...(equip ? { equip } : {}),
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
function composeAtlas(
  bakes: readonly BakeResult[],
  size: number,
  tint?: { slots: readonly Slot[]; presets: VariantPresets },
): AtlasImages {
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
  let tintMask: Uint8Array | undefined;
  let presets: Record<string, Uint8Array> | undefined;
  if (tint) {
    // The mask layers are sRGB bytes of white (in the slot) to black; the mask is linear coverage.
    const linear = (b: number) => {
      const c = b / 255;
      return Math.round((c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)) * 255);
    };
    const mask = new Uint8Array(n * 4);
    tint.slots.forEach((slot, s) => {
      const channel = new Uint8Array(n * 3);
      for (const b of bakes)
        for (let k = 0; k < b.texels.length; k++) channel[b.texels[k]! * 3] = linear(b.layers[s]![k * 3]!);
      dilate(channel, filled, size, passes);
      for (let i = 0; i < n; i++) mask[i * 4 + slot.channel] = channel[i * 3]!;
    });
    tintMask = encodePng(size, size, 4, mask);
    presets = Object.fromEntries(
      Object.entries(tint.presets).map(([name, choice]) => [name, encodePng(size, size, 3, recolor(color, mask, tint.slots, choice))]),
    );
  }
  return {
    size,
    baseColor: encodePng(size, size, 3, color),
    normal: encodePng(size, size, 3, normal),
    orm: encodePng(size, size, 3, orm),
    ...(tintMask ? { tintMask } : {}),
    ...(presets ? { presets } : {}),
  };
}
