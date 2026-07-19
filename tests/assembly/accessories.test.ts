import { describe, expect, it } from 'vitest';

import {
  equipAccessory,
  unequipAccessory,
  validateAccessoryLoadout,
} from '../../src/assembly/index.js';
import type {
  AssemblyDefinition,
  PartInstance,
  PartTemplateDefinition,
  Transform,
} from '../../src/contracts/index.js';
import { canonicalJson } from '../../src/document/index.js';

const identity: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
};

const handTemplate: PartTemplateDefinition = {
  id: 'human.hand',
  role: 'anatomy.hand',
  shape: { kind: 'box', width: 0.13, height: 0.2, depth: 0.1 },
  materialSlots: ['skin'],
  ports: [
    {
      id: 'equipment',
      frame: identity,
      tags: ['equipment.mount'],
      accepts: ['equipment.grip'],
      cardinality: 'single',
    },
  ],
};

const accessoryTemplate = (
  id = 'equipment.test-sword',
  overrides: Partial<NonNullable<PartTemplateDefinition['accessory']>> = {},
): PartTemplateDefinition => ({
  id,
  role: 'equipment.weapon',
  shape: { kind: 'box', width: 0.08, height: 0.9, depth: 0.04 },
  materialSlots: ['metal'],
  ports: [
    {
      id: 'grip',
      frame: identity,
      tags: ['equipment.grip'],
      accepts: ['equipment.mount'],
      cardinality: 'single',
    },
  ],
  accessory: {
    role: 'weapon',
    slot: 'main-hand',
    compatibleSlots: ['main-hand', 'off-hand'],
    attachmentPortIds: ['grip'],
    handedness: 'right',
    compatibilityTags: ['rustic', 'guard'],
    compatibleAnatomy: ['rustic-human'],
    compatibleArchetypes: ['guard'],
    layer: {
      kind: 'carried',
      order: 20,
      maximumIntersectionRatio: 0.1,
    },
    bounds: { min: [-0.04, -0.45, -0.02], max: [0.04, 0.45, 0.02] },
    triangleBudget: 64,
    allowedPoseIds: ['idle', 'action'],
    requiredFeatures: [
      {
        id: 'blade',
        expectation: 'Blade remains visible beside the body.',
        intendedDirections: ['N', 'E', 'S', 'W'],
        minimumPixelArea: 8,
        minimumWidthPixels: 2,
        maximumOcclusionRatio: 0.8,
        minimumOklabDistance: 0.05,
      },
    ],
    ...overrides,
  },
});

const hand = (): PartInstance => ({
  id: 'hand.right',
  templateId: 'human.hand',
  handedness: 'right',
  transform: identity,
  materialBindings: [{ slot: 'skin', materialId: 'skin.warm' }],
  visible: true,
});

const sword = (
  id = 'weapon.primary',
  templateId = 'equipment.test-sword',
): PartInstance & { equipmentSlot: 'main-hand' } => ({
  id,
  templateId,
  equipmentSlot: 'main-hand',
  handedness: 'right',
  transform: identity,
  materialBindings: [{ slot: 'metal', materialId: 'iron.weathered' }],
  visible: true,
});

const baseAssembly = (): AssemblyDefinition => ({
  id: 'guard',
  parts: [hand()],
  connections: [],
});

const context = {
  anatomyId: 'rustic-human',
  archetypeId: 'guard',
  activePoseId: 'idle',
};

