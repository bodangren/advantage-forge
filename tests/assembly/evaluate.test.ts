import { describe, expect, it } from 'vitest';

import type {
  AssemblyDefinition,
  PartTemplateDefinition,
  PoseDefinition,
  Transform,
  VariantDefinition,
} from '../../src/contracts/index.js';
import {
  AssemblyEvaluationError,
  applyPose,
  applyVariant,
  evaluateAssembly,
  instantiatePart,
  mirrorSubassembly,
  validateAssembly,
} from '../../src/assembly/index.js';

const identity: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
};

const templates: readonly PartTemplateDefinition[] = [
  {
    id: 'humanoid.torso',
    role: 'humanoid.torso',
    shape: { kind: 'box', width: 1, height: 2, depth: 0.5 },
    ports: [
      {
        id: 'shoulder.left',
        frame: { ...identity, position: [-0.5, 0.75, 0] },
        tags: ['body.shoulder'],
        accepts: ['limb.shoulder'],
        cardinality: 'single',
      },
      {
        id: 'shoulder.right',
        frame: { ...identity, position: [0.5, 0.75, 0] },
        tags: ['body.shoulder'],
        accepts: ['limb.shoulder'],
        cardinality: 'single',
      },
    ],
    materialSlots: ['cloth'],
  },
  {
    id: 'humanoid.upper-arm',
    role: 'humanoid.limb.upper-arm',
    shape: {
      kind: 'capsule',
      radius: 0.15,
      cylinderHeight: 0.7,
      radialSegments: 8,
      capSegments: 3,
    },
    ports: [
      {
        id: 'shoulder',
        frame: { ...identity, position: [0, 0.5, 0] },
        tags: ['limb.shoulder'],
        accepts: ['body.shoulder'],
        cardinality: 'single',
      },
      {
        id: 'elbow',
        frame: { ...identity, position: [0, -0.5, 0] },
        tags: ['limb.elbow.parent'],
        accepts: ['limb.elbow.child'],
        cardinality: 'single',
      },
    ],
    materialSlots: ['skin'],
  },
  {
    id: 'humanoid.forearm',
    role: 'humanoid.limb.forearm',
    shape: {
      kind: 'capsule',
      radius: 0.12,
      cylinderHeight: 0.6,
      radialSegments: 8,
      capSegments: 3,
    },
    ports: [
      {
        id: 'elbow',
        frame: { ...identity, position: [0, 0.45, 0] },
        tags: ['limb.elbow.child'],
        accepts: ['limb.elbow.parent'],
        cardinality: 'single',
      },
    ],
    materialSlots: ['skin'],
  },
];

function validAssembly(): AssemblyDefinition {
  const torso = instantiatePart(fixture(templates[0]), 'body.torso');
  const arm = instantiatePart(fixture(templates[1]), 'body.arm.left');
  const forearm = instantiatePart(fixture(templates[2]), 'body.forearm.left');
  return {
    id: 'adventurer',
    parts: [torso, arm, forearm],
    connections: [
      {
        id: 'connect.shoulder.left',
        parentPartId: torso.id,
        parentPortId: 'shoulder.left',
        childPartId: arm.id,
        childPortId: 'shoulder',
        joint: {
          kind: 'hinge',
          axis: [0, 0, 1],
          minDegrees: -90,
          maxDegrees: 90,
        },
      },
      {
        id: 'connect.elbow.left',
        parentPartId: arm.id,
        parentPortId: 'elbow',
        childPartId: forearm.id,
        childPortId: 'elbow',
        joint: {
          kind: 'hinge',
          axis: [0, 0, 1],
          minDegrees: 0,
          maxDegrees: 140,
        },
      },
    ],
  };
}

describe('part and port assembly evaluation', () => {
  it('instantiates templates without mutating them', () => {
    const template = fixture(templates[0]);
    const before = structuredClone(template);
    expect(instantiatePart(template, 'body.torso')).toMatchObject({
      id: 'body.torso',
      templateId: 'humanoid.torso',
      shape: template.shape,
      visible: true,
    });
    expect(template).toEqual(before);
  });

  it('resolves compatible port frames and produces a canonical scene summary', () => {
    const assembly = validAssembly();
    const first = evaluateAssembly(assembly, templates);
    const second = evaluateAssembly(
      structuredClone(assembly),
      structuredClone(templates),
    );

    expect(first).toEqual(second);
    expect(first.parts.map((part) => part.id)).toEqual([
      'body.arm.left',
      'body.forearm.left',
      'body.torso',
    ]);
    expect(
      first.parts.find((part) => part.id === 'body.arm.left')?.worldTransform
        .position,
    ).toEqual([-0.5, 0.25, 0]);
    expect(
      first.parts.find((part) => part.id === 'body.forearm.left')
        ?.worldTransform.position,
    ).toEqual([-0.5, -0.7, 0]);
    expect(first.triangleCount).toBeGreaterThan(0);
    expect(first.bounds.min[1]).toBeLessThan(first.bounds.max[1]);
  });

  it('allows intersecting closed parts without Boolean operations', () => {
    const assembly = validAssembly();
    const summary = evaluateAssembly(
      {
        ...assembly,
        parts: assembly.parts.map((part) => ({ ...part, transform: identity })),
        connections: [],
      },
      templates,
    );
    expect(summary.parts).toHaveLength(3);
    expect(summary.triangleCount).toBeGreaterThan(0);
  });
});

