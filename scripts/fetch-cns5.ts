import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { stellarCatalogSchema } from '../src/domain/catalog';

const TAP_URL = 'https://dc.g-vo.org/tap/sync';
const EXOPLANET_TAP_URL = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const OUTPUT_URL = new URL('../src/data/nearby-stars-catalog.json', import.meta.url);
const LIGHT_YEARS_PER_PARSEC = 3.261563777;

const COMMON_NAMES_BY_HIP: Readonly<Record<string, string>> = {
  '71683': 'Alpha Centauri',
  '87937': "Barnard's Star",
  '54035': 'Lalande 21185',
  '32349': 'Sirius',
  '92403': 'Ross 154',
  '16537': 'Epsilon Eridani',
  '114046': 'Lacaille 9352',
  '104214': '61 Cygni',
  '37279': 'Procyon',
  '8102': 'Tau Ceti',
  '108870': 'Epsilon Indi',
  '1475': 'Groombridge 34',
  '24186': "Kapteyn's Star",
  '36208': "Luyten's Star",
};
const COMMON_NAMES_BY_GJ: Readonly<Record<string, string>> = {
  '406': 'Wolf 359',
  '65': 'Luyten 726-8',
  '905': 'Ross 248',
  '1061': 'GJ 1061',
};

const QUERY = `SELECT TOP 150
  cns5_id, gj_id, component_id, n_components, primary_flag,
  gaia_edr3_id, hip_id, ra, dec, epoch, parallax, parallax_error,
  pmra, pmra_error, pmdec, pmdec_error, rv, rv_error,
  g_mag_resulting, g_mag_resulting_error, g_rp_resulting,
  g_rp_resulting_error, coordinates_bibcode, parallax_bibcode, pm_bibcode
FROM cns5.main
WHERE parallax IS NOT NULL AND (n_components IS NULL OR primary_flag = 1)
ORDER BY parallax DESC`;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else value += character;
  }
  values.push(value);
  return values;
}