describe('accessory compatibility validation', () => {
  it('accepts a compatible, visible, correctly attached loadout', () => {
    const item = sword();
    const assembly: AssemblyDefinition = {
      ...baseAssembly(),
      parts: [...baseAssembly().parts, item],
      connections: [
        {
          id: 'equip.weapon.primary',
          parentPartId: 'hand.right',
          parentPortId: 'equipment',
          childPartId: item.id,
          childPortId: 'grip',
        },
      ],
    };
    expect(
      validateAccessoryLoadout(
        assembly,
        [handTemplate, accessoryTemplate()],
        context,
      ),
    ).toEqual([]);
  });

  it('rejects incompatible anatomy, archetype, pose, and hidden equipment', () => {
    const item = { ...sword(), visible: false };
    const assembly: AssemblyDefinition = {
      ...baseAssembly(),
      parts: [...baseAssembly().parts, item],
      connections: [],
    };
    const issues = validateAccessoryLoadout(
      assembly,
      [handTemplate, accessoryTemplate()],
      {
        anatomyId: 'skeleton',
        archetypeId: 'caster',
        activePoseId: 'sleeping',
      },
    );
    expect(issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'ACCESSORY_ANATOMY_INCOMPATIBLE',
        'ACCESSORY_ARCHETYPE_INCOMPATIBLE',
        'ACCESSORY_POSE_INCOMPATIBLE',
        'ACCESSORY_HIDDEN',
        'ACCESSORY_ATTACHMENT_MISSING',
      ]),
    );
  });

  it('rejects occupied slots, handedness conflicts, and undeclared attachment ports', () => {
    const primary = sword();
    const duplicate = sword('weapon.duplicate', 'equipment.left-only');
    const assembly: AssemblyDefinition = {
      ...baseAssembly(),
      parts: [...baseAssembly().parts, primary, duplicate],
      connections: [
        {
          id: 'equip.primary',
          parentPartId: 'hand.right',
          parentPortId: 'equipment',
          childPartId: primary.id,
          childPortId: 'wrong-port',
        },
      ],
    };
    const issues = validateAccessoryLoadout(
      assembly,
      [
        handTemplate,
        accessoryTemplate(),
        accessoryTemplate('equipment.left-only', { handedness: 'left' }),
      ],
      context,
    );
    expect(issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'ACCESSORY_SLOT_OCCUPIED',
        'ACCESSORY_HANDEDNESS_CONFLICT',
        'ACCESSORY_ATTACHMENT_PORT',
      ]),
    );
  });

  it('reports excessive rigid-layer intersection without requiring cloth simulation', () => {
    const bodyTemplate = accessoryTemplate('equipment.armor', {
      role: 'armor',
      slot: 'body',
      compatibleSlots: ['body'],
      handedness: 'neutral',
      layer: {
        kind: 'overlay',
        order: 10,
        maximumIntersectionRatio: 0.01,
      },
      bounds: { min: [-1, -1, -1], max: [1, 1, 1] },
    });
    const body = {
      ...sword('armor', 'equipment.armor'),
      equipmentSlot: 'body' as const,
      handedness: 'neutral' as const,
    };
    const assembly: AssemblyDefinition = {
      id: 'layered',
      parts: [body, { ...body, id: 'armor.duplicate' }],
      connections: [],
    };
    expect(
      validateAccessoryLoadout(assembly, [bodyTemplate], context).map(
        ({ code }) => code,
      ),
    ).toContain('ACCESSORY_INTERSECTION_EXCEEDED');
  });

  it('compares rigid accessory bounds in evaluated world space', () => {
    const mountTemplate: PartTemplateDefinition = {
      id: 'human.mounts',
      role: 'anatomy.torso',
      shape: { kind: 'box', width: 1, height: 1, depth: 1 },
      materialSlots: ['body'],
      ports: [
        {
          id: 'equipment.body',
          frame: { ...identity, position: [0, 0, 2] },
          tags: ['equipment.mount'],
          accepts: ['equipment.grip'],
          cardinality: 'single',
        },
        {
          id: 'equipment.back',
          frame: { ...identity, position: [0, 0, -2] },
          tags: ['equipment.mount'],
          accepts: ['equipment.grip'],
          cardinality: 'single',
        },
      ],
    };
    const bodyTemplate = accessoryTemplate('equipment.body-shell', {
      role: 'armor',
      slot: 'body',
      compatibleSlots: ['body'],
      handedness: 'neutral',
      layer: {
        kind: 'overlay',
        order: 10,
        maximumIntersectionRatio: 0.01,
      },
      bounds: { min: [-1, -1, -1], max: [1, 1, 1] },
    });
    const backTemplate = accessoryTemplate('equipment.back-shell', {
      role: 'back-item',
      slot: 'back',
      compatibleSlots: ['back'],
      handedness: 'neutral',
      layer: {
        kind: 'overlay',
        order: 11,
        maximumIntersectionRatio: 0.01,
      },
      bounds: { min: [-1, -1, -1], max: [1, 1, 1] },
    });
    const parent: PartInstance = {
      id: 'torso',
      templateId: mountTemplate.id,
      handedness: 'neutral',
      transform: identity,
      materialBindings: [{ slot: 'body', materialId: 'cloth.moss' }],
      visible: true,
    };
    const body = {
      ...sword('armor', bodyTemplate.id),
      equipmentSlot: 'body' as const,
      handedness: 'neutral' as const,
    };
    const back = {
      ...sword('pack', backTemplate.id),
      equipmentSlot: 'back' as const,
      handedness: 'neutral' as const,
    };
    const assembly: AssemblyDefinition = {
      id: 'world-space-layers',
      parts: [parent, body, back],
      connections: [
        {
          id: 'equip.body',
          parentPartId: parent.id,
          parentPortId: 'equipment.body',
          childPartId: body.id,
          childPortId: 'grip',
        },
        {
          id: 'equip.back',
          parentPartId: parent.id,
          parentPortId: 'equipment.back',
          childPartId: back.id,
          childPortId: 'grip',
        },
      ],
    };

    expect(
      validateAccessoryLoadout(
        assembly,
        [mountTemplate, bodyTemplate, backTemplate],
        context,
      ),
    ).toEqual([]);
  });
});

describe('accessory equip locality', () => {
  it('equips and unequips without changing unrelated nodes or canonical order', () => {
    const base = baseAssembly();
    const item = sword();
    const connection = {
      id: 'equip.weapon.primary',
      parentPartId: 'hand.right',
      parentPortId: 'equipment',
      childPartId: item.id,
      childPortId: 'grip',
    };
    const before = canonicalJson(base);
    const equipped = equipAccessory(base, [handTemplate, accessoryTemplate()], {
      part: item,
      connection,
      context,
    });
    expect(canonicalJson(base)).toBe(before);
    expect(equipped.parts[0]).toBe(base.parts[0]);
    expect(equipped.parts.at(-1)).toBe(item);

    const unequipped = unequipAccessory(equipped, item.id);
    expect(canonicalJson(unequipped)).toBe(before);
    expect(unequipped.parts[0]).toBe(base.parts[0]);
  });
});
