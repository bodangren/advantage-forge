import type { z } from 'zod';

import {
  AssetDocumentSchema,
  type AssetDocument,
  type ValidationIssue,
} from '../contracts/index.js';
import { freezeDocument } from './canonical.js';

export type DocumentParseResult =
  | { readonly ok: true; readonly document: Readonly<AssetDocument> }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

function duplicateIssues(document: AssetDocument): ValidationIssue[] {
  const candidates: { id: string; path: string }[] = [
    { id: document.id, path: '$.id' },
    { id: document.assembly.id, path: '$.assembly.id' },
    ...document.materials.map(({ id }, index) => ({
      id,
      path: `$.materials[${index}].id`,
    })),
    ...document.templates.map(({ id }, index) => ({
      id,
      path: `$.templates[${index}].id`,
    })),
    ...document.assembly.parts.map(({ id }, index) => ({
      id,
      path: `$.assembly.parts[${index}].id`,
    })),
    ...document.assembly.connections.map(({ id }, index) => ({
      id,
      path: `$.assembly.connections[${index}].id`,
    })),
    ...document.variants.map(({ id }, index) => ({
      id,
      path: `$.variants[${index}].id`,
    })),
    ...document.poses.map(({ id }, index) => ({
      id,
      path: `$.poses[${index}].id`,
    })),
    ...document.renderProfiles.map(({ id }, index) => ({
      id,
      path: `$.renderProfiles[${index}].id`,
    })),
  ];
  const seen = new Set<string>();
  const globalIssues = candidates.flatMap(({ id, path }) => {
    if (!seen.has(id)) {
      seen.add(id);
      return [];
    }
    return [
      {
        code: 'DUPLICATE_ID',
        severity: 'error' as const,
        path,
        message: `Duplicate semantic ID: ${id}`,
        actual: id,
        expected: 'a unique semantic ID',
        guidance: issueGuidance('DUPLICATE_ID'),
      },
    ];
  });
  const portIssues = document.templates.flatMap((template, templateIndex) => {
    const templatePorts = new Set<string>();
    return template.ports.flatMap(({ id }, portIndex) => {
      if (!templatePorts.has(id)) {
        templatePorts.add(id);
        return [];
      }
      return [
        {
          code: 'DUPLICATE_ID',
          severity: 'error' as const,
          path: `$.templates[${templateIndex}].ports[${portIndex}].id`,
          message: `Duplicate semantic ID within template ${template.id}: ${id}`,
          actual: id,
          expected: 'a unique port ID within its template',
          guidance: issueGuidance('DUPLICATE_ID'),
        },
      ];
    });
  });
  return [...globalIssues, ...portIssues];
}

function semanticPath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((result, segment) => {
    if (typeof segment === 'number') return `${result}[${segment}]`;
    const key = String(segment);
    return /^[A-Za-z_$][\w$]*$/.test(key)
      ? `${result}.${key}`
      : `${result}[${JSON.stringify(key)}]`;
  }, '$');
}

function actualAt(input: unknown, path: readonly PropertyKey[]): unknown {
  let current = input;
  for (const segment of path) {
    if (current === null || typeof current !== 'object') return current;
    current = (current as Record<PropertyKey, unknown>)[segment];
  }
  return current;
}

type DocumentErrorCode =
  | 'UNKNOWN_FIELD'
  | 'INVALID_UNIT'
  | 'DUPLICATE_ID'
  | 'UNSUPPORTED_NODE_KIND'
  | 'UNSUPPORTED_VERSION'
  | 'INVALID_VALUE'
  | 'NON_FINITE_VALUE'
  | 'INVALID_PATH'
  | 'REVISION_CONFLICT'
  | 'NOT_FOUND'
  | 'PATCH_REJECTED'
  | 'REPOSITORY_ERROR';

function classify(issue: z.core.$ZodIssue, actual: unknown): DocumentErrorCode {
  if (issue.code === 'unrecognized_keys') return 'UNKNOWN_FIELD';
  if (
    issue.code === 'custom' &&
    issue.message.startsWith('Duplicate semantic ID:')
  )
    return 'DUPLICATE_ID';
  const last = issue.path.at(-1);
  if (last === 'schemaVersion') return 'UNSUPPORTED_VERSION';
  if (last === 'units' || last === 'unit') return 'INVALID_UNIT';
  if (last === 'kind' && typeof actual === 'string')
    return 'UNSUPPORTED_NODE_KIND';
  if (typeof actual === 'number' && !Number.isFinite(actual))
    return 'NON_FINITE_VALUE';
  return 'INVALID_VALUE';
}

function issueGuidance(code: DocumentErrorCode): string {
  const guidance: Record<DocumentErrorCode, string> = {
    UNKNOWN_FIELD:
      'Remove the unknown field or use a supported schema property.',
    INVALID_UNIT: 'Use the world unit required by schema version 1.',
    DUPLICATE_ID: 'Assign a unique stable semantic ID.',
    UNSUPPORTED_NODE_KIND: 'Use one of the documented semantic node kinds.',
    UNSUPPORTED_VERSION:
      'Migrate the document to the supported schema version.',
    INVALID_VALUE:
      'Replace the value with one satisfying the documented field contract.',
    NON_FINITE_VALUE: 'Use a finite JSON number.',
    INVALID_PATH: 'Use a stable semantic target ID supported by the operation.',
    REVISION_CONFLICT:
      'Reload the current revision and reapply the localized operation.',
    NOT_FOUND: 'Inspect the active document and use an existing semantic ID.',
    PATCH_REJECTED: 'Correct the proposed semantic operation before retrying.',
    REPOSITORY_ERROR: 'Verify the active workspace and repository permissions.',
  };
  return guidance[code];
}

function mapZodIssue(
  issue: z.core.$ZodIssue,
  input: unknown,
): ValidationIssue[] {
  if (issue.code === 'unrecognized_keys') {
    return issue.keys.map((key) => ({
      code: 'UNKNOWN_FIELD',
      severity: 'error',
      path: semanticPath([...issue.path, key]),
      message: `Unknown field: ${key}`,
      actual: actualAt(input, [...issue.path, key]),
      expected: 'a documented schema field',
      guidance: issueGuidance('UNKNOWN_FIELD'),
    }));
  }
  const actual = actualAt(input, issue.path);
  const code = classify(issue, actual);
  return [
    {
      code,
      severity: 'error',
      path: semanticPath(issue.path),
      message: issue.message,
      actual,
      expected: 'the declared schema constraint',
      guidance: issueGuidance(code),
    },
  ];
}

/** Validates untrusted JSON-compatible input before exposing an immutable domain value. */
export function parseAssetDocument(input: unknown): DocumentParseResult {
  const result = AssetDocumentSchema.safeParse(input);
  if (result.success) {
    const duplicates = duplicateIssues(result.data);
    return duplicates.length === 0
      ? { ok: true, document: freezeDocument(result.data) }
      : { ok: false, issues: duplicates };
  }
  return {
    ok: false,
    issues: result.error.issues.flatMap((issue) => mapZodIssue(issue, input)),
  };
}

/** Parses JSON text and returns the same structured failures as object validation. */
export function parseAssetDocumentJson(json: string): DocumentParseResult {
  try {
    return parseAssetDocument(JSON.parse(json) as unknown);
  } catch (error) {
    return {
      ok: false,
      issues: [
        {
          code: 'INVALID_VALUE',
          severity: 'error',
          path: '$',
          message:
            error instanceof Error ? error.message : 'Invalid JSON text.',
          expected: 'valid JSON',
          actual: json,
          guidance: 'Correct the JSON syntax before retrying.',
        },
      ],
    };
  }
}
