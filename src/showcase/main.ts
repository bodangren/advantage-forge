/**
 * Chibi Quest showcase: a scripted, cinematic tour of the three sample maps with the whole cast.
 *
 *   showcase.html            loads everything, then shows t = 0 (or ?t=seconds)
 *   showcase.html?play       plays in real time with the soundtrack and a scrub bar
 *   window.__showcase.seek(t) renders one exact moment (the recorder steps through frames)
 *
 * Every moment is a pure function of t, so a recording is frame-exact and repeatable.
 */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { chibiQuestPlaces, type Place } from '../../scenes/chibi-quest.js';
import { oldOakClearingPlaces } from '../../scenes/old-oak-clearing.js';
import { sunkenVaultPlaces } from '../../scenes/sunken-vault.js';
import { tour } from './script.js';
import type { Actor, Caption, Mood, SetName, Shot, V3 } from './types.js';
import './showcase.css';

const SET_OFFSET: Record<SetName, V3> = { hamlet: [0, 0, 0], forest: [140, 0, 0], vault: [280, 0, 0] };

/** Ground tiles: they receive shadows but do not cast them. */
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
  'walkway',
]);

/** The maps place a few static characters; the tour places and animates its own cast. */
const CAST = new Set(tour.actors.map((a) => a.asset));
const MAP_CHARACTERS = new Set(['adventurer', 'druid', 'skeleton', ...CAST]);

const params = new URLSearchParams(location.search);
const playMode = params.has('play');

// ---------------------------------------------------------------- page
const root = document.createElement('div');
root.className = 'showcase';
root.innerHTML = `
  <canvas></canvas>
  <div class="overlay"></div>
  <div class="fade"></div>
  <div class="loading"><div class="loading-title">Chibi Quest</div><div class="loading-bar"><i></i></div></div>
  <div class="controls" hidden>
    <button type="button" class="play">Play</button>
    <input type="range" min="0" step="0.01" value="0" />
    <span class="clock">0:00</span>
  </div>`;
document.body.append(root);
const canvas = root.querySelector('canvas')!;
const overlay = root.querySelector<HTMLElement>('.overlay')!;
const fadeEl = root.querySelector<HTMLElement>('.fade')!;
const loadingEl = root.querySelector<HTMLElement>('.loading')!;
const loadingBar = root.querySelector<HTMLElement>('.loading-bar i')!;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(playMode ? Math.min(window.devicePixelRatio, 2) : 1);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 400);
scene.fog = new THREE.Fog('#cfe6f4', 40, 90);

// ---------------------------------------------------------------- lighting moods
const hemi = new THREE.HemisphereLight(0xd7ecff, 0x6d8f45, 0.7);
const sun = new THREE.DirectionalLight(0xfff3df, 2.8);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 5, far: 120 });
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.03;
scene.add(hemi, sun, sun.target);

interface MoodSpec {
  sky: string;
  fog: [number, number];
  hemi: [number, number, number];
  sun: [number, number];
  /** Sun direction (from the target toward the sun). */
  dir: V3;
  exposure: number;
}
const MOODS: Record<Mood, MoodSpec> = {
  day: { sky: '#bfe3f7', fog: [45, 110], hemi: [0xd7ecff, 0x6d8f45, 0.72], sun: [0xfff3df, 2.8], dir: [-0.55, 0.75, -0.35], exposure: 1.05 },
  golden: { sky: '#f6c99a', fog: [40, 100], hemi: [0xffe0c0, 0x6d6a45, 0.62], sun: [0xffc27a, 3.1], dir: [0.75, 0.42, 0.5], exposure: 1.05 },
  dusk: { sky: '#5e3a6e', fog: [30, 90], hemi: [0xb8a2ee, 0x4a3a40, 1.05], sun: [0xffa060, 3.2], dir: [-0.3, 0.5, 0.8], exposure: 1.15 },
  vault: { sky: '#0c1118', fog: [22, 60], hemi: [0x9fb8e8, 0x2a3040, 1.25], sun: [0xc8dcff, 1.1], dir: [-0.25, 1, 0.2], exposure: 1.3 },
};

