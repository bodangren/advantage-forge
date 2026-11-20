import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { AGE5, humanoidAsset } from '../assets/parts/humanoid-kind.js';
import type { AssetDefinition } from '../src/asset.js';
import type { HumanoidKind, HumanoidProportions } from '../assets/parts/humanoid-kind.js';
import { sproutGestures } from '../assets/parts/sprout-gestures.js';
import hero from '../assets/avatar-base.js';
import pat from '../assets/sprout-pat.js';
import sam from '../assets/sprout-sam.js';
import mia from '../assets/sprout-mia.js';
import may from '../assets/sprout-may.js';
import nan from '../assets/sprout-nan.js';
import lily from '../assets/sprout-lily.js';
import adultBase from '../assets/sprout-adult-base.js';

/**
 * Red: per-character hand offset (`handClearance`, meters) for bob hair.
 *
 * Lily needs a wider bob (side panels near |x| 0.22 m head-local). The hands of
 * `gesture-point-up`, `cheer`, and `picture-sway` pass near the head today, so a wider
 * bob collides (worst: 3.7 cm in point-up). The fix is an opt-in per-character option:
 * `sproutGestures(k, h, P, { handClearance })` for the two gesture clips, and the same
 * option name `handClearance` on the kind object passed to `humanoidAsset` (read in
 * `assets/parts/humanoid-kind.ts`, in the `animation('cheer', ...)` wrist goal) for `cheer`.
 * Default 0 (absent) keeps every pose identical for every character.
 *
 * Metric: the 3D distance from the HEAD CENTER to the wrist. The head center is the head
 * bone joint position (`skel.head.at`: [0, 0.43672, -0.01] at AGE5). The hand may clear
 * the hair outward, forward (+Z), or up. The metric is exact under these clips' poses:
 * both the wrist and the head joint sit in the chest frame (no bone between them carries
 * a pose `move`), so the rest-frame FK distance equals the world distance. Rotation-only
 * implementations can pass; the test never requires a bone `move`.
 *
 * Feasibility (Red r2, sampled 400,000 rotation-only arm poses with this file's FK
 * model, AGE5): point-up base 0.215993 m, max 0.274654 m (gain 0.058661 m); picture-sway
 * base 0.222998 m, max about 0.2747 m (gain about 0.0517 m); cheer base 0.229336 m, max
 * about 0.2747 m (gain about 0.0453 m). Every clip clears the 0.035 m floor, so no clip
 * needs a lowered floor.
 *
 * Part A pins today's poses (passes now): the full gesture pose data of Pat, Sam, Mia, May,
 * Nan, Lily, and the adult base, plus the base-kind clips of the hero. Part B pins the
 * contract of the option (fails now for the right reason: the option is ignored, so the
 * hands do not move). Only `gesture-point-up`, `picture-sway`, and `cheer` may change.
 *
 * The module holds 26 sprout clips today (the brief said 25); the guard pins all 26.
 * No GLB build and no browser: poses come from the real asset `build` functions run against
 * a fake asset context, and wrist positions come from forward kinematics on the real
 * skeleton rest positions.
 */

const DEG = Math.PI / 180;
/** Requested outward move of the hands, in meters. */
const CLEARANCE = 0.04;
/** Accepted shortfall below the requested move, in meters. */
const TOL = 0.005;

interface Captured {
  readonly skel: Record<string, { at: readonly [number, number, number] }>;
  readonly anims: Map<string, { duration: number; loop?: boolean; pose: (t: number, p: number) => Record<string, { rotate?: readonly [number, number, number]; move?: readonly [number, number, number] }> }>;
}

function capture(def: AssetDefinition): Captured {
  const anims = new Map<string, Captured['anims'] extends Map<string, infer A> ? A : never>();
  const skel: Captured['skel'] = {};
  const k: {
    body(): void; add(): void; group(n: string, o: unknown, fn: (kk: unknown) => void): void;
    skeleton(d: unknown): void; animation(n: string, a: unknown): void; tint(): string;
  } = {
    body() {},
    add() {},
    group(_n: string, _o: unknown, fn: (kk: unknown) => void) { fn(k); },
    skeleton(d: unknown) { Object.assign(skel, d); },
    animation(n: string, a: unknown) {
      anims.set(n, a as Captured['anims'] extends Map<string, infer A> ? A : never);
    },
    tint() { return '#ffffff'; },
  };
  // biome-ignore lint: the fake context only records skeleton and animation definitions.
  def.build(k as never);
  return { skel, anims };
}

