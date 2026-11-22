/** Local index helpers that replace the ES2022 `Array.prototype.at` and `findLastIndex` methods.
 *
 * Both match the native result for every argument, including out-of-range and non-integer indices.
 * The module imports nothing so it stays inside the `apk3d/sim` import rule.
 */

/** Return the element at `index`, counting from the end when `index` is negative. */
export function atIndex<T>(list: readonly T[], index: number): T | undefined {
  let at = Math.trunc(index);
  if (Number.isNaN(at)) at = 0;
  if (at < 0) at += list.length;
  if (at < 0 || at >= list.length) return undefined;
  return list[at];
}

/** Return the last index whose value satisfies `predicate`, or -1 when none does. */
export function lastIndexWhere<T>(
  list: readonly T[],
  predicate: (value: T, index: number) => boolean,
): number {
  for (let i = list.length - 1; i >= 0; i--) {
    if (predicate(list[i] as T, i)) return i;
  }
  return -1;
}
