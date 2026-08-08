import {
  CapabilityFactSchema,
  CapabilityReportSchema,
  type CapabilityEvidence,
  type CapabilityFact,
  type CapabilityReport,
} from '../contracts/index.js';
import {
  NOVEL_ASSET_ARCHETYPES,
  referenceDocuments,
  rusticAccessoryCatalog,
  rusticTemplates,
} from '../fantasy-kit/index.js';
import { MVP_RENDER_PROFILE } from '../render/index.js';

import { PUBLIC_TOOL_NAMES, type PublicToolName } from './catalog.js';

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

function tools(...names: PublicToolName[]): string[] {
  const registered = new Set(PUBLIC_TOOL_NAMES);
  return names.filter((name) => registered.has(name)).sort(compareText);
}

function evidence(
  overrides: Partial<CapabilityEvidence> = {},
): CapabilityEvidence {
  return {
    publicTools: [],
    referenceAssetIds: [],
    archetypeIds: [],
    templateIds: [],
    renderProfileIds: [],
    formats: [],
    ...overrides,
  };
}

const referenceFacts = Object.entries(referenceDocuments).map(
  ([reference, document]) =>
    CapabilityFactSchema.parse({
      id: `asset.reference.${reference}`,
      category: 'asset',
      status: 'supported',
      summary: `Create and revise the committed ${reference} reference through public semantic tools.`,
      evidence: evidence({
        publicTools: tools(
          'create_asset',
          'inspect_asset',
          'apply_operations',
          'validate_asset',
          'render_preview',
          'export_asset',
        ),
        referenceAssetIds: [document.id],
        templateIds: [
          ...new Set(
            document.assembly.parts.map(({ templateId }) => templateId),
          ),
        ].sort(compareText),
        renderProfileIds: document.renderProfiles
          .map(({ id }) => id)
          .sort(compareText),
        formats: ['glb', 'png'],
      }),
    }),
);

const templateIds = new Set(rusticTemplates.map(({ id }) => id));
const additionalAccessoryTemplateIds = rusticAccessoryCatalog
  .map(({ template }) => template.id)
  .sort(compareText);
const accessoryFact = (
  id: 'sword' | 'shield',
  templateId: 'equipment.sword' | 'equipment.shield',
): CapabilityFact =>
  CapabilityFactSchema.parse({
    id: `accessory.${id}`,
    category: 'accessory',
    status: templateIds.has(templateId) ? 'supported' : 'unsupported',
    summary: `The rustic-human kit declares a static ${id} part with semantic ports and materials.`,
    ...(templateIds.has(templateId)
      ? {}
      : {
          guidance: `The ${id} template is not registered; do not attempt this accessory.`,
        }),
    evidence: evidence({
      publicTools: tools(
        'create_asset',
        'inspect_template',
        'search_accessories',
        'inspect_asset',
        'apply_accessory_operation',
      ),
      referenceAssetIds: [referenceDocuments.adventurer.id],
      templateIds: templateIds.has(templateId) ? [templateId] : [],
    }),
  });