/** Torch, brazier, and candle lights of the vault (set-local), found from the map. */
const torchLights: { light: THREE.PointLight; base: number; seed: number }[] = [];

// ---------------------------------------------------------------- loading
const loader = new GLTFLoader();
const gltfs = new Map<string, GLTF | null>();
const texLoader = new THREE.TextureLoader();

async function loadGltf(name: string): Promise<GLTF | null> {
  if (gltfs.has(name)) return gltfs.get(name)!;
  const res = await fetch(`/out/${name}/${name}.glb`);
  const gltf = res.ok ? await loader.parseAsync(await res.arrayBuffer(), '') : null;
  gltfs.set(name, gltf);
  return gltf;
}

function isSkinned(obj: THREE.Object3D): boolean {
  let skinned = false;
  obj.traverse((n) => {
    if ((n as THREE.SkinnedMesh).isSkinnedMesh) skinned = true;
  });
  return skinned;
}

const setGroups = {} as Record<SetName, THREE.Group>;

function addPlace(group: THREE.Group, source: THREE.Object3D, place: Place): void {
  const object = isSkinned(source) ? skeletonClone(source) : source.clone(true);
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
  group.add(object);
}

function mapPlaces(set: SetName): Place[] {
  const all = set === 'hamlet' ? chibiQuestPlaces() : set === 'forest' ? oldOakClearingPlaces() : sunkenVaultPlaces();
  return all.filter((p) => !MAP_CHARACTERS.has(p.asset));
}

// ---------------------------------------------------------------- actors
interface Live {
  def: Actor;
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  durations: Map<string, number>;
  /** Materials with a base color map (own copies when the actor changes presets). */
  mapped: { mat: THREE.MeshStandardMaterial; base: THREE.Texture }[];
  preset: string | null;
}
const lives = new Map<string, Live>();
const presetTextures = new Map<string, THREE.Texture>();

async function presetTexture(asset: string, preset: string, like: THREE.Texture): Promise<THREE.Texture> {
  const key = `${asset}/${preset}`;
  const hit = presetTextures.get(key);
  if (hit) return hit;
  const tex = await texLoader.loadAsync(`/out/${asset}/textures/baseColor.${preset}.png`);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = like.wrapS;
  tex.wrapT = like.wrapT;
  tex.channel = like.channel;
  presetTextures.set(key, tex);
  return tex;
}

async function makeActor(def: Actor): Promise<void> {
  const gltf = await loadGltf(def.asset);
  if (!gltf) {
    console.warn(`showcase: missing ${def.asset}`);
    return;
  }
  const model = skeletonClone(gltf.scene);
  const ownMaterials = (def.presets?.length ?? 0) > 0;
  const mapped: Live['mapped'] = [];
  model.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
    node.frustumCulled = false; // skinned bounds do not follow the pose
    if (ownMaterials) node.material = (node.material as THREE.Material).clone();
    const mat = node.material as THREE.MeshStandardMaterial;
    if (mat.map) mapped.push({ mat, base: mat.map });
  });
  const root = new THREE.Group();
  root.add(model);
  if (def.scale) model.scale.setScalar(def.scale);
  setGroups[def.set].add(root);
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
  for (const cue of def.clips)
    if (!actions.has(cue.clip)) console.warn(`showcase: ${def.id} (${def.asset}) has no clip '${cue.clip}'`);
  for (const p of def.presets ?? [])
    if (p.preset && mapped[0]) await presetTexture(def.asset, p.preset, mapped[0].base);
  lives.set(def.id, { def, root, mixer, actions, durations, mapped, preset: null });
}

const smooth = (x: number): number => x * x * (3 - 2 * x);
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

function yawLerp(a: number, b: number, u: number): number {
  let d = ((b - a) % 360 + 540) % 360 - 180;
  return a + d * u;
}

