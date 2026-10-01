import type { AssetContext, BodyOptions } from './asset.js';
import type { Sdf, Vec3 } from './sdf/core.js';

/**
 * Equipment parts (docs/equipment-parts.md). A part module in `assets/parts/` builds one piece of
 * equipment in its own local frame. A character adds it at its mount point and binds it to a bone;
 * a standalone catalog asset adds the same part at rest on the ground. One source gives the worn
 * piece and the shop item, at the same size.
 */

/** A recolorable color, as `k.tint`. The part uses its own slot names; the host maps them. */
export type PartTint = AssetContext['tint'];

/** One body of a part, in the part's local frame. */
export interface PartBody {
  /** The body name. It stays the same in every host, because games find nodes by name. */
  readonly name: string;
  readonly shape: Sdf;
  /** Material and mesh options. The bone comes from `bone` and the host. */
  readonly options: Omit<BodyOptions, 'bone'>;
  /** The bone that a character binds this body to (rigidly), unless the host maps it. */
  readonly bone?: string;
}

export interface Part {
  readonly name: string;
  readonly bodies: readonly PartBody[];
  /** Named shapes in the local frame that a host needs, for example `inside` (hair under a helm). */
  readonly regions?: Readonly<Record<string, Sdf>>;
  /** Named points in the local frame, for example a plume joint for a host skeleton. */
  readonly sockets?: Readonly<Record<string, Vec3>>;
}

export interface PlaceOptions {
  /** Local frame to host frame, for example `(s) => s.at(0, 0.675, 0)`. Default: unchanged. */
  readonly pose?: (s: Sdf) => Sdf;
  /**
   * Bone names: a map from part bones to host bones (unmapped bones keep their names), or `null`
   * for a static asset with no skeleton (the bodies get no bone).
   */
  readonly bones?: Readonly<Record<string, string>> | null;
}

/** Add every body of a part to a host, posed into the host frame, in the part's body order. */
export function addPart(k: AssetContext, part: Part, options: PlaceOptions = {}): void {
  const pose = options.pose ?? ((s: Sdf) => s);
  for (const body of part.bodies) {
    const bone =
      options.bones === null || body.bone === undefined ? undefined : (options.bones?.[body.bone] ?? body.bone);
    k.body(body.name, pose(body.shape), bone === undefined ? body.options : { ...body.options, bone });
  }
}

/** A tint function for a part: each part slot name goes to a host slot (unmapped names stay). */
export function mapTint(k: AssetContext, slots: Readonly<Record<string, string>> = {}): PartTint {
  const tint = (slot: string, arg?: number | { readonly color: string; readonly follow: number }) =>
    typeof arg === 'object' ? k.tint(slots[slot] ?? slot, arg) : k.tint(slots[slot] ?? slot, arg);
  return tint as PartTint;
}
