import { defineAsset, profile, sdf } from '../src/index.js';

/*
 * Design note - key-skeleton (Chibi Quest quest key).
 * Role: pickup icon lying along X on y = 0, read at 128 px. About 0.24 m long, 0.075 m tall.
 * One idea: a bone key whose skull bow stands up and looks at the camera (+Z).
 * Shape language: round skull and knobs, square teeth, soft bevels.
 * Palette: bone #efe6cf, crease shade #cfc3a5, eye pits and tooth gaps #1a1410.
 * Materials: key (bone, roughness 0.6, metalness 0) and pits (dark, eyes, nose, tooth gaps).
 * Detail: big round eye sockets, heart nose, cheekbones, 4 teeth, 4 vertebra knobs on the
 *   shaft, bit as a bone bar with two knobs and one C tooth.
 * Rig/animation: none.
 */
const AY = 0.017;
const SX = -0.08;
const SY = 0.044;

export default defineAsset({
  name: 'key-skeleton',
  description: 'Bone skeleton key: front-facing skull bow with deep eye sockets and teeth, vertebra shaft, bone bit.',
  detail: 0.004,
  reference: 'docs/item-mockups/key-skeleton-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const EX = 0.0145;
    const EY = SY + 0.006;
    const skull = sdf.ellipsoid([0.035, 0.031, 0.031]).at(SX, SY, 0);
    const cheek = (sx: number): sdf.Shape => sdf.sphere(0.011).at(SX + sx * 0.02, SY - 0.011, 0.02);
    const jaw = sdf.box([0.042, 0.016, 0.036], 0.005).at(SX, 0.0205, 0.004);
    const pit = (sx: number): sdf.Shape => sdf.sphere(0.0125).at(SX + sx * EX, EY, 0.029);
    const nose = sdf
      .extrude(profile.polygon([[-0.0045, 0.004], [0.0045, 0.004], [0, -0.0045]]), 0.03)
      .at(SX, SY - 0.007, 0.018);
    const head = skull
      .smoothUnion(0.006, cheek(-1), cheek(1))
      .smoothUnion(0.005, jaw)
      .smoothSubtract(0.002, pit(-1), pit(1), nose);
    const tooth = (i: number): sdf.Shape => sdf.box([0.0075, 0.012, 0.007], 0.0015).at(SX + (i - 1.5) * 0.0105, 0.0195, 0.0225);
    const teeth = sdf.union(tooth(0), tooth(1), tooth(2), tooth(3));
    const shaft = sdf.capsule([-0.052, AY, 0], [0.062, AY, 0], 0.0105);
    const knob = (x: number): sdf.Shape => sdf.ellipsoid([0.0075, 0.0175, 0.0175]).at(x, AY, 0);
    const knobs = sdf.union(knob(-0.036), knob(-0.016), knob(0.004), knob(0.024));
    const bar = sdf.capsule([0.05, 0.015, 0.0], [0.098, 0.015, 0.0], 0.0085);
    const end = (z: number): sdf.Shape => sdf.sphere(0.0105).at(0.1, 0.015, z);
    const cTooth = sdf
      .torus(0.0115, 0.0065)
      .at(0.078, 0.015, 0.0115)
      .subtract(sdf.box([0.03, 0.03, 0.012]).at(0.078, 0.015, 0.0115 - 0.0065 - 0.001));
    const key = sdf
      .union(head, teeth, shaft, knobs, bar, end(-0.009), end(0.009), cTooth)
      .round(0.001)
      .paintWhere(sdf.box([0.4, 0.008, 0.4]).at(0, 0.0, 0), '#cfc3a5', 0.006)
      .paintWhere(sdf.box([0.4, 0.03, 0.4]).at(0, SY - 0.012, 0).subtract(sdf.sphere(0.06).at(SX, SY, 0)), '#cfc3a5', 0.01)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const pupil = (sx: number): sdf.Shape => sdf.sphere(0.0105).at(SX + sx * EX, EY, 0.0235);
    const noseDark = sdf.extrude(profile.polygon([[-0.0035, 0.003], [0.0035, 0.003], [0, -0.0035]]), 0.004).at(SX, SY - 0.007, 0.0275);
    const gaps = sdf.box([0.038, 0.010, 0.012], 0.002).at(SX, 0.0195, 0.0165);
    k.body('pits', sdf.union(pupil(-1), pupil(1), noseDark, gaps), { color: '#1a1410', roughness: 0.6, metalness: 0, detail: 0.003 });
    k.body('key', key, {
      color: '#efe6cf',
      roughness: 0.6,
      metalness: 0,
      detail: 0.004,
      textureDensity: 2,
      maxTriangles: 4000,
    });
  },
});
