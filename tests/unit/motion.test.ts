import { describe, expect, it } from 'vitest';
import { properMotionDirection } from '../../src/domain/motion';
import { vectorMagnitude } from '../../src/domain/coordinates';

describe('proper motion direction', () => {
  it('returns a normalized tangent vector', () => {
    const direction = properMotionDirection(90, 30, 120, -50);
    expect(direction).not.toBeNull();
    expect(vectorMagnitude(direction!)).toBeCloseTo(1, 12);
    const radial = { x: 0, y: Math.cos(Math.PI / 6), z: Math.sin(Math.PI / 6) };
    expect(direction!.x * radial.x + direction!.y * radial.y + direction!.z * radial.z).toBeCloseTo(
      0,
      12,
    );
  });

  it('returns null for a stationary record', () => {
    expect(properMotionDirection(0, 0, 0, 0)).toBeNull();
  });
});
