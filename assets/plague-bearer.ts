import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Plague-bearer — Chibi Quest enemy (catalog `enemies/undead/plague-bearer`), about 1.02 m to the
 * tip of its hood, faces +Z. Target: docs/enemy-mockups/plague-bearer_001.jpg. Built on the
 * zombie's skeleton and clips (shambling rig with knee bones), so it walks, dies, and rises alike.
 *
 * Role: a slow undead support enemy seen in 3D and as a 128 px sprite; the hood, the long beak,
 *   the one big eye, the bloated belly, and the glowing lantern-pot must read small.
 * One idea: a hunched, bloated plague doctor risen from the grave: a pale hood, a huge cracked
 *   leather beak, one round pale eye, a green belly, and a rusty pot that leaks green fumes.
 * Shape language: round and heavy (belly, hood, pot) with one long triangle (the beak) and torn hems.
 * Palette (60/30/10): sickly skin #8a9a6a, pale coat #d8d2c0, dark leather #3a2e2a and beak
 *   #6a4a30; the green glow #8aff9a (the pot and the eye) is the accent.
 * Value plan: the dark beak against the pale hood is the focal point; the belly is the mid green.
 * Bodies: skin, head-skin, hood, coat-top, coat-skirt, belly-free trousers, bandage, mask, eye, claws,
 *   belt, straps, cuffs, boils, lantern, glow, fumes.
 * Rig: the zombie's skeleton; the lantern is rigid on hand.L. Clips: idle, walk, run (arms low,
 *   the lantern swings), attack (a swipe with the right claw), hit, death, rise.
 */

const C = {
  skin: '#8a9a6a',
  skinDark: '#6a7a4e',
  spot: '#5b4a32',
  coat: '#d8d2c0',
  coatShade: '#b8b0a0',
  hoodIn: '#2a2620',
  mask: '#5a3a26',
  maskRidge: '#8a6a48',
  brass: '#c9a24a',
  strap: '#4a3222',
  maskCrack: '#3a2a1e',
  eye: '#d8e8a0',
  belt: '#3a2e2a',
  buckle: '#8a7a50',
  trousers: '#3a3a40',
  bandage: '#c8c0a8',
  claw: '#2e2a22',
  lantern: '#5a3a2a',
  rust: '#a05a30',
  glow: '#8aff9a',
  fumes: '#a8e8b8',
  boil: '#7a9a3a',
};

type V3 = readonly [number, number, number];

const UP = 0.03; // the legs are 0.03 m longer: everything above the ankles rides this much higher
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: the zombie's; the arms hang out and a little forward.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.215, 0.345, 0.045];
const WRIST: V3 = [0.29, 0.285, 0.095];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)

/** The hunch: the chest leans forward 15 degrees about the waist. */
const hunch = (s: sdf.Shape) => s.at(0, -0.235, 0).rotateX(15).at(0, 0.235, 0);
const lift = (p: V3): V3 => [p[0], p[1] + UP, p[2]];

/** A torus ring of radius `R` and tube `r` around the axis through `c` along `d` (Y turned to `d`). */
const ringAt = (c: V3, d: V3, R: number, r: number) => {
  const n = Math.hypot(...d);
  const u = [d[0] / n, d[1] / n, d[2] / n];
  const h = Math.hypot(u[0], u[2]);
  const a = -Math.acos(Math.max(-1, Math.min(1, u[1]))) * (180 / Math.PI);
  const phi = h < 1e-6 ? 0 : Math.atan2(-u[2], u[0]) * (180 / Math.PI);
  return sdf.torus(R, r).rotateZ(a).rotateY(phi).at(...c);
};

/** A clawing hand at the wrist `w` (fingers drooping forward and down); `s` mirrors it. The hand is 1.3x. */
const HAND = 1.3;
const handAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  const big = (p: V3): V3 => [w[0] + (p[0] - w[0]) * HAND, w[1] + (p[1] - w[1]) * HAND, w[2] + (p[2] - w[2]) * HAND];
  const scaleUp = (sh: sdf.Shape) => sh.at(-w[0], -w[1], -w[2]).scale(HAND).at(...w);
  const tips: sdf.Shape[] = [];
  const finger = (dx: number, len: number) => {
    const a: V3 = o(dx * 1.3, -0.055, 0.04 + len * 0.3);
    const b: V3 = o(dx * 1.4, -0.075 - len * 0.2, 0.05 + len * 0.3);
    const dir: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const n = Math.hypot(...dir);
    // A long dark claw continues the finger (0.05 m, in the final scale).
    const tb = big(b);
    tips.push(sdf.cone(tb, [tb[0] + (dir[0] / n) * 0.05, tb[1] + (dir[1] / n) * 0.05 - 0.008, tb[2] + (dir[2] / n) * 0.05], 0.008, 0.0012));
    return sdf.chain([[...o(dx, -0.03, 0.02), 0.011], [...a, 0.0095], [...b, 0.008]], 0.004);
  };
  const palmC = o(0.004, -0.024, 0.012);
  const skin = scaleUp(
    sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.034, 0.03, 0.032]).at(...palmC),
      finger(-0.02, 0.02),
      finger(-0.006, 0.04),
      finger(0.009, 0.035),
      finger(0.022, 0.01),
      sdf.cone(o(0.03, -0.018, 0.012), o(0.046, -0.04, 0.04), 0.011, 0.008), // thumb
    ),
  );
  // Bandage wraps around the palm.
  const wraps = scaleUp(
    sdf
      .ellipsoid([0.041, 0.036, 0.039])
      .at(...palmC)
      .intersect(
        sdf.union(
          sdf.box([0.3, 0.014, 0.3]).rotateZ(12 * s).at(palmC[0], palmC[1] + 0.014, palmC[2]),
          sdf.box([0.3, 0.014, 0.3]).rotateZ(-10 * s).at(palmC[0], palmC[1] - 0.008, palmC[2]),
        ),
      ),
  );
  return { skin, claws: sdf.union(...tips), wraps };
};

