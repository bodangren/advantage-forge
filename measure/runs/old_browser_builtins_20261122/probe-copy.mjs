function deepCopy(value) {
  return copyValue(value, /* @__PURE__ */ new WeakMap());
}
function copyValue(value, seen) {
  if (value === null) return value;
  const type = typeof value;
  if (type === "function" || type === "symbol") {
    throw new TypeError(`deepCopy: cannot copy a ${type}`);
  }
  if (type !== "object") return value;
  const source = value;
  if (seen.has(source)) return seen.get(source);
  if (source instanceof Date) {
    const out2 = new Date(source.getTime());
    seen.set(source, out2);
    return out2;
  }
  if (source instanceof WeakMap || source instanceof WeakSet || source instanceof Promise) {
    throw new TypeError("deepCopy: cannot copy this object type");
  }
  if (source instanceof Map) {
    const out2 = /* @__PURE__ */ new Map();
    seen.set(source, out2);
    for (const [key, item] of source) out2.set(copyValue(key, seen), copyValue(item, seen));
    return out2;
  }
  if (source instanceof Set) {
    const out2 = /* @__PURE__ */ new Set();
    seen.set(source, out2);
    for (const item of source) out2.add(copyValue(item, seen));
    return out2;
  }
  if (source instanceof ArrayBuffer) {
    const out2 = source.slice(0);
    seen.set(source, out2);
    return out2;
  }
  if (ArrayBuffer.isView(source)) {
    const buffer = copyValue(source.buffer, seen);
    let out2;
    if (source instanceof DataView) {
      out2 = new DataView(buffer, source.byteOffset, source.byteLength);
    } else {
      const View = source.constructor;
      out2 = new View(buffer, source.byteOffset, source.length);
    }
    seen.set(source, out2);
    return out2;
  }
  let out;
  if (Array.isArray(source)) {
    out = new Array(source.length);
  } else {
    out = Object.create(Object.getPrototypeOf(source));
  }
  seen.set(source, out);
  const record = source;
  for (const key of Object.keys(record)) {
    Object.defineProperty(out, key, {
      value: copyValue(record[key], seen),
      writable: true,
      enumerable: true,
      configurable: true
    });
  }
  return out;
}
export {
  deepCopy
};
