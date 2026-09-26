import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * A photo studio for one asset: soft image-based light, a camera-relative key/fill/rim rig
 * (light always comes from the viewer's upper left, which keeps every view readable and matches
 * pixel-art convention), and a shadow-catching ground.
 */
export class Studio {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly perspective = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  readonly ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
  readonly ground: THREE.Mesh;
  private readonly key = new THREE.DirectionalLight(0xffffff, 2.4);
  private readonly fill = new THREE.DirectionalLight(0xdfe8ff, 0.55);
  private readonly rim = new THREE.DirectionalLight(0xffffff, 1.3);
  private readonly target = new THREE.Object3D();
  private asset: THREE.Object3D | null = null;
  readonly bounds = new THREE.Box3();

  constructor(canvas?: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      ...(canvas ? { canvas } : {}),
    });
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    this.scene.add(new THREE.HemisphereLight(0xf4f1ff, 0x5a5048, 0.5));

    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.radius = 4;
    this.key.shadow.bias = -0.0002;
    this.key.shadow.normalBias = 0.002;
    this.scene.add(this.target, this.key, this.fill, this.rim);
    for (const l of [this.key, this.fill, this.rim]) l.target = this.target;

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50).rotateX(-Math.PI / 2),
      new THREE.ShadowMaterial({ opacity: 0.28 }),
    );
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    this.setBackground('#aeb3ba');
  }

  setBackground(color: string | null): void {
    this.scene.background = color === null ? null : new THREE.Color(color);
    this.renderer.setClearColor(0x000000, color === null ? 0 : 1);
  }

  setAsset(object: THREE.Object3D): void {
    if (this.asset) this.scene.remove(this.asset);
    this.asset = object;
    object.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    this.scene.add(object);
    object.updateMatrixWorld(true);
    this.bounds.setFromObject(object);
    this.ground.position.y = this.bounds.min.y;
  }

  /** Radius of a sphere around the asset's bounds center. */
  get radius(): number {
    return this.bounds.getSize(new THREE.Vector3()).length() / 2;
  }

  get center(): THREE.Vector3 {
    return this.bounds.getCenter(new THREE.Vector3());
  }

  /**
   * Aim a camera from an azimuth/elevation (degrees). Azimuth 0 looks at the asset's front (+Z),
   * 90 looks at its left side (+X), 180 at its back.
   */
  aim(
    camera: THREE.Camera,
    center: THREE.Vector3,
    distance: number,
    azimuth: number,
    elevation: number,
  ): void {
    const az = THREE.MathUtils.degToRad(azimuth);
    const el = THREE.MathUtils.degToRad(elevation);
    camera.position.set(
      center.x + distance * Math.sin(az) * Math.cos(el),
      center.y + distance * Math.sin(el),
      center.z + distance * Math.cos(az) * Math.cos(el),
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(center);
    camera.updateMatrixWorld(true);
    this.placeLights(camera, center, Math.max(this.radius, 0.1));
  }

  /** Re-aim the camera-relative light rig (call every frame when the camera moves freely). */
  placeLights(camera: THREE.Camera, center: THREE.Vector3, r: number): void {
    // Build the rig in camera space so light direction is constant on screen.
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const toCam = new THREE.Vector3().subVectors(camera.position, center).normalize();
    const d = r * 6;
    const at = (x: number, y: number, z: number) =>
      center
        .clone()
        .addScaledVector(right, x * d)
        .addScaledVector(up, y * d)
        .addScaledVector(toCam, z * d);
    // Keep the key light above the ground plane so the shadow falls on the floor.
    const key = at(-0.55, 0.75, 0.75);
    key.y = Math.max(key.y, center.y + d * 0.55);
    this.key.position.copy(key);
    this.fill.position.copy(at(0.9, 0.1, 0.5));
    this.rim.position.copy(at(0.35, 0.8, -0.9));
    this.target.position.copy(center);
    this.target.updateMatrixWorld();
    const sc = this.key.shadow.camera;
    sc.left = -r * 1.6;
    sc.right = r * 1.6;
    sc.top = r * 1.6;
    sc.bottom = -r * 1.6;
    sc.near = d * 0.2;
    sc.far = d * 2.5;
    sc.updateProjectionMatrix();
  }

  render(camera: THREE.Camera, width: number, height: number): void {
    this.renderer.setSize(width, height, false);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, camera);
  }
}
