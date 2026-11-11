export type CartesianPosition = Readonly<{
  x: number;
  y: number;
  z: number;
}>;

const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * Converts ICRS spherical coordinates to a right-handed Cartesian frame.
 * +X points to RA 0°, Dec 0°; +Y to RA 90°, Dec 0°; +Z to Dec +90°.
 * The returned coordinates use the same distance unit as distance.
 */
export function sphericalToCartesian(
  raDeg: number,
  decDeg: number,
  distance: number,
): CartesianPosition {
  if (!Number.isFinite(raDeg) || raDeg < 0 || raDeg >= 360) {
    throw new RangeError('Right ascension must be finite and in [0, 360) degrees.');
  }
  if (!Number.isFinite(decDeg) || decDeg < -90 || decDeg > 90) {
    throw new RangeError('Declination must be finite and in [-90, 90] degrees.');
  }
  if (!Number.isFinite(distance) || distance <= 0) {
    throw new RangeError('Distance must be finite and greater than zero.');
  }

  const raRad = raDeg * DEGREES_TO_RADIANS;
  const decRad = decDeg * DEGREES_TO_RADIANS;
  const projectedDistance = distance * Math.cos(decRad);

  return {
    x: projectedDistance * Math.cos(raRad),
    y: projectedDistance * Math.sin(raRad),
    z: distance * Math.sin(decRad),
  };
}

export function vectorMagnitude(position: CartesianPosition): number {
  return Math.hypot(position.x, position.y, position.z);
}
