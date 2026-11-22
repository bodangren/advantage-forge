/** A local replacement for `structuredClone`, which throws on the oldest supported browsers.
 *
 * The helper copies the plain data that a simulation state holds, plus the built-in containers that
 * a later state may hold. It throws a TypeError for unsupported values: functions, symbols,
 * WeakMap, WeakSet, and promises. The native clone throws a DataCloneError for those values. This
 * helper copies values from the current realm. The module imports nothing so it stays inside the
 * `apk3d/sim` import rule.
 */

/** Copy `value` into a new graph that shares no object with the source. */
export function deepCopy<T>(value: T): T {
  return copyValue(value, new WeakMap<object, unknown>());
}

function copyValue<T>(value: T, seen: WeakMap<object, unknown>): T {
  if (value === null) return value;
  const type = typeof value;
  if (type === 'function' || type === 'symbol') {
    throw new TypeError(`deepCopy: cannot copy a ${type}`);
  }
  if (type !== 'object') return value;

  const source = value as unknown as object;
  if (seen.has(source)) return seen.get(source) as T;

  if (source instanceof Date) {
    const out = new Date(source.getTime());
    seen.set(source, out);
    return out as unknown as T;
  }
  if (source instanceof WeakMap || source instanceof WeakSet || source instanceof Promise) {
    throw new TypeError('deepCopy: cannot copy this object type');
  }
  if (source instanceof Map) {
    const out = new Map<unknown, unknown>();
    seen.set(source, out);
    for (const [key, item] of source) out.set(copyValue(key, seen), copyValue(item, seen));
    return out as unknown as T;
  }
  if (source instanceof Set) {
    const out = new Set<unknown>();
    seen.set(source, out);
    for (const item of source) out.add(copyValue(item, seen));
    return out as unknown as T;
  }
  if (source instanceof ArrayBuffer) {
    const out = source.slice(0);
    seen.set(source, out);
    return out as unknown as T;
  }
  if (ArrayBuffer.isView(source)) {
    const buffer = copyValue(source.buffer, seen) as ArrayBuffer;
    let out: ArrayBufferView;
    if (source instanceof DataView) {
      out = new DataView(buffer, source.byteOffset, source.byteLength);
    } else {
      const View = source.constructor as new (
        buf: ArrayBuffer,
        offset: number,
        length: number,
      ) => ArrayBufferView;
      out = new View(buffer, source.byteOffset, (source as unknown as { length: number }).length);
    }
    seen.set(source, out);
    return out as unknown as T;
  }

  let out: Record<PropertyKey, unknown>;
  if (Array.isArray(source)) {
    out = new Array<unknown>(source.length) as unknown as Record<PropertyKey, unknown>;
  } else {
    out = Object.create(Object.getPrototypeOf(source)) as Record<PropertyKey, unknown>;
  }
  seen.set(source, out);
  const record = source as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    Object.defineProperty(out, key, {
      value: copyValue(record[key], seen),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  return out as unknown as T;
}
