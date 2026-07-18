import { isAbsolute, relative, resolve, sep } from 'node:path';

function portablePath(value: string, workspaceRoot: string): string {
  if (!isAbsolute(value)) return value;
  const path = relative(workspaceRoot, value);
  if (path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path))
    throw new Error(`Evidence path is outside the workspace: ${value}`);
  return path.split(sep).join('/');
}

function visit(value: unknown, workspaceRoot: string): unknown {
  if (typeof value === 'string') return portablePath(value, workspaceRoot);
  if (Array.isArray(value))
    return value.map((item) => visit(item, workspaceRoot));
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        visit(item, workspaceRoot),
      ]),
    );
  return value;
}

export function portableEvidence<Value>(
  value: Value,
  workspaceRoot: string,
): Value {
  return visit(value, resolve(workspaceRoot)) as Value;
}
