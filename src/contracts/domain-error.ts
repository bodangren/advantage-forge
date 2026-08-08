import type { z } from 'zod';

export type ForgeDomainErrorPath = readonly (string | number)[];

export type ForgeDomainErrorCode =
  | 'SCHEMA_INVALID'
  | 'BUDGET_EXCEEDED'
  | 'IDENTITY_MISMATCH'
  | 'BINDING_MISMATCH'
  | 'COMPATIBILITY_MISMATCH'
  | 'PROVENANCE_MISMATCH'
  | 'MIRROR_UNAVAILABLE'
  | 'STALE_REVISION'
  | 'REVISION_NOT_FOUND'
  | 'INVALID_CURSOR'
  | 'STORAGE_FAILURE';

export class ForgeDomainError<
  Code extends string = ForgeDomainErrorCode,
> extends Error {
  readonly code: Code;
  readonly path: ForgeDomainErrorPath;
  readonly #suppressedErrors: unknown[] = [];

  constructor(
    code: Code,
    path: ForgeDomainErrorPath,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ForgeDomainError';
    this.code = code;
    this.path = Object.freeze([...path]);
  }

  /** Secondary cleanup failures retained without replacing the primary error. */
  get suppressed(): readonly unknown[] {
    return Object.freeze([...this.#suppressedErrors]);
  }

  /** @internal Used by crash-safe cleanup boundaries. */
  retainSuppressed(error: unknown): void {
    this.#suppressedErrors.push(error);
  }
}

export function schemaDomainError(
  error: z.ZodError,
  path: ForgeDomainErrorPath = [],
): ForgeDomainError<'SCHEMA_INVALID' | 'BUDGET_EXCEEDED'> {
  const issue =
    error.issues.find(
      (candidate) =>
        candidate.code === 'custom' &&
        candidate.params?.['domainCode'] === 'BUDGET_EXCEEDED',
    ) ??
    error.issues.find((candidate) => candidate.code === 'too_big') ??
    error.issues[0];
  const customDomainCode =
    issue?.code === 'custom' &&
    issue.params?.['domainCode'] === 'BUDGET_EXCEEDED'
      ? 'BUDGET_EXCEEDED'
      : undefined;
  const code =
    issue?.code === 'too_big' || customDomainCode === 'BUDGET_EXCEEDED'
      ? 'BUDGET_EXCEEDED'
      : 'SCHEMA_INVALID';
  const issuePath = (issue?.path ?? []).map((segment) =>
    typeof segment === 'symbol'
      ? (segment.description ?? String(segment))
      : segment,
  );
  return new ForgeDomainError(
    code,
    [...path, ...issuePath],
    issue?.message ?? 'Value does not satisfy the domain schema.',
    { cause: error },
  );
}

export function parseDomainValue<Schema extends z.ZodType>(
  schema: Schema,
  value: unknown,
  path: ForgeDomainErrorPath = [],
): z.output<Schema> {
  const result = schema.safeParse(value);
  if (!result.success) throw schemaDomainError(result.error, path);
  return result.data;
}
