import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Village cottage, about 3.3 m tall: fieldstone base, plaster walls with a dark timber frame,
 * a steep shingled roof with generous overhangs, a stone chimney, an arched plank door, and
 * windows with a flower box. The ridge runs along X; the door faces +Z.
 */

const W = 2.6; // length along X
const D = 2.2; // depth along Z
const BASE = 0.35; // stone foundation height
const EAVE = 1.95; // top of the walls
const RIDGE = 3.15;
const FRONT = D / 2;

const C = {
  stone: rgb('#8d8a82'),
  stoneDark: rgb('#5d5a54'),
  mortar: rgb('#b9b1a0'),
  plaster: '#ece2cc',
  timber: '#4a3322',
  shingle: rgb('#b35a3c'),
  shingleDark: rgb('#7a3522'),
  door: rgb('#7b4b2a'),
  doorDark: rgb('#4f2e17'),
  iron: '#34363b',
  glass: '#3d5c7a',
  petal: ['#e0533d', '#f2c14e', '#e98fb0'],
  leaf: '#4f8a3a',
};

/** Fieldstone: irregular stones (Worley cells) with pale mortar and per-stone tint. */
const stonePaint = (scale: number) => (x: number, y: number, z: number) => {
  const c = noise.worley(x * scale, y * scale * 1.6, z * scale);
  const border = c.f2 - c.f1;
  const tint = (c.id % 1000) / 1000;
  const stone = mixRgb(C.stone, C.stoneDark, 0.2 + 0.5 * tint);
  return border < 0.12 ? C.mortar : stone;
};
const stoneBumps = (scale: number) => (x: number, y: number, z: number) => {
  const c = noise.worley(x * scale, y * scale * 1.6, z * scale);
  return -Math.min(1, (c.f2 - c.f1) * 4) * 0.8 + 0.4;
};

