/**
 * The song page: the classroom (or another `scenes/maps` room) with the Sprout cast standing on
 * the rug and playing their clips on a timeline (`src/song/timeline.ts`). The recorder
 * (`scripts/song-record.ts`) loads a timeline and steps through frames with `window.__song.seek(t)`.
 *
 *   song.html?portrait            a 9:16 canvas (the viewport decides the size; the camera follows)
 *   song.html?t=12                a browser look at one moment after `load`
 *
 * Lighting and placement follow the scene page (`src/scene/main.ts`, the bright interior set), so
 * a render matches `classroom.png` of the week 1 set.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import type { Place } from '../../scenes/chibi-quest.js';
import { blinkAt, cameraAt, cameraWorld, mixAt, mouthAt, placeAt, RUG, SING_OUT, type ActorTrack, type Timeline } from './timeline.js';
import '../scene/hamlet.css';

const MAPS = import.meta.glob('../../scenes/maps/*.ts') as Record<string, () => Promise<{ places: () => Place[] }>>;
const FLAT = new Set(['floor', 'floor-cracked', 'wood-floor', 'rug']);

const params = new URLSearchParams(location.search);
const portrait = params.has('portrait');

const root = document.createElement('div');
root.className = 'hamlet';
root.innerHTML = '<canvas></canvas>';
document.body.append(root);
const canvas = root.querySelector('canvas')!;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f4ead8');
const camera = new THREE.PerspectiveCamera(32, 1, 0.2, 120);

// The bright interior set of the scene page: a warm hemisphere and a high sun from the camera side.
scene.add(new THREE.HemisphereLight(0xfff0dc, 0xc9a77c, 1.6));
const sun = new THREE.DirectionalLight(0xffd9a8, 2.6);
sun.position.set(0, 30, 22);
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
const cache = new Map<string, Promise<{ scene: THREE.Object3D; animations: THREE.AnimationClip[] } | null>>();

function loadAsset(name: string): Promise<{ scene: THREE.Object3D; animations: THREE.AnimationClip[] } | null> {
  let hit = cache.get(name);
  if (!hit) {
    hit = fetch(`/out/${name}/${name}.glb`).then(async (res) => {
      if (!res.ok) return null;
      const gltf = await loader.parseAsync(await res.arrayBuffer(), '');
      return { scene: gltf.scene, animations: gltf.animations };
    });
    cache.set(name, hit);
  }
  return hit;
}

function addPlace(source: THREE.Object3D, place: Place): void {
  let skinned = false;
  source.traverse((node) => {
    if ((node as THREE.SkinnedMesh).isSkinnedMesh) skinned = true;
  });
  const object = skinned ? skeletonClone(source) : source.clone(true);
  object.position.set(place.at[0], place.at[1], place.at[2]);
  object.rotation.y = THREE.MathUtils.degToRad(place.yaw ?? 0);
  if (place.scale !== undefined && place.scale !== 1) object.scale.setScalar(place.scale);
  const flat = FLAT.has(place.asset);
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = !flat;
    node.receiveShadow = true;
  });
  scene.add(object);
}

const roomGroup = new THREE.Group();
scene.add(roomGroup);
let roomName: string | null = null;

async function buildRoom(name: string): Promise<string[]> {
  if (roomName === name) return [];
  roomGroup.clear();
  const map = MAPS[`../../scenes/maps/${name}.ts`];
  if (!map) throw new Error(`song: no scene map "${name}"`);
  const places = (await map()).places();
  const names = [...new Set(places.map((p) => p.asset))];
  const loaded = await Promise.all(names.map(async (n) => [n, await loadAsset(n)] as const));
  const sources = new Map(loaded);
  const missing = new Set<string>();
  for (const place of places) {
    const source = sources.get(place.asset);
    if (!source) {
      missing.add(place.asset);
      continue;
    }
    addPlace(source.scene, place);
  }
  roomName = name;
  return [...missing].sort();
}

// ---------------------------------------------------------------- actors
interface Live {
  track: ActorTrack;
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  durations: Map<string, number>;
  /** The singing face bones (`sing: true` on the kind) and their rest z. */
  mouth: { bone: THREE.Object3D; z: number } | null;
  eyelids: { bone: THREE.Object3D; z: number } | null;
  seed: number;
}
const lives: Live[] = [];
const actorGroup = new THREE.Group();
scene.add(actorGroup);

