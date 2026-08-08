export const PUBLIC_TOOL_NAMES = [
  'list_kits',
  'inspect_capabilities',
  'inspect_template',
  'search_accessories',
  'inspect_asset',
  'compare_revisions',
  'create_asset',
  'apply_accessory_operation',
  'apply_operations',
  'connect_parts',
  'set_pose',
  'validate_asset',
  'get_interchange_manifest',
  'get_interchange_artifact_chunk',
  'render_preview',
  'export_asset',
] as const;

export type PublicToolName = (typeof PUBLIC_TOOL_NAMES)[number];

export interface PublicToolDefinition {
  readonly name: PublicToolName;
  readonly description: string;
  readonly mutates: boolean;
}

export const PUBLIC_TOOL_CATALOG: readonly PublicToolDefinition[] = [
  {
    name: 'list_kits',
    description:
      'List bounded kits, references, and novel archetypes, with optional registered-grammar brief preflight.',
    mutates: false,
  },
  {
    name: 'inspect_capabilities',
    description:
      'Preflight supported, partial, unsupported, and not-assessed product capabilities with evidence and guidance.',
    mutates: false,
  },
  {
    name: 'inspect_template',
    description:
      'Inspect semantic role, parameters, material slots, and named ports.',
    mutates: false,
  },
  {
    name: 'search_accessories',
    description:
      'Discover bounded compatible accessories with kit-owned placement and visual guidance.',
    mutates: false,
  },
  {
    name: 'inspect_asset',
    description:
      'Inspect overview or complete current authoring state through deterministic bounded sections.',
    mutates: false,
  },
  {
    name: 'compare_revisions',
    description:
      'Compare immutable revisions as bounded field changes, exact affected and preserved IDs, origin, completeness, and required-role deltas.',
    mutates: false,
  },
  {
    name: 'create_asset',
    description:
      'Create a revision from a committed reference or initialize a bounded novel identity skeleton.',
    mutates: true,
  },
  {
    name: 'apply_accessory_operation',
    description:
      'Dry-run or apply one closed equip, replace, swap-hand, recolor, or unequip task.',
    mutates: true,
  },
  {
    name: 'apply_operations',
    description:
      'Dry-run or apply closed patches, task-level novel composition, and confirmed immutable current-pointer restoration.',
    mutates: true,
  },
  {
    name: 'connect_parts',
    description: 'Connect two compatible named part ports.',
    mutates: true,
  },
  {
    name: 'set_pose',
    description: 'Select a declared rigid pose by stable ID.',
    mutates: true,
  },
  {
    name: 'validate_asset',
    description:
      'Validate contracts, triangle budget, and a semantic scene summary.',
    mutates: false,
  },
  {
    name: 'get_interchange_manifest',
    description:
      'Retrieve a canonical digest-pinned interchange manifest for one exact immutable revision.',
    mutates: false,
  },
  {
    name: 'get_interchange_artifact_chunk',
    description:
      'Retrieve a bounded digest-bound byte chunk for one manifest-allowlisted source PNG, GLB, or evidence record.',
    mutates: false,
  },
  {
    name: 'render_preview',
    description:
      'Render bounded directional sprite previews for one exact immutable revision.',
    mutates: false,
  },
  {
    name: 'export_asset',
    description: 'Export one exact immutable revision for registry delivery.',
    mutates: false,
  },
];
