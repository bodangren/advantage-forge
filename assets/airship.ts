import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - airship (vehicles/air/airship).
 * Role: sky-vehicle prop, read at 128 px as a fat tan balloon over a small brown boat.
 * Size: about 7 m long (Z), 5 m tall; skids rest on y = 0, bow +Z.
 * One idea: a huge round envelope with dark seam bands over a tiny chunky boat gondola.
 * Shape language: round envelope, boxy cabin, triangular fins. Palette: canvas #d8c39a,
 * seam #b39a6c, oak #b5814a, brown #8a5a35, walnut #6b4226, brass #d9a441, rope #c8a86b.
 * Materials: canvas, wood, walnut, brass, rope. Focal point: brass nose cap and propellers.
 * Rig: none.
 */
const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const PALE = rgb('#c9a06a');
const CANVAS = rgb('#d8c39a');
const SEAM = rgb('#a88a5a');
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'airship',
  description: 'A chunky airship: tan canvas envelope with dark seam bands and a brass nose, a wooden boat gondola with cabin and railing hung by six ropes, two brass propeller pods, three tail fins and two skids.',
  reference: 'docs/vehicle-mockups/airship-mock.jpg',
  detail: 0.01,
  texture: { size: 1024 },
  build(k) {
    const EY = 3.4; // envelope center height

    // envelope with a slightly pointed bow
    const env = sdf.smoothUnion(0.25,
      sdf.ellipsoid([1.3, 1.3, 3.2]).at(0, EY, 0),
      sdf.cone([0, EY, 2.6], [0, EY, 3.5], 0.5, 0.18));
    const seamZ = [-1.5, -0.1, 1.3];
    k.body('envelope', env.paintFn((x, y, z) => {
      const n = noise.fbm(x * 3, y * 3, z * 3, 2);
      let c = mixRgb(CANVAS, rgb('#e6d3aa'), clamp01(0.5 + 0.5 * n) * 0.5);
      c = mixRgb(c, rgb('#b89b6a'), clamp01((EY - y) / 1.3) * 0.35);
      for (const zc of seamZ) {
        const d = Math.abs(z - zc);
        if (d < 0.09) c = mixRgb(c, SEAM, 0.85);
      }
      return c;
    }), {
      color: '#d8c39a', roughness: 0.7, metalness: 0, detail: 0.01,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 14, y * 14, z * 14, 2),
      maxTriangles: 5000,
    });

    // brass nose cap and stern ring
    const nose = sdf.smoothUnion(0.03,
      sdf.cone([0, EY, 3.25], [0, EY, 3.62], 0.36, 0.14),
      sdf.sphere(0.14).at(0, EY, 3.66));
    const tailCap = sdf.sphere(0.16).at(0, EY, -3.2);
    k.body('brass', sdf.union(nose, tailCap), {
      color: '#d9a441', roughness: 0.35, metalness: 0.9, detail: 0.006, maxTriangles: 1000,
    });

    // gondola hull (small boat, 0.08 m wall, cut flat at the rim)
    const RIM = 0.85;
    const cut = sdf.box([3, RIM, 4], 0).at(0, RIM / 2, 0);
    const outer = sdf.ellipsoid([0.58, 0.45, 1.3]).at(0, 0.6, 0).intersect(cut);
    const inner = sdf.ellipsoid([0.5, 0.37, 1.22]).at(0, 0.66, 0);
    const shell = outer.subtract(inner).round(0.008);
    const floor = sdf.box([0.8, 0.08, 2.0], 0.02).at(0, 0.33, 0).intersect(outer.round(0.02));
    const cabin = sdf.box([0.8, 0.55, 0.9], 0.04).at(0, 1.1, -0.3);
    const roof = sdf.box([0.98, 0.08, 1.1], 0.03).at(0, 1.42, -0.3);
    const skids = [-1, 1].map((s) => sdf.smoothUnion(0.03,
      sdf.capsule([s * 0.3, 0.09, -1.05], [s * 0.3, 0.09, 1.05], 0.09),
      sdf.capsule([s * 0.3, 0.1, 0.65], [s * 0.3, 0.4, 0.55], 0.05),
      sdf.capsule([s * 0.3, 0.1, -0.65], [s * 0.3, 0.4, -0.55], 0.05)));
    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 30, z * 8, 2);
      const row = Math.floor((y + 0.02) / 0.09);
      let c = mixRgb((row & 1) ? rgb('#a06e3e') : BROWN, OAK, 0.25 + 0.15 * grain);
      const seam = Math.abs((((y + 0.02) / 0.09) % 1) - 0.5);
      if (seam > 0.47) c = mixRgb(c, WALNUT, 0.6);
      c = mixRgb(c, WALNUT, 0.35 * clamp01(1 - y / 0.3));
      return c;
    };
    const woodBump = (x: number, y: number, z: number) =>
      0.0015 * noise.fbm(x * 10, y * 40, z * 10, 2) + 0.003 * (Math.floor((y + 0.02) / 0.09) & 1);
    const hullWood = sdf.smoothUnion(0.03, shell, floor, cabin);
    k.body('hull', hullWood.paintFn(woodPaint), {
      color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.01, bump: woodBump, maxTriangles: 6000, maxError: 0.01,
    });
    k.body('roof', roof.paintFn((x, y, z) => mixRgb(PALE, OAK, 0.3 + 0.3 * noise.fbm(x * 9, y * 9, z * 9, 2))), {
      color: '#c9a06a', roughness: 0.8, metalness: 0, detail: 0.008, maxTriangles: 1200,
    });
    k.body('skids', sdf.union(skids[0], skids[1]).paintFn(() => WALNUT), {
      color: '#6b4226', roughness: 0.8, metalness: 0, detail: 0.006, maxTriangles: 1200,
    });

    // railing: posts on the rim ellipse, joined by a top rail
    const railPts: [number, number, number][] = [];
    const hx = (z: number) => 0.5 * Math.sqrt(Math.max(0, 1 - (z / 1.22) ** 2)) * 0.95 + 0.02;
    for (const s of [1, -1]) {
      for (const z of [1.0, 0.65, 0.3, -0.75, -1.05]) railPts.push([s * hx(z), 0.85, z]);
    }
    let rail: ReturnType<typeof sdf.capsule> | null = null;
    const add = (sh: ReturnType<typeof sdf.capsule>) => { rail = rail ? rail.union(sh) : sh; };
    for (const [x, y, z] of railPts) add(sdf.capsule([x, y - 0.02, z], [x, y + 0.34, z], 0.035));
    for (const s of [1, -1]) {
      const zs = [1.15, 1.0, 0.65, 0.3, -0.05];
      for (let i = 0; i < zs.length - 1; i++) {
        add(sdf.capsule([s * hx(zs[i]), 1.19, zs[i]], [s * hx(zs[i + 1]), 1.19, zs[i + 1]], 0.035));
      }
      const zb = [-0.55, -0.75, -1.05, -1.15];
      for (let i = 0; i < zb.length - 1; i++) {
        add(sdf.capsule([s * hx(zb[i]), 1.19, zb[i]], [s * hx(zb[i + 1]), 1.19, zb[i + 1]], 0.035));
      }
    }
    add(sdf.capsule([-hx(-1.15), 1.19, -1.15], [hx(-1.15), 1.19, -1.15], 0.035));
    add(sdf.capsule([-hx(1.15), 1.19, 1.15], [hx(1.15), 1.19, 1.15], 0.035));
    k.body('railing', rail!.paintFn(() => OAK), {
      color: '#b5814a', roughness: 0.8, metalness: 0, detail: 0.005, maxTriangles: 2500,
    });

    // six ropes, rim to envelope
    const ropeShapes: ReturnType<typeof sdf.capsule>[] = [];
    for (const s of [1, -1]) {
      for (const z of [0.95, 0.0, -0.95]) {
        const xr = s * hx(z), xe = s * 0.55;
        ropeShapes.push(sdf.capsule([xr, 0.9, z], [xe, EY - 1.1, z], 0.03));
      }
    }
    k.body('ropes', sdf.union(...ropeShapes).paintFn(() => rgb('#c8a86b')), {
      color: '#c8a86b', roughness: 0.9, metalness: 0, detail: 0.005, maxTriangles: 1500,
    });

    // propeller pods on struts at the stern
    const pod = (s: number) => {
      const px = s * 0.95, py = 1.0, pz = -1.1;
      const body = sdf.smoothUnion(0.04,
        sdf.cylinder(0.17, 0.6, 0.06).rotateX(90).at(px, py, pz),
        sdf.sphere(0.15).at(px, py, pz + 0.3));
      const strut = sdf.capsule([s * 0.5, 0.9, pz], [px, py - 0.05, pz], 0.05);
      const hub = sdf.sphere(0.09).at(px, py, pz - 0.34);
      const blade = (a: number) => sdf.box([0.16, 0.85, 0.06], 0.02).rotateZ(a).at(px, py, pz - 0.36);
      return sdf.smoothUnion(0.02, body, strut, hub, blade(25), blade(205));
    };
    k.body('pods', sdf.union(pod(1), pod(-1)), {
      color: '#d9a441', roughness: 0.35, metalness: 0.9, detail: 0.004, maxTriangles: 1500,
    });

    // three tail fins, radial around the envelope axis
    const fin = (a: number) => sdf.box([0.08, 1.15, 1.5], 0.03)
      .at(0, 0.95, 0).rotateZ(a).at(0, EY, -2.55);
    const finBody = sdf.union(fin(0), fin(120), fin(240));
    k.body('fins', finBody.paintFn((x, y, z) => mixRgb(BROWN, OAK, 0.2 + 0.3 * noise.fbm(x * 6, y * 6, z * 6, 2))), {
      color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.008,
      bump: woodBump, maxTriangles: 1500,
    });
  },
});
