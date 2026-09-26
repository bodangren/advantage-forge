import type * as THREE from 'three';
import { meshOptions, type AssetDefinition, type MeshResult, type PendingBody } from './asset.js';
import { rgb } from './sdf/color.js';
import { union, type DistFn, type Sdf } from './sdf/core.js';
import { meshSdf } from './sdf/mesher.js';
import { bakeBody, type BakeOptions, type BakeResult } from './texture/bake.js';
import type { UvMesh } from './texture/unwrap.js';

/** Work that can run in a worker thread or in-process. Shapes stay where they were built. */
export type Task =
  | { readonly kind: 'mesh'; readonly index: number; readonly paintSeams: boolean }
  | { readonly kind: 'bake'; readonly index: number; readonly mesh: UvMesh; readonly options: BakeOptions };

export type TaskResult = MeshResult | BakeResult;

export interface TaskContext {
  readonly def: AssetDefinition;
  readonly pending: readonly PendingBody[];
  /** Union of all bodies in world space (for occlusion), built on first use. */
  scene(): Sdf;
}

export function makeContext(
  def: AssetDefinition,
  root: THREE.Object3D,
  pending: readonly PendingBody[],
): TaskContext {
  let scene: Sdf | null = null;
  root.updateMatrixWorld(true);
  return {
    def,
    pending,
    scene() {
      scene ??= union(...pending.map((b) => b.shape.transform(b.parent.matrixWorld.elements)));
      return scene;
    },
  };
}

export async function runTask(task: Task, ctx: TaskContext): Promise<TaskResult> {
  const body = ctx.pending[task.index]!;
  try {
    if (task.kind === 'mesh')
      return await meshSdf(body.shape, { ...meshOptions(ctx.def, body), paintSeams: task.paintSeams });
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
    return bakeBody(task.mesh, body.shape, local, task.options, body.options.bump);
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
