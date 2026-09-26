import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { lowestPoint } from '../src/grounding.js';

// A 10 cm box skinned to one bone, with its bottom at y = 0.2 in the rest pose.
function skinnedBox(name: string, at: number) {
  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const n = geometry.getAttribute('position').count;
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Array(n * 4).fill(0), 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(Array.from({ length: n * 4 }, (_, i) => (i % 4 === 0 ? 1 : 0)), 4));
  geometry.translate(0, at + 0.05, 0);
  const bone = new THREE.Bone();
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
  mesh.name = name;
  mesh.add(bone);
  mesh.bind(new THREE.Skeleton([bone]));
  return { mesh, bone };
}

describe('lowestPoint', () => {
  it('finds the lowest posed point, and skips a mesh whose bone is scaled to 0', () => {
    const root = new THREE.Group();
    const body = skinnedBox('body', 0.2);
    const arrow = skinnedBox('arrow', 0.4);
    root.add(body.mesh, arrow.mesh);
    // The arrow drops 0.5 m: its bottom is 10 cm below the body's.
    arrow.bone.position.y = -0.5;
    expect(lowestPoint(root, [body.mesh, arrow.mesh])).toMatchObject({ part: 'arrow' });
    expect(lowestPoint(root, [body.mesh, arrow.mesh]).min).toBeCloseTo(-0.1, 5);
    // Hidden: it collapses toward the bone and no longer counts.
    arrow.bone.scale.setScalar(0.001);
    const r = lowestPoint(root, [body.mesh, arrow.mesh]);
    expect(r.part).toBe('body');
    expect(r.min).toBeCloseTo(0.2, 5);
  });
});
