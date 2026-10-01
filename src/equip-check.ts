import { collectBodies, meshOptions, type AssetDefinition, type PendingBody } from './asset.js';
import { checkClips, formatClipCheck, type ClipCheckResult } from './clip-check.js';
import { SOCKETS, resolveEquip, socketOf, validateEquip, wearAsset, type BaseLayer, type ResolvedEquip, type WornPiece } from './equip.js';
import type { Vec3 } from './sdf/core.js';
import { meshSdf } from './sdf/mesher.js';

/**
 * The fit check of an equipment piece (`forge check <piece>` for an asset with an `equip` block):
 * the piece is worn on the avatar base in the rest pose and measured against every base body that
 * stays visible (skin, pants, and the hair, undershirt, and shoes unless the piece hides them).
 *
 * - Shows through: a point of the piece's outer surface (its normal faces away from the base body)
 *   is inside a base body, so the base body shows through the piece there. A point inside two base
 *   bodies counts for the outer one (the deeper inside, as hair over the skull): only the outer
 *   layer shows. A point inside another body of the piece (a horn root in the helmet shell) is not
 *   on the visible surface and does not count. Skin and clothes fail
 *   the check above 2% of the piece's points; hair is reported (the capped hair styles of the
 *   avatar track fix it). The report names the base bone and the mean point of each group.
 * - Hidden contact: the piece's inner surface goes into a base body. It does not show; reported.
 * - Gap: the closest the piece comes to the base. A piece that floats more than `gap` fails.
 * - Floor: the lowest worn point in the rest pose. A piece more than 1 cm below y = 0 fails.
 * - Clips: the clip clearance check of the base clips with the piece held (pieces on arm bones).
 *
 * A hand piece in the fist (`grip` socket) or on the forearm (`shield`) does not measure against
 * the skin of that hand (and that forearm for a shield): the fist closes around the grip.
 */

export interface EquipCheckOptions {
  /** Points deeper than this count as inside (mesh noise is below it). Default 0.002 m. */
  readonly tolerance?: number;
  /** The largest allowed gap between the piece and the base. Default 0.02 m. */
  readonly gap?: number;
  /**
   * Show-through points allowed per base body before the check fails: this share of the piece's
   * points (default 0.02), at least `minPoints` (default 12). Calibrated on 2026-10-01 renders: a
   * hood edge in the shirt collar, pauldrons over the sleeves, and hero helm cheek guards in the
   * jaw read well at about 1.2%; arm cuffs cut by the arm (3.6%) and pieces inside the body do not.
   */
  readonly share?: number;
  readonly minPoints?: number;
  readonly fps?: number;
  readonly clips?: readonly string[];
}

export interface BodyContact {
  readonly base: string;
  /** Points where the base body shows through the piece. */
  readonly shows: number;
  readonly showsDepth: number;
  /** Points of the piece's inner surface inside the base body (hidden). */
  readonly hidden: number;
  readonly hiddenDepth: number;
  /** The closest piece point to this base body (negative inside). */
  readonly nearest: number;
  /** Where it shows through: the base body's bone (its nearest tagged part) and the point count, most first. */
  readonly showsBy: readonly { readonly bone: string; readonly points: number; readonly depth: number; readonly at: Vec3 }[];
  /** True when this body fails the check (skin or clothes showing through). */
  readonly fails: boolean;
}

export interface EquipCheckResult {
  readonly equip: ResolvedEquip;
  readonly points: number;
  /** Worn bounds (character frame, rest pose) of the first attach. */
  readonly bounds: { readonly min: Vec3; readonly max: Vec3; readonly size: Vec3 };
  readonly contacts: readonly BodyContact[];
  readonly excluded: readonly string[];
  readonly gap: number;
  readonly gapLimit: number;
  /** The lowest worn point of the piece (both attaches) in the rest pose. */
  readonly floor: number;
  readonly clips: ClipCheckResult | null;
  readonly ok: boolean;
}

type Dist = (x: number, y: number, z: number) => number;

/** How far below the ground a worn piece may reach in the rest pose. */
const FLOOR = 0.01;

/** The distance function of a base body without the parts tagged to the excluded bones. */
function baseDist(body: PendingBody, excluded: ReadonlySet<string>): Dist | null {
  const tags = body.shape.tags;
  if (excluded.size === 0 || tags.length === 0) return body.options.bone !== undefined && excluded.has(body.options.bone) ? null : body.shape.dist;
  const kept = tags.filter((t) => !excluded.has(t.bone));
  if (kept.length === 0) return null;
  if (kept.length === tags.length) return body.shape.dist;
  return (x, y, z) => {
    let d = Infinity;
    for (const t of kept) d = Math.min(d, t.dist(x, y, z));
    return d;
  };
}

