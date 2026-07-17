import { createHash } from 'node:crypto';

import type { AssetDocument } from '../contracts/index.js';

type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function sortKey(value: JsonValue): string | undefined {
  if (value === null || Array.isArray(value) || typeof value !== 'object')
    return undefined;
  const record = value as Record<string, JsonValue>;
  for (const key of ['id', 'partId', 'slotId', 'slot', 'materialId']) {
    if (typeof record[key] === 'string') return `${key}:${record[key]}`;
  }
  return undefined;
}

function canonicalize(value: unknown): JsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new TypeError('Canonical JSON cannot contain non-finite numbers.');
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    const items = value.map(canonicalize);
    const keys = items.map(sortKey);
    return keys.every((key) => key !== undefined)
      ? [...items].sort((left, right) =>
          (sortKey(left) ?? '').localeCompare(sortKey(right) ?? ''),
        )
      : items;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return Object.fromEntries(
      entries.map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  throw new TypeError(`Canonical JSON does not support ${typeof value}.`);
}

/** Serializes an asset with sorted keys and semantic collections ordered by stable identity. */
export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function canonicalSerialize(document: AssetDocument): string {
  return canonicalJson(document);
}

/** Returns a deterministic revision identity derived only from canonical document bytes. */
export function contentRevisionId(document: AssetDocument): string {
  return `revision.${createHash('sha256').update(canonicalSerialize(document)).digest('hex')}`;
}

/** Recursively freezes parsed documents so revision values cannot be mutated in place. */
export function deepFreeze<T>(value: T): Readonly<T> {
  const freeze = (candidate: unknown): void => {
    if (
      candidate === null ||
      typeof candidate !== 'object' ||
      Object.isFrozen(candidate)
    )
      return;
    for (const child of Object.values(candidate)) freeze(child);
    Object.freeze(candidate);
  };
  freeze(value);
  return value;
}

export function freezeDocument(
  document: AssetDocument,
): Readonly<AssetDocument> {
  return deepFreeze(document);
}
