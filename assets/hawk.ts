import { noise, sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { bellySpots, domeEyes } from './parts/bird-extras.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Hawk — Chibi Quest wildlife (catalog `wildlife/birds/hawk`), a red-tailed hawk about 0.44 m tall,
 * faces +Z. Target: docs/wildlife-mockups/hawk_001.jpg (made with mmx).
 *
 * The bird of `assets/parts/bird-kind.ts` at 0.5 of its size, as a red-tailed hawk: a brown head,
 * back, and wings, a cream face and chest with a band of brown speckles on the belly, dark eyes in
 * white rims, a hooked yellow beak, a rusty red tail fan, and yellow feet.
 * Role: a forest-edge and field hunter; the rusty tail and the cream chest read at 128 px.
 * Palette (60/30/10): brown #7a5232 back and wings; cream #f2e2c4 face and chest; brown speckles;
 *   a rusty red tail #c0502a, a yellow beak, and yellow feet as the accent.
 */
export default scaleAsset(
  birdAsset({
    name: 'hawk',
    description: 'Chibi hawk: a squat red-tailed hawk with a big brown head with a shaggy cap of short spikes, a cream face, a yellow beak with a small dark open smile, big glossy black eyes, a cream body with brown spots, brown wings, a big rusty red tail fanned up behind, and short yellow legs; bird rig with wings.',
    reference: 'docs/wildlife-mockups/hawk_001.jpg',
    variants: {
      body: { cream: '#f2e2c4', buff: '#e0c89c', pale: '#f6efe2' },
      head: { brown: '#8a5e38', dark: '#5e4030', pale: '#a88a64' },
      wings: { brown: '#6a4428', dark: '#4a3020', pale: '#8a6a48' },
      eyes: { brown: '#4a2a14', dark: '#2a1a12', amber: '#c08020' },
    },
    presets: {
      dark: { body: 'buff', head: 'dark', wings: 'dark', eyes: 'amber' },
      pale: { body: 'pale', head: 'pale', wings: 'pale', eyes: 'dark' },
    },
    colors: { belly: '#f6ead2', flight: '#4a2e1c' },
    body: [0.21, 0.19, 0.2],
    head: 0.2,
    beak: 'short',
    beakScale: 0.8,
    mouth: false,
    beakColors: ['#f0c030', '#f0c030'],
    brows: false,
    eyeStyle: 'white',
    eyesOverPaint: true,
    irisScale: 1.3,
    glint: 1.3,
    eyeScale: 1.25,
    featherBump: 0.004,
    featherOn: { body: false, head: false },
    walkBob: 0.5,
    wingRest: -114,
    wingTurn: 50,
    wingOut: 0.08,
    wingScale: 0.62,
    legLength: 0.3,
    wingStyle: 'paddle',
    neckScale: 1.35,
    cheeks: 1,
    tail: false,
    paint(plumage, b) {
      const { HEAD_C, HR } = b.joints;
      const cream = b.tone('body', '#f6ead2');
      // A big cream face under the brown cap.
      const face = sdf.ellipsoid([HR * 1.12, HR * 0.9, HR]).at(0, HEAD_C[1] - HR * 0.26, HEAD_C[2] + HR * 0.5);
      // A small dark open smile under the beak, with a pink tongue.
      const smileY = HEAD_C[1] - HR * 0.44;
      const front = sdf.halfSpace([0, 0, -1], -HEAD_C[2]);
      const smile = sdf.cylinder(HR * 0.15, 1).rotateX(90).scale([1.2, 1, 1]).at(0, smileY, 0).intersect(sdf.halfSpace([0, 1, 0], smileY)).intersect(front);
      const tongue = sdf.cylinder(HR * 0.07, 1).rotateX(90).at(0, smileY - HR * 0.11, 0).intersect(smile);
      return plumage.paintWhere(face, cream, 0.02).paintWhere(smile, '#2a1612', 0.003).paintWhere(tongue, '#c86a6a', 0.003);
    },
    paintBody(body, b) {
      // A brown bib over the upper chest and the shoulders with a zigzag lower edge.
      const { HEAD_C, HR } = b.joints;
      const top = HEAD_C[1] - HR * 0.55;
      const bottom = HEAD_C[1] - HR * 1.12;
      const band = sdf.box([1, top - bottom, 1]).at(0, (top + bottom) / 2, 0);
      // Points of different lengths and widths, a little off a regular spacing, so the edge looks
      // like feathers that fall onto the chest; the longest hang at the front.
      const teeth = Array.from({ length: 11 }, (_, i) => {
        const a = ((i + 0.5 + (noise.random(i, 3, 1) - 0.5) * 0.5) / 11) * 2 * Math.PI;
        const hit = sdf.raycast(b.trunk, [Math.sin(a) * 2, bottom, HEAD_C[2] + Math.cos(a) * 2], [-Math.sin(a), 0, -Math.cos(a)]);
        const p = hit ?? [0, bottom, 0];
        const len = (0.026 + 0.03 * noise.random(i, 5, 2)) * (1 + 0.5 * Math.max(0, Math.cos(a)));
        return sdf.cone([p[0], bottom + 0.005, p[2]], [p[0] + (noise.random(i, 6, 2) - 0.5) * 0.02, bottom - len, p[2]], 0.026 + 0.012 * noise.random(i, 7, 2), 0.004);
      });
      return body.paintWhere(sdf.union(band, ...teeth), b.tint.head, 0.004);
    },
    extra(k, b) {
      const { BODY_C, B, TAIL_AT } = b.joints;
      const spots = bellySpots(b, 4, 6, 0.013, [BODY_C[1] - B[1] * 0.75, BODY_C[1] + B[1] * 0.12]);
      k.body('spots', spots, { color: b.tone('wings', '#7a4a2a', 0.8), roughness: 0.8, detail: 0.003 });
      // A shaggy cap: short soft spikes over the crown, leaning back.
      const { HEAD_C, HR } = b.joints;
      const spikes: sdf.Shape[] = [];
      for (const [elev, from, to, n] of [[86, 0, 0, 1], [62, -50, 60, 4]] as const) {
        for (let i = 0; i < n; i++) {
          const az = ((n === 1 ? 0 : from + ((to - from) * i) / (n - 1)) + (noise.random(elev, i, 3) - 0.5) * 10) * (Math.PI / 180);
          const e = (elev * Math.PI) / 180;
          // Azimuth 0 points back (-Z); the face side (|az| > 120 at low rows) stays clear.
          const d: [number, number, number] = [Math.sin(az) * Math.cos(e), Math.sin(e), -Math.cos(az) * Math.cos(e)];
          const base: [number, number, number] = [HEAD_C[0] + d[0] * HR * 0.9, HEAD_C[1] + d[1] * HR * 0.9, HEAD_C[2] + d[2] * HR * 0.9];
          const len = HR * (0.26 + 0.1 * noise.random(elev, i, 7));
          const tip: [number, number, number] = [base[0] + d[0] * len * 0.55, base[1] + d[1] * len * 0.55 + len * 0.2, base[2] + d[2] * len * 0.55 - len * 0.6];
          spikes.push(sdf.cone(base, tip, HR * 0.15, HR * 0.04));
        }
      }
      k.body('tuft', sdf.smoothUnion(0.012, ...spikes).bone('head'), { color: b.tint.head, roughness: 0.85, detail: 0.003 });
      // The rusty tail, fanned up behind the body so it shows from the front.
      const fan = sdf.smoothUnion(
        0.01,
        ...[-60, -30, 0, 30, 60].map((a) =>
          sdf
            .ellipsoid([0.045, 0.014, 0.12])
            .at(0, 0, -0.11)
            .rotateY(a * 0.7)
            .rotateX(40)
            .at(...TAIL_AT),
        ),
      );
      k.body('tail-fan', fan.bone('tail'), { color: b.tone('wings', '#c0502a', 0.4), roughness: 0.85 });
    },
  }),
  0.5,
);
