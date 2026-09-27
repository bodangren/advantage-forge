import * as THREE from 'three';

/** Build a painted tile top with exact square edges and upward normals. */
export function tileSurface(
  name: string,
  paint: (x: number, z: number) => readonly [number, number, number],
  segments = 48,
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(2, 2, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    const color = paint(positions.getX(i), positions.getZ(i));
    colors[i * 3] = color[0];
    colors[i * 3 + 1] = color[1];
    colors[i * 3 + 2] = color[2];
    positions.setY(i, 0.081);
  }
  positions.needsUpdate = true;
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }),
  );
  mesh.name = name;
  mesh.receiveShadow = true;
  return mesh;
}
