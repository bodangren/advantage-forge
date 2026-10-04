import { sdf } from '../../src/index.js';

type V3 = readonly [number, number, number];

/**
 * Element features that several monster kinds share: crystals (ice and crystal kinds) and flame
 * tongues (fire and magma kinds). Each returns a shape at its own origin or at given points.
 */

/**
 * A six-sided crystal along +Y from the origin: `r` across the faces, `len` to the tip. The tip
 * faces lean `tipDeg` degrees from the side faces (less is a sharper point).
 */
export function crystal(r: number, len: number, tipDeg = 55): sdf.Shape {
  const tip = (tipDeg * Math.PI) / 180;
  // A finite box first, so the shape has bounds; the half spaces cut the faces and the tip.
  const cuts: sdf.Shape[] = [sdf.box([2.4 * r, len + 0.08, 2.4 * r]).at(0, len / 2 - 0.03, 0)];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    cuts.push(sdf.halfSpace([Math.cos(a), 0, Math.sin(a)], r));
    const n: [number, number, number] = [Math.cos(a) * Math.cos(tip), Math.sin(tip), Math.sin(a) * Math.cos(tip)];
    cuts.push(sdf.halfSpace(n, len * Math.sin(tip)));
  }
  return cuts.slice(1).reduce((s, c) => sdf.intersect(s, c), cuts[0]!);
}

/**
 * A flame tongue: a tapered chain that rises `h` from (x, y, z) in a soft S, leaning `lean`
 * degrees toward +X and `back` meters toward -Z at its tip, with root radius `r`.
 */
export function flameTongue(x: number, y: number, z: number, lean: number, h: number, r: number, back = 0.02): sdf.Shape {
  const a = (lean * Math.PI) / 180;
  const pts = [0, 0.3, 0.6, 0.85, 1].map((t, i): [number, number, number, number] => {
    const wob = 0.025 * Math.sin(t * Math.PI * 1.6) * (i % 2 ? 1 : -1);
    return [x + Math.sin(a) * t * h + wob, y + t * h, z - back * t, r * (1 - 0.82 * t ** 1.2)];
  });
  return sdf.chain(pts, 0.02);
}

/**
 * A curl (a wave crest, a wisp of smoke, a curly sprout): a tapered tube that rises from `base`
 * up the back of a circle of radius `size`, over the top toward the horizontal direction `dir`,
 * and spirals inward for `turns` turns in all, from radius `r` at the base to a third of it.
 */
export function curl(base: V3, dir: V3, size: number, turns: number, r: number, steps = 14): sdf.Shape {
  const l = Math.hypot(dir[0], dir[2]) || 1;
  const d = [dir[0] / l, dir[2] / l];
  const end = turns * Math.PI * 2;
  const pts = Array.from({ length: steps + 1 }, (_, i): [number, number, number, number] => {
    const t = i / steps;
    const a = t * end;
    const rho = size * (1 - 0.7 * t);
    const u = -rho * Math.sin(a);
    const v = size - rho * Math.cos(a);
    return [base[0] + u * d[0]!, base[1] + v, base[2] + u * d[1]!, r * (1 - 0.67 * t)];
  });
  return sdf.chain(pts, 0.01);
}
