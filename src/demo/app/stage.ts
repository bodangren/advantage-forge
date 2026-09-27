/**
 * The 3D stage of Monster Encounters: the Sunken Vault, the heroes, the monsters, and every
 * animation the battle needs. It knows nothing about rules: the app tells it what happened (from
 * the game core's events) and awaits the returned promises to keep the story in order.
 */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { sunkenVaultPlaces } from '../../../scenes/sunken-vault.js';
import type { EnemyKind, EnemyState, HeroId } from '../core/types.js';

type V3 = readonly [number, number, number];

const FLOOR_Y = 0.09;
const HEROES: HeroId[] = ['knight', 'wizard', 'cleric'];
const ENEMY_KINDS: EnemyKind[] = ['skeleton', 'giant-bat', 'mimic', 'dragon-fire'];
/** Map pieces that lie flat: they receive shadows but do not cast them. */
const FLAT = new Set(['floor', 'floor-cracked', 'walkway']);

/**
 * A battle stage: where the party and the monsters stand, the two camera framings (portrait
 * phones and landscape screens), and the box of map pieces cut away so walls never block the view.
 */
export interface StageDef {
  party: Record<HeroId, V3>;
  /** Monster spots in order; the dragon uses `boss`. */
  enemies: V3[];
  boss: V3;
  portrait: { pos: V3; look: V3; fov: number };
  landscape: { pos: V3; look: V3; fov: number };
  /** Hide map pieces whose origin is inside [minX, minZ, maxX, maxZ]. */
  cutaway: [number, number, number, number][];
}

/** The great hall: the party stands south of the pillars and faces north. */
const HALL: StageDef = {
  party: { knight: [0, FLOOR_Y, 4.0], wizard: [-1.05, FLOOR_Y, 4.75], cleric: [1.05, FLOOR_Y, 4.75] },
  enemies: [[-0.85, FLOOR_Y, 0.9], [0.85, FLOOR_Y, 0.9], [0, FLOOR_Y, 0.4]],
  boss: [0, FLOOR_Y, 0.2],
  portrait: { pos: [3.3, 2.9, 8.4], look: [-0.25, 0.8, 2.4], fov: 50 },
  landscape: { pos: [3.4, 2.7, 8.6], look: [-0.2, 0.85, 2.4], fov: 46 },
  // The south wall (between the camera and the fight), and the hall's pillars and cage.
  cutaway: [[-4.6, 5.4, 4.6, 12], [-1.6, 1.6, 1.6, 2.4]],
};

export const STAGES: StageDef[] = [HALL, HALL, HALL, HALL];

