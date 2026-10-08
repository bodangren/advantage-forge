import { sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Riding wolf — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/riding-wolf`), about 1.15 m
 * to the ear tips, faces +Z. Target: docs/wildlife-mockups/riding-wolf_001.jpg (made with mmx from
 * the dire wolf mockup).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * at 1.45 of its size, as a hero's mount: a confident closed smile, big open dark eyes with a white
 * edge, a swept grey tuft on the head, a smooth light grey coat (`furBump: 0`) with a darker back,
 * long legs, a white muzzle and a cream lower face and chest (painted, so no seam shows at the
 * cheeks), a bushy tail that hangs down with a white tip, black paws with white bands, and riding tack fitted to the wolf's back (a
 * brown saddle with a pommel and a cantle, side flaps, a large teal pad with a gold trim and a pale
 * diamond mark, a girth, a wide breast strap with a large metal ring, and stirrups).
 * Role: a mount for the hero in the rider games and travel scenes; the saddle and the teal pad
 *   read at 128 px.
 * Palette (60/30/10): grey #989ca4 with a dark back #70747c; white #f4f2ee; brown leather #6a3c22;
 *   a teal pad #2a8a8a with gold #e0b040 as the accent.
 */


export default scaleAsset(
  wolfAsset({
    name: 'riding-wolf',
    description: 'Chibi riding wolf: a big grey wolf with a confident closed smile, big open dark eyes with a white edge, a swept grey head tuft, a smooth light grey coat, long legs, a long white muzzle, a cream lower face and chest, black paws with white bands, and a brown saddle with stirrups on a large teal pad with a gold trim and a pale diamond mark, a wide chest strap with a large metal ring and blue studs, and side bags; quadruped rig.',
    reference: 'docs/wildlife-mockups/riding-wolf_001.jpg',
    variants: {
      fur: { grey: '#a2a2a0', slate: '#8a8e96', timber: '#7a6a58', black: '#3a3838', white: '#e0e0dc' },
      markings: { white: '#f4f2ee', cream: '#ece2c8' },
      eyes: { brown: '#3a2010', amber: '#7a440c', ice: '#4a6a80' },
      blanket: { teal: '#2a8a8a', blue: '#4a7ac8', red: '#b84a3a', purple: '#7a4aa0' },
    },
    presets: {
      timber: { fur: 'timber', markings: 'cream', eyes: 'amber', blanket: 'blue' },
      black: { fur: 'black', markings: 'white', eyes: 'amber', blanket: 'red' },
      snow: { fur: 'white', markings: 'white', eyes: 'ice', blanket: 'purple' },
    },
    colors: { furLight: '#e8e8e4', furDark: '#989ca4', earInner: '#7e7a7a', eyeRim: '#f4f2ee' },
    earScale: 0.82,
    headScale: 1.25,
    snout: 0.11,
    muzzleWidth: 0.7,
    noseScale: 0.75,
    eyeScale: 1.15,
    pupilScale: 1.25,
    cheekTufts: false,
    cheekCream: false,
    furBump: 0,
    legLength: 0.06,
    claws: false,
    fangs: false,
    tail: false,
    smileArc: [250, 306],
    brows: false,
    forelock: false,
    smile: true,
    ruff: 'smooth',
    paint(fur, t, tone) {
      // A cream lower face and cheeks (painted, so no seam shows), a dark saddle patch on the back,
      // and black paws with a white band above them.
      // Sly eyes (painted over the kind's eyes): a thin dark outline, a white eye, black pupils that
      // both look to the wolf's left, and an upper lid of fur over the top of each eye with a dark
      // lid line. The kind's left eye is at (0.078, 0.53) on the face (before the head grows).
      const ES = 1.15;
      const front = sdf.halfSpace([0, 0, -1], -0.2);
      const disc = (r: number, x: number, y: number) => sdf.cylinder(r, 1).rotateX(90).at(x, y, 0).intersect(front);
      const pairDisc = (r: number, dx = 0, dy = 0) => sdf.union(disc(r, 0.078 + dx, 0.53 + dy), disc(r, -0.078 + dx, 0.53 + dy));
      const lidY = 0.53 + 0.021 * ES;
      const eyes = fur
        .paintWhere(pairDisc(0.037 * ES), '#2a2220', 0.002)
        .paintWhere(pairDisc(0.032 * ES), '#ffffff', 0.002)
        .paintWhere(pairDisc(0.017 * ES, 0.011, -0.002), '#141012', 0.002)
        .paintWhere(pairDisc(0.006 * ES, 0.016, 0.006), '#ffffff', 0.001)
        .paintWhere(pairDisc(0.039 * ES).intersect(sdf.halfSpace([0, -1, 0], -(lidY + 0.004))), t.fur, 0.002)
        .paintWhere(pairDisc(0.037 * ES).intersect(sdf.box([1, 0.007, 1]).at(0, lidY + 0.001, 0)), '#2a2220', 0.0015);
      return eyes
        .paintWhere(sdf.ellipsoid([0.2, 0.085, 0.2]).at(0, 0.385, 0.2), t.markings, 0.03)
        .paintWhere(sdf.ellipsoid([0.1, 0.07, 0.22]).at(0, 0.43, -0.07), tone('fur', '#70747c'), 0.04)
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.085), t.markings, 0.008)
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.055), tone('fur', '#26262a', 0.3), 0.008);
    },
    extra(k, w) {
      // Soft white cheek ruffs: two rounded locks on each side of the face that sweep back.
      const e = w.eye;
      const c0 = w.faceHit(e[0] + 0.03, e[1] - 0.07);
      const ruffs = sdf
        .smoothUnion(
          0.015,
          sdf.cone([c0[0] - 0.01, c0[1], c0[2] - 0.03], [c0[0] + 0.06, c0[1] - 0.005, c0[2] - 0.1], 0.045, 0.014),
          sdf.cone([c0[0] - 0.01, c0[1] - 0.035, c0[2] - 0.035], [c0[0] + 0.05, c0[1] - 0.05, c0[2] - 0.105], 0.04, 0.012),
        )
        .mirror('x', 0.02);
      k.body('cheek-ruffs', ruffs.bone('head'), { color: w.tint.markings, roughness: 0.85, detail: 0.004 });
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
      const blanket = trunk.round(0.009).smoothIntersect(0.008, sdf.box([0.5, 0.25, 0.32], 0.04).at(0, 0.335, SZ));
      const inner = sdf.box([0.6, 0.21, 0.27], 0.03).at(0, 0.355, SZ);
      // A pale diamond with a gold edge on each side of the pad.
      const diamond = (r: number) => sdf.box([1, r, r]).rotateX(45).at(0, 0.315, SZ + 0.075);
      k.body(
        'blanket',
        blanket
          .paintWhere(sdf.box([0.8, 1, 1]).at(0, 0.4, SZ).subtract(inner), '#e0b040', 0.003)
          .paintWhere(diamond(0.07), '#e0b040', 0.002)
          .paintWhere(diamond(0.052), '#c8f0f0', 0.002),
        { color: k.tint('blanket'), roughness: 0.85, detail: 0.004 },
      );
      // The seat with a pommel and a cantle, and side flaps.
      const seat = trunk.round(0.022).smoothIntersect(0.01, sdf.box([0.22, 0.09, 0.2], 0.025).at(0, 0.445, SZ));
      const pommel = sdf.ellipsoid([0.05, 0.04, 0.032]).at(0, 0.47, SZ + 0.1).bone('spine');
      const cantle = sdf.capsule([-0.06, 0.43, SZ - 0.085], [0.06, 0.43, SZ - 0.085], 0.024).bone('hips');
      const flaps = trunk.round(0.016).smoothIntersect(0.006, sdf.box([0.5, 0.11, 0.12], 0.025).at(0, 0.34, SZ + 0.01));
      k.body('saddle', sdf.smoothUnion(0.015, seat, pommel, cantle).union(flaps), { color: leather, roughness: 0.5, detail: 0.004 });
      // The girth under the belly and the breast strap round the front of the chest.
      const shell = trunk.round(0.007).smoothSubtract(0.003, trunk.round(-0.008));
      const girth = shell.intersect(sdf.box([0.5, 0.2, 0.035], 0.008).at(0, 0.2, SZ + 0.03));
      const breast = shell.intersect(sdf.box([0.5, 0.07, 0.4], 0.008).rotateX(15).at(0, 0.3, 0.1)).intersect(sdf.box([0.5, 0.5, 0.2]).at(0, 0.3, 0.15));
      k.body('harness', sdf.union(girth, breast), { color: leather, roughness: 0.55, detail: 0.003 });
      // A metal ring at the front of the breast strap, and blue studs along it.
      const ringAt = sdf.raycast(breast, [0, 0.3, 2], [0, 0, -1]);
      if (ringAt) {
        const ring = sdf.torus(0.034, 0.009).rotateX(90).at(ringAt[0], ringAt[1] - 0.006, ringAt[2] + 0.006);
        k.body('chest-ring', ring, { color: '#c8c4bc', roughness: 0.3, metalness: 0.85, detail: 0.003, bone: 'spine' });
      }
      const studs = [0.055, 0.1, 0.14].flatMap((sx) => {
        const h = sdf.raycast(breast, [sx, 0.3, 2], [0, 0, -1]);
        return h ? [sdf.sphere(0.011).at(h[0], h[1], h[2] - 0.002)] : [];
      });
      if (studs.length) k.body('studs', sdf.union(...studs).mirror('x'), { color: k.tint('blanket'), roughness: 0.35, metalness: 0.4, detail: 0.003, bone: 'spine' });
      // Side bags on the flanks under the pad: a brown pouch with a flap in the pad color and a
      // gold buckle.
      const flank = sdf.raycast(trunk, [1, 0.27, SZ - 0.08], [-1, 0, 0])!;
      const bx = flank[0] + 0.02;
      const bag = sdf.box([0.045, 0.1, 0.12], 0.02).at(bx, 0.26, SZ - 0.08);
      const flap = sdf.box([0.05, 0.045, 0.125], 0.012).at(bx + 0.004, 0.3, SZ - 0.08);
      const buckle = sdf.box([0.01, 0.02, 0.02], 0.003).at(bx + 0.03, 0.28, SZ - 0.08);
      k.body('bags', bag.mirror('x'), { color: leather, roughness: 0.6, detail: 0.004, bone: 'spine' });
      k.body('bag-flaps', flap.mirror('x'), { color: k.tint('blanket'), roughness: 0.7, detail: 0.003, bone: 'spine' });
      k.body('bag-buckles', buckle.mirror('x'), { color: '#e0b040', roughness: 0.3, metalness: 0.85, detail: 0.002, bone: 'spine' });
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
