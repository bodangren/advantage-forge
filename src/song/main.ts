/**
 * The song page: the Sprout cast in a room from `scenes/maps` (the classroom, the meadow), on the
 * timeline of `src/song/timeline.ts`: shots (hard cuts between sets), marks, clips, the singing
 * face, props, and pictures. The recorder (`scripts/song-record.ts`) loads a timeline and steps
 * through frames with `window.__song.seek(t)`.
 *
 *   song.html?portrait            a 9:16 canvas (the viewport decides the size; the camera follows)
 *   song.html?t=12                a browser look at one moment after `load`
 *
 * Lighting follows the scene page (`src/scene/main.ts`): the bright interior set for a classroom
 * shot (a render matches `classroom.png` of the week 1 set), the outdoor set for a meadow shot.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import type { Place } from '../../scenes/chibi-quest.js';
import { blinkAt, cameraAt, cameraWorld, mixAt, mouthAt, placeAt, shotAt, SING_OUT, toWorld, type ActorTrack, type PictureTrack, type PropTrack, type Shot, type Timeline } from './timeline.js';
import '../scene/hamlet.css';

const MAPS = import.meta.glob('../../scenes/maps/*.ts') as Record<string, () => Promise<{ places: () => Place[] }>>;
const FLAT = new Set(['floor', 'floor-cracked', 'wood-floor', 'rug', 'meadow-ground', 'dirt-ground', 'grass-ground', 'sand-ground']);

const params = new URLSearchParams(location.search);
const portrait = params.has('portrait');
/** `?mouthOut=0.05&lidOut=0.04` override the face-bone travel for tuning (the recorder's --query). */
const mouthOut = Number(params.get('mouthOut') ?? SING_OUT.mouth);
const lidOut = Number(params.get('lidOut') ?? SING_OUT.eyelids);

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

// ---------------------------------------------------------------- light
/**
 * The light sets of the scene page: the bright interior (a warm hemisphere, a high sun from the
 * camera side, or `side` from the camera's left for long shadows) and the outdoor set (a sky
 * backdrop, a cool hemisphere, the sun from the front left so the faces stay lit).
 */
const LIGHT = {
  interior: { backdrop: '#f4ead8', sky: 0xfff0dc, ground: 0xc9a77c, hemi: 1.6, sun: 0xffd9a8, power: 2.6, high: [0, 30, 22], side: [-14, 26, 19] },
  outdoor: { backdrop: '#cfe6f4', sky: 0xd7ecff, ground: 0x6d8f45, hemi: 0.62, sun: 0xfff3df, power: 2.7, high: [-18, 32, 16], side: [-18, 32, 16] },
} as const;
const hemi = new THREE.HemisphereLight(0xfff0dc, 0xc9a77c, 1.6);
scene.add(hemi);
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

let lightKey = '';
function applyLight(shot: Shot): void {
  const key = `${shot.light}/${shot.sun}`;
  if (key === lightKey) return;
  lightKey = key;
  const l = LIGHT[shot.light];
  (scene.background as THREE.Color).set(l.backdrop);
  hemi.color.set(l.sky);
  hemi.groundColor.set(l.ground);
  hemi.intensity = l.hemi;
  sun.color.set(l.sun);
  sun.intensity = l.power;
  // The sun offset is in stage space (from the camera side), so a set facing 180 keeps its faces lit.
  const p = l[shot.sun];
  const [sx, sz] = toWorld(shot, p[0], p[2]);
  sun.position.set(sx, shot.origin[1] + p[1], sz);
  const [tx, tz] = toWorld(shot, 0, -1);
  sun.target.position.set(tx, shot.origin[1], tz);
}

// ---------------------------------------------------------------- assets
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

/** A copy of a loaded asset (a skeleton clone when it is skinned), with shadows on. */
function instance(source: THREE.Object3D, flat = false): THREE.Object3D {
  let skinned = false;
  source.traverse((node) => {
    if ((node as THREE.SkinnedMesh).isSkinnedMesh) skinned = true;
  });
  const object = skinned ? skeletonClone(source) : source.clone(true);
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = !flat;
    node.receiveShadow = true;
    if (skinned) node.frustumCulled = false; // skinned bounds do not follow the pose
  });
  return object;
}

// ---------------------------------------------------------------- rooms
const rooms = new Map<string, THREE.Group>();

