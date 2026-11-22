// Review B re-review r2 probes for src/apk3d/sim/copy.ts at audited HEAD d15af2a.
// Run: node measure/runs/old_browser_builtins_20261122/probe-copy-run-r2.mjs
import { deepCopy } from './probe-copy.mjs';
import { atIndex, lastIndexWhere } from './probe-index-math.mjs';

const results = [];
const probe = (name, fn) => {
  try {
    results.push({ name, outcome: 'ok', detail: fn() });
  } catch (error) {
    results.push({
      name,
      outcome: 'THREW',
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

// R1: direct cycle still terminates after the defineProperty rewrite.
probe('R1 self-cycle', () => {
  const a = { name: 'a' };
  a.self = a;
  const c = deepCopy(a);
  return `c.self===c: ${c.self === c}; c!==a: ${c !== a}; c.name: ${c.name}`;
});

// R2: map/array cycle.
probe('R2 map cycle', () => {
  const m = new Map();
  const arr = [m];
  m.set('arr', arr);
  const c = deepCopy(m);
  return `c.get('arr')[0]===c: ${c.get('arr')[0] === c}; c!==m: ${c !== m}`;
});

// R3: depth 50000 (native baseline threw RangeError here in r1).
probe('R3 deep 50000', () => {
  const root = {};
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

// R4: own __proto__ key via defineProperty — must now stay an own data key.
probe('R4 own __proto__ key', () => {
  const s = {};
  Object.defineProperty(s, '__proto__', { value: { polluted: true }, enumerable: true });
  const c = deepCopy(s);
  const own = Object.prototype.hasOwnProperty.call(c, '__proto__');
  const protoClean = Object.getPrototypeOf(c) === Object.prototype;
  const valueKept = c.__proto__ !== undefined;
  const innerOwn = Object.prototype.hasOwnProperty.call(c.__proto__, 'polluted');
  return `own __proto__ kept: ${own}; clone proto is Object.prototype: ${protoClean}; value present: ${valueKept}; copied value has polluted: ${innerOwn}`;
});

// R5: JSON.parse save-shape __proto__ — clone must not be polluted, Object.prototype untouched.
probe('R5 JSON __proto__ key no pollution', () => {
  const before = {}.polluted;
  const s = JSON.parse('{"__proto__":{"polluted":true},"name":"save"}');
  const c = deepCopy(s);
  const own = Object.prototype.hasOwnProperty.call(c, '__proto__');
  const protoIsObject = Object.getPrototypeOf(c) === Object.prototype;
  const protoPolluted = Object.getPrototypeOf(c).polluted === true;
  const globalLeaked = {}.polluted !== undefined;
  const after = {}.polluted;
  return `source own __proto__: ${Object.prototype.hasOwnProperty.call(s, '__proto__')}; clone own __proto__: ${own}; clone proto is Object.prototype: ${protoIsObject}; clone proto polluted: ${protoPolluted}; Object.prototype leaked: ${globalLeaked}; before/after: ${String(before)}/${String(after)}; c.name: ${c.name}`;
});

// R6: nested __proto__ at depth (pollution attempt through a nested plain object).
probe('R6 nested __proto__', () => {
  const inner = JSON.parse('{"__proto__":{"x":1}}');
  const s = { level1: { level2: inner } };
  const c = deepCopy(s);
  const innerClone = c.level1.level2;
  const own = Object.prototype.hasOwnProperty.call(innerClone, '__proto__');
  const protoClean = Object.getPrototypeOf(innerClone) === Object.prototype;
  return `nested clone own __proto__: ${own}; nested proto clean: ${protoClean}; Object.prototype.x: ${String({}.x)}`;
});

// R7: getter still read once per copy.
probe('R7 getter', () => {
  let reads = 0;
  const s = {};
  Object.defineProperty(s, 'lazy', { enumerable: true, get: () => (reads++, reads) });
  const c = deepCopy(s);
  const after1 = reads;
  const c2 = deepCopy(s);
  return `reads after copy1: ${after1}; c.lazy: ${c.lazy}; reads after copy2: ${reads}; c2.lazy: ${c2.lazy}`;
});

// R8: sparse array — new Array(length) must keep length and holes.
probe('R8 sparse array', () => {
  const s = [];
  s.length = 100;
  s[99] = 'end';
  const c = deepCopy(s);
  return `c.length: ${c.length}; 0 in c: ${0 in c}; 98 in c: ${98 in c}; 99 in c: ${99 in c}; c[99]: ${c[99]}; Array.isArray: ${Array.isArray(c)}`;
});

// R9: array with a hole and an own __proto__ element key (hostile mixed shape).
probe('R9 array with __proto__ index key', () => {
  const s = [1, 2];
  Object.defineProperty(s, '__proto__', { value: { bad: 1 }, enumerable: true });
  const c = deepCopy(s);
  const own = Object.prototype.hasOwnProperty.call(c, '__proto__');
  const protoIsArray = Array.isArray(c) && Object.getPrototypeOf(c) === Array.prototype;
  return `c[0]: ${c[0]}; c[1]: ${c[1]}; own __proto__: ${own}; c.__proto__ is array proto (not polluted): ${protoIsArray}; Array.prototype.bad: ${String([].bad)}`;
});

// R10: array length preserved when trailing holes exist beyond last element.
probe('R10 array trailing holes', () => {
  const s = ['a'];
  s.length = 5;
  const c = deepCopy(s);
  return `c.length: ${c.length}; c[0]: ${c[0]}; 4 in c: ${4 in c}`;
});

// R11: null-prototype object still preserved.
probe('R11 null prototype', () => {
  const s = Object.create(null);
  s.key = 'v';
  const c = deepCopy(s);
  return `clone proto null: ${Object.getPrototypeOf(c) === null}; c.key: ${c.key}`;
});

// R12: frozen source unchanged after mutating nested copy.
probe('R12 frozen', () => {
  const s = Object.freeze({ a: Object.freeze({ b: 1 }) });
  const c = deepCopy(s);
  c.a.b = 2;
  return `mutated nested copy: ${c.a.b === 2}; source still: ${s.a.b === 1}`;
});

// R13: two typed-array views over one buffer still share one copied buffer.
probe('R13 shared buffer views', () => {
  const buf = new ArrayBuffer(8);
  const a = new Uint8Array(buf, 0, 4);
  const b = new Uint8Array(buf, 4, 4);
  a[0] = 7;
  b[0] = 9;
  const c = deepCopy({ a, b });
  return `views share one buffer: ${c.a.buffer === c.b.buffer}; offsets ${c.a.byteOffset}/${c.b.byteOffset}; values ${c.a[0]},${c.b[0]}`;
});

// R14: uncopyables still raise TypeError.
probe('R14 uncopyables', () => {
  const bad = [
    ['function', () => 1],
    ['symbol', Symbol('s')],
    ['WeakMap', new WeakMap()],
    ['WeakSet', new WeakSet()],
    ['promise', Promise.resolve(1)],
  ];
  const thrown = bad.filter(([, v]) => {
    try {
      deepCopy(v);
      return false;
    } catch (e) {
      return e instanceof TypeError;
    }
  });
  return `TypeError raised for ${thrown.length} of ${bad.length}: ${thrown.map(([n]) => n).join(', ')}`;
});

// R15: symbol keys still dropped (contract scope: own string keys) — regression pin only.
probe('R15 symbol key', () => {
  const sym = Symbol('k');
  const s = { [sym]: 'sv', plain: 1 };
  const c = deepCopy(s);
  return `clone sym value: ${String(c[sym])}; clone plain: ${c.plain}`;
});

// R16: atIndex fuzz re-run.
probe('R16 atIndex fuzz', () => {
  const list = ['a', , 'c', 'd'];
  const indices = [-5, -4, -3, -2.5, -1, -0, 0, 0.5, 1, 3, 4, 5, NaN, Infinity, -Infinity, 1e21];
  const mismatches = [];
  for (const i of indices) {
    const native = list.at(i);
    const mine = atIndex(list, i);
    const same = native === mine || (Number.isNaN(native) && Number.isNaN(mine));
    if (!same) mismatches.push(`${String(i)}: native=${String(native)} mine=${String(mine)}`);
  }
  return `mismatches: ${mismatches.length ? mismatches.join('; ') : 'none'}`;
});

// R17: lastIndexWhere fuzz re-run.
probe('R17 lastIndexWhere fuzz', () => {
  const list = [3, 7, 7, 1, 7];
  const pred = (x) => x === 7;
  const ok =
    lastIndexWhere(list, pred) === list.findLastIndex(pred) &&
    lastIndexWhere([], () => true) === -1 &&
    lastIndexWhere([5], (x) => x === 5) === 0;
  return ok ? 'all parity checks match native findLastIndex' : 'MISMATCH';
});

for (const r of results) {
  console.log(`${r.outcome === 'THREW' ? 'THREW ' : 'ok     '}${r.name} :: ${r.detail}`);
}
