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
          <dt>Distance</dt>
          <dd>{system.distance.lightYear.toFixed(2)} ly</dd>
          <dd>{system.distance.parsec.toFixed(3)} pc</dd>
          <dd>± {system.distance.uncertaintyLightYear.toFixed(3)} ly</dd>
        </div>
        <div>
          <dt>Coordinates</dt>
          <dd>RA {system.astrometry.raDeg.value.toFixed(5)}°</dd>
          <dd>Dec {formatSigned(system.astrometry.decDeg.value, 5)}°</dd>
        </div>
        <div>
          <dt>Classification</dt>
          <dd>{system.photometry.spectralType ?? 'Not available'}</dd>
          <dd>
            {system.multiplicity} · {system.componentCount} component
            {system.componentCount === 1 ? '' : 's'}
          </dd>
        </div>
        <div>
          <dt>Photometry</dt>
          <dd>
            Gaia G {system.photometry.apparentMagnitudeG?.value.toFixed(2) ?? 'Not available'}
          </dd>
          <dd>G−RP {system.photometry.gRpColorIndex?.value.toFixed(3) ?? 'Not available'}</dd>
          <dd>
            Absolute G {system.photometry.absoluteMagnitudeG?.value.toFixed(2) ?? 'Not available'}
          </dd>
        </div>
        <div>
          <dt>Physical properties</dt>
          <dd>{formatOptional(system.stellarProperties.effectiveTemperatureK?.value, 'K', 0)}</dd>
          <dd>Radius {formatOptional(system.stellarProperties.radiusSolar?.value, 'R☉', 3)}</dd>
          <dd>Mass {formatOptional(system.stellarProperties.massSolar?.value, 'M☉', 3)}</dd>
          <dd>
            Luminosity {formatOptional(system.stellarProperties.luminositySolar?.value, 'L☉', 4)}
          </dd>
        </div>
        <div>
          <dt>Radial velocity</dt>
          <dd>
            {system.radialVelocityKmS
              ? `${formatSigned(system.radialVelocityKmS.value, 2)}${formatUncertainty(system.radialVelocityKmS.uncertainty)} km/s`
              : 'Not available'}
          </dd>
        </div>
        <div>
          <dt>Proper motion</dt>
          <dd>{properMotionTotal.toFixed(1)} mas/yr total</dd>
          <dd>RA {formatSigned(system.astrometry.properMotionRaMasYr.value, 2)}</dd>
          <dd>Dec {formatSigned(system.astrometry.properMotionDecMasYr.value, 2)}</dd>
        </div>
        <div>
          <dt>Reference</dt>
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
