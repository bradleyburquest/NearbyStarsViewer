import { Constellation } from 'astronomy-engine';

export type ConstellationMembership = Readonly<{
  name: string;
  abbreviation: string;
  referenceFrame: 'J2000';
  sourceId: 'iau-constellation-boundaries';
}>;

/** Propagates catalog ICRS coordinates linearly to J2000 and applies IAU boundaries. */
export function constellationAtJ2000(
  raDeg: number,
  decDeg: number,
  referenceEpochJYear: number,
  properMotionRaMasYr: number,
  properMotionDecMasYr: number,
): ConstellationMembership {
  const years = 2000 - referenceEpochJYear;
  const decJ2000 = decDeg + (properMotionDecMasYr * years) / 3_600_000;
  const cosDec = Math.cos((decDeg * Math.PI) / 180);
  const raJ2000 =
    (((raDeg + (properMotionRaMasYr * years) / (3_600_000 * Math.max(Math.abs(cosDec), 1e-9))) %
      360) +
      360) %
    360;
  const result = Constellation(raJ2000 / 15, decJ2000);
  return {
    name: result.name,
    abbreviation: result.symbol,
    referenceFrame: 'J2000',
    sourceId: 'iau-constellation-boundaries',
  };
}
