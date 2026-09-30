/**
 * Chibi Quest battle teaser: the horde, the heroes, the charge, and the crash, in 16:9 or 9:16.
 *
 *   battle.html?format=16x9          loads everything, then shows t = 0 (or ?t=seconds)
 *   battle.html?format=9x16&play     plays in real time with the soundtrack
 *   window.__battle.seek(t)          renders one exact moment (the recorder steps through frames)
 *
 * Every moment is a pure function of t. See docs/guild-battle-teaser.md.
 */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import rosterJson from './roster.json';
import { assignClips, buildArmy, ground, slimeUnit, SPEED, unitPose, type Cue, type RosterEntry, type Unit, type V3 } from './army.js';
import { fieldPlaces, type Place } from './field.js';
import { makeScript, spotlight, type Caption, type Format, type Light, type Shot } from './script.js';
import { RUN, T, worldTime } from './timeline.js';
import primaryLogo from './brand/primary-advantage.png';
import tutorLogo from './brand/tutor-advantage.png';
import lineQr from './brand/line-qr.jpg';
import './battle.css';

const params = new URLSearchParams(location.search);
const format: Format = params.get('format') === '9x16' ? '9x16' : '16x9';
const playMode = params.has('play');
/** ?cam=px,py,pz,lx,ly,lz,fov: one fixed camera with no shake, for stills such as the thumbnail. */
const camParam = params.get('cam')?.split(',').map(Number) ?? [];
const camOverride = camParam.length === 7 && camParam.every(Number.isFinite)
  ? { pos: [camParam[0]!, camParam[1]!, camParam[2]!] as V3, look: [camParam[3]!, camParam[4]!, camParam[5]!] as V3, fov: camParam[6]!, up: [0, 1, 0] as V3 }
  : null;
/**
 * ?turn=knight,orc (degrees): the two leaders turn this far toward the south (+z), so that a still
 * from there shows both faces. The orc's attack wind-up turns its body away, so it needs more.
 */
const [heroTurn = 0, enemyTurn = heroTurn] = (params.get('turn') ?? '').split(',').map((s) => Number(s) || 0);
const roster = rosterJson as RosterEntry[];

// ---------------------------------------------------------------- the cast and the script
const army = buildArmy(roster);
const spot = spotlight(army);
assignClips(army, roster, spot);
const slime = slimeUnit(roster);
const units: Unit[] = slime ? [...army.units, slime] : [...army.units];
const script = makeScript(format, army);
const DURATION = T.end;

// ---------------------------------------------------------------- page
const root = document.createElement('div');
root.className = `battle format-${format}`;
root.innerHTML = `
  <canvas></canvas>
  <div class="overlay"></div>
  <div class="fade"></div>
  <div class="loading"><div class="loading-title">Chibi Quest</div><div class="loading-bar"><i></i></div></div>`;
document.body.append(root);
const canvas = root.querySelector('canvas')!;
const overlay = root.querySelector<HTMLElement>('.overlay')!;
const fadeEl = root.querySelector<HTMLElement>('.fade')!;
const loadingEl = root.querySelector<HTMLElement>('.loading')!;
const loadingBar = root.querySelector<HTMLElement>('.loading-bar i')!;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(playMode ? Math.min(window.devicePixelRatio, 1.5) : 1);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, format === '9x16' ? 9 / 16 : 16 / 9, 0.1, 700);
scene.fog = new THREE.Fog('#dcecf7', 50, 190);

// ---------------------------------------------------------------- sky, ground, hills
const skyUniforms = { zenith: { value: new THREE.Color('#4f9ee6') }, horizon: { value: new THREE.Color('#e8f5ff') } };
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(600, 32, 16),
  new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:
      'uniform vec3 zenith; uniform vec3 horizon; varying vec3 vDir; void main() { float h = clamp(vDir.y, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, zenith, pow(h, 0.55)), 1.0); }',
  }),
);
sky.renderOrder = -10;
scene.add(sky);

