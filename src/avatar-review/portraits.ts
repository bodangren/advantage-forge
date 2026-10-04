/**
 * The portrait layer renderer (`portrait.html`, driven by scripts/avatar-portraits.ts): renders one
 * layer of the avatar pack at the fixed portrait camera (`PORTRAIT_CAMERA`) in the idle pose at
 * 0 s, with the studio light of the forge renders and no shadows.
 *
 * A layer is rendered at twice the portrait size with 4x multisampling, three times: the color, the
 * tint mask channels R, G, B, and the mask channel A (raw values, no tone mapping). The base body is
 * a depth-only occluder. Each pass is reduced to the portrait size with alpha-weighted averaging in
 * linear light. `window.renderPortraitLayer(spec)` returns the color (RGBA, sRGB, straight alpha)
 * and the mask (RGBA, opaque, twice as high) as base64.
 */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { avatarModelOf, composeAvatar, type LoadedGltf, nodeName, type AvatarModel, type AvatarPiece, type ComposedAvatar, type EquipRecord } from '../apk3d/avatar/compose.js';
import { avatarPackPath } from '../apk3d/avatar/pack.js';
import { PORTRAIT_CAMERA, PORTRAIT_SIZE } from '../apk3d/avatar/portrait.js';
import { Studio } from '../render/studio.js';

const PACK = `/out/${avatarPackPath()}/`;
const RENDER = PORTRAIT_SIZE * 2;

export interface LayerSpec {
  readonly name: string;
  /** A base layer, a piece, or a hair style (full, capped, or tucked). */
  readonly kind: 'base' | 'piece' | 'hair';
  /** The catalog id and model file of a piece or hair style. */
  readonly id?: string;
  readonly file?: string;
  /** The form of a hair style layer under a head piece (the file is that form's model). */
  readonly form?: 'capped' | 'tucked';
  /** Dyes rendered into the layer (a hair style layer is rendered in each hair color). */
  readonly dyes?: Readonly<Record<string, string>>;
  /** A hair style worn full as a depth-only occluder (the layer of a head piece that keeps the hair). */
  readonly overHair?: { readonly id: string; readonly file: string };
}

export interface LayerImage {
  readonly name: string;
  readonly color: string;
  readonly mask: string;
  /** Visible pixels, and whether any touches the frame edge (the frame is too small). */
  readonly pixels: number;
  readonly clipped: boolean;
}

/** A whole loadout for the 3D reference render: base tints, pieces with their files and dyes. */
export interface LoadoutSpec {
  readonly tints: Readonly<Record<string, string>>;
  readonly pieces: readonly { readonly id: string; readonly file: string; readonly capped?: string; readonly tucked?: string; readonly dyes: Readonly<Record<string, string>> }[];
  readonly defaultHair: { readonly id: string; readonly file: string; readonly capped?: string; readonly tucked?: string };
}

/** A capping head piece over a hair style, for the hair check. */
export interface HairCheckSpec {
  readonly piece: { readonly id: string; readonly file: string };
  readonly style: { readonly id: string; readonly file: string; readonly capped: string; readonly tucked: string };
}

/** Hair pixels inside the silhouette of the head piece in one view, and the piece pixels. */
export interface HairCheckView {
  readonly view: string;
  readonly through: number;
  readonly piece: number;
  /** The view with the hair in flat colors, the hair through the piece in yellow (base64 RGBA, bottom row first). */
  readonly image: string;
}

declare global {
  interface Window {
    __portraitReady?: boolean;
    checkHairThrough?: (spec: HairCheckSpec) => Promise<HairCheckView[]>;
    __portraitError?: string;
    renderPortraitLayer?: (spec: LayerSpec) => Promise<LayerImage>;
    renderPortraitLoadout?: (spec: LoadoutSpec) => Promise<string>;
  }
}

