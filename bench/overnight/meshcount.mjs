// Counts meshes in out/<name>/<name>.glb; prints EMPTY for a GLB with no mesh.
//   node bench/overnight/meshcount.mjs <name> [...]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const root = new URL('../../out/', import.meta.url).pathname;
for (const n of process.argv.slice(2)) {
  try {
    const doc = await io.read(`${root}${n}/${n}.glb`);
    const k = doc.getRoot().listMeshes().length;
    console.log(k === 0 ? 'EMPTY' : 'ok', n, k);
  } catch (e) {
    console.log('ERR', n, e.message.slice(0, 80));
  }
}
