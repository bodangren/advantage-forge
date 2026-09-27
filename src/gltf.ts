import { Document, NodeIO, type Material, type Node, type Skin, type Texture } from '@gltf-transform/core';
import { KHRMaterialsEmissiveStrength, KHRMaterialsVariants } from '@gltf-transform/extensions';
import * as THREE from 'three';
import type { AtlasImages } from './asset.js';

/**
 * Write a three.js hierarchy to GLB. Supports meshes with position, normal, tangent, vertex color,
 * and UV attributes, PBR factors, named nodes with TRS transforms, and the shared baked texture
 * atlas in `root.userData.forgeTextures` (applied to every material of a mesh that has UVs).
 */
export async function toGlb(root: THREE.Object3D): Promise<Uint8Array> {
  const doc = new Document();
  doc.createBuffer();
  const scene = doc.createScene(root.name || 'scene');
  const materials = new Map<THREE.Material, Material>();
  const textured = new Set<THREE.Material>();
  let emissiveStrength: KHRMaterialsEmissiveStrength | null = null;
  const nodes = new Map<THREE.Object3D, Node>();
  const skinned: [THREE.SkinnedMesh, Node][] = [];
  const atlas = root.userData.forgeTextures as AtlasImages | undefined;
  let maps: { baseColor: Texture; normal: Texture; orm: Texture } | null = null;
  if (atlas) {
    const tex = (name: string, image: Uint8Array) =>
      doc.createTexture(name).setImage(image).setMimeType('image/png');
    maps = {
      baseColor: tex('baseColor', atlas.baseColor),
      normal: tex('normal', atlas.normal),
      orm: tex('occlusionRoughnessMetallic', atlas.orm),
    };
  }

  const materialFor = (m: THREE.Material): Material => {
    const cached = materials.get(m);
    if (cached) return cached;
    const mat = doc.createMaterial(m.name || 'material');
    const std = m as THREE.MeshStandardMaterial;
    const color = std.color instanceof THREE.Color ? std.color : new THREE.Color(1, 1, 1);
    mat.setBaseColorFactor([color.r, color.g, color.b, m.opacity ?? 1]);
    mat.setRoughnessFactor(typeof std.roughness === 'number' ? std.roughness : 1);
    mat.setMetallicFactor(typeof std.metalness === 'number' ? std.metalness : 0);
    if (std.emissive instanceof THREE.Color) {
      // glTF clamps emissiveFactor to 1; brighter glow goes into KHR_materials_emissive_strength.
      const k = typeof std.emissiveIntensity === 'number' ? std.emissiveIntensity : 1;
      const peak = Math.max(std.emissive.r, std.emissive.g, std.emissive.b) * k;
      if (peak > 1) {
        const scale = 1 / Math.max(std.emissive.r, std.emissive.g, std.emissive.b);
        mat.setEmissiveFactor([std.emissive.r * scale, std.emissive.g * scale, std.emissive.b * scale]);
        emissiveStrength ??= doc.createExtension(KHRMaterialsEmissiveStrength);
        mat.setExtension(
          'KHR_materials_emissive_strength',
          emissiveStrength.createEmissiveStrength().setEmissiveStrength(peak),
        );
      } else mat.setEmissiveFactor([std.emissive.r * k, std.emissive.g * k, std.emissive.b * k]);
    }
    if (maps && textured.has(m)) {
      mat.setBaseColorTexture(maps.baseColor);
      mat.setNormalTexture(maps.normal);
      mat.setOcclusionTexture(maps.orm);
      mat.setMetallicRoughnessTexture(maps.orm);
    }
    if (m.transparent) mat.setAlphaMode('BLEND');
    mat.setDoubleSided(m.side === THREE.DoubleSide);
    if (typeof m.userData.forgeEmissiveTint === 'string') mat.setExtras({ forgeEmissiveTint: m.userData.forgeEmissiveTint });
    materials.set(m, mat);
    return mat;
  };

  const visit = (o: THREE.Object3D): Node => {
    const node = doc.createNode(o.name || o.type);
    node.setTranslation([o.position.x, o.position.y, o.position.z]);
    node.setRotation([o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w]);
    node.setScale([o.scale.x, o.scale.y, o.scale.z]);
    if (o instanceof THREE.Mesh) {
      const g = o.geometry as THREE.BufferGeometry;
      const mesh = doc.createMesh(o.name || 'mesh');
      const prim = doc.createPrimitive();
      const attr = (name: string, key: string, type: 'VEC2' | 'VEC3' | 'VEC4') => {
        const a = g.getAttribute(name) as THREE.BufferAttribute | undefined;
        if (!a) return;
        const arr = new Float32Array(a.array);
        prim.setAttribute(key, doc.createAccessor().setType(type).setArray(arr));
      };
      attr('position', 'POSITION', 'VEC3');
      attr('normal', 'NORMAL', 'VEC3');
      const color = g.getAttribute('color');
      if (color) attr('color', 'COLOR_0', color.itemSize === 4 ? 'VEC4' : 'VEC3');
      attr('uv', 'TEXCOORD_0', 'VEC2');
      attr('tangent', 'TANGENT', 'VEC4');
      const joints = g.getAttribute('skinIndex') as THREE.BufferAttribute | undefined;
      const weights = g.getAttribute('skinWeight') as THREE.BufferAttribute | undefined;
      if (joints && weights) {
        prim.setAttribute(
          'JOINTS_0',
          doc.createAccessor().setType('VEC4').setArray(new Uint16Array(joints.array)),
        );
        prim.setAttribute(
          'WEIGHTS_0',
          doc.createAccessor().setType('VEC4').setArray(new Float32Array(weights.array)),
        );
      }
      if (g.index) {
        const count = g.getAttribute('position').count;
        const src = g.index.array;
        const idx = count < 65536 ? new Uint16Array(src) : new Uint32Array(src);
        prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(idx));
      }
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (m && g.getAttribute('uv')) textured.add(m);
      if (m) prim.setMaterial(materialFor(m));
      mesh.addPrimitive(prim);
      node.setMesh(mesh);
      if (o instanceof THREE.SkinnedMesh) skinned.push([o, node]);
    }
    nodes.set(o, node);
    for (const child of o.children) node.addChild(visit(child));
    return node;
  };

  scene.addChild(visit(root));

  // Color variants: the slot table in the root extras, the tint mask as a named texture (a game
  // multiplies masked texels by option / default per slot), and each preset as a material
  // variant (KHR_materials_variants) with a ready recolored atlas, for engines without a shader.
  const variants = root.userData.forgeVariants as Record<string, unknown> | undefined;
  if (variants) {
    doc.getRoot().setExtras({ forgeVariants: variants });
    if (atlas?.tintMask) doc.createTexture('tintMask').setImage(atlas.tintMask).setMimeType('image/png');
    const presets = Object.entries(atlas?.presets ?? {});
    if (presets.length > 0) {
      const ext = doc.createExtension(KHRMaterialsVariants);
      const looks = presets.map(([name, image]) => ({
        variant: ext.createVariant(name),
        texture: doc.createTexture(`baseColor:${name}`).setImage(image).setMimeType('image/png'),
      }));
      for (const prim of doc.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives())) {
        const mat = prim.getMaterial();
        if (!mat || !mat.getBaseColorTexture()) continue;
        const list = ext.createMappingList();
        for (const look of looks) {
          const alt = mat.clone().setName(`${mat.getName()}:${look.variant.getName()}`).setBaseColorTexture(look.texture);
          list.addMapping(ext.createMapping().setMaterial(alt).addVariant(look.variant));
        }
        prim.setExtension('KHR_materials_variants', list);
      }
    }
  }

  // Skins: one per three.js skeleton, joints in skeleton order with their inverse bind matrices.
  const skins = new Map<THREE.Skeleton, Skin>();
  for (const [mesh, node] of skinned) {
    let skin = skins.get(mesh.skeleton);
    if (!skin) {
      skin = doc.createSkin('skin');
      const ibm = new Float32Array(mesh.skeleton.bones.length * 16);
      mesh.skeleton.bones.forEach((bone, i) => {
        skin!.addJoint(nodes.get(bone)!);
        ibm.set(mesh.skeleton.boneInverses[i]!.elements, i * 16);
      });
      skin.setInverseBindMatrices(doc.createAccessor().setType('MAT4').setArray(ibm));
      skin.setSkeleton(nodes.get(mesh.skeleton.bones[0]!)!);
      skins.set(mesh.skeleton, skin);
    }
    node.setSkin(skin);
  }

  // Animations: three.js keyframe tracks become glTF channels on the named bone nodes.
  const byName = new Map<string, Node>();
  for (const [o, n] of nodes) if (o.name) byName.set(o.name, n);
  for (const clip of root.animations) {
    const anim = doc.createAnimation(clip.name);
    for (const track of clip.tracks) {
      const dot = track.name.lastIndexOf('.');
      const target = byName.get(track.name.slice(0, dot));
      const prop = track.name.slice(dot + 1);
      const path =
        prop === 'quaternion'
          ? 'rotation'
          : prop === 'position'
            ? 'translation'
            : prop === 'scale'
              ? 'scale'
              : null;
      if (!target || !path) continue;
      const sampler = doc
        .createAnimationSampler()
        .setInput(doc.createAccessor().setType('SCALAR').setArray(new Float32Array(track.times)))
        .setOutput(
          doc
            .createAccessor()
            .setType(path === 'rotation' ? 'VEC4' : 'VEC3')
            .setArray(new Float32Array(track.values)),
        )
        .setInterpolation('LINEAR');
      anim.addSampler(sampler);
      anim.addChannel(
        doc.createAnimationChannel().setTargetNode(target).setTargetPath(path).setSampler(sampler),
      );
    }
  }
  return new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).writeBinary(doc);
}
