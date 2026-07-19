import { z } from 'zod';

import { mirrorTransform } from '../assembly/index.js';
import {
  AssetDocumentSchema,
  PartTemplateDefinitionSchema,
  type AccessoryMetadata,
  type AssetDocument,
  type ConnectionDefinition,
  type MaterialDefinition,
  type PartInstance,
  type PartTemplateDefinition,
  type PortCompatibilityTag,
  type PortDefinition,
  type PoseDefinition,
  type Transform,
  type VariantDefinition,
} from '../contracts/index.js';
import {
  getRusticAccessoryCatalogEntry,
  rusticAccessoryTemplates,
} from './accessories.js';

export const RUSTIC_KIT_ID = 'rustic-human' as const;
const identity = (): Transform => ({
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
});
const at = (x: number, y: number, z: number): Transform => ({
  ...identity(),
  position: [x, y, z],
});
const port = (
  id: string,
  position: [number, number, number],
  tags: PortCompatibilityTag[],
  accepts: PortCompatibilityTag[],
  cardinality: 'single' | 'multiple' = 'single',
): PortDefinition => ({
  id,
  frame: at(...position),
  tags,
  accepts,
  cardinality,
});
const anatomyPort = (
  id: string,
  position: [number, number, number],
): PortDefinition => port(id, position, ['anatomy.mount'], ['anatomy.attach']);
const attachPort = (
  id: string,
  position: [number, number, number],
): PortDefinition => port(id, position, ['anatomy.attach'], ['anatomy.mount']);
const template = (
  id: string,
  role: string,
  shape: PartTemplateDefinition['shape'],
  materialSlots: string[],
  ports: PortDefinition[] = [],
  accessory?: AccessoryMetadata,
): PartTemplateDefinition => ({
  id,
  role,
  shape,
  materialSlots,
  ports,
  ...(accessory === undefined ? {} : { accessory }),
});

export const rusticMaterials: readonly MaterialDefinition[] = [
  {
    id: 'skin.warm',
    family: 'skin',
    color: '#d29368',
    roughness: 0.9,
    metalness: 0,
  },
  {
    id: 'cloth.moss',
    family: 'cloth',
    color: '#667a51',
    roughness: 0.95,
    metalness: 0,
  },
  {
    id: 'cloth.umber',
    family: 'cloth',
    color: '#4a407f',
    roughness: 0.95,
    metalness: 0,
  },
  {
    id: 'leather.dark',
    family: 'leather',
    color: '#70412f',
    roughness: 0.88,
    metalness: 0,
  },
  {
    id: 'leather.tan',
    family: 'leather',
    color: '#d8b24c',
    roughness: 0.88,
    metalness: 0,
  },
  {
    id: 'wood.oak',
    family: 'wood',
    color: '#a46d38',
    roughness: 0.9,
    metalness: 0,
  },
  {
    id: 'wood.dark',
    family: 'wood',
    color: '#321b12',
    roughness: 0.92,
    metalness: 0,
  },
  {
    id: 'iron.weathered',
    family: 'iron',
    color: '#d7dfdc',
    roughness: 0.68,
    metalness: 0.72,
  },
  {
    id: 'iron.blued',
    family: 'iron',
    color: '#315f96',
    roughness: 0.7,
    metalness: 0.68,
  },
  {
    id: 'stone.lime',
    family: 'stone',
    color: '#b6ae96',
    roughness: 1,
    metalness: 0,
  },
  {
    id: 'foliage.pine',
    family: 'foliage',
    color: '#53784f',
    roughness: 1,
    metalness: 0,
  },
  {
    id: 'hair.chestnut',
    family: 'fur',
    color: '#714838',
    roughness: 1,
    metalness: 0,
  },
  {
    id: 'bronze.aged',
    family: 'bronze',
    color: '#c99a22',
    roughness: 0.72,
    metalness: 0.66,
  },
  {
    id: 'bone.ivory',
    family: 'bone',
    color: '#c8b995',
    roughness: 0.9,
    metalness: 0,
  },
  {
    id: 'crystal.arcane',
    family: 'crystal',
    color: '#7f73b8',
    roughness: 0.28,
    metalness: 0.08,
    emissive: '#241d45',
  },
];