function nullableNumber(value: string): number | null {
  if (value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid numeric value: ${value}`);
  return parsed;
}

function nullableString(value: string): string | null {
  return value === '' ? null : value;
}
function measurement(value: number | null, uncertainty: number | null) {
  return value === null
    ? null
    : { value, ...(uncertainty === null ? {} : { uncertainty }), sourceId: 'cns5-2023' };
}

const body = new URLSearchParams({ REQUEST: 'doQuery', LANG: 'ADQL', FORMAT: 'csv', QUERY });
const response = await fetch(TAP_URL, { method: 'POST', body });
if (!response.ok)
  throw new Error(`CNS5 TAP query failed: ${response.status} ${response.statusText}`);
const lines = (await response.text()).trim().split(/\r?\n/);
const headers = parseCsvLine(lines.shift() ?? '');
const rows = lines.map((line) => {
  const values = parseCsvLine(line);
  return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
});

const baseSystems = rows.map((row) => {
  const cns5Id = row.cns5_id ?? '';
  const gjId = nullableString(row.gj_id ?? '');
  const hipId = nullableString(row.hip_id ?? '');
  const gaiaId = nullableString(row.gaia_edr3_id ?? '');
  const parallaxMas = Number(row.parallax);
  const parallaxErrorMas = Number(row.parallax_error);
  const distanceParsec = 1000 / parallaxMas;
  const uncertaintyParsec = (1000 * parallaxErrorMas) / parallaxMas ** 2;
  const componentCount = nullableNumber(row.n_components ?? '') ?? 1;
  const commonName = (hipId && COMMON_NAMES_BY_HIP[hipId]) || (gjId && COMMON_NAMES_BY_GJ[gjId]);
  const identifiers = [
    `CNS5 ${cns5Id}`,
    gjId ? `GJ ${gjId}` : null,
    hipId ? `HIP ${hipId}` : null,
    gaiaId ? `Gaia DR3 ${gaiaId}` : null,
  ].filter((value): value is string => value !== null);
  const displayName = commonName ?? identifiers[1] ?? identifiers[0] ?? `CNS5 ${cns5Id}`;

  return {
    id: `cns5-${cns5Id}`,
    displayName,
    aliases: commonName ? [commonName, ...identifiers] : identifiers,
    catalogIds: {
      CNS5: `CNS5 ${cns5Id}`,
      GJ: gjId ? `GJ ${gjId}` : null,
      HIP: hipId ? `HIP ${hipId}` : null,
      GaiaDR3: gaiaId ? `Gaia DR3 ${gaiaId}` : null,
    },
    multiplicity: componentCount > 1 ? 'multiple' : 'single',
    componentCount,
    positionBasis: componentCount > 1 ? 'primary-component' : 'catalog-object',
    astrometry: {
      coordinateFrame: 'ICRS',
      referenceEpochJYear: Number(row.epoch),
      raDeg: { value: Number(row.ra), sourceId: 'cns5-2023' },
      decDeg: { value: Number(row.dec), sourceId: 'cns5-2023' },
      parallaxMas: { value: parallaxMas, uncertainty: parallaxErrorMas, sourceId: 'cns5-2023' },
      properMotionRaMasYr: {
        value: Number(row.pmra),
        uncertainty: Number(row.pmra_error),
        sourceId: 'cns5-2023',
      },
      properMotionDecMasYr: {
        value: Number(row.pmdec),
        uncertainty: Number(row.pmdec_error),
        sourceId: 'cns5-2023',
      },
      references: {
        coordinatesBibcode: row.coordinates_bibcode,
        parallaxBibcode: row.parallax_bibcode,
        properMotionBibcode: row.pm_bibcode,
      },
    },
    distance: {
      parsec: distanceParsec,
      lightYear: distanceParsec * LIGHT_YEARS_PER_PARSEC,
      uncertaintyParsec,
      uncertaintyLightYear: uncertaintyParsec * LIGHT_YEARS_PER_PARSEC,
      method: 'inverse-parallax',
      sourceId: 'derived-inverse-parallax',
    },
    photometry: {
      apparentMagnitudeG: measurement(
        nullableNumber(row.g_mag_resulting ?? ''),
        nullableNumber(row.g_mag_resulting_error ?? ''),
      ),
      absoluteMagnitudeG: null,
      gRpColorIndex: measurement(
        nullableNumber(row.g_rp_resulting ?? ''),
        nullableNumber(row.g_rp_resulting_error ?? ''),
      ),
      spectralType: null,
    },
    radialVelocityKmS: measurement(
      nullableNumber(row.rv ?? ''),
      nullableNumber(row.rv_error ?? ''),
    ),
    stellarProperties: {
      effectiveTemperatureK: null,
      radiusSolar: null,
      massSolar: null,
      luminositySolar: null,
    },
    confirmedPlanets: [],
    planetDataStatus: 'confirmed-snapshot',
  };
});

type ExoplanetRow = Record<string, string | number | null>;
const planetQuery = `SELECT hostname, pl_name, discoverymethod, disc_year,
  pl_orbper, pl_orbsmax, pl_rade, pl_bmasse, ra, dec,
  st_spectype, st_teff, st_rad, st_mass, st_lum, sy_dist
FROM pscomppars`;
const planetUrl = new URL(EXOPLANET_TAP_URL);
planetUrl.search = new URLSearchParams({ query: planetQuery, format: 'json' }).toString();
const planetResponse = await fetch(planetUrl);
if (!planetResponse.ok)
  throw new Error(
    `NASA Exoplanet Archive query failed: ${planetResponse.status} ${planetResponse.statusText}`,
  );
const planetPayload: unknown = await planetResponse.json();
if (!Array.isArray(planetPayload))
  throw new Error('NASA Exoplanet Archive returned a non-array payload.');
const planetRows = planetPayload.filter(
  (row): row is ExoplanetRow => row !== null && typeof row === 'object',
);

function numberFromUnknown(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function angularSeparationDeg(ra1: number, dec1: number, ra2: number, dec2: number): number {
  const radians = Math.PI / 180;
  const cosine =
    Math.sin(dec1 * radians) * Math.sin(dec2 * radians) +
    Math.cos(dec1 * radians) * Math.cos(dec2 * radians) * Math.cos((ra1 - ra2) * radians);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) / radians;
}

const planetsBySystem = new Map<string, ExoplanetRow[]>();
for (const planet of planetRows) {
  const hostname = String(planet.hostname ?? '');
  let matchedSystem =
    hostname === 'Proxima Cen'
      ? baseSystems.find((system) => system.id === 'cns5-3627')
      : undefined;
  const ra = numberFromUnknown(planet.ra);
  const dec = numberFromUnknown(planet.dec);
  const hostDistanceParsec = numberFromUnknown(planet.sy_dist);
  if (!matchedSystem && ra !== null && dec !== null && hostDistanceParsec !== null) {
    const nearest = baseSystems
      .map((system) => ({
        system,
        separation: angularSeparationDeg(
          ra,
          dec,
          system.astrometry.raDeg.value,
          system.astrometry.decDeg.value,
        ),
      }))
      .sort((left, right) => left.separation - right.separation)[0];
    if (
      nearest &&
      nearest.separation <= 0.25 &&
      Math.abs(nearest.system.distance.parsec - hostDistanceParsec) <= 0.5
    )
      matchedSystem = nearest.system;
  }
  if (matchedSystem)
    planetsBySystem.set(matchedSystem.id, [
      ...(planetsBySystem.get(matchedSystem.id) ?? []),
      planet,
    ]);
}

const systems = baseSystems.map((system) => {
  const planetRowsForSystem = planetsBySystem.get(system.id) ?? [];
  const primaryHost = system.multiplicity === 'single' ? planetRowsForSystem[0] : undefined;
  const apparentG = system.photometry.apparentMagnitudeG;
  const absoluteMagnitudeG = apparentG
    ? {
        value: apparentG.value - 5 * Math.log10(system.distance.parsec) + 5,
        sourceId: 'derived-absolute-magnitude',
      }
    : null;
  const nasaMeasurement = (
    value: string | number | null | undefined,
    transform = (input: number) => input,
  ) => {
    const parsed = numberFromUnknown(value);
    return parsed === null
      ? null
      : { value: transform(parsed), sourceId: 'nasa-exoplanet-archive' };
  };
  return {
    ...system,
    photometry: {
      ...system.photometry,
      spectralType: primaryHost?.st_spectype ? String(primaryHost.st_spectype) : null,
      absoluteMagnitudeG,
    },
    stellarProperties: {
      effectiveTemperatureK: nasaMeasurement(primaryHost?.st_teff),
      radiusSolar: nasaMeasurement(primaryHost?.st_rad),
      massSolar: nasaMeasurement(primaryHost?.st_mass),
      luminositySolar: nasaMeasurement(primaryHost?.st_lum, (logLuminosity) => 10 ** logLuminosity),
    },
    confirmedPlanets: planetRowsForSystem
      .map((planet) => ({
        name: String(planet.pl_name),
        hostName: String(planet.hostname),
        discoveryMethod: String(planet.discoverymethod),
        discoveryYear: Number(planet.disc_year),
        orbitalPeriodDays: numberFromUnknown(planet.pl_orbper),
        semiMajorAxisAu: numberFromUnknown(planet.pl_orbsmax),
        radiusEarth: numberFromUnknown(planet.pl_rade),
        massEarth: numberFromUnknown(planet.pl_bmasse),
        sourceId: 'nasa-exoplanet-archive' as const,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
});

const today = new Date().toISOString().slice(0, 10);
const catalog = stellarCatalogSchema.parse({
  schemaVersion: '3.0.0',
  catalogVersion: 'cns5-gavo-2023-09-04-nearest-150-v2-exoplanets',
  generatedAt: new Date().toISOString(),
  title: 'NearbyStarsViewer nearest 150 stellar systems',
  description: 'The 150 nearest distinct stellar systems selected reproducibly from CNS5.',
  selectionPolicy:
    'CNS5 rows with trigonometric parallax, retaining single objects and flagged system primaries; sorted by descending parallax and limited to 150 systems.',
  sources: [
    {
      id: 'cns5-2023',
      title: 'The Fifth Catalogue of Nearby Stars (CNS5)',
      publisher: 'German Astrophysical Virtual Observatory / A&A',
      catalogVersion: 'Published CNS5 with GAVO corrections through 2023-09-04',
      url: 'https://dc.g-vo.org/cns5/q/cone/info',
      retrievedAt: today,
      license: 'CC BY 4.0',
      acknowledgement:
        'This research has made use of the Fifth Catalogue of Nearby Stars (Golovin et al. 2023) and the GAVO Data Center.',
    },
    {
      id: 'derived-absolute-magnitude',
      title: 'NearbyStarsViewer absolute Gaia G magnitude derivation',
      publisher: 'NearbyStarsViewer',
      catalogVersion: '3.0.0',
      url: 'https://github.com/bradleyburquest/NearbyStarsViewer',
      retrievedAt: today,
      license: 'Project-derived values',
      acknowledgement: 'Absolute magnitude uses M = m - 5 log10(d_pc) + 5.',
    },
    {
      id: 'nasa-exoplanet-archive',
      title: 'NASA Exoplanet Archive Planetary Systems Composite Parameters',
      publisher: 'NASA Exoplanet Science Institute / Caltech IPAC',
      catalogVersion: `PSCompPars snapshot ${today}`,
      url: 'https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html',
      retrievedAt: today,
      license: 'NASA Exoplanet Archive public scientific data; PSCompPars DOI 10.26133/NEA13',
      acknowledgement:
        'This research has made use of the NASA Exoplanet Archive, operated by Caltech under contract with NASA.',
    },
    {
      id: 'derived-inverse-parallax',
      title: 'NearbyStarsViewer inverse-parallax distance derivation',
      publisher: 'NearbyStarsViewer',
      catalogVersion: '2.0.0',
      url: 'https://github.com/bradleyburquest/NearbyStarsViewer',
      retrievedAt: today,
      license: 'Project-derived values',
      acknowledgement: 'Distances use d(pc) = 1000 / parallax(mas) and 1 pc = 3.261563777 ly.',
    },
  ],
  systems,
});

await writeFile(fileURLToPath(OUTPUT_URL), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`Wrote ${catalog.systems.length} systems to ${fileURLToPath(OUTPUT_URL)}.`);
