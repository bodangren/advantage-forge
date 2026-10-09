import { profile, sdf } from '../src/index.js';
import { lizardAsset } from './parts/lizard-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Dragon mount — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/dragon-mount`), a young
 * friendly dragon to ride, about 1.1 m tall to the horn tips, faces +Z. Target:
 * docs/wildlife-mockups/dragon-mount_001.jpg (made with mmx).
 *
 * The lizard of `assets/parts/lizard-kind.ts` (trunk, legs, head on a jaw bone, tail on three bones,
 * rig, and clips) at 1.35 of its size, as a dragon mount: a short, compact body on short sturdy
 * legs, an upright neck with the head above the chest, a big round head (a tall dome skull) with a
 * round muzzle, big white eyes with orange irises high on the face, and a wide smile, two big
 * curved yellow horns with two small ones between them and yellow ear fins, bold raised cream
 * plates from the chin down the chest, yellow spikes down the back and the tail, small raised
 * wings with yellow membranes and brown edges, and a big leather saddle with a stitch line, a red
 * seat, and a strap with a brass buckle down each side.
 * Role: a hero's mount for the rider and sky games; the horns, the wings, and the saddle read at
 *   128 px.
 * Palette (60/30/10): green-teal scales #6aaa86; cream plates #f2e2b0; yellow horns, fins, spikes,
 *   and wing membranes #f0c050 with brown wing edges; dark brown leather and a red seat as the accent.
 */