/** Base bodies that a piece can hide; every other base body is the `base` layer. */
const HIDEABLE = ['shoes', 'undershirt', 'hair'].map(nodeName);
const BASE_MESHES: Record<string, (name: string) => boolean> = {
  base: (n) => !HIDEABLE.includes(n),
  shoes: (n) => n === nodeName('shoes'),
  undershirt: (n) => n === nodeName('undershirt'),
};
/** The occluders of a base layer: the base layers under it. */
const BASE_OCCLUDERS: Record<string, (name: string) => boolean> = {
  base: () => false,
  shoes: BASE_MESHES.base!,
  undershirt: (n) => BASE_MESHES.base!(n) || BASE_MESHES.shoes!(n),
};

const canvas = document.createElement('canvas');
document.body.append(canvas);
const studio = new Studio(canvas);
studio.renderer.shadowMap.enabled = false;
studio.ground.visible = false;
studio.setBackground(null);
const camera = studio.ortho;
const h = PORTRAIT_CAMERA.halfSize;
Object.assign(camera, { left: -h, right: h, top: h, bottom: -h, near: 0.01, far: 20 });
camera.updateProjectionMatrix();
const target = new THREE.Vector3(...PORTRAIT_CAMERA.target);

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const models = new Map<string, Promise<AvatarModel>>();
const model = (file: string) => {
  let m = models.get(file);
  if (!m) {
    m = loader.loadAsync(PACK + file).then((g: GLTF) => avatarModelOf(g as unknown as LoadedGltf));
    models.set(file, m);
  }
  return m;
};

/** A head piece with no mesh that caps or tucks the hair: the composer wears that form of a style. */
const capper = (hair: 'capped' | 'tucked'): AvatarPiece => {
  const equip: EquipRecord = { slot: 'head', socket: 'head', fitScale: 1, hides: [], hair, displayOnly: [], twoHanded: false, attach: [] };
  return { id: 'portrait-capper', model: { scene: new THREE.Group(), animations: [], variants: null, equip, tintMask: null } };
};

const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });

/** The raw tint mask of a material (`alpha`: the A channel in R, G, B), black where the model has none. */
function maskMaterial(source: THREE.Material, alpha: boolean): THREE.Material {
  const mask = (source.userData.tint?.tintMask?.value as THREE.Texture | undefined) ?? null;
  const m = new THREE.MeshBasicMaterial({ color: mask ? 0xffffff : 0x000000, map: mask, toneMapped: false, side: source.side });
  if (alpha && mask) {
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n\tdiffuseColor.rgb = vec3( texture2D( map, vMapUv ).a );');
    };
    m.customProgramCacheKey = () => 'portrait-mask-alpha';
  }
  return m;
}

type Role = 'layer' | 'occluder' | 'hidden';

/** The posed avatar of one layer and the role of each of its meshes. */
async function stage(spec: LayerSpec): Promise<{ avatar: ComposedAvatar; roles: Map<THREE.Mesh, Role> }> {
  const base = await model('base/avatar-base.glb');
  const pieces: AvatarPiece[] = [];
  if (spec.kind !== 'base') {
    // A capped or tucked layer: that form's file is the style's model and its form model alike.
    const m = await model(spec.file!);
    pieces.push({ id: spec.id!, model: m, ...(spec.form ? { [spec.form]: m } : {}), dyes: spec.dyes ?? {} });
    if (spec.form) pieces.push(capper(spec.form));
    if (spec.overHair) pieces.push({ id: spec.overHair.id, model: await model(spec.overHair.file), dyes: {} });
  }
  const avatar = composeAvatar(base, { tints: {}, pieces });
  const idle = avatar.actions.get('idle');
  idle?.play();
  avatar.mixer.update(0);

  const hairOccluders = new Set<THREE.Mesh>();
  if (spec.overHair) avatar.model.traverse((o) => o.name.startsWith(`${spec.overHair!.id}@`) && o.traverse((c) => c instanceof THREE.Mesh && hairOccluders.add(c)));
  const inLayer = new Set<THREE.Mesh>();
  if (spec.kind === 'base') avatar.model.traverse((o) => o instanceof THREE.Mesh && o.visible && BASE_MESHES[spec.name]!(o.name) && inLayer.add(o));
  else avatar.model.traverse((o) => o.name.startsWith(`${spec.id}@`) && o.traverse((c) => c instanceof THREE.Mesh && inLayer.add(c)));
  const occludes = spec.kind === 'base' ? BASE_OCCLUDERS[spec.name]! : (n: string) => n !== nodeName('hair');
  const roles = new Map<THREE.Mesh, Role>();
  avatar.model.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    if (inLayer.has(o)) roles.set(o, 'layer');
    else if (hairOccluders.has(o)) roles.set(o, 'occluder');
    else if (o.visible && isBaseMesh(o, avatar.model) && occludes(o.name)) roles.set(o, 'occluder');
    else roles.set(o, 'hidden');
  });
  return { avatar, roles };
}

