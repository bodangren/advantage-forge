import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { composeTransforms } from '../assembly/index.js';
import type { AssetDocument } from '../contracts/index.js';
import { canonicalJson } from '../document/browser.js';
import { downloadGlb, exportSceneToGlb } from '../export/index.js';
import { referenceDocuments } from '../fantasy-kit/index.js';
import {
  MVP_RENDER_PROFILE,
  createContactSheet,
  createOrthographicCamera,
  frameToCanvas,
  renderDirectionalSprites,
  type SpriteFrame,
  type SpriteRenderProfile,
} from '../render/index.js';
import {
  compileThreeScene,
  disposeCompiledScene,
  type CompiledThreeScene,
} from '../scene/index.js';
import './styles.css';

type ReferenceName = keyof typeof referenceDocuments;
type InspectorView = 'three' | 'sheet' | 'actual' | 'compare';
const app = document.querySelector<HTMLDivElement>('#app');
if (app === null) throw new Error('Inspector root was not found.');
app.innerHTML = `<main class="workshop">
  <header class="topbar"><div class="brand"><span>Fantasy</span> Asset Forge</div><span class="revision" id="revision-label">reference</span><button id="export-glb" class="primary">Export GLB</button></header>
  <aside class="sidebar" aria-label="Reference assets"><div class="panel-heading">Reference assets <span>4</span></div><ul class="asset-list" id="asset-list"></ul></aside>
  <section class="workspace" aria-label="Asset workspace"><nav class="view-tabs" aria-label="Workspace views"><button data-view="three" aria-pressed="true">3D Inspector</button><button data-view="sheet" aria-pressed="false">Contact Sheet</button><button data-view="actual" aria-pressed="false">Actual 128px</button><button data-view="compare" aria-pressed="false">Compare</button><div class="semantic-controls"><label class="part-control">Pose <select id="pose-select" aria-label="Selected pose"></select></label><label class="part-control">Variant <select id="variant-select" aria-label="Selected variant"></select></label><label class="part-control">Part <select id="part-select" aria-label="Selected semantic part"></select></label></div></nav><div class="viewport-shell"><canvas id="asset-canvas" aria-label="Interactive 3D asset preview"></canvas><div class="contact-sheet" id="contact-sheet" aria-label="Eight direction contact sheet"></div><div class="viewport-overlay" id="viewport-overlay"></div></div></section>
  <aside class="inspector" aria-label="Semantic evidence"><div class="panel-heading">Semantic evidence</div><dl class="property-grid" id="properties"></dl><div class="panel-heading">Pixel validation</div><ul class="evidence-list" id="evidence"></ul></aside>
  <footer class="statusbar"><span class="status">schema valid</span><span id="profile-status">128 × 128</span><span id="direction-status">8 directions</span><span class="build-state">No Blender · closed semantic grammar</span></footer>
</main>`;

const canvas = document.querySelector<HTMLCanvasElement>('#asset-canvas')!;
const shell = canvas.parentElement!;
const sheet = document.querySelector<HTMLDivElement>('#contact-sheet')!;
const partSelect = document.querySelector<HTMLSelectElement>('#part-select')!;
const poseSelect = document.querySelector<HTMLSelectElement>('#pose-select')!;
const variantSelect =
  document.querySelector<HTMLSelectElement>('#variant-select')!;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

let selected: ReferenceName = 'adventurer';
let activeDocument: Readonly<AssetDocument> = referenceDocuments[selected];
let activeProfile: SpriteRenderProfile = MVP_RENDER_PROFILE;
let activeRevisionId = 'reference';
let selectedPartId = '';
let compiled: CompiledThreeScene;
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let controls: OrbitControls;
let portOverlay: THREE.Group;
let frames: readonly SpriteFrame[] = [];
let previousFrames: readonly SpriteFrame[] = [];
let previousStateLabel = '';
let activeView: InspectorView = 'three';
let loadSequence = 0;

function resize(): void {
  const width = Math.max(1, shell.clientWidth);
  const height = Math.max(1, shell.clientHeight);
  renderer.setSize(width, height, false);
  if (camera !== undefined) {
    const vertical = camera.top - camera.bottom;
    camera.left = (-vertical * width) / height / 2;
    camera.right = (vertical * width) / height / 2;
    camera.updateProjectionMatrix();
  }
}

function frameElements(
  values: readonly SpriteFrame[],
  prefix = '',
): HTMLElement[] {
  return values.map((frame) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'contact-frame';
    wrapper.append(frameToCanvas(frame));
    const label = document.createElement('span');
    label.textContent = prefix
      ? `${prefix} · ${frame.direction}`
      : frame.direction;
    wrapper.append(label);
    return wrapper;
  });
}

