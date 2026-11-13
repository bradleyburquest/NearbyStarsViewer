import { describe, expect, it } from 'vitest';
import { nearbyStarsCatalog } from '../../src/data/catalog';
import { sunSystem } from '../../src/data/sunSystem';
import { vectorMagnitude } from '../../src/domain/coordinates';
import { toSceneSystem } from '../../src/scene/sceneModel';

describe('toSceneSystem', () => {
  it('creates deterministic parsec-space positions from catalog astrometry', () => {
    const system = nearbyStarsCatalog.systems[0];
    if (!system) throw new Error('Prototype catalog is empty.');

    const view = toSceneSystem(system);

    expect(view.id).toBe('cns5-3627');
    expect(view.xPc).toBeCloseTo(-0.4952, 3);
    expect(view.yPc).toBeCloseTo(-0.4143, 3);
    expect(view.zPc).toBeCloseTo(-1.1569, 3);
    expect(vectorMagnitude({ x: view.xPc, y: view.yPc, z: view.zPc })).toBeCloseTo(
      system.distance.parsec,
      10,
    );
  });

  it('places the supplemental Sun reference object at the Cartesian origin', () => {
    const view = toSceneSystem(sunSystem);
    expect([view.xPc, view.yPc, view.zPc]).toEqual([0, 0, 0]);
  });
});
