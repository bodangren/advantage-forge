import * as THREE from 'three';
import type { AssetContext, AssetDefinition, BodyOptions } from './asset.js';
import { mixRgb, rgb, type Rgb } from './sdf/color.js';
import { halfSpace, type Sdf, type Vec3 } from './sdf/core.js';

/**
 * Equipment on the avatar (docs/avatar-system.md section 5; the sockets in docs/equipment-parts.md).
 *
 * An equipment asset declares one `equip` block: its slot, the point of the asset that sits on the
 * slot's socket, the turn from the asset's axes into the socket's axes, and its fit scale (display
 * size / worn size). The forge validates the block when the asset builds, resolves it into a
 * bone-local transform for every bone the piece attaches to, and writes the result to the GLB root
 * extras (`forgeEquip`). A composer then only adds the piece to the bone with that transform.
 */

export type EquipSlot = 'head' | 'chest' | 'shoulders' | 'back' | 'hands' | 'waist' | 'feet' | 'mainhand' | 'offhand';

/** How a hand slot holds the piece: in the fist (`grip`), or strapped to the forearm (`shield`). */
export type EquipHold = 'grip' | 'shield';

/** The base bodies that a piece can hide while it is worn. Skin and pants always show. */
export type BaseLayer = 'hair' | 'undershirt' | 'shoes';

export interface EquipDeclaration {
  readonly slot: EquipSlot;
  /** Hand slots only: `grip` (default) or `shield` (offhand only). */
  readonly hold?: EquipHold;
  /** Display size / worn size: 1 for hero parts, 2 for the 2x catalog armor, 1 / 0.45 for catalog weapons. Default 1. */
  readonly fitScale?: number;
  /**
   * Where the socket frame stands in the asset (display meters): the point of the asset that sits
   * on the socket. Default the asset origin. For a standalone of a part, this is the move of its
   * rest pose (`addPart(k, part, { pose: (s) => s.at(0, LIFT, 0) })` gives `origin: [0, LIFT, 0]`).
   */
  readonly origin?: Vec3;
  /**
   * How the socket frame is turned in the asset, in degrees about X, then Y, then Z (as
   * `Sdf.rotate`): a shape built in the socket frame, turned by `rotate`, and moved to `origin`
   * stands as the asset shows it. For a standalone of a part, this is the turn of its rest pose.
   * Default none (the asset's axes are the socket's axes).
   */
  readonly rotate?: Vec3;
  /** A small shift in worn meters, in the socket frame, after the turn. */
  readonly offset?: Vec3;
  /** Base bodies hidden while the piece is worn. */
  readonly hides?: readonly BaseLayer[];
  /** Bodies of the asset that only the display shows (a stand); the worn piece leaves them out. */
  readonly displayOnly?: readonly string[];
  /** Mainhand weapons only: the piece fills both hand slots. */
  readonly twoHanded?: boolean;
}

/**
 * The rest positions (character frame, meters) of the hero skeleton bones that sockets use, from
 * `assets/avatar-base.ts` (the rogue's skeleton). Rest bones have no rotation, so a bone frame is
 * the character frame moved to the joint. `tests/equip.test.ts` checks them against the base.
 */
export const BASE_JOINTS: Readonly<Record<string, Vec3>> = {
  hips: [0, 0.2, 0],
  chest: [0, 0.33, 0],
  head: [0, 0.48, -0.01],
  cloak: [0, 0.41, -0.13],
  'upperarm.L': [0.13, 0.385, 0],
  'forearm.L': [0.18, 0.332, 0.012],
  'hand.L': [0.205, 0.238, 0.03],
  'knife.L': [0.232, 0.172, 0.022],
  'shin.L': [0.083, 0.1325, 0],
};

type Turn = readonly ['x' | 'y' | 'z', number];

