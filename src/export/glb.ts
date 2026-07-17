import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const TRANSFORM_TOLERANCE = 1e-5;
const MINIMUM_BOUNDS_TOLERANCE = 1e-5;
type Tuple3 = readonly [number, number, number];
const MATERIAL_TOLERANCE = 1e-5;

export interface GlbManifest {
  readonly format: 'glb';
  readonly byteLength: number;
  readonly nodeNames: readonly string[];
  readonly materialNames: readonly string[];
  readonly reloadNodeNames: readonly string[];
  readonly reloadMaterialNames: readonly string[];
  readonly materialPropertiesMatch: boolean;
  readonly materialPropertyMismatchNames: readonly string[];
  readonly maximumMaterialPropertyDeviation: number;
  readonly materialPropertyTolerance: number;
  readonly materialNamesMatch: boolean;
  readonly semanticNodeCount: number;
  readonly reloadSemanticNodeCount: number;
  readonly missingSemanticNodeNames: readonly string[];
  readonly unexpectedSemanticNodeNames: readonly string[];
  readonly transformMismatchCount: number;
  readonly scaleMismatchCount: number;
  readonly maximumPositionDeviation: number;
  readonly maximumRotationDeviationRadians: number;
  readonly maximumScaleDeviation: number;
  readonly transformTolerance: number;
  readonly bounds: {
    readonly sourceMin: Tuple3;
    readonly sourceMax: Tuple3;
    readonly reloadMin: Tuple3;
    readonly reloadMax: Tuple3;
    readonly maximumDeviation: number;
    readonly tolerance: number;
    readonly matches: boolean;
  };
  readonly unitScaleDeviation: number;
  readonly unitScaleTolerance: number;
  readonly textureCount: number;
  readonly unsupportedMaterialCount: number;
  readonly unsupportedShaderCount: number;
  readonly skinCount: number;
  readonly cameraCount: number;
  readonly lightCount: number;
  readonly animationCount: number;
  readonly unit: 'meter';
}

interface TransformEvidence {
  readonly position: THREE.Vector3;
  readonly rotation: THREE.Quaternion;
  readonly scale: THREE.Vector3;
}

interface SceneEvidence {
  readonly nodeNames: readonly string[];
  readonly materialNames: readonly string[];
  readonly standardMaterials: ReadonlyMap<string, THREE.MeshStandardMaterial>;
  readonly semanticTransforms: ReadonlyMap<string, TransformEvidence>;
  readonly bounds: THREE.Box3;
  readonly textureCount: number;
  readonly unsupportedMaterialCount: number;
  readonly unsupportedShaderCount: number;
  readonly skinCount: number;
  readonly cameraCount: number;
  readonly lightCount: number;
}

function tuple3(vector: THREE.Vector3): Tuple3 {
  return [vector.x, vector.y, vector.z];
}

function maximumComponentDelta(
  left: THREE.Vector3,
  right: THREE.Vector3,
): number {
  return Math.max(
    Math.abs(left.x - right.x),
    Math.abs(left.y - right.y),
    Math.abs(left.z - right.z),
  );
}

function maximumColorDelta(left: THREE.Color, right: THREE.Color): number {
  return Math.max(
    Math.abs(left.r - right.r),
    Math.abs(left.g - right.g),
    Math.abs(left.b - right.b),
  );
}

export function standardMaterialPropertyDeviation(
  left: THREE.MeshStandardMaterial,
  right: THREE.MeshStandardMaterial,
): number {
  const categoricalMismatch =
    left.transparent !== right.transparent || left.side !== right.side;
  return Math.max(
    categoricalMismatch ? 1 : 0,
    maximumColorDelta(left.color, right.color),
    maximumColorDelta(left.emissive, right.emissive),
    Math.abs(left.roughness - right.roughness),
    Math.abs(left.metalness - right.metalness),
    Math.abs(left.opacity - right.opacity),
    Math.abs(left.alphaTest - right.alphaTest),
  );
}