function hash2(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, z: number): number {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const fx = x - xi;
  const fz = z - zi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = hash2(xi, zi);
  const b = hash2(xi + 1, zi);
  const c = hash2(xi, zi + 1);
  const d = hash2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function buildGround(): void {
  const size = 320;
  const seg = 190;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const grassA = new THREE.Color('#6aa84f');
  const grassB = new THREE.Color('#4f8a3c');
  const dry = new THREE.Color('#a4a05a');
  const dirt = new THREE.Color('#9c8458');
  const dark = new THREE.Color('#5d6b3e');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, ground(x, z) - 0.01);
    const n = vnoise(x * 0.18, z * 0.18) * 0.6 + vnoise(x * 0.7, z * 0.7) * 0.4;
    c.copy(grassA).lerp(grassB, n);
    // The trampled lane of the charge.
    const lane = Math.max(0, 1 - Math.max(0, Math.abs(z) - 7) / 4) * Math.max(0, 1 - Math.max(0, Math.abs(x) - 24) / 8);
    c.lerp(dry, lane * (0.45 + 0.35 * vnoise(x * 0.35 + 9, z * 0.35)));
    c.lerp(dirt, lane * Math.max(0, vnoise(x * 0.5 - 3, z * 0.9) - 0.55) * 1.4);
    // The horde's side is darker and drier.
    const east = Math.max(0, Math.min(1, (x - 18) / 20));
    c.lerp(dark, east * 0.55);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  mesh.receiveShadow = true;
  scene.add(mesh);
  // Low hills around the valley so the horizon is not a flat line.
  const hillMat = new THREE.MeshStandardMaterial({ color: '#5f8f52', roughness: 1 });
  const hillGeo = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2;
    const r = 105 + hash2(i, 3) * 40;
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(Math.cos(a) * r, -2, Math.sin(a) * r);
    hill.scale.set(30 + hash2(i, 5) * 25, 10 + hash2(i, 7) * 14, 26 + hash2(i, 9) * 20);
    scene.add(hill);
  }
}

// ---------------------------------------------------------------- lights
const hemi = new THREE.HemisphereLight(0xd7ecff, 0x6d8f45, 0.8);
const sun = new THREE.DirectionalLight(0xfff3df, 2.8);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.03;
const rim = new THREE.DirectionalLight(0xffffff, 0);
scene.add(hemi, sun, sun.target, rim, rim.target);

let shadowHalf = 0;
const fwd = new THREE.Vector3();
const right = new THREE.Vector3();
const UPV = new THREE.Vector3(0, 1, 0);
const tmpV = new THREE.Vector3();

