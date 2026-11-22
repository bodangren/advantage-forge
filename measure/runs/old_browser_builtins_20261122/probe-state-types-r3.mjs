// Temporary breakage probe for T3r3. Not committed. Runs the OLD kindsOf visitor
// (Object.keys, as committed at HEAD before the Reflect.ownKeys change) against the new
// inline control expectations. Each expectation must FAIL here, proving the new control
// would have caught the gap on the old visitor.
const ALLOWED = new Set(['plain-object', 'array', 'string', 'number', 'boolean', 'null', 'undefined']);

function kindsOf(value) {
  const kinds = new Set();
  const seen = new Set();
  const visit = (node) => {
    if (node === null) {
      kinds.add('null');
      return;
    }
    const type = typeof node;
    if (type !== 'object') {
      kinds.add(type);
      return;
    }
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      kinds.add('array');
      for (const item of node) visit(item);
      return;
    }
    const proto = Object.getPrototypeOf(node);
    if (proto === Object.prototype || proto === null) {
      kinds.add('plain-object');
      const record = node;
      for (const key of Object.keys(record)) visit(record[key]);
      return;
    }
    kinds.add(`other:${Object.prototype.toString.call(node)}`);
  };
  visit(value);
  return kinds;
}

class ProbeEnemy {
  constructor() {
    this.hp = 1;
  }
}

const symbolKey = Symbol('hidden');
const withSymbol = { word: 'a' };
withSymbol[symbolKey] = 'hidden';
const withHidden = { word: 'a' };
Object.defineProperty(withHidden, 'secret', {
  value: 1,
  enumerable: false,
  writable: true,
  configurable: true,
});
const withGetter = {
  get word() {
    return 'a';
  },
};

const cases = [
  { name: 'Symbol key', value: withSymbol, want: ['plain-object', 'string', 'symbol-key'] },
  {
    name: 'non-enumerable property',
    value: withHidden,
    want: ['non-enumerable', 'number', 'plain-object', 'string'],
  },
  { name: 'getter property', value: withGetter, want: ['accessor', 'plain-object'] },
  { name: 'RegExp value', value: { re: /word/g }, want: ['other:[object RegExp]', 'plain-object'] },
  {
    name: 'class instance',
    value: { enemy: new ProbeEnemy() },
    want: ['other:[object Object]', 'plain-object'],
  },
];

let failures = 0;
for (const c of cases) {
  const got = [...kindsOf(c.value)].sort();
  const pass = JSON.stringify(got) === JSON.stringify(c.want);
  if (!pass) failures++;
  console.log(`${c.name}: got=[${got.join(', ')}] want=[${c.want.join(', ')}] -> ${pass ? 'PASS' : 'FAIL (gap escapes old visitor)'}`);
}
console.log(`old visitor: ${failures} of ${cases.length} new expectations fail`);
process.exit(failures === 3 ? 0 : 1);
