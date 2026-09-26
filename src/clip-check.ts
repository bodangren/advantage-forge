import * as THREE from 'three';
import { collectBodies, meshOptions, type AssetDefinition } from './asset.js';
import type { AnimationDef, SkeletonDef } from './rig.js';
import type { Vec3 } from './sdf/core.js';
import { meshSdf } from './sdf/mesher.js';
import { lowestPoint } from './grounding.js';

/**
 * Clip clearance: does a held item (a weapon, a shield, a staff, a bow) pass through the head or
 * the body in any clip? Every clip is posed at `fps`; the held items' vertices move with their
 * bones and are measured against the head and body parts in those parts' own rest frames. For the
 * body, a contact that already exists in the rest pose (a shield resting on the chest) is the
 * baseline and only deeper contact counts. For the head there is no baseline, and the rest pose
 * itself is checked (reported as the clip `rest`). Head contact fails the check; body contact is
 * reported.
 */

type DistFn = (x: number, y: number, z: number) => number;
type RegionName = 'head' | 'body';

export interface ClipCheckOptions {
  /** Poses per second of each clip. Default 60 (fast strikes move far between 30 fps frames). */
  readonly fps?: number;
  /** Penetration in meters that counts as body contact, beyond the rest-pose baseline. Default 0.01. */
  readonly margin?: number;
  /** Penetration in meters that counts as head contact (no baseline). Default 0.003: only noise. */
  readonly headMargin?: number;
  /** Only these clips (default: all). */
  readonly clips?: readonly string[];
}

export interface Contact {
  readonly clip: string;
  readonly item: string;
  readonly region: RegionName;
  /** The region part the item goes deepest into. */
  readonly part: string;
  readonly from: number;
  readonly to: number;
  /** The deepest penetration in meters, beyond the rest-pose baseline. */
  readonly depth: number;
}

/** The closest a held item comes to the head in a clip (a lower bound; capped at CLEAR_CAP). */
export interface HeadClearance {
  readonly item: string;
  readonly part: string;
  readonly phase: number;
  /** Meters between the item's surface and the head; 0 or less is contact. */
  readonly distance: number;
}

/** Clearances beyond this are not measured: the item is far from the head. */
export const CLEAR_CAP = 0.05;

export interface ClipCheckResult {
  readonly items: readonly { name: string; bone: string }[];
  readonly regions: Readonly<Record<RegionName, readonly string[]>>;
  readonly clips: readonly { name: string; frames: number; contacts: readonly Contact[]; closest: HeadClearance | null }[];
  readonly margin: number;
  readonly headMargin: number;
  readonly ok: boolean;
}

interface Part {
  readonly name: string;
  readonly bone: string;
  readonly region: RegionName;
  readonly dist: DistFn;
}

interface Chunk {
  readonly center: THREE.Vector3;
  readonly radius: number;
  readonly points: readonly THREE.Vector3[];
}

const HELD = /^(hand|forearm)\.(L|R)$/;
const BODY_BONES = ['hips', 'spine', 'chest', 'neck'];

/** The skinning matrix of every bone for a pose: posed world matrix times the inverse rest. */
function skinMatrices(skeleton: SkeletonDef, order: readonly string[], pose: ReturnType<AnimationDef['pose']>) {
  const world = new Map<string, THREE.Matrix4>();
  const skin = new Map<string, THREE.Matrix4>();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (const b of order) {
    const def = skeleton[b]!;
    const pat = def.parent ? skeleton[def.parent]!.at : ([0, 0, 0] as const);
    const bp = pose[b];
    const r = bp?.rotate ?? [0, 0, 0];
    const m = bp?.move ?? [0, 0, 0];
    const s = bp?.scale ?? [1, 1, 1];
    q.setFromEuler(e.set(r[0] * THREE.MathUtils.DEG2RAD, r[1] * THREE.MathUtils.DEG2RAD, r[2] * THREE.MathUtils.DEG2RAD, 'XYZ'));
    const local = new THREE.Matrix4().compose(
      new THREE.Vector3(def.at[0] - pat[0] + m[0], def.at[1] - pat[1] + m[1], def.at[2] - pat[2] + m[2]),
      q,
      new THREE.Vector3(s[0], s[1], s[2]),
    );
    const w = def.parent ? world.get(def.parent)!.clone().multiply(local) : local;
    world.set(b, w);
    skin.set(b, w.clone().multiply(new THREE.Matrix4().makeTranslation(-def.at[0], -def.at[1], -def.at[2])));
  }
  return skin;
}

