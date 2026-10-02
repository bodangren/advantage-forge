import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { chibiQuestPlaces, type Place } from '../../scenes/chibi-quest.js';
import { dungeonCheckPlaces } from '../../scenes/dungeon-check.js';
import { sunkenVaultPlaces } from '../../scenes/sunken-vault.js';

import { oldOakClearingPlaces } from '../../scenes/old-oak-clearing.js';
import { tavernInteriorPlaces } from '../../scenes/tavern-interior.js';
import { villagePlaces } from '../../scenes/village.js';
import { blacksmithShopPlaces } from '../../scenes/blacksmith-shop.js';
import './hamlet.css';

const FLAT = new Set([
  'grass-ground',
  'dirt-ground',
  'dirt-road-straight',
  'dirt-road-corner',
  'dirt-road-t-junction',
  'forest-ground',
  'footpath-straight',
  'footpath-corner',
  'river-straight',
  'river-bend',
  'river-bank',
  'floor',
  'floor-cracked',
]);

const params = new URLSearchParams(location.search);
const sceneName = params.get('scene') ?? 'hamlet';
const dark = sceneName === 'dungeon' || sceneName === 'vault';
// Interior cutaways (roof off, two or three walls standing): a warm room light from the camera
// side, so the standing walls face the light, on a dark backdrop as in the mockups.
const interior = sceneName === 'tavern' || sceneName === 'blacksmith';
const clean = params.has('clean');

const root = document.createElement('div');
root.className = 'hamlet';
root.innerHTML = `
  <canvas></canvas>
  <header class="hud">
    <div>
      <h1>Chibi Quest hamlet</h1>
      <p class="status"></p>
    </div>
    <div class="views">
      <button type="button" data-view="map">Map</button>
      <button type="button" data-view="top">Top</button>
      <button type="button" data-view="south">South</button>
    </div>
  </header>`;
document.body.append(root);
const hud = root.querySelector<HTMLElement>('.hud')!;
if (clean) hud.hidden = true;

const canvas = root.querySelector('canvas')!;
const statusEl = root.querySelector<HTMLElement>('.status')!;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(clean ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const backdrop = dark ? '#0e141d' : interior ? '#16110d' : '#cfe6f4';
scene.background = new THREE.Color(backdrop);
scene.fog = new THREE.Fog(backdrop, dark ? 34 : 42, dark ? 80 : 78);

const camera = new THREE.PerspectiveCamera(32, 1, 0.4, 180);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0.4, 1);
controls.maxPolarAngle = Math.PI * 0.49;
controls.update();

scene.add(
  dark
    ? new THREE.HemisphereLight(0xa9c2ec, 0x1a2433, 0.9)
    : interior
      ? new THREE.HemisphereLight(0xffe4c4, 0x4a3524, 0.9)
      : new THREE.HemisphereLight(0xd7ecff, 0x6d8f45, 0.62),
);
const sun = new THREE.DirectionalLight(dark ? 0xffe2b8 : interior ? 0xffd9a8 : 0xfff3df, dark ? 2.2 : interior ? 2.6 : 2.7);
sun.position.set(...((dark ? [-5, 46, -3] : interior ? [14, 30, 20] : [-22, 32, -14]) as [number, number, number]));
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.left = -26;
sun.shadow.camera.right = 26;
sun.shadow.camera.top = 24;
sun.shadow.camera.bottom = -24;
sun.shadow.camera.near = 8;
sun.shadow.camera.far = 80;
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
sun.target.position.set(0, 0, 2);

const loader = new GLTFLoader();
const cache = new Map<string, THREE.Object3D | null>();

/** Hide small mesh gaps beneath the separate terrain tiles. */
function addTerrainUnderlays(places: readonly Place[]): void {
  const terrain = places.filter((place) => FLAT.has(place.asset));
  if (terrain.length === 0) return;
  const xs = terrain.map((place) => place.at[0]);
  const zs = terrain.map((place) => place.at[2]);
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minZ = Math.min(...zs) - 1;
  const maxZ = Math.max(...zs) + 1;
  const riverBed = new THREE.Mesh(
    new THREE.PlaneGeometry(maxX - minX, 2),
    new THREE.MeshStandardMaterial({ color: 0x257d9e, roughness: 0.9 }),
  );
  riverBed.rotation.x = -Math.PI / 2;
  riverBed.position.set((minX + maxX) / 2, 0.03, 12);
  scene.add(riverBed);
}

