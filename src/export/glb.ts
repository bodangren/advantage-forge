import type * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface GlbManifest {
  readonly format: 'glb';
  readonly byteLength: number;
  readonly nodeNames: readonly string[];
  readonly materialNames: readonly string[];
  readonly reloadNodeNames: readonly string[];
  readonly animationCount: number;
  readonly unit: 'meter';
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
  const reloadNodeNames: string[] = [];
  reloaded.scene.traverse((node) => {
    const semanticId: unknown = node.userData['semanticId'];
    if (typeof semanticId === 'string') reloadNodeNames.push(semanticId);
    else if (node.name) reloadNodeNames.push(node.name);
  });
  const nodeNames: string[] = [];
  const materialNames = new Set<string>();
  scene.traverse((node) => {
    if (node.name) nodeNames.push(node.name);
    const candidate = node as THREE.Mesh;
    if (!('material' in candidate)) return;
    const materials = Array.isArray(candidate.material)
      ? candidate.material
      : [candidate.material];
    for (const material of materials)
      if (material?.name) materialNames.add(material.name);
  });
  return {
    bytes: result,
    manifest: {
      format: 'glb',
      byteLength: result.byteLength,
      nodeNames: nodeNames.sort(),
      materialNames: [...materialNames].sort(),
      unit: 'meter',
      reloadNodeNames: reloadNodeNames.sort(),
      animationCount: reloaded.animations.length,
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