export const rusticTemplates: readonly PartTemplateDefinition[] = [
  template(
    'human.torso',
    'anatomy.torso',
    { kind: 'beveledBox', width: 0.52, height: 0.68, depth: 0.28, bevel: 0.05 },
    ['body'],
    [
      anatomyPort('neck', [0, 0.39, 0]),
      anatomyPort('hip', [0, -0.39, 0]),
      anatomyPort('shoulder.left', [-0.32, 0.24, 0]),
      anatomyPort('shoulder.right', [0.32, 0.24, 0]),
      port(
        'equipment.body',
        [0, 0, 0.17],
        ['equipment.mount'],
        ['equipment.grip'],
      ),
      port(
        'equipment.back',
        [0, 0, -0.17],
        ['equipment.mount'],
        ['equipment.grip'],
      ),
    ],
  ),
  template(
    'human.head',
    'anatomy.head',
    {
      kind: 'ellipsoid',
      radiusX: 0.19,
      radiusY: 0.23,
      radiusZ: 0.18,
      widthSegments: 10,
      heightSegments: 6,
    },
    ['skin'],
    [
      attachPort('neck.attach', [0, -0.22, 0]),
      anatomyPort('hair', [0, 0.08, 0]),
      port(
        'equipment.head',
        [0, 0.16, 0],
        ['equipment.mount'],
        ['equipment.grip'],
      ),
    ],
  ),
  template(
    'human.hair',
    'clothing.hair-mass',
    {
      kind: 'ellipsoid',
      radiusX: 0.205,
      radiusY: 0.14,
      radiusZ: 0.195,
      widthSegments: 9,
      heightSegments: 5,
    },
    ['hair'],
    [attachPort('head.attach', [0, -0.08, 0])],
  ),
  template(
    'human.pelvis',
    'anatomy.pelvis',
    { kind: 'beveledBox', width: 0.46, height: 0.3, depth: 0.27, bevel: 0.04 },
    ['cloth'],
    [
      attachPort('torso.attach', [0, 0.18, 0]),
      anatomyPort('leg.left', [-0.15, -0.17, 0]),
      anatomyPort('leg.right', [0.15, -0.17, 0]),
      port(
        'equipment.waist',
        [0, 0, 0.16],
        ['equipment.mount'],
        ['equipment.grip'],
      ),
    ],
  ),
  template(
    'human.upper-arm',
    'anatomy.upper-arm',
    {
      kind: 'capsule',
      radius: 0.095,
      cylinderHeight: 0.32,
      radialSegments: 8,
      capSegments: 4,
    },
    ['cloth'],
    [
      attachPort('shoulder.attach', [0, 0.25, 0]),
      anatomyPort('elbow', [0, -0.25, 0]),
    ],
  ),
  template(
    'human.forearm',
    'anatomy.forearm',
    {
      kind: 'capsule',
      radius: 0.082,
      cylinderHeight: 0.3,
      radialSegments: 8,
      capSegments: 4,
    },
    ['skin'],
    [
      attachPort('elbow.attach', [0, 0.23, 0]),
      anatomyPort('wrist', [0, -0.23, 0]),
    ],
  ),
  template(
    'human.hand',
    'anatomy.hand',
    { kind: 'beveledBox', width: 0.13, height: 0.2, depth: 0.1, bevel: 0.025 },
    ['skin'],
    [
      attachPort('wrist.attach', [0, 0.11, 0]),
      port(
        'equipment',
        [0, -0.04, 0.09],
        ['equipment.mount'],
        ['equipment.grip'],
      ),
    ],
  ),
  template(
    'human.thigh',
    'anatomy.thigh',
    {
      kind: 'capsule',
      radius: 0.12,
      cylinderHeight: 0.42,
      radialSegments: 8,
      capSegments: 4,
    },
    ['cloth'],
    [
      attachPort('hip.attach', [0, 0.31, 0]),
      anatomyPort('knee', [0, -0.31, 0]),
    ],
  ),
  template(
    'human.shin',
    'anatomy.shin',
    {
      kind: 'capsule',
      radius: 0.1,
      cylinderHeight: 0.4,
      radialSegments: 8,
      capSegments: 4,
    },
    ['cloth'],
    [
      attachPort('knee.attach', [0, 0.29, 0]),
      anatomyPort('ankle', [0, -0.29, 0]),
    ],
  ),
  template(
    'human.foot',
    'anatomy.foot',
    { kind: 'wedge', width: 0.21, height: 0.17, depth: 0.37 },
    ['leather'],
    [attachPort('ankle.attach', [0, 0.09, -0.07])],
  ),
  template(
    'human.tunic',
    'clothing.tunic-shell',
    { kind: 'wedge', width: 0.59, height: 0.73, depth: 0.33 },
    ['cloth'],
  ),
  ...rusticAccessoryTemplates,
  template(
    'prop.crate',
    'prop.container',
    { kind: 'beveledBox', width: 0.9, height: 0.8, depth: 0.8, bevel: 0.015 },
    ['wood'],
    [
      port('band.low', [-0.25, 0, 0.43], ['prop.mount'], ['prop.attach']),
      port('band.high', [0.25, 0, 0.43], ['prop.mount'], ['prop.attach']),
    ],
  ),
  template(
    'prop.crate-band',
    'prop.reinforcement',
    { kind: 'beveledBox', width: 0.1, height: 0.78, depth: 0.06, bevel: 0.01 },
    ['metal'],
    [port('crate.attach', [0, 0, 0], ['prop.attach'], ['prop.mount'])],
  ),
  template(
    'tree.trunk',
    'vegetation.trunk',
    { kind: 'cone', radius: 0.36, height: 2.35, radialSegments: 9 },
    ['wood'],
    [
      port(
        'root.east',
        [0, -1.04, 0],
        ['vegetation.mount'],
        ['vegetation.attach'],
      ),
      port(
        'root.west',
        [0, -1.04, 0],
        ['vegetation.mount'],
        ['vegetation.attach'],
      ),
      port(
        'branch.east',
        [0, 0.49, 0],
        ['vegetation.mount'],
        ['vegetation.attach'],
      ),
      port(
        'branch.west',
        [0, 0.69, 0],
        ['vegetation.mount'],
        ['vegetation.attach'],
      ),
      port(
        'crown.main',
        [0, 1.29, 0],
        ['vegetation.mount'],
        ['vegetation.attach'],
      ),
      port(
        'crown.east',
        [0.55, 0.99, 0.05],
        ['vegetation.mount'],
        ['vegetation.attach'],
      ),
      port(
        'crown.west',
        [-0.58, 1.09, -0.02],
        ['vegetation.mount'],
        ['vegetation.attach'],
      ),
    ],
  ),
  template(
    'tree.root',
    'vegetation.root',
    {
      kind: 'tubePath',
      path: [
        [0, 0, 0],
        [0.45, -0.08, 0.1],
        [0.8, -0.12, 0.18],
      ],
      radius: 0.09,
      radialSegments: 7,
    },
    ['wood'],
    [
      port(
        'trunk.attach',
        [0, 0, 0],
        ['vegetation.attach'],
        ['vegetation.mount'],
      ),
    ],
  ),
  template(
    'tree.branch',
    'vegetation.branch',
    {
      kind: 'tubePath',
      path: [
        [0, 0, 0],
        [0.45, 0.22, 0],
        [0.82, 0.32, 0.06],
      ],
      radius: 0.095,
      radialSegments: 7,
    },
    ['wood'],
    [
      port(
        'trunk.attach',
        [0, 0, 0],
        ['vegetation.attach'],
        ['vegetation.mount'],
      ),
    ],
  ),
  template(
    'tree.foliage',
    'vegetation.foliage-cluster',
    {
      kind: 'ellipsoid',
      radiusX: 0.76,
      radiusY: 0.55,
      radiusZ: 0.66,
      widthSegments: 9,
      heightSegments: 6,
    },
    ['foliage'],
    [
      port(
        'trunk.attach',
        [0, 0, 0],
        ['vegetation.attach'],
        ['vegetation.mount'],
      ),
    ],
  ),
  template(
    'cottage.wall',
    'structure.wall',
    { kind: 'beveledBox', width: 2.8, height: 1.8, depth: 0.22, bevel: 0.035 },
    ['stone'],
    [
      port('wall.attach', [0, 0, 0], ['structure.attach'], ['structure.mount']),
      port(
        'wall.back',
        [0, 0, -2.2],
        ['structure.mount'],
        ['structure.attach'],
      ),
      port(
        'wall.left',
        [-1.4, 0, -1.1],
        ['structure.mount'],
        ['structure.attach'],
      ),
      port(
        'wall.right',
        [1.4, 0, -1.1],
        ['structure.mount'],
        ['structure.attach'],
      ),
      port(
        'timber.left',
        [-1.05, 0.07, 0.14],
        ['structure.mount'],
        ['structure.attach'],
      ),
      port(
        'timber.right',
        [1.05, 0.07, 0.14],
        ['structure.mount'],
        ['structure.attach'],
      ),
      port(
        'door.front',
        [0, -0.23, 0.15],
        ['structure.mount'],
        ['structure.attach'],
      ),
      port(
        'window.left',
        [-0.78, 0.13, 0.16],
        ['structure.mount'],
        ['structure.attach'],
      ),
      port(
        'window.right',
        [0.78, 0.13, 0.16],
        ['structure.mount'],
        ['structure.attach'],
      ),
      port(
        'roof.main',
        [0, 1.29, -1.1],
        ['structure.mount'],
        ['structure.attach'],
      ),
      port(
        'chimney',
        [0.82, 1.54, -1.38],
        ['structure.mount'],
        ['structure.attach'],
      ),
    ],
  ),
  template(
    'cottage.side-wall',
    'structure.wall',
    { kind: 'beveledBox', width: 2.2, height: 1.8, depth: 0.22, bevel: 0.035 },
    ['stone'],
    [port('wall.attach', [0, 0, 0], ['structure.attach'], ['structure.mount'])],
  ),
  template(
    'cottage.timber',
    'structure.timber-frame',
    {
      kind: 'beveledBox',
      width: 0.16,
      height: 1.95,
      depth: 0.28,
      bevel: 0.025,
    },
    ['wood'],
    [port('wall.attach', [0, 0, 0], ['structure.attach'], ['structure.mount'])],
  ),
  template(
    'cottage.door',
    'structure.door',
    {
      kind: 'beveledBox',
      width: 0.76,
      height: 1.35,
      depth: 0.14,
      bevel: 0.035,
    },
    ['wood'],
    [port('wall.attach', [0, 0, 0], ['structure.attach'], ['structure.mount'])],
  ),
  template(
    'cottage.window',
    'structure.window',
    { kind: 'flatCard', width: 0.52, height: 0.6 },
    ['metal'],
    [port('wall.attach', [0, 0, 0], ['structure.attach'], ['structure.mount'])],
  ),
  template(
    'cottage.roof',
    'structure.roof',
    { kind: 'wedge', width: 3.25, height: 1.05, depth: 2.55 },
    ['cloth'],
    [port('wall.attach', [0, 0, 0], ['structure.attach'], ['structure.mount'])],
  ),
  template(
    'cottage.chimney',
    'structure.chimney',
    { kind: 'beveledBox', width: 0.38, height: 1.35, depth: 0.38, bevel: 0.04 },
    ['stone'],
    [port('wall.attach', [0, 0, 0], ['structure.attach'], ['structure.mount'])],
  ),
];

