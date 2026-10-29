/**
 * Adversarial hardness for the track "fill every empty shelf in the games and
 * scene maps". Owner: measure-adversarial-testing. This file is separate from
 * the Red check (`filled-shelves.test.ts`) and freezes two faults the Red
 * check and the pack tests let through on 2026-10-29:
 *
 * - M1: remove one bottle placement from a potion-rush shelf. Row F2 only
 *   fails on an empty shelf, so the shelf keeps 7 items and F2 passes.
 *   This test fails when any shelf fill shrinks below its accepted count.
 * - M5: empty `library-furniture` in the `MODEL_PACKS` source.
 *   `pack-bindings.test.ts` reads the built `pack.json` files on disk, not
 *   the source constant, so all 59 of its tests pass while the source lies.
 *   This test fails when the source no longer binds `bookcase` for a game
 *   whose manifest requires it.
 *
 * Each test passes on the clean tree and fails under its fault. No WebGL,
 * no network, no file write. The potion-rush view runs against a recording
 * stub, the same shape the Red check uses.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Timeline } from '../../src/apk3d/stage/timeline.js';
import type { Stage3D } from '../../src/apk3d/stage/index.js';
import { buildShop } from '../../src/games/potion-rush/view/shop.js';
import { GAME_LOADS, MODEL_PACKS } from '../../src/apk3d/contracts/model-pack.js';
import { manifest as enchantedLibrary } from '../../src/games/enchanted-library/manifest.js';
import { manifest as hauntedLibrary } from '../../src/games/haunted-library/manifest.js';

interface P {
  asset: string;
  at: readonly [number, number, number];
}

const PLACED = '__advPlacedName';

/** Runs the potion-rush view against a recording stub and returns every placement. */
function recordShop(): P[] {
  const placements: P[] = [];
  const scene = new THREE.Scene();

  const realAdd = scene.add.bind(scene);
  (scene as unknown as { add: typeof realAdd }).add = (obj: THREE.Object3D, ...rest: THREE.Object3D[]) => {
    const name = (obj.userData as Record<string, unknown>)[PLACED] as string | undefined;
    if (name) {
      placements.push({ asset: name, at: [obj.position.x, obj.position.y, obj.position.z] });
    }
    return realAdd(obj, ...rest);
  };

  const loader = {
    modelPath: (name: string): string => `models/${name}.glb`,
    get: (path: string): unknown => {
      const name = path.replace(/^models\//, '').replace(/\.glb$/, '');
      const g = new THREE.Group();
      (g.userData as Record<string, unknown>)[PLACED] = name;
      return { scene: g, animations: [] };
    },
  };

  const timeline = new Timeline();
  const stage = {
    scene,
    loader,
    addSun: (): THREE.DirectionalLight => new THREE.DirectionalLight(),
    onFrame: (): (() => void) => () => undefined,
    timeline,
    addActor: (actor: unknown): unknown => actor,
  } as unknown as Stage3D;

  // A fake document with a canvas and a no-op 2D context, needed by potion-rush.
  const ctx = {
    fillStyle: '', strokeStyle: '', lineWidth: 1,
    fillRect: () => undefined, beginPath: () => undefined, arc: () => undefined,
    moveTo: () => undefined, lineTo: () => undefined, closePath: () => undefined, stroke: () => undefined,
  } as unknown as CanvasRenderingContext2D;
  const canvas = {
    width: 256, height: 32,
    getContext: (): CanvasRenderingContext2D => ctx,
    getBoundingClientRect: (): DOMRect => ({ x: 0, y: 0, width: 300, height: 300, left: 0, top: 0, right: 300, bottom: 300, toJSON: () => ({}) }) as unknown as DOMRect,
  } as unknown as HTMLCanvasElement;
  (globalThis as { document?: unknown }).document = {
    createElement: (tag: string): unknown => (tag === 'canvas' ? canvas : { style: {}, getContext: () => ctx }),
  };

  buildShop(stage, '');
  return placements;
}

/** Every model the `MODEL_PACKS` source binds for a game (packs plus direct models). */
function sourcePackModels(game: string): Set<string> {
  const load = GAME_LOADS[game]!;
  const held = new Set<string>();
  for (const id of load.packs ?? []) for (const m of MODEL_PACKS[id] ?? []) held.add(m);
  for (const m of load.models ?? []) held.add(m);
  return held;
}

describe('filled-shelves adversarial hardness', () => {
  it('M1: each potion-rush shelf keeps its full fill (6 bottles, bread, apple)', () => {
    const rows = recordShop();
    const shelves = rows.filter((r) => r.asset === 'shelf');
    const problems: string[] = [];
    if (shelves.length !== 2) problems.push(`shelf count ${shelves.length} != 2`);
    for (const s of shelves) {
      const held = rows.filter((r) =>
        r.asset !== 'shelf' && r.at[1] > 0 &&
        Math.abs(r.at[0] - s.at[0]) <= 0.65 + 0.01 &&
        r.at[2] - s.at[2] >= -0.01 && r.at[2] - s.at[2] <= 0.3 + 0.01);
      if (held.length < 8) problems.push(`shelf at [${s.at[0]}, 0, ${s.at[2]}] holds ${held.length} items, want at least 8`);
    }
    const bottles = rows.filter((r) => r.asset === 'bottle').length;
    if (bottles < 12) problems.push(`bottle count ${bottles} < 12`);
    expect(problems, `potion-rush fill shrank:\n${problems.join('\n')}`).toEqual([]);
  });

  it('M5: the MODEL_PACKS source binds bookcase for both library games', () => {
    const games = { 'enchanted-library': enchantedLibrary, 'haunted-library': hauntedLibrary };
    const problems: string[] = [];
    for (const [game, manifest] of Object.entries(games)) {
      if (!manifest.requiredModelBindings.includes('bookcase')) {
        problems.push(`${game}: manifest no longer requires bookcase`);
      } else if (!sourcePackModels(game).has('bookcase')) {
        problems.push(`${game}: MODEL_PACKS source binds no bookcase`);
      }
    }
    expect(problems, `source pack gap:\n${problems.join('\n')}`).toEqual([]);
  });
});
