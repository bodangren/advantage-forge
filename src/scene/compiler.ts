import * as THREE from 'three';

import {
  applyPose,
  applyVariant,
  evaluateAssembly,
} from '../assembly/index.js';
import type {
  AssetDocument,
  Bounds,
  MaterialDefinition,
  Transform,
} from '../contracts/index.js';
import { generateGeometry } from '../geometry/index.js';

export interface CompiledThreeScene {
  readonly group: THREE.Group;
  readonly summary: ReturnType<typeof evaluateAssembly>;
  readonly bounds: THREE.Box3;
}

function applyTransform(object: THREE.Object3D, transform: Transform): void {
  object.position.fromArray(transform.position);
  object.quaternion.fromArray(transform.rotation);
  object.scale.fromArray(transform.scale);
}

function materialFor(
  definition: MaterialDefinition | undefined,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    name: definition?.id ?? 'material.missing',
    color: definition?.color ?? '#ff00ff',
    roughness: definition?.roughness ?? 1,
    metalness: definition?.metalness ?? 0,
    emissive: definition?.emissive ?? '#000000',
    side: THREE.DoubleSide,
  });
}

export function compileThreeScene(
  document: Readonly<AssetDocument>,
): CompiledThreeScene {
  const activeVariant = document.variants.find(
    ({ id }) => id === document.activeVariantId,
  );
  const activePose = document.poses.find(
    ({ id }) => id === document.activePoseId,
  );
  let assembly = document.assembly;
  if (activeVariant !== undefined)
    assembly = applyVariant(assembly, activeVariant);
  if (activePose !== undefined) assembly = applyPose(assembly, activePose);
  const summary = evaluateAssembly(assembly, document.templates);
  const templateById = new Map(
    document.templates.map((template) => [template.id, template]),
  );
  const summaryById = new Map(summary.parts.map((part) => [part.id, part]));
  const materialById = new Map(
    document.materials.map((material) => [material.id, material]),
  );
  const group = new THREE.Group();
  group.name = document.id;
  group.userData = {
    semanticId: document.id,
    assetId: document.id,
    kitId: document.kitId,
    schemaVersion: document.schemaVersion,
  };
  for (const part of [...assembly.parts].sort((left, right) =>
    left.id.localeCompare(right.id),
  )) {
    const template = templateById.get(part.templateId);
    const semantic = summaryById.get(part.id);
    if (template === undefined || semantic === undefined) continue;
    const indexed = generateGeometry(part.shape ?? template.shape);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(indexed.positions, 3),
    );
    geometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(indexed.normals, 3),
    );
    geometry.setIndex(indexed.indices);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const binding = part.materialBindings[0];
    const mesh = new THREE.Mesh(
      geometry,
      materialFor(materialById.get(binding?.materialId ?? '')),
    );
    mesh.name = part.id;
    mesh.visible = part.visible;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      semanticId: part.id,
      templateId: template.id,
      role: template.role,
      materialBindings: part.materialBindings,
    };
    applyTransform(mesh, semantic.worldTransform);
    group.add(mesh);
  }
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group);
  return { group, summary, bounds };
}

export function threeBounds(bounds: Bounds): THREE.Box3 {
  return new THREE.Box3(
    new THREE.Vector3(...bounds.min),
    new THREE.Vector3(...bounds.max),
  );
}

export function disposeCompiledScene(compiled: CompiledThreeScene): void {
  compiled.group.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const mesh = node as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.Material | THREE.Material[]
    >;
    mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) material.dispose();
  });
}