describe('assembly rejection', () => {
  it('rejects duplicate IDs and missing targets', () => {
    const assembly = validAssembly();
    const malformed: AssemblyDefinition = {
      ...assembly,
      parts: [...assembly.parts, fixture(assembly.parts[0])],
      connections: [
        ...assembly.connections,
        {
          ...fixture(assembly.connections[0]),
          parentPartId: 'missing.parent',
        },
      ],
    };
    expect(
      validateAssembly(malformed, templates).map((entry) => entry.code),
    ).toEqual(
      expect.arrayContaining([
        'DUPLICATE_PART_ID',
        'DUPLICATE_CONNECTION_ID',
        'MISSING_PART',
      ]),
    );
  });

  it('reports missing templates, children, and ports with stable codes', () => {
    const assembly = validAssembly();
    const malformed: AssemblyDefinition = {
      ...assembly,
      parts: [
        { ...fixture(assembly.parts[0]), templateId: 'missing.template' },
        ...assembly.parts.slice(1),
      ],
      connections: [
        { ...fixture(assembly.connections[0]), parentPortId: 'missing.port' },
        { ...fixture(assembly.connections[1]), childPartId: 'missing.child' },
      ],
    };
    expect(
      validateAssembly(malformed, templates).map((entry) => entry.code),
    ).toEqual(
      expect.arrayContaining([
        'MISSING_TEMPLATE',
        'MISSING_PORT',
        'MISSING_PART',
      ]),
    );
  });

  it('rejects incompatible and occupied ports', () => {
    const assembly = validAssembly();
    const secondArm = instantiatePart(fixture(templates[1]), 'body.arm.second');
    const malformed: AssemblyDefinition = {
      ...assembly,
      parts: [...assembly.parts, secondArm],
      connections: [
        fixture(assembly.connections[0]),
        {
          id: 'connect.second',
          parentPartId: 'body.torso',
          parentPortId: 'shoulder.left',
          childPartId: secondArm.id,
          childPortId: 'elbow',
        },
      ],
    };
    expect(
      validateAssembly(malformed, templates).map((entry) => entry.code),
    ).toEqual(expect.arrayContaining(['INCOMPATIBLE_PORTS', 'OCCUPIED_PORT']));
  });

  it('rejects cycles and duplicate ownership', () => {
    const cyclicTemplates: readonly PartTemplateDefinition[] = [
      {
        id: 'chain',
        role: 'chain',
        shape: { kind: 'box', width: 1, height: 1, depth: 1 },
        materialSlots: ['surface'],
        ports: [
          {
            id: 'link',
            frame: identity,
            tags: ['chain'],
            accepts: ['chain'],
            cardinality: 'multiple',
          },
        ],
      },
    ];
    const parts = ['a', 'b', 'c'].map((id) =>
      instantiatePart(fixture(cyclicTemplates[0]), id),
    );
    const assembly: AssemblyDefinition = {
      id: 'cycle',
      parts,
      connections: [
        {
          id: 'a-b',
          parentPartId: 'a',
          parentPortId: 'link',
          childPartId: 'b',
          childPortId: 'link',
        },
        {
          id: 'b-c',
          parentPartId: 'b',
          parentPortId: 'link',
          childPartId: 'c',
          childPortId: 'link',
        },
        {
          id: 'c-a',
          parentPartId: 'c',
          parentPortId: 'link',
          childPartId: 'a',
          childPortId: 'link',
        },
      ],
    };
    expect(
      validateAssembly(assembly, cyclicTemplates).map((entry) => entry.code),
    ).toContain('ASSEMBLY_CYCLE');
  });
});

