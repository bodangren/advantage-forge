import { sdf } from '../src/index.js';

type V3 = readonly [number, number, number];
import { lizardAsset } from './parts/lizard-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Riding lizard — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/riding-lizard`), a big
 * friendly lizard mount about 0.75 m tall at the head and 1.3 m from snout to tail, faces +Z.
 * Target: docs/wildlife-mockups/riding-lizard_001.jpg (made with mmx).
 *
 * The lizard of `assets/parts/lizard-kind.ts` (trunk, legs, head on a jaw bone, tail on three bones,
 * rig, and clips) at 1.3 of its size, as a riding mount: a low body on short bent legs with the
 * feet out to the sides, the chest and the head held up, a big round head with a short wide snout,
 * big glossy dark eyes, a wide open smile with a red tongue, a cream throat and chest with plate
 * lines, light green skin with wide orange bands across the head, the back, the tail, and the legs,
 * small orange bumps on the crown, a long tail, and a clean leather saddle (one thick pad with a
 * stitch line round its edge and a raised back, and one wide strap with a brass buckle down each
 * side).
 * Role: a mount for the hero in the rider games and swamp or desert travel; the stripes and the
 *   saddle read at 128 px.
 * Palette (60/30/10): sage green skin #86ad74; orange bands #e8862a; a cream throat and chest
 *   #eef0d0; a brown leather saddle #8a5232 with a light stitch line and a brass buckle.
 */
