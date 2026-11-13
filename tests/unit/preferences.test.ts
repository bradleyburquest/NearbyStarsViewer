import { describe, expect, it } from 'vitest';
import { readPreferences, writePreferences, type Preferences } from '../../src/app/preferences';

const preferences: Preferences = {
  unit: 'pc',
  labels: 'selected',
  markerMode: 'brightness',
  stellarColors: false,
  layerOpacity: 0.7,
  properMotion: true,
  planetHostsOnly: true,
  layers: {
    constellations: true,
    galacticPlane: false,
    equatorialGrid: true,
    ecliptic: false,
    galacticGrid: true,
  },
};

describe('preferences', () => {
  it('round-trips versioned preferences', () => {
    localStorage.clear();
    writePreferences(localStorage, preferences);
    expect(readPreferences(localStorage)).toEqual(preferences);
  });

  it('drops invalid values without failing', () => {
    localStorage.setItem(
      'nearby-stars-viewer:preferences:v1',
      JSON.stringify({
        version: 1,
        preferences: { unit: 'miles', layerOpacity: 9 },
      }),
    );
    expect(readPreferences(localStorage)).toEqual({});
  });

  it('migrates the former prominent-label default to all labels', () => {
    localStorage.setItem(
      'nearby-stars-viewer:preferences:v1',
      JSON.stringify({ version: 1, preferences: { labels: 'prominent' } }),
    );
    expect(readPreferences(localStorage)).toEqual({ labels: 'all' });
  });
});