describe('variants, mirroring, and rigid poses', () => {
  it('applies a localized variant and preserves unrelated stable nodes by reference', () => {
    const assembly = validAssembly();
    const variant: VariantDefinition = {
      id: 'broad',
      overrides: [
        {
          partId: 'body.torso',
          shape: { kind: 'box', width: 1.4, height: 2, depth: 0.5 },
        },
      ],
    };
    const result = applyVariant(assembly, variant);
    expect(result.parts[0]).not.toBe(assembly.parts[0]);
    expect(result.parts[1]).toBe(assembly.parts[1]);
    expect(result.parts.map((part) => part.id)).toEqual(
      assembly.parts.map((part) => part.id),
    );
    expect(
      evaluateAssembly(result, templates).parts.find(
        (part) => part.id === 'body.torso',
      )?.bounds,
    ).toMatchObject({ min: [-0.7, -1, -0.25], max: [0.7, 1, 0.25] });
  });

  it('mirrors selected transforms with explicit handedness and stable IDs', () => {
    const assembly = validAssembly();
    const moved: AssemblyDefinition = {
      ...assembly,
      parts: assembly.parts.map((part) =>
        part.id === 'body.arm.left'
          ? { ...part, transform: { ...identity, position: [-0.2, 0, 0] } }
          : part,
      ),
    };
    const mirrored = mirrorSubassembly(moved, ['body.arm.left'], 'x');
    expect(mirrored.parts.map((part) => part.id)).toEqual(
      moved.parts.map((part) => part.id),
    );
    expect(
      mirrored.parts.find((part) => part.id === 'body.arm.left')?.transform
        .position,
    ).toEqual([0.2, 0, 0]);
    expect(mirrored.parts.find((part) => part.id === 'body.torso')).toBe(
      moved.parts.find((part) => part.id === 'body.torso'),
    );
  });

  it('composes pose overrides and enforces hinge limits', () => {
    const assembly = validAssembly();
    const validPose: PoseDefinition = {
      id: 'guard',
      overrides: [{ partId: 'body.forearm.left', jointValueDegrees: 90 }],
    };
    const posed = applyPose(assembly, validPose);
    expect(
      posed.parts.find((part) => part.id === 'body.forearm.left')
        ?.jointValueDegrees,
    ).toBe(90);
    expect(evaluateAssembly(posed, templates).parts).toHaveLength(3);

    const invalidPose: PoseDefinition = {
      id: 'broken-elbow',
      overrides: [{ partId: 'body.forearm.left', jointValueDegrees: 180 }],
    };
    expect(() =>
      evaluateAssembly(assembly, templates, { pose: invalidPose }),
    ).toThrowError(AssemblyEvaluationError);
    try {
      evaluateAssembly(assembly, templates, { pose: invalidPose });
    } catch (error: unknown) {
      expect(error).toMatchObject({
        issues: [expect.objectContaining({ code: 'JOINT_LIMIT' })],
      });
    }
  });

  it('applies every bounded variant field and transform pose field locally', () => {
    const assembly = validAssembly();
    const variant = applyVariant(assembly, {
      id: 'hidden-arm',
      overrides: [
        {
          partId: 'body.arm.left',
          transform: { ...identity, position: [0.1, 0, 0] },
          materialBindings: [{ slot: 'skin', materialId: 'leather' }],
          visible: false,
        },
      ],
    });
    const posed = applyPose(variant, {
      id: 'offset',
      overrides: [
        {
          partId: 'body.torso',
          transform: { ...identity, position: [0, 1, 0] },
        },
      ],
    });
    expect(
      variant.parts.find((part) => part.id === 'body.arm.left'),
    ).toMatchObject({
      visible: false,
      materialBindings: [{ slot: 'skin', materialId: 'leather' }],
    });
    expect(
      posed.parts.find((part) => part.id === 'body.torso')?.transform.position,
    ).toEqual([0, 1, 0]);
    expect(evaluateAssembly(posed, templates).triangleCount).toBeGreaterThan(0);
  });

  it('mirrors all supported axes and rejects missing selections', () => {
    const assembly = validAssembly();
    expect(mirrorSubassembly(assembly, ['body.torso'], 'y').parts).toHaveLength(
      3,
    );
    expect(mirrorSubassembly(assembly, ['body.torso'], 'z').parts).toHaveLength(
      3,
    );
    expect(() => mirrorSubassembly(assembly, ['missing'], 'x')).toThrowError(
      AssemblyEvaluationError,
    );
  });

  it('rejects overrides that name missing parts', () => {
    expect(() =>
      applyVariant(validAssembly(), {
        id: 'invalid',
        overrides: [{ partId: 'missing', visible: false }],
      }),
    ).toThrowError(AssemblyEvaluationError);
    expect(() =>
      applyPose(validAssembly(), {
        id: 'invalid-pose',
        overrides: [{ partId: 'missing', jointValueDegrees: 20 }],
      }),
    ).toThrowError(AssemblyEvaluationError);
  });
});

function fixture<Value>(value: Value | undefined): Value {
  if (value === undefined) {
    throw new Error('Missing test fixture.');
  }
  return value;
}
