import type { AnimationDef, AssetContext, AssetDefinition, BodyOptions } from '../../src/index.js';
import type { BonePose, Pose, SkeletonDef } from '../../src/rig.js';

/**
 * An asset at another size: every body, bone joint, clip move, group pivot, and mesh length (cell
 * size, reduction error, skin blend, bump) scaled by `s` about the origin, the ground point under
 * the asset. A kind factory builds at one size; a small animal of the kind (a sparrow on the bird
 * kind, a cat on the wolf kind) is the kind scaled to its own size. The mesh keeps its cell count
 * and every body its texture share, so a small animal keeps the detail of the kind.
 */
export function scaleAsset(def: AssetDefinition, s: number): AssetDefinition {
  type V3 = readonly [number, number, number];
  const v = (p: V3): [number, number, number] => [p[0] * s, p[1] * s, p[2] * s];
  const options = (o: BodyOptions = {}): BodyOptions => {
    const bump = o.bump;
    return {
      ...o,
      ...(o.detail !== undefined ? { detail: o.detail * s } : {}),
      ...(o.maxError !== undefined ? { maxError: o.maxError * s } : {}),
      ...(bump ? { bump: (x: number, y: number, z: number) => s * bump(x / s, y / s, z / s) } : {}),
    };
  };
  const pose = (p: Pose): Pose =>
    Object.fromEntries(
      Object.entries(p).map(([bone, b]): [string, BonePose] => [bone, b.move ? { ...b, move: v(b.move) } : b]),
    );
  const wrap = (k: AssetContext): AssetContext => ({
    body: (name, shape, o) => k.body(name, shape.scale(s), options(o)),
    add: (name, object) => {
      object.position.multiplyScalar(s);
      object.scale.multiplyScalar(s);
      k.add(name, object);
    },
    group: (name, o, fn) => k.group(name, o.at ? { ...o, at: v(o.at) } : o, (g) => fn(wrap(g))),
    skeleton: (d: SkeletonDef) =>
      k.skeleton(
        Object.fromEntries(
          Object.entries(d).map(([bone, b]) => [
            bone,
            {
              ...b,
              at: v(b.at),
              ...(b.tail ? { tail: v(b.tail) } : {}),
              ...(b.split !== undefined ? { split: b.split * s } : {}),
            },
          ]),
        ),
      ),
    animation: (name, a: AnimationDef) =>
      k.animation(name, { ...a, ...(a.dig !== undefined ? { dig: a.dig * s } : {}), pose: (t, p) => pose(a.pose(t, p)) }),
    tint: ((slot: string, arg?: number | { readonly color: string; readonly follow: number }) =>
      typeof arg === 'object' ? k.tint(slot, arg) : k.tint(slot, arg)) as AssetContext['tint'],
    ...(k.worn ? { worn: k.worn } : {}),
  });
  return {
    ...def,
    detail: (def.detail ?? 0.006) * s,
    skinBlend: (def.skinBlend ?? 0.015) * s,
    build: (k) => def.build(wrap(k)),
  };
}
