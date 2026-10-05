import { mixRgb, rgb, sdf } from '../src/index.js';
import { lizardAsset } from './parts/lizard-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Hedgehog — Chibi Quest wildlife (catalog `wildlife/forest/hedgehog`), about 0.27 m tall and 0.4 m
 * long, faces +Z. Target: docs/wildlife-mockups/hedgehog_001.jpg (made with mmx).
 *
 * The low body of the lizard kind (`assets/parts/lizard-kind.ts`: a short round trunk on four short
 * legs, a head with a snout of any length, rig, and clips) at 0.5 of its size, as a hedgehog: a
 * cream body that sits low on tiny legs, a cream head that tapers to a pointed cone with a big round
 * black nose, small dark eyes with a glint at the sides of the face, small round ears with pink
 * insides, and a round coat of brown spines over the back, the sides, and the back of the head, so
 * the body reads as one round mass. The coat is a separate body in a `spines` slot: a dome with
 * rounded spine tips raised from a jittered grid (cell noise), darker in the gaps between them.
 * Role: a small forest and garden animal; the round spine coat and the pointed nose read at 128 px.
 * Palette (60/30/10): brown spines #6e4630 with lighter tips; a cream face, body, and legs #f0d8a8;
 *   pink ear insides and toes; a black nose; dark eyes with a white glint.
 */

/**
 * Spine tips on a surface: `n` points spread evenly over `base` (rays from `center` in a Fibonacci
 * spiral), kept where `keep` is solid. The field is the height (0 to 1) of the nearest cone of
 * foot radius `r`, measured across the surface (not along its normal), so each tip stands to its
 * full height; the tips lean back (toward -Z) by `lean` meters per meter of height.
 */
const spineField = (base: sdf.Shape, keep: sdf.Shape, center: readonly [number, number, number], n: number, r: number, lean: number) => {
  const tips: { p: [number, number, number]; n: [number, number, number] }[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const rr = Math.sqrt(1 - y * y);
    const a = golden * i;
    const dir: [number, number, number] = [Math.cos(a) * rr, y, Math.sin(a) * rr];
    const hit = sdf.raycast(base, [center[0] + dir[0], center[1] + dir[1], center[2] + dir[2]], [-dir[0], -dir[1], -dir[2]]);
    if (hit && keep.dist(hit[0], hit[1], hit[2]) < -0.01) tips.push({ p: [hit[0], hit[1], hit[2]], n: sdf.normalAt(base, hit) as [number, number, number] });
  }
  return (x: number, y: number, z: number) => {
    let best = Infinity;
    for (const { p, n: nn } of tips) {
      const dx = x - p[0];
      const dy = y - p[1];
      const dz0 = z - p[2];
      if (dx * dx + dy * dy + dz0 * dz0 > 9 * r * r) continue;
      const h = Math.max(0, dx * nn[0] + dy * nn[1] + dz0 * nn[2]);
      const dz = dz0 + lean * h; // the axis moves back as it rises
      const along = dx * nn[0] + dy * nn[1] + dz * nn[2];
      const d2 = dx * dx + dy * dy + dz * dz - along * along;
      if (d2 < best) best = d2;
    }
    const t = Math.max(0, 1 - Math.sqrt(best) / r);
    return t * t * (3 - 2 * t);
  };
};

