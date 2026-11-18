import type { CartesianPosition } from './coordinates';

// IAU Galactic-to-ICRS rotation (transpose of the standard ICRS-to-Galactic matrix).
const GALACTIC_TO_ICRS = [
  [-0.0548755604, 0.4941094279, -0.867666149],
  [-0.8734370902, -0.44482963, -0.1980763734],
  [-0.4838350155, 0.7469822445, 0.4559837762],
] as const;

/** Converts Galactic U/V/W components to a normalized ICRS scene direction. */
export function galacticVelocityToIcrsDirection(
  uTowardGalacticCenter: number,
  vInRotationDirection: number,
  wTowardNorthGalacticPole: number,
): CartesianPosition {
  const magnitude = Math.hypot(
    uTowardGalacticCenter,
    vInRotationDirection,
    wTowardNorthGalacticPole,
  );
  if (!Number.isFinite(magnitude) || magnitude === 0) {
    throw new RangeError('Galactic velocity must have a finite, non-zero magnitude.');
  }

  const galactic = [
    uTowardGalacticCenter / magnitude,
    vInRotationDirection / magnitude,
    wTowardNorthGalacticPole / magnitude,
  ] as const;
  return {
    x:
      GALACTIC_TO_ICRS[0][0] * galactic[0] +
      GALACTIC_TO_ICRS[0][1] * galactic[1] +
      GALACTIC_TO_ICRS[0][2] * galactic[2],
    y:
      GALACTIC_TO_ICRS[1][0] * galactic[0] +
      GALACTIC_TO_ICRS[1][1] * galactic[1] +
      GALACTIC_TO_ICRS[1][2] * galactic[2],
    z:
      GALACTIC_TO_ICRS[2][0] * galactic[0] +
      GALACTIC_TO_ICRS[2][1] * galactic[1] +
      GALACTIC_TO_ICRS[2][2] * galactic[2],
  };
}

/** Local circular flow of the Milky Way at the Sun: Galactic +V (l=90°, b=0°). */
export const MILKY_WAY_ROTATION_DIRECTION_ICRS = galacticVelocityToIcrsDirection(0, 1, 0);

/** Direction from the Sun toward the Galactic center: Galactic +U (l=0°, b=0°). */
export const GALACTIC_CENTER_DIRECTION_ICRS = galacticVelocityToIcrsDirection(1, 0, 0);

/** Direction of the north Galactic pole: Galactic +W (b=+90°). */
export const NORTH_GALACTIC_POLE_DIRECTION_ICRS = galacticVelocityToIcrsDirection(0, 0, 1);

/** Sun relative to the LSR, Schönrich, Binney & Dehnen (2010), in Galactic U/V/W. */
export const SUN_PECULIAR_MOTION_DIRECTION_ICRS = galacticVelocityToIcrsDirection(
  11.1,
  12.24,
  7.25,
);
