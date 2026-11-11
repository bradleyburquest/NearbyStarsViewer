import { describe, expect, it } from 'vitest';
import catalogData from '../../src/data/nearby-stars-catalog.json';
import { nearbyStarsCatalog, validateCatalog } from '../../src/data/catalog';

describe('CNS5 catalog', () => {
  it('contains 150 unique, distance-sorted stellar systems', () => {
    expect(nearbyStarsCatalog.systems).toHaveLength(150);
    expect(new Set(nearbyStarsCatalog.systems.map((system) => system.id)).size).toBe(150);

    const distances = nearbyStarsCatalog.systems.map((system) => system.distance.parsec);
    expect(distances).toEqual([...distances].sort((left, right) => left - right));
    expect(nearbyStarsCatalog.systems.flatMap((system) => system.confirmedPlanets)).toHaveLength(
      80,
    );
    expect(
      nearbyStarsCatalog.systems.filter((system) => system.confirmedPlanets.length),
    ).toHaveLength(37);
  });

  it('rejects duplicate system identifiers', () => {
    const invalidCatalog = structuredClone(catalogData);
    const firstSystem = invalidCatalog.systems[0];
    const secondSystem = invalidCatalog.systems[1];
    if (!firstSystem || !secondSystem) throw new Error('Prototype fixture is incomplete.');
    secondSystem.id = firstSystem.id;

    expect(() => validateCatalog(invalidCatalog)).toThrow(/Duplicate system ID/);
  });

  it('rejects an invalid declination', () => {
    const invalidCatalog = structuredClone(catalogData);
    const firstSystem = invalidCatalog.systems[0];
    if (!firstSystem) throw new Error('Prototype fixture is incomplete.');
    firstSystem.astrometry.decDeg.value = 91;

    expect(() => validateCatalog(invalidCatalog)).toThrow();
  });

  it('rejects a distance inconsistent with parallax', () => {
    const invalidCatalog = structuredClone(catalogData);
    const firstSystem = invalidCatalog.systems[0];
    if (!firstSystem) throw new Error('Prototype fixture is incomplete.');
    firstSystem.distance.parsec = 99;

    expect(() => validateCatalog(invalidCatalog)).toThrow(/inverse-parallax derivation/);
  });
});
