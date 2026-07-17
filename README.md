# Fantasy Asset Forge

Fantasy Asset Forge is an LLM-first, purpose-built system for creating stylized low-poly fantasy RPG assets from reusable parametric parts. Its canonical source is a semantic asset document; deterministic builds produce inspectable 3D scenes, GLB assets, and fixed-view transparent sprites without Blender or another general-purpose DCC backend.

The MVP contains one controlled rustic-fantasy kit, four reference assets, twelve bounded shape generators, ten semantic LLM tools, an inspector, transparent eight-direction sprites, and GLB export. It intentionally is not a general modeling environment.

## Start locally

```bash
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173`. The inspector provides interactive 3D, an enlarged contact sheet, actual 128px frames, semantic scene evidence, and pixel-validation metrics.

## Build canonical references

```bash
pnpm reference:build
```

This runs the complete public-handler workflow for the adventurer, crate, tree, and cottage. Canonical JSON is written under `references/`; revision-associated PNG, contact-sheet, manifest, and GLB files are written under `artifacts/reference/`.

## Connect an MCP client

Keep the inspector server running on port 4173, then configure the MCP client to launch:

```json
{
  "command": "pnpm",
  "args": ["mcp"],
  "cwd": "/home/daniel-bo/Desktop/fantasy-asset-forge",
  "env": {
    "FORGE_INSPECTOR_URL": "http://127.0.0.1:4173"
  }
}
```

The public surface is deliberately small: `list_kits`, `inspect_template`, `inspect_asset`, `create_asset`, `apply_operations`, `connect_parts`, `set_pose`, `validate_asset`, `render_preview`, and `export_asset`.

## Verify

```bash
pnpm check
pnpm test:coverage
pnpm build
pnpm test:browser
pnpm reference:build
```

See the generated contracts in `measure/generated/` and the active evidence dossier in `measure/tracks/fantasy_asset_mvp_20260717/`.

## Scope

The canonical value is the semantic document and reusable part grammar. Blender, arbitrary mesh editing, code execution, shell access, unrestricted filesystems, network retrieval, general animation, physics, texture painting, and additional art directions are excluded from the MVP.
