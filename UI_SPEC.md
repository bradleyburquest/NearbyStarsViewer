# NearbyStarsViewer UI Specification

## 1. Experience goals

The interface should feel like an astronomical instrument while remaining approachable. The 3D scene is primary; controls are compact, discoverable, reversible, and do not obscure context.

Always communicate the active origin, distance cutoff, visible reference layers, selected object, and whether sizes or distances are literal or visually encoded.

## 2. Layout

### Desktop (at least 1024 CSS px)

- **Top bar:** name, Sun/Earth selector, search, reset, fullscreen, help/settings.
- **Left panel:** distance and layer controls; collapsible.
- **Center:** responsive 3D viewport.
- **Right panel:** selected-system details; closed until selection and collapsible.
- **Status strip:** scale, visible/total count, frame/epoch, loading messages, attribution.

### Narrow screens

Use a compact top bar over a full-viewport scene and mutually exclusive bottom sheets for controls/details. Touch targets are at least 44 by 44 CSS px. No operation requires hover.

## 3. Viewport interaction

- Primary-pointer/one-finger drag orbits the origin.
- Wheel, trackpad pinch, or two-finger pinch zooms the camera.
- Arrow keys orbit; `+`/`-` zoom; `0` resets; `F` toggles fullscreen; `Escape` closes a panel or fullscreen.
- Selection highlights a system and opens details without changing origin.
- **Focus** frames the selected system; **Return to origin** restores the origin view.
- Bound zoom, retain an always-available reset, and honor reduced-motion preferences.

Camera zoom changes perspective. The distance cutoff independently controls which systems render.

## 4. Primary controls

### Origin and search

Use a **Sun / Earth** segmented control, default Sun. Preserve compatible settings on switch and echo the origin in status/accessibility text. Earth mode is a viewpoint transformation, not a stationary-Earth claim.

Phase 5 uses Earth's fixed J2000 vernal-equinox heliocentric position (+X, 1 AU). The resulting translation is mathematically applied but visually negligible at parsec overview scale; the interface discloses this rather than exaggerating it.

Search common names and catalog IDs. Results show name, ID, spectral class, and distance; support keyboard navigation; and select the chosen system.

### Fullscreen

Use the Fullscreen API. If unavailable or denied, maximize within the viewport and explain non-modally.

### Distance cutoff

- Labeled slider plus numeric entry, defaulting to light-years.
- Maximum includes all 150 systems.
- Show `N of 150 systems within X ly`.
- Apply immediately without moving the camera.
- Allow light-year/parsec display conversion without changing the underlying filter.

### Reference layers

The Phase 5 constellation overlay contains simplified educational line figures for Orion, Ursa Major, and Cassiopeia. These are orientation aids rather than IAU constellation boundaries.

Independently toggle major constellation lines/labels, galactic plane, equatorial grid, ecliptic, and galactic grid. Background layers expose 0–100% opacity; defaults remain subordinate to stars.

### Star display

Offer labels (none, selected, prominent), proper-motion vectors (default off), apparent-brightness versus clarity modes, and spectral-class color with a legend.

## 5. Star representation

- Plot transformed catalog positions in the active frame.
- Hue may approximate spectral class/temperature.
- Marker size/glow is perceptual, not literal diameter or brightness; disclose this.
- Preserve a minimum selectable marker size.
- Represent multiple systems as one overview marker and disclose components in details.
- Motion arrows show direction and relative angular rate with scale/epoch; they do not imply radial velocity.
- Use a high-contrast selection reticle, never color alone.

## 6. Details panel

Show available values in this order:

1. Common name and primary catalog ID
2. Distance in light-years and parsecs
3. RA/declination with frame and epoch
4. Spectral and luminosity class
5. Apparent and absolute magnitude
6. Estimated radius, mass, temperature, luminosity
7. Proper-motion components, total, direction, units
8. Radial velocity
9. Stellar components
10. Confirmed exoplanets
11. Sources, data version/date, and uncertainty

Missing fields read `Not available`, not zero. Define specialist terms and units with accessible help.

## 7. Loading and errors

Show lightweight catalog/asset progress and disable only unavailable controls. Graphics failure retains a readable explanation and semantic catalog view. Optional-overlay failure does not stop the core scene. A no-match filter retains orientation and offers reset.

## 8. Accessibility

- Target WCAG 2.2 AA for application UI.
- Give controls accessible names, states, and keyboard paths.
- Maintain a canvas summary for origin, cutoff, count, and selection.
- Provide a searchable semantic catalog view so information is not canvas-only.
- Support forced colors and 200% text zoom; do not rely on color alone.
- Announce selection, origin, count, and errors through a polite live region.

## 9. Persistence and visual direction

Phase 6 provides a non-blocking help dialog, keyboard shortcut reference, skip navigation, polite state announcements, and locally persisted validated display preferences. Shareable URL state takes precedence over saved preferences.

Persist non-sensitive origin, units, layers, opacity, label mode, and effect preferences. Validate/version saved and shareable URL state; never restore an invalid camera. Use a dismissible first-use hint, not a blocking tour.

Use a near-black low-chroma background, restrained blue/amber accents, clear hierarchy, and compact controls. Avoid excessive bloom, decorative animation, and dense labels. Include legends for spectral color, marker sizing, units, and motion vectors.