async function browserRevisionId(
  document: Readonly<AssetDocument>,
): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(document));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
  return `revision.${hex}`;
}

function stateLabel(document: Readonly<AssetDocument>): string {
  return `${document.activePoseId ?? 'base'} · ${document.activeVariantId ?? 'base'}`;
}

function populateStateControls(): void {
  const fill = (
    select: HTMLSelectElement,
    values: readonly { readonly id: string }[],
    activeId: string | undefined,
    emptyLabel: string,
  ): void => {
    if (values.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = emptyLabel;
      select.replaceChildren(option);
      select.disabled = true;
      return;
    }
    select.replaceChildren(
      ...values.map(({ id }) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = id;
        return option;
      }),
    );
    select.disabled = false;
    select.value = activeId ?? values[0]!.id;
  };
  fill(
    poseSelect,
    activeDocument.poses,
    activeDocument.activePoseId,
    'No poses',
  );
  fill(
    variantSelect,
    activeDocument.variants,
    activeDocument.activeVariantId,
    'No variants',
  );
}

function populateSheet(): void {
  if (activeView === 'compare' && previousFrames.length > 0) {
    sheet.replaceChildren(
      ...frameElements(previousFrames, previousStateLabel),
      ...frameElements(frames, stateLabel(activeDocument)),
    );
    return;
  }
  sheet.replaceChildren(
    ...frameElements(
      frames,
      activeView === 'compare' ? stateLabel(activeDocument) : '',
    ),
  );
}

function renderWithDirections(count: 1 | 4 | 8): readonly SpriteFrame[] {
  const portsWereVisible = portOverlay?.visible ?? false;
  if (portOverlay !== undefined) portOverlay.visible = false;
  try {
    return renderDirectionalSprites(renderer, scene, compiled.summary.bounds, {
      ...activeProfile,
      directions: count,
    });
  } finally {
    if (portOverlay !== undefined) portOverlay.visible = portsWereVisible;
  }
}

function makeFrames(): void {
  frames = renderWithDirections(activeProfile.directions);
  populateSheet();
}

function showView(view: InspectorView): void {
  activeView = view;
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '[data-view]',
  ))
    button.setAttribute(
      'aria-pressed',
      String(button.dataset['view'] === view),
    );
  canvas.style.display = view === 'three' ? 'block' : 'none';
  sheet.style.display = view === 'three' ? 'none' : 'grid';
  sheet.classList.toggle('comparison', view === 'compare');
  sheet.classList.toggle('actual', view === 'actual');
  sheet.style.gridTemplateColumns = view === 'actual' ? 'repeat(4, 128px)' : '';
  populateSheet();
  for (const frame of sheet.querySelectorAll<HTMLElement>('.contact-frame'))
    frame.style.minHeight = view === 'actual' ? '128px' : '';
}

function clearPortOverlay(): void {
  if (portOverlay === undefined) return;
  portOverlay.traverse((object) => {
    const renderable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    renderable.geometry?.dispose();
    if (Array.isArray(renderable.material))
      renderable.material.forEach((material) => material.dispose());
    else renderable.material?.dispose();
  });
  portOverlay.clear();
}

function refreshPortOverlay(): void {
  clearPortOverlay();
  const instance = activeDocument.assembly.parts.find(
    ({ id }) => id === selectedPartId,
  );
  const summaryPart = compiled.summary.parts.find(
    ({ id }) => id === selectedPartId,
  );
  const template = activeDocument.templates.find(
    ({ id }) => id === instance?.templateId,
  );
  if (summaryPart === undefined || template === undefined) return;
  for (const port of template.ports) {
    const world = composeTransforms(summaryPart.worldTransform, port.frame);
    const axes = new THREE.AxesHelper(0.13);
    axes.name = `port:${selectedPartId}:${port.id}`;
    axes.userData = {
      semanticId: port.id,
      tags: [...port.tags],
      frame: structuredClone(port.frame),
    };
    axes.position.fromArray(world.position);
    axes.quaternion.fromArray(world.rotation);
    axes.scale.fromArray(world.scale);
    axes.updateMatrix();
    portOverlay.add(axes);
  }
}

