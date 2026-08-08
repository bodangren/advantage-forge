import { describe, expect, it } from 'vitest';

import { SemanticPatchSchema } from '../../../src/document/index.js';
import { rusticTemplates } from '../../../src/fantasy-kit/catalog.js';
import { compileHumanoidMorphology } from '../../../src/fantasy-kit/humanoid-morphology.js';
import { compileChibiGuardReferenceGeometry } from '../../../src/fantasy-kit/reference-geometry/chibi-guard.js';

const profile = () => ({
  contractId: 'forge-humanoid-morphology/v1' as const,
  profileId: 'morphology.reference-chibi-guard',
  kitId: 'rustic-human' as const,
  archetypeId: 'humanoid.biped.rustic' as const,
  styleProfile: { id: 'cute_chibi_v1' as const, version: '1.0.0' as const },
  seed: 42,
  proportions: {
    headScale: 1,
    headWidth: 1,
    headDepth: 0.7,
    craniumRoundness: 1,
    torsoLength: -1,
    torsoWidth: 1,
    torsoDepth: 0.25,
    shoulderWidth: 0.8,
    pelvisWidth: 0.65,
    armLength: -0.7,
    armThickness: 0.7,
    legLength: -1,
    legThickness: 0.8,
    handScale: 0.3,
    footScale: 0.35,
    neckLength: -1,
  },
  features: {
    hairStyle: 'short_rounded' as const,
    eyeStyle: 'round' as const,
    facialHairStyle: 'none' as const,
    clothingSilhouette: 'light_armor' as const,
  },
  symmetry: { bilateral: true as const },
});

