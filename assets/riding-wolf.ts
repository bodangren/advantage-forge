import { sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Riding wolf — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/riding-wolf`), about 1.15 m
 * to the ear tips, faces +Z. Target: docs/wildlife-mockups/riding-wolf_001.jpg (made with mmx from
 * the dire wolf mockup).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * at 1.45 of its size, as a hero's mount: a calm smile, big dark eyes, a grey coat with a darker
 * back, a white muzzle, cheeks, chest, and socks, and riding tack fitted to the wolf's back (a
 * brown saddle with a pommel and a cantle, side flaps, a blue blanket with a gold trim, a girth, a
 * breast strap, and stirrups).
 * Role: a mount for the hero in the rider games and travel scenes; the saddle and the blue
 *   blanket read at 128 px.
 * Palette (60/30/10): grey #8a8e96 with a dark back #4e525a; white #f4f2ee; brown leather #6a3c22;
 *   a blue blanket #4a7ac8 with gold #e0b040 as the accent.
 */


export default scaleAsset(
  wolfAsset({
    name: 'riding-wolf',
    description: 'Chibi riding wolf: a big grey wolf with a calm smile, big dark eyes, a white muzzle, chest, and socks, and a brown saddle with stirrups on a blue blanket with a gold trim; quadruped rig.',
    reference: 'docs/wildlife-mockups/riding-wolf_001.jpg',
    variants: {
      fur: { grey: '#8a8e96', timber: '#7a6a58', black: '#3a3838', white: '#e0e0dc' },
      markings: { white: '#f4f2ee', cream: '#ece2c8' },
      eyes: { brown: '#3a2010', amber: '#7a440c', ice: '#4a6a80' },
      blanket: { blue: '#4a7ac8', red: '#b84a3a', green: '#4a8a5a', purple: '#7a4aa0' },
    },
    presets: {
      timber: { fur: 'timber', markings: 'cream', eyes: 'amber', blanket: 'green' },
      black: { fur: 'black', markings: 'white', eyes: 'amber', blanket: 'red' },
      snow: { fur: 'white', markings: 'white', eyes: 'ice', blanket: 'purple' },
    },
    colors: { furLight: '#e8e8e4', furDark: '#8a8e96', earInner: '#8a6a5a', eyeRim: '#1a100a' },
    eyeScale: 1.3,
    brows: false,
    forelock: false,
    smile: true,
    ruff: 'smooth',
    paint(fur, t, tone) {
      // A dark saddle patch on the back and white socks.
      return fur
        .paintWhere(sdf.ellipsoid([0.1, 0.07, 0.22]).at(0, 0.43, -0.07), tone('fur', '#4e525a'), 0.04)
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.07), t.markings, 0.015);
    },
    extra(k, w) {
      const trunk = w.trunk;
      const SZ = -0.06;
      const leather = '#6a3c22';
      // The blanket over the back with a gold trim along its edge.
      const blanket = trunk.round(0.009).smoothIntersect(0.008, sdf.box([0.5, 0.2, 0.26], 0.04).at(0, 0.36, SZ));
      const inner = sdf.box([0.6, 0.16, 0.21], 0.03).at(0, 0.38, SZ);
      k.body('blanket', blanket.paintWhere(sdf.box([0.8, 1, 1]).at(0, 0.4, SZ).subtract(inner), '#e0b040', 0.003), { color: k.tint('blanket'), roughness: 0.85, detail: 0.004 });
      // The seat with a pommel and a cantle, and side flaps.
      const seat = trunk.round(0.022).smoothIntersect(0.01, sdf.box([0.22, 0.09, 0.2], 0.025).at(0, 0.445, SZ));
      const pommel = sdf.ellipsoid([0.05, 0.04, 0.032]).at(0, 0.47, SZ + 0.1).bone('spine');
      const cantle = sdf.capsule([-0.06, 0.43, SZ - 0.085], [0.06, 0.43, SZ - 0.085], 0.024).bone('hips');
      const flaps = trunk.round(0.016).smoothIntersect(0.006, sdf.box([0.5, 0.11, 0.12], 0.025).at(0, 0.34, SZ + 0.01));
      k.body('saddle', sdf.smoothUnion(0.015, seat, pommel, cantle).union(flaps), { color: leather, roughness: 0.5, detail: 0.004 });
      // The girth under the belly and the breast strap round the front of the chest.
      const shell = trunk.round(0.007).smoothSubtract(0.003, trunk.round(-0.008));
      const girth = shell.intersect(sdf.box([0.5, 0.2, 0.035], 0.008).at(0, 0.2, SZ + 0.03));
      const breast = shell.intersect(sdf.box([0.5, 0.028, 0.4], 0.008).rotateX(15).at(0, 0.3, 0.1)).intersect(sdf.box([0.5, 0.5, 0.2]).at(0, 0.3, 0.15));
      k.body('harness', sdf.union(girth, breast), { color: leather, roughness: 0.55, detail: 0.003 });
      // Stirrups on straps from the seat.
      const side = sdf.raycast(trunk, [1, 0.33, SZ + 0.01], [-1, 0, 0])!;
      const x = side[0] + 0.022;
      const strap = sdf.box([0.01, 0.12, 0.02], 0.003).at(x, 0.31, SZ + 0.01);
      const iron = sdf.torus(0.022, 0.006).rotateZ(90).at(x, 0.235, SZ + 0.01).union(sdf.box([0.012, 0.008, 0.036], 0.003).at(x, 0.21, SZ + 0.01));
      k.body('stirrup-straps', strap.mirror('x'), { color: leather, roughness: 0.55, detail: 0.003, bone: 'spine' });
      k.body('stirrups', iron.mirror('x'), { color: '#b8b4ac', roughness: 0.35, metalness: 0.8, detail: 0.003, bone: 'spine' });
    },
  }),
  1.45,
);
