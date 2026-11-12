# NearbyStarsViewer Data Sources

## Phase 4 catalog

The production artifact contains the 150 nearest distinct stellar systems selected from the Fifth Catalogue of Nearby Stars (CNS5). The refresh script queries the [GAVO CNS5 TAP service](https://dc.g-vo.org/cns5/q/cone/info), retaining rows with a trigonometric parallax that are either single objects or flagged system primaries. It orders by descending parallax and limits the result to 150. This avoids presenting cataloged components as separate top-level systems.

The catalog snapshot identifies GAVO corrections through 2023-09-04 and was retrieved on 2026-11-11. CNS5 is described by Golovin et al. (2023), [A&A 670, A19](https://doi.org/10.1051/0004-6361/202244250). GAVO distributes this service under CC BY 4.0.

Required acknowledgement: “This research has made use of the Fifth Catalogue of Nearby Stars (Golovin et al. 2023) and the GAVO Data Center.”

## Reproduction

Run:

```powershell
$env:NODE_USE_SYSTEM_CA='1'
npm run catalog:refresh
npm run constellations:refresh
npm run validate:data
```

`scripts/fetch-cns5.ts` contains the exact ADQL selections, cross-match rules, and field mappings. It generates `src/data/nearby-stars-catalog.json`; application startup validates that artifact against schema 4.0.0. The generated records retain CNS5, GJ, HIP, and Gaia DR3 identifiers when available, per-record epochs and bibliographic codes, astrometry, Gaia G/G−RP photometry, multiplicity, radial velocity, derived absolute magnitude, constellation membership, and the confirmed-planet snapshot.

## Confirmed exoplanets and host properties

Phase 7 queries the [NASA Exoplanet Archive TAP service](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html) `PSCompPars` table. The committed snapshot was retrieved on 2026-11-11 and contains 80 confirmed planets associated with 37 catalog systems. It includes planet and component-host names, discovery method/year, period, semimajor axis, Earth mass/radius when available, and available host spectral type, temperature, solar radius, solar mass, and luminosity.

Hosts are cross-matched to CNS5 by both angular separation (at most 0.25°) and distance agreement (at most 0.5 pc), preventing unrelated background systems from matching by sky position alone. Proxima Centauri is explicitly associated with the Alpha Centauri top-level system while retaining `Proxima Cen` as the planet host. Host properties are added only to single-star top-level systems to avoid presenting a component's measurements as the properties of an unresolved multiple system.

NASA Exoplanet Archive acknowledgement: “This research has made use of the NASA Exoplanet Archive, operated by the California Institute of Technology, under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program.” The PSCompPars dataset DOI is [10.26133/NEA13](https://doi.org/10.26133/NEA13); the preferred archive overview is Christiansen et al. (2025), DOI [10.3847/PSJ/ade3c2](https://doi.org/10.3847/PSJ/ade3c2).

## Derived distances and coordinates

```text
distanceParsec = 1000 / parallaxMas
distanceLightYear = distanceParsec × 3.261563777
x = d cos(dec) cos(ra)
y = d cos(dec) sin(ra)
z = d sin(dec)
```

The Cartesian convention is right-handed: +X points to RA 0°, +Y to RA 90°, and +Z to Dec +90°. Direct inverse parallax is suitable for this nearby, high signal-to-noise catalog, but remains explicitly marked as a project-derived value.

## Constellation membership and figures

Each system's constellation membership is calculated against the 88 official IAU sky regions using Astronomy Engine's boundary lookup. Catalog coordinates and proper motion are propagated linearly to J2000 before lookup. Membership describes the direction in which the system appears from Earth; it does not imply physical association with the distant stars in the constellation figure.

The background line figures come from the [Celestial Data constellation-lines collection](https://dieghernan.github.io/celestial_data/datasets/constellations.lines/), derived from d3-celestial and distributed under BSD 3-Clause. The 89 GeoJSON features cover all 88 IAU constellations in J2000 coordinates; Serpens is represented by two features. Collection DOI: [10.5281/zenodo.7561601](https://doi.org/10.5281/zenodo.7561601). These lines are illustrative figures, not official IAU boundaries. See `THIRD_PARTY_NOTICES.md`.

Common display names are a small maintained mapping keyed by stable CNS5 identifiers. Catalog aliases remain searchable. Estimated marker colors use spectral type when present and Gaia G−RP otherwise; they are visualization aids, not calibrated rendered colors.

An empty confirmed-planet array means no match exists in the dated archive snapshot; it is not evidence that the system has no planets.