interface Actor {
  id: string;
  kind: string;
  root: THREE.Group;
  model: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  current: THREE.AnimationAction | null;
  idle: string;
  /** Own materials, so flashes and presets touch only this actor. */
  materials: THREE.MeshStandardMaterial[];
  baseMaps: Map<THREE.MeshStandardMaterial, THREE.Texture | null>;
  home: THREE.Vector3;
  yaw: number;
}

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const smooth = (x: number): number => x * x * (3 - 2 * x);

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  private readonly loader = new GLTFLoader();
  private readonly gltfs = new Map<string, GLTF>();
  private readonly pending = new Map<string, Promise<GLTF>>();
  private readonly actors = new Map<string, Actor>();
  private readonly world = new THREE.Group();
  private readonly instanced: { mesh: THREE.InstancedMesh; origins: THREE.Vector3[]; matrices: THREE.Matrix4[] }[] = [];
  private readonly clock = new THREE.Clock();
  private readonly tweens: ((dt: number) => boolean)[] = [];
  private readonly fx = new THREE.Group();
  private readonly torchLights: THREE.PointLight[] = [];
  private readonly torchSpots: V3[] = [];
  private stageDef: StageDef = HALL;
  private portrait = true;
  private shakeLeft = 0;
  private shakePower = 0;
  private sway = 0;
  private titleOrbit = false;
  private camFrom: { pos: THREE.Vector3; look: THREE.Vector3; fov: number } | null = null;
  private camTo = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40 };
  private camT = 1;
  private camDur = 1;
  private readonly look = new THREE.Vector3();
  /**
   * The part of the canvas the camera frames, as fractions [x0, y0, x1, y1]: the battle card
   * covers the lower part of a portrait screen and the right part of a landscape one, so each
   * shot is composed for the free area while the whole canvas is still drawn.
   */
  private region: [number, number, number, number] = [0, 0, 1, 1];

  constructor(private readonly canvas: HTMLCanvasElement, private readonly base: string) {
    const lowPower = window.devicePixelRatio > 1.5 || /Android|iPhone|iPad/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.loader.setMeshoptDecoder(MeshoptDecoder);
    this.scene.background = new THREE.Color('#0c1118');
    this.scene.fog = new THREE.Fog('#0c1118', 16, 34);
    this.scene.add(new THREE.HemisphereLight(0x9fb8e8, 0x2a3040, 1.25));
    const sun = new THREE.DirectionalLight(0xc8dcff, 1.1);
    sun.position.set(-3, 14, 6);
    sun.target.position.set(0, 0, 2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 2, far: 30 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    this.scene.add(sun, sun.target, this.world, this.fx);
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(0xffa24a, 14, 10, 1.6);
      this.torchLights.push(light);
      this.scene.add(light);
    }
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ---------------------------------------------------------------- loading

  private gltf(name: string): Promise<GLTF> {
    const hit = this.gltfs.get(name);
    if (hit) return Promise.resolve(hit);
    let p = this.pending.get(name);
    if (!p) {
      p = this.loader.loadAsync(`${this.base}models/${name}.glb`).then((g) => {
        this.gltfs.set(name, g);
        return g;
      });
      this.pending.set(name, p);
    }
    return p;
  }

  /**
   * Loads the vault and the heroes (enough for the title); `progress` gets 0 to 1. The monsters
   * then load in the background while the student reads the story.
   */
  async load(progress: (p: number) => void): Promise<void> {
    const places = sunkenVaultPlaces().filter((p) => p.asset !== 'adventurer' && p.asset !== 'skeleton');
    const names = [...new Set(places.map((p) => p.asset)), ...HEROES];
    let done = 0;
    await Promise.all(
      names.map(async (n) => {
        try {
          await this.gltf(n);
        } catch {
          // A missing map piece (an unbuilt kit part) leaves a gap, not an error.
        }
        progress(++done / names.length);
      }),
    );
    this.buildWorld(places);
    // Dark stone beyond the map, so no view ever looks into a void.
    const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 32), new THREE.MeshStandardMaterial({ color: 0x252a33, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.02;
    ground.receiveShadow = true;
    this.world.add(ground);
    for (const [i, id] of HEROES.entries()) {
      const actor = this.makeActor(id, id, 'idle');
      actor.mixer.update(i * 0.37);
    }
    this.setStage(0, true);
    for (const kind of ENEMY_KINDS) void this.gltf(kind).catch(() => undefined);
  }

  private buildWorld(places: ReturnType<typeof sunkenVaultPlaces>): void {
    const byAsset = new Map<string, typeof places>();
    for (const p of places) byAsset.set(p.asset, [...(byAsset.get(p.asset) ?? []), p]);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    for (const [asset, list] of byAsset) {
      const g = this.gltfs.get(asset);
      if (!g) continue;
      g.scene.updateMatrixWorld(true);
      g.scene.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        const inst = new THREE.InstancedMesh(node.geometry, node.material, list.length);
        const origins: THREE.Vector3[] = [];
        const matrices: THREE.Matrix4[] = [];
        list.forEach((p, i) => {
          q.setFromAxisAngle(up, THREE.MathUtils.degToRad(p.yaw ?? 0));
          s.setScalar(p.scale ?? 1);
          m.compose(new THREE.Vector3(p.at[0], p.at[1], p.at[2]), q, s).multiply(node.matrixWorld);
          inst.setMatrixAt(i, m);
          origins.push(new THREE.Vector3(p.at[0], p.at[1], p.at[2]));
          matrices.push(m.clone());
        });
        inst.castShadow = !FLAT.has(asset);
        inst.receiveShadow = true;
        inst.frustumCulled = false; // instance bounds span the map
        this.world.add(inst);
        this.instanced.push({ mesh: inst, origins, matrices });
      });
      if (asset === 'torch-sconce' || asset === 'brazier' || asset === 'candle-cluster') {
        for (const p of list) {
          const yaw = THREE.MathUtils.degToRad(p.yaw ?? 0);
          const out = asset === 'torch-sconce' ? 0.45 : 0;
          this.torchSpots.push([p.at[0] + Math.sin(yaw) * out, asset === 'torch-sconce' ? 1.9 : 1.1, p.at[2] + Math.cos(yaw) * out]);
        }
      }
    }
  }

  /** Shows every map piece except those in the stage's cutaway boxes. */
  private applyCutaway(boxes: StageDef['cutaway']): void {
    const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const { mesh, origins, matrices } of this.instanced) {
      origins.forEach((o, i) => {
        const cut = boxes.some(([x0, z0, x1, z1]) => o.x >= x0 && o.x <= x1 && o.z >= z0 && o.z <= z1);
        mesh.setMatrixAt(i, cut ? hidden : matrices[i]!);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  private makeActor(id: string, asset: string, idle: string, scale = 1): Actor {
    const g = this.gltfs.get(asset);
    if (!g) throw new Error(`Model ${asset} is not loaded.`);
    const model = skeletonClone(g.scene);
    const materials: THREE.MeshStandardMaterial[] = [];
    const baseMaps = new Map<THREE.MeshStandardMaterial, THREE.Texture | null>();
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;
      const mats = (Array.isArray(node.material) ? node.material : [node.material]).map((mat: THREE.Material) => {
        const own = mat.clone() as THREE.MeshStandardMaterial;
        materials.push(own);
        baseMaps.set(own, own.map);
        return own;
      });
      node.material = Array.isArray(node.material) ? mats : mats[0]!;
    });
    model.scale.setScalar(scale);
    const root = new THREE.Group();
    root.add(model);
    this.scene.add(root);
    const mixer = new THREE.AnimationMixer(model);
    const actions = new Map<string, THREE.AnimationAction>();
    for (const clip of g.animations) actions.set(clip.name, mixer.clipAction(clip));
    const actor: Actor = { id, kind: asset, root, model, mixer, actions, current: null, idle, materials, baseMaps, home: new THREE.Vector3(), yaw: 0 };
    this.actors.set(id, actor);
    this.loop(actor, idle);
    return actor;
  }

  // ---------------------------------------------------------------- animation

  private loop(actor: Actor, clip: string, fade = 0.2): void {
    const next = actor.actions.get(clip) ?? actor.actions.get('idle');
    if (!next || next === actor.current) return;
    next.reset().setLoop(THREE.LoopRepeat, Infinity).setEffectiveWeight(1).fadeIn(fade).play();
    actor.current?.fadeOut(fade);
    actor.current = next;
  }

  /**
   * Plays a one-shot clip and resolves when it ends (then the actor returns to its idle loop).
   * `at` (0 to 1) also resolves the returned `hit` promise at that moment of the clip.
   */
  play(id: string, clip: string, at = 0.5, speed = 1): { hit: Promise<void>; done: Promise<void> } {
    const actor = this.actors.get(id);
    const action = actor?.actions.get(clip);
    if (!actor || !action) return { hit: Promise.resolve(), done: Promise.resolve() };
    const dur = action.getClip().duration / speed;
    action.reset().setLoop(THREE.LoopOnce, 1).setEffectiveTimeScale(speed).setEffectiveWeight(1).fadeIn(0.12).play();
    action.clampWhenFinished = true;
    actor.current?.fadeOut(0.12);
    actor.current = action;
    const hit = wait(dur * at * 1000);
    const done = wait(dur * 1000).then(() => {
      if (actor.current === action && clip !== 'death') {
        const idle = actor.actions.get(actor.idle);
        actor.current = null;
        this.loop(actor, actor.idle, 0.25);
        if (idle) action.fadeOut(0.25);
      }
    });
    return { hit, done };
  }

  /** Holds a clip's first frame (a closed mimic, a bone heap). */
  hold(id: string, clip: string): void {
    const actor = this.actors.get(id);
    const action = actor?.actions.get(clip);
    if (!actor || !action) return;
    actor.current?.stop();
    action.reset().setLoop(THREE.LoopOnce, 1).setEffectiveWeight(1).play();
    action.paused = true;
    action.time = 0;
    actor.current = action;
  }

  private tween(duration: number, step: (u: number) => void): Promise<void> {
    return new Promise((resolve) => {
      let t = 0;
      this.tweens.push((dt) => {
        t += dt;
        const u = clamp01(t / duration);
        step(u);
        if (u >= 1) resolve();
        return u >= 1;
      });
    });
  }

  // ---------------------------------------------------------------- the stage

  setLayout(portrait: boolean): void {
    this.portrait = portrait;
    this.aimCamera(0);
  }

  /** Frames shots for the free part of the screen (null: the whole screen). */
  setFreeArea(battle: boolean): void {
    this.region = !battle ? [0, 0, 1, 1] : this.portrait ? [0, 0, 1, 0.55] : [0, 0, 0.56, 1];
    this.applyView();
  }

  private applyView(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    const [x0, y0, x1, y1] = this.region;
    if (x0 === 0 && y0 === 0 && x1 === 1 && y1 === 1) this.camera.clearViewOffset();
    // A virtual frame the size of the free area; the canvas is a window onto it starting at the
    // free area's corner, so the frame's center lands in the middle of the free area.
    else this.camera.setViewOffset(w * (x1 - x0), h * (y1 - y0), -w * x0, -h * y0, w, h);
    this.camera.aspect = (w * (x1 - x0)) / (h * (y1 - y0));
    this.camera.updateProjectionMatrix();
  }

  /** Places the party and aims the camera at stage `index`. */
  setStage(index: number, instant = false): void {
    this.stageDef = STAGES[index] ?? HALL;
    this.applyCutaway(this.stageDef.cutaway);
    for (const id of HEROES) {
      const actor = this.actors.get(id);
      if (!actor) continue;
      const at = this.stageDef.party[id];
      actor.home.set(at[0], at[1], at[2]);
      actor.root.position.copy(actor.home);
      actor.yaw = 180;
      actor.root.rotation.y = Math.PI;
    }
    // The four torches nearest the fight light it.
    const center = new THREE.Vector3(0, 0, 2.5).add(new THREE.Vector3(...this.stageDef.party.knight)).multiplyScalar(0.5);
    const near = [...this.torchSpots].sort((a, b) => center.distanceToSquared(new THREE.Vector3(...a)) - center.distanceToSquared(new THREE.Vector3(...b)));
    this.torchLights.forEach((l, i) => {
      const p = near[i];
      if (p) l.position.set(p[0], p[1], p[2]);
      l.visible = !!p;
    });
    this.aimCamera(instant ? 0 : 1.2);
  }

  private aimCamera(duration: number): void {
    const shot = this.portrait ? this.stageDef.portrait : this.stageDef.landscape;
    this.camFrom = duration > 0 ? { pos: this.camera.position.clone(), look: this.look.clone(), fov: this.camera.fov } : null;
    this.camTo.pos.set(...shot.pos);
    this.camTo.look.set(...shot.look);
    this.camTo.fov = shot.fov;
    this.camT = 0;
    this.camDur = Math.max(0.001, duration);
    if (duration === 0) {
      this.camera.position.copy(this.camTo.pos);
      this.look.copy(this.camTo.look);
      this.camera.fov = shot.fov;
      this.camera.updateProjectionMatrix();
      this.camT = 1;
    }
  }

  /** The title: the party turns to face the viewer, and the camera swings gently in front of it. */
  setTitle(on: boolean): void {
    this.titleOrbit = on;
    for (const id of HEROES) {
      const actor = this.actors.get(id);
      if (actor) actor.yaw = on ? 0 : 180;
    }
    if (!on) this.aimCamera(0.9);
  }

  shake(power: number, seconds: number): void {
    this.shakePower = power;
    this.shakeLeft = seconds;
  }

  // ---------------------------------------------------------------- monsters

  /** Adds the encounter's monsters with their entrance: bones rise, bats fly in, the chest wakes, the dragon lands. */
  async spawn(enemies: EnemyState[]): Promise<void> {
    for (const [id, actor] of this.actors) {
      if (HEROES.includes(id as HeroId)) continue;
      this.scene.remove(actor.root);
      this.actors.delete(id);
    }
    await Promise.all([...new Set(enemies.map((e) => e.kind))].map((k) => this.gltf(k)));
    const entrances: Promise<void>[] = [];
    enemies.forEach((e, i) => {
      const boss = e.kind === 'dragon-fire';
      const spot = boss ? this.stageDef.boss : (this.stageDef.enemies[i] ?? this.stageDef.enemies[0]!);
      const idle = e.kind === 'giant-bat' ? 'idle' : 'idle';
      const actor = this.makeActor(e.id, e.kind, idle, boss ? 2.1 : 1);
      actor.home.set(spot[0], spot[1] + (e.kind === 'giant-bat' ? 0.55 : 0), spot[2]);
      actor.root.position.copy(actor.home);
      actor.yaw = 0;
      entrances.push(this.enter(actor, e.kind, i));
    });
    await Promise.all(entrances);
  }

  private async enter(actor: Actor, kind: EnemyKind, i: number): Promise<void> {
    await wait(i * 350);
    if (kind === 'skeleton') {
      this.hold(actor.id, 'rise');
      await wait(250);
      await this.play(actor.id, 'rise').done;
    } else if (kind === 'mimic') {
      this.hold(actor.id, 'reveal');
      await wait(700);
      const r = this.play(actor.id, 'reveal', 0.4);
      await r.hit;
      this.shake(0.05, 0.4);
      await r.done;
    } else if (kind === 'giant-bat') {
      const from = actor.home.clone().add(new THREE.Vector3(i ? 2.5 : -2.5, 2.2, -1.5));
      this.loop(actor, 'fly');
      await this.tween(1.1, (u) => actor.root.position.lerpVectors(from, actor.home, smooth(u)));
      await this.play(actor.id, 'screech', 1).done;
      actor.idle = 'fly';
      this.loop(actor, 'fly');
    } else if (kind === 'dragon-fire') {
      const from = actor.home.clone().add(new THREE.Vector3(-3, 6, -4));
      this.loop(actor, 'fly');
      await this.tween(2.0, (u) => actor.root.position.lerpVectors(from, actor.home, smooth(u)));
      this.shake(0.08, 0.5);
      const r = this.play(actor.id, 'roar', 0.3);
      await r.hit;
      this.shake(0.1, 1.0);
      await r.done;
    }
  }

  // ---------------------------------------------------------------- battle moves

  /** A hero's attack on a monster; resolves `hit` at the moment of impact. */
  heroAttack(hero: HeroId, target: string, move: 'attack' | 'attack2'): { hit: Promise<void>; done: Promise<void> } {
    const actor = this.actors.get(hero);
    const foe = this.actors.get(target);
    if (!actor || !foe) return { hit: Promise.resolve(), done: Promise.resolve() };
    if (hero === 'knight') {
      // A short dash toward the target, the swing, and back.
      const toward = foe.root.position.clone().sub(actor.home).setY(0);
      const dist = Math.max(0, toward.length() - 1.1);
      const dest = actor.home.clone().add(toward.normalize().multiplyScalar(dist));
      const hit = (async () => {
        await this.tween(0.28, (u) => actor.root.position.lerpVectors(actor.home, dest, smooth(u)));
        const swing = this.play(hero, move, 0.45);
        await swing.hit;
        void swing.done.then(() => this.tween(0.32, (u) => actor.root.position.lerpVectors(dest, actor.home, smooth(u))));
      })();
      return { hit, done: hit.then(() => wait(700)) };
    }
    // Casters: the clip, then a bolt from the hero to the target.
    const cast = this.play(hero, move, hero === 'cleric' ? 0.5 : 0.45);
    const hit = cast.hit.then(() => this.bolt(actor, foe, hero === 'wizard' ? 0xff7a1a : 0xfff0a0));
    return { hit, done: Promise.all([hit, cast.done]).then(() => undefined) };
  }

  private bolt(from: Actor, to: Actor, color: number): Promise<void> {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }));
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false }));
    ball.add(glow);
    const a = from.root.position.clone().add(new THREE.Vector3(0, 0.8, 0));
    const b = to.root.position.clone().add(new THREE.Vector3(0, to.kind === 'dragon-fire' ? 1.6 : 0.6, 0));
    this.fx.add(ball);
    return this.tween(0.42, (u) => {
      ball.position.lerpVectors(a, b, u);
      ball.position.y += Math.sin(u * Math.PI) * 0.6;
      glow.scale.setScalar(1 + 0.25 * Math.sin(u * 20));
    }).then(() => {
      this.fx.remove(ball);
      this.burst(b, color);
    });
  }

  /** A quick ring of sparks at a point. */
  private burst(at: THREE.Vector3, color: number): void {
    const n = 14;
    const geo = new THREE.SphereGeometry(0.05, 8, 6);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true });
    const sparks = Array.from({ length: n }, (_, i) => {
      const s = new THREE.Mesh(geo, mat);
      const a = (i / n) * Math.PI * 2;
      s.userData.dir = new THREE.Vector3(Math.cos(a), 0.6 + (i % 3) * 0.3, Math.sin(a)).multiplyScalar(1.4);
      s.position.copy(at);
      this.fx.add(s);
      return s;
    });
    void this.tween(0.5, (u) => {
      for (const s of sparks) s.position.copy(at).addScaledVector(s.userData.dir as THREE.Vector3, u * 0.6);
      mat.opacity = 1 - u;
    }).then(() => sparks.forEach((s) => this.fx.remove(s)));
  }

  /** A monster takes a hit: its clip, a white flash, and a small knock-back. */
  async enemyHit(id: string): Promise<void> {
    const actor = this.actors.get(id);
    if (!actor) return;
    this.flash(actor, 0xffffff);
    const back = actor.home.clone().add(new THREE.Vector3(0, 0, -0.18));
    void this.tween(0.12, (u) => actor.root.position.lerpVectors(actor.home, back, u)).then(() =>
      this.tween(0.25, (u) => actor.root.position.lerpVectors(back, actor.home, smooth(u))),
    );
    await this.play(id, 'hit').done;
  }

  async enemyDefeated(id: string): Promise<void> {
    const actor = this.actors.get(id);
    if (!actor) return;
    await this.play(id, 'death').done;
    const start = actor.root.position.clone();
    await this.tween(0.45, (u) => {
      actor.root.scale.setScalar(1 - smooth(u));
      actor.root.position.set(start.x, start.y - u * 0.2, start.z);
    });
    actor.root.visible = false;
  }

  /** A miss: the hero's move goes wide and the monster sidesteps. */
  heroMiss(hero: HeroId, target: string): Promise<void> {
    const foe = this.actors.get(target);
    const cast = this.play(hero, hero === 'cleric' ? 'attack2' : 'attack', 0.45);
    if (foe) {
      const side = foe.home.clone().add(new THREE.Vector3(0.45, 0, 0));
      void cast.hit.then(() =>
        this.tween(0.15, (u) => foe.root.position.lerpVectors(foe.home, side, smooth(u))).then(() =>
          this.tween(0.35, (u) => foe.root.position.lerpVectors(side, foe.home, smooth(u))),
        ),
      );
    }
    return cast.done;
  }

  /** A monster strikes back: its attack clip and the active hero's hit reaction. */
  async enemyAttack(enemy: string, hero: HeroId): Promise<void> {
    const strike = this.play(enemy, 'attack', 0.55);
    await strike.hit;
    const target = this.actors.get(hero);
    if (target) this.flash(target, 0xff4040);
    this.shake(0.035, 0.25);
    await this.play(hero, 'hit').done;
    await strike.done;
  }

  heal(hero: HeroId): void {
    const actor = this.actors.get(hero);
    if (actor) this.burst(actor.root.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0x9dffb0);
  }

  async victory(): Promise<void> {
    await Promise.all(HEROES.map((h, i) => wait(i * 120).then(() => this.play(h, 'victory').done)));
  }

  private flash(actor: Actor, color: number): void {
    const c = new THREE.Color(color);
    for (const m of actor.materials) m.emissive.copy(c);
    void this.tween(0.3, (u) => {
      for (const m of actor.materials) m.emissiveIntensity = (1 - u) * 0.9;
    }).then(() => {
      for (const m of actor.materials) m.emissive.setRGB(0, 0, 0);
    });
  }

  // ---------------------------------------------------------------- color presets

  private readonly presetTextures = new Map<string, THREE.Texture>();

  /** Shows a hero in a color preset (null: the default look). */
  async setPreset(hero: HeroId, preset: string | null): Promise<void> {
    const actor = this.actors.get(hero);
    if (!actor) return;
    let tex: THREE.Texture | null = null;
    if (preset) {
      const key = `${hero}/${preset}`;
      tex = this.presetTextures.get(key) ?? null;
      if (!tex) {
        tex = await new THREE.TextureLoader().loadAsync(`${this.base}models/${hero}/${preset}.webp`);
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        this.presetTextures.set(key, tex);
      }
    }
    for (const m of actor.materials) {
      const base = actor.baseMaps.get(m) ?? null;
      if (!base) continue;
      if (tex) {
        tex.wrapS = base.wrapS;
        tex.wrapT = base.wrapT;
        tex.channel = base.channel;
      }
      m.map = tex ?? base;
      m.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------- screen positions (HUD labels)

  private readonly tmp = new THREE.Vector3();

  /** Where an actor's head is on screen, in CSS pixels. */
  screenOf(id: string, lift = 1.3): { x: number; y: number; visible: boolean } {
    const actor = this.actors.get(id);
    if (!actor || !actor.root.visible) return { x: 0, y: 0, visible: false };
    const scale = actor.kind === 'dragon-fire' ? 2.1 : 1;
    this.tmp.copy(actor.root.position).add(new THREE.Vector3(0, lift * scale, 0)).project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: (this.tmp.x * 0.5 + 0.5) * r.width, y: (-this.tmp.y * 0.5 + 0.5) * r.height, visible: this.tmp.z < 1 };
  }

  // ---------------------------------------------------------------- frame

  private resize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    const size = this.renderer.getSize(new THREE.Vector2());
    if (size.x !== w || size.y !== h) {
      this.renderer.setSize(w, h, false);
      this.applyView();
    }
  }

  private frame(): void {
    const dt = Math.min(0.05, this.clock.getDelta());
    this.resize();
    for (let i = this.tweens.length - 1; i >= 0; i--) if (this.tweens[i]!(dt)) this.tweens.splice(i, 1);
    for (const actor of this.actors.values()) {
      actor.mixer.update(dt);
      const target = THREE.MathUtils.degToRad(actor.yaw);
      actor.root.rotation.y += (target - actor.root.rotation.y) * Math.min(1, dt * 10);
    }
    // Camera: eased move to the current shot, a gentle sway, and shakes.
    if (this.camT < 1) {
      this.camT = Math.min(1, this.camT + dt / this.camDur);
      const u = smooth(this.camT);
      if (this.camFrom) {
        this.camera.position.lerpVectors(this.camFrom.pos, this.camTo.pos, u);
        this.look.lerpVectors(this.camFrom.look, this.camTo.look, u);
        this.camera.fov = THREE.MathUtils.lerp(this.camFrom.fov, this.camTo.fov, u);
        this.camera.updateProjectionMatrix();
      }
    }
    this.sway += dt;
    const base = this.camT >= 1 ? this.camTo.pos : this.camera.position;
    if (this.titleOrbit) {
      const a = 0.55 * Math.sin(this.sway * 0.16);
      const r = 3.6;
      this.camera.position.set(Math.sin(a) * r, 1.45, 4.4 + Math.cos(a) * r);
      this.look.set(0, 0.8, 4.4);
    } else if (this.camT >= 1) {
      this.camera.position.set(base.x + Math.sin(this.sway * 0.35) * 0.12, base.y + Math.sin(this.sway * 0.5) * 0.05, base.z);
    }
    const look = this.look.clone();
    if (this.shakeLeft > 0) {
      this.shakeLeft -= dt;
      const p = this.shakePower * clamp01(this.shakeLeft * 3);
      this.camera.position.x += (Math.random() - 0.5) * p * 2;
      this.camera.position.y += (Math.random() - 0.5) * p * 2;
    }
    this.camera.lookAt(look);
    const t = this.sway;
    this.torchLights.forEach((l, i) => (l.intensity = 14 * (0.85 + 0.1 * Math.sin(t * 11 + i * 1.7) + 0.05 * Math.sin(t * 23 + i))));
    this.renderer.render(this.scene, this.camera);
  }
}
