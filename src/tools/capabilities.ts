import {
  CapabilityFactSchema,
  CapabilityReportSchema,
  type CapabilityEvidence,
  type CapabilityFact,
  type CapabilityReport,
} from '../contracts/index.js';
import { referenceDocuments, rusticTemplates } from '../fantasy-kit/index.js';
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
        'inspect_asset',
        'apply_operations',
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
    status: 'partial',
    summary:
      'Accessory authoring is limited to the registered sword and shield.',
    guidance:
      'Use the existing sword or shield only; helmets, alternate weapons, armor shells, packs, and similar equipment require the planned accessory-library track.',
    evidence: evidence({
      publicTools: tools('inspect_template', 'inspect_asset'),
      templateIds: ['equipment.shield', 'equipment.sword'],
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
    id: 'asset.new_identity',
    category: 'asset',
    status: 'unsupported',
    summary:
      'The public creation tool cannot assign a new asset identity or assemble an arbitrary new document.',
    guidance:
      'Choose adventurer, crate, tree, or cottage and revise it locally; wait for the planned novel-identity authoring track for new canonical IDs.',
    evidence: evidence({ publicTools: tools('create_asset') }),
  }),
  CapabilityFactSchema.parse({
    id: 'accessory.additional',
    category: 'accessory',
    status: 'unsupported',
    summary:
      'No helmet, hood, axe, mace, spear, staff, torch, armor shell, cape, quiver, backpack, pouch, or scabbard template is registered.',
    guidance:
      'Do not approximate missing equipment with unrelated parts; implement and verify the planned accessory-library track first.',
    evidence: evidence({
      publicTools: tools('inspect_capabilities', 'inspect_template'),
      templateIds: ['equipment.shield', 'equipment.sword'],
    }),
  }),
  CapabilityFactSchema.parse({
    id: 'animation.temporal',
    category: 'animation',
    status: 'unsupported',
    summary:
      'No temporal clip, frame sequence, interpolation, animation export, or playback contract exists.',
    guidance:
      'Use a single declared rigid pose snapshot; temporal animation requires the planned rigid-animation and sprite-pipeline track.',
    evidence: evidence({ publicTools: tools('set_pose') }),
  }),
  CapabilityFactSchema.parse({
    id: 'output.sprite_atlas',
    category: 'output',
    status: 'unsupported',
    summary:
      'Directional frames and a review contact sheet exist, but no runtime atlas layout or animation metadata contract exists.',
    guidance:
      'Consume individual PNG directions or the review-only contact sheet; wait for the rigid-animation sprite-pipeline track for atlases.',
    evidence: evidence({
      publicTools: tools('render_preview'),
      formats: ['contact-sheet', 'png'],
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
