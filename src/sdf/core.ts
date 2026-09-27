import { isMaskValue, maskMode, mixRgb, rgb, type ColorInput, type Rgb } from './color.js';

export type Vec3 = readonly [number, number, number];

export interface Aabb {
  readonly min: Vec3;
  readonly max: Vec3;
}

/** Signed distance at a point. Negative inside, positive outside, in meters. */
export type DistFn = (x: number, y: number, z: number) => number;
/** Surface color at a point. `fallback` is the color of the unpainted material underneath. */
export type ColorFn = (x: number, y: number, z: number, fallback: Rgb) => Rgb;

/** A part of the shape that belongs to a skeleton bone (for automatic skin weights). */
export interface BoneTag {
  readonly bone: string;
  readonly dist: DistFn;
}

const mapTags = (tags: readonly BoneTag[], f: (d: DistFn) => DistFn): readonly BoneTag[] =>
  tags.length === 0 ? tags : tags.map((t) => ({ bone: t.bone, dist: f(t.dist) }));

/** Name of the bone on the other side: arm.L <-> arm.R, hand_l <-> hand_r, LeftFoot <-> RightFoot. */
export function mirrorBoneName(name: string): string {
  const swaps: [RegExp, string][] = [
    [/([._-])L$/, '$1R'],
    [/([._-])R$/, '$1L'],
    [/([._-])l$/, '$1r'],
    [/([._-])r$/, '$1l'],
    [/Left/, 'Right'],
    [/Right/, 'Left'],
  ];
  for (const [re, to] of swaps) if (re.test(name)) return name.replace(re, to);
  return name;
}

const INFINITE = 1e4;
const passColor: ColorFn = (_x, _y, _z, fallback) => fallback;
const DEG = Math.PI / 180;

/**
 * An immutable signed distance field with an optional paint layer and a conservative bounding box.
 *
 * Methods never mutate: every call returns a new shape. Transforms apply in world space, so
 * `shape.rotate(0, 0, 30).at(0.2, 0.5, 0)` rotates about the origin first and then moves.
 */
export class Sdf {
  constructor(
    readonly dist: DistFn,
    readonly bounds: Aabb,
    readonly color: ColorFn = passColor,
    /** Bone ownership of parts of this shape; follows every transform and boolean. */
    readonly tags: readonly BoneTag[] = [],
  ) {}

  /**
   * Mark this whole shape as belonging to a skeleton bone. Skin weights come from the distance to
   * each bone's tagged shapes, so tag the parts you build a character from (upper arm, forearm,
   * hand, head, ...). Inner tags are replaced.
   */
  bone(name: string): Sdf {
    return new Sdf(this.dist, this.bounds, this.color, [{ bone: name, dist: this.dist }]);
  }

  // ---------------------------------------------------------------- transforms

  /** Translate by (x, y, z). */
  at(x: number, y: number, z: number): Sdf {
    const d = this.dist;
    const c = this.color;
    return new Sdf(
      (px, py, pz) => d(px - x, py - y, pz - z),
      {
        min: [this.bounds.min[0] + x, this.bounds.min[1] + y, this.bounds.min[2] + z],
        max: [this.bounds.max[0] + x, this.bounds.max[1] + y, this.bounds.max[2] + z],
      },
      (px, py, pz, f) => c(px - x, py - y, pz - z, f),
      mapTags(this.tags, (td) => (px, py, pz) => td(px - x, py - y, pz - z)),
    );
  }

  /** Rotate about the origin by Euler angles in degrees, applied in X, then Y, then Z order. */
  rotate(xDeg: number, yDeg = 0, zDeg = 0): Sdf {
    const m = eulerMatrix(xDeg * DEG, yDeg * DEG, zDeg * DEG);
    return this.transformLinear(m, 1);
  }

  rotateX(deg: number): Sdf {
    return this.rotate(deg, 0, 0);
  }
  rotateY(deg: number): Sdf {
    return this.rotate(0, deg, 0);
  }
  rotateZ(deg: number): Sdf {
    return this.rotate(0, 0, deg);
  }