function collectSceneEvidence(root: THREE.Object3D): SceneEvidence {
  root.updateMatrixWorld(true);
  const nodeNames = new Set<string>();
  const materialNames = new Set<string>();
  const standardMaterials = new Map<string, THREE.MeshStandardMaterial>();
  const semanticTransforms = new Map<string, TransformEvidence>();
  const textureIds = new Set<string>();
  const materials = new Set<THREE.Material>();
  const bounds = new THREE.Box3();
  let hasBounds = false;
  let unsupportedMaterialCount = 0;
  let unsupportedShaderCount = 0;
  let skinCount = 0;
  let cameraCount = 0;
  let lightCount = 0;

  root.traverseVisible((node) => {
    const semanticId: unknown = node.userData['semanticId'];
    if (typeof semanticId === 'string') {
      nodeNames.add(semanticId);
      const position = new THREE.Vector3();
      const rotation = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      node.matrixWorld.decompose(position, rotation, scale);
      semanticTransforms.set(semanticId, { position, rotation, scale });
    } else if (node.name) nodeNames.add(node.name);
    if (node instanceof THREE.Camera) cameraCount += 1;
    if (node instanceof THREE.Light) lightCount += 1;
    if (!(node instanceof THREE.Mesh)) return;
    if (node instanceof THREE.SkinnedMesh) skinCount += 1;
    const mesh = node as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.Material | THREE.Material[]
    >;
    mesh.geometry.computeBoundingBox();
    if (mesh.geometry.boundingBox !== null) {
      const meshBounds = mesh.geometry.boundingBox
        .clone()
        .applyMatrix4(mesh.matrixWorld);
      if (hasBounds) bounds.union(meshBounds);
      else {
        bounds.copy(meshBounds);
        hasBounds = true;
      }
    }
    const nodeMaterials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of nodeMaterials) {
      if (materials.has(material)) continue;
      materials.add(material);
      if (material.name) materialNames.add(material.name);
      if (material.name && material instanceof THREE.MeshStandardMaterial)
        standardMaterials.set(material.name, material);
      if (!(material instanceof THREE.MeshStandardMaterial))
        unsupportedMaterialCount += 1;
      if (
        material instanceof THREE.ShaderMaterial ||
        material instanceof THREE.RawShaderMaterial
      )
        unsupportedShaderCount += 1;
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture) textureIds.add(value.uuid);
    }
  });
  if (!hasBounds) bounds.makeEmpty();
  return {
    nodeNames: [...nodeNames].sort(),
    materialNames: [...materialNames].sort(),
    standardMaterials,
    semanticTransforms,
    bounds,
    textureCount: textureIds.size,
    unsupportedMaterialCount,
    unsupportedShaderCount,
    skinCount,
    cameraCount,
    lightCount,
  };
}

