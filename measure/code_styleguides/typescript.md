# TypeScript Style Guide

## Language

- Enable strict TypeScript and keep runtime validation at every external boundary.
- Use `const` by default and `let` only for reassignment. Never use `var`.
- Use ES modules and named exports. Do not use TypeScript namespaces or default exports.
- Do not use `any`; narrow `unknown` through explicit guards or schemas.
- Avoid type assertions and non-null assertions. If unavoidable, document the invariant immediately beside the assertion.
- Use single quotes, explicit semicolons, `===`, and `!==`.
- Prefer discriminated unions for versioned document nodes and tool results.
- Use readonly data at contracts and compilation boundaries; avoid mutating canonical documents in place.

## Naming

- `UpperCamelCase` for types, interfaces, classes, and enums.
- `lowerCamelCase` for values, functions, methods, parameters, and properties.
- `CONSTANT_CASE` for module-level constants.
- Stable document IDs use lowercase dotted semantic paths or documented snake-case identifiers; never array-position identity.
- Units must appear in names where ambiguity is possible, such as `heightMeters` or `paddingPixels`.

## Module Boundaries

- Public module APIs are exported from a single module entry point.
- Internal files are not imported across module boundaries.
- Contracts contain no Three.js, filesystem, MCP, or browser types.
- Geometry and assembly modules contain no UI or transport behavior.
- Adapters translate external payloads into domain contracts and return structured results.
- New cross-boundary dependencies require an architecture decision in the active Measure track.

## Functions and Errors

- Prefer small pure functions for document evaluation and geometry calculations.
- Use typed result objects for expected validation failures; reserve exceptions for unexpected program faults.
- Error results include a stable rule or error code, semantic document path, expected value, actual value, and correction guidance where possible.
- Seeded behavior receives the seed explicitly; never use ambient randomness in a build.

## Documentation and Tests

- Public schemas, tools, generators, and validators require concise JSDoc that explains invariants and units.
- Comments explain why an invariant exists, not what the syntax does.
- Every contract and public tool requires success, rejection, and compatibility tests.
- Geometry tests assert structural invariants and measurements; render tests assert delivery-resolution outcomes.
- Follow red-green-refactor and keep new-code coverage above 80%.

Source baseline: [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html), adapted for the project domain.
