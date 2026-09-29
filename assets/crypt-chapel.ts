import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Crypt chapel, 3 x 4 x 4.5 m (catalog `architecture/structure/crypt-chapel`).
 * Role: dungeon landmark. Size: 3 m wide (x), 4 m deep (z), ridge 4.3 m, bell tower to 5.4 m; front +Z.
 * One idea: a dark blue-grey stone doghouse of fat rounded blocks under a steep roof of big slate slabs.
 * Shape language: square and chunky, softened by big bevels; boulders add round secondary forms.
 * Palette: stone #4b525c, top light #6f7680, joint #363a3f, interior #14161a, iron #4a4f55, bell #d4a93a.
 * Materials: wall stone, roof slate, gargoyle stone, boulders, dark interior, iron, gold bell.
 * Focal point: the pointed doorway with its gable slab; accent: the gold bell.
 */
const C = {
  stone: rgb('#4b525c'),
  light: rgb('#6f7680'),
  joint: rgb('#363a3f'),
  dark: rgb('#14161a'),
  iron: rgb('#4a4f55'),
  gold: rgb('#d4a93a'),
};
const rnd = noise.random;
const stoneGrain = (x: number, y: number, z: number) => 0.003 * noise.fbm(x * 20, y * 20, z * 20, 2);

export default defineAsset({
  name: 'crypt-chapel',
  description: 'A small dark slate-blue stone crypt chapel with a pointed doorway, slab roof, bell tower, gargoyles, and boulders.',
  detail: 0.014,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-dungeon/crypt-chapel-mock.jpg',

  build(k) {
    // pointed arch in XY, bottom at y0
    const arch = (half: number, h: number, spring: number, y0 = 0) =>
      profile.polygon([[-half, y0], [half, y0], [half, spring], [0, h], [-half, spring]]);
    const doorHole = sdf.extrude(arch(0.55, 2.0, 1.3), 1.0).at(0, 0, 1.5);

    // ---------------------------------------------------------------- walls
    const parts = [
      sdf.box([2.6, 2.4, 3.6], 0.05).at(0, 1.2, 0),
      sdf.extrude(profile.polygon([[-1.3, 2.3], [1.3, 2.3], [0, 4.1]]), 3.6, 0.03).at(0, 0, 0),
    ];
    const H = 0.75;
    const courseY = [0.41, 1.2, 1.99];
    const blk = (w: number, y: number, x: number, z: number, side: boolean) =>
      (side ? sdf.box([0.2, H, w], 0.08) : sdf.box([w, H, 0.2], 0.08)).at(x, y, z);
    // front and back faces
    for (let c = 0; c < 3; c++) {
      const y = courseY[c];
      const w = c === 1 ? 0.6 : 0.7;
      const cx = c === 1 ? 1.2 : 1.17;
      for (const s of [1, -1]) parts.push(blk(w, y, s * cx, 1.9, false));
      // back: running bond
      const xs = c === 1 ? [-1.0, -0.1, 0.8] : [-0.55, 0.35, 1.2];
      for (const x of xs) parts.push(blk(0.86, y, x, -1.9, false));
    }
    // side faces
    for (let c = 0; c < 3; c++) {
      const xs = c === 1 ? [-1.2, -0.3, 0.6, 1.5] : [-1.5, -0.6, 0.3, 1.2];
      for (const s of [1, -1]) for (const z of xs) if (Math.abs(z) < 1.7) parts.push(blk(0.86, courseY[c], s * 1.4, z, true));
    }
    // doorway: jamb voussoirs and gable slab
    for (const s of [1, -1]) {
      for (const y of [0.3, 0.87, 1.44]) parts.push(sdf.box([0.34, 0.5, 0.3], 0.07).at(s * 0.74, y, 1.85));
    }
    parts.push(
      sdf
        .extrude(profile.polygon([[-0.95, 1.72], [0.95, 1.72], [0.95, 2.5], [0, 3.55], [-0.95, 2.5]]), 0.26, 0.07)
        .at(0, 0, 1.9),
    );
    parts.push(sdf.box([1.4, 0.15, 0.5], 0.06).at(0, 0.075, 2.15));
    let walls = sdf.union(...parts);
    walls = sdf.subtract(walls, doorHole.round(0.02));
    walls = walls.paintFn((x, y, z, base) => {
      const cy = Math.floor(y / 0.8);
      const t = rnd(Math.floor(x * 1.2), cy, Math.floor(z * 1.2));
      let c = mixRgb(base, C.light, 0.25 * t);
      c = mixRgb(c, C.joint, 0.35 * (1 - t) * (rnd(cy, 3, 4)));
      const f = (y % 0.8) / 0.8;
      return mixRgb(c, C.joint, 0.35 * Math.pow(Math.abs(f - 0.5) * 2, 6));
    });
    k.body('walls', walls, { color: C.stone, roughness: 0.9, detail: 0.014, maxError: 0.006, maxTriangles: 3000, bump: stoneGrain });

    // ---------------------------------------------------------------- interior + iron band
    k.body('interior', sdf.extrude(arch(0.6, 2.05, 1.3), 0.1).at(0, 0, 1.15), {
      color: C.dark, roughness: 0.95, detail: 0.02, maxTriangles: 200,
    });
    k.body('door-iron', sdf.box([1.1, 0.12, 0.06], 0.02).at(0, 1.0, 1.4), {
      color: C.iron, roughness: 0.5, metalness: 0.7, detail: 0.01, maxTriangles: 200,
    });

    // ---------------------------------------------------------------- roof
    const roofParts: ReturnType<typeof sdf.box>[] = [];
    const theta = Math.atan2(4.3 - 2.3, 1.6);
    const deg = (theta * 180) / Math.PI;
    const len = Math.hypot(1.6, 2.0);
    for (const s of [1, -1]) {
      for (let r = 0; r < 3; r++) {
        const sAlong = 0.4 + r * 0.82; // distance from eave
        const px = s * (1.6 - sAlong * Math.cos(theta));
        const py = 2.3 + sAlong * Math.sin(theta);
        const nx = s * Math.sin(theta);
        const ny = Math.cos(theta);
        const cnt = r % 2 === 0 ? 5 : 4;
        for (let i = 0; i < cnt; i++) {
          const z = r % 2 === 0 ? -1.68 + i * 0.84 : -1.26 + i * 0.84;
          const jitter = 0.03 * (rnd(i, r, s + 3) - 0.5);
          roofParts.push(
            sdf
              .box([0.82, 0.34, 0.8], 0.12)
              .rotateZ(-s * deg)
              .at(px + nx * 0.15, py + ny * 0.15 + jitter, z),
          );
        }
      }
    }
    void len;
    // ridge caps at gable ends
    for (const z of [1.75, -1.75]) roofParts.push(sdf.box([0.5, 0.5, 0.7], 0.09).rotateZ(45).at(0, 4.3, z));
    // bell tower
    const TZ = -1.1;
    for (const s of [1, -1]) roofParts.push(sdf.box([0.2, 1.1, 0.2], 0.04).at(s * 0.32, 4.75, TZ));
    roofParts.push(
      sdf.extrude(profile.polygon([[-0.42, 5.2], [0.42, 5.2], [0, 5.65]]), 0.8, 0.05).at(0, 0, TZ),
    );
    k.body(
      'roof',
      sdf.union(...roofParts).paintFn((x, y, z, base) => {
        const t = rnd(Math.floor(x * 1.4), Math.floor(y * 2), Math.floor(z * 1.2));
        return mixRgb(mixRgb(base, C.light, 0.2 + 0.25 * t), C.joint, 0.2 * (1 - t));
      }),
      { color: mixRgb(C.stone, C.light, 0.1), roughness: 0.9, detail: 0.014, maxError: 0.007, maxTriangles: 2600, bump: stoneGrain },
    );

    // bell
    const bell = sdf
      .revolve(profile.polygon([[0, 0.3], [0.05, 0.29], [0.08, 0.22], [0.11, 0.12], [0.16, 0.03], [0.18, 0], [0.16, -0.02], [0.1, 0.0], [0.0, 0.1]], { smooth: false }))
      .at(0, 4.62, TZ);
    k.body('bell', sdf.union(bell, sdf.box([0.5, 0.05, 0.05], 0.015).at(0, 4.96, TZ)), {
      color: C.gold, roughness: 0.35, metalness: 1, detail: 0.01, maxTriangles: 500,
    });

    // ---------------------------------------------------------------- gargoyles
    const garg = (s: number) => {
      const g = sdf.union(
        sdf.box([0.5, 0.35, 0.4], 0.1).at(0, 0, 0),
        sdf.sphere(0.14).at(0, 0.12, 0.3),
        sdf.cone([-0.09, 0.22, 0.3], [-0.14, 0.42, 0.28], 0.05, 0.005),
        sdf.cone([0.09, 0.22, 0.3], [0.14, 0.42, 0.28], 0.05, 0.005),
        sdf.box([0.06, 0.32, 0.3], 0.02).rotateZ(-25).at(-0.27, 0.22, -0.05),
        sdf.box([0.06, 0.32, 0.3], 0.02).rotateZ(25).at(0.27, 0.22, -0.05),
      );
      const plinth = sdf.box([0.55, 0.3, 0.55], 0.08).at(0, -0.3, 0.02);
      return sdf.union(g, plinth).rotateY(s * 20).at(s * 1.2, 2.72, 2.2);
    };
    k.body('gargoyles', sdf.union(garg(1), garg(-1)), {
      color: C.light, roughness: 0.9, detail: 0.01, maxError: 0.005, maxTriangles: 1200, bump: stoneGrain,
    });

    // ---------------------------------------------------------------- boulders
    const boulders: ReturnType<typeof sdf.box>[] = [];
    const bl: [number, number, number, number, number, number, number][] = [
      // x, y, z, sx, sy, sz, rotY
      [1.55, 0.4, 1.95, 0.9, 0.8, 0.85, 20],
      [1.95, 0.28, 1.55, 0.7, 0.55, 0.8, -15],
      [1.25, 0.25, 2.35, 0.7, 0.5, 0.6, 35],
      [1.75, 0.75, 1.85, 0.6, 0.55, 0.6, 50],
    ];
    for (const s of [1, -1])
      bl.forEach(([x, y, z, a, b, c, ry], i) =>
        boulders.push(sdf.box([a, b, c], 0.2).rotateY(s * ry).rotateZ(s * (i - 1.5) * 4).at(s * x, y, z)),
      );
    k.body('boulders', sdf.union(...boulders).paintFn((x, y, z, base) => mixRgb(base, C.light, 0.25 * (0.5 + 0.5 * noise.fbm(x * 3, y * 3, z * 3, 2)))), {
      color: C.stone, roughness: 0.92, detail: 0.02, maxError: 0.008, maxTriangles: 1200, bump: stoneGrain,
    });
  },
});
