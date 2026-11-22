// Review B adversarial probes for src/apk3d/sim/copy.ts at audited HEAD 0d8fc7d.
// Run: node measure/runs/old_browser_builtins_20261122/probe-copy-run.mjs
import vm from 'node:vm';
import { deepCopy } from './probe-copy.mjs';
import { atIndex, lastIndexWhere } from './probe-index-math.mjs';

const results = [];
const probe = (name, fn) => {
  try {
    results.push({ name, outcome: 'completed', detail: fn() });
  } catch (error) {
    results.push({
      name,
      outcome: 'threw',
      detail: `${error.name}: ${String(error.message).slice(0, 120)}`,
    });
  }
};
const show = (value) => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

// P1: direct cycle — must terminate and keep the cycle shape.
probe('P1 self-cycle', () => {
  const a = { name: 'a' };
  a.self = a;
  const c = deepCopy(a);
  return `c.self===c: ${c.self === c}; c!==a: ${c !== a}; c.name: ${c.name}`;
});

// P2: cycle through Map and array.
probe('P2 map cycle', () => {
  const m = new Map();
  const arr = [m];
  m.set('arr', arr);
  const c = deepCopy(m);
  const cArr = c.get('arr');
  return `c.get('arr')[0]===c: ${cArr[0] === c}; c!==m: ${c !== m}`;
});

// P3: very deep plain nesting — structuredClone survives; recursion-based copies overflow.
probe('P3 deep 50000', () => {
  let root = {};
  let node = root;
  for (let i = 0; i < 50_000; i++) {
    node.next = {};
    node = node.next;
  }
  const c = deepCopy(root);
  let depth = 0;
  for (let n = c; n.next; n = n.next) depth++;
  return `copied depth ${depth}`;
});

// P4: own __proto__ key via defineProperty — structuredClone keeps it as own data key.
probe('P4 own __proto__ key', () => {
  const s = {};
  Object.defineProperty(s, '__proto__', { value: { polluted: true }, enumerable: true });
  const c = deepCopy(s);
  const protoIsObject = Object.getPrototypeOf(c) === Object.prototype;
  const protoIsPolluted = Object.getPrototypeOf(c) === c.__proto__ || Object.getPrototypeOf(c)?.polluted === true;
  const ownProto = Object.prototype.hasOwnProperty.call(c, '__proto__');
  return `clone proto is Object.prototype: ${protoIsObject}; proto became source __proto__: ${protoIsPolluted}; own __proto__ key kept: ${ownProto}`;
});

// P5: own __proto__ key from JSON.parse (the save/load shape).
probe('P5 JSON __proto__ key', () => {
  const s = JSON.parse('{"__proto__":{"polluted":true},"name":"save"}');
  const c = deepCopy(s);
  return `source own __proto__: ${Object.prototype.hasOwnProperty.call(s, '__proto__')}; clone own __proto__: ${Object.prototype.hasOwnProperty.call(c, '__proto__')}; clone proto polluted: ${Object.getPrototypeOf(c)?.polluted === true}; clone.name: ${c.name}`;
});

// P6: getter on source — copied once, side effects bounded; throwing getter propagates.
probe('P6 getter', () => {
  let reads = 0;
  const s = {};
  Object.defineProperty(s, 'lazy', { enumerable: true, get: () => (reads++, reads) });
  const c = deepCopy(s);
  const afterCopy = reads;
  const c2 = deepCopy(s);
  return `reads after copy1: ${afterCopy}; copy1.lazy: ${c.lazy}; reads after copy2: ${reads}; copy2.lazy: ${c2.lazy}`;
});

// P7: getter that returns the source itself (cycle through accessor).
probe('P7 getter self-cycle', () => {
  const s = { n: 1 };
  Object.defineProperty(s, 'loop', { enumerable: true, get: () => s });
  const c = deepCopy(s);
  return `c.loop===c: ${c.loop === c}`;
});

// P8: class instance — own enumerable props copied; non-enumerable field dropped;
// structuredClone flattens to a plain object instead.
probe('P8 class instance', () => {
  class Player {
    constructor(name) {
      this.name = name;
      Object.defineProperty(this, 'secret', { value: 'hidden', enumerable: false });
    }
    greet() {
      return `hi ${this.name}`;
    }
  }
  const s = new Player('dan');
  const c = deepCopy(s);
  let greet = 'n/a';
  try {
    greet = c.greet();
  } catch (error) {
    greet = `threw ${error.name}`;
  }
  return `c instanceof Player: ${c instanceof Player}; c.name: ${c.name}; c.secret: ${c.secret}; c.greet(): ${greet}`;
});

// P9: sparse array — holes and length survive.
probe('P9 sparse array', () => {
  const s = [];
  s.length = 100;
  s[99] = 'end';
  const c = deepCopy(s);
  return `c.length: ${c.length}; 0 in c: ${0 in c}; 99 in c: ${99 in c}; c[99]: ${c[99]}; Array.isArray: ${Array.isArray(c)}`;
});

// P10: null-prototype object.
probe('P10 null prototype', () => {
  const s = Object.create(null);
  s.key = 'v';
  const c = deepCopy(s);
  return `clone proto null: ${Object.getPrototypeOf(c) === null}; c.key: ${c.key}`;
});

// P11: symbol-keyed own property — structuredClone copies it; Object.keys drops it.
probe('P11 symbol key', () => {
  const sym = Symbol('k');
  const s = { [sym]: 'sv', plain: 1 };
  const c = deepCopy(s);
  return `source sym value: ${s[sym]}; clone sym value: ${c[sym]}; clone plain: ${c.plain}`;
});

