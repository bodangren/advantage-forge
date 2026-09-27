import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather quiver (equipment/ranged-weapons/quiver).
 *
 * Role: ranged-weapon container for the chibi heroes; reads at 128 px as
 *   a stout little pot with feathers fanning out the top.
 * Size: 0.35 m tall body, ~0.44 m wide at the belly; arrows stick out
 *   another ~0.18 m so the silhouette is ~0.55 m tall total. Stands on
 *   y = 0, faces +Z.
 * One idea: a friendly stout leather pot — wider than tall, bulging
 *   friendly, with a yellow rim, a stitched leather strap and two brass
 *   studs down the front, and six broad leaf-fletched arrows fanning
 *   from the top in red and white.
 * Shape language: round dominant (bulged revolved body, plump feather
 *   leaves), square secondary (strap, brass studs, foot).
 * Palette: leather #8a5a35 dominant, leather shade #5c3a22 (foot, strap
 *   dark), warm leather highlight #b5814a (sun-lit shoulder); yellow
 *   leather rim #d4a93a (the palette's gold tone); brass #d4a93a (studs);
 *   shaft #b5814a (honey oak); fletching white #f2eadb and red #c8403a.
 * Value plan: dark leather body with a warm belly highlight, brighter
 *   yellow rim band, lighter strap edges; red + white fletching is the
 *   color focal point at the top; brass studs are the small metal accent.
 * Materials: leather (roughness 0.62, metalness 0); yellow rim (roughness
 *   0.55, metalness 0 — painted leather); brass (roughness 0.3, metalness
 *   1). One body per material.
 * Detail: primary bulged body + yellow rolled rim + 6 broad arrows;
 *   secondary leather strap (down the front) with two brass studs; dark
 *   stitched foot. Focal point: the red and white leaf-fletched arrows
 *   fanning out of the top.
 * Rig/animation: none (static equipment item).
 */

const LEATHER = rgb('#8a5a35');
const LEATHER_SHADE = rgb('#5c3a22');
const LEATHER_LIGHT = rgb('#b5814a');
const RIM = '#d4a93a';
const BRASS = '#d4a93a';
const FLETCH_WHITE = '#f2eadb';
const FLETCH_RED = '#c8403a';

const H = 0.3; // body height (the rim caps it at ~0.33 m, arrows go higher)
const BELLY_R = 0.22; // max radius at mid height (~0.44 m wide)
const BASE_R = 0.2; // radius at the base
const RIM_R = 0.18; // radius just under the rolled mouth