export default scaleAsset(
  lizardAsset({
    name: 'dragon-mount',
    description: 'Chibi dragon mount: a young friendly green-teal dragon with a short compact body on short sturdy legs, an upright neck, a big round head with a round muzzle, big white eyes with orange irises, and a wide smile, two big curved yellow horns and two small ones, yellow ear fins, bold cream plates from the chin down the chest, yellow spikes down the back and the tail, small raised wings with yellow membranes and brown edges, and a leather saddle with a red seat and a buckle strap; lizard rig.',
    reference: 'docs/wildlife-mockups/dragon-mount_001.jpg',
    variants: {
      skin: { green: '#6aaa86', blue: '#5a88c0', red: '#c8604a', purple: '#8a6ab0' },
      belly: { cream: '#f2e2b0', pale: '#f0ece0', gold: '#f0d080' },
      eyes: { brown: '#b0601e', dark: '#3a2a1e', gold: '#c89a1a' },
      blanket: { maroon: '#8a3a2a', red: '#b8443a', blue: '#3a6ab0', green: '#4a8a4a', purple: '#7a4aa0' },
    },
    presets: {
      sky: { skin: 'blue', belly: 'pale', eyes: 'dark', blanket: 'red' },
      ember: { skin: 'red', belly: 'gold', eyes: 'gold', blanket: 'blue' },
      dusk: { skin: 'purple', belly: 'cream', eyes: 'brown', blanket: 'green' },
    },
    drop: 0.04,
    bodyLength: -0.13,
    chestLift: 0.07,
    // The head stays in front of the bodyLength zone (z -0.1 to 0.04), or the warp flattens its back.
    headOffset: [0, 0.31, 0],
    headScale: 1.45,
    snout: 0.13,
    snoutWidth: 0.085,
    snoutHeight: 0.075,
    skullScale: [0.9, 1.22, 1],
    eyes: 'side',
    eyeScale: 1.1,
    eyeAngle: 27,
    eyeSink: 0.62,
    eyeLift: 0.065,
    pupils: true,
    eyeWhites: true,
    jaw: false,
    teeth: 0,
    ridgeShade: '#f0c050',
    ridgeSize: 1.2,
    ridgeGap: [-0.26, 0.08],
    legSpread: 0.75,
    legScale: 1.45,
    bellyChest: 0.6,
    bellyOffLegs: true,
    tail: 0.85,
    paint(skin, liz) {
      // A wide smile across the front of the snout.
      const { HEAD_C } = liz.joints;
      const tip = sdf.raycast(liz.skull, [0, HEAD_C[1] - 0.07, 3], [0, 0, -1])!;
      const smile = sdf.extrude(profile.arc(0.1, 0.011, 228, 312), 0.16).at(0, tip[1] + 0.09, tip[2] - 0.03);
      return skin.paintWhere(smile, '#3a2a22', 0.002);
    },
    extra(k, liz) {
      const { HEAD_C } = liz.joints;
      const yellow = liz.tone('belly', '#f0c050', 0.3);
      const top = (x: number, z: number) => sdf.raycast(liz.skull, [x, 3, z], [0, -1, 0])!;
      // Two big horns that rise from the top of the head, curve out, and sweep back, and two
      // small horns between them.
      const r0 = top(0.075, HEAD_C[2] - 0.02);
      const horn = sdf.chain(
        [
          [r0[0], r0[1] - 0.015, r0[2], 0.042],
          [r0[0] + 0.045, r0[1] + 0.055, r0[2] - 0.02, 0.032],
          [r0[0] + 0.07, r0[1] + 0.095, r0[2] - 0.07, 0.021],
          [r0[0] + 0.075, r0[1] + 0.1, r0[2] - 0.13, 0.008],
        ],
        0.012,
      );
      const r1 = top(0.03, HEAD_C[2] - 0.05);
      const small = sdf.cone([r1[0], r1[1] - 0.01, r1[2]], [r1[0] + 0.008, r1[1] + 0.05, r1[2] - 0.025], 0.018, 0.006);
      // Ear fins: a small yellow fan on each side of the head behind the eyes.
      const side = sdf.raycast(liz.skull, [3, HEAD_C[1] + 0.02, HEAD_C[2] - 0.05], [-1, 0, 0])!;
      const fin = sdf
        .extrude(profile.polygon([[0, -0.025], [0.06, -0.015], [0.085, 0.01], [0.055, 0.02], [0.07, 0.04], [0.02, 0.03]], { smooth: true }), 0.012, 0.004)
        .rotateY(30)
        .at(side[0] - 0.012, side[1], side[2]);
      k.body('horns', sdf.union(horn, small, fin).mirror('x').bone('head'), { color: yellow, roughness: 0.5, detail: 0.003 });
      // Wings on the shoulders, raised and swept back: a dark arm along the top edge, ribs that fan
      // from the wrist to the points of the scalloped edge, and an orange-brown membrane between
      // them (built in XY with the wing along +X, then turned so +X points back and up).
      const back = sdf.raycast(liz.trunk, [0.09, 3, 0.04], [0, -1, 0])!;
      const W = 1.2;
      const wingPose = (s: sdf.Shape) => s.scale(W).rotateY(90).rotateZ(-38).rotateX(-16).at(back[0] + 0.02, back[1] - 0.02, back[2]);
      const WRIST: [number, number] = [0.06, 0.15];
      const POINTS: [number, number][] = [[0.17, 0.2], [0.21, 0.11], [0.19, 0.03], [0.1, -0.01]];
      const WING = profile.polygon([[0, 0], [0.04, 0.12], WRIST, [0.17, 0.2], [0.16, 0.14], [0.21, 0.11], [0.165, 0.07], [0.19, 0.03], [0.13, 0.02], [0.1, -0.01]], { smooth: true });
      const membrane = sdf.extrude(WING, 0.008, 0.003);
      const arm = sdf.union(
        sdf.chain([[0, 0, 0, 0.016], [WRIST[0], WRIST[1], 0, 0.012], [0.17, 0.2, 0, 0.006]], 0.006),
        ...POINTS.slice(1).map(([x, y]) => sdf.cone([WRIST[0], WRIST[1], 0], [x, y, 0], 0.008, 0.004)),
      );
      // Yellow membranes with a brown edge (the outline band of the wing profile), brown arms and ribs.
      const edge = sdf.extrude(WING, 0.1).subtract(sdf.extrude(profile.offsetProfile(WING, -0.009), 0.2));
      k.body('wing-membranes', wingPose(membrane.paintWhere(edge, '#7a4a2a', 0.002)).mirror('x').bone('spine'), { color: liz.tone('belly', '#f0c050', 0.3), roughness: 0.55, detail: 0.003 });
      k.body('wing-arms', wingPose(arm).mirror('x').bone('spine'), { color: '#7a4a2a', roughness: 0.6, detail: 0.003 });
      // Bold cream plates down the front from the chin to the belly: bands of the trunk surface, raised
      // a little, with a groove between each two.
      const plates = liz.trunk
        .round(0.012)
        .intersect(sdf.union(...Array.from({ length: 8 }, (_, i) => sdf.box([0.4, 0.03, 1], 0.008).at(0, 0.3 + i * 0.038, 0.5))))
        .intersect(sdf.box([0.15, 1, 1], 0.02).at(0, 0.5, 0.62));
      k.body('plates', plates, { color: k.tint('belly'), roughness: 0.5, detail: 0.003 });
      // A big leather saddle on the back behind the wings: a pad with a stitch line, a red seat, and a
      // strap down each side with a brass buckle.
      const trunk = liz.trunk;
      const ZC = -0.12;
      const TY = sdf.raycast(trunk, [0, 4, ZC], [0, -1, 0])![1];
      const pad = trunk.round(0.03).smoothIntersect(0.012, sdf.box([2, 0.32, 0.3], 0.05).at(0, TY - 0.03, ZC)).intersect(sdf.halfSpace([0, -1, 0], -(TY - 0.17)));
      const edgeIn = (d: number) => sdf.box([4, 4, 0.3 - d * 2]).at(0, 0, ZC).intersect(sdf.halfSpace([0, -1, 0], -(TY - 0.17 + d)));
      k.body('saddle', pad.paintWhere(edgeIn(0.012).subtract(edgeIn(0.018)), '#d8b07a', 0.002).bone('spine'), { color: '#5a3018', roughness: 0.5, detail: 0.004 });
      const seat = trunk.round(0.05).smoothIntersect(0.015, sdf.box([0.16, 0.2, 0.17], 0.04).at(0, TY, ZC));
      k.body('seat', seat.bone('spine'), { color: k.tint('blanket'), roughness: 0.75, detail: 0.004 });
      const band = sdf.box([2, 3, 0.07], 0.01).at(0, TY - 0.2, ZC + 0.03);
      const strap = sdf.union(pad.round(0.007).intersect(band), trunk.round(0.01).intersect(band).intersect(sdf.halfSpace([0, 1, 0], TY - 0.14)));
      k.body('girth', strap.bone('spine'), { color: '#7a4a2a', roughness: 0.55, detail: 0.003 });
      const flank = sdf.raycast(pad, [4, TY - 0.1, ZC + 0.03], [-1, 0, 0])!;
      const buckle = sdf
        .box([0.012, 0.06, 0.08], 0.005)
        .subtract(sdf.box([0.03, 0.042, 0.058], 0.003))
        .union(sdf.box([0.01, 0.06, 0.008], 0.003))
        .at(flank[0] + 0.012, TY - 0.1, ZC + 0.03)
        .mirror('x', 0);
      k.body('buckle', buckle.bone('spine'), { color: '#c8a040', roughness: 0.3, metalness: 0.85, detail: 0.002 });
    },
  }),
  1.35,
);