function applyLight(l: Light, pos: THREE.Vector3, look: THREE.Vector3): void {
  skyUniforms.zenith.value.set(l.sky[0]);
  skyUniforms.horizon.value.set(l.sky[1]);
  const fog = scene.fog as THREE.Fog;
  fog.color.set(l.fog[0]);
  fog.near = l.fog[1];
  fog.far = l.fog[2];
  scene.background = new THREE.Color(l.sky[1]);
  hemi.color.set(l.hemi[0]);
  hemi.groundColor.set(l.hemi[1]);
  hemi.intensity = l.hemi[2];
  sun.color.set(l.keyColor);
  sun.intensity = l.keyIntensity;
  renderer.toneMappingExposure = l.exposure;
  fwd.subVectors(look, pos).setY(0);
  if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
  fwd.normalize();
  right.crossVectors(fwd, UPV).normalize();
  const d = new THREE.Vector3();
  if (l.key === 'camera') {
    const az = THREE.MathUtils.degToRad(l.az ?? 30);
    const el = THREE.MathUtils.degToRad(l.el ?? 38);
    d.copy(fwd).multiplyScalar(-Math.cos(az)).addScaledVector(right, Math.sin(az)).normalize().multiplyScalar(Math.cos(el)).addScaledVector(UPV, Math.sin(el));
  } else d.set(...l.key).normalize();
  sun.target.position.copy(look);
  sun.position.copy(look).addScaledVector(d, 70);
  if (shadowHalf !== l.shadow) {
    shadowHalf = l.shadow;
    Object.assign(sun.shadow.camera, { left: -l.shadow, right: l.shadow, top: l.shadow, bottom: -l.shadow, near: 5, far: 160 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  // The rim light comes from behind the subjects, toward the camera.
  rim.color.set(l.rim[0]);
  rim.intensity = l.rim[1];
  rim.target.position.copy(look);
  rim.position.copy(look).addScaledVector(fwd, 40).addScaledVector(UPV, 28);
  dustUniforms.color.value.set(l.dust);
}

// ---------------------------------------------------------------- loading
const loader = new GLTFLoader();
const gltfs = new Map<string, GLTF | null>();
const texLoader = new THREE.TextureLoader();

async function loadGltf(key: string, url: string): Promise<GLTF | null> {
  if (gltfs.has(key)) return gltfs.get(key)!;
  const res = await fetch(url);
  let gltf: GLTF | null = null;
  if (res.ok) {
    try {
      gltf = await loader.parseAsync(await res.arrayBuffer(), '');
    } catch (e) {
      console.warn(`battle: could not parse ${url}: ${(e as Error).message}`);
    }
  } else console.warn(`battle: missing ${url}`);
  gltfs.set(key, gltf);
  return gltf;
}
const castUrl = (name: string): string => `/out/battle/cast/${name}/${name}.glb`;
const envUrl = (name: string): string => `/out/${name}/${name}.glb`;

// ---------------------------------------------------------------- the environment
const envGroup = new THREE.Group();
const afterOnly: THREE.Object3D[] = [];
const beforeOnly: THREE.Object3D[] = [];
const QUIET = new Set(['tall-grass', 'wildflowers', 'fern', 'rock-cluster', 'stump', 'bush']);

function addPlace(source: THREE.Object3D, p: Place): void {
  const o = source.clone(true);
  o.position.set(p.at[0], p.at[1], p.at[2]);
  o.rotation.set(0, THREE.MathUtils.degToRad(p.yaw ?? 0), THREE.MathUtils.degToRad(p.roll ?? 0), 'YXZ');
  if (p.roll) o.position.y += 0.1;
  if (p.scale && p.scale !== 1) o.scale.setScalar(p.scale);
  o.traverse((n) => {
    if (!(n instanceof THREE.Mesh)) return;
    n.castShadow = !QUIET.has(p.asset);
    n.receiveShadow = true;
  });
  if (p.when === 'after') afterOnly.push(o);
  if (p.when === 'before') beforeOnly.push(o);
  envGroup.add(o);
}

// ---------------------------------------------------------------- units
interface ResolvedCue {
  t: number;
  clip: string;
  loop: boolean;
  speed: number;
  offset: number;
}
interface Live {
  unit: Unit;
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  durations: Map<string, number>;
  cues: ResolvedCue[];
  radius: number;
}
const lives: Live[] = [];
const liveById = new Map<string, Live>();
const presetMaterials = new Map<string, Map<THREE.Material, THREE.Material>>();
const presetTextures = new Map<string, THREE.Texture>();
const strideCache = new Map<string, number | null>();

async function presetTexture(asset: string, preset: string, like: THREE.Texture): Promise<THREE.Texture> {
  const key = `${asset}/${preset}`;
  const hit = presetTextures.get(key);
  if (hit) return hit;
  const tex = await texLoader.loadAsync(`/out/battle/cast/${asset}/textures/baseColor.${preset}.png`);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = like.wrapS;
  tex.wrapT = like.wrapT;
  tex.channel = like.channel;
  presetTextures.set(key, tex);
  return tex;
}

/** The materials of one look (asset + preset), shared by every unit with that look. */
async function lookMaterials(asset: string, preset: string, model: THREE.Object3D): Promise<Map<THREE.Material, THREE.Material>> {
  const key = `${asset}/${preset}`;
  const hit = presetMaterials.get(key);
  if (hit) return hit;
  const map = new Map<THREE.Material, THREE.Material>();
  const mats: THREE.MeshStandardMaterial[] = [];
  model.traverse((n) => {
    if (n instanceof THREE.Mesh && !map.has(n.material as THREE.Material)) {
      const m = n.material as THREE.MeshStandardMaterial;
      const c = m.clone();
      map.set(m, c);
      if (m.map) mats.push(c);
    }
  });
  for (const c of mats) c.map = await presetTexture(asset, preset, c.map!);
  presetMaterials.set(key, map);
  return map;
}

/**
 * The natural ground speed of a clip: the lowest foot moves back while it touches the ground.
 * Playing the clip at SPEED / natural keeps the feet from sliding.
 */
function naturalSpeed(gltf: GLTF, clipName: string): number | null {
  const clip = gltf.animations.find((a) => a.name === clipName);
  if (!clip) return null;
  const model = skeletonClone(gltf.scene);
  const mixer = new THREE.AnimationMixer(model);
  const action = mixer.clipAction(clip);
  action.play();
  const bones: THREE.Bone[] = [];
  model.traverse((n) => {
    if ((n as THREE.Bone).isBone) bones.push(n as THREE.Bone);
  });
  const leaves = bones.filter((b) => !b.children.some((c) => (c as THREE.Bone).isBone));
  if (leaves.length === 0) return null;
  const N = 60;
  const d = clip.duration;
  const samples: THREE.Vector3[][] = [];
  for (let i = 0; i <= N; i++) {
    action.time = (i / N) * d;
    mixer.update(0);
    model.updateMatrixWorld(true);
    samples.push(leaves.map((b) => b.getWorldPosition(new THREE.Vector3())));
  }
  const speeds: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = samples[i]!;
    const b = samples[i + 1]!;
    let k = 0;
    for (let j = 1; j < a.length; j++) if (a[j]!.y < a[k]!.y) k = j;
    if (b[k]!.y - a[k]!.y > 0.015) continue;
    const v = -(b[k]!.z - a[k]!.z) / (d / N);
    if (v > 0.05) speeds.push(v);
  }
  if (speeds.length < 5) return null;
  speeds.sort((x, y) => x - y);
  return speeds[Math.floor(speeds.length / 2)]!;
}

function strideFactor(u: Unit, clip: string): number {
  if (u.kind === 'float') return 1.3;
  const key = `${u.asset}/${clip}`;
  if (!strideCache.has(key)) {
    const g = gltfs.get(u.asset);
    strideCache.set(key, g ? naturalSpeed(g, clip) : null);
  }
  const v0 = strideCache.get(key);
  if (!v0) return 1.2;
  return Math.min(2.3, Math.max(0.55, SPEED / (v0 * u.scale)));
}

function resolveCues(u: Unit, durations: Map<string, number>): ResolvedCue[] {
  const raw = [...u.cues].sort((a, b) => a.t - b.t);
  const out: ResolvedCue[] = [];
  raw.forEach((c: Cue, i) => {
    const d = durations.get(c.clip);
    if (d === undefined) return;
    let speed = c.speed ?? 1;
    if (c.stride) speed = strideFactor(u, c.clip);
    if (c.fit !== undefined) speed = Math.max(0.2, ((c.at ?? 0.5) * d) / Math.max(0.05, c.fit - c.t));
    out.push({ t: c.t, clip: c.clip, loop: !!c.loop, speed, offset: c.offset ?? 0 });
    // A gesture returns to idle when it ends, unless the next cue comes first.
    if (c.back && durations.has('idle')) {
      const end = c.t + d / speed;
      const next = raw[i + 1];
      if (!next || next.t > end) out.push({ t: end, clip: 'idle', loop: true, speed: 1, offset: u.seed * 2 });
    }
  });
  return out.sort((a, b) => a.t - b.t);
}

async function makeLive(u: Unit): Promise<void> {
  const gltf = gltfs.get(u.asset);
  if (!gltf) return;
  const model = skeletonClone(gltf.scene);
  const swap = u.preset ? await lookMaterials(u.asset, u.preset, gltf.scene) : null;
  model.traverse((n) => {
    if (!(n instanceof THREE.Mesh)) return;
    n.castShadow = true;
    n.receiveShadow = true;
    n.frustumCulled = false;
    if (swap) n.material = swap.get(n.material as THREE.Material) ?? n.material;
  });
  model.scale.setScalar(u.scale);
  const group = new THREE.Group();
  group.add(model);
  scene.add(group);
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
  const live: Live = { unit: u, root: group, mixer, actions, durations, cues: resolveCues(u, durations), radius: Math.max(u.height, 1.2 * u.scale) * 0.8 + 0.4 };
  lives.push(live);
  liveById.set(u.id, live);
}

const smooth = (x: number): number => x * x * (3 - 2 * x);
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

function clipTime(live: Live, c: ResolvedCue, tau: number): number {
  const d = live.durations.get(c.clip) ?? 1;
  const local = c.offset + (tau - c.t) * c.speed;
  return c.loop ? ((local % d) + d) % d : Math.min(Math.max(local, 0), d - 1e-4);
}

const frustum = new THREE.Frustum();
const projScreen = new THREE.Matrix4();
const sphere = new THREE.Sphere();

function poseLive(live: Live, tau: number, t: number): void {
  const p = unitPose(live.unit, tau, t);
  live.root.visible = p.visible;
  if (!p.visible) return;
  live.root.position.set(p.x, p.y, p.z);
  const turn = live.unit.kind !== 'leader' ? 0 : live.unit.side === 'hero' ? heroTurn : enemyTurn;
  live.root.rotation.y = THREE.MathUtils.degToRad(p.yaw - Math.sign(p.yaw) * turn);
  // Units far outside the view (with a margin for their shadows) are skipped.
  sphere.center.set(p.x, p.y + live.unit.height * 0.5, p.z);
  sphere.radius = live.radius + 3;
  if (!frustum.intersectsSphere(sphere)) {
    live.root.visible = false;
    return;
  }
  for (const a of live.actions.values()) {
    a.enabled = false;
    a.setEffectiveWeight(0);
  }
  const cues = live.cues;
  let ci = 0;
  for (let i = 0; i < cues.length; i++) if (cues[i]!.t <= tau) ci = i;
  const cur = cues[ci];
  if (cur) {
    const w = ci > 0 ? smooth(clamp01((tau - cur.t) / 0.22)) : 1;
    const a = live.actions.get(cur.clip);
    if (a) {
      a.enabled = true;
      a.setEffectiveWeight(w);
      a.time = clipTime(live, cur, tau);
    }
    const prev = ci > 0 ? cues[ci - 1] : undefined;
    if (prev && w < 1 && prev.clip !== cur.clip) {
      const b = live.actions.get(prev.clip);
      if (b) {
        b.enabled = true;
        b.setEffectiveWeight(1 - w);
        b.time = clipTime(live, prev, tau);
      }
    }
  }
  live.mixer.update(0);
}

// ---------------------------------------------------------------- dust
const MAX_DUST = 2400;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(MAX_DUST * 3);
const dustSize = new Float32Array(MAX_DUST);
const dustAlpha = new Float32Array(MAX_DUST);
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
dustGeo.setAttribute('size', new THREE.BufferAttribute(dustSize, 1));
dustGeo.setAttribute('alpha', new THREE.BufferAttribute(dustAlpha, 1));
const dustUniforms = {
  color: { value: new THREE.Color('#d9c7a6') },
  scale: { value: 500 },
  fogNear: { value: 50 },
  fogFar: { value: 190 },
};
const dust = new THREE.Points(
  dustGeo,
  new THREE.ShaderMaterial({
    uniforms: dustUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float size; attribute float alpha; varying float vAlpha; uniform float scale; uniform float fogNear; uniform float fogFar;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float fogF = smoothstep(fogNear, fogFar, -mv.z);
        vAlpha = alpha * (1.0 - fogF);
        gl_PointSize = clamp(size * scale / max(0.1, -mv.z), 0.0, 900.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 color; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = vAlpha * smoothstep(1.0, 0.15, d);
        if (a < 0.004) discard;
        gl_FragColor = vec4(color, a);
      }`,
  }),
);
dust.frustumCulled = false;
dust.renderOrder = 5;
scene.add(dust);

function updateDust(tau: number, t: number): void {
  let n = 0;
  const LIFE = 1.3;
  const EVERY = 0.2;
  if (t < T.impact) {
    for (const live of lives) {
      const u = live.unit;
      if (u.kind !== 'ground' && u.kind !== 'leader') continue;
      const start = RUN + u.delay;
      if (tau <= start + EVERY) continue;
      const k1 = Math.floor((tau - start) / EVERY);
      const k0 = Math.max(1, Math.ceil((tau - LIFE - start) / EVERY));
      for (let k = k0; k <= k1 && n < MAX_DUST; k++) {
        const te = start + k * EVERY;
        const age = tau - te;
        const p = unitPose(u, te, te);
        const h = hash2(u.seed * 1000 + k, 17.3);
        dustPos[n * 3] = p.x + (u.side === 'hero' ? -0.25 : 0.25) + (h - 0.5) * 0.4;
        dustPos[n * 3 + 1] = ground(p.x, p.z) + 0.12 + age * 0.3;
        dustPos[n * 3 + 2] = p.z + (hash2(k, u.seed * 99) - 0.5) * 0.5;
        dustSize[n] = (0.35 + age * 0.85) * (0.8 + 0.4 * h) * Math.min(1.6, 0.7 + u.scale * 0.4);
        dustAlpha[n] = 0.42 * Math.pow(1 - age / LIFE, 1.6);
        n++;
      }
    }
  } else if (t >= T.after) {
    // The dust of the battle hangs over the empty field.
    for (let i = 0; i < 70; i++) {
      const x = (hash2(i, 1) - 0.5) * 34 + Math.sin(t * 0.15 + i) * 0.8 + (t - T.after) * 0.35;
      const z = (hash2(i, 2) - 0.5) * 26 - 3;
      dustPos[n * 3] = x;
      dustPos[n * 3 + 1] = ground(x, z) + 0.3 + hash2(i, 3) * 1.6;
      dustPos[n * 3 + 2] = z;
      dustSize[n] = 2.5 + hash2(i, 4) * 3.5;
      dustAlpha[n] = 0.12 + 0.08 * hash2(i, 5);
      n++;
    }
  }
  for (let i = n; i < MAX_DUST; i++) dustAlpha[i] = 0;
  dustGeo.setDrawRange(0, n);
  (dustGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  (dustGeo.getAttribute('size') as THREE.BufferAttribute).needsUpdate = true;
  (dustGeo.getAttribute('alpha') as THREE.BufferAttribute).needsUpdate = true;
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
  let shot = script.shots[0]!;
  for (const s of script.shots) if (s.start <= t) shot = s;
  return shot;
}

function cameraFor(shot: Shot, t: number): { pos: V3; look: V3; fov: number; up: V3 } {
  const keys = shot.keys;
  const up = (keys[0]!.up ?? [0, 1, 0]) as V3;
  if (keys.length === 1 || t <= keys[0]!.t) {
    const k = keys[0]!;
    return { pos: k.pos, look: k.look, fov: k.fov ?? 40, up };
  }
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1]!.t) i++;
  const a = keys[i]!;
  const b = keys[i + 1]!;
  let u = clamp01((t - a.t) / (b.t - a.t));
  // Followed cameras (many keys) move linearly; authored moves ease in and out.
  if (keys.length <= 3) {
    const first = i === 0;
    const last = i === keys.length - 2;
    if (first && last) u = smooth(u);
    else if (first) u = u * u * (2 - u);
    else if (last) u = 1 - (1 - u) * (1 - u) * (1 + u);
  }
  const pos = curve(keys.map((k) => k.pos), i, u);
  const look = curve(keys.map((k) => k.look), i, u);
  return { pos, look, fov: lerp(a.fov ?? 40, b.fov ?? 40, u), up };
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

// ---------------------------------------------------------------- overlay
interface CapEl {
  cap: Caption;
  el: HTMLElement;
  num?: HTMLElement;
  last?: number;
}
const capEls: CapEl[] = [];

function buildOverlay(): void {
  for (const cap of script.captions) {
    const el = document.createElement('div');
    el.className = `cap cap-${cap.kind}${cap.slot ? ` slot-${cap.slot}` : ''}`;
    if (cap.accent) el.style.setProperty('--accent', cap.accent);
    const item: CapEl = { cap, el };
    if (cap.kind === 'title') el.innerHTML = `<div class="title-text">${(cap.text ?? "").split(" ").map((w) => `<span>${w}</span>`).join(" ")}</div>`;
    else if (cap.kind === 'counter') {
      el.innerHTML = `<span class="pre">${cap.pre}</span><span class="num">0</span><span class="post">${cap.post}</span>`;
      item.num = el.querySelector<HTMLElement>('.num')!;
    } else if (cap.kind === 'tag') el.innerHTML = `<span>${cap.text}</span>`;
    else if (cap.kind === 'endcard')
      el.innerHTML = `
        <div class="end-title">CHIBI QUEST</div>
        <div class="end-soon">เร็ว ๆ นี้ ใน</div>
        <div class="end-logos"><img src="${primaryLogo}" alt="Primary Advantage" /><img src="${tutorLogo}" alt="Tutor Advantage" /></div>
        <div class="end-line"><img src="${lineQr}" alt="LINE" /><span>สอบถามทาง LINE</span></div>`;
    overlay.append(el);
    capEls.push(item);
  }
}

function backOut(x: number): number {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function screenOf(id: string, lift: number): { x: number; y: number; ok: boolean } {
  const live = liveById.get(id);
  if (!live || !live.root.visible) return { x: 0, y: 0, ok: false };
  live.root.getWorldPosition(tmpV);
  tmpV.y += lift;
  tmpV.project(camera);
  const w = overlay.clientWidth;
  const h = overlay.clientHeight;
  const x = (tmpV.x * 0.5 + 0.5) * w;
  const y = (-tmpV.y * 0.5 + 0.5) * h;
  return { x, y, ok: tmpV.z < 1 && x > -40 && x < w + 40 && y > 0 && y < h };
}

function drawOverlay(t: number): void {
  for (const item of capEls) {
    const { cap, el } = item;
    if (t < cap.start || t >= cap.end) {
      el.style.display = 'none';
      continue;
    }
    el.style.display = '';
    const pin = clamp01((t - cap.start) / 0.45);
    const pout = clamp01((t - (cap.end - 0.3)) / 0.3);
    const pop = backOut(pin);
    el.style.opacity = String(Math.min(clamp01(pin * 2.5), 1 - pout));
    const s = lerp(0.5, 1, pop) * lerp(1, 0.9, pout);
    switch (cap.kind) {
      case 'title':
        el.style.transform = `translate(-50%, -50%) scale(${lerp(0.4, 1, pop) * lerp(1, 1.08, clamp01((t - cap.start) / 5))}) rotate(${lerp(-7, -3, pop)}deg)`;
        break;
      case 'counter': {
        const k = clamp01((t - (cap.countFrom ?? cap.start)) / ((cap.countTo ?? cap.start + 1) - (cap.countFrom ?? cap.start)));
        const n = Math.round((cap.to ?? 0) * (1 - Math.pow(1 - k, 2.2)));
        if (item.num && n !== item.last) {
          item.num.textContent = String(n);
          item.last = n;
        }
        // The number bumps when it lands on its final value.
        const land = clamp01((t - (cap.countTo ?? 0)) / 0.35);
        const bump = k >= 1 ? 1 + 0.18 * Math.sin(Math.PI * land) : 1;
        if (item.num) item.num.style.transform = `scale(${bump})`;
        el.style.transform = cap.slot === 'band' ? `translate(-50%, 0) scale(${s})` : `translateX(${lerp(-60, 0, pop) + pout * 40}px) scale(${lerp(0.9, 1, pop)})`;
        break;
      }
      case 'tag': {
        const live = liveById.get(cap.unit ?? '');
        const p = screenOf(cap.unit ?? '', (live?.unit.height ?? 1) + 0.28);
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
        el.style.transform = `translate(-50%, -50%) scale(${lerp(0.75, 1, pop)})`;
        break;
    }
  }
  let cover = 0;
  let color = '#ffffff';
  for (const f of script.fades) {
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

const lookVec = new THREE.Vector3();
function seek(t: number): void {
  resize();
  const shot = shotAt(t);
  const tau = worldTime(t);
  if (shot.black) {
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    for (const { el } of capEls) el.style.display = 'none';
    drawOverlay(t);
    return;
  }
  const cam = camOverride ?? cameraFor(shot, t);
  const shake = camOverride ? 0 : shakeAt(shot, t);
  const sx = shake * (Math.sin(t * 47.3) + 0.5 * Math.sin(t * 91.7));
  const sy = shake * (Math.sin(t * 53.9 + 1.3) + 0.5 * Math.sin(t * 77.1));
  camera.up.set(...cam.up);
  camera.position.set(cam.pos[0] + sx, cam.pos[1] + sy, cam.pos[2]);
  lookVec.set(cam.look[0] + sx * 0.5, cam.look[1] + sy * 0.5, cam.look[2]);
  camera.lookAt(lookVec);
  if (camera.fov !== cam.fov) camera.fov = cam.fov;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  sky.position.copy(camera.position);
  applyLight(shot.light, camera.position, lookVec);
  dustUniforms.fogNear.value = (scene.fog as THREE.Fog).near;
  dustUniforms.fogFar.value = (scene.fog as THREE.Fog).far;
  dustUniforms.scale.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(projScreen);
  for (const o of afterOnly) o.visible = t >= T.impact;
  for (const o of beforeOnly) o.visible = t < T.impact;
  for (const live of lives) {
    poseLive(live, tau, t);
    if (shot.hide?.includes(live.unit.id)) live.root.visible = false;
  }
  updateDust(tau, t);
  renderer.render(scene, camera);
  drawOverlay(t);
}

// ---------------------------------------------------------------- build
async function build(): Promise<void> {
  buildGround();
  scene.add(envGroup);
  const places = fieldPlaces();
  const envNames = [...new Set(places.map((p) => p.asset))];
  const castNames = [...new Set(units.map((u) => u.asset))];
  const total = envNames.length + castNames.length;
  let done = 0;
  const tick = (): void => {
    done++;
    loadingBar.style.width = `${Math.round((done / total) * 100)}%`;
  };
  // Load a few at a time: the machine has little memory to spare.
  const queue: (() => Promise<unknown>)[] = [
    ...castNames.map((n) => () => loadGltf(n, castUrl(n)).then(tick)),
    ...envNames.map((n) => () => loadGltf(`env:${n}`, envUrl(n)).then(tick)),
  ];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) await queue.shift()!();
    }),
  );
  for (const p of places) {
    const g = gltfs.get(`env:${p.asset}`);
    if (g) addPlace(g.scene, p);
  }
  for (const u of units) await makeLive(u);
  buildOverlay();
  loadingEl.remove();
}

// ---------------------------------------------------------------- run
function startPlayer(): void {
  const audio = new Audio('/out/battle/soundtrack.wav');
  let hasAudio = true;
  audio.addEventListener('error', () => (hasAudio = false));
  let t = Number(params.get('t') ?? 0);
  let last = performance.now();
  let playing = false;
  document.addEventListener('click', () => {
    playing = !playing;
    if (hasAudio) {
      audio.currentTime = t;
      if (playing) void audio.play().catch(() => (hasAudio = false));
      else audio.pause();
    }
    last = performance.now();
  });
  const loop = (): void => {
    const now = performance.now();
    if (playing) {
      t = hasAudio && !audio.paused ? audio.currentTime : t + (now - last) / 1000;
      if (t >= DURATION) playing = false;
    }
    last = now;
    seek(t);
    requestAnimationFrame(loop);
  };
  loop();
}

declare global {
  interface Window {
    __battle?: { ready: boolean; duration: number; seek: (t: number) => void; info: () => unknown };
  }
}

function info(): unknown {
  const kinds = (side: string): number => new Set(units.filter((u) => u.side === side && u.kind !== 'slime').map((u) => u.asset)).size;
  return {
    format,
    units: units.length,
    loaded: lives.length,
    heroes: units.filter((u) => u.side === 'hero').length,
    enemies: units.filter((u) => u.side === 'enemy' && u.kind !== 'slime').length,
    heroKinds: kinds('hero'),
    enemyAndMonsterKinds: kinds('enemy'),
    enemyKinds: army.enemyKinds,
    missing: units.filter((u) => !liveById.has(u.id)).map((u) => u.id),
    strides: Object.fromEntries([...strideCache.entries()].map(([k, v]) => [k, v === null ? null : +v.toFixed(2)])),
    shots: script.shots.map((s) => `${s.start.toFixed(2)} ${s.name}`),
  };
}

void build().then(() => {
  window.__battle = { ready: true, duration: DURATION, seek, info };
  if (playMode) startPlayer();
  else seek(Number(params.get('t') ?? 0));
});