/** Whether a mesh is a body of the base (not under a piece holder). */
function isBaseMesh(mesh: THREE.Object3D, top: THREE.Object3D): boolean {
  for (let o: THREE.Object3D | null = mesh; o && o !== top; o = o.parent) if (o.name.includes('@')) return false;
  return true;
}

/** Renders the stage with each mesh in its pass material, at RENDER x RENDER from `view`; returns the canvas pixels (bottom row first). */
function pass(roles: Map<THREE.Mesh, Role>, material: (mesh: THREE.Mesh) => THREE.Material | THREE.Material[], raw: boolean, view: THREE.Camera = camera): Uint8Array {
  const saved = new Map<THREE.Mesh, { material: THREE.Material | THREE.Material[]; visible: boolean }>();
  for (const [mesh, role] of roles) {
    saved.set(mesh, { material: mesh.material, visible: mesh.visible });
    mesh.visible = role !== 'hidden';
    if (role === 'occluder') mesh.material = depthOnly;
    if (role === 'layer') mesh.material = material(mesh);
  }
  const r = studio.renderer;
  const tone = r.toneMapping;
  if (raw) {
    r.toneMapping = THREE.NoToneMapping;
    r.outputColorSpace = THREE.LinearSRGBColorSpace;
  }
  studio.render(view, RENDER, RENDER);
  const gl = r.getContext();
  const px = new Uint8Array(RENDER * RENDER * 4);
  gl.readPixels(0, 0, RENDER, RENDER, gl.RGBA, gl.UNSIGNED_BYTE, px);
  r.toneMapping = tone;
  r.outputColorSpace = THREE.SRGBColorSpace;
  for (const [mesh, s] of saved) {
    mesh.material = s.material;
    mesh.visible = s.visible;
  }
  return px;
}

const decode = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  decode[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
const encode = (v: number) => {
  const c = v <= 0 ? 0 : v >= 1 ? 1 : v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(c * 255);
};

/**
 * Halves a pass (premultiplied canvas pixels, bottom row first) into straight-alpha RGBA, top row
 * first, written at `offset` of `out`. `srgb`: the bytes are sRGB (averaged in linear light). With
 * `opaque`, the alpha is 255 and the color 0 where nothing shows (the mask image).
 */
function halve(px: Uint8Array, out: Uint8ClampedArray, offset: number, srgb: boolean, opaque: boolean): void {
  const n = PORTRAIT_SIZE;
  const acc = [0, 0, 0];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      acc[0] = acc[1] = acc[2] = 0;
      let alpha = 0;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const i = ((RENDER - 1 - (y * 2 + dy)) * RENDER + x * 2 + dx) * 4;
          const a = px[i + 3]! / 255;
          if (a === 0) continue;
          alpha += a;
          for (let c = 0; c < 3; c++) {
            const straight = Math.min(255, Math.round(px[i + c]! / a));
            acc[c]! += (srgb ? decode[straight]! : straight / 255) * a;
          }
        }
      const o = offset + (y * n + x) * 4;
      for (let c = 0; c < 3; c++) out[o + c] = alpha === 0 ? 0 : srgb ? encode(acc[c]! / alpha) : Math.round((acc[c]! / alpha) * 255);
      out[o + 3] = opaque ? 255 : Math.round((alpha / 4) * 255);
    }
}

