import { describe, expect, it } from 'vitest';

import { NovelAssetIdentityRequestSchema } from '../../src/contracts/index.js';
import { applySemanticPatch } from '../../src/document/index.js';
import {
  rusticMaterials,
  rusticTemplates,
} from '../../src/fantasy-kit/catalog.js';
import { compileHumanoidMorphology } from '../../src/fantasy-kit/humanoid-morphology.js';
import {
  compileNovelComposition,
  planNovelAssetBrief,
} from '../../src/fantasy-kit/novel-composition.js';
import {
  NOVEL_ASSET_ARCHETYPES,
  initializeNovelAssetDocument,
  inspectNovelAssetCompleteness,
} from '../../src/fantasy-kit/novel-identities.js';

const featureOperations = [
  {
    partId: 'tunic',
    templateId: 'human.tunic-flared',
    role: 'clothing.tunic-shell',
    parentPartId: 'body.root',
    parentPortId: 'clothing.tunic',
    childPortId: 'torso.attach',
  },
  {
    partId: 'tunic.trim',
    templateId: 'human.tunic-trim',
    role: 'clothing.tunic-trim',
    parentPartId: 'body.root',
    parentPortId: 'clothing.trim',
    childPortId: 'torso.attach',
  },
  {
    partId: 'belt',
    templateId: 'human.guard-belt',
    role: 'clothing.belt',
    parentPartId: 'body.root',
    parentPortId: 'clothing.belt',
    childPortId: 'torso.attach',
  },
  {
    partId: 'collar',
    templateId: 'human.scarf-collar',
    role: 'clothing.scarf-collar',
    parentPartId: 'body.root',
    parentPortId: 'clothing.collar',
    childPortId: 'torso.attach',
  },
  ...(['left', 'center', 'right'] as const).map((side) => ({
    partId: `pouch.${side}`,
    templateId: 'human.guard-pouch',
    role: 'clothing.pouch',
    parentPartId: 'body.root',
    parentPortId: `clothing.pouch.${side}`,
    childPortId: 'torso.attach',
  })),
  {
    partId: 'pouch.center',
    templateId: 'human.guard-pouch',
    role: 'clothing.pouch',
    parentPartId: 'body.root',
    parentPortId: 'clothing.pouch.center',
    childPortId: 'torso.attach',
  },
  {
    partId: 'face.eye.left',
    templateId: 'human.face-eye',
    role: 'feature.face-eye',
    parentPartId: 'head',
    parentPortId: 'face.eye.left',
    childPortId: 'head.attach',
  },
  {
    partId: 'face.eye.right',
    templateId: 'human.face-eye',
    role: 'feature.face-eye',
    parentPartId: 'head',
    parentPortId: 'face.eye.right',
    childPortId: 'head.attach',
  },
  {
    partId: 'face.mouth',
    templateId: 'human.face-mouth',
    role: 'feature.face-mouth',
    parentPartId: 'head',
    parentPortId: 'face.mouth',
    childPortId: 'head.attach',
  },
  {
    partId: 'face.nose',
    templateId: 'human.face-nose',
    role: 'feature.face-nose',
    parentPartId: 'head',
    parentPortId: 'face.nose',
    childPortId: 'head.attach',
  },
  ...(['left', 'right'] as const).map((side) => ({
    partId: `face.ear.${side}`,
    templateId: 'human.face-ear',
    role: 'feature.face-ear',
    parentPartId: 'head',
    parentPortId: `face.ear.${side}`,
    childPortId: 'head.attach',
  })),
  ...(['left', 'right'] as const).map((side) => ({
    partId: `hair.side.${side}`,
    templateId: 'human.hair-side',
    role: 'feature.hair-side',
    parentPartId: 'head',
    parentPortId: `hair.side.${side}`,
    childPortId: 'head.attach',
  })),
  {
    partId: 'hair.back',
    templateId: 'human.hair-back',
    role: 'feature.hair-back',
    parentPartId: 'head',
    parentPortId: 'hair.back',
    childPortId: 'head.attach',
  },
  ...(['left', 'right'] as const).map((side) => ({
    partId: `hair.fringe.${side}`,
    templateId: 'human.hair-fringe',
    role: 'feature.hair-fringe',
    parentPartId: 'head',
    parentPortId: `hair.fringe.${side}`,
    childPortId: 'head.attach',
  })),
  {
    partId: 'helmet.dome',
    templateId: 'human.helmet-dome',
    role: 'feature.helmet-dome',
    parentPartId: 'head',
    parentPortId: 'helmet.dome',
    childPortId: 'head.attach',
  },
  {
    partId: 'helmet.emblem',
    templateId: 'human.helmet-emblem',
    role: 'feature.helmet-emblem',
    parentPartId: 'helmet.dome',
    parentPortId: 'emblem.mount',
    childPortId: 'surface.attach',
  },
  {
    partId: 'helmet.ridge',
    templateId: 'human.helmet-ridge',
    role: 'feature.helmet-ridge',
    parentPartId: 'helmet.dome',
    parentPortId: 'ridge.mount',
    childPortId: 'surface.attach',
  },
  ...(['left', 'right'] as const).map((position) => ({
    partId: `helmet.stud.${position}`,
    templateId: 'human.helmet-stud',
    role: 'feature.helmet-stud',
    parentPartId: 'helmet.dome',
    parentPortId: `stud.${position}`,
    childPortId: 'surface.attach',
  })),
  ...(['left', 'right'] as const).flatMap((side) => [
    {
      partId: `sleeve.cuff.${side}`,
      templateId: 'human.sleeve-cuff',
      role: 'clothing.sleeve-cuff',
      parentPartId: `upper-arm.${side}`,
      parentPortId: 'sleeve.cuff',
      childPortId: 'arm.attach',
    },
    {
      partId: `boot.cuff.${side}`,
      templateId: 'human.boot-cuff',
      role: 'feature.boot-cuff',
      parentPartId: `shin.${side}`,
      parentPortId: 'boot.cuff',
      childPortId: 'shin.attach',
    },
    {
      partId: `boot.toe.${side}`,
      templateId: 'human.boot-toe',
      role: 'feature.boot-toe',
      parentPartId: `foot.${side}`,
      parentPortId: 'toe',
      childPortId: 'foot.attach',
    },
    {
      partId: `boot.sole.${side}`,
      templateId: 'human.boot-sole',
      role: 'feature.boot-sole',
      parentPartId: `foot.${side}`,
      parentPortId: 'sole',
      childPortId: 'foot.attach',
    },
  ]),
] as const;