function actorPosition(def: Actor, t: number): { at: V3; yaw: number } {
  const keys = def.path;
  let at: V3 = keys[0]!.at;
  let yaw = keys[0]!.yaw ?? 0;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]!;
    // Yaw turns quickly around the key time.
    if (k.yaw !== undefined) {
      const prev = yaw;
      const u = smooth(clamp01((t - (k.t - 0.18)) / 0.36));
      yaw = i === 0 ? k.yaw : yawLerp(prev, k.yaw, u);
    }
    const next = keys[i + 1];
    if (t <= k.t) {
      at = k.at;
      break;
    }
    if (!next) {
      at = k.at;
      break;
    }
    if (t < next.t) {
      const u = (t - k.t) / (next.t - k.t);
      at = [lerp(k.at[0], next.at[0], u), lerp(k.at[1], next.at[1], u), lerp(k.at[2], next.at[2], u)];
      // A pending yaw of the next key may already start turning.
      if (next.yaw !== undefined) yaw = yawLerp(yaw, next.yaw, smooth(clamp01((t - (next.t - 0.18)) / 0.36)));
      break;
    }
  }
  return { at, yaw };
}

function clipTime(live: Live, cue: Actor['clips'][number], t: number): number {
  const d = live.durations.get(cue.clip) ?? 1;
  const local = (cue.offset ?? 0) + (t - cue.t) * (cue.speed ?? 1);
  return cue.loop ? ((local % d) + d) % d : Math.min(Math.max(local, 0), d - 1e-4);
}

function poseActor(live: Live, t: number): void {
  const def = live.def;
  const visible = t >= def.show[0] && t <= def.show[1];
  live.root.visible = visible;
  if (!visible) return;
  // The root is a child of its set's group, so the position is set-local.
  const { at, yaw } = actorPosition(def, t);
  live.root.position.set(at[0], at[1], at[2]);
  live.root.rotation.y = THREE.MathUtils.degToRad(yaw);
  live.root.scale.setScalar(def.pop ? Math.max(0.001, backOut(clamp01((t - def.show[0]) / 0.35))) : 1);

  for (const a of live.actions.values()) {
    a.enabled = false;
    a.setEffectiveWeight(0);
  }
  const cues = def.clips;
  let ci = -1;
  for (let i = 0; i < cues.length; i++) if (cues[i]!.t <= t) ci = i;
  if (ci < 0) ci = 0;
  const cur = cues[ci];
  if (cur) {
    const blend = 0.22;
    const w = ci > 0 ? smooth(clamp01((t - cur.t) / blend)) : 1;
    const a = live.actions.get(cur.clip);
    if (a) {
      a.enabled = true;
      a.setEffectiveWeight(w);
      a.time = clipTime(live, cur, t);
    }
    const prev = ci > 0 ? cues[ci - 1] : undefined;
    if (prev && w < 1 && prev.clip !== cur.clip) {
      const b = live.actions.get(prev.clip);
      if (b) {
        b.enabled = true;
        b.setEffectiveWeight(1 - w);
        b.time = clipTime(live, prev, t);
      }
    }
  }
  live.mixer.update(0);

  // Color presets.
  let preset: string | null = null;
  for (const p of def.presets ?? []) if (p.t <= t) preset = p.preset;
  if (preset !== live.preset) {
    for (const m of live.mapped) {
      m.mat.map = preset ? (presetTextures.get(`${def.asset}/${preset}`) ?? m.base) : m.base;
      m.mat.needsUpdate = true;
    }
    live.preset = preset;
  }
}

// ---------------------------------------------------------------- camera
function catmull(p0: number, p1: number, p2: number, p3: number, u: number): number {
  const u2 = u * u;
  const u3 = u2 * u;
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
}

function curve(points: V3[], i: number, u: number): V3 {
  const p1 = points[i]!;
  const p2 = points[i + 1] ?? p1;
  const p0 = points[i - 1] ?? p1;
  const p3 = points[i + 2] ?? p2;
  return [catmull(p0[0], p1[0], p2[0], p3[0], u), catmull(p0[1], p1[1], p2[1], p3[1], u), catmull(p0[2], p1[2], p2[2], p3[2], u)];
}