  /**
   * Scale about the origin. Non-uniform scale makes the field a distance *bound*, not an exact
   * distance; the mesher tolerates that, but prefer real dimensions on primitives when possible.
   */
  scale(s: number | Vec3): Sdf {
    const [sx, sy, sz] = typeof s === 'number' ? [s, s, s] : s;
    if (sx <= 0 || sy <= 0 || sz <= 0) throw new Error('scale() factors must be positive.');
    const m: Mat3 = [sx, 0, 0, 0, sy, 0, 0, 0, sz];
    return this.transformLinear(m, Math.min(sx, sy, sz));
  }

  /** Apply a 4x4 affine matrix (column-major, as in three.js `Matrix4.elements`). */
  transform(e: ArrayLike<number>): Sdf {
    const m: Mat3 = [e[0]!, e[4]!, e[8]!, e[1]!, e[5]!, e[9]!, e[2]!, e[6]!, e[10]!];
    const scale = Math.min(
      Math.hypot(e[0]!, e[1]!, e[2]!),
      Math.hypot(e[4]!, e[5]!, e[6]!),
      Math.hypot(e[8]!, e[9]!, e[10]!),
    );
    const moved = e[12] !== 0 || e[13] !== 0 || e[14] !== 0;
    const linear = m.some((v, i) => v !== (i % 4 === 0 ? 1 : 0)) ? this.transformLinear(m, scale) : this;
    return moved ? linear.at(e[12]!, e[13]!, e[14]!) : linear;
  }

  /**
   * Add the shape's reflection across the plane `axis = 0` (build one side, get both). Where the two
   * halves meet they blend with a smooth fillet of size `k`, so there is no crease on the plane.
   */
  mirror(axis: 'x' | 'y' | 'z' = 'x', k = 0.01): Sdf {
    const d = this.dist;
    const c = this.color;
    const b = this.bounds;
    const i = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    const extent = Math.max(Math.abs(b.min[i]), Math.abs(b.max[i]));
    const min = [...b.min] as [number, number, number];
    const max = [...b.max] as [number, number, number];
    min[i] = -extent;
    max[i] = extent;
    const lower = boxDistance(b);
    const sx = i === 0 ? -1 : 1;
    const sy = i === 1 ? -1 : 1;
    const sz = i === 2 ? -1 : 1;
    // Evaluate the nearer copy first; skip the other when its box is out of blending reach.
    const both = (x: number, y: number, z: number): [number, number] => {
      const la = lower(x, y, z);
      const lb = lower(sx * x, sy * y, sz * z);
      if (la <= lb) {
        const a = d(x, y, z);
        return [a, lb >= a + k * BLEND ? Infinity : d(sx * x, sy * y, sz * z)];
      }
      const r = d(sx * x, sy * y, sz * z);
      return [la >= r + k * BLEND ? Infinity : d(x, y, z), r];
    };
    return new Sdf(
      (x, y, z) => {
        const [a, r] = both(x, y, z);
        return smin(a, r, k);
      },
      expand({ min, max }, k / 4),
      (x, y, z, f) => {
        const [a, r] = both(x, y, z);
        return a <= r ? c(x, y, z, f) : c(sx * x, sy * y, sz * z, f);
      },
      [
        ...this.tags,
        ...this.tags.map((t) => ({
          bone: mirrorBoneName(t.bone),
          dist: (x: number, y: number, z: number) => t.dist(sx * x, sy * y, sz * z),
        })),
      ],
    );
  }

  // ---------------------------------------------------------------- surface modifiers

  /** Inflate (positive) or deflate (negative) the surface; also rounds convex edges. */
  round(r: number): Sdf {
    const d = this.dist;
    return new Sdf((x, y, z) => d(x, y, z) - r, expand(this.bounds, Math.max(0, r)), this.color, this.tags);
  }

  /** Hollow the shape into a shell of the given wall thickness centered on the old surface. */
  shell(thickness: number): Sdf {
    const d = this.dist;
    const h = thickness / 2;
    return new Sdf((x, y, z) => Math.abs(d(x, y, z)) - h, expand(this.bounds, h), this.color, this.tags);
  }

