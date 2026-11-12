import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { constellationLines } from '../data/constellationLines';

export type ReferenceLayerKey =
  'constellations' | 'galacticPlane' | 'equatorialGrid' | 'ecliptic' | 'galacticGrid';
export type ReferenceLayers = Record<ReferenceLayerKey, boolean>;

function lineLoop(points: THREE.Vector3[], color: number, opacity: number): THREE.LineLoop {
  const line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  );
  line.material.userData.opacityScale = opacity;
  return line;
}

function circle(radius: number, z = 0): THREE.Vector3[] {
  return Array.from({ length: 129 }, (_, index) => {
    const angle = (index / 128) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
  });
}

function celestialPosition(raDeg: number, decDeg: number, radius: number): THREE.Vector3 {
  const ra = THREE.MathUtils.degToRad(raDeg);
  const dec = THREE.MathUtils.degToRad(decDeg);
  return new THREE.Vector3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.cos(dec) * Math.sin(ra),
    radius * Math.sin(dec),
  );
}

export function createReferenceLayerObjects(
  opacity: number,
): Record<ReferenceLayerKey, THREE.Object3D> {
  const equatorialGrid = new THREE.Group();
  for (const latitude of [-60, -30, 0, 30, 60]) {
    const radians = THREE.MathUtils.degToRad(latitude);
    equatorialGrid.add(
      lineLoop(circle(9 * Math.cos(radians), 9 * Math.sin(radians)), 0x477697, opacity * 0.55),
    );
  }
  for (let longitude = 0; longitude < 180; longitude += 30) {
    const loop = lineLoop(circle(9), 0x477697, opacity * 0.35);
    loop.rotation.x = Math.PI / 2;
    loop.rotation.z = THREE.MathUtils.degToRad(longitude);
    equatorialGrid.add(loop);
  }

  const ecliptic = lineLoop(circle(9.1), 0xd3a85f, opacity);
  ecliptic.rotation.x = THREE.MathUtils.degToRad(23.43928);

  const galacticGrid = new THREE.Group();
  galacticGrid.rotation.order = 'ZYX';
  galacticGrid.rotation.set(
    THREE.MathUtils.degToRad(62.87175),
    0,
    THREE.MathUtils.degToRad(282.85948),
  );
  for (const latitude of [-45, 0, 45]) {
    const radians = THREE.MathUtils.degToRad(latitude);
    galacticGrid.add(
      lineLoop(circle(9.2 * Math.cos(radians), 9.2 * Math.sin(radians)), 0x8c68b2, opacity * 0.55),
    );
  }

  const galacticPlane = new THREE.Mesh(
    new THREE.RingGeometry(3, 9.15, 128),
    new THREE.MeshBasicMaterial({
      color: 0x765598,
      transparent: true,
      opacity: opacity * 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  galacticPlane.material.userData.opacityScale = 0.12;
  galacticPlane.rotation.copy(galacticGrid.rotation);

  const constellations = new THREE.Group();
  for (const feature of constellationLines) {
    const centroid = new THREE.Vector3();
    let pointCount = 0;
    for (const segment of feature.lines) {
      const points = segment.map(([raDeg, decDeg]) => {
        const position = celestialPosition(raDeg, decDeg, 9.35);
        centroid.add(position);
        pointCount += 1;
        return position;
      });
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: 0x7894ad,
          transparent: true,
          opacity: opacity * (feature.rank === 1 ? 1 : 0.62),
          depthWrite: false,
        }),
      );
      line.material.userData.opacityScale = feature.rank === 1 ? 1 : 0.62;
      constellations.add(line);
    }
    if (feature.rank === 1 && pointCount > 0) {
      const label = document.createElement('span');
      label.className = 'constellation-label';
      label.textContent = feature.name;
      const labelObject = new CSS2DObject(label);
      labelObject.position.copy(centroid.divideScalar(pointCount).normalize().multiplyScalar(9.45));
      constellations.add(labelObject);
    }
  }

  return { constellations, galacticPlane, equatorialGrid, ecliptic, galacticGrid };
}

export function updateReferenceLayers(
  objects: Record<ReferenceLayerKey, THREE.Object3D>,
  layers: ReferenceLayers,
  opacity: number,
): void {
  for (const [key, object] of Object.entries(objects)) {
    object.visible = layers[key as ReferenceLayerKey];
    object.traverse((child) => {
      if (!(child instanceof THREE.Line || child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if ('opacity' in material) {
          material.opacity = opacity * Number(material.userData.opacityScale ?? 1);
          material.needsUpdate = true;
        }
      }
    });
  }
}

export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
      else child.material.dispose();
    }
  });
}
