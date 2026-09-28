/**
 * The 2D bake page (development only; scripts/apk2d-bake.ts drives it): builds a game's static set
 * with the same code as its 3D view, renders it with the 2D camera (orthographic, azimuth 0,
 * elevation E, `ppm` pixels per meter), and returns the PNG and the projection the 2D view uses.
 *
 * The projection: a world point (x, y, z) is at u = x and v = y cos E - z sin E (meters); the image
 * pixel is ((u - uMin) ppm, (vMax - v) ppm). Forge sprites use the same E and ppm, pivot on the
 * ground point, so a sprite drawn at its entity's ground point lines up with the background.
 */
import * as THREE from 'three';
import { Stage3D } from '../src/apk3d/stage/index.js';
import { buildRoom, ROOM_MODELS } from '../src/games/dungeon-liberator/view/room.js';
import { buildClearing, CLEARING_MODELS } from '../src/games/devourer-slime/view/clearing.js';
import { buildChurchyard, CHURCHYARD_MODELS } from '../src/games/hero-vs-zombie/view/churchyard.js';
import { buildShop, SHOP_MODELS } from '../src/games/potion-rush/view/shop.js';
import { buildVaultBackdrop, vaultModels } from '../src/games/monster-encounters/view/battle-stage.js';

interface BakeSet {
  models: string[];
  build(stage: Stage3D): void;
  /** Ground bounds [xMin, xMax, zMin, zMax] in meters. */
  bounds: [number, number, number, number];
}

const SETS: Record<string, BakeSet> = {
  'potion-rush': { models: SHOP_MODELS, build: (s) => void buildShop(s, ''), bounds: [-5.2, 5.2, -3.8, 2.6] },
  'dungeon-liberator': { models: ROOM_MODELS, build: (s) => void buildRoom(s), bounds: [-6.6, 6.6, -5.6, 5.6] },
  'devourer-slime': { models: CLEARING_MODELS, build: buildClearing, bounds: [-9.5, 9.5, -9.5, 9.5] },
  'hero-vs-zombie': { models: CHURCHYARD_MODELS, build: (s) => void buildChurchyard(s), bounds: [-7.8, 7.8, -7.0, 7.8] },
  // The great hall of the vault around the battle (the party south, the monsters north).
  'monster-encounters': { models: vaultModels(), build: buildVaultBackdrop, bounds: [-4.6, 4.6, -2.6, 6.4] },
};

async function bake(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const game = params.get('game') ?? '';
  const E = THREE.MathUtils.degToRad(Number(params.get('el') ?? 45));
  const ppm = Number(params.get('ppm') ?? 64);
  const supersample = 2;
  const set = SETS[game];
  if (!set) throw new Error(`No bake set for ${game}`);
  const canvas = document.getElementById('bake') as HTMLCanvasElement;
  const stage = new Stage3D(canvas, { base: import.meta.env.BASE_URL, tier: 'high' });
  stage.pause();
  await stage.loader.preload(set.models.map((m) => `models/${m}.glb`));
  set.build(stage);
  stage.scene.fog = null;
  stage.scene.updateMatrixWorld(true);

  // The projected extent: the ground bounds, and the tallest objects inside them.
  const [x0, x1, z0, z1] = set.bounds;
  const box = new THREE.Box3().setFromObject(stage.scene);
  const top = Math.min(box.max.y, 6);
  const uMin = x0;
  const uMax = x1;
  const vMax = top * Math.cos(E) - z0 * Math.sin(E);
  const vMin = -z1 * Math.sin(E);
  const width = Math.round((uMax - uMin) * ppm);
  const height = Math.round((vMax - vMin) * ppm);

  const cam = new THREE.OrthographicCamera(uMin, uMax, vMax, vMin, 0.1, 400);
  cam.position.set(0, Math.sin(E) * 150, Math.cos(E) * 150);
  cam.up.set(0, 1, 0);
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix();
  stage.renderer.setPixelRatio(1);
  stage.renderer.setSize(width * supersample, height * supersample, false);
  stage.renderer.render(stage.scene, cam);
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(stage.renderer.domElement, 0, 0, width, height);
  (window as unknown as { __bake: unknown }).__bake = {
    png: out.toDataURL('image/png'),
    projection: { elevation: Number(params.get('el') ?? 45), ppm, uMin, vMax, width, height },
  };
}

bake().catch((e: unknown) => ((window as unknown as { __bakeError: string }).__bakeError = String(e)));
