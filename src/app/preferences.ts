import type { ViewState } from './viewState';

const STORAGE_KEY = 'nearby-stars-viewer:preferences:v1';
const CURRENT_VERSION = 3;

export type Preferences = Pick<
  ViewState,
  | 'unit'
  | 'labels'
  | 'markerMode'
  | 'stellarColors'
  | 'layers'
  | 'layerOpacity'
  | 'properMotion'
  | 'planetHostsOnly'
>;

export function readPreferences(storage: Storage | undefined): Partial<Preferences> {
  if (!storage) return {};
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object' || !('version' in parsed)) return {};
    const candidate = parsed as { version: unknown; preferences?: unknown };
    if (candidate.version !== 1 && candidate.version !== 2 && candidate.version !== CURRENT_VERSION)
      return {};
    if (!candidate.preferences || typeof candidate.preferences !== 'object') return {};
    const value = candidate.preferences as Record<string, unknown>;
    const result: Partial<Preferences> = {};
    if (value.unit === 'ly' || value.unit === 'pc') result.unit = value.unit;
    const hasLabelMode =
      value.labels === 'none' ||
      value.labels === 'selected' ||
      value.labels === 'prominent' ||
      value.labels === 'all';
    const wasFormerDefault =
      candidate.version !== CURRENT_VERSION &&
      (value.labels === 'all' || value.labels === 'prominent');
    if (hasLabelMode && !wasFormerDefault) result.labels = value.labels as Preferences['labels'];
    if (value.markerMode === 'clarity' || value.markerMode === 'brightness')
      result.markerMode = value.markerMode;
    if (typeof value.stellarColors === 'boolean') result.stellarColors = value.stellarColors;
    if (
      typeof value.layerOpacity === 'number' &&
      value.layerOpacity >= 0.1 &&
      value.layerOpacity <= 1
    )
      result.layerOpacity = value.layerOpacity;
    if (typeof value.properMotion === 'boolean') result.properMotion = value.properMotion;
    if (typeof value.planetHostsOnly === 'boolean') result.planetHostsOnly = value.planetHostsOnly;
    if (value.layers && typeof value.layers === 'object') {
      const layers = value.layers as Record<string, unknown>;
      if (
        ['constellations', 'galacticPlane', 'equatorialGrid', 'ecliptic', 'galacticGrid'].every(
          (key) => typeof layers[key] === 'boolean',
        )
      )
        result.layers = layers as Preferences['layers'];
    }
    return result;
  } catch {
    return {};
  }
}

export function writePreferences(storage: Storage | undefined, preferences: Preferences): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: CURRENT_VERSION, preferences }));
  } catch {
    // Storage may be unavailable in private or constrained browser contexts.
  }
}
