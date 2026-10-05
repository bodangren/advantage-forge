import { sdf } from '../src/index.js';
import { backSaddle } from './parts/horse-tack.js';
import { lizardAsset } from './parts/lizard-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Riding lizard — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/riding-lizard`), a big
 * friendly lizard mount about 0.75 m tall at the head and 1.3 m from snout to tail, faces +Z.
 * Target: docs/wildlife-mockups/riding-lizard_001.jpg (made with mmx).
 *
 * The lizard of `assets/parts/lizard-kind.ts` (trunk, legs, head on a jaw bone, tail on three bones,
 * rig, and clips) at 1.3 of its size, as a riding mount: longer legs that stand under the body, the
 * chest and the head held high, a big round head with a short wide snout, big glossy dark eyes, an
 * open happy smile, a cream throat and chest, light green skin with orange stripes across the back,
 * the tail, and the legs, small orange bumps on the crown, a long tail, and a small riding saddle
 * fitted to the lizard's back (a seat with a low pommel and cantle, side flaps, a red blanket with
 * a gold trim, and a girth with a brass buckle).
 * Role: a mount for the hero in the rider games and swamp or desert travel; the stripes and the
 *   saddle read at 128 px.
 * Palette (60/30/10): sage green skin #86ad74; orange stripes #e8862a; a cream throat and chest
 *   #eef0d0; brown leather #6a3c22 and a red blanket #b8443a as the accent.
 */
export default scaleAsset(
  lizardAsset({
    name: 'riding-lizard',
    description: 'Chibi riding lizard: a big friendly light green lizard on four sturdy legs with its chest held high, a big round head with a short wide snout, big glossy dark eyes, an open happy smile, a cream throat and chest, orange stripes, small orange bumps on the crown, a long tail, and a brown riding saddle on a red blanket; lizard rig.',
    reference: 'docs/wildlife-mockups/riding-lizard_001.jpg',
    variants: {
      skin: { green: '#86ad74', lime: '#8cc06a', teal: '#5aa8a0', sand: '#c8b070', blue: '#6a90c8' },
      belly: { cream: '#eef0d0', pale: '#f4f0e8', yellow: '#f0dc98' },
      eyes: { dark: '#1e1a18', amber: '#8a5a1a' },
      blanket: { red: '#b8443a', blue: '#3a6ab0', green: '#4a8a4a', purple: '#7a4aa0' },
    },
    presets: {
      reef: { skin: 'teal', belly: 'pale', eyes: 'dark', blanket: 'purple' },
      desert: { skin: 'sand', belly: 'yellow', eyes: 'amber', blanket: 'blue' },
      sky: { skin: 'blue', belly: 'pale', eyes: 'dark', blanket: 'red' },
    },
    drop: -0.07,
    chestLift: 0.08,
    headOffset: [0, 0.17, 0.06],
    headScale: 1.3,
    snout: 0.16,
    snoutWidth: 0.08,
    eyes: 'side',
    eyeScale: 1.0,
    eyeAngle: 44,
    eyeSink: 0.55,
    jawOpen: 8,
    teeth: 0,
    ridges: false,
    legSpread: 0.45,
    legScale: 1.3,
    bellyChest: 1.4,
    tail: 1.15,
    paint(skin, liz) {
      // Orange stripes across the back, the flanks, and the tail (above the cream belly), and on
      // the legs.
      const orange = liz.tone('skin', '#e8862a', 0.2);
      // Stripes: short bands over the top of the back and the tail that stop on the upper flanks
      // (rounded ends), and short dashes on the outer side of each leg.
      const bands = sdf.union(
        ...[0.14, 0.02, -0.1, -0.22, -0.36, -0.5, -0.64].map((z, i) => sdf.box([0.8, 0.8, 0.026 - i * 0.001], 0.006).rotateX(-12).at(0, 0.3, z)),
      );
      const backTop = sdf.union(sdf.ellipsoid([0.2, 0.17, 0.45]).at(0, 0.44, -0.04), sdf.ellipsoid([0.09, 0.12, 0.3]).at(0, 0.24, -0.55));
      const dashes = sdf.union(...[0.09, 0.19].map((y) => sdf.box([0.8, 0.018, 0.8], 0.005).at(0, y, 0))).intersect(sdf.union(sdf.box([0.2, 0.4, 0.9]).at(0.25, 0.15, -0.05), sdf.box([0.2, 0.4, 0.9]).at(-0.25, 0.15, -0.05)));
      return skin.paintWhere(bands.intersect(backTop), orange, 0.006).paintWhere(dashes, orange, 0.005);
    },
    extra(k, liz) {
      // Small orange bumps on the crown, in a short row.
      const { HEAD_C } = liz.joints;
      const bumps = [-0.045, 0, 0.045].map((z, i) => {
        const top = sdf.raycast(liz.skull, [0, 2, HEAD_C[2] + z], [0, -1, 0]);
        return top ? sdf.ellipsoid([0.022, 0.016, 0.02]).at(top[0], top[1] + 0.004 - i * 0.002, top[2]) : sdf.sphere(0.001).at(...HEAD_C);
      });
      k.body('crown-bumps', sdf.union(...bumps).bone('head'), { color: liz.tone('skin', '#e8862a', 0.2), roughness: 0.6, detail: 0.003 });
      // The saddle, fitted to the back.
      backSaddle(k, liz, { blanket: k.tint('blanket'), trim: '#e0b040', leather: '#6a3c22', metal: '#c8a040', z: -0.07 });
    },
  }),
  1.3,
);