async function buildRoom(name: string): Promise<string[]> {
  if (rooms.has(name)) return [];
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  rooms.set(name, group);
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
    const object = instance(source.scene, FLAT.has(place.asset));
    object.position.set(place.at[0], place.at[1], place.at[2]);
    object.rotation.y = THREE.MathUtils.degToRad(place.yaw ?? 0);
    if (place.scale !== undefined && place.scale !== 1) object.scale.setScalar(place.scale);
    group.add(object);
  }
  return [...missing].sort();
}

// ---------------------------------------------------------------- actors
interface Live {
  track: ActorTrack;
  root: THREE.Group;
  model: THREE.Object3D;
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
  const model = instance(gltf.scene);
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
  lives.push({ track, root, model, mixer, actions, durations, mouth, eyelids, seed: lives.length + 1 });
  const notes = missing.map((c) => `${track.id} (${track.asset}) has no clip "${c}": idle`);
  if (!mouth && track.sings.length) notes.push(`${track.id} (${track.asset}) has no mouth bone: the mouth stays painted`);
  return notes;
}

function poseActor(live: Live, shot: Shot, t: number): void {
  const { x, z, yaw } = placeAt(live.track.path, t);
  const [wx, wz] = toWorld(shot, x, z);
  live.root.position.set(wx, shot.origin[1], wz);
  live.root.rotation.y = THREE.MathUtils.degToRad(yaw + shot.heading);
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
    live.mouth.bone.position.z = live.mouth.z + mouthOut * open;
    live.mouth.bone.scale.set(1, 0.3 + 0.7 * open, 1);
  }
  if (live.eyelids) live.eyelids.bone.position.z = live.eyelids.z + lidOut * blinkAt(live.seed, t);
}

// ---------------------------------------------------------------- props and pictures
interface LiveProp {
  shot: Shot;
  track: PropTrack;
  object: THREE.Object3D;
  mixer: THREE.AnimationMixer | null;
  action: THREE.AnimationAction | null;
  duration: number;
}
const props: LiveProp[] = [];
const propGroup = new THREE.Group();
scene.add(propGroup);

async function makeProp(shot: Shot, track: PropTrack): Promise<string[]> {
  const gltf = await loadAsset(track.asset);
  if (!gltf) return [`prop ${track.asset}: missing out/${track.asset}/${track.asset}.glb, skipped`];
  const object = instance(gltf.scene);
  object.visible = false;
  const notes: string[] = [];
  const held = track.held ? lives.find((l) => l.track.id === track.held!.actor) : undefined;
  if (track.held && !held) notes.push(`prop ${track.asset}: no actor ${track.held.actor} in the scene; placed on the ground`);
  if (held && track.held) {
    // The GLTF loader strips dots from node names (`hand.R` is `handR` in the page).
    const names = [track.held.bone, `hand.${track.held.hand}`, 'jaw', 'head'].filter((n): n is string => !!n);
    const bone = names.map((n) => held.model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(n))).find((b) => b);
    if (!bone) notes.push(`prop ${track.asset}: ${held.track.id} has none of the bones ${names.join(', ')}; placed on the ground`);
    else {
      if (bone.name !== THREE.PropertyBinding.sanitizeNodeName(names[0]!)) notes.push(`prop ${track.asset}: ${held.track.id} holds it on the ${bone.name} bone`);
      bone.add(object);
      const [ox, oy, oz] = track.held.offset;
      const [rx, ry, rz] = track.held.rotate;
      object.position.set(ox, oy, oz);
      object.rotation.set(THREE.MathUtils.degToRad(rx), THREE.MathUtils.degToRad(ry), THREE.MathUtils.degToRad(rz));
    }
  }
  if (!object.parent) {
    propGroup.add(object);
    const [wx, wz] = toWorld(shot, track.x, track.z);
    object.position.set(wx, shot.origin[1] + track.y, wz);
    object.rotation.y = THREE.MathUtils.degToRad(track.yaw + shot.heading);
  }
  object.scale.setScalar(track.scale);
  let mixer: THREE.AnimationMixer | null = null;
  let action: THREE.AnimationAction | null = null;
  let duration = 1;
  const clipName = track.clip ?? 'idle';
  const clip = gltf.animations.find((c) => c.name === clipName);
  if (clip) {
    mixer = new THREE.AnimationMixer(object);
    action = mixer.clipAction(clip);
    action.play();
    duration = clip.duration;
  } else if (track.clip) notes.push(`prop ${track.asset}: no clip "${track.clip}", still`);
  props.push({ shot, track, object, mixer, action, duration });
  return notes;
}