export async function exportSceneToGlb(
  scene: THREE.Object3D,
): Promise<{ readonly bytes: ArrayBuffer; readonly manifest: GlbManifest }> {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(scene, {
    binary: true,
    onlyVisible: true,
    trs: true,
  });
  if (!(result instanceof ArrayBuffer))
    throw new Error('Binary glTF export did not return an ArrayBuffer.');
  const reloaded = await new GLTFLoader().parseAsync(result, '');
  const source = collectSceneEvidence(scene);
  const reload = collectSceneEvidence(reloaded.scene);
  const sourceIds = [...source.semanticTransforms.keys()].sort();
  const reloadIds = [...reload.semanticTransforms.keys()].sort();
  const missingSemanticNodeNames = sourceIds.filter(
    (id) => !reload.semanticTransforms.has(id),
  );
  const unexpectedSemanticNodeNames = reloadIds.filter(
    (id) => !source.semanticTransforms.has(id),
  );

  let transformMismatchCount = 0;
  let scaleMismatchCount = 0;
  let maximumPositionDeviation = 0;
  let maximumRotationDeviationRadians = 0;
  let maximumScaleDeviation = 0;
  for (const id of sourceIds) {
    const left = source.semanticTransforms.get(id);
    const right = reload.semanticTransforms.get(id);
    if (left === undefined || right === undefined) continue;
    const positionDeviation = maximumComponentDelta(
      left.position,
      right.position,
    );
    const rotationDeviation = left.rotation.angleTo(right.rotation);
    const scaleDeviation = maximumComponentDelta(left.scale, right.scale);
    maximumPositionDeviation = Math.max(
      maximumPositionDeviation,
      positionDeviation,
    );
    maximumRotationDeviationRadians = Math.max(
      maximumRotationDeviationRadians,
      rotationDeviation,
    );
    maximumScaleDeviation = Math.max(maximumScaleDeviation, scaleDeviation);
    if (
      positionDeviation > TRANSFORM_TOLERANCE ||
      rotationDeviation > TRANSFORM_TOLERANCE
    )
      transformMismatchCount += 1;
    if (scaleDeviation > TRANSFORM_TOLERANCE) scaleMismatchCount += 1;
  }

  const sourceSize = source.bounds.getSize(new THREE.Vector3());
  const reloadSize = reload.bounds.getSize(new THREE.Vector3());
  const extent = Math.max(sourceSize.x, sourceSize.y, sourceSize.z);
  const boundsTolerance = Math.max(
    MINIMUM_BOUNDS_TOLERANCE,
    extent * TRANSFORM_TOLERANCE,
  );
  const boundsMaximumDeviation = Math.max(
    maximumComponentDelta(source.bounds.min, reload.bounds.min),
    maximumComponentDelta(source.bounds.max, reload.bounds.max),
  );
  const unitScaleDeviation = maximumComponentDelta(sourceSize, reloadSize);
  const materialNamesMatch =
    JSON.stringify(source.materialNames) ===
    JSON.stringify(reload.materialNames);
  const materialPropertyDeviations = [
    ...new Set([
      ...source.standardMaterials.keys(),
      ...reload.standardMaterials.keys(),
    ]),
  ]
    .sort()
    .map((name) => {
      const sourceMaterial = source.standardMaterials.get(name);
      const reloadMaterial = reload.standardMaterials.get(name);
      return {
        name,
        deviation:
          sourceMaterial === undefined || reloadMaterial === undefined
            ? 1
            : standardMaterialPropertyDeviation(sourceMaterial, reloadMaterial),
      };
    });
  const materialPropertyMismatchNames = materialPropertyDeviations
    .filter(({ deviation }) => deviation > MATERIAL_TOLERANCE)
    .map(({ name }) => name);
  const maximumMaterialPropertyDeviation = materialPropertyDeviations.reduce(
    (maximum, { deviation }) => Math.max(maximum, deviation),
    0,
  );
  const materialPropertiesMatch = materialPropertyMismatchNames.length === 0;
  const animationCount = reloaded.animations.length;
  const policyFailures: string[] = [];
  if (missingSemanticNodeNames.length > 0)
    policyFailures.push('missing semantic nodes');
  if (unexpectedSemanticNodeNames.length > 0)
    policyFailures.push('unexpected semantic nodes');
  if (transformMismatchCount > 0) policyFailures.push('transform mismatch');
  if (scaleMismatchCount > 0) policyFailures.push('scale mismatch');
  if (!materialNamesMatch) policyFailures.push('material-name mismatch');
  if (!materialPropertiesMatch)
    policyFailures.push('material-property mismatch');
  if (boundsMaximumDeviation > boundsTolerance)
    policyFailures.push('bounds mismatch');
  if (unitScaleDeviation > boundsTolerance)
    policyFailures.push('unit-scale mismatch');
  if (animationCount > 0) policyFailures.push('animations');
  if (reload.textureCount > 0) policyFailures.push('textures');
  if (reload.unsupportedMaterialCount > 0)
    policyFailures.push('unsupported materials');
  if (reload.unsupportedShaderCount > 0)
    policyFailures.push('unsupported shaders');
  if (reload.skinCount > 0) policyFailures.push('skins');
  if (reload.cameraCount > 0) policyFailures.push('cameras');
  if (reload.lightCount > 0) policyFailures.push('lights');
  if (policyFailures.length > 0)
    throw new Error(
      `Reloaded GLB violates the export policy: ${policyFailures.join(', ')}.`,
    );

  return {
    bytes: result,
    manifest: {
      format: 'glb',
      byteLength: result.byteLength,
      nodeNames: source.nodeNames,
      materialNames: source.materialNames,
      unit: 'meter',
      reloadNodeNames: reload.nodeNames,
      reloadMaterialNames: reload.materialNames,
      materialNamesMatch,
      materialPropertiesMatch,
      materialPropertyMismatchNames,
      maximumMaterialPropertyDeviation,
      materialPropertyTolerance: MATERIAL_TOLERANCE,
      semanticNodeCount: sourceIds.length,
      reloadSemanticNodeCount: reloadIds.length,
      missingSemanticNodeNames,
      unexpectedSemanticNodeNames,
      transformMismatchCount,
      scaleMismatchCount,
      maximumPositionDeviation,
      maximumRotationDeviationRadians,
      maximumScaleDeviation,
      transformTolerance: TRANSFORM_TOLERANCE,
      bounds: {
        sourceMin: tuple3(source.bounds.min),
        sourceMax: tuple3(source.bounds.max),
        reloadMin: tuple3(reload.bounds.min),
        reloadMax: tuple3(reload.bounds.max),
        maximumDeviation: boundsMaximumDeviation,
        tolerance: boundsTolerance,
        matches: boundsMaximumDeviation <= boundsTolerance,
      },
      unitScaleDeviation,
      unitScaleTolerance: boundsTolerance,
      textureCount: reload.textureCount,
      unsupportedMaterialCount: reload.unsupportedMaterialCount,
      unsupportedShaderCount: reload.unsupportedShaderCount,
      skinCount: reload.skinCount,
      cameraCount: reload.cameraCount,
      lightCount: reload.lightCount,
      animationCount,
    },
  };
}

export function downloadGlb(bytes: ArrayBuffer, fileName: string): void {
  const url = URL.createObjectURL(
    new Blob([bytes], { type: 'model/gltf-binary' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName.replace(/[^a-z0-9._-]/gi, '-');
  anchor.click();
  URL.revokeObjectURL(url);
}
