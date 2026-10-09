import { sdf } from '../src/index.js';

type V3 = readonly [number, number, number];
import { griffinAsset } from './parts/griffin-kind.js';
import { backSaddle } from './parts/horse-tack.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Gryphon mount — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/gryphon-mount`), a
 * friendly gryphon to ride, about 1.2 m tall to the crest, faces +Z. Target:
 * docs/wildlife-mockups/gryphon-mount_001.jpg (made with mmx).
 *
 * The griffin of `assets/parts/griffin-kind.ts` (body, legs, eagle feet, tail, wings, rig, and
 * clips) at 1.3 of its size, as a mount: one golden-brown coat on the head, the neck, the body,
 * and the wings; a smaller head on a longer neck with a big round yellow bill (a short round hook
 * and a smile line), big white eyes with dark pupils, bold dark brows that rise outward (a confident
 * look), a soft crest of three round feathers, small yellow ear curls, and rows of raised feather
 * tips all round the neck; small raised wings swept back; short brown toe caps; a braided tail with
 * a tassel of wavy strands; a blue saddle pad with a gold trim and a brown seat (`backSaddle` in
 * `assets/parts/horse-tack.ts`) and a brown breast strap with a blue gem medallion.
 * Role: a hero's mount for the rider and sky games (Gryphon Patrol, Griffin Riders Escape); the
 *   beak, the eyes, the wings, and the blue saddle read at 128 px.
 * Palette (60/30/10): golden-brown coat #d98c3c; yellow beak and shins #efc341 with brown toes;
 *   brown leather #6a3c22; a blue pad #3a78c0 with a gold trim and a blue gem as the accent.
 */