  /**
   * Add a displacement. `fn` must return values in [-1, 1]; the surface moves by up to `amplitude`
   * meters. Use with `noise3`/`fbm` for bark, stone, cloth folds, and hand-made irregularity.
   * A steep displacement (spikes, combed fur) makes the field change faster than the distance, so
   * values overstate how far a point is from the surface; `lipschitz` (the steepest slope, about
   * 1 + amplitude x the slope of `fn`) divides the field back to true distances without moving the
   * surface. Triangle reduction checks its error with these values.
   */
  displace(amplitude: number, fn: DistFn, lipschitz = 1): Sdf {
    const d = this.dist;
    const inv = 1 / Math.max(1, lipschitz);
    return new Sdf(
      (x, y, z) => (d(x, y, z) + amplitude * fn(x, y, z)) * inv,
      expand(this.bounds, Math.abs(amplitude)),
      this.color,
      this.tags,
    );
  }

  /** Stretch the shape along axes by inserting straight sections of the given half lengths. */
  elongate(hx: number, hy: number, hz: number): Sdf {
    const d = this.dist;
    const c = this.color;
    const q = (v: number, h: number) => v - Math.max(-h, Math.min(v, h));
    return new Sdf(
      (x, y, z) => d(q(x, hx), q(y, hy), q(z, hz)),
      {
        min: [this.bounds.min[0] - hx, this.bounds.min[1] - hy, this.bounds.min[2] - hz],
        max: [this.bounds.max[0] + hx, this.bounds.max[1] + hy, this.bounds.max[2] + hz],
      },
      (x, y, z, f) => c(q(x, hx), q(y, hy), q(z, hz), f),
      mapTags(this.tags, (td) => (x, y, z) => td(q(x, hx), q(y, hy), q(z, hz))),
    );
  }

  /** Bend the shape around the Z axis: X distance maps to an arc. `k` is curvature (1/radius). */
  bend(k: number): Sdf {
    if (k === 0) return this;
    const d = this.dist;
    const c = this.color;
    const map = (x: number, y: number): [number, number] => {
      const cs = Math.cos(k * x);
      const sn = Math.sin(k * x);
      return [cs * x - sn * y, sn * x + cs * y];
    };
    return new Sdf(
      (x, y, z) => {
        const [bx, by] = map(x, y);
        return d(bx, by, z) * 0.8;
      },
      expand(this.bounds, maxExtent(this.bounds) * Math.min(1, Math.abs(k) * maxExtent(this.bounds))),
      (x, y, z, f) => {
        const [bx, by] = map(x, y);
        return c(bx, by, z, f);
      },
      mapTags(this.tags, (td) => (x, y, z) => {
        const [bx, by] = map(x, y);
        return td(bx, by, z);
      }),
    );
  }

  // ---------------------------------------------------------------- paint

  /** Paint the whole shape with one color. */
  paint(color: ColorInput): Sdf {
    const col = rgb(color);
    return new Sdf(this.dist, this.bounds, () => col, this.tags);
  }

  /**
   * Paint the part of the surface that lies inside `region` (another shape used as a 3D stencil).
   * `soft` is the width of a soft edge in meters; 0 gives a crisp edge.
   * Later paints cover earlier paints.
   */
  paintWhere(region: Sdf, color: ColorInput, soft = 0): Sdf {
    const col = rgb(color);
    const c = this.color;
    const rd = region.dist;
    const color3: ColorFn =
      soft <= 0
        ? (x, y, z, f) => (rd(x, y, z) <= 0 ? col : c(x, y, z, f))
        : (x, y, z, f) => {
            const r = rd(x, y, z);
            if (r >= soft) return c(x, y, z, f);
            if (r <= -soft) return col;
            return mixRgb(c(x, y, z, f), col, smoothstep(soft, -soft, r));
          };
    return new Sdf(this.dist, this.bounds, color3, this.tags);
  }

