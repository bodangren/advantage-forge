import { profile, sdf, type AssetDefinition } from '../src/index.js';
import { birdAsset, type BirdKind } from './parts/bird-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Duck — Chibi Sprouts song videos, weeks 2 and 6 (catalog-style prop; inventory section 5 row
 * "duck": "white with an orange beak in both weeks since Workbooks b32ffed (one render; W2: three
 * walking in a row; W6: one by a pond, one with the cat and frog)").
 *
 * The bird of `assets/parts/bird-kind.ts` at 0.437 of its size, as a plump white duck: a long round
 * white body and head on a short thick neck, black bead eyes with one white catch-light each, a
 * flat broad orange bill (closed), wings folded flat against the sides with pale grey-white
 * tips, a short upturned white tail tuft, and short orange legs with webbed feet. No comb and no
 * wattle (the kind builds neither unless the kind asks).
 * Role: a song-video animal that stands on the grass by a pond; the orange bill and the black eye
 *   dots read at 128 px.
 * Size: 0.300 m tall to the top of the head, 0.327 m long from the bill to the tail (measured by
 *   `forge inspect`); stands on y = 0, faces +Z, centred on the Y axis.
 * Palette (60/30/10): white #f4f1ea body and head; pale grey-white #dcd8cf on the wing tips;
 *   orange #e8892c bill and feet as the accent.
 */
type V3 = readonly [number, number, number];

// The bird kind's left ankle and its forward toes, in the kind's own coordinates: the web joins
// the three forward toes and reaches just past their tips.
const ANKLE: V3 = [0.09, 0.055, 0.0];

// The asset is the bird kind at this share of its own size: 0.300 m tall to the top of the head
// and 0.327 m long from the bill to the tail. `extra` divides final meters by it, because the
// kind's coordinates are scaled after `extra` builds.
const SCALE = 0.437;

/**
 * The duck kind. The bird kind declares `reference` as required, but no duck mockup exists in
 * `docs/wildlife-mockups/`, so the field is left out here and the asset carries no reference
 * image; a made-up path would break `forge render` (it reads the file when the field is set).
 */
const DUCK: Omit<BirdKind, 'reference'> = {
  name: 'duck',
  description:
    'Chibi white duck: a plump white duck with a long round body and a round head on a short thick ' +
    'neck, black bead eyes with a white catch-light, a flat broad orange bill (closed), wings ' +
    'folded flat along the sides with pale grey-white tips, a short upturned white tail tuft, and ' +
    'short orange legs with webbed feet; bird rig with wings.',
  variants: {
    body: { white: '#f4f1ea' },
    head: { white: '#f6f3ed' },
    wings: { white: '#ece8df' },
    eyes: { dark: '#1e1a18' },
  },
  colors: {
    belly: '#faf7f1',
    flight: '#dcd8cf',
    scale: '#e8892c',
    scaleDark: '#d97a24',
    talon: '#e8892c',
    eyeRim: '#1e1a18',
    pupil: '#1e1a18',
  },
  body: [0.22, 0.2, 0.34],
  head: 0.13,
  headForward: 0.04,
  headLift: 0.025,
  neckScale: 1.15,
  cheeks: 0.8,
  headBlend: 0.05,
  oneBody: 0.05,
  clay: true,
  // The kind's pointed beak is dropped in the build wrapper below; `extra` builds the broad bill.
  beak: 'short',
  beakColors: ['#e8892c', '#e8892c'],
  mouth: false,
  brows: false,
  eyeStyle: 'bead',
  eyeScale: 1.0,
  eyeSpread: 1.0,
  eyeLift: 0.02,
  glint: 1.9,
  talons: false,
  walkBob: 1.2,
  stillNeck: true,
  wingStyle: 'paddle',
  wingTips: 'smooth',
  wingRest: -45,
  wingTurn: 68,
  wingOut: 0.03,
  wingScale: 0.62,
  wingThick: 1.1,
  wingSlim: 0.95,
  legLength: 0.5,
  thighs: false,
  tailPose: { lift: 0.45, tilt: 40, scale: 0.7 },
  tailSlot: 'body',
  extra(k, b) {
    const { HEAD_C, HR } = b.joints;
    // The bill: a flat, broad, rounded duck bill in two shallow halves, closed; the upper half
    // reaches past the lower one at the front. The painted smiling seam did not read at 128 px in
    // the textured close-up, so the bill carries no paint line (briefs/duck.md, Known differences).
    const root = b.faceHit(0, HEAD_C[1] - HR * 0.14);
    const upper = sdf.ellipsoid([HR * 0.66, HR * 0.17, HR * 0.55]).at(0, root[1] + HR * 0.015, root[2] + HR * 0.42);
    const tip = sdf.ellipsoid([HR * 0.56, HR * 0.12, HR * 0.2]).at(0, root[1] - HR * 0.01, root[2] + HR * 0.86);
    const lower = sdf.ellipsoid([HR * 0.5, HR * 0.1, HR * 0.44]).at(0, root[1] - HR * 0.115, root[2] + HR * 0.38);
    const bill = sdf.smoothUnion(0.015, upper, tip, lower);
    k.body('bill', bill.bone('head'), { color: '#e8892c', roughness: 0.5, detail: 0.006, textureDensity: 1.5 });

    // The eye catch-light: one small white dot on each eye, upper and toward the front, slightly
    // proud of the surface. The final radius is 0.004 m; the kind's painted glint is too fine to
    // survive the coarse vertex-color mesh at this size, so the dot is a small white sphere.
    const eye = b.eye.at;
    // The visible face point at the eye: the skull alone can sit behind the neck's rounded top.
    const face = sdf.raycast(sdf.union(b.skull, b.trunk), [eye[0], eye[1], 2], [0, 0, -1]) ?? eye;
    const dot = sdf
      .sphere(0.004 / SCALE)
      .at(eye[0], eye[1] + 0.004, face[2] + 0.001)
      .bone('head')
      .mirror('x');
    k.body('eye-glint', dot, { color: '#ffffff', roughness: 0.35, detail: 0.004 });

    // The feet: a thin orange web flat on the ground between the three forward toes.
    const outline = profile.polygon(
      [
        [-0.062, 0.08],
        [0, 0.1],
        [0.062, 0.08],
        [0.034, 0.018],
        [0, 0.006],
        [-0.034, 0.018],
      ],
      { smooth: true },
    );
    const web = sdf
      .extrude(outline, 0.014, 0.002)
      .rotateX(90)
      .at(ANKLE[0], 0.013, ANKLE[2] + 0.01);
    k.body('webs', web.bone('foot.L').mirror('x'), { color: '#e8892c', roughness: 0.5, detail: 0.008 });
  },
};

const scaled = scaleAsset(birdAsset(DUCK as BirdKind), SCALE);
// The kind's pointed chicken beak (upper and lower halves) is dropped: the broad bill of `extra`
// replaces it. A hidden body would be reported as buried by `forge inspect`.
const DROP = new Set(['beak', 'jawBeak']);

const duck: AssetDefinition = {
  ...scaled,
  // The kind's mesh cells suit a full-size bird; at duck size they cost about 13,500 triangles.
  // Coarser cells keep the shape and the painted eyes under the 8,000-triangle prop limit; the
  // bill and the webs set their own cells.
  detail: 0.0038,
  build(k) {
    scaled.build({
      ...k,
      body(name, shape, options) {
        if (DROP.has(name)) return;
        k.body(name, shape, options);
      },
    });
  },
};

export default duck;
