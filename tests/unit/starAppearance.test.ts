import { describe, expect, it } from 'vitest';
import { markerRadius, spectralClassFromType, spectralColor } from '../../src/scene/starAppearance';

describe('star appearance', () => {
  it.each([
    ['A0m...', 'A'],
    ['sdM4', 'M'],
    ['F5IV-V', 'F'],
    ['G2V', 'G'],
    ['K5V', 'K'],
  ])('extracts %s as spectral class %s', (spectralType, expectedClass) => {
    expect(spectralClassFromType(spectralType)).toBe(expectedClass);
  });

  it('uses a neutral fallback when classification is unavailable', () => {
    expect(spectralClassFromType(null)).toBeNull();
    expect(spectralColor(null)).toBe(0xd8e5f2);
  });

  it('makes brighter stars larger without allowing unusable markers', () => {
    expect(markerRadius(-1.44, true)).toBeGreaterThan(markerRadius(10.37, true));
    expect(markerRadius(30, true)).toBeGreaterThanOrEqual(0.07);
    expect(markerRadius(-30, true)).toBeLessThanOrEqual(0.19);
  });
});
