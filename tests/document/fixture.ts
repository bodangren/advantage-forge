import type { AssetDocument } from '../../src/contracts/index.js';

export function assetFixture(): AssetDocument {
  return {
    schemaVersion: '1.0.0',
    id: 'asset.hero',
    name: 'Rustic Hero',
    unit: 'meter',
    seed: 42,
    kitId: 'kit.rustic',
    materials: [
      {
        id: 'material.cloth',
        family: 'cloth',
        color: '#6b4f35',
        roughness: 0.8,
        metalness: 0,
      },
    ],
    templates: [
      {
        id: 'template.torso',
        role: 'body.torso',
        shape: { kind: 'box', width: 0.5, height: 0.7, depth: 0.3 },
        materialSlots: ['surface'],
        ports: [],
      },
      {
        id: 'template.head',
        role: 'body.head',
        shape: {
          kind: 'ellipsoid',
          radiusX: 0.2,
          radiusY: 0.25,
          radiusZ: 0.2,
          widthSegments: 8,
          heightSegments: 6,
        },
        materialSlots: ['surface'],
        ports: [],
      },
    ],
    assembly: {
      id: 'assembly.hero',
      parts: [
        {
          id: 'part.torso',
          templateId: 'template.torso',
          transform: {
            position: [0, 0.8, 0],
            rotation: [0, 0, 0, 1],
            scale: [1, 1, 1],
          },
          materialBindings: [{ slot: 'surface', materialId: 'material.cloth' }],
          visible: true,
        },
        {
          id: 'part.head',
          templateId: 'template.head',
          transform: {
            position: [0, 1.35, 0],
            rotation: [0, 0, 0, 1],
            scale: [1, 1, 1],
          },
          materialBindings: [{ slot: 'surface', materialId: 'material.cloth' }],
          visible: true,
        },
      ],
      connections: [],
    },
    variants: [],
    poses: [],
    renderProfiles: [
      {
        id: 'render.default',
        widthPixels: 128,
        heightPixels: 128,
        elevationDegrees: 30,
        directions: 8,
        paddingPixels: 6,
        transparent: true,
        minimumFeaturePixels: 3,
      },
    ],
  };
}
