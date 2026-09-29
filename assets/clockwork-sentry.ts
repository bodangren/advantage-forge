import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Clockwork sentry — Chibi Quest dungeon enemy: a small brass automaton about 0.95 m tall to the
 * top of the winding key, faces +Z. Target: docs/enemy-mockups/clockwork-sentry_001.jpg. Built on the
 * animated-armor rig (knee bones, `.L` and `.R` limbs, a glow bone), with a key bone and a core bone.
 *
 * Role: a small mechanical guard, seen in 3D and as a 128 px sprite; the domed head with its blue
 *   lens and the glowing porthole must read at once.
 * One idea: a wide brass dome of a head on a small barrel of a body with a glowing blue gear
 *   in a porthole, thin rod limbs, and a big round riveted plate under its feet.
 * Shape language: round (dome, barrel, plate, porthole) with thin rods and coils as the secondary.
 * Palette (60/30/10): brass #b8924a (lit #d8b878, shade #8a6a30); copper coils #8a5a3a and iron
 *   #4a4a50; the blue glow #3ac8ff on #0a2a3a as the accent (lens and gear).
 * Value plan: the blue lens and the porthole gear on brass are the strongest contrast.
 * Bodies: head, head-trim, lens-glass, lens-glow, key, body, body-trim, porthole-glass, gear, neck,
 *   arms, coils, crossbow, claw, legs, base plates, plate-rivets, tail.
 * Rig: the armor skeleton without plume and cloak, plus `key` (spins) and `core` (the gear glow).
 *   The base plate splits into two half-discs on `foot.L` and `foot.R`: it is the feet.
 *   Clips: idle, walk, run, attack (the crossbow fires), hit, death (powers down), awaken.
 */

const C = {
  brass: '#a8843e',
  lit: '#c8a460',
  shade: '#6a5028',
  copper: '#8a5a3a',
  iron: '#4a4a50',
  plate: '#4a3a30',
  plateLit: '#6a5a4a',
  glow: '#2ab8ff',
  glowBase: '#0a2a3a',
  gearBase: '#1a3a4a',
  glass: '#cfe8ff',
  seam: '#3a2a14',
};

type V3 = readonly [number, number, number];

const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const alignY = (s: sdf.Shape, d: V3, p: V3) => {
  const n = norm(d);
  return s
    .rotateZ((Math.asin(-n[0]) * 180) / Math.PI)
    .rotateX((Math.atan2(n[2], n[1]) * 180) / Math.PI)
    .at(...p);
};
/** Three stacked tori around a rod: a copper coil joint centered on `p`, along direction `d`. */
const coil = (p: V3, d: V3, tag: string, R = 0.022, r = 0.0085, gap = 0.017) => {
  const n = norm(d);
  const rings = [-1, 0, 1].map((i) => alignY(sdf.torus(R, r), n, [p[0] + n[0] * gap * i, p[1] + n[1] * gap * i, p[2] + n[2] * gap * i]));
  const core = sdf.capsule([p[0] - n[0] * gap, p[1] - n[1] * gap, p[2] - n[2] * gap], [p[0] + n[0] * gap, p[1] + n[1] * gap, p[2] + n[2] * gap], R - 0.004);
  return sdf.smoothUnion(0.004, core, ...rings).bone(tag);
};

type Rgb = readonly [number, number, number];
/**
 * Worn, warm brass from the painted base (so a recolor slot still works): lighter where the surface
 * faces up (y above the body center `cy`, scaled by `ry`), darker on the undersides, and dark
 * tarnish spots from noise. `cy` is null for rods, which get only the tarnish.
 */
const worn =
  (cy: number | null, ry: number) =>
  (x: number, y: number, z: number, base: Rgb): Rgb => {
    let f = 1;
    if (cy !== null) {
      const up = Math.max(-1, Math.min(1, (y - cy) / ry));
      f = up > 0 ? 1 + 0.18 * up : 1 + 0.37 * up;
    }
    const spot = noise.fbm(x * 38, y * 38, z * 38, 2) + 0.5 * noise.fbm(x * 9 + 3, y * 9, z * 9, 2);
    if (spot > 0.5) f *= 0.74;
    else if (spot > 0.36) f *= 0.87;
    return [base[0] * f, base[1] * f, base[2] * f];
  };
const tarnishOnly = worn(null, 1);

