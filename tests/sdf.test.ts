import { describe, expect, it } from 'vitest';
import { box, cone, ellipsoid, smoothSubtract, smoothUnion, sphere, subtract } from '../src/sdf/core.js';
import { meshSdf } from '../src/sdf/mesher.js';

describe('sdf primitives', () => {
  it('measures exact distances for spheres and boxes', () => {
    expect(sphere(1).dist(2, 0, 0)).toBeCloseTo(1);
    expect(sphere(1).dist(0, 0, 0)).toBeCloseTo(-1);
    expect(box([2, 2, 2]).dist(3, 0, 0)).toBeCloseTo(2);
    expect(box([2, 2, 2], 0.5).dist(0, 2, 0)).toBeCloseTo(1);
  });

  it('applies transforms in world space', () => {
    const s = sphere(0.5).at(1, 2, 3);
    expect(s.dist(1, 2, 3)).toBeCloseTo(-0.5);
    const r = box([2, 0.2, 0.2]).rotate(0, 0, 90);
    expect(r.dist(0, 0.95, 0)).toBeLessThan(0);
    expect(r.dist(0.95, 0, 0)).toBeGreaterThan(0);
  });

  it('keeps ellipsoid and cone surfaces where expected', () => {
    expect(ellipsoid([1, 2, 3]).dist(0, 2, 0)).toBeCloseTo(0, 5);
    const c = cone([0, 0, 0], [0, 1, 0], 0.3, 0.1);
    expect(c.dist(0.3, 0, 0)).toBeCloseTo(0, 5);
    expect(c.dist(0, 1.1, 0)).toBeCloseTo(0, 5);
  });

  it('reports the true distance inside a carved-away region', () => {
    // A bowl: the top of a sphere removed by another sphere. p is in the removed material,
    // 0.4 m inside the cutter.
    const base = sphere(1);
    const cutter = sphere(1).at(0, 1.5, 0);
    const p = [0, 0.9, 0] as const;
    expect(base.dist(...p)).toBeLessThan(0);
    expect(subtract(base, cutter).dist(...p)).toBeCloseTo(0.4, 5);
    expect(smoothSubtract(0.05, base, cutter).dist(...p)).toBeCloseTo(0.4, 5);
    // q is above the base (0.2 m) but 0.7 m inside the cutter: the nearest bowl surface is the
    // cut face, so the value must come from the cutter, not from the removed base.
    const q = [0, 1.2, 0] as const;
    expect(base.dist(...q)).toBeGreaterThan(0);
    expect(subtract(base, cutter).dist(...q)).toBeCloseTo(0.7, 5);
  });

  it('divides a steep displacement by its Lipschitz bound without moving the surface', () => {
    const plain = sphere(1).displace(0.1, () => -1);
    const scaled = sphere(1).displace(0.1, () => -1, 2);
    expect(plain.dist(2, 0, 0)).toBeCloseTo(0.9);
    expect(scaled.dist(2, 0, 0)).toBeCloseTo(0.45);
    expect(scaled.dist(1.1, 0, 0)).toBeCloseTo(0);
    expect(Math.sign(scaled.dist(1.05, 0, 0))).toBe(-1);
  });

  it('smooth union adds material between shapes', () => {
    const a = sphere(0.5).at(-0.45, 0, 0);
    const b = sphere(0.5).at(0.45, 0, 0);
    const u = smoothUnion(0.2, a, b);
    expect(u.dist(0, 0.3, 0)).toBeLessThan(Math.min(a.dist(0, 0.3, 0), b.dist(0, 0.3, 0)));
  });
});

describe('mesher', () => {
  it('meshes a sphere close to its true surface with outward normals', async () => {
    const { mesh, stats } = await meshSdf(sphere(0.5), { cellSize: 0.02, baseColor: [1, 1, 1] });
    expect(stats.triangles).toBeGreaterThan(200);
    expect(stats.triangles).toBeLessThan(stats.rawTriangles);
    for (let v = 0; v < mesh.positions.length; v += 3) {
      const r = Math.hypot(mesh.positions[v]!, mesh.positions[v + 1]!, mesh.positions[v + 2]!);
      expect(Math.abs(r - 0.5)).toBeLessThan(0.002);
      const dot =
        (mesh.positions[v]! * mesh.normals[v]! +
          mesh.positions[v + 1]! * mesh.normals[v + 1]! +
          mesh.positions[v + 2]! * mesh.normals[v + 2]!) /
        r;
      expect(dot).toBeGreaterThan(0.99);
    }
    // Triangle winding must agree with the outward normals.
    const p = mesh.positions;
    let agree = 0;
    const tri = mesh.indices.length / 3;
    for (let t = 0; t < tri; t++) {
      const [a, b, c] = [
        mesh.indices[t * 3]! * 3,
        mesh.indices[t * 3 + 1]! * 3,
        mesh.indices[t * 3 + 2]! * 3,
      ];
      const ux = p[b]! - p[a]!,
        uy = p[b + 1]! - p[a + 1]!,
        uz = p[b + 2]! - p[a + 2]!;
      const vx = p[c]! - p[a]!,
        vy = p[c + 1]! - p[a + 1]!,
        vz = p[c + 2]! - p[a + 2]!;
      const nx = uy * vz - uz * vy,
        ny = uz * vx - ux * vz,
        nz = ux * vy - uy * vx;
      if (nx * p[a]! + ny * p[a + 1]! + nz * p[a + 2]! > 0) agree++;
    }
    expect(agree / tri).toBeGreaterThan(0.99);
  });

  it('carries paint into vertex colors', async () => {
    const shape = sphere(0.5).paintWhere(sphere(0.2).at(0, 0.5, 0), '#ff0000');
    const { mesh } = await meshSdf(shape, { cellSize: 0.02, baseColor: [0, 0, 1] });
    let red = 0;
    for (let v = 0; v < mesh.colors.length; v += 3) if (mesh.colors[v]! > 0.9) red++;
    expect(red).toBeGreaterThan(0);
    expect(red).toBeLessThan(mesh.colors.length / 3 / 4);
  });
});