export const KitTemplateManifestSchema = z
  .object({
    template: PartTemplateDefinitionSchema,
    parameterBounds: z.record(
      z.string().min(1),
      z.tuple([z.number().finite(), z.number().finite()]),
    ),
    intendedReferences: z
      .array(z.enum(['adventurer', 'crate', 'tree', 'cottage']))
      .min(1),
  })
  .strict();
export type KitTemplateManifest = z.infer<typeof KitTemplateManifestSchema>;

const numericBounds = (
  entry: PartTemplateDefinition,
): Record<string, [number, number]> => {
  const dimension = (): [number, number] => [0.001, 1_000];
  const segments = (): [number, number] => [3, 128];
  switch (entry.shape.kind) {
    case 'box':
    case 'wedge':
      return { width: dimension(), height: dimension(), depth: dimension() };
    case 'beveledBox':
      return {
        width: dimension(),
        height: dimension(),
        depth: dimension(),
        bevel: [
          0.001,
          Math.min(entry.shape.width, entry.shape.height, entry.shape.depth) /
            2 -
            Number.EPSILON,
        ],
      };
    case 'prism':
      return { radius: dimension(), height: dimension(), sides: segments() };
    case 'cylinder':
    case 'cone':
      return {
        radius: dimension(),
        height: dimension(),
        radialSegments: segments(),
      };
    case 'ellipsoid':
      return {
        radiusX: dimension(),
        radiusY: dimension(),
        radiusZ: dimension(),
        widthSegments: segments(),
        heightSegments: [2, 128],
      };
    case 'capsule':
      return {
        radius: dimension(),
        cylinderHeight: dimension(),
        radialSegments: segments(),
        capSegments: [2, 128],
      };
    case 'extrudedProfile':
      return { depth: dimension(), profilePoints: [3, 256] };
    case 'lathedProfile':
      return { profilePoints: [2, 256], radialSegments: segments() };
    case 'tubePath':
      return {
        pathPoints: [2, 256],
        radius: dimension(),
        radialSegments: segments(),
      };
    case 'flatCard':
      return { width: dimension(), height: dimension() };
  }
};
const intendedReferences = (
  entry: PartTemplateDefinition,
): KitTemplateManifest['intendedReferences'] =>
  entry.id.startsWith('human.') || entry.id.startsWith('equipment.')
    ? ['adventurer']
    : entry.id.startsWith('prop.')
      ? ['crate']
      : entry.id.startsWith('tree.')
        ? ['tree']
        : ['cottage'];