  /** Paint with an arbitrary function of position; `base` is the color underneath. */
  paintFn(fn: (x: number, y: number, z: number, base: Rgb) => Rgb): Sdf {
    const c = this.color;
    if (maskMode()) {
      // In a slot mask, a result made from mask values (the color under it, a slot color or any
      // other color made while the mask builds, or a blend of them) is already the mask value.
      // Any other result is inline math or a raw color made outside the build: then the function
      // keeps as much of the slot as it keeps of the color under it, fn(white) - fn(black), so a
      // raw flame counts 0 and `base * 0.8` counts 0.8.
      const white: Rgb = [1, 1, 1];
      const black: Rgb = [0, 0, 0];
      const keep = (v: number) => Math.max(0, Math.min(1, v));
      return new Sdf(
        this.dist,
        this.bounds,
        (x, y, z, f) => {
          const m = c(x, y, z, f);
          const out = fn(x, y, z, m);
          if (out === m || isMaskValue(out)) return out;
          const a = fn(x, y, z, white);
          const b = fn(x, y, z, black);
          return [keep(m[0] * (a[0] - b[0])), keep(m[1] * (a[1] - b[1])), keep(m[2] * (a[2] - b[2]))];
        },
        this.tags,
      );
    }
    return new Sdf(this.dist, this.bounds, (x, y, z, f) => fn(x, y, z, c(x, y, z, f)), this.tags);
  }

  // ---------------------------------------------------------------- booleans as methods

  union(...others: Sdf[]): Sdf {
    return union(this, ...others);
  }
  smoothUnion(k: number, ...others: Sdf[]): Sdf {
    return smoothUnion(k, this, ...others);
  }
  subtract(...others: Sdf[]): Sdf {
    return subtract(this, ...others);
  }
  smoothSubtract(k: number, ...others: Sdf[]): Sdf {
    return smoothSubtract(k, this, ...others);
  }
  intersect(other: Sdf): Sdf {
    return intersect(this, other);
  }
  smoothIntersect(k: number, other: Sdf): Sdf {
    return smoothIntersect(k, this, other);
  }

  // ---------------------------------------------------------------- internals

  private transformLinear(m: Mat3, distScale: number): Sdf {
    const inv = invert3(m);
    const d = this.dist;
    const c = this.color;
    const [a, b, cc, e, f, g, h, i, j] = inv;
    return new Sdf(
      (x, y, z) => d(a * x + b * y + cc * z, e * x + f * y + g * z, h * x + i * y + j * z) * distScale,
      transformBounds(this.bounds, m),
      (x, y, z, fb) => c(a * x + b * y + cc * z, e * x + f * y + g * z, h * x + i * y + j * z, fb),
      mapTags(
        this.tags,
        (td) => (x, y, z) =>
          td(a * x + b * y + cc * z, e * x + f * y + g * z, h * x + i * y + j * z) * distScale,
      ),
    );
  }
}

// ================================================================== primitives

export function sphere(r: number): Sdf {
  return new Sdf((x, y, z) => Math.sqrt(x * x + y * y + z * z) - r, box3([-r, -r, -r], [r, r, r]));
}

/** Ellipsoid with radii (rx, ry, rz). A close distance bound, good for heads, bellies, and blobs. */
export function ellipsoid(radii: Vec3): Sdf {
  const [rx, ry, rz] = radii;
  return new Sdf(
    (x, y, z) => {
      const k0 = Math.sqrt((x / rx) ** 2 + (y / ry) ** 2 + (z / rz) ** 2);
      if (k0 < 1e-9) return -Math.min(rx, ry, rz);
      const k1 = Math.sqrt((x / (rx * rx)) ** 2 + (y / (ry * ry)) ** 2 + (z / (rz * rz)) ** 2);
      return (k0 * (k0 - 1)) / k1;
    },
    box3([-rx, -ry, -rz], [rx, ry, rz]),
  );
}

