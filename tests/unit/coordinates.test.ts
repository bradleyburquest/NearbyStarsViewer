import { describe, expect, it } from 'vitest';
import { sphericalToCartesian, vectorMagnitude } from '../../src/domain/coordinates';

describe('sphericalToCartesian', () => {
  it.each([
    { raDeg: 0, decDeg: 0, expected: { x: 1, y: 0, z: 0 } },
    { raDeg: 90, decDeg: 0, expected: { x: 0, y: 1, z: 0 } },
    { raDeg: 0, decDeg: 90, expected: { x: 0, y: 0, z: 1 } },
    { raDeg: 180, decDeg: 0, expected: { x: -1, y: 0, z: 0 } },
  ])('maps RA $raDeg°, Dec $decDeg° to the documented axes', ({ raDeg, decDeg, expected }) => {
    const actual = sphericalToCartesian(raDeg, decDeg, 1);

    expect(actual.x).toBeCloseTo(expected.x, 12);
    expect(actual.y).toBeCloseTo(expected.y, 12);
    expect(actual.z).toBeCloseTo(expected.z, 12);
  });

  it('preserves radial distance for a real catalog coordinate', () => {
    const position = sphericalToCartesian(219.92041034, -60.83514707, 1.34749097);

    expect(vectorMagnitude(position)).toBeCloseTo(1.34749097, 12);
  });

  it.each([
    [-1, 0, 1],
    [360, 0, 1],
    [0, -91, 1],
    [0, 91, 1],
    [0, 0, 0],
    [0, 0, Number.NaN],
  ])('rejects invalid coordinates (%s, %s, %s)', (raDeg, decDeg, distance) => {
    expect(() => sphericalToCartesian(raDeg, decDeg, distance)).toThrow(RangeError);
  });
});