function updatePartProperties(): void {
  const instance = activeDocument.assembly.parts.find(
    ({ id }) => id === selectedPartId,
  );
  const summaryPart = compiled.summary.parts.find(
    ({ id }) => id === selectedPartId,
  );
  const template = activeDocument.templates.find(
    ({ id }) => id === instance?.templateId,
  );
  const dimensions = compiled.summary.bounds.max
    .map((value, axis) =>
      (value - compiled.summary.bounds.min[axis]!).toFixed(2),
    )
    .join(' × ');
  const materials =
    summaryPart?.materialBindings
      .map(({ materialId }) => materialId)
      .join(', ') ?? 'none';
  const ports =
    template?.ports
      .map(
        (port) =>
          `${port.id} [${port.tags.join(', ') || 'untagged'}] @ ${port.frame.position
            .map((value) => value.toFixed(2))
            .join(', ')}`,
      )
      .join('; ') || 'none';
  const rows: readonly (readonly [string, string])[] = [
    ['Asset', activeDocument.id],
    ['Revision', activeRevisionId],
    ['Kit', activeDocument.kitId],
    ['Parts', String(compiled.summary.parts.length)],
    [
      'Ports',
      String(
        activeDocument.templates.reduce(
          (sum, value) => sum + value.ports.length,
          0,
        ),
      ),
    ],
    ['Triangles', compiled.summary.triangleCount.toLocaleString()],
    ['Bounds', `${dimensions}m`],
    ['Pose', activeDocument.activePoseId ?? 'none'],
    ['Variant', activeDocument.activeVariantId ?? 'base'],
    ['Selected part', instance?.id ?? 'none'],
    ['Template', instance?.templateId ?? 'none'],
    ['Handedness', instance?.handedness ?? 'neutral'],
    ['Part ports', ports],
    ['Materials', materials],
  ];
  const properties = document.querySelector<HTMLDListElement>('#properties')!;
  properties.replaceChildren(
    ...rows.flatMap(([label, value]) => {
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value;
      return [term, description];
    }),
  );
  refreshPortOverlay();
}

function loadDocument(
  asset: Readonly<AssetDocument>,
  referenceName?: ReferenceName,
  revisionId?: string,
): void {
  if (frames.length > 0 && activeDocument.id === asset.id) {
    previousFrames = frames;
    previousStateLabel = stateLabel(activeDocument);
  } else {
    previousFrames = [];
    previousStateLabel = '';
  }
  clearPortOverlay();
  if (compiled !== undefined) disposeCompiledScene(compiled);
  if (referenceName !== undefined) selected = referenceName;
  activeDocument = asset;
  const sequence = ++loadSequence;
  activeRevisionId = revisionId ?? 'revision.pending';
  if (revisionId === undefined)
    void browserRevisionId(asset).then((resolvedRevisionId) => {
      if (sequence !== loadSequence) return;
      activeRevisionId = resolvedRevisionId;
      document.querySelector('#revision-label')!.textContent = activeRevisionId;
      updatePartProperties();
    });
  activeProfile = asset.renderProfiles[0] ?? MVP_RENDER_PROFILE;
  compiled = compileThreeScene(asset);
  populateStateControls();
  selectedPartId = compiled.summary.parts[0]?.id ?? '';
  partSelect.replaceChildren(
    ...compiled.summary.parts.map(({ id }) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = id;
      return option;
    }),
  );
  partSelect.value = selectedPartId;
  scene = new THREE.Scene();
  portOverlay = new THREE.Group();
  portOverlay.name = 'inspector.port-overlays';
  scene.background = new THREE.Color('#b9b5a8');
  scene.add(
    compiled.group,
    portOverlay,
    new THREE.HemisphereLight(0xfff4d6, 0x29352a, 2.4),
  );
  const key = new THREE.DirectionalLight(0xffead0, 3.1);
  key.position.set(4, 7, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xa7b7cf, 1.2);
  fill.position.set(-4, 3, -2);
  scene.add(fill);
  const rig = createOrthographicCamera(
    compiled.summary.bounds,
    {
      ...activeProfile,
      widthPixels: Math.max(shell.clientWidth, 128),
      heightPixels: Math.max(shell.clientHeight, 128),
    },
    'S',
  );
  camera = rig.camera;
  controls?.dispose();
  controls = new OrbitControls(camera, canvas);
  controls.target.copy(rig.target);
  controls.enableDamping = true;
  controls.update();
  resize();
  makeFrames();
  updatePartProperties();
  document.querySelector('#revision-label')!.textContent = activeRevisionId;
  document.querySelector('#profile-status')!.textContent =
    `${activeProfile.widthPixels} × ${activeProfile.heightPixels}`;
  document.querySelector('#direction-status')!.textContent =
    `${activeProfile.directions} directions`;
  const overlay = document.querySelector<HTMLDivElement>('#viewport-overlay')!;
  const overlayTitle = document.createElement('strong');
  overlayTitle.textContent = asset.name;
  const partCount = document.createElement('span');
  partCount.textContent = `${compiled.summary.parts.length} semantic parts`;
  const triangleCount = document.createElement('span');
  triangleCount.textContent = `${compiled.summary.triangleCount.toLocaleString()} triangles`;
  overlay.replaceChildren(overlayTitle, partCount, triangleCount);
  const evidence = document.querySelector<HTMLUListElement>('#evidence')!;
  evidence.replaceChildren(
    ...frames.map((frame) => {
      const item = document.createElement('li');
      item.className = 'evidence-card';
      const title = document.createElement('strong');
      title.textContent = `${frame.direction} frame`;
      const detail = document.createElement('small');
      const bounds =
        frame.metrics.occupiedBounds === null
          ? 'empty'
          : `${frame.metrics.occupiedBounds.width}×${frame.metrics.occupiedBounds.height}px`;
      detail.textContent = `${bounds} · ground ${frame.metrics.groundAnchorDeviationPixels}px · feature ${frame.metrics.representativeFeaturePixels}px · clipped ${frame.metrics.clippedEdges.length}`;
      item.append(title, detail);
      return item;
    }),
  );
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '.asset-card',
  ))
    button.classList.toggle(
      'selected',
      button.dataset['asset'] === referenceName,
    );
  showView(activeView);
}

