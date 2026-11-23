export type CoordinateFormat = 'decimal-degrees' | 'hms-dms' | 'sexagesimal-colon';

export const COORDINATE_FORMATS: ReadonlyArray<Readonly<{ id: CoordinateFormat; label: string }>> =
  [
    { id: 'decimal-degrees', label: 'Decimal deg.' },
    { id: 'hms-dms', label: 'HMS / DMS' },
    { id: 'sexagesimal-colon', label: 'Colon sep.' },
  ];

type Sexagesimal = Readonly<{ major: number; minutes: number; seconds: number }>;

function sexagesimalParts(value: number): Sexagesimal {
  const totalCentiseconds = Math.round(Math.abs(value) * 360_000);
  return {
    major: Math.floor(totalCentiseconds / 360_000),
    minutes: Math.floor((totalCentiseconds % 360_000) / 6_000),
    seconds: (totalCentiseconds % 6_000) / 100,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function seconds(value: number): string {
  return value.toFixed(2).padStart(5, '0');
}

export function formatCoordinates(
  raDeg: number,
  decDeg: number,
  format: CoordinateFormat,
): Readonly<{ ra: string; dec: string; copy: string }> {
  if (format === 'decimal-degrees') {
    return {
      ra: `${raDeg.toFixed(5)}°`,
      dec: `${decDeg >= 0 ? '+' : ''}${decDeg.toFixed(5)}°`,
      copy: `${raDeg.toFixed(8)}, ${decDeg.toFixed(8)}`,
    };
  }

  const ra = sexagesimalParts((((raDeg % 360) + 360) % 360) / 15);
  const dec = sexagesimalParts(decDeg);
  const decSign = decDeg >= 0 ? '+' : '-';
  if (format === 'hms-dms') {
    const raText = `${pad(ra.major)}h ${pad(ra.minutes)}m ${seconds(ra.seconds)}s`;
    const decText = `${decSign}${pad(dec.major)}d ${pad(dec.minutes)}m ${seconds(dec.seconds)}s`;
    return { ra: raText, dec: decText, copy: `${raText}, ${decText}` };
  }

  const raText = `${pad(ra.major)}:${pad(ra.minutes)}:${seconds(ra.seconds)}`;
  const decText = `${decSign}${pad(dec.major)}:${pad(dec.minutes)}:${seconds(dec.seconds)}`;
  return { ra: raText, dec: decText, copy: `${raText}, ${decText}` };
}