export const rusticManifest: readonly KitTemplateManifest[] =
  rusticTemplates.map((entry) =>
    KitTemplateManifestSchema.parse({
      template: entry,
      parameterBounds: numericBounds(entry),
      intendedReferences: intendedReferences(entry),
    }),
  );

const bind = (slot: string, materialId: string) => ({ slot, materialId });
const part = (
  id: string,
  templateId: string,
  materialId: string,
  transform: Transform = identity(),
  slot = rusticTemplates.find((entry) => entry.id === templateId)
    ?.materialSlots[0] ?? 'body',
  handedness?: PartInstance['handedness'],
): PartInstance => ({
  id,
  templateId,
  handedness:
    handedness ??
    (id.endsWith('.left')
      ? 'left'
      : id.endsWith('.right')
        ? 'right'
        : 'neutral'),
  transform,
  materialBindings: [bind(slot, materialId)],
  visible: true,
});
const connect = (
  id: string,
  parentPartId: string,
  parentPortId: string,
  childPartId: string,
  childPortId: string,
  joint?: ConnectionDefinition['joint'],
): ConnectionDefinition => ({
  id,
  parentPartId,
  parentPortId,
  childPartId,
  childPortId,
  ...(joint === undefined ? {} : { joint }),
});
const hinge = {
  kind: 'hinge' as const,
  axis: [0, 0, 1] as [number, number, number],
  minDegrees: -95,
  maxDegrees: 95,
};