function poseProp(p: LiveProp, shot: Shot, t: number): void {
  const on = p.shot === shot && t >= p.track.from && t < p.track.to;
  p.object.visible = on;
  if (!on || !p.mixer || !p.action) return;
  p.action.time = ((t - p.track.from) % p.duration + p.duration) % p.duration;
  p.mixer.update(0);
}

interface LivePicture {
  shot: Shot;
  track: PictureTrack;
  object: THREE.Object3D;
}
const pictures: LivePicture[] = [];
const textures = new Map<string, Promise<THREE.Texture | null>>();

function loadTexture(file: string): Promise<THREE.Texture | null> {
  let hit = textures.get(file);
  if (!hit) {
    hit = new Promise((resolve) => {
      new THREE.TextureLoader().load(
        `/stage/${file.split('/').map(encodeURIComponent).join('/')}`,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          resolve(tex);
        },
        undefined,
        () => resolve(null),
      );
    });
    textures.set(file, hit);
  }
  return hit;
}

async function makePicture(shot: Shot, track: PictureTrack): Promise<string[]> {
  const tex = await loadTexture(track.file);
  if (!tex) return [`picture ${track.file}: not found next to the stage file, skipped`];
  const image = tex.image as { width: number; height: number };
  const w = track.w;
  const h = track.h ?? (w * image.height) / image.width;
  const object = new THREE.Group();
  const material = track.unlit
    ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.02 })
    : new THREE.MeshStandardMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, roughness: 0.9, metalness: 0, alphaTest: 0.02 });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  sheet.castShadow = !track.unlit;
  sheet.receiveShadow = !track.unlit;
  object.add(sheet);
  if (track.card) {
    const pad = 0.035 * w;
    const card = new THREE.Mesh(new THREE.PlaneGeometry(w + 2 * pad, h + 2 * pad), new THREE.MeshStandardMaterial({ color: '#fbf8f0', roughness: 0.85, side: THREE.DoubleSide }));
    card.position.z = -0.004;
    card.castShadow = true;
    card.receiveShadow = true;
    const border = new THREE.Mesh(new THREE.PlaneGeometry(w + 2 * pad + 0.012, h + 2 * pad + 0.012), new THREE.MeshStandardMaterial({ color: '#5a4636', roughness: 0.8, side: THREE.DoubleSide }));
    border.position.z = -0.008;
    border.castShadow = true;
    object.add(card, border);
  }
  const [wx, wz] = toWorld(shot, track.x, track.z);
  object.position.set(wx, shot.origin[1] + track.y, wz);
  object.rotation.y = THREE.MathUtils.degToRad(track.yaw + shot.heading);
  object.visible = false;
  propGroup.add(object);
  pictures.push({ shot, track, object });
  return [];
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
  const shot = shotAt(timeline, t);
  for (const [name, group] of rooms) group.visible = name === shot.map;
  applyLight(shot);
  const c = cameraAt(portrait ? shot.cameraPortrait : shot.camera, t);
  const { eye, target, fov } = cameraWorld(c, shot);
  camera.position.set(eye[0], eye[1], eye[2]);
  look.set(target[0], target[1], target[2]);
  camera.lookAt(look);
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  for (const live of lives) poseActor(live, shot, t);
  for (const p of props) poseProp(p, shot, t);
  for (const p of pictures) p.object.visible = p.shot === shot && t >= p.track.from && t < p.track.to;
  renderer.render(scene, camera);
}

async function load(tl: Timeline): Promise<string[]> {
  const notes: string[] = [];
  for (const name of tl.maps) {
    const missingRoom = await buildRoom(name);
    if (missingRoom.length) notes.push(`room ${name}: pieces missing: ${missingRoom.join(', ')}`);
  }
  for (const live of lives) actorGroup.remove(live.root);
  lives.length = 0;
  propGroup.clear();
  props.length = 0;
  pictures.length = 0;
  for (const track of tl.actors) notes.push(...(await makeActor(track)));
  for (const shot of tl.shots) {
    for (const p of shot.props) notes.push(...(await makeProp(shot, p)));
    for (const p of shot.pictures) notes.push(...(await makePicture(shot, p)));
  }
  timeline = tl;
  lightKey = '';
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
