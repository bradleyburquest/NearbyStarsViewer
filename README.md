# NearbyStarsViewer

NearbyStarsViewer is a browser-based, Sun-centered 3D explorer for the 150 cataloged stellar systems closest to the Sun. The Sun is also included as a selectable reference object, giving the viewer 151 displayed systems. Users can navigate the local stellar neighborhood, search catalog names and identifiers, filter by distance, and inspect astrometry and photometry.

## Project status

Phase 8 is complete. The application adds isolated application/viewer error recovery, runtime WebGL diagnostics, a restrictive browser Content Security Policy, production dependency auditing, automated WCAG A/AA checks, an Apache deployment verifier, and documented Apache security/cache headers. Phase 7's validated CNS5 and NASA Exoplanet Archive scientific data remains intact.

The constellation layer now draws line figures for all 88 IAU constellations from the BSD-licensed Celestial Data collection. Every nearby system also displays its official Earth-sky IAU constellation name and abbreviation, calculated at J2000 from its astrometry and proper motion.

## Documentation

- [Requirements](REQUIREMENTS.md)
- [UI specification](UI_SPEC.md)
- [Architecture](ARCHITECTURE.md)
- [Agent guide](AGENTS.md)
- [Data sources](DATA_SOURCES.md)
- [Apache deployment](APACHE_DEPLOYMENT.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Original brief](NSV_requirements.md)

## Getting started

Prerequisite: Node.js 24 or a compatible supported release.

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`, or run `npm run build` and serve `dist` through the configured Apache `nearbystars.local` virtual host.

Run the complete non-browser quality gate:

```powershell
npm run check
```

Refresh the catalog from the GAVO CNS5 TAP service, then validate it:

```powershell
$env:NODE_USE_SYSTEM_CA='1'
npm run catalog:refresh
npm run validate:data
```

Run browser tests (Firefox is intentionally omitted on this workstation):

```powershell
npx playwright install chromium webkit
npm run test:e2e
```

Audit production dependencies and verify the Apache deployment:

```powershell
npm run audit:prod
npm run verify:apache
```

## Data and attribution

The bundled catalog is derived from the Fifth Catalogue of Nearby Stars (CNS5), distributed by the German Astrophysical Virtual Observatory under CC BY 4.0. Distances are derived from catalog parallaxes. See [DATA_SOURCES.md](DATA_SOURCES.md) for selection policy, provenance, query details, and attribution.