export default scaleAsset(
  griffinAsset({
    name: 'gryphon-mount',
    description: 'Chibi gryphon mount: a friendly golden-brown gryphon with a big round yellow bill with a smile line, big white eyes with dark pupils, bold confident brows, a soft feather crest, small yellow ear curls, a longer neck with sculpted feathers, small raised wings, yellow shins with short brown toe caps, a braided tail with a tassel, a blue saddle pad with a gold trim and a brown seat, and a brown breast strap with a blue gem medallion; quadruped rig with wings.',
    reference: 'docs/wildlife-mockups/gryphon-mount_001.jpg',
    variants: {
      coat: { golden: '#d98c3c', chestnut: '#b86a34', cream: '#e2b87a', grey: '#a8998a' },
      eyes: { brown: '#6a3a1a', amber: '#c8701e', sky: '#4a88c0' },
      blanket: { blue: '#3a78c0', red: '#b8443a', green: '#4a8a4a', purple: '#7a4aa0' },
    },
    presets: {
      chestnut: { coat: 'chestnut', eyes: 'amber', blanket: 'red' },
      snow: { coat: 'cream', eyes: 'sky', blanket: 'purple' },
      storm: { coat: 'grey', eyes: 'brown', blanket: 'green' },
    },
    friendly: true,
    oneCoat: { plumage: 0.04, wings: 0 },
    flightShade: 0.08,
    head: { lift: 0.05, forward: 0.03, scale: 0.8 },
    beakStyle: 'bill',
    beakScale: [1, 1, 1.15],
    browStyle: 'bold',
    closedBeak: true,
    girth: 1.18,
    crest: false,
    tuftStyle: 'fan',
    tailStyle: 'braid',
    clawStyle: 'cap',
    eyeAt: [0.1, 0.735],
    ruff: false,
    tufts: false,
    eyeStyle: 'white',
    talonColor: '#a8643a',
    wings: { scale: 0.62, turn: 50, root: [0.08, 0.46, 0.02] },
    extra(k, g) {
      // Small yellow ear curls at the back of the head: a short arc of a ring, standing up.
      const ear = (x: number) => {
        const top = sdf.raycast(g.skull, [x, 3, 0.12], [0, -1, 0])!;
        return sdf
          .torus(0.03, 0.011)
          .rotateZ(90)
          .rotateY(-20)
          .intersect(sdf.box([0.1, 0.1, 0.1]).at(0, 0.03, 0.012))
          .at(top[0], top[1] - 0.008, top[2]);
      };
      k.body('ear-curls', ear(0.1).mirror('x').bone('head'), { color: '#efc341', roughness: 0.45, detail: 0.003 });
      // Feathers: rows of short, raised feather tips all round the neck, each pointing down the
      // neck, the rows offset by half a feather (the sculpted neck of the mockup); and a soft crest
      // of three round feathers that curl back from the top of the head. (The neck capsule is the
      // kind's neck to the moved head.)
      const NA: V3 = [0, 0.47, 0.1];
      const NB: V3 = [0, 0.654, 0.194];
      const neckShape = sdf.capsule([...NA], [...NB], 0.088);
      const surf = sdf.union(g.skull, neckShape, g.trunk);
      const axis = (t: number): V3 => [0, NA[1] + (NB[1] - NA[1]) * t, NA[2] + (NB[2] - NA[2]) * t];
      const fwd: V3 = [0, -0.455, 0.89];
      const onNeck = (t: number, deg: number): V3 => {
        const a = (deg * Math.PI) / 180;
        const d: V3 = [Math.sin(a), Math.cos(a) * fwd[1], Math.cos(a) * fwd[2]];
        const c = axis(t);
        return sdf.raycast(surf, [c[0] + d[0], c[1] + d[1], c[2] + d[2]], [-d[0], -d[1], -d[2]])!;
      };
      const featherTip = (t: number, deg: number, len: number) => {
        const p = onNeck(t, deg);
        const q = onNeck(t - len, deg);
        const a = (deg * Math.PI) / 180;
        const out: V3 = [Math.sin(a) * 0.004, Math.cos(a) * fwd[1] * 0.004, Math.cos(a) * fwd[2] * 0.004];
        return sdf.cone([p[0] - out[0], p[1] - out[1], p[2] - out[2]], [q[0] + out[0], q[1] + out[1], q[2] + out[2]], 0.03, 0.019);
      };
      const rows = [0.92, 0.77, 0.62, 0.47, 0.32, 0.17].flatMap((t, row) =>
        Array.from({ length: 14 }, (_, i) => featherTip(t, (i + (row % 2) * 0.5) * (360 / 14), 0.18)),
      );
      const crestRoot = (x: number, z: number) => sdf.raycast(g.skull, [x, 3, z], [0, -1, 0])!;
      const crest = [
        [0, 0.15, 0.05, 0.036],
        [0.038, 0.13, 0.04, 0.03],
        [-0.038, 0.13, 0.04, 0.03],
      ].map(([x, z, len, r]) => {
        const p = crestRoot(x!, z!);
        return sdf
          .chain(
            [
              [p[0], p[1] - 0.02, p[2], r!],
              [p[0] * 1.2, p[1] + len! * 0.6, p[2] - len! * 0.6, r! * 0.9],
              [p[0] * 1.4, p[1] + len! * 0.5, p[2] - len! * 1.6, r! * 0.7],
            ],
            0.012,
          )
          .scale([0.8, 1, 1]);
      });
      const mane = sdf.smoothUnion(0.006, sdf.union(...rows).bone('neck'), sdf.smoothUnion(0.012, ...crest).bone('head'));
      k.body('mane', mane, { color: k.tint('coat', -0.04), roughness: 0.85, detail: 0.004 });
      // The saddle on the back, behind the wings, with a brown border and brass rivets.
      backSaddle(k, g, { blanket: k.tint('blanket'), trim: '#6a3c22', leather: '#6a3c22', metal: '#c8a040', z: -0.17, size: 1.3 });
      const TY = sdf.raycast(g.trunk, [0, 4, -0.17], [0, -1, 0])![1];
      const rivets = sdf.union(
        ...[-0.11, -0.055, 0, 0.055, 0.11].flatMap((dz) => {
          const at = sdf.raycast(g.trunk, [1, TY - 0.15, -0.17 + dz], [-1, 0, 0]);
          return at ? [sdf.sphere(0.009).at(at[0] + 0.016, at[1], at[2])] : [];
        }),
      ).mirror('x');
      k.body('rivets', rivets.bone('spine'), { color: '#d8b040', roughness: 0.35, metalness: 0.8, detail: 0.0025 });
      // A breast strap: a band of the body surface that runs from the withers down round the front
      // of the chest, with a gold-rimmed blue gem on the left side.
      const band = sdf.box([0.6, 0.035, 0.6], 0.01).rotateX(-48).at(0, 0.36, 0.08).intersect(sdf.halfSpace([0, 0, -1], 0.02));
      const strap = g.trunk.round(0.01).smoothIntersect(0.005, band);
      k.body('breast-strap', strap.bone('spine'), { color: '#6a3c22', roughness: 0.7, detail: 0.003 });
      const side = sdf.raycast(g.trunk, [3, 0.36, 0.12], [-1, 0, 0])!;
      const medal = sdf.cylinder(0.055, 0.016, 0.005).rotateZ(90).at(side[0] + 0.006, side[1], side[2]);
      k.body('medallion', medal.mirror('x').bone('spine'), { color: '#d8b040', roughness: 0.35, metalness: 0.8, detail: 0.003 });
      const gem = sdf.sphere(0.036).scale([0.5, 1, 1]).at(side[0] + 0.016, side[1], side[2]);
      k.body('gem', gem.mirror('x').bone('spine'), { color: '#3a9ad8', roughness: 0.2, emissive: '#2a7ac0', emissiveIntensity: 0.2, detail: 0.003 });
    },
  }),
  1.3,
);
