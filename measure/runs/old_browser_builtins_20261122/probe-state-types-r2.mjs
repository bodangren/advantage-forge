// Temporary probe for T5r2. Not committed. Copies kindsOf from
// tests/old-browser/deep-copy.test.ts (state types case) and the ALLOWED set.
// It shows whether that state-type pin catches a new value kind in game state.

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

class Enemy {
  constructor() {
    this.hp = 1;
  }
}

const symbolKey = Symbol('hidden');
const withSymbolKey = { word: 'a' };
withSymbolKey[symbolKey] = 'hidden';

const fixtures = [
  { name: 'RegExp value', state: { re: /word/g } },
  { name: 'Symbol-keyed own property', state: withSymbolKey },
  { name: 'class instance', state: { enemy: new Enemy() } },
  { name: 'plain-data control', state: { word: 'a', done: true } },
];

for (const fixture of fixtures) {
  const kinds = [...kindsOf(fixture.state)].sort();
  const extra = kinds.filter((kind) => !ALLOWED.has(kind));
  const caught = extra.length > 0;
  console.log(
    `${fixture.name}: kinds=[${kinds.join(', ')}] -> ${
      caught ? `CAUGHT (${extra.join(', ')})` : 'ESCAPES THE TEST'
    }`,
  );
}
