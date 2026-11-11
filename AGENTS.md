# AGENTS.md

## Project purpose

NearbyStarsViewer is a browser-based interactive 3D visualization of the 150 stellar systems closest to the Sun. It should make nearby stellar data understandable without sacrificing astronomical correctness.

## Source of truth

Read these files before material changes, in precedence order:

1. `REQUIREMENTS.md` — scope and acceptance criteria
2. `UI_SPEC.md` — interaction, layout, accessibility, and visual behavior
3. `ARCHITECTURE.md` — boundaries, data flow, and engineering decisions
4. `README.md` — overview and verified setup instructions
5. `NSV_requirements.md` — original brief retained for provenance

Update every affected document when behavior changes.

## Working principles

- Preserve astronomical meaning. Label coordinate frames, epochs, units, and provenance.
- Treat top-level records as stellar systems; represent components and planets without double counting.
- Keep rendering separate from ingestion and coordinate calculations.
- Prefer deterministic, tested transforms to calculations in UI components.
- Never fabricate missing values; display `Not available`.
- Use progressive enhancement and feature detection, not user-agent sniffing.
- Keep downloads modest and interaction smooth on current desktop and mobile browsers.

## Expected organization

```text
src/
  app/          # composition and state
  components/   # UI and information panels
  data/         # generated catalog and access
  domain/       # astronomical models and units
  scene/        # 3D scene, camera, layers, picking
  services/     # transforms, filtering, formatting
  styles/       # tokens and responsive rules
  workers/      # optional background calculations
tests/{unit,integration,e2e}/
scripts/        # reproducible ingestion and validation
public/         # static assets and catalog payloads
```

Create directories only when needed; do not add empty scaffolding.

## Implementation conventions

- Use strict TypeScript; avoid `any` at data and coordinate boundaries.
- Put units in names or types (`distanceLy`, `raDeg`, `properMotionMasYr`).
- Store coordinates in a documented canonical frame/epoch and convert through tested domain functions.
- Centralize origin, cutoff, selection, layer visibility/opacity, units, and preferences.
- Keep transient render-loop state out of general UI state.
- Use stable catalog IDs, never display names, as primary keys.
- Sanitize or encode externally sourced text.
- Keep render loops allocation-light; reuse GPU resources and use instancing where practical.
- Update docs with behavior, command, dependency, source, or architecture changes.

## Quality gates

Run the available equivalents of formatting, linting, type checking, unit tests, production build, and end-to-end smoke tests. For visual changes, verify Chrome, Firefox, Safari/WebKit, available DuckDuckGo browsers, keyboard-only use, visible focus, reduced motion, forced colors, responsive widths, and WebGL failure behavior.

Minimum tests cover coordinate conversion, origin transforms, units, filtering, validation, layer controls, selection, fullscreen, and saved-state validation. Use tolerances appropriate to source precision.

## Change discipline

- Preserve unrelated user work and keep changes reviewable.
- Do not commit build output, secrets, local environment files, or non-redistributable data.
- Record source, license, retrieval date, and transformation version for catalog artifacts.
- Resolve ambiguity in `REQUIREMENTS.md` rather than silently encoding assumptions.