const adventurerParts: PartInstance[] = [
  part('torso', 'human.torso', 'cloth.moss', at(0, 1.42, 0)),
  part('head', 'human.head', 'skin.warm'),
  part('hair', 'human.hair', 'hair.chestnut'),
  part('pelvis', 'human.pelvis', 'cloth.umber'),
  part('upper-arm.left', 'human.upper-arm', 'cloth.moss'),
  part('upper-arm.right', 'human.upper-arm', 'cloth.moss'),
  part('forearm.left', 'human.forearm', 'skin.warm'),
  part('forearm.right', 'human.forearm', 'skin.warm'),
  part('hand.left', 'human.hand', 'skin.warm'),
  part('hand.right', 'human.hand', 'skin.warm'),
  part('thigh.left', 'human.thigh', 'cloth.umber'),
  part('thigh.right', 'human.thigh', 'cloth.umber'),
  part('shin.left', 'human.shin', 'cloth.moss'),
  part('shin.right', 'human.shin', 'cloth.moss'),
  part('foot.left', 'human.foot', 'leather.dark'),
  part('foot.right', 'human.foot', 'leather.dark'),
  part('tunic', 'human.tunic', 'cloth.moss', at(0, 1.4, 0.01)),
  part(
    'sword',
    'equipment.sword',
    'iron.weathered',
    getRusticAccessoryCatalogEntry('equipment.sword')!.usage.placements.find(
      ({ slot }) => slot === 'main-hand',
    )!.transform,
  ),
  part(
    'shield',
    'equipment.shield',
    'wood.oak',
    getRusticAccessoryCatalogEntry('equipment.shield')!.usage.placements.find(
      ({ slot }) => slot === 'off-hand',
    )!.transform,
  ),
];
const adventurerConnections: ConnectionDefinition[] = [
  connect('torso-head', 'torso', 'neck', 'head', 'neck.attach'),
  connect('head-hair', 'head', 'hair', 'hair', 'head.attach'),
  connect('torso-pelvis', 'torso', 'hip', 'pelvis', 'torso.attach'),
  connect(
    'shoulder-left',
    'torso',
    'shoulder.left',
    'upper-arm.left',
    'shoulder.attach',
    hinge,
  ),
  connect(
    'shoulder-right',
    'torso',
    'shoulder.right',
    'upper-arm.right',
    'shoulder.attach',
    hinge,
  ),
  connect(
    'elbow-left',
    'upper-arm.left',
    'elbow',
    'forearm.left',
    'elbow.attach',
    hinge,
  ),
  connect(
    'elbow-right',
    'upper-arm.right',
    'elbow',
    'forearm.right',
    'elbow.attach',
    hinge,
  ),
  connect('wrist-left', 'forearm.left', 'wrist', 'hand.left', 'wrist.attach'),
  connect(
    'wrist-right',
    'forearm.right',
    'wrist',
    'hand.right',
    'wrist.attach',
  ),
  connect('hip-left', 'pelvis', 'leg.left', 'thigh.left', 'hip.attach', hinge),
  connect(
    'hip-right',
    'pelvis',
    'leg.right',
    'thigh.right',
    'hip.attach',
    hinge,
  ),
  connect('knee-left', 'thigh.left', 'knee', 'shin.left', 'knee.attach', hinge),
  connect(
    'knee-right',
    'thigh.right',
    'knee',
    'shin.right',
    'knee.attach',
    hinge,
  ),
  connect('ankle-left', 'shin.left', 'ankle', 'foot.left', 'ankle.attach'),
  connect('ankle-right', 'shin.right', 'ankle', 'foot.right', 'ankle.attach'),
  connect('equip-sword', 'hand.right', 'equipment', 'sword', 'grip'),
  connect('equip-shield', 'hand.left', 'equipment', 'shield', 'grip'),
];

