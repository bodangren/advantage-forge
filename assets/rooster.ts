import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { collarFront, combAndWattle } from './parts/bird-extras.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Rooster — Chibi Quest wildlife (catalog `wildlife/land/rooster`), a proud rooster about 0.5 m tall
 * to the comb, faces +Z. Target: docs/wildlife-mockups/rooster_001.jpg (made with mmx).
 *
 * The chicken of `assets/chicken.ts` (the bird of `assets/parts/bird-kind.ts`) at 0.55 of the bird's
 * size, as a rooster: a brown body, golden orange head and neck feathers, a big red comb and wattle,
 * a yellow beak, dark eyes, and in place of the fan a high arching tail of long dark green sickle
 * feathers on the tail bone.
 * Role: a farm and village animal that crows at dawn; the big comb and the arching green tail read
 *   at 128 px.
 * Palette (60/30/10): brown #8a4a2a body and wings; golden orange #e8902a head; a dark green tail
 *   #2a4a34; a red comb and wattle and a yellow beak and feet as the accent.
 */
export default scaleAsset(
  birdAsset({
    name: 'rooster',
    description: 'Chibi rooster: a proud round brown rooster with the head forward, a golden orange head and a cape of pointed hackle feathers, a big red comb and wattle, a yellow beak, white eyes, a tan breast patch, brown wings with feather relief, a broad dark green sickle tail that arches over the back, and short yellow legs; bird rig with wings.',
    reference: 'docs/wildlife-mockups/rooster_001.jpg',
    variants: {
      body: { brown: '#8a4a2a', black: '#2e2a2c', white: '#f2eee6', red: '#9a3a24' },
      head: { golden: '#e8902a', silver: '#d8d4cc', white: '#f6f2ea', amber: '#d8702a' },
      wings: { brown: '#a8683e', black: '#3a3c3e', white: '#ece6dc', red: '#a8482e' },
      eyes: { dark: '#2a1a12', amber: '#c08020' },
    },
    presets: {
      silver: { body: 'black', head: 'silver', wings: 'black', eyes: 'amber' },
      white: { body: 'white', head: 'white', wings: 'white', eyes: 'dark' },
      red: { body: 'red', head: 'amber', wings: 'red', eyes: 'amber' },
    },
    colors: { belly: '#6a3a22', flight: '#7a4426', eyeRim: '#2a1a12' },
    body: [0.23, 0.2, 0.22],
    head: 0.102,
    headLift: 0.08,
    headForward: 0.13,
    beak: 'short',
    beakColors: ['#f0c030', '#f0c030'],
    mouth: false,
    brows: false,
    eyeStyle: 'white',
    eyeScale: 0.85,
    eyeSpread: 1.45,
    headBlend: 0.03,
    featherBump: 0.004,
    featherOn: { body: false, head: false, wings: true },
    walkBob: 0.9,
    stillNeck: true,
    talons: false,
    wingRest: -88,
    wingTurn: 78,
    wingOut: 0.03,
    wingScale: 0.6,
    wingThick: 1.6,
    legLength: 1.15,
    thighs: false,
    wingStyle: 'paddle',
    neckScale: 1.05,
    tail: false,
    extra(k, b) {
      k.body('comb', combAndWattle(b, 1.05, 1), { color: '#e03a2a', roughness: 0.55, detail: 0.004 });
      // The sickle tail: broad thick feathers from the rump that arch up over the back and curl back
      // down behind it to about half the height, each a smooth arc, longer in the middle.
      const t = b.joints.TAIL_AT;
      const sickle = (R: number, x: number, sweep: number, r0: number) => {
        const pts: [number, number, number, number][] = [];
        for (let i = 0; i <= 10; i++) {
          const u = i / 10;
          const phi = Math.PI * sweep * u;
          pts.push([0, R * 1.75 * Math.sin(phi), -R * 1.05 * (1 - Math.cos(phi)), r0 * (1 - 0.7 * u)]);
        }
        return sdf.chain(pts, 0.02).scale([0.5, 1, 1]).at(t[0] + x, t[1] + 0.02, t[2] + 0.05);
      };
      const tail = sdf.smoothUnion(
        0.012,
        sickle(0.2, 0, 0.86, 0.062),
        sickle(0.17, 0.03, 0.84, 0.056).rotateY(6),
        sickle(0.17, -0.03, 0.84, 0.056).rotateY(-6),
        sickle(0.135, 0.055, 0.8, 0.05).rotateY(11),
        sickle(0.135, -0.055, 0.8, 0.05).rotateY(-11),
      ).bone('tail');
      k.body('sickle-tail', tail, { color: b.tone('wings', '#2a4a34', 0.3), roughness: 0.35, metalness: 0.15 });
      // The hackles: one smooth golden cape over the neck and the shoulders, a skin over the body,
      // with a row of pointed tips at its lower edge (V notches cut up into the edge).
      const { HEAD_C, HR, BODY_C, B } = b.joints;
      const cf = collarFront(b);
      const yTop = HEAD_C[1] + HR * 0.3;
      const yMid = cf[1] + 0.005;
      const yBot = cf[1] - 0.1;
      // Only round the neck and over the shoulders: inside a capsule along the neck, from the
      // shoulders up to the head.
      const neckZone = sdf.capsule([0, yBot, BODY_C[2] - 0.03], [HEAD_C[0], HEAD_C[1], HEAD_C[2] - HR * 0.2], HR * 1.65);
      const band = b.trunk
        .round(0.018)
        .intersect(sdf.halfSpace([0, 1, 0], yTop))
        .intersect(sdf.halfSpace([0, -1, 0], -yBot))
        .smoothIntersect(0.012, neckZone);
      const N = 18;
      const notches = Array.from({ length: N }, (_, i) => {
        const a = ((i + 0.5) / N) * 360;
        // Feathers of two lengths: every other notch reaches higher.
        const top = yMid + (i % 2 ? 0.02 : -0.005);
        const tri = profile.polygon([[-0.04, yBot - 0.02], [0.04, yBot - 0.02], [0, top]], { smooth: false });
        return sdf.extrude(tri, 0.5).at(0, 0, 0.25).rotateY(a).at(0, 0, HEAD_C[2] * 0.5);
      });
      const cape = band.smoothSubtract(0.006, sdf.union(...notches)).paintFn((_x, y, _z, base) => {
        const tt = Math.max(0, Math.min(1, (yMid - y) / (yMid - yBot)));
        return mixRgb(base, rgb(b.tone('head', '#d8702a', 0.6)), tt * 0.6);
      });
      k.body('hackles', cape.bone('neck'), { color: b.tint.head, roughness: 0.8, detail: 0.003 });
      // The tan breast: an oval patch with a clear edge on the front of the body.
      const oval = sdf.cylinder(1, 1).rotateX(90).scale([B[0] * 0.6, B[1] * 0.75, 1]).at(0, BODY_C[1] - B[1] * 0.1, 0);
      const breast = b.trunk.round(0.003).intersect(oval).intersect(sdf.halfSpace([0, 0, -1], 0));
      k.body('breast', breast.bone('spine'), { color: b.tone('body', '#d8955a', 0.4), roughness: 0.8, detail: 0.004 });
      void HR;
    },
  }),
  0.55,
);
