import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { MeshData } from '../sdf/mesher.js';
import { computeTangents } from './tangents.js';

/** A mesh with a UV layout in the shared atlas. */
export interface UvMesh extends MeshData {
  /** UVs in [0, 1], origin at the top-left of the image (glTF convention). */
  readonly uvs: Float32Array;
  /** Tangents as xyz + handedness w. */
  readonly tangents: Float32Array;
}

interface XAtlasApi {
  createAtlas(): void;
  addMesh(
    indexes: Uint16Array,
    vertices: Float32Array,
    normals: Float32Array,
    coords: null,
    id: string,
    useNormals: boolean,
    useCoords: boolean,
    scale: number,
  ): unknown;
  generateAtlas(
    chart: Record<string, number | boolean>,
    pack: Record<string, number | boolean>,
    returnMeshes: boolean,
  ): {
    width: number;
    height: number;
    atlasCount: number;
    meshes: {
      index: Uint16Array;
      vertexCount: number;
      oldIndexes: Uint16Array;
      vertex: { coords1: Float32Array };
    }[];
  };
  destroyAtlas(): void;
}

let api: Promise<XAtlasApi> | null = null;

function loadXAtlas(): Promise<XAtlasApi> {
  api ??= (async () => {
    const require = createRequire(import.meta.url);
    const dir = join(dirname(require.resolve('xatlasjs/package.json')), 'dist', 'node');
    const createModule = require(join(dir, 'xatlas.js')) as unknown;
    const { Api } = (await import(join(dir, 'api.mjs'))) as {
      Api: (m: unknown) => new (onLoad: () => void, locate: (p: string) => string) => XAtlasApi;
    };
    const Xatlas = Api(createModule);
    return new Promise<XAtlasApi>((resolve) => {
      const instance: XAtlasApi = new Xatlas(
        () => resolve(instance),
        (p) => join(dir, p),
      );
    });
  })();
  return api;
}

/**
 * Unwrap several meshes into one shared texture atlas (xatlas: segmentation into charts,
 * conformal parameterization, packing). Every output mesh has UVs and tangents.
 * `padding` is in texels of a `size` x `size` image.
 */
export async function unwrap(
  meshes: readonly MeshData[],
  size: number,
  padding = 4,
  /** Relative texel density per mesh (2 = twice the texels per meter). */
  density: readonly number[] = [],
  tuning: { chart?: Record<string, number | boolean>; pack?: Record<string, number | boolean> } = {},
): Promise<UvMesh[]> {
  for (const m of meshes)
    if (m.positions.length / 3 > 60_000)
      throw new Error(
        'A body has more than 60,000 vertices, which is too many to unwrap. Raise its maxError.',
      );
  const xa = await loadXAtlas();
  xa.createAtlas();
  meshes.forEach((m, i) =>
    xa.addMesh(
      new Uint16Array(m.indices),
      m.positions,
      m.normals,
      null,
      String(i),
      true,
      false,
      density[i] ?? 1,
    ),
  );
  const atlas = xa.generateAtlas(
    { maxIterations: 1, ...tuning.chart },
    { resolution: size, padding, bilinear: true, rotateCharts: true, blockAlign: false, ...tuning.pack },
    true,
  );
  if (atlas.atlasCount !== 1) throw new Error(`Unwrap produced ${atlas.atlasCount} atlases; expected one.`);
  const result = atlas.meshes.map((out, i) => {
    const src = meshes[i]!;
    const n = out.vertexCount;
    const positions = new Float32Array(n * 3);
    const normals = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    for (let v = 0; v < n; v++) {
      const o = out.oldIndexes[v]!;
      positions.set(src.positions.subarray(o * 3, o * 3 + 3), v * 3);
      normals.set(src.normals.subarray(o * 3, o * 3 + 3), v * 3);
      colors.set(src.colors.subarray(o * 3, o * 3 + 3), v * 3);
    }
    const uvs = new Float32Array(out.vertex.coords1);
    const indices = new Uint32Array(out.index);
    return {
      positions,
      normals,
      colors,
      uvs,
      indices,
      tangents: computeTangents(positions, normals, uvs, indices),
    };
  });
  xa.destroyAtlas();
  return result;
}
