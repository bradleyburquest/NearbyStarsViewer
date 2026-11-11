import { describe, expect, it } from 'vitest';
import { readPreferences, writePreferences, type Preferences } from '../../src/app/preferences';

const preferences: Preferences = {
  unit: 'pc',
  labels: 'selected',
  markerMode: 'brightness',
  stellarColors: false,
  origin: 'earth',
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
        preferences: { unit: 'miles', origin: 'mars', layerOpacity: 9 },
      }),
    );
    expect(readPreferences(localStorage)).toEqual({});
  });
});