// Joints (world meters, rest pose).
const SHOULDER: V3 = [0.14, 0.53, 0];
const ELBOW_L: V3 = [0.29, 0.47, 0.0];
const WRIST_L: V3 = [0.275, 0.335, 0.04];
const ELBOW_R: V3 = [-0.29, 0.47, 0.0];
const WRIST_R: V3 = [-0.275, 0.34, 0.07];
const HIP: V3 = [0.075, 0.3, 0];
const KNEE: V3 = [0.075, 0.2, 0];
const ANKLE: V3 = [0.075, 0.1, 0];
const HEEL: V3 = [0.075, 0, -0.17];
const TOE: V3 = [0.075, 0, 0.17];
const HEAD_C: V3 = [0, 0.725, 0];
const BODY_C: V3 = [0, 0.46, 0];
const PORT_Z = 0.09; // the porthole ring's center plane in front of the body

export default defineAsset({
  name: 'clockwork-sentry',
  description: 'Chibi clockwork sentry dungeon enemy: a small brass automaton with a wide domed head, a blue glass lens, a barrel body with a glowing gear porthole, thin rod arms with a crossbow and a claw, and a round riveted base plate as its feet.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/clockwork-sentry_001.jpg',
  variants: {
    metal: { brass: C.brass, silver: '#b8bcc4', iron: '#4a4a50' },
    glow: { blue: C.glow, amber: '#ffb020', green: '#5aff6a' },
  },
  presets: {
    frost: { metal: 'silver', glow: 'blue' },
    ember: { metal: 'iron', glow: 'amber' },
    moss: { metal: 'brass', glow: 'green' },
  },

  build(k) {
    const SLOT = {
      brass: k.tint('metal'),
      lit: k.tint('metal', { color: C.lit, follow: 1 }),
      shade: k.tint('metal', { color: C.shade, follow: 1 }),
      glow: k.tint('glow'),
      glowDeep: k.tint('glow', -0.5),
    };

    k.skeleton({
      hips: { at: [0, 0.3, 0] },
      spine: { parent: 'hips', at: [0, 0.36, 0] },
      chest: { parent: 'spine', at: [0, 0.42, 0] },
      neck: { parent: 'chest', at: [0, 0.6, 0] },
      head: { parent: 'neck', at: [0, 0.64, 0] },
      key: { parent: 'head', at: [0, 0.83, -0.005] },
      glow: { parent: 'head', at: [0, 0.79, 0.125] },
      core: { parent: 'chest', at: [0, 0.46, 0.07] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head: a flattened capsule
    const SEAM = 0.716;
    // A dome over a shallower dish, joined at the seam: wide at the seam, tapering up.
    const domeTop = sdf.ellipsoid([0.15, 0.112, 0.145]).elongate(0.04, 0, 0).at(0, SEAM, 0).intersect(sdf.halfSpace([0, -1, 0], -SEAM + 0.01));
    const dish = sdf.ellipsoid([0.165, 0.092, 0.15]).elongate(0.025, 0, 0).at(0, SEAM, 0).intersect(sdf.halfSpace([0, 1, 0], SEAM));
    const headShape = sdf.smoothUnion(0.004, domeTop, dish);
    const seamBand = sdf.box([0.6, 0.007, 0.6]).at(0, SEAM, 0);
    const dome = headShape
      .paintWhere(sdf.halfSpace([0, 1, 0], SEAM - 0.004), SLOT.shade, 0.006)
      .paintFn(worn(SEAM + 0.02, 0.1))
      .paintWhere(seamBand, C.seam, 0.002);
    const seamBump = (_x: number, y: number) => -0.0025 * Math.max(0, 1 - Math.abs(y - SEAM) / 0.005);
    k.body('dome', dome, { color: SLOT.brass, roughness: 0.55, metalness: 0.7, bone: 'head', detail: 0.004, textureDensity: 2, bump: seamBump });

    const shellOf = (s: sdf.Shape, out: number, inn: number) => s.round(out).subtract(s.round(-inn));
    // Two side clips: brass strips that follow the dome, each ending in a round bolt at the seam.
    const clip = (x: number) =>
      shellOf(headShape, 0.008, 0.004).smoothIntersect(0.004, sdf.box([0.03, 0.14, 0.3], 0.008).at(x, 0.77, 0.18));
    const boltAt = (x: number) => {
      const hit = sdf.raycast(headShape.round(0.008), [x, 0.708, 1], [0, 0, -1])!;
      return sdf.cylinder(0.017, 0.012, 0.004).rotateX(90).at(hit[0], hit[1], hit[2] + 0.001);
    };
    // The lens: ring, glass, and core, tilted to the dome surface at the front top.
    const lensHit = sdf.raycast(headShape, [0, 1.2, 0.125], [0, -1, 0])!;
    const eps = 0.002;
    const nrm = norm([
      headShape.dist(lensHit[0] + eps, lensHit[1], lensHit[2]) - headShape.dist(lensHit[0] - eps, lensHit[1], lensHit[2]),
      headShape.dist(lensHit[0], lensHit[1] + eps, lensHit[2]) - headShape.dist(lensHit[0], lensHit[1] - eps, lensHit[2]),
      headShape.dist(lensHit[0], lensHit[1], lensHit[2] + eps) - headShape.dist(lensHit[0], lensHit[1], lensHit[2] - eps),
    ]);
    const tilt = (-Math.atan2(nrm[1], nrm[2]) * 180) / Math.PI;
    const lensPose = (s: sdf.Shape) => s.rotateX(tilt).at(lensHit[0], lensHit[1], lensHit[2]);
    const lensRing = sdf.torus(0.052, 0.012).rotateX(90).at(0, 0, 0.024).smoothUnion(0.006, sdf.cylinder(0.06, 0.02, 0.004).rotateX(90).at(0, 0, 0.006));
    const keyStem = sdf.cylinder(0.011, 0.1, 0.003).at(0, 0.875, -0.005);
    const keyBar = sdf.box([0.075, 0.014, 0.016], 0.006).at(0, 0.925, -0.005);
    k.body('head-trim', sdf.union(hard(clip(0.11)), hard(boltAt(0.11)), lensPose(lensRing)).bone('head').paintFn(tarnishOnly), {
      color: SLOT.lit,
      roughness: 0.5,
      metalness: 0.75,
      detail: 0.004,
    });
    k.body('winder', sdf.smoothUnion(0.005, keyStem, keyBar), { color: C.copper, roughness: 0.6, metalness: 0.45, detail: 0.004, bone: 'key' });
    // A dark base, an emissive core sphere, and a glass disc in front of it inside the brass bezel.
    k.body('lens-base', lensPose(sdf.cylinder(0.05, 0.012, 0.003).rotateX(90).at(0, 0, 0.004)), { color: C.glowBase, roughness: 0.6, bone: 'glow', detail: 0.004 });
    k.body('lens-glass', lensPose(sdf.cylinder(0.05, 0.008, 0.003).rotateX(90).at(0, 0, 0.034)), { color: '#8ccaf0', roughness: 0.1, opacity: 0.3, bone: 'glow', detail: 0.004 });
    k.body('lens-glow', lensPose(sdf.sphere(0.03).at(0, 0, 0.008)), {
      color: SLOT.glowDeep,
      roughness: 0.2,
      emissive: SLOT.glow,
      emissiveIntensity: 2.2,
      bone: 'glow',
      detail: 0.004,
    });

    // ------------------------------------------------------------------ body: a barrel with a porthole
    const bodyOuter = sdf.ellipsoid([0.135, 0.13, 0.12]).elongate(0, 0.02, 0).at(...BODY_C);
    const recess = sdf.cylinder(0.075, 0.2, 0.004).rotateX(90).at(0, BODY_C[1], 0.16);
    const bodyShape = bodyOuter.smoothSubtract(0.004, recess).paintWhere(sdf.cylinder(0.076, 0.2).rotateX(90).at(0, BODY_C[1], 0.16), C.gearBase, 0.002);
    // Worn brass, darker underneath, with two dark seam lines (the porthole floor keeps its color).
    const bodySeams = sdf.union(sdf.box([0.6, 0.006, 0.6]).at(0, 0.375, 0), sdf.box([0.6, 0.006, 0.6]).at(0, 0.56, 0));
    const wornBody = worn(BODY_C[1], 0.15);
    const barrelPaint = (x: number, y: number, z: number, base: Rgb): Rgb => (z > 0.05 && Math.hypot(x, y - BODY_C[1]) < 0.077 ? base : wornBody(x, y, z, base));
    k.body('barrel', bodyShape.paintWhere(sdf.halfSpace([0, -1, 0], -0.4), SLOT.shade, 0.03).paintFn(barrelPaint).paintWhere(bodySeams, C.seam, 0.002), {
      color: SLOT.brass,
      roughness: 0.55,
      metalness: 0.7,
      bone: 'chest',
      detail: 0.005,
    });
    // Porthole ring, its rivets, a small knob, two side plates, and the shoulder discs.
    const ring = sdf.torus(0.085, 0.0145).rotateX(90).at(0, BODY_C[1], PORT_Z);
    const ringRivets = sdf.union(
      ...Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return sdf.sphere(0.0085).at(Math.sin(a) * 0.085, BODY_C[1] + Math.cos(a) * 0.085, PORT_Z + 0.013);
      }),
    );
    const knob = sdf.smoothUnion(0.004, sdf.cylinder(0.008, 0.03).rotateX(90).at(0.1, 0.5, 0.075), sdf.sphere(0.014).at(0.1, 0.5, 0.093));
    const sidePlate = shellOf(bodyOuter, 0.008, 0.004).smoothIntersect(0.004, sdf.box([0.03, 0.34, 0.24], 0.01).at(0.118, 0.46, 0.05));
    const shoulderDisc = sdf.cylinder(0.03, 0.034, 0.008).rotateZ(90).at(SHOULDER[0] - 0.012, SHOULDER[1], 0);
    // A small brass gear disc on each side of the body: six teeth on an r 0.04 disc, with a hub.
    const gear6: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      for (const [da, rr] of [[-14, 0.031], [-9, 0.031], [-6, 0.041], [6, 0.041], [9, 0.031], [14, 0.031]] as const) {
        const a = ((i * 60 + da) * Math.PI) / 180;
        gear6.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
    }
    const sideGear = sdf
      .smoothUnion(0.003, sdf.extrude(profile.polygon(gear6), 0.014, 0.002), sdf.cylinder(0.014, 0.024, 0.004).rotateX(90))
      .rotateY(90)
      .at(0.145, 0.415, 0.03);
    k.body('body-trim', sdf.union(ring, ringRivets, knob, hard(sidePlate), hard(shoulderDisc), hard(sideGear)).bone('chest').paintFn(tarnishOnly), {
      color: SLOT.lit,
      roughness: 0.5,
      metalness: 0.75,
      detail: 0.004,
    });
    k.body('porthole-glass', sdf.cylinder(0.076, 0.006, 0.002).rotateX(90).at(0, BODY_C[1], PORT_Z - 0.008), {
      color: '#8ccaf0',
      roughness: 0.1,
      opacity: 0.3,
      bone: 'chest',
      detail: 0.004,
    });
    // The gear: a toothed ring, four spokes, and a hub, glowing.
    const TEETH = 12;
    const gearPoly: [number, number][] = [];
    for (let i = 0; i < TEETH; i++) {
      const a0 = (i / TEETH) * 360;
      for (const [da, rr] of [[0, 0.05], [9, 0.05], [12, 0.063], [18, 0.063], [21, 0.05]] as const) {
        const a = ((a0 + da) * Math.PI) / 180;
        gearPoly.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
    }
    const gearRing = sdf.extrude(profile.polygon(gearPoly), 0.014, 0.002).subtract(sdf.cylinder(0.038, 0.1).rotateX(90));
    const gear = sdf.union(
      gearRing,
      sdf.cylinder(0.017, 0.014, 0.003).rotateX(90),
      sdf.box([0.09, 0.012, 0.012], 0.003),
      sdf.box([0.012, 0.09, 0.012], 0.003),
    );
    k.body('gear', gear.at(0, BODY_C[1], PORT_Z - 0.02), { color: SLOT.glowDeep, roughness: 0.2, emissive: SLOT.glow, emissiveIntensity: 1.6, bone: 'core', detail: 0.004 });
    const DOT = k.tint('glow', 0.6);
    k.body('gear-dot', sdf.sphere(0.011).at(0, BODY_C[1], PORT_Z - 0.008), { color: DOT, roughness: 0.2, emissive: DOT, emissiveIntensity: 2.4, bone: 'core', detail: 0.004 });

    // Neck collar and the cup under the body (iron).
    const neck = sdf.cylinder(0.05, 0.06, 0.008).at(0, 0.62, 0);
    const cup = sdf.ellipsoid([0.1, 0.04, 0.085]).at(0, 0.315, 0);
    k.body('collar', sdf.union(neck.bone('neck'), cup.bone('hips')), { color: C.iron, roughness: 0.5, metalness: 0.6, detail: 0.005 });
    // Brass bolt under the cup, and rings at the wrists.
    const cupBolt = sdf.smoothUnion(0.003, sdf.cylinder(0.018, 0.012, 0.004).at(0, 0.28, 0.03), sdf.sphere(0.012).at(0, 0.274, 0.03));
    k.body('fittings', sdf.union(cupBolt.bone('hips'), sdf.torus(0.018, 0.007).rotateX(0).at(WRIST_L[0], WRIST_L[1] + 0.01, WRIST_L[2]).bone('forearm.L'), sdf.torus(0.018, 0.007).at(WRIST_R[0], WRIST_R[1] + 0.01, WRIST_R[2]).bone('forearm.R')).paintFn(tarnishOnly), {
      color: SLOT.lit,
      roughness: 0.5,
      metalness: 0.75,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ arms: rods with copper coils
    const rod = (a: V3, b: V3, tag: string, r = 0.0135) => sdf.capsule(a, b, r).bone(tag);
    const sL = SHOULDER;
    const sR = mx(SHOULDER);
    const armRods = sdf.union(
      rod(sL, ELBOW_L, 'upperarm.L'),
      rod(ELBOW_L, WRIST_L, 'forearm.L'),
      rod(sR, ELBOW_R, 'upperarm.R'),
      rod(ELBOW_R, WRIST_R, 'forearm.R'),
    );
    k.body('arms', armRods.paintFn(tarnishOnly), { color: SLOT.brass, roughness: 0.55, metalness: 0.7, detail: 0.005 });
    const dirUL = sub(ELBOW_L, sL);
    const dirFL = sub(WRIST_L, ELBOW_L);
    const dirUR = sub(ELBOW_R, sR);
    const dirFR = sub(WRIST_R, ELBOW_R);
    k.body(
      'coils',
      sdf.union(
        coil(lerp(sL, ELBOW_L, 0.4), dirUL, 'upperarm.L'),
        coil(lerp(sR, ELBOW_R, 0.4), dirUR, 'upperarm.R'),
        coil(lerp(ELBOW_L, WRIST_L, 0.22), dirFL, 'forearm.L', 0.024, 0.009, 0.016),
        coil(lerp(ELBOW_R, WRIST_R, 0.22), dirFR, 'forearm.R', 0.024, 0.009, 0.016),
        // Legs: a coil at each hip and at each ankle.
        ...[1, -1].flatMap((sx) => {
          const t = sx === 1 ? 'L' : 'R';
          return [
            coil([HIP[0] * sx, HIP[1] - 0.012, 0], [0, 1, 0], `leg.${t}`, 0.024, 0.009, 0.016),
            coil([ANKLE[0] * sx, ANKLE[1] + 0.005, 0], [0, 1, 0], `foot.${t}`, 0.024, 0.009, 0.016),
          ];
        }),
      ),
      { color: C.copper, roughness: 0.6, metalness: 0.45, detail: 0.005 },
    );

    // Left hand: a claw of three thick, curved copper prongs on a brass palm.
    const palm: V3 = [WRIST_L[0], WRIST_L[1] - 0.02, WRIST_L[2] + 0.005];
    const prong = (dx: number, dz: number) =>
      sdf.chain(
        [
          [palm[0] + dx * 0.5, palm[1] - 0.01, palm[2] + dz * 0.5, 0.013],
          [palm[0] + dx, palm[1] - 0.038, palm[2] + dz + 0.004, 0.0105],
          [palm[0] + dx * 0.55, palm[1] - 0.064, palm[2] + dz + 0.026, 0.0065],
        ],
        0.005,
      );
    const claw = sdf.smoothUnion(0.008, sdf.ellipsoid([0.028, 0.026, 0.024]).at(...palm), prong(-0.024, 0.0), prong(0.0, 0.026), prong(0.024, 0.0)).bone('hand.L');
    k.body('claw', claw, { color: C.copper, roughness: 0.6, metalness: 0.45, detail: 0.004 });

    // Right hand: a crossbow in dark iron with brass fittings. The bow arc stands in a vertical
    // plane, so its curve shows from the front; the bolt lies on the stock.
    const cbAt: V3 = [WRIST_R[0], WRIST_R[1] - 0.005, WRIST_R[2] + 0.03];
    const stock = sdf.box([0.05, 0.056, 0.2], 0.014).at(0, 0, 0.05);
    const bow = sdf.extrude(profile.arc(0.14, 0.024, 228, 312), 0.036, 0.006).at(0, 0.033 + 0.14 * 0.66, 0.16);
    const bolt = sdf.capsule([0, 0.04, -0.02], [0, 0.04, 0.17], 0.008);
    const string = sdf.capsule([-0.104, 0.048, 0.16], [0.104, 0.048, 0.16], 0.0045);
    const cross = sdf.union(stock, bow, bolt, string).at(...cbAt).bone('hand.R');
    k.body('crossbow', cross, { color: C.iron, roughness: 0.5, metalness: 0.6, detail: 0.005 });
    const crossFit = sdf.union(
      sdf.cone([0, 0.04, 0.165], [0, 0.04, 0.225], 0.016, 0.002), // the bolt head
      sdf.cylinder(0.03, 0.02, 0.005).rotateX(90).at(0, 0, 0.16), // the brass collar where the bow meets the stock
      sdf.cylinder(0.03, 0.014, 0.004).rotateX(90).at(0, 0, -0.04), // the butt cap
    )
      .at(...cbAt)
      .bone('hand.R');
    k.body('crossbow-fit', crossFit, { color: SLOT.lit, roughness: 0.5, metalness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ legs and the base plate
    const legRods = hard(
      sdf.union(
        sdf.capsule([HIP[0], HIP[1] - 0.005, 0], KNEE, 0.0135).bone('leg.L'),
        sdf.capsule(KNEE, [ANKLE[0], ANKLE[1] + 0.005, 0], 0.0135).bone('shin.L'),
        sdf.capsule(ANKLE, [ANKLE[0], 0.05, 0], 0.016).bone('foot.L'),
      ),
    );
    k.body('legs', legRods.paintFn(tarnishOnly), { color: SLOT.brass, roughness: 0.55, metalness: 0.7, detail: 0.005 });

    const R_PLATE = 0.22;
    const rim = sdf.cylinder(R_PLATE, 0.05, 0.012).at(0, 0.025, 0);
    const rimRing = sdf.torus(R_PLATE - 0.02, 0.014).at(0, 0.05, 0); // a raised lip along the top edge
    // Machinery on top: four chamfered gear blocks around the leg root on each half, and a hub disc
    // at the root itself.
    const cogs = sdf.union(
      ...[25, 75, 105, 155].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const rr = 0.13;
        return sdf.box([0.05, 0.03, 0.04], 0.006).rotateY(deg).at(Math.sin(a) * rr, 0.062, Math.cos(a) * rr);
      }),
    );
    const cogHub = sdf.cylinder(0.04, 0.03, 0.008).at(HIP[0], 0.062, 0);
    const halfSide = sdf.halfSpace([-1, 0, 0], -0.006); // x >= 0.006
    const plateL = sdf
      .union(rim, rimRing, cogs, cogHub)
      .intersect(halfSide)
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.046), C.plateLit, 0.01)
      .bone('foot.L');
    k.body('base-plate', hard(plateL), { color: C.plate, roughness: 0.55, metalness: 0.5, detail: 0.006 });
    const plateRivets = sdf.union(
      ...Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 0.5) / 12) * Math.PI * 2;
        return sdf.sphere(0.0125).at(Math.sin(a) * (R_PLATE + 0.001), 0.028, Math.cos(a) * (R_PLATE + 0.001));
      }),
    ).intersect(halfSide.round(-0.004));
    k.body('plate-rivets', hard(plateRivets.bone('foot.L')), { color: SLOT.lit, roughness: 0.5, metalness: 0.75, detail: 0.004 });

    // Copper tail pipe behind.
    const tail = sdf.chain(
      [
        [0, 0.37, -0.08, 0.015],
        [0, 0.32, -0.16, 0.013],
        [0, 0.26, -0.22, 0.011],
        [0, 0.21, -0.2, 0.01],
        [0, 0.2, -0.14, 0.008],
      ],
      0.006,
    );
    k.body('tail', tail.bone('hips'), { color: C.copper, roughness: 0.6, metalness: 0.45, detail: 0.005 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys, legTo } = motion;
    const LEGJ = { hip: HIP, knee: KNEE, ankle: ANKLE };
    const Z3: V3 = [0, 0, 0];
    const HIPS_AT: V3 = [0, 0.3, 0];
    const addV = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    /** Both feet planted while the hips move and turn. */
    const planted = (move: V3, rotate: V3) => {
      const hips = { at: HIPS_AT, move, rotate };
      const L = legTo('L', LEGJ, ANKLE, { hips });
      const R = legTo('R', LEGJ, mx(ANKLE), { hips });
      return {
        'leg.L': { rotate: L.leg },
        'shin.L': { rotate: L.shin },
        'foot.L': { rotate: L.foot },
        'leg.R': { rotate: R.leg },
        'shin.R': { rotate: R.shin },
        'foot.R': { rotate: R.foot },
      };
    };

    const IDLE = 2.4;
    const idlePose = (p: number): Record<string, { move?: V3; rotate?: V3 }> => ({
      hips: { move: [0, -0.003 * bump(p), 0] },
      chest: { rotate: [1.5 * wave(p), 2 * wave(p, 1, 0.25), 0] },
      head: { rotate: [2 * wave(p, 1, 0.35), 5 * wave(p, 1, 0.1), 2 * wave(p, 2, 0.2)] },
      key: { rotate: [0, 360 * p, 0] },
      core: { scale: [1 + 0.04 * wave(p, 2), 1 + 0.04 * wave(p, 2), 1] },
      'upperarm.L': { rotate: [0, 4 * wave(p, 1, 0.1), 2 * wave(p, 1, 0.3)] },
      'upperarm.R': { rotate: [0, -3 * wave(p, 1, 0.4), -2 * wave(p, 1, 0.5)] },
      'hand.L': { rotate: [6 * wave(p, 2, 0.3), 0, 0] },
    });
    k.animation('idle', { duration: IDLE, pose: (_t, p) => idlePose(p) });

    // Walk and run: the plate halves are the feet; each takes a short, flat step.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 3,
          sit: 0.008,
          heel: HEEL,
          toe: TOE,
          hips: { at: HIPS_AT, rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -6 * s, 0] as const },
          head: { rotate: [-lean + 2 * wave(p, 2, 0.35), 4 * s, 2 * wave(p, 1, 0.3)] as const },
          key: { rotate: [0, 720 * p, 0] as const },
          'upperarm.L': { rotate: [0, armSwing * s, 2] as const },
          'forearm.L': { rotate: [-armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'upperarm.R': { rotate: [0, armSwing * s * 0.5, -2] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.08, 0.02, 0.62, 0.006, 18, 2));
    k.animation('run', stride(0.56, 0.12, 0.035, 0.44, 0.018, 28, 7));

    // Attack: the crossbow arm swings forward, aims, and fires with a short thrust and a kick back.
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const aim = ease(0, 0.35, p) * (1 - ease(0.62, 0.95, p));
        const fire = keys(p, [[0, 0], [0.4, 0], [0.46, 1], [0.6, 0.3], [1, 0]] as const);
        const lunge = ease(0.36, 0.46, p) * (1 - ease(0.5, 0.85, p));
        const hipsMove: V3 = [0, -0.012 * aim, 0.02 * lunge - 0.012 * aim];
        const hipsRot: V3 = [0, 8 * aim, 0];
        return {
          ...planted(hipsMove, hipsRot),
          hips: { move: hipsMove, rotate: hipsRot },
          spine: { rotate: [-4 * aim + 6 * lunge, 0, 0] },
          chest: { rotate: [-2 * aim, -8 * aim, 0] },
          head: { rotate: [2 * aim, -6 * aim, 0] },
          'upperarm.R': { rotate: [0, 62 * aim - 8 * fire, -6 * aim] },
          'forearm.R': { rotate: [-55 * aim, 0, 0] },
          'hand.R': { rotate: [50 * aim - 10 * fire, 0, 0] },
          'upperarm.L': { rotate: [0, -20 * aim + 12 * lunge, 8 * aim] },
          key: { rotate: [0, 900 * p, 0] },
          core: { scale: [1 + 0.25 * fire, 1 + 0.25 * fire, 1] },
          glow: { scale: [1 + 0.15 * aim, 1 + 0.15 * aim, 1] },
        };
      },
    });

    // Hit: the blow rocks the body back, the arms fly out, the lens flares.
    k.animation('hit', {
      duration: 0.42,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.15, 1], [0.36, 0.7], [1, 0]] as const);
        const hipsMove: V3 = [0, -0.012 * r, -0.02 * r];
        const hipsRot: V3 = [0, 6 * r, 0];
        return {
          ...planted(hipsMove, hipsRot),
          hips: { move: hipsMove, rotate: hipsRot },
          spine: { rotate: [-7 * r, 0, 3 * r] },
          chest: { rotate: [-8 * r, 8 * r, 0] },
          head: { rotate: [-14 * r, -10 * r, 7 * r] },
          glow: { scale: [1 + 0.3 * r, 1 + 0.3 * r, 1] },
          core: { scale: [1 + 0.2 * r, 1 + 0.2 * r, 1] },
          'upperarm.L': { rotate: [0, -14 * r, 24 * r] },
          'upperarm.R': { rotate: [0, 14 * r, -24 * r] },
          'forearm.L': { rotate: [-18 * r, 0, 0] },
        };
      },
    });

    // Death: it powers down. The glow flickers out, the body tilts forward and sinks 0.05, the
    // head droops, and the arms hang.
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const shudder = p > 0.1 && p < 0.4 ? wave((p - 0.1) / 0.3, 5) * Math.sin(((p - 0.1) / 0.3) * Math.PI) : 0;
        const glow = keys(p, [[0, 1], [0.06, 0.4], [0.1, 1], [0.24, 0.8], [0.3, 0.2], [0.36, 0.7], [0.6, 0.3], [0.7, 0.02], [1, 0.02]] as const);
        const drop = keys(p, [[0, 0], [0.35, 0], [0.6, 1], [0.66, 0.92], [0.72, 1], [1, 1]] as const);
        const hipsMove: V3 = [0, -0.05 * drop, -0.02 * drop];
        const hipsRot: V3 = [8 * drop, 0, 3 * shudder];
        return {
          ...planted(hipsMove, hipsRot),
          hips: { move: hipsMove, rotate: hipsRot },
          spine: { rotate: [14 * drop + 2 * shudder, 0, 0] },
          chest: { rotate: [10 * drop, 3 * shudder, 0] },
          head: { rotate: [22 * drop, 10 * drop, 8 * drop] },
          key: { rotate: [0, keys(p, [[0, 0], [0.5, 360], [1, 500]] as const), 0] },
          glow: { scale: [glow, glow, glow] },
          core: { scale: [glow, glow, glow] },
          'upperarm.L': { rotate: [0, 0, -55 * drop] },
          'forearm.L': { rotate: [12 * drop, 0, 0] },
          'upperarm.R': { rotate: [0, 0, 50 * drop] },
          'forearm.R': { rotate: [12 * drop, 0, 0] },
        };
      },
    });

    // Awaken: the wind-up start. It sits powered down (sunk, head low, lights out), a rattle runs
    // through it, the key winds, the lights flare, and it rises into the idle pose.
    const AWAKEN = 2.0;
    const rattle = (p: number, a: number, b: number, cycles: number, offset = 0) => {
      if (p <= a || p >= b) return 0;
      const x = (p - a) / (b - a);
      return wave(x, cycles, offset) * Math.sin(x * Math.PI);
    };
    k.animation('awaken', {
      duration: AWAKEN,
      loop: false,
      pose: (t, p) => {
        const shake = rattle(p, 0.14, 0.4, 5);
        const rise = ease(0.42, 0.7, p);
        const glow = keys(p, [[0, 0.001], [0.3, 0.001], [0.42, 1.3], [0.55, 1]] as const);
        const down = 1 - rise;
        const hipsMove: V3 = [0, -0.05 * down, -0.02 * down];
        const hipsRot: V3 = [8 * down, 0, 2.5 * shake];
        const pose: Record<string, { move?: V3; rotate?: V3; scale?: V3 }> = {
          ...planted(hipsMove, hipsRot),
          hips: { move: hipsMove, rotate: hipsRot },
          spine: { rotate: [14 * down, 0, 0] },
          chest: { rotate: [10 * down, 3 * shake, 0] },
          head: { rotate: [22 * down + 3 * shake, 10 * down, 8 * down + 4 * shake] },
          key: { rotate: [0, keys(p, [[0, 0], [0.16, 0], [0.55, 720], [1, 720]] as const), 0] },
          glow: { scale: [glow, glow, glow] },
          core: { scale: [glow, glow, glow] },
          'upperarm.L': { rotate: [0, 0, -55 * down] },
          'forearm.L': { rotate: [12 * down, 0, 0] },
          'upperarm.R': { rotate: [0, 0, 50 * down] },
          'forearm.R': { rotate: [12 * down, 0, 0] },
        };
        // The idle drift fades in; at the last frame the pose is idle's first frame.
        const drift = idlePose((t - AWAKEN) / IDLE);
        const w = ease(0.7, 1, p);
        for (const [bone, v] of Object.entries(drift)) {
          const b = (pose[bone] ??= {});
          if (v.move) b.move = addV(b.move ?? Z3, v.move, w);
          if (v.rotate) b.rotate = addV(b.rotate ?? Z3, v.rotate, w);
        }
        return pose;
      },
    });
  },
});