export default scaleAsset(
  lizardAsset({
    name: 'riding-lizard',
    description: 'Chibi riding lizard: a big friendly light green lizard low on short bent legs with the feet out to the sides, a big round head with a short wide snout, big glossy dark eyes, a wide open smile with a red tongue, a cream throat and chest with plate lines, wide orange bands, small orange bumps on the crown, a long tail, and a clean leather saddle with a stitched edge and a buckle strap; lizard rig.',
    reference: 'docs/wildlife-mockups/riding-lizard_001.jpg',
    variants: {
      skin: { green: '#86ad74', lime: '#8cc06a', teal: '#5aa8a0', sand: '#c8b070', blue: '#6a90c8' },
      belly: { cream: '#eef0d0', pale: '#f4f0e8', yellow: '#f0dc98' },
      eyes: { dark: '#1e1a18', amber: '#8a5a1a' },
      blanket: { leather: '#8a5232', red: '#b8443a', blue: '#3a6ab0', green: '#4a8a4a', purple: '#7a4aa0' },
    },
    presets: {
      reef: { skin: 'teal', belly: 'pale', eyes: 'dark', blanket: 'purple' },
      desert: { skin: 'sand', belly: 'yellow', eyes: 'amber', blanket: 'blue' },
      sky: { skin: 'blue', belly: 'pale', eyes: 'dark', blanket: 'red' },
    },
    chestLift: 0.05,
    headOffset: [0, 0.14, 0.06],
    headScale: 1.3,
    snout: 0.12,
    snoutWidth: 0.1,
    jawColor: 'skin',
    eyes: 'side',
    eyeScale: 1.0,
    eyeAngle: 44,
    eyeSink: 0.55,
    jawOpen: 18,
    teeth: 0,
    ridges: false,
    legScale: 1.05,
    bellyChest: 1.4,
    bellyOffLegs: true,
    tail: 1.15,
    tailCurl: 0.26,
    paint(skin, liz) {
      // Wide orange bands across the back, the flanks, and the tail (above the cream belly), behind
      // the eyes on the head, and short wide marks on the outer side of each leg.
      const orange = liz.tone('skin', '#e8862a', 0.2);
      const { HEAD_C } = liz.joints;
      const bands = sdf.union(
        ...[0.04, -0.09, -0.23, -0.37, -0.51, -0.64].map((z, i) => sdf.box([0.8, 0.8, 0.046 - i * 0.003], 0.01).rotateX(-12).at(0, 0.3, z)),
      );
      const backTop = sdf.union(sdf.ellipsoid([0.3, 0.25, 0.45]).at(0, 0.45, -0.04), sdf.ellipsoid([0.1, 0.12, 0.3]).at(0, 0.26, -0.55));
      const headBands = sdf
        .box([0.05, 0.3, 0.036], 0.01)
        .rotateX(-20)
        .at(0.07, HEAD_C[1], HEAD_C[2] - 0.075)
        .mirror('x', 0)
        .intersect(sdf.halfSpace([0, -1, 0], -(HEAD_C[1] - 0.02)));
      const dashes = sdf
        .union(...[0.09, 0.2].flatMap((y) => [0.11, -0.15].map((z) => sdf.box([0.2, 0.032, 0.07], 0.01).at(0.26, y, z))))
        .mirror('x');
      // Plate lines across the cream chest and throat.
      const plates = sdf
        .union(...[0.2, 0.25, 0.3, 0.35].map((y) => sdf.box([0.4, 0.007, 0.4]).at(0, y, 0.3)))
        .intersect(sdf.ellipsoid([0.1, 0.2, 0.2]).at(0, 0.28, 0.28));
      // A wide grin: the mouth line turns up at each corner, below the eye.
      const mouthY = HEAD_C[1] - 0.087;
      const corner = sdf.capsule([0.06, mouthY - 0.004, HEAD_C[2] + 0.1], [0.075, mouthY + 0.026, HEAD_C[2] + 0.06], 0.006).mirror('x');
      return skin
        .paintWhere(plates, liz.tone('belly', '#c8c49a'), 0.002)
        .paintWhere(sdf.union(bands.intersect(backTop), headBands), orange, 0.006)
        .paintWhere(dashes, orange, 0.005)
        .paintWhere(corner, '#7a2a2a', 0.003);
    },
    extra(k, liz) {
      // Small orange bumps on the crown, in a short row.
      const { HEAD_C } = liz.joints;
      const bumps = [-0.045, 0, 0.045].map((z, i) => {
        const top = sdf.raycast(liz.skull, [0, 2, HEAD_C[2] + z], [0, -1, 0]);
        return top ? sdf.ellipsoid([0.022, 0.016, 0.02]).at(top[0], top[1] + 0.004 - i * 0.002, top[2]) : sdf.sphere(0.001).at(...HEAD_C);
      });
      k.body('crown-bumps', sdf.union(...bumps).bone('head'), { color: liz.tone('skin', '#e8862a', 0.2), roughness: 0.6, detail: 0.003 });
      // Orange bumps down the back of the neck to the shoulders.
      const neckBumps = [0.13, 0.09, 0.05].flatMap((z) => {
        const top = sdf.raycast(liz.trunk, [0, 2, z], [0, -1, 0]);
        return top ? [sdf.ellipsoid([0.018, 0.013, 0.017]).at(top[0], top[1] + 0.003, top[2])] : [];
      });
      if (neckBumps.length) k.body('neck-bumps', sdf.union(...neckBumps).bone('neck'), { color: liz.tone('skin', '#e8862a', 0.2), roughness: 0.6, detail: 0.003 });
      // A red tongue on the lower jaw fills the open smile (the jaw joint and the jaw from the kind's
      // head measures with headScale 1.3 and snout 0.12; turned open with the jaw).
      const MOUTH_Y = HEAD_C[1] - 0.015 * 1.3 - 0.052 * 1.3;
      const JAW: V3 = [0, MOUTH_Y + 0.01, HEAD_C[2] - 0.02];
      const tongue = sdf
        .ellipsoid([0.075, 0.022, 0.075])
        .at(0, MOUTH_Y + 0.008, HEAD_C[2] + 0.07 * 1.3 + 0.01)
        .at(-JAW[0], -JAW[1], -JAW[2])
        .rotateX(18)
        .at(...JAW);
      k.body('tongue', tongue.bone('jaw'), { color: '#c0505a', roughness: 0.5, detail: 0.003 });
      // A clean leather saddle: one thick pad fitted to the back with a raised rim at the back, a
      // light stitch line round its edge, and one wide strap down each side with a brass buckle.
      const trunk = liz.trunk;
      const ZC = -0.07;
      const TY = sdf.raycast(trunk, [0, 4, ZC], [0, -1, 0])![1];
      const pad = trunk.round(0.03).smoothIntersect(0.012, sdf.box([2, 0.3, 0.26], 0.05).at(0, TY - 0.03, ZC)).intersect(sdf.halfSpace([0, -1, 0], -(TY - 0.15)));
      const cantle = trunk.round(0.045).smoothIntersect(0.012, sdf.box([0.16, 0.2, 0.05], 0.025).at(0, TY, ZC - 0.1));
      // The stitch line: a loop 1.5 cm inside the pad's front, back, and lower edges.
      const edgeIn = (d: number) => sdf.box([4, 4, 0.26 - d * 2]).at(0, 0, ZC).intersect(sdf.halfSpace([0, -1, 0], -(TY - 0.15 + d)));
      const stitch = edgeIn(0.012).subtract(edgeIn(0.018));
      const saddle = sdf.smoothUnion(0.02, pad, cantle).paintWhere(stitch, '#e0c08a', 0.002);
      k.body('saddle', saddle.bone('spine'), { color: k.tint('blanket'), roughness: 0.5, detail: 0.004 });
      // The strap runs over the saddle and down each side, then round the belly as a girth.
      const band = sdf.box([2, 3, 0.07], 0.01).at(0, TY - 0.2, ZC + 0.02);
      const strap = sdf.union(saddle.round(0.007).intersect(band), trunk.round(0.01).intersect(band).intersect(sdf.halfSpace([0, 1, 0], TY - 0.12)));
      k.body('girth', strap.bone('spine'), { color: '#5a3018', roughness: 0.55, detail: 0.003 });
      const side = sdf.raycast(saddle, [4, TY - 0.09, ZC + 0.02], [-1, 0, 0])!;
      const buckle = sdf
        .box([0.012, 0.06, 0.08], 0.005)
        .subtract(sdf.box([0.03, 0.042, 0.058], 0.003))
        .union(sdf.box([0.01, 0.06, 0.008], 0.003).at(0, 0, 0))
        .at(side[0] + 0.012, TY - 0.09, ZC + 0.02)
        .mirror('x', 0);
      k.body('buckle', buckle.bone('spine'), { color: '#c8a040', roughness: 0.3, metalness: 0.85, detail: 0.002 });
    },
  }),
  1.3,
);