/** The real humanoid shape of a Lily-like kind (same proportions and hand options as Lily). */
function realShape(P: HumanoidProportions): { shape: unknown; skel: Captured['skel'] } {
  let shape: unknown;
  const kind: HumanoidKind = {
    name: 'probe-shape',
    description: 'probe',
    reference: 'docs/sprout-mockups/lily.jpg',
    proportions: P,
    sing: true,
    sproutFace: true,
    sproutHands: true,
    hair: false,
    undershirt: false,
    pants: false,
    shoes: false,
    variants: {
      skin: { fair: '#f2c7a4' },
      hair: { brown: '#5a301d' },
      eyes: { brown: '#6e4020' },
      cloth: { blue: '#3f8fd0' },
    },
    extra(k: never, h: unknown) {
      shape = h;
    },
  };
  const { skel } = capture(humanoidAsset(kind));
  if (shape === undefined) throw new Error('probe kind did not yield a shape');
  return { shape, skel };
}

/** A Lily-like kind whose `extra` forwards the given gesture options (the Green threading). */
function lilyLikeKind(gestureOpts: { handClearance?: number } | undefined): HumanoidKind {
  return {
    name: 'probe-lily-like',
    description: 'probe',
    reference: 'docs/sprout-mockups/lily.jpg',
    proportions: AGE5,
    sing: true,
    sproutFace: true,
    sproutHands: true,
    hair: false,
    undershirt: false,
    pants: false,
    shoes: false,
    variants: {
      skin: { fair: '#f2c7a4' },
      hair: { brown: '#5a301d' },
      eyes: { brown: '#6e4020' },
      cloth: { blue: '#3f8fd0' },
    },
    extra(k: never, h: never) {
      (sproutGestures as (k: never, h: never, p: never, o?: unknown) => void)(
        k, h, AGE5 as never, gestureOpts,
      );
    },
  };
}

/** The 3D distance from the head center (head bone joint) to each wrist under a pose. */
function wristHeadDistance(
  skel: Captured['skel'],
  pose: Record<string, { rotate?: readonly [number, number, number] }>,
  side: 'L' | 'R',
): number {
  const quat = (r: readonly [number, number, number]): THREE.Quaternion =>
    new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0] * DEG, r[1] * DEG, r[2] * DEG));
  const vec = (a: readonly [number, number, number]): THREE.Vector3 =>
    new THREE.Vector3(a[0], a[1], a[2]);
  const S = vec(skel[`upperarm.${side}`]!.at);
  const E = vec(skel[`forearm.${side}`]!.at);
  const W = vec(skel[`hand.${side}`]!.at);
  const Ru = quat(pose[`upperarm.${side}`]?.rotate ?? [0, 0, 0]);
  const Rf = quat(pose[`forearm.${side}`]?.rotate ?? [0, 0, 0]);
  const elbow = S.clone().add(E.clone().sub(S).applyQuaternion(Ru));
  const wrist = elbow.clone().add(W.clone().sub(E).applyQuaternion(Ru).applyQuaternion(Rf));
  return wrist.distanceTo(vec(skel['head']!.at));
}

const roundJson = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(roundJson)
    : v !== null && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, roundJson(x)]))
      : typeof v === 'number'
        ? Math.round(v * 1e6) / 1e6
        : v;

/** Canonical digest of every clip pose at four sample phases (the full default snapshot). */
function digestAll(def: AssetDefinition): { size: number; digest: string } {
  const { anims } = capture(def);
  const parts: string[] = [];
  for (const [name, a] of anims)
    for (const ph of [0, 0.25, 0.5, 0.75])
      parts.push(`${name}@${ph}=${JSON.stringify(roundJson(a.pose(ph * a.duration, ph)))}`);
  let h = 0x811c9dc5;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return { size: anims.size, digest: (h >>> 0).toString(16).padStart(8, '0') };
}

const SPROUT_CLIPS = [
  'gesture-idle', 'gesture-clap', 'gesture-wave', 'gesture-nod', 'gesture-touch-nose',
  'gesture-touch-neck', 'gesture-point-to-self', 'gesture-point-forward', 'gesture-hands-out',
  'gesture-point-up', 'gesture-reach', 'gesture-count-fingers', 'gesture-sway', 'gesture-look',
  'gesture-hop', 'gesture-stretch-up', 'gesture-eat', 'gesture-hug-self', 'gesture-bow',
  'gesture-listen', 'gesture-stamp', 'gesture-march', 'gesture-turn', 'picture-march',
  'picture-stamp', 'picture-sway',
];
const BASE_CLIPS = ['idle', 'walk', 'run', 'attack', 'hit', 'rest', 'cheer', 'cast'];
const MOVED_SPROUT = new Set(['gesture-point-up', 'picture-sway']);
const MOVED_BASE = new Set(['cheer']);