export default defineAsset({
  name: 'quiver',
  description:
    'Stout leather quiver with a yellow rolled rim, stitched seams, a leather strap with two brass studs, and six arrows with broad red and white leaf-fletching fanning out of the top.',
  detail: 0.012,
  reference: 'docs/item-mockups/quiver-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ body
    // Stout revolved leather pot: flat seated base, plump belly bulge,
    // tucked shoulder, narrow mouth. Soft bevels everywhere. Clipped
    // flat on the ground.
    const bodyProfile = profile.polygon(
      [
        [0.0, 0.0],
        [BASE_R - 0.02, 0.0],
        [BASE_R, 0.02],
        [0.21, 0.08],
        [BELLY_R, 0.18],
        [0.215, 0.24],
        [RIM_R + 0.005, H - 0.02],
        [RIM_R, H],
        [0.0, H],
      ],
      { smooth: true, samples: 12 },
    );
    const bodyShape = sdf
      .revolve(bodyProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------ leather paint + bump
    // Tonal value plan: shaded base, sun-lit shoulder. A subtle leather
    // grain goes into bump so the normal map shows it.
    const leatherPaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 5 + 1, y * 5, z * 5, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 12, y * 6, z * 12, 2);
      let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.06 + 0.18 * patch);
      c = mixRgb(c, LEATHER_SHADE, 0.22 * grain);
      // Sun-lit shoulder, damp seated base.
      const t = Math.min(1, Math.max(0, y / H));
      c = mixRgb(c, LEATHER_SHADE, 0.32 * Math.pow(1 - t, 1.7));
      c = mixRgb(c, LEATHER_LIGHT, 0.18 * Math.max(0, (t - 0.55) / 0.45));
      return c;
    };
    const leatherBump = (x: number, y: number, z: number) =>
      0.0009 * noise.fbm(x * 35, y * 12, z * 35, 2);
    const bodyFull = bodyShape.paintFn(leatherPaint);
    k.body('leather', bodyFull, {
      color: '#8a5a35',
      roughness: 0.62,
      metalness: 0,
      detail: 0.012,
      paintWeight: 1.5,
      bump: leatherBump,
      maxTriangles: 1500,
    });

    // ------------------------------------------------------------------ yellow rolled rim
    // A rolled torus around the mouth, painted in the palette's yellow
    // (like the reference). A second thinner band at the foot gives the
    // body a clean seat on the ground.
    const rim = sdf
      .torus(RIM_R + 0.008, 0.022)
      .at(0, H + 0.012, 0)
      .paintFn((x, y, yz, base) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 22, yz * 22, 2);
        return mixRgb(rgb(RIM), rgb('#f0c45a'), 0.18 * grain);
      });
    // Small leather-dark stitched foot.
    const foot = sdf
      .cylinder(BASE_R + 0.008, 0.022, 0.004)
      .intersect(sdf.halfSpace([0, 1, 0], 0.025))
      .subtract(bodyShape)
      .paint(LEATHER_SHADE);
    k.body('rim', sdf.union(rim, foot), {
      color: RIM,
      roughness: 0.55,
      metalness: 0,
      detail: 0.005,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 600,
    });

    // ------------------------------------------------------------------ strap and studs
    // A vertical leather strap down the front, with two brass studs. The
    // strap is a thin rounded box painted darker than the body so it reads
    // as a separate piece; the studs sit proud on its face. The strap is
    // placed on the surface of the body (raycast forward from +Z) so it
    // hugs the bulge instead of floating in front of it.
    const strapW = 0.05;
    const strapH = 0.18;
    const strapZ = sdf.raycast(bodyShape, [0, 0.16, 1], [0, 0, -1])![2];
    const strap = sdf
      .box([strapW, strapH, 0.018], 0.005)
      .at(0, 0.16, strapZ + 0.005)
      .paintFn((x, y, yz, base) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 90, yz * 30, 2);
        let c = mixRgb(LEATHER_SHADE, LEATHER, 0.3 + 0.18 * grain);
        // A stitch line down each long edge.
        const sideX = Math.abs(x);
        const stitch = Math.pow(0.5 + 0.5 * Math.cos((sideX - strapW / 2 + 0.005) * 600), 30);
        c = mixRgb(c, rgb('#d9c79a'), 0.45 * stitch * (sideX < strapW / 2 - 0.001 ? 1 : 0));
        return c;
      });
    // Two brass studs along the strap. Probe the strap surface to place
    // them on the face of the strap, not buried inside it.
    const stud = (y: number) => {
      const p = sdf.surfacePoint(strap, [0, y, strapZ + 0.05], 0.002);
      return sdf.sphere(0.014).at(p[0], p[1], p[2]);
    };
    k.body('strap', strap, {
      color: '#5c3a22',
      roughness: 0.6,
      metalness: 0,
      detail: 0.005,
      paintWeight: 1.5,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 40, y * 80, z * 40, 2),
      maxTriangles: 300,
    });
    k.body(
      'brass',
      sdf.union(stud(0.12), stud(0.2)),
      { color: BRASS, roughness: 0.3, metalness: 1, detail: 0.003, maxTriangles: 100 },
    );

    // ------------------------------------------------------------------ arrows
    // Six broad leaf-fletched arrows fanning out of the mouth, alternating
    // red and white fletching. Each fletching is an extruded leaf profile
    // crossed at 90 degrees to form a 4-petal feather; the shaft is a thin
    // capsule; the head is a small steel cone.
    const fletchShape = sdf.extrude(
      profile.polygon(
        [
          [0, -0.005],
          [0.022, 0.012],
          [0.024, 0.06],
          [0.018, 0.115],
          [0, 0.14],
          [-0.018, 0.115],
          [-0.024, 0.06],
          [-0.022, 0.012],
        ],
        { smooth: true, samples: 6 },
      ),
      0.008,
      0.003,
    );
    const fletching = (color: string) => sdf.union(fletchShape, fletchShape.rotateY(90)).paint(color);
    const arrow = (
      tiltDeg: number,
      yawDeg: number,
      offsetX: number,
      offsetZ: number,
      len: number,
      color: string,
    ) => {
      const base: [number, number, number] = [offsetX * 0.5, H - 0.005, offsetZ * 0.5];
      const top: [number, number, number] = [offsetX * 2.4, H - 0.005 + len, offsetZ * 2.4];
      const shaft = sdf.capsule(base, top, 0.0045);
      const head = sdf
        .cone([top[0], top[1] + 0.001, top[2]], [top[0], top[1] + 0.028, top[2]], 0.009, 0.002)
        .paint('#8a8e94');
      const f = fletching(color)
        .rotateY(yawDeg)
        .rotateX(tiltDeg)
        .at(
          base[0] + (top[0] - base[0]) * 0.82,
          base[1] + (top[1] - base[1]) * 0.82,
          base[2] + (top[2] - base[2]) * 0.82,
        );
      return sdf.union(shaft, f, head);
    };

    // Six arrows fanning out: alternating red and white fletching, varied
    // lengths and tilts so they read as a hand-loaded quiver.
    const arrows = sdf.union(
      arrow(-16, 22, 0.04, 0.01, 0.16, FLETCH_RED),
      arrow(-8, -14, -0.025, 0.03, 0.18, FLETCH_WHITE),
      arrow(-2, 28, 0.05, -0.025, 0.14, FLETCH_WHITE),
      arrow(2, -28, -0.05, -0.015, 0.16, FLETCH_RED),
      arrow(10, 8, 0.01, 0.045, 0.13, FLETCH_RED),
      arrow(18, -2, -0.012, -0.045, 0.15, FLETCH_WHITE),
    );
    k.body('arrows', arrows, {
      color: '#b5814a',
      roughness: 0.72,
      metalness: 0,
      detail: 0.005,
      paintWeight: 1.5,
      maxTriangles: 1400,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 60, y * 200, z * 60, 2),
    });
  },
});