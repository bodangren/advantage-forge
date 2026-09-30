/**
 * The battlefield: an open valley, about 90 m by 60 m. The heroes' camp and hamlet lie west,
 * the horde's ruins and graves lie east, and a banner stands beside the battle line.
 * Coordinates: +X east, +Z south, meters; y comes from ground().
 */
import { ground, type V3 } from './army.js';

export interface Place {
  asset: string;
  at: V3;
  yaw?: number;
  scale?: number;
  /** Only in the aftermath (the knocked-over banner) or only before it. */
  when?: 'before' | 'after';
  /** Roll in degrees (a fallen banner lies on its side). */
  roll?: number;
}

export const BANNER: V3 = [0, 0, -9.5];

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fieldPlaces(): Place[] {
  const rand = rng(4242);
  const out: Place[] = [];
  const put = (asset: string, x: number, z: number, yaw?: number, scale?: number, extra: Partial<Place> = {}): void => {
    out.push({ asset, at: [x, ground(x, z), z], yaw: yaw ?? rand() * 360, ...(scale ? { scale } : {}), ...extra });
  };

  // ---- the center: the banner and a few stones and flowers around it
  put('banner', BANNER[0], BANNER[2], 10, 1.25, { when: 'before' });
  put('banner', BANNER[0] + 0.6, BANNER[2] + 0.4, 100, 1.25, { when: 'after', roll: 82 });
  put('rock-cluster', 2.6, -10.8);
  put('boulder', -3.8, -11.2, 30);
  for (let i = 0; i < 7; i++) put(i % 2 ? 'wildflowers' : 'tall-grass', -2.5 + rand() * 5, -12 + rand() * 4);

  // ---- the heroes' side (west): banners on the hill, tents, a camp, and the hamlet behind
  put('flag', -33, -9.5, 90, 1.2);
  put('flag', -33, 9.5, 90, 1.2);
  put('banner', -29.5, -8.8, 80, 1.1);
  put('banner', -29.5, 8.8, 100, 1.1);
  put('tent', -41, -7, 70);
  put('tent', -43, 6, 110);
  put('tent', -47, -1, 90);
  put('campfire', -39.5, 1.5);
  put('hay-bale', -38, -11);
  put('hay-bale', -39, -12.2);
  put('wagon', -45, -12, 20);
  put('cottage', -57, -13, 80);
  put('cottage', -60, 9, 100);
  put('cottage', -66, -4, 90);
  put('windmill', -64, 17, 120);

  // ---- the horde's side (east): ruins, graves, watchfires, and the dragon's rock
  put('boulder', 39, -3.5, 0, 1.6);
  put('cliff-face', 43.5, -4.5, -90, 1.3);
  put('cliff-face', 45, 3.5, -100, 1.1);
  put('ruin-column', 44, -11);
  put('ruin-column', 47, 9);
  put('ruin-column', 52, -3);
  put('broken-wall', 49, 12, 20);
  put('broken-wall', 51, -13, -30);
  put('obelisk', 48, -7.5);
  put('crypt-chapel', 64, 3, -90);
  put('watchfire', 35.5, -10);
  put('watchfire', 36.5, 10);
  put('watchfire', 46, 0.5);
  for (let i = 0; i < 9; i++) put('gravestone', 40 + rand() * 9, (i % 2 ? 1 : -1) * (11 + rand() * 4));

  // ---- trees along both sides of the valley: green in the west, dead in the east
  for (let i = 0; i < 44; i++) {
    const x = -62 + i * 2.9 + rand() * 2;
    for (const sideZ of [-1, 1]) {
      if (rand() < 0.35) continue;
      const z = sideZ * (17 + rand() * 16);
      const east = x > 12 + rand() * 10;
      const asset = east ? (rand() < 0.65 ? 'dead-tree' : 'pine-tree') : (['oak-tree', 'birch-tree', 'pine-tree', 'oak-tree'] as const)[Math.floor(rand() * 4)]!;
      put(asset, x, z, undefined, 0.9 + rand() * 0.35);
    }
  }
  // ---- small plants and stones along the edges of the charge lane
  for (let i = 0; i < 90; i++) {
    const x = -34 + rand() * 70;
    const z = (rand() < 0.5 ? -1 : 1) * (9.5 + rand() * 8);
    const r = rand();
    const asset = r < 0.35 ? 'tall-grass' : r < 0.55 ? 'wildflowers' : r < 0.7 ? 'bush' : r < 0.8 ? 'fern' : r < 0.9 ? 'rock-cluster' : 'stump';
    put(asset, x, z);
  }
  return out;
}