describe('per-character hand offset (default poses stay identical)', () => {
  it('keeps the full clip inventory: 26 sprout clips plus 8 base clips', () => {
    for (const def of [pat, sam, mia, may, nan, lily, adultBase]) {
      const { anims } = capture(def);
      expect([...anims.keys()].sort()).toEqual([...SPROUT_CLIPS, ...BASE_CLIPS].sort());
      for (const name of SPROUT_CLIPS) {
        expect(anims.get(name)!.duration).toBe(2);
        expect(anims.get(name)!.loop).toBe(true);
      }
    }
    const { anims } = capture(hero);
    expect([...anims.keys()].sort()).toEqual([...BASE_CLIPS].sort());
  });

  it('keeps the full default pose data per character', () => {
    expect(digestAll(pat)).toEqual({ size: 34, digest: 'c16572dc' });
    expect(digestAll(sam)).toEqual({ size: 34, digest: '22563e18' });
    expect(digestAll(mia)).toEqual({ size: 34, digest: '22563e18' });
    expect(digestAll(may)).toEqual({ size: 34, digest: '5e70ec98' });
    expect(digestAll(nan)).toEqual({ size: 34, digest: '22563e18' });
    expect(digestAll(lily)).toEqual({ size: 34, digest: '22563e18' });
    expect(digestAll(adultBase)).toEqual({ size: 34, digest: '753da272' });
    expect(digestAll(hero)).toEqual({ size: 8, digest: '68442177' });
  });

  it('keeps the key hand distances of point-up, picture-sway, and cheer', () => {
    const at = (def: AssetDefinition, clip: string, t: number, p: number) => {
      const c = capture(def);
      return { skel: c.skel, pose: c.anims.get(clip)!.pose(t, p) as Record<string, { rotate?: readonly [number, number, number] }> };
    };
    // Raised right wrist of point-up at its hold (t = 1.0 s of 2 s).
    expect(wristHeadDistance(at(sam, 'gesture-point-up', 1.0, 0.5).skel, at(sam, 'gesture-point-up', 1.0, 0.5).pose, 'R')).toBeCloseTo(0.21599, 4);
    expect(wristHeadDistance(at(lily, 'gesture-point-up', 1.0, 0.5).skel, at(lily, 'gesture-point-up', 1.0, 0.5).pose, 'R')).toBeCloseTo(0.21599, 4);
    expect(wristHeadDistance(at(adultBase, 'gesture-point-up', 1.0, 0.5).skel, at(adultBase, 'gesture-point-up', 1.0, 0.5).pose, 'R')).toBeCloseTo(0.4216, 4);
    // Both raised wrists of picture-sway (constant held pose).
    const sway = at(sam, 'picture-sway', 1.0, 0.5);
    expect(wristHeadDistance(sway.skel, sway.pose, 'R')).toBeCloseTo(0.223, 4);
    expect(wristHeadDistance(sway.skel, sway.pose, 'L')).toBeCloseTo(0.223, 4);
    const adultSway = at(adultBase, 'picture-sway', 1.0, 0.5);
    expect(wristHeadDistance(adultSway.skel, adultSway.pose, 'R')).toBeCloseTo(0.4356, 4);
    // Both pumped fists of cheer at its peak (p = 0.5 of 0.8 s).
    const cheer = at(sam, 'cheer', 0.4, 0.5);
    expect(wristHeadDistance(cheer.skel, cheer.pose, 'R')).toBeCloseTo(0.22934, 4);
    expect(wristHeadDistance(cheer.skel, cheer.pose, 'L')).toBeCloseTo(0.22934, 4);
    const adultCheer = at(adultBase, 'cheer', 0.4, 0.5);
    expect(wristHeadDistance(adultCheer.skel, adultCheer.pose, 'R')).toBeCloseTo(0.47863, 4);
    const heroCheer = at(hero, 'cheer', 0.4, 0.5);
    expect(wristHeadDistance(heroCheer.skel, heroCheer.pose, 'R')).toBeCloseTo(0.27635, 4);
    // Pat holds a teddy bear, so his cheer arms stay down at the rest wrists.
    const patCheer = at(pat, 'cheer', 0.4, 0.5);
    expect(wristHeadDistance(patCheer.skel, patCheer.pose, 'R')).toBeCloseTo(0.18631, 4);
  });
});

