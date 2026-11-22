// Depth divergence characterization for deepCopy vs native structuredClone.
import { deepCopy } from './probe-copy.mjs';

const build = (depth) => {
  const root = {};
  let node = root;
  for (let i = 0; i < depth; i++) {
    node.next = {};
    node = node.next;
  }
  return root;
};
for (const depth of [1000, 2000, 4000, 8000, 16000, 32000]) {
  let native = 'ok';
  let mine = 'ok';
  try {
    structuredClone(build(depth));
  } catch (error) {
    native = error.name;
  }
  try {
    deepCopy(build(depth));
  } catch (error) {
    mine = error.name;
  }
  console.log(`DEPTH ${depth}: native=${native} deepCopy=${mine}`);
}