export interface Socket {
  /** The bone (the left one of a mirrored socket). */
  readonly bone: string;
  /** The socket point in the character frame, rest pose. */
  readonly at: Vec3;
  /** The socket axes: turns (in order) from the part's local axes into the character axes. */
  readonly turns: readonly Turn[];
  /**
   * Also worn on the `.R` bone, mirrored: `pair` keeps the +X half of the asset (the asset shows
   * a pair; the +X one is the left), `copy` the whole asset (the asset shows the left one).
   */
  readonly mirror?: 'pair' | 'copy';
  /** The fit scales that the fit contract allows (docs/equipment-fit.md). */
  readonly scales: readonly number[];
  /** Base bodies that a piece in this socket may hide. */
  readonly hides: readonly BaseLayer[];
}

/** 1 / the hand fit of real-world catalog weapons and shields (docs/equipment-fit.md). */
export const HAND_FIT = 1 / 0.45;

const mirrorX = (p: Vec3): Vec3 => [-p[0], p[1], p[2]];

/**
 * The sockets. The part local frames are in docs/equipment-parts.md: a head piece has its origin
 * at the head center of the 1x hero base; a 2x chest piece has its hem center on the origin; a
 * hand-held piece has the grip center at the origin, the shaft along +Y with the business end up,
 * and the flat toward +Z; a shield has the center of its back plane at the origin, the face toward
 * +Z, and the top toward +Y.
 */
export const SOCKETS = {
  head: { bone: 'head', at: [0, 0.675, 0], turns: [], scales: [1], hides: ['hair'] },
  chest: { bone: 'chest', at: [0, 0.152, 0], turns: [], scales: [2, 1], hides: ['undershirt'] },
  shoulders: { bone: 'upperarm.L', at: [0.13, 0.385, 0], turns: [], mirror: 'copy', scales: [2, 1], hides: [] },
  // The neck opening center of the hero torso (the cape's collar goes here), on the cloak bone.
  back: { bone: 'cloak', at: [0, 0.47, 0], turns: [], scales: [2, 1], hides: [] },
  hands: { bone: 'forearm.L', at: [0.205, 0.238, 0.03], turns: [], mirror: 'pair', scales: [2, 1], hides: [] },
  waist: { bone: 'hips', at: [0, 0.29, 0], turns: [], scales: [2, 1], hides: [] },
  feet: { bone: 'shin.L', at: [0.098, 0.07, 0], turns: [], mirror: 'pair', scales: [2, 1], hides: ['shoes'] },
  // The fist holds the grip with the business end forward and 20 degrees up, the flat outward:
  // a forward swing of the arm raises the blade, and the side view shows the whole flat.
  'grip.R': { bone: 'knife.R', at: mirrorX(BASE_JOINTS['knife.L']!), turns: [['y', -90], ['x', 70]], scales: [1, HAND_FIT], hides: [] },
  'grip.L': { bone: 'knife.L', at: BASE_JOINTS['knife.L']!, turns: [['y', 90], ['x', 70]], scales: [1, HAND_FIT], hides: [] },
  // The hero shield hold (the knight base's shieldPose turn) on the outside of the lower forearm;
  // the back plane is 5 cm in front of the fist center, so the fist stays behind the shield. On the
  // hand bone, so that a clip can turn the shield away from the head with the wrist.
  shield: { bone: 'hand.L', at: [0.2415, 0.276, 0.0816], turns: [['z', -4], ['x', 4], ['y', 38]], scales: [1, HAND_FIT], hides: [] },
} as const satisfies Record<string, Socket>;

export type SocketName = keyof typeof SOCKETS;

/** The socket of a declaration. */
export function socketOf(eq: Pick<EquipDeclaration, 'slot' | 'hold'>): SocketName {
  if (eq.slot === 'mainhand') return 'grip.R';
  if (eq.slot === 'offhand') return eq.hold === 'shield' ? 'shield' : 'grip.L';
  return eq.slot;
}