export default scaleAsset(
  lizardAsset({
    name: 'hedgehog',
    description: 'Chibi hedgehog: a small round cream hedgehog that sits low on tiny legs, with a pointed cone of a head, a big round black nose, small glossy dark eyes, small round ears with pink insides, and a round coat of brown spines over the back and the back of the head; four-legged rig.',
    reference: 'docs/wildlife-mockups/hedgehog_001.jpg',
    variants: {
      skin: { cream: '#f0d8a8', pale: '#f6ece0', tan: '#d8b080' },
      belly: { cream: '#f6e4c4', white: '#faf4ea' },
      spines: { brown: '#6e4630', dark: '#4a3a30', sandy: '#a8845a', grey: '#7a7470' },
      eyes: { dark: '#1e1412', brown: '#4a2a18' },
    },
    presets: {
      dark: { skin: 'pale', belly: 'white', spines: 'dark', eyes: 'dark' },
      sandy: { skin: 'tan', belly: 'cream', spines: 'sandy', eyes: 'brown' },
      grey: { skin: 'pale', belly: 'white', spines: 'grey', eyes: 'dark' },
    },
    colors: { claw: '#f0b0a8', nostril: '#1a1416' },
    snout: 0.12,
    snoutWidth: 0.048,
    bulb: false,
    headOffset: [0, -0.05, 0.0],
    headScale: 1.15,
    eyes: 'side',
    eyeScale: 0.52,
    eyeAngle: 38,
    jaw: false,
    teeth: 0,
    ridges: false,
    tail: 0,
    legScale: 0.8,
    drop: 0.075,
    extra(k, liz) {
      const { HEAD_C } = liz.joints;
      // The black nose: a round ball on the tip of the cone, with a glint.
      const tip = sdf.raycast(liz.skull, [0, HEAD_C[1] - 0.012, 2], [0, 0, -1])!;
      const nose = sdf
        .sphere(0.036)
        .at(tip[0], tip[1] + 0.004, tip[2] + 0.008)
        .paintWhere(sdf.sphere(0.009).at(tip[0] - 0.012, tip[1] + 0.024, tip[2] + 0.034), '#8a8282', 0.004);
      k.body('nose', nose.bone('head'), { color: '#1a1416', roughness: 0.2, detail: 0.003 });
      // Small round ears on the top sides of the head, just in front of the spine coat.
      const ear = sdf.surfacePoint(liz.skull, [0.6, 0.72, 0.04], -0.01);
      const earShape = sdf
        .ellipsoid([0.052, 0.056, 0.018])
        .paintWhere(sdf.ellipsoid([0.035, 0.038, 0.022]).at(0, 0.002, 0.011), liz.tone('belly', '#f0a8a0', 0.3), 0.006)
        .rotateY(28)
        .rotateZ(-22)
        .at(ear[0], ear[1] + 0.036, ear[2]);
      k.body('ears', earShape.mirror('x').bone('head'), { color: liz.tint.skin, roughness: 0.6, detail: 0.003 });
      // The spine coat: a dome over the trunk (front on the spine, back on the hips) that grows over
      // the back of the head, cut level above the belly and on a slope behind the face (from behind
      // the ears down to the front legs), with rounded spine tips that lean back. The gaps between
      // the tips are darker, the tips lighter.
      const front = sdf.ellipsoid([0.21, 0.2, 0.15]).at(0, 0.27, 0.0).bone('spine');
      const back = sdf.ellipsoid([0.2, 0.2, 0.17]).at(0, 0.25, -0.1).bone('hips');
      const cap = sdf.ellipsoid([0.13, 0.12, 0.1]).at(0, HEAD_C[1] + 0.04, HEAD_C[2] - 0.07).bone('head');
      const slope = Math.hypot(0.75, 1);
      const keep = sdf.halfSpace([0, -1, 0], -0.15).smoothIntersect(0.03, sdf.halfSpace([0, -0.75 / slope, 1 / slope], (HEAD_C[2] - 0.06 - 0.75 * HEAD_C[1]) / slope));
      const dome = sdf.smoothUnion(0.06, front, back, cap);
      const tips = spineField(dome, keep, [0, 0.27, -0.04], 130, 0.038, 0.5);
      const coat = dome.smoothIntersect(0.02, keep).displace(-0.036, tips, 3).round(0.006);
      const S = k.tint('spines');
      const light = liz.tone('spines', '#9a6a4a', 1);
      const dark = liz.tone('spines', '#4a2c1c', 1);
      const [L, D] = [rgb(light), rgb(dark)];
      const shaded = coat.paintFn((x, y, z, base) => {
        const t = tips(x, y, z);
        return t > 0.4 ? mixRgb(base, L, ((t - 0.4) / 0.6) * 0.6) : mixRgb(base, D, (1 - t / 0.4) * 0.6);
      });
      k.body('spines', shaded, { color: S, roughness: 0.7, detail: 0.004, textureDensity: 1.5 });
    },
  }),
  0.5,
);