// P12: RegExp — deepCopy keeps RegExp.prototype but loses the internal slot.
probe('P12 RegExp', () => {
  const s = { re: /ab+c/gi };
  s.re.lastIndex = 2;
  const c = deepCopy(s);
  let exec = 'n/a';
  try {
    exec = show(c.re.exec('xxabbbcx'));
  } catch (error) {
    exec = `threw ${error.name}`;
  }
  return `c.re instanceof RegExp: ${c.re instanceof RegExp}; c.re.lastIndex: ${c.re.lastIndex}; c.re.exec: ${exec}`;
});

// P13: two typed-array views over one buffer — the copy must share one copied buffer.
probe('P13 shared buffer views', () => {
  const buf = new ArrayBuffer(8);
  const a = new Uint8Array(buf, 0, 4);
  const b = new Uint8Array(buf, 4, 4);
  a[0] = 7;
  b[0] = 9;
  const s = { a, b };
  const c = deepCopy(s);
  return `views share one buffer: ${c.a.buffer === c.b.buffer}; offsets ${c.a.byteOffset}/${c.b.byteOffset}; values ${c.a[0]},${c.b[0]}; source untouched: ${a[0] === 7 && b[0] === 9}`;
});

// P14: cross-realm Map — instanceof fails, silent flatten to empty object.
probe('P14 cross-realm Map', () => {
  const ctx = vm.createContext({});
  const remote = vm.runInContext('new Map([["k","v"]])', ctx);
  const s = { m: remote };
  const c = deepCopy(s);
  return `clone is Map: ${c.m instanceof Map}; clone size: ${c.m instanceof Map ? c.m.size : 'n/a'}; clone keys: ${show(Object.keys(c.m))}`;
});

// P15: cross-realm Promise — instanceof fails, silent empty object instead of TypeError.
probe('P15 cross-realm Promise', () => {
  const ctx = vm.createContext({ Promise });
  const remote = vm.runInContext('Promise.resolve(1)', ctx);
  const s = { p: remote };
  let c = 'n/a';
  try {
    c = show(Object.keys(deepCopy(s).p));
  } catch (error) {
    c = `threw ${error.name}`;
  }
  return `clone promise keys: ${c}`;
});

// P16: DataView copy.
probe('P16 DataView', () => {
  const buf = new ArrayBuffer(8);
  const v = new DataView(buf);
  v.setUint32(4, 0xdeadbeef);
  const c = deepCopy({ v });
  return `c.v.getUint32(4): ${c.v.getUint32(4).toString(16)}; c.v instanceof DataView: ${c.v instanceof DataView}; own buffer: ${c.v.buffer !== buf}`;
});

// P17: atIndex parity fuzz against native .at including holes and odd indices.
probe('P17 atIndex fuzz', () => {
  const list = ['a', , 'c', 'd'];
  const indices = [-5, -4, -3, -2.5, -1, -0, 0, 0.5, 1, 3, 4, 5, NaN, Infinity, -Infinity, 1e21];
  const mismatches = [];
  for (const i of indices) {
    const native = list.at(i);
    const mine = atIndex(list, i);
    const same = native === mine || (Number.isNaN(native) && Number.isNaN(mine));
    if (!same) mismatches.push(`${String(i)}: native=${String(native)} mine=${String(mine)}`);
  }
  // holes: 1 in list is a hole; at(1) === undefined === atIndex(1). Also -0 length list.
  const empty = atIndex([], -1);
  return `mismatches: ${mismatches.length ? mismatches.join('; ') : 'none'}; empty atIndex(-1): ${String(empty)}`;
});

// P18: lastIndexWhere parity fuzz.
probe('P18 lastIndexWhere fuzz', () => {
  const list = [3, 7, 7, 1, 7];
  const pred = (x) => x === 7;
  const cases = [
    [list, pred, list.findLastIndex(pred), lastIndexWhere(list, pred)],
    [[1, 2, 3], () => false, [1, 2, 3].findLastIndex(() => false), lastIndexWhere([1, 2, 3], () => false)],
    [[5], (x) => x === 5, [5].findLastIndex((x) => x === 5), lastIndexWhere([5], (x) => x === 5)],
    [[], () => true, [].findLastIndex(() => true), lastIndexWhere([], () => true)],
  ];
  const bad = cases.filter((c) => c[2] !== c[3]);
  return bad.length ? `mismatch: ${show(bad)}` : 'all parity checks match native findLastIndex';
});

// P19: structuredClone comparison baseline for P3 (depth the native accepts here).
probe('P19 native deep 50000', () => {
  let root = {};
  let node = root;
  for (let i = 0; i < 50_000; i++) {
    node.next = {};
    node = node.next;
  }
  const c = structuredClone(root);
  let depth = 0;
  for (let n = c; n.next; n = n.next) depth++;
  return `native structuredClone copied depth ${depth}`;
});

// P20: frozen object copy.
probe('P20 frozen', () => {
  const s = Object.freeze({ a: Object.freeze({ b: 1 }) });
  const c = deepCopy(s);
  c.a.b = 2;
  return `mutated nested copy: ${c.a.b === 2}; source still: ${s.a.b === 1}`;
});

for (const r of results) {
  console.log(`${r.outcome === 'threw' ? 'THREW ' : 'ok     '}${r.name} :: ${r.detail}`);
}