async function loadAsset(name: string): Promise<THREE.Object3D | null> {
  const hit = cache.get(name);
  if (hit !== undefined) return hit;
  const res = await fetch(`/out/${name}/${name}.glb`);
  if (!res.ok) {
    cache.set(name, null);
    return null;
  }
  const gltf = await loader.parseAsync(await res.arrayBuffer(), '');
  cache.set(name, gltf.scene);
  return gltf.scene;
}

function addPlace(source: THREE.Object3D, place: Place): void {
  // Skinned rigs need SkeletonUtils.clone: Object3D.clone leaves the skinned
  // mesh bound to the source skeleton, so rigged figures never render.
  let skinned = false;
  source.traverse((node) => {
    if ((node as THREE.SkinnedMesh).isSkinnedMesh) skinned = true;
  });
  const object = skinned ? skeletonClone(source) : source.clone(true);
  object.position.set(place.at[0], place.at[1], place.at[2]);
  object.rotation.y = THREE.MathUtils.degToRad(place.yaw ?? 0);
  if (place.scale !== undefined && place.scale !== 1) object.scale.setScalar(place.scale);
  if (place.asset === 'stepping-stone') {
    object.traverse((node) => {
      if (node instanceof THREE.Mesh && node.name === 'grass') node.visible = false;
    });
  }
  const flat = FLAT.has(place.asset);
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = !flat;
    node.receiveShadow = true;
  });
  scene.add(object);
}

function frame(azimuth: number, elevation: number, distance: number, target: THREE.Vector3): void {
  const az = THREE.MathUtils.degToRad(azimuth);
  const el = THREE.MathUtils.degToRad(elevation);
  camera.position.set(
    target.x + distance * Math.sin(az) * Math.cos(el),
    target.y + distance * Math.sin(el),
    target.z + distance * Math.cos(az) * Math.cos(el),
  );
  controls.target.copy(target);
  controls.update();
}

const target = new THREE.Vector3(0, 0.2, 1);
const views: Record<string, () => void> = {
  map: () => frame(32, 50, 46, target),
  top: () => frame(0, 88, 42, target),
  south: () => frame(0, 18, 28, target),
};

root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
  button.onclick = () => views[button.dataset.view ?? 'map']?.();
});

async function build(): Promise<void> {
  const places =
    sceneName === 'dungeon'
      ? dungeonCheckPlaces()
      : sceneName === 'vault'
        ? sunkenVaultPlaces()
        : sceneName === 'forest'
          ? oldOakClearingPlaces()
          : sceneName === 'tavern'
            ? tavernInteriorPlaces()
            : sceneName === 'village'
              ? villagePlaces()
              : sceneName === 'blacksmith'
                ? blacksmithShopPlaces()
                : chibiQuestPlaces();
  const names = [...new Set(places.map((place) => place.asset))];
  await Promise.all(names.map((name) => loadAsset(name)));
  const missing = new Set<string>();
  let shown = 0;
  for (const place of places) {
    const source = cache.get(place.asset);
    if (!source) {
      if (place.optional) missing.add(place.asset);
      continue;
    }
    addPlace(source, place);
    shown += 1;
  }
  if (sceneName === 'hamlet' || sceneName === 'village') addTerrainUnderlays(places);
  const waiting = [...missing].sort();
  statusEl.textContent =
    waiting.length > 0
      ? `${shown} pieces. Waiting for ${waiting.join(', ')}.`
      : `${shown} pieces.`;
  window.__hamletMissing = waiting;
  window.__hamletReady = true;
}

function resize(): void {
  const rect = canvas.parentElement!.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function tick(): void {
  resize();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

const az = Number(params.get('az') ?? 32);
const el = Number(params.get('el') ?? 50);
const dist = Number(params.get('dist') ?? 46);
frame(az, el, dist, new THREE.Vector3(Number(params.get('tx') ?? 0), 0.2, Number(params.get('tz') ?? 1)));
void build();
tick();

declare global {
  interface Window {
    __hamletReady?: boolean;
    __hamletMissing?: string[];
  }
}
