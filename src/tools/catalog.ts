export const PUBLIC_TOOL_NAMES = [
  'list_kits',
  'inspect_capabilities',
  'inspect_template',
  'inspect_asset',
  'compare_revisions',
  'create_asset',
  'apply_operations',
  'connect_parts',
  'set_pose',
  'validate_asset',
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
    description: 'List bounded fantasy kits and reference assets.',
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
    name: 'inspect_asset',
    description:
      'Inspect overview or complete current authoring state through deterministic bounded sections.',
    mutates: false,
  },
  {
    name: 'compare_revisions',
    description:
      'Compare immutable revisions as bounded field changes plus affected and preserved semantic IDs.',
    mutates: false,
  },
  {
    name: 'create_asset',
    description:
      'Create a revision from a committed fantasy reference document.',
    mutates: true,
  },
  {
    name: 'apply_operations',
    description:
      'Apply one or more closed semantic operations with revision preconditions.',
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
    name: 'render_preview',
    description:
      'Render bounded directional sprite previews for the current revision.',
    mutates: false,
  },
  {
    name: 'export_asset',
    description: 'Export the current revision as a workspace-contained GLB.',
    mutates: false,
  },
];