export const adventurerVariants: readonly VariantDefinition[] = [
  {
    id: 'short',
    overrides: [
      { partId: 'torso', transform: { ...identity(), scale: [1, 0.86, 1] } },
      {
        partId: 'thigh.left',
        transform: { ...identity(), scale: [1, 0.82, 1] },
      },
      {
        partId: 'thigh.right',
        transform: { ...identity(), scale: [1, 0.82, 1] },
      },
    ],
  },
  {
    id: 'tall',
    overrides: [
      { partId: 'torso', transform: { ...identity(), scale: [1, 1.14, 1] } },
      {
        partId: 'shin.left',
        transform: { ...identity(), scale: [1, 1.18, 1] },
      },
      {
        partId: 'shin.right',
        transform: { ...identity(), scale: [1, 1.18, 1] },
      },
    ],
  },
  {
    id: 'broad',
    overrides: [
      { partId: 'torso', transform: { ...identity(), scale: [1.2, 1, 1.08] } },
      { partId: 'pelvis', transform: { ...identity(), scale: [1.12, 1, 1] } },
    ],
  },
  {
    id: 'slender',
    overrides: [
      {
        partId: 'torso',
        transform: { ...identity(), scale: [0.82, 1.05, 0.88] },
      },
      { partId: 'pelvis', transform: { ...identity(), scale: [0.88, 1, 0.9] } },
    ],
  },
  { id: 'equipped', overrides: [] },
  {
    id: 'unequipped',
    overrides: [
      { partId: 'sword', visible: false },
      { partId: 'shield', visible: false },
    ],
  },
];
export const adventurerPoses: readonly PoseDefinition[] = [
  {
    id: 'idle',
    overrides: [
      { partId: 'upper-arm.left', jointValueDegrees: -8 },
      { partId: 'upper-arm.right', jointValueDegrees: 8 },
    ],
  },
  {
    id: 'action',
    overrides: [
      { partId: 'upper-arm.left', jointValueDegrees: -48 },
      { partId: 'upper-arm.right', jointValueDegrees: 62 },
      { partId: 'forearm.right', jointValueDegrees: -42 },
      { partId: 'thigh.left', jointValueDegrees: 14 },
      { partId: 'thigh.right', jointValueDegrees: -14 },
    ],
  },
];

