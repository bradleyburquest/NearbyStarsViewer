import { describe, expect, it } from 'vitest';
import { constellationLines } from '../../src/data/constellationLines';
import { constellationAtJ2000 } from '../../src/domain/constellations';

describe('constellations', () => {
  it('resolves known J2000 positions through official IAU boundaries', () => {
    expect(constellationAtJ2000(101.287, -16.716, 2000, 0, 0)).toMatchObject({
      name: 'Canis Major',
      abbreviation: 'CMa',
    });
    expect(constellationAtJ2000(37.95, 89.264, 2000, 0, 0)).toMatchObject({
      name: 'Ursa Minor',
      abbreviation: 'UMi',
    });
  });

  it('contains line figures for all 88 IAU constellations', () => {
    expect(constellationLines).toHaveLength(89);
    expect(new Set(constellationLines.map((feature) => feature.id)).size).toBe(88);
  });
});
