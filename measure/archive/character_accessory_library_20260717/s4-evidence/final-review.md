# Phase S4 Final Visual Review

Date: 2026-07-19

## Verdict

The implementation and visual-remediation candidate at commit `076199f`
**passes owner review** for the supported rigid-accessory scope. The phase is
not closed because the separate fresh-LLM acceptance criterion remains Not
Assessed.

The selected evidence root is
[`owner-port-attached-final2-20260719T190000Z`](owner-port-attached-final2-20260719T190000Z/summary.json).
It contains five source-free public-MCP reconstructions: Guard, Traveler,
Ranger, Caster, and the owner-required sword-plus-round-shield regression.
All five report `passes: true` with zero issues.

## Owner visual findings

- Guard passes. The spear grip meets the right hand, the kite shield meets the
  left hand and stays upright, and the blue shield face separates from the
  bronze mail.
- Traveler passes. The staff stays hand-attached and the rounded, tapered pack
  stays shoulder-bounded rather than reading as an oversized cuboid.
- Ranger passes. Spear, vest, quiver, and hip pouch remain separately
  identifiable in idle and action.
- Caster passes for a rigid-accessory system. The cape has a tapered rear
  silhouette; its E/W profile remains a thin rigid extrusion and is not cloth
  simulation.
- Sword plus round shield passes. The sword grip meets the right hand, the blade
  points down and outside the body, the blued shield meets the left hand and
  remains upright, and far-side occlusion is physically consistent.

The owner inspected idle/action contact-sheet matrices and ten exact-revision
interactive 3D screenshots loaded through Kimi WebBridge. An independent visual
subagent inspected the same aggregate plus high-risk native frames and reached
the same pass verdict.

## Direction policy

Attachment, grounding, clipping, semantic presence, and framing are validated
in all eight directions. Pixel identity evidence is scored only in the
catalog-declared physically observable directions. A handed far-side view or a
body-self-occluded back/hip feature may be omitted from identity scoring only
when the catalog documents why; the part still must remain attached and valid
in all eight views.

## Non-blocking product debt

- Staff contrast is dark on a dark sprite background.
- Armor and quiver geometry remains intentionally simplified low-poly work.
- The cape is a rigid extrusion with no cloth physics or pose-aware drape.
- Far-side equipment can be naturally occluded by the body.
- The production bundle still emits the existing 837 KB Vite chunk warning.
- The app still lacks skeletal deformation, inverse kinematics, cloth/equipment
  physics, gameplay inventory/combat state, arbitrary uploaded-mesh fitting,
  and verified Unity/Godot runtime import.

## Remaining phase blocker

S4 requires a fresh MCP-capable LLM workflow for every committed reference
loadout. The final risk-disclosed `kimi-for-coding/k3` retry passed the
Forge-only isolation preflight but produced no first event, OpenCode session,
Forge call, or non-Forge call after 624 seconds. It was terminated cleanly and
is preserved as Not Assessed. Visual success does not override this unmet
criterion.
