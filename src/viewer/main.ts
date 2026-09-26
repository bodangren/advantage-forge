import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Studio } from '../render/studio.js';
import './viewer.css';

interface Stats {
  name: string;
  triangles: number;
  bounds: { size: [number, number, number] };
  bodies: { name: string; triangles: number; milliseconds: number }[];
  milliseconds: number;
}

const app = document.createElement('div');
app.className = 'app';
app.innerHTML = `
  <aside class="rail"><h1>Asset Forge</h1><ul class="assets"></ul></aside>
  <main class="stage"><canvas></canvas><pre class="error" hidden></pre><div class="busy" hidden>building…</div></main>
  <aside class="info">
    <div class="toggles">
      <label><input type="checkbox" data-t="wire"> wireframe</label>
      <label><input type="checkbox" data-t="spin"> turntable</label>
      <label><input type="checkbox" data-t="textures"> baked textures (slower builds)</label>
      <label class="clip-row">animation <select class="clips"><option value="">rest pose</option></select></label>
    </div>
    <div class="stats"></div>
  </aside>`;
document.body.append(app);

const canvas = app.querySelector('canvas')!;
const list = app.querySelector('.assets')!;
const statsEl = app.querySelector('.stats')!;
const errorEl = app.querySelector<HTMLPreElement>('.error')!;
const busyEl = app.querySelector<HTMLDivElement>('.busy')!;
const clipsEl = app.querySelector<HTMLSelectElement>('.clips')!;
const studio = new Studio(canvas);
studio.renderer.setPixelRatio(window.devicePixelRatio);
const camera = studio.perspective;
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
const loader = new GLTFLoader();
let current = new URLSearchParams(location.search).get('asset') ?? '';
let model: THREE.Object3D | null = null;
let firstFrame = true;
let wire = false;
let spin = false;
let textures = false;
let mixer: THREE.AnimationMixer | null = null;
let clips: THREE.AnimationClip[] = [];
const clock = new THREE.Clock();

async function refreshList(): Promise<string[]> {
  const names = (await (await fetch('/api/assets')).json()) as string[];
  list.innerHTML = '';
  for (const n of names) {
    const li = document.createElement('li');
    li.innerHTML = `<button>${n}</button>`;
    li.querySelector('button')!.onclick = () => select(n);
    if (n === current) li.classList.add('active');
    list.append(li);
  }
  return names;
}

async function select(name: string): Promise<void> {
  if (name !== current) firstFrame = true;
  current = name;
  firstFrame ||= model === null;
  history.replaceState(null, '', `?asset=${name}`);
  list.querySelectorAll('li').forEach((li) => li.classList.toggle('active', li.textContent === name));
  await load();
}

async function load(): Promise<void> {
  if (!current) return;
  busyEl.hidden = false;
  const res = await fetch(`/api/build/${current}.glb?t=${Date.now()}${textures ? '' : '&fast=1'}`);
  busyEl.hidden = true;
  if (!res.ok) {
    errorEl.textContent = await res.text();
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;
  const stats = JSON.parse(decodeURIComponent(res.headers.get('x-forge-stats') ?? '{}')) as Stats;
  const gltf = await loader.parseAsync(await res.arrayBuffer(), '');
  model = gltf.scene;
  studio.setAsset(model);
  applyWire();
  mixer = new THREE.AnimationMixer(model);
  clips = gltf.animations;
  const keep = clipsEl.value;
  clipsEl.innerHTML =
    '<option value="">rest pose</option>' +
    clips.map((c) => `<option value="${c.name}">${c.name} (${c.duration.toFixed(2)} s)</option>`).join('');
  clipsEl.value = clips.some((c) => c.name === keep) ? keep : '';
  playClip();
  if (firstFrame) {
    const r = studio.radius;
    const d = r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2));
    studio.aim(camera, studio.center, d, 30, 12);
    controls.target.copy(studio.center);
    firstFrame = false;
  }
  const s = stats.bounds.size;
  statsEl.innerHTML = `
    <h2>${stats.name}</h2>
    <p><b>${stats.triangles.toLocaleString()}</b> triangles · ${s[0]} × ${s[1]} × ${s[2]} m · ${stats.milliseconds} ms</p>
    <table>${stats.bodies
      .map(
        (b) =>
          `<tr><td>${b.name}</td><td>${b.triangles.toLocaleString()}</td><td>${b.milliseconds} ms</td></tr>`,
      )
      .join('')}</table>`;
}

function playClip(): void {
  if (!mixer) return;
  mixer.stopAllAction();
  const clip = clips.find((c) => c.name === clipsEl.value);
  if (clip) mixer.clipAction(clip).reset().play();
}
clipsEl.onchange = playClip;

function applyWire(): void {
  model?.traverse((o) => {
    if (o instanceof THREE.Mesh) (o.material as THREE.MeshStandardMaterial).wireframe = wire;
  });
}

app.querySelectorAll<HTMLInputElement>('[data-t]').forEach((el) => {
  el.onchange = () => {
    if (el.dataset.t === 'wire') {
      wire = el.checked;
      applyWire();
    } else if (el.dataset.t === 'textures') {
      textures = el.checked;
      void load();
    } else spin = el.checked;
  };
});

function frame(): void {
  const rect = canvas.parentElement!.getBoundingClientRect();
  if (spin && model) model.rotation.y += 0.01;
  mixer?.update(clock.getDelta());
  controls.update();
  studio.placeLights(camera, controls.target, Math.max(studio.radius, 0.1));
  studio.render(camera, Math.floor(rect.width), Math.floor(rect.height));
  requestAnimationFrame(frame);
}

if (import.meta.hot) import.meta.hot.on('forge:changed', () => void load().then(refreshList));
void refreshList().then((names) => {
  const first = names.includes(current) ? current : names[0];
  if (first) void select(first);
});
frame();