export async function checkEquip(piece: WornPiece, base: AssetDefinition, options: EquipCheckOptions = {}): Promise<EquipCheckResult> {
  const eq = piece.def.equip;
  if (!eq) throw new Error(`${piece.name} has no equip block.`);
  const tol = options.tolerance ?? 0.002;
  const gapLimit = options.gap ?? 0.02;
  const own = await collectBodies(piece.def);
  validateEquip(eq, own.pending.map((b) => b.name));
  const equip = resolveEquip(eq);
  const worn = wearAsset(base, [piece]);
  const collected = await collectBodies(worn);
  const prefix = `${piece.name}:`;
  const pieceBodies = collected.pending.filter((b) => b.name.startsWith(prefix));
  const baseBodies = collected.pending.filter((b) => !b.name.startsWith(prefix));

  // The skin of the holding hand (and forearm, for a shield) does not count: the fist closes on the grip.
  const socket = socketOf(eq);
  const side = equip.attach.map((a) => a.bone.slice(-2));
  const excluded = new Set(
    socket === 'grip.L' || socket === 'grip.R'
      ? side.flatMap((s) => [`hand${s}`, `knife${s}`])
      : socket === 'shield'
        ? side.flatMap((s) => [`hand${s}`, `knife${s}`, `forearm${s}`])
        : [],
  );
  const measured = baseBodies.map((b) => ({ name: b.name, dist: baseDist(b, excluded), full: b.shape.dist, body: b }));
  /** The bone of a base body at a point: its nearest tagged part, or its rigid bone. */
  const boneAt = (b: PendingBody, x: number, y: number, z: number): string => {
    let best = Infinity;
    let bone = b.options.bone ?? '(untagged)';
    for (const t of b.shape.tags) {
      if (excluded.has(t.bone)) continue;
      const d = t.dist(x, y, z);
      if (d < best) {
        best = d;
        bone = t.bone;
      }
    }
    return bone;
  };

  // The piece's surface points and normals, at most about 3000 per body. A point buried in another
  // body of the piece is not on its visible surface; it counts for the floor and the bounds only.
  const pts: number[] = [];
  const nrm: number[] = [];
  let first: { min: number[]; max: number[] } | null = null;
  let floor = Infinity;
  for (const b of pieceBodies) {
    const { mesh } = await meshSdf(b.shape, meshOptions(worn, b));
    const n = mesh.positions.length / 3;
    const stride = Math.max(1, Math.floor(n / 3000));
    for (let i = 0; i < n; i++) {
      const p = [mesh.positions[i * 3]!, mesh.positions[i * 3 + 1]!, mesh.positions[i * 3 + 2]!];
      floor = Math.min(floor, p[1]!);
      if (!b.name.endsWith('.R')) {
        first ??= { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
        for (let a = 0; a < 3; a++) {
          first.min[a] = Math.min(first.min[a]!, p[a]!);
          first.max[a] = Math.max(first.max[a]!, p[a]!);
        }
      }
      if (i % stride !== 0) continue;
      if (pieceBodies.some((o) => o !== b && o.shape.dist(p[0]!, p[1]!, p[2]!) < -tol)) continue;
      pts.push(...p);
      nrm.push(mesh.normals[i * 3]!, mesh.normals[i * 3 + 1]!, mesh.normals[i * 3 + 2]!);
    }
  }
  const count = pts.length / 3;
  const allowed = Math.max(options.minPoints ?? 12, Math.round(count * (options.share ?? 0.02)));
  const h = 0.0015;
  const contacts: BodyContact[] = measured.map(({ name, dist, full, body }) => {
    const by = new Map<string, { points: number; depth: number; sum: Vec3 }>();
    let shows = 0;
    let showsDepth = 0;
    let hidden = 0;
    let hiddenDepth = 0;
    let nearest = Infinity;
    for (let i = 0; i < count; i++) {
      const x = pts[i * 3]!;
      const y = pts[i * 3 + 1]!;
      const z = pts[i * 3 + 2]!;
      // The gap counts every base body, also the excluded fist: a grip must be in the hand.
      nearest = Math.min(nearest, full(x, y, z));
      if (!dist) continue;
      const d = dist(x, y, z);
      if (d >= -tol) continue;
      // Another base body that is deeper here covers this one (hair over the skull, a shirt over the skin).
      if (measured.some((o) => o.body !== body && o.dist !== null && o.dist(x, y, z) < d)) continue;
      // Does the piece surface here face the way the base surface faces (its outer side)?
      const gx = dist(x + h, y, z) - dist(x - h, y, z);
      const gy = dist(x, y + h, z) - dist(x, y - h, z);
      const gz = dist(x, y, z + h) - dist(x, y, z - h);
      const g = Math.hypot(gx, gy, gz) || 1;
      const facing = (nrm[i * 3]! * gx + nrm[i * 3 + 1]! * gy + nrm[i * 3 + 2]! * gz) / g;
      if (facing > 0.2) {
        shows++;
        showsDepth = Math.max(showsDepth, -d);
        const bone = boneAt(body, x, y, z);
        const e = by.get(bone) ?? { points: 0, depth: 0, sum: [0, 0, 0] };
        by.set(bone, { points: e.points + 1, depth: Math.max(e.depth, -d), sum: [e.sum[0] + x, e.sum[1] + y, e.sum[2] + z] });
      } else {
        hidden++;
        hiddenDepth = Math.max(hiddenDepth, -d);
      }
    }
    const hair = name === 'hair';
    const r3 = (v: number) => Math.round(v * 1000) / 1000;
    const showsBy = [...by]
      .map(([bone, e]) => ({ bone, points: e.points, depth: e.depth, at: e.sum.map((v) => r3(v / e.points)) as unknown as Vec3 }))
      .sort((a, b) => b.points - a.points);
    return { base: name, shows, showsDepth, hidden, hiddenDepth, nearest, showsBy, fails: !hair && shows > allowed };
  });
  const gap = Math.min(...contacts.map((c) => c.nearest));

  // Clip clearance: pieces on arm bones move with the base clips (a weapon must never pass through the head).
  const arms = equip.attach.map((a) => a.bone).filter((b) => /^(upperarm|forearm|hand|knife)\./.test(b));
  const clips =
    arms.length > 0
      ? await checkClips(worn, {
          heldBones: arms,
          ...(options.fps !== undefined ? { fps: options.fps } : {}),
          ...(options.clips ? { clips: options.clips } : {}),
        })
      : null;
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  const min = (first?.min ?? [0, 0, 0]).map(r3) as unknown as Vec3;
  const max = (first?.max ?? [0, 0, 0]).map(r3) as unknown as Vec3;
  return {
    equip,
    points: count,
    bounds: { min, max, size: [r3(max[0] - min[0]), r3(max[1] - min[1]), r3(max[2] - min[2])] },
    contacts,
    excluded: [...excluded],
    gap,
    gapLimit,
    floor,
    clips,
    ok: contacts.every((c) => !c.fails) && gap <= gapLimit && floor >= -FLOOR && (clips?.ok ?? true),
  };
}

/** A short text report of an equipment check. */
export function formatEquipCheck(name: string, r: EquipCheckResult): string {
  const cm = (m: number) => `${(m * 100).toFixed(1)} cm`;
  const e = r.equip;
  const lines: string[] = [];
  const hides = e.hides.length > 0 ? `; hides ${e.hides.join(', ')}` : '';
  lines.push(
    `equip  ${name}: slot ${e.slot}, socket ${e.socket}, fit scale ${+e.fitScale.toFixed(4)}${hides}; on ${e.attach.map((a) => a.bone + (a.half ? ` (${a.half} half)` : '')).join(', ')}`,
  );
  lines.push(`       worn size ${r.bounds.size.map((v) => v.toFixed(3)).join(' x ')} m, from (${r.bounds.min.join(', ')}) to (${r.bounds.max.join(', ')}); ${r.points} points`);
  if (r.excluded.length > 0) lines.push(`       the holding ${r.excluded.join(', ')} skin does not count`);
  for (const c of r.contacts) {
    const parts: string[] = [];
    if (c.shows > 0)
      parts.push(
        `shows through at ${c.shows} points (up to ${cm(c.showsDepth)}: ${c.showsBy
          .slice(0, 4)
          .map((b) => `${b.bone} ${b.points} near (${b.at.join(', ')})`)
          .join(', ')})`,
      );
    if (c.hidden > 0) parts.push(`hidden contact at ${c.hidden} points (up to ${cm(c.hiddenDepth)})`);
    const status = c.fails ? 'FAIL' : c.shows > 0 ? 'note' : 'ok';
    lines.push(`  ${c.base.padEnd(10)} ${status.padEnd(4)} nearest ${cm(c.nearest)}${parts.length > 0 ? '; ' + parts.join('; ') : ''}`);
  }
  lines.push(`  ${'gap'.padEnd(10)} ${r.gap <= r.gapLimit ? 'ok  ' : 'FAIL'} the piece comes within ${cm(Math.max(0, r.gap))} of the base (limit ${cm(r.gapLimit)})`);
  lines.push(`  ${'floor'.padEnd(10)} ${r.floor >= -FLOOR ? 'ok  ' : 'FAIL'} the lowest worn point is at y ${cm(r.floor)} (limit ${cm(-FLOOR)})`);
  if (r.clips) lines.push(formatClipCheck(`${name} on the base`, r.clips));
  lines.push(r.ok ? `fit     ok: ${name} fits the avatar base in the ${SOCKETS[e.socket].bone} socket` : `fit     FAIL: ${name} does not fit the avatar base`);
  return lines.join('\n');
}

export type { BaseLayer };
