import { profile, sdf } from '../src/index.js';
import { impAsset } from './parts/imp-kind.js';

/**
 * Imp lord — Chibi Quest monster (catalog `monsters/abyssal-and-cosmic/imp-lord`), the king of the
 * imps, about 0.8 m to the horn tips, faces +Z. Target: docs/monster-mockups/imp-lord_001.jpg
 * (made with mmx from the imp mockup).
 *
 * The imp of `assets/parts/imp-kind.ts` (head, face, body, bat wings, rig, and clips) as a smug
 * little ruler: a gold circlet with five points between the horns, a royal purple mantle with
 * gold trim, and gold armlets.
 * Role: an imp boss or captain; the crown and the purple mantle must read at 128 px.
 * Palette (60/30/10): red skin #d03c34; purple mantle #5a2a7a; gold #e8b830 crown, trim, and
 *   armlets (metal); dark horns; deep red wings; amber eyes.
 * Changes from the imp: no hair crest (the crown sits there), smaller wings (1.0), plain horns.
 * Bodies added: crown (rigid on the head), mantle (rigid on the chest), armlets (skinned to the upper arms).
 * The mockup's high collar is left out (it would sit inside the big head), and so is its
 *   trident: the claw attack lifts both hands beside the head, so a held trident would pass
 *   through it.
 */

const GOLD = '#e8b830';

export default impAsset({
  name: 'imp-lord',
  description: 'Chibi imp lord monster: a smug little red devil king with dark horns, a gold circlet crown, a royal purple mantle with gold trim, gold armlets, bat wings, amber eyes, and a fanged grin.',
  reference: 'docs/monster-mockups/imp-lord_001.jpg',
  variants: {
    skin: { red: '#d03c34', crimson: '#a82838', ember: '#d8603a' },
    wings: { wine: '#a83040', violet: '#7a3a8a', ember: '#e0704a' },
    eyes: { amber: '#e8a030', gold: '#f0d030', violet: '#c08aff' },
    horns: { dark: '#3a2420', black: '#1e1618', bone: '#8a8074' },
  },
  presets: {
    crimson: { skin: 'crimson', wings: 'violet', eyes: 'gold', horns: 'black' },
    ember: { skin: 'ember', wings: 'ember', eyes: 'violet', horns: 'bone' },
  },
  crest: false,
  wingScale: 1.0,
  hornRings: false,
  extra(k, imp) {
    const { HEAD_C, ELBOW } = imp.joints;
    // The crown: a gold band around the top of the head with five points on the front half.
    const band = imp.head.round(0.012).intersect(sdf.box([0.5, 0.034, 0.5]).at(0, 0.618, HEAD_C[2]));
    const points = sdf.union(
      ...[-50, -25, 0, 25, 50].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const z = imp.faceZ(Math.abs(Math.sin(a) * 0.1), 0.62);
        const x = Math.sin(a) * 0.1;
        return sdf.cone([x, 0.62, z * Math.cos(a) - 0.006], [x * 1.08, deg === 0 ? 0.7 : 0.675, z * Math.cos(a) - 0.01], 0.018, 0.003);
      }),
    );
    const gem = sdf.ellipsoid([0.012, 0.014, 0.008]).at(0, 0.62, imp.faceZ(0, 0.62) + 0.008);
    k.body('crown', sdf.union(band, points, gem.paint('#c0283a')), { color: GOLD, roughness: 0.3, metalness: 0.8, bone: 'head', detail: 0.003 });
    // The mantle: a short bell over the shoulders and the back, open at the front, with a gold
    // trim along its hem and around the neck.
    const bell = sdf.revolve(
      profile.polygon(
        [
          [0, 0.44],
          [0.07, 0.43],
          [0.12, 0.38],
          [0.15, 0.31],
          [0.16, 0.25],
          [0, 0.25],
        ],
        { smooth: true },
      ),
    );
    const shell = bell.round(0.006).subtract(bell.round(-0.004));
    const front = sdf.halfSpace([0, 0, -1], -0.07).intersect(sdf.box([1, 1, 1]).at(0, 0.3, 0));
    const mantle = shell
      .subtract(front)
      .at(0, 0, -0.01)
      .paintWhere(sdf.box([1, 0.022, 1]).at(0, 0.258, 0), GOLD, 0.002)
      .paintWhere(sdf.box([1, 0.03, 1]).at(0, 0.44, 0), GOLD, 0.002);
    k.body('mantle', mantle, { color: '#5a2a7a', roughness: 0.65, bone: 'chest', detail: 0.004 });
    // Gold armlets on the upper arms, skinned to them. (Bands on the forearms count as held
    // items, and the claw attack brings the forearms against the cheeks.)
    const { SHOULDER } = imp.joints;
    const at = (t: number): [number, number, number] => [SHOULDER[0] + (ELBOW[0] - SHOULDER[0]) * t, SHOULDER[1] + (ELBOW[1] - SHOULDER[1]) * t, SHOULDER[2] + (ELBOW[2] - SHOULDER[2]) * t];
    const dir = [ELBOW[0] - SHOULDER[0], ELBOW[1] - SHOULDER[1], ELBOW[2] - SHOULDER[2]];
    const tilt = (Math.acos(dir[1]! / Math.hypot(dir[0]!, dir[1]!, dir[2]!)) * 180) / Math.PI;
    const yaw = (Math.atan2(dir[0]!, dir[2]!) * 180) / Math.PI;
    const ring = sdf.torus(0.037, 0.008).rotateX(tilt).rotateY(yaw).at(...at(0.62)).bone('upperarm.L');
    k.body('armlets', ring.mirror('x'), { color: GOLD, roughness: 0.3, metalness: 0.8, detail: 0.003 });
  },
});
