import type { StellarSystem } from '../domain/catalog';

export const solarPlanetNames = [
  'Mercury',
  'Venus',
  'Earth',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
] as const;

/**
 * Application-level reference object for the Sun-centered viewer. It is kept
 * outside the CNS5 artifact because it is the coordinate origin rather than a
 * parallax-selected nearby-system record.
 */
export const sunSystem: StellarSystem = {
  id: 'sun',
  displayName: 'Sun',
  aliases: ['Sun', 'Sol'],
  catalogIds: { CNS5: 'Not applicable', GJ: null, HIP: null, GaiaDR3: null },
  multiplicity: 'single',
  componentCount: 1,
  positionBasis: 'catalog-object',
  constellation: {
    name: 'Not applicable at the origin',
    abbreviation: 'Sun',
    referenceFrame: 'J2000',
    sourceId: 'iau-constellation-boundaries',
  },
  astrometry: {
    coordinateFrame: 'ICRS',
    referenceEpochJYear: 2000,
    raDeg: { value: 0, sourceId: 'derived-inverse-parallax' },
    decDeg: { value: 0, sourceId: 'derived-inverse-parallax' },
    parallaxMas: { value: 1, sourceId: 'derived-inverse-parallax' },
    properMotionRaMasYr: { value: 0, sourceId: 'derived-inverse-parallax' },
    properMotionDecMasYr: { value: 0, sourceId: 'derived-inverse-parallax' },
    references: {
      coordinatesBibcode: 'Sun-centered scene origin',
      parallaxBibcode: 'Not applicable',
      properMotionBibcode: 'Not applicable',
    },
  },
  distance: {
    parsec: 0,
    lightYear: 0,
    uncertaintyParsec: 0,
    uncertaintyLightYear: 0,
    method: 'inverse-parallax',
    sourceId: 'derived-inverse-parallax',
  },
  photometry: {
    apparentMagnitudeG: { value: -26.74, sourceId: 'derived-absolute-magnitude' },
    absoluteMagnitudeG: null,
    gRpColorIndex: null,
    spectralType: 'G2 V',
  },
  radialVelocityKmS: null,
  stellarProperties: {
    effectiveTemperatureK: { value: 5772, sourceId: 'derived-absolute-magnitude' },
    radiusSolar: { value: 1, sourceId: 'derived-absolute-magnitude' },
    massSolar: { value: 1, sourceId: 'derived-absolute-magnitude' },
    luminositySolar: { value: 1, sourceId: 'derived-absolute-magnitude' },
  },
  confirmedPlanets: [],
  planetDataStatus: 'confirmed-snapshot',
};
