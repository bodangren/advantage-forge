# TypeScript guide

Preserve the existing TypeScript and ESM conventions.

- Use strict types at public boundaries.
- Validate external data with the existing contract schemas.
- Preserve tuple types for vectors, colors, and poses.
- Use `.js` suffixes for local ESM imports where the repository requires them.
- Keep game cores independent of rendering code.
- Export shared interfaces through their existing module boundaries.
- Add focused behavior tests for code changes.
- Use the repository Prettier configuration for modified code.
- Keep explanatory comments within the project prose rules.

Asset definitions need visual review in addition to static checks.
Type assertions must not hide invalid color values, unsupported options, or missing data.