describe('reference-driven chibi guard geometry', () => {
  it('binds the selected structural target and emits a valid deterministic semantic patch', () => {
    const first = compileHumanoidMorphology(profile()).referenceGeometry;
    const second = compileHumanoidMorphology(
      structuredClone(profile()),
    ).referenceGeometry;

    expect(first.contractId).toBe('forge-reference-geometry-plan/v1');
    expect(first.reference).toEqual({
      path: 'reference-designs/chibi-guard-20260722/chibi-guard-base-turnaround_002.jpg',
      sha256:
        'e922d42800c4e28a8a42eeb851013ef035941bda9c05e3a8790ba79bc471ff64',
      disposition: 'selected-structural-target',
    });
    expect(SemanticPatchSchema.parse(first.patch)).toEqual(first.patch);
    expect(second).toEqual(first);
  });

  it('uses oval face features over one smooth round head mass', () => {
    const plan = compileHumanoidMorphology(profile()).referenceGeometry;
    const shapeFor = (partId: string) =>
      plan.patch.operations.find(
        (operation) =>
          operation.operation === 'setPartShapeParameters' &&
          operation.partId === partId,
      );
    const transformFor = (partId: string) =>
      plan.patch.operations.find(
        (operation) =>
          operation.operation === 'setPartTransform' &&
          operation.partId === partId,
      );
    const eyeTemplate = rusticTemplates.find(
      ({ id }) => id === 'human.face-eye',
    );
    const mouth = shapeFor('face.mouth');

    expect(
      plan.patch.operations.some(({ operation }) => operation === 'addPart'),
    ).toBe(false);
    expect(shapeFor('face.eye.left')).toBeUndefined();
    expect(shapeFor('face.eye.right')).toBeUndefined();
    expect(eyeTemplate?.shape).toMatchObject({
      kind: 'ellipsoid',
      radiusX: 0.015,
      radiusY: 0.035,
    });
    expect(mouth?.operation).toBe('setPartShapeParameters');
    if (mouth?.operation !== 'setPartShapeParameters') return;
    expect(mouth.shape.kind).toBe('tubePath');
    if (mouth.shape.kind !== 'tubePath') return;
    expect(mouth.shape.path).toHaveLength(3);
    expect(mouth.shape.path[1]?.[1]).toBeLessThan(mouth.shape.path[0]![1]);
    for (const partId of ['face.eye.left', 'face.eye.right', 'face.mouth'])
      expect(transformFor(partId)).toMatchObject({
        transform: { position: [0, 0, 0], scale: [1, 1, 1] },
      });
    expect(plan.requiredExistingPartIds).toEqual(
      expect.arrayContaining(['face.eye.left', 'face.eye.right', 'face.mouth']),
    );
    expect(shapeFor('face.cheek.left')).toBeUndefined();
    expect(plan.requiredExistingPartIds).toEqual(
      expect.arrayContaining(['face.nose', 'face.ear.left', 'face.ear.right']),
    );
    expect(plan.validation.faceFeatureCount).toBe(6);
    expect(plan.validation.faceFeatureSymmetryError).toBe(0);
  });

  it('creates the measured flared body, separated arms, and broad dome-brim helmet', () => {
    const plan = compileHumanoidMorphology(profile()).referenceGeometry;
    const shapeFor = (partId: string) =>
      plan.patch.operations.find(
        (operation) =>
          operation.operation === 'setPartShapeParameters' &&
          operation.partId === partId,
      );
    const helmet = shapeFor('helmet.dome');
    const tunic = shapeFor('tunic');
    const head = shapeFor('head');
    const torso = shapeFor('body.root');
    const hand = shapeFor('hand.left');
    const foot = shapeFor('foot.left');
    const emblem = shapeFor('helmet.emblem');

    expect(head?.operation).toBe('setPartShapeParameters');
    if (head?.operation !== 'setPartShapeParameters') return;
    expect(head.shape.kind).toBe('ellipsoid');
    if (head.shape.kind !== 'ellipsoid') return;
    expect(head.shape.radiusX).toBeCloseTo(0.19, 3);
    expect(head.shape.radiusY).toBeCloseTo(0.3, 3);
    const headAdjustment = compileHumanoidMorphology(
      profile(),
    ).partAdjustments.find(({ partId }) => partId === 'head');
    expect(headAdjustment).toBeDefined();
    expect(
      (head.shape.radiusX * headAdjustment!.targetWorldScale[0]) /
        (head.shape.radiusY * headAdjustment!.targetWorldScale[1]),
    ).toBeCloseTo(1.1, 1);

    expect(torso?.operation).toBe('setPartShapeParameters');
    if (torso?.operation !== 'setPartShapeParameters') return;
    expect(torso.shape.kind).toBe('beveledBox');
    if (torso.shape.kind !== 'beveledBox') return;
    expect(torso.shape.width / torso.shape.height).toBeGreaterThan(1);
    expect(torso.shape.bevel).toBeGreaterThan(0.1);

    expect(hand?.operation).toBe('setPartShapeParameters');
    if (hand?.operation !== 'setPartShapeParameters') return;
    expect(hand.shape.kind).toBe('ellipsoid');
    if (hand.shape.kind !== 'ellipsoid') return;
    expect(hand.shape.radiusX).toBeGreaterThan(hand.shape.radiusY);
    expect(hand.shape.radiusX).toBeGreaterThanOrEqual(0.18);

    expect(foot?.operation).toBe('setPartShapeParameters');
    if (foot?.operation !== 'setPartShapeParameters') return;
    expect(foot.shape.kind).toBe('ellipsoid');
    expect(emblem).toBeUndefined();
    expect(shapeFor('hair.back')?.operation).toBe('setPartShapeParameters');
    expect(shapeFor('hair.fringe.left')).toBeUndefined();
    expect(shapeFor('hair.fringe.right')).toBeUndefined();
    expect(shapeFor('helmet.crest')).toBeUndefined();
    expect(shapeFor('hair.side.left')).toBeUndefined();
    expect(shapeFor('hair.side.right')).toBeUndefined();
    for (const partId of ['tunic.trim', 'belt', 'pouch.left', 'pouch.right'])
      expect(shapeFor(partId)?.operation, partId).toBe(
        'setPartShapeParameters',
      );

    expect(helmet?.operation).toBe('setPartShapeParameters');
    if (helmet?.operation !== 'setPartShapeParameters') return;
    expect(helmet.shape.kind).toBe('lathedProfile');
    if (helmet.shape.kind !== 'lathedProfile') return;
    const lowerBrimRadius = Math.max(
      ...helmet.shape.profile.slice(0, 4).map(([radius]) => radius),
    );
    const crownRadius = Math.max(
      ...helmet.shape.profile.slice(4).map(([radius]) => radius),
    );
    const helmetHeight =
      helmet.shape.profile.at(-1)![1] - helmet.shape.profile[0]![1];
    expect(lowerBrimRadius).toBeGreaterThan(crownRadius);
    expect(lowerBrimRadius / crownRadius).toBeGreaterThanOrEqual(1.2);
    expect(lowerBrimRadius / head.shape.radiusX).toBeCloseTo(23 / 19, 12);
    expect(helmetHeight).toBeGreaterThanOrEqual(0.41);
    expect(
      (2 * lowerBrimRadius * headAdjustment!.targetWorldScale[2]) /
        (helmetHeight * headAdjustment!.targetWorldScale[1]),
    ).toBeCloseTo(1.6362857142857143, 12);

    expect(tunic?.operation).toBe('setPartShapeParameters');
    if (tunic?.operation !== 'setPartShapeParameters') return;
    expect(tunic.shape.kind).toBe('extrudedProfile');
    if (tunic.shape.kind !== 'extrudedProfile') return;
    const bottomWidth =
      Math.max(...tunic.shape.profile.map(([x]) => x)) -
      Math.min(...tunic.shape.profile.map(([x]) => x));
    const topWidth = tunic.shape.profile[4]![0] - tunic.shape.profile[5]![0];
    expect(bottomWidth / topWidth).toBeGreaterThanOrEqual(1.35);
    expect(bottomWidth).toBeGreaterThan(0.9);
    expect(tunic.shape.depth).toBeGreaterThan(0.36);
    expect(tunic.shape.bevel).toBeGreaterThan(0.04);
    expect(tunic.shape.bevelSegments).toBe(2);

    const thigh = shapeFor('thigh.left');
    expect(thigh?.operation).toBe('setPartShapeParameters');
    if (thigh?.operation !== 'setPartShapeParameters') return;
    expect(thigh.shape.kind).toBe('capsule');
    if (thigh.shape.kind !== 'capsule') return;
    expect(thigh.shape.radius).toBeGreaterThanOrEqual(0.135);

    expect(shapeFor('shield.kite')).toBeUndefined();
    expect(shapeFor('spear')).toBeUndefined();
    expect(shapeFor('helmet.iron')).toBeUndefined();
    expect(shapeFor('helmet.brim')).toBeUndefined();
    expect(shapeFor('helmet.ear.left')).toBeUndefined();
    expect(plan.requiredExistingPartIds).not.toEqual(
      expect.arrayContaining(['shield.kite', 'spear']),
    );
    expect(plan.requiredExistingPartIds).toEqual(
      expect.arrayContaining([
        'hair.back',
        'hair.fringe.left',
        'hair.fringe.center',
        'hair.fringe.right',
        'helmet.ridge',
        'boot.toe.left',
        'boot.toe.right',
        'boot.cuff.left',
        'boot.cuff.right',
      ]),
    );
    const renderProfileOperation = plan.patch.operations.find(
      ({ operation }) => operation === 'upsertRenderProfile',
    );
    expect(renderProfileOperation?.operation).toBe('upsertRenderProfile');
    if (renderProfileOperation?.operation === 'upsertRenderProfile')
      expect(
        renderProfileOperation.renderProfile.requiredFeaturePartIds,
      ).toEqual(
        expect.arrayContaining([
          'face.eye.left',
          'face.eye.right',
          'face.nose',
          'face.mouth',
          'hair.back',
          'hair.fringe.left',
          'hair.fringe.center',
          'hair.fringe.right',
          'hand.left',
          'hand.right',
          'helmet.emblem',
          'helmet.ridge',
          'pouch.center',
        ]),
      );

    const transformFor = (partId: string) =>
      plan.patch.operations.find(
        (operation) =>
          operation.operation === 'setPartTransform' &&
          operation.partId === partId,
      );
    expect(transformFor('upper-arm.left')).toMatchObject({
      transform: { rotation: [0, 0, expect.any(Number), expect.any(Number)] },
    });
    expect(transformFor('upper-arm.right')).toMatchObject({
      transform: { rotation: [0, 0, expect.any(Number), expect.any(Number)] },
    });
    const leftRotation = transformFor('upper-arm.left');
    const rightRotation = transformFor('upper-arm.right');
    if (
      leftRotation?.operation !== 'setPartTransform' ||
      rightRotation?.operation !== 'setPartTransform'
    )
      return;
    expect(leftRotation.transform.rotation[2]).toBeLessThan(-0.19);
    expect(rightRotation.transform.rotation[2]).toBeGreaterThan(0.19);
  });

  it('binds the reference-specific peach, teal, and high-contrast face palette', () => {
    const plan = compileHumanoidMorphology(profile()).referenceGeometry;
    const bindingFor = (partId: string) =>
      plan.patch.operations.find(
        (operation) =>
          operation.operation === 'setMaterialBinding' &&
          operation.partId === partId,
      );

    for (const [partId, slot] of [
      ['body.root', 'body'],
      ['pelvis', 'cloth'],
      ['tunic', 'cloth'],
      ['shin.left', 'cloth'],
    ] as const)
      expect(bindingFor(partId)).toMatchObject({
        slot,
        materialId: 'cloth.guard-teal',
      });
    for (const [partId, slot] of [
      ['head', 'skin'],
      ['hand.left', 'skin'],
    ] as const)
      expect(bindingFor(partId)).toMatchObject({
        slot,
        materialId: 'skin.peach',
      });
    for (const partId of ['face.eye.left', 'face.mouth'])
      expect(bindingFor(partId)).toMatchObject({
        materialId: partId === 'face.mouth' ? 'mouth.soft' : 'face.ink',
      });
    expect(bindingFor('helmet.emblem')).toMatchObject({
      materialId: 'iron.guard-highlight',
    });
    expect(bindingFor('helmet.dome')).toMatchObject({
      materialId: 'iron.guard-grey',
    });
  });

  it('adapts public morphology mount envelopes to the reference equipment silhouette', () => {
    const plan = compileHumanoidMorphology(profile());
    const envelope = (id: string) =>
      plan.mountEnvelopes.find((candidate) => candidate.id === id)!;

    expect(envelope('mount.head').halfExtents[1]).toBeGreaterThan(0.35);
    expect(plan.referenceGeometry.mountEnvelopeOverrides).toHaveLength(1);
    expect(plan.validation.mountEnvelopeCount).toBe(6);
  });

  it('fails closed on incomplete anatomy and mount inputs', () => {
    const morphology = compileHumanoidMorphology(profile());
    const compileWith = (
      anatomy = morphology.partAdjustments,
      envelopes = morphology.mountEnvelopes,
    ) => compileChibiGuardReferenceGeometry(profile(), anatomy, envelopes);

    expect(() =>
      compileWith(
        morphology.partAdjustments.filter(
          ({ semanticRole }) => semanticRole !== 'anatomy.torso',
        ),
      ),
    ).toThrow(/anatomy\.torso/u);
    expect(() =>
      compileWith(
        morphology.partAdjustments.filter(
          ({ partId }) => partId !== 'hand.left',
        ),
      ),
    ).toThrow(/hand\.left/u);
    expect(() =>
      compileWith(
        morphology.partAdjustments,
        morphology.mountEnvelopes.filter(({ id }) => id !== 'mount.head'),
      ),
    ).toThrow(/mount\.head/u);
  });

  it('preserves S14 hair coverage and catalog-owned fixed-size oval eyes', () => {
    const morphology = compileHumanoidMorphology(profile());
    const sparseProfile = {
      ...profile(),
      proportions: {
        ...profile().proportions,
        headScale: -1,
        headWidth: -1,
        headDepth: -1,
      },
      features: { ...profile().features, hairStyle: 'none' as const },
    };
    const tinyAnatomy = morphology.partAdjustments.map((adjustment) =>
      adjustment.partId === 'head'
        ? { ...adjustment, targetWorldScale: [0.2, 0.2, 0.2] as const }
        : adjustment,
    );
    const plan = compileChibiGuardReferenceGeometry(
      sparseProfile,
      tinyAnatomy,
      morphology.mountEnvelopes,
    );
    const eyeTemplate = rusticTemplates.find(
      ({ id }) => id === 'human.face-eye',
    );

    expect(plan.requiredExistingPartIds).toEqual(
      expect.arrayContaining([
        'hair.back',
        'hair.fringe.left',
        'hair.fringe.center',
        'hair.fringe.right',
      ]),
    );
    expect(
      plan.patch.operations.some(
        (operation) =>
          operation.operation === 'setPartShapeParameters' &&
          operation.partId.startsWith('face.eye.'),
      ),
    ).toBe(false);
    expect(eyeTemplate?.shape).toMatchObject({
      kind: 'ellipsoid',
      radiusX: 0.015,
      radiusY: 0.035,
    });
  });
});