/** Split an item's points into small groups along its longest axis, each with a bounding sphere. */
function chunks(points: readonly THREE.Vector3[], size = 40): Chunk[] {
  const box = new THREE.Box3().setFromPoints([...points]);
  const ext = box.getSize(new THREE.Vector3());
  const axis = ext.x >= ext.y && ext.x >= ext.z ? 'x' : ext.y >= ext.z ? 'y' : 'z';
  const sorted = [...points].sort((a, b) => a[axis] - b[axis]);
  const out: Chunk[] = [];
  for (let i = 0; i < sorted.length; i += size) {
    const pts = sorted.slice(i, i + size);
    const center = new THREE.Box3().setFromPoints(pts).getCenter(new THREE.Vector3());
    const radius = Math.max(...pts.map((p) => p.distanceTo(center)));
    out.push({ center, radius, points: pts });
  }
  return out;
}

export async function checkClips(def: AssetDefinition, options: ClipCheckOptions = {}): Promise<ClipCheckResult> {
  const fps = options.fps ?? 60;
  const margin = options.margin ?? 0.01;
  const headMargin = options.headMargin ?? 0.003;
  const collected = await collectBodies(def);
  const skeleton = collected.skeleton;
  const empty = { items: [], regions: { head: [], body: [] }, clips: [], margin, headMargin, ok: true } as const;
  if (!skeleton) return empty;

  // Bone sets: the head and everything below it (ears, plume); the torso; the held bones.
  const names = Object.keys(skeleton);
  const children = (b: string) => names.filter((n) => skeleton[n]!.parent === b);
  const below = (b: string): string[] => [b, ...children(b).flatMap(below)];
  const head = new Set(skeleton.head ? below('head') : []);
  const body = new Set(BODY_BONES.filter((b) => b in skeleton));
  const held = new Set(names.filter((n) => HELD.test(n)).flatMap(below).filter((b) => !head.has(b)));
  const order: string[] = [];
  const visit = (b: string) => {
    order.push(b);
    children(b).forEach(visit);
  };
  visit(names.find((n) => skeleton[n]!.parent === undefined)!);

  // Region parts: rigid bodies on a region bone, and the tagged parts of skinned bodies.
  const parts: Part[] = [];
  const items: { name: string; bone: string; chunks: Chunk[] }[] = [];
  for (const p of collected.pending) {
    const rigid = p.options.bone;
    if (rigid !== undefined) {
      const region: RegionName | null = head.has(rigid) ? 'head' : body.has(rigid) ? 'body' : null;
      if (region) parts.push({ name: p.name, bone: rigid, region, dist: p.shape.dist });
      if (held.has(rigid)) {
        const { mesh } = await meshSdf(p.shape, meshOptions(def, p));
        const pos = mesh.positions;
        const n = pos.length / 3;
        const stride = Math.max(1, Math.floor(n / 2000));
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < n; i += stride) pts.push(new THREE.Vector3(pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!));
        if (pts.length > 0) items.push({ name: p.name, bone: rigid, chunks: chunks(pts) });
      }
    } else if (p.shape.tags.length > 0 && p.shape.tags.every((t) => held.has(t.bone))) {
      // A skinned body that is all hand and forearm (a weapon tagged to a hand, a bracer, a
      // gauntlet): a held item; each vertex follows its nearest tagged bone.
      const { mesh } = await meshSdf(p.shape, meshOptions(def, p));
      const pos = mesh.positions;
      const n = pos.length / 3;
      const stride = Math.max(1, Math.floor(n / 2000));
      const byBone = new Map<string, THREE.Vector3[]>();
      for (let i = 0; i < n; i += stride) {
        const v = new THREE.Vector3(pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!);
        let best = Infinity;
        let bone = p.shape.tags[0]!.bone;
        for (const t of p.shape.tags) {
          const d = t.dist(v.x, v.y, v.z);
          if (d < best) {
            best = d;
            bone = t.bone;
          }
        }
        if (!byBone.has(bone)) byBone.set(bone, []);
        byBone.get(bone)!.push(v);
      }
      const split = byBone.size > 1;
      for (const [bone, pts] of byBone) items.push({ name: split ? `${p.name} (${bone})` : p.name, bone, chunks: chunks(pts) });
    } else {
      for (const t of p.shape.tags) {
        const region: RegionName | null = head.has(t.bone) ? 'head' : body.has(t.bone) ? 'body' : null;
        if (region) parts.push({ name: p.name, bone: t.bone, region, dist: t.dist });
      }
    }
  }
  const regions = {
    head: [...new Set(parts.filter((p) => p.region === 'head').map((p) => p.name))],
    body: [...new Set(parts.filter((p) => p.region === 'body').map((p) => p.name))],
  };
  if (items.length === 0 || parts.length === 0) return { ...empty, items: items.map((i) => ({ name: i.name, bone: i.bone })), regions };

  const partBones = [...new Set(parts.map((p) => p.bone))];
  // The deepest penetration of one item into each region for a pose: per region, the depth and part.
  const measure = (skin: Map<string, THREE.Matrix4>, item: (typeof items)[number]) => {
    // Per region: the deepest point, and how many points are inside at all (a blade that cuts
    // through a thin hood never goes deep into it, but many of its points are inside).
    const deepest: Record<RegionName, { depth: number; part: string; count: number }> = {
      head: { depth: 0, part: '', count: 0 },
      body: { depth: 0, part: '', count: 0 },
    };
    // The closest approach to the head, for the report (the margin is only the contact limit).
    const clear = { distance: CLEAR_CAP, part: '' };
    const toWorld = skin.get(item.bone)!;
    for (const bone of partBones) {
      const toRest = skin.get(bone)!.clone().invert();
      const m = toRest.multiply(toWorld);
      const boneParts = parts.filter((p) => p.bone === bone);
      const headParts = boneParts.filter((p) => p.region === 'head');
      const dist = (v: THREE.Vector3) => {
        let best = Infinity;
        let name = '';
        for (const p of boneParts) {
          const d = p.dist(v.x, v.y, v.z);
          if (d < best) {
            best = d;
            name = p.name;
          }
        }
        return { d: best, name };
      };
      const v = new THREE.Vector3();
      const headDist = (w: THREE.Vector3) => {
        let best = Infinity;
        let name = '';
        for (const p of headParts) {
          const d = p.dist(w.x, w.y, w.z);
          if (d < best) {
            best = d;
            name = p.name;
          }
        }
        return { d: best, name };
      };
      if (headParts.length > 0)
        for (const c of item.chunks) {
          v.copy(c.center).applyMatrix4(m);
          if (headDist(v).d - c.radius >= clear.distance) continue;
          for (const p of c.points) {
            v.copy(p).applyMatrix4(m);
            const h = headDist(v);
            if (h.d < clear.distance) Object.assign(clear, { distance: h.d, part: h.name });
          }
        }
      for (const c of item.chunks) {
        v.copy(c.center).applyMatrix4(m);
        // Distances are lower bounds, so a chunk whose center is farther than its radius is clear.
        if (dist(v).d > c.radius + 0.002) continue;
        for (const p of c.points) {
          v.copy(p).applyMatrix4(m);
          const { d, name } = dist(v);
          if (d >= -0.002) continue;
          const region = boneParts.find((bp) => bp.name === name)!.region;
          deepest[region].count++;
          if (-d > deepest[region].depth) Object.assign(deepest[region], { depth: -d, part: name });
        }
      }
    }
    return { ...deepest, clear };
  };

  const restSkin = skinMatrices(skeleton, order, {});
  const baseline = new Map(
    items.map((it) => {
      const m = measure(restSkin, it);
      // A weapon in the head is wrong even at rest: the head has no baseline.
      return [it.name, { body: m.body, head: { depth: 0, part: '', count: 0 } }];
    }),
  );
  const restClip: AnimationDef = { duration: 1, loop: false, pose: () => ({}) };
  const wanted: [string, AnimationDef][] = [
    ['rest', restClip],
    ...(options.clips ? [...collected.animations].filter(([n]) => options.clips!.includes(n)) : [...collected.animations]),
  ];
  const clips = wanted.map(([name, anim]) => {
    const frames = anim === restClip ? 1 : Math.max(2, Math.round(anim.duration * fps) + 1);
    const open = new Map<string, { from: number; to: number; depth: number; part: string; region: RegionName; item: string }>();
    const contacts: Contact[] = [];
    let closest: HeadClearance | null = null;
    const close = (key: string) => {
      const c = open.get(key);
      if (c) contacts.push({ clip: name, item: c.item, region: c.region, part: c.part, from: c.from, to: c.to, depth: c.depth });
      open.delete(key);
    };
    for (let f = 0; f < frames; f++) {
      const phase = frames === 1 ? 0 : f / (frames - 1);
      const skin = skinMatrices(skeleton, order, anim.pose(phase * anim.duration, phase));
      for (const item of items) {
        // A clip hides an item by scaling its bone to about 0 (tongs outside the work clip): it
        // collapses to a point at the bone and cannot touch anything.
        if (skin.get(item.bone)!.getMaxScaleOnAxis() < 0.05) {
          for (const region of ['head', 'body'] as const) close(`${item.name}:${region}`);
          continue;
        }
        const d = measure(skin, item);
        if (d.clear.part && (!closest || d.clear.distance < closest.distance))
          closest = { item: item.name, part: d.clear.part, phase, distance: d.clear.distance };
        const base = baseline.get(item.name)!;
        const points = item.chunks.reduce((n, c) => n + c.points.length, 0);
        for (const region of ['head', 'body'] as const) {
          const key = `${item.name}:${region}`;
          const extra = d[region].depth - base[region].depth;
          const extraCount = d[region].count - base[region].count;
          if (extra > (region === 'head' ? headMargin : margin) || extraCount > Math.max(8, points * 0.02)) {
            const c = open.get(key);
            if (c) {
              c.to = phase;
              if (extra > c.depth) Object.assign(c, { depth: Math.max(0, extra), part: d[region].part });
            } else open.set(key, { from: phase, to: phase, depth: Math.max(0, extra), part: d[region].part, region, item: item.name });
          } else close(key);
        }
      }
    }
    for (const key of [...open.keys()]) close(key);
    return { name, frames, contacts, closest };
  });
  return {
    items: items.map((i) => ({ name: i.name, bone: i.bone })),
    regions,
    clips,
    margin,
    headMargin,
    ok: clips.every((c) => c.contacts.every((x) => x.region !== 'head')),
  };
}

