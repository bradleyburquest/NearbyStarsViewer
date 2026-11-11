import type { DistanceUnit, LabelMode, MarkerMode, SortMode } from '../services/catalogFilters';
import type { ReferenceLayers } from '../scene/referenceLayers';

export type OriginMode = 'sun' | 'earth';

export type ViewState = {
  query: string;
  maximumDistanceLy: number;
  unit: DistanceUnit;
  sort: SortMode;
  labels: LabelMode;
  markerMode: MarkerMode;
  stellarColors: boolean;
  selected: string | null;
  origin: OriginMode;
  layers: ReferenceLayers;
  layerOpacity: number;
  properMotion: boolean;
  planetHostsOnly: boolean;
};

const oneOf = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

export function readViewState(search: string, maximumCatalogDistanceLy: number): ViewState {
  const params = new URLSearchParams(search);
  const requestedDistance = Number(params.get('distance'));
  return {
    query: params.get('q') ?? '',
    maximumDistanceLy:
      Number.isFinite(requestedDistance) && requestedDistance > 0
        ? Math.min(requestedDistance, maximumCatalogDistanceLy)
        : maximumCatalogDistanceLy,
    unit: oneOf(params.get('unit'), ['ly', 'pc'], 'ly'),
    sort: oneOf(params.get('sort'), ['distance', 'name', 'magnitude'], 'distance'),
    labels: oneOf(params.get('labels'), ['none', 'selected', 'prominent', 'all'], 'prominent'),
    markerMode: oneOf(params.get('markers'), ['clarity', 'brightness'], 'clarity'),
    stellarColors: params.get('colors') !== '0',
    selected: params.get('selected'),
    origin: oneOf(params.get('origin'), ['sun', 'earth'], 'sun'),
    layers: {
      constellations: params.get('constellations') === '1',
      galacticPlane: params.get('galacticPlane') === '1',
      equatorialGrid: params.get('equatorialGrid') === '1',
      ecliptic: params.get('ecliptic') === '1',
      galacticGrid: params.get('galacticGrid') === '1',
    },
    layerOpacity: Math.min(1, Math.max(0.1, Number(params.get('layerOpacity')) || 0.55)),
    properMotion: params.get('motion') === '1',
    planetHostsOnly: params.get('planetHosts') === '1',
  };
}

export function writeViewState(state: ViewState, maximumCatalogDistanceLy: number): string {
  const params = new URLSearchParams({ v: '1' });
  if (state.query) params.set('q', state.query);
  if (state.maximumDistanceLy < maximumCatalogDistanceLy)
    params.set('distance', state.maximumDistanceLy.toFixed(2));
  if (state.unit !== 'ly') params.set('unit', state.unit);
  if (state.sort !== 'distance') params.set('sort', state.sort);
  if (state.labels !== 'prominent') params.set('labels', state.labels);
  if (state.markerMode !== 'clarity') params.set('markers', state.markerMode);
  if (!state.stellarColors) params.set('colors', '0');
  if (state.selected) params.set('selected', state.selected);
  if (state.origin !== 'sun') params.set('origin', state.origin);
  for (const [key, enabled] of Object.entries(state.layers)) if (enabled) params.set(key, '1');
  if (state.layerOpacity !== 0.55) params.set('layerOpacity', state.layerOpacity.toFixed(2));
  if (state.properMotion) params.set('motion', '1');
  if (state.planetHostsOnly) params.set('planetHosts', '1');
  return `?${params.toString()}`;
}