export default defineAsset({
  name: 'plague-bearer',
  description:
    'Chibi plague-bearer enemy: a hunched, bloated undead in a pale hood and bandaged sleeves, with a cracked leather beak mask, one big pale eye, and a rusty lantern-pot of green fumes.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/plague-bearer_001.jpg',
  variants: {
    coat: { pale: C.coat, black: '#2a2a30', redbrown: '#7a3a2a' },
    glow: { green: C.glow, yellow: '#ffe25a', violet: '#c07fff' },
    skin: { greygreen: C.skin, bluegrey: '#6a7a88', brown: '#7a5a44' },
  },
  presets: {
    blight: { coat: 'pale', glow: 'green', skin: 'greygreen' },
    gravedigger: { coat: 'black', glow: 'violet', skin: 'bluegrey' },
    rustbelly: { coat: 'redbrown', glow: 'yellow', skin: 'brown' },
  },

  build(k) {
    const T = {
      skin: k.tint('skin'),
      skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
      wrinkle: k.tint('skin', { color: '#4a5a34', follow: 1 }),
      spot: k.tint('skin', { color: C.spot, follow: 0.4 }),
      coat: k.tint('coat'),
      coatShade: k.tint('coat', { color: C.coatShade, follow: 1 }),
      hoodShade: k.tint('coat', { color: '#9a9280', follow: 1 }),
      hoodBase: k.tint('coat', { color: '#c8c2b0', follow: 1 }),
      hoodDirt: k.tint('coat', { color: '#857d6c', follow: 1 }),
      glow: k.tint('glow'),
      eye: k.tint('glow', { color: C.eye, follow: 1 }),
      fumes: k.tint('glow', { color: C.fumes, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2 + UP, 0] },
      spine: { parent: 'hips', at: [0, 0.26 + UP, 0] },
      chest: { parent: 'spine', at: [0, 0.33 + UP, 0] },
      neck: { parent: 'chest', at: [0, 0.43 + UP, -0.01] },
      head: { parent: 'neck', at: [0, 0.48 + UP, -0.01] },
      'upperarm.L': { parent: 'chest', at: lift(SHOULDER) },
      'forearm.L': { parent: 'upperarm.L', at: lift(ELBOW) },
      'hand.L': { parent: 'forearm.L', at: lift(WRIST) },
      'upperarm.R': { parent: 'chest', at: lift(mx(SHOULDER)) },
      'forearm.R': { parent: 'upperarm.R', at: lift(mx(ELBOW)) },
      'hand.R': { parent: 'forearm.R', at: lift(mx(WRIST)) },
      'leg.L': { parent: 'hips', at: lift(HIP) },
      'shin.L': { parent: 'leg.L', at: lift(KNEE), split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: lift(mx(HIP)) },
      'shin.R': { parent: 'leg.R', at: lift(mx(KNEE)), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });
    // Bodies above the ankles are built in the old frame and ride UP.
    const put = (name: string, shape: sdf.Shape, o: Parameters<typeof k.body>[2]) => k.body(name, shape.at(0, UP, 0), o);

    // ------------------------------------------------------------------ head (world frame before the UP lift)
    // A small skull sits deep inside a draped cloth hood; a dark lining fills the pocket behind it.
    const HC: V3 = [0, 0.605, 0.015];
    const SK = [0.15, 0.14, 0.15] as const;
    const headSolid = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid(SK).at(...HC),
      pair(sdf.sphere(0.075).at(0.075, HC[1] - 0.035, HC[2] + 0.04)),
      sdf.ellipsoid([0.1, 0.05, 0.075]).at(0, HC[1] - 0.08, HC[2] + 0.035),
    );
    const faceZ = (x: number, y: number) => sdf.raycast(headSolid, [x, y, 1], [0, 0, -1])![2];
    const EYE_X = 0.06;
    const EYE_Y = HC[1] + 0.04;
    const eyeC: V3 = [-EYE_X, EYE_Y, faceZ(EYE_X, EYE_Y) - 0.004];

    // ---- hood geometry: a soft cone, tilted back, hollow, with a face opening
    const tilt = (s: sdf.Shape) => s.at(0, -0.5, 0).rotateX(-15).at(0, 0.5, 0);
    const hoodOuterRaw = sdf.revolve(
      profile.polygon(
        [[0, 1.0], [0.03, 0.99], [0.085, 0.925], [0.14, 0.85], [0.2, 0.78], [0.243, 0.69], [0.27, 0.6], [0.272, 0.52], [0.262, 0.44], [0, 0.44]],
        { smooth: true, samples: 6 },
      ),
    );
    const hoodInnerRaw = sdf.revolve(
      profile.polygon(
        [[0, 0.975], [0.012, 0.968], [0.065, 0.91], [0.12, 0.845], [0.178, 0.78], [0.222, 0.69], [0.25, 0.6], [0.252, 0.52], [0.245, 0.3], [0, 0.3]],
        { smooth: true, samples: 6 },
      ),
    );
    const collarNotch = (angle: number, top: number, w: number) => sdf.extrude(profile.polygon([[-w, 0.38], [w, 0.38], [0, top]]), 0.7).rotateY(angle);
    const collarCut = sdf.union(
      collarNotch(10, 0.53, 0.05),
      collarNotch(36, 0.5, 0.04),
      collarNotch(64, 0.54, 0.05),
      collarNotch(93, 0.5, 0.042),
      collarNotch(121, 0.535, 0.05),
      collarNotch(150, 0.505, 0.04),
    );
    const flatten = (s: sdf.Shape) => s.scale([1, 1, 0.8]);
    // Four long creases from the peak to the shoulder (0.012 wide, 0.008 deep), each at its own angle and twist.
    const creaseRows: [number, number][] = [[0.03, 0.99], [0.085, 0.925], [0.14, 0.85], [0.2, 0.78], [0.243, 0.69], [0.268, 0.6], [0.272, 0.52]];
    const crease = (az: number, twist: number, top: number) =>
      sdf.chain(
        creaseRows
          .filter((r) => r[1] <= top)
          .map(([rho, y], i) => {
            const a = ((az + twist * i) * Math.PI) / 180;
            const rr = rho + 0.002;
            return [rr * Math.sin(a), y, rr * Math.cos(a), 0.006] as [number, number, number, number];
          }),
        0.004,
      );
    const creasesRaw = sdf.union(crease(72, 5, 0.95), crease(140, -6, 0.99), crease(215, 7, 0.97), crease(292, -4, 0.93));
    const hoodOuter = tilt(flatten(hoodOuterRaw));
    const hoodInner = tilt(flatten(hoodInnerRaw));
    const hoodRagged = tilt(flatten(hoodOuterRaw.subtract(collarCut).subtract(creasesRaw)));
    const creasesW = tilt(flatten(creasesRaw));
    const opening = sdf.ellipsoid([0.19, 0.27, 0.2]).at(0, 0.58, HC[2] + 0.06);
    // The rim of the opening on the hood surface (probed), for the folded edge and the brow overhang.
    const rimPoint = (deg: number): V3 | null => {
      const c = Math.cos((deg * Math.PI) / 180);
      const s = Math.sin((deg * Math.PI) / 180);
      for (let rho = 0.02; rho < 0.45; rho += 0.004) {
        const x = rho * c;
        const y = 0.6 + rho * s;
        const hit = sdf.raycast(hoodOuter, [x, y, 1], [0, 0, -1]);
        if (!hit) continue;
        if (opening.dist(x, y, hit[2]) > 0) return [x, y, hit[2]];
      }
      return null;
    };
    const browPts: [number, number, number, number][] = [];
    for (let deg = 20; deg <= 160; deg += 10) {
      const p = rimPoint(deg);
      if (!p) continue;
      const f = Math.pow(Math.max(0, Math.sin((deg * Math.PI) / 180)), 2);
      browPts.push([p[0], p[1] + 0.006 * f, p[2] + 0.045 * f, 0.02 + 0.006 * f]);
    }
    const brow = browPts.length > 1 ? sdf.chain(browPts, 0.01) : sdf.sphere(0.001).at(0, -5, 0);
    const lip = opening.round(0.022).subtract(opening).intersect(hoodOuter.round(0.013)).subtract(hoodInner);

    // ---- the skull: skin, darker near the hood's rim and on the far side
    const lids = sdf.union(
      sdf.torus(0.052, 0.009).rotateX(90).at(eyeC[0], eyeC[1], eyeC[2] + 0.003),
      sdf.ellipsoid([0.04, 0.024, 0.024]).at(EYE_X, EYE_Y + 0.008, faceZ(EYE_X, EYE_Y) - 0.005),
    );
    const wrinkleRings = sdf.union(
      ...[0.06, 0.068, 0.076].map((R, i) => sdf.torus(R, 0.0045).rotateX(90).at(eyeC[0] - 0.003 * i, eyeC[1] - 0.002 * i, eyeC[2] - 0.0015 - 0.007 * i)),
    );
    const neck = sdf.capsule([0, 0.4, -0.01], [0, 0.5, 0.03], 0.055).bone('neck');
    const headSkin = sdf
      .smoothUnion(0.02, headSolid.bone('head'), lids.bone('head'))
      .smoothUnion(0.005, wrinkleRings.bone('head'))
      .paintWhere(wrinkleRings.round(0.003), T.wrinkle, 0.002)
      .paintFn((x, y, z, base) => {
        const b = noise.fbm(x * 30, y * 30, z * 30, 2) > 0.38 ? rgb(T.skinDark) : base;
        const d = opening.dist(x, y, z);
        const t1 = Math.min(1, Math.max(0, (d + 0.06) / 0.06));
        const t2 = Math.min(1, Math.max(0, x / 0.07)) * 0.5;
        return mixRgb(b, rgb('#2c3424'), Math.max(t1 * 0.75, t2));
      });
    put('head-skin', sdf.smoothUnion(0.03, headSkin, neck), { color: T.skin, roughness: 0.6, detail: 0.004, textureDensity: 2, maxTriangles: 6500 });

    // The eye: pale, round, glowing a little, with a small dark pupil.
    const eyeShape = sdf
      .sphere(0.05)
      .at(...eyeC)
      .paintWhere(sdf.cylinder(0.008, 1).rotateX(90).at(eyeC[0] + 0.004, eyeC[1] - 0.002, 0).intersect(sdf.halfSpace([0, 0, -1], -(eyeC[2] + 0.026))), '#141a10', 0.002)
      .paintWhere(sdf.sphere(0.0038).at(eyeC[0] + 0.012, eyeC[1] + 0.013, eyeC[2] + 0.047), '#ffffff', 0.002);
    put('eye', eyeShape.bone('head'), { color: T.eye, roughness: 0.2, emissive: T.eye, emissiveIntensity: 0.4, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ beak mask (0.18 long: two cones, the tip curving down)
    const D20 = (20 * Math.PI) / 180;
    const D30 = (30 * Math.PI) / 180;
    const beakA: V3 = [0, HC[1] - 0.04, faceZ(0, HC[1] - 0.04) - 0.02];
    const beakB: V3 = [0, beakA[1] - 0.09 * Math.sin(D20), beakA[2] + 0.09 * Math.cos(D20)];
    const beakC: V3 = [0, beakB[1] - 0.09 * Math.sin(D30), beakB[2] + 0.09 * Math.cos(D30)];
    /** A point on the beak at `t` (0..1 along it), around the axis by `th` radians (0 = the top), at `f` of the radius. */
    const beakAt = (t: number, th: number, f = 1): V3 => {
      const two = t > 0.5;
      const u = two ? (t - 0.5) * 2 : t * 2;
      const [P, Q, ra, rb, ang] = two ? ([beakB, beakC, 0.03, 0.01, D30] as const) : ([beakA, beakB, 0.05, 0.03, D20] as const);
      const q = lerp(P, Q, u);
      const r = (ra + (rb - ra) * u) * f;
      return [q[0] + r * Math.sin(th), q[1] + r * Math.cos(th) * Math.cos(ang), q[2] + r * Math.cos(th) * Math.sin(ang)];
    };
    const crack = (t0: number, t1: number, th: number, wob: number) =>
      sdf.chain(
        [0, 1, 2, 3, 4, 5].map((i) => {
          const t = t0 + ((t1 - t0) * i) / 5;
          const q = beakAt(t, th + wob * Math.sin(i * 1.9 + th), 0.965);
          return [q[0], q[1], q[2], 0.0042] as [number, number, number, number];
        }),
        0.002,
      );
    const cracks = sdf.union(crack(0.12, 0.92, 0.75, 0.16), crack(0.3, 0.97, -0.95, 0.14), crack(0.08, 0.66, 2.2, 0.12));
    const ridge = sdf.chain(
      [0.04, 0.2, 0.4, 0.6, 0.8, 0.95].map((t) => {
        const q = beakAt(t, 0, 0.93);
        return [q[0], q[1], q[2], 0.009] as [number, number, number, number];
      }),
      0.004,
    );
    const maskBase = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.08, 0.07, 0.07]).at(0, HC[1] - 0.055, faceZ(0, HC[1] - 0.055) - 0.03),
      sdf.smoothUnion(0.02, sdf.cone(beakA, beakB, 0.05, 0.03), sdf.cone(beakB, beakC, 0.03, 0.01)),
    );
    const maskShape = maskBase.paintWhere(ridge, C.maskRidge, 0.004).paintWhere(cracks, C.maskCrack, 0.0015);
    put('mask', maskShape.bone('head'), {
      color: C.mask,
      roughness: 0.55,
      detail: 0.004,
      maxTriangles: 6500,
      bump: (x, y, z) => {
        const g = Math.max(0, 1 - Math.max(cracks.dist(x, y, z), 0) / 0.003);
        return -0.0028 * g + 0.0007 * noise.fbm(x * 90, y * 90, z * 90, 1);
      },
    });
    // Two brass rivets where the beak meets the mask (probed on the mask surface).
    const rivet = (sx: number) => {
      const y = beakA[1] + 0.012;
      const hit = sdf.raycast(maskBase, [0.045 * sx, y, 1], [0, 0, -1]);
      return sdf.sphere(0.007).at(0.045 * sx, y, (hit ? hit[2] : beakA[2] + 0.02) + 0.001);
    };
    const rivets = sdf.union(rivet(1), rivet(-1)).bone('head');

    // ------------------------------------------------------------------ hood: draped cloth, folded rim, brow overhang, ragged collar
    // Low-frequency folds: the outer and inner surfaces get the same displacement, so the cloth keeps its thickness.
    const folds = (x: number, y: number, z: number) => noise.fbm(x * 4, y * 2.5, z * 4, 2);
    const hoodInnerD = hoodInner.displace(0.02, folds);
    const hoodShell = hoodRagged
      .displace(0.02, folds)
      .subtract(hoodInnerD)
      .smoothSubtract(0.012, opening)
      .smoothUnion(0.012, lip)
      .smoothUnion(0.02, brow)
      .paintFn((x, y, z, base) => {
        if (hoodInnerD.dist(x, y, z) < 0.008) return rgb('#2a2622');
        // Soft folds: the creases and low-frequency shade patches, then a dirt band toward the hem.
        const inCrease = creasesW.dist(x, y, z) < 0.004;
        const n = noise.fbm(x * 6 + 1, y * 4, z * 6, 2);
        const shade = Math.min(1, Math.max(0, (n - 0.05) * 2.2)) * 0.6;
        const rim = 1 - Math.min(1, Math.max(0, (opening.dist(x, y, z) + 0.005) / 0.05));
        let c = inCrease || rim > 0.6 ? rgb(T.hoodShade) : mixRgb(base, rgb(T.hoodShade), shade);
        const dirt = Math.min(1, Math.max(0, (0.76 - y) / 0.16));
        return mixRgb(c, rgb(T.hoodDirt), dirt * (0.75 + 0.25 * noise.fbm(x * 18, y * 18, z * 18, 2)));
      });
    put('hood', hoodShell.bone('head'), {
      color: T.hoodBase,
      roughness: 0.9,
      detail: 0.006,
      maxTriangles: 9000,
      bump: (x, y, z) => {
        const crease = Math.max(0, 1 - Math.max(creasesW.dist(x, y, z), 0) / 0.004);
        return 0.0014 * noise.fbm(x * 40, y * 40, z * 40, 2) - 0.002 * crease;
      },
    });
    // The dark lining: an ellipsoid inside the pocket behind the skull, so the face sits in shadow.
    const dark = sdf.ellipsoid([0.18, 0.21, 0.165]).at(0, 0.61, -0.03).intersect(hoodInner);
    put('hood-dark', dark.bone('head'), { color: '#1e1e18', roughness: 0.95, detail: 0.006, maxTriangles: 3500 });

    // ------------------------------------------------------------------ arms: thin green, bandaged, clawed
    const claws: sdf.Shape[] = [];
    const wraps: sdf.Shape[] = [];
    const arm = (s: 1 | -1) => {
      const side = s > 0 ? 'L' : 'R';
      const sh = s > 0 ? SHOULDER : mx(SHOULDER);
      const el = s > 0 ? ELBOW : mx(ELBOW);
      const wr = s > 0 ? WRIST : mx(WRIST);
      const hand = handAt(wr, s);
      claws.push(hand.claws.bone(`hand.${side}`));
      wraps.push(hand.wraps.bone(`hand.${side}`));
      // Bandage sleeves: a groove-colored cone with six stacked tori each on the forearm and the lower upper arm.
      const dirF: V3 = [wr[0] - el[0], wr[1] - el[1], wr[2] - el[2]];
      const dirU: V3 = [el[0] - sh[0], el[1] - sh[1], el[2] - sh[2]];
      wraps.push(sdf.cone(lerp(el, wr, 0.02), lerp(el, wr, 0.97), 0.04, 0.034).paint('#a89e88').bone(`forearm.${side}`));
      for (let i = 0; i < 6; i++) {
        const t = 0.1 + i * 0.15;
        wraps.push(ringAt(lerp(el, wr, t), dirF, 0.04 - 0.006 * t, 0.012).paint(C.bandage).bone(`forearm.${side}`));
        const u = 0.4 + i * 0.1;
        wraps.push(ringAt(lerp(sh, el, u), dirU, 0.054, 0.012).paint(C.bandage).bone(`upperarm.${side}`));
      }
      return sdf.smoothUnion(
        0.018,
        sdf.cone(sh, el, 0.038, 0.034).bone(`upperarm.${side}`),
        sdf.cone(el, wr, 0.032, 0.027).bone(`forearm.${side}`),
        hand.skin.bone(`hand.${side}`),
      );
    };
    // Bare rotting feet: big rounded boxes with four toe spheres. The shins run under the trousers.
    const shins = pair(sdf.capsule([0.094, 0.13 + UP, 0.004], [ANKLE[0], 0.05, 0.012], 0.034).bone('leg.L'));
    const toes = pair(
      sdf
        .union(
          sdf.box([0.14, 0.06, 0.2], 0.022).at(0, 0.03, 0.035),
          ...[-0.052, -0.018, 0.017, 0.05].map((x, i) => sdf.sphere(0.023 - Math.abs(i - 1.5) * 0.002).at(x, 0.03, 0.148 - Math.abs(x) * 0.3)),
        )
        .rotateY(10)
        .at(ANKLE[0] + 0.008, 0, 0)
        .bone('foot.L'),
    );
    // The belly: an ellipsoid at the waist that pushes out of the open coat.
    const torsoRev = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.122, 0.4],
            [0.124, 0.34],
            [0.118, 0.29],
            [0.124, 0.25],
            [0.13, 0.22],
            [0.126, 0.208],
            [0, 0.208],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const belly = sdf.ellipsoid([0.17, 0.15, 0.15]).at(0, 0.27, 0.06);
    const trunk = hunch(sdf.smoothUnion(0.04, torsoRev, belly).bone('spine'));
    const skin = sdf
      .union(arm(1).at(0, UP, 0), arm(-1).at(0, UP, 0), shins, toes)
      .union(trunk.at(0, UP, 0))
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 34, y * 34, z * 34, 2);
        if (n > 0.5) return rgb(T.spot);
        return noise.fbm(x * 12 + 3, y * 12, z * 12, 2) > 0.34 ? rgb(T.skinDark) : base;
      });
    k.body('skin', skin, { color: T.skin, roughness: 0.6, textureDensity: 1.5 });
    put('claws', sdf.union(...claws), { color: C.claw, roughness: 0.5, detail: 0.004 });
    put('bandage', sdf.union(...wraps), {
      color: C.bandage,
      roughness: 0.9,
      detail: 0.005,
      maxTriangles: 6500,
    });

    // Boils: moss-green clusters on the right shoulder and the left wrist.
    const cluster = (c: V3, r: number) =>
      sdf.smoothUnion(
        0.008,
        sdf.sphere(r).at(...c),
        sdf.sphere(r * 0.8).at(c[0] + r * 1.1, c[1] + r * 0.5, c[2] - r * 0.3),
        sdf.sphere(r * 0.7).at(c[0] - r * 0.6, c[1] + r * 1.2, c[2] + r * 0.2),
        sdf.sphere(r * 0.65).at(c[0] + r * 0.3, c[1] + r * 0.2, c[2] + r * 1.2),
        sdf.sphere(r * 0.55).at(c[0] + r * 0.2, c[1] + r * 1.6, c[2] - r * 0.5),
      );
    put('boils', sdf.union(cluster([-0.19, 0.44, -0.02], 0.024).bone('upperarm.R'), cluster([WRIST[0] + 0.03, WRIST[1] + 0.02, WRIST[2] - 0.035], 0.019).bone('hand.L')), {
      color: C.boil,
      roughness: 0.55,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ coat: a shell, open in front, torn at mid-thigh
    const coatProfile = (dr: number, bottom: number) =>
      profile.polygon(
        [
          [0, 0.5],
          [0.08 - dr, 0.495],
          [0.128 - dr, 0.46],
          [0.145 - dr, 0.42],
          [0.15 - dr, 0.36],
          [0.152 - dr, 0.3],
          [0.152 - dr, 0.24],
          [0.16 - dr, 0.19],
          [0.166 - dr, 0.175],
          [0.168 - dr, 0.155],
          [0.168 - dr, bottom],
          [0, bottom],
        ],
        { smooth: false },
      );
    const coatOuter = sdf.revolve(coatProfile(0, 0.155)).scale([1, 1, 0.85]);
    const coatInner = sdf.revolve(coatProfile(0.017, 0.02)).scale([1, 1, 0.85]);
    const front = sdf
      .extrude(
        profile.polygon([
          [-0.045, 0.52],
          [0.045, 0.52],
          [0.075, 0.4],
          [0.128, 0.3],
          [0.118, 0.2],
          [0.098, 0.1],
          [-0.098, 0.1],
          [-0.118, 0.2],
          [-0.128, 0.3],
          [-0.075, 0.4],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    // Ragged hem: four wedges on the left half (the skirt is mirrored, so eight in all), 0.03 to 0.07 m deep.
    const HEM = 0.155;
    const wedge = (az: number, depth: number, w: number) =>
      sdf.extrude(profile.polygon([[-w, HEM - 0.03], [w, HEM - 0.03], [0.004, HEM + depth], [-0.004, HEM + depth]]), 0.5).at(0, 0, 0.25).rotateY(az);
    const coatCut = sdf.union(front, wedge(62, 0.05, 0.034), wedge(100, 0.07, 0.03), wedge(136, 0.032, 0.036), wedge(166, 0.06, 0.028));
    const coatShell = coatOuter
      .subtract(coatInner)
      .subtract(coatCut)
      .paintFn((x, y, z, base) => {
        // Stains: dark patches, and grime creeping up from the hem.
        const n = noise.fbm(x * 14, y * 14, z * 14, 2);
        return n > 0.35 || (y < 0.22 && n > 0.0 - (0.22 - y) * 4) ? rgb(T.coatShade) : base;
      });
    const upperBox = sdf.box([1, 0.7, 1]).at(0, 0.235 + 0.35, 0);
    const lowerHalf = sdf.box([0.5, 0.4, 1]).at(0.25, 0.235 - 0.2, 0);
    const coatBump = (x: number, y: number, z: number) => 0.0014 * noise.fbm(x * 38, y * 38, z * 38, 2);
    put('coat-top', hunch(coatShell.intersect(upperBox)).bone('spine'), { color: T.coat, roughness: 0.9, bump: coatBump });
    put('coat-skirt', pair(coatShell.intersect(lowerHalf).bone('leg.L')), { color: T.coat, roughness: 0.9, bump: coatBump });

    // Sleeves: coat cones from the shoulder to the elbow.
    const sleeves = sdf.union(
      sdf.cone([SHOULDER[0] * 0.85, 0.405, 0], lerp(SHOULDER, ELBOW, 0.98), 0.056, 0.05).bone('upperarm.L'),
      sdf.cone([-SHOULDER[0] * 0.85, 0.405, 0], lerp(mx(SHOULDER), mx(ELBOW), 0.98), 0.056, 0.05).bone('upperarm.R'),
    );
    put('sleeves', sleeves, { color: T.coat, roughness: 0.9, bump: coatBump });

    // ------------------------------------------------------------------ trousers, belt, straps, cuffs
    const legShape = sdf.smoothUnion(0.01, sdf.capsule([HIP[0], 0.2 + UP, 0], [0.096, 0.09, 0.004], 0.052), sdf.cylinder(0.058, 0.04, 0.012).at(0.096, 0.09, 0.004));
    const hemNotch = (x: number, z: number) => sdf.cone([x, 0.06, z], [x, 0.108, z], 0.016, 0.002);
    const legCut = sdf.union(
      sdf.box([0.3, 0.1, 0.3]).at(0.1, 0.02, 0),
      hemNotch(0.07, 0.05),
      hemNotch(0.135, 0.03),
      hemNotch(0.14, -0.03),
      hemNotch(0.06, -0.05),
    );
    const trousers = sdf
      .smoothUnion(0.03, sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205 + UP, 0).bone('hips'), pair(legShape.subtract(legCut).bone('leg.L')))
      .paintFn((x, y, z, base) => (noise.fbm(x * 30, y * 30, z * 30, 2) > 0.4 ? rgb('#2c2c32') : base));
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.9 });

    // The belt rides under the belly; a chest strap crosses above it.
    const beltY = 0.2;
    const beltBase = sdf.smoothUnion(0.03, torsoRev, belly.at(0, -0.02, 0)).round(0.02);
    const belt = hunch(beltBase.smoothIntersect(0.006, sdf.box([0.6, 0.036, 0.6], 0.01).at(0, beltY, 0)));
    const chestStrap = hunch(
      sdf.revolve(coatProfile(-0.01, 0.14)).scale([1, 1, 0.85]).intersect(sdf.box([0.6, 0.032, 0.6], 0.01).rotateZ(-22).at(0, 0.385, 0)),
    );
    const buckleZ = sdf.raycast(hunch(beltBase), [0, beltY + 0.02, 1], [0, 0, -1]);
    const buckleAt: V3 = [0, beltY, (buckleZ ? buckleZ[2] : 0.16) - 0.004];
    const buckle = sdf.box([0.052, 0.042, 0.012], 0.004).subtract(sdf.box([0.034, 0.024, 0.05])).at(...buckleAt).rotateX(0);
    const tongue = sdf.box([0.004, 0.026, 0.012]).at(buckleAt[0], buckleAt[1], buckleAt[2] + 0.001);
    put('belt', sdf.union(belt, chestStrap).bone('spine'), { color: C.belt, roughness: 0.7 });
    put('buckle', sdf.union(buckle, tongue).bone('spine'), { color: C.buckle, roughness: 0.4, metalness: 0.8, detail: 0.004 });
    // Hanging straps (they follow the thighs) and ankle cuffs.
    const strapAt = (x: number, z: number, len: number, w: number) =>
      sdf.chain(
        [
          [x, beltY - 0.01, z, w],
          [x * 1.02, beltY - len * 0.5, z + 0.01, w * 0.9],
          [x * 1.04, beltY - len, z + 0.02, w * 0.7],
        ],
        0.004,
      );
    const straps = pair(sdf.union(strapAt(0.05, 0.125, 0.14, 0.008), strapAt(0.12, 0.09, 0.12, 0.007)).bone('leg.L'));
    put('straps', straps, { color: C.belt, roughness: 0.75, detail: 0.004 });
    // Three leather straps hang over the belly (each follows the belly's curve; probed on the belly surface).
    const bellySurf = sdf.smoothUnion(0.04, torsoRev, belly);
    const strapList: { x: number; y: number; roll: number }[] = [
      { x: -0.062, y: 0.3, roll: 4 },
      { x: 0.034, y: 0.285, roll: -3 },
      { x: 0.092, y: 0.26, roll: -6 },
    ];
    const strapParts = strapList.map(({ x, y, roll }) => {
      const zAt = (yy: number) => (sdf.raycast(bellySurf, [x, yy, 1], [0, 0, -1]) ?? [0, 0, 0.1])[2];
      const zTop = zAt(y + 0.07);
      const zBot = zAt(y - 0.07);
      const tiltDeg = (Math.atan2(zTop - zBot, 0.14) * 180) / Math.PI;
      const zMid = zAt(y);
      const place = (sh: sdf.Shape) => hunch(sh.rotateX(-tiltDeg).rotateZ(roll).at(x, y, zMid + 0.003));
      const strap = place(sdf.box([0.03, 0.14, 0.01], 0.004));
      const buckleShape = place(sdf.box([0.03, 0.02, 0.008], 0.003).subtract(sdf.box([0.018, 0.01, 0.05])).at(0, 0.03, 0.005));
      return { strap, buckleShape };
    });
    put('chest-straps', sdf.union(...strapParts.map((q) => q.strap)).bone('spine'), { color: C.strap, roughness: 0.75, detail: 0.004 });
    put('brass', sdf.union(...strapParts.map((q) => q.buckleShape).map((b) => b.bone('spine')), rivets), {
      color: C.brass,
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.003,
    });
    // Three torn ribbons hang from the hem: 0.02 wide, 0.11 long, ending well above the ground.
    const ribbon = (at: V3, thinAxis: 'x' | 'z', sway: number, bone: string) => {
      const line = sdf.chain(
        [[0, 0, 0, 0.01], [sway * 0.4, -0.035, 0.004, 0.0095], [sway, -0.075, -0.004, 0.0085], [sway * 1.6, -0.11, 0.002, 0.0045]],
        0.006,
      );
      const flat = line.scale(thinAxis === 'x' ? [0.32, 1, 1] : [1, 1, 0.32]);
      return flat.at(...at).bone(bone);
    };
    const ribbons = sdf.union(
      ribbon([0.166, 0.165, 0.0], 'x', 0.006, 'leg.L'),
      ribbon([-0.085, 0.165, -0.125], 'z', -0.01, 'leg.R'),
      ribbon([0.03, 0.165, -0.143], 'z', 0.012, 'hips'),
    );
    put('ribbons', ribbons, { color: T.coatShade, roughness: 0.9, detail: 0.003 });
    const cuffs = pair(sdf.torus(0.05, 0.014).at(ANKLE[0], 0.076, 0.006).bone('foot.L'));
    k.body('cuffs', cuffs, { color: '#4a3628', roughness: 0.8, detail: 0.005 });

    // ------------------------------------------------------------------ the lantern-pot on hand.L
    const L0: V3 = [WRIST[0] + 0.005, WRIST[1] - 0.045, WRIST[2] + 0.04]; // where the bail passes through the fist
    const potC: V3 = [L0[0], L0[1] - 0.115, L0[2]];
    const potOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, -0.075],
            [0.03, -0.074],
            [0.05, -0.062],
            [0.066, -0.03],
            [0.07, 0.0],
            [0.062, 0.03],
            [0.04, 0.05],
            [0.032, 0.056],
            [0, 0.056],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .at(...potC);
    const holes = sdf.union(
      ...[0, 60, 120, 180, 240, 300].map((a, i) => {
        const r = 0.068;
        const y = i % 2 ? 0.006 : -0.014;
        return sdf.ellipsoid([0.011, 0.016, 0.02]).at(r, y, 0).rotateY(a).at(...potC);
      }),
    );
    const lid = sdf
      .smoothUnion(
        0.008,
        sdf.cylinder(0.046, 0.016, 0.006).at(potC[0], potC[1] + 0.056, potC[2]),
        sdf.cylinder(0.026, 0.014, 0.006).at(potC[0], potC[1] + 0.07, potC[2]),
      );
    const potShell = potOuter.subtract(potOuter.round(-0.008)).subtract(holes.round(0.0));
    const bail = sdf.torus(0.034, 0.0045).rotateX(90).rotateY(0).at(L0[0], L0[1] - 0.052, L0[2]);
    const pot = sdf
      .union(potShell, lid, bail)
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 40, y * 40, z * 40, 2);
        return n > 0.25 ? rgb(C.rust) : base;
      });
    put('lantern', pot, {
      color: C.lantern,
      roughness: 0.6,
      metalness: 0.5,
      bone: 'hand.L',
      detail: 0.005,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });
    put('glow', sdf.sphere(0.056).at(...potC), { color: T.glow, emissive: T.glow, emissiveIntensity: 1.2, roughness: 0.3, bone: 'hand.L', detail: 0.005 });
    const fumes = sdf.union(
      sdf.ellipsoid([0.026, 0.034, 0.024]).at(potC[0] + 0.05, potC[1] + 0.13, potC[2] + 0.03),
      sdf.ellipsoid([0.02, 0.026, 0.02]).at(potC[0] + 0.075, potC[1] + 0.17, potC[2] + 0.05),
      sdf.ellipsoid([0.032, 0.024, 0.028]).at(potC[0] + 0.03, potC[1] + 0.105, potC[2] + 0.06),
    );
    put('fumes', fumes, { color: T.fumes, opacity: 0.5, roughness: 0.6, bone: 'hand.L', detail: 0.005 });

    // ------------------------------------------------------------------ animation
    const SHOULDER_W = lift(SHOULDER);
    const ELBOW_W = lift(ELBOW);
    const WRIST_W = lift(WRIST);
    const { wave, bump } = motion;

    k.animation('idle', {
      duration: 3.0,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0], rotate: [0, 0, 3 * wave(p)] },
        spine: { rotate: [4, 0, -2 * wave(p)] },
        chest: { rotate: [2 * wave(p, 1, 0.2), 0, 0] },
        // The head lolls to one side and back.
        head: { rotate: [4 + 3 * wave(p, 1, 0.3), 6 * wave(p, 1, 0.1), 10 * wave(p, 1, 0.25)] },
        'upperarm.L': { rotate: [-6 + 4 * wave(p, 1, 0.15), 0, 4 * wave(p, 1, 0.4)] },
        'upperarm.R': { rotate: [-6 + 4 * wave(p, 1, 0.35), 0, -4 * wave(p, 1, 0.1)] },
        'forearm.L': { rotate: [-6 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-6 * bump(p, 1, 0.5), 0, 0] },
      }),
    });

    // A shamble on the knees: the left leg steps (motion.gait, heel strike to toe-off), the right
    // foot drags on its toe (a second gait with a short stride, almost no lift, no roll, and the
    // foot pitched `drag` degrees toe down; the ankle rises by `raise` so the toe rests on the
    // floor). The hips heave up on the side of the swing leg (the left at p = 0.06, the right at
    // 0.56) to haul it forward; both gait calls get this turn, so the planted feet do not slide.
    // Both calls share the phase, duty, sit, and bob, so their hips heights are the same.
    // Sole points measured on the foot SDF at y = 0 (left foot).
    const SOLE_HEEL: V3 = [0.1225, 0, -0.056];
    const SOLE_TOE: V3 = [0.085, 0, 0.1145];
    const LEGS = { hip: lift(HIP), knee: lift(KNEE), ankle: ANKLE };
    const SHAMBLE_HIPS: V3 = [0, 0.2 + UP, 0];
    interface Shamble {
      strideL: number; liftL: number; strideR: number; liftR: number; drag: number;
      duty: number; sit: number; bob: number; lean: number; lurch: number;
    }
    const shamble = (duration: number, o: Shamble) => {
      const t = (o.drag * Math.PI) / 180;
      const low = (q: V3) => (q[1] - ANKLE[1]) * Math.cos(t) - (q[2] - ANKLE[2]) * Math.sin(t);
      const raise = -Math.min(low(SOLE_HEEL), low(SOLE_TOE)) - ANKLE[1];
      const dragHeel: V3 = [SOLE_HEEL[0], -raise, SOLE_HEEL[2]];
      const dragToe: V3 = [SOLE_TOE[0], -raise, SOLE_TOE[2]];
      return {
        duration,
        pose: (_t: number, p: number) => {
          const s = wave(p);
          const heave = wave(p, 1, 0.19); // +1 at p = 0.06 (left hip up), -1 at 0.56 (right hip up)
          const hipsTurn: V3 = [0, 8 * s, o.lurch * heave];
          const shared = { duty: o.duty, sit: o.sit, bob: o.bob, hips: { at: SHAMBLE_HIPS, rotate: hipsTurn } };
          const step = motion.gait(p - 0.25, LEGS, { ...shared, stride: o.strideL, lift: o.liftL, roll: 10, heel: SOLE_HEEL, toe: SOLE_TOE });
          const dragged = motion.gait(p - 0.25, LEGS, { ...shared, stride: o.strideR, lift: o.liftR, roll: 0, heel: dragHeel, toe: dragToe });
          const legR = dragged.pose['leg.R']!.rotate;
          const shinR = dragged.pose['shin.R']!.rotate;
          const footR = motion.orient([hipsTurn, legR, shinR], { dir: [0, 0, 1], up: [0, 1, 0] }, { dir: [0, -Math.sin(t), Math.cos(t)], up: [0, Math.cos(t), Math.sin(t)] });
          return {
            'leg.L': step.pose['leg.L']!,
            'shin.L': step.pose['shin.L']!,
            'foot.L': step.pose['foot.L']!,
            'leg.R': { rotate: legR },
            'shin.R': { rotate: shinR },
            'foot.R': { rotate: footR }, // dragged: the toe stays down on the floor
            hips: { move: [0, Math.min(step.hipsY, dragged.hipsY), 0] as const, rotate: hipsTurn },
            spine: { rotate: [o.lean, 0, -o.lurch * 0.6 * heave] as const },
            chest: { rotate: [2 * wave(p, 2, 0.1), -6 * s, 0] as const },
            head: { rotate: [-o.lean * 0.5 + 4 * wave(p, 2, 0.3), 6 * s, 8 * wave(p, 1, 0.25)] as const },
            // The left hand carries the lantern (it sways); the right arm swings a little.
            'upperarm.L': { rotate: [-12 + 5 * wave(p, 1, 0.1), 0, -3 + 2 * s] as const },
            'upperarm.R': { rotate: [-16 + 12 * wave(p, 1, 0.6), 0, 4 + 2 * s] as const },
            'forearm.L': { rotate: [-4 * wave(p, 2, 0.3), 0, 0] as const },
            'forearm.R': { rotate: [-4 * wave(p, 2, 0.55), 0, 0] as const },
          };
        },
      };
    };
    k.animation('walk', shamble(1.3, { strideL: 0.1, liftL: 0.026, strideR: 0.05, liftR: 0.004, drag: 8, duty: 0.62, sit: 0.006, bob: 0.005, lean: 8, lurch: 6 }));
    k.animation('run', shamble(0.75, { strideL: 0.14, liftL: 0.04, strideR: 0.07, liftR: 0.006, drag: 8, duty: 0.55, sit: 0.014, bob: 0.008, lean: 16, lurch: 8 }));


    // ------------------------------------------------------------------ attack: a heavy swipe with the right claw
    // Wind-up: the body rocks back and the right arm rises out to the side. Swipe: the trunk falls
    // forward and the claw rakes across in front of the belly. Hold, then a slow recovery. The left
    // hand keeps the lantern low (it swings with the lunge). The legs counter the hips' turn, so the feet stay planted.
    {
      const { keys } = motion;
      k.animation('attack', {
        duration: 1.0,
        loop: false,
        pose: (_t, p) => {
          const hipsX = keys(p, [[0, 0], [0.3, -3], [0.5, 7], [0.68, 6], [1, 0]] as const);
          const hipsY = keys(p, [[0, 0], [0.3, 6], [0.5, -10], [0.68, -8], [1, 0]] as const);
          const spineX = keys(p, [[0, 0], [0.3, -8], [0.5, 12], [0.68, 10], [1, 0]] as const);
          return {
            hips: { move: [0, 0, keys(p, [[0, 0], [0.3, -0.02], [0.5, 0.04], [0.68, 0.035], [1, 0]] as const)], rotate: [hipsX, hipsY, 0] },
            spine: { rotate: [spineX, keys(p, [[0, 0], [0.3, 8], [0.5, -12], [0.68, -10], [1, 0]] as const), 0] },
            chest: { rotate: [keys(p, [[0, 0], [0.3, -4], [0.5, 6], [1, 0]] as const), 0, 0] },
            neck: { rotate: [keys(p, [[0, 0], [0.3, -6], [0.5, 4], [0.7, 3], [1, 0]] as const), 0, 0] },
            head: { rotate: [keys(p, [[0, 0], [0.3, -8], [0.5, 6], [0.7, 4], [1, 0]] as const), keys(p, [[0, 0], [0.3, 6], [0.5, -8], [1, 0]] as const), 0] },
            // The right arm: up and out, then across.
            'upperarm.R': {
              rotate: [
                keys(p, [[0, -10], [0.3, -30], [0.5, -75], [0.68, -70], [1, -10]] as const),
                keys(p, [[0, 0], [0.3, 0], [0.5, 10], [0.68, 10], [1, 0]] as const),
                keys(p, [[0, 6], [0.3, -75], [0.5, 15], [0.68, 15], [1, 6]] as const),
              ],
            },
            'forearm.R': { rotate: [keys(p, [[0, 0], [0.3, -30], [0.5, -6], [0.68, -12], [1, 0]] as const), 0, 0] },
            'hand.R': { rotate: [keys(p, [[0, 0], [0.3, -20], [0.5, 25], [0.68, 15], [1, 0]] as const), 0, 0] },
            // The left arm keeps the lantern low and sways.
            'upperarm.L': { rotate: [keys(p, [[0, -12], [0.3, 6], [0.5, -26], [0.68, -20], [1, -12]] as const), 0, -3] },
            'forearm.L': { rotate: [keys(p, [[0, 0], [0.5, -10], [1, 0]] as const), 0, 0] },
            'leg.L': { rotate: [-hipsX, -hipsY, 0] },
            'leg.R': { rotate: [-hipsX, -hipsY, 0] },
          };
        },
      });
    }

    // ------------------------------------------------------------------ hit: a late, floppy recoil
    // The chest rocks back first. The head follows late, lolls far back, flops forward past the
    // stance, and sways back. The arms fling up loosely a beat behind the chest and drop again.
    // The hips give way backward over planted feet (`SHIN` keeps the ankles on their rest spot).
    const { keys } = motion;
    const DEG = Math.PI / 180;
    const SHIN = 0.125 + UP; // hip joint to ankle joint
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    /** The leg angle (degrees, + = the hips in front of the ankle) for the hips `dz` meters ahead of it. */
    const legFor = (dz: number) => Math.asin(Math.max(-1, Math.min(1, dz / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.75], [0.6, -0.2], [0.82, 0.06], [1, 0]] as const);
        const loll = keys(p, [[0, 0], [0.07, 0], [0.3, 1], [0.48, 0.3], [0.66, -0.45], [0.85, 0.14], [1, 0]] as const);
        const flop = keys(p, [[0, 0], [0.1, 0], [0.3, 1], [0.52, -0.35], [0.72, 0.14], [0.9, -0.04], [1, 0]] as const);
        const roll = keys(p, [[0, 0], [0.12, 0], [0.34, 1], [0.58, -0.5], [0.8, 0.18], [1, 0]] as const);
        const leg = legFor(-0.022 * h);
        return {
          hips: { move: [0, -SHIN * (1 - Math.cos(leg * DEG)), -0.022 * h], rotate: [0, 4 * roll, 3 * roll] },
          spine: { rotate: [4 - 7 * h, 0, -4 * roll] },
          chest: { rotate: [-12 * h, 5 * h, 2 * roll] },
          neck: { rotate: [-10 * loll, 0, 0] },
          head: { rotate: [-24 * loll, 8 * roll, 14 * roll] },
          'upperarm.L': { rotate: [-30 * flop, 0, 16 * flop] },
          'upperarm.R': { rotate: [-24 * flop, 0, -19 * flop] },
          'forearm.L': { rotate: [-22 * flop, 0, 0] },
          'forearm.R': { rotate: [-16 * flop, 0, 0] },
          'hand.L': { rotate: [18 * flop, 0, 0] },
          'hand.R': { rotate: [14 * flop, 0, 0] },
          'leg.L': { rotate: [leg, 0, -3 * roll] },
          'leg.R': { rotate: [leg, 0, -3 * roll] },
          'foot.L': { rotate: [-leg, 0, 0] },
          'foot.R': { rotate: [-leg, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: the knees give way, a forward crumple
    // The blow lolls the head back and the zombie sways. Then the knees give way: the legs fold back
    // as the hips sink forward over the planted feet, and the trunk slumps. Then it topples forward,
    // faster and faster, onto its face; the legs lie flat behind it, soles up. The arms trail in the
    // fall, then flop onto the ground beside the head. At last the head rolls onto its cheek.
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.45], [0.3, 0]] as const);
        const loll = keys(p, [[0, 0], [0.04, 0], [0.15, 1], [0.26, 0.25], [0.34, -0.25], [0.42, 0]] as const);
        const sway = keys(p, [[0.06, 0], [0.18, 1], [0.3, -0.6], [0.42, 0]] as const);
        const buckle = keys(p, [[0.24, 0], [0.46, 1]] as const); // the knees give way
        const u = clamp01((p - 0.42) / 0.22);
        const topple = u * u; // the fall speeds up to the impact at 0.64
        const bounce = keys(p, [[0.64, 0], [0.69, 1], [0.76, 0]] as const);
        const trail = keys(p, [[0.44, 0], [0.6, 1], [0.66, 0]] as const); // the arms lag in the fall
        const land = keys(p, [[0.6, 0], [0.7, 1]] as const); // the arms flop onto the ground
        const whip = keys(p, [[0.46, 0], [0.6, 1], [0.68, -0.4], [0.76, 0]] as const);
        const roll = keys(p, [[0.72, 0], [0.9, 1]] as const); // the head rolls onto its cheek
        // The legs fold back over the planted ankles; the hips follow the hip joint's arc.
        const leg = legFor(-0.02 * hitB) + 45 * buckle + 45 * topple;
        const ankleY = 0.07 - 0.02 * topple;
        const hipsY = ankleY + SHIN * Math.cos(leg * DEG) + 0.005 + 0.012 * bounce;
        const hipsTilt = 16 * buckle + 44 * topple - 3 * bounce;
        const trunk = hipsTilt + 4 + 8 * buckle; // hips + spine + chest, for the limp arms
        return {
          hips: { move: [0, hipsY - 0.2 - UP, SHIN * Math.sin(leg * DEG)], rotate: [hipsTilt, 6 * buckle, 4 * sway] },
          spine: { rotate: [4 - 6 * hitB + 4 * buckle, 0, -4 * sway] },
          chest: { rotate: [-10 * hitB + 4 * buckle - 6 * whip, 4 * hitB, 3 * sway] },
          neck: { rotate: [-10 * loll - 8 * topple * (1 - land) - 6 * roll, 0, 0] },
          head: {
            rotate: [-24 * loll + 10 * buckle - 20 * topple * (1 - land) + 14 * whip - 12 * roll, 10 * sway + 62 * roll, 12 * sway + 14 * roll],
          },
          // Limp arms: they hang as the trunk slumps, trail up in the fall, and slap down out wide.
          'upperarm.L': { rotate: [-24 * hitB - 0.8 * trunk * (1 - land) + 70 * trail - 6 * land, 0, 20 * hitB + 36 * land] },
          'upperarm.R': { rotate: [-20 * hitB - 0.8 * trunk * (1 - land) + 60 * trail - 10 * land, 0, -18 * hitB - 30 * land] },
          'forearm.L': { rotate: [-14 * hitB - 10 * buckle + 10 * land, 0, 12 * land] },
          'forearm.R': { rotate: [-10 * hitB - 16 * buckle + 16 * land, 0, -8 * land] },
          'hand.L': { rotate: [10 * hitB + 20 * buckle + 25 * land, 0, 0] },
          'hand.R': { rotate: [10 * hitB + 24 * buckle + 25 * land, 0, 0] },
          'leg.L': { rotate: [leg - hipsTilt, 0, 4 * buckle - 4 * sway] },
          'leg.R': { rotate: [leg - hipsTilt, -8 * buckle, -6 * buckle - 4 * sway] },
          'foot.L': { rotate: [150 * topple - leg, 0, 0] }, // flat on the ground, then soles up
          'foot.R': { rotate: [140 * topple - leg, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ rise: it claws its way up out of a grave
    // The spawn clip. In the game the floor hides everything below y = 0, so this clip keeps the
    // body under the floor (`ground: false`, `dig: 1.0`). At the start the zombie is bent forward
    // in the grave, the hips about 0.5 m down: the short chibi arms cannot reach the floor from
    // deeper. Only the left hand breaks the surface. It bursts up and claws the air; the right hand
    // follows. Both hands slam down flat on the floor beside the hole and push, and the body comes
    // up in three jerks: the head and shoulders break through, lolling; the arms lock straight; the
    // hands let go and the zombie stands, its feet on the floor. Then a shudder and a groan (the
    // head rolls back and the chest lifts), and it settles into the rest pose. The wrists follow
    // world targets, converted into the chest's rest frame for `reach`, so the planted hands stay
    // flat on the floor while the body rises past them.
    {
      const { reach, orient, quat, follow } = motion;
      const HIPS_AT: V3 = [0, 0.2 + UP, 0];
      const SPINE_AT: V3 = [0, 0.26 + UP, 0];
      const CHEST_AT: V3 = [0, 0.33 + UP, 0];
      const ARM_L = { root: SHOULDER_W, mid: ELBOW_W, end: WRIST_W };
      const ARM_R = { root: mx(SHOULDER_W), mid: mx(ELBOW_W), end: mx(WRIST_W) };
      // The left hand's rest frame: the middle finger's direction from the wrist, and the back of the hand.
      const HAND_DIR: V3 = [-0.1, -0.8, 0.6];
      const HAND_UP: V3 = [0, 0.6, 0.8];
      const FLAT_Y = 0.041; // the wrist's height when the hand lies flat on the floor
      const PLANT: V3 = [0.34, FLAT_Y, 0.1]; // where the left hand pushes on the floor
      const vec = (p: V3) => new THREE.Vector3(p[0], p[1], p[2]);
      const arr = (p: THREE.Vector3): V3 => [p.x, p.y, p.z];
      const unit = (d: V3): V3 => arr(vec(d).normalize());
      /** A weighted sum of points or directions. */
      const blend = (...parts: (readonly [V3, number])[]): V3 =>
        parts.reduce<V3>((s, [v, w]) => [s[0] + v[0] * w, s[1] + v[1] * w, s[2] + v[2] * w], [0, 0, 0]);
      k.animation('rise', {
        duration: 2.0,
        loop: false,
        ground: false,
        dig: 1.0,
        pose: (t, p) => {
          // ---- the trunk: three jerky heaves (a fast pull up, then a stall or a sag back)
          const hy = keys(p, [[0, -0.5], [0.07, -0.45], [0.2, -0.43], [0.27, -0.39], [0.31, -0.39], [0.37, -0.27], [0.41, -0.29], [0.44, -0.29], [0.5, -0.17], [0.58, -0.18], [0.61, -0.18], [0.7, 0]] as const);
          const hz = keys(p, [[0, -0.16], [0.31, -0.14], [0.37, -0.1], [0.5, -0.06], [0.61, -0.06], [0.7, 0]] as const);
          const lean = keys(p, [[0, 85], [0.27, 82], [0.31, 82], [0.37, 64], [0.44, 63], [0.5, 40], [0.61, 38], [0.7, 4], [0.76, 0]] as const);
          // The strain in the push, the shudder after the stand, and the groan.
          const strain = keys(p, [[0.47, 0], [0.52, 1], [0.58, 1], [0.62, 0]] as const) * Math.sin(2 * Math.PI * 11 * t);
          const shud = keys(p, [[0.68, 0], [0.72, 1], [0.8, 0.5], [0.88, 0]] as const) * Math.sin(2 * Math.PI * 7 * t);
          const groan = keys(p, [[0.74, 0], [0.82, 1], [0.9, 1], [1, 0]] as const);
          // The head hangs in the grave, then lolls from side to side at each heave.
          const loll = keys(p, [[0, 0], [0.31, 0], [0.37, 1], [0.44, -0.7], [0.5, 0.8], [0.58, -0.4], [0.66, 0.5], [0.74, 0]] as const);
          const nod = keys(p, [[0, 1], [0.31, 1], [0.37, -0.6], [0.44, 0.5], [0.5, -0.5], [0.58, 0.3], [0.66, -0.3], [0.74, 0]] as const);

          const hipsR: V3 = [0.5 * lean, 2 * shud, 3 * shud];
          const spineR: V3 = [0.3 * lean + 2 * strain, 0, -2 * shud];
          const chestR: V3 = [0.2 * lean - 10 * groan, 3 * strain, 4 * shud];
          const hipsMove: V3 = [0, hy, hz];

          // ---- arms: world wrist targets in the chest's rest frame
          const chestAt = vec(follow([HIPS_AT, SPINE_AT], [hipsR, spineR], CHEST_AT)).add(vec(hipsMove));
          const chestQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR));
          const inv = chestQ.clone().invert();
          const toChest = (w: V3): V3 => arr(vec(w).sub(chestAt).applyQuaternion(inv).add(vec(CHEST_AT)));
          const fromChest = (c: V3): V3 => arr(vec(c).sub(vec(CHEST_AT)).applyQuaternion(chestQ).add(chestAt));
          const dirToChest = (d: V3): V3 => arr(vec(unit(d)).applyQuaternion(inv));
          const arm = (s: 1 | -1) => {
            const m = (w: V3): V3 => (s > 0 ? w : mx(w));
            const shoulder = fromChest(m(SHOULDER_W));
            // Three modes, blended: an arm straight up out of the ground, a hand flat on the floor,
            // and a free arm in the chest's frame (buried, then after the stand).
            const up = s > 0 ? keys(p, [[0, 1], [0.22, 1], [0.29, 0]] as const) : keys(p, [[0.09, 0], [0.16, 1], [0.23, 1], [0.3, 0]] as const);
            const flat = s > 0 ? keys(p, [[0.22, 0], [0.29, 1], [0.57, 1], [0.63, 0]] as const) : keys(p, [[0.23, 0], [0.3, 1], [0.58, 1], [0.64, 0]] as const);
            const free = 1 - up - flat;
            // The raised arm: bent at the start, it bursts up straight and claws the air.
            const claw = s > 0 ? bump(clamp01((p - 0.05) / 0.18), 3) : bump(clamp01((p - 0.15) / 0.08), 2);
            const len = s > 0 ? keys(p, [[0, 0.17], [0.05, 0.5]] as const) : 0.5;
            const upW = blend([shoulder, 1], [[s * (1.1 + 0.03 * wave(p, 3)), 1, 0.08], len]);
            const upDir = blend([[s * 0.1, 1, 0.15], 1 - claw], [[s * 0.1, 0.3, 1], claw]);
            const upBack = blend([[0, 0.15, -1], 1 - claw], [[0, 1, -0.3], claw]);
            // The planted hand: flat, the fingers out and forward, the claw tips down on the floor.
            // At the release the hand lifts straight up first, so the claw tips never scrape into the floor.
            const lift = s > 0 ? keys(p, [[0.56, 0], [0.6, 0.1]] as const) : keys(p, [[0.57, 0], [0.61, 0.1]] as const);
            const flatW = m([PLANT[0], PLANT[1] + lift, PLANT[2] + 0.003 * strain]);
            // The free arm: rest, spread out and up a little in the groan, trembling in the shudder.
            // Right after the release the hands stay up at the chest while the legs come out of the hole.
            const held = keys(p, [[0.5, 0], [0.55, 1], [0.66, 1], [0.74, 0]] as const);
            const freeW = m(blend([WRIST_W, 1 - 0.8 * groan], [[0.34, 0.36, 0.1], 0.8 * groan], [[0.012 * shud + 0.02 * held, 0.01 * shud + 0.12 * held, 0.02 * held], 1]));
            const target = blend([toChest(upW), up], [toChest(flatW), flat], [freeW, free]);
            const pole = blend(
              [toChest(blend([shoulder, 1], [[s * 0.3, -0.05, -0.2], 1])), up],
              [toChest(blend([shoulder, 1], [[s * 0.45, 0.08, -0.15], 1])), flat],
              [m([0.3, 0.33, 0.06]), free],
            );
            const ik = reach(s > 0 ? ARM_L : ARM_R, target, pole);
            const dir = blend([dirToChest(upDir), up], [dirToChest([s * 0.3, -0.22, 0.93]), flat], [unit(m(HAND_DIR)), free]);
            const back = blend([dirToChest(upBack), up], [dirToChest([0, 1, 0.24]), flat], [unit(m(HAND_UP)), free]);
            const hand = orient([ik.upper, ik.lower], { dir: m(HAND_DIR), up: m(HAND_UP) }, { dir, up: back });
            return { upper: ik.upper, lower: ik.lower, hand };
          };
          const L = arm(1);
          const R = arm(-1);

          // ---- legs: they hang straight down under the leaning hips and kick in the heaves; the
          // left leg steps up out of the hole in the last heave.
          const kick = keys(p, [[0.3, 0], [0.36, 1], [0.58, 1], [0.64, 0]] as const) * wave(p, 5);
          const step = keys(p, [[0.6, 0], [0.65, 1], [0.7, 0]] as const);
          const legX = -hipsR[0];
          return {
            hips: { move: hipsMove, rotate: hipsR },
            spine: { rotate: spineR },
            chest: { rotate: chestR },
            neck: { rotate: [10 * nod - 8 * groan, 0, 4 * loll] },
            head: { rotate: [14 * nod - 16 * groan + 3 * strain, 8 * loll + 10 * groan, 14 * loll + 14 * groan + 3 * shud] },
            'upperarm.L': { rotate: L.upper },
            'forearm.L': { rotate: L.lower },
            'hand.L': { rotate: L.hand },
            'upperarm.R': { rotate: R.upper },
            'forearm.R': { rotate: R.lower },
            'hand.R': { rotate: R.hand },
            'leg.L': { rotate: [legX + 14 * kick - 30 * step, 0, -hipsR[2]] },
            'leg.R': { rotate: [legX - 14 * kick, 0, -hipsR[2]] },
            'foot.L': { rotate: [20 * step, 0, 0] },
            'foot.R': { rotate: [0, 0, 0] },
          };
        },
      });
    }
  },
});