function shotAt(t: number): Shot {
  let shot = tour.shots[0]!;
  for (const s of tour.shots) if (s.start <= t) shot = s;
  return shot;
}

function cameraFor(shot: Shot, t: number): { pos: V3; look: V3; fov: number } {
  const keys = shot.keys;
  if (keys.length === 1 || t <= keys[0]!.t) {
    const k = keys[0]!;
    return { pos: k.pos, look: k.look, fov: k.fov ?? 38 };
  }
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1]!.t) i++;
  const a = keys[i]!;
  const b = keys[i + 1]!;
  let u = clamp01((t - a.t) / (b.t - a.t));
  // Ease into the first key and out of the last one.
  const first = i === 0;
  const last = i === keys.length - 2;
  if (first && last) u = smooth(u);
  else if (first) u = u * u * (2 - u);
  else if (last) u = 1 - (1 - u) * (1 - u) * (1 + u);
  const pos = curve(keys.map((k) => k.pos), i, u);
  const look = curve(keys.map((k) => k.look), i, u);
  return { pos, look, fov: lerp(a.fov ?? 38, b.fov ?? 38, u) };
}

function shakeAt(shot: Shot, t: number): number {
  const s = shot.shake;
  if (!s || s.length === 0) return 0;
  for (let i = 0; i < s.length - 1; i++) {
    const [t0, v0] = s[i]!;
    const [t1, v1] = s[i + 1]!;
    if (t >= t0 && t <= t1) return lerp(v0, v1, (t - t0) / (t1 - t0));
  }
  return 0;
}

let activeMood: Mood | null = null;
function applyMood(mood: Mood, look: THREE.Vector3): void {
  const m = MOODS[mood];
  if (mood !== activeMood) {
    scene.background = new THREE.Color(m.sky);
    (scene.fog as THREE.Fog).color.set(m.sky);
    hemi.color.set(m.hemi[0]);
    hemi.groundColor.set(m.hemi[1]);
    hemi.intensity = m.hemi[2];
    sun.color.set(m.sun[0]);
    sun.intensity = m.sun[1];
    renderer.toneMappingExposure = m.exposure;
    activeMood = mood;
  }
  (scene.fog as THREE.Fog).near = m.fog[0];
  (scene.fog as THREE.Fog).far = m.fog[1];
  const d = new THREE.Vector3(...m.dir).normalize();
  sun.target.position.copy(look);
  sun.position.copy(look).addScaledVector(d, 50);
}

// ---------------------------------------------------------------- overlay
interface CapEl {
  cap: Caption;
  el: HTMLElement;
}
const capEls: CapEl[] = [];

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function buildOverlay(): void {
  for (const cap of tour.captions) {
    const el = document.createElement('div');
    el.className = `cap cap-${cap.kind}`;
    if (cap.color) el.style.setProperty('--accent', cap.color);
    if (cap.top !== undefined) el.style.top = `${cap.top}%`;
    const text = escapeHtml(cap.text).replace(/\n/g, '<br>');
    const sub = cap.sub ? `<div class="cap-sub">${escapeHtml(cap.sub).replace(/\n/g, '<br>')}</div>` : '';
    if (cap.kind === 'quest') {
      el.innerHTML = `
        <div class="quest-ribbon">QUEST</div>
        <div class="quest-title">${text}</div>
        ${sub}
        <div class="quest-count"></div>
        <div class="quest-answer"><span class="check">&#10003;</span> ${escapeHtml(cap.answer ?? '')}</div>`;
    } else if (cap.kind === 'endcard') {
      el.innerHTML = `<div class="end-logo">${text}</div>${sub}`;
    } else {
      el.innerHTML = `<div class="cap-text">${text}</div>${sub}`;
    }
    overlay.append(el);
    capEls.push({ cap, el });
  }
  const bug = document.createElement('div');
  bug.className = 'bug';
  bug.innerHTML = 'Chibi Quest <span>preview</span>';
  overlay.append(bug);
}