function base64(bytes: Uint8ClampedArray): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function renderPortraitLayer(spec: LayerSpec): Promise<LayerImage> {
  const { avatar, roles } = await stage(spec);
  const root = avatar.root;
  studio.setAsset(root);
  studio.ground.visible = false;
  studio.aim(camera, target, 5, PORTRAIT_CAMERA.azimuth, PORTRAIT_CAMERA.elevation);

  const n = PORTRAIT_SIZE;
  const color = new Uint8ClampedArray(n * n * 4);
  halve(pass(roles, (m) => m.material, false), color, 0, true, false);
  const mask = new Uint8ClampedArray(n * n * 8);
  const made: THREE.Material[] = [];
  const masks = (alpha: boolean) => (m: THREE.Mesh) => {
    const one = (x: THREE.Material) => made[made.push(maskMaterial(x, alpha)) - 1]!;
    return Array.isArray(m.material) ? m.material.map(one) : one(m.material);
  };
  halve(pass(roles, masks(false), true), mask, 0, false, true);
  halve(pass(roles, masks(true), true), mask, n * n * 4, false, true);
  studio.scene.remove(root);
  for (const m of [...made, ...avatar.materials]) m.dispose();

  let pixels = 0;
  let clipped = false;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (color[(y * n + x) * 4 + 3]! > 0) {
        pixels++;
        if (x === 0 || y === 0 || x === n - 1 || y === n - 1) clipped = true;
      }
  return { name: spec.name, color: base64(color), mask: base64(mask), pixels, clipped };
}

/** The 3D reference of a portrait: the whole composed loadout at the portrait camera (color, base64 RGBA). */
async function renderPortraitLoadout(spec: LoadoutSpec): Promise<string> {
  const base = await model('base/avatar-base.glb');
  const piece = async (p: { id: string; file: string; capped?: string; tucked?: string; dyes?: Readonly<Record<string, string>> }): Promise<AvatarPiece> => ({
    id: p.id,
    model: await model(p.file),
    ...(p.capped ? { capped: await model(p.capped) } : {}),
    ...(p.tucked ? { tucked: await model(p.tucked) } : {}),
    dyes: p.dyes ?? {},
  });
  const avatar = composeAvatar(base, { tints: spec.tints, pieces: await Promise.all(spec.pieces.map(piece)), defaultHair: await piece(spec.defaultHair) });
  avatar.actions.get('idle')?.play();
  avatar.mixer.update(0);
  const roles = new Map<THREE.Mesh, Role>();
  avatar.model.traverse((o) => o instanceof THREE.Mesh && roles.set(o, o.visible ? 'layer' : 'hidden'));
  studio.setAsset(avatar.root);
  studio.ground.visible = false;
  studio.aim(camera, target, 5, PORTRAIT_CAMERA.azimuth, PORTRAIT_CAMERA.elevation);
  const color = new Uint8ClampedArray(PORTRAIT_SIZE * PORTRAIT_SIZE * 4);
  halve(pass(roles, (m) => m.material, false), color, 0, true, false);
  studio.scene.remove(avatar.root);
  for (const m of avatar.materials) m.dispose();
  return base64(color);
}

/** The views of the hair check: from above and from four sides at 30 degrees. */
const HAIR_VIEWS = [
  { view: 'top', azimuth: 0, elevation: 85 },
  { view: 'front', azimuth: 0, elevation: 30 },
  { view: 'left', azimuth: 90, elevation: 30 },
  { view: 'back', azimuth: 180, elevation: 30 },
  { view: 'right', azimuth: 270, elevation: 30 },
] as const;

/** A flat material that writes the window depth into R, G, B (24 bits) instead of a color. */
function depthMaterial(): THREE.Material {
  const m = new THREE.MeshBasicMaterial({ toneMapped: false });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      [
        '#include <dithering_fragment>',
        'vec3 enc = fract( gl_FragCoord.z * vec3( 1.0, 255.0, 65025.0 ) );',
        'enc -= enc.yzz * vec3( 1.0 / 255.0, 1.0 / 255.0, 0.0 );',
        'gl_FragColor = vec4( enc, 1.0 );',
      ].join('\n'),
    );
  };
  m.customProgramCacheKey = () => 'portrait-depth';
  return m;
}

/** The hair check counts hair at most this far in front of the piece surface (meters). */
const HAIR_GAP = 0.015;