const declaredFacts: CapabilityFact[] = [
  accessoryFact('sword', 'equipment.sword'),
  accessoryFact('shield', 'equipment.shield'),
  CapabilityFactSchema.parse({
    id: 'accessory.library',
    category: 'accessory',
    status: 'supported',
    summary:
      'Discover seventeen compatible static accessories with kit-owned usage and perform revision-safe equip, replace, empty-hand swap, recolor, and unequip tasks without caller-authored transforms.',
    evidence: evidence({
      publicTools: tools(
        'search_accessories',
        'inspect_template',
        'inspect_asset',
        'apply_accessory_operation',
        'compare_revisions',
      ),
      templateIds: additionalAccessoryTemplateIds,
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'operation.inspect',
    category: 'operation',
    status: 'supported',
    summary:
      'Inspect current authored and effective state through bounded semantic sections and compare immutable revisions.',
    evidence: evidence({
      publicTools: tools('inspect_asset', 'compare_revisions'),
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'operation.localized_revision',
    category: 'operation',
    status: 'supported',
    summary:
      'Apply closed part, material, visibility, connection, pose, variant, and render-profile operations with revision preconditions and dry runs.',
    evidence: evidence({
      publicTools: tools('apply_operations', 'connect_parts', 'set_pose'),
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'revision.immutable',
    category: 'operation',
    status: 'supported',
    summary:
      'Every accepted mutation creates a content-addressed immutable revision with conflict detection.',
    evidence: evidence({
      publicTools: tools(
        'create_asset',
        'apply_operations',
        'connect_parts',
        'set_pose',
        'compare_revisions',
      ),
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'revision.restore',
    category: 'operation',
    status: 'supported',
    summary:
      'Compare exact novel revision semantics and restore a validated prior immutable revision through a deterministic confirmed dry-run plan without deleting lineage.',
    evidence: evidence({
      publicTools: tools('compare_revisions', 'apply_operations'),
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'animation.rigid_pose',
    category: 'animation',
    status: 'supported',
    summary:
      'Select or upsert static rigid-part pose snapshots without skeletal deformation.',
    evidence: evidence({ publicTools: tools('set_pose', 'apply_operations') }),
  }),
  CapabilityFactSchema.parse({
    id: 'output.glb',
    category: 'output',
    status: 'supported',
    summary:
      'Export the current canonical revision as reload-verified GLB 2.0.',
    evidence: evidence({
      publicTools: tools('validate_asset', 'export_asset'),
      formats: ['glb'],
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'output.sprite.directional',
    category: 'output',
    status: 'supported',
    summary: `Render ${MVP_RENDER_PROFILE.directions} deterministic orthographic transparent directions at ${MVP_RENDER_PROFILE.widthPixels}x${MVP_RENDER_PROFILE.heightPixels}.`,
    evidence: evidence({
      publicTools: tools('validate_asset', 'render_preview'),
      renderProfileIds: [MVP_RENDER_PROFILE.id],
      formats: ['png'],
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'output.sprite.contact_sheet',
    category: 'output',
    status: 'supported',
    summary:
      'Render a labeled contact sheet beside individual transparent directional PNG frames.',
    evidence: evidence({
      publicTools: tools('render_preview'),
      renderProfileIds: [MVP_RENDER_PROFILE.id],
      formats: ['contact-sheet', 'png'],
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'asset.identity.initialize',
    category: 'asset',
    status: 'supported',
    summary:
      'Initialize a deterministic canonical identity skeleton for a declared rustic humanoid or banded-container archetype.',
    evidence: evidence({
      publicTools: tools(
        'list_kits',
        'create_asset',
        'inspect_asset',
        'validate_asset',
      ),
      archetypeIds: NOVEL_ASSET_ARCHETYPES.map(({ id }) => id),
      templateIds: NOVEL_ASSET_ARCHETYPES.flatMap(
        ({ allowedTemplateIds }) => allowedTemplateIds,
      ).sort(compareText),
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'asset.grammar.compose',
    category: 'asset',
    status: 'supported',
    summary:
      'Preflight bounded briefs and compile task-level add-and-connect requests into the existing closed semantic patch workflow without caller-authored transforms.',
    evidence: evidence({
      publicTools: tools(
        'list_kits',
        'inspect_template',
        'apply_operations',
        'inspect_asset',
        'validate_asset',
      ),
      archetypeIds: NOVEL_ASSET_ARCHETYPES.map(({ id }) => id),
      templateIds: NOVEL_ASSET_ARCHETYPES.flatMap(
        ({ allowedTemplateIds }) => allowedTemplateIds,
      ).sort(compareText),
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'asset.new_identity',
    category: 'asset',
    status: 'partial',
    summary:
      'The public workflow can initialize and compose bounded registered archetypes, but arbitrary assembly, anatomy, generator, and raw-mesh authoring are not available.',
    guidance:
      'Use one advertised archetype and its registered grammar; unsupported anatomy, generators, raw mesh, source, and file workflows require a separately reviewed kit extension.',
    evidence: evidence({
      publicTools: tools(
        'list_kits',
        'create_asset',
        'apply_operations',
        'inspect_asset',
      ),
      archetypeIds: NOVEL_ASSET_ARCHETYPES.map(({ id }) => id),
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'accessory.additional',
    category: 'accessory',
    status: 'supported',
    summary:
      'The complete seventeen-template static helmet, hood, weapon, shield, torch, armor, back, and waist library is registered, discoverable, and inspectable.',
    evidence: evidence({
      publicTools: tools(
        'inspect_capabilities',
        'search_accessories',
        'inspect_template',
      ),
      templateIds: additionalAccessoryTemplateIds,
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'asset.humanoid_morphology',
    category: 'asset',
    status: 'supported',
    summary:
      'The public apply_operations workflow compiles bounded rustic-human proportions and registered appearance features into a deterministic fifteen-part semantic transform plan with dry-run confirmation and revision lineage.',
    evidence: evidence({
      publicTools: tools(
        'create_asset',
        'apply_operations',
        'inspect_asset',
        'render_preview',
      ),
      archetypeIds: ['humanoid.biped.rustic'],
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'animation.temporal',
    category: 'animation',
    status: 'partial',
    summary:
      'Public render_preview animation input compiles one bounded semantic rigid clip into freshness-bound timed 128x128 source frames, a deterministic derived atlas, and an exact source-GLB delivery with public manifest and bounded chunk retrieval.',
    guidance:
      'Treat this as a mechanical single-clip subset only. The current proof motion is visually rejected; persisted inspect/compare authoring, the five-clip batch, Pixel playback, and production-motion acceptance remain incomplete.',
    evidence: evidence({
      publicTools: tools(
        'inspect_asset',
        'render_preview',
        'get_interchange_manifest',
        'get_interchange_artifact_chunk',
      ),
      formats: ['glb', 'png'],
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'output.sprite_atlas',
    category: 'output',
    status: 'partial',
    summary:
      'The temporal renderer composes and publishes a deterministic derived PNG atlas with exact frame rectangles while preserving every individual source frame and source GLB in the same delivery.',
    guidance:
      'Do not treat the atlas as source or production art. Five readable clips, broader delivery metadata, Pixel playback/admission, and exhaustive Kimi review remain required.',
    evidence: evidence({
      publicTools: tools(
        'render_preview',
        'get_interchange_manifest',
        'get_interchange_artifact_chunk',
      ),
      formats: ['glb', 'png'],
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'anatomy.unsupported',
    category: 'asset',
    status: 'unsupported',
    summary:
      'Arbitrary creatures, quadrupeds, wings, tentacles, deforming anatomy, and additional humanoid culture families are not registered.',
    guidance:
      'Use the rustic adventurer anatomy or another existing static reference; add a bounded reviewed template family before requesting new anatomy.',
    evidence: evidence(),
  }),
  CapabilityFactSchema.parse({
    id: 'operation.raw_mesh',
    category: 'operation',
    status: 'unsupported',
    summary:
      'The public surface intentionally exposes no vertex, edge, face, sculpting, topology, or unrestricted geometry mutation.',
    guidance:
      'Express changes through registered templates, shape parameters, parts, ports, materials, variants, and poses.',
    evidence: evidence({
      publicTools: tools('inspect_template', 'apply_operations'),
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'integration.public_interchange',
    category: 'integration',
    status: 'partial',
    summary:
      'Public MCP exposes canonical revision-pinned manifests and bounded digest-bound chunks for allowlisted source PNG and GLB artifacts.',
    guidance:
      'Treat live delivery as partial until a complete render/export revision is registered and exercised through the public MCP process.',
    evidence: evidence({
      publicTools: tools(
        'get_interchange_manifest',
        'get_interchange_artifact_chunk',
      ),
      formats: ['glb', 'png'],
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'integration.game_engine_import',
    category: 'integration',
    status: 'not-assessed',
    summary:
      'Independent Three.js GLTFLoader evidence passes, but Unity, Godot, and gameplay-runtime import have not been assessed.',
    guidance:
      'Treat external game-engine and gameplay-runtime compatibility as Not Assessed; the S4 GLTFLoader audit proves only the bounded GLB format contract.',
    evidence: evidence({
      publicTools: tools('validate_asset', 'export_asset'),
      formats: ['glb'],
    }),
  }),
];

export const CAPABILITY_FACTS: readonly CapabilityFact[] = Object.freeze(
  [...referenceFacts, ...declaredFacts].sort((left, right) =>
    compareText(left.id, right.id),
  ),
);

export function capabilityReport(
  capabilityIds: readonly string[] = [],
): CapabilityReport {
  const requested = new Set(capabilityIds);
  const facts =
    requested.size === 0
      ? CAPABILITY_FACTS
      : CAPABILITY_FACTS.filter(({ id }) => requested.has(id));
  const totals = {
    supported: facts.filter(({ status }) => status === 'supported').length,
    partial: facts.filter(({ status }) => status === 'partial').length,
    unsupported: facts.filter(({ status }) => status === 'unsupported').length,
    notAssessed: facts.filter(({ status }) => status === 'not-assessed').length,
  };
  return CapabilityReportSchema.parse({
    scope: 'fantasy-asset-forge',
    facts,
    availableCapabilityIds: CAPABILITY_FACTS.map(({ id }) => id),
    totals,
    filtered: requested.size > 0,
  });
}