async function makeActor(track: ActorTrack): Promise<string[]> {
  const gltf = await loadAsset(track.asset);
  if (!gltf) throw new Error(`song: missing out/${track.asset}/${track.asset}.glb (build it first)`);
  const model = skeletonClone(gltf.scene);
  model.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
    node.frustumCulled = false; // skinned bounds do not follow the pose
  });
  const root = new THREE.Group();
  root.add(model);
  actorGroup.add(root);
  const mixer = new THREE.AnimationMixer(model);
  const actions = new Map<string, THREE.AnimationAction>();
  const durations = new Map<string, number>();
  for (const clip of gltf.animations) {
    const action = mixer.clipAction(clip);
    action.play();
    action.enabled = false;
    actions.set(clip.name, action);
    durations.set(clip.name, clip.duration);
  }
  const missing = [...new Set(track.cues.map((c) => c.clip))].filter((c) => !actions.has(c));
  const faceBone = (name: string): { bone: THREE.Object3D; z: number } | null => {
    const bone = model.getObjectByName(name);
    return bone ? { bone, z: bone.position.z } : null;
  };
  const mouth = faceBone('mouth');
  const eyelids = faceBone('eyelids');
  lives.push({ track, root, mixer, actions, durations, mouth, eyelids, seed: lives.length + 1 });
  const notes = missing.map((c) => `${track.id} (${track.asset}) has no clip "${c}": idle`);
  if (!mouth && track.sings.length) notes.push(`${track.id} (${track.asset}) has no mouth bone: the mouth stays painted`);
  return notes;
}

function poseActor(live: Live, t: number): void {
  const { x, z, yaw } = placeAt(live.track.path, t);
  live.root.position.set(RUG[0] + x, RUG[1], RUG[2] + z);
  live.root.rotation.y = THREE.MathUtils.degToRad(yaw);
  for (const a of live.actions.values()) {
    a.enabled = false;
    a.setEffectiveWeight(0);
  }
  const mix = mixAt(live.track.cues, t);
  const play = (clip: string, start: number, w: number): void => {
    const name = live.actions.has(clip) ? clip : 'idle';
    const a = live.actions.get(name);
    if (!a) return;
    const d = live.durations.get(name) ?? 1;
    a.enabled = true;
    a.setEffectiveWeight(Math.max(a.getEffectiveWeight(), w));
    a.time = ((t - start) % d + d) % d;
  };
  play(mix.clip, mix.start, mix.w);
  if (mix.prev) play(mix.prev.clip, mix.prev.start, 1 - mix.w);
  live.mixer.update(0);
  // The singing face: no clip poses these bones, so the page sets them after the mixer.
  if (live.mouth) {
    const open = mouthAt(live.track.sings, t);
    live.mouth.bone.position.z = live.mouth.z + SING_OUT * open;
    live.mouth.bone.scale.set(1, 0.3 + 0.7 * open, 1);
  }
  if (live.eyelids) live.eyelids.bone.position.z = live.eyelids.z + SING_OUT * blinkAt(live.seed, t);
}

// ---------------------------------------------------------------- the timeline
let timeline: Timeline | null = null;
const look = new THREE.Vector3();

function resize(): void {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  if (canvas.width !== width || canvas.height !== height) renderer.setSize(width, height, false);
  if (camera.aspect !== width / height) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function seek(t: number): void {
  if (!timeline) return;
  resize();
  const c = cameraAt(portrait ? timeline.cameraPortrait : timeline.camera, t);
  const { eye, target, fov } = cameraWorld(c);
  camera.position.set(eye[0], eye[1], eye[2]);
  look.set(target[0], target[1], target[2]);
  camera.lookAt(look);
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  for (const live of lives) poseActor(live, t);
  renderer.render(scene, camera);
}

async function load(tl: Timeline): Promise<string[]> {
  const notes: string[] = [];
  const missingRoom = await buildRoom(tl.scene);
  if (missingRoom.length) notes.push(`room pieces missing: ${missingRoom.join(', ')}`);
  for (const live of lives) actorGroup.remove(live.root);
  lives.length = 0;
  for (const track of tl.actors) notes.push(...(await makeActor(track)));
  timeline = tl;
  seek(Number(params.get('t') ?? 0));
  return notes;
}

declare global {
  interface Window {
    __song?: { ready: boolean; portrait: boolean; load: (tl: Timeline) => Promise<string[]>; seek: (t: number) => void };
  }
}

resize();
window.__song = { ready: true, portrait, load, seek };