/** One bone that a worn piece attaches to, with the bone-local transform (three.js TRS). */
export interface EquipAttach {
  readonly bone: string;
  readonly position: Vec3;
  /** [x, y, z, w]. */
  readonly quaternion: readonly [number, number, number, number];
  /** Uniform 1 / fitScale; negative x on a mirrored copy. */
  readonly scale: Vec3;
  /** `+x`: show only the part of the piece where x >= 0 in the asset frame (one of a pair). */
  readonly half: '+x' | null;
}

/** The `forgeEquip` record in the GLB root extras and in stats.json. */
export interface ResolvedEquip {
  readonly slot: EquipSlot;
  readonly socket: SocketName;
  readonly fitScale: number;
  readonly hides: readonly BaseLayer[];
  readonly displayOnly: readonly string[];
  readonly twoHanded: boolean;
  readonly attach: readonly EquipAttach[];
}

const SLOTS: readonly EquipSlot[] = ['head', 'chest', 'shoulders', 'back', 'hands', 'waist', 'feet', 'mainhand', 'offhand'];

/** Check a declaration against the fit contract. `bodies`: the asset's body names. Throws on the first error. */
export function validateEquip(eq: EquipDeclaration, bodies: readonly string[]): void {
  const where = `equip (slot '${eq.slot}')`;
  if (!SLOTS.includes(eq.slot)) throw new Error(`equip: unknown slot '${eq.slot}'. Slots: ${SLOTS.join(', ')}.`);
  if (eq.hold !== undefined) {
    if (eq.slot !== 'mainhand' && eq.slot !== 'offhand') throw new Error(`${where}: 'hold' is only for mainhand and offhand.`);
    if (eq.hold === 'shield' && eq.slot !== 'offhand') throw new Error(`${where}: a shield is held in the offhand.`);
  }
  const socket: Socket = SOCKETS[socketOf(eq)];
  const f = eq.fitScale ?? 1;
  if (!socket.scales.some((s) => Math.abs(s - f) <= s * 0.005))
    throw new Error(`${where}: fitScale ${f} is not in the fit contract. Allowed: ${socket.scales.map((s) => +s.toFixed(4)).join(', ')}.`);
  for (const v of [eq.origin, eq.rotate, eq.offset])
    if (v !== undefined && (v.length !== 3 || v.some((n) => !Number.isFinite(n)))) throw new Error(`${where}: origin, rotate, and offset take three numbers.`);
  for (const h of eq.hides ?? [])
    if (!(socket.hides as readonly string[]).includes(h))
      throw new Error(`${where}: cannot hide '${h}'. This slot hides: ${socket.hides.join(', ') || 'nothing'}.`);
  if (eq.twoHanded && eq.slot !== 'mainhand') throw new Error(`${where}: only a mainhand piece is two-handed.`);
  for (const name of eq.displayOnly ?? [])
    if (!bodies.includes(name)) throw new Error(`${where}: displayOnly names '${name}', which is not a body. Bodies: ${bodies.join(', ')}.`);
  if (bodies.length > 0 && bodies.every((b) => (eq.displayOnly ?? []).includes(b))) throw new Error(`${where}: every body is displayOnly.`);
}

const turnMatrix = (turns: readonly Turn[]): THREE.Matrix4 => {
  const m = new THREE.Matrix4();
  // Each turn applies after the ones before it (about the fixed axes), so it multiplies on the left.
  for (const [axis, deg] of turns) {
    const r = deg * THREE.MathUtils.DEG2RAD;
    m.premultiply(axis === 'x' ? new THREE.Matrix4().makeRotationX(r) : axis === 'y' ? new THREE.Matrix4().makeRotationY(r) : new THREE.Matrix4().makeRotationZ(r));
  }
  return m;
};

/**
 * The worn transforms of a piece: asset frame (display meters) to the character frame (worn
 * meters) in the rest pose, one per bone. The second one, on a mirrored socket, is the mirror of
 * the first across x = 0 (a negative determinant).
 */