describe('per-character hand offset (the opt-in moves the hands out)', () => {
  it('moves the point-up hand outward by the requested clearance', () => {
    const { shape, skel } = realShape(AGE5);
    const run = (opts: { handClearance?: number } | undefined): number => {
      const anims = new Map<string, { pose: (t: number, p: number) => Record<string, { rotate?: readonly [number, number, number] }> }>();
      const k = { animation(n: string, a: never) { anims.set(n, a); } };
      (sproutGestures as (k: never, h: never, p: never, o?: unknown) => void)(
        k as never, shape as never, AGE5 as never, opts,
      );
      return wristHeadDistance(skel, anims.get('gesture-point-up')!.pose(1.0, 0.5), 'R');
    };
    const base = run(undefined);
    expect(base).toBeCloseTo(0.21599, 4);
    const moved = run({ handClearance: CLEARANCE });
    expect(moved - base).toBeGreaterThanOrEqual(CLEARANCE - TOL);
  });

  it('moves the picture-sway hands outward by the requested clearance', () => {
    const { shape, skel } = realShape(AGE5);
    const run = (opts: { handClearance?: number } | undefined): { R: number; L: number } => {
      const anims = new Map<string, { pose: (t: number, p: number) => Record<string, { rotate?: readonly [number, number, number] }> }>();
      const k = { animation(n: string, a: never) { anims.set(n, a); } };
      (sproutGestures as (k: never, h: never, p: never, o?: unknown) => void)(
        k as never, shape as never, AGE5 as never, opts,
      );
      const pose = anims.get('picture-sway')!.pose(1.0, 0.5);
      return { R: wristHeadDistance(skel, pose, 'R'), L: wristHeadDistance(skel, pose, 'L') };
    };
    const base = run(undefined);
    expect(base.R).toBeCloseTo(0.223, 4);
    const moved = run({ handClearance: CLEARANCE });
    expect(moved.R - base.R).toBeGreaterThanOrEqual(CLEARANCE - TOL);
    expect(moved.L - base.L).toBeGreaterThanOrEqual(CLEARANCE - TOL);
  });

  it('leaves the other 24 sprout clips identical with the option', () => {
    const { shape } = realShape(AGE5);
    const run = (opts: { handClearance?: number } | undefined): Map<string, string> => {
      const anims = new Map<string, { duration: number; pose: (t: number, p: number) => unknown }>();
      const k = { animation(n: string, a: never) { anims.set(n, a); } };
      (sproutGestures as (k: never, h: never, p: never, o?: unknown) => void)(
        k as never, shape as never, AGE5 as never, opts,
      );
      const out = new Map<string, string>();
      for (const [name, a] of anims) {
        const parts: string[] = [];
        for (const ph of [0, 0.25, 0.5, 0.75])
          parts.push(JSON.stringify(roundJson(a.pose(ph * a.duration, ph))));
        out.set(name, parts.join('|'));
      }
      return out;
    };
    const base = run(undefined);
    const moved = run({ handClearance: CLEARANCE });
    expect([...base.keys()].sort()).toEqual([...SPROUT_CLIPS].sort());
    for (const name of SPROUT_CLIPS) {
      if (MOVED_SPROUT.has(name)) continue;
      expect(moved.get(name), name).toBe(base.get(name));
    }
  });

  it('moves the cheer fists outward by the requested clearance on the kind path', () => {
    // The exact place of the option: `kind.handClearance` on the object passed to
    // `humanoidAsset` (read for the `cheer` wrist goal in humanoid-kind.ts).
    const run = (withOpt: boolean): { skel: Captured['skel']; anims: Captured['anims'] } => {
      const kind = lilyLikeKind(undefined);
      const withClearance = { ...kind, handClearance: CLEARANCE } as unknown as HumanoidKind;
      return capture(humanoidAsset(withOpt ? withClearance : kind));
    };
    const base = run(false);
    const moved = run(true);
    const basePose = base.anims.get('cheer')!.pose(0.4, 0.5) as Record<string, { rotate?: readonly [number, number, number] }>;
    const movedPose = moved.anims.get('cheer')!.pose(0.4, 0.5) as Record<string, { rotate?: readonly [number, number, number] }>;
    expect(wristHeadDistance(base.skel, basePose, 'R')).toBeCloseTo(0.22934, 4);
    expect(wristHeadDistance(moved.skel, movedPose, 'R') - wristHeadDistance(base.skel, basePose, 'R')).toBeGreaterThanOrEqual(CLEARANCE - TOL);
    expect(wristHeadDistance(moved.skel, movedPose, 'L') - wristHeadDistance(base.skel, basePose, 'L')).toBeGreaterThanOrEqual(CLEARANCE - TOL);
  });

  it('leaves the other 7 base clips identical with the kind option', () => {
    const kind = lilyLikeKind(undefined);
    const withClearance = { ...kind, handClearance: CLEARANCE } as unknown as HumanoidKind;
    const base = capture(humanoidAsset(kind));
    const moved = capture(humanoidAsset(withClearance));
    const snap = (c: Captured): Map<string, string> => {
      const out = new Map<string, string>();
      for (const [name, a] of c.anims) {
        if (MOVED_BASE.has(name)) continue;
        const parts: string[] = [];
        for (const ph of [0, 0.25, 0.5, 0.75])
          parts.push(JSON.stringify(roundJson(a.pose(ph * (a.duration as number), ph))));
        out.set(name, parts.join('|'));
      }
      return out;
    };
    expect(snap(moved)).toEqual(snap(base));
  });
});
