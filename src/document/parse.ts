import type { z } from 'zod';

import {
  AssetDocumentSchema,
  type AssetDocument,
  type ValidationIssue,
  type ValidationErrorCode,
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
  const globalIssues: ValidationIssue[] = candidates.flatMap(({ id, path }) => {
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
  const portIssues: ValidationIssue[] = document.templates.flatMap(
    (template, templateIndex) => {
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
    },
  );
  return [...globalIssues, ...portIssues];
}

function referenceIssues(document: AssetDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const materials = new Set(document.materials.map(({ id }) => id));
  const templates = new Map(
    document.templates.map((template) => [template.id, template]),
  );
  const partIds = new Set(document.assembly.parts.map(({ id }) => id));
  for (const [partIndex, part] of document.assembly.parts.entries()) {
    const template = templates.get(part.templateId);
    if (template === undefined) {
      issues.push({
        code: 'UNKNOWN_REFERENCE',
        severity: 'error',
        path: `$.assembly.parts[${partIndex}].templateId`,
        message: `Template ${part.templateId} does not exist.`,
        actual: part.templateId,
        expected: 'an existing template ID',
        guidance:
          'Inspect the kit template catalog and use a declared template.',
      });
      continue;
    }
    for (const [bindingIndex, binding] of part.materialBindings.entries()) {
      if (!template.materialSlots.includes(binding.slot))
        issues.push({
          code: 'INVALID_MATERIAL_SLOT',
          severity: 'error',
          path: `$.assembly.parts[${partIndex}].materialBindings[${bindingIndex}].slot`,
          message: `Slot ${binding.slot} is not declared by ${template.id}.`,
          actual: binding.slot,
          expected: template.materialSlots,
          guidance: 'Bind only material slots declared by the part template.',
        });
      if (!materials.has(binding.materialId))
        issues.push({
          code: 'UNKNOWN_REFERENCE',
          severity: 'error',
          path: `$.assembly.parts[${partIndex}].materialBindings[${bindingIndex}].materialId`,
          message: `Material ${binding.materialId} does not exist.`,
          actual: binding.materialId,
          expected: 'an existing palette material ID',
          guidance: 'Use a material declared by the active asset palette.',
        });
    }
  }
  const checkOverrides = (
    kind: 'variants' | 'poses',
    values: readonly {
      readonly overrides: readonly { readonly partId: string }[];
    }[],
  ) => {
    for (const [valueIndex, value] of values.entries())
      for (const [overrideIndex, override] of value.overrides.entries())
        if (!partIds.has(override.partId))
          issues.push({
            code: 'UNKNOWN_REFERENCE',
            severity: 'error',
            path: `$.${kind}[${valueIndex}].overrides[${overrideIndex}].partId`,
            message: `Part ${override.partId} does not exist.`,
            actual: override.partId,
            expected: 'an existing assembly part ID',
            guidance: 'Target a stable part ID declared by the assembly.',
          });
  };
  checkOverrides('variants', document.variants);
  checkOverrides('poses', document.poses);
  if (
    document.activeVariantId !== undefined &&
    !document.variants.some(({ id }) => id === document.activeVariantId)
  )
    issues.push({
      code: 'UNKNOWN_REFERENCE',
      severity: 'error',
      path: '$.activeVariantId',
      message: `Variant ${document.activeVariantId} does not exist.`,
      actual: document.activeVariantId,
      expected: 'a declared variant ID',
      guidance: 'Select a variant declared by this document.',
    });
  if (
    document.activePoseId !== undefined &&
    !document.poses.some(({ id }) => id === document.activePoseId)
  )
    issues.push({
      code: 'UNKNOWN_REFERENCE',
      severity: 'error',
      path: '$.activePoseId',
      message: `Pose ${document.activePoseId} does not exist.`,
      actual: document.activePoseId,
      expected: 'a declared pose ID',
      guidance: 'Select a pose declared by this document.',
    });
  return issues;
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

type DocumentErrorCode = ValidationErrorCode;

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
    DRY_RUN_REQUIRED:
      'Dry-run the exact proposed operation and confirm its deterministic plan before applying it.',
    UNKNOWN_REFERENCE: 'Use an existing semantic ID from the active document.',
    INVALID_MATERIAL_SLOT: 'Use a slot declared by the selected template.',
    ALREADY_EXISTS:
      'Inspect and revise the existing asset instead of recreating it.',
    TRIANGLE_BUDGET_EXCEEDED:
      'Reduce evaluated geometry or raise the explicit asset triangle budget.',
    INVALID_ASSEMBLY:
      'Correct the reported assembly, port, variant, or pose issue.',
    INCOMPLETE_ASSET:
      'Complete every required novel-identity stage before validation or artifact production.',
    SERVICE_UNAVAILABLE: 'Start the configured local service and retry.',
    RESPONSE_TOO_LARGE: 'Request a narrower semantic summary.',
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
    const issues = [
      ...duplicateIssues(result.data),
      ...referenceIssues(result.data),
    ];
    return issues.length === 0
      ? { ok: true, document: freezeDocument(result.data) }
      : { ok: false, issues };
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

/**
 * Establishes the schema-version compatibility boundary.
 * V1 is already current and is validated without mutation. No other version is
 * guessed or silently upgraded before an explicit future migration is added.
 */
export function migrateAssetDocumentToCurrent(
  input: unknown,
): DocumentParseResult {
  const version =
    input !== null && typeof input === 'object'
      ? (input as Record<string, unknown>)['schemaVersion']
      : undefined;
  if (version === '1.0.0') return parseAssetDocument(input);
  return {
    ok: false,
    issues: [
      {
        code: 'UNSUPPORTED_VERSION',
        severity: 'error',
        path: '$.schemaVersion',
        message: `No explicit migration exists from ${String(version)} to 1.0.0.`,
        actual: version,
        expected: '1.0.0',
        guidance:
          'Do not guess a migration. Add and test an explicit version-to-version transform first.',
      },
    ],
  };
}
