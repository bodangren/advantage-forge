import { describe, expect, it } from 'vitest';

import {
  canonicalJson,
  canonicalSerialize,
  contentRevisionId,
} from '../../src/document/index.js';
import { assetFixture } from './fixture.js';

describe('canonical document serialization', () => {
  it('sorts object keys and semantic collections deterministically', () => {
    const left = assetFixture();
    const right = structuredClone(left);
    right.templates.reverse();
    right.assembly.parts.reverse();
    expect(canonicalSerialize(right)).toBe(canonicalSerialize(left));
    expect(contentRevisionId(right)).toBe(contentRevisionId(left));
  });

  it('normalizes negative zero and rejects non-finite numbers', () => {
    expect(canonicalJson({ z: -0, a: 1 })).toBe('{\n  "a": 1,\n  "z": 0\n}\n');
    expect(() => canonicalJson({ value: Number.NaN })).toThrow(/non-finite/);
  });
});