const documentBase = (
  id: string,
  name: string,
  seed: number,
  requiredFeaturePartIds: readonly string[],
) => ({
  schemaVersion: '1.0.0' as const,
  id,
  name,
  unit: 'meter' as const,
  seed,
  kitId: RUSTIC_KIT_ID,
  triangleBudget: 2_000,
  materials: [...rusticMaterials],
  templates: [...rusticTemplates],
  variants: [] as VariantDefinition[],
  poses: [] as PoseDefinition[],
  renderProfiles: [
    {
      id: 'sprite.default',
      widthPixels: 128,
      heightPixels: 128,
      elevationDegrees: 30,
      directions: 8 as const,
      paddingPixels: 6,
      transparent: true as const,
      minimumFeaturePixels: 3,
      requiredFeaturePartIds: [...requiredFeaturePartIds],
    },
  ],
});
const parseDocument = (value: unknown): AssetDocument =>
  AssetDocumentSchema.parse(value);

export const adventurerDocument = parseDocument({
  ...documentBase('adventurer.rustic', 'Rustic Adventurer', 4096, ['torso']),
  assembly: {
    id: 'adventurer.assembly',
    parts: adventurerParts,
    connections: adventurerConnections,
  },
  variants: [...adventurerVariants],
  poses: [...adventurerPoses],
  activeVariantId: 'equipped',
  activePoseId: 'idle',
});
export const crateDocument = parseDocument({
  ...documentBase('crate.rustic', 'Iron-Banded Crate', 101, ['crate.body']),
  assembly: {
    id: 'crate.assembly',
    parts: [
      part('crate.body', 'prop.crate', 'wood.oak', at(0, 0.38, 0)),
      part('crate.band.low', 'prop.crate-band', 'iron.weathered'),
      part('crate.band.high', 'prop.crate-band', 'iron.weathered'),
    ],
    connections: [
      connect(
        'crate-band-low',
        'crate.body',
        'band.low',
        'crate.band.low',
        'crate.attach',
      ),
      connect(
        'crate-band-high',
        'crate.body',
        'band.high',
        'crate.band.high',
        'crate.attach',
      ),
    ],
  },
});
export const treeDocument = parseDocument({
  ...documentBase('tree.rustic', 'Old Roadside Tree', 202, [
    'tree.branch.east',
  ]),
  assembly: {
    id: 'tree.assembly',
    parts: [
      part('trunk.main', 'tree.trunk', 'wood.dark', at(0, 1.16, 0)),
      part('tree.root.east', 'tree.root', 'wood.dark'),
      part(
        'tree.root.west',
        'tree.root',
        'wood.dark',
        mirrorTransform(identity(), 'x'),
        undefined,
        'left',
      ),
      part('tree.branch.east', 'tree.branch', 'wood.dark'),
      part(
        'tree.branch.west',
        'tree.branch',
        'wood.dark',
        mirrorTransform(identity(), 'x'),
        undefined,
        'left',
      ),
      part('tree.crown', 'tree.foliage', 'foliage.pine'),
      part('tree.crown.east', 'tree.foliage', 'foliage.pine', {
        ...identity(),
        scale: [0.72, 0.72, 0.72],
      }),
      part('tree.crown.west', 'tree.foliage', 'foliage.pine', {
        ...identity(),
        scale: [0.68, 0.68, 0.68],
      }),
    ],
    connections: [
      connect(
        'tree-root-east',
        'trunk.main',
        'root.east',
        'tree.root.east',
        'trunk.attach',
      ),
      connect(
        'tree-root-west',
        'trunk.main',
        'root.west',
        'tree.root.west',
        'trunk.attach',
      ),
      connect(
        'tree-branch-east',
        'trunk.main',
        'branch.east',
        'tree.branch.east',
        'trunk.attach',
      ),
      connect(
        'tree-branch-west',
        'trunk.main',
        'branch.west',
        'tree.branch.west',
        'trunk.attach',
      ),
      connect(
        'tree-crown-main',
        'trunk.main',
        'crown.main',
        'tree.crown',
        'trunk.attach',
      ),
      connect(
        'tree-crown-east',
        'trunk.main',
        'crown.east',
        'tree.crown.east',
        'trunk.attach',
      ),
      connect(
        'tree-crown-west',
        'trunk.main',
        'crown.west',
        'tree.crown.west',
        'trunk.attach',
      ),
    ],
  },
});
export const cottageDocument = parseDocument({
  ...documentBase('cottage.rustic', 'Wayside Timber Cottage', 303, ['chimney']),
  assembly: {
    id: 'cottage.assembly',
    parts: [
      part('wall.front', 'cottage.wall', 'stone.lime', at(0, 0.91, 1.1)),
      part('wall.back', 'cottage.wall', 'stone.lime'),
      part('wall.left', 'cottage.side-wall', 'stone.lime', {
        ...identity(),
        rotation: [0, 0.70710678, 0, 0.70710678],
      }),
      part('wall.right', 'cottage.side-wall', 'stone.lime', {
        ...identity(),
        rotation: [0, 0.70710678, 0, 0.70710678],
      }),
      part('timber.left', 'cottage.timber', 'wood.dark'),
      part('timber.right', 'cottage.timber', 'wood.dark'),
      part('door.front', 'cottage.door', 'wood.oak'),
      part('window.left', 'cottage.window', 'iron.weathered'),
      part('window.right', 'cottage.window', 'iron.weathered'),
      part('roof.main', 'cottage.roof', 'cloth.umber'),
      part('chimney', 'cottage.chimney', 'stone.lime'),
    ],
    connections: [
      connect(
        'cottage-wall-back',
        'wall.front',
        'wall.back',
        'wall.back',
        'wall.attach',
      ),
      connect(
        'cottage-wall-left',
        'wall.front',
        'wall.left',
        'wall.left',
        'wall.attach',
      ),
      connect(
        'cottage-wall-right',
        'wall.front',
        'wall.right',
        'wall.right',
        'wall.attach',
      ),
      connect(
        'cottage-timber-left',
        'wall.front',
        'timber.left',
        'timber.left',
        'wall.attach',
      ),
      connect(
        'cottage-timber-right',
        'wall.front',
        'timber.right',
        'timber.right',
        'wall.attach',
      ),
      connect(
        'cottage-door',
        'wall.front',
        'door.front',
        'door.front',
        'wall.attach',
      ),
      connect(
        'cottage-window-left',
        'wall.front',
        'window.left',
        'window.left',
        'wall.attach',
      ),
      connect(
        'cottage-window-right',
        'wall.front',
        'window.right',
        'window.right',
        'wall.attach',
      ),
      connect(
        'cottage-roof',
        'wall.front',
        'roof.main',
        'roof.main',
        'wall.attach',
      ),
      connect(
        'cottage-chimney',
        'wall.front',
        'chimney',
        'chimney',
        'wall.attach',
      ),
    ],
  },
});

export const referenceDocuments = Object.freeze({
  adventurer: adventurerDocument,
  crate: crateDocument,
  tree: treeDocument,
  cottage: cottageDocument,
});
export function listKitTemplates(): readonly KitTemplateManifest[] {
  return rusticManifest;
}
export function getReferenceDocument(
  id: keyof typeof referenceDocuments,
): AssetDocument {
  return referenceDocuments[id];
}