/**
 * Hair through a capping head piece: the head in flat colors (hair red, piece green, base blue)
 * and in depth from five views, with and without the hair. A pixel that is the piece without the
 * hair, and hair less than HAIR_GAP in front of that piece surface with it, is hair through the
 * piece. Hair below the rim stays outside the piece silhouette; hair in the opening of a hood lies
 * far in front of the inner wall.
 */
async function checkHairThrough(spec: HairCheckSpec): Promise<HairCheckView[]> {
  const base = await model('base/avatar-base.glb');
  const piece: AvatarPiece = { id: spec.piece.id, model: await model(spec.piece.file) };
  const style: AvatarPiece = { id: spec.style.id, model: await model(spec.style.file), capped: await model(spec.style.capped), tucked: await model(spec.style.tucked), dyes: {} };
  const avatar = composeAvatar(base, { pieces: [piece, style] });
  avatar.actions.get('idle')?.play();
  avatar.mixer.update(0);
  const under = (id: string) => {
    const out = new Set<THREE.Mesh>();
    avatar.model.traverse((o) => o.name.startsWith(`${id}@`) && o.traverse((c) => c instanceof THREE.Mesh && out.add(c)));
    return out;
  };
  const hair = under(style.id);
  const worn = under(piece.id);
  const flat = (color: number) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const red = flat(0xff0000);
  const green = flat(0x00ff00);
  const blue = flat(0x0000ff);
  const colorOf = (m: THREE.Mesh) => (hair.has(m) ? red : worn.has(m) ? green : blue);
  const depth = depthMaterial();
  const head = new THREE.OrthographicCamera(-0.32, 0.32, 0.32, -0.32, 4, 6);
  studio.setAsset(avatar.root);
  studio.ground.visible = false;
  const views: HairCheckView[] = [];
  for (const v of HAIR_VIEWS) {
    studio.aim(head, new THREE.Vector3(0, 0.8, 0), 5, v.azimuth, v.elevation);
    const roles = (withHair: boolean) => {
      const r = new Map<THREE.Mesh, Role>();
      avatar.model.traverse((o) => o instanceof THREE.Mesh && r.set(o, o.visible && (withHair || !hair.has(o)) ? 'layer' : 'hidden'));
      return r;
    };
    const a = pass(roles(true), colorOf, true, head);
    const b = pass(roles(false), colorOf, true, head);
    const za = pass(roles(true), () => depth, true, head);
    const zb = pass(roles(false), () => depth, true, head);
    const z = (px: Uint8Array, i: number) => (px[i]! / 255 + px[i + 1]! / 65025 + px[i + 2]! / 16581375) * (head.far - head.near);
    let through = 0;
    let pieceSeen = 0;
    for (let i = 0; i < a.length; i += 4) {
      const greenB = b[i + 1]! > 128 && b[i]! < 64 && b[i + 2]! < 64;
      if (greenB) pieceSeen++;
      if (!greenB || !(a[i]! > 128 && a[i + 1]! < 64 && a[i + 2]! < 64)) continue;
      const gap = z(zb, i) - z(za, i);
      if (gap > 0 && gap < HAIR_GAP) {
        through++;
        a[i + 1] = 255;
      }
    }
    // A quarter-size image (every other pixel) keeps the transfer small.
    const small = new Uint8ClampedArray((RENDER / 2) * (RENDER / 2) * 4);
    for (let y = 0; y < RENDER / 2; y++)
      for (let x = 0; x < RENDER / 2; x++) small.set(a.subarray(((y * 2) * RENDER + x * 2) * 4, ((y * 2) * RENDER + x * 2) * 4 + 4), (y * (RENDER / 2) + x) * 4);
    views.push({ view: v.view, through, piece: pieceSeen, image: base64(small) });
  }
  studio.scene.remove(avatar.root);
  for (const m of [red, green, blue, depth, ...avatar.materials]) m.dispose();
  return views;
}

window.renderPortraitLayer = renderPortraitLayer;
window.checkHairThrough = checkHairThrough;
window.renderPortraitLoadout = renderPortraitLoadout;
model('base/avatar-base.glb')
  .then(() => (window.__portraitReady = true))
  .catch((e: Error) => (window.__portraitError = e.message));
