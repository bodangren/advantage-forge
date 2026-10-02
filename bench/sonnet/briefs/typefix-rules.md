# Type-only corrections (class B): shared rules

You remove the compiler errors from the asset sources named in your prompt, without any change
to their meshes or colors. Background: `measure/tracks/asset_quality_20260928/classification-20261002.md`
(class B). The project compiles with `strict`, `noUncheckedIndexedAccess`, and
`exactOptionalPropertyTypes`, so most errors are array reads that can be `undefined`.

## Loop, for each file

1. `node scripts/typecheck-asset.mjs <name>` lists the errors with line numbers.
2. Read the lines around each error, then correct them all in one pass:
   - Index reads in loops and tables: give the table a typed tuple type (`as const`, or
     `const P: [number, number, number][] = ...`), destructure with defaults, or guard
     (`const p = pts[i]; if (!p) continue;`). Keep the same values: a guard must never skip
     an element that exists today.
   - Implicit `any` parameters: add the parameter types.
   - Never use `any`, `@ts-ignore`, `@ts-expect-error`, or `!` in bulk. One `!` on a read that
     is provably in range (for example `arr[0]!` right after a length check) is allowed.
   - Delete dead code that nothing calls, if the error is in it.
3. `node scripts/typecheck-asset.mjs <name>` must print `typecheck ok: 0 errors`.
4. `FORGE_WORKERS=1 node scripts/mesh-same.mjs <name>` must print `SAME`: it builds the committed
   and the working source under temporary names and compares bounds, triangles per body, and the
   GLB data. If it prints `DIFF`, find the edit that changed a value and correct it differently.
   If an error cannot be corrected without a visible change (the class A kind: an argument the
   runtime ignores today), restore that line, leave that error, and name it in the report.

## Limits

- Edit only the files named in your prompt (`assets/<name>.ts`). Never edit `src/` or a part
  module. Never commit or stage. Never run `forge all`, `forge render`, or a build into
  `out/<name>/`; `mesh-same.mjs` is the only build you run.
- No images are needed. Budget: about 6 tool calls per file.

## Report

One line per file: the error count before and after, and the `mesh-same` result. Then any error
you left and why.
