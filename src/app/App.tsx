import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { SystemDetails } from '../components/SystemDetails';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { nearbyStarsCatalog } from '../data/catalog';
import { solarPlanetNames, sunSystem } from '../data/sunSystem';
import type { SceneDiagnostics, SceneViewportHandle } from '../scene/SceneViewport';
import type { ReferenceLayerKey } from '../scene/referenceLayers';
import {
  filterSystems,
  formatDistance,
  type DistanceUnit,
  type LabelMode,
  type MarkerMode,
  type SortMode,
} from '../services/catalogFilters';
import { readViewState, writeViewState } from './viewState';
import { readPreferences, writePreferences } from './preferences';

const SceneViewport = lazy(() =>
  import('../scene/SceneViewport').then((module) => ({ default: module.SceneViewport })),
);

const systems = [sunSystem, ...nearbyStarsCatalog.systems];
const catalogMaximumLy = nearbyStarsCatalog.systems.at(-1)?.distance.lightYear ?? 25;
const confirmedPlanetCount = systems.reduce<number>(
  (total, system) => total + system.confirmedPlanets.length,
  solarPlanetNames.length,
);

export function App() {
  const initial = useMemo(() => {
    const urlState = readViewState(window.location.search, catalogMaximumLy);
    if (window.location.search.length > 1) return urlState;
    return { ...urlState, ...readPreferences(window.localStorage) };
  }, []);
  const sceneRef = useRef<SceneViewportHandle>(null);
  const helpCloseRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState(initial.query);
  const [maximumDistanceLy, setMaximumDistanceLy] = useState(initial.maximumDistanceLy);
  const [unit, setUnit] = useState<DistanceUnit>(initial.unit);
  const [sort, setSort] = useState<SortMode>(initial.sort);
  const [labels, setLabels] = useState<LabelMode>(initial.labels);
  const [markerMode, setMarkerMode] = useState<MarkerMode>(initial.markerMode);
  const [stellarColors, setStellarColors] = useState(initial.stellarColors);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(initial.selected);
  const [revealedSystemIds, setRevealedSystemIds] = useState<ReadonlySet<string>>(() => new Set());
  const [layers, setLayers] = useState(initial.layers);
  const [layerOpacity, setLayerOpacity] = useState(initial.layerOpacity);
  const [properMotion, setProperMotion] = useState(initial.properMotion);
  const [planetHostsOnly, setPlanetHostsOnly] = useState(initial.planetHostsOnly);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sceneDiagnostics, setSceneDiagnostics] = useState<SceneDiagnostics | null>(null);
  const visibleSystems = useMemo(
    () => filterSystems(systems, query, maximumDistanceLy, sort, planetHostsOnly),
    [maximumDistanceLy, planetHostsOnly, query, sort],
  );
  const selectedSystem = visibleSystems.find((system) => system.id === selectedSystemId) ?? null;
  const displayCutoff = unit === 'ly' ? maximumDistanceLy : maximumDistanceLy / 3.261563777;
  const displayMaximum = unit === 'ly' ? catalogMaximumLy : catalogMaximumLy / 3.261563777;

  useEffect(() => {
    const search = writeViewState(
      {
        query,
        maximumDistanceLy,
        unit,
        sort,
        labels,
        markerMode,
        stellarColors,
        selected: selectedSystem?.id ?? null,
        layers,
        layerOpacity,
        properMotion,
        planetHostsOnly,
      },
      catalogMaximumLy,
    );
    window.history.replaceState(null, '', `${window.location.pathname}${search}`);
  }, [
    labels,
    layerOpacity,
    layers,
    markerMode,
    maximumDistanceLy,
    properMotion,
    planetHostsOnly,
    query,
    selectedSystem,
    sort,
    stellarColors,
    unit,
  ]);

  useEffect(() => {
    writePreferences(window.localStorage, {
      unit,
      labels,
      markerMode,
      stellarColors,
      layers,
      layerOpacity,
      properMotion,
      planetHostsOnly,
    });
  }, [
    labels,
    layerOpacity,
    layers,
    markerMode,
    planetHostsOnly,
    properMotion,
    stellarColors,
    unit,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (helpOpen) setHelpOpen(false);
        else if (selectedSystemId) setSelectedSystemId(null);
      }
      if (event.key === '?' && !(event.target instanceof HTMLInputElement)) setHelpOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [helpOpen, selectedSystemId]);

  useEffect(() => {
    if (helpOpen) helpCloseRef.current?.focus();
  }, [helpOpen]);

  const setDisplayCutoff = (value: number) =>
    setMaximumDistanceLy(
      Math.min(catalogMaximumLy, Math.max(1, unit === 'ly' ? value : value * 3.261563777)),
    );
  const toggleLayer = (key: ReferenceLayerKey) =>
    setLayers((current) => ({ ...current, [key]: !current[key] }));

  return (
    <main className="app-shell">
      <a className="skip-link" href="#catalog-list-title">
        Skip to catalog
      </a>
      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <h1>NearbyStarsViewer</h1>
            <p>Local stellar neighborhood</p>
          </div>
        </div>
        <div className="top-actions">
          <button className="secondary-button" type="button" onClick={() => setHelpOpen(true)}>
            Help
          </button>
        </div>
      </header>
      <section
        className={`workspace${selectedSystem ? ' workspace--details-open' : ''}`}
        aria-label="Nearby stars workspace"
      >
        <aside className="control-panel" aria-label="Viewer controls">
          <p className="eyebrow">Explore the catalog</p>
          <div className="catalog-heading-row">
            <h2>Sun-centered neighborhood</h2>
            <button
              className="mobile-label-switch"
              type="button"
              role="switch"
              aria-label="Star labels"
              aria-checked={labels !== 'none'}
              onClick={() => setLabels((current) => (current === 'none' ? 'all' : 'none'))}
            >
              <span>Labels</span>
              <span className="mobile-label-switch__track" aria-hidden="true">
                <span />
              </span>
            </button>
          </div>
          <div className="filter-controls">
            <label>
              Search names, IDs, and constellations
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Alpha Centauri, GJ 559…"
              />
            </label>
            <label>
              Maximum distance ({unit})
              <div className="range-row">
                <input
                  aria-label={`Maximum distance in ${unit}`}
                  type="range"
                  min="1"
                  max={displayMaximum}
                  step="0.1"
                  value={displayCutoff}
                  onChange={(event) => setDisplayCutoff(event.target.valueAsNumber)}
                />
                <output>{displayCutoff.toFixed(1)}</output>
              </div>
            </label>
            <div className="control-grid">
              <label>
                Units
                <select
                  value={unit}
                  onChange={(event) => setUnit(event.target.value as DistanceUnit)}
                >
                  <option value="ly">Light-years</option>
                  <option value="pc">Parsecs</option>
                </select>
              </label>
              <label>
                Sort
                <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                  <option value="distance">Distance</option>
                  <option value="name">Name</option>
                  <option value="magnitude">Brightness</option>
                </select>
              </label>
              <label>
                Labels
                <select
                  value={labels}
                  onChange={(event) => setLabels(event.target.value as LabelMode)}
                >
                  <option value="prominent">Prominent</option>
                  <option value="selected">Selected only</option>
                  <option value="all">All</option>
                  <option value="none">None</option>
                </select>
              </label>
              <label>
                Marker size
                <select
                  value={markerMode}
                  onChange={(event) => setMarkerMode(event.target.value as MarkerMode)}
                >
                  <option value="clarity">Equal clarity</option>
                  <option value="brightness">By brightness</option>
                </select>
              </label>
            </div>
            <label className="check-control">
              <input
                type="checkbox"
                checked={stellarColors}
                onChange={(event) => setStellarColors(event.target.checked)}
              />
              Estimated stellar colors
            </label>
            <fieldset className="layer-controls">
              <legend>Reference layers</legend>
              {(
                [
                  ['constellations', 'All constellation figures'],
                  ['galacticPlane', 'Galactic plane'],
                  ['equatorialGrid', 'Equatorial grid'],
                  ['ecliptic', 'Ecliptic'],
                  ['galacticGrid', 'Galactic grid'],
                ] as const
              ).map(([key, label]) => (
                <label className="check-control" key={key}>
                  <input type="checkbox" checked={layers[key]} onChange={() => toggleLayer(key)} />
                  {label}
                </label>
              ))}
              <label>
                Layer intensity
                <div className="range-row">
                  <input
                    aria-label="Reference layer intensity"
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity}
                    onChange={(event) => setLayerOpacity(event.target.valueAsNumber)}
                  />
                  <output>{Math.round(layerOpacity * 100)}%</output>
                </div>
              </label>
            </fieldset>
            <label className="check-control">
              <input
                type="checkbox"
                checked={properMotion}
                onChange={(event) => setProperMotion(event.target.checked)}
              />
              Proper-motion vectors
            </label>
            <label className="check-control">
              <input
                type="checkbox"
                checked={planetHostsOnly}
                onChange={(event) => setPlanetHostsOnly(event.target.checked)}
              />
              Confirmed planet hosts only
            </label>
          </div>
          <div className="viewer-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => sceneRef.current?.resetView()}
            >
              Reset view
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void sceneRef.current?.toggleFullscreen()}
            >
              Fullscreen
            </button>
          </div>
          <p className="result-count" role="status">
            {visibleSystems.length} of {systems.length} systems shown
          </p>
          <div className="catalog-list" aria-labelledby="catalog-list-title">
            <p className="eyebrow" id="catalog-list-title">
              Matching systems
            </p>
            {visibleSystems.length ? (
              <ol>
                {visibleSystems.map((system) => (
                  <li key={system.id}>
                    <button
                      type="button"
                      className={system.id === selectedSystemId ? 'is-selected' : undefined}
                      aria-pressed={system.id === selectedSystemId}
                      onClick={() => setSelectedSystemId(system.id)}
                    >
                      <span>{system.displayName}</span>
                      <span>{formatDistance(system, unit)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-result">No systems match these filters.</p>
            )}
          </div>
        </aside>
        <ErrorBoundary scope="viewer">
          <Suspense
            fallback={
              <section className="scene-panel scene-loading" aria-live="polite">
                Loading 3D viewer…
              </section>
            }
          >
            <SceneViewport
              ref={sceneRef}
              systems={visibleSystems}
              selectedSystemId={selectedSystemId}
              onSelectSystem={setSelectedSystemId}
              revealedSystemIds={revealedSystemIds}
              onRevealSystem={(systemId) =>
                setRevealedSystemIds((current) => new Set(current).add(systemId))
              }
              labelMode={labels}
              markerMode={markerMode}
              stellarColors={stellarColors}
              layers={layers}
              layerOpacity={layerOpacity}
              showProperMotion={properMotion}
              onDiagnostics={setSceneDiagnostics}
            />
          </Suspense>
        </ErrorBoundary>
        {selectedSystem && (
          <SystemDetails
            system={selectedSystem}
            onClose={() => setSelectedSystemId(null)}
            onFocus={() => sceneRef.current?.focusSystem(selectedSystem.id)}
          />
        )}
      </section>
      <div className="sr-only" aria-live="polite">
        {visibleSystems.length} systems shown. Sun-centered origin.
        {selectedSystem ? ` Selected ${selectedSystem.displayName}.` : ''}
      </div>
      {helpOpen && (
        <section
          className="help-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
        >
          <div>
            <div className="details-heading">
              <h2 id="help-title">Viewer help</h2>
              <button
                ref={helpCloseRef}
                className="icon-button"
                type="button"
                aria-label="Close help"
                onClick={() => setHelpOpen(false)}
              >
                ×
              </button>
            </div>
            <p>
              Drag to orbit and scroll or pinch to zoom. Camera zoom does not change the distance
              filter.
            </p>
            <dl className="shortcut-list">
              <div>
                <dt>Arrow keys</dt>
                <dd>Orbit</dd>
              </div>
              <div>
                <dt>+ / −</dt>
                <dd>Zoom</dd>
              </div>
              <div>
                <dt>0</dt>
                <dd>Reset camera</dd>
              </div>
              <div>
                <dt>F</dt>
                <dd>Fullscreen</dd>
              </div>
              <div>
                <dt>Escape</dt>
                <dd>Close panel</dd>
              </div>
              <div>
                <dt>?</dt>
                <dd>Open this help</dd>
              </div>
            </dl>
            <p className="details-note">
              Marker sizes and colors are visual encodings, not literal stellar diameters or
              calibrated colors. Motion arrows show angular direction and relative rate, not
              complete 3D velocity.
            </p>
            <p className="details-note">
              Catalog {nearbyStarsCatalog.catalogVersion} · schema{' '}
              {nearbyStarsCatalog.schemaVersion}
            </p>
            <details className="diagnostics">
              <summary>Runtime diagnostics</summary>
              <dl>
                <div>
                  <dt>Graphics</dt>
                  <dd>{sceneDiagnostics?.webglVersion ?? 'Starting'}</dd>
                </div>
                <div>
                  <dt>Renderer</dt>
                  <dd>{sceneDiagnostics?.renderer ?? 'Starting'}</dd>
                </div>
                <div>
                  <dt>Pixel ratio</dt>
                  <dd>{sceneDiagnostics?.pixelRatio.toFixed(2) ?? '—'}</dd>
                </div>
                <div>
                  <dt>Scene startup</dt>
                  <dd>
                    {sceneDiagnostics ? `${sceneDiagnostics.initializationMs.toFixed(1)} ms` : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Last render</dt>
                  <dd>
                    {sceneDiagnostics
                      ? `${sceneDiagnostics.drawCalls} calls · ${sceneDiagnostics.triangles.toLocaleString()} triangles`
                      : '—'}
                  </dd>
                </div>
              </dl>
            </details>
          </div>
        </section>
      )}
      <footer className="status-bar">
        <span>
          Sun-centered · CNS5 plus Sun · {systems.length} systems · {confirmedPlanetCount} planets
        </span>
        <span>CNS5 stars: ICRS · per-record epoch · inverse-parallax distance</span>
      </footer>
    </main>
  );
}