function applySelectedState(): void {
  const next: AssetDocument = {
    ...structuredClone(activeDocument),
    ...(poseSelect.disabled ? {} : { activePoseId: poseSelect.value }),
    ...(variantSelect.disabled ? {} : { activeVariantId: variantSelect.value }),
  };
  loadDocument(next, selected);
}

function selectAsset(name: ReferenceName): void {
  const source = referenceDocuments[name];
  loadDocument(source, name);
}

const labels: Record<ReferenceName, string> = {
  adventurer: 'Rustic Adventurer',
  crate: 'Iron-Banded Crate',
  tree: 'Roadside Tree',
  cottage: 'Timber Cottage',
};
document.querySelector('#asset-list')!.innerHTML = (
  Object.keys(referenceDocuments) as ReferenceName[]
)
  .map(
    (name) =>
      `<li><button class="asset-card" data-asset="${name}"><strong>${labels[name]}</strong><small>${referenceDocuments[name].assembly.parts.length} parts · ${name}</small></button></li>`,
  )
  .join('');
for (const button of document.querySelectorAll<HTMLButtonElement>(
  '.asset-card',
))
  button.addEventListener('click', () =>
    selectAsset(button.dataset['asset'] as ReferenceName),
  );
for (const button of document.querySelectorAll<HTMLButtonElement>(
  '[data-view]',
))
  button.addEventListener('click', () =>
    showView(button.dataset['view'] as InspectorView),
  );
poseSelect.addEventListener('change', applySelectedState);
variantSelect.addEventListener('change', applySelectedState);
partSelect.addEventListener('change', () => {
  selectedPartId = partSelect.value;
  updatePartProperties();
});
document.querySelector('#export-glb')!.addEventListener('click', async () => {
  const { bytes } = await exportSceneToGlb(compiled.group);
  downloadGlb(bytes, `${activeDocument.id}.glb`);
});
new ResizeObserver(resize).observe(shell);
selectAsset(selected);
renderer.setAnimationLoop(() => {
  controls?.update();
  if (activeView === 'three') renderer.render(scene, camera);
});
Object.assign(window, {
  fantasyAssetForge: {
    loadDocument,
    selectAsset,
    renderDirections: (count: 1 | 4 | 8) =>
      renderWithDirections(count).map(({ direction, metrics }) => ({
        direction,
        metrics,
      })),
    renderArtifacts: () => ({
      frames: frames.map((frame) => ({
        direction: frame.direction,
        dataUrl: frameToCanvas(frame).toDataURL('image/png'),
        metrics: frame.metrics,
      })),
      contactSheetDataUrl: createContactSheet(frames).toDataURL('image/png'),
    }),
    get document() {
      return structuredClone(activeDocument);
    },
    get assetId() {
      return activeDocument.id;
    },
    get revisionId() {
      return activeRevisionId;
    },
    get selected() {
      return selected;
    },
    get frames() {
      return frames;
    },
    get scene() {
      return scene;
    },
    exportGlb: () => exportSceneToGlb(compiled.group),
  },
});
