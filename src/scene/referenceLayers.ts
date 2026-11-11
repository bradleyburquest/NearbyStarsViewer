import * as THREE from 'three';

export type ReferenceLayerKey =
  'constellations' | 'galacticPlane' | 'equatorialGrid' | 'ecliptic' | 'galacticGrid';
export type ReferenceLayers = Record<ReferenceLayerKey, boolean>;

function lineLoop(points: THREE.Vector3[], color: number, opacity: number): THREE.LineLoop {
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  );
}

function circle(radius: number, z = 0): THREE.Vector3[] {
  return Array.from({ length: 129 }, (_, index) => {
    const angle = (index / 128) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
  });
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
  galacticPlane.rotation.copy(galacticGrid.rotation);

  const constellations = new THREE.Group();
  const figures = [
    [
      [83, -1],
      [81, 6],
      [78, -8],
      [83, -1],
      [88, 7],
      [90, 15],
    ],
    [
      [165, 62],
      [178, 54],
      [184, 57],
      [193, 56],
      [200, 55],
      [206, 49],
      [201, 48],
    ],
    [
      [2, 59],
      [10, 56],
      [14, 60],
      [21, 60],
      [28, 63],
    ],
  ];
  for (const figure of figures) {
    const points = figure.map(([ra, dec]) => {
      const raRad = THREE.MathUtils.degToRad(ra ?? 0);
      const decRad = THREE.MathUtils.degToRad(dec ?? 0);
      return new THREE.Vector3(
        9.35 * Math.cos(decRad) * Math.cos(raRad),
        9.35 * Math.cos(decRad) * Math.sin(raRad),
        9.35 * Math.sin(decRad),
      );
    });
    constellations.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: 0x7894ad,
          transparent: true,
          opacity,
          depthWrite: false,
        }),
      ),
    );
  }

  return { constellations, galacticPlane, equatorialGrid, ecliptic, galacticGrid };
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
