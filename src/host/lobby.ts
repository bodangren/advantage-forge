/**
 * The 3D backdrop behind the selector: the three heroes on a torch-lit stone dais, in the
 * student's unlocked colors, with the camera swinging slowly in front. It loads only the heroes
 * and a brazier; the models stay cached for the games.
 */
import * as THREE from 'three';
import { Actor, OrbitRig, type Stage3D } from '../apk3d/stage/index.js';

const HEROES = ['wizard', 'knight', 'cleric'] as const;
const SPOTS: Record<(typeof HEROES)[number], [number, number, number]> = { wizard: [-1.05, 0.12, -0.35], knight: [0, 0.12, 0.15], cleric: [1.05, 0.12, -0.35] };
const model = (name: string): string => `models/${name}.glb`;
/** The chosen hero turns on the dais this fast, in degrees per second. */
const TURN = 42;
const restYaw = (id: (typeof HEROES)[number]): number => SPOTS[id][0] * -8;

export class Lobby {
  private readonly actors = new Map<string, Actor>();
  /** The hero on the turntable, if any. */
  private turning: Actor | null = null;
  /** Counts moves per hero: a newer move cancels an older tween that is still running. */
  private readonly moves = new Map<string, number>();
  /** Wide screens: a slow swing in front of the dais. Phones: closer, for the low band above the panel. */
  private readonly wide = new OrbitRig([0, 0.85, 0], 4.2, 1.5, 0.45, 0.14, 38);
  private readonly close = new OrbitRig([0, 0.6, -0.1], 2.5, 1.05, 0.35, 0.14, 30);

  constructor(private readonly stage: Stage3D) {}

  /** Loads the models; `progress` gets 0 to 1. */
  load(progress: (p: number) => void): Promise<unknown> {
    return this.stage.loader.preload([...HEROES.map(model), model('brazier')], progress);
  }

  /** Builds the scene on the (cleared) page stage. */
  show(looks: Readonly<Record<string, string>>): void {
    const stage = this.stage;
    stage.clear({ background: '#141a2e', fog: [7, 16], exposure: 1.25 });
    const scene = stage.scene;
    scene.add(new THREE.HemisphereLight(0xa9b8ff, 0x2a2238, 1.1));
    stage.addSun(0xffe2b8, 1.3, [2.5, 6, 5], [0, 0.5, 0], 4);
    const stone = new THREE.MeshStandardMaterial({ color: 0x4a4f63, roughness: 0.95 });
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 0.24, 48), stone);
    dais.position.y = 0;
    dais.receiveShadow = true;
    const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 40), new THREE.MeshStandardMaterial({ color: 0x1d2236, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(dais, ground);
    const brazier = stage.loader.get(model('brazier'));
    for (const x of [-2.0, 2.0]) {
      if (brazier) {
        const b = brazier.scene.clone();
        b.position.set(x, 0.12, -1.0);
        scene.add(b);
      }
      const fire = new THREE.PointLight(0xff9a3c, 9, 7, 1.6);
      fire.position.set(x, 1.2, -0.9);
      scene.add(fire);
      stage.onFrame((_dt, t) => (fire.intensity = 9 * (0.85 + 0.1 * Math.sin(t * 11 + x) + 0.05 * Math.sin(t * 23 + x))));
    }
    this.actors.clear();
    this.turning = null;
    this.moves.clear();
    stage.onFrame((dt) => {
      if (this.turning) this.turning.yaw += TURN * dt;
    });
    HEROES.forEach((id, i) => {
      const g = stage.loader.get(model(id));
      if (!g) return;
      const actor = stage.addActor(new Actor(id, g, stage.timeline, { phase: i * 0.37 }));
      const [x, y, z] = SPOTS[id];
      actor.placeAt(x, y, z, restYaw(id));
      this.actors.set(id, actor);
    });
    void this.setLooks(looks);
    stage.setRig(this.wide);
  }

  /** Frames the heroes in a part of the screen (fractions [x0, y0, x1, y1]); `band` is a low, wide strip. */
  frame(region: readonly [number, number, number, number], band = false): void {
    this.stage.setFreeArea(region);
    this.stage.setRig(band ? this.close : this.wide);
  }

  /**
   * The chosen hero steps to the middle of the dais and turns on it (a turntable). The others step
   * back, stop turning, and face the middle again.
   */
  focus(hero: string): void {
    this.turning = null;
    // The two heroes that are not chosen take the left and right places, never the middle.
    const sides = HEROES.filter((id) => id !== hero);
    for (const [id, actor] of this.actors) {
      const key = id as (typeof HEROES)[number];
      const [, y, z] = SPOTS[key];
      const chosen = id === hero;
      const side = sides.indexOf(key) === 0 ? -1 : 1;
      const to = new THREE.Vector3(chosen ? 0 : side * 1.1, y, chosen ? 0.3 : z - 0.15);
      const from = actor.root.position.clone();
      const move = (this.moves.get(id) ?? 0) + 1;
      this.moves.set(id, move);
      if (!chosen) {
        // Unwind the turns so the hero faces its rest direction by the shortest way.
        const rest = THREE.MathUtils.degToRad(restYaw(key));
        const turned = actor.root.rotation.y - rest;
        actor.root.rotation.y = rest + Math.atan2(Math.sin(turned), Math.cos(turned));
        actor.yaw = restYaw(key);
      } else {
        actor.yaw = THREE.MathUtils.radToDeg(actor.root.rotation.y);
      }
      void this.stage.timeline.tween(0.45, (u) => {
        if (this.moves.get(id) !== move) return;
        actor.root.position.lerpVectors(from, to, u * u * (3 - 2 * u));
        actor.home.copy(actor.root.position);
      });
    }
    this.turning = this.actors.get(hero) ?? null;
    this.cheer(hero);
  }

  /** A hero cheers (a look chosen, a game picked). */
  cheer(hero?: string): void {
    const list = hero ? [this.actors.get(hero)] : [...this.actors.values()];
    for (const a of list) if (a?.has('victory')) void a.play('victory');
  }

  async setLooks(looks: Readonly<Record<string, string>>): Promise<void> {
    for (const [hero, actor] of this.actors) {
      const look = looks[hero];
      actor.setMap(look && look !== 'default' ? await this.stage.loader.texture(`models/${hero}/${look}.webp`).catch(() => null) : null);
    }
  }
}