export default defineAsset({
  name: 'cottage',
  description: 'Timber-framed village cottage with stone base, shingled roof, chimney, door, and flower box.',
  detail: 0.014,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ foundation
    const foundation = sdf
      .box([W + 0.12, BASE, D + 0.12], 0.04)
      .at(0, BASE / 2, 0)
      .paintFn(stonePaint(5));
    // Small surface detail goes into the normal map only (bump), so the mesh stays light.
    const stoneBump = (scale: number, depth: number) => {
      const f = stoneBumps(scale);
      return (x: number, y: number, z: number) => depth * f(x, y, z);
    };
    k.body('foundation', foundation, { color: '#8d8a82', roughness: 0.9, bump: stoneBump(5, 0.012) });

    // ------------------------------------------------------------------ walls and gables
    const gableProfile = profile.polygon([
      [-FRONT, EAVE - 0.01],
      [FRONT, EAVE - 0.01],
      [0, RIDGE - 0.12],
    ]);
    const walls = sdf.union(
      sdf.box([W, EAVE - BASE + 0.02, D], 0.02).at(0, (EAVE + BASE) / 2, 0),
      sdf.extrude(gableProfile, W).rotateY(90),
    );
    k.body('walls', walls, {
      color: C.plaster,
      roughness: 0.95,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 8, y * 8, z * 8, 3),
    });

    // Timber frame: beams sit 3 cm proud of the plaster on every face.
    const beamX = (y: number) => sdf.box([W + 0.06, 0.1, D + 0.06], 0.012).at(0, y, 0);
    // Posts show on the front and back faces only (the end walls get their own corner posts).
    const frontAndBack = sdf
      .box([W + 0.2, 3, 0.2])
      .at(0, 1.5, FRONT)
      .mirror('z', 0);
    const posts = [-W / 2, -0.55, 0.55, W / 2].map((x) =>
      sdf
        .box([0.11, EAVE - BASE, D + 0.06], 0.012)
        .at(x, (EAVE + BASE) / 2, 0)
        .intersect(frontAndBack),
    );
    const sidePosts = [-FRONT, FRONT].map((z) =>
      sdf.box([W + 0.06, EAVE - BASE, 0.11], 0.012).at(0, (EAVE + BASE) / 2, z),
    );
    const brace = (x0: number, x1: number) => {
      const len = Math.hypot(x1 - x0, 0.75);
      const ang = (Math.atan2(0.75, x1 - x0) * 180) / Math.PI;
      return sdf
        .box([len, 0.08, D + 0.05], 0.01)
        .rotateZ(ang)
        .at((x0 + x1) / 2, 1.55, 0);
    };
    // Only keep beam material near the wall surface, so beams never fill doors or windows.
    const wallSkin = walls.round(0.03).subtract(walls.round(-0.02));
    const frame = sdf
      .union(
        beamX(BASE + 0.05),
        beamX(1.15),
        beamX(EAVE - 0.05),
        ...posts,
        // Braces on the back face only; the front has the door and windows.
        sdf.union(brace(-1.25, -0.6), brace(1.25, 0.6)).intersect(sdf.halfSpace([0, 0, 1], 0)),
      )
      .intersect(sdf.box([W + 0.1, EAVE, D + 0.1]).at(0, EAVE / 2, 0))
      .intersect(wallSkin)
      .union(
        sdf
          .union(...sidePosts)
          .intersect(wallSkin)
          .intersect(
            sdf
              .box([0.12, 3, D + 0.2])
              .at(W / 2, 1.5, 0)
              .mirror('x', 0),
          ),
      )
      .paintFn((x, y, z, base) =>
        mixRgb(base, rgb('#2c1d12'), 0.4 * Math.max(0, noise.fbm(x * 30, y * 4, z * 30, 2))),
      );
    k.body('timber', frame, {
      color: C.timber,
      roughness: 0.85,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 30, y * 4, z * 30, 2),
    });

    // ------------------------------------------------------------------ roof
    const roofProfile = profile.polygon([
      [-FRONT - 0.32, EAVE - 0.18],
      [0, RIDGE + 0.06],
      [FRONT + 0.32, EAVE - 0.18],
      [FRONT + 0.32, EAVE - 0.34],
      [0, RIDGE - 0.12],
      [-FRONT - 0.32, EAVE - 0.34],
    ]);
    const slope = Math.atan2(RIDGE + 0.06 - (EAVE - 0.18), FRONT + 0.32);
    // Distance down the slope from the ridge, for shingle rows.
    const downSlope = (y: number, _z: number) => (RIDGE + 0.06 - y) / Math.sin(slope);
    const ROW = 0.13;
    const roof = sdf
      .extrude(roofProfile, W + 0.5, 0.03)
      .rotateY(90)
      .paintFn((x, y, z) => {
        const s = downSlope(y, z) / ROW;
        const row = Math.floor(s);
        const col = Math.floor(x / 0.16 + (row % 2) * 0.5);
        const seam = s - row < 0.08 || Math.abs(x / 0.16 + (row % 2) * 0.5 - col - 0.5) > 0.46;
        const tint = noise.random(row, col, 11) * 0.45;
        return seam ? C.shingleDark : mixRgb(C.shingle, C.shingleDark, tint);
      });
    // Shingle relief: each row rises slowly toward its lower edge, then drops back (a continuous
    // ramp, never a jump), plus a little per-shingle unevenness.
    const shingleBump = (x: number, y: number, z: number) => {
      const s2 = downSlope(y, z) / ROW;
      const f = s2 - Math.floor(s2);
      const ramp = f < 0.85 ? f / 0.85 : (1 - f) / 0.15;
      return 0.012 * ramp + 0.002 * noise.noise3(x * 20, y * 20, z * 20);
    };
    k.body('roof', roof, { color: '#b35a3c', roughness: 0.8, detail: 0.012, bump: shingleBump });

    // ------------------------------------------------------------------ chimney
    const chimney = sdf
      .box([0.46, 1.9, 0.46], 0.03)
      .at(-0.8, 2.45, -0.45)
      .union(sdf.box([0.56, 0.1, 0.56], 0.02).at(-0.8, 3.42, -0.45))
      .subtract(sdf.box([0.26, 0.4, 0.26]).at(-0.8, 3.5, -0.45))
      .paintFn(stonePaint(6))
      .paintWhere(sdf.box([0.28, 0.3, 0.28]).at(-0.8, 3.4, -0.45), '#1d1a18', 0.02);
    k.body('chimney', chimney, { color: '#8d8a82', roughness: 0.9, bump: stoneBump(6, 0.01) });

    // ------------------------------------------------------------------ door: arched planks
    const doorX = 0;
    const doorOutline = profile.polygon(
      [
        [-0.34, 0],
        [0.34, 0],
        [0.34, 1.05],
        [0.24, 1.3],
        [0, 1.4],
        [-0.24, 1.3],
        [-0.34, 1.05],
      ],
      { smooth: false },
    );
    const doorSlab = sdf.extrude(doorOutline, 0.08, 0.012).at(doorX, BASE, FRONT + 0.01);
    const door = doorSlab.paintFn((x, y) => {
      const plank = Math.floor((x - doorX + 0.34) / 0.136);
      const f = (x - doorX + 0.34) / 0.136 - plank;
      const grain = 0.5 + 0.5 * noise.noise3(x * 30, y * 3, plank);
      const c = mixRgb(C.door, C.doorDark, 0.2 + 0.3 * noise.random(plank, 5) + 0.2 * grain);
      return f < 0.06 ? C.doorDark : c;
    });
    k.body('door', door, {
      color: '#7b4b2a',
      roughness: 0.8,
      detail: 0.008,
      bump: (x, y) => {
        const f = (x - doorX + 0.34) / 0.136;
        const gap = f - Math.floor(f) < 0.06 ? -0.004 : 0;
        return gap + 0.002 * noise.fbm(x * 40, y * 5, 0, 2);
      },
    });
    const hinges = sdf.union(
      ...[0.3, 0.95].map((y) =>
        sdf.box([0.42, 0.045, 0.02], 0.008).at(doorX - 0.12, BASE + y, FRONT + 0.055),
      ),
      sdf
        .torus(0.04, 0.009)
        .rotateX(90)
        .at(doorX + 0.22, BASE + 0.72, FRONT + 0.07),
    );
    k.body('door-iron', hinges, { color: C.iron, roughness: 0.5, metalness: 0.8, detail: 0.006 });
    const step = sdf
      .box([0.9, 0.12, 0.35], 0.03)
      .at(doorX, 0.06, FRONT + 0.2)
      .paintFn(stonePaint(8));
    k.body('step', step, { color: '#8d8a82', roughness: 0.9, bump: stoneBump(8, 0.006) });

    // ------------------------------------------------------------------ windows (one with a flower box)
    const winY = 1.25;
    const windowAt = (winX: number) => ({
      frame: sdf
        .box([0.56, 0.6, 0.1], 0.012)
        .subtract(sdf.box([0.44, 0.48, 0.3]))
        .union(sdf.box([0.05, 0.48, 0.06]), sdf.box([0.44, 0.05, 0.06]))
        .at(winX, winY, FRONT + 0.02)
        .union(sdf.box([0.68, 0.05, 0.14], 0.01).at(winX, winY - 0.32, FRONT + 0.06)),
      glass: sdf.box([0.44, 0.48, 0.03]).at(winX, winY, FRONT - 0.01),
    });
    const left = windowAt(-0.92);
    const right = windowAt(0.92);
    k.body('window-frames', sdf.union(left.frame, right.frame), {
      color: C.timber,
      roughness: 0.8,
      detail: 0.008,
    });
    k.body('glass', sdf.union(left.glass, right.glass), {
      color: C.glass,
      roughness: 0.08,
      metalness: 0.3,
      emissive: '#f0c070',
      emissiveIntensity: 0.12,
    });
    const winX = -0.92;
    const planter = sdf
      .box([0.7, 0.16, 0.18], 0.015)
      .subtract(sdf.box([0.62, 0.2, 0.12]).at(0, 0.06, 0))
      .at(winX, winY - 0.45, FRONT + 0.12);
    const flowers = sdf.union(
      ...Array.from({ length: 11 }, (_, i) => {
        const x = winX - 0.3 + (i / 10) * 0.6 + (noise.random(i, 1) - 0.5) * 0.03;
        const y = winY - 0.34 + noise.random(i, 2) * 0.06;
        const z = FRONT + 0.12 + (noise.random(i, 3) - 0.5) * 0.08;
        return sdf
          .sphere(0.045 + noise.random(i, 4) * 0.015)
          .at(x, y, z)
          .paint(C.petal[i % 3]!);
      }),
    );
    const foliage = sdf
      .ellipsoid([0.33, 0.06, 0.07])
      .at(winX, winY - 0.39, FRONT + 0.12)
      .displace(0.02, (x, y, z) => noise.noise3(x * 30, y * 30, z * 30))
      .paint(C.leaf);
    k.body('flower-box', sdf.union(planter.paint(C.timber), foliage, flowers), {
      color: C.timber,
      roughness: 0.85,
      detail: 0.007,
    });
  },
});