const morphologyProfile = {
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
};

describe('novel humanoid feature grammar', () => {
  it('registers bounded face templates and unique anatomy mount ports', () => {
    const template = (id: string) =>
      rusticTemplates.find((candidate) => candidate.id === id)!;

    expect(template('human.torso').ports.map(({ id }) => id)).toContain(
      'clothing.tunic',
    );
    expect(template('human.head').ports.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        'hair',
        'hair.back',
        'face.eye.left',
        'face.eye.right',
        'face.mouth',
        'face.nose',
        'face.ear.left',
        'face.ear.right',
        'hair.fringe.left',
        'hair.fringe.center',
        'hair.fringe.right',
        'helmet.crest',
        'helmet.dome',
      ]),
    );
    expect(template('human.foot').ports.map(({ id }) => id)).toContain('toe');
    const helmetPort = template('human.head').ports.find(
      ({ id }) => id === 'helmet.dome',
    );
    expect(helmetPort?.frame.position[1]).toBe(0.28);
    const leftEyePort = template('human.head').ports.find(
      ({ id }) => id === 'face.eye.left',
    );
    expect(leftEyePort?.frame.position[1]).toBe(0.04);
    expect(template('human.tunic-flared').ports).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'torso.attach' })]),
    );
    expect(template('human.hair-back')).toMatchObject({
      role: 'feature.hair-back',
      shape: { kind: 'ellipsoid', radiusZ: 0.045 },
      materialSlots: ['hair'],
      ports: [expect.objectContaining({ id: 'head.attach' })],
    });
    expect(template('human.face-eye')).toMatchObject({
      role: 'feature.face-eye',
      shape: { kind: 'ellipsoid' },
      materialSlots: ['eye'],
      ports: [expect.objectContaining({ id: 'head.attach' })],
      requiredVisualFeatures: [
        expect.objectContaining({
          id: 'face.eye.vertical-mark',
          intendedDirections: ['N'],
          minimumWidthPixels: 2,
        }),
      ],
    });
    expect(template('human.face-nose')).toMatchObject({
      role: 'feature.face-nose',
      shape: { kind: 'ellipsoid' },
      materialSlots: ['skin'],
    });
    expect(template('human.face-ear')).toMatchObject({
      role: 'feature.face-ear',
      shape: { kind: 'ellipsoid' },
      materialSlots: ['skin'],
    });
    expect(template('human.face-cheek')).toBeUndefined();
    expect(template('human.face-mouth')).toMatchObject({
      role: 'feature.face-mouth',
      shape: { kind: 'tubePath' },
      materialSlots: ['mouth'],
      ports: [expect.objectContaining({ id: 'head.attach' })],
    });
    expect(template('human.helmet-crest')).toMatchObject({
      role: 'feature.helmet-crest',
      shape: { kind: 'wedge' },
      materialSlots: ['metal'],
      ports: [expect.objectContaining({ id: 'head.attach' })],
    });
    expect(template('human.hair-fringe')).toMatchObject({
      role: 'feature.hair-fringe',
      shape: { kind: 'ellipsoid' },
      materialSlots: ['hair'],
      ports: [expect.objectContaining({ id: 'head.attach' })],
    });
    const helmetDome = template('human.helmet-dome');
    expect(helmetDome).toMatchObject({
      role: 'feature.helmet-dome',
      shape: { kind: 'lathedProfile' },
      materialSlots: ['metal'],
    });
    expect(helmetDome.ports.map(({ id }) => id)).toEqual(
      expect.arrayContaining(['head.attach', 'emblem.mount']),
    );
    expect(template('human.helmet-emblem')).toMatchObject({
      role: 'feature.helmet-emblem',
      shape: { kind: 'extrudedProfile' },
      materialSlots: ['metal'],
      ports: [expect.objectContaining({ id: 'surface.attach' })],
      requiredVisualFeatures: [
        expect.objectContaining({
          id: 'helmet.emblem.centered-insignia',
          intendedDirections: ['N'],
        }),
      ],
    });
    expect(template('human.boot-toe')).toMatchObject({
      role: 'feature.boot-toe',
      shape: { kind: 'ellipsoid' },
      materialSlots: ['leather'],
      ports: [expect.objectContaining({ id: 'foot.attach' })],
    });
    expect(template('human.scarf-collar')).toMatchObject({
      role: 'clothing.scarf-collar',
      shape: { kind: 'lathedProfile' },
    });
    expect(template('human.sleeve-cuff')).toMatchObject({
      role: 'clothing.sleeve-cuff',
      shape: { kind: 'cylinder' },
    });
    expect(template('human.boot-sole')).toMatchObject({
      role: 'feature.boot-sole',
      shape: { kind: 'wedge' },
    });
    expect(template('human.helmet-stud')).toMatchObject({
      role: 'feature.helmet-stud',
      shape: { kind: 'ellipsoid' },
    });
  });

  it('advertises feature templates inside the closed humanoid grammar', () => {
    const humanoid = NOVEL_ASSET_ARCHETYPES.find(
      ({ id }) => id === 'humanoid.biped.rustic',
    )!;

    expect(humanoid.allowedTemplateIds).toEqual(
      expect.arrayContaining([
        'human.hair',
        'human.hair-back',
        'human.tunic',
        'human.tunic-flared',
        'human.face-eye',
        'human.face-mouth',
        'human.face-nose',
        'human.face-ear',
        'human.helmet-crest',
        'human.hair-fringe',
        'human.helmet-dome',
        'human.helmet-emblem',
        'human.boot-toe',
        'human.hair-side',
        'human.tunic-trim',
        'human.guard-belt',
        'human.guard-pouch',
        'human.boot-cuff',
        'human.boot-sole',
        'human.scarf-collar',
        'human.sleeve-cuff',
        'human.helmet-stud',
      ]),
    );
    expect(humanoid.allowedTemplateIds).not.toContain('human.face-cheek');
  });

  it('plans a deterministic neutral base without held equipment and compiles every feature', () => {
    const first = planNovelAssetBrief(
      'round chibi village sentry wearing a fitted iron helmet',
    );
    const second = planNovelAssetBrief(
      'round chibi village sentry wearing a fitted iron helmet',
    );
    expect(second).toEqual(first);
    expect(first.supported).toBe(true);
    if (!first.supported) return;
    expect(first.suggestedOperations.map(({ partId }) => partId)).not.toEqual(
      expect.arrayContaining([
        'spear',
        'shield.kite',
        'face.cheek.left',
        'face.cheek.right',
        'helmet.iron',
        'helmet.brim',
        'helmet.ear.left',
        'helmet.ear.right',
        'hair',
      ]),
    );
    expect(first.suggestedOperations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          partId: 'tunic',
          templateId: 'human.tunic-flared',
        }),
        expect.objectContaining({ partId: 'tunic.trim' }),
        expect.objectContaining({ partId: 'belt' }),
        expect.objectContaining({ partId: 'hair.side.left' }),
        expect.objectContaining({ partId: 'hair.back' }),
        expect.objectContaining({ partId: 'face.nose' }),
        expect.objectContaining({ partId: 'collar' }),
        expect.objectContaining({ partId: 'pouch.center' }),
        expect.objectContaining({ partId: 'helmet.ridge' }),
        expect.objectContaining({ partId: 'hair.fringe.center' }),
        expect.objectContaining({ partId: 'sleeve.cuff.left' }),
        expect.objectContaining({ partId: 'boot.sole.left' }),
      ]),
    );
    const equipped = planNovelAssetBrief(
      'round chibi village guard with iron helmet, spear, and kite shield',
    );
    expect(equipped.supported).toBe(true);
    if (!equipped.supported) return;
    expect(equipped.suggestedOperations.map(({ partId }) => partId)).toEqual(
      expect.arrayContaining(['spear', 'shield.kite']),
    );

    for (const expected of featureOperations) {
      const suggestion = first.suggestedOperations.find(
        ({ partId }) => partId === expected.partId,
      );
      expect(suggestion).toMatchObject({
        operation: 'add_part',
        partId: expected.partId,
        templateId: expected.templateId,
        role: expected.role,
        attachment: {
          connectionId: `connection.${expected.partId}`,
          parentPartId: expected.parentPartId,
          parentPortId: expected.parentPortId,
          childPortId: expected.childPortId,
        },
      });
    }

    const identity = NovelAssetIdentityRequestSchema.parse({
      assetId: 'guard.reference-ready',
      name: 'Reference Ready Guard',
      kitId: 'rustic-human',
      family: 'humanoid',
      archetypeId: 'humanoid.biped.rustic',
      seed: 42,
    });
    let document = initializeNovelAssetDocument(identity);
    expect(document.triangleBudget).toBe(2_500);
    for (const operation of first.suggestedOperations) {
      const result = applySemanticPatch(
        document,
        compileNovelComposition(document, operation),
      );
      expect(result.ok, operation.partId).toBe(true);
      if (!result.ok) throw new Error(result.issues[0]?.message);
      document = result.document;
    }

    expect(inspectNovelAssetCompleteness(document)).toMatchObject({
      state: 'complete',
      missingRequirements: [],
      unattachedPartIds: [],
    });
    for (const feature of featureOperations)
      expect(document.assembly.connections).toContainEqual(
        expect.objectContaining({
          id: `connection.${feature.partId}`,
          parentPartId: feature.parentPartId,
          parentPortId: feature.parentPortId,
          childPartId: feature.partId,
          childPortId: feature.childPortId,
        }),
      );

    const referenceGeometry = compileHumanoidMorphology(morphologyProfile, {
      torso: 'body.root',
      head: 'head',
      pelvis: 'pelvis',
      upperArmLeft: 'upper-arm.left',
      upperArmRight: 'upper-arm.right',
      forearmLeft: 'forearm.left',
      forearmRight: 'forearm.right',
      handLeft: 'hand.left',
      handRight: 'hand.right',
      thighLeft: 'thigh.left',
      thighRight: 'thigh.right',
      shinLeft: 'shin.left',
      shinRight: 'shin.right',
      footLeft: 'foot.left',
      footRight: 'foot.right',
    }).referenceGeometry;
    expect(
      referenceGeometry.patch.operations.some(
        ({ operation }) => operation === 'addPart',
      ),
    ).toBe(false);
    const geometryResult = applySemanticPatch(
      document,
      referenceGeometry.patch,
    );
    if (!geometryResult.ok)
      throw new Error(JSON.stringify(geometryResult.issues, null, 2));
    expect(geometryResult.ok).toBe(true);
    document = geometryResult.document;
    expect(inspectNovelAssetCompleteness(document)).toMatchObject({
      state: 'complete',
      missingRequirements: [],
      unattachedPartIds: [],
    });
  });

  it('registers the soft peach and teal reference palette', () => {
    const material = (id: string) =>
      rusticMaterials.find((candidate) => candidate.id === id);

    expect(material('skin.peach')).toMatchObject({
      family: 'skin',
      color: '#f8d7c5',
    });
    expect(material('cloth.guard-teal')).toMatchObject({
      family: 'cloth',
      color: '#68b7c3',
    });
    expect(material('cloth.guard-trim')).toMatchObject({
      family: 'cloth',
      color: '#eadfd3',
    });
    expect(material('leather.guard-brown')).toMatchObject({
      family: 'leather',
      color: '#9b633e',
    });
    expect(material('iron.guard-grey')).toMatchObject({
      family: 'iron',
      color: '#91a3a6',
    });
  });
});