/** Box with full dimensions [width, height, depth] and optional edge radius. */
export function box(size: Vec3, radius = 0): Sdf {
  const hx = size[0] / 2 - radius;
  const hy = size[1] / 2 - radius;
  const hz = size[2] / 2 - radius;
  if (hx < 0 || hy < 0 || hz < 0) throw new Error('box(): radius is larger than half a dimension.');
  return new Sdf(
    (x, y, z) => {
      const qx = Math.abs(x) - hx;
      const qy = Math.abs(y) - hy;
      const qz = Math.abs(z) - hz;
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const oz = Math.max(qz, 0);
      return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0) - radius;
    },
    box3([-size[0] / 2, -size[1] / 2, -size[2] / 2], [size[0] / 2, size[1] / 2, size[2] / 2]),
  );
}

/** Upright cylinder along Y, centered at the origin, with optional edge radius. */
export function cylinder(radius: number, height: number, edgeRadius = 0): Sdf {
  const r = radius - edgeRadius;
  const h = height / 2 - edgeRadius;
  return new Sdf(
    (x, y, z) => {
      const dx = Math.sqrt(x * x + z * z) - r;
      const dy = Math.abs(y) - h;
      const ox = Math.max(dx, 0);
      const oy = Math.max(dy, 0);
      return Math.min(Math.max(dx, dy), 0) + Math.sqrt(ox * ox + oy * oy) - edgeRadius;
    },
    box3([-radius, -height / 2, -radius], [radius, height / 2, radius]),
  );
}

/** Capsule between points a and b. */
export function capsule(a: Vec3, b: Vec3, r: number): Sdf {
  return cone(a, b, r, r);
}

/**
 * Rounded cone between point a (radius ra) and point b (radius rb). The workhorse for limbs,
 * fingers, horns, tails, and tapered props.
 */
export function cone(a: Vec3, b: Vec3, ra: number, rb: number): Sdf {
  const bax = b[0] - a[0];
  const bay = b[1] - a[1];
  const baz = b[2] - a[2];
  const l2 = bax * bax + bay * bay + baz * baz;
  if (l2 < 1e-12) return sphere(Math.max(ra, rb)).at(a[0], a[1], a[2]);
  const rr = ra - rb;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const dist: DistFn = (px, py, pz) => {
    const pax = px - a[0];
    const pay = py - a[1];
    const paz = pz - a[2];
    const y = pax * bax + pay * bay + paz * baz;
    const z = y - l2;
    const xx = pax * l2 - bax * y;
    const xy = pay * l2 - bay * y;
    const xz = paz * l2 - baz * y;
    const x2 = xx * xx + xy * xy + xz * xz;
    const y2 = y * y * l2;
    const z2 = z * z * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - rb;
    if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - ra;
    return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - ra;
  };
  return new Sdf(dist, {
    min: [Math.min(a[0] - ra, b[0] - rb), Math.min(a[1] - ra, b[1] - rb), Math.min(a[2] - ra, b[2] - rb)],
    max: [Math.max(a[0] + ra, b[0] + rb), Math.max(a[1] + ra, b[1] + rb), Math.max(a[2] + ra, b[2] + rb)],
  });
}

/** Torus lying in the XZ plane: ring radius R, tube radius r. */
export function torus(R: number, r: number): Sdf {
  return new Sdf(
    (x, y, z) => {
      const q = Math.sqrt(x * x + z * z) - R;
      return Math.sqrt(q * q + y * y) - r;
    },
    box3([-R - r, -r, -R - r], [R + r, r, R + r]),
  );
}

/**
 * A smooth chain of rounded cones through points `[x, y, z, radius]`. Use for arms, legs, tails,
 * hair locks, roots, and branches. `k` blends the joints.
 */
export function chain(points: readonly (readonly [number, number, number, number])[], k = 0): Sdf {
  if (points.length < 2) throw new Error('chain() needs at least two points.');
  const segs: Sdf[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i]!;
    const q = points[i + 1]!;
    segs.push(cone([p[0], p[1], p[2]], [q[0], q[1], q[2]], p[3], q[3]));
  }
  return k > 0 ? smoothUnion(k, ...segs) : union(...segs);
}

/**
 * Solid half space: everything on the side `dot(normal, p) <= offset`. Always intersect it with
 * a finite shape; it is meant for cutting (flat bottoms, sliced tops).
 */