export function wornMatrices(eq: EquipDeclaration): { bone: string; matrix: THREE.Matrix4; half: '+x' | null }[] {
  const socket: Socket = SOCKETS[socketOf(eq)];
  const f = eq.fitScale ?? 1;
  const [ox, oy, oz] = eq.origin ?? [0, 0, 0];
  const [rx, ry, rz] = eq.rotate ?? [0, 0, 0];
  const [dx, dy, dz] = eq.offset ?? [0, 0, 0];
  const w = new THREE.Matrix4()
    .makeTranslation(...socket.at)
    .multiply(turnMatrix(socket.turns))
    .multiply(new THREE.Matrix4().makeTranslation(dx, dy, dz))
    .multiply(new THREE.Matrix4().makeScale(1 / f, 1 / f, 1 / f))
    .multiply(turnMatrix([['x', rx], ['y', ry], ['z', rz]]).invert())
    .multiply(new THREE.Matrix4().makeTranslation(-ox, -oy, -oz));
  const half: '+x' | null = socket.mirror === 'pair' ? '+x' : null;
  const out = [{ bone: socket.bone, matrix: w, half }];
  if (socket.mirror) out.push({ bone: socket.bone.replace(/\.L$/, '.R'), matrix: new THREE.Matrix4().makeScale(-1, 1, 1).multiply(w), half });
  return out;
}

/** The rest position of a socket bone (the `.R` bones are the mirrors of the `.L` ones). */
export function jointOf(bone: string): Vec3 {
  const left = BASE_JOINTS[bone] ?? (bone.endsWith('.R') ? BASE_JOINTS[bone.replace(/\.R$/, '.L')] : undefined);
  if (!left) throw new Error(`No joint position for bone '${bone}'.`);
  return BASE_JOINTS[bone] ? left : mirrorX(left);
}

const r6 = (v: number) => Math.round(v * 1e6) / 1e6 + 0;

/** Resolve a declaration into the record for the GLB extras: one bone-local transform per bone. */
export function resolveEquip(eq: EquipDeclaration): ResolvedEquip {
  const attach = wornMatrices(eq).map(({ bone, matrix, half }) => {
    const [jx, jy, jz] = jointOf(bone);
    const local = new THREE.Matrix4().makeTranslation(-jx, -jy, -jz).multiply(matrix);
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    local.decompose(p, q, s);
    return {
      bone,
      position: [r6(p.x), r6(p.y), r6(p.z)] as Vec3,
      quaternion: [r6(q.x), r6(q.y), r6(q.z), r6(q.w)] as const,
      scale: [r6(s.x), r6(s.y), r6(s.z)] as Vec3,
      half,
    };
  });
  return {
    slot: eq.slot,
    socket: socketOf(eq),
    fitScale: eq.fitScale ?? 1,
    hides: [...(eq.hides ?? [])],
    displayOnly: [...(eq.displayOnly ?? [])],
    twoHanded: eq.twoHanded ?? false,
    attach,
  };
}

// ---------------------------------------------------------------- wearing pieces on a base

export interface WornPiece {
  readonly name: string;
  readonly def: AssetDefinition;
}

const toHex = (c: Rgb): string => {
  const s = (v: number) => {
    const x = Math.max(0, Math.min(1, v));
    const e = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    return Math.round(e * 255).toString(16).padStart(2, '0');
  };
  return `#${s(c[0])}${s(c[1])}${s(c[2])}`;
};

/**
 * A base (the avatar) wearing equipment pieces, as one rigged asset: for the fit check, the clip
 * clearance check, and review renders (`forge render avatar-base --wear iron-helmet,short-sword`).
 * Every piece body is posed with its worn transform and bound rigidly to its bone; a mirrored slot
 * adds the mirrored copy on the `.R` bone. Base bodies that a piece hides are left out. A piece's
 * color slots take their default colors (the base keeps its own slots).
 */
