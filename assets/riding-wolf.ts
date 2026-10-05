import { sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Riding wolf — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/riding-wolf`), about 1.15 m
 * to the ear tips, faces +Z. Target: docs/wildlife-mockups/riding-wolf_001.jpg (made with mmx from
 * the dire wolf mockup).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * at 1.45 of its size, as a hero's mount: a confident closed smirk under dark brows, dark eyes, a
 * swept grey tuft on the head, soft round cheek fur, a grey coat with a darker back, a white muzzle,
 * cheeks, and chest, a bushy tail that hangs down with a white tip, black paws with white bands, and riding tack fitted to the wolf's back (a
 * brown saddle with a pommel and a cantle, side flaps, a teal pad with a gold trim and a gold sun
 * emblem, a girth, a breast strap, and stirrups).
 * Role: a mount for the hero in the rider games and travel scenes; the saddle and the teal pad
 *   read at 128 px.
 * Palette (60/30/10): grey #8a8e96 with a dark back #4e525a; white #f4f2ee; brown leather #6a3c22;
 *   a teal pad #2a8a8a with gold #e0b040 as the accent.
 */


export default scaleAsset(
  wolfAsset({
    name: 'riding-wolf',
    description: 'Chibi riding wolf: a big grey wolf with a confident closed smirk under dark brows, dark eyes, a swept grey head tuft, soft cheek fur, a white muzzle and chest, black paws with white bands, and a brown saddle with stirrups on a teal pad with a gold trim and a gold sun emblem; quadruped rig.',
    reference: 'docs/wildlife-mockups/riding-wolf_001.jpg',
    variants: {
      fur: { grey: '#8a8e96', timber: '#7a6a58', black: '#3a3838', white: '#e0e0dc' },
      markings: { white: '#f4f2ee', cream: '#ece2c8' },
      eyes: { brown: '#3a2010', amber: '#7a440c', ice: '#4a6a80' },
      blanket: { teal: '#2a8a8a', blue: '#4a7ac8', red: '#b84a3a', purple: '#7a4aa0' },
    },
    presets: {
      timber: { fur: 'timber', markings: 'cream', eyes: 'amber', blanket: 'blue' },
      black: { fur: 'black', markings: 'white', eyes: 'amber', blanket: 'red' },
      snow: { fur: 'white', markings: 'white', eyes: 'ice', blanket: 'purple' },
    },
    colors: { furLight: '#e8e8e4', furDark: '#8a8e96', earInner: '#8a6a5a', eyeRim: '#1a100a' },
    eyeScale: 1.15,
    pupilScale: 1.25,
    cheekTufts: false,
    claws: false,
    fangs: false,
    tail: false,
    smileArc: [258, 302],
    brows: false,
    forelock: false,
    smile: true,
    ruff: 'smooth',
    paint(fur, t, tone) {
      // A dark saddle patch on the back, and black paws with a white band above them.
      return fur
        .paintWhere(sdf.ellipsoid([0.1, 0.07, 0.22]).at(0, 0.43, -0.07), tone('fur', '#4e525a'), 0.04)
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.085), t.markings, 0.008)
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.055), tone('fur', '#26262a', 0.3), 0.008);
    },
    extra(k, w) {
      const trunk = w.trunk;
      // A swept grey tuft on the crown: four soft round locks that lean back and to one side.
      const tuft = sdf.smoothUnion(
        0.012,
        ...[
          [0, 0.66, 0.2, -0.05, 0.1, 0.035],
          [0.04, 0.665, 0.17, -0.02, 0.085, 0.03],
          [-0.04, 0.66, 0.17, -0.08, 0.08, 0.03],
          [0.015, 0.655, 0.24, -0.03, 0.07, 0.028],
        ].map(([x, y, z, dx, len, r]) => sdf.cone([x!, y! - 0.02, z!], [x! + dx!, y! + len! * 0.8, z! - len!], r!, r! * 0.45)),
      );
      k.body('head-tuft', tuft.bone('head'), { color: w.tone('fur', '#a6aab0', 0.9), roughness: 0.85, detail: 0.004 });
      // Soft cheek fur below the eyes: a flare out to each side, in the light color.
      const cheeks = sdf.chain([[0.13, 0.42, 0.21, 0.06], [0.2, 0.4, 0.16, 0.042], [0.26, 0.37, 0.11, 0.014]], 0.025).scale([1, 0.85, 1]).mirror('x');
      k.body('cheek-fur', cheeks.bone('head'), { color: w.tint.markings, roughness: 0.9 });
      // Thin dark brows over the eyes, almost level (a calm, confident look).
      const e = w.eye;
      const brow = sdf.capsule([e[0] - 0.035, e[1] + 0.06, e[2] - 0.004], [e[0] + 0.035, e[1] + 0.066, e[2] - 0.02], 0.007).mirror('x');
      k.body('brows', brow.bone('head'), { color: '#2a2a30', roughness: 0.7, detail: 0.003 });
      // The bushy tail hangs down behind, with a white tip.
      const TIP: [number, number, number] = [0, 0.13, -0.5];
      const tail = sdf
        .chain([[0, 0.31, -0.28, 0.045], [0, 0.29, -0.38, 0.08], [0, 0.22, -0.46, 0.088], [TIP[0], TIP[1], TIP[2], 0.03]], 0.03)
        .scale([0.9, 1, 1])
        .paintWhere(sdf.sphere(0.075).at(...TIP), w.tint.markings, 0.025)
        .bone('tail');
      k.body('tail-fur', tail, { color: w.tint.fur, roughness: 0.85 });
      const SZ = -0.06;
      const leather = '#6a3c22';
      // The blanket over the back with a gold trim along its edge.
      const blanket = trunk.round(0.009).smoothIntersect(0.008, sdf.box([0.5, 0.2, 0.26], 0.04).at(0, 0.36, SZ));
      const inner = sdf.box([0.6, 0.16, 0.21], 0.03).at(0, 0.38, SZ);
      // A gold sun emblem on each side of the pad.
      const sun = sdf
        .union(
          sdf.cylinder(0.026, 1).rotateZ(90),
          ...Array.from({ length: 8 }, (_, i) => sdf.box([1, 0.01, 0.05]).at(0, 0, 0.025).rotateX(i * 45)),
        )
        .intersect(sdf.sphere(0.05))
        .at(0, 0.33, SZ - 0.04);
      k.body('blanket', blanket.paintWhere(sdf.box([0.8, 1, 1]).at(0, 0.4, SZ).subtract(inner), '#e0b040', 0.003).paintWhere(sun, '#e0b040', 0.002), { color: k.tint('blanket'), roughness: 0.85, detail: 0.004 });
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
