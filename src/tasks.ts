import type * as THREE from 'three';
import { collectBodies, meshOptions, type AssetDefinition, type MeshResult, type PendingBody } from './asset.js';
import { rgb, setMaskSlot } from './sdf/color.js';
import { isBlackColor, union, type DistFn, type Sdf } from './sdf/core.js';
import { meshSdf } from './sdf/mesher.js';
import { bakeBody, type BakeOptions, type BakeResult, type ColorLayer } from './texture/bake.js';
import type { UvMesh } from './texture/unwrap.js';

/** Work that can run in a worker thread or in-process. Shapes stay where they were built. */
export type Task =
  | { readonly kind: 'mesh'; readonly index: number; readonly paintSeams: boolean }
  /**
   * One body's maps, plus a tint mask for each color slot in `slots` (the slot white, all else
   * black), baked at the same surface points.
   */
  | {
      readonly kind: 'bake';
      readonly index: number;
      readonly mesh: UvMesh;
      readonly options: BakeOptions;
      readonly slots: readonly string[];
    };

export type TaskResult = MeshResult | BakeResult;

export interface TaskContext {
  readonly def: AssetDefinition;
  readonly pending: readonly PendingBody[];
  /** Union of all bodies in world space (for occlusion), built on first use. */
  scene(): Sdf;
  /** The bodies built in a slot's mask mode (see collectBodies), built on first use. */
  maskBodies(slot: string): Promise<readonly PendingBody[]>;
}

export function makeContext(
  def: AssetDefinition,
  root: THREE.Object3D,
  pending: readonly PendingBody[],
): TaskContext {
  let scene: Sdf | null = null;
  const masks = new Map<string, Promise<readonly PendingBody[]>>();
  root.updateMatrixWorld(true);
  return {
    def,
    pending,
    scene() {
      scene ??= union(...pending.map((b) => b.shape.transform(b.parent.matrixWorld.elements)));
      return scene;
    },
    maskBodies(slot) {
      let m = masks.get(slot);
      if (!m) {
        m = collectBodies(def, { maskSlot: slot }).then((c) => c.pending);
        masks.set(slot, m);
      }
      return m;
    },
  };
}

export async function runTask(task: Task, ctx: TaskContext): Promise<TaskResult> {
  const body = ctx.pending[task.index]!;
  try {
    // Workers load src/ when a build opens its pool; the main thread loaded it earlier. A task
    // kind this code does not know means the engine changed on disk while the build ran.
    const kind: string = task.kind;
    if (kind !== 'mesh' && kind !== 'bake')
      throw new Error(`Unknown task '${kind}': forge changed while this build ran. Run the command again.`);
    if (task.kind === 'mesh')
      return await meshSdf(body.shape, { ...meshOptions(ctx.def, body), paintSeams: task.paintSeams });
    // Each slot's mask colors come from the bodies built in that slot's mask mode, and are
    // evaluated in mask mode: colors a paint function makes while it runs are then mask values
    // too (the slot's white, or black), so a stitch painted over the cloth is left out of the
    // cloth slot, and a blend gives partial coverage. A body without any color of a slot has an
    // empty mask for it, which needs no bake.
    const layers: ColorLayer[] = [];
    const empty: boolean[] = [];
    for (const slot of task.slots) {
      const masked = (await ctx.maskBodies(slot))[task.index]!;
      const color = masked.shape.color;
      setMaskSlot(slot);
      try {
        const baseColor = rgb(masked.options.color ?? '#cccccc');
        const none = isBlackColor(color) && baseColor.every((v) => v === 0);
        empty.push(none);
        if (none) continue;
        layers.push({
          baseColor,
          color: (x, y, z, fallback) => {
            setMaskSlot(slot);
            try {
              return color(x, y, z, fallback);
            } finally {
              setMaskSlot(null);
            }
          },
        });
      } finally {
        setMaskSlot(null);
      }
    }
    const world = ctx.scene().dist;
    const e = body.parent.matrixWorld.elements;
    const identity = e.every((v, i) => v === (i % 5 === 0 ? 1 : 0));
    const local: DistFn = identity
      ? world
      : (x, y, z) =>
          world(
            e[0]! * x + e[4]! * y + e[8]! * z + e[12]!,
            e[1]! * x + e[5]! * y + e[9]! * z + e[13]!,
            e[2]! * x + e[6]! * y + e[10]! * z + e[14]!,
          );
    const baked = bakeBody(task.mesh, body.shape, local, task.options, body.options.bump, layers);
    let next = 0;
    return {
      ...baked,
      layers: empty.map((none) => (none ? new Uint8Array(baked.texels.length * 3) : baked.layers[next++]!)),
    };
  } catch (error) {
    throw new Error(`Body '${body.name}': ${(error as Error).message}`, { cause: error });
  }
}

/** Buffers to move (not copy) when a result crosses threads. */
export function transferables(result: TaskResult): ArrayBuffer[] {
  if ('mesh' in result) {
    const m = result.mesh;
    return [m.positions.buffer, m.normals.buffer, m.colors.buffer, m.indices.buffer] as ArrayBuffer[];
  }
  return [
    result.texels.buffer,
    result.color.buffer,
    result.normal.buffer,
    result.orm.buffer,
    ...result.layers.map((l) => l.buffer),
  ] as ArrayBuffer[];
}

export function bakeOptions(
  def: AssetDefinition,
  body: PendingBody,
  size: number,
  aoRadius: number,
): BakeOptions {
  const t = def.texture === false ? {} : (def.texture ?? {});
  return {
    size,
    baseColor: rgb(body.options.color ?? '#cccccc'),
    roughness: body.options.roughness ?? 0.6,
    metalness: body.options.metalness ?? 0,
    normal: t.normal ?? true,
    ao: t.ao ?? true,
    aoRadius: t.aoRadius ?? aoRadius,
    eps: (body.options.detail ?? def.detail ?? 0.006) * 0.25,
  };
}