/** A short text report of a clip check. */
export function formatClipCheck(name: string, r: ClipCheckResult): string {
  const lines: string[] = [];
  const cm = (m: number) => `${(m * 100).toFixed(1)} cm`;
  const ph = (a: number, b: number) => (Math.abs(a - b) < 1e-6 ? `phase ${a.toFixed(2)}` : `phase ${a.toFixed(2)}-${b.toFixed(2)}`);
  lines.push(`check  ${name}: held items ${r.items.map((i) => `${i.name} (${i.bone})`).join(', ') || 'none'}`);
  lines.push(`       head parts: ${r.regions.head.join(', ') || 'none'}; body parts: ${r.regions.body.join(', ') || 'none'}`);
  for (const c of r.clips) {
    const near = c.closest
      ? `closest to the head ${cm(Math.max(0, c.closest.distance))} (${c.closest.item} to ${c.closest.part} at phase ${c.closest.phase.toFixed(2)})`
      : `nothing within ${cm(CLEAR_CAP)} of the head`;
    if (c.contacts.length === 0) {
      lines.push(`  ${c.name.padEnd(10)} ok, ${near}`);
      continue;
    }
    if (!c.contacts.some((x) => x.region === 'head')) lines.push(`  ${c.name.padEnd(10)} ${near}`);
    for (const x of c.contacts)
      lines.push(
        `  ${c.name.padEnd(10)} ${x.region === 'head' ? 'HEAD' : 'body'}: ${x.item} goes ${cm(x.depth)} into ${x.part} at ${ph(x.from, x.to)}`,
      );
  }
  const heads = r.clips.flatMap((c) => c.contacts.filter((x) => x.region === 'head'));
  lines.push(
    r.items.length === 0
      ? 'result  no held items to check'
      : heads.length === 0
        ? `result  ok: no held item passes through the head (contact limit ${cm(r.headMargin)}; closest ${closestText(r)})`
        : `result  FAIL: a held item passes through the head in ${new Set(heads.map((h) => h.clip)).size} clip(s)`,
  );
  return lines.join('\n');
}