describe('mesher on blended, painted shapes', () => {
  it('keeps every reduced triangle on the surface and facing outward', async () => {
    const shape = smoothUnion(
      0.08,
      sphere(0.3).at(0, 0.3, 0),
      sphere(0.18).at(0, 0.7, 0),
      cone([-0.3, 0.45, 0], [0.3, 0.45, 0], 0.06, 0.06),
    ).paintWhere(sphere(0.05).at(0.06, 0.74, 0.17), '#111111');
    const { mesh, stats } = await meshSdf(shape, { cellSize: 0.006, baseColor: [0.8, 0.4, 0.3] });
    expect(stats.triangles).toBeLessThan(stats.rawTriangles / 5);
    const p = mesh.positions;
    const n = mesh.normals;
    const idx = mesh.indices;
    for (let t = 0; t < idx.length; t += 3) {
      const [a, b, c] = [idx[t]! * 3, idx[t + 1]! * 3, idx[t + 2]! * 3];
      const cx = (p[a]! + p[b]! + p[c]!) / 3;
      const cy = (p[a + 1]! + p[b + 1]! + p[c + 1]!) / 3;
      const cz = (p[a + 2]! + p[b + 2]! + p[c + 2]!) / 3;
      expect(Math.abs(shape.dist(cx, cy, cz))).toBeLessThan(0.006);
      const ux = p[b]! - p[a]!,
        uy = p[b + 1]! - p[a + 1]!,
        uz = p[b + 2]! - p[a + 2]!;
      const vx = p[c]! - p[a]!,
        vy = p[c + 1]! - p[a + 1]!,
        vz = p[c + 2]! - p[a + 2]!;
      const facing =
        (uy * vz - uz * vy) * (n[a]! + n[b]! + n[c]!) +
        (uz * vx - ux * vz) * (n[a + 1]! + n[b + 1]! + n[c + 1]!) +
        (ux * vy - uy * vx) * (n[a + 2]! + n[b + 2]! + n[c + 2]!);
      expect(facing).toBeGreaterThanOrEqual(0);
    }
  });

  it('turns hard paint edges into exact seams', async () => {
    const shape = sphere(0.3).paintWhere(sphere(0.1).at(0, 0, 0.3), '#000000');
    const { mesh } = await meshSdf(shape, { cellSize: 0.01, baseColor: [1, 1, 1] });
    // Every seam vertex sits on the stencil boundary, not on the grid.
    let seam = 0;
    for (let v = 0; v < mesh.positions.length; v += 3) {
      const d = Math.hypot(mesh.positions[v]!, mesh.positions[v + 1]!, mesh.positions[v + 2]! - 0.3) - 0.1;
      const dark = mesh.colors[v]! < 0.5;
      if (Math.abs(d) < 0.001) seam++;
      else expect(dark).toBe(d < 0);
    }
    expect(seam).toBeGreaterThan(20);
  });
});

describe('profiles', () => {
  it('keeps tabulated polygon distances within a fraction of a millimeter', async () => {
    const { polygon, revolve } = await import('../src/sdf/profile.js');
    const square = polygon([
      [-0.1, -0.1],
      [0.1, -0.1],
      [0.1, 0.1],
      [-0.1, 0.1],
    ]);
    for (let i = 0; i < 2000; i++) {
      const u = (Math.random() - 0.5) * 0.3;
      const v = (Math.random() - 0.5) * 0.3;
      const qx = Math.abs(u) - 0.1;
      const qy = Math.abs(v) - 0.1;
      const exact = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
      expect(Math.abs(square.dist(u, v) - exact)).toBeLessThan(0.0003);
    }
    const disc = revolve(
      polygon([
        [0, -0.05],
        [0.2, -0.05],
        [0.2, 0.05],
        [0, 0.05],
      ]),
    );
    expect(disc.dist(0.25, 0, 0)).toBeCloseTo(0.05, 3);
    expect(disc.dist(0, 0.1, 0.1)).toBeCloseTo(0.05, 3);
  });
});

describe('surface probes', () => {
  it('finds hits, normals, and nearest points', async () => {
    const { raycast, normalAt, surfacePoint } = await import('../src/sdf/probe.js');
    const s = smoothUnion(0.05, sphere(0.3), box([0.2, 0.8, 0.2]));
    const hit = raycast(sphere(0.5).at(0, 1, 0), [0, 3, 0], [0, -1, 0])!;
    expect(hit[1]).toBeCloseTo(1.5, 4);
    expect(raycast(sphere(0.5), [2, 2, 2], [1, 0, 0])).toBeNull();
    const top = raycast(s, [0, 2, 0], [0, -1, 0])!;
    expect(top[1]).toBeCloseTo(0.4, 3);
    const n = normalAt(sphere(1), [0, 1, 0]);
    expect(n[1]).toBeCloseTo(1, 4);
    const q = surfacePoint(sphere(1), [0.2, 0.3, 0.1], 0.1);
    expect(Math.hypot(...q)).toBeCloseTo(1.1, 4);
  });
});

describe('noise', () => {
  it('worley gives ordered distances and stable cell ids', async () => {
    const { worley } = await import('../src/sdf/noise.js');
    const a = worley(1.3, 2.7, 0.4);
    expect(a.f2).toBeGreaterThanOrEqual(a.f1);
    expect(worley(1.3, 2.7, 0.4)).toEqual(a);
    expect(worley(1.3001, 2.7, 0.4).id).toBe(a.id);
  });
});
