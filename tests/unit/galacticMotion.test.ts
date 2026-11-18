import { describe, expect, it } from 'vitest';
import { vectorMagnitude } from '../../src/domain/coordinates';
import {
  GALACTIC_CENTER_DIRECTION_ICRS,
  galacticVelocityToIcrsDirection,
  MILKY_WAY_ROTATION_DIRECTION_ICRS,
  SUN_PECULIAR_MOTION_DIRECTION_ICRS,
} from '../../src/domain/galacticMotion';

describe('Galactic motion directions', () => {
  it('maps Galactic +V to the ICRS direction of local Galactic rotation', () => {
    expect(MILKY_WAY_ROTATION_DIRECTION_ICRS.x).toBeCloseTo(0.4941094279, 9);
    expect(MILKY_WAY_ROTATION_DIRECTION_ICRS.y).toBeCloseTo(-0.44482963, 9);
    expect(MILKY_WAY_ROTATION_DIRECTION_ICRS.z).toBeCloseTo(0.7469822445, 9);
    expect(vectorMagnitude(MILKY_WAY_ROTATION_DIRECTION_ICRS)).toBeCloseTo(1, 9);
  });

  it('maps Galactic +U to the ICRS direction toward the Galactic center', () => {
    expect(GALACTIC_CENTER_DIRECTION_ICRS.x).toBeCloseTo(-0.0548755604, 9);
    expect(GALACTIC_CENTER_DIRECTION_ICRS.y).toBeCloseTo(-0.8734370902, 9);
    expect(GALACTIC_CENTER_DIRECTION_ICRS.z).toBeCloseTo(-0.4838350155, 9);
  });

  it('normalizes the Sun peculiar-motion vector and keeps it distinct from rotation', () => {
    expect(vectorMagnitude(SUN_PECULIAR_MOTION_DIRECTION_ICRS)).toBeCloseTo(1, 9);
    const alignment =
      MILKY_WAY_ROTATION_DIRECTION_ICRS.x * SUN_PECULIAR_MOTION_DIRECTION_ICRS.x +
      MILKY_WAY_ROTATION_DIRECTION_ICRS.y * SUN_PECULIAR_MOTION_DIRECTION_ICRS.y +
      MILKY_WAY_ROTATION_DIRECTION_ICRS.z * SUN_PECULIAR_MOTION_DIRECTION_ICRS.z;
    expect(alignment).toBeLessThan(0.9);
  });

  it('rejects a zero Galactic velocity', () => {
    expect(() => galacticVelocityToIcrsDirection(0, 0, 0)).toThrow(RangeError);
  });
});