/** The closest head approach over all clips, as text. */
function closestText(r: ClipCheckResult): string {
  const all = r.clips.filter((c) => c.closest).map((c) => ({ clip: c.name, ...c.closest! }));
  if (all.length === 0) return `more than ${(CLEAR_CAP * 100).toFixed(1)} cm`;
  const m = all.reduce((a, b) => (b.distance < a.distance ? b : a));
  return `${(Math.max(0, m.distance) * 100).toFixed(1)} cm, ${m.item} in ${m.clip}`;
}

export type { Vec3 };

export interface GroundSink {
  readonly clip: string;
  /** The lowest point in the clip, in meters (y). */
  readonly lowest: number;
  /** The body whose vertex is lowest. */
  readonly part: string;
  readonly from: number;
  readonly to: number;
}

export interface GroundResult {
  /** The lowest point of the rest pose (feet or paws on the ground, about 0). */
  readonly rest: number;
  readonly sinks: readonly GroundSink[];
  readonly tolerance: number;
  readonly ok: boolean;
}

/**
 * Ground check on a built, skinned asset: plays every clip and finds where any vertex goes more
 * than `tolerance` below the lowest point of the rest pose (feet through the floor, a body that
 * sinks when it lies down). Flying and hopping above the ground is fine.
 */
export function checkGround(root: THREE.Object3D, options: { fps?: number; tolerance?: number; clips?: readonly string[] } = {}): GroundResult {
  const fps = options.fps ?? 30;
  const tolerance = options.tolerance ?? 0.015;
  const meshes: THREE.SkinnedMesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) meshes.push(o as THREE.SkinnedMesh);
  });
  if (meshes.length === 0) return { rest: 0, sinks: [], tolerance, ok: true };
  const lowest = () => lowestPoint(root, meshes);
  const skeletons = [...new Set(meshes.map((m) => m.skeleton))];
  const toRest = () => skeletons.forEach((s) => s.pose());
  toRest();
  const rest = lowest().min;
  const mixer = new THREE.AnimationMixer(root);
  const sinks: GroundSink[] = [];
  for (const clip of root.animations) {
    if (options.clips && !options.clips.includes(clip.name)) continue;
    toRest();
    const action = mixer.clipAction(clip);
    action.reset().play();
    const frames = Math.max(2, Math.round(clip.duration * fps) + 1);
    let open: { from: number; to: number; lowest: number; part: string } | null = null;
    // A digging clip allows its tool this much deeper (AnimationDef.dig).
    const allowed = tolerance + ((clip.userData as { dig?: number }).dig ?? 0);
    for (let f = 0; f < frames; f++) {
      const phase = f / (frames - 1);
      mixer.setTime(phase * clip.duration * 0.9999);
      const { min, part } = lowest();
      if (min < rest - allowed) {
        if (open) {
          open.to = phase;
          if (min < open.lowest) Object.assign(open, { lowest: min, part });
        } else open = { from: phase, to: phase, lowest: min, part };
      } else if (open) {
        sinks.push({ clip: clip.name, ...open });
        open = null;
      }
    }
    if (open) sinks.push({ clip: clip.name, ...open });
    action.stop();
    mixer.uncacheClip(clip);
  }
  toRest();
  return { rest, sinks, tolerance, ok: sinks.length === 0 };
}

/** A short text report of a ground check. */
export function formatGround(r: GroundResult): string {
  const cm = (m: number) => `${(m * 100).toFixed(1)} cm`;
  const lines = r.sinks.map(
    (s) => `  ${s.clip.padEnd(10)} GROUND: ${s.part} goes ${cm(r.rest - s.lowest)} below the rest pose at phase ${s.from.toFixed(2)}-${s.to.toFixed(2)}`,
  );
  lines.push(
    r.ok
      ? `ground  ok: no clip sinks more than ${cm(r.tolerance)} below the rest pose (rest lowest ${cm(r.rest)})`
      : `ground  FAIL: ${new Set(r.sinks.map((s) => s.clip)).size} clip(s) sink below the ground`,
  );
  return lines.join('\n');
}
