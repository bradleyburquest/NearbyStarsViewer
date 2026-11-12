import { useState } from 'react';
import type { StellarSystem } from '../domain/catalog';

type SystemDetailsProps = Readonly<{
  system: StellarSystem;
  onClose: () => void;
  onFocus: () => void;
}>;

function formatSigned(value: number, digits = 4): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
}

function formatUncertainty(uncertainty: number | undefined, digits = 2): string {
  return uncertainty === undefined ? '' : ` ± ${uncertainty.toFixed(digits)}`;
}

function formatOptional(value: number | undefined, suffix: string, digits = 2): string {
  return value === undefined ? 'Not available' : `${value.toFixed(digits)} ${suffix}`;
}

type DataHelpTermProps = Readonly<{ id: string; label: string; help: string }>;

function DataHelpTerm({ id, label, help }: DataHelpTermProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || focused || pinned;
  const tooltipId = `data-help-${id}`;

  return (
    <>
      <button
        className="data-help-trigger"
        type="button"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={(event) => {
          if (pinned) {
            setPinned(false);
            setHovered(false);
            setFocused(false);
            event.currentTarget.blur();
          } else {
            setPinned(true);
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setPinned(false);
            event.currentTarget.blur();
          }
        }}
      >
        <span>{label}</span>
        <span className="data-help-icon" aria-hidden="true">
          ?
        </span>
        <span className="sr-only">Show help for {label}</span>
      </button>
      <span className="data-help-popup" id={tooltipId} role="tooltip" hidden={!open}>
        {help}
      </span>
    </>
  );
}