export function halfSpace(normal: Vec3, offset: number): Sdf {
  const l = Math.hypot(normal[0], normal[1], normal[2]);
  const nx = normal[0] / l;
  const ny = normal[1] / l;
  const nz = normal[2] / l;
  return new Sdf(
    (x, y, z) => nx * x + ny * y + nz * z - offset,
    box3([-INFINITE, -INFINITE, -INFINITE], [INFINITE, INFINITE, INFINITE]),
  );
}

// ================================================================== booleans

/**
 * Lower bound of the distance from a point to anything inside `b` (0 inside the box). Parents use
 * it to skip children that cannot change the result, which keeps big part trees fast.
 */
/**
 * A lower bound on the distance of any shape inside box `b`: the box distance outside the box,
 * and minus the box's smallest half size inside it (no point is deeper than that). Cutters are
 * skipped only where this bound proves they cannot change the result, so carved-away regions
 * report their true distance. (A plain box distance is 0 inside the box, which let every point
 * outside the base skip the cutter and kept a "ghost" of the removed material in the field:
 * meshing stayed right, but occlusion baked shadows from it.)
 */
function cutterFloor(b: Aabb): DistFn {
  const outside = boxDistance(b);
  const deepest = Math.min(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]) / 2;
  if (!(deepest < INFINITE)) return () => -Infinity;
  return (x, y, z) => {
    const l = outside(x, y, z);
    return l > 0 ? l : -deepest;
  };
}

function boxDistance(b: Aabb): DistFn {
  const cx = (b.min[0] + b.max[0]) / 2;
  const cy = (b.min[1] + b.max[1]) / 2;
  const cz = (b.min[2] + b.max[2]) / 2;
  const hx = (b.max[0] - b.min[0]) / 2;
  const hy = (b.max[1] - b.min[1]) / 2;
  const hz = (b.max[2] - b.min[2]) / 2;
  if (!(hx < INFINITE && hy < INFINITE && hz < INFINITE)) return () => 0;
  return (x, y, z) => {
    const qx = Math.abs(x - cx) - hx;
    const qy = Math.abs(y - cy) - hy;
    const qz = Math.abs(z - cz) - hz;
    const ox = qx > 0 ? qx : 0;
    const oy = qy > 0 ? qy : 0;
    const oz = qz > 0 ? qz : 0;
    return Math.sqrt(ox * ox + oy * oy + oz * oz);
  };
}

export function union(...shapes: Sdf[]): Sdf {
  if (shapes.length === 0) throw new Error('union() needs at least one shape.');
  if (shapes.length === 1) return shapes[0]!;
  const ds = shapes.map((s) => s.dist);
  const cs = shapes.map((s) => s.color);
  const bs = shapes.map((s) => boxDistance(s.bounds));
  const n = ds.length;
  const lower = new Float64Array(n);
  // Evaluate the most promising child first, then skip every child whose box is farther away
  // than the best distance so far. The result is identical to evaluating all children.
  const nearest = (x: number, y: number, z: number): number => {
    let first = 0;
    for (let i = 0; i < n; i++) {
      lower[i] = bs[i]!(x, y, z);
      if (lower[i]! < lower[first]!) first = i;
    }
    let m = ds[first]!(x, y, z);
    let best = first;
    for (let i = 0; i < n; i++) {
      if (i === first || lower[i]! >= m) continue;
      const v = ds[i]!(x, y, z);
      if (v < m) {
        m = v;
        best = i;
      }
    }
    bestIndex = best;
    return m;
  };
  let bestIndex = 0;
  return new Sdf(
    nearest,
    unionBounds(shapes.map((s) => s.bounds)),
    (x, y, z, f) => {
      nearest(x, y, z);
      return cs[bestIndex]!(x, y, z, f);
    },
    shapes.flatMap((s) => s.tags),
  );
}

export interface SmoothOptions {
  /** Blend colors across the fillet instead of splitting them at the midline. */
  readonly blendColor?: boolean;
}

