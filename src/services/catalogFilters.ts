import type { StellarSystem } from '../domain/catalog';

export type DistanceUnit = 'ly' | 'pc';
export type SortMode = 'distance' | 'name' | 'magnitude';
export type LabelMode = 'none' | 'selected' | 'prominent' | 'all';
export type MarkerMode = 'clarity' | 'brightness';

export function formatDistance(system: StellarSystem, unit: DistanceUnit): string {
  return unit === 'ly'
    ? `${system.distance.lightYear.toFixed(2)} ly`
    : `${system.distance.parsec.toFixed(2)} pc`;
}

export function filterSystems(
  systems: readonly StellarSystem[],
  query: string,
  maximumDistanceLy: number,
  sort: SortMode,
  planetHostsOnly = false,
): StellarSystem[] {
  const needle = query.trim().toLocaleLowerCase();
  const matches = systems.filter(
    (system) =>
      system.distance.lightYear <= maximumDistanceLy + 1e-9 &&
      (!planetHostsOnly || system.confirmedPlanets.length > 0) &&
      (!needle || system.aliases.some((alias) => alias.toLocaleLowerCase().includes(needle))),
  );

  return matches.sort((left, right) => {
    if (sort === 'name') return left.displayName.localeCompare(right.displayName);
    if (sort === 'magnitude') {
      return (
        (left.photometry.apparentMagnitudeG?.value ?? Number.POSITIVE_INFINITY) -
        (right.photometry.apparentMagnitudeG?.value ?? Number.POSITIVE_INFINITY)
      );
    }
    return left.distance.lightYear - right.distance.lightYear;
  });
}
