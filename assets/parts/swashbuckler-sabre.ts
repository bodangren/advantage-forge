import { profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Swashbuckler sabre (part of `assets/swashbuckler.ts`; standalone `assets/swashbuckler-sabre.ts`).
 * A curved steel blade with a gold guard and wrapped grip. Class: hand-held. Local frame: the origin is the grip center, the blade up (+Y), the flat
 * toward +Z; the host's `inHand` pose places it. Body: sabre (bone `knife.R`). Tint slots: none.
 */
const C = { gold: '#e0b040', blade: '#c8ccd0', grip: '#4a3022' };

export function swashbucklerSabre(): Part {
    // The sabre: a curved blade 0.34 long and 0.035 wide at the base, 0.01 thick. The curve bends the
    // tip toward the cutting edge (-X in the local frame, which points outward in the right hand).
    const BL0 = 0.046;
    const BLEN = 0.34;
    const sabreX = (t: number) => -0.042 * t * t; // the centerline
    const sabreHalf = (t: number) => 0.0175 * (1 - 0.55 * t) * (t > 0.92 ? Math.max(0.15, (1 - t) / 0.08) : 1);
    const sabrePts: [number, number][] = [];
    const steps = 10;
    for (let n = 0; n <= steps; n++) {
      const t = n / steps;
      sabrePts.push([sabreX(t) + sabreHalf(t), BL0 + BLEN * t]); // the spine side (+X)
    }
    for (let n = steps; n >= 0; n--) {
      const t = n / steps;
      sabrePts.push([sabreX(t) - sabreHalf(t), BL0 + BLEN * t]); // the edge side (-X)
    }
    const sabreBlade = sdf
      .extrude(profile.polygon(sabrePts, { smooth: false }), 0.01, 0.003)
      .paintFn((x, y, z, base) => {
        const t = Math.min(1, Math.max(0, (y - BL0) / BLEN));
        const h = sabreHalf(t);
        const u = x - sabreX(t);
        if (u < -h + 0.0048) return rgb('#f2f5f7'); // the bright edge line
        if (u > h - 0.0085) return rgb('#6f767e'); // the darker spine
        return base;
      });
    const guardOf = (w: number) => sdf.box([w, 0.011, 0.016], 0.005).at(0, 0.04, 0).paint(C.gold);
    const sabre = sdf.union(
      sabreBlade,
      guardOf(0.07),
      sdf.capsule([0, -0.032, 0], [0, 0.036, 0], 0.014).paintFn((x, y, z, base) => (Math.sin(y * 330) > 0.35 ? rgb('#2a1c14') : base)).paint(C.grip),
      sdf.sphere(0.0185).at(0, -0.05, 0).paint(C.gold),
    );
    // The dagger: 0.17 overall, the blade 0.024 wide, the same guard style.
  return {
    name: 'swashbuckler-sabre',
    bodies: [{ name: 'sabre', shape: sabre, options: { color: C.blade, roughness: 0.3, metalness: 0.9, detail: 0.003 }, bone: 'knife.R' }],
  };
}
