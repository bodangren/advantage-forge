import type { AssetDocument, SemanticChange } from '../contracts/index.js';

import { canonicalJson } from './canonical.js';

export interface SemanticDocumentDiff {
  readonly affectedIds: readonly string[];
  readonly preservedIds: readonly string[];
  readonly changes: readonly SemanticChange[];
}

interface SemanticCollection {
  readonly path: string;
  readonly values: readonly { readonly id: string }[];
}

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const equivalent = (left: unknown, right: unknown): boolean =>
  left === undefined || right === undefined
    ? left === right
    : canonicalJson(left) === canonicalJson(right);

function collectionKey(value: unknown): string | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ['id', 'partId', 'slot', 'materialId'])
    if (typeof record[key] === 'string') return record[key];
  return undefined;
}

function childPath(path: string, key: string): string {
  return /^[a-zA-Z][a-zA-Z0-9]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`;
}

function change(
  changes: SemanticChange[],
  path: string,
  kind: SemanticChange['kind'],
  semanticId: string,
  before: unknown,
  after: unknown,
): void {
  changes.push({
    path,
    kind,
    semanticId,
    ...(before === undefined ? {} : { before }),
    ...(after === undefined ? {} : { after }),
  });
}

function diffValue(
  changes: SemanticChange[],
  path: string,
  semanticId: string,
  before: unknown,
  after: unknown,
): void {
  if (equivalent(before, after)) return;
  if (before === undefined) {
    change(changes, path, 'added', semanticId, before, after);
    return;
  }
  if (after === undefined) {
    change(changes, path, 'removed', semanticId, before, after);
    return;
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const beforeKeys = before.map(collectionKey);
    const afterKeys = after.map(collectionKey);
    if (
      beforeKeys.every((key) => key !== undefined) &&
      afterKeys.every((key) => key !== undefined)
    ) {
      const beforeByKey = new Map(
        before.map((value, index) => [beforeKeys[index]!, value]),
      );
      const afterByKey = new Map(
        after.map((value, index) => [afterKeys[index]!, value]),
      );
      const keys = [
        ...new Set([...beforeByKey.keys(), ...afterByKey.keys()]),
      ].sort(compareText);
      for (const key of keys)
        diffValue(
          changes,
          `${path}[${key}]`,
          semanticId,
          beforeByKey.get(key),
          afterByKey.get(key),
        );
      return;
    }
    const maximumLength = Math.max(before.length, after.length);
    for (let index = 0; index < maximumLength; index += 1)
      diffValue(
        changes,
        `${path}[${index}]`,
        semanticId,
        before[index],
        after[index],
      );
    return;
  }
  if (
    before !== null &&
    after !== null &&
    typeof before === 'object' &&
    typeof after === 'object' &&
    !Array.isArray(before) &&
    !Array.isArray(after)
  ) {
    const beforeRecord = before as Record<string, unknown>;
    const afterRecord = after as Record<string, unknown>;
    const keys = [
      ...new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]),
    ].sort(compareText);
    for (const key of keys)
      diffValue(
        changes,
        childPath(path, key),
        semanticId,
        beforeRecord[key],
        afterRecord[key],
      );
    return;
  }
  change(changes, path, 'changed', semanticId, before, after);
}

function collections(document: Readonly<AssetDocument>): SemanticCollection[] {
  return [
    { path: '$.materials', values: document.materials },
    { path: '$.templates', values: document.templates },
    { path: '$.assembly.parts', values: document.assembly.parts },
    {
      path: '$.assembly.connections',
      values: document.assembly.connections,
    },
    { path: '$.variants', values: document.variants },
    { path: '$.poses', values: document.poses },
    { path: '$.renderProfiles', values: document.renderProfiles },
  ];
}

/** Compares canonical document fields by stable semantic identity without geometry expansion. */
export function compareSemanticDocuments(
  before: Readonly<AssetDocument>,
  after: Readonly<AssetDocument>,
): SemanticDocumentDiff {
  const affected = new Set<string>();
  const preserved = new Set<string>();
  const changes: SemanticChange[] = [];
  const rootFields: Array<keyof AssetDocument | 'assembly.id'> = [
    'schemaVersion',
    'id',
    'name',
    'unit',
    'seed',
    'kitId',
    'triangleBudget',
    'assembly.id',
    'activeVariantId',
    'activePoseId',
  ];
  for (const field of rootFields) {
    const beforeValue =
      field === 'assembly.id' ? before.assembly.id : before[field];
    const afterValue =
      field === 'assembly.id' ? after.assembly.id : after[field];
    if (equivalent(beforeValue, afterValue)) continue;
    affected.add(after.id);
    diffValue(changes, `$.${field}`, after.id, beforeValue, afterValue);
  }
  if (!affected.has(after.id)) preserved.add(after.id);

  const beforeCollections = collections(before);
  const afterCollections = new Map(
    collections(after).map((collection) => [collection.path, collection]),
  );
  for (const beforeCollection of beforeCollections) {
    const afterCollection = afterCollections.get(beforeCollection.path)!;
    const beforeById = new Map(
      beforeCollection.values.map((value) => [value.id, value]),
    );
    const afterById = new Map(
      afterCollection.values.map((value) => [value.id, value]),
    );
    const ids = [...new Set([...beforeById.keys(), ...afterById.keys()])].sort(
      compareText,
    );
    for (const id of ids) {
      const beforeValue = beforeById.get(id);
      const afterValue = afterById.get(id);
      if (equivalent(beforeValue, afterValue)) {
        preserved.add(id);
        continue;
      }
      affected.add(id);
      diffValue(
        changes,
        `${beforeCollection.path}[${id}]`,
        id,
        beforeValue,
        afterValue,
      );
    }
  }

  return {
    affectedIds: [...affected].sort(compareText),
    preservedIds: [...preserved].sort(compareText),
    changes: changes.sort((left, right) =>
      compareText(`${left.path}:${left.kind}`, `${right.path}:${right.kind}`),
    ),
  };
}