/** Overshoot pop: 0 to 1 with a small bounce. */
function backOut(x: number): number {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

const tmp = new THREE.Vector3();
function screenOf(id: string, lift: number): { x: number; y: number; ok: boolean } {
  const live = lives.get(id);
  if (!live || !live.root.visible) return { x: 0, y: 0, ok: false };
  live.root.getWorldPosition(tmp);
  tmp.y += lift;
  tmp.project(camera);
  const w = overlay.clientWidth;
  const h = overlay.clientHeight;
  return { x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h, ok: tmp.z < 1 };
}

function drawOverlay(t: number): void {
  for (const { cap, el } of capEls) {
    const inT = cap.start;
    const outT = cap.end;
    if (t < inT || t > outT + 0.4) {
      el.style.display = 'none';
      continue;
    }
    el.style.display = '';
    const pin = clamp01((t - inT) / 0.5);
    const pout = clamp01((t - outT) / 0.4);
    const pop = backOut(pin);
    const opacity = Math.min(clamp01(pin * 2.5), 1 - pout);
    el.style.opacity = String(opacity);
    const s = lerp(0.4, 1, pop) * lerp(1, 0.85, pout);
    switch (cap.kind) {
      case 'title':
        el.style.transform = `translate(-50%, -50%) scale(${s}) rotate(${lerp(-6, -2, pop)}deg)`;
        break;
      case 'lower': {
        const x = lerp(-700, 0, pop) - pout * 700;
        el.style.transform = `translateX(${x}px)`;
        break;
      }
      case 'banner': {
        const x = lerp(-60, 0, pop) + pout * 40;
        el.style.transform = `translateX(${x}px) scale(${lerp(0.9, 1, pop)})`;
        break;
      }
      case 'quest': {
        const x = lerp(520, 0, pop) + pout * 520;
        el.style.transform = `translateX(${x}px)`;
        const count = el.querySelector<HTMLElement>('.quest-count')!;
        const ans = el.querySelector<HTMLElement>('.quest-answer')!;
        const at = cap.answerAt ?? outT;
        const left = at - t;
        if (left > 0 && left <= 3) {
          const n = Math.ceil(left);
          const frac = n - left; // 0 at the start of each number
          count.textContent = String(n);
          count.style.opacity = '1';
          count.style.transform = `scale(${lerp(1.5, 1, clamp01(frac * 3))})`;
        } else {
          count.style.opacity = '0';
        }
        const pa = clamp01((t - at) / 0.45);
        ans.style.opacity = String(clamp01(pa * 3));
        ans.style.transform = `scale(${t >= at ? lerp(0.5, 1, backOut(pa)) : 0.5})`;
        el.classList.toggle('solved', t >= at);
        break;
      }
      case 'tag':
      case 'bubble': {
        const p = screenOf(cap.actor ?? '', cap.lift ?? 1.3);
        if (!p.ok) {
          el.style.opacity = '0';
          break;
        }
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        el.style.transform = `translate(-50%, -100%) scale(${s})`;
        break;
      }
      case 'endcard':
        el.style.transform = `translate(-50%, -50%) scale(${lerp(0.7, 1, pop)})`;
        break;
      default:
        el.style.transform = `scale(${s})`;
    }
  }
  let cover = 0;
  let color = '#ffffff';
  for (const f of tour.fades) {
    const c = 1 - Math.abs(t - f.t) / f.half;
    if (c > cover) {
      cover = c;
      color = f.color;
    }
  }
  fadeEl.style.opacity = String(clamp01(cover));
  fadeEl.style.background = color;
}

// ---------------------------------------------------------------- frame
const lookVec = new THREE.Vector3();
function resize(): void {
  const w = Math.max(1, root.clientWidth);
  const h = Math.max(1, root.clientHeight);
  const size = renderer.getSize(new THREE.Vector2());
  if (size.x !== w || size.y !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

/** A fixed camera anywhere, for planning shots (window.__showcase.view, or ?scout=set&pos=&look=). */
interface View {
  set: SetName;
  pos: V3;
  look: V3;
  fov?: number;
  mood?: Mood;
}
const vec = (s: string | null, d: V3): V3 => (s ? (s.split(',').map(Number) as unknown as V3) : d);
const scoutSet = params.get('scout') as SetName | null;
let viewOverride: View | null = scoutSet
  ? { set: scoutSet, pos: vec(params.get('pos'), [20, 20, 20]), look: vec(params.get('look'), [0, 0, 0]), fov: Number(params.get('fov') ?? 38), ...(params.get('mood') ? { mood: params.get('mood') as Mood } : {}) }
  : null;

function view(v: View, t: number): void {
  viewOverride = v;
  seek(t);
  viewOverride = null;
}

function seek(t: number): void {
  resize();
  let shot = shotAt(t);
  let cam = cameraFor(shot, t);
  if (viewOverride) {
    const v = viewOverride;
    shot = { ...shot, set: v.set, mood: v.mood ?? (v.set === 'vault' ? 'vault' : 'day'), shake: [] };
    cam = { pos: v.pos, look: v.look, fov: v.fov ?? 38 };
  }
  for (const name of Object.keys(setGroups) as SetName[]) setGroups[name].visible = name === shot.set;
  const off = SET_OFFSET[shot.set];
  const shake = shakeAt(shot, t);
  const sx = shake * (Math.sin(t * 47.3) + 0.5 * Math.sin(t * 91.7));
  const sy = shake * (Math.sin(t * 53.9 + 1.3) + 0.5 * Math.sin(t * 77.1));
  camera.position.set(cam.pos[0] + off[0] + sx, cam.pos[1] + off[1] + sy, cam.pos[2] + off[2]);
  lookVec.set(cam.look[0] + off[0] + sx * 0.5, cam.look[1] + off[1] + sy * 0.5, cam.look[2] + off[2]);
  camera.lookAt(lookVec);
  if (camera.fov !== cam.fov) {
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
  }
  applyMood(shot.mood, lookVec);
  for (const tl of torchLights) {
    const f = 0.82 + 0.1 * Math.sin(t * 11.3 + tl.seed) + 0.08 * Math.sin(t * 23.7 + tl.seed * 2.1);
    tl.light.intensity = tl.base * f;
  }
  for (const live of lives.values()) poseActor(live, t);
  renderer.render(scene, camera);
  drawOverlay(t);
}

// ---------------------------------------------------------------- build
async function build(): Promise<void> {
  const sets: SetName[] = ['hamlet', 'forest', 'vault'];
  const places = new Map<SetName, Place[]>();
  for (const set of sets) {
    const g = new THREE.Group();
    g.position.set(...SET_OFFSET[set]);
    scene.add(g);
    setGroups[set] = g;
    places.set(set, mapPlaces(set));
  }
  const names = new Set<string>();
  for (const list of places.values()) for (const p of list) names.add(p.asset);
  for (const a of tour.actors) names.add(a.asset);
  let done = 0;
  const total = names.size;
  await Promise.all(
    [...names].map(async (n) => {
      await loadGltf(n);
      done++;
      loadingBar.style.width = `${Math.round((done / total) * 100)}%`;
    }),
  );
  for (const set of sets) {
    for (const p of places.get(set)!) {
      const g = gltfs.get(p.asset);
      if (g) addPlace(setGroups[set], g.scene, p);
    }
  }
  // The hamlet river bed under the river tiles hides gaps between them.
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(40, 2), new THREE.MeshStandardMaterial({ color: 0x257d9e, roughness: 0.9 }));
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(0, 0.03, 12);
  setGroups.hamlet.add(bed);
  // A wide ground plane under each outdoor map, so the horizon is not a void.
  const grass = new THREE.Mesh(new THREE.CircleGeometry(160, 48), new THREE.MeshStandardMaterial({ color: 0x6aa84f, roughness: 1 }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.02;
  grass.receiveShadow = true;
  setGroups.hamlet.add(grass);
  const moss = grass.clone();
  (moss.material as THREE.MeshStandardMaterial) = new THREE.MeshStandardMaterial({ color: 0x4f7d3a, roughness: 1 });
  setGroups.forest.add(moss);
  const stone = new THREE.Mesh(new THREE.CircleGeometry(60, 32), new THREE.MeshStandardMaterial({ color: 0x1b2028, roughness: 1 }));
  stone.rotation.x = -Math.PI / 2;
  stone.position.y = -0.02;
  setGroups.vault.add(stone);
  // Warm lights at the vault's torches, braziers, and candles.
  let seed = 0;
  for (const p of places.get('vault')!) {
    const kind = p.asset;
    if (kind !== 'torch-sconce' && kind !== 'brazier' && kind !== 'candle-cluster') continue;
    const yaw = THREE.MathUtils.degToRad(p.yaw ?? 0);
    const out = kind === 'torch-sconce' ? 0.45 : 0;
    const y = kind === 'torch-sconce' ? 1.9 : kind === 'brazier' ? 1.2 : 0.5;
    const base = kind === 'candle-cluster' ? 5 : kind === 'brazier' ? 22 : 16;
    const light = new THREE.PointLight(0xffa24a, base, kind === 'candle-cluster' ? 5 : 11, 1.6);
    light.position.set(p.at[0] + Math.sin(yaw) * out, y, p.at[2] + Math.cos(yaw) * out);
    setGroups.vault.add(light);
    torchLights.push({ light, base, seed: seed++ * 1.7 });
  }
  // An eerie green glow in the cells, where the undead wake up.
  const eerie = new THREE.PointLight(0x7dff9a, 9, 6, 1.4);
  eerie.position.set(-10, 1.7, 2.8);
  setGroups.vault.add(eerie);
  torchLights.push({ light: eerie, base: 9, seed: 42 });
  for (const a of tour.actors) await makeActor(a);
  buildOverlay();
  loadingEl.remove();
}

// ---------------------------------------------------------------- run
function fmt(t: number): string {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function startPlayer(): void {
  const controls = root.querySelector<HTMLElement>('.controls')!;
  controls.hidden = false;
  const button = controls.querySelector<HTMLButtonElement>('.play')!;
  const range = controls.querySelector<HTMLInputElement>('input')!;
  const clock = controls.querySelector<HTMLElement>('.clock')!;
  range.max = String(tour.duration);
  const audio = new Audio('/out/showcase/soundtrack.wav');
  let hasAudio = true;
  audio.addEventListener('error', () => (hasAudio = false));
  let playing = false;
  let t = Number(params.get('t') ?? 0);
  let last = performance.now();
  const setPlaying = (p: boolean): void => {
    playing = p;
    button.textContent = p ? 'Pause' : 'Play';
    if (hasAudio) {
      audio.currentTime = t;
      if (p) void audio.play().catch(() => (hasAudio = false));
      else audio.pause();
    }
    last = performance.now();
  };
  button.onclick = () => setPlaying(!playing);
  range.oninput = () => {
    t = Number(range.value);
    if (hasAudio) audio.currentTime = t;
  };
  const loop = (): void => {
    const now = performance.now();
    if (playing) {
      t = hasAudio && !audio.paused ? audio.currentTime : t + (now - last) / 1000;
      if (t >= tour.duration) {
        t = tour.duration;
        setPlaying(false);
      }
    }
    last = now;
    range.value = String(t);
    clock.textContent = `${fmt(t)} / ${fmt(tour.duration)}`;
    seek(t);
    requestAnimationFrame(loop);
  };
  loop();
}

declare global {
  interface Window {
    __showcase?: { ready: boolean; duration: number; seek: (t: number) => void; view: (v: View, t: number) => void };
  }
}

void build().then(() => {
  window.__showcase = { ready: true, duration: tour.duration, seek, view };
  if (playMode) startPlayer();
  else seek(Number(params.get('t') ?? 0));
});