/**
 * Union with a smooth fillet of size `k` meters between the shapes. This is what turns separate
 * primitives into one continuous, sculpted-looking surface.
 */
export function smoothUnion(k: number, ...shapes: (Sdf | SmoothOptions)[]): Sdf {
  const opts = (shapes.find((s) => !(s instanceof Sdf)) ?? {}) as SmoothOptions;
  const list = shapes.filter((s): s is Sdf => s instanceof Sdf);
  if (list.length === 0) throw new Error('smoothUnion() needs at least one shape.');
  if (k <= 0) return union(...list);
  let acc = list[0]!;
  for (let i = 1; i < list.length; i++) acc = smoothUnion2(k, acc, list[i]!, opts.blendColor === true);
  return acc;
}

function smoothUnion2(k: number, a: Sdf, b: Sdf, blend: boolean): Sdf {
  const da = a.dist;
  const db = b.dist;
  const ba = boxDistance(a.bounds);
  const bb = boxDistance(b.bounds);
  const ca = a.color;
  const cb = b.color;
  // Returns both child values; a child whose box is more than `k` beyond the other value cannot
  // take part in the blend, so it is not evaluated (its value is reported as +Infinity).
  let va = 0;
  let vb = 0;
  const both = (x: number, y: number, z: number): void => {
    const la = ba(x, y, z);
    const lb = bb(x, y, z);
    if (la <= lb) {
      va = da(x, y, z);
      vb = lb >= va + k * BLEND ? Infinity : db(x, y, z);
    } else {
      vb = db(x, y, z);
      va = la >= vb + k * BLEND ? Infinity : da(x, y, z);
    }
  };
  return new Sdf(
    (x, y, z) => {
      both(x, y, z);
      return smin(va, vb, k);
    },
    expand(unionBounds([a.bounds, b.bounds]), k / 4),
    (x, y, z, f) => {
      both(x, y, z);
      const a0 = va;
      const b0 = vb;
      if (!blend) return a0 <= b0 ? ca(x, y, z, f) : cb(x, y, z, f);
      const t = clamp01(0.5 + (0.5 * (b0 - a0)) / k);
      if (t >= 1) return ca(x, y, z, f);
      if (t <= 0) return cb(x, y, z, f);
      return mixRgb(cb(x, y, z, f), ca(x, y, z, f), t);
    },
    [...a.tags, ...b.tags],
  );
}

/** Carve `cutters` out of `base`. The cut faces keep the base's paint. */
export function subtract(base: Sdf, ...cutters: Sdf[]): Sdf {
  if (cutters.length === 0) return base;
  const cutter = union(...cutters);
  const cut = cutter.dist;
  const lower = cutterFloor(cutter.bounds);
  const d = base.dist;
  return new Sdf(
    (x, y, z) => {
      const a = d(x, y, z);
      // The cutter only matters where it can be deeper than a, i.e. where cut < -a.
      if (lower(x, y, z) >= -a) return a;
      return Math.max(a, -cut(x, y, z));
    },
    base.bounds,
    base.color,
    base.tags,
  );
}

export function smoothSubtract(k: number, base: Sdf, ...cutters: Sdf[]): Sdf {
  if (cutters.length === 0) return base;
  if (k <= 0) return subtract(base, ...cutters);
  const cutter = union(...cutters);
  const cut = cutter.dist;
  const lower = cutterFloor(cutter.bounds);
  const d = base.dist;
  return new Sdf(
    (x, y, z) => {
      const a = d(x, y, z);
      if (lower(x, y, z) >= k * BLEND - a) return a;
      const b = -cut(x, y, z);
      return -smin(-a, -b, k);
    },
    base.bounds,
    base.color,
    base.tags,
  );
}

export function intersect(a: Sdf, b: Sdf): Sdf {
  const da = a.dist;
  const db = b.dist;
  return new Sdf(
    (x, y, z) => Math.max(da(x, y, z), db(x, y, z)),
    intersectBounds(a.bounds, b.bounds),
    a.color,
    a.tags,
  );
}

