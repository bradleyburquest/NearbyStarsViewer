# NearbyStarsViewer Requirements

## 1. Product summary

NearbyStarsViewer is a web application for exploring the 150 stellar systems closest to the Sun in three dimensions. It combines a navigable scene, astronomical overlays, and inspectable catalog data.

This normalizes `NSV_requirements.md`. “Must” is initial-release scope; “should” is desirable after the first complete vertical slice.

## 2. Users and goals

Astronomy enthusiasts, students, educators, and casual learners can understand the local stellar neighborhood; change origin; navigate, search, select, and inspect systems; limit by distance; and use constellations, planes, and grids for orientation.

## 3. Scope assumptions

- The production dataset has exactly 150 top-level **stellar systems** ranked by best available Sun distance. Multiple-system components are nested.
- “Size” is physical radius when available; scene marker size is a disclosed visual encoding.
- Planet data includes confirmed exoplanets from a versioned snapshot, not candidates.
- Earth mode uses a documented epoch/position model and need not be real-time initially.
- Proper motion is angular sky motion; radial velocity is separate.
- Constellation context means major line figures and labels, not necessarily IAU boundaries.

## 4. Functional requirements

### FR-1 Browser application

- Run without installation in stable Chrome, Firefox, and Safari.
- Use standards compatible with DuckDuckGo browsers on their platform engines.
- Provide an informative graphics fallback and responsive layouts.

### FR-2 Catalog

- Load and visualize exactly 150 nearest stellar systems.
- Give each a stable ID, distance, position, frame, epoch, and provenance.
- Generate reproducibly from documented, redistributable sources.
- Expose components without top-level double counting.
- Represent missing values as unavailable, never zero.

### FR-3 3D navigation

- Display systems in a navigable 3D scene.
- Support pointer, touch, and keyboard orbit/zoom and camera reset.
- Keep overlaps usable through selection, highlighting, and clutter controls.
- Distinguish camera zoom from distance filtering.

### FR-4 Origin

- Select Sun- or Earth-centered origin; default to Sun.
- Always display the active origin.
- Preserve compatible settings during switching.
- Document the coordinate/epoch model in the UI.

### FR-5 Selection and data

- Select rendered systems and search common names/catalog IDs.
- Highlight selection and show details.
- Where available, show RA/declination and frame/epoch; distance; spectral/luminosity class; apparent/absolute magnitude; radius, mass, temperature, luminosity; proper motion; radial velocity; components; confirmed exoplanets; provenance; and uncertainty.
- Explain specialist terms and encodings accessibly.

### FR-6 Distance cutoff

- Set maximum distance and hide systems beyond it.
- Display cutoff, unit, and visible count out of 150.
- Do not move the camera or change origin when filtering.

### FR-7 Reference layers

- Independently toggle constellation figures/labels, galactic plane, equatorial grid, ecliptic, and galactic grid.
- Adjust constellation and galactic-plane intensity.
- Identify relevant frames/epochs and keep defaults visually subordinate.

### FR-8 Motion

- Toggle proper-motion arrows.
- Explain scale, unit, and epoch.
- Do not present them as 3D velocity without radial-velocity support.

### FR-9 Fullscreen

- Enter/leave fullscreen where supported.
- Resize correctly on fullscreen, resize, and device rotation.
- Remain usable in viewport-maximized form if fullscreen fails.

### FR-10 Preferences and sharing

- The app should retain valid non-sensitive preferences.
- It should provide a shareable selected-system/view URL.
- Stored/shared state must be versioned and validated.

### FR-11 Accessible alternative

- Essential information must exist outside the canvas in a searchable semantic view.
- Filtering and selection stay synchronized with the 3D scene.

## 5. Non-functional requirements

### Accuracy and provenance

Frame, epoch, units, source release, and transformation version are explicit. Derived values are reproducible and tested. Do not imply false precision. Date time-sensitive exoplanet snapshots.

### Performance

Manipulation/filtering feels immediate. Avoid per-object requests and repeated per-frame transforms. Target 60 fps on a representative laptop and usable 30 fps on the defined mobile baseline. Measure concrete budgets during the first milestone.

### Accessibility

Target WCAG 2.2 AA. All functions are keyboard operable with visible focus. Use 44 by 44 CSS px touch targets where practical. Do not rely on color, hover, sound, or motion alone. Respect reduced motion and 200% text zoom.

### Reliability, security, and maintainability

Invalid catalog/state fails safely; optional-overlay failures do not block exploration; resources are disposed. No initial account or personal-data collection is needed. Never inject external markup or ship secrets. Pin dependencies. Use strict TypeScript, keep domain math independent from frameworks, and version catalog/state schemas.

## 6. Initial-release acceptance criteria

1. A validated, attributed 150-system catalog loads in production.
2. Positions use documented coordinates and cutoff counts are correct.
3. Orbit, zoom, reset, selection, search, and details work by pointer and keyboard.
4. Sun/Earth origins switch correctly under the documented model.
5. All five layer categories toggle independently and opacity works.
6. Motion vectors can be enabled and are explained.
7. Fullscreen works or degrades cleanly.
8. The accessible catalog supports essential selection and inspection.
9. Unit, integration, data, and end-to-end smoke tests pass.
10. Chrome, Firefox, Safari/WebKit, and available DuckDuckGo checks pass.
11. No critical automated or manual keyboard accessibility violations remain.

## 7. Out of scope initially

- Spacecraft-grade real-time ephemerides or relativistic simulation
- Physically exact diameters/binary separation at overview scale
- Accounts, social features, annotations, or collaboration
- In-browser catalog editing
- Candidate exoplanets, VR, native apps, or an unrestricted larger catalog

## 8. Open decisions

- Source releases/licenses for positions, distances, properties, and exoplanets
- Tie-breaking and uncertainty policy at the 150th system
- Earth-origin epoch/ephemeris model
- Redistributable constellation figure dataset
- Performance baseline devices and measured budgets