export function wearAsset(base: AssetDefinition, pieces: readonly WornPiece[]): AssetDefinition {
  const missing = pieces.filter((p) => !p.def.equip);
  if (missing.length > 0) throw new Error(`No equip block in: ${missing.map((p) => p.name).join(', ')}.`);
  const hidden = new Set(pieces.flatMap((p) => p.def.equip!.hides ?? []));
  const def: AssetDefinition = {
    name: [base.name, ...pieces.map((p) => p.name)].join('+'),
    ...(base.detail !== undefined ? { detail: base.detail } : {}),
    ...(base.skinBlend !== undefined ? { skinBlend: base.skinBlend } : {}),
    ...(base.texture !== undefined ? { texture: base.texture } : {}),
    ...(base.variants ? { variants: base.variants } : {}),
    ...(base.presets ? { presets: base.presets } : {}),
    async build(k) {
      await base.build({ ...k, body: (name, shape, options) => (hidden.has(name as BaseLayer) ? undefined : k.body(name, shape, options)) });
      for (const piece of pieces) await wearPiece(k, piece);
    },
  };
  return def;
}

async function wearPiece(k: AssetContext, piece: WornPiece): Promise<void> {
  const eq = piece.def.equip!;
  const f = eq.fitScale ?? 1;
  const skip = new Set(eq.displayOnly ?? []);
  const worn = wornMatrices(eq);
  const slotColor = (slot: string): Rgb => {
    const options = piece.def.variants?.[slot];
    const first = options ? Object.values(options)[0] : undefined;
    if (first === undefined) throw new Error(`${piece.name}: no color slot '${slot}'.`);
    return rgb(first);
  };
  const tint = ((slot: string, arg: number | { readonly color: string; readonly follow: number } = 0) => {
    if (typeof arg === 'object') return arg.color;
    const c = slotColor(slot);
    return toHex(arg >= 0 ? mixRgb(c, [1, 1, 1], arg) : mixRgb(c, [0, 0, 0], -arg));
  }) as AssetContext['tint'];
  const context = (frame: THREE.Matrix4): AssetContext => ({
    body(name, shape, options = {}) {
      if (skip.has(name)) return;
      const local = shape.transform(frame.elements);
      for (const [i, { bone, matrix, half }] of worn.entries()) {
        const cut = half ? local.intersect(halfSpace([-1, 0, 0], 0)) : local;
        k.body(`${piece.name}:${name}${i > 0 ? '.R' : ''}`, cut.transform(matrix.elements), wornOptions(piece.def, options, f, bone, matrix));
      }
    },
    add() {
      throw new Error(`${piece.name}: k.add is not supported in a worn piece.`);
    },
    group(_name, options, fn) {
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(...(options.at ?? [0, 0, 0])),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(...((options.rotate ?? [0, 0, 0]).map((d) => d * THREE.MathUtils.DEG2RAD) as unknown as Vec3))),
        new THREE.Vector3(1, 1, 1),
      );
      fn(context(frame.clone().multiply(m)));
    },
    skeleton() {
      throw new Error(`${piece.name}: an equipment piece has no skeleton.`);
    },
    animation() {
      throw new Error(`${piece.name}: an equipment piece has no clips.`);
    },
    tint,
  });
  await piece.def.build(context(new THREE.Matrix4()));
}

/** Body options of a worn piece body: sizes in meters shrink with the fit scale; a bump follows the piece. */
function wornOptions(def: AssetDefinition, o: BodyOptions, f: number, bone: string, matrix: THREE.Matrix4): BodyOptions {
  const { bump, ...rest } = o;
  const inv = matrix.clone().invert();
  const p = new THREE.Vector3();
  return {
    ...rest,
    bone,
    // The worn piece is smaller, so it needs finer cells; 3 mm keeps the review builds quick.
    detail: Math.max(0.003, (o.detail ?? def.detail ?? 0.006) / f),
    ...(o.maxError !== undefined ? { maxError: o.maxError / f } : {}),
    ...(bump ? { bump: (x: number, y: number, z: number) => bump(...p.set(x, y, z).applyMatrix4(inv).toArray()) / f } : {}),
  };
}

export type { Sdf };