export function SystemDetails({ system, onClose, onFocus }: SystemDetailsProps) {
  const properMotionTotal = Math.hypot(
    system.astrometry.properMotionRaMasYr.value,
    system.astrometry.properMotionDecMasYr.value,
  );

  return (
    <aside className="details-panel" aria-labelledby="details-title">
      <div className="details-heading">
        <div>
          <p className="eyebrow">Selected system</p>
          <h2 id="details-title">{system.displayName}</h2>
          <p>{system.aliases.slice(1).join(' · ')}</p>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close details">
          ×
        </button>
      </div>

      <button className="primary-button" type="button" onClick={onFocus}>
        Focus in scene
      </button>

      <dl className="details-data">
        <div>
          <dt>
            <DataHelpTerm
              id="distance"
              label="Distance"
              help="The system's distance from the Sun, shown in light-years and parsecs. The plus-or-minus value is the uncertainty derived from its measured parallax."
            />
          </dt>
          <dd>{system.distance.lightYear.toFixed(2)} ly</dd>
          <dd>{system.distance.parsec.toFixed(3)} pc</dd>
          <dd>± {system.distance.uncertaintyLightYear.toFixed(3)} ly</dd>
        </div>
        <div>
          <dt>
            <DataHelpTerm
              id="coordinates"
              label="Coordinates"
              help="Right ascension (RA) and declination (Dec) locate the system on Earth's celestial sphere, much like longitude and latitude locate a place on Earth."
            />
          </dt>
          <dd>RA {system.astrometry.raDeg.value.toFixed(5)}°</dd>
          <dd>Dec {formatSigned(system.astrometry.decDeg.value, 5)}°</dd>
        </div>
        <div>
          <dt>
            <DataHelpTerm
              id="constellation"
              label="Constellation from Earth"
              help="The official IAU sky region containing the system as viewed from Earth at the J2000 reference epoch. This is a direction on the sky, not a physical association."
            />
          </dt>
          <dd>
            {system.constellation.name} ({system.constellation.abbreviation})
          </dd>
          <dd>Official IAU sky region · {system.constellation.referenceFrame}</dd>
        </div>
        <div>
          <dt>
            <DataHelpTerm
              id="classification"
              label="Classification"
              help="The spectral type describes the star's temperature and spectrum. Multiplicity and component count indicate whether the catalog entry represents a single or multiple-star system."
            />
          </dt>
          <dd>{system.photometry.spectralType ?? 'Not available'}</dd>
          <dd>
            {system.multiplicity} · {system.componentCount} component
            {system.componentCount === 1 ? '' : 's'}
          </dd>
        </div>
        <div>
          <dt>
            <DataHelpTerm
              id="apparent-magnitude"
              label="Apparent magnitude"
              help="The star's observed brightness from Earth in Gaia's broad G band. Smaller and negative values are brighter; this is not the same as absolute magnitude."
            />
          </dt>
          <dd>
            {system.photometry.apparentMagnitudeG
              ? `${system.photometry.apparentMagnitudeG.value.toFixed(2)} (Gaia G)`
              : 'Not available'}
          </dd>
          <dd>Observed brightness from Earth · lower is brighter</dd>
          <dd>G−RP {system.photometry.gRpColorIndex?.value.toFixed(3) ?? 'Not available'}</dd>
        </div>
        <div>
          <dt>
            <DataHelpTerm
              id="physical-properties"
              label="Physical properties"
              help="Available estimates of effective surface temperature, radius, mass, and luminosity. Solar units compare each value with the Sun."
            />
          </dt>
          <dd>{formatOptional(system.stellarProperties.effectiveTemperatureK?.value, 'K', 0)}</dd>
          <dd>Radius {formatOptional(system.stellarProperties.radiusSolar?.value, 'R☉', 3)}</dd>
          <dd>Mass {formatOptional(system.stellarProperties.massSolar?.value, 'M☉', 3)}</dd>
          <dd>
            Luminosity {formatOptional(system.stellarProperties.luminositySolar?.value, 'L☉', 4)}
          </dd>
        </div>
        <div>
          <dt>
            <DataHelpTerm
              id="radial-velocity"
              label="Radial velocity"
              help="The system's measured motion toward or away from the Sun along our line of sight. Negative values indicate approach; positive values indicate recession."
            />
          </dt>
          <dd>
            {system.radialVelocityKmS
              ? `${formatSigned(system.radialVelocityKmS.value, 2)}${formatUncertainty(system.radialVelocityKmS.uncertainty)} km/s`
              : 'Not available'}
          </dd>
        </div>
        <div>
          <dt>
            <DataHelpTerm
              id="proper-motion"
              label="Proper motion"
              help="The system's apparent angular movement across the sky each year. The total combines its right-ascension and declination components and is measured in milliarcseconds per year."
            />
          </dt>
          <dd>{properMotionTotal.toFixed(1)} mas/yr total</dd>
          <dd>RA {formatSigned(system.astrometry.properMotionRaMasYr.value, 2)}</dd>
          <dd>Dec {formatSigned(system.astrometry.properMotionDecMasYr.value, 2)}</dd>
        </div>
        <div>
          <dt>
            <DataHelpTerm
              id="reference"
              label="Reference"
              help="Metadata describing the coordinate frame, observation epoch, and parallax measurement used for the system's position and derived distance."
            />
          </dt>
          <dd>{system.astrometry.coordinateFrame}</dd>
          <dd>Epoch J{system.astrometry.referenceEpochJYear}</dd>
          <dd>
            Parallax {system.astrometry.parallaxMas.value.toFixed(2)}
            {formatUncertainty(system.astrometry.parallaxMas.uncertainty)} mas
          </dd>
        </div>
      </dl>

      <section className="planet-section" aria-labelledby="planet-title">
        <div className="planet-heading">
          <p className="eyebrow">Confirmed snapshot</p>
          <h3 id="planet-title">Exoplanets · {system.confirmedPlanets.length}</h3>
        </div>
        {system.confirmedPlanets.length ? (
          <ul>
            {system.confirmedPlanets.map((planet) => (
              <li key={planet.name}>
                <div>
                  <strong>{planet.name}</strong>
                  <span>Host: {planet.hostName}</span>
                </div>
                <dl>
                  <div>
                    <dt>Discovery</dt>
                    <dd>
                      {planet.discoveryYear} · {planet.discoveryMethod}
                    </dd>
                  </div>
                  <div>
                    <dt>Period</dt>
                    <dd>{formatOptional(planet.orbitalPeriodDays ?? undefined, 'days')}</dd>
                  </div>
                  <div>
                    <dt>Orbit</dt>
                    <dd>{formatOptional(planet.semiMajorAxisAu ?? undefined, 'AU', 3)}</dd>
                  </div>
                  <div>
                    <dt>Mass / radius</dt>
                    <dd>
                      {planet.massEarth === null
                        ? 'Not available'
                        : `${planet.massEarth.toFixed(2)} M⊕`}{' '}
                      ·{' '}
                      {planet.radiusEarth === null
                        ? 'Not available'
                        : `${planet.radiusEarth.toFixed(2)} R⊕`}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="details-note">
            No confirmed planets in the 2026-11-11 NASA Exoplanet Archive snapshot. This is not
            proof that the system has no planets.
          </p>
        )}
      </section>

      <p className="details-note">
        Position basis: {system.positionBasis.replaceAll('-', ' ')}. Astrometry: CNS5. Confirmed
        planets and available host properties: NASA Exoplanet Archive PSCompPars snapshot
        2026-11-11. Missing values are not shown as zero.
      </p>
    </aside>
  );
}
