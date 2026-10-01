import { noise, profile, rgb, sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Druid staff (part of `assets/druid.ts`; standalone `assets/druid-staff.ts`).
 * A mossy gnarled staff with a side hook and a crook mushroom on top, and the lantern on its hook.
 * Class: hand-held. Local frame: the host's character frame, moved so the grip is at the origin
 * (a translation by STAFF_MOUNT, rounded to 1/1024 m, keeps the mesh identical); the staff leans
 * along STAFF_AXIS. Parts: druidStaff (bodies staff, staff-mushroom; bone `hand.L`) and
 * druidStaffLantern (bodies lantern-frame, lantern-light; skin tag `lantern`; local origin moved
 * by LANTERN_MOUNT). Tint slots: none.
 */
const C = {
  wood: '#6a4424',
  woodDark: '#4a2e18',
  moss: '#6a9a3a',
  stem: '#efe2c8',
  spot: '#f4ead6',
  cap: '#d23a32',
  leatherDark: '#503020',
  lanternGlow: '#ffcc55',
};

type V3 = readonly [number, number, number];
const rad = Math.PI / 180;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

// The druid's frame (assets/druid.ts): the left wrist, the grip in the fist, and the staff axis.
const WRIST_L: V3 = [0.275, 0.35, 0.085];
const HAND_L = { pitch: -80, roll: -21 };
export const STAFF_AXIS = rotZ(rotX([0, 0, 1], HAND_L.pitch), HAND_L.roll);
export const GRIP = add(rotZ(rotX([0.007, -0.04, 0.004], HAND_L.pitch), HAND_L.roll), WRIST_L);
const round1024 = (p: V3): Vec3 => [Math.round(p[0] * 1024) / 1024, Math.round(p[1] * 1024) / 1024, Math.round(p[2] * 1024) / 1024];
/** The staff part origin: the grip rounded to 1/1024 m, so the host round trip adds no float error. */
export const STAFF_MOUNT: Vec3 = round1024(GRIP);
export const L_DOWN = (GRIP[1] - 0.03) / STAFF_AXIS[1];
export const L_UP = (0.8 - GRIP[1]) / STAFF_AXIS[1];
const along = (t: number): V3 => add(GRIP, scale(STAFF_AXIS, t));
const HOOK: V3 = add(along(L_UP * 0.72), [0.07, 0.02, 0.0]);
const LANTERN: V3 = [HOOK[0], HOOK[1] - 0.09, HOOK[2]];
/** The lantern part origin: the lantern center rounded to 1/1024 m. */
export const LANTERN_MOUNT: Vec3 = round1024(LANTERN);

export function druidStaff(): Part {
  const local = (s: sdf.Shape) => s.at(-STAFF_MOUNT[0], -STAFF_MOUNT[1], -STAFF_MOUNT[2]);
    const wobble = (t: number, a: number): V3 => [Math.sin(t * 23) * a, 0, Math.cos(t * 17) * a];
    const polePts = [-L_DOWN, -L_DOWN * 0.55, -L_DOWN * 0.2, 0, L_UP * 0.35, L_UP * 0.7, L_UP].map((t, i) => {
      const p = add(along(t), wobble(t, i === 3 ? 0 : 0.006));
      return [p[0], p[1], p[2], 0.016 - i * 0.0007] as [number, number, number, number];
    });
    const top = along(L_UP);
    // A side branch carries the lantern hook; the crook at the top curls back.
    const branch = sdf.chain(
      [
        [...along(L_UP * 0.62), 0.011] as [number, number, number, number],
        [HOOK[0] - 0.03, HOOK[1] + 0.012, HOOK[2], 0.009],
        [HOOK[0], HOOK[1] + 0.004, HOOK[2], 0.007],
      ],
      0.01,
    );
    const crook = sdf.chain(
      [
        [top[0], top[1], top[2], 0.013],
        [top[0] + 0.03, top[1] + 0.04, top[2], 0.011],
        [top[0] + 0.07, top[1] + 0.035, top[2], 0.009],
      ],
      0.01,
    );
    const mossAt = (t: number) => sdf.sphere(0.02).scale([1.3, 0.8, 1.3]).at(...along(t));
    const staff = sdf
      .smoothUnion(0.012, sdf.chain(polePts, 0.02), branch, crook)
      .union(mossAt(L_UP * 0.5).paint(C.moss), mossAt(-L_DOWN * 0.4).paint(C.moss))
      // Dark grain on the wood only; the moss (a greener base) keeps its color.
      .paintFn((x, y, z, base) => (noise.fbm(x * 90, y * 12, z * 90, 2) > 0.3 && base[1] < 0.2 ? rgb(C.woodDark) : base));
    // A little mushroom sprouting from the crook, which curls outward, away from the cap.
    const crookTip: V3 = [top[0] + 0.07, top[1] + 0.035, top[2]];
    const topShroom = sdf
      .union(
        sdf.cone([0, 0, 0], [0, 0.05, 0], 0.012, 0.01).paint(C.stem),
        sdf
          .revolve(profile.polygon([[0, 0.078], [0.03, 0.07], [0.048, 0.048], [0.044, 0.04], [0, 0.052]], { smooth: true, samples: 4 }))
          .paintWhere(sdf.sphere(0.012).at(0.018, 0.074, 0.01), C.spot),
      )
      .rotateZ(-15)
      .at(...crookTip);
  return {
    name: 'druid-staff',
    bodies: [
      {
        name: 'staff',
        shape: local(staff),
        options: { color: C.wood, roughness: 0.8, bump: (x: number, y: number, z: number) => 0.0012 * noise.fbm(x * 160, y * 25, z * 160, 2) },
        bone: 'hand.L',
      },
      { name: 'staff-mushroom', shape: local(topShroom), options: { color: C.cap, roughness: 0.6, detail: 0.004 }, bone: 'hand.L' },
    ],
  };
}

export function druidStaffLantern(): Part {
  const local = (s: sdf.Shape) => s.at(-LANTERN_MOUNT[0], -LANTERN_MOUNT[1], -LANTERN_MOUNT[2]);
    const lanternFrame = sdf
      .union(
        sdf.cylinder(0.034, 0.014, 0.004).at(0, 0.03, 0), // cap
        sdf.cone([0, 0.036, 0], [0, 0.052, 0], 0.026, 0.01), // roof
        sdf.cylinder(0.036, 0.014, 0.004).at(0, -0.036, 0), // base
        ...[0, 90, 180, 270].map((a) => sdf.capsule([0.03, -0.03, 0], [0.03, 0.026, 0], 0.004).rotateY(a + 45)), // bars
        sdf.torus(0.022, 0.004).rotateX(90).at(0, 0.074, 0), // bail
      )
      .at(...LANTERN);
    const glow = sdf.cylinder(0.027, 0.06, 0.012).at(...LANTERN);
  return {
    name: 'druid-staff-lantern',
    bodies: [
      { name: 'lantern-frame', shape: local(lanternFrame.bone('lantern')), options: { color: C.leatherDark, roughness: 0.4, metalness: 0.6 } },
      {
        name: 'lantern-light',
        shape: local(glow.bone('lantern')),
        options: { color: C.lanternGlow, roughness: 0.3, emissive: C.lanternGlow, emissiveIntensity: 0.8 },
      },
    ],
  };
}