export function smoothIntersect(k: number, a: Sdf, b: Sdf): Sdf {
  if (k <= 0) return intersect(a, b);
  const da = a.dist;
  const db = b.dist;
  return new Sdf(
    (x, y, z) => {
      const va = da(x, y, z);
      const vb = db(x, y, z);
      return -smin(-va, -vb, k);
    },
    intersectBounds(a.bounds, b.bounds),
    a.color,
    a.tags,
  );
}

// ================================================================== helpers

type Mat3 = readonly [number, number, number, number, number, number, number, number, number];

export function box3(min: Vec3, max: Vec3): Aabb {
  return { min, max };
}

export function expand(b: Aabb, pad: number): Aabb {
  return {
    min: [b.min[0] - pad, b.min[1] - pad, b.min[2] - pad],
    max: [b.max[0] + pad, b.max[1] + pad, b.max[2] + pad],
  };
}

function maxExtent(b: Aabb): number {
  return Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
}

export function unionBounds(list: readonly Aabb[]): Aabb {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const b of list)
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i]!, b.min[i]!);
      max[i] = Math.max(max[i]!, b.max[i]!);
    }
  return { min: min as unknown as Vec3, max: max as unknown as Vec3 };
}

function intersectBounds(a: Aabb, b: Aabb): Aabb {
  return {
    min: [Math.max(a.min[0], b.min[0]), Math.max(a.min[1], b.min[1]), Math.max(a.min[2], b.min[2])],
    max: [Math.min(a.max[0], b.max[0]), Math.min(a.max[1], b.max[1]), Math.min(a.max[2], b.max[2])],
  };
}

function transformBounds(b: Aabb, m: Mat3): Aabb {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let c = 0; c < 8; c++) {
    const x = c & 1 ? b.max[0] : b.min[0];
    const y = c & 2 ? b.max[1] : b.min[1];
    const z = c & 4 ? b.max[2] : b.min[2];
    const t = [
      m[0] * x + m[1] * y + m[2] * z,
      m[3] * x + m[4] * y + m[5] * z,
      m[6] * x + m[7] * y + m[8] * z,
    ];
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i]!, t[i]!);
      max[i] = Math.max(max[i]!, t[i]!);
    }
  }
  return { min: min as unknown as Vec3, max: max as unknown as Vec3 };
}

function eulerMatrix(ax: number, ay: number, az: number): Mat3 {
  const cx = Math.cos(ax),
    sx = Math.sin(ax);
  const cy = Math.cos(ay),
    sy = Math.sin(ay);
  const cz = Math.cos(az),
    sz = Math.sin(az);
  // R = Rz * Ry * Rx (X applied first).
  return [
    cz * cy,
    cz * sy * sx - sz * cx,
    cz * sy * cx + sz * sx,
    sz * cy,
    sz * sy * sx + cz * cx,
    sz * sy * cx - cz * sx,
    -sy,
    cy * sx,
    cy * cx,
  ];
}

function invert3(m: Mat3): Mat3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) throw new Error('Transform is not invertible.');
  const s = 1 / det;
  return [
    A * s,
    -(b * i - c * h) * s,
    (b * f - c * e) * s,
    B * s,
    (a * i - c * g) * s,
    -(a * f - c * d) * s,
    C * s,
    -(a * h - b * g) * s,
    (a * e - b * d) * s,
  ];
}

/**
 * Cubic smooth minimum: equal to min(a, b) when they differ by more than k, and a C2-smooth fillet
 * otherwise. C2 matters: with a quadratic blend, highlights show a line where each fillet ends.
 */
export function smin(a: number, b: number, k: number): number {
  if (k <= 0) return a < b ? a : b;
  // Width scaled by 1.5 so the fillet bulges k/4, like the classic quadratic blend of size k.
  const w = k * BLEND;
  const h = Math.max(w - Math.abs(a - b), 0) / w;
  return (a < b ? a : b) - h * h * h * w * (1 / 6);
}

/** A cubic blend of size k influences points where the two distances differ by less than k * BLEND. */
const BLEND = 1.5;

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(e0: number, e1: number, v: number): number {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}
