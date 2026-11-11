# NearbyStarsViewer Architecture

## 1. Goals

- Smoothly explore 150 nearby stellar systems in modern browsers.
- Keep astronomical data and transformations correct, traceable, and testable.
- Isolate the 3D engine from the UI framework.
- Operate as a static application without an initial runtime backend.
- Degrade clearly when optional browser or graphics features are absent.

## 2. Recommended stack

- Strict TypeScript, Vite, React, and Three.js
- A small typed store such as Zustand
- Zod or JSON Schema at the catalog boundary
- Vitest, Testing Library, and Playwright
- Scoped CSS backed by shared design tokens

React Three Fiber is acceptable if adopted consistently. Add dependencies only when justified and document foundational changes.

## 3. System context

```text
catalog sources
     |
     v
offline ingestion/validation ---> versioned static catalog + provenance
                                          |
                                          v
browser: data -> domain transforms -> scene adapter -> GPU canvas
              \-> application store -> UI / accessible list
```

Ordinary use requires no catalog API. This improves reproducibility, privacy, and availability. A future service can sit behind the same validated interface.

## 4. Modules

### Catalog pipeline

Offline scripts ingest approved sources, normalize identifiers/units, select the 150 closest qualifying systems, validate them, and emit a compact artifact plus provenance and validation report. Rank by the best documented distance estimate, prefer measured parallax-derived values, model top-level records as systems, resolve cross-catalog duplicates, and pin source/transformation versions.

Phase 7 adds a dated NASA Exoplanet Archive PSCompPars snapshot. Host cross-matching requires agreement in both sky position and distance; explicit component-to-system mappings are retained with the component host name. Composite host properties are applied only to single-star top-level systems.

### Domain model

Typed immutable models describe systems, components, exoplanets, measurements, provenance, frames, epochs, and units, with no renderer types. Missing and uncertain measurements are explicit rather than zero or magic values.

### Coordinate and unit services

- Convert RA/declination/distance to canonical Cartesian coordinates.
- Apply supported frame/epoch transformations.
- Translate between Sun and Earth display origins.
- Derive proper-motion direction from documented components.
- Format angles, distances, velocities, magnitudes, and uncertainties.

Use ICRS with a documented source epoch as the canonical representation. Scene space may use parsecs; presentation supports parsecs and light-years. Document axes and handedness.

Earth mode subtracts a fixed J2000 Earth position of one astronomical unit along the ICRS +X direction, corresponding to a documented vernal-equinox model. This deterministic model is not a real-time ephemeris and is intentionally not exaggerated at parsec overview scale.

### Application state

- **Shareable:** origin, selection, cutoff, layers, opacity, units
- **Persistent:** display/accessibility preferences and last valid view
- **Ephemeral:** hover, loading, open sheet, gesture, animation
- **Render-local:** matrices, reusable vectors, frame timing

Actions enforce ranges and visibility invariants. Persistence and URL decoding are schema-versioned and validated.

### Scene adapter

Accept domain-derived view models, not raw records. Own camera/orbit controls, instanced markers and picking, labels/highlight, motion vectors, reference layers, lifecycle, resize, and pixel-ratio limits. Use demand rendering where feasible and dispose GPU resources.

Phase 5 reference geometry is generated locally as disposable Three.js objects. Proper-motion arrows use the ICRS tangent direction from the catalog's RA and declination components; logarithmically bounded length encodes relative angular rate, not traveled distance or complete space velocity.

### UI and accessible catalog

The UI implements `UI_SPEC.md`, reads selectors, and dispatches semantic actions; it does not calculate coordinates or mutate Three.js objects directly. A semantic list/table shares filtering and selection with the scene and remains usable if graphics fail.

## 5. Data contract

Every artifact includes schema/catalog versions, build/source dates, source identifiers/licenses/attribution, frame/epoch/units, transformation notes, stable cross-IDs, and field provenance/uncertainty where available.

Validation rejects duplicate IDs, non-finite values, RA outside `[0, 360)`, declination outside `[-90, 90]`, non-positive distance, unsupported units/frames, and any production count other than 150 top-level systems. Exoplanet data displays its source snapshot date.

## 6. Data flow

1. Load and validate catalog metadata and payload.
2. Normalize immutable domain models.
3. Apply cutoff/preferences through memoized selectors.
4. Produce positions/motion for the active origin.
5. Update reusable GPU buffers and layers.
6. Dispatch picked/list-selected IDs to the store.
7. Resolve and format details from domain data.

## 7. Performance and compatibility

- Avoid per-object requests and repeated per-frame transforms.
- Target 60 fps on a representative laptop and usable 30 fps on the mobile baseline.
- Transform expensive data offline or once at load.
- Establish measured bundle/load/frame budgets after the first vertical slice.
- Phase 6 splits the semantic application shell from the Three.js scene. Production chunks remain below a 600 kB minified warning budget and approximately 150 kB each when gzip-compressed.
- Use WebGL 2 where available with a readable fallback.
- Feature-detect Pointer Events, ResizeObserver, and Fullscreen API.
- Test stable Chrome, Firefox, Safari, and relevant mobile engines; smoke-test DuckDuckGo.

## 8. Security, privacy, and deployment

The initial release requires no account and collects no personal data. Avoid analytics by default. Use a suitable Content Security Policy, pin dependencies, treat catalog text as untrusted, and never ship credentials.

Produce a static build for GitHub Pages, Cloudflare Pages, Netlify, or equivalent. Support non-root base paths, content hashes, and explicit versioned-catalog caching. Expose app/catalog version and graphics capability in diagnostics.

Phase 8 adds a browser CSP and referrer policy, separate application and scene error boundaries, runtime renderer diagnostics, a production-only dependency audit command, automated accessibility scans, and an Apache deployment verifier. Recommended Apache response headers and hashed-asset caching are documented in `APACHE_DEPLOYMENT.md`.

Automated accessibility scans exclude only the CSS2D spatial-label layer because labels can overlap by their astronomical projection and duplicate the fully audited semantic catalog buttons. Selection remains available through that catalog when a marker label is too crowded to use.

## 9. Testing

- **Unit:** coordinate math, units, formatting, validation, selectors, migrations
- **Integration:** state-to-scene models, layers, origins, search, selection
- **Visual:** desktop/mobile and overlay snapshots with GPU-aware tolerances
- **End to end:** load, camera, cutoff, layers, details, fullscreen, fallback
- **Data:** known records, uniqueness, sorting, ranges, provenance, count

## 10. Decisions still required

- Authoritative redistributable stellar/exoplanet sources
- System/component selection and tie-breaking details
- Earth-origin epoch or ephemeris model
- Licensed constellation line-figure dataset
- Device baseline and concrete performance budgets

Record foundational resolutions as short ADRs under `docs/adr/`.

