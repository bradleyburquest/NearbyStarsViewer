import { z } from 'zod';

const finiteNumber = z.number().finite();
const positiveFiniteNumber = finiteNumber.positive();
const nonNegativeFiniteNumber = finiteNumber.nonnegative();

export const catalogSourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  catalogVersion: z.string().min(1),
  url: z.url(),
  retrievedAt: z.iso.date(),
  license: z.string().min(1),
  acknowledgement: z.string().min(1),
});

const measurementSchema = z.object({
  value: finiteNumber,
  uncertainty: nonNegativeFiniteNumber.optional(),
  sourceId: z.string().min(1),
});

const astrometrySchema = z.object({
  coordinateFrame: z.literal('ICRS'),
  referenceEpochJYear: finiteNumber,
  raDeg: measurementSchema.extend({ value: finiteNumber.gte(0).lt(360) }),
  decDeg: measurementSchema.extend({ value: finiteNumber.gte(-90).lte(90) }),
  parallaxMas: measurementSchema.extend({ value: positiveFiniteNumber }),
  properMotionRaMasYr: measurementSchema,
  properMotionDecMasYr: measurementSchema,
  references: z.object({
    coordinatesBibcode: z.string().min(1),
    parallaxBibcode: z.string().min(1),
    properMotionBibcode: z.string().min(1),
  }),
});

const distanceSchema = z.object({
  parsec: positiveFiniteNumber,
  lightYear: positiveFiniteNumber,
  uncertaintyParsec: nonNegativeFiniteNumber,
  uncertaintyLightYear: nonNegativeFiniteNumber,
  method: z.literal('inverse-parallax'),
  sourceId: z.literal('derived-inverse-parallax'),
});

const photometrySchema = z.object({
  apparentMagnitudeG: measurementSchema.nullable(),
  absoluteMagnitudeG: measurementSchema.nullable(),
  gRpColorIndex: measurementSchema.nullable(),
  spectralType: z.string().min(1).nullable(),
});

const stellarPropertiesSchema = z.object({
  effectiveTemperatureK: measurementSchema.nullable(),
  radiusSolar: measurementSchema.nullable(),
  massSolar: measurementSchema.nullable(),
  luminositySolar: measurementSchema.nullable(),
});

const confirmedPlanetSchema = z.object({
  name: z.string().min(1),
  hostName: z.string().min(1),
  discoveryMethod: z.string().min(1),
  discoveryYear: z.number().int().gte(1980).lte(2100),
  orbitalPeriodDays: positiveFiniteNumber.nullable(),
  semiMajorAxisAu: positiveFiniteNumber.nullable(),
  radiusEarth: positiveFiniteNumber.nullable(),
  massEarth: positiveFiniteNumber.nullable(),
  sourceId: z.literal('nasa-exoplanet-archive'),
});

export const stellarSystemSchema = z.object({
  id: z.string().regex(/^cns5-\d+$/),
  displayName: z.string().min(1),
  aliases: z.array(z.string().min(1)).min(1),
  catalogIds: z.object({
    CNS5: z.string().regex(/^CNS5 \d+$/),
    GJ: z.string().nullable(),
    HIP: z.string().nullable(),
    GaiaDR3: z.string().nullable(),
  }),
  multiplicity: z.enum(['single', 'multiple']),
  componentCount: z.number().int().positive(),
  positionBasis: z.enum(['primary-component', 'catalog-object']),
  astrometry: astrometrySchema,
  distance: distanceSchema,
  photometry: photometrySchema,
  radialVelocityKmS: measurementSchema.nullable(),
  stellarProperties: stellarPropertiesSchema,
  confirmedPlanets: z.array(confirmedPlanetSchema),
  planetDataStatus: z.literal('confirmed-snapshot'),
});

export const stellarCatalogSchema = z
  .object({
    schemaVersion: z.literal('3.0.0'),
    catalogVersion: z.string().min(1),
    generatedAt: z.iso.datetime({ offset: true }),
    title: z.string().min(1),
    description: z.string().min(1),
    selectionPolicy: z.string().min(1),
    sources: z.array(catalogSourceSchema).min(1),
    systems: z.array(stellarSystemSchema).length(150),
  })
  .superRefine((catalog, context) => {
    const sourceIds = new Set(catalog.sources.map((source) => source.id));
    const systemIds = new Set<string>();
    const cns5Ids = new Set<string>();

    for (const [index, system] of catalog.systems.entries()) {
      if (systemIds.has(system.id)) {
        context.addIssue({
          code: 'custom',
          path: ['systems', index, 'id'],
          message: `Duplicate system ID: ${system.id}`,
        });
      }
      systemIds.add(system.id);
      if (cns5Ids.has(system.catalogIds.CNS5)) {
        context.addIssue({
          code: 'custom',
          path: ['systems', index, 'catalogIds', 'CNS5'],
          message: `Duplicate CNS5 identifier: ${system.catalogIds.CNS5}`,
        });
      }
      cns5Ids.add(system.catalogIds.CNS5);

      const referencedSources = [
        system.astrometry.raDeg.sourceId,
        system.astrometry.decDeg.sourceId,
        system.astrometry.parallaxMas.sourceId,
        system.astrometry.properMotionRaMasYr.sourceId,
        system.astrometry.properMotionDecMasYr.sourceId,
        system.photometry.apparentMagnitudeG?.sourceId,
        system.photometry.absoluteMagnitudeG?.sourceId,
        system.photometry.gRpColorIndex?.sourceId,
        system.radialVelocityKmS?.sourceId,
        system.stellarProperties.effectiveTemperatureK?.sourceId,
        system.stellarProperties.radiusSolar?.sourceId,
        system.stellarProperties.massSolar?.sourceId,
        system.stellarProperties.luminositySolar?.sourceId,
        ...system.confirmedPlanets.map((planet) => planet.sourceId),
      ].filter((sourceId): sourceId is string => sourceId !== undefined);
      for (const sourceId of referencedSources) {
        if (!sourceIds.has(sourceId)) {
          context.addIssue({
            code: 'custom',
            path: ['systems', index],
            message: `Unknown source ID: ${sourceId}`,
          });
        }
      }

      const expectedParsec = 1000 / system.astrometry.parallaxMas.value;
      const expectedLightYear = expectedParsec * 3.261563777;
      if (
        Math.abs(system.distance.parsec - expectedParsec) > 1e-7 ||
        Math.abs(system.distance.lightYear - expectedLightYear) > 1e-7
      ) {
        context.addIssue({
          code: 'custom',
          path: ['systems', index, 'distance'],
          message: 'Stored distance does not match the inverse-parallax derivation.',
        });
      }
    }

    for (let index = 1; index < catalog.systems.length; index += 1) {
      const previous = catalog.systems[index - 1];
      const current = catalog.systems[index];
      if (previous && current && previous.distance.parsec > current.distance.parsec) {
        context.addIssue({
          code: 'custom',
          path: ['systems', index, 'distance', 'parsec'],
          message: 'Systems must be sorted by increasing distance.',
        });
      }
    }
  });

export type StellarCatalog = z.infer<typeof stellarCatalogSchema>;
export type StellarSystem = z.infer<typeof stellarSystemSchema>;
