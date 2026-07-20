# S3 Public Equipment Workflow Review

Date: 2026-07-19

## Outcome

The public MCP workflow successfully discovered, inspected, dry-ran, applied,
re-inspected, compared, validated, rendered, and exported the corrected rustic
sword and round shield without caller-authored transforms, ports, part IDs, or
connection IDs.

- Asset: `adventurer.rustic`
- Baseline:
  `revision.8570c521ecc1ab5227b684d7b0d825b8489f94eafc2673c4f452e97c77f5ff94`
- Final:
  `revision.2240845f9931b26a721d75c02ee7a156e4d2bb44b0d6aa9efa8d6de2dd752ac6`
- Final sword: `accessory.main-hand` / `equipment.sword` / `main-hand`
- Final shield: `accessory.off-hand` / `equipment.shield` / `off-hand`

The final public revision uses the kit-owned sword position
`[0.14, -0.04, 0]` and shield rotation
`[0.7071067811865476, 0, 0, 0.7071067811865476]`. These values came back from
public discovery and comparison responses; the MCP client did not construct
them.

## Public call sequence

The isolated stdio client used only these public calls:

1. `inspect_capabilities`
2. `list_kits`
3. `create_asset`
4. `inspect_asset` and `inspect_template`
5. dry-run/apply `unequip` for the response-derived occupied hand parts
6. `search_accessories` for weapon/main-hand and shield/off-hand
7. dry-run/apply each returned candidate's complete `exampleOperation`
8. `inspect_asset`, `compare_revisions`, and `validate_asset`
9. `render_preview` and `export_asset`

The complete request/response ledger is
[public-mcp-transcript.json](public-mcp-transcript.json).

## Semantic and artifact evidence

- Validation: valid; 1,440 triangles of a 2,000-triangle budget, leaving 560.
- Locality: the comparison replaces only the legacy sword/shield parts and
  connections with the task-workflow-owned hand-slot parts and connections.
- All unrelated anatomy, materials, templates, poses, variants, and render
  profile IDs are reported as preserved.
- The bundled artifact verifier passed all eight 128x128 PNGs, the 512x292
  contact sheet, and the 58,604-byte GLB.
- Contact-sheet SHA-256:
  `6e47e078894f52c7130ec79d8db95e30d4bfa8cc915765a9c49bd8efa5704edd`.
- GLB SHA-256:
  `a1cba06afe7a62aad7423fc11dd6edf26a50ae2100e13739b82b3a1541435963`.
- The pinned Three.js 0.185.1 importer audit passed: Y-up, meter units, matching
  bounds, all 20 semantic nodes, all seven materials, no transform mismatches,
  and no unsupported content.

Durable outputs:

- [contact sheet](contact-sheet.png)
- [native frames](native-frames/)
- [render manifest](render-manifest.json)
- [GLB manifest](glb-manifest.json)
- [GLB](adventurer.rustic.glb)

## Native-resolution visual review

All eight individual 128x128 frames were inspected at native resolution, in
addition to the labeled contact sheet.

- The sword grip meets the right hand; its blade points downward, extends below
  the torso, and stays outside the leg/body silhouette in the readable views.
- The shield is upright and its broad face is vertical. It reads as a defensive
  surface in N, NE, S, SW, and NW instead of as a horizontal platter.
- E and W correctly show narrow edge-on equipment silhouettes; neither item is
  mistaken for a broad horizontal surface.
- No frame clips an image edge. All frames share ground pixel Y=121 with zero
  ground-anchor deviation.

## Honest limitations

- The app does not yet expose a public way to reopen an arbitrary persisted
  revision in the long-lived interactive 3D inspector. `render_preview` loads
  the exact revision into a transient headless inspector, so exact-revision
  contact-sheet and native-frame review is proven, but a revision-bound
  interactive 3D review remains unavailable.
- The current render metrics prove the reference torso feature. Accessory
  required-feature pixel evidence for every direction belongs to S4 and is not
  claimed complete here.
- Equipment is rigid. Cloth/gear physics, gameplay inventory state, arbitrary
  uploaded meshes, two-occupied-hand exchange, skeletal deformation, temporal
  animation, and runtime atlases remain unsupported.
- Godot, Unity, and gameplay-runtime import remain not assessed; the successful
  Three.js importer audit is not evidence for those engines.

S3 verdict: the public equipment workflow and corrected render pass. Overall
visual acceptance remains partial under the strict three-surface workflow until
the exact-revision interactive-view gap is implemented or explicitly accepted.
